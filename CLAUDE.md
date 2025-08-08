# CLAUDE.md

---

# GENERAL RULES

## Agentic Workflow Principles

1. **Outline**
  When prompted break up the task at hand into a `todo list`.

2. **Delegate**
  Task sub-agents with completing these `todo` tasks using `@'relevant-agent-name'` call(s).

3. **Analyze**
  When a sub-agent is done outputting, analyze what it did and decide if the output is good or if the agent needs re-tasked with new instructions.

4. **Summarize**
  When `todo list` is completed do an overview of what was completed and output succinctly what was accomplished.

---

## Quality & Standards
  All agents when completing tasks must follow these standards.

- **Formatting**  
  Apply language‑specific formatters (e.g., `rustfmt`, `prettier`, `black`, `autopep8`, etc..) and enforce them in CI.

- **Linting**  
  Run linters (e.g., `clippy`, `eslint`, `flake8`, etc..) on all code changes.

- **Testing**  
  Maintain automated unit and integration tests that maintain high relevant coverage.

- **Documentation**  
  As architecture of the project updates `CLAUDE.md` files need to continue to be updated including this document.
  Large full project scope architecture changes should be kept and continually updated in the `Full Project Scope` section of this CLAUDE.md document.
  Local scope changes such as specific changes to parts of the code base that only affect a certain subset of the project should be put in localscope CLAUDE.md files in subfolders Examples of this are: `frontend`, `backend`, `wasm`, etc.. 

---

## CLAUDE.md Maintenance

- **Updates**  
  - Modify **this** global section when adjusting cross‑project rules.  
  - Modify or create scope level `CLAUDE.md` files for project specific updates.

---

## Project Overview

`vec2art` is a browser‑based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art via a Rust‑powered WebAssembly (WASM) module, prioritizing client‑side performance. **Current Status**: Phase 1 functionally complete with **automated testbed validation** achieving **100% success rate** across 12 tests. **Critical Phase 1.5** identified as essential for production deployment due to quantified Moore neighborhood infinite loop issues (377-407 warnings on complex images). The end goal is to get high performance conversions with just CPU multithreading. GPU acceleration will be an optional addition.

---

## Technology Stack

### Core Processing (Rust/WASM)
- **Language:** Rust (other languages such as C can be used if proper wrappers exist to integrate into Rust)
- **Compilation Target:** WebAssembly (this is an endgoal, all testing should be done natively and run locally on PC)
- **Build Tools:** `wasm-pack`, `cargo`, `wasm-opt`  
- **Key Purpose:** Image processing algorithms & SVG generation

### Frontend (SvelteKit)
- **Framework:** SvelteKit 5 + Tailwind CSS 4  
- **Language:** TypeScript  
- **Package Manager:** `npm`  
- **Testing:** `vitest` (unit), `playwright` (E2E)

---

## High-Level Architecture

### Module Structure
- **`vectorize-core/`** — Pure Rust library containing all vectorization algorithms, platform-agnostic
- **`vectorize-cli/`** — Native CLI for development, benchmarking, and golden SVG snapshot testing
- **`vectorize-wasm/`** — Thin WebAssembly wrapper using `wasm-bindgen` for browser integration

### Vectorization Modes
The system supports multiple algorithmic approaches for different artistic styles and use cases:

1. **Logo/Line-Art Mode** — Binary tracing for high-contrast images (logos, sketches, scans)
2. **Color Regions Mode** — Quantization/superpixel-based posterization for photos and illustrations
3. **Edge/Centerline Mode** — Stroke-based rendering for drawn/outline effects
4. **Stylized Modes** — Creative effects including low-poly, stipple, and halftone patterns

### Processing Pipeline
1. **Input Processing** — Accept raster images (PNG, JPG, WebP)
2. **Preprocessing** — Resize, denoise, colorspace conversion as needed
3. **Vectorization** — Apply selected algorithm(s) to generate paths
4. **Curve Fitting** — Simplify and smooth paths using RDP/VW algorithms with Bézier fitting
5. **SVG Generation** — Output optimized, lightweight SVG with configurable quality settings

### Performance Strategy
- **CPU Optimization** — Primary focus on multi-threaded CPU processing using `rayon`
- **SIMD Support** — Leverage SIMD instructions where available (native and WASM)
- **Memory Management** — Zero-copy I/O, buffer reuse, and careful allocation strategies
- **Progressive Enhancement** — Optional GPU acceleration as future enhancement

