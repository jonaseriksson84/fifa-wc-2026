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
