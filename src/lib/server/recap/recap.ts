// The Recap seam: a pure function that turns the three row-sets the leaderboard
// loader already fetches (users, picks, fixtures) into everything the Recap page
// renders. Slice 1 computed the availability gate and the title-card stats; this
// slice adds the race chart beat (per-user cumulative points + lead changes).
// Later beats (heatmap, awards, …) keep growing the RecapData shape behind this
// same seam without changing the loader.
import { getStage, type FoilTier } from '$lib/stage';
import { rankEntries } from '$lib/top-leaderboard';
import { displayName } from '$lib/display-name';
import { computeScores } from '$lib/server/scoring/score';

export type RecapUser = {
	id: string;
	name: string;
	email: string;
	displayName?: string | null;
};

/** `updatedAt` (ISO) is the Pick's last-write time — the Deadline Demon input. */
export type RecapPick = { userId: string; fixtureId: number; value: string; updatedAt?: string };

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

/** The seven award identifiers, in the order the foil cards appear. */
export type RecapAwardKey =
	| 'oracle'
	| 'sheep'
	| 'contrarian'
	| 'draw-whisperer'
	| 'deadline-demon'
	| 'lone-genius'
	| 'ghost';

/** A winner of an award (usually one; more than one on a tie). */
export type RecapAwardWinner = { userId: string; name: string };

