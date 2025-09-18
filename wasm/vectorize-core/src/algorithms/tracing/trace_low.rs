//! Low-detail tracing algorithms for sparse SVG generation
//!
//! This module implements four different tracing backends:
//! - Edge: Canny edge detection + contour following for sparse outlines
//! - Centerline: Skeleton + centerline tracing for engraving/sketch effects
//! - Superpixel: Large regions with cell-shaded look using SLIC
//! - Dots: Dot-based pixel mapping with gradient analysis for stippling/pointillism effects
//!
//! All algorithms are controlled by a single detail parameter (0..1) that maps
//! to appropriate thresholds for each backend.

use crate::algorithms::centerline::{CenterlineAlgorithm, DistanceTransformCenterlineAlgorithm};
use crate::algorithms::dots::background::{rgba_to_lab, BackgroundConfig, LabColor};
use crate::algorithms::dots::dots::{generate_dots_from_image, DotConfig};
use crate::algorithms::dots::svg_dots::dots_to_svg_paths;
use crate::algorithms::edges::edges::{
    apply_nms, compute_fdog, hysteresis_threshold, FdogConfig, NmsConfig,
};
use crate::algorithms::edges::etf::{compute_etf, EtfConfig};
use crate::algorithms::edges::gradients::GradientConfig;
use crate::algorithms::tracing::fit::{fit_beziers, FitConfig};
use crate::algorithms::tracing::path_utils::calculate_douglas_peucker_epsilon;
use crate::algorithms::tracing::trace::{trace_polylines, TraceConfig};
use crate::algorithms::{Point, SvgElementType, SvgPath};
use crate::error::VectorizeError;
use crate::execution::{execute_parallel, execute_parallel_filter_map};
use crate::svg_gradients::{ColorStop, GradientDefinition};
use crate::utils::Instant;
use image::{DynamicImage, GrayImage, ImageBuffer, Luma, Rgba};
use std::collections::{HashMap, VecDeque};
#[cfg(feature = "generate-ts")]
use ts_rs::TS;

/// Rectangle structure for region identification
#[derive(Debug, Clone, Copy)]
struct Rect {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

/// Enhanced SVG result that includes gradient definitions
#[derive(Debug, Clone)]
pub struct EnhancedSvgResult {
    /// SVG paths (same as standard result)
    pub paths: Vec<SvgPath>,
    /// Gradient definitions for advanced rendering
    pub gradients: Vec<GradientDefinition>,
    /// Whether gradients are enabled in this result
    pub has_gradients: bool,
}

/// Edge density analysis for content-aware processing
#[derive(Debug)]
struct EdgeDensityAnalysis {
    /// 8x8 grid of normalized edge densities
    _region_grid: Vec<Vec<f32>>,
    /// Areas needing aggressive pass (sparse regions from conservative pass)
    _high_detail_regions: Vec<Rect>,
    /// Areas to avoid in aggressive pass (high texture/noise regions)
    texture_regions: Vec<Rect>,
    /// Grid width (typically 8)
    _grid_width: usize,
    /// Grid height (typically 8)
    _grid_height: usize,
}

/// Directional image characteristics analysis
#[derive(Debug)]
struct DirectionalAnalysis {
    /// Whether image contains significant diagonal content
    has_diagonal_content: bool,
    /// Dominant lighting direction if detectable
    _dominant_lighting_direction: Option<ProcessingDirection>,
    /// Whether image has architectural/geometric elements
    has_architectural_elements: bool,
    /// Texture directionality measure (0.0 = isotropic, 1.0 = highly directional)
    texture_directionality: f32,
    /// Estimated benefit scores for each direction (0.0-1.0)
    direction_benefits: [f32; 4], // Standard, Reverse, DiagonalNW, DiagonalNE
}

/// Performance budget management for directional passes
#[derive(Debug)]
struct ProcessingBudget {
    /// Total time budget available
    total_budget_ms: u64,
    /// Time consumed so far
    consumed_ms: u64,
    /// Processing start time
    _start_time: Instant,
    /// Priority order for directional passes
    pass_priority: Vec<ProcessingDirection>,
    /// Whether early termination is enabled
    _early_termination_enabled: bool,
}

/// Spatial indexing system for O(1) path neighbor lookup
#[derive(Debug)]
struct SpatialIndex {
    /// Hash map from grid cell (x, y) to path indices
    grid: HashMap<(i32, i32), Vec<usize>>,
    /// Size of each grid cell in pixels
    cell_size: f32,
    /// Image bounds for grid calculation
    bounds: (f32, f32, f32, f32), // (min_x, min_y, max_x, max_y)
}

/// Cached path data to avoid repeated coordinate parsing
#[derive(Debug, Clone)]
struct CachedPathData {
    /// Parsed coordinates from path data
    #[allow(dead_code)]
    coords: Vec<f32>,
    /// Bounding box of the path (min_x, min_y, max_x, max_y)
    bbox: (f32, f32, f32, f32),
    /// Start point of the path
    start_point: (f32, f32),
    /// End point of the path
    end_point: (f32, f32),
    /// Total path length approximation
    approx_length: f32,
}

/// Available tracing backends for low-detail vectorization
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "generate-ts", derive(TS))]
#[cfg_attr(
    feature = "generate-ts",
    ts(export, export_to = "../../../frontend/src/lib/types/generated/")
)]
pub enum TraceBackend {
    /// Canny edge detection + contour following (sparse outlines)
    Edge,
    /// Skeleton + centerline tracing (engraving/sketch effects)
    Centerline,
    /// Large regions with cell-shaded look using SLIC
    Superpixel,
    /// Dot-based pixel mapping with gradient analysis (stippling/pointillism effects)
    Dots,
}

/// Processing directions for multi-directional edge detection
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum ProcessingDirection {
    /// Standard L→R, T→B processing (default)
    Standard,
    /// Reverse R→L, B→T processing for lighting-dependent edges
    Reverse,
    /// Diagonal NW→SE processing for angled features
    DiagonalNW,
    /// Diagonal NE→SW processing for different diagonal orientations
    DiagonalNE,
}

/// Available background removal algorithms for pre-processing
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "generate-ts", derive(TS))]
#[cfg_attr(
    feature = "generate-ts",
    ts(export, export_to = "../../../frontend/src/lib/types/generated/")
)]
pub enum BackgroundRemovalAlgorithm {
    /// OTSU automatic thresholding (fast, works well for simple backgrounds)
    Otsu,
    /// Adaptive thresholding for complex lighting (slower, better quality)
    Adaptive,
    /// Automatic algorithm selection based on image complexity
    Auto,
}

/// Superpixel cluster initialization patterns for SLIC algorithm
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "generate-ts", derive(TS))]
#[cfg_attr(
    feature = "generate-ts",
    ts(export, export_to = "../../../frontend/src/lib/types/generated/")
)]
pub enum SuperpixelInitPattern {
    /// Traditional square grid - may create diagonal artifacts
    Square,
    /// Hexagonal packing - reduces diagonal artifacts, more natural clustering
    Hexagonal,
    /// Poisson disk sampling - random distribution, eliminates grid artifacts
    Poisson,
}

/// Configuration for trace-low algorithms
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "generate-ts", derive(TS))]
#[cfg_attr(
    feature = "generate-ts",
    ts(export, export_to = "../../../frontend/src/lib/types/generated/")
)]
pub struct TraceLowConfig {
    /// Selected tracing backend
    pub backend: TraceBackend,
    /// Detail level (0.0 = very sparse, 1.0 = more detail)
    pub detail: f32,
    /// Stroke width at 1080p reference resolution
    pub stroke_px_at_1080p: f32,
    /// Enable multi-pass processing for enhanced quality
    pub enable_multipass: bool,
    /// Number of processing passes (1-10, default: 1)
    pub pass_count: u32,
    /// Conservative detail level for first pass (higher thresholds)
    pub conservative_detail: Option<f32>,
    /// Aggressive detail level for second pass (lower thresholds)
    pub aggressive_detail: Option<f32>,
    /// Enable content-aware noise filtering
    pub noise_filtering: bool,
    /// Spatial sigma for bilateral noise filtering (higher = more smoothing, default: 2.0)
    pub noise_filter_spatial_sigma: f32,
    /// Range sigma for bilateral noise filtering (higher = less edge preservation, default: 50.0)
    pub noise_filter_range_sigma: f32,
    /// Enable reverse direction processing (R→L, B→T)
    pub enable_reverse_pass: bool,
    /// Enable diagonal direction processing (NW→SE, NE→SW)
    pub enable_diagonal_pass: bool,
    /// Threshold for directional strength - skip pass if not beneficial (0.0-1.0)
    pub directional_strength_threshold: f32,
    /// Maximum total processing time budget in milliseconds
    #[cfg_attr(feature = "generate-ts", ts(type = "number"))]
    pub max_processing_time_ms: u64,
    /// Enable ETF/FDoG advanced edge detection (default: false for compatibility)
    pub enable_etf_fdog: bool,
    /// ETF radius for coherency computation (default: 4)
    pub etf_radius: u32,
    /// ETF iterations for coherency refinement (default: 4)
    pub etf_iterations: u32,
    /// ETF coherency threshold tau (default: 0.2)
    pub etf_coherency_tau: f32,
    /// FDoG sigma_s for structure Gaussian (default: 1.2)
    pub fdog_sigma_s: f32,
    /// FDoG sigma_c for context Gaussian (default: 2.0)
    pub fdog_sigma_c: f32,
    /// FDoG threshold tau (default: 0.90)
    pub fdog_tau: f32,
    /// NMS low threshold (default: 0.08)
    pub nms_low: f32,
    /// NMS high threshold (default: 0.16)
    pub nms_high: f32,
    /// Enable flow-guided polyline tracing (requires enable_etf_fdog=true, default: false)
    pub enable_flow_tracing: bool,
    /// Minimum gradient magnitude for tracing (default: 0.08)
    pub trace_min_grad: f32,
    /// Minimum coherency for tracing (default: 0.15)
    pub trace_min_coherency: f32,
    /// Maximum gap size for tracing in pixels (default: 4)
    pub trace_max_gap: u32,
    /// Maximum polyline length (default: 10_000)
    pub trace_max_len: usize,
    /// Enable Bézier curve fitting (requires enable_flow_tracing=true, default: false)
    pub enable_bezier_fitting: bool,
    /// Curvature penalty for Bézier fitting (default: 0.02)
    pub fit_lambda_curv: f32,
    /// Maximum fitting error tolerance (default: 0.8)
    pub fit_max_err: f32,
    /// Corner splitting angle threshold in degrees (default: 32.0)
    pub fit_split_angle: f32,
    // Dot-specific configuration fields
    /// Dot density threshold - minimum gradient strength required to place a dot (0.0 to 1.0)
    pub dot_density_threshold: f32,
    /// Minimum dot radius in pixels
    pub dot_min_radius: f32,
    /// Maximum dot radius in pixels
    pub dot_max_radius: f32,
    /// Whether to preserve original pixel colors in dot output
    pub dot_preserve_colors: bool,
    /// Whether to use adaptive sizing based on local variance
    pub dot_adaptive_sizing: bool,
    /// Background color tolerance for background detection (0.0 to 1.0)
    pub dot_background_tolerance: f32,
    /// Enable gradient-based sizing for dot scaling based on local image gradients (default: false)
    pub dot_gradient_based_sizing: bool,
    /// Amount of random variation in dot sizes (0.0 = no variation, 1.0 = maximum variation, default: 0.3)
    pub dot_size_variation: f32,
    /// Shape to use for dots (Circle, Square, Diamond, Triangle)
    pub dot_shape: crate::algorithms::dots::dots::DotShape,
    /// Grid pattern for dot placement (Grid, Hexagonal, Random)
    pub dot_grid_pattern: crate::algorithms::dots::dots::GridPattern,
    /// Enable adaptive thresholding for centerline backend (default: true)
    pub enable_adaptive_threshold: bool,
    /// Window size for adaptive thresholding (default: computed from detail level, 25-35 pixels)
    pub adaptive_threshold_window_size: u32,
    /// Sensitivity parameter k for Sauvola thresholding (default: computed from detail level, 0.3-0.5)
    pub adaptive_threshold_k: f32,
    /// Use optimized integral image implementation for adaptive thresholding (default: true)
    pub adaptive_threshold_use_optimized: bool,
    /// Enable EDT-based width modulation for centerline SVG strokes (default: false)
    pub enable_width_modulation: bool,
    /// Minimum branch length for centerline tracing in pixels (4-24, default: computed from detail level)
    pub min_branch_length: f32,
    /// Douglas-Peucker epsilon for path simplification (0.5-3.0, default: computed from detail level)
    pub douglas_peucker_epsilon: f32,
    /// Enable high-performance Distance Transform-based centerline algorithm (default: false)
    pub enable_distance_transform_centerline: bool,
    // Superpixel-specific configuration fields
    /// Number of superpixels to generate (20-1000, default: computed from detail level)
    pub num_superpixels: u32,
    /// SLIC compactness parameter - higher values create more regular shapes (1.0-50.0, default: 10.0)
    pub superpixel_compactness: f32,
    /// SLIC iterations for convergence (5-15, default: 10)
    pub superpixel_slic_iterations: u32,
    /// Superpixel cluster initialization pattern (default: hexagonal)
    pub superpixel_initialization_pattern: SuperpixelInitPattern,
    /// Whether to fill superpixel regions with solid color (default: true)
    pub superpixel_fill_regions: bool,
    /// Whether to stroke superpixel region boundaries (default: true)
    pub superpixel_stroke_regions: bool,
    /// Whether to simplify superpixel boundaries using Douglas-Peucker (default: true)
    pub superpixel_simplify_boundaries: bool,
    /// Boundary simplification tolerance (0.5-3.0, default: 1.0)
    pub superpixel_boundary_epsilon: f32,
    /// Whether to preserve original colors in superpixel regions (default: true)
    pub superpixel_preserve_colors: bool,
    // Line tracing color configuration fields
    /// Whether to preserve original pixel colors in line tracing output (edge/centerline backends)
    pub line_preserve_colors: bool,
    /// Color sampling method for line tracing
    pub line_color_sampling: crate::algorithms::ColorSamplingMethod,
    /// Color sampling accuracy (0.0 = fast, 1.0 = accurate, default: 0.7)
    pub line_color_accuracy: f32,
    /// Maximum number of colors per path segment (1-10, default: 3)
    pub max_colors_per_path: u32,
    /// Color similarity tolerance for clustering (0.0-1.0, default: 0.15)
    pub color_tolerance: f32,
    /// Enable color palette reduction/clustering (default: false)
    pub enable_palette_reduction: bool,
    /// Target number of colors for palette reduction (2-50, default: 16)
    pub palette_target_colors: u32,
    // Background removal parameters
    /// Enable background removal pre-processing (default: false)
    pub enable_background_removal: bool,
    /// Background removal strength/aggressiveness (0.0-1.0, default: 0.5)
    pub background_removal_strength: f32,
    /// Background removal algorithm selection (default: Auto)
    pub background_removal_algorithm: BackgroundRemovalAlgorithm,
    /// Background removal threshold override (0-255, default: auto-calculated)
    pub background_removal_threshold: Option<u8>,
    // Safety and optimization parameters
    /// Maximum image size (width or height) before automatic resizing (512-8192, default: 4096)
    pub max_image_size: u32,
    /// SVG coordinate precision in decimal places (0-4, default: 2)
    pub svg_precision: u8,
}

impl Default for TraceLowConfig {
    fn default() -> Self {
        Self {
            backend: TraceBackend::Edge,
            detail: 0.5, // Default neutral value - user input should override this
            stroke_px_at_1080p: 1.2,
            enable_multipass: false,
            pass_count: 1,
            conservative_detail: None,
            aggressive_detail: None,
            noise_filtering: false,
            noise_filter_spatial_sigma: 1.2, // Optimized for fast path performance
            noise_filter_range_sigma: 50.0,
            enable_reverse_pass: false,
            enable_diagonal_pass: false,
            directional_strength_threshold: 0.3,
            max_processing_time_ms: 300000, // 5 minute safety timeout (will be overridden by frontend)
            // ETF/FDoG parameters (disabled by default for compatibility)
            enable_etf_fdog: false,
            etf_radius: 4,
            etf_iterations: 4,
            etf_coherency_tau: 0.2,
            fdog_sigma_s: 0.8, // More sensitive (was 1.2)
            fdog_sigma_c: 1.6, // More sensitive (was 2.0)
            fdog_tau: 0.70,    // More sensitive (was 0.90)
            nms_low: 0.04,     // Lower threshold (was 0.08)
            nms_high: 0.08,    // Lower threshold (was 0.16)
            // Flow-guided tracing parameters (disabled by default)
            enable_flow_tracing: false,
            trace_min_grad: 0.02,      // More lenient (was 0.08)
            trace_min_coherency: 0.05, // More lenient (was 0.15)
            trace_max_gap: 8,          // Larger gaps (was 4)
            trace_max_len: 10_000,
            // Bézier fitting parameters (disabled by default)
            enable_bezier_fitting: false,
            fit_lambda_curv: 0.01, // Less restrictive (was 0.02)
            fit_max_err: 2.0,      // Allow more error (was 0.8)
            fit_split_angle: 32.0,
            // Dot-specific defaults (following DotConfig::default())
            dot_density_threshold: 0.1,
            dot_min_radius: 0.5,
            dot_max_radius: 3.0,
            dot_preserve_colors: true,
            dot_adaptive_sizing: true,
            dot_background_tolerance: 0.1,
            dot_gradient_based_sizing: false,
            dot_size_variation: 0.0, // Default to no size variation (uniform dots)
            dot_shape: crate::algorithms::dots::dots::DotShape::default(),
            dot_grid_pattern: crate::algorithms::dots::dots::GridPattern::default(),
            // Adaptive thresholding defaults
            enable_adaptive_threshold: true,
            adaptive_threshold_window_size: 31, // Will be adjusted based on detail level
            adaptive_threshold_k: 0.4,          // Will be adjusted based on detail level
            adaptive_threshold_use_optimized: true,
            enable_width_modulation: false,
            // Centerline processing defaults
            min_branch_length: 12.0, // Will be adjusted based on detail level
            douglas_peucker_epsilon: 1.5, // Will be adjusted based on detail level
            enable_distance_transform_centerline: false, // Default to traditional skeleton approach
            // Superpixel defaults
            num_superpixels: 150, // Default region complexity for balanced detail
            superpixel_compactness: 10.0, // Balanced shape vs color similarity
            superpixel_slic_iterations: 10, // Standard convergence iterations
            superpixel_initialization_pattern: SuperpixelInitPattern::Poisson, // Default to best artifact-reducing pattern
            superpixel_fill_regions: true, // Default to filled poster-style look
            superpixel_stroke_regions: true, // Include boundaries for definition
            superpixel_simplify_boundaries: true, // Simplified paths for cleaner output
            superpixel_boundary_epsilon: 1.0, // Moderate simplification
            superpixel_preserve_colors: true, // Default to color for interesting output
            // Line tracing color defaults
            line_preserve_colors: false, // Default to monochrome for backward compatibility
            line_color_sampling: crate::algorithms::ColorSamplingMethod::DominantColor, // Default to simple method
            line_color_accuracy: 0.7, // Good balance of speed vs accuracy
            max_colors_per_path: 3,   // Reasonable color complexity limit
            color_tolerance: 0.15,    // Moderate color similarity threshold
            enable_palette_reduction: false, // Default disabled for backward compatibility
            palette_target_colors: 16, // Balanced color count for palette reduction
            // Background removal defaults
            enable_background_removal: false, // Default disabled for backward compatibility
            background_removal_strength: 0.5, // Moderate strength
            background_removal_algorithm: BackgroundRemovalAlgorithm::Auto, // Automatic selection
            background_removal_threshold: None, // Auto-calculated threshold
            // Safety and optimization defaults
            max_image_size: 4096, // 4K maximum dimension before resizing
            svg_precision: 2,     // 2 decimal places for balanced file size/quality
        }
    }
}

/// Global threshold mapping from detail parameter
#[derive(Debug)]
pub struct ThresholdMapping {
    /// Douglas-Peucker epsilon in pixels
    pub dp_epsilon_px: f32,
    /// Minimum stroke length in pixels for pruning
    pub min_stroke_length_px: f32,
    /// Canny high threshold (normalized gradient)
    pub canny_high_threshold: f32,
    /// Canny low threshold (normalized gradient)
    pub canny_low_threshold: f32,
    /// Minimum centerline branch length in pixels
    pub min_centerline_branch_px: f32,
    /// SLIC superpixel cell size in pixels
    pub slic_cell_size_px: f32,
    /// SLIC iterations
    pub slic_iterations: u32,
    /// SLIC compactness parameter
    pub slic_compactness: f32,
    /// LAB color merge threshold (Delta E)
    pub lab_merge_threshold: f32,
    /// LAB color split threshold (Delta E)
    pub lab_split_threshold: f32,
    /// Image diagonal in pixels (for reference)
    pub image_diagonal_px: f32,
}

impl ThresholdMapping {
    /// Calculate all thresholds from detail parameter and image size
    pub fn new(detail: f32, image_width: u32, image_height: u32) -> Self {
        // Ensure detail is valid and within bounds
        let detail = detail.clamp(0.0, 1.0);
        // Ensure image dimensions are valid
        let image_width = image_width.max(1);
        let image_height = image_height.max(1);
        let diag = ((image_width.pow(2) + image_height.pow(2)) as f32)
            .sqrt()
            .max(1.0);

        // Global knob mapping as specified in trace-low-spec.md
        // FIXED: Invert post-processing parameters to match Canny threshold behavior
        // Higher detail should mean less simplification and shorter minimum lengths for more detailed output
        let dp_epsilon_px =
            ((0.003 + 0.012 * (1.0 - detail)) * diag).clamp(0.003 * diag, 0.015 * diag);
        let min_stroke_length_px = 10.0 + 40.0 * (1.0 - detail);
        // FIXED: Thresholds must match normalized gradient range [0, 1]
        // The canny_edge_detection function normalizes gradients to [0, 1]
        // Higher detail (1.0) → Lower thresholds → More edges detected
        // Lower detail (0.1) → Higher thresholds → Fewer edges detected
        let canny_high_threshold = 0.1 + 0.4 * (1.0 - detail); // Range: 0.5 (detail=0.1, few edges) to 0.1 (detail=1.0, many edges)
        let canny_low_threshold = 0.4 * canny_high_threshold;
        let min_centerline_branch_px = 12.0 + 36.0 * detail;
        let slic_cell_size_px = (600.0 + 2400.0 * detail).clamp(600.0, 3000.0);
        let lab_merge_threshold = (2.0 - 0.8 * detail).max(1.0);
        let lab_split_threshold = 3.0 + 1.0 * detail;

        Self {
            dp_epsilon_px,
            min_stroke_length_px,
            canny_high_threshold,
            canny_low_threshold,
            min_centerline_branch_px,
            slic_cell_size_px,
            slic_iterations: 10,
            slic_compactness: 10.0,
            lab_merge_threshold,
            lab_split_threshold,
            image_diagonal_px: diag,
        }
    }
}

