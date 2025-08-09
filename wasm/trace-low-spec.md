# vec2art — **Low‑Detail Tracing** (`--mode trace-low`) SPEC

**Purpose:** Add a fast, low-detail “tracing” mode that intentionally produces sparse SVGs.  
**Deliverable:** One new CLI mode `trace-low` with 3 backends (`edge`, `centerline`, `superpixel`) and a single `--detail` slider controlling simplification/abstraction.

---

## 1) User Interface

```bash
vectorize-cli --mode trace-low \
  --backend edge|centerline|superpixel \
  --detail 0..1 \
  [--seed 0] [--stats out.csv]
```

- `--detail d∈[0..1]` = 0 (very sparse) … 1 (more detail).  
- Output:
  - `edge`, `centerline` → **stroke-only** `<path fill="none" stroke="...">`
  - `superpixel` → **filled regions** with optional border strokes
- Z‑order: background first, then **small → large**.

---

## 2) Global Knob Mapping (from `detail`)

Let `diag = sqrt(w² + h²)` in **pixels**. Map one slider to all important thresholds:

```text
DP epsilon (px):         eps = (0.003 + 0.012*d) * diag
Prune short strokes:     min_len = 10 + 40*d            (px)
Canny high threshold:    th_hi = 0.15 + 0.20*d          (normalized gradient)
Canny low threshold:     th_lo = 0.4 * th_hi
Centerline branch prune: min_branch = 12 + 36*d         (px)
SLIC cell size:          cell_px = 600 + 2400*d         (px per superpixel)
SLIC iterations:         iters = 10
SLIC compactness:        m = 10
Region merge (LAB):      ΔE_merge = 2.0 - 0.8*d         (floor at 1.0)
Region split (LAB):      ΔE_split = 3.0 + 1.0*d
```

Guardrails:
- Clamp `eps` in `[0.003*diag, 0.015*diag]`
- Clamp `cell_px` in `[600, 3000]`
- Compute **all epsilons in pixels** (not normalized).

---

## 3) Backends (implement these three first)

### 3.1 `edge` — Canny + contour follow (fast outlines)
**Use when:** you want sparse outlines from photos/posters.

**Pipeline**
1. `blur = gaussian(σ=1.0..2.0)`  
2. `edges = canny(th_lo, th_hi)`  
3. Link edges into polylines (8‑neighbor, hysteresis).  
4. Simplify each polyline with **DP** using `eps`.  
5. Drop polylines with `length < min_len`.  
6. Emit strokes: `stroke:black`, `stroke-width = 1.2px @1080p * scale`.

**Output semantics:** `<path fill="none" stroke="black" stroke-linejoin="round" stroke-linecap="round">`

---

### 3.2 `centerline` — Skeleton + centerline trace (engraving/sketch)
**Use when:** line art, hatching, maps.

**Pipeline**
1. Adaptive threshold (Sauvola: window 31, k=0.2).  
2. Morph open radius ≤ 1 px.  
3. Skeletonize (Zhang–Suen / Guo–Hall).  
4. Trace centerlines → polylines.  
5. Remove branches `< min_branch`, simplify with DP `eps`.  
6. Emit strokes (same style as `edge`).

**Note:** Do **not** fill; preserve holes using `fill-rule="evenodd"` when solids are detected (rare in this mode).

---

### 3.3 `superpixel` — Big regions (cell‑shaded look)
**Use when:** low‑detail fills from photos.

**Pipeline**
1. Edge‑preserving denoise: bilateral (σs=3, σr=10).  
2. Convert to **CIELAB**.  
3. SLIC superpixels targeting `cell_px`; `iters=10`, `compactness=10`.  
4. Graph merge in LAB: merge adjacent regions if mean ΔE < `ΔE_merge`; force‑split tiles where max ΔE > `ΔE_split`.  
5. Extract region contours; DP simplify with `eps`.  
6. Optionally outline borders with 0.8px stroke.  
7. Emit filled paths with `fill-rule="evenodd"`.

**Z‑order:** small → large to retain detail.

---

## 4) Rust API Sketch

```rust
pub enum TraceBackend { Edge, Centerline, Superpixel }

#[derive(Clone, Copy)]
pub struct TraceLowCfg {
    pub backend: TraceBackend,
    pub detail: f32,          // 0..1
    pub stroke_px_at_1080p: f32, // 1.2
}

pub fn vectorize_trace_low(img: &image::RgbaImage, cfg: TraceLowCfg) -> SvgDoc {
    let d = cfg.detail.clamp(0.0, 1.0);
    let diag = ((img.width().pow(2) + img.height().pow(2)) as f32).sqrt();
    let eps = ((0.003 + 0.012*d) * diag).clamp(0.003*diag, 0.015*diag);
    match cfg.backend {
        TraceBackend::Edge => trace_edge(img, eps, d, cfg),
        TraceBackend::Centerline => trace_centerline(img, eps, d, cfg),
        TraceBackend::Superpixel => trace_superpixel(img, eps, d, cfg),
    }
}
```

(Backends implement the pipelines above; all thresholds derived from `detail` using Section 2.)

---

## 5) Integration Steps (Order of Work)

- [ ] Add CLI flags: `--mode trace-low`, `--backend`, `--detail`.  
- [ ] Add **DP-in-pixels** helper (epsilon derived from image diagonal).  
- [ ] Implement `edge` backend (Canny → link → DP → strokes).  
- [ ] Implement `centerline` backend (Sauvola → skeleton → DP → strokes).  
- [ ] Implement `superpixel` backend (bilateral → LAB → SLIC → merge/split → DP → fills).  
- [ ] Add instrumentation CSV: `file,backend,paths,median_vertices,pct_quads,total_length_px`.  
- [ ] Z‑order small→large; `fill-rule="evenodd"`.  
- [ ] Unit tests for threshold mapping (stable across images).

---

## 6) Performance Notes (CPU‑friendly)

- Prefer integer/`u8` ops where possible; keep 3× `u8` RGB → `f32` LAB only once.  
- Reuse buffers; avoid allocations in DP (pre‑size stacks).  
- Parallelize per‑polyline / per‑region steps with rayon.  
- Early‑exit small components using `min_len` and area floors.

---

## 7) Acceptance Criteria

- `edge/centerline`: ≥90% strokes; no unintended fills; median vertices/polyline ≤ 30 at `d=0.3`.  
- `superpixel`: `pct_quads ≤ 0.3`; mean regions ≤ 300 for 1080p at `d=0.4`.  
- Visual check: no giant 200×200 uniform blocks unless `superpixel` at `d≈0` by design.

---

## 8) CLI Examples

```bash
# Sparse sketchy outlines
vectorize-cli --mode trace-low --backend edge --detail 0.2 input.jpg -o out.svg

# Engraving-like centerlines
vectorize-cli --mode trace-low --backend centerline --detail 0.35 input.png -o out.svg

# Posterized regions
vectorize-cli --mode trace-low --backend superpixel --detail 0.4 input.jpg -o out.svg
```
