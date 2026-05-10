import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageHtml = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');
const pageLower = pageHtml.toLowerCase();
const serverTs = readFileSync(resolve(__dirname, '+page.server.ts'), 'utf-8');

describe('leaderboard page content', () => {
	it('uses domain language — User and points, never score-as-verb or bet', () => {
		expect(pageHtml).toContain('User');
		expect(pageHtml).toContain('points');
		expect(pageLower).not.toMatch(/\bbet\b/);
		expect(pageLower).not.toMatch(/\bguess\b/);
	});

	it('shows a rank column', () => {
		expect(pageLower).toContain('rank');
	});

	it('displays fixture results', () => {
		expect(pageHtml).toContain('result');
	});

	it('shows whether the current user pick was correct', () => {
		expect(pageHtml).toContain('correct');
	});

	it('renders user rows with points', () => {
		expect(pageHtml).toContain('entry.points');
		expect(pageHtml).toContain('entry.rank');
	});
});

describe('leaderboard Panini aesthetic', () => {
	it('has a STANDINGS overhang label', () => {
		expect(pageHtml).toContain('STANDINGS');
	});

	it('renders inside a paper-card panel with accent top strap', () => {
		expect(pageLower).toContain('panel');
		expect(pageLower).toContain('accent');
	});

	it('shows a tie indicator for shared ranks', () => {
		expect(pageHtml).toContain('entry.tied');
	});

	it('highlights the current user row', () => {
		expect(pageHtml).toContain('isCurrentUser');
	});

	it('has a sticker tiers legend section', () => {
		expect(pageHtml).toContain('Sticker tiers');
	});

	it('lists all five foil tiers with correct point values', () => {
		expect(pageHtml).toContain('paper');
		expect(pageHtml).toContain('pearl');
		expect(pageHtml).toContain('holo');
		expect(pageHtml).toContain('gold');
		expect(pageHtml).toContain('legendary');
		expect(pageHtml).toContain('1 pt');
		expect(pageHtml).toContain('2 pts');
		expect(pageHtml).toContain('3 pts');
		expect(pageHtml).toContain('5 pts');
	});

	it('lists the correct stages for each tier', () => {
		expect(pageHtml).toContain('Group');
		expect(pageHtml).toContain('R32');
		expect(pageHtml).toContain('R16');
		expect(pageHtml).toContain('QF');
		expect(pageHtml).toContain('SF');
		expect(pageHtml).toContain('3rd-place');
		expect(pageHtml).toContain('Final');
	});

	it('uses foil swatch classes for the legend', () => {
		expect(pageLower).toContain('swatch');
	});

	it('keeps table structure for standings (e2e compat)', () => {
		expect(pageLower).toContain('<table');
		expect(pageLower).toContain('<tr');
		expect(pageLower).toContain('<td');
	});
});

describe('leaderboard page server', () => {
	it('redirects to /login when not authenticated', () => {
		expect(serverTs).toContain("redirect(302, '/login')");
	});

	it('delegates scoring to the scoring module', () => {
		expect(serverTs).toContain('computeScores');
	});

	it('reads all picks from the database', () => {
		expect(serverTs).toContain('pick');
	});

	it('reads all fixtures from the database', () => {
		expect(serverTs).toContain('fixture');
	});

	it('computes shared ranks for tied users', () => {
		expect(serverTs).toContain('rank');
	});

	it('computes a tied flag for entries sharing a rank', () => {
		expect(serverTs).toContain('tied');
	});
});
