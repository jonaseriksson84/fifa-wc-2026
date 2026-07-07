// The Recap seam: a pure function that turns the three row-sets the leaderboard
// loader already fetches (users, picks, fixtures) into everything the Recap page
// renders. This first slice computes the availability gate and the title-card
// stats; later beats (race chart, heatmap, awards, …) grow the RecapData shape
// behind this same seam without changing the loader.

export type RecapUser = {
	id: string;
	name: string;
	email: string;
	displayName?: string | null;
};

export type RecapPick = { userId: string; fixtureId: number; value: string };

export type RecapFixture = {
	id: number;
	stage: string;
	result: string | null;
	kickoff: string;
};

export type RecapTitle = {
	fixtureCount: number;
	playerCount: number;
	firstKickoff: string | null;
	lastKickoff: string | null;
};

export type RecapData = {
	/**
	 * The Recap renders iff the Final Fixture has a Result (per PRD / ADR 0003:
	 * no roles, no preview flags, no secrets — the gate is the only mechanism).
	 */
	available: boolean;
	title: RecapTitle;
};

export function computeRecap(
	users: RecapUser[],
	// picks are unused in this first slice but part of the seam's contract —
	// later beats (race chart, heatmap, awards) compute from them.
	picks: RecapPick[],
	fixtures: RecapFixture[]
): RecapData {
	void picks;
	const final = fixtures.find((f) => f.stage === 'Final');
	const available = final != null && final.result != null;

	const kickoffs = fixtures.map((f) => f.kickoff).sort();
	const firstKickoff = kickoffs.length > 0 ? kickoffs[0] : null;
	const lastKickoff = kickoffs.length > 0 ? kickoffs[kickoffs.length - 1] : null;

	return {
		available,
		title: {
			fixtureCount: fixtures.length,
			playerCount: users.length,
			firstKickoff,
			lastKickoff
		}
	};
}
