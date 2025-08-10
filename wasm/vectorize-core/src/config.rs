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

    // Adaptive parameter settings
    /// Enable adaptive parameter tuning based on image content
    pub enable_adaptive_parameters: bool,

    /// Base primitive fit tolerance for adaptive scaling
    pub base_primitive_fit_tolerance: f32,

    /// Base minimum contour area for adaptive scaling  
    pub base_min_contour_area: u32,

    /// Base morphology kernel size for adaptive scaling
    pub base_morphology_kernel_size: u32,

    /// Maximum allowed primitive size as fraction of image diagonal
    pub max_primitive_size_fraction: f32,

    /// Minimum allowed primitive size in pixels
    pub min_primitive_size_px: f32,
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

        // Validate adaptive parameters
        if self.enable_adaptive_parameters {
            if self.base_primitive_fit_tolerance < 0.0 {
                return Err("Base primitive fit tolerance must be non-negative".to_string());
            }
            if self.max_primitive_size_fraction <= 0.0 || self.max_primitive_size_fraction > 1.0 {
                return Err("Max primitive size fraction must be between 0.0 and 1.0".to_string());
            }
            if self.min_primitive_size_px < 1.0 {
                return Err("Min primitive size must be at least 1 pixel".to_string());
            }
            if self.base_morphology_kernel_size < 1 {
                return Err("Base morphology kernel size must be at least 1".to_string());
            }
        }
        
        Ok(())
    }

    /// Calculate adaptive parameters based on image analysis
    pub fn with_adaptive_parameters(&self, image_dims: (u32, u32), content_analysis: &ImageContentAnalysis) -> Self {
        if !self.enable_adaptive_parameters {
            return self.clone();
        }

        let mut adaptive_config = self.clone();
        
        // Calculate image diagonal for reference
        let diagonal = ((image_dims.0 as f64).powi(2) + (image_dims.1 as f64).powi(2)).sqrt();
        let image_area = (image_dims.0 * image_dims.1) as f64;
        
        // Adaptive primitive fit tolerance based on content complexity and resolution
        let complexity_factor = match content_analysis.complexity_level {
            ComplexityLevel::Low => 0.8,      // Stricter tolerance for simple content
            ComplexityLevel::Medium => 1.0,   // Base tolerance
            ComplexityLevel::High => 1.3,     // Looser tolerance for complex content
        };
        
        let resolution_factor = (diagonal / 512.0).min(2.0).max(0.5); // Scale by resolution
        adaptive_config.primitive_fit_tolerance = 
            (self.base_primitive_fit_tolerance * complexity_factor * resolution_factor as f32).max(0.5);

        // Adaptive minimum contour area based on image size and content density
        let density_factor = match content_analysis.content_density {
            ContentDensity::Sparse => 0.7,   // Smaller areas for sparse content
            ContentDensity::Medium => 1.0,   // Base area
            ContentDensity::Dense => 1.5,    // Larger areas for dense content
        };
        
        let size_factor = (image_area / 262144.0).sqrt().max(0.3).min(3.0); // Scale by image area
        adaptive_config.min_contour_area = 
            ((self.base_min_contour_area as f64 * density_factor * size_factor) as u32).max(4);

        // Adaptive morphology kernel based on image size and noise level
        let noise_factor = match content_analysis.noise_level {
            NoiseLevel::Low => 1.0,      // Base kernel size
            NoiseLevel::Medium => 1.2,   // Slightly larger kernel
            NoiseLevel::High => 1.5,     // Larger kernel for noisy images
        };
        
        let morph_size_factor = (diagonal / 512.0).sqrt().max(0.5).min(2.0);
        adaptive_config.morphology_kernel_size = 
            ((self.base_morphology_kernel_size as f64 * noise_factor * morph_size_factor) as u32).max(1).min(5);

        adaptive_config
    }
}

