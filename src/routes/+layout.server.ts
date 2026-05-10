import type { LayoutServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture } from '$lib/server/db/schema';
import { albumProgress } from '$lib/album-progress';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const fixtures = await db.select({ result: fixture.result }).from(fixture);
	const progress = albumProgress(fixtures);

	return {
		user: locals.user,
		poolName: platform!.env.POOL_NAME,
		poolAccentHex: platform!.env.POOL_ACCENT_HEX,
		albumProgress: progress
	};
};
