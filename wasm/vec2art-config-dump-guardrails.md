# vec2art — **Per‑Run Config Dump & Anti‑“Solid Blocks” Guardrails**

**Date:** 2025‑08‑08  
**Goal:** Add a *per‑run* JSON/CSV telemetry dump and fix config semantics that are causing blocky outputs in **logo** and **regions** modes.

---

## TL;DR (What to do)
1) **Add per‑run telemetry** that saves the *resolved* parameters (in pixels / LAB ΔE), guard values, and output stats next to each SVG.  
2) **Fix SLIC parameter semantics** (use *step length in pixels*, not “area”; default ≈ **40 px** at 1080p).  
3) **Make Douglas–Peucker epsilon explicit in pixels** and always log the resolved `dp_eps_px`.  
4) **Use LAB ΔE thresholds** for region merge/split and record them in the dump.  
5) **Auto‑retry** when guardrails trip (e.g., `k_colors < 6`, `pct_quads > 0.6`, or `max_region_pct > 0.35`).

---

## Why a “config dump”?
A “config dump” is a **snapshot of what actually ran**, not just default structs. It captures:
- **Resolved values** (e.g., `dp_eps_px`, `slic_step_px`, `de_merge`, `de_split`, `palette_k`)
- **Image meta** (w, h, diagonal)
- **Guards/retries**
- **Output stats** (paths, median vertices, `% quads`, palette size, max region %)
- **Build info** (git SHA, branch, version)

This lets us pinpoint whether **SLIC step**, **ΔE**, or **epsilon** caused “solid blocks.”

---

## Add this file: `src/telemetry.rs`

> Full, drop‑in file. Writes **`<basename>.config.json`** next to the SVG and appends a row to **`runs.csv`** in the same folder.

