//! Integration test to demonstrate the complete performance optimization pipeline
//!
//! This test validates that all optimization components work together and achieve
//! the target performance requirements.

use image::{Rgba, RgbaImage};
use std::time::{Duration, Instant};

use vectorize_core::algorithms::dots::dots_optimized::{
    generate_dots_optimized_pipeline, OptimizedDotConfig, OptimizedDotGenerator,
};
use vectorize_core::algorithms::{
    dots::background::{detect_background_advanced, BackgroundConfig},
    dots::dots::{generate_dots_from_image, DotConfig},
    edges::gradients::analyze_image_gradients,
};
use vectorize_core::performance::PerformanceConfig;

/// Create a representative test image for performance testing
fn create_performance_test_image(width: u32, height: u32) -> RgbaImage {
    let mut img = RgbaImage::new(width, height);

    // Create a complex pattern with gradients, shapes, and textures
    for y in 0..height {
        for x in 0..width {
            let r = ((x * 256 / width) + (y * 128 / height)) % 256;
            let g = ((y * 256 / height) + (x * 64 / width)) % 256;
            let b = ((x + y) * 256 / (width + height)) % 256;

            // Add some noise
            let noise_factor = ((x * 17 + y * 23) % 32) as i32 - 16;
            let r = ((r as i32) + noise_factor).clamp(0, 255) as u8;
            let g = ((g as i32) + noise_factor).clamp(0, 255) as u8;
            let b = ((b as i32) + noise_factor).clamp(0, 255) as u8;

            let color = Rgba([r, g, b, 255]);
            img.put_pixel(x, y, color);
        }
    }

    // Add geometric shapes
    add_circle(&mut img, width / 4, height / 4, 30, Rgba([255, 0, 0, 255]));
    add_circle(
        &mut img,
        3 * width / 4,
        height / 4,
        25,
        Rgba([0, 255, 0, 255]),
    );
    add_rectangle(
        &mut img,
        width / 3,
        height / 2,
        width / 3,
        height / 4,
        Rgba([0, 0, 255, 255]),
    );

    img
}

fn add_circle(img: &mut RgbaImage, cx: u32, cy: u32, radius: u32, color: Rgba<u8>) {
    let width = img.width();
    let height = img.height();
    let radius_sq = (radius * radius) as f32;

    let start_x = cx.saturating_sub(radius);
    let end_x = (cx + radius).min(width);
    let start_y = cy.saturating_sub(radius);
    let end_y = (cy + radius).min(height);

    for y in start_y..end_y {
        for x in start_x..end_x {
            let dx = (x as f32) - (cx as f32);
            let dy = (y as f32) - (cy as f32);
            if dx * dx + dy * dy <= radius_sq {
                img.put_pixel(x, y, color);
            }
        }
    }
}

fn add_rectangle(img: &mut RgbaImage, x: u32, y: u32, width: u32, height: u32, color: Rgba<u8>) {
    let img_width = img.width();
    let img_height = img.height();

    for py in y..(y + height).min(img_height) {
        for px in x..(x + width).min(img_width) {
            img.put_pixel(px, py, color);
        }
    }
}

#[test]
fn test_performance_optimization_integration() {
    println!("Starting performance optimization integration test...");

    // Create test image (500x500 as per target specifications)
    let img = create_performance_test_image(500, 500);
    println!("Created 500x500 test image");

    // Test standard implementation
    let start = Instant::now();
    let standard_config = DotConfig::default();
    let standard_dots = generate_dots_from_image(&img, &standard_config, None, None);
    let standard_time = start.elapsed();

    println!("Standard implementation:");
    println!("  Time: {:?}ms", standard_time.as_millis());
    println!("  Dots generated: {}", standard_dots.len());

    // Test optimized implementation
    let start = Instant::now();
    let optimized_config = OptimizedDotConfig {
        performance_config: PerformanceConfig {
            use_memory_pooling: true,
            use_simd: true,
            use_spatial_indexing: true,
            parallel_threshold: 10000,
            ..Default::default()
        },
        enable_profiling: true,
        ..Default::default()
    };
    let optimized_dots = generate_dots_optimized_pipeline(&img, &optimized_config);
    let optimized_time = start.elapsed();

    println!("Optimized implementation:");
    println!("  Time: {:?}ms", optimized_time.as_millis());
    println!("  Dots generated: {}", optimized_dots.len());

    // Validate performance target: <1.5s for 500x500 images
    let target_time = Duration::from_millis(1500);
    assert!(
        optimized_time <= target_time,
        "Optimized implementation took {optimized_time:?}, expected <= {target_time:?}"
    );

    // Validate that optimizations don't significantly change output quality
    let dot_count_diff = (standard_dots.len() as i32 - optimized_dots.len() as i32).abs();
    let max_allowed_diff = (standard_dots.len() / 10).max(10); // Allow 10% difference

    assert!(
        dot_count_diff <= max_allowed_diff as i32,
        "Dot count difference too large: {} vs {} (diff: {})",
        standard_dots.len(),
        optimized_dots.len(),
        dot_count_diff
    );

    // Calculate performance improvement
    let improvement_ratio =
        standard_time.as_millis() as f64 / optimized_time.as_millis().max(1) as f64;
    println!("Performance improvement: {improvement_ratio:.2}x");

    // Test with profiling enabled
    let mut generator = OptimizedDotGenerator::new(OptimizedDotConfig {
        enable_profiling: true,
        ..optimized_config
    });

    // Generate gradient analysis and background mask for direct generator test
    let gray = image::imageops::grayscale(&img);
    let gradient_analysis = analyze_image_gradients(&gray);
    let background_config = BackgroundConfig::default();
    let background_mask = detect_background_advanced(&img, &background_config);

    let start = Instant::now();
    let profiled_dots =
        generator.generate_dots_optimized(&img, &gradient_analysis, &background_mask);
    let profiled_time = start.elapsed();

    println!("Profiled implementation:");
    println!("  Time: {:?}ms", profiled_time.as_millis());
    println!("  Dots generated: {}", profiled_dots.len());

    // Get performance report
    if let Some(report) = generator.get_performance_report() {
        println!("Performance Report:");
        println!("  Total operations: {}", report.total_operations);
        println!("  Total time: {:?}ms", report.total_time.as_millis());
        println!("  Operations/second: {:.1}", report.operations_per_second);
        println!(
            "  Memory usage: {:.2}MB",
            report.total_memory as f64 / 1_048_576.0
        );

        // Validate memory efficiency
        let memory_per_dot = if profiled_dots.is_empty() {
            0
        } else {
            report.total_memory / profiled_dots.len()
        };

        assert!(
            memory_per_dot <= 256, // 256 bytes per dot max
            "Memory usage per dot too high: {memory_per_dot} bytes"
        );
    }

    println!("✓ All performance optimization integration tests passed!");
}

#[test]
fn test_scalability_performance() {
    println!("Testing performance scalability across image sizes...");

    let sizes = [(100, 100), (250, 250), (500, 500)];
    let mut results = Vec::new();

    for &(width, height) in &sizes {
        let img = create_performance_test_image(width, height);
        let pixels = width * height;

        let optimized_config = OptimizedDotConfig {
            performance_config: PerformanceConfig {
                use_memory_pooling: true,
                use_simd: true,
                use_spatial_indexing: true,
                ..Default::default()
            },
            ..Default::default()
        };

        let start = Instant::now();
        let dots = generate_dots_optimized_pipeline(&img, &optimized_config);
        let duration = start.elapsed();

        let pixels_per_ms = pixels as f64 / duration.as_millis().max(1) as f64;

        println!(
            "{}x{}: {:?}ms, {} dots, {:.0} pixels/ms",
            width,
            height,
            duration.as_millis(),
            dots.len(),
            pixels_per_ms
        );

        results.push((pixels, duration.as_millis(), pixels_per_ms));
    }

    // Verify reasonable scaling
    assert!(results[0].2 > 0.0, "Should process pixels efficiently");
    assert!(
        results.last().unwrap().1 < 2000,
        "Largest image should complete in <2s"
    );

    println!("✓ Scalability test passed!");
}

#[test]
fn test_optimization_components() {
    println!("Testing individual optimization components...");

    let img = create_performance_test_image(200, 200);

    // Test each optimization component individually
    let configurations = vec![
        (
            "baseline",
            OptimizedDotConfig {
                performance_config: PerformanceConfig {
                    use_memory_pooling: false,
                    use_simd: false,
                    use_spatial_indexing: false,
                    ..Default::default()
                },
                ..Default::default()
            },
        ),
        (
            "memory_pooling",
            OptimizedDotConfig {
                performance_config: PerformanceConfig {
                    use_memory_pooling: true,
                    use_simd: false,
                    use_spatial_indexing: false,
                    ..Default::default()
                },
                ..Default::default()
            },
        ),
        (
            "spatial_indexing",
            OptimizedDotConfig {
                performance_config: PerformanceConfig {
                    use_memory_pooling: false,
                    use_simd: false,
                    use_spatial_indexing: true,
                    ..Default::default()
                },
                ..Default::default()
            },
        ),
        (
            "simd",
            OptimizedDotConfig {
                performance_config: PerformanceConfig {
                    use_memory_pooling: false,
                    use_simd: true,
                    use_spatial_indexing: false,
                    ..Default::default()
                },
                ..Default::default()
            },
        ),
        (
            "all_optimizations",
            OptimizedDotConfig {
                performance_config: PerformanceConfig {
                    use_memory_pooling: true,
                    use_simd: true,
                    use_spatial_indexing: true,
                    ..Default::default()
                },
                ..Default::default()
            },
        ),
    ];

    for (name, config) in configurations {
        let start = Instant::now();
        let dots = generate_dots_optimized_pipeline(&img, &config);
        let duration = start.elapsed();

        println!(
            "{}: {:?}ms, {} dots",
            name,
            duration.as_millis(),
            dots.len()
        );

        // Each configuration should complete in reasonable time
        assert!(
            duration.as_millis() < 1000,
            "{} took too long: {:?}ms",
            name,
            duration.as_millis()
        );

        // Should generate reasonable number of dots
        assert!(!dots.is_empty(), "{name} generated no dots");
    }

    println!("✓ Component optimization test passed!");
}

#[test]
fn test_performance_consistency() {
    println!("Testing performance consistency across multiple runs...");

    let img = create_performance_test_image(300, 300);
    let config = OptimizedDotConfig::default();

    let mut durations = Vec::new();
    let mut dot_counts = Vec::new();

    // Run multiple times to check for consistency
    for i in 0..5 {
        let start = Instant::now();
        let dots = generate_dots_optimized_pipeline(&img, &config);
        let duration = start.elapsed();

        durations.push(duration.as_millis());
        dot_counts.push(dots.len());

        println!(
            "Run {}: {:?}ms, {} dots",
            i + 1,
            duration.as_millis(),
            dots.len()
        );
    }

    // Calculate consistency metrics
    let avg_duration = durations.iter().sum::<u128>() / durations.len() as u128;
    let max_duration = *durations.iter().max().unwrap();
    let min_duration = *durations.iter().min().unwrap();
    let duration_variance = max_duration - min_duration;

    let avg_dots = dot_counts.iter().sum::<usize>() / dot_counts.len();
    let max_dots = *dot_counts.iter().max().unwrap();
    let min_dots = *dot_counts.iter().min().unwrap();
    let dot_variance = max_dots - min_dots;

    println!("Performance consistency:");
    println!(
        "  Duration: avg={}ms, variance={}ms ({:.1}%)",
        avg_duration,
        duration_variance,
        (duration_variance as f64 / avg_duration as f64) * 100.0
    );
    println!(
        "  Dot count: avg={}, variance={} ({:.1}%)",
        avg_dots,
        dot_variance,
        (dot_variance as f64 / avg_dots as f64) * 100.0
    );

    // Performance should be reasonably consistent
    let duration_variance_pct = (duration_variance as f64 / avg_duration as f64) * 100.0;
    assert!(
        duration_variance_pct < 20.0,
        "Performance too inconsistent: {duration_variance_pct:.1}% variance in duration"
    );

    // Dot count should be very consistent (deterministic algorithm)
    assert!(
        dot_variance <= 2,
        "Dot count too inconsistent: {dot_variance} variance"
    );

    println!("✓ Performance consistency test passed!");
}