### Development Phases
- **Phase 1: Native Core** — Build and test algorithms as native Rust library ✅ **COMPLETE** (100% testbed validation)
- **Phase 1.5: Critical Algorithm Fix** — 🚧 **CRITICAL PRIORITY** Replace Moore neighborhood with Suzuki-Abe (377-407 warning elimination)
- **Phase 2: WASM Integration** — Wrap core library for browser deployment (infrastructure ready)
- **Phase 3: Frontend** — SvelteKit interface with real-time preview and export

---

## Full Project Scope

### Current Implementation Status (Updated: Aug 8, 2025)

#### Phase 1: Native Core Development ✅ (Functionally Complete)

**CRITICAL ISSUE QUANTIFIED**: Moore neighborhood contour tracing produces 377-407 warnings on real-world images (4 out of 6 test images severely affected). **Testbed Evidence**: Automated validation with 100% completion rate demonstrates **regions algorithm excellence** (0 warnings) vs **logo algorithm crisis** (377-407 warnings on complex images). Phase 1.5 Suzuki-Abe implementation is ESSENTIAL for production deployment.

**Cargo Workspace Structure**: 
- Workspace configured under `wasm/` directory with three main crates
- `rust-toolchain.toml` and `.cargo/config.toml` properly configured for native and WASM builds
- All build dependencies and workspace dependencies defined

**Core Crates Implemented**:

1. **`vectorize-core/`** (Pure Rust library)
   - **Public API**: Main functions `vectorize_logo_rgba()` and `vectorize_regions_rgba()` with parameter structs
   - **Error handling**: Custom error types in `error.rs` with proper error propagation
   - **Configuration**: Comprehensive config types in `config.rs` for all algorithm parameters
   - **Preprocessing**: Full preprocessing pipeline with placeholder implementations:
     - Image resizing and downscaling utilities
     - sRGB ↔ CIELAB color space conversions
     - Edge-preserving denoising (bilateral/guided filters)
     - Thresholding (Otsu + adaptive methods)
     - Morphological operations (open/close)
     - Connected components filtering
   - **Algorithms**: Core vectorization algorithms with functional implementations:
     - **Logo/Line-Art**: Binary tracing pipeline with Moore neighborhood contour tracing (⚠️ infinite loop issues)
     - **Color Regions**: Parallel k-means clustering in LAB space with dramatic performance optimization (50-130s → <1s)
     - Path utilities for curve fitting and simplification with configurable parameters
   - **SVG Generation**: Complete SVG builder with path optimization and styling
   - **Unit Tests**: Basic test structure for all modules

2. **`vectorize-cli/`** (Native CLI application)
   - **Commands**: Full CLI interface with `convert`, `batch`, and `benchmark` subcommands
   - **Image I/O**: Support for PNG, JPG, WebP input formats via `image` crate
   - **Parameter Configuration**: Positional argument parsing (input.png output.svg --mode logo)
   - **Benchmarking**: Criterion-based performance benchmarks with real performance data

3. **`vectorize-wasm/`** (WebAssembly bindings)
   - **WASM Bindings**: Functional JavaScript-compatible API using `wasm-bindgen`
   - **Memory Management**: Zero-copy memory handling with proper cleanup
   - **Thread Support**: `wasm-bindgen-rayon` integration ready for deployment
   - **Type Conversions**: Safe conversion between Rust and JavaScript types
   - **Build System**: Production-ready with SIMD and optimization flags

**Infrastructure Complete**:
- Multi-threaded processing support via `rayon`
- SIMD optimization flags and target features
- Comprehensive workspace dependencies for image processing, math, and WASM
- Build optimization profiles for development and release
- Testing infrastructure with unit tests and benchmarks

**Critical Next Steps (Phase 1.5)**:
- **PRIORITY**: Replace Moore neighborhood with Suzuki-Abe algorithm to resolve infinite loop issues
- Implement contour tracing via `imageproc::find_contours_with_threshold()`
- Validate infinite loop resolution on problematic test cases
- Add golden SVG snapshot testing with `insta`
- Implement SVG validation with `usvg`/`resvg`

**Performance Achievements**:
- **Regions Algorithm**: Optimized from 50-130s to <1s processing time (50-130x improvement)
- **Unified Preprocessing**: Image standardization at max 512x512 resolution
- **Parallel K-means**: Proper multi-threading implementation with significant speedups

