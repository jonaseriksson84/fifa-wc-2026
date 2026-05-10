import { describe, it, expect } from 'vitest';
import { foilTier, type FoilTier } from './foil-tier';

describe('foilTier', () => {
	it('maps Group to paper', () => {
		expect(foilTier('Group')).toBe('paper');
	});

	it('maps R32 to pearl', () => {
		expect(foilTier('R32')).toBe('pearl');
	});

	it('maps R16 to pearl', () => {
		expect(foilTier('R16')).toBe('pearl');
	});

	it('maps QF to holo', () => {
		expect(foilTier('QF')).toBe('holo');
	});

	it('maps SF to holo', () => {
		expect(foilTier('SF')).toBe('holo');
	});

	it('maps 3rd-place to gold', () => {
		expect(foilTier('3rd-place')).toBe('gold');
	});

	it('maps Final to legendary', () => {
		expect(foilTier('Final')).toBe('legendary');
	});

	it('throws on unknown stage', () => {
		expect(() => foilTier('Unknown')).toThrow();
	});
});
