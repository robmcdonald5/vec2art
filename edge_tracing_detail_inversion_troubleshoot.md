
# Fixing Inverted Detail Slider in **Edge Tracing**  
*Parameter Binding Chain Audit & One-Place Fix Strategy*

**Last updated:** 2025-09-03 16:33:04

Repo context: `robmcdonald5/vec2art` (branch: `dev`)

---

## TL;DR
Your Edge Tracing path almost certainly has a **double inversion** of the `detail` parameter: once in the UI/JS path and again in the Rust mapping for Canny thresholds. Pick **one owner** for the mapping (Rust _or_ JS), make the relation monotonic in the **correct direction**, and remove extra inversions elsewhere.

> **Correct UX expectation:** Higher UI “Detail” ⇒ **Lower** Canny thresholds ⇒ **More** detected edges.

---

## Parameter Binding Chain (current layout)
- **UI Layer**
  - `frontend/src/lib/components/converter/ParameterPanel.svelte` — slider & UI mapping
  - `frontend/src/lib/stores/vectorizer.svelte.ts` — `detailFromUI` / `detailToUI`

- **Configuration & Worker Layer**
  - `frontend/src/lib/workers/wasm-processor.worker.ts` — worker entry
  - `frontend/src/lib/services/wasm-worker-service.ts` — worker comms
  - `frontend/src/lib/services/vectorizer-service.ts` — vectorization ops
  - `frontend/src/lib/workers/robust-config-mapper.ts` — (currently disabled in debug)

- **WASM Binding Layer**
  - `wasm/vectorize-wasm/src/lib.rs` — `set_detail()` receives JS values
  - `frontend/src/lib/wasm/vectorize_wasm.js` — generated JS bindings
  - `frontend/src/lib/wasm/vectorize_wasm.d.ts` — TS types

- **Core Algorithm Layer**
  - `wasm/vectorize-core/src/algorithms/tracing/trace_low.rs`
    - `ThresholdMapping::new()` — Canny thresholds
    - Multipass logic
    - Background removal & edge detection

- **Configuration Types**
  - `frontend/src/lib/types/vectorizer.ts` — TS config shapes
  - `wasm/vectorize-core/src/config.rs` — Rust config structs/builders

---

## Symptom
- Edge Tracing’s “Detail” slider feels **inverted**: moving toward “more detail” renders **fewer** edges (or vice versa).
- Other algorithms behave correctly, which indicates the inversion is unique to the Edge/Canny threshold path.

---

## Likely Root Cause
- **Canny detail semantics:** Higher detail should **lower** thresholds → detect **more** edges.
- If **either** UI mapping or Rust mapping already inverts (e.g., uses `1.0 - detail` or `lerp(min, max, detail)` where it should be `lerp(max, min, detail)`), and the **other side** inverts again, the net result is a backwards-feeling slider.  
- This only manifests for Edge Tracing because it’s the only backend using Canny thresholds with this mapping.

---

## Where to Inspect (in this order)
1. **UI Layer**
   - `ParameterPanel.svelte`: Verify the slider emits normalized `detail ∈ [0, 1]` with **1 = more detail**.
   - `vectorizer.svelte.ts`: Inspect `detailFromUI` / `detailToUI`. Confirm no hidden inversion for Edge specifically.

2. **Worker/Service Layer**
   - `vectorizer-service.ts`, `wasm-worker-service.ts`, `wasm-processor.worker.ts`:
     - Ensure the passed `detail` is the expected normalized value (log it).
     - If `robust-config-mapper.ts` is disabled, confirm you’re not skipping a needed transform for Edge only.

3. **WASM Binding**
   - `wasm/vectorize-wasm/src/lib.rs` (`set_detail(detail: f32)`):
     - Look for `1.0 - detail`, clamping, or any path that flips meaning.

4. **Rust Core (Edge Tracing path)**
   - `trace_low.rs` → `ThresholdMapping::new(...)`:
     - **Canny mapping** should be: **higher** `detail` ⇒ **lower** `low/high` thresholds.
     - If you see `lerp(MIN, MAX, detail)` for thresholds, that’s **inverted for UX**. Use `lerp(MAX, MIN, detail)`.

---

## Single-Owner Strategy (Recommended)
Choose **one layer** to own the mapping from UI `detail` to thresholds.

### Option A — Own it in **Rust** (Preferred)
- JS sends `detail ∈ [0, 1]` directly (1 = more detail).
- Rust computes Canny thresholds once, correctly.

