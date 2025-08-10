//! Command-line interface for vectorize-core
//!
//! This CLI tool provides line tracing functionality for converting images to SVG
//! using the trace-low algorithm with various backends.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use vectorize_core::algorithms::{apply_hand_drawn_aesthetics, HandDrawnPresets};
use vectorize_core::config::SvgConfig;
use vectorize_core::svg::generate_svg_document;
use vectorize_core::{vectorize_trace_low, vectorize_trace_low_rgba, TraceBackend, TraceLowConfig};

#[derive(Parser)]
#[command(name = "vectorize-cli")]
#[command(about = "A CLI tool for line tracing image vectorization")]
#[command(version)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose logging
    #[arg(short, long)]
    verbose: bool,

    /// Number of threads to use (default: auto-detect)
    #[arg(short, long)]
    threads: Option<usize>,
}

#[derive(Subcommand)]
enum Commands {
    /// Vectorize using low-detail line tracing algorithm
    TraceLow {
        /// Input image file
        input: PathBuf,

        /// Output SVG file
        output: PathBuf,

        /// Tracing backend to use (edge, centerline, superpixel)
        #[arg(long, default_value = "edge")]
        backend: String,

        /// Detail level (0.0 = very sparse, 1.0 = more detail)
        #[arg(long, default_value = "0.3")]
        detail: f32,

        /// Stroke width at 1080p reference resolution
        #[arg(long, default_value = "1.2")]
        stroke_width: f32,

        /// Random seed for reproducible results
        #[arg(long, default_value = "0")]
        seed: u64,

        /// Output statistics to CSV file
        #[arg(long)]
        stats: Option<PathBuf>,

        /// Enable dual-pass processing for enhanced quality
        #[arg(long)]
        multipass: bool,

        /// Conservative detail level for first pass (default: detail * 1.3)
        #[arg(long)]
        conservative_detail: Option<f32>,

        /// Aggressive detail level for second pass (default: detail * 0.7)
        #[arg(long)]
        aggressive_detail: Option<f32>,

        /// Enable content-aware noise filtering
        #[arg(long)]
        noise_filtering: bool,
        /// Enable reverse direction processing (R→L, B→T)
        #[arg(long)]
        enable_reverse: bool,
        /// Enable diagonal direction processing (NW→SE, NE→SW)
        #[arg(long)]
        enable_diagonal: bool,
        /// Threshold for directional strength - skip pass if not beneficial (0.0-1.0)
        #[arg(long, default_value = "0.3")]
        directional_threshold: f32,
        /// Maximum processing time budget in milliseconds
        #[arg(long, default_value = "1500")]
        max_time_ms: u64,

        /// Hand-drawn aesthetic preset (none, subtle, medium, strong, sketchy)
        #[arg(long, default_value = "none")]
        hand_drawn: String,

        /// Custom hand-drawn tremor strength (0.0-0.5, overrides preset)
        #[arg(long)]
        tremor: Option<f32>,

        /// Custom hand-drawn variable weights (0.0-1.0, overrides preset)  
        #[arg(long)]
        variable_weights: Option<f32>,
    },

    /// Simple vectorization using default trace-low settings
    Convert {
        /// Input image file
        input: PathBuf,

        /// Output SVG file  
        output: PathBuf,

        /// Detail level (0.0 = very sparse, 1.0 = more detail)
        #[arg(short, long, default_value = "0.3")]
        detail: f32,

        /// Stroke width
        #[arg(short, long, default_value = "1.2")]
        stroke_width: f32,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize logging
    let log_level = if cli.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(log_level)).init();

    // Set thread count if specified
    if let Some(threads) = cli.threads {
        rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build_global()
            .context("Failed to set thread count")?;
    }

