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
   When a request clearly matches a subagent's scope, include an `@agent-name` mention to delegate work.

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

### **Current Algorithm Status**
- ✅ **EdgeDetector**: Production-ready with workspace-optimized edge detection and contour tracing
- ✅ **PathTracer**: Production-ready color quantization and vectorization pipeline  
- ✅ **GeometricFitter**: Production-ready with memory-optimized chunked processing and shape fitting

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
3. ✅ Implemented `GeometricFitter` algorithm with memory optimizations
4. ✅ Basic parameter structs for JS interop

### Phase 1.5: Algorithm Enhancement (**COMPLETED**)
**Goal**: Integrate research-based improvements and performance optimizations
1. ✅ Integrated vtracer wrapper for O(n) performance
2. ⏳ Compile Potrace to WASM for high-quality bi-level tracing
3. ⏳ Compile Autotrace to WASM for centerline support
4. ✅ Implemented advanced pre-processing pipeline (color quantization, speckle removal)
5. ✅ Added Bezier curve fitting infrastructure and path optimization
6. ✅ Implemented WASM SIMD optimizations framework
7. ✅ **PERFORMANCE OPTIMIZATIONS COMPLETED**:
   - **EdgeDetector**: Workspace-optimized with buffer reuse and SIMD support
   - **PathTracer**: Sub-10s performance for complex images (was 622s)
   - **GeometricFitter**: Memory-optimized with chunked processing and budget controls
   - Increased image size limits to 8192×8192 (32MP) with adaptive processing
   - Eliminated all build warnings for clean development
8. ✅ **RESEARCH-BASED IMPROVEMENTS INTEGRATED**:
   - Moore neighborhood contour tracing
   - LAB color space quantization  
   - Median cut color selection
   - Zero-copy memory patterns with workspace buffers
   - Progressive enhancement architecture
9. ✅ **MEMORY MANAGEMENT SYSTEM**:
   - **Status**: All algorithms now production-ready with comprehensive memory monitoring
   - **Features**: 100MB conservative budget, adaptive parameters, chunked processing
   - **Architecture**: Real-time monitoring with warning/critical thresholds
   - **Capabilities**: Automatic quality degradation to prevent memory exhaustion

### Phase 2: Frontend Scaffolding & MVP Integration (**NEXT PHASE**)
**Goal**: Working single-image editor with all optimized algorithms
1. Build UI components: file input, control panel, preview
2. TypeScript/WASM integration layer
3. Complete flow: upload → process → download
4. Integration with memory-aware backend and performance monitoring

### Phase 3: Feature Expansion (**READY FOR IMPLEMENTATION**)
**Goal**: Additional algorithms and multi-image blending
1. ✅ **All core algorithms production-ready**:
   - ✅ `EdgeDetector`: Workspace-optimized edge detection and contour tracing
   - ✅ `PathTracer`: High-performance color vectorization  
   - ✅ `GeometricFitter`: Memory-optimized geometric shape detection
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

Based on state-of-the-art research in image vectorization, the architecture implements a modular four-stage pipeline with comprehensive memory management:

