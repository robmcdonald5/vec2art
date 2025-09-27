/**
 * Tests for config transformation between frontend and WASM formats
 */

import { describe, it, expect } from 'vitest';
import { toWasmConfig, fromWasmConfig, validateConfigTransform } from './config-transformer';
import { parseAlgorithmConfig, validateForAlgorithm } from './config-schema';
import type { AlgorithmConfig } from './config-schema';

describe('Config Transformer', () => {
	describe('toWasmConfig', () => {
		it('should transform basic edge config', () => {
			const frontendConfig: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 2,
				noiseFiltering: true,
				enableBackgroundRemoval: true,
				backgroundRemovalStrength: 0.7
			};

			const wasmConfig = toWasmConfig(frontendConfig);

			expect(wasmConfig.backend).toBe('Edge');
			expect(wasmConfig.detail).toBe(5);
			expect(wasmConfig.stroke_px_at_1080p).toBe(2);
			expect(wasmConfig.noise_filtering).toBe(true);
			expect(wasmConfig.enable_background_removal).toBe(true);
			expect(wasmConfig.background_removal_strength).toBe(0.7);
		});

		it('should handle centerline config', () => {
			const frontendConfig: AlgorithmConfig = {
				algorithm: 'centerline',
				detail: 3,
				strokeWidth: 1,
				enableAdaptiveThreshold: false,
				adaptiveThresholdWindowSize: 35,
				adaptiveThresholdK: 0.5
			};

			const wasmConfig = toWasmConfig(frontendConfig);

			expect(wasmConfig.backend).toBe('Centerline');
			expect(wasmConfig.enable_adaptive_threshold).toBe(false);
			expect(wasmConfig.adaptive_threshold_window_size).toBe(35);
			expect(wasmConfig.adaptive_threshold_k).toBe(0.5);
		});

		it('should handle dots config', () => {
			const frontendConfig: AlgorithmConfig = {
				algorithm: 'dots',
				detail: 7,
				strokeWidth: 1.5,
				minRadius: 1,
				maxRadius: 5,
				preserveColors: true
			};

			const wasmConfig = toWasmConfig(frontendConfig);

			expect(wasmConfig.backend).toBe('Dots');
			expect(wasmConfig.dot_min_radius).toBe(1);
			expect(wasmConfig.dot_max_radius).toBe(5);
			expect(wasmConfig.dot_preserve_colors).toBe(true);
		});

		it('should handle superpixel config', () => {
			const frontendConfig: AlgorithmConfig = {
				algorithm: 'superpixel',
				detail: 4,
				strokeWidth: 2,
				numSuperpixels: 300,
				compactness: 15,
				iterations: 12
			};

			const wasmConfig = toWasmConfig(frontendConfig);

			expect(wasmConfig.backend).toBe('Superpixel');
			expect(wasmConfig.num_superpixels).toBe(300);
			expect(wasmConfig.superpixel_compactness).toBe(15);
			expect(wasmConfig.superpixel_slic_iterations).toBe(12);
		});

		it('should apply defaults for missing fields', () => {
			const minimalConfig: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 1.5
			};

			const wasmConfig = toWasmConfig(minimalConfig);

			expect(wasmConfig.noise_filtering).toBe(false);
			expect(wasmConfig.enable_background_removal).toBe(false);
			expect(wasmConfig.enable_multipass).toBe(false);
			expect(wasmConfig.pass_count).toBe(1);
		});
	});

	describe('fromWasmConfig', () => {
		it('should transform WASM config back to frontend format', () => {
			const frontendConfig: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 2,
				noiseFiltering: true,
				preserveColors: true
			};

			const wasmConfig = toWasmConfig(frontendConfig);
			const backToFrontend = fromWasmConfig(wasmConfig);

			expect(backToFrontend.algorithm).toBe('edge');
			expect(backToFrontend.detail).toBe(5);
			expect(backToFrontend.strokeWidth).toBe(2);
			expect(backToFrontend.noiseFiltering).toBe(true);
			expect(backToFrontend.preserveColors).toBe(true);
		});
	});

	describe('validateConfigTransform', () => {
		it('should validate valid config', () => {
			const config: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 2
			};

			const errors = validateConfigTransform(config);
			expect(errors).toHaveLength(0);
		});

		it('should catch invalid detail level', () => {
			const config: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 15, // Invalid: > 10
				strokeWidth: 2
			};

			const errors = validateConfigTransform(config);
			expect(errors).toContain('Detail must be between 0 and 10, got 15');
		});

		it('should catch invalid stroke width', () => {
			const config: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 15 // Invalid: > 10
			};

			const errors = validateConfigTransform(config);
			expect(errors).toContain('Stroke width must be between 0.1 and 10, got 15');
		});

		it('should catch invalid dots radius configuration', () => {
			const config: AlgorithmConfig = {
				algorithm: 'dots',
				detail: 5,
				strokeWidth: 2,
				minRadius: 5,
				maxRadius: 2 // Invalid: min > max
			};

			const errors = validateConfigTransform(config);
			expect(errors).toContain('Min radius cannot be greater than max radius');
		});
	});

	describe('Zod Schema Validation', () => {
		it('should parse valid config', () => {
			const rawConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 2
			};

			const parsed = parseAlgorithmConfig(rawConfig);
			expect(parsed.algorithm).toBe('edge');
			expect(parsed.detail).toBe(5);
		});

		it('should reject invalid algorithm', () => {
			const rawConfig = {
				algorithm: 'invalid',
				detail: 5,
				strokeWidth: 2
			};

			expect(() => parseAlgorithmConfig(rawConfig)).toThrow();
		});

		it('should apply defaults', () => {
			const rawConfig = {
				algorithm: 'edge',
				detail: 5
				// strokeWidth not provided
			};

			const parsed = parseAlgorithmConfig(rawConfig);
			expect(parsed.strokeWidth).toBe(1.5); // Default value
		});
	});

	describe('Algorithm-specific Validation', () => {
		it('should validate edge custom preset', () => {
			const config: AlgorithmConfig = {
				algorithm: 'edge',
				detail: 5,
				strokeWidth: 2,
				handDrawnPreset: 'custom'
				// No custom values set
			};

			const errors = validateForAlgorithm(config);
			expect(errors).toContain(
				'Custom hand-drawn preset requires at least one parameter to be set'
			);
		});

		it('should validate dots radius range', () => {
			const config: AlgorithmConfig = {
				algorithm: 'dots',
				detail: 5,
				strokeWidth: 2,
				minRadius: 5,
				maxRadius: 2
			};

			const errors = validateForAlgorithm(config);
			expect(errors).toContain('Min radius cannot be greater than max radius');
		});
	});
});
