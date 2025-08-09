# vec2art — Next Steps Report (Algorithms & Implementation Plan)

**Branch:** `algorithms-refinement`  
**Focus:** Push photographic fidelity (when desired) and raise consistency, without sacrificing CPU performance.  
**Authoring target:** This doc is meant to guide Claude Code through concrete, incremental PRs.

---

## 1) Objectives

- **Primary:** Make region-based tracing reliable enough to look “Figma/Illustrator-level” on typical photos/logos *when using a fidelity preset*, while keeping an **artsy preset** available.
- **Secondary:** Introduce an **error-driven refinement loop** to close the perceptual gap against the source, and strengthen **Logo mode** to Potrace-class quality.
- **Constraints:** CPU-only, predictable runtime, simple dependencies, no GPU/ML required.

### Success criteria (measure, don’t guess)
- **Region fidelity mode (photographic-ish):**
  - Median ΔE\* (Lab) between original and rasterized SVG **≤ 6.0** on a 10–20 image test set, with 1024px long edge.
  - SSIM **≥ 0.93** on average (grayscale SSIM is fine).
  - Throughput: **≤ 2.5s** per 1024px image on a modern laptop CPU (single process).
- **Logo mode:**
  - Clean edges (no stair-step jitter), correct hole orientation, correct fills.
  - Text glyphs legible at 3× zoom; corners preserved.
- **Artsy modes:** Subjective, but enable 2–3 stylization presets that are stable and repeatable.

---

## 2) Roadmap (3 Phases)

### Phase A — Segmentation-first Region Tracer (high impact)
1. **Edge-preserving denoise** (guided/bilateral) to kill JPEG noise while keeping edges.
2. **Palette quantization in Lab** (adaptive k-means, with post-merge by ΔE threshold).
3. **Over-segmentation** with **SLIC superpixels** (CPU), then Region Adjacency Graph (RAG).
4. **Graph merges** using a Felzenszwalb-style predicate (strong edges resist, weak edges merge).
5. **Boundary tracing** for merged regions → **cubic Bézier** fitting:
   - Corners locked, curvature-aware splitting, two-stage simplify (DP → least-squares fit).
6. **Fill selection:** Flat fill by default; promote to 2–3 stop **linear/radial gradient** when interior color error stays high.
7. **Presets:** `--preset photo`, `--preset posterized` (fixed palette sizes).

### Phase B — Error-Driven Refinement Loop (quality multiplier)
1. Rasterize current SVG (CPU) to match input resolution.
2. Compute **per-tile error** (ΔE in Lab and/or SSIM). Pick worst tiles.
3. For each worst tile, run a small *local* action:
   - **Add control point** on a nearby path segment if contour drifted.
   - **Split region** along a strong gradient that survived merging.
   - **Upgrade fill** (flat → gradient) or nudge gradient stops.
4. Iterate 1–3 times or until error plateaus. Keep a global time/iteration budget.

### Phase C — Logo Mode Upgrade + Artsy Presets
1. **Logo mode:**
   - Adaptive binarization (Otsu per-tile / Sauvola), morphological cleanup.
   - Potrace-like path following; enforce consistent path orientation (outer vs holes).
   - **Primitive replacement:** long near-lines → perfect lines; near-circular arcs → true arcs/ellipses.
2. **Artsy presets:**
   - **Low-poly** (Delaunay + color triangles).
   - **Posterize trace** (8–24 fixed colors → region trace).
   - **Hatching/contour overlay** from gradient orientation; semi-transparent strokes on top of fills.

---

## 3) Proposed Module Layout (Rust)

```
src/
  preprocessing/
    mod.rs
    denoise.rs          // bilateral/guided filter
    colorspace.rs       // RGB↔Lab, ΔE
    quantize.rs         // adaptive k-means in Lab + post-merge by ΔE
  segmentation/
    mod.rs
    slic.rs             // SLIC superpixels (CPU)
    rag.rs              // Region adjacency graph build + merges (FH-like)
  tracing/
    mod.rs
    boundary.rs         // region boundary extraction (outer + holes)
    fit.rs              // DP simplify + least-squares cubic Bézier fit
    corners.rs          // corner detection + locking
  fills/
    mod.rs
    flat.rs             // mean Lab as flat fill
    gradients.rs        // choose linear/radial, 2–3 stop estimation
  refine/
    mod.rs
    rasterize.rs        // resvg/tiny-skia raster back-end
    error.rs            // tile ΔE/SSIM compute
    actions.rs          // add_ctrl_point|split_region|upgrade_fill
    loop.rs             // iteration control & budgets
  logo/
    mod.rs
    binarize.rs         // Otsu/Sauvola per tile
    morph.rs            // open/close cleanup
    potrace_like.rs     // curve follow; orientation & primitive swap
  cli/
    mod.rs
    presets.rs          // photo|posterized|logo|lowpoly
  svg/
    mod.rs              // path/gradient emit; grouping; stats
```