```rust
//! Telemetry: per-run config & stats dump (JSON + CSV)
//!
//! Write <basename>.config.json next to the SVG and append a row to runs.csv.
//! This captures the *resolved* parameters (in pixels/real units) so we can
//! debug "solid block" failures quickly.
//
// Dependencies in Cargo.toml:
// serde = { version = "1", features = ["derive"] }
// serde_json = "1"
// chrono = { version = "0.4", features = ["clock"] }

use chrono::Utc;
use serde::Serialize;
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
pub struct RunInput {
    pub path: String,
    pub w: u32,
    pub h: u32,
    pub diag_px: f64,
}

#[derive(Debug, Serialize)]
pub struct Resolved {
    // Geometry / simplification
    pub dp_eps_px: f64,
    pub min_stroke_px: Option<f32>,

    // Segmentation & color (regions pipeline)
    pub slic_step_px: Option<u32>,      // actual step/side length, not "area"
    pub slic_iters: Option<u32>,
    pub slic_compactness: Option<f32>,
    pub de_merge: Option<f64>,          // LAB ΔE
    pub de_split: Option<f64>,          // LAB ΔE
    pub palette_k: Option<u32>,

    // Logo / binarization
    pub sauvola_k: Option<f32>,
    pub sauvola_window: Option<u32>,
    pub morph_kernel_px: Option<u32>,

    // General
    pub min_region_area_px: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct Guards {
    pub retries: u32,
    pub edge_barrier_thresh: Option<u32>, // e.g., Sobel magnitude 0..255
    pub area_floor_px: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct Stats {
    pub paths: u32,
    pub median_vertices: f32,
    pub pct_quads: f32,
    pub k_colors: u32,
    pub max_region_pct: f32,
    pub svg_bytes: u64,
}

#[derive(Debug, Serialize)]
pub struct Build {
    pub git_sha: String,
    pub branch: String,
    pub built_at: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct Dump {
    pub image: RunInput,
    pub mode: String,              // "logo" | "regions" | "poster" | "trace-low"
    pub backend: Option<String>,   // e.g., "superpixel" | "edge" | "centerline"
    pub cli: serde_json::Value,    // raw CLI args you passed in (optional)
    pub resolved: Resolved,
    pub guards: Guards,
    pub stats: Stats,
    pub build: Build,
}

fn git_info() -> (String, String) {
    let sha = option_env!("VERGEN_GIT_SHA")
        .or_else(|| option_env!("GIT_COMMIT"))
        .or_else(|| option_env!("GITHUB_SHA"))
        .unwrap_or("unknown")
        .to_string();
    let branch = option_env!("VERGEN_GIT_BRANCH")
        .or_else(|| option_env!("GIT_BRANCH"))
        .unwrap_or("unknown")
        .to_string();
    (sha, branch)
}

fn exe_version() -> String {
    option_env!("CARGO_PKG_VERSION")
        .unwrap_or("0.0.0")
        .to_string()
}

/// Write <basename>.config.json next to <svg_path>.
pub fn write_json_dump(svg_path: &Path, dump: &Dump) -> io::Result<PathBuf> {
    let json_path = replace_extension(svg_path, "config.json");
    if let Some(parent) = json_path.parent() {
        fs::create_dir_all(parent)?;
    }
    let file = File::create(&json_path)?;
    serde_json::to_writer_pretty(file, dump)?;
    Ok(json_path)
}

/// Append a one-line CSV to runs.csv in the same directory as <svg_path>.
pub fn append_runs_csv(svg_path: &Path, dump: &Dump) -> io::Result<PathBuf> {
    let dir = svg_path.parent().unwrap_or_else(|| Path::new("."));
    let csv_path = dir.join("runs.csv");
    let file_exists = csv_path.exists();

    let mut f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&csv_path)?;

    if !file_exists {
        writeln!(
            f,
            "ts,image,mode,backend,paths,median_vertices,pct_quads,k_colors,max_region_pct,retries,dp_eps_px,slic_step_px,de_merge,de_split,palette_k,svg_bytes"
        )?;
    }

    let ts = Utc::now().to_rfc3339();
    let slic = dump.resolved.slic_step_px.unwrap_or(0);
    let de_m = dump.resolved.de_merge.unwrap_or(-1.0);
    let de_s = dump.resolved.de_split.unwrap_or(-1.0);
    let pal  = dump.resolved.palette_k.unwrap_or(0);

    writeln!(
        f,
        "{ts},{img},{mode},{be},{paths},{medv:.2},{pq:.3},{kc},{mrp:.3},{ret},{eps:.3},{slic},{dem:.3},{des:.3},{pal},{bytes}",
        ts = ts,
        img = dump.image.path,
        mode = dump.mode,
        be = dump.backend.clone().unwrap_or_default(),
        paths = dump.stats.paths,
        medv = dump.stats.median_vertices,
        pq = dump.stats.pct_quads,
        kc = dump.stats.k_colors,
        mrp = dump.stats.max_region_pct,
        ret = dump.guards.retries,
        eps = dump.resolved.dp_eps_px,
        slic = slic,
        dem = de_m,
        des = de_s,
        pal = pal,
        bytes = dump.stats.svg_bytes
    )?;

    Ok(csv_path)
}

/// Helper to build a Dump with build metadata filled in.
pub fn make_dump(
    image_path: &str,
    w: u32,
    h: u32,
    mode: &str,
    backend: Option<&str>,
    cli_json: serde_json::Value,
    resolved: Resolved,
    guards: Guards,
    stats: Stats,
) -> Dump {
    let diag_px = ((w as f64).powi(2) + (h as f64).powi(2)).sqrt();
    let (git_sha, branch) = git_info();

    Dump {
        image: RunInput {
            path: image_path.to_string(),
            w,
            h,
            diag_px,
        },
        mode: mode.to_string(),
        backend: backend.map(|s| s.to_string()),
        cli: cli_json,
        resolved,
        guards,
        stats,
        build: Build {
            git_sha,
            branch,
            built_at: Utc::now().to_rfc3339(),
            version: exe_version(),
        },
    }
}

// ----------------- internal helpers -----------------

fn replace_extension(path: &Path, new_ext: &str) -> PathBuf {
    let mut p = path.to_path_buf();
    if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
        let parent = p.parent().map(|pp| pp.to_path_buf()).unwrap_or_default();
        return parent.join(format!("{stem}.{new_ext}"));
    }
    p
}
```

