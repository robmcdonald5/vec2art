use image::{DynamicImage, ImageFormat};
use crate::error::{Result, Vec2ArtError, validate_dimensions};
use log::info;

/// Load and validate an image from bytes
pub fn load_image(image_bytes: &[u8]) -> Result<DynamicImage> {
    // Detect format from bytes
    let format = image::guess_format(image_bytes)
        .map_err(|e| Vec2ArtError::InvalidFormat(format!("Could not detect image format: {}", e)))?;
    
    info!("Detected image format: {:?}", format);
    
    // Check if format is supported
    match format {
        ImageFormat::Png | ImageFormat::Jpeg | ImageFormat::WebP => {
            // Supported formats
        }
        _ => {
            return Err(Vec2ArtError::InvalidFormat(
                format!("Unsupported image format: {:?}. Supported formats: PNG, JPEG, WebP", format)
            ));
        }
    }
    
    // Load the image
    let image = image::load_from_memory(image_bytes)?;
    
    // Validate dimensions
    validate_dimensions(image.width(), image.height())?;
    
    info!("Image loaded successfully: {}x{} pixels", image.width(), image.height());
    
    Ok(image)
}

/// Get image metadata without fully decoding
pub fn get_image_info(image_bytes: &[u8]) -> Result<ImageInfo> {
    let format = image::guess_format(image_bytes)
        .map_err(|e| Vec2ArtError::InvalidFormat(e.to_string()))?;
    
    // For now, we need to load the full image to get dimensions
    // In the future, we could optimize this to just read headers
    let image = image::load_from_memory(image_bytes)?;
    
    Ok(ImageInfo {
        width: image.width(),
        height: image.height(),
        format: format_to_string(format),
        pixel_count: image.width() * image.height(),
        has_alpha: matches!(image, DynamicImage::ImageRgba8(_) | DynamicImage::ImageRgba16(_)),
    })
}

/// Information about an image
#[derive(Debug, Clone)]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub pixel_count: u32,
    pub has_alpha: bool,
}

fn format_to_string(format: ImageFormat) -> String {
    match format {
        ImageFormat::Png => "PNG",
        ImageFormat::Jpeg => "JPEG",
        ImageFormat::WebP => "WebP",
        _ => "Unknown",
    }.to_string()
}

/// Resize image if it exceeds maximum dimensions while preserving aspect ratio
pub fn resize_if_needed(image: DynamicImage, max_width: u32, max_height: u32) -> DynamicImage {
    let (width, height) = (image.width(), image.height());
    
    if width <= max_width && height <= max_height {
        return image;
    }
    
    let width_ratio = width as f32 / max_width as f32;
    let height_ratio = height as f32 / max_height as f32;
    let scale_factor = width_ratio.max(height_ratio);
    
    let new_width = (width as f32 / scale_factor) as u32;
    let new_height = (height as f32 / scale_factor) as u32;
    
    info!("Resizing image from {}x{} to {}x{}", width, height, new_width, new_height);
    
    image.resize_exact(new_width, new_height, image::imageops::FilterType::Lanczos3)
}

/// Prepare image for processing (resize if needed, convert format if needed)
pub fn prepare_image(image: DynamicImage) -> Result<DynamicImage> {
    // For now, we'll work with the default max dimensions
    // These could be made configurable later
    const PROCESSING_MAX_WIDTH: u32 = 2048;
    const PROCESSING_MAX_HEIGHT: u32 = 2048;
    
    let prepared = resize_if_needed(image, PROCESSING_MAX_WIDTH, PROCESSING_MAX_HEIGHT);
    
    Ok(prepared)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_format_detection() {
        // PNG magic bytes
        let png_bytes = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        let format = image::guess_format(&png_bytes);
        assert!(format.is_ok());
        assert_eq!(format.unwrap(), ImageFormat::Png);
    }
    
    #[test]
    fn test_dimension_validation() {
        assert!(validate_dimensions(100, 100).is_ok());
        assert!(validate_dimensions(4096, 4096).is_ok()); // 16M pixels - OK
        assert!(validate_dimensions(5656, 5656).is_ok()); // ~32M pixels - just under limit
        assert!(validate_dimensions(0, 100).is_err()); // Zero width
        assert!(validate_dimensions(100, 0).is_err()); // Zero height
        assert!(validate_dimensions(10000, 10000).is_err()); // Exceeds max dimensions
        assert!(validate_dimensions(8192, 8192).is_err()); // Exceeds max pixels (67M > 32M)
        assert!(validate_dimensions(8000, 5000).is_err()); // Exceeds max pixels (40M > 32M)
    }
}