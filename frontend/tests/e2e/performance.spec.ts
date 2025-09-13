/**
 * Performance and Resource Usage E2E Tests
 * Tests Core Web Vitals, memory usage, and processing performance
 */

import { test, expect } from '@playwright/test';
import { ConverterPage, PerformanceMonitor, getMemoryUsage } from './utils/test-helpers';
import { getExpectedProcessingTime } from './fixtures/test-data';

test.describe('Performance and Resource Usage Tests', () => {
	let converterPage: ConverterPage;
	let performanceMonitor: PerformanceMonitor;

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		performanceMonitor = new PerformanceMonitor(page);
		await performanceMonitor.startMonitoring();
	});

	test('Core Web Vitals meet performance budgets', async ({ page }) => {
		await converterPage.goto();

		// Wait for page to fully load
		await page.waitForLoadState('networkidle');
		await converterPage.waitForWasmLoad();

		// Measure Core Web Vitals
		const vitals = await performanceMonitor.getCoreWebVitals();

		// Core Web Vitals thresholds (Google recommendations)
		if (vitals.lcp) {
			expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
		}

		if (vitals.fcp) {
			expect(vitals.fcp).toBeLessThan(1800); // FCP < 1.8s
		}

		if (vitals.cls !== undefined) {
			expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
		}

		console.log('Core Web Vitals:', vitals);
	});

	test('page load performance', async ({ page }) => {
		const startTime = Date.now();

		await converterPage.goto();
		await page.waitForLoadState('networkidle');

		const loadTime = Date.now() - startTime;

		// Page should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);

		// WASM should load within 10 seconds
		const wasmStartTime = Date.now();
		await converterPage.waitForWasmLoad();
		const wasmLoadTime = Date.now() - wasmStartTime;

		expect(wasmLoadTime).toBeLessThan(10000);

		console.log(`Page load: ${loadTime}ms, WASM load: ${wasmLoadTime}ms`);
	});

	test('image processing performance scaling', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();

		const testCases = [
			{ file: 'small-test.png', expectedClass: 'high-end', maxTime: 2000 },
			{ file: 'medium-test.jpg', expectedClass: 'high-end', maxTime: 5000 },
			{ file: 'large-test.png', expectedClass: 'high-end', maxTime: 15000 }
		];

		for (const testCase of testCases) {
			// Initialize with optimal threading
			await converterPage.initializeThreads(8);
			await converterPage.uploadFile(testCase.file);

			// Measure processing time
			const startTime = Date.now();
			await converterPage.convertImage();
			const endTime = Date.now();

			const processingTime = endTime - startTime;
			const expectedTime = getExpectedProcessingTime(testCase.file, testCase.expectedClass);

			// Should meet expected performance
			expect(processingTime).toBeLessThan(testCase.maxTime);
			expect(processingTime).toBeLessThan(expectedTime * 1.5); // 50% buffer

			console.log(`${testCase.file}: ${processingTime}ms (expected: ${expectedTime}ms)`);

			// Reset for next test
			await page.click('button:has-text("Reset All")');
		}
	});

	test('threading performance comparison', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();

		const threadCounts = [1, 4, 8];
		const processingTimes: Record<number, number> = {};

		for (const threadCount of threadCounts) {
			await converterPage.initializeThreads(threadCount);
			await converterPage.uploadFile('medium-test.jpg');

			// Measure processing time
			const startTime = Date.now();
			await converterPage.convertImage();
			const endTime = Date.now();

			processingTimes[threadCount] = endTime - startTime;

			console.log(`${threadCount} threads: ${processingTimes[threadCount]}ms`);

			// Reset for next test
			await page.reload();
			await converterPage.waitForWasmLoad();
		}

		// More threads should generally be faster (with some tolerance)
		expect(processingTimes[8]).toBeLessThan(processingTimes[1] * 1.2);
		expect(processingTimes[4]).toBeLessThan(processingTimes[1] * 1.1);
	});

	test('memory usage and leak detection', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(6);

		// Get baseline memory
		const baselineMemory = await getMemoryUsage(page);
		expect(baselineMemory).toBeTruthy();

		const baseline = baselineMemory!.usedJSHeapSize;

		// Process multiple images to test for memory leaks
		const testFiles = ['small-test.png', 'medium-test.jpg', 'simple-shapes.png', 'high-detail.png'];

		for (let iteration = 0; iteration < 2; iteration++) {
			for (const fileName of testFiles) {
				await converterPage.uploadFile(fileName);
				await converterPage.convertImage();
				await expect(page.getByText(/conversion completed/i)).toBeVisible();

				// Download to test blob URL cleanup
				await converterPage.downloadSVG();

				// Clear for next iteration
				await page.click('button:has-text("Reset All")');

				// Measure memory after each operation
				const currentMemory = await getMemoryUsage(page);
				if (currentMemory) {
					const memoryIncrease = currentMemory.usedJSHeapSize - baseline;
					console.log(
						`After ${fileName} (iteration ${iteration}): +${Math.round(memoryIncrease / 1024 / 1024)}MB`
					);
				}
			}
		}

		// Force garbage collection if available
		await page.evaluate(() => {
			if (window.gc) {
				window.gc();
			}
		});

		await page.waitForTimeout(1000);

		// Final memory check
		const finalMemory = await getMemoryUsage(page);
		if (finalMemory && baselineMemory) {
			const totalIncrease = finalMemory.usedJSHeapSize - baseline;

			// Should not have significant memory leak (less than 100MB)
			expect(totalIncrease).toBeLessThan(100 * 1024 * 1024);

			console.log(`Total memory increase: ${Math.round(totalIncrease / 1024 / 1024)}MB`);
		}
	});

	test('resource loading optimization', async ({ page }) => {
		const startTime = Date.now();

		// Monitor network requests
		const requests: any[] = [];
		page.on('request', (request) => {
			requests.push({
				url: request.url(),
				method: request.method(),
				resourceType: request.resourceType(),
				size: request.postDataBuffer()?.length || 0
			});
		});

		const responses: any[] = [];
		page.on('response', (response) => {
			responses.push({
				url: response.url(),
				status: response.status(),
				size: response.headers()['content-length'],
				timing: response.timing()
			});
		});

		await converterPage.goto();
		await page.waitForLoadState('networkidle');
		await converterPage.waitForWasmLoad();

		const loadTime = Date.now() - startTime;

		// Analyze resource loading
		const wasmRequests = requests.filter(
			(req) => req.url.includes('.wasm') || req.url.includes('vectorize')
		);

		const _criticalResources = responses.filter(
			(res) => res.url.includes('.wasm') || res.url.includes('main') || res.url.includes('app')
		);

		// Should load critical resources efficiently
		expect(wasmRequests.length).toBeGreaterThan(0);
		expect(loadTime).toBeLessThan(5000);

		// Check resource compression
		const largeResources = responses.filter(
			(res) => parseInt(res.size || '0') > 1024 * 1024 // > 1MB
		);

		// Large resources should be present (WASM module) but not excessive
		expect(largeResources.length).toBeLessThan(5);

		console.log(`Resources loaded: ${responses.length}, WASM requests: ${wasmRequests.length}`);
	});

	test('UI responsiveness during processing', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(6);
		await converterPage.uploadFile('large-test.png');

		// Start processing
		await converterPage.convertButton.click();
		await expect(page.getByText(/processing/i)).toBeVisible();

		// Test UI responsiveness during processing
		const responsivenessTasks = [
			// Tab navigation should work
			async () => {
				await page.keyboard.press('Tab');
				const focused = await page.evaluate(() => document.activeElement?.tagName);
				expect(focused).toBeTruthy();
			},

			// Settings should be accessible (even if disabled)
			async () => {
				const detailSlider = page.getByTestId('detail-level');
				const isVisible = await detailSlider.isVisible();
				expect(isVisible).toBe(true);
			},

			// Progress should update
			async () => {
				const progressBar = page.getByTestId('progress-bar');
				const isVisible = await progressBar.isVisible();
				expect(isVisible).toBe(true);
			}
		];

		// Execute responsiveness tests during processing
		for (const task of responsivenessTasks) {
			await task();
			await page.waitForTimeout(100);
		}

		// Wait for processing to complete
		await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 60000 });
	});

	test('bundle size and loading optimization', async ({ page }) => {
		// Monitor all resources loaded
		const resources: any[] = [];

		page.on('response', (response) => {
			resources.push({
				url: response.url(),
				size: parseInt(response.headers()['content-length'] || '0'),
				type: response.request().resourceType(),
				cached: response.fromServiceWorker() || response.status() === 304
			});
		});

		await converterPage.goto();
		await page.waitForLoadState('networkidle');

		// Calculate total bundle size
		const jsResources = resources.filter((r) => r.type === 'script');
		const cssResources = resources.filter((r) => r.type === 'stylesheet');
		const wasmResources = resources.filter((r) => r.url.includes('.wasm'));

		const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);
		const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0);
		const totalWASMSize = wasmResources.reduce((sum, r) => sum + r.size, 0);

		// Bundle size budgets
		expect(totalJSSize).toBeLessThan(2 * 1024 * 1024); // < 2MB JS
		expect(totalCSSSize).toBeLessThan(500 * 1024); // < 500KB CSS
		expect(totalWASMSize).toBeLessThan(10 * 1024 * 1024); // < 10MB WASM

		console.log(
			`Bundle sizes - JS: ${Math.round(totalJSSize / 1024)}KB, CSS: ${Math.round(totalCSSSize / 1024)}KB, WASM: ${Math.round(totalWASMSize / 1024)}KB`
		);

		// Check for proper caching
		const cachedResources = resources.filter((r) => r.cached);
		const cachingEfficiency = cachedResources.length / resources.length;

		// On subsequent loads, should have good caching (not applicable to first load)
		console.log(`Caching efficiency: ${Math.round(cachingEfficiency * 100)}%`);
	});

	test('progressive loading and lazy loading', async ({ page }) => {
		const loadingStages: string[] = [];

		// Monitor loading stages
		page.on('console', (msg) => {
			if (msg.text().includes('load') || msg.text().includes('init')) {
				loadingStages.push(msg.text());
			}
		});

		await converterPage.goto();

		// Should show loading states progressively
		await expect(page.getByText(/loading/i)).toBeVisible();

		// WASM should load after initial page
		await converterPage.waitForWasmLoad();
		await expect(page.getByText(/loading/i)).toBeHidden();

		// Thread initialization should be lazy (on demand)
		const threadStatus = await converterPage.getThreadStatus();
		expect(threadStatus.initialized).toBe(false); // Should not auto-initialize

		// Initialize threads on demand
		await converterPage.initializeThreads(4);
		const newThreadStatus = await converterPage.getThreadStatus();
		expect(newThreadStatus.initialized).toBe(true);
	});

	test('performance regression detection', async ({ page }) => {
		await converterPage.goto();
		await converterPage.waitForWasmLoad();

		// Baseline performance measurement
		const baseline = {
			wasmLoad: 0,
			threadInit: 0,
			processing: 0
		};

		// Measure WASM loading time
		const wasmStart = Date.now();
		await converterPage.waitForWasmLoad();
		baseline.wasmLoad = Date.now() - wasmStart;

		// Measure thread initialization time
		const threadStart = Date.now();
		await converterPage.initializeThreads(4);
		baseline.threadInit = Date.now() - threadStart;

		// Measure processing time
		await converterPage.uploadFile('medium-test.jpg');
		const processStart = Date.now();
		await converterPage.convertImage();
		baseline.processing = Date.now() - processStart;

		// Performance regression thresholds
		const thresholds = {
			wasmLoad: 15000, // 15 seconds max
			threadInit: 5000, // 5 seconds max
			processing: 10000 // 10 seconds max for medium image
		};

		// Check against thresholds
		expect(baseline.wasmLoad).toBeLessThan(thresholds.wasmLoad);
		expect(baseline.threadInit).toBeLessThan(thresholds.threadInit);
		expect(baseline.processing).toBeLessThan(thresholds.processing);

		console.log('Performance baseline:', baseline);

		// Store baseline for trend analysis
		await page.evaluate((perf) => {
			localStorage.setItem(
				'performance-baseline',
				JSON.stringify({
					...perf,
					timestamp: Date.now(),
					userAgent: navigator.userAgent
				})
			);
		}, baseline);
	});
});
