# CLAUDE.md

---

# GENERAL RULES

## Agentic Workflow Principles **IMPORTANT**

1. **Outline**
  When prompted break up the task at hand into a `todo list`.

2. **Delegate**
  Delegate sub-agents with completing these `todo` tasks using `@'relevant-agent-name'` call(s).

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

`vec2art` is a specialized browser‑based tool that transforms raster images (JPG, PNG, WebP) into expressive line art SVGs via a high-performance Rust‑powered WebAssembly (WASM) module. **Current Status**: Phases 1-2 Complete - Production-ready line tracing algorithms with multi-pass directional processing and hand-drawn aesthetics. Ready for Phase 3 (Frontend Integration). Focus: Ultra-fast line tracing with artistic enhancements achieving <1.5s processing times.

---

## Technology Stack

### Core Processing (Rust/WASM)
- **Language:** Rust with SIMD optimization and multi-threading via `rayon`
- **Compilation Target:** WebAssembly with native development/testing
- **Build Tools:** `wasm-pack`, `cargo`, `wasm-opt`  
- **Key Purpose:** High-performance line tracing with artistic aesthetics

### Frontend (SvelteKit)
- **Framework:** SvelteKit 5 + Tailwind CSS 4  
- **Language:** TypeScript  
- **Package Manager:** `npm`  
- **Testing:** `vitest` (unit), `playwright` (E2E)

---

## High-Level Architecture

### Module Structure
- **`vectorize-core/`** — Pure Rust library containing line tracing algorithms and artistic enhancements
- **`vectorize-cli/`** — Native CLI for development and testing with comprehensive parameter control
- **`vectorize-wasm/`** — Thin WebAssembly wrapper using `wasm-bindgen` for browser integration

### Line Tracing System
The system focuses exclusively on advanced line tracing with multiple enhancement layers:

1. **Multi-Pass Processing** — Directional enhancement system:
   - **Standard Pass** — Left-to-right, top-to-bottom edge detection
   - **Reverse Pass** — Right-to-left, bottom-to-top for missed details (optional)
   - **Diagonal Pass** — Diagonal scanning for complex geometries (optional)
   
2. **Hand-Drawn Aesthetics** — Artistic enhancement system:
   - **Variable Stroke Weights** — Dynamic width variation based on curvature
   - **Tremor Effects** — Subtle hand-drawn irregularities and organic feel
   - **Tapering** — Natural line endings with smooth width transitions
   
3. **Backend Options** — Multiple tracing approaches:
   - **Edge Backend** — Canny edge detection optimized for line art (✅ production-ready)
   - **Centerline Backend** — Zhang-Suen skeleton-based tracing for precise line extraction (✅ production-ready)
   - **Superpixel Backend** — SLIC region-based approach for stylized line art (✅ production-ready)
   - **Dots Backend** — Stippling and pointillism effects (✅ production-ready)

#### Backend Detailed Descriptions

**Edge Backend** (Default)
- **Algorithm**: Canny edge detection with adaptive thresholds
- **Best For**: Detailed line art, drawings, sketches, complex imagery
- **Performance**: Ultra-fast, <1.5s for typical images
- **Output**: Traditional line art with clean, continuous strokes
- **Features**: Multi-pass processing, directional enhancement, hand-drawn aesthetics

**Centerline Backend**
- **Algorithm**: Zhang-Suen thinning algorithm for skeleton extraction
- **Best For**: Bold shapes, logos, text, high-contrast imagery
- **Performance**: Moderate speed, good for simpler shapes
- **Output**: Single-pixel width centerlines, precise geometric representation
- **Features**: Morphological processing, contour-based tracing
- **Use Cases**: Technical drawings, logos, simplified line art

**Superpixel Backend**
- **Algorithm**: SLIC (Simple Linear Iterative Clustering) segmentation
- **Best For**: Stylized art, abstract representations, color-rich images
- **Performance**: Fast, region-based processing
- **Output**: Polygonal line art based on color/texture regions
- **Features**: Adaptive region count based on detail level
- **Use Cases**: Modern art styles, simplified illustrations, poster-like effects

**Dots Backend**
- **Algorithm**: Adaptive stippling with content-aware dot placement
- **Best For**: Artistic effects, texture emphasis, vintage styles
- **Performance**: Very fast, density-based processing
- **Output**: Stippling patterns with variable dot sizes and colors
- **Features**: Color preservation, adaptive sizing, background detection

### Processing Pipeline
1. **Input Processing** — Accept raster images (PNG, JPG, WebP) with resolution optimization
2. **Edge Detection** — Canny edge detection with adaptive thresholds and noise filtering
3. **Multi-Pass Tracing** — Directional passes (standard, reverse, diagonal) for comprehensive coverage
4. **Path Generation** — Convert edge pixels to smooth SVG paths with curve fitting
5. **Artistic Enhancement** — Apply hand-drawn aesthetics (variable weights, tremor, tapering)
6. **SVG Output** — Generate optimized, expressive SVG with artistic line qualities

### Performance Strategy
- **Ultra-Fast Processing** — <1.5s processing times for typical images through optimized algorithms
- **CPU Optimization** — Multi-threaded edge detection and path generation using `rayon`
- **SIMD Support** — Leverage SIMD instructions for image processing operations
- **Memory Efficiency** — Optimized buffer management and reuse for minimal allocations

### Development Phases
- **Phase 1: Native Core** — ✅ Complete - Line tracing algorithms with multi-pass processing
- **Phase 2: Artistic Enhancement** — ✅ Complete - Hand-drawn aesthetics and performance optimization
- **Phase 3: Frontend Integration** — 📋 Next - SvelteKit interface with real-time preview

---

## Current Status

### Production-Ready Line Tracing System (Phases 1-2 Complete)
- **Core Line Tracing**: High-performance edge detection with Canny algorithm optimization
- **Multi-Backend System**: Four production-ready backends (edge, centerline, superpixel, dots)
- **Multi-Pass Processing**: Directional enhancement system with standard, reverse, and diagonal passes
- **Hand-Drawn Aesthetics**: Complete artistic enhancement pipeline with variable weights, tremor, and tapering
- **Performance Achievement**: Ultra-fast processing achieving <1.5s for typical images
- **CLI Interface**: Comprehensive parameter control with 20+ options for fine-tuning

### Architecture

#### Workspace Structure  
- **`vectorize-core/`** — Pure Rust library focused on line tracing algorithms
- **`vectorize-cli/`** — Native CLI with extensive parameter control and testing capabilities
- **`vectorize-wasm/`** — WebAssembly bindings ready for browser integration

#### Key Features
- **Advanced Edge Detection**: Optimized Canny edge detection with adaptive thresholds
- **Multi-Directional Processing**: Standard, reverse, and diagonal passes for comprehensive line capture
- **Artistic Enhancement Pipeline**: Hand-drawn aesthetics with tremor, variable weights, and tapering
- **Performance Optimization**: Multi-threaded processing with SIMD acceleration
- **Flexible Backend System**: Four production-ready backends (edge, centerline, superpixel, dots)
- **Content-Aware Processing**: Noise filtering and detail level adaptation
- **Comprehensive CLI**: Full parameter control for professional line art creation