# Phase B Rust Module Structure and Trait Definitions
## Error-Driven Refinement Loop Implementation

**Target Location:** `C:\Users\McDon\Repos\vec2art\wasm\vectorize-core\src\refine\`

---

## Module Hierarchy

```
src/refine/
├── mod.rs              // Public API, exports, orchestration
├── rasterize.rs        // SVG → bitmap conversion using resvg/tiny-skia
├── error.rs            // Per-tile error computation (ΔE Lab + SSIM)
├── actions.rs          // Local refinement action implementations
├── loop.rs             // Iteration control and convergence detection
└── types.rs            // Common data structures and enums

#[cfg(test)]
├── rasterize_tests.rs  // Unit tests for SVG rasterization
├── error_tests.rs      // Unit tests for error computation
├── actions_tests.rs    // Unit tests for refinement actions
├── loop_tests.rs       // Unit tests for convergence logic
└── integration_tests.rs // End-to-end refinement pipeline tests
```

---

## 1. Module: `mod.rs` (Public API and Orchestration)

```rust
//! Error-driven refinement loop for vectorization quality improvement
//!
//! This module implements Phase B of the vec2art roadmap, providing an iterative
//! refinement system that improves SVG quality through local error-driven actions.

pub mod rasterize;
pub mod error;
pub mod actions;
pub mod r#loop;
pub mod types;

// Re-export main types and functions
pub use types::{RefineConfig, RefineError, RefineResult, RefinementContext, TileError};
pub use rasterize::{RasterizeBackend, rasterize_svg_to_rgba};
pub use error::{ErrorAnalyzer, compute_tile_errors, TileErrorAnalysis};
pub use actions::{RefinementAction, ActionType, ControlPointAction, RegionSplitAction, FillUpgradeAction};
pub use r#loop::{RefinementLoop, ConvergenceState, run_refinement_loop};

use crate::algorithms::logo::SvgPath;
use image::{ImageBuffer, Rgba};

