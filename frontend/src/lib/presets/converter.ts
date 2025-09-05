/**
 * Preset to WASM Config Converter
 * Maps style presets to actual WASM configuration parameters
 */

import type { StylePreset } from './types';
import type { VectorizerConfig, VectorizerBackend, HandDrawnPreset } from '$lib/types/vectorizer';

// Bridge type for backward compatibility
export type ProcessConfig = VectorizerConfig;

/**
 * Convert a style preset to WASM-compatible VectorizerConfig
 */
export function presetToProcessConfig(preset: StylePreset): VectorizerConfig {
	const config: VectorizerConfig = {
		// Core WASM parameters
		backend: preset.backend,
		detail: mapDetailsLevel(preset.config.details),
		stroke_width: mapStrokeWidth(preset),
		
		// Processing settings
		noise_filtering: preset.config.blur !== undefined && preset.config.blur > 0.5,
		noise_filter_spatial_sigma: 1.2,
		noise_filter_range_sigma: 50.0,
		
		// Multi-pass configuration
		multipass: shouldEnableMultipass(preset),
		pass_count: getPassCount(preset),
		multipass_mode: 'auto',
		
		// Hand-drawn aesthetics from preset
		hand_drawn_preset: mapHandDrawnPreset(preset),
		variable_weights: mapVariableWeights(preset),
		tremor_strength: mapTremorStrength(preset),
		tapering: mapTapering(preset),
		
		// Directional processing
		reverse_pass: shouldEnableReversePass(preset),
		diagonal_pass: shouldEnableDiagonalPass(preset),
		
		// Advanced features (disabled by default for stability)
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false,
		
		// Color settings
		preserve_colors: shouldPreserveColors(preset),
		color_sampling: getColorSampling(preset),
		color_accuracy: 0.7,
		
		// Backend-specific parameters
		...mapBackendSpecificParams(preset)
	};

	return config;
}

/**
 * New function name for clarity - maps to VectorizerConfig
 */
export function presetToVectorizerConfig(preset: StylePreset): VectorizerConfig {
	return presetToProcessConfig(preset);
}

/**
 * Map detail level to numeric value (0.0-1.0 for WASM)
 */
function mapDetailsLevel(details?: string): number {
	switch (details) {
		case 'low': return 0.3;
		case 'medium': return 0.5;
		case 'high': return 0.7;
		case 'very-high': return 0.9;
		default: return 0.5;
	}
}

/**
 * Map stroke width from preset config
 */
function mapStrokeWidth(preset: StylePreset): number {
	// Check overrides first
	if (preset.overrides?.handDrawn?.minWeight) {
		return preset.overrides.handDrawn.minWeight;
	}
	
	// Use config value or default based on backend
	const defaults = {
		'edge': 1.5,
		'centerline': 0.8,
		'dots': 1.0,
		'superpixel': 1.5
	};
	
	return preset.config.strokeWidth || defaults[preset.backend];
}

/**
 * Determine if multipass should be enabled
 */
function shouldEnableMultipass(preset: StylePreset): boolean {
	// Enable multipass for edge backend with specific presets
	if (preset.backend !== 'edge') return false;
	
	// Check overrides first
	if (preset.overrides?.edgeDetection?.multiPass !== undefined) {
		return preset.overrides.edgeDetection.multiPass;
	}
	
	// Enable for edge backend artistic and complex presets only
	const edgeMultipassPresets = ['hand-drawn-illustration', 'photo-to-sketch', 'detailed-line-art'];
	return edgeMultipassPresets.includes(preset.metadata.id);
}

/**
 * Get pass count based on preset configuration
 */
function getPassCount(preset: StylePreset): number {
	if (!shouldEnableMultipass(preset)) return 1;
	
	// Check overrides
	if (preset.overrides?.edgeDetection?.passes) {
		return preset.overrides.edgeDetection.passes.length;
	}
	
	// Default based on complexity
	switch (preset.metadata.complexity) {
		case 'simple': return 1;
		case 'medium': return 2;
		case 'complex': return 3;
		default: return 2;
	}
}

/**
 * Map hand-drawn preset from style preset
 */
