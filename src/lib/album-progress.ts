export type AlbumFixture = { result: string | null };

export type AlbumProgress = {
	stuck: number;
	total: number;
	remaining: number;
	percent: number;
};

export function albumProgress(fixtures: AlbumFixture[]): AlbumProgress {
	const total = fixtures.length;
	const stuck = fixtures.filter((f) => f.result !== null).length;
	const remaining = total - stuck;
	const percent = total === 0 ? 0 : Math.round((stuck / total) * 100);
	return { stuck, total, remaining, percent };
}
