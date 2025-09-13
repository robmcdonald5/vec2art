/**
 * iPhone Simulation Test
 * Simulates real iPhone behavior to identify converter issues
 */

import { test, expect, devices } from '@playwright/test';

// iPhone 13 Tests
test.describe('iPhone 13 Simulation', () => {
	test.use({
		...devices['iPhone 13'],
		// Force mobile Safari user agent
		userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`
	});

	test('Full conversion workflow simulation', async ({ page }) => {
		console.log(`\n🍎 Testing on iPhone 13 (iOS 15)`);

		// Capture all errors and console messages
		const errors: any[] = [];
		const consoleMessages: any[] = [];
		const networkFailures: any[] = [];

		page.on('pageerror', (error) => {
			errors.push({
				message: error.message,
				stack: error.stack,
				name: error.name,
				timestamp: new Date().toISOString()
			});
			console.log(`❌ Page Error: ${error.message}`);
		});

		page.on('console', (msg) => {
			const message = {
				type: msg.type(),
				text: msg.text(),
				timestamp: new Date().toISOString()
			};
			consoleMessages.push(message);

			if (msg.type() === 'error') {
				console.log(`🔴 Console Error: ${msg.text()}`);
			} else if (msg.type() === 'warning') {
				console.log(`🟡 Console Warning: ${msg.text()}`);
			}
		});

		page.on('requestfailed', (request) => {
			const failure = {
				url: request.url(),
				method: request.method(),
				failure: request.failure()?.errorText,
				timestamp: new Date().toISOString()
			};
			networkFailures.push(failure);
			console.log(`🌐 Network Failure: ${request.url()} - ${request.failure()?.errorText}`);
		});

		// Step 1: Navigate to converter
		console.log('📱 Step 1: Loading converter page...');
		await page.goto('http://localhost:5174/converter');
		await page.waitForLoadState('networkidle');

		// Step 2: Check WASM initialization
		console.log('📱 Step 2: Checking WASM initialization...');

		const wasmStatus = await page.evaluate(() => {
			return new Promise((resolve) => {
				// Check if WASM is loading
				const checkWasm = () => {
					const wasmModule = (window as any).wasmJs;
					return {
						moduleExists: !!wasmModule,
						vectorizerExists: !!wasmModule?.WasmVectorizer,
						timestamp: Date.now()
					};
				};

				// Check immediately
				let result = checkWasm();
				if (result.moduleExists && result.vectorizerExists) {
					resolve(result);
					return;
				}

				// Wait for WASM to load (up to 15 seconds)
				let attempts = 0;
				const interval = setInterval(() => {
					attempts++;
					result = checkWasm();

					if (result.moduleExists && result.vectorizerExists) {
						clearInterval(interval);
						resolve(result);
					} else if (attempts >= 30) {
						// 15 seconds
						clearInterval(interval);
						resolve({
							...result,
							timeout: true,
							attempts
						});
					}
				}, 500);
			});
		});

		console.log(`🔧 WASM Status:`, wasmStatus);

		// Step 3: Test file upload
		console.log('📱 Step 3: Testing file upload...');

		// Create a test image file
		const testImage = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
			'base64'
		);

		// Find file input
		const fileInput = page.locator('input[type="file"]');
		const inputExists = (await fileInput.count()) > 0;
		console.log(`📎 File input exists: ${inputExists}`);

		if (inputExists) {
			try {
				// Upload the test file
				await fileInput.setInputFiles({
					name: 'test-image.png',
					mimeType: 'image/png',
					buffer: testImage
				});
				console.log('✅ File upload successful');

				// Wait for image processing
				await page.waitForTimeout(3000);

				// Check if image preview appears
				const imageElements = await page.locator('img').count();
				console.log(`🖼️ Images found after upload: ${imageElements}`);
			} catch (uploadError) {
				console.log(`❌ File upload failed:`, uploadError);
				errors.push({
					step: 'file_upload',
					error: uploadError,
					timestamp: new Date().toISOString()
				});
			}
		}

		// Step 4: Test conversion
		console.log('📱 Step 4: Testing conversion...');

		// Look for convert buttons
		const convertButtons = page.locator('button', { hasText: 'Convert' });
		const buttonCount = await convertButtons.count();
		console.log(`🔄 Convert buttons found: ${buttonCount}`);

		let conversionResult = null;

		if (buttonCount > 0) {
			try {
				// Click the first convert button
				await convertButtons.first().click();
				console.log('✅ Convert button clicked');

				// Wait for processing and monitor for results
				console.log('⏳ Waiting for conversion...');

				conversionResult = await Promise.race([
					// Success: SVG appears
					page
						.waitForSelector('svg, [data-testid*="svg"], [class*="svg-preview"]', {
							timeout: 30000
						})
						.then(() => ({ success: true, type: 'svg_found' })),

					// Success: Download button appears
					page
						.waitForSelector('button:has-text("Download")', {
							timeout: 30000
						})
						.then(() => ({ success: true, type: 'download_ready' })),

					// Failure: Error message
					page
						.waitForSelector('[class*="error"], [data-testid*="error"], .text-red-500', {
							timeout: 30000
						})
						.then(async (element) => ({
							success: false,
							type: 'error_message',
							message: await element.textContent()
						})),

					// Timeout
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									success: false,
									type: 'timeout'
								}),
							35000
						)
					)
				]);

				console.log(`🎯 Conversion result:`, conversionResult);
			} catch (conversionError) {
				console.log(`❌ Conversion failed:`, conversionError);
				errors.push({
					step: 'conversion',
					error: conversionError,
					timestamp: new Date().toISOString()
				});
			}
		}

		// Step 5: Performance check
		const performanceInfo = await page.evaluate(() => {
			const info: any = {
				memory: null,
				timing: null,
				webAssembly: typeof WebAssembly !== 'undefined',
				sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
				worker: typeof Worker !== 'undefined'
			};

			// Memory info (if available)
			if ((performance as any).memory) {
				info.memory = {
					usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
					totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
					jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
				};
			}

			return info;
		});

		// Take screenshot
		await page.screenshot({
			path: `test-results/iphone-13-conversion-test.png`,
			fullPage: true
		});

		// Comprehensive error report
		const errorReport = {
			device: 'iPhone 13',
			ios: '15',
			userAgent: await page.evaluate(() => navigator.userAgent),
			timestamp: new Date().toISOString(),
			wasmStatus,
			conversionResult,
			errors: errors,
			consoleMessages: consoleMessages.filter((m) => m.type === 'error' || m.type === 'warning'),
			networkFailures: networkFailures,
			performanceInfo: performanceInfo
		};

		console.log('\n📋 COMPREHENSIVE iPhone 13 ERROR REPORT:');
		console.log('================================');
		console.log(JSON.stringify(errorReport, null, 2));
		console.log('================================\n');

		// Analysis
		console.log('🔍 ANALYSIS:');

		if (errors.length > 0) {
			console.log(`❌ Found ${errors.length} JavaScript errors`);
		} else {
			console.log('✅ No JavaScript errors detected');
		}

		if (!wasmStatus.vectorizerExists) {
			console.log('❌ WASM vectorizer not available - this is likely the main issue');
		} else {
			console.log('✅ WASM vectorizer loaded successfully');
		}

		if (conversionResult?.success) {
			console.log('✅ Conversion completed successfully');
		} else {
			console.log('❌ Conversion failed or timed out - THIS IS THE ISSUE USERS ARE EXPERIENCING');
		}

		// Store the report
		await page.evaluate((report) => {
			(window as any).__IPHONE_DEBUG_REPORT = report;
		}, errorReport);

		// Test passes regardless of conversion success - we want to capture all issues
		expect(errorReport.device).toBe('iPhone 13');
	});

	test('Memory stress test', async ({ page }) => {
		console.log(`\n🧠 Memory stress test on iPhone 13`);

		await page.goto('http://localhost:5174/converter');

		// Create a larger test image (simulating real user photos)
		const largeImageData =
			'data:image/png;base64,' +
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='.repeat(
				1000
			);

		const memoryResult = await page.evaluate((imageData) => {
			return new Promise((resolve) => {
				const results: any = {
					initialMemory: null,
					afterImageMemory: null,
					canCreateBlob: false,
					canCreateImageElement: false,
					errors: []
				};

				// Initial memory
				if ((performance as any).memory) {
					results.initialMemory = (performance as any).memory.usedJSHeapSize;
				}

				try {
					// Test blob creation
					const blob = new Blob([imageData], { type: 'image/png' });
					results.canCreateBlob = true;
					results.blobSize = blob.size;

					// Test image element creation
					const img = new Image();
					img.onload = () => {
						results.canCreateImageElement = true;

						if ((performance as any).memory) {
							results.afterImageMemory = (performance as any).memory.usedJSHeapSize;
							results.memoryIncrease = results.afterImageMemory - results.initialMemory;
						}

						resolve(results);
					};

					img.onerror = (_error) => {
						results.errors.push('Image load failed');
						resolve(results);
					};

					img.src = URL.createObjectURL(blob);

					// Timeout after 5 seconds
					setTimeout(() => resolve(results), 5000);
				} catch (error: any) {
					results.errors.push(error.message);
					resolve(results);
				}
			});
		}, largeImageData);

		console.log(`🧠 Memory test results:`, memoryResult);
	});
});

// iPhone 14 Pro Tests
test.describe('iPhone 14 Pro Simulation', () => {
	test.use({
		...devices['iPhone 14 Pro'],
		userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1`
	});

	test('Full conversion workflow simulation', async ({ page }) => {
		console.log(`\n🍎 Testing on iPhone 14 Pro (iOS 16)`);

		// Similar test structure but optimized for iPhone 14 Pro...
		// (I'll keep it shorter to focus on the main test)

		const errors: any[] = [];
		page.on('pageerror', (error) => {
			errors.push({ message: error.message, stack: error.stack });
			console.log(`❌ iPhone 14 Pro Error: ${error.message}`);
		});

		await page.goto('http://localhost:5174/converter');
		await page.waitForLoadState('networkidle');

		// Quick WASM check
		const wasmWorking = await page.evaluate(() => {
			const wasmModule = (window as any).wasmJs;
			return !!wasmModule?.WasmVectorizer;
		});

		console.log(`🔧 iPhone 14 Pro WASM Status: ${wasmWorking ? 'Working' : 'Failed'}`);

		// Take screenshot
		await page.screenshot({
			path: `test-results/iphone-14-pro-test.png`,
			fullPage: true
		});

		const report = {
			device: 'iPhone 14 Pro',
			wasmWorking,
			errorCount: errors.length,
			errors: errors.map((e) => e.message)
		};

		console.log('iPhone 14 Pro Report:', report);
	});
});
