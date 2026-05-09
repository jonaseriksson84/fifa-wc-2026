import { redirect } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const auth = createAuth(platform!.env);
	await auth.api.signOut({ headers: request.headers });
	throw redirect(303, '/login');
};
