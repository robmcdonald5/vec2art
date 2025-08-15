/**
 * Error Handling and Recovery E2E Tests
 * Tests various error scenarios and recovery mechanisms
 */

import { test, expect } from '@playwright/test';
import {
	ConverterPage,
	setupConsoleErrorTracking,
	setupNetworkMonitoring
} from './utils/test-helpers';

test.describe('Error Handling and Recovery Tests', () => {
	let converterPage: ConverterPage;
	let consoleErrors: string[];

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		consoleErrors = setupConsoleErrorTracking(page);
	});

	test('handles invalid file uploads gracefully', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Test various invalid file types
		const invalidFiles = ['invalid.txt', 'corrupted.png'];

		for (const fileName of invalidFiles) {
			await converterPage.uploadInvalidFile(fileName);

			// Should show appropriate error message
			await expect(page.getByText(/invalid|error|unsupported/i)).toBeVisible();

			// Error should include helpful information
			const errorText = await page.getByTestId('error-message').textContent();
			expect(errorText?.toLowerCase()).toContain('file');

			// Should be able to dismiss error
			const dismissButton = page.getByRole('button', { name: /dismiss|close/i });
			if (await dismissButton.isVisible()) {
				await dismissButton.click();
				await expect(page.getByTestId('error-message')).toBeHidden();
			}

			// Should be able to upload valid file after error
			await converterPage.uploadFile('small-test.png');
			await expect(page.getByText(/small-test\.png/)).toBeVisible();

			// Clear for next iteration
			await page.click('button:has-text("Reset All")');
		}
	});

	test('handles oversized file uploads', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Try to upload extremely large file
		await converterPage.uploadInvalidFile('huge-file.png');

		// Should show size limit error
		await expect(page.getByText(/size|large|limit/i)).toBeVisible();

		// Should provide helpful guidance
		const errorMessage = await page.getByTestId('error-message').textContent();
		expect(errorMessage?.toLowerCase()).toContain('size');

		// Should suggest recovery actions
		const recoverySuggestions = page.getByText(/suggestions|try/i);
		if (await recoverySuggestions.isVisible()) {
			await expect(recoverySuggestions).toContainText(/smaller|resize|compress/i);
		}
	});

	test('network error recovery', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');

		// Block network requests during processing
		await page.route('**/*', (route) => {
			if (route.request().url().includes('vectorize') || route.request().url().includes('wasm')) {
				route.abort();
			} else {
				route.continue();
			}
		});

		// Attempt to process image
		await converterPage.convertButton.click();

		// Should show network error
		await expect(page.getByText(/network|connection|failed/i)).toBeVisible({ timeout: 30000 });

		// Should show retry option
		const retryButton = page.getByRole('button', { name: /retry/i });
		await expect(retryButton).toBeVisible();

		// Re-enable network
		await page.unroute('**/*');

		// Retry should work
		await retryButton.click();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});

	test('WASM processing errors and recovery', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Inject error into WASM processing
		await page.evaluate(() => {
			if (window.wasmModule && window.wasmModule.processImage) {
				const originalProcess = window.wasmModule.processImage;
				window.wasmModule.processImage = function () {
					throw new Error('Simulated WASM processing error');
				};

				// Store original for later recovery
				window.originalProcessImage = originalProcess;
			}
		});

		await converterPage.uploadFile('small-test.png');
		await converterPage.convertButton.click();

		// Should show processing error
		await expect(page.getByText(/processing|failed|error/i)).toBeVisible();

		// Should show retry option
		const retryButton = page.getByRole('button', { name: /retry/i });
		await expect(retryButton).toBeVisible();

		// Restore original function
		await page.evaluate(() => {
			if (window.wasmModule && window.originalProcessImage) {
				window.wasmModule.processImage = window.originalProcessImage;
			}
		});

		// Retry should work
		await retryButton.click();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});

	test('memory exhaustion error handling', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(8); // Max threads

		// Simulate memory pressure
		await page.evaluate(() => {
			// Create memory pressure by allocating large arrays
			window.memoryPressure = [];
			try {
				for (let i = 0; i < 100; i++) {
					window.memoryPressure.push(new ArrayBuffer(10 * 1024 * 1024)); // 10MB each
				}
			} catch (e) {
				// Expected to fail at some point
			}
		});

		await converterPage.uploadFile('large-test.png');
		await converterPage.convertButton.click();

		// Should either complete successfully or show memory error
		const completed = await Promise.race([
			page
				.getByText(/conversion completed/i)
				.waitFor({ timeout: 30000 })
				.then(() => true)
				.catch(() => false),
			page
				.getByText(/memory|out of memory/i)
				.waitFor({ timeout: 30000 })
				.then(() => false)
				.catch(() => null)
		]);

		if (completed === false) {
			// Memory error occurred, should show helpful message
			await expect(page.getByText(/memory|resources/i)).toBeVisible();

			// Should suggest reducing image size or complexity
			const suggestions = page.getByText(/suggestions/i);
			if (await suggestions.isVisible()) {
				await expect(suggestions).toContainText(/smaller|reduce|detail/i);
			}
		}

		// Clean up memory pressure
		await page.evaluate(() => {
			window.memoryPressure = [];
		});
	});

	test('browser compatibility error handling', async ({ page, browserName }) => {
		await converterPage.goto();

		// Simulate missing browser features
		await page.addInitScript(() => {
			// Remove SharedArrayBuffer to simulate unsupported browser
			delete window.SharedArrayBuffer;
			Object.defineProperty(window, 'crossOriginIsolated', {
				value: false,
				writable: false
			});
		});

		await page.reload();
		await converterPage.waitForWasmLoad();

		// Should detect lack of threading support
		const threadStatus = await converterPage.getThreadStatus();
		expect(threadStatus.initialized).toBe(false);

		// Should show appropriate message about browser capabilities
		await expect(page.getByText(/browser|support|thread/i)).toBeVisible();

		// Should still allow single-threaded processing
		await converterPage.uploadFile('small-test.png');

		// Convert button should work but use single-threaded mode
		await converterPage.convertButton.click();
		await expect(page.getByText(/conversion completed|processing/i)).toBeVisible();
	});

	test('configuration validation errors', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');

		// Inject invalid configuration
		await page.evaluate(() => {
			if (window.vectorizerStore) {
				// Force invalid configuration
				window.vectorizerStore.updateConfig({
					detail: -1, // Invalid detail level
					stroke_width: 0 // Invalid stroke width
				});
			}
		});

		await converterPage.convertButton.click();

		// Should show configuration error
		await expect(page.getByText(/configuration|invalid|settings/i)).toBeVisible();

		// Should suggest fixing settings
		const resetButton = page.getByRole('button', { name: /reset settings/i });
		if (await resetButton.isVisible()) {
			await resetButton.click();

			// Should be able to process after reset
			await converterPage.convertButton.click();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();
		}
	});

	test('concurrent operation error handling', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('medium-test.jpg');

		// Start first operation
		await converterPage.convertButton.click();

		// Wait a moment then try to start another operation
		await page.waitForTimeout(500);

		// Upload another file while first is processing
		await converterPage.uploadFile('small-test.png');

		// Try to start another conversion
		const convertButton = converterPage.convertButton;
		const isDisabled = await convertButton.isDisabled();

		// Should prevent concurrent operations
		expect(isDisabled).toBe(true);

		// Wait for first operation to complete
		await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 30000 });

		// Should now be able to process the second image
		await expect(convertButton).toBeEnabled();
		await convertButton.click();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});

	test('page refresh during processing recovery', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('medium-test.jpg');

		// Start processing
		await converterPage.convertButton.click();
		await expect(page.getByText(/processing/i)).toBeVisible();

		// Refresh page during processing
		await page.reload();

		// Should show clean state after refresh
		await converterPage.waitForWasmLoad();
		await expect(page.getByText(/upload an image/i)).toBeVisible();

		// Should be able to start fresh workflow
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');
		await converterPage.convertButton.click();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});

	test('error reporting and logging', async ({ page }) => {
		const networkMonitoring = setupNetworkMonitoring(page);

		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Trigger various errors and check they're handled properly
		await converterPage.uploadInvalidFile('invalid.txt');
		await expect(page.getByText(/error/i)).toBeVisible();

		// Check console errors are meaningful (not just generic errors)
		const meaningfulErrors = consoleErrors.filter(
			(error) =>
				error.includes('file') ||
				error.includes('image') ||
				error.includes('wasm') ||
				error.includes('processing')
		);

		// Should have some meaningful error context
		if (consoleErrors.length > 0) {
			expect(meaningfulErrors.length).toBeGreaterThan(0);
		}

		// Check error UI provides actionable information
		const errorElement = page.getByTestId('error-message');
		const errorText = await errorElement.textContent();

		expect(errorText).toBeTruthy();
		expect(errorText!.length).toBeGreaterThan(10); // Should be more than just "Error"
	});

	test('graceful degradation scenarios', async ({ page }) => {
		await converterPage.goto();

		// Test various degradation scenarios
		const scenarios = [
			{
				name: 'No WASM support',
				setup: () =>
					page.addInitScript(() => {
						delete window.WebAssembly;
					})
			},
			{
				name: 'No File API support',
				setup: () =>
					page.addInitScript(() => {
						delete window.File;
						delete window.FileReader;
					})
			},
			{
				name: 'No Web Workers support',
				setup: () =>
					page.addInitScript(() => {
						delete window.Worker;
					})
			}
		];

		for (const scenario of scenarios) {
			// Apply scenario setup
			await scenario.setup();
			await page.reload();

			// Should show appropriate fallback or error message
			const hasError = await page.getByText(/not supported|upgrade|browser/i).isVisible();
			const hasAlternative = await page.getByText(/alternative|fallback/i).isVisible();

			// Should either show error or provide alternative
			expect(hasError || hasAlternative).toBe(true);

			console.log(`${scenario.name}: ${hasError ? 'Error shown' : 'Alternative provided'}`);
		}
	});
});
