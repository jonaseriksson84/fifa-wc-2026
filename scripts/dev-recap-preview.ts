// Preview the Recap locally against a fresh snapshot of production pool data.
//
// Run via: npm run dev:recap-preview -- [friends|work]   (default: friends)
//
// What it does:
//   1. Exports a fresh REMOTE D1 snapshot (schema + data) of the chosen pool
//      (friends or work) using `wrangler d1 export --remote`.
//   2. Loads it into the LOCAL D1, replacing local state, so you get the real
//      users / picks / fixtures for that pool.
//   3. Settles every still-unresolved Fixture — INCLUDING the Final — with a
//      fabricated Result + final_score and a kickoff shifted into the past.
//      Draining everything (vs. the fast-forward script's one-per-stage) opens
//      the availability gate so the full Recap renders locally.
//
// Re-runnable: run it again as real rounds settle to pull fresher data. The
// gate stays local-only — production remains gated until its real Final lands.
//
// Requires `wrangler login` (or CLOUDFLARE_API_TOKEN) with access to the pool's
// remote D1. Nothing here touches remote data — the export is read-only and the
// settle step writes to the LOCAL database only.

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LOCAL_DB = 'fifa-wc-2026';
// Local D1 (miniflare) state lives here — a plain SQLite file per database.
// The remote export is a full dump with bare `CREATE TABLE`/`CREATE INDEX`
// (no IF NOT EXISTS), so it can only load into an empty database — a second
// run would otherwise die on "table d1_migrations already exists". Removing
// this dir is how we actually "replace local state"; wrangler recreates it on
// the next `d1 execute --local`.
const LOCAL_D1_STATE = resolve(__dirname, '..', '.wrangler', 'state', 'v3', 'd1');
const REMOTE_DB: Record<string, string> = {
	friends: 'fifa-wc-2026-friends',
	work: 'fifa-wc-2026-work'
};

type FixtureRow = { id: number; stage: string };
type PickValue = 'HOME' | 'AWAY' | 'DRAW';

function run(cmd: string, opts: { capture?: boolean } = {}): string {
	if (opts.capture) {
		return execSync(cmd, { encoding: 'utf8' });
	}
	execSync(cmd, { stdio: 'inherit' });
	return '';
}

// Load the remote dump into the freshly-reset local D1.
//
// The export lists tables in sqlite_master order, so the child tables
// (account/session/pick, each with a FOREIGN KEY → user) are created and
// populated *before* the `user` table exists. The dump's leading
// `PRAGMA defer_foreign_keys=TRUE` makes that work on remote D1, but wrangler's
// local `d1 execute --file` runs each statement in isolation, so the deferral
// is lost and the first `INSERT INTO account` dies with
// "no such table: main.user". Restoring the dump through a single SQLite
// connection with FK enforcement off — the canonical way to load a dump —
// sidesteps the ordering problem entirely. The local D1 is just a plain SQLite
// file, so we open it directly (Node's built-in node:sqlite) after wrangler
// has recreated the empty database file.
function loadSnapshotIntoLocalD1(sqlPath: string): void {
	const objectsDir = resolve(LOCAL_D1_STATE, 'miniflare-D1DatabaseObject');
	const dbFile = readdirSync(objectsDir).find(
		(f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite'
	);
	if (!dbFile) {
		throw new Error(`Could not find the local D1 SQLite file in ${objectsDir}`);
	}
	const db = new DatabaseSync(resolve(objectsDir, dbFile));
	try {
		db.exec('PRAGMA foreign_keys=OFF;');
		db.exec(readFileSync(sqlPath, 'utf8'));
	} finally {
		db.close();
	}
}

// Deterministic fabricated result seeded by fixture id — knockouts never DRAW.
function fabricateResult(f: FixtureRow): PickValue {
	if (f.stage !== 'Group') {
		return f.id % 2 === 0 ? 'HOME' : 'AWAY';
	}
	const r = f.id % 3;
	return r === 0 ? 'HOME' : r === 1 ? 'AWAY' : 'DRAW';
}

function fabricateScore(f: FixtureRow, result: PickValue): string {
	if (f.stage === 'Group') {
		if (result === 'HOME') return '2-1';
		if (result === 'AWAY') return '0-3';
		return '1-1';
	}
	const variant = f.id % 3;
	if (variant === 0) return result === 'HOME' ? '2-1' : '1-2';
	if (variant === 1) return result === 'HOME' ? '2-1 a.e.t.' : '1-2 a.e.t.';
	return result === 'HOME' ? '2-2 (5-3 pen.)' : '2-2 (3-5 pen.)';
}

function main() {
	const pool = (process.argv[2] ?? 'friends').toLowerCase();
	const remote = REMOTE_DB[pool];
	if (!remote) {
		console.error(`Unknown pool "${pool}". Use "friends" or "work".`);
		process.exit(1);
	}

	const snapshotPath = resolve(__dirname, `recap-snapshot-${pool}.sql`);

	console.log(`Exporting remote snapshot of "${remote}"...`);
	run(`npx wrangler d1 export ${remote} --remote --output=${snapshotPath}`);

	console.log('Resetting local D1 state...');
	rmSync(LOCAL_D1_STATE, { recursive: true, force: true });
	// Recreate the empty local D1 file at the path wrangler expects before we
	// open it directly to load the dump.
	run(`npx wrangler d1 execute ${LOCAL_DB} --local --command "SELECT 1"`);

	console.log('Loading snapshot into local D1 (replacing local state)...');
	loadSnapshotIntoLocalD1(snapshotPath);
	unlinkSync(snapshotPath);

	console.log('Reading unresolved fixtures...');
	const out = run(
		`npx wrangler d1 execute ${LOCAL_DB} --local --json ` +
			`--command "SELECT id, stage FROM fixture WHERE result IS NULL"`,
		{ capture: true }
	);
	const unresolved = JSON.parse(out)[0].results as FixtureRow[];
	console.log(`Found ${unresolved.length} unresolved fixtures — settling all (incl. the Final).`);

	if (unresolved.length > 0) {
		const now = new Date().toISOString();
		const statements = unresolved.map((f, i) => {
			const result = fabricateResult(f);
			const score = fabricateScore(f, result);
			// Stagger kickoffs into the past so they read as locked-and-played.
			const hoursAgo = unresolved.length - i + 1;
			return (
				`UPDATE fixture SET ` +
				`result = '${result}', ` +
				`final_score = '${score}', ` +
				`kickoff = datetime('now', '-${hoursAgo} hour'), ` +
				`updated_at = '${now}' ` +
				`WHERE id = ${f.id};`
			);
		});
		const settlePath = resolve(__dirname, `recap-settle-${pool}.sql`);
		writeFileSync(settlePath, statements.join('\n') + '\n');
		try {
			run(`npx wrangler d1 execute ${LOCAL_DB} --local --file=${settlePath}`);
		} finally {
			unlinkSync(settlePath);
		}
	}

	console.log(
		`\nDone. Pool "${pool}" snapshot loaded and fully settled locally.\n` +
			'Run `npm run dev` and visit http://localhost:5173/recap — the gate is open.'
	);
}

main();
