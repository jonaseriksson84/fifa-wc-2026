import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const faqHtml = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');

describe('FAQ page content', () => {
	it('explains magic-link sign-in', () => {
		expect(faqHtml).toContain('magic');
		expect(faqHtml.toLowerCase()).toContain('email');
		expect(faqHtml.toLowerCase()).not.toMatch(/enter.*password/);
		expect(faqHtml.toLowerCase()).not.toMatch(/create.*password/);
	});

	it('explains how picking works — HOME, DRAW, AWAY for groups; HOME or AWAY for knockouts', () => {
		expect(faqHtml).toContain('HOME');
		expect(faqHtml).toContain('DRAW');
		expect(faqHtml).toContain('AWAY');
		expect(faqHtml.toLowerCase()).toContain('knockout');
	});

	it('explains picks lock at kickoff', () => {
		expect(faqHtml.toLowerCase()).toContain('lock');
		expect(faqHtml.toLowerCase()).toContain('kickoff');
	});

	it('explains pick visibility — private until kickoff, then public', () => {
		expect(faqHtml.toLowerCase()).toContain('private');
		expect(faqHtml.toLowerCase()).toContain('visible');
	});

	it('shows correct scoring weights', () => {
		expect(faqHtml).toContain('1');
		expect(faqHtml).toContain('2');
		expect(faqHtml).toContain('3');
		expect(faqHtml).toContain('5');
		expect(faqHtml.toLowerCase()).toContain('group');
		expect(faqHtml.toLowerCase()).toContain('final');
		expect(faqHtml.toLowerCase()).toContain('3rd-place');
	});

	it('explains what "correct" means in knockouts — advancing team, not 90-min score', () => {
		expect(faqHtml.toLowerCase()).toContain('advance');
		expect(faqHtml.toLowerCase()).toContain('penalties');
	});

	it('explains missed picks score zero', () => {
		expect(faqHtml.toLowerCase()).toContain('missed');
		expect(faqHtml.toLowerCase()).toContain('zero');
	});

	it('explains tie-breaker rule — none, shared rank', () => {
		expect(faqHtml.toLowerCase()).toContain('tie');
		expect(faqHtml.toLowerCase()).toContain('share');
	});

	it('explains where results come from', () => {
		expect(faqHtml.toLowerCase()).toContain('automatically');
		expect(faqHtml.toLowerCase()).toContain('api');
	});

	it('uses domain language from CONTEXT.md', () => {
		expect(faqHtml).toContain('Pick');
		expect(faqHtml).toContain('Fixture');
		expect(faqHtml).toContain('Stage');
		expect(faqHtml).toContain('Result');
	});

	it('never uses forbidden terminology', () => {
		const lower = faqHtml.toLowerCase();
		const lines = lower.split('\n');
		for (const line of lines) {
			if (line.trim().startsWith('<!--')) continue;
			expect(line).not.toMatch(/\bbet\b/);
			expect(line).not.toMatch(/\bmatch\b/);
			expect(line).not.toMatch(/\bguess\b/);
		}
	});
});

describe('FAQ page structure', () => {
	it('sets a page title', () => {
		expect(faqHtml).toContain('<title>');
		expect(faqHtml.toLowerCase()).toContain('faq');
	});

	it('requires no JavaScript — pure content with no reactive logic', () => {
		expect(faqHtml).not.toContain('$state');
		expect(faqHtml).not.toContain('$effect');
		expect(faqHtml).not.toContain('onclick');
	});
});
