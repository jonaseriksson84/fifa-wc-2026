import { describe, it, expect } from 'vitest';
import { isLocked, isOpenForPicks } from './lock-time';

const kickoff = '2026-06-11T18:00:00.000Z';

describe('isLocked', () => {
	it('is true at exactly kickoff (Lock time == kickoff per CONTEXT.md)', () => {
		expect(isLocked(kickoff, new Date('2026-06-11T18:00:00.000Z'))).toBe(true);
	});

	it('is true after kickoff', () => {
		expect(isLocked(kickoff, new Date('2026-06-11T18:00:00.001Z'))).toBe(true);
		expect(isLocked(kickoff, new Date('2026-06-12T00:00:00.000Z'))).toBe(true);
	});

	it('is false 1 ms before kickoff', () => {
		expect(isLocked(kickoff, new Date('2026-06-11T17:59:59.999Z'))).toBe(false);
	});

	it('is false well before kickoff', () => {
		expect(isLocked(kickoff, new Date('2026-06-10T12:00:00.000Z'))).toBe(false);
	});
});

describe('isOpenForPicks', () => {
	it('is the complement of isLocked', () => {
		const samples = [
			'2026-06-10T12:00:00.000Z',
			'2026-06-11T17:59:59.999Z',
			'2026-06-11T18:00:00.000Z',
			'2026-06-11T18:00:00.001Z'
		];
		for (const t of samples) {
			expect(isOpenForPicks(kickoff, new Date(t))).toBe(!isLocked(kickoff, new Date(t)));
		}
	});

	it('is true 1 ms before kickoff', () => {
		expect(isOpenForPicks(kickoff, new Date('2026-06-11T17:59:59.999Z'))).toBe(true);
	});

	it('is false at exactly kickoff', () => {
		expect(isOpenForPicks(kickoff, new Date('2026-06-11T18:00:00.000Z'))).toBe(false);
	});
});
