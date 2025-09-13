/**
 * WASM Integration and Multithreading E2E Tests
 * Tests WebAssembly module loading, threading, and cross-origin isolation
 */

import { test, expect } from '@playwright/test';
import {
	ConverterPage,
	checkCrossOriginIsolation,
	checkSharedArrayBuffer
} from './utils/test-helpers';

test.describe('WASM Integration Tests', () => {
	let converterPage: ConverterPage;

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		await converterPage.goto();
	});

	test('WASM module loads successfully', async ({ page }) => {
		// Wait for WASM module to be available
		await page.waitForFunction(
			() => {
				return typeof window.wasmModule !== 'undefined';
			},
			{ timeout: 30000 }
		);

		// Verify WASM module properties
		const wasmInfo = await page.evaluate(() => {
			return {
				moduleLoaded: typeof window.wasmModule !== 'undefined',
				hasInitFunction: typeof window.wasmModule?.initThreadPool === 'function',
				hasProcessFunction: typeof window.wasmModule?.processImage === 'function'
			};
		});

		expect(wasmInfo.moduleLoaded).toBe(true);
		expect(wasmInfo.hasInitFunction).toBe(true);
		expect(wasmInfo.hasProcessFunction).toBe(true);

		// Verify loading status UI
		await expect(page.getByText(/loading converter module/i)).toBeHidden();
	});

	test('cross-origin isolation is enabled', async ({ page }) => {
		const isIsolated = await checkCrossOriginIsolation(page);
		expect(isIsolated).toBe(true);

		// Verify SharedArrayBuffer is available
		const hasSharedArrayBuffer = await checkSharedArrayBuffer(page);
		expect(hasSharedArrayBuffer).toBe(true);

		// Check headers are properly set
		const response = await page.goto('/converter');
		const headers = response?.headers();
		expect(headers?.['cross-origin-opener-policy']).toBe('same-origin');
		expect(headers?.['cross-origin-embedder-policy']).toBe('require-corp');
	});

	test('multithreading initialization with different thread counts', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		const threadCounts = [1, 2, 4, 6, 8, 12];

		for (const threadCount of threadCounts) {
			// Initialize with specific thread count
			await converterPage.initializeThreads(threadCount);

			// Verify thread initialization
			const status = await converterPage.getThreadStatus();
			expect(status.initialized).toBe(true);

			// Verify thread count (may be capped by browser/device)
			expect(status.count).toBeGreaterThan(0);
			expect(status.count).toBeLessThanOrEqual(threadCount);

			// Verify UI shows correct status
			await expect(page.getByText(/threads active/i)).toBeVisible();

			// Reset for next iteration
			await page.reload();
			await converterPage.waitForWasmLoad();
		}
	});

	test('thread pool failure recovery', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Try to initialize with an impossible thread count
		await page.evaluate(() => {
			// Force a threading failure by corrupting the WASM module
			if (window.wasmModule) {
				window.wasmModule.initThreadPool = () => {
					throw new Error('Simulated threading failure');
				};
			}
		});

		// Attempt initialization
		try {
			await page.click('[data-testid="performance-selector"]');
			await page.selectOption('[data-testid="thread-count"]', '4');
			await page.click('[data-testid="initialize-threads"]');
		} catch (_error) {
			// Expected to fail
		}

		// Should fall back to single-threaded mode
		await expect(page.getByText(/single-threaded mode/i)).toBeVisible();

		// Should still be able to process images
		await converterPage.uploadFile('small-test.png');

		// Convert button should work even in single-threaded mode
		await expect(converterPage.convertButton).toBeEnabled();
	});

	test('WASM loading failure handling', async ({ page }) => {
		// Block WASM files to simulate loading failure
		await page.route('**/*.wasm', (route) => route.abort());
		await page.route('**/vectorize-wasm/**', (route) => route.abort());

		// Reload page with blocked WASM
		await page.reload();

		// Should show WASM loading error
		await expect(page.getByText(/failed to load/i)).toBeVisible({ timeout: 30000 });

		// Should show retry option
		await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

		// Unblock WASM and retry
		await page.unroute('**/*.wasm');
		await page.unroute('**/vectorize-wasm/**');

		await page.click('button:has-text("Retry")');

		// Should eventually load successfully
		await page.waitForFunction(
			() => {
				return typeof window.wasmModule !== 'undefined';
			},
			{ timeout: 30000 }
		);

		await expect(page.getByText(/failed to load/i)).toBeHidden();
	});

	test('memory management during multithreading', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(8);

		// Monitor memory usage
		const getMemoryUsage = () =>
			page.evaluate(() => {
				return performance.memory
					? {
							used: performance.memory.usedJSHeapSize,
							total: performance.memory.totalJSHeapSize,
							limit: performance.memory.jsHeapSizeLimit
						}
					: null;
			});

		const initialMemory = await getMemoryUsage();

		// Process multiple images to stress test memory management
		const testFiles = ['small-test.png', 'medium-test.jpg', 'simple-shapes.png'];

		for (const fileName of testFiles) {
			await converterPage.uploadFile(fileName);
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();

			// Clear result before next iteration
			await page.click('button:has-text("Reset All")');
		}

		const finalMemory = await getMemoryUsage();

		// Verify no significant memory leak
		if (initialMemory && finalMemory) {
			const memoryIncrease = finalMemory.used - initialMemory.used;
			// Allow up to 50MB increase for legitimate memory usage
			expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
		}
	});

	test('thread performance scaling', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.uploadFile('medium-test.jpg');

		const threadCounts = [1, 4, 8];
		const processingTimes: number[] = [];

		for (const threadCount of threadCounts) {
			// Initialize with specific thread count
			await converterPage.initializeThreads(threadCount);

			// Process image and measure time
			const startTime = Date.now();
			await converterPage.convertImage();
			const endTime = Date.now();

			const processingTime = endTime - startTime;
			processingTimes.push(processingTime);

			console.log(`${threadCount} threads: ${processingTime}ms`);

			// Reset for next iteration
			await page.reload();
			await converterPage.waitForWasmLoad();
			await converterPage.uploadFile('medium-test.jpg');
		}

		// Verify that more threads generally lead to better performance
		// (with some tolerance for variability)
		expect(processingTimes[2]).toBeLessThan(processingTimes[0] * 1.2); // 8 threads should be faster than 1
	});

	test('concurrent WASM operations', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(6);

		// Test that the WASM module properly handles concurrent access
		await converterPage.uploadFile('small-test.png');

		// Start multiple operations "simultaneously" (as much as possible in single-threaded JS)
		const operations = [];

		for (let i = 0; i < 3; i++) {
			operations.push(
				page.evaluate(async () => {
					if (window.wasmModule && window.wasmModule.processImage) {
						try {
							return await window.wasmModule.processImage({
								backend: 'edge',
								detail: 5,
								stroke_width: 1.0
							});
						} catch (_error) {
							return { error: error.message };
						}
					}
					return { error: 'WASM not available' };
				})
			);
		}

		const results = await Promise.all(operations);

		// Verify that all operations completed (even if some failed due to concurrency)
		expect(results).toHaveLength(3);

		// At least one should succeed
		const successfulResults = results.filter((r) => !r.error);
		expect(successfulResults.length).toBeGreaterThan(0);
	});

	test('WASM module cleanup and reinitialization', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Process an image
		await converterPage.uploadFile('small-test.png');
		await converterPage.convertImage();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();

		// Simulate cleanup
		await page.evaluate(() => {
			if (window.wasmModule && typeof window.wasmModule.cleanup === 'function') {
				window.wasmModule.cleanup();
			}
		});

		// Should be able to reinitialize
		await page.reload();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Should work normally again
		await converterPage.uploadFile('simple-shapes.png');
		await converterPage.convertImage();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});

	test('WASM capabilities detection', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Check detected capabilities
		const capabilities = await page.evaluate(() => {
			return window.wasmCapabilities || {};
		});

		// Should detect basic capabilities
		expect(capabilities).toHaveProperty('threading_supported');
		expect(capabilities).toHaveProperty('hardware_concurrency');
		expect(capabilities).toHaveProperty('simd_supported');

		// Hardware concurrency should be a positive number
		expect(capabilities.hardware_concurrency).toBeGreaterThan(0);

		// Threading support should match SharedArrayBuffer availability
		const hasSharedArrayBuffer = await checkSharedArrayBuffer(page);
		expect(capabilities.threading_supported).toBe(hasSharedArrayBuffer);
	});

	test('WASM error handling and recovery', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Upload invalid image data to trigger WASM error
		await converterPage.uploadInvalidFile('corrupted.png');

		// Attempt to process - should handle error gracefully
		await converterPage.convertButton.click();

		// Should show error message
		await expect(page.getByText(/error/i)).toBeVisible();

		// Should still be able to recover and process valid image
		await converterPage.uploadFile('small-test.png');
		await converterPage.convertImage();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});
});
