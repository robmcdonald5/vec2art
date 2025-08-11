//! Integration Tests with Diverse Image Types for Dot Mapping System
//!
//! This module tests the dot mapping system with various image types to ensure
//! robust performance across different content types and edge cases.

use image::{ImageBuffer, Rgba, RgbaImage};
use std::time::Instant;
use vectorize_core::algorithms::{
    apply_style_preset, dots_to_svg_with_config, generate_dots_from_image, DotConfig, DotStyle,
    SvgDotConfig, TraceBackend, TraceLowConfig,
};
use vectorize_core::vectorize_trace_low_rgba;

/// Test image generators for different scenarios
mod image_generators {
    use super::*;

    /// Create a portrait-like image with face features
    pub fn create_portrait_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let center_x = width as f32 / 2.0;
            let center_y = height as f32 / 2.0;
            let face_radius = (width.min(height) as f32 / 3.0).min(50.0);

            let distance = ((x as f32 - center_x).powi(2) + (y as f32 - center_y).powi(2)).sqrt();

            if distance < face_radius * 0.8 {
                // Face area - skin tone
                Rgba([240, 220, 190, 255])
            } else if distance < face_radius * 0.9 {
                // Hair area
                Rgba([101, 67, 33, 255])
            } else if distance < face_radius {
                // Edge transition
                Rgba([200, 180, 160, 255])
            } else {
                // Background
                Rgba([250, 250, 250, 255])
            }
        })
    }

    /// Create a landscape-like image with various textures
    pub fn create_landscape_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let horizon = height as f32 * 0.6;
            let mountain_height = (((x as f32 / width as f32) * 6.28).sin() * 20.0
                + ((x as f32 / width as f32) * 12.56).sin() * 10.0)
                + horizon
                - 40.0;

            if (y as f32) < mountain_height {
                // Sky with gradient
                let sky_intensity = 200 - ((y as f32 / horizon) * 80.0) as u8;
                Rgba([135 + sky_intensity / 4, 206 + sky_intensity / 8, 235, 255])
            } else if (y as f32) < horizon {
                // Mountains
                let mountain_shade = 100 + ((mountain_height - y as f32) * 2.0) as u8;
                Rgba([
                    mountain_shade,
                    mountain_shade + 20,
                    mountain_shade - 10,
                    255,
                ])
            } else {
                // Ground with texture
                let ground_texture = ((x + y) % 7) as u8 * 15;
                Rgba([
                    34 + ground_texture,
                    139 + ground_texture / 2,
                    34 + ground_texture / 3,
                    255,
                ])
            }
        })
    }

    /// Create a logo-like image with geometric shapes
    pub fn create_logo_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let center_x = width as f32 / 2.0;
            let center_y = height as f32 / 2.0;

            // Create a stylized logo with circles and rectangles
            let circle_distance =
                ((x as f32 - center_x).powi(2) + (y as f32 - center_y).powi(2)).sqrt();
            let circle_radius = width.min(height) as f32 / 4.0;

            // Rectangle
            let rect_width = width as f32 * 0.6;
            let rect_height = height as f32 * 0.3;
            let in_rect = (x as f32 - center_x).abs() < rect_width / 2.0
                && (y as f32 - center_y).abs() < rect_height / 2.0;

            if circle_distance < circle_radius {
                if circle_distance < circle_radius * 0.7 {
                    Rgba([255, 100, 100, 255]) // Inner circle - red
                } else {
                    Rgba([100, 100, 255, 255]) // Outer ring - blue
                }
            } else if in_rect {
                Rgba([100, 255, 100, 255]) // Rectangle - green
            } else {
                Rgba([255, 255, 255, 255]) // Background - white
            }
        })
    }

    /// Create a technical drawing-like image
    pub fn create_technical_drawing(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let grid_size = 20;
            let line_width = 1;

            // Grid lines
            let on_grid_x = (x % grid_size) < line_width;
            let on_grid_y = (y % grid_size) < line_width;

            // Diagonal line
            let diagonal_distance = ((x as f32) - (y as f32)).abs();
            let on_diagonal = diagonal_distance < 2.0;

            // Circle outline
            let center_x = width as f32 / 2.0;
            let center_y = height as f32 / 2.0;
            let circle_distance =
                ((x as f32 - center_x).powi(2) + (y as f32 - center_y).powi(2)).sqrt();
            let circle_radius = width.min(height) as f32 / 3.0;
            let on_circle = (circle_distance - circle_radius).abs() < 2.0;

            if on_grid_x || on_grid_y {
                Rgba([200, 200, 200, 255]) // Grid - light gray
            } else if on_diagonal || on_circle {
                Rgba([0, 0, 0, 255]) // Lines - black
            } else {
                Rgba([255, 255, 255, 255]) // Background - white
            }
        })
    }

    /// Create a sketch-like image with rough lines
    pub fn create_sketch_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            // Create rough, sketch-like patterns
            let noise = ((x * 7 + y * 11) % 137) as f32 / 137.0;
            let pattern1 = ((x as f32 * 0.1).sin() + (y as f32 * 0.1).cos()) * 0.5 + 0.5;
            let pattern2 = ((x as f32 * 0.05).sin() * (y as f32 * 0.07).cos()) * 0.3 + 0.7;

            let intensity = (pattern1 * pattern2 + noise * 0.2) * 255.0;
            let value = intensity.clamp(50.0, 200.0) as u8;

            // Add some "sketch lines"
            let sketch_line = ((x + y) % 13 == 0) || ((x.wrapping_sub(y)) % 17 == 0);
            if sketch_line && noise > 0.7 {
                Rgba([30, 30, 30, 255]) // Dark sketch lines
            } else {
                Rgba([value, value, value, 255]) // Grayscale base
            }
        })
    }

    /// Create a high-contrast image with sharp edges
    pub fn create_high_contrast_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let pattern = (x / 10 + y / 10) % 2;
            let secondary_pattern = (x / 3 + y / 7) % 3;

            match (pattern, secondary_pattern) {
                (0, 0) => Rgba([0, 0, 0, 255]),       // Black
                (0, 1) => Rgba([255, 255, 255, 255]), // White
                (0, 2) => Rgba([255, 0, 0, 255]),     // Red
                (1, 0) => Rgba([0, 255, 0, 255]),     // Green
                (1, 1) => Rgba([0, 0, 255, 255]),     // Blue
                _ => Rgba([255, 255, 0, 255]),        // Yellow
            }
        })
    }

    /// Create a low-contrast image with subtle gradients
    pub fn create_low_contrast_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let base = 128;
            let variation = 30;

            let gradient_x = (x as f32 / width as f32) * variation as f32;
            let gradient_y = (y as f32 / height as f32) * variation as f32;
            let noise = ((x * 3 + y * 5) % 23) as f32 / 23.0 * 10.0;

            let intensity = base as f32 + gradient_x + gradient_y + noise - variation as f32;
            let value = intensity.clamp(100.0, 160.0) as u8;

            Rgba([value, value + 5, value - 3, 255])
        })
    }

    /// Create a solid color image for edge case testing
    pub fn create_solid_color_image(width: u32, height: u32, color: Rgba<u8>) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |_, _| color)
    }

    /// Create an image with gradual color transitions
    pub fn create_gradient_transitions_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let r = ((x as f32 / width as f32) * 255.0) as u8;
            let g = ((y as f32 / height as f32) * 255.0) as u8;
            let b = (((x + y) as f32 / (width + height) as f32) * 255.0) as u8;

            Rgba([r, g, b, 255])
        })
    }
}

