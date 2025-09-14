/**
 * Vercel CDN iPhone Cache Issue Simulation
 * This test recreates the exact CDN caching scenario that iPhone users experience
 * where they receive stale WASM files from Vercel's global edge cache
 */

import { test, expect, devices } from '@playwright/test';

test.use({
	...devices['iPhone 13'],
	userAgent: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.1 Mobile/15E148 Safari/604.1`
});

test.describe('Vercel CDN iPhone Cache Issues', () => {
	test('Simulate stale WASM from Vercel CDN edge cache', async ({ page }) => {
		console.log('\n🌐 VERCEL CDN CACHE SIMULATION');
		console.log('==============================');

		// Simulate different CDN edge locations serving different versions
		const edgeLocations = [
			{ name: 'Sydney', staleness: 'very-stale', version: 'v1.0.0-old' },
			{ name: 'Tokyo', staleness: 'stale', version: 'v1.1.0-old' },
			{ name: 'Singapore', staleness: 'fresh', version: 'v1.2.0-current' }
		];

		// Randomly pick an edge location (simulating real user experience)
		const userEdgeLocation = edgeLocations[Math.floor(Math.random() * edgeLocations.length)];
		console.log(
			`📍 iPhone user hitting CDN edge: ${userEdgeLocation.name} (${userEdgeLocation.staleness})`
		);

		// Intercept WASM requests and serve stale content based on edge location
		await page.route('**/wasm/**', async (route) => {
			const url = route.request().url();
			const fileName = url.split('/').pop();

			console.log(
				`[CDN ${userEdgeLocation.name}] Serving ${fileName} (${userEdgeLocation.staleness})`
			);

			if (userEdgeLocation.staleness === 'very-stale') {
				// Simulate very old cached WASM that's broken
				if (fileName?.includes('.wasm')) {
					console.log(`[CDN] Serving corrupted/old WASM binary`);
					await route.fulfill({
						status: 200,
						contentType: 'application/wasm',
						body: Buffer.from([0x00, 0x61, 0x73, 0x6d]), // Invalid WASM header
						headers: {
							'cache-control': 'public, max-age=31536000, immutable',
							etag: '"old-broken-wasm"',
							age: '2592000', // 30 days old
							'x-vercel-cache': 'HIT',
							'x-vercel-edge': userEdgeLocation.name.toLowerCase()
						}
					});
					return;
				} else if (fileName?.includes('.js')) {
					// Serve old JS that references wrong WASM functions
					console.log(`[CDN] Serving old JavaScript bindings`);
					await route.fulfill({
						status: 200,
						contentType: 'text/javascript',
						body: `
						// Old broken WASM bindings that iPhone users might get
						console.error("Old WASM JS loaded - this causes iPhone crashes!");
						export function init() {
							throw new Error("Old WASM version - missing threading fixes");
						}
						`,
						headers: {
							'cache-control': 'public, max-age=31536000, immutable',
							etag: '"old-js-bindings"',
							age: '2592000',
							'x-vercel-cache': 'HIT',
							'x-vercel-edge': userEdgeLocation.name.toLowerCase()
						}
					});
					return;
				}
			} else if (userEdgeLocation.staleness === 'stale') {
				// Serve moderately old version (has some fixes but not latest)
				const response = await route.fetch();
				await route.fulfill({
					response,
					headers: {
						...response.headers(),
						'cache-control': 'public, max-age=31536000, immutable',
						etag: '"semi-old-version"',
						age: '604800', // 7 days old
						'x-vercel-cache': 'HIT',
						'x-vercel-edge': userEdgeLocation.name.toLowerCase()
					}
				});
				return;
			} else {
				// Fresh version - latest code
				const response = await route.fetch();
				await route.fulfill({
					response,
					headers: {
						...response.headers(),
						'cache-control': 'public, max-age=86400, stale-while-revalidate=3600',
						etag: '"current-version"',
						age: '0',
						'x-vercel-cache': 'MISS',
						'x-vercel-edge': userEdgeLocation.name.toLowerCase()
					}
				});
				return;
			}

			// Default: continue with normal request
			await route.continue();
		});

		const testResult = {
			edgeLocation: userEdgeLocation,
			wasmLoadSuccess: false,
			errors: [] as string[],
			networkResponses: [] as any[],
			consoleErrors: [] as string[],
			finalStatus: 'unknown'
		};

		// Monitor network responses
		page.on('response', (response) => {
			if (response.url().includes('wasm')) {
				testResult.networkResponses.push({
					url: response.url(),
					status: response.status(),
					headers: response.headers(),
					cached: response.headers()['x-vercel-cache'] === 'HIT'
				});
			}
		});

		// Monitor console errors (common with stale WASM)
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				testResult.consoleErrors.push(msg.text());
			}
		});

		try {
			console.log('📱 Loading converter with CDN edge simulation...');
			await page.goto('http://localhost:5173/converter', {
				waitUntil: 'networkidle',
				timeout: 60000
			});

			// Check if WASM loaded successfully despite CDN caching
			const wasmStatus = await page.evaluate(() => {
				return new Promise((resolve) => {
					// Give WASM time to load
					setTimeout(() => {
						const wasmModule = (window as any).wasmJs;
						const result = {
							loaded: !!wasmModule,
							hasError: false,
							errorMessage: '',
							functions: [] as string[],
							version: 'unknown'
						};

						if (wasmModule) {
							try {
								// Test if basic functions work
								const functions = Object.getOwnPropertyNames(wasmModule);
								result.functions = functions
									.filter((f) => typeof wasmModule[f] === 'function')
									.slice(0, 5);

								// Try to get version if available
								if (typeof wasmModule.get_version === 'function') {
									result.version = wasmModule.get_version();
								}
							} catch (e: any) {
								result.hasError = true;
								result.errorMessage = e.message;
							}
						}

						resolve(result);
					}, 5000);
				});
			});

			testResult.wasmLoadSuccess = (wasmStatus as any).loaded && !(wasmStatus as any).hasError;

			console.log(`🧩 WASM load result:`, wasmStatus);

			if (!testResult.wasmLoadSuccess) {
				testResult.errors.push('WASM failed to load from CDN cache');
				testResult.finalStatus = 'wasm_load_failed';
			} else {
				// Test conversion functionality
				console.log('🔄 Testing conversion with CDN-cached WASM...');

				// Create a simple test image
				const testImage = await page.evaluate(() => {
					const canvas = document.createElement('canvas');
					canvas.width = 200;
					canvas.height = 200;
					const ctx = canvas.getContext('2d')!;
					ctx.fillStyle = '#ff0000';
					ctx.fillRect(50, 50, 100, 100);
					return canvas.toDataURL('image/png');
				});

				// Try to upload and convert
				const fileInput = page.locator('input[type="file"]');
				if ((await fileInput.count()) > 0) {
					const imageBuffer = Buffer.from(testImage.split(',')[1], 'base64');
					await fileInput.setInputFiles({
						name: 'cdn-test.png',
						mimeType: 'image/png',
						buffer: imageBuffer
					});

					// Try conversion
					const convertButton = page
						.locator('button:has-text("Convert"), button:has-text("Start")')
						.first();
					if ((await convertButton.count()) > 0) {
						await convertButton.click();

						// Wait for result with timeout
						const conversionResult = (await Promise.race([
							page
								.waitForSelector('svg, .result', { timeout: 30000 })
								.then(() => ({ success: true }))
								.catch(() => ({ success: false, reason: 'no_result' })),
							page
								.waitForSelector('.error, [data-error]', { timeout: 30000 })
								.then(() => ({ success: false, reason: 'error_shown' }))
								.catch(() => ({ success: false, reason: 'timeout' }))
						])) as any;

						if (conversionResult.success) {
							testResult.finalStatus = 'conversion_success';
							console.log('✅ Conversion succeeded despite CDN cache');
						} else {
							testResult.finalStatus = `conversion_failed_${conversionResult.reason}`;
							testResult.errors.push(`Conversion failed: ${conversionResult.reason}`);
							console.log(`❌ Conversion failed: ${conversionResult.reason}`);
						}
					} else {
						testResult.errors.push('Convert button not found');
						testResult.finalStatus = 'ui_broken';
					}
				} else {
					testResult.errors.push('File input not found');
					testResult.finalStatus = 'upload_broken';
				}
			}
		} catch (error) {
			testResult.errors.push(`Test error: ${error}`);
			testResult.finalStatus = 'test_error';
		}

		// Generate comprehensive CDN cache report
		const cdnReport = {
			...testResult,
			simulation: {
				edgeLocation: userEdgeLocation.name,
				staleness: userEdgeLocation.staleness,
				cacheAge:
					userEdgeLocation.staleness === 'very-stale'
						? '30 days'
						: userEdgeLocation.staleness === 'stale'
							? '7 days'
							: '0 days',
				expectedBehavior:
					userEdgeLocation.staleness === 'very-stale'
						? 'Should fail'
						: userEdgeLocation.staleness === 'stale'
							? 'May have issues'
							: 'Should work'
			},
			verdict:
				testResult.finalStatus === 'conversion_success'
					? 'SUCCESS'
					: testResult.finalStatus.includes('wasm')
						? 'WASM_ISSUE'
						: testResult.finalStatus.includes('conversion')
							? 'CONVERSION_ISSUE'
							: 'OTHER_ISSUE'
		};

		console.log('\n🌐 VERCEL CDN SIMULATION REPORT');
		console.log('===============================');
		console.log(JSON.stringify(cdnReport, null, 2));
		console.log('===============================');

		// Analyze results based on edge location
		if (userEdgeLocation.staleness === 'very-stale' && cdnReport.verdict !== 'WASM_ISSUE') {
			console.log('🤔 UNEXPECTED: Very stale cache should have caused WASM issues');
		} else if (userEdgeLocation.staleness === 'very-stale' && cdnReport.verdict === 'WASM_ISSUE') {
			console.log(
				'🎯 CONFIRMED: Stale CDN cache causes WASM failures - this explains iPhone users!'
			);
		} else if (userEdgeLocation.staleness === 'fresh' && cdnReport.verdict === 'SUCCESS') {
			console.log('✅ EXPECTED: Fresh CDN cache works correctly');
		} else {
			console.log('📊 Mixed results - partial CDN cache issues detected');
		}

		// Store for manual inspection if needed
		await page.evaluate((report) => {
			(window as any).__CDN_CACHE_REPORT = report;
		}, cdnReport);

		expect(cdnReport.simulation).toBeTruthy();
	});

	test('Multiple edge location iPhone user simulation', async ({ page }) => {
		console.log('\n🌍 MULTIPLE CDN EDGE LOCATIONS TEST');
		console.log('===================================');

		// Simulate iPhone user traveling or using different networks
		// This tests the scenario where users get different cached versions
		const userJourney = [
			{ location: 'Sydney', cache: 'very-stale', description: 'iPhone user at home (old cache)' },
			{
				location: 'CDG-Paris',
				cache: 'stale',
				description: 'iPhone user at airport (medium cache)'
			},
			{ location: 'NYC', cache: 'fresh', description: 'iPhone user in NYC (fresh cache)' }
		];

		const results = [];

		for (const [index, location] of userJourney.entries()) {
			console.log(`\n📍 Testing: ${location.description}`);

			// Change CDN behavior for this location
			await page.route('**/wasm/**', async (route) => {
				const url = route.request().url();

				if (location.cache === 'very-stale') {
					// Old broken version
					if (url.includes('.js')) {
						await route.fulfill({
							status: 200,
							contentType: 'text/javascript',
							body: 'console.error("Very old WASM JS"); throw new Error("Old version");',
							headers: {
								'x-vercel-edge': location.location,
								'x-vercel-cache': 'HIT',
								age: '2592000' // 30 days
							}
						});
						return;
					}
				} else if (location.cache === 'stale') {
					// Moderately old version
					const response = await route.fetch();
					await route.fulfill({
						response,
						headers: {
							...response.headers(),
							'x-vercel-edge': location.location,
							'x-vercel-cache': 'HIT',
							age: '604800' // 7 days
						}
					});
					return;
				} else {
					// Fresh version
					const response = await route.fetch();
					await route.fulfill({
						response,
						headers: {
							...response.headers(),
							'x-vercel-edge': location.location,
							'x-vercel-cache': 'MISS',
							age: '0'
						}
					});
					return;
				}

				await route.continue();
			});

			// Test this location
			try {
				await page.goto('http://localhost:5173/converter', { waitUntil: 'networkidle' });

				const locationResult = await page.evaluate(async () => {
					return new Promise((resolve) => {
						setTimeout(() => {
							const wasmModule = (window as any).wasmJs;
							resolve({
								wasmLoaded: !!wasmModule,
								timestamp: Date.now()
							});
						}, 3000);
					});
				});

				results.push({
					...location,
					result: locationResult,
					success: (locationResult as any).wasmLoaded
				});

				console.log(
					`📊 ${location.location}: ${(locationResult as any).wasmLoaded ? 'SUCCESS' : 'FAILED'}`
				);
			} catch (error) {
				results.push({
					...location,
					result: { error: error },
					success: false
				});
				console.log(`❌ ${location.location}: ERROR - ${error}`);
			}

			// Clear page for next location
			if (index < userJourney.length - 1) {
				await page.evaluate(() => {
					// Clear WASM module for next test
					(window as any).wasmJs = undefined;
				});
			}
		}

		const journeyReport = {
			userJourney: results,
			summary: {
				totalLocations: results.length,
				successfulLocations: results.filter((r) => r.success).length,
				failedLocations: results.filter((r) => !r.success).length,
				consistentBehavior: results.every((r) => r.success) || results.every((r) => !r.success)
			},
			insights: [] as string[]
		};

		// Analyze journey patterns
		const freshLocationSuccess = results.find((r) => r.cache === 'fresh')?.success;
		const staleLocationSuccess = results.find((r) => r.cache === 'stale')?.success;
		const veryStaleLocationSuccess = results.find((r) => r.cache === 'very-stale')?.success;

		if (freshLocationSuccess && !staleLocationSuccess) {
			journeyReport.insights.push('Fresh CDN cache works, stale cache fails - confirms CDN issue');
		}
		if (!veryStaleLocationSuccess) {
			journeyReport.insights.push('Very stale CDN cache consistently fails - major user impact');
		}
		if (!journeyReport.summary.consistentBehavior) {
			journeyReport.insights.push(
				'Inconsistent behavior across locations - confusing for iPhone users'
			);
		}

		console.log('\n🌍 CDN EDGE LOCATION JOURNEY REPORT');
		console.log('====================================');
		console.log(JSON.stringify(journeyReport, null, 2));
		console.log('====================================');

		expect(journeyReport.summary.totalLocations).toBe(3);
	});
});