/// Main entry point for error-driven SVG refinement
///
/// Takes SVG paths from Phase A algorithms and iteratively improves them
/// using tile-based error analysis and local refinement actions.
///
/// # Arguments
/// * `paths` - SVG paths from Phase A vectorization
/// * `original_image` - Original input image for error comparison
/// * `config` - Refinement configuration parameters
///
/// # Returns
/// * `RefineResult<Vec<SvgPath>>` - Refined SVG paths or error
///
/// # Errors
/// * `RefineError::RasterizationFailed` - SVG rasterization failed
/// * `RefineError::ErrorAnalysisFailed` - Tile error computation failed
/// * `RefineError::ActionFailed` - Refinement action application failed
/// * `RefineError::TimeoutExceeded` - Refinement exceeded time budget
pub fn refine_svg_paths(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> RefineResult<Vec<SvgPath>> {
    let mut refinement_loop = RefinementLoop::new(config.clone());
    refinement_loop.run(paths, original_image)
}

/// Convenience function for quick quality assessment without refinement
///
/// Useful for determining if refinement is needed and setting baselines.
///
/// # Arguments
/// * `paths` - SVG paths to analyze
/// * `original_image` - Original image for comparison
/// * `tile_size` - Size of analysis tiles (typically 32x32)
///
/// # Returns
/// * `RefineResult<TileErrorAnalysis>` - Error analysis results
pub fn analyze_svg_quality(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    tile_size: u32,
) -> RefineResult<TileErrorAnalysis> {
    let rasterized = rasterize_svg_to_rgba(paths, original_image.width(), original_image.height())?;
    compute_tile_errors(original_image, &rasterized, tile_size)
}
```

---

## 2. Module: `types.rs` (Common Data Structures)

```rust
//! Common data structures and types for the refinement system

use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Configuration for the error-driven refinement loop
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefineConfig {
    /// Maximum number of refinement iterations
    pub max_iterations: u32,
    
    /// Maximum total time budget for refinement (milliseconds)
    pub max_time_ms: u64,
    
    /// Target Delta E threshold for convergence
    pub target_delta_e: f64,
    
    /// Target SSIM threshold for convergence
    pub target_ssim: f64,
    
    /// Size of analysis tiles (e.g., 32x32 pixels)
    pub tile_size: u32,
    
    /// Maximum number of tiles to process per iteration
    pub max_tiles_per_iteration: u32,
    
    /// Error improvement threshold for plateau detection
    pub error_plateau_threshold: f64,
    
    /// Enable/disable different refinement action types
    pub enable_control_point_insertion: bool,
    pub enable_region_splitting: bool,
    pub enable_fill_upgrades: bool,
}

impl Default for RefineConfig {
    fn default() -> Self {
        Self {
            max_iterations: 2,                    // Roadmap spec
            max_time_ms: 600,                    // Roadmap spec
            target_delta_e: 6.0,                // Roadmap spec
            target_ssim: 0.93,                  // Roadmap spec
            tile_size: 32,                      // Roadmap spec
            max_tiles_per_iteration: 5,         // Reasonable default
            error_plateau_threshold: 0.5,       // 0.5 ΔE improvement required
            enable_control_point_insertion: true,
            enable_region_splitting: true,
            enable_fill_upgrades: true,
        }
    }
}

/// Errors that can occur during refinement
#[derive(Error, Debug)]
pub enum RefineError {
    #[error("SVG rasterization failed: {0}")]
    RasterizationFailed(String),
    
    #[error("Error analysis failed: {0}")]
    ErrorAnalysisFailed(String),
    
    #[error("Refinement action failed: {action_type}: {reason}")]
    ActionFailed { action_type: String, reason: String },
    
    #[error("Time budget exceeded: {elapsed_ms}ms > {budget_ms}ms")]
    TimeoutExceeded { elapsed_ms: u64, budget_ms: u64 },
    
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    
    #[error("Image processing error: {0}")]
    ImageError(String),
}

/// Result type for refinement operations
pub type RefineResult<T> = Result<T, RefineError>;

/// Per-tile error analysis results
#[derive(Debug, Clone)]
pub struct TileError {
    /// Tile position (top-left corner)
    pub x: u32,
    pub y: u32,
    
    /// Tile dimensions
    pub width: u32,
    pub height: u32,
    
    /// Average Delta E across the tile
    pub delta_e_avg: f64,
    
    /// Maximum Delta E within the tile
    pub delta_e_max: f64,
    
    /// SSIM score for the tile (1.0 = perfect, -1.0 = anti-correlated)
    pub ssim: f64,
    
    /// Combined priority score for ranking (higher = worse quality)
    pub priority: f64,
    
    /// Dominant error type in this tile
    pub error_type: TileErrorType,
}

/// Classification of tile error types to guide action selection
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TileErrorType {
    /// Boundary/edge related errors (suggest control point insertion)
    BoundaryDeviation,
    
    /// Interior color gradients not captured (suggest region splitting)
    InteriorGradient,
    
    /// Flat fill insufficient for color variation (suggest fill upgrade)
    ColorVariation,
    
    /// Mixed error types requiring multiple actions
    Mixed,
}

/// Complete error analysis for an image
#[derive(Debug, Clone)]
pub struct TileErrorAnalysis {
    /// All tile errors, sorted by priority (worst first)
    pub tile_errors: Vec<TileError>,
    
    /// Global statistics
    pub global_delta_e_avg: f64,
    pub global_delta_e_median: f64,
    pub global_ssim_avg: f64,
    
    /// Quality assessment
    pub meets_delta_e_target: bool,
    pub meets_ssim_target: bool,
    pub needs_refinement: bool,
}

/// Context passed to refinement actions during execution
#[derive(Debug)]
pub struct RefinementContext {
    /// Current SVG paths being refined
    pub paths: Vec<crate::algorithms::logo::SvgPath>,
    
    /// Original image for reference
    pub original_image: ImageBuffer<Rgba<u8>, Vec<u8>>,
    
    /// Current rasterized version
    pub current_rasterized: ImageBuffer<Rgba<u8>, Vec<u8>>,
    
    /// Refinement configuration
    pub config: RefineConfig,
    
    /// Current iteration number
    pub iteration: u32,
    
    /// Time when refinement started
    pub start_time: Instant,
    
    /// Accumulated time spent on actions
    pub action_time: Duration,
}

/// Result of applying a refinement action
#[derive(Debug)]
pub struct ActionResult {
    /// Whether the action was successfully applied
    pub success: bool,
    
    /// Estimated improvement in Delta E
    pub delta_e_improvement: f64,
    
    /// Time taken to apply the action
    pub duration: Duration,
    
    /// Modified paths (if any)
    pub modified_paths: Option<Vec<crate::algorithms::logo::SvgPath>>,
    
    /// Human-readable description of what was done
    pub description: String,
}

/// Convergence state tracking
#[derive(Debug, Clone)]
pub struct ConvergenceState {
    /// Current iteration number
    pub iteration: u32,
    
    /// When refinement started
    pub start_time: Instant,
    
    /// Current error metrics
    pub current_delta_e: f64,
    pub current_ssim: f64,
    
    /// Previous iteration metrics (for plateau detection)
    pub previous_delta_e: Option<f64>,
    pub previous_ssim: Option<f64>,
    
    /// Whether convergence has been achieved
    pub has_converged: bool,
    
    /// Reason for convergence (if any)
    pub convergence_reason: Option<String>,
}
```

---

## 3. Module: `rasterize.rs` (SVG → Bitmap Conversion)

```rust
//! SVG rasterization using resvg and tiny-skia
//!
//! Converts SVG paths back to bitmap images for error analysis.

use image::{ImageBuffer, Rgba, RgbaImage};
use resvg::{Tree, Options as ResvgOptions};
use tiny_skia::{Pixmap, Transform};
use crate::algorithms::logo::SvgPath;
use super::types::{RefineError, RefineResult};

/// Backend for SVG rasterization
pub trait RasterizeBackend {
    /// Rasterize SVG content to RGBA image buffer
    fn rasterize(
        &self,
        svg_content: &str,
        width: u32,
        height: u32,
    ) -> RefineResult<RgbaImage>;
}

/// Resvg-based rasterization backend using tiny-skia
#[derive(Debug, Clone)]
pub struct ResvgBackend {
    options: ResvgOptions,
}

impl ResvgBackend {
    pub fn new() -> Self {
        Self {
            options: ResvgOptions::default(),
        }
    }
    
    pub fn with_options(options: ResvgOptions) -> Self {
        Self { options }
    }
}

impl Default for ResvgBackend {
    fn default() -> Self {
        Self::new()
    }
}

impl RasterizeBackend for ResvgBackend {
    fn rasterize(
        &self,
        svg_content: &str,
        width: u32,
        height: u32,
    ) -> RefineResult<RgbaImage> {
        // Parse SVG
        let tree = Tree::from_str(svg_content, &self.options)
            .map_err(|e| RefineError::RasterizationFailed(format!("SVG parse error: {}", e)))?;
        
        // Create pixmap
        let mut pixmap = Pixmap::new(width, height)
            .ok_or_else(|| RefineError::RasterizationFailed("Failed to create pixmap".to_string()))?;
        
        // Render SVG to pixmap
        tree.render(Transform::identity(), &mut pixmap.as_mut());
        
        // Convert tiny-skia RGBA8 to image crate format
        let rgba_data = pixmap.take();
        ImageBuffer::from_raw(width, height, rgba_data)
            .ok_or_else(|| RefineError::RasterizationFailed("Failed to convert pixmap to ImageBuffer".to_string()))
    }
}

/// Convert SVG paths to SVG document string
pub fn paths_to_svg_document(
    paths: &[SvgPath],
    width: u32,
    height: u32,
) -> String {
    use crate::svg::generate_svg_document;
    use crate::config::SvgConfig;
    
    let svg_config = SvgConfig::default();
    generate_svg_document(paths, width, height, &svg_config)
}

/// Main convenience function for rasterizing SVG paths
pub fn rasterize_svg_to_rgba(
    paths: &[SvgPath],
    width: u32,
    height: u32,
) -> RefineResult<RgbaImage> {
    let svg_content = paths_to_svg_document(paths, width, height);
    let backend = ResvgBackend::default();
    backend.rasterize(&svg_content, width, height)
}

/// Validate rasterization accuracy by comparing to reference implementation
#[cfg(test)]
pub fn validate_rasterization_accuracy(
    svg_content: &str,
    width: u32,
    height: u32,
) -> RefineResult<bool> {
    let backend = ResvgBackend::default();
    let result = backend.rasterize(svg_content, width, height)?;
    
    // Basic validation: ensure dimensions are correct
    if result.width() != width || result.height() != height {
        return Ok(false);
    }
    
    // Additional validation: ensure non-empty result for non-empty SVG
    if !svg_content.trim().is_empty() && result.pixels().all(|p| p.0[3] == 0) {
        return Ok(false);
    }
    
    Ok(true)
}
```

---

## 4. Module: `error.rs` (Per-Tile Error Computation)

```rust
//! Tile-based error analysis using Delta E and SSIM
//!
//! Computes per-tile quality metrics to identify areas needing refinement.

use image::{ImageBuffer, Rgba, RgbaImage};
use palette::{Lab, Srgb, color_difference::DeltaE};
use dssim::{Dssim, DssimImage};
use super::types::{RefineError, RefineResult, TileError, TileErrorAnalysis, TileErrorType};

/// Trait for error analysis implementations
pub trait ErrorAnalyzer {
    /// Compute tile-based error analysis between two images
    fn analyze_tiles(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
        tile_size: u32,
    ) -> RefineResult<TileErrorAnalysis>;
    
    /// Compute global error metrics
    fn analyze_global(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
    ) -> RefineResult<(f64, f64)>; // (delta_e_avg, ssim)
}

/// Default error analyzer using Delta E (Lab) and SSIM
#[derive(Debug, Clone)]
pub struct DeltaESSIMAnalyzer {
    /// SSIM analyzer instance
    ssim_analyzer: Dssim,
}

impl DeltaESSIMAnalyzer {
    pub fn new() -> RefineResult<Self> {
        let ssim_analyzer = Dssim::new()
            .map_err(|e| RefineError::ErrorAnalysisFailed(format!("Failed to create SSIM analyzer: {}", e)))?;
        
        Ok(Self { ssim_analyzer })
    }
}

impl Default for DeltaESSIMAnalyzer {
    fn default() -> Self {
        Self::new().expect("Failed to create default DeltaESSIMAnalyzer")
    }
}

impl ErrorAnalyzer for DeltaESSIMAnalyzer {
    fn analyze_tiles(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
        tile_size: u32,
    ) -> RefineResult<TileErrorAnalysis> {
        let width = original.width();
        let height = original.height();
        
        if rasterized.width() != width || rasterized.height() != height {
            return Err(RefineError::ErrorAnalysisFailed(
                "Image dimensions do not match".to_string()
            ));
        }
        
        let mut tile_errors = Vec::new();
        let mut global_delta_e_sum = 0.0;
        let mut global_ssim_sum = 0.0;
        let mut tile_count = 0;
        
        // Process each tile
        for tile_y in (0..height).step_by(tile_size as usize) {
            for tile_x in (0..width).step_by(tile_size as usize) {
                let tile_width = (width - tile_x).min(tile_size);
                let tile_height = (height - tile_y).min(tile_size);
                
                let tile_error = self.analyze_single_tile(
                    original, rasterized,
                    tile_x, tile_y, tile_width, tile_height
                )?;
                
                global_delta_e_sum += tile_error.delta_e_avg;
                global_ssim_sum += tile_error.ssim;
                tile_count += 1;
                
                tile_errors.push(tile_error);
            }
        }
        
        // Sort by priority (worst first)
        tile_errors.sort_by(|a, b| b.priority.partial_cmp(&a.priority).unwrap());
        
        // Compute global metrics
        let global_delta_e_avg = global_delta_e_sum / tile_count as f64;
        let global_ssim_avg = global_ssim_sum / tile_count as f64;
        
        // Compute median Delta E
        let mut delta_e_values: Vec<f64> = tile_errors.iter().map(|t| t.delta_e_avg).collect();
        delta_e_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let global_delta_e_median = if delta_e_values.is_empty() {
            0.0
        } else if delta_e_values.len() % 2 == 0 {
            let mid = delta_e_values.len() / 2;
            (delta_e_values[mid - 1] + delta_e_values[mid]) / 2.0
        } else {
            delta_e_values[delta_e_values.len() / 2]
        };
        
        Ok(TileErrorAnalysis {
            tile_errors,
            global_delta_e_avg,
            global_delta_e_median,
            global_ssim_avg,
            meets_delta_e_target: global_delta_e_median <= 6.0,
            meets_ssim_target: global_ssim_avg >= 0.93,
            needs_refinement: global_delta_e_median > 6.0 || global_ssim_avg < 0.93,
        })
    }
    
    fn analyze_global(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
    ) -> RefineResult<(f64, f64)> {
        let analysis = self.analyze_tiles(original, rasterized, 32)?;
        Ok((analysis.global_delta_e_avg, analysis.global_ssim_avg))
    }
}

impl DeltaESSIMAnalyzer {
    /// Analyze a single tile for error metrics
    fn analyze_single_tile(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
        tile_x: u32,
        tile_y: u32,
        tile_width: u32,
        tile_height: u32,
    ) -> RefineResult<TileError> {
        // Extract tile data
        let orig_tile = self.extract_tile(original, tile_x, tile_y, tile_width, tile_height);
        let rast_tile = self.extract_tile(rasterized, tile_x, tile_y, tile_width, tile_height);
        
        // Compute Delta E for tile
        let (delta_e_avg, delta_e_max) = self.compute_tile_delta_e(&orig_tile, &rast_tile)?;
        
        // Compute SSIM for tile
        let ssim = self.compute_tile_ssim(&orig_tile, &rast_tile)?;
        
        // Compute priority score (higher = worse quality)
        let priority = self.compute_priority_score(delta_e_avg, ssim);
        
        // Classify error type
        let error_type = self.classify_error_type(&orig_tile, &rast_tile, delta_e_avg, ssim);
        
        Ok(TileError {
            x: tile_x,
            y: tile_y,
            width: tile_width,
            height: tile_height,
            delta_e_avg,
            delta_e_max,
            ssim,
            priority,
            error_type,
        })
    }
    
    /// Extract a tile from an image
    fn extract_tile(
        &self,
        image: &RgbaImage,
        x: u32,
        y: u32,
        width: u32,
        height: u32,
    ) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |tx, ty| {
            *image.get_pixel(x + tx, y + ty)
        })
    }
    
    /// Compute Delta E metrics for a tile
    fn compute_tile_delta_e(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
    ) -> RefineResult<(f64, f64)> {
        let mut delta_e_sum = 0.0;
        let mut delta_e_max = 0.0;
        let mut pixel_count = 0;
        
        for (orig_pixel, rast_pixel) in original.pixels().zip(rasterized.pixels()) {
            // Skip fully transparent pixels
            if orig_pixel.0[3] < 10 && rast_pixel.0[3] < 10 {
                continue;
            }
            
            // Convert to Lab colorspace
            let orig_rgb = Srgb::new(
                orig_pixel.0[0] as f32 / 255.0,
                orig_pixel.0[1] as f32 / 255.0,
                orig_pixel.0[2] as f32 / 255.0,
            );
            let rast_rgb = Srgb::new(
                rast_pixel.0[0] as f32 / 255.0,
                rast_pixel.0[1] as f32 / 255.0,
                rast_pixel.0[2] as f32 / 255.0,
            );
            
            let orig_lab: Lab = orig_rgb.into();
            let rast_lab: Lab = rast_rgb.into();
            
            // Compute Delta E (CIEDE2000)
            let delta_e = orig_lab.delta_e(rast_lab);
            
            delta_e_sum += delta_e as f64;
            delta_e_max = delta_e_max.max(delta_e as f64);
            pixel_count += 1;
        }
        
        let delta_e_avg = if pixel_count > 0 {
            delta_e_sum / pixel_count as f64
        } else {
            0.0
        };
        
        Ok((delta_e_avg, delta_e_max))
    }
    
    /// Compute SSIM for a tile
    fn compute_tile_ssim(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
    ) -> RefineResult<f64> {
        // Convert to DssimImage format
        let orig_dssim = DssimImage::new(original.as_raw(), original.width() as usize, original.height() as usize)
            .map_err(|e| RefineError::ErrorAnalysisFailed(format!("Failed to create DSSIM image: {}", e)))?;
        let rast_dssim = DssimImage::new(rasterized.as_raw(), rasterized.width() as usize, rasterized.height() as usize)
            .map_err(|e| RefineError::ErrorAnalysisFailed(format!("Failed to create DSSIM image: {}", e)))?;
        
        // Compute SSIM (dssim returns dissimilarity, so convert to similarity)
        let dssim_score = self.ssim_analyzer.compare(&orig_dssim, &rast_dssim);
        let ssim = 1.0 / (1.0 + dssim_score);
        
        Ok(ssim)
    }
    
    /// Compute priority score for tile ranking
    fn compute_priority_score(&self, delta_e_avg: f64, ssim: f64) -> f64 {
        // Combined metric: normalized Delta E + normalized SSIM dissimilarity
        let normalized_delta_e = delta_e_avg / 6.0;  // Target is ≤ 6.0
        let normalized_ssim_dissim = (1.0 - ssim) / 0.07;  // Target is ≥ 0.93, so dissim should be ≤ 0.07
        
        normalized_delta_e + normalized_ssim_dissim
    }
    
    /// Classify the type of error in a tile
    fn classify_error_type(
        &self,
        original: &RgbaImage,
        rasterized: &RgbaImage,
        delta_e_avg: f64,
        ssim: f64,
    ) -> TileErrorType {
        // Simple heuristic classification
        // TODO: Implement more sophisticated error type detection
        
        if ssim < 0.85 && delta_e_avg > 8.0 {
            TileErrorType::Mixed
        } else if ssim < 0.90 {
            TileErrorType::BoundaryDeviation
        } else if delta_e_avg > 7.0 {
            TileErrorType::ColorVariation
        } else if delta_e_avg > 5.0 {
            TileErrorType::InteriorGradient
        } else {
            TileErrorType::ColorVariation
        }
    }
}

