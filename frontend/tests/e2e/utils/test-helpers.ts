/**
 * E2E Test Helper Utilities
 * Common functions for Playwright E2E tests
 */

import { Page, Locator, expect } from '@playwright/test';
import {
	TEST_IMAGES,
	INVALID_FILES,
	TestImageFixture,
	getExpectedProcessingTime
} from '../fixtures/test-data';
import path from 'path';

/**
 * Page object model for converter page
 */
export class ConverterPage {
	readonly page: Page;
	readonly fileDropzone: Locator;
	readonly fileInput: Locator;
	readonly performanceSelector: Locator;
	readonly algorithmRadios: Locator;
	readonly convertButton: Locator;
	readonly downloadButton: Locator;
	readonly previewArea: Locator;
	readonly progressBar: Locator;
	readonly errorMessage: Locator;
	readonly processingStatus: Locator;

	constructor(page: Page) {
		this.page = page;
		this.fileDropzone = page.getByTestId('file-dropzone');
		this.fileInput = page.getByTestId('file-input');
		this.performanceSelector = page.getByTestId('performance-selector');
		this.algorithmRadios = page.getByRole('radio', { name: /algorithm/ });
		this.convertButton = page.getByRole('button', { name: /convert to svg/i });
		this.downloadButton = page.getByRole('button', { name: /download svg/i });
		this.previewArea = page.getByTestId('preview-area');
		this.progressBar = page.getByTestId('progress-bar');
		this.errorMessage = page.getByTestId('error-message');
		this.processingStatus = page.getByRole('status', { name: /processing/i });
	}

	async goto() {
		await this.page.goto('/converter');
		await this.page.waitForLoadState('networkidle');
	}

	async waitForWasmLoad() {
		// Wait for WASM module to load
		await this.page.waitForFunction(
			() => {
				return window.wasmModule !== undefined;
			},
			{ timeout: 30000 }
		);
	}

	async initializeThreads(threadCount: number = 4) {
		// Click performance selector if not already initialized
		const isInitialized = await this.page.evaluate(() => {
			return window.wasmThreadsInitialized === true;
		});

		if (!isInitialized) {
			await this.performanceSelector.click();
			await this.page.selectOption('[data-testid="thread-count"]', threadCount.toString());
			await this.page.click('[data-testid="initialize-threads"]');

			// Wait for initialization to complete
			await this.page.waitForFunction(
				() => {
					return window.wasmThreadsInitialized === true;
				},
				{ timeout: 30000 }
			);
		}
	}

	async uploadFile(fixtureName: string) {
		const fixture = TEST_IMAGES.find((img) => img.name === fixtureName);
		if (!fixture) {
			throw new Error(`Test fixture not found: ${fixtureName}`);
		}

		const filePath = path.join(process.cwd(), fixture.path);
		await this.fileInput.setInputFiles(filePath);

		// Wait for file to be processed
		await expect(this.previewArea).toContainText('Original image');
	}

	async uploadInvalidFile(fileName: string) {
		const invalidFile = INVALID_FILES.find((file) => file.name === fileName);
		if (!invalidFile) {
			throw new Error(`Invalid file not found: ${fileName}`);
		}

		const filePath = path.join(process.cwd(), invalidFile.path);
		await this.fileInput.setInputFiles(filePath);
	}

	async selectAlgorithm(algorithm: string) {
		await this.page.check(`input[name="algorithm"][value="${algorithm}"]`);
	}

	async setDetailLevel(level: number) {
		await this.page.fill('[data-testid="detail-level"]', level.toString());
	}

	/** @deprecated Use setArtisticEffect with specific effect names */
	async setSmoothness(smoothness: number) {
		console.warn('setSmoothness is deprecated. Use setArtisticEffect instead.');
		// Backward compatibility - convert old smoothness to new artistic effects
		await this.setArtisticEffect('variable_weights', smoothness * 0.1);
		await this.setArtisticEffect('tremor_strength', smoothness * 0.05);
		await this.setArtisticEffect('tapering', smoothness * 0.1);
	}

