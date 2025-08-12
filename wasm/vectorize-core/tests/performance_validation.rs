//! Performance validation and regression tests for dot mapping optimization
//!
//! This test suite validates that performance optimizations meet the target
//! requirements and don't regress over time.

use image::{Rgba, RgbaImage};
use std::time::{Duration, Instant};
use vectorize_core::algorithms::{
    dots::{generate_dots_from_image, DotConfig},
    dots_optimized::{generate_dots_optimized_pipeline, OptimizedDotConfig},
    gradients::analyze_image_gradients,
};
use vectorize_core::performance::{
    memory_pool::DotPool,
    parallel_utils::{ParallelConfig, PixelProcessor},
    simd_ops::{get_available_simd_features, simd_color_distance, simd_gradient_magnitude},
    spatial_index::SpatialGrid,
    PerformanceConfig, PerformanceUtils,
};

/// Performance test configuration
#[derive(Debug, Clone)]
struct PerformanceTestConfig {
    /// Target processing time for 500x500 images
    target_500x500_ms: u64,
    /// Target processing time for 1000x1000 images  
    target_1000x1000_ms: u64,
    /// Maximum acceptable memory usage per dot
    max_memory_per_dot_bytes: usize,
    /// Minimum expected dots per second throughput
    min_dots_per_second: f64,
    /// Performance regression tolerance (percentage)
    regression_tolerance: f64,
}

impl Default for PerformanceTestConfig {
    fn default() -> Self {
        Self {
            target_500x500_ms: 1500,       // <1.5s for 500x500 as specified
            target_1000x1000_ms: 6000,     // <6s for 1000x1000 (scaled)
            max_memory_per_dot_bytes: 128, // 128 bytes per dot maximum
            min_dots_per_second: 1000.0,   // Minimum throughput
            regression_tolerance: 10.0,    // 10% regression tolerance
        }
    }
}

/// Create test images with varying complexity
fn create_test_image(width: u32, height: u32, complexity: ImageComplexity) -> RgbaImage {
    let mut img = RgbaImage::new(width, height);

    match complexity {
        ImageComplexity::Simple => {
            // Simple gradient with basic shapes
            for y in 0..height {
                for x in 0..width {
                    let intensity = ((x + y) * 255 / (width + height)).min(255) as u8;
                    let color = Rgba([intensity, intensity, intensity, 255]);
                    img.put_pixel(x, y, color);
                }
            }

            // Add a rectangle
            for y in height / 4..3 * height / 4 {
                for x in width / 4..3 * width / 4 {
                    let color = Rgba([255, 100, 100, 255]);
                    img.put_pixel(x, y, color);
                }
            }
        }

        ImageComplexity::Medium => {
            // More complex patterns with multiple gradients
            for y in 0..height {
                for x in 0..width {
                    let r = ((x * 255 / width) + (y * 128 / height)) % 255;
                    let g = ((y * 255 / height) + (x * 64 / width)) % 255;
                    let b = ((x + y) * 255 / (width + height)) % 255;
                    let color = Rgba([r as u8, g as u8, b as u8, 255]);
                    img.put_pixel(x, y, color);
                }
            }

            // Add circles
            add_circle(&mut img, width / 4, height / 4, 30, Rgba([255, 0, 0, 255]));
            add_circle(
                &mut img,
                3 * width / 4,
                height / 4,
                25,
                Rgba([0, 255, 0, 255]),
            );
            add_circle(
                &mut img,
                width / 2,
                3 * height / 4,
                40,
                Rgba([0, 0, 255, 255]),
            );
        }

        ImageComplexity::Complex => {
            // Highly detailed image with noise
            use rand::{Rng, SeedableRng};
            use rand_chacha::ChaCha8Rng;
            let mut rng = ChaCha8Rng::seed_from_u64(42);

            for y in 0..height {
                for x in 0..width {
                    let base_r = ((x * 255 / width) + (y * 128 / height)) % 255;
                    let base_g = ((y * 255 / height) + (x * 64 / width)) % 255;
                    let base_b = ((x + y) * 255 / (width + height)) % 255;

                    // Add noise
                    let noise_r = (base_r as i32 + rng.gen_range(-40..40)).clamp(0, 255) as u8;
                    let noise_g = (base_g as i32 + rng.gen_range(-40..40)).clamp(0, 255) as u8;
                    let noise_b = (base_b as i32 + rng.gen_range(-40..40)).clamp(0, 255) as u8;

                    let color = Rgba([noise_r, noise_g, noise_b, 255]);
                    img.put_pixel(x, y, color);
                }
            }

            // Add many random features
            for _ in 0..100 {
                let x = rng.gen_range(0..width);
                let y = rng.gen_range(0..height);
                let size = rng.gen_range(3..15);
                let color = Rgba([
                    rng.gen_range(0..255),
                    rng.gen_range(0..255),
                    rng.gen_range(0..255),
                    255,
                ]);
                add_circle(&mut img, x, y, size, color);
            }
        }
    }

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

#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
enum ImageComplexity {
    Simple,
    Medium,
    Complex,
}

/// Performance measurement result
#[derive(Debug, Clone)]
#[allow(dead_code)]
struct PerformanceMeasurement {
    pub duration: Duration,
    pub dots_generated: usize,
    pub memory_usage_bytes: usize,
    pub dots_per_second: f64,
    pub configuration: String,
}

impl PerformanceMeasurement {
    fn new(
        duration: Duration,
        dots_generated: usize,
        memory_usage_bytes: usize,
        configuration: String,
    ) -> Self {
        let dots_per_second = if duration.as_secs_f64() > 0.0 {
            dots_generated as f64 / duration.as_secs_f64()
        } else {
            0.0
        };

        Self {
            duration,
            dots_generated,
            memory_usage_bytes,
            dots_per_second,
            configuration,
        }
    }
}

/// Measure performance of dot generation pipeline
fn measure_dot_generation_performance(
    img: &RgbaImage,
    config: &DotConfig,
    description: &str,
) -> PerformanceMeasurement {
    let start = Instant::now();
    let dots = generate_dots_from_image(img, config, None, None);
    let duration = start.elapsed();

    let memory_usage = dots.len() * std::mem::size_of::<vectorize_core::algorithms::dots::Dot>();

    PerformanceMeasurement::new(duration, dots.len(), memory_usage, description.to_string())
}

/// Measure performance of optimized dot generation pipeline
fn measure_optimized_dot_generation_performance(
    img: &RgbaImage,
    config: &OptimizedDotConfig,
    description: &str,
) -> PerformanceMeasurement {
    let start = Instant::now();
    let dots = generate_dots_optimized_pipeline(img, config);
    let duration = start.elapsed();

    let memory_usage = dots.len() * std::mem::size_of::<vectorize_core::algorithms::dots::Dot>();

    PerformanceMeasurement::new(duration, dots.len(), memory_usage, description.to_string())
}

#[test]
fn test_performance_target_500x500() {
    let test_config = PerformanceTestConfig::default();
    let img = create_test_image(500, 500, ImageComplexity::Medium);

    // Test standard configuration
    let standard_config = DotConfig::default();
    let standard_result = measure_dot_generation_performance(&img, &standard_config, "standard");

    // Test optimized configuration
    let optimized_config = OptimizedDotConfig::default();
    let optimized_result =
        measure_optimized_dot_generation_performance(&img, &optimized_config, "optimized");

    println!("500x500 Performance Results:");
    println!(
        "Standard: {:?}ms, {} dots, {:.1} dots/sec",
        standard_result.duration.as_millis(),
        standard_result.dots_generated,
        standard_result.dots_per_second
    );
    println!(
        "Optimized: {:?}ms, {} dots, {:.1} dots/sec",
        optimized_result.duration.as_millis(),
        optimized_result.dots_generated,
        optimized_result.dots_per_second
    );

    // Validate performance targets
    assert!(
        optimized_result.duration.as_millis() <= test_config.target_500x500_ms as u128,
        "Optimized pipeline took {}ms, expected <{}ms for 500x500 image",
        optimized_result.duration.as_millis(),
        test_config.target_500x500_ms
    );

    assert!(
        optimized_result.dots_per_second >= test_config.min_dots_per_second,
        "Optimized pipeline achieved {:.1} dots/sec, expected >{:.1} dots/sec",
        optimized_result.dots_per_second,
        test_config.min_dots_per_second
    );

    // Memory usage validation
    let memory_per_dot =
        optimized_result.memory_usage_bytes / optimized_result.dots_generated.max(1);
    assert!(
        memory_per_dot <= test_config.max_memory_per_dot_bytes,
        "Memory usage per dot: {} bytes, expected <{} bytes",
        memory_per_dot,
        test_config.max_memory_per_dot_bytes
    );
}

#[test]
fn test_performance_target_1000x1000() {
    let test_config = PerformanceTestConfig::default();
    let img = create_test_image(1000, 1000, ImageComplexity::Medium);

    let optimized_config = OptimizedDotConfig::default();
    let result = measure_optimized_dot_generation_performance(
        &img,
        &optimized_config,
        "optimized_1000x1000",
    );

    println!("1000x1000 Performance Result:");
    println!(
        "Time: {:?}ms, {} dots, {:.1} dots/sec",
        result.duration.as_millis(),
        result.dots_generated,
        result.dots_per_second
    );

    // Validate performance target for large images
    assert!(
        result.duration.as_millis() <= test_config.target_1000x1000_ms as u128,
        "Large image processing took {}ms, expected <{}ms for 1000x1000 image",
        result.duration.as_millis(),
        test_config.target_1000x1000_ms
    );
}

#[test]
fn test_gradient_calculation_performance() {
    let sizes = [(100, 100), (250, 250), (500, 500)];
    let target_times = [10, 25, 50]; // milliseconds

    for (i, &(width, height)) in sizes.iter().enumerate() {
        let img = create_test_image(width, height, ImageComplexity::Medium);
        let gray = image::imageops::grayscale(&img);

        // Standard gradient calculation
        let start = Instant::now();
        let _standard_analysis = analyze_image_gradients(&gray);
        let standard_time = start.elapsed();

        // SIMD-optimized gradient calculation (if available)
        let start = Instant::now();
        let _simd_magnitudes =
            simd_gradient_magnitude(gray.as_raw(), width as usize, height as usize);
        let simd_time = start.elapsed();

        println!(
            "Gradient calculation {}x{}: standard={}ms, simd={}ms",
            width,
            height,
            standard_time.as_millis(),
            simd_time.as_millis()
        );

        // Validate performance targets
        assert!(
            standard_time.as_millis() <= target_times[i] as u128,
            "Gradient calculation for {}x{} took {}ms, expected <{}ms",
            width,
            height,
            standard_time.as_millis(),
            target_times[i]
        );

        // SIMD should be faster or at least not significantly slower
        if simd_time.as_millis() > 0 {
            let ratio = simd_time.as_millis() as f64 / standard_time.as_millis() as f64;
            assert!(
                ratio <= 1.5, // Allow up to 50% slower for SIMD overhead on small images
                "SIMD gradient calculation is {ratio} times slower than standard for {width}x{height}"
            );
        }
    }
}

#[test]
fn test_spatial_indexing_performance() {
    let dot_counts = [100, 500, 1000, 2000];

    for &dot_count in &dot_counts {
        // Create test dots
        let dots: Vec<vectorize_core::algorithms::dots::Dot> = (0..dot_count)
            .map(|i| {
                vectorize_core::algorithms::dots::Dot::new(
                    (i % 50) as f32 * 10.0,
                    (i / 50) as f32 * 10.0,
                    2.0,
                    1.0,
                    "#000000".to_string(),
                )
            })
            .collect();

        // Test spatial grid creation and collision detection
        let start = Instant::now();
        let mut grid = SpatialGrid::new(500, 500, 3.0, 2.0);

        for (i, dot) in dots.iter().enumerate() {
            grid.add_dot(i, dot.x, dot.y);
        }

        // Perform collision detection queries
        for _ in 0..100 {
            let _valid = grid.is_position_valid(250.0, 250.0, 2.0, &dots, 2.0);
        }

        let duration = start.elapsed();

        println!(
            "Spatial indexing with {} dots: {}ms",
            dot_count,
            duration.as_millis()
        );

        // Should complete collision detection efficiently
        let max_time_per_dot = 0.1; // 0.1ms per dot maximum
        assert!(
            duration.as_millis() <= (dot_count as f64 * max_time_per_dot) as u128,
            "Spatial indexing with {} dots took {}ms, expected <{}ms",
            dot_count,
            duration.as_millis(),
            (dot_count as f64 * max_time_per_dot) as u128
        );
    }
}

#[test]
fn test_memory_pooling_performance() {
    let allocation_counts = [1000, 5000, 10000];

    for &count in &allocation_counts {
        // Test without pooling (baseline)
        let start = Instant::now();
        let mut baseline_dots = Vec::new();
        for i in 0..count {
            let dot = vectorize_core::algorithms::dots::Dot::new(
                i as f32,
                i as f32,
                2.0,
                1.0,
                "#000000".to_string(),
            );
            baseline_dots.push(dot);
        }
        let baseline_time = start.elapsed();

        // Test with memory pooling
        let start = Instant::now();
        let mut pool = DotPool::new(count / 10, count);
        let mut pooled_dots = Vec::new();
        for i in 0..count {
            let dot = pool.acquire(i as f32, i as f32, 2.0, 1.0, "#000000".to_string());
            pooled_dots.push(dot);
        }
        for dot in pooled_dots.drain(..) {
            pool.release(dot);
        }
        let pooled_time = start.elapsed();

        println!(
            "Memory pooling {} allocations: baseline={}ms, pooled={}ms",
            count,
            baseline_time.as_millis(),
            pooled_time.as_millis()
        );

        // Pooling should be faster or at least comparable
        let pool_stats = pool.stats();
        assert!(
            pool_stats.hit_ratio > 0.0,
            "Memory pool should have some reuse"
        );

        // For large allocation counts, pooling should show benefits
        if count >= 5000 {
            let improvement_ratio =
                baseline_time.as_millis() as f64 / pooled_time.as_millis().max(1) as f64;
            assert!(
                improvement_ratio >= 0.8, // At least not much worse
                "Memory pooling should not significantly degrade performance"
            );
        }
    }
}

#[test]
fn test_simd_operations_performance() {
    let sizes = [1000, 5000, 10000];

    println!(
        "Available SIMD features: {:?}",
        get_available_simd_features()
    );

    for &size in &sizes {
        // Test color distance calculation
        let colors1: Vec<(u8, u8, u8)> = (0..size)
            .map(|i| {
                (
                    (i % 255) as u8,
                    ((i * 2) % 255) as u8,
                    ((i * 3) % 255) as u8,
                )
            })
            .collect();
        let colors2: Vec<(u8, u8, u8)> = (0..size)
            .map(|i| {
                (
                    ((i + 50) % 255) as u8,
                    ((i * 2 + 100) % 255) as u8,
                    ((i * 3 + 150) % 255) as u8,
                )
            })
            .collect();

        let start = Instant::now();
        let _distances = simd_color_distance(&colors1, &colors2);
        let duration = start.elapsed();

        println!(
            "SIMD color distance {} items: {}ms",
            size,
            duration.as_millis()
        );

        // Should process efficiently
        let max_time_per_item = 0.001; // 0.001ms per item
        assert!(
            duration.as_millis() <= (size as f64 * max_time_per_item) as u128,
            "SIMD color distance for {} items took {}ms, expected <{}ms",
            size,
            duration.as_millis(),
            (size as f64 * max_time_per_item) as u128
        );
    }
}

#[test]
fn test_parallel_processing_scaling() {
    let sizes = [(100, 100), (250, 250), (500, 500)];

    for &(width, height) in &sizes {
        let config = ParallelConfig {
            min_parallel_size: 0, // Force parallel processing
            ..Default::default()
        };
        let processor = PixelProcessor::new(config);

        // Simple processing task
        let start = Instant::now();
        let results = processor.process_pixels(width, height, |x, y| x + y);
        let duration = start.elapsed();

        assert_eq!(results.len(), (width * height) as usize);

        println!(
            "Parallel processing {}x{}: {}ms",
            width,
            height,
            duration.as_millis()
        );

        // Should scale reasonably with image size
        let pixels = (width * height) as u128;
        let time_per_pixel = duration.as_nanos() as f64 / pixels as f64;

        assert!(
            time_per_pixel < 1000.0, // Less than 1 microsecond per pixel
            "Parallel processing is too slow: {time_per_pixel:.1} ns/pixel for {width}x{height}"
        );
    }
}

#[test]
fn test_optimization_effectiveness() {
    let img = create_test_image(300, 300, ImageComplexity::Medium);

    // Standard configuration
    let standard_config = OptimizedDotConfig {
        performance_config: PerformanceConfig {
            use_memory_pooling: false,
            use_simd: false,
            use_spatial_indexing: false,
            ..Default::default()
        },
        ..Default::default()
    };

    // Fully optimized configuration
    let optimized_config = OptimizedDotConfig {
        performance_config: PerformanceConfig {
            use_memory_pooling: true,
            use_simd: true,
            use_spatial_indexing: true,
            ..Default::default()
        },
        ..Default::default()
    };

    let standard_result =
        measure_optimized_dot_generation_performance(&img, &standard_config, "standard");
    let optimized_result =
        measure_optimized_dot_generation_performance(&img, &optimized_config, "optimized");

    println!("Optimization effectiveness:");
    println!(
        "Standard: {}ms, {} dots",
        standard_result.duration.as_millis(),
        standard_result.dots_generated
    );
    println!(
        "Optimized: {}ms, {} dots",
        optimized_result.duration.as_millis(),
        optimized_result.dots_generated
    );

    // Optimizations should not significantly change dot count
    let dot_count_diff =
        (standard_result.dots_generated as i32 - optimized_result.dots_generated as i32).abs();
    let max_dot_diff = (standard_result.dots_generated / 10).max(5); // Allow 10% difference or 5 dots
    assert!(
        dot_count_diff <= max_dot_diff as i32,
        "Optimization changed dot count too much: {} vs {} (diff: {})",
        standard_result.dots_generated,
        optimized_result.dots_generated,
        dot_count_diff
    );

    // Optimizations should improve or maintain performance
    let performance_ratio = optimized_result.duration.as_millis() as f64
        / standard_result.duration.as_millis().max(1) as f64;
    assert!(
        performance_ratio <= 1.2, // Allow up to 20% slower (optimization overhead)
        "Optimizations made performance worse: {performance_ratio:.2}x slower"
    );

    println!("Performance ratio (optimized/standard): {performance_ratio:.2}x");
}

#[test]
fn test_memory_usage_efficiency() {
    let img = create_test_image(200, 200, ImageComplexity::Medium);
    let config = OptimizedDotConfig::default();

    // Estimate expected memory usage
    let pixels = (img.width() * img.height()) as usize;
    let estimated_dots = pixels / 20; // Rough estimate
    let estimated_memory = PerformanceUtils::estimate_memory_usage(
        img.width(),
        img.height(),
        estimated_dots,
        &config.performance_config,
    );

    let result = measure_optimized_dot_generation_performance(&img, &config, "memory_test");

    println!(
        "Memory usage: estimated={}KB, actual={}KB",
        estimated_memory / 1024,
        result.memory_usage_bytes / 1024
    );

    // Memory usage should be within reasonable bounds of estimate
    let memory_ratio = result.memory_usage_bytes as f64 / estimated_memory.max(1) as f64;
    assert!(
        memory_ratio <= 3.0, // Allow up to 3x the estimate
        "Actual memory usage {}KB is much higher than estimated {}KB (ratio: {:.2}x)",
        result.memory_usage_bytes / 1024,
        estimated_memory / 1024,
        memory_ratio
    );
}

#[test]
fn test_regression_protection() {
    let img = create_test_image(250, 250, ImageComplexity::Medium);
    let config = OptimizedDotConfig::default();

    // Baseline performance measurement
    let baseline = measure_optimized_dot_generation_performance(&img, &config, "baseline");

    // Multiple measurements to account for variance
    let mut measurements = Vec::new();
    for i in 0..5 {
        let result = measure_optimized_dot_generation_performance(
            &img,
            &config,
            &format!("measurement_{i}"),
        );
        measurements.push(result);
    }

    let avg_time = measurements
        .iter()
        .map(|m| m.duration.as_millis())
        .sum::<u128>()
        / measurements.len() as u128;
    let avg_dots =
        measurements.iter().map(|m| m.dots_generated).sum::<usize>() / measurements.len();

    println!(
        "Regression test - baseline: {}ms, average: {}ms",
        baseline.duration.as_millis(),
        avg_time
    );

    // Performance should not regress significantly
    let test_config = PerformanceTestConfig::default();
    let regression_threshold =
        baseline.duration.as_millis() as f64 * (1.0 + test_config.regression_tolerance / 100.0);

    assert!(
        avg_time as f64 <= regression_threshold,
        "Performance regression detected: {}ms average vs {}ms baseline (threshold: {}ms)",
        avg_time,
        baseline.duration.as_millis(),
        regression_threshold as u128
    );

    // Dot count should be consistent
    let dot_variance = measurements
        .iter()
        .map(|m| (m.dots_generated as i32 - avg_dots as i32).abs())
        .max()
        .unwrap_or(0);

    assert!(
        dot_variance <= 5, // Allow small variance
        "Dot count variance too high: {dot_variance} dots variance"
    );
}
