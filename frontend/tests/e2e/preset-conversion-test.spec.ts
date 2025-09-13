/**
 * Preset Conversion Logic Test
 * Tests the actual parameter conversion from StylePresets to VectorizerConfig
 */
import { test, expect } from '@playwright/test';

test.describe('Preset Conversion Logic', () => {
	test('Test superpixel preset conversion in browser context', async ({ page }) => {
		// Go to converter to access the module context
		await page.goto('/converter');

		// Test preset conversion in browser context
		const conversionResults = await page.evaluate(async () => {
			// Import the modules directly in browser
			const { getPresetById } = await import('/src/lib/presets/presets.js');
			const { presetToVectorizerConfig } = await import('/src/lib/presets/converter.js');

			const results: Record<string, any> = {};

			// Test all superpixel presets
			const superpixelPresets = ['modern-abstract', 'minimalist-poster', 'organic-abstract'];

			for (const presetId of superpixelPresets) {
				const preset = getPresetById(presetId);
				if (preset) {
					const config = presetToVectorizerConfig(preset);
					results[presetId] = {
						name: preset.metadata.name,
						num_superpixels: config.num_superpixels,
						compactness: config.compactness,
						fill_regions: config.fill_regions,
						stroke_regions: config.stroke_regions,
						boundary_epsilon: config.boundary_epsilon,
						backend: config.backend
					};
				} else {
					results[presetId] = { error: 'Preset not found' };
				}
			}

			return results;
		});

		console.log('🔍 Superpixel Preset Conversion Results:');
		console.log(JSON.stringify(conversionResults, null, 2));

		// Verify expected values
		expect(conversionResults['minimalist-poster']).toBeDefined();
		expect(conversionResults['minimalist-poster'].name).toBe('Minimalist Poster');

		// Check if the conversion matches our expected values from converter.ts
		const minimalistConfig = conversionResults['minimalist-poster'];
		console.log('Minimalist Poster config:', minimalistConfig);

		// Based on our converter code, minimalist-poster should have num_superpixels: 25
		if (minimalistConfig.num_superpixels !== 25) {
			console.log(`❌ Expected num_superpixels: 25, got: ${minimalistConfig.num_superpixels}`);
		} else {
			console.log(`✅ Correct num_superpixels: ${minimalistConfig.num_superpixels}`);
		}

		// Check compactness (expected: 25)
		if (minimalistConfig.compactness !== 25) {
			console.log(`❌ Expected compactness: 25, got: ${minimalistConfig.compactness}`);
		} else {
			console.log(`✅ Correct compactness: ${minimalistConfig.compactness}`);
		}

		// Check differences between presets
		const modernConfig = conversionResults['modern-abstract'];
		const organicConfig = conversionResults['organic-abstract'];

		console.log('\n📊 Preset Differences:');
		console.log('Modern Abstract:', modernConfig);
		console.log('Minimalist Poster:', minimalistConfig);
		console.log('Organic Abstract:', organicConfig);

		// Verify they're actually different
		const allSame =
			modernConfig.num_superpixels === minimalistConfig.num_superpixels &&
			minimalistConfig.num_superpixels === organicConfig.num_superpixels &&
			modernConfig.compactness === minimalistConfig.compactness &&
			minimalistConfig.compactness === organicConfig.compactness;

		if (allSame) {
			console.log('❌ All superpixel presets have identical parameters!');
		} else {
			console.log('✅ Superpixel presets have different parameters');
		}

		expect(allSame).toBe(false);
	});

	test('Test parameter application chain', async ({ page }) => {
		test.setTimeout(60000);

		// Navigate and setup
		await page.goto('/converter');
		await page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });

		// Upload image
		const imagePath = './tests/e2e/fixtures/images/medium-test.jpg';
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await page.waitForTimeout(3000);

		// Switch to superpixel algorithm
		await page.click('button:has-text("Edge Tracing")');
		await page.click('button:has-text("Superpixel")');
		await page.waitForTimeout(2000);

		// Test parameter application
		const parameterTest = await page.evaluate(async () => {
			// Get settings from the UI
			const rangeInputs = Array.from(document.querySelectorAll('input[type="range"]'));
			const checkboxInputs = Array.from(document.querySelectorAll('input[type="checkbox"]'));

			const currentParams = {
				ranges: rangeInputs.map((input) => ({
					value: (input as HTMLInputElement).value,
					min: (input as HTMLInputElement).min,
					max: (input as HTMLInputElement).max
				})),
				checkboxes: checkboxInputs.map((input) => ({
					checked: (input as HTMLInputElement).checked
				}))
			};

			return currentParams;
		});

		console.log('📊 Current UI Parameters:');
		console.log(JSON.stringify(parameterTest, null, 2));

		// Try to click a preset and see if parameters change
		await page.click('button:has-text("Select Superpixel")');
		await page.waitForTimeout(500);

		// Click Minimalist Poster preset
		const minimalistButton = page.locator('button:has-text("Minimalist Poster")');
		if (await minimalistButton.isVisible({ timeout: 2000 })) {
			await minimalistButton.click();
			await page.waitForTimeout(2000);

			// Get parameters after preset selection
			const newParams = await page.evaluate(() => {
				const rangeInputs = Array.from(document.querySelectorAll('input[type="range"]'));
				const checkboxInputs = Array.from(document.querySelectorAll('input[type="checkbox"]'));

				return {
					ranges: rangeInputs.map((input) => ({
						value: (input as HTMLInputElement).value,
						min: (input as HTMLInputElement).min,
						max: (input as HTMLInputElement).max
					})),
					checkboxes: checkboxInputs.map((input) => ({
						checked: (input as HTMLInputElement).checked
					}))
				};
			});

			console.log('📊 Parameters After Preset Selection:');
			console.log(JSON.stringify(newParams, null, 2));

			// Check if parameters actually changed
			const paramsChanged = JSON.stringify(parameterTest) !== JSON.stringify(newParams);
			console.log(`Parameters changed: ${paramsChanged}`);

			if (!paramsChanged) {
				console.log('❌ ISSUE: Preset selection did not change UI parameters');
			} else {
				console.log('✅ Preset selection successfully changed UI parameters');
			}
		} else {
			console.log('❌ Could not find Minimalist Poster preset button');
		}
	});
});
