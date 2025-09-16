/**
 * Algorithm Configuration Types
 *
 * Strongly typed configuration interfaces for each vectorization algorithm.
 * These types provide direct mapping to WASM parameters with no translation needed.
 */

// Algorithm type union
export type AlgorithmType = 'edge' | 'centerline' | 'superpixel' | 'dots';

// Background removal algorithms
export type BackgroundRemovalAlgorithm = 'otsu' | 'adaptive' | 'auto';

// Superpixel initialization patterns
export type SuperpixelInitPattern = 'square' | 'hexagonal' | 'poisson';

// Dot grid patterns
export type DotGridPattern = 'grid' | 'hexagonal' | 'random';

// Dot shapes
export type DotShape = 'circle' | 'square' | 'diamond';

// Color sampling methods
export type ColorSamplingMethod = 'average' | 'dominant' | 'gradient';

// Palette reduction methods
export type PaletteMethod = 'kmeans' | 'median_cut' | 'octree';

// Hand-drawn presets
export type HandDrawnPreset = 'none' | 'subtle' | 'moderate' | 'strong' | 'extreme';

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
    enableMultipass: boolean;
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

    // Non-maximum suppression
    nmsLow: number; // 0.01-0.2
    nmsHigh: number; // 0.05-0.5
    nmsSmoothBeforeNms?: boolean;
    nmsSmoothSigma?: number; // 0.5-2.0

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
    handDrawnTremorStrength: number; // 0.0-1.0
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
    enableMultipass: boolean;
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
    handDrawnTremorStrength: number; // 0.0-1.0
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
    superpixelStrokeWidth: number; // 0.5-5.0
    superpixelSimplifyBoundaries: boolean;
    superpixelBoundaryEpsilon: number; // 0.5-3.0
    superpixelPreserveColors: boolean;

    // Region processing
    superpixelMinRegionSize: number; // 1-100
    superpixelMergeThreshold: number; // 0.0-1.0
    superpixelEnforceConnectivity: boolean;

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
    dotPoissonDiskSampling: boolean;
    dotGridPattern: DotGridPattern;

    // Dot sizing
    dotMinRadius: number; // 0.1-5.0
    minRadius: number; // Alias for dotMinRadius (UI compatibility)
    dotMaxRadius: number; // 0.5-20.0
    maxRadius: number; // Alias for dotMaxRadius (UI compatibility)
    dotAdaptiveSizing: boolean;
    adaptiveSizing: boolean; // Alias for dotAdaptiveSizing (UI compatibility)
    dotGradientBasedSizing: boolean;
    dotSizeVariation: number; // 0.0-1.0
    sizeVariation: number; // Alias for dotSizeVariation (UI compatibility)

    // Visual options
    dotPreserveColors: boolean;
    dotBackgroundTolerance: number; // 0.0-1.0
    dotOpacity: number; // 0.1-1.0
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
        description: 'Controls the shape regularity of superpixels. Higher values create more square regions.',
        type: 'range',
        min: 0.1,
        max: 50.0,
        step: 0.1,
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
        description: 'Number of SLIC algorithm iterations. More iterations improve boundary accuracy.',
        type: 'range',
        min: 1,
        max: 20,
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
    }
};

/**
 * Parameter metadata for Centerline algorithm UI generation
 */
export const CENTERLINE_METADATA: Record<string, ParameterMetadata> = {
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
    dotGridPattern: {
        name: 'dotGridPattern',
        label: 'Grid Pattern',
        description: 'Pattern for dot placement.',
        type: 'select',
        options: [
            { value: 'grid', label: 'Grid' },
            { value: 'hexagonal', label: 'Hexagonal' },
            { value: 'random', label: 'Random' }
        ],
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
            { value: 'diamond', label: 'Diamond' }
        ],
        category: 'style',
        algorithms: ['dots']
    }
};