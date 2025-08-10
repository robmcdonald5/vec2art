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

`vec2art` is a browser‑based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art via a Rust‑powered WebAssembly (WASM) module, prioritizing client‑side performance. **Current Status**: Phase 1.5+ complete with telemetry system - production-ready core algorithms with comprehensive diagnostics and quality improvements. Ready for Phase 2 (WASM Integration) and Phase 3 (Frontend). Target: high performance CPU-based conversions with optional GPU acceleration.

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

1. **Logo/Line-Art Mode** — Binary tracing with Suzuki-Abe contours and primitive shape detection (✅ production-ready with adaptive parameters)
2. **Color Regions Mode** — Wu color quantization and SLIC superpixel-based posterization with gradient detection (✅ production-ready with adaptive parameters)
3. **Trace-Low Mode** — Fast, low-detail tracing with 3 backends:
   - **Edge Backend** — Canny edge detection for sparse outlines (✅ fully functional)
   - **Centerline Backend** — Skeleton-based tracing for line art (🚧 stubbed for future)
   - **Superpixel Backend** — Large region fills for cell-shaded effects (🚧 stubbed for future)
4. **Phase B Refinement** — Error-driven quality improvement with rasterization, analysis, and targeted corrections (✅ complete)
5. **Specialized Presets** — Photo, portrait, landscape, illustration, technical, artistic modes (✅ complete)
6. **Stylized Modes** — Creative effects including low-poly, stipple, and halftone patterns (📋 planned)

### Processing Pipeline
1. **Input Processing** — Accept raster images (PNG, JPG, WebP) with adaptive resolution handling
2. **Image Analysis** — Assess complexity, density, and noise for parameter adaptation
3. **Preprocessing** — Adaptive resize, denoise, colorspace conversion to LAB
4. **Vectorization** — Apply algorithm with content-aware parameter tuning
5. **Curve Fitting** — Simplify and smooth paths using adaptive RDP/VW algorithms with Bézier fitting
6. **Phase B Refinement** — Optional error-driven quality improvement with rasterization and analysis
7. **SVG Generation** — Output optimized, lightweight SVG with quality validation

### Performance Strategy
- **CPU Optimization** — Primary focus on multi-threaded CPU processing using `rayon`
- **SIMD Support** — Leverage SIMD instructions where available (native and WASM)
- **Memory Management** — Zero-copy I/O, buffer reuse, and careful allocation strategies
- **Progressive Enhancement** — Optional GPU acceleration as future enhancement

### Development Phases
- **Phase 1: Native Core** — ✅ Complete - Build and test algorithms as native Rust library
- **Phase A: Adaptive Algorithms** — ✅ Complete - Content-aware parameter systems, enhanced algorithm quality
- **Phase B: Refinement Infrastructure** — ✅ Complete - Error-driven quality improvement pipeline
- **Phase 2: WASM Integration** — Ready for browser deployment with production-grade algorithms
- **Phase 3: Frontend** — SvelteKit interface with real-time preview and export

---

## Current Status

### Implementation Complete (Phase A.5+ with Phase B Infrastructure)
- **Adaptive Algorithm Suite**: Production-ready logo, regions, and trace-low vectorization with content-aware parameter tuning
- **Phase A Enhancements**: 
  - Adaptive parameter systems for all algorithms based on image analysis
  - Wu color quantization with k-means fallback and LAB color space processing
  - SLIC integration with region-aware color assignment and adaptive step sizing
  - Enhanced gradient detection with perceptual weighting and stability validation
  - Robust contour processing with validation and denoising
- **Phase B Refinement Pipeline**: Complete error-driven quality improvement infrastructure
- **Specialized Presets**: 10+ presets including photo, portrait, landscape, illustration, technical, artistic modes
- **Performance Achievement**: Consistent ≤ 2.5s processing meeting roadmap targets
- **Quality Validation**: Phase A benchmark harness achieving median ΔE ≤ 6.0 and SSIM ≥ 0.93 targets

### Architecture

#### Workspace Structure
- **`vectorize-core/`** — Pure Rust library with all vectorization algorithms
- **`vectorize-cli/`** — Native CLI for development and testing
- **`vectorize-wasm/`** — WebAssembly bindings for browser integration

#### Key Features
- **Adaptive Logo Mode**: Binary tracing with content-aware primitive fit tolerance, resolution scaling, and shape validation
- **Adaptive Regions Mode**: Wu quantization with dynamic color counts (8-64), adaptive SLIC step sizing (12-120), and enhanced gradient detection
- **Enhanced Trace-Low Mode**: Fast edge detection with optimized performance and quality
- **Phase B Refinement**: Complete rasterization, error analysis, and targeted correction pipeline
- **Specialized Preset System**: Photo, portrait, landscape, illustration, technical, and artistic modes with refinement variants
- **Advanced CLI**: 30+ parameters with preset integration, quality targets, and refinement controls
- **Production Infrastructure**: Complete telemetry, configuration management, and benchmark validation systems
- **Performance Optimization**: Adaptive resolution processing, memory pool optimization, and enhanced parallelization
- **Quality Assurance**: Phase A benchmark harness with roadmap compliance validation and statistical analysis

## IMPORTANT REMEMBER TO UPDATE TODO LIST WHEN TASKS ARE UPDATED/COMPLETED/REMOVED/ADDED