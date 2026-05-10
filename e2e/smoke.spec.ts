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
		await expect(page.locator('header')).toContainText(TEST_EMAIL.split('@')[0]);

		await page.click('a[href="/picks"]');
		await expect(page).toHaveURL('/picks');
		await expect(page.locator('h1')).toContainText('My Picks');

		const firstSticker = page.locator('article.sticker').first();
		await expect(firstSticker).toContainText('Sweden');
		const homeButton = firstSticker.locator('button.pick-btn', { hasText: 'Sweden' });
		await homeButton.click();
		await expect(homeButton).toHaveClass(/selected/);

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

	test('guest can view /picks without signing in', async ({ page, request }) => {
		await request.post('/api/e2e', { data: { action: 'reset' } });
		await request.post('/api/e2e', { data: { action: 'seed-fixtures', fixtures: FIXTURES } });

		await page.goto('/picks');
		await expect(page).toHaveURL('/picks');
		await expect(page.locator('h1')).toContainText('My Picks');
		await expect(page.locator('article.sticker').first()).toContainText('Sweden');

		const pickButton = page.locator('a.pick-btn.guest-link').first();
		await expect(pickButton).toBeVisible();
		await pickButton.click();
		await expect(page).toHaveURL(/\/login\?then=\/picks/);
	});

	test('guest can view /leaderboard without signing in', async ({ page, request }) => {
		await request.post('/api/e2e', { data: { action: 'reset' } });
		await request.post('/api/e2e', { data: { action: 'seed-fixtures', fixtures: FIXTURES } });

		await page.goto('/leaderboard');
		await expect(page).toHaveURL('/leaderboard');
		await expect(page.locator('text=STANDINGS')).toBeVisible();
		await expect(page.locator('text=Results')).not.toBeVisible();
	});

	test('guest cannot access /account', async ({ page }) => {
		await page.goto('/account');
		await expect(page).toHaveURL(/\/login/);
	});

	test('display name: set on account, appears on leaderboard and chips', async ({ page, request }) => {
		const email = `dn-${Date.now()}@test.local`;
		const displayName = 'TestNickname';

		await request.post('/api/e2e', { data: { action: 'reset' } });
		await request.post('/api/e2e', { data: { action: 'seed-fixtures', fixtures: FIXTURES } });

		await page.goto('/login');
		await page.fill('input[name="email"]', email);
		await page.click('button[type="submit"]');

		const tokenRes = await request.get(
			`/api/e2e?action=verification-token&email=${encodeURIComponent(email)}`
		);
		const { token } = await tokenRes.json();
		await page.goto(`/api/auth/magic-link/verify?token=${token}&callbackURL=/account`);
		await page.waitForURL('**/account');

		await page.fill('input[name="displayName"]', displayName);
		await page.click('button:has-text("Save")');
		await page.waitForLoadState('networkidle');

		await page.goto('/account');
		await expect(page.locator('input[name="displayName"]')).toHaveValue(displayName);
		await expect(page.locator('header')).toContainText(displayName);

		await page.click('a[href="/picks"]');
		const firstSticker = page.locator('article.sticker').first();
		const homeButton = firstSticker.locator('button.pick-btn', { hasText: 'Sweden' });
		await homeButton.click();

		const setResultRes = await request.post('/api/e2e', {
			data: { action: 'set-result', fixtureId: 1, result: 'HOME' }
		});
		expect(setResultRes.ok()).toBe(true);

		await page.click('a[href="/leaderboard"]');
		await expect(page).toHaveURL('/leaderboard');

		const leaderboardTable = page.locator('table');
		await expect(leaderboardTable.locator('td', { hasText: displayName })).toBeVisible();
	});
});