function mapHandDrawnPreset(preset: StylePreset): HandDrawnPreset {
	// Check for explicit hand-drawn settings in overrides
	if (preset.overrides?.handDrawn) {
		const hd = preset.overrides.handDrawn;
		if (hd.tremor === 0 && !hd.variableWeight && !hd.tapering) {
			return 'none';
		}
		if (hd.tremor && hd.tremor > 0.5) {
			return 'strong';
		}
		if (hd.variableWeight || hd.tapering) {
			return 'medium';
		}
		return 'subtle';
	}
	
	// Map based on preset category and intent
	switch (preset.metadata.category) {
		case 'professional':
			return 'none';
		case 'artistic':
			return preset.metadata.id === 'hand-drawn-illustration' ? 'medium' : 'subtle';
		case 'vintage':
			return 'subtle';
		case 'modern':
			return 'none';
		default:
			return 'none';
	}
}

/**
 * Map variable weights setting
 */
function mapVariableWeights(preset: StylePreset): number {
	if (preset.overrides?.handDrawn?.variableWeight === false) return 0.0;
	if (preset.overrides?.handDrawn?.variableWeight === true) {
		return preset.overrides.handDrawn.tremor || 0.3;
	}
	
	// Default based on hand-drawn preset
	const handDrawnPreset = mapHandDrawnPreset(preset);
	switch (handDrawnPreset) {
		case 'none': return 0.0;
		case 'subtle': return 0.1;
		case 'medium': return 0.3;
		case 'strong': return 0.5;
		case 'sketchy': return 0.7;
		default: return 0.0;
	}
}

/**
 * Map tremor strength
 */
function mapTremorStrength(preset: StylePreset): number {
	if (preset.overrides?.handDrawn?.tremor !== undefined) {
		return Math.max(0.0, Math.min(0.5, preset.overrides.handDrawn.tremor));
	}
	
	const handDrawnPreset = mapHandDrawnPreset(preset);
	switch (handDrawnPreset) {
		case 'none': return 0.0;
		case 'subtle': return 0.1;
		case 'medium': return 0.2;
		case 'strong': return 0.3;
		case 'sketchy': return 0.4;
		default: return 0.0;
	}
}

/**
 * Map tapering setting
 */
function mapTapering(preset: StylePreset): number {
	if (preset.overrides?.handDrawn?.tapering === false) return 0.0;
	if (preset.overrides?.handDrawn?.tapering === true) return 0.2;
	
	const handDrawnPreset = mapHandDrawnPreset(preset);
	switch (handDrawnPreset) {
		case 'none': return 0.0;
		case 'subtle': return 0.1;
		case 'medium': return 0.2;
		case 'strong': return 0.3;
		case 'sketchy': return 0.4;
		default: return 0.0;
	}
}

/**
 * Determine if reverse pass should be enabled
 */
function shouldEnableReversePass(preset: StylePreset): boolean {
	if (preset.backend !== 'edge') return false;
	
	// Check overrides
	if (preset.overrides?.edgeDetection?.passes) {
		return preset.overrides.edgeDetection.passes.includes('reverse');
	}
	
	// Enable for complex artistic presets
	return preset.metadata.id === 'hand-drawn-illustration';
}

/**
 * Determine if diagonal pass should be enabled
 */
function shouldEnableDiagonalPass(preset: StylePreset): boolean {
	if (preset.backend !== 'edge') return false;
	
	// Check overrides
	if (preset.overrides?.edgeDetection?.passes) {
		return preset.overrides.edgeDetection.passes.includes('diagonal');
	}
	
	// Enable for highly detailed presets
	return preset.metadata.id === 'hand-drawn-illustration' && preset.metadata.complexity === 'medium';
}

/**
 * Determine if colors should be preserved
 */
function shouldPreserveColors(preset: StylePreset): boolean {
	// Dots backend often uses colors
	if (preset.backend === 'dots') return true;
	
	// Superpixel backend typically preserves colors
	if (preset.backend === 'superpixel') return true;
	
	// Check preset intent
	if (preset.overrides?.dots?.colorMode === 'color') return true;
	if (preset.overrides?.dots?.colorMode === 'monochrome') return false;
	
	// Default based on market segment
	switch (preset.metadata.marketSegment) {
		case 'creative':
		case 'digital':
			return true;
		case 'corporate':
		case 'technical':
		case 'print':
			return false;
		default:
			return false;
	}
}

/**
 * Get color sampling method
 */
