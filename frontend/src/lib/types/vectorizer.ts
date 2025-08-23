/**
 * TypeScript interfaces for WASM vectorizer integration
 */

export type VectorizerBackend = 'edge' | 'centerline' | 'superpixel' | 'dots';

export type VectorizerPreset = 'sketch' | 'technical' | 'artistic' | 'poster' | 'comic';

export type HandDrawnPreset = 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy' | 'custom';

export interface VectorizerConfig {
	// Core settings
	backend: VectorizerBackend;
	preset?: VectorizerPreset;
	detail: number; // 0.0-1.0 (internally mapped from 1-10 UI)
	stroke_width: number; // 0.5-5.0 px
	noise_filtering: boolean;
	noise_filter_spatial_sigma?: number; // 0.5-1.5 for UI slider (higher = more smoothing, default: 1.2)
	noise_filter_range_sigma?: number; // 10.0-100.0 (higher = less edge preservation, default: 50.0)

	// Multi-pass processing
	multipass: boolean; // Legacy support - will be computed from pass_count
	pass_count: number; // 1-4 passes (1 = single pass, 2+ = multipass)
	multipass_mode: 'auto' | 'manual'; // Auto uses calculated thresholds, manual uses custom values
	conservative_detail?: number; // 0.0-1.0 (for manual mode)
	aggressive_detail?: number; // 0.0-1.0 (for manual mode)

	// Directional processing
	reverse_pass: boolean;
	diagonal_pass: boolean;
	directional_strength_threshold?: number; // 0.0-1.0

	// Advanced Edge Detection (ETF/FDoG)
	enable_etf_fdog: boolean;
	etf_radius?: number; // 2-8
	etf_iterations?: number; // 2-8
	etf_coherency_tau?: number; // 0.1-0.5
	fdog_sigma_s?: number; // 0.4-2.0
	fdog_sigma_c?: number; // 1.0-4.0
	fdog_tau?: number; // 0.5-1.0
	nms_low?: number; // 0.02-0.2
	nms_high?: number; // 0.1-0.4

	// Flow-guided tracing
	enable_flow_tracing: boolean;
	trace_min_gradient?: number; // 0.02-0.2
	trace_min_coherency?: number; // 0.05-0.3
	trace_max_gap?: number; // 2-10 px
	trace_max_length?: number; // 1000-50000

	// Bézier curve fitting
	enable_bezier_fitting: boolean;
	fit_lambda_curvature?: number; // 0.01-0.1
	fit_max_error?: number; // 0.5-2.0
	fit_split_angle?: number; // 15-60 degrees

	// Hand-drawn aesthetics
	hand_drawn_preset: HandDrawnPreset;
	variable_weights: number; // 0.0-1.0
	tremor_strength: number; // 0.0-0.5
	tapering: number; // 0.0-1.0
	pressure_variation?: number; // 0.0-1.0
	base_width_multiplier?: number; // 0.5-2.0

	// Centerline backend specific
	enable_adaptive_threshold?: boolean;
	window_size?: number; // 25-35 px
	sensitivity_k?: number; // 0.3-0.5
	use_optimized?: boolean;
	thinning_algorithm?: 'guo_hall';
	min_branch_length?: number; // 4-24 px
	micro_loop_removal?: number; // 8-16 px
	enable_width_modulation?: boolean;
	edt_radius_ratio?: number; // 0.5-0.9
	width_modulation_range?: [number, number]; // [0.6, 1.8]
	max_join_distance?: number; // 3-10 px
	max_join_angle?: number; // 15-45 degrees
	edt_bridge_check?: boolean;
	douglas_peucker_epsilon?: number; // 0.5-3.0 px
	adaptive_simplification?: boolean;

