/**
 * Verify the api-football result derivation against real WC 2022 data.
 *
 * Strategy:
 *   1. Fetch every WC 2022 fixture from api-football (one request, returns ~64 fixtures).
 *   2. Run each through our `mapResult` function — the same code the cron poller uses.
 *   3. Cross-check against:
 *      a. Self-consistency: the derived domain result should agree with the raw
 *         goal comparison (groups) or `teams.home.winner` flag (knockouts).
 *      b. Known truth: the 5 WC 2022 knockouts decided on penalties — our
 *         derivation must pick the actual advancer, not the 90-minute leader.
 *
 * Usage:
 *   set -a && source .dev.vars && set +a
 *   npx tsx scripts/verify-results.ts
 */
import { mapResult } from '../src/lib/server/api-football/mapper';
import type { ApiFixtureResponse, DomainResult } from '../src/lib/server/api-football/types';

const apiKey = process.env.API_FOOTBALL_KEY;
if (!apiKey) {
	console.error('API_FOOTBALL_KEY required (source .dev.vars first)');
	process.exit(1);
}

// WC 2022 knockouts that went to penalties. Source: official FIFA records.
// Each entry: home/away team names as api-football labels them, plus the
// team that actually advanced.
const PENALTY_CASES: { home: string; away: string; advanced: 'HOME' | 'AWAY' }[] = [
	{ home: 'Croatia', away: 'Japan', advanced: 'HOME' }, // R16
	{ home: 'Spain', away: 'Morocco', advanced: 'AWAY' }, // R16, Morocco won
	{ home: 'Netherlands', away: 'Argentina', advanced: 'AWAY' }, // QF, Argentina won
	{ home: 'Croatia', away: 'Brazil', advanced: 'HOME' }, // QF
	{ home: 'Argentina', away: 'France', advanced: 'HOME' } // Final
];

async function main() {
	console.log('Fetching all WC 2022 fixtures from api-football...');
	const res = await fetch(
		'https://v3.football.api-sports.io/fixtures?league=1&season=2022',
		{
			headers: {
				'x-rapidapi-key': apiKey,
				'x-rapidapi-host': 'v3.football.api-sports.io'
			}
		}
	);
	if (!res.ok) {
		console.error(`api-football request failed: ${res.status} ${res.statusText}`);
		process.exit(1);
	}

	const data = (await res.json()) as { response: ApiFixtureResponse[] };
	const fixtures = data.response;
	console.log(`Received ${fixtures.length} fixtures\n`);

	const finished = fixtures.filter((f) =>
		['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
	);
	console.log(`${finished.length} finished, ${fixtures.length - finished.length} not played\n`);

	let derivationOk = 0;
	let derivationFail = 0;
	let consistencyFail = 0;
	let penaltyOk = 0;
	let penaltyFail = 0;
	const failures: string[] = [];

	for (const entry of finished) {
		const round = entry.league.round;
		const isGroup = round.startsWith('Group');
		const stageLabel = round.padEnd(20);
		const home = entry.teams.home.name;
		const away = entry.teams.away.name;
		const matchLabel = `${home} vs ${away}`.padEnd(36);

		// (1) Run our mapper. If it throws, count as derivation fail.
		let derived: DomainResult | null;
		try {
			derived = mapResult(entry);
		} catch (e) {
			derivationFail++;
			failures.push(`THROW: ${stageLabel} ${matchLabel} → ${(e as Error).message}`);
			continue;
		}
		if (derived === null) {
			derivationFail++;
			failures.push(`NULL:  ${stageLabel} ${matchLabel} (status was ${entry.fixture.status.short})`);
			continue;
		}
		derivationOk++;

		// (2) Self-consistency check.
		const goalsHome = entry.goals.home!;
		const goalsAway = entry.goals.away!;
		let expected: 'HOME' | 'DRAW' | 'AWAY';
		if (isGroup) {
			if (goalsHome > goalsAway) expected = 'HOME';
			else if (goalsHome < goalsAway) expected = 'AWAY';
			else expected = 'DRAW';
		} else {
			expected = entry.teams.home.winner ? 'HOME' : 'AWAY';
		}

		if (derived.result !== expected) {
			consistencyFail++;
			failures.push(
				`MISMATCH: ${stageLabel} ${matchLabel} expected=${expected} derived=${derived.result} ` +
					`(goals ${goalsHome}-${goalsAway}, winner home=${entry.teams.home.winner})`
			);
		}
	}

	// (3) Penalty cases: hardcoded ground truth.
	console.log('Penalty knockouts (5 total):');
	for (const pc of PENALTY_CASES) {
		const entry = finished.find(
			(f) =>
				(f.teams.home.name === pc.home && f.teams.away.name === pc.away) ||
				(f.teams.home.name === pc.away && f.teams.away.name === pc.home)
		);
		if (!entry) {
			penaltyFail++;
			failures.push(`PENALTY: ${pc.home} vs ${pc.away} not found in API response`);
			continue;
		}

		const homesSwapped = entry.teams.home.name !== pc.home;
		const expected: 'HOME' | 'AWAY' = homesSwapped
			? pc.advanced === 'HOME' ? 'AWAY' : 'HOME'
			: pc.advanced;

		const derived = mapResult(entry);
		const ok = derived?.result === expected;
		const status = ok ? 'OK ' : 'FAIL';
		console.log(
			`  [${status}] ${entry.teams.home.name} vs ${entry.teams.away.name} ` +
				`status=${entry.fixture.status.short} ` +
				`90min=${entry.goals.home}-${entry.goals.away} ` +
				`derived=${derived?.result} expected=${expected}`
		);
		if (ok) penaltyOk++;
		else penaltyFail++;
	}

	console.log('\n--- Summary ---');
	console.log(`Derivation succeeded:   ${derivationOk}/${finished.length}`);
	console.log(`Derivation failed:      ${derivationFail}`);
	console.log(`Self-consistency fails: ${consistencyFail}`);
	console.log(`Penalty cases correct:  ${penaltyOk}/${PENALTY_CASES.length}`);
	if (failures.length) {
		console.log('\nDetails:');
		for (const f of failures) console.log(`  ${f}`);
	}

	const allOk =
		derivationFail === 0 &&
		consistencyFail === 0 &&
		penaltyOk === PENALTY_CASES.length;
	console.log(`\n${allOk ? '✅ All checks passed' : '❌ Issues found'}`);
	process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
