use thiserror::Error;
use wasm_bindgen::JsValue;

/// Custom error types for Vec2Art operations
#[derive(Error, Debug)]
pub enum Vec2ArtError {
    #[error("Invalid image format: {0}")]
    InvalidFormat(String),
    
    #[error("Image too large: {width}x{height} pixels exceeds maximum of {max} pixels")]
    ImageTooLarge { 
        width: u32, 
        height: u32,
        max: u32,
    },
    
    #[error("Image dimensions invalid: {width}x{height}")]
    InvalidDimensions {
        width: u32,
        height: u32,
    },
    
    #[error("Processing failed: {0}")]
    ProcessingError(String),
    
    #[error("Invalid parameters: {0}")]
    InvalidParameters(String),
    
    #[error("Algorithm error: {0}")]
    AlgorithmError(String),
    
    #[error("SVG generation failed: {0}")]
    SvgGenerationError(String),
    
    #[error("Memory allocation failed")]
    MemoryError,
    
    #[error("Operation cancelled by user")]
    Cancelled,
    
    #[error("Image decode error: {0}")]
    ImageDecodeError(String),
    
    #[error("Color quantization failed: {0}")]
    ColorQuantizationError(String),
    
    #[error("Path tracing failed: {0}")]
    PathTracingError(String),
    
    #[error("Edge detection failed: {0}")]
    EdgeDetectionError(String),
    
    #[error("Geometric fitting failed: {0}")]
    GeometricFittingError(String),
}

// Convert our error type to JavaScript error
impl From<Vec2ArtError> for JsValue {
    fn from(error: Vec2ArtError) -> Self {
        JsValue::from_str(&error.to_string())
    }
}

// Convert image crate errors
impl From<image::ImageError> for Vec2ArtError {
    fn from(error: image::ImageError) -> Self {
        Vec2ArtError::ImageDecodeError(error.to_string())
    }
}

/// Result type alias for Vec2Art operations
pub type Result<T> = std::result::Result<T, Vec2ArtError>;

/// Constants for validation
pub const MAX_IMAGE_WIDTH: u32 = 8192;   // Increased from 4096
pub const MAX_IMAGE_HEIGHT: u32 = 8192;  // Increased from 4096  
pub const MAX_IMAGE_PIXELS: u32 = 32_000_000; // ~32MP, practical limit for WASM memory

/// Validate image dimensions
pub fn validate_dimensions(width: u32, height: u32) -> Result<()> {
    if width == 0 || height == 0 {
        return Err(Vec2ArtError::InvalidDimensions { width, height });
    }
    
    if width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT {
        return Err(Vec2ArtError::InvalidDimensions { width, height });
    }
    
    let total_pixels = width * height;
    if total_pixels > MAX_IMAGE_PIXELS {
        return Err(Vec2ArtError::ImageTooLarge { 
            width, 
            height,
            max: MAX_IMAGE_PIXELS,
        });
    }
    
    Ok(())
}