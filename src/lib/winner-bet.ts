import { isLocked } from '$lib/lock-time';

type WinnerBetEntry = {
	points: number;
	maxPossible: number;
};

export function withCanStillWin<T extends WinnerBetEntry>(
	entries: T[]
): (T & { canStillWin: boolean })[] {
	const leaderPoints = Math.max(0, ...entries.map((entry) => entry.points));

	return entries.map((entry) => ({
		...entry,
		canStillWin: entry.points === leaderPoints || entry.maxPossible >= leaderPoints
	}));
}

export function isWinnerBetLocked(finalKickoff: string | null, now: Date): boolean {
	return finalKickoff === null ? false : isLocked(finalKickoff, now);
}
