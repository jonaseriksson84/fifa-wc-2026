import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutHtml = readFileSync(resolve(__dirname, '+layout.svelte'), 'utf-8');

describe('site layout', () => {
	it('contains a link to the FAQ page', () => {
		expect(layoutHtml).toContain('href="/faq"');
		expect(layoutHtml.toLowerCase()).toContain('faq');
	});

	it('contains a link to the home page', () => {
		expect(layoutHtml).toContain('href="/"');
	});

	it('contains a link to the picks page', () => {
		expect(layoutHtml).toContain('href="/picks"');
		expect(layoutHtml.toLowerCase()).toContain('picks');
	});

	it('contains a link to the leaderboard page', () => {
		expect(layoutHtml).toContain('href="/leaderboard"');
		expect(layoutHtml.toLowerCase()).toContain('leaderboard');
	});
});

describe('masthead tab pills', () => {
	it('uses tab-pill class on nav links', () => {
		expect(layoutHtml).toContain('tab-pill');
	});

	it('active tab gets solid ink background with paper text', () => {
		expect(layoutHtml).toContain('.tab-pill.active');
		expect(layoutHtml).toContain('background: var(--ink)');
		expect(layoutHtml).toContain('color: var(--paper)');
	});

	it('renders a badge element inside the active picks tab', () => {
		expect(layoutHtml).toContain('badge');
		expect(layoutHtml).toContain('openCount');
	});

	it('badge uses accent background', () => {
		expect(layoutHtml).toContain('.badge');
		const badgeSection = layoutHtml.slice(layoutHtml.indexOf('.badge'));
		expect(badgeSection).toMatch(/background:.*var\(--accent\)/);
	});
});
