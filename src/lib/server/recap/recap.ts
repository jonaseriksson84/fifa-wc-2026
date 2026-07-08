// The Recap seam: a pure function that turns the three row-sets the leaderboard
// loader already fetches (users, picks, fixtures) into everything the Recap page
// renders. Slice 1 computed the availability gate and the title-card stats; this
// slice adds the race chart beat (per-user cumulative points + lead changes).
// Later beats (heatmap, awards, …) keep growing the RecapData shape behind this
// same seam without changing the loader.
import { getStage } from '$lib/stage';
import { rankEntries } from '$lib/top-leaderboard';
import { displayName } from '$lib/display-name';
import { computeScores } from '$lib/server/scoring/score';

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

/** One settled fixture, the x-axis of the race chart, in kickoff order. */
export type RecapRaceStep = {
	fixtureId: number;
	stage: string;
	kickoff: string;
};

/** One User's line in the race chart. */
export type RecapRaceSeries = {
	userId: string;
	name: string;
	/** Cumulative points after each step; aligned 1:1 with `race.steps`. */
	cumulative: number[];
	finalPoints: number;
	rank: number;
	tied: boolean;
	/** Top three by final rank — lit up as the podium reveal. */
	isPodium: boolean;
};

/** A stretch of the tournament that one User spent in sole possession of first place. */
export type RecapLeadSegment = {
	userId: string;
	name: string;
	fromKickoff: string;
	toKickoff: string;
	/** Whole days between taking the lead and losing it (or the last settled fixture). */
	days: number;
};

export type RecapRace = {
	steps: RecapRaceStep[];
	/** Sorted by final rank (leader first). */
	series: RecapRaceSeries[];
	leadSegments: RecapLeadSegment[];
	/** Number of times the sole leader changed hands (segments − 1, never negative). */
	leadChanges: number;
	/** Highest final points in the pool — the chart's y-axis ceiling. */
	maxPoints: number;
};

/** The state of one User × Fixture cell in the heatmap. */
export type RecapHeatCellState = 'correct' | 'wrong' | 'missing' | 'pending';

/** One column of the heatmap — a single Fixture, in kickoff-within-stage order. */
export type RecapHeatColumn = {
	fixtureId: number;
	stage: string;
	kickoff: string;
};

/** One row of the heatmap — a single User, sorted by final rank. */
export type RecapHeatRow = {
	userId: string;
	name: string;
	rank: number;
	/** Cell state per column; aligned 1:1 with `heatmap.columns`. */
	cells: RecapHeatCellState[];
	/** Correct Picks on settled fixtures (the row's "greenness"). */
	correctCount: number;
	/** Picks made on settled fixtures — the denominator behind the texture. */
	pickCount: number;
};

/** A contiguous run of columns belonging to one Stage, for rendering headers. */
export type RecapHeatStageGroup = {
	stage: string;
	startIndex: number;
	count: number;
};

export type RecapHeatmap = {
	/** Every Fixture, grouped by Stage then kickoff. */
	columns: RecapHeatColumn[];
	/** One per User, sorted by final rank (champion first). */
	rows: RecapHeatRow[];
	/** Stage runs over `columns`, for the grouped column headers. */
	stageGroups: RecapHeatStageGroup[];
};

export type RecapData = {
	/**
	 * The Recap renders iff the Final Fixture has a Result (per PRD / ADR 0003:
	 * no roles, no preview flags, no secrets — the gate is the only mechanism).
	 */
	available: boolean;
	title: RecapTitle;
	race: RecapRace;
	heatmap: RecapHeatmap;
};

export function computeRecap(
	users: RecapUser[],
	picks: RecapPick[],
	fixtures: RecapFixture[]
): RecapData {
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
		},
		race: computeRace(users, picks, fixtures),
		heatmap: computeHeatmap(users, picks, fixtures)
	};
}

// The heatmap beat: a GitHub-contribution-graph grid — one row per User (sorted
// by final rank), one column per Fixture (grouped by Stage, kickoff order within
// each), every cell coloured correct / wrong / missing. It reads as texture: the
// champion's greener row, a dropout fading to grey, vertical red stripes where
// everyone whiffed. Everyone appears, including sub-threshold and zero-Pick users.
// Correctness is stage-aware for free — a Pick is correct iff it equals the
// Result, which already encodes who advanced (no scoring reimplemented here).
function computeHeatmap(
	users: RecapUser[],
	picks: RecapPick[],
	fixtures: RecapFixture[]
): RecapHeatmap {
	// Columns: every Fixture, grouped by Stage (sortIndex) then kickoff. Sorting
	// stage-first keeps each stage's columns contiguous even if kickoffs overlap.
	const ordered = [...fixtures].sort((a, b) => {
		const s = getStage(a.stage).sortIndex - getStage(b.stage).sortIndex;
		if (s !== 0) return s;
		const t = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
		return t !== 0 ? t : a.id - b.id;
	});
	const columns: RecapHeatColumn[] = ordered.map((f) => ({
		fixtureId: f.id,
		stage: f.stage,
		kickoff: f.kickoff
	}));

	const resultByFixture = new Map(fixtures.map((f) => [f.id, f.result]));
	const pickByUserFixture = new Map<string, string>();
	for (const p of picks) pickByUserFixture.set(`${p.userId}:${p.fixtureId}`, p.value);

	// Rank rows by the same stage-weighted totals as the leaderboard / race chart.
	const scores = computeScores(picks, fixtures);
	const ranked = rankEntries(
		users.map((u) => ({ userId: u.id, name: displayName(u), points: scores.get(u.id) ?? 0 }))
	);

	const rows: RecapHeatRow[] = ranked.map((e) => {
		let correctCount = 0;
		let pickCount = 0;
		const cells = columns.map<RecapHeatCellState>((col) => {
			const result = resultByFixture.get(col.fixtureId);
			if (result == null) return 'pending';
			const pick = pickByUserFixture.get(`${e.userId}:${col.fixtureId}`);
			if (pick === undefined) return 'missing';
			pickCount++;
			if (pick === result) {
				correctCount++;
				return 'correct';
			}
			return 'wrong';
		});
		return { userId: e.userId, name: e.name, rank: e.rank, cells, correctCount, pickCount };
	});

	const stageGroups: RecapHeatStageGroup[] = [];
	for (let i = 0; i < columns.length; i++) {
		const last = stageGroups[stageGroups.length - 1];
		if (!last || last.stage !== columns[i].stage) {
			stageGroups.push({ stage: columns[i].stage, startIndex: i, count: 1 });
		} else {
			last.count++;
		}
	}

	return { columns, rows, stageGroups };
}

