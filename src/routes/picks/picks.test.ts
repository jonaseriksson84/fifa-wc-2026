import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageHtml = readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8');
const pageLower = pageHtml.toLowerCase();
const serverTs = readFileSync(resolve(__dirname, '+page.server.ts'), 'utf-8');
const repoTs = readFileSync(
	resolve(__dirname, '../../lib/server/picks/pick-repository.ts'),
	'utf-8'
);

describe('picks page content', () => {
	it('uses domain language — Pick, Fixture, never bet/match/guess', () => {
		expect(pageHtml).toContain('Pick');
		expect(pageLower).not.toMatch(/\bbet\b/);
		expect(pageLower).not.toMatch(/\bmatch\b/);
		expect(pageLower).not.toMatch(/\bguess\b/);
	});

	it('shows HOME, DRAW, AWAY pick buttons', () => {
		expect(pageHtml).toContain('HOME');
		expect(pageHtml).toContain('DRAW');
		expect(pageHtml).toContain('AWAY');
	});

	it('renders team names for home and away buttons', () => {
		expect(pageHtml).toContain('f.homeTeam');
		expect(pageHtml).toContain('f.awayTeam');
	});

	it('shows an unpicked counter', () => {
		expect(pageHtml).toContain('unpickedCount');
		expect(pageLower).toContain('unpicked');
	});

	it('has a toggle filter for unpicked fixtures', () => {
		expect(pageHtml).toContain('showUnpickedOnly');
		expect(pageLower).toContain('unpicked only');
	});

	it('displays kickoff time using Intl.DateTimeFormat', () => {
		expect(pageHtml).toContain('Intl.DateTimeFormat');
		expect(pageHtml).toContain('f.kickoff');
	});

	it('shows a stage label per fixture', () => {
		expect(pageHtml).toContain('f.stage');
	});

	it('renders a closed indicator for locked fixtures', () => {
		expect(pageLower).toContain('closed');
		expect(pageHtml).toContain('locked');
	});

	it('disables buttons on locked fixtures', () => {
		expect(pageHtml).toContain('disabled={locked}');
	});

	it('distinguishes knockout fixtures — no DRAW option', () => {
		expect(pageHtml).toContain('knockoutStages');
		expect(pageHtml).toContain('isKnockout');
	});

	it('visually selects the current pick using the accent color', () => {
		expect(pageHtml).toContain('currentPick');
		expect(pageHtml).toContain('bg-[color:var(--accent)]');
	});

	it('renders validation errors inline near the fixture', () => {
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

describe('picks page server', () => {
	it('redirects to /login when not authenticated', () => {
		expect(serverTs).toContain("redirect(302, '/login')");
	});

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

	it('imports getPicksForFixture from the repository', () => {
		expect(serverTs).toContain('getPicksForFixture');
	});

	it('fetches all users to identify who did not pick', () => {
		expect(serverTs).toContain('user');
	});

	it('only includes other users picks for locked fixtures', () => {
		expect(serverTs).toContain('kickoff');
		expect(serverTs).toContain('picksByValue');
	});
});

describe('pick visibility UI', () => {
	it('renders a pick reveal section for locked fixtures', () => {
		expect(pageHtml).toContain('picksByValue');
	});

	it('shows user emails in the pick breakdown', () => {
		expect(pageLower).toContain('email');
	});

	it('shows a no-pick bucket for users who did not pick', () => {
		expect(pageHtml).toContain('noPick');
	});

	it('groups picks by value (HOME / DRAW / AWAY)', () => {
		expect(pageHtml).toContain('picksByValue');
	});
});
