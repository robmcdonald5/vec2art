/**
 * iPhone Safari Crash Investigation Test
 * Simulates conditions that cause real iPhone Safari crashes
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`
});

test.describe('iPhone Safari Crash Investigation', () => {
	test('Large image processing crash test', async ({ page }) => {
		console.log(`\n🚨 iPhone Crash Test - Large Image Processing`);

		// Track page crashes
		let pageCrashed = false;
		let pageErrors: any[] = [];
		let memoryIssues: any[] = [];

		page.on('crash', () => {
			pageCrashed = true;
			console.log('💥 PAGE CRASHED!');
		});

		page.on('pageerror', (error) => {
			pageErrors.push({
				message: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString()
			});
			console.log(`💥 PAGE ERROR: ${error.message}`);
		});

		// Monitor memory warnings
		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('memory') || text.includes('Memory') || text.includes('heap')) {
				memoryIssues.push({
					type: msg.type(),
					text: text,
					timestamp: new Date().toISOString()
				});
				console.log(`🧠 MEMORY WARNING: ${text}`);
			}
		});

		try {
			console.log('📱 Loading converter page...');
			await page.goto('http://localhost:5173/converter');
			await page.waitForLoadState('networkidle');

			// Create a realistic large image that might cause crashes
			const largeImage = await page.evaluate(() => {
				// Create a 2MB+ realistic image data
				const canvas = document.createElement('canvas');
				canvas.width = 1920;
				canvas.height = 1080;
				const ctx = canvas.getContext('2d');

				// Fill with complex pattern that will create a lot of edge data
				for (let x = 0; x < canvas.width; x += 10) {
					for (let y = 0; y < canvas.height; y += 10) {
						ctx!.fillStyle = `rgb(${x % 255}, ${y % 255}, ${(x + y) % 255})`;
						ctx!.fillRect(x, y, 5, 5);
					}
				}

				return canvas.toDataURL('image/png');
			});

			console.log(`📷 Created large test image: ${Math.round(largeImage.length / 1024)}KB`);

			// Convert to blob and upload
			const largeImageBlob = await page.evaluate((dataUrl) => {
				const arr = dataUrl.split(',');
				const mime = arr[0].match(/:(.*?);/)?.[1];
				const bstr = atob(arr[1]);
				const u8arr = new Uint8Array(bstr.length);
				for (let i = 0; i < bstr.length; i++) {
					u8arr[i] = bstr.charCodeAt(i);
				}
				return new File([u8arr], 'large-test.png', { type: mime });
			}, largeImage);

			// Monitor memory before upload
			const beforeMemory = await page.evaluate(() => {
				return (performance as any).memory
					? {
							used: (performance as any).memory.usedJSHeapSize,
							total: (performance as any).memory.totalJSHeapSize,
							limit: (performance as any).memory.jsHeapSizeLimit
						}
					: null;
			});

			console.log(`🧠 Memory before upload:`, beforeMemory);

			// Upload the large file
			const fileInput = page.locator('input[type="file"]');
			if ((await fileInput.count()) > 0) {
				// Create a real large file buffer
				const imageBuffer = Buffer.from(largeImage.split(',')[1], 'base64');
				console.log(`📁 Uploading ${Math.round(imageBuffer.length / 1024)}KB file...`);

				await fileInput.setInputFiles({
					name: 'large-crash-test.png',
					mimeType: 'image/png',
					buffer: imageBuffer
				});

				// Wait and monitor for crashes during file processing
				await page.waitForTimeout(3000);

				if (pageCrashed) {
					console.log('💥 CRASH DETECTED: Page crashed during file upload');
					return;
				}

				// Check memory after upload
				const afterUploadMemory = await page.evaluate(() => {
					return (performance as any).memory
						? {
								used: (performance as any).memory.usedJSHeapSize,
								total: (performance as any).memory.totalJSHeapSize,
								limit: (performance as any).memory.jsHeapSizeLimit
							}
						: null;
				});

				console.log(`🧠 Memory after upload:`, afterUploadMemory);

				if (afterUploadMemory && beforeMemory) {
					const memoryIncrease = afterUploadMemory.used - beforeMemory.used;
					console.log(`📈 Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

					if (memoryIncrease > 100 * 1024 * 1024) {
						// 100MB increase
						console.log('⚠️ EXCESSIVE MEMORY USAGE DETECTED');
					}
				}

				// Try conversion - this is where crashes likely occur
				const convertButtons = page.locator('button', { hasText: 'Convert' });
				const buttonCount = await convertButtons.count();

				if (buttonCount > 0) {
					console.log('🔄 Starting conversion - monitoring for crash...');

					// Monitor memory during conversion
					const memoryMonitor = setInterval(async () => {
						try {
							const currentMemory = await page.evaluate(() => {
								return (performance as any).memory
									? (performance as any).memory.usedJSHeapSize
									: null;
							});
							if (currentMemory) {
								console.log(`🧠 During conversion: ${Math.round(currentMemory / 1024 / 1024)}MB`);
							}
						} catch (e) {
							clearInterval(memoryMonitor);
						}
					}, 1000);

					await convertButtons.first().click();
					console.log('✅ Convert button clicked');

					// Wait longer for large image processing
					const conversionResult = await Promise.race([
						// Success indicators
						page
							.waitForSelector('svg', { timeout: 120000 })
							.then(() => ({ success: true, type: 'svg' })),
						page
							.waitForSelector('[class*="error"]', { timeout: 120000 })
							.then(() => ({ success: false, type: 'error' })),

						// Crash detection
						new Promise((resolve) =>
							setTimeout(() => {
								if (pageCrashed) {
									resolve({ success: false, type: 'crash' });
								} else {
									resolve({ success: false, type: 'timeout' });
								}
							}, 120000)
						)
					]);

					clearInterval(memoryMonitor);
					console.log('🎯 Conversion result:', conversionResult);

					if (pageCrashed) {
						console.log('💥 CRASH CONFIRMED: Page crashed during conversion');
					}
				}
			}

			// Final memory check
			const finalMemory = await page.evaluate(() => {
				return (performance as any).memory
					? {
							used: (performance as any).memory.usedJSHeapSize,
							total: (performance as any).memory.totalJSHeapSize,
							limit: (performance as any).memory.jsHeapSizeLimit
						}
					: null;
			});

			console.log(`🧠 Final memory:`, finalMemory);
		} catch (error) {
			console.log(`❌ Test error: ${error}`);
			pageErrors.push({ error: error, timestamp: new Date().toISOString() });
		}

		// Generate crash report
		const crashReport = {
			pageCrashed,
			pageErrors: pageErrors.length,
			memoryIssues: memoryIssues.length,
			timestamp: new Date().toISOString(),
			errors: pageErrors,
			memoryWarnings: memoryIssues
		};

		console.log('\n💥 CRASH INVESTIGATION REPORT:');
		console.log('================================');
		console.log(JSON.stringify(crashReport, null, 2));
		console.log('================================');

		// Store crash data
		await page.evaluate((report) => {
			(window as any).__IPHONE_CRASH_REPORT = report;
		}, crashReport);

		if (pageCrashed) {
			console.log('🚨 CRITICAL: PAGE CRASH DETECTED - This explains user reports!');
		} else if (pageErrors.length > 0) {
			console.log(`⚠️ ${pageErrors.length} page errors detected - potential crash causes`);
		} else {
			console.log('✅ No crashes detected - investigating other causes needed');
		}

		// Test should pass to capture full data
		expect(crashReport.timestamp).toBeTruthy();
	});

	test('Memory exhaustion test', async ({ page }) => {
		console.log(`\n🧠 iPhone Memory Exhaustion Test`);

		let memoryExhausted = false;
		let outOfMemoryErrors: any[] = [];

		page.on('pageerror', (error) => {
			if (error.message.includes('memory') || error.message.includes('Memory')) {
				memoryExhausted = true;
				outOfMemoryErrors.push(error.message);
				console.log(`💥 MEMORY ERROR: ${error.message}`);
			}
		});

		await page.goto('http://localhost:5173/converter');

		// Try to exhaust memory with multiple large operations
		const memoryTest = await page.evaluate(() => {
			return new Promise((resolve) => {
				const results = {
					maxArraySize: 0,
					memoryExhausted: false,
					errors: [] as string[]
				};

				try {
					// Try to allocate increasingly large arrays
					let size = 1024 * 1024; // Start with 1MB
					const arrays: Uint8Array[] = [];

					while (size < 500 * 1024 * 1024) {
						// Up to 500MB
						try {
							const arr = new Uint8Array(size);
							arrays.push(arr);
							results.maxArraySize = size;
							size *= 2;

							// Check if we're near memory limit
							if ((performance as any).memory) {
								const memory = (performance as any).memory;
								const usedPercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
								if (usedPercent > 0.8) {
									// 80% of limit
									console.log(`🧠 Memory usage: ${Math.round(usedPercent * 100)}%`);
									if (usedPercent > 0.95) break;
								}
							}
						} catch (e: any) {
							results.memoryExhausted = true;
							results.errors.push(e.message);
							console.log(`💥 Memory allocation failed: ${e.message}`);
							break;
						}
					}
				} catch (e: any) {
					results.errors.push(e.message);
				}

				resolve(results);
			});
		});

		console.log('🧠 Memory exhaustion test results:', memoryTest);

		if (memoryExhausted || outOfMemoryErrors.length > 0) {
			console.log('🚨 MEMORY EXHAUSTION DETECTED - This could cause crashes!');
		}
	});

	test('WASM thread pool crash test', async ({ page }) => {
		console.log(`\n🧵 iPhone WASM Threading Crash Test`);

		let threadingCrashed = false;
		let threadErrors: any[] = [];

		page.on('pageerror', (error) => {
			if (
				error.message.includes('thread') ||
				error.message.includes('worker') ||
				error.message.includes('SharedArrayBuffer')
			) {
				threadingCrashed = true;
				threadErrors.push(error.message);
				console.log(`🧵 THREADING ERROR: ${error.message}`);
			}
		});

		await page.goto('http://localhost:5173/converter');

		// Test WASM threading limits
		const threadingTest = await page.evaluate(() => {
			return new Promise((resolve) => {
				const results = {
					maxThreadsSupported: 0,
					threadingCrashed: false,
					wasmAvailable: false,
					sharedArrayBufferAvailable: false,
					errors: [] as string[]
				};

				try {
					results.wasmAvailable = typeof WebAssembly !== 'undefined';
					results.sharedArrayBufferAvailable = typeof SharedArrayBuffer !== 'undefined';

					// Try to detect thread limits
					if (results.sharedArrayBufferAvailable) {
						// Test SharedArrayBuffer limits
						for (let i = 1; i <= 16; i++) {
							try {
								const sab = new SharedArrayBuffer(1024 * 1024); // 1MB per thread
								results.maxThreadsSupported = i;
							} catch (e: any) {
								results.errors.push(`Thread ${i}: ${e.message}`);
								break;
							}
						}
					}

					// Check if WASM module is available and test threading
					const wasmModule = (window as any).wasmJs;
					if (wasmModule) {
						try {
							if (typeof wasmModule.is_threading_supported === 'function') {
								const threadingSupported = wasmModule.is_threading_supported();
								console.log(`🧵 WASM threading supported: ${threadingSupported}`);
							}
							if (typeof wasmModule.get_thread_count === 'function') {
								const threadCount = wasmModule.get_thread_count();
								console.log(`🧵 Current thread count: ${threadCount}`);
								results.maxThreadsSupported = threadCount;
							}
						} catch (e: any) {
							results.threadingCrashed = true;
							results.errors.push(`WASM threading error: ${e.message}`);
						}
					}
				} catch (e: any) {
					results.threadingCrashed = true;
					results.errors.push(e.message);
				}

				resolve(results);
			});
		});

		console.log('🧵 Threading test results:', threadingTest);

		if (threadingCrashed || threadErrors.length > 0) {
			console.log('🚨 THREADING ISSUES DETECTED - Potential crash cause!');
		}
	});
});