function getColorSampling(preset: StylePreset): 'dominant' | 'gradient' | 'content-aware' | 'adaptive' {
	if (!shouldPreserveColors(preset)) return 'dominant';
	
	switch (preset.backend) {
		case 'dots':
			return preset.metadata.id === 'fine-pointillism' ? 'adaptive' : 'content-aware';
		case 'superpixel':
			return 'gradient';
		case 'edge':
			return 'content-aware';
		default:
			return 'dominant';
	}
}

/**
 * Map backend-specific parameters to actual WASM VectorizerConfig parameters
 */
function mapBackendSpecificParams(preset: StylePreset): Partial<VectorizerConfig> {
	const params: Partial<VectorizerConfig> = {};
	
	switch (preset.backend) {
		case 'edge':
			// Edge detection parameters - these are not exposed in current WASM interface
			// But we can set related parameters that affect edge detection
			break;
			
		case 'dots':
			// Dots backend specific parameters
			if (preset.overrides?.dots) {
				params.dot_density_threshold = preset.overrides.dots.density ?? 0.105; // Default to UI value 8
				params.min_radius = preset.overrides.dots.minSize ?? 0.5;
				params.max_radius = preset.overrides.dots.maxSize ?? 3.0;
				params.adaptive_sizing = true;
				params.background_tolerance = 0.1;
				params.poisson_disk_sampling = preset.overrides.dots.pattern === 'poisson';
				params.gradient_based_sizing = true;
			} else {
				// Default dots parameters based on preset - use more reasonable values
				switch (preset.metadata.id) {
					case 'vintage-stippling':
						params.dot_density_threshold = 0.3; // Lower density for vintage halftone look
						params.min_radius = 1.5;
						params.max_radius = 4.0;
						params.adaptive_sizing = false; // Uniform sizing for vintage effect
						params.poisson_disk_sampling = false; // Regular halftone pattern
						params.gradient_based_sizing = false; // Uniform dots
						break;
					case 'fine-pointillism':
						params.dot_density_threshold = 0.6; // High but not excessive density
						params.min_radius = 0.5;
						params.max_radius = 2.0;
						params.adaptive_sizing = true;
						params.gradient_based_sizing = true;
						params.poisson_disk_sampling = false; // Disabled by default for performance
						break;
					case 'artistic-stippling':
						params.dot_density_threshold = 0.4; // Medium density for artistic effect
						params.min_radius = 0.8;
						params.max_radius = 3.5;
						params.adaptive_sizing = true;
						params.gradient_based_sizing = true;
						params.poisson_disk_sampling = false; // Disabled by default for performance
						break;
					default:
						params.dot_density_threshold = 0.105; // UI value 8 as default
						params.min_radius = 1.0;
						params.max_radius = 3.0;
						params.adaptive_sizing = true;
						params.poisson_disk_sampling = false; // Disabled by default
						params.gradient_based_sizing = true; // Enabled by default
						break;
				}
			}
			break;
			
		case 'superpixel':
			// Superpixel backend parameters
			if (preset.overrides?.superpixel) {
				params.num_superpixels = preset.overrides.superpixel.regionCount ?? 100;
				params.compactness = preset.overrides.superpixel.compactness ?? 10;
				params.slic_iterations = 10;
				params.fill_regions = true;
				params.stroke_regions = preset.overrides.superpixel.borderEmphasis ?? true;
				params.simplify_boundaries = true;
				params.boundary_epsilon = 1.0;
			} else {
				// Default superpixel parameters based on preset - optimized for visual intent
				switch (preset.metadata.id) {
					case 'modern-abstract':
						params.num_superpixels = 75; // Medium-high region count for balanced abstraction
						params.compactness = 15; // Moderate compactness for geometric shapes
						params.slic_iterations = 12; // Extra iterations for quality
						params.fill_regions = true;
						params.stroke_regions = true; // Bold outlines for modern look
						params.simplify_boundaries = true;
						params.boundary_epsilon = 0.8; // Crisp geometric boundaries
						break;
					case 'minimalist-poster':
						params.num_superpixels = 15; // Very few regions for extreme minimalism
						params.compactness = 30; // Very high compactness for clean, large shapes
						params.slic_iterations = 15; // More iterations for precision
						params.fill_regions = true;
						params.stroke_regions = false; // No outlines for minimal look
						params.simplify_boundaries = true;
						params.boundary_epsilon = 2.0; // Very smooth minimal shapes
						break;
					case 'organic-abstract':
						params.num_superpixels = 120; // Many more regions for organic detail
						params.compactness = 3; // Very low compactness for natural, flowing shapes
						params.slic_iterations = 8; // Fewer iterations for organic randomness
						params.fill_regions = true;
						params.stroke_regions = false; // No outlines for organic flow
						params.simplify_boundaries = true;
						params.boundary_epsilon = 1.0; // Moderately smooth organic boundaries
						break;
					default:
						params.num_superpixels = 80;
						params.compactness = 12;
						break;
				}
				params.slic_iterations = 10;
				params.simplify_boundaries = true;
				params.boundary_epsilon = 1.0;
			}
			break;
			
		case 'centerline':
			// Centerline backend parameters
			if (preset.overrides?.centerline) {
				// Map precision to actual parameters
				const precision = preset.overrides.centerline.precision;
				if (precision === 'high') {
					params.enable_adaptive_threshold = true;
					params.window_size = 25;
					params.sensitivity_k = 0.4;
					params.min_branch_length = 8;
				} else {
					params.enable_adaptive_threshold = false;
					params.min_branch_length = 12;
				}
				
				params.douglas_peucker_epsilon = preset.overrides.centerline.smoothing ? 
					(1.0 - preset.overrides.centerline.smoothing) * 2.0 : 1.0;
			} else {
				// Default centerline parameters based on preset - optimized for each use case
				switch (preset.metadata.id) {
					case 'corporate-logo':
						params.enable_adaptive_threshold = true;
						params.window_size = 25;
						params.sensitivity_k = 0.4; // Balanced sensitivity for logo shapes
						params.min_branch_length = 8; // Keep smaller details in logos
						params.douglas_peucker_epsilon = 0.8; // Less smoothing for crisp logos
						params.enable_width_modulation = false; // Uniform width for logos
						params.micro_loop_removal = 8; // Clean up small artifacts
						break;
					case 'technical-drawing':
						params.enable_adaptive_threshold = true;
						params.window_size = 30; // Larger window for technical precision
						params.sensitivity_k = 0.3; // Lower sensitivity for clean lines
						params.min_branch_length = 12; // Remove noise in technical drawings
						params.douglas_peucker_epsilon = 0.3; // Minimal smoothing for precision
						params.enable_width_modulation = false; // Consistent line weights
						params.adaptive_simplification = true; // Better precision
						break;
					case 'text-typography':
						params.enable_adaptive_threshold = true;
						params.window_size = 25;
						params.sensitivity_k = 0.35; // Good for text recognition
						params.min_branch_length = 6; // Preserve character details
						params.douglas_peucker_epsilon = 0.6; // Light smoothing for readability
						params.enable_width_modulation = false; // Uniform text width
						params.micro_loop_removal = 6; // Clean up text artifacts
						break;
					default:
						params.enable_adaptive_threshold = false;
						params.min_branch_length = 12;
						params.douglas_peucker_epsilon = 1.0;
						break;
				}
			}
			break;
	}
	
	return params;
}

