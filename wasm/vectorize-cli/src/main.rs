//! Command-line interface for vectorize-core
//!
//! This CLI tool provides a way to test and benchmark the vectorization algorithms
//! with various input images and configuration parameters.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use vectorize_core::{vectorize_logo_rgba, vectorize_regions_rgba, vectorize_trace_low_rgba, LogoConfig, RegionsConfig, TraceLowConfig, TraceBackend, SegmentationMethod, QuantizationMethod};

mod ssim;
mod svg_analysis;
mod comprehensive_benchmark;

use comprehensive_benchmark::{BenchmarkSuite, BenchmarkConfig, BenchmarkReport};

#[derive(Parser)]
#[command(name = "vectorize")]
#[command(about = "A CLI tool for image vectorization using vec2art algorithms")]
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
    /// Vectorize using logo/line-art algorithm
    Logo {
        /// Input image file
        input: PathBuf,

        /// Output SVG file
        output: PathBuf,

        /// Configuration JSON file (optional)
        #[arg(short, long)]
        config: Option<PathBuf>,

        /// Binary threshold (0-255)
        #[arg(long, default_value = "128")]
        threshold: u8,

        /// Use adaptive thresholding
        #[arg(long)]
        adaptive: bool,

        /// Enable primitive shape detection (circles, ellipses, arcs)
        #[arg(long, default_value = "true")]
        detect_primitives: bool,

        /// Threshold for accepting primitive fits (lower = more strict)
        #[arg(long, default_value = "2.0")]
        primitive_tolerance: f32,

        /// Maximum eccentricity for circle detection
        #[arg(long, default_value = "0.15")]
        max_circle_eccentricity: f32,

        /// Simplification tolerance
        #[arg(long, default_value = "1.0")]
        simplify: f64,
    },

    /// Vectorize using color regions algorithm  
    Regions {
        /// Input image file
        input: PathBuf,

        /// Output SVG file
        output: PathBuf,

        /// Configuration JSON file (optional)
        #[arg(short, long)]
        config: Option<PathBuf>,

        /// Number of colors for quantization
        #[arg(long, default_value = "16")]
        colors: u32,

        /// Color quantization method
        #[arg(long, default_value = "wu", value_parser = parse_quantization_method)]
        quantization_method: QuantizationMethod,

        /// Segmentation method
        #[arg(long, default_value = "kmeans", value_parser = parse_segmentation_method)]
        segmentation_method: SegmentationMethod,

        /// Use LAB color space
        #[arg(long, default_value = "true")]
        lab_color: bool,

        /// Merge similar adjacent regions
        #[arg(long, default_value = "true")]
        merge_similar_regions: bool,

        /// Color distance threshold for region merging
        #[arg(long, default_value = "2.0")]
        merge_threshold: f64,

        /// Target region size for SLIC superpixels (approximate side length in pixels)
        #[arg(long, default_value = "800")]
        slic_region_size: u32,

        /// SLIC compactness parameter (0-100, higher = more square regions)
        #[arg(long, default_value = "10.0")]
        slic_compactness: f32,

        /// Number of SLIC iterations
        #[arg(long, default_value = "10")]
        slic_iterations: u32,

        /// Enable gradient detection for smooth color transitions
        #[arg(long, default_value = "true")]
        detect_gradients: bool,

        /// R² threshold for accepting gradients (0.0-1.0, higher = more strict)
        #[arg(long, default_value = "0.85")]
        gradient_r2_threshold: f64,

        /// Maximum number of gradient stops to generate
        #[arg(long, default_value = "8")]
        max_gradient_stops: usize,

        /// Simplification tolerance
        #[arg(long, default_value = "1.0")]
        simplify: f64,
    },

    /// Vectorize using low-detail tracing algorithm
    TraceLow {
        /// Input image file
        input: PathBuf,

        /// Output SVG file
        output: PathBuf,

        /// Tracing backend to use
        #[arg(long, default_value = "edge", value_parser = parse_trace_backend)]
        backend: TraceBackend,

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
    },

    /// Benchmark vectorization performance
    Benchmark {
        /// Input image file or directory
        #[arg(short, long)]
        input: PathBuf,

        /// Algorithm to benchmark (logo, regions, or both)
        #[arg(long, default_value = "both")]
        algorithm: String,

        /// Number of iterations per benchmark
        #[arg(long, default_value = "10")]
        iterations: usize,

        /// Output benchmark results to file
        #[arg(short, long)]
        output: Option<PathBuf>,
    },

    /// Run comprehensive benchmark suite with SSIM and SVG analysis
    ComprehensiveBench {
        /// Input images directory or specific image files
        #[arg(short, long)]
        input: Vec<PathBuf>,

        /// Number of iterations for timing measurements
        #[arg(long, default_value = "10")]
        iterations: usize,

        /// Output directory for results and debug images
        #[arg(short, long, default_value = "benchmark_results")]
        output: PathBuf,

        /// Disable debug image generation
        #[arg(long)]
        no_debug_images: bool,

        /// Baseline results file for comparison (JSON format)
        #[arg(long)]
        baseline: Option<PathBuf>,
    },

    /// Batch process multiple images
    Batch {
        /// Input directory
        #[arg(short, long)]
        input: PathBuf,

        /// Output directory
        #[arg(short, long)]
        output: PathBuf,

        /// Algorithm to use (logo or regions)
        #[arg(long, default_value = "regions")]
        algorithm: String,

        /// Configuration JSON file (optional)
        #[arg(short, long)]
        config: Option<PathBuf>,

        /// File pattern to match (e.g., "*.png")
        #[arg(long, default_value = "*")]
        pattern: String,

        // Logo algorithm options
        /// Binary threshold (0-255) for logo algorithm
        #[arg(long, default_value = "128")]
        threshold: u8,

        /// Use adaptive thresholding for logo algorithm
        #[arg(long)]
        adaptive: bool,

        /// Enable primitive shape detection for logo algorithm
        #[arg(long, default_value = "true")]
        detect_primitives: bool,

        /// Primitive fit tolerance for logo algorithm
        #[arg(long, default_value = "2.0")]
        primitive_tolerance: f32,

        /// Maximum circle eccentricity for logo algorithm
        #[arg(long, default_value = "0.15")]
        max_circle_eccentricity: f32,

        // Regions algorithm options
        /// Number of colors for quantization
        #[arg(long, default_value = "16")]
        colors: u32,

        /// Color quantization method
        #[arg(long, default_value = "wu", value_parser = parse_quantization_method)]
        quantization_method: QuantizationMethod,

        /// Segmentation method
        #[arg(long, default_value = "kmeans", value_parser = parse_segmentation_method)]
        segmentation_method: SegmentationMethod,

        /// Use LAB color space
        #[arg(long, default_value = "true")]
        lab_color: bool,

        /// Merge similar adjacent regions
        #[arg(long, default_value = "true")]
        merge_similar_regions: bool,

        /// Color distance threshold for region merging
        #[arg(long, default_value = "2.0")]
        merge_threshold: f64,

        /// Target region size for SLIC superpixels
        #[arg(long, default_value = "800")]
        slic_region_size: u32,

        /// SLIC compactness parameter
        #[arg(long, default_value = "10.0")]
        slic_compactness: f32,

        /// Number of SLIC iterations
        #[arg(long, default_value = "10")]
        slic_iterations: u32,

        /// Enable gradient detection
        #[arg(long, default_value = "true")]
        detect_gradients: bool,

        /// R² threshold for accepting gradients
        #[arg(long, default_value = "0.85")]
        gradient_r2_threshold: f64,

        /// Maximum number of gradient stops
        #[arg(long, default_value = "8")]
        max_gradient_stops: usize,

        // Common options
        /// Simplification tolerance
        #[arg(long, default_value = "1.0")]
        simplify: f64,
    },
}

