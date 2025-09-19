/**
 * Config Transformer - Converts between frontend and WASM config formats
 *
 * This module handles the transformation between:
 * - Frontend format: camelCase naming, UI-friendly structure
 * - WASM format: snake_case naming, Rust-compatible structure
 */

import type { TraceLowConfig } from './generated/TraceLowConfig';
import type { TraceBackend } from './generated/TraceBackend';
import type { BackgroundRemovalAlgorithm } from './generated/BackgroundRemovalAlgorithm';
import type { ColorSamplingMethod } from './generated/ColorSamplingMethod';
import type { DotShape } from './generated/DotShape';
import type { GridPattern } from './generated/GridPattern';
import type { SuperpixelInitPattern } from './generated/SuperpixelInitPattern';
import type {
	AlgorithmConfig,
	EdgeConfig,
	CenterlineConfig,
	SuperpixelConfig,
	DotsConfig
} from './algorithm-configs';

/**
 * Map frontend algorithm names to WASM TraceBackend enum values
 */
function mapAlgorithmToBackend(algorithm: AlgorithmConfig['algorithm']): TraceBackend {
	switch (algorithm) {
		case 'edge':
			return 'Edge';
		case 'centerline':
			return 'Centerline';
		case 'superpixel':
			return 'Superpixel';
		case 'dots':
			return 'Dots';
		default:
			return 'Edge';
	}
}

/**
 * Map WASM TraceBackend enum to frontend algorithm names
 */
function mapBackendToAlgorithm(backend: TraceBackend): AlgorithmConfig['algorithm'] {
	switch (backend) {
		case 'Edge':
			return 'edge';
		case 'Centerline':
			return 'centerline';
		case 'Superpixel':
			return 'superpixel';
		case 'Dots':
			return 'dots';
		default:
			return 'edge';
	}
}

/**
 * Map frontend dot shape names to WASM DotShape enum values
 */
function mapDotShapeToWasm(shape: DotsConfig['dotShape']): DotShape {
	switch (shape) {
		case 'circle':
			return 'Circle';
		case 'square':
			return 'Square';
		case 'diamond':
			return 'Diamond';
		case 'triangle':
			return 'Triangle';
		default:
			return 'Circle';
	}
}

/**
 * Map frontend grid pattern names to WASM GridPattern enum values
 */
function mapGridPatternToWasm(pattern: DotsConfig['dotGridPattern']): GridPattern {
	switch (pattern) {
		case 'grid':
			return 'Grid';
		case 'hexagonal':
			return 'Hexagonal';
		case 'random':
			return 'Random';
		case 'poisson':
			return 'Poisson';
		default:
			return 'Random';
	}
}

/**
 * Transform frontend AlgorithmConfig to WASM TraceLowConfig format
 *
 * Handles:
 * - Naming convention conversion (camelCase → snake_case)
 * - Type mapping (string enums → Rust enums)
 * - Default value application
 * - Removal of UI-only fields
 */
