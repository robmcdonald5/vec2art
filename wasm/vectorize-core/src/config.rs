//! Simplified configuration types for trace-low vectorization

use serde::{Deserialize, Serialize};

/// Default configuration parameters for flow-guided tracing and Bézier fitting
///
/// These parameters correspond to Milestone 2 from Next-Steps.md:
/// - Flow-guided polyline tracing using ETF field
/// - Bézier curve fitting with curvature regularization
/// - Stroke width clamping to prevent thickening
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Milestone2Config {
    /// Tracing configuration
    pub trace: TraceDefaultConfig,
    /// Bézier fitting configuration
    pub fit: FitDefaultConfig,
}

/// Default tracing parameters from Next-Steps.md
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceDefaultConfig {
    /// Minimum gradient magnitude threshold (default: 0.08)
    pub min_grad: f32,
    /// Minimum coherency threshold (default: 0.15)
    pub min_coherency: f32,
    /// Maximum gap size in pixels (default: 4)
    pub max_gap: u32,
    /// Maximum polyline length (default: 10_000)
    pub max_len: usize,
}

/// Default Bézier fitting parameters from Next-Steps.md
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FitDefaultConfig {
    /// Curvature penalty coefficient (default: 0.02)
    pub lambda_curv: f32,
    /// Maximum fitting error tolerance (default: 0.8)
    pub max_err: f32,
    /// Corner splitting angle threshold in degrees (default: 32.0)
    pub split_angle: f32,
}

impl Default for TraceDefaultConfig {
    fn default() -> Self {
        Self {
            min_grad: 0.08,
            min_coherency: 0.15,
            max_gap: 4,
            max_len: 10_000,
        }
    }
}

impl Default for FitDefaultConfig {
    fn default() -> Self {
        Self {
            lambda_curv: 0.02,
            max_err: 0.8,
            split_angle: 32.0,
        }
    }
}

/// SVG output configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SvgConfig {
    /// SVG precision for coordinates (decimal places)
    pub precision: u8,
    /// Whether to optimize SVG output
    pub optimize: bool,
    /// Whether to include metadata comments
    pub include_metadata: bool,
}

impl Default for SvgConfig {
    fn default() -> Self {
        Self {
            precision: 2,
            optimize: true,
            include_metadata: false,
        }
    }
}

/// Validation error types for input validation
pub mod validation {
    use crate::error::VectorizeError;

    /// Validate image dimensions for processing
    pub fn validate_image_dimensions(width: u32, height: u32) -> Result<(), VectorizeError> {
        if width == 0 || height == 0 {
            return Err(VectorizeError::invalid_dimensions(
                width,
                height,
                "Image dimensions must be greater than 0",
            ));
        }

        if width > 16384 || height > 16384 {
            return Err(VectorizeError::invalid_dimensions(
                width,
                height,
                "Image dimensions too large (max 16384)",
            ));
        }

        // Check aspect ratio (prevent extreme ratios that could cause issues)
        let aspect_ratio = width as f64 / height as f64;
        if !(0.01..=100.0).contains(&aspect_ratio) {
            return Err(VectorizeError::invalid_dimensions(
                width,
                height,
                "Extreme aspect ratio (>100:1 or <1:100)",
            ));
        }

        Ok(())
    }

    /// Validate color count for regions algorithm
    pub fn validate_color_count(colors: u32) -> Result<(), VectorizeError> {
        if colors < 2 {
            return Err(VectorizeError::config_error(
                "Color count must be at least 2",
            ));
        }
        if colors > 256 {
            return Err(VectorizeError::config_error(
                "Color count must not exceed 256",
            ));
        }
        Ok(())
    }

    /// Validate iteration count for algorithms
    pub fn validate_iterations(iterations: u32) -> Result<(), VectorizeError> {
        if iterations == 0 {
            return Err(VectorizeError::config_error(
                "Iteration count must be greater than 0",
            ));
        }
        if iterations > 1000 {
            return Err(VectorizeError::config_error(
                "Iteration count too high (max 1000)",
            ));
        }
        Ok(())
    }

    /// Validate tolerance values
    pub fn validate_tolerance(tolerance: f64, name: &str) -> Result<(), VectorizeError> {
        if tolerance <= 0.0 {
            return Err(VectorizeError::config_error(format!(
                "{name} tolerance must be positive"
            )));
        }
        if tolerance > 1000.0 {
            return Err(VectorizeError::config_error(format!(
                "{name} tolerance too large (max 1000.0)"
            )));
        }
        Ok(())
    }

    /// Validate FDoG sigma parameters
    pub fn validate_fdog_sigma(sigma_s: f32, sigma_c: f32) -> Result<(), VectorizeError> {
        if sigma_s <= 0.0 || sigma_c <= 0.0 {
            return Err(VectorizeError::config_error(
                "FDoG sigma values must be positive"
            ));
        }
        if sigma_s > 10.0 || sigma_c > 10.0 {
            return Err(VectorizeError::config_error(
                "FDoG sigma values too large (max 10.0)"
            ));
        }
        Ok(())
    }

    /// Validate NMS threshold relationship
    pub fn validate_nms_thresholds(low: f32, high: f32) -> Result<(), VectorizeError> {
        if low >= high {
            return Err(VectorizeError::config_error(
                "NMS low threshold must be less than high threshold"
            ));
        }
        if low <= 0.0 || high <= 0.0 {
            return Err(VectorizeError::config_error(
                "NMS thresholds must be positive"
            ));
        }
        if low > 1.0 || high > 1.0 {
            return Err(VectorizeError::config_error(
                "NMS thresholds must not exceed 1.0"
            ));
        }
        Ok(())
    }

    /// Validate dot size range relationship
    pub fn validate_dot_size_range(min_radius: f32, max_radius: f32) -> Result<(), VectorizeError> {
        if min_radius <= 0.0 || max_radius <= 0.0 {
            return Err(VectorizeError::config_error(
                "Dot radii must be positive"
            ));
        }
        if min_radius >= max_radius {
            return Err(VectorizeError::config_error(
                "Minimum dot radius must be less than maximum dot radius"
            ));
        }
        if max_radius > 50.0 {
            return Err(VectorizeError::config_error(
                "Maximum dot radius too large (max 50.0 pixels)"
            ));
        }
        Ok(())
    }

    /// Validate superpixel configuration
    pub fn validate_superpixel_config(num_superpixels: u32, compactness: f32, iterations: u32) -> Result<(), VectorizeError> {
        if !(20..=2000).contains(&num_superpixels) {
            return Err(VectorizeError::config_error(format!(
                "Number of superpixels must be 20-2000, got {}"
                , num_superpixels
            )));
        }
        if !(1.0..=50.0).contains(&compactness) {
            return Err(VectorizeError::config_error(format!(
                "Superpixel compactness must be 1.0-50.0, got {}"
                , compactness
            )));
        }
        if !(1..=50).contains(&iterations) {
            return Err(VectorizeError::config_error(format!(
                "SLIC iterations must be 1-50, got {}"
                , iterations
            )));
        }
        Ok(())
    }
}
