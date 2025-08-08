//! # vectorize-core
//!
//! Core image vectorization algorithms for the vec2art project.
//! This library provides platform-agnostic image processing and SVG generation
//! capabilities with a focus on performance and memory efficiency.

pub mod algorithms;
pub mod config;
pub mod error;
pub mod preprocessing;
pub mod svg;

// Re-export main types for convenience
pub use config::*;
pub use error::*;

use image::{ImageBuffer, Rgba};

/// Main entry point for logo/line-art vectorization
///
/// This function takes an RGBA image buffer and converts it to SVG paths
/// optimized for high-contrast, binary-like images such as logos and line art.
///
/// # Arguments
/// * `image` - Input RGBA image buffer
/// * `config` - Configuration parameters for the vectorization process
///
/// # Returns
/// * `Result<String, VectorizeError>` - SVG string or error
pub fn vectorize_logo_rgba(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &LogoConfig,
) -> Result<String, VectorizeError> {
    use algorithms::logo::vectorize_logo;
    use svg::generate_svg_document;

    log::info!("Starting logo vectorization with config: {:?}", config);

    // Use the implemented logo algorithm
    let svg_paths = vectorize_logo(image, config)?;

    // Generate complete SVG document
    let svg_config = SvgConfig::default();
    let svg_document =
        generate_svg_document(&svg_paths, image.width(), image.height(), &svg_config);

    Ok(svg_document)
}

/// Main entry point for color regions vectorization
///
/// This function takes an RGBA image buffer and converts it to SVG paths
/// using color quantization and region-based approaches suitable for
/// photographs and complex illustrations.
///
/// # Arguments
/// * `image` - Input RGBA image buffer
/// * `config` - Configuration parameters for the vectorization process
///
/// # Returns
/// * `Result<String, VectorizeError>` - SVG string or error
pub fn vectorize_regions_rgba(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RegionsConfig,
) -> Result<String, VectorizeError> {
    use algorithms::regions::vectorize_regions;
    use svg::generate_svg_document;

    log::info!("Starting regions vectorization with config: {:?}", config);

    // Use the implemented regions algorithm
    let svg_paths = vectorize_regions(image, config)?;

    // Generate complete SVG document
    let svg_config = SvgConfig::default();
    let svg_document =
        generate_svg_document(&svg_paths, image.width(), image.height(), &svg_config);

    Ok(svg_document)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn test_vectorize_logo_rgba() {
        // Create a simple 2x2 test image
        let mut img = ImageBuffer::new(2, 2);
        img.put_pixel(0, 0, Rgba([255, 255, 255, 255])); // White
        img.put_pixel(1, 0, Rgba([0, 0, 0, 255])); // Black
        img.put_pixel(0, 1, Rgba([0, 0, 0, 255])); // Black
        img.put_pixel(1, 1, Rgba([255, 255, 255, 255])); // White

        let config = LogoConfig::default();
        let result = vectorize_logo_rgba(&img, &config);

        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }

    #[test]
    fn test_vectorize_regions_rgba() {
        // Create a simple 4x4 test image (more pixels for k-means to work)
        let mut img = ImageBuffer::new(4, 4);
        for y in 0..4 {
            for x in 0..4 {
                let color = match (x + y) % 4 {
                    0 => Rgba([255, 0, 0, 255]),   // Red
                    1 => Rgba([0, 255, 0, 255]),   // Green
                    2 => Rgba([0, 0, 255, 255]),   // Blue
                    _ => Rgba([255, 255, 0, 255]), // Yellow
                };
                img.put_pixel(x, y, color);
            }
        }

        let mut config = RegionsConfig::default();
        config.num_colors = 4; // Set to maximum number of distinct colors in test image
        config.min_region_area = 1; // Lower threshold for small test image
        
        let result = vectorize_regions_rgba(&img, &config);

        assert!(result.is_ok(), "vectorize_regions_rgba failed: {:?}", result.err());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }
}