/// Validate CLI arguments for compatibility and ranges
fn validate_cli_arguments(command: &Commands) -> Result<()> {
    match command {
        Commands::Logo { 
            primitive_tolerance, 
            max_circle_eccentricity, 
            simplify, 
            .. 
        } => {
            if *primitive_tolerance < 0.0 {
                return Err(anyhow::anyhow!("Primitive tolerance must be non-negative"));
            }
            if *max_circle_eccentricity < 0.0 || *max_circle_eccentricity > 1.0 {
                return Err(anyhow::anyhow!("Circle eccentricity must be between 0.0 and 1.0"));
            }
            if *simplify < 0.0 {
                return Err(anyhow::anyhow!("Simplification tolerance must be non-negative"));
            }
        }
        Commands::Regions { 
            colors, 
            quantization_method,
            segmentation_method,
            merge_threshold,
            slic_region_size,
            slic_compactness,
            slic_iterations,
            gradient_r2_threshold,
            max_gradient_stops,
            simplify,
            .. 
        } => {
            // Validate color count
            if *colors < 2 {
                return Err(anyhow::anyhow!("Must have at least 2 colors for quantization"));
            }
            if *colors > 256 {
                return Err(anyhow::anyhow!("Color count should not exceed 256 for reasonable performance"));
            }

            // Validate Wu quantization with high color counts
            if *quantization_method == QuantizationMethod::Wu && *colors > 64 {
                log::warn!("Wu quantization is most effective with 64 or fewer colors");
            }

            // Validate SLIC parameters when SLIC is selected
            if *segmentation_method == SegmentationMethod::Slic {
                if *slic_region_size < 8 {
                    return Err(anyhow::anyhow!("SLIC region size should be at least 8 pixels"));
                }
                if *slic_compactness < 0.1 || *slic_compactness > 100.0 {
                    return Err(anyhow::anyhow!("SLIC compactness should be between 0.1 and 100.0"));
                }
                if *slic_iterations < 1 {
                    return Err(anyhow::anyhow!("SLIC iterations must be at least 1"));
                }
            }

            // Validate gradient parameters
            if *gradient_r2_threshold < 0.5 || *gradient_r2_threshold > 1.0 {
                return Err(anyhow::anyhow!("Gradient R² threshold should be between 0.5 and 1.0"));
            }
            if *max_gradient_stops < 2 {
                return Err(anyhow::anyhow!("Gradient must have at least 2 stops"));
            }

            // Validate merge threshold
            if *merge_threshold < 0.0 {
                return Err(anyhow::anyhow!("Merge threshold must be non-negative"));
            }

            if *simplify < 0.0 {
                return Err(anyhow::anyhow!("Simplification tolerance must be non-negative"));
            }
        }
        Commands::TraceLow {
            detail,
            stroke_width,
            ..
        } => {
            if *detail < 0.0 || *detail > 1.0 {
                return Err(anyhow::anyhow!("Detail parameter must be between 0.0 and 1.0"));
            }
            if *stroke_width <= 0.0 {
                return Err(anyhow::anyhow!("Stroke width must be positive"));
            }
            if *stroke_width > 50.0 {
                return Err(anyhow::anyhow!("Stroke width should not exceed 50.0 for reasonable output"));
            }
        }
        Commands::Batch { 
            algorithm,
            colors,
            quantization_method,
            segmentation_method,
            primitive_tolerance,
            max_circle_eccentricity,
            merge_threshold,
            slic_region_size,
            slic_compactness,
            slic_iterations: _,
            gradient_r2_threshold,
            max_gradient_stops,
            simplify,
            .. 
        } => {
            // Validate algorithm
            if algorithm != "logo" && algorithm != "regions" {
                return Err(anyhow::anyhow!("Algorithm must be 'logo' or 'regions'"));
            }

            // Apply same validations as individual commands
            if *primitive_tolerance < 0.0 {
                return Err(anyhow::anyhow!("Primitive tolerance must be non-negative"));
            }
            if *max_circle_eccentricity < 0.0 || *max_circle_eccentricity > 1.0 {
                return Err(anyhow::anyhow!("Circle eccentricity must be between 0.0 and 1.0"));
            }
            if *colors < 2 || *colors > 256 {
                return Err(anyhow::anyhow!("Color count must be between 2 and 256"));
            }
            if *quantization_method == QuantizationMethod::Wu && *colors > 64 {
                log::warn!("Wu quantization is most effective with 64 or fewer colors");
            }
            if *segmentation_method == SegmentationMethod::Slic {
                if *slic_region_size < 8 {
                    return Err(anyhow::anyhow!("SLIC region size should be at least 8 pixels"));
                }
                if *slic_compactness < 0.1 || *slic_compactness > 100.0 {
                    return Err(anyhow::anyhow!("SLIC compactness should be between 0.1 and 100.0"));
                }
            }
            if *gradient_r2_threshold < 0.5 || *gradient_r2_threshold > 1.0 {
                return Err(anyhow::anyhow!("Gradient R² threshold should be between 0.5 and 1.0"));
            }
            if *max_gradient_stops < 2 {
                return Err(anyhow::anyhow!("Gradient must have at least 2 stops"));
            }
            if *merge_threshold < 0.0 || *simplify < 0.0 {
                return Err(anyhow::anyhow!("Thresholds must be non-negative"));
            }
        }
        _ => {} // No validation needed for other commands
    }
    Ok(())
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize logging
    let log_level = if cli.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(log_level)).init();

    // Configure rayon thread pool if specified
    if let Some(threads) = cli.threads {
        rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build_global()
            .context("Failed to initialize thread pool")?;
        log::info!("Using {} threads for parallel processing", threads);
    }

    // Validate CLI arguments
    validate_cli_arguments(&cli.command)?;

    match cli.command {
        Commands::Logo {
            input,
            output,
            config,
            threshold,
            adaptive,
            detect_primitives,
            primitive_tolerance,
            max_circle_eccentricity,
            simplify,
        } => vectorize_logo_command(
            input,
            output, 
            config,
            threshold,
            adaptive,
            detect_primitives,
            primitive_tolerance,
            max_circle_eccentricity,
            simplify,
        ),
        Commands::Regions {
            input,
            output,
            config,
            colors,
            quantization_method,
            segmentation_method,
            lab_color,
            merge_similar_regions,
            merge_threshold,
            slic_region_size,
            slic_compactness,
            slic_iterations,
            detect_gradients,
            gradient_r2_threshold,
            max_gradient_stops,
            simplify,
        } => vectorize_regions_command(
            input,
            output,
            config,
            colors,
            quantization_method,
            segmentation_method,
            lab_color,
            merge_similar_regions,
            merge_threshold,
            slic_region_size,
            slic_compactness,
            slic_iterations,
            detect_gradients,
            gradient_r2_threshold,
            max_gradient_stops,
            simplify,
        ),
        Commands::TraceLow {
            input,
            output,
            backend,
            detail,
            stroke_width,
            seed,
            stats,
        } => vectorize_trace_low_command(
            input,
            output,
            backend,
            detail,
            stroke_width,
            seed,
            stats,
        ),
        Commands::Benchmark {
            input,
            algorithm,
            iterations,
            output,
        } => benchmark_command(input, algorithm, iterations, output),
        Commands::ComprehensiveBench {
            input,
            iterations,
            output,
            no_debug_images,
            baseline,
        } => comprehensive_benchmark_command(input, iterations, output, !no_debug_images, baseline),
        Commands::Batch {
            input,
            output,
            algorithm,
            config,
            pattern,
            // Logo options
            threshold,
            adaptive,
            detect_primitives,
            primitive_tolerance,
            max_circle_eccentricity,
            // Regions options
            colors,
            quantization_method,
            segmentation_method,
            lab_color,
            merge_similar_regions,
            merge_threshold,
            slic_region_size,
            slic_compactness,
            slic_iterations,
            detect_gradients,
            gradient_r2_threshold,
            max_gradient_stops,
            // Common options
            simplify,
        } => batch_command(
            input, output, algorithm, config, pattern,
            // Logo options
            threshold, adaptive, detect_primitives, primitive_tolerance, max_circle_eccentricity,
            // Regions options
            colors, quantization_method, segmentation_method, lab_color, merge_similar_regions,
            merge_threshold, slic_region_size, slic_compactness, slic_iterations, detect_gradients,
            gradient_r2_threshold, max_gradient_stops,
            // Common options
            simplify,
        ),
    }
}

