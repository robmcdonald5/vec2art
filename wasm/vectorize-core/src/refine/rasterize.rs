//! SVG rasterization using resvg + tiny-skia for error analysis
//! 
//! This module provides pixel-perfect SVG rasterization capabilities for the Phase B
//! error-driven refinement loop. Uses resvg for accurate SVG parsing and tiny-skia
//! for CPU-based rendering to ensure consistent results across platforms.

use image::{ImageBuffer, Rgba};
use resvg::usvg::{Tree, Options};
use tiny_skia::{Pixmap, Transform};
use thiserror::Error;
use crate::svg::generate_svg_document;
use crate::algorithms::logo::SvgPath;
use crate::config::SvgConfig;

/// Errors that can occur during SVG rasterization
#[derive(Error, Debug)]
pub enum RasterError {
    #[error("SVG parsing failed: {0}")]
    SvgParsing(String),
    
    #[error("Invalid image dimensions: {width}x{height}")]
    InvalidDimensions { width: u32, height: u32 },
    
    #[error("Pixmap creation failed")]
    PixmapCreation,
    
    #[error("Image buffer conversion failed")]
    BufferConversion,
    
    #[error("Render operation failed")]
    RenderFailed,
}

/// Rasterize SVG content to RGBA image buffer
/// 
/// Takes SVG content as string and renders it to a bitmap image of specified
/// dimensions using resvg + tiny-skia for pixel-perfect reproduction.
/// 
/// # Arguments
/// * `svg_content` - Complete SVG document as string
/// * `width` - Target raster width in pixels
/// * `height` - Target raster height in pixels
/// 
/// # Returns
/// * `Result<ImageBuffer<Rgba<u8>, Vec<u8>>, RasterError>` - Rasterized image or error
/// 
/// # Performance
/// * CPU-only rendering suitable for vec2art's constraints
/// * ~20-100% slower than GPU-accelerated Skia but still faster than Cairo
/// * Can be optimized with RUSTFLAGS="-Ctarget-cpu=haswell" for AVX instructions
pub fn rasterize_svg_to_rgba(
    svg_content: &str,
    width: u32,
    height: u32,
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, RasterError> {
    // Validate dimensions
    if width == 0 || height == 0 || width > 4096 || height > 4096 {
        return Err(RasterError::InvalidDimensions { width, height });
    }

    // Parse SVG tree with resvg
    let tree = Tree::from_str(svg_content, &Options::default())
        .map_err(|e| RasterError::SvgParsing(format!("{:?}", e)))?;
    
    // Create pixmap for rendering
    let mut pixmap = Pixmap::new(width, height)
        .ok_or(RasterError::PixmapCreation)?;
    
    // Clear pixmap to white background (matches typical SVG behavior)
    pixmap.fill(tiny_skia::Color::WHITE);
    
    // Render SVG tree to pixmap
    resvg::render(&tree, Transform::identity(), &mut pixmap.as_mut());
    
    // Convert tiny_skia pixmap to image::ImageBuffer
    let pixels = pixmap.take();
    ImageBuffer::from_raw(width, height, pixels)
        .ok_or(RasterError::BufferConversion)
}

/// Rasterize SVG paths directly to RGBA image buffer
/// 
/// Higher-level convenience function that takes SVG paths and generates a complete
/// SVG document before rasterization. Useful for Phase B refinement pipeline.
/// 
/// # Arguments
/// * `paths` - Vector of SVG paths to rasterize
/// * `width` - Target raster width in pixels  
/// * `height` - Target raster height in pixels
/// * `svg_config` - SVG generation configuration
/// 
/// # Returns
/// * `Result<ImageBuffer<Rgba<u8>, Vec<u8>>, RasterError>` - Rasterized image or error
pub fn rasterize_svg_paths(
    paths: &[SvgPath],
    width: u32,
    height: u32,
    svg_config: &SvgConfig,
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, RasterError> {
    // Generate complete SVG document
    let svg_content = generate_svg_document(paths, width, height, svg_config);
    
    // Rasterize the generated SVG
    rasterize_svg_to_rgba(&svg_content, width, height)
}

/// Calculate optimal rasterization dimensions for error analysis
/// 
/// Determines appropriate raster dimensions for error analysis based on original
/// image size and tile size requirements. Ensures dimensions are compatible
/// with tile-based analysis while maintaining reasonable memory usage.
/// 
/// # Arguments
/// * `original_width` - Original image width
/// * `original_height` - Original image height  
/// * `tile_size` - Size of error analysis tiles
/// * `max_dimension` - Maximum allowed dimension
/// 
/// # Returns
/// * `(u32, u32)` - Optimal (width, height) for rasterization
pub fn calculate_raster_dimensions(
    original_width: u32,
    original_height: u32,
    tile_size: u32,
    max_dimension: u32,
) -> (u32, u32) {
    let aspect_ratio = original_width as f32 / original_height as f32;
    
    // Ensure dimensions are multiples of tile_size for clean analysis
    let align_to_tiles = |dim: u32| -> u32 {
        ((dim + tile_size - 1) / tile_size) * tile_size
    };
    
    // Scale down if exceeding max dimension
    let (width, height) = if original_width > max_dimension || original_height > max_dimension {
        if aspect_ratio > 1.0 {
            // Wider than tall
            let width = max_dimension;
            let height = (max_dimension as f32 / aspect_ratio) as u32;
            (width, height)
        } else {
            // Taller than wide
            let height = max_dimension;
            let width = (max_dimension as f32 * aspect_ratio) as u32;
            (width, height)
        }
    } else {
        (original_width, original_height)
    };
    
    // Align to tile boundaries
    (align_to_tiles(width), align_to_tiles(height))
}

/// Test SVG rasterization accuracy
/// 
/// Utility function for validating rasterization quality during development.
/// Compares pixel-level differences between expected and actual raster output.
/// 
/// # Arguments
/// * `svg_content` - SVG to test
/// * `expected_image` - Expected raster result
/// 
/// # Returns
/// * `Result<f64, RasterError>` - Average pixel difference (0.0 = perfect match)
pub fn test_rasterization_accuracy(
    svg_content: &str,
    expected_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> Result<f64, RasterError> {
    let width = expected_image.width();
    let height = expected_image.height();
    
    let rasterized = rasterize_svg_to_rgba(svg_content, width, height)?;
    
    // Calculate average pixel difference
    let mut total_diff = 0.0;
    let mut pixel_count = 0;
    
    for (expected_pixel, raster_pixel) in expected_image.pixels().zip(rasterized.pixels()) {
        let diff_r = (expected_pixel[0] as f64 - raster_pixel[0] as f64).abs();
        let diff_g = (expected_pixel[1] as f64 - raster_pixel[1] as f64).abs();
        let diff_b = (expected_pixel[2] as f64 - raster_pixel[2] as f64).abs();
        let diff_a = (expected_pixel[3] as f64 - raster_pixel[3] as f64).abs();
        
        total_diff += (diff_r + diff_g + diff_b + diff_a) / 4.0;
        pixel_count += 1;
    }
    
    Ok(total_diff / pixel_count as f64)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::logo::{SvgPath, SvgElementType};

    #[test]
    fn test_rasterize_simple_svg() {
        let svg_content = r#"<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" fill="red"/>
        </svg>"#;
        
        let result = rasterize_svg_to_rgba(svg_content, 100, 100);
        assert!(result.is_ok());
        
        let image = result.unwrap();
        assert_eq!(image.width(), 100);
        assert_eq!(image.height(), 100);
        
        // Check that center pixel is red (approximately)
        let center_pixel = image.get_pixel(50, 50);
        assert!(center_pixel[0] > 200); // Red channel should be high
        assert!(center_pixel[1] < 50);  // Green channel should be low
        assert!(center_pixel[2] < 50);  // Blue channel should be low
    }
    
    #[test]
    fn test_rasterize_svg_paths() {
        let paths = vec![
            SvgPath {
                path_data: "M 20 20 L 80 20 L 80 80 L 20 80 Z".to_string(),
                fill: Some("blue".to_string()),
                stroke: None,
                stroke_width: None,
                element_type: SvgElementType::Path,
            }
        ];
        
        let svg_config = SvgConfig::default();
        let result = rasterize_svg_paths(&paths, 100, 100, &svg_config);
        
        assert!(result.is_ok());
        let image = result.unwrap();
        
        // Check that center pixel is blue (approximately)
        let center_pixel = image.get_pixel(50, 50);
        assert!(center_pixel[2] > 200); // Blue channel should be high
        assert!(center_pixel[0] < 50);  // Red channel should be low
        assert!(center_pixel[1] < 50);  // Green channel should be low
    }
    
    #[test]
    fn test_calculate_raster_dimensions() {
        // Test no scaling needed
        let (w, h) = calculate_raster_dimensions(512, 512, 32, 1024);
        assert_eq!(w, 512);
        assert_eq!(h, 512);
        
        // Test scaling down
        let (w, h) = calculate_raster_dimensions(2048, 1536, 32, 1024);
        assert!(w <= 1024);
        assert!(h <= 1024);
        assert_eq!(w % 32, 0); // Should be aligned to tile size
        assert_eq!(h % 32, 0);
        
        // Test aspect ratio preservation
        let aspect_ratio = w as f32 / h as f32;
        let original_aspect = 2048.0 / 1536.0;
        assert!((aspect_ratio - original_aspect).abs() < 0.1);
    }
    
    #[test]
    fn test_invalid_dimensions() {
        let svg_content = r#"<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>"#;
        
        // Test zero dimensions
        assert!(rasterize_svg_to_rgba(svg_content, 0, 100).is_err());
        assert!(rasterize_svg_to_rgba(svg_content, 100, 0).is_err());
        
        // Test oversized dimensions
        assert!(rasterize_svg_to_rgba(svg_content, 5000, 5000).is_err());
    }
}