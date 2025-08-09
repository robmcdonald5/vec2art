//! Error-driven refinement loop for improving vectorization quality
//! 
//! This module implements Phase B of the vec2art roadmap: an iterative refinement
//! system that analyzes rendering errors between the original image and rasterized
//! SVG, then applies targeted local improvements to achieve quality targets:
//! - ΔE ≤ 6.0 (perceptual color accuracy)
//! - SSIM ≥ 0.93 (structural similarity)
//! - ≤ 600ms refinement budget (performance constraint)

pub mod rasterize;
pub mod error;
pub mod actions;
pub mod loop_;

// Re-export main types
pub use rasterize::{rasterize_svg_to_rgba, RasterError};
pub use error::{TileError, compute_tile_errors};
pub use actions::{
    RefinementAction, ControlPointAction, RegionSplitAction, FillUpgradeAction,
    add_control_point_bezier_subdivision, split_region_gradient_field, upgrade_fill_pca_gradient
};
pub use loop_::{
    RefineConfig, RefinementBudget, ConvergenceState, 
    refine_svg_paths, check_convergence
};

use crate::algorithms::logo::SvgPath;
use image::{ImageBuffer, Rgba};
use crate::error::VectorizeResult;

/// Main entry point for Phase B refinement pipeline
/// 
/// Takes paths from Phase A algorithms and iteratively improves them through
/// error analysis and local refinement actions until quality targets are met
/// or time budget is exhausted.
/// 
/// # Arguments
/// * `paths` - SVG paths from Phase A vectorization
/// * `original_image` - Original input image for comparison
/// * `config` - Refinement configuration and quality targets
/// 
/// # Returns
/// * `VectorizeResult<Vec<SvgPath>>` - Refined SVG paths with improved quality
/// 
/// # Quality Targets
/// * ΔE ≤ 6.0 - Perceptual color difference in LAB space
/// * SSIM ≥ 0.93 - Structural similarity (grayscale)
/// * ≤ 600ms - Total refinement time budget
pub fn refine_vectorization(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> VectorizeResult<Vec<SvgPath>> {
    refine_svg_paths(paths, original_image, config)
}

/// Configuration presets for different refinement scenarios
impl RefineConfig {
    /// Aggressive refinement for maximum quality (photography)
    pub fn aggressive() -> Self {
        Self {
            max_iterations: 3,
            max_time_ms: 800,
            target_delta_e: 5.0,
            target_ssim: 0.95,
            tile_size: 16,  // Smaller tiles for finer analysis
            max_tiles_per_iteration: 8,
            error_plateau_threshold: 0.3,
        }
    }
    
    /// Balanced refinement for typical usage
    pub fn balanced() -> Self {
        Self::default()
    }
    
    /// Fast refinement for quick previews
    pub fn fast() -> Self {
        Self {
            max_iterations: 1,
            max_time_ms: 200,
            target_delta_e: 8.0,
            target_ssim: 0.90,
            tile_size: 64,  // Larger tiles for coarser analysis
            max_tiles_per_iteration: 3,
            error_plateau_threshold: 1.0,
        }
    }
}