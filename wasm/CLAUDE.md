# wasm/CLAUDE.md

This document provides Rust/WASM-specific implementation guidelines for the vec2art line tracing engine.

## Scope Overview

This directory contains the high-performance line tracing engine written in Rust, specialized for converting raster images into expressive SVG line art. The code is developed and tested natively first, then compiled to WebAssembly for browser deployment with focus on <1.5s processing times and hand-drawn aesthetic quality.

## Project Structure

```Rust/WASM
wasm/
├── Cargo.toml                      # Workspace manifest (members: vectorize-core, vectorize-cli, vectorize-wasm)
├── rust-toolchain.toml             # Pin toolchain/components (stable + rustfmt + clippy + wasm32)
├── .cargo/
│   └── config.toml                 # Target cfgs (wasm32 flags: +simd128), build optimizations
├── .gitignore                      # Ignore /target, /pkg, artifacts, generated files
├── LICENSE
├── CLAUDE.md                       # Repo-local implementation guidelines
├── README.md                       # Project-specific readme
│
├── vectorize-core/                 # Core line tracing library (platform-agnostic)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                  # Main library entry point (public API)
│   │   ├── error.rs                # Custom error types and handling
│   │   ├── config.rs               # Configuration structs for line tracing
│   │   │
│   │   ├── algorithms/             # Line tracing algorithms
│   │   │   ├── mod.rs              # Algorithm exports and common types
│   │   │   ├── trace_low.rs        # Main line tracing implementation with multi-pass
│   │   │   ├── hand_drawn.rs       # Artistic enhancement (tremor, weight variation, tapering)
│   │   │   └── path_utils.rs       # Path generation and curve fitting utilities
│   │   │
│   │   ├── preprocessing/          # Image preprocessing for line tracing
│   │   │   ├── mod.rs
│   │   │   ├── resize.rs           # Adaptive image resizing with quality preservation
│   │   │   ├── filters.rs          # Gaussian, bilateral filtering for noise reduction
│   │   │   ├── edge_detection.rs   # Optimized Canny edge detection with adaptive thresholds
│   │   │   └── noise_filtering.rs  # Content-aware noise filtering
│   │   │
│   │   ├── curve_fitting/          # Path optimization and smoothing
│   │   │   ├── mod.rs
│   │   │   ├── simplify.rs         # Douglas-Peucker path simplification
│   │   │   ├── smooth.rs           # Path smoothing for natural curves
│   │   │   └── bezier.rs           # Cubic Bézier curve fitting for organic lines
│   │   │
│   │   ├── svg_builder/            # SVG generation with artistic styling
│   │   │   ├── mod.rs
│   │   │   ├── builder.rs          # SVG document generation
│   │   │   ├── path.rs             # SVG path element creation with hand-drawn styling
│   │   │   └── optimizer.rs        # SVG optimization and cleanup
│   │   │
│   │   └── utils/                  # Common utilities and helpers
│   │       ├── mod.rs
│   │       ├── geometry.rs         # Point, Vec2, geometric primitives
│   │       ├── image_utils.rs      # Image buffer operations
│   │       ├── math.rs             # Mathematical utilities and constants
│   │       └── performance.rs      # Performance monitoring and optimization
│   │
│   ├── tests/                      # Unit and integration tests
│   │   ├── trace_tests.rs          # Line tracing algorithm tests
│   │   ├── hand_drawn_tests.rs     # Artistic enhancement tests
│   │   └── integration_tests.rs    # End-to-end processing tests
│   └── benches/                    # Performance benchmarks
│       ├── trace_bench.rs          # Line tracing performance tests
│       ├── multipass_bench.rs      # Multi-pass processing benchmarks
│       └── hand_drawn_bench.rs     # Artistic enhancement benchmarks
│
├── vectorize-cli/                  # Native CLI with comprehensive line tracing options
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs                 # CLI entry point with extensive parameter control
│   │   ├── args.rs                 # Command line argument parsing (20+ options)
│   │   ├── commands/               # CLI subcommands
│   │   │   ├── mod.rs
│   │   │   ├── trace_low.rs        # Line tracing with multi-pass and artistic options
│   │   │   └── convert.rs          # Simple conversion with defaults
│   │   └── output.rs               # SVG output and statistics reporting
│   │
│   └── examples/                   # Test images and outputs
│       ├── images_in/              # Test input images for line tracing
│       │   ├── sketch.png          # Hand-drawn style reference
│       │   ├── photo.jpg           # Photographic content
│       │   ├── line_art.png        # Clean line art
│       │   └── complex.png         # Complex geometric content
│       └── outputs/                # Generated SVG outputs and statistics
│           ├── trace_results/      # Line tracing output examples
│           ├── performance/        # Performance test results
│           └── report.md           # Current performance and quality metrics
│
├── vectorize-wasm/                 # WASM bindings (thin wrapper for line tracing)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                  # WASM entry point (wasm-bindgen exports)
│   │   ├── bindings.rs             # JS/TS-friendly line tracing API
│   │   ├── memory.rs               # Zero-copy image buffer handling
│   │   ├── threading.rs            # Multi-threaded processing support
│   │   └── utils.rs                # WASM-specific utilities and helpers
│   │
│   ├── pkg/                        # wasm-pack output (gitignored)
│   └── www/                        # Minimal demo for line tracing
│       ├── index.html              # Line tracing test interface
│       ├── main.ts                 # WASM loader with threading support
│       ├── package.json            # For local demo only
│       └── public/                 # Static assets
│           └── sample_images/      # Test images for browser demos
│
├── tests/                          # Integration and performance tests
│   ├── golden/                     # Golden SVG references for line tracing
│   │   ├── standard/               # Standard single-pass results
│   │   ├── multipass/              # Multi-pass enhanced results
│   │   └── hand_drawn/             # Hand-drawn aesthetic results
│   ├── snapshots.rs                # Snapshot tests for line tracing output
│   ├── performance.rs              # Performance regression tests (<1.5s target)
│   └── wasm_integration.rs         # Browser/WASM smoke tests
│
├── benches/                        # End-to-end performance benchmarks
│   ├── line_tracing_bench.rs       # Core line tracing performance
│   ├── multipass_bench.rs          # Multi-pass processing benchmarks
│   └── hand_drawn_bench.rs         # Artistic enhancement benchmarks
│
├── scripts/                        # Build & testing scripts
│   ├── test-dot-mapping-auto.bat       # Comprehensive automated test suite (5 modes)
│   ├── test-dot-mapping-interactive.bat # Interactive algorithm selection per image
│   ├── build_wasm.sh               # wasm-pack build (release/dev)
│   ├── build_wasm.ps1              # Windows-friendly build script
│   └── generate_bindings.sh        # Generate/update TypeScript definitions
│
├── debug/                          # Debug and development utilities
│   ├── debug_etf_fdog.rs          # ETF/FDoG debugging tools
│   ├── debug_flow_tracing.rs      # Flow tracing debugging
│   ├── debug_flow_detailed.rs     # Detailed flow analysis
│   └── debug_milestone2_quality.rs # Quality analysis tools
│
├── tests/                          # Organized testing infrastructure
│   ├── rust/                       # Rust test files
│   │   ├── test_cli.rs             # CLI validation tests
│   │   ├── test_dot_pipeline.rs    # Dot mapping pipeline tests
│   │   ├── create_test_image.rs    # Test image generation
│   │   └── test_milestone2_runner.rs # Milestone testing
│   ├── test_image.py              # Python test utilities and validation
│   ├── golden/                     # Golden SVG references
│   │   ├── line_tracing/           # Line tracing reference outputs
│   │   ├── dot_mapping/            # Dot mapping reference outputs
│   │   └── benchmarks/             # Performance reference data
│   └── integration/                # Integration test results
│
├── examples/                       # Test images and organized outputs
│   ├── images_in/                  # Test input images for all algorithms
│   │   ├── test1.png              # Standard test image
│   │   ├── test2.png              # Portrait test image
│   │   ├── test3.png              # Landscape test image
│   │   ├── Little-Red-Devil.webp  # Complex WebP test
│   │   ├── Peileppe_Rogue_character.webp # Character test
│   │   ├── Pirate-Flag.png        # Logo test image
│   │   ├── test_shapes.png        # Geometric shapes test
│   │   ├── test_checkerboard.png  # High contrast test
│   │   └── test_gradient.png      # Gradient test
│   ├── outputs/                   # Algorithm-specific output organization
│   │   ├── line_tracing/          # Traditional line tracing results
│   │   │   ├── basic/             # Single-pass edge detection
│   │   │   ├── multipass/         # Multi-pass enhanced results  
│   │   │   └── artistic/          # Hand-drawn enhanced results
│   │   ├── dot_mapping/           # Dot-based pixel mapping results
│   │   │   ├── stippling/         # Fine stippling style outputs
│   │   │   ├── pointillism/       # Bold pointillism style outputs
│   │   │   └── technical/         # Technical precision outputs
│   │   ├── etf_fdog/             # ETF/FDoG algorithm results (legacy)
│   │   ├── flow_tracing/         # Flow-guided tracing results (legacy)
│   │   ├── full_pipeline/        # Complete pipeline results (legacy)
│   │   └── benchmarks/           # Performance benchmark outputs
│   └── performance_reports/       # Performance analysis and metrics
│       ├── summary_report.txt     # Generated performance summary
│       ├── *_stats.csv           # Detailed timing statistics
│       └── COMPREHENSIVE_TEST_SUMMARY.md # Complete test results
│
└── docs/                          # Technical documentation
    ├── line_tracing.md            # Line tracing algorithm details
    ├── dot_mapping_api.md         # Dot mapping API documentation
    ├── dot_mapping_examples.md    # Usage examples and tutorials
    ├── dot_mapping_performance.md # Performance optimization guide
    ├── dot_mapping_styles.md      # Artistic style documentation
    ├── dot_mapping_migration.md   # Migration from line tracing
    ├── performance.md             # Performance optimization guide
    ├── hand_drawn.md              # Artistic enhancement documentation
    └── api.md                     # Public API reference
```