**Cargo.toml additions**
```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["clock"] }
```

---

## How to call it (from your CLI after writing the SVG)

```rust
use serde_json::json;
use crate::telemetry::{make_dump, write_json_dump, append_runs_csv, Resolved, Guards, Stats};

fn finish(svg_path: &std::path::Path) -> std::io::Result<()> {
    // These should be your *resolved* runtime values:
    let w = 1280;
    let h = 960;
    let resolved = Resolved {
        dp_eps_px: 7.6,
        min_stroke_px: Some(1.2),
        slic_step_px: Some(40),        // IMPORTANT: step length/side in pixels
        slic_iters: Some(10),
        slic_compactness: Some(10.0),
        de_merge: Some(1.5),           // LAB ΔE
        de_split: Some(3.8),           // LAB ΔE
        palette_k: Some(12),
        sauvola_k: Some(0.2),
        sauvola_window: Some(31),
        morph_kernel_px: Some(1),
        min_region_area_px: Some(24),
    };

    let guards = Guards {
        retries: 0,
        edge_barrier_thresh: Some(25),
        area_floor_px: Some(24),
    };

    let stats = Stats {
        paths: 312,
        median_vertices: 18.0,
        pct_quads: 0.22,
        k_colors: 13,
        max_region_pct: 0.19,
        svg_bytes: std::fs::metadata(svg_path).map(|m| m.len()).unwrap_or(0),
    };

    let dump = make_dump(
        "samples/test2.png",
        w,
        h,
        "regions",
        Some("superpixel"),
        json!({"detail": 0.4, "compact": 10, "iters": 10}),
        resolved,
        guards,
        stats,
    );

    write_json_dump(svg_path, &dump)?;
    append_runs_csv(svg_path, &dump)?;
    Ok(())
}
```

---

## Config fixes to prevent “solid blocks”

### 1) **SLIC parameter semantics**
Your `RegionsConfig::slic_region_size = 800` is labeled as “approximate side length.” At 1080p, **800 px step** is gigantic and yields **huge tiles**. Fix by using *step length in pixels*:

```rust
// Rename or reinterpret as *step length in pixels*
pub slic_step_px: u32, // typical 30..55 at 1080p (≈ 900–3000 px²)

impl RegionsConfig {
    pub fn validate(&self) -> Result<(), String> {
        if self.segmentation_method == SegmentationMethod::Slic {
            if self.slic_step_px < 12 || self.slic_step_px > 120 {
                return Err("SLIC step (px) should be ~12–120 for 720p–4K images".into());
            }
            if self.slic_compactness < 0.1 || self.slic_compactness > 100.0 {
                return Err("SLIC compactness should be between 0.1 and 100.0".into());
            }
            if self.slic_iterations < 10 {
                return Err("SLIC iterations should be at least 10 for proper convergence".into());
            }
        }
        // ...
        Ok(())
    }
}

impl Default for RegionsConfig {
    fn default() -> Self {
        Self {
            // ...
            segmentation_method: SegmentationMethod::Slic,
            slic_step_px: 40,          // GOOD DEFAULT @1080p
            slic_compactness: 10.0,
            slic_iterations: 10,
            // ...
            ..Default::default()
        }
    }
}
```

*(If you prefer exposing **target area**, name it `slic_target_area_px` and compute `slic_step_px = (area as f32).sqrt().round() as u32` internally. Still log `slic_step_px` in the dump.)*