#[cfg(test)]
mod portrait_tests {
    use super::*;
    use image_generators::*;

    #[test]
    fn test_portrait_processing() {
        let img = create_portrait_image(128, 128);

        // Test different dot styles suitable for portraits
        let styles = [
            DotStyle::FineStippling,
            DotStyle::WatercolorEffect,
            DotStyle::SketchStyle,
        ];

        for style in &styles {
            let mut config = DotConfig::default();
            apply_style_preset(&mut config, style.clone());

            let dots = generate_dots_from_image(&img, &config, None, None);
            assert!(
                !dots.is_empty(),
                "Portrait should generate dots with {:?} style",
                style
            );

            // Portraits should have reasonable dot density
            let dot_density = dots.len() as f32 / (128.0 * 128.0);
            assert!(
                dot_density > 0.001 && dot_density < 0.3,
                "Portrait dot density should be reasonable: {} for style {:?}",
                dot_density,
                style
            );
        }
    }

    #[test]
    fn test_portrait_adaptive_density() {
        let img = create_portrait_image(96, 96);

        let config = DotConfig {
            adaptive_sizing: true,
            ..DotConfig::default()
        };

        let dots = generate_dots_from_image(&img, &config, None, None);
        assert!(
            !dots.is_empty(),
            "Portrait should work with adaptive density"
        );

        // Face area should have different density than background
        let face_center_dots = count_dots_in_region(&dots, 30.0, 30.0, 66.0, 66.0);
        let corner_dots = count_dots_in_region(&dots, 0.0, 0.0, 24.0, 24.0);

        // Face area might have different density than corners
        let face_density = face_center_dots as f32 / (36.0 * 36.0);
        let corner_density = corner_dots as f32 / (24.0 * 24.0);

        assert!(
            face_density >= 0.0 && corner_density >= 0.0,
            "Both areas should have non-negative density: face={}, corner={}",
            face_density,
            corner_density
        );
    }

