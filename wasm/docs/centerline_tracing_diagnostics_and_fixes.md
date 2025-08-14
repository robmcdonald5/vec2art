# Centerline Tracing — Diagnostics & Fixes

**Summary:** Your current “centerline” pipeline (global Otsu → opening → thinning → naive endpoint-walk → aggressive Douglas–Peucker) tends to shrink thin strokes, break continuity at corners and junctions, and then over-simplify what remains. The fixes below address direction choice during tracing, safer morphology, local thresholding, gentler pruning/simplification, and smart re-connection of nearly collinear breaks.

---

## Why the results look sub‑optimal

1) **Neighbor choice during skeleton walking**
   - In `trace_from_endpoint` you pick the **first** neighbor (e.g., `neighbors[0]`), which causes zig-zags, wrong turns at T/X-junctions, and fragmented polylines.  
   - **Fix:** Make the step **direction-aware**—prefer the neighbor that best preserves the current heading and avoid diagonal “corner hops” without orthogonal support.

2) **Over-aggressive tolerances for one‑pixel skeletons**
   - `min_centerline_branch_px` in the ~12–48 px range prunes real detail.
   - `dp_epsilon_px = 0.003–0.015 × image_diagonal` can be ~5–23 px at 1080p—way too large for 1‑px skeletons, so curves get straight‑lined and micro‑features vanish.

3) **Global Otsu on anti‑aliased art**
   - Otsu makes uneven stroke widths on shaded/AA images → unstable skeletons.
   - **Fix:** Prefer **adaptive** thresholding (Sauvola/Niblack/box‑Sauvola) or tile-wise mean/variance thresholds.

4) **Opening (erode→dilate) before thinning**
   - Opening **shrinks** thin strokes and creates breaks.  
   - **Fix:** Use **closing** (dilate→erode) to **bridge tiny gaps** first, then trim spurs after thinning.

5) **No gap‑bridging / path reconnection**
   - Small breaks remain after thinning.  
   - **Fix:** Reconnect endpoints that are near each other **and** direction‑aligned.

6) **Junction handling & spur pruning**
   - Pure “short length” pruning deletes real branches and keeps junk near nodes.  
   - **Fix:** Add a **radius ratio** test using the distance transform to prefer thick “trunks” and drop hairlike spurs.

7) **Uniform SVG stroke width**
   - Real centerlines look better if width is modulated by the **EDT radius** along the skeleton (mild, clamped).

---

## High‑impact fixes you can drop in now

### 1) Direction‑aware skeleton walking (replace your `trace_from_endpoint`)

This preserves heading, avoids diagonal corner jumps, and de‑prioritizes stepping *into* junctions unless necessary.

```rust
fn trace_from_endpoint(
    skeleton: &image::GrayImage,
    visited: &mut [Vec<bool>],
    pixel_types: &[Vec<PixelType>],
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut cur = (start_x as i32, start_y as i32);
    let mut prev_dir: Option<(i32, i32)> = None;

    let in_img = |x: i32, y: i32| x >= 0 && y >= 0
        && (x as u32) < skeleton.width()
        && (y as u32) < skeleton.height();

    let mut is_fg = |x: i32, y: i32| -> bool {
        if !in_img(x,y) { return false; }
        skeleton.get_pixel(x as u32, y as u32).0[0] > 0
    };

    // Forbid diagonal “corner hops” where both orthogonal supports are absent.
    let mut diagonal_ok = |x: i32, y: i32, dx: i32, dy: i32| -> bool {
        if dx == 0 || dy == 0 { return true; }
        is_fg(x + dx, y) || is_fg(x, y + dy)
    };

    loop {
        let (x, y) = cur;
        if visited[y as usize][x as usize] { break; }
        visited[y as usize][x as usize] = true;
        path.push(Point { x: x as f32, y: y as f32 });

        // Collect unvisited neighbors (8-conn), filtering bad diagonals.
        let mut cand: Vec<(i32,i32,i32,i32)> = Vec::new();
        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 { continue; }
                let nx = x + dx; let ny = y + dy;
                if !in_img(nx, ny) { continue; }
                if !is_fg(nx, ny) { continue; }
                if !diagonal_ok(x, y, dx, dy) { continue; }
                if !visited[ny as usize][nx as usize] {
                    cand.push((nx, ny, dx, dy));
                }
            }
        }

        if cand.is_empty() { break; }

        let next = if let Some((pdx, pdy)) = prev_dir {
            // Prefer smallest turn (max dot with previous dir).
            cand.into_iter()
                .max_by(|a, b| {
                    let da = a.2 * pdx + a.3 * pdy;
                    let db = b.2 * pdx + b.3 * pdy;
                    da.cmp(&db)
                        // tie-breaker: prefer leaving a junction *later* (stay on trunk)
                        .then_with(|| {
                            let ta = pixel_types[a.1 as usize][a.0 as usize] != PixelType::Junction;
                            let tb = pixel_types[b.1 as usize][b.0 as usize] != PixelType::Junction;
                            ta.cmp(&tb)
                        })
                })
                .unwrap()
        } else {
            // First step: prefer neighbor with the most skeleton neighbors (main trunk).
            cand.into_iter()
                .max_by_key(|(nx, ny, _, _)| count_skeleton_neighbors(skeleton, *nx as u32, *ny as u32))
                .unwrap()
        };

        prev_dir = Some((next.2, next.3));
        cur = (next.0, next.1);
    }

    path
}
```

