import { describe, it, expect } from 'vitest';
import { isPoolFrozen } from './pool-frozen';

describe('isPoolFrozen', () => {
	it('is false when the var is unset', () => {
		expect(isPoolFrozen(undefined)).toBe(false);
	});

	it('is false when the var is empty', () => {
		expect(isPoolFrozen('')).toBe(false);
	});

	it('is true for "true"', () => {
		expect(isPoolFrozen('true')).toBe(true);
	});

	it('tolerates casing and surrounding whitespace', () => {
		expect(isPoolFrozen(' TRUE ')).toBe(true);
		expect(isPoolFrozen('True')).toBe(true);
	});

	it('is false for anything else — only an explicit "true" freezes a pool', () => {
		expect(isPoolFrozen('false')).toBe(false);
		expect(isPoolFrozen('1')).toBe(false);
		expect(isPoolFrozen('yes')).toBe(false);
	});
});