// The race chart beat: cumulative points per User across every settled fixture in
// kickoff order, the final standings (podium = top three), and the lead-change
// story ("X led for N days"). Everyone appears, including sub-threshold and
// zero-Pick users — the race chart is a factual view, not an award. Knockout
// Results are stage-aware via getStage().weight (no scoring reimplemented here).
function computeRace(
	users: RecapUser[],
	picks: RecapPick[],
	fixtures: RecapFixture[]
): RecapRace {
	const settled = fixtures
		.filter((f) => f.result !== null)
		.sort((a, b) => {
			const t = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
			return t !== 0 ? t : a.id - b.id;
		});

	const steps: RecapRaceStep[] = settled.map((f) => ({
		fixtureId: f.id,
		stage: f.stage,
		kickoff: f.kickoff
	}));

	const picksByFixture = new Map<number, RecapPick[]>();
	for (const p of picks) {
		const bucket = picksByFixture.get(p.fixtureId);
		if (bucket) bucket.push(p);
		else picksByFixture.set(p.fixtureId, [p]);
	}

	// Walk the settled fixtures once, growing each User's cumulative line step by
	// step. `running` is the live total; `cumulativeByUser` snapshots it per step.
	const running = new Map<string, number>(users.map((u) => [u.id, 0]));
	const cumulativeByUser = new Map<string, number[]>(users.map((u) => [u.id, []]));

	for (const f of settled) {
		const weight = getStage(f.stage).weight;
		for (const p of picksByFixture.get(f.id) ?? []) {
			if (p.value === f.result && running.has(p.userId)) {
				running.set(p.userId, running.get(p.userId)! + weight);
			}
		}
		for (const u of users) {
			cumulativeByUser.get(u.id)!.push(running.get(u.id)!);
		}
	}

	const ranked = rankEntries(
		users.map((u) => ({ userId: u.id, name: displayName(u), points: running.get(u.id)! }))
	);
	const series: RecapRaceSeries[] = ranked.map((e) => ({
		userId: e.userId,
		name: e.name,
		cumulative: cumulativeByUser.get(e.userId)!,
		finalPoints: e.points,
		rank: e.rank,
		tied: e.tied,
		isPodium: e.rank <= 3
	}));

	const maxPoints = series.reduce((m, s) => Math.max(m, s.finalPoints), 0);
	const leadSegments = computeLeadSegments(users, steps, cumulativeByUser);

	return {
		steps,
		series,
		leadSegments,
		leadChanges: Math.max(0, leadSegments.length - 1),
		maxPoints
	};
}

// Determine, for each step, who sits alone in first place. You only *take* the
// lead by pulling strictly clear of the field: while the top is tied, the sitting
// leader keeps the crown (they haven't been overtaken), and any other tie leaves
// the lead genuinely contested (null). Nobody leads while everyone is on zero.
function computeLeadSegments(
	users: RecapUser[],
	steps: RecapRaceStep[],
	cumulativeByUser: Map<string, number[]>
): RecapLeadSegment[] {
	const nameById = new Map(users.map((u) => [u.id, displayName(u)]));

	const stepLeaders: (string | null)[] = [];
	let prev: string | null = null;
	for (let i = 0; i < steps.length; i++) {
		let max = 0;
		for (const u of users) max = Math.max(max, cumulativeByUser.get(u.id)![i]);

		let leader: string | null;
		if (max <= 0) {
			leader = null;
		} else {
			const atTop = users.filter((u) => cumulativeByUser.get(u.id)![i] === max).map((u) => u.id);
			if (atTop.length === 1) leader = atTop[0];
			else if (prev !== null && atTop.includes(prev)) leader = prev;
			else leader = null;
		}
		stepLeaders.push(leader);
		if (leader !== null) prev = leader;
	}

	// Collapse consecutive equal leaders (skipping contested steps) into runs;
	// each distinct run is one reign, and run boundaries are the lead changes.
	const runs: { userId: string; startIdx: number }[] = [];
	for (let i = 0; i < stepLeaders.length; i++) {
		const leader = stepLeaders[i];
		if (leader === null) continue;
		const last = runs[runs.length - 1];
		if (!last || last.userId !== leader) runs.push({ userId: leader, startIdx: i });
	}

	const lastKickoff = steps.length > 0 ? steps[steps.length - 1].kickoff : null;
	return runs.map((run, r) => {
		const fromKickoff = steps[run.startIdx].kickoff;
		const toKickoff = r + 1 < runs.length ? steps[runs[r + 1].startIdx].kickoff : lastKickoff!;
		const days = Math.round(
			(new Date(toKickoff).getTime() - new Date(fromKickoff).getTime()) / 86_400_000
		);
		return { userId: run.userId, name: nameById.get(run.userId)!, fromKickoff, toKickoff, days };
	});
}