impl Default for LogoConfig {
    fn default() -> Self {
        Self {
            max_dimension: 512,        // Reduced from 1024 for better performance
            threshold: 128,
            adaptive_threshold: true,  // Enable adaptive threshold by default
            morphology_kernel_size: 1, // Reduce from 2 to minimize artifacts
            min_contour_area: 25,      // Reduced from 50 to keep more detail
            simplification_epsilon: Epsilon::DiagFrac(0.0035), // Gentle for logos
            fit_curves: true,
            curve_tolerance: 2.0,
            detect_primitives: true,
            primitive_fit_tolerance: 2.0,
            max_circle_eccentricity: 0.15,
            use_stroke: true,          // Enable stroke mode by default
            stroke_width: 1.2,         // Better stroke width for quality
            // Adaptive parameters
            enable_adaptive_parameters: true, // Enable by default to improve quality
            base_primitive_fit_tolerance: 2.0, // Base value for adaptive scaling
            base_min_contour_area: 25,  // Base value for adaptive scaling
            base_morphology_kernel_size: 1, // Base value for adaptive scaling
            max_primitive_size_fraction: 0.25, // Max primitive size as 25% of diagonal
            min_primitive_size_px: 4.0, // Minimum primitive size in pixels
        }
    }
}

/// Content complexity level for adaptive parameter tuning
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ComplexityLevel {
    /// Simple content with few shapes and smooth curves
    Low,
    /// Moderate complexity with mixed shapes
    Medium,
    /// High complexity with many small details and intricate shapes
    High,
}

/// Content density for adaptive parameter tuning
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ContentDensity {
    /// Sparse content with lots of empty space
    Sparse,
    /// Moderate content density
    Medium,
    /// Dense content with minimal empty space
    Dense,
}

/// Noise level for adaptive parameter tuning
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum NoiseLevel {
    /// Clean image with minimal noise
    Low,
    /// Some noise present
    Medium,
    /// Noisy image requiring more aggressive filtering
    High,
}

/// Image content analysis for adaptive parameter calculation
#[derive(Debug, Clone)]
pub struct ImageContentAnalysis {
    /// Complexity level of the image content
    pub complexity_level: ComplexityLevel,
    /// Content density classification
    pub content_density: ContentDensity,
    /// Noise level assessment
    pub noise_level: NoiseLevel,
    /// Estimated number of distinct shapes
    pub shape_count_estimate: usize,
    /// Average shape size as fraction of image area
    pub avg_shape_size_fraction: f64,
    /// Dominant shape types present
    pub dominant_shape_types: Vec<ShapeType>,
}

/// Shape type classification for content analysis
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ShapeType {
    /// Geometric shapes (circles, rectangles, etc.)
    Geometric,
    /// Organic/curved shapes
    Organic,
    /// Text-like shapes
    Text,
    /// Line-like shapes
    Linear,
}

