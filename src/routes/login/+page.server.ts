import { redirect, fail } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { createAuth } from '$lib/server/auth';
import { createDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { isEmailAllowed, parseAllowedDomains } from '$lib/server/email-domain';
import { isPoolFrozen, SIGNUP_CLOSED_MESSAGE } from '$lib/server/pool-frozen';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (locals.user) throw redirect(302, '/account');

	const allowedDomains = parseAllowedDomains(platform!.env.ALLOWED_EMAIL_DOMAINS);
	const frozen = isPoolFrozen(platform!.env.POOL_FROZEN);
	let oauthError: string | null = null;
	if (url.searchParams.has('error')) {
		if (frozen) {
			oauthError = SIGNUP_CLOSED_MESSAGE;
		} else if (allowedDomains.length > 0) {
			const list = allowedDomains.map((d) => `@${d}`).join(' or ');
			oauthError = `Sign-in is restricted to ${list} email addresses. Try a different Google account.`;
		} else {
			oauthError = 'Google sign-in failed. Please try again.';
		}
	}

	return {
		googleEnabled: !!(platform?.env.GOOGLE_CLIENT_ID && platform?.env.GOOGLE_CLIENT_SECRET),
		oauthError,
		frozen
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

		// A frozen pool still lets existing members back in, but a stranger must
		// not even receive a link they could never redeem.
		if (isPoolFrozen(platform!.env.POOL_FROZEN)) {
			const db = createDb(platform!.env.DB);
			const [existing] = await db
				.select({ id: user.id })
				.from(user)
				.where(sql`lower(${user.email}) = ${email.trim().toLowerCase()}`);
			if (!existing) {
				return fail(403, { error: SIGNUP_CLOSED_MESSAGE, email });
			}
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
