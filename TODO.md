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

> **Status Update (Aug 8, 2025)**: Phase 1 is functionally complete with working algorithms and significant performance optimizations. All three crates are implemented with actual algorithm logic (not placeholders). Logo algorithm has functional but problematic Moore neighborhood contour tracing that causes infinite loops on complex images. Regions algorithm achieved dramatic performance improvements from 50-130s to <1s processing time through optimized k-means and unified preprocessing. CLI is fully functional with proper argument parsing. Ready for Phase 1.5 contour tracing algorithm replacement.

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
- [x] **Algorithms** (functional implementations)
  - [x] **Logo/Line-Art:** threshold → morphology → contour tracing (⚠️ Moore neighborhood infinite loop issues)
  - [x] **Color Regions:** parallel k-means in Lab (K=16–32), optimized from 50-130s to <1s processing
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
- [ ] **Golden SVG** snapshots (diff on PR)
- [ ] SVG validity checks by parsing with `usvg` and rasterizing with `resvg` (smoke tests)
- [x] Determinism: fixed seeds for k-means / sampling
- [x] **Performance benchmarking**: Regions algorithm optimized from 50-130s to <1s

---

## Phase 1.5: Critical Algorithm Fixes 🔧 (Suzuki-Abe Implementation)

> **Priority**: CRITICAL - Must be completed before Phase 2 to ensure production-ready logo algorithm

### Issue Resolution
- [x] **Identified Problem**: Moore neighborhood contour tracing causes infinite loops on complex/real images (300+ warnings)
- [x] **Research Completed**: 4 specialized research agents analyzed alternatives and implementation approaches
- [ ] **Implement Suzuki-Abe**: Replace Moore neighborhood with industry-standard Suzuki-Abe algorithm via `imageproc` crate
- [ ] **Integration Testing**: Verify infinite loop resolution on problematic test cases
- [ ] **Performance Validation**: Ensure Suzuki-Abe maintains or improves performance vs Moore neighborhood
- [ ] **Algorithm Comparison**: Document performance and quality differences between approaches

### Research Findings Summary
- **Suzuki-Abe Algorithm**: Industry standard for contour detection, handles complex topologies, no infinite loop issues
- **imageproc Integration**: `find_contours_with_threshold()` provides direct drop-in replacement
- **Expected Benefits**: Eliminates infinite loops, handles holes correctly, maintains performance
- **Implementation Path**: Replace Moore neighborhood in `algorithms/logo_mode.rs` with imageproc call

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

### Critical Issues
- **Moore Neighborhood Infinite Loops**: Logo algorithm experiences infinite loops on complex real-world images
  - **Symptoms**: 300+ "cannot trace boundary" warnings, processing hangs
  - **Root Cause**: Moore neighborhood algorithm fails on complex topologies
  - **Solution**: Replace with Suzuki-Abe algorithm via imageproc (Phase 1.5)
  - **Status**: Research complete, implementation pending

### Performance Notes
- **Regions Algorithm**: Successfully optimized from 50-130s to <1s processing time
- **Image Standardization**: All images processed at max 512x512 for consistent performance
- **Parallel K-means**: Significant speedup achieved through proper parallelization

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

### Development Priorities
- **Phase 1.5 is CRITICAL**: Must resolve contour tracing infinite loops before proceeding to Phase 2
- **Suzuki-Abe Integration**: Well-researched solution with clear implementation path
- Keep params/data structures identical between native & WASM.
- Document hosting requirements for cross-origin isolation (threads).

### Performance Achievements
- **Regions algorithm**: 50-130s → <1s processing time (50-130x improvement)
- **Unified preprocessing**: Consistent image standardization at 512x512
- **Parallel k-means**: Proper multi-threading implementation