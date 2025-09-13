/**
 * Safari/iOS WASM Debugging Test Suite
 * Comprehensive tests to identify WASM initialization and processing failures on iOS devices
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration for iOS/Safari specific tests
test.describe.configure({ mode: 'parallel', retries: 0 });

// Helper to capture all console messages and errors
async function setupErrorCapture(page: Page) {
	const logs: Array<{ type: string; text: string; location?: string }> = [];
	const errors: Array<{ message: string; stack?: string }> = [];

	// Capture console messages
	page.on('console', (msg) => {
		logs.push({
			type: msg.type(),
			text: msg.text(),
			location: msg.location()?.url
		});
	});

	// Capture page errors
	page.on('pageerror', (error) => {
		errors.push({
			message: error.message,
			stack: error.stack
		});
	});

	// Capture request failures
	page.on('requestfailed', (request) => {
		errors.push({
			message: `Request failed: ${request.url()}`,
			stack: `Method: ${request.method()}, Failure: ${request.failure()?.errorText}`
		});
	});

	return { logs, errors };
}

// Helper to get detailed browser and device info
async function getBrowserInfo(page: Page) {
	return await page.evaluate(() => {
		const nav = navigator as any;
		return {
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			vendor: navigator.vendor,
			language: navigator.language,
			hardwareConcurrency: navigator.hardwareConcurrency,
			deviceMemory: nav.deviceMemory || 'unknown',
			maxTouchPoints: navigator.maxTouchPoints,
			webdriver: nav.webdriver,
			// iOS specific detection
			isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
			isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
			// Feature detection
			hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
			hasWebAssembly: typeof WebAssembly !== 'undefined',
			hasWorker: typeof Worker !== 'undefined',
			crossOriginIsolated: (window as any).crossOriginIsolated || false
		};
	});
}

// Helper to check WASM capabilities
async function getWasmCapabilities(page: Page) {
	return await page.evaluate(async () => {
		const capabilities: any = {
			webAssemblySupported: false,
			sharedArrayBufferSupported: false,
			atomicsSupported: false,
			simdSupported: false,
			threadsSupported: false,
			memoryGrowthSupported: false,
			errors: []
		};

		try {
			// Check WebAssembly support
			if (typeof WebAssembly === 'object') {
				capabilities.webAssemblySupported = true;

				// Check for specific WASM features
				try {
					// Test instantiation with simple module
					const wasmCode = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
					await WebAssembly.instantiate(wasmCode);
					capabilities.instantiationWorks = true;
				} catch (e: any) {
					capabilities.errors.push(`WASM instantiation failed: ${e.message}`);
				}

				// Check memory growth
				try {
					const memory = new WebAssembly.Memory({ initial: 1, maximum: 2 });
					memory.grow(1);
					capabilities.memoryGrowthSupported = true;
				} catch (e: any) {
					capabilities.errors.push(`Memory growth failed: ${e.message}`);
				}
			}

			// Check SharedArrayBuffer
			if (typeof SharedArrayBuffer !== 'undefined') {
				capabilities.sharedArrayBufferSupported = true;
				try {
					const sab = new SharedArrayBuffer(1024);
					capabilities.sharedArrayBufferWorks = sab.byteLength === 1024;
				} catch (e: any) {
					capabilities.errors.push(`SharedArrayBuffer creation failed: ${e.message}`);
				}
			}

			// Check Atomics
			if (typeof Atomics !== 'undefined') {
				capabilities.atomicsSupported = true;
			}

			// Check SIMD (if available)
			if ((WebAssembly as any).validate) {
				// Simple SIMD detection
				capabilities.simdSupported = 'SIMD' in WebAssembly || false;
			}

			// Check cross-origin isolation
			capabilities.crossOriginIsolated = (window as any).crossOriginIsolated || false;
			capabilities.secureContext = window.isSecureContext || false;

			// Threading support detection
			capabilities.threadsSupported =
				capabilities.sharedArrayBufferSupported &&
				capabilities.atomicsSupported &&
				capabilities.crossOriginIsolated;
		} catch (error: any) {
			capabilities.errors.push(`General capability check failed: ${error.message}`);
		}

		return capabilities;
	});
}

// Test WASM module loading specifically
async function testWasmModuleLoading(page: Page) {
	return await page.evaluate(async () => {
		const results: any = {
			moduleLoadSuccess: false,
			initSuccess: false,
			vectorizerAvailable: false,
			threadPoolStatus: null,
			errors: [],
			timing: {}
		};

		try {
			const startTime = performance.now();

			// Try to load the WASM module
			const wasmModule = await import('/wasm/vectorize_wasm.js');
			results.moduleLoadSuccess = true;
			results.timing.moduleLoad = performance.now() - startTime;

			// Try to initialize
			const initStart = performance.now();
			await wasmModule.default({
				module_or_path: new URL('/wasm/vectorize_wasm_bg.wasm', window.location.origin)
			});
			results.initSuccess = true;
			results.timing.init = performance.now() - initStart;

			// Check if vectorizer is available
			if (wasmModule.WasmVectorizer) {
				results.vectorizerAvailable = true;
				// Try to create instance
				const vectorizer = new wasmModule.WasmVectorizer();
				results.instanceCreated = true;
			}

			// Check threading status if available
			if (wasmModule.get_thread_count) {
				results.threadPoolStatus = {
					threadCount: wasmModule.get_thread_count(),
					isSupported: wasmModule.is_threading_supported
						? wasmModule.is_threading_supported()
						: false
				};
			}
		} catch (error: any) {
			results.errors.push({
				message: error.message,
				stack: error.stack,
				name: error.name
			});
		}

		return results;
	});
}

// Main test suite
test.describe('Safari/iOS WASM Debugging', () => {
	test('Capture device and browser capabilities', async ({ page, browserName }) => {
		const { logs, errors } = await setupErrorCapture(page);

		await page.goto('/converter');
		await page.waitForLoadState('networkidle');

		// Get browser info
		const browserInfo = await getBrowserInfo(page);
		console.log('Browser Info:', JSON.stringify(browserInfo, null, 2));

		// Get WASM capabilities
		const wasmCaps = await getWasmCapabilities(page);
		console.log('WASM Capabilities:', JSON.stringify(wasmCaps, null, 2));

		// Log any console messages or errors
		if (logs.length > 0) {
			console.log('Console Logs:', JSON.stringify(logs, null, 2));
		}
		if (errors.length > 0) {
			console.log('Page Errors:', JSON.stringify(errors, null, 2));
		}

		// Store results for analysis
		await page.evaluate(
			(data) => {
				(window as any).__DEBUG_INFO = data;
			},
			{ browserInfo, wasmCaps, logs, errors }
		);

		// Basic assertions
		expect(browserInfo.hasWebAssembly).toBe(true);

		// iOS-specific checks
		if (browserInfo.isIOS || browserName === 'webkit') {
			console.log('iOS/Safari detected - checking for known limitations');
			// SharedArrayBuffer might not be available on iOS
			if (!browserInfo.hasSharedArrayBuffer) {
				console.warn('SharedArrayBuffer not available - threading will be disabled');
			}
			if (!browserInfo.crossOriginIsolated) {
				console.warn('Not cross-origin isolated - some features may be limited');
			}
		}
	});

	test('Test WASM module initialization', async ({ page }) => {
		const { logs, errors } = await setupErrorCapture(page);

		await page.goto('/converter');
		await page.waitForLoadState('networkidle');

		// Test WASM loading
		const wasmResults = await testWasmModuleLoading(page);
		console.log('WASM Loading Results:', JSON.stringify(wasmResults, null, 2));

		// Check for errors
		if (wasmResults.errors.length > 0) {
			console.error('WASM Loading Errors:', wasmResults.errors);
		}

		// Log timing information
		console.log('Timing:', wasmResults.timing);

		// Assertions
		expect(wasmResults.moduleLoadSuccess).toBe(true);
		expect(wasmResults.initSuccess).toBe(true);
		expect(wasmResults.vectorizerAvailable).toBe(true);
	});

	test('Test image upload and conversion process', async ({ page, browserName }) => {
		const { logs, errors } = await setupErrorCapture(page);

		await page.goto('/converter');
		await page.waitForLoadState('networkidle');

		// Wait for WASM to initialize
		await page
			.waitForFunction(
				() => {
					const status = document.querySelector('[data-testid="wasm-status"]');
					return status?.textContent?.includes('Ready') || false;
				},
				{ timeout: 30000 }
			)
			.catch(() => {
				console.warn('WASM status indicator not found or not ready');
			});

		// Upload test image
		const testImagePath = path.join(__dirname, '../fixtures/test-image-small.jpg');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(testImagePath);

		// Wait for image to be loaded
		await page.waitForSelector('[data-testid="image-preview"]', { timeout: 10000 });

		// Try to convert
		const convertButton = page.locator('button:has-text("Convert")');
		await convertButton.click();

		// Monitor conversion process
		let conversionCompleted = false;
		let conversionError = null;

		try {
			// Wait for either success or error
			await Promise.race([
				page.waitForSelector('[data-testid="svg-preview"]', { timeout: 30000 }).then(() => {
					conversionCompleted = true;
				}),
				page
					.waitForSelector('[data-testid="error-message"]', { timeout: 30000 })
					.then(async (element) => {
						conversionError = await element.textContent();
					})
			]);
		} catch (timeoutError) {
			console.error('Conversion timeout:', timeoutError);
		}

		// Capture final state
		const finalState = await page.evaluate(() => {
			return {
				hasImagePreview: !!document.querySelector('[data-testid="image-preview"]'),
				hasSvgPreview: !!document.querySelector('[data-testid="svg-preview"]'),
				hasError: !!document.querySelector('[data-testid="error-message"]'),
				errorText: document.querySelector('[data-testid="error-message"]')?.textContent,
				wasmStatus: document.querySelector('[data-testid="wasm-status"]')?.textContent
			};
		});

		console.log('Final State:', JSON.stringify(finalState, null, 2));
		console.log('Logs during conversion:', logs);
		console.log('Errors during conversion:', errors);

		// iOS-specific error handling
		if ((browserName === 'webkit' || (await getBrowserInfo(page)).isIOS) && !conversionCompleted) {
			console.warn('Conversion failed on iOS/Safari - this is the issue we are debugging');
			console.log('Conversion Error:', conversionError);

			// Try to get more detailed error info
			const debugInfo = await page.evaluate(() => (window as any).__DEBUG_INFO);
			console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
		}

		// Assertions - relaxed for iOS
		if (browserName !== 'webkit') {
			expect(conversionCompleted).toBe(true);
		}
	});

	test('Test memory allocation and limits', async ({ page, browserName }) => {
		await page.goto('/converter');
		await page.waitForLoadState('networkidle');

		const memoryTest = await page.evaluate(async () => {
			const results: any = {
				initialMemory: null,
				canGrowMemory: false,
				maxMemory: null,
				allocationTests: [],
				errors: []
			};

			try {
				// Test WebAssembly memory
				const memory = new WebAssembly.Memory({ initial: 1, maximum: 100 });
				results.initialMemory = memory.buffer.byteLength;

				// Try to grow memory
				try {
					memory.grow(1);
					results.canGrowMemory = true;
					results.currentMemory = memory.buffer.byteLength;
				} catch (e: any) {
					results.errors.push(`Memory growth failed: ${e.message}`);
				}

				// Test different allocation sizes
				const sizes = [1, 10, 50, 100, 256];
				for (const size of sizes) {
					try {
						const testMemory = new WebAssembly.Memory({ initial: size });
						results.allocationTests.push({
							size,
							success: true,
							actualSize: testMemory.buffer.byteLength
						});
					} catch (e: any) {
						results.allocationTests.push({
							size,
							success: false,
							error: e.message
						});
						break; // Stop testing larger sizes
					}
				}

				// Get performance memory info if available
				if ((performance as any).memory) {
					results.performanceMemory = {
						usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
						totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
						jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
					};
				}
			} catch (error: any) {
				results.errors.push(`Memory test failed: ${error.message}`);
			}

			return results;
		});

		console.log('Memory Test Results:', JSON.stringify(memoryTest, null, 2));

		// iOS might have stricter memory limits
		if (browserName === 'webkit') {
			console.log('Safari/iOS memory constraints detected');
			if (!memoryTest.canGrowMemory) {
				console.warn('Memory growth not supported - this could cause WASM failures');
			}
		}
	});

	test('Test Worker and threading support', async ({ page }) => {
		const { logs, errors } = await setupErrorCapture(page);

		await page.goto('/converter');

		const workerTest = await page.evaluate(async () => {
			const results: any = {
				workerSupported: false,
				sharedArrayBufferSupported: false,
				atomicsSupported: false,
				crossOriginIsolated: false,
				workerCreationSuccess: false,
				workerMessageSuccess: false,
				errors: []
			};

			try {
				// Check basic support
				results.workerSupported = typeof Worker !== 'undefined';
				results.sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
				results.atomicsSupported = typeof Atomics !== 'undefined';
				results.crossOriginIsolated = (window as any).crossOriginIsolated || false;

				// Try to create a worker
				if (results.workerSupported) {
					try {
						const workerCode = `
							self.onmessage = function(e) {
								self.postMessage({ received: e.data, threadId: self.name || 'unnamed' });
							}
						`;
						const blob = new Blob([workerCode], { type: 'application/javascript' });
						const worker = new Worker(URL.createObjectURL(blob));

						results.workerCreationSuccess = true;

						// Test message passing
						await new Promise<void>((resolve, reject) => {
							const timeout = setTimeout(() => reject(new Error('Worker timeout')), 5000);
							worker.onmessage = (e) => {
								results.workerMessageSuccess = true;
								results.workerResponse = e.data;
								clearTimeout(timeout);
								resolve();
							};
							worker.onerror = (e) => {
								clearTimeout(timeout);
								reject(e);
							};
							worker.postMessage({ test: 'data' });
						});

						worker.terminate();
					} catch (e: any) {
						results.errors.push(`Worker test failed: ${e.message}`);
					}
				}

				// Test SharedArrayBuffer if available
				if (results.sharedArrayBufferSupported && results.crossOriginIsolated) {
					try {
						const sab = new SharedArrayBuffer(1024);
						const view = new Int32Array(sab);
						view[0] = 42;

						// Test Atomics if available
						if (results.atomicsSupported) {
							Atomics.store(view, 0, 123);
							results.atomicsWorkSuccess = Atomics.load(view, 0) === 123;
						}

						results.sharedArrayBufferWorkSuccess = true;
					} catch (e: any) {
						results.errors.push(`SharedArrayBuffer test failed: ${e.message}`);
					}
				}
			} catch (error: any) {
				results.errors.push(`Worker/threading test failed: ${error.message}`);
			}

			return results;
		});

		console.log('Worker/Threading Test Results:', JSON.stringify(workerTest, null, 2));

		// Log any errors captured
		if (errors.length > 0) {
			console.error('Page errors during worker test:', errors);
		}

		// Check results
		expect(workerTest.workerSupported).toBe(true);
		expect(workerTest.workerCreationSuccess).toBe(true);

		// Threading might not be available on iOS
		if (!workerTest.crossOriginIsolated) {
			console.warn('Not cross-origin isolated - threading features will be limited');
		}
	});

	test('Comprehensive error capture during full workflow', async ({ page, browserName }) => {
		const allLogs: any[] = [];
		const allErrors: any[] = [];
		const networkRequests: any[] = [];

		// Setup comprehensive monitoring
		page.on('console', (msg) => {
			allLogs.push({
				type: msg.type(),
				text: msg.text(),
				timestamp: new Date().toISOString()
			});
		});

		page.on('pageerror', (error) => {
			allErrors.push({
				message: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString()
			});
		});

		page.on('requestfailed', (request) => {
			networkRequests.push({
				url: request.url(),
				method: request.method(),
				failure: request.failure()?.errorText,
				timestamp: new Date().toISOString()
			});
		});

		// Navigate and perform conversion
		await page.goto('/converter');
		await page.waitForLoadState('networkidle');

		// Inject debug helper
		await page.evaluate(() => {
			(window as any).__captureError = (error: any) => {
				console.error('Captured error:', error);
				return {
					message: error.message,
					stack: error.stack,
					name: error.name,
					timestamp: new Date().toISOString()
				};
			};
		});

		// Try conversion workflow
		const testImagePath = path.join(__dirname, '../fixtures/test-image-small.jpg');
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(testImagePath);

		// Wait and try to convert
		await page.waitForTimeout(2000);
		const convertButton = page.locator('button:has-text("Convert")');

		if (await convertButton.isVisible()) {
			await convertButton.click();
			await page.waitForTimeout(5000); // Wait for processing
		}

		// Collect all debug information
		const debugReport = {
			browserName,
			userAgent: await page.evaluate(() => navigator.userAgent),
			timestamp: new Date().toISOString(),
			logs: allLogs,
			errors: allErrors,
			networkFailures: networkRequests,
			finalState: await page.evaluate(() => {
				return {
					url: window.location.href,
					hasImage: !!document.querySelector('[data-testid="image-preview"]'),
					hasSvg: !!document.querySelector('[data-testid="svg-preview"]'),
					hasError: !!document.querySelector('[data-testid="error-message"]'),
					bodyHTML: document.body.innerHTML.substring(0, 1000) // First 1000 chars
				};
			})
		};

		// Write debug report
		console.log('=== FULL DEBUG REPORT ===');
		console.log(JSON.stringify(debugReport, null, 2));
		console.log('=== END DEBUG REPORT ===');

		// Specific iOS/Safari analysis
		if (browserName === 'webkit' || debugReport.userAgent.includes('Safari')) {
			console.log('\n=== iOS/SAFARI SPECIFIC ANALYSIS ===');
			const safariIssues = allErrors.filter(
				(e) =>
					e.message.includes('SharedArrayBuffer') ||
					e.message.includes('WebAssembly') ||
					e.message.includes('Memory') ||
					e.message.includes('Worker')
			);
			if (safariIssues.length > 0) {
				console.log('Safari-specific errors found:', safariIssues);
			}
			console.log('=== END SAFARI ANALYSIS ===\n');
		}
	});
});
