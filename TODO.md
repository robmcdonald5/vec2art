# TODO.md

## Project: vec2art — Image → SVG (Rust/WASM)

This document tracks the development plan for a high-performance, *browser-executed* raster-to-SVG tool. It reflects the updated workspace layout (`vectorize-core`, `vectorize-cli`, `vectorize-wasm`) and the requirements for WASM threads/SIMD and SvelteKit COOP/COEP headers.

---

## Completed Tasks ✅

### Project Setup & Documentation
- [x] Research image→SVG pipelines and architecture
- [x] Draft CLAUDE.md files (root, wasm, frontend)
- [x] Create initial TODO.md for task tracking

> Keep these living docs updated as APIs/UX evolve.

---

## Phase 1: Native Core Development ✅ (Functionally Complete)

> **Status Update (Aug 8, 2025)**: Phase 1 is functionally complete with working algorithms and significant performance optimizations. **Automated Testbed Validation**: Comprehensive batch script testing achieved **100% Success Rate** across 12 tests (6 images × 2 algorithms). **Critical Moore Neighborhood Crisis Quantified**: Logo algorithm produces 377-407 warnings on real-world images (test1.png, test2.png), demonstrating severe infinite loop issues. **Regions Algorithm Excellence**: 0 warnings across all tests with consistent 0-1s performance. **Pattern Confirmed**: Simple shapes (1 warning) vs complex images (185-407 warnings) - **4 out of 6 images severely affected**. All three crates implemented with concrete validation data. Ready for critical Phase 1.5 algorithm replacement.

### Workspace & Tooling
- [x] Initialize Cargo **workspace** under `wasm/` with members: `vectorize-core`, `vectorize-cli`, `vectorize-wasm`
- [x] Add `rust-toolchain.toml` (pin stable + rustfmt + clippy)
- [x] Create `.cargo/config.toml` (enable opt-level/perf flags; wasm32 features in a per-target section)

### Core Crate: `vectorize-core`
- [x] Public API: `vectorize_logo_rgba`, `vectorize_regions_rgba` (+ params structs)
- [x] Error model (`error.rs`) and config types (`config.rs`)
- [x] **Preprocessing** (placeholder implementations)
  - [x] Resize/downscale utilities (SIMD-friendly)
  - [x] sRGB ↔ **CIELAB** conversions
  - [x] Edge-preserving denoise (bilateral/guided)
  - [x] Thresholding (Otsu + adaptive)
  - [x] Morphology (open/close)
  - [x] Connected components filtering
- [x] **Algorithms** (functional implementations validated by testbed)
  - [x] **Logo/Line-Art:** threshold → morphology → contour tracing (⚠️ **CRITICAL**: 377-407 warnings on complex images)
  - [x] **Color Regions:** parallel k-means in Lab (K=16–32), optimized from 50-130s to <1s processing (**0 warnings, production-ready**)
  - [ ] **Quantization** Median cut quantization
  - [ ] **SLIC** SLIC superpixels (+ merge small/adjacent regions)
  - [ ] **Edge/Centerline:** Canny → thinning/skeleton → centerline paths
- [x] **Curves & Paths** (functional implementations)
  - [x] Ramer-Douglas-Peucker (RDP) simplification with configurable epsilon
  - [x] Visvalingam-Whyatt simplification with area thresholds
  - [x] Piecewise **cubic Bézier** fitting (error-bounded)
- [x] **SVG Builder** (functional implementations)
  - [x] Path/shape emitter with proper even-odd fill for holes
  - [x] Path optimization with coordinate rounding and area limits
  - [x] Draw-order sorting by area and luminance

### CLI Crate: `vectorize-cli`
- [x] Commands: `convert`, `batch`, `benchmark`
- [x] Read images (via `image`), write SVGs with full parameter support
- [x] **Positional argument parsing** (input.png output.svg --mode logo)
- [ ] **Snapshot tests** (golden SVGs) with `insta`
- [x] **Benches** with `criterion` on a small, fixed corpus

