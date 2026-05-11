import { describe, it, expect } from 'vitest';
import { STAGES, getStage, type Stage } from './stage';

const allStages: Stage[] = ['Group', 'R32', 'R16', 'QF', 'SF', '3rd-place', 'Final'];

describe('STAGES table', () => {
	it('contains all 7 WC 2026 stages', () => {
		expect(Object.keys(STAGES).sort()).toEqual([...allStages].sort());
	});

	it('weights match CONTEXT.md (Group=1, R32/R16=2, QF/SF=3, 3rd=4, Final=6)', () => {
		expect(STAGES.Group.weight).toBe(1);
		expect(STAGES.R32.weight).toBe(2);
		expect(STAGES.R16.weight).toBe(2);
		expect(STAGES.QF.weight).toBe(3);
		expect(STAGES.SF.weight).toBe(3);
		expect(STAGES['3rd-place'].weight).toBe(4);
		expect(STAGES.Final.weight).toBe(6);
	});

	it('foil tiers map paper/pearl/holo/gold/legendary 1:1 to stages', () => {
		expect(STAGES.Group.foilTier).toBe('paper');
		expect(STAGES.R32.foilTier).toBe('pearl');
		expect(STAGES.R16.foilTier).toBe('pearl');
		expect(STAGES.QF.foilTier).toBe('holo');
		expect(STAGES.SF.foilTier).toBe('holo');
		expect(STAGES['3rd-place'].foilTier).toBe('gold');
		expect(STAGES.Final.foilTier).toBe('legendary');
	});

	it('only Group is non-knockout', () => {
		expect(STAGES.Group.isKnockout).toBe(false);
		for (const s of allStages.filter((s) => s !== 'Group')) {
			expect(STAGES[s].isKnockout).toBe(true);
		}
	});

	it('sortIndex orders stages by tournament progression', () => {
		const sorted = [...allStages].sort((a, b) => STAGES[a].sortIndex - STAGES[b].sortIndex);
		expect(sorted).toEqual(['Group', 'R32', 'R16', 'QF', 'SF', '3rd-place', 'Final']);
	});

	it('identifierIsSingleton is true only for 3rd-place and Final', () => {
		expect(STAGES['3rd-place'].identifierIsSingleton).toBe(true);
		expect(STAGES.Final.identifierIsSingleton).toBe(true);
		for (const s of allStages.filter((s) => s !== '3rd-place' && s !== 'Final')) {
			expect(STAGES[s].identifierIsSingleton).toBe(false);
		}
	});
});

describe('getStage', () => {
	it('returns the StageInfo row for a known stage', () => {
		expect(getStage('QF').weight).toBe(3);
		expect(getStage('Final').foilTier).toBe('legendary');
	});

	it('throws on an unknown stage', () => {
		expect(() => getStage('Quarterfinals')).toThrow(/Unknown stage/);
		expect(() => getStage('')).toThrow();
		expect(() => getStage('QF ')).toThrow();
	});
});
