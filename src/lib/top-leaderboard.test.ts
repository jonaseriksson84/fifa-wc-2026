import { describe, it, expect } from 'vitest';
import { rankEntries, topN } from './top-leaderboard';

type Entry = { userId: string; points: number; rank: number };

function makeEntry(id: string, points: number, rank: number): Entry {
	return { userId: id, points, rank };
}

describe('rankEntries', () => {
	it('sorts by descending points and assigns sequential ranks', () => {
		const result = rankEntries([{ points: 3 }, { points: 10 }, { points: 7 }]);
		expect(result.map((e) => e.points)).toEqual([10, 7, 3]);
		expect(result.map((e) => e.rank)).toEqual([1, 2, 3]);
	});

	it('gives tied entries the same rank and skips subsequent ranks', () => {
		const result = rankEntries([
			{ points: 10 },
			{ points: 7 },
			{ points: 7 },
			{ points: 3 }
		]);
		expect(result.map((e) => e.rank)).toEqual([1, 2, 2, 4]);
	});

	it('marks tied entries with tied=true', () => {
		const result = rankEntries([
			{ points: 10 },
			{ points: 7 },
			{ points: 7 },
			{ points: 3 }
		]);
		expect(result.map((e) => e.tied)).toEqual([false, true, true, false]);
	});

	it('returns empty array for empty input', () => {
		expect(rankEntries([])).toEqual([]);
	});

	it('does not mutate the original array', () => {
		const entries = [{ points: 3 }, { points: 10 }];
		const copy = [{ points: 3 }, { points: 10 }];
		rankEntries(entries);
		expect(entries).toEqual(copy);
	});

	it('preserves extra properties on entries', () => {
		const result = rankEntries([{ points: 5, name: 'alice' }]);
		expect(result[0].name).toBe('alice');
	});
});

describe('topN', () => {
	it('returns exactly N entries when there are more than N with no ties at the boundary', () => {
		const entries = [
			makeEntry('a', 10, 1),
			makeEntry('b', 9, 2),
			makeEntry('c', 8, 3),
			makeEntry('d', 7, 4),
			makeEntry('e', 6, 5)
		];
		expect(topN(entries, 3)).toHaveLength(3);
		expect(topN(entries, 3).map((e) => e.userId)).toEqual(['a', 'b', 'c']);
	});

	it('returns all entries when fewer than N exist', () => {
		const entries = [makeEntry('a', 10, 1), makeEntry('b', 5, 2)];
		expect(topN(entries, 5)).toHaveLength(2);
	});

	it('returns exactly N entries when there are exactly N', () => {
		const entries = [
			makeEntry('a', 10, 1),
			makeEntry('b', 9, 2),
			makeEntry('c', 8, 3)
		];
		expect(topN(entries, 3)).toHaveLength(3);
	});

	it('extends past N when the Nth entry is tied with N+1', () => {
		const entries = [
			makeEntry('a', 10, 1),
			makeEntry('b', 8, 2),
			makeEntry('c', 5, 3),
			makeEntry('d', 5, 3),
			makeEntry('e', 2, 5)
		];
		const result = topN(entries, 3);
		expect(result).toHaveLength(4);
		expect(result.map((e) => e.userId)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('extends past N when the Nth entry is tied with multiple followers', () => {
		const entries = [
			makeEntry('a', 10, 1),
			makeEntry('b', 5, 2),
			makeEntry('c', 5, 2),
			makeEntry('d', 5, 2),
			makeEntry('e', 1, 5)
		];
		const result = topN(entries, 2);
		expect(result).toHaveLength(4);
		expect(result.map((e) => e.userId)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('returns empty array for empty input', () => {
		expect(topN([], 10)).toEqual([]);
	});

	it('returns all entries when every entry is tied', () => {
		const entries = [
			makeEntry('a', 5, 1),
			makeEntry('b', 5, 1),
			makeEntry('c', 5, 1)
		];
		const result = topN(entries, 2);
		expect(result).toHaveLength(3);
	});
});