### Key traits / interfaces

```rust
pub trait Stage<I, O> {
    fn run(&self, input: &I) -> O;
}

pub struct Pipeline {
    preprocess: PreprocessConfig,
    segment: SegmentConfig,
    trace: TraceConfig,
    fill: FillConfig,
    refine: RefineConfig,
}

impl Pipeline {
    pub fn run(&self, img: &RgbaImage) -> SvgDoc { /* orchestrate phases */ }
}
```

---

## 4) Algorithms & Heuristics (concise specs)

### 4.1 Preprocess
- **Denoise:** Guided filter (r=2–4, ε≈(0.01–0.04)²) or bilateral (σ_s≈2–3, σ_r≈8–12).
- **Palette:** k-means in **Lab** with k_start=48 (photo) / 16 (posterized).
  - Post-merge clusters with ΔE\*ab < **2.0–3.0**.
  - Palette size caps: photo ≤ 40, posterized = user value (8–24).

### 4.2 Over-segmentation & merges
- **SLIC:** region size ≈ 16–24 px; compactness ≈ 10–20.
- **RAG merges:** Edge weight = max gradient magnitude across boundary; prefer merges where interior ΔE drops and boundary gradient is weak.
- Stop when global #regions ≤ target (e.g., **800** for photo at 1024px) or merges no longer decrease total interior error.

### 4.3 Tracing & cubic Bézier fitting
- **Boundary tracing:** extract outer ring + holes; ensure consistent winding.
- **Simplify:** Douglas–Peucker with **ε_dp** in pixels (e.g., 1.2–1.8 at 1024px).
- **Fit:** least-squares cubic per segment, lock corners (angle change > θ_c, e.g., 45°).  
  - Limit **max curvature change** per segment to avoid wobble.  
  - Snap near-lines to straight, near-circular arcs to arc primitives if desired.

### 4.4 Fill estimation
- **Flat fill:** region mean in Lab → convert to sRGB.
- **Gradient promotion:** if interior ΔE (flat) > **5.0**, try linear gradient:
  - Axis = principal component of region pixels; two or three stops at quantiles (10–50–90% along axis).
  - If linear fails to reduce ΔE below **3.5**, try radial gradient centered at region centroid ± offset along PC1.

### 4.5 Error-driven refinement (Phase B)
- **Rasterize** current SVG to original resolution (use `resvg` or `tiny-skia` bindings).
- **Error map:** compute ΔE per pixel in tiles of 32×32; also SSIM per tile in grayscale.
- **Select worst k tiles** (e.g., top 1–3% by ΔE or SSIM < 0.85). For each:
  - If boundary deviation high → **add control point** on nearest segment.
  - If strong gradient crosses interior → **split region** along seam (shortest path in gradient field).
  - If color residual smooth → **upgrade/adjust gradient** (endpoints + stops).
- **Budget:** max 2–3 global iterations or **≤ 600 ms** refine time.

### 4.6 Logo mode (Phase C)
- **Binarize:** Otsu globally + tile override (64×64) via Sauvola to protect thin strokes.
- **Morph:** open/close with 3×3 SE for speckle cleanup.
- **Path follow:** Potrace-like; ensure consistent outer/inner winding; simplify as above.
- **Primitive swap:** RANSAC-fit for long lines; circular arc fit for long smooth turns.
- **Output:** solid fills only, optional global palette of 2–4 colors for brand marks.

---

## 5) CLI & Configuration

### New presets
```
--preset photo           # segmentation-first + gradients + refine loop (default)
--preset posterized      # fixed palette → region trace (stylized)
--preset logo            # binarize + potrace-like with primitive swap
--preset lowpoly         # Delaunay triangulation mode
```

### Useful knobs
```
--max-palette <int>          # cap after ΔE merges (photo default: 40)
--slic-size <px>             # superpixel nominal size (default: 20)
--regions-target <int>       # stop merging near this count (default: 800)
--dp-epsilon <px>            # Douglas–Peucker tolerance (default: 1.5)
--corner-angle <deg>         # corner lock threshold (default: 45)
--gradient-promote-dE <f32>  # threshold to try gradients (default: 5.0)
--refine-iters <int>         # max refinement iterations (default: 2)
--refine-budget-ms <int>     # time cap for refinement (default: 600)
```

---

## 6) Benchmarks & Test Corpus

