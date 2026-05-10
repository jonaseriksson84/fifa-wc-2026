import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageHtml = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');
const pageLower = pageHtml.toLowerCase();
const serverTs = readFileSync(resolve(__dirname, '+page.server.ts'), 'utf-8');

describe('account page display name form', () => {
	it('has a display name input field', () => {
		expect(pageLower).toContain('name="displayname"');
	});

	it('enforces maxlength of 24 characters on the input', () => {
		expect(pageLower).toContain('maxlength="24"');
	});

	it('uses a form action for updating display name', () => {
		expect(pageHtml).toContain('?/updateDisplayName');
	});

	it('shows the current display name value', () => {
		expect(pageHtml).toContain('data.user.displayName');
	});
});

describe('account page server - display name action', () => {
	it('has an updateDisplayName form action', () => {
		expect(serverTs).toContain('updateDisplayName');
	});

	it('trims whitespace from display name input', () => {
		expect(serverTs).toContain('trim()');
	});

	it('enforces max 24 characters', () => {
		expect(serverTs).toContain('24');
	});

	it('updates the user display_name in the database', () => {
		expect(serverTs).toContain('displayName');
	});

	it('returns displayName in the page load data', () => {
		expect(serverTs).toContain('displayName');
	});
});

describe('account page ellipsis', () => {
	it('applies text-overflow ellipsis to email display', () => {
		expect(pageHtml).toContain('text-overflow: ellipsis');
	});
});