	// Dots backend specific
	dot_density_threshold?: number; // 0.0-1.0
	dot_density?: number; // Legacy alias for dot_density_threshold
	dot_size_range?: [number, number]; // Legacy range format [min, max]
	min_radius?: number; // 0.2-3.0 px
	max_radius?: number; // 0.5-10.0 px
	adaptive_sizing?: boolean;
	preserve_colors?: boolean;
	background_tolerance?: number; // 0.0-1.0
	poisson_disk_sampling?: boolean;
	min_distance_factor?: number; // 0.5-2.0
	grid_resolution?: number; // 0.5-2.0
	gradient_based_sizing?: boolean;
	local_variance_scaling?: boolean;
	color_clustering?: boolean;
	opacity_variation?: number; // 0.5-1.0

	// Superpixel backend specific
	num_superpixels?: number; // 50-500
	compactness?: number; // 5-30
	slic_iterations?: number; // 5-15
	min_region_size?: number; // 10-100 px²
	color_distance?: number; // 10-50
	spatial_distance_weight?: number; // 0.5-2.0
	fill_regions?: boolean;
	stroke_regions?: boolean;
	simplify_boundaries?: boolean;
	boundary_epsilon?: number; // 0.5-3.0 px

	// Line tracing color options
	line_preserve_colors?: boolean; // Whether to preserve original colors in line tracing
	line_color_sampling?: 'dominant' | 'gradient' | 'content-aware' | 'adaptive'; // Color sampling method
	line_color_accuracy?: number; // 0.0-1.0 (0.0 = fast, 1.0 = accurate)
	max_colors_per_path?: number; // 1-10 maximum colors per path segment
	color_tolerance?: number; // 0.0-1.0 color similarity tolerance
	enable_palette_reduction?: boolean; // Whether to enable color palette reduction
	palette_target_colors?: number; // 2-50 target number of colors for palette reduction

	// Global output control
	svg_precision?: number; // 0-4 decimal places
	optimize_svg?: boolean;
	include_metadata?: boolean;

	// Performance settings
	max_processing_time_ms?: number;
	thread_count?: number;
	max_image_size?: number; // 512-8192 px
	memory_budget?: number; // 100-2000 MB
	random_seed?: number;
}

export interface ProcessingProgress {
	stage: string;
	progress: number; // 0-100
	elapsed_ms: number;
	estimated_remaining_ms?: number;
	message?: string; // Optional message for current processing stage
}

export interface ProcessingResult {
	svg: string;
	processing_time_ms: number;
	config_used: VectorizerConfig;
	statistics?: {
		input_dimensions: [number, number];
		paths_generated: number;
		dots_generated?: number;
		compression_ratio: number;
	};
}

export interface VectorizerError {
	type: 'config' | 'processing' | 'memory' | 'threading' | 'unknown';
	message: string;
	details?: string;
}

export interface WasmCapabilityReport {
	threading_supported: boolean;
	shared_array_buffer_available: boolean;
	cross_origin_isolated: boolean;
	hardware_concurrency: number;
	missing_requirements: string[];
	recommendations: string[];
}

export interface VectorizerState {
	// Processing state
	is_processing: boolean;
	is_initialized: boolean;
	has_error: boolean;
	error?: VectorizerError;

	// Current operation
	current_progress?: ProcessingProgress;
	last_result?: ProcessingResult;
	batch_results?: ProcessingResult[]; // For multi-image processing

	// Configuration
	config: VectorizerConfig;
	capabilities?: WasmCapabilityReport;

	// Input images - support both single and multi-image workflows
	input_image?: ImageData; // Legacy single image support
	input_file?: File; // Legacy single file support
	input_images?: ImageData[]; // Multi-image support
	input_files?: File[]; // Multi-file support
	current_image_index?: number; // Active image for preview/processing
}

// Web Worker message types
export interface WorkerMessage {
	id: string;
	type: 'init' | 'process' | 'progress' | 'result' | 'error' | 'capabilities';
}

export interface WorkerInitMessage extends WorkerMessage {
	type: 'init';
	config?: Partial<VectorizerConfig>;
}

export interface WorkerProcessMessage extends WorkerMessage {
	type: 'process';
	image_data: ImageData;
	config: VectorizerConfig;
}

export interface WorkerProgressMessage extends WorkerMessage {
	type: 'progress';
	progress: ProcessingProgress;
}

export interface WorkerResultMessage extends WorkerMessage {
	type: 'result';
	result: ProcessingResult;
}

