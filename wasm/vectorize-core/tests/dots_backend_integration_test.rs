use image::{Rgba, RgbaImage};
use vectorize_core::{vectorize_trace_low, TraceBackend, TraceLowConfig};

#[test]
fn test_dots_backend_end_to_end_integration() {
    // Create a simple test image with a clear pattern
    let mut img = RgbaImage::new(50, 50);

    // Create a white background with a black square in the center
    for y in 0..50 {
        for x in 0..50 {
            if (20..30).contains(&x) && (20..30).contains(&y) {
                // Black square in center
                img.put_pixel(x, y, Rgba([0, 0, 0, 255]));
            } else {
                // White background
                img.put_pixel(x, y, Rgba([255, 255, 255, 255]));
            }
        }
    }

    // Test with dots backend
    let config = TraceLowConfig {
        backend: TraceBackend::Dots,
        detail: 0.3,
        dot_density_threshold: 0.05, // Lower threshold to ensure dots
        dot_min_radius: 0.5,
        dot_max_radius: 3.0,
        dot_preserve_colors: true,
        dot_adaptive_sizing: true,
        dot_background_tolerance: 0.15,
        ..Default::default()
    };

    // Test the full pipeline
    let result = vectorize_trace_low(&img, &config, None);
    assert!(
        result.is_ok(),
        "Full pipeline should work with dots backend"
    );

    let svg_paths = result.unwrap();

    // Should generate some paths (though exact count depends on algorithm)
    println!("Generated {} SVG paths", svg_paths.len());

    // Validate path properties
    for path in &svg_paths {
        match &path.element_type {
            vectorize_core::algorithms::SvgElementType::Circle { cx, cy, r } => {
                // Validate radius is within bounds
                assert!(
                    *r >= config.dot_min_radius,
                    "Circle radius should be >= min_radius"
                );
                assert!(
                    *r <= config.dot_max_radius,
                    "Circle radius should be <= max_radius"
                );

                // Validate position is within image bounds
                assert!(
                    *cx >= 0.0 && *cx <= img.width() as f32,
                    "Circle x position should be within image"
                );
                assert!(
                    *cy >= 0.0 && *cy <= img.height() as f32,
                    "Circle y position should be within image"
                );
            }
            _ => {
                panic!(
                    "Expected only Circle elements from dots backend, got: {:?}",
                    path.element_type
                );
            }
        }

        // Validate color format
        assert!(
            path.fill.starts_with('#'),
            "Fill color should be in hex format"
        );
        assert_eq!(path.fill.len(), 7, "Fill color should be in #RRGGBB format");

        // Stroke should be "none" for dots
        assert_eq!(path.stroke, "none", "Dots should not have stroke");
        assert_eq!(path.stroke_width, 0.0, "Dots should not have stroke width");
    }
}

#[test]
fn test_dots_backend_svg_generation() {
    use vectorize_core::config::SvgConfig;
    use vectorize_core::svg::generate_svg_document;

    // Create a minimal test image
    let img = RgbaImage::new(20, 20);

    // Use dots backend with very permissive settings to ensure some output
    let config = TraceLowConfig {
        backend: TraceBackend::Dots,
        detail: 0.1,
        dot_density_threshold: 0.01, // Very low threshold
        dot_min_radius: 0.1,
        dot_max_radius: 5.0,
        dot_preserve_colors: false, // Use default color
        dot_adaptive_sizing: false,
        dot_background_tolerance: 0.5,
        ..Default::default()
    };

    // Generate SVG paths
    let result = vectorize_trace_low(&img, &config, None);
    assert!(result.is_ok());

    let svg_paths = result.unwrap();

    // Generate SVG document
    let svg_config = SvgConfig::default();
    let svg_content = generate_svg_document(&svg_paths, img.width(), img.height(), &svg_config);

    // Basic SVG validation
    assert!(
        svg_content.contains("<svg"),
        "SVG should contain root element"
    );
    assert!(
        svg_content.contains("xmlns=\"http://www.w3.org/2000/svg\""),
        "SVG should have proper namespace"
    );
    assert!(
        svg_content.contains("</svg>"),
        "SVG should be properly closed"
    );

    if !svg_paths.is_empty() {
        // If we have paths, the SVG should contain circles
        assert!(
            svg_content.contains("<circle"),
            "SVG should contain circle elements for dots"
        );
    }

    println!(
        "Generated SVG document ({} bytes):\n{}",
        svg_content.len(),
        svg_content
    );
}

#[test]
fn test_dots_backend_error_resilience() {
    // Test with edge cases that might cause issues

    // Empty image
    let empty_img = RgbaImage::new(0, 0);
    let config = TraceLowConfig {
        backend: TraceBackend::Dots,
        ..Default::default()
    };

    let result = vectorize_trace_low(&empty_img, &config, None);
    assert!(result.is_ok(), "Should handle empty images gracefully");
    assert!(
        result.unwrap().is_empty(),
        "Empty image should produce no paths"
    );

    // Single pixel image
    let single_pixel = RgbaImage::from_pixel(1, 1, Rgba([128, 128, 128, 255]));
    let result = vectorize_trace_low(&single_pixel, &config, None);
    assert!(
        result.is_ok(),
        "Should handle single pixel images gracefully"
    );

    // Very high density threshold (should produce few/no dots)
    let img = RgbaImage::new(10, 10);
    let config_high_threshold = TraceLowConfig {
        backend: TraceBackend::Dots,
        dot_density_threshold: 0.99,
        ..Default::default()
    };

    let result = vectorize_trace_low(&img, &config_high_threshold, None);
    assert!(result.is_ok(), "Should handle high thresholds gracefully");
}
