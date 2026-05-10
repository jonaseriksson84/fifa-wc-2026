type Ranked = { points: number };

export function rankEntries<T extends Ranked>(entries: T[]): (T & { rank: number; tied: boolean })[] {
	const sorted = [...entries].sort((a, b) => b.points - a.points);
	let rank = 1;
	return sorted.map((entry, i) => {
		if (i > 0 && entry.points < sorted[i - 1].points) {
			rank = i + 1;
		}
		const tied =
			(i > 0 && sorted[i - 1].points === entry.points) ||
			(i < sorted.length - 1 && sorted[i + 1].points === entry.points);
		return { ...entry, rank, tied };
	});
}

export function topN<T extends Ranked>(entries: T[], n: number): T[] {
	if (entries.length <= n) return entries;

	const cutoffPoints = entries[n - 1].points;
	let end = n;
	while (end < entries.length && entries[end].points === cutoffPoints) {
		end++;
	}
	return entries.slice(0, end);
}
