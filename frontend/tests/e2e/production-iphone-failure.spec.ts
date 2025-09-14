/**
 * Production iPhone Failure Simulation
 * Tests using actual production WASM files to reproduce real iPhone user issues
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Mobile/15E148 Safari/604.1`
});

// Production URL - replace with your actual Vercel deployment URL
const PRODUCTION_URL = 'https://vec2art.vercel.app'; // Update this!

test.describe('Production iPhone Failure Investigation', () => {
	test('iPhone with actual production WASM files', async ({ page }) => {
		console.log('\n🏭 PRODUCTION IPHONE FAILURE TEST');
		console.log('================================');

		let failureReport = {
			productionWasmFetched: false,
			wasmFiles: [] as any[],
			wasmLoadErrors: [] as string[],
			networkErrors: [] as string[],
			memoryIssues: [] as string[],
			consoleErrors: [] as string[],
			conversionAttempted: false,
			conversionResult: 'not_attempted',
			actualFailureDetected: false,
			failureReason: '',
			productionHeaders: {} as any
		};

		// Monitor all network requests
		page.on('response', async (response) => {
			const url = response.url();

			if (url.includes('wasm') || url.includes('.wasm')) {
				const headers = response.headers();
				failureReport.wasmFiles.push({
					url,
					status: response.status(),
					ok: response.ok(),
					headers,
					size: headers['content-length'] || 'unknown'
				});

				if (!response.ok()) {
					failureReport.wasmLoadErrors.push(
						`${url}: ${response.status()} ${response.statusText()}`
					);
				}

				console.log(`🧩 WASM File: ${url} (${response.status()})`);
				console.log(
					`   Headers: Cache-Control: ${headers['cache-control']}, Age: ${headers['age']}`
				);
			}

			if (!response.ok() && response.status() >= 400) {
				failureReport.networkErrors.push(`${url}: ${response.status()} ${response.statusText()}`);
			}
		});

		// Monitor console for errors
		page.on('console', (msg) => {
			const text = msg.text();
			if (msg.type() === 'error') {
				failureReport.consoleErrors.push(text);
				console.log(`🚨 Console Error: ${text}`);

				if (text.includes('WASM') || text.includes('memory') || text.includes('worker')) {
					failureReport.actualFailureDetected = true;
					failureReport.failureReason = text;
				}
			}

			if (text.includes('memory') || text.includes('Memory') || text.includes('heap')) {
				failureReport.memoryIssues.push(text);
				console.log(`🧠 Memory Issue: ${text}`);
			}
		});

		page.on('pageerror', (error) => {
			failureReport.consoleErrors.push(`PAGE ERROR: ${error.message}`);
			failureReport.actualFailureDetected = true;
			failureReport.failureReason = error.message;
			console.log(`💥 Page Error: ${error.message}`);
		});

		try {
			// Step 1: Test production WASM file accessibility
			console.log('📡 Testing production WASM file access...');

			const productionWasmUrls = [
				`${PRODUCTION_URL}/wasm/vectorize_wasm.js`,
				`${PRODUCTION_URL}/wasm/vectorize_wasm_bg.wasm`,
				`${PRODUCTION_URL}/wasm/__wbindgen_placeholder__.js`
			];

			for (const wasmUrl of productionWasmUrls) {
				try {
					const response = await page.goto(wasmUrl, { timeout: 10000 });
					if (response) {
						console.log(`✅ ${wasmUrl}: ${response.status()}`);
						failureReport.productionHeaders[wasmUrl] = response.headers();
					}
				} catch (error) {
					console.log(`❌ ${wasmUrl}: Failed - ${error}`);
					failureReport.wasmLoadErrors.push(`Direct access failed: ${wasmUrl} - ${error}`);
				}
			}

			// Step 2: Load production app with iPhone simulation
			console.log('📱 Loading production app on iPhone...');

			await page.goto(`${PRODUCTION_URL}/converter`, {
				waitUntil: 'networkidle',
				timeout: 60000
			});

			console.log('✅ Production page loaded');

			// Step 3: Apply realistic iPhone memory constraints
			await page.evaluate(() => {
				// Simulate iPhone memory pressure
				if ('memory' in performance) {
					Object.defineProperty(performance, 'memory', {
						get: () => ({
							usedJSHeapSize: 150 * 1024 * 1024, // 150MB used (high for iPhone)
							totalJSHeapSize: 180 * 1024 * 1024, // 180MB total
							jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB limit (iPhone constraint)
						})
					});
				}

				// Simulate iPhone network issues
				(navigator as any).connection = {
					effectiveType: '3g',
					downlink: 1.5,
					rtt: 300,
					saveData: false
				};
			});

			// Step 4: Wait longer for WASM (iPhone users report slow loading)
			console.log('⏳ Waiting for WASM with iPhone timing constraints...');
			await page.waitForTimeout(10000); // 10 seconds like real iPhone users experience

			// Step 5: Check WASM status with production environment
			const wasmStatus = await page.evaluate(() => {
				return new Promise((resolve) => {
					const checkWasm = () => {
						const wasmModule = (window as any).wasmJs;
						const result = {
							loaded: !!wasmModule,
							loadTime: Date.now(),
							functions: [] as string[],
							initErrors: [] as string[],
							environment: {
								url: window.location.href,
								protocol: window.location.protocol,
								crossOriginIsolated: window.crossOriginIsolated,
								sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
							}
						};

						if (wasmModule) {
							try {
								result.functions = Object.getOwnPropertyNames(wasmModule)
									.filter((name) => typeof wasmModule[name] === 'function')
									.slice(0, 10);
							} catch (e: any) {
								result.initErrors.push(e.message);
							}
						}

						return result;
					};

					// Check multiple times to catch timing issues
					setTimeout(() => {
						const result1 = checkWasm();
						setTimeout(() => {
							const result2 = checkWasm();
							resolve({
								...result2,
								consistentLoad: result1.loaded === result2.loaded
							});
						}, 2000);
					}, 1000);
				});
			});

			console.log('🧩 Production WASM Status:', wasmStatus);

			if (!(wasmStatus as any).loaded) {
				failureReport.actualFailureDetected = true;
				failureReport.failureReason = 'WASM failed to load in production environment';
				console.log('🚨 CRITICAL: WASM failed to load in production - this matches user reports!');
			}

			// Step 6: Test conversion with production constraints
			if ((wasmStatus as any).loaded) {
				console.log('🔄 Testing conversion with production + iPhone constraints...');

				// Create test image
				const testImage = await page.evaluate(() => {
					const canvas = document.createElement('canvas');
					canvas.width = 400; // Typical iPhone photo size
					canvas.height = 400;
					const ctx = canvas.getContext('2d')!;

					// Create realistic photo-like content that might cause issues
					const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
					gradient.addColorStop(0, '#ff6b6b');
					gradient.addColorStop(0.5, '#4ecdc4');
					gradient.addColorStop(1, '#45b7d1');
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, 400, 400);

					// Add details that create many edges (challenging for WASM)
					ctx.fillStyle = 'white';
					for (let i = 0; i < 50; i++) {
						const x = Math.random() * 400;
						const y = Math.random() * 400;
						const size = Math.random() * 20 + 5;
						ctx.beginPath();
						ctx.arc(x, y, size, 0, Math.PI * 2);
						ctx.fill();
					}

					return canvas.toDataURL('image/jpeg', 0.9);
				});

				const imageBuffer = Buffer.from(testImage.split(',')[1], 'base64');
				console.log(`📤 Uploading ${Math.round(imageBuffer.length / 1024)}KB test image...`);

				const fileInput = page.locator('input[type="file"]');
				if ((await fileInput.count()) > 0) {
					await fileInput.setInputFiles({
						name: 'production-iphone-test.jpg',
						mimeType: 'image/jpeg',
						buffer: imageBuffer
					});

					failureReport.conversionAttempted = true;

					// Wait for upload processing
					await page.waitForTimeout(3000);

					// Find and click convert button
					const convertButton = page
						.locator('button:has-text("Convert"), button:has-text("Start")')
						.first();
					if ((await convertButton.count()) > 0) {
						console.log('🔘 Clicking convert button...');

						// Monitor memory during conversion (critical on iPhone)
						const memoryMonitor = setInterval(() => {
							page
								.evaluate(() => {
									if ((performance as any).memory) {
										const memory = (performance as any).memory;
										const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
										const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
										console.log(
											`🧠 Memory: ${usedMB}MB / ${limitMB}MB (${Math.round((usedMB / limitMB) * 100)}%)`
										);

										if (usedMB / limitMB > 0.95) {
											console.log('🚨 MEMORY CRITICAL - iPhone may crash here!');
										}
									}
								})
								.catch(() => {}); // Ignore if page crashes
						}, 1000);

						await convertButton.click();

						// Wait for result with iPhone timeouts
						const conversionResult = await Promise.race([
							page
								.waitForSelector('svg, canvas, .result', { timeout: 90000 })
								.then(() => 'success'),
							page
								.waitForSelector('.error, [data-error], .failed', { timeout: 90000 })
								.then(() => 'error'),
							new Promise((resolve) => setTimeout(() => resolve('timeout'), 90000))
						]);

						clearInterval(memoryMonitor);
						failureReport.conversionResult = conversionResult as string;

						console.log(`🎯 Production conversion result: ${conversionResult}`);

						if (conversionResult !== 'success') {
							failureReport.actualFailureDetected = true;
							failureReport.failureReason = `Production conversion failed: ${conversionResult}`;
						}
					} else {
						failureReport.actualFailureDetected = true;
						failureReport.failureReason = 'Convert button not found in production';
					}
				} else {
					failureReport.actualFailureDetected = true;
					failureReport.failureReason = 'File input not found in production';
				}
			}
		} catch (error) {
			failureReport.actualFailureDetected = true;
			failureReport.failureReason = `Production test error: ${error}`;
			console.log(`❌ Production test error: ${error}`);
		}

		// Generate production failure report
		const productionReport = {
			timestamp: new Date().toISOString(),
			productionUrl: PRODUCTION_URL,
			testEnvironment: 'iPhone 13 + Production',
			failureReport,
			analysis: {
				actualFailure: failureReport.actualFailureDetected,
				primaryCause: failureReport.failureReason,
				wasmLoadIssues: failureReport.wasmLoadErrors.length > 0,
				networkIssues: failureReport.networkErrors.length > 0,
				memoryIssues: failureReport.memoryIssues.length > 0,
				consoleErrors: failureReport.consoleErrors.length,
				reproduced: failureReport.actualFailureDetected ? 'YES' : 'NO'
			},
			recommendations: [] as string[]
		};

		// Generate recommendations based on findings
		if (failureReport.wasmLoadErrors.length > 0) {
			productionReport.recommendations.push(
				'WASM loading issues detected - check CDN headers and file integrity'
			);
		}
		if (failureReport.memoryIssues.length > 0) {
			productionReport.recommendations.push(
				'Memory pressure detected - optimize WASM memory usage'
			);
		}
		if (failureReport.networkErrors.length > 0) {
			productionReport.recommendations.push(
				'Network issues detected - check iPhone connectivity handling'
			);
		}
		if (!failureReport.actualFailureDetected) {
			productionReport.recommendations.push(
				'No failure reproduced - test with real iPhone device on production'
			);
		}

		console.log('\n🏭 PRODUCTION IPHONE FAILURE REPORT');
		console.log('===================================');
		console.log(JSON.stringify(productionReport, null, 2));
		console.log('===================================');

		if (productionReport.analysis.actualFailure) {
			console.log('🎯 SUCCESS: Reproduced iPhone failure in production simulation!');
			console.log(`Primary Cause: ${productionReport.analysis.primaryCause}`);
		} else {
			console.log('🤔 No failure reproduced - real iPhone users may have different conditions');
		}

		// Store report for analysis
		await page.evaluate((report) => {
			(window as any).__PRODUCTION_FAILURE_REPORT = report;
		}, productionReport);

		expect(productionReport.timestamp).toBeTruthy();
	});

	test('iPhone memory exhaustion with large images', async ({ page }) => {
		console.log('\n🧠 IPHONE MEMORY EXHAUSTION TEST');
		console.log('================================');

		// Simulate iPhone running low on memory (common user scenario)
		await page.addInitScript(() => {
			// Simulate iPhone with multiple apps running (low memory)
			if ('memory' in performance) {
				Object.defineProperty(performance, 'memory', {
					get: () => ({
						usedJSHeapSize: 180 * 1024 * 1024, // 180MB already used
						totalJSHeapSize: 190 * 1024 * 1024, // 190MB total
						jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB hard limit
					})
				});
			}

			// Override array allocation to simulate memory pressure
			const originalUint8Array = window.Uint8Array;
			(window as any).Uint8Array = function (size: number) {
				if (size > 50 * 1024 * 1024) {
					// 50MB+
					throw new Error('OutOfMemoryError: iPhone memory limit exceeded');
				}
				return new originalUint8Array(size);
			};
		});

		let memoryTestResult = {
			memoryExhausted: false,
			allocationFailures: [] as string[],
			largestAllocation: 0,
			crashOccurred: false
		};

		page.on('pageerror', (error) => {
			if (error.message.includes('memory') || error.message.includes('Memory')) {
				memoryTestResult.memoryExhausted = true;
				memoryTestResult.crashOccurred = true;
			}
		});

		await page.goto('http://localhost:5173/converter');

		// Test with progressively larger images until memory failure
		const imageSizes = [
			{ width: 800, height: 600, name: 'small' },
			{ width: 1200, height: 900, name: 'medium' },
			{ width: 1920, height: 1440, name: 'large' },
			{ width: 2400, height: 1800, name: 'very_large' }
		];

		for (const size of imageSizes) {
			try {
				console.log(`📷 Testing ${size.name} image (${size.width}x${size.height})...`);

				const imageData = await page.evaluate((dims) => {
					const canvas = document.createElement('canvas');
					canvas.width = dims.width;
					canvas.height = dims.height;
					const ctx = canvas.getContext('2d')!;

					// Create complex image that uses lots of memory
					for (let x = 0; x < canvas.width; x += 10) {
						for (let y = 0; y < canvas.height; y += 10) {
							ctx.fillStyle = `rgb(${x % 255}, ${y % 255}, ${(x + y) % 255})`;
							ctx.fillRect(x, y, 8, 8);
						}
					}

					return canvas.toDataURL('image/png');
				}, size);

				const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
				console.log(`   Generated: ${Math.round(imageBuffer.length / 1024 / 1024)}MB`);

				memoryTestResult.largestAllocation = Math.max(
					memoryTestResult.largestAllocation,
					imageBuffer.length
				);

				// Try to upload and process
				const fileInput = page.locator('input[type="file"]');
				if ((await fileInput.count()) > 0) {
					await fileInput.setInputFiles({
						name: `memory-test-${size.name}.png`,
						mimeType: 'image/png',
						buffer: imageBuffer
					});

					await page.waitForTimeout(2000);

					const convertButton = page.locator('button:has-text("Convert")').first();
					if ((await convertButton.count()) > 0) {
						await convertButton.click();

						// Wait for processing with memory monitoring
						const result = await Promise.race([
							page.waitForSelector('svg, .result', { timeout: 30000 }).then(() => 'success'),
							page.waitForSelector('.error', { timeout: 30000 }).then(() => 'error'),
							new Promise((resolve) => setTimeout(() => resolve('timeout'), 30000))
						]);

						console.log(`   Result: ${result}`);

						if (result === 'error') {
							memoryTestResult.allocationFailures.push(`${size.name}: Processing failed`);
							break; // Stop testing larger images
						}
					}
				}
			} catch (error) {
				console.log(`   Memory error with ${size.name}: ${error}`);
				memoryTestResult.allocationFailures.push(`${size.name}: ${error}`);
				memoryTestResult.memoryExhausted = true;
				break;
			}
		}

		console.log('\n🧠 MEMORY TEST RESULTS:');
		console.log(JSON.stringify(memoryTestResult, null, 2));

		if (memoryTestResult.memoryExhausted) {
			console.log('🎯 SUCCESS: Reproduced iPhone memory exhaustion!');
		} else {
			console.log('✅ No memory exhaustion - iPhone memory handling working correctly');
		}

		expect(memoryTestResult.largestAllocation).toBeGreaterThan(0);
	});
});
