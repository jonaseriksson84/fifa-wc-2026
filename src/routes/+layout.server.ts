import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { albumProgress } from '$lib/album-progress';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const fixtures = await db.select({ result: fixture.result }).from(fixture);
	const progress = albumProgress(fixtures);

	let userData = locals.user;
	if (locals.user) {
		const [row] = await db
			.select({ displayName: user.displayName })
			.from(user)
			.where(eq(user.id, locals.user.id));
		if (row) {
			userData = { ...locals.user, displayName: row.displayName };
		}
	}

	return {
		user: userData,
		poolName: platform!.env.POOL_NAME,
		poolAccentHex: platform!.env.POOL_ACCENT_HEX,
		albumProgress: progress
	};
};