/// Main convenience function for tile error analysis
pub fn compute_tile_errors(
    original: &RgbaImage,
    rasterized: &RgbaImage,
    tile_size: u32,
) -> RefineResult<TileErrorAnalysis> {
    let analyzer = DeltaESSIMAnalyzer::new()?;
    analyzer.analyze_tiles(original, rasterized, tile_size)
}
```

---

## 5. Module: `actions.rs` (Local Refinement Actions)

```rust
//! Local refinement action implementations
//!
//! Provides specific algorithms for improving SVG quality through targeted modifications.

use std::time::{Duration, Instant};
use crate::algorithms::logo::SvgPath;
use crate::tracing::fit::{Point2D, CubicBezier, fit_cubic_bezier};
use crate::segmentation::rag::RegionProperties;
use crate::fills::gradients::{Gradient, GradientType, GradientStop};
use super::types::{RefineResult, RefineError, TileError, TileErrorType, RefinementContext, ActionResult};

/// Types of refinement actions available
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ActionType {
    ControlPointInsertion,
    RegionSplitting,
    FillUpgrade,
}

/// Trait for refinement actions
pub trait RefinementAction: std::fmt::Debug + Send + Sync {
    /// Check if this action can be applied to the given tile
    fn can_apply(&self, tile: &TileError, context: &RefinementContext) -> bool;
    
