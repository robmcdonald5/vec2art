/**
 * WebGPU Performance Testing Suite
 *
 * Comprehensive benchmarking and testing for WebGPU-accelerated SVG to WebP conversion.
 * Measures performance improvements and validates functionality across different scenarios.
 */

import { WebGPUWebPConverter, type WebGPUWebPOptions } from './svg-webp-converter-webgpu';
import { SvgToWebPConverterV2 } from './svg-to-webp-converter-v2';

export interface PerformanceTestConfig {
	testSizes: number[];
	iterations: number;
	includeBaseline: boolean;
	enableDetailedMetrics: boolean;
	warmupRuns: number;
}

export interface TestResult {
	testName: string;
	svgSize: number;
	iterations: number;
	results: {
		webgpu?: {
			averageTime: number;
			minTime: number;
			maxTime: number;
			successRate: number;
			gpuProcessingTime: number;
			memoryTransferTime: number;
			method: string;
		};
		baseline?: {
			averageTime: number;
			minTime: number;
			maxTime: number;
			successRate: number;
			method: string;
		};
		improvement?: {
			speedup: number;
			percentageFaster: number;
		};
	};
	qualityMetrics?: {
		compressionRatio: number;
		outputSize: number;
		visualQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
	};
	errors: string[];
}

export interface BenchmarkSummary {
	totalTests: number;
	successfulTests: number;
	averageImprovement: number;
	maxImprovement: number;
	webgpuAvailability: boolean;
	recommendedUsage: string[];
	testResults: TestResult[];
	systemInfo: {
		gpu?: string;
		webgpuSupported: boolean;
		workerSupported: boolean;
		memoryLimit: number;
	};
}

/**
 * Generate test SVG with specified complexity
 */
