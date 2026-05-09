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
});
