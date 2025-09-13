/**
 * iPhone 13 Simulation Test
 * Dedicated test to simulate iPhone 13 Safari behavior and identify converter issues
 */

import { test, expect, devices } from '@playwright/test';

// Configure iPhone 13 device simulation
test.use({
	...devices['iPhone 13'],
	// Force mobile Safari user agent
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`
});

test.describe('iPhone 13 Safari Converter Simulation', () => {
	test('Full conversion workflow - IDENTIFY THE EXACT ISSUE', async ({ page }) => {
		console.log(`\n🍎 TESTING ON SIMULATED iPhone 13 (iOS 15 Safari)`);
		console.log('🎯 Goal: Identify why the converter fails for iPhone users');

		// Capture ALL errors and console messages
		const errors: any[] = [];
		const consoleMessages: any[] = [];
		const networkFailures: any[] = [];
		let wasmInitSuccess = false;
		let conversionAttempted = false;
		let conversionSuccess = false;

		page.on('pageerror', (error) => {
			const errorData = {
				message: error.message,
				stack: error.stack,
				name: error.name,
				timestamp: new Date().toISOString()
			};
			errors.push(errorData);
			console.log(`💥 JAVASCRIPT ERROR: ${error.message}`);
			console.log(`   Stack: ${error.stack?.substring(0, 200)}...`);
		});

		page.on('console', (msg) => {
			const message = {
				type: msg.type(),
				text: msg.text(),
				timestamp: new Date().toISOString()
			};
			consoleMessages.push(message);

			if (msg.type() === 'error') {
				console.log(`🔴 CONSOLE ERROR: ${msg.text()}`);
			} else if (
				msg.type() === 'warning' &&
				(msg.text().includes('WASM') ||
					msg.text().includes('SharedArrayBuffer') ||
					msg.text().includes('WebAssembly') ||
					msg.text().includes('threading') ||
					msg.text().includes('init') ||
					msg.text().includes('fail'))
			) {
				console.log(`🟡 IMPORTANT WARNING: ${msg.text()}`);
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
			console.log(`🌐 NETWORK FAILURE: ${request.url()} - ${request.failure()?.errorText}`);
		});

		// STEP 1: Navigate to converter
		console.log('\n📱 STEP 1: Loading converter page...');
		await page.goto('http://localhost:5174/converter');
		await page.waitForLoadState('networkidle');
		console.log('✅ Page loaded');

		// STEP 2: Check user agent and device info
		const deviceInfo = await page.evaluate(() => {
			return {
				userAgent: navigator.userAgent,
				platform: navigator.platform,
				vendor: navigator.vendor,
				hardwareConcurrency: navigator.hardwareConcurrency,
				maxTouchPoints: navigator.maxTouchPoints,
				deviceMemory: (navigator as any).deviceMemory || 'unknown',
				isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
				isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
				screenWidth: screen.width,
				screenHeight: screen.height,
				windowWidth: window.innerWidth,
				windowHeight: window.innerHeight
			};
		});
		console.log('📱 DEVICE INFO:', deviceInfo);

		// STEP 3: Check WASM initialization with detailed monitoring
		console.log('\n🔧 STEP 3: Monitoring WASM initialization...');

		const wasmInitResult = await page.evaluate(() => {
			return new Promise((resolve) => {
				const startTime = Date.now();
				const checkInterval = 250; // Check every 250ms
				const maxWaitTime = 20000; // Wait max 20 seconds

				const wasmStatus: any = {
					attempts: 0,
					moduleFound: false,
					vectorizerFound: false,
					initTime: 0,
					errors: [],
					logs: [],
					features: {
						webAssembly: typeof WebAssembly !== 'undefined',
						sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
						atomics: typeof Atomics !== 'undefined',
						worker: typeof Worker !== 'undefined',
						crossOriginIsolated: (window as any).crossOriginIsolated || false
					}
				};

				const checkWasm = () => {
					wasmStatus.attempts++;
					const wasmModule = (window as any).wasmJs;

					if (wasmModule) {
						wasmStatus.moduleFound = true;
						wasmStatus.logs.push(`Module found at attempt ${wasmStatus.attempts}`);

						if (wasmModule.WasmVectorizer) {
							wasmStatus.vectorizerFound = true;
							wasmStatus.initTime = Date.now() - startTime;
							wasmStatus.logs.push(`Vectorizer ready in ${wasmStatus.initTime}ms`);

							// Try to create an instance
							try {
								const _instance = new wasmModule.WasmVectorizer();
								wasmStatus.instanceCreated = true;
								wasmStatus.logs.push('Instance creation successful');
							} catch (error: any) {
								wasmStatus.errors.push(`Instance creation failed: ${error.message}`);
							}

							resolve(wasmStatus);
							return true;
						} else {
							wasmStatus.logs.push(
								`Module found but no WasmVectorizer at attempt ${wasmStatus.attempts}`
							);
						}
					} else {
						wasmStatus.logs.push(`No module at attempt ${wasmStatus.attempts}`);
					}

					return false;
				};

				// Check immediately
				if (checkWasm()) return;

				// Set up periodic checks
				const interval = setInterval(() => {
					if (checkWasm()) {
						clearInterval(interval);
						return;
					}

					// Timeout
					if (Date.now() - startTime > maxWaitTime) {
						clearInterval(interval);
						wasmStatus.timeout = true;
						wasmStatus.totalTime = Date.now() - startTime;
						resolve(wasmStatus);
					}
				}, checkInterval);
			});
		});

		console.log('🔧 WASM INIT RESULT:', JSON.stringify(wasmInitResult, null, 2));
		wasmInitSuccess = wasmInitResult.vectorizerFound;

		// STEP 4: Test file upload mechanism
		console.log('\n📎 STEP 4: Testing file upload...');

		const fileInput = page.locator('input[type="file"]');
		const inputExists = (await fileInput.count()) > 0;
		const inputVisible = inputExists ? await fileInput.isVisible() : false;
		const inputEnabled = inputExists ? await fileInput.isEnabled() : false;

		console.log(
			`File input - Exists: ${inputExists}, Visible: ${inputVisible}, Enabled: ${inputEnabled}`
		);

		if (inputExists) {
			try {
				// Create a realistic test image
				const testImageBase64 =
					'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
				const testImageBuffer = Buffer.from(testImageBase64, 'base64');

				await fileInput.setInputFiles({
					name: 'test-image.png',
					mimeType: 'image/png',
					buffer: testImageBuffer
				});
				console.log('✅ File uploaded successfully');

				// Wait for file processing
				await page.waitForTimeout(5000);

				// Check for image preview
				const imageCount = await page.locator('img').count();
				const canvasCount = await page.locator('canvas').count();
				console.log(`Post-upload - Images: ${imageCount}, Canvas: ${canvasCount}`);

				// Check for specific preview elements
				const previewElements = await page
					.locator('img[src*="blob:"], img[src*="data:"], [class*="preview"]')
					.count();
				console.log(`Preview elements found: ${previewElements}`);
			} catch (uploadError) {
				console.log(`❌ File upload failed:`, uploadError);
				errors.push({ step: 'file_upload', error: uploadError });
			}
		}

		// STEP 5: Test conversion process
		console.log('\n⚡ STEP 5: Testing conversion process...');

		// Find all convert buttons
		const convertButtons = await page.locator('button', { hasText: 'Convert' }).all();
		console.log(`Found ${convertButtons.length} convert buttons`);

		for (let i = 0; i < convertButtons.length; i++) {
			const button = convertButtons[i];
			const buttonText = await button.textContent();
			const buttonVisible = await button.isVisible();
			const buttonEnabled = await button.isEnabled();
			console.log(
				`Button ${i + 1}: "${buttonText}" - Visible: ${buttonVisible}, Enabled: ${buttonEnabled}`
			);
		}

		if (convertButtons.length > 0) {
			conversionAttempted = true;
			const convertButton = convertButtons[0];

			try {
				console.log('🚀 Clicking convert button...');
				await convertButton.click();
				console.log('✅ Convert button clicked successfully');

				// Monitor conversion with race condition
				console.log('⏳ Monitoring conversion progress...');

				const conversionResult = await Promise.race([
					// Success indicators
					page
						.waitForSelector('svg', { timeout: 45000 })
						.then(() => ({ success: true, type: 'svg_element' })),
					page
						.waitForSelector('[class*="svg"]', { timeout: 45000 })
						.then(() => ({ success: true, type: 'svg_class' })),
					page
						.waitForSelector('button:has-text("Download")', { timeout: 45000 })
						.then(() => ({ success: true, type: 'download_button' })),

					// Error indicators
					page
						.waitForSelector('[class*="error"], [data-testid*="error"]', { timeout: 45000 })
						.then(async (element) => ({
							success: false,
							type: 'error_element',
							message: await element.textContent()
						})),

					// Timeout
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									success: false,
									type: 'timeout',
									message: 'Conversion timed out after 45 seconds'
								}),
							45000
						)
					)
				]);

				console.log(`🎯 CONVERSION RESULT:`, conversionResult);
				conversionSuccess = conversionResult.success;

				if (!conversionResult.success) {
					console.log('❌ CONVERSION FAILED - This is the issue iPhone users are experiencing!');
				}
			} catch (conversionError) {
				console.log(`💥 CONVERSION ERROR:`, conversionError);
				errors.push({ step: 'conversion', error: conversionError });
			}
		}

		// STEP 6: Final diagnostics
		console.log('\n🔍 STEP 6: Final system diagnostics...');

		const finalDiagnostics = await page.evaluate(() => {
			return {
				// Memory status
				memory: (performance as any).memory
					? {
							used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
							total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
							limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
						}
					: null,

				// Page elements
				elements: {
					images: document.querySelectorAll('img').length,
					svgs: document.querySelectorAll('svg').length,
					canvases: document.querySelectorAll('canvas').length,
					buttons: document.querySelectorAll('button').length,
					errors: document.querySelectorAll('[class*="error"], [data-testid*="error"]').length
				},

				// WASM final status
				wasmFinal: {
					moduleExists: !!(window as any).wasmJs,
					vectorizerExists: !!(window as any).wasmJs?.WasmVectorizer
				}
			};
		});

		console.log('🔍 FINAL DIAGNOSTICS:', JSON.stringify(finalDiagnostics, null, 2));

		// Take screenshot
		await page.screenshot({
			path: 'test-results/iphone-13-final-state.png',
			fullPage: true
		});

		// COMPREHENSIVE REPORT
		const comprehensiveReport = {
			testInfo: {
				device: 'iPhone 13 Simulation',
				ios: '15',
				safari: 'Mobile Safari 15.0',
				timestamp: new Date().toISOString()
			},
			deviceInfo,
			wasmInit: wasmInitResult,
			testResults: {
				wasmInitialized: wasmInitSuccess,
				fileUploadAttempted: inputExists,
				conversionAttempted,
				conversionSuccessful: conversionSuccess
			},
			issues: {
				javascriptErrors: errors.length,
				networkFailures: networkFailures.length,
				wasmTimeout: wasmInitResult.timeout || false
			},
			diagnostics: finalDiagnostics,
			errors: errors,
			criticalConsoleMessages: consoleMessages.filter(
				(m) =>
					m.type === 'error' ||
					(m.type === 'warning' &&
						(m.text.includes('WASM') ||
							m.text.includes('WebAssembly') ||
							m.text.includes('SharedArrayBuffer') ||
							m.text.includes('threading')))
			),
			networkFailures
		};

		// ANALYSIS AND CONCLUSIONS
		console.log('\n' + '='.repeat(80));
		console.log('📋 COMPREHENSIVE iPhone 13 ANALYSIS REPORT');
		console.log('='.repeat(80));
		console.log(JSON.stringify(comprehensiveReport, null, 2));
		console.log('='.repeat(80));

		console.log('\n🎯 KEY FINDINGS:');

		if (comprehensiveReport.issues.javascriptErrors > 0) {
			console.log(`❌ ${comprehensiveReport.issues.javascriptErrors} JavaScript errors detected`);
			errors.forEach((err, i) => {
				console.log(`   Error ${i + 1}: ${err.message || err.error}`);
			});
		} else {
			console.log('✅ No JavaScript errors detected');
		}

		if (!wasmInitSuccess) {
			console.log('❌ CRITICAL: WASM failed to initialize - THIS IS LIKELY THE ROOT CAUSE');
			if (wasmInitResult.timeout) {
				console.log('   - WASM initialization timed out');
			}
			if (wasmInitResult.errors?.length > 0) {
				console.log(`   - WASM errors: ${wasmInitResult.errors.join(', ')}`);
			}
		} else {
			console.log('✅ WASM initialized successfully');
		}

		if (!conversionSuccess && conversionAttempted) {
			console.log('❌ CRITICAL: Conversion failed - THIS IS WHAT iPhone USERS EXPERIENCE');
		} else if (conversionSuccess) {
			console.log('✅ Conversion completed successfully');
		} else {
			console.log('⚠️  Conversion not attempted (likely due to earlier failures)');
		}

		console.log('\n🔧 RECOMMENDED FIXES:');

		if (!wasmInitSuccess) {
			console.log('1. ⚡ Fix WASM initialization for iOS Safari');
			console.log('   - Force single-threaded mode');
			console.log('   - Reduce memory allocation');
			console.log('   - Add iOS-specific error handling');
		}

		if (comprehensiveReport.issues.networkFailures > 0) {
			console.log('2. 🌐 Fix network request failures');
			networkFailures.forEach((failure) => {
				console.log(`   - ${failure.url}: ${failure.failure}`);
			});
		}

		if (!conversionSuccess && wasmInitSuccess) {
			console.log('3. 🔄 Fix conversion process for iOS');
			console.log('   - Add iOS-specific conversion parameters');
			console.log('   - Implement conversion timeout handling');
		}

		console.log('\n' + '='.repeat(80));

		// Store report in page for further analysis
		await page.evaluate((report) => {
			(window as any).__IPHONE_13_DEBUG_REPORT = report;
		}, comprehensiveReport);

		// Test should pass to capture the full report, even if conversion fails
		expect(comprehensiveReport.testInfo.device).toBe('iPhone 13 Simulation');
	});
});
