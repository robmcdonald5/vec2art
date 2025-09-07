/**
 * Simple E2E Test Helpers
 * Basic utilities for E2E tests without complex dependencies
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded and interactive
 */
export async function waitForPageReady(page: Page, timeout = 10000) {
	await page.waitForLoadState('domcontentloaded');
	await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
	try {
		const element = page.locator(selector);
		return (await element.count()) > 0;
	} catch {
		return false;
	}
}

/**
 * Wait for element to appear with timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
	await page.locator(selector).first().waitFor({ timeout });
}

/**
 * Safe click with retry logic
 */
export async function safeClick(page: Page, selector: string, retries = 3) {
	for (let i = 0; i < retries; i++) {
		try {
			await page.locator(selector).first().click();
			return;
		} catch (error) {
			if (i === retries - 1) throw error;
			await page.waitForTimeout(1000);
		}
	}
}

/**
 * Upload a file by creating a test file
 */
export async function uploadTestFile(page: Page, filename: string, content = 'test-content') {
	// Create a simple test file
	const buffer = Buffer.from(content, 'utf8');

	// Find file input (may be hidden)
	const fileInput = page.locator('input[type="file"]').first();

	await fileInput.setInputFiles({
		name: filename,
		mimeType: filename.endsWith('.png')
			? 'image/png'
			: filename.endsWith('.jpg')
				? 'image/jpeg'
				: 'image/png',
		buffer
	});
}

/**
 * Wait for processing to complete
 */
export async function waitForProcessing(page: Page, maxWait = 30000) {
	const startTime = Date.now();

	while (Date.now() - startTime < maxWait) {
		// Check for completion indicators
		const isComplete = await page.evaluate(() => {
			// Look for various completion indicators
			const completedText = document.body.textContent?.toLowerCase() || '';
			return (
				completedText.includes('completed') ||
				completedText.includes('finished') ||
				completedText.includes('done')
			);
		});

		if (isComplete) return;

		// Check if still processing
		const isProcessing = await page.evaluate(() => {
			const processingText = document.body.textContent?.toLowerCase() || '';
			return (
				processingText.includes('processing') ||
				processingText.includes('loading') ||
				processingText.includes('converting')
			);
		});

		if (!isProcessing) return; // Assume done if no processing indicator

		await page.waitForTimeout(500);
	}

	throw new Error(`Processing did not complete within ${maxWait}ms`);
}

/**
 * Basic converter page class
 */
export class SimpleConverterPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/converter');
		await waitForPageReady(this.page);
	}

	async hasUploadArea(): Promise<boolean> {
		return elementExists(this.page, '[class*="upload"], [class*="drop"], input[type="file"]');
	}

	async hasConvertButton(): Promise<boolean> {
		// Look for various possible convert/process button patterns
		const selectors = [
			'button:has-text("Convert")',
			'button:has-text("Process")',
			'button:has-text("Start")',
			'button:has-text("Generate")',
			'[data-testid*="convert"]',
			'[data-testid*="process"]',
			'button[type="submit"]'
		];

		for (const selector of selectors) {
			if (await elementExists(this.page, selector)) {
				return true;
			}
		}

		return false;
	}

	async uploadSimpleFile() {
		if (await elementExists(this.page, 'input[type="file"]')) {
			await uploadTestFile(this.page, 'test.png');
		}
	}

	async clickConvert() {
		const convertBtn = this.page.getByRole('button', { name: /convert|process/i });
		if ((await convertBtn.count()) > 0) {
			await convertBtn.first().click();
		}
	}
}

/**
 * Setup error tracking for a page
 */
export function setupErrorTracking(page: Page) {
	const errors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});

	page.on('pageerror', (error) => {
		errors.push(`Page error: ${error.message}`);
	});

	return errors;
}
