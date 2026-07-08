import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pageSvelte = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');
const titleCard = readFileSync(
	resolve(__dirname, '../../lib/components/RecapTitleCard.svelte'),
	'utf-8'
);
const scrollReveal = readFileSync(
	resolve(__dirname, '../../lib/components/ScrollReveal.svelte'),
	'utf-8'
);
const raceChart = readFileSync(
	resolve(__dirname, '../../lib/components/RecapRaceChart.svelte'),
	'utf-8'
);
const pageHtml = pageSvelte + titleCard + scrollReveal + raceChart;
const pageLower = pageHtml.toLowerCase();
const serverTs = readFileSync(resolve(__dirname, '+page.server.ts'), 'utf-8');

describe('recap page content', () => {
	it('uses domain language and never the forbidden vocabulary', () => {
		expect(pageHtml).toContain('Recap');
		expect(pageHtml).toContain('players');
		expect(pageHtml).toContain('fixtures');
		expect(pageLower).not.toMatch(/\bbet\b/);
		expect(pageLower).not.toMatch(/\bguess\b/);
		expect(pageLower).not.toMatch(/\bwrapped\b/);
	});

	it('shows a come-back-after-the-Final placeholder gated on availability', () => {
		expect(pageHtml).toContain('recap.available');
		expect(pageLower).toContain('come back after the final');
	});

	it('renders the title-card beat with fixture and player counts when available', () => {
		expect(pageHtml).toContain('RecapTitleCard');
		expect(pageHtml).toContain('fixtureCount');
		expect(pageHtml).toContain('playerCount');
	});

	it('opens the title card with the tournament name', () => {
		expect(titleCard).toContain('FIFA World Cup 2026');
	});

	it('plays the title card in with the scroll-reveal primitive', () => {
		expect(pageHtml).toContain('ScrollReveal');
	});

	it('renders the race chart beat fed from the seam', () => {
		expect(pageSvelte).toContain('RecapRaceChart');
		expect(pageSvelte).toContain('recap.race');
	});
});

describe('recap race chart beat', () => {
	it('draws one animated line per user from the cumulative series', () => {
		// SVG polyline/path per user, drawn from the seam's cumulative points.
		expect(raceChart).toContain('series');
		expect(raceChart).toContain('cumulative');
		expect(raceChart).toMatch(/<svg/);
		expect(raceChart).toMatch(/polyline|path/);
	});

	it('animates the draw when it scrolls into view and respects reduced motion', () => {
		expect(raceChart).toContain('IntersectionObserver');
		expect(raceChart).toContain('prefers-reduced-motion');
	});

	it('lights up the podium — the top three — as the reveal', () => {
		expect(raceChart).toContain('isPodium');
		expect(raceChart.toLowerCase()).toContain('podium');
	});

	it('annotates lead changes with how long each leader held the crown', () => {
		expect(raceChart).toContain('leadSegments');
		expect(raceChart).toMatch(/led for|days/i);
	});

	it('never uses the forbidden vocabulary', () => {
		const lower = raceChart.toLowerCase();
		expect(lower).not.toMatch(/\bbet\b/);
		expect(lower).not.toMatch(/\bguess\b/);
	});
});

describe('recap scroll-reveal primitive', () => {
	it('reveals its content on entering the viewport via IntersectionObserver', () => {
		expect(scrollReveal).toContain('IntersectionObserver');
		expect(scrollReveal).toContain('isIntersecting');
	});

	it('respects reduced-motion preferences', () => {
		expect(scrollReveal).toContain('prefers-reduced-motion');
	});

	it('exposes a reveal hook usable by later beats', () => {
		expect(scrollReveal).toContain('data-scroll-reveal');
	});
});

describe('recap page server — thin adapter', () => {
	it('delegates all Recap logic to the computeRecap seam', () => {
		expect(serverTs).toContain('computeRecap');
	});

	it('reads users, picks, and fixtures like the leaderboard loader', () => {
		expect(serverTs).toContain('fixture');
		expect(serverTs).toContain('getAllPicks');
		expect(serverTs).toContain('user');
	});

	it('does NOT guard the route behind a session (public-after-lock data)', () => {
		expect(serverTs).not.toMatch(/if\s*\(\s*!locals\.user\s*\)\s*throw\s+redirect/);
	});
});
