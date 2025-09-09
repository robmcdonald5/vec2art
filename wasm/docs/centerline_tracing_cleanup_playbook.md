# Centerline Tracing Cleanup Playbook (for `centerline_improved`)

This guide turns the messy centerlines you’re seeing into clean, faithful paths by tightening each stage of the pipeline: denoise → thin → extract → prune → reconnect → simplify. It includes **drop‑in Rust functions** and **minimal call‑site changes** so you can integrate quickly into your existing `trace_low.rs` pipeline.

---

## Why outputs look messy (root causes)

1. **Noisy binarization → pepper & fuzzy edges**  
   Sauvola + mild blur still leaves tiny specs that become skeleton spurs.

2. **Thinning artifacts (Zhang–Suen)**  
   Z–S preserves connectivity but creates stair‑step diagonals and short spurs on photo‑like inputs.

3. **Polyline extraction at junctions**  
   Purely topological next‑step choice can zig‑zag. You want branch selection based on **tangent alignment** with the incoming direction.

4. **Naive reconnection**  
   Distance‑only endpoint bridging joins unrelated strands. Add **tangent alignment** and **EDT barrier** gating.

5. **Global ε simplification**  
   One epsilon over‑simplifies curves and under‑simplifies straights. Use **curvature‑aware adaptive ε**.

---

## Integration order (TL;DR)

1. **Denoise**: swap `closing` → **open+close**.
2. **Thinning**: replace Zhang–Suen with **Guo–Hall**.
3. **Loop hygiene**: **remove micro‑loops** before simplification.
4. **Reconnection**: use **tangent+EDT‑aware** joiner.
5. **Simplify**: switch to **adaptive Douglas–Peucker**.
6. **Log metrics** at each stage to verify improvements.

---

## A) Pre‑thinning denoise: _open then close_

**What it fixes**: kills pepper noise without fattening strokes; closing then bridges hairline gaps.

**Drop‑in code (Rust):**

```rust
/// Morphological open-then-close to denoise before thinning.
fn morphological_open_close(binary: &GrayImage) -> GrayImage {
    let opened = morphological_opening_3x3(binary);
    morphological_closing_3x3(&opened)
}

/// 3x3 opening (erosion then dilation) with border handling.
fn morphological_opening_3x3(binary: &GrayImage) -> GrayImage {
    let (w, h) = binary.dimensions();
    let mut eroded = GrayImage::new(w, h);

    // Erode
    for y in 0..h {
        for x in 0..w {
            let mut m = 255u8;
            for dy in -1..=1 {
                for dx in -1..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    let v = if nx >= 0 && ny >= 0 && (nx as u32) < w && (ny as u32) < h {
                        binary.get_pixel(nx as u32, ny as u32).0[0]
                    } else { 0 };
                    m = m.min(v);
                }
            }
            eroded.put_pixel(x, y, Luma([m]));
        }
    }

    // Dilate
    let mut dilated = GrayImage::new(w, h);
    for y in 0..h {
        for x in 0..w {
            let mut M = 0u8;
            for dy in -1..=1 {
                for dx in -1..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    let v = if nx >= 0 && ny >= 0 && (nx as u32) < w && (ny as u32) < h {
                        eroded.get_pixel(nx as u32, ny as u32).0[0]
                    } else { 0 };
                    M = M.max(v);
                }
            }
            dilated.put_pixel(x, y, Luma([M]));
        }
    }
    dilated
}
```

**Call‑site change:**

```rust
// BEFORE:
// let processed_binary = if config.enable_morphological_filtering {
//     morphological_closing_3x3(&binary)
// } else { binary };

// AFTER:
let processed_binary = if config.enable_morphological_filtering {
    morphological_open_close(&binary)
} else { binary };
```

---

## B) Cleaner skeleton: Guo–Hall thinning

**What it fixes**: fewer stair‑steps and spurs than Zhang–Suen on natural/photographic binarizations.

**Drop‑in code (Rust):**