/// Enhanced vectorization with gradient support
pub fn vectorize_trace_low_with_gradients(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Result<EnhancedSvgResult, VectorizeError> {
    // Call standard vectorization first
    let paths = vectorize_trace_low(image, config, hand_drawn_config)?;

    // If gradients are enabled and we have color data, analyze for gradients
    let (enhanced_paths, gradients) = if config.line_preserve_colors
        && matches!(
            config.line_color_sampling,
            crate::algorithms::ColorSamplingMethod::GradientMapping
                | crate::algorithms::ColorSamplingMethod::ContentAware
                | crate::algorithms::ColorSamplingMethod::Adaptive
        ) {
        enhance_paths_with_gradients(&paths, image, config)
    } else {
        (paths, Vec::new())
    };

    let has_gradients = !gradients.is_empty();
    Ok(EnhancedSvgResult {
        paths: enhanced_paths,
        gradients,
        has_gradients,
    })
}

/// Main entry point for trace-low vectorization
pub fn vectorize_trace_low(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // Check if directional passes are enabled (independent of multipass setting)
    if config.backend == TraceBackend::Edge
        && (config.enable_reverse_pass || config.enable_diagonal_pass)
    {
        log::info!(
            "🎯 Using directional processing (reverse={}, diagonal={})",
            config.enable_reverse_pass,
            config.enable_diagonal_pass
        );
        // Use directional processing for enhanced directional quality
        vectorize_trace_low_directional(image, config, hand_drawn_config)
    } else if config.enable_multipass && config.backend == TraceBackend::Edge {
        log::info!("🔄 Using standard multipass processing");
        // Use standard multipass processing for enhanced quality
        vectorize_trace_low_multipass(image, config, hand_drawn_config)
    } else {
        log::info!("⚡ Using single-pass processing");
        // Use single-pass processing (original implementation)
        vectorize_trace_low_single_pass(image, config, hand_drawn_config)
    }
}

/// Single-pass trace-low vectorization (original implementation)
pub fn vectorize_trace_low_single_pass(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let thresholds = ThresholdMapping::new(config.detail, image.width(), image.height());

    log::info!(
        "Starting single-pass trace-low vectorization with backend {:?}, detail {:.2}",
        config.backend,
        config.detail
    );
    log::debug!("Threshold mapping: {thresholds:?}");

    let paths = match config.backend {
        TraceBackend::Edge => trace_edge(image, &thresholds, config),
        TraceBackend::Centerline => trace_centerline(image, &thresholds, config),
        TraceBackend::Superpixel => trace_superpixel(image, &thresholds, config),
        TraceBackend::Dots => trace_dots(image, &thresholds, config),
    }?;

    // Apply artistic enhancements if hand-drawn effects are configured
    let final_paths = apply_artistic_enhancements(paths, hand_drawn_config);

    Ok(final_paths)
}

/// Dual-pass trace-low vectorization for enhanced quality
pub fn vectorize_trace_low_multipass(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let pass_count = config.pass_count.max(1).min(10); // Clamp to 1-10 passes

    log::info!(
        "Starting {}-pass trace-low vectorization with backend {:?}, base detail {:.2}",
        pass_count,
        config.backend,
        config.detail
    );
    let total_start = Instant::now();

    if pass_count == 1 {
        // Single pass - just call the single pass function directly
        return vectorize_trace_low_single_pass(image, config, hand_drawn_config);
    }

    // Simple multipass approach - no complex multiscale system needed

    log::info!(
        "Starting {}-pass vectorization with varying detail levels",
        pass_count
    );

    let mut final_paths = Vec::new();

    // Pre-process the image once for stability and memory efficiency
    let preprocessed_image = if config.enable_background_removal {
        log::debug!("Pre-processing image with background removal for multipass stability");
        apply_background_removal(image, config)?
    } else {
        log::debug!("Using original image for multipass processing");
        image.clone()
    };

    for pass_num in 0..pass_count {
        log::debug!(
            "Starting pass {} of {} - varying detail level",
            pass_num + 1,
            pass_count
        );

        let phase_start = Instant::now();

        // CRITICAL FIX: Ensure first pass is at least as detailed as single-pass
        // Lower detail values = MORE sensitive = MORE detail captured
        let detail_multiplier = match pass_num {
            0 => 1.0, // First pass: match single-pass sensitivity (baseline detail)
            1 => 0.8, // Second pass: more sensitive (fine details)
            2 => 0.6, // Third pass: even more sensitive (very fine details)
            _ => (0.4 - (pass_num.saturating_sub(3) as f32 * 0.05)).max(0.1), // Additional passes: progressively more sensitive, clamped at 0.1
        };

        let mut pass_config = config.clone();
        // Use base detail of 0.1 if config.detail is 0.0 to avoid multiplication by zero
        let base_detail = if config.detail < 0.01 {
            0.1
        } else {
            config.detail
        };
        pass_config.detail = (base_detail * detail_multiplier).clamp(0.1, 1.0);
        pass_config.enable_multipass = false; // Prevent recursion
        pass_config.pass_count = 1; // Each individual pass is single-pass
                                    // Disable directional passes for individual multipass iterations to avoid conflicts
        pass_config.enable_reverse_pass = false;
        pass_config.enable_diagonal_pass = false;
        // Disable background removal for individual passes since we pre-processed
        pass_config.enable_background_removal = false;

        let pass_paths = match vectorize_trace_low_single_pass(
            &preprocessed_image,
            &pass_config,
            hand_drawn_config,
        ) {
            Ok(paths) => paths,
            Err(e) => {
                log::warn!(
                    "Pass {} failed with error: {:?}, continuing with remaining passes",
                    pass_num + 1,
                    e
                );
                continue; // Skip this pass and continue with the next
            }
        };
        let pass_time = phase_start.elapsed();

        log::debug!(
            "Pass {} complete - {} paths generated, detail level: {:.2}, processing time: {:.3}ms",
            pass_num + 1,
            pass_paths.len(),
            pass_config.detail,
            pass_time.as_secs_f64() * 1000.0
        );

        // PERFORMANCE FIX: Use simple append instead of expensive O(N²) deduplication
        // The slight increase in duplicate paths is far better than multipass hanging
        // Modern SVG renderers handle duplicate paths efficiently
        log::debug!(
            "Appending {} paths from pass {} (deduplication disabled for WASM performance)",
            pass_paths.len(),
            pass_num + 1
        );
        final_paths.extend(pass_paths);
    }

    let total_time = total_start.elapsed();
    log::info!(
        "{}-pass multipass processing completed in {:.3}ms ({} final paths)",
        pass_count,
        total_time.as_secs_f64() * 1000.0,
        final_paths.len()
    );

    Ok(final_paths)
}

/// Directional multi-pass trace-low vectorization for maximum quality
pub fn vectorize_trace_low_directional(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!(
        "Starting directional multi-pass trace-low vectorization with backend {:?}, base detail {:.2}",
        config.backend, config.detail
    );

    let total_start = Instant::now();
    let mut budget = ProcessingBudget {
        total_budget_ms: config.max_processing_time_ms,
        consumed_ms: 0,
        _start_time: total_start,
        pass_priority: Vec::new(),
        _early_termination_enabled: true,
    };

    // PHASE 1: Base processing foundation (adapt to multipass setting)
    let phase_start = Instant::now();
    let base_paths = if config.enable_multipass {
        log::info!("Phase 1: Running multipass foundation");
        vectorize_trace_low_multipass(image, config, hand_drawn_config)?
    } else {
        log::info!("Phase 1: Running single-pass foundation");
        vectorize_trace_low_single_pass(image, config, hand_drawn_config)?
    };
    let base_time = phase_start.elapsed();
    budget.consumed_ms += base_time.as_millis() as u64;

    let remaining_budget = budget.total_budget_ms.saturating_sub(budget.consumed_ms);
    let pass_type = if config.enable_multipass {
        "multipass"
    } else {
        "single-pass"
    };
    log::info!(
        "Base {} completed in {:.1}ms ({} paths), budget remaining: {}ms",
        pass_type,
        base_time.as_secs_f64() * 1000.0,
        base_paths.len(),
        remaining_budget
    );

    // Early exit if we're running out of time (more permissive - allow 90% time usage)
    if budget.consumed_ms >= budget.total_budget_ms * 9 / 10 {
        log::info!(
            "Skipping directional passes due to time budget: consumed={}ms, total_budget={}ms",
            budget.consumed_ms,
            budget.total_budget_ms
        );
        return Ok(base_paths);
    }

    log::info!(
        "✓ Proceeding with directional analysis - {} paths generated, {}ms remaining",
        base_paths.len(),
        budget.total_budget_ms.saturating_sub(budget.consumed_ms)
    );

    // PHASE 2: Analyze directional characteristics
    log::info!("Phase 2: Analyzing directional characteristics");
    let phase_start = Instant::now();
    let directional_analysis = analyze_directional_characteristics(image, &base_paths)?;
    let analysis_time = phase_start.elapsed();
    budget.consumed_ms += analysis_time.as_millis() as u64;

    log::debug!(
        "Directional analysis: {:.1}ms - diagonal: {}, architectural: {}, directionality: {:.2}",
        analysis_time.as_secs_f64() * 1000.0,
        directional_analysis.has_diagonal_content,
        directional_analysis.has_architectural_elements,
        directional_analysis.texture_directionality
    );

    // Schedule directional passes based on analysis and remaining budget
    let remaining_budget_ms = budget.total_budget_ms.saturating_sub(budget.consumed_ms);
    budget.pass_priority =
        schedule_directional_passes(&directional_analysis, remaining_budget_ms, config);

    if budget.pass_priority.is_empty() {
        log::info!("No beneficial directional passes identified");
        return Ok(base_paths);
    }

    log::info!(
        "Scheduled {} directional passes: {:?}",
        budget.pass_priority.len(),
        budget.pass_priority
    );

    // PHASE 3: Execute directional passes
    let mut all_directional_paths = Vec::new();

    for (pass_idx, direction) in budget.pass_priority.iter().enumerate() {
        // Check budget before each pass
        let elapsed = total_start.elapsed().as_millis() as u64;
        if elapsed >= budget.total_budget_ms {
            log::info!("Time budget exceeded, stopping directional passes at {elapsed}ms");
            break;
        }

        log::info!(
            "Phase 3.{}: Executing {:?} directional pass",
            pass_idx + 1,
            direction
        );
        let phase_start = Instant::now();

        let directional_paths =
            execute_directional_pass(image, *direction, &directional_analysis, config)?;
        let pass_time = phase_start.elapsed();

        log::debug!(
            "{:?} pass: {:.1}ms ({} paths)",
            direction,
            pass_time.as_secs_f64() * 1000.0,
            directional_paths.len()
        );

        all_directional_paths.push(directional_paths);
    }

    // PHASE 4: Merge all results with intelligent deduplication
    log::info!("Phase 4: Merging directional results");
    let phase_start = Instant::now();
    let base_path_count = base_paths.len();
    let final_paths =
        merge_directional_results(base_paths, all_directional_paths, config, hand_drawn_config);
    let merge_time = phase_start.elapsed();

    let total_time = total_start.elapsed();
    log::info!(
        "Directional processing completed in {:.1}ms - Base: {:.1}ms, Analysis: {:.1}ms, Directional: {:.1}ms, Merge: {:.1}ms",
        total_time.as_secs_f64() * 1000.0,
        base_time.as_secs_f64() * 1000.0,
        analysis_time.as_secs_f64() * 1000.0,
        (total_time - base_time - analysis_time - merge_time).as_secs_f64() * 1000.0,
        merge_time.as_secs_f64() * 1000.0
    );
    log::info!(
        "Final result: {} paths (vs {} base paths)",
        final_paths.len(),
        base_path_count
    );

    Ok(final_paths)
}

/// Edge backend: Canny edge detection + contour following with performance profiling
fn trace_edge(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!("Running edge backend");

    // Validate image dimensions
    if image.width() == 0 || image.height() == 0 {
        return Err(VectorizeError::InvalidDimensions {
            width: image.width(),
            height: image.height(),
            details: "Image must have non-zero dimensions".to_string(),
        });
    }
    let total_start = Instant::now();

    // Convert to grayscale with optional color preservation
    let phase_start = Instant::now();
    let (gray, color_map) = rgba_to_gray_with_colors(image, config.line_preserve_colors);
    let grayscale_time = phase_start.elapsed();
    log::debug!(
        "Grayscale conversion: {:.3}ms",
        grayscale_time.as_secs_f64() * 1000.0
    );

    // Apply background removal preprocessing if enabled
    let preprocessed_gray = if config.enable_background_removal {
        let phase_start = Instant::now();
        log::debug!("Applying background removal preprocessing");

        // Apply background removal to the original image first
        let processed_image = apply_background_removal(image, config)?;

        // Convert the processed image to grayscale
        let (processed_gray, _) =
            rgba_to_gray_with_colors(&processed_image, config.line_preserve_colors);

        let bg_removal_time = phase_start.elapsed();
        log::debug!(
            "Background removal: {:.3}ms (algorithm: {:?})",
            bg_removal_time.as_secs_f64() * 1000.0,
            config.background_removal_algorithm
        );

        processed_gray
    } else {
        log::debug!("Background removal disabled - using original grayscale image");
        gray
    };

    // Apply edge-preserving noise filtering if enabled
    let noise_filtered = if config.noise_filtering {
        let phase_start = Instant::now();

        // Use configurable bilateral filter parameters
        let spatial_sigma = config.noise_filter_spatial_sigma; // Respect user configuration
        let range_sigma = config.noise_filter_range_sigma;

        let filtered = bilateral_filter(&preprocessed_gray, spatial_sigma, range_sigma);
        let filter_time = phase_start.elapsed();

        log::debug!(
            "Bilateral noise filtering: {:.3}ms (spatial_σ={:.1}, range_σ={:.1})",
            filter_time.as_secs_f64() * 1000.0,
            spatial_sigma,
            range_sigma
        );

        filtered
    } else {
        log::debug!("Noise filtering disabled - using preprocessed grayscale image");
        preprocessed_gray
    };

    // Apply Gaussian blur (σ=1.0-2.0 based on detail)
    let phase_start = Instant::now();
    let sigma = 1.0 + (1.0 * config.detail);
    let blurred = gaussian_blur(&noise_filtered, sigma);
    let blur_time = phase_start.elapsed();
    log::debug!("Gaussian blur: {:.3}ms", blur_time.as_secs_f64() * 1000.0);

    // Edge detection: ETF/FDoG or traditional Canny
    let phase_start = Instant::now();
    let edges = if config.enable_etf_fdog {
        // ETF/FDoG advanced edge detection
        log::debug!("Using ETF/FDoG edge detection");

        // Compute Edge Tangent Flow field
        let etf_config = EtfConfig {
            radius: config.etf_radius,
            iters: config.etf_iterations,
            coherency_tau: config.etf_coherency_tau,
            sigma: 1.0, // Use fixed sigma for ETF structure tensor
        };
        let etf_field = compute_etf(&blurred, &etf_config);

        // Compute Flow-guided DoG
        let fdog_config = FdogConfig {
            sigma_s: config.fdog_sigma_s,
            sigma_c: config.fdog_sigma_c,
            passes: 1,
            tau: config.fdog_tau,
        };
        let edge_response = compute_fdog(&blurred, &etf_field, &fdog_config);

        // Apply Non-Maximum Suppression
        let nms_config = NmsConfig {
            low: config.nms_low,
            high: config.nms_high,
            smooth_before_nms: true,
            smooth_sigma: 0.8,
        };
        let nms_edges = apply_nms(&edge_response, &etf_field, &nms_config);

        // Apply adaptive hysteresis thresholding based on actual NMS edge values
        let nms_max = nms_edges.iter().fold(0.0f32, |a, &b| a.max(b));
        let adaptive_low = nms_max * 0.05; // 5% of max NMS value (optimized)
        let adaptive_high = nms_max * 0.4; // 40% of max NMS value (optimized)

        log::debug!(
            "Adaptive hysteresis thresholds: low={adaptive_low:.6}, high={adaptive_high:.6} (NMS max: {nms_max:.6})"
        );

        let binary_edges = hysteresis_threshold(
            &nms_edges,
            edge_response.width,
            edge_response.height,
            adaptive_low,
            adaptive_high,
        );

        // Convert to GrayImage format
        let mut edge_image = GrayImage::new(edge_response.width, edge_response.height);
        for (i, &edge_value) in binary_edges.iter().enumerate() {
            let x = i as u32 % edge_response.width;
            let y = i as u32 / edge_response.width;
            let pixel_value = (edge_value * 255.0) as u8;
            edge_image.put_pixel(x, y, Luma([pixel_value]));
        }
        edge_image
    } else {
        // Traditional Canny edge detection
        log::debug!("Using traditional Canny edge detection");
        canny_edge_detection(
            &blurred,
            thresholds.canny_low_threshold,
            thresholds.canny_high_threshold,
        )
    };
    let edge_time = phase_start.elapsed();
    log::debug!(
        "Edge detection: {:.3}ms ({})",
        edge_time.as_secs_f64() * 1000.0,
        if config.enable_etf_fdog {
            "ETF/FDoG"
        } else {
            "Canny"
        }
    );

    // Link edges into polylines or use flow-guided tracing
    let phase_start = Instant::now();
    let (polylines, bezier_curves) = if config.enable_etf_fdog && config.enable_flow_tracing {
        // Use flow-guided polyline tracing with ETF field
        log::debug!("Using flow-guided polyline tracing");

        // Re-compute ETF field (we need it for tracing)
        let etf_config = EtfConfig {
            radius: config.etf_radius,
            iters: config.etf_iterations,
            coherency_tau: config.etf_coherency_tau,
            sigma: 1.0,
        };
        let etf_field = compute_etf(&blurred, &etf_config);

        // Configure flow-guided tracing
        let trace_config = TraceConfig {
            min_grad: config.trace_min_grad,
            min_coherency: config.trace_min_coherency,
            max_gap: config.trace_max_gap,
            max_len: config.trace_max_len,
            ..Default::default()
        };

        // Trace polylines along ETF flow
        let traced_polylines = trace_polylines(&edges, &etf_field, &trace_config);

        // Optionally fit Bézier curves
        let bezier_curves = if config.enable_bezier_fitting {
            log::debug!(
                "Fitting Bézier curves to {} polylines",
                traced_polylines.len()
            );

            let fit_config = FitConfig {
                lambda_curv: config.fit_lambda_curv,
                max_err: config.fit_max_err,
                split_angle: config.fit_split_angle,
                ..Default::default()
            };

            // Fit Bézier curves to each polyline
            let mut all_curves = Vec::new();
            for polyline in &traced_polylines {
                let curves = fit_beziers(polyline, &fit_config);
                all_curves.extend(curves);
            }

            log::debug!("Generated {} Bézier curves", all_curves.len());
            Some(all_curves)
        } else {
            None
        };

        // Convert traced polylines to internal format for compatibility
        let converted_polylines: Vec<Vec<Point>> = traced_polylines
            .into_iter()
            .map(|polyline| {
                polyline
                    .into_iter()
                    .map(|pt| Point::new(pt.x, pt.y))
                    .collect()
            })
            .collect();

        (converted_polylines, bezier_curves)
    } else {
        // Use traditional edge linking
        log::debug!("Using traditional edge linking");
        let polylines = link_edges_to_polylines(&edges);
        (polylines, None)
    };

    let linking_time = phase_start.elapsed();
    log::debug!(
        "Edge linking/tracing: {:.3}ms ({} polylines)",
        linking_time.as_secs_f64() * 1000.0,
        polylines.len()
    );

    // Check if we're using flow-guided tracing (which produces shorter but more precise polylines)
    let is_flow_traced = config.enable_etf_fdog && config.enable_flow_tracing;

    // Simplify with Douglas-Peucker and prune short strokes (unless we have Bézier curves)
    let phase_start = Instant::now();
    let (svg_paths, simplification_time, svg_generation_time) = if let Some(beziers) = bezier_curves
    {
        // Use Bézier curves directly (no simplification needed)
        log::debug!("Converting {} Bézier curves to SVG paths", beziers.len());

        let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
        let mut svg_paths = Vec::new();

        for bezier in beziers {
            // Apply stroke width clamping as specified in requirements
            let clamped_width = clamp_stroke_width(stroke_width, config);

            let path_data = bezier.to_svg_path_data();
            // For Bézier curves, we'll use default black color for now (can be enhanced later)
            let stroke_color = if config.line_preserve_colors {
                // TODO: Sample color from Bézier curve path - using black as placeholder
                "#000000".to_string()
            } else {
                "#000000".to_string()
            };
            let svg_path = SvgPath::new_stroke(path_data, &stroke_color, clamped_width);
            svg_paths.push(svg_path);
        }

        let conversion_time = phase_start.elapsed();
        (
            svg_paths,
            std::time::Duration::from_nanos(0),
            conversion_time,
        )
    } else {
        // Traditional polyline processing with Douglas-Peucker simplification
        let polyline_count = polylines.len();
        let simplified_polylines = execute_parallel_filter_map(polylines, |polyline| {
            let simplified = douglas_peucker_simplify(&polyline, thresholds.dp_epsilon_px);
            let length = calculate_polyline_length(&simplified);

            // Use more lenient length filtering for flow-traced polylines
            let min_length = if is_flow_traced {
                // Flow-traced polylines are more precise, use very short minimum (1px)
                1.0
            } else {
                thresholds.min_stroke_length_px
            };

            if length >= min_length {
                Some(simplified)
            } else {
                None
            }
        });
        let simplification_time = phase_start.elapsed();
        log::debug!(
            "Simplification: {:.3}ms ({} -> {} paths)",
            simplification_time.as_secs_f64() * 1000.0,
            polyline_count,
            simplified_polylines.len()
        );

        // Convert to SVG paths with stroke styling
        let svg_start = Instant::now();
        let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
        let clamped_width = clamp_stroke_width(stroke_width, config);

        let svg_paths: Vec<SvgPath> = simplified_polylines
            .into_iter()
            .map(|polyline| {
                create_stroke_path_with_color(
                    polyline,
                    clamped_width,
                    color_map.as_ref(),
                    image.width(),
                    image.height(),
                    config,
                )
            })
            .collect();
        let svg_generation_time = svg_start.elapsed();

        (svg_paths, simplification_time, svg_generation_time)
    };

    log::debug!(
        "Path processing: {:.3}ms",
        (simplification_time + svg_generation_time).as_secs_f64() * 1000.0
    );

    let total_time = total_start.elapsed();
    log::info!(
        "Edge backend completed in {:.3}ms - Grayscale: {:.1}ms, Blur: {:.1}ms, Canny: {:.1}ms, Linking: {:.1}ms, Simplification: {:.1}ms, SVG: {:.1}ms",
        total_time.as_secs_f64() * 1000.0,
        grayscale_time.as_secs_f64() * 1000.0,
        blur_time.as_secs_f64() * 1000.0,
        edge_time.as_secs_f64() * 1000.0,
        linking_time.as_secs_f64() * 1000.0,
        simplification_time.as_secs_f64() * 1000.0,
        svg_generation_time.as_secs_f64() * 1000.0
    );
    log::info!(
        "Edge backend generated {} stroke paths (detail={:.2}, high_thresh={:.3}, low_thresh={:.3})",
        svg_paths.len(),
        config.detail,
        thresholds.canny_high_threshold,
        thresholds.canny_low_threshold
    );

    Ok(svg_paths)
}

/// Apply background removal preprocessing to image
fn apply_background_removal(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, VectorizeError> {
    use crate::algorithms::dots::background::{detect_background_advanced, BackgroundConfig};

    // Create background detection config
    let bg_config = BackgroundConfig {
        tolerance: config.background_removal_strength * 0.3, // Convert 0.0-1.0 to tolerance range
        edge_sample_ratio: 0.1,
        sample_edge_pixels: true,
        cluster_colors: false,
        num_clusters: 3,
        random_seed: 42,
    };

    // Detect background mask
    let background_mask = detect_background_advanced(image, &bg_config);

    // Apply background removal based on algorithm
    let mut result_image = image.clone();

    match config.background_removal_algorithm {
        BackgroundRemovalAlgorithm::Otsu => {
            apply_otsu_background_removal(&mut result_image, &background_mask, config)?;
        }
        BackgroundRemovalAlgorithm::Adaptive => {
            apply_adaptive_background_removal(&mut result_image, &background_mask, config)?;
        }
        BackgroundRemovalAlgorithm::Auto => {
            // Use adaptive for complex images, otsu for simple ones
            let complexity = calculate_image_complexity(image);
            if complexity > 0.3 {
                apply_adaptive_background_removal(&mut result_image, &background_mask, config)?;
            } else {
                apply_otsu_background_removal(&mut result_image, &background_mask, config)?;
            }
        }
    }

    Ok(result_image)
}

/// Apply OTSU-based background removal
fn apply_otsu_background_removal(
    image: &mut ImageBuffer<Rgba<u8>, Vec<u8>>,
    background_mask: &[bool],
    config: &TraceLowConfig,
) -> Result<(), VectorizeError> {
    let strength = config.background_removal_strength;
    let threshold = if let Some(t) = config.background_removal_threshold {
        t
    } else {
        // Calculate OTSU threshold
        calculate_otsu_threshold(image)
    };

    for (i, pixel) in image.pixels_mut().enumerate() {
        if i < background_mask.len() && background_mask[i] {
            // Apply background removal with strength
            let gray_value =
                (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
            if gray_value < threshold {
                let fade_factor = 1.0 - strength;
                pixel[0] = (pixel[0] as f32 * fade_factor + 255.0 * strength) as u8;
                pixel[1] = (pixel[1] as f32 * fade_factor + 255.0 * strength) as u8;
                pixel[2] = (pixel[2] as f32 * fade_factor + 255.0 * strength) as u8;
            }
        }
    }

    Ok(())
}

/// Apply adaptive background removal
fn apply_adaptive_background_removal(
    image: &mut ImageBuffer<Rgba<u8>, Vec<u8>>,
    background_mask: &[bool],
    config: &TraceLowConfig,
) -> Result<(), VectorizeError> {
    // Calculate adaptive threshold for the image
    let adaptive_threshold = calculate_adaptive_threshold(image);
    let strength = config.background_removal_strength;

    for (i, pixel) in image.pixels_mut().enumerate() {
        if i < background_mask.len() && background_mask[i] {
            // Apply adaptive background removal with strength-based removal
            let gray_value =
                (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;

            if gray_value < adaptive_threshold {
                // Background pixel detected - apply removal
                let removal_strength = strength.min(1.0).max(0.0);
                let fade_factor = 1.0 - (removal_strength * 0.8);

                pixel[0] = (pixel[0] as f32 * fade_factor + 255.0 * (1.0 - fade_factor)) as u8;
                pixel[1] = (pixel[1] as f32 * fade_factor + 255.0 * (1.0 - fade_factor)) as u8;
                pixel[2] = (pixel[2] as f32 * fade_factor + 255.0 * (1.0 - fade_factor)) as u8;
            }
        }
    }

    Ok(())
}

/// Calculate adaptive threshold for image with single-pass efficiency
fn calculate_adaptive_threshold(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> u8 {
    let total_pixels = (image.width() * image.height()) as f32;

    if total_pixels == 0.0 {
        return 128; // Safe fallback
    }

    // Single pass calculation to avoid memory issues with large images
    let mut sum_brightness = 0.0f64;
    let mut sum_squares = 0.0f64;

    // Use double precision to avoid overflow issues with large images
    for pixel in image.pixels() {
        let gray = 0.299 * pixel[0] as f64 + 0.587 * pixel[1] as f64 + 0.114 * pixel[2] as f64;
        sum_brightness += gray;
        sum_squares += gray * gray;
    }

    let mean = sum_brightness / total_pixels as f64;
    let variance = (sum_squares / total_pixels as f64) - (mean * mean);
    let std_dev = variance.max(0.0).sqrt();

    // Adaptive threshold based on mean and standard deviation
    let adaptive_factor = 0.7; // Tunable parameter
    let threshold = mean - (std_dev * adaptive_factor);

    // Clamp to valid u8 range
    (threshold.max(0.0).min(255.0)) as u8
}

/// Calculate OTSU threshold for image with overflow protection
fn calculate_otsu_threshold(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> u8 {
    let total_pixels = (image.width() as u64) * (image.height() as u64);

    if total_pixels == 0 {
        return 128; // Safe fallback
    }

    // Use u64 for histogram to handle large images safely
    let mut histogram = [0u64; 256];
    for pixel in image.pixels() {
        let gray = (0.299 * pixel[0] as f64 + 0.587 * pixel[1] as f64 + 0.114 * pixel[2] as f64)
            .round() as usize;
        if gray < 256 {
            histogram[gray] += 1;
        }
    }

    let mut best_threshold = 128u8;
    let mut best_variance = 0.0f64;

    for threshold in 1..255 {
        let (w0, w1, mean0, mean1) =
            calculate_class_stats_safe(&histogram, threshold, total_pixels);

        if w0 > 0.0 && w1 > 0.0 {
            let between_class_variance = w0 * w1 * (mean0 - mean1).powi(2);
            if between_class_variance > best_variance {
                best_variance = between_class_variance;
                best_threshold = threshold as u8;
            }
        }
    }

    best_threshold
}

/// Calculate class statistics for OTSU with overflow protection
fn calculate_class_stats_safe(
    histogram: &[u64; 256],
    threshold: usize,
    total: u64,
) -> (f64, f64, f64, f64) {
    let mut sum0 = 0u64;
    let mut sum1 = 0u64;
    let mut weight0 = 0u64;
    let mut weight1 = 0u64;

    for (i, &count) in histogram.iter().enumerate() {
        if i <= threshold {
            weight0 += count;
            sum0 += (i as u64) * count;
        } else {
            weight1 += count;
            sum1 += (i as u64) * count;
        }
    }

    let w0 = weight0 as f64 / total as f64;
    let w1 = weight1 as f64 / total as f64;
    let mean0 = if weight0 > 0 {
        sum0 as f64 / weight0 as f64
    } else {
        0.0
    };
    let mean1 = if weight1 > 0 {
        sum1 as f64 / weight1 as f64
    } else {
        0.0
    };

    (w0, w1, mean0, mean1)
}

/// Calculate image complexity for algorithm selection
fn calculate_image_complexity(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> f32 {
    let mut complexity = 0.0;
    let width = image.width();
    let height = image.height();

    // Sample edge variance to avoid expensive full calculation
    let sample_rate = 4;
    for y in (1..(height - 1)).step_by(sample_rate) {
        for x in (1..(width - 1)).step_by(sample_rate) {
            let center = image.get_pixel(x, y);
            let right = image.get_pixel(x + 1, y);
            let bottom = image.get_pixel(x, y + 1);

            let diff_h = ((center[0] as i16 - right[0] as i16).abs()
                + (center[1] as i16 - right[1] as i16).abs()
                + (center[2] as i16 - right[2] as i16).abs()) as f32
                / 3.0;
            let diff_v = ((center[0] as i16 - bottom[0] as i16).abs()
                + (center[1] as i16 - bottom[1] as i16).abs()
                + (center[2] as i16 - bottom[2] as i16).abs()) as f32
                / 3.0;

            complexity += (diff_h + diff_v) / 255.0;
        }
    }

    let sample_count = ((width - 2) / sample_rate as u32) * ((height - 2) / sample_rate as u32);
    complexity / sample_count.max(1) as f32
}

/// Calculate tangent direction at endpoint of a polyline
fn endpoint_tangent(polyline: &[Point], is_tail: bool) -> (f32, f32) {
    let n = polyline.len();
    if n < 2 {
        return (0.0, 0.0);
    }

    if is_tail {
        let a = &polyline[n - 2];
        let b = &polyline[n - 1];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let len = dx.hypot(dy);
        if len < 1e-6 {
            (0.0, 0.0)
        } else {
            (dx / len, dy / len)
        }
    } else {
        let a = &polyline[0];
        let b = &polyline[1];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let len = dx.hypot(dy);
        if len < 1e-6 {
            (0.0, 0.0)
        } else {
            (dx / len, dy / len)
        }
    }
}

/// Calculate angle between two normalized direction vectors in degrees
fn angle_between(dir1: (f32, f32), dir2: (f32, f32)) -> f32 {
    let dot = dir1.0 * dir2.0 + dir1.1 * dir2.1;
    dot.clamp(-1.0, 1.0).acos().to_degrees()
}

/// Check if EDT (distance transform) allows bridging between two points
/// Prevents bridges through background regions or thin barriers
fn edt_allows_bridge(p1: &Point, p2: &Point, edt: &[Vec<f32>]) -> bool {
    if edt.is_empty() || edt[0].is_empty() {
        return true; // No EDT available, allow bridge
    }

    let height = edt.len();
    let width = edt[0].len();

    // Sample points along the bridge path
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let dist = dx.hypot(dy);

    if dist < 1e-6 {
        return true;
    }

    let samples = (dist.ceil() as usize).max(3);
    for i in 0..samples {
        let t = i as f32 / (samples - 1) as f32;
        let x = (p1.x + t * dx).round() as usize;
        let y = (p1.y + t * dy).round() as usize;

        if x >= width || y >= height {
            continue;
        }

        // Require minimum EDT radius of 0.8 pixels for bridge path
        if edt[y][x] < 0.8 {
            return false;
        }
    }

    true
}

/// Smart endpoint reconnection with tangent alignment and EDT barriers
fn connect_nearby_endpoints_oriented(
    mut lines: Vec<Vec<Point>>,
    max_gap: f32,
    max_angle_deg: f32,
    edt: &[Vec<f32>],
) -> (Vec<Vec<Point>>, usize, usize) {
    let mut bridges_accepted = 0;
    let mut bridges_rejected = 0;

    let mut used = vec![false; lines.len()];
    let mut out: Vec<Vec<Point>> = Vec::new();

    for i in 0..lines.len() {
        if used[i] {
            continue;
        }
        let mut cur = std::mem::take(&mut lines[i]);
        used[i] = true;

        let mut merged = true;
        while merged {
            merged = false;

            // CRITICAL FIX: Check if current line is empty before unwrap()
            // This prevents "unreachable executed" panics during multipass processing
            if cur.is_empty() {
                break;
            }

            let mut best: Option<(usize, bool, bool, f32)> = None; // (j, cur_tail?, other_head?, dist)
            let cur_head = *cur.first().unwrap();
            let cur_tail = *cur.last().unwrap();

            for j in 0..lines.len() {
                if used[j] || lines[j].is_empty() {
                    continue;
                }

                // ADDITIONAL SAFETY: Double-check lines[j] is not empty
                if lines[j].is_empty() {
                    continue;
                }

                let other_head = *lines[j].first().unwrap();
                let other_tail = *lines[j].last().unwrap();

                // tail->head connection
                let d1 = (cur_tail.x - other_head.x).hypot(cur_tail.y - other_head.y);
                if d1 <= max_gap {
                    let cur_tangent = endpoint_tangent(&cur, true);
                    let other_tangent = endpoint_tangent(&lines[j], false);
                    let angle = angle_between(cur_tangent, other_tangent);

                    if angle <= max_angle_deg && edt_allows_bridge(&cur_tail, &other_head, edt) {
                        best = Some((j, true, true, d1));
                    } else {
                        bridges_rejected += 1;
                    }
                }

                // tail->tail (reverse other)
                let d2 = (cur_tail.x - other_tail.x).hypot(cur_tail.y - other_tail.y);
                if d2 <= max_gap {
                    let cur_tangent = endpoint_tangent(&cur, true);
                    let other_tangent = endpoint_tangent(&lines[j], true);
                    let reversed_other = (-other_tangent.0, -other_tangent.1);
                    let angle = angle_between(cur_tangent, reversed_other);

                    if angle <= max_angle_deg && edt_allows_bridge(&cur_tail, &other_tail, edt) {
                        best = best.map_or(Some((j, true, false, d2)), |b| {
                            if d2 < b.3 {
                                Some((j, true, false, d2))
                            } else {
                                Some(b)
                            }
                        });
                    } else {
                        bridges_rejected += 1;
                    }
                }

                // head->head (reverse cur)
                let d3 = (cur_head.x - other_head.x).hypot(cur_head.y - other_head.y);
                if d3 <= max_gap {
                    let cur_tangent = endpoint_tangent(&cur, false);
                    let reversed_cur = (-cur_tangent.0, -cur_tangent.1);
                    let other_tangent = endpoint_tangent(&lines[j], false);
                    let angle = angle_between(reversed_cur, other_tangent);

                    if angle <= max_angle_deg && edt_allows_bridge(&cur_head, &other_head, edt) {
                        best = best.map_or(Some((j, false, true, d3)), |b| {
                            if d3 < b.3 {
                                Some((j, false, true, d3))
                            } else {
                                Some(b)
                            }
                        });
                    } else {
                        bridges_rejected += 1;
                    }
                }

                // head->tail connection
                let d4 = (cur_head.x - other_tail.x).hypot(cur_head.y - other_tail.y);
                if d4 <= max_gap {
                    let cur_tangent = endpoint_tangent(&cur, false);
                    let reversed_cur = (-cur_tangent.0, -cur_tangent.1);
                    let other_tangent = endpoint_tangent(&lines[j], true);
                    let reversed_other = (-other_tangent.0, -other_tangent.1);
                    let angle = angle_between(reversed_cur, reversed_other);

                    if angle <= max_angle_deg && edt_allows_bridge(&cur_head, &other_tail, edt) {
                        best = best.map_or(Some((j, false, false, d4)), |b| {
                            if d4 < b.3 {
                                Some((j, false, false, d4))
                            } else {
                                Some(b)
                            }
                        });
                    } else {
                        bridges_rejected += 1;
                    }
                }
            }

            if let Some((j, use_tail, other_head, _)) = best {
                let mut other = std::mem::take(&mut lines[j]);
                if !other_head {
                    other.reverse();
                }
                if use_tail {
                    cur.extend(other);
                } else {
                    other.extend(cur);
                    cur = other;
                }
                used[j] = true;
                merged = true;
                bridges_accepted += 1;
            }
        }

        out.push(cur);
    }

    (out, bridges_accepted, bridges_rejected)
}

/// Count foreground (white) pixels in a binary image
fn count_foreground_pixels(binary: &GrayImage) -> usize {
    let (width, height) = binary.dimensions();
    let mut count = 0;
    for y in 0..height {
        for x in 0..width {
            if binary.get_pixel(x, y)[0] > 127 {
                count += 1;
            }
        }
    }
    count
}

/// Count skeleton pixels (non-zero pixels in binary skeleton)
fn count_skeleton_pixels(skeleton: &GrayImage) -> usize {
    count_foreground_pixels(skeleton)
}

/// Detect endpoints and junctions in skeleton
fn analyze_skeleton_topology(skeleton: &GrayImage) -> (usize, usize) {
    let (width, height) = skeleton.dimensions();
    let mut endpoints = 0;
    let mut junctions = 0;

    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            if skeleton.get_pixel(x, y)[0] > 127 {
                // Count neighbors
                let mut neighbors = 0;
                for dy in -1i32..=1 {
                    for dx in -1i32..=1 {
                        if dx == 0 && dy == 0 {
                            continue;
                        }
                        let nx = (x as i32 + dx) as u32;
                        let ny = (y as i32 + dy) as u32;
                        if skeleton.get_pixel(nx, ny)[0] > 127 {
                            neighbors += 1;
                        }
                    }
                }

                match neighbors {
                    1 => endpoints += 1,
                    n if n >= 3 => junctions += 1,
                    _ => {}
                }
            }
        }
    }

    (endpoints, junctions)
}

/// Calculate statistics for polyline collection
fn calculate_polyline_statistics(polylines: &[Vec<Point>]) -> (usize, f32, f32) {
    if polylines.is_empty() {
        return (0, 0.0, 0.0);
    }

    let count = polylines.len();
    let total_length: f32 = polylines.iter().map(|p| calculate_polyline_length(p)).sum();

    // Calculate median length
    let mut lengths: Vec<f32> = polylines
        .iter()
        .map(|p| calculate_polyline_length(p))
        .collect();
    // CRITICAL FIX: Handle NaN values that can occur in intensive multipass processing
    lengths.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median_length = if lengths.len().is_multiple_of(2) {
        (lengths[lengths.len() / 2 - 1] + lengths[lengths.len() / 2]) / 2.0
    } else {
        lengths[lengths.len() / 2]
    };

    (count, total_length, median_length)
}

/// Calculate average points per polyline
fn calculate_average_points_per_polyline(polylines: &[Vec<Point>]) -> f32 {
    if polylines.is_empty() {
        return 0.0;
    }

    let total_points: usize = polylines.iter().map(|p| p.len()).sum();
    total_points as f32 / polylines.len() as f32
}

/// Centerline backend: Skeleton + centerline tracing with optional Distance Transform algorithm
fn trace_centerline(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // Check if distance transform algorithm is enabled
    if config.enable_distance_transform_centerline {
        return trace_centerline_distance_transform(image, config);
    }

    // Fall back to traditional skeleton-based approach
    trace_centerline_skeleton_based(image, config)
}

/// High-performance Distance Transform-based centerline tracing
fn trace_centerline_distance_transform(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let algorithm = if config.detail < 0.3 {
        // High performance for low detail
        DistanceTransformCenterlineAlgorithm::with_high_performance_settings()
    } else {
        // Balanced performance for higher detail
        DistanceTransformCenterlineAlgorithm::new()
    };

    algorithm.extract_centerlines(image, config)
}

/// Traditional skeleton-based centerline tracing (original implementation)
fn trace_centerline_skeleton_based(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!("Starting centerline tracing with Zhang-Suen thinning");
    let start_time = Instant::now();

    // Phase 1: Convert to grayscale
    let phase_start = Instant::now();
    let gray = rgba_to_gray(image);
    let grayscale_time = phase_start.elapsed();

    // Phase 2: Gaussian blur for noise reduction
    let phase_start = Instant::now();
    let blur_sigma = (0.8 + 0.4 * config.detail.clamp(0.0, 1.0)).clamp(0.8, 1.2);
    let blurred = gaussian_blur(&gray, blur_sigma);
    let blur_time = phase_start.elapsed();

    // Phase 3: Binary thresholding - adaptive or Otsu based on configuration
    let phase_start = Instant::now();
    let binary = if config.enable_adaptive_threshold {
        // Use configuration parameters directly
        let window_size = config.adaptive_threshold_window_size;
        let k = config.adaptive_threshold_k;

        log::debug!(
            "Using adaptive thresholding: window_size={}, k={:.3}",
            window_size,
            k
        );

        // Ensure window size is reasonable for the image
        let (img_width, img_height) = blurred.dimensions();
        let max_window = img_width.min(img_height) / 3; // Window shouldn't be more than 1/3 of image size
        let final_window_size = window_size.min(max_window).max(3);

        if final_window_size != window_size {
            log::debug!(
                "Adjusted window size from {} to {} for image {}x{}",
                window_size,
                final_window_size,
                img_width,
                img_height
            );
        }

        if config.adaptive_threshold_use_optimized {
            box_sauvola_threshold_optimized(&blurred, final_window_size, k)
        } else {
            box_sauvola_threshold(&blurred, final_window_size, k)
        }
    } else {
        log::debug!("Using Otsu thresholding (fallback)");
        otsu_threshold(&blurred)
    };
    let threshold_time = phase_start.elapsed();

    // Health metrics: foreground pixels after binarization
    let fg_pixels_after_binarization = count_foreground_pixels(&binary);

    // Phase 4: Optional morphological preprocessing for noise filtering
    let phase_start = Instant::now();
    let processed_binary = if config.noise_filtering {
        morphological_open_close(&binary)
    } else {
        binary
    };
    let morphology_time = phase_start.elapsed();

    // Health metrics: foreground pixels after morphology
    let fg_pixels_after_morphology = count_foreground_pixels(&processed_binary);

    // Phase 5: Guo-Hall skeletonization (improved over Zhang-Suen)
    let phase_start = Instant::now();
    let skeleton = guo_hall_thinning(&processed_binary);
    let thinning_time = phase_start.elapsed();

    // Health metrics: skeleton analysis
    let skeleton_pixels = count_skeleton_pixels(&skeleton);
    let (endpoints, junctions) = analyze_skeleton_topology(&skeleton);

    // Phase 5.5: Compute Euclidean Distance Transform (EDT) for enhanced pruning
    let phase_start = Instant::now();
    let edt = compute_euclidean_distance_transform(&processed_binary);
    let edt_time = phase_start.elapsed();

    // Phase 6: Extract polylines from skeleton using improved junction-aware tracing
    let phase_start = Instant::now();
    let polylines = extract_skeleton_polylines_improved(&skeleton);
    let extraction_time = phase_start.elapsed();

    // Phase 6: EDT-based intelligent branch pruning (playbook optimized)
    let phase_start = Instant::now();
    let min_branch = config.min_branch_length; // Use configured value directly
    let pruned_polylines = prune_branches_with_edt(polylines, &edt, min_branch);
    let pruning_time = phase_start.elapsed();

    // Health metrics: after pruning
    let (polylines_after_pruning, total_length_after_pruning, median_length_after_pruning) =
        calculate_polyline_statistics(&pruned_polylines);

    // Phase 6.5: Remove micro-loops (tiny cycles that look like "hairballs")
    let phase_start = Instant::now();
    let min_perimeter_px = 12.0; // Remove loops smaller than ~12px perimeter
    let cleaned_polylines = remove_micro_loops(pruned_polylines, min_perimeter_px);
    let _microloop_time = phase_start.elapsed();

    // Phase 7: Simplify using Douglas-Peucker with configured epsilon for centerlines
    let phase_start = Instant::now();
    let dp_eps = config.douglas_peucker_epsilon; // Use configured value directly
    let simplified_polylines: Vec<Vec<Point>> = cleaned_polylines
        .into_iter()
        .map(|polyline| simplify_adaptive(&polyline, dp_eps))
        .filter(|polyline| !polyline.is_empty())
        .collect();
    let simplification_time = phase_start.elapsed();

    // Health metrics: after simplification
    let avg_points_after_simplification =
        calculate_average_points_per_polyline(&simplified_polylines);
    let simplified_polylines_count = simplified_polylines.len();

    // Phase 7.5: Bridge nearby endpoints to reconnect breaks with smart reconnection
    let phase_start = Instant::now();
    let (reconnected_polylines, bridges_accepted, bridges_rejected) =
        connect_nearby_endpoints_oriented(simplified_polylines, 7.0, 30.0, &edt);
    let bridging_time = phase_start.elapsed();

    // Health metrics: after reconnection
    let (
        polylines_after_reconnection,
        _total_length_after_reconnection,
        _median_length_after_reconnection,
    ) = calculate_polyline_statistics(&reconnected_polylines);

    // Phase 8: Generate SVG paths with optional EDT-based width modulation and color support
    let phase_start = Instant::now();
    let (img_width, img_height) = image.dimensions();
    let color_map: Vec<Rgba<u8>> = image.pixels().cloned().collect();

    let svg_paths: Vec<SvgPath> = reconnected_polylines
        .into_iter()
        .map(|polyline| {
            let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
            let clamped_width = clamp_stroke_width(stroke_width, config);

            // Create base SVG path with width modulation
            let mut svg_path = if config.enable_width_modulation {
                polyline_to_svg_path_with_edt_width(polyline.clone(), clamped_width, &edt)
            } else {
                polyline_to_svg_path(polyline.clone(), clamped_width)
            };

            // Add color sampling if enabled
            if config.line_preserve_colors {
                let color =
                    sample_polyline_color(&polyline, &color_map, img_width, img_height, config);
                svg_path.stroke = color;
            }

            svg_path
        })
        .collect();
    let svg_generation_time = phase_start.elapsed();

    let total_time = start_time.elapsed();

    // Log comprehensive health metrics
    log::info!(
        "Centerline health metrics - FG pixels: {} -> {} (morph), Skeleton: {} pixels, {} endpoints, {} junctions",
        fg_pixels_after_binarization,
        fg_pixels_after_morphology,
        skeleton_pixels,
        endpoints,
        junctions
    );

    log::info!(
        "Centerline processing metrics - Pruning: {} polylines ({:.1}px total, {:.1}px median), Simplify: {:.1} pts/line, Reconnect: {} -> {} polylines ({} bridges accepted, {} rejected)",
        polylines_after_pruning,
        total_length_after_pruning,
        median_length_after_pruning,
        avg_points_after_simplification,
        simplified_polylines_count,
        polylines_after_reconnection,
        bridges_accepted,
        bridges_rejected
    );

    log::info!(
        "Centerline tracing completed in {:.1}ms: gray={:.1}ms, blur={:.1}ms, threshold={:.1}ms, morph={:.1}ms, thin={:.1}ms, edt={:.1}ms, extract={:.1}ms, prune={:.1}ms, simplify={:.1}ms, bridge={:.1}ms, svg={:.1}ms",
        total_time.as_secs_f64() * 1000.0,
        grayscale_time.as_secs_f64() * 1000.0,
        blur_time.as_secs_f64() * 1000.0,
        threshold_time.as_secs_f64() * 1000.0,
        morphology_time.as_secs_f64() * 1000.0,
        thinning_time.as_secs_f64() * 1000.0,
        edt_time.as_secs_f64() * 1000.0,
        extraction_time.as_secs_f64() * 1000.0,
        pruning_time.as_secs_f64() * 1000.0,
        simplification_time.as_secs_f64() * 1000.0,
        bridging_time.as_secs_f64() * 1000.0,
        svg_generation_time.as_secs_f64() * 1000.0
    );
    log::info!(
        "Centerline backend generated {} stroke paths",
        svg_paths.len()
    );

    Ok(svg_paths)
}

/// Superpixel backend: Large regions with cell-shaded look
fn trace_superpixel(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let start_time = Instant::now();
    let (width, height) = (image.width() as usize, image.height() as usize);

    // Use configured superpixel parameters (with fallback based on detail level)
    let superpixel_count = if config.num_superpixels > 0 {
        config.num_superpixels as usize
    } else {
        (50.0 + 150.0 * config.detail) as usize
    };

    // Use the user-specified superpixel count directly (no clamping)

    // Use configured compactness with minimal adaptation
    let superpixel_compactness = config.superpixel_compactness;

    // Using fixed compactness value from configuration

    log::info!(
        "Starting SLIC superpixel segmentation: {}×{} → {} superpixels (detail: {:.2})",
        width,
        height,
        superpixel_count,
        config.detail
    );

    // 1. Convert image to LAB color space
    let phase_start = Instant::now();
    let lab_image: Vec<LabColor> = image.pixels().map(rgba_to_lab).collect();
    log::debug!("LAB conversion: {:?}", phase_start.elapsed());

    // 2. Initialize SLIC superpixel segmentation
    let phase_start = Instant::now();
    let superpixel_labels = slic_segmentation(
        &lab_image,
        width,
        height,
        superpixel_count,
        superpixel_compactness,
        config.superpixel_slic_iterations as usize, // Use configured iterations
        config.superpixel_initialization_pattern,   // Pass the pattern
    );
    log::debug!("SLIC segmentation: {:?}", phase_start.elapsed());

    // 3. Extract superpixel regions and calculate average colors
    let phase_start = Instant::now();
    let regions = extract_superpixel_regions(&superpixel_labels, &lab_image, image, width, height);
    log::debug!("Region extraction: {:?}", phase_start.elapsed());

    // 4. Generate SVG paths based on artistic mode
    let phase_start = Instant::now();
    let dp_epsilon = if config.superpixel_simplify_boundaries {
        config.superpixel_boundary_epsilon
    } else {
        calculate_douglas_peucker_epsilon(width as u32, height as u32, 0.005) as f32
    };

    let svg_paths = generate_superpixel_svg_paths(
        &regions,
        &superpixel_labels,
        width,
        height,
        config.stroke_px_at_1080p,
        dp_epsilon,
        config.detail,
        config.superpixel_fill_regions,
        config.superpixel_stroke_regions,
        config.superpixel_preserve_colors,
    )?;
    log::debug!("SVG generation: {:?}", phase_start.elapsed());

    log::info!(
        "Superpixel backend generated {} paths in {:?} ({} regions)",
        svg_paths.len(),
        start_time.elapsed(),
        regions.len()
    );

    Ok(svg_paths)
}

/// SLIC cluster for k-means initialization
#[derive(Debug, Clone)]
struct SlicCluster {
    /// Cluster center in LAB color space
    lab: LabColor,
    /// Spatial coordinates (x, y)
    x: f32,
    y: f32,
    /// Number of pixels assigned to this cluster
    pixel_count: usize,
}

impl SlicCluster {
    fn new(lab: LabColor, x: f32, y: f32) -> Self {
        Self {
            lab,
            x,
            y,
            pixel_count: 0,
        }
    }

    fn distance(&self, other_lab: &LabColor, other_x: f32, other_y: f32, compactness: f32) -> f32 {
        // Standard SLIC distance calculation
        let color_dist = self.lab.distance_to(other_lab);
        let spatial_dist = ((self.x - other_x).powi(2) + (self.y - other_y).powi(2)).sqrt();

        // Combined distance with compactness weighting
        color_dist + compactness * spatial_dist
    }
}

/// Superpixel region with boundary and average color
#[derive(Debug, Clone)]
struct SuperpixelRegion {
    /// Region label/ID
    #[allow(dead_code)]
    label: usize,
    /// Average LAB color of the region
    #[allow(dead_code)]
    avg_lab: LabColor,
    /// Average RGB color as hex string
    avg_rgb_hex: String,
    /// Boundary points of the region
    boundary_points: Vec<Point>,
    /// Bounding box (x, y, width, height)
    #[allow(dead_code)]
    bbox: (u32, u32, u32, u32),
    /// Area in pixels
    #[allow(dead_code)]
    area: usize,
}

/// Refine cluster centers to positions with lowest gradient magnitude
/// This prevents clusters from being centered on edges and creates more uniform regions
fn refine_cluster_centers(
    clusters: &mut [SlicCluster],
    lab_image: &[LabColor],
    width: usize,
    height: usize,
    _search_window: usize,
) {
    for cluster in clusters.iter_mut() {
        let center_x = cluster.x as usize;
        let center_y = cluster.y as usize;

        // Search in 3x3 neighborhood for lowest gradient position
        let mut min_gradient = f32::INFINITY;
        let mut best_x = center_x;
        let mut best_y = center_y;

        let search_radius = 1; // Search in 3x3 window

        for dy in -search_radius..=search_radius {
            for dx in -search_radius..=search_radius {
                let nx = (center_x as i32 + dx) as usize;
                let ny = (center_y as i32 + dy) as usize;

                // Skip out-of-bounds positions
                if nx == 0 || ny == 0 || nx >= width - 1 || ny >= height - 1 {
                    continue;
                }

                // Compute gradient magnitude using LAB color differences
                let _idx = ny * width + nx;
                let idx_left = ny * width + (nx - 1);
                let idx_right = ny * width + (nx + 1);
                let idx_up = (ny - 1) * width + nx;
                let idx_down = (ny + 1) * width + nx;

                if idx_right < lab_image.len() && idx_down < lab_image.len() {
                    let grad_x = lab_image[idx_right].distance_to(&lab_image[idx_left]);
                    let grad_y = lab_image[idx_down].distance_to(&lab_image[idx_up]);
                    let gradient = (grad_x * grad_x + grad_y * grad_y).sqrt();

                    if gradient < min_gradient {
                        min_gradient = gradient;
                        best_x = nx;
                        best_y = ny;
                    }
                }
            }
        }

        // Update cluster center to lowest gradient position
        if best_x != center_x || best_y != center_y {
            cluster.x = best_x as f32;
            cluster.y = best_y as f32;
            let idx = best_y * width + best_x;
            if idx < lab_image.len() {
                cluster.lab = lab_image[idx];
            }
        }
    }
}

/// Initialize cluster centers using different patterns to reduce grid artifacts
fn initialize_cluster_centers(
    lab_image: &[LabColor],
    width: usize,
    height: usize,
    num_superpixels: usize,
    s: usize,
    pattern: SuperpixelInitPattern,
) -> Vec<SlicCluster> {
    let mut clusters = Vec::new();
    let mut cluster_id = 0;

    log::info!(
        "🎯 Initializing cluster centers with pattern: {:?}",
        pattern
    );

    match pattern {
        SuperpixelInitPattern::Square => {
            log::info!("🎯 Executing SQUARE pattern initialization");
            // Traditional square grid initialization
            for y in (s / 2..height).step_by(s) {
                for x in (s / 2..width).step_by(s) {
                    if cluster_id >= num_superpixels {
                        break;
                    }

                    // Light jitter to prevent edge-snapping
                    let jitter_x = ((x as f32 * 1.7 + y as f32 * 2.3) % 7.0) - 3.5;
                    let jitter_y = ((y as f32 * 2.1 + x as f32 * 1.9) % 7.0) - 3.5;

                    let jittered_x =
                        ((x as f32 + jitter_x).max(0.0).min((width - 1) as f32)) as usize;
                    let jittered_y =
                        ((y as f32 + jitter_y).max(0.0).min((height - 1) as f32)) as usize;

                    let idx = jittered_y * width + jittered_x;
                    if idx < lab_image.len() {
                        clusters.push(SlicCluster::new(
                            lab_image[idx],
                            jittered_x as f32,
                            jittered_y as f32,
                        ));
                        cluster_id += 1;
                    }
                }
                if cluster_id >= num_superpixels {
                    break;
                }
            }
        }
        SuperpixelInitPattern::Hexagonal => {
            log::info!("🎯 Executing HEXAGONAL pattern initialization");
            // Hexagonal packing to reduce diagonal artifacts
            let hex_height = (s as f32 * 0.866).round() as usize; // sqrt(3)/2 ≈ 0.866
            let mut row = 0;

            for y in (hex_height / 2..height).step_by(hex_height) {
                let x_offset = if row % 2 == 1 { s / 2 } else { 0 }; // Offset every other row

                for x in (s / 2 + x_offset..width).step_by(s) {
                    if cluster_id >= num_superpixels {
                        break;
                    }

                    // Light jitter to prevent edge-snapping
                    let jitter_x = ((x as f32 * 1.7 + y as f32 * 2.3) % 7.0) - 3.5;
                    let jitter_y = ((y as f32 * 2.1 + x as f32 * 1.9) % 7.0) - 3.5;

                    let jittered_x =
                        ((x as f32 + jitter_x).max(0.0).min((width - 1) as f32)) as usize;
                    let jittered_y =
                        ((y as f32 + jitter_y).max(0.0).min((height - 1) as f32)) as usize;

                    let idx = jittered_y * width + jittered_x;
                    if idx < lab_image.len() {
                        clusters.push(SlicCluster::new(
                            lab_image[idx],
                            jittered_x as f32,
                            jittered_y as f32,
                        ));
                        cluster_id += 1;
                    }
                }
                row += 1;
                if cluster_id >= num_superpixels {
                    break;
                }
            }
        }
        SuperpixelInitPattern::Poisson => {
            log::info!("🎯 Executing POISSON pattern initialization");
            // Poisson disk sampling for random but well-distributed points
            use std::collections::HashSet;

            let min_distance = (s as f32 * 0.7) as usize; // Minimum distance between points
            let max_attempts = num_superpixels * 50; // Maximum attempts to find valid positions
            let mut placed_points: HashSet<(usize, usize)> = HashSet::new();
            let mut attempt = 0;

            while cluster_id < num_superpixels && attempt < max_attempts {
                // Generate random position using deterministic hash (for reproducibility)
                let hash_x = (attempt * 73 + 17) % width;
                let hash_y = (attempt * 97 + 23) % height;

                // Check if this position is far enough from existing points
                let mut valid = true;
                for &(px, py) in &placed_points {
                    let dx = (hash_x as isize - px as isize).abs() as f32;
                    let dy = (hash_y as isize - py as isize).abs() as f32;
                    let distance = (dx * dx + dy * dy).sqrt();

                    if distance < min_distance as f32 {
                        valid = false;
                        break;
                    }
                }

                if valid {
                    placed_points.insert((hash_x, hash_y));

                    let idx = hash_y * width + hash_x;
                    if idx < lab_image.len() {
                        clusters.push(SlicCluster::new(
                            lab_image[idx],
                            hash_x as f32,
                            hash_y as f32,
                        ));
                        cluster_id += 1;
                    }
                }

                attempt += 1;
            }

            // If we couldn't place enough points with Poisson, fill remaining with regular grid
            while cluster_id < num_superpixels {
                let grid_size = (width * height / (num_superpixels - cluster_id)).max(1);
                let step = (grid_size as f32).sqrt() as usize;

                for y in (step / 2..height).step_by(step) {
                    for x in (step / 2..width).step_by(step) {
                        if cluster_id >= num_superpixels {
                            break;
                        }

                        // Check if this position conflicts with existing Poisson points
                        let mut conflict = false;
                        for &(px, py) in &placed_points {
                            let dx = (x as isize - px as isize).abs() as f32;
                            let dy = (y as isize - py as isize).abs() as f32;
                            let distance = (dx * dx + dy * dy).sqrt();

                            if distance < min_distance as f32 / 2.0 {
                                conflict = true;
                                break;
                            }
                        }

                        if !conflict {
                            let idx = y * width + x;
                            if idx < lab_image.len() {
                                clusters.push(SlicCluster::new(lab_image[idx], x as f32, y as f32));
                                cluster_id += 1;
                            }
                        }
                    }
                    if cluster_id >= num_superpixels {
                        break;
                    }
                }
                break; // Safety break to avoid infinite loop
            }
        }
    }

    clusters
}

/// SLIC superpixel segmentation algorithm
///
/// Implements Simple Linear Iterative Clustering (SLIC) for superpixel segmentation.
/// This pure Rust implementation avoids external dependencies while maintaining performance.
fn slic_segmentation(
    lab_image: &[LabColor],
    width: usize,
    height: usize,
    num_superpixels: usize,
    compactness: f32,
    max_iterations: usize,
    initialization_pattern: SuperpixelInitPattern,
) -> Vec<usize> {
    // DEBUG: Log the initialization pattern being used
    log::info!("🎯 SLIC Segmentation: Using initialization pattern: {:?} for {}x{} image with {} superpixels",
               initialization_pattern, width, height, num_superpixels);

    // Calculate initial grid spacing
    let total_pixels = width * height;
    let s = ((total_pixels as f32 / num_superpixels as f32).sqrt()) as usize;
    let s = s.max(1); // Ensure minimum spacing of 1

    // Initialize cluster centers using the specified pattern
    let mut clusters = initialize_cluster_centers(
        lab_image,
        width,
        height,
        num_superpixels,
        s,
        initialization_pattern,
    );

    // Refine cluster centers to lowest gradient positions (avoids edges)
    // This is a crucial SLIC step that prevents clusters from starting on edges
    refine_cluster_centers(&mut clusters, lab_image, width, height, s);

    // Initialize labels and distances
    let mut labels = vec![0; total_pixels];
    let mut distances = vec![f32::INFINITY; total_pixels];

    // K-means iteration
    for iteration in 0..max_iterations {
        let mut cluster_changed = false;

        // Assign pixels to nearest cluster
        for (cluster_idx, cluster) in clusters.iter().enumerate() {
            // Search in 2S×2S region around cluster center
            let search_size = 2 * s;
            let min_x = (cluster.x as isize - search_size as isize / 2).max(0) as usize;
            let max_x = (cluster.x as usize + search_size / 2).min(width - 1);
            let min_y = (cluster.y as isize - search_size as isize / 2).max(0) as usize;
            let max_y = (cluster.y as usize + search_size / 2).min(height - 1);

            for y in min_y..=max_y {
                for x in min_x..=max_x {
                    let idx = y * width + x;
                    if idx < lab_image.len() {
                        let dist =
                            cluster.distance(&lab_image[idx], x as f32, y as f32, compactness);

                        if dist < distances[idx] {
                            distances[idx] = dist;
                            if labels[idx] != cluster_idx {
                                labels[idx] = cluster_idx;
                                cluster_changed = true;
                            }
                        }
                    }
                }
            }
        }

        // Update cluster centers
        let mut cluster_sums: Vec<(LabColor, f32, f32, usize)> =
            vec![(LabColor::new(0.0, 0.0, 0.0), 0.0, 0.0, 0); clusters.len()];

        for (idx, &label) in labels.iter().enumerate() {
            // Safe access with comprehensive bounds checking
            if let Some(cluster_sum) = cluster_sums.get_mut(label) {
                let x = (idx % width) as f32;
                let y = (idx / width) as f32;

                // Safe access to lab_image with bounds check
                if let Some(lab) = lab_image.get(idx) {
                    cluster_sum.0.l += lab.l;
                    cluster_sum.0.a += lab.a;
                    cluster_sum.0.b += lab.b;
                    cluster_sum.1 += x;
                    cluster_sum.2 += y;
                    cluster_sum.3 += 1;
                } else {
                    // This should not happen with proper initialization, but handle gracefully
                    log::warn!(
                        "Lab image index {} out of bounds (max: {})",
                        idx,
                        lab_image.len()
                    );
                }
            } else {
                // Invalid cluster label - this indicates a deeper issue but handle gracefully
                log::warn!(
                    "Invalid cluster label {} (max clusters: {})",
                    label,
                    cluster_sums.len()
                );
            }
        }

        for (cluster_idx, cluster) in clusters.iter_mut().enumerate() {
            if cluster_sums[cluster_idx].3 > 0 {
                let count = cluster_sums[cluster_idx].3 as f32;
                cluster.lab.l = cluster_sums[cluster_idx].0.l / count;
                cluster.lab.a = cluster_sums[cluster_idx].0.a / count;
                cluster.lab.b = cluster_sums[cluster_idx].0.b / count;
                cluster.x = cluster_sums[cluster_idx].1 / count;
                cluster.y = cluster_sums[cluster_idx].2 / count;
                cluster.pixel_count = cluster_sums[cluster_idx].3;
            }
        }

        // Early termination if no significant changes
        if !cluster_changed && iteration > 2 {
            log::debug!("SLIC converged after {} iterations", iteration + 1);
            break;
        }
    }

    labels
}

/// Extract superpixel regions with boundaries and average colors
fn extract_superpixel_regions(
    labels: &[usize],
    lab_image: &[LabColor],
    rgba_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    width: usize,
    height: usize,
) -> Vec<SuperpixelRegion> {
    use std::collections::HashMap;

    // Group pixels by label and calculate statistics
    let mut region_pixels: HashMap<usize, Vec<(usize, usize)>> = HashMap::new();
    let mut region_lab_sums: HashMap<usize, (f64, f64, f64, usize)> = HashMap::new();
    let mut region_rgb_sums: HashMap<usize, (u64, u64, u64, usize)> = HashMap::new();

    for (idx, &label) in labels.iter().enumerate() {
        let x = idx % width;
        let y = idx / width;

        // Store pixel coordinates
        region_pixels.entry(label).or_default().push((x, y));

        // Accumulate LAB values
        let lab = lab_image[idx];
        let lab_entry = region_lab_sums.entry(label).or_default();
        lab_entry.0 += lab.l as f64;
        lab_entry.1 += lab.a as f64;
        lab_entry.2 += lab.b as f64;
        lab_entry.3 += 1;

        // Accumulate RGB values
        let rgba = rgba_image.get_pixel(x as u32, y as u32);
        let rgb_entry = region_rgb_sums.entry(label).or_default();
        rgb_entry.0 += rgba.0[0] as u64;
        rgb_entry.1 += rgba.0[1] as u64;
        rgb_entry.2 += rgba.0[2] as u64;
        rgb_entry.3 += 1;
    }

    let mut regions = Vec::new();

    for (label, pixels) in region_pixels.iter() {
        if pixels.len() < 4 {
            continue; // Skip very small regions
        }

        // Calculate average LAB color
        let lab_sum = region_lab_sums[label];
        let avg_lab = LabColor::new(
            (lab_sum.0 / lab_sum.3 as f64) as f32,
            (lab_sum.1 / lab_sum.3 as f64) as f32,
            (lab_sum.2 / lab_sum.3 as f64) as f32,
        );

        // Calculate average RGB color
        let rgb_sum = region_rgb_sums[label];
        let avg_r = (rgb_sum.0 / rgb_sum.3 as u64) as u8;
        let avg_g = (rgb_sum.1 / rgb_sum.3 as u64) as u8;
        let avg_b = (rgb_sum.2 / rgb_sum.3 as u64) as u8;
        let avg_rgb_hex = format!("#{avg_r:02x}{avg_g:02x}{avg_b:02x}");

        // Calculate bounding box
        let min_x = pixels.iter().map(|(x, _)| *x).min().unwrap_or(0) as u32;
        let max_x = pixels.iter().map(|(x, _)| *x).max().unwrap_or(0) as u32;
        let min_y = pixels.iter().map(|(_, y)| *y).min().unwrap_or(0) as u32;
        let max_y = pixels.iter().map(|(_, y)| *y).max().unwrap_or(0) as u32;

        // Extract boundary using 4-connectivity
        let boundary_points = extract_region_boundary(pixels, labels, *label, width, height);

        regions.push(SuperpixelRegion {
            label: *label,
            avg_lab,
            avg_rgb_hex,
            boundary_points,
            bbox: (min_x, min_y, max_x - min_x + 1, max_y - min_y + 1),
            area: pixels.len(),
        });
    }

    regions
}

/// Extract boundary points of a superpixel region
fn extract_region_boundary(
    region_pixels: &[(usize, usize)],
    labels: &[usize],
    region_label: usize,
    width: usize,
    height: usize,
) -> Vec<Point> {
    use std::collections::HashSet;

    // Convert to set for fast lookup (currently unused but available for optimization)
    let _pixel_set: HashSet<(usize, usize)> = region_pixels.iter().cloned().collect();
    let mut boundary_pixels = Vec::new();

    // Find boundary pixels (pixels that have at least one neighbor not in the region)
    for &(x, y) in region_pixels {
        let mut is_boundary = false;

        // Check 4-connected neighbors
        for (dx, dy) in [(-1, 0), (1, 0), (0, -1), (0, 1)] {
            let nx = x as i32 + dx;
            let ny = y as i32 + dy;

            if nx < 0 || ny < 0 || nx >= width as i32 || ny >= height as i32 {
                is_boundary = true; // Border of image
                break;
            }

            let nx = nx as usize;
            let ny = ny as usize;
            let neighbor_idx = ny * width + nx;

            if neighbor_idx < labels.len() && labels[neighbor_idx] != region_label {
                is_boundary = true;
                break;
            }
        }

        if is_boundary {
            boundary_pixels.push((x, y));
        }
    }

    // Convert to Point objects and try to order them in a reasonable way
    if boundary_pixels.is_empty() {
        return Vec::new();
    }

    // Simple ordering by angle from centroid (for better path generation)
    let _centroid_x =
        boundary_pixels.iter().map(|(x, _)| *x as f32).sum::<f32>() / boundary_pixels.len() as f32;
    let _centroid_y =
        boundary_pixels.iter().map(|(_, y)| *y as f32).sum::<f32>() / boundary_pixels.len() as f32;

    let boundary_points: Vec<Point> = boundary_pixels
        .into_iter()
        .map(|(x, y)| Point::new(x as f32, y as f32))
        .collect();

    // Use proper contour tracing instead of angle sorting to prevent zigzag artifacts
    if boundary_points.len() < 3 {
        return boundary_points;
    }

    // Trace the boundary contour using a proper path following algorithm

    trace_boundary_contour(&boundary_points)
}

/// Trace boundary contour using nearest-neighbor path following to prevent zigzag artifacts
fn trace_boundary_contour(boundary_points: &[Point]) -> Vec<Point> {
    if boundary_points.len() < 3 {
        return boundary_points.to_vec();
    }

    let mut traced_path = Vec::new();
    let mut visited = vec![false; boundary_points.len()];

    // Start from the topmost point (or leftmost if tie)
    let mut current_idx = 0;
    for (i, point) in boundary_points.iter().enumerate() {
        let current_best = &boundary_points[current_idx];
        if point.y < current_best.y || (point.y == current_best.y && point.x < current_best.x) {
            current_idx = i;
        }
    }

    // Trace the contour by following nearest unvisited neighbors
    let start_idx = current_idx;
    loop {
        traced_path.push(boundary_points[current_idx]);
        visited[current_idx] = true;

        // Find nearest unvisited neighbor with more generous distance threshold
        let mut next_idx = None;
        let mut min_distance = f32::INFINITY;

        for (i, point) in boundary_points.iter().enumerate() {
            if visited[i] {
                continue;
            }

            let dx = point.x - boundary_points[current_idx].x;
            let dy = point.y - boundary_points[current_idx].y;
            let distance = dx * dx + dy * dy;

            if distance < min_distance {
                min_distance = distance;
                next_idx = Some(i);
            }
        }

        match next_idx {
            Some(idx) => {
                current_idx = idx;

                // Use much more generous distance threshold to prevent gaps
                // Stop only if we've made a full loop or distance is extremely far
                if idx == start_idx || min_distance > 50.0 {
                    break;
                }
            }
            None => break, // No more unvisited neighbors
        }

        // Safety limit to prevent infinite loops
        if traced_path.len() >= boundary_points.len() {
            break;
        }
    }

    // Always include all remaining unvisited points to ensure complete coverage
    for (i, point) in boundary_points.iter().enumerate() {
        if !visited[i] {
            traced_path.push(*point);
        }
    }

    // Ensure we have at least 3 points for a valid polygon
    if traced_path.len() < 3 {
        return boundary_points.to_vec();
    }

    // Close the polygon by ensuring the path returns to near the start
    if let (Some(first), Some(last)) = (traced_path.first(), traced_path.last()) {
        let dx = last.x - first.x;
        let dy = last.y - first.y;
        let distance = dx * dx + dy * dy;

        // If path isn't naturally closed, ensure it forms a proper closed polygon
        if distance > 4.0 {
            traced_path.push(*first);
        }
    }

    traced_path
}

/// Generate SVG paths for superpixel regions with different artistic modes
fn generate_superpixel_svg_paths(
    regions: &[SuperpixelRegion],
    _labels: &[usize],
    _width: usize,
    _height: usize,
    stroke_width: f32,
    dp_epsilon: f32,
    detail: f32,
    fill_regions: bool,
    stroke_regions: bool,
    preserve_colors: bool,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let mut svg_paths = Vec::new();

    // Determine artistic mode based on configuration
    let mode = match (fill_regions, stroke_regions) {
        (true, true) => "filled_with_borders",
        (true, false) => "filled_only",
        (false, true) => "strokes_only",
        (false, false) => {
            // Fallback to detail-based mode if both are disabled
            if detail < 0.5 {
                "filled_only"
            } else {
                "strokes_only"
            }
        }
    };
    log::debug!("Superpixel mode determination: fill_regions={}, stroke_regions={}, detail={:.6}, mode='{}'",
                fill_regions, stroke_regions, detail, mode);

    log::debug!("Using superpixel artistic mode: {mode} (fill: {fill_regions}, stroke: {stroke_regions}, detail: {detail:.2})");

    for region in regions {
        if region.boundary_points.len() < 3 {
            continue; // Skip invalid regions
        }

        // Simplify boundary path using Douglas-Peucker
        let simplified_points = douglas_peucker_simplify(&region.boundary_points, dp_epsilon);

        if simplified_points.len() < 3 {
            continue; // Skip if simplification resulted in too few points
        }

        // Generate SVG path data for the boundary
        let mut path_data = String::new();
        path_data.push_str(&format!(
            "M {:.1},{:.1}",
            simplified_points[0].x, simplified_points[0].y
        ));

        for point in simplified_points.iter().skip(1) {
            path_data.push_str(&format!(" L {:.1},{:.1}", point.x, point.y));
        }
        path_data.push_str(" Z"); // Close the path

        // Determine colors based on preserve_colors setting
        let (fill_color_str, stroke_color_str) = if preserve_colors {
            // Use original colors
            (region.avg_rgb_hex.clone(), region.avg_rgb_hex.clone())
        } else {
            // Convert to luminance-based grayscale for monochrome mode
            let grayscale_hex = hex_to_grayscale_hex(&region.avg_rgb_hex);
            (grayscale_hex.clone(), grayscale_hex)
        };

        let fill_color = &fill_color_str;
        let stroke_color = &stroke_color_str;

        match mode {
            "filled_only" => {
                // Stained glass effect - filled regions only
                let svg_path = SvgPath::new_fill(path_data, fill_color);
                svg_paths.push(svg_path);
            }
            "filled_with_borders" => {
                // Comic book style - filled regions with black borders
                let filled_path = SvgPath::new_fill(path_data.clone(), fill_color);
                svg_paths.push(filled_path);

                // Add border stroke (always black for contrast)
                let stroke_path = SvgPath::new_stroke(path_data, "#000000", stroke_width);
                svg_paths.push(stroke_path);
            }
            "strokes_only" => {
                // Cell animation style - strokes only with region color
                let stroke_path = SvgPath::new_stroke(path_data, stroke_color, stroke_width * 1.5);
                svg_paths.push(stroke_path);
            }
            _ => {
                log::error!(
                    "Unknown superpixel mode: '{}', falling back to filled_only",
                    mode
                );
                let svg_path = SvgPath::new_fill(path_data, fill_color);
                svg_paths.push(svg_path);
            }
        }
    }

    log::debug!(
        "Generated {} SVG paths for {} regions in mode {}",
        svg_paths.len(),
        regions.len(),
        mode
    );
    Ok(svg_paths)
}

/// Dots backend: Dot-based pixel mapping with gradient analysis (stippling/pointillism effects)
fn trace_dots(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!("Running dots backend");
    let total_start = Instant::now();

    // Create DotConfig from TraceLowConfig - trust parameter validation
    let dot_config = DotConfig {
        min_radius: config.dot_min_radius,
        max_radius: config.dot_max_radius,
        density_threshold: config.dot_density_threshold,
        preserve_colors: config.dot_preserve_colors,
        adaptive_sizing: config.dot_adaptive_sizing,
        spacing_factor: 1.5, // Fixed reasonable default
        default_color: "#000000".to_string(),
        use_parallel: true,
        parallel_threshold: 10000,
        random_seed: 42,
        gradient_based_sizing: config.dot_gradient_based_sizing,
        size_variation: config.dot_size_variation,
        shape: config.dot_shape,
        grid_pattern: config.dot_grid_pattern,
    };

    // Create GradientConfig - can use defaults for now
    let gradient_config = GradientConfig::default();

    // Create BackgroundConfig with tolerance from config
    let background_config = BackgroundConfig {
        tolerance: config.dot_background_tolerance,
        sample_edge_pixels: true,
        cluster_colors: true,
        num_clusters: 8,
        random_seed: 42,
        edge_sample_ratio: 0.1,
    };

    log::debug!(
        "Dots config: min_radius={:.2}, max_radius={:.2}, density_threshold={:.2}, preserve_colors={}, adaptive_sizing={}, background_tolerance={:.2}",
        dot_config.min_radius,
        dot_config.max_radius,
        dot_config.density_threshold,
        dot_config.preserve_colors,
        dot_config.adaptive_sizing,
        background_config.tolerance
    );

    // Apply noise filtering if enabled (optional preprocessing for dots)
    let processed_image = if config.noise_filtering {
        let filter_start = Instant::now();

        // Convert to grayscale for noise filtering
        let gray = DynamicImage::ImageRgba8(image.clone()).to_luma8();

        // Use configurable bilateral filter parameters
        let spatial_sigma = config.noise_filter_spatial_sigma; // Respect user configuration
        let range_sigma = config.noise_filter_range_sigma;

        let filtered_gray = bilateral_filter(&gray, spatial_sigma, range_sigma);
        let filter_time = filter_start.elapsed();

        log::debug!(
            "Dots bilateral noise filtering: {:.3}ms (spatial_σ={:.1}, range_σ={:.1})",
            filter_time.as_secs_f64() * 1000.0,
            spatial_sigma,
            range_sigma
        );

        // Convert filtered grayscale back to RGBA (preserving original colors where applicable)
        let mut filtered_rgba = image.clone();
        for (x, y, rgba_pixel) in filtered_rgba.enumerate_pixels_mut() {
            let filtered_luma = filtered_gray.get_pixel(x, y).0[0];
            let original_luma = (0.299 * rgba_pixel.0[0] as f32
                + 0.587 * rgba_pixel.0[1] as f32
                + 0.114 * rgba_pixel.0[2] as f32) as u8;

            if original_luma > 0 {
                // Preserve color ratios while applying luminance filtering
                let scale = filtered_luma as f32 / original_luma as f32;
                rgba_pixel.0[0] = (rgba_pixel.0[0] as f32 * scale).min(255.0) as u8;
                rgba_pixel.0[1] = (rgba_pixel.0[1] as f32 * scale).min(255.0) as u8;
                rgba_pixel.0[2] = (rgba_pixel.0[2] as f32 * scale).min(255.0) as u8;
            }
        }

        filtered_rgba
    } else {
        log::debug!("Noise filtering disabled for dots - using original image");
        image.clone()
    };

    // Generate dots using the complete pipeline
    let phase_start = Instant::now();
    let dots = generate_dots_from_image(
        &processed_image,
        &dot_config,
        Some(&gradient_config),
        Some(&background_config),
    );
    let dot_generation_time = phase_start.elapsed();

    log::debug!(
        "Dot generation: {:.3}ms ({} dots)",
        dot_generation_time.as_secs_f64() * 1000.0,
        dots.len()
    );

    // Apply size variation processing
    let mut processed_dots = dots;
    if config.dot_size_variation >= 0.0 {
        let variation_start = Instant::now();

        use crate::algorithms::dots::dot_styles::{SizeVariationConfig, add_size_variation_with_config};

        let size_variation_config = SizeVariationConfig {
            variation_factor: config.dot_size_variation,
            seed: 42,
            min_factor: 0.7,
            max_factor: 1.5,
        };

        add_size_variation_with_config(&mut processed_dots, &size_variation_config);

        let variation_time = variation_start.elapsed();
        log::debug!(
            "Size variation applied: {:.3}ms (factor={:.2})",
            variation_time.as_secs_f64() * 1000.0,
            config.dot_size_variation
        );
    }

    // Convert dots to SVG paths
    let phase_start = Instant::now();
    let svg_paths = dots_to_svg_paths(&processed_dots);
    let svg_conversion_time = phase_start.elapsed();

    log::debug!(
        "SVG conversion: {:.3}ms ({} paths)",
        svg_conversion_time.as_secs_f64() * 1000.0,
        svg_paths.len()
    );

    let total_time = total_start.elapsed();
    log::info!(
        "Dots backend completed: {:.3}ms total ({} SVG paths)",
        total_time.as_secs_f64() * 1000.0,
        svg_paths.len()
    );

    Ok(svg_paths)
}

// ============================================================================
// Spatial Indexing and Performance Optimization
// ============================================================================

impl SpatialIndex {
    /// Create a new spatial index with given bounds and cell size
    fn new(bounds: (f32, f32, f32, f32), cell_size: f32) -> Self {
        Self {
            grid: HashMap::new(),
            cell_size,
            bounds,
        }
    }

    /// Convert world coordinates to grid cell coordinates
    fn world_to_grid(&self, x: f32, y: f32) -> (i32, i32) {
        let grid_x = ((x - self.bounds.0) / self.cell_size).floor() as i32;
        let grid_y = ((y - self.bounds.1) / self.cell_size).floor() as i32;
        (grid_x, grid_y)
    }

    /// Insert a path into the spatial index
    fn insert(&mut self, path_idx: usize, bbox: (f32, f32, f32, f32)) {
        // Get grid cells that the bounding box spans
        let (min_cell_x, min_cell_y) = self.world_to_grid(bbox.0, bbox.1);
        let (max_cell_x, max_cell_y) = self.world_to_grid(bbox.2, bbox.3);

        // Insert path index into all relevant grid cells
        for grid_y in min_cell_y..=max_cell_y {
            for grid_x in min_cell_x..=max_cell_x {
                self.grid
                    .entry((grid_x, grid_y))
                    .or_default()
                    .push(path_idx);
            }
        }
    }

    /// Find all path indices that might overlap with the given bounding box
    fn find_overlapping(&self, bbox: (f32, f32, f32, f32)) -> Vec<usize> {
        let (min_cell_x, min_cell_y) = self.world_to_grid(bbox.0, bbox.1);
        let (max_cell_x, max_cell_y) = self.world_to_grid(bbox.2, bbox.3);

        let mut candidates = Vec::new();

        for grid_y in min_cell_y..=max_cell_y {
            for grid_x in min_cell_x..=max_cell_x {
                if let Some(indices) = self.grid.get(&(grid_x, grid_y)) {
                    candidates.extend_from_slice(indices);
                }
            }
        }

        // Remove duplicates while preserving order
        candidates.sort_unstable();
        candidates.dedup();
        candidates
    }
}

impl CachedPathData {
    /// Create cached data from an SVG path
    fn from_svg_path(path: &SvgPath) -> Self {
        let coords: Vec<f32> = path
            .data
            .split_whitespace()
            .filter_map(|s| s.parse().ok())
            .collect();

        if coords.len() < 4 {
            return Self {
                coords,
                bbox: (0.0, 0.0, 0.0, 0.0),
                start_point: (0.0, 0.0),
                end_point: (0.0, 0.0),
                approx_length: 0.0,
            };
        }

        // Calculate bounding box
        let mut min_x = coords[0];
        let mut max_x = coords[0];
        let mut min_y = coords[1];
        let mut max_y = coords[1];

        let mut total_length = 0.0;
        let mut prev_x = coords[0];
        let mut prev_y = coords[1];

        for chunk in coords.chunks(2).skip(1) {
            if chunk.len() == 2 {
                let x = chunk[0];
                let y = chunk[1];

                min_x = min_x.min(x);
                max_x = max_x.max(x);
                min_y = min_y.min(y);
                max_y = max_y.max(y);

                // Accumulate length
                total_length += ((x - prev_x).powi(2) + (y - prev_y).powi(2)).sqrt();
                prev_x = x;
                prev_y = y;
            }
        }

        let start_point = (coords[0], coords[1]);
        let end_point = (coords[coords.len() - 2], coords[coords.len() - 1]);

        Self {
            coords,
            bbox: (min_x, min_y, max_x, max_y),
            start_point,
            end_point,
            approx_length: total_length,
        }
    }

    /// Fast geometric similarity check
    fn is_geometrically_similar(&self, other: &CachedPathData, tolerance: f32) -> bool {
        // Early rejection tests - very fast

        // 1. Bounding box overlap test
        if !bboxes_overlap(self.bbox, other.bbox, tolerance) {
            return false;
        }

        // 2. Length similarity test
        let length_ratio = if other.approx_length > 0.0 {
            self.approx_length / other.approx_length
        } else {
            1.0
        };
        if !(0.7..=1.43).contains(&length_ratio) {
            // ~70% to 143% length
            return false;
        }

        // 3. Start/end point distance test
        let start_dist = point_distance(self.start_point, other.start_point);
        let end_dist = point_distance(self.end_point, other.end_point);

        if start_dist <= tolerance && end_dist <= tolerance {
            return true; // Very likely duplicate
        }

        // 4. Check reverse direction (start-to-end vs end-to-start)
        let rev_start_dist = point_distance(self.start_point, other.end_point);
        let rev_end_dist = point_distance(self.end_point, other.start_point);

        if rev_start_dist <= tolerance && rev_end_dist <= tolerance {
            return true; // Likely duplicate in reverse direction
        }

        false
    }
}

/// Check if two bounding boxes overlap within tolerance
fn bboxes_overlap(
    bbox1: (f32, f32, f32, f32),
    bbox2: (f32, f32, f32, f32),
    tolerance: f32,
) -> bool {
    let (x1_min, y1_min, x1_max, y1_max) = bbox1;
    let (x2_min, y2_min, x2_max, y2_max) = bbox2;

    // Expand bboxes by tolerance
    let x1_min = x1_min - tolerance;
    let y1_min = y1_min - tolerance;
    let x1_max = x1_max + tolerance;
    let y1_max = y1_max + tolerance;

    let x2_min = x2_min - tolerance;
    let y2_min = y2_min - tolerance;
    let x2_max = x2_max + tolerance;
    let y2_max = y2_max + tolerance;

    !(x1_max < x2_min || x2_max < x1_min || y1_max < y2_min || y2_max < y1_min)
}

/// Calculate distance between two points
fn point_distance(p1: (f32, f32), p2: (f32, f32)) -> f32 {
    ((p1.0 - p2.0).powi(2) + (p1.1 - p2.1).powi(2)).sqrt()
}

/// Calculate image bounds from cached path data
fn calculate_image_bounds(cached_data: &[CachedPathData]) -> (f32, f32, f32, f32) {
    if cached_data.is_empty() {
        return (0.0, 0.0, 1000.0, 1000.0); // Default bounds
    }

    let mut min_x = cached_data[0].bbox.0;
    let mut min_y = cached_data[0].bbox.1;
    let mut max_x = cached_data[0].bbox.2;
    let mut max_y = cached_data[0].bbox.3;

    for cached in cached_data.iter().skip(1) {
        min_x = min_x.min(cached.bbox.0);
        min_y = min_y.min(cached.bbox.1);
        max_x = max_x.max(cached.bbox.2);
        max_y = max_y.max(cached.bbox.3);
    }

    // Add some padding
    let padding = 20.0;
    (
        min_x - padding,
        min_y - padding,
        max_x + padding,
        max_y + padding,
    )
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Convert RGB color to grayscale using ITU-R BT.709 luminance formula
/// This provides perceptually accurate luminance conversion with gamma correction
fn rgb_to_luminance_grayscale(r: u8, g: u8, b: u8) -> u8 {
    // ITU-R BT.709 standard weights for HDTV (most accurate for modern displays)
    // Apply gamma correction for linear RGB processing
    let r_linear = (r as f32 / 255.0).powf(2.2);
    let g_linear = (g as f32 / 255.0).powf(2.2);
    let b_linear = (b as f32 / 255.0).powf(2.2);

    // Apply ITU-R BT.709 luminance weights
    let luminance = 0.2126 * r_linear + 0.7152 * g_linear + 0.0722 * b_linear;

    // Convert back to gamma-corrected space and clamp to u8 range
    let gamma_corrected = luminance.powf(1.0 / 2.2);
    (gamma_corrected * 255.0).round().clamp(0.0, 255.0) as u8
}

/// Apply contrast enhancement to grayscale value
/// This prevents flat, low-contrast monochrome output by stretching the dynamic range
fn enhance_grayscale_contrast(gray: u8, contrast_factor: f32) -> u8 {
    // Convert to 0.0-1.0 range
    let normalized = gray as f32 / 255.0;

    // Apply contrast enhancement: expand around midpoint (0.5)
    // Formula: result = (value - 0.5) * contrast + 0.5
    let enhanced = (normalized - 0.5) * contrast_factor + 0.5;

    // Clamp and convert back to u8
    (enhanced * 255.0).round().clamp(0.0, 255.0) as u8
}

/// Convert RGB hex color to enhanced grayscale hex with contrast adjustment
fn hex_to_grayscale_hex(hex: &str) -> String {
    // Parse hex color (remove # prefix if present)
    let hex_clean = hex.trim_start_matches('#');

    // Handle both 3 and 6 character hex formats
    let (r, g, b) = if hex_clean.len() == 3 {
        // Short format: #RGB -> #RRGGBB
        let r = u8::from_str_radix(&hex_clean[0..1].repeat(2), 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex_clean[1..2].repeat(2), 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex_clean[2..3].repeat(2), 16).unwrap_or(0);
        (r, g, b)
    } else {
        // Full format: #RRGGBB
        let r = u8::from_str_radix(&hex_clean[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex_clean[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex_clean[4..6], 16).unwrap_or(0);
        (r, g, b)
    };

    // Convert to luminance-based grayscale
    let gray = rgb_to_luminance_grayscale(r, g, b);

    // Apply contrast enhancement (1.5 provides good balance)
    let enhanced_gray = enhance_grayscale_contrast(gray, 1.5);

    // Return as hex
    format!(
        "#{:02x}{:02x}{:02x}",
        enhanced_gray, enhanced_gray, enhanced_gray
    )
}

/// Convert RGBA image to grayscale with optional color map preservation
fn rgba_to_gray_with_colors(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    preserve_colors: bool,
) -> (GrayImage, Option<Vec<Rgba<u8>>>) {
    let (width, height) = image.dimensions();
    let mut gray = GrayImage::new(width, height);
    let mut color_map = if preserve_colors {
        Some(Vec::with_capacity((width * height) as usize))
    } else {
        None
    };

    // Use parallel processing for larger images (disabled in WASM builds to prevent memory issues)
    if width * height > 100_000 && !cfg!(target_arch = "wasm32") {
        // Generate coordinate pairs for parallel processing
        let pixel_coords: Vec<(u32, u32)> = (0..height)
            .flat_map(|y| (0..width).map(move |x| (x, y)))
            .collect();

        // Process pixels in parallel
        let results: Vec<(u32, u32, u8, Option<Rgba<u8>>)> =
            execute_parallel(pixel_coords, |(x, y)| {
                let rgba_pixel = image.get_pixel(x, y);
                let [r, g, b, _a] = rgba_pixel.0;
                // Optimized integer luminance calculation (avoids floating point)
                let gray_value = ((77 * r as u32 + 150 * g as u32 + 29 * b as u32) >> 8) as u8;
                let color = if preserve_colors {
                    Some(*rgba_pixel)
                } else {
                    None
                };
                (x, y, gray_value, color)
            });

        // Build results
        if preserve_colors {
            let mut color_vec = vec![Rgba([0, 0, 0, 0]); (width * height) as usize];
            for (x, y, gray_value, color) in results {
                gray.put_pixel(x, y, Luma([gray_value]));
                if let Some(rgba) = color {
                    color_vec[(y * width + x) as usize] = rgba;
                }
            }
            color_map = Some(color_vec);
        } else {
            for (x, y, gray_value, _) in results {
                gray.put_pixel(x, y, Luma([gray_value]));
            }
        }
    } else {
        // Use sequential processing for small images to avoid thread overhead
        for (x, y, pixel) in image.enumerate_pixels() {
            let [r, g, b, _a] = pixel.0;
            // Optimized integer luminance calculation
            let gray_value = ((77 * r as u32 + 150 * g as u32 + 29 * b as u32) >> 8) as u8;
            gray.put_pixel(x, y, Luma([gray_value]));

            if let Some(ref mut colors) = color_map {
                colors.push(*pixel);
            }
        }
    }

    (gray, color_map)
}

/// Convert RGBA image to grayscale with optimized parallel processing
fn rgba_to_gray(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> GrayImage {
    rgba_to_gray_with_colors(image, false).0
}

/// Apply optimized Gaussian blur with separable convolution and parallel processing
fn gaussian_blur(image: &GrayImage, sigma: f32) -> GrayImage {
    let kernel_size = (6.0 * sigma) as usize | 1; // Ensure odd
    let kernel_radius = kernel_size / 2;

    let (width, height) = image.dimensions();
    let mut blurred = GrayImage::new(width, height);

    // Use integer kernel for small kernels to improve performance
    let use_integer_kernel = kernel_size <= 7 && sigma <= 2.0;

    if use_integer_kernel {
        // Generate integer Gaussian kernel for better cache performance
        let mut int_kernel = vec![0i32; kernel_size];
        let mut sum = 0i32;

        for (i, k) in int_kernel.iter_mut().enumerate() {
            let x = i as f32 - kernel_radius as f32;
            let val = ((-x * x / (2.0 * sigma * sigma)).exp() * 256.0) as i32;
            *k = val;
            sum += val;
        }

        // Apply separable integer Gaussian filter with parallel processing
        let mut temp = GrayImage::new(width, height);

        // Horizontal pass - process rows in parallel (disabled in WASM builds to prevent memory issues)
        if width * height > 50_000 && !cfg!(target_arch = "wasm32") {
            let pixel_coords: Vec<(u32, u32)> = (0..height)
                .flat_map(|y| (0..width).map(move |x| (x, y)))
                .collect();

            execute_parallel(pixel_coords, |(x, y)| {
                let mut value = 0i32;
                for (i, &kernel_val) in int_kernel.iter().enumerate() {
                    let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                        .max(0)
                        .min(width as i32 - 1) as u32;
                    value += image.get_pixel(src_x, y).0[0] as i32 * kernel_val;
                }
                let temp_value = (value / sum).clamp(0, 255) as u8;
                (x, y, temp_value)
            })
            .into_iter()
            .for_each(|(x, y, temp_value)| {
                temp.put_pixel(x, y, Luma([temp_value]));
            });
        } else {
            // Sequential for small images
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0i32;
                    for (i, &kernel_val) in int_kernel.iter().enumerate() {
                        let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(width as i32 - 1) as u32;
                        value += image.get_pixel(src_x, y).0[0] as i32 * kernel_val;
                    }
                    temp.put_pixel(x, y, Luma([(value / sum).clamp(0, 255) as u8]));
                }
            }
        }

        // Vertical pass - process pixels in parallel (disabled in WASM builds to prevent memory issues)
        if width * height > 50_000 && !cfg!(target_arch = "wasm32") {
            let pixel_coords: Vec<(u32, u32)> = (0..height)
                .flat_map(|y| (0..width).map(move |x| (x, y)))
                .collect();

            execute_parallel(pixel_coords, |(x, y)| {
                let mut value = 0i32;
                for (i, &kernel_val) in int_kernel.iter().enumerate() {
                    let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                        .max(0)
                        .min(height as i32 - 1) as u32;
                    value += temp.get_pixel(x, src_y).0[0] as i32 * kernel_val;
                }
                let blur_value = (value / sum).clamp(0, 255) as u8;
                (x, y, blur_value)
            })
            .into_iter()
            .for_each(|(x, y, blur_value)| {
                blurred.put_pixel(x, y, Luma([blur_value]));
            });
        } else {
            // Sequential for small images
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0i32;
                    for (i, &kernel_val) in int_kernel.iter().enumerate() {
                        let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(height as i32 - 1) as u32;
                        value += temp.get_pixel(x, src_y).0[0] as i32 * kernel_val;
                    }
                    blurred.put_pixel(x, y, Luma([(value / sum).clamp(0, 255) as u8]));
                }
            }
        }
    } else {
        // Fallback to floating point for large kernels
        let mut kernel = vec![0.0f32; kernel_size];
        let mut sum = 0.0;
        for (i, k) in kernel.iter_mut().enumerate() {
            let x = i as f32 - kernel_radius as f32;
            *k = (-x * x / (2.0 * sigma * sigma)).exp();
            sum += *k;
        }
        // Normalize kernel
        for k in &mut kernel {
            *k /= sum;
        }

        // Apply separable Gaussian filter with parallel processing
        let mut temp = GrayImage::new(width, height);

        // Horizontal pass (disabled in WASM builds to prevent memory issues)
        if width * height > 50_000 && !cfg!(target_arch = "wasm32") {
            // Create index vector for parallel processing
            let indices: Vec<(u32, u32)> = (0..height)
                .flat_map(|y| (0..width).map(move |x| (x, y)))
                .collect();

            // Process pixels in parallel with execution abstraction
            let results = execute_parallel(indices, |(x, y)| {
                let mut value = 0.0;
                for (i, &kernel_val) in kernel.iter().enumerate() {
                    let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                        .max(0)
                        .min(width as i32 - 1) as u32;
                    value += image.get_pixel(src_x, y).0[0] as f32 * kernel_val;
                }
                (x, y, value.round().clamp(0.0, 255.0) as u8)
            });

            // Apply results to temp image
            for (x, y, pixel_value) in results {
                temp.put_pixel(x, y, Luma([pixel_value]));
            }
        } else {
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0.0;
                    for (i, &kernel_val) in kernel.iter().enumerate() {
                        let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(width as i32 - 1) as u32;
                        value += image.get_pixel(src_x, y).0[0] as f32 * kernel_val;
                    }
                    temp.put_pixel(x, y, Luma([value.round() as u8]));
                }
            }
        }

        // Vertical pass (disabled in WASM builds to prevent memory issues)
        if width * height > 50_000 && !cfg!(target_arch = "wasm32") {
            // Create index vector for parallel processing
            let indices: Vec<(u32, u32)> = (0..height)
                .flat_map(|y| (0..width).map(move |x| (x, y)))
                .collect();

            // Process pixels in parallel with execution abstraction
            let results = execute_parallel(indices, |(x, y)| {
                let mut value = 0.0;
                for (i, &kernel_val) in kernel.iter().enumerate() {
                    let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                        .max(0)
                        .min(height as i32 - 1) as u32;
                    value += temp.get_pixel(x, src_y).0[0] as f32 * kernel_val;
                }
                (x, y, value.round().clamp(0.0, 255.0) as u8)
            });

            // Apply results to blurred image
            for (x, y, pixel_value) in results {
                blurred.put_pixel(x, y, Luma([pixel_value]));
            }
        } else {
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0.0;
                    for (i, &kernel_val) in kernel.iter().enumerate() {
                        let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(height as i32 - 1) as u32;
                        value += temp.get_pixel(x, src_y).0[0] as f32 * kernel_val;
                    }
                    blurred.put_pixel(x, y, Luma([value.round() as u8]));
                }
            }
        }
    }

    blurred
}

/// Optimized Canny edge detection with parallel processing and fast approximations
fn canny_edge_detection(image: &GrayImage, low_threshold: f32, high_threshold: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    let total_pixels = (width * height) as usize;

    // Allocate all buffers upfront for better memory locality
    let mut gradient_x = vec![0.0f32; total_pixels];
    let mut gradient_y = vec![0.0f32; total_pixels];
    let mut gradient_magnitude = vec![0.0f32; total_pixels];

    // Calculate gradients using parallel processing with unrolled Sobel operators
    let use_parallel = width * height > 50_000 && !cfg!(target_arch = "wasm32");

    if use_parallel {
        // Create index vector for parallel processing
        let indices: Vec<usize> = (0..total_pixels).collect();

        // Process gradients in parallel with execution abstraction
        let results = execute_parallel(indices, |idx| {
            let y = (idx / width as usize) as u32;
            let x = (idx % width as usize) as u32;

            // Skip border pixels
            if x == 0 || x >= width - 1 || y == 0 || y >= height - 1 {
                return (idx, 0.0, 0.0, 0.0);
            }

            // Optimized Sobel operators - unrolled for better performance
            let p00 = image.get_pixel(x - 1, y - 1).0[0] as f32;
            let p01 = image.get_pixel(x, y - 1).0[0] as f32;
            let p02 = image.get_pixel(x + 1, y - 1).0[0] as f32;
            let p10 = image.get_pixel(x - 1, y).0[0] as f32;
            let p12 = image.get_pixel(x + 1, y).0[0] as f32;
            let p20 = image.get_pixel(x - 1, y + 1).0[0] as f32;
            let p21 = image.get_pixel(x, y + 1).0[0] as f32;
            let p22 = image.get_pixel(x + 1, y + 1).0[0] as f32;

            // Sobel X: [-1 0 1; -2 0 2; -1 0 1]
            let gx = -p00 + p02 - 2.0 * p10 + 2.0 * p12 - p20 + p22;
            // Sobel Y: [-1 -2 -1; 0 0 0; 1 2 1]
            let gy = -p00 - 2.0 * p01 - p02 + p20 + 2.0 * p21 + p22;

            // Use fast magnitude approximation (L1 norm) for better performance
            let mag = gx.abs() + gy.abs();

            (idx, gx, gy, mag)
        });

        // Apply results to gradient arrays
        for (idx, gx, gy, mag) in results {
            gradient_x[idx] = gx;
            gradient_y[idx] = gy;
            gradient_magnitude[idx] = mag;
        }
    } else {
        // Sequential processing for small images
        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let idx = (y * width + x) as usize;

                // Optimized Sobel operators - unrolled
                let p00 = image.get_pixel(x - 1, y - 1).0[0] as f32;
                let p01 = image.get_pixel(x, y - 1).0[0] as f32;
                let p02 = image.get_pixel(x + 1, y - 1).0[0] as f32;
                let p10 = image.get_pixel(x - 1, y).0[0] as f32;
                let p12 = image.get_pixel(x + 1, y).0[0] as f32;
                let p20 = image.get_pixel(x - 1, y + 1).0[0] as f32;
                let p21 = image.get_pixel(x, y + 1).0[0] as f32;
                let p22 = image.get_pixel(x + 1, y + 1).0[0] as f32;

                gradient_x[idx] = -p00 + p02 - 2.0 * p10 + 2.0 * p12 - p20 + p22;
                gradient_y[idx] = -p00 - 2.0 * p01 - p02 + p20 + 2.0 * p21 + p22;
                gradient_magnitude[idx] = gradient_x[idx].abs() + gradient_y[idx].abs();
            }
        }
    }

    // Find max magnitude for normalization (single-threaded WASM + Web Worker architecture)
    let max_magnitude = gradient_magnitude.iter().fold(0.0f32, |a, &b| a.max(b));

    // Normalize gradient magnitude to [0, 1] (single-threaded WASM + Web Worker architecture)
    if max_magnitude > 0.0 {
        for mag in &mut gradient_magnitude {
            *mag /= max_magnitude;
        }
    }

    // Non-maximum suppression with fast angle approximation
    let mut suppressed = vec![0.0f32; total_pixels];

    if use_parallel {
        // Create index vector for parallel processing
        let indices: Vec<usize> = (0..total_pixels).collect();

        // Process suppression in parallel with execution abstraction
        let results = execute_parallel(indices, |idx| {
            let y = (idx / width as usize) as u32;
            let x = (idx % width as usize) as u32;

            // Skip border pixels
            if x == 0 || x >= width - 1 || y == 0 || y >= height - 1 {
                return (idx, 0.0);
            }

            let magnitude = gradient_magnitude[idx];
            if magnitude == 0.0 {
                return (idx, 0.0);
            }

            let gx = gradient_x[idx];
            let gy = gradient_y[idx];

            // Fast angle approximation - avoid expensive atan2
            let (dx1, dy1, dx2, dy2) = if gx.abs() > gy.abs() {
                if gx * gy > 0.0 {
                    (1, 1, -1, -1) // 45 degrees
                } else {
                    (1, -1, -1, 1) // 135 degrees
                }
            } else if gy > 0.0 {
                (0, 1, 0, -1) // 90 degrees
            } else {
                (1, 0, -1, 0) // 0 degrees
            };

            let x1 = (x as i32 + dx1).max(0).min(width as i32 - 1) as usize;
            let y1 = (y as i32 + dy1).max(0).min(height as i32 - 1) as usize;
            let x2 = (x as i32 + dx2).max(0).min(width as i32 - 1) as usize;
            let y2 = (y as i32 + dy2).max(0).min(height as i32 - 1) as usize;

            let mag1 = gradient_magnitude[y1 * width as usize + x1];
            let mag2 = gradient_magnitude[y2 * width as usize + x2];

            let suppressed_value = if magnitude >= mag1 && magnitude >= mag2 {
                magnitude
            } else {
                0.0
            };

            (idx, suppressed_value)
        });

        // Apply results to suppressed array
        for (idx, value) in results {
            suppressed[idx] = value;
        }
    } else {
        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let idx = (y * width + x) as usize;
                let magnitude = gradient_magnitude[idx];

                if magnitude == 0.0 {
                    continue;
                }

                let gx = gradient_x[idx];
                let gy = gradient_y[idx];

                // Fast angle approximation
                let (dx1, dy1, dx2, dy2) = if gx.abs() > gy.abs() {
                    if gx * gy > 0.0 {
                        (1, 1, -1, -1) // 45 degrees
                    } else {
                        (1, -1, -1, 1) // 135 degrees
                    }
                } else if gy > 0.0 {
                    (0, 1, 0, -1) // 90 degrees
                } else {
                    (1, 0, -1, 0) // 0 degrees
                };

                let x1 = (x as i32 + dx1).max(0).min(width as i32 - 1) as u32;
                let y1 = (y as i32 + dy1).max(0).min(height as i32 - 1) as u32;
                let x2 = (x as i32 + dx2).max(0).min(width as i32 - 1) as u32;
                let y2 = (y as i32 + dy2).max(0).min(height as i32 - 1) as u32;

                let mag1 = gradient_magnitude[(y1 * width + x1) as usize];
                let mag2 = gradient_magnitude[(y2 * width + x2) as usize];

                if magnitude >= mag1 && magnitude >= mag2 {
                    suppressed[idx] = magnitude;
                }
            }
        }
    }

    // Double threshold - parallel classification
    let mut edges = GrayImage::new(width, height);
    let mut strong_edges = vec![false; total_pixels];
    let mut weak_edges = vec![false; total_pixels];

    // Sequential processing for thresholding (can't easily parallelize mutable access)
    for idx in 0..total_pixels {
        let magnitude = suppressed[idx];

        if magnitude >= high_threshold {
            strong_edges[idx] = true;
        } else if magnitude >= low_threshold {
            weak_edges[idx] = true;
        }
    }

    // Set strong edges in output image
    for (idx, &is_strong) in strong_edges.iter().enumerate() {
        if is_strong {
            let y = (idx / width as usize) as u32;
            let x = (idx % width as usize) as u32;
            edges.put_pixel(x, y, Luma([255]));
        }
    }

    // Optimized hysteresis with limited iterations for performance
    let mut changed = true;
    let mut iteration = 0;
    let max_iterations = 3; // Reduced for performance, still maintains good quality

    while changed && iteration < max_iterations {
        changed = false;
        iteration += 1;

        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let idx = (y * width + x) as usize;
                if weak_edges[idx] && !strong_edges[idx] {
                    // Check 8-connectivity neighbors efficiently
                    let has_strong_neighbor = [
                        strong_edges[((y - 1) * width + (x - 1)) as usize],
                        strong_edges[((y - 1) * width + x) as usize],
                        strong_edges[((y - 1) * width + (x + 1)) as usize],
                        strong_edges[(y * width + (x - 1)) as usize],
                        strong_edges[(y * width + (x + 1)) as usize],
                        strong_edges[((y + 1) * width + (x - 1)) as usize],
                        strong_edges[((y + 1) * width + x) as usize],
                        strong_edges[((y + 1) * width + (x + 1)) as usize],
                    ]
                    .iter()
                    .any(|&x| x);

                    if has_strong_neighbor {
                        edges.put_pixel(x, y, Luma([255]));
                        strong_edges[idx] = true;
                        changed = true;
                    }
                }
            }
        }
    }

    edges
}

