/**
 * Configuration Conversion Utilities
 *
 * Bridges the gap between legacy VectorizerConfig (snake_case)
 * and modern VectorizerConfiguration (camelCase) formats
 */

import type { VectorizerConfiguration } from '$lib/types/worker-protocol';
import { VectorizerBackend } from '$lib/types/worker-protocol';

// Legacy types for compatibility
export interface LegacyVectorizerConfig {
	// Core settings
	backend: 'edge' | 'dots' | 'superpixel' | 'centerline';
	detail: number;
	stroke_width: number;
	noise_filtering: boolean;

	// Multi-pass processing
	multipass: boolean;
	pass_count: number;
	multipass_mode: 'auto' | 'manual';
	reverse_pass: boolean;
	diagonal_pass: boolean;

	// Advanced edge detection
	enable_etf_fdog: boolean;
	enable_flow_tracing: boolean;
	enable_bezier_fitting: boolean;

	// Hand-drawn aesthetics
	hand_drawn_preset: 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy' | 'custom';
	variable_weights: number;
	tremor_strength: number;
	tapering: number;

	// Advanced settings
	svg_precision?: number;
	max_processing_time_ms?: number;
	preserve_colors?: boolean;

	// Backend-specific settings (optional)
	[key: string]: any;
}

/**
 * Convert legacy snake_case config to modern camelCase config
 */
export function legacyToModern(legacy: LegacyVectorizerConfig): VectorizerConfiguration {
	const modernBackend = mapLegacyBackend(legacy.backend);

	return {
		backend: modernBackend,
		detail: legacy.detail,
		strokeWidth: legacy.stroke_width,
		multipass: legacy.multipass,
		passCount: legacy.pass_count ?? 1,
		reversePass: legacy.reverse_pass ?? false,
		diagonalPass: legacy.diagonal_pass ?? false,
		noiseFiltering: legacy.noise_filtering,
		svgPrecision: legacy.svg_precision ?? 2,
		maxProcessingTime: legacy.max_processing_time_ms,
		handDrawnPreset: mapHandDrawnPreset(legacy.hand_drawn_preset),
		customTremor: legacy.tremor_strength,
		customVariableWeights: legacy.variable_weights,
		customTapering: legacy.tapering
		// Note: Advanced features disabled in legacy for safety
		// enable_etf_fdog, enable_flow_tracing, enable_bezier_fitting are intentionally not mapped
		// as they are always false in legacy configs for stability
	};
}

/**
 * Convert modern camelCase config to legacy snake_case config
 */
export function modernToLegacy(modern: VectorizerConfiguration): LegacyVectorizerConfig {
	return {
		backend: mapModernBackend(modern.backend),
		detail: modern.detail,
		stroke_width: modern.strokeWidth,
		multipass: modern.multipass,
		pass_count: modern.passCount ?? 1,
		multipass_mode: 'auto', // Default to auto mode
		reverse_pass: modern.reversePass ?? false,
		diagonal_pass: modern.diagonalPass ?? false,
		enable_etf_fdog: false, // Default disabled for legacy compatibility
		enable_flow_tracing: false, // Default disabled for legacy compatibility
		enable_bezier_fitting: false, // Default disabled for legacy compatibility
		noise_filtering: modern.noiseFiltering,
		svg_precision: modern.svgPrecision ?? 2,
		max_processing_time_ms: modern.maxProcessingTime,
		hand_drawn_preset: mapModernHandDrawnPreset(modern.handDrawnPreset),
		tremor_strength: modern.customTremor ?? 0,
		variable_weights: modern.customVariableWeights ?? 0,
		tapering: modern.customTapering ?? 0
	};
}

/**
 * Map legacy backend strings to modern enum
 */
function mapLegacyBackend(legacy: string): VectorizerBackend {
	switch (legacy) {
		case 'edge':
			return VectorizerBackend.EDGE;
		case 'centerline':
			return VectorizerBackend.CENTERLINE;
		case 'superpixel':
			return VectorizerBackend.SUPERPIXEL;
		case 'dots':
			return VectorizerBackend.DOTS;
		default:
			return VectorizerBackend.EDGE;
	}
}

/**
 * Map modern backend enum to legacy strings
 */
function mapModernBackend(
	modern: VectorizerBackend
): 'edge' | 'dots' | 'superpixel' | 'centerline' {
	switch (modern) {
		case VectorizerBackend.EDGE:
			return 'edge';
		case VectorizerBackend.CENTERLINE:
			return 'centerline';
		case VectorizerBackend.SUPERPIXEL:
			return 'superpixel';
		case VectorizerBackend.DOTS:
			return 'dots';
		default:
			return 'edge';
	}
}

/**
 * Map legacy hand-drawn preset to modern preset
 */
function mapHandDrawnPreset(legacy: string): 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy' {
	switch (legacy) {
		case 'none':
			return 'none';
		case 'subtle':
			return 'subtle';
		case 'medium':
			return 'medium';
		case 'strong':
			return 'strong';
		case 'sketchy':
			return 'sketchy';
		case 'custom':
			return 'none'; // Map custom to none for modern config
		default:
			return 'none';
	}
}

/**
 * Map modern hand-drawn preset to legacy preset
 */
function mapModernHandDrawnPreset(
	modern?: string
): 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy' | 'custom' {
	switch (modern) {
		case 'none':
			return 'none';
		case 'subtle':
			return 'subtle';
		case 'medium':
			return 'medium';
		case 'strong':
			return 'strong';
		case 'sketchy':
			return 'sketchy';
		default:
			return 'none';
	}
}

/**
 * Default modern configuration matching legacy defaults
 */
export const DEFAULT_MODERN_CONFIG: VectorizerConfiguration = {
	backend: VectorizerBackend.EDGE,
	detail: 0.8,
	strokeWidth: 1.5,
	multipass: false,
	passCount: 1,
	reversePass: false,
	diagonalPass: false,
	noiseFiltering: false,
	svgPrecision: 2,
	handDrawnPreset: 'none',
	customTremor: 0.0,
	customVariableWeights: 0.0,
	customTapering: 0.0
};

/**
 * Get default configuration for a specific backend
 */
export function getDefaultConfigForBackend(backend: VectorizerBackend): VectorizerConfiguration {
	const baseConfig = { ...DEFAULT_MODERN_CONFIG, backend };

	// Apply backend-specific defaults
	switch (backend) {
		case VectorizerBackend.CENTERLINE:
			return {
				...baseConfig,
				strokeWidth: 1.0,
				detail: 0.6,
				centerlineSettings: {
					adaptiveThreshold: true,
					windowSize: 25,
					sensitivityK: 0.3,
					minBranchLength: 8,
					douglasPeuckerEpsilon: 1.0,
					widthModulation: false
				}
			};
		case VectorizerBackend.SUPERPIXEL:
			return {
				...baseConfig,
				detail: 0.2,
				superpixelSettings: {
					numSuperpixels: 275,
					compactness: 10,
					slicIterations: 10,
					fillRegions: true,
					strokeRegions: true,
					simplifyBoundaries: true,
					boundaryEpsilon: 1.0,
					preserveColors: true
				}
			};
		case VectorizerBackend.DOTS:
			return {
				...baseConfig,
				strokeWidth: 1.0,
				detail: 0.8,
				dotsSettings: {
					density: 0.105,
					minRadius: 0.5,
					maxRadius: 3.0,
					adaptiveSizing: true,
					preserveColors: true,
					poissonDisk: false,
					gradientSizing: true
				}
			};
		default:
			return baseConfig;
	}
}
