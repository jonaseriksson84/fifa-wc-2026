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

	const body = (await res.json()) as ApiResponse;
	// API-Football signals rate limits and other failures as HTTP 200 with a
	// populated `errors` envelope. Without this check a throttled response looks
	// like an empty fixtures list — harmless for the result poller (it just
	// retries) but it silently stalls the daily fixture refresh. We share one
	// subscription across sibling apps, so throttling is expected under load;
	// throw so the failure is visible and the cron doesn't act on empty data.
	if (hasErrors(body.errors)) {
		throw new Error(`api-football ${path} returned errors: ${JSON.stringify(body.errors)}`);
	}
	return body;
}

function hasErrors(errors: unknown): boolean {
	if (Array.isArray(errors)) return errors.length > 0;
	if (errors && typeof errors === 'object') return Object.keys(errors).length > 0;
	return Boolean(errors);
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

	return data.response.map(mapResult).filter((r): r is DomainResult => r !== null);
}