fn vectorize_trace_low_command(
    input: PathBuf,
    output: PathBuf,
    backend: TraceBackend,
    detail: f32,
    stroke_width: f32,
    seed: u64,
    stats: Option<PathBuf>,
) -> Result<()> {
    log::info!("Loading image: {}", input.display());
    let img = image::open(&input)
        .with_context(|| format!("Failed to open image: {}", input.display()))?
        .to_rgba8();

    // Set seed for reproducible results
    if seed != 0 {
        log::info!("Using seed {} for reproducible results", seed);
        // Note: Seed handling would be implemented when needed for randomized algorithms
    }

    // Create configuration
    let config = TraceLowConfig {
        backend,
        detail,
        stroke_px_at_1080p: stroke_width,
    };

    log::info!("Starting trace-low vectorization with backend {:?}, detail {:.2}", 
               config.backend, config.detail);
    let start_time = Instant::now();

    let svg_content = vectorize_trace_low_rgba(&img, &config)
        .with_context(|| "Trace-low vectorization failed")?;

    let elapsed = start_time.elapsed();
    log::info!("Vectorization completed in {:.2}s", elapsed.as_secs_f64());

    // Write SVG to output file
    fs::write(&output, svg_content)
        .with_context(|| format!("Failed to write SVG to: {}", output.display()))?;

    log::info!("SVG saved to: {}", output.display());

    // Write statistics if requested
    if let Some(stats_path) = stats {
        write_trace_low_stats(&img, &config, elapsed.as_secs_f64(), &stats_path)?;
        log::info!("Statistics saved to: {}", stats_path.display());
    }

    Ok(())
}

