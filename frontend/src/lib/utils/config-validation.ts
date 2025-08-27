/**
 * Configuration validation utilities for vectorizer settings
 * 
 * This module provides comprehensive validation that matches the Rust backend validation
 * constraints defined in config_builder.rs. All validation rules here must stay synchronized
 * with the backend validation to prevent runtime errors.
 */

import type { VectorizerConfig } from '$lib/types/vectorizer';

export interface ValidationError {
	field: string;
	message: string;
	min?: number;
	max?: number;
	actual?: number;
	severity?: 'error' | 'warning';
}

export interface DependencyError {
	field: string;
	message: string;
	requiredFields: string[];
	severity: 'error';
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
		const tremorMatch =
			Math.abs((config.tremor_strength ?? 0) - values.tremor_strength) <= tolerance;
		const weightsMatch =
			Math.abs((config.variable_weights ?? 0) - values.variable_weights) <= tolerance;
		const taperingMatch = Math.abs((config.tapering ?? 0) - values.tapering) <= tolerance;

		if (tremorMatch && weightsMatch && taperingMatch) {
			return preset;
		}
	}

	return null; // Custom values that don't match any preset
}

/**
 * Validate hierarchical dependencies (matches Rust config_builder.rs)
 */
export function validateDependencies(config: VectorizerConfig): DependencyError[] {
	const errors: DependencyError[] = [];

	// Flow tracing requires ETF/FDoG
	if (config.enable_flow_tracing && !config.enable_etf_fdog) {
		errors.push({
			field: 'enable_flow_tracing',
			message: 'Flow tracing requires ETF/FDoG processing to be enabled',
			requiredFields: ['enable_etf_fdog'],
			severity: 'error'
		});
	}

	// Bézier fitting requires flow tracing
	if (config.enable_bezier_fitting && !config.enable_flow_tracing) {
		errors.push({
			field: 'enable_bezier_fitting',
			message: 'Bézier fitting requires flow tracing to be enabled',
			requiredFields: ['enable_flow_tracing'],
			severity: 'error'
		});
	}

	// Transitive dependency: Bézier fitting requires ETF/FDoG
	if (config.enable_bezier_fitting && !config.enable_etf_fdog) {
		errors.push({
			field: 'enable_bezier_fitting',
			message: 'Bézier fitting requires ETF/FDoG processing to be enabled',
			requiredFields: ['enable_etf_fdog'],
			severity: 'error'
		});
	}

	// Multipass consistency
	if (config.multipass && (!config.pass_count || config.pass_count <= 1)) {
		errors.push({
			field: 'multipass',
			message: 'Multipass enabled but pass count is 1 or unset',
			requiredFields: ['pass_count'],
			severity: 'error'
		});
	}

	if (config.pass_count && config.pass_count > 1 && !config.multipass) {
		errors.push({
			field: 'pass_count',
			message: 'Pass count > 1 but multipass is disabled',
			requiredFields: ['multipass'],
			severity: 'error'
		});
	}

	// Conservative/aggressive detail requires multipass
	if ((config.conservative_detail !== undefined || config.aggressive_detail !== undefined) 
		&& !config.multipass) {
		errors.push({
			field: 'conservative_detail',
			message: 'Conservative/aggressive detail settings require multipass processing',
			requiredFields: ['multipass'],
			severity: 'error'
		});
	}

	// Reverse and diagonal passes require multipass processing  
	if ((config.reverse_pass || config.diagonal_pass) && !config.multipass) {
		errors.push({
			field: 'reverse_pass',
			message: 'Reverse and diagonal passes require multipass processing to be enabled',
			requiredFields: ['multipass'],
			severity: 'error'
		});
	}

	// Multipass enabled requires pass_count > 1
	if (config.multipass && config.pass_count <= 1) {
		errors.push({
			field: 'pass_count',
			message: 'Multipass enabled but pass count is 1 - either disable multipass or increase pass count',
			requiredFields: ['pass_count'],
			severity: 'error'
		});
	}

	return errors;
}

