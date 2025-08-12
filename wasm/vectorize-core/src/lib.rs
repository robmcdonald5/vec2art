//! # vectorize-core
//!
//! Core image vectorization algorithms for the vec2art project.
//! This library provides platform-agnostic image processing and SVG generation
//! capabilities focused on line tracing algorithms.

pub mod algorithms;
pub mod config;
pub mod config_builder;
pub mod error;
pub mod execution;
pub mod performance;
pub mod preprocessing;
pub mod svg;
pub mod telemetry;

// Re-export main types for convenience
pub use algorithms::{vectorize_trace_low, TraceBackend, TraceLowConfig};
pub use config::SvgConfig;
pub use config_builder::{ConfigBuilder, ConfigBuilderError, ConfigBuilderResult};
pub use error::*;
pub use execution::{
    current_num_threads, execute_parallel, execute_parallel_chunks, execute_parallel_filter_map,
    join, join3, par_bridge, par_enumerate, par_extend, par_iter, par_iter_mut, par_sort,
    par_sort_by, par_windows, par_zip, process_chunks_mut, reduce, scope, should_use_parallel,
    with_thread_pool, ThreadPoolConfig,
};

use image::{ImageBuffer, Rgba};

// Note: TraceLowConfig and TraceBackend are now imported from algorithms module

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
    use preprocessing::{
        adjust_trace_low_config, analyze_resolution_requirements, apply_resolution_processing,
        scale_svg_coordinates, ResolutionConfig,
    };

    log::info!("Starting trace-low vectorization with config: {config:?}");

    // Comprehensive input validation
    validate_image_input(image)?;
    validate_trace_low_config(config)?;

    // Check for edge cases that would make processing impossible
    let single_color_result = is_empty_or_single_color_image(image);
    log::debug!(
        "Single color check result: {} for {}x{} image",
        single_color_result,
        image.width(),
        image.height()
    );
    if single_color_result {
        log::warn!("Image appears to be empty or single color, generating minimal SVG");
        return Ok(generate_minimal_svg(
            image.width(),
            image.height(),
            "trace-low",
        ));
    }

    // Simplified resolution processing (no complex adaptive processing needed)
    let resolution_config = ResolutionConfig::default();
    let resolution_analysis = analyze_resolution_requirements(image, &resolution_config);

    // Apply resolution-aware processing
    let processing_image = apply_resolution_processing(image, &resolution_analysis)?;

    // Adjust configuration based on resolution scaling
    let adjusted_config =
        adjust_trace_low_config(config, &resolution_analysis.parameter_adjustments);

    log::info!(
        "Processing: {}x{} -> {}x{} (scale: {:.3})",
        image.width(),
        image.height(),
        processing_image.width(),
        processing_image.height(),
        resolution_analysis.scale_factor
    );

    // Use the trace-low algorithm with optimized config
    let svg_paths = vectorize_trace_low(&processing_image, &adjusted_config)?;

    // Handle case where no paths were generated
    if svg_paths.is_empty() {
        log::warn!("No paths generated, creating minimal SVG");
        return Ok(generate_minimal_svg(
            image.width(),
            image.height(),
            "trace-low",
        ));
    }

    // Generate complete SVG document
    let svg_config = SvgConfig::default();
    let svg_document = svg::generate_svg_document(
        &svg_paths,
        processing_image.width(),
        processing_image.height(),
        &svg_config,
    );

    // Scale SVG back to original resolution if needed
    let final_svg = scale_svg_coordinates(&svg_document, &resolution_analysis)?;

    Ok(final_svg)
}

// Helper functions for input validation and edge case handling
mod input_validation {
    use super::*;
    use crate::error::validation::*;

    /// Validate image input
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