fn write_trace_low_stats(
    image: &image::ImageBuffer<image::Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    processing_time: f64,
    output_path: &PathBuf,
) -> Result<()> {
    use std::io::Write;

    let (width, height) = image.dimensions();
    let pixel_count = width as u64 * height as u64;

    // Create CSV header if file doesn't exist
    let write_header = !output_path.exists();
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(output_path)
        .with_context(|| format!("Failed to open stats file: {}", output_path.display()))?;

    if write_header {
        writeln!(
            file,
            "width,height,pixels,backend,detail,stroke_width,processing_time_s,throughput_mpx_per_s"
        )?;
    }

    let throughput = (pixel_count as f64 / 1_000_000.0) / processing_time;
    let backend_str = match config.backend {
        TraceBackend::Edge => "edge",
        TraceBackend::Centerline => "centerline",
        TraceBackend::Superpixel => "superpixel",
    };

    writeln!(
        file,
        "{},{},{},{},{:.3},{:.1},{:.3},{:.2}",
        width,
        height,
        pixel_count,
        backend_str,
        config.detail,
        config.stroke_px_at_1080p,
        processing_time,
        throughput
    )?;

    Ok(())
}

fn vectorize_logo_command(
    input: PathBuf,
    output: PathBuf,
    config_path: Option<PathBuf>,
    threshold: u8,
    adaptive: bool,
    detect_primitives: bool,
    primitive_tolerance: f32,
    max_circle_eccentricity: f32,
    simplify: f64,
) -> Result<()> {
    log::info!("Loading image: {}", input.display());
    let img = image::open(&input)
        .with_context(|| format!("Failed to open image: {}", input.display()))?
        .to_rgba8();

    // Load or create configuration
    let mut config = if let Some(config_path) = config_path {
        load_logo_config(&config_path)?
    } else {
        LogoConfig::default()
    };

    // Override with CLI parameters
    config.threshold = threshold;
    config.adaptive_threshold = adaptive;
    config.detect_primitives = detect_primitives;
    config.primitive_fit_tolerance = primitive_tolerance;
    config.max_circle_eccentricity = max_circle_eccentricity;
    config.simplification_tolerance = simplify;

    log::info!("Starting logo vectorization with config: {:?}", config);
    let start_time = Instant::now();

    let svg_content =
        vectorize_logo_rgba(&img, &config).with_context(|| "Logo vectorization failed")?;

    let elapsed = start_time.elapsed();
    log::info!("Vectorization completed in {:.2}s", elapsed.as_secs_f64());

    // Write SVG to output file
    fs::write(&output, svg_content)
        .with_context(|| format!("Failed to write SVG to: {}", output.display()))?;

    log::info!("SVG saved to: {}", output.display());
    Ok(())
}

