import { createAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const auth = createAuth(platform!.env);

	const response = await auth.api.signInSocial({
		body: {
			provider: 'google',
			callbackURL: '/account',
			errorCallbackURL: '/login?error=google'
		},
		headers: request.headers,
		asResponse: true
	});

	const { url } = (await response.json()) as { url?: string };
	if (!url) return new Response('Failed to start Google sign-in', { status: 500 });

	const headers = new Headers();
	for (const cookie of response.headers.getSetCookie()) {
		headers.append('set-cookie', cookie);
	}
	headers.set('location', url);

	return new Response(null, { status: 302, headers });
};