    /// Apply the refinement action
    fn apply(&self, tile: &TileError, context: &mut RefinementContext) -> RefineResult<ActionResult>;
    
    /// Estimate the computational cost of applying this action
    fn cost_estimate(&self, tile: &TileError, context: &RefinementContext) -> Duration;
    
    /// Get the action type
    fn action_type(&self) -> ActionType;
    
    /// Get a human-readable description
    fn description(&self) -> &'static str;
}

/// Control point insertion action for cubic Bézier curves
#[derive(Debug, Clone)]
pub struct ControlPointAction {
    /// Minimum error threshold to trigger action
    pub min_boundary_error: f64,
    
    /// Maximum segments to subdivide per action
    pub max_subdivisions_per_action: u32,
}

impl Default for ControlPointAction {
    fn default() -> Self {
        Self {
            min_boundary_error: 8.0,  // ΔE threshold
            max_subdivisions_per_action: 3,
        }
    }
}

impl RefinementAction for ControlPointAction {
    fn can_apply(&self, tile: &TileError, context: &RefinementContext) -> bool {
        // Apply to boundary deviation errors with sufficient severity
        matches!(tile.error_type, TileErrorType::BoundaryDeviation | TileErrorType::Mixed) &&
        tile.delta_e_avg > self.min_boundary_error &&
        context.config.enable_control_point_insertion
    }
    
