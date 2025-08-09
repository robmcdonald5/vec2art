//! Integration tests for telemetry generation with Phase A modules

use crate::*;
use crate::telemetry::*;
use crate::segmentation::*;
use crate::tracing::*;
use crate::fills::*;
use image::{ImageBuffer, Rgba};
use serde_json;

/// Create a test image for telemetry testing
fn create_telemetry_test_image(width: u32, height: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut image = ImageBuffer::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Create pattern that exercises telemetry
            let r = ((x as f32 / width as f32) * 255.0) as u8;
            let g = ((y as f32 / height as f32) * 255.0) as u8;
            let b = ((x + y) % 256) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_telemetry_dump_generation() {
        let image = create_telemetry_test_image(40, 30);
        
        // Create telemetry dump using the actual API
        let resolved = Resolved {
            dp_eps_px: 2.5,
            min_stroke_px: Some(1.0),
            slic_step_px: Some(25),
            slic_iters: Some(10),
            slic_compactness: Some(12.0),
            de_merge: Some(4.0),
            de_split: Some(8.0),
            palette_k: Some(12),
            sauvola_k: None,
            sauvola_window: None,
            morph_kernel_px: None,
            min_region_area_px: Some(150),
        };
        
        let guards = Guards {
            retries: 0,
            edge_barrier_thresh: None,
            area_floor_px: Some(100),
        };
        
        let stats = Stats {
            paths: 12,
            median_vertices: 8.5,
            pct_quads: 0.15,
            k_colors: 8,
            max_region_pct: 0.25,
            svg_bytes: 2048,
        };
        
        let dump = make_dump(
            "test_image.png",
            image.width(),
            image.height(),
            "regions",
            Some("slic"),
            serde_json::json!({"num_colors": 12, "slic_step_px": 25}),
            resolved,
            guards,
            stats,
        );
        
        // Verify dump structure
        assert_eq!(dump.image.path, "test_image.png");
        assert_eq!(dump.image.w, 40);
        assert_eq!(dump.image.h, 30);
        assert_eq!(dump.image.area, 1200);
        assert_eq!(dump.mode, "regions");
        assert_eq!(dump.backend, Some("slic".to_string()));
        
        // Verify resolved parameters
        assert_eq!(dump.resolved.dp_eps_px, 2.5);
        assert_eq!(dump.resolved.slic_step_px, Some(25));
        assert_eq!(dump.resolved.palette_k, Some(12));
        
        // Verify guards
        assert_eq!(dump.guards.retries, 0);
        assert_eq!(dump.guards.area_floor_px, Some(100));
        
        // Verify stats
        assert_eq!(dump.stats.paths, 12);
        assert_eq!(dump.stats.k_colors, 8);
        assert_eq!(dump.stats.svg_bytes, 2048);
        
        // Verify build info exists
        assert!(!dump.build.version.is_empty());
        assert!(!dump.build.git_sha.is_empty());
    }

    #[test]
    fn test_telemetry_json_serialization() {
        let image = create_telemetry_test_image(32, 24);
        
        let resolved = Resolved {
            dp_eps_px: 1.5,
            min_stroke_px: Some(0.8),
            slic_step_px: Some(20),
            slic_iters: Some(15),
            slic_compactness: Some(10.0),
            de_merge: Some(3.0),
            de_split: Some(6.0),
            palette_k: Some(8),
            sauvola_k: None,
            sauvola_window: None,
            morph_kernel_px: None,
            min_region_area_px: Some(100),
        };
        
        let guards = Guards {
            retries: 2,
            edge_barrier_thresh: Some(50),
            area_floor_px: Some(200),
        };
        
        let stats = Stats {
            paths: 8,
            median_vertices: 12.3,
            pct_quads: 0.25,
            k_colors: 5,
            max_region_pct: 0.35,
            svg_bytes: 1500,
        };
        
        let dump = make_dump(
            "telemetry_test.png",
            image.width(),
            image.height(),
            "regions",
            Some("kmeans"),
            serde_json::json!({"test": true}),
            resolved,
            guards,
            stats,
        );
        
        // Test JSON serialization
        let json_result = serde_json::to_string_pretty(&dump);
        assert!(json_result.is_ok(), "Should serialize to JSON successfully");
        
        let json_str = json_result.unwrap();
        assert!(json_str.contains("\"mode\": \"regions\""));
        assert!(json_str.contains("\"retries\": 2"));
        assert!(json_str.contains("\"paths\": 8"));
        
        // Test deserialization
        let parsed: Result<Dump, _> = serde_json::from_str(&json_str);
        assert!(parsed.is_ok(), "Should deserialize from JSON successfully");
        
        let parsed_dump = parsed.unwrap();
        assert_eq!(parsed_dump.mode, "regions");
        assert_eq!(parsed_dump.guards.retries, 2);
        assert_eq!(parsed_dump.stats.paths, 8);
    }

    #[test]
    fn test_telemetry_with_phase_a_adaptive_quantization() {
        let image = create_telemetry_test_image(36, 28);
        
        // Test adaptive quantization
        let quant_config = AdaptiveQuantizationConfig {
            initial_clusters: 16,
            target_colors: 8,
            merge_threshold: 5.0,
            max_iterations: 25,
            convergence_threshold: 1.0,
        };
        
        let start_time = std::time::Instant::now();
        let quant_result = adaptive_kmeans_quantization(&image, &quant_config);
        let duration = start_time.elapsed();
        
        assert!(quant_result.is_ok(), "Quantization should succeed");
        let quantization = quant_result.unwrap();
        
        // Create telemetry for quantization results
        let resolved = Resolved {
            dp_eps_px: 1.0,
            palette_k: Some(quantization.palette_rgb.len() as u32),
            de_merge: Some(quant_config.merge_threshold as f64),
            ..Default::default()
        };
        
        let guards = Guards::default();
        
        let stats = Stats {
            paths: 0, // Not applicable for quantization alone
            median_vertices: 0.0,
            pct_quads: 0.0,
            k_colors: quantization.palette_rgb.len() as u32,
            max_region_pct: 0.0,
            svg_bytes: 0,
        };
        
        let dump = make_dump(
            "quant_test.png",
            image.width(),
            image.height(),
            "adaptive_quantization",
            None,
            serde_json::to_value(&quant_config).unwrap(),
            resolved,
            guards,
            stats,
        );
        
        // Verify quantization-specific telemetry
        assert_eq!(dump.mode, "adaptive_quantization");
        assert_eq!(dump.stats.k_colors, quantization.palette_rgb.len() as u32);
        assert!(dump.resolved.palette_k.is_some());
        assert!(dump.resolved.de_merge.is_some());
        
        // Should be reasonably fast
        assert!(duration.as_millis() < 5000, "Quantization should be reasonably fast: {:?}", duration);
    }

    #[test]
    fn test_telemetry_with_phase_a_curve_fitting() {
        // Create path data for curve fitting
        let mut path_points = Vec::new();
        for i in 0..15 {
            let t = (i as f64) / 14.0;
            let x = t * 20.0;
            let y = 5.0 + 3.0 * (t * std::f64::consts::PI).sin();
            path_points.push(Point2D::new(x, y));
        }
        
        let start_time = std::time::Instant::now();
        let curve_result = fit_cubic_bezier(&path_points, None, None, 0.5);
        let duration = start_time.elapsed();
        
        assert!(curve_result.is_ok(), "Curve fitting should succeed");
        let _fitted_curve = curve_result.unwrap();
        
        // Create telemetry for curve fitting
        let resolved = Resolved {
            dp_eps_px: 0.5,
            min_stroke_px: Some(1.0),
            ..Default::default()
        };
        
        let guards = Guards::default();
        
        let stats = Stats {
            paths: 1,
            median_vertices: 4.0, // Cubic Bézier has 4 control points
            pct_quads: 0.0,
            k_colors: 1,
            max_region_pct: 1.0,
            svg_bytes: 200, // Estimated for single path
        };
        
        let dump = make_dump(
            "path_data.json",
            20, // Approximate width of path
            11, // Approximate height of path
            "curve_fitting",
            Some("cubic_bezier"),
            serde_json::json!({"max_error": 0.5}),
            resolved,
            guards,
            stats,
        );
        
        // Verify curve fitting telemetry
        assert_eq!(dump.mode, "curve_fitting");
        assert_eq!(dump.stats.paths, 1);
        assert_eq!(dump.stats.median_vertices, 4.0);
        
        // Should be very fast for small path
        assert!(duration.as_millis() < 100, "Curve fitting should be fast: {:?}", duration);
    }

    #[test]
    fn test_telemetry_with_phase_a_gradients() {
        let image = create_telemetry_test_image(30, 20);
        let mut pixels = Vec::new();
        
        // Create region for gradient analysis
        for y in 0..20 {
            for x in 0..30 {
                pixels.push((x, y));
            }
        }
        
        let start_time = std::time::Instant::now();
        let gradient_result = analyze_region_gradient_pca(&pixels, &image, 3);
        let duration = start_time.elapsed();
        
        assert!(gradient_result.is_ok(), "Gradient analysis should succeed");
        
        let gradient = gradient_result.unwrap();
        let has_gradient = gradient.is_some();
        let _error_reduction = if let Some(ref grad) = gradient {
            grad.error_reduction
        } else {
            0.0
        };
        
        // Create telemetry for gradient analysis
        let resolved = Resolved {
            dp_eps_px: 0.0, // Not applicable
            ..Default::default()
        };
        
        let guards = Guards::default();
        
        let stats = Stats {
            paths: if has_gradient { 1 } else { 0 },
            median_vertices: if has_gradient { 6.0 } else { 0.0 },
            pct_quads: 0.0,
            k_colors: if has_gradient { 2 } else { 1 }, // Gradient has multiple colors
            max_region_pct: 1.0,
            svg_bytes: if has_gradient { 500 } else { 100 },
        };
        
        let dump = make_dump(
            "gradient_test.png",
            image.width(),
            image.height(),
            "gradient_analysis",
            Some("pca"),
            serde_json::json!({"max_stops": 3}),
            resolved,
            guards,
            stats,
        );
        
        // Verify gradient analysis telemetry
        assert_eq!(dump.mode, "gradient_analysis");
        assert_eq!(dump.image.w * dump.image.h, 600); // 30 * 20 pixels
        
        // Should be reasonably fast
        assert!(duration.as_millis() < 1000, "Gradient analysis should be fast: {:?}", duration);
    }

    #[test]
    fn test_guards_telemetry() {
        let small_image = create_telemetry_test_image(8, 6); // Very small
        
        // Simulate guard trigger
        let resolved = Resolved {
            dp_eps_px: 1.0,
            min_region_area_px: Some(50),
            ..Default::default()
        };
        
        let guards = Guards {
            retries: 1,
            edge_barrier_thresh: Some(30),
            area_floor_px: Some(25),
        };
        
        let stats = Stats {
            paths: 2, // Fallback processing
            median_vertices: 4.0,
            pct_quads: 0.1,
            k_colors: 2,
            max_region_pct: 0.6,
            svg_bytes: 300,
        };
        
        let dump = make_dump(
            "small_test.png",
            small_image.width(),
            small_image.height(),
            "regions",
            Some("fallback"),
            serde_json::json!({"guard_trigger": "image too small"}),
            resolved,
            guards,
            stats,
        );
        
        // Verify guard telemetry
        assert_eq!(dump.guards.retries, 1);
        assert_eq!(dump.guards.edge_barrier_thresh, Some(30));
        assert_eq!(dump.guards.area_floor_px, Some(25));
        
        // Small image should have appropriate stats
        assert_eq!(dump.stats.paths, 2);
        assert!(dump.stats.max_region_pct > 0.5); // Large regions due to small image
    }

    #[test]
    fn test_comprehensive_telemetry_integration() {
        let image = create_telemetry_test_image(50, 35);
        
        // Simulate full processing pipeline with telemetry
        let resolved = Resolved {
            dp_eps_px: 2.8,
            min_stroke_px: Some(1.2),
            slic_step_px: Some(25),
            slic_iters: Some(12),
            slic_compactness: Some(15.0),
            de_merge: Some(4.0),
            de_split: Some(8.0),
            palette_k: Some(15),
            sauvola_k: None,
            sauvola_window: None,
            morph_kernel_px: None,
            min_region_area_px: Some(150),
        };
        
        let guards = Guards {
            retries: 0,
            edge_barrier_thresh: None,
            area_floor_px: Some(100),
        };
        
        let stats = Stats {
            paths: 18,
            median_vertices: 9.2,
            pct_quads: 0.12,
            k_colors: 15,
            max_region_pct: 0.18,
            svg_bytes: 4096,
        };
        
        let dump = make_dump(
            "comprehensive_test.png",
            image.width(),
            image.height(),
            "regions",
            Some("slic"),
            serde_json::json!({"comprehensive": true, "phase_a": true}),
            resolved,
            guards,
            stats,
        );
        
        // Comprehensive verification
        assert_eq!(dump.mode, "regions");
        assert_eq!(dump.image.path, "comprehensive_test.png");
        assert_eq!(dump.backend, Some("slic".to_string()));
        
        // Check image parameters
        assert_eq!(dump.image.w, 50);
        assert_eq!(dump.image.h, 35);
        assert_eq!(dump.image.diag_px, ((50.0 * 50.0 + 35.0 * 35.0) as f64).sqrt());
        
        // Check resolved parameters
        assert_eq!(dump.resolved.dp_eps_px, 2.8);
        assert_eq!(dump.resolved.slic_step_px, Some(25));
        assert_eq!(dump.resolved.palette_k, Some(15));
        assert_eq!(dump.resolved.de_merge, Some(4.0));
        
        // Check stats
        assert_eq!(dump.stats.paths, 18);
        assert_eq!(dump.stats.k_colors, 15);
        assert_eq!(dump.stats.svg_bytes, 4096);
        
        // Verify realistic relationships
        assert!(dump.stats.paths >= dump.stats.k_colors / 2, 
               "Should have reasonable path to color ratio");
        assert!(dump.stats.median_vertices >= 3.0, 
               "Should have reasonable vertex count");
        assert!(dump.stats.pct_quads >= 0.0 && dump.stats.pct_quads <= 1.0, 
               "Quad percentage should be valid");
        assert!(dump.stats.max_region_pct >= 0.0 && dump.stats.max_region_pct <= 1.0, 
               "Max region percentage should be valid");
    }

    #[test]
    fn test_build_info_integration() {
        let dump = make_dump(
            "test.png",
            10,
            10,
            "test",
            None,
            serde_json::json!({}),
            Resolved::default(),
            Guards::default(),
            Stats {
                paths: 1,
                median_vertices: 4.0,
                pct_quads: 0.0,
                k_colors: 1,
                max_region_pct: 1.0,
                svg_bytes: 100,
            },
        );
        
        // Verify build info
        assert!(!dump.build.version.is_empty(), "Version should not be empty");
        assert!(!dump.build.git_sha.is_empty(), "Git SHA should not be empty");
        assert!(!dump.build.branch.is_empty(), "Branch should not be empty");
        assert!(!dump.build.built_at.is_empty(), "Build timestamp should not be empty");
        
        // Build timestamp should be ISO 8601 format (basic validation)
        assert!(dump.build.built_at.len() > 10, "Build timestamp should be reasonable length");
        assert!(dump.build.built_at.contains("T"), "Should contain ISO 8601 time separator");
    }

    #[test]
    fn test_telemetry_diagonal_calculation() {
        // Test that diagonal calculation is correct
        let dump = make_dump(
            "test.png",
            30,
            40,
            "test",
            None,
            serde_json::json!({}),
            Resolved::default(),
            Guards::default(),
            Stats {
                paths: 1,
                median_vertices: 4.0,
                pct_quads: 0.0,
                k_colors: 1,
                max_region_pct: 1.0,
                svg_bytes: 100,
            },
        );
        
        let expected_diag = ((30.0 * 30.0 + 40.0 * 40.0) as f64).sqrt();
        assert!((dump.image.diag_px - expected_diag).abs() < 0.001, 
               "Diagonal should be calculated correctly: got {}, expected {}", 
               dump.image.diag_px, expected_diag);
    }

    #[test]
    fn test_telemetry_cli_json_preservation() {
        let cli_data = serde_json::json!({
            "algorithm": "regions",
            "num_colors": 12,
            "slic_step_px": 25,
            "detect_gradients": true,
            "phase_a_enabled": true
        });
        
        let dump = make_dump(
            "test.png",
            20,
            20,
            "regions",
            Some("slic"),
            cli_data.clone(),
            Resolved::default(),
            Guards::default(),
            Stats {
                paths: 5,
                median_vertices: 6.0,
                pct_quads: 0.1,
                k_colors: 8,
                max_region_pct: 0.3,
                svg_bytes: 800,
            },
        );
        
        // CLI JSON should be preserved exactly
        assert_eq!(dump.cli, cli_data);
        assert_eq!(dump.cli["algorithm"], "regions");
        assert_eq!(dump.cli["num_colors"], 12);
        assert_eq!(dump.cli["phase_a_enabled"], true);
    }
}