### 2) **Douglas–Peucker epsilon in pixels**
Avoid normalized epsilons. Make it explicit and log the resolved value:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Epsilon {
    Pixels(f64),
    DiagFrac(f64), // multiply by sqrt(w^2 + h^2)
}

pub struct LogoConfig {
    // ...
    pub simplification_epsilon: Epsilon,
}

pub struct RegionsConfig {
    // ...
    pub simplification_epsilon: Epsilon,
}

// Resolve once per image:
fn resolve_eps_px(eps: &Epsilon, w: u32, h: u32) -> f64 {
    match *eps {
        Epsilon::Pixels(px) => px,
        Epsilon::DiagFrac(k) => k * (((w as f64).powi(2) + (h as f64).powi(2)).sqrt()),
    }
}
```

Recommended defaults:
- **logos:** `DiagFrac(0.0035)` → gentle
- **regions:** `DiagFrac(0.0050)` → modest

Always record the **resolved** `dp_eps_px` in the JSON dump.

---

## Where files go

- SVG: `out/<name>.svg`  
- Per‑run JSON: `out/<name>.config.json` (same basename)  
- Aggregate CSV: `out/runs.csv` (one row per output)

---

## Example JSON dump (what we want to see)

```json
{
  "image": {"path":"samples/test2.png","w":1280,"h":960,"diag_px":1600.0},
  "mode": "regions",
  "backend": "superpixel",
  "cli": {"detail":0.4,"compact":10,"iters":10},
  "resolved": {
    "dp_eps_px": 8.0,
    "min_stroke_px": 1.2,
    "slic_step_px": 40,
    "slic_iters": 10,
    "slic_compactness": 10.0,
    "de_merge": 1.5,
    "de_split": 3.8,
    "palette_k": 12,
    "sauvola_k": 0.2,
    "sauvola_window": 31,
    "morph_kernel_px": 1,
    "min_region_area_px": 24
  },
  "guards": {"retries":1,"edge_barrier_thresh":25,"area_floor_px":24},
  "stats": {
    "paths": 312,
    "median_vertices": 18.0,
    "pct_quads": 0.22,
    "k_colors": 13,
    "max_region_pct": 0.19,
    "svg_bytes": 42137
  },
  "build": {"git_sha":"7f3a1ab","branch":"algorithms-refinement","built_at":"2025-08-08T16:05:12Z","version":"0.3.1"}
}
```

---

## Optional: Auto‑retry guard (pseudo)

```rust
fn maybe_retry(stats: &Stats, resolved: &mut Resolved, tries: &mut u32) -> bool {
    if *tries >= 2 { return false; }
    let mut retry = false;

    if stats.k_colors < 6 {
        // Increase palette & reduce merges
        if let Some(p) = &mut resolved.palette_k { *p = (*p).max(8); }
        if let Some(m) = &mut resolved.de_merge { *m = (*m - 0.5).max(1.0); }
        retry = true;
    }
    if stats.pct_quads > 0.6 {
        resolved.dp_eps_px *= 0.5; // halve simplification
        retry = true;
    }
    if stats.max_region_pct > 0.35 {
        // force finer segmentation
        if let Some(s) = &mut resolved.slic_step_px { *s = (*s as f32 * 0.8) as u32; }
        retry = true;
    }

    if retry { *tries += 1; }
    retry
}
```

---

## Done criteria
- JSON is written per SVG, with **resolved pixel values** and LAB thresholds.  
- `runs.csv` grows each run with key metrics.  
- SLIC step defaults ~**40 px** at 1080p; DP epsilon resolved and logged.  
- “Solid blocks” cases show clear culprits in the dump (huge `slic_step_px`, tiny `palette_k`, or oversized `dp_eps_px`).

---

If you want, I can open a PR that adds `src/telemetry.rs`, wires it in the CLI, and updates your `RegionsConfig`/`LogoConfig` to the `Epsilon` enum + `slic_step_px` semantics.