    fn apply(&self, tile: &TileError, context: &mut RefinementContext) -> RefineResult<ActionResult> {
        let start_time = Instant::now();
        let mut modified_paths = context.paths.clone();
        let mut subdivisions_applied = 0;
        let mut total_improvement = 0.0;
        
        // Find paths that intersect with the error tile
        for (path_idx, path) in modified_paths.iter_mut().enumerate() {
            if subdivisions_applied >= self.max_subdivisions_per_action {
                break;
            }
            
            // Check if path intersects tile bounds
            if self.path_intersects_tile(path, tile) {
                // Apply cubic Bézier subdivision
                if let Some(improvement) = self.subdivide_path_in_tile(path, tile)? {
                    total_improvement += improvement;
                    subdivisions_applied += 1;
                }
            }
        }
        
        let duration = start_time.elapsed();
        let success = subdivisions_applied > 0;
        
        Ok(ActionResult {
            success,
            delta_e_improvement: total_improvement,
            duration,
            modified_paths: if success { Some(modified_paths) } else { None },
            description: format!("Added {} control points via subdivision", subdivisions_applied),
        })
    }
    
    fn cost_estimate(&self, tile: &TileError, context: &RefinementContext) -> Duration {
        // Estimate based on number of paths that might intersect tile
        let estimated_paths = context.paths.len().min(5); // Conservative estimate
        Duration::from_millis(10 * estimated_paths as u64)
    }
    
    fn action_type(&self) -> ActionType {
        ActionType::ControlPointInsertion
    }
    
    fn description(&self) -> &'static str {
        "Insert control points via cubic Bézier subdivision"
    }
}

