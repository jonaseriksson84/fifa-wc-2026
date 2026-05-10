import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { createDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = createDb(platform!.env.DB);
	const [row] = await db
		.select({ displayName: user.displayName })
		.from(user)
		.where(eq(user.id, locals.user.id));

	return {
		user: {
			email: locals.user.email,
			name: locals.user.name,
			displayName: row?.displayName ?? null
		}
	};
};

export const actions: Actions = {
	updateDisplayName: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(302, '/login');

		const data = await request.formData();
		const raw = data.get('displayName');

		if (typeof raw !== 'string') {
			return fail(400, { error: 'Invalid input' });
		}

		const trimmed = raw.trim();

		if (trimmed.length > 24) {
			return fail(422, { error: 'Display name must be 24 characters or fewer' });
		}

		const db = createDb(platform!.env.DB);
		const value = trimmed.length === 0 ? null : trimmed;

		await db
			.update(user)
			.set({ displayName: value })
			.where(eq(user.id, locals.user.id));

		return { success: true };
	}
};
