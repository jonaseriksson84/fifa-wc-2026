import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, pick, user } from '$lib/server/db/schema';
import { computeScores } from '$lib/server/scoring/score';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = createDb(platform!.env.DB);

	const [allFixtures, allPicks, allUsers] = await Promise.all([
		db.select().from(fixture),
		db.select().from(pick),
		db.select({ id: user.id, name: user.name, email: user.email, displayName: user.displayName }).from(user)
	]);

	const fixtureById = new Map(allFixtures.map((f) => [f.id, f]));
	const scoreMap = computeScores(allPicks, allFixtures);

	const entries = allUsers.map((u) => ({
		userId: u.id,
		name: u.name,
		email: u.email,
		displayName: u.displayName,
		points: scoreMap.get(u.id) ?? 0
	}));

	entries.sort((a, b) => b.points - a.points);

	let rank = 1;
	const ranked = entries.map((entry, i) => {
		if (i > 0 && entry.points < entries[i - 1].points) {
			rank = i + 1;
		}
		const tied =
			(i > 0 && entries[i - 1].points === entry.points) ||
			(i < entries.length - 1 && entries[i + 1].points === entry.points);
		return { ...entry, rank, tied };
	});

	const currentUserId = locals.user.id;
	const pickMap = new Map<number, { value: string; correct: boolean | null }>();
	for (const p of allPicks) {
		if (p.userId !== currentUserId) continue;
		const f = fixtureById.get(p.fixtureId);
		const correct = f?.result != null ? p.value === f.result : null;
		pickMap.set(p.fixtureId, { value: p.value, correct });
	}

	const stageOrder: Record<string, number> = {
		Group: 0,
		R32: 1,
		R16: 2,
		QF: 3,
		SF: 4,
		'3rd-place': 5,
		Final: 6
	};

	const fixturesWithResults = allFixtures
		.filter((f) => f.result !== null)
		.sort((a, b) => {
			const stageDiff = (stageOrder[a.stage] ?? 99) - (stageOrder[b.stage] ?? 99);
			if (stageDiff !== 0) return stageDiff;
			return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
		})
		.map((f) => {
			const myPick = pickMap.get(f.id);
			return {
				id: f.id,
				homeTeam: f.homeTeam,
				awayTeam: f.awayTeam,
				stage: f.stage,
				kickoff: f.kickoff,
				result: f.result,
				myPick: myPick?.value ?? null,
				correct: myPick?.correct ?? null
			};
		});

	return {
		leaderboard: ranked,
		fixturesWithResults,
		currentUserId
	};
};
