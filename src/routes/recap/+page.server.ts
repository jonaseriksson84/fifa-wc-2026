import type { PageServerLoad } from './$types';
import { loadRecap } from '$lib/server/recap/load-recap';

// Thin adapter in the style of the leaderboard loader: fetch the three row-sets,
// call the computeRecap seam, return. No auth guard — the Recap is public-after-
// lock data like the leaderboard, and the availability gate (Final has a Result,
// decided inside the seam) is the only thing hiding it before Final night.
export const load: PageServerLoad = async ({ platform }) => {
	return { recap: await loadRecap(platform!.env.DB) };
};
