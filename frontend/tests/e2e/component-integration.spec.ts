/**
 * Component Integration E2E Tests
 * Tests specifically for LoadingState and ErrorState component integration
 * in the actual application context
 */

import { test, expect } from '@playwright/test';

test.describe('LoadingState and ErrorState Component Integration', () => {
	test.beforeEach(async ({ page }) => {
		// Set up console error tracking
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// Navigate to converter page
		await page.goto('/converter');
		await expect(page).toHaveTitle(/vec2art/i);
	});

	test('shows loading state during WASM module loading', async ({ page }) => {
		// Look for loading indicators on initial page load
		await page.waitForLoadState('networkidle');

		// Check if loading states are properly rendered and accessible
		const loadingElements = page.locator('[role="status"]');
		const loadingText = page.locator('text=/loading|preparing|initializing/i');

		// At least one loading indicator should be present or have been present
		const hasLoadingRole = (await loadingElements.count()) > 0;
		const hasLoadingText = (await loadingText.count()) > 0;

		// Either loading elements should be present or they should have been cleared
		expect(hasLoadingRole || hasLoadingText).toBeTruthy();

		console.log('Loading elements found:', await loadingElements.count());
		console.log('Loading text found:', await loadingText.count());
	});

	test('shows loading state during file upload', async ({ page }) => {
		// Wait for page to be ready
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000); // Give WASM time to load

		// Create a simple test file and upload it
		const fileInput = page.locator('input[type="file"]');
		const isVisible = await fileInput.isVisible();

		if (isVisible) {
			// Create test file content
			const testFileContent = new Uint8Array([
				0x89,
				0x50,
				0x4e,
				0x47,
				0x0d,
				0x0a,
				0x1a,
				0x0a, // PNG signature
				...new Array(100).fill(0x00) // Simple data
			]);

			// Upload file
			await fileInput.setInputFiles({
				name: 'test.png',
				mimeType: 'image/png',
				buffer: Buffer.from(testFileContent)
			});

			// Look for loading states
			const loadingState = page.locator('[role="status"]');
			await expect(loadingState.first()).toBeVisible({ timeout: 5000 });
		} else {
			console.log('File input not visible, skipping upload test');
		}
	});

	test('shows error state for invalid file upload', async ({ page }) => {
		// Wait for page to be ready
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000);

		const fileInput = page.locator('input[type="file"]');
		const isVisible = await fileInput.isVisible();

		if (isVisible) {
			// Upload invalid file
			await fileInput.setInputFiles({
				name: 'invalid.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('This is not an image file')
			});

			// Look for error states
			const errorElement = page.locator('[role="alert"]');
			await expect(errorElement.first()).toBeVisible({ timeout: 10000 });

			// Check for error message content
			const errorText = page.locator('text=/error|invalid|unsupported/i');
			await expect(errorText.first()).toBeVisible();
		} else {
			console.log('File input not visible, skipping error test');
		}
	});

	test('loading and error states have proper accessibility', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		// Check for loading states with proper ARIA
		const loadingElements = page.locator('[role="status"]');
		const errorElements = page.locator('[role="alert"]');

		// If loading elements exist, they should have proper attributes
		if ((await loadingElements.count()) > 0) {
			const firstLoader = loadingElements.first();
			await expect(firstLoader).toHaveAttribute('role', 'status');

			// Should have aria-label or accessible text
			const hasAriaLabel = await firstLoader.getAttribute('aria-label');
			const hasText = await firstLoader.innerText();
			expect(hasAriaLabel || hasText).toBeTruthy();
		}

		// If error elements exist, they should have proper attributes
		if ((await errorElements.count()) > 0) {
			const firstError = errorElements.first();
			await expect(firstError).toHaveAttribute('role', 'alert');
		}

		console.log('Found loading elements:', await loadingElements.count());
		console.log('Found error elements:', await errorElements.count());
	});

	test('components use consistent styling', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		// Check that loading and error components use consistent styling classes
		const loadingElements = page.locator('[role="status"]');
		const errorElements = page.locator('[role="alert"]');

		// Both should use similar spacing and layout classes
		if ((await loadingElements.count()) > 0) {
			const loader = loadingElements.first();
			const classes = await loader.getAttribute('class');

			// Should contain layout classes like flex, items-center, gap-*, etc.
			expect(classes).toMatch(/flex|items|gap|space/);
		}

		if ((await errorElements.count()) > 0) {
			const error = errorElements.first();
			const classes = await error.getAttribute('class');

			// Should contain layout classes
			expect(classes).toMatch(/flex|items|gap|space/);
		}
	});
});
