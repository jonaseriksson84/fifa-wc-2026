import type { PageServerLoad } from './$types';
import { createDb } from '$lib/server/db';
import { fixture } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform }) => {
	const db = createDb(platform!.env.DB);
	const fixtures = await db.select().from(fixture);

	return { fixtures };
};
