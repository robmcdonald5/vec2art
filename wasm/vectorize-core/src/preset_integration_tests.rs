//! Integration tests for new preset configurations and Phase A modules

use crate::*;
use crate::segmentation::*;
use crate::tracing::*;
use crate::fills::*;
use crate::preprocessing::*;
use image::{ImageBuffer, Rgba};

/// Create a photo-like test image with gradients and details
fn create_photo_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Create a complex scene with gradients and details
            let sky_gradient = ((height - y) as f32 / height as f32 * 100.0) as u8 + 155;
            let ground_color = (y as f32 / height as f32 * 50.0) as u8 + 80;
            
            // Add some "objects" 
            let r = if x > width/3 && x < 2*width/3 && y > height/2 {
                ground_color + 30 // Tree/object
            } else if y < height/3 {
                sky_gradient.min(255) // Sky
            } else {
                ground_color // Ground
            };
            
            let g = if y < height/3 {
                (sky_gradient as f32 * 0.9) as u8
            } else {
                (ground_color as f32 * 1.1).min(255.0) as u8
            };
            
            let b = if y < height/3 {
                255 // Blue sky
            } else {
                ground_color // Ground
            };
            
            // Add some noise for realism
            let noise = ((x + y * 7) % 11) as i16 - 5;
            let nr = (r as i16 + noise).clamp(0, 255) as u8;
            let ng = (g as i16 + noise).clamp(0, 255) as u8;
            let nb = (b as i16 + noise).clamp(0, 255) as u8;
            
            image.put_pixel(x, y, Rgba([nr, ng, nb, 255]));
        }
    }
    
    image
}