fn vectorize_regions_command(
    input: PathBuf,
    output: PathBuf,
    config_path: Option<PathBuf>,
    colors: u32,
    quantization_method: QuantizationMethod,
    segmentation_method: SegmentationMethod,
    lab_color: bool,
    merge_similar_regions: bool,
    merge_threshold: f64,
    slic_region_size: u32,
    slic_compactness: f32,
    slic_iterations: u32,
    detect_gradients: bool,
    gradient_r2_threshold: f64,
    max_gradient_stops: usize,
    simplify: f64,
) -> Result<()> {
    log::info!("Loading image: {}", input.display());
    let img = image::open(&input)
        .with_context(|| format!("Failed to open image: {}", input.display()))?
        .to_rgba8();

    // Load or create configuration
    let mut config = if let Some(config_path) = config_path {
        load_regions_config(&config_path)?
    } else {
        RegionsConfig::default()
    };

    // Override with CLI parameters
    config.num_colors = colors;
    config.quantization_method = quantization_method;
    config.segmentation_method = segmentation_method;
    config.use_lab_color = lab_color;
    config.merge_similar_regions = merge_similar_regions;
    config.merge_threshold = merge_threshold;
    config.slic_region_size = slic_region_size;
    config.slic_compactness = slic_compactness;
    config.slic_iterations = slic_iterations;
    config.detect_gradients = detect_gradients;
    config.gradient_r_squared_threshold = gradient_r2_threshold;
    config.max_gradient_stops = max_gradient_stops;
    config.simplification_tolerance = simplify;

    log::info!("Starting regions vectorization with config: {:?}", config);
    let start_time = Instant::now();

    let svg_content =
        vectorize_regions_rgba(&img, &config).with_context(|| "Regions vectorization failed")?;

    let elapsed = start_time.elapsed();
    log::info!("Vectorization completed in {:.2}s", elapsed.as_secs_f64());

    // Write SVG to output file
    fs::write(&output, svg_content)
        .with_context(|| format!("Failed to write SVG to: {}", output.display()))?;

    log::info!("SVG saved to: {}", output.display());
    Ok(())
}

fn benchmark_command(
    input: PathBuf,
    algorithm: String,
    iterations: usize,
    output: Option<PathBuf>,
) -> Result<()> {
    log::info!("Starting benchmark with {} iterations", iterations);

    // Load test image
    let img = image::open(&input)
        .with_context(|| format!("Failed to open image: {}", input.display()))?
        .to_rgba8();

    let (width, height) = img.dimensions();
    log::info!("Image dimensions: {}x{}", width, height);

    let mut results = Vec::new();

    if algorithm == "logo" || algorithm == "both" {
        let config = LogoConfig::default();
        let times = benchmark_logo(&img, &config, iterations)?;
        results.push(BenchmarkResult {
            algorithm: "logo".to_string(),
            iterations,
            times,
            image_size: (width, height),
        });
    }

    if algorithm == "regions" || algorithm == "both" {
        let config = RegionsConfig::default();
        let times = benchmark_regions(&img, &config, iterations)?;
        results.push(BenchmarkResult {
            algorithm: "regions".to_string(),
            iterations,
            times,
            image_size: (width, height),
        });
    }

    // Print results
    for result in &results {
        result.print_summary();
    }

    // Save results if requested
    if let Some(output_path) = output {
        let json = serde_json::to_string_pretty(&results)
            .context("Failed to serialize benchmark results")?;
        fs::write(&output_path, json)
            .with_context(|| format!("Failed to write results to: {}", output_path.display()))?;
        log::info!("Benchmark results saved to: {}", output_path.display());
    }

    Ok(())
}