```rust
fn guo_hall_thinning(binary: &GrayImage) -> GrayImage {
    let (w, h) = binary.dimensions();
    let mut img = binary.clone();
    let mut changed = true;

    let fg = |x: i32, y: i32| -> u8 {
        if x < 0 || y < 0 || x as u32 >= w || y as u32 >= h { 0 }
        else { if img.get_pixel(x as u32, y as u32).0[0] > 0 { 1 } else { 0 } }
    };

    while changed {
        changed = false;

        // Sub-iteration 1
        let mut to_zero = Vec::<(u32,u32)>::new();
        for y in 1..(h-1) {
            for x in 1..(w-1) {
                if img.get_pixel(x, y).0[0] == 0 { continue; }
                let p2=fg(x as i32, y as i32 - 1);
                let p3=fg(x as i32 + 1, y as i32 - 1);
                let p4=fg(x as i32 + 1, y as i32);
                let p5=fg(x as i32 + 1, y as i32 + 1);
                let p6=fg(x as i32, y as i32 + 1);
                let p7=fg(x as i32 - 1, y as i32 + 1);
                let p8=fg(x as i32 - 1, y as i32);
                let p9=fg(x as i32 - 1, y as i32 - 1);

                let bp1 = p2+p3+p4+p5+p6+p7+p8+p9;
                if bp1 < 2 || bp1 > 6 { continue; }

                // Number of 0->1 transitions in p2..p9,p2
                let seq = [p2,p3,p4,p5,p6,p7,p8,p9,p2];
                let mut a = 0;
                for k in 0..8 { if seq[k] == 0 && seq[k+1] == 1 { a += 1; } }
                if a != 1 { continue; }

                if p2*p4*p6 != 0 { continue; }
                if p4*p6*p8 != 0 { continue; }

                to_zero.push((x, y));
            }
        }
        for (x,y) in to_zero { img.get_pixel_mut(x,y).0[0] = 0; changed = true; }

        // Sub-iteration 2
        let mut to_zero = Vec::<(u32,u32)>::new();
        for y in 1..(h-1) {
            for x in 1..(w-1) {
                if img.get_pixel(x, y).0[0] == 0 { continue; }
                let p2=fg(x as i32, y as i32 - 1);
                let p3=fg(x as i32 + 1, y as i32 - 1);
                let p4=fg(x as i32 + 1, y as i32);
                let p5=fg(x as i32 + 1, y as i32 + 1);
                let p6=fg(x as i32, y as i32 + 1);
                let p7=fg(x as i32 - 1, y as i32 + 1);
                let p8=fg(x as i32 - 1, y as i32);
                let p9=fg(x as i32 - 1, y as i32 - 1);

                let bp1 = p2+p3+p4+p5+p6+p7+p8+p9;
                if bp1 < 2 || bp1 > 6 { continue; }

                let seq = [p2,p3,p4,p5,p6,p7,p8,p9,p2];
                let mut a = 0;
                for k in 0..8 { if seq[k] == 0 && seq[k+1] == 1 { a += 1; } }
                if a != 1 { continue; }

                if p2*p4*p8 != 0 { continue; }
                if p2*p6*p8 != 0 { continue; }

                to_zero.push((x, y));
            }
        }
        for (x,y) in to_zero { img.get_pixel_mut(x,y).0[0] = 0; changed = true; }
    }
    img
}
```

**Call‑site change:**

```rust
// BEFORE: let skeleton = zhang_suen_thinning(&processed_binary);
// AFTER:
let skeleton = guo_hall_thinning(&processed_binary);
```

---

## C) Reconnection with tangent alignment + EDT barrier check

**What it fixes**: prevents “nearby but unrelated” bridges; only joins if ends point toward each other **and** the straight segment isn’t blocked by low EDT.

**Drop‑in code (Rust):**