export interface WorkerErrorMessage extends WorkerMessage {
	type: 'error';
	error: VectorizerError;
}

export interface WorkerCapabilitiesMessage extends WorkerMessage {
	type: 'capabilities';
	capabilities: WasmCapabilityReport;
}

export type WorkerMessageType =
	| WorkerInitMessage
	| WorkerProcessMessage
	| WorkerProgressMessage
	| WorkerResultMessage
	| WorkerErrorMessage
	| WorkerCapabilitiesMessage;

// Default configurations
export const DEFAULT_CONFIG: VectorizerConfig = {
	backend: 'edge',
	detail: 0.8, // High detail (8/10) for better edge detection
	stroke_width: 1.5,
	noise_filtering: false, // Off by default for cleaner raw processing
	noise_filter_spatial_sigma: 1.2,
	noise_filter_range_sigma: 50.0,
	multipass: false, // Legacy - computed from pass_count
	pass_count: 1, // Default to single pass for optimal performance
	multipass_mode: 'auto', // Auto-calculate thresholds by default
	reverse_pass: false,
	diagonal_pass: false,
	enable_etf_fdog: false,
	enable_flow_tracing: false,
	enable_bezier_fitting: false, // Disabled by default to avoid flow_tracing dependency
	hand_drawn_preset: 'none',
	variable_weights: 0.0,
	tremor_strength: 0.0,
	tapering: 0.0,
	// Line tracing color defaults
	line_preserve_colors: false, // Default to monochrome for backward compatibility
	line_color_sampling: 'dominant', // Default to simple dominant color sampling
	line_color_accuracy: 0.7, // Good balance of speed vs accuracy
	max_colors_per_path: 3, // Reasonable color complexity limit
	color_tolerance: 0.15, // Moderate color similarity threshold
	enable_palette_reduction: false, // Default disabled for backward compatibility
	palette_target_colors: 16, // Balanced color count for palette reduction
	max_processing_time_ms: 60000 // 60 seconds for comprehensive processing
};

// Preset configurations
export const PRESET_CONFIGS: Record<VectorizerPreset, Partial<VectorizerConfig>> = {
	sketch: {
		// Edge backend - perfect for sketch-like line art
		backend: 'edge',
		detail: 0.6, // Higher detail for quality
		stroke_width: 1.5, // Consistent with defaults
		hand_drawn_preset: 'subtle', // Light artistic effect
		pass_count: 2, // Enable multipass for better sketch quality
		multipass: true,
		noise_filtering: true,
		variable_weights: 0.3,
		tremor_strength: 0.1,
		tapering: 0.2,
		// Safe settings - no advanced features that cause panics
		enable_flow_tracing: false,
		enable_bezier_fitting: false,
		reverse_pass: false,
		diagonal_pass: false
	},
	technical: {
		// Centerline backend - precise skeleton extraction
		backend: 'centerline',
		detail: 0.3,
		stroke_width: 0.8,
		hand_drawn_preset: 'none',
		pass_count: 1, // Single pass for precise technical drawings
		multipass: false,
		noise_filtering: true,
		variable_weights: 0.0,
		tremor_strength: 0.0,
		tapering: 0.0,
		// Centerline-specific settings for precision
		enable_adaptive_threshold: true,
		window_size: 25,
		sensitivity_k: 0.4,
		min_branch_length: 8,
		enable_width_modulation: false,
		douglas_peucker_epsilon: 1.0
	},
	artistic: {
		// Dots backend - stippling and pointillism
		backend: 'dots',
		detail: 0.3, // Less detail for cleaner stippling
		pass_count: 1, // Single pass for dots algorithm
		hand_drawn_preset: 'none', // Hand-drawn effects don't apply to dots
		variable_weights: 0.0,
		tremor_strength: 0.0,
		tapering: 0.0,
		// Dots-specific settings
		dot_density_threshold: 0.15,
		preserve_colors: true,
		adaptive_sizing: true,
		min_radius: 0.5,
		max_radius: 3.0,
		background_tolerance: 0.1,
		poisson_disk_sampling: true,
		gradient_based_sizing: true,
		// Line color settings (for when user switches to edge/centerline)
		line_preserve_colors: true,
		line_color_sampling: 'adaptive',
		line_color_accuracy: 0.8
	},
	poster: {
		// Superpixel backend - bold regions and clean shapes
		backend: 'superpixel',
		detail: 0.2, // Low detail for clean regions
		stroke_width: 1.5,
		pass_count: 1, // Single pass for clean superpixel processing
		hand_drawn_preset: 'subtle', // Slight artistic touch for style
		variable_weights: 0.1,
		tremor_strength: 0.0,
		tapering: 0.2,
		// Superpixel-specific settings
		num_superpixels: 150,
		compactness: 20,
		slic_iterations: 10,
		fill_regions: true,
		stroke_regions: true,
		simplify_boundaries: true,
		boundary_epsilon: 1.0
	},
	comic: {
		// Edge backend - high-quality comic book style
		backend: 'edge',
		detail: 0.7, // High detail for comic quality
		stroke_width: 1.5, // Consistent with defaults
		hand_drawn_preset: 'medium', // Moderate artistic effect
		pass_count: 2, // Enable multipass for high-quality comic style
		multipass: true,
		noise_filtering: true,
		// SAFE SETTINGS: Disable panic-prone features
		reverse_pass: false,
		diagonal_pass: false,
		variable_weights: 0.4,
		tremor_strength: 0.2,
		tapering: 0.3,
		// Disable advanced features that cause panics
		enable_flow_tracing: false,
		enable_bezier_fitting: false,
		enable_etf_fdog: false,
		// Line color settings for comic book style
		line_preserve_colors: true,
		line_color_sampling: 'gradient',
		line_color_accuracy: 0.6
	}
};

