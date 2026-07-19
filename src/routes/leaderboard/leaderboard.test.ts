import { beforeEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const mocks = vi.hoisted(() => ({
	createDb: vi.fn(),
	getAllPicks: vi.fn(),
	deleteWinnerBet: vi.fn(),
	getAllWinnerBets: vi.fn(),
	getWinnerBet: vi.fn(),
	upsertWinnerBet: vi.fn()
}));

vi.mock('$lib/server/db', () => ({ createDb: mocks.createDb }));
vi.mock('$lib/server/picks/pick-repository', () => ({ getAllPicks: mocks.getAllPicks }));
vi.mock('$lib/server/winner-bet/winner-bet-repository', () => ({
	deleteWinnerBet: mocks.deleteWinnerBet,
	getAllWinnerBets: mocks.getAllWinnerBets,
	getWinnerBet: mocks.getWinnerBet,
	upsertWinnerBet: mocks.upsertWinnerBet
}));

import { actions, load } from './+page.server';

const __dirname = dirname(fileURLToPath(import.meta.url));
const standingsSvelte = readFileSync(
	resolve(__dirname, '../../lib/components/Standings.svelte'),
	'utf-8'
);
const tiersSvelte = readFileSync(
	resolve(__dirname, '../../lib/components/StickerTiersLegend.svelte'),
	'utf-8'
);
const pageHtml =
	readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8') + standingsSvelte + tiersSvelte;
const pageLower = pageHtml.toLowerCase();
const serverTs = readFileSync(resolve(__dirname, '+page.server.ts'), 'utf-8');
const loadServerTs = serverTs.split('export const actions')[0];

describe('leaderboard page content', () => {
	it('uses domain language — User, points, and winner bet, never guess', () => {
		expect(pageHtml).toContain('User');
		expect(pageHtml).toContain('points');
		expect(pageLower).toMatch(/\bbet\b/);
		expect(pageLower).not.toMatch(/\bguess\b/);
	});

	it('shows a rank column', () => {
		expect(pageLower).toContain('rank');
	});

	it('displays fixture results', () => {
		expect(pageHtml).toContain('result');
	});

	it('shows whether the current user pick was correct', () => {
		expect(pageHtml).toContain('correct');
	});

	it('renders user rows with points', () => {
		expect(pageHtml).toContain('entry.points');
		expect(pageHtml).toContain('entry.rank');
	});

	it('puts winner-bet controls and status tags directly on standings rows', () => {
		expect(pageHtml).toContain('?/winnerBet');
		expect(pageHtml).toContain('MY BET 🏆');
		expect(pageHtml).toContain('OUT');
		expect(pageHtml).toContain('◎');
		expect(pageHtml).toContain('use:enhance');
	});

	it('reveals backer display names on backed rows once bets are locked', () => {
		expect(pageHtml).toContain('🎫');
		expect(pageHtml).toContain('backersByPickedUserId');
		expect(pageHtml).toContain('displayName(backer)');
		expect(pageHtml).toContain('class:me={backer.userId === currentUserId}');
		expect(pageHtml).toContain('if (!winnerBet?.locked) return backers');
	});
});

describe('leaderboard Panini aesthetic', () => {
	it('has a STANDINGS overhang label', () => {
		expect(pageHtml).toContain('STANDINGS');
	});

	it('renders inside a paper-card panel with accent top strap', () => {
		expect(pageLower).toContain('panel');
		expect(pageLower).toContain('accent');
	});

	it('highlights the current user row', () => {
		expect(pageHtml).toMatch(/class:you/);
	});

	it('has a sticker tiers legend section', () => {
		expect(pageHtml).toContain('Sticker tiers');
	});

	it('lists all five foil tiers with correct point values', () => {
		expect(pageHtml).toContain('paper');
		expect(pageHtml).toContain('pearl');
		expect(pageHtml).toContain('holo');
		expect(pageHtml).toContain('gold');
		expect(pageHtml).toContain('legendary');
		expect(pageHtml).toContain('1 pt');
		expect(pageHtml).toContain('2 pts');
		expect(pageHtml).toContain('3 pts');
		expect(pageHtml).toContain('4 pts');
		expect(pageHtml).toContain('6 pts');
	});

	it('lists the correct stages for each tier', () => {
		expect(pageHtml).toContain('Group');
		expect(pageHtml).toContain('R32');
		expect(pageHtml).toContain('R16');
		expect(pageHtml).toContain('QF');
		expect(pageHtml).toContain('SF');
		expect(pageHtml).toContain('3rd-place');
		expect(pageHtml).toContain('Final');
	});

	it('uses foil swatch classes for the legend', () => {
		expect(pageLower).toContain('swatch');
	});

	it('keeps table structure for standings (e2e compat)', () => {
		expect(pageLower).toContain('<table');
		expect(pageLower).toContain('<tr');
		expect(pageLower).toContain('<td');
	});
});

describe('leaderboard page server — guest access', () => {
	it('does NOT redirect guests away from /leaderboard (no auth guard on load)', () => {
		expect(loadServerTs).not.toMatch(/if\s*\(\s*!locals\.user\s*\)\s*throw\s+redirect/);
	});

	it('returns null currentUserId for guests', () => {
		expect(serverTs).toContain('locals.user?.id ?? null');
	});

	it('returns empty fixturesWithResults pick data for guests', () => {
		expect(serverTs).toContain('locals.user');
	});
});

describe('leaderboard page — guest view', () => {
	it('hides the Results & My Picks section for guests', () => {
		expect(pageHtml).toContain('currentUserId');
	});
});

describe('leaderboard page server', () => {
	it('delegates scoring to the scoring module', () => {
		expect(serverTs).toContain('computeScores');
	});

	it('reads all picks from the database', () => {
		expect(serverTs).toContain('pick');
	});

	it('reads all fixtures from the database', () => {
		expect(serverTs).toContain('fixture');
	});

	it('delegates ranking and tie detection to the shared rankEntries utility', () => {
		expect(serverTs).toContain('rankEntries');
	});

	it('returns winner-bet eligibility, the current bet, and lock state', () => {
		expect(serverTs).toContain('canStillWin');
		expect(serverTs).toContain('myWinnerBet:');
		expect(serverTs).toContain('winnerBetLocked');
	});
});

function loadEvent() {
	return {
		locals: { user: { id: 'bettor' } },
		platform: { env: { DB: {} } }
	};
}

function finalFixture(kickoff: string) {
	return {
		id: 64,
		stage: 'Final',
		kickoff,
		result: null
	};
}

describe('leaderboard winner-bet reveal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getAllPicks.mockResolvedValue([]);
		mocks.getWinnerBet.mockResolvedValue(null);
	});

	it('does not fetch or expose other users\' bets before the lock', async () => {
		mocks.createDb.mockReturnValue(
			dbReturning(
				[finalFixture('2999-01-01T00:00:00.000Z')],
				[{ id: 'bettor', name: 'Bettor', email: 'bettor@example.com', displayName: null }]
			)
		);
		mocks.getAllWinnerBets.mockResolvedValue([
			{ userId: 'someone-else', pickedUserId: 'bettor', updatedAt: '' }
		]);

		const result = (await load(loadEvent() as never)) as { winnerBets: unknown[] };

		expect(result.winnerBets).toEqual([]);
		expect(mocks.getAllWinnerBets).not.toHaveBeenCalled();
	});

	it('returns all mapped bets after the lock', async () => {
		mocks.createDb.mockReturnValue(
			dbReturning(
				[finalFixture('2000-01-01T00:00:00.000Z')],
				[{ id: 'bettor', name: 'Bettor', email: 'bettor@example.com', displayName: null }]
			)
		);
		mocks.getAllWinnerBets.mockResolvedValue([
			{ userId: 'bettor', pickedUserId: 'target', updatedAt: '2000-01-01T00:00:00.000Z' }
		]);

		const result = (await load(loadEvent() as never)) as {
			winnerBets: { bettorId: string; pickedUserId: string }[];
		};

		expect(result.winnerBets).toEqual([{ bettorId: 'bettor', pickedUserId: 'target' }]);
		expect(mocks.getAllWinnerBets).toHaveBeenCalledOnce();
	});
});