**Example (Rust) snippet in `trace_low.rs`:**
```rust
fn lerp(a: f32, b: f32, t: f32) -> f32 { a + (b - a) * t }

// Tunable ranges (example values; calibrate to your pipeline)
let low_max: f32 = 150.0;  // coarse
let low_min: f32 = 10.0;   // fine
let high_max: f32 = 300.0; // coarse
let high_min: f32 = 50.0;  // fine

// detail: 0.0 = coarse (higher thresholds), 1.0 = fine (lower thresholds)
let low_thresh  = lerp(low_max,  low_min,  detail);
let high_thresh = lerp(high_max, high_min, detail);
```

> If your current code uses `lerp(low_min, low_max, detail)`, **swap the order** to fix the inversion. Also, **remove** any `1.0 - detail` upstream.

### Option B — Own it in **JS**
- Compute thresholds in one JS location (e.g., `wasm-worker-service.ts`) with the same monotonic rule.
- Pass `low_thresh`/`high_thresh` explicitly to WASM.
- Make `set_detail` and `ThresholdMapping::new` **neutral** (no inversion/derivation inside Rust).

**Example (TypeScript) mapping:**
```ts
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function thresholdsFromDetail(detail: number) {
  // Calibrate these to your pipeline
  const lowMax  = 150, lowMin  = 10;
  const highMax = 300, highMin = 50;

  const low  = lerp(lowMax,  lowMin,  detail); // higher detail => lower threshold
  const high = lerp(highMax, highMin, detail);
  return { low, high };
}
```

---

## Guardrails & Quick Instrumentation

### Add temporary logs
- **UI** (`ParameterPanel.svelte`): log raw slider and final `detail` sent.
- **Worker** (`wasm-processor.worker.ts`): log inbound/outbound `detail` (or thresholds).
- **WASM binding** (`vectorize-wasm/src/lib.rs`): debug-print received `detail` once.
- **Rust core**: behind a debug flag, `eprintln!(...)` computed thresholds.

### Sanity unit test (Rust)
```rust
#[test]
fn detail_monotonic_for_canny() {
    let samples = [0.0_f32, 0.25, 0.5, 0.75, 1.0];
    let mut prev_low: Option<f32> = None;
    let mut prev_high: Option<f32> = None;

    for &d in &samples {
        let (low, high) = thresholds_from_detail(d); // refactor your mapping into a pure function
        if let Some(p) = prev_low  { assert!(low  <= p, "low should not increase with detail"); }
        if let Some(p) = prev_high { assert!(high <= p, "high should not increase with detail"); }
        prev_low = Some(low);
        prev_high = Some(high);
    }
}
```

### Frontend regression check
- Add a small **dev panel** that displays `[detail, low, high]` live while dragging to visually confirm the curve.

---

## Step-by-Step Checklist to Resolve
1. **Confirm UX semantics**: `detail=1` means _more_ detail (more edges).
2. **Pick one owner** (Rust or JS) for **all** threshold mapping.
3. **Swap any inverted lerp**: use `lerp(MAX, MIN, detail)` for thresholds.
4. **Remove stray inversions** (`1.0 - detail`) in:
   - `detailFromUI/detailToUI` (Edge branch only),
   - `set_detail` (WASM binding),
   - `ThresholdMapping::new` (Rust).
5. **Add logs/tests**, test with `detail = 0.1, 0.5, 0.9` on a consistent image.
6. **Commit fix** and keep a single mapping flow documented in code comments.

---

## Nice-to-haves
- **Document the contract** (in code): “`detail` is normalized `[0,1]`, where 1 = more detail (lower thresholds).”
- **Expose tunables** (min/max thresholds) via config for quick calibration.
- Add **visual cue** in UI: tooltip that explains “More detail ⇒ more edges (lower thresholds)”.

---

## Drop-in TODOs
- [ ] Decide mapping owner: Rust or JS
- [ ] Remove all other inversions
- [ ] Swap `lerp` order for thresholds if needed
- [ ] Add temporary logs in UI/worker/WASM/Rust
- [ ] Add `detail_monotonic_for_canny` test
- [ ] Verify visually on three slider positions
- [ ] Commit and tag regression test

---

**Need a line-level diff?** Share:
- `detailFromUI`/`detailToUI` bodies
- `set_detail(..)` (Rust)
- `ThresholdMapping::new(..)` (threshold math only)

…and I’ll mark the exact lines to flip.
