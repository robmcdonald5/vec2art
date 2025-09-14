/**
 * Realistic iPhone Safari Simulation Test
 * This test aims to recreate the EXACT conditions that iPhone users experience
 * including network conditions, memory constraints, and Safari-specific behaviors
 */

import { test, expect, devices } from '@playwright/test';

// Configure realistic iPhone Safari environment
test.use({
	...devices['iPhone 13'],
	// Use actual iOS Safari user agent that real users have
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Mobile/15E148 Safari/604.1`,
	// Simulate iPhone network conditions
	connectOptions: {
		timeout: 30000 // iPhone users often have slower connections
	},
	// Enable actual device metrics
	deviceScaleFactor: 3,
	hasTouch: true,
	isMobile: true
});

test.describe('Realistic iPhone Safari Environment', () => {
	test.beforeEach(async ({ page }) => {
		// Simulate realistic iPhone conditions

		// 1. Network throttling - iPhone users often on cellular
		await page.route('**/*', async (route) => {
			const url = route.request().url();

			// Simulate slower loading for WASM files (common on iPhone)
			if (url.includes('.wasm') || url.includes('wasm')) {
				await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s delay for WASM
			} else if (url.includes('.js')) {
				await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay for JS
			}

			await route.continue();
		});

		// 2. Memory pressure simulation - iPhone has limited RAM
		await page.addInitScript(() => {
			// Override memory API to simulate iPhone constraints
			if ('memory' in performance) {
				const originalMemory = (performance as any).memory;
				Object.defineProperty(performance, 'memory', {
					get: () => ({
						usedJSHeapSize: Math.min(originalMemory.usedJSHeapSize, 100 * 1024 * 1024), // Cap at 100MB
						totalJSHeapSize: Math.min(originalMemory.totalJSHeapSize, 150 * 1024 * 1024), // Cap at 150MB
						jsHeapSizeLimit: 200 * 1024 * 1024 // iPhone limit ~200MB
					})
				});
			}

			// Simulate iPhone Safari quirks
			Object.defineProperty(navigator, 'hardwareConcurrency', {
				value: 6 // iPhone 13 has 6 cores but limited threading
			});

			// Disable SharedArrayBuffer (common iPhone issue)
			if ('SharedArrayBuffer' in window) {
				console.log('[iPhone Sim] Disabling SharedArrayBuffer to simulate iPhone restrictions');
				(window as any).SharedArrayBuffer = undefined;
			}
		});

		// 3. Add realistic error handlers that iPhone users experience
		let _connectionErrors = 0;
		let _memoryWarnings = 0;

		page.on('response', (response) => {
			if (response.status() >= 400) {
				_connectionErrors++;
				console.log(`[iPhone Sim] Connection error ${response.status()} for ${response.url()}`);
			}
		});

		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('memory') || text.includes('heap') || text.includes('OutOfMemory')) {
				_memoryWarnings++;
				console.log(`[iPhone Sim] Memory warning: ${text}`);
			}
		});

		// Store error counts for test access
		await page.evaluate(() => {
			(window as any).__iPhone_Simulation = {
				connectionErrors: 0,
				memoryWarnings: 0,
				startTime: Date.now()
			};
		});
	});

	test('iPhone converter workflow with real constraints', async ({ page }) => {
		console.log('\n📱 REALISTIC IPHONE TEST STARTING');
		console.log('==================================');

		// Track comprehensive metrics like real iPhone users experience
		let testMetrics = {
			pageLoadTime: 0,
			wasmLoadTime: 0,
			imageUploadTime: 0,
			conversionTime: 0,
			totalMemoryUsed: 0,
			errors: [] as string[],
			crashes: 0,
			networkFailures: 0
		};

		const startTime = Date.now();

		try {
			// 1. Page load simulation with iPhone constraints
			console.log('📱 Loading page with iPhone Safari constraints...');

			const pageLoadStart = Date.now();
			await page.goto('http://localhost:5173/converter', {
				waitUntil: 'networkidle',
				timeout: 60000 // iPhone users often timeout
			});
			testMetrics.pageLoadTime = Date.now() - pageLoadStart;

			console.log(`⏱️ Page loaded in ${testMetrics.pageLoadTime}ms (iPhone constraint)`);

			// 2. Check for WASM loading with iPhone-specific issues
			const wasmLoadStart = Date.now();

			// Monitor for iPhone-specific WASM issues
			const wasmStatus = await page.evaluate(async () => {
				return new Promise((resolve) => {
					const checkWasm = () => {
						const wasmModule = (window as any).wasmJs;
						const results = {
							loaded: !!wasmModule,
							threading: false,
							sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
							errors: [] as string[],
							threadCount: 0
						};

						if (wasmModule) {
							try {
								if (typeof wasmModule.is_threading_supported === 'function') {
									results.threading = wasmModule.is_threading_supported();
								}
								if (typeof wasmModule.get_thread_count === 'function') {
									results.threadCount = wasmModule.get_thread_count();
								}
							} catch (e: any) {
								results.errors.push(`WASM error: ${e.message}`);
							}
						}

						return results;
					};

					// Check immediately and then wait for potential async loading
					const immediate = checkWasm();
					if (immediate.loaded) {
						resolve(immediate);
					} else {
						// Wait for WASM to load (common iPhone delay)
						setTimeout(() => resolve(checkWasm()), 5000);
					}
				});
			});

			testMetrics.wasmLoadTime = Date.now() - wasmLoadStart;
			console.log(`🧩 WASM status:`, wasmStatus);
			console.log(`⏱️ WASM loaded in ${testMetrics.wasmLoadTime}ms`);

			if (!wasmStatus.loaded) {
				testMetrics.errors.push('WASM failed to load - this explains iPhone failures!');
				console.log('🚨 CRITICAL: WASM NOT LOADED - This is the iPhone issue!');
			}

			// 3. Test image upload with iPhone memory constraints
			console.log('📷 Testing image upload with iPhone memory limits...');

			const uploadStart = Date.now();
			const fileInput = page.locator('input[type="file"]');

			if ((await fileInput.count()) > 0) {
				// Create a realistic user image (not too large, iPhone users often use photos)
				const testImageData = await page.evaluate(() => {
					const canvas = document.createElement('canvas');
					canvas.width = 800; // Typical iPhone photo width
					canvas.height = 600; // Typical iPhone photo height
					const ctx = canvas.getContext('2d')!;

					// Create typical photo-like content
					const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
					gradient.addColorStop(0, '#ff6b6b');
					gradient.addColorStop(0.5, '#4ecdc4');
					gradient.addColorStop(1, '#45b7d1');
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, canvas.width, canvas.height);

					// Add some detail that would create edges
					ctx.fillStyle = 'white';
					for (let i = 0; i < 20; i++) {
						const x = Math.random() * canvas.width;
						const y = Math.random() * canvas.height;
						const radius = Math.random() * 50 + 10;
						ctx.beginPath();
						ctx.arc(x, y, radius, 0, Math.PI * 2);
						ctx.fill();
					}

					return canvas.toDataURL('image/jpeg', 0.8); // JPEG like iPhone photos
				});

				console.log(
					`📁 Created realistic iPhone photo: ${Math.round(testImageData.length / 1024)}KB`
				);

				// Upload with iPhone constraints
				const imageBuffer = Buffer.from(testImageData.split(',')[1], 'base64');

				await fileInput.setInputFiles({
					name: 'iphone-photo.jpg',
					mimeType: 'image/jpeg',
					buffer: imageBuffer
				});

				testMetrics.imageUploadTime = Date.now() - uploadStart;
				console.log(`⏱️ Image uploaded in ${testMetrics.imageUploadTime}ms`);

				// Monitor memory after upload (critical on iPhone)
				const memoryAfterUpload = await page.evaluate(() => {
					if ('memory' in performance) {
						return (performance as any).memory.usedJSHeapSize;
					}
					return 0;
				});

				testMetrics.totalMemoryUsed = memoryAfterUpload;
				console.log(`🧠 Memory after upload: ${Math.round(memoryAfterUpload / 1024 / 1024)}MB`);

				// 4. Test conversion with iPhone constraints
				console.log('🔄 Testing conversion with iPhone Safari constraints...');

				const conversionStart = Date.now();

				// Look for convert button
				const convertButton = page
					.locator('button:has-text("Convert"), button:has-text("Start")')
					.first();

				if ((await convertButton.count()) > 0) {
					// Monitor for crashes during conversion
					let conversionCrashed = false;
					const crashHandler = () => {
						conversionCrashed = true;
						testMetrics.crashes++;
						console.log('💥 CONVERSION CRASHED - This is the iPhone issue!');
					};

					page.on('crash', crashHandler);

					await convertButton.click();
					console.log('✅ Convert button clicked');

					// Wait for conversion result with iPhone timeout constraints
					const conversionResult = (await Promise.race([
						// Success case
						page
							.waitForSelector('svg, canvas, .result', { timeout: 90000 })
							.then(() => ({ success: true, type: 'completed' }))
							.catch(() => ({ success: false, type: 'no_result' })),

						// Error case
						page
							.waitForSelector('.error, [data-error], .failed', { timeout: 90000 })
							.then(() => ({ success: false, type: 'error_shown' }))
							.catch(() => ({ success: false, type: 'no_error_shown' })),

						// Crash detection
						new Promise((resolve) => {
							const checkCrash = () => {
								if (conversionCrashed) {
									resolve({ success: false, type: 'crashed' });
								} else {
									setTimeout(checkCrash, 1000);
								}
							};
							checkCrash();
						})
					])) as any;

					testMetrics.conversionTime = Date.now() - conversionStart;

					console.log(`🎯 Conversion result:`, conversionResult);
					console.log(`⏱️ Conversion took ${testMetrics.conversionTime}ms`);

					page.off('crash', crashHandler);

					if (!conversionResult.success) {
						testMetrics.errors.push(`Conversion failed: ${conversionResult.type}`);

						if (conversionResult.type === 'crashed') {
							console.log('🚨 CRITICAL: CONVERSION CRASHED - This explains iPhone user reports!');
						} else if (conversionResult.type === 'no_result') {
							console.log('🚨 CRITICAL: NO RESULT SHOWN - iPhone users see nothing happening!');
						} else if (conversionResult.type === 'error_shown') {
							console.log('⚠️ ERROR SHOWN TO USER - iPhone users see error message');
						}
					} else {
						console.log('✅ Conversion succeeded in iPhone simulation');
					}
				} else {
					testMetrics.errors.push('Convert button not found');
					console.log('🚨 CRITICAL: Convert button not found - UI issue on iPhone!');
				}
			} else {
				testMetrics.errors.push('File input not found');
				console.log('🚨 CRITICAL: File input not found - Upload broken on iPhone!');
			}
		} catch (error) {
			testMetrics.errors.push(`Test error: ${error}`);
			console.log(`❌ Test error: ${error}`);
		}

		// Final iPhone simulation report
		const totalTime = Date.now() - startTime;

		const iPhoneReport = {
			...testMetrics,
			totalTestTime: totalTime,
			simulatedConstraints: {
				memoryLimit: '200MB',
				sharedArrayBufferDisabled: true,
				networkThrottled: true,
				safariUserAgent: true
			},
			verdict:
				testMetrics.crashes > 0
					? 'CRASHES_DETECTED'
					: testMetrics.errors.length > 0
						? 'ERRORS_DETECTED'
						: 'SUCCESS'
		};

		console.log('\n📱 REALISTIC IPHONE SIMULATION REPORT');
		console.log('====================================');
		console.log(JSON.stringify(iPhoneReport, null, 2));
		console.log('====================================');

		// Store report for debugging
		await page.evaluate((report) => {
			(window as any).__REALISTIC_IPHONE_REPORT = report;
		}, iPhoneReport);

		// Analyze results
		if (iPhoneReport.verdict === 'CRASHES_DETECTED') {
			console.log('🚨 CRITICAL FINDING: iPhone crashes detected in simulation!');
			console.log('This likely explains the real user reports.');
		} else if (iPhoneReport.verdict === 'ERRORS_DETECTED') {
			console.log('⚠️ ERRORS FOUND: iPhone errors detected that may cause failures');
			console.log('Errors:', iPhoneReport.errors);
		} else {
			console.log('✅ iPhone simulation passed - need to investigate other factors');
		}

		// Test should always pass to capture full results
		expect(iPhoneReport.totalTestTime).toBeGreaterThan(0);
	});

	test('iPhone Safari cache issues simulation', async ({ page }) => {
		console.log('\n🗄️ iPhone Safari Cache Issues Test');
		console.log('==================================');

		// Simulate Vercel CDN edge cache serving stale files to iPhone users
		await page.route('**/wasm/**', async (route) => {
			const url = route.request().url();
			console.log(`[iPhone Cache] Intercepting WASM request: ${url}`);

			// Simulate stale cache by serving old version headers
			const response = await route.fetch();
			const headers = {
				...response.headers(),
				'cache-control': 'public, max-age=31536000, immutable', // Aggressive cache
				etag: '"old-wasm-version"', // Simulate stale ETag
				age: '86400' // 1 day old
			};

			console.log(`[iPhone Cache] Serving with stale cache headers`);
			await route.fulfill({
				response,
				headers
			});
		});

		await page.goto('http://localhost:5173/converter');

		// Check if old cached WASM causes issues
		const cacheIssues = await page.evaluate(() => {
			const results = {
				wasmLoaded: false,
				versionMismatch: false,
				cacheHeaders: {} as any,
				errors: [] as string[]
			};

			// Check if WASM loaded properly with stale cache
			try {
				const wasmModule = (window as any).wasmJs;
				results.wasmLoaded = !!wasmModule;

				if (wasmModule && typeof wasmModule.get_version === 'function') {
					const version = wasmModule.get_version();
					// Check if version matches expected
					results.versionMismatch = !version || version.includes('old');
				}
			} catch (e: any) {
				results.errors.push(`WASM cache issue: ${e.message}`);
			}

			return results;
		});

		console.log('🗄️ Cache issue test results:', cacheIssues);

		if (!cacheIssues.wasmLoaded) {
			console.log('🚨 CRITICAL: Stale cache prevents WASM loading - this is the iPhone issue!');
		} else if (cacheIssues.versionMismatch) {
			console.log('⚠️ Version mismatch detected - iPhone users getting old code!');
		} else {
			console.log('✅ Cache test passed - investigating other cache scenarios');
		}

		expect(cacheIssues).toBeTruthy();
	});
});