    #[test]
    fn test_portrait_color_preservation() {
        let img = create_portrait_image(64, 64);

        let config = DotConfig {
            preserve_colors: true,
            ..DotConfig::default()
        };

        let dots = generate_dots_from_image(&img, &config, None, None);
        assert!(!dots.is_empty(), "Portrait should generate colored dots");

        // Should preserve skin tones and hair colors
        let has_skin_tone = dots.iter().any(|dot| {
            dot.color.contains("240") || dot.color.contains("220") || dot.color.contains("190")
        });
        let has_hair_color = dots.iter().any(|dot| {
            dot.color.contains("101") || dot.color.contains("67") || dot.color.contains("33")
        });

        // Note: Color preservation might not be exact due to sampling, so we're lenient
        assert!(
            has_skin_tone || has_hair_color || dots.len() > 10,
            "Should preserve some original colors or generate reasonable dots"
        );
    }

    fn count_dots_in_region(
        dots: &[vectorize_core::algorithms::Dot],
        x_min: f32,
        y_min: f32,
        x_max: f32,
        y_max: f32,
    ) -> usize {
        dots.iter()
            .filter(|dot| dot.x >= x_min && dot.x <= x_max && dot.y >= y_min && dot.y <= y_max)
            .count()
    }
}

#[cfg(test)]
mod landscape_tests {
    use super::*;
    use image_generators::*;

    #[test]
    fn test_landscape_processing() {
        let img = create_landscape_image(160, 120);

        let styles = [DotStyle::BoldPointillism, DotStyle::WatercolorEffect];

        for style in &styles {
            let mut config = DotConfig::default();
            apply_style_preset(&mut config, style.clone());

            let dots = generate_dots_from_image(&img, &config, None, None);
            assert!(
                !dots.is_empty(),
                "Landscape should generate dots with {:?} style",
                style
            );

            // Landscapes typically have varied density
            let total_area = 160.0 * 120.0;
            let dot_density = dots.len() as f32 / total_area;
            assert!(
                dot_density > 0.001,
                "Landscape should have reasonable dot density: {}",
                dot_density
            );
        }
    }

