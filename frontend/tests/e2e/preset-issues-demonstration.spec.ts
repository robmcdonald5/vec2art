/**
 * Preset Issues Demonstration Test
 * Demonstrates and documents the specific issues with preset functionality
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PresetIssuesTester {
	constructor(private page: Page) {}

	async setupConverter() {
		await this.page.goto('/converter');
		await this.page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });

		// Upload test image
		const imagePath = path.join(__dirname, 'fixtures', 'images', 'medium-test.jpg');
		const fileInput = this.page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await this.page.waitForTimeout(3000);
	}

	async switchToSuperpixel() {
		// Click the algorithm selector (currently shows "Edge Tracing")
		await this.page.click('button:has-text("Edge Tracing")');
		await this.page.waitForTimeout(500);

		// Click Superpixel option
		await this.page.click('button:has-text("Superpixel")');
		await this.page.waitForTimeout(2000);

		console.log('✅ Switched to Superpixel algorithm');
	}

	async getSuperpixelParameters() {
		// Look for superpixel-specific parameters in the UI
		const numSuperpixels = await this.getParameterValue(
			'Number of Superpixels',
			'input[type="range"]'
		);
		const compactness = await this.getParameterValue('Compactness', 'input[type="range"]');
		const fillRegions = await this.getParameterValue('Fill Regions', 'input[type="checkbox"]');

		return { numSuperpixels, compactness, fillRegions };
	}

	async getParameterValue(paramName: string, selector: string) {
		try {
			// Look for parameter by label or nearby text
			const paramElement = this.page.locator(selector).first();

			if (selector.includes('checkbox')) {
				return await paramElement.isChecked();
			} else {
				return await paramElement.inputValue();
			}
		} catch {
			return 'not_found';
		}
	}

	async selectPresetByName(presetName: string) {
		// Click preset selector dropdown
		await this.page.click('button:has-text("preset")');
		await this.page.waitForTimeout(500);

		// Look for the preset option
		const presetOption = this.page.locator(`button:has-text("${presetName}")`, {
			hasText: presetName
		});

		if (await presetOption.isVisible({ timeout: 2000 })) {
			await presetOption.click();
			await this.page.waitForTimeout(1000);
			console.log(`✅ Selected preset: ${presetName}`);
			return true;
		} else {
			console.log(`❌ Could not find preset: ${presetName}`);
			return false;
		}
	}

	async getAvailablePresets() {
		// Click preset selector to open dropdown
		await this.page.click('button:has-text("preset")');
		await this.page.waitForTimeout(500);

		// Get all visible preset options
		const presetTexts = await this.page
			.locator('[role="option"]:visible, button:visible')
			.allTextContents();

		// Filter to actual preset names (remove UI elements)
		const presets = presetTexts
			.filter((text) => text.trim().length > 0)
			.filter(
				(text) => !text.includes('Clear') && !text.includes('Convert') && !text.includes('Settings')
			);

		console.log('Available presets:', presets);
		return presets;
	}

	async demonstrateStateIssue() {
		// Try rapid preset switching to see if state gets confused
		const presets = await this.getAvailablePresets();
		const testPresets = presets.slice(0, 3); // Test first 3 presets

		console.log('Testing rapid preset switching with:', testPresets);

		for (const preset of testPresets) {
			console.log(`Switching to: ${preset}`);
			await this.selectPresetByName(preset);

			// Take screenshot to compare
			await this.page.screenshot({
				path: `test-results/preset-state-test/preset-${preset.replace(/[^a-zA-Z0-9]/g, '-')}.png`
			});

			await this.page.waitForTimeout(500); // Quick switch
		}
	}
}

test.describe('Preset Issues Demonstration', () => {
	let tester: PresetIssuesTester;

	test.beforeEach(async ({ page }) => {
		tester = new PresetIssuesTester(page);
		await tester.setupConverter();
	});

	test('Demonstrate superpixel preset similarity issue', async ({ page }) => {
		test.setTimeout(120000);

		console.log('🔍 Testing superpixel preset differentiation...');

		// Switch to superpixel algorithm
		await tester.switchToSuperpixel();

		// Get available presets for superpixel
		const availablePresets = await tester.getAvailablePresets();
		console.log('Available presets after algorithm switch:', availablePresets);

		// Test each superpixel preset
		const superpixelPresets = ['Modern Abstract', 'Minimalist Poster', 'Organic Abstract'];

		const presetResults: Record<string, any> = {};

		for (const presetName of superpixelPresets) {
			console.log(`\n🧪 Testing preset: ${presetName}`);

			const selected = await tester.selectPresetByName(presetName);
			if (!selected) continue;

			// Get parameters after preset selection
			const params = await tester.getSuperpixelParameters();
			presetResults[presetName] = params;

			console.log(`${presetName} parameters:`, params);

			// Take screenshot
			await page.screenshot({
				path: `test-results/superpixel-presets/preset-${presetName.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
				fullPage: true
			});
		}

		console.log('\n📊 Superpixel Preset Comparison:');
		console.log(JSON.stringify(presetResults, null, 2));

		// Check if presets are actually different
		const presetKeys = Object.keys(presetResults);
		let foundDifferences = false;

		for (let i = 0; i < presetKeys.length; i++) {
			for (let j = i + 1; j < presetKeys.length; j++) {
				const preset1 = presetResults[presetKeys[i]];
				const preset2 = presetResults[presetKeys[j]];

				if (JSON.stringify(preset1) !== JSON.stringify(preset2)) {
					foundDifferences = true;
					console.log(`✅ Found differences between ${presetKeys[i]} and ${presetKeys[j]}`);
				} else {
					console.log(`❌ No differences between ${presetKeys[i]} and ${presetKeys[j]}`);
				}
			}
		}

		if (!foundDifferences) {
			console.log('🚨 ISSUE CONFIRMED: All superpixel presets appear identical');
		}
	});

	test('Demonstrate dropdown state confusion issue', async ({ page }) => {
		test.setTimeout(90000);

		console.log('🔍 Testing preset selector state management...');

		// Test rapid switching between algorithms and presets
		await tester.demonstrateStateIssue();

		// Test algorithm switching affects preset list
		console.log('\n🔄 Testing algorithm-specific preset filtering...');

		// Start with Edge algorithm
		const edgePresets = await tester.getAvailablePresets();
		console.log('Edge presets:', edgePresets);

		// Switch to Superpixel
		await tester.switchToSuperpixel();
		const superpixelPresets = await tester.getAvailablePresets();
		console.log('Superpixel presets:', superpixelPresets);

		// Check if preset lists are actually different
		const presetsChanged = JSON.stringify(edgePresets) !== JSON.stringify(superpixelPresets);

		if (presetsChanged) {
			console.log('✅ Preset lists correctly change with algorithm');
		} else {
			console.log("❌ ISSUE: Preset lists don't change with algorithm");
		}

		// Final screenshot
		await page.screenshot({
			path: 'test-results/preset-state-test/final-state.png',
			fullPage: true
		});
	});

	test('Document current preset system behavior', async ({ page }) => {
		console.log('📋 Documenting current preset system behavior...');

		const documentation = {
			algorithms: [] as string[],
			presetsByAlgorithm: {} as Record<string, string[]>,
			parameterChanges: {} as Record<string, boolean>
		};

		// Test Edge algorithm
		const edgePresets = await tester.getAvailablePresets();
		documentation.algorithms.push('Edge');
		documentation.presetsByAlgorithm['Edge'] = edgePresets;

		// Test Superpixel algorithm
		await tester.switchToSuperpixel();
		const superpixelPresets = await tester.getAvailablePresets();
		documentation.algorithms.push('Superpixel');
		documentation.presetsByAlgorithm['Superpixel'] = superpixelPresets;

		console.log('📊 System Documentation:');
		console.log(JSON.stringify(documentation, null, 2));

		// Save documentation
		await page.evaluate((doc) => {
			console.log('Preset System Documentation:', doc);
		}, documentation);
	});
});
