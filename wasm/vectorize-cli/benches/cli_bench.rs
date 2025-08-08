//! Benchmarks for vectorize-cli

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use image::{ImageBuffer, Rgba};
use vectorize_core::{vectorize_logo_rgba, vectorize_regions_rgba, LogoConfig, RegionsConfig};

fn create_test_image(size: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    ImageBuffer::from_fn(size, size, |x, y| {
        if (x + y) % 2 == 0 {
            Rgba([255, 255, 255, 255]) // White
        } else {
            Rgba([0, 0, 0, 255]) // Black
        }
    })
}

fn benchmark_logo_vectorization(c: &mut Criterion) {
    let sizes = vec![64, 128, 256, 512];
    let config = LogoConfig::default();

    let mut group = c.benchmark_group("logo_vectorization");

    for size in sizes {
        let img = create_test_image(size);
        group.bench_with_input(BenchmarkId::new("logo", size), &size, |b, _| {
            b.iter(|| {
                black_box(vectorize_logo_rgba(&img, &config).unwrap());
            })
        });
    }

    group.finish();
}

fn benchmark_regions_vectorization(c: &mut Criterion) {
    let sizes = vec![64, 128, 256]; // Smaller sizes for more complex algorithm
    let config = RegionsConfig::default();

    let mut group = c.benchmark_group("regions_vectorization");

    for size in sizes {
        let img = create_test_image(size);
        group.bench_with_input(BenchmarkId::new("regions", size), &size, |b, _| {
            b.iter(|| {
                black_box(vectorize_regions_rgba(&img, &config).unwrap());
            })
        });
    }

    group.finish();
}

fn benchmark_different_configs(c: &mut Criterion) {
    let img = create_test_image(256);

    let mut group = c.benchmark_group("config_variations");

    // Test different logo configs
    let logo_configs = vec![
        ("default", LogoConfig::default()),
        (
            "high_quality",
            LogoConfig {
                simplification_tolerance: 0.5,
                curve_tolerance: 1.0,
                ..LogoConfig::default()
            },
        ),
        (
            "fast",
            LogoConfig {
                simplification_tolerance: 2.0,
                fit_curves: false,
                ..LogoConfig::default()
            },
        ),
    ];

    for (name, config) in logo_configs {
        group.bench_with_input(BenchmarkId::new("logo", name), &config, |b, config| {
            b.iter(|| {
                black_box(vectorize_logo_rgba(&img, config).unwrap());
            })
        });
    }

    // Test different regions configs
    let regions_configs = vec![
        ("default", RegionsConfig::default()),
        (
            "few_colors",
            RegionsConfig {
                num_colors: 8,
                ..RegionsConfig::default()
            },
        ),
        (
            "many_colors",
            RegionsConfig {
                num_colors: 32,
                max_iterations: 50, // Reduce iterations for benchmark
                ..RegionsConfig::default()
            },
        ),
    ];

    for (name, config) in regions_configs {
        group.bench_with_input(BenchmarkId::new("regions", name), &config, |b, config| {
            b.iter(|| {
                black_box(vectorize_regions_rgba(&img, config).unwrap());
            })
        });
    }

    group.finish();
}

criterion_group!(
    benches,
    benchmark_logo_vectorization,
    benchmark_regions_vectorization,
    benchmark_different_configs
);
criterion_main!(benches);