/**
 * Validate backend-specific settings consistency
 */
export function validateBackendSpecificSettings(config: VectorizerConfig): ValidationError[] {
	const errors: ValidationError[] = [];

	if (config.backend === 'dots') {
		// ETF/FDoG settings don't apply to dots backend
		if (config.enable_etf_fdog || config.enable_flow_tracing || config.enable_bezier_fitting) {
			errors.push({
				field: 'backend',
				message: 'ETF/FDoG, flow tracing, and Bézier fitting are not supported by the Dots backend',
				severity: 'error'
			});
		}
	} else if (config.backend === 'superpixel') {
		// ETF/FDoG settings don't apply to superpixel backend
		if (config.enable_etf_fdog || config.enable_flow_tracing || config.enable_bezier_fitting) {
			errors.push({
				field: 'backend',
				message: 'ETF/FDoG, flow tracing, and Bézier fitting are not supported by the Superpixel backend',
				severity: 'error'
			});
		}
	}

	// Reverse/diagonal passes only for supported backends
	if ((config.reverse_pass || config.diagonal_pass)) {
		if (config.backend === 'dots' || config.backend === 'superpixel') {
			errors.push({
				field: 'reverse_pass',
				message: 'Reverse and diagonal passes are not supported by Dots and Superpixel backends',
				severity: 'error'
			});
		}
	}

	return errors;
}

/**
 * Validate numeric ranges and relationships (matches Rust validation)
 */
export function validateNumericRanges(config: VectorizerConfig): ValidationError[] {
	const errors: ValidationError[] = [];

	// Detail level
	if (config.detail !== undefined && (config.detail < 0.0 || config.detail > 1.0)) {
		errors.push({
			field: 'detail',
			message: 'Detail level must be between 0.0 and 1.0',
			min: 0.0,
			max: 1.0,
			actual: config.detail,
			severity: 'error'
		});
	}

	// Stroke width
	if (config.stroke_width !== undefined && config.stroke_width <= 0.0) {
		errors.push({
			field: 'stroke_width',
			message: 'Stroke width must be positive to prevent division by zero',
			min: 0.01,
			max: 50.0,
			actual: config.stroke_width,
			severity: 'error'
		});
	}

	// FDoG sigma values
	if (config.fdog_sigma_s !== undefined && config.fdog_sigma_s <= 0.0) {
		errors.push({
			field: 'fdog_sigma_s',
			message: 'FDoG sigma S must be positive',
			min: 0.01,
			max: 10.0,
			actual: config.fdog_sigma_s,
			severity: 'error'
		});
	}

	if (config.fdog_sigma_c !== undefined && config.fdog_sigma_c <= 0.0) {
		errors.push({
			field: 'fdog_sigma_c',
			message: 'FDoG sigma C must be positive',
			min: 0.01,
			max: 10.0,
			actual: config.fdog_sigma_c,
			severity: 'error'
		});
	}

	// NMS threshold relationship
	if (config.nms_low !== undefined && config.nms_high !== undefined && config.nms_low >= config.nms_high) {
		errors.push({
			field: 'nms_low',
			message: 'NMS low threshold must be less than high threshold',
			severity: 'error'
		});
	}

	// Dot size relationship
	if (config.min_radius !== undefined && config.max_radius !== undefined 
		&& config.min_radius >= config.max_radius) {
		errors.push({
			field: 'min_radius',
			message: 'Minimum dot radius must be less than maximum dot radius',
			severity: 'error'
		});
	}

	// Adaptive threshold window size must be odd
	if (config.window_size !== undefined 
		&& config.window_size % 2 === 0) {
		errors.push({
			field: 'window_size',
			message: 'Adaptive threshold window size must be odd',
			severity: 'error'
		});
	}

	// Memory safety constraints
	if (config.max_image_size !== undefined && config.max_image_size > 16384) {
		errors.push({
			field: 'max_image_size',
			message: 'Maximum image size exceeds memory safety limit',
			max: 16384,
			actual: config.max_image_size,
			severity: 'error'
		});
	}

	// Superpixel memory safety
	if (config.num_superpixels !== undefined && config.num_superpixels > 2000) {
		errors.push({
			field: 'num_superpixels',
			message: 'Number of superpixels exceeds memory safety limit',
			max: 2000,
			actual: config.num_superpixels,
			severity: 'error'
		});
	}

	// Pass count validation
	if (config.pass_count !== undefined && (config.pass_count < 1 || config.pass_count > 10)) {
		errors.push({
			field: 'pass_count',
			message: 'Pass count must be between 1 and 10',
			min: 1,
			max: 10,
			actual: config.pass_count,
			severity: 'error'
		});
	}

	// Pass count validation - now supports full range with optimized deduplication  
	if (config.pass_count && config.pass_count > 10) {
		errors.push({
			field: 'pass_count',
			message: 'Pass count must be 10 or lower',
			max: 10,
			actual: config.pass_count,
			severity: 'error'
		});
	}

	return errors;
}

