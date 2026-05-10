import { describe, it, expect } from 'vitest';
import { albumProgress, type AlbumFixture } from './album-progress';

function makeFixture(result: string | null): AlbumFixture {
	return { result };
}

describe('albumProgress', () => {
	it('returns zeros for an empty fixture list', () => {
		const progress = albumProgress([]);
		expect(progress).toEqual({ stuck: 0, total: 0, remaining: 0, percent: 0 });
	});

	it('returns all remaining when no fixtures have results', () => {
		const fixtures = [makeFixture(null), makeFixture(null), makeFixture(null)];
		const progress = albumProgress(fixtures);
		expect(progress).toEqual({ stuck: 0, total: 3, remaining: 3, percent: 0 });
	});

	it('counts fixtures with results as stuck', () => {
		const fixtures = [
			makeFixture('HOME'),
			makeFixture(null),
			makeFixture('AWAY'),
			makeFixture(null),
			makeFixture('DRAW')
		];
		const progress = albumProgress(fixtures);
		expect(progress).toEqual({ stuck: 3, total: 5, remaining: 2, percent: 60 });
	});

	it('returns 100% when all fixtures are resolved', () => {
		const fixtures = [makeFixture('HOME'), makeFixture('AWAY'), makeFixture('DRAW')];
		const progress = albumProgress(fixtures);
		expect(progress).toEqual({ stuck: 3, total: 3, remaining: 0, percent: 100 });
	});

	it('rounds percent to the nearest integer', () => {
		const fixtures = [makeFixture('HOME'), makeFixture(null), makeFixture(null)];
		const progress = albumProgress(fixtures);
		expect(progress.percent).toBe(33);
	});

	it('counts are global, not per-user', () => {
		const fixtures = Array.from({ length: 64 }, (_, i) =>
			makeFixture(i < 20 ? 'HOME' : null)
		);
		const progress = albumProgress(fixtures);
		expect(progress).toEqual({ stuck: 20, total: 64, remaining: 44, percent: 31 });
	});
});
