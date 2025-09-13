/**
 * Safari File Upload Test
 * Focused test to identify file upload issues on Safari/iOS
 */

import { test } from '@playwright/test';

test.describe('Safari File Upload Debug', () => {
	test('Check file input behavior', async ({ page, browserName }) => {
		console.log(`Testing on browser: ${browserName}`);

		// Go to converter page
		await page.goto('/converter');
		await page.waitForLoadState('networkidle');

		// Log page content
		const pageTitle = await page.title();
		console.log('Page title:', pageTitle);

		// Check if file input exists
		const fileInputs = await page.locator('input[type="file"]').all();
		console.log(`Found ${fileInputs.length} file input(s)`);

		if (fileInputs.length === 0) {
			throw new Error('No file input found on page');
		}

		// Get file input attributes
		const fileInput = fileInputs[0];
		const inputId = await fileInput.getAttribute('id');
		const inputName = await fileInput.getAttribute('name');
		const inputAccept = await fileInput.getAttribute('accept');
		const isVisible = await fileInput.isVisible();
		const isEnabled = await fileInput.isEnabled();

		console.log('File input details:', {
			id: inputId,
			name: inputName,
			accept: inputAccept,
			visible: isVisible,
			enabled: isEnabled
		});

		// Check if there's a label or button that triggers the file input
		const uploadTriggers = await page
			.locator(
				'button:has-text("Upload"), label:has-text("Upload"), button:has-text("Select"), label:has-text("Select"), button:has-text("Choose"), label:has-text("Choose")'
			)
			.all();
		console.log(`Found ${uploadTriggers.length} upload trigger(s)`);

		// Look for drop zone
		const dropZones = await page
			.locator('[data-testid*="drop"], [class*="drop"], [id*="drop"]')
			.all();
		console.log(`Found ${dropZones.length} drop zone(s)`);

		// Try to upload a file using different methods
		console.log('\n--- Testing file upload methods ---');

		// Method 1: Direct file input
		try {
			console.log('Method 1: Setting file directly on input...');
			// Create a simple test file
			const buffer = Buffer.from('test image data');
			await fileInput.setInputFiles({
				name: 'test.jpg',
				mimeType: 'image/jpeg',
				buffer
			});
			console.log('✓ File set successfully');

			// Wait a bit to see if anything happens
			await page.waitForTimeout(2000);

			// Check if image preview appears
			const imagePreviews = await page
				.locator(
					'img[src*="blob:"], img[src*="data:"], canvas, [data-testid*="preview"], [class*="preview"]'
				)
				.all();
			console.log(`Found ${imagePreviews.length} image preview(s) after upload`);

			if (imagePreviews.length > 0) {
				console.log('✓ Image preview detected');
			} else {
				console.log('✗ No image preview found');
			}
		} catch (error) {
			console.error('Method 1 failed:', error);
		}

		// Method 2: Click upload button then set file
		if (uploadTriggers.length > 0) {
			try {
				console.log('\nMethod 2: Clicking upload trigger...');
				await uploadTriggers[0].click();
				await page.waitForTimeout(500);

				// File dialog might open, set file on input
				const buffer = Buffer.from('test image data 2');
				await fileInput.setInputFiles({
					name: 'test2.jpg',
					mimeType: 'image/jpeg',
					buffer
				});
				console.log('✓ File set after trigger click');
			} catch (error) {
				console.error('Method 2 failed:', error);
			}
		}

		// Check final state
		console.log('\n--- Final state check ---');
		const allImages = await page.locator('img').all();
		console.log(`Total images on page: ${allImages.length}`);

		// Check for error messages
		const errorMessages = await page
			.locator('[class*="error"], [data-testid*="error"], .text-red-500, .text-ferrari-500')
			.all();
		console.log(`Error messages found: ${errorMessages.length}`);

		for (const error of errorMessages) {
			const text = await error.textContent();
			if (text && text.trim()) {
				console.log(`Error text: "${text.trim()}"`);
			}
		}

		// Check console for errors
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				console.log('Console error:', msg.text());
			}
		});

		// Take a screenshot for debugging
		await page.screenshot({
			path: `test-results/safari-file-upload-${Date.now()}.png`,
			fullPage: true
		});
		console.log('Screenshot saved');
	});

	test('Test file reading with FileReader', async ({ page, browserName }) => {
		console.log(`\n=== FileReader Test on ${browserName} ===`);

		await page.goto('/converter');

		// Inject FileReader test
		const fileReaderTest = await page.evaluate(() => {
			return new Promise((resolve) => {
				const results: any = {
					fileReaderSupported: typeof FileReader !== 'undefined',
					blobSupported: typeof Blob !== 'undefined',
					fileSupported: typeof File !== 'undefined',
					tests: []
				};

				if (!results.fileReaderSupported) {
					resolve(results);
					return;
				}

				// Test 1: Read a simple Blob
				try {
					const blob = new Blob(['test data'], { type: 'text/plain' });
					const reader = new FileReader();

					reader.onload = () => {
						results.tests.push({
							name: 'Blob reading',
							success: true,
							result: reader.result
						});
					};

					reader.onerror = () => {
						results.tests.push({
							name: 'Blob reading',
							success: false,
							error: reader.error?.message
						});
					};

					reader.readAsDataURL(blob);
				} catch (error: any) {
					results.tests.push({
						name: 'Blob reading',
						success: false,
						error: error.message
					});
				}

				// Test 2: Create and read a File
				try {
					const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
					const reader = new FileReader();

					reader.onload = () => {
						results.tests.push({
							name: 'File reading',
							success: true,
							size: file.size,
							type: file.type
						});
						resolve(results);
					};

					reader.onerror = () => {
						results.tests.push({
							name: 'File reading',
							success: false,
							error: reader.error?.message
						});
						resolve(results);
					};

					reader.readAsDataURL(file);
				} catch (error: any) {
					results.tests.push({
						name: 'File reading',
						success: false,
						error: error.message
					});
					resolve(results);
				}

				// Timeout fallback
				setTimeout(() => resolve(results), 2000);
			});
		});

		console.log('FileReader test results:', JSON.stringify(fileReaderTest, null, 2));
	});

	test('Check for Safari-specific file handling issues', async ({ page, browserName }) => {
		console.log(`\n=== Safari-Specific Checks on ${browserName} ===`);

		await page.goto('/converter');

		// Check Safari-specific behaviors
		const safariChecks = await page.evaluate(() => {
			const ua = navigator.userAgent;
			const results: any = {
				userAgent: ua,
				isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
				isWebKit: /WebKit/.test(ua),
				fileAPIs: {
					File: typeof File !== 'undefined',
					FileReader: typeof FileReader !== 'undefined',
					FileList: typeof FileList !== 'undefined',
					Blob: typeof Blob !== 'undefined',
					URL_createObjectURL: typeof URL.createObjectURL === 'function',
					URL_revokeObjectURL: typeof URL.revokeObjectURL === 'function'
				},
				inputElement: null as any
			};

			// Check file input element
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			if (fileInput) {
				results.inputElement = {
					exists: true,
					accept: fileInput.accept,
					multiple: fileInput.multiple,
					disabled: fileInput.disabled,
					style: {
						display: window.getComputedStyle(fileInput).display,
						visibility: window.getComputedStyle(fileInput).visibility,
						opacity: window.getComputedStyle(fileInput).opacity
					}
				};
			}

			return results;
		});

		console.log('Safari checks:', JSON.stringify(safariChecks, null, 2));

		// Test if file input change event fires
		console.log('\n--- Testing file input change event ---');
		const eventFired = await page.evaluate(() => {
			return new Promise((resolve) => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				if (!input) {
					resolve({ error: 'No file input found' });
					return;
				}

				let eventFired = false;
				const events: string[] = [];

				// Listen for various events
				['change', 'input', 'click', 'focus', 'blur'].forEach((eventName) => {
					input.addEventListener(eventName, () => {
						events.push(eventName);
						if (eventName === 'change') eventFired = true;
					});
				});

				// Simulate user interaction
				setTimeout(() => {
					resolve({
						eventFired,
						events,
						inputValue: input.value,
						inputFiles: input.files?.length || 0
					});
				}, 1000);
			});
		});

		console.log('Event test results:', eventFired);
	});
});
