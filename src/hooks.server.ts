import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	if (!event.url.pathname.startsWith('/api/auth')) {
		const auth = createAuth(event.platform!.env);
		const sessionData = await auth.api.getSession({
			headers: event.request.headers
		});
		event.locals.user = sessionData?.user ?? null;
		event.locals.session = sessionData?.session ?? null;
	}

	return resolve(event);
};