/**
 * Get optimal preset for image characteristics
 */
export function getOptimalPreset(
	imageAnalysis: {
		hasText?: boolean;
		isPhoto?: boolean;
		isLogo?: boolean;
		isDrawing?: boolean;
		colorCount?: number;
		contrast?: number;
	}
): string {
	// Logo detection
	if (imageAnalysis.isLogo || (imageAnalysis.hasText && imageAnalysis.colorCount && imageAnalysis.colorCount < 10)) {
		return 'corporate-logo';
	}
	
	// Photo detection
	if (imageAnalysis.isPhoto) {
		return 'photo-to-sketch';
	}
	
	// Drawing detection
	if (imageAnalysis.isDrawing) {
		return 'hand-drawn-illustration';
	}
	
	// High contrast technical drawings
	if (imageAnalysis.contrast && imageAnalysis.contrast > 0.8) {
		return 'technical-drawing';
	}
	
	// Default to hand-drawn for general use
	return 'hand-drawn-illustration';
}

/**
 * Validate if preset is compatible with image
 */
export function isPresetCompatible(
	preset: StylePreset,
	imageInfo: {
		width: number;
		height: number;
		format: string;
	}
): { compatible: boolean; warnings: string[] } {
	const warnings: string[] = [];
	
	// Check image size for complex presets
	const pixelCount = imageInfo.width * imageInfo.height;
	if (preset.metadata.complexity === 'medium' && pixelCount > 4000 * 4000) {
		warnings.push('Large image may take longer to process with this preset');
	}
	
	// Check format compatibility
	if (preset.backend === 'centerline' && imageInfo.format === 'jpeg') {
		warnings.push('JPEG compression may affect line quality - PNG recommended');
	}
	
	// Dots backend works better with smaller images for optimal detail
	if (preset.backend === 'dots' && pixelCount > 2000 * 2000) {
		warnings.push('Consider reducing image size for optimal stippling effect');
	}
	
	// Multipass processing performance warning
	if (shouldEnableMultipass(preset) && pixelCount > 3000 * 3000) {
		warnings.push('Multi-pass processing may take additional time for large images');
	}
	
	return {
		compatible: true, // All presets are technically compatible
		warnings
	};
}