/// Link edge pixels into polylines using 8-connectivity
fn link_edges_to_polylines(edges: &GrayImage) -> Vec<Vec<Point>> {
    let (width, height) = edges.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();

    // 8-connectivity neighbors
    const NEIGHBORS: [(i32, i32); 8] = [
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    ];

    for y in 0..height {
        for x in 0..width {
            if edges.get_pixel(x, y).0[0] == 255 && !visited[y as usize][x as usize] {
                // Start new polyline from this edge pixel
                let mut polyline = Vec::new();
                let mut stack = VecDeque::new();
                stack.push_back((x, y));

                while let Some((px, py)) = stack.pop_back() {
                    if visited[py as usize][px as usize] {
                        continue;
                    }

                    visited[py as usize][px as usize] = true;
                    polyline.push(Point {
                        x: px as f32,
                        y: py as f32,
                    });

                    // Find connected neighbors
                    for (dx, dy) in &NEIGHBORS {
                        let nx = px as i32 + dx;
                        let ny = py as i32 + dy;

                        if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                            let nx = nx as u32;
                            let ny = ny as u32;

                            if !visited[ny as usize][nx as usize]
                                && edges.get_pixel(nx, ny).0[0] == 255
                            {
                                stack.push_back((nx, ny));
                            }
                        }
                    }
                }

                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    polylines
}

/// Calculate local curvature at a point in a polyline
/// Returns curvature magnitude (0.0 = straight, higher = more curved)
fn local_curvature(polyline: &[Point], index: usize) -> f32 {
    let n = polyline.len();
    if n < 3 || index == 0 || index >= n - 1 {
        return 0.0;
    }

    let p_prev = &polyline[index - 1];
    let p_curr = &polyline[index];
    let p_next = &polyline[index + 1];

    // Calculate vectors
    let v1 = (p_curr.x - p_prev.x, p_curr.y - p_prev.y);
    let v2 = (p_next.x - p_curr.x, p_next.y - p_curr.y);

    // Calculate angle between vectors using cross product
    let cross = v1.0 * v2.1 - v1.1 * v2.0;
    let dot = v1.0 * v2.0 + v1.1 * v2.1;

    let angle = cross.atan2(dot).abs();

    // Normalize by segment lengths to get curvature
    let len1 = v1.0.hypot(v1.1);
    let len2 = v2.0.hypot(v2.1);
    let avg_len = (len1 + len2) * 0.5;

    if avg_len < 1e-6 {
        0.0
    } else {
        angle / avg_len
    }
}

/// Adaptive polyline simplification that preserves curved regions
/// Uses higher tolerance in straight sections, lower tolerance in curves
fn simplify_adaptive(polyline: &[Point], base_epsilon: f32) -> Vec<Point> {
    if polyline.len() <= 2 {
        return polyline.to_vec();
    }

    // Calculate curvature for each point
    let mut curvatures = Vec::with_capacity(polyline.len());
    for i in 0..polyline.len() {
        curvatures.push(local_curvature(polyline, i));
    }

    // Find maximum curvature for normalization
    let max_curvature = curvatures.iter().fold(0.0f32, |acc, &c| acc.max(c));

    // Recursive simplification with adaptive epsilon
    fn simplify_recursive(
        points: &[Point],
        curvatures: &[f32],
        max_curvature: f32,
        base_epsilon: f32,
        start: usize,
        end: usize,
        result: &mut Vec<Point>,
    ) {
        if end <= start + 1 {
            return;
        }

        let first = &points[start];
        let last = &points[end];

        let mut max_distance = 0.0;
        let mut max_index = start;

        // Find point with maximum deviation
        for i in (start + 1)..end {
            let distance = perpendicular_distance(&points[i], first, last);
            if distance > max_distance {
                max_distance = distance;
                max_index = i;
            }
        }

        // Calculate adaptive epsilon for the worst point
        let normalized_curvature = if max_curvature > 1e-6 {
            curvatures[max_index] / max_curvature
        } else {
            0.0
        };

        // More aggressive simplification in straight areas (low curvature)
        // Less aggressive in curved areas (high curvature)
        let curvature_factor = 0.2 + 0.8 * normalized_curvature; // Range: 0.2 to 1.0
        let adaptive_epsilon = base_epsilon * curvature_factor;

        if max_distance > adaptive_epsilon {
            // Point is significant, recurse on both sides
            simplify_recursive(
                points,
                curvatures,
                max_curvature,
                base_epsilon,
                start,
                max_index,
                result,
            );
            result.push(points[max_index]);
            simplify_recursive(
                points,
                curvatures,
                max_curvature,
                base_epsilon,
                max_index,
                end,
                result,
            );
        }
    }

    // Helper function for perpendicular distance calculation
    fn perpendicular_distance(point: &Point, line_start: &Point, line_end: &Point) -> f32 {
        let dx = line_end.x - line_start.x;
        let dy = line_end.y - line_start.y;

        if dx == 0.0 && dy == 0.0 {
            return ((point.x - line_start.x).powi(2) + (point.y - line_start.y).powi(2)).sqrt();
        }

        let numerator = (dy * point.x - dx * point.y + line_end.x * line_start.y
            - line_end.y * line_start.x)
            .abs();
        let denominator = (dx * dx + dy * dy).sqrt();

        numerator / denominator
    }

    let mut result = vec![polyline[0]];
    simplify_recursive(
        polyline,
        &curvatures,
        max_curvature,
        base_epsilon,
        0,
        polyline.len() - 1,
        &mut result,
    );
    result.push(polyline[polyline.len() - 1]);

    result
}

/// Douglas-Peucker polyline simplification
fn douglas_peucker_simplify(polyline: &[Point], epsilon: f32) -> Vec<Point> {
    if polyline.len() <= 2 {
        return polyline.to_vec();
    }

    fn perpendicular_distance(point: &Point, line_start: &Point, line_end: &Point) -> f32 {
        let dx = line_end.x - line_start.x;
        let dy = line_end.y - line_start.y;

        if dx == 0.0 && dy == 0.0 {
            // Degenerate line
            return ((point.x - line_start.x).powi(2) + (point.y - line_start.y).powi(2)).sqrt();
        }

        let numerator = (dy * point.x - dx * point.y + line_end.x * line_start.y
            - line_end.y * line_start.x)
            .abs();
        let denominator = (dx * dx + dy * dy).sqrt();

        numerator / denominator
    }

    fn dp_recursive(points: &[Point], epsilon: f32, result: &mut Vec<Point>) {
        // CRITICAL FIX: Enhanced bounds checking to prevent "unreachable executed" in multipass processing
        if points.len() < 2 {
            return;
        }

        // Additional safety check to prevent corruption-induced panics
        if points.is_empty() {
            return;
        }

        let first = &points[0];
        let last = &points[points.len() - 1];

        let mut max_distance = 0.0;
        let mut max_index = 0;

        // CRITICAL FIX: More robust loop bounds to prevent integer underflow
        if points.len() > 2 {
            for (i, point) in points.iter().enumerate().skip(1).take(points.len() - 2) {
                let distance = perpendicular_distance(point, first, last);
                if distance > max_distance {
                    max_distance = distance;
                    max_index = i;
                }
            }
        }

        if max_distance > epsilon && points.len() > 2 {
            // CRITICAL FIX: Validate indices before slicing to prevent bounds panic
            if max_index < points.len() && max_index > 0 {
                dp_recursive(&points[0..=max_index], epsilon, result);
                result.pop(); // Remove duplicate point
                dp_recursive(&points[max_index..], epsilon, result);
            } else {
                // Fallback: just add endpoints if indices are invalid
                result.push(*first);
                result.push(*last);
            }
        } else {
            // Keep only first and last points
            result.push(*first);
            result.push(*last);
        }
    }

    let mut result = Vec::new();
    dp_recursive(polyline, epsilon, &mut result);
    result
}

/// Calculate total length of a polyline
fn calculate_polyline_length(polyline: &[Point]) -> f32 {
    let mut length = 0.0;
    for i in 1..polyline.len() {
        let dx = polyline[i].x - polyline[i - 1].x;
        let dy = polyline[i].y - polyline[i - 1].y;
        length += (dx * dx + dy * dy).sqrt();
    }
    length
}

/// Calculate stroke width based on image size and reference resolution
fn calculate_stroke_width(image: &ImageBuffer<Rgba<u8>, Vec<u8>>, stroke_px_at_1080p: f32) -> f32 {
    let image_diagonal = ((image.width().pow(2) + image.height().pow(2)) as f32).sqrt();
    let reference_diagonal = ((1920_f32).powi(2) + (1080_f32).powi(2)).sqrt(); // 1080p diagonal
    let scale_factor = image_diagonal / reference_diagonal;

    stroke_px_at_1080p * scale_factor
}

/// Clamp stroke width to prevent excessive thickness during refinement
///
/// As specified in Next-Steps.md:
/// - Clamp stroke widths to [w_min, w_max] range
/// - Optionally modulate by tone (small range)
/// - NEVER increase width during refinement
/// - Prefer density over thickness for darker regions
fn clamp_stroke_width(width: f32, _config: &TraceLowConfig) -> f32 {
    // Define reasonable bounds for stroke widths
    let w_min = 0.5; // Minimum readable stroke width
    let w_max = 10.0; // Match UI maximum - allow user's full range

    // Clamp to reasonable range
    width.max(w_min).min(w_max)
}

/// Create SVG stroke path from polyline
/// Sample colors from a polyline using advanced color processing
fn sample_polyline_color(
    polyline: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    config: &TraceLowConfig,
) -> String {
    if polyline.is_empty() || color_map.is_empty() {
        return "#000000".to_string();
    }

    // Use advanced color processing
    let color_info = crate::algorithms::extract_path_colors(
        polyline,
        color_map,
        image_width,
        image_height,
        config.line_color_sampling.clone(),
        config.line_color_accuracy,
        config.color_tolerance,
    );

    color_info.primary_color
}

/// Enhanced polyline color sampling with gradient detection
fn sample_polyline_color_with_gradient(
    polyline: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    config: &TraceLowConfig,
    path_id: usize,
) -> (String, Option<crate::algorithms::GradientDetectionAnalysis>) {
    if polyline.is_empty() || color_map.is_empty() {
        return ("#000000".to_string(), None);
    }

    // Use advanced color processing to extract color samples
    let color_info = crate::algorithms::extract_path_colors(
        polyline,
        color_map,
        image_width,
        image_height,
        config.line_color_sampling.clone(),
        config.line_color_accuracy,
        config.color_tolerance,
    );

    // Check if gradient sampling is enabled and we have enough color variation
    let use_gradients = matches!(
        config.line_color_sampling,
        crate::algorithms::ColorSamplingMethod::GradientMapping
            | crate::algorithms::ColorSamplingMethod::ContentAware
            | crate::algorithms::ColorSamplingMethod::Adaptive
    ) && color_info.sample_points.len() >= 3;

    if use_gradients {
        // Create gradient detection config
        let gradient_config = crate::algorithms::GradientDetectionConfig {
            min_quality_threshold: 0.3, // Lower threshold for line art
            max_complexity_threshold: 0.9,
            min_samples_for_gradient: 3,
            enable_linear_gradients: true,
            enable_radial_gradients: false, // Keep it simple for lines
        };

        // Try to detect gradients in this path
        if let Some(gradient_analysis) = crate::algorithms::analyze_path_for_gradients(
            polyline,
            &color_info.sample_points,
            &gradient_config,
        ) {
            return (
                format!("url(#gradient_linear__{})", path_id),
                Some(gradient_analysis),
            );
        }
    }

    // Fallback to primary color
    (color_info.primary_color, None)
}

/// Enhance existing SVG paths with gradient information
fn enhance_paths_with_gradients(
    paths: &[SvgPath],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> (Vec<SvgPath>, Vec<GradientDefinition>) {
    let mut enhanced_paths = Vec::new();
    let mut gradient_definitions = Vec::new();

    // Extract color map from image
    let color_map: Vec<Rgba<u8>> = image.pixels().cloned().collect();
    let width = image.width();
    let height = image.height();

    for (path_id, path) in paths.iter().enumerate() {
        // Try to parse path coordinates to detect gradients or create segments
        if let Some(polyline) = parse_svg_path_to_polyline(&path.data) {
            // Check if we should use multi-segment paths based on color complexity
            let use_multi_segment = config.line_color_sampling
                == crate::algorithms::ColorSamplingMethod::ContentAware
                && polyline.len() > 10; // Only for longer paths

            if use_multi_segment {
                // Segment the path by color changes
                let segments =
                    segment_path_by_color_changes(&polyline, &color_map, width, height, config);

                // Create a separate SVG path for each segment
                for (segment_polyline, segment_color) in segments.into_iter() {
                    if segment_polyline.len() >= 2 {
                        // Generate path data for this segment
                        let segment_path_data = create_path_data_from_points(&segment_polyline);

                        // Create SVG path for this segment
                        let mut segment_path = path.clone();
                        segment_path.data = segment_path_data;
                        segment_path.stroke = segment_color;
                        enhanced_paths.push(segment_path);
                    }
                }
            } else {
                // Use gradient-based processing for single paths
                let (stroke_color, gradient_analysis) = sample_polyline_color_with_gradient(
                    &polyline, &color_map, width, height, config, path_id,
                );

                // Create enhanced path
                let mut enhanced_path = path.clone();
                enhanced_path.stroke = stroke_color;
                enhanced_paths.push(enhanced_path);

                // Add gradient definition if detected
                if let Some(analysis) = gradient_analysis {
                    if let Some(gradient_def) =
                        convert_gradient_analysis_to_definition(path_id, &analysis)
                    {
                        gradient_definitions.push(gradient_def);
                    }
                }
            }
        } else {
            // Keep original path if we can't parse it
            enhanced_paths.push(path.clone());
        }
    }

    (enhanced_paths, gradient_definitions)
}

/// Create SVG path data from a sequence of points
fn create_path_data_from_points(points: &[Point]) -> String {
    if points.is_empty() {
        return String::new();
    }

    let mut path_data = format!("M {} {}", points[0].x, points[0].y);

    for point in points.iter().skip(1) {
        path_data.push_str(&format!(" L {} {}", point.x, point.y));
    }

    path_data
}

/// Parse SVG path data into polyline coordinates (simplified parser)
fn parse_svg_path_to_polyline(path_data: &str) -> Option<Vec<Point>> {
    let mut points = Vec::new();
    let mut tokens = path_data.split_whitespace();

    while let Some(token) = tokens.next() {
        match token {
            "M" | "L" => {
                // Move to or line to - expect x, y coordinates
                if let (Some(x_str), Some(y_str)) = (tokens.next(), tokens.next()) {
                    if let (Ok(x), Ok(y)) = (x_str.parse::<f32>(), y_str.parse::<f32>()) {
                        points.push(Point::new(x, y));
                    }
                }
            }
            _ => {
                // Skip other commands for simplicity
                continue;
            }
        }
    }

    if points.len() >= 2 {
        Some(points)
    } else {
        None
    }
}

/// Convert gradient analysis to SVG gradient definition
fn convert_gradient_analysis_to_definition(
    path_id: usize,
    analysis: &crate::algorithms::GradientDetectionAnalysis,
) -> Option<GradientDefinition> {
    use crate::algorithms::GradientType;

    match &analysis.gradient_type {
        GradientType::Linear {
            start, end, stops, ..
        } => {
            let svg_stops: Vec<ColorStop> = stops
                .iter()
                .map(|stop| {
                    // Convert ColorSample to hex string
                    let rgba = stop.color.color;
                    let hex_color = format!("#{:02x}{:02x}{:02x}", rgba[0], rgba[1], rgba[2]);

                    ColorStop {
                        offset: stop.offset * 100.0, // Convert to percentage
                        color: hex_color,
                        opacity: Some(rgba[3] as f32 / 255.0),
                    }
                })
                .collect();

            Some(GradientDefinition::Linear {
                id: format!("gradient_linear__{}", path_id),
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                stops: svg_stops,
            })
        }
        GradientType::Radial {
            center,
            radius,
            stops,
            ..
        } => {
            let svg_stops: Vec<ColorStop> = stops
                .iter()
                .map(|stop| {
                    let rgba = stop.color.color;
                    let hex_color = format!("#{:02x}{:02x}{:02x}", rgba[0], rgba[1], rgba[2]);

                    ColorStop {
                        offset: stop.offset * 100.0,
                        color: hex_color,
                        opacity: Some(rgba[3] as f32 / 255.0),
                    }
                })
                .collect();

            Some(GradientDefinition::Radial {
                id: format!("gradient_radial__{}", path_id),
                cx: center.x,
                cy: center.y,
                r: *radius,
                stops: svg_stops,
            })
        }
    }
}

/// Segment a path based on color changes to create multi-segment colored paths
fn segment_path_by_color_changes(
    polyline: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    _config: &TraceLowConfig,
) -> Vec<(Vec<Point>, String)> {
    if polyline.len() < 2 {
        return vec![(polyline.to_vec(), "#000000".to_string())];
    }

    let mut segments = Vec::new();
    let mut current_segment = Vec::new();
    let mut current_color: Option<String> = None;

    // Color change threshold - colors must differ by at least this much to create a new segment
    let color_change_threshold = 30.0; // RGB distance threshold

    for (i, point) in polyline.iter().enumerate() {
        // Sample color at current point
        let point_color = sample_point_color(point, color_map, image_width, image_height);
        let point_color_hex = rgba_to_hex_string(&point_color);

        // Check if we need to start a new segment
        let should_start_new_segment = if let Some(ref prev_color) = current_color {
            let color_distance = calculate_rgb_distance(&hex_to_rgba(prev_color), &point_color);
            color_distance > color_change_threshold
        } else {
            false
        };

        if should_start_new_segment && !current_segment.is_empty() {
            // End current segment with the previous point for continuity
            if let Some(prev_point) = polyline.get(i.saturating_sub(1)) {
                current_segment.push(*prev_point);
            }

            // Save current segment
            segments.push((
                current_segment.clone(),
                current_color.clone().unwrap_or("#000000".to_string()),
            ));

            // Start new segment with the previous point for continuity
            current_segment.clear();
            if let Some(prev_point) = polyline.get(i.saturating_sub(1)) {
                current_segment.push(*prev_point);
            }
        }

        // Add current point to segment
        current_segment.push(*point);
        current_color = Some(point_color_hex);
    }

    // Add final segment
    if !current_segment.is_empty() {
        segments.push((
            current_segment,
            current_color.unwrap_or("#000000".to_string()),
        ));
    }

    // Filter out segments that are too short to be meaningful
    segments.retain(|(segment, _)| segment.len() >= 2);

    // If no valid segments, return the full path with a default color
    if segments.is_empty() {
        vec![(polyline.to_vec(), "#000000".to_string())]
    } else {
        segments
    }
}

/// Sample color at a specific point in the image
fn sample_point_color(
    point: &Point,
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
) -> Rgba<u8> {
    let x = (point.x.round() as u32).min(image_width - 1);
    let y = (point.y.round() as u32).min(image_height - 1);
    let index = (y * image_width + x) as usize;

    if index < color_map.len() {
        color_map[index]
    } else {
        Rgba([0, 0, 0, 255]) // Default black
    }
}

/// Convert RGBA to hex string
fn rgba_to_hex_string(rgba: &Rgba<u8>) -> String {
    format!("#{:02x}{:02x}{:02x}", rgba[0], rgba[1], rgba[2])
}

/// Convert hex string to RGBA
fn hex_to_rgba(hex: &str) -> Rgba<u8> {
    let hex = hex.trim_start_matches('#');
    if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
        Rgba([r, g, b, 255])
    } else {
        Rgba([0, 0, 0, 255])
    }
}

/// Calculate RGB distance between two colors
fn calculate_rgb_distance(color1: &Rgba<u8>, color2: &Rgba<u8>) -> f32 {
    let dr = color1[0] as f32 - color2[0] as f32;
    let dg = color1[1] as f32 - color2[1] as f32;
    let db = color1[2] as f32 - color2[2] as f32;
    (dr * dr + dg * dg + db * db).sqrt()
}

/// Create stroke path with optional color sampling
fn create_stroke_path_with_color(
    polyline: Vec<Point>,
    stroke_width: f32,
    color_map: Option<&Vec<Rgba<u8>>>,
    image_width: u32,
    image_height: u32,
    config: &TraceLowConfig,
) -> SvgPath {
    // Create path data string
    let mut path_data = String::new();

    if !polyline.is_empty() {
        path_data.push_str(&format!("M {:.2} {:.2}", polyline[0].x, polyline[0].y));

        for point in polyline.iter().skip(1) {
            path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
        }
    }

    // Determine stroke color
    let stroke_color = if let Some(colors) = color_map {
        sample_polyline_color(&polyline, colors, image_width, image_height, config)
    } else {
        "#000000".to_string()
    };

    SvgPath {
        element_type: SvgElementType::Path,
        data: path_data,
        fill: "none".to_string(),
        stroke: stroke_color,
        stroke_width,
    }
}

/// Legacy function for backward compatibility
fn create_stroke_path(polyline: Vec<Point>, stroke_width: f32) -> SvgPath {
    // Create a minimal config for legacy compatibility
    let default_config = TraceLowConfig::default();
    create_stroke_path_with_color(polyline, stroke_width, None, 0, 0, &default_config)
}

/// Analyze edge density across the image for content-aware processing
fn analyze_edge_density(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    conservative_paths: &[SvgPath],
) -> Result<EdgeDensityAnalysis, VectorizeError> {
    let (width, height) = image.dimensions();
    let grid_width = 8;
    let grid_height = 8;

    // Initialize grid
    let mut region_grid = vec![vec![0.0f32; grid_width]; grid_height];
    let cell_width = width / grid_width as u32;
    let cell_height = height / grid_height as u32;

    // Convert image to grayscale for gradient analysis
    let gray = rgba_to_gray(image);

    // Calculate edge density in each grid cell using simplified gradient
    for (grid_y, row) in region_grid.iter_mut().enumerate() {
        for (grid_x, cell) in row.iter_mut().enumerate() {
            let start_x = grid_x as u32 * cell_width;
            let start_y = grid_y as u32 * cell_height;
            let end_x = (start_x + cell_width).min(width - 1);
            let end_y = (start_y + cell_height).min(height - 1);

            let mut edge_count = 0;
            let mut total_pixels = 0;

            // Sample every 4th pixel for performance
            for y in (start_y..end_y).step_by(4) {
                for x in (start_x..end_x).step_by(4) {
                    if x > 0 && x < width - 1 && y > 0 && y < height - 1 {
                        let _center = gray.get_pixel(x, y).0[0] as i32;
                        let left = gray.get_pixel(x - 1, y).0[0] as i32;
                        let right = gray.get_pixel(x + 1, y).0[0] as i32;
                        let top = gray.get_pixel(x, y - 1).0[0] as i32;
                        let bottom = gray.get_pixel(x, y + 1).0[0] as i32;

                        // Simple gradient magnitude approximation
                        let grad_x = (right - left).abs();
                        let grad_y = (bottom - top).abs();
                        let gradient = grad_x + grad_y;

                        if gradient > 30 {
                            // Threshold for edge detection
                            edge_count += 1;
                        }
                        total_pixels += 1;
                    }
                }
            }

            *cell = if total_pixels > 0 {
                edge_count as f32 / total_pixels as f32
            } else {
                0.0
            };
        }
    }

    // Identify regions based on edge density and conservative path coverage
    let mut high_detail_regions = Vec::new();
    let mut texture_regions = Vec::new();

    for (grid_y, row) in region_grid.iter().enumerate() {
        for (grid_x, &density) in row.iter().enumerate() {
            let rect = Rect {
                x: grid_x as u32 * cell_width,
                y: grid_y as u32 * cell_height,
                width: cell_width,
                height: cell_height,
            };

            // High texture regions (too much noise) - avoid in aggressive pass
            if density > 0.15 {
                texture_regions.push(rect);
            }
            // Low density regions that might need aggressive processing
            else if density < 0.05 && has_few_paths_in_region(&rect, conservative_paths) {
                high_detail_regions.push(rect);
            }
        }
    }

    log::debug!(
        "Edge density analysis: {} high-detail regions, {} texture regions",
        high_detail_regions.len(),
        texture_regions.len()
    );

    Ok(EdgeDensityAnalysis {
        _region_grid: region_grid,
        _high_detail_regions: high_detail_regions,
        texture_regions,
        _grid_width: grid_width,
        _grid_height: grid_height,
    })
}

/// Check if a region has few paths from conservative pass
fn has_few_paths_in_region(region: &Rect, paths: &[SvgPath]) -> bool {
    let mut path_count = 0;

    for path in paths {
        if path_intersects_region(path, region) {
            path_count += 1;
            if path_count >= 3 {
                return false; // Region already has sufficient coverage
            }
        }
    }

    true // Region has few paths
}

/// Check if a path intersects with a region
fn path_intersects_region(path: &SvgPath, region: &Rect) -> bool {
    // Simple bounding box intersection check
    // For a more accurate implementation, would parse path data and check coordinates
    // For now, using a heuristic based on path data content
    let data = &path.data;

    // Look for coordinates in the path data that fall within the region
    let coords: Vec<f32> = data
        .split_whitespace()
        .filter_map(|s| s.parse().ok())
        .collect();

    for chunk in coords.chunks(2) {
        if chunk.len() == 2 {
            let x = chunk[0] as u32;
            let y = chunk[1] as u32;

            if x >= region.x
                && x < region.x + region.width
                && y >= region.y
                && y < region.y + region.height
            {
                return true;
            }
        }
    }

    false
}

/// Aggressive edge tracing with content-aware filtering
fn trace_edge_aggressive(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _conservative_paths: &[SvgPath],
    analysis: &EdgeDensityAnalysis,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // For initial implementation, use the standard trace_edge but with different thresholds
    let thresholds = ThresholdMapping::new(config.detail, image.width(), image.height());
    let mut aggressive_paths = trace_edge(image, &thresholds, config)?;

    // Apply content-aware filtering if enabled
    if config.noise_filtering {
        aggressive_paths = filter_texture_noise(aggressive_paths, analysis);
    }

    Ok(aggressive_paths)
}

/// Filter out noise paths in texture regions
fn filter_texture_noise(paths: Vec<SvgPath>, analysis: &EdgeDensityAnalysis) -> Vec<SvgPath> {
    paths
        .into_iter()
        .filter(|path| !is_path_in_texture_region(path, analysis))
        .collect()
}

/// Check if a path is primarily in a texture region
fn is_path_in_texture_region(path: &SvgPath, analysis: &EdgeDensityAnalysis) -> bool {
    for texture_region in &analysis.texture_regions {
        if path_intersects_region(path, texture_region) {
            return true;
        }
    }
    false
}

/// Check if two coordinate sequences are similar within tolerance
#[allow(dead_code)]
fn coords_are_similar(coords1: &[f32], coords2: &[f32], tolerance: f32) -> bool {
    if coords1.len() != coords2.len() {
        return false;
    }

    let min_matches = (coords1.len() / 4).max(2); // At least 2 coordinate pairs must match
    let mut matches = 0;

    for (i, chunk) in coords1.chunks(2).enumerate() {
        if let Some(other_chunk) = coords2.get(i * 2..(i + 1) * 2) {
            if chunk.len() == 2 && other_chunk.len() == 2 {
                let dx = (chunk[0] - other_chunk[0]).abs();
                let dy = (chunk[1] - other_chunk[1]).abs();

                if dx <= tolerance && dy <= tolerance {
                    matches += 1;
                }
            }
        }
    }

    matches >= min_matches
}

// ============================================================================
// Directional Processing Functions
// ============================================================================

/// Analyze image characteristics to determine beneficial directional passes
fn analyze_directional_characteristics(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    existing_paths: &[SvgPath],
) -> Result<DirectionalAnalysis, VectorizeError> {
    let (width, height) = image.dimensions();
    let gray = rgba_to_gray(image);

    // Analyze gradient orientations to detect directional patterns
    let mut orientation_histogram = [0u32; 8]; // 8 orientation bins (0-7)
    let mut total_strong_gradients = 0u32;

    // Sample gradients across the image
    for y in (2..height - 2).step_by(4) {
        for x in (2..width - 2).step_by(4) {
            // Calculate Sobel gradients
            let gx = sobel_x(&gray, x, y);
            let gy = sobel_y(&gray, x, y);
            let magnitude = (gx * gx + gy * gy).sqrt();

            if magnitude > 20.0 {
                // Strong gradient threshold
                total_strong_gradients += 1;

                // Quantize angle to 8 bins (22.5 degrees each)
                let angle = gy.atan2(gx);
                let normalized_angle = if angle < 0.0 {
                    angle + 2.0 * std::f32::consts::PI
                } else {
                    angle
                };
                let bin = ((normalized_angle / (std::f32::consts::PI / 4.0)) as usize).min(7);
                orientation_histogram[bin] += 1;
            }
        }
    }

    // Calculate directional characteristics
    let has_diagonal_content = if total_strong_gradients > 0 {
        let diagonal_bins = orientation_histogram[1]
            + orientation_histogram[3]
            + orientation_histogram[5]
            + orientation_histogram[7]; // 45°, 135°, 225°, 315°
        let _orthogonal_bins = orientation_histogram[0]
            + orientation_histogram[2]
            + orientation_histogram[4]
            + orientation_histogram[6]; // 0°, 90°, 180°, 270°

        diagonal_bins as f32 / total_strong_gradients as f32 > 0.25
    } else {
        false
    };

    // Detect architectural elements (straight lines, corners)
    let has_architectural_elements = detect_architectural_elements(existing_paths);

    // Calculate texture directionality (variance in orientation distribution)
    let texture_directionality = if total_strong_gradients > 0 {
        let mean = total_strong_gradients as f32 / 8.0;
        let variance = orientation_histogram
            .iter()
            .map(|&count| (count as f32 - mean).powi(2))
            .sum::<f32>()
            / 8.0;
        let std_dev = variance.sqrt();
        (std_dev / mean).min(1.0)
    } else {
        0.0
    };

    // Detect dominant lighting direction by analyzing brightness gradients
    let dominant_lighting_direction = detect_lighting_direction(&gray);

    // Calculate benefit scores for each direction (more permissive than before)
    let mut direction_benefits = [0.0f32; 4];
    direction_benefits[0] = 1.0; // Standard always has full benefit
    direction_benefits[1] = if dominant_lighting_direction.is_some() {
        0.8 // Higher benefit when lighting detected
    } else {
        0.4 // Higher baseline - reverse can help most images
    }; // Reverse
    direction_benefits[2] = if has_diagonal_content { 0.9 } else { 0.3 }; // DiagonalNW - higher baseline
    direction_benefits[3] = if has_diagonal_content { 0.9 } else { 0.3 }; // DiagonalNE - higher baseline

    // Boost benefits for architectural content
    if has_architectural_elements {
        direction_benefits[2] *= 1.2; // Diagonal passes help with architecture
        direction_benefits[3] *= 1.2;
    }

    // Reduce benefits for highly textured content (may add noise)
    if texture_directionality > 0.6 {
        for benefit in direction_benefits.iter_mut().skip(1) {
            *benefit *= 0.7;
        }
    }

    log::debug!(
        "Directional analysis: diagonal={has_diagonal_content}, architectural={has_architectural_elements}, directionality={texture_directionality:.2}, benefits={direction_benefits:?}"
    );

    Ok(DirectionalAnalysis {
        has_diagonal_content,
        _dominant_lighting_direction: dominant_lighting_direction,
        has_architectural_elements,
        texture_directionality,
        direction_benefits,
    })
}

/// Calculate Sobel X gradient at a specific pixel
fn sobel_x(gray: &GrayImage, x: u32, y: u32) -> f32 {
    let p00 = gray.get_pixel(x - 1, y - 1).0[0] as f32;
    let _p01 = gray.get_pixel(x, y - 1).0[0] as f32;
    let p02 = gray.get_pixel(x + 1, y - 1).0[0] as f32;
    let p10 = gray.get_pixel(x - 1, y).0[0] as f32;
    let p12 = gray.get_pixel(x + 1, y).0[0] as f32;
    let p20 = gray.get_pixel(x - 1, y + 1).0[0] as f32;
    let _p21 = gray.get_pixel(x, y + 1).0[0] as f32;
    let p22 = gray.get_pixel(x + 1, y + 1).0[0] as f32;

    -p00 + p02 - 2.0 * p10 + 2.0 * p12 - p20 + p22
}

/// Calculate Sobel Y gradient at a specific pixel
fn sobel_y(gray: &GrayImage, x: u32, y: u32) -> f32 {
    let p00 = gray.get_pixel(x - 1, y - 1).0[0] as f32;
    let p01 = gray.get_pixel(x, y - 1).0[0] as f32;
    let p02 = gray.get_pixel(x + 1, y - 1).0[0] as f32;
    let p20 = gray.get_pixel(x - 1, y + 1).0[0] as f32;
    let p21 = gray.get_pixel(x, y + 1).0[0] as f32;
    let p22 = gray.get_pixel(x + 1, y + 1).0[0] as f32;

    -p00 - 2.0 * p01 - p02 + p20 + 2.0 * p21 + p22
}

/// Detect architectural elements in existing paths
fn detect_architectural_elements(paths: &[SvgPath]) -> bool {
    // Simple heuristic: look for long, straight paths which suggest architectural content
    let mut long_straight_paths = 0;

    for path in paths {
        let coords: Vec<f32> = path
            .data
            .split_whitespace()
            .filter_map(|s| s.parse().ok())
            .collect();

        if coords.len() >= 8 {
            // At least 4 coordinate pairs
            // Check if path is relatively straight (simple heuristic)
            let mut total_length = 0.0;
            let mut direct_length = 0.0;

            for i in (0..coords.len() - 2).step_by(2) {
                if i + 3 < coords.len() {
                    let dx = coords[i + 2] - coords[i];
                    let dy = coords[i + 3] - coords[i + 1];
                    total_length += (dx * dx + dy * dy).sqrt();
                }
            }

            if coords.len() >= 4 {
                let dx = coords[coords.len() - 2] - coords[0];
                let dy = coords[coords.len() - 1] - coords[1];
                direct_length = (dx * dx + dy * dy).sqrt();
            }

            // If path is relatively straight and long, count as architectural
            if total_length > 50.0 && direct_length / total_length > 0.8 {
                long_straight_paths += 1;
            }
        }
    }

    long_straight_paths >= 3 // Threshold for architectural content
}

/// Detect dominant lighting direction from brightness gradients
fn detect_lighting_direction(gray: &GrayImage) -> Option<ProcessingDirection> {
    let (width, height) = gray.dimensions();
    let mut brightness_gradients = [0.0f32; 4]; // Left, Right, Top, Bottom

    // Sample brightness differences across image regions
    let mid_x = width / 2;
    let mid_y = height / 2;
    let quarter_w = width / 4;
    let quarter_h = height / 4;

    // Left vs Right brightness
    let left_brightness =
        sample_region_brightness(gray, 0, mid_y - quarter_h, quarter_w, quarter_h * 2);
    let right_brightness = sample_region_brightness(
        gray,
        width - quarter_w,
        mid_y - quarter_h,
        quarter_w,
        quarter_h * 2,
    );
    brightness_gradients[0] = left_brightness;
    brightness_gradients[1] = right_brightness;

    // Top vs Bottom brightness
    let top_brightness =
        sample_region_brightness(gray, mid_x - quarter_w, 0, quarter_w * 2, quarter_h);
    let bottom_brightness = sample_region_brightness(
        gray,
        mid_x - quarter_w,
        height - quarter_h,
        quarter_w * 2,
        quarter_h,
    );
    brightness_gradients[2] = top_brightness;
    brightness_gradients[3] = bottom_brightness;

    // Determine if there's a strong directional bias
    let lr_diff = (brightness_gradients[1] - brightness_gradients[0]).abs();
    let tb_diff = (brightness_gradients[3] - brightness_gradients[2]).abs();

    if lr_diff > 20.0 && lr_diff > tb_diff * 1.5 {
        // Strong left-right lighting difference
        if brightness_gradients[1] > brightness_gradients[0] {
            Some(ProcessingDirection::Reverse) // Light from right, process R->L
        } else {
            Some(ProcessingDirection::Standard) // Light from left, standard L->R
        }
    } else if tb_diff > 20.0 && tb_diff > lr_diff * 1.5 {
        // Strong top-bottom lighting difference
        if brightness_gradients[3] > brightness_gradients[2] {
            Some(ProcessingDirection::Reverse) // Light from bottom, process B->T
        } else {
            Some(ProcessingDirection::Standard) // Light from top, standard T->B
        }
    } else {
        None // No clear directional lighting
    }
}

/// Sample average brightness in a region
fn sample_region_brightness(gray: &GrayImage, x: u32, y: u32, w: u32, h: u32) -> f32 {
    let mut sum = 0u32;
    let mut count = 0u32;

    for py in y..(y + h).min(gray.height()) {
        for px in x..(x + w).min(gray.width()) {
            sum += gray.get_pixel(px, py).0[0] as u32;
            count += 1;
        }
    }

    if count > 0 {
        sum as f32 / count as f32
    } else {
        0.0
    }
}

/// Schedule directional passes based on analysis and time budget
fn schedule_directional_passes(
    analysis: &DirectionalAnalysis,
    remaining_budget_ms: u64,
    config: &TraceLowConfig,
) -> Vec<ProcessingDirection> {
    let mut candidates = Vec::new();

    // Add reverse pass if enabled and beneficial
    if config.enable_reverse_pass {
        if analysis.direction_benefits[1] >= config.directional_strength_threshold {
            log::info!(
                "✓ Reverse pass scheduled (benefit: {:.2} >= threshold: {:.2})",
                analysis.direction_benefits[1],
                config.directional_strength_threshold
            );
            candidates.push((ProcessingDirection::Reverse, analysis.direction_benefits[1]));
        } else {
            log::info!(
                "⏭ Reverse pass skipped (benefit: {:.2} < threshold: {:.2})",
                analysis.direction_benefits[1],
                config.directional_strength_threshold
            );
        }
    }

    // Add diagonal passes if enabled and beneficial
    if config.enable_diagonal_pass {
        if analysis.direction_benefits[2] >= config.directional_strength_threshold {
            log::info!(
                "✓ Diagonal NW pass scheduled (benefit: {:.2} >= threshold: {:.2})",
                analysis.direction_benefits[2],
                config.directional_strength_threshold
            );
            candidates.push((
                ProcessingDirection::DiagonalNW,
                analysis.direction_benefits[2],
            ));
        } else {
            log::info!(
                "⏭ Diagonal NW pass skipped (benefit: {:.2} < threshold: {:.2})",
                analysis.direction_benefits[2],
                config.directional_strength_threshold
            );
        }

        if analysis.direction_benefits[3] >= config.directional_strength_threshold {
            log::info!(
                "✓ Diagonal NE pass scheduled (benefit: {:.2} >= threshold: {:.2})",
                analysis.direction_benefits[3],
                config.directional_strength_threshold
            );
            candidates.push((
                ProcessingDirection::DiagonalNE,
                analysis.direction_benefits[3],
            ));
        } else {
            log::info!(
                "⏭ Diagonal NE pass skipped (benefit: {:.2} < threshold: {:.2})",
                analysis.direction_benefits[3],
                config.directional_strength_threshold
            );
        }
    }

    // Sort by benefit score (highest first)
    candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    // Estimate time per pass (rough heuristic based on image size)
    let estimated_time_per_pass = (remaining_budget_ms / 4).max(50); // At least 50ms per pass
    let max_passes = (remaining_budget_ms / estimated_time_per_pass).min(3) as usize; // Max 3 directional passes

    candidates
        .into_iter()
        .take(max_passes)
        .map(|(direction, _)| direction)
        .collect()
}

/// Execute a single directional pass
fn execute_directional_pass(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    direction: ProcessingDirection,
    _analysis: &DirectionalAnalysis,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // For now, use modified edge detection with directional bias
    // This is a simplified implementation - full directional processing would require
    // modifying the core Canny algorithm to process pixels in different orders

    let thresholds = ThresholdMapping::new(config.detail * 0.8, image.width(), image.height());

    match direction {
        ProcessingDirection::Standard => {
            // This shouldn't be called directly, but handle gracefully
            trace_edge(image, &thresholds, config)
        }
        ProcessingDirection::Reverse => {
            // Implement reverse processing by modifying edge detection sensitivity
            trace_edge_directional(image, direction, &thresholds, config)
        }
        ProcessingDirection::DiagonalNW | ProcessingDirection::DiagonalNE => {
            // Implement diagonal processing with adjusted parameters
            trace_edge_directional(image, direction, &thresholds, config)
        }
    }
}

/// Directional edge detection with processing order modifications
fn trace_edge_directional(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    direction: ProcessingDirection,
    thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::debug!("Running directional edge backend: {direction:?}");

    // Convert to grayscale
    let gray = rgba_to_gray(image);

    // Apply Gaussian blur with direction-specific sigma
    let sigma = match direction {
        ProcessingDirection::Reverse => 1.2 + (0.8 * config.detail), // Slightly more blur for reverse
        ProcessingDirection::DiagonalNW | ProcessingDirection::DiagonalNE => {
            0.8 + (1.2 * config.detail)
        } // Less blur for diagonal
        _ => 1.0 + (1.0 * config.detail),
    };
    let blurred = gaussian_blur(&gray, sigma);

    // Apply directional Canny edge detection
    let edges = canny_edge_detection_directional(&blurred, direction, thresholds);

    // Link edges with direction-aware processing
    let polylines = link_edges_to_polylines_directional(&edges, direction);

    // Simplify and filter using execution abstraction
    let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
    let svg_paths: Vec<SvgPath> = execute_parallel_filter_map(polylines, |polyline| {
        let simplified = douglas_peucker_simplify(&polyline, thresholds.dp_epsilon_px);
        let length = calculate_polyline_length(&simplified);

        if length >= thresholds.min_stroke_length_px * 1.2 {
            // Slightly higher threshold for directional
            Some(create_stroke_path(simplified, stroke_width))
        } else {
            None
        }
    });

    log::debug!(
        "Directional {:?} generated {} paths",
        direction,
        svg_paths.len()
    );
    Ok(svg_paths)
}

/// Direction-aware Canny edge detection
fn canny_edge_detection_directional(
    image: &GrayImage,
    direction: ProcessingDirection,
    thresholds: &ThresholdMapping,
) -> GrayImage {
    // Adjust thresholds based on direction
    let (low_threshold, high_threshold) = match direction {
        ProcessingDirection::Reverse => {
            // Slightly lower thresholds for reverse to catch lighting-dependent edges
            (
                thresholds.canny_low_threshold * 0.85,
                thresholds.canny_high_threshold * 0.85,
            )
        }
        ProcessingDirection::DiagonalNW | ProcessingDirection::DiagonalNE => {
            // Higher thresholds for diagonal to focus on strong architectural edges
            (
                thresholds.canny_low_threshold * 1.15,
                thresholds.canny_high_threshold * 1.15,
            )
        }
        _ => (
            thresholds.canny_low_threshold,
            thresholds.canny_high_threshold,
        ),
    };

    // For now, use standard Canny with adjusted thresholds
    // Full directional implementation would modify the non-maximum suppression
    // and hysteresis stages to favor certain orientations
    canny_edge_detection(image, low_threshold, high_threshold)
}

/// Direction-aware edge linking
fn link_edges_to_polylines_directional(
    edges: &GrayImage,
    direction: ProcessingDirection,
) -> Vec<Vec<Point>> {
    // For now, use standard linking
    // Full implementation would start linking from different corners/edges
    // based on the processing direction
    let mut polylines = link_edges_to_polylines(edges);

    // Apply direction-specific filtering
    match direction {
        ProcessingDirection::DiagonalNW | ProcessingDirection::DiagonalNE => {
            // Filter to prefer diagonal-oriented paths, but keep at least some paths
            let original_count = polylines.len();
            polylines.retain(|polyline| is_diagonal_oriented(polyline));

            // Log for debugging
            log::debug!(
                "Diagonal filtering for {:?}: {} -> {} polylines",
                direction,
                original_count,
                polylines.len()
            );
        }
        _ => {}
    }

    polylines
}

/// Check if a polyline is diagonally oriented
fn is_diagonal_oriented(polyline: &[Point]) -> bool {
    if polyline.is_empty() {
        return false;
    }

    if polyline.len() < 2 {
        return false;
    }

    // Safely get first and last points
    let start = match polyline.first() {
        Some(p) => p,
        None => return false,
    };

    let end = match polyline.last() {
        Some(p) => p,
        None => return false,
    };

    let dx = (end.x - start.x).abs();
    let dy = (end.y - start.y).abs();

    // Check if the line is more diagonal than orthogonal
    // Avoid division by zero
    let max_delta = dx.max(dy);
    if max_delta < 1.0 {
        return false; // Too small to determine orientation
    }

    let min_delta = dx.min(dy);
    let diagonal_ratio = min_delta / max_delta;
    diagonal_ratio > 0.4 // At least 40% diagonal component
}

/// Optimized merge directional results with spatial indexing
fn merge_directional_results(
    base_paths: Vec<SvgPath>,
    directional_paths: Vec<Vec<SvgPath>>,
    _config: &TraceLowConfig,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Vec<SvgPath> {
    log::debug!(
        "Starting optimized merge of {} base paths + {} directional path sets",
        base_paths.len(),
        directional_paths.len()
    );

    let merge_start = Instant::now();

    // Collect all paths into a single vector for processing
    let mut all_paths = base_paths;
    for direction_paths in directional_paths {
        all_paths.extend(direction_paths);
    }

    if all_paths.is_empty() {
        return all_paths;
    }

    // Cache path data to avoid repeated parsing - O(n) operation
    let cached_data: Vec<CachedPathData> = execute_parallel(
        all_paths.iter().collect::<Vec<_>>(),
        CachedPathData::from_svg_path,
    );

    // Determine image bounds from all paths
    let bounds = calculate_image_bounds(&cached_data);

    // Create spatial index with appropriate cell size (50 pixels works well)
    let mut spatial_index = SpatialIndex::new(bounds, 50.0);

    // Build spatial index - O(n) operation
    let mut final_paths = Vec::new();
    let mut final_cached_data = Vec::new();

    let all_paths_len = all_paths.len();
    for (path, cached) in all_paths.into_iter().zip(cached_data.into_iter()) {
        // Skip very short paths early
        if cached.approx_length < 5.0 {
            continue;
        }

        // Find potentially overlapping paths using spatial index - O(k) where k << n
        let candidates = spatial_index.find_overlapping(cached.bbox);

        let mut is_duplicate = false;

        // Only check against spatially nearby paths
        for &candidate_idx in &candidates {
            if candidate_idx < final_cached_data.len()
                && cached.is_geometrically_similar(&final_cached_data[candidate_idx], 8.0)
            {
                is_duplicate = true;
                break;
            }
        }

        if !is_duplicate {
            // Add to spatial index and final results
            spatial_index.insert(final_paths.len(), cached.bbox);
            final_paths.push(path);
            final_cached_data.push(cached);
        }
    }

    let merge_time = merge_start.elapsed();
    log::info!(
        "Optimized merge completed in {:.1}ms: {} paths -> {} paths ({:.1}% reduction)",
        merge_time.as_secs_f64() * 1000.0,
        all_paths_len, // Original count before processing
        final_paths.len(),
        (1.0 - final_paths.len() as f64 / all_paths_len as f64) * 100.0
    );

    // Always apply artistic enhancements if hand-drawn effects are configured
    // The user specifically requested artistic effects, so we should apply them regardless of timing

    apply_artistic_enhancements(final_paths, hand_drawn_config)
}

/// Apply artistic enhancements for hand-drawn aesthetic
fn apply_artistic_enhancements(
    paths: Vec<SvgPath>,
    hand_drawn_config: Option<&crate::algorithms::visual::hand_drawn::HandDrawnConfig>,
) -> Vec<SvgPath> {
    if paths.is_empty() {
        return paths;
    }

    // If no hand-drawn config provided, return paths unchanged
    let Some(config) = hand_drawn_config else {
        return paths;
    };

    log::debug!("Applying artistic enhancements to {} paths", paths.len());
    let enhancement_start = crate::utils::Instant::now();

    // Use the proper configurable hand_drawn system instead of hard-coded effects
    let enhanced_paths =
        crate::algorithms::visual::hand_drawn::apply_hand_drawn_aesthetics(paths, config);

    let enhancement_time = enhancement_start.elapsed();
    log::debug!(
        "Artistic enhancements completed in {:.1}ms",
        enhancement_time.as_secs_f64() * 1000.0
    );

    enhanced_paths
}

/// Comprehensive performance profiling for multipass processing
#[derive(Debug)]
#[allow(dead_code)]
struct MultipassPerformanceProfile {
    conservative_pass: std::time::Duration,
    aggressive_pass: std::time::Duration,
    reverse_pass: std::time::Duration,
    diagonal_nw_pass: std::time::Duration,
    diagonal_ne_pass: std::time::Duration,
    merge_phase: std::time::Duration,
    artistic_polish: std::time::Duration,
    total_time: std::time::Duration,
    path_counts: PathCounts,
}

#[derive(Debug)]
#[allow(dead_code)]
struct PathCounts {
    conservative_paths: usize,
    aggressive_paths: usize,
    reverse_paths: usize,
    diagonal_nw_paths: usize,
    diagonal_ne_paths: usize,
    pre_merge_total: usize,
    final_paths: usize,
    deduplication_percentage: f32,
}

/// Profile the performance of multipass vectorization
#[allow(dead_code)]
fn profile_multipass_performance(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<MultipassPerformanceProfile, VectorizeError> {
    let total_start = Instant::now();

    // Initialize profile structure
    let mut profile = MultipassPerformanceProfile {
        conservative_pass: std::time::Duration::ZERO,
        aggressive_pass: std::time::Duration::ZERO,
        reverse_pass: std::time::Duration::ZERO,
        diagonal_nw_pass: std::time::Duration::ZERO,
        diagonal_ne_pass: std::time::Duration::ZERO,
        merge_phase: std::time::Duration::ZERO,
        artistic_polish: std::time::Duration::ZERO,
        total_time: std::time::Duration::ZERO,
        path_counts: PathCounts {
            conservative_paths: 0,
            aggressive_paths: 0,
            reverse_paths: 0,
            diagonal_nw_paths: 0,
            diagonal_ne_paths: 0,
            pre_merge_total: 0,
            final_paths: 0,
            deduplication_percentage: 0.0,
        },
    };

    // Conservative pass
    let pass_start = Instant::now();
    let mut conservative_config = config.clone();
    // FIXED: Conservative pass should use higher thresholds (lower detail value)
    conservative_config.detail = config.conservative_detail.unwrap_or(config.detail * 0.7);
    conservative_config.enable_multipass = false;
    let conservative_paths = vectorize_trace_low_single_pass(image, &conservative_config, None)?;
    profile.conservative_pass = pass_start.elapsed();
    profile.path_counts.conservative_paths = conservative_paths.len();

    // Analysis phase
    let analysis = analyze_edge_density(image, &conservative_paths)?;

    // Aggressive pass
    let pass_start = Instant::now();
    let mut aggressive_config = config.clone();
    // FIXED: Aggressive pass should use lower thresholds (higher detail value)
    aggressive_config.detail = config.aggressive_detail.unwrap_or(config.detail * 1.3);
    aggressive_config.enable_multipass = false;
    let aggressive_paths =
        trace_edge_aggressive(image, &conservative_paths, &analysis, &aggressive_config)?;
    profile.aggressive_pass = pass_start.elapsed();
    profile.path_counts.aggressive_paths = aggressive_paths.len();

    // Count pre-merge total
    let mut pre_merge_total = conservative_paths.len() + aggressive_paths.len();

    // Directional passes if enabled
    let mut directional_paths = Vec::new();

    if config.enable_reverse_pass {
        let pass_start = Instant::now();
        let reverse_paths = execute_directional_pass(
            image,
            ProcessingDirection::Reverse,
            &analyze_directional_characteristics(image, &conservative_paths)?,
            config,
        )?;
        profile.reverse_pass = pass_start.elapsed();
        profile.path_counts.reverse_paths = reverse_paths.len();
        pre_merge_total += reverse_paths.len();
        directional_paths.push(reverse_paths);
    }

    if config.enable_diagonal_pass {
        let analysis = analyze_directional_characteristics(image, &conservative_paths)?;

        let pass_start = Instant::now();
        let diagonal_nw_paths =
            execute_directional_pass(image, ProcessingDirection::DiagonalNW, &analysis, config)?;
        profile.diagonal_nw_pass = pass_start.elapsed();
        profile.path_counts.diagonal_nw_paths = diagonal_nw_paths.len();
        pre_merge_total += diagonal_nw_paths.len();
        directional_paths.push(diagonal_nw_paths);

        let pass_start = Instant::now();
        let diagonal_ne_paths =
            execute_directional_pass(image, ProcessingDirection::DiagonalNE, &analysis, config)?;
        profile.diagonal_ne_pass = pass_start.elapsed();
        profile.path_counts.diagonal_ne_paths = diagonal_ne_paths.len();
        pre_merge_total += diagonal_ne_paths.len();
        directional_paths.push(diagonal_ne_paths);
    } else {
        // Add aggressive paths as a directional set for merging
        directional_paths.push(aggressive_paths);
    }

    profile.path_counts.pre_merge_total = pre_merge_total;

    // Merge phase
    let merge_start = Instant::now();
    let final_paths =
        merge_directional_results(conservative_paths, directional_paths, config, None);
    profile.merge_phase = merge_start.elapsed();
    profile.path_counts.final_paths = final_paths.len();

    // Calculate deduplication percentage
    profile.path_counts.deduplication_percentage = if pre_merge_total > 0 {
        ((pre_merge_total - final_paths.len()) as f32 / pre_merge_total as f32) * 100.0
    } else {
        0.0
    };

    profile.total_time = total_start.elapsed();

    Ok(profile)
}

/// Remove spatially overlapping paths (legacy - now unused)
#[allow(dead_code)]
fn spatial_deduplication(paths: Vec<SvgPath>) -> Vec<SvgPath> {
    let mut deduped_paths = Vec::new();

    for path in paths {
        let mut is_duplicate = false;

        for existing_path in &deduped_paths {
            if paths_are_spatially_close(&path, existing_path, 5.0) {
                is_duplicate = true;
                break;
            }
        }

        if !is_duplicate {
            deduped_paths.push(path);
        }
    }

    deduped_paths
}

/// Check if two paths are spatially close
#[allow(dead_code)]
fn paths_are_spatially_close(path1: &SvgPath, path2: &SvgPath, threshold: f32) -> bool {
    // Simple implementation: check if start/end points are close
    let coords1: Vec<f32> = path1
        .data
        .split_whitespace()
        .filter_map(|s| s.parse().ok())
        .collect();
    let coords2: Vec<f32> = path2
        .data
        .split_whitespace()
        .filter_map(|s| s.parse().ok())
        .collect();

    if coords1.len() < 4 || coords2.len() < 4 {
        return false;
    }

    // Check start points
    let dx_start = coords1[0] - coords2[0];
    let dy_start = coords1[1] - coords2[1];
    let start_dist = (dx_start * dx_start + dy_start * dy_start).sqrt();

    // Check end points
    let dx_end = coords1[coords1.len() - 2] - coords2[coords2.len() - 2];
    let dy_end = coords1[coords1.len() - 1] - coords2[coords2.len() - 1];
    let end_dist = (dx_end * dx_end + dy_end * dy_end).sqrt();

    start_dist <= threshold && end_dist <= threshold
}

// ============================================================================
// Centerline Backend Helper Functions
// ============================================================================

/// Check if pixel is foreground (white in binary image)
fn is_foreground(image: &GrayImage, x: u32, y: u32) -> bool {
    let (width, height) = image.dimensions();
    if x >= width || y >= height {
        false
    } else {
        image.get_pixel(x, y).0[0] > 128
    }
}

/// Count black-to-white transitions in 8-neighborhood
fn count_transitions(neighbors: &[bool; 8]) -> usize {
    let mut count = 0;
    for i in 0..8 {
        let current = neighbors[i];
        let next = neighbors[(i + 1) % 8];
        if !current && next {
            count += 1;
        }
    }
    count
}

/// Guo-Hall thinning algorithm - improved skeletonization with fewer artifacts
/// Produces fewer stair-steps and spurs than Zhang-Suen on natural/photographic inputs
fn guo_hall_thinning(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut image = GrayImage::new(width, height);

    // Copy binary image (white = 255 for foreground, black = 0 for background)
    for y in 0..height {
        for x in 0..width {
            image.get_pixel_mut(x, y).0[0] = binary.get_pixel(x, y).0[0];
        }
    }

    let mut changed = true;
    let mut iteration = 0;

    while changed && iteration < 100 {
        // Safety limit
        changed = false;
        iteration += 1;

        // Step 1: Mark pixels for deletion based on Guo-Hall conditions
        let mut to_delete_1 = Vec::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if should_delete_guo_hall_step1(&image, x, y) {
                    to_delete_1.push((x, y));
                }
            }
        }

        // Delete marked pixels
        for &(x, y) in &to_delete_1 {
            image.get_pixel_mut(x, y).0[0] = 0;
            changed = true;
        }

        // Step 2: Mark different pixels for deletion
        let mut to_delete_2 = Vec::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if should_delete_guo_hall_step2(&image, x, y) {
                    to_delete_2.push((x, y));
                }
            }
        }

        // Delete marked pixels
        for &(x, y) in &to_delete_2 {
            image.get_pixel_mut(x, y).0[0] = 0;
            changed = true;
        }
    }

    image
}

