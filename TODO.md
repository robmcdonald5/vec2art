# TODO.md

## Project: vec2art - Image to SVG Converter

This document tracks the ongoing development tasks for the vec2art project, a high-performance browser-based tool that converts raster images to stylized SVG art using Rust/WASM.

---

## Completed Tasks ✅

### Project Setup & Documentation
- [x] Review initial research document for image-to-SVG conversion architecture
- [x] Update root CLAUDE.md with high-level architecture overview
- [x] Update wasm/CLAUDE.md with Rust/WASM implementation guidelines
- [x] Update frontend/CLAUDE.md with SvelteKit 5 frontend specifications
- [x] Create TODO.md for project task tracking

---

## Phase 1: Native Core Development 🚧

### Core Infrastructure
- [ ] Set up Rust project structure with workspace configuration
- [ ] Create `vectorize-core` library crate
- [ ] Create `vectorize-cli` binary crate for testing
- [ ] Set up basic CI/CD pipeline with GitHub Actions

### Image Processing Foundation
- [ ] Implement image loading with `image` crate
- [ ] Add basic preprocessing (resize, grayscale conversion)
- [ ] Implement colorspace conversions (sRGB ↔ CIELAB)

### Algorithm Implementation - Logo/Line-Art Mode
- [ ] Implement Otsu thresholding for binarization
- [ ] Add morphological operations (open/close)
- [ ] Implement contour tracing algorithm
- [ ] Add connected components filtering

### Algorithm Implementation - Color Regions Mode
- [ ] Implement k-means color quantization
- [ ] Add median cut quantization as alternative
- [ ] Implement region labeling and merging
- [ ] Add SLIC superpixels (optional enhancement)

### Algorithm Implementation - Edge/Centerline Mode
- [ ] Implement Canny edge detection
- [ ] Add edge thinning/skeletonization
- [ ] Implement centerline extraction

### Path Optimization
- [ ] Implement Ramer-Douglas-Peucker (RDP) simplification
- [ ] Add Visvalingam-Whyatt simplification
- [ ] Implement piecewise cubic Bézier fitting
- [ ] Add error-bounded curve fitting

### SVG Generation
- [ ] Create SVG builder module
- [ ] Implement path optimization (coordinate rounding, node limits)
- [ ] Add draw order sorting algorithms
- [ ] Implement SVG output with configurable options

### Testing & Benchmarking
- [ ] Set up golden SVG snapshot tests
- [ ] Add unit tests for each algorithm
- [ ] Implement criterion benchmarks
- [ ] Create test image corpus (logos, photos, line art)

---

## Phase 2: WASM Integration 🔮

### WASM Setup
- [ ] Create `vectorize-wasm` crate with wasm-bindgen
- [ ] Set up wasm-pack build configuration
- [ ] Implement JavaScript bindings for core functions
- [ ] Add TypeScript definitions generation

### Performance Optimization
- [ ] Implement zero-copy memory management
- [ ] Add SIMD support (+simd128 target feature)
- [ ] Implement Web Worker integration
- [ ] Add multi-threading support with SharedArrayBuffer

### Browser Compatibility
- [ ] Create single-threaded fallback
- [ ] Implement progressive processing for large images
- [ ] Add memory usage monitoring and limits
- [ ] Test across major browsers

---

## Phase 3: Frontend Development 🎨

### Project Setup
- [ ] Initialize SvelteKit 5 project
- [ ] Configure Tailwind CSS 4
- [ ] Set up TypeScript with strict mode
- [ ] Configure Vite for WASM loading

### Core UI Components
- [ ] Create image upload component (drag & drop)
- [ ] Implement SVG preview with pan/zoom
- [ ] Add algorithm selection UI
- [ ] Create parameter adjustment controls

### WASM Integration
- [ ] Implement WASM module loader
- [ ] Add Web Worker wrapper for processing
- [ ] Create progress tracking system
- [ ] Handle COOP/COEP headers configuration

### User Experience
- [ ] Add real-time preview updates
- [ ] Implement batch processing support
- [ ] Create export options UI
- [ ] Add dark mode support

### Testing
- [ ] Set up Vitest for unit tests
- [ ] Configure Playwright for E2E tests
- [ ] Add accessibility testing
- [ ] Implement visual regression tests

---

## Phase 4: Enhancement & Optimization 🚀

### Stylized Modes
- [ ] Implement low-poly (Delaunay) mode
- [ ] Add stipple/dot art mode
- [ ] Create halftone pattern mode
- [ ] Add artistic filter combinations

### Advanced Features
- [ ] Add preset configurations
- [ ] Implement undo/redo functionality
- [ ] Create comparison view (before/after)
- [ ] Add batch processing with queue

### Performance Improvements
- [ ] Profile and optimize hot paths
- [ ] Implement adaptive quality settings
- [ ] Add GPU acceleration (optional)
- [ ] Optimize WASM bundle size

### Documentation & Deployment
- [ ] Write comprehensive API documentation
- [ ] Create user guide with examples
- [ ] Set up demo site with examples
- [ ] Configure production deployment

---

## Known Issues & Bugs 🐛

_No issues reported yet_

---

## Future Considerations 💭

- Machine learning-based vectorization
- Plugin system for custom algorithms
- Desktop application via Tauri
- Cloud processing option for large files
- Integration with design tools (Figma, Adobe)

---

## Notes

- Priority: Phase 1 (Native Core) is highest priority
- Testing: Each phase should include comprehensive testing
- Documentation: Update CLAUDE.md files as architecture evolves
- Performance: Regular benchmarking to prevent regressions

---

_Last Updated: [Current Date]_