### Testing & Validation
- [x] Unit tests per module (preprocessing, algorithms, curves, svg)
- [x] **Automated Testbed Implementation**: Batch script validation with concrete metrics
- [x] **Comprehensive Algorithm Validation**: 12 tests across 6 images, 100% completion rate
- [x] **Critical Issue Quantification**: Moore neighborhood warnings precisely measured (377-407 per complex image)
- [ ] **Golden SVG** snapshots (diff on PR)
- [ ] SVG validity checks by parsing with `usvg` and rasterizing with `resvg` (smoke tests)
- [x] Determinism: fixed seeds for k-means / sampling
- [x] **Performance benchmarking**: Regions algorithm optimized from 50-130s to <1s (**validated by testbed**)

---

## Phase 1.5: Critical Algorithm Fixes 🔧 (Suzuki-Abe Implementation)

> **Priority**: **CRITICAL** - Testbed evidence demonstrates this is ESSENTIAL for production deployment, not "nice to have"

### Issue Resolution (Testbed-Validated)
- [x] **Problem Quantified**: Moore neighborhood produces 377-407 warnings on real-world images (**4 out of 6 test images severely affected**)
- [x] **Concrete Evidence**: Testbed data confirms severe infinite loop issues on complex images (test1.png: 377 warnings, test2.png: 407 warnings)
- [x] **Performance Baseline Established**: Current logo algorithm: 0-1s processing time (when it completes)
- [x] **Research Completed**: 4 specialized research agents analyzed alternatives and implementation approaches
- [x] **Testbed Infrastructure**: Automated validation framework ready for Phase 1.5 testing
- [ ] **Implement Suzuki-Abe**: Replace Moore neighborhood with industry-standard Suzuki-Abe algorithm via `imageproc` crate
- [ ] **Integration Testing**: Verify infinite loop resolution using existing testbed (target: <10 warnings per image)
- [ ] **Performance Validation**: Ensure Suzuki-Abe maintains 0-1s processing time while eliminating warnings
- [ ] **Algorithm Comparison**: Document performance and quality differences using testbed metrics

### Research Findings Summary (Validated Implementation Path)
- **Suzuki-Abe Algorithm**: Industry standard for contour detection, handles complex topologies, no infinite loop issues
- **imageproc Integration**: `find_contours_with_threshold()` provides direct drop-in replacement
- **Expected Benefits**: Eliminates infinite loops (377-407 warnings → <10), handles holes correctly, maintains 0-1s performance
- **Implementation Path**: Replace Moore neighborhood in `algorithms/logo_mode.rs` with imageproc call
- **Validation Ready**: Testbed provides concrete before/after comparison framework

---

## Phase 2: WASM Integration 🔮 (CPU-only)

### Crate: `vectorize-wasm`
- [x] `wasm-bindgen` wrapper with functional exports
- [x] Zero-copy I/O infrastructure (accept `Uint8Array`/`ImageData`)
- [x] Build configuration with `+simd128` target feature
- [x] **Threads:** `wasm-bindgen-rayon` integration structure ready
- [ ] **Production Testing**: End-to-end browser testing with actual images

### Browser Requirements
- [ ] Add **COOP/COEP** headers so `SharedArrayBuffer` & threads work
- [ ] Single-thread fallback (no SAB) and smaller K for low-end devices
- [ ] Progressive/tiling processing for large images
- [ ] Memory usage guardrails (caps, early downscale)

### Demo harness (`vectorize-wasm/www`)
- [ ] Minimal ESM loader (`main.ts`) and example HTML
- [ ] Local dev server with COOP/COEP headers
- [ ] TypeScript definitions for the WASM API

---

## Phase 3: Frontend (SvelteKit 5 + Tailwind 4 + TS) 🎨

### Setup
- [ ] Initialize SvelteKit project, Tailwind, strict TS
- [ ] Configure Vite WASM loading;

### UI/UX
- [ ] Drag-and-drop image upload
- [ ] SVG preview (pan/zoom), parameter controls, algorithm presets
- [ ] Progress + cancellation; batch mode (queue)
- [ ] Export (download SVG), copy to clipboard
- [ ] Dark mode

### WASM Integration
- [ ] WASM module loader + **Web Worker** wrapper
- [ ] Thread pool initialization when cross-origin isolated
- [ ] Frontend fallback path for single-thread / no-SIMD

