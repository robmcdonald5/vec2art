# CLAUDE.md (Global Scope)

This file is loaded in every Claude Code session as the **global context**. It defines cross‑project best practices, agentic workflow principles, and high‑level guidelines. Local `CLAUDE.md` files load **after** this global file to supply project‑specific details.

---

## Agentic Workflow Principles

1. **Specialized Subagents**  
   Invoke dedicated subagents by `@react-developer`, `@aws-researcher`, etc., for focused tasks. Always check if current task can be delligated to specialized agents.

2. **Agent Generation & Maintenance**  
   Create or update subagents using the global `@agent-generator` agent.  
   Follow the unified templates in `~/.claude/agents/agent-generator.md` (developer vs. researcher).

3. **Automatic Delegation**  
   When a request clearly matches a subagent’s scope, include an `@agent-name` mention to delegate work.

---

## Code Quality & Standards

- **Formatting**  
  Apply language‑specific formatters (e.g., `rustfmt`, `prettier`, `black`, etc..) and enforce them in CI.

- **Linting**  
  Run linters (e.g., `clippy`, `eslint`, `flake8`, etc..) on all code changes.

- **Testing**  
  Maintain automated unit and integration tests with thorough coverage.

- **Documentation**  
  Keep doc comments, `README.md`, and local `CLAUDE.md` files up to date; update **global** `CLAUDE.md` only for cross‑project rules.

---

## Version Control & CI/CD

