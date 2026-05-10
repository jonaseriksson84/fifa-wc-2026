import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDb } from '$lib/server/db';
import { fixture } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function guard(platform: App.Platform | undefined) {
	if (!platform?.env.E2E_TEST) throw error(404);
}

export const GET: RequestHandler = async ({ platform, url }) => {
	guard(platform);

	const action = url.searchParams.get('action');

	if (action === 'verification-token') {
		const email = url.searchParams.get('email');
		if (!email) throw error(400, 'email required');

		const db = platform!.env.DB;
		const result = await db
			.prepare(
				`SELECT identifier FROM verification
				 WHERE json_extract(value, '$.email') = ?
				 ORDER BY created_at DESC LIMIT 1`
			)
			.bind(email)
			.first<{ identifier: string }>();

		if (!result) throw error(404, 'no token found');
		return json({ token: result.identifier });
	}

	throw error(400, 'unknown action');
};

export const POST: RequestHandler = async ({ platform, request }) => {
	guard(platform);

	const body = (await request.json()) as Record<string, unknown>;
	const action = body.action;

	if (action === 'seed-fixtures') {
		const db = createDb(platform!.env.DB);
		const fixtures = body.fixtures as { homeTeam: string; awayTeam: string; kickoff: string; stage: string }[];
		const now = new Date().toISOString();
		await db.insert(fixture).values(
			fixtures.map((f) => ({
				homeTeam: f.homeTeam,
				awayTeam: f.awayTeam,
				kickoff: f.kickoff,
				stage: f.stage,
				updatedAt: now
			}))
		);
		return json({ ok: true });
	}

	if (action === 'set-result') {
		const db = createDb(platform!.env.DB);
		const fixtureId = body.fixtureId as number;
		const fixtureResult = body.result as string;
		await db
			.update(fixture)
			.set({ result: fixtureResult, updatedAt: new Date().toISOString() })
			.where(eq(fixture.id, fixtureId));
		return json({ ok: true });
	}

	if (action === 'reset') {
		const raw = platform!.env.DB;
		await raw.exec('DELETE FROM pick');
		await raw.exec('DELETE FROM fixture');
		await raw.exec('DELETE FROM session');
		await raw.exec('DELETE FROM account');
		await raw.exec('DELETE FROM verification');
		await raw.exec('DELETE FROM user');
		return json({ ok: true });
	}

	throw error(400, 'unknown action');
};
