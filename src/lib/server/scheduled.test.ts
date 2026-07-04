import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import { handleScheduled } from './scheduled';
import { ApiFootballRateLimitError } from './api-football/client';

const FIXTURE_DDL = [
	`CREATE TABLE fixture (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, home_team text NOT NULL, away_team text NOT NULL, kickoff text NOT NULL, stage text NOT NULL, matchday integer, result text, final_score text, api_football_id integer, updated_at text NOT NULL);`,
	`CREATE UNIQUE INDEX fixture_api_football_id_unique ON fixture (api_football_id);`
].join('\n');

const REFRESHER_CRON = '0 8 * * *';

function insertFixture(id: number, stage: string, kickoff: string, homeTeam: string, awayTeam: string, opts?: { matchday?: number; apiFootballId?: number }) {
	const md = opts?.matchday ?? 'NULL';
	const afId = opts?.apiFootballId ?? 'NULL';
	return `INSERT INTO fixture (id, home_team, away_team, kickoff, stage, matchday, api_football_id, updated_at) VALUES (${id}, '${homeTeam}', '${awayTeam}', '${kickoff}', '${stage}', ${md}, ${afId}, '2026-05-18T00:00:00.000Z');`;
}

async function getDb(): Promise<D1Database> {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok"); } }',
		d1Databases: { DB: 'test-db' }
	});
	const db = await mf.getD1Database('DB');
	await db.exec(FIXTURE_DDL);
	return db;
}

async function seedPlaceholders(db: D1Database) {
	await db.exec(insertFixture(73, 'R32', '2026-06-28T19:00:00.000Z', 'Runner-up A', 'Runner-up B'));
	await db.exec(insertFixture(74, 'R32', '2026-06-29T20:30:00.000Z', 'Winner E', '3rd-place'));
	await db.exec(insertFixture(89, 'R16', '2026-07-04T17:00:00.000Z', 'Winner R32.01', 'Winner R32.04'));
}

async function seedGroupFixture(db: D1Database) {
	await db.exec(insertFixture(1, 'Group', '2026-06-12T00:00:00.000Z', 'Mexico', 'Honduras', { matchday: 1, apiFootballId: 12345 }));
}

function fakeScheduledEvent(cron: string): ScheduledEvent {
	return { cron, scheduledTime: Date.now(), noRetry() {} } as ScheduledEvent;
}

describe('refreshFixtures – knockout routing', () => {
	let db: D1Database;
	let mockFetchFixtures: ReturnType<typeof vi.fn>;
	let logSpy: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		db = await getDb();
		await seedPlaceholders(db);
		await seedGroupFixture(db);
		mockFetchFixtures = vi.fn();
		logSpy = vi.fn();
		vi.spyOn(console, 'log').mockImplementation(logSpy);
		vi.spyOn(console, 'warn').mockImplementation(logSpy);
	});

	it('updates a knockout placeholder in place when (stage, kickoff) matches', async () => {
		mockFetchFixtures.mockResolvedValue([
			{
				apiFootballId: 99001,
				homeTeam: 'Brazil',
				awayTeam: 'South Korea',
				kickoff: '2026-06-28T19:00:00.000Z',
				stage: 'R32',
				matchday: null
			},
			{
				apiFootballId: 12345,
				homeTeam: 'Mexico',
				awayTeam: 'Honduras',
				kickoff: '2026-06-12T00:00:00.000Z',
				stage: 'Group',
				matchday: 1
			}
		]);

		await handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
			DB: db,
			API_FOOTBALL_KEY: 'test-key',
			__testFetchFixtures: mockFetchFixtures
		});

		const row = await db
			.prepare('SELECT * FROM fixture WHERE id = 73')
			.first<Record<string, unknown>>();

		expect(row!.home_team).toBe('Brazil');
		expect(row!.away_team).toBe('South Korea');
		expect(row!.api_football_id).toBe(99001);
		expect(row!.id).toBe(73);

		const total = await db
			.prepare('SELECT COUNT(*) as cnt FROM fixture')
			.first<{ cnt: number }>();
		expect(total!.cnt).toBe(4);
	});

	it('skips and logs a warning when knockout fixture has no placeholder match', async () => {
		mockFetchFixtures.mockResolvedValue([
			{
				apiFootballId: 99002,
				homeTeam: 'Argentina',
				awayTeam: 'Japan',
				kickoff: '2026-06-28T22:00:00.000Z',
				stage: 'R32',
				matchday: null
			}
		]);

		await handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
			DB: db,
			API_FOOTBALL_KEY: 'test-key',
			__testFetchFixtures: mockFetchFixtures
		});

		const warnCalls = logSpy.mock.calls
			.map((c) => c[0])
			.filter((msg) => typeof msg === 'string' && msg.includes('no placeholder match'));
		expect(warnCalls.length).toBeGreaterThan(0);

		const total = await db
			.prepare('SELECT COUNT(*) as cnt FROM fixture')
			.first<{ cnt: number }>();
		expect(total!.cnt).toBe(4);
	});

	it('routes group fixtures through the existing api_football_id upsert path', async () => {
		mockFetchFixtures.mockResolvedValue([
			{
				apiFootballId: 12345,
				homeTeam: 'Mexico',
				awayTeam: 'Honduras',
				kickoff: '2026-06-12T01:00:00.000Z',
				stage: 'Group',
				matchday: 1
			}
		]);

		await handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
			DB: db,
			API_FOOTBALL_KEY: 'test-key',
			__testFetchFixtures: mockFetchFixtures
		});

		const row = await db
			.prepare('SELECT * FROM fixture WHERE api_football_id = 12345')
			.first<Record<string, unknown>>();

		expect(row!.kickoff).toBe('2026-06-12T01:00:00.000Z');
	});

	it('once resolved, knockout fixture falls through api_football_id upsert on next pass', async () => {
		await db
			.prepare('UPDATE fixture SET api_football_id = 99001 WHERE id = 73')
			.run();

		mockFetchFixtures.mockResolvedValue([
			{
				apiFootballId: 99001,
				homeTeam: 'Brazil',
				awayTeam: 'Korea Republic',
				kickoff: '2026-06-28T19:00:00.000Z',
				stage: 'R32',
				matchday: null
			}
		]);

		await handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
			DB: db,
			API_FOOTBALL_KEY: 'test-key',
			__testFetchFixtures: mockFetchFixtures
		});

		const row = await db
			.prepare('SELECT * FROM fixture WHERE id = 73')
			.first<Record<string, unknown>>();

		expect(row!.away_team).toBe('Korea Republic');
	});
});

