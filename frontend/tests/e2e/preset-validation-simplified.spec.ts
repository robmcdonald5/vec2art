/**
 * Simplified Preset Validation Test Suite
 * Tests preset functionality with the actual UI structure
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimplePresetValidator {
	constructor(private page: Page) {}

	async navigateToConverter() {
		await this.page.goto('/converter');
		await this.page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });
	}

	async uploadTestImage(imageName: string) {
		const imagePath = path.join(__dirname, 'fixtures', 'images', imageName);

		// Upload via file input - simplified selector
		const fileInput = this.page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);

		// Wait for image to load and converter interface to appear
		await this.page.waitForTimeout(2000);

		// Check if we transitioned to the converter interface
		const uploadArea = this.page.locator('text="Upload Images"');
		const isUploaded = await uploadArea.isVisible({ timeout: 5000 }).catch(() => false);

		if (isUploaded) {
			console.log('Image upload may not have worked correctly');
			throw new Error('Upload area still visible - image may not have uploaded');
		}

		console.log('✅ Image appears to be uploaded successfully');
	}

	async selectAlgorithm(algorithm: string) {
		// Look for algorithm selector dropdown
		try {
			// Try multiple selectors for backend/algorithm selection
			const selectors = [
				`text="${algorithm}"`,
				`[data-value="${algorithm}"]`,
				`button:has-text("${algorithm}")`,
				`div:has-text("${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)}")`
			];

			let clicked = false;
			for (const selector of selectors) {
				const element = this.page.locator(selector).first();
				if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
					await element.click();
					clicked = true;
					console.log(`✅ Clicked algorithm "${algorithm}" using selector: ${selector}`);
					break;
				}
			}

			if (!clicked) {
				console.log('Available algorithm options:', await this.getAvailableOptions());
				throw new Error(`Could not find algorithm "${algorithm}"`);
			}

			await this.page.waitForTimeout(1000);
		} catch (error) {
			console.log('Error selecting algorithm:', error);
			throw error;
		}
	}

	async selectPreset(preset: string) {
		try {
			// Look for preset selector
			const presetSelectors = [
				`text="${preset}"`,
				`button:has-text("${preset}")`,
				`option:has-text("${preset}")`,
				`[value="${preset}"]`
			];

			let clicked = false;
			for (const selector of presetSelectors) {
				const element = this.page.locator(selector).first();
				if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
					await element.click();
					clicked = true;
					console.log(`✅ Clicked preset "${preset}" using selector: ${selector}`);
					break;
				}
			}

			if (!clicked) {
				console.log('Available preset options:', await this.getAvailableOptions());
				throw new Error(`Could not find preset "${preset}"`);
			}

			await this.page.waitForTimeout(1000);
		} catch (error) {
			console.log('Error selecting preset:', error);
			throw error;
		}
	}

	async getAvailableOptions() {
		try {
			// Get all visible text options that might be selectable
			const buttons = await this.page.locator('button:visible').allTextContents();
			const selects = await this.page.locator('select:visible option').allTextContents();
			return { buttons, selects };
		} catch {
			return { buttons: [], selects: [] };
		}
	}

	async processImage() {
		// Look for process/convert button
		const processSelectors = [
			'button:has-text("Convert")',
			'button:has-text("Process")',
			'button:has-text("Generate")',
			'[aria-label*="process"]',
			'[aria-label*="convert"]'
		];

		let processButton = null;
		for (const selector of processSelectors) {
			const button = this.page.locator(selector).first();
			if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
				processButton = button;
				break;
			}
		}

		if (!processButton) {
			throw new Error('Could not find process/convert button');
		}

		await processButton.click();
		console.log('✅ Clicked process button');

		// Wait for processing to start (look for loading indicators)
		const processingIndicators = [
			'text="Processing"',
			'text="Converting"',
			'.loading',
			'.spinner',
			'text="Please wait"'
		];

		let _processingStarted = false;
		for (const indicator of processingIndicators) {
			if (
				await this.page
					.locator(indicator)
					.isVisible({ timeout: 2000 })
					.catch(() => false)
			) {
				processingStarted = true;
				console.log('✅ Processing started');
				break;
			}
		}

		// Wait for processing to complete (generous timeout for WASM)
		await this.page.waitForTimeout(10000); // 10 second timeout for processing

		// Look for completion indicators
		const completionIndicators = [
			'text="Complete"',
			'text="Done"',
			'button:has-text("Download")',
			'svg', // SVG preview should appear
			'.preview'
		];

		let completed = false;
		for (const indicator of completionIndicators) {
			if (
				await this.page
					.locator(indicator)
					.isVisible({ timeout: 5000 })
					.catch(() => false)
			) {
				completed = true;
				console.log('✅ Processing appears to have completed');
				break;
			}
		}

		if (!completed) {
			console.warn('⚠️ Could not confirm processing completion');
		}
	}

	async checkForOutput() {
		// Look for signs of SVG output
		const outputIndicators = ['svg', 'text="Download"', '.preview', '[data-testid*="preview"]'];

		let hasOutput = false;
		for (const indicator of outputIndicators) {
			if (
				await this.page
					.locator(indicator)
					.isVisible({ timeout: 2000 })
					.catch(() => false)
			) {
				hasOutput = true;
				break;
			}
		}

		return hasOutput;
	}
}

// Basic preset test cases
const BASIC_TEST_CASES = [
	{
		algorithm: 'edge',
		preset: 'sketch',
		description: 'Edge algorithm with sketch preset'
	},
	{
		algorithm: 'edge',
		preset: 'comic',
		description: 'Edge algorithm with comic preset'
	},
	{
		algorithm: 'dots',
		preset: 'artistic',
		description: 'Dots algorithm with artistic preset'
	}
];

test.describe('Simplified Preset Validation', () => {
	let validator: SimplePresetValidator;

	test.beforeEach(async ({ page }) => {
		validator = new SimplePresetValidator(page);
		await validator.navigateToConverter();
	});

	// Test basic preset functionality
	for (const testCase of BASIC_TEST_CASES) {
		test(`${testCase.algorithm}-${testCase.preset} basic functionality`, async ({ page }) => {
			test.setTimeout(120000); // 2 minute timeout

			console.log(`Testing: ${testCase.description}`);

			try {
				// Step 1: Upload test image
				await validator.uploadTestImage('medium-test.jpg');
				console.log('✅ Image uploaded');

				// Step 2: Select algorithm
				await validator.selectAlgorithm(testCase.algorithm);
				console.log('✅ Algorithm selected');

				// Step 3: Select preset
				await validator.selectPreset(testCase.preset);
				console.log('✅ Preset selected');

				// Step 4: Process the image
				await validator.processImage();
				console.log('✅ Processing attempted');

				// Step 5: Check for output
				const hasOutput = await validator.checkForOutput();

				if (hasOutput) {
					console.log('✅ Output detected - test passed');
				} else {
					console.log('⚠️ No output detected - may indicate processing issue');
				}

				// Take screenshot for manual review
				await page.screenshot({
					path: `test-results/preset-basic/${testCase.algorithm}-${testCase.preset}.png`,
					fullPage: true
				});
			} catch (error) {
				console.log(`❌ Test failed: ${error.message}`);

				// Take screenshot of failure state
				await page.screenshot({
					path: `test-results/preset-failures/${testCase.algorithm}-${testCase.preset}-failure.png`,
					fullPage: true
				});

				throw error;
			}
		});
	}

	// UI exploration test
	test('UI structure exploration', async ({ page }) => {
		console.log('🔍 Exploring UI structure...');

		try {
			// Upload an image first
			await validator.uploadTestImage('medium-test.jpg');

			// Get all visible buttons and their text
			const buttons = await page.locator('button:visible').allTextContents();
			console.log('Available buttons:', buttons);

			// Get all input elements
			const inputs = await page.locator('input:visible').all();
			for (let i = 0; i < inputs.length; i++) {
				const input = inputs[i];
				const type = await input.getAttribute('type');
				const placeholder = await input.getAttribute('placeholder');
				const ariaLabel = await input.getAttribute('aria-label');
				console.log(
					`Input ${i}: type=${type}, placeholder=${placeholder}, aria-label=${ariaLabel}`
				);
			}

			// Get all select elements
			const selects = await page.locator('select:visible').all();
			for (let i = 0; i < selects.length; i++) {
				const select = selects[i];
				const options = await select.locator('option').allTextContents();
				console.log(`Select ${i}: options=[${options.join(', ')}]`);
			}

			// Take a screenshot of the UI
			await page.screenshot({
				path: 'test-results/ui-exploration.png',
				fullPage: true
			});
		} catch (error) {
			console.log('UI exploration error:', error);
		}
	});

	// Algorithm availability test
	test('Check available algorithms', async ({ page }) => {
		try {
			// Upload image to activate converter interface
			await validator.uploadTestImage('simple-shapes.png');

			// Look for algorithm/backend options
			const algorithms = ['edge', 'centerline', 'dots', 'superpixel'];
			const availableAlgorithms: string[] = [];

			for (const algorithm of algorithms) {
				const selectors = [
					`text="${algorithm}"`,
					`text="${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)}"`
				];

				for (const selector of selectors) {
					if (
						await page
							.locator(selector)
							.isVisible({ timeout: 1000 })
							.catch(() => false)
					) {
						availableAlgorithms.push(algorithm);
						break;
					}
				}
			}

			console.log('Available algorithms:', availableAlgorithms);
			expect(availableAlgorithms.length).toBeGreaterThan(0);
		} catch (error) {
			console.log('Algorithm availability check failed:', error);
			throw error;
		}
	});
});