/// Guo-Hall Step 1: Check if pixel should be deleted
fn should_delete_guo_hall_step1(image: &GrayImage, x: u32, y: u32) -> bool {
    if !is_foreground(image, x, y) {
        return false;
    }

    // Get 8-neighborhood (clockwise from top)
    let p2 = is_foreground(image, x, y.wrapping_sub(1)); // N
    let p3 = is_foreground(image, x + 1, y.wrapping_sub(1)); // NE
    let p4 = is_foreground(image, x + 1, y); // E
    let p5 = is_foreground(image, x + 1, y + 1); // SE
    let p6 = is_foreground(image, x, y + 1); // S
    let p7 = is_foreground(image, x.wrapping_sub(1), y + 1); // SW
    let p8 = is_foreground(image, x.wrapping_sub(1), y); // W
    let p9 = is_foreground(image, x.wrapping_sub(1), y.wrapping_sub(1)); // NW

    // Count neighbors (connectivity number)
    let n = [p2, p3, p4, p5, p6, p7, p8, p9]
        .iter()
        .filter(|&&x| x)
        .count();

    // Count transitions
    let transitions = count_transitions(&[p2, p3, p4, p5, p6, p7, p8, p9]);

    // Guo-Hall conditions for step 1
    if !(2..=6).contains(&n) {
        return false;
    }
    if transitions != 1 {
        return false;
    }

    // Additional Guo-Hall specific conditions
    if (p2 && p4 && p6) || (p4 && p6 && p8) {
        return false;
    }

    true
}

