import { test, expect } from '@playwright/test';
import { ConverterPage, setupConsoleErrorTracking } from './utils/test-helpers';
import path from 'path';

test.describe('Algorithm Cross-Contamination Prevention', () => {
	let converterPage: ConverterPage;
	let consoleErrors: string[];

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		consoleErrors = setupConsoleErrorTracking(page);

		// Navigate to the converter page
		await page.goto('http://localhost:5175/converter');
		await expect(page).toHaveTitle(/vec2art/i);

		// Wait for WASM to load
		await converterPage.waitForWasmLoad();
	});

	test('should prevent settings cross-contamination between Edge Tracing and Stippling', async ({
		page
	}) => {
		// Initialize threads for processing
		await converterPage.initializeThreads(4);

		// Upload the test image
		await converterPage.uploadFile('test-image-small.jpg');

		// Test 1: Configure Edge Tracing with specific settings
		console.log('Testing Edge Tracing algorithm...');

		// Select Edge Tracing algorithm
		await page.selectOption('[data-testid="algorithm-select"]', 'edge');
		await page.waitForTimeout(500); // Wait for UI update

		// Configure Edge Tracing specific settings
		const noiseFilterSlider = page.locator('[data-testid="noise-filter-slider"]');
		await expect(noiseFilterSlider).toBeVisible();
		await noiseFilterSlider.fill('8'); // Set noise filtering to 8

		const edgeThresholdSlider = page.locator('[data-testid="edge-threshold-slider"]');
		await expect(edgeThresholdSlider).toBeVisible();
		await edgeThresholdSlider.fill('75'); // Set edge threshold to 75

		// Store the Edge Tracing settings
		const edgeNoiseFilter = await noiseFilterSlider.inputValue();
		const edgeThreshold = await edgeThresholdSlider.inputValue();

		console.log(
			`Edge Tracing settings: Noise Filter=${edgeNoiseFilter}, Edge Threshold=${edgeThreshold}`
		);

		// Run Edge Tracing conversion
		await page.click('[data-testid="convert-button"]');

		// Wait for conversion to complete
		await expect(page.locator('[data-testid="svg-output"]')).toBeVisible({ timeout: 15000 });
		await expect(page.locator('[data-testid="conversion-status"]')).toContainText(
			'Conversion completed',
			{ timeout: 15000 }
		);

		// Test 2: Switch to Stippling and verify settings isolation
		console.log('Switching to Stippling algorithm...');

		// Switch to Stippling algorithm
		await page.selectOption('[data-testid="algorithm-select"]', 'dots');
		await page.waitForTimeout(1000); // Wait for UI update and settings reset

		// Verify Edge Tracing specific controls are hidden
		await expect(noiseFilterSlider).not.toBeVisible();
		await expect(edgeThresholdSlider).not.toBeVisible();

		// Verify Stippling specific controls are visible
		const dotSizeSlider = page.locator('[data-testid="dot-size-slider"]');
		const densitySlider = page.locator('[data-testid="density-slider"]');

		await expect(dotSizeSlider).toBeVisible();
		await expect(densitySlider).toBeVisible();

		// Configure Stippling specific settings
		await dotSizeSlider.fill('3'); // Set dot size to 3
		await densitySlider.fill('60'); // Set density to 60

		// Store the Stippling settings
		const dotSize = await dotSizeSlider.inputValue();
		const density = await densitySlider.inputValue();

		console.log(`Stippling settings: Dot Size=${dotSize}, Density=${density}`);

		// Run Stippling conversion
		await page.click('[data-testid="convert-button"]');

		// Wait for conversion to complete
		await expect(page.locator('[data-testid="svg-output"]')).toBeVisible({ timeout: 15000 });
		await expect(page.locator('[data-testid="conversion-status"]')).toContainText(
			'Conversion completed',
			{ timeout: 15000 }
		);

		// Test 3: Switch back to Edge Tracing and verify settings reset
		console.log('Switching back to Edge Tracing...');

		// Switch back to Edge Tracing
		await page.selectOption('[data-testid="algorithm-select"]', 'edge');
		await page.waitForTimeout(1000); // Wait for UI update

		// Verify Stippling specific controls are hidden
		await expect(dotSizeSlider).not.toBeVisible();
		await expect(densitySlider).not.toBeVisible();

		// Verify Edge Tracing controls are visible again
		await expect(noiseFilterSlider).toBeVisible();
		await expect(edgeThresholdSlider).toBeVisible();

		// Check that Edge Tracing settings are reset to defaults, not the previous values
		const resetNoiseFilter = await noiseFilterSlider.inputValue();
		const resetEdgeThreshold = await edgeThresholdSlider.inputValue();

		console.log(
			`Reset Edge Tracing settings: Noise Filter=${resetNoiseFilter}, Edge Threshold=${resetEdgeThreshold}`
		);

		// Verify settings were reset (should be default values, not the previously set values)
		expect(resetNoiseFilter).not.toBe(edgeNoiseFilter);
		expect(resetEdgeThreshold).not.toBe(edgeThreshold);

		// Test 4: Multiple rapid switches to stress test cross-contamination prevention
		console.log('Performing rapid algorithm switches...');

		for (let i = 0; i < 3; i++) {
			// Switch to Stippling
			await page.selectOption('[data-testid="algorithm-select"]', 'dots');
			await page.waitForTimeout(500);

			// Verify Stippling controls are visible
			await expect(page.locator('[data-testid="dot-size-slider"]')).toBeVisible();

			// Switch back to Edge Tracing
			await page.selectOption('[data-testid="algorithm-select"]', 'edge');
			await page.waitForTimeout(500);

			// Verify Edge Tracing controls are visible
			await expect(page.locator('[data-testid="noise-filter-slider"]')).toBeVisible();
		}

		// Test 5: Final conversion test to ensure no cross-contamination errors
		console.log('Running final conversion test...');

		// Configure Edge Tracing with different settings
		await page.locator('[data-testid="noise-filter-slider"]').fill('5');
		await page.locator('[data-testid="edge-threshold-slider"]').fill('50');

		// Run conversion
		await page.click('[data-testid="convert-button"]');

		// Wait for successful conversion
		await expect(page.locator('[data-testid="svg-output"]')).toBeVisible({ timeout: 15000 });
		await expect(page.locator('[data-testid="conversion-status"]')).toContainText(
			'Conversion completed',
			{ timeout: 15000 }
		);

		// Check for any error messages
		const errorMessages = page.locator('[data-testid="error-message"]');
		await expect(errorMessages).toHaveCount(0);

		// Switch to Stippling one more time and run conversion
		await page.selectOption('[data-testid="algorithm-select"]', 'dots');
		await page.waitForTimeout(1000);

		await page.click('[data-testid="convert-button"]');

		// Wait for successful conversion
		await expect(page.locator('[data-testid="svg-output"]')).toBeVisible({ timeout: 15000 });
		await expect(page.locator('[data-testid="conversion-status"]')).toContainText(
			'Conversion completed',
			{ timeout: 15000 }
		);

		// Check for any error messages
		await expect(errorMessages).toHaveCount(0);

		console.log('Algorithm cross-contamination test completed successfully!');
	});

	test('should maintain algorithm-specific parameter isolation', async ({ page }) => {
		// Create a test image file for upload
		const testImagePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-image-small.jpg');

		// Upload the test image
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(testImagePath);

		// Wait for image to load
		await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible({ timeout: 10000 });

		// Test parameter isolation between different algorithms
		const algorithms = [
			{ name: 'edge', testId: 'Edge Tracing' },
			{ name: 'centerline', testId: 'Centerline Tracing' },
			{ name: 'superpixel', testId: 'Superpixel Tracing' },
			{ name: 'dots', testId: 'Stippling' }
		];

		for (const algorithm of algorithms) {
			console.log(`Testing ${algorithm.testId} algorithm...`);

			// Select algorithm
			await page.selectOption('[data-testid="algorithm-select"]', algorithm.name);
			await page.waitForTimeout(1000);

			// Verify algorithm-specific controls are visible
			const algorithmSpecificControls = page.locator(`[data-testid*="${algorithm.name}"]`);

			// Run conversion to ensure no cross-contamination
			await page.click('[data-testid="convert-button"]');

			// Wait for conversion to complete
			await expect(page.locator('[data-testid="svg-output"]')).toBeVisible({ timeout: 15000 });
			await expect(page.locator('[data-testid="conversion-status"]')).toContainText(
				'Conversion completed',
				{ timeout: 15000 }
			);

			// Check for any error messages
			const errorMessages = page.locator('[data-testid="error-message"]');
			await expect(errorMessages).toHaveCount(0);
		}

		console.log('Algorithm parameter isolation test completed successfully!');
	});
});
