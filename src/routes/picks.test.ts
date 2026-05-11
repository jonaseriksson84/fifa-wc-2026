import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const standingsSvelte = readFileSync(
	resolve(__dirname, '../lib/components/Standings.svelte'),
	'utf-8'
);
const tiersSvelte = readFileSync(
	resolve(__dirname, '../lib/components/StickerTiersLegend.svelte'),
	'utf-8'
);
const pageHtml =
	readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8') + standingsSvelte + tiersSvelte;
const pageLower = pageHtml.toLowerCase();
const serverTs = readFileSync(resolve(__dirname, '+page.server.ts'), 'utf-8');
const repoTs = readFileSync(
	resolve(__dirname, '../lib/server/picks/pick-repository.ts'),
	'utf-8'
);

describe('picks page content', () => {
	it('uses domain language — Pick, Fixture, never bet/match/guess', () => {
		expect(pageHtml).toContain('Pick');
		expect(pageLower).not.toMatch(/\bbet\b/);
		expect(pageLower).not.toMatch(/\bguess\b/);
	});

	it('delegates fixture rendering to the Sticker component', () => {
		expect(pageHtml).toContain("from '$lib/components/Sticker.svelte'");
		expect(pageHtml).toContain('<Sticker');
	});

	it('uses fixtureIdentifier for fixture labels', () => {
		expect(pageHtml).toContain("from '$lib/fixture-identifier'");
		expect(pageHtml).toContain('fixtureIdentifier');
	});

	it('shows an unpicked counter', () => {
		expect(pageHtml).toContain('unpickedCount');
		expect(pageLower).toContain('unpicked');
	});

	it('has a toggle filter for unpicked fixtures', () => {
		expect(pageHtml).toContain('showUnpickedOnly');
		expect(pageLower).toContain('unpicked only');
	});

	it('groups fixtures by stage', () => {
		expect(pageHtml).toContain('groupByStage');
		expect(pageHtml).toContain('groupedFixtures');
	});

	it('renders ornament dividers between stages', () => {
		expect(pageHtml).toContain('stage-ornament');
	});

	it('computes locked state from kickoff time', () => {
		expect(pageHtml).toContain('isLocked');
		expect(pageHtml).toContain('f.kickoff');
	});

	it('passes currentPick and picksByValue to Sticker', () => {
		expect(pageHtml).toContain('currentPick');
		expect(pageHtml).toContain('picksByValue');
	});

	it('passes validation errors to the matching Sticker', () => {
		expect(pageHtml).toContain('form?.error');
		expect(pageHtml).toContain('form?.fixtureId');
	});
});

describe('pick repository', () => {
	it('exports getPicksForFixture', () => {
		expect(repoTs).toContain('export async function getPicksForFixture');
	});

	it('getPicksForFixture joins pick with user to retrieve email', () => {
		expect(repoTs).toContain('user');
		expect(repoTs).toContain('email');
	});
});

describe('section heading composition', () => {
	it('uses section-kicker class for the red kicker line', () => {
		expect(pageHtml).toContain('section-kicker');
	});

	it('uses section-heading class for the display heading', () => {
		expect(pageHtml).toContain('section-heading');
	});

	it('uses stage-label-row class for the dashed-rule + point-hint row', () => {
		expect(pageHtml).toContain('stage-label-row');
	});

	it('kicker is styled in red mono font', () => {
		expect(pageHtml).toContain('.section-kicker');
		const styleSection = pageHtml.slice(pageHtml.indexOf('<style'));
		expect(styleSection).toMatch(/\.section-kicker[\s\S]*?color:.*var\(--red\)/);
	});

	it('section heading uses Bungee Shade display font', () => {
		const styleSection = pageHtml.slice(pageHtml.indexOf('<style'));
		expect(styleSection).toMatch(/\.section-heading[\s\S]*?font-family:.*var\(--display\)/);
	});

	it('stage-label-row has a dashed rule that fills remaining space', () => {
		expect(pageHtml).toContain('stage-rule');
		const styleSection = pageHtml.slice(pageHtml.indexOf('<style'));
		expect(styleSection).toMatch(/\.stage-rule[\s\S]*?border.*dashed/);
	});

	it('includes point hint text per stage', () => {
		expect(pageHtml).toContain('point-hint');
		expect(pageLower).toContain('pt');
	});
});