	/**
	 * Set individual artistic effect values
	 */
	async setArtisticEffect(
		effect: 'variable_weights' | 'tremor_strength' | 'tapering',
		value: number
	) {
		const slider = this.page.locator(`input[id="${effect}"]`);
		await expect(slider).toBeVisible();
		await slider.fill(value.toString());
	}

	/**
	 * Set hand-drawn style preset
	 */
	async setHandDrawnPreset(preset: 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy') {
		const select = this.page
			.locator('select, [role="combobox"]')
			.filter({ hasText: /hand.*drawn.*style/i })
			.first();
		await select.selectOption(preset);
	}

	async convertImage() {
		await this.convertButton.click();

		// Wait for processing to start
		await expect(this.processingStatus).toBeVisible();

		// Wait for processing to complete (with generous timeout)
		await expect(this.processingStatus).toBeHidden({ timeout: 60000 });
	}

	async downloadSVG(): Promise<void> {
		const downloadPromise = this.page.waitForEvent('download');
		await this.downloadButton.click();
		const download = await downloadPromise;

		// Verify download
		expect(download.suggestedFilename()).toMatch(/\.svg$/);
	}

	async getProcessingTime(): Promise<number> {
		const processingInfo = this.page.getByTestId('processing-info');
		const timeText = await processingInfo.textContent();
		const match = timeText?.match(/Processing time: (\d+)ms/);
		return match ? parseInt(match[1]) : 0;
	}

	async getThreadStatus(): Promise<{ initialized: boolean; count: number }> {
		return await this.page.evaluate(() => {
			return {
				initialized: window.wasmThreadsInitialized || false,
				count: window.wasmThreadCount || 0
			};
		});
	}
}

/**
 * Drag and drop helper
 */
export async function dragAndDropFile(page: Page, filePath: string, dropTarget: Locator) {
	const fileInput = page.locator('input[type="file"]');
	await fileInput.setInputFiles(filePath);
}

/**
 * Wait for WASM to be available
 */
export async function waitForWasmReady(page: Page, timeout: number = 30000) {
	await page.waitForFunction(
		() => {
			return typeof window.wasmModule !== 'undefined';
		},
		{ timeout }
	);
}

/**
 * Check cross-origin isolation
 */
export async function checkCrossOriginIsolation(page: Page): Promise<boolean> {
	return await page.evaluate(() => {
		return window.crossOriginIsolated === true;
	});
}

/**
 * Check SharedArrayBuffer availability
 */
export async function checkSharedArrayBuffer(page: Page): Promise<boolean> {
	return await page.evaluate(() => {
		return typeof SharedArrayBuffer !== 'undefined';
	});
}

/**
 * Monitor console errors
 */
export function setupConsoleErrorTracking(page: Page): string[] {
	const errors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});

	page.on('pageerror', (error) => {
		errors.push(error.message);
	});

	return errors;
}

/**
 * Wait for element with retry
 */
export async function waitForElementWithRetry(
	page: Page,
	selector: string,
	timeout: number = 5000,
	retries: number = 3
): Promise<Locator> {
	for (let i = 0; i < retries; i++) {
		try {
			const element = page.locator(selector);
			await element.waitFor({ timeout });
			return element;
		} catch (error) {
			if (i === retries - 1) throw error;
			await page.waitForTimeout(1000);
		}
	}
	throw new Error(`Element not found after ${retries} retries: ${selector}`);
}

/**
 * Check accessibility violations
 */
export async function checkAccessibility(page: Page) {
	// Check for basic accessibility requirements
	const violations = [];

	// Check for missing alt attributes on images
	const imagesWithoutAlt = await page.locator('img:not([alt])').count();
	if (imagesWithoutAlt > 0) {
		violations.push(`Found ${imagesWithoutAlt} images without alt attributes`);
	}

	// Check for missing labels on form controls
	const unlabeledInputs = await page
		.locator('input:not([aria-label]):not([aria-labelledby])')
		.count();
	if (unlabeledInputs > 0) {
		violations.push(`Found ${unlabeledInputs} form inputs without labels`);
	}

	// Check for missing headings structure
	const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
	if (headings === 0) {
		violations.push('No heading elements found on page');
	}

	return violations;
}