export function toWasmConfig(config: AlgorithmConfig): TraceLowConfig {
	// Start with defaults for all fields
	const wasmConfig: TraceLowConfig = {
		// Core fields
		backend: mapAlgorithmToBackend(config.algorithm),
		// Convert detail based on algorithm requirements
		// Centerline expects 0.1-1.0 scale, other algorithms expect 1.0-10.0 scale
		detail:
			config.algorithm === 'centerline'
				? ((config.detail ?? 5.0) - 1) * 0.1 + 0.1 // Maps 1→0.1, 10→1.0 for centerline
				: config.detail ?? 5.0, // Direct mapping for edge and other algorithms
		stroke_px_at_1080p: config.strokeWidth ?? 1.5,

		// Multi-pass processing
		enable_multipass:
			(config.algorithm === 'edge' || config.algorithm === 'centerline') &&
			(config as EdgeConfig | CenterlineConfig).passCount
				? (config as EdgeConfig | CenterlineConfig).passCount > 1
				: false,
		pass_count:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig | CenterlineConfig).passCount ?? 1)
				: 1,
		conservative_detail: null,
		aggressive_detail: null,

		// Noise filtering
		noise_filtering: config.noiseFiltering ?? false,
		noise_filter_spatial_sigma: config.noiseFilterSpatialSigma ?? 1.2,
		noise_filter_range_sigma: config.noiseFilterRangeSigma ?? 50.0,

		// Directional processing
		enable_reverse_pass:
			config.algorithm === 'edge' ? ((config as EdgeConfig).enableReversePass ?? false) : false,
		enable_diagonal_pass:
			config.algorithm === 'edge' ? ((config as EdgeConfig).enableDiagonalPass ?? false) : false,
		directional_strength_threshold:
			config.algorithm === 'edge'
				? ((config as EdgeConfig).directionalStrengthThreshold ?? 0.3)
				: 0.3,
		max_processing_time_ms: 10000, // Now properly typed as number

		// Advanced edge detection (ETF/FDoG)
		enable_etf_fdog:
			config.algorithm === 'edge' ? ((config as EdgeConfig).enableEtfFdog ?? false) : false,
		etf_radius: config.algorithm === 'edge' ? ((config as EdgeConfig).etfRadius ?? 4) : 4,
		etf_iterations: config.algorithm === 'edge' ? ((config as EdgeConfig).etfIterations ?? 4) : 4,
		etf_coherency_tau:
			config.algorithm === 'edge' ? ((config as EdgeConfig).etfCoherencyTau ?? 0.2) : 0.2,
		fdog_sigma_s: config.algorithm === 'edge' ? ((config as EdgeConfig).fdogSigmaS ?? 1.2) : 1.2,
		fdog_sigma_c: config.algorithm === 'edge' ? ((config as EdgeConfig).fdogSigmaC ?? 2.0) : 2.0,
		fdog_tau: config.algorithm === 'edge' ? ((config as EdgeConfig).fdogTau ?? 0.9) : 0.9,
		// NMS thresholds are calculated automatically from detail level in core algorithm
		nms_low: 0.08, // Default value - will be overridden by detail-based calculation
		nms_high: 0.16, // Default value - will be overridden by detail-based calculation

		// Flow tracing
		enable_flow_tracing:
			config.algorithm === 'edge' ? ((config as EdgeConfig).enableFlowTracing ?? false) : false,
		trace_min_grad:
			config.algorithm === 'edge' ? ((config as EdgeConfig).traceMinGrad ?? 0.08) : 0.08,
		trace_min_coherency:
			config.algorithm === 'edge' ? ((config as EdgeConfig).traceMinCoherency ?? 0.15) : 0.15,
		trace_max_gap: config.algorithm === 'edge' ? ((config as EdgeConfig).traceMaxGap ?? 4) : 4,
		trace_max_len:
			config.algorithm === 'edge' ? ((config as EdgeConfig).traceMaxLen ?? 10000) : 10000,

		// Bezier fitting
		enable_bezier_fitting:
			config.algorithm === 'edge' ? ((config as EdgeConfig).enableBezierFitting ?? false) : false,
		fit_lambda_curv:
			config.algorithm === 'edge' ? ((config as EdgeConfig).fitLambdaCurv ?? 0.02) : 0.02,
		fit_max_err: config.algorithm === 'edge' ? ((config as EdgeConfig).fitMaxErr ?? 0.8) : 0.8,
		fit_split_angle:
			config.algorithm === 'edge' ? ((config as EdgeConfig).fitSplitAngle ?? 32.0) : 32.0,

		// Dots backend specific
		dot_density_threshold:
			config.algorithm === 'dots'
				? ((config as DotsConfig).dotDensityThreshold ??
					// Map UI dotDensity (1-10) to threshold (0.02-0.4) - higher UI value = lower threshold = more dots
					0.4 - ((((config as DotsConfig).dotDensity ?? 5) - 1) / 9) * (0.4 - 0.02))
				: 0.1,
		dot_min_radius:
			config.algorithm === 'dots'
				? // Check both UI alias and base property names
					((config as DotsConfig).minRadius ??
					(config as DotsConfig).dotMinRadius ??
					// If not explicitly set, derive from strokeWidth (Dot Width slider)
					Math.max(0.1, (config.strokeWidth ?? 1.0) * 0.3))
				: 0.5,
		dot_max_radius:
			config.algorithm === 'dots'
				? // Check both UI alias and base property names
					((config as DotsConfig).maxRadius ??
					(config as DotsConfig).dotMaxRadius ??
					// If not explicitly set, derive from strokeWidth (Dot Width slider)
					Math.min(20.0, (config.strokeWidth ?? 1.0) * 1.5))
				: 3.0,
		dot_preserve_colors:
			config.algorithm === 'dots'
				? ((config as DotsConfig).dotPreserveColors ?? false)
				: (config.preserveColors ?? false),
		dot_adaptive_sizing:
			config.algorithm === 'dots'
				? // Check both UI alias and base property names
					((config as DotsConfig).adaptiveSizing ??
					(config as DotsConfig).dotAdaptiveSizing ??
					true)
				: true,
		dot_background_tolerance:
			config.algorithm === 'dots' ? ((config as DotsConfig).dotBackgroundTolerance ?? 0.1) : 0.1,
		dot_gradient_based_sizing:
			config.algorithm === 'dots'
				? ((config as DotsConfig).dotGradientBasedSizing ?? false)
				: false,
		dot_size_variation:
			config.algorithm === 'dots'
				? ((config as DotsConfig).sizeVariation ?? (config as DotsConfig).dotSizeVariation ?? 0.3)
				: 0.3,
		dot_shape:
			config.algorithm === 'dots'
				? mapDotShapeToWasm((config as DotsConfig).dotShape ?? 'circle')
				: 'Circle',
		dot_grid_pattern:
			config.algorithm === 'dots'
				? mapGridPatternToWasm((config as DotsConfig).dotGridPattern ?? 'random')
				: 'Random',

		// Centerline backend specific
		enable_adaptive_threshold:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).enableAdaptiveThreshold ?? true)
				: true,
		adaptive_threshold_window_size:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).adaptiveThresholdWindowSize ?? 25)
				: 25,
		adaptive_threshold_k:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).adaptiveThresholdK ?? 0.4)
				: 0.4,
		adaptive_threshold_use_optimized: true,
		enable_width_modulation:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).enableWidthModulation ?? false)
				: false,
		width_multiplier:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).widthMultiplier ?? 1.0)
				: 1.0,
		min_branch_length:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).minBranchLength ?? 8.0)
				: 8.0,
		douglas_peucker_epsilon:
			config.algorithm === 'centerline'
				? ((config as CenterlineConfig).douglasPeuckerEpsilon ?? 1.5)
				: 1.5,
		enable_distance_transform_centerline: false,

		// Superpixel backend specific
		num_superpixels:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).numSuperpixels ?? 200)
				: 200,
		superpixel_compactness:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelCompactness ?? 10.0)
				: 10.0,
		superpixel_slic_iterations:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).iterations ??
					(config as SuperpixelConfig).superpixelSlicIterations ??
					10)
				: 10,
		superpixel_initialization_pattern:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelInitializationPattern ?? 'Hexagonal')
				: 'Hexagonal',
		superpixel_fill_regions:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelFillRegions ?? true)
				: true,
		superpixel_stroke_regions:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelStrokeRegions ?? true)
				: true,
		superpixel_simplify_boundaries:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelSimplifyBoundaries ?? true)
				: true,
		superpixel_boundary_epsilon:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelBoundaryEpsilon ?? 1.0)
				: 1.0,
		superpixel_preserve_colors:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelPreserveColors ?? false)
				: false,
		superpixel_min_region_size:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelMinRegionSize ?? 5)
				: 5,
		superpixel_enforce_connectivity:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelEnforceConnectivity ?? true)
				: true,
		superpixel_enhance_edges:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelEnhanceEdges ?? false)
				: false,
		superpixel_merge_threshold:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).superpixelMergeThreshold ?? 0.15)
				: 0.15,
		enable_advanced_merging:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).enableAdvancedMerging ?? false)
				: false,

		// Line tracing color configuration
		// For edge/centerline, use linePreserveColors if available, fallback to preserveColors
		line_preserve_colors:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig).linePreserveColors ?? config.preserveColors ?? false)
				: (config.preserveColors ?? false),
		line_color_sampling:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig).lineColorSampling ?? ('Adaptive' as ColorSamplingMethod))
				: config.algorithm === 'superpixel'
					? ((config as SuperpixelConfig).superpixelColorSampling ??
						('Adaptive' as ColorSamplingMethod))
					: ('Adaptive' as ColorSamplingMethod),
		line_color_accuracy:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig).lineColorAccuracy ?? 0.7)
				: config.algorithm === 'superpixel'
					? ((config as SuperpixelConfig).superpixelColorAccuracy ?? 0.7)
					: 0.7,
		max_colors_per_path:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig).maxColorsPerPath ?? 3)
				: config.algorithm === 'superpixel'
					? ((config as SuperpixelConfig).superpixelMaxColorsPerRegion ?? 3)
					: 3,
		color_tolerance:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig).colorTolerance ?? 0.15)
				: config.algorithm === 'superpixel'
					? ((config as SuperpixelConfig).superpixelColorTolerance ?? 0.15)
					: 0.15,
		enable_palette_reduction:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).enablePaletteReduction ?? false)
				: false,
		palette_target_colors:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).paletteTargetColors ?? 16)
				: 16,
		palette_method:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).paletteMethod ?? 'Kmeans')
				: 'Kmeans',
		palette_dithering:
			config.algorithm === 'superpixel'
				? ((config as SuperpixelConfig).paletteDithering ?? false)
				: false,

		// Background removal
		enable_background_removal: config.enableBackgroundRemoval ?? false,
		background_removal_strength: config.backgroundRemovalStrength ?? 0.5,
		background_removal_algorithm: config.backgroundRemovalAlgorithm
			? ((config.backgroundRemovalAlgorithm.charAt(0).toUpperCase() +
					config.backgroundRemovalAlgorithm.slice(1)) as BackgroundRemovalAlgorithm)
			: ('Otsu' as BackgroundRemovalAlgorithm),
		background_removal_threshold: null,

		// Safety and optimization
		max_image_size: 4096,
		svg_precision: 2,

		// Hand-drawn parameters (not part of TraceLowConfig but included for unified config)
		handDrawnPreset:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig | CenterlineConfig).handDrawnPreset ?? 'none')
				: 'none',
		handDrawnTremorStrength:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig | CenterlineConfig).handDrawnTremorStrength ?? 0.0)
				: 0.0,
		handDrawnVariableWeights:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig | CenterlineConfig).handDrawnVariableWeights ?? 0.0)
				: 0.0,
		handDrawnTapering:
			config.algorithm === 'edge' || config.algorithm === 'centerline'
				? ((config as EdgeConfig | CenterlineConfig).handDrawnTapering ?? 0.0)
				: 0.0
	} as any;

	return wasmConfig;
}

