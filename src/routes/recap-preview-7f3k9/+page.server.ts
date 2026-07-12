import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRecap } from '$lib/server/recap/load-recap';
import {
	hasPreviewAccess,
	passwordMatches,
	previewCookieValue,
	RECAP_PREVIEW_COOKIE
} from '$lib/server/recap/preview-auth';

const PREVIEW_PATH = '/recap-preview-7f3k9';

function getSecret(platform: App.Platform | undefined): string {
	const secret = platform?.env.RECAP_PREVIEW_PASSWORD;
	if (!secret) error(404, 'Not found');
	return secret;
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
	const secret = getSecret(platform);
	const authorized = await hasPreviewAccess(cookies.get(RECAP_PREVIEW_COOKIE), secret);
	if (!authorized) return { authorized: false as const, recap: null };

	return {
		authorized: true as const,
		recap: await loadRecap(platform!.env.DB)
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, platform, url }) => {
		const secret = getSecret(platform);
		const data = await request.formData();
		const password = data.get('password')?.toString() ?? '';

		if (!(await passwordMatches(password, secret))) {
			return fail(401, { error: 'Wrong password.' });
		}

		cookies.set(RECAP_PREVIEW_COOKIE, await previewCookieValue(secret), {
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'strict',
			path: PREVIEW_PATH,
			maxAge: 60 * 60 * 8
		});

		redirect(303, PREVIEW_PATH);
	}
};
