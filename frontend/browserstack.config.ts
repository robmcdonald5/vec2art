/**
 * BrowserStack Configuration for iOS/Safari Testing
 * Run with: npx browserstack-node-sdk playwright test
 */

export default {
	userName: process.env.BROWSERSTACK_USERNAME,
	accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
	buildName: `vec2art-ios-debug-${new Date().toISOString().split('T')[0]}`,
	projectName: 'vec2art',

	// BrowserStack specific capabilities
	browserstackLocal: true,
	debug: true,
	networkLogs: true,
	consoleLogs: 'verbose',

	// Playwright configuration
	playwright: {
		projects: [
			// Real iOS devices
			{
				name: 'iPhone-14-Pro',
				use: {
					browserName: 'webkit',
					...devices['iPhone 14 Pro'],
					// BrowserStack specific
					'browserstack.deviceName': 'iPhone 14 Pro',
					'browserstack.osVersion': '16',
					'browserstack.realMobile': true
				}
			},
			{
				name: 'iPhone-13',
				use: {
					browserName: 'webkit',
					...devices['iPhone 13'],
					'browserstack.deviceName': 'iPhone 13',
					'browserstack.osVersion': '15',
					'browserstack.realMobile': true
				}
			},
			{
				name: 'iPad-Pro-12.9',
				use: {
					browserName: 'webkit',
					...devices['iPad Pro 12.9'],
					'browserstack.deviceName': 'iPad Pro 12.9 2022',
					'browserstack.osVersion': '16',
					'browserstack.realMobile': true
				}
			},
			// Desktop Safari for comparison
			{
				name: 'Safari-macOS',
				use: {
					browserName: 'webkit',
					'browserstack.os': 'OS X',
					'browserstack.osVersion': 'Ventura',
					'browserstack.browser': 'Safari',
					'browserstack.browserVersion': '16.0'
				}
			}
		]
	},

	// Test configuration
	testObservability: true,
	observabilityOptions: {
		// Capture screenshots on failure
		screenshotOnFailure: true,
		// Capture video for debugging
		video: true,
		// Extended logging
		verboseLogging: true
	}
};

// Import Playwright devices
import { devices } from '@playwright/test';
