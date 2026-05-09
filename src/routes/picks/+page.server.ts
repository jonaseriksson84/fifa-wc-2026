import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { createDb } from '$lib/server/db';
import { fixture } from '$lib/server/db/schema';
import { getPicksForUser, upsertPick } from '$lib/server/picks/pick-repository';
import { validatePick, type PickValue } from '$lib/server/picks/validate-pick';

const stageOrder: Record<string, number> = {
	Group: 0,
	R32: 1,
	R16: 2,
	QF: 3,
	SF: 4,
	'3rd-place': 5,
	Final: 6
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = createDb(platform!.env.DB);
	const fixtures = await db.select().from(fixture);
	const picks = await getPicksForUser(db, locals.user.id);

	const pickMap = new Map(picks.map((p) => [p.fixtureId, p.value]));

	const sorted = fixtures
		.map((f) => ({
			...f,
			currentPick: (pickMap.get(f.id) as PickValue) ?? null
		}))
		.sort((a, b) => {
			const stageDiff = (stageOrder[a.stage] ?? 99) - (stageOrder[b.stage] ?? 99);
			if (stageDiff !== 0) return stageDiff;
			return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
		});

	const unpickedCount = sorted.filter((f) => f.currentPick === null).length;

	return {
		fixtures: sorted,
		unpickedCount,
		totalCount: sorted.length
	};
};

const validValues = new Set(['HOME', 'DRAW', 'AWAY']);

export const actions: Actions = {
	pick: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(302, '/login');

		const data = await request.formData();
		const fixtureIdStr = data.get('fixtureId');
		const value = data.get('value');

		if (!fixtureIdStr || !value || typeof value !== 'string' || !validValues.has(value)) {
			return fail(400, { error: 'Invalid pick data', fixtureId: 0 });
		}

		const fixtureId = parseInt(fixtureIdStr.toString(), 10);
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
