# WASM + Rust Image → SVG: Tech Plan

> **Goal:** Build a fast, CPU-only image→SVG “creative” vectorizer. Develop as a native Rust crate first; wrap in WASM later for in-browser, user-offloaded processing.

---

## High-Level Architecture

- **`vectorize-core/`** — Pure Rust library with no platform assumptions; all algorithms live here.
- **`vectorize-cli/`** — Local CLI for dev, benchmarking, and snapshot tests (golden SVGs).
- **`vectorize-wasm/`** — Thin wrapper with `wasm-bindgen`; exports simple functions; zero-copy I/O where possible.

---

## Vectorization Modes (Algorithms)

Pick per image or expose as user-selectable “styles.” Each entry lists **What**, **Pros**, **Cons**, and **Use When**.

### 1) Logo / Line-Art (Potrace-style, binary tracing)
- **What:** Binarize → find contours → fit curves → simplify to clean filled paths.
- **Pros:** Very fast; clean paths; tiny SVGs; great for high-contrast art.
- **Cons:** Loses tonal detail; needs decent thresholding; can “fill in” thin features.
- **Use When:** Logos, scans, comics, sketches, black-and-white line art.

### 2) Color Regions (VTracer-style, quantization or superpixels)
- **What:** Reduce colors (quantization **or** superpixels) → region merge → contour → Bézier fit + simplify.
- **Pros:** Captures large shapes and color blocks; visually “posterized”; good for photos & illustrations.
- **Cons:** More CPU; region chatter without smoothing; larger SVGs than binary tracing.
- **Use When:** Posters, photos, illustrations; you want stylized color blobs.

**Color reduction options**
- **Median Cut / Octree**
  - **Pros:** Fast; deterministic; good “first cut.”  
  - **Cons:** Can band; not perceptually optimal.
- **k-means (in Lab)**
  - **Pros:** Better perceptual grouping; tunable K.  
  - **Cons:** Iterative (slower); needs seed & iterations.
- **SLIC Superpixels (+ merge)**
  - **Pros:** Edge-aware; produces coherent regions; easy parallelization.  
  - **Cons:** More parameters; still needs region merging.

### 3) Edge / Centerline (strokes)
- **What:** Edge detect (e.g., Canny) → thinning/skeleton → path follow → Bézier fit.
- **Pros:** “Drawn” look; great for outlines and sketches.
- **Cons:** Gappy edges; small artifacts; tuning-heavy; can explode path count.
- **Use When:** You want strokes/lines instead of filled shapes.

### 4) Stylized: Low-Poly / Stipple / Halftone
- **Low-Poly (Delaunay triangles)**
  - **What:** Sample points → triangulate → color per triangle.  
  - **Pros:** Bold, trendy look; simple SVG (polygons); fast.  
  - **Cons:** Faceted; not “smooth” vector curves.
- **Stipple / TSP Art**
  - **What:** Poisson disk dots sized by tone; optionally order into one path.  
  - **Pros:** Striking print/pen-plotter style; simple primitives.  
  - **Cons:** Many elements; slower ordering if TSP-like.
- **Halftone**
  - **What:** Dots/lines sized by luminance on grids or blue-noise patterns.  
  - **Pros:** Iconic print look; predictable output size.  
  - **Cons:** Moiré risk; parameter-sensitive.

### Curve Simplification & Fitting (common to all modes)
- **Ramer–Douglas–Peucker (RDP)**
  - **Pros:** Simple; fast; good control via ε (pixel tolerance).  
  - **Cons:** Can look angular on organic shapes.
- **Visvalingam–Whyatt (VW)**
  - **Pros:** Often smoother/rounder for the same point count.  
  - **Cons:** Slightly more work; needs careful area thresholds.
- **Cubic Bézier Fitting (piecewise)**
  - **Pros:** Smooth curves; compact SVG paths.  
  - **Cons:** Implementation complexity; needs error control and splitting.

---

## Preprocessing Options (Quality + Speed)

Each item lists **What**, **Pros**, **Cons**, **Use When**.

- **Resize / Downscale (early)**
  - **What:** Cap working size (e.g., long side 1200–1600 px).
  - **Pros:** Massive speedup; reduces noise; smaller SVGs.
  - **Cons:** Loses fine detail if too aggressive.
  - **Use When:** Almost always; re-run at higher res only if needed.

- **Colorspace: sRGB → CIELAB**
  - **What:** Convert before quantization/merging.
  - **Pros:** Perceptually uniform; better color grouping.
  - **Cons:** Minor overhead.
  - **Use When:** Color/regions mode.

- **Edge-Preserving Denoise (bilateral/guided)**
  - **What:** Smooth within regions; preserve edges.
  - **Pros:** Fewer micro-regions; cleaner contours.
  - **Cons:** Extra CPU; parameter tuning.
  - **Use When:** Photos or noisy art before quantization/superpixels.

- **Contrast/Gamma Normalize**
  - **What:** Normalize luminance/contrast.
  - **Pros:** Stabilizes thresholds & K; consistent outputs.
  - **Cons:** Can shift intended mood if heavy-handed.
  - **Use When:** Mixed sources; batch processing.

