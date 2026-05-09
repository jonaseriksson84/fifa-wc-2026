export type Stage = 'Group' | 'R32' | 'R16' | 'QF' | 'SF' | '3rd-place' | 'Final';
export type Result = 'HOME' | 'DRAW' | 'AWAY';

export interface DomainFixture {
	apiFootballId: number;
	homeTeam: string;
	awayTeam: string;
	kickoff: string;
	stage: Stage;
}

export interface DomainResult {
	apiFootballId: number;
	result: Result;
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
}
