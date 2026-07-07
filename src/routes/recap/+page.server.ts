import type { PageServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { getAllPicks } from '$lib/server/picks/pick-repository';
import { computeRecap } from '$lib/server/recap/recap';

// Thin adapter in the style of the leaderboard loader: fetch the three row-sets,
// call the computeRecap seam, return. No auth guard — the Recap is public-after-
// lock data like the leaderboard, and the availability gate (Final has a Result,
// decided inside the seam) is the only thing hiding it before Final night.
export const load: PageServerLoad = async ({ platform }) => {
	const db = createDb(platform!.env.DB);

	const [allFixtures, allPicks, allUsers] = await Promise.all([
		db.select().from(fixture),
		getAllPicks(db),
		db
			.select({ id: user.id, name: user.name, email: user.email, displayName: user.displayName })
			.from(user)
	]);

	const recap = computeRecap(allUsers, allPicks, allFixtures);

	return { recap };
};
