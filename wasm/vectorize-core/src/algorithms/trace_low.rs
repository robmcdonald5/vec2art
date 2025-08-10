//! Low-detail tracing algorithms for sparse SVG generation
//!
//! This module implements three different tracing backends:
//! - Edge: Canny edge detection + contour following for sparse outlines
//! - Centerline: Skeleton + centerline tracing for engraving/sketch effects  
//! - Superpixel: Large regions with cell-shaded look using SLIC
//!
//! All algorithms are controlled by a single detail parameter (0..1) that maps
//! to appropriate thresholds for each backend.

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
            log::info!(
                "Time budget exceeded, stopping directional passes at {elapsed}ms"
            );
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

    // Canny edge detection
    let phase_start = std::time::Instant::now();
    let edges = canny_edge_detection(
        &blurred,
        thresholds.canny_low_threshold,
        thresholds.canny_high_threshold,
    );
    let canny_time = phase_start.elapsed();
    log::debug!(
        "Canny edge detection: {:.3}ms",
        canny_time.as_secs_f64() * 1000.0
    );

    // Link edges into polylines
    let phase_start = std::time::Instant::now();
    let polylines = link_edges_to_polylines(&edges);
    let linking_time = phase_start.elapsed();
    log::debug!(
        "Edge linking: {:.3}ms ({} polylines)",
        linking_time.as_secs_f64() * 1000.0,
        polylines.len()
    );

    // Simplify with Douglas-Peucker and prune short strokes
    let phase_start = std::time::Instant::now();
    let polyline_count = polylines.len();
    let simplified_polylines = polylines
        .into_par_iter()
        .filter_map(|polyline| {
            let simplified = douglas_peucker_simplify(&polyline, thresholds.dp_epsilon_px);
            let length = calculate_polyline_length(&simplified);

            if length >= thresholds.min_stroke_length_px {
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
    let phase_start = std::time::Instant::now();
    let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
    let svg_paths: Vec<SvgPath> = simplified_polylines
        .into_iter()
        .map(|polyline| create_stroke_path(polyline, stroke_width))
        .collect();
    let svg_generation_time = phase_start.elapsed();
    log::debug!(
        "SVG generation: {:.3}ms",
        svg_generation_time.as_secs_f64() * 1000.0
    );

    let total_time = total_start.elapsed();
    log::info!(
        "Edge backend completed in {:.3}ms - Grayscale: {:.1}ms, Blur: {:.1}ms, Canny: {:.1}ms, Linking: {:.1}ms, Simplification: {:.1}ms, SVG: {:.1}ms",
        total_time.as_secs_f64() * 1000.0,
        grayscale_time.as_secs_f64() * 1000.0,
        blur_time.as_secs_f64() * 1000.0,
        canny_time.as_secs_f64() * 1000.0,
        linking_time.as_secs_f64() * 1000.0,
        simplification_time.as_secs_f64() * 1000.0,
        svg_generation_time.as_secs_f64() * 1000.0
    );
    log::info!("Edge backend generated {} stroke paths", svg_paths.len());

    Ok(svg_paths)
}

/// Centerline backend: Skeleton + centerline tracing
fn trace_centerline(
    _image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    _config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // TODO: Implement centerline tracing
    // 1. Adaptive threshold (Sauvola)
    // 2. Morphological operations
    // 3. Skeletonization (Zhang-Suen algorithm)
    // 4. Centerline tracing
    // 5. Branch pruning and simplification

    log::warn!("Centerline backend not yet implemented");
    Err(VectorizeError::algorithm_error(
        "Centerline backend not yet implemented",
    ))
}

/// Superpixel backend: Large regions with cell-shaded look
fn trace_superpixel(
    _image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    _config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // TODO: Implement superpixel tracing
    // 1. Bilateral filter for edge-preserving denoise
    // 2. Convert to CIELAB color space
    // 3. SLIC superpixels with adaptive cell size
    // 4. Graph merge in LAB space
    // 5. Extract region contours with DP simplification
    // 6. Optional border strokes

    log::warn!("Superpixel backend not yet implemented");
    Err(VectorizeError::algorithm_error(
        "Superpixel backend not yet implemented",
    ))
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
    for (path, cached) in all_paths
        .into_iter()
        .zip(cached_data.into_iter())
    {
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
                && cached.is_geometrically_similar(&final_cached_data[candidate_idx], 8.0) {
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

        let config = TraceLowConfig {
            backend: TraceBackend::Edge,
            detail: 0.5,
            stroke_px_at_1080p: 1.2,
            enable_multipass: false,
            conservative_detail: None,
            aggressive_detail: None,
            noise_filtering: false,
            enable_reverse_pass: false,
            enable_diagonal_pass: false,
            directional_strength_threshold: 0.3,
            max_processing_time_ms: 1500,
        };

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
}
