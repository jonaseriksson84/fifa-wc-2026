import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(resolve(here, '+page.svelte'), 'utf8');
const server = readFileSync(resolve(here, '+page.server.ts'), 'utf8');

describe('password-protected Recap preview', () => {
	it('renders a password form before rendering the Recap', () => {
		expect(page).toContain('type="password"');
		expect(page).toContain('data.authorized');
		expect(page).toContain('RecapTitleCard');
	});

	it('keeps the preview out of search indexes', () => {
		expect(page).toContain('noindex, nofollow');
	});

	it('checks the server-side secret before loading Recap data', () => {
		expect(server).toContain('RECAP_PREVIEW_PASSWORD');
		expect(server).toContain('hasPreviewAccess');
		expect(server.indexOf('hasPreviewAccess')).toBeLessThan(server.indexOf('loadRecap(platform!.env.DB)'));
	});

	it('sets an HttpOnly cookie scoped to the preview path', () => {
		expect(server).toContain('httpOnly: true');
		expect(server).toContain("sameSite: 'strict'");
		expect(server).toContain('path: PREVIEW_PATH');
	});
});
