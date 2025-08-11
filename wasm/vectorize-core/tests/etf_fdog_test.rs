//! Test ETF/FDoG edge detection integration

use image::{ImageBuffer, Rgba};
use vectorize_core::{vectorize_trace_low_rgba, TraceBackend, TraceLowConfig};

#[test]
fn test_etf_fdog_integration() {
    // Create a simple test image with clear edges
    let mut img = ImageBuffer::new(50, 50);

    // Draw a square with clear edges
    for y in 0..50 {
        for x in 0..50 {
            let color = if (10..40).contains(&x) && (10..40).contains(&y) {
                // Inner square - black
                Rgba([0, 0, 0, 255])
            } else {
                // Outer area - white
                Rgba([255, 255, 255, 255])
            };
            img.put_pixel(x, y, color);
        }
    }

    // Test traditional Canny edge detection
    let mut config_canny = TraceLowConfig::default();
    config_canny.detail = 0.5;
    config_canny.enable_etf_fdog = false;

    let result_canny = vectorize_trace_low_rgba(&img, &config_canny);
    assert!(result_canny.is_ok(), "Canny edge detection should work");
    let paths_canny = result_canny.unwrap();

    // Test ETF/FDoG edge detection
    let mut config_etf = TraceLowConfig::default();
    config_etf.detail = 0.5;
    config_etf.enable_etf_fdog = true;
    config_etf.backend = TraceBackend::Edge;

    let result_etf = vectorize_trace_low_rgba(&img, &config_etf);
    assert!(result_etf.is_ok(), "ETF/FDoG edge detection should work");
    let paths_etf = result_etf.unwrap();

    // Both should produce paths
    assert!(
        !paths_canny.is_empty(),
        "Canny should produce paths for clear edges"
    );
    assert!(
        !paths_etf.is_empty(),
        "ETF/FDoG should produce paths for clear edges"
    );

    println!(
        "Canny paths: {}, ETF/FDoG paths: {}",
        paths_canny.len(),
        paths_etf.len()
    );
}

#[test]
fn test_etf_fdog_performance() {
    use std::time::Instant;

    // Create a larger test image for performance testing
    let mut img = ImageBuffer::new(200, 200);

    // Create a more complex pattern
    for y in 0..200 {
        for x in 0..200 {
            let intensity =
                ((x as f32 / 200.0 * std::f32::consts::PI * 4.0).sin() * 127.0 + 128.0) as u8;
            img.put_pixel(x, y, Rgba([intensity, intensity, intensity, 255]));
        }
    }

    // Test ETF/FDoG performance
    let mut config = TraceLowConfig::default();
    config.detail = 0.4;
    config.enable_etf_fdog = true;
    config.backend = TraceBackend::Edge;

    let start = Instant::now();
    let result = vectorize_trace_low_rgba(&img, &config);
    let duration = start.elapsed();

    assert!(result.is_ok(), "ETF/FDoG processing should succeed");

    // Performance requirement: should complete within 2 seconds
    assert!(
        duration.as_secs_f64() < 2.0,
        "ETF/FDoG processing took {:.2}s, should be under 2s",
        duration.as_secs_f64()
    );

    println!("ETF/FDoG processing time: {:.2}ms", duration.as_millis());

    let paths = result.unwrap();
    assert!(
        !paths.is_empty(),
        "Should generate paths from complex pattern"
    );
}

#[test]
fn test_etf_parameter_variations() {
    // Create a test image
    let mut img = ImageBuffer::new(30, 30);
    for y in 0..30 {
        for x in 0..30 {
            let color = if x == 15 || y == 15 {
                Rgba([0, 0, 0, 255]) // Black cross
            } else {
                Rgba([255, 255, 255, 255]) // White background
            };
            img.put_pixel(x, y, color);
        }
    }

    // Test different ETF parameter configurations
    let test_configs = vec![
        (4, 4, 0.2, 1.2, 2.0, 0.90, 0.08, 0.16), // Default
        (2, 2, 0.1, 0.8, 1.5, 0.85, 0.05, 0.12), // Lower settings
        (6, 6, 0.3, 1.5, 2.5, 0.95, 0.10, 0.20), // Higher settings
    ];

    for (i, (etf_radius, etf_iters, etf_tau, fdog_s, fdog_c, fdog_tau, nms_low, nms_high)) in
        test_configs.iter().enumerate()
    {
        let mut config = TraceLowConfig::default();
        config.detail = 0.4;
        config.enable_etf_fdog = true;
        config.backend = TraceBackend::Edge;
        config.etf_radius = *etf_radius;
        config.etf_iterations = *etf_iters;
        config.etf_coherency_tau = *etf_tau;
        config.fdog_sigma_s = *fdog_s;
        config.fdog_sigma_c = *fdog_c;
        config.fdog_tau = *fdog_tau;
        config.nms_low = *nms_low;
        config.nms_high = *nms_high;

        let result = vectorize_trace_low_rgba(&img, &config);
        assert!(
            result.is_ok(),
            "ETF/FDoG config {} should work (radius={}, iters={}, tau={})",
            i + 1,
            etf_radius,
            etf_iters,
            etf_tau
        );

        let paths = result.unwrap();
        println!("Config {}: {} paths generated", i + 1, paths.len());
    }
}
