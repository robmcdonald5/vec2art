//! Configuration types for vectorization algorithms

use serde::{Deserialize, Serialize};

/// Douglas-Peucker epsilon specification - either explicit pixels or fraction of diagonal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Epsilon {
    /// Explicit epsilon value in pixels
    Pixels(f64),
    /// Epsilon as fraction of image diagonal (sqrt(w² + h²))
    DiagFrac(f64),
}

impl Epsilon {
    /// Resolve epsilon to pixels given image dimensions
    pub fn resolve_pixels(&self, width: u32, height: u32) -> f64 {
        match *self {
            Epsilon::Pixels(px) => px,
            Epsilon::DiagFrac(frac) => {
                let diag = ((width as f64).powi(2) + (height as f64).powi(2)).sqrt();
                frac * diag
            }
        }
    }
}

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

    /// Path simplification epsilon (Douglas-Peucker)
    pub simplification_epsilon: Epsilon,

    /// Whether to fit Bezier curves to simplified paths
    pub fit_curves: bool,

    /// Curve fitting error tolerance
    pub curve_tolerance: f64,

    /// Whether to detect and use primitive shapes (circles, ellipses, arcs)
    pub detect_primitives: bool,

    /// Threshold for accepting primitive fits (lower = more strict)
    pub primitive_fit_tolerance: f32,

    /// Maximum eccentricity for circle detection
    pub max_circle_eccentricity: f32,

    /// Whether to render paths as strokes instead of fills
    pub use_stroke: bool,

    /// Stroke width in pixels (when use_stroke is true)
    pub stroke_width: f32,
}

impl LogoConfig {
    /// Validate configuration for compatibility issues
    pub fn validate(&self) -> Result<(), String> {
        // Note: threshold is u8, so it's already limited to 0-255
        if self.morphology_kernel_size < 1 {
            return Err("Morphology kernel size must be at least 1".to_string());
        }
        if self.morphology_kernel_size > 10 {
            return Err("Morphology kernel size should not exceed 10 for reasonable performance".to_string());
        }
        match self.simplification_epsilon {
            Epsilon::Pixels(px) if px < 0.0 => {
                return Err("Simplification epsilon (pixels) must be non-negative".to_string());
            }
            Epsilon::DiagFrac(frac) if frac < 0.0 => {
                return Err("Simplification epsilon (diagonal fraction) must be non-negative".to_string());
            }
            _ => {}
        }
        if self.curve_tolerance < 0.0 {
            return Err("Curve tolerance must be non-negative".to_string());
        }
        if self.primitive_fit_tolerance < 0.0 {
            return Err("Primitive fit tolerance must be non-negative".to_string());
        }
        if self.max_circle_eccentricity < 0.0 || self.max_circle_eccentricity > 1.0 {
            return Err("Circle eccentricity must be between 0.0 and 1.0".to_string());
        }
        if self.max_dimension < 32 {
            return Err("Maximum dimension should be at least 32 pixels".to_string());
        }
        if self.max_dimension > 4096 {
            return Err("Maximum dimension should not exceed 4096 pixels for reasonable performance".to_string());
        }
        if self.stroke_width <= 0.0 {
            return Err("Stroke width must be positive".to_string());
        }
        if self.stroke_width > 50.0 {
            return Err("Stroke width should not exceed 50 pixels".to_string());
        }
        
        Ok(())
    }
}

impl Default for LogoConfig {
    fn default() -> Self {
        Self {
            max_dimension: 512,        // Reduced from 1024 for better performance
            threshold: 128,
            adaptive_threshold: false,
            morphology_kernel_size: 2, // Reduced from 3 to minimize artifacts
            min_contour_area: 25,      // Reduced from 50 to keep more detail
            simplification_epsilon: Epsilon::DiagFrac(0.0035), // Gentle for logos
            fit_curves: true,
            curve_tolerance: 2.0,
            detect_primitives: true,
            primitive_fit_tolerance: 2.0,
            max_circle_eccentricity: 0.15,
            use_stroke: false,         // Default to fill mode
            stroke_width: 1.0,         // Default stroke width for stroke mode
        }
    }
}

/// Segmentation method for regions algorithm
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SegmentationMethod {
    /// Traditional k-means clustering with flood-fill
    KMeans,
    /// SLIC superpixel segmentation
    Slic,
}

/// Color quantization method for regions algorithm
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum QuantizationMethod {
    /// K-means++ clustering
    KMeans,
    /// Wu color quantization (median cut with variance)
    Wu,
}