impl Default for ImageContentAnalysis {
    fn default() -> Self {
        Self {
            complexity_level: ComplexityLevel::Medium,
            content_density: ContentDensity::Medium,
            noise_level: NoiseLevel::Low,
            shape_count_estimate: 5,
            avg_shape_size_fraction: 0.1,
            dominant_shape_types: vec![ShapeType::Geometric],
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

    // LAB ΔE merge/split parameters
    /// LAB ΔE threshold for merging regions (lower = more strict)
    pub de_merge_threshold: f64,

    /// LAB ΔE threshold for splitting regions (higher = more strict)
    pub de_split_threshold: f64,

    /// Whether to apply palette regularization
    pub palette_regularization: bool,

    /// Target number of colors for palette regularization
    pub palette_regularization_k: u32,

    // Adaptive parameter settings
    /// Enable adaptive parameter tuning based on image content
    pub enable_adaptive_parameters: bool,

    /// Base SLIC step size for adaptive scaling
    pub base_slic_step_px: u32,

    /// Base number of colors for adaptive scaling
    pub base_num_colors: u32,

    /// Base merge threshold for adaptive scaling
    pub base_merge_threshold: f64,

    /// Base ΔE merge threshold for adaptive scaling
    pub base_de_merge_threshold: f64,
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

        // Validate adaptive parameters
        if self.enable_adaptive_parameters {
            if self.base_slic_step_px < 12 || self.base_slic_step_px > 120 {
                return Err("Base SLIC step size should be between 12 and 120 pixels".to_string());
            }
            if self.base_num_colors < 8 || self.base_num_colors > 64 {
                return Err("Base number of colors should be between 8 and 64 for adaptive regions".to_string());
            }
            if self.base_merge_threshold <= 0.0 {
                return Err("Base merge threshold must be positive".to_string());
            }
            if self.base_de_merge_threshold <= 0.0 {
                return Err("Base ΔE merge threshold must be positive".to_string());
            }
        }

        Ok(())
    }

    /// Calculate adaptive parameters based on image analysis for regions mode
    pub fn with_adaptive_parameters(&self, image_dims: (u32, u32), content_analysis: &ImageContentAnalysis) -> Self {
        if !self.enable_adaptive_parameters {
            return self.clone();
        }

        let mut adaptive_config = self.clone();
        
        // Calculate image metrics for adaptive scaling
        let diagonal = ((image_dims.0 as f64).powi(2) + (image_dims.1 as f64).powi(2)).sqrt();
        let _image_area = (image_dims.0 * image_dims.1) as f64;
        
        // Adaptive SLIC step_px calculation (Priority 1)
        let complexity_factor = match content_analysis.complexity_level {
            ComplexityLevel::Low => 1.2,      // Larger steps for simple content
            ComplexityLevel::Medium => 1.0,   // Base step size
            ComplexityLevel::High => 0.7,     // Smaller steps for complex content
        };
        
        let density_factor = match content_analysis.content_density {
            ContentDensity::Sparse => 1.3,   // Larger steps for sparse content
            ContentDensity::Medium => 1.0,   // Base step size
            ContentDensity::Dense => 0.8,    // Smaller steps for dense content
        };
        
        // Resolution scaling factor (step_px should scale with image diagonal)
        let resolution_factor = (diagonal / 1080.0).max(0.3).min(2.5); // Scale based on ~1080p baseline
        
        let adaptive_step = (self.base_slic_step_px as f64 * complexity_factor * density_factor * resolution_factor) as u32;
        adaptive_config.slic_step_px = adaptive_step.clamp(12, 120);

        // Adaptive SLIC compactness based on content characteristics
        let base_compactness = 10.0;
        let compactness_factor = match content_analysis.complexity_level {
            ComplexityLevel::Low => 0.8,      // Less compact for simple shapes
            ComplexityLevel::Medium => 1.0,   // Base compactness
            ComplexityLevel::High => 1.3,     // More compact for complex content
        };
        adaptive_config.slic_compactness = (base_compactness * compactness_factor as f32).clamp(1.0, 50.0);

        // Adaptive color count for Wu quantization (Priority 2)
        let shape_complexity_factor = if content_analysis.shape_count_estimate > 15 {
            1.2 // More colors for many shapes
        } else if content_analysis.shape_count_estimate < 5 {
            0.8 // Fewer colors for simple images
        } else {
            1.0 // Base color count
        };
        
        let color_diversity_factor = match content_analysis.complexity_level {
            ComplexityLevel::Low => 0.7,      // Fewer colors for simple content
            ComplexityLevel::Medium => 1.0,   // Base color count
            ComplexityLevel::High => 1.3,     // More colors for complex content
        };
        
        let adaptive_colors = (self.base_num_colors as f64 * shape_complexity_factor * color_diversity_factor) as u32;
        adaptive_config.num_colors = adaptive_colors.clamp(8, 64);

        // Adaptive ΔE thresholds (Priority 3)
        let noise_factor = match content_analysis.noise_level {
            NoiseLevel::Low => 1.0,      // Base thresholds
            NoiseLevel::Medium => 1.1,   // Slightly higher thresholds
            NoiseLevel::High => 1.3,     // Higher thresholds for noisy images
        };
        
        adaptive_config.de_merge_threshold = self.base_de_merge_threshold * noise_factor;
        adaptive_config.merge_threshold = self.base_merge_threshold * noise_factor;

        log::debug!(
            "Adaptive regions parameters: step_px={} (was {}), colors={} (was {}), compactness={:.1}, merge_threshold={:.2}",
            adaptive_config.slic_step_px, self.slic_step_px,
            adaptive_config.num_colors, self.num_colors,
            adaptive_config.slic_compactness,
            adaptive_config.merge_threshold
        );

        adaptive_config
    }
}

impl Default for RegionsConfig {
    fn default() -> Self {
        Self {
            max_dimension: 512,        // Reduced from 1024 for better performance
            segmentation_method: SegmentationMethod::Slic, // Switch to SLIC by default
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
            merge_threshold: 1.8,      // LAB ΔE < 1.8 for merge threshold  
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
            // LAB ΔE merge/split defaults
            de_merge_threshold: 1.8,     // LAB ΔE threshold for merging regions
            de_split_threshold: 3.5,     // LAB ΔE threshold for splitting regions  
            palette_regularization: true, // Enable palette regularization by default
            palette_regularization_k: 12, // Target 10-16 colors after regularization
            // Adaptive parameters
            enable_adaptive_parameters: true, // Enable by default to improve quality
            base_slic_step_px: 40,        // Base value for adaptive scaling
            base_num_colors: 16,          // Base value for adaptive scaling
            base_merge_threshold: 1.8,    // Base value for adaptive scaling
            base_de_merge_threshold: 1.8, // Base value for adaptive scaling
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

/// Configuration for Phase B error-driven refinement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefineConfig {
    /// Maximum refinement iterations (roadmap: 2-3)
    pub max_iterations: u32,
    
    /// Maximum total refinement time in milliseconds (roadmap: 600ms)
    pub max_time_ms: u64,
    
    /// Target ΔE threshold for convergence (roadmap: 6.0)
    pub target_delta_e: f64,
    
    /// Target SSIM threshold for convergence (roadmap: 0.93)  
    pub target_ssim: f64,
    
    /// Error analysis tile size in pixels (roadmap: 32)
    pub tile_size: u32,
    
    /// Maximum tiles to process per iteration (roadmap: 5-8)
    pub max_tiles_per_iteration: u32,
    
    /// Error plateau threshold for early termination (roadmap: 0.5)
    pub error_plateau_threshold: f64,
}

impl RefineConfig {
    /// Validate refinement configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.max_iterations == 0 {
            return Err("Max iterations must be at least 1".to_string());
        }
        if self.max_iterations > 10 {
            return Err("Max iterations should not exceed 10 for reasonable performance".to_string());
        }
        if self.max_time_ms == 0 {
            return Err("Time budget must be positive".to_string());
        }
        if self.max_time_ms > 5000 {
            return Err("Time budget should not exceed 5000ms for reasonable performance".to_string());
        }
        if self.target_delta_e <= 0.0 {
            return Err("Target ΔE must be positive".to_string());
        }
        if self.target_ssim <= 0.0 || self.target_ssim >= 1.0 {
            return Err("Target SSIM must be between 0.0 and 1.0".to_string());
        }
        if self.tile_size < 4 || self.tile_size > 128 {
            return Err("Tile size must be between 4 and 128 pixels".to_string());
        }
        if self.max_tiles_per_iteration == 0 {
            return Err("Must process at least 1 tile per iteration".to_string());
        }
        if self.error_plateau_threshold < 0.0 {
            return Err("Error plateau threshold must be non-negative".to_string());
        }
        
        Ok(())
    }
}

impl Default for RefineConfig {
    fn default() -> Self {
        Self {
            max_iterations: 2,           // Conservative default per roadmap
            max_time_ms: 600,           // Roadmap requirement
            target_delta_e: 6.0,       // Roadmap quality target
            target_ssim: 0.93,         // Roadmap quality target
            tile_size: 32,             // Roadmap specification
            max_tiles_per_iteration: 5, // Conservative default
            error_plateau_threshold: 0.5, // Roadmap specification
        }
    }
}
