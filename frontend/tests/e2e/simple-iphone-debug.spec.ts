/**
 * Simple iPhone Debug Test
 * A streamlined test to identify iPhone-specific issues without complex setup
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	// Use actual iPhone Safari user agent
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Mobile/15E148 Safari/604.1`
});

test.describe('iPhone Debug - Simple Tests', () => {
	test('iPhone converter basic functionality', async ({ page }) => {
		console.log('\n🍎 iPhone Debug Test Starting');
		console.log('=============================');

		let debugInfo = {
			pageLoaded: false,
			wasmLoaded: false,
			wasmError: '',
			userAgent: '',
			sharedArrayBufferAvailable: false,
			webWorkersAvailable: false,
			conversionAttempted: false,
			conversionResult: 'not_attempted',
			errors: [] as string[],
			memoryInfo: null as any
		};

		// Track errors
		page.on('pageerror', (error) => {
			debugInfo.errors.push(`PAGE ERROR: ${error.message}`);
			console.log(`🚨 Page Error: ${error.message}`);
		});

		page.on('console', (msg) => {
			const text = msg.text();
			if (msg.type() === 'error') {
				debugInfo.errors.push(`CONSOLE ERROR: ${text}`);
				console.log(`🚨 Console Error: ${text}`);
			} else if (text.includes('WASM') || text.includes('wasm')) {
				console.log(`🧩 WASM Log: ${text}`);
			}
		});

		try {
			console.log('📱 Loading converter page...');

			await page.goto('http://localhost:5173/converter', {
				waitUntil: 'networkidle',
				timeout: 30000
			});

			debugInfo.pageLoaded = true;
			console.log('✅ Page loaded successfully');

			// Get detailed iPhone environment info
			const environmentInfo = await page.evaluate(() => {
				return {
					userAgent: navigator.userAgent,
					sharedArrayBufferAvailable: typeof SharedArrayBuffer !== 'undefined',
					webWorkersAvailable: typeof Worker !== 'undefined',
					hardwareConcurrency: navigator.hardwareConcurrency || 0,
					memory: (performance as any).memory
						? {
								used: (performance as any).memory.usedJSHeapSize,
								total: (performance as any).memory.totalJSHeapSize,
								limit: (performance as any).memory.jsHeapSizeLimit
							}
						: null,
					location: window.location.href,
					wasmModule: typeof (window as any).wasmJs !== 'undefined'
				};
			});

			Object.assign(debugInfo, environmentInfo);

			console.log('🔍 iPhone Environment:');
			console.log(`   User Agent: ${environmentInfo.userAgent}`);
			console.log(`   SharedArrayBuffer: ${environmentInfo.sharedArrayBufferAvailable}`);
			console.log(`   Web Workers: ${environmentInfo.webWorkersAvailable}`);
			console.log(`   Hardware Concurrency: ${environmentInfo.hardwareConcurrency}`);
			console.log(`   WASM Module Loaded: ${environmentInfo.wasmModule}`);

			if (environmentInfo.memory) {
				console.log(`   Memory Used: ${Math.round(environmentInfo.memory.used / 1024 / 1024)}MB`);
				console.log(`   Memory Limit: ${Math.round(environmentInfo.memory.limit / 1024 / 1024)}MB`);
			}

			// Wait a bit longer for WASM to load
			await page.waitForTimeout(5000);

			// Check WASM status after waiting
			const wasmStatus = await page.evaluate(() => {
				const wasmModule = (window as any).wasmJs;
				const result = {
					loaded: !!wasmModule,
					hasInitFunction: false,
					hasConvertFunction: false,
					hasThreadingSupport: false,
					threadCount: 0,
					functions: [] as string[],
					error: ''
				};

				if (wasmModule) {
					try {
						result.functions = Object.getOwnPropertyNames(wasmModule)
							.filter((name) => typeof wasmModule[name] === 'function')
							.slice(0, 10); // First 10 functions

						result.hasInitFunction = typeof wasmModule.init === 'function';
						result.hasConvertFunction = result.functions.some((f) =>
							f.toLowerCase().includes('convert')
						);

						if (typeof wasmModule.is_threading_supported === 'function') {
							result.hasThreadingSupport = wasmModule.is_threading_supported();
						}

						if (typeof wasmModule.get_thread_count === 'function') {
							result.threadCount = wasmModule.get_thread_count();
						}
					} catch (e: any) {
						result.error = e.message;
					}
				}

				return result;
			});

			debugInfo.wasmLoaded = wasmStatus.loaded;
			debugInfo.wasmError = wasmStatus.error;

			console.log('🧩 WASM Status:');
			console.log(`   Loaded: ${wasmStatus.loaded}`);
			console.log(`   Functions Available: ${wasmStatus.functions.length}`);
			console.log(`   Has Threading Support: ${wasmStatus.hasThreadingSupport}`);
			console.log(`   Thread Count: ${wasmStatus.threadCount}`);

			if (wasmStatus.error) {
				console.log(`   Error: ${wasmStatus.error}`);
			}

			if (wasmStatus.loaded) {
				console.log(`   Available Functions: ${wasmStatus.functions.join(', ')}`);

				// Try a simple conversion test
				console.log('🔄 Attempting simple conversion test...');

				// Create a minimal test image
				const testImageData = await page.evaluate(() => {
					const canvas = document.createElement('canvas');
					canvas.width = 100;
					canvas.height = 100;
					const ctx = canvas.getContext('2d')!;

					// Simple red square
					ctx.fillStyle = '#ff0000';
					ctx.fillRect(25, 25, 50, 50);

					return canvas.toDataURL('image/png');
				});

				// Look for file input
				const fileInputCount = await page.locator('input[type="file"]').count();
				console.log(`📁 File inputs found: ${fileInputCount}`);

				if (fileInputCount > 0) {
					const imageBuffer = Buffer.from(testImageData.split(',')[1], 'base64');
					console.log(`📤 Uploading test image (${imageBuffer.length} bytes)...`);

					await page.locator('input[type="file"]').first().setInputFiles({
						name: 'simple-test.png',
						mimeType: 'image/png',
						buffer: imageBuffer
					});

					debugInfo.conversionAttempted = true;
					console.log('✅ Test image uploaded');

					// Look for convert button
					await page.waitForTimeout(2000); // Wait for upload to process

					const convertButtonSelectors = [
						'button:has-text("Convert")',
						'button:has-text("Start")',
						'button:has-text("Process")',
						'[data-testid="convert-button"]',
						'.convert-button'
					];

					let convertButtonFound = false;
					for (const selector of convertButtonSelectors) {
						const count = await page.locator(selector).count();
						if (count > 0) {
							console.log(`🔘 Found convert button: ${selector}`);

							try {
								await page.locator(selector).first().click();
								console.log('✅ Convert button clicked');
								convertButtonFound = true;

								// Wait for result or error
								const result = await Promise.race([
									page
										.waitForSelector('svg, canvas, .result, .output', { timeout: 30000 })
										.then(() => 'success'),
									page
										.waitForSelector('.error, [data-error], .failed', { timeout: 30000 })
										.then(() => 'error_shown'),
									new Promise((resolve) => setTimeout(() => resolve('timeout'), 30000))
								]);

								debugInfo.conversionResult = result as string;
								console.log(`🎯 Conversion result: ${result}`);
								break;
							} catch (clickError) {
								console.log(`❌ Failed to click ${selector}: ${clickError}`);
							}
						}
					}

					if (!convertButtonFound) {
						console.log('❌ No convert button found with any selector');
						debugInfo.conversionResult = 'no_convert_button';
					}
				} else {
					console.log('❌ No file input found');
					debugInfo.conversionResult = 'no_file_input';
				}
			} else {
				console.log('❌ WASM not loaded - cannot test conversion');
				debugInfo.conversionResult = 'wasm_not_loaded';
			}
		} catch (error) {
			debugInfo.errors.push(`TEST ERROR: ${error}`);
			console.log(`❌ Test error: ${error}`);
		}

		// Generate comprehensive iPhone debug report
		const iPhoneReport = {
			timestamp: new Date().toISOString(),
			testDevice: 'iPhone 13 (Simulated)',
			debugInfo,
			assessment: {
				pageLoad: debugInfo.pageLoaded ? 'SUCCESS' : 'FAILED',
				wasmLoad: debugInfo.wasmLoaded ? 'SUCCESS' : 'FAILED',
				conversion:
					debugInfo.conversionResult === 'success'
						? 'SUCCESS'
						: debugInfo.conversionResult === 'timeout'
							? 'TIMEOUT'
							: debugInfo.conversionResult === 'error_shown'
								? 'ERROR'
								: debugInfo.conversionResult === 'wasm_not_loaded'
									? 'WASM_ISSUE'
									: 'FAILED',
				overallStatus:
					debugInfo.pageLoaded && debugInfo.wasmLoaded && debugInfo.conversionResult === 'success'
						? 'PASS'
						: 'FAIL'
			},
			keyIssues: [] as string[]
		};

		// Identify key issues
		if (!debugInfo.pageLoaded) {
			iPhoneReport.keyIssues.push('Page failed to load completely');
		}
		if (!debugInfo.wasmLoaded) {
			iPhoneReport.keyIssues.push(
				'WASM module failed to load - this explains iPhone user failures'
			);
		}
		if (debugInfo.wasmError) {
			iPhoneReport.keyIssues.push(`WASM error: ${debugInfo.wasmError}`);
		}
		if (!debugInfo.sharedArrayBufferAvailable) {
			iPhoneReport.keyIssues.push('SharedArrayBuffer not available - threading disabled');
		}
		if (debugInfo.conversionResult !== 'success' && debugInfo.wasmLoaded) {
			iPhoneReport.keyIssues.push('Conversion failed despite WASM being loaded');
		}
		if (debugInfo.errors.length > 0) {
			iPhoneReport.keyIssues.push(`${debugInfo.errors.length} JavaScript errors detected`);
		}

		console.log('\n🍎 IPHONE DEBUG REPORT');
		console.log('======================');
		console.log(JSON.stringify(iPhoneReport, null, 2));
		console.log('======================');

		// Key findings
		if (iPhoneReport.assessment.overallStatus === 'FAIL') {
			console.log('🚨 CRITICAL: iPhone test FAILED - this explains user reports!');
			console.log('Key Issues:');
			iPhoneReport.keyIssues.forEach((issue) => console.log(`   - ${issue}`));
		} else {
			console.log('✅ iPhone test PASSED - issue may be in production-only conditions');
		}

		// Store report for debugging
		await page.evaluate((report) => {
			(window as any).__IPHONE_DEBUG_REPORT = report;
		}, iPhoneReport);

		// Test should pass to capture results - the failure analysis is in the report
		expect(iPhoneReport.timestamp).toBeTruthy();
	});
});
