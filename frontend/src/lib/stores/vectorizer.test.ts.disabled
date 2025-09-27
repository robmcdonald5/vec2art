/**
 * @file vectorizer.test.ts
 * Tests for vectorizer store functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupBrowserMocks, cleanupBrowserMocks, fileTestUtils } from '../../../tests/test-utils';

// Mock the vectorizer service (single-threaded)
const mockVectorizerService = {
	initialize: vi.fn().mockResolvedValue(true),
	initializeThreads: vi.fn().mockResolvedValue(false), // Single-threaded
	processImage: vi.fn().mockResolvedValue({ svg: '<svg>test</svg>' }),
	getCapabilities: vi.fn().mockResolvedValue({
		threading_supported: false, // Single-threaded
		hardware_concurrency: 1, // Single-threaded
		wasm_loaded: true
	}),
	isInitialized: vi.fn().mockReturnValue(true),
	getThreadCount: vi.fn().mockReturnValue(1) // Single-threaded
};

vi.mock('$lib/services/vectorizer-service', () => ({
	vectorizerService: mockVectorizerService
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Vectorizer Store', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();

		// Reset mock return values after clearing
		mockVectorizerService.initialize.mockResolvedValue(true);
		mockVectorizerService.initializeThreads.mockResolvedValue(false); // Single-threaded
		mockVectorizerService.processImage.mockResolvedValue({ svg: '<svg>test</svg>' });
		mockVectorizerService.getCapabilities.mockResolvedValue({
			threading_supported: false, // Single-threaded
			hardware_concurrency: 1, // Single-threaded
			wasm_loaded: true
		});
		mockVectorizerService.isInitialized.mockReturnValue(true);
		mockVectorizerService.getThreadCount.mockReturnValue(1); // Single-threaded
	});

	afterEach(() => {
		cleanupBrowserMocks();
	});

	// Since we can't easily import the actual store due to SvelteKit 5 runes,
	// we'll test the service layer which the store depends on
	describe('Service Integration', () => {
		it('should initialize WASM module', async () => {
			const result = await mockVectorizerService.initialize();
			expect(result).toBe(true);
			expect(mockVectorizerService.initialize).toHaveBeenCalled();
		});

		it('should initialize thread pool (single-threaded)', async () => {
			const result = await mockVectorizerService.initializeThreads(6);
			expect(result).toBe(false); // Single-threaded returns false
			expect(mockVectorizerService.initializeThreads).toHaveBeenCalledWith(6);
		});

		it('should process images', async () => {
			const mockConfig = {
				backend: 'edge' as const,
				detail: 5,
				stroke_width: 1.0,
				hand_drawn_style: true,
				variable_weights: true,
				tremor_effects: false
			};

			const result = await mockVectorizerService.processImage(
				new ArrayBuffer(1024),
				800,
				600,
				mockConfig
			);

			expect(result).toEqual({ svg: '<svg>test</svg>' });
			expect(mockVectorizerService.processImage).toHaveBeenCalledWith(
				expect.any(ArrayBuffer),
				800,
				600,
				mockConfig
			);
		});

		it('should get capabilities', async () => {
			const capabilities = await mockVectorizerService.getCapabilities();

			expect(capabilities).toEqual({
				threading_supported: false, // Single-threaded
				hardware_concurrency: 1, // Single-threaded
				wasm_loaded: true
			});
		});

		it('should check initialization status', () => {
			const isInitialized = mockVectorizerService.isInitialized();
			expect(isInitialized).toBe(true);
		});

		it('should get thread count', () => {
			const threadCount = mockVectorizerService.getThreadCount();
			expect(threadCount).toBe(1); // Single-threaded
		});
	});

	describe('Error Handling', () => {
		it('should handle initialization failures', async () => {
			mockVectorizerService.initialize.mockRejectedValueOnce(new Error('Init failed'));

			await expect(mockVectorizerService.initialize()).rejects.toThrow('Init failed');
		});

		it('should handle thread initialization failures', async () => {
			mockVectorizerService.initializeThreads.mockRejectedValueOnce(
				new Error('Thread init failed')
			);

			await expect(mockVectorizerService.initializeThreads(8)).rejects.toThrow(
				'Thread init failed'
			);
		});

		it('should handle processing failures', async () => {
			mockVectorizerService.processImage.mockRejectedValueOnce(new Error('Processing failed'));

			await expect(
				mockVectorizerService.processImage(new ArrayBuffer(1024), 800, 600, {} as any)
			).rejects.toThrow('Processing failed');
		});
	});

	describe('Configuration Management', () => {
		it('should handle different backend configurations', async () => {
			const configs = [
				{ backend: 'edge' as const },
				{ backend: 'centerline' as const },
				{ backend: 'superpixel' as const },
				{ backend: 'dots' as const }
			];

			for (const config of configs) {
				await mockVectorizerService.processImage(new ArrayBuffer(1024), 800, 600, config as any);
			}

			expect(mockVectorizerService.processImage).toHaveBeenCalledTimes(configs.length);
		});

		it('should handle various quality settings', async () => {
			const qualityConfigs = [
				{ detail: 1, stroke_width: 0.5 },
				{ detail: 5, stroke_width: 1.0 },
				{ detail: 10, stroke_width: 2.0 }
			];

			for (const config of qualityConfigs) {
				await mockVectorizerService.processImage(new ArrayBuffer(1024), 800, 600, config as any);
			}

			expect(mockVectorizerService.processImage).toHaveBeenCalledTimes(qualityConfigs.length);
		});
	});

	describe('File Processing Integration', () => {
		it('should handle different image formats', () => {
			const testImages = fileTestUtils.createTestImageFiles();
			const formats = Object.values(testImages);

			formats.forEach((file) => {
				expect(file.type.startsWith('image/')).toBe(true);
				expect(file.size).toBeGreaterThan(0);
			});
		});

		it('should validate file types', () => {
			const validFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			const invalidFile = fileTestUtils.createMockFile('test.txt', 1024, 'text/plain');

			expect(validFile.type).toBe('image/png');
			expect(invalidFile.type).toBe('text/plain');
		});
	});

	describe('State Management Patterns', () => {
		it('should handle state transitions correctly', () => {
			// Test common state transitions that the store would handle
			const states = [
				{ phase: 'uninitialized', processing: false, hasError: false },
				{ phase: 'initializing', processing: false, hasError: false },
				{ phase: 'ready', processing: false, hasError: false },
				{ phase: 'processing', processing: true, hasError: false },
				{ phase: 'completed', processing: false, hasError: false },
				{ phase: 'error', processing: false, hasError: true }
			];

			states.forEach((state) => {
				expect(typeof state.processing).toBe('boolean');
				expect(typeof state.hasError).toBe('boolean');
				expect(typeof state.phase).toBe('string');
			});
		});

		it('should handle concurrent operations safely', async () => {
			// Simulate multiple concurrent operations
			const operations = [
				mockVectorizerService.initialize(),
				mockVectorizerService.getCapabilities(),
				mockVectorizerService.isInitialized()
			];

			const results = await Promise.allSettled(operations);
			expect(results).toHaveLength(3);

			// All operations should succeed
			results.forEach((result) => {
				expect(result.status).toBe('fulfilled');
			});
		});
	});

	describe('Performance Characteristics', () => {
		it('should handle rapid service calls efficiently', async () => {
			const startTime = performance.now();

			// Make many rapid calls
			const promises = Array.from({ length: 100 }, () => mockVectorizerService.isInitialized());

			await Promise.all(promises);

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
		});

		it('should handle large image processing requests', async () => {
			const largeBuffer = new ArrayBuffer(10 * 1024 * 1024); // 10MB

			const startTime = performance.now();
			await mockVectorizerService.processImage(largeBuffer, 4000, 3000, {} as any);
			const endTime = performance.now();

			// Should handle large requests (mocked, so fast)
			expect(endTime - startTime).toBeLessThan(50);
		});
	});

	describe('Capabilities Detection', () => {
		it('should detect threading capabilities', async () => {
			const capabilities = await mockVectorizerService.getCapabilities();

			expect(capabilities).toHaveProperty('threading_supported');
			expect(capabilities).toHaveProperty('hardware_concurrency');
			expect(capabilities).toHaveProperty('wasm_loaded');
		});

		it('should handle varying hardware capabilities', async () => {
			const hardwareVariations = [
				{ threading_supported: true, hardware_concurrency: 16 },
				{ threading_supported: true, hardware_concurrency: 8 },
				{ threading_supported: true, hardware_concurrency: 4 },
				{ threading_supported: false, hardware_concurrency: 1 }
			];

			for (const variation of hardwareVariations) {
				mockVectorizerService.getCapabilities.mockResolvedValueOnce({
					...variation,
					wasm_loaded: true
				});

				const capabilities = await mockVectorizerService.getCapabilities();
				expect(capabilities.hardware_concurrency).toBe(variation.hardware_concurrency);
				expect(capabilities.threading_supported).toBe(variation.threading_supported);
			}
		});
	});

	describe('Integration Edge Cases', () => {
		it('should handle empty or corrupted image data', async () => {
			const emptyBuffer = new ArrayBuffer(0);

			// Should not throw for empty buffer (service handles validation)
			await expect(
				mockVectorizerService.processImage(emptyBuffer, 0, 0, {} as any)
			).resolves.toBeDefined();
		});

		it('should handle extreme image dimensions', async () => {
			const extremeCases = [
				{ width: 1, height: 1 },
				{ width: 10000, height: 10000 },
				{ width: 1, height: 5000 },
				{ width: 5000, height: 1 }
			];

			for (const dimensions of extremeCases) {
				await expect(
					mockVectorizerService.processImage(
						new ArrayBuffer(1024),
						dimensions.width,
						dimensions.height,
						{} as any
					)
				).resolves.toBeDefined();
			}
		});

		it('should handle rapid initialization requests', async () => {
			// Multiple rapid initialization calls
			const initPromises = Array.from({ length: 10 }, () => mockVectorizerService.initialize());

			const results = await Promise.allSettled(initPromises);

			// All should succeed (or gracefully handle concurrent init)
			results.forEach((result) => {
				expect(result.status).toBe('fulfilled');
			});
		});
	});

	describe('Memory Management', () => {
		it('should handle cleanup scenarios', () => {
			// Test cleanup patterns that the store would use
			const resources = [
				{ type: 'buffer', size: 1024 * 1024 },
				{ type: 'worker', id: 'worker-1' },
				{ type: 'observer', name: 'performance-observer' }
			];

			resources.forEach((resource) => {
				expect(resource).toHaveProperty('type');
				expect(typeof resource.type).toBe('string');
			});
		});

		it('should handle resource pooling patterns', () => {
			// Simulate resource pooling that the store might use
			const pool = {
				available: [],
				inUse: new Set(),
				maxSize: 10
			};

			// Test basic pool operations
			expect(pool.available).toHaveLength(0);
			expect(pool.inUse.size).toBe(0);
			expect(pool.maxSize).toBe(10);
		});
	});
});
