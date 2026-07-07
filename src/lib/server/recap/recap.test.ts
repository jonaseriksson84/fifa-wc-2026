import { describe, it, expect } from 'vitest';
import { computeRecap, type RecapUser, type RecapPick, type RecapFixture } from './recap';

function makeUser(id: string, name = id): RecapUser {
	return { id, name, email: `${id}@local.test`, displayName: null };
}

function makeFixture(
	overrides: Partial<RecapFixture> & { id: number; stage: string }
): RecapFixture {
	return { result: null, kickoff: '2026-06-11T18:00:00.000Z', ...overrides };
}

function makePick(userId: string, fixtureId: number, value: string): RecapPick {
	return { userId, fixtureId, value };
}

describe('computeRecap — availability gate', () => {
	it('is unavailable when the Final fixture has no Result yet', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Final', result: null })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.available).toBe(false);
	});

	it('is available the moment the Final fixture has a Result', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', result: 'HOME' }),
			makeFixture({ id: 2, stage: 'Final', result: 'AWAY' })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.available).toBe(true);
	});

	it('is unavailable when there is no Final fixture at all', () => {
		const fixtures = [makeFixture({ id: 1, stage: 'Group', result: 'HOME' })];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.available).toBe(false);
	});
});

describe('computeRecap — title card stats', () => {
	it('counts every fixture in the tournament', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group' }),
			makeFixture({ id: 2, stage: 'Group' }),
			makeFixture({ id: 3, stage: 'Final' })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.title.fixtureCount).toBe(3);
	});

	it('counts every registered player, including those with zero Picks', () => {
		const users = [makeUser('u1'), makeUser('u2'), makeUser('u3')];
		const fixtures = [makeFixture({ id: 1, stage: 'Final', result: 'HOME' })];
		// Only u1 has a pick; u2 and u3 still count as players.
		const picks = [makePick('u1', 1, 'HOME')];

		const recap = computeRecap(users, picks, fixtures);

		expect(recap.title.playerCount).toBe(3);
	});

	it('reports the tournament date span from first to last kickoff', () => {
		const fixtures = [
			makeFixture({ id: 1, stage: 'Group', kickoff: '2026-06-11T18:00:00.000Z' }),
			makeFixture({ id: 2, stage: 'QF', kickoff: '2026-07-10T18:00:00.000Z' }),
			makeFixture({ id: 3, stage: 'Final', kickoff: '2026-07-19T18:00:00.000Z' })
		];

		const recap = computeRecap([makeUser('u1')], [], fixtures);

		expect(recap.title.firstKickoff).toBe('2026-06-11T18:00:00.000Z');
		expect(recap.title.lastKickoff).toBe('2026-07-19T18:00:00.000Z');
	});
});

describe('computeRecap — empty-data safety', () => {
	it('never throws and reports zeros for an empty pool', () => {
		const recap = computeRecap([], [], []);

		expect(recap.available).toBe(false);
		expect(recap.title.fixtureCount).toBe(0);
		expect(recap.title.playerCount).toBe(0);
		expect(recap.title.firstKickoff).toBeNull();
		expect(recap.title.lastKickoff).toBeNull();
	});
});
