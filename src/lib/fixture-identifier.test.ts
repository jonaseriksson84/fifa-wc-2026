import { describe, it, expect } from 'vitest';
import { fixtureIdentifier } from './fixture-identifier';

describe('fixtureIdentifier', () => {
	it('labels Group fixtures as M.01, M.02, ...', () => {
		expect(fixtureIdentifier('Group', 0)).toBe('M.01');
		expect(fixtureIdentifier('Group', 1)).toBe('M.02');
		expect(fixtureIdentifier('Group', 9)).toBe('M.10');
	});

	it('labels R32 fixtures as R32.01, R32.02, ...', () => {
		expect(fixtureIdentifier('R32', 0)).toBe('R32.01');
		expect(fixtureIdentifier('R32', 3)).toBe('R32.04');
	});

	it('labels R16 fixtures as R16.01, ...', () => {
		expect(fixtureIdentifier('R16', 0)).toBe('R16.01');
	});

	it('labels QF fixtures as QF.01, ...', () => {
		expect(fixtureIdentifier('QF', 0)).toBe('QF.01');
		expect(fixtureIdentifier('QF', 3)).toBe('QF.04');
	});

	it('labels SF fixtures as SF.01, ...', () => {
		expect(fixtureIdentifier('SF', 0)).toBe('SF.01');
		expect(fixtureIdentifier('SF', 1)).toBe('SF.02');
	});

	it('labels 3rd-place as 3PP', () => {
		expect(fixtureIdentifier('3rd-place', 0)).toBe('3PP');
	});

	it('labels Final as FNL', () => {
		expect(fixtureIdentifier('Final', 0)).toBe('FNL');
	});
});
