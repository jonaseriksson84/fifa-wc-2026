import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { albumProgress } from '$lib/album-progress';
import { isOpenForPicks } from '$lib/lock-time';
import { getPicksForUser } from '$lib/server/picks/pick-repository';
import { recapAvailable } from '$lib/server/recap/recap';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const fixtures = await db
		.select({ id: fixture.id, kickoff: fixture.kickoff, stage: fixture.stage, result: fixture.result })
		.from(fixture);
	const progress = albumProgress(fixtures);

	let userData = locals.user;
	let openCount = 0;
	if (locals.user) {
		const [row] = await db
			.select({ displayName: user.displayName })
			.from(user)
			.where(eq(user.id, locals.user.id));
		if (row) {
			userData = { ...locals.user, displayName: row.displayName };
		}
		const picks = await getPicksForUser(db, locals.user.id);
		const pickedIds = new Set(picks.map((p) => p.fixtureId));
		const now = new Date();
		openCount = fixtures.filter(
			(f) => isOpenForPicks(f.kickoff, now) && !pickedIds.has(f.id)
		).length;
	}

	return {
		user: userData,
		poolName: platform!.env.POOL_NAME,
		poolAccentHex: platform!.env.POOL_ACCENT_HEX,
		albumProgress: progress,
		openCount,
		recapAvailable: recapAvailable(fixtures)
	};
};
