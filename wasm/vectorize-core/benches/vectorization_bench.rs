//! Basic benchmarks for vectorize-core

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use image::{ImageBuffer, Rgba};
use vectorize_core::{vectorize_trace_low_rgba, TraceBackend, TraceLowConfig};

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

fn benchmark_line_tracing(c: &mut Criterion) {
    let sizes = vec![64, 128, 256];

    let mut group = c.benchmark_group("line_tracing");

    for size in sizes {
        let pixels = (size * size) as u64;
        group.throughput(Throughput::Elements(pixels));

        let checkerboard = create_checkerboard_image(size);

        // Benchmark single-pass trace-low on checkerboard
        group.bench_with_input(BenchmarkId::new("trace_low_edge", size), &size, |b, _| {
            let config = TraceLowConfig {
                backend: TraceBackend::Edge,
                detail: 0.3,
                enable_multipass: false,
                ..TraceLowConfig::default()
            };
            b.iter(|| {
                black_box(vectorize_trace_low_rgba(&checkerboard, &config).unwrap());
            });
        });

        // Benchmark dots backend
        group.bench_with_input(BenchmarkId::new("trace_low_dots", size), &size, |b, _| {
            let config = TraceLowConfig {
                backend: TraceBackend::Dots,
                detail: 0.3,
                dot_density_threshold: 0.1,
                ..TraceLowConfig::default()
            };
            b.iter(|| {
                black_box(vectorize_trace_low_rgba(&checkerboard, &config).unwrap());
            });
        });
    }

    group.finish();
}

criterion_group!(benches, benchmark_line_tracing);
criterion_main!(benches);
