/**
 * Algorithm Configuration Types
 *
 * Strongly typed configuration interfaces for each vectorization algorithm.
 * These types provide direct mapping to WASM parameters with no translation needed.
 */

// Algorithm type union
export type AlgorithmType = 'edge' | 'centerline' | 'superpixel' | 'dots';

// Background removal algorithms
export type BackgroundRemovalAlgorithm = 'otsu' | 'adaptive';

// Import generated type to ensure consistency with backend
import type { SuperpixelInitPattern } from './generated/SuperpixelInitPattern';
export type { SuperpixelInitPattern } from './generated/SuperpixelInitPattern';

// Dot grid patterns
export type DotGridPattern = 'grid' | 'hexagonal' | 'random' | 'poisson';

// Dot shapes
export type DotShape = 'circle' | 'square' | 'diamond' | 'triangle';

// Color sampling methods (use generated types from WASM)
import type { ColorSamplingMethod } from './generated/ColorSamplingMethod';
export type { ColorSamplingMethod } from './generated/ColorSamplingMethod';

// Palette reduction methods (use generated types from WASM)
import type { PaletteMethod } from './generated/PaletteMethod';
export type { PaletteMethod } from './generated/PaletteMethod';

// Hand-drawn presets
export type HandDrawnPreset = 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy' | 'custom';

// Dot sizing modes
export type DotSizingMode = 'adaptive' | 'gradient' | 'static';

/**
 * Core configuration shared by all algorithms
 */
export interface CoreConfig {
	algorithm: AlgorithmType;
	detail: number; // 0.0-1.0
	strokeWidth: number; // 0.1-10.0
	preserveColors?: boolean; // Whether to preserve original colors
	noiseFiltering?: boolean;
	noiseFilterSpatialSigma?: number; // 0.5-5.0
	noiseFilterRangeSigma?: number; // 10.0-200.0
	enableBackgroundRemoval?: boolean;
	backgroundRemovalStrength?: number; // 0.0-1.0
	backgroundRemovalAlgorithm?: BackgroundRemovalAlgorithm;
	backgroundRemovalThreshold?: number; // 0-255
}

/**
 * Edge algorithm configuration
 */
export interface EdgeConfig extends CoreConfig {
	algorithm: 'edge';

	// Multipass processing
	passCount: number; // 1-10
	enableReversePass: boolean;
	enableDiagonalPass: boolean;
	directionalStrengthThreshold: number; // 0.0-1.0

	// ETF/FDoG advanced edge detection
	enableEtfFdog: boolean;
	etfRadius: number; // 2-8
	etfIterations: number; // 1-10
	etfCoherencyTau: number; // 0.0-1.0
	fdogSigmaS: number; // 0.3-2.0
	fdogSigmaC: number; // 0.5-4.0
	fdogTau: number; // 0.0-1.0

	// Non-maximum suppression is handled automatically by detail level

	// Flow-guided tracing
	enableFlowTracing: boolean;
	traceMinGrad: number; // 0.01-0.1
	traceMinCoherency: number; // 0.01-0.2
	traceMaxGap: number; // 0-20
	traceMaxLen: number; // 100-100000

	// Bézier curve fitting
	enableBezierFitting: boolean;
	fitLambdaCurv: number; // 0.001-0.1
	fitMaxErr: number; // 0.5-5.0
	fitSplitAngle: number; // 10.0-90.0
	fitMaxIterations?: number; // 10-100

	// Color processing
	linePreserveColors: boolean;
	lineColorSampling?: ColorSamplingMethod;
	lineColorAccuracy: number; // 0.0-1.0
	maxColorsPerPath: number; // 1-10
	colorTolerance: number; // 0.0-1.0

	// Hand-drawn effects
	handDrawnPreset: HandDrawnPreset;
	handDrawnVariableWeights: number; // 0.0-1.0
	handDrawnTremorStrength: number; // 0.0-0.5
	handDrawnTapering: number; // 0.0-1.0
	handDrawnPressureVariation?: number; // 0.0-1.0
	handDrawnRoughness?: number; // 0.0-1.0
	handDrawnWobbleFrequency?: number; // 0.1-5.0
	handDrawnWobbleAmplitude?: number; // 0.0-2.0
	handDrawnOvershoot?: number; // 0.0-10.0
	handDrawnUndershoot?: number; // 0.0-10.0
}

/**
 * Centerline algorithm configuration
 */
export interface CenterlineConfig extends CoreConfig {
	algorithm: 'centerline';

	// Multipass processing
	passCount: number; // 1-10

	// Adaptive thresholding
	enableAdaptiveThreshold: boolean;
	adaptiveThresholdWindowSize: number; // 15-45 (odd)
	adaptiveThresholdK: number; // 0.1-0.9
	adaptiveThresholdUseOptimized: boolean;

	// Centerline extraction
	enableDistanceTransformCenterline: boolean;
	minBranchLength: number; // 4.0-24.0
	douglasPeuckerEpsilon: number; // 0.5-3.0

	// Width modulation
	enableWidthModulation: boolean;
	widthMultiplier: number; // 0.5-3.0
	widthSmoothing: number; // 0.0-1.0

	// Color processing
	linePreserveColors: boolean;
	lineColorSampling?: ColorSamplingMethod;
	lineColorAccuracy: number; // 0.0-1.0
	maxColorsPerPath: number; // 1-10
	colorTolerance: number; // 0.0-1.0