fn batch_command(
    input: PathBuf,
    output: PathBuf,
    algorithm: String,
    config_path: Option<PathBuf>,
    pattern: String,
    // Logo options
    threshold: u8,
    adaptive: bool,
    detect_primitives: bool,
    primitive_tolerance: f32,
    max_circle_eccentricity: f32,
    // Regions options
    colors: u32,
    quantization_method: QuantizationMethod,
    segmentation_method: SegmentationMethod,
    lab_color: bool,
    merge_similar_regions: bool,
    merge_threshold: f64,
    slic_region_size: u32,
    slic_compactness: f32,
    slic_iterations: u32,
    detect_gradients: bool,
    gradient_r2_threshold: f64,
    max_gradient_stops: usize,
    // Common options
    simplify: f64,
) -> Result<()> {
    log::info!(
        "Batch processing from {} to {} using {} algorithm",
        input.display(),
        output.display(),
        algorithm
    );

    // Create output directory if it doesn't exist
    fs::create_dir_all(&output)
        .with_context(|| format!("Failed to create output directory: {}", output.display()))?;

    // Find all matching image files in input directory
    let image_files = find_image_files(&input, &pattern)?;
    if image_files.is_empty() {
        return Err(anyhow::anyhow!(
            "No image files found in {} matching pattern '{}'", 
            input.display(), 
            pattern
        ));
    }

    log::info!("Found {} image files to process", image_files.len());

    let mut successful = 0;
    let mut failed = 0;

    for image_file in image_files {
        let file_name = image_file
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(|| anyhow::anyhow!("Invalid filename: {}", image_file.display()))?;

        let output_file = output.join(format!("{}.svg", file_name));

        log::info!("Processing: {} -> {}", image_file.display(), output_file.display());

        let result = match algorithm.as_str() {
            "logo" => vectorize_logo_command(
                image_file.clone(),
                output_file,
                config_path.clone(),
                threshold,
                adaptive,
                detect_primitives,
                primitive_tolerance,
                max_circle_eccentricity,
                simplify,
            ),
            "regions" => vectorize_regions_command(
                image_file.clone(),
                output_file,
                config_path.clone(),
                colors,
                quantization_method.clone(),
                segmentation_method.clone(),
                lab_color,
                merge_similar_regions,
                merge_threshold,
                slic_region_size,
                slic_compactness,
                slic_iterations,
                detect_gradients,
                gradient_r2_threshold,
                max_gradient_stops,
                simplify,
            ),
            _ => return Err(anyhow::anyhow!("Invalid algorithm '{}'. Use 'logo' or 'regions'", algorithm)),
        };

        match result {
            Ok(_) => {
                successful += 1;
                log::info!("Successfully processed: {}", image_file.display());
            }
            Err(e) => {
                failed += 1;
                log::error!("Failed to process {}: {}", image_file.display(), e);
            }
        }
    }

    log::info!(
        "Batch processing complete: {} successful, {} failed",
        successful, failed
    );

    if failed > 0 {
        Err(anyhow::anyhow!("{} files failed to process", failed))
    } else {
        Ok(())
    }
}

/// Find image files in a directory matching the given pattern
fn find_image_files(dir: &PathBuf, pattern: &str) -> Result<Vec<PathBuf>> {
    let mut image_files = Vec::new();
    
    if !dir.is_dir() {
        return Err(anyhow::anyhow!("Input path is not a directory: {}", dir.display()));
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        
        if !path.is_file() {
            continue;
        }

        // Check file extension for image types
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            match ext.to_lowercase().as_str() {
                "png" | "jpg" | "jpeg" | "webp" => {
                    // Simple pattern matching - for now just check if pattern is "*" or matches the filename
                    if pattern == "*" {
                        image_files.push(path);
                    } else if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                        // Simple pattern matching - you could extend this with proper glob matching
                        if file_name.contains(pattern.trim_matches('*')) {
                            image_files.push(path);
                        }
                    }
                }
                _ => {}
            }
        }
    }

    // Sort files for consistent processing order
    image_files.sort();
    Ok(image_files)
}

fn load_logo_config(path: &PathBuf) -> Result<LogoConfig> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("Failed to read config file: {}", path.display()))?;
    let config: LogoConfig = serde_json::from_str(&content)
        .with_context(|| format!("Failed to parse config file: {}", path.display()))?;
    Ok(config)
}

fn load_regions_config(path: &PathBuf) -> Result<RegionsConfig> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("Failed to read config file: {}", path.display()))?;
    let config: RegionsConfig = serde_json::from_str(&content)
        .with_context(|| format!("Failed to parse config file: {}", path.display()))?;
    Ok(config)
}

