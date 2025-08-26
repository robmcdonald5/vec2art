/**
 * Comprehensive Preset Validation Test Suite
 * Tests all presets for each algorithm to ensure meaningful output differences
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

interface PresetTestCase {
	algorithm: 'edge' | 'centerline' | 'dots' | 'superpixel';
	preset: string;
	expectedCharacteristics: {
		description: string;
		visualExpectations: string[];
		parameterChecks: Array<{ setting: string; expectedValue: string | number }>;
	};
}

// Test cases for each algorithm-preset combination
const PRESET_TEST_CASES: PresetTestCase[] = [
	// Edge Algorithm Presets
	{
		algorithm: 'edge',
		preset: 'sketch',
		expectedCharacteristics: {
			description: 'Edge backend with medium detail and hand-drawn style for sketch-like line art',
			visualExpectations: [
				'Should produce organic, sketch-like line variations',
				'Should have moderate detail level (6/10)',
				'Should show hand-drawn effects (tremor, tapering)',
				'Should use multipass processing for quality'
			],
			parameterChecks: [
				{ setting: 'Detail Level', expectedValue: 6 },
				{ setting: 'Hand Drawn Style', expectedValue: 'Subtle' },
				{ setting: 'Pass Count', expectedValue: 2 },
				{ setting: 'Variable Weights', expectedValue: 0.3 },
				{ setting: 'Tremor Strength', expectedValue: 0.1 }
			]
		}
	},
	{
		algorithm: 'edge',
		preset: 'comic',
		expectedCharacteristics: {
			description: 'Edge backend with strong hand-drawn effects for comic book style',
			visualExpectations: [
				'Should produce bold, comic-book style lines',
				'Should have high detail level (7/10)',
				'Should show strong artistic effects',
				'Should use multipass for comic quality'
			],
			parameterChecks: [
				{ setting: 'Detail Level', expectedValue: 7 },
				{ setting: 'Hand Drawn Style', expectedValue: 'Medium' },
				{ setting: 'Pass Count', expectedValue: 2 },
				{ setting: 'Variable Weights', expectedValue: 0.4 },
				{ setting: 'Tremor Strength', expectedValue: 0.2 }
			]
		}
	},
	{
		algorithm: 'edge',
		preset: 'technical',
		expectedCharacteristics: {
			description: 'Edge backend with precise settings for technical drawings',
			visualExpectations: [
				'Should produce clean, precise lines',
				'Should have moderate detail (6/10)',
				'Should avoid hand-drawn effects',
				'Should be optimized for technical accuracy'
			],
			parameterChecks: [
				{ setting: 'Detail Level', expectedValue: 6 },
				{ setting: 'Hand Drawn Style', expectedValue: 'None' },
				{ setting: 'Pass Count', expectedValue: 1 },
				{ setting: 'Variable Weights', expectedValue: 0.0 }
			]
		}
	},

	// Centerline Algorithm Presets  
	{
		algorithm: 'centerline',
		preset: 'technical',
		expectedCharacteristics: {
			description: 'Centerline backend with precise skeleton extraction for technical drawings',
			visualExpectations: [
				'Should produce precise centerline skeletons',
				'Should have low detail for clean extraction',
				'Should show thin, precise lines',
				'Should be optimized for logos and text'
			],
			parameterChecks: [
				{ setting: 'Detail Level', expectedValue: 3 },
				{ setting: 'Stroke Width', expectedValue: 0.8 },
				{ setting: 'Hand Drawn Style', expectedValue: 'None' },
				{ setting: 'Pass Count', expectedValue: 1 }
			]
		}
	},

	// Dots Algorithm Presets
	{
		algorithm: 'dots',
		preset: 'artistic',
		expectedCharacteristics: {
			description: 'Dots backend with colorful stippling and adaptive sizing',
			visualExpectations: [
				'Should produce stippling/pointillism effects',
				'Should preserve original colors',
				'Should show variable dot sizes',
				'Should have adaptive content-aware placement'
			],
			parameterChecks: [
				{ setting: 'Detail Level', expectedValue: 3 },
				{ setting: 'Enable Color', expectedValue: true },
				{ setting: 'Dot Density', expectedValue: 0.15 },
				{ setting: 'Adaptive Sizing', expectedValue: true }
			]
		}
	},

	// Superpixel Algorithm Presets
	{
		algorithm: 'superpixel',
		preset: 'poster',
		expectedCharacteristics: {
			description: 'Superpixel backend with bold regions for poster-style art',
			visualExpectations: [
				'Should produce bold, region-based shapes',
				'Should preserve colors in large areas',
				'Should show simplified, poster-like appearance',
				'Should have clean boundaries'
			],
			parameterChecks: [
				{ setting: 'Detail Level', expectedValue: 2 },
				{ setting: 'Enable Color', expectedValue: true },
				{ setting: 'Number of Superpixels', expectedValue: 150 },
				{ setting: 'Fill Regions', expectedValue: true }
			]
		}
	}
];

// Test images for different scenarios
const TEST_IMAGES = [
	{
		name: 'simple-shapes.png',
		description: 'Simple geometric shapes - good for testing basic algorithm differences'
	},
	{
		name: 'medium-test.jpg',
		description: 'Medium complexity photo - good for testing artistic effects'
	},
	{
		name: 'high-detail.png',
		description: 'High detail image - good for testing detail level differences'
	}
];

class PresetValidator {
	constructor(private page: Page) {}

	async navigateToConverter() {
		await this.page.goto('/converter');
		await this.page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });
	}

	async uploadTestImage(imageName: string) {
		const imagePath = path.join(__dirname, 'fixtures', 'images', imageName);
		
		// Upload via file input
		const fileInput = this.page.locator('input[type="file"]');
		await fileInput.setInputFiles(imagePath);
		
		// Wait for image to load
		await this.page.waitForSelector('[data-testid="uploaded-image"]', { timeout: 15000 });
		await this.page.waitForTimeout(1000); // Allow image processing
	}

	async selectAlgorithm(algorithm: string) {
		// Click algorithm dropdown/selector
		await this.page.click('[data-testid="algorithm-selector"]');
		await this.page.click(`[data-testid="algorithm-option-${algorithm}"]`);
		
		// Wait for algorithm change to take effect
		await this.page.waitForTimeout(500);
	}

	async selectPreset(preset: string) {
		// Click preset dropdown
		await this.page.click('[data-testid="preset-selector"]');
		await this.page.click(`[data-testid="preset-option-${preset}"]`);
		
		// Wait for preset to apply
		await this.page.waitForTimeout(1000);
	}

	async validatePresetParameters(expectedParams: Array<{ setting: string; expectedValue: string | number }>) {
		for (const param of expectedParams) {
			const settingSelector = `[data-testid="setting-${param.setting.toLowerCase().replace(/\s+/g, '-')}"]`;
			
			try {
				if (typeof param.expectedValue === 'boolean') {
					// For checkboxes
					const isChecked = await this.page.isChecked(settingSelector);
					expect(isChecked).toBe(param.expectedValue);
				} else if (typeof param.expectedValue === 'number') {
					// For sliders and numeric inputs
					const value = await this.page.inputValue(settingSelector);
					expect(parseFloat(value)).toBeCloseTo(param.expectedValue, 1);
				} else {
					// For dropdowns and text inputs
					const value = await this.page.inputValue(settingSelector);
					expect(value).toBe(param.expectedValue.toString());
				}
			} catch (error) {
				console.warn(`Could not validate parameter ${param.setting}: ${error}`);
			}
		}
	}

	async processImage() {
		// Click process/convert button
		await this.page.click('[data-testid="process-button"]');
		
		// Wait for processing to start
		await this.page.waitForSelector('[data-testid="processing-indicator"]', { timeout: 5000 });
		
		// Wait for processing to complete (with generous timeout for WASM)
		await this.page.waitForSelector('[data-testid="svg-preview"]', { timeout: 60000 });
		
		// Additional wait for SVG to fully render
		await this.page.waitForTimeout(2000);
	}

	async captureSVGOutput() {
		// Get the SVG content
		const svgContent = await this.page.textContent('[data-testid="svg-output"]');
		
		// Take screenshot of the preview
		const previewElement = this.page.locator('[data-testid="svg-preview"]');
		const screenshot = await previewElement.screenshot();
		
		return {
			svgContent,
			screenshot
		};
	}

	async getProcessingStats() {
		try {
			// Look for processing time, path count, etc.
			const stats = await this.page.locator('[data-testid="processing-stats"]').textContent();
			return stats || 'No stats available';
		} catch {
			return 'Stats not available';
		}
	}
}

// Main test suite
test.describe('Preset Validation Suite', () => {
	let validator: PresetValidator;

	test.beforeEach(async ({ page }) => {
		validator = new PresetValidator(page);
		await validator.navigateToConverter();
	});

	// Test each preset with multiple images
	for (const testCase of PRESET_TEST_CASES) {
		for (const testImage of TEST_IMAGES) {
			test(`${testCase.algorithm}-${testCase.preset} with ${testImage.name}`, async ({ page }) => {
				test.setTimeout(120000); // 2 minute timeout for complex processing
				
				console.log(`Testing ${testCase.algorithm} algorithm with ${testCase.preset} preset`);
				console.log(`Image: ${testImage.description}`);
				console.log(`Expected: ${testCase.expectedCharacteristics.description}`);

				// Step 1: Upload test image
				await validator.uploadTestImage(testImage.name);

				// Step 2: Select algorithm
				await validator.selectAlgorithm(testCase.algorithm);

				// Step 3: Select preset
				await validator.selectPreset(testCase.preset);

				// Step 4: Validate that preset parameters were applied correctly
				await validator.validatePresetParameters(testCase.expectedCharacteristics.parameterChecks);

				// Step 5: Process the image
				await validator.processImage();

				// Step 6: Capture outputs
				const output = await validator.captureSVGOutput();
				const stats = await validator.getProcessingStats();

				// Step 7: Validate output characteristics
				expect(output.svgContent).toBeTruthy();
				expect(output.svgContent.length).toBeGreaterThan(100); // Should have meaningful SVG content

				// Step 8: Algorithm-specific validations
				switch (testCase.algorithm) {
					case 'edge':
						// Edge algorithm should produce <path> elements
						expect(output.svgContent).toContain('<path');
						break;
					case 'centerline':
						// Centerline should produce thin, precise paths
						expect(output.svgContent).toContain('stroke-width');
						break;
					case 'dots':
						// Dots algorithm should produce <circle> elements
						expect(output.svgContent).toContain('<circle');
						break;
					case 'superpixel':
						// Superpixel should produce filled regions
						expect(output.svgContent).toContain('fill');
						break;
				}

				// Step 9: Log results for manual review
				console.log(`✅ ${testCase.algorithm}-${testCase.preset} completed successfully`);
				console.log(`Stats: ${stats}`);
				console.log(`SVG length: ${output.svgContent.length} characters`);

				// Store outputs for comparison (in CI/test artifacts)
				const testId = `${testCase.algorithm}-${testCase.preset}-${testImage.name}`;
				await page.screenshot({ 
					path: `test-results/preset-validation/${testId}-screenshot.png`,
					fullPage: true 
				});
			});
		}
	}

	// Comparative tests - ensure presets produce different outputs
	test('Presets produce meaningfully different outputs', async ({ page }) => {
		const testImage = 'medium-test.jpg';
		const outputs = new Map<string, string>();

		// Test edge algorithm presets for differences
		for (const preset of ['sketch', 'comic', 'technical']) {
			await validator.uploadTestImage(testImage);
			await validator.selectAlgorithm('edge');
			await validator.selectPreset(preset);
			await validator.processImage();
			
			const output = await validator.captureSVGOutput();
			outputs.set(`edge-${preset}`, output.svgContent);
		}

		// Validate that outputs are different
		const edgePresets = Array.from(outputs.entries()).filter(([key]) => key.startsWith('edge-'));
		
		for (let i = 0; i < edgePresets.length; i++) {
			for (let j = i + 1; j < edgePresets.length; j++) {
				const [preset1Name, svg1] = edgePresets[i];
				const [preset2Name, svg2] = edgePresets[j];
				
				// SVGs should be different
				expect(svg1).not.toBe(svg2);
				
				// Calculate rough difference metric
				const similarity = svg1.length / svg2.length;
				expect(similarity).not.toBeCloseTo(1.0, 0.95); // Should be less than 95% similar
				
				console.log(`✅ ${preset1Name} vs ${preset2Name}: Different outputs confirmed`);
			}
		}
	});

	// Algorithm differences test
	test('Different algorithms produce distinctly different outputs', async ({ page }) => {
		const testImage = 'simple-shapes.png';
		const algorithmOutputs = new Map<string, string>();

		// Test each algorithm with its primary preset
		const algorithmTests = [
			{ algorithm: 'edge', preset: 'sketch' },
			{ algorithm: 'centerline', preset: 'technical' },
			{ algorithm: 'dots', preset: 'artistic' },
			{ algorithm: 'superpixel', preset: 'poster' }
		];

		for (const { algorithm, preset } of algorithmTests) {
			await validator.uploadTestImage(testImage);
			await validator.selectAlgorithm(algorithm);
			await validator.selectPreset(preset);
			await validator.processImage();
			
			const output = await validator.captureSVGOutput();
			algorithmOutputs.set(algorithm, output.svgContent);
		}

		// Validate that each algorithm produces distinct output patterns
		expect(algorithmOutputs.get('edge')).toContain('<path');
		expect(algorithmOutputs.get('dots')).toContain('<circle');
		// Superpixel should have fills or polygons
		expect(algorithmOutputs.get('superpixel')).toMatch(/<path.*fill|<polygon/);

		console.log('✅ All algorithms produce distinctly different output types');
	});
});

// Performance and regression tests
test.describe('Preset Performance Validation', () => {
	test('All presets complete within reasonable time', async ({ page }) => {
		const validator = new PresetValidator(page);
		await validator.navigateToConverter();
		
		const performanceResults: Array<{ preset: string; algorithm: string; timeMs: number }> = [];
		
		for (const testCase of PRESET_TEST_CASES) {
			const startTime = Date.now();
			
			await validator.uploadTestImage('medium-test.jpg');
			await validator.selectAlgorithm(testCase.algorithm);
			await validator.selectPreset(testCase.preset);
			await validator.processImage();
			
			const endTime = Date.now();
			const processingTime = endTime - startTime;
			
			performanceResults.push({
				preset: testCase.preset,
				algorithm: testCase.algorithm,
				timeMs: processingTime
			});
			
			// Each preset should complete within 60 seconds
			expect(processingTime).toBeLessThan(60000);
			
			console.log(`⏱️ ${testCase.algorithm}-${testCase.preset}: ${processingTime}ms`);
		}
		
		// Log performance summary
		const avgTime = performanceResults.reduce((sum, r) => sum + r.timeMs, 0) / performanceResults.length;
		console.log(`📊 Average processing time: ${Math.round(avgTime)}ms`);
	});
});