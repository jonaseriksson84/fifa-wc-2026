import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf-8');

const picksServer = read('+page.server.ts');
const leaderboardServer = read('leaderboard/+page.server.ts');
const accountServer = read('account/+page.server.ts');
const loginServer = read('login/+page.server.ts');
const loginPage = read('login/+page.svelte');
const accountPage = read('account/+page.svelte');
const authTs = read('../lib/server/auth.ts');

// Every path that writes to the database must consult POOL_FROZEN before it
// does, so a frozen pool's data is final no matter which surface is poked.
describe('frozen pool — write guards', () => {
	it('the pick action refuses picks', () => {
		expect(picksServer).toContain('isPoolFrozen');
		expect(picksServer).toMatch(/isPoolFrozen\(platform!\.env\.POOL_FROZEN\)/);
		expect(picksServer.indexOf('isPoolFrozen(platform!.env.POOL_FROZEN)')).toBeLessThan(
			picksServer.indexOf('upsertPick(')
		);
	});

	it('the winner bet action refuses winner picks', () => {
		expect(leaderboardServer).toMatch(/isPoolFrozen\(platform!\.env\.POOL_FROZEN\)/);
		expect(leaderboardServer.indexOf('isPoolFrozen(platform!.env.POOL_FROZEN)')).toBeLessThan(
			leaderboardServer.indexOf('upsertWinnerBet(')
		);
	});

	it('the display name action refuses edits', () => {
		expect(accountServer).toMatch(/isPoolFrozen\(platform!\.env\.POOL_FROZEN\)/);
		expect(accountServer.indexOf('isPoolFrozen(platform!.env.POOL_FROZEN)')).toBeLessThan(
			accountServer.indexOf('db\n\t\t\t.update(user)')
		);
	});

	it('guards return 403 rather than silently succeeding', () => {
		for (const server of [picksServer, leaderboardServer, accountServer]) {
			expect(server).toContain('fail(403, { error: POOL_FROZEN_MESSAGE');
		}
	});
});

describe('frozen pool — sign-ups', () => {
	it('blocks user creation at the auth layer, before the domain check', () => {
		expect(authTs).toContain('isPoolFrozen(env.POOL_FROZEN)');
		expect(authTs).toContain("throw new APIError('FORBIDDEN', { message: SIGNUP_CLOSED_MESSAGE })");
		expect(authTs.indexOf('if (frozen)')).toBeLessThan(authTs.indexOf('isEmailAllowed(user.email'));
	});

	it('disables magic-link sign-up when frozen', () => {
		expect(authTs).toContain('disableSignUp: frozen');
	});

	it('does not email a magic link to an address with no account', () => {
		expect(loginServer).toContain('isPoolFrozen(platform!.env.POOL_FROZEN)');
		expect(loginServer).toContain('SIGNUP_CLOSED_MESSAGE');
		expect(loginServer.indexOf('SIGNUP_CLOSED_MESSAGE, email')).toBeLessThan(
			loginServer.indexOf('signInMagicLink')
		);
	});

	it('reports a closed pool rather than a domain restriction on OAuth failure', () => {
		expect(loginServer).toContain('if (frozen) {');
		expect(loginServer).toContain('oauthError = SIGNUP_CLOSED_MESSAGE;');
	});
});

describe('frozen pool — UI', () => {
	it('tells visitors on the login page that sign-ups are closed', () => {
		expect(loginPage).toContain('data.frozen');
		expect(loginPage.toLowerCase()).toContain('sign-ups are closed');
	});

	it('still offers sign-in to existing members', () => {
		expect(loginPage).toContain('?/magicLink');
	});

	it('disables the display name form', () => {
		expect(accountPage).toContain('disabled={data.frozen}');
	});
});
