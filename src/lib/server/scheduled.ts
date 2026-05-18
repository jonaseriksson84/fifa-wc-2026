import { fetchFixtures, fetchFinishedResults } from './api-football';
import { matchPlaceholder, type PlaceholderRow } from './api-football/match-placeholder';
import { getStage } from '$lib/stage';
import type { DomainFixture } from './api-football/types';

const RESULT_POLLER_CRON = '*/5 * * * *';
const FIXTURE_REFRESHER_CRON = '0 8 * * *';
const MATCH_BUFFER_MS = 2.5 * 60 * 60 * 1000;

interface ScheduledEnv {
	DB: D1Database;
	API_FOOTBALL_KEY: string;
	__testFetchFixtures?: (opts: { apiKey: string }) => Promise<DomainFixture[]>;
}

export async function handleScheduled(event: ScheduledEvent, env: ScheduledEnv): Promise<void> {
	switch (event.cron) {
		case RESULT_POLLER_CRON:
			await pollResults(env);
			break;
		case FIXTURE_REFRESHER_CRON:
			await refreshFixtures(env);
			break;
		default:
			console.log(`Unknown cron pattern: ${event.cron}`);
	}
}

async function pollResults(env: ScheduledEnv): Promise<void> {
	const cutoff = new Date(Date.now() - MATCH_BUFFER_MS).toISOString();

	const { results: staleFixtures } = await env.DB.prepare(
		'SELECT api_football_id FROM fixture WHERE kickoff < ? AND result IS NULL'
	)
		.bind(cutoff)
		.all<{ api_football_id: number | null }>();

	if (staleFixtures.length === 0) {
		console.log('Result poller: no stale fixtures, skipping API call');
		return;
	}

	const apiFootballIds = staleFixtures
		.map((f) => f.api_football_id)
		.filter((id): id is number => id !== null);

	if (apiFootballIds.length === 0) {
		console.log('Result poller: no fixtures with api-football IDs');
		return;
	}

	console.log(`Result poller: checking ${apiFootballIds.length} fixtures`);

	const results = await fetchFinishedResults(apiFootballIds, { apiKey: env.API_FOOTBALL_KEY });

	if (results.length === 0) {
		console.log('Result poller: no finished results from API');
		return;
	}

	const now = new Date().toISOString();
	const batch = results.map((r) =>
		env.DB.prepare('UPDATE fixture SET result = ?, final_score = ?, updated_at = ? WHERE api_football_id = ?').bind(
			r.result,
			r.finalScore,
			now,
			r.apiFootballId
		)
	);
	await env.DB.batch(batch);

	console.log(`Result poller: wrote ${results.length} results`);
}

async function refreshFixtures(env: ScheduledEnv): Promise<void> {
	const fetch = env.__testFetchFixtures ?? fetchFixtures;
	const fixtures = await fetch({ apiKey: env.API_FOOTBALL_KEY });

	const groupFixtures: DomainFixture[] = [];
	const knockoutFixtures: DomainFixture[] = [];

	for (const f of fixtures) {
		if (getStage(f.stage).isKnockout) {
			knockoutFixtures.push(f);
		} else {
			groupFixtures.push(f);
		}
	}

	console.log(`Fixture refresher: ${groupFixtures.length} group, ${knockoutFixtures.length} knockout`);

	const now = new Date().toISOString();
	const batch: D1PreparedStatement[] = [];

	for (const f of groupFixtures) {
		batch.push(
			env.DB.prepare(
				`INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (api_football_id) DO UPDATE SET
         home_team = excluded.home_team,
         away_team = excluded.away_team,
         kickoff = excluded.kickoff,
         stage = excluded.stage,
         matchday = excluded.matchday,
         updated_at = CASE
           WHEN fixture.home_team != excluded.home_team
             OR fixture.away_team != excluded.away_team
             OR fixture.kickoff != excluded.kickoff
             OR fixture.stage != excluded.stage
             OR fixture.matchday IS NOT excluded.matchday
           THEN excluded.updated_at
           ELSE fixture.updated_at
         END`
			).bind(f.homeTeam, f.awayTeam, f.kickoff, f.stage, f.matchday, f.apiFootballId, now)
		);
	}

	if (knockoutFixtures.length > 0) {
		const { results: unresolvedRows } = await env.DB.prepare(
			`SELECT id, stage, kickoff, home_team, away_team FROM fixture WHERE stage != 'Group' AND api_football_id IS NULL`
		).all<{ id: number; stage: string; kickoff: string; home_team: string; away_team: string }>();

		const placeholders: PlaceholderRow[] = unresolvedRows.map((r) => ({
			id: r.id,
			stage: getStage(r.stage).name,
			kickoff: r.kickoff,
			homeTeam: r.home_team,
			awayTeam: r.away_team
		}));

		const { results: resolvedRows } = await env.DB.prepare(
			`SELECT api_football_id FROM fixture WHERE stage != 'Group' AND api_football_id IS NOT NULL`
		).all<{ api_football_id: number }>();

		const resolvedIds = new Set(resolvedRows.map((r) => r.api_football_id));

		for (const f of knockoutFixtures) {
			const matched = matchPlaceholder(f, placeholders);
			if (matched) {
				batch.push(
					env.DB.prepare(
						`UPDATE fixture SET home_team = ?, away_team = ?, api_football_id = ?, updated_at = ? WHERE id = ?`
					).bind(f.homeTeam, f.awayTeam, f.apiFootballId, now, matched.id)
				);
			} else if (resolvedIds.has(f.apiFootballId)) {
				batch.push(
					env.DB.prepare(
						`UPDATE fixture SET home_team = ?, away_team = ?, kickoff = ?, stage = ?, updated_at = ? WHERE api_football_id = ?`
					).bind(f.homeTeam, f.awayTeam, f.kickoff, f.stage, now, f.apiFootballId)
				);
			} else {
				console.warn(
					`Fixture refresher: no placeholder match for knockout fixture — stage=${f.stage}, kickoff=${f.kickoff}, teams=${f.homeTeam} vs ${f.awayTeam}`
				);
			}
		}
	}

	if (batch.length > 0) {
		await env.DB.batch(batch);
	}

	console.log('Fixture refresher: done');
}
