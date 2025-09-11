/**
 * Core User Workflow E2E Tests
 * Tests the complete image vectorization workflow from upload to download
 */

import { test, expect } from '@playwright/test';
import {
	ConverterPage,
	setupConsoleErrorTracking,
	getExpectedProcessingTime
} from './utils/test-helpers';
import { TEST_IMAGES as _TEST_IMAGES, getTestImage } from './fixtures/test-data';

test.describe('Core Image Vectorization Workflow', () => {
	let converterPage: ConverterPage;
	let consoleErrors: string[];

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		consoleErrors = setupConsoleErrorTracking(page);

		// Navigate to converter page
		await converterPage.goto();
		await expect(page).toHaveTitle(/vec2art/i);
	});

	test.afterEach(async () => {
		// Check for console errors (excluding known warnings)
		const criticalErrors = consoleErrors.filter(
			(error) =>
				!error.includes('Warning:') && !error.includes('[HMR]') && !error.includes('favicon')
		);

		if (criticalErrors.length > 0) {
			console.warn('Console errors detected:', criticalErrors);
		}
	});

	test('complete vectorization workflow with small image', async ({ page }) => {
		// 1. Wait for WASM module to load
		await converterPage.waitForWasmLoad();
		await expect(page.getByText(/loading converter module/i)).toBeHidden();

		// 2. Initialize threading (performance selection)
		await converterPage.initializeThreads(4);
		const threadStatus = await converterPage.getThreadStatus();
		expect(threadStatus.initialized).toBe(true);
		expect(threadStatus.count).toBeGreaterThan(0);

		// 3. Upload test image
		await converterPage.uploadFile('small-test.png');
		await expect(page.getByText(/small-test\.png/)).toBeVisible();

		// 4. Configure settings
		await converterPage.selectAlgorithm('edge');
		await converterPage.setDetailLevel(5);
		await converterPage.setSmoothness(7);

		// 5. Process image
		const startTime = Date.now();
		await converterPage.convertImage();
		const endTime = Date.now();

		// Verify processing completed
		await expect(page.getByText(/conversion completed/i)).toBeVisible();

		// Check processing time is reasonable
		const processingTime = endTime - startTime;
		expect(processingTime).toBeLessThan(10000); // Should complete in under 10 seconds

		// 6. Verify SVG preview is shown
		const svgPreview = page.locator('img[src*="blob:"]');
		await expect(svgPreview).toBeVisible();

		// 7. Download SVG
		await converterPage.downloadSVG();

		// 8. Verify processing stats
		const processingTimeReported = await converterPage.getProcessingTime();
		expect(processingTimeReported).toBeGreaterThan(0);
		expect(processingTimeReported).toBeLessThan(5000); // Under 5 seconds for small image
	});

	test('handles medium image with different algorithms', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(6);
		await converterPage.uploadFile('medium-test.jpg');

		// Test different algorithms
		const algorithms = ['edge', 'centerline', 'superpixel', 'dots'];

		for (const algorithm of algorithms) {
			// Select algorithm
			await converterPage.selectAlgorithm(algorithm);

			// Process with current algorithm
			await converterPage.convertImage();

			// Verify conversion completed
			await expect(page.getByText(/conversion completed/i)).toBeVisible();

			// Verify SVG output
			const svgPreview = page.locator('img[src*="blob:"]');
			await expect(svgPreview).toBeVisible();

			// Check processing time is reasonable for this algorithm
			const processingTime = await converterPage.getProcessingTime();
			expect(processingTime).toBeGreaterThan(0);
			expect(processingTime).toBeLessThan(15000); // 15 seconds max
		}
	});

	test('handles large image with performance monitoring', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(8); // Max threads for large image

		// Upload large test image
		await converterPage.uploadFile('large-test.png');

		// Configure for optimal performance
		await converterPage.selectAlgorithm('edge');
		await converterPage.setDetailLevel(3); // Lower detail for large image
		await converterPage.enableArtisticEffect('hand_drawn_style', false); // Disable for speed

		// Monitor memory before processing
		const initialMemory = await page.evaluate(() => {
			return performance.memory ? performance.memory.usedJSHeapSize : 0;
		});

		// Process image
		const startTime = Date.now();
		await converterPage.convertImage();
		const endTime = Date.now();

		// Verify completion
		await expect(page.getByText(/conversion completed/i)).toBeVisible();

		// Check processing time meets expectations
		const processingTime = endTime - startTime;
		const fixture = getTestImage('large-test.png')!;
		const expectedTime = getExpectedProcessingTime(fixture.name, 'high-end');
		expect(processingTime).toBeLessThan(expectedTime * 2); // Allow 2x buffer

		// Monitor memory after processing
		const finalMemory = await page.evaluate(() => {
			return performance.memory ? performance.memory.usedJSHeapSize : 0;
		});

		// Verify no significant memory leak (less than 100MB increase)
		if (initialMemory > 0 && finalMemory > 0) {
			const memoryIncrease = finalMemory - initialMemory;
			expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
		}

		// Download result
		await converterPage.downloadSVG();
	});

	test('artistic effects workflow', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('simple-shapes.png');

		// Enable all artistic effects
		await converterPage.enableArtisticEffect('hand_drawn_style', true);
		await converterPage.enableArtisticEffect('variable_weights', true);
		await converterPage.enableArtisticEffect('tremor_effects', true);

		// Set high detail and smoothness for artistic output
		await converterPage.setDetailLevel(8);
		await converterPage.setSmoothness(9);

		// Process with artistic effects
		await converterPage.convertImage();

		// Verify conversion completed
		await expect(page.getByText(/conversion completed/i)).toBeVisible();

		// Verify SVG output
		const svgPreview = page.locator('img[src*="blob:"]');
		await expect(svgPreview).toBeVisible();

		// Download artistic result
		await converterPage.downloadSVG();
	});

	test('preset workflow', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('medium-test.jpg');

		// Test different presets
		const presets = ['sketch', 'detailed', 'artistic', 'clean'];

		for (const preset of presets) {
			// Select preset by clicking the preset button
			await page.click(`button[aria-pressed="false"]:has-text("${preset}")`);

			// Verify preset is selected
			await expect(page.locator(`button[aria-pressed="true"]:has-text("${preset}")`)).toBeVisible();

			// Process with preset
			await converterPage.convertImage();

			// Verify conversion completed
			await expect(page.getByText(/conversion completed/i)).toBeVisible();

			// Verify SVG output
			const svgPreview = page.locator('img[src*="blob:"]');
			await expect(svgPreview).toBeVisible();
		}
	});

	test('multiple file processing workflow', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(6);

		const testFiles = ['small-test.png', 'simple-shapes.png', 'medium-test.jpg'];

		for (const fileName of testFiles) {
			// Upload new file
			await converterPage.uploadFile(fileName);
			await expect(page.getByText(fileName)).toBeVisible();

			// Process file
			await converterPage.convertImage();
			await expect(page.getByText(/conversion completed/i)).toBeVisible();

			// Download result
			await converterPage.downloadSVG();

			// Clear for next file (if not last)
			if (fileName !== testFiles[testFiles.length - 1]) {
				await page.click('button:has-text("Reset All")');
				await expect(page.getByText(/upload an image/i)).toBeVisible();
			}
		}
	});

	test('browser back/forward navigation', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');

		// Process image
		await converterPage.convertImage();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();

		// Navigate to different page
		await page.goto('/');
		await expect(page.getByText(/vec2art/i)).toBeVisible();

		// Navigate back to converter
		await page.goBack();
		await expect(page.url()).toContain('/converter');

		// Verify state is preserved (WASM should still be loaded)
		const wasmLoaded = await page.evaluate(() => {
			return typeof window.wasmModule !== 'undefined';
		});
		expect(wasmLoaded).toBe(true);

		// Should be able to upload and process again
		await converterPage.uploadFile('simple-shapes.png');
		await converterPage.convertImage();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});

	test('page refresh during workflow', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');

		// Refresh page
		await page.reload();
		await converterPage.waitForWasmLoad();

		// Should need to reinitialize threads
		const threadStatus = await converterPage.getThreadStatus();
		expect(threadStatus.initialized).toBe(false);

		// Should be able to start fresh workflow
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('medium-test.jpg');
		await converterPage.convertImage();
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});
});
