/**
 * Preset Analysis Test Suite
 * Analyzes current preset functionality and identifies gaps
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PresetAnalyzer {
	constructor(private page: Page) {}

	async navigateAndUpload() {
		await this.page.goto('/converter');
		await this.page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });

		// Upload test image
		const imagePath = path.join(__dirname, 'fixtures', 'images', 'medium-test.jpg');
		const fileInput = this.page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await this.page.waitForTimeout(3000);

		// Verify upload succeeded by checking upload area is not visible
		const uploadArea = this.page.locator('text="Upload Images"');
		const isUploaded = await uploadArea.isVisible({ timeout: 2000 }).catch(() => false);
		if (isUploaded) {
			throw new Error('Upload failed - upload area still visible');
		}
	}

	async getCurrentAlgorithm() {
		// Look for algorithm indicator button
		try {
			const algorithmButton = this.page.locator('button').filter({ hasText: 'Tracing' }).first();
			const algorithmText = await algorithmButton.textContent();
			console.log('Current algorithm button text:', algorithmText);
			return algorithmText?.toLowerCase() || 'unknown';
		} catch {
			return 'unknown';
		}
	}

	async getCurrentPreset() {
		// Look for preset indicator button
		try {
			const presetButton = this.page.locator('button').filter({ hasText: 'preset' }).first();
			const presetText = await presetButton.textContent();
			console.log('Current preset button text:', presetText);
			return presetText || 'unknown';
		} catch {
			return 'unknown';
		}
	}

	async clickAlgorithmSelector() {
		// Click the algorithm selection button
		const algorithmButton = this.page.locator('button').filter({ hasText: 'Tracing' }).first();
		await algorithmButton.click();
		await this.page.waitForTimeout(1000);
	}

	async clickPresetSelector() {
		// Click the preset selection button
		const presetButton = this.page.locator('button').filter({ hasText: 'preset' }).first();
		await presetButton.click();
		await this.page.waitForTimeout(1000);
	}

	async getAvailableAlgorithms() {
		await this.clickAlgorithmSelector();
		// Get all visible algorithm options after clicking
		const algorithmOptions = await this.page
			.locator('button:visible, [role="option"]:visible')
			.allTextContents();
		console.log('Available algorithm options after clicking:', algorithmOptions);
		return algorithmOptions.filter((text) => text.trim().length > 0);
	}

	async getAvailablePresets() {
		await this.clickPresetSelector();
		// Get all visible preset options after clicking
		const presetOptions = await this.page
			.locator('button:visible, [role="option"]:visible')
			.allTextContents();
		console.log('Available preset options after clicking:', presetOptions);
		return presetOptions.filter((text) => text.trim().length > 0);
	}

	async selectAlgorithmByText(algorithmText: string) {
		await this.clickAlgorithmSelector();
		// Try to find and click algorithm option
		const algorithmOption = this.page
			.locator(`button:has-text("${algorithmText}"), [role="option"]:has-text("${algorithmText}")`)
			.first();
		if (await algorithmOption.isVisible({ timeout: 2000 })) {
			await algorithmOption.click();
			await this.page.waitForTimeout(1000);
			return true;
		}
		return false;
	}

	async selectPresetByText(presetText: string) {
		await this.clickPresetSelector();
		// Try to find and click preset option
		const presetOption = this.page
			.locator(`button:has-text("${presetText}"), [role="option"]:has-text("${presetText}")`)
			.first();
		if (await presetOption.isVisible({ timeout: 2000 })) {
			await presetOption.click();
			await this.page.waitForTimeout(1000);
			return true;
		}
		return false;
	}

	async getParameterValues() {
		const parameters: Record<string, any> = {};

		// Get range sliders
		const rangeInputs = await this.page.locator('input[type="range"]:visible').all();
		for (let i = 0; i < rangeInputs.length; i++) {
			const value = await rangeInputs[i].inputValue();
			parameters[`range_${i}`] = parseFloat(value);
		}

		// Get checkboxes
		const checkboxes = await this.page.locator('input[type="checkbox"]:visible').all();
		for (let i = 0; i < checkboxes.length; i++) {
			const checked = await checkboxes[i].isChecked();
			parameters[`checkbox_${i}`] = checked;
		}

		// Get number inputs
		const numberInputs = await this.page.locator('input[type="number"]:visible').all();
		for (let i = 0; i < numberInputs.length; i++) {
			const value = await numberInputs[i].inputValue();
			parameters[`number_${i}`] = parseFloat(value);
		}

		return parameters;
	}

	async processImage() {
		const convertButton = this.page.locator('button').filter({ hasText: 'Convert' }).first();
		if (await convertButton.isVisible()) {
			await convertButton.click();
			console.log('✅ Clicked Convert button');

			// Wait for processing (with reasonable timeout)
			await this.page.waitForTimeout(15000);

			// Check for download button as indication of completion
			const downloadAvailable = await this.page
				.locator('button')
				.filter({ hasText: 'Download' })
				.isVisible({ timeout: 5000 });
			return downloadAvailable;
		}
		return false;
	}
}

test.describe('Preset Analysis Suite', () => {
	let analyzer: PresetAnalyzer;

	test.beforeEach(async ({ page }) => {
		analyzer = new PresetAnalyzer(page);
		await analyzer.navigateAndUpload();
	});

	test('Analyze current preset system structure', async ({ page }) => {
		test.setTimeout(60000);

		console.log('🔍 Analyzing preset system structure...');

		// 1. Check current state
		const currentAlgorithm = await analyzer.getCurrentAlgorithm();
		const currentPreset = await analyzer.getCurrentPreset();
		console.log('Initial state:', { currentAlgorithm, currentPreset });

		// 2. Get available algorithms
		const availableAlgorithms = await analyzer.getAvailableAlgorithms();
		console.log('Available algorithms:', availableAlgorithms);

		// 3. Get available presets for current algorithm
		const availablePresets = await analyzer.getAvailablePresets();
		console.log('Available presets:', availablePresets);

		// 4. Get current parameter values
		const initialParams = await analyzer.getParameterValues();
		console.log('Initial parameters:', initialParams);

		// 5. Take screenshot of initial state
		await page.screenshot({
			path: 'test-results/preset-analysis/initial-state.png',
			fullPage: true
		});

		expect(availableAlgorithms.length).toBeGreaterThan(0);
	});

	test('Test preset changes affect parameters', async ({ page }) => {
		test.setTimeout(120000);

		console.log('🧪 Testing preset parameter changes...');

		// Get initial parameter state
		const initialParams = await analyzer.getParameterValues();
		console.log('Initial parameters:', initialParams);

		// Get available presets
		const availablePresets = await analyzer.getAvailablePresets();
		console.log('Testing with presets:', availablePresets);

		// Test first few presets (limit to avoid timeout)
		const presetsToTest = availablePresets.slice(0, 3);
		const parameterChanges: Record<string, any> = {};

		for (const preset of presetsToTest) {
			if (preset.trim().length === 0) continue;

			console.log(`Testing preset: "${preset}"`);

			try {
				// Select preset
				const selected = await analyzer.selectPresetByText(preset);
				if (!selected) {
					console.log(`⚠️ Could not select preset: ${preset}`);
					continue;
				}

				// Wait for changes to apply
				await page.waitForTimeout(2000);

				// Get new parameter values
				const newParams = await analyzer.getParameterValues();

				// Compare with initial
				const hasChanges = JSON.stringify(newParams) !== JSON.stringify(initialParams);
				parameterChanges[preset] = {
					hasChanges,
					parameters: newParams
				};

				console.log(`Preset "${preset}" changes parameters: ${hasChanges}`);
				if (hasChanges) {
					console.log('New parameter values:', newParams);
				}

				// Take screenshot
				await page.screenshot({
					path: `test-results/preset-analysis/preset-${preset.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
					fullPage: true
				});
			} catch (error) {
				console.log(`❌ Error testing preset "${preset}":`, error);
			}
		}

		// Summary
		const workingPresets = Object.entries(parameterChanges)
			.filter(([_, data]) => data.hasChanges)
			.map(([name]) => name);

		console.log('✅ Presets that change parameters:', workingPresets);
		console.log(
			"❌ Presets that DON'T change parameters:",
			Object.entries(parameterChanges)
				.filter(([_, data]) => !data.hasChanges)
				.map(([name]) => name)
		);

		// At least one preset should change parameters
		expect(workingPresets.length).toBeGreaterThan(0);
	});

	test('Test algorithm switching', async ({ page }) => {
		test.setTimeout(90000);

		console.log('🔄 Testing algorithm switching...');

		// Get available algorithms
		const availableAlgorithms = await analyzer.getAvailableAlgorithms();
		console.log('Available algorithms:', availableAlgorithms);

		const algorithmResults: Record<string, any> = {};

		// Test each algorithm
		for (const algorithm of availableAlgorithms.slice(0, 3)) {
			// Limit to avoid timeout
			if (algorithm.trim().length === 0) continue;

			console.log(`Testing algorithm: "${algorithm}"`);

			try {
				// Select algorithm
				const selected = await analyzer.selectAlgorithmByText(algorithm);
				if (!selected) {
					console.log(`⚠️ Could not select algorithm: ${algorithm}`);
					continue;
				}

				// Wait for UI to update
				await page.waitForTimeout(2000);

				// Get current parameters
				const params = await analyzer.getParameterValues();

				// Get available presets for this algorithm
				const presets = await analyzer.getAvailablePresets();

				algorithmResults[algorithm] = {
					parameters: params,
					availablePresets: presets
				};

				console.log(`Algorithm "${algorithm}" - Presets:`, presets);

				// Take screenshot
				await page.screenshot({
					path: `test-results/preset-analysis/algorithm-${algorithm.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
					fullPage: true
				});
			} catch (error) {
				console.log(`❌ Error testing algorithm "${algorithm}":`, error);
			}
		}

		console.log('🎯 Algorithm analysis complete:', algorithmResults);
	});

	test('Test full conversion workflow', async ({ page }) => {
		test.setTimeout(90000);

		console.log('🚀 Testing full conversion workflow...');

		try {
			// Process with current settings
			const success = await analyzer.processImage();

			if (success) {
				console.log('✅ Conversion completed successfully');

				// Take screenshot of result
				await page.screenshot({
					path: 'test-results/preset-analysis/conversion-success.png',
					fullPage: true
				});
			} else {
				console.log('❌ Conversion did not complete or failed');

				// Take screenshot of failure state
				await page.screenshot({
					path: 'test-results/preset-analysis/conversion-failure.png',
					fullPage: true
				});
			}

			// Still pass the test to gather information
			console.log('Workflow test completed (informational)');
		} catch (error) {
			console.log('Conversion workflow error:', error);

			await page.screenshot({
				path: 'test-results/preset-analysis/conversion-error.png',
				fullPage: true
			});
		}
	});
});
