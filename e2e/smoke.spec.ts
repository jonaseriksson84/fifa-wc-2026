import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@test.local`;

const FIXTURES = [
	{
		homeTeam: 'Sweden',
		awayTeam: 'Brazil',
		kickoff: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		stage: 'Group'
	},
	{
		homeTeam: 'Germany',
		awayTeam: 'Japan',
		kickoff: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
		stage: 'Group'
	},
	{
		homeTeam: 'Argentina',
		awayTeam: 'France',
		kickoff: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
		stage: 'QF'
	}
];

test.describe('Smoke E2E: signup → pick → leaderboard', () => {
	test.beforeAll(async ({ request }) => {
		await request.post('/api/e2e', {
			data: { action: 'reset' }
		});
		await request.post('/api/e2e', {
			data: { action: 'seed-fixtures', fixtures: FIXTURES }
		});
	});

	test('full happy path', async ({ page, request }) => {
		await page.goto('/');
		await expect(page.locator('header')).toBeVisible();

		await page.click('a[href="/login"]');
		await expect(page).toHaveURL('/login');
		await page.fill('input[name="email"]', TEST_EMAIL);
		await page.click('button[type="submit"]');
		await expect(page.locator('text=Check your inbox')).toBeVisible();

		const tokenRes = await request.get(
			`/api/e2e?action=verification-token&email=${encodeURIComponent(TEST_EMAIL)}`
		);
		expect(tokenRes.ok()).toBe(true);
		const { token } = await tokenRes.json();
		expect(token).toBeTruthy();

		await page.goto(`/api/auth/magic-link/verify?token=${token}&callbackURL=/account`);

		await page.waitForURL('**/account');
		await expect(page.locator('header')).toContainText(TEST_EMAIL);

		await page.click('a[href="/picks"]');
		await expect(page).toHaveURL('/picks');
		await expect(page.locator('h1')).toContainText('My Picks');

		const firstFixture = page.locator('li').first();
		await expect(firstFixture).toContainText('Sweden');
		const homeButton = firstFixture.locator('button', { hasText: 'Sweden' });
		await homeButton.click();
		await expect(homeButton).toHaveClass(/bg-\[color:var\(--accent\)\]/);

		const setResultRes = await request.post('/api/e2e', {
			data: { action: 'set-result', fixtureId: 1, result: 'HOME' }
		});
		expect(setResultRes.ok()).toBe(true);

		await page.click('a[href="/leaderboard"]');
		await expect(page).toHaveURL('/leaderboard');

		const leaderboardTable = page.locator('table');
		await expect(leaderboardTable.locator('td', { hasText: TEST_EMAIL })).toBeVisible();
		const row = leaderboardTable.locator('tr', { hasText: TEST_EMAIL });
		// Group stage = 1 point
		await expect(row).toContainText('1');
	});
});