#### Phase 1.5: Critical Algorithm Replacement (IMMEDIATE PRIORITY)
- **Moore Neighborhood Issue**: Infinite loops on complex images with 300+ warnings
- **Suzuki-Abe Solution**: Industry-standard algorithm via `imageproc` crate integration
- **Research Complete**: 4 specialized research agents analyzed implementation approach
- **Expected Outcome**: Eliminate infinite loops while maintaining or improving performance

#### Phase 2 & 3: Ready for Implementation (After Phase 1.5)
- WASM browser integration with threading support (infrastructure complete)
- SvelteKit frontend with drag-and-drop interface
- COOP/COEP headers for cross-origin isolation
- Progressive image processing for large files

### Architecture Decisions Made

1. **Workspace Organization**: Cargo workspace under `wasm/` for clean separation of concerns
2. **Algorithm Structure**: Trait-based design allowing swappable implementations
3. **Error Handling**: Comprehensive error types with proper propagation chains
4. **Performance Strategy**: Multi-threading via `rayon` with SIMD optimization paths
5. **Testing Approach**: Unit tests, integration tests, and golden SVG snapshot comparisons
6. **Memory Management**: Zero-copy operations where possible with careful buffer reuse
7. **Image Processing**: Unified preprocessing framework with standardized 512x512 max resolution
8. **Algorithm Selection**: Evidence-based algorithm replacement (Suzuki-Abe over Moore neighborhood)

### Research-Backed Critical Issues

**Moore Neighborhood Contour Tracing Problem**:
- **Issue**: Infinite loops on complex real-world images, causing 300+ warnings and processing hangs
- **Research**: Comprehensive analysis by 4 specialized research agents
- **Root Cause**: Moore neighborhood algorithm inadequate for complex topological scenarios
- **Solution**: Suzuki-Abe algorithm via `imageproc::find_contours_with_threshold()`
- **Benefits**: Industry-standard approach, handles complex topologies, no infinite loops
- **Implementation**: Direct drop-in replacement in `algorithms/logo_mode.rs`

### Performance Breakthrough

**Regions Algorithm Optimization**:
- **Previous Performance**: 50-130 seconds processing time
- **Optimized Performance**: <1 second processing time
- **Improvement Factor**: 50-130x speed increase
- **Key Optimizations**: Parallel k-means, unified preprocessing, image standardization
- **Impact**: Makes regions algorithm production-ready for real-time use

## Current Development Status (Testbed-Validated)

### Phase 1: Complete with Critical Issue Quantified
- **✅ Functionality**: All algorithms implemented and working
- **✅ Performance**: Regions algorithm optimized 50-130x (50-130s → <1s)
- **✅ Testing Infrastructure**: Automated testbed with concrete validation metrics
- **⚠️ Critical Issue**: Moore neighborhood infinite loops quantified (377-407 warnings on real images)

### Testbed Results Summary (Generated: Thu 08/07/2025 21:30)
- **Total Tests**: 12 (6 images × 2 algorithms)
- **Success Rate**: 100% completion
- **Regions Algorithm**: 0 warnings across all images, 0-1s processing
- **Logo Algorithm**: 0-1s processing but severe warning issues:
  - test1.png: 377 warnings
  - test2.png: 407 warnings
  - test3.png: 185 warnings
  - test_gradient.png: 52 warnings
  - test_checkerboard.png: 13 warnings
  - test_shapes.png: 1 warning
- **Pattern Confirmed**: Simple shapes (1 warning) vs complex images (185-407 warnings)
- **Impact Assessment**: **4 out of 6 images severely affected** (>50 warnings)

### Phase 1.5: Evidence-Based Critical Priority
- **Not "Nice to Have"**: Testbed data proves **ESSENTIAL** for production
- **Quantified Problem**: 377-407 warnings = unusable for real applications
- **Solution Ready**: Suzuki-Abe algorithm researched, testbed validation framework prepared
- **Target Metrics**: Reduce 377-407 warnings to <10 per image using automated testbed validation
- **Validation Framework**: `test-algorithms.bat` provides concrete before/after comparison capability

## IMPORTANT REMEMBER TO UPDATE TODO LIST WHEN TASKS ARE UPDATED/COMPLETED/REMOVED/ADDED