import { redirect, fail } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/account');
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email) return fail(400, { error: 'Email is required', email: '' });

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