fn benchmark_logo(
    img: &image::ImageBuffer<image::Rgba<u8>, Vec<u8>>,
    config: &LogoConfig,
    iterations: usize,
) -> Result<Vec<f64>> {
    let mut times = Vec::with_capacity(iterations);

    for i in 0..iterations {
        log::debug!("Logo benchmark iteration {}/{}", i + 1, iterations);
        let start = Instant::now();

        vectorize_logo_rgba(img, config).context("Logo vectorization failed during benchmark")?;

        times.push(start.elapsed().as_secs_f64());
    }

    Ok(times)
}

fn benchmark_regions(
    img: &image::ImageBuffer<image::Rgba<u8>, Vec<u8>>,
    config: &RegionsConfig,
    iterations: usize,
) -> Result<Vec<f64>> {
    let mut times = Vec::with_capacity(iterations);

    for i in 0..iterations {
        log::debug!("Regions benchmark iteration {}/{}", i + 1, iterations);
        let start = Instant::now();

        vectorize_regions_rgba(img, config)
            .context("Regions vectorization failed during benchmark")?;

        times.push(start.elapsed().as_secs_f64());
    }

    Ok(times)
}

#[derive(serde::Serialize, serde::Deserialize)]
struct BenchmarkResult {
    algorithm: String,
    iterations: usize,
    times: Vec<f64>,
    image_size: (u32, u32),
}

impl BenchmarkResult {
    fn print_summary(&self) {
        let mean = self.times.iter().sum::<f64>() / self.times.len() as f64;
        let min = self.times.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max = self.times.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));

        let variance =
            self.times.iter().map(|&x| (x - mean).powi(2)).sum::<f64>() / self.times.len() as f64;
        let std_dev = variance.sqrt();

        println!(
            "\n{} Algorithm Benchmark Results:",
            self.algorithm.to_uppercase()
        );
        println!("Image size: {}x{}", self.image_size.0, self.image_size.1);
        println!("Iterations: {}", self.iterations);
        println!("Mean time: {:.3}s", mean);
        println!("Min time:  {:.3}s", min);
        println!("Max time:  {:.3}s", max);
        println!("Std dev:   {:.3}s", std_dev);

        let pixels = self.image_size.0 as f64 * self.image_size.1 as f64;
        let mpixels_per_sec = (pixels / 1_000_000.0) / mean;
        println!("Throughput: {:.2} megapixels/second", mpixels_per_sec);
    }
}

/// Run comprehensive benchmark suite with SSIM and SVG analysis
fn comprehensive_benchmark_command(
    input_paths: Vec<PathBuf>,
    iterations: usize,
    output_dir: PathBuf,
    save_debug_images: bool,
    baseline_path: Option<PathBuf>,
) -> Result<()> {
    log::info!("Starting comprehensive benchmark suite");
    
    // Collect test images from input paths
    let mut test_images = Vec::new();
    for input_path in input_paths {
        if input_path.is_file() {
            // Single image file
            test_images.push(input_path);
        } else if input_path.is_dir() {
            // Directory - find all image files
            for entry in fs::read_dir(&input_path)? {
                let entry = entry?;
                let path = entry.path();
                if path.is_file() {
                    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                        match ext.to_lowercase().as_str() {
                            "png" | "jpg" | "jpeg" | "webp" => {
                                test_images.push(path);
                            }
                            _ => {}
                        }
                    }
                }
            }
        } else {
            log::warn!("Input path does not exist: {}", input_path.display());
        }
    }

    if test_images.is_empty() {
        return Err(anyhow::anyhow!("No test images found in input paths"));
    }

    log::info!("Found {} test images", test_images.len());

    // Create benchmark configuration
    let config = BenchmarkConfig {
        iterations,
        test_images,
        output_dir: output_dir.clone(),
        save_debug_images,
        baseline_config: None, // TODO: Load baseline if provided
    };

    // Run benchmark suite
    let suite = BenchmarkSuite::new(config);
    let report = suite.run_full_benchmark()
        .context("Comprehensive benchmark failed")?;

    // Print summary to console
    print_comprehensive_summary(&report);

    // Save detailed reports
    suite.save_report(&report)
        .context("Failed to save benchmark report")?;

    // Load and compare with baseline if provided
    if let Some(baseline_path) = baseline_path {
        match load_baseline_report(&baseline_path) {
            Ok(baseline_report) => {
                print_baseline_comparison(&report, &baseline_report);
            }
            Err(e) => {
                log::warn!("Failed to load baseline report: {}", e);
            }
        }
    }

    Ok(())
}

