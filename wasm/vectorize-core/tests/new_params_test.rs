//! Tests for the new max_image_size and svg_precision parameters

use image::{ImageBuffer, Rgba};
use vectorize_core::{
    config_builder::ConfigBuilder, vectorize_trace_low_rgba, TraceBackend, TraceLowConfig,
};

#[test]
fn test_max_image_size_parameter() {
    // Test that max_image_size parameter can be set and retrieved
    let builder_result = ConfigBuilder::new().max_image_size(2048);
    assert!(
        builder_result.is_ok(),
        "Should be able to set max_image_size to 2048"
    );

    let config = builder_result.unwrap().build().unwrap();
    assert_eq!(config.max_image_size, 2048);

    // Test validation - too small
    let builder_result = ConfigBuilder::new().max_image_size(256);
    assert!(
        builder_result.is_err(),
        "Should reject max_image_size < 512"
    );

    // Test validation - too large
    let builder_result = ConfigBuilder::new().max_image_size(16384);
    assert!(
        builder_result.is_err(),
        "Should reject max_image_size > 8192"
    );

    // Test validation - valid range
    assert!(ConfigBuilder::new().max_image_size(512).is_ok());
    assert!(ConfigBuilder::new().max_image_size(4096).is_ok());
    assert!(ConfigBuilder::new().max_image_size(8192).is_ok());
}

#[test]
fn test_svg_precision_parameter() {
    // Test that svg_precision parameter can be set and retrieved
    let builder_result = ConfigBuilder::new().svg_precision(3);
    assert!(
        builder_result.is_ok(),
        "Should be able to set svg_precision to 3"
    );

    let config = builder_result.unwrap().build().unwrap();
    assert_eq!(config.svg_precision, 3);

    // Test validation - too large
    let builder_result = ConfigBuilder::new().svg_precision(5);
    assert!(builder_result.is_err(), "Should reject svg_precision > 4");

    // Test validation - valid range
    assert!(ConfigBuilder::new().svg_precision(0).is_ok());
    assert!(ConfigBuilder::new().svg_precision(1).is_ok());
    assert!(ConfigBuilder::new().svg_precision(2).is_ok());
    assert!(ConfigBuilder::new().svg_precision(3).is_ok());
    assert!(ConfigBuilder::new().svg_precision(4).is_ok());
}

#[test]
fn test_image_resizing_functionality() {
    // Create a large test image (would exceed default 4096px limit)
    let large_img = ImageBuffer::from_fn(6000, 4000, |x, y| {
        if (x / 100 + y / 100) % 2 == 0 {
            Rgba([255, 255, 255, 255]) // White
        } else {
            Rgba([0, 0, 0, 255]) // Black
        }
    });

    // Test with smaller max_image_size to force resizing
    let config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        max_image_size: 1000, // Force resize
        svg_precision: 1,
        ..Default::default()
    };

    let result = vectorize_trace_low_rgba(&large_img, &config, None);
    assert!(
        result.is_ok(),
        "Should handle large image resizing without error"
    );

    let svg = result.unwrap();
    assert!(
        !svg.is_empty(),
        "Should produce SVG output even after resizing"
    );
    assert!(svg.contains("<svg"), "Output should be valid SVG");
}

#[test]
fn test_svg_precision_in_output() {
    // Create a simple test image
    let img = ImageBuffer::from_fn(50, 50, |x, y| {
        if (x / 10 + y / 10) % 2 == 0 {
            Rgba([255, 255, 255, 255]) // White
        } else {
            Rgba([0, 0, 0, 255]) // Black
        }
    });

    // Test with precision 0 (integers only)
    let config_int = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.5,
        svg_precision: 0,
        ..Default::default()
    };

    let result_int = vectorize_trace_low_rgba(&img, &config_int, None);
    assert!(result_int.is_ok(), "Should work with precision 0");

    // Test with precision 3 (3 decimal places)
    let config_precise = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.5,
        svg_precision: 3,
        ..Default::default()
    };

    let result_precise = vectorize_trace_low_rgba(&img, &config_precise, None);
    assert!(result_precise.is_ok(), "Should work with precision 3");

    // Both should produce valid SVG
    let svg_int = result_int.unwrap();
    let svg_precise = result_precise.unwrap();

    assert!(
        svg_int.contains("<svg"),
        "Integer precision SVG should be valid"
    );
    assert!(
        svg_precise.contains("<svg"),
        "High precision SVG should be valid"
    );
}

#[test]
fn test_default_values() {
    let config = TraceLowConfig::default();
    assert_eq!(
        config.max_image_size, 4096,
        "Default max_image_size should be 4096"
    );
    assert_eq!(config.svg_precision, 2, "Default svg_precision should be 2");
}

#[test]
fn test_builder_chainability() {
    // Test that the new methods can be chained with existing ones
    let config_result = ConfigBuilder::new()
        .backend_by_name("edge")
        .unwrap()
        .detail(0.5)
        .unwrap()
        .stroke_width(1.5)
        .unwrap()
        .max_image_size(2048)
        .unwrap()
        .svg_precision(3)
        .unwrap()
        .multipass(true)
        .build();

    assert!(config_result.is_ok(), "Builder chaining should work");

    let config = config_result.unwrap();
    assert_eq!(config.backend, TraceBackend::Edge);
    assert_eq!(config.detail, 0.5);
    assert_eq!(config.stroke_px_at_1080p, 1.5);
    assert_eq!(config.max_image_size, 2048);
    assert_eq!(config.svg_precision, 3);
    assert!(config.enable_multipass);
}
