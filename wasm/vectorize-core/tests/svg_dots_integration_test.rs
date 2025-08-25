//! Integration tests for SVG dot renderer
//!
//! These tests verify the SVG dot renderer with real dots and various configurations
//! to ensure production-ready quality and performance.

use vectorize_core::algorithms::dots::dots::Dot;
use vectorize_core::algorithms::dots::svg_dots::{
    dots_to_svg_with_config, optimize_dot_svg, SvgDotConfig,
};

/// Create example dots for testing
fn create_example_dots() -> Vec<Dot> {
    vec![
        Dot::new(10.0, 10.0, 2.0, 1.0, "#ff0000".to_string()),
        Dot::new(30.0, 10.0, 1.5, 0.8, "#ff0000".to_string()), // Similar red
        Dot::new(50.0, 10.0, 3.0, 0.6, "#00ff00".to_string()),
        Dot::new(70.0, 10.0, 2.5, 0.9, "#0000ff".to_string()),
        Dot::new(90.0, 10.0, 1.0, 0.4, "#ffff00".to_string()),
    ]
}

/// Create large dataset for performance testing
fn create_large_dots_dataset(count: usize) -> Vec<Dot> {
    (0..count)
        .map(|i| {
            let x = (i % 100) as f32 * 5.0;
            let y = (i / 100) as f32 * 5.0;
            let radius = 1.0 + (i % 3) as f32 * 0.5;
            let opacity = 0.3 + (i % 7) as f32 * 0.1;
            let color = match i % 6 {
                0 => "#ff0000",
                1 => "#00ff00",
                2 => "#0000ff",
                3 => "#ffff00",
                4 => "#ff00ff",
                _ => "#00ffff",
            };
            Dot::new(x, y, radius, opacity, color.to_string())
        })
        .collect()
}

#[test]
fn test_basic_svg_generation() {
    let dots = create_example_dots();
    let svg = optimize_dot_svg(&dots);

    // Basic structure validation
    assert!(svg.contains("<svg"));
    assert!(svg.contains("</svg>"));
    assert!(svg.contains("xmlns=\"http://www.w3.org/2000/svg\""));

    // Should contain circle elements
    assert!(svg.contains("<circle"));
    assert!(svg.contains("cx="));
    assert!(svg.contains("cy="));
    assert!(svg.contains("r="));

    // Should contain our test colors
    assert!(svg.contains("#ff0000"));
    assert!(svg.contains("#00ff00"));
    assert!(svg.contains("#0000ff"));

    println!("Basic SVG ({}chars):\n{}", svg.len(), svg);
}

#[test]
fn test_compact_vs_normal_output() {
    let dots = create_example_dots();

    let config_compact = SvgDotConfig {
        compact_output: true,
        ..Default::default()
    };

    let config_normal = SvgDotConfig {
        compact_output: false,
        ..Default::default()
    };

    let svg_compact = dots_to_svg_with_config(&dots, &config_compact);
    let svg_normal = dots_to_svg_with_config(&dots, &config_normal);

    // Compact should be smaller
    assert!(svg_compact.len() < svg_normal.len());

    // Both should be valid SVG
    assert!(svg_compact.contains("<svg") && svg_compact.contains("</svg>"));
    assert!(svg_normal.contains("<svg") && svg_normal.contains("</svg>"));

    // Both should have the same number of circles
    let compact_circles = svg_compact.matches("<circle").count();
    let normal_circles = svg_normal.matches("<circle").count();
    assert_eq!(compact_circles, normal_circles);

    println!("Compact: {} chars", svg_compact.len());
    println!("Normal: {} chars", svg_normal.len());
}

#[test]
fn test_color_grouping_effectiveness() {
    let dots = create_example_dots();

    let config_grouped = SvgDotConfig {
        group_similar_colors: true,
        ..Default::default()
    };

    let config_individual = SvgDotConfig {
        group_similar_colors: false,
        ..Default::default()
    };

    let svg_grouped = dots_to_svg_with_config(&dots, &config_grouped);
    let svg_individual = dots_to_svg_with_config(&dots, &config_individual);

    // Grouped should use <g> elements
    assert!(svg_grouped.contains("<g fill="));
    assert!(svg_grouped.contains("</g>"));

    // Individual should not use groups
    assert!(!svg_individual.contains("<g"));
    assert!(!svg_individual.contains("</g>"));

    // Grouped should typically be smaller (fewer color attributes)
    // Note: This might not always be true for small datasets
    println!("Grouped: {} chars", svg_grouped.len());
    println!("Individual: {} chars", svg_individual.len());
}

#[test]
fn test_opacity_handling() {
    let dots = vec![
        Dot::new(10.0, 10.0, 2.0, 1.0, "#ff0000".to_string()), // Full opacity
        Dot::new(30.0, 10.0, 2.0, 0.5, "#00ff00".to_string()), // Half opacity
        Dot::new(50.0, 10.0, 2.0, 0.05, "#0000ff".to_string()), // Very low opacity
    ];

    let config_opacity = SvgDotConfig {
        use_opacity: true,
        min_opacity_threshold: 0.1,
        ..Default::default()
    };

    let svg = dots_to_svg_with_config(&dots, &config_opacity);

    // Should contain opacity attribute for non-full opacity
    assert!(svg.contains("opacity=\"0.50\"") || svg.contains("opacity=\"0.5\""));

    // Should not contain very low opacity dot (below threshold)
    assert!(!svg.contains("#0000ff"));

    // Should contain full opacity dot (but no opacity attribute needed)
    assert!(svg.contains("#ff0000"));
}

