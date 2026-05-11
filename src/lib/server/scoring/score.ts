import { getStage } from '$lib/stage';

export type ScoringPick = { userId: string; fixtureId: number; value: string };
export type ScoringFixture = { id: number; stage: string; result: string | null };

export function computeScores(
	picks: ScoringPick[],
	fixtures: ScoringFixture[]
): Map<string, number> {
	const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
	const scores = new Map<string, number>();

	for (const pick of picks) {
		if (!scores.has(pick.userId)) {
			scores.set(pick.userId, 0);
		}

		const fixture = fixtureMap.get(pick.fixtureId);
		if (!fixture || fixture.result === null) continue;

		if (pick.value === fixture.result) {
			const weight = getStage(fixture.stage).weight;
			scores.set(pick.userId, scores.get(pick.userId)! + weight);
		}
	}

	return scores;
}
