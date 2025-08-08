# wasm/CLAUDE.md

This document provides Rust/WASM-specific implementation guidelines for the vec2art core processing module.

## Scope Overview

This directory contains the core image-to-SVG vectorization engine written in Rust. The code is developed and tested natively first, then compiled to WebAssembly for browser deployment.

## Project Structure

```
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

### Implementation Status (Updated: Aug 8, 2025)

**✅ COMPLETED:**
- Cargo workspace structure fully implemented and functional
- All three crates (`vectorize-core`, `vectorize-cli`, `vectorize-wasm`) with complete implementations
- `rust-toolchain.toml` and `.cargo/config.toml` configured for native and WASM builds
- Comprehensive workspace dependencies defined and tested
- Core public APIs implemented with functional algorithms
- CLI application with full command structure and positional argument parsing
- WASM bindings with production-ready JavaScript-compatible interface
- Unit test infrastructure in place with actual test coverage
- Benchmark infrastructure with Criterion showing real performance data
- **Major Performance Breakthrough**: Regions algorithm optimized from 50-130s to <1s

**⚠️ CRITICAL ISSUE IDENTIFIED:**
- **Moore Neighborhood Infinite Loops**: Logo algorithm experiences infinite loops on complex images
- **300+ Warnings**: "Cannot trace boundary" warnings indicate fundamental algorithm failure
- **Root Cause**: Moore neighborhood algorithm inadequate for complex topological scenarios

**🚧 PHASE 1.5 PRIORITY (Critical for Production):**
- **Suzuki-Abe Implementation**: Replace Moore neighborhood with industry-standard algorithm
- **Integration via imageproc**: Use `find_contours_with_threshold()` for robust contour detection
- **Research Complete**: 4 specialized research agents confirmed implementation approach
- **Expected Resolution**: Eliminate infinite loops while maintaining/improving performance

**📋 PENDING (After Phase 1.5):**
- Golden SVG snapshot testing setup
- SVG validation with `usvg`/`resvg`
- Production browser testing with WASM module

## Development Guidelines

### Algorithm Implementation
- Develop algorithms as pure Rust functions without platform assumptions
- Use trait-based design for swappable algorithm implementations
- Maintain deterministic behavior (fixed seeds for any randomization)
- Document algorithm parameters and their effects
- **Critical**: Validate algorithm robustness on complex real-world images before production
- **Performance First**: Target <1s processing time for standard images (512x512)

### Algorithm Selection Criteria
- **Robustness**: Must handle complex topological scenarios without infinite loops
- **Industry Standards**: Prefer well-established algorithms with proven track records
- **Performance**: Optimize for multi-threaded CPU execution
- **Research-Backed**: Use specialized research agents for algorithm evaluation

### Performance Optimization
- **Parallelism:** Use `rayon` for data parallelism (scanlines, regions, contours)
  - **Achieved**: Parallel k-means implementation with 50-130x speed improvement
- **SIMD:** Write SIMD-friendly loops; use explicit SIMD where beneficial
- **Memory:** Pre-allocate buffers; use arena allocators for temporary data
  - **Implemented**: Unified preprocessing framework with buffer reuse
- **Image Standardization**: Process at max 512x512 resolution for consistent performance
- **Profiling:** Regular benchmarking with `criterion`; profile with `perf`/`flamegraph`
  - **Results**: Regions algorithm: 50-130s → <1s processing time

### WASM-Specific Considerations
- **Threading:** Implement both single-threaded and multi-threaded paths
- **Memory Limits:** Implement progressive processing for large images
- **SIMD:** Compile with `+simd128` target feature when available
- **Size Optimization:** Use `wasm-opt` for production builds

### Error Handling
- Use `Result<T, E>` with custom error types
- Graceful degradation (fallback algorithms if optimal path fails)
- Clear error messages for debugging
- **Algorithm Validation**: Detect and prevent infinite loops in contour tracing
- **Warning Systems**: Comprehensive logging for algorithm failure modes (300+ warnings indicate critical issues)

### Testing Strategy
- **Unit Tests:** Test individual algorithms and utilities
- **Integration Tests:** End-to-end image → SVG conversion with real-world images
- **Robustness Tests:** Validate algorithms on complex images that expose infinite loops
- **Snapshot Tests:** Compare output SVGs against golden references
- **Property Tests:** Use `proptest` for algorithmic correctness
- **Benchmark Tests:** Track performance regressions and improvements
- **Algorithm Validation:** Test with images that previously caused 300+ warnings

## Key Dependencies

### Core Processing
- `image` — Image loading and basic operations
- `imageproc` — Advanced image processing operations, **critical for Suzuki-Abe contour detection**
- `nalgebra` or `cgmath` — Linear algebra for geometric operations
- `rayon` — Data parallelism (successfully implemented with major performance gains)

### WASM
- `wasm-bindgen` — JavaScript bindings
- `wasm-bindgen-rayon` — Threading support
- `web-sys` — Web API access

### Development
- `criterion` — Benchmarking framework (active use, showing 50-130x improvements)
- `proptest` — Property-based testing
- `insta` — Snapshot testing (pending implementation)

### CI Pipeline Rust
- **Formatting** cargo fmt --all -- --check
- **Type-Check** cargo check --workspace --all-targets --all-features --locked
- **Linting** cargo clippy --workspace --all-targets --all-features -- -D warnings
- **Tests** cargo test --workspace --all-features --locked --no-fail-fast
  - **Critical**: Must include tests for infinite loop prevention
- **Algorithm Validation** cargo test --workspace --no-fail-fast -- algorithm_robustness
- **Performance Benchmarks** cargo bench --workspace (verify <1s processing time)
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
  - **Algorithm Validation**: Ensure no infinite loops in WASM context
- **WASM Build** wasm-pack build --target web --out-dir pkg vectorize-wasm
- **Performance Validation** Verify <1s processing time in WASM context
- **DOCS** RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps
- **Build** (Optional) cargo build --workspace --all-targets --all-features --locked --release --target wasm32-wasi
- **Supply-Chain** (Optional)
    1. cargo install cargo-audit && cargo audit
    2. cargo install cargo-deny && cargo deny check

## Current Status Summary

### Achievements
- **Phase 1**: Functionally complete with working algorithms
- **Performance Breakthrough**: 50-130x speed improvement in regions algorithm
- **Production-Ready Infrastructure**: Complete WASM build system

### Critical Issue
- **Moore Neighborhood Problem**: Infinite loops on real-world images
- **Solution Identified**: Suzuki-Abe algorithm via imageproc
- **Research Complete**: Implementation approach validated

### Next Steps
- **Phase 1.5**: Critical Suzuki-Abe implementation
- **Phase 2**: Browser integration and testing
- **Phase 3**: SvelteKit frontend development