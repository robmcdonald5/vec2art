# wasm/CLAUDE.md

This document provides Rust/WASM-specific implementation guidelines for the vec2art core processing module.

## Scope Overview

This directory contains the core image-to-SVG vectorization engine written in Rust. The code is developed and tested natively first, then compiled to WebAssembly for browser deployment.

## Project Structure

```Rust/WASM
wasm/
├── Cargo.toml                      # Workspace manifest (members: vectorize-core, vectorize-cli, vectorize-wasm)
├── rust-toolchain.toml             # Pin toolchain/components (e.g., stable + rustfmt + clippy)
├── .cargo/
│   └── config.toml                 # Target cfgs (wasm32 flags: +simd128; optional atomics), build settings
├── .gitignore                      # Ignore /target, /pkg, node_modules, artifacts
├── LICENSE
├── CLAUDE.md                       # Repo-local agent guidance
├── README.md                       # Project-specific readme
│
├── vectorize-core/                 # Core Rust library (platform-agnostic, no JS/WASM deps)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                  # Main library entry point (public API)
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
│   │       ├── image_utils.rs      # Image buffers & basic ops (I/O kept in CLI)
│   │       ├── math.rs             # Math utilities and constants
│   │       └── memory.rs           # Memory helpers / buffer pools
│   │
│   ├── tests/                      # Unit tests
│   │   ├── algorithm_tests.rs
│   │   ├── preprocessing_tests.rs
│   │   └── integration_tests.rs
│   └── benches/                    # Criterion benches for hot loops
│       ├── simplify_bench.rs
│       ├── bezier_fit_bench.rs
│       └── segmentation_bench.rs
│
├── vectorize-cli/                  # Native CLI for dev/bench/snapshots
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
│       └── images_out/             # Expected output SVGs (goldens)
│           ├── logo_test_binary.svg
│           ├── photo_test_regions.svg
│           └── line_art_edges.svg
│
├── vectorize-wasm/                 # WASM bindings (thin wrapper over core)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                  # WASM entry point (wasm-bindgen exports)
│   │   ├── bindings.rs             # JS/TS-friendly wrappers & types
│   │   ├── memory.rs               # Zero-copy view into WASM memory
│   │   ├── threading.rs            # wasm-bindgen-rayon init & helpers
│   │   ├── workers/                # (Optional) Worker-coordination utils
│   │   │   ├── mod.rs
│   │   │   ├── processor.rs        # Work splitting / message protocol
│   │   │   └── coordinator.rs      # Multi-worker orchestration
│   │   └── utils.rs                # WASM-specific utilities
│   │
│   ├── pkg/                        # wasm-pack output (gitignored)
│   └── www/                        # Minimal dev/demo site
│       ├── index.html              # Test harness
│       ├── main.ts                 # ESM loader; init_thread_pool() call
│       ├── server.mjs              # Dev server w/ COOP/COEP headers
│       ├── vite.config.ts          # Optional: Vite bundling config
│       ├── package.json            # For local demo only
│       ├── public/
│       │   └── _headers            # Netlify-style COOP/COEP (threads-ready)
│       └── tsconfig.json
│
├── tests/                          # Cross-crate integration tests
│   ├── golden/                     # Golden SVG references (snapshots)
│   │   ├── logo_mode/
│   │   ├── color_regions/
│   │   └── edge_mode/
│   ├── snapshots.rs                # insta-style snapshot tests
│   ├── performance.rs              # Perf regressions (smoke-level)
│   └── wasm_integration.rs         # Browser/wasm smoke tests (headless)
│
├── benches/                        # End-to-end benches (CLI invokes core)
│   ├── algorithm_bench.rs
│   ├── preprocessing_bench.rs
│   └── end_to_end_bench.rs
│
├── external/                       # Optional C/C++ wrappers (off by default)
│   ├── potrace/
│   │   ├── potrace_wrapper.c
│   │   ├── potrace_wrapper.h
│   │   └── build.rs
│   └── autotrace/
│       ├── autotrace_wrapper.c
│       ├── autotrace_wrapper.h
│       └── build.rs
│
├── scripts/                        # Build & utility scripts
│   ├── build_wasm.sh               # wasm-pack build (release/dev)
│   ├── build_wasm.ps1              # Windows-friendly build script
│   ├── test_all.sh                 # Run unit/integration/snapshots
│   ├── benchmark.sh                # Run benches with criterion
│   └── generate_bindings.sh        # Generate/update TypeScript d.ts
│
└── docs/                           # Additional documentation
    ├── algorithms.md               # Algorithm implementation details
    ├── performance.md              # Perf optimization guide
    ├── wasm_integration.md         # Threads/SIMD, COOP/COEP notes
    └── api.md                      # Public API documentation
```

## Module Organization

The project is organized as a Cargo workspace with three main crates:

### Implementation Status

**Current**: Phase A.5+ complete with Phase B infrastructure - production-ready adaptive algorithms with comprehensive refinement capabilities

- Cargo workspace structure with three main crates
- `rust-toolchain.toml` and `.cargo/config.toml` configured for native and WASM builds
- Advanced algorithms: Wu quantization, SLIC segmentation, Suzuki-Abe contours, primitive detection
- Telemetry system with per-run config dumps and CSV logging for diagnostics and quality analysis
- Auto-retry guard system implemented and ready for activation
- Configuration fixes: SLIC step_px parameter corrected, pixel-based Douglas-Peucker epsilon
- WASM bindings ready for browser integration
- Multi-threading support configured
- Comprehensive test coverage

**Next**: Phase 2 WASM Integration - ready for browser deployment with production-grade algorithms

## Development Guidelines

### Algorithm Implementation