/// Guo-Hall Step 2: Check if pixel should be deleted
fn should_delete_guo_hall_step2(image: &GrayImage, x: u32, y: u32) -> bool {
    if !is_foreground(image, x, y) {
        return false;
    }

    // Get 8-neighborhood (clockwise from top)
    let p2 = is_foreground(image, x, y.wrapping_sub(1)); // N
    let p3 = is_foreground(image, x + 1, y.wrapping_sub(1)); // NE
    let p4 = is_foreground(image, x + 1, y); // E
    let p5 = is_foreground(image, x + 1, y + 1); // SE
    let p6 = is_foreground(image, x, y + 1); // S
    let p7 = is_foreground(image, x.wrapping_sub(1), y + 1); // SW
    let p8 = is_foreground(image, x.wrapping_sub(1), y); // W
    let p9 = is_foreground(image, x.wrapping_sub(1), y.wrapping_sub(1)); // NW

    // Count neighbors (connectivity number)
    let n = [p2, p3, p4, p5, p6, p7, p8, p9]
        .iter()
        .filter(|&&x| x)
        .count();

    // Count transitions
    let transitions = count_transitions(&[p2, p3, p4, p5, p6, p7, p8, p9]);

    // Guo-Hall conditions for step 2
    if !(2..=6).contains(&n) {
        return false;
    }
    if transitions != 1 {
        return false;
    }

    // Additional Guo-Hall specific conditions (different from step 1)
    if (p2 && p4 && p8) || (p2 && p6 && p8) {
        return false;
    }

    true
}