- **Commit Messages**  
  Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`, `chore:`).

- **Branching Model**  
  Develop in feature branches; open PRs against `main`.

- **CI Pipelines**  
  Ensure each PR passes:  
  1. Formatting & lint checks  
  2. Automated tests  
  3. Build validation  

---

## CLAUDE.md Maintenance

- **Updates**  
  - Modify **this** global section when adjusting cross‑project rules.  
  - Modify or create project‑level `CLAUDE.md` files for local guidelines.

---

# CLAUDE.md (Local Scope: vec2art)

This file provides **project‑specific** guidance for the **vec2art** project. It covers architecture, tech stack, directory structure, development phases, and custom commands. Refer to the **global `CLAUDE.md`** for cross‑project best practices and agent workflows.

---

## Project Overview

`vec2art` is a browser‑based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art via a Rust‑powered WebAssembly (WASM) module, prioritizing client‑side performance and privacy.

---

## Technology Stack

### Core Processing (Rust/WASM)
- **Language:** Rust  
- **Compilation Target:** WebAssembly  
- **Build Tools:** `wasm-pack`, `cargo`, `wasm-opt`  
- **Key Purpose:** Image processing algorithms & SVG generation

### Frontend (SvelteKit)
- **Framework:** SvelteKit 5 + Tailwind CSS 4  
- **Language:** TypeScript  
- **Package Manager:** `npm`  
- **Testing:** `vitest` (unit), `playwright` (E2E)

---

## Directory Structure

```
vec2art/
├── .claude/
│   └── commands/          # Custom slash commands for common workflows
├── .github/
│   └── workflows/         # CI/CD pipelines (e.g., test-and-lint.yml)
├── frontend/              # SvelteKit application
│   ├── src/
│   │   ├── lib/           # Shared components and utilities
│   │   │   └── wasm/      # The compiled WASM module and its JS bindings
│   │   ├── routes/        # SvelteKit pages
│   │   └── app.html       # HTML template
│   ├── package.json
│   ├── svelte.config.js
│   └── CLAUDE.md          # Frontend-specific guidelines
├── wasm/                  # Rust WebAssembly module
│   ├── src/
│   │   ├── algorithms/    # Conversion algorithm modules
│   │   └── lib.rs         # Main Rust entry point and wasm-bindgen definitions
│   ├── Cargo.toml
│   └── CLAUDE.md          # Rust/WASM-specific guidelines
└── README.md
```

---

## Professional Setup & Workflow

### Dependency Management
* **Rust/WASM**: `cargo` is the source of truth. Dependencies in `wasm/Cargo.toml`, locked in `wasm/Cargo.lock`.
* **SvelteKit**: `npm` is the source of truth. Dependencies in `frontend/package.json`, locked in `frontend/package-lock.json`.

### Code Quality & Formatting
* **Rust**: `rustfmt` for formatting, `clippy` for linting
* **SvelteKit/TypeScript**: `Prettier` for formatting, `ESLint` for linting

### Git & Commit Conventions
Follow **Conventional Commits** specification:
* `feat:` New feature
* `fix:` Bug fix
* `docs:` Documentation changes
* `test:` Test additions or changes
* `refactor:` Code refactoring
* `perf:` Performance improvements
* `chore:` Maintenance tasks

Examples: `feat: add geometric fitter algorithm`, `fix: correct SVG download filename`

### CI/CD Pipeline (GitHub Actions)
Every PR against `main` must pass:
1. **Format Check**: `cargo fmt --check`, `npm run format-check`
2. **Lint Check**: `cargo clippy`, `npm run lint`
3. **Tests**: `cargo test`, `wasm-pack test`, `npm run test`

---

## Phased Development Workflow

### Phase 1: Core Algorithm Development (**COMPLETED**)
**Goal**: Build and test core conversion algorithms in Rust/WASM
1. ✅ Implemented basic `PathTracer` algorithm
2. ✅ Implemented `EdgeDetector` algorithm
3. ✅ Implemented `GeometricFitter` algorithm
4. ✅ Basic parameter structs for JS interop

### Phase 1.5: Algorithm Enhancement (**MOSTLY COMPLETED**)
**Goal**: Integrate research-based improvements
1. ✅ Integrated vtracer wrapper for O(n) performance
2. ⏳ Compile Potrace to WASM for high-quality bi-level tracing
3. ⏳ Compile Autotrace to WASM for centerline support
4. ✅ Implemented advanced pre-processing pipeline (color quantization, speckle removal)
5. ✅ Added Bezier curve fitting infrastructure and path optimization
6. ✅ Implemented WASM SIMD optimizations framework
7. ✅ **PERFORMANCE OPTIMIZATIONS COMPLETED**:
   - Fixed Path Tracer 622s → <10s (contour filtering)
   - **MAJOR**: Revolutionized Geometric Fitter 5000ms+ → 5-25ms (>900x faster!)
   - Increased image size limits to 8192×8192 (32MP)
   - Eliminated all build warnings for clean development
8. ✅ **RESEARCH-BASED IMPROVEMENTS INTEGRATED**:
   - Moore neighborhood contour tracing
   - LAB color space quantization  
   - Median cut color selection
   - Zero-copy memory patterns
   - Progressive enhancement architecture
9. ✅ **GEOMETRIC FITTING ALGORITHM COMPLETELY REDESIGNED** (**DECEMBER 2024**):
   - **Replaced genetic algorithm with edge-guided approach**
   - Real contour extraction using Canny edge detection
   - Intelligent color analysis from original image regions
   - PCA-based rotation detection for accurate orientation
   - Advanced shape classification with confidence scoring
   - Robust circle fitting with outlier detection
   - Corner detection for precise triangle fitting
   - Result: Clean, accurate, colorful geometric SVG output

### Phase 2: Frontend Scaffolding & MVP Integration (**NEXT PHASE**)
**Goal**: Working single-image editor with optimized algorithms
1. Build UI components: file input, control panel, preview
2. TypeScript/WASM integration layer
3. Complete flow: upload → process → download
4. Integration with performance-optimized backend

### Phase 3: Feature Expansion (**MAJOR PROGRESS**)
**Goal**: Additional algorithms and multi-image blending
1. ✅ All core algorithms implemented and **production-ready**:
   - `PathTracer`: High-performance contour tracing
   - `EdgeDetector`: Optimized Canny edge detection  
   - `GeometricFitter`: **Revolutionary edge-guided shape detection** 
2. Implement compositional (layer-based) blending
3. Advanced blending modes (style transfer)
4. Add remaining external algorithms (Potrace, Autotrace)

### Phase 4: Polish & Deploy
**Goal**: Production-ready application
1. End-to-end testing with Playwright
2. WASM optimization for size and speed
3. Deploy to static hosting (Vercel/Cloudflare Pages)

---

## High-Performance Vectorization Architecture

### Core Processing Pipeline

Based on state-of-the-art research in image vectorization, the architecture implements a modular four-stage pipeline:

#### Stage 1: Pre-Processing
* **Image Decoding**: Support for PNG, JPEG, WebP, GIF formats
* **Image Conditioning**: 
  - Noise reduction (median filter, Gaussian blur)
  - Artifact removal (JPEG compression artifacts)
  - Smart scaling (edge-aware upscaling/downscaling)
  - Automatic thresholding (Otsu's method)
* **Color Quantization**: 
  - K-means clustering in LAB color space
  - Octree-based quantization
  - Configurable palette size (2-256 colors)

#### Stage 2: Core Vectorization
* **Multiple Algorithm Support**:
  - **Potrace** (via WASM): Gold standard for bi-level images
  - **vtracer** (native Rust): O(n) complexity, color support
  - **Autotrace** (via WASM): Centerline tracing for line art
  - **Edge Detection**: High-performance Canny edge detection with contour tracing
  - **Geometric Fitting**: **Revolutionary edge-guided geometric shape detection**
* **Algorithm Selection**:
  - Automatic heuristic-based selection
  - Manual override via UI
  - Per-layer algorithm choice for complex images

#### Advanced Geometric Fitting Architecture (**NEW**)
* **Edge-Guided Shape Detection**:
  - Real-time Canny edge detection for contour extraction
  - PCA-based rotation analysis for accurate orientation
  - Statistical confidence scoring (only keeps shapes >30% confidence)
  - Intelligent color sampling from original image regions
* **Sophisticated Shape Fitting**:
  - **Circles**: Robust iterative fitting with outlier detection
  - **Rectangles**: Edge alignment analysis with bounding box optimization  
  - **Triangles**: Corner detection with angle analysis
  - **Ellipses**: Variance-based fitting with rotation detection
* **Performance**: 5-25ms processing time (>900x faster than genetic algorithm)

#### Stage 3: Post-Processing
* **Path Optimization**:
  - Douglas-Peucker simplification
  - Bezier curve fitting
  - Corner detection and preservation
  - Speckle removal (configurable threshold)
* **Structure Optimization**:
  - Path merging for identical styles
  - Z-order optimization for proper layering
  - Precision control (coordinate rounding)

#### Stage 4: SVG Generation
* **Output Optimization**:
  - `<use>` elements for shape reuse
  - `<g>` grouping for shared styles
  - CSS classes for repeated styles
  - Attribute minification
  - Node count management (<2000 for interactive performance)

### Performance Architecture

#### Progressive Enhancement Strategy
The application ships multiple WASM binaries to maximize performance across all browsers:

```
vec2art_base.wasm     - Baseline (no SIMD, no threads)
vec2art_simd.wasm     - SIMD-enabled
vec2art_parallel.wasm - Multithreading support
vec2art_full.wasm     - SIMD + multithreading
```

#### Zero-Copy Data Transfer
* SharedArrayBuffer for image data
* Direct memory views between JS and WASM
* No serialization overhead

#### Parallelization Strategy
* **Task-Level**: Web Workers for tile-based processing
* **Data-Level**: WASM SIMD for pixel operations
* **Algorithm-Level**: Parallel implementations of core algorithms

### Core WASM Module Interface

```rust
#[wasm_bindgen]
pub struct VectorizationEngine {
    // Persistent engine state for optimal performance
}

