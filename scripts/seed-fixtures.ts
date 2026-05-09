import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchFixtures } from '../src/lib/server/api-football/client';

const __dirname = dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.API_FOOTBALL_KEY;
if (!apiKey) {
	console.error('API_FOOTBALL_KEY environment variable is required');
	process.exit(1);
}

function escapeSQL(value: string): string {
	return value.replace(/'/g, "''");
}

async function main() {
	console.log('Fetching WC 2026 fixtures from api-football...');
	const fixtures = await fetchFixtures({ apiKey });
	console.log(`Received ${fixtures.length} fixtures`);

	const statements = fixtures.map((f) => {
		const homeTeam = escapeSQL(f.homeTeam);
		const awayTeam = escapeSQL(f.awayTeam);
		const kickoff = escapeSQL(f.kickoff);
		const stage = escapeSQL(f.stage);
		const now = new Date().toISOString();

		return [
			`INSERT INTO fixture (home_team, away_team, kickoff, stage, api_football_id, updated_at)`,
			`VALUES ('${homeTeam}', '${awayTeam}', '${kickoff}', '${stage}', ${f.apiFootballId}, '${now}')`,
			`ON CONFLICT (api_football_id) DO UPDATE SET`,
			`  home_team = '${homeTeam}',`,
			`  away_team = '${awayTeam}',`,
			`  kickoff = '${kickoff}',`,
			`  stage = '${stage}',`,
			`  updated_at = '${now}';`
		].join('\n');
	});

	const sql = statements.join('\n\n');
	const outPath = resolve(__dirname, 'seed-fixtures.sql');
	writeFileSync(outPath, sql + '\n');
	console.log(`Wrote ${fixtures.length} upsert statements to ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
