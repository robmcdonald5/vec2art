/**
 * Dots Backend Parameter Mapping Utilities
 *
 * This module provides deterministic mapping functions between UI controls
 * and dots backend parameters, replacing bandaid fixes with proper architecture.
 *
 * All mapping functions are based on CLI analysis from dot_mapping_examples.md
 * and are designed to be predictable, maintainable, and crash-safe.
 */

import type {
	UISliderConfig,
	DotsBackendConfig,
	ConfigValidationResult,
	ConfigValidationError
} from '../types/dots-backend.js';
import { DOTS_PARAMETER_RANGES } from '../types/dots-backend.js';

/**
 * Map UI Detail Level (0.0-1.0) to Dot Density Threshold
 *
 * UI Logic: Higher detail level = more detailed output = lower density threshold
 * Algorithm Logic: Lower threshold = more dots pass the density check = more detail
 *
 * @param detailLevel - UI slider value (0.0 = low detail, 1.0 = high detail)
 * @param imageWidth - Optional image width for size-aware adjustment
 * @param imageHeight - Optional image height for size-aware adjustment
 * @returns Density threshold for dots algorithm (0.02-0.4, lower = more dots)
 */
export function mapDetailToDensity(
	detailLevel: number,
	imageWidth?: number,
	imageHeight?: number
): number {
	// Validate input range
	const clampedDetail = Math.max(0.0, Math.min(1.0, detailLevel));

	// Base mapping using CLI-verified ranges
	const minDensity = DOTS_PARAMETER_RANGES.DENSITY.ULTRA_FINE; // 0.02
	const maxDensity = DOTS_PARAMETER_RANGES.DENSITY.VERY_SPARSE; // 0.4

	// Calculate base density (inverted: high detail = low density threshold)
	let baseDensity = maxDensity - clampedDetail * (maxDensity - minDensity);

	// Apply image-size-aware adjustment to prevent memory overload
	if (imageWidth && imageHeight) {
		const totalPixels = imageWidth * imageHeight;
		const megapixels = totalPixels / (1024 * 1024);

		// For large images, increase density threshold to reduce dot count
		// This prevents WASM memory crashes while maintaining visual quality
		if (megapixels > 2.0) {
			// Images larger than 2MP
			const sizeMultiplier = Math.min(2.0, 1 + (megapixels - 2.0) * 0.15);
			baseDensity = Math.min(maxDensity, baseDensity * sizeMultiplier);
			console.log(
				`[Dots Mapping] 🖼️ Large image (${megapixels.toFixed(1)}MP) - adjusted density from ${(maxDensity - clampedDetail * (maxDensity - minDensity)).toFixed(3)} to ${baseDensity.toFixed(3)}`
			);
		}
	}

	return Math.round(baseDensity * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Map UI Dot Width (0.5-5.0) to Minimum Dot Radius
 *
 * UI Logic: Larger width = larger minimum dot size
 *
 * @param dotWidth - UI slider value (0.5-5.0)
 * @returns Minimum radius in pixels (0.3-2.0)
 */
export function mapWidthToMinRadius(dotWidth: number): number {
	// Validate input range
	const clampedWidth = Math.max(
		DOTS_PARAMETER_RANGES.UI.WIDTH_MIN,
		Math.min(DOTS_PARAMETER_RANGES.UI.WIDTH_MAX, dotWidth)
	);

	// Map to CLI-verified safe range
	// width=0.5 → min_radius=0.3 (smallest dots)
	// width=5.0 → min_radius=2.0 (larger minimum)
	const minRadius = DOTS_PARAMETER_RANGES.RADIUS.MIN_ALLOWED; // 0.3
	const maxMinRadius = 2.0; // Don't go too high for minimum

	const normalizedWidth = (clampedWidth - 0.5) / (5.0 - 0.5);
	const radius = minRadius + normalizedWidth * (maxMinRadius - minRadius);

	return Math.round(radius * 10) / 10; // Round to 1 decimal place
}

/**
 * Map UI Dot Width (0.5-5.0) to Maximum Dot Radius
 *
 * UI Logic: Larger width = larger maximum dot size
 * Constraint: Must be larger than minimum radius
 *
 * @param dotWidth - UI slider value (0.5-5.0)
 * @param minRadius - Minimum radius (for constraint enforcement)
 * @returns Maximum radius in pixels (1.0-5.0)
 */
export function mapWidthToMaxRadius(dotWidth: number, minRadius: number): number {
	// Validate input range
	const clampedWidth = Math.max(
		DOTS_PARAMETER_RANGES.UI.WIDTH_MIN,
		Math.min(DOTS_PARAMETER_RANGES.UI.WIDTH_MAX, dotWidth)
	);

	// Map to CLI-verified safe range
	// width=0.5 → max_radius=1.0 (small range)
	// width=5.0 → max_radius=5.0 (large range)
	const minMaxRadius = 1.0;
	const maxMaxRadius = 5.0;

	const normalizedWidth = (clampedWidth - 0.5) / (5.0 - 0.5);
	const radius = minMaxRadius + normalizedWidth * (maxMaxRadius - minMaxRadius);

	// Ensure maximum is always larger than minimum
	const constrainedRadius = Math.max(minRadius + 0.1, radius);

	return Math.round(constrainedRadius * 10) / 10; // Round to 1 decimal place
}

/**
 * Primary mapping function: Convert UI configuration to dots backend configuration
 *
 * This is the main function that replaces all the bandaid parameter mapping
 * in the WASM worker with a single, deterministic, well-tested function.
 *
 * @param uiConfig - Configuration from UI sliders
 * @param imageWidth - Optional image width for size-aware parameter adjustment
 * @param imageHeight - Optional image height for size-aware parameter adjustment
 * @returns Dots backend configuration ready for WASM
 */
export function mapUIConfigToDotsConfig(
	uiConfig: UISliderConfig,
	imageWidth?: number,
	imageHeight?: number
): DotsBackendConfig {
	// Apply deterministic mapping functions with image-size awareness
	const density = mapDetailToDensity(uiConfig.detail_level, imageWidth, imageHeight);
	const minRadius = mapWidthToMinRadius(uiConfig.dot_width);
	const maxRadius = mapWidthToMaxRadius(uiConfig.dot_width, minRadius);

	// For very large images, also adjust dot sizes to maintain visual coherence
	let adjustedMinRadius = minRadius;
	let adjustedMaxRadius = maxRadius;

	if (imageWidth && imageHeight) {
		const megapixels = (imageWidth * imageHeight) / (1024 * 1024);
		if (megapixels > 3.0) {
			// Slightly increase dot sizes for very large images to maintain visibility
			const sizeMultiplier = Math.min(1.4, 1 + (megapixels - 3.0) * 0.05);
			adjustedMinRadius = Math.min(3.0, minRadius * sizeMultiplier);
			adjustedMaxRadius = Math.min(6.0, maxRadius * sizeMultiplier);
			console.log(
				`[Dots Mapping] 🔍 Large image - adjusted dot sizes: ${minRadius.toFixed(1)}-${maxRadius.toFixed(1)} → ${adjustedMinRadius.toFixed(1)}-${adjustedMaxRadius.toFixed(1)}`
			);
		}
	}

	return {
		dot_density_threshold: density,
		min_radius: adjustedMinRadius,
		max_radius: adjustedMaxRadius,
		preserve_colors: uiConfig.color_mode,
		// Enable recommended features for better quality and stability
		adaptive_sizing: true,
		poisson_disk_sampling: false, // Disable for large images to reduce computation
		gradient_based_sizing: true
	};
}

/**
 * Validate dots backend configuration for safety
 *
 * Performs comprehensive validation to prevent the "unreachable executed"
 * crashes that were occurring with invalid parameter combinations.
 *
 * @param config - Dots backend configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateDotsConfig(config: DotsBackendConfig): ConfigValidationResult {
	const errors: ConfigValidationError[] = [];
	const warnings: string[] = [];

	// Validate density threshold
	if (typeof config.dot_density_threshold !== 'number') {
		errors.push({
			field: 'dot_density_threshold',
			value: config.dot_density_threshold,
			expected: 'number',
			message: 'Density threshold must be a number'
		});
	} else {
		const density = config.dot_density_threshold;
		if (
			density < DOTS_PARAMETER_RANGES.DENSITY.ULTRA_FINE ||
			density > DOTS_PARAMETER_RANGES.DENSITY.MAX_SAFE
		) {
			errors.push({
				field: 'dot_density_threshold',
				value: density,
				expected: `${DOTS_PARAMETER_RANGES.DENSITY.ULTRA_FINE}-${DOTS_PARAMETER_RANGES.DENSITY.MAX_SAFE}`,
				message: 'Density threshold outside safe range - may cause crashes'
			});
		}

		if (density > DOTS_PARAMETER_RANGES.DENSITY.VERY_SPARSE) {
			warnings.push('High density threshold may result in very sparse output');
		}
	}

	// Validate radius values
	if (typeof config.min_radius !== 'number') {
		errors.push({
			field: 'min_radius',
			value: config.min_radius,
			expected: 'number',
			message: 'Minimum radius must be a number'
		});
	} else if (config.min_radius < DOTS_PARAMETER_RANGES.RADIUS.MIN_ALLOWED) {
		errors.push({
			field: 'min_radius',
			value: config.min_radius,
			expected: `>= ${DOTS_PARAMETER_RANGES.RADIUS.MIN_ALLOWED}`,
			message: 'Minimum radius below safe threshold'
		});
	}

	if (typeof config.max_radius !== 'number') {
		errors.push({
			field: 'max_radius',
			value: config.max_radius,
			expected: 'number',
			message: 'Maximum radius must be a number'
		});
	} else if (config.max_radius > DOTS_PARAMETER_RANGES.RADIUS.MAX_ALLOWED) {
		errors.push({
			field: 'max_radius',
			value: config.max_radius,
			expected: `<= ${DOTS_PARAMETER_RANGES.RADIUS.MAX_ALLOWED}`,
			message: 'Maximum radius above safe threshold'
		});
	}

	// Validate radius relationship
	if (typeof config.min_radius === 'number' && typeof config.max_radius === 'number') {
		if (config.max_radius <= config.min_radius) {
			errors.push({
				field: 'max_radius',
				value: config.max_radius,
				expected: `> ${config.min_radius}`,
				message: 'Maximum radius must be larger than minimum radius'
			});
		}

		const radiusRange = config.max_radius - config.min_radius;
		if (radiusRange < 0.1) {
			warnings.push('Very small radius range may limit visual variation');
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Get human-readable description of dots configuration
 *
 * Useful for logging and debugging to understand what the configuration represents.
 *
 * @param config - Dots backend configuration
 * @param imageWidth - Optional image width for context
 * @param imageHeight - Optional image height for context
 * @returns Human-readable description
 */
export function describeDotsConfig(
	config: DotsBackendConfig,
	imageWidth?: number,
	imageHeight?: number
): string {
	let density_desc: string;
	if (config.dot_density_threshold <= 0.05) {
		density_desc = 'ultra-fine (very detailed)';
	} else if (config.dot_density_threshold <= 0.15) {
		density_desc = 'fine (detailed)';
	} else if (config.dot_density_threshold <= 0.25) {
		density_desc = 'medium (balanced)';
	} else {
		density_desc = 'sparse (minimal detail)';
	}

	let size_desc: string;
	const avgRadius = (config.min_radius + config.max_radius) / 2;
	if (avgRadius <= 1.0) {
		size_desc = 'tiny dots';
	} else if (avgRadius <= 2.5) {
		size_desc = 'medium dots';
	} else {
		size_desc = 'large dots';
	}

	let context = '';
	if (imageWidth && imageHeight) {
		const megapixels = (imageWidth * imageHeight) / (1024 * 1024);
		if (megapixels > 2.0) {
			context = ` [${megapixels.toFixed(1)}MP - size-optimized]`;
		}
	}

	return `${density_desc}, ${size_desc} (${config.min_radius.toFixed(1)}-${config.max_radius.toFixed(1)}px), colors: ${config.preserve_colors ? 'preserved' : 'monochrome'}${context}`;
}