    match cli.command {
        Commands::TraceLow {
            input,
            output,
            backend,
            detail,
            stroke_width,
            seed,
            stats,
            multipass,
            conservative_detail,
            aggressive_detail,
            noise_filtering,
            enable_reverse,
            enable_diagonal,
            directional_threshold,
            max_time_ms,
            hand_drawn,
            tremor,
            variable_weights,
        } => {
            // Validate detail parameter
            if !(0.0..=1.0).contains(&detail) {
                anyhow::bail!("Detail level must be between 0.0 and 1.0, got: {}", detail);
            }

            vectorize_trace_low_command(
                input,
                output,
                backend,
                detail,
                stroke_width,
                seed,
                stats,
                multipass,
                conservative_detail,
                aggressive_detail,
                noise_filtering,
                enable_reverse,
                enable_diagonal,
                directional_threshold,
                max_time_ms,
                hand_drawn,
                tremor,
                variable_weights,
            )
        }
        Commands::Convert {
            input,
            output,
            detail,
            stroke_width,
        } => {
            // Validate detail parameter
            if !(0.0..=1.0).contains(&detail) {
                anyhow::bail!("Detail level must be between 0.0 and 1.0, got: {}", detail);
            }

            // Use default settings with edge backend
            vectorize_trace_low_command(
                input,
                output,
                "edge".to_string(),
                detail,
                stroke_width,
                0,                  // default seed
                None,               // no stats output
                false,              // no multipass
                None,               // no conservative detail
                None,               // no aggressive detail
                false,              // no noise filtering
                false,              // no reverse pass
                false,              // no diagonal pass
                0.3,                // default directional threshold
                1500,               // default max time ms
                "none".to_string(), // no hand-drawn effects
                None,               // no custom tremor
                None,               // no custom variable weights
            )
        }
    }
}