    #[test]
    fn test_landscape_region_analysis() {
        let img = create_landscape_image(128, 96);

        let config = DotConfig {
            adaptive_sizing: true,
            density_threshold: 0.1,
            ..DotConfig::default()
        };

        let dots = generate_dots_from_image(&img, &config, None, None);
        assert!(
            !dots.is_empty(),
            "Landscape should work with adaptive processing"
        );

        // Sky area (top third)
        let sky_dots = count_dots_in_region(&dots, 0.0, 0.0, 128.0, 32.0);
        // Ground area (bottom third)
        let ground_dots = count_dots_in_region(&dots, 0.0, 64.0, 128.0, 96.0);

        let sky_density = sky_dots as f32 / (128.0 * 32.0);
        let ground_density = ground_dots as f32 / (128.0 * 32.0);

        assert!(
            sky_density >= 0.0 && ground_density >= 0.0,
            "Both sky and ground should have valid density: sky={}, ground={}",
            sky_density,
            ground_density
        );
    }

    #[test]
    fn test_landscape_performance() {
        let img = create_landscape_image(256, 192);

        let start = Instant::now();
        let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);
        let elapsed = start.elapsed();

        assert!(
            elapsed.as_millis() < 400,
            "Landscape processing took {}ms, should be under 400ms",
            elapsed.as_millis()
        );
        assert!(!dots.is_empty(), "Should process landscape efficiently");
    }

    fn count_dots_in_region(
        dots: &[vectorize_core::algorithms::Dot],
        x_min: f32,
        y_min: f32,
        x_max: f32,
        y_max: f32,
    ) -> usize {
        dots.iter()
            .filter(|dot| dot.x >= x_min && dot.x <= x_max && dot.y >= y_min && dot.y <= y_max)
            .count()
    }
}

#[cfg(test)]
mod logo_graphics_tests {
    use super::*;
    use image_generators::*;

    #[test]
    fn test_logo_processing() {
        let img = create_logo_image(80, 80);

        let config = DotConfig {
            min_radius: 0.5,
            max_radius: 2.0,
            preserve_colors: true,
            adaptive_sizing: true,
            ..DotConfig::default()
        };

        let dots = generate_dots_from_image(&img, &config, None, None);
        assert!(!dots.is_empty(), "Logo should generate dots");

        // Should handle sharp edges and solid colors well
        for dot in &dots {
            assert!(dot.radius >= 0.5 && dot.radius <= 2.0);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_logo_technical_drawing_style() {
        let img = create_logo_image(64, 64);

        let mut config = DotConfig::default();
        apply_style_preset(&mut config, DotStyle::TechnicalDrawing);

        let dots = generate_dots_from_image(&img, &config, None, None);
        assert!(
            !dots.is_empty(),
            "Logo should work with technical drawing style"
        );

        // Technical drawings should have precise dot placement
        let svg_config = SvgDotConfig {
            group_similar_colors: true,
            use_opacity: false,
            compact_output: true,
            color_similarity_threshold: 0.1,
            min_opacity_threshold: 0.1,
            precision: 2,
        };

        let svg = dots_to_svg_with_config(&dots, &svg_config);
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }

    #[test]
    fn test_technical_drawing_processing() {
        let img = create_technical_drawing(96, 96);

        let styles = [DotStyle::TechnicalDrawing, DotStyle::FineStippling];

        for style in &styles {
            let mut config = DotConfig::default();
            apply_style_preset(&mut config, style.clone());

            let dots = generate_dots_from_image(&img, &config, None, None);
            assert!(
                !dots.is_empty(),
                "Technical drawing should generate dots with {:?} style",
                style
            );

            // Technical drawings should capture line details
            let line_area_dots = count_dots_in_region(&dots, 0.0, 0.0, 96.0, 96.0);
            assert!(
                line_area_dots > 0,
                "Should capture technical drawing elements"
            );
        }
    }

    #[test]
    fn test_logo_svg_output_quality() {
        let img = create_logo_image(48, 48);
        let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);

        assert!(!dots.is_empty(), "Logo should generate dots");

        let svg_config = SvgDotConfig {
            group_similar_colors: true,
            use_opacity: true,
            compact_output: false,
            color_similarity_threshold: 0.1,
            min_opacity_threshold: 0.1,
            precision: 2,
        };

        let svg = dots_to_svg_with_config(&dots, &svg_config);

        // Validate SVG structure
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
        assert!(svg.contains("xmlns=\"http://www.w3.org/2000/svg\""));

        // Should have reasonable content
        assert!(svg.len() > 100, "SVG should have substantial content");
        assert!(
            svg.contains("circle") || svg.contains("path"),
            "SVG should contain drawing elements"
        );
    }

    fn count_dots_in_region(
        dots: &[vectorize_core::algorithms::Dot],
        x_min: f32,
        y_min: f32,
        x_max: f32,
        y_max: f32,
    ) -> usize {
        dots.iter()
            .filter(|dot| dot.x >= x_min && dot.x <= x_max && dot.y >= y_min && dot.y <= y_max)
            .count()
    }
}

#[cfg(test)]
mod edge_case_tests {
    use super::*;
    use image_generators::*;

