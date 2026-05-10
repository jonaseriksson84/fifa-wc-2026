export interface ScoreShape {
	ft: [number, number];
	et: [number, number] | null;
	pens: [number, number] | null;
}

export function formatFinalScore(score: ScoreShape | null): string {
	if (!score) return '';

	const ft = `${score.ft[0]}-${score.ft[1]}`;

	if (score.pens) {
		return `${ft} (${score.pens[0]}-${score.pens[1]} pen.)`;
	}

	if (score.et) {
		return `${ft} a.e.t. ${score.et[0]}-${score.et[1]}`;
	}

	return ft;
}
