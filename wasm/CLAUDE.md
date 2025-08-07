# wasm/CLAUDE.md

This document provides Rust/WASM-specific implementation guidelines for the vec2art core processing module.

## Scope Overview

This directory contains the core image-to-SVG vectorization engine written in Rust. The code is developed and tested natively first, then compiled to WebAssembly for browser deployment.

## Project Structure

```
wasm/
├── Cargo.toml                      # Workspace manifest
├── Cargo.lock                      # Dependency lockfile
├── build.rs                        # Build script for C bindings
├── CLAUDE.md                       # This documentation file
├── README.md                       # Project-specific readme
│
├── vectorize-core/                 # Core Rust library (platform-agnostic)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                  # Main library entry point
│   │   ├── error.rs                # Custom error types
│   │   ├── config.rs               # Configuration structs
│   │   │
│   │   ├── algorithms/             # Vectorization algorithms
│   │   │   ├── mod.rs
│   │   │   ├── traits.rs           # Algorithm traits and interfaces
│   │   │   ├── logo_mode.rs        # Binary tracing (Potrace-style)
│   │   │   ├── color_regions.rs    # K-means/superpixel vectorization
│   │   │   ├── edge_mode.rs        # Edge detection and centerlines
│   │   │   ├── stylized/           # Creative algorithms
│   │   │   │   ├── mod.rs
│   │   │   │   ├── low_poly.rs     # Delaunay triangulation
│   │   │   │   ├── stipple.rs      # Dot/stipple art
│   │   │   │   └── halftone.rs     # Halftone patterns
│   │   │   └── vtracer_wrapper.rs  # Optional VTracer integration
│   │   │
│   │   ├── preprocessing/          # Image preprocessing
│   │   │   ├── mod.rs
│   │   │   ├── resize.rs           # Image resizing utilities
│   │   │   ├── colorspace.rs       # sRGB ↔ CIELAB conversions
│   │   │   ├── filters.rs          # Bilateral, Gaussian filters
│   │   │   ├── threshold.rs        # Otsu, adaptive thresholding
│   │   │   ├── morphology.rs       # Erosion, dilation, open, close
│   │   │   └── edge_detection.rs   # Canny, Sobel edge detectors
│   │   │
│   │   ├── curve_fitting/          # Path optimization
│   │   │   ├── mod.rs
│   │   │   ├── simplify.rs         # RDP, Visvalingam-Whyatt
│   │   │   ├── bezier.rs           # Cubic Bézier curve fitting
│   │   │   ├── contours.rs         # Contour tracing
│   │   │   └── smooth.rs           # Path smoothing algorithms
│   │   │
│   │   ├── svg_builder/            # SVG generation
│   │   │   ├── mod.rs
│   │   │   ├── builder.rs          # SVG document builder
│   │   │   ├── path.rs             # SVG path element generation
│   │   │   ├── optimizer.rs        # Path optimization and cleanup
│   │   │   └── styles.rs           # Fill, stroke, and style handling
│   │   │
│   │   └── utils/                  # Common utilities
│   │       ├── mod.rs
│   │       ├── geometry.rs         # Point, Vec2, geometric primitives
│   │       ├── color.rs            # Color manipulation and conversion
│   │       ├── image_utils.rs      # Image I/O and basic operations
│   │       ├── math.rs             # Math utilities and constants
│   │       └── memory.rs           # Memory management helpers
│   │
│   └── tests/                      # Unit tests
│       ├── algorithm_tests.rs
│       ├── preprocessing_tests.rs
│       └── integration_tests.rs
│
├── vectorize-cli/                  # Native CLI for testing
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs                 # CLI entry point
│   │   ├── args.rs                 # Command line argument parsing
│   │   ├── commands/               # CLI subcommands
│   │   │   ├── mod.rs
│   │   │   ├── convert.rs          # Single image conversion
│   │   │   ├── batch.rs            # Batch processing
│   │   │   └── benchmark.rs        # Performance benchmarking
│   │   └── output.rs               # Output formatting and saving
│   │
│   └── examples/                   # Example images for testing
│       ├── images_in/              # Test input images
│       │   ├── logo_test.png
│       │   ├── photo_test.jpg
│       │   ├── line_art.png
│       │   └── complex_image.png
│       └── images_out/             # Expected output SVGs
│           ├── logo_test_binary.svg
│           ├── photo_test_regions.svg
│           └── line_art_edges.svg
│
├── vectorize-wasm/                 # WASM bindings
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                  # WASM entry point
│   │   ├── bindings.rs             # JavaScript bindings
│   │   ├── memory.rs               # Zero-copy memory management
│   │   ├── threading.rs            # Web Worker integration
│   │   ├── workers/                # Web Worker scripts
│   │   │   ├── processor.rs        # Main processing worker
│   │   │   └── coordinator.rs      # Multi-worker coordination
│   │   └── utils.rs                # WASM-specific utilities
│   │
│   ├── pkg/                        # Generated WASM output (gitignored)
│   └── www/                        # Simple test HTML page
│       ├── index.html
│       ├── index.js
│       └── package.json
│
├── tests/                          # Integration tests
│   ├── golden/                     # Golden SVG references
│   │   ├── logo_mode/
│   │   ├── color_regions/
│   │   └── edge_mode/
│   ├── snapshots.rs                # Snapshot testing
│   ├── performance.rs              # Performance regression tests
│   └── wasm_integration.rs         # WASM-specific tests
│
├── benches/                        # Performance benchmarks
│   ├── algorithm_bench.rs          # Algorithm benchmarks
│   ├── preprocessing_bench.rs      # Preprocessing benchmarks
│   └── end_to_end_bench.rs         # Full pipeline benchmarks
│
├── external/                       # External C/C++ code
│   ├── potrace/                    # Potrace C wrapper (optional)
│   │   ├── potrace_wrapper.c
│   │   ├── potrace_wrapper.h
│   │   └── build.rs
│   └── autotrace/                  # AutoTrace C wrapper (optional)
│       ├── autotrace_wrapper.c
│       ├── autotrace_wrapper.h
│       └── build.rs
│
├── scripts/                        # Build and utility scripts
│   ├── build_wasm.sh              # WASM build script
│   ├── test_all.sh                # Run all tests
│   ├── benchmark.sh               # Run benchmarks
│   └── generate_bindings.sh       # Generate TypeScript definitions
│
└── docs/                          # Additional documentation
    ├── algorithms.md              # Algorithm implementation details
    ├── performance.md             # Performance optimization guide
    ├── wasm_integration.md        # WASM integration guide
    └── api.md                     # API documentation
```

