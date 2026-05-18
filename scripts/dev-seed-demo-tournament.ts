// Seed local D1 with a fully-played tournament: 5 fake users, every fixture
// resolved, picks for every (user, fixture) combination. Goal: see what the
// app looks like at the end of the World Cup — leaderboard populated, every
// sticker filled across every foil tier.
//
// Run via: npm run dev:demo
//
// Prerequisites: db:migrate has been applied, seed:fixtures has pulled the
// 72 group fixtures. dev:reset is recommended right before this so knockout
// placeholder labels and kickoffs are at their migration shape.
//
// What it does:
//   1. Reads every fixture from local D1 (id, stage, kickoff, home_team, away_team).
//   2. Knockouts (R32 onwards) get concrete team substitutions: 32 real WC
//      teams seed the R32 slots in chronological order; winners propagate
//      through the bracket deterministically.
//   3. Every fixture gets result + final_score + a kickoff shifted into the
//      past, so the lock-time gate considers them locked.
//   4. Inserts 5 fake users with varied "skill" (alice perfect, eve worst)
//      so the leaderboard shows a real spread.
//   5. Inserts a pick for every (user, fixture) using their skill profile.

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WC_TEAMS } from '../src/lib/wc-teams';

const __dirname = dirname(fileURLToPath(import.meta.url));

type FixtureRow = {
	id: number;
	stage: string;
	kickoff: string;
	home_team: string;
	away_team: string;
};

type PickValue = 'HOME' | 'AWAY' | 'DRAW';

function runWrangler(args: string[]): string {
	return execSync(`npx wrangler ${args.join(' ')}`, { encoding: 'utf8' });
}

function queryFixtures(): FixtureRow[] {
	const out = runWrangler([
		'd1',
		'execute',
		'fifa-wc-2026',
		'--local',
		'--json',
		'--command',
		'"SELECT id, stage, kickoff, home_team, away_team FROM fixture ORDER BY stage, kickoff"'
	]);
	const parsed = JSON.parse(out);
	return parsed[0].results as FixtureRow[];
}