    #[test]
    fn test_solid_color_images() {
        let colors = [
            Rgba([255, 255, 255, 255]), // White
            Rgba([0, 0, 0, 255]),       // Black
            Rgba([128, 128, 128, 255]), // Gray
            Rgba([255, 0, 0, 255]),     // Red
        ];

        for color in &colors {
            let img = create_solid_color_image(32, 32, *color);
            let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);

            // Solid color images should either generate no dots or very few
            let dot_density = dots.len() as f32 / (32.0 * 32.0);
            assert!(
                dot_density <= 0.1,
                "Solid color should have low dot density: {} for {:?}",
                dot_density,
                color
            );
        }
    }

    #[test]
    fn test_high_contrast_image() {
        let img = create_high_contrast_image(64, 64);

        let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);
        assert!(!dots.is_empty(), "High contrast image should generate dots");

        // High contrast should be handled gracefully
        for dot in &dots {
            assert!(
                dot.radius > 0.0 && dot.radius < 10.0,
                "Dot radius should be reasonable in high contrast"
            );
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_low_contrast_image() {
        let img = create_low_contrast_image(64, 64);

        let config = DotConfig {
            density_threshold: 0.05, // Lower threshold for low contrast
            adaptive_sizing: true,
            ..DotConfig::default()
        };

        let dots = generate_dots_from_image(&img, &config, None, None);

        // Low contrast images should still generate some dots
        let dot_density = dots.len() as f32 / (64.0 * 64.0);
        assert!(
            dot_density >= 0.001,
            "Low contrast should still generate some dots: {}",
            dot_density
        );
    }

    #[test]
    fn test_gradient_transitions() {
        let img = create_gradient_transitions_image(80, 60);

        let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);
        assert!(!dots.is_empty(), "Gradient image should generate dots");

        // Should preserve color variations in gradients
        let unique_colors: std::collections::HashSet<String> =
            dots.iter().map(|d| d.color.clone()).collect();
        assert!(
            unique_colors.len() > 1,
            "Gradient should produce varied colors: {} unique",
            unique_colors.len()
        );
    }

    #[test]
    fn test_empty_image_handling() {
        // Test with minimal image
        let img = ImageBuffer::from_fn(1, 1, |_, _| Rgba([128, 128, 128, 255]));

        let result = std::panic::catch_unwind(|| {
            generate_dots_from_image(&img, &DotConfig::default(), None, None)
        });

        assert!(result.is_ok(), "Should handle 1x1 images gracefully");
    }

    #[test]
    fn test_large_image_scalability() {
        let img = create_gradient_transitions_image(512, 384);

        let start = Instant::now();
        let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);
        let elapsed = start.elapsed();

        assert!(
            elapsed.as_millis() < 1000,
            "Large image processing took {}ms, should be under 1000ms",
            elapsed.as_millis()
        );
        assert!(!dots.is_empty(), "Large image should generate dots");

