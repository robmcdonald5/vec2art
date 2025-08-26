/**
 * Preset Diagnostic Test
 * Simple diagnostic to see what's happening with preset state
 */
import { test } from '@playwright/test';

test.describe('Preset Diagnostic', () => {
	test('Diagnose preset selector state', async ({ page }) => {
		test.setTimeout(60000);
		
		// Navigate and setup
		await page.goto('/converter');
		await page.waitForTimeout(5000);
		
		// Upload image
		const imagePath = './tests/e2e/fixtures/images/medium-test.jpg';
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles(imagePath);
		await page.waitForTimeout(5000);
		
		console.log('🔍 Diagnosing preset selector...');
		
		// Get all visible buttons
		const allButtons = await page.locator('button').allTextContents();
		console.log('All visible buttons:', allButtons);
		
		// Look for preset-related buttons
		const presetButtons = allButtons.filter(text => 
			text.toLowerCase().includes('preset') || 
			text.toLowerCase().includes('select') ||
			text.includes('Edge') ||
			text.includes('Photo')
		);
		console.log('Preset-related buttons:', presetButtons);
		
		// Try clicking different preset selectors
		const possibleSelectors = [
			'button:has-text("Select")',
			'button:has-text("preset")',
			'button:has-text("Edge")',
			'[data-testid*="preset"]'
		];
		
		for (const selector of possibleSelectors) {
			const elements = await page.locator(selector).all();
			console.log(`Found ${elements.length} elements for selector: ${selector}`);
			
			if (elements.length > 0) {
				for (let i = 0; i < elements.length; i++) {
					try {
						const text = await elements[i].textContent();
						const visible = await elements[i].isVisible();
						console.log(`  Element ${i}: "${text}" (visible: ${visible})`);
					} catch (e) {
						console.log(`  Element ${i}: error getting info - ${e}`);
					}
				}
			}
		}
		
		// Try to find the actual preset selector
		console.log('\n🎯 Looking for the preset selector dropdown...');
		
		// Look for buttons that might be the preset selector
		const buttons = await page.locator('button').all();
		for (let i = 0; i < buttons.length; i++) {
			try {
				const text = await buttons[i].textContent();
				const visible = await buttons[i].isVisible();
				
				if (text && (text.includes('Select') || text.includes('preset') || text.includes('Photo'))) {
					console.log(`Found potential preset selector: "${text}" (visible: ${visible})`);
					
					if (visible) {
						console.log('Attempting to click this button...');
						await buttons[i].click();
						await page.waitForTimeout(1000);
						
						// Check what appeared
						const newButtons = await page.locator('button:visible').allTextContents();
						console.log('Buttons after click:', newButtons);
						break;
					}
				}
			} catch (e) {
				// Skip problematic buttons
			}
		}
		
		// Final screenshot for manual inspection
		await page.screenshot({ 
			path: 'test-results/preset-diagnostic/final-state.png',
			fullPage: true
		});
		
		console.log('✅ Diagnostic complete - check screenshot for visual inspection');
	});
});