#[test]
fn test_precision_control() {
    let dots = vec![Dot::new(
        10.123456,
        20.987654,
        2.345678,
        0.876543,
        "#ff0000".to_string(),
    )];

    let config_low = SvgDotConfig {
        precision: 1,
        ..Default::default()
    };

    let config_high = SvgDotConfig {
        precision: 4,
        ..Default::default()
    };

    let svg_low = dots_to_svg_with_config(&dots, &config_low);
    let svg_high = dots_to_svg_with_config(&dots, &config_high);

    // Low precision should round values
    assert!(svg_low.contains("cx=\"10.1\""));
    assert!(svg_low.contains("cy=\"21.0\"") || svg_low.contains("cy=\"21\""));
    assert!(svg_low.contains("r=\"2.3\""));

    // High precision should preserve more decimals
    assert!(svg_high.contains("cx=\"10.1235\""));
    assert!(svg_high.contains("cy=\"20.9877\""));
    assert!(svg_high.contains("r=\"2.3457\""));

    println!("Low precision: {svg_low}");
    println!("High precision: {svg_high}");
}

#[test]
fn test_empty_and_edge_cases() {
    // Empty dots
    let empty_dots: Vec<Dot> = Vec::new();
    let svg_empty = optimize_dot_svg(&empty_dots);
    assert!(svg_empty.is_empty());

    // Single dot
    let single_dot = vec![Dot::new(50.0, 50.0, 5.0, 1.0, "#ffffff".to_string())];
    let svg_single = optimize_dot_svg(&single_dot);
    assert!(svg_single.contains("<circle"));
    assert!(svg_single.contains("cx=\"50"));
    assert!(svg_single.contains("cy=\"50"));

    // Zero radius dots should be filtered out
    let zero_radius_dots = vec![
        Dot::new(10.0, 10.0, 0.0, 1.0, "#ff0000".to_string()),
        Dot::new(20.0, 20.0, 2.0, 1.0, "#00ff00".to_string()),
    ];
    let svg_filtered = optimize_dot_svg(&zero_radius_dots);
    assert!(svg_filtered.contains("#00ff00"));
    assert!(!svg_filtered.contains("#ff0000")); // Should be filtered out

    println!("Single dot SVG: {svg_single}");
}

#[test]
fn test_performance_large_dataset() {
    use std::time::Instant;

    let dots = create_large_dots_dataset(1000);

    let start = Instant::now();
    let svg = optimize_dot_svg(&dots);
    let duration = start.elapsed();

    println!("Generated SVG for {} dots in {:?}", dots.len(), duration);
    println!("SVG size: {} characters", svg.len());

    // Should complete in reasonable time
    assert!(
        duration.as_millis() < 1000,
        "Should generate SVG in under 1 second"
    );

    // Should contain all dots (minus any filtered out)
    let circle_count = svg.matches("<circle").count();
    assert!(
        circle_count > 500,
        "Should contain substantial number of circles"
    );
    assert!(circle_count <= 1000, "Should not exceed input count");

    // Should use grouping for efficiency
    assert!(svg.contains("<g fill="));
}

#[test]
fn test_bounding_box_calculation() {
    let dots = vec![
        Dot::new(0.0, 0.0, 1.0, 1.0, "#ff0000".to_string()), // Top-left
        Dot::new(100.0, 200.0, 2.0, 1.0, "#00ff00".to_string()), // Bottom-right
        Dot::new(50.0, 100.0, 3.0, 1.0, "#0000ff".to_string()), // Center
    ];

    let svg = optimize_dot_svg(&dots);

    println!("Bounding box SVG: {svg}");

    // Should have proper viewBox including dot radii
    // The exact format may vary, but should include negative bounds and proper sizing
    assert!(svg.contains("viewBox=\"-1.00 -1.00"));

    // Check that width and height are reasonable (accounting for radii)
    assert!(svg.contains("width=") && svg.contains("height="));
}

#[test]
fn test_special_coordinates() {
    let dots = vec![
        Dot::new(0.0, 0.0, 0.1, 1.0, "#ff0000".to_string()), // Origin
        Dot::new(-10.0, -20.0, 1.0, 1.0, "#00ff00".to_string()), // Negative coords
        Dot::new(1000.5, 2000.7, 0.01, 0.5, "#0000ff".to_string()), // Large coords
    ];

    let svg = optimize_dot_svg(&dots);

    // Should handle negative coordinates
    assert!(svg.contains("cx=\"-10.00\""));
    assert!(svg.contains("cy=\"-20.00\""));

    // Should handle large coordinates
    assert!(svg.contains("cx=\"1000.50\""));
    assert!(svg.contains("cy=\"2000.70\""));

    // Should handle tiny radius
    assert!(svg.contains("r=\"0.01\""));

    println!("Special coordinates SVG: {svg}");
}

#[test]
fn test_svg_validity() {
    let dots = create_example_dots();
    let svg = optimize_dot_svg(&dots);

    // Basic XML/SVG structure validation
    assert!(svg.starts_with("<svg"));
    assert!(svg.ends_with("</svg>"));

    // Should have balanced tags
    let svg_open_count = svg.matches("<svg").count();
    let svg_close_count = svg.matches("</svg>").count();
    assert_eq!(svg_open_count, svg_close_count);

    // All circles should be self-closing
    let circle_count = svg.matches("<circle").count();
    let circle_close_count = svg.matches("/>").count();
    assert!(
        circle_close_count >= circle_count,
        "All circles should be self-closing"
    );

    // Should contain required attributes
    assert!(svg.contains("width="));
    assert!(svg.contains("height="));
    assert!(svg.contains("viewBox="));
    assert!(svg.contains("xmlns="));

    // No unclosed quotes
    let quote_count = svg.matches('"').count();
    assert_eq!(quote_count % 2, 0, "All quotes should be balanced");
}
