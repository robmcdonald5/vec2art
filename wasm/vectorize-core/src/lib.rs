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
pub mod svg_gradients;

#[cfg(test)]
mod edge_case_tests;

// Re-export main types for convenience
pub use config::*;
pub use error::*;
pub use algorithms::{TraceBackend, TraceLowConfig, vectorize_trace_low};

// Import for timeout handling  
// Removed unused time imports

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
///
/// # Errors
/// Returns error for:
/// - Invalid image dimensions (0x0, too large, extreme aspect ratios)
/// - Insufficient image data
/// - Invalid configuration parameters
/// - Algorithm failures
pub fn vectorize_logo_rgba(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &LogoConfig,
) -> Result<String, VectorizeError> {
    use algorithms::logo::vectorize_logo;
    use svg::generate_svg_document;
    use input_validation::{validate_image_input, validate_logo_config};

    log::info!("Starting logo vectorization with config: {:?}", config);

    // Comprehensive input validation
    validate_image_input(image)?;
    validate_logo_config(config)?;
    
    // Check for edge cases that would make processing impossible
    if is_empty_or_single_color_image(image) {
        log::warn!("Image appears to be empty or single color, generating minimal SVG");
        return Ok(generate_minimal_svg(image.width(), image.height(), "logo"));
    }

    // Use the implemented logo algorithm
    let svg_paths = vectorize_logo(image, config)?;

    // Handle case where no paths were generated
    if svg_paths.is_empty() {
        log::warn!("No paths generated, creating minimal SVG");
        return Ok(generate_minimal_svg(image.width(), image.height(), "logo"));
    }

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
///
/// # Errors
/// Returns error for:
/// - Invalid image dimensions (0x0, too large, extreme aspect ratios)  
/// - Insufficient image data
/// - Invalid configuration parameters
/// - Clustering failures (insufficient colors, convergence issues)
/// - Algorithm failures
pub fn vectorize_regions_rgba(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RegionsConfig,
) -> Result<String, VectorizeError> {
    use algorithms::regions::vectorize_regions;
    use input_validation::{validate_image_input, validate_regions_config};

    log::info!("Starting regions vectorization with config: {:?}", config);

    // Comprehensive input validation
    validate_image_input(image)?;
    validate_regions_config(config)?;
    
    // Check for edge cases specific to regions algorithm
    let unique_colors = count_unique_colors(image);
    if unique_colors == 1 {
        log::warn!("Image has only one color, generating single-color SVG");
        return Ok(generate_single_color_svg(image, "regions"));
    }
    
    if unique_colors < config.num_colors {
        log::warn!("Image has {} unique colors but {} colors requested. Adjusting.", 
                  unique_colors, config.num_colors);
        // Continue with adjusted expectations rather than failing
    }

    // Use the implemented regions algorithm
    let svg_paths = vectorize_regions(image, config)?;

    // Handle case where no paths were generated
    if svg_paths.is_empty() {
        log::warn!("No regions found, creating fallback SVG");
        return Ok(generate_minimal_svg(image.width(), image.height(), "regions"));
    }

    // Generate complete SVG document
    let svg_config = SvgConfig::default();
    let svg_document = if config.detect_gradients {
        // If gradient detection is enabled, we need to re-run the regions algorithm
        // to get the gradient analyses and use gradient-aware SVG generation
        use algorithms::regions::{vectorize_regions_with_gradient_info};
        
        let (paths, gradients) = vectorize_regions_with_gradient_info(image, config)?;
        svg_gradients::generate_svg_document_with_gradients(
            &paths, &gradients, image.width(), image.height(), &svg_config
        )
    } else {
        svg::generate_svg_document(&svg_paths, image.width(), image.height(), &svg_config)
    };

    Ok(svg_document)
}

/// Main entry point for trace-low vectorization
///
/// This function takes an RGBA image buffer and converts it to SVG paths
/// using low-detail tracing algorithms optimized for sparse output.
///
/// # Arguments
/// * `image` - Input RGBA image buffer
/// * `config` - Configuration parameters for the trace-low process
///
/// # Returns
/// * `Result<String, VectorizeError>` - SVG string or error
///
/// # Errors
/// Returns error for:
/// - Invalid image dimensions (0x0, too large, extreme aspect ratios)
/// - Insufficient image data
/// - Invalid configuration parameters
/// - Algorithm failures
pub fn vectorize_trace_low_rgba(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<String, VectorizeError> {
    use input_validation::validate_image_input;
    
    log::info!("Starting trace-low vectorization with config: {:?}", config);

    // Comprehensive input validation
    validate_image_input(image)?;
    validate_trace_low_config(config)?;
    
    // Check for edge cases that would make processing impossible
    if is_empty_or_single_color_image(image) {
        log::warn!("Image appears to be empty or single color, generating minimal SVG");
        return Ok(generate_minimal_svg(image.width(), image.height(), "trace-low"));
    }

    // Use the trace-low algorithm
    let svg_paths = vectorize_trace_low(image, config)?;

    // Handle case where no paths were generated
    if svg_paths.is_empty() {
        log::warn!("No paths generated, creating minimal SVG");
        return Ok(generate_minimal_svg(image.width(), image.height(), "trace-low"));
    }

    // Generate complete SVG document
    let svg_config = SvgConfig::default();
    let svg_document =
        svg::generate_svg_document(&svg_paths, image.width(), image.height(), &svg_config);

    Ok(svg_document)
}

// Helper functions for input validation and edge case handling
mod input_validation {
    use super::*;
    use crate::error::validation::*;
    use std::collections::HashSet;

    /// Validate image input for both algorithms
    pub fn validate_image_input(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> VectorizeResult<()> {
        let width = image.width();
        let height = image.height();
        
        // Validate dimensions
        validate_image_dimensions(width, height)?;
        
        // Validate data consistency
        let expected_len = (width as usize) * (height as usize) * 4; // RGBA = 4 bytes per pixel
        let actual_len = image.as_raw().len();
        
        if actual_len != expected_len {
            return Err(VectorizeError::insufficient_data(expected_len, actual_len));
        }
        
        Ok(())
    }
    
    /// Validate logo-specific configuration
    pub fn validate_logo_config(config: &LogoConfig) -> VectorizeResult<()> {
        // First run the built-in validation
        if let Err(e) = config.validate() {
            return Err(VectorizeError::config_error(e));
        }
        
        // Additional edge case validation
        validate_tolerance(config.simplification_tolerance, "simplification")?;
        validate_tolerance(config.curve_tolerance, "curve")?;
        
        if config.morphology_kernel_size > 50 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Morphology kernel size {} too large (max: 50)", 
                    config.morphology_kernel_size)
            ));
        }
        
        if config.primitive_fit_tolerance < 0.0 || config.primitive_fit_tolerance > 100.0 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Primitive fit tolerance {} out of range [0.0, 100.0]", 
                    config.primitive_fit_tolerance)
            ));
        }
        
        Ok(())
    }
    
    /// Validate regions-specific configuration
    pub fn validate_regions_config(config: &RegionsConfig) -> VectorizeResult<()> {
        // First run the built-in validation  
        if let Err(e) = config.validate() {
            return Err(VectorizeError::config_error(e));
        }
        
        // Additional edge case validation
        validate_color_count(config.num_colors)?;
        validate_iterations(config.max_iterations)?;
        validate_tolerance(config.simplification_tolerance, "simplification")?;
        validate_tolerance(config.curve_tolerance, "curve")?;
        validate_tolerance(config.merge_threshold, "merge")?;
        
        // Check for impossible parameter combinations
        if config.min_region_area > 10000 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Minimum region area {} too large (max: 10000)", 
                    config.min_region_area)
            ));
        }
        
        if config.convergence_threshold <= 0.0 || config.convergence_threshold > 100.0 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Convergence threshold {} out of range (0.0, 100.0]", 
                    config.convergence_threshold)
            ));
        }
        
        Ok(())
    }
    
    /// Validate trace-low specific configuration
    pub fn validate_trace_low_config(config: &TraceLowConfig) -> VectorizeResult<()> {
        // Validate detail parameter range
        if config.detail < 0.0 || config.detail > 1.0 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Detail parameter {} out of range [0.0, 1.0]", config.detail)
            ));
        }
        
        // Validate stroke width
        if config.stroke_px_at_1080p <= 0.0 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Stroke width {} must be positive", config.stroke_px_at_1080p)
            ));
        }
        
        if config.stroke_px_at_1080p > 50.0 {
            return Err(VectorizeError::invalid_parameter_combination(
                format!("Stroke width {} too large (max: 50.0)", config.stroke_px_at_1080p)
            ));
        }
        
        Ok(())
    }
    
    /// Check if image is effectively empty or single color
    pub fn is_empty_or_single_color_image(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> bool {
        if image.width() == 0 || image.height() == 0 {
            return true;
        }
        
        let first_pixel = *image.get_pixel(0, 0);
        
        // Check if all pixels are the same (ignoring alpha < 10 for transparency)
        for pixel in image.pixels() {
            if pixel.0[3] >= 10 { // Only check opaque-ish pixels
                if pixel.0[0] != first_pixel.0[0] || 
                   pixel.0[1] != first_pixel.0[1] || 
                   pixel.0[2] != first_pixel.0[2] {
                    return false;
                }
            }
        }
        
        true
    }
    
    /// Count unique colors in image (for regions algorithm validation)
    pub fn count_unique_colors(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> u32 {
        let mut unique_colors = HashSet::new();
        
        for pixel in image.pixels() {
            if pixel.0[3] >= 10 { // Only count opaque-ish pixels
                unique_colors.insert((pixel.0[0], pixel.0[1], pixel.0[2]));
            }
        }
        
        unique_colors.len() as u32
    }
    
    /// Generate minimal SVG for edge cases
    pub fn generate_minimal_svg(width: u32, height: u32, algorithm_type: &str) -> String {
        format!(
            r#"<svg width="{}" height="{}" viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated by {} algorithm: no content found -->
  <rect width="{}" height="{}" fill="transparent"/>
</svg>"#,
            width, height, width, height, algorithm_type, width, height
        )
    }
    
    /// Generate single color SVG for regions with only one color
    pub fn generate_single_color_svg(image: &ImageBuffer<Rgba<u8>, Vec<u8>>, algorithm_type: &str) -> String {
        let width = image.width();
        let height = image.height();
        
        // Find the dominant color
        let dominant_color = image.get_pixel(width / 2, height / 2);
        let fill_color = format!("rgb({},{},{})", dominant_color.0[0], dominant_color.0[1], dominant_color.0[2]);
        
        format!(
            r#"<svg width="{}" height="{}" viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated by {} algorithm: single color detected -->
  <rect width="{}" height="{}" fill="{}"/>
</svg>"#,
            width, height, width, height, algorithm_type, width, height, fill_color
        )
    }
}

// Re-export validation functions for use in main entry points
use input_validation::*;

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
        config.min_gradient_region_area = 1; // Match general region area threshold for small test
        
        let result = vectorize_regions_rgba(&img, &config);

        assert!(result.is_ok(), "vectorize_regions_rgba failed: {:?}", result.err());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }
    
    #[test]
    fn test_edge_case_empty_image() {
        // Test 0x0 image
        let img = ImageBuffer::new(0, 0);
        let config = LogoConfig::default();
        let result = vectorize_logo_rgba(&img, &config);
        
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(matches!(e, VectorizeError::InvalidDimensions { .. }));
        }
    }
    
    #[test]
    fn test_edge_case_single_pixel() {
        // Test 1x1 image
        let mut img = ImageBuffer::new(1, 1);
        img.put_pixel(0, 0, Rgba([255, 0, 0, 255]));
        let config = LogoConfig::default();
        let result = vectorize_logo_rgba(&img, &config);
        
        // Should succeed but generate minimal SVG
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("no content found") || svg.contains("<rect"));
    }
    
    #[test] 
    fn test_edge_case_extreme_aspect_ratio() {
        // Test image with extreme aspect ratio
        let img = ImageBuffer::new(1000, 1);
        let config = LogoConfig::default();
        let result = vectorize_logo_rgba(&img, &config);
        
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(matches!(e, VectorizeError::InvalidDimensions { .. }));
        }
    }
    
    #[test]
    fn test_edge_case_invalid_config() {
        let img = ImageBuffer::new(10, 10);
        let mut config = RegionsConfig::default();
        config.num_colors = 0; // Invalid: too few colors
        
        let result = vectorize_regions_rgba(&img, &config);
        assert!(result.is_err());
    }
}
