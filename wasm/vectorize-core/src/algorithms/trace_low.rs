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

use crate::algorithms::background::{rgba_to_lab, BackgroundConfig, LabColor};
use crate::algorithms::dots::{generate_dots_from_image, DotConfig};
use crate::algorithms::edges::{
    apply_nms, compute_fdog, hysteresis_threshold, FdogConfig, NmsConfig,
};
use crate::algorithms::etf::{compute_etf, EtfConfig};
use crate::algorithms::fit::{fit_beziers, FitConfig};
use crate::algorithms::gradients::GradientConfig;
use crate::algorithms::path_utils::calculate_douglas_peucker_epsilon;
use crate::algorithms::svg_dots::dots_to_svg_paths;
use crate::algorithms::trace::{trace_polylines, TraceConfig};
use crate::algorithms::{Point, SvgElementType, SvgPath};
use crate::error::VectorizeError;
use image::{GrayImage, ImageBuffer, Luma, Rgba};
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};
use rayon::prelude::*;
use std::collections::{HashMap, VecDeque};
use std::time::Instant;

/// Rectangle structure for region identification
#[derive(Debug, Clone, Copy)]
struct Rect {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
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
    _start_time: std::time::Instant,
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
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

/// Configuration for trace-low algorithms
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub struct TraceLowConfig {
    /// Selected tracing backend
    pub backend: TraceBackend,
    /// Detail level (0.0 = very sparse, 1.0 = more detail)
    pub detail: f32,
    /// Stroke width at 1080p reference resolution
    pub stroke_px_at_1080p: f32,
    /// Enable dual-pass processing for enhanced quality
    pub enable_multipass: bool,
    /// Conservative detail level for first pass (higher thresholds)
    pub conservative_detail: Option<f32>,
    /// Aggressive detail level for second pass (lower thresholds)
    pub aggressive_detail: Option<f32>,
    /// Enable content-aware noise filtering
    pub noise_filtering: bool,
    /// Enable reverse direction processing (R→L, B→T)
    pub enable_reverse_pass: bool,
    /// Enable diagonal direction processing (NW→SE, NE→SW)
    pub enable_diagonal_pass: bool,
    /// Threshold for directional strength - skip pass if not beneficial (0.0-1.0)
    pub directional_strength_threshold: f32,
    /// Maximum total processing time budget in milliseconds
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
}

impl Default for TraceLowConfig {
    fn default() -> Self {
        Self {
            backend: TraceBackend::Edge,
            detail: 0.3,
            stroke_px_at_1080p: 1.2,
            enable_multipass: false,
            conservative_detail: None,
            aggressive_detail: None,
            noise_filtering: false,
            enable_reverse_pass: false,
            enable_diagonal_pass: false,
            directional_strength_threshold: 0.3,
            max_processing_time_ms: 1500, // 1.5 second budget
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
        let detail = detail.clamp(0.0, 1.0);
        let diag = ((image_width.pow(2) + image_height.pow(2)) as f32).sqrt();

        // Global knob mapping as specified in trace-low-spec.md
        let dp_epsilon_px = ((0.003 + 0.012 * detail) * diag).clamp(0.003 * diag, 0.015 * diag);
        let min_stroke_length_px = 10.0 + 40.0 * detail;
        let canny_high_threshold = 0.15 + 0.20 * detail;
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

/// Main entry point for trace-low vectorization
pub fn vectorize_trace_low(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    if config.enable_multipass && config.backend == TraceBackend::Edge {
        // Check if directional passes are enabled
        if config.enable_reverse_pass || config.enable_diagonal_pass {
            // Use directional multi-pass processing for maximum quality
            vectorize_trace_low_directional(image, config)
        } else {
            // Use dual-pass processing for enhanced quality
            vectorize_trace_low_multipass(image, config)
        }
    } else {
        // Use single-pass processing (original implementation)
        vectorize_trace_low_single_pass(image, config)
    }
}

/// Single-pass trace-low vectorization (original implementation)
pub fn vectorize_trace_low_single_pass(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let thresholds = ThresholdMapping::new(config.detail, image.width(), image.height());

    log::info!(
        "Starting single-pass trace-low vectorization with backend {:?}, detail {:.2}",
        config.backend,
        config.detail
    );
    log::debug!("Threshold mapping: {thresholds:?}");

    match config.backend {
        TraceBackend::Edge => trace_edge(image, &thresholds, config),
        TraceBackend::Centerline => trace_centerline(image, &thresholds, config),
        TraceBackend::Superpixel => trace_superpixel(image, &thresholds, config),
        TraceBackend::Dots => trace_dots(image, &thresholds, config),
    }
}

/// Dual-pass trace-low vectorization for enhanced quality
pub fn vectorize_trace_low_multipass(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!(
        "Starting dual-pass trace-low vectorization with backend {:?}, base detail {:.2}",
        config.backend,
        config.detail
    );
    let total_start = std::time::Instant::now();

    // Calculate adaptive thresholds
    let (conservative_detail, aggressive_detail) = calculate_adaptive_thresholds(config);

    log::info!(
        "Dual-pass thresholds - Conservative: {conservative_detail:.2}, Aggressive: {aggressive_detail:.2}"
    );

    // PASS 1: Conservative foundation with higher thresholds
    let phase_start = std::time::Instant::now();
    let conservative_config = TraceLowConfig {
        detail: conservative_detail,
        enable_multipass: false, // Prevent recursion
        ..(*config)
    };
    let conservative_paths = vectorize_trace_low_single_pass(image, &conservative_config)?;
    let conservative_time = phase_start.elapsed();
    log::debug!(
        "Conservative pass: {:.3}ms ({} paths)",
        conservative_time.as_secs_f64() * 1000.0,
        conservative_paths.len()
    );

    // Early exit if conservative pass already found sufficient detail
    if conservative_paths.len() > 300 {
        log::info!(
            "Conservative pass found sufficient detail ({} paths), skipping aggressive pass",
            conservative_paths.len()
        );
        return Ok(conservative_paths);
    }

    // Analyze edge density for content-aware processing
    let phase_start = std::time::Instant::now();
    let analysis = analyze_edge_density(image, &conservative_paths)?;
    let analysis_time = phase_start.elapsed();
    log::debug!(
        "Edge density analysis: {:.3}ms",
        analysis_time.as_secs_f64() * 1000.0
    );

    // PASS 2: Aggressive detail capture with content-aware filtering
    let phase_start = std::time::Instant::now();
    let aggressive_config = TraceLowConfig {
        detail: aggressive_detail,
        enable_multipass: false, // Prevent recursion
        ..(*config)
    };
    let aggressive_paths =
        trace_edge_aggressive(image, &conservative_paths, &analysis, &aggressive_config)?;
    let aggressive_time = phase_start.elapsed();
    log::debug!(
        "Aggressive pass: {:.3}ms ({} additional paths)",
        aggressive_time.as_secs_f64() * 1000.0,
        aggressive_paths.len()
    );

    // Merge results with intelligent deduplication
    let phase_start = std::time::Instant::now();
    let merged_paths = merge_multipass_results(conservative_paths, aggressive_paths, config);
    let merge_time = phase_start.elapsed();
    log::debug!(
        "Path merging: {:.3}ms ({} final paths)",
        merge_time.as_secs_f64() * 1000.0,
        merged_paths.len()
    );

    let total_time = total_start.elapsed();
    log::info!(
        "Dual-pass completed in {:.3}ms - Conservative: {:.1}ms, Analysis: {:.1}ms, Aggressive: {:.1}ms, Merge: {:.1}ms",
        total_time.as_secs_f64() * 1000.0,
        conservative_time.as_secs_f64() * 1000.0,
        analysis_time.as_secs_f64() * 1000.0,
        aggressive_time.as_secs_f64() * 1000.0,
        merge_time.as_secs_f64() * 1000.0
    );

    Ok(merged_paths)
}

/// Directional multi-pass trace-low vectorization for maximum quality
pub fn vectorize_trace_low_directional(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!(
        "Starting directional multi-pass trace-low vectorization with backend {:?}, base detail {:.2}",
        config.backend, config.detail
    );

    let total_start = std::time::Instant::now();
    let mut budget = ProcessingBudget {
        total_budget_ms: config.max_processing_time_ms,
        consumed_ms: 0,
        _start_time: total_start,
        pass_priority: Vec::new(),
        _early_termination_enabled: true,
    };

    // PHASE 1: Standard dual-pass foundation (existing implementation)
    log::info!("Phase 1: Running standard dual-pass foundation");
    let phase_start = Instant::now();
    let base_paths = vectorize_trace_low_multipass(image, config)?;
    let base_time = phase_start.elapsed();
    budget.consumed_ms += base_time.as_millis() as u64;

    let remaining_budget = budget.total_budget_ms.saturating_sub(budget.consumed_ms);
    log::info!(
        "Base dual-pass completed in {:.1}ms ({} paths), budget remaining: {}ms",
        base_time.as_secs_f64() * 1000.0,
        base_paths.len(),
        remaining_budget
    );

    // Early exit if we're running out of time (but be more permissive with quality threshold)
    if budget.consumed_ms >= budget.total_budget_ms * 8 / 10 || base_paths.len() > 800 {
        log::info!(
            "Skipping directional passes due to time/quality constraints: time={}ms, paths={}",
            budget.consumed_ms,
            base_paths.len()
        );
        return Ok(base_paths);
    }

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
    let final_paths = merge_directional_results(base_paths, all_directional_paths, config);
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
    let total_start = std::time::Instant::now();

    // Convert to grayscale
    let phase_start = std::time::Instant::now();
    let gray = rgba_to_gray(image);
    let grayscale_time = phase_start.elapsed();
    log::debug!(
        "Grayscale conversion: {:.3}ms",
        grayscale_time.as_secs_f64() * 1000.0
    );

    // Apply Gaussian blur (σ=1.0-2.0 based on detail)
    let phase_start = std::time::Instant::now();
    let sigma = 1.0 + (1.0 * config.detail);
    let blurred = gaussian_blur(&gray, sigma);
    let blur_time = phase_start.elapsed();
    log::debug!("Gaussian blur: {:.3}ms", blur_time.as_secs_f64() * 1000.0);

    // Edge detection: ETF/FDoG or traditional Canny
    let phase_start = std::time::Instant::now();
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
            "Adaptive hysteresis thresholds: low={:.6}, high={:.6} (NMS max: {:.6})",
            adaptive_low,
            adaptive_high,
            nms_max
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
    let phase_start = std::time::Instant::now();
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
    let phase_start = std::time::Instant::now();
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
            let svg_path = SvgPath::new_stroke(path_data, "#000000", clamped_width);
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
        let simplified_polylines = polylines
            .into_par_iter()
            .filter_map(|polyline| {
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
            })
            .collect::<Vec<_>>();
        let simplification_time = phase_start.elapsed();
        log::debug!(
            "Simplification: {:.3}ms ({} -> {} paths)",
            simplification_time.as_secs_f64() * 1000.0,
            polyline_count,
            simplified_polylines.len()
        );

        // Convert to SVG paths with stroke styling
        let svg_start = std::time::Instant::now();
        let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
        let clamped_width = clamp_stroke_width(stroke_width, config);

        let svg_paths: Vec<SvgPath> = simplified_polylines
            .into_iter()
            .map(|polyline| create_stroke_path(polyline, clamped_width))
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
    log::info!("Edge backend generated {} stroke paths", svg_paths.len());

    Ok(svg_paths)
}

/// Centerline backend: Skeleton + centerline tracing using Zhang-Suen thinning
fn trace_centerline(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!("Starting centerline tracing with Zhang-Suen thinning");
    let start_time = Instant::now();

    // Phase 1: Convert to grayscale
    let phase_start = Instant::now();
    let gray = rgba_to_gray(image);
    let grayscale_time = phase_start.elapsed();

    // Phase 2: Binary thresholding using canny_high_threshold
    let phase_start = Instant::now();
    let binary = binary_threshold(&gray, thresholds.canny_high_threshold);
    let threshold_time = phase_start.elapsed();

    // Phase 3: Optional morphological preprocessing for noise filtering
    let phase_start = Instant::now();
    let processed_binary = if config.noise_filtering {
        morphological_preprocessing(&binary)
    } else {
        binary
    };
    let morphology_time = phase_start.elapsed();

    // Phase 4: Zhang-Suen skeletonization
    let phase_start = Instant::now();
    let skeleton = zhang_suen_thinning(&processed_binary);
    let thinning_time = phase_start.elapsed();

    // Phase 5: Extract polylines from skeleton using 8-connectivity tracing
    let phase_start = Instant::now();
    let polylines = extract_skeleton_polylines(&skeleton);
    let extraction_time = phase_start.elapsed();

    // Phase 6: Prune short branches
    let phase_start = Instant::now();
    let pruned_polylines = prune_short_branches(polylines, thresholds.min_centerline_branch_px);
    let pruning_time = phase_start.elapsed();

    // Phase 7: Simplify using Douglas-Peucker
    let phase_start = Instant::now();
    let simplified_polylines: Vec<Vec<Point>> = pruned_polylines
        .into_iter()
        .map(|polyline| douglas_peucker_simplify(&polyline, thresholds.dp_epsilon_px))
        .filter(|polyline| !polyline.is_empty())
        .collect();
    let simplification_time = phase_start.elapsed();

    // Phase 8: Generate SVG paths
    let phase_start = Instant::now();
    let svg_paths: Vec<SvgPath> = simplified_polylines
        .into_iter()
        .map(|polyline| {
            let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
            let clamped_width = clamp_stroke_width(stroke_width, config);
            polyline_to_svg_path(polyline, clamped_width)
        })
        .collect();
    let svg_generation_time = phase_start.elapsed();

    let total_time = start_time.elapsed();

    log::info!(
        "Centerline tracing completed in {:.1}ms: gray={:.1}ms, threshold={:.1}ms, morph={:.1}ms, thin={:.1}ms, extract={:.1}ms, prune={:.1}ms, simplify={:.1}ms, svg={:.1}ms",
        total_time.as_secs_f64() * 1000.0,
        grayscale_time.as_secs_f64() * 1000.0,
        threshold_time.as_secs_f64() * 1000.0,
        morphology_time.as_secs_f64() * 1000.0,
        thinning_time.as_secs_f64() * 1000.0,
        extraction_time.as_secs_f64() * 1000.0,
        pruning_time.as_secs_f64() * 1000.0,
        simplification_time.as_secs_f64() * 1000.0,
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

    // Calculate superpixel parameters based on detail level
    let superpixel_count = (50.0 + 150.0 * config.detail) as usize;
    let superpixel_compactness = 10.0;

    log::info!(
        "Starting SLIC superpixel segmentation: {}×{} → {} superpixels (detail: {:.2})",
        width,
        height,
        superpixel_count,
        config.detail
    );

    // 1. Convert image to LAB color space
    let phase_start = Instant::now();
    let lab_image: Vec<LabColor> = image.pixels().map(|pixel| rgba_to_lab(pixel)).collect();
    log::debug!("LAB conversion: {:?}", phase_start.elapsed());

    // 2. Initialize SLIC superpixel segmentation
    let phase_start = Instant::now();
    let superpixel_labels = slic_segmentation(
        &lab_image,
        width,
        height,
        superpixel_count,
        superpixel_compactness,
        10, // max iterations
    );
    log::debug!("SLIC segmentation: {:?}", phase_start.elapsed());

    // 3. Extract superpixel regions and calculate average colors
    let phase_start = Instant::now();
    let regions = extract_superpixel_regions(&superpixel_labels, &lab_image, image, width, height);
    log::debug!("Region extraction: {:?}", phase_start.elapsed());

    // 4. Generate SVG paths based on artistic mode
    let phase_start = Instant::now();
    let dp_epsilon = calculate_douglas_peucker_epsilon(width as u32, height as u32, 0.005) as f32;

    let svg_paths = generate_superpixel_svg_paths(
        &regions,
        &superpixel_labels,
        width,
        height,
        config.stroke_px_at_1080p,
        dp_epsilon,
        config.detail,
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
        // Color distance in LAB space
        let color_dist = self.lab.distance_to(other_lab);

        // Spatial distance
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
) -> Vec<usize> {
    // Calculate initial grid spacing
    let total_pixels = width * height;
    let s = ((total_pixels as f32 / num_superpixels as f32).sqrt()) as usize;
    let s = s.max(1); // Ensure minimum spacing of 1

    // Initialize cluster centers on a regular grid
    let mut clusters = Vec::new();
    let mut cluster_id = 0;

    for y in (s / 2..height).step_by(s) {
        for x in (s / 2..width).step_by(s) {
            if cluster_id >= num_superpixels {
                break;
            }

            let idx = y * width + x;
            if idx < lab_image.len() {
                clusters.push(SlicCluster::new(lab_image[idx], x as f32, y as f32));
                cluster_id += 1;
            }
        }
        if cluster_id >= num_superpixels {
            break;
        }
    }

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
            if label < cluster_sums.len() {
                let x = (idx % width) as f32;
                let y = (idx / width) as f32;
                let lab = lab_image[idx];

                cluster_sums[label].0.l += lab.l;
                cluster_sums[label].0.a += lab.a;
                cluster_sums[label].0.b += lab.b;
                cluster_sums[label].1 += x;
                cluster_sums[label].2 += y;
                cluster_sums[label].3 += 1;
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
        let avg_rgb_hex = format!("#{:02x}{:02x}{:02x}", avg_r, avg_g, avg_b);

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
    let centroid_x =
        boundary_pixels.iter().map(|(x, _)| *x as f32).sum::<f32>() / boundary_pixels.len() as f32;
    let centroid_y =
        boundary_pixels.iter().map(|(_, y)| *y as f32).sum::<f32>() / boundary_pixels.len() as f32;

    let mut boundary_points: Vec<Point> = boundary_pixels
        .into_iter()
        .map(|(x, y)| Point::new(x as f32, y as f32))
        .collect();

    // Sort by angle from centroid for better path ordering
    boundary_points.sort_by(|a, b| {
        let angle_a = (a.y - centroid_y).atan2(a.x - centroid_x);
        let angle_b = (b.y - centroid_y).atan2(b.x - centroid_x);
        angle_a
            .partial_cmp(&angle_b)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    boundary_points
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
) -> Result<Vec<SvgPath>, VectorizeError> {
    let mut svg_paths = Vec::new();

    // Determine artistic mode based on detail level
    // 0.0-0.3: Filled regions only (stained glass effect)
    // 0.3-0.7: Filled regions with black borders (comic book style)
    // 0.7-1.0: Strokes only (cell animation style)

    let mode = if detail < 0.33 {
        "filled_only"
    } else if detail < 0.67 {
        "filled_with_borders"
    } else {
        "strokes_only"
    };

    log::debug!(
        "Using superpixel artistic mode: {} (detail: {:.2})",
        mode,
        detail
    );

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

        match mode {
            "filled_only" => {
                // Stained glass effect - filled regions only
                let svg_path = SvgPath::new_fill(path_data, &region.avg_rgb_hex);
                svg_paths.push(svg_path);
            }
            "filled_with_borders" => {
                // Comic book style - filled regions with black borders
                let filled_path = SvgPath::new_fill(path_data.clone(), &region.avg_rgb_hex);
                svg_paths.push(filled_path);

                // Add border stroke
                let stroke_path = SvgPath::new_stroke(path_data, "#000000", stroke_width);
                svg_paths.push(stroke_path);
            }
            "strokes_only" => {
                // Cell animation style - strokes only with region color
                let stroke_path =
                    SvgPath::new_stroke(path_data, &region.avg_rgb_hex, stroke_width * 1.5);
                svg_paths.push(stroke_path);
            }
            _ => unreachable!(),
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
    let total_start = std::time::Instant::now();

    // Create DotConfig from TraceLowConfig
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

    // Generate dots using the complete pipeline
    let phase_start = std::time::Instant::now();
    let dots = generate_dots_from_image(
        image,
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

    // Convert dots to SVG paths
    let phase_start = std::time::Instant::now();
    let svg_paths = dots_to_svg_paths(&dots);
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

/// Convert RGBA image to grayscale with optimized parallel processing
fn rgba_to_gray(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut gray = GrayImage::new(width, height);

    // Use parallel processing for larger images
    if width * height > 100_000 {
        // Process rows in parallel for better cache locality
        gray.par_enumerate_pixels_mut()
            .for_each(|(x, y, gray_pixel)| {
                let rgba_pixel = image.get_pixel(x, y);
                let [r, g, b, _a] = rgba_pixel.0;
                // Optimized integer luminance calculation (avoids floating point)
                let gray_value = ((77 * r as u32 + 150 * g as u32 + 29 * b as u32) >> 8) as u8;
                gray_pixel.0[0] = gray_value;
            });
    } else {
        // Use sequential processing for small images to avoid thread overhead
        for (x, y, pixel) in image.enumerate_pixels() {
            let [r, g, b, _a] = pixel.0;
            // Optimized integer luminance calculation
            let gray_value = ((77 * r as u32 + 150 * g as u32 + 29 * b as u32) >> 8) as u8;
            gray.put_pixel(x, y, Luma([gray_value]));
        }
    }

    gray
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

        for i in 0..kernel_size {
            let x = i as f32 - kernel_radius as f32;
            let val = ((-x * x / (2.0 * sigma * sigma)).exp() * 256.0) as i32;
            int_kernel[i] = val;
            sum += val;
        }

        // Apply separable integer Gaussian filter with parallel processing
        let mut temp = GrayImage::new(width, height);

        // Horizontal pass - process rows in parallel
        if width * height > 50_000 {
            temp.par_enumerate_pixels_mut()
                .for_each(|(x, y, temp_pixel)| {
                    let mut value = 0i32;
                    for i in 0..kernel_size {
                        let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(width as i32 - 1) as u32;
                        value += image.get_pixel(src_x, y).0[0] as i32 * int_kernel[i];
                    }
                    temp_pixel.0[0] = (value / sum).clamp(0, 255) as u8;
                });
        } else {
            // Sequential for small images
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0i32;
                    for i in 0..kernel_size {
                        let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(width as i32 - 1) as u32;
                        value += image.get_pixel(src_x, y).0[0] as i32 * int_kernel[i];
                    }
                    temp.put_pixel(x, y, Luma([(value / sum).clamp(0, 255) as u8]));
                }
            }
        }

        // Vertical pass - process pixels in parallel
        if width * height > 50_000 {
            blurred
                .par_enumerate_pixels_mut()
                .for_each(|(x, y, blur_pixel)| {
                    let mut value = 0i32;
                    for i in 0..kernel_size {
                        let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(height as i32 - 1) as u32;
                        value += temp.get_pixel(x, src_y).0[0] as i32 * int_kernel[i];
                    }
                    blur_pixel.0[0] = (value / sum).clamp(0, 255) as u8;
                });
        } else {
            // Sequential for small images
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0i32;
                    for i in 0..kernel_size {
                        let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(height as i32 - 1) as u32;
                        value += temp.get_pixel(x, src_y).0[0] as i32 * int_kernel[i];
                    }
                    blurred.put_pixel(x, y, Luma([(value / sum).clamp(0, 255) as u8]));
                }
            }
        }
    } else {
        // Fallback to floating point for large kernels
        let mut kernel = vec![0.0f32; kernel_size];
        let mut sum = 0.0;
        for i in 0..kernel_size {
            let x = i as f32 - kernel_radius as f32;
            kernel[i] = (-x * x / (2.0 * sigma * sigma)).exp();
            sum += kernel[i];
        }
        // Normalize kernel
        for k in &mut kernel {
            *k /= sum;
        }

        // Apply separable Gaussian filter with parallel processing
        let mut temp = GrayImage::new(width, height);

        // Horizontal pass
        if width * height > 50_000 {
            temp.par_enumerate_pixels_mut()
                .for_each(|(x, y, temp_pixel)| {
                    let mut value = 0.0;
                    for i in 0..kernel_size {
                        let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(width as i32 - 1) as u32;
                        value += image.get_pixel(src_x, y).0[0] as f32 * kernel[i];
                    }
                    temp_pixel.0[0] = value.round().clamp(0.0, 255.0) as u8;
                });
        } else {
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0.0;
                    for i in 0..kernel_size {
                        let src_x = (x as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(width as i32 - 1) as u32;
                        value += image.get_pixel(src_x, y).0[0] as f32 * kernel[i];
                    }
                    temp.put_pixel(x, y, Luma([value.round() as u8]));
                }
            }
        }

        // Vertical pass
        if width * height > 50_000 {
            blurred
                .par_enumerate_pixels_mut()
                .for_each(|(x, y, blur_pixel)| {
                    let mut value = 0.0;
                    for i in 0..kernel_size {
                        let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(height as i32 - 1) as u32;
                        value += temp.get_pixel(x, src_y).0[0] as f32 * kernel[i];
                    }
                    blur_pixel.0[0] = value.round().clamp(0.0, 255.0) as u8;
                });
        } else {
            for y in 0..height {
                for x in 0..width {
                    let mut value = 0.0;
                    for i in 0..kernel_size {
                        let src_y = (y as i32 + i as i32 - kernel_radius as i32)
                            .max(0)
                            .min(height as i32 - 1) as u32;
                        value += temp.get_pixel(x, src_y).0[0] as f32 * kernel[i];
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
    let use_parallel = width * height > 50_000;

    if use_parallel {
        gradient_x
            .par_iter_mut()
            .zip(gradient_y.par_iter_mut())
            .zip(gradient_magnitude.par_iter_mut())
            .enumerate()
            .for_each(|(idx, ((gx, gy), mag))| {
                let y = (idx / width as usize) as u32;
                let x = (idx % width as usize) as u32;

                // Skip border pixels
                if x == 0 || x >= width - 1 || y == 0 || y >= height - 1 {
                    *gx = 0.0;
                    *gy = 0.0;
                    *mag = 0.0;
                    return;
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
                *gx = -p00 + p02 - 2.0 * p10 + 2.0 * p12 - p20 + p22;
                // Sobel Y: [-1 -2 -1; 0 0 0; 1 2 1]
                *gy = -p00 - 2.0 * p01 - p02 + p20 + 2.0 * p21 + p22;

                // Use fast magnitude approximation (L1 norm) for better performance
                *mag = gx.abs() + gy.abs();
            });
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

    // Find max magnitude for normalization using parallel reduction
    let max_magnitude = if use_parallel {
        gradient_magnitude
            .par_iter()
            .copied()
            .reduce(|| 0.0f32, f32::max)
    } else {
        gradient_magnitude.iter().fold(0.0f32, |a, &b| a.max(b))
    };

    // Normalize gradient magnitude to [0, 1] in parallel
    if max_magnitude > 0.0 {
        if use_parallel {
            gradient_magnitude.par_iter_mut().for_each(|mag| {
                *mag /= max_magnitude;
            });
        } else {
            for mag in &mut gradient_magnitude {
                *mag /= max_magnitude;
            }
        }
    }

    // Non-maximum suppression with fast angle approximation
    let mut suppressed = vec![0.0f32; total_pixels];

    if use_parallel {
        suppressed
            .par_iter_mut()
            .enumerate()
            .for_each(|(idx, suppressed_val)| {
                let y = (idx / width as usize) as u32;
                let x = (idx % width as usize) as u32;

                // Skip border pixels
                if x == 0 || x >= width - 1 || y == 0 || y >= height - 1 {
                    return;
                }

                let magnitude = gradient_magnitude[idx];
                if magnitude == 0.0 {
                    return;
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

                if magnitude >= mag1 && magnitude >= mag2 {
                    *suppressed_val = magnitude;
                }
            });
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
        if points.len() < 2 {
            return;
        }

        let first = &points[0];
        let last = &points[points.len() - 1];

        let mut max_distance = 0.0;
        let mut max_index = 0;

        for (i, point) in points.iter().enumerate().skip(1).take(points.len() - 2) {
            let distance = perpendicular_distance(point, first, last);
            if distance > max_distance {
                max_distance = distance;
                max_index = i;
            }
        }

        if max_distance > epsilon {
            // Split at the point with maximum distance
            dp_recursive(&points[0..=max_index], epsilon, result);
            result.pop(); // Remove duplicate point
            dp_recursive(&points[max_index..], epsilon, result);
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
    let w_max = 3.0; // Maximum stroke width to prevent blob-like appearance

    // Clamp to range without increasing original width
    width.max(w_min).min(w_max).min(width * 1.0) // Never increase original width
}

/// Create SVG stroke path from polyline
fn create_stroke_path(polyline: Vec<Point>, stroke_width: f32) -> SvgPath {
    // Create path data string
    let mut path_data = String::new();

    if !polyline.is_empty() {
        path_data.push_str(&format!("M {:.2} {:.2}", polyline[0].x, polyline[0].y));

        for point in polyline.iter().skip(1) {
            path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
        }
    }

    SvgPath {
        element_type: SvgElementType::Path,
        data: path_data,
        fill: "none".to_string(),
        stroke: "black".to_string(),
        stroke_width,
    }
}

/// Calculate adaptive thresholds for dual-pass processing
fn calculate_adaptive_thresholds(config: &TraceLowConfig) -> (f32, f32) {
    // Use explicit values if provided, otherwise calculate from base detail
    let conservative = config.conservative_detail.unwrap_or(config.detail * 1.3);
    let aggressive = config.aggressive_detail.unwrap_or(config.detail * 0.7);

    // Ensure conservative threshold is higher than aggressive
    let conservative = conservative.max(aggressive + 0.1).clamp(0.1, 1.0);
    let aggressive = aggressive.clamp(0.05, conservative - 0.05);

    (conservative, aggressive)
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
    for grid_y in 0..grid_height {
        for grid_x in 0..grid_width {
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

            region_grid[grid_y][grid_x] = if total_pixels > 0 {
                edge_count as f32 / total_pixels as f32
            } else {
                0.0
            };
        }
    }

    // Identify regions based on edge density and conservative path coverage
    let mut high_detail_regions = Vec::new();
    let mut texture_regions = Vec::new();

    for grid_y in 0..grid_height {
        for grid_x in 0..grid_width {
            let density = region_grid[grid_y][grid_x];
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

/// Merge conservative and aggressive paths with optimized deduplication
fn merge_multipass_results(
    conservative_paths: Vec<SvgPath>,
    aggressive_paths: Vec<SvgPath>,
    config: &TraceLowConfig,
) -> Vec<SvgPath> {
    // Use the same optimized approach as directional merging
    let directional_paths = vec![aggressive_paths];
    merge_directional_results(conservative_paths, directional_paths, config)
}

/// Check if a path is a duplicate of existing paths (simple implementation)
#[allow(dead_code)]
fn is_duplicate_path(new_path: &SvgPath, existing_paths: &[SvgPath]) -> bool {
    // Simple heuristic: check if paths have very similar coordinates
    let new_coords: Vec<f32> = new_path
        .data
        .split_whitespace()
        .filter_map(|s| s.parse().ok())
        .collect();

    if new_coords.len() < 4 {
        return true; // Too short, likely duplicate or noise
    }

    for existing_path in existing_paths {
        let existing_coords: Vec<f32> = existing_path
            .data
            .split_whitespace()
            .filter_map(|s| s.parse().ok())
            .collect();

        if coords_are_similar(&new_coords, &existing_coords, 10.0) {
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

    // Calculate benefit scores for each direction
    let mut direction_benefits = [0.0f32; 4];
    direction_benefits[0] = 1.0; // Standard always has full benefit
    direction_benefits[1] = if dominant_lighting_direction.is_some() {
        0.7
    } else {
        0.3
    }; // Reverse
    direction_benefits[2] = if has_diagonal_content { 0.8 } else { 0.2 }; // DiagonalNW
    direction_benefits[3] = if has_diagonal_content { 0.8 } else { 0.2 }; // DiagonalNE

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

    // Add reverse pass if beneficial
    if config.enable_reverse_pass
        && analysis.direction_benefits[1] >= config.directional_strength_threshold
    {
        candidates.push((ProcessingDirection::Reverse, analysis.direction_benefits[1]));
    }

    // Add diagonal passes if beneficial
    if config.enable_diagonal_pass {
        if analysis.direction_benefits[2] >= config.directional_strength_threshold {
            candidates.push((
                ProcessingDirection::DiagonalNW,
                analysis.direction_benefits[2],
            ));
        }
        if analysis.direction_benefits[3] >= config.directional_strength_threshold {
            candidates.push((
                ProcessingDirection::DiagonalNE,
                analysis.direction_benefits[3],
            ));
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

    // Simplify and filter
    let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
    let svg_paths: Vec<SvgPath> = polylines
        .into_par_iter()
        .filter_map(|polyline| {
            let simplified = douglas_peucker_simplify(&polyline, thresholds.dp_epsilon_px);
            let length = calculate_polyline_length(&simplified);

            if length >= thresholds.min_stroke_length_px * 1.2 {
                // Slightly higher threshold for directional
                Some(create_stroke_path(simplified, stroke_width))
            } else {
                None
            }
        })
        .collect();

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
            // Filter to prefer diagonal-oriented paths
            polylines.retain(|polyline| is_diagonal_oriented(polyline));
        }
        _ => {}
    }

    polylines
}

/// Check if a polyline is diagonally oriented
fn is_diagonal_oriented(polyline: &[Point]) -> bool {
    if polyline.len() < 2 {
        return false;
    }

    let start = &polyline[0];
    let end = &polyline[polyline.len() - 1];
    let dx = (end.x - start.x).abs();
    let dy = (end.y - start.y).abs();

    // Check if the line is more diagonal than orthogonal
    let diagonal_ratio = dx.min(dy) / dx.max(dy).max(1.0);
    diagonal_ratio > 0.4 // At least 40% diagonal component
}

/// Optimized merge directional results with spatial indexing
fn merge_directional_results(
    base_paths: Vec<SvgPath>,
    directional_paths: Vec<Vec<SvgPath>>,
    config: &TraceLowConfig,
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
    let cached_data: Vec<CachedPathData> = all_paths
        .par_iter()
        .map(CachedPathData::from_svg_path)
        .collect();

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

    // Apply artistic enhancements if we have time budget remaining
    if merge_time.as_millis() < 150 {
        apply_artistic_enhancements(&mut final_paths, &final_cached_data, config);
    }

    final_paths
}

/// Apply artistic enhancements for hand-drawn aesthetic
fn apply_artistic_enhancements(
    paths: &mut [SvgPath],
    cached_data: &[CachedPathData],
    _config: &TraceLowConfig,
) {
    if paths.is_empty() {
        return;
    }

    log::debug!("Applying artistic enhancements to {} paths", paths.len());
    let enhancement_start = Instant::now();

    // Calculate edge strengths based on path characteristics
    let edge_strengths: Vec<f32> = cached_data
        .iter()
        .map(|cached| {
            // Use path length and complexity as strength indicators
            let length_factor = (cached.approx_length / 100.0).min(1.0);
            let bbox_area = (cached.bbox.2 - cached.bbox.0) * (cached.bbox.3 - cached.bbox.1);
            let complexity_factor = (bbox_area / 10000.0).min(1.0);

            0.5 + 0.3 * length_factor + 0.2 * complexity_factor
        })
        .collect();

    // Apply enhancements in parallel for performance
    paths
        .par_iter_mut()
        .zip(edge_strengths.par_iter())
        .zip(cached_data.par_iter())
        .for_each(|((path, &edge_strength), cached)| {
            // 1. Variable line weights based on edge strength
            apply_variable_line_weight(path, edge_strength);

            // 2. Subtle tremor for organic feel (deterministic based on path data)
            apply_organic_tremor(path, cached, 0.3);

            // 3. Natural path tapering
            apply_natural_tapering(path, cached);
        });

    let enhancement_time = enhancement_start.elapsed();
    log::debug!(
        "Artistic enhancements completed in {:.1}ms",
        enhancement_time.as_secs_f64() * 1000.0
    );
}

/// Apply variable line weight based on edge strength
fn apply_variable_line_weight(path: &mut SvgPath, edge_strength: f32) {
    // Map edge strength to stroke width multiplier (0.6 to 1.8)
    let weight_multiplier = 0.6 + (edge_strength * 1.2);
    path.stroke_width *= weight_multiplier;
}

/// Apply subtle organic tremor for hand-drawn feel
fn apply_organic_tremor(path: &mut SvgPath, cached: &CachedPathData, tremor_strength: f32) {
    if cached.coords.len() < 4 {
        return;
    }

    // Use path characteristics as deterministic seed for consistent results
    let seed = ((cached.start_point.0 + cached.start_point.1) * 1000.0) as u64;
    let mut rng = SmallRng::seed_from_u64(seed);

    // Parse and modify path data
    let mut new_path_data = String::new();
    let coords = &cached.coords;

    if !coords.is_empty() {
        // Start point with slight tremor
        let tremor_x = (rng.gen::<f32>() - 0.5) * tremor_strength;
        let tremor_y = (rng.gen::<f32>() - 0.5) * tremor_strength;
        new_path_data.push_str(&format!(
            "M {:.2} {:.2}",
            coords[0] + tremor_x,
            coords[1] + tremor_y
        ));

        // Subsequent points with tremor
        for chunk in coords.chunks(2).skip(1) {
            if chunk.len() == 2 {
                let tremor_x = (rng.gen::<f32>() - 0.5) * tremor_strength;
                let tremor_y = (rng.gen::<f32>() - 0.5) * tremor_strength;
                new_path_data.push_str(&format!(
                    " L {:.2} {:.2}",
                    chunk[0] + tremor_x,
                    chunk[1] + tremor_y
                ));
            }
        }

        path.data = new_path_data;
    }
}

/// Apply natural path tapering at start and end
fn apply_natural_tapering(path: &mut SvgPath, cached: &CachedPathData) {
    if cached.approx_length < 20.0 {
        return; // Skip tapering for very short paths
    }

    // For now, subtle width adjustment based on path length
    // In a full implementation, this would require more sophisticated path manipulation
    let length_factor = (cached.approx_length / 100.0).min(1.0);
    let taper_factor = 0.9 + (length_factor * 0.1);
    path.stroke_width *= taper_factor;
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
    let conservative_config = TraceLowConfig {
        detail: config.conservative_detail.unwrap_or(config.detail * 1.3),
        enable_multipass: false,
        ..*config
    };
    let conservative_paths = vectorize_trace_low_single_pass(image, &conservative_config)?;
    profile.conservative_pass = pass_start.elapsed();
    profile.path_counts.conservative_paths = conservative_paths.len();

    // Analysis phase
    let analysis = analyze_edge_density(image, &conservative_paths)?;

    // Aggressive pass
    let pass_start = Instant::now();
    let aggressive_config = TraceLowConfig {
        detail: config.aggressive_detail.unwrap_or(config.detail * 0.7),
        enable_multipass: false,
        ..*config
    };
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
    let final_paths = merge_directional_results(conservative_paths, directional_paths, config);
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

        let mut config = TraceLowConfig::default();
        config.detail = 0.5;

        let result = vectorize_trace_low(&image, &config);
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
                if x >= 40 && x < 60 && y >= 40 && y < 60 {
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

        let svg_paths = result.unwrap();
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
        let result = vectorize_trace_low_single_pass(&img, &config);
        assert!(
            result.is_ok(),
            "Main pipeline should work with dots backend"
        );

        // Also test with the main entry point
        let result = vectorize_trace_low(&img, &config);
        assert!(
            result.is_ok(),
            "Main vectorize_trace_low should work with dots backend"
        );
    }
}

// ============================================================================
// Centerline Backend Helper Functions
// ============================================================================

/// Binary threshold using normalized threshold value
fn binary_threshold(gray: &GrayImage, threshold: f32) -> GrayImage {
    let (width, height) = gray.dimensions();
    let mut binary = GrayImage::new(width, height);

    // Convert normalized threshold (0.0-1.0) to byte value (0-255)
    let threshold_byte = (threshold * 255.0) as u8;

    // Use parallel processing for better performance
    binary
        .par_enumerate_pixels_mut()
        .for_each(|(x, y, binary_pixel)| {
            let gray_value = gray.get_pixel(x, y).0[0];
            binary_pixel.0[0] = if gray_value > threshold_byte { 255 } else { 0 };
        });

    binary
}

/// Morphological preprocessing for noise filtering (opening + closing)
fn morphological_preprocessing(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut result = GrayImage::new(width, height);

    // Simple 3x3 structuring element for opening (erosion + dilation)
    // This removes small noise while preserving main structures
    let mut eroded = GrayImage::new(width, height);

    // Erosion pass
    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            let mut min_val = 255u8;
            for dy in -1..=1 {
                for dx in -1..=1 {
                    let px = binary
                        .get_pixel((x as i32 + dx) as u32, (y as i32 + dy) as u32)
                        .0[0];
                    min_val = min_val.min(px);
                }
            }
            eroded.get_pixel_mut(x, y).0[0] = min_val;
        }
    }

    // Dilation pass (opening = erosion + dilation)
    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            let mut max_val = 0u8;
            for dy in -1..=1 {
                for dx in -1..=1 {
                    let px = eroded
                        .get_pixel((x as i32 + dx) as u32, (y as i32 + dy) as u32)
                        .0[0];
                    max_val = max_val.max(px);
                }
            }
            result.get_pixel_mut(x, y).0[0] = max_val;
        }
    }

    result
}

/// Zhang-Suen thinning algorithm for skeletonization
/// Returns a binary image where white pixels (255) represent the skeleton
fn zhang_suen_thinning(binary: &GrayImage) -> GrayImage {
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

        // Step 1: Mark pixels for deletion
        let mut to_delete_1 = Vec::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if should_delete_zhang_suen_step1(&image, x, y) {
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
                if should_delete_zhang_suen_step2(&image, x, y) {
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

/// Zhang-Suen Step 1: Check if pixel should be deleted
fn should_delete_zhang_suen_step1(image: &GrayImage, x: u32, y: u32) -> bool {
    let p1 = is_foreground(image, x, y);
    if !p1 {
        return false;
    }

    // Get 8-neighborhood (clockwise from top)
    let p2 = is_foreground(image, x, y - 1); // N
    let p3 = is_foreground(image, x + 1, y - 1); // NE
    let p4 = is_foreground(image, x + 1, y); // E
    let p5 = is_foreground(image, x + 1, y + 1); // SE
    let p6 = is_foreground(image, x, y + 1); // S
    let p7 = is_foreground(image, x - 1, y + 1); // SW
    let p8 = is_foreground(image, x - 1, y); // W
    let p9 = is_foreground(image, x - 1, y - 1); // NW

    // Count black-to-white transitions
    let transitions = count_transitions(&[p2, p3, p4, p5, p6, p7, p8, p9]);

    // Count white neighbors
    let white_neighbors = [p2, p3, p4, p5, p6, p7, p8, p9]
        .iter()
        .filter(|&&p| p)
        .count();

    // Zhang-Suen conditions for step 1
    transitions == 1
        && white_neighbors >= 2
        && white_neighbors <= 6
        && (!p2 || !p4 || !p6)
        && (!p4 || !p6 || !p8)
}

/// Zhang-Suen Step 2: Check if pixel should be deleted
fn should_delete_zhang_suen_step2(image: &GrayImage, x: u32, y: u32) -> bool {
    let p1 = is_foreground(image, x, y);
    if !p1 {
        return false;
    }

    // Get 8-neighborhood (clockwise from top)
    let p2 = is_foreground(image, x, y - 1); // N
    let p3 = is_foreground(image, x + 1, y - 1); // NE
    let p4 = is_foreground(image, x + 1, y); // E
    let p5 = is_foreground(image, x + 1, y + 1); // SE
    let p6 = is_foreground(image, x, y + 1); // S
    let p7 = is_foreground(image, x - 1, y + 1); // SW
    let p8 = is_foreground(image, x - 1, y); // W
    let p9 = is_foreground(image, x - 1, y - 1); // NW

    // Count black-to-white transitions
    let transitions = count_transitions(&[p2, p3, p4, p5, p6, p7, p8, p9]);

    // Count white neighbors
    let white_neighbors = [p2, p3, p4, p5, p6, p7, p8, p9]
        .iter()
        .filter(|&&p| p)
        .count();

    // Zhang-Suen conditions for step 2
    transitions == 1
        && white_neighbors >= 2
        && white_neighbors <= 6
        && (!p2 || !p4 || !p8)
        && (!p2 || !p6 || !p8)
}

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

/// Extract polylines from skeleton using 8-connectivity tracing
fn extract_skeleton_polylines(skeleton: &GrayImage) -> Vec<Vec<Point>> {
    let (width, height) = skeleton.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();

    // Find all skeleton pixels and trace them
    for y in 0..height {
        for x in 0..width {
            if is_foreground(skeleton, x, y) && !visited[y as usize][x as usize] {
                let polyline = trace_skeleton_path(skeleton, &mut visited, x, y);
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    polylines
}

/// Trace a single skeleton path starting from given point
fn trace_skeleton_path(
    skeleton: &GrayImage,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut current = (start_x, start_y);

    // Use a simple path following algorithm
    loop {
        let (x, y) = current;
        visited[y as usize][x as usize] = true;
        path.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Find next unvisited neighbor
        let mut next = None;

        // Check 8-neighborhood
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
                        next = Some((nx, ny));
                        break;
                    }
                }
            }
            if next.is_some() {
                break;
            }
        }

        match next {
            Some(next_pos) => current = next_pos,
            None => break, // End of path
        }
    }

    path
}

/// Prune short branches from polylines
fn prune_short_branches(polylines: Vec<Vec<Point>>, min_length: f32) -> Vec<Vec<Point>> {
    polylines
        .into_iter()
        .filter(|polyline| {
            let length = calculate_polyline_length(polyline);
            length >= min_length
        })
        .collect()
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
