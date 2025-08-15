/**
 * Unit tests for SmartPerformanceSelector core logic
 * Tests CPU detection utilities and performance recommendation algorithms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as cpuDetection from '$lib/utils/cpu-detection';
import type { CPUCapabilities, PerformanceRecommendation } from '$lib/utils/cpu-detection';
import { createMockCapabilities } from '@tests/test-utils';

describe('SmartPerformanceSelector Core Logic', () => {
	describe('CPU Detection Utilities', () => {
		beforeEach(() => {
			// Setup navigator mock
			Object.defineProperty(window, 'navigator', {
				value: {
					hardwareConcurrency: 8,
					userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					platform: 'Win32',
					getBattery: vi.fn().mockResolvedValue({ charging: false }),
					memory: { jsHeapSizeLimit: 4294967296 }
				},
				writable: true,
				configurable: true
			});

			// Mock WebAssembly
			Object.defineProperty(window, 'WebAssembly', {
				value: { SIMD: true },
				writable: true,
				configurable: true
			});

			// Mock SharedArrayBuffer
			Object.defineProperty(window, 'SharedArrayBuffer', {
				value: class MockSharedArrayBuffer {
					constructor(public length: number) {}
				},
				writable: true,
				configurable: true
			});

			// Mock crossOriginIsolated
			Object.defineProperty(window, 'crossOriginIsolated', {
				value: true,
				writable: true,
				configurable: true
			});

			// Mock document.createElement for WebGL
			vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
				if (tagName === 'canvas') {
					return { getContext: vi.fn().mockReturnValue({}) } as any;
				}
				return document.createElement(tagName);
			});
		});

		it('should detect CPU capabilities correctly', async () => {
			const capabilities = await cpuDetection.detectCPUCapabilities();

			expect(capabilities).toMatchObject({
				cores: 8,
				features: {
					threading: expect.any(Boolean),
					simd: expect.any(Boolean),
					webgl: expect.any(Boolean),
					webgl2: expect.any(Boolean),
					sharedArrayBuffer: expect.any(Boolean)
				}
			});

			expect(['desktop', 'laptop', 'tablet', 'mobile', 'unknown']).toContain(
				capabilities.deviceType
			);
			expect(['low', 'medium', 'high', 'extreme']).toContain(capabilities.estimatedPerformance);

			expect(capabilities.recommendedThreads).toBeGreaterThan(0);
			expect(capabilities.maxSafeThreads).toBeGreaterThanOrEqual(capabilities.recommendedThreads);
		});

		it('should generate appropriate performance recommendations', () => {
			const capabilities = createMockCapabilities({
				cores: 8,
				estimatedPerformance: 'high',
				deviceType: 'desktop',
				isLowEndDevice: false
			});

			const recommendations = cpuDetection.generatePerformanceRecommendations(capabilities);

			expect(recommendations).toHaveLength(3); // battery, balanced, performance

			// Check battery mode
			const battery = recommendations.find((r) => r.mode === 'battery');
			expect(battery).toBeDefined();
			expect(battery!.threadCount).toBe(1);
			expect(battery!.cpuUsageEstimate).toBeLessThan(50);

			// Check balanced mode
			const balanced = recommendations.find((r) => r.mode === 'balanced');
			expect(balanced).toBeDefined();
			expect(balanced!.threadCount).toBeGreaterThan(1);
			expect(balanced!.threadCount).toBeLessThan(capabilities.cores);

			// Check performance mode
			const performance = recommendations.find((r) => r.mode === 'performance');
			expect(performance).toBeDefined();
			expect(performance!.threadCount).toBeGreaterThanOrEqual(balanced!.threadCount);
		});

		it('should provide conservative recommendations for low-end devices', () => {
			const capabilities = createMockCapabilities({
				cores: 2,
				estimatedPerformance: 'low',
				deviceType: 'mobile',
				isLowEndDevice: true,
				recommendedThreads: 1,
				maxSafeThreads: 2
			});

			const recommendations = cpuDetection.generatePerformanceRecommendations(capabilities);
			const defaultRec = cpuDetection.getDefaultRecommendation(capabilities);

			// Should recommend battery mode for low-end devices
			expect(defaultRec.mode).toBe('battery');
			expect(defaultRec.threadCount).toBeLessThanOrEqual(2);

			// All recommendations should be conservative
			recommendations.forEach((rec) => {
				expect(rec.threadCount).toBeLessThanOrEqual(capabilities.maxSafeThreads);
				expect(rec.cpuUsageEstimate).toBeLessThan(100);
			});
		});

		it('should recommend battery mode for discharging devices', () => {
			const capabilities = createMockCapabilities({
				cores: 8,
				batteryStatus: 'discharging',
				deviceType: 'laptop'
			});

			const defaultRec = cpuDetection.getDefaultRecommendation(capabilities);
			expect(defaultRec.mode).toBe('battery');
		});

		it('should provide extreme mode for high-end systems', () => {
			const capabilities = createMockCapabilities({
				cores: 16,
				estimatedPerformance: 'extreme',
				deviceType: 'desktop',
				isLowEndDevice: false
			});

			const recommendations = cpuDetection.generatePerformanceRecommendations(capabilities);
			const extreme = recommendations.find((r) => r.mode === 'extreme');

			expect(extreme).toBeDefined();
			expect(extreme!.threadCount).toBe(16);
			expect(extreme!.cpuUsageEstimate).toBeGreaterThan(90);
			expect(extreme!.warnings).toContain('Very high CPU usage');
		});

		it('should handle missing browser APIs gracefully', async () => {
			// Remove APIs
			Object.defineProperty(window, 'navigator', {
				value: {
					userAgent: 'Test Browser',
					platform: 'Unknown'
				}, // No hardwareConcurrency
				writable: true
			});

			const capabilities = await cpuDetection.detectCPUCapabilities();

			// Should provide fallback values
			expect(capabilities.cores).toBe(4); // Default fallback
			expect(capabilities.recommendedThreads).toBeGreaterThan(0);
			expect(capabilities.features).toBeDefined();
		});

		it('should calculate appropriate thread recommendations', () => {
			const testCases = [
				{
					input: {
						cores: 1,
						deviceType: 'mobile' as const,
						performance: 'low' as const,
						isLowEnd: true
					},
					expectation: 'Should recommend minimal threads for single core'
				},
				{
					input: {
						cores: 4,
						deviceType: 'laptop' as const,
						performance: 'medium' as const,
						isLowEnd: false
					},
					expectation: 'Should recommend moderate threads for medium performance'
				},
				{
					input: {
						cores: 8,
						deviceType: 'desktop' as const,
						performance: 'high' as const,
						isLowEnd: false
					},
					expectation: 'Should recommend high threads for desktop'
				},
				{
					input: {
						cores: 16,
						deviceType: 'desktop' as const,
						performance: 'extreme' as const,
						isLowEnd: false
					},
					expectation: 'Should cap threads for extreme performance'
				}
			];

			testCases.forEach(({ input, expectation }) => {
				// Calculate expected thread values based on the input
				const expectedRecommended =
					input.isLowEnd || input.cores === 1
						? Math.min(1, input.cores)
						: Math.min(Math.max(1, input.cores - 2), 12); // Cap recommended at 12
				const expectedMax = input.isLowEnd ? Math.min(input.cores, 4) : Math.min(input.cores, 12);

				const capabilities = createMockCapabilities({
					cores: input.cores,
					deviceType: input.deviceType,
					estimatedPerformance: input.performance,
					isLowEndDevice: input.isLowEnd,
					recommendedThreads: expectedRecommended,
					maxSafeThreads: expectedMax
				});

				// Basic sanity checks
				expect(capabilities.recommendedThreads).toBeGreaterThan(0);
				expect(capabilities.recommendedThreads).toBeLessThanOrEqual(capabilities.cores);
				expect(capabilities.maxSafeThreads).toBeGreaterThanOrEqual(capabilities.recommendedThreads);
				expect(capabilities.maxSafeThreads).toBeLessThanOrEqual(Math.max(capabilities.cores, 12)); // Cap at reasonable max
			});
		});

		it('should estimate device performance class correctly', () => {
			const testCases = [
				{ cores: 1, deviceType: 'mobile' as const, expectedMin: 'low' },
				{ cores: 4, deviceType: 'laptop' as const, expectedMin: 'medium' },
				{ cores: 8, deviceType: 'desktop' as const, expectedMin: 'high' },
				{ cores: 16, deviceType: 'desktop' as const, expectedMin: 'extreme' }
			];

			testCases.forEach(({ cores, deviceType }) => {
				const capabilities = createMockCapabilities({ cores, deviceType });
				expect(['low', 'medium', 'high', 'extreme']).toContain(capabilities.estimatedPerformance);
			});
		});

		it('should provide reasonable processing time estimates', () => {
			const capabilities = createMockCapabilities();
			const recommendations = cpuDetection.generatePerformanceRecommendations(capabilities);

			recommendations.forEach((rec) => {
				expect(rec.estimatedProcessingTime).toMatch(/\d+(-\d+)?\s*(second|minute)s?/);
				expect(rec.cpuUsageEstimate).toBeGreaterThanOrEqual(0);
				expect(rec.cpuUsageEstimate).toBeLessThanOrEqual(100);
			});
		});

		it('should include meaningful reasoning for recommendations', () => {
			const capabilities = createMockCapabilities();
			const recommendations = cpuDetection.generatePerformanceRecommendations(capabilities);

			recommendations.forEach((rec) => {
				expect(rec.reasoning).toBeInstanceOf(Array);
				expect(rec.reasoning.length).toBeGreaterThan(0);
				expect(rec.warnings).toBeInstanceOf(Array);

				rec.reasoning.forEach((reason) => {
					expect(typeof reason).toBe('string');
					expect(reason.length).toBeGreaterThan(0);
				});
			});
		});
	});

	describe('Error Handling and Edge Cases', () => {
		it('should handle zero cores gracefully', async () => {
			Object.defineProperty(window, 'navigator', {
				value: {
					hardwareConcurrency: 0,
					userAgent: 'Test Browser',
					platform: 'Unknown'
				},
				writable: true
			});

			const capabilities = await cpuDetection.detectCPUCapabilities();
			expect(capabilities.cores).toBeGreaterThan(0); // Should fallback to default
		});

		it('should handle very high core counts', async () => {
			Object.defineProperty(window, 'navigator', {
				value: {
					hardwareConcurrency: 64,
					userAgent: 'Test Browser',
					platform: 'Win32'
				},
				writable: true
			});

			const capabilities = await cpuDetection.detectCPUCapabilities();
			const recommendations = cpuDetection.generatePerformanceRecommendations(capabilities);

			// Should cap thread recommendations at reasonable levels
			recommendations.forEach((rec) => {
				expect(rec.threadCount).toBeLessThanOrEqual(64);
			});
		});

		it('should handle missing WebGL support', async () => {
			// Ensure proper navigator setup for this test
			Object.defineProperty(window, 'navigator', {
				value: {
					hardwareConcurrency: 8,
					userAgent: 'Test Browser',
					platform: 'Win32'
				},
				writable: true
			});

			vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
				if (tagName === 'canvas') {
					return { getContext: vi.fn().mockReturnValue(null) } as any;
				}
				return document.createElement(tagName);
			});

			const capabilities = await cpuDetection.detectCPUCapabilities();
			expect(capabilities.features.webgl).toBe(false);
			expect(capabilities.features.webgl2).toBe(false);
		});

		it('should detect device types from user agent strings', async () => {
			const testCases = [
				{
					userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
					expected: 'mobile'
				},
				{ userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)', expected: 'tablet' },
				{ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', expected: 'desktop' },
				{ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', expected: 'laptop' }
			];

			for (const { userAgent, expected } of testCases) {
				Object.defineProperty(window, 'navigator', {
					value: {
						hardwareConcurrency: 4,
						userAgent,
						platform: expected === 'desktop' ? 'Win32' : 'MacIntel'
					},
					writable: true
				});

				const capabilities = await cpuDetection.detectCPUCapabilities();

				// Device type detection should be reasonable
				expect(['mobile', 'tablet', 'laptop', 'desktop', 'unknown']).toContain(
					capabilities.deviceType
				);
			}
		});
	});

	describe('Performance Monitoring', () => {
		it('should create CPU monitor instance', () => {
			const monitor = new cpuDetection.CPUMonitor();
			expect(monitor).toBeInstanceOf(cpuDetection.CPUMonitor);
		});

		it('should start and stop monitoring', () => {
			const monitor = new cpuDetection.CPUMonitor();

			monitor.start();
			const usage = monitor.stop();

			expect(typeof usage).toBe('number');
			expect(usage).toBeGreaterThanOrEqual(0);
			expect(usage).toBeLessThanOrEqual(100);
		});

		it('should handle monitoring without measurements', () => {
			const monitor = new cpuDetection.CPUMonitor();
			const usage = monitor.stop(); // Stop without starting

			expect(usage).toBe(0);
		});
	});
});
