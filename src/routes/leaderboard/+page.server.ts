import type { PageServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { getAllPicks } from '$lib/server/picks/pick-repository';
import { computeScores } from '$lib/server/scoring/score';
import { computeRecap } from '$lib/server/recap/recap';
import { rankEntries } from '$lib/top-leaderboard';
import { getStage } from '$lib/stage';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);

	const [allFixtures, allPicks, allUsers] = await Promise.all([
		db.select().from(fixture),
		getAllPicks(db),
		db.select({ id: user.id, name: user.name, email: user.email, displayName: user.displayName }).from(user)
	]);

	const fixtureById = new Map(allFixtures.map((f) => [f.id, f]));
	const scoreMap = computeScores(allPicks, allFixtures);

	// Discovery banner: surface the Recap on the leaderboard once the Final settles.
	// The availability gate lives inside the seam, so we reuse the same three
	// row-sets rather than re-deriving "is the Final in?" here.
	const recapAvailable = computeRecap(allUsers, allPicks, allFixtures).available;

	const entries = allUsers.map((u) => ({
		userId: u.id,
		name: u.name,
		email: u.email,
		displayName: u.displayName,
		points: scoreMap.get(u.id) ?? 0
	}));
	const ranked = rankEntries(entries);

	const currentUserId = locals.user?.id ?? null;
	const pickMap = new Map<number, { value: string; correct: boolean | null }>();
	if (locals.user) {
		for (const p of allPicks) {
			if (p.userId !== currentUserId) continue;
			const f = fixtureById.get(p.fixtureId);
			const correct = f?.result != null ? p.value === f.result : null;
			pickMap.set(p.fixtureId, { value: p.value, correct });
		}
	}

	const fixturesWithResults = allFixtures
		.filter((f) => f.result !== null)
		.sort((a, b) => {
			const stageDiff = getStage(a.stage).sortIndex - getStage(b.stage).sortIndex;
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
		currentUserId,
		recapAvailable
	};
};