/// Configuration for color regions vectorization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionsConfig {
    /// Maximum width/height to resize input image to (for performance)
    pub max_dimension: u32,

    /// Segmentation method to use
    pub segmentation_method: SegmentationMethod,

    /// Color quantization method to use
    pub quantization_method: QuantizationMethod,

    /// Number of colors for quantization
    pub num_colors: u32,

    /// Whether to use LAB color space for clustering
    pub use_lab_color: bool,

    /// Minimum region area to keep (filters small noise regions)
    pub min_region_area: u32,

    /// Maximum number of k-means iterations
    pub max_iterations: u32,

    /// Convergence threshold for k-means
    pub convergence_threshold: f64,

    /// Path simplification epsilon (Douglas-Peucker)
    pub simplification_epsilon: Epsilon,

    /// Whether to fit Bezier curves to simplified paths
    pub fit_curves: bool,

    /// Curve fitting error tolerance
    pub curve_tolerance: f64,

    /// Whether to detect and use primitive shapes (circles, ellipses, arcs)
    pub detect_primitives: bool,

    /// Threshold for accepting primitive fits (lower = more strict)
    pub primitive_fit_tolerance: f32,

    /// Maximum eccentricity for circle detection
    pub max_circle_eccentricity: f32,

    /// Whether to merge similar adjacent regions
    pub merge_similar_regions: bool,

    /// Color distance threshold for region merging
    pub merge_threshold: f64,

    // SLIC-specific parameters
    /// SLIC step size in pixels (not area - actual step length)
    pub slic_step_px: u32,

    /// SLIC compactness parameter (0-100, higher = more square regions)
    pub slic_compactness: f32,

    /// Number of SLIC iterations
    pub slic_iterations: u32,

    // Gradient detection parameters
    /// Enable/disable gradient detection for smooth color transitions
    pub detect_gradients: bool,

    /// R² threshold for accepting gradients (0.0-1.0, higher = more strict)
    pub gradient_r_squared_threshold: f64,

    /// Maximum number of gradient stops to generate
    pub max_gradient_stops: usize,

    /// Minimum region area required for gradient analysis
    pub min_gradient_region_area: usize,

    /// Radial symmetry detection threshold for radial gradients
    pub radial_symmetry_threshold: f64,
}

impl RegionsConfig {
    /// Validate configuration for compatibility issues
    pub fn validate(&self) -> Result<(), String> {
        // Check if SLIC parameters are reasonable when SLIC is selected
        if self.segmentation_method == SegmentationMethod::Slic {
            if self.slic_step_px < 12 || self.slic_step_px > 120 {
                return Err("SLIC step (px) should be ~12–120 for 720p–4K images".to_string());
            }
            if self.slic_compactness < 0.1 || self.slic_compactness > 100.0 {
                return Err("SLIC compactness should be between 0.1 and 100.0".to_string());
            }
            if self.slic_iterations < 10 {
                return Err("SLIC iterations should be at least 10 for proper convergence".to_string());
            }
        }

        // Warn about Wu quantization with very high color counts
        if self.quantization_method == QuantizationMethod::Wu && self.num_colors > 64 {
            return Err("Wu quantization is most effective with 64 or fewer colors".to_string());
        }

        // Check gradient detection parameters
        if self.detect_gradients {
            if self.gradient_r_squared_threshold < 0.5 || self.gradient_r_squared_threshold > 1.0 {
                return Err("Gradient R² threshold should be between 0.5 and 1.0".to_string());
            }
            if self.max_gradient_stops < 2 {
                return Err("Gradient must have at least 2 stops".to_string());
            }
            if self.min_gradient_region_area > (self.min_region_area as usize) * 4 {
                return Err("Gradient region area threshold should not be much larger than general region area threshold".to_string());
            }
        }

        // Check general parameters
        if self.num_colors < 2 {
            return Err("Must have at least 2 colors for quantization".to_string());
        }
        if self.num_colors > 256 {
            return Err("Color count should not exceed 256 for reasonable performance".to_string());
        }
        if self.max_iterations < 1 {
            return Err("Must have at least 1 iteration".to_string());
        }

        Ok(())
    }
}

impl Default for RegionsConfig {
    fn default() -> Self {
        Self {
            max_dimension: 512,        // Reduced from 1024 for better performance
            segmentation_method: SegmentationMethod::KMeans, // Default to existing method
            quantization_method: QuantizationMethod::Wu, // Default to Wu as recommended
            num_colors: 16,            // Default K=16 as recommended for Wu
            use_lab_color: true,
            min_region_area: 50,       // Reduced from 100 to preserve more detail
            max_iterations: 20,        // Reduced from 100 for faster convergence
            convergence_threshold: 0.01, // More sensitive threshold for early termination
            simplification_epsilon: Epsilon::DiagFrac(0.0050), // Modest for regions
            fit_curves: true,
            curve_tolerance: 2.0,
            detect_primitives: true,
            primitive_fit_tolerance: 2.0,
            max_circle_eccentricity: 0.15,
            merge_similar_regions: true,
            merge_threshold: 2.0,      // LAB ΔE_ab < 2 for proper region merging
            // SLIC defaults - step size in pixels (not area)
            slic_step_px: 40,          // GOOD DEFAULT @1080p (~40px step size)
            slic_compactness: 10.0,    // Compactness = 10 as recommended
            slic_iterations: 10,       // ≥10 iterations for proper convergence
            // Gradient detection defaults
            detect_gradients: true,    // Enable gradient detection by default
            gradient_r_squared_threshold: 0.85, // R² ≥ 0.85 as specified in requirements
            max_gradient_stops: 8,     // Maximum gradient stops to minimize complexity
            min_gradient_region_area: 100, // Minimum pixels for gradient analysis
            radial_symmetry_threshold: 0.8, // Threshold for radial gradient detection
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