/**
 * Simulate keyboard navigation
 */
export async function navigateWithKeyboard(page: Page, steps: string[]) {
	for (const step of steps) {
		await page.keyboard.press(step);
		await page.waitForTimeout(100); // Small delay between steps
	}
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
	private page: Page;
	private metrics: any[] = [];

	constructor(page: Page) {
		this.page = page;
	}

	async startMonitoring() {
		// Start performance monitoring
		await this.page.addInitScript(() => {
			window.performanceMetrics = [];
			const observer = new PerformanceObserver((list) => {
				window.performanceMetrics.push(...list.getEntries());
			});
			observer.observe({ entryTypes: ['navigation', 'paint', 'measure'] });
		});
	}

	async getMetrics() {
		return await this.page.evaluate(() => window.performanceMetrics || []);
	}

	async getCoreWebVitals() {
		return await this.page.evaluate(() => {
			return new Promise((resolve) => {
				const vitals = {};

				// LCP (Largest Contentful Paint)
				new PerformanceObserver((list) => {
					const entries = list.getEntries();
					if (entries.length > 0) {
						vitals.lcp = entries[entries.length - 1].startTime;
					}
				}).observe({ type: 'largest-contentful-paint', buffered: true });

				// CLS (Cumulative Layout Shift)
				let clsValue = 0;
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (!entry.hadRecentInput) {
							clsValue += entry.value;
						}
					}
					vitals.cls = clsValue;
				}).observe({ type: 'layout-shift', buffered: true });

				// FCP (First Contentful Paint)
				new PerformanceObserver((list) => {
					const entries = list.getEntries();
					if (entries.length > 0) {
						vitals.fcp = entries[0].startTime;
					}
				}).observe({ type: 'paint', buffered: true });

				setTimeout(() => resolve(vitals), 3000);
			});
		});
	}
}

/**
 * Memory usage monitoring
 */
export async function getMemoryUsage(page: Page) {
	return await page.evaluate(() => {
		if ('memory' in performance) {
			return {
				usedJSHeapSize: performance.memory.usedJSHeapSize,
				totalJSHeapSize: performance.memory.totalJSHeapSize,
				jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
			};
		}
		return null;
	});
}

/**
 * Network request monitoring
 */
export function setupNetworkMonitoring(page: Page) {
	const requests: any[] = [];
	const responses: any[] = [];

	page.on('request', (request) => {
		requests.push({
			url: request.url(),
			method: request.method(),
			headers: request.headers(),
			timestamp: Date.now()
		});
	});

	page.on('response', (response) => {
		responses.push({
			url: response.url(),
			status: response.status(),
			headers: response.headers(),
			timestamp: Date.now()
		});
	});

	return { requests, responses };
}

/**
 * Test data selectors - standardized test IDs
 */
export const TEST_IDS = {
	fileDropzone: '[data-testid="file-dropzone"]',
	fileInput: '[data-testid="file-input"]',
	previewArea: '[data-testid="preview-area"]',
	convertButton: '[data-testid="convert-button"]',
	downloadButton: '[data-testid="download-button"]',
	progressBar: '[data-testid="progress-bar"]',
	errorMessage: '[data-testid="error-message"]',
	threadStatus: '[data-testid="thread-status"]',
	performanceSelector: '[data-testid="performance-selector"]',
	detailLevel: '[data-testid="detail-level"]',
	smoothness: '[data-testid="smoothness"]',
	processingInfo: '[data-testid="processing-info"]'
} as const;

/**
 * Re-export getExpectedProcessingTime from test-data
 */
export { getExpectedProcessingTime };