### Corpus
Create `assets/testset/` with ~20 images:
- 6 photos with edges, textures, soft gradients (portraits, signage, product shots).
- 6 icons/logos with text and sharp corners.
- 4 noisy/compressed web images.
- 4 “artsy” illustrations.

### Metrics & harness
- **ΔE\*ab:** average & median per image (requires RGB→Lab).  
- **SSIM (grayscale):** average per image.  
- **Runtime:** wall-clock per stage; total time.  
- **SVG stats:** #paths, avg control points/path, #gradients.

#### Sketch (Rust) for harness structure
```rust
pub struct Metrics { /* dE, ssim, runtime, svg_stats */ }

fn evaluate(image_path: &Path, preset: Preset) -> Metrics {
    let img = load_image(image_path);
    let start = Instant::now();
    let svg = Pipeline::from_preset(preset).run(&img);
    let t_svg = start.elapsed();

    let rast = rasterize_svg(&svg, img.width(), img.height());
    let de = delta_e_map(&img, &rast).summary();
    let ssim = grayscale_ssim(&img, &rast);
    let stats = svg_stats(&svg);

    Metrics { /* fill */ }
}
```

---

## 7) Performance Notes (CPU)

- **SLIC:** O(N) per iteration; 5–10 iters typical; tile the image to keep cache-friendly.
- **RAG merges:** Use a priority queue keyed by “merge gain”; lazy updates.
- **Bilateral/guided:** Small radius to keep cost down; guided filter is fast & edge-aware.
- **Gradient fills:** At most 2–3 stops; gradients are cheap at raster time, avoid many per region.
- **Refinement loop:** Limit tiles and iterations; keep local edits only.

---

## 8) Risks & Mitigations

- **Over-segmentation leading to heavy SVGs:** Guard with `regions_target` and gradient promotion to reduce geometric detail.
- **Gradient banding in sRGB:** Estimate in Lab, **dither** stops slightly on emit if necessary.
- **Runtime creep:** Stage timers + budgets; auto-dial down palette/regions when hitting time caps.
- **Logo text breakup:** Increase tile contrast in binarization near detected text lines; protect thin strokes.

---

## 9) Deliverables per Phase

### Phase A (PR: `seg-first-tracer`)
- New `preprocessing/`, `segmentation/`, `tracing/`, `fills/` modules.
- `--preset photo` and `--preset posterized` exposed in CLI.
- Bench harness with ΔE + SSIM + runtime.
- Before/after gallery for test set.

### Phase B (PR: `refine-loop`)
- `refine/` modules and integration.
- CLI knobs `--refine-iters`, `--refine-budget-ms`.
- Metrics report showing ΔE/SSIM gains vs Phase A.

### Phase C (PR: `logo-upgrade` and `artsy-modes`)
- Logo binarization + Potrace-like tracer with primitive swap.
- `--preset logo`, `--preset lowpoly`; hatching overlay (optional).
- Gallery & metrics (where applicable).

---

## 10) Quick Implementation Checklist

- [ ] Add Lab colorspace + ΔE utilities.
- [ ] Implement guided filter (or bilateral) with small radius.
- [ ] Adaptive k-means palette + ΔE post-merge.
- [ ] SLIC superpixels; expose `--slic-size`.
- [ ] Build RAG; implement Felzenszwalb-like merges with a gain function.
- [ ] Boundary extraction with outer/holes and winding fixup.
- [ ] DP simplify + least-squares cubic Bézier fit; corner lock + curvature guard.
- [ ] Flat fill + gradient estimation heuristics.
- [ ] `resvg`/`tiny-skia` raster backend wrapper.
- [ ] Tile error map (ΔE + optional SSIM); pick worst tiles.
- [ ] Local refine actions (add ctrl pt / split / upgrade fill) + loop budget.
- [ ] Logo mode: binarize, morph, potrace-like follow, primitive swap.
- [ ] CLI presets & knobs; docs and examples.
- [ ] Benchmark harness + sample results JSON/CSV.

---

## 11) Appendix — Notes & Pointers

- **Colorspace:** Perform palette selection and merges in **Lab**; emit sRGB.
- **Gradients:** Linear axis via PCA of region pixels; stops at color quantiles.
- **Arcs & lines:** Use RANSAC fit with residual threshold tied to image scale.
- **Tiling:** 32×32 or 48×48 tiles are a good balance for refinement targeting.
- **Determinism:** Seed k-means & SLIC; stable unit tests rely on it.

---

### Suggested next PR for Claude Code to open

> **Title:** Phase A — Segmentation-first region tracer (core modules + photo/posterized presets)  
> **Summary:** Introduce preprocessing, SLIC+RAG segmentation, cubic Bézier boundary fitting, and basic flat/gradient fills; add CLI presets and a small benchmark harness with ΔE/SSIM/runtime.

