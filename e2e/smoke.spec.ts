import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
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
		await request.post(`${BASE}/api/e2e`, {
			data: { action: 'reset' }
		});
		await request.post(`${BASE}/api/e2e`, {
			data: { action: 'seed-fixtures', fixtures: FIXTURES }
		});
	});

	test('full happy path', async ({ page, request }) => {
		// 1. Visit / as unauthenticated user
		await page.goto('/');
		await expect(page.locator('header')).toBeVisible();

		// 2. Navigate to /login, submit email
		await page.click('a[href="/login"]');
		await expect(page).toHaveURL('/login');
		await page.fill('input[name="email"]', TEST_EMAIL);
		await page.click('button[type="submit"]');
		await expect(page.locator('text=Check your inbox')).toBeVisible();

		// 3. Retrieve magic-link token via test endpoint
		const tokenRes = await request.get(
			`${BASE}/api/e2e?action=verification-token&email=${encodeURIComponent(TEST_EMAIL)}`
		);
		expect(tokenRes.ok()).toBe(true);
		const { token } = await tokenRes.json();
		expect(token).toBeTruthy();

		// Follow the magic link
		const verifyUrl = `${BASE}/api/auth/magic-link/verify?token=${token}&callbackURL=/account`;
		await page.goto(verifyUrl);

		// 4. Should land on a protected page, logged in
		await page.waitForURL('**/account');
		await expect(page.locator('header')).toContainText(TEST_EMAIL);

		// 5. Navigate to /picks
		await page.click('a[href="/picks"]');
		await expect(page).toHaveURL('/picks');
		await expect(page.locator('h1')).toContainText('My Picks');

		// 6. Submit a pick on the first fixture (Sweden vs Brazil → HOME)
		const firstFixture = page.locator('li').first();
		await expect(firstFixture).toContainText('Sweden');
		const homeButton = firstFixture.locator('button', { hasText: 'Sweden' });
		await homeButton.click();
		// Wait for the pick to be submitted (button becomes selected)
		await expect(homeButton).toHaveClass(/bg-\[color:var\(--accent\)\]/);

		// 7. Force a result for that fixture via the test helper
		const setResultRes = await request.post(`${BASE}/api/e2e`, {
			data: { action: 'set-result', fixtureId: 1, result: 'HOME' }
		});
		expect(setResultRes.ok()).toBe(true);

		// 8. Visit /leaderboard
		await page.click('a[href="/leaderboard"]');
		await expect(page).toHaveURL('/leaderboard');

		// 9. Assert the user appears with the expected point total (Group = 1 point)
		const leaderboardTable = page.locator('table');
		await expect(leaderboardTable.locator('td', { hasText: TEST_EMAIL })).toBeVisible();
		const row = leaderboardTable.locator('tr', { hasText: TEST_EMAIL });
		await expect(row).toContainText('1');
	});
});
