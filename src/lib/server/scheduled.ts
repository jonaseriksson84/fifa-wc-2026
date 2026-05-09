import { fetchFixtures, fetchFinishedResults } from './api-football';

const RESULT_POLLER_CRON = '*/5 * * * *';
const FIXTURE_REFRESHER_CRON = '0 8 * * *';
const MATCH_BUFFER_MS = 2.5 * 60 * 60 * 1000;

interface ScheduledEnv {
	DB: D1Database;
	API_FOOTBALL_KEY: string;
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
		env.DB.prepare('UPDATE fixture SET result = ?, updated_at = ? WHERE api_football_id = ?').bind(
			r.result,
			now,
			r.apiFootballId
		)
	);
	await env.DB.batch(batch);

	console.log(`Result poller: wrote ${results.length} results`);
}

async function refreshFixtures(env: ScheduledEnv): Promise<void> {
	const fixtures = await fetchFixtures({ apiKey: env.API_FOOTBALL_KEY });

	console.log(`Fixture refresher: upserting ${fixtures.length} fixtures`);

	const now = new Date().toISOString();
	const batch = fixtures.map((f) =>
		env.DB.prepare(
			`INSERT INTO fixture (home_team, away_team, kickoff, stage, api_football_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (api_football_id) DO UPDATE SET
         home_team = excluded.home_team,
         away_team = excluded.away_team,
         kickoff = excluded.kickoff,
         stage = excluded.stage,
         updated_at = CASE
           WHEN fixture.home_team != excluded.home_team
             OR fixture.away_team != excluded.away_team
             OR fixture.kickoff != excluded.kickoff
             OR fixture.stage != excluded.stage
           THEN excluded.updated_at
           ELSE fixture.updated_at
         END`
		).bind(f.homeTeam, f.awayTeam, f.kickoff, f.stage, f.apiFootballId, now)
	);
	await env.DB.batch(batch);

	console.log('Fixture refresher: done');
}
