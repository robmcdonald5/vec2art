/**
 * Dots Backend Configuration Types
 *
 * This module provides typed configuration interfaces for the dots/stippling backend,
 * replacing the bandaid parameter mapping with a proper architectural solution.
 *
 * Based on CLI analysis from dot_mapping_examples.md and dots.rs algorithm requirements.
 */

/**
 * Raw UI slider configuration from ParameterPanel.svelte
 * These are the values that come directly from the UI controls
 */
export interface UISliderConfig {
	/** Detail Level slider value (0.0-1.0, where 1.0 = high detail) */
	detail_level: number;

	/** Dot Width slider value (0.5-5.0, controls dot size) */
	dot_width: number;

	/** Color mode toggle */
	color_mode: boolean;
}

/**
 * Dots algorithm configuration matching Rust backend expectations
 * These are the exact parameters the dots algorithm expects
 */
export interface DotsBackendConfig {
	/** Density threshold for dot placement (0.02-0.7, lower = more dots) */
	dot_density_threshold: number;

	/** Minimum dot radius in pixels (0.3-5.0) */
	min_radius: number;

	/** Maximum dot radius in pixels (1.0-8.0, must be > min_radius) */
	max_radius: number;

	/** Whether to preserve original image colors */
	preserve_colors: boolean;

	/** Enable adaptive dot sizing based on image content */
	adaptive_sizing?: boolean;

	/** Use Poisson disk sampling for better distribution */
	poisson_disk_sampling?: boolean;

	/** Enable gradient-based dot sizing */
	gradient_based_sizing?: boolean;
}

/**
 * Configuration validation error details
 */
export interface ConfigValidationError {
	field: string;
	value: any;
	expected: string;
	message: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
	isValid: boolean;
	errors: ConfigValidationError[];
	warnings: string[];
}

/**
 * CLI-verified parameter ranges for safe operation
 * Based on analysis of dot_mapping_examples.md
 */
export const DOTS_PARAMETER_RANGES = {
	/** Density threshold ranges (lower = more dots) */
	DENSITY: {
		ULTRA_FINE: 0.02, // Maximum detail, most dots
		FINE: 0.05, // High detail
		MEDIUM: 0.15, // Balanced (CLI default)
		SPARSE: 0.25, // Low detail
		VERY_SPARSE: 0.4, // Minimal detail, few dots
		MAX_SAFE: 0.7 // Maximum safe threshold
	},

	/** Dot radius ranges in pixels */
	RADIUS: {
		MIN_ALLOWED: 0.3, // Smallest valid radius
		DEFAULT_MIN: 0.5, // CLI default minimum
		DEFAULT_MAX: 3.0, // CLI default maximum
		MAX_ALLOWED: 10.0 // Largest valid radius (for bold artistic effects)
	},

	/** UI input ranges */
	UI: {
		DETAIL_MIN: 0.0, // UI slider minimum
		DETAIL_MAX: 1.0, // UI slider maximum
		WIDTH_MIN: 0.5, // UI slider minimum
		WIDTH_MAX: 10.0 // UI slider maximum (for bold artistic effects)
	}
} as const;

/**
 * CLI example configurations for reference and testing
 */
export const CLI_EXAMPLES = {
	ULTRA_FINE: {
		density: 0.02,
		min_radius: 0.3,
		max_radius: 1.0,
		description: 'Ultra-fine stippling with tiny dots'
	},
	FINE: {
		density: 0.05,
		min_radius: 0.5,
		max_radius: 2.0,
		description: 'Fine detail stippling'
	},
	MEDIUM: {
		density: 0.15,
		min_radius: 0.8,
		max_radius: 2.5,
		description: 'Balanced stippling (CLI default)'
	},
	LARGE: {
		density: 0.25,
		min_radius: 2.0,
		max_radius: 5.0,
		description: 'Large, sparse dots'
	},
	EXTRA_LARGE: {
		density: 0.4,
		min_radius: 3.0,
		max_radius: 10.0,
		description: 'Extra large dots for bold artistic effects'
	}
} as const;