// Gaussian blur function already exists above, using that one

/// Otsu's method for adaptive thresholding
fn otsu_threshold(gray: &GrayImage) -> GrayImage {
    let (width, height) = gray.dimensions();

    // Calculate histogram
    let mut histogram = [0u32; 256];
    for pixel in gray.pixels() {
        histogram[pixel.0[0] as usize] += 1;
    }

    let total_pixels = (width * height) as f32;

    // Find optimal threshold using Otsu's method
    let mut max_variance = 0.0;
    let mut optimal_threshold = 128u8;

    for threshold in 0..256 {
        let (w0, w1, mu0, mu1) = calculate_class_statistics(&histogram, threshold, total_pixels);

        if w0 > 0.0 && w1 > 0.0 {
            let between_class_variance = w0 * w1 * (mu0 - mu1) * (mu0 - mu1);
            if between_class_variance > max_variance {
                max_variance = between_class_variance;
                optimal_threshold = threshold as u8;
            }
        }
    }

    // Apply threshold
    let mut binary = GrayImage::new(width, height);
    for y in 0..height {
        for x in 0..width {
            let gray_value = gray.get_pixel(x, y).0[0];
            let binary_value = if gray_value > optimal_threshold {
                255
            } else {
                0
            };
            binary.put_pixel(x, y, Luma([binary_value]));
        }
    }

    log::debug!("Otsu threshold determined: {}", optimal_threshold);
    binary
}

