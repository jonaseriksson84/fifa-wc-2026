import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture, user } from '$lib/server/db/schema';
import { getAllPicks } from '$lib/server/picks/pick-repository';
import { computeScores } from '$lib/server/scoring/score';
import {
	deleteWinnerBet,
	getWinnerBet,
	upsertWinnerBet
} from '$lib/server/winner-bet/winner-bet-repository';
import { rankEntries } from '$lib/top-leaderboard';
import { getStage } from '$lib/stage';
import { isWinnerBetLocked, withCanStillWin } from '$lib/winner-bet';

type LeaderboardUser = {
	id: string;
	name: string;
	email: string;
	displayName: string | null;
};

type LeaderboardFixture = typeof fixture.$inferSelect;
type LeaderboardPick = Awaited<ReturnType<typeof getAllPicks>>[number];

function buildLeaderboardEntries(
	allUsers: LeaderboardUser[],
	allPicks: LeaderboardPick[],
	allFixtures: LeaderboardFixture[]
) {
	const scoreMap = computeScores(allPicks, allFixtures);
	const fixtureById = new Map(allFixtures.map((f) => [f.id, f]));
	const remainingPoints = new Map<string, number>();

	for (const pick of allPicks) {
		const pickedFixture = fixtureById.get(pick.fixtureId);
		if (!pickedFixture || pickedFixture.result !== null) continue;

		remainingPoints.set(
			pick.userId,
			(remainingPoints.get(pick.userId) ?? 0) + getStage(pickedFixture.stage).weight
		);
	}

	return withCanStillWin(
		allUsers.map((u) => {
			const points = scoreMap.get(u.id) ?? 0;
			return {
				userId: u.id,
				name: u.name,
				email: u.email,
				displayName: u.displayName,
				points,
				maxPossible: points + (remainingPoints.get(u.id) ?? 0)
			};
		})
	);
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);

	const [allFixtures, allPicks, allUsers, myWinnerBet] = await Promise.all([
		db.select().from(fixture),
		getAllPicks(db),
		db.select({ id: user.id, name: user.name, email: user.email, displayName: user.displayName }).from(user),
		locals.user ? getWinnerBet(db, locals.user.id) : Promise.resolve(null)
	]);

	const fixtureById = new Map(allFixtures.map((f) => [f.id, f]));
	const entries = buildLeaderboardEntries(allUsers, allPicks, allFixtures);
	const ranked = rankEntries(entries);
	const finalKickoff = allFixtures.find((f) => f.stage === 'Final')?.kickoff ?? null;

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
		myWinnerBet: myWinnerBet?.pickedUserId ?? null,
		winnerBetLocked: isWinnerBetLocked(finalKickoff, new Date())
	};
};

export const actions: Actions = {
	winnerBet: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(302, '/login?then=/leaderboard');

		const data = await request.formData();
		const pickedUserId = data.get('pickedUserId');
		if (typeof pickedUserId !== 'string') {
			return fail(400, { error: 'Invalid winner pick' });
		}

		const db = createDb(platform!.env.DB);
		const allFixtures = await db.select().from(fixture);
		const finalKickoff = allFixtures.find((f) => f.stage === 'Final')?.kickoff ?? null;
		if (isWinnerBetLocked(finalKickoff, new Date())) {
			return fail(403, { error: 'Winner picks are frozen' });
		}

		if (pickedUserId === '') {
			await deleteWinnerBet(db, locals.user.id);
			return { success: true, pickedUserId: null };
		}

		const [allPicks, allUsers] = await Promise.all([
			getAllPicks(db),
			db
				.select({ id: user.id, name: user.name, email: user.email, displayName: user.displayName })
				.from(user)
		]);

		if (!allUsers.some((candidate) => candidate.id === pickedUserId)) {
			return fail(400, { error: 'Unknown winner pick' });
		}

		const target = buildLeaderboardEntries(allUsers, allPicks, allFixtures).find(
			(entry) => entry.userId === pickedUserId
		);
		if (!target?.canStillWin) {
			return fail(403, { error: 'That player can no longer win' });
		}

		await upsertWinnerBet(db, locals.user.id, pickedUserId);
		return { success: true, pickedUserId };
	}
};