	// Hand-drawn effects
	handDrawnPreset: HandDrawnPreset;
	handDrawnVariableWeights: number; // 0.0-1.0
	handDrawnTremorStrength: number; // 0.0-0.5
	handDrawnTapering: number; // 0.0-1.0
}

/**
 * Superpixel algorithm configuration
 */
export interface SuperpixelConfig extends CoreConfig {
	algorithm: 'superpixel';

	// SLIC algorithm
	numSuperpixels: number; // 20-1000
	regionCount: number; // Alias for numSuperpixels (UI compatibility)
	superpixelCompactness: number; // 1.0-50.0
	compactness: number; // Alias for superpixelCompactness (UI compatibility)
	superpixelSlicIterations: number; // 5-15
	iterations: number; // Alias for superpixelSlicIterations (UI compatibility)
	superpixelInitializationPattern: SuperpixelInitPattern;

	// Rendering options
	superpixelFillRegions: boolean;
	superpixelStrokeRegions: boolean;
	superpixelSimplifyBoundaries: boolean;
	superpixelBoundaryEpsilon: number; // 0.5-3.0
	superpixelPreserveColors: boolean;

	// Color processing (generic color settings for superpixel)
	superpixelColorAccuracy?: number; // 0.0-1.0
	superpixelMaxColorsPerRegion?: number; // 1-10
	superpixelColorTolerance?: number; // 0.0-1.0
	superpixelColorSampling?: ColorSamplingMethod;

	// Region processing and merge budget system
	superpixelMinRegionSize: number; // 1-100
	superpixelEnforceConnectivity: boolean;
	superpixelEnhanceEdges: boolean;
	superpixelMergeThreshold: number; // 0.05-0.3
	enableAdvancedMerging: boolean;

	// Palette reduction
	enablePaletteReduction: boolean;
	paletteTargetColors: number; // 2-50
	paletteMethod: PaletteMethod;
	paletteDithering: boolean;
}

/**
 * Dots algorithm configuration
 */
export interface DotsConfig extends CoreConfig {
	algorithm: 'dots';

	// Dot placement
	dotDensityThreshold: number; // 0.0-1.0
	dotDensity: number; // 1-10 UI scale (alias for UI compatibility)
	dotSpacing: number; // 2.0-20.0
	dotGridPattern: DotGridPattern;

	// Dot sizing
	dotMinRadius: number; // 0.1-5.0
	minRadius: number; // Alias for dotMinRadius (UI compatibility)
	dotMaxRadius: number; // 0.5-20.0
	maxRadius: number; // Alias for dotMaxRadius (UI compatibility)
	dotSizingMode: DotSizingMode; // Controls sizing algorithm (adaptive/gradient/static)
	dotAdaptiveSizing: boolean;
	adaptiveSizing: boolean; // Alias for dotAdaptiveSizing (UI compatibility)
	dotGradientBasedSizing: boolean;
	dotSizeVariation: number; // 0.0-1.0
	sizeVariation: number; // Alias for dotSizeVariation (UI compatibility)

	// Color processing
	dotPreserveColors: boolean;
	dotColorSampling?: ColorSamplingMethod;
	dotColorAccuracy: number; // 0.0-1.0
	dotMaxColorsPerDot: number; // 1-10
	dotColorTolerance: number; // 0.0-1.0

	// Visual options
	dotBackgroundTolerance: number; // 0.0-1.0
	dotShape: DotShape;

	// Advanced distribution
	dotHighDetailDensity: number; // 0.5-1.0
	dotLowDetailDensity: number; // 0.0-0.5
	dotTransitionSmoothness: number; // 0.0-1.0
}

/**
 * Union type for all algorithm configurations
 */
export type AlgorithmConfig = EdgeConfig | CenterlineConfig | SuperpixelConfig | DotsConfig;

/**
 * Type with index signature for dynamic property access in UI components
 */
export type AlgorithmConfigWithIndex = AlgorithmConfig & {
	[key: string]: any;
};

/**
 * Type guard functions
 */
export function isEdgeConfig(config: AlgorithmConfig): config is EdgeConfig {
	return config.algorithm === 'edge';
}

export function isCenterlineConfig(config: AlgorithmConfig): config is CenterlineConfig {
	return config.algorithm === 'centerline';
}

export function isSuperpixelConfig(config: AlgorithmConfig): config is SuperpixelConfig {
	return config.algorithm === 'superpixel';
}

export function isDotsConfig(config: AlgorithmConfig): config is DotsConfig {
	return config.algorithm === 'dots';
}

/**
 * Parameter metadata for UI generation
 */
export interface ParameterMetadata {
	name: string;
	label: string;
	description: string;
	type: 'number' | 'boolean' | 'select' | 'range';
	min?: number;
	max?: number;
	step?: number;
	unit?: string; // Display unit (e.g., '%', 'px', 'ms')
	options?: Array<{ value: string; label: string }>;
	category: 'core' | 'algorithm' | 'style' | 'color' | 'advanced';
	dependsOn?: string; // Parameter that must be enabled
	algorithms: AlgorithmType[]; // Which algorithms use this parameter
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	info: string[];
}

/**
 * Parameter metadata for Edge algorithm UI generation
 */