**Why it helps:** this alone removes “sawtooth” artifacts, wrong branch picks at T‑junctions, and jagged paths that DP later over‑straightens.

---

### 2) Much tighter simplification + gentler pruning for centerlines

Use small epsilons (pixel scale) and prune with both length **and** junction thickness.

```rust
// Just before Douglas–Peucker in your centerline stage:
let mut dp_eps = (0.0008 + 0.0022 * config.detail) * thresholds.image_diagonal_px;
dp_eps = dp_eps.clamp(0.75, 3.0); // ~sub‑pixel to a few px at 1080p

// Gentler branch pruning:
let min_branch = (6.0 + 18.0 * config.detail).max(4.0); // ~6..24 px typical
```

> Better: when deciding to drop a branch near a junction, compute the **distance‑transform (EDT) radius** over the first few points and keep the branch if its median radius ≥ ~70% of the trunk’s radius.

---

### 3) Switch preprocessing to **closing** (bridge gaps before thinning)

Your current preprocessing uses **opening**. For centerlines, try **closing**:

```rust
fn morphological_closing_3x3(binary: &GrayImage) -> GrayImage {
    let (w, h) = binary.dimensions();
    let mut dil = GrayImage::new(w, h);
    // Dilate
    for y in 0..h {
        for x in 0..w {
            let mut v = 0u8;
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx; let ny = y as i32 + dy;
                    if nx>=0 && ny>=0 && (nx as u32) < w && (ny as u32) < h {
                        v = v.max(binary.get_pixel(nx as u32, ny as u32).0[0]);
                    }
                }
            }
            dil.put_pixel(x, y, image::Luma([v]));
        }
    }
    // Erode
    let mut out = GrayImage::new(w, h);
    for y in 0..h {
        for x in 0..w {
            let mut v = 255u8;
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let nx = x as i32 + dx; let ny = y as i32 + dy;
                    if nx>=0 && ny>=0 && (nx as u32) < w && (ny as u32) < h {
                        v = v.min(dil.get_pixel(nx as u32, ny as u32).0[0]);
                    }
                }
            }
            out.put_pixel(x, y, image::Luma([v]));
        }
    }
    out
}
```

Then in your pipeline:
```rust
let processed_binary = if config.noise_filtering {
    morphological_closing_3x3(&binary)
} else { binary };
```

---

### 4) Bridge near‑collinear endpoints (reduces breaks without fattening)

Connect polylines whose endpoints are within a small gap *and* headings align.

