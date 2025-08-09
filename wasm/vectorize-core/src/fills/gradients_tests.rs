//! Comprehensive unit tests for PCA-based gradient estimation

use super::gradients::*;
use crate::preprocessing::{lab_distance, lab_to_rgb, rgb_to_lab};
use image::{ImageBuffer, Rgba};
use std::collections::HashMap;

/// Create a horizontal linear gradient image for testing
fn create_horizontal_gradient(width: u32, height: u32, start_color: (u8, u8, u8), end_color: (u8, u8, u8)) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            let t = x as f32 / (width - 1) as f32;
            
            let r = (start_color.0 as f32 * (1.0 - t) + end_color.0 as f32 * t) as u8;
            let g = (start_color.1 as f32 * (1.0 - t) + end_color.1 as f32 * t) as u8;
            let b = (start_color.2 as f32 * (1.0 - t) + end_color.2 as f32 * t) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create a vertical linear gradient image
fn create_vertical_gradient(width: u32, height: u32, start_color: (u8, u8, u8), end_color: (u8, u8, u8)) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            let t = y as f32 / (height - 1) as f32;
            
            let r = (start_color.0 as f32 * (1.0 - t) + end_color.0 as f32 * t) as u8;
            let g = (start_color.1 as f32 * (1.0 - t) + end_color.1 as f32 * t) as u8;
            let b = (start_color.2 as f32 * (1.0 - t) + end_color.2 as f32 * t) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create a radial gradient image
fn create_radial_gradient(width: u32, height: u32, center: (f32, f32), inner_color: (u8, u8, u8), outer_color: (u8, u8, u8)) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    let max_radius = ((width.max(height) as f32) / 2.0) * 1.414; // Diagonal distance
    
    for y in 0..height {
        for x in 0..width {
            let dx = x as f32 - center.0;
            let dy = y as f32 - center.1;
            let distance = (dx * dx + dy * dy).sqrt();
            let t = (distance / max_radius).clamp(0.0, 1.0);
            
            let r = (inner_color.0 as f32 * (1.0 - t) + outer_color.0 as f32 * t) as u8;
            let g = (inner_color.1 as f32 * (1.0 - t) + outer_color.1 as f32 * t) as u8;
            let b = (inner_color.2 as f32 * (1.0 - t) + outer_color.2 as f32 * t) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create a solid color region for testing
fn create_solid_region(width: u32, height: u32, color: (u8, u8, u8)) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    ImageBuffer::from_pixel(width, height, Rgba([color.0, color.1, color.2, 255]))
}

/// Create diagonal gradient
fn create_diagonal_gradient(width: u32, height: u32, start_color: (u8, u8, u8), end_color: (u8, u8, u8)) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    let diagonal_len = ((width * width + height * height) as f32).sqrt();
    
    for y in 0..height {
        for x in 0..width {
            let diag_pos = (x + y) as f32;
            let t = (diag_pos / (width + height - 2) as f32).clamp(0.0, 1.0);
            
            let r = (start_color.0 as f32 * (1.0 - t) + end_color.0 as f32 * t) as u8;
            let g = (start_color.1 as f32 * (1.0 - t) + end_color.1 as f32 * t) as u8;
            let b = (start_color.2 as f32 * (1.0 - t) + end_color.2 as f32 * t) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gradient_stop_creation() {
        let lab_color = (50.0, 10.0, -5.0);
        let rgb_color = lab_to_rgb(lab_color.0, lab_color.1, lab_color.2);
        
        let stop = GradientStop {
            position: 0.5,
            color: rgb_color,
            lab: lab_color,
        };
        
        assert!((stop.position - 0.5).abs() < 0.001);
        assert_eq!(stop.color, rgb_color);
        assert_eq!(stop.lab, lab_color);
    }

    #[test]
    fn test_horizontal_gradient_detection() {
        let image = create_horizontal_gradient(20, 10, (255, 0, 0), (0, 0, 255));
        let mut pixels = Vec::new();
        
        // Create region covering entire image
        for y in 0..10 {
            for x in 0..20 {
                pixels.push((x, y));
            }
        }
        
        let gradient = analyze_region_gradient_pca(&pixels, &image, 3).unwrap();
        
        assert!(gradient.is_some(), "Should detect horizontal gradient");
        let grad = gradient.unwrap();
        
        // Should be a linear gradient
        match grad.gradient_type {
            GradientType::Linear { start, end } => {
                // Should be roughly horizontal
                let dx = (end.0 - start.0).abs();
                let dy = (end.1 - start.1).abs();
                assert!(dx > dy, "Horizontal gradient should have larger dx than dy: dx={}, dy={}", dx, dy);
            }
            _ => panic!("Should detect as linear gradient"),
        }
        
        // Should have reasonable error reduction
        assert!(grad.error_reduction > 0.1, "Should provide error reduction: {}", grad.error_reduction);
    }

    #[test]
    fn test_vertical_gradient_detection() {
        let image = create_vertical_gradient(10, 20, (0, 255, 0), (255, 0, 255));
        let mut pixels = Vec::new();
        
        for y in 0..20 {
            for x in 0..10 {
                pixels.push((x, y));
            }
        }
        
        let gradient = analyze_region_gradient_pca(&pixels, &image, 3).unwrap();
        
        assert!(gradient.is_some(), "Should detect vertical gradient");
        let grad = gradient.unwrap();
        
        match grad.gradient_type {
            GradientType::Linear { start, end } => {
                // Should be roughly vertical
                let dx = (end.0 - start.0).abs();
                let dy = (end.1 - start.1).abs();
                assert!(dy > dx, "Vertical gradient should have larger dy than dx: dx={}, dy={}", dx, dy);
            }
            _ => panic!("Should detect as linear gradient"),
        }
    }

    #[test]
    fn test_radial_gradient_detection() {
        let image = create_radial_gradient(16, 16, (8.0, 8.0), (255, 255, 0), (0, 0, 128));
        let mut pixels = Vec::new();
        
        for y in 0..16 {
            for x in 0..16 {
                pixels.push((x, y));
            }
        }
        
        let gradient = analyze_region_gradient_pca(&pixels, &image, 3).unwrap();
        
        assert!(gradient.is_some(), "Should detect radial gradient");
        let grad = gradient.unwrap();
        
        match grad.gradient_type {
            GradientType::Radial { center, radius } => {
                // Center should be near image center
                assert!((center.0 - 8.0).abs() < 3.0, "Center x should be near 8.0: {}", center.0);
                assert!((center.1 - 8.0).abs() < 3.0, "Center y should be near 8.0: {}", center.1);
                assert!(radius > 5.0, "Radius should be reasonable: {}", radius);
            }
            _ => panic!("Should detect as radial gradient"),
        }
    }

    #[test]
    fn test_solid_color_no_gradient() {
        let image = create_solid_region(15, 15, (128, 128, 128));
        let mut pixels = Vec::new();
        
        for y in 0..15 {
            for x in 0..15 {
                pixels.push((x, y));
            }
        }
        
        let gradient = analyze_region_gradient_pca(&pixels, &image, 3).unwrap();
        
        // Solid color should not produce gradient
        assert!(gradient.is_none(), "Solid color should not produce gradient");
    }

    #[test]
    fn test_small_region_handling() {
        let image = create_horizontal_gradient(5, 5, (255, 0, 0), (0, 255, 0));
        let pixels = vec![(1, 1), (2, 1), (3, 1)]; // Very small region
        
        let gradient = analyze_region_gradient_pca(&pixels, &image, 3).unwrap();
        
        // Small regions should not produce gradients
        assert!(gradient.is_none(), "Very small regions should not produce gradients");
    }

    #[test]
    fn test_gradient_stop_interpolation() {
        let stops = vec![
            GradientStop {
                position: 0.0,
                color: (255, 0, 0),
                lab: rgb_to_lab(255, 0, 0),
            },
            GradientStop {
                position: 1.0,
                color: (0, 255, 0),
                lab: rgb_to_lab(0, 255, 0),
            },
        ];
        
        // Test midpoint interpolation
        let mid_color = super::interpolate_gradient_color(0.5, &stops);
        let expected_mid = rgb_to_lab(128, 128, 0); // Approximate middle
        
        let color_diff = lab_distance(mid_color, expected_mid);
        assert!(color_diff < 20.0, "Interpolated color should be reasonable: diff={}", color_diff);
        
        // Test endpoints
        let start_color = super::interpolate_gradient_color(0.0, &stops);
        let end_color = super::interpolate_gradient_color(1.0, &stops);
        
        assert_eq!(start_color, stops[0].lab);
        assert_eq!(end_color, stops[1].lab);
    }

    #[test]
    fn test_multi_stop_gradient() {
        let stops = vec![
            GradientStop {
                position: 0.0,
                color: (255, 0, 0),
                lab: rgb_to_lab(255, 0, 0),
            },
            GradientStop {
                position: 0.5,
                color: (255, 255, 0),
                lab: rgb_to_lab(255, 255, 0),
            },
            GradientStop {
                position: 1.0,
                color: (0, 255, 0),
                lab: rgb_to_lab(0, 255, 0),
            },
        ];
        
        // Test interpolation between first and second stop
        let quarter_color = super::interpolate_gradient_color(0.25, &stops);
        // Should be between red and yellow
        let red_dist = lab_distance(quarter_color, stops[0].lab);
        let yellow_dist = lab_distance(quarter_color, stops[1].lab);
        
        assert!(red_dist < 40.0, "Quarter point should be close to red");
        assert!(yellow_dist < 40.0, "Quarter point should be close to yellow");
    }

    #[test]
    fn test_linear_position_calculation() {
        let start = (0.0, 0.0);
        let end = (10.0, 0.0);
        
        // Test various positions along horizontal line
        let pos_start = super::calculate_linear_position(0.0, 0.0, start, end);
        let pos_mid = super::calculate_linear_position(5.0, 0.0, start, end);
        let pos_end = super::calculate_linear_position(10.0, 0.0, start, end);
        
        assert!((pos_start - 0.0).abs() < 0.001, "Start position should be 0.0");
        assert!((pos_mid - 0.5).abs() < 0.001, "Mid position should be 0.5");
        assert!((pos_end - 1.0).abs() < 0.001, "End position should be 1.0");
        
        // Test point off the line
        let pos_off = super::calculate_linear_position(5.0, 5.0, start, end);
        assert!((pos_off - 0.5).abs() < 0.001, "Perpendicular point should project to 0.5");
    }

    #[test]
    fn test_radial_position_calculation() {
        let center = (5.0, 5.0);
        let radius = 5.0;
        
        // Test center point
        let pos_center = super::calculate_radial_position(5.0, 5.0, center, radius);
        assert!((pos_center - 0.0).abs() < 0.001, "Center should have position 0.0");
        
        // Test point at radius
        let pos_edge = super::calculate_radial_position(10.0, 5.0, center, radius);
        assert!((pos_edge - 1.0).abs() < 0.001, "Edge should have position 1.0");
        
        // Test halfway point
        let pos_half = super::calculate_radial_position(7.5, 5.0, center, radius);
        assert!((pos_half - 0.5).abs() < 0.001, "Halfway should have position 0.5");
    }

    #[test]
    fn test_diagonal_gradient_pca() {
        let image = create_diagonal_gradient(12, 12, (0, 0, 0), (255, 255, 255));
        let mut pixels = Vec::new();
        
        for y in 0..12 {
            for x in 0..12 {
                pixels.push((x, y));
            }
        }
        
        let gradient = analyze_region_gradient_pca(&pixels, &image, 2).unwrap();
        
        assert!(gradient.is_some(), "Should detect diagonal gradient");
        let grad = gradient.unwrap();
        
        match grad.gradient_type {
            GradientType::Linear { start, end } => {
                // Should be roughly diagonal
                let dx = end.0 - start.0;
                let dy = end.1 - start.1;
                let ratio = (dx.abs() / dy.abs()).max(dy.abs() / dx.abs());
                assert!(ratio < 3.0, "Should be roughly diagonal, ratio: {}", ratio);
            }
            _ => {} // Radial is also acceptable for some diagonal patterns
        }
    }

    #[test]
    fn test_batch_gradient_analysis() {
        // Create multiple regions with different patterns
        let h_grad = create_horizontal_gradient(10, 10, (255, 0, 0), (0, 255, 0));
        let v_grad = create_vertical_gradient(10, 10, (0, 0, 255), (255, 255, 0));
        let solid = create_solid_region(10, 10, (128, 128, 128));
        
        // Combine into larger image
        let mut combined = ImageBuffer::new(30, 10);
        for y in 0..10 {
            for x in 0..10 {
                combined.put_pixel(x, y, *h_grad.get_pixel(x, y));
                combined.put_pixel(x + 10, y, *v_grad.get_pixel(x, y));
                combined.put_pixel(x + 20, y, *solid.get_pixel(x, y));
            }
        }
        
        let mut regions = HashMap::new();
        let mut region1 = Vec::new();
        let mut region2 = Vec::new();
        let mut region3 = Vec::new();
        
        for y in 0..10 {
            for x in 0..10 {
                region1.push((x, y));
                region2.push((x + 10, y));
                region3.push((x + 20, y));
            }
        }
        
        regions.insert(0, region1);
        regions.insert(1, region2);
        regions.insert(2, region3);
        
        let gradients = analyze_regions_batch(&regions, &combined, 50, 3).unwrap();
        
        // Should find gradients for region 0 and 1, but not 2
        assert!(gradients.contains_key(&0), "Should find gradient in horizontal region");
        assert!(gradients.contains_key(&1), "Should find gradient in vertical region");
        assert!(!gradients.contains_key(&2), "Should not find gradient in solid region");
    }

    #[test]
    fn test_gradient_error_calculation() {
        let image = create_horizontal_gradient(20, 5, (100, 100, 100), (200, 200, 200));
        let mut pixels = Vec::new();
        
        for y in 0..5 {
            for x in 0..20 {
                pixels.push((x, y));
            }
        }
        
        // Calculate flat fill error (should be high for gradient)
        let mean_lab = rgb_to_lab(150, 150, 150); // Middle gray
        let flat_error = super::calculate_flat_fill_error(&pixels, &image, mean_lab).unwrap();
        
        // Calculate gradient error (should be low for good gradient)
        let gradient_type = GradientType::Linear {
            start: (0.0, 2.5),
            end: (19.0, 2.5),
        };
        
        let stops = vec![
            GradientStop {
                position: 0.0,
                color: (100, 100, 100),
                lab: rgb_to_lab(100, 100, 100),
            },
            GradientStop {
                position: 1.0,
                color: (200, 200, 200),
                lab: rgb_to_lab(200, 200, 200),
            },
        ];
        
        let gradient_error = super::calculate_gradient_error(&pixels, &image, &gradient_type, &stops).unwrap();
        
        assert!(gradient_error < flat_error, "Gradient should have lower error than flat fill");
        assert!(gradient_error < 10.0, "Gradient error should be small for good fit");
    }

    #[test]
    fn test_principal_axis_calculation() {
        // Create region with clear principal axis
        let mut pixels = Vec::new();
        
        // Horizontal line of pixels
        for x in 0..10 {
            pixels.push((x, 5));
            pixels.push((x, 6)); // Make it slightly thick
        }
        
        let mean_x = 4.5;
        let mean_y = 5.5;
        
        let (axis, variance_ratio) = super::calculate_principal_axis(&pixels, mean_x, mean_y);
        
        // Principal axis should be roughly horizontal
        assert!(axis[0].abs() > axis[1].abs(), "Principal axis should be more horizontal than vertical");
        
        // Variance ratio should be low (most variance in one direction)
        assert!(variance_ratio < 0.3, "Should have low variance ratio for linear region: {}", variance_ratio);
    }

    #[test]
    fn test_color_variance_calculation() {
        // High variance colors
        let high_var_data = vec![
            (0.0, (0.0, 0.0, 0.0)),      // Black
            (1.0, (100.0, 0.0, 0.0)),    // White in LAB
            (2.0, (50.0, 50.0, 50.0)),   // Colored
        ];
        
        let high_variance = super::calculate_color_variance(&high_var_data);
        
        // Low variance colors
        let low_var_data = vec![
            (0.0, (50.0, 0.0, 0.0)),
            (1.0, (51.0, 1.0, 1.0)),
            (2.0, (49.0, -1.0, -1.0)),
        ];
        
        let low_variance = super::calculate_color_variance(&low_var_data);
        
        assert!(high_variance > low_variance, "High variance should be greater: {} vs {}", high_variance, low_variance);
        assert!(low_variance < 5.0, "Low variance should be small");
        assert!(high_variance > 10.0, "High variance should be significant");
    }

    #[test]
    fn test_gradient_stop_creation_with_quantiles() {
        let data = vec![
            (0.0, (20.0, 0.0, 0.0)),
            (1.0, (30.0, 0.0, 0.0)),
            (2.0, (40.0, 0.0, 0.0)),
            (3.0, (50.0, 0.0, 0.0)),
            (4.0, (60.0, 0.0, 0.0)),
        ];
        
        let stops = super::create_gradient_stops(&data, 0.0, 4.0, 3).unwrap();
        
        assert!(stops.len() <= 3, "Should not exceed max stops");
        assert!(stops.len() >= 2, "Should have at least 2 stops");
        
        // Stops should be ordered by position
        for i in 1..stops.len() {
            assert!(stops[i].position >= stops[i-1].position, "Stops should be ordered");
        }
        
        // First and last should be at extremes
        assert!((stops[0].position - 0.0).abs() < 0.001, "First stop should be at 0.0");
        assert!((stops.last().unwrap().position - 1.0).abs() < 0.001, "Last stop should be at 1.0");
    }

    #[test]
    fn test_edge_cases() {
        let image = create_solid_region(5, 5, (100, 100, 100));
        
        // Empty region
        let empty_gradient = analyze_region_gradient_pca(&vec![], &image, 3).unwrap();
        assert!(empty_gradient.is_none());
        
        // Single pixel region
        let single_gradient = analyze_region_gradient_pca(&vec![(2, 2)], &image, 3).unwrap();
        assert!(single_gradient.is_none());
        
        // Very small gradient range
        let tiny_image = create_horizontal_gradient(3, 3, (100, 100, 100), (101, 101, 101));
        let mut tiny_pixels = Vec::new();
        for y in 0..3 {
            for x in 0..3 {
                tiny_pixels.push((x, y));
            }
        }
        
        let tiny_gradient = analyze_region_gradient_pca(&tiny_pixels, &tiny_image, 2).unwrap();
        // Should not detect gradient due to small color difference
        assert!(tiny_gradient.is_none() || tiny_gradient.unwrap().error_reduction < 0.2);
    }

    #[test]
    fn test_transparent_pixel_handling() {
        let mut image = ImageBuffer::new(10, 10);
        
        // Create gradient with some transparent pixels
        for y in 0..10 {
            for x in 0..10 {
                let alpha = if x % 3 == 0 { 100 } else { 255 };
                let intensity = (x as f32 / 9.0 * 255.0) as u8;
                image.put_pixel(x, y, Rgba([intensity, intensity, intensity, alpha]));
            }
        }
        
        let mut pixels = Vec::new();
        for y in 0..10 {
            for x in 0..10 {
                pixels.push((x, y));
            }
        }
        
        // Should handle mixed transparent/opaque pixels gracefully
        let result = analyze_region_gradient_pca(&pixels, &image, 3);
        assert!(result.is_ok(), "Should handle transparent pixels without error");
    }
}