impl ControlPointAction {
    /// Check if a path intersects with the error tile bounds
    fn path_intersects_tile(&self, path: &SvgPath, tile: &TileError) -> bool {
        // TODO: Implement proper path-rectangle intersection test
        // For now, simple bounding box check
        true  // Placeholder
    }
    
    /// Subdivide path segments within the tile to reduce error
    fn subdivide_path_in_tile(&self, path: &mut SvgPath, tile: &TileError) -> RefineResult<Option<f64>> {
        // TODO: Implement actual subdivision algorithm
        // 1. Parse path data to extract cubic Bézier segments
        // 2. For each segment intersecting tile, compute error
        // 3. Apply De Casteljau subdivision at optimal parameter
        // 4. Replace segment with two sub-segments
        // 5. Return estimated improvement
        Ok(Some(1.0))  // Placeholder
    }
}

/// Region splitting action for gradient field-based segmentation
#[derive(Debug, Clone)]
pub struct RegionSplitAction {
    /// Minimum gradient strength to trigger splitting
    pub min_gradient_strength: f64,
    
    /// Maximum region splits per action
    pub max_splits_per_action: u32,
}

impl Default for RegionSplitAction {
    fn default() -> Self {
        Self {
            min_gradient_strength: 15.0,  // Gradient magnitude threshold
            max_splits_per_action: 2,
        }
    }
}

impl RefinementAction for RegionSplitAction {
    fn can_apply(&self, tile: &TileError, context: &RefinementContext) -> bool {
        // Apply to interior gradient errors
        matches!(tile.error_type, TileErrorType::InteriorGradient | TileErrorType::Mixed) &&
        tile.delta_e_avg > 6.0 &&
        context.config.enable_region_splitting
    }
    
    fn apply(&self, tile: &TileError, context: &mut RefinementContext) -> RefineResult<ActionResult> {
        let start_time = Instant::now();
        
        // TODO: Implement gradient field-based region splitting
        // 1. Extract tile region from original image
        // 2. Compute gradient field
        // 3. Apply watershed transform to find split boundaries
        // 4. Generate new region boundaries as cubic Bézier paths
        // 5. Update SVG paths with new regions
        
        let duration = start_time.elapsed();
        
        Ok(ActionResult {
            success: false,  // Placeholder
            delta_e_improvement: 0.0,
            duration,
            modified_paths: None,
            description: "Applied gradient field-based region splitting".to_string(),
        })
    }
    
    fn cost_estimate(&self, _tile: &TileError, _context: &RefinementContext) -> Duration {
        Duration::from_millis(50)  // More expensive than control point insertion
    }
    
    fn action_type(&self) -> ActionType {
        ActionType::RegionSplitting
    }
    
    fn description(&self) -> &'static str {
        "Split regions along strong gradients"
    }
}

/// Fill upgrade action for flat → gradient conversion
#[derive(Debug, Clone)]
pub struct FillUpgradeAction {
    /// Minimum color variation to trigger upgrade
    pub min_color_variation: f64,
    
    /// Maximum fills to upgrade per action
    pub max_upgrades_per_action: u32,
}

impl Default for FillUpgradeAction {
    fn default() -> Self {
        Self {
            min_color_variation: 5.0,  // ΔE variation threshold
            max_upgrades_per_action: 2,
        }
    }
}

impl RefinementAction for FillUpgradeAction {
    fn can_apply(&self, tile: &TileError, context: &RefinementContext) -> bool {
        // Apply to color variation errors where flat fills are insufficient
        matches!(tile.error_type, TileErrorType::ColorVariation | TileErrorType::Mixed) &&
        tile.delta_e_avg > self.min_color_variation &&
        context.config.enable_fill_upgrades
    }
    
    fn apply(&self, tile: &TileError, context: &mut RefinementContext) -> RefineResult<ActionResult> {
        let start_time = Instant::now();
        
        // TODO: Implement PCA-based gradient generation
        // 1. Identify regions with flat fills in the error tile
        // 2. Extract color distribution from original image
        // 3. Apply PCA to find principal color variation axis
        // 4. Generate linear or radial gradient with 2-3 stops
        // 5. Replace flat fills with gradients in SVG paths
        
        let duration = start_time.elapsed();
        
        Ok(ActionResult {
            success: false,  // Placeholder
            delta_e_improvement: 0.0,
            duration,
            modified_paths: None,
            description: "Upgraded flat fills to gradients".to_string(),
        })
    }
    
    fn cost_estimate(&self, _tile: &TileError, _context: &RefinementContext) -> Duration {
        Duration::from_millis(30)  // Moderate computational cost
    }
    
    fn action_type(&self) -> ActionType {
        ActionType::FillUpgrade
    }
    
    fn description(&self) -> &'static str {
        "Upgrade flat fills to gradients using PCA"
    }
}

/// Action factory for creating and managing refinement actions
#[derive(Debug)]
pub struct ActionFactory {
    actions: Vec<Box<dyn RefinementAction>>,
}

impl ActionFactory {
    /// Create default action factory with all standard actions
    pub fn new() -> Self {
        let actions: Vec<Box<dyn RefinementAction>> = vec![
            Box::new(ControlPointAction::default()),
            Box::new(RegionSplitAction::default()),
            Box::new(FillUpgradeAction::default()),
        ];
        
        Self { actions }
    }
    