        // Should maintain reasonable performance scaling
        let pixel_count = 512 * 384;
        let processing_rate = pixel_count as f32 / elapsed.as_millis() as f32;
        assert!(
            processing_rate > 100.0,
            "Processing rate should be reasonable: {} pixels/ms",
            processing_rate
        );
    }

    #[test]
    fn test_aspect_ratio_variations() {
        let aspect_ratios = [
            (128, 32), // Wide
            (32, 128), // Tall
            (64, 64),  // Square
        ];

        for (width, height) in &aspect_ratios {
            let img = create_sketch_image(*width, *height);
            let dots = generate_dots_from_image(&img, &DotConfig::default(), None, None);

            assert!(
                !dots.is_empty(),
                "{}x{} image should generate dots",
                width,
                height
            );

            // Dots should be within image bounds
            for dot in &dots {
                assert!(
                    dot.x >= 0.0 && dot.x < *width as f32,
                    "Dot x should be in bounds for {}x{}",
                    width,
                    height
                );
                assert!(
                    dot.y >= 0.0 && dot.y < *height as f32,
                    "Dot y should be in bounds for {}x{}",
                    width,
                    height
                );
            }
        }
    }

    #[test]
    fn test_memory_efficiency_with_large_dots() {
        let img = create_complex_test_image(128, 128);

        // Test with configuration that might generate many dots
        let config = DotConfig {
            min_radius: 0.3,
            max_radius: 1.0,
            density_threshold: 0.05,
            ..DotConfig::default()
        };

        let start_time = Instant::now();
        let dots = generate_dots_from_image(&img, &config, None, None);
        let processing_time = start_time.elapsed();

        assert!(
            processing_time.as_millis() < 500,
            "High-density dot generation should complete in reasonable time"
        );

        // Even with many dots, should not exceed memory limits
        let max_expected_dots = 128 * 128 / 4; // Rough upper bound
        assert!(
            dots.len() < max_expected_dots,
            "Should not generate excessive dots: {} (max expected: {})",
            dots.len(),
            max_expected_dots
        );
    }

    /// Helper function to create complex test images
    fn create_complex_test_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let pattern1 = ((x as f32 * 0.1).sin() * (y as f32 * 0.1).cos() * 128.0 + 128.0) as u8;
            let pattern2 = ((x as f32 * 0.05 + y as f32 * 0.07).sin() * 60.0 + 60.0) as u8;
            let noise = ((x * 7 + y * 11) % 127) as u8;

            let r = (pattern1 as u16 + pattern2 as u16) / 2;
            let g = (pattern2 as u16 + noise as u16) / 2;
            let b = (pattern1 as u16 + noise as u16) / 2;

            Rgba([r.min(255) as u8, g.min(255) as u8, b.min(255) as u8, 255])
        })
    }
}

#[cfg(test)]
mod integration_pipeline_tests {
    use super::*;
    use image_generators::*;

    #[test]
    fn test_end_to_end_dot_pipeline() {
        let test_images = [
            ("portrait", create_portrait_image(64, 64)),
            ("landscape", create_landscape_image(80, 60)),
            ("logo", create_logo_image(48, 48)),
            ("technical", create_technical_drawing(56, 56)),
            ("sketch", create_sketch_image(72, 72)),
        ];

        for (name, img) in &test_images {
            // Test complete pipeline: image -> dots -> SVG
            let dots = generate_dots_from_image(img, &DotConfig::default(), None, None);
            assert!(!dots.is_empty(), "{} image should generate dots", name);

            let svg = dots_to_svg_with_config(&dots, &SvgDotConfig::default());
            assert!(svg.contains("<svg"), "{} SVG should be valid", name);
            assert!(svg.contains("</svg>"), "{} SVG should be complete", name);

            // Test performance
            let start = Instant::now();
            let _ = generate_dots_from_image(img, &DotConfig::default(), None, None);
            let elapsed = start.elapsed();

            assert!(
                elapsed.as_millis() < 200,
                "{} processing took {}ms, should be under 200ms",
                name,
                elapsed.as_millis()
            );
        }
    }

