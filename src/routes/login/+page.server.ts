import { redirect, fail } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import { isEmailAllowed, parseAllowedDomains } from '$lib/server/email-domain';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (locals.user) throw redirect(302, '/account');

	const allowedDomains = parseAllowedDomains(platform!.env.ALLOWED_EMAIL_DOMAINS);
	let oauthError: string | null = null;
	if (url.searchParams.has('error')) {
		if (allowedDomains.length > 0) {
			const list = allowedDomains.map((d) => `@${d}`).join(' or ');
			oauthError = `Sign-in is restricted to ${list} email addresses. Try a different Google account.`;
		} else {
			oauthError = 'Google sign-in failed. Please try again.';
		}
	}

	return {
		googleEnabled: !!(platform?.env.GOOGLE_CLIENT_ID && platform?.env.GOOGLE_CLIENT_SECRET),
		oauthError
	};
};

export const actions: Actions = {
	magicLink: async ({ request, platform }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email) return fail(400, { error: 'Email is required', email: '' });

		const allowedDomains = parseAllowedDomains(platform!.env.ALLOWED_EMAIL_DOMAINS);
		if (!isEmailAllowed(email, allowedDomains)) {
			const list = allowedDomains.map((d) => `@${d}`).join(' or ');
			return fail(403, {
				error: `Sign-in is restricted to ${list} email addresses.`,
				email
			});
		}

		const auth = createAuth(platform!.env);

		try {
			await auth.api.signInMagicLink({
				body: { email, callbackURL: '/account' },
				headers: request.headers
			});
			return { success: true, email };
		} catch {
			return fail(500, { error: 'Failed to send magic link. Please try again.', email });
		}
	}
};