export function generateTestSvg(
	elementCount: number,
	width: number = 2000,
	height: number = 2000
): string {
	const elements: string[] = [];

	// Add gradient definitions for complexity
	const gradients = Array.from({ length: Math.min(10, Math.ceil(elementCount / 1000)) }, (_, i) => {
		const hue1 = (i * 60) % 360;
		const hue2 = ((i + 1) * 60) % 360;
		return `
      <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue1}, 70%, 60%);stop-opacity:1" />
        <stop offset="100%" style="stop-color:hsl(${hue2}, 70%, 40%);stop-opacity:1" />
      </linearGradient>`;
	});

	// Generate diverse SVG elements
	for (let i = 0; i < elementCount; i++) {
		const x = Math.random() * width;
		const y = Math.random() * height;
		const hue = (i * 137.508) % 360; // Golden angle
		const color = `hsl(${hue}, ${60 + Math.random() * 40}%, ${30 + Math.random() * 40}%)`;
		const gradientId = `grad${i % gradients.length}`;

		const elementType = i % 7;

		switch (elementType) {
			case 0: // Complex path
				const path = `M${x},${y} Q${x + Math.random() * 100},${y + Math.random() * 100} ${x + Math.random() * 200},${y + Math.random() * 200} T${x + Math.random() * 300},${y + Math.random() * 300}`;
				elements.push(
					`<path d="${path}" stroke="${color}" stroke-width="${1 + Math.random() * 3}" fill="none" opacity="${0.6 + Math.random() * 0.4}"/>`
				);
				break;

			case 1: // Circle with gradient
				const r = 10 + Math.random() * 30;
				elements.push(
					`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${gradientId})" opacity="${0.7 + Math.random() * 0.3}"/>`
				);
				break;

			case 2: // Rectangle
				const w = 20 + Math.random() * 80;
				const h = 20 + Math.random() * 80;
				elements.push(
					`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${color}" stroke-width="2" opacity="${0.6 + Math.random() * 0.4}"/>`
				);
				break;

			case 3: // Ellipse
				const rx = 15 + Math.random() * 40;
				const ry = 15 + Math.random() * 40;
				elements.push(
					`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${0.7 + Math.random() * 0.3}"/>`
				);
				break;

			case 4: // Polygon
				const points = Array.from({ length: 3 + Math.floor(Math.random() * 5) }, (_, j) => {
					const angle = (j / 6) * Math.PI * 2;
					const radius = 20 + Math.random() * 40;
					return `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
				}).join(' ');
				elements.push(
					`<polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="1" opacity="${0.6 + Math.random() * 0.4}"/>`
				);
				break;

			case 5: // Line with complex stroke
				const x2 = Math.random() * width;
				const y2 = Math.random() * height;
				elements.push(
					`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${2 + Math.random() * 4}" stroke-dasharray="${Math.random() * 10},${Math.random() * 10}" opacity="${0.8 + Math.random() * 0.2}"/>`
				);
				break;

			case 6: // Text (occasional)
				if (i % 50 === 0) {
					elements.push(
						`<text x="${x}" y="${y}" font-family="Arial" font-size="${12 + Math.random() * 16}" fill="${color}" opacity="${0.8 + Math.random() * 0.2}">Test ${Math.floor(i / 50)}</text>`
					);
				}
				break;
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${gradients.join('')}
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="linear-gradient(45deg, #f0f9ff, #e0e7ff)"/>
  ${elements.join('\n  ')}
</svg>`;
}

/**
 * Performance testing class
 */
export class WebGPUPerformanceTester {
	private webgpuConverter: WebGPUWebPConverter;
	private baselineConverter: SvgToWebPConverterV2;
	private config: Required<PerformanceTestConfig>;

	constructor(config: Partial<PerformanceTestConfig> = {}) {
		this.config = {
			testSizes: [1000, 5000, 10000, 25000, 50000],
			iterations: 3,
			includeBaseline: true,
			enableDetailedMetrics: true,
			warmupRuns: 1,
			...config
		};

		this.webgpuConverter = new WebGPUWebPConverter();
		this.baselineConverter = new SvgToWebPConverterV2();
	}

	/**
	 * Run comprehensive performance benchmark
	 */
	async runBenchmark(): Promise<BenchmarkSummary> {
		console.log('🚀 Starting WebGPU Performance Benchmark');
		console.log('Configuration:', JSON.parse(JSON.stringify(this.config)));

		const systemInfo = await this.getSystemInfo();
		console.log('System Info:', systemInfo);

		const testResults: TestResult[] = [];
		let successfulTests = 0;
		let totalImprovement = 0;
		let maxImprovement = 0;

		// Warmup runs
		if (this.config.warmupRuns > 0) {
			console.log(`\n🏃 Running ${this.config.warmupRuns} warmup iterations...`);
			const warmupSvg = generateTestSvg(1000);

			for (let i = 0; i < this.config.warmupRuns; i++) {
				try {
					await this.webgpuConverter.convertSvgToWebP(warmupSvg, { useWebGPU: true });
					if (this.config.includeBaseline) {
						await this.baselineConverter.convertSvgToWebP(warmupSvg);
					}
				} catch (error) {
					console.warn(`Warmup ${i + 1} failed:`, error);
				}
			}
		}

		// Main test runs
		for (const [index, elementCount] of this.config.testSizes.entries()) {
			console.log(
				`\n📊 Test ${index + 1}/${this.config.testSizes.length}: ${elementCount} elements`
			);

			const testResult = await this.runSingleTest(elementCount);
			testResults.push(testResult);

			if (testResult.results.webgpu && testResult.results.improvement) {
				successfulTests++;
				totalImprovement += testResult.results.improvement.percentageFaster;
				maxImprovement = Math.max(maxImprovement, testResult.results.improvement.percentageFaster);
			}

			// Progress indicator
			const progress = (((index + 1) / this.config.testSizes.length) * 100).toFixed(1);
			console.log(`   Progress: ${progress}%`);
		}

		const averageImprovement = successfulTests > 0 ? totalImprovement / successfulTests : 0;

		const summary: BenchmarkSummary = {
			totalTests: this.config.testSizes.length,
			successfulTests,
			averageImprovement: Math.round(averageImprovement * 10) / 10,
			maxImprovement: Math.round(maxImprovement * 10) / 10,
			webgpuAvailability: systemInfo.webgpuSupported,
			recommendedUsage: this.generateRecommendations(testResults),
			testResults,
			systemInfo
		};

		this.printBenchmarkSummary(summary);
		return summary;
	}

	/**
	 * Run a single test with specified element count
	 */
	private async runSingleTest(elementCount: number): Promise<TestResult> {
		const testName = `${elementCount} elements`;
		const svgContent = generateTestSvg(elementCount);
		const svgSize = svgContent.length;

		console.log(`   SVG size: ${Math.round(svgSize / 1024)}KB`);

		const result: TestResult = {
			testName,
			svgSize,
			iterations: this.config.iterations,
			results: {},
			errors: []
		};

		// Test WebGPU converter
		const webgpuTimes: number[] = [];
		const webgpuGpuTimes: number[] = [];
		const webgpuMethods: string[] = [];
		let webgpuSuccesses = 0;
		let lastWebgpuResult: any = null;

		console.log('   Testing WebGPU converter...');
		for (let i = 0; i < this.config.iterations; i++) {
			try {
				const options: WebGPUWebPOptions = {
					useWebGPU: true,
					enableEnhancement: elementCount > 10000,
					quality: 0.8,
					maxWidth: elementCount > 25000 ? 3840 : 2048,
					maxHeight: elementCount > 25000 ? 3840 : 2048,
					onProgress: this.config.enableDetailedMetrics
						? (stage, percent) => {
								if (percent % 25 === 0) {
									console.log(`     Iteration ${i + 1}: ${stage} (${percent}%)`);
								}
							}
						: undefined
				};

				const startTime = performance.now();
				const webgpuResult = await this.webgpuConverter.convertSvgToWebP(svgContent, options);
				const endTime = performance.now();

				webgpuTimes.push(webgpuResult.conversionTimeMs);
				webgpuGpuTimes.push(webgpuResult.performance.gpuProcessingTime || 0);
				webgpuMethods.push(webgpuResult.method);
				webgpuSuccesses++;
				lastWebgpuResult = webgpuResult;

				console.log(
					`     ✅ Iteration ${i + 1}: ${Math.round(endTime - startTime)}ms (${webgpuResult.method})`
				);
			} catch (error) {
				console.log(`     ❌ Iteration ${i + 1} failed: ${error}`);
				result.errors.push(`WebGPU iteration ${i + 1}: ${error}`);
			}
		}

		if (webgpuSuccesses > 0) {
			result.results.webgpu = {
				averageTime: webgpuTimes.reduce((a, b) => a + b, 0) / webgpuTimes.length,
				minTime: Math.min(...webgpuTimes),
				maxTime: Math.max(...webgpuTimes),
				successRate: webgpuSuccesses / this.config.iterations,
				gpuProcessingTime: webgpuGpuTimes.reduce((a, b) => a + b, 0) / webgpuGpuTimes.length,
				memoryTransferTime: 0, // TODO: Extract from detailed metrics
				method: webgpuMethods[webgpuMethods.length - 1] // Last successful method
			};

			if (lastWebgpuResult) {
				result.qualityMetrics = {
					compressionRatio: lastWebgpuResult.compressionRatio,
					outputSize: Math.round(lastWebgpuResult.webpDataUrl.length * 0.75), // Approximate size
					visualQuality: this.assessVisualQuality(lastWebgpuResult.compressionRatio)
				};
			}
		}

		// Test baseline converter (if enabled)
		if (this.config.includeBaseline) {
			const baselineTimes: number[] = [];
			let baselineSuccesses = 0;

			console.log('   Testing baseline converter...');
			for (let i = 0; i < this.config.iterations; i++) {
				try {
					const startTime = performance.now();
					const baselineResult = await this.baselineConverter.convertSvgToWebP(svgContent, {
						useWorker: false, // Force CPU for fair comparison
						quality: 0.8
					});
					const endTime = performance.now();

					baselineTimes.push(baselineResult.conversionTimeMs);
					baselineSuccesses++;

					console.log(`     ✅ Baseline iteration ${i + 1}: ${Math.round(endTime - startTime)}ms`);
				} catch (error) {
					console.log(`     ❌ Baseline iteration ${i + 1} failed: ${error}`);
					result.errors.push(`Baseline iteration ${i + 1}: ${error}`);
				}
			}

			if (baselineSuccesses > 0) {
				result.results.baseline = {
					averageTime: baselineTimes.reduce((a, b) => a + b, 0) / baselineTimes.length,
					minTime: Math.min(...baselineTimes),
					maxTime: Math.max(...baselineTimes),
					successRate: baselineSuccesses / this.config.iterations,
					method: 'cpu-main-thread'
				};
			}
		}

		// Calculate improvement
		if (result.results.webgpu && result.results.baseline) {
			const webgpuTime = result.results.webgpu.averageTime;
			const baselineTime = result.results.baseline.averageTime;

			if (baselineTime > 0) {
				const speedup = baselineTime / webgpuTime;
				const percentageFaster = ((baselineTime - webgpuTime) / baselineTime) * 100;

				result.results.improvement = {
					speedup: Math.round(speedup * 100) / 100,
					percentageFaster: Math.round(percentageFaster * 10) / 10
				};

				console.log(
					`   🎯 Performance: ${speedup.toFixed(2)}x faster (${percentageFaster.toFixed(1)}% improvement)`
				);
			}
		}

		return result;
	}

	private async getSystemInfo(): Promise<BenchmarkSummary['systemInfo']> {
		const webgpuSupported = WebGPUWebPConverter.isWebGPUSupported();
		const workerSupported = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

		let gpu = 'Unknown';
		if (webgpuSupported && navigator.gpu) {
			try {
				const adapter = await navigator.gpu.requestAdapter();
				if (adapter && adapter.info) {
					gpu = adapter.info.vendor || 'Unknown GPU';
				}
			} catch (error) {
				console.warn('Could not get GPU info:', error);
			}
		}

		return {
			gpu,
			webgpuSupported,
			workerSupported,
			memoryLimit: (navigator as any).deviceMemory || 0 // Experimental API
		};
	}

	private assessVisualQuality(
		compressionRatio: number
	): 'excellent' | 'good' | 'acceptable' | 'poor' {
		if (compressionRatio > 10) return 'excellent';
		if (compressionRatio > 5) return 'good';
		if (compressionRatio > 2) return 'acceptable';
		return 'poor';
	}

	private generateRecommendations(testResults: TestResult[]): string[] {
		const recommendations: string[] = [];

		const successfulTests = testResults.filter((t) => t.results.webgpu && t.results.improvement);

		if (successfulTests.length === 0) {
			recommendations.push('WebGPU acceleration not recommended - no successful tests');
			return recommendations;
		}

		const averageImprovement =
			successfulTests.reduce((sum, t) => sum + (t.results.improvement?.percentageFaster || 0), 0) /
			successfulTests.length;

		if (averageImprovement > 100) {
			recommendations.push(
				'WebGPU provides excellent acceleration (>2x faster) - highly recommended'
			);
		} else if (averageImprovement > 50) {
			recommendations.push(
				'WebGPU provides good acceleration (>1.5x faster) - recommended for large images'
			);
		} else if (averageImprovement > 20) {
			recommendations.push('WebGPU provides moderate acceleration - recommended for complex SVGs');
		} else {
			recommendations.push(
				'WebGPU provides minimal acceleration - consider CPU processing for simple images'
			);
		}

		// Size-based recommendations
		const largeImageTests = successfulTests.filter((t) => t.svgSize > 5000000); // >5MB
		if (largeImageTests.length > 0) {
			const largeImageImprovement =
				largeImageTests.reduce(
					(sum, t) => sum + (t.results.improvement?.percentageFaster || 0),
					0
				) / largeImageTests.length;
			if (largeImageImprovement > 50) {
				recommendations.push('WebGPU especially effective for large images (>5MB)');
			}
		}

		// Method-based recommendations
		const webgpuOnlyTests = successfulTests.filter((t) => t.results.webgpu?.method === 'webgpu');
		if (webgpuOnlyTests.length / successfulTests.length > 0.8) {
			recommendations.push('GPU processing highly reliable on this system');
		}

		return recommendations;
	}

	private printBenchmarkSummary(summary: BenchmarkSummary): void {
		console.log('\n📋 WebGPU Performance Benchmark Summary');
		console.log('═'.repeat(70));
		console.log(`Tests Completed: ${summary.successfulTests}/${summary.totalTests}`);
		console.log(`Average Improvement: ${summary.averageImprovement}%`);
		console.log(`Maximum Improvement: ${summary.maxImprovement}%`);
		console.log(`WebGPU Available: ${summary.webgpuAvailability ? '✅ Yes' : '❌ No'}`);
		console.log(`GPU: ${summary.systemInfo.gpu}`);

		console.log('\n📊 Detailed Results:');
		console.log('─'.repeat(70));
		console.log(
			'Test Case'.padEnd(20) +
				'SVG Size'.padEnd(12) +
				'WebGPU'.padEnd(10) +
				'Baseline'.padEnd(10) +
				'Improvement'
		);
		console.log('─'.repeat(70));

		for (const result of summary.testResults) {
			const svgSizeStr = `${Math.round(result.svgSize / 1024)}KB`;
			const webgpuStr = result.results.webgpu
				? `${Math.round(result.results.webgpu.averageTime)}ms`
				: 'Failed';
			const baselineStr = result.results.baseline
				? `${Math.round(result.results.baseline.averageTime)}ms`
				: 'N/A';
			const improvementStr = result.results.improvement
				? `+${result.results.improvement.percentageFaster.toFixed(1)}%`
				: 'N/A';

			console.log(
				result.testName.padEnd(20) +
					svgSizeStr.padEnd(12) +
					webgpuStr.padEnd(10) +
					baselineStr.padEnd(10) +
					improvementStr
			);
		}

		console.log('─'.repeat(70));

		console.log('\n💡 Recommendations:');
		for (const recommendation of summary.recommendedUsage) {
			console.log(`   • ${recommendation}`);
		}

		console.log('\n🔧 System Compatibility:');
		console.log(`   • WebGPU Support: ${summary.systemInfo.webgpuSupported ? '✅' : '❌'}`);
		console.log(`   • Web Worker Support: ${summary.systemInfo.workerSupported ? '✅' : '❌'}`);
		console.log(`   • Device Memory: ${summary.systemInfo.memoryLimit || 'Unknown'} GB`);
		console.log(`   • GPU: ${summary.systemInfo.gpu}`);
	}

	/**
	 * Run quick performance test
	 */
	async runQuickTest(): Promise<TestResult> {
		console.log('⚡ Running Quick WebGPU Performance Test');

		this.config.testSizes = [10000]; // Medium complexity
		this.config.iterations = 2;
		this.config.warmupRuns = 0;

		const testResult = await this.runSingleTest(10000);

		console.log('\n⚡ Quick Test Results:');
		if (testResult.results.improvement) {
			console.log(`   Speedup: ${testResult.results.improvement.speedup}x`);
			console.log(`   Improvement: ${testResult.results.improvement.percentageFaster}%`);
		}

		return testResult;
	}

	/**
	 * Clean up resources
	 */
	dispose(): void {
		this.webgpuConverter.dispose();
		this.baselineConverter.dispose();
	}
}

// Export for browser console testing
if (typeof window !== 'undefined') {
	(window as any).WebGPUPerformanceTester = WebGPUPerformanceTester;
	(window as any).generateTestSvg = generateTestSvg;
	(window as any).runWebGPUBenchmark = async () => {
		const tester = new WebGPUPerformanceTester();
		const results = await tester.runBenchmark();
		tester.dispose();
		return results;
	};

	console.log('💡 WebGPU Test functions available:');
	console.log('   window.runWebGPUBenchmark() - Run full performance benchmark');
	console.log('   window.generateTestSvg(elementCount) - Generate test SVG');
	console.log('   new window.WebGPUPerformanceTester().runQuickTest() - Quick test');
}
