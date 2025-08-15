import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright configuration for comprehensive E2E testing
 * Supports multi-browser, multi-device testing with performance monitoring
 */
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: !process.env.CI, // Sequential in CI for stability
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		['html', { outputFolder: 'playwright-report', open: 'never' }],
		['json', { outputFile: 'test-results/results.json' }],
		...(process.env.CI ? [['github'], ['dot']] : [['list']])
	],

	// Global test timeout for WASM operations
	timeout: 90000, // 90 seconds for complex WASM processing
	expect: {
		timeout: 10000 // 10 seconds for expect assertions
	},

	use: {
		baseURL: 'http://localhost:5173',
		trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
		screenshot: process.env.CI ? 'only-on-failure' : 'off',
		video: process.env.CI ? 'retain-on-failure' : 'off',
		// Extended timeout for slow WASM operations
		actionTimeout: 30000,
		navigationTimeout: 30000,
		// Enable cross-origin isolation for SharedArrayBuffer
		extraHTTPHeaders: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		}
	},

	projects: [
		// Desktop browsers
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Enable modern browser features for WASM multithreading
				launchOptions: {
					args: [
						'--enable-features=SharedArrayBuffer',
						'--enable-unsafe-webassembly',
						'--js-flags=--experimental-wasm-threads'
					]
				}
			}
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				launchOptions: {
					firefoxUserPrefs: {
						'javascript.options.shared_memory': true,
						'dom.postMessage.sharedArrayBuffer.withCOOP_COEP': true
					}
				}
			}
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},

		// Mobile devices
		{
			name: 'mobile-chrome',
			use: {
				...devices['Pixel 5'],
				// Mobile-specific settings
				hasTouch: true,
				isMobile: true
			}
		},
		{
			name: 'mobile-safari',
			use: {
				...devices['iPhone 12'],
				hasTouch: true,
				isMobile: true
			}
		},

		// Tablet devices
		{
			name: 'tablet-chrome',
			use: {
				...devices['iPad Pro'],
				hasTouch: true
			}
		},

		// Low-end device simulation
		{
			name: 'low-end-device',
			use: {
				...devices['Galaxy S5'],
				// Simulate slower device
				launchOptions: {
					args: ['--memory-pressure-off']
				}
			}
		},

		// High-DPI device
		{
			name: 'high-dpi',
			use: {
				...devices['Desktop Chrome'],
				deviceScaleFactor: 2,
				viewport: { width: 1920, height: 1080 }
			}
		}
	],

	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		port: 5173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000, // 2 minutes startup timeout
		// Ensure COEP/COOP headers are set for SharedArrayBuffer
		env: {
			NODE_ENV: 'development'
		}
	},

	// Global setup and teardown
	globalSetup: './tests/e2e/global-setup.ts',
	globalTeardown: './tests/e2e/global-teardown.ts'
});
