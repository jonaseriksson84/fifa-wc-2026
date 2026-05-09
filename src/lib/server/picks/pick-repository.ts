import { eq } from 'drizzle-orm';
import { pick, user } from '$lib/server/db/schema';
import type { Db } from '$lib/server/db';
import type { PickValue } from './validate-pick';

export async function getPicksForUser(db: Db, userId: string) {
	return db.select().from(pick).where(eq(pick.userId, userId));
}

export async function getPicksForFixture(db: Db, fixtureId: number) {
	return db
		.select({ email: user.email, value: pick.value })
		.from(pick)
		.innerJoin(user, eq(pick.userId, user.id))
		.where(eq(pick.fixtureId, fixtureId));
}

export async function upsertPick(db: Db, userId: string, fixtureId: number, value: PickValue) {
	const updatedAt = new Date().toISOString();
	await db
		.insert(pick)
		.values({ userId, fixtureId, value, updatedAt })
		.onConflictDoUpdate({
			target: [pick.userId, pick.fixtureId],
			set: { value, updatedAt }
		});
}
