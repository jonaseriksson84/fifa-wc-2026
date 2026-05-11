import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { getAllPicks, getPicksForUser, upsertPick } from '$lib/server/picks/pick-repository';
import { validatePick, type PickValue } from '$lib/server/picks/validate-pick';
import { computeScores } from '$lib/server/scoring/score';
import { rankEntries, topN } from '$lib/top-leaderboard';
import { isKnownTeam } from '$lib/is-known-team';
import { isOpenForPicks } from '$lib/lock-time';
import { pickRevealIndex } from '$lib/pick-reveal';
import { getStage } from '$lib/stage';

export type { PicksByValue } from '$lib/pick-reveal';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const now = new Date();

	const [fixtures, picks, allUsers, allPicks] = await Promise.all([
		db.select().from(fixture),
		locals.user ? getPicksForUser(db, locals.user.id) : Promise.resolve([]),
		db.select({ id: user.id, email: user.email, name: user.name, displayName: user.displayName }).from(user),
		getAllPicks(db)
	]);

	const pickMap = new Map(picks.map((p) => [p.fixtureId, p.value]));
	const reveal = pickRevealIndex(allPicks, allUsers);

	const enriched = fixtures.map((f) => ({
		...f,
		currentPick: (pickMap.get(f.id) as PickValue) ?? null,
		picksByValue: locals.user ? reveal(f.id, f.kickoff, now) : null
	}));

	enriched.sort((a, b) => {
		const stageDiff = getStage(a.stage).sortIndex - getStage(b.stage).sortIndex;
		if (stageDiff !== 0) return stageDiff;
		return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
	});

	const pickable = enriched.filter(
		(f) => isOpenForPicks(f.kickoff, now) && isKnownTeam(f.homeTeam) && isKnownTeam(f.awayTeam)
	);
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
		if (!locals.user) throw redirect(302, '/login?then=/');

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
			const messages: Record<string, string> = {
				fixture_locked: 'This fixture is locked — picking is closed',
				draw_not_allowed: 'DRAW is not allowed on knockout fixtures',
				teams_not_known: 'Teams have not been determined yet — picking is not open'
			};
			return fail(422, {
				error: messages[validation.reason],
				fixtureId
			});
		}

		await upsertPick(db, locals.user.id, fixtureId, value as PickValue);

		return { success: true, fixtureId };
	}
};