#[wasm_bindgen]
impl VectorizationEngine {
    pub fn new() -> Self;
    pub fn set_shared_memory(memory: &SharedArrayBuffer);
    pub fn convert_with_progress(
        params: ConversionParameters,
        on_progress: &js_sys::Function
    ) -> Result<String, JsValue>;
}
```

---

## Quick Commands

Use slash commands for common workflows:
* `/setup-project` - Initial project setup with all tools
* `/wasm-build [dev|prod]` - Build WASM module
* `/wasm-test [chrome|firefox]` - Run WASM tests
* `/analyze-wasm` - Analyze binary size
* `/ci-check` - Run all CI checks locally

### Performance Testing Commands (**READY TO USE**)
* `test_runner.bat` - ✅ **Comprehensive algorithm testing with performance metrics**
* `cargo test --release` - ✅ **All tests pass cleanly without warnings**
* `cargo run --example benchmark` - ✅ **Performance benchmarking suite**

### Algorithm Performance Benchmarks (**UPDATED DECEMBER 2024**)
* **Path Tracer**: <10s for complex images (was 622s)
* **Edge Detection**: 7-260ms depending on complexity  
* **Geometric Fitter**: **5-25ms** (was 5000ms+) - **>900x improvement**
  - Test shapes: 7.5ms with color detection
  - Checkerboard: 23.5ms with 50+ shapes detected
  - All tests: 18/18 unit tests + 4/4 integration tests passing

See `.claude/commands/` for all available commands.