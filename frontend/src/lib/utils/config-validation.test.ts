import { describe, it, expect } from 'vitest';
import {
	validateArtisticEffects,
	clampArtisticEffects,
	detectPresetFromValues
} from './config-validation';
import type { VectorizerConfig } from '$lib/types/vectorizer';

describe('config-validation', () => {
	describe('validateArtisticEffects', () => {
		it('should validate correct ranges', () => {
			const config = {
				variable_weights: 0.5,
				tremor_strength: 0.25,
				tapering: 0.8
			};

			const errors = validateArtisticEffects(config);
			expect(errors).toHaveLength(0);
		});

		it('should detect out-of-range variable_weights', () => {
			const config = { variable_weights: 1.5 };
			const errors = validateArtisticEffects(config);

			expect(errors).toHaveLength(1);
			expect(errors[0].field).toBe('variable_weights');
			expect(errors[0].min).toBe(0.0);
			expect(errors[0].max).toBe(1.0);
		});

		it('should detect out-of-range tremor_strength', () => {
			const config = { tremor_strength: 0.8 };
			const errors = validateArtisticEffects(config);

			expect(errors).toHaveLength(1);
			expect(errors[0].field).toBe('tremor_strength');
			expect(errors[0].max).toBe(0.5);
		});

		it('should detect out-of-range tapering', () => {
			const config = { tapering: -0.1 };
			const errors = validateArtisticEffects(config);

			expect(errors).toHaveLength(1);
			expect(errors[0].field).toBe('tapering');
			expect(errors[0].min).toBe(0.0);
		});
	});

	describe('clampArtisticEffects', () => {
		it('should clamp values to valid ranges', () => {
			const config = {
				variable_weights: 1.5,
				tremor_strength: 0.8,
				tapering: -0.1
			};

			const clamped = clampArtisticEffects(config);

			expect(clamped.variable_weights).toBe(1.0);
			expect(clamped.tremor_strength).toBe(0.5);
			expect(clamped.tapering).toBe(0.0);
		});

		it('should preserve valid values', () => {
			const config = {
				variable_weights: 0.5,
				tremor_strength: 0.25,
				tapering: 0.8
			};

			const clamped = clampArtisticEffects(config);

			expect(clamped.variable_weights).toBe(0.5);
			expect(clamped.tremor_strength).toBe(0.25);
			expect(clamped.tapering).toBe(0.8);
		});
	});

	describe('detectPresetFromValues', () => {
		it('should detect "none" preset', () => {
			const config = {
				variable_weights: 0.0,
				tremor_strength: 0.0,
				tapering: 0.0
			} as VectorizerConfig;

			const preset = detectPresetFromValues(config);
			expect(preset).toBe('none');
		});

		it('should detect "medium" preset', () => {
			const config = {
				variable_weights: 0.3,
				tremor_strength: 0.15,
				tapering: 0.4
			} as VectorizerConfig;

			const preset = detectPresetFromValues(config);
			expect(preset).toBe('medium');
		});

		it('should return null for custom values', () => {
			const config = {
				variable_weights: 0.7,
				tremor_strength: 0.1,
				tapering: 0.9
			} as VectorizerConfig;

			const preset = detectPresetFromValues(config);
			expect(preset).toBe(null);
		});

		it('should handle floating point precision', () => {
			const config = {
				variable_weights: 0.300001, // Close to medium preset (0.3)
				tremor_strength: 0.149999, // Close to medium preset (0.15)
				tapering: 0.4
			} as VectorizerConfig;

			const preset = detectPresetFromValues(config);
			expect(preset).toBe('medium');
		});
	});
});
