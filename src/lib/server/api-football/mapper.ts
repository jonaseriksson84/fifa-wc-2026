import type { ApiFixtureResponse, DomainFixture, DomainResult, Stage, Result } from './types';
import { formatFinalScore, type ScoreShape } from '$lib/final-score';

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

// Group-stage matchday. api-football's round string for group fixtures has
// the shape "Group <letter> - <N>" (e.g. "Group A - 1"), where N is the
// matchday. Returns null for non-group rounds.
export function parseMatchday(round: string): number | null {
	if (!round.startsWith('Group')) return null;
	const match = round.match(/-\s*(\d+)\s*$/);
	return match ? parseInt(match[1]!, 10) : null;
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
		stage: parseRound(entry.league.round),
		matchday: parseMatchday(entry.league.round)
	};
}

export function deriveScoreShape(entry: ApiFixtureResponse): ScoreShape | null {
	if (!FINISHED_STATUSES.has(entry.fixture.status.short)) return null;

	const s = entry.score;
	const ft: [number, number] = [s.fulltime.home!, s.fulltime.away!];

	if (s.penalty.home !== null && s.penalty.away !== null) {
		return { ft, et: null, pens: [s.penalty.home, s.penalty.away] };
	}

	if (s.extratime.home !== null && s.extratime.away !== null) {
		const etTotal: [number, number] = [
			s.fulltime.home! + s.extratime.home,
			s.fulltime.away! + s.extratime.away
		];
		return { ft, et: etTotal, pens: null };
	}

	return { ft, et: null, pens: null };
}

export function mapResult(entry: ApiFixtureResponse): DomainResult | null {
	const result = deriveResult(entry);
	if (result === null) return null;
	return {
		apiFootballId: entry.fixture.id,
		result,
		finalScore: formatFinalScore(deriveScoreShape(entry))
	};
}
