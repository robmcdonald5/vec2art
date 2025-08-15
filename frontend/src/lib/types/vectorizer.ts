/**
 * TypeScript interfaces for WASM vectorizer integration
 */

export type VectorizerBackend = 'edge' | 'centerline' | 'superpixel' | 'dots';

export type VectorizerPreset = 'sketch' | 'technical' | 'artistic' | 'poster' | 'comic';

export type HandDrawnPreset = 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy';

export interface VectorizerConfig {
	// Core settings
	backend: VectorizerBackend;
	preset?: VectorizerPreset;
	detail: number; // 0.0-1.0 (internally mapped from 1-10 UI)
	stroke_width: number; // 0.5-5.0 px
	noise_filtering: boolean;

	// Multi-pass processing
	multipass: boolean;
	conservative_detail?: number; // 0.0-1.0
	aggressive_detail?: number; // 0.0-1.0

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
	hand_drawn_style?: boolean; // Legacy compatibility for hand-drawn style toggle
	variable_weights: number; // 0.0-1.0
	tremor_strength: number; // 0.0-0.5
	tremor_effects?: boolean; // Legacy compatibility for tremor effects toggle
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

	// Configuration
	config: VectorizerConfig;
	capabilities?: WasmCapabilityReport;

	// Input image
	input_image?: ImageData;
	input_file?: File;
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
	detail: 0.4, // Medium detail (equivalent to old 4)
	stroke_width: 1.0,
	noise_filtering: true,
	multipass: true,
	reverse_pass: false,
	diagonal_pass: false,
	enable_etf_fdog: false,
	enable_flow_tracing: false,
	enable_bezier_fitting: true,
	hand_drawn_preset: 'medium',
	variable_weights: 0.3,
	tremor_strength: 0.2,
	tapering: 0.5,
	max_processing_time_ms: 30000 // 30 seconds
};

// Preset configurations
export const PRESET_CONFIGS: Record<VectorizerPreset, Partial<VectorizerConfig>> = {
	sketch: {
		backend: 'edge',
		detail: 0.4,
		hand_drawn_preset: 'medium',
		multipass: true,
		variable_weights: 0.4,
		tremor_strength: 0.3,
		tapering: 0.6
	},
	technical: {
		backend: 'centerline',
		detail: 0.3,
		hand_drawn_preset: 'none',
		enable_adaptive_threshold: true,
		variable_weights: 0.0,
		tremor_strength: 0.0,
		tapering: 0.0
	},
	artistic: {
		backend: 'dots',
		dot_density_threshold: 0.15,
		preserve_colors: true,
		adaptive_sizing: true,
		min_radius: 0.5,
		max_radius: 3.0
	},
	poster: {
		backend: 'superpixel',
		num_superpixels: 150,
		fill_regions: true,
		compactness: 20,
		stroke_regions: true
	},
	comic: {
		backend: 'edge',
		detail: 0.5,
		hand_drawn_preset: 'strong',
		reverse_pass: true,
		diagonal_pass: true,
		variable_weights: 0.6,
		tremor_strength: 0.4,
		tapering: 0.7
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
	subtle: 'Barely noticeable organic feel with minimal irregularities',
	medium: 'Noticeable hand-drawn character with moderate artistic styling',
	strong: 'Obvious artistic style with pronounced hand-drawn effects',
	sketchy: 'Loose, sketchy appearance with maximum artistic character'
};
