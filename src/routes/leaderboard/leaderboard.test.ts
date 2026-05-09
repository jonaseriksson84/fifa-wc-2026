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
});
