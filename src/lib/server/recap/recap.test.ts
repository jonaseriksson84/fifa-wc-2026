import { describe, it, expect } from 'vitest';
import { computeRecap, type RecapUser, type RecapPick, type RecapFixture } from './recap';

function makeUser(id: string, name = id): RecapUser {
	return { id, name, email: `${id}@local.test`, displayName: null };
}

function makeFixture(
	overrides: Partial<RecapFixture> & { id: number; stage: string }
): RecapFixture {
	return { result: null, kickoff: '2026-06-11T18:00:00.000Z', ...overrides };
}

function makePick(userId: string, fixtureId: number, value: string): RecapPick {
	return { userId, fixtureId, value };
}

describe('computeRecap — availability gate', () => {
	it('is unavailable when the Final fixture has no Result yet', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Final', result: null })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.available).toBe(false);
	});

	it('is available the moment the Final fixture has a Result', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Final', result: 'AWAY' })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.available).toBe(true);
	});

	it('is unavailable when there is no Final fixture at all', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'HOME' })];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.available).toBe(false);
	});
});

describe('computeRecap — title card stats', () => {
	it('counts every fixture in the tournament', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group' }),
			makeFixture({ id: 2, stage: 'Group' }),
			makeFixture({ id: 3, stage: 'Final' })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.title.fixtureCount).toBe(3);
	});

	it('counts every registered player, including those with zero Picks', () => {
		const users = [makeUser('u1'), makeUser('u2'), makeUser('u3')];
		const fixtures = [makeFixture({ id: 1, stage: 'Final', result: 'HOME' })];
		// Only u1 has a pick; u2 and u3 still count as players.
		const picks = [makePick('u1', 1, 'HOME')];

		const recap = computeRecap(users, picks, fixtures);

		expect(recap.title.playerCount).toBe(3);
	});

	it('reports the tournament date span from first to last kickoff', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'QF', kickoff: '2026-07-10T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', kickoff: '2026-07-19T18:00:00.000Z' })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.title.firstKickoff).toBe('2026-06-11T18:00:00.000Z');
		expect(recap.title.lastKickoff).toBe('2026-07-19T18:00:00.000Z');
	});
});

describe('computeRecap — empty-data safety', () => {
	it('never throws and reports zeros for an empty pool', () => {
		const recap = computeRecap([], [], []);

		expect(recap.available).toBe(false);
		expect(recap.title.fixtureCount).toBe(0);
		expect(recap.title.playerCount).toBe(0);
		expect(recap.title.firstKickoff).toBeNull();
		expect(recap.title.lastKickoff).toBeNull();
	});

	it('returns an empty race for an empty pool without throwing', () => {
		const recap = computeRecap([], [], []);

		expect(recap.race.steps).toEqual([]);
		expect(recap.race.series).toEqual([]);
		expect(recap.race.leadSegments).toEqual([]);
		expect(recap.race.leadChanges).toBe(0);
		expect(recap.race.maxPoints).toBe(0);
	});
});

describe('computeRecap — race series', () => {
	it('accumulates stage-weighted points per user over settled fixtures in kickoff order', () => {
		const users = [makeUser('u1'), makeUser('u2')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'AWAY', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Group', result: 'HOME', kickoff: '2026-06-13T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('u1', 1, 'HOME'), // +1
			makePick('u1', 2, 'HOME'), // wrong
			makePick('u1', 3, 'HOME'), // +1
			makePick('u1', 4, 'HOME'), // +6 (Final is legendary/6 pts)
			makePick('u2', 1, 'AWAY'), // wrong
			makePick('u2', 2, 'AWAY'), // +1
			makePick('u2', 3, 'AWAY'), // wrong
			makePick('u2', 4, 'AWAY') // wrong
		];

		const { race } = computeRecap(users, picks, fixtures);

		expect(race.steps.map((s) => s.fixtureId)).toEqual([1, 2, 3, 4]);
		const u1 = race.series.find((s) => s.userId === 'u1')!;
		const u2 = race.series.find((s) => s.userId === 'u2')!;
		expect(u1.cumulative).toEqual([1, 1, 2, 8]);
		expect(u2.cumulative).toEqual([0, 1, 1, 1]);
		expect(u1.finalPoints).toBe(8);
		expect(u2.finalPoints).toBe(1);
		expect(race.maxPoints).toBe(8);
	});

	it('includes every user, even those with zero Picks, as a flat line', () => {
		const users = [makeUser('u1'), makeUser('u2'), makeUser('ghost')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME' })
		];
		const picks = [makePick('u1', 1, 'HOME'), makePick('u1', 2, 'HOME')];

		const { race } = computeRecap(users, picks, fixtures);

		const ghost = race.series.find((s) => s.userId === 'ghost')!;
		expect(ghost).toBeTruthy();
		expect(ghost.cumulative).toEqual([0, 0]);
		expect(ghost.finalPoints).toBe(0);
		expect(race.series).toHaveLength(3);
	});

	it('sorts the series by final rank and marks the top three as the podium', () => {
		const users = [makeUser('a'), makeUser('b'), makeUser('c'), makeUser('d')];
		const fixtures = [makeFixture({ id: 1, stage: 'Final', result: 'HOME' })];
		// a=6, b=6? no — spread them so ranks are distinct: use group fixtures too.
		const groupFixtures = [
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Group', result: 'HOME', kickoff: '2026-06-13T18:00:00.000Z' })
		];
		const allFixtures = [...groupFixtures, ...fixtures];
		const picks = [
			// a: Final + 3 groups = 6 + 3 = 9
			makePick('a', 1, 'HOME'),
			makePick('a', 2, 'HOME'),
			makePick('a', 3, 'HOME'),
			makePick('a', 4, 'HOME'),
			// b: Final only = 6
			makePick('b', 1, 'HOME'),
			// c: 2 groups = 2
			makePick('c', 2, 'HOME'),
			makePick('c', 3, 'HOME'),
			// d: 1 group = 1
			makePick('d', 2, 'HOME')
		];

		const { race } = computeRecap(users, picks, allFixtures);

		expect(race.series.map((s) => s.userId)).toEqual(['a', 'b', 'c', 'd']);
		expect(race.series.map((s) => s.rank)).toEqual([1, 2, 3, 4]);
		expect(race.series.map((s) => s.isPodium)).toEqual([true, true, true, false]);
	});

	it('handles ties in the final standings — tied users share a rank and podium spot', () => {
		const users = [makeUser('u1'), makeUser('u2')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('u1', 1, 'HOME'),
			makePick('u1', 2, 'HOME'),
			makePick('u2', 1, 'HOME'),
			makePick('u2', 2, 'HOME')
		];

		const { race } = computeRecap(users, picks, fixtures);

		expect(race.series.map((s) => s.rank)).toEqual([1, 1]);
		expect(race.series.every((s) => s.tied)).toBe(true);
		expect(race.series.every((s) => s.isPodium)).toBe(true);
	});

	it('only steps through settled fixtures for partially settled data', () => {
		const users = [makeUser('u1')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Group', result: null }),
			makeFixture({ id: 3, stage: 'Final', result: null })
		];
		const picks = [makePick('u1', 1, 'HOME'), makePick('u1', 2, 'HOME')];

		const { race, available } = computeRecap(users, picks, fixtures);

		expect(available).toBe(false);
		expect(race.steps.map((s) => s.fixtureId)).toEqual([1]);
		expect(race.series[0].cumulative).toEqual([1]);
	});
});