    /// Validate trace-low specific configuration
    pub fn validate_trace_low_config(config: &TraceLowConfig) -> VectorizeResult<()> {
        // Validate detail parameter range
        if config.detail < 0.0 || config.detail > 1.0 {
            return Err(VectorizeError::invalid_parameter_combination(format!(
                "Detail parameter {} out of range [0.0, 1.0]",
                config.detail
            )));
        }

        // Validate stroke width
        if config.stroke_px_at_1080p <= 0.0 {
            return Err(VectorizeError::invalid_parameter_combination(format!(
                "Stroke width {} must be positive",
                config.stroke_px_at_1080p
            )));
        }

        if config.stroke_px_at_1080p > 50.0 {
            return Err(VectorizeError::invalid_parameter_combination(format!(
                "Stroke width {} too large (max: 50.0)",
                config.stroke_px_at_1080p
            )));
        }

        Ok(())
    }

    /// Check if image is effectively empty or single color
    pub fn is_empty_or_single_color_image(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> bool {
        if image.width() == 0 || image.height() == 0 {
            return true;
        }

        // Find the first opaque pixel to use as reference
        let mut reference_pixel: Option<Rgba<u8>> = None;
        let mut opaque_pixel_count = 0;

        for pixel in image.pixels() {
            if pixel.0[3] >= 10 {
                // Only check opaque-ish pixels
                opaque_pixel_count += 1;

                if let Some(ref_pixel) = reference_pixel {
                    // Compare with reference pixel
                    if pixel.0[0] != ref_pixel.0[0]
                        || pixel.0[1] != ref_pixel.0[1]
                        || pixel.0[2] != ref_pixel.0[2]
                    {
                        return false; // Found different colors
                    }
                } else {
                    // This is our reference pixel
                    reference_pixel = Some(*pixel);
                }
            }
        }

        // If we have no opaque pixels, consider it empty
        // If we have very few opaque pixels, consider it effectively empty
        opaque_pixel_count == 0 || opaque_pixel_count < 10
    }

    /// Generate minimal SVG for edge cases
    pub fn generate_minimal_svg(width: u32, height: u32, algorithm_type: &str) -> String {
        format!(
            r#"<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated by {algorithm_type} algorithm: no content found -->
  <rect width="{width}" height="{height}" fill="transparent"/>
</svg>"#
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
    fn test_vectorize_trace_low_rgba() {
        // Create a simple 10x10 test image
        let mut img = ImageBuffer::new(10, 10);
        for y in 0..10 {
            for x in 0..10 {
                let color = if x == 5 || y == 5 {
                    Rgba([0, 0, 0, 255]) // Black cross
                } else {
                    Rgba([255, 255, 255, 255]) // White background
                };
                img.put_pixel(x, y, color);
            }
        }

        let config = TraceLowConfig::default();
        let result = vectorize_trace_low_rgba(&img, &config);

        assert!(
            result.is_ok(),
            "vectorize_trace_low_rgba failed: {:?}",
            result.err()
        );
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }

    #[test]
    fn test_edge_case_empty_image() {
        // Test 0x0 image
        let img = ImageBuffer::new(0, 0);
        let config = TraceLowConfig::default();
        let result = vectorize_trace_low_rgba(&img, &config);

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
        let config = TraceLowConfig::default();
        let result = vectorize_trace_low_rgba(&img, &config);

        // Should succeed but generate minimal SVG
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("no content found") || svg.contains("<rect"));
    }

    #[test]
    fn test_edge_case_extreme_aspect_ratio() {
        // Test image with extreme aspect ratio
        let img = ImageBuffer::new(1000, 1);
        let config = TraceLowConfig::default();
        let result = vectorize_trace_low_rgba(&img, &config);

        assert!(result.is_err());
        if let Err(e) = result {
            assert!(matches!(e, VectorizeError::InvalidDimensions { .. }));
        }
    }

    #[test]
    fn test_edge_case_invalid_config() {
        let img = ImageBuffer::new(10, 10);
        let config = TraceLowConfig {
            detail: -0.1, // Invalid: negative detail
            ..Default::default()
        };

        let result = vectorize_trace_low_rgba(&img, &config);
        assert!(result.is_err());
    }
}