## Module Organization

The project is organized as a Cargo workspace with three specialized crates and a clean organizational structure for all testing, debugging, and output files.

### Organizational Standards

**File Organization Principles:**
- **scripts/**: All batch and shell scripts for testing and building
- **debug/**: Debug utilities and development tools (no production code)  
- **tests/**: All test files organized by language/type (rust/, python, etc.)
- **examples/outputs/**: Algorithm-specific output folders with clear naming
- **examples/performance_reports/**: Performance analysis and metrics
- **docs/**: Technical documentation organized by feature/algorithm

**Output Organization:**
- **Line Tracing**: `examples/outputs/line_tracing/` with subfolders for basic, multipass, artistic
- **Dot Mapping**: `examples/outputs/dot_mapping/` with subfolders for stippling, pointillism, technical  
- **Legacy Algorithms**: `examples/outputs/etf_fdog/`, `examples/outputs/flow_tracing/`, etc.
- **Benchmarks**: `examples/outputs/benchmarks/` for performance testing outputs
- **Performance Reports**: `examples/performance_reports/` for all metrics and analysis

**Script Organization:**
- Test scripts use organized output paths (`examples/outputs/algorithm_name/`)
- Debug files are isolated in `debug/` folder to avoid confusion with production code
- Test utilities are properly categorized (rust/, python integration tests)
- All paths in scripts reference the organized structure consistently

**Development Guidelines:**
- **NEVER** place debug/test files in the root wasm folder
- **NEVER** create duplicate examples folders (scripts should reference wasm/examples/)
- **ALWAYS** use algorithm-specific output folders for generated files
- **UPDATE** scripts when adding new algorithms to maintain organization
- **DOCUMENT** new organizational changes in this CLAUDE.md file
- **VERIFY** folder structure periodically to prevent redundant directories

### Workspace Structure

### Implementation Status

**Current**: Phases 1-2 Complete - Production-ready line tracing with artistic enhancements

- **Core Line Tracing Engine**: High-performance Canny edge detection with multi-pass processing
- **Multi-Directional Processing**: Standard, reverse, and diagonal passes for comprehensive line capture
- **Hand-Drawn Aesthetics**: Complete artistic enhancement pipeline with tremor, weight variation, and tapering
- **Performance Achievement**: <1.5s processing times with optimized algorithms and SIMD acceleration
- **CLI Interface**: Comprehensive parameter control with 20+ options for professional line art creation
- **WASM Ready**: Browser integration prepared with multi-threading and memory optimization
- **Test Coverage**: Comprehensive testing with performance benchmarks and golden reference validation

**Next**: Phase 3 Frontend Integration - SvelteKit interface with real-time preview and export

## Development Guidelines

### Line Tracing Implementation

- Focus on pure Rust implementations optimized for line art extraction
- Emphasize performance with <1.5s processing time targets for typical images
- Implement multi-pass processing (standard, reverse, diagonal) for comprehensive coverage
- Maintain deterministic behavior with reproducible random seeds for artistic effects
- Document parameter effects on line quality and artistic style
- Validate output quality through visual inspection and performance benchmarks
- Support content-aware processing with adaptive noise filtering and detail levels

### Performance Optimization

- **Ultra-Fast Target**: Achieve <1.5s processing times through algorithmic and implementation optimization
- **Parallelism:** Use `rayon` for multi-threaded edge detection, path generation, and artistic enhancement
- **SIMD:** Leverage SIMD instructions for image processing and mathematical operations
- **Memory Efficiency:** Pre-allocate buffers, minimize allocations, and optimize cache usage
- **Adaptive Processing**: Dynamic resolution handling and content-aware parameter tuning
- **Profiling:** Regular benchmarking with `criterion`; profile hot paths with `flamegraph`

### WASM-Specific Considerations

- **Threading:** Support both single-threaded and multi-threaded line tracing execution paths
- **Memory Optimization:** Efficient image buffer handling with zero-copy operations where possible
- **SIMD:** Compile with `+simd128` target feature for accelerated edge detection and path processing
- **Bundle Size:** Use `wasm-opt` for production builds focused on line tracing functionality

### Error Handling

- Use `Result<T, E>` with custom error types for line tracing operations
- Graceful degradation with fallback processing when edge detection encounters issues
- Clear error messages for debugging image processing and path generation failures
- Robust handling of edge cases in multi-pass processing and artistic enhancement

### Testing Strategy

- **Unit Tests:** Test line tracing algorithms, hand-drawn enhancements, and utilities
- **Integration Tests:** End-to-end image → line art SVG conversion with diverse test images
- **Snapshot Tests:** Compare output SVGs against golden references for visual regression detection
- **Performance Tests:** Validate <1.5s processing time targets and track performance improvements
- **Visual Quality Tests:** Manual validation of artistic quality and line expressiveness

## Key Dependencies

### Core Processing

- `image` — Image loading and basic operations optimized for line tracing
- `imageproc` — Advanced image processing (Canny edge detection, Gaussian filtering)
- `nalgebra` — Linear algebra for geometric operations and path mathematics
- `rayon` — Data parallelism for multi-threaded edge detection and path generation
- `serde` — Serialization for configuration and output data structures

### WASM

- `wasm-bindgen` — JavaScript bindings
- `wasm-bindgen-rayon` — Threading support
- `web-sys` — Web API access

### Development

- `criterion` — Performance benchmarking for line tracing optimization
- `insta` — Snapshot testing for SVG output validation
- `clap` — Command-line argument parsing for extensive line tracing parameter control
- `rand` — Random number generation for artistic effects (tremor, variation)
- `approx` — Floating-point comparisons for geometric testing

### CI Pipeline Rust

- **Formatting** cargo fmt --all -- --check
- **Type-Check** cargo check --workspace --all-targets --locked
- **Linting** cargo clippy --workspace --all-targets -- -D warnings
- **Unit Tests** cargo test --workspace --locked --no-fail-fast
- **Performance Tests** cargo run --bin vectorize-cli -- trace-low examples/images_in/test.png output.svg --stats perf.csv
- **Performance Benchmarks** cargo bench --workspace (line tracing performance validation)
- **Documentation** RUSTDOCFLAGS="-D warnings" cargo doc --workspace --no-deps
- **Release Build** cargo build --workspace --all-targets --locked --release
- **Supply-Chain** (Optional)
    1. cargo install cargo-audit && cargo audit
    2. cargo install cargo-deny  && cargo deny check

### CI Pipeline WASM

- **Formatting** cargo fmt --all -- --check
- **Type-Check** cargo check --workspace --all-targets --locked --target wasm32-wasi
- **Linting** cargo clippy --workspace --all-targets --locked --target wasm32-wasi -- -D warnings
- **WASM Tests** CARGO_TARGET_WASM32_WASI_RUNNER=wasmtime cargo test --workspace --locked --no-fail-fast --target wasm32-wasi
- **WASM Build** wasm-pack build --target web --out-dir pkg vectorize-wasm --release
- **Bundle Optimization** wasm-opt pkg/vectorize_wasm_bg.wasm -O3 -o pkg/vectorize_wasm_bg.wasm
- **Documentation** RUSTDOCFLAGS="-D warnings" cargo doc --workspace --no-deps
- **Size Analysis** ls -lh pkg/*.wasm (validate bundle size for browser deployment)
- **Supply-Chain** (Optional)
    1. cargo install cargo-audit && cargo audit
    2. cargo install cargo-deny && cargo deny check

## Development Status

### Phases 1-2 Complete (Production-Ready Line Tracing System)

- **Core Line Tracing Engine**:
  - **Optimized Canny Edge Detection**: High-performance edge detection with adaptive thresholds
  - **Multi-Pass Processing**: Standard, reverse, and diagonal directional passes for comprehensive line capture
  - **Content-Aware Filtering**: Intelligent noise filtering and detail level adaptation
  - **Performance Achievement**: Consistent <1.5s processing times across diverse test images

- **Hand-Drawn Aesthetic Enhancement**:
  - **Variable Stroke Weights**: Dynamic width variation based on path curvature and content
  - **Tremor Effects**: Subtle hand-drawn irregularities for organic, natural line feel
  - **Tapering System**: Smooth line endings with natural width transitions
  - **Artistic Presets**: Multiple hand-drawn styles from subtle to pronounced effects

- **CLI Interface (Production-Ready)**:
  - **Comprehensive Parameters**: 20+ options for fine-tuning line tracing and artistic effects
  - **Multi-Pass Controls**: Enable/disable reverse and diagonal passes for quality vs. speed trade-offs
  - **Backend Selection**: Edge backend production-ready, centerline and superpixel planned
  - **Statistics Export**: Performance and quality metrics output to CSV for analysis

- **Performance Optimization**:
  - **Multi-Threading**: Parallel edge detection and path generation with `rayon`
  - **SIMD Acceleration**: Optimized image processing operations
  - **Memory Efficiency**: Buffer reuse and allocation optimization for minimal overhead
  - **Ultra-Fast Target**: <1.5s processing achieved through algorithmic and implementation optimization

- **Quality Validation**:
  - **Visual Quality Focus**: Emphasis on expressive, artistic line art output
  - **Performance Benchmarking**: Consistent timing validation across test suite
  - **Regression Testing**: Golden reference comparisons for output quality assurance
  - **Real-World Testing**: Validation on diverse image types (photos, sketches, line art, complex images)

### Ready for Phase 3 (Frontend Integration)

- **WASM-Optimized Core**: Line tracing engine ready for browser deployment
- **Threading Support**: Multi-threaded processing configured for web workers
- **Memory Management**: Efficient image buffer handling for browser constraints
- **API Design**: Clean, focused interface for line tracing with artistic enhancement options