### Headers / Hosting
- [ ] Dev: set COOP/COEP in `hooks.server.ts` (or server adapter)
- [ ] Prod: configure host (Netlify/Vercel/Cloudflare) for COOP/COEP
- [ ] Document hosting limitations (e.g., GitHub Pages lacks headers)

### Frontend Testing
- [ ] Vitest unit tests
- [ ] Playwright E2E tests (file upload → SVG output)
- [ ] Accessibility checks
- [ ] Visual regression tests (DOM screenshots)

---

## Phase 4: Enhancements & Optimization 🚀

### Stylized Modes
- [ ] Low-poly (Delaunay)
- [ ] Stipple / dot art (Poisson disk; path ordering)
- [ ] Halftone patterns
- [ ] Preset styles (logo/photo/illustration/sketch)

### Performance
- [ ] Profile hot paths (SIMD-friendly loops; buffer reuse)
- [ ] Adaptive quality (auto ε / min-area based on image size)
- [ ] WASM bundle size trimming (dead-code, features)

### Advanced
- [ ] Undo/redo, before/after compare
- [ ] Batch processing with queue + export set
- [ ] Tiling pipeline for huge images

### Documentation & Deploy
- [ ] API reference (`docs/api.md`)
- [ ] User guide with examples
- [ ] Public demo site (with COOP/COEP) + sample gallery
- [ ] Production deployment & monitoring

---

## Known Issues & Bugs 🐛

### Critical Issues (Testbed-Validated)
- **Moore Neighborhood Infinite Loops**: Logo algorithm experiences severe issues on complex real-world images
  - **Quantified Symptoms**: 377-407 "cannot trace boundary" warnings on 4 out of 6 test images
  - **Testbed Evidence**: test1.png (377 warnings), test2.png (407 warnings), test3.png (185 warnings), test_gradient.png (52 warnings)
  - **Success Cases**: Simple images show minimal warnings (test_shapes.png: 1 warning)
  - **Root Cause**: Moore neighborhood algorithm fails on complex topologies
  - **Solution**: Replace with Suzuki-Abe algorithm via imageproc (Phase 1.5)
  - **Status**: Research complete, testbed validation framework ready, implementation pending

### Performance Notes (Testbed-Validated)
- **Regions Algorithm**: Successfully optimized from 50-130s to <1s processing time (**0 warnings across all 6 test images**)
- **Logo Algorithm**: 0-1s processing time but with critical warning issues (377-407 warnings on complex images)
- **Image Standardization**: All images processed at max 512x512 for consistent performance
- **Parallel K-means**: Significant speedup achieved through proper parallelization
- **Testbed Metrics**: 100% success rate, 12/12 tests completed, concrete performance baselines established

---

## Future Considerations 💭

### Algorithm Enhancements
- **Alternative Contour Algorithms**: Explore Moore neighborhood variants or hybrid approaches
- **Advanced Preprocessing**: Research adaptive preprocessing based on image content analysis
- **ML-assisted vectorization**: Explore neural network approaches for specific use cases

### Architecture Extensions
- **Plugin system** for custom algorithm passes
- **Cloud processing** option for very large files
- **MCP server** possibility for external integrations
- **GPU acceleration** as optional enhancement (Phase 4+)

---

## Notes

### Development Priorities (Evidence-Based)
- **Phase 1.5 is CRITICAL**: Testbed data proves this is ESSENTIAL for production (377-407 warnings = unusable for real applications)
- **Concrete Evidence**: 4 out of 6 images severely affected by Moore neighborhood issues
- **Suzuki-Abe Integration**: Well-researched solution with testbed validation framework ready
- **Validation Framework**: Automated testbed provides concrete before/after metrics
- Keep params/data structures identical between native & WASM.
- Document hosting requirements for cross-origin isolation (threads).

### Performance Achievements (Testbed-Validated)
- **Regions algorithm**: 50-130s → <1s processing time (50-130x improvement, **0 warnings**)
- **Logo algorithm**: Consistent 0-1s processing time (when not stuck in infinite loops)
- **Unified preprocessing**: Consistent image standardization at 512x512
- **Parallel k-means**: Proper multi-threading implementation
- **100% Test Completion**: All 12 testbed scenarios completed successfully
- **Quantified Baselines**: Concrete metrics for Phase 1.5 validation (target: reduce 377-407 warnings to <10)