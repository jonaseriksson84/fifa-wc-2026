import type { ApiFixtureResponse, DomainFixture, DomainResult, Stage, Result } from './types';

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

const ROUND_MAP: Record<string, Stage> = {
	'Round of 32': 'R32',
	'Round of 16': 'R16',
	'Quarter-finals': 'QF',
	'Semi-finals': 'SF',
	'3rd Place': '3rd-place',
	'3rd Place Final': '3rd-place',
	Final: 'Final'
};

export function parseRound(round: string): Stage {
	if (round.startsWith('Group')) return 'Group';
	const mapped = ROUND_MAP[round];
	if (!mapped) throw new Error(`Unknown round: ${round}`);
	return mapped;
}

export function deriveResult(entry: ApiFixtureResponse): Result | null {
	if (!FINISHED_STATUSES.has(entry.fixture.status.short)) return null;

	const stage = parseRound(entry.league.round);

	if (stage === 'Group') {
		const home = entry.goals.home!;
		const away = entry.goals.away!;
		if (home > away) return 'HOME';
		if (home < away) return 'AWAY';
		return 'DRAW';
	}

	return entry.teams.home.winner ? 'HOME' : 'AWAY';
}

export function mapFixture(entry: ApiFixtureResponse): DomainFixture {
	return {
		apiFootballId: entry.fixture.id,
		homeTeam: entry.teams.home.name,
		awayTeam: entry.teams.away.name,
		kickoff: new Date(entry.fixture.date).toISOString(),
		stage: parseRound(entry.league.round)
	};
}

export function mapResult(entry: ApiFixtureResponse): DomainResult | null {
	const result = deriveResult(entry);
	if (result === null) return null;
	return {
		apiFootballId: entry.fixture.id,
		result
	};
}
