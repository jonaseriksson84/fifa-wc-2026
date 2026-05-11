import { describe, it, expect } from 'vitest';
import { pickRevealIndex } from './pick-reveal';

const kickoff = '2026-06-11T18:00:00.000Z';
const beforeKickoff = new Date('2026-06-11T17:59:59.999Z');
const afterKickoff = new Date('2026-06-11T18:00:00.000Z');

const users = [
	{ id: 'u1', name: 'Ada', email: 'ada@x.com', displayName: null },
	{ id: 'u2', name: 'Bob', email: 'bob@x.com', displayName: 'Bobby' },
	{ id: 'u3', name: 'Cat', email: 'cat@x.com', displayName: null }
];

describe('pickRevealIndex — privacy rule', () => {
	it('returns null before lock time (picks are private until kickoff)', () => {
		const reveal = pickRevealIndex(
			[{ fixtureId: 1, userId: 'u1', value: 'HOME' }],
			users
		);
		expect(reveal(1, kickoff, beforeKickoff)).toBeNull();
	});

	it('returns buckets at and after lock time', () => {
		const reveal = pickRevealIndex(
			[{ fixtureId: 1, userId: 'u1', value: 'HOME' }],
			users
		);
		expect(reveal(1, kickoff, afterKickoff)).not.toBeNull();
	});
});

describe('pickRevealIndex — bucketing', () => {
	it('places each picker under the value they picked, using displayName', () => {
		const reveal = pickRevealIndex(
			[
				{ fixtureId: 1, userId: 'u1', value: 'HOME' },
				{ fixtureId: 1, userId: 'u2', value: 'DRAW' },
				{ fixtureId: 1, userId: 'u3', value: 'AWAY' }
			],
			users
		);
		const buckets = reveal(1, kickoff, afterKickoff)!;
		expect(buckets.HOME).toEqual(['Ada']);
		expect(buckets.DRAW).toEqual(['Bobby']);
		expect(buckets.AWAY).toEqual(['Cat']);
		expect(buckets.noPick).toEqual([]);
	});

	it('places users with no pick on this fixture into the noPick bucket', () => {
		const reveal = pickRevealIndex(
			[{ fixtureId: 1, userId: 'u1', value: 'HOME' }],
			users
		);
		const buckets = reveal(1, kickoff, afterKickoff)!;
		expect(buckets.HOME).toEqual(['Ada']);
		expect(buckets.noPick).toEqual(['Bobby', 'Cat']);
	});

	it('places ALL users in noPick when no one picked', () => {
		const reveal = pickRevealIndex([], users);
		const buckets = reveal(1, kickoff, afterKickoff)!;
		expect(buckets.HOME).toEqual([]);
		expect(buckets.DRAW).toEqual([]);
		expect(buckets.AWAY).toEqual([]);
		expect(buckets.noPick).toEqual(['Ada', 'Bobby', 'Cat']);
	});

	it('ignores picks on other fixtures when bucketing for one fixture', () => {
		const reveal = pickRevealIndex(
			[
				{ fixtureId: 1, userId: 'u1', value: 'HOME' },
				{ fixtureId: 2, userId: 'u2', value: 'AWAY' }
			],
			users
		);
		const buckets = reveal(1, kickoff, afterKickoff)!;
		expect(buckets.HOME).toEqual(['Ada']);
		expect(buckets.AWAY).toEqual([]);
		expect(buckets.noPick).toEqual(['Bobby', 'Cat']);
	});

	it('returns empty buckets when no users exist (defensive)', () => {
		const reveal = pickRevealIndex([], []);
		const buckets = reveal(1, kickoff, afterKickoff)!;
		expect(buckets).toEqual({ HOME: [], DRAW: [], AWAY: [], noPick: [] });
	});

	it('reuses the index efficiently — many fixtures, one build', () => {
		const reveal = pickRevealIndex(
			[
				{ fixtureId: 1, userId: 'u1', value: 'HOME' },
				{ fixtureId: 2, userId: 'u2', value: 'DRAW' },
				{ fixtureId: 3, userId: 'u3', value: 'AWAY' }
			],
			users
		);
		expect(reveal(1, kickoff, afterKickoff)!.HOME).toEqual(['Ada']);
		expect(reveal(2, kickoff, afterKickoff)!.DRAW).toEqual(['Bobby']);
		expect(reveal(3, kickoff, afterKickoff)!.AWAY).toEqual(['Cat']);
	});
});
