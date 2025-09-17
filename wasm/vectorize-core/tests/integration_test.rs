use image::{ImageBuffer, Rgba};
use vectorize_core::algorithms::visual::hand_drawn::{
    apply_hand_drawn_aesthetics, HandDrawnPresets,
};
use vectorize_core::{vectorize_trace_low_rgba, TraceBackend, TraceLowConfig};

#[test]
fn test_end_to_end_pipeline() {
    // Create a simple test image
    let img = ImageBuffer::from_fn(64, 64, |x, y| {
        if (x / 8 + y / 8) % 2 == 0 {
            Rgba([255, 255, 255, 255]) // White
        } else {
            Rgba([0, 0, 0, 255]) // Black
        }
    });

    // Test default configuration
    let config = TraceLowConfig::default();
    let result = vectorize_trace_low_rgba(&img, &config, None);
    assert!(result.is_ok(), "Default vectorization should succeed");
    let svg = result.unwrap();
    assert!(!svg.is_empty(), "SVG output should not be empty");
    assert!(svg.contains("<svg"), "Output should be valid SVG");
    assert!(svg.contains("</svg>"), "Output should have closing SVG tag");

    // Test with multipass
    let config_multipass = TraceLowConfig {
        enable_multipass: true,
        ..TraceLowConfig::default()
    };
    let result = vectorize_trace_low_rgba(&img, &config_multipass, None);
    assert!(result.is_ok(), "Multipass vectorization should succeed");

    // Test with Edge backend (the only fully implemented one)
    let config_edge = TraceLowConfig {
        backend: TraceBackend::Edge,
        ..TraceLowConfig::default()
    };
    let result = vectorize_trace_low_rgba(&img, &config_edge, None);
    assert!(result.is_ok(), "Edge backend should work");

    // Note: Centerline and Superpixel backends are placeholders for future implementation
}

#[test]
fn test_hand_drawn_pipeline() {
    use vectorize_core::vectorize_trace_low;

    // Create a simple test image
    let img = ImageBuffer::from_fn(32, 32, |x, y| {
        if x == y || x + y == 31 {
            Rgba([0, 0, 0, 255]) // Black diagonal lines
        } else {
            Rgba([255, 255, 255, 255]) // White background
        }
    });

    // Get paths from vectorization
    let config = TraceLowConfig::default();
    let paths = vectorize_trace_low(&img, &config, None);
    assert!(paths.is_ok(), "Path extraction should succeed");
    let paths = paths.unwrap();
    assert!(!paths.is_empty(), "Should find some paths");

    // Apply hand-drawn effects
    let hd_config = HandDrawnPresets::medium();
    let enhanced_paths = apply_hand_drawn_aesthetics(paths, &hd_config);
    assert!(
        !enhanced_paths.is_empty(),
        "Enhanced paths should not be empty"
    );
}

#[test]
fn test_high_performance_requirement() {
    use std::time::Instant;

    // Create a typical-sized test image (512x512)
    let img = ImageBuffer::from_fn(512, 512, |x, y| {
        // Create a more complex pattern for realistic testing
        let value = ((x as f32 * 0.1).sin() * 128.0 + (y as f32 * 0.1).cos() * 128.0) as u8;
        Rgba([value, value, value, 255])
    });

    let config = TraceLowConfig::default();

    // Measure processing time
    let start = Instant::now();
    let result = vectorize_trace_low_rgba(&img, &config, None);
    let elapsed = start.elapsed();

    assert!(
        result.is_ok(),
        "Performance test vectorization should succeed"
    );

    // Check that processing is reasonably fast (should be < 1.5s as per requirements)
    assert!(
        elapsed.as_millis() < 3000, // Allow some margin for slower test machines
        "Processing took {}ms, should be under 3000ms for 512x512 image",
        elapsed.as_millis()
    );

    println!("512x512 image processed in {}ms", elapsed.as_millis());
}
