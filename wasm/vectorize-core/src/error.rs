//! Error types for the vectorize-core library
//!
//! This module provides comprehensive error handling for all edge cases
//! that can occur during image vectorization, including:
//! - Invalid image dimensions and data
//! - Resource limits and memory constraints
//! - Algorithm-specific failures
//! - Configuration validation errors

use thiserror::Error;

/// Main error type for vectorization operations
#[derive(Error, Debug)]
pub enum VectorizeError {
    #[error("Image processing error: {0}")]
    ImageError(#[from] image::ImageError),

    #[error("Invalid configuration: {message}")]
    ConfigError { message: String },

    #[error("Algorithm error: {message}")]
    AlgorithmError { message: String },

    #[error("SVG generation error: {message}")]
    SvgError { message: String },

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Memory allocation error: {message}")]
    MemoryError { message: String },

    #[error("Unsupported image format: {format}")]
    UnsupportedFormat { format: String },

    // New edge case error types
    #[error("Invalid image dimensions: width={width}, height={height}. {details}")]
    InvalidDimensions {
        width: u32,
        height: u32,
        details: String,
    },

    #[error("Image too large: {width}x{height} exceeds maximum dimension {max_dimension}")]
    ImageTooLarge {
        width: u32,
        height: u32,
        max_dimension: u32,
    },

    #[error("Insufficient image data: expected {expected} pixels, got {actual}")]
    InsufficientData { expected: usize, actual: usize },

    #[error("Invalid color configuration: {details}")]
    InvalidColorConfig { details: String },

    #[error("Clustering failed: {details}")]
    ClusteringFailed { details: String },

    #[error("No regions found: {details}")]
    NoRegionsFound { details: String },

    #[error("Memory limit exceeded: {details}")]
    MemoryLimitExceeded { details: String },

    #[error("Processing timeout: operation took longer than {timeout_seconds} seconds")]
    Timeout { timeout_seconds: u64 },

    #[error("Invalid parameter combination: {details}")]
    InvalidParameterCombination { details: String },

    #[error("Numerical overflow: {operation}")]
    NumericalOverflow { operation: String },

    #[error("Empty or degenerate contour: {details}")]
    DegenerateGeometry { details: String },
}

impl VectorizeError {
    /// Create a new configuration error
    pub fn config_error(message: impl Into<String>) -> Self {
        Self::ConfigError {
            message: message.into(),
        }
    }

    /// Create a new algorithm error
    pub fn algorithm_error(message: impl Into<String>) -> Self {
        Self::AlgorithmError {
            message: message.into(),
        }
    }

    /// Create a new SVG generation error
    pub fn svg_error(message: impl Into<String>) -> Self {
        Self::SvgError {
            message: message.into(),
        }
    }

    /// Create a new memory error
    pub fn memory_error(message: impl Into<String>) -> Self {
        Self::MemoryError {
            message: message.into(),
        }
    }

    /// Create a new unsupported format error
    pub fn unsupported_format(format: impl Into<String>) -> Self {
        Self::UnsupportedFormat {
            format: format.into(),
        }
    }

    // New error constructors for edge cases
    /// Create an invalid dimensions error
    pub fn invalid_dimensions(width: u32, height: u32, details: impl Into<String>) -> Self {
        Self::InvalidDimensions {
            width,
            height,
            details: details.into(),
        }
    }

    /// Create an image too large error
    pub fn image_too_large(width: u32, height: u32, max_dimension: u32) -> Self {
        Self::ImageTooLarge {
            width,
            height,
            max_dimension,
        }
    }

    /// Create an insufficient data error
    pub fn insufficient_data(expected: usize, actual: usize) -> Self {
        Self::InsufficientData { expected, actual }
    }

    /// Create an invalid color configuration error
    pub fn invalid_color_config(details: impl Into<String>) -> Self {
        Self::InvalidColorConfig {
            details: details.into(),
        }
    }

