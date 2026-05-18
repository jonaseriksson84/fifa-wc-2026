import { describe, it, expect } from 'vitest';
import { formatKickoff } from './kickoff-format';

describe('formatKickoff', () => {
	it('formats a Thursday evening kickoff', () => {
		// 2026-06-11T21:00:00.000Z is a Thursday
		expect(formatKickoff('2026-06-11T21:00:00.000Z')).toBe('Thu June 11th 21:00');
	});

	it('formats a Monday early-morning kickoff', () => {
		// 2026-06-15T04:00:00.000Z is a Monday
		expect(formatKickoff('2026-06-15T04:00:00.000Z')).toBe('Mon June 15th 04:00');
	});

	it('handles 1st ordinal', () => {
		// 2026-07-01T18:00:00.000Z is a Wednesday
		expect(formatKickoff('2026-07-01T18:00:00.000Z')).toBe('Wed July 1st 18:00');
	});

	it('handles 2nd ordinal', () => {
		// 2026-07-02T15:00:00.000Z is a Thursday
		expect(formatKickoff('2026-07-02T15:00:00.000Z')).toBe('Thu July 2nd 15:00');
	});

	it('handles 3rd ordinal', () => {
		// 2026-07-03T18:00:00.000Z is a Friday
		expect(formatKickoff('2026-07-03T18:00:00.000Z')).toBe('Fri July 3rd 18:00');
	});

	it('handles 11th ordinal (not 11st)', () => {
		// 2026-06-11T21:00:00.000Z is a Thursday
		expect(formatKickoff('2026-06-11T21:00:00.000Z')).toBe('Thu June 11th 21:00');
	});

	it('handles 12th ordinal (not 12nd)', () => {
		// 2026-06-12T16:00:00.000Z is a Friday
		expect(formatKickoff('2026-06-12T16:00:00.000Z')).toBe('Fri June 12th 16:00');
	});

	it('handles 13th ordinal (not 13rd)', () => {
		// 2026-06-13T19:00:00.000Z is a Saturday
		expect(formatKickoff('2026-06-13T19:00:00.000Z')).toBe('Sat June 13th 19:00');
	});

	it('handles 21st ordinal', () => {
		// 2026-06-21T18:00:00.000Z is a Sunday
		expect(formatKickoff('2026-06-21T18:00:00.000Z')).toBe('Sun June 21st 18:00');
	});

	it('handles midnight as 00:00', () => {
		// 2026-07-19T00:00:00.000Z is a Sunday
		expect(formatKickoff('2026-07-19T00:00:00.000Z')).toBe('Sun July 19th 00:00');
	});
});
