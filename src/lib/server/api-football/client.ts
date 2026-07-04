import type { ApiResponse, DomainFixture, DomainResult } from './types';
import { mapFixture, mapResult } from './mapper';

const BASE_URL = 'https://v3.football.api-sports.io';
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

/**
 * Thrown when api-football rejects a request with its per-minute rate-limit
 * envelope. Distinct from a generic failure so callers that can afford to wait
 * (the daily fixture refresher) can retry, while callers that can't (the
 * frequent result poller) just surface it and catch up next run.
 */
export class ApiFootballRateLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ApiFootballRateLimitError';
	}
}

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
		const detail = `api-football ${path} returned errors: ${JSON.stringify(body.errors)}`;
		if (isRateLimit(body.errors)) {
			throw new ApiFootballRateLimitError(detail);
		}
		throw new Error(detail);
	}
	return body;
}

function hasErrors(errors: unknown): boolean {
	if (Array.isArray(errors)) return errors.length > 0;
	if (errors && typeof errors === 'object') return Object.keys(errors).length > 0;
	return Boolean(errors);
}

// api-football signals throttling as `{ rateLimit: "Too many requests..." }`.
// Match on the key (and, defensively, the message text) so a transient
// per-minute limit is retryable rather than fatal.
function isRateLimit(errors: unknown): boolean {
	if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
		if ('rateLimit' in errors) return true;
	}
	return /rate.?limit|too many requests/i.test(JSON.stringify(errors));
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