fn vectorize_trace_low_command(
    input: PathBuf,
    output: PathBuf,
    backend: String,
    detail: f32,
    stroke_width: f32,
    _seed: u64,
    stats: Option<PathBuf>,
    multipass: bool,
    conservative_detail: Option<f32>,
    aggressive_detail: Option<f32>,
    noise_filtering: bool,
    enable_reverse: bool,
    enable_diagonal: bool,
    directional_threshold: f32,
    max_time_ms: u64,
    hand_drawn: String,
    tremor: Option<f32>,
    variable_weights: Option<f32>,
) -> Result<()> {
    let start_time = Instant::now();

    // Read input image
    let image_data = fs::read(&input)
        .with_context(|| format!("Failed to read input file: {}", input.display()))?;

    let image = image::load_from_memory(&image_data)
        .with_context(|| format!("Failed to decode image: {}", input.display()))?;

    let rgba_image = image.to_rgba8();

    println!(
        "Processing {}x{} image with trace-low algorithm...",
        rgba_image.width(),
        rgba_image.height()
    );
    println!(
        "Backend: {backend}, Detail: {detail:.2}, Stroke Width: {stroke_width:.2}"
    );
    if multipass {
        println!(
            "Multipass: enabled, Conservative: {conservative_detail:?}, Aggressive: {aggressive_detail:?}, Noise filtering: {noise_filtering}"
        );
        if enable_reverse || enable_diagonal {
            println!(
                "Directional processing: Reverse: {enable_reverse}, Diagonal: {enable_diagonal}, Threshold: {directional_threshold:.2}, Budget: {max_time_ms}ms"
            );
        }
    }
    if hand_drawn != "none" {
        println!("Hand-drawn aesthetics: {hand_drawn} preset");
        if tremor.is_some() || variable_weights.is_some() {
            println!(
                "Custom overrides: Tremor: {tremor:?}, Variable weights: {variable_weights:?}"
            );
        }
    }

    // Parse backend string to TraceBackend enum
    let trace_backend = match backend.as_str() {
        "edge" => TraceBackend::Edge,
        "centerline" => TraceBackend::Centerline,
        "superpixel" => TraceBackend::Superpixel,
        _ => anyhow::bail!(
            "Invalid backend: {}. Must be one of: edge, centerline, superpixel",
            backend
        ),
    };

    // Create trace-low configuration
    let config = TraceLowConfig {
        backend: trace_backend,
        detail,
        stroke_px_at_1080p: stroke_width,
        enable_multipass: multipass,
        conservative_detail,
        aggressive_detail,
        noise_filtering,
        enable_reverse_pass: enable_reverse,
        enable_diagonal_pass: enable_diagonal,
        directional_strength_threshold: directional_threshold,
        max_processing_time_ms: max_time_ms,
    };

    // Create hand-drawn configuration
    let hand_drawn_config = match hand_drawn.as_str() {
        "none" => None,
        "subtle" => Some(HandDrawnPresets::subtle()),
        "medium" => Some(HandDrawnPresets::medium()),
        "strong" => Some(HandDrawnPresets::strong()),
        "sketchy" => Some(HandDrawnPresets::sketchy()),
        _ => anyhow::bail!(
            "Invalid hand-drawn preset: {}. Must be one of: none, subtle, medium, strong, sketchy",
            hand_drawn
        ),
    };

    // Apply custom overrides to hand-drawn config
    let hand_drawn_config = if let Some(mut hd_config) = hand_drawn_config {
        if let Some(tremor_val) = tremor {
            if !(0.0..=0.5).contains(&tremor_val) {
                anyhow::bail!(
                    "Tremor strength must be between 0.0 and 0.5, got: {}",
                    tremor_val
                );
            }
            hd_config.tremor_strength = tremor_val;
        }
        if let Some(weights_val) = variable_weights {
            if !(0.0..=1.0).contains(&weights_val) {
                anyhow::bail!(
                    "Variable weights must be between 0.0 and 1.0, got: {}",
                    weights_val
                );
            }
            hd_config.variable_weights = weights_val;
        }
        Some(hd_config)
    } else if tremor.is_some() || variable_weights.is_some() {
        anyhow::bail!(
            "Hand-drawn preset must be specified when using custom tremor or variable weights"
        );
    } else {
        None
    };

    // Vectorize
    let vectorize_start = Instant::now();
    let svg_content = if hand_drawn_config.is_some() {
        // Use path-based vectorization for hand-drawn effects
        let paths = vectorize_trace_low(&rgba_image, &config).context("Vectorization failed")?;

        let processed_paths = if let Some(hd_config) = hand_drawn_config {
            apply_hand_drawn_aesthetics(paths, &hd_config)
        } else {
            paths
        };

        let svg_config = SvgConfig::default();
        generate_svg_document(
            &processed_paths,
            rgba_image.width(),
            rgba_image.height(),
            &svg_config,
        )
    } else {
        // Use optimized direct SVG generation for speed
        vectorize_trace_low_rgba(&rgba_image, &config).context("Vectorization failed")?
    };
    let vectorize_time = vectorize_start.elapsed();

    // Write output
    fs::write(&output, &svg_content)
        .with_context(|| format!("Failed to write output file: {}", output.display()))?;

    let total_time = start_time.elapsed();

    println!(
        "✓ Vectorization completed in {:.2}s",
        vectorize_time.as_secs_f64()
    );
    println!("✓ Total time: {:.2}s", total_time.as_secs_f64());
    println!("✓ SVG saved to: {}", output.display());

    // Output statistics if requested
    if let Some(stats_path) = stats {
        let stats = create_trace_stats(
            &svg_content,
            rgba_image.width() * rgba_image.height(),
            vectorize_time,
        );

        // Write simple CSV stats
        let csv_header = "input,backend,detail,stroke_width,paths,svg_bytes,processing_time_ms\n";
        let csv_row = format!(
            "{},{},{:.2},{:.2},{},{},{}\n",
            input
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown"),
            backend,
            detail,
            stroke_width,
            stats.paths,
            stats.svg_bytes,
            stats.processing_time_ms
        );

        // Write or append to CSV
        let csv_content = if stats_path.exists() {
            csv_row
        } else {
            format!("{csv_header}{csv_row}")
        };

        fs::write(&stats_path, csv_content)
            .with_context(|| format!("Failed to write stats to: {}", stats_path.display()))?;

        println!("✓ Statistics saved to: {}", stats_path.display());
    }

    Ok(())
}

#[derive(Debug)]
struct SimpleStats {
    paths: usize,
    svg_bytes: u64,
    processing_time_ms: u64,
}

fn create_trace_stats(
    svg_content: &str,
    _image_pixels: u32,
    processing_time: std::time::Duration,
) -> SimpleStats {
    // Analyze SVG content for basic statistics
    let paths_count = svg_content.matches("<path").count();
    let svg_bytes = svg_content.len() as u64;

    SimpleStats {
        paths: paths_count,
        svg_bytes,
        processing_time_ms: processing_time.as_millis() as u64,
    }
}
