import type { ApiResponse, DomainFixture, DomainResult } from './types';
import { mapFixture, mapResult } from './mapper';

const BASE_URL = 'https://v3.football.api-sports.io';
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

interface ClientOptions {
	apiKey: string;
	fetch?: typeof globalThis.fetch;
}

async function request(
	path: string,
	params: Record<string, string>,
	opts: ClientOptions
): Promise<ApiResponse> {
	const url = new URL(path, BASE_URL);
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}

	const fetchFn = opts.fetch ?? globalThis.fetch;
	const res = await fetchFn(url.toString(), {
		headers: {
			'x-rapidapi-key': opts.apiKey,
			'x-rapidapi-host': 'v3.football.api-sports.io'
		}
	});

	if (!res.ok) {
		throw new Error(`api-football request failed: ${res.status} ${res.statusText}`);
	}

	return res.json() as Promise<ApiResponse>;
}

export async function fetchFixtures(opts: ClientOptions): Promise<DomainFixture[]> {
	const data = await request(
		'/fixtures',
		{ league: String(WC_LEAGUE_ID), season: String(WC_SEASON) },
		opts
	);
	return data.response.map(mapFixture);
}

export async function fetchFinishedResults(
	fixtureIds: number[],
	opts: ClientOptions
): Promise<DomainResult[]> {
	if (fixtureIds.length === 0) return [];

	const data = await request(
		'/fixtures',
		{ ids: fixtureIds.join('-') },
		opts
	);

	const results: DomainResult[] = [];
	for (const entry of data.response) {
		const result = mapResult(entry);
		if (result !== null) results.push(result);
	}
	return results;
}