```rust
fn endpoint_tangent(poly: &[Point]) -> (f32, f32) {
    if poly.len() < 3 { return (0.0, 0.0); }
    let k = (poly.len() as f32 * 0.05).round().max(3.0) as usize;
    let a = poly[poly.len().saturating_sub(k)];
    let b = poly[poly.len()-1];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let len = (dx*dx + dy*dy).sqrt().max(1e-6);
    (dx/len, dy/len)
}

fn angle_between(u:(f32,f32), v:(f32,f32)) -> f32 {
    let dot = u.0*v.0 + u.1*v.1;
    dot.clamp(-1.0, 1.0).acos().to_degrees()
}

fn edt_allows_bridge(a:&Point, _ta:(f32,f32), b:&Point, _tb:(f32,f32), edt:&[Vec<f32>], min_radius_px:f32) -> bool {
    let steps = ((a.x-b.x).hypot(a.y-b.y)).ceil() as i32;
    if steps <= 1 { return true; }
    for i in 0..=steps {
        let t = i as f32 / steps as f32;
        let x = a.x*(1.0-t) + b.x*t;
        let y = a.y*(1.0-t) + b.y*t;
        let xi = x.round() as i32;
        let yi = y.round() as i32;
        if yi < 0 || xi < 0 || yi as usize >= edt.len() || xi as usize >= edt[0].len() {
            return false;
        }
        if edt[yi as usize][xi as usize] < min_radius_px { return false; }
    }
    true
}

fn connect_nearby_endpoints_oriented(
    polylines: Vec<Vec<Point>>,
    max_join_dist_px: f32,
    max_angle_deg: f32,
    edt: &[Vec<f32>],
) -> Vec<Vec<Point>> {
    if polylines.is_empty() { return polylines; }

    #[derive(Clone)]
    struct EndRef { idx: usize, is_tail: bool, pt: Point, tan:(f32,f32) }
    let mut ends = Vec::<EndRef>::new();
    for (i, p) in polylines.iter().enumerate() {
        if p.len() < 2 { continue; }
        let head_t = endpoint_tangent(&p[..2.min(p.len())].to_vec());
        let tail_t = endpoint_tangent(p);
        ends.push(EndRef{ idx:i, is_tail:false, pt:p[0], tan:head_t });
        ends.push(EndRef{ idx:i, is_tail:true,  pt:p[p.len()-1], tan:tail_t });
    }

    let mut used_end = vec![false; ends.len()];
    let mut out = polylines.clone();

    let mut pairs = Vec::<(usize,usize,f32)>::new();
    for i in 0..ends.len() {
        for j in (i+1)..ends.len() {
            let a = &ends[i]; let b = &ends[j];
            if a.idx == b.idx { continue; }
            let d = ((a.pt.x-b.pt.x).powi(2) + (a.pt.y-b.pt.y).powi(2)).sqrt();
            if d <= max_join_dist_px {
                pairs.push((i,j,d));
            }
        }
    }
    pairs.sort_by(|a,b| a.2.partial_cmp(&b.2).unwrap_or(std::cmp::Ordering::Equal));

    for (ei, ej, _d) in pairs {
        if used_end[ei] || used_end[ej] { continue; }
        let a = &ends[ei]; let b = &ends[ej];

        // Tangent alignment: outward directions should face each other
        let ang = angle_between(a.tan, (-b.tan.0, -b.tan.1));
        if ang > max_angle_deg { continue; }

        // EDT barrier test
        if !edt_allows_bridge(&a.pt, a.tan, &b.pt, b.tan, edt, 1.0) { continue; }

        // Merge sequences with orientation handling
        let (li, ri) = (a.idx, b.idx);
        if a.is_tail && !b.is_tail {
            let mut left = out[li].clone();
            let right = out[ri].clone();
            left.extend(right);
            out[li] = left; out[ri].clear();
        } else if !a.is_tail && b.is_tail {
            let mut left = out[ri].clone();
            let right = out[li].clone();
            left.extend(right);
            out[ri] = left; out[li].clear();
        } else if a.is_tail && b.is_tail {
            let mut left = out[li].clone();
            let mut right = out[ri].clone();
            right.reverse();
            left.extend(right);
            out[li] = left; out[ri].clear();
        } else {
            let mut left = out[ri].clone();
            let mut right = out[li].clone();
            right.reverse();
            left.extend(right);
            out[ri] = left; out[li].clear();
        }
        used_end[ei] = true; used_end[ej] = true;
    }

    out.into_iter().filter(|p| p.len() >= 2).collect()
}
```

**Call‑site change:**

```rust
// BEFORE:
let reconnected_polylines = connect_nearby_endpoints(simplified_polylines, 3.5, 25.0);

// AFTER:
let reconnected_polylines = connect_nearby_endpoints_oriented(simplified_polylines, 6.0, 25.0, &edt);
```

---

## D) Remove micro‑loops before simplification

**What it fixes**: tiny 4–8 px cycles that look like “hairballs”.

**Drop‑in code (Rust):**

```rust
fn remove_micro_loops(mut polys: Vec<Vec<Point>>, min_perimeter_px: f32) -> Vec<Vec<Point>> {
    polys.retain(|p| {
        if p.len() < 4 { return true; }
        let mut per = 0.0;
        for i in 1..p.len() { per += (p[i].x-p[i-1].x).hypot(p[i].y-p[i-1].y); }
        per >= min_perimeter_px
    });
    polys
}
```

**Call‑site placement (after extraction/prune):**

```rust
let polylines = extract_skeleton_polylines_improved(&skeleton);
let pruned_polylines = prune_branches_with_edt(polylines, &edt, min_branch);
let pruned_polylines = remove_micro_loops(pruned_polylines, 12.0);
```

---

## E) Curvature‑aware adaptive simplification

**What it fixes**: keeps detail in bends while aggressively simplifying straights.

**Drop‑in code (Rust):**

