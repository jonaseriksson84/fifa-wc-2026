import { describe, it, expect } from 'vitest';
import { formatFinalScore } from './final-score';

describe('formatFinalScore', () => {
	it('formats a 90-minute result as H-A', () => {
		expect(formatFinalScore({ ft: [2, 1], et: null, pens: null })).toBe('2-1');
	});

	it('formats a group draw as H-A', () => {
		expect(formatFinalScore({ ft: [1, 1], et: null, pens: null })).toBe('1-1');
	});

	it('formats an ET-decided result as FT a.e.t. ET', () => {
		expect(formatFinalScore({ ft: [2, 2], et: [3, 2], pens: null })).toBe('2-2 a.e.t. 3-2');
	});

	it('formats a penalty-decided result as FT (H-A pen.)', () => {
		expect(formatFinalScore({ ft: [1, 1], et: [1, 1], pens: [5, 3] })).toBe('1-1 (5-3 pen.)');
	});

	it('returns empty string for null input', () => {
		expect(formatFinalScore(null)).toBe('');
	});

	it('handles a 0-0 draw', () => {
		expect(formatFinalScore({ ft: [0, 0], et: null, pens: null })).toBe('0-0');
	});

	it('handles ET with higher scores', () => {
		expect(formatFinalScore({ ft: [3, 3], et: [4, 3], pens: null })).toBe('3-3 a.e.t. 4-3');
	});
});
