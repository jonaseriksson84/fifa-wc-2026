import { describe, expect, it } from 'vitest';
import {
	hasPreviewAccess,
	passwordMatches,
	previewCookieValue
} from '$lib/server/recap/preview-auth';

describe('Recap preview authentication', () => {
	it('accepts the configured password and rejects another one', async () => {
		await expect(passwordMatches('shared-secret', 'shared-secret')).resolves.toBe(true);
		await expect(passwordMatches('wrong', 'shared-secret')).resolves.toBe(false);
	});

	it('grants access only for the proof signed by the configured password', async () => {
		const cookie = await previewCookieValue('shared-secret');

		await expect(hasPreviewAccess(cookie, 'shared-secret')).resolves.toBe(true);
		await expect(hasPreviewAccess(cookie, 'changed-secret')).resolves.toBe(false);
		await expect(hasPreviewAccess(undefined, 'shared-secret')).resolves.toBe(false);
	});

	it('does not put the password itself in the cookie', async () => {
		const cookie = await previewCookieValue('shared-secret');

		expect(cookie).not.toContain('shared-secret');
	});
});
