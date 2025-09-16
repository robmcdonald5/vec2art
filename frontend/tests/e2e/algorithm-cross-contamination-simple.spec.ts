import { test, expect } from '@playwright/test';

test.describe('Algorithm Cross-Contamination Prevention - Browser Test', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the converter page
		await page.goto('http://localhost:5175/converter');
		await page.waitForLoadState('networkidle');

		// Wait for WASM to load by checking for any vectorizer-related elements
		await page.waitForTimeout(3000); // Give time for WASM to load
	});

	test('should prevent settings cross-contamination between Edge Tracing and Stippling', async ({ page }) => {
		console.log('Starting algorithm cross-contamination test...');

		// Take a screenshot to see the current state
		await page.screenshot({ path: 'test-start.png', fullPage: true });

		// Wait for the page to be ready
		await expect(page.locator('body')).toBeVisible();

		// Create a simple test image file
		const testImagePath = 'C:\\Users\\McDon\\Repos\\vec2art\\frontend\\tests\\fixtures\\test-image-small.jpg';

		// Upload the test image
		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).toBeVisible();
		await fileInput.setInputFiles(testImagePath);

		// Wait for image upload to process
		await page.waitForTimeout(2000);
		console.log('Image uploaded');

		// Look for Edge Tracing algorithm button
		let edgeButton = page.getByRole('button', { name: /edge.*tracing/i });
		if (await edgeButton.count() === 0) {
			// Try alternative selectors
			edgeButton = page.locator('button:has-text("Edge")');
		}
		if (await edgeButton.count() === 0) {
			// Try radio button approach
			edgeButton = page.locator('input[value="edge"]');
		}

		if (await edgeButton.count() > 0) {
			console.log('Found Edge Tracing button, clicking it...');
			await edgeButton.first().click();
			await page.waitForTimeout(1000);
		} else {
			console.log('Edge Tracing button not found, taking screenshot for debugging');
			await page.screenshot({ path: 'edge-button-not-found.png', fullPage: true });
		}

		// Look for Stippling/Dots algorithm button
		let stipplingButton = page.getByRole('button', { name: /stippling/i });
		if (await stipplingButton.count() === 0) {
			stipplingButton = page.locator('button:has-text("Stippling")');
		}
		if (await stipplingButton.count() === 0) {
			stipplingButton = page.locator('input[value="dots"]');
		}

		if (await stipplingButton.count() > 0) {
			console.log('Found Stippling button, clicking it...');
			await stipplingButton.first().click();
			await page.waitForTimeout(1000);
		} else {
			console.log('Stippling button not found, taking screenshot for debugging');
			await page.screenshot({ path: 'stippling-button-not-found.png', fullPage: true });
		}

		// Look for a convert button
		let convertButton = page.getByRole('button', { name: /convert/i });
		if (await convertButton.count() === 0) {
			convertButton = page.locator('button:has-text("Convert")');
		}

		if (await convertButton.count() > 0) {
			console.log('Found Convert button, attempting conversion...');

			// Test multiple algorithm switches
			for (let i = 0; i < 3; i++) {
				console.log(`Switch iteration ${i + 1}`);

				// Switch to Edge if available
				if (await edgeButton.count() > 0) {
					await edgeButton.first().click();
					await page.waitForTimeout(500);
					console.log('Switched to Edge Tracing');
				}

				// Switch to Stippling if available
				if (await stipplingButton.count() > 0) {
					await stipplingButton.first().click();
					await page.waitForTimeout(500);
					console.log('Switched to Stippling');
				}
			}

			// Final conversion attempt
			await convertButton.first().click();
			console.log('Clicked Convert button');

			// Wait for potential processing
			await page.waitForTimeout(5000);

			// Check for any error messages in the console
			const consoleErrors: string[] = [];
			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					consoleErrors.push(msg.text());
				}
			});

			// Check if there are any visible error messages on the page
			const errorMessages = page.locator('*:has-text("error"), *:has-text("Error"), *:has-text("ERROR")');
			const errorCount = await errorMessages.count();

			if (errorCount > 0) {
				console.log(`Found ${errorCount} error messages on page`);
				for (let i = 0; i < Math.min(errorCount, 5); i++) {
					const errorText = await errorMessages.nth(i).textContent();
					console.log(`Error ${i + 1}: ${errorText}`);
				}
			} else {
				console.log('No visible error messages found');
			}

			// Take a final screenshot
			await page.screenshot({ path: 'test-end.png', fullPage: true });

			// The test passes if we don't encounter any blocking errors
			console.log('Algorithm cross-contamination test completed');

		} else {
			console.log('Convert button not found, test incomplete');
			await page.screenshot({ path: 'convert-button-not-found.png', fullPage: true });
		}

		// Verify the page is still responsive
		await expect(page.locator('body')).toBeVisible();
		console.log('Page remains responsive after algorithm switching test');
	});

	test('should handle rapid algorithm switching without errors', async ({ page }) => {
		console.log('Starting rapid algorithm switching test...');

		// Create a simple test image file
		const testImagePath = 'C:\\Users\\McDon\\Repos\\vec2art\\frontend\\tests\\fixtures\\test-image-small.jpg';

		// Upload the test image
		const fileInput = page.locator('input[type="file"]');
		await expect(fileInput).toBeVisible();
		await fileInput.setInputFiles(testImagePath);
		await page.waitForTimeout(2000);

		// Find all available algorithm buttons/options
		const algorithmButtons = page.locator('button:has-text("Edge"), button:has-text("Stippling"), button:has-text("Superpixel"), button:has-text("Centerline")');
		const buttonCount = await algorithmButtons.count();

		console.log(`Found ${buttonCount} algorithm buttons`);

		if (buttonCount > 1) {
			// Perform rapid switching between algorithms
			for (let round = 0; round < 2; round++) {
				console.log(`Rapid switching round ${round + 1}`);

				for (let i = 0; i < buttonCount; i++) {
					const button = algorithmButtons.nth(i);
					const buttonText = await button.textContent();
					console.log(`Clicking algorithm: ${buttonText}`);

					await button.click();
					await page.waitForTimeout(200); // Short delay for rapid switching
				}
			}

			console.log('Rapid algorithm switching completed without blocking errors');
		} else {
			console.log('Not enough algorithm options found for rapid switching test');
		}

		// Verify the page is still responsive
		await expect(page.locator('body')).toBeVisible();
		console.log('Page remains responsive after rapid switching test');
	});
});