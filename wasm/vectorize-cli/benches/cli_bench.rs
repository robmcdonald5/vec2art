//! Benchmarks for vectorize-cli

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use image::{ImageBuffer, Rgba};
use vectorize_core::{vectorize_trace_low_rgba, TraceLowConfig};

fn create_test_image(size: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    ImageBuffer::from_fn(size, size, |x, y| {
        if (x + y) % 2 == 0 {
            Rgba([255, 255, 255, 255]) // White
        } else {
            Rgba([0, 0, 0, 255]) // Black
        }
    })
}

fn benchmark_trace_low_vectorization(c: &mut Criterion) {
    let sizes = vec![64, 128, 256, 512];
    let config = TraceLowConfig::default();

    let mut group = c.benchmark_group("trace_low_vectorization");

    for size in sizes {
        let img = create_test_image(size);
        group.bench_with_input(BenchmarkId::new("trace_low", size), &size, |b, _| {
            b.iter(|| {
                black_box(vectorize_trace_low_rgba(&img, &config, None).unwrap());
            })
        });
    }

    group.finish();
}

fn benchmark_multipass_vectorization(c: &mut Criterion) {
    let sizes = vec![64, 128, 256]; // Smaller sizes for multipass
    let config = TraceLowConfig {
        enable_multipass: true,
        ..TraceLowConfig::default()
    };

    let mut group = c.benchmark_group("multipass_vectorization");

    for size in sizes {
        let img = create_test_image(size);
        group.bench_with_input(BenchmarkId::new("multipass", size), &size, |b, _| {
            b.iter(|| {
                black_box(vectorize_trace_low_rgba(&img, &config, None).unwrap());
            })
        });
    }

    group.finish();
}

fn benchmark_different_configs(c: &mut Criterion) {
    let img = create_test_image(256);

    let mut group = c.benchmark_group("config_variations");

    // Test different trace-low configs
    let trace_configs = vec![
        ("default", TraceLowConfig::default()),
        (
            "high_detail",
            TraceLowConfig {
                detail: 0.8,
                ..TraceLowConfig::default()
            },
        ),
        (
            "low_detail",
            TraceLowConfig {
                detail: 0.2,
                ..TraceLowConfig::default()
            },
        ),
        (
            "multipass",
            TraceLowConfig {
                enable_multipass: true,
                ..TraceLowConfig::default()
            },
        ),
    ];

    for (name, config) in trace_configs {
        group.bench_with_input(BenchmarkId::new("trace_low", name), &config, |b, config| {
            b.iter(|| {
                black_box(vectorize_trace_low_rgba(&img, config, None).unwrap());
            })
        });
    }

    group.finish();
}

criterion_group!(
    benches,
    benchmark_trace_low_vectorization,
    benchmark_multipass_vectorization,
    benchmark_different_configs
);
criterion_main!(benches);