    /// Get all actions that can be applied to a tile
    pub fn get_applicable_actions<'a>(
        &'a self,
        tile: &TileError,
        context: &RefinementContext,
    ) -> Vec<&'a dyn RefinementAction> {
        self.actions
            .iter()
            .filter(|action| action.can_apply(tile, context))
            .map(|action| action.as_ref())
            .collect()
    }
    
    /// Select the best action for a tile based on cost/benefit analysis
    pub fn select_best_action<'a>(
        &'a self,
        tile: &TileError,
        context: &RefinementContext,
        time_remaining: Duration,
    ) -> Option<&'a dyn RefinementAction> {
        let applicable_actions = self.get_applicable_actions(tile, context);
        
        // Select action with best cost/benefit ratio that fits in time budget
        applicable_actions
            .into_iter()
            .filter(|action| action.cost_estimate(tile, context) <= time_remaining)
            .min_by_key(|action| action.cost_estimate(tile, context))
    }
}

impl Default for ActionFactory {
    fn default() -> Self {
        Self::new()
    }
}
```

---

## 6. Module: `loop.rs` (Iteration Control)

```rust
//! Refinement loop control and convergence detection
//!
//! Manages the iterative refinement process with time budgets and convergence criteria.

use std::time::{Duration, Instant};
use image::{ImageBuffer, Rgba};
use crate::algorithms::logo::SvgPath;
use super::types::{RefineConfig, RefineResult, RefineError, RefinementContext, ConvergenceState, TileErrorAnalysis};
use super::rasterize::rasterize_svg_to_rgba;
use super::error::{ErrorAnalyzer, DeltaESSIMAnalyzer};
use super::actions::ActionFactory;

/// Main refinement loop controller
#[derive(Debug)]
pub struct RefinementLoop {
    config: RefineConfig,
    action_factory: ActionFactory,
    error_analyzer: DeltaESSIMAnalyzer,
}

impl RefinementLoop {
    /// Create new refinement loop with configuration
    pub fn new(config: RefineConfig) -> Self {
        Self {
            config,
            action_factory: ActionFactory::new(),
            error_analyzer: DeltaESSIMAnalyzer::new()
                .expect("Failed to create error analyzer"),
        }
    }
    
