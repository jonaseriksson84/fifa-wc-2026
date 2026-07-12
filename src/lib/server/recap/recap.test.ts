import { describe, it, expect } from 'vitest';
import { computeRecap, type RecapUser, type RecapPick, type RecapFixture } from './recap';

function makeUser(id: string, name = id): RecapUser {
	return { id, name, email: `${id}@local.test`, displayName: null };
}

function makeFixture(
	overrides: Partial<RecapFixture> & { id: number; stage: string }
): RecapFixture {
	return {
		result: null,
		kickoff: '2026-06-11T18:00:00.000Z',
		homeTeam: 'Home',
		awayTeam: 'Away',
		...overrides
	};
}

function makePick(userId: string, fixtureId: number, value: string): RecapPick {
	return { userId, fixtureId, value };
}

function makePickAt(
	userId: string,
	fixtureId: number,
	value: string,
	updatedAt: string
): RecapPick {
	return { userId, fixtureId, value, updatedAt };
}

function awardByKey(recap: ReturnType<typeof computeRecap>, key: string) {
	return recap.awards.find((a) => a.key === key);
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

describe('computeRecap — foil awards', () => {
	it('The Oracle goes to the highest accuracy % among Active users', () => {
		const users = [makeUser('sharp'), makeUser('lucky')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Group', result: 'HOME', kickoff: '2026-06-13T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// sharp: 3/4 correct = 75%, Active (4 of 4 settled).
			makePick('sharp', 1, 'HOME'),
			makePick('sharp', 2, 'HOME'),
			makePick('sharp', 3, 'HOME'),
			makePick('sharp', 4, 'AWAY'),
			// lucky: one correct Pick = 100%, but only 1 of 4 settled → not Active.
			makePick('lucky', 1, 'HOME')
		];

		const oracle = awardByKey(computeRecap(users, picks, fixtures), 'oracle')!;

		expect(oracle.winners.map((w) => w.userId)).toEqual(['sharp']);
		expect(oracle.stat).toBe('75%');
		expect(oracle.tied).toBe(false);
	});

	it('shares an award between tied winners and marks it tied', () => {
		const users = [makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('a', 1, 'HOME'),
			makePick('a', 2, 'HOME'),
			makePick('b', 1, 'HOME'),
			makePick('b', 2, 'HOME')
		];

		const oracle = awardByKey(computeRecap(users, picks, fixtures), 'oracle')!;

		expect(oracle.winners.map((w) => w.userId).sort()).toEqual(['a', 'b']);
		expect(oracle.tied).toBe(true);
	});

	it('omits an award entirely when no user qualifies', () => {
		const users = [makeUser('u1')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'R16', result: 'HOME', kickoff: '2026-06-28T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		// No group-stage DRAW anywhere → Draw Whisperer has no candidate.
		const picks = [makePick('u1', 1, 'HOME'), makePick('u1', 2, 'HOME')];

		expect(awardByKey(computeRecap(users, picks, fixtures), 'draw-whisperer')).toBeUndefined();
	});

	it('The Sheep goes to the highest agreement with the pool plurality Pick', () => {
		const users = [makeUser('sheep'), makeUser('rebel'), makeUser('c'), makeUser('d')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		// Plurality on all three is HOME (three pick HOME, rebel picks AWAY).
		const picks = [
			makePick('sheep', 1, 'HOME'),
			makePick('sheep', 2, 'HOME'),
			makePick('sheep', 3, 'HOME'),
			makePick('rebel', 1, 'AWAY'),
			makePick('rebel', 2, 'AWAY'),
			makePick('rebel', 3, 'AWAY'),
			makePick('c', 1, 'HOME'),
			makePick('c', 2, 'HOME'),
			makePick('c', 3, 'HOME'),
			makePick('d', 1, 'HOME'),
			makePick('d', 2, 'HOME'),
			makePick('d', 3, 'HOME')
		];

		const sheep = awardByKey(computeRecap(users, picks, fixtures), 'sheep')!;

		expect(sheep.winners.map((w) => w.userId)).toContain('sheep');
		expect(sheep.winners.map((w) => w.userId)).not.toContain('rebel');
	});

	it('The Contrarian counts points from correct minority Picks only', () => {
		const users = [makeUser('bold'), makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Final', result: 'AWAY', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		// Everyone else picked HOME (plurality); bold alone picked the correct AWAY.
		const picks = [
			makePick('bold', 1, 'AWAY'),
			makePick('a', 1, 'HOME'),
			makePick('b', 1, 'HOME')
		];

		const contrarian = awardByKey(computeRecap(users, picks, fixtures), 'contrarian')!;

		expect(contrarian.winners.map((w) => w.userId)).toEqual(['bold']);
		// Final is legendary/6 pts.
		expect(contrarian.stat).toBe('6 pts');
	});

	it('Draw Whisperer counts correct group-stage DRAWs only, never knockout picks', () => {
		const users = [makeUser('whisper'), makeUser('other')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'DRAW', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'DRAW', kickoff: '2026-06-12T18:00:00.000Z' }),
			// A knockout fixture can never resolve to DRAW; a DRAW pick here must not count.
			makeFixture({ id: 3, stage: 'R16', result: 'HOME', kickoff: '2026-06-28T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('whisper', 1, 'DRAW'),
			makePick('whisper', 2, 'DRAW'),
			makePick('whisper', 3, 'DRAW'), // knockout DRAW — never valid, never scores
			makePick('whisper', 4, 'HOME'),
			makePick('other', 1, 'DRAW'),
			makePick('other', 2, 'HOME')
		];

		const draw = awardByKey(computeRecap(users, picks, fixtures), 'draw-whisperer')!;

		expect(draw.winners.map((w) => w.userId)).toEqual(['whisper']);
		expect(draw.stat).toBe('2 draws');
	});

	it('Deadline Demon goes to the shortest median gap between Pick time and Lock time', () => {
		const users = [makeUser('demon'), makeUser('early')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' })
		];
		const picks = [
			// demon writes ~5 min before each kickoff.
			makePickAt('demon', 1, 'HOME', '2026-06-11T17:55:00.000Z'),
			makePickAt('demon', 2, 'HOME', '2026-06-12T17:55:00.000Z'),
			// early writes days ahead.
			makePickAt('early', 1, 'HOME', '2026-06-01T12:00:00.000Z'),
			makePickAt('early', 2, 'HOME', '2026-06-02T12:00:00.000Z')
		];

		const demon = awardByKey(computeRecap(users, picks, fixtures), 'deadline-demon')!;

		expect(demon.winners.map((w) => w.userId)).toEqual(['demon']);
		expect(demon.stat).toBe('5 min');
	});

	it('The Lone Genius goes to the most sole-correct-picker fixtures', () => {
		const users = [makeUser('genius'), makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'AWAY', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'AWAY', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// genius alone right on 1 & 2; everyone right on 3 (not a lone hit).
			makePick('genius', 1, 'AWAY'),
			makePick('genius', 2, 'AWAY'),
			makePick('genius', 3, 'HOME'),
			makePick('a', 1, 'HOME'),
			makePick('a', 2, 'HOME'),
			makePick('a', 3, 'HOME'),
			makePick('b', 1, 'HOME'),
			makePick('b', 2, 'HOME'),
			makePick('b', 3, 'HOME')
		];

		const lone = awardByKey(computeRecap(users, picks, fixtures), 'lone-genius')!;

		expect(lone.winners.map((w) => w.userId)).toEqual(['genius']);
		expect(lone.stat).toBe('2×');
	});

	it('The Ghost goes to the most missed Picks among Active users, not dropouts', () => {
		const users = [makeUser('ghost'), makeUser('faithful'), makeUser('fallen')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Group', result: 'HOME', kickoff: '2026-06-13T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// ghost: 2 of 4 → Active, but missed 2.
			makePick('ghost', 1, 'HOME'),
			makePick('ghost', 2, 'HOME'),
			// faithful: all 4, missed 0.
			makePick('faithful', 1, 'HOME'),
			makePick('faithful', 2, 'HOME'),
			makePick('faithful', 3, 'HOME'),
			makePick('faithful', 4, 'HOME'),
			// fallen: 1 of 4 → not Active, missed 3 but excluded (that's The Fallen's turf).
			makePick('fallen', 1, 'HOME')
		];

		const ghost = awardByKey(computeRecap(users, picks, fixtures), 'ghost')!;

		expect(ghost.winners.map((w) => w.userId)).toEqual(['ghost']);
		expect(ghost.stat).toBe('2 missed');
	});

	it('returns the seven awards in canonical order when all have winners', () => {
		const users = [makeUser('a'), makeUser('b'), makeUser('c')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'DRAW', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'AWAY', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Group', result: 'HOME', kickoff: '2026-06-13T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// a: draw caller + a sole-correct minority AWAY, always on time.
			makePickAt('a', 1, 'DRAW', '2026-06-11T17:50:00.000Z'),
			makePickAt('a', 2, 'AWAY', '2026-06-12T17:50:00.000Z'),
			makePickAt('a', 3, 'HOME', '2026-06-13T17:50:00.000Z'),
			makePickAt('a', 4, 'HOME', '2026-07-19T17:50:00.000Z'),
			// b: follows the flock, early, misses one.
			makePickAt('b', 1, 'HOME', '2026-06-01T12:00:00.000Z'),
			makePickAt('b', 3, 'HOME', '2026-06-03T12:00:00.000Z'),
			makePickAt('b', 4, 'HOME', '2026-06-04T12:00:00.000Z'),
			// c: fills the pool out so plurality and Active thresholds are meaningful.
			makePickAt('c', 1, 'HOME', '2026-06-01T12:00:00.000Z'),
			makePickAt('c', 2, 'HOME', '2026-06-02T12:00:00.000Z'),
			makePickAt('c', 3, 'HOME', '2026-06-03T12:00:00.000Z'),
			makePickAt('c', 4, 'HOME', '2026-06-04T12:00:00.000Z')
		];

		const { awards } = computeRecap(users, picks, fixtures);

		expect(awards.map((a) => a.key)).toEqual([
			'oracle',
			'sheep',
			'contrarian',
			'draw-whisperer',
			'deadline-demon',
			'lone-genius',
			'ghost'
		]);
		// Every card carries a title, a snarky subtitle, a foil tier and a stat.
		for (const a of awards) {
			expect(a.title.length).toBeGreaterThan(0);
			expect(a.subtitle.length).toBeGreaterThan(0);
			expect(a.tier.length).toBeGreaterThan(0);
			expect(a.stat.length).toBeGreaterThan(0);
			expect(a.winners.length).toBeGreaterThan(0);
		}
	});
});

describe('computeRecap — Hive Mind', () => {
	it("scores the pool's majority Pick and places the robot on the final standings", () => {
		const users = [makeUser('a'), makeUser('b'), makeUser('c')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'AWAY', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// f1 plurality HOME (a,b) → correct (+1); f2 plurality HOME (b,c) → wrong;
			// f3 plurality HOME (a,b) → correct (+6). Robot = 7, right on 2 of 3.
			makePick('a', 1, 'HOME'),
			makePick('a', 2, 'AWAY'),
			makePick('a', 3, 'HOME'),
			makePick('b', 1, 'HOME'),
			makePick('b', 2, 'HOME'),
			makePick('b', 3, 'HOME'),
			makePick('c', 1, 'AWAY'),
			makePick('c', 2, 'HOME'),
			makePick('c', 3, 'AWAY')
		];

		const { hiveMind } = computeRecap(users, picks, fixtures);

		// Users: a=8, b=7, c=0. Robot=7 → beaten only by a → rank 2, beats c.
		expect(hiveMind.points).toBe(7);
		expect(hiveMind.correct).toBe(2);
		expect(hiveMind.settledCount).toBe(3);
		expect(hiveMind.rank).toBe(2);
		expect(hiveMind.beat).toBe(1);
		expect(hiveMind.playerCount).toBe(3);
	});

	it('breaks plurality ties deterministically', () => {
		const users = [makeUser('a'), makeUser('b')];
		const fixtures = [
			// Split 1-1 between AWAY and HOME. The tie-break must be deterministic;
			// choosing the lexicographically smaller value (AWAY) here lands correct.
			makeFixture({ id: 1, stage: 'Group', result: 'AWAY', kickoff: '2026-06-11T18:00:00.000Z' })
		];
		const picks = [makePick('a', 1, 'HOME'), makePick('b', 1, 'AWAY')];

		const { hiveMind } = computeRecap(users, picks, fixtures);

		expect(hiveMind.points).toBe(1);
		expect(hiveMind.correct).toBe(1);
	});

	it('ignores unsettled fixtures for partially settled data', () => {
		const users = [makeUser('a')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: null, kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [makePick('a', 1, 'HOME'), makePick('a', 2, 'HOME')];

		const { hiveMind } = computeRecap(users, picks, fixtures);

		expect(hiveMind.settledCount).toBe(1);
		expect(hiveMind.points).toBe(1);
	});
});

describe('computeRecap — we all whiffed', () => {
	it('aggregates the settled fixtures where nobody picked the Result', () => {
		const users = [makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', result: 'AWAY', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// f1: both wrong → whiff. f2: a correct → not a whiff. f3: both wrong → whiff.
			makePick('a', 1, 'AWAY'),
			makePick('b', 1, 'AWAY'),
			makePick('a', 2, 'HOME'),
			makePick('b', 2, 'AWAY'),
			makePick('a', 3, 'HOME'),
			makePick('b', 3, 'HOME')
		];

		const { whiffed } = computeRecap(users, picks, fixtures);

		expect(whiffed.count).toBe(2);
		expect(whiffed.fixtures.map((f) => f.fixtureId)).toEqual([1, 3]);
		expect(whiffed.fixtures[1].result).toBe('AWAY');
		expect(whiffed.fixtures[1]).toMatchObject({ homeTeam: 'Home', awayTeam: 'Away' });
	});

	it('does not count a fixture nobody picked (a ghosted fixture is not a whiff)', () => {
		const users = [makeUser('a')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		// Only fixture 1 has a pick (correct). Fixture 2 has no picks at all.
		const picks = [makePick('a', 1, 'HOME')];

		const { whiffed } = computeRecap(users, picks, fixtures);

		expect(whiffed.count).toBe(0);
	});

	it('returns an empty whiffed aggregate for an empty pool', () => {
		const { whiffed } = computeRecap([], [], []);
		expect(whiffed.count).toBe(0);
		expect(whiffed.fixtures).toEqual([]);
	});
});

describe('computeRecap — The Fallen', () => {
	it('lists dropouts below the Active threshold with a last-seen date', () => {
		const users = [makeUser('faithful'), makeUser('dropout'), makeUser('never')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Group', result: 'HOME', kickoff: '2026-06-12T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Group', result: 'HOME', kickoff: '2026-06-13T18:00:00.000Z' }),
			makeFixture({ id: 4, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			// faithful: 4 of 4 → Active, not fallen.
			makePick('faithful', 1, 'HOME'),
			makePick('faithful', 2, 'HOME'),
			makePick('faithful', 3, 'HOME'),
			makePick('faithful', 4, 'HOME'),
			// dropout: 1 of 4 → below threshold → fallen, last seen at its pick time.
			makePickAt('dropout', 1, 'HOME', '2026-06-11T17:00:00.000Z')
			// never: zero picks → fallen with no last-seen date.
		];

		const { fallen } = computeRecap(users, picks, fixtures);

		const ids = fallen.map((f) => f.userId);
		expect(ids).toContain('dropout');
		expect(ids).toContain('never');
		expect(ids).not.toContain('faithful');
		const dropout = fallen.find((f) => f.userId === 'dropout')!;
		expect(dropout.lastSeen).toBe('2026-06-11T17:00:00.000Z');
		expect(dropout.pickCount).toBe(1);
		const never = fallen.find((f) => f.userId === 'never')!;
		expect(never.lastSeen).toBeNull();
		expect(never.pickCount).toBe(0);
	});

	it('derives last-seen from the latest Pick timestamp', () => {
		const users = [makeUser('faithful'), makeUser('dropout')];
		const fixtures = [1, 2, 3, 4, 5].map((id) =>
			makeFixture({
				id,
				stage: id === 5 ? 'Final' : 'Group',
				result: 'HOME',
				kickoff: `2026-06-1${id}T18:00:00.000Z`
			})
		);
		const picks = [
			makePick('faithful', 1, 'HOME'),
			makePick('faithful', 2, 'HOME'),
			makePick('faithful', 3, 'HOME'),
			makePick('faithful', 4, 'HOME'),
			makePick('faithful', 5, 'HOME'),
			// dropout: 2 of 5 → below threshold; last-seen is the later of its two picks.
			makePickAt('dropout', 1, 'HOME', '2026-06-11T12:00:00.000Z'),
			makePickAt('dropout', 2, 'HOME', '2026-06-12T20:00:00.000Z')
		];

		const { fallen } = computeRecap(users, picks, fixtures);

		const dropout = fallen.find((f) => f.userId === 'dropout')!;
		expect(dropout.lastSeen).toBe('2026-06-12T20:00:00.000Z');
	});

	it('degrades gracefully to empty when everyone is Active', () => {
		const users = [makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('a', 1, 'HOME'),
			makePick('a', 2, 'HOME'),
			makePick('b', 1, 'HOME'),
			makePick('b', 2, 'HOME')
		];

		const { fallen } = computeRecap(users, picks, fixtures);

		expect(fallen).toEqual([]);
	});

	it('returns no Fallen when nothing has settled yet', () => {
		const users = [makeUser('a')];
		const fixtures = [makeFixture({ id: 1, stage: 'Final', result: null })];

		const { fallen } = computeRecap(users, [], fixtures);

		expect(fallen).toEqual([]);
	});
});

describe('computeRecap — closer', () => {
	it('crowns the champion (final rank 1) for the gold-foil closer', () => {
		const users = [makeUser('champ'), makeUser('other')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [
			makePick('champ', 1, 'HOME'),
			makePick('champ', 2, 'HOME'),
			makePick('other', 1, 'HOME')
		];

		const { closer } = computeRecap(users, picks, fixtures);

		expect(closer.champions.map((c) => c.userId)).toEqual(['champ']);
		expect(closer.tied).toBe(false);
	});

	it('shares the crown on a tie for first', () => {
		const users = [makeUser('a'), makeUser('b')];
		const fixtures = [
			makeFixture({ id: 1, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [makePick('a', 1, 'HOME'), makePick('b', 1, 'HOME')];

		const { closer } = computeRecap(users, picks, fixtures);

		expect(closer.champions.map((c) => c.userId).sort()).toEqual(['a', 'b']);
		expect(closer.tied).toBe(true);
	});

	it('reports a coin-flip baseline from the settled fixtures', () => {
		const users = [makeUser('a')];
		const fixtures = [
			// One Final only: a 50/50 monkey expects 0.5 × 6 = 3 pts.
			makeFixture({ id: 1, stage: 'Final', result: 'HOME', kickoff: '2026-07-19T18:00:00.000Z' })
		];
		const picks = [makePick('a', 1, 'HOME')];

		const { closer } = computeRecap(users, picks, fixtures);

		expect(closer.coinFlipPoints).toBe(3);
	});

	it('returns an empty closer for an empty pool without throwing', () => {
		const { closer } = computeRecap([], [], []);
		expect(closer.champions).toEqual([]);
		expect(closer.tied).toBe(false);
		expect(closer.coinFlipPoints).toBe(0);
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
