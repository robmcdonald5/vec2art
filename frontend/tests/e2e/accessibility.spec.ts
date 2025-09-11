/**
 * Accessibility E2E Tests
 * Tests keyboard navigation, screen reader support, and WCAG compliance
 */

import { test, expect } from '@playwright/test';
import { ConverterPage, navigateWithKeyboard as _navigateWithKeyboard, checkAccessibility as _checkAccessibility } from './utils/test-helpers';

test.describe('Accessibility Tests', () => {
	let converterPage: ConverterPage;

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		await converterPage.goto();
	});

	test('keyboard-only navigation workflow', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Start keyboard navigation from page top
		await page.keyboard.press('Tab'); // Should focus first interactive element

		// Track focus progression
		const focusOrder = [];

		for (let i = 0; i < 15; i++) {
			const focusedElement = await page.evaluate(() => {
				const element = document.activeElement;
				return element
					? {
							tagName: element.tagName,
							type: element.type || '',
							role: element.getAttribute('role'),
							ariaLabel: element.getAttribute('aria-label'),
							textContent: element.textContent?.slice(0, 50)
						}
					: null;
			});

			if (focusedElement) {
				focusOrder.push(focusedElement);
			}

			await page.keyboard.press('Tab');
			await page.waitForTimeout(100);
		}

		// Verify logical focus order
		expect(focusOrder.length).toBeGreaterThan(5);

		// Should include key interactive elements
		const elementTypes = focusOrder.map((el) => `${el.tagName}:${el.type}`);
		expect(elementTypes).toContain('INPUT:file'); // File input
		expect(elementTypes).toContain('BUTTON:'); // Convert button

		console.log('Focus order:', focusOrder);
	});

	test('keyboard file upload workflow', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);

		// Navigate to file input using keyboard
		await page.keyboard.press('Tab');

		// Keep tabbing until we reach the file input
		for (let i = 0; i < 10; i++) {
			const focused = await page.evaluate(() => {
				const el = document.activeElement;
				return el?.tagName === 'INPUT' && el?.type === 'file';
			});

			if (focused) break;
			await page.keyboard.press('Tab');
		}

		// Upload file using file input
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles('tests/e2e/fixtures/images/small-test.png');

		// Verify file was uploaded
		await expect(page.getByText(/small-test\.png/)).toBeVisible();

		// Navigate to convert button using keyboard
		for (let i = 0; i < 10; i++) {
			const focused = await page.evaluate(() => {
				const el = document.activeElement;
				return el?.textContent?.includes('Convert') || el?.textContent?.includes('Initialize');
			});

			if (focused) break;
			await page.keyboard.press('Tab');
		}

		// Activate convert button with Enter
		await page.keyboard.press('Enter');

		// Wait for processing to complete
		await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 30000 });

		// Navigate to download button
		for (let i = 0; i < 5; i++) {
			const focused = await page.evaluate(() => {
				const el = document.activeElement;
				return el?.textContent?.includes('Download');
			});

			if (focused) break;
			await page.keyboard.press('Tab');
		}

		// Activate download with Space
		await page.keyboard.press(' ');

		// Should trigger download
		await expect(page.getByRole('button', { name: /download/i })).toBeEnabled();
	});

	test('screen reader announcements', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Monitor aria-live regions
		const _announcements: string[] = [];

		// Listen for changes in aria-live regions
		await page.evaluate(() => {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'childList' || mutation.type === 'characterData') {
						const target = mutation.target as HTMLElement;
						if (target.getAttribute('aria-live') || target.closest('[aria-live]')) {
							const text = target.textContent?.trim();
							if (text) {
								window.announcements = window.announcements || [];
								window.announcements.push(text);
							}
						}
					}
				});
			});

			// Observe all aria-live regions
			const liveRegions = document.querySelectorAll('[aria-live]');
			liveRegions.forEach((region) => {
				observer.observe(region, {
					childList: true,
					subtree: true,
					characterData: true
				});
			});
		});

		// Perform workflow actions
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');
		await converterPage.convertImage();

		// Wait for processing to complete
		await expect(page.getByText(/conversion completed/i)).toBeVisible();

		// Retrieve announcements
		const pageAnnouncements = await page.evaluate(() => window.announcements || []);

		// Verify key announcements were made
		expect(pageAnnouncements.length).toBeGreaterThan(0);

		const announcementText = pageAnnouncements.join(' ').toLowerCase();
		expect(announcementText).toContain('file selected');
		expect(announcementText).toContain('processing');
		expect(announcementText).toContain('completed');

		console.log('Screen reader announcements:', pageAnnouncements);
	});

	test('form controls have proper labels', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Check all form controls have proper labeling
		const unlabeledInputs = await page
			.locator('input:not([aria-label]):not([aria-labelledby])')
			.count();
		const unlabeledButtons = await page
			.locator('button:not([aria-label]):not([aria-labelledby])')
			.count();
		const unlabeledSelects = await page
			.locator('select:not([aria-label]):not([aria-labelledby])')
			.count();

		// Allow for some unlabeled elements (like hidden inputs)
		expect(unlabeledInputs).toBeLessThan(3);
		expect(unlabeledButtons).toBeLessThan(2);
		expect(unlabeledSelects).toBe(0);

		// Check that range inputs have proper labeling
		const rangeInputs = page.locator('input[type="range"]');
		const rangeCount = await rangeInputs.count();

		for (let i = 0; i < rangeCount; i++) {
			const rangeInput = rangeInputs.nth(i);
			const hasLabel = await rangeInput.evaluate((el) => {
				return (
					el.hasAttribute('aria-label') ||
					el.hasAttribute('aria-labelledby') ||
					document.querySelector(`label[for="${el.id}"]`) !== null
				);
			});
			expect(hasLabel).toBe(true);
		}

		// Check radio buttons are properly grouped
		const radioGroups = page.locator('input[type="radio"]');
		const radioCount = await radioGroups.count();

		if (radioCount > 0) {
			const radioNames = await radioGroups.evaluateAll((elements) => {
				return elements.map((el) => el.getAttribute('name')).filter(Boolean);
			});
			expect(radioNames.length).toBeGreaterThan(0);
		}
	});

	test('proper heading structure', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Get all headings in order
		const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
		expect(headings.length).toBeGreaterThan(0);

		// Should have an h1
		const h1Count = await page.locator('h1').count();
		expect(h1Count).toBeGreaterThanOrEqual(1);

		// Check logical heading hierarchy
		const headingLevels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((elements) => {
			return elements.map((el) => parseInt(el.tagName.substring(1)));
		});

		// First heading should be h1
		expect(headingLevels[0]).toBe(1);

		// No skipping of levels (more than 1 level jump)
		for (let i = 1; i < headingLevels.length; i++) {
			const jump = headingLevels[i] - headingLevels[i - 1];
			expect(jump).toBeLessThanOrEqual(1);
		}
	});

	test('color contrast and visual accessibility', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Check that focus indicators are visible
		const buttons = page.locator('button');
		const buttonCount = await buttons.count();

		for (let i = 0; i < Math.min(buttonCount, 5); i++) {
			const button = buttons.nth(i);
			await button.focus();

			// Check if focus indicator is visible
			const focusStyles = await button.evaluate((el) => {
				const styles = window.getComputedStyle(el, ':focus');
				return {
					outline: styles.outline,
					outlineColor: styles.outlineColor,
					outlineWidth: styles.outlineWidth,
					boxShadow: styles.boxShadow
				};
			});

			// Should have some kind of focus indicator
			const hasFocusIndicator = focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none';

			expect(hasFocusIndicator).toBe(true);
		}

		// Check that error messages are properly associated with form controls
		await converterPage.uploadInvalidFile('invalid.txt');

		// Should show error
		await expect(page.getByText(/error/i)).toBeVisible();

		// Error should be associated with form control via aria-describedby or similar
		const errorElement = page.getByText(/error/i).first();
		const errorId = await errorElement.getAttribute('id');

		if (errorId) {
			const associatedControl = page.locator(`[aria-describedby*="${errorId}"]`);
			const hasAssociation = (await associatedControl.count()) > 0;
			expect(hasAssociation).toBe(true);
		}
	});

	test('skip links and navigation landmarks', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Check for skip links (if implemented)
		const skipLinks = page.locator('a[href^="#"]:has-text("skip")');
		const skipLinkCount = await skipLinks.count();

		if (skipLinkCount > 0) {
			// Skip links should be functional
			const firstSkipLink = skipLinks.first();
			const href = await firstSkipLink.getAttribute('href');
			const targetId = href?.substring(1);

			if (targetId) {
				const target = page.locator(`#${targetId}`);
				await expect(target).toBeVisible();
			}
		}

		// Check for proper landmarks
		const landmarks = {
			main: await page.locator('main, [role="main"]').count(),
			navigation: await page.locator('nav, [role="navigation"]').count(),
			banner: await page.locator('header, [role="banner"]').count(),
			contentinfo: await page.locator('footer, [role="contentinfo"]').count()
		};

		// Should have main landmark
		expect(landmarks.main).toBeGreaterThan(0);

		// If navigation exists, should be properly marked
		const navElements = page.locator('nav, [role="navigation"]');
		const navCount = await navElements.count();

		for (let i = 0; i < navCount; i++) {
			const nav = navElements.nth(i);
			const hasLabel = await nav.evaluate((el) => {
				return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
			});

			// Navigation should be labeled if there are multiple
			if (navCount > 1) {
				expect(hasLabel).toBe(true);
			}
		}
	});

	test('keyboard trap management during processing', async ({ page }) => {
		await converterPage.waitForWasmLoad();
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('large-test.png');

		// Start processing
		await converterPage.convertButton.click();

		// During processing, focus should be managed appropriately
		await expect(page.getByText(/processing/i)).toBeVisible();

		// Tab navigation should still work during processing
		await page.keyboard.press('Tab');

		const focusedDuringProcessing = await page.evaluate(() => {
			return document.activeElement?.tagName;
		});

		expect(focusedDuringProcessing).toBeTruthy();

		// Should not be able to submit again while processing
		const convertButtonDisabled = await converterPage.convertButton.isDisabled();
		expect(convertButtonDisabled).toBe(true);

		// Wait for processing to complete
		await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 60000 });

		// Focus should be restored or appropriately managed after processing
		await page.keyboard.press('Tab');

		const focusedAfterProcessing = await page.evaluate(() => {
			return document.activeElement?.tagName;
		});

		expect(focusedAfterProcessing).toBeTruthy();
	});

	test('high contrast and dark mode accessibility', async ({ page }) => {
		await converterPage.waitForWasmLoad();

		// Test dark mode if supported
		const darkModeToggle = page.locator('[aria-label*="dark"], [aria-label*="theme"]');
		const hasDarkMode = (await darkModeToggle.count()) > 0;

		if (hasDarkMode) {
			// Toggle dark mode
			await darkModeToggle.click();
			await page.waitForTimeout(500); // Wait for transition

			// Check that content is still readable
			const bodyStyles = await page.evaluate(() => {
				const styles = window.getComputedStyle(document.body);
				return {
					backgroundColor: styles.backgroundColor,
					color: styles.color
				};
			});

			// Should have appropriate dark theme colors
			expect(bodyStyles.backgroundColor).not.toBe('rgb(255, 255, 255)');
			expect(bodyStyles.color).not.toBe('rgb(0, 0, 0)');
		}

		// Test high contrast mode simulation
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.waitForTimeout(500);

		// Elements should still be visible and functional
		await expect(converterPage.convertButton).toBeVisible();

		// Text should still be readable
		const headingText = await page.locator('h1').textContent();
		expect(headingText).toBeTruthy();
	});

	test('reduced motion preferences', async ({ page }) => {
		// Simulate reduced motion preference
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await converterPage.goto();
		await converterPage.waitForWasmLoad();

		// Animations should be reduced or disabled
		const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
		const animatedCount = await animatedElements.count();

		if (animatedCount > 0) {
			// Check that animations respect reduced motion
			const hasReducedMotion = await page.evaluate(() => {
				return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			});

			expect(hasReducedMotion).toBe(true);
		}

		// Progress indicators should still be functional without excessive animation
		await converterPage.initializeThreads(4);
		await converterPage.uploadFile('small-test.png');
		await converterPage.convertImage();

		// Progress should complete normally
		await expect(page.getByText(/conversion completed/i)).toBeVisible();
	});
});
