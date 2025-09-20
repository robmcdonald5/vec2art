/**
 * Config Schema - Zod validation schemas for configuration
 *
 * This module provides runtime validation for configuration objects,
 * ensuring type safety and data integrity at runtime boundaries.
 */

import { z } from 'zod';

/**
 * Algorithm selection schema
 */
export const AlgorithmSchema = z.enum(['edge', 'centerline', 'superpixel', 'dots']);

/**
 * Hand-drawn preset schema for Edge algorithm
 */
export const HandDrawnPresetSchema = z.enum(['none', 'sketchy', 'artistic', 'rough', 'custom']);

/**
 * Main algorithm configuration schema
 * This represents the frontend-facing configuration format
 */
export const AlgorithmConfigSchema = z.object({
	// Core configuration
	algorithm: AlgorithmSchema,
	detail: z.number().min(0).max(10).default(5),
	strokeWidth: z.number().min(0.1).max(10).default(1.5),

	// Processing options
	passCount: z.number().int().min(1).max(10).default(1).optional(),
	enableReversePass: z.boolean().default(false).optional(),
	enableDiagonalPass: z.boolean().default(false).optional(),

	// Preprocessing
	noiseFiltering: z.boolean().default(false).optional(),
	noiseFilterSpatialSigma: z.number().min(0.5).max(5.0).default(1.2).optional(),
	noiseFilterRangeSigma: z.number().min(10.0).max(200.0).default(50.0).optional(),
	enableBackgroundRemoval: z.boolean().default(false).optional(),
	backgroundRemovalStrength: z.number().min(0).max(1).default(0.5).optional(),

	// Color options
	preserveColors: z.boolean().default(false).optional(),

	// Edge-specific options
	handDrawnPreset: HandDrawnPresetSchema.default('none').optional(),
	handDrawnVariableWeights: z.number().min(0).max(1).default(0).optional(),
	handDrawnTremorStrength: z.number().min(0).max(1).default(0).optional(),
	handDrawnTapering: z.number().min(0).max(1).default(0).optional(),

	// Centerline-specific options
	enableAdaptiveThreshold: z.boolean().default(true).optional(),
	adaptiveThresholdWindowSize: z.number().int().min(3).max(99).default(25).optional(),
	adaptiveThresholdK: z.number().min(0).max(1).default(0.4).optional(),

	// Superpixel-specific options
	numSuperpixels: z.number().int().min(20).max(1000).default(200).optional(),
	compactness: z.number().min(1).max(50).default(10).optional(),
	iterations: z.number().int().min(1).max(15).default(5).optional(),

	// Advanced superpixel merging options
	enableAdvancedMerging: z.boolean().default(false).optional(),
	superpixelMinRegionSize: z.number().int().min(1).max(500).default(5).optional(),
	superpixelEnforceConnectivity: z.boolean().default(true).optional(),
	superpixelEnhanceEdges: z.boolean().default(false).optional(),
	superpixelMergeThreshold: z.number().min(0.01).max(1.0).default(0.15).optional(),

	// Dots-specific options
	minRadius: z.number().min(0.1).max(10).default(0.5).optional(),
	maxRadius: z.number().min(0.1).max(10).default(3).optional(),

	// UI-only fields (not sent to WASM)
	autoProcess: z.boolean().default(false).optional(),
	previewQuality: z.enum(['low', 'medium', 'high']).default('medium').optional(),
	settingsExpanded: z.boolean().default(true).optional()
});

export type AlgorithmConfig = z.infer<typeof AlgorithmConfigSchema>;

/**
 * Preset configuration schema
 * Used for saving and loading presets
 */
export const PresetConfigSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	config: AlgorithmConfigSchema,
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional()
});

export type PresetConfig = z.infer<typeof PresetConfigSchema>;

/**
 * Processing result schema
 * Validates results returned from WASM
 */
export const ProcessingResultSchema = z.object({
	svg: z.string(),
	stats: z
		.object({
			paths_generated: z.number().int().min(0),
			processing_backend: z.string(),
			processing_time_ms: z.number().optional()
		})
		.optional(),
	processing_time: z.number().optional()
});

export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

/**
 * Parse and validate config with helpful error messages
 */
export function parseAlgorithmConfig(data: unknown): AlgorithmConfig {
	try {
		return AlgorithmConfigSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const issues = error.issues
				.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
				.join(', ');
			throw new Error(`Invalid config: ${issues}`);
		}
		throw error;
	}
}

/**
 * Safe parse that returns a result object
 */
export function safeParseAlgorithmConfig(data: unknown): {
	success: boolean;
	data?: AlgorithmConfig;
	error?: string;
} {
	const result = AlgorithmConfigSchema.safeParse(data);
	if (result.success) {
		return { success: true, data: result.data };
	} else {
		const issues = result.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join(', ');
		return { success: false, error: issues };
	}
}

/**
 * Merge partial config with defaults
 */
export function mergeWithDefaults(partial: Partial<AlgorithmConfig>): AlgorithmConfig {
	return AlgorithmConfigSchema.parse(partial);
}

/**
 * Validate config for specific algorithm
 * Ensures algorithm-specific fields are present
 */
export function validateForAlgorithm(config: AlgorithmConfig): string[] {
	const errors: string[] = [];

	switch (config.algorithm) {
		case 'edge':
			// Edge-specific validations
			if (config.handDrawnPreset === 'custom') {
				if (
					!config.handDrawnVariableWeights &&
					!config.handDrawnTremorStrength &&
					!config.handDrawnTapering
				) {
					errors.push('Custom hand-drawn preset requires at least one parameter to be set');
				}
			}
			break;

		case 'centerline':
			// Centerline-specific validations
			if (config.enableAdaptiveThreshold && !config.adaptiveThresholdWindowSize) {
				errors.push('Adaptive threshold requires window size');
			}
			break;

		case 'superpixel':
			// Superpixel-specific validations
			if (config.numSuperpixels && config.numSuperpixels < 20) {
				errors.push('Superpixel count too low, may produce poor results');
			}
			break;

		case 'dots':
			// Dots-specific validations
			if (config.minRadius && config.maxRadius && config.minRadius > config.maxRadius) {
				errors.push('Min radius cannot be greater than max radius');
			}
			break;
	}

	return errors;
}

/**
 * Strip UI-only fields before sending to WASM
 */
export function stripUIFields(
	config: AlgorithmConfig
): Omit<AlgorithmConfig, 'autoProcess' | 'previewQuality' | 'settingsExpanded'> {
	const {
		autoProcess: _autoProcess,
		previewQuality: _previewQuality,
		settingsExpanded: _settingsExpanded,
		...wasmConfig
	} = config;
	return wasmConfig;
}
