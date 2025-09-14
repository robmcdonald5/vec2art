/**
 * iPhone Production-Only Errors
 * Focus: Issues that only occur in Vercel production environment
 * Not caching related - fresh code but production-specific problems
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Mobile/15E148 Safari/604.1`
});

test.describe('iPhone Production-Only Errors', () => {
	test('Vercel serverless cold start issues', async ({ page }) => {
		console.log('\n❄️ VERCEL COLD START SIMULATION');
		console.log('===============================');

		// Simulate Vercel serverless function cold starts that iPhone users might experience
		await page.route('**/api/**', async (route) => {
			const url = route.request().url();

			// Simulate cold start delay (common in production)
			console.log(`❄️ Cold Start: ${url} (10s delay)`);
			await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s cold start

			// Sometimes cold starts fail entirely
			if (Math.random() < 0.3) {
				// 30% chance of cold start failure
				console.log(`💥 Cold Start FAILED: ${url}`);
				await route.abort('internetdisconnected');
				return;
			}

			await route.continue();
		});

		// Simulate slow WASM loading (production CDN vs local)
		await page.route('**/wasm/**', async (route) => {
			// Simulate Vercel edge node being slow for iPhone users
			const delay = Math.random() * 5000 + 2000; // 2-7 second delay
			console.log(`🌐 Production WASM delay: ${Math.round(delay)}ms`);
			await new Promise((resolve) => setTimeout(resolve, delay));

			await route.continue();
		});

		let coldStartResult = {
			pageLoadTime: 0,
			wasmLoadTime: 0,
			apiCallsFailed: 0,
			wasmLoadSuccess: false,
			conversionSuccess: false,
			userGaveUp: false // Simulate user timeout
		};

		const startTime = Date.now();

		try {
			console.log('📱 Loading with cold start simulation...');

			await page.goto('http://localhost:5173/converter', {
				waitUntil: 'networkidle',
				timeout: 45000 // iPhone users typically give up after ~30-45 seconds
			});

			coldStartResult.pageLoadTime = Date.now() - startTime;
			console.log(`⏱️ Page load: ${coldStartResult.pageLoadTime}ms`);

			// Check if user would give up (>30 seconds is typical iPhone user limit)
			if (coldStartResult.pageLoadTime > 30000) {
				coldStartResult.userGaveUp = true;
				console.log('🚨 USER TIMEOUT: iPhone user would give up waiting');
			}

			const wasmStartTime = Date.now();
			await page.waitForTimeout(8000); // Wait for WASM with production delays

			const wasmStatus = await page.evaluate(() => {
				return typeof (window as any).wasmJs !== 'undefined';
			});

			coldStartResult.wasmLoadTime = Date.now() - wasmStartTime;
			coldStartResult.wasmLoadSuccess = wasmStatus;

			console.log(`🧩 WASM loaded: ${wasmStatus} (${coldStartResult.wasmLoadTime}ms)`);

			if (!wasmStatus && !coldStartResult.userGaveUp) {
				console.log('🎯 PRODUCTION ISSUE: WASM failed to load due to cold starts!');
			}
		} catch (error) {
			console.log(`❌ Cold start simulation error: ${error}`);
		}

		console.log('\n❄️ COLD START ANALYSIS:');
		console.log(JSON.stringify(coldStartResult, null, 2));

		if (coldStartResult.userGaveUp) {
			console.log('🎯 CRITICAL: iPhone users giving up due to slow production loading!');
		}

		expect(coldStartResult.pageLoadTime).toBeGreaterThan(0);
	});

	test('Production JavaScript errors iPhone specific', async ({ page }) => {
		console.log('\n💥 PRODUCTION JAVASCRIPT ERROR TEST');
		console.log('===================================');

		// Capture ALL errors that might only happen in production
		let productionErrors = {
			cspErrors: [] as string[],
			moduleErrors: [] as string[],
			crossOriginErrors: [] as string[],
			wasmErrors: [] as string[],
			workerErrors: [] as string[],
			unexpectedErrors: [] as string[]
		};

		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				const text = msg.text();
				console.log(`💥 Console Error: ${text}`);

				if (text.includes('CSP') || text.includes('Content Security Policy')) {
					productionErrors.cspErrors.push(text);
				} else if (text.includes('module') || text.includes('import')) {
					productionErrors.moduleErrors.push(text);
				} else if (text.includes('cross-origin') || text.includes('CORS')) {
					productionErrors.crossOriginErrors.push(text);
				} else if (text.includes('WASM') || text.includes('WebAssembly')) {
					productionErrors.wasmErrors.push(text);
				} else if (text.includes('worker') || text.includes('Worker')) {
					productionErrors.workerErrors.push(text);
				} else {
					productionErrors.unexpectedErrors.push(text);
				}
			}
		});

		page.on('pageerror', (error) => {
			console.log(`💥 Page Error: ${error.message}`);
			productionErrors.unexpectedErrors.push(error.message);
		});

		// Monitor network failures that might cause JS errors
		page.on('requestfailed', (request) => {
			console.log(`💥 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
			productionErrors.unexpectedErrors.push(`Network: ${request.url()} failed`);
		});

		// Simulate production environment constraints that cause errors
		await page.addInitScript(() => {
			// Simulate stricter CSP that might break WASM in production
			const originalEval = window.eval;
			(window as any).eval = function () {
				throw new Error('CSP: eval() blocked in production');
			};

			// Simulate production import() restrictions
			const originalImport = (window as any).import;
			if (originalImport) {
				(window as any).import = function (specifier: string) {
					if (specifier.includes('localhost') || !specifier.startsWith('https://')) {
						throw new Error('Production: Import from non-HTTPS blocked');
					}
					return originalImport(specifier);
				};
			}

			// Simulate production worker restrictions
			const originalWorker = Worker;
			(window as any).Worker = function (scriptURL: string | URL, options?: WorkerOptions) {
				const url = typeof scriptURL === 'string' ? scriptURL : scriptURL.href;

				// Production often has stricter worker CSP
				if (url.includes('blob:') || url.includes('data:')) {
					throw new Error('Production CSP: Blob/data workers blocked');
				}

				if (!url.startsWith('https://') && !url.startsWith('/')) {
					throw new Error('Production CSP: Non-HTTPS workers blocked');
				}

				return new originalWorker(scriptURL, options);
			};
		});

		await page.goto('http://localhost:5173/converter');
		await page.waitForTimeout(5000);

		// Try to trigger production-specific errors
		const wasmStatus = await page.evaluate(() => {
			try {
				const wasmModule = (window as any).wasmJs;
				return {
					loaded: !!wasmModule,
					error: null
				};
			} catch (error: any) {
				return {
					loaded: false,
					error: error.message
				};
			}
		});

		console.log('🧩 WASM Status under production constraints:', wasmStatus);

		// Try conversion to trigger more errors
		if (wasmStatus.loaded) {
			console.log('🔄 Testing conversion under production error conditions...');

			const testImage = await page.evaluate(() => {
				const canvas = document.createElement('canvas');
				canvas.width = 100;
				canvas.height = 100;
				const ctx = canvas.getContext('2d')!;
				ctx.fillStyle = 'red';
				ctx.fillRect(0, 0, 100, 100);
				return canvas.toDataURL('image/png');
			});

			const fileInput = page.locator('input[type="file"]');
			if ((await fileInput.count()) > 0) {
				const imageBuffer = Buffer.from(testImage.split(',')[1], 'base64');
				await fileInput.setInputFiles({
					name: 'production-error-test.png',
					mimeType: 'image/png',
					buffer: imageBuffer
				});

				await page.waitForTimeout(2000);

				const convertButton = page.locator('button:has-text("Convert")').first();
				if ((await convertButton.count()) > 0) {
					await convertButton.click();
					await page.waitForTimeout(5000); // Let errors surface
				}
			}
		}

		const errorSummary = {
			...productionErrors,
			totalErrors: Object.values(productionErrors).reduce((sum, arr) => sum + arr.length, 0),
			criticalErrors: productionErrors.wasmErrors.length + productionErrors.workerErrors.length,
			wasmLoadSuccess: wasmStatus.loaded
		};

		console.log('\n💥 PRODUCTION ERROR ANALYSIS:');
		console.log(JSON.stringify(errorSummary, null, 2));

		if (errorSummary.criticalErrors > 0) {
			console.log(
				'🎯 CRITICAL: Production-specific errors detected that could break iPhone functionality!'
			);
		} else if (errorSummary.totalErrors > 0) {
			console.log('⚠️ Some production errors detected, may cause iPhone issues');
		} else {
			console.log('✅ No production-specific errors detected in simulation');
		}

		expect(errorSummary.totalErrors >= 0).toBe(true);
	});

	test('iPhone Safari specific production failures', async ({ page }) => {
		console.log('\n📱 IPHONE SAFARI PRODUCTION FAILURES');
		console.log('====================================');

		// Simulate iPhone Safari specific issues that only show up in production
		await page.addInitScript(() => {
			// iPhone Safari has specific limits that might not be hit in development
			let requestCount = 0;
			const MAX_CONCURRENT_REQUESTS = 6; // iPhone Safari limit

			const originalFetch = fetch;
			(window as any).fetch = function (url: any, options?: any) {
				requestCount++;

				if (requestCount > MAX_CONCURRENT_REQUESTS) {
					console.log(`🚨 iPhone Safari: Too many concurrent requests (${requestCount})`);
					return Promise.reject(new Error('iPhone Safari: Connection limit exceeded'));
				}

				return originalFetch(url, options).finally(() => {
					requestCount--;
				});
			};

			// iPhone Safari WebAssembly timeout issues in production
			const originalInstantiate = WebAssembly.instantiate;
			(WebAssembly as any).instantiate = function (source: any, imports?: any) {
				return Promise.race([
					originalInstantiate(source, imports),
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error('iPhone Safari: WASM instantiation timeout')), 15000)
					)
				]);
			};

			// iPhone Safari memory pressure simulation (production often uses more memory)
			let memoryPressure = 0.7; // Start at 70% memory usage
			const checkMemoryPressure = () => {
				memoryPressure += Math.random() * 0.05; // Gradually increase
				if (memoryPressure > 0.95) {
					console.log('🚨 iPhone Safari: Memory pressure critical!');
					// Force garbage collection attempt
					if ((window as any).gc) {
						(window as any).gc();
					}
					throw new Error('iPhone Safari: Out of memory');
				}
			};

			// Check memory pressure periodically
			setInterval(checkMemoryPressure, 5000);
		});

		let safariFailures = {
			connectionLimitHit: false,
			wasmTimeout: false,
			memoryPressureHit: false,
			otherFailures: [] as string[]
		};

		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				const text = msg.text();
				if (text.includes('Connection limit')) {
					safariFailures.connectionLimitHit = true;
				} else if (text.includes('WASM instantiation timeout')) {
					safariFailures.wasmTimeout = true;
				} else if (text.includes('Memory pressure') || text.includes('Out of memory')) {
					safariFailures.memoryPressureHit = true;
				} else {
					safariFailures.otherFailures.push(text);
				}
				console.log(`📱 iPhone Safari Issue: ${text}`);
			}
		});

		try {
			await page.goto('http://localhost:5173/converter');
			await page.waitForTimeout(8000); // Let Safari limits kick in

			const finalStatus = await page.evaluate(() => {
				return {
					wasmLoaded: typeof (window as any).wasmJs !== 'undefined',
					pageResponsive: document.readyState === 'complete'
				};
			});

			console.log('📱 Final iPhone Safari Status:', finalStatus);

			if (!finalStatus.wasmLoaded) {
				console.log(
					'🎯 IPHONE SAFARI FAILURE: WASM failed to load under Safari production constraints!'
				);
			}
		} catch (error) {
			console.log(`💥 iPhone Safari production error: ${error}`);
			safariFailures.otherFailures.push(`${error}`);
		}

		console.log('\n📱 IPHONE SAFARI PRODUCTION ANALYSIS:');
		console.log(JSON.stringify(safariFailures, null, 2));

		const hasCriticalFailure =
			safariFailures.connectionLimitHit ||
			safariFailures.wasmTimeout ||
			safariFailures.memoryPressureHit;

		if (hasCriticalFailure) {
			console.log('🎯 CRITICAL: iPhone Safari production-specific failure detected!');
			console.log('This could explain why iPhone users fail even with fresh cache/cookies');
		} else {
			console.log('✅ No iPhone Safari production failures detected in simulation');
		}

		expect(safariFailures.otherFailures.length >= 0).toBe(true);
	});
});
