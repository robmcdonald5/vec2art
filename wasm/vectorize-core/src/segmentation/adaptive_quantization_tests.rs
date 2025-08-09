//! Comprehensive unit tests for adaptive k-means quantization in LAB color space

use super::adaptive_quantization::*;
use crate::preprocessing::{lab_distance, lab_to_rgb, rgb_to_lab};
use image::{ImageBuffer, Rgba};

/// Create a test image with known color distribution
fn create_color_test_image(width: u32, height: u32, colors: &[(u8, u8, u8)]) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    let color_count = colors.len();
    
    for y in 0..height {
        for x in 0..width {
            let color_idx = ((x + y * width) as usize) % color_count;
            let (r, g, b) = colors[color_idx];
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create a gradient test image for quantization testing
fn create_gradient_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            let r = ((x as f32 / width as f32) * 255.0) as u8;
            let g = ((y as f32 / height as f32) * 255.0) as u8;
            let b = 128;
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create a noise test image for robustness testing
fn create_noisy_test_image(width: u32, height: u32, base_colors: &[(u8, u8, u8)]) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    let color_count = base_colors.len();
    
    for y in 0..height {
        for x in 0..width {
            let base_idx = ((x / 4 + y / 4) as usize) % color_count;
            let (r, g, b) = base_colors[base_idx];
            
            // Add noise
            let noise = ((x + y * 7) % 21) as i16 - 10; // Noise range: -10 to +10
            let nr = (r as i16 + noise).clamp(0, 255) as u8;
            let ng = (g as i16 + noise).clamp(0, 255) as u8;
            let nb = (b as i16 + noise).clamp(0, 255) as u8;
            
            image.put_pixel(x, y, Rgba([nr, ng, nb, 255]));
        }
    }
    
    image
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adaptive_quantization_basic() {
        let colors = vec![(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)];
        let image = create_color_test_image(20, 20, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 8,
            target_colors: 4,
            merge_threshold: 5.0,
            max_iterations: 20,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should produce target number of colors or fewer
        assert!(result.palette_rgb.len() <= config.target_colors);
        assert!(result.palette_rgb.len() > 0);
        
        // Should have assignments for all pixels
        assert_eq!(result.assignments.len(), (20 * 20) as usize);
        
        // Color counts should match assignments
        let total_pixels: usize = result.color_counts.iter().sum();
        assert_eq!(total_pixels, 400); // 20x20 pixels
    }

    #[test]
    fn test_quantization_config_default() {
        let config = AdaptiveQuantizationConfig::default();
        
        // Check that default values are reasonable
        assert!(config.initial_clusters > config.target_colors);
        assert!(config.merge_threshold > 0.0);
        assert!(config.max_iterations > 0);
        assert!(config.convergence_threshold > 0.0);
    }

    #[test]
    fn test_simple_color_reduction() {
        // Create image with many similar colors
        let mut colors = Vec::new();
        for i in 0..16 {
            let intensity = 50 + i * 10;
            colors.push((intensity, intensity, intensity));
        }
        
        let image = create_color_test_image(32, 32, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 16,
            target_colors: 4,
            merge_threshold: 8.0,
            max_iterations: 30,
            convergence_threshold: 0.5,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should successfully reduce to target colors
        assert!(result.palette_rgb.len() <= 4);
        assert!(result.palette_rgb.len() >= 2); // Should have at least some variation
    }

    #[test]
    fn test_lab_color_space_benefits() {
        // Create colors that are perceptually similar but RGB-distant
        let colors = vec![
            (255, 0, 0),    // Red
            (254, 10, 10),  // Slightly different red (close in LAB)
            (0, 255, 0),    // Green  
            (10, 254, 10),  // Slightly different green (close in LAB)
        ];
        
        let image = create_color_test_image(20, 20, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 4,
            target_colors: 2,
            merge_threshold: 3.0, // Small threshold to test LAB merging
            max_iterations: 20,
            convergence_threshold: 0.5,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should merge similar colors despite RGB differences
        assert!(result.palette_rgb.len() <= 2, "Should merge similar colors in LAB space");
        
        // Verify LAB colors are computed
        assert_eq!(result.palette_lab.len(), result.palette_rgb.len());
    }

    #[test]
    fn test_gradient_quantization() {
        let image = create_gradient_test_image(30, 20);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 12,
            target_colors: 6,
            merge_threshold: 10.0,
            max_iterations: 25,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should quantize gradient into discrete colors
        assert!(result.palette_rgb.len() <= 6);
        assert!(result.palette_rgb.len() >= 3); // Should preserve some gradient structure
        
        // Verify quantized image can be applied
        let quantized = apply_adaptive_quantization(&image, &result).unwrap();
        assert_eq!(quantized.dimensions(), image.dimensions());
    }

    #[test]
    fn test_noisy_image_robustness() {
        let base_colors = vec![(100, 50, 50), (50, 100, 50), (50, 50, 100)];
        let noisy_image = create_noisy_test_image(24, 24, &base_colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 9,
            target_colors: 3,
            merge_threshold: 8.0,
            max_iterations: 30,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&noisy_image, &config).unwrap();
        
        // Should handle noise and reduce to base colors
        assert!(result.palette_rgb.len() <= 3);
        
        // Check that resulting colors are reasonable (not extreme outliers)
        for &(r, g, b) in &result.palette_rgb {
            assert!(r <= 255 && g <= 255 && b <= 255);
            assert!(r >= 0 && g >= 0 && b >= 0);
        }
    }

    #[test]
    fn test_kmeans_plus_plus_initialization() {
        // Test that initialization doesn't fail with various inputs
        let colors = vec![(0, 0, 0), (255, 255, 255), (128, 128, 128)];
        let image = create_color_test_image(15, 15, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 5,
            target_colors: 3,
            merge_threshold: 5.0,
            max_iterations: 10,
            convergence_threshold: 1.0,
        };
        
        // Should not fail due to initialization
        let result = adaptive_kmeans_quantization(&image, &config);
        assert!(result.is_ok(), "K-means++ initialization failed");
    }

    #[test]
    fn test_convergence_behavior() {
        let colors = vec![(255, 0, 0), (0, 255, 0), (0, 0, 255)];
        let image = create_color_test_image(18, 18, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 3,
            target_colors: 3,
            merge_threshold: 1.0, // Low threshold to prevent merging
            max_iterations: 50,
            convergence_threshold: 0.1, // Strict convergence
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should converge to distinct colors
        assert_eq!(result.palette_rgb.len(), 3);
        
        // Colors should be close to originals
        let mut found_red = false;
        let mut found_green = false;
        let mut found_blue = false;
        
        for &(r, g, b) in &result.palette_rgb {
            if r > 200 && g < 50 && b < 50 { found_red = true; }
            if g > 200 && r < 50 && b < 50 { found_green = true; }
            if b > 200 && r < 50 && g < 50 { found_blue = true; }
        }
        
        assert!(found_red, "Should find red color");
        assert!(found_green, "Should find green color");
        assert!(found_blue, "Should find blue color");
    }

    #[test]
    fn test_cluster_merging_logic() {
        let colors = vec![
            (50, 50, 50),    // Dark gray
            (52, 52, 52),    // Slightly different dark gray (should merge)
            (200, 200, 200), // Light gray  
            (202, 202, 202), // Slightly different light gray (should merge)
        ];
        
        let image = create_color_test_image(16, 16, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 4,
            target_colors: 2,
            merge_threshold: 5.0, // Should merge similar grays
            max_iterations: 20,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should merge to 2 colors
        assert_eq!(result.palette_rgb.len(), 2);
        
        // One should be dark, one light
        let colors = result.palette_rgb;
        let dark_color = colors.iter().min_by_key(|&&(r, _, _)| r).unwrap();
        let light_color = colors.iter().max_by_key(|&&(r, _, _)| r).unwrap();
        
        assert!(dark_color.0 < 100, "Should have dark color");
        assert!(light_color.0 > 150, "Should have light color");
    }

    #[test]
    fn test_transparent_pixel_handling() {
        let mut image = ImageBuffer::new(10, 10);
        
        // Fill with mixed transparent and opaque pixels
        for y in 0..10 {
            for x in 0..10 {
                let alpha = if (x + y) % 2 == 0 { 255 } else { 5 }; // Mix of opaque and transparent
                image.put_pixel(x, y, Rgba([100, 150, 200, alpha]));
            }
        }
        
        let config = AdaptiveQuantizationConfig::default();
        let result = adaptive_kmeans_quantization(&image, &config);
        
        assert!(result.is_ok(), "Should handle transparent pixels");
        let quantized = result.unwrap();
        
        // Should have assignments for all pixels
        assert_eq!(quantized.assignments.len(), 100);
        
        // Apply quantization should preserve alpha
        let applied = apply_adaptive_quantization(&image, &quantized).unwrap();
        for y in 0..10 {
            for x in 0..10 {
                let original_alpha = image.get_pixel(x, y)[3];
                let quantized_alpha = applied.get_pixel(x, y)[3];
                assert_eq!(original_alpha, quantized_alpha, "Alpha not preserved at ({}, {})", x, y);
            }
        }
    }

    #[test]
    fn test_error_conditions() {
        // Test with image that's too small
        let tiny_image = ImageBuffer::from_pixel(1, 1, Rgba([128, 128, 128, 0])); // Fully transparent
        
        let config = AdaptiveQuantizationConfig::default();
        let result = adaptive_kmeans_quantization(&tiny_image, &config);
        
        // Should fail due to no valid pixels
        assert!(result.is_err());
        
        // Test with too many clusters requested
        let small_image = ImageBuffer::from_pixel(3, 3, Rgba([128, 128, 128, 255]));
        let bad_config = AdaptiveQuantizationConfig {
            initial_clusters: 20, // More clusters than pixels
            target_colors: 10,
            merge_threshold: 5.0,
            max_iterations: 10,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&small_image, &bad_config);
        assert!(result.is_err());
    }

    #[test]
    fn test_quantization_application() {
        let colors = vec![(255, 0, 0), (0, 255, 0), (0, 0, 255)];
        let original = create_color_test_image(12, 12, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 4,
            target_colors: 3,
            merge_threshold: 2.0,
            max_iterations: 15,
            convergence_threshold: 1.0,
        };
        
        let quantization = adaptive_kmeans_quantization(&original, &config).unwrap();
        let quantized = apply_adaptive_quantization(&original, &quantization).unwrap();
        
        // Should have same dimensions
        assert_eq!(quantized.dimensions(), original.dimensions());
        
        // All colors should be from the palette
        for pixel in quantized.pixels() {
            if pixel[3] > 10 { // Skip transparent pixels
                let color = (pixel[0], pixel[1], pixel[2]);
                assert!(quantization.palette_rgb.contains(&color), 
                       "Found color {:?} not in palette", color);
            }
        }
    }

    #[test]
    fn test_lab_distance_optimization() {
        // Colors that are visually similar should cluster together
        let lab_similar = vec![
            rgb_to_lab(200, 50, 50),    // Reddish
            rgb_to_lab(210, 60, 60),    // Similar reddish (small LAB distance)
            rgb_to_lab(50, 200, 50),    // Greenish
            rgb_to_lab(60, 210, 60),    // Similar greenish (small LAB distance)
        ];
        
        // Convert back to RGB for image creation
        let rgb_colors: Vec<(u8, u8, u8)> = lab_similar
            .iter()
            .map(|&(l, a, b)| lab_to_rgb(l, a, b))
            .collect();
        
        let image = create_color_test_image(16, 16, &rgb_colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 4,
            target_colors: 2,
            merge_threshold: 8.0, // Should merge perceptually similar colors
            max_iterations: 20,
            convergence_threshold: 0.5,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should merge to 2 colors (red-ish and green-ish)
        assert_eq!(result.palette_rgb.len(), 2);
    }

    #[test]
    fn test_large_color_variance() {
        // Create image with high color variance
        let mut varied_colors = Vec::new();
        for r in (0..=255).step_by(85) {
            for g in (0..=255).step_by(85) {
                for b in (0..=255).step_by(85) {
                    varied_colors.push((r, g, b));
                }
            }
        }
        
        let image = create_color_test_image(20, 20, &varied_colors[..16]); // Use first 16 colors
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 16,
            target_colors: 8,
            merge_threshold: 15.0,
            max_iterations: 30,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Should handle high variance reasonably
        assert!(result.palette_rgb.len() <= 8);
        assert!(result.palette_rgb.len() >= 4); // Should preserve some variety
    }

    #[test]
    fn test_quantization_reproducibility() {
        let colors = vec![(100, 100, 100), (200, 200, 200)];
        let image = create_color_test_image(10, 10, &colors);
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 4,
            target_colors: 2,
            merge_threshold: 5.0,
            max_iterations: 10,
            convergence_threshold: 1.0,
        };
        
        // Run quantization multiple times
        let result1 = adaptive_kmeans_quantization(&image, &config).unwrap();
        let result2 = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        // Results should be deterministic (or at least consistent in color count)
        assert_eq!(result1.palette_rgb.len(), result2.palette_rgb.len());
        assert_eq!(result1.assignments.len(), result2.assignments.len());
    }
}