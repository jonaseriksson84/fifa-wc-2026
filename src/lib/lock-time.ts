export function isLocked(kickoff: string, now: Date): boolean {
	return now.getTime() >= new Date(kickoff).getTime();
}

export function isOpenForPicks(kickoff: string, now: Date): boolean {
	return !isLocked(kickoff, now);
}