/**
 * Merge preset config with user overrides
 */
export function mergeWithUserConfig(
	presetConfig: VectorizerConfig,
	userConfig: Partial<VectorizerConfig>
): VectorizerConfig {
	// User config takes precedence over preset config
	return {
		...presetConfig,
		...userConfig,
		// Preserve backend from preset unless explicitly overridden
		backend: userConfig.backend || presetConfig.backend
	};
}

/**
 * Get algorithm-specific default configuration for "Custom Settings" preset
 * This provides clean defaults optimized for each backend when user selects custom
 */
export function getAlgorithmDefaults(backend: VectorizerBackend): VectorizerConfig {
	const baseConfig = {
		// Core settings shared by all algorithms
		backend,
		noise_filtering: false,
		noise_filter_spatial_sigma: 1.2,
		noise_filter_range_sigma: 50.0,
		multipass: false,
		pass_count: 1,
		multipass_mode: 'auto' as const,
		reverse_pass: false,
		diagonal_pass: false,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false,
		hand_drawn_preset: 'none' as const,
		variable_weights: 0.0,
		tremor_strength: 0.0,
		tapering: 0.0,
		color_accuracy: 0.7,
		max_colors_per_path: 3,
		color_tolerance: 0.15,
		enable_palette_reduction: false,
		palette_target_colors: 16,
		max_processing_time_ms: 60000
	};

	switch (backend) {
		case 'edge':
			return {
				...baseConfig,
				backend: 'edge',
				detail: 0.6, // Good balance for general edge detection
				stroke_width: 1.5, // Standard edge line width
				preserve_colors: false, // Monochrome by default
				color_sampling: 'dominant' as const
			};

		case 'centerline':
			return {
				...baseConfig,
				backend: 'centerline',
				detail: 0.5, // Moderate detail for skeleton extraction
				stroke_width: 0.8, // Thinner for precise lines
				preserve_colors: false, // Always monochrome for centerline
				color_sampling: 'dominant' as const,
				// Centerline-specific defaults
				enable_adaptive_threshold: false,
				window_size: 25,
				sensitivity_k: 0.4,
				min_branch_length: 12,
				douglas_peucker_epsilon: 1.0,
				enable_width_modulation: false
			};

		case 'dots':
			return {
				...baseConfig,
				backend: 'dots',
				detail: 0.5, // Moderate detail for dot density
				stroke_width: 1.0, // Standard dot width
				preserve_colors: true, // Dots look better with color
				color_sampling: 'content-aware' as const,
				// Dots-specific defaults
				dot_density_threshold: 0.105, // UI value 8 as default
				min_radius: 1.0,
				max_radius: 3.0,
				adaptive_sizing: true,
				background_tolerance: 0.1,
				poisson_disk_sampling: false, // Disabled by default
				gradient_based_sizing: true
			};

		case 'superpixel':
			return {
				...baseConfig,
				backend: 'superpixel',
				detail: 0.4, // Lower detail for region-based approach
				stroke_width: 1.2, // Medium width for region borders
				preserve_colors: true, // Superpixel benefits from color
				color_sampling: 'gradient' as const,
				// Superpixel-specific defaults
				num_superpixels: 100,
				compactness: 15,
				slic_iterations: 10,
				fill_regions: true,
				stroke_regions: true,
				simplify_boundaries: true,
				boundary_epsilon: 1.0
			};

		default:
			throw new Error(`Unsupported backend: ${backend}`);
	}
}