export const BACKEND_DESCRIPTIONS: Record<VectorizerBackend, string> = {
	edge: 'Advanced edge detection with Canny algorithm. Best for detailed line art, drawings, and complex imagery.',
	centerline:
		'Zhang-Suen skeleton-based tracing. Ideal for bold shapes, logos, text, and high-contrast imagery.',
	superpixel:
		'SLIC region-based approach. Perfect for stylized art, abstract representations, and color-rich images.',
	dots: 'Adaptive stippling with content-aware placement. Great for artistic effects, texture emphasis, and vintage styles.'
};

export const PRESET_DESCRIPTIONS: Record<VectorizerPreset, string> = {
	sketch:
		'Edge backend with medium detail and hand-drawn style for converting photos to sketch-like line art',
	technical:
		'Centerline backend with precise extraction for technical drawings, logos, and precise line art',
	artistic:
		'Dots backend with colorful stippling and adaptive sizing for artistic stippling and pointillism effects',
	poster:
		'Superpixel backend with bold regions and filled areas for poster-style region art with bold shapes',
	comic:
		'Edge backend with strong hand-drawn effects and directional passes for comic book style line art'
};

export const HAND_DRAWN_DESCRIPTIONS: Record<HandDrawnPreset, string> = {
	none: 'Clean, precise lines with no artistic effects',
	subtle: 'Minimal line variation and organic feel - fine-tune with individual controls',
	medium: 'Moderate thickness variation and natural tapering - adjustable independently',
	strong: 'Pronounced line weight changes and artistic styling - customizable effects',
	sketchy: 'Maximum artistic character with loose, sketchy appearance - full control available',
	custom: 'Custom artistic effects - manually adjusted using individual sliders'
};

// Utility functions for multipass processing  
export function calculateMultipassConfig(
	config: VectorizerConfig
): { multipass: boolean } {
	const { pass_count } = config;
	
	// Enable multipass for 2+ passes
	return { 
		multipass: pass_count > 1 
	};
}

export const PASS_COUNT_DESCRIPTIONS: Record<number, string> = {
	1: 'Single pass - fastest processing, good for simple images',
	2: 'Dual pass - multi-scale processing, slower processing',
	3: 'Triple pass - extended multi-scale processing, slower processing',
	4: 'Quad pass - maximum scale coverage, significantly slower processing'
};
