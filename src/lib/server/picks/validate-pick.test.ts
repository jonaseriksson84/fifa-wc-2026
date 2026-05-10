import { describe, it, expect } from 'vitest';
import { validatePick } from './validate-pick';

const groupFixture = {
	id: 1,
	stage: 'Group',
	kickoff: '2026-06-11T18:00:00Z',
	homeTeam: 'Sweden',
	awayTeam: 'Brazil'
};

const knockoutStages = ['R32', 'R16', 'QF', 'SF', '3rd-place', 'Final'] as const;

function makeKnockoutFixture(stage: string) {
	return { id: 2, stage, kickoff: '2026-07-10T20:00:00Z', homeTeam: 'France', awayTeam: 'Germany' };
}

const beforeKickoff = new Date('2026-06-11T17:59:59.000Z');
const atKickoff = new Date('2026-06-11T18:00:00.000Z');
const oneMillisecondBefore = new Date('2026-06-11T17:59:59.999Z');

describe('validatePick', () => {
	describe('group fixtures before lock', () => {
		it('accepts HOME', () => {
			const result = validatePick(groupFixture, 'HOME', beforeKickoff);
			expect(result).toEqual({ valid: true });
		});

		it('accepts DRAW', () => {
			const result = validatePick(groupFixture, 'DRAW', beforeKickoff);
			expect(result).toEqual({ valid: true });
		});

		it('accepts AWAY', () => {
			const result = validatePick(groupFixture, 'AWAY', beforeKickoff);
			expect(result).toEqual({ valid: true });
		});
	});

	describe('knockout fixtures before lock', () => {
		it('accepts HOME on knockouts', () => {
			for (const stage of knockoutStages) {
				const f = makeKnockoutFixture(stage);
				const result = validatePick(f, 'HOME', new Date('2026-07-10T19:00:00Z'));
				expect(result).toEqual({ valid: true });
			}
		});

		it('accepts AWAY on knockouts', () => {
			for (const stage of knockoutStages) {
				const f = makeKnockoutFixture(stage);
				const result = validatePick(f, 'AWAY', new Date('2026-07-10T19:00:00Z'));
				expect(result).toEqual({ valid: true });
			}
		});

		it('rejects DRAW on every knockout stage', () => {
			for (const stage of knockoutStages) {
				const f = makeKnockoutFixture(stage);
				const result = validatePick(f, 'DRAW', new Date('2026-07-10T19:00:00Z'));
				expect(result).toEqual({
					valid: false,
					reason: 'draw_not_allowed'
				});
			}
		});
	});

	describe('TBD fixtures (teams not yet known)', () => {
		it('rejects pick when home team is a placeholder', () => {
			const f = { ...groupFixture, homeTeam: 'Winner Group A' };
			const result = validatePick(f, 'HOME', beforeKickoff);
			expect(result).toEqual({ valid: false, reason: 'teams_not_known' });
		});

		it('rejects pick when away team is a placeholder', () => {
			const f = { ...groupFixture, awayTeam: 'Runner-up Group B' };
			const result = validatePick(f, 'HOME', beforeKickoff);
			expect(result).toEqual({ valid: false, reason: 'teams_not_known' });
		});

		it('rejects pick when both teams are placeholders', () => {
			const f = { ...groupFixture, homeTeam: 'Winner Group A', awayTeam: 'Runner-up Group B' };
			const result = validatePick(f, 'HOME', beforeKickoff);
			expect(result).toEqual({ valid: false, reason: 'teams_not_known' });
		});
	});

	describe('lock time boundary', () => {
		it('rejects any value at exactly kickoff time', () => {
			const result = validatePick(groupFixture, 'HOME', atKickoff);
			expect(result).toEqual({ valid: false, reason: 'fixture_locked' });
		});

		it('rejects any value after kickoff', () => {
			const afterKickoff = new Date('2026-06-12T00:00:00Z');
			const result = validatePick(groupFixture, 'AWAY', afterKickoff);
			expect(result).toEqual({ valid: false, reason: 'fixture_locked' });
		});

		it('accepts a pick exactly 1ms before kickoff', () => {
			const result = validatePick(groupFixture, 'HOME', oneMillisecondBefore);
			expect(result).toEqual({ valid: true });
		});
	});
});