```rust
fn local_curvature(p0:&Point, p1:&Point, p2:&Point) -> f32 {
    let v1 = ((p1.x-p0.x), (p1.y-p0.y));
    let v2 = ((p2.x-p1.x), (p2.y-p1.y));
    let l1 = (v1.0*v1.0 + v1.1*v1.1).sqrt().max(1e-6);
    let l2 = (v2.0*v2.0 + v2.1*v2.1).sqrt().max(1e-6);
    let dot = (v1.0*v2.0 + v1.1*v2.1) / (l1*l2);
    dot.clamp(-1.0, 1.0).acos().to_degrees()
}

/// Adaptive DP: smaller epsilon in high-curvature zones, larger in flats.
fn simplify_adaptive(poly: &[Point], base_eps: f32) -> Vec<Point> {
    if poly.len() <= 2 { return poly.to_vec(); }

    // Per-vertex curvature
    let mut curv = vec![0.0; poly.len()];
    for i in 1..(poly.len()-1) {
        curv[i] = local_curvature(&poly[i-1], &poly[i], &poly[i+1]);
    }
    let maxc = curv.iter().cloned().fold(0.0, f32::max).max(1e-6);
    for c in &mut curv { *c /= maxc; }

    fn dp(poly:&[Point], idx0:usize, idx1:usize, curv:&[f32], base:f32, out:&mut Vec<Point>) {
        if idx1 <= idx0+1 { return; }
        let (x0,y0) = (poly[idx0].x, poly[idx0].y);
        let (x1,y1) = (poly[idx1].x, poly[idx1].y);
        let dx = x1-x0; let dy = y1-y0;
        let den = (dx*dx + dy*dy).sqrt().max(1e-6);

        let mut max_d = -1.0; let mut idx = idx0;
        for i in (idx0+1)..idx1 {
            let num = ((poly[i].x-x0)*dy - (poly[i].y-y0)*dx).abs();
            let d = num / den;
            // Higher curvature => smaller epsilon (harder to drop a point)
            let eps_i = base * (0.4 + 0.6*(1.0 - curv[i])); // 0.4x..1.0x
            if d > max_d && d > eps_i { max_d = d; idx = i; }
        }

        if max_d >= 0.0 {
            dp(poly, idx0, idx, curv, base, out);
            out.push(poly[idx].clone());
            dp(poly, idx, idx1, curv, base, out);
        }
    }

    let mut out = Vec::with_capacity(poly.len());
    out.push(poly[0].clone());
    dp(poly, 0, poly.len()-1, &curv, base_eps, &mut out);
    out.push(poly[poly.len()-1].clone());
    out
}
```

**Call‑site change (replace fixed‑ε DP):**

```rust
let mut dp_eps = (0.0008 + 0.0022 * config.detail) * thresholds.image_diagonal_px;
dp_eps = dp_eps.clamp(0.75, 3.0);

let simplified_polylines: Vec<Vec<Point>> = pruned_polylines
    .into_iter()
    .map(|poly| simplify_adaptive(&poly, dp_eps))
    .filter(|poly| !poly.is_empty())
    .collect();
```

---

## Suggested parameter ranges

- **Blur σ**: 0.8–1.2 (too low → noise; too high → merged features)
- **Sauvola**: `window=27–33`, `k=0.34–0.42` (start at 31 / 0.38)
- **EDT prune**: `min_branch = max(4, 8 + 16*detail)` and drop branches with **median_radius < 0.6 px**
- **Reconnection**: `max_join_dist_px = 6–8`, `max_angle_deg = 25–35`
- **Width modulation**: disable while debugging centerlines; re‑enable after skeleton quality is good

---

## Health metrics to log (sanity checks)

Track these per stage to make improvements visible:

- Foreground pixels after binarization **and** after open+close
- Skeleton pixel count; number of **endpoints** and **junctions**
- After pruning: number of polylines, total arc length, median length
- After reconnection: number of bridges accepted vs. rejected (by angle / EDT)
- After simplification: average points per polyline

A “healthy” run shows: a **big drop** from skeleton pixels → polylines, **few** junctions, **modest** reconnections, and a **lower** points‑per‑polyline without losing detail.

---

## Notes & next steps

- Keep your junction‑aware tracer, but **weight next‑step choice by tangent alignment** to the incoming direction.
- If inputs vary a lot (logos vs. photographs), consider **two preset configs** with different Sauvola + pruning thresholds.
- Once centerlines look clean, selectively re‑enable **width modulation** to capture stroke feel.

**Done right, this sequence is usually a night‑and‑day improvement over “centerline_improved” with minimal code churn.**
