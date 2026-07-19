import { eq } from 'drizzle-orm';
import type { Db } from '$lib/server/db';
import { winnerBet } from '$lib/server/db/schema';

export async function getWinnerBet(db: Db, userId: string) {
	const [bet] = await db.select().from(winnerBet).where(eq(winnerBet.userId, userId));
	return bet ?? null;
}

export async function getAllWinnerBets(db: Db) {
	return db.select().from(winnerBet);
}

export async function upsertWinnerBet(db: Db, userId: string, pickedUserId: string) {
	const updatedAt = new Date().toISOString();
	await db
		.insert(winnerBet)
		.values({ userId, pickedUserId, updatedAt })
		.onConflictDoUpdate({
			target: winnerBet.userId,
			set: { pickedUserId, updatedAt }
		});
}

export async function deleteWinnerBet(db: Db, userId: string) {
	await db.delete(winnerBet).where(eq(winnerBet.userId, userId));
}