    /// Create a clustering failed error
    pub fn clustering_failed(details: impl Into<String>) -> Self {
        Self::ClusteringFailed {
            details: details.into(),
        }
    }

    /// Create a no regions found error
    pub fn no_regions_found(details: impl Into<String>) -> Self {
        Self::NoRegionsFound {
            details: details.into(),
        }
    }

    /// Create a memory limit exceeded error
    pub fn memory_limit_exceeded(details: impl Into<String>) -> Self {
        Self::MemoryLimitExceeded {
            details: details.into(),
        }
    }

    /// Create a timeout error
    pub fn timeout(timeout_seconds: u64) -> Self {
        Self::Timeout { timeout_seconds }
    }

    /// Create an invalid parameter combination error
    pub fn invalid_parameter_combination(details: impl Into<String>) -> Self {
        Self::InvalidParameterCombination {
            details: details.into(),
        }
    }

    /// Create a numerical overflow error
    pub fn numerical_overflow(operation: impl Into<String>) -> Self {
        Self::NumericalOverflow {
            operation: operation.into(),
        }
    }

    /// Create a degenerate geometry error
    pub fn degenerate_geometry(details: impl Into<String>) -> Self {
        Self::DegenerateGeometry {
            details: details.into(),
        }
    }

    /// Check if error is recoverable (can try with fallback parameters)
    pub fn is_recoverable(&self) -> bool {
        match self {
            // Non-recoverable errors
            Self::InvalidDimensions { .. }
            | Self::ImageTooLarge { .. }
            | Self::InsufficientData { .. }
            | Self::MemoryLimitExceeded { .. }
            | Self::Timeout { .. }
            | Self::ImageError(_)
            | Self::IoError(_) => false,

            // Potentially recoverable with fallback parameters
            Self::InvalidColorConfig { .. }
            | Self::ClusteringFailed { .. }
            | Self::NoRegionsFound { .. }
            | Self::InvalidParameterCombination { .. }
            | Self::DegenerateGeometry { .. }
            | Self::ConfigError { .. }
            | Self::AlgorithmError { .. }
            | Self::SvgError { .. }
            | Self::NumericalOverflow { .. } => true,

            // Case by case
            Self::MemoryError { .. } => true, // Can try with smaller parameters
            Self::UnsupportedFormat { .. } => false, // Cannot recover from unsupported format
        }
    }
}

/// Result type alias for convenience
pub type VectorizeResult<T> = Result<T, VectorizeError>;

/// Constants for validation limits
pub mod limits {
    /// Maximum image dimension (width or height) in pixels
    pub const MAX_IMAGE_DIMENSION: u32 = 16384; // 16K pixels

    /// Maximum total pixels (width * height)
    pub const MAX_TOTAL_PIXELS: u64 = 268_435_456; // 16K * 16K

    /// Minimum image dimension (width or height) in pixels
    pub const MIN_IMAGE_DIMENSION: u32 = 1;

    /// Maximum aspect ratio (width/height or height/width)
    pub const MAX_ASPECT_RATIO: f32 = 1000.0;

    /// Maximum number of colors for quantization
    pub const MAX_COLORS: u32 = 256;

    /// Minimum number of colors for quantization
    pub const MIN_COLORS: u32 = 2;

    /// Maximum number of iterations for iterative algorithms
    pub const MAX_ITERATIONS: u32 = 10000;

    /// Maximum simplification tolerance
    pub const MAX_SIMPLIFICATION_TOLERANCE: f64 = 100.0;

    /// Maximum memory allocation size (1GB)
    pub const MAX_MEMORY_ALLOCATION: usize = 1_073_741_824;

    /// Processing timeout in seconds
    pub const DEFAULT_TIMEOUT_SECONDS: u64 = 300; // 5 minutes
}

/// Input validation helper functions
pub mod validation {
    use super::*;

