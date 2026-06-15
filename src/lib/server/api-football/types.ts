import type { Stage } from '$lib/stage';
export type { Stage };
export type Result = 'HOME' | 'DRAW' | 'AWAY';

export interface DomainFixture {
	apiFootballId: number;
	homeTeam: string;
	awayTeam: string;
	kickoff: string;
	stage: Stage;
	matchday: number | null;
}

export interface DomainResult {
	apiFootballId: number;
	result: Result;
	finalScore: string;
}

export interface ApiFixtureResponse {
	fixture: {
		id: number;
		date: string;
		status: {
			short: string;
			long: string;
		};
	};
	league: {
		id: number;
		name: string;
		round: string;
	};
	teams: {
		home: { id: number; name: string; winner: boolean | null };
		away: { id: number; name: string; winner: boolean | null };
	};
	goals: {
		home: number | null;
		away: number | null;
	};
	score: {
		halftime: { home: number | null; away: number | null };
		fulltime: { home: number | null; away: number | null };
		extratime: { home: number | null; away: number | null };
		penalty: { home: number | null; away: number | null };
	};
}

export interface ApiResponse {
	response: ApiFixtureResponse[];
	/**
	 * API-Football reports failures (rate limits, bad params) inside a 200-status
	 * body under `errors` — an empty array on success, or a populated array /
	 * object on failure. The client inspects this so a throttled response isn't
	 * mistaken for "no fixtures". See `client.ts`.
	 */
	errors?: unknown;
}