describe('refreshFixtures – rate-limit retry', () => {
	let db: D1Database;
	let mockFetchFixtures: ReturnType<typeof vi.fn>;
	let sleepSpy: ReturnType<typeof vi.fn>;

	const resolvedFixture = {
		apiFootballId: 99001,
		homeTeam: 'Brazil',
		awayTeam: 'South Korea',
		kickoff: '2026-06-28T19:00:00.000Z',
		stage: 'R32' as const,
		matchday: null
	};

	beforeEach(async () => {
		db = await getDb();
		await seedPlaceholders(db);
		mockFetchFixtures = vi.fn();
		sleepSpy = vi.fn().mockResolvedValue(undefined);
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	it('retries after a transient rate-limit error and then resolves the placeholder', async () => {
		mockFetchFixtures
			.mockRejectedValueOnce(new ApiFootballRateLimitError('rate limited'))
			.mockResolvedValueOnce([resolvedFixture]);

		await handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
			DB: db,
			API_FOOTBALL_KEY: 'test-key',
			__testFetchFixtures: mockFetchFixtures,
			__testSleep: sleepSpy
		});

		expect(mockFetchFixtures).toHaveBeenCalledTimes(2);
		expect(sleepSpy).toHaveBeenCalledTimes(1);

		const row = await db
			.prepare('SELECT * FROM fixture WHERE id = 73')
			.first<Record<string, unknown>>();
		expect(row!.home_team).toBe('Brazil');
		expect(row!.api_football_id).toBe(99001);
	});

	it('gives up after exhausting retries and rethrows', async () => {
		mockFetchFixtures.mockRejectedValue(new ApiFootballRateLimitError('rate limited'));

		await expect(
			handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
				DB: db,
				API_FOOTBALL_KEY: 'test-key',
				__testFetchFixtures: mockFetchFixtures,
				__testSleep: sleepSpy
			})
		).rejects.toThrow(ApiFootballRateLimitError);

		// initial attempt + 3 retries
		expect(mockFetchFixtures).toHaveBeenCalledTimes(4);
		expect(sleepSpy).toHaveBeenCalledTimes(3);

		// placeholder untouched
		const row = await db
			.prepare('SELECT * FROM fixture WHERE id = 73')
			.first<Record<string, unknown>>();
		expect(row!.home_team).toBe('Runner-up A');
	});

	it('does not retry on a non-rate-limit error', async () => {
		mockFetchFixtures.mockRejectedValue(new Error('boom'));

		await expect(
			handleScheduled(fakeScheduledEvent(REFRESHER_CRON), {
				DB: db,
				API_FOOTBALL_KEY: 'test-key',
				__testFetchFixtures: mockFetchFixtures,
				__testSleep: sleepSpy
			})
		).rejects.toThrow('boom');

		expect(mockFetchFixtures).toHaveBeenCalledTimes(1);
		expect(sleepSpy).not.toHaveBeenCalled();
	});
});
