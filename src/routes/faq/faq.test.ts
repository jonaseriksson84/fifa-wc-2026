import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const faqHtml = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');
const faqLower = faqHtml.toLowerCase();

describe('FAQ page content', () => {
	it('explains magic-link sign-in', () => {
		expect(faqHtml).toContain('magic');
		expect(faqLower).toContain('email');
		expect(faqLower).not.toMatch(/enter.*password/);
		expect(faqLower).not.toMatch(/create.*password/);
	});

	it('explains how picking works — HOME, DRAW, AWAY for groups; HOME or AWAY for knockouts', () => {
		expect(faqHtml).toContain('HOME');
		expect(faqHtml).toContain('DRAW');
		expect(faqHtml).toContain('AWAY');
		expect(faqLower).toContain('knockout');
	});

	it('explains picks lock at kickoff', () => {
		expect(faqLower).toContain('lock');
		expect(faqLower).toContain('kickoff');
	});

	it('explains pick visibility — private until kickoff, then public', () => {
		expect(faqLower).toContain('private');
		expect(faqLower).toContain('visible');
	});

	it('shows correct scoring weights', () => {
		expect(faqHtml).toContain('1');
		expect(faqHtml).toContain('2');
		expect(faqHtml).toContain('3');
		expect(faqHtml).toContain('5');
		expect(faqLower).toContain('group');
		expect(faqLower).toContain('final');
		expect(faqLower).toContain('3rd-place');
	});

	it('explains what "correct" means in knockouts — advancing team, not 90-min score', () => {
		expect(faqLower).toContain('advance');
		expect(faqLower).toContain('penalties');
	});

	it('explains missed picks score zero', () => {
		expect(faqLower).toContain('missed');
		expect(faqLower).toContain('zero');
	});

	it('explains tie-breaker rule — none, shared rank', () => {
		expect(faqLower).toContain('tie');
		expect(faqLower).toContain('share');
	});

	it('explains where results come from', () => {
		expect(faqLower).toContain('automatically');
		expect(faqLower).toContain('api');
	});

	it('uses domain language from CONTEXT.md', () => {
		expect(faqHtml).toContain('Pick');
		expect(faqHtml).toContain('Fixture');
		expect(faqHtml).toContain('Stage');
		expect(faqHtml).toContain('Result');
	});

	it('never uses forbidden terminology', () => {
		expect(faqLower).not.toMatch(/\bbet\b/);
		expect(faqLower).not.toMatch(/\bmatch\b/);
		expect(faqLower).not.toMatch(/\bguess\b/);
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