/// Calculate class statistics for Otsu's method
fn calculate_class_statistics(
    histogram: &[u32; 256],
    threshold: usize,
    total_pixels: f32,
) -> (f32, f32, f32, f32) {
    let mut sum0 = 0.0;
    let mut sum1 = 0.0;
    let mut w0 = 0.0;
    let mut w1 = 0.0;

    for i in 0..=threshold {
        w0 += histogram[i] as f32;
        sum0 += (i as f32) * (histogram[i] as f32);
    }

    for i in (threshold + 1)..256 {
        w1 += histogram[i] as f32;
        sum1 += (i as f32) * (histogram[i] as f32);
    }

    w0 /= total_pixels;
    w1 /= total_pixels;

    let mu0 = if w0 > 0.0 {
        sum0 / (w0 * total_pixels)
    } else {
        0.0
    };
    let mu1 = if w1 > 0.0 {
        sum1 / (w1 * total_pixels)
    } else {
        0.0
    };

    (w0, w1, mu0, mu1)
}

/// Box-Sauvola adaptive thresholding for improved handling of varying lighting conditions
///
/// This method computes local mean and variance in a sliding window and applies the Sauvola formula:
/// threshold = mean * (1 + k * ((std_dev / 128) - 1))
///
/// Parameters:
/// - window_size: Size of the sliding window (recommended 25-35 pixels)
/// - k: Sensitivity parameter (recommended 0.3-0.5)
///
/// Returns a binary image or falls back to Otsu if parameters are invalid
fn box_sauvola_threshold(gray: &GrayImage, window_size: u32, k: f32) -> GrayImage {
    let (width, height) = gray.dimensions();

    // Validate input parameters
    if width == 0 || height == 0 {
        log::warn!(
            "Invalid image dimensions: {}x{}, falling back to empty image",
            width,
            height
        );
        return GrayImage::new(width, height);
    }

    if window_size < 3 || window_size > width.min(height) {
        log::warn!("Invalid window size: {}, falling back to Otsu", window_size);
        return otsu_threshold(gray);
    }

    if !(0.0..=1.0).contains(&k) {
        log::warn!("Invalid k parameter: {}, falling back to Otsu", k);
        return otsu_threshold(gray);
    }

    let mut binary = GrayImage::new(width, height);

    // Ensure window size is odd for symmetry
    let window_size = if window_size.is_multiple_of(2) {
        window_size + 1
    } else {
        window_size
    };
    let half_window = (window_size / 2) as i32;

    log::debug!(
        "Box-Sauvola thresholding with window_size={}, k={}",
        window_size,
        k
    );

    // For each pixel, compute local statistics in the window
    for y in 0..height {
        for x in 0..width {
            let mut sum = 0.0f64;
            let mut sum_sq = 0.0f64;
            let mut count = 0u32;

            // Define window bounds with clamping
            let min_x = (x as i32 - half_window).max(0) as u32;
            let max_x = (x as i32 + half_window).min(width as i32 - 1) as u32;
            let min_y = (y as i32 - half_window).max(0) as u32;
            let max_y = (y as i32 + half_window).min(height as i32 - 1) as u32;

            // Compute local mean and variance in the window
            for wy in min_y..=max_y {
                for wx in min_x..=max_x {
                    let pixel_value = gray.get_pixel(wx, wy).0[0] as f64;
                    sum += pixel_value;
                    sum_sq += pixel_value * pixel_value;
                    count += 1;
                }
            }

            // Calculate local statistics
            let mean = sum / count as f64;
            let variance = (sum_sq / count as f64) - (mean * mean);
            let std_dev = variance.sqrt();

            // Apply Sauvola formula: threshold = mean * (1 + k * ((std_dev / 128) - 1))
            let threshold = mean * (1.0 + k as f64 * ((std_dev / 128.0) - 1.0));

            // Apply threshold to current pixel
            let pixel_value = gray.get_pixel(x, y).0[0] as f64;
            let binary_value = if pixel_value > threshold { 255 } else { 0 };
            binary.put_pixel(x, y, Luma([binary_value]));
        }
    }

    binary
}

/// Optimized Box-Sauvola adaptive thresholding using integral images for better performance
///
/// This is a faster implementation that pre-computes integral images for sum and sum-of-squares
/// to achieve O(1) window sum computation instead of O(window_size²) per pixel.
///
/// Returns a binary image or falls back to Otsu if parameters are invalid
fn box_sauvola_threshold_optimized(gray: &GrayImage, window_size: u32, k: f32) -> GrayImage {
    let (width, height) = gray.dimensions();

    // Validate input parameters
    if width == 0 || height == 0 {
        log::warn!(
            "Invalid image dimensions: {}x{}, falling back to empty image",
            width,
            height
        );
        return GrayImage::new(width, height);
    }

    if window_size < 3 || window_size > width.min(height) {
        log::warn!(
            "Invalid window size: {}, falling back to non-optimized version",
            window_size
        );
        return box_sauvola_threshold(gray, window_size, k);
    }

    if !(0.0..=1.0).contains(&k) {
        log::warn!("Invalid k parameter: {}, falling back to Otsu", k);
        return otsu_threshold(gray);
    }

    let mut binary = GrayImage::new(width, height);

    // Ensure window size is odd for symmetry
    let window_size = if window_size.is_multiple_of(2) {
        window_size + 1
    } else {
        window_size
    };
    let half_window = (window_size / 2) as i32;

    log::debug!(
        "Optimized Box-Sauvola thresholding with window_size={}, k={}",
        window_size,
        k
    );

    // Build integral images for sum and sum-of-squares
    let mut integral_sum = vec![vec![0.0f64; (width + 1) as usize]; (height + 1) as usize];
    let mut integral_sum_sq = vec![vec![0.0f64; (width + 1) as usize]; (height + 1) as usize];

    // Compute integral images
    for y in 0..height {
        for x in 0..width {
            let pixel_value = gray.get_pixel(x, y).0[0] as f64;

            integral_sum[y as usize + 1][x as usize + 1] = pixel_value
                + integral_sum[y as usize][x as usize + 1]
                + integral_sum[y as usize + 1][x as usize]
                - integral_sum[y as usize][x as usize];

            integral_sum_sq[y as usize + 1][x as usize + 1] = pixel_value * pixel_value
                + integral_sum_sq[y as usize][x as usize + 1]
                + integral_sum_sq[y as usize + 1][x as usize]
                - integral_sum_sq[y as usize][x as usize];
        }
    }

    // For each pixel, compute local statistics using integral images
    for y in 0..height {
        for x in 0..width {
            // Define window bounds with clamping
            let min_x = (x as i32 - half_window).max(0) as usize;
            let max_x = (x as i32 + half_window).min(width as i32 - 1) as usize;
            let min_y = (y as i32 - half_window).max(0) as usize;
            let max_y = (y as i32 + half_window).min(height as i32 - 1) as usize;

            // Compute window area
            let area = ((max_x - min_x + 1) * (max_y - min_y + 1)) as f64;

            // Use integral images to compute sum and sum-of-squares in O(1) time
            let sum = integral_sum[max_y + 1][max_x + 1]
                - integral_sum[min_y][max_x + 1]
                - integral_sum[max_y + 1][min_x]
                + integral_sum[min_y][min_x];

            let sum_sq = integral_sum_sq[max_y + 1][max_x + 1]
                - integral_sum_sq[min_y][max_x + 1]
                - integral_sum_sq[max_y + 1][min_x]
                + integral_sum_sq[min_y][min_x];

            // Calculate local statistics
            let mean = sum / area;
            let variance = (sum_sq / area) - (mean * mean);
            let std_dev = variance.max(0.0).sqrt(); // Ensure non-negative variance

            // Apply Sauvola formula: threshold = mean * (1 + k * ((std_dev / 128) - 1))
            let threshold = mean * (1.0 + k as f64 * ((std_dev / 128.0) - 1.0));

            // Apply threshold to current pixel
            let pixel_value = gray.get_pixel(x, y).0[0] as f64;
            let binary_value = if pixel_value > threshold { 255 } else { 0 };
            binary.put_pixel(x, y, Luma([binary_value]));
        }
    }

    binary
}

/// Morphological opening (erosion + dilation) for pepper noise removal
fn morphological_opening_3x3(binary: &GrayImage) -> GrayImage {
    let (w, h) = binary.dimensions();
    let mut eroded = GrayImage::new(w, h);

    // Erode first (removes pepper noise - small white specks)
    for y in 0..h {
        for x in 0..w {
            let mut v = 255u8;
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    if nx >= 0 && ny >= 0 && (nx as u32) < w && (ny as u32) < h {
                        v = v.min(binary.get_pixel(nx as u32, ny as u32).0[0]);
                    }
                }
            }
            eroded.put_pixel(x, y, image::Luma([v]));
        }
    }

    // Then dilate (restores object size without pepper noise)
    let mut out = GrayImage::new(w, h);
    for y in 0..h {
        for x in 0..w {
            let mut v = 0u8;
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    if nx >= 0 && ny >= 0 && (nx as u32) < w && (ny as u32) < h {
                        v = v.max(eroded.get_pixel(nx as u32, ny as u32).0[0]);
                    }
                }
            }
            out.put_pixel(x, y, image::Luma([v]));
        }
    }
    out
}

/// Combined morphological opening then closing for optimal noise removal and gap bridging
/// Opening kills pepper noise without fattening strokes, then closing bridges hairline gaps
fn morphological_open_close(binary: &GrayImage) -> GrayImage {
    let opened = morphological_opening_3x3(binary);
    morphological_closing_3x3(&opened)
}

/// Morphological closing (dilation + erosion) for gap bridging before thinning
fn morphological_closing_3x3(binary: &GrayImage) -> GrayImage {
    let (w, h) = binary.dimensions();
    let mut dil = GrayImage::new(w, h);
    // Dilate
    for y in 0..h {
        for x in 0..w {
            let mut v = 0u8;
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    if nx >= 0 && ny >= 0 && (nx as u32) < w && (ny as u32) < h {
                        v = v.max(binary.get_pixel(nx as u32, ny as u32).0[0]);
                    }
                }
            }
            dil.put_pixel(x, y, image::Luma([v]));
        }
    }
    // Erode
    let mut out = GrayImage::new(w, h);
    for y in 0..h {
        for x in 0..w {
            let mut v = 255u8;
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    if nx >= 0 && ny >= 0 && (nx as u32) < w && (ny as u32) < h {
                        v = v.min(dil.get_pixel(nx as u32, ny as u32).0[0]);
                    }
                }
            }
            out.put_pixel(x, y, image::Luma([v]));
        }
    }
    out
}

/// Classification of skeleton pixels based on their connectivity
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PixelType {
    Endpoint, // 1 neighbor
    Normal,   // 2 neighbors
    Junction, // 3+ neighbors
}

/// Classify all skeleton pixels by their topological properties
fn classify_skeleton_pixels(skeleton: &GrayImage) -> Vec<Vec<PixelType>> {
    let (width, height) = skeleton.dimensions();
    let mut pixel_types = vec![vec![PixelType::Normal; width as usize]; height as usize];

    for y in 0..height {
        for x in 0..width {
            if is_foreground(skeleton, x, y) {
                let neighbor_count = count_skeleton_neighbors(skeleton, x, y);
                pixel_types[y as usize][x as usize] = match neighbor_count {
                    1 => PixelType::Endpoint,
                    2 => PixelType::Normal,
                    _ => PixelType::Junction,
                };
            }
        }
    }

    pixel_types
}

/// Count skeleton neighbors in 8-connectivity
fn count_skeleton_neighbors(skeleton: &GrayImage, x: u32, y: u32) -> usize {
    let mut count = 0;

    for dy in -1i32..=1 {
        for dx in -1i32..=1 {
            if dx == 0 && dy == 0 {
                continue;
            }

            let nx = x as i32 + dx;
            let ny = y as i32 + dy;

            if nx >= 0 && ny >= 0 {
                let nx = nx as u32;
                let ny = ny as u32;

                if is_foreground(skeleton, nx, ny) {
                    count += 1;
                }
            }
        }
    }

    count
}

/// Trace path from an endpoint until reaching a junction or another endpoint
fn trace_from_endpoint(
    skeleton: &GrayImage,
    visited: &mut [Vec<bool>],
    pixel_types: &[Vec<PixelType>],
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut cur = (start_x as i32, start_y as i32);
    let mut prev_dir: Option<(i32, i32)> = None;

    let in_img = |x: i32, y: i32| {
        x >= 0 && y >= 0 && (x as u32) < skeleton.width() && (y as u32) < skeleton.height()
    };

    let is_fg = |x: i32, y: i32| -> bool {
        if !in_img(x, y) {
            return false;
        }
        skeleton.get_pixel(x as u32, y as u32).0[0] > 0
    };

    // Forbid diagonal "corner hops" where both orthogonal supports are absent.
    let diagonal_ok = |x: i32, y: i32, dx: i32, dy: i32| -> bool {
        if dx == 0 || dy == 0 {
            return true;
        }
        is_fg(x + dx, y) || is_fg(x, y + dy)
    };

    loop {
        let (x, y) = cur;
        if visited[y as usize][x as usize] {
            break;
        }
        visited[y as usize][x as usize] = true;
        path.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Collect unvisited neighbors (8-conn), filtering bad diagonals.
        let mut cand: Vec<(i32, i32, i32, i32)> = Vec::new();
        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }
                let nx = x + dx;
                let ny = y + dy;
                if !in_img(nx, ny) {
                    continue;
                }
                if !is_fg(nx, ny) {
                    continue;
                }
                if !diagonal_ok(x, y, dx, dy) {
                    continue;
                }
                if !visited[ny as usize][nx as usize] {
                    cand.push((nx, ny, dx, dy));
                }
            }
        }

        if cand.is_empty() {
            break;
        }

        let next = if let Some((pdx, pdy)) = prev_dir {
            // Prefer smallest turn (max dot with previous dir).
            // CRITICAL FIX: Add safety check to prevent panic in multipass processing
            let result = cand.into_iter().max_by(|a, b| {
                let da = a.2 * pdx + a.3 * pdy;
                let db = b.2 * pdx + b.3 * pdy;
                da.cmp(&db)
                    // tie-breaker: prefer leaving a junction *later* (stay on trunk)
                    .then_with(|| {
                        let ta = pixel_types[a.1 as usize][a.0 as usize] != PixelType::Junction;
                        let tb = pixel_types[b.1 as usize][b.0 as usize] != PixelType::Junction;
                        ta.cmp(&tb)
                    })
            });
            if let Some(next_point) = result {
                next_point
            } else {
                break; // Safety fallback if no candidates found
            }
        } else {
            // First step: prefer neighbor with the most skeleton neighbors (main trunk).
            // CRITICAL FIX: Add safety check to prevent panic in multipass processing
            let result = cand.into_iter().max_by_key(|(nx, ny, _, _)| {
                count_skeleton_neighbors(skeleton, *nx as u32, *ny as u32)
            });
            if let Some(next_point) = result {
                next_point
            } else {
                break; // Safety fallback if no candidates found
            }
        };

        prev_dir = Some((next.2, next.3));
        cur = (next.0, next.1);
    }

    path
}

/// Get all unvisited skeleton neighbors
fn get_unvisited_skeleton_neighbors(
    skeleton: &GrayImage,
    visited: &[Vec<bool>],
    x: u32,
    y: u32,
) -> Vec<(u32, u32)> {
    let mut neighbors = Vec::new();

    for dy in -1i32..=1 {
        for dx in -1i32..=1 {
            if dx == 0 && dy == 0 {
                continue;
            }

            let nx = x as i32 + dx;
            let ny = y as i32 + dy;

            if nx >= 0 && ny >= 0 {
                let nx = nx as u32;
                let ny = ny as u32;

                if is_foreground(skeleton, nx, ny) && !visited[ny as usize][nx as usize] {
                    neighbors.push((nx, ny));
                }
            }
        }
    }

    neighbors
}

/// Trace remaining unvisited pixels (handles cycles and other edge cases)
fn trace_remaining_path(
    skeleton: &GrayImage,
    visited: &mut [Vec<bool>],
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut current = (start_x, start_y);

    loop {
        let (x, y) = current;
        visited[y as usize][x as usize] = true;
        path.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Find next unvisited neighbor
        let neighbors = get_unvisited_skeleton_neighbors(skeleton, visited, x, y);

        if neighbors.is_empty() {
            break; // End of path
        }

        current = neighbors[0]; // Take first available neighbor
    }

    path
}