- Develop algorithms as pure Rust functions without platform assumptions
- Use trait-based design for swappable implementations
- Maintain deterministic behavior (fixed seeds for randomization)
- Document algorithm parameters and their effects
- Target ≤ 2.5s processing time for production images (1024px max dimension)
- Achieve median ΔE ≤ 6.0 and SSIM ≥ 0.93 on comprehensive test suite
- Validate robustness on complex real-world images with adaptive parameter systems

### Performance Optimization

- **Parallelism:** Use `rayon` for data parallelism (scanlines, regions, contours)
- **SIMD:** Write SIMD-friendly loops; use explicit SIMD where beneficial
- **Memory:** Pre-allocate buffers; use arena allocators for temporary data
- **Adaptive Resolution**: Dynamic processing up to 2048px with performance scaling
- **Quality Targets**: Achieve roadmap-compliant quality metrics (ΔE, SSIM, runtime)
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
- Detect and prevent infinite loops in contour tracing

### Testing Strategy

- **Unit Tests:** Test individual algorithms and utilities
- **Integration Tests:** End-to-end image → SVG conversion with real-world images
- **Snapshot Tests:** Compare output SVGs against golden references
- **Property Tests:** Use `proptest` for algorithmic correctness
- **Benchmark Tests:** Track performance regressions and improvements

## Key Dependencies

### Core Processing

- `image` — Image loading and basic operations
- `imageproc` — Advanced image processing operations (Canny edge detection, etc.)
- `nalgebra` or `cgmath` — Linear algebra for geometric operations
- `rayon` — Data parallelism for multi-threading
- `lab` — LAB color space conversions for improved color quantization

### WASM

- `wasm-bindgen` — JavaScript bindings
- `wasm-bindgen-rayon` — Threading support
- `web-sys` — Web API access

### Development

- `criterion` — Benchmarking framework
- `proptest` — Property-based testing
- `insta` — Snapshot testing
- `ssim` — Structural similarity validation for quality testing
- `clap` — Command-line argument parsing with comprehensive parameter support

### CI Pipeline Rust

- **Formatting** cargo fmt --all -- --check
- **Type-Check** cargo check --workspace --all-targets --all-features --locked
- **Linting** cargo clippy --workspace --all-targets --all-features -- -D warnings
- **Tests** cargo test --workspace --all-features --locked --no-fail-fast
- **Telemetry Integration Tests** cargo run --bin vectorize-cli (all commands generate telemetry automatically)
- **Performance Benchmarks** cargo bench --workspace
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
- **WASM Build** wasm-pack build --target web --out-dir pkg vectorize-wasm
- **DOCS** RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps
- **Build** (Optional) cargo build --workspace --all-targets --all-features --locked --release --target wasm32-wasi
- **Supply-Chain** (Optional)
    1. cargo install cargo-audit && cargo audit
    2. cargo install cargo-deny && cargo deny check

## Development Status

### Phase A.5+ Complete (Production-Ready Adaptive Algorithms)

- **Adaptive Parameter Systems**:
  - **Logo Mode**: Content-aware primitive fit tolerance, resolution scaling, shape validation
  - **Regions Mode**: Adaptive SLIC step_px (12-120), Wu color count (8-64), dynamic ΔE thresholds
  - **Image Analysis**: Complexity, density, and noise level assessment for parameter tuning
  - **Quality Assurance**: Automatic parameter adjustment based on image characteristics

- **Algorithm Enhancements**:
  - **Wu Quantization**: Edge case handling with k-means fallback, LAB color space processing
  - **SLIC Integration**: Region-aware color assignment with corrected parameters
  - **Gradient Detection**: Perceptual weighting with stability validation
  - **Contour Processing**: Robust validation and denoising with Suzuki-Abe implementation

- **Performance Optimization**:
  - **Adaptive Resolution**: Dynamic processing for large images (>2048px) with quality scaling
  - **Memory Pool Optimization**: Buffer reuse and efficient allocation strategies
  - **Enhanced Parallelization**: SLIC, Wu quantization, and gradient analysis optimization
  - **Consistent Performance**: ≤ 2.5s processing time achieved across test suite

### Phase B Infrastructure Complete (Error-Driven Refinement)

- **Complete Refinement Pipeline**: Rasterization, error analysis, and actions framework
- **Quality Measurement System**: ΔE and SSIM computation with statistical analysis
- **Multi-Criteria Convergence**: Automated convergence detection with quality thresholds
- **Configuration Integration**: Seamless Phase A parameter integration with Phase B refinement
- **Performance Budgeting**: Time and iteration limits with graceful degradation

### CLI Enhancements (Production-Ready Interface)

- **Specialized Presets**: photo, portrait, landscape, illustration, technical, artistic modes
- **Refinement Integration**: All presets available with -refined suffix for Phase B processing
- **Advanced Parameters**: Quality targets, refinement budgets, and fine-tuning controls
- **New Commands**: analyze, compare, presets (list/info) for comprehensive workflow support

### Quality Validation (Roadmap Compliance)

- **Phase A Benchmark Harness**: Comprehensive roadmap compliance validation
- **Target Achievement**: Median ΔE ≤ 6.0, SSIM ≥ 0.93, runtime ≤ 2.5s
- **27 Integration Tests**: 100% success rate across 9 images × 3 algorithms
- **Statistical Validation**: Multiple iterations with robust timing and quality metrics

### Ready for Phase 2 (WASM Integration)

- **Production-Grade Algorithms**: All algorithms meet or exceed roadmap targets
- **WASM-Optimized Architecture**: Memory management and threading ready for browser deployment
- **Complete Infrastructure**: Telemetry, configuration, and quality systems production-ready
- **Performance Verified**: Consistent high-quality output with predictable timing characteristics