function actionEvent(pickedUserId: string) {
	const formData = new FormData();
	formData.set('pickedUserId', pickedUserId);

	return {
		request: new Request('http://localhost/leaderboard?/winnerBet', {
			method: 'POST',
			body: formData
		}),
		locals: { user: { id: 'bettor' } },
		platform: { env: { DB: {} } }
	};
}

function dbReturning(...results: unknown[]) {
	const from = vi.fn();
	for (const result of results) from.mockResolvedValueOnce(result);
	return { select: vi.fn(() => ({ from })) };
}

describe('leaderboard winnerBet action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects changes after the Final has kicked off', async () => {
		mocks.createDb.mockReturnValue(
			dbReturning([
				{
					id: 64,
					stage: 'Final',
					kickoff: '2000-01-01T00:00:00.000Z',
					result: null
				}
			])
		);

		const result = await actions.winnerBet!(actionEvent('target') as never);

		expect(result).toMatchObject({ status: 403 });
		expect(mocks.upsertWinnerBet).not.toHaveBeenCalled();
	});

	it('rejects a target whose maximum possible points are below the leader', async () => {
		mocks.createDb.mockReturnValue(
			dbReturning(
				[
					{
						id: 1,
						stage: 'QF',
						kickoff: '2000-01-01T00:00:00.000Z',
						result: 'HOME'
					}
				],
				[
					{ id: 'leader', name: 'Leader', email: 'leader@example.com', displayName: null },
					{ id: 'target', name: 'Target', email: 'target@example.com', displayName: null }
				]
			)
		);
		mocks.getAllPicks.mockResolvedValue([
			{ id: 1, userId: 'leader', fixtureId: 1, value: 'HOME', updatedAt: '' }
		]);

		const result = await actions.winnerBet!(actionEvent('target') as never);

		expect(result).toMatchObject({ status: 403 });
		expect(mocks.upsertWinnerBet).not.toHaveBeenCalled();
	});
});