    /// Run the complete refinement process
    pub fn run(
        &mut self,
        initial_paths: &[SvgPath],
        original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> RefineResult<Vec<SvgPath>> {
        let start_time = Instant::now();
        let mut current_paths = initial_paths.to_vec();
        
        // Initial quality assessment
        let initial_rasterized = rasterize_svg_to_rgba(&current_paths, original_image.width(), original_image.height())?;
        let mut current_analysis = self.error_analyzer.analyze_tiles(
            original_image,
            &initial_rasterized,
            self.config.tile_size,
        )?;
        
        // Check if refinement is needed
        if !current_analysis.needs_refinement {
            log::info!("Initial quality meets targets, skipping refinement");
            return Ok(current_paths);
        }
        
        // Initialize convergence state
        let mut convergence_state = ConvergenceState {
            iteration: 0,
            start_time,
            current_delta_e: current_analysis.global_delta_e_median,
            current_ssim: current_analysis.global_ssim_avg,
            previous_delta_e: None,
            previous_ssim: None,
            has_converged: false,
            convergence_reason: None,
        };
        
        log::info!("Starting refinement: initial ΔE={:.2}, SSIM={:.3}", 
                   convergence_state.current_delta_e, convergence_state.current_ssim);
        
        // Main refinement loop
        while !convergence_state.has_converged {
            let iteration_start = Instant::now();
            convergence_state.iteration += 1;
            
            log::info!("Refinement iteration {}", convergence_state.iteration);
            
            // Create refinement context
            let current_rasterized = rasterize_svg_to_rgba(&current_paths, original_image.width(), original_image.height())?;
            let mut context = RefinementContext {
                paths: current_paths.clone(),
                original_image: original_image.clone(),
                current_rasterized,
                config: self.config.clone(),
                iteration: convergence_state.iteration,
                start_time,
                action_time: Duration::default(),
            };
            
            // Apply refinement actions to worst tiles
            let refinement_result = self.apply_refinement_iteration(&mut context, &current_analysis)?;
            
            if refinement_result.actions_applied == 0 {
                convergence_state.has_converged = true;
                convergence_state.convergence_reason = Some("No applicable actions found".to_string());
                break;
            }
            
            // Update paths if actions were successful
            if let Some(refined_paths) = refinement_result.refined_paths {
                current_paths = refined_paths;
            }
            
            // Re-analyze quality after refinement
            let new_rasterized = rasterize_svg_to_rgba(&current_paths, original_image.width(), original_image.height())?;
            current_analysis = self.error_analyzer.analyze_tiles(
                original_image,
                &new_rasterized,
                self.config.tile_size,
            )?;
            
            // Update convergence state
            convergence_state.previous_delta_e = Some(convergence_state.current_delta_e);
            convergence_state.previous_ssim = Some(convergence_state.current_ssim);
            convergence_state.current_delta_e = current_analysis.global_delta_e_median;
            convergence_state.current_ssim = current_analysis.global_ssim_avg;
            
            let iteration_time = iteration_start.elapsed();
            log::info!("Iteration {} completed in {:?}: ΔE={:.2}, SSIM={:.3}, {} actions applied",
                      convergence_state.iteration, iteration_time, 
                      convergence_state.current_delta_e, convergence_state.current_ssim,
                      refinement_result.actions_applied);
            
            // Check convergence
            convergence_state.has_converged = self.check_convergence(&convergence_state);
        }
        
        let total_time = start_time.elapsed();
        log::info!("Refinement completed in {:?}: {} iterations, final ΔE={:.2}, SSIM={:.3}, reason: {:?}",
                   total_time, convergence_state.iteration, 
                   convergence_state.current_delta_e, convergence_state.current_ssim,
                   convergence_state.convergence_reason);
        
        Ok(current_paths)
    }
    
    /// Apply refinement actions for a single iteration
    fn apply_refinement_iteration(
        &self,
        context: &mut RefinementContext,
        error_analysis: &TileErrorAnalysis,
    ) -> RefineResult<IterationResult> {
        let iteration_start = Instant::now();
        let mut actions_applied = 0;
        let mut total_improvement = 0.0;
        let mut current_paths = context.paths.clone();
        
        // Select worst tiles for refinement (limited by config)
        let tiles_to_process = error_analysis.tile_errors
            .iter()
            .take(self.config.max_tiles_per_iteration as usize)
            .collect::<Vec<_>>();
        
        log::debug!("Processing {} tiles for refinement", tiles_to_process.len());
        
        // Apply actions to selected tiles
        for tile in tiles_to_process {
            // Check time budget
            let elapsed = iteration_start.elapsed();
            let time_budget = Duration::from_millis(self.config.max_time_ms);
            if elapsed >= time_budget {
                log::warn!("Time budget exceeded during iteration");
                break;
            }
            
            let time_remaining = time_budget - elapsed;
            
            // Select and apply best action for this tile
            if let Some(action) = self.action_factory.select_best_action(tile, context, time_remaining) {
                match action.apply(tile, context) {
                    Ok(result) if result.success => {
                        actions_applied += 1;
                        total_improvement += result.delta_e_improvement;
                        context.action_time += result.duration;
                        
                        // Update paths if modified
                        if let Some(modified_paths) = result.modified_paths {
                            current_paths = modified_paths;
                            context.paths = current_paths.clone();
                        }
                        
                        log::debug!("Applied {}: {} (improvement: {:.2} ΔE)", 
                                   action.description(), result.description, result.delta_e_improvement);
                    }
                    Ok(result) => {
                        log::debug!("Action {} failed: {}", action.description(), result.description);
                    }
                    Err(e) => {
                        log::warn!("Action {} error: {}", action.description(), e);
                    }
                }
            } else {
                log::debug!("No applicable actions for tile at ({}, {})", tile.x, tile.y);
            }
        }
        
        Ok(IterationResult {
            actions_applied,
            total_improvement,
            refined_paths: if actions_applied > 0 { Some(current_paths) } else { None },
            iteration_time: iteration_start.elapsed(),
        })
    }
    
    /// Check if convergence criteria have been met
    fn check_convergence(&self, state: &ConvergenceState) -> bool {
        // Time budget exceeded
        if state.start_time.elapsed() >= Duration::from_millis(self.config.max_time_ms) {
            log::info!("Convergence: Time budget exceeded");
            return true;
        }
        
        // Maximum iterations reached
        if state.iteration >= self.config.max_iterations {
            log::info!("Convergence: Maximum iterations reached");
            return true;
        }
        
        // Quality targets achieved
        if state.current_delta_e <= self.config.target_delta_e && 
           state.current_ssim >= self.config.target_ssim {
            log::info!("Convergence: Quality targets achieved");
            return true;
        }
        
        // Error plateau detected
        if let Some(previous_delta_e) = state.previous_delta_e {
            let improvement = previous_delta_e - state.current_delta_e;
            if improvement < self.config.error_plateau_threshold {
                log::info!("Convergence: Error plateau detected (improvement: {:.3})", improvement);
                return true;
            }
        }
        
        false
    }
}

/// Result of a single refinement iteration
#[derive(Debug)]
struct IterationResult {
    /// Number of actions successfully applied
    actions_applied: u32,
    
    /// Total estimated improvement in Delta E
    total_improvement: f64,
    
    /// Refined paths (if any actions were applied)
    refined_paths: Option<Vec<SvgPath>>,
    
    /// Time taken for the iteration
    iteration_time: Duration,
}

/// Convenience function for running the complete refinement process
pub fn run_refinement_loop(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> RefineResult<Vec<SvgPath>> {
    let mut refinement_loop = RefinementLoop::new(config.clone());
    refinement_loop.run(paths, original_image)
}
```

---

## Summary

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Research SVG rasterization libraries (resvg, tiny-skia, Cairo) for CPU-based SVG-to-bitmap conversion", "status": "completed"}, {"id": "2", "content": "Analyze per-tile error computation methods (\u0394E Lab colorspace, SSIM) for 32x32 tile-based quality assessment", "status": "completed"}, {"id": "3", "content": "Design local refinement action algorithms: add control point, split region, upgrade fill strategies", "status": "completed"}, {"id": "4", "content": "Research iteration control and convergence detection for error-driven loops with time budgets", "status": "completed"}, {"id": "5", "content": "Create implementation plan integrating Phase B refinement with existing Phase A modules", "status": "completed"}, {"id": "6", "content": "Define Rust module structure and traits for refine/ components (rasterize.rs, error.rs, actions.rs, loop.rs)", "status": "completed"}]