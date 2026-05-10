type Ranked = { points: number };

export function topN<T extends Ranked>(entries: T[], n: number): T[] {
	if (entries.length <= n) return entries;

	const cutoffPoints = entries[n - 1].points;
	let end = n;
	while (end < entries.length && entries[end].points === cutoffPoints) {
		end++;
	}
	return entries.slice(0, end);
}
