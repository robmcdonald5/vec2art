/**
 * Production iPhone Crash Simulation
 * Tests conditions that only exist in production deployment
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`,
	// Simulate production conditions
	extraHTTPHeaders: {
		'Accept-Encoding': 'gzip, deflate, br',
		Connection: 'keep-alive',
		// Simulate slower network
		'User-Agent':
			'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
	}
});

test.describe('Production iPhone Crash Investigation', () => {
	test('Real-world photo upload and processing', async ({ page }) => {
		console.log(`\n📱 Production iPhone Test - Real User Conditions`);

		let pageCrashed = false;
		let networkTimeouts: any[] = [];
		let serverErrors: any[] = [];
		let consoleErrors: any[] = [];

		// Track all failures
		page.on('crash', () => {
			pageCrashed = true;
			console.log('💥 PAGE CRASH DETECTED!');
		});

		page.on('pageerror', (error) => {
			consoleErrors.push({
				message: error.message,
				stack: error.stack?.substring(0, 500),
				timestamp: new Date().toISOString()
			});
			console.log(`🔴 JS ERROR: ${error.message}`);
		});

		page.on('requestfailed', (request) => {
			const failure = {
				url: request.url(),
				method: request.method(),
				failure: request.failure()?.errorText,
				timeout: request.failure()?.errorText.includes('timeout'),
				timestamp: new Date().toISOString()
			};

			if (failure.timeout) {
				networkTimeouts.push(failure);
				console.log(`⏱️ NETWORK TIMEOUT: ${request.url()}`);
			} else {
				serverErrors.push(failure);
				console.log(`🌐 REQUEST FAILED: ${request.url()} - ${failure.failure}`);
			}
		});

		page.on('response', (response) => {
			if (response.status() >= 500) {
				serverErrors.push({
					url: response.url(),
					status: response.status(),
					statusText: response.statusText(),
					timestamp: new Date().toISOString()
				});
				console.log(`🔴 SERVER ERROR: ${response.status()} ${response.url()}`);
			}
		});

		// Test with throttled network (simulating real mobile conditions)
		await page.route('**/*', async (route) => {
			// Delay all requests by 100-500ms to simulate slow mobile network
			await new Promise((resolve) => setTimeout(resolve, Math.random() * 400 + 100));
			await route.continue();
		});

		try {
			console.log('📱 Loading converter with network throttling...');

			// Navigate with extended timeout for slow conditions
			await page.goto('http://localhost:5173/converter', {
				waitUntil: 'networkidle',
				timeout: 30000
			});

			// Check for immediate crashes during page load
			if (pageCrashed) {
				console.log('💥 CRASH during page load!');
				return;
			}

			// Monitor memory from the start
			const initialMemory = await page.evaluate(() => {
				return {
					memory: (performance as any).memory
						? {
								used: (performance as any).memory.usedJSHeapSize,
								total: (performance as any).memory.totalJSHeapSize,
								limit: (performance as any).memory.jsHeapSizeLimit
							}
						: null,
					navigator: {
						hardwareConcurrency: navigator.hardwareConcurrency,
						deviceMemory: (navigator as any).deviceMemory || 'unknown'
					},
					wasmStatus: {
						webAssembly: typeof WebAssembly !== 'undefined',
						sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
						crossOriginIsolated: (window as any).crossOriginIsolated
					}
				};
			});

			console.log('🧠 Initial memory state:', initialMemory);

			// Create a realistic large photo (like users would upload)
			// High-resolution photo with lots of detail
			const largePhotoData = await page.evaluate(() => {
				// Simulate a 4MB high-resolution photo
				const canvas = document.createElement('canvas');
				canvas.width = 3000;
				canvas.height = 2000;
				const ctx = canvas.getContext('2d')!;

				// Create complex photo-like content
				const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
				gradient.addColorStop(0, '#ff6b6b');
				gradient.addColorStop(0.3, '#4ecdc4');
				gradient.addColorStop(0.7, '#45b7d1');
				gradient.addColorStop(1, '#96ceb4');
				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				// Add photo-like details that will create lots of edges
				for (let i = 0; i < 1000; i++) {
					const x = Math.random() * canvas.width;
					const y = Math.random() * canvas.height;
					const radius = Math.random() * 20 + 5;

					ctx.beginPath();
					ctx.arc(x, y, radius, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
					ctx.fill();
				}

				// Add text elements (common in user photos)
				ctx.font = '48px Arial';
				ctx.fillStyle = '#333';
				ctx.fillText('Sample Photo Content', 100, 100);
				ctx.fillText('Complex Image Details', 100, 200);

				const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
				console.log(`📷 Created realistic photo: ${Math.round(dataUrl.length / 1024)}KB`);
				return dataUrl;
			});

			// Convert to realistic file size
			const photoBuffer = Buffer.from(largePhotoData.split(',')[1], 'base64');
			console.log(`📁 Photo size: ${Math.round(photoBuffer.length / 1024)}KB`);

			// Upload the realistic photo
			const fileInput = page.locator('input[type="file"]');
			if ((await fileInput.count()) > 0) {
				console.log('📤 Uploading realistic photo...');

				await fileInput.setInputFiles({
					name: 'realistic-photo.jpg',
					mimeType: 'image/jpeg',
					buffer: photoBuffer
				});

				// Monitor for crashes during upload processing
				await page.waitForTimeout(5000);

				if (pageCrashed) {
					console.log('💥 CRASH during file upload processing!');
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

				console.log('🧠 Memory after upload:', afterUploadMemory);

				// Check if memory usage is extreme
				if (afterUploadMemory && initialMemory.memory) {
					const memoryIncrease = afterUploadMemory.used - initialMemory.memory.used;
					const percentUsed = afterUploadMemory.used / afterUploadMemory.limit;

					console.log(`📈 Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
					console.log(`📊 Memory usage: ${Math.round(percentUsed * 100)}%`);

					if (percentUsed > 0.8) {
						console.log('⚠️ CRITICAL MEMORY USAGE - Crash risk high!');
					}
				}

				// Try conversion with monitoring
				const convertButtons = page.locator('button', { hasText: 'Convert' });
				const buttonCount = await convertButtons.count();

				if (buttonCount > 0 && !pageCrashed) {
					console.log('🔄 Starting conversion with memory monitoring...');

					// Set up continuous memory monitoring
					let memoryExceeded = false;
					const memoryMonitor = setInterval(async () => {
						try {
							const currentMemory = await page.evaluate(() => {
								const mem = (performance as any).memory;
								return mem
									? {
											used: mem.usedJSHeapSize,
											limit: mem.jsHeapSizeLimit,
											percent: mem.usedJSHeapSize / mem.jsHeapSizeLimit
										}
									: null;
							});

							if (currentMemory) {
								const percent = Math.round(currentMemory.percent * 100);
								console.log(`🧠 Processing: ${percent}% memory used`);

								if (currentMemory.percent > 0.9) {
									console.log('🚨 MEMORY CRITICAL - Crash imminent!');
									memoryExceeded = true;
								}
							}
						} catch (e) {
							clearInterval(memoryMonitor);
						}
					}, 1000);

					await convertButtons.first().click();
					console.log('✅ Convert button clicked');

					// Wait for conversion with crash detection
					const conversionResult = await Promise.race([
						// Success
						page
							.waitForSelector('svg', { timeout: 180000 })
							.then(() => ({ success: true, type: 'svg' })),

						// Errors
						page
							.waitForSelector('[class*="error"]', { timeout: 180000 })
							.then(() => ({ success: false, type: 'error' })),

						// Timeout/Crash
						new Promise<any>((resolve) => {
							setTimeout(() => {
								if (pageCrashed) {
									resolve({ success: false, type: 'crash' });
								} else if (memoryExceeded) {
									resolve({ success: false, type: 'memory_exhaustion' });
								} else {
									resolve({ success: false, type: 'timeout' });
								}
							}, 180000);
						})
					]);

					clearInterval(memoryMonitor);
					console.log('🎯 Final conversion result:', conversionResult);

					if (pageCrashed) {
						console.log('💥 CONFIRMED PAGE CRASH during conversion!');
					} else if (memoryExceeded) {
						console.log('🧠 MEMORY EXHAUSTION detected - likely crash cause!');
					}
				}
			}
		} catch (error) {
			console.log(`❌ Test error: ${error}`);
			consoleErrors.push({
				error: String(error),
				timestamp: new Date().toISOString()
			});
		}

		// Generate comprehensive crash report
		const productionCrashReport = {
			pageCrashed,
			networkTimeouts: networkTimeouts.length,
			serverErrors: serverErrors.length,
			consoleErrors: consoleErrors.length,
			timestamp: new Date().toISOString(),
			details: {
				networkTimeouts,
				serverErrors: serverErrors.slice(0, 5), // Limit size
				consoleErrors: consoleErrors.slice(0, 10)
			}
		};

		console.log('\n🚨 PRODUCTION CRASH REPORT:');
		console.log('================================');
		console.log(JSON.stringify(productionCrashReport, null, 2));
		console.log('================================');

		if (pageCrashed) {
			console.log('🚨 CONFIRMED: Real crash conditions identified!');
		} else if (networkTimeouts.length > 0) {
			console.log('⏱️ Network timeouts detected - potential crash trigger');
		} else if (serverErrors.length > 0) {
			console.log('🔴 Server errors detected - potential crash trigger');
		} else {
			console.log('✅ No crashes in production simulation');
		}

		// Test passes to capture data
		expect(productionCrashReport.timestamp).toBeTruthy();
	});

	test('CSP header impact test', async ({ page }) => {
		console.log(`\n🔒 Testing Content Security Policy impact`);

		let cspErrors: any[] = [];
		let wasmLoadingIssues: any[] = [];

		page.on('pageerror', (error) => {
			if (
				error.message.includes('Content Security Policy') ||
				error.message.includes('CSP') ||
				error.message.includes('script-src') ||
				error.message.includes('unsafe-inline')
			) {
				cspErrors.push(error.message);
				console.log(`🔒 CSP ERROR: ${error.message}`);
			}

			if (
				error.message.includes('WebAssembly') ||
				error.message.includes('WASM') ||
				error.message.includes('SharedArrayBuffer') ||
				error.message.includes('Worker')
			) {
				wasmLoadingIssues.push(error.message);
				console.log(`🧵 WASM ERROR: ${error.message}`);
			}
		});

		await page.goto('http://localhost:5173/converter');

		// Check CSP headers
		const response = await page.waitForResponse(
			(response) => response.url().includes('/converter') && response.status() === 200
		);

		const cspHeader = response.headers()['content-security-policy'];
		console.log('🔒 CSP Header:', cspHeader);

		// Test WASM loading under CSP
		const wasmLoadTest = await page.evaluate(() => {
			return new Promise((resolve) => {
				const results = {
					wasmSupported: typeof WebAssembly !== 'undefined',
					sharedArrayBufferSupported: typeof SharedArrayBuffer !== 'undefined',
					workerSupported: typeof Worker !== 'undefined',
					wasmModuleLoaded: false,
					errors: [] as string[]
				};

				try {
					// Test basic WASM instantiation
					const wasmBytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

					WebAssembly.instantiate(wasmBytes)
						.then(() => {
							results.wasmModuleLoaded = true;
							resolve(results);
						})
						.catch((err) => {
							results.errors.push(`WASM instantiate failed: ${err.message}`);
							resolve(results);
						});

					// Check if our WASM module loads
					const wasmModule = (window as any).wasmJs;
					if (wasmModule) {
						results.wasmModuleLoaded = true;
					}
				} catch (error: any) {
					results.errors.push(`WASM test failed: ${error.message}`);
					resolve(results);
				}

				setTimeout(() => resolve(results), 3000);
			});
		});

		console.log('🧵 WASM load test:', wasmLoadTest);

		const cspReport = {
			cspErrors: cspErrors.length,
			wasmLoadingIssues: wasmLoadingIssues.length,
			cspHeader,
			wasmLoadTest,
			errors: { cspErrors, wasmLoadingIssues }
		};

		console.log('\n🔒 CSP Impact Report:', cspReport);

		if (cspErrors.length > 0 || wasmLoadingIssues.length > 0) {
			console.log('🚨 CSP/WASM loading issues detected - potential crash cause!');
		}
	});
});