    /// Validate image dimensions
    pub fn validate_image_dimensions(width: u32, height: u32) -> VectorizeResult<()> {
        // Check for zero dimensions
        if width == 0 || height == 0 {
            return Err(VectorizeError::invalid_dimensions(
                width,
                height,
                "Image dimensions cannot be zero",
            ));
        }

        // Check minimum dimensions
        if width < limits::MIN_IMAGE_DIMENSION || height < limits::MIN_IMAGE_DIMENSION {
            return Err(VectorizeError::invalid_dimensions(
                width,
                height,
                format!(
                    "Dimensions must be at least {}x{} pixels",
                    limits::MIN_IMAGE_DIMENSION,
                    limits::MIN_IMAGE_DIMENSION
                ),
            ));
        }

        // Check maximum dimensions
        if width > limits::MAX_IMAGE_DIMENSION || height > limits::MAX_IMAGE_DIMENSION {
            return Err(VectorizeError::image_too_large(
                width,
                height,
                limits::MAX_IMAGE_DIMENSION,
            ));
        }

        // Check total pixel count
        let total_pixels = width as u64 * height as u64;
        if total_pixels > limits::MAX_TOTAL_PIXELS {
            return Err(VectorizeError::image_too_large(
                width,
                height,
                (limits::MAX_TOTAL_PIXELS as f64).sqrt() as u32,
            ));
        }

        // Check aspect ratio
        let aspect_ratio = if width > height {
            width as f32 / height as f32
        } else {
            height as f32 / width as f32
        };

        if aspect_ratio >= limits::MAX_ASPECT_RATIO {
            return Err(VectorizeError::invalid_dimensions(
                width,
                height,
                format!(
                    "Aspect ratio {:.1} exceeds maximum {:.1}",
                    aspect_ratio,
                    limits::MAX_ASPECT_RATIO
                ),
            ));
        }

        Ok(())
    }

    /// Validate color count for quantization
    pub fn validate_color_count(num_colors: u32) -> VectorizeResult<()> {
        if num_colors < limits::MIN_COLORS {
            return Err(VectorizeError::invalid_color_config(format!(
                "Number of colors {} is below minimum {}",
                num_colors,
                limits::MIN_COLORS
            )));
        }

        if num_colors > limits::MAX_COLORS {
            return Err(VectorizeError::invalid_color_config(format!(
                "Number of colors {} exceeds maximum {}",
                num_colors,
                limits::MAX_COLORS
            )));
        }

        Ok(())
    }

    /// Validate iteration count
    pub fn validate_iterations(max_iterations: u32) -> VectorizeResult<()> {
        if max_iterations == 0 {
            return Err(VectorizeError::invalid_parameter_combination(
                "Maximum iterations cannot be zero",
            ));
        }

        if max_iterations > limits::MAX_ITERATIONS {
            return Err(VectorizeError::invalid_parameter_combination(format!(
                "Maximum iterations {} exceeds limit {}",
                max_iterations,
                limits::MAX_ITERATIONS
            )));
        }

        Ok(())
    }

    /// Validate tolerance values
    pub fn validate_tolerance(tolerance: f64, name: &str) -> VectorizeResult<()> {
        if tolerance < 0.0 {
            return Err(VectorizeError::invalid_parameter_combination(format!(
                "{name} tolerance cannot be negative: {tolerance}"
            )));
        }

        if tolerance > limits::MAX_SIMPLIFICATION_TOLERANCE {
            return Err(VectorizeError::invalid_parameter_combination(format!(
                "{} tolerance {} exceeds maximum {}",
                name,
                tolerance,
                limits::MAX_SIMPLIFICATION_TOLERANCE
            )));
        }

        Ok(())
    }

    /// Check if memory allocation would exceed limits
    pub fn check_memory_allocation(size: usize, description: &str) -> VectorizeResult<()> {
        if size > limits::MAX_MEMORY_ALLOCATION {
            return Err(VectorizeError::memory_limit_exceeded(format!(
                "{}: requested {} bytes exceeds limit {} bytes",
                description,
                size,
                limits::MAX_MEMORY_ALLOCATION
            )));
        }
        Ok(())
    }
}