## Module Organization

The project is organized as a Cargo workspace with three main crates:

## Development Guidelines

### Algorithm Implementation
- Develop algorithms as pure Rust functions without platform assumptions
- Use trait-based design for swappable algorithm implementations
- Maintain deterministic behavior (fixed seeds for any randomization)
- Document algorithm parameters and their effects

### Performance Optimization
- **Parallelism:** Use `rayon` for data parallelism (scanlines, regions, contours)
- **SIMD:** Write SIMD-friendly loops; use explicit SIMD where beneficial
- **Memory:** Pre-allocate buffers; use arena allocators for temporary data
- **Profiling:** Regular benchmarking with `criterion`; profile with `perf`/`flamegraph`

### WASM-Specific Considerations
- **Threading:** Implement both single-threaded and multi-threaded paths
- **Memory Limits:** Implement progressive processing for large images
- **SIMD:** Compile with `+simd128` target feature when available
- **Size Optimization:** Use `wasm-opt` for production builds

### Error Handling
- Use `Result<T, E>` with custom error types
- Graceful degradation (fallback algorithms if optimal path fails)
- Clear error messages for debugging

### Testing Strategy
- **Unit Tests:** Test individual algorithms and utilities
- **Integration Tests:** End-to-end image → SVG conversion
- **Snapshot Tests:** Compare output SVGs against golden references
- **Property Tests:** Use `proptest` for algorithmic correctness
- **Benchmark Tests:** Track performance regressions

## Key Dependencies

### Core Processing
- `image` — Image loading and basic operations
- `imageproc` — Advanced image processing operations
- `nalgebra` or `cgmath` — Linear algebra for geometric operations
- `rayon` — Data parallelism

### WASM
- `wasm-bindgen` — JavaScript bindings
- `wasm-bindgen-rayon` — Threading support
- `web-sys` — Web API access

### Development
- `criterion` — Benchmarking framework
- `proptest` — Property-based testing
- `insta` — Snapshot testing

### CI Pipeline Rust
- **Formatting** cargo fmt --all -- --check
- **Type-Check** cargo check --workspace --all-targets --all-features --locked
- **Linting** cargo clippy --workspace --all-targets --all-features -- -D warnings
- **Tests** cargo test --workspace --all-features --locked --no-fail-fast
- **DOCS** RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps
- **Build** (Optional) cargo build --workspace --all-targets --all-features --locked --release
- **Supply-Chain** (Optional)
    1. cargo install cargo-audit && cargo audit
    2. cargo install cargo-deny  && cargo deny check

### CI Pipeline WASM
- **Formatting** cargo fmt --all -- --check
- **Type-Check** cargo check --workspace --all-targets --all-features --locked --target wasm32-wasi
- **Linting** cargo clippy --workspace --all-targets --all-features --locked --target wasm32-wasi -- -D warnings
- **Tests** CARGO_TARGET_WASM32_WASI_RUNNER=wasmtime cargo test --workspace --all-features --locked --no-fail-fast --target wasm32-wasi
- **DOCS** RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps
- **Build** (Optional) cargo build --workspace --all-targets --all-features --locked --release --target wasm32-wasi
- **Supply-Chain** (Optional)
    1. cargo install cargo-audit && cargo audit
    2. cargo install cargo-deny && cargo deny check