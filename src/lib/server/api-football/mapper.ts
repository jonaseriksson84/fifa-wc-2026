import type { ApiFixtureResponse, DomainFixture, DomainResult, Stage, Result } from './types';

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

const ROUND_MAP: Record<string, Stage> = {
	'Round of 32': 'R32',
	'Round of 16': 'R16',
	'Quarter-finals': 'QF',
	'Semi-finals': 'SF',
	'3rd Place': '3rd-place',
	Final: 'Final'
};

export function parseRound(round: string): Stage {
	if (round.startsWith('Group')) return 'Group';
	const mapped = ROUND_MAP[round];
	if (!mapped) throw new Error(`Unknown round: ${round}`);
	return mapped;
}

export function isKnockout(stage: Stage): boolean {
	return stage !== 'Group';
}

export function deriveResult(entry: ApiFixtureResponse): Result | null {
	if (!FINISHED_STATUSES.has(entry.fixture.status.short)) return null;

	const stage = parseRound(entry.league.round);

	if (!isKnockout(stage)) {
		const home = entry.goals.home!;
		const away = entry.goals.away!;
		if (home > away) return 'HOME';
		if (home < away) return 'AWAY';
		return 'DRAW';
	}

	if (entry.fixture.status.short === 'PEN') {
		const penHome = entry.score.penalty.home!;
		const penAway = entry.score.penalty.away!;
		return penHome > penAway ? 'HOME' : 'AWAY';
	}

	if (entry.fixture.status.short === 'AET') {
		const etHome = (entry.score.fulltime.home ?? 0) + (entry.score.extratime.home ?? 0);
		const etAway = (entry.score.fulltime.away ?? 0) + (entry.score.extratime.away ?? 0);
		return etHome > etAway ? 'HOME' : 'AWAY';
	}

	const home = entry.goals.home!;
	const away = entry.goals.away!;
	return home > away ? 'HOME' : 'AWAY';
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
