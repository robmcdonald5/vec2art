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

## Phase 1: Native Core Development 🚧 (Highest Priority)

### Workspace & Tooling
- [ ] Initialize Cargo **workspace** under `wasm/` with members: `vectorize-core`, `vectorize-cli`, `vectorize-wasm`
- [ ] Add `rust-toolchain.toml` (pin stable + rustfmt + clippy)
- [ ] Create `.cargo/config.toml` (enable opt-level/perf flags; wasm32 features in a per-target section)

### Core Crate: `vectorize-core`
- [ ] Public API: `vectorize_logo_rgba`, `vectorize_regions_rgba` (+ params structs)
- [ ] Error model (`error.rs`) and config types (`config.rs`)
- [ ] **Preprocessing**
  - [ ] Resize/downscale utilities (SIMD-friendly)
  - [ ] sRGB ↔ **CIELAB** conversions
  - [ ] Edge-preserving denoise (bilateral/guided)
  - [ ] Thresholding (Otsu + adaptive)
  - [ ] Morphology (open/close)
  - [ ] Connected components filtering
- [ ] **Algorithms**
  - [ ] **Logo/Line-Art:** threshold → morphology → contour tracing
  - [ ] **Color Regions:** k-means in Lab (K=16–32), region labeling/merging
  - [ ] **Quantization** Median cut quantization
  - [ ] **SLIC** SLIC superpixels (+ merge small/adjacent regions)
  - [ ] **Edge/Centerline:** Canny → thinning/skeleton → centerline paths
- [ ] **Curves & Paths**
  - [ ] Ramer-Douglas-Peucker (RDP) simplification
  - [ ] Visvalingam-Whyatt simplification
  - [ ] Piecewise **cubic Bézier** fitting (error-bounded)
- [ ] **SVG Builder**
  - [ ] Path/shape emitter; even-odd fill for holes
  - [ ] Path optimization (coordinate rounding, node/area limits)
  - [ ] Draw-order sorting (area/luminance)

### CLI Crate: `vectorize-cli`
- [ ] Commands: `convert`, `batch`, `benchmark`
- [ ] Read images (via `image`), write SVGs; configurable params
- [ ] **Snapshot tests** (golden SVGs) with `insta`
- [ ] **Benches** with `criterion` on a small, fixed corpus

### Testing & Validation
- [ ] Unit tests per module (preprocessing, algorithms, curves, svg)
- [ ] **Golden SVG** snapshots (diff on PR)
- [ ] SVG validity checks by parsing with `usvg` and rasterizing with `resvg` (smoke tests)
- [ ] Determinism: fixed seeds for k-means / sampling

---

## Phase 2: WASM Integration 🔮 (CPU-only)

### Crate: `vectorize-wasm`
- [ ] `wasm-bindgen` wrapper (export minimal functions)
- [ ] Zero-copy I/O (accept `Uint8Array`/`ImageData` memory view once)
- [ ] Build with `+simd128` target feature (when available)
- [ ] **Threads:** integrate `wasm-bindgen-rayon` and thread-pool init

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

- _None recorded yet_

---

## Future Considerations 💭

- ML-assisted vectorization
- Plugin system for custom passes
- Cloud processing option for very large files
- MCP server possibility

---

## Notes

- Prioritize **Phase 1** for stable, fast algorithms before WASM polish.
- Keep params/data structures identical between native & WASM.
- Document hosting requirements for cross-origin isolation (threads).