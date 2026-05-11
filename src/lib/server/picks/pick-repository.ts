import { eq } from 'drizzle-orm';
import { pick } from '$lib/server/db/schema';
import type { Db } from '$lib/server/db';
import type { PickValue } from './validate-pick';

export async function getAllPicks(db: Db) {
	return db.select().from(pick);
}

export async function getPicksForUser(db: Db, userId: string) {
	return db.select().from(pick).where(eq(pick.userId, userId));
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