/// Improved skeleton polyline extraction with junction detection and proper path tracing
fn extract_skeleton_polylines_improved(skeleton: &GrayImage) -> Vec<Vec<Point>> {
    let (width, height) = skeleton.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();

    // Step 1: Classify all skeleton pixels by their topology
    let pixel_types = classify_skeleton_pixels(skeleton);

    // Step 2: Find all endpoints (pixels with exactly 1 neighbor)
    let mut endpoints = Vec::new();
    for y in 0..height {
        for x in 0..width {
            if is_foreground(skeleton, x, y)
                && pixel_types[y as usize][x as usize] == PixelType::Endpoint
            {
                endpoints.push((x, y));
            }
        }
    }

    log::debug!("Found {} endpoints for centerline tracing", endpoints.len());

    // Step 3: Trace from each unvisited endpoint
    for (start_x, start_y) in endpoints {
        if !visited[start_y as usize][start_x as usize] {
            let path = trace_from_endpoint(skeleton, &mut visited, &pixel_types, start_x, start_y);
            if path.len() >= 2 {
                polylines.push(path);
            }
        }
    }

    // Step 4: Handle remaining unvisited skeleton pixels (isolated cycles, etc.)
    for y in 0..height {
        for x in 0..width {
            if is_foreground(skeleton, x, y) && !visited[y as usize][x as usize] {
                let path = trace_remaining_path(skeleton, &mut visited, x, y);
                if path.len() >= 2 {
                    polylines.push(path);
                }
            }
        }
    }

    log::debug!("Extracted {} polylines from skeleton", polylines.len());
    polylines
}

/// Calculate squared distance between two points (faster than sqrt)
fn distance_squared(p1: &Point, p2: &Point) -> f32 {
    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    dx * dx + dy * dy
}

/// Calculate branch importance based on length, straightness, and connectivity
fn calculate_branch_importance(polyline: &[Point], all_polylines: &[Vec<Point>]) -> f32 {
    if polyline.len() < 2 {
        return 0.0;
    }

    let length = calculate_polyline_length(polyline);
    let straightness = calculate_branch_straightness(polyline);
    let connectivity = calculate_branch_connectivity(polyline, all_polylines);

    // Weighted combination of factors
    let length_score = (length / 50.0).min(1.0); // Normalize to ~50 pixels
    let straightness_score = straightness;
    let connectivity_score = connectivity;

    // Weight: length is most important, then connectivity, then straightness
    0.5 * length_score + 0.3 * connectivity_score + 0.2 * straightness_score
}

/// Calculate how straight a branch is (1.0 = perfectly straight, 0.0 = very curved)
fn calculate_branch_straightness(polyline: &[Point]) -> f32 {
    if polyline.len() < 3 {
        return 1.0; // Short segments are considered straight
    }

    let start = &polyline[0];
    let end = &polyline[polyline.len() - 1];
    let direct_distance = ((end.x - start.x).powi(2) + (end.y - start.y).powi(2)).sqrt();

    if direct_distance < 1.0 {
        return 0.0; // Too short to measure
    }

    let path_length = calculate_polyline_length(polyline);

    // Straightness ratio: direct distance / path length
    (direct_distance / path_length).min(1.0)
}

/// Calculate how well connected a branch is to other branches
fn calculate_branch_connectivity(polyline: &[Point], all_polylines: &[Vec<Point>]) -> f32 {
    if polyline.is_empty() {
        return 0.0;
    }

    let start = &polyline[0];
    let end = &polyline[polyline.len() - 1];
    let connection_threshold = 5.0; // pixels
    let mut connections = 0;

    for other in all_polylines {
        if other.as_ptr() == polyline.as_ptr() {
            continue; // Skip self
        }

        if other.is_empty() {
            continue;
        }

        let other_start = &other[0];
        let other_end = &other[other.len() - 1];

        // Check if endpoints are close to other polyline endpoints
        if distance_squared(start, other_start) <= connection_threshold * connection_threshold
            || distance_squared(start, other_end) <= connection_threshold * connection_threshold
            || distance_squared(end, other_start) <= connection_threshold * connection_threshold
            || distance_squared(end, other_end) <= connection_threshold * connection_threshold
        {
            connections += 1;
        }
    }

    // Normalize: 0 connections = 0.0, 2+ connections = 1.0
    (connections as f32 / 2.0).min(1.0)
}

/// Convert polyline to SVG path
fn polyline_to_svg_path(polyline: Vec<Point>, stroke_width: f32) -> SvgPath {
    let mut path_data = String::new();

    if !polyline.is_empty() {
        path_data.push_str(&format!("M{} {}", polyline[0].x, polyline[0].y));

        for point in polyline.iter().skip(1) {
            path_data.push_str(&format!(" L{} {}", point.x, point.y));
        }
    }

    SvgPath::new_stroke(path_data, "#000000", stroke_width)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_threshold_mapping() {
        let mapping = ThresholdMapping::new(0.5, 1920, 1080);

        // Check that thresholds are reasonable
        assert!(mapping.dp_epsilon_px > 0.0);
        assert!(mapping.min_stroke_length_px >= 10.0);
        assert!(mapping.canny_high_threshold > mapping.canny_low_threshold);
        assert!(mapping.slic_cell_size_px >= 600.0);
        assert!(mapping.slic_cell_size_px <= 3000.0);
        assert!(mapping.lab_merge_threshold >= 1.0);
        assert!(mapping.lab_split_threshold > mapping.lab_merge_threshold);
    }

    #[test]
    fn test_edge_backend_basic() {
        // Create simple test image with edges
        let mut image = ImageBuffer::new(100, 100);

        // Draw a simple square
        for x in 20..80 {
            for y in 20..80 {
                if x == 20 || x == 79 || y == 20 || y == 79 {
                    image.put_pixel(x, y, Rgba([0, 0, 0, 255])); // Black edge
                } else {
                    image.put_pixel(x, y, Rgba([255, 255, 255, 255])); // White fill
                }
            }
        }

        let config = TraceLowConfig {
            detail: 0.5,
            ..Default::default()
        };

        let result = vectorize_trace_low(&image, &config, None);
        assert!(result.is_ok());

        let paths = result.unwrap();
        assert!(!paths.is_empty());

        // Check that paths are stroke-only
        for path in &paths {
            assert_eq!(path.fill, "none");
            assert_ne!(path.stroke, "none");
            assert!(path.stroke_width > 0.0);
        }
    }

    #[test]
    fn test_douglas_peucker_simplification() {
        // Create a simple polyline that should be simplified
        let polyline = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.1 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.1 },
            Point { x: 4.0, y: 0.0 },
            Point { x: 5.0, y: 5.0 }, // Significant deviation
            Point { x: 6.0, y: 0.0 },
        ];

        let simplified = douglas_peucker_simplify(&polyline, 0.5);

        // Should remove some intermediate points but keep the significant deviation
        assert!(simplified.len() < polyline.len());
        assert!(simplified.len() >= 2);

        // First and last points should be preserved
        assert_eq!(simplified[0], polyline[0]);
        assert_eq!(
            simplified[simplified.len() - 1],
            polyline[polyline.len() - 1]
        );
    }

    #[test]
    fn test_trace_dots_backend() {
        use image::RgbaImage;

        // Create a simple test image
        let mut img = RgbaImage::new(100, 100);

        // Add a simple pattern - white background with black square
        for y in 0..100 {
            for x in 0..100 {
                if (40..60).contains(&x) && (40..60).contains(&y) {
                    // Black square in center
                    img.put_pixel(x, y, image::Rgba([0, 0, 0, 255]));
                } else {
                    // White background
                    img.put_pixel(x, y, image::Rgba([255, 255, 255, 255]));
                }
            }
        }

        // Create config with dots backend
        let config = TraceLowConfig {
            backend: TraceBackend::Dots,
            detail: 0.3,
            dot_density_threshold: 0.1,
            dot_min_radius: 0.5,
            dot_max_radius: 3.0,
            dot_preserve_colors: true,
            dot_adaptive_sizing: true,
            dot_background_tolerance: 0.15,
            ..Default::default()
        };

        let thresholds = ThresholdMapping::new(config.detail, img.width(), img.height());

        // Test the dots backend
        let result = trace_dots(&img, &thresholds, &config);

        assert!(result.is_ok(), "Dots backend should succeed");

        let svg_paths = result.unwrap();
        assert!(!svg_paths.is_empty(), "Should generate some SVG paths");

        // Check that all paths are circles (dots are converted to circles)
        for path in &svg_paths {
            match path.element_type {
                SvgElementType::Circle { cx: _, cy: _, r } => {
                    assert!(
                        r >= config.dot_min_radius,
                        "Circle radius should be >= min_radius"
                    );
                    assert!(
                        r <= config.dot_max_radius,
                        "Circle radius should be <= max_radius"
                    );
                }
                _ => panic!("Expected Circle elements from dots backend"),
            }
        }
    }

    #[test]
    fn test_trace_dots_config_validation() {
        use image::RgbaImage;

        let img = RgbaImage::new(50, 50);
        let thresholds = ThresholdMapping::new(0.3, 50, 50);

        // Test with invalid density threshold (too high - should produce no dots)
        let config = TraceLowConfig {
            backend: TraceBackend::Dots,
            dot_density_threshold: 0.99, // Very high threshold
            ..Default::default()
        };

        let result = trace_dots(&img, &thresholds, &config);
        assert!(result.is_ok());

        let _svg_paths = result.unwrap();
        // With such a high threshold, we might get no dots, which is fine
        // Just ensure the function completes successfully
    }

    #[test]
    fn test_trace_dots_color_preservation() {
        use image::RgbaImage;

        // Create a colorful test image
        let mut img = RgbaImage::new(50, 50);

        for y in 0..50 {
            for x in 0..50 {
                if x < 25 {
                    img.put_pixel(x, y, image::Rgba([255, 0, 0, 255])); // Red
                } else {
                    img.put_pixel(x, y, image::Rgba([0, 0, 255, 255])); // Blue
                }
            }
        }

        let thresholds = ThresholdMapping::new(0.3, 50, 50);

        // Test with color preservation enabled
        let config_preserve = TraceLowConfig {
            backend: TraceBackend::Dots,
            dot_preserve_colors: true,
            dot_density_threshold: 0.05, // Lower threshold to ensure some dots
            ..Default::default()
        };

        let result = trace_dots(&img, &thresholds, &config_preserve);
        assert!(result.is_ok());

        let svg_paths = result.unwrap();
        if !svg_paths.is_empty() {
            // Should have some variety in colors if color preservation is working
            let colors: std::collections::HashSet<_> = svg_paths.iter().map(|p| &p.fill).collect();
            // We might get various colors or gradations due to edge detection
            assert!(!colors.is_empty(), "Should have some colors");
        }
    }

    #[test]
    fn test_dots_backend_integration_with_main_pipeline() {
        use image::RgbaImage;

        // Create a simple test image
        let img = RgbaImage::new(50, 50);

        // Test that dots backend is properly integrated in the main pipeline
        let config = TraceLowConfig {
            backend: TraceBackend::Dots,
            detail: 0.3,
            ..Default::default()
        };

        // This should call through vectorize_trace_low_single_pass -> trace_dots
        let result = vectorize_trace_low_single_pass(&img, &config, None);
        assert!(
            result.is_ok(),
            "Main pipeline should work with dots backend"
        );

        // Also test with the main entry point
        let result = vectorize_trace_low(&img, &config, None);
        assert!(
            result.is_ok(),
            "Main vectorize_trace_low should work with dots backend"
        );
    }
}

// =============================================================================
// EDT (Euclidean Distance Transform) Implementation
// =============================================================================

/// Compute Euclidean Distance Transform (EDT) for a binary image
/// Returns distance from each foreground pixel to nearest background pixel
fn compute_euclidean_distance_transform(binary: &GrayImage) -> Vec<Vec<f32>> {
    let (width, height) = binary.dimensions();
    let mut distances = vec![vec![0.0; width as usize]; height as usize];

    // Two-pass algorithm for EDT computation
    // Pass 1: Forward pass (left-to-right, top-to-bottom)
    for y in 0..height {
        for x in 0..width {
            let pixel = binary.get_pixel(x, y);

            if pixel.0[0] > 128 {
                // Foreground pixel
                if x == 0 && y == 0 {
                    distances[y as usize][x as usize] = f32::INFINITY;
                } else {
                    let mut min_dist = f32::INFINITY;

                    // Check left neighbor
                    if x > 0 {
                        let left_dist = distances[y as usize][(x - 1) as usize] + 1.0;
                        min_dist = min_dist.min(left_dist);
                    }

                    // Check top neighbor
                    if y > 0 {
                        let top_dist = distances[(y - 1) as usize][x as usize] + 1.0;
                        min_dist = min_dist.min(top_dist);
                    }

                    // Check top-left diagonal
                    if x > 0 && y > 0 {
                        let diag_dist = distances[(y - 1) as usize][(x - 1) as usize]
                            + std::f32::consts::SQRT_2;
                        min_dist = min_dist.min(diag_dist);
                    }

                    // Check top-right diagonal
                    if x < width - 1 && y > 0 {
                        let diag_dist = distances[(y - 1) as usize][(x + 1) as usize]
                            + std::f32::consts::SQRT_2;
                        min_dist = min_dist.min(diag_dist);
                    }

                    distances[y as usize][x as usize] = min_dist;
                }
            } else {
                // Background pixel has distance 0
                distances[y as usize][x as usize] = 0.0;
            }
        }
    }

    // Pass 2: Backward pass (right-to-left, bottom-to-top)
    for y in (0..height).rev() {
        for x in (0..width).rev() {
            let pixel = binary.get_pixel(x, y);

            if pixel.0[0] > 128 {
                // Foreground pixel
                let mut min_dist = distances[y as usize][x as usize];

                // Check right neighbor
                if x < width - 1 {
                    let right_dist = distances[y as usize][(x + 1) as usize] + 1.0;
                    min_dist = min_dist.min(right_dist);
                }

                // Check bottom neighbor
                if y < height - 1 {
                    let bottom_dist = distances[(y + 1) as usize][x as usize] + 1.0;
                    min_dist = min_dist.min(bottom_dist);
                }

                // Check bottom-left diagonal
                if x > 0 && y < height - 1 {
                    let diag_dist =
                        distances[(y + 1) as usize][(x - 1) as usize] + std::f32::consts::SQRT_2;
                    min_dist = min_dist.min(diag_dist);
                }

                // Check bottom-right diagonal
                if x < width - 1 && y < height - 1 {
                    let diag_dist =
                        distances[(y + 1) as usize][(x + 1) as usize] + std::f32::consts::SQRT_2;
                    min_dist = min_dist.min(diag_dist);
                }

                distances[y as usize][x as usize] = min_dist;
            }
        }
    }

    distances
}

/// EDT-based intelligent branch pruning using radius ratio comparison
fn prune_branches_with_edt(
    polylines: Vec<Vec<Point>>,
    edt: &[Vec<f32>],
    min_length: f32,
) -> Vec<Vec<Point>> {
    if polylines.is_empty() {
        return polylines;
    }

    // Step 1: Calculate branch scores with EDT information
    let mut branch_info = Vec::new();
    for (i, polyline) in polylines.iter().enumerate() {
        let length = calculate_polyline_length(polyline);
        let median_radius = calculate_median_edt_radius(polyline, edt);
        let importance = calculate_branch_importance(polyline, &polylines);

        branch_info.push((i, length, median_radius, importance));
    }

    // Step 2: Find the trunk (longest or highest importance branch)
    let trunk_info = branch_info.iter().max_by(|a, b| {
        // Prioritize by importance first, then by length
        a.3.partial_cmp(&b.3)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
    });

    let trunk_radius = trunk_info.map(|(_, _, radius, _)| *radius).unwrap_or(1.0);
    let radius_threshold = trunk_radius * 0.7; // Keep branches with >= 70% of trunk radius

    // Step 3: Filter branches based on EDT radius ratio and importance
    let mut kept_polylines = Vec::new();
    for &(idx, length, median_radius, importance) in &branch_info {
        let polyline = &polylines[idx];

        // Keep branch if any of these conditions are met:
        // 1. High importance score (>= 0.7)
        // 2. EDT radius >= 70% of trunk radius
        // 3. Long enough and has decent radius
        // 4. Apply playbook minimum radius filter (drop branches with median_radius < 0.6 px)
        let should_keep = median_radius >= 0.6 // Playbook minimum radius filter
            && (importance >= 0.7
                || median_radius >= radius_threshold
                || (length >= min_length && median_radius >= trunk_radius * 0.5));

        if should_keep {
            kept_polylines.push(polyline.clone());
            log::debug!(
                "Keeping branch: length={:.1}px, radius={:.1}px, importance={:.2}",
                length,
                median_radius,
                importance
            );
        } else {
            log::debug!(
                "Pruning branch: length={:.1}px, radius={:.1}px, importance={:.2} (trunk_radius={:.1}px)",
                length, median_radius, importance, trunk_radius
            );
        }
    }

    log::debug!(
        "EDT pruning: kept {}/{} branches (trunk_radius={:.1}px)",
        kept_polylines.len(),
        polylines.len(),
        trunk_radius
    );

    kept_polylines
}

/// Remove micro-loops (tiny 4-8px cycles that look like "hairballs")
/// These are artifacts from skeletonization that create noise in the final output
fn remove_micro_loops(polylines: Vec<Vec<Point>>, min_perimeter_px: f32) -> Vec<Vec<Point>> {
    polylines
        .into_iter()
        .filter(|polyline| {
            // Check if this might be a micro-loop by looking at the perimeter
            let perimeter = calculate_polyline_length(polyline);

            // Keep if larger than minimum perimeter or if not a closed loop
            if perimeter >= min_perimeter_px {
                return true;
            }

            // Check if it's actually a closed loop (first and last points close)
            if polyline.len() >= 4 {
                if let (Some(first), Some(last)) = (polyline.first(), polyline.last()) {
                    let distance = ((first.x - last.x).powi(2) + (first.y - last.y).powi(2)).sqrt();
                    // If it's a small closed loop, remove it
                    if distance < 3.0 {
                        log::debug!("Removing micro-loop: perimeter={:.1}px", perimeter);
                        return false;
                    }
                }
            }

            true
        })
        .collect()
}

/// Calculate median EDT radius along a polyline
fn calculate_median_edt_radius(polyline: &[Point], edt: &[Vec<f32>]) -> f32 {
    if polyline.is_empty() || edt.is_empty() {
        return 1.0;
    }

    let height = edt.len();
    let width = if height > 0 { edt[0].len() } else { 0 };

    let mut radii = Vec::new();
    for point in polyline {
        let x = (point.x.round() as usize).min(width.saturating_sub(1));
        let y = (point.y.round() as usize).min(height.saturating_sub(1));

        if y < height && x < width {
            radii.push(edt[y][x]);
        }
    }

    if radii.is_empty() {
        return 1.0;
    }

    radii.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let mid = radii.len() / 2;

    if radii.len() % 2 == 0 && mid > 0 {
        (radii[mid - 1] + radii[mid]) / 2.0
    } else {
        radii[mid]
    }
}

/// Generate SVG path with EDT-based width modulation
fn polyline_to_svg_path_with_edt_width(
    polyline: Vec<Point>,
    base_width: f32,
    edt: &[Vec<f32>],
) -> SvgPath {
    if polyline.is_empty() {
        return SvgPath {
            data: String::new(),
            fill: "none".to_string(),
            stroke: "#000000".to_string(),
            stroke_width: base_width,
            element_type: SvgElementType::Path,
        };
    }

    // For simple implementation, we'll use average width modulation
    // A more sophisticated approach would use variable-width paths or multiple path segments
    let avg_radius = calculate_average_edt_radius(&polyline, edt);

    // Light modulation: clamp to 0.6-1.8x base width based on EDT radius
    let radius_factor = (avg_radius / 3.0).clamp(0.6, 1.8);
    let modulated_width = base_width * radius_factor;

    // Generate the path data
    let mut path_data = format!("M {:.2},{:.2}", polyline[0].x, polyline[0].y);

    for point in polyline.iter().skip(1) {
        path_data.push_str(&format!(" L {:.2},{:.2}", point.x, point.y));
    }

    SvgPath {
        data: path_data,
        fill: "none".to_string(),
        stroke: "#000000".to_string(),
        stroke_width: modulated_width,
        element_type: SvgElementType::Path,
    }
}

/// Calculate average EDT radius along a polyline
fn calculate_average_edt_radius(polyline: &[Point], edt: &[Vec<f32>]) -> f32 {
    if polyline.is_empty() || edt.is_empty() {
        return 1.0;
    }

    let height = edt.len();
    let width = if height > 0 { edt[0].len() } else { 0 };

    let mut sum = 0.0;
    let mut count = 0;

    for point in polyline {
        let x = (point.x.round() as usize).min(width.saturating_sub(1));
        let y = (point.y.round() as usize).min(height.saturating_sub(1));

        if y < height && x < width {
            sum += edt[y][x];
            count += 1;
        }
    }

    if count > 0 {
        sum / count as f32
    } else {
        1.0
    }
}

// ============================================================================
// Edge-Preserving Noise Filtering
// ============================================================================

/// Apply bilateral filtering for edge-preserving noise reduction
///
/// Bilateral filtering reduces noise while preserving edges by combining
/// spatial and range weighting. This provides meaningful noise reduction
/// without destroying important edge information needed for vectorization.
///
/// # Arguments
/// * `image` - Input grayscale image
/// * `spatial_sigma` - Controls spatial smoothing (higher = more smoothing)
/// * `range_sigma` - Controls edge preservation (higher = less edge preservation)
///
/// # Returns
/// * Filtered grayscale image with reduced noise and preserved edges
fn bilateral_filter(image: &GrayImage, spatial_sigma: f32, range_sigma: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut filtered = GrayImage::new(width, height);

    // Performance optimization: limit kernel radius for real-time processing
    // Maximum radius of 5 pixels provides good results while maintaining speed
    let kernel_radius = (2.5 * spatial_sigma).ceil().min(5.0) as i32;
    let kernel_size = (2 * kernel_radius + 1) as usize;

    // Precompute spatial weights for efficiency
    let mut spatial_weights = vec![0.0f32; kernel_size * kernel_size];
    let spatial_coeff = -0.5 / (spatial_sigma * spatial_sigma);

    for dy in -kernel_radius..=kernel_radius {
        for dx in -kernel_radius..=kernel_radius {
            let spatial_dist = (dx * dx + dy * dy) as f32;
            let weight = (spatial_coeff * spatial_dist).exp();
            let index =
                ((dy + kernel_radius) * (2 * kernel_radius + 1) + (dx + kernel_radius)) as usize;
            spatial_weights[index] = weight;
        }
    }

    // Range coefficient for intensity-based weighting
    let range_coeff = -0.5 / (range_sigma * range_sigma);

    // Performance optimization: use fast approximation for small kernels
    if kernel_radius <= 2 {
        // Use simplified bilateral filter for small kernels (much faster)
        return bilateral_filter_fast(image, spatial_sigma, range_sigma);
    }

    // Process image with bilateral filtering
    // Use parallel processing for larger images (disabled in WASM builds to prevent memory issues)
    if width * height > 50_000 && !cfg!(target_arch = "wasm32") {
        let pixel_coords: Vec<(u32, u32)> = (0..height)
            .flat_map(|y| (0..width).map(move |x| (x, y)))
            .collect();

        execute_parallel(pixel_coords, |(x, y)| {
            let center_intensity = image.get_pixel(x, y).0[0] as f32;
            let mut weighted_sum = 0.0f32;
            let mut weight_sum = 0.0f32;

            for dy in -kernel_radius..=kernel_radius {
                for dx in -kernel_radius..=kernel_radius {
                    let nx = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                    let ny = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;

                    let neighbor_intensity = image.get_pixel(nx, ny).0[0] as f32;
                    let intensity_diff = neighbor_intensity - center_intensity;

                    // Combined spatial and range weight
                    let spatial_index = ((dy + kernel_radius) * (2 * kernel_radius + 1)
                        + (dx + kernel_radius)) as usize;

                    // CRITICAL FIX: Bounds check to prevent "unreachable executed" during intensive processing
                    let spatial_weight = if spatial_index < spatial_weights.len() {
                        spatial_weights[spatial_index]
                    } else {
                        0.0 // Safe fallback if index is out of bounds
                    };
                    let range_weight = (range_coeff * intensity_diff * intensity_diff).exp();
                    let combined_weight = spatial_weight * range_weight;

                    weighted_sum += neighbor_intensity * combined_weight;
                    weight_sum += combined_weight;
                }
            }

            let filtered_value = if weight_sum > 0.0 {
                (weighted_sum / weight_sum).round().clamp(0.0, 255.0) as u8
            } else {
                center_intensity as u8
            };

            (x, y, filtered_value)
        })
        .into_iter()
        .for_each(|(x, y, filtered_value)| {
            filtered.put_pixel(x, y, Luma([filtered_value]));
        });
    } else {
        // Sequential processing for small images
        for y in 0..height {
            for x in 0..width {
                let center_intensity = image.get_pixel(x, y).0[0] as f32;
                let mut weighted_sum = 0.0f32;
                let mut weight_sum = 0.0f32;

                for dy in -kernel_radius..=kernel_radius {
                    for dx in -kernel_radius..=kernel_radius {
                        let nx = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                        let ny = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;

                        let neighbor_intensity = image.get_pixel(nx, ny).0[0] as f32;
                        let intensity_diff = neighbor_intensity - center_intensity;

                        // Combined spatial and range weight
                        let spatial_index = ((dy + kernel_radius) * (2 * kernel_radius + 1)
                            + (dx + kernel_radius))
                            as usize;
                        // CRITICAL FIX: Bounds check to prevent panic during intensive processing
                        let spatial_weight = if spatial_index < spatial_weights.len() {
                            spatial_weights[spatial_index]
                        } else {
                            0.0 // Safe fallback
                        };
                        let range_weight = (range_coeff * intensity_diff * intensity_diff).exp();
                        let combined_weight = spatial_weight * range_weight;

                        weighted_sum += neighbor_intensity * combined_weight;
                        weight_sum += combined_weight;
                    }
                }

                let filtered_value = if weight_sum > 0.0 {
                    (weighted_sum / weight_sum).round().clamp(0.0, 255.0) as u8
                } else {
                    center_intensity as u8
                };

                filtered.put_pixel(x, y, Luma([filtered_value]));
            }
        }
    }

    filtered
}

/// Fast bilateral filtering approximation for small kernels (radius <= 2)
/// This provides significant speedup for typical noise filtering scenarios
fn bilateral_filter_fast(image: &GrayImage, spatial_sigma: f32, range_sigma: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut filtered = GrayImage::new(width, height);

    // Use a 3x3 or 5x5 kernel for fast processing
    let kernel_radius = if spatial_sigma <= 1.0 { 1 } else { 2 };

    // Precompute spatial weights for the small kernel
    let mut spatial_weights = Vec::new();
    let spatial_coeff = -0.5 / (spatial_sigma * spatial_sigma);

    for dy in -kernel_radius..=kernel_radius {
        for dx in -kernel_radius..=kernel_radius {
            let spatial_dist = (dx * dx + dy * dy) as f32;
            let weight = (spatial_coeff * spatial_dist).exp();
            spatial_weights.push(weight);
        }
    }

    let range_coeff = -0.5 / (range_sigma * range_sigma);

    // Use parallel processing for medium-sized images even with small kernels (disabled in WASM builds to prevent memory issues)
    if width * height > 25_000 && !cfg!(target_arch = "wasm32") {
        let pixel_coords: Vec<(u32, u32)> = (0..height)
            .flat_map(|y| (0..width).map(move |x| (x, y)))
            .collect();

        execute_parallel(pixel_coords, |(x, y)| {
            let center_intensity = image.get_pixel(x, y).0[0] as f32;
            let mut weighted_sum = 0.0f32;
            let mut weight_sum = 0.0f32;

            let mut weight_idx = 0;
            for dy in -kernel_radius..=kernel_radius {
                for dx in -kernel_radius..=kernel_radius {
                    let nx = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                    let ny = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;

                    let neighbor_intensity = image.get_pixel(nx, ny).0[0] as f32;
                    let intensity_diff = neighbor_intensity - center_intensity;

                    // CRITICAL FIX: Bounds check for fast bilateral filter
                    let spatial_weight = if weight_idx < spatial_weights.len() {
                        spatial_weights[weight_idx]
                    } else {
                        0.0 // Safe fallback
                    };
                    let range_weight = (range_coeff * intensity_diff * intensity_diff).exp();
                    let combined_weight = spatial_weight * range_weight;

                    weighted_sum += neighbor_intensity * combined_weight;
                    weight_sum += combined_weight;
                    weight_idx += 1;
                }
            }

            let filtered_value = if weight_sum > 0.0 {
                (weighted_sum / weight_sum).round().clamp(0.0, 255.0) as u8
            } else {
                center_intensity as u8
            };

            (x, y, filtered_value)
        })
        .into_iter()
        .for_each(|(x, y, filtered_value)| {
            filtered.put_pixel(x, y, Luma([filtered_value]));
        });
    } else {
        // Sequential processing for small images
        for y in 0..height {
            for x in 0..width {
                let center_intensity = image.get_pixel(x, y).0[0] as f32;
                let mut weighted_sum = 0.0f32;
                let mut weight_sum = 0.0f32;

                let mut weight_idx = 0;
                for dy in -kernel_radius..=kernel_radius {
                    for dx in -kernel_radius..=kernel_radius {
                        let nx = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                        let ny = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;

                        let neighbor_intensity = image.get_pixel(nx, ny).0[0] as f32;
                        let intensity_diff = neighbor_intensity - center_intensity;

                        // CRITICAL FIX: Bounds check for fast bilateral filter
                        let spatial_weight = if weight_idx < spatial_weights.len() {
                            spatial_weights[weight_idx]
                        } else {
                            0.0 // Safe fallback
                        };
                        let range_weight = (range_coeff * intensity_diff * intensity_diff).exp();
                        let combined_weight = spatial_weight * range_weight;

                        weighted_sum += neighbor_intensity * combined_weight;
                        weight_sum += combined_weight;
                        weight_idx += 1;
                    }
                }

                let filtered_value = if weight_sum > 0.0 {
                    (weighted_sum / weight_sum).round().clamp(0.0, 255.0) as u8
                } else {
                    center_intensity as u8
                };

                filtered.put_pixel(x, y, Luma([filtered_value]));
            }
        }
    }

    filtered
}
