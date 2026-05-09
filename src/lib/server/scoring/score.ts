export type ScoringPick = { userId: string; fixtureId: number; value: string };
export type ScoringFixture = { id: number; stage: string; result: string | null };

const stageWeights: Record<string, number> = {
	Group: 1,
	R32: 2,
	R16: 2,
	QF: 2,
	SF: 2,
	'3rd-place': 3,
	Final: 5
};

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
			const weight = stageWeights[fixture.stage] ?? 0;
			scores.set(pick.userId, scores.get(pick.userId)! + weight);
		}
	}

	return scores;
}
