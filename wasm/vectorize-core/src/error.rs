//! Error types for the vectorize-core library

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
}

/// Result type alias for convenience
pub type VectorizeResult<T> = Result<T, VectorizeError>;