/**
 * Transform WASM TraceLowConfig to frontend AlgorithmConfig format
 *
 * Used when:
 * - Loading saved configs
 * - Receiving config from WASM
 * - Debugging/logging
 */
export function fromWasmConfig(config: TraceLowConfig): Partial<AlgorithmConfig> {
	return {
		// Core fields
		algorithm: mapBackendToAlgorithm(config.backend),
		// Convert detail based on algorithm requirements
		// Centerline uses 0.1-1.0 scale, other algorithms use 1.0-10.0 scale directly
		detail:
			mapBackendToAlgorithm(config.backend) === 'centerline'
				? Math.round((config.detail - 0.1) / 0.1 + 1) // Maps 0.1→1, 1.0→10 for centerline
				: config.detail, // Direct mapping for edge and other algorithms
		strokeWidth: config.stroke_px_at_1080p,

		// Processing options
		passCount: config.pass_count,
		enableReversePass: config.enable_reverse_pass,
		enableDiagonalPass: config.enable_diagonal_pass,

		// Preprocessing
		noiseFiltering: config.noise_filtering,
		enableBackgroundRemoval: config.enable_background_removal,
		backgroundRemovalStrength: config.background_removal_strength,

		// Color options
		preserveColors: config.line_preserve_colors || config.dot_preserve_colors,

		// Algorithm-specific fields
		// Dots
		minRadius: config.dot_min_radius,
		maxRadius: config.dot_max_radius,

		// Centerline
		enableAdaptiveThreshold: config.enable_adaptive_threshold,
		adaptiveThresholdWindowSize: config.adaptive_threshold_window_size,
		adaptiveThresholdK: config.adaptive_threshold_k,
		enableWidthModulation: config.enable_width_modulation,
		widthMultiplier: config.width_multiplier,

		// Superpixel
		numSuperpixels: config.num_superpixels,
		compactness: config.superpixel_compactness,
		iterations: config.superpixel_slic_iterations
	};
}

/**
 * Validate that a config can be safely transformed
 * Returns validation errors if any
 */
export function validateConfigTransform(config: AlgorithmConfig): string[] {
	const errors: string[] = [];

	if (config.detail < 0 || config.detail > 10) {
		errors.push(`Detail must be between 0 and 10, got ${config.detail}`);
	}

	if (config.strokeWidth && (config.strokeWidth < 0.1 || config.strokeWidth > 10)) {
		errors.push(`Stroke width must be between 0.1 and 10, got ${config.strokeWidth}`);
	}

	if (config.algorithm === 'edge') {
		const edgeConfig = config as EdgeConfig;
		if (edgeConfig.passCount && (edgeConfig.passCount < 1 || edgeConfig.passCount > 10)) {
			errors.push(`Pass count must be between 1 and 10, got ${edgeConfig.passCount}`);
		}
	}

	// Algorithm-specific validations
	if (config.algorithm === 'dots') {
		const dotsConfig = config as DotsConfig;
		if (
			dotsConfig.minRadius &&
			dotsConfig.maxRadius &&
			dotsConfig.minRadius > dotsConfig.maxRadius
		) {
			errors.push('Min radius cannot be greater than max radius');
		}
	}

	return errors;
}