#### Stage 1: Pre-Processing
* **Image Decoding**: Support for PNG, JPEG, WebP, GIF formats
* **Memory-Aware Loading**: Adaptive image size limits based on available memory budget
* **Image Conditioning**: 
  - Noise reduction (median filter, Gaussian blur)
  - Artifact removal (JPEG compression artifacts)
  - Smart scaling (edge-aware upscaling/downscaling)
  - Automatic thresholding (Otsu's method)
* **Color Quantization**: 
  - K-means clustering in LAB color space
  - Octree-based quantization
  - Configurable palette size (2-256 colors, adaptive based on memory)

#### Stage 2: Core Vectorization
* **Multiple Algorithm Support**:
  - **EdgeDetector** (workspace-optimized): High-performance Canny edge detection with buffer reuse
  - **PathTracer** (production-ready): O(n) complexity color vectorization via vtracer integration
  - **GeometricFitter** (memory-optimized): Edge-guided geometric shape detection with chunked processing
  - **Potrace** (via WASM): Gold standard for bi-level images
  - **Autotrace** (via WASM): Centerline tracing for line art
* **Algorithm Selection**:
  - Automatic heuristic-based selection with memory considerations
  - Manual override via UI
  - Per-layer algorithm choice for complex images

#### Advanced Geometric Fitting Architecture (**PRODUCTION-READY**)
* **Edge-Guided Shape Detection**:
  - Real-time Canny edge detection for contour extraction
  - PCA-based rotation analysis for accurate orientation
  - Statistical confidence scoring (only keeps shapes >30% confidence)
  - Intelligent color sampling from original image regions
* **Memory-Optimized Shape Fitting**:
  - **Workspace Pattern**: `ShapeFittingWorkspace` eliminates repeated allocations
  - **Chunked Processing**: Processes 10 contours at a time to control memory usage
  - **Adaptive Limits**: Conservative 50-shape budget with quality-based filtering
  - **Shape Types**: Circles, rectangles, triangles, ellipses with robust fitting algorithms
* **Performance**: 200ms estimated processing time with memory budget controls

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

#### Memory Management System
* **Conservative Budget**: 100MB default limit for mobile browser compatibility
* **Real-Time Monitoring**: Continuous memory usage tracking with warning thresholds
* **Adaptive Processing**: Quality degradation when memory constraints are detected
* **Budget Allocation**:
  - Image buffers: 30MB limit
  - Algorithm workspace: 40MB limit  
  - SVG output: 20MB limit
  - Emergency processing: <10MB fallback mode

#### Zero-Copy Data Transfer
* SharedArrayBuffer for image data
* Direct memory views between JS and WASM
* No serialization overhead
* Workspace buffer reuse patterns

#### Parallelization Strategy
* **Task-Level**: Web Workers for tile-based processing
* **Data-Level**: WASM SIMD for pixel operations
* **Algorithm-Level**: Parallel implementations with memory awareness

### Core WASM Module Interface

```rust
#[wasm_bindgen]
pub struct VectorizationEngine {
    // Persistent engine state with memory monitoring
}

#[wasm_bindgen]
impl VectorizationEngine {
    pub fn new() -> Self;
    pub fn set_memory_budget(budget_mb: u32);
    pub fn set_shared_memory(memory: &SharedArrayBuffer);
    pub fn convert_with_progress(
        params: ConversionParameters,
        on_progress: &js_sys::Function
    ) -> Result<String, JsValue>;
    pub fn get_memory_stats() -> String; // JSON memory statistics
}
```

---

## Performance Benchmarks & Expectations

### Realistic Performance Metrics (January 2025)

Based on comprehensive testing and optimization work, here are evidence-based performance expectations:

#### **Algorithm Performance by Image Size**

**Small Images (< 1 MP)**
- **EdgeDetector**: 5-15ms (workspace-optimized with buffer reuse)
- **PathTracer**: 50-200ms (color quantization and vectorization)
- **GeometricFitter**: 100-300ms (memory-optimized chunked processing)

**Medium Images (1-5 MP)**
- **EdgeDetector**: 15-75ms (scales ~15ms/MP after optimizations)
- **PathTracer**: 200-1000ms (benefits from vtracer integration)
- **GeometricFitter**: 300-1000ms (chunked processing with memory management)

**Large Images (5-15 MP)**
- **EdgeDetector**: 75-225ms (SIMD optimizations maintain linear scaling)
- **PathTracer**: 1-5s (adaptive processing kicks in for memory management)
- **GeometricFitter**: 1-3s (aggressive chunking and shape limits)

#### **Memory Usage Patterns**

**Conservative Memory Budget**: 100MB total allocation
- **Base Image Loading**: 4 bytes/pixel (RGBA)
- **EdgeDetector**: 3.5x image size (magnitude, direction, temp buffers)
- **PathTracer**: 4.0x image size (quantization, contours, paths)
- **GeometricFitter**: 2.5x image size (optimized workspace pattern)

**Adaptive Processing Thresholds**:
- **50-75% usage**: Medium quality (64 colors, simplified parameters)
- **75-90% usage**: Low quality (16 colors, increased simplification)
- **90%+ usage**: Emergency mode (4 colors, minimal processing)

#### **Performance Optimizations Implemented**

1. **Workspace Pattern**: Eliminates repeated memory allocations
   - **EdgeDetectionWorkspace**: Reuses buffers for magnitude, direction, contours
   - **ShapeFittingWorkspace**: Reuses buffers for points, distances, colors

2. **Memory Monitoring**: Real-time budget tracking with adaptive parameters
   - Automatic quality degradation to prevent memory exhaustion
   - Chunked processing for large datasets
   - Emergency fallback processing modes

3. **SIMD Support**: Framework implemented for WebAssembly SIMD128
   - Optimized gradient calculations for edge detection
   - Vectorized color quantization operations

4. **Connected Components**: Optimized contour tracing algorithm
   - Cache-friendly memory access patterns
   - Efficient flood-fill implementation
   - Reduced algorithmic complexity

### **Target Performance Goals**

**Responsive Processing**: 
- Images up to 2MP: < 1 second total processing
- Images up to 8MP: < 5 seconds with progress indicators
- All sizes: Memory-safe processing with graceful degradation

**Browser Compatibility**:
- Mobile browsers: Conservative 100MB memory budget
- Desktop browsers: Enhanced performance with larger budgets
- Progressive enhancement based on browser capabilities

---

## Quick Commands

Use slash commands for common workflows:
* `/setup-project` - Initial project setup with all tools
* `/wasm-build [dev|prod]` - Build WASM module
* `/wasm-test [chrome|firefox]` - Run WASM tests
* `/analyze-wasm` - Analyze binary size
* `/ci-check` - Run all CI checks locally

### Performance Testing Commands (**COMPREHENSIVE SUITE**)
* `test_runner.bat` - ✅ **Full algorithm testing with memory monitoring**
* `cargo test --release` - ✅ **All tests pass with performance optimizations**
* `cargo run --example benchmark` - ✅ **Detailed performance benchmarking**

### Algorithm Status Summary
* **EdgeDetector**: ✅ **Production-ready** with workspace optimizations and SIMD support
* **PathTracer**: ✅ **Production-ready** with sub-10s performance for complex images
* **GeometricFitter**: ✅ **Production-ready** with memory-optimized chunked processing
* **Memory System**: ✅ **Production-ready** with comprehensive budget monitoring and adaptive processing

See `.claude/commands/` for all available commands.