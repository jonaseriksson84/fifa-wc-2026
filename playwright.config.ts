import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:5173',
		headless: true,
		launchOptions: {
			args: ['--no-sandbox', '--disable-gpu']
		}
	},
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
		env: {
			E2E_TEST: '1'
		}
	}
});
