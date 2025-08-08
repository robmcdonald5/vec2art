//! Edge case tests for comprehensive error handling validation
//!
//! This module contains tests that specifically target edge cases and error conditions
//! to ensure the system handles them gracefully without crashing.

#[cfg(test)]
mod tests {
    use super::super::*;
    use crate::config::{LogoConfig, RegionsConfig};
    use crate::error::{VectorizeError, validation::*};
    use image::{ImageBuffer, Rgba};

    /// Test image dimension edge cases
    #[test]
    fn test_dimension_edge_cases() {
        // Test zero dimensions
        let result = validate_image_dimensions(0, 100);
        assert!(matches!(result, Err(VectorizeError::InvalidDimensions { .. })));
        
        let result = validate_image_dimensions(100, 0);
        assert!(matches!(result, Err(VectorizeError::InvalidDimensions { .. })));
        
        // Test minimum valid dimensions
        let result = validate_image_dimensions(1, 1);
        assert!(result.is_ok());
        
        // Test extreme aspect ratio
        let result = validate_image_dimensions(10000, 1);
        assert!(matches!(result, Err(VectorizeError::InvalidDimensions { .. })));
        
        // Test too large dimensions
        let result = validate_image_dimensions(20000, 20000);
        assert!(matches!(result, Err(VectorizeError::ImageTooLarge { .. })));
    }

    /// Test color count validation
    #[test]
    fn test_color_count_validation() {
        // Test zero colors
        let result = validate_color_count(0);
        assert!(matches!(result, Err(VectorizeError::InvalidColorConfig { .. })));
        
        // Test too many colors
        let result = validate_color_count(1000);
        assert!(matches!(result, Err(VectorizeError::InvalidColorConfig { .. })));
        
        // Test valid color counts
        assert!(validate_color_count(2).is_ok());
        assert!(validate_color_count(16).is_ok());
        assert!(validate_color_count(256).is_ok());
    }

    /// Test iteration validation
    #[test]
    fn test_iteration_validation() {
        // Test zero iterations
        let result = validate_iterations(0);
        assert!(matches!(result, Err(VectorizeError::InvalidParameterCombination { .. })));
        
        // Test too many iterations
        let result = validate_iterations(100000);
        assert!(matches!(result, Err(VectorizeError::InvalidParameterCombination { .. })));
        
        // Test valid iterations
        assert!(validate_iterations(10).is_ok());
        assert!(validate_iterations(1000).is_ok());
    }

    /// Test tolerance validation
    #[test]
    fn test_tolerance_validation() {
        // Test negative tolerance
        let result = validate_tolerance(-1.0, "test");
        assert!(matches!(result, Err(VectorizeError::InvalidParameterCombination { .. })));
        
        // Test too large tolerance
        let result = validate_tolerance(1000.0, "test");
        assert!(matches!(result, Err(VectorizeError::InvalidParameterCombination { .. })));
        
        // Test valid tolerances
        assert!(validate_tolerance(0.0, "test").is_ok());
        assert!(validate_tolerance(1.0, "test").is_ok());
        assert!(validate_tolerance(10.0, "test").is_ok());
    }

    /// Test logo algorithm with edge case images
    #[test]
    fn test_logo_algorithm_edge_cases() {
        // Test single pixel image
        let img = ImageBuffer::from_pixel(1, 1, Rgba([255, 255, 255, 255]));
        let config = LogoConfig::default();
        let result = vectorize_logo_rgba(&img, &config);
        
        // Should succeed but generate minimal SVG
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));

        // Test very small image
        let img = ImageBuffer::from_pixel(2, 2, Rgba([255, 255, 255, 255]));
        let result = vectorize_logo_rgba(&img, &config);
        assert!(result.is_ok());

        // Test single color image
        let img = ImageBuffer::from_pixel(10, 10, Rgba([128, 128, 128, 255]));
        let result = vectorize_logo_rgba(&img, &config);
        assert!(result.is_ok());
        let svg = result.unwrap();
        // Should handle single color gracefully
        assert!(svg.contains("<svg"));
    }

    /// Test regions algorithm with edge case images
    #[test]
    fn test_regions_algorithm_edge_cases() {
        // Test single color image
        let img = ImageBuffer::from_pixel(10, 10, Rgba([255, 0, 0, 255]));
        let mut config = RegionsConfig::default();
        config.num_colors = 8;
        config.min_region_area = 50;  // Use default compatible value
        config.min_gradient_region_area = 100;  // Ensure gradient area is larger
        
        let result = vectorize_regions_rgba(&img, &config);
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));

        // Test image with fewer colors than requested
        let mut img = ImageBuffer::new(6, 6);
        // Create 2-color checkerboard
        for y in 0..6 {
            for x in 0..6 {
                let color = if (x + y) % 2 == 0 {
                    Rgba([255, 255, 255, 255])
                } else {
                    Rgba([0, 0, 0, 255])
                };
                img.put_pixel(x, y, color);
            }
        }
        
        let mut config = RegionsConfig::default();
        config.num_colors = 8; // More than the 2 colors in image
        config.min_region_area = 50;  // Use default compatible value
        config.min_gradient_region_area = 100;  // Ensure gradient area is larger
        
        let result = vectorize_regions_rgba(&img, &config);
        assert!(result.is_ok());
    }

    /// Test invalid configurations
    #[test]
    fn test_invalid_configurations() {
        let img = ImageBuffer::new(10, 10);
        
        // Test logo config with invalid values
        let mut config = LogoConfig::default();
        config.simplification_tolerance = -1.0; // Invalid
        
        let result = vectorize_logo_rgba(&img, &config);
        assert!(result.is_err());
        
        // Test regions config with zero colors
        let mut config = RegionsConfig::default();
        config.num_colors = 0; // Invalid
        
        let result = vectorize_regions_rgba(&img, &config);
        assert!(result.is_err());
    }

    /// Test memory allocation checks
    #[test]
    fn test_memory_allocation_checks() {
        // Test oversized allocation check
        let result = check_memory_allocation(usize::MAX, "test");
        assert!(matches!(result, Err(VectorizeError::MemoryLimitExceeded { .. })));
        
        // Test reasonable allocation
        let result = check_memory_allocation(1024, "test");
        assert!(result.is_ok());
    }

    /// Test error recoverability
    #[test]
    fn test_error_recoverability() {
        let recoverable_error = VectorizeError::clustering_failed("test");
        assert!(recoverable_error.is_recoverable());
        
        let non_recoverable_error = VectorizeError::invalid_dimensions(0, 0, "test");
        assert!(!non_recoverable_error.is_recoverable());
        
        let timeout_error = VectorizeError::timeout(30);
        assert!(!timeout_error.is_recoverable());
    }

    /// Test extreme aspect ratio handling
    #[test]
    fn test_extreme_aspect_ratios() {
        // Test very wide image
        let result = validate_image_dimensions(1000, 1);
        assert!(matches!(result, Err(VectorizeError::InvalidDimensions { .. })));
        
        // Test very tall image  
        let result = validate_image_dimensions(1, 1000);
        assert!(matches!(result, Err(VectorizeError::InvalidDimensions { .. })));
        
        // Test reasonable aspect ratio
        let result = validate_image_dimensions(100, 50);
        assert!(result.is_ok());
    }

    /// Test transparent/alpha channel handling
    #[test]
    fn test_alpha_channel_handling() {
        // Create image with various alpha levels
        let mut img = ImageBuffer::new(4, 4);
        img.put_pixel(0, 0, Rgba([255, 0, 0, 255])); // Opaque red
        img.put_pixel(1, 0, Rgba([0, 255, 0, 128])); // Semi-transparent green
        img.put_pixel(2, 0, Rgba([0, 0, 255, 50]));  // Nearly transparent blue
        img.put_pixel(3, 0, Rgba([255, 255, 255, 0])); // Fully transparent white
        
        let config = LogoConfig::default();
        let result = vectorize_logo_rgba(&img, &config);
        assert!(result.is_ok());
        
        let mut regions_config = RegionsConfig::default();
        regions_config.num_colors = 4;
        regions_config.min_region_area = 50;  // Use default compatible value
        regions_config.min_gradient_region_area = 100;  // Ensure gradient area is larger
        
        let result = vectorize_regions_rgba(&img, &regions_config);
        assert!(result.is_ok());
    }

    /// Test very large valid images (within limits)
    #[test]
    fn test_large_valid_images() {
        // Test largest valid square image
        let max_square_size = (crate::error::limits::MAX_TOTAL_PIXELS as f64).sqrt() as u32;
        let result = validate_image_dimensions(max_square_size, max_square_size);
        assert!(result.is_ok());
        
        // Test just over the limit
        let result = validate_image_dimensions(max_square_size + 1, max_square_size + 1);
        assert!(matches!(result, Err(VectorizeError::ImageTooLarge { .. })));
    }

    /// Test configuration validation edge cases
    #[test]
    fn test_configuration_edge_cases() {
        // Test maximum valid values
        assert!(validate_color_count(crate::error::limits::MAX_COLORS).is_ok());
        assert!(validate_iterations(crate::error::limits::MAX_ITERATIONS).is_ok());
        assert!(validate_tolerance(crate::error::limits::MAX_SIMPLIFICATION_TOLERANCE, "test").is_ok());
        
        // Test just over maximum values
        assert!(validate_color_count(crate::error::limits::MAX_COLORS + 1).is_err());
        assert!(validate_iterations(crate::error::limits::MAX_ITERATIONS + 1).is_err());
        assert!(validate_tolerance(crate::error::limits::MAX_SIMPLIFICATION_TOLERANCE + 1.0, "test").is_err());
    }
}