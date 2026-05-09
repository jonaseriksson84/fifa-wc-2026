import { createAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handleAuth: RequestHandler = async ({ request, platform }) => {
	const auth = createAuth(platform!.env);
	return auth.handler(request);
};

export const GET = handleAuth;
export const POST = handleAuth;
