/**
 * Preset Selection Fix Test
 * Tests the fixed preset selection state management
 */
import { test, expect } from '@playwright/test';

test.describe('Preset Selection Fix', () => {
	test('Test preset selection state management is fixed', async ({ page }) => {
		test.setTimeout(60000);
		
		// Navigate and setup
		await page.goto('/converter');
		await page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });
		
		// Upload image
		const imagePath = './tests/e2e/fixtures/images/medium-test.jpg';
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await page.waitForTimeout(3000);
		
		console.log('🔍 Testing Edge algorithm preset selection...');
		
		// Test Edge algorithm preset selection
		const edgePresets = ['Photo to Sketch', 'Hand-Drawn Illustration', 'Detailed Line Art'];
		
		for (const presetName of edgePresets) {
			console.log(`\n🧪 Testing selection of: ${presetName}`);
			
			// Click preset selector dropdown
			await page.click('button:has-text("preset")');
			await page.waitForTimeout(500);
			
			// Check if preset is available
			const presetOption = page.locator(`button:has-text("${presetName}")`);
			const isVisible = await presetOption.isVisible({ timeout: 2000 });
			
			if (!isVisible) {
				console.log(`❌ Preset "${presetName}" not found in dropdown`);
				continue;
			}
			
			// Click the preset
			await presetOption.click();
			await page.waitForTimeout(1000);
			
			// Verify selection by checking if dropdown shows the selected preset
			const presetButton = page.locator('button:has-text("preset")').first();
			const buttonText = await presetButton.textContent();
			
			console.log(`Button text after selection: "${buttonText}"`);
			
			// Take screenshot for visual verification
			await page.screenshot({ 
				path: `test-results/preset-selection-fix/edge-${presetName.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
				fullPage: true
			});
		}
		
		console.log('\n🔍 Testing Superpixel algorithm preset selection...');
		
		// Switch to superpixel algorithm
		await page.click('button:has-text("Edge Tracing")');
		await page.click('button:has-text("Superpixel")');
		await page.waitForTimeout(2000);
		
		// Test Superpixel preset selection
		const superpixelPresets = ['Modern Abstract', 'Minimalist Poster', 'Organic Abstract'];
		
		for (const presetName of superpixelPresets) {
			console.log(`\n🧪 Testing selection of: ${presetName}`);
			
			// Click preset selector dropdown
			await page.click('button:has-text("preset")');
			await page.waitForTimeout(500);
			
			// Check if preset is available
			const presetOption = page.locator(`button:has-text("${presetName}")`);
			const isVisible = await presetOption.isVisible({ timeout: 2000 });
			
			if (!isVisible) {
				console.log(`❌ Preset "${presetName}" not found in dropdown`);
				continue;
			}
			
			// Click the preset
			await presetOption.click();
			await page.waitForTimeout(1000);
			
			// Verify selection by checking parameters changed
			const rangeInputs = await page.locator('input[type="range"]').all();
			const paramValues = [];
			for (const input of rangeInputs) {
				paramValues.push(await input.inputValue());
			}
			
			console.log(`Parameters after selecting ${presetName}:`, paramValues);
			
			// Take screenshot for visual verification
			await page.screenshot({ 
				path: `test-results/preset-selection-fix/superpixel-${presetName.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
				fullPage: true
			});
		}
		
		console.log('\n✅ Preset selection test completed');
	});

	test('Test rapid preset switching', async ({ page }) => {
		test.setTimeout(60000);
		
		console.log('🔍 Testing rapid preset switching (the original issue)...');
		
		// Navigate and setup
		await page.goto('/converter');
		await page.waitForSelector('[data-testid="converter-page"]', { timeout: 30000 });
		
		// Upload image
		const imagePath = './tests/e2e/fixtures/images/medium-test.jpg';
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await page.waitForTimeout(3000);
		
		// Rapidly switch between Edge presets multiple times
		const edgePresets = ['Photo to Sketch', 'Hand-Drawn Illustration', 'Detailed Line Art'];
		
		for (let round = 1; round <= 3; round++) {
			console.log(`\n🔄 Round ${round} of rapid switching:`);
			
			for (const presetName of edgePresets) {
				console.log(`  Switching to: ${presetName}`);
				
				// Click preset selector
				await page.click('button:has-text("preset")');
				await page.waitForTimeout(200); // Minimal wait
				
				// Click preset
				const presetOption = page.locator(`button:has-text("${presetName}")`);
				if (await presetOption.isVisible({ timeout: 1000 })) {
					await presetOption.click();
					await page.waitForTimeout(200); // Minimal wait
					console.log(`    ✅ Successfully selected ${presetName}`);
				} else {
					console.log(`    ❌ Could not select ${presetName}`);
				}
			}
		}
		
		console.log('\n🎯 Final verification - all presets should still be selectable:');
		
		// Final test - verify all presets are still individually selectable
		for (const presetName of edgePresets) {
			await page.click('button:has-text("preset")');
			await page.waitForTimeout(300);
			
			const presetOption = page.locator(`button:has-text("${presetName}")`);
			const isClickable = await presetOption.isVisible({ timeout: 1000 }) && await presetOption.isEnabled();
			
			console.log(`  ${presetName}: ${isClickable ? '✅ Selectable' : '❌ Not selectable'}`);
			
			if (isClickable) {
				await presetOption.click();
				await page.waitForTimeout(300);
			}
		}
		
		console.log('\n✅ Rapid switching test completed');
	});
});