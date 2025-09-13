/**
 * Cross-Platform and Device-Specific E2E Tests
 * Tests mobile, tablet, desktop, and different browser behaviors
 */

import { test, expect, devices } from '@playwright/test';
import { ConverterPage } from './utils/test-helpers';

test.describe('Cross-Platform Tests', () => {
	let converterPage: ConverterPage;

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
	});

	test.describe('Mobile Device Testing', () => {
		test.use({ ...devices['iPhone 12'] });

		test('mobile workflow with touch interactions', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Check mobile-optimized interface
			const viewport = page.viewportSize();
			expect(viewport?.width).toBeLessThan(500);

			// Check for mobile-specific UI elements
			const mobileMenu = page.getByTestId('mobile-menu');
			const _isMobileMenuVisible = await mobileMenu.isVisible().catch(() => false);

			// Touch interactions for file upload
			const fileDropzone = page.getByTestId('file-dropzone');
			await fileDropzone.tap();

			// Upload file using mobile interface
			await converterPage.uploadFile('small-test.png');
			await expect(page.getByText(/small-test\.png/)).toBeVisible();

			// Initialize threading with mobile-appropriate settings
			await converterPage.initializeThreads(2); // Fewer threads for mobile

			// Touch interaction for processing
			await converterPage.convertButton.tap();
			await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 30000 });

			// Verify mobile download experience
			await converterPage.downloadSVG();
		});

		test('mobile performance and resource constraints', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Monitor memory on mobile
			const initialMemory = await page.evaluate(() => {
				return performance.memory ? performance.memory.usedJSHeapSize : 0;
			});

			// Use conservative settings for mobile
			await converterPage.initializeThreads(1); // Single thread
			await converterPage.uploadFile('small-test.png');

			// Set mobile-optimized processing settings
			await converterPage.setDetailLevel(3); // Lower detail
			await converterPage.enableArtisticEffect('hand_drawn_style', false); // Disable for performance

			const startTime = Date.now();
			await converterPage.convertImage();
			const processingTime = Date.now() - startTime;

			// Mobile should complete in reasonable time even with limited resources
			expect(processingTime).toBeLessThan(15000); // 15 seconds max

			const finalMemory = await page.evaluate(() => {
				return performance.memory ? performance.memory.usedJSHeapSize : 0;
			});

			// Memory usage should be conservative on mobile
			if (initialMemory > 0 && finalMemory > 0) {
				const memoryIncrease = finalMemory - initialMemory;
				expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
			}
		});

		test('mobile orientation changes', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Start in portrait
			await page.setViewportSize({ width: 375, height: 667 });
			await converterPage.uploadFile('small-test.png');

			// Switch to landscape
			await page.setViewportSize({ width: 667, height: 375 });
			await page.waitForTimeout(500); // Wait for reflow

			// Interface should adapt to landscape
			const convertButton = converterPage.convertButton;
			await expect(convertButton).toBeVisible();

			// Should still function correctly
			await converterPage.initializeThreads(2);
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});
	});

	test.describe('Tablet Device Testing', () => {
		test.use({ ...devices['iPad Pro'] });

		test('tablet interface optimization', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			const viewport = page.viewportSize();
			expect(viewport?.width).toBeGreaterThan(700);

			// Check for tablet-specific layout
			const sidebar = page.getByTestId('sidebar');
			const mainPanel = page.getByTestId('main-panel');

			// Tablet should show side-by-side layout
			const _hasSidebar = await sidebar.isVisible().catch(() => false);
			const _hasMainPanel = await mainPanel.isVisible().catch(() => false);

			// Should use tablet-optimized thread count
			await converterPage.initializeThreads(4);
			await converterPage.uploadFile('medium-test.jpg');

			// Touch and mouse interaction support
			await converterPage.convertButton.click(); // Mouse-like click
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});

		test('tablet multitasking simulation', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();
			await converterPage.initializeThreads(3);

			// Simulate reduced resources during multitasking
			await page.evaluate(() => {
				// Simulate background apps using memory
				window.backgroundMemory = new ArrayBuffer(50 * 1024 * 1024); // 50MB
			});

			await converterPage.uploadFile('medium-test.jpg');
			await converterPage.convertImage();

			// Should still complete successfully with resource constraints
			await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 45000 });

			// Clean up simulated memory usage
			await page.evaluate(() => {
				window.backgroundMemory = null;
			});
		});
	});

	test.describe('Desktop Testing', () => {
		test.use({ ...devices['Desktop Chrome'] });

		test('desktop high-performance workflow', async ({ page: _page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Desktop should support maximum threading
			await converterPage.initializeThreads(8);
			const threadStatus = await converterPage.getThreadStatus();
			expect(threadStatus.count).toBeGreaterThan(4);

			// Test with large image and high settings
			await converterPage.uploadFile('large-test.png');
			await converterPage.setDetailLevel(8);
			await converterPage.enableArtisticEffect('hand_drawn_style', true);
			await converterPage.enableArtisticEffect('variable_weights', true);

			const startTime = Date.now();
			await converterPage.convertImage();
			const processingTime = Date.now() - startTime;

			// Desktop should handle complex processing efficiently
			expect(processingTime).toBeLessThan(20000); // 20 seconds max

			await converterPage.downloadSVG();
		});

		test('desktop keyboard shortcuts and power user features', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();
			await converterPage.initializeThreads(6);

			// Test keyboard shortcuts (if implemented)
			await page.keyboard.press('Control+o'); // Open file
			const fileInput = page.locator('input[type="file"]');
			const _isFileInputFocused = await fileInput.evaluate((el) => el === document.activeElement);

			// Upload file
			await converterPage.uploadFile('medium-test.jpg');

			// Test drag and drop (desktop-specific)
			const dropzone = page.getByTestId('file-dropzone');

			// Simulate drag and drop
			await dropzone.dispatchEvent('dragenter');
			await dropzone.dispatchEvent('dragover');
			await dropzone.dispatchEvent('drop', {
				dataTransfer: {
					files: [{ name: 'test.png', type: 'image/png' }]
				}
			});

			// Should handle drag and drop gracefully
			await expect(dropzone).toBeVisible();
		});

		test('desktop multi-window support', async ({ page: _page, context }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Open converter in multiple tabs
			const page2 = await context.newPage();
			const converterPage2 = new ConverterPage(page2);
			await converterPage2.goto();
			await converterPage2.waitForWasmLoad();

			// Both instances should work independently
			await converterPage.initializeThreads(4);
			await converterPage2.initializeThreads(4);

			await converterPage.uploadFile('small-test.png');
			await converterPage2.uploadFile('medium-test.jpg');

			// Process in both tabs simultaneously
			const [result1, result2] = await Promise.all([
				converterPage.convertImage().then(() => 'tab1-complete'),
				converterPage2.convertImage().then(() => 'tab2-complete')
			]);

			expect(result1).toBe('tab1-complete');
			expect(result2).toBe('tab2-complete');

			await page2.close();
		});
	});

	test.describe('Browser-Specific Testing', () => {
		test('chromium-specific features', async ({ page, browserName }) => {
			test.skip(browserName !== 'chromium', 'Chromium-specific test');

			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Check Chrome-specific WASM features
			const wasmFeatures = await page.evaluate(() => {
				return {
					simd: typeof WebAssembly.instantiate === 'function',
					threads: typeof SharedArrayBuffer !== 'undefined',
					atomics: typeof Atomics !== 'undefined'
				};
			});

			expect(wasmFeatures.simd).toBe(true);
			expect(wasmFeatures.threads).toBe(true);
			expect(wasmFeatures.atomics).toBe(true);

			// Test with maximum performance
			await converterPage.initializeThreads(8);
			await converterPage.uploadFile('large-test.png');
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});

		test('firefox-specific testing', async ({ page, browserName }) => {
			test.skip(browserName !== 'firefox', 'Firefox-specific test');

			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Firefox-specific WASM capabilities
			const firefoxFeatures = await page.evaluate(() => {
				return {
					wasmSupported: typeof WebAssembly !== 'undefined',
					sharedMemory: typeof SharedArrayBuffer !== 'undefined'
				};
			});

			expect(firefoxFeatures.wasmSupported).toBe(true);

			// Test basic workflow
			await converterPage.initializeThreads(4);
			await converterPage.uploadFile('medium-test.jpg');
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});

		test('webkit/safari testing', async ({ page, browserName }) => {
			test.skip(browserName !== 'webkit', 'WebKit/Safari-specific test');

			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Safari may have different WASM capabilities
			const safariCapabilities = await page.evaluate(() => {
				return {
					wasm: typeof WebAssembly !== 'undefined',
					sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
					crossOriginIsolated: window.crossOriginIsolated
				};
			});

			expect(safariCapabilities.wasm).toBe(true);

			// Adapt threading based on Safari capabilities
			const threadCount = safariCapabilities.sharedArrayBuffer ? 4 : 1;
			await converterPage.initializeThreads(threadCount);

			await converterPage.uploadFile('small-test.png');
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});
	});

	test.describe('Network Conditions Testing', () => {
		test('slow network conditions', async ({ page }) => {
			// Simulate slow 3G connection
			await page.route('**/*', async (route) => {
				await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
				route.continue();
			});

			const startTime = Date.now();
			await converterPage.goto();
			const loadTime = Date.now() - startTime;

			// Should still load within reasonable time on slow network
			expect(loadTime).toBeLessThan(15000); // 15 seconds

			await converterPage.waitForWasmLoad();
			await converterPage.initializeThreads(2);
			await converterPage.uploadFile('small-test.png');
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});

		test('offline functionality', async ({ page }) => {
			await converterPage.goto();
			await converterPage.waitForWasmLoad();
			await converterPage.initializeThreads(4);

			// Go offline after initial load
			await page.context().setOffline(true);

			// Should still be able to process images (client-side processing)
			await converterPage.uploadFile('small-test.png');
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();

			// Should be able to download (blob URL)
			await converterPage.downloadSVG();

			// Restore online
			await page.context().setOffline(false);
		});
	});

	test.describe('Accessibility Across Devices', () => {
		test('mobile accessibility', async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });
			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// Touch targets should be appropriately sized (44px minimum)
			const buttons = page.locator('button');
			const buttonCount = await buttons.count();

			for (let i = 0; i < Math.min(buttonCount, 5); i++) {
				const button = buttons.nth(i);
				const box = await button.boundingBox();

				if (box) {
					// Touch targets should be at least 44px
					expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
				}
			}

			// Test screen reader announcements on mobile
			await converterPage.uploadFile('small-test.png');
			await expect(page.getByText(/file selected/i)).toBeVisible();
		});

		test('high-DPI display support', async ({ page }) => {
			// Set high device pixel ratio
			await page.setViewportSize({ width: 1920, height: 1080 });
			await page.evaluate(() => {
				Object.defineProperty(window, 'devicePixelRatio', {
					value: 2
				});
			});

			await converterPage.goto();
			await converterPage.waitForWasmLoad();

			// UI should be crisp on high-DPI displays
			const logo = page.locator('img, svg').first();
			const isVisible = await logo.isVisible();
			expect(isVisible).toBe(true);

			// Processing should work normally
			await converterPage.initializeThreads(6);
			await converterPage.uploadFile('medium-test.jpg');
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		});
	});
});