export const EDGE_METADATA: Record<string, ParameterMetadata> = {
	// Core Settings Parameters
	passCount: {
		name: 'passCount',
		label: 'Pass Count',
		description:
			'Number of processing passes. 1 = single pass, >1 = multipass with additional options.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'core',
		algorithms: ['edge']
	},
	noiseFiltering: {
		name: 'noiseFiltering',
		label: 'Noise Filtering',
		description: 'Apply edge-preserving bilateral filtering to reduce noise.',
		type: 'boolean',
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots']
	},
	noiseFilterSpatialSigma: {
		name: 'noiseFilterSpatialSigma',
		label: 'Spatial Sigma',
		description: 'Spatial smoothing for noise filter.',
		type: 'range',
		min: 0.5,
		max: 5.0,
		step: 0.1,
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'noiseFiltering'
	},
	noiseFilterRangeSigma: {
		name: 'noiseFilterRangeSigma',
		label: 'Range Sigma',
		description:
			'Controls how much difference in pixel values is allowed. Higher values preserve edges better.',
		type: 'range',
		min: 10.0,
		max: 200.0,
		step: 10.0,
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'noiseFiltering'
	},

	// Edge Detection Parameters
	enableReversePass: {
		name: 'enableReversePass',
		label: 'Reverse Pass',
		description:
			'Enable right-to-left, bottom-to-top processing pass. Only available when Pass Count > 1.',
		type: 'boolean',
		category: 'algorithm',
		algorithms: ['edge']
	},
	enableDiagonalPass: {
		name: 'enableDiagonalPass',
		label: 'Diagonal Pass',
		description:
			'Enable diagonal (NW→SE, NE→SW) processing passes. Only available when Pass Count > 1.',
		type: 'boolean',
		category: 'algorithm',
		algorithms: ['edge']
	},
	directionalStrengthThreshold: {
		name: 'directionalStrengthThreshold',
		label: 'Directional Sensitivity',
		description:
			'Sensitivity threshold for reverse and diagonal pass detection. Lower values detect more edges.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'algorithm',
		algorithms: ['edge']
	},

	// Advanced Processing Parameters
	enableEtfFdog: {
		name: 'enableEtfFdog',
		label: 'Enable ETF/FDoG',
		description: 'Enable Edge Tangent Flow and Flow-based Difference of Gaussians.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['edge']
	},
	etfRadius: {
		name: 'etfRadius',
		label: 'ETF Radius',
		description: 'ETF kernel radius for flow field computation.',
		type: 'range',
		min: 2,
		max: 8,
		step: 1,
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	etfIterations: {
		name: 'etfIterations',
		label: 'ETF Iterations',
		description: 'ETF refinement iterations.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	etfCoherencyTau: {
		name: 'etfCoherencyTau',
		label: 'ETF Coherency Tau',
		description: 'ETF coherency threshold for flow field refinement.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	fdogSigmaC: {
		name: 'fdogSigmaC',
		label: 'FDoG Sigma C',
		description: 'FDoG color difference threshold for edge coherence.',
		type: 'range',
		min: 0.5,
		max: 10.0,
		step: 0.1,
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	fdogSigmaS: {
		name: 'fdogSigmaS',
		label: 'FDoG Sigma S',
		description: 'FDoG structure Gaussian sigma.',
		type: 'range',
		min: 0.3,
		max: 2.0,
		step: 0.1,
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	fdogTau: {
		name: 'fdogTau',
		label: 'FDoG Threshold',
		description: 'FDoG edge detection threshold.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	enableFlowTracing: {
		name: 'enableFlowTracing',
		label: 'Flow Tracing',
		description: 'Enable flow-guided polyline tracing.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableEtfFdog'
	},
	enableBezierFitting: {
		name: 'enableBezierFitting',
		label: 'Bézier Fitting',
		description: 'Enable Bézier curve fitting to polylines.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['edge'],
		dependsOn: 'enableFlowTracing'
	},

	// Artistic Effects Parameters
	handDrawnPreset: {
		name: 'handDrawnPreset',
		label: 'Hand-Drawn Style',
		description: 'Preset effect strength for hand-drawn appearance.',
		type: 'select',
		options: [
			{ value: 'none', label: 'None' },
			{ value: 'subtle', label: 'Subtle' },
			{ value: 'medium', label: 'Medium' },
			{ value: 'strong', label: 'Strong' },
			{ value: 'sketchy', label: 'Sketchy' },
			{ value: 'custom', label: 'Custom' }
		],
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	handDrawnVariableWeights: {
		name: 'handDrawnVariableWeights',
		label: 'Variable Weights',
		description: 'Stroke weight variation for hand-drawn effect.',
		type: 'range',
		min: 0.1,
		max: 1.0,
		step: 0.01,
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	handDrawnTremorStrength: {
		name: 'handDrawnTremorStrength',
		label: 'Tremor Strength',
		description: 'Hand tremor simulation strength. Controls organic line jitter.',
		type: 'range',
		min: 0.1,
		max: 0.5,
		step: 0.01,
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	handDrawnTapering: {
		name: 'handDrawnTapering',
		label: 'Line Tapering',
		description: 'Line end tapering amount.',
		type: 'range',
		min: 0.1,
		max: 1.0,
		step: 0.01,
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	enableBackgroundRemoval: {
		name: 'enableBackgroundRemoval',
		label: 'Background Removal',
		description: 'Enable automatic background removal preprocessing.',
		type: 'boolean',
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots']
	},
	backgroundRemovalStrength: {
		name: 'backgroundRemovalStrength',
		label: 'Removal Strength',
		description: 'How aggressively to remove the background.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'enableBackgroundRemoval'
	},
	backgroundRemovalAlgorithm: {
		name: 'backgroundRemovalAlgorithm',
		label: 'Removal Algorithm',
		description: 'Algorithm to use for background removal.',
		type: 'select',
		options: [
			{ value: 'otsu', label: 'OTSU Thresholding' },
			{ value: 'adaptive', label: 'Adaptive Filtering' }
		],
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'enableBackgroundRemoval'
	},

	// Color Control Parameters
	linePreserveColors: {
		name: 'linePreserveColors',
		label: 'Full Color Mode',
		description:
			'Enable full color mode to preserve original image colors. When disabled, outputs monochrome.',
		type: 'boolean',
		category: 'color',
		algorithms: ['edge', 'centerline']
	},
	lineColorAccuracy: {
		name: 'lineColorAccuracy',
		label: 'Color Accuracy',
		description: 'How accurately to match original colors (0 = loose, 1 = exact).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	},
	maxColorsPerPath: {
		name: 'maxColorsPerPath',
		label: 'Colors Per Path',
		description: 'Maximum number of colors to use per path.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	},
	colorTolerance: {
		name: 'colorTolerance',
		label: 'Color Tolerance',
		description: 'Tolerance for color matching (higher = more colors merged).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	},
	lineColorSampling: {
		name: 'lineColorSampling',
		label: 'Color Sampling Method',
		description: 'How to sample colors from the source image.',
		type: 'select',
		options: [
			{ value: 'DominantColor', label: 'Dominant Color' },
			{ value: 'GradientMapping', label: 'Gradient Mapping' },
			{ value: 'ContentAware', label: 'Content Aware' },
			{ value: 'Adaptive', label: 'Adaptive' }
		],
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	}
};

/**
 * Parameter metadata for Superpixel algorithm
 */
export const SUPERPIXEL_METADATA: Record<string, ParameterMetadata> = {
	regionCount: {
		name: 'regionCount',
		label: 'Region Count',
		description: 'Number of superpixel regions to create. More regions provide finer detail.',
		type: 'range',
		min: 50,
		max: 500,
		step: 25,
		category: 'core',
		algorithms: ['superpixel']
	},
	compactness: {
		name: 'compactness',
		label: 'Compactness',
		description:
			'Controls the shape regularity of superpixels. Higher values create more square regions.',
		type: 'range',
		min: 0.1,
		max: 50.0,
		step: 0.1,
		category: 'core',
		algorithms: ['superpixel']
	},
	superpixelCompactness: {
		name: 'superpixelCompactness',
		label: 'Region Complexity',
		description:
			'Controls the shape regularity of superpixel regions. Higher values create more circular regions.',
		type: 'range',
		min: 1.0,
		max: 50.0,
		step: 1.0,
		category: 'core',
		algorithms: ['superpixel']
	},
	strokeWidth: {
		name: 'strokeWidth',
		label: 'Stroke Width',
		description: 'Width of region boundary lines in pixels.',
		type: 'range',
		min: 0.5,
		max: 10.0,
		step: 0.1,
		category: 'core',
		algorithms: ['superpixel']
	},
	iterations: {
		name: 'iterations',
		label: 'Iterations',
		description: 'Number of SLIC algorithm iterations. More iterations improve boundary accuracy (1=fast, 5=default, 10=high quality).',
		type: 'range',
		min: 1,
		max: 15,
		step: 1,
		category: 'algorithm',
		algorithms: ['superpixel']
	},
	colorImportance: {
		name: 'colorImportance',
		label: 'Color Importance',
		description: 'Weight given to color similarity when creating regions.',
		type: 'range',
		min: 0.1,
		max: 2.0,
		step: 0.1,
		category: 'algorithm',
		algorithms: ['superpixel']
	},
	spatialImportance: {
		name: 'spatialImportance',
		label: 'Spatial Importance',
		description: 'Weight given to spatial proximity when creating regions.',
		type: 'range',
		min: 0.1,
		max: 2.0,
		step: 0.1,
		category: 'algorithm',
		algorithms: ['superpixel']
	},
	polygonMode: {
		name: 'polygonMode',
		label: 'Polygon Mode',
		description: 'Whether to fill regions with color or just show outlines.',
		type: 'boolean',
		category: 'style',
		algorithms: ['superpixel']
	},
	simplifyTolerance: {
		name: 'simplifyTolerance',
		label: 'Simplify Tolerance',
		description: 'Tolerance for boundary simplification. Higher values create smoother boundaries.',
		type: 'range',
		min: 0.1,
		max: 5.0,
		step: 0.1,
		category: 'style',
		algorithms: ['superpixel']
	},
	minRegionSize: {
		name: 'minRegionSize',
		label: 'Min Region Size',
		description: 'Minimum allowed region size in pixels. Smaller regions will be merged.',
		type: 'range',
		min: 1,
		max: 100,
		step: 1,
		category: 'advanced',
		algorithms: ['superpixel']
	},
	mergeThreshold: {
		name: 'mergeThreshold',
		label: 'Merge Threshold',
		description: 'Threshold for merging similar regions.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'advanced',
		algorithms: ['superpixel']
	},
	enhanceEdges: {
		name: 'enhanceEdges',
		label: 'Enhance Edges',
		description: 'Apply edge enhancement to improve region boundaries.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['superpixel']
	},
	preserveBoundaries: {
		name: 'preserveBoundaries',
		label: 'Preserve Boundaries',
		description: 'Preserve important image boundaries during segmentation.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['superpixel']
	},
	superpixelPreserveColors: {
		name: 'superpixelPreserveColors',
		label: 'Full Color Mode',
		description: 'Preserve original image colors in regions.',
		type: 'boolean',
		category: 'color',
		algorithms: ['superpixel']
	},
	noiseFiltering: {
		name: 'noiseFiltering',
		label: 'Noise Filtering',
		description: 'Apply edge-preserving bilateral filtering to reduce noise.',
		type: 'boolean',
		category: 'core',
		algorithms: ['superpixel']
	},
	noiseFilterSpatialSigma: {
		name: 'noiseFilterSpatialSigma',
		label: 'Spatial Sigma',
		description: 'Spatial smoothing for noise filter.',
		type: 'range',
		min: 0.5,
		max: 5.0,
		step: 0.1,
		category: 'core',
		algorithms: ['superpixel'],
		dependsOn: 'noiseFiltering'
	},
	noiseFilterRangeSigma: {
		name: 'noiseFilterRangeSigma',
		label: 'Range Sigma',
		description:
			'Controls how much difference in pixel values is allowed. Higher values preserve edges better.',
		type: 'range',
		min: 10.0,
		max: 200.0,
		step: 10.0,
		category: 'core',
		algorithms: ['superpixel'],
		dependsOn: 'noiseFiltering'
	},
	enableBackgroundRemoval: {
		name: 'enableBackgroundRemoval',
		label: 'Background Removal',
		description: 'Enable automatic background removal preprocessing.',
		type: 'boolean',
		category: 'color',
		algorithms: ['superpixel']
	},
	backgroundRemovalStrength: {
		name: 'backgroundRemovalStrength',
		label: 'Removal Strength',
		description: 'How aggressively to remove the background.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'enableBackgroundRemoval'
	},
	backgroundRemovalAlgorithm: {
		name: 'backgroundRemovalAlgorithm',
		label: 'Removal Algorithm',
		description: 'Algorithm to use for background removal.',
		type: 'select',
		options: [
			{ value: 'otsu', label: 'OTSU Thresholding' },
			{ value: 'adaptive', label: 'Adaptive Filtering' }
		],
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'enableBackgroundRemoval'
	},
	enablePaletteReduction: {
		name: 'enablePaletteReduction',
		label: 'Palette Reduction',
		description: 'Reduce the number of colors in the output to create a more stylized look.',
		type: 'boolean',
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'superpixelPreserveColors'
	},
	paletteTargetColors: {
		name: 'paletteTargetColors',
		label: 'Target Colors',
		description: 'Maximum number of colors to keep in the palette.',
		type: 'range',
		min: 2,
		max: 50,
		step: 1,
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'enablePaletteReduction'
	},
	paletteMethod: {
		name: 'paletteMethod',
		label: 'Reduction Method',
		description: 'Algorithm used to reduce the color palette.',
		type: 'select',
		options: [
			{ value: 'Kmeans', label: 'K-Means Clustering' },
			{ value: 'MedianCut', label: 'Median Cut' },
			{ value: 'Octree', label: 'Octree Quantization' }
		],
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'enablePaletteReduction'
	},
	paletteDithering: {
		name: 'paletteDithering',
		label: 'Enable Dithering',
		description: 'Apply dithering to improve color transitions when using a reduced palette.',
		type: 'boolean',
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'enablePaletteReduction'
	},
	superpixelColorAccuracy: {
		name: 'superpixelColorAccuracy',
		label: 'Color Accuracy',
		description: 'How accurately to match original colors in regions (0 = loose, 1 = exact).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'superpixelPreserveColors'
	},
	superpixelMaxColorsPerRegion: {
		name: 'superpixelMaxColorsPerRegion',
		label: 'Colors Per Region',
		description: 'Maximum number of colors allowed per superpixel region.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'superpixelPreserveColors'
	},
	superpixelColorTolerance: {
		name: 'superpixelColorTolerance',
		label: 'Color Tolerance',
		description: 'Tolerance for color matching. Higher values group more similar colors together.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'superpixelPreserveColors'
	},
	superpixelColorSampling: {
		name: 'superpixelColorSampling',
		label: 'Color Sampling',
		description: 'Method used to sample colors from the original image.',
		type: 'select',
		options: [
			{ value: 'Adaptive', label: 'Adaptive' },
			{ value: 'DominantColor', label: 'Dominant Color' },
			{ value: 'GradientMapping', label: 'Gradient Mapping' },
			{ value: 'ContentAware', label: 'Content Aware' }
		],
		category: 'color',
		algorithms: ['superpixel'],
		dependsOn: 'superpixelPreserveColors'
	},
	superpixelFillRegions: {
		name: 'superpixelFillRegions',
		label: 'Fill Regions',
		description: 'Fill superpixel regions with solid color (your old Fill Regions setting).',
		type: 'boolean',
		category: 'style',
		algorithms: ['superpixel']
	},
	superpixelSimplifyBoundaries: {
		name: 'superpixelSimplifyBoundaries',
		label: 'Simplify Boundaries',
		description: 'Simplify region boundaries for smoother appearance (your old Simplify Boundaries setting).',
		type: 'boolean',
		category: 'style',
		algorithms: ['superpixel']
	},
	superpixelBoundaryEpsilon: {
		name: 'superpixelBoundaryEpsilon',
		label: 'Simplify Tolerance',
		description: 'How much to simplify boundaries. Higher values create smoother boundaries.',
		type: 'range',
		min: 0.5,
		max: 3.0,
		step: 0.1,
		category: 'style',
		algorithms: ['superpixel'],
		dependsOn: 'superpixelSimplifyBoundaries'
	},
	superpixelInitializationPattern: {
		name: 'superpixelInitializationPattern',
		label: 'Initialization Pattern',
		description: 'Cluster initialization pattern for superpixel algorithm.',
		type: 'select',
		options: [
			{ value: 'Square', label: 'Square' },
			{ value: 'Hexagonal', label: 'Hexagonal' },
			{ value: 'Poisson', label: 'Poisson' }
		],
		category: 'advanced',
		algorithms: ['superpixel']
	},
	superpixelStrokeRegions: {
		name: 'superpixelStrokeRegions',
		label: 'Show Boundaries',
		description: 'Show region boundary lines.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['superpixel']
	},
	superpixelMinRegionSize: {
		name: 'superpixelMinRegionSize',
		label: 'Min Region Size',
		description: 'Minimum size for regions in pixels. Smaller regions are merged for cleaner output.',
		type: 'range',
		min: 1,
		max: 500,
		step: 1,
		category: 'advanced',
		algorithms: ['superpixel'],
		dependsOn: 'enableAdvancedMerging'
	},
	superpixelEnforceConnectivity: {
		name: 'superpixelEnforceConnectivity',
		label: 'Enforce Connectivity',
		description: 'Ensure each region consists of connected pixels (no isolated islands).',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['superpixel'],
		dependsOn: 'enableAdvancedMerging'
	},
	superpixelEnhanceEdges: {
		name: 'superpixelEnhanceEdges',
		label: 'Enhance Edges',
		description: 'Improve region boundaries to better follow image edges.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['superpixel'],
		dependsOn: 'enableAdvancedMerging'
	},
	superpixelMergeThreshold: {
		name: 'superpixelMergeThreshold',
		label: 'Color Merge Threshold',
		description: 'Merge similar colored regions. Higher values merge more aggressively.',
		type: 'range',
		min: 0.01,
		max: 1.0,
		step: 0.01,
		category: 'advanced',
		algorithms: ['superpixel'],
		dependsOn: 'enableAdvancedMerging'
	},
	enableAdvancedMerging: {
		name: 'enableAdvancedMerging',
		label: 'Advanced Merging',
		description: 'Enable advanced region merging algorithms for improved quality.',
		type: 'boolean',
		category: 'advanced',
		algorithms: ['superpixel']
	}
};

/**
 * Parameter metadata for Centerline algorithm UI generation
 */
export const CENTERLINE_METADATA: Record<string, ParameterMetadata> = {
	// Preprocessing Parameters
	noiseFiltering: {
		name: 'noiseFiltering',
		label: 'Noise Filtering',
		description: 'Apply edge-preserving bilateral filtering to reduce noise.',
		type: 'boolean',
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots']
	},
	noiseFilterSpatialSigma: {
		name: 'noiseFilterSpatialSigma',
		label: 'Spatial Sigma',
		description: 'Spatial smoothing for noise filter.',
		type: 'range',
		min: 0.5,
		max: 5.0,
		step: 0.1,
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'noiseFiltering'
	},
	noiseFilterRangeSigma: {
		name: 'noiseFilterRangeSigma',
		label: 'Range Sigma',
		description:
			'Controls how much difference in pixel values is allowed. Higher values preserve edges better.',
		type: 'range',
		min: 10.0,
		max: 200.0,
		step: 10.0,
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'noiseFiltering'
	},
	enableBackgroundRemoval: {
		name: 'enableBackgroundRemoval',
		label: 'Background Removal',
		description: 'Enable automatic background removal preprocessing.',
		type: 'boolean',
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots']
	},
	backgroundRemovalStrength: {
		name: 'backgroundRemovalStrength',
		label: 'Removal Strength',
		description: 'How aggressively to remove the background.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'enableBackgroundRemoval'
	},
	backgroundRemovalAlgorithm: {
		name: 'backgroundRemovalAlgorithm',
		label: 'Removal Algorithm',
		description: 'Algorithm to use for background removal.',
		type: 'select',
		options: [
			{ value: 'otsu', label: 'OTSU Thresholding' },
			{ value: 'adaptive', label: 'Adaptive Filtering' }
		],
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'enableBackgroundRemoval'
	},

	// Core Algorithm Parameters
	enableMultipass: {
		name: 'enableMultipass',
		label: 'Enable Multipass',
		description: 'Enable multiple processing passes for better detail capture.',
		type: 'boolean',
		category: 'core',
		algorithms: ['centerline']
	},
	passCount: {
		name: 'passCount',
		label: 'Pass Count',
		description: 'Number of processing passes. More passes capture more detail.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'core',
		algorithms: ['centerline']
	},
	enableAdaptiveThreshold: {
		name: 'enableAdaptiveThreshold',
		label: 'Adaptive Threshold',
		description: 'Use adaptive thresholding for better edge detection.',
		type: 'boolean',
		category: 'algorithm',
		algorithms: ['centerline']
	},
	minBranchLength: {
		name: 'minBranchLength',
		label: 'Min Branch Length',
		description: 'Minimum length for line branches. Shorter branches are pruned.',
		type: 'range',
		min: 4.0,
		max: 24.0,
		step: 1.0,
		category: 'algorithm',
		algorithms: ['centerline']
	},
	enableWidthModulation: {
		name: 'enableWidthModulation',
		label: 'Width Modulation',
		description: 'Vary line width based on image features.',
		type: 'boolean',
		category: 'style',
		algorithms: ['centerline']
	},
	widthMultiplier: {
		name: 'widthMultiplier',
		label: 'Width Multiplier',
		description: 'Global multiplier for line width.',
		type: 'range',
		min: 0.5,
		max: 3.0,
		step: 0.1,
		category: 'style',
		algorithms: ['centerline']
	},

	// Color Control Parameters (shared with Edge)
	linePreserveColors: {
		name: 'linePreserveColors',
		label: 'Full Color Mode',
		description:
			'Enable full color mode to preserve original image colors. When disabled, outputs monochrome.',
		type: 'boolean',
		category: 'color',
		algorithms: ['edge', 'centerline']
	},
	lineColorAccuracy: {
		name: 'lineColorAccuracy',
		label: 'Color Accuracy',
		description: 'How accurately to match original colors (0 = loose, 1 = exact).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	},
	maxColorsPerPath: {
		name: 'maxColorsPerPath',
		label: 'Colors Per Path',
		description: 'Maximum number of colors to use per path.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	},
	colorTolerance: {
		name: 'colorTolerance',
		label: 'Color Tolerance',
		description: 'Tolerance for color matching (higher = more colors merged).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['edge', 'centerline'],
		dependsOn: 'linePreserveColors'
	},

	// Hand-Drawn Style Parameters
	handDrawnPreset: {
		name: 'handDrawnPreset',
		label: 'Hand-Drawn Style',
		description: 'Preset effect strength for hand-drawn appearance.',
		type: 'select',
		options: [
			{ value: 'none', label: 'None' },
			{ value: 'subtle', label: 'Subtle' },
			{ value: 'medium', label: 'Medium' },
			{ value: 'strong', label: 'Strong' },
			{ value: 'sketchy', label: 'Sketchy' },
			{ value: 'custom', label: 'Custom' }
		],
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	handDrawnVariableWeights: {
		name: 'handDrawnVariableWeights',
		label: 'Variable Weights',
		description: 'Stroke weight variation for hand-drawn effect.',
		type: 'range',
		min: 0.1,
		max: 1.0,
		step: 0.01,
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	handDrawnTremorStrength: {
		name: 'handDrawnTremorStrength',
		label: 'Tremor Strength',
		description: 'Hand tremor simulation strength. Controls organic line jitter.',
		type: 'range',
		min: 0.1,
		max: 0.5,
		step: 0.01,
		category: 'style',
		algorithms: ['edge', 'centerline']
	},
	handDrawnTapering: {
		name: 'handDrawnTapering',
		label: 'Line Tapering',
		description: 'Line end tapering amount.',
		type: 'range',
		min: 0.1,
		max: 1.0,
		step: 0.01,
		category: 'style',
		algorithms: ['edge', 'centerline']
	}
};

/**
 * Parameter metadata for Dots algorithm UI generation
 */
export const DOTS_METADATA: Record<string, ParameterMetadata> = {
	dotDensityThreshold: {
		name: 'dotDensityThreshold',
		label: 'Density Threshold',
		description: 'Threshold for dot placement based on image content.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.01,
		category: 'core',
		algorithms: ['dots']
	},
	dotSpacing: {
		name: 'dotSpacing',
		label: 'Dot Spacing',
		description: 'Base spacing between dots in pixels.',
		type: 'range',
		min: 2.0,
		max: 20.0,
		step: 0.5,
		category: 'core',
		algorithms: ['dots']
	},
	dotMinRadius: {
		name: 'dotMinRadius',
		label: 'Min Radius',
		description: 'Minimum dot radius in pixels.',
		type: 'range',
		min: 0.1,
		max: 5.0,
		step: 0.1,
		category: 'style',
		algorithms: ['dots']
	},
	dotMaxRadius: {
		name: 'dotMaxRadius',
		label: 'Max Radius',
		description: 'Maximum dot radius in pixels.',
		type: 'range',
		min: 0.5,
		max: 20.0,
		step: 0.5,
		category: 'style',
		algorithms: ['dots']
	},
	dotAdaptiveSizing: {
		name: 'dotAdaptiveSizing',
		label: 'Adaptive Sizing',
		description: 'Adjust dot size based on local image features.',
		type: 'boolean',
		category: 'algorithm',
		algorithms: ['dots']
	},
	dotShape: {
		name: 'dotShape',
		label: 'Dot Shape',
		description: 'Shape of individual dots.',
		type: 'select',
		options: [
			{ value: 'circle', label: 'Circle' },
			{ value: 'square', label: 'Square' },
			{ value: 'diamond', label: 'Diamond' },
			{ value: 'triangle', label: 'Triangle' }
		],
		category: 'style',
		algorithms: ['dots']
	},

	// Color Control Parameters
	dotPreserveColors: {
		name: 'dotPreserveColors',
		label: 'Full Color Mode',
		description:
			'Preserves the original image colors in the output. When disabled, produces monochromatic dots.',
		type: 'boolean',
		category: 'color',
		algorithms: ['dots']
	},
	dotColorAccuracy: {
		name: 'dotColorAccuracy',
		label: 'Color Accuracy',
		description: 'How accurately to match original colors (0 = loose, 1 = exact).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['dots'],
		dependsOn: 'dotPreserveColors'
	},
	dotMaxColorsPerDot: {
		name: 'dotMaxColorsPerDot',
		label: 'Colors Per Region',
		description: 'Maximum number of colors to use per dot region.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'color',
		algorithms: ['dots'],
		dependsOn: 'dotPreserveColors'
	},
	dotColorTolerance: {
		name: 'dotColorTolerance',
		label: 'Color Tolerance',
		description: 'Tolerance for color matching (higher = more colors merged).',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['dots'],
		dependsOn: 'dotPreserveColors'
	},
	dotColorSampling: {
		name: 'dotColorSampling',
		label: 'Color Sampling Method',
		description: 'How to sample colors from the source image.',
		type: 'select',
		options: [
			{ value: 'DominantColor', label: 'Dominant Color' },
			{ value: 'GradientMapping', label: 'Gradient Mapping' },
			{ value: 'ContentAware', label: 'Content Aware' },
			{ value: 'Adaptive', label: 'Adaptive' }
		],
		category: 'color',
		algorithms: ['dots'],
		dependsOn: 'dotPreserveColors'
	},
	dotBackgroundTolerance: {
		name: 'dotBackgroundTolerance',
		label: 'Background Tolerance',
		description: 'Tolerance for background color detection.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.05,
		category: 'color',
		algorithms: ['dots'],
		dependsOn: 'dotPreserveColors'
	},

	// UI Aliases for compatibility with existing UI components
	dotDensity: {
		name: 'dotDensity',
		label: 'Dot Density',
		description:
			'Controls the density of dots in the stippling output. Higher values create more dots.',
		type: 'range',
		min: 1,
		max: 10,
		step: 1,
		category: 'core',
		algorithms: ['dots']
	},
	minRadius: {
		name: 'minRadius',
		label: 'Min Radius',
		description: 'Minimum dot radius in pixels.',
		type: 'range',
		min: 0.1,
		max: 5.0,
		step: 0.1,
		category: 'core',
		algorithms: ['dots']
	},
	maxRadius: {
		name: 'maxRadius',
		label: 'Max Radius',
		description: 'Maximum dot radius in pixels.',
		type: 'range',
		min: 0.5,
		max: 20.0,
		step: 0.1,
		category: 'core',
		algorithms: ['dots']
	},
	dotSizingMode: {
		name: 'dotSizingMode',
		label: 'Dot Sizing',
		description:
			'Choose the dot sizing algorithm: Adaptive (balanced), Gradient-Based (enhanced detail), or Static (manual variation).',
		type: 'select',
		category: 'algorithm',
		algorithms: ['dots'],
		options: [
			{ value: 'adaptive', label: 'Adaptive Sizing' },
			{ value: 'gradient', label: 'Gradient-Based Sizing' },
			{ value: 'static', label: 'Static Sizing' }
		]
	},
	adaptiveSizing: {
		name: 'adaptiveSizing',
		label: 'Adaptive Sizing',
		description: 'Adjust dot size based on local image features.',
		type: 'boolean',
		category: 'algorithm',
		algorithms: ['dots']
	},
	dotGradientBasedSizing: {
		name: 'dotGradientBasedSizing',
		label: 'Gradient-Based Sizing',
		description: 'Enhanced dot sizing with aggressive detail preservation for complex textures.',
		type: 'boolean',
		category: 'algorithm',
		algorithms: ['dots']
	},
	sizeVariation: {
		name: 'sizeVariation',
		label: 'Size Variation',
		description: 'Amount of random variation in dot sizes.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'style',
		algorithms: ['dots']
	},
	dotGridPattern: {
		name: 'dotGridPattern',
		label: 'Grid Pattern',
		description: 'Choose the grid pattern for dot placement.',
		type: 'select',
		options: [
			{ value: 'random', label: 'Random (Organic)' },
			{ value: 'poisson', label: 'Poisson (Blue-noise)' },
			{ value: 'grid', label: 'Square Grid' },
			{ value: 'hexagonal', label: 'Hexagonal Grid' }
		],
		category: 'style',
		algorithms: ['dots']
	},

	// Preprocessing parameters
	noiseFiltering: {
		name: 'noiseFiltering',
		label: 'Noise Filtering',
		description: 'Apply edge-preserving bilateral filtering to reduce noise.',
		type: 'boolean',
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots']
	},
	noiseFilterSpatialSigma: {
		name: 'noiseFilterSpatialSigma',
		label: 'Spatial Sigma',
		description: 'Spatial smoothing for noise filter.',
		type: 'range',
		min: 0.5,
		max: 5.0,
		step: 0.1,
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'noiseFiltering'
	},
	noiseFilterRangeSigma: {
		name: 'noiseFilterRangeSigma',
		label: 'Range Sigma',
		description:
			'Controls how much difference in pixel values is allowed. Higher values preserve edges better.',
		type: 'range',
		min: 10.0,
		max: 200.0,
		step: 10.0,
		category: 'core',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'noiseFiltering'
	},
	enableBackgroundRemoval: {
		name: 'enableBackgroundRemoval',
		label: 'Background Removal',
		description: 'Enable automatic background removal preprocessing.',
		type: 'boolean',
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots']
	},
	backgroundRemovalStrength: {
		name: 'backgroundRemovalStrength',
		label: 'Removal Strength',
		description: 'How aggressively to remove the background.',
		type: 'range',
		min: 0.0,
		max: 1.0,
		step: 0.1,
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'enableBackgroundRemoval'
	},
	backgroundRemovalAlgorithm: {
		name: 'backgroundRemovalAlgorithm',
		label: 'Removal Algorithm',
		description: 'Algorithm to use for background removal.',
		type: 'select',
		options: [
			{ value: 'otsu', label: 'OTSU Thresholding' },
			{ value: 'adaptive', label: 'Adaptive Filtering' }
		],
		category: 'color',
		algorithms: ['edge', 'centerline', 'superpixel', 'dots'],
		dependsOn: 'enableBackgroundRemoval'
	}
};