function escapeSQL(value: string): string {
	return value.replace(/'/g, "''");
}

// Cycle through HOME/AWAY/DRAW for groups, HOME/AWAY for knockouts, seeded by fixture id
// so results are deterministic.
function pickResult(fixture: FixtureRow): PickValue {
	const isKnockout = fixture.stage !== 'Group';
	if (isKnockout) {
		return fixture.id % 2 === 0 ? 'HOME' : 'AWAY';
	}
	const r = fixture.id % 3;
	return r === 0 ? 'HOME' : r === 1 ? 'AWAY' : 'DRAW';
}

// Final score varies so ResultStamp renders regulation / a.e.t. / penalties.
function pickFinalScore(fixture: FixtureRow, result: PickValue): string {
	if (fixture.stage === 'Group') {
		if (result === 'HOME') return '2-1';
		if (result === 'AWAY') return '0-3';
		return '1-1';
	}
	// Knockouts: rotate through regulation, a.e.t., penalties for variety.
	const variant = fixture.id % 3;
	if (variant === 0) return result === 'HOME' ? '2-1' : '1-2';
	if (variant === 1) return result === 'HOME' ? '2-1 a.e.t.' : '1-2 a.e.t.';
	return result === 'HOME' ? '2-2 (5-3 pen.)' : '2-2 (3-5 pen.)';
}

// Pick the next team from a rotating list that hasn't already been used.
function takeNext(pool: string[], used: Set<string>): string {
	for (const t of pool) {
		if (!used.has(t)) {
			used.add(t);
			return t;
		}
	}
	throw new Error('Ran out of teams');
}

// Build the bracket: assign concrete teams to every knockout fixture by
// reading R32 slots in chronological order, deciding winners by `pickResult`,
// and propagating the winners through R16 → QF → SF → Final + 3rd-place.
function resolveBracket(fixtures: FixtureRow[]): Map<number, { home: string; away: string }> {
	const teamsList = [...WC_TEAMS];
	const used = new Set<string>();
	const assignments = new Map<number, { home: string; away: string }>();

	const r32 = fixtures.filter((f) => f.stage === 'R32').sort((a, b) => a.kickoff.localeCompare(b.kickoff));
	const r16 = fixtures.filter((f) => f.stage === 'R16').sort((a, b) => a.kickoff.localeCompare(b.kickoff));
	const qf = fixtures.filter((f) => f.stage === 'QF').sort((a, b) => a.kickoff.localeCompare(b.kickoff));
	const sf = fixtures.filter((f) => f.stage === 'SF').sort((a, b) => a.kickoff.localeCompare(b.kickoff));
	const thirdPlace = fixtures.filter((f) => f.stage === '3rd-place');
	const final = fixtures.filter((f) => f.stage === 'Final');

	// Assign 32 unique teams to R32.
	for (const f of r32) {
		assignments.set(f.id, {
			home: takeNext(teamsList, used),
			away: takeNext(teamsList, used)
		});
	}

	// Winner/loser of a fixture by id, given its current assignments.
	const winnerOf = (id: number): string => {
		const a = assignments.get(id)!;
		const f = fixtures.find((x) => x.id === id)!;
		return pickResult(f) === 'HOME' ? a.home : a.away;
	};
	const loserOf = (id: number): string => {
		const a = assignments.get(id)!;
		const f = fixtures.find((x) => x.id === id)!;
		return pickResult(f) === 'HOME' ? a.away : a.home;
	};

	// Build a lookup from placeholder label → fixture id, for each knockout stage.
	const labelToId = new Map<string, number>(); // e.g. 'R32.01' → 281
	const stages: { rows: FixtureRow[]; prefix: string }[] = [
		{ rows: r32, prefix: 'R32' },
		{ rows: r16, prefix: 'R16' },
		{ rows: qf, prefix: 'QF' },
		{ rows: sf, prefix: 'SF' }
	];
	for (const { rows, prefix } of stages) {
		rows.forEach((f, i) => {
			const id = `${prefix}.${String(i + 1).padStart(2, '0')}`;
			labelToId.set(id, f.id);
		});
	}

	// Resolve teams referenced by a placeholder string like 'Winner R32.01' or 'Loser SF.02'.
	const resolveLabel = (label: string): string => {
		const m = label.match(/^(Winner|Loser) (R32|R16|QF|SF)\.(\d{2})$/);
		if (!m) throw new Error(`Unrecognised knockout placeholder: ${label}`);
		const [, role, prefix, idx] = m;
		const fixtureId = labelToId.get(`${prefix}.${idx}`);
		if (fixtureId === undefined) throw new Error(`Could not resolve ${prefix}.${idx}`);
		return role === 'Winner' ? winnerOf(fixtureId) : loserOf(fixtureId);
	};

	// Propagate through R16, QF, SF.
	for (const f of [...r16, ...qf, ...sf]) {
		assignments.set(f.id, {
			home: resolveLabel(f.home_team),
			away: resolveLabel(f.away_team)
		});
	}

	// 3rd-place + Final reference SF.
	for (const f of [...thirdPlace, ...final]) {
		assignments.set(f.id, {
			home: resolveLabel(f.home_team),
			away: resolveLabel(f.away_team)
		});
	}

	return assignments;
}

type FakeUser = { id: string; name: string; email: string; skill: number };

const FAKE_USERS: FakeUser[] = [
	{ id: 'demo-alice', name: 'Alice', email: 'demo-alice@local.test', skill: 1.0 },
	{ id: 'demo-bob', name: 'Bob', email: 'demo-bob@local.test', skill: 0.75 },
	{ id: 'demo-carol', name: 'Carol', email: 'demo-carol@local.test', skill: 0.5 },
	{ id: 'demo-dave', name: 'Dave', email: 'demo-dave@local.test', skill: 0.3 },
	{ id: 'demo-eve', name: 'Eve', email: 'demo-eve@local.test', skill: 0.15 }
];

// Deterministic pick per (user, fixture): correct with probability = skill,
// otherwise rotate to a wrong but valid value.
function pickForUser(user: FakeUser, fixture: FixtureRow, result: PickValue, userIndex: number): PickValue {
	// LCG-ish: deterministic pseudo-random in [0, 1).
	const r = ((userIndex * 1009 + fixture.id * 31) % 100) / 100;
	const isKnockout = fixture.stage !== 'Group';
	const allValues: PickValue[] = isKnockout ? ['HOME', 'AWAY'] : ['HOME', 'DRAW', 'AWAY'];

	if (r < user.skill) return result;

	const wrong = allValues.filter((v) => v !== result);
	return wrong[fixture.id % wrong.length];
}

function buildSQL(fixtures: FixtureRow[], assignments: Map<number, { home: string; away: string }>): string {
	const statements: string[] = [];
	const now = new Date().toISOString();

	// 1. Wipe any prior demo state.
	statements.push('DELETE FROM pick;');
	statements.push('DELETE FROM session;');
	statements.push('DELETE FROM verification;');
	statements.push('DELETE FROM account;');
	statements.push('DELETE FROM user;');

	// 2. Update every fixture: teams (for knockouts), result, final_score, kickoff in the past.
	fixtures.forEach((f, i) => {
		const result = pickResult(f);
		const finalScore = pickFinalScore(f, result);
		const homeTeam = assignments.get(f.id)?.home ?? f.home_team;
		const awayTeam = assignments.get(f.id)?.away ?? f.away_team;
		// Stagger kickoffs into the past so they sort sensibly.
		const hoursAgo = fixtures.length - i + 1;
		statements.push(
			`UPDATE fixture SET ` +
				`home_team = '${escapeSQL(homeTeam)}', ` +
				`away_team = '${escapeSQL(awayTeam)}', ` +
				`result = '${result}', ` +
				`final_score = '${escapeSQL(finalScore)}', ` +
				`kickoff = datetime('now', '-${hoursAgo} hour'), ` +
				`updated_at = '${now}' ` +
				`WHERE id = ${f.id};`
		);
	});

	// 3. Insert fake users (timestamps in seconds since epoch — schema uses mode: 'timestamp').
	const nowSec = Math.floor(Date.now() / 1000);
	for (const u of FAKE_USERS) {
		statements.push(
			`INSERT INTO user (id, name, email, email_verified, display_name, created_at, updated_at) ` +
				`VALUES ('${u.id}', '${escapeSQL(u.name)}', '${escapeSQL(u.email)}', 1, '${escapeSQL(u.name)}', ${nowSec}, ${nowSec});`
		);
	}

	// 4. Picks: every (user, fixture).
	FAKE_USERS.forEach((u, userIndex) => {
		for (const f of fixtures) {
			const result = pickResult(f);
			const value = pickForUser(u, f, result, userIndex);
			statements.push(
				`INSERT INTO pick (user_id, fixture_id, value, updated_at) ` +
					`VALUES ('${u.id}', ${f.id}, '${value}', '${now}');`
			);
		}
	});

	return statements.join('\n');
}

function main() {
	console.log('Reading fixtures from local D1...');
	const fixtures = queryFixtures();
	console.log(`Found ${fixtures.length} fixtures.`);
	if (fixtures.length === 0) {
		console.error('No fixtures found. Run `npm run db:migrate && npm run seed:fixtures` first.');
		process.exit(1);
	}

	console.log('Resolving bracket...');
	const assignments = resolveBracket(fixtures);

	console.log('Building SQL...');
	const sql = buildSQL(fixtures, assignments);
	const sqlPath = resolve(__dirname, 'dev-seed-demo-tournament.sql');
	writeFileSync(sqlPath, sql + '\n');

	console.log('Applying SQL to local D1...');
	try {
		execSync(`npx wrangler d1 execute fifa-wc-2026 --local --file=${sqlPath}`, { stdio: 'inherit' });
	} finally {
		unlinkSync(sqlPath);
	}

	console.log(`\nDone. ${FAKE_USERS.length} users seeded, ${fixtures.length} fixtures resolved, ${FAKE_USERS.length * fixtures.length} picks inserted.`);
	console.log('Visit http://localhost:5173 — every sticker should be filled, leaderboard populated.');
}

main();