```rust
fn connect_nearby_endpoints(mut lines: Vec<Vec<Point>>, max_gap: f32, max_turn_deg: f32) -> Vec<Vec<Point>> {
    fn tail_dir(p: &Vec<Point>, tail: bool) -> (f32,f32) {
        let n = p.len();
        if tail && n >= 2 {
            let a = &p[n-2]; let b = &p[n-1];
            (b.x - a.x, b.y - a.y)
        } else if !tail && n >= 2 {
            let a = &p[0]; let b = &p[1];
            (b.x - a.x, b.y - a.y)
        } else { (0.0, 0.0) }
    }
    fn angle_ok((dx1,dy1):(f32,f32),(dx2,dy2):(f32,f32), max_deg:f32)->bool{
        let d = (dx1*dx2 + dy1*dy2) / ((dx1.hypot(dy1)+1e-6)*(dx2.hypot(dy2)+1e-6));
        d.acos().to_degrees() <= max_deg
    }

    let mut used = vec![false; lines.len()];
    let mut out: Vec<Vec<Point>> = Vec::new();

    for i in 0..lines.len() {
        if used[i] { continue; }
        let mut cur = std::mem::take(&mut lines[i]);
        used[i] = true;

        let mut merged = true;
        while merged {
            merged = false;
            let mut best: Option<(usize,bool,bool,f32)> = None; // (j, cur_tail?, other_head?, dist)
            let cur_head = cur.first().unwrap().clone();
            let cur_tail = cur.last().unwrap().clone();

            for j in 0..lines.len() {
                if used[j] || lines[j].is_empty() { continue; }
                let other_head = lines[j].first().unwrap().clone();
                let other_tail = lines[j].last().unwrap().clone();

                // tail->head
                let d1 = ((cur_tail.x - other_head.x).hypot(cur_tail.y - other_head.y));
                if d1 <= max_gap &&
                   angle_ok(tail_dir(&cur,true), tail_dir(&lines[j],false), max_turn_deg) {
                    best = Some((j,true,true,d1));
                }
                // tail->tail (reverse other)
                let d2 = ((cur_tail.x - other_tail.x).hypot(cur_tail.y - other_tail.y));
                if d2 <= max_gap &&
                   angle_ok(tail_dir(&cur,true), (-tail_dir(&lines[j],true).0, -tail_dir(&lines[j],true).1), max_turn_deg) {
                    best = best.map_or(Some((j,true,false,d2)), |b| if d2 < b.3 { (j,true,false,d2) } else { b });
                }
                // head->head (reverse cur)
                let d3 = ((cur_head.x - other_head.x).hypot(cur_head.y - other_head.y));
                if d3 <= max_gap &&
                   angle_ok((-tail_dir(&cur,false).0, -tail_dir(&cur,false).1), tail_dir(&lines[j],false), max_turn_deg) {
                    best = best.map_or(Some((j,false,true,d3)), |b| if d3 < b.3 { (j,false,true,d3) } else { b });
                }
                // head->tail
                let d4 = ((cur_head.x - other_tail.x).hypot(cur_head.y - other_tail.y));
                if d4 <= max_gap &&
                   angle_ok((-tail_dir(&cur,false).0, -tail_dir(&cur,false).1), (-tail_dir(&lines[j],true).0, -tail_dir(&lines[j],true).1), max_turn_deg) {
                    best = best.map_or(Some((j,false,false,d4)), |b| if d4 < b.3 { (j,false,false,d4) } else { b });
                }
            }

            if let Some((j, use_tail, other_head, _)) = best {
                let mut other = std::mem::take(&mut lines[j]);
                if !other_head { other.reverse(); }
                if use_tail {
                    cur.extend(other);
                } else {
                    other.extend(cur);
                    cur = other;
                }
                used[j] = true;
                merged = true;
            }
        }

        out.push(cur);
    }

    out
}
```

Call it just after extracting polylines:
```rust
let polylines = connect_nearby_endpoints(polylines, 3.5, 25.0);
```

---

### 5) Prefer adaptive over global Otsu

A quick, effective choice is **box‑Sauvola**: compute local mean and variance in a window (25–35 px), then threshold with a `k ≈ 0.3–0.5`. Even this simple adaptive step dramatically improves anime/illustration inputs where Otsu under-/over‑segments strokes.

---

## Medium‑term quality boosts

- **Distance Transform (EDT) radius along skeleton:**
  - Use to prune spurs (low radius near junctions) and to modulate stroke width in SVG (light, clamped 0.6–1.8×).

- **Curvature‑aware DP:**
  - Use smaller epsilon where curvature is high and larger on straights (measure angle change over a short window).

- **Edge Tangent Flow (ETF) / FDoG prefilter:**
  - One or two low‑sigma iterations can improve line coherence before thresholding+thinning.

---

## TL;DR settings that usually fix “meh” centerlines

- Use **closing** (not opening) before thinning.  
- Use **adaptive** thresholding (tile‑based) instead of global Otsu.  
- **Direction‑aware** walking (code above) instead of `neighbors[0]`.  
- `min_centerline_branch_px ≈ 6..12` for most assets.  
- `dp_epsilon_px ≈ 0.8–3.0 px` at 1080p (curvature‑aware if possible).  
- Link endpoints within **~3–4 px** if headings align (function above).  
- Optional: compute **EDT radius** for width modulation + smarter spur pruning.

---

## Integration notes

- Insert **closing** right after binarization and **before** thinning.  
- Swap in the **direction‑aware walker** wherever you assemble polylines from the skeleton.  
- Apply **tight DP** and **gentle pruning** on the resulting polylines.  
- Then run **endpoint bridging**, and (optionally) **EDT‑based** width modulation and spur pruning.