describe('computeRecap — heatmap grid', () => {
	it('builds one row per user sorted by final rank, one column per fixture', () => {
		const users = [makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// b outscores a → b ranks first
			makePick('a', 1, 'HOME'),
			makePick('b', 1, 'HOME'),
			makePick('b', 2, 'HOME')
		];

		const { heatmap } = computeRecap(users, picks, fixtures);

		expect(heatmap.rows.map((r) => r.userId)).toEqual(['b', 'a']);
		expect(heatmap.rows.map((r) => r.rank)).toEqual([1, 2]);
		expect(heatmap.columns.map((c) => c.fixtureId)).toEqual([1, 2]);
		expect(heatmap.rows[0].cells).toHaveLength(2);
	});

	it('marks each cell correct / wrong / missing from the pick against the result', () => {
		const users = [makeUser('u1')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'AWAY', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('u1', 1, 'HOME'), // correct
			makePick('u1', 2, 'HOME') // wrong; no pick on fixture 3
		];

		const { heatmap } = computeRecap(users, picks, fixtures);

		const row = heatmap.rows[0];
		expect(row.cells).toEqual(['correct', 'wrong', 'missing']);
		expect(row.correctCount).toBe(1);
		expect(row.pickCount).toBe(2);
	});

	it('is knockout stage-aware — the pick equals the stage-aware Result (who advanced)', () => {
		const users = [makeUser('u1')];
		const fixtures = [
			// A knockout fixture whose Result encodes the team that advanced.
			makeFixture({ id: 1, stage: 'R16', result: 'BRAZIL', kickoff: '2026-06-28T18:00:00.000Z' })
		];
		const picks = [makePick('u1', 1, 'BRAZIL')];

		const { heatmap } = computeRecap(users, picks, fixtures);

		expect(heatmap.rows[0].cells).toEqual(['correct']);
	});

	it('renders a zero-pick user as an all-missing row', () => {
		const users = [makeUser('u1'), makeUser('ghost')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [makePick('u1', 1, 'HOME'), makePick('u1', 2, 'HOME')];

		const { heatmap } = computeRecap(users, picks, fixtures);

		const ghost = heatmap.rows.find((r) => r.userId === 'ghost')!;
		expect(ghost.cells).toEqual(['missing', 'missing']);
		expect(ghost.correctCount).toBe(0);
		expect(ghost.pickCount).toBe(0);
	});

	it('orders columns by stage then kickoff and groups them by stage', () => {
		const users = [makeUser('u1')];
		const fixtures = [
			makeFixture({ id: 3, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' }),
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'R16', result: 'HOME', kickoff: '2026-06-28T18:00:00.000Z' })
		];

		const { heatmap } = computeRecap(users, [], fixtures);

		// Group (kickoff-sorted) → R16 → Final.
		expect(heatmap.columns.map((c) => c.fixtureId)).toEqual([2, 1, 4, 3]);
		expect(heatmap.stageGroups).toEqual([
			{ stage: 'Group', startIndex: 0, count: 2 },
			{ stage: 'R16', startIndex: 2, count: 1 },
			{ stage: 'Final', startIndex: 3, count: 1 }
		]);
	});

	it('marks cells for an unsettled fixture as pending so partial data renders', () => {
		const users = [makeUser('u1')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: null, kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [makePick('u1', 1, 'HOME'), makePick('u1', 2, 'HOME')];

		const { heatmap } = computeRecap(users, picks, fixtures);

		expect(heatmap.rows[0].cells).toEqual(['correct', 'pending']);
		// A pending fixture doesn't count toward correct or answered picks.
		expect(heatmap.rows[0].correctCount).toBe(1);
		expect(heatmap.rows[0].pickCount).toBe(1);
	});

	it('returns an empty heatmap for an empty pool without throwing', () => {
		const { heatmap } = computeRecap([], [], []);

		expect(heatmap.columns).toEqual([]);
		expect(heatmap.rows).toEqual([]);
		expect(heatmap.stageGroups).toEqual([]);
	});
});

describe('computeRecap — lead changes', () => {
	it('detects a lead change and reports how long each leader held the crown', () => {
		const users = [makeUser('u1'), makeUser('u2')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-06-20T18:00:00.000Z' })
		];
		const picks = [
			makePick('u1', 1, 'HOME'), // u1 leads 1-0 from Jun 11
			makePick('u1', 2, 'AWAY'), // wrong
			makePick('u2', 1, 'AWAY'), // wrong
			makePick('u2', 2, 'HOME') // u2 overtakes 6-1 on Jun 20
		];

		const { race } = computeRecap(users, picks, fixtures);

		expect(race.leadChanges).toBe(1);
		expect(race.leadSegments).toHaveLength(2);
		expect(race.leadSegments[0].userId).toBe('u1');
		expect(race.leadSegments[0].days).toBe(9);
		expect(race.leadSegments[1].userId).toBe('u2');
	});

	it('reports a single uninterrupted leader as one segment with no lead changes', () => {
		const users = [makeUser('u1'), makeUser('u2')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-06-20T18:00:00.000Z' })
		];
		const picks = [
			makePick('u1', 1, 'HOME'),
			makePick('u1', 2, 'HOME'),
			makePick('u2', 1, 'AWAY')
		];

		const { race } = computeRecap(users, picks, fixtures);

		expect(race.leadChanges).toBe(0);
		expect(race.leadSegments).toHaveLength(1);
		expect(race.leadSegments[0].userId).toBe('u1');
	});

	it('does not crown a leader while every user is still on zero points', () => {
		const users = [makeUser('u1'), makeUser('u2')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-06-20T18:00:00.000Z' })
		];
		// Nobody picks the first fixture correctly; both flat at 0 after step 1.
		const picks = [makePick('u1', 1, 'AWAY'), makePick('u2', 1, 'AWAY'), makePick('u1', 2, 'HOME')];

		const { race } = computeRecap(users, picks, fixtures);

		// Only u1 ever scores (on the Final), so exactly one lead segment.
		expect(race.leadSegments).toHaveLength(1);
		expect(race.leadSegments[0].userId).toBe('u1');
	});
});