/// Print comprehensive benchmark summary to console
fn print_comprehensive_summary(report: &BenchmarkReport) {
    println!("\n=== COMPREHENSIVE BENCHMARK RESULTS ===");
    println!("Total Tests: {}", report.summary.total_tests);
    println!("Tests Passed: {} ({:.1}% pass rate)", 
             report.summary.tests_passed, report.summary.pass_rate);
    println!("Average SSIM: {:.3} (target ≥ 0.92)", report.summary.avg_ssim);
    
    if let Some(node_growth) = report.summary.avg_node_growth {
        println!("Average Node Growth: {:.1}% (target ≤ 40%)", node_growth);
    }
    
    println!("Average Processing Time: {:.3}s", report.summary.avg_processing_time);
    
    // Research targets summary
    let ssim_pass_rate = report.results.iter()
        .filter(|r| r.ssim.meets_target())
        .count() as f64 / report.results.len() as f64 * 100.0;
    
    println!("\n=== RESEARCH TARGETS ===");
    println!("SSIM Target (≥ 0.92): {:.1}% pass rate", ssim_pass_rate);
    
    if report.results.iter().any(|r| r.comparison.is_some()) {
        let node_pass_rate = report.results.iter()
            .filter(|r| r.comparison.as_ref().map(|c| c.meets_node_target).unwrap_or(true))
            .count() as f64 / report.results.len() as f64 * 100.0;
        println!("Node Count Target (≤ 40% growth): {:.1}% pass rate", node_pass_rate);
    }

    println!("\n=== TOP PERFORMING CONFIGURATIONS ===");
    let mut sorted_results = report.results.clone();
    sorted_results.sort_by(|a, b| b.ssim.ssim.partial_cmp(&a.ssim.ssim).unwrap_or(std::cmp::Ordering::Equal));
    
    for (i, result) in sorted_results.iter().take(5).enumerate() {
        println!("{}. {} | {} | {} | SSIM: {:.3} | Time: {:.2}s", 
                 i + 1,
                 result.image_name,
                 result.algorithm,
                 result.config_name,
                 result.ssim.ssim,
                 result.timing.mean_time);
    }

    println!("\nDetailed reports saved to: {}", report.config.output_dir.display());
}

/// Load baseline benchmark report for comparison
fn load_baseline_report(baseline_path: &std::path::Path) -> Result<BenchmarkReport> {
    let content = fs::read_to_string(baseline_path)
        .context("Failed to read baseline report file")?;
    let report: BenchmarkReport = serde_json::from_str(&content)
        .context("Failed to parse baseline report JSON")?;
    Ok(report)
}

/// Print comparison with baseline results
fn print_baseline_comparison(current: &BenchmarkReport, baseline: &BenchmarkReport) {
    println!("\n=== BASELINE COMPARISON ===");
    
    let current_avg_ssim = current.summary.avg_ssim;
    let baseline_avg_ssim = baseline.summary.avg_ssim;
    let ssim_change = ((current_avg_ssim - baseline_avg_ssim) / baseline_avg_ssim) * 100.0;
    
    println!("SSIM Change: {:.3} -> {:.3} ({:+.1}%)", 
             baseline_avg_ssim, current_avg_ssim, ssim_change);
    
    let current_time = current.summary.avg_processing_time;
    let baseline_time = baseline.summary.avg_processing_time;
    let time_change = ((current_time - baseline_time) / baseline_time) * 100.0;
    
    println!("Processing Time Change: {:.3}s -> {:.3}s ({:+.1}%)", 
             baseline_time, current_time, time_change);
    
    let current_pass_rate = current.summary.pass_rate;
    let baseline_pass_rate = baseline.summary.pass_rate;
    
    println!("Pass Rate Change: {:.1}% -> {:.1}% ({:+.1} points)", 
             baseline_pass_rate, current_pass_rate, current_pass_rate - baseline_pass_rate);
}

/// Parse quantization method from string
fn parse_quantization_method(s: &str) -> Result<QuantizationMethod, String> {
    match s.to_lowercase().as_str() {
        "kmeans" => Ok(QuantizationMethod::KMeans),
        "wu" => Ok(QuantizationMethod::Wu),
        _ => Err(format!(
            "Invalid quantization method '{}'. Valid options: kmeans, wu",
            s
        )),
    }
}

/// Parse segmentation method from string  
fn parse_segmentation_method(s: &str) -> Result<SegmentationMethod, String> {
    match s.to_lowercase().as_str() {
        "kmeans" => Ok(SegmentationMethod::KMeans),
        "slic" => Ok(SegmentationMethod::Slic),
        _ => Err(format!(
            "Invalid segmentation method '{}'. Valid options: kmeans, slic",
            s
        )),
    }
}

/// Parse trace backend from string
fn parse_trace_backend(s: &str) -> Result<TraceBackend, String> {
    match s.to_lowercase().as_str() {
        "edge" => Ok(TraceBackend::Edge),
        "centerline" => Ok(TraceBackend::Centerline),
        "superpixel" => Ok(TraceBackend::Superpixel),
        _ => Err(format!(
            "Invalid trace backend '{}'. Valid options: edge, centerline, superpixel",
            s
        )),
    }
}
