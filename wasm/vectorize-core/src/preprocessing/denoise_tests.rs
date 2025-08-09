//! Comprehensive unit tests for edge-preserving denoising filters

use super::denoise::*;
use crate::error::VectorizeError;
use image::{ImageBuffer, Rgba};

/// Create a test image with noise for filter testing
fn create_noisy_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Create a base pattern
            let base_r = ((x as f32 / width as f32) * 255.0) as u8;
            let base_g = ((y as f32 / height as f32) * 255.0) as u8;
            let base_b = 128;
            
            // Add some noise
            let noise = ((x + y) % 17) as i16 - 8; // Noise range: -8 to +8
            let r = (base_r as i16 + noise).clamp(0, 255) as u8;
            let g = (base_g as i16 + noise).clamp(0, 255) as u8;
            let b = (base_b as i16 + noise).clamp(0, 255) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create a synthetic edge test image for edge preservation testing
fn create_edge_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    let mid_x = width / 2;
    
    for y in 0..height {
        for x in 0..width {
            // Create a sharp vertical edge with noise
            let base_color = if x < mid_x { 50 } else { 200 };
            let noise = ((x + y * 7) % 11) as i16 - 5; // Noise range: -5 to +5
            let color = (base_color as i16 + noise).clamp(0, 255) as u8;
            
            image.put_pixel(x, y, Rgba([color, color, color, 255]));
        }
    }
    
    image
}

