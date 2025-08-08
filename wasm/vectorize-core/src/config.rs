//! Configuration types for vectorization algorithms

use serde::{Deserialize, Serialize};

/// Configuration for logo/line-art vectorization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoConfig {
    /// Maximum width/height to resize input image to (for performance)
    pub max_dimension: u32,

    /// Binary threshold value (0-255)
    pub threshold: u8,

    /// Whether to use adaptive thresholding
    pub adaptive_threshold: bool,

    /// Morphological operations to clean up binary image
    pub morphology_kernel_size: u32,

    /// Minimum contour area to keep (filters noise)
    pub min_contour_area: u32,

    /// Path simplification tolerance (Douglas-Peucker)
    pub simplification_tolerance: f64,

    /// Whether to fit Bezier curves to simplified paths
    pub fit_curves: bool,

    /// Curve fitting error tolerance
    pub curve_tolerance: f64,
}

impl Default for LogoConfig {
    fn default() -> Self {
        Self {
            max_dimension: 512,        // Reduced from 1024 for better performance
            threshold: 128,
            adaptive_threshold: false,
            morphology_kernel_size: 2, // Reduced from 3 to minimize artifacts
            min_contour_area: 25,      // Reduced from 50 to keep more detail
            simplification_tolerance: 1.0,
            fit_curves: true,
            curve_tolerance: 2.0,
        }
    }
}

/// Configuration for color regions vectorization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionsConfig {
    /// Maximum width/height to resize input image to (for performance)
    pub max_dimension: u32,

    /// Number of colors for k-means clustering
    pub num_colors: u32,

    /// Whether to use LAB color space for clustering
    pub use_lab_color: bool,

    /// Minimum region area to keep (filters small noise regions)
    pub min_region_area: u32,

    /// Maximum number of k-means iterations
    pub max_iterations: u32,

    /// Convergence threshold for k-means
    pub convergence_threshold: f64,

    /// Path simplification tolerance (Douglas-Peucker)
    pub simplification_tolerance: f64,

    /// Whether to fit Bezier curves to simplified paths
    pub fit_curves: bool,

    /// Curve fitting error tolerance
    pub curve_tolerance: f64,

    /// Whether to merge similar adjacent regions
    pub merge_similar_regions: bool,

    /// Color distance threshold for region merging
    pub merge_threshold: f64,
}

impl Default for RegionsConfig {
    fn default() -> Self {
        Self {
            max_dimension: 512,        // Reduced from 1024 for better performance
            num_colors: 8,             // Reduced from 16 for faster k-means
            use_lab_color: true,
            min_region_area: 50,       // Reduced from 100 to preserve more detail
            max_iterations: 20,        // Reduced from 100 for faster convergence
            convergence_threshold: 0.01, // More sensitive threshold for early termination
            simplification_tolerance: 1.0,
            fit_curves: true,
            curve_tolerance: 2.0,
            merge_similar_regions: true,
            merge_threshold: 10.0,
        }
    }
}

/// Common SVG output configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SvgConfig {
    /// Whether to optimize the SVG output
    pub optimize: bool,

    /// Precision for floating point values in SVG
    pub decimal_precision: u8,

    /// Whether to include comments in SVG
    pub include_comments: bool,

    /// Whether to group similar paths
    pub group_paths: bool,
}

impl Default for SvgConfig {
    fn default() -> Self {
        Self {
            optimize: true,
            decimal_precision: 2,
            include_comments: false,
            group_paths: true,
        }
    }
}
