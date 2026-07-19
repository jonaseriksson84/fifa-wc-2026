import { describe, expect, it } from 'vitest';
import { isWinnerBetLocked, withCanStillWin } from './winner-bet';

describe('withCanStillWin', () => {
	it('keeps all players eligible when no results have been scored', () => {
		const entries = withCanStillWin([
			{ userId: 'one', points: 0, maxPossible: 10 },
			{ userId: 'two', points: 0, maxPossible: 0 }
		]);

		expect(entries.map((entry) => entry.canStillWin)).toEqual([true, true]);
	});

	it("eliminates a player whose ceiling is below the leader's points", () => {
		const entries = withCanStillWin([
			{ userId: 'leader', points: 12, maxPossible: 16 },
			{ userId: 'out', points: 4, maxPossible: 11 }
		]);

		expect(entries.find((entry) => entry.userId === 'out')?.canStillWin).toBe(false);
	});

	it('always keeps the current leader eligible', () => {
		const [leader] = withCanStillWin([{ userId: 'leader', points: 12, maxPossible: 0 }]);

		expect(leader.canStillWin).toBe(true);
	});
});

describe('isWinnerBetLocked', () => {
	const finalKickoff = '2026-07-19T19:00:00.000Z';

	it('is open before the Final kicks off', () => {
		expect(isWinnerBetLocked(finalKickoff, new Date('2026-07-19T18:59:59.999Z'))).toBe(false);
	});

	it('locks at the Final kickoff', () => {
		expect(isWinnerBetLocked(finalKickoff, new Date(finalKickoff))).toBe(true);
	});

	it('stays locked after the Final kickoff', () => {
		expect(isWinnerBetLocked(finalKickoff, new Date('2026-07-19T19:00:00.001Z'))).toBe(true);
	});

	it('is open when no Final fixture exists', () => {
		expect(isWinnerBetLocked(null, new Date('2026-07-19T20:00:00.000Z'))).toBe(false);
	});
});
