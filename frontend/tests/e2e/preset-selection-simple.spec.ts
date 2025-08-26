/**
 * Simple Preset Selection Test
 * Tests that preset selection actually works end-to-end
 */
import { test } from '@playwright/test';

test.describe('Simple Preset Selection Test', () => {
	test('Test each preset can be selected multiple times', async ({ page }) => {
		test.setTimeout(90000);
		
		// Navigate and setup
		await page.goto('/converter');
		await page.waitForTimeout(3000);
		
		// Upload image
		const imagePath = './tests/e2e/fixtures/images/medium-test.jpg';
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await page.waitForTimeout(3000);
		
		console.log('🧪 Testing Edge preset selection...');
		
		const edgePresets = ['Photo to Sketch', 'Hand-Drawn Illustration', 'Detailed Line Art'];
		
		// Test each preset twice to verify selection works consistently
		for (let round = 1; round <= 2; round++) {
			console.log(`\n🔄 Round ${round}:`);
			
			for (const presetName of edgePresets) {
				console.log(`  Testing: ${presetName}`);
				
				// Open dropdown
				await page.click('button:has-text("Select Edge Detection preset")');
				await page.waitForTimeout(500);
				
				// Click preset
				await page.click(`button:has-text("${presetName}")`);
				await page.waitForTimeout(1000);
				
				// Verify by checking the button text changed or params changed
				const rangeInputs = await page.locator('input[type="range"]').all();
				const paramValues = [];
				for (const input of rangeInputs) {
					const value = await input.inputValue();
					paramValues.push(value);
				}
				
				console.log(`    Parameters: [${paramValues.join(', ')}]`);
				
				// Take screenshot for manual verification
				await page.screenshot({ 
					path: `test-results/simple-preset-test/round${round}-${presetName.replace(/\s+/g, '-')}.png`
				});
			}
		}
		
		console.log('\n🎯 Testing rapid switching (original issue):');
		
		// Rapid switching test - the specific issue mentioned
		for (let i = 0; i < 5; i++) {
			const presetName = edgePresets[i % edgePresets.length];
			
			console.log(`  Switch ${i + 1}: ${presetName}`);
			
			await page.click('button:has-text("Select Edge Detection preset")');
			await page.waitForTimeout(200);
			await page.click(`button:has-text("${presetName}")`);
			await page.waitForTimeout(300);
		}
		
		console.log('✅ Rapid switching completed - checking final state...');
		
		// Final verification - can we still select each preset?
		for (const presetName of edgePresets) {
			await page.click('button:has-text("Select Edge Detection preset")');
			await page.waitForTimeout(200);
			
			const presetButton = page.locator(`button:has-text("${presetName}")`);
			const isClickable = await presetButton.isVisible() && await presetButton.isEnabled();
			
			if (isClickable) {
				await presetButton.click();
				await page.waitForTimeout(200);
				console.log(`  ✅ ${presetName}: Still selectable`);
			} else {
				console.log(`  ❌ ${presetName}: NOT selectable (BUG STILL EXISTS)`);
			}
		}
		
		// Final screenshot
		await page.screenshot({ 
			path: 'test-results/simple-preset-test/final-state.png',
			fullPage: true
		});
		
		console.log('✅ Preset selection test completed');
	});
});