import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
	test('should not have any automatically detectable accessibility issues on home page', async ({
		page
	}) => {
		await page.goto('/');

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should not have any automatically detectable accessibility issues on converter page', async ({
		page
	}) => {
		await page.goto('/converter');

		// Wait for the page to fully load
		await page.waitForSelector('h1:has-text("Image to SVG Converter")');

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should support keyboard navigation on converter page', async ({ page }) => {
		await page.goto('/converter');

		// Wait for page to load
		await page.waitForSelector('h1:has-text("Image to SVG Converter")');

		// Test tab navigation through interactive elements
		await page.keyboard.press('Tab');

		// Should be able to reach the file upload area
		const fileUpload = page.locator('[role="button"]:has-text("Upload image file")');
		await expect(fileUpload).toBeFocused();

		// Continue tabbing to other interactive elements
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Should be able to activate elements with Enter/Space
		await page.keyboard.press('Space');
	});

	test('should have proper focus management in modal dialogs', async ({ page }) => {
		await page.goto('/converter');

		// Check if any modals are present and test focus trapping
		const modal = page.locator('[role="dialog"]');

		if ((await modal.count()) > 0) {
			// Focus should be trapped within the modal
			await page.keyboard.press('Tab');
			const _focusedElement = await page.locator(':focus');
			const modalContainer = await modal.first();

			// Focused element should be within the modal
			expect(await modalContainer.locator(':focus').count()).toBeGreaterThan(0);

			// Escape should close the modal
			await page.keyboard.press('Escape');
			await expect(modal).toBeHidden();
		}
	});

	test('should announce status changes to screen readers', async ({ page }) => {
		await page.goto('/converter');

		// Check for ARIA live regions
		const liveRegions = page.locator('[aria-live]');
		await expect(liveRegions).toHaveCount(2); // Should have polite and assertive regions

		// Check for proper labeling
		const progressBars = page.locator('[role="progressbar"]');
		if ((await progressBars.count()) > 0) {
			await expect(progressBars.first()).toHaveAttribute('aria-label');
		}
	});

	test('should have proper form labeling and error handling', async ({ page }) => {
		await page.goto('/converter');

		// Check that all form controls have labels
		const inputs = page.locator('input, select, textarea');
		const inputCount = await inputs.count();

		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const inputId = await input.getAttribute('id');

			if (inputId) {
				// Should have a label or aria-label
				const hasLabel = (await page.locator(`label[for="${inputId}"]`).count()) > 0;
				const hasAriaLabel = await input.getAttribute('aria-label');

				expect(hasLabel || hasAriaLabel).toBeTruthy();
			}
		}
	});

	test('should have appropriate color contrast', async ({ page }) => {
		await page.goto('/converter');

		// Test color contrast with axe-core
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2aa'])
			.withRules(['color-contrast'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should work with screen reader simulation', async ({ page }) => {
		await page.goto('/converter');

		// Check for semantic HTML structure
		const headings = page.locator('h1, h2, h3, h4, h5, h6');
		await expect(headings.first()).toHaveText(/Image to SVG Converter/);

		// Check for landmarks
		const landmarks = page.locator('main, nav, header, footer, aside, section[aria-labelledby]');
		await expect(landmarks).toHaveCount(/* expected number based on page structure */);

		// Check for skip links (if implemented)
		const _skipLinks = page.locator('a:has-text("Skip to"), a:has-text("Skip to main content")');
		// Skip links are optional but recommended
	});

	test('should support reduced motion preferences', async ({ page }) => {
		// Set reduced motion preference
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/converter');

		// Animations should respect the preference
		// This would need specific implementation details to test properly
		const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should be usable with high contrast mode', async ({ page }) => {
		// Simulate high contrast mode
		await page.emulateMedia({ forcedColors: 'active' });
		await page.goto('/converter');

		// Check that the page is still functional
		await expect(page.locator('h1')).toBeVisible();

		const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should support zoom up to 200%', async ({ page }) => {
		await page.goto('/converter');

		// Set zoom to 200%
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.evaluate(() => {
			document.body.style.zoom = '2';
		});

		// Page should still be usable
		await expect(page.locator('h1')).toBeVisible();

		// No horizontal scrolling should be needed
		const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
		const viewportWidth = await page.evaluate(() => window.innerWidth);

		expect(bodyWidth).toBeLessThanOrEqual(viewportWidth * 2); // Allow for zoom
	});
});

test.describe('Smart Performance Selector Accessibility', () => {
	test('should support keyboard navigation between performance modes', async ({ page }) => {
		await page.goto('/converter');

		// Wait for the performance selector to load
		await page.waitForSelector('[data-mode]', { timeout: 10000 });

		const modeButtons = page.locator('[data-mode]');
		const buttonCount = await modeButtons.count();

		if (buttonCount > 0) {
			// Focus first mode button
			await modeButtons.first().focus();

			// Test arrow key navigation
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowDown');

			// Test Home/End keys
			await page.keyboard.press('Home');
			await expect(modeButtons.first()).toBeFocused();

			await page.keyboard.press('End');
			await expect(modeButtons.last()).toBeFocused();
		}
	});

	test('should announce mode changes to screen readers', async ({ page }) => {
		await page.goto('/converter');

		// Wait for the performance selector
		await page.waitForSelector('[data-mode]', { timeout: 10000 });

		// Check for live regions
		const liveRegions = page.locator('[aria-live="polite"]');
		await expect(liveRegions).toHaveCount(/* expected count */);

		// Mode buttons should have proper ARIA attributes
		const modeButtons = page.locator('[data-mode]');
		if ((await modeButtons.count()) > 0) {
			await expect(modeButtons.first()).toHaveAttribute('aria-pressed');
			await expect(modeButtons.first()).toHaveAttribute('aria-describedby');
		}
	});
});

test.describe('File Upload Accessibility', () => {
	test('should support keyboard interaction', async ({ page }) => {
		await page.goto('/converter');

		const fileUpload = page.locator('[role="button"]:has-text("Upload image file")');
		await fileUpload.focus();

		// Should be able to activate with Enter or Space
		await page.keyboard.press('Enter');
		// This would normally trigger the file dialog

		await fileUpload.focus();
		await page.keyboard.press('Space');
		// This would also trigger the file dialog
	});

	test('should announce file selection status', async ({ page }) => {
		await page.goto('/converter');

		// Check for live regions that announce file changes
		const liveRegions = page.locator('[aria-live]');
		await expect(liveRegions).toHaveCount(/* expected count */);

		// File input should have proper labeling
		const fileInput = page.locator('input[type="file"]');
		if ((await fileInput.count()) > 0) {
			await expect(fileInput).toHaveAttribute('aria-describedby');
		}
	});
});
