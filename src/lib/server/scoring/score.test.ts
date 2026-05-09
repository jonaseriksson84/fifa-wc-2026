import { describe, it, expect } from 'vitest';
import { computeScores, type ScoringPick, type ScoringFixture } from './score';

function makeFixture(
	overrides: Partial<ScoringFixture> & { id: number; stage: string }
): ScoringFixture {
	return { result: null, ...overrides };
}

function makePick(userId: string, fixtureId: number, value: string): ScoringPick {
	return { userId, fixtureId, value };
}

describe('computeScores', () => {
	it('awards 1pt for a correct HOME pick on a group fixture', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'HOME' })];
		const picks = [makePick('u1', 1, 'HOME')];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBe(1);
	});

	it('awards 1pt for a correct DRAW pick on a group fixture', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'DRAW' })];
		const picks = [makePick('u1', 1, 'DRAW')];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBe(1);
	});

	it('awards stage weight for a correct knockout pick', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'QF', result: 'HOME' })];
		const picks = [makePick('u1', 1, 'HOME')];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBe(2);
	});

	it('applies correct stage weights: Group=1, R32/R16/QF/SF=2, 3rd-place=3, Final=5', () => {
		const stages = [
			{ stage: 'Group', weight: 1 },
			{ stage: 'R32', weight: 2 },
			{ stage: 'R16', weight: 2 },
			{ stage: 'QF', weight: 2 },
			{ stage: 'SF', weight: 2 },
			{ stage: '3rd-place', weight: 3 },
			{ stage: 'Final', weight: 5 }
		];

		for (const { stage, weight } of stages) {
			const fixtures = [makeFixture({ id: 1, stage, result: 'AWAY' })];
			const picks = [makePick('u1', 1, 'AWAY')];

			const scores = computeScores(picks, fixtures);

			expect(scores.get('u1'), `${stage} should be worth ${weight}pt`).toBe(weight);
		}
	});

	it('scores zero for a missing pick', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'HOME' })];
		const picks: ScoringPick[] = [];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBeUndefined();
	});

	it('scores zero for a wrong pick', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'HOME' })];
		const picks = [makePick('u1', 1, 'AWAY')];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBe(0);
	});

	it('scores zero on fixtures with null result (not yet played)', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: null })];
		const picks = [makePick('u1', 1, 'HOME')];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBe(0);
	});

	it('scores zero for a late joiner on past fixtures they did not pick', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Group', result: 'AWAY' }),
			makeFixture({ id: 3, stage: 'R16', result: 'HOME' })
		];
		const picks = [makePick('late-user', 3, 'HOME')];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('late-user')).toBe(2);
	});

	it('handles multiple users with correct totals', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Group', result: 'DRAW' })
		];
		const picks = [
			makePick('u1', 1, 'HOME'),
			makePick('u1', 2, 'DRAW'),
			makePick('u2', 1, 'AWAY'),
			makePick('u2', 2, 'DRAW')
		];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('u1')).toBe(2);
		expect(scores.get('u2')).toBe(1);
	});

	it('full-tournament sanity: known inputs produce exact expected totals', () => {
		const fixtures: ScoringFixture[] = [
			// 3 group fixtures
			{ id: 1, stage: 'Group', result: 'HOME' },
			{ id: 2, stage: 'Group', result: 'DRAW' },
			{ id: 3, stage: 'Group', result: 'AWAY' },
			// 1 R32
			{ id: 4, stage: 'R32', result: 'HOME' },
			// 1 R16
			{ id: 5, stage: 'R16', result: 'AWAY' },
			// 1 QF
			{ id: 6, stage: 'QF', result: 'HOME' },
			// 1 SF
			{ id: 7, stage: 'SF', result: 'AWAY' },
			// 1 3rd-place
			{ id: 8, stage: '3rd-place', result: 'HOME' },
			// 1 Final
			{ id: 9, stage: 'Final', result: 'HOME' },
			// 1 unplayed
			{ id: 10, stage: 'Group', result: null }
		];

		const picks: ScoringPick[] = [
			// Alice: gets everything right except fixture 2 and 10 (unplayed)
			// Group: 1+0+1=2, R32: 2, R16: 2, QF: 2, SF: 2, 3rd: 3, Final: 5 => 18
			makePick('alice', 1, 'HOME'),
			makePick('alice', 2, 'HOME'), // wrong
			makePick('alice', 3, 'AWAY'),
			makePick('alice', 4, 'HOME'),
			makePick('alice', 5, 'AWAY'),
			makePick('alice', 6, 'HOME'),
			makePick('alice', 7, 'AWAY'),
			makePick('alice', 8, 'HOME'),
			makePick('alice', 9, 'HOME'),
			makePick('alice', 10, 'HOME'), // unplayed

			// Bob: only picks groups, gets 2 right
			// Group: 1+1+0=2
			makePick('bob', 1, 'HOME'),
			makePick('bob', 2, 'DRAW'),
			makePick('bob', 3, 'HOME'), // wrong

			// Carol: late joiner, only picks from SF onward, gets all right
			// SF: 2, 3rd: 3, Final: 5 => 10
			makePick('carol', 7, 'AWAY'),
			makePick('carol', 8, 'HOME'),
			makePick('carol', 9, 'HOME'),

			// Dave: picks everything wrong => 0
			makePick('dave', 1, 'AWAY'),
			makePick('dave', 2, 'HOME'),
			makePick('dave', 3, 'HOME'),
			makePick('dave', 4, 'AWAY'),
			makePick('dave', 5, 'HOME'),
			makePick('dave', 6, 'AWAY'),
			makePick('dave', 7, 'HOME'),
			makePick('dave', 8, 'AWAY'),
			makePick('dave', 9, 'AWAY')
		];

		const scores = computeScores(picks, fixtures);

		expect(scores.get('alice')).toBe(18);
		expect(scores.get('bob')).toBe(2);
		expect(scores.get('carol')).toBe(10);
		expect(scores.get('dave')).toBe(0);
	});

	it('returns an empty map when there are no picks', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'HOME' })];
		const scores = computeScores([], fixtures);

		expect(scores.size).toBe(0);
	});
});