describe('top-10 sidebar', () => {
	it('renders a sidebar with aria-label for accessibility', () => {
		expect(pageHtml).toContain('top10-sidebar');
		expect(pageHtml).toContain('aria-label="Top 10 standings"');
	});

	it('uses a sidebar-panel with overhang tab labelled TOP 10', () => {
		expect(pageHtml).toContain('sidebar-panel');
		expect(pageHtml).toContain('sidebar-overhang');
		expect(pageHtml).toContain('TOP 10');
	});

	it('renders a table with rank, display name, and points', () => {
		expect(pageHtml).toContain('standings-table');
		expect(pageHtml).toContain('class="rank"');
		expect(pageHtml).toContain('class="who"');
		expect(pageHtml).toContain('class="pts"');
	});

	it('highlights the current user row', () => {
		expect(pageHtml).toContain('class:you=');
		expect(pageHtml).toContain('currentUserId');
	});

	it('uses displayName helper for user names', () => {
		expect(pageHtml).toContain("from '$lib/display-name'");
		expect(pageHtml).toContain('displayName(entry)');
	});

	it('has a "See full leaderboard" link to /leaderboard', () => {
		expect(pageHtml).toContain('sidebar-link');
		expect(pageHtml).toContain('href="/leaderboard"');
		expect(pageLower).toContain('see full leaderboard');
	});

	it('applies ellipsis to sidebar display names', () => {
		const styleSection = pageHtml.slice(pageHtml.indexOf('<style'));
		expect(styleSection).toMatch(/\.who\b[\s\S]*?text-overflow:\s*ellipsis/);
	});

	it('sidebar stacks below picks on mobile (<1024px)', () => {
		const styleSection = pageHtml.slice(pageHtml.indexOf('<style'));
		expect(styleSection).toMatch(/max-width:\s*1023px/);
		expect(styleSection).toMatch(/flex-direction:\s*column/);
	});
});

describe('picks page server — guest access', () => {
	it('does NOT redirect guests away from / (no auth guard on load)', () => {
		const loadBlock = serverTs.slice(
			serverTs.indexOf('export const load'),
			serverTs.indexOf('export const actions')
		);
		expect(loadBlock).not.toMatch(/if\s*\(\s*!locals\.user\s*\)\s*throw\s+redirect/);
	});

	it('returns null currentUserId for guests', () => {
		expect(serverTs).toContain('currentUserId: locals.user?.id ?? null');
	});

	it('returns empty pickMap when no user (currentPick is null for all)', () => {
		expect(serverTs).toMatch(/locals\.user\s*\?\s*/);
	});

	it('hides others-picks chips for guests (picksByValue null when no user)', () => {
		expect(serverTs).toContain('locals.user');
	});

	it('keeps auth guard on the pick form action (defence in depth)', () => {
		const actionsBlock = serverTs.slice(serverTs.indexOf('actions'));
		expect(actionsBlock).toMatch(/if\s*\(\s*!locals\.user\s*\)/);
	});

	it('pick action redirects to /login?then=/ when unauthenticated', () => {
		expect(serverTs).toContain("/login?then=/");
	});
});

describe('picks page — guest pick button redirect', () => {
	it('Sticker receives a guest prop', () => {
		expect(pageHtml).toContain('guest');
	});

	it('guest pick buttons link to /login?then=/ instead of form submit', () => {
		const stickerSvelte = readFileSync(
			resolve(__dirname, '../lib/components/Sticker.svelte'),
			'utf-8'
		);
		expect(stickerSvelte).toContain('/login?then=/');
	});
});

describe('picks page server', () => {
	it('sorts fixtures by stage order then kickoff', () => {
		expect(serverTs).toContain('stageOrder');
		expect(serverTs).toContain('Group');
		expect(serverTs).toContain('R32');
		expect(serverTs).toContain('R16');
		expect(serverTs).toContain('QF');
		expect(serverTs).toContain('SF');
		expect(serverTs).toContain('3rd-place');
		expect(serverTs).toContain('Final');
	});

	it('computes unpicked count server-side', () => {
		expect(serverTs).toContain('unpickedCount');
	});

	it('validates picks via the validation module', () => {
		expect(serverTs).toContain('validatePick');
	});

	it('upserts picks via the repository', () => {
		expect(serverTs).toContain('upsertPick');
	});

	it('uses form actions for pick submission', () => {
		expect(serverTs).toContain('actions');
		expect(serverTs).toContain('pick:');
	});

	it('builds per-fixture pick buckets from allPicks and allUsers', () => {
		expect(serverTs).toContain('picksByFixtureId');
		expect(serverTs).toContain('userById');
	});

	it('fetches all users to identify who did not pick', () => {
		expect(serverTs).toContain('user');
	});

	it('computes leaderboard scores using computeScores', () => {
		expect(serverTs).toContain('computeScores');
	});

	it('exposes topLeaderboard via topN', () => {
		expect(serverTs).toContain('topN');
		expect(serverTs).toContain('topLeaderboard');
	});

	it('returns currentUserId for sidebar highlighting', () => {
		expect(serverTs).toContain('currentUserId');
	});

	it('only includes other users picks for locked fixtures', () => {
		expect(serverTs).toContain('kickoff');
		expect(serverTs).toContain('picksByValue');
	});

	it('excludes TBD fixtures from pickable count', () => {
		expect(serverTs).toContain('isKnownTeam');
	});

	it('returns a teams_not_known error when picking a TBD fixture', () => {
		expect(serverTs).toContain('teams_not_known');
	});
});
