import type { LayoutServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture } from '$lib/server/db/schema';
import { albumProgress } from '$lib/album-progress';
import { getPicksForUser } from '$lib/server/picks/pick-repository';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const fixtures = await db
		.select({ id: fixture.id, kickoff: fixture.kickoff, result: fixture.result })
		.from(fixture);
	const progress = albumProgress(fixtures);

	let openCount = 0;
	if (locals.user) {
		const picks = await getPicksForUser(db, locals.user.id);
		const pickedIds = new Set(picks.map((p) => p.fixtureId));
		const now = new Date();
		openCount = fixtures.filter(
			(f) => now < new Date(f.kickoff) && !pickedIds.has(f.id)
		).length;
	}

	return {
		user: locals.user,
		poolName: platform!.env.POOL_NAME,
		poolAccentHex: platform!.env.POOL_ACCENT_HEX,
		albumProgress: progress,
		openCount
	};
};