/**
 * Auto-correct configuration values to valid ranges where possible
 */
export function sanitizeConfig(config: VectorizerConfig): VectorizerConfig {
	const sanitized = { ...config };

	// Auto-clamp detail level
	if (sanitized.detail !== undefined) {
		sanitized.detail = Math.max(0.0, Math.min(1.0, sanitized.detail));
	}

	// Auto-correct stroke width
	if (sanitized.stroke_width !== undefined && sanitized.stroke_width <= 0.0) {
		sanitized.stroke_width = 0.1; // Minimum safe value
	}

	// Auto-correct window size to be odd
	if (sanitized.window_size !== undefined 
		&& sanitized.window_size % 2 === 0) {
		sanitized.window_size += 1;
	}

	// Auto-correct multipass/pass_count consistency
	if (sanitized.multipass && sanitized.pass_count <= 1) {
		sanitized.pass_count = 2; // Minimum for multipass
	}

	// Auto-correct pass_count to maximum supported value
	if (sanitized.pass_count && sanitized.pass_count > 10) {
		sanitized.pass_count = 10; // Maximum supported
	}

	// Clamp artistic effects
	const clamped = clampArtisticEffects(sanitized);
	return { ...sanitized, ...clamped };
}

/**
 * Full config validation with all constraint checks
 */
export function validateConfig(config: VectorizerConfig): {
	isValid: boolean;
	errors: ValidationError[];
	dependencyErrors: DependencyError[];
	warnings: ValidationError[];
	sanitizedConfig: VectorizerConfig;
} {
	const artisticErrors = validateArtisticEffects(config);
	const dependencyErrors = validateDependencies(config);
	const backendErrors = validateBackendSpecificSettings(config);
	const numericErrors = validateNumericRanges(config);
	
	const allErrors = [...artisticErrors, ...backendErrors, ...numericErrors];
	const errors = allErrors.filter(e => e.severity !== 'warning');
	const warnings = allErrors.filter(e => e.severity === 'warning');
	
	const sanitizedConfig = sanitizeConfig(config);

	return {
		isValid: errors.length === 0 && dependencyErrors.length === 0,
		errors,
		dependencyErrors,
		warnings,
		sanitizedConfig
	};
}

/**
 * Get user-friendly error messages for UI display
 */
export function getValidationSummary(
	errors: ValidationError[], 
	dependencyErrors: DependencyError[]
): string {
	if (errors.length === 0 && dependencyErrors.length === 0) {
		return 'Configuration is valid';
	}

	const totalErrors = errors.length + dependencyErrors.length;
	if (totalErrors === 1) {
		return errors[0]?.message || dependencyErrors[0]?.message || 'Configuration error';
	}

	return `${totalErrors} configuration errors found`;
}