- **Thresholding (Otsu / Adaptive)**
  - **What:** Pick binarization threshold globally or locally.
  - **Pros:** Robust binarization for line-art.
  - **Cons:** Adaptive is slower; halos if window poorly chosen.
  - **Use When:** Logo/line-art mode.

- **Morphology (open/close)**
  - **What:** Erode/dilate to remove specks or close gaps.
  - **Pros:** Cleans line-art; reduces tiny artifacts.
  - **Cons:** Can fatten/thin lines if overdone.
  - **Use When:** Binary/edge pipelines, especially scans.

- **Connected Components Filter**
  - **What:** Remove tiny blobs below area threshold.
  - **Pros:** Fewer useless paths; smaller SVGs.
  - **Cons:** Risk of deleting desired detail.
  - **Use When:** After segmentation/thresholding.

- **Edge Detection (Canny/Sobel)**
  - **What:** Compute edges for stroke pipelines or to guide merges.
  - **Pros:** Better structure awareness.
  - **Cons:** Extra pass; parameter tuning.
  - **Use When:** Edge/centerline; optional guidance for region boundaries.

---

## Default Pipelines (Good Starting Points)

### A) Logo / Line-Art (fast path)
1. **Grayscale → Otsu threshold**
2. **Morphology** open/close (k=1–2)  
3. **Contour trace** (outer + holes; 8-connected)
4. **Simplify** (RDP ε≈0.5–1.5 px)  
5. **Bézier fit** (piecewise, error-bounded)
6. **SVG emit**: `<path>` (even-odd fill), optional layer by area

### B) Color / Regions (creative)
1. **Downscale** (long side ~1200 px)  
2. **Colorspace** sRGB→Lab; optional **edge-preserving denoise**
3. **Color reduction**:  
   - **k-means (K=16–32)** *or* **SLIC superpixels** (~#px/800), then **merge** small/adjacent regions
4. **Contours** (region labeling → outer/inner boundaries)
5. **Simplify** (VW or RDP, ε≈0.75–2 px)
6. **Bézier fit**; drop regions below **min area** (e.g., 0.1% of image)  
7. **SVG emit**: one `<path>` per region, fill = mean color; draw order by luminance/area

---

## Performance Notes (CPU-Only)

### Native (Rust)
- **Parallelism:** `rayon` for scanline/tiling, region labeling, and per-contour fitting.  
- **SIMD:** Prefer SIMD-friendly loops (SoA layouts); consider WASM-compatible SIMD where possible.  
- **Allocations:** Reuse buffers; preallocate per thread; avoid `Vec` churn in hot loops.  
- **Benchmarks:** `criterion`; run on a fixed corpus (logos, photos, scans).

### WASM (Browser)
- **Threads:** Requires cross-origin isolation (COOP/COEP) to enable `SharedArrayBuffer`; then use `rayon` via web workers.
- **SIMD:** Compile with `+simd128` for filters/quantization speedups.
- **Memory:** Zero-copy handoff (pass `Uint8Array`/`ImageData` into WASM memory once).  
- **Limits:** Cap input size; consider tiling for huge images; provide single-thread fallback.

---

## Output Controls (Keep SVGs Lightweight)
- **Max nodes per path** (split if exceeded).  
- **Min feature area** (drop tiny regions).  
- **Quantize colors** to a palette (optional).  
- **Round path coordinates** (e.g., 2–3 decimals).  
- **Sort draw order** (by area/luminance) to reduce overdraw surprises.

---

## Recommended Crates (CPU-only)
- **Image I/O & basics:** `image`
- **Ops (threshold, morphology, labeling):** `imageproc`
- **Resizing (fast):** `fast_image_resize` or `pic-scale`
- **Parallelism:** `rayon`
- **WASM bindings:** `wasm-bindgen` (+ `wasm-bindgen-rayon` for threads)
- **Simplification:** RDP/VW in `geo` or lightweight polyline libs

---

## Testing & Determinism
- **Snapshot tests:** Golden SVGs per input; diff on PRs.
- **Fixed seeds:** For k-means / sampling to avoid flakey tests.
- **Corpus:** Mixed set (logos/photos/noisy scans); measure runtimes with `criterion`.

---

## Roadmap

- **v0 (CLI)**
  - Logo pipeline + Regions pipeline (k-means)
  - RDP + Bézier fitting; basic SVG emitter
  - Criterion benches; snapshot tests

- **v1 (WASM)**
  - `wasm-bindgen` wrapper
  - Threads + SIMD (with COOP/COEP in docs)
  - In-browser demo (file input → SVG preview/download)

- **v2 (Styles & UX)**
  - Superpixels mode
  - Stylized modes (low-poly, halftone, stipple)
  - Presets, sliders, live preview, export options

---

## Gotchas / Things to Plan For
- **Hosting headers** for WASM threads (COOP/COEP) — plan CDN/host early.
- **Huge images** — enforce caps; offer “High-Res re-run.”
- **Path explosion** — keep min area & ε sane; merge adjacent regions.
- **Fallbacks** — single-thread & no-SIMD paths; smaller K on low-end devices.

--- 

## Good defaults to start
- **Logo:** Otsu → open/close k=1 → RDP ε=1.0 px → Bézier fit  
- **Regions:** max long side=1200 px → Lab → k-means K=24 → drop <0.1% area → VW/RDP ε=1.2 px → Bézier fit
