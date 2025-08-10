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

#[derive(Debug, Serialize, Default)]
pub struct Resolved {
    // Geometry / simplification
    pub dp_eps_px: f64,
    pub min_stroke_px: Option<f32>,

    // Segmentation & color (regions pipeline)
    pub slic_step_px: Option<u32>, // actual step/side length, not "area"
    pub slic_iters: Option<u32>,
    pub slic_compactness: Option<f32>,
    pub de_merge: Option<f64>, // LAB ΔE
    pub de_split: Option<f64>, // LAB ΔE
    pub palette_k: Option<u32>,

    // Logo / binarization
    pub sauvola_k: Option<f32>,
    pub sauvola_window: Option<u32>,
    pub morph_kernel_px: Option<u32>,

    // General
    pub min_region_area_px: Option<u32>,
}

#[derive(Debug, Serialize, Default)]
pub struct Guards {
    pub retries: u32,
    pub edge_barrier_thresh: Option<u32>, // e.g., Sobel magnitude 0..255
    pub area_floor_px: Option<u32>,
}

#[derive(Debug, Serialize, Default)]
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
    pub mode: String,            // "logo" | "regions" | "poster" | "trace-low"
    pub backend: Option<String>, // e.g., "superpixel" | "edge" | "centerline"
    pub cli: serde_json::Value,  // raw CLI args you passed in (optional)
    pub resolved: Resolved,
    pub guards: Guards,
    pub stats: Stats,
    pub build: Build,
}

fn git_info() -> (String, String) {
    let sha = option_env!("VERGEN_GIT_SHA")
        .or_else(|| option_env!("GIT_COMMIT"))
        .or(option_env!("GITHUB_SHA"))
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
    let pal = dump.resolved.palette_k.unwrap_or(0);

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
    let p = path.to_path_buf();
    if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
        let parent = p.parent().map(|pp| pp.to_path_buf()).unwrap_or_default();
        return parent.join(format!("{stem}.{new_ext}"));
    }
    p
}