/** One foil award card: name, winner(s), one number, one snarky subtitle. */
export type RecapAward = {
	key: RecapAwardKey;
	title: string;
	/** Snarky one-liner under the winner. */
	subtitle: string;
	/** Foil tier for the card's visual language (paper…legendary). */
	tier: FoilTier;
	/** Winner(s). Ties share the card; an award with no qualifying user is omitted. */
	winners: RecapAwardWinner[];
	/** The one number, pre-formatted for display (e.g. "92%", "14 pts", "3×"). */
	stat: string;
	tied: boolean;
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
	/** The seven foil awards, in canonical order; awards with no winner are omitted. */
	awards: RecapAward[];
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
		heatmap: computeHeatmap(users, picks, fixtures),
		awards: computeAwards(users, picks, fixtures)
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

// The awards beat: seven foil trading cards, each with a winner, one number, and a
// snarky subtitle. Everything a card renders is computed here in the seam.
//
// Rate-based awards (Oracle, Sheep, Deadline Demon) draw only from Active users
// — Picks on ≥50% of settled Fixtures (CONTEXT.md) — so a lucky handful of Picks
// can't steal a rate title. The Ghost is explicitly among Active users too (a
// forgetful regular, not a dropout — that's The Fallen's territory). The absolute
// counts (Contrarian points, Draw Whisperer draws, Lone Genius hits) can't be
// inflated by low participation, so they draw from everyone.
//
// Correctness is stage-aware for free: a Pick is correct iff it equals the Result,
// which already encodes who advanced. DRAW is never a valid knockout value — the
// Result there is HOME/AWAY, so a DRAW Pick simply never scores, and Draw
// Whisperer only ever looks at Group fixtures.

const EPS = 1e-9;

/** Per-user tallies over the settled tournament — the raw material for every award. */
type AwardAgg = {
	userId: string;
	name: string;
	active: boolean;
	/** Picks made on settled fixtures — the rate denominator. */
	answered: number;
	/** Correct picks on settled fixtures. */
	correct: number;
	/** Picks that matched their fixture's plurality (most-common) value. */
	pluralityMatches: number;
	/** Points from correct picks that were NOT the plurality value. */
	minorityPoints: number;
	/** Correct DRAW picks in the group stage. */
	drawsCalled: number;
	/** Settled fixtures on which this user was the sole correct picker. */
	loneHits: number;
	/** Settled fixtures with no pick from this user. */
	missed: number;
	/** Gaps (ms) between each Pick's last-write time and its fixture's Lock time. */
	deadlineGaps: number[];
};

function computeAwards(
	users: RecapUser[],
	picks: RecapPick[],
	fixtures: RecapFixture[]
): RecapAward[] {
	const settled = fixtures.filter((f) => f.result !== null);
	const settledCount = settled.length;
	const fixtureById = new Map(fixtures.map((f) => [f.id, f]));

	const picksByFixture = new Map<number, RecapPick[]>();
	const picksByUser = new Map<string, RecapPick[]>();
	for (const p of picks) {
		const forFixture = picksByFixture.get(p.fixtureId);
		if (forFixture) forFixture.push(p);
		else picksByFixture.set(p.fixtureId, [p]);
		const forUser = picksByUser.get(p.userId);
		if (forUser) forUser.push(p);
		else picksByUser.set(p.userId, [p]);
	}

	// Per settled fixture: the plurality value(s) — the pool's most-common Pick(s),
	// tied tops included — and how many pickers got it right (for Lone Genius).
	const pluralityByFixture = new Map<number, Set<string>>();
	const correctCountByFixture = new Map<number, number>();
	for (const f of settled) {
		const counts = new Map<string, number>();
		let correctCount = 0;
		for (const p of picksByFixture.get(f.id) ?? []) {
			counts.set(p.value, (counts.get(p.value) ?? 0) + 1);
			if (p.value === f.result) correctCount++;
		}
		let max = 0;
		for (const c of counts.values()) max = Math.max(max, c);
		const top = new Set<string>();
		if (max > 0) for (const [v, c] of counts) if (c === max) top.add(v);
		pluralityByFixture.set(f.id, top);
		correctCountByFixture.set(f.id, correctCount);
	}

	const aggs: AwardAgg[] = users.map((u) => {
		const name = displayName(u);
		const mine = picksByUser.get(u.id) ?? [];
		const byFixture = new Map(mine.map((p) => [p.fixtureId, p]));

		let answered = 0;
		let correct = 0;
		let pluralityMatches = 0;
		let minorityPoints = 0;
		let drawsCalled = 0;
		let loneHits = 0;
		let missed = 0;

		for (const f of settled) {
			const p = byFixture.get(f.id);
			if (!p) {
				missed++;
				continue;
			}
			answered++;
			const isCorrect = p.value === f.result;
			const plurality = pluralityByFixture.get(f.id)!;
			if (plurality.has(p.value)) pluralityMatches++;
			if (isCorrect) {
				correct++;
				const stage = getStage(f.stage);
				if (!plurality.has(p.value)) minorityPoints += stage.weight;
				if (stage.name === 'Group' && p.value === 'DRAW') drawsCalled++;
				if (correctCountByFixture.get(f.id) === 1) loneHits++;
			}
		}

		// Deadline gaps span every timed Pick (Lock time applies to all fixtures).
		const deadlineGaps: number[] = [];
		for (const p of mine) {
			const f = fixtureById.get(p.fixtureId);
			if (!f || !p.updatedAt) continue;
			deadlineGaps.push(new Date(f.kickoff).getTime() - new Date(p.updatedAt).getTime());
		}

		const active = settledCount > 0 && answered * 2 >= settledCount;
		return {
			userId: u.id,
			name,
			active,
			answered,
			correct,
			pluralityMatches,
			minorityPoints,
			drawsCalled,
			loneHits,
			missed,
			deadlineGaps
		};
	});

	const active = aggs.filter((a) => a.active);
	const awards: RecapAward[] = [];

	// The Oracle — highest accuracy % (Active users, ≥1 correct pick).
	pushAward(awards, {
		key: 'oracle',
		title: 'The Oracle',
		subtitle: 'Saw it all coming.',
		tier: 'legendary',
		candidates: active.filter((a) => a.answered > 0 && a.correct > 0),
		score: (a) => a.correct / a.answered,
		direction: 'max',
		stat: (a) => `${Math.round((a.correct / a.answered) * 100)}%`
	});

	// The Sheep — highest agreement with the pool's plurality Pick (Active users).
	pushAward(awards, {
		key: 'sheep',
		title: 'The Sheep',
		subtitle: 'Baa. Went with the flock.',
		tier: 'paper',
		candidates: active.filter((a) => a.answered > 0 && a.pluralityMatches > 0),
		score: (a) => a.pluralityMatches / a.answered,
		direction: 'max',
		stat: (a) => `${Math.round((a.pluralityMatches / a.answered) * 100)}%`
	});

	// The Contrarian — most points from minority Picks (everyone; absolute total).
	pushAward(awards, {
		key: 'contrarian',
		title: 'The Contrarian',
		subtitle: 'Points nobody else dared to take.',
		tier: 'holo',
		candidates: aggs.filter((a) => a.minorityPoints > 0),
		score: (a) => a.minorityPoints,
		direction: 'max',
		stat: (a) => `${a.minorityPoints} pt${a.minorityPoints === 1 ? '' : 's'}`
	});

	// Draw Whisperer — most correct DRAW Picks, group stage only (everyone).
	pushAward(awards, {
		key: 'draw-whisperer',
		title: 'Draw Whisperer',
		subtitle: 'Called the stalemates nobody else could.',
		tier: 'gold',
		candidates: aggs.filter((a) => a.drawsCalled > 0),
		score: (a) => a.drawsCalled,
		direction: 'max',
		stat: (a) => `${a.drawsCalled} draw${a.drawsCalled === 1 ? '' : 's'}`
	});

	// Deadline Demon — shortest median gap between Pick time and Lock time (Active).
	pushAward(awards, {
		key: 'deadline-demon',
		title: 'Deadline Demon',
		subtitle: 'Picked with the clock at zero.',
		tier: 'pearl',
		candidates: active.filter((a) => a.deadlineGaps.length > 0),
		score: (a) => median(a.deadlineGaps),
		direction: 'min',
		stat: (a) => formatGap(median(a.deadlineGaps))
	});

	// The Lone Genius — most times the sole correct picker on a Fixture (everyone).
	pushAward(awards, {
		key: 'lone-genius',
		title: 'The Lone Genius',
		subtitle: 'The only soul who saw it.',
		tier: 'holo',
		candidates: aggs.filter((a) => a.loneHits > 0),
		score: (a) => a.loneHits,
		direction: 'max',
		stat: (a) => `${a.loneHits}×`
	});

	// The Ghost — most missed Picks among Active users (forgetful, not fallen).
	pushAward(awards, {
		key: 'ghost',
		title: 'The Ghost',
		subtitle: 'Present in name, absent in Picks.',
		tier: 'paper',
		candidates: active.filter((a) => a.missed > 0),
		score: (a) => a.missed,
		direction: 'max',
		stat: (a) => `${a.missed} missed`
	});

	return awards;
}

type AwardSpec = {
	key: RecapAwardKey;
	title: string;
	subtitle: string;
	tier: FoilTier;
	candidates: AwardAgg[];
	score: (a: AwardAgg) => number;
	direction: 'max' | 'min';
	stat: (a: AwardAgg) => string;
};

// Select the winner(s) for one award and, if any qualify, push its card. Ties
// share the card; an award with no qualifying candidate is simply omitted.
function pushAward(awards: RecapAward[], spec: AwardSpec): void {
	if (spec.candidates.length === 0) return;
	const scored = spec.candidates.map((a) => ({ a, s: spec.score(a) }));
	let best = scored[0].s;
	for (const { s } of scored) {
		if (spec.direction === 'max' ? s > best : s < best) best = s;
	}
	const winners = scored.filter(({ s }) => Math.abs(s - best) < EPS).map(({ a }) => a);
	awards.push({
		key: spec.key,
		title: spec.title,
		subtitle: spec.subtitle,
		tier: spec.tier,
		winners: winners.map((a) => ({ userId: a.userId, name: a.name })),
		stat: spec.stat(winners[0]),
		tied: winners.length > 1
	});
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// A gap between Pick time and Lock time, rendered compactly: minutes under two
// hours, whole hours otherwise. Negative (a post-kickoff last write) clamps to 0.
function formatGap(ms: number): string {
	const mins = Math.max(0, Math.round(ms / 60_000));
	if (mins < 120) return `${mins} min`;
	return `${Math.round(mins / 60)} hr`;
}
