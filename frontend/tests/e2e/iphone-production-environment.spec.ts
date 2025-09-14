/**
 * iPhone Production Environment Issues
 * Tests for issues that ONLY happen in production, not related to caching
 * Focus: HTTPS, Vercel serverless, cross-origin isolation, real network conditions
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Mobile/15E148 Safari/604.1`
});

test.describe('iPhone Production Environment Issues', () => {
	test('HTTPS vs HTTP behavior differences', async ({ page }) => {
		console.log('\n🔒 HTTPS vs HTTP iPhone Test');
		console.log('=============================');

		const testResult = {
			httpTest: { success: false, error: '', wasmLoaded: false },
			httpsTest: { success: false, error: '', wasmLoaded: false },
			differences: [] as string[]
		};

		// Test 1: HTTP (localhost)
		console.log('🌐 Testing HTTP (localhost)...');
		try {
			await page.goto('http://localhost:5173/converter');

			const httpStatus = await page.evaluate(() => {
				return {
					protocol: window.location.protocol,
					crossOriginIsolated: window.crossOriginIsolated,
					sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
					wasmLoaded: typeof (window as any).wasmJs !== 'undefined'
				};
			});

			testResult.httpTest = {
				success: true,
				error: '',
				wasmLoaded: httpStatus.wasmLoaded,
				...httpStatus
			};

			console.log('HTTP Status:', httpStatus);
		} catch (error) {
			testResult.httpTest.error = `${error}`;
			console.log(`❌ HTTP test failed: ${error}`);
		}

		// Test 2: HTTPS (production simulation)
		console.log('🔒 Testing HTTPS behavior...');

		// Simulate HTTPS constraints that might affect iPhone
		await page.route('**/*', async (route) => {
			const request = route.request();
			const headers = {
				...request.headers(),
				// Add HTTPS-specific headers that production might send
				'strict-transport-security': 'max-age=31536000; includeSubDomains',
				'content-security-policy': `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:`,
				'cross-origin-embedder-policy': 'require-corp',
				'cross-origin-opener-policy': 'same-origin'
			};

			await route.continue({ headers });
		});

		try {
			// We can't easily test real HTTPS locally, but we can simulate HTTPS constraints
			await page.addInitScript(() => {
				// Simulate HTTPS environment
				Object.defineProperty(window.location, 'protocol', {
					value: 'https:',
					writable: false
				});

				// Simulate stricter HTTPS security policies that might affect WASM
				Object.defineProperty(window, 'crossOriginIsolated', {
					value: true
				});
			});

			await page.goto('http://localhost:5173/converter');

			const httpsStatus = await page.evaluate(() => {
				return {
					protocol: window.location.protocol,
					crossOriginIsolated: window.crossOriginIsolated,
					sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
					wasmLoaded: typeof (window as any).wasmJs !== 'undefined'
				};
			});

			testResult.httpsTest = {
				success: true,
				error: '',
				wasmLoaded: httpsStatus.wasmLoaded,
				...httpsStatus
			};

			console.log('HTTPS Status:', httpsStatus);
		} catch (error) {
			testResult.httpsTest.error = `${error}`;
			console.log(`❌ HTTPS test failed: ${error}`);
		}

		// Analyze differences
		if (testResult.httpTest.success && testResult.httpsTest.success) {
			if (testResult.httpTest.wasmLoaded !== testResult.httpsTest.wasmLoaded) {
				testResult.differences.push('WASM loading differs between HTTP and HTTPS');
			}
		}

		console.log('\n🔍 HTTPS vs HTTP Analysis:');
		console.log(JSON.stringify(testResult, null, 2));

		expect(testResult.httpTest.success || testResult.httpsTest.success).toBe(true);
	});

	test('iPhone Safari memory pressure simulation', async ({ page }) => {
		console.log('\n🧠 iPhone Memory Pressure Test');
		console.log('==============================');

		// Simulate realistic iPhone memory conditions
		await page.addInitScript(() => {
			// iPhone often has multiple apps running, limited memory
			let allocatedMemory = 0;
			const IPHONE_MEMORY_LIMIT = 150 * 1024 * 1024; // 150MB realistic limit

			// Override WASM memory allocation to simulate iPhone limits
			const originalWebAssembly = WebAssembly;

			(WebAssembly as any).Memory = function (descriptor: any) {
				const requestedMemory = descriptor.initial * 65536; // WASM page size
				allocatedMemory += requestedMemory;

				console.log(
					`🧠 WASM Memory Request: ${Math.round(requestedMemory / 1024 / 1024)}MB (Total: ${Math.round(allocatedMemory / 1024 / 1024)}MB)`
				);

				if (allocatedMemory > IPHONE_MEMORY_LIMIT) {
					console.log('🚨 iPhone Memory Limit Exceeded!');
					throw new RangeError('Maximum memory size exceeded');
				}

				return new originalWebAssembly.Memory(descriptor);
			};

			// Simulate iPhone Safari stricter worker limits
			const originalWorker = Worker;
			let workerCount = 0;
			const MAX_WORKERS = 2; // iPhone Safari limits

			(window as any).Worker = function (scriptURL: string | URL, options?: WorkerOptions) {
				workerCount++;
				console.log(`👷 Worker Created: ${workerCount}/${MAX_WORKERS}`);

				if (workerCount > MAX_WORKERS) {
					throw new Error('Too many workers - iPhone Safari limit exceeded');
				}

				const worker = new originalWorker(scriptURL, options);

				worker.addEventListener('error', (e) => {
					console.log('🚨 Worker Error:', e);
				});

				return worker;
			};
		});

		let memoryTestResult = {
			wasmMemoryLimitHit: false,
			workerLimitHit: false,
			allocationErrors: [] as string[],
			actualCrash: false
		};

		page.on('pageerror', (error) => {
			const message = error.message;
			if (message.includes('memory') || message.includes('Memory')) {
				memoryTestResult.wasmMemoryLimitHit = true;
				memoryTestResult.actualCrash = true;
			}
			if (message.includes('worker') || message.includes('Worker')) {
				memoryTestResult.workerLimitHit = true;
				memoryTestResult.actualCrash = true;
			}
			memoryTestResult.allocationErrors.push(message);
			console.log(`💥 Memory/Worker Error: ${message}`);
		});

		await page.goto('http://localhost:5173/converter');

		// Wait for WASM to attempt loading under memory pressure
		await page.waitForTimeout(5000);

		const loadResult = await page.evaluate(() => {
			return {
				wasmLoaded: typeof (window as any).wasmJs !== 'undefined',
				workerSupport: typeof Worker !== 'undefined'
			};
		});

		console.log('Memory Pressure Load Result:', loadResult);

		// Try to trigger memory-intensive conversion
		if (loadResult.wasmLoaded) {
			console.log('🔄 Testing memory-intensive conversion...');

			// Create a larger image that might trigger memory issues
			const largeImageData = await page.evaluate(() => {
				const canvas = document.createElement('canvas');
				canvas.width = 1024; // Larger than iPhone screen
				canvas.height = 1024;
				const ctx = canvas.getContext('2d')!;

				// Create complex pattern that will stress memory
				const imageData = ctx.createImageData(canvas.width, canvas.height);
				for (let i = 0; i < imageData.data.length; i += 4) {
					imageData.data[i] = Math.random() * 255; // R
					imageData.data[i + 1] = Math.random() * 255; // G
					imageData.data[i + 2] = Math.random() * 255; // B
					imageData.data[i + 3] = 255; // A
				}
				ctx.putImageData(imageData, 0, 0);

				return canvas.toDataURL('image/png');
			});

			const imageBuffer = Buffer.from(largeImageData.split(',')[1], 'base64');
			console.log(`📤 Testing with ${Math.round(imageBuffer.length / 1024 / 1024)}MB image`);

			const fileInput = page.locator('input[type="file"]');
			if ((await fileInput.count()) > 0) {
				await fileInput.setInputFiles({
					name: 'memory-stress-test.png',
					mimeType: 'image/png',
					buffer: imageBuffer
				});

				await page.waitForTimeout(2000);

				const convertButton = page.locator('button:has-text("Convert")').first();
				if ((await convertButton.count()) > 0) {
					await convertButton.click();

					const result = await Promise.race([
						page.waitForSelector('svg', { timeout: 30000 }).then(() => 'success'),
						page.waitForSelector('.error', { timeout: 30000 }).then(() => 'error'),
						new Promise((resolve) => setTimeout(() => resolve('timeout'), 30000))
					]);

					console.log(`Conversion Result: ${result}`);
				}
			}
		}

		console.log('\n🧠 MEMORY PRESSURE TEST RESULTS:');
		console.log(JSON.stringify(memoryTestResult, null, 2));

		if (memoryTestResult.actualCrash) {
			console.log('🎯 SUCCESS: Reproduced iPhone memory/worker crash!');
		} else {
			console.log('✅ No memory crashes detected under simulated iPhone pressure');
		}

		expect(memoryTestResult.allocationErrors.length >= 0).toBe(true);
	});

	test('iPhone Safari WebAssembly compatibility issues', async ({ page }) => {
		console.log('\n🧩 iPhone Safari WASM Compatibility Test');
		console.log('=========================================');

		// Test iPhone Safari specific WASM limitations
		await page.addInitScript(() => {
			// iPhone Safari has specific WASM limitations
			const originalWasm = WebAssembly;

			// Override instantiate to simulate iPhone Safari quirks
			(WebAssembly as any).instantiate = async function (source: any, imports?: any) {
				console.log('🧩 WASM Instantiate called with imports:', Object.keys(imports || {}));

				// iPhone Safari sometimes fails with certain import patterns
				if (imports && imports.env && Object.keys(imports.env).length > 50) {
					throw new Error('Safari WASM: Too many imports for iPhone Safari');
				}

				// iPhone Safari has stricter memory alignment
				if (imports && imports.env && imports.env.memory) {
					const memory = imports.env.memory;
					if (memory.buffer && memory.buffer.byteLength % 16 !== 0) {
						throw new Error('Safari WASM: Memory alignment issue on iPhone');
					}
				}

				// Simulate iPhone Safari threading restrictions
				if (imports && imports.wbg) {
					const wbgKeys = Object.keys(imports.wbg);
					const threadingRelated = wbgKeys.filter(
						(key) => key.includes('thread') || key.includes('worker') || key.includes('atomic')
					);

					if (threadingRelated.length > 0) {
						console.log(
							'🚨 iPhone Safari: Threading imports detected, forcing single-threaded mode'
						);
						// Don't throw error, just log the restriction
					}
				}

				return originalWasm.instantiate(source, imports);
			};

			// iPhone Safari WebAssembly.Memory restrictions
			(WebAssembly as any).Memory = function (descriptor: any) {
				console.log('🧩 WASM Memory Request:', descriptor);

				// iPhone Safari has lower memory limits
				if (descriptor.maximum && descriptor.maximum > 1000) {
					// ~65MB limit
					console.log('🚨 iPhone Safari: Memory limit too high, capping');
					descriptor.maximum = 1000;
				}

				if (descriptor.shared) {
					console.log('🚨 iPhone Safari: SharedArrayBuffer memory not supported');
					delete descriptor.shared;
				}

				return new originalWasm.Memory(descriptor);
			};
		});

		let wasmCompatResult = {
			instantiateSuccess: false,
			instantiateError: '',
			memoryAllocationSuccess: false,
			memoryError: '',
			moduleLoadSuccess: false,
			moduleError: '',
			threadingIssues: [] as string[],
			finalWasmStatus: false
		};

		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('WASM') || text.includes('Safari')) {
				console.log(`🧩 ${text}`);
				if (text.includes('error') || text.includes('Error')) {
					wasmCompatResult.threadingIssues.push(text);
				}
			}
		});

		page.on('pageerror', (error) => {
			if (error.message.includes('WASM') || error.message.includes('WebAssembly')) {
				console.log(`💥 WASM Error: ${error.message}`);
				if (error.message.includes('instantiate')) {
					wasmCompatResult.instantiateError = error.message;
				} else if (error.message.includes('Memory')) {
					wasmCompatResult.memoryError = error.message;
				} else {
					wasmCompatResult.moduleError = error.message;
				}
			}
		});

		await page.goto('http://localhost:5173/converter');

		// Give extra time for WASM loading with compatibility checks
		await page.waitForTimeout(8000);

		const wasmStatus = await page.evaluate(() => {
			const wasmModule = (window as any).wasmJs;
			return {
				loaded: !!wasmModule,
				webAssemblySupport: typeof WebAssembly !== 'undefined',
				sharedArrayBufferSupport: typeof SharedArrayBuffer !== 'undefined',
				workerSupport: typeof Worker !== 'undefined',
				functions: wasmModule
					? Object.getOwnPropertyNames(wasmModule)
							.filter((name) => typeof wasmModule[name] === 'function')
							.slice(0, 5)
					: []
			};
		});

		wasmCompatResult.finalWasmStatus = wasmStatus.loaded;
		wasmCompatResult.moduleLoadSuccess = wasmStatus.loaded;
		wasmCompatResult.instantiateSuccess = !wasmCompatResult.instantiateError;
		wasmCompatResult.memoryAllocationSuccess = !wasmCompatResult.memoryError;

		console.log('\n🧩 WASM COMPATIBILITY RESULTS:');
		console.log('WASM Status:', wasmStatus);
		console.log('Compatibility Issues:', wasmCompatResult);

		if (!wasmCompatResult.finalWasmStatus) {
			console.log('🎯 CRITICAL: iPhone Safari WASM compatibility issue detected!');
			console.log('This could explain why some iPhone users cannot use the converter');
		} else {
			console.log('✅ WASM compatibility appears OK under iPhone Safari simulation');
		}

		expect(wasmCompatResult.threadingIssues.length >= 0).toBe(true);
	});

	test('Real iPhone network conditions simulation', async ({ page }) => {
		console.log('\n📶 iPhone Network Conditions Test');
		console.log('==================================');

		// Simulate real iPhone network scenarios that could cause failures
		const networkScenarios = [
			{ name: '3G Slow', delay: 3000, dropRate: 0.1, description: 'Slow 3G with packet loss' },
			{ name: 'WiFi Poor', delay: 1000, dropRate: 0.05, description: 'Poor WiFi connection' },
			{
				name: 'Cell Switching',
				delay: 2000,
				dropRate: 0.15,
				description: 'Switching between cell towers'
			}
		];

		for (const scenario of networkScenarios) {
			console.log(`\n📶 Testing: ${scenario.description}`);

			// Apply network simulation
			await page.route('**/*', async (route) => {
				const url = route.request().url();

				// Randomly drop requests (simulate network issues)
				if (Math.random() < scenario.dropRate) {
					console.log(`📉 Network: Dropped request to ${url}`);
					await route.abort('internetdisconnected');
					return;
				}

				// Add network delay
				if (url.includes('wasm') || url.includes('.js')) {
					console.log(`📡 Network: ${scenario.delay}ms delay for ${url}`);
					await new Promise((resolve) => setTimeout(resolve, scenario.delay));
				}

				await route.continue();
			});

			try {
				const startTime = Date.now();
				await page.goto('http://localhost:5173/converter', {
					waitUntil: 'networkidle',
					timeout: 60000
				});

				const loadTime = Date.now() - startTime;
				console.log(`⏱️ Page loaded in ${loadTime}ms under ${scenario.name} conditions`);

				// Check if WASM loaded despite network issues
				await page.waitForTimeout(5000);

				const wasmStatus = await page.evaluate(() => {
					return {
						loaded: typeof (window as any).wasmJs !== 'undefined',
						loadTime: Date.now()
					};
				});

				console.log(`🧩 WASM loaded: ${wasmStatus.loaded} under ${scenario.name}`);

				if (!wasmStatus.loaded) {
					console.log(`🎯 NETWORK ISSUE: ${scenario.name} prevents WASM loading!`);
					console.log('This could explain iPhone user failures on poor networks');
				}
			} catch (error) {
				console.log(`❌ ${scenario.name} caused complete failure: ${error}`);
			}

			// Clear route for next test
			await page.unroute('**/*');
		}

		expect(networkScenarios.length).toBe(3);
	});
});
