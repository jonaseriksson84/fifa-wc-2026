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
const heatmap = readFileSync(
	resolve(__dirname, '../../lib/components/RecapHeatmap.svelte'),
	'utf-8'
);
const awards = readFileSync(
	resolve(__dirname, '../../lib/components/RecapAwards.svelte'),
	'utf-8'
);
const pageHtml = pageSvelte + titleCard + scrollReveal + raceChart + heatmap + awards;
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

describe('recap page — heatmap beat', () => {
	it('renders the heatmap beat fed from the seam', () => {
		expect(pageSvelte).toContain('RecapHeatmap');
		expect(pageSvelte).toContain('recap.heatmap');
	});

	it('draws a cell grid coloured by pick state from the seam rows and columns', () => {
		expect(heatmap).toContain('heatmap');
		expect(heatmap).toContain('rows');
		expect(heatmap).toContain('columns');
		expect(heatmap).toContain('cells');
		expect(heatmap).toMatch(/cell (correct|wrong|missing)/);
	});

	it('groups columns by stage', () => {
		expect(heatmap).toContain('stageGroups');
	});

	it('cascades rows in on scroll and respects reduced motion', () => {
		expect(heatmap).toContain('IntersectionObserver');
		expect(heatmap).toContain('prefers-reduced-motion');
	});

	it('offers a zoom/scroll escape hatch for reading individual cells', () => {
		expect(heatmap.toLowerCase()).toContain('zoom');
		expect(heatmap).toContain('overflow-x');
	});

	it('never uses the forbidden vocabulary', () => {
		const lower = heatmap.toLowerCase();
		expect(lower).not.toMatch(/\bbet\b/);
		expect(lower).not.toMatch(/\bguess\b/);
	});
});

describe('recap page — awards beat', () => {
	it('renders the awards beat fed from the seam', () => {
		expect(pageSvelte).toContain('RecapAwards');
		expect(pageSvelte).toContain('recap.awards');
	});

	it('renders each award as a foil card with winner, stat and subtitle', () => {
		expect(awards).toContain('award');
		expect(awards).toContain('winner');
		expect(awards).toContain('stat');
		expect(awards).toContain('subtitle');
		expect(awards).toContain('tier');
		// Foil tiers from the sticker album language.
		expect(awards).toMatch(/foil-(paper|pearl|holo|gold|legendary)/);
	});

	it('shimmers the cards in on scroll and respects reduced motion', () => {
		expect(awards).toContain('IntersectionObserver');
		expect(awards).toContain('prefers-reduced-motion');
		expect(awards.toLowerCase()).toContain('shine');
	});

	it('marks tied awards as shared', () => {
		expect(awards).toContain('tied');
	});

	it('never uses the forbidden vocabulary', () => {
		const lower = awards.toLowerCase();
		expect(lower).not.toMatch(/\bbet\b/);
		expect(lower).not.toMatch(/\bguess\b/);
		expect(lower).not.toMatch(/\bwrapped\b/);
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
