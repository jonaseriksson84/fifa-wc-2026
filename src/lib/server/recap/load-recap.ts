import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { getAllPicks } from '$lib/server/picks/pick-repository';
import { computeRecap } from '$lib/server/recap/recap';

export async function loadRecap(dbBinding: D1Database) {
	const db = createDb(dbBinding);
	const [allFixtures, allPicks, allUsers] = await Promise.all([
		db.select().from(fixture),
		getAllPicks(db),
		db
			.select({ id: user.id, name: user.name, email: user.email, displayName: user.displayName })
			.from(user)
	]);

	return computeRecap(allUsers, allPicks, allFixtures);
}
