/**
 * Configuration validation utilities for vectorizer settings
 */

import type { VectorizerConfig } from '$lib/types/vectorizer';

export interface ValidationError {
	field: string;
	message: string;
	min?: number;
	max?: number;
	actual?: number;
}

/**
 * Validate artistic effect values according to Rust HandDrawnConfig constraints
 */
export function validateArtisticEffects(config: Partial<VectorizerConfig>): ValidationError[] {
	const errors: ValidationError[] = [];

	// Variable weights: 0.0-1.0
	if (typeof config.variable_weights === 'number') {
		if (config.variable_weights < 0.0 || config.variable_weights > 1.0) {
			errors.push({
				field: 'variable_weights',
				message: 'Variable Line Weights must be between 0.0 and 1.0',
				min: 0.0,
				max: 1.0,
				actual: config.variable_weights
			});
		}
	}

	// Tremor strength: 0.0-0.5
	if (typeof config.tremor_strength === 'number') {
		if (config.tremor_strength < 0.0 || config.tremor_strength > 0.5) {
			errors.push({
				field: 'tremor_strength',
				message: 'Tremor Strength must be between 0.0 and 0.5',
				min: 0.0,
				max: 0.5,
				actual: config.tremor_strength
			});
		}
	}

	// Tapering: 0.0-1.0
	if (typeof config.tapering === 'number') {
		if (config.tapering < 0.0 || config.tapering > 1.0) {
			errors.push({
				field: 'tapering',
				message: 'Line Tapering must be between 0.0 and 1.0',
				min: 0.0,
				max: 1.0,
				actual: config.tapering
			});
		}
	}

	return errors;
}

/**
 * Clamp artistic effect values to valid ranges
 */
export function clampArtisticEffects(config: Partial<VectorizerConfig>): Partial<VectorizerConfig> {
	const clamped = { ...config };

	if (typeof clamped.variable_weights === 'number') {
		clamped.variable_weights = Math.max(0.0, Math.min(1.0, clamped.variable_weights));
	}

	if (typeof clamped.tremor_strength === 'number') {
		clamped.tremor_strength = Math.max(0.0, Math.min(0.5, clamped.tremor_strength));
	}

	if (typeof clamped.tapering === 'number') {
		clamped.tapering = Math.max(0.0, Math.min(1.0, clamped.tapering));
	}

	return clamped;
}

/**
 * Check if current config values match a specific preset
 */
export function detectPresetFromValues(config: VectorizerConfig): string | null {
	const presetValues = {
		none: { tremor_strength: 0.0, variable_weights: 0.0, tapering: 0.0 },
		subtle: { tremor_strength: 0.05, variable_weights: 0.1, tapering: 0.2 },
		medium: { tremor_strength: 0.15, variable_weights: 0.3, tapering: 0.4 },
		strong: { tremor_strength: 0.3, variable_weights: 0.5, tapering: 0.6 },
		sketchy: { tremor_strength: 0.4, variable_weights: 0.7, tapering: 0.8 }
	};

	const tolerance = 0.01; // Allow small floating point differences

	for (const [preset, values] of Object.entries(presetValues)) {
		const tremorMatch = Math.abs((config.tremor_strength ?? 0) - values.tremor_strength) <= tolerance;
		const weightsMatch = Math.abs((config.variable_weights ?? 0) - values.variable_weights) <= tolerance;
		const taperingMatch = Math.abs((config.tapering ?? 0) - values.tapering) <= tolerance;

		if (tremorMatch && weightsMatch && taperingMatch) {
			return preset;
		}
	}

	return null; // Custom values that don't match any preset
}

/**
 * Full config validation for artistic effects
 */
export function validateConfig(config: VectorizerConfig): {
	isValid: boolean;
	errors: ValidationError[];
	clampedConfig: VectorizerConfig;
} {
	const errors = validateArtisticEffects(config);
	const clampedConfig = { ...config, ...clampArtisticEffects(config) } as VectorizerConfig;

	return {
		isValid: errors.length === 0,
		errors,
		clampedConfig
	};
}