/// Create a gradient test image for gradient preservation testing
fn create_gradient_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Create smooth horizontal gradient with noise
            let gradient_value = (x as f32 / width as f32 * 255.0) as u8;
            let noise = ((x + y * 3) % 13) as i16 - 6; // Noise range: -6 to +6
            let r = (gradient_value as i16 + noise).clamp(0, 255) as u8;
            let g = r;
            let b = r;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_guided_filter_basic() {
        let image = create_noisy_test_image(20, 20);
        let result = guided_filter(&image, 2, 0.01);
        
        assert!(result.is_ok());
        let filtered = result.unwrap();
        assert_eq!(filtered.dimensions(), image.dimensions());
        
        // Check that alpha channel is preserved
        for y in 0..20 {
            for x in 0..20 {
                assert_eq!(filtered.get_pixel(x, y)[3], 255);
            }
        }
    }

    #[test]
    fn test_guided_filter_edge_preservation() {
        let image = create_edge_test_image(20, 20);
        let filtered = guided_filter(&image, 3, 0.02).unwrap();
        
        // Check that sharp edge is preserved
        let left_color = filtered.get_pixel(5, 10)[0];
        let right_color = filtered.get_pixel(15, 10)[0];
        
        // Edge should still be significant after filtering
        let edge_strength = (left_color as i16 - right_color as i16).abs();
        assert!(edge_strength > 50, "Edge not preserved: left={}, right={}, diff={}", 
                left_color, right_color, edge_strength);
    }

    #[test]
    fn test_guided_filter_noise_reduction() {
        let noisy_image = create_noisy_test_image(20, 20);
        let filtered = guided_filter(&noisy_image, 2, 0.01).unwrap();
        
        // Calculate variance before and after filtering
        let original_variance = calculate_image_variance(&noisy_image);
        let filtered_variance = calculate_image_variance(&filtered);
        
        // Filtering should reduce noise (variance)
        assert!(filtered_variance < original_variance, 
                "Filtering did not reduce variance: original={}, filtered={}", 
                original_variance, filtered_variance);
    }

    #[test]
    fn test_guided_filter_parameters() {
        let image = create_noisy_test_image(10, 10);
        
        // Test different radius values
        for radius in [1, 2, 4] {
            let result = guided_filter(&image, radius, 0.01);
            assert!(result.is_ok(), "Failed with radius {}", radius);
        }
        
        // Test different epsilon values
        for epsilon in [0.001, 0.01, 0.1] {
            let result = guided_filter(&image, 2, epsilon);
            assert!(result.is_ok(), "Failed with epsilon {}", epsilon);
        }
    }

    #[test]
    fn test_bilateral_filter_basic() {
        let image = create_noisy_test_image(20, 20);
        let result = bilateral_filter_enhanced(&image, 2.0, 10.0);
        
        assert!(result.is_ok());
        let filtered = result.unwrap();
        assert_eq!(filtered.dimensions(), image.dimensions());
        
        // Check alpha preservation
        for y in 0..20 {
            for x in 0..20 {
                assert_eq!(filtered.get_pixel(x, y)[3], 255);
            }
        }
    }

    #[test]
    fn test_bilateral_filter_edge_preservation() {
        let image = create_edge_test_image(20, 20);
        let filtered = bilateral_filter_enhanced(&image, 2.0, 8.0).unwrap();
        
        // Check edge preservation
        let left_color = filtered.get_pixel(5, 10)[0];
        let right_color = filtered.get_pixel(15, 10)[0];
        
        let edge_strength = (left_color as i16 - right_color as i16).abs();
        assert!(edge_strength > 40, "Edge not preserved sufficiently: diff={}", edge_strength);
    }

    #[test]
    fn test_bilateral_filter_gradient_smoothing() {
        let image = create_gradient_test_image(30, 10);
        let filtered = bilateral_filter_enhanced(&image, 2.0, 15.0).unwrap();
        
        // Check that gradients are smoothed but not destroyed
        let start_color = filtered.get_pixel(2, 5)[0];
        let end_color = filtered.get_pixel(28, 5)[0];
        
        let gradient_range = (end_color as i16 - start_color as i16).abs();
        assert!(gradient_range > 100, "Gradient was over-smoothed: range={}", gradient_range);
    }

    #[test]
    fn test_bilateral_filter_parameters() {
        let image = create_noisy_test_image(10, 10);
        
        // Test different spatial sigma values
        for spatial_sigma in [1.0, 2.0, 3.0] {
            let result = bilateral_filter_enhanced(&image, spatial_sigma, 10.0);
            assert!(result.is_ok(), "Failed with spatial_sigma {}", spatial_sigma);
        }
        
        // Test different range sigma values
        for range_sigma in [5.0, 10.0, 20.0] {
            let result = bilateral_filter_enhanced(&image, 2.0, range_sigma);
            assert!(result.is_ok(), "Failed with range_sigma {}", range_sigma);
        }
    }

    #[test]
    fn test_box_filter_uniform() {
        let input = vec![1.0; 100]; // 10x10 uniform image
        let result = super::box_filter(&input, 10, 10, 1);
        
        assert!(result.is_ok());
        let filtered = result.unwrap();
        assert_eq!(filtered.len(), 100);
        
        // Uniform input should remain uniform
        for &value in &filtered {
            assert!((value - 1.0).abs() < 0.001, "Box filter changed uniform value: {}", value);
        }
    }

    #[test]
    fn test_box_filter_edge_handling() {
        // Create a simple pattern with known values
        let mut input = vec![0.0; 25]; // 5x5 image
        input[12] = 1.0; // Center pixel = 1, all others = 0
        
        let result = super::box_filter(&input, 5, 5, 1);
        assert!(result.is_ok());
        let filtered = result.unwrap();
        
        // Center should be averaged with its 8 neighbors
        // Expected value: (1 + 8*0) / 9 = 1/9 ≈ 0.111
        let center_value = filtered[12];
        assert!((center_value - (1.0/9.0)).abs() < 0.01, "Box filter center value incorrect: {}", center_value);
    }

    #[test]
    fn test_denoising_with_transparent_pixels() {
        let mut image = ImageBuffer::new(10, 10);
        
        // Create image with some transparent pixels
        for y in 0..10 {
            for x in 0..10 {
                let alpha = if x < 5 { 255 } else { 128 }; // Half transparent
                image.put_pixel(x, y, Rgba([100, 150, 200, alpha]));
            }
        }
        
        // Test guided filter with transparency
        let guided_result = guided_filter(&image, 2, 0.01);
        assert!(guided_result.is_ok());
        let guided_filtered = guided_result.unwrap();
        
        // Alpha should be preserved exactly
        for y in 0..10 {
            for x in 0..10 {
                let original_alpha = image.get_pixel(x, y)[3];
                let filtered_alpha = guided_filtered.get_pixel(x, y)[3];
                assert_eq!(original_alpha, filtered_alpha, "Alpha not preserved at ({}, {})", x, y);
            }
        }
        
        // Test bilateral filter with transparency
        let bilateral_result = bilateral_filter_enhanced(&image, 2.0, 10.0);
        assert!(bilateral_result.is_ok());
        let bilateral_filtered = bilateral_result.unwrap();
        
        // Alpha should be preserved
        for y in 0..10 {
            for x in 0..10 {
                let original_alpha = image.get_pixel(x, y)[3];
                let filtered_alpha = bilateral_filtered.get_pixel(x, y)[3];
                assert_eq!(original_alpha, filtered_alpha, "Alpha not preserved in bilateral at ({}, {})", x, y);
            }
        }
    }

    #[test]
    fn test_denoising_extreme_cases() {
        // Test with very small image
        let small_image = ImageBuffer::from_pixel(2, 2, Rgba([128, 128, 128, 255]));
        
        let guided_result = guided_filter(&small_image, 1, 0.01);
        assert!(guided_result.is_ok());
        
        let bilateral_result = bilateral_filter_enhanced(&small_image, 1.0, 5.0);
        assert!(bilateral_result.is_ok());
        
        // Test with single-pixel image
        let tiny_image = ImageBuffer::from_pixel(1, 1, Rgba([255, 0, 0, 255]));
        
        let guided_tiny = guided_filter(&tiny_image, 1, 0.01);
        assert!(guided_tiny.is_ok());
        
        let bilateral_tiny = bilateral_filter_enhanced(&tiny_image, 1.0, 5.0);
        assert!(bilateral_tiny.is_ok());
    }

    #[test]
    fn test_comparison_guided_vs_bilateral() {
        let noisy_image = create_noisy_test_image(20, 20);
        
        let guided = guided_filter(&noisy_image, 2, 0.01).unwrap();
        let bilateral = bilateral_filter_enhanced(&noisy_image, 2.0, 10.0).unwrap();
        
        // Both should reduce noise (variance)
        let original_variance = calculate_image_variance(&noisy_image);
        let guided_variance = calculate_image_variance(&guided);
        let bilateral_variance = calculate_image_variance(&bilateral);
        
        assert!(guided_variance < original_variance, "Guided filter should reduce noise");
        assert!(bilateral_variance < original_variance, "Bilateral filter should reduce noise");
        
        // Both results should be different (they use different algorithms)
        let mut differences = 0;
        for y in 0..20 {
            for x in 0..20 {
                let guided_px = guided.get_pixel(x, y);
                let bilateral_px = bilateral.get_pixel(x, y);
                if guided_px != bilateral_px {
                    differences += 1;
                }
            }
        }
        
        // Results should differ in at least some pixels
        assert!(differences > 0, "Guided and bilateral filters produced identical results");
    }

    // Helper function to calculate image variance
    fn calculate_image_variance(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> f64 {
        let (width, height) = image.dimensions();
        let pixel_count = (width * height) as f64;
        
        // Calculate mean
        let mut sum = 0.0;
        for pixel in image.pixels() {
            let gray = 0.299 * pixel[0] as f64 + 0.587 * pixel[1] as f64 + 0.114 * pixel[2] as f64;
            sum += gray;
        }
        let mean = sum / pixel_count;
        
        // Calculate variance
        let mut variance_sum = 0.0;
        for pixel in image.pixels() {
            let gray = 0.299 * pixel[0] as f64 + 0.587 * pixel[1] as f64 + 0.114 * pixel[2] as f64;
            variance_sum += (gray - mean).powi(2);
        }
        
        variance_sum / pixel_count
    }

    #[test]
    fn test_performance_characteristics() {
        use std::time::Instant;
        
        // Test performance scaling with image size
        for size in [10, 20, 40] {
            let image = create_noisy_test_image(size, size);
            
            let start = Instant::now();
            let guided = guided_filter(&image, 2, 0.01);
            let guided_time = start.elapsed();
            assert!(guided.is_ok(), "Guided filter failed for {}x{}", size, size);
            
            let start = Instant::now();
            let bilateral = bilateral_filter_enhanced(&image, 2.0, 10.0);
            let bilateral_time = start.elapsed();
            assert!(bilateral.is_ok(), "Bilateral filter failed for {}x{}", size, size);
            
            // Just check that filters complete in reasonable time (< 1 second)
            assert!(guided_time.as_secs() < 1, "Guided filter too slow: {:?}", guided_time);
            assert!(bilateral_time.as_secs() < 1, "Bilateral filter too slow: {:?}", bilateral_time);
        }
    }

    #[test]
    fn test_mathematical_correctness() {
        // Test guided filter with zero epsilon (should behave like box filter)
        let uniform_image = ImageBuffer::from_pixel(10, 10, Rgba([128, 128, 128, 255]));
        let guided_zero = guided_filter(&uniform_image, 2, 0.0).unwrap();
        
        // Uniform image should remain mostly uniform with guided filter
        let first_pixel = guided_zero.get_pixel(5, 5);
        for y in 2..8 {
            for x in 2..8 {
                let pixel = guided_zero.get_pixel(x, y);
                for c in 0..3 {
                    assert!((pixel[c] as i16 - first_pixel[c] as i16).abs() < 5,
                           "Guided filter with zero epsilon should preserve uniformity");
                }
            }
        }
    }
}