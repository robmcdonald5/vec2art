//! Benchmarks for vectorize-core algorithms

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use image::{ImageBuffer, Rgba};
use vectorize_core::algorithms::logo::Point;
use vectorize_core::algorithms::path_utils::{
    calculate_path_length, douglas_peucker_simplify, visvalingam_whyatt_simplify,
};
use vectorize_core::preprocessing::{
    apply_threshold, calculate_otsu_threshold, resize_image, rgb_to_lab, rgba_to_grayscale,
};
use vectorize_core::{vectorize_logo_rgba, vectorize_regions_rgba, LogoConfig, RegionsConfig};

fn create_checkerboard_image(size: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    ImageBuffer::from_fn(size, size, |x, y| {
        let cell_size = size / 8;
        let cell_x = x / cell_size;
        let cell_y = y / cell_size;
        if (cell_x + cell_y) % 2 == 0 {
            Rgba([255, 255, 255, 255])
        } else {
            Rgba([0, 0, 0, 255])
        }
    })
}

fn create_gradient_image(size: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    ImageBuffer::from_fn(size, size, |x, y| {
        let r = (x * 255 / size) as u8;
        let g = (y * 255 / size) as u8;
        let b = ((x + y) * 255 / (size * 2)) as u8;
        Rgba([r, g, b, 255])
    })
}

fn create_test_path(num_points: usize) -> Vec<Point> {
    (0..num_points)
        .map(|i| {
            let angle = 2.0 * std::f32::consts::PI * i as f32 / num_points as f32;
            let radius = 100.0 + 20.0 * (5.0 * angle).sin();
            Point {
                x: 150.0 + radius * angle.cos(),
                y: 150.0 + radius * angle.sin(),
            }
        })
        .collect()
}

fn benchmark_full_vectorization(c: &mut Criterion) {
    let sizes = vec![64, 128, 256, 512];

    let mut group = c.benchmark_group("full_vectorization");

    for size in sizes {
        let pixels = (size * size) as u64;
        group.throughput(Throughput::Elements(pixels));

        let checkerboard = create_checkerboard_image(size);
        let gradient = create_gradient_image(size);

        // Benchmark logo algorithm on checkerboard
        group.bench_with_input(
            BenchmarkId::new("logo_checkerboard", size),
            &size,
            |b, _| {
                let config = LogoConfig::default();
                b.iter(|| {
                    black_box(vectorize_logo_rgba(&checkerboard, &config).unwrap());
                });
            },
        );

        // Benchmark regions algorithm on gradient
        if size <= 256 {
            // Limit size for complex algorithm
            group.bench_with_input(BenchmarkId::new("regions_gradient", size), &size, |b, _| {
                let config = RegionsConfig {
                    max_iterations: 20, // Reduce for benchmarking
                    ..RegionsConfig::default()
                };
                b.iter(|| {
                    black_box(vectorize_regions_rgba(&gradient, &config).unwrap());
                });
            });
        }
    }

    group.finish();
}

fn benchmark_preprocessing(c: &mut Criterion) {
    let img = create_gradient_image(512);

    let mut group = c.benchmark_group("preprocessing");
    group.throughput(Throughput::Elements((512 * 512) as u64));

    group.bench_function("resize_image", |b| {
        b.iter(|| {
            black_box(resize_image(&img, 256).unwrap());
        });
    });

    group.bench_function("rgba_to_grayscale", |b| {
        b.iter(|| {
            black_box(rgba_to_grayscale(&img));
        });
    });

    let grayscale = rgba_to_grayscale(&img);

    group.bench_function("calculate_otsu_threshold", |b| {
        b.iter(|| {
            black_box(calculate_otsu_threshold(&grayscale));
        });
    });

    group.bench_function("apply_threshold", |b| {
        b.iter(|| {
            black_box(apply_threshold(&grayscale, 128));
        });
    });

    group.finish();
}

fn benchmark_color_conversion(c: &mut Criterion) {
    let mut group = c.benchmark_group("color_conversion");

    // Test RGB to LAB conversion performance
    group.bench_function("rgb_to_lab_single", |b| {
        b.iter(|| {
            black_box(rgb_to_lab(128, 64, 192));
        });
    });

    group.bench_function("rgb_to_lab_batch", |b| {
        let colors = vec![(255, 0, 0), (0, 255, 0), (0, 0, 255), (128, 128, 128)];
        b.iter(|| {
            for &(r, g, b) in &colors {
                black_box(rgb_to_lab(r, g, b));
            }
        });
    });

    group.finish();
}

fn benchmark_path_simplification(c: &mut Criterion) {
    let path_sizes = vec![100, 500, 1000, 5000];

    let mut group = c.benchmark_group("path_simplification");

    for size in path_sizes {
        group.throughput(Throughput::Elements(size as u64));
        let path = create_test_path(size);

        group.bench_with_input(
            BenchmarkId::new("douglas_peucker", size),
            &path,
            |b, path| {
                b.iter(|| {
                    black_box(douglas_peucker_simplify(path, 2.0));
                });
            },
        );

        group.bench_with_input(
            BenchmarkId::new("visvalingam_whyatt", size),
            &path,
            |b, path| {
                b.iter(|| {
                    black_box(visvalingam_whyatt_simplify(path, 4.0));
                });
            },
        );

        group.bench_with_input(BenchmarkId::new("path_length", size), &path, |b, path| {
            b.iter(|| {
                black_box(calculate_path_length(path));
            });
        });
    }

    group.finish();
}

fn benchmark_memory_usage(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_intensive");

    // Test memory allocation patterns
    group.bench_function("large_image_creation", |b| {
        b.iter(|| {
            let img = create_gradient_image(1024);
            black_box(img);
        });
    });

    group.bench_function("multiple_small_images", |b| {
        b.iter(|| {
            let images: Vec<_> = (0..16).map(|_| create_checkerboard_image(64)).collect();
            black_box(images);
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    benchmark_full_vectorization,
    benchmark_preprocessing,
    benchmark_color_conversion,
    benchmark_path_simplification,
    benchmark_memory_usage
);
criterion_main!(benches);
