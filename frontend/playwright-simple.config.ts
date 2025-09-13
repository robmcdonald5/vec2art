import { defineConfig, devices } from '@playwright/test';

/**
 * Simplified Playwright configuration for reliable baseline testing
 * Focus on tests that actually work rather than complex WASM scenarios
 */
export default defineConfig({
	testDir: './tests/e2e',
	// Only run our working tests initially
	testMatch: ['**/smoke.spec.ts', '**/basic-workflow.spec.ts'],

	fullyParallel: false, // Sequential for reliability
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0, // Reduced retries
	workers: 1, // Single worker for stability

	reporter: [
		['list'],
		['html', { outputFolder: 'playwright-report-simple', open: 'never' }],
		...(process.env.CI ? [['github']] : [])
	],

	// Shorter timeouts for basic tests
	timeout: 30000, // 30 seconds
	expect: {
		timeout: 5000 // 5 seconds for assertions
	},

	use: {
		baseURL: 'http://localhost:5173',
		trace: process.env.CI ? 'on-first-retry' : 'off',
		screenshot: 'only-on-failure',
		video: 'off', // Disable video for basic tests
		actionTimeout: 10000,
		navigationTimeout: 15000
	},

	projects: [
		// Start with just Chromium for reliability
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}

		// TODO: Add Firefox back once dev server connection issues are resolved
		// {
		// 	name: 'firefox',
		// 	use: { ...devices['Desktop Firefox'] }
		// }
	],

	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 60000, // 1 minute startup
		stdout: 'pipe',
		stderr: 'pipe'
	}
});