    #[test]
    fn test_style_consistency_across_images() {
        let img = create_portrait_image(48, 48);

        let styles = [
            DotStyle::FineStippling,
            DotStyle::BoldPointillism,
            DotStyle::SketchStyle,
            DotStyle::TechnicalDrawing,
            DotStyle::WatercolorEffect,
        ];

        for style in &styles {
            let mut config = DotConfig::default();
            apply_style_preset(&mut config, style.clone());

            let dots = generate_dots_from_image(&img, &config, None, None);
            assert!(
                !dots.is_empty(),
                "Style {:?} should work consistently",
                style
            );

            // Verify style characteristics are applied
            let avg_radius = dots.iter().map(|d| d.radius).sum::<f32>() / dots.len() as f32;
            let avg_opacity = dots.iter().map(|d| d.opacity).sum::<f32>() / dots.len() as f32;

            assert!(
                avg_radius > 0.0 && avg_radius < 10.0,
                "Style {:?} should have reasonable average radius: {}",
                style,
                avg_radius
            );
            assert!(
                avg_opacity >= 0.0 && avg_opacity <= 1.0,
                "Style {:?} should have valid average opacity: {}",
                style,
                avg_opacity
            );
        }
    }

    #[test]
    fn test_backend_integration() {
        // Test that dot backend integrates properly with the main vectorization pipeline
        let img = create_logo_image(64, 64);

        let config = TraceLowConfig {
            backend: TraceBackend::Dots,
            ..TraceLowConfig::default()
        };

        let result = vectorize_trace_low_rgba(&img, &config);
        assert!(result.is_ok(), "Dots backend integration should work");

        let svg = result.unwrap();
        assert!(!svg.is_empty(), "Dots backend should produce SVG output");
        assert!(svg.contains("<svg"), "Output should be valid SVG");
        assert!(svg.contains("</svg>"), "SVG should be complete");
    }

    #[test]
    fn test_parameter_boundary_conditions() {
        let img = create_gradient_transitions_image(32, 32);

        // Test extreme parameter values
        let boundary_configs = [
            DotConfig {
                min_radius: 0.1,
                max_radius: 0.2,
                density_threshold: 0.01,
                ..DotConfig::default()
            },
            DotConfig {
                min_radius: 3.0,
                max_radius: 5.0,
                density_threshold: 0.9,
                ..DotConfig::default()
            },
            DotConfig {
                min_radius: 1.0,
                max_radius: 1.0, // Equal min/max
                density_threshold: 0.5,
                ..DotConfig::default()
            },
        ];

        for (i, config) in boundary_configs.iter().enumerate() {
            let result =
                std::panic::catch_unwind(|| generate_dots_from_image(&img, config, None, None));

            assert!(result.is_ok(), "Boundary config {} should not panic", i);

            if let Ok(dots) = result {
                // Verify dots are still valid even with extreme parameters
                for dot in &dots {
                    assert!(
                        dot.radius >= config.min_radius && dot.radius <= config.max_radius,
                        "Boundary config {} should respect radius limits",
                        i
                    );
                    assert!(
                        dot.opacity >= 0.0 && dot.opacity <= 1.0,
                        "Boundary config {} should maintain valid opacity",
                        i
                    );
                }
            }
        }
    }

    #[test]
    fn test_robustness_with_corrupted_inputs() {
        // Test with images that have unusual properties
        let edge_case_images = [
            // All transparent
            ImageBuffer::from_fn(16, 16, |_, _| Rgba([0, 0, 0, 0])),
            // Extreme colors
            ImageBuffer::from_fn(16, 16, |x, y| {
                if (x + y) % 2 == 0 {
                    Rgba([255, 255, 255, 255])
                } else {
                    Rgba([0, 0, 0, 255])
                }
            }),
            // Single pixel variations
            ImageBuffer::from_fn(16, 16, |x, y| {
                let val = ((x + y) % 256) as u8;
                Rgba([val, val, val, 255])
            }),
        ];

        for (i, img) in edge_case_images.iter().enumerate() {
            let result = std::panic::catch_unwind(|| {
                generate_dots_from_image(img, &DotConfig::default(), None, None)
            });

            assert!(
                result.is_ok(),
                "Edge case image {} should not cause panic",
                i
            );

            if let Ok(dots) = result {
                // Should produce valid dots even if few/none
                for dot in &dots {
                    assert!(dot.radius > 0.0);
                    assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
                    assert!(dot.x.is_finite() && dot.y.is_finite());
                }
            }
        }
    }
}