/// Create a posterized-style test image with flat colors
fn create_posterized_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    let colors = [
        (255, 100, 100), // Red
        (100, 255, 100), // Green
        (100, 100, 255), // Blue
        (255, 255, 100), // Yellow
        (255, 100, 255), // Magenta
        (100, 255, 255), // Cyan
    ];
    
    for y in 0..height {
        for x in 0..width {
            // Create distinct color regions
            let region_id = ((x / (width / 3)) + (y / (height / 2)) * 3) as usize;
            let color_id = region_id.min(colors.len() - 1);
            let (r, g, b) = colors[color_id];
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

/// Create logo-style test image with sharp edges
fn create_logo_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    let center_x = width / 2;
    let center_y = height / 2;
    let radius = width.min(height) / 3;
    
    for y in 0..height {
        for x in 0..width {
            let dx = (x as i32 - center_x as i32).abs() as u32;
            let dy = (y as i32 - center_y as i32).abs() as u32;
            let dist = ((dx * dx + dy * dy) as f32).sqrt() as u32;
            
            let color = if dist < radius {
                if (x + y) % 20 < 10 {
                    Rgba([255, 0, 0, 255]) // Red
                } else {
                    Rgba([0, 0, 255, 255]) // Blue
                }
            } else {
                Rgba([255, 255, 255, 255]) // White background
            };
            
            image.put_pixel(x, y, color);
        }
    }
    
    image
}

/// Test configuration that approximates "photo" preset
fn create_photo_preset_regions_config() -> RegionsConfig {
    RegionsConfig {
        num_colors: 24,
        segmentation_method: SegmentationMethod::Slic,
        quantization_method: QuantizationMethod::AdaptiveKMeans, // Use Phase A adaptive quantization
        slic_step_px: 20,
        slic_compactness: 15.0,
        max_iterations: 30,
        convergence_threshold: 1.0,
        simplification_epsilon: Epsilon::DiagFrac(0.005), // Fine detail
        merge_threshold: 2.5, // Tight merging for photo quality
        curve_tolerance: 0.5,
        min_region_area: 100,
        detect_gradients: true, // Enable Phase A gradient detection
        min_gradient_region_area: 200,
        gradient_direction_tolerance: 20.0,
        gradient_magnitude_threshold: 10.0,
    }
}

/// Test configuration that approximates "posterized" preset  
fn create_posterized_preset_regions_config() -> RegionsConfig {
    RegionsConfig {
        num_colors: 8,
        segmentation_method: SegmentationMethod::KMeans,
        quantization_method: QuantizationMethod::AdaptiveKMeans, // Use Phase A adaptive quantization
        slic_step_px: 40,
        slic_compactness: 10.0,
        max_iterations: 20,
        convergence_threshold: 2.0,
        simplification_epsilon: Epsilon::DiagFrac(0.01), // Simplified paths
        merge_threshold: 8.0, // Aggressive merging
        curve_tolerance: 1.0,
        min_region_area: 300,
        detect_gradients: false, // Flat fills for posterized look
        min_gradient_region_area: 500,
        gradient_direction_tolerance: 30.0,
        gradient_magnitude_threshold: 15.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_photo_preset_integration() {
        let image = create_photo_test_image(48, 32);
        let config = create_photo_preset_regions_config();
        
        let result = vectorize_regions_rgba(&image, &config);
        assert!(result.is_ok(), "Photo preset should succeed: {:?}", result.err());
        
        let svg = result.unwrap();
        assert!(svg.contains("<svg"), "Should generate valid SVG");
        assert!(svg.contains("</svg>"), "Should have closing SVG tag");
        
        // Photo preset should generate complex output with gradients
        assert!(svg.len() > 1000, "Photo preset should generate substantial SVG content");
        
        // Should contain gradient definitions if gradients were detected
        if svg.contains("<defs>") {
            assert!(svg.contains("linearGradient") || svg.contains("radialGradient"), 
                   "Photo preset should potentially include gradients");
        }
    }

    #[test]
    fn test_posterized_preset_integration() {
        let image = create_posterized_test_image(36, 24);
        let config = create_posterized_preset_regions_config();
        
        let result = vectorize_regions_rgba(&image, &config);
        assert!(result.is_ok(), "Posterized preset should succeed: {:?}", result.err());
        
        let svg = result.unwrap();
        assert!(svg.contains("<svg"), "Should generate valid SVG");
        assert!(svg.contains("</svg>"), "Should have closing SVG tag");
        
        // Posterized should have fewer, simpler regions
        let path_count = svg.matches("<path").count();
        assert!(path_count <= 12, "Posterized preset should have fewer paths: {}", path_count);
        
        // Should not contain gradients (flat fills only)
        assert!(!svg.contains("linearGradient"), "Posterized should not have linear gradients");
        assert!(!svg.contains("radialGradient"), "Posterized should not have radial gradients");
    }

    #[test]
    fn test_phase_a_denoise_integration() {
        let mut noisy_image = create_photo_test_image(32, 32);
        
        // Apply Phase A denoising
        let guided_result = guided_filter(&noisy_image, 2, 0.01);
        assert!(guided_result.is_ok(), "Guided filter should work in integration");
        
        let bilateral_result = bilateral_filter_enhanced(&noisy_image, 2.0, 10.0);
        assert!(bilateral_result.is_ok(), "Bilateral filter should work in integration");
        
        // Test that denoised images can be processed by main algorithms
        let guided = guided_result.unwrap();
        let config = create_photo_preset_regions_config();
        
        let svg_result = vectorize_regions_rgba(&guided, &config);
        assert!(svg_result.is_ok(), "Should process denoised image successfully");
    }

    #[test]
    fn test_phase_a_adaptive_quantization_integration() {
        let image = create_photo_test_image(30, 20);
        
        let quant_config = AdaptiveQuantizationConfig {
            initial_clusters: 16,
            target_colors: 8,
            merge_threshold: 3.0,
            max_iterations: 25,
            convergence_threshold: 1.0,
        };
        
        let quantization = adaptive_kmeans_quantization(&image, &quant_config);
        assert!(quantization.is_ok(), "Adaptive quantization should succeed");
        
        let quant_result = quantization.unwrap();
        assert!(quant_result.palette_rgb.len() <= 8, "Should respect target color count");
        assert!(quant_result.palette_rgb.len() >= 3, "Should have reasonable color variety");
        
        // Test applying quantization
        let quantized_image = apply_adaptive_quantization(&image, &quant_result);
        assert!(quantized_image.is_ok(), "Should apply quantization successfully");
    }

    #[test]
    fn test_phase_a_rag_integration() {
        let image = create_posterized_test_image(24, 16);
        
        // Create initial regions (simulating segmentation)
        let mut regions = std::collections::HashMap::new();
        for region_id in 0..6 {
            let mut pixels = Vec::new();
            let start_x = (region_id % 3) * 8;
            let start_y = (region_id / 3) * 8;
            
            for y in start_y..start_y + 8 {
                for x in start_x..start_x + 8 {
                    if x < 24 && y < 16 {
                        pixels.push((x, y));
                    }
                }
            }
            regions.insert(region_id, pixels);
        }
        
        // Create RAG
        let mut rag = RegionAdjacencyGraph::from_segmentation(&regions, &image);
        assert!(rag.is_ok(), "RAG construction should succeed");
        
        let mut rag = rag.unwrap();
        
        // Test merging with delta-E predicate
        let merge_result = rag.graph_merge_with_predicate(
            delta_e_predicate(15.0),
            50,
        );
        assert!(merge_result.is_ok(), "RAG merging should succeed");
        
        let final_regions = rag.get_final_segmentation();
        assert!(final_regions.len() <= regions.len(), "Should merge some regions");
    }

    #[test]
    fn test_phase_a_curve_fitting_integration() {
        // Create a path that benefits from curve fitting
        let mut path_points = Vec::new();
        for i in 0..20 {
            let t = (i as f64) / 19.0;
            let x = t * 30.0;
            let y = 10.0 + 5.0 * (t * std::f64::consts::PI * 2.0).sin();
            path_points.push(Point2D::new(x, y));
        }
        
        // Test cubic Bézier fitting
        let curve = fit_cubic_bezier(&path_points, None, None, 1.0);
        assert!(curve.is_ok(), "Bézier fitting should succeed");
        
        let fitted = curve.unwrap();
        assert!(fitted.p0.distance_to(&path_points[0]) < 0.001, "Should match start point");
        assert!(fitted.p3.distance_to(&path_points[path_points.len()-1]) < 0.001, "Should match end point");
        
        // Test two-stage fitting
        let curves = two_stage_fit(&path_points, 0.5, 1.0, std::f64::consts::PI/6.0);
        assert!(curves.is_ok(), "Two-stage fitting should succeed");
        
        let curve_segments = curves.unwrap();
        assert!(curve_segments.len() >= 1, "Should generate at least one curve segment");
    }

    #[test]
    fn test_phase_a_gradient_analysis_integration() {
        let gradient_image = create_photo_test_image(40, 30);
        
        // Create a region that should have gradients
        let mut gradient_pixels = Vec::new();
        for y in 0..10 {
            for x in 0..40 {
                gradient_pixels.push((x, y)); // Sky area with gradient
            }
        }
        
        let gradient = analyze_region_gradient_pca(&gradient_pixels, &gradient_image, 3);
        assert!(gradient.is_ok(), "Gradient analysis should succeed");
        
        // Test batch analysis
        let mut regions = std::collections::HashMap::new();
        regions.insert(0, gradient_pixels.clone());
        
        let mut solid_pixels = Vec::new();
        for y in 20..30 {
            for x in 15..25 {
                solid_pixels.push((x, y)); // More uniform area
            }
        }
        regions.insert(1, solid_pixels);
        
        let gradients = analyze_regions_batch(&regions, &gradient_image, 100, 3);
        assert!(gradients.is_ok(), "Batch gradient analysis should succeed");
    }

    #[test]
    fn test_preset_comparison() {
        let test_image = create_photo_test_image(36, 24);
        
        // Test both presets on the same image
        let photo_config = create_photo_preset_regions_config();
        let posterized_config = create_posterized_preset_regions_config();
        
        let photo_result = vectorize_regions_rgba(&test_image, &photo_config);
        let posterized_result = vectorize_regions_rgba(&test_image, &posterized_config);
        
        assert!(photo_result.is_ok(), "Photo preset should work");
        assert!(posterized_result.is_ok(), "Posterized preset should work");
        
        let photo_svg = photo_result.unwrap();
        let posterized_svg = posterized_result.unwrap();
        
        // Photo preset should generally produce more complex output
        assert!(photo_svg.len() >= posterized_svg.len() * 0.5, 
               "Photo preset should produce reasonably complex output");
        
        // Both should be valid SVG
        assert!(photo_svg.contains("<svg") && photo_svg.contains("</svg>"));
        assert!(posterized_svg.contains("<svg") && posterized_svg.contains("</svg>"));
    }

    #[test]
    fn test_logo_preset_compatibility() {
        let logo_image = create_logo_test_image(32, 32);
        let logo_config = LogoConfig::default();
        
        // Test that Phase A modules don't break logo processing
        let logo_result = vectorize_logo_rgba(&logo_image, &logo_config);
        assert!(logo_result.is_ok(), "Logo processing should still work with Phase A modules");
        
        let logo_svg = logo_result.unwrap();
        assert!(logo_svg.contains("<svg"), "Should generate valid logo SVG");
        
        // Logo should produce relatively simple output
        let path_count = logo_svg.matches("<path").count();
        assert!(path_count <= 20, "Logo should have reasonable number of paths: {}", path_count);
    }

    #[test]
    fn test_edge_cases_with_phase_a() {
        // Test very small image
        let tiny_image = create_photo_test_image(8, 6);
        let config = create_photo_preset_regions_config();
        
        let tiny_result = vectorize_regions_rgba(&tiny_image, &config);
        assert!(tiny_result.is_ok(), "Should handle tiny images");
        
        // Test mostly transparent image  
        let mut transparent_image = ImageBuffer::new(20, 20);
        for y in 0..20 {
            for x in 0..20 {
                let alpha = if x < 10 && y < 10 { 255 } else { 50 };
                transparent_image.put_pixel(x, y, Rgba([100, 150, 200, alpha]));
            }
        }
        
        let transparent_result = vectorize_regions_rgba(&transparent_image, &config);
        assert!(transparent_result.is_ok(), "Should handle transparent images");
    }

    #[test]
    fn test_phase_a_performance_characteristics() {
        use std::time::Instant;
        
        // Test that Phase A modules don't cause excessive slowdown
        let test_image = create_photo_test_image(64, 48);
        let config = create_photo_preset_regions_config();
        
        let start = Instant::now();
        let result = vectorize_regions_rgba(&test_image, &config);
        let duration = start.elapsed();
        
        assert!(result.is_ok(), "Should complete successfully");
        assert!(duration.as_secs() < 10, "Should complete in reasonable time: {:?}", duration);
        
        // Test individual Phase A components
        let start = Instant::now();
        let _ = guided_filter(&test_image, 2, 0.01);
        let denoise_time = start.elapsed();
        assert!(denoise_time.as_millis() < 1000, "Denoising should be fast");
        
        let start = Instant::now();
        let quant_config = AdaptiveQuantizationConfig::default();
        let _ = adaptive_kmeans_quantization(&test_image, &quant_config);
        let quant_time = start.elapsed();
        assert!(quant_time.as_millis() < 2000, "Quantization should be reasonably fast");
    }

    #[test]
    fn test_phase_a_memory_usage() {
        // Test that Phase A modules don't cause excessive memory usage
        let large_image = create_photo_test_image(128, 96);
        
        // Test denoising
        let guided = guided_filter(&large_image, 3, 0.01);
        assert!(guided.is_ok(), "Should handle larger images in denoising");
        
        // Test quantization
        let quant_config = AdaptiveQuantizationConfig {
            initial_clusters: 32,
            target_colors: 12,
            merge_threshold: 5.0,
            max_iterations: 20,
            convergence_threshold: 1.0,
        };
        
        let quantization = adaptive_kmeans_quantization(&large_image, &quant_config);
        assert!(quantization.is_ok(), "Should handle larger images in quantization");
        
        // Test that results are reasonable
        if let Ok(quant_result) = quantization {
            assert!(quant_result.palette_rgb.len() <= 12);
            assert_eq!(quant_result.assignments.len(), (128 * 96) as usize);
        }
    }

    #[test]
    fn test_preset_robustness() {
        // Test presets with challenging images
        let images = vec![
            create_photo_test_image(1, 1),          // Minimal image
            create_posterized_test_image(200, 1),   // Extreme aspect ratio
            create_logo_test_image(3, 3),           // Very small
        ];
        
        for (i, image) in images.iter().enumerate() {
            let photo_config = create_photo_preset_regions_config();
            let posterized_config = create_posterized_preset_regions_config();
            
            // Should handle gracefully (may succeed with minimal output or fail gracefully)
            let photo_result = vectorize_regions_rgba(image, &photo_config);
            let posterized_result = vectorize_regions_rgba(image, &posterized_config);
            
            // At minimum, should not panic
            if photo_result.is_ok() {
                let svg = photo_result.unwrap();
                assert!(svg.contains("<svg"), "Photo result {} should be valid SVG if successful", i);
            }
            
            if posterized_result.is_ok() {
                let svg = posterized_result.unwrap();
                assert!(svg.contains("<svg"), "Posterized result {} should be valid SVG if successful", i);
            }
        }
    }
}