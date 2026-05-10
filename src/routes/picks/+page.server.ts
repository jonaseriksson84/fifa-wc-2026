import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, pick as pickTable, user } from '$lib/server/db/schema';
import {
	getPicksForUser,
	getPicksForFixture,
	upsertPick
} from '$lib/server/picks/pick-repository';
import { validatePick, type PickValue } from '$lib/server/picks/validate-pick';
import { displayName } from '$lib/display-name';
import { computeScores } from '$lib/server/scoring/score';
import { rankEntries, topN } from '$lib/top-leaderboard';

const stageOrder: Record<string, number> = {
	Group: 0,
	R32: 1,
	R16: 2,
	QF: 3,
	SF: 4,
	'3rd-place': 5,
	Final: 6
};

export type PicksByValue = {
	HOME: string[];
	DRAW: string[];
	AWAY: string[];
	noPick: string[];
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const now = new Date();

	const [fixtures, picks, allUsers, allPicks] = await Promise.all([
		db.select().from(fixture),
		locals.user ? getPicksForUser(db, locals.user.id) : Promise.resolve([]),
		db.select({ id: user.id, email: user.email, name: user.name, displayName: user.displayName }).from(user),
		db.select().from(pickTable)
	]);

	const pickMap = new Map(picks.map((p) => [p.fixtureId, p.value]));

	const enriched = await Promise.all(
		fixtures.map(async (f) => {
			const locked = now.getTime() >= new Date(f.kickoff).getTime();
			let picksByValue: PicksByValue | null = null;

			if (locked && locals.user) {
				const fixturePicks = await getPicksForFixture(db, f.id);
				const buckets: PicksByValue = { HOME: [], DRAW: [], AWAY: [], noPick: [] };
				const pickedEmails = new Set<string>();

				for (const p of fixturePicks) {
					const key = p.value as PickValue;
					buckets[key]?.push(displayName(p));
					pickedEmails.add(p.email);
				}

				for (const u of allUsers) {
					if (!pickedEmails.has(u.email)) {
						buckets.noPick.push(displayName(u));
					}
				}

				picksByValue = buckets;
			}

			return {
				...f,
				currentPick: (pickMap.get(f.id) as PickValue) ?? null,
				picksByValue
			};
		})
	);

	enriched.sort((a, b) => {
		const stageDiff = (stageOrder[a.stage] ?? 99) - (stageOrder[b.stage] ?? 99);
		if (stageDiff !== 0) return stageDiff;
		return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
	});

	const pickable = enriched.filter((f) => new Date(f.kickoff) > now);
	const unpickedCount = pickable.filter((f) => f.currentPick === null).length;
	const pickableCount = pickable.length;

	const scoreMap = computeScores(allPicks, fixtures);
	const entries = allUsers.map((u) => ({
		userId: u.id,
		name: u.name,
		email: u.email,
		displayName: u.displayName,
		points: scoreMap.get(u.id) ?? 0
	}));
	const ranked = rankEntries(entries);
	const topLeaderboard = topN(ranked, 10);

	return {
		fixtures: enriched,
		unpickedCount,
		pickableCount,
		totalCount: enriched.length,
		topLeaderboard,
		currentUserId: locals.user?.id ?? null
	};
};

const validValues = new Set(['HOME', 'DRAW', 'AWAY']);

export const actions: Actions = {
	pick: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(302, '/login?then=/picks');

		const data = await request.formData();
		const fixtureIdStr = data.get('fixtureId');
		const value = data.get('value');

		if (
			!fixtureIdStr ||
			typeof fixtureIdStr !== 'string' ||
			!value ||
			typeof value !== 'string' ||
			!validValues.has(value)
		) {
			return fail(400, { error: 'Invalid pick data', fixtureId: 0 });
		}

		const fixtureId = parseInt(fixtureIdStr, 10);
		if (isNaN(fixtureId)) {
			return fail(400, { error: 'Invalid fixture', fixtureId: 0 });
		}

		const db = createDb(platform!.env.DB);
		const [f] = await db.select().from(fixture).where(eq(fixture.id, fixtureId));

		if (!f) {
			return fail(404, { error: 'Fixture not found', fixtureId });
		}

		const validation = validatePick(f, value as PickValue, new Date());
		if (!validation.valid) {
			return fail(422, {
				error:
					validation.reason === 'fixture_locked'
						? 'This fixture is locked — picking is closed'
						: 'DRAW is not allowed on knockout fixtures',
				fixtureId
			});
		}

		await upsertPick(db, locals.user.id, fixtureId, value as PickValue);

		return { success: true, fixtureId };
	}
};
