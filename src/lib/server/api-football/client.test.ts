import { describe, it, expect, vi } from 'vitest';
import { fetchFixtures, fetchFinishedResults } from './client';
import type { ApiFixtureResponse } from './types';

import groupHomeWin from '../../../../tests/fixtures/api-football/group-home-win.json';
import notStarted from '../../../../tests/fixtures/api-football/not-started.json';
import knockoutPenalties from '../../../../tests/fixtures/api-football/knockout-penalties.json';

function mockFetch(response: ApiFixtureResponse[]) {
	return vi.fn().mockResolvedValue({
		ok: true,
		json: () => Promise.resolve({ response })
	});
}

describe('fetchFixtures', () => {
	it('sends correct auth headers and query params', async () => {
		const fetch = mockFetch([groupHomeWin as ApiFixtureResponse]);
		await fetchFixtures({ apiKey: 'test-key', fetch });

		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0];
		expect(url).toContain('/fixtures');
		expect(url).toContain('league=1');
		expect(url).toContain('season=2026');
		expect(init.headers['x-rapidapi-key']).toBe('test-key');
	});

	it('returns mapped domain fixtures', async () => {
		const fetch = mockFetch([
			groupHomeWin as ApiFixtureResponse,
			notStarted as ApiFixtureResponse
		]);
		const fixtures = await fetchFixtures({ apiKey: 'test-key', fetch });

		expect(fixtures).toHaveLength(2);
		expect(fixtures[0].homeTeam).toBe('Mexico');
		expect(fixtures[1].stage).toBe('Final');
	});

	it('throws on non-ok response', async () => {
		const fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 429,
			statusText: 'Too Many Requests'
		});

		await expect(fetchFixtures({ apiKey: 'key', fetch })).rejects.toThrow('429');
	});
});

describe('fetchFinishedResults', () => {
	it('returns empty array for empty input', async () => {
		const fetch = vi.fn();
		const results = await fetchFinishedResults([], { apiKey: 'key', fetch });
		expect(results).toEqual([]);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('joins fixture IDs with hyphens in the request', async () => {
		const fetch = mockFetch([]);
		await fetchFinishedResults([100, 200, 300], { apiKey: 'key', fetch });

		const [url] = fetch.mock.calls[0];
		expect(url).toContain('ids=100-200-300');
	});

	it('filters out unfinished fixtures from results', async () => {
		const fetch = mockFetch([
			knockoutPenalties as ApiFixtureResponse,
			notStarted as ApiFixtureResponse
		]);
		const results = await fetchFinishedResults([1145580, 1145590], {
			apiKey: 'key',
			fetch
		});

		expect(results).toHaveLength(1);
		expect(results[0].apiFootballId).toBe(1145580);
		expect(results[0].result).toBe('HOME');
	});
});
