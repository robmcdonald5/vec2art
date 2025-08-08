//! Command-line interface for vectorize-core
//!
//! This CLI tool provides a way to test and benchmark the vectorization algorithms
//! with various input images and configuration parameters.

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use vectorize_core::{vectorize_logo_rgba, vectorize_regions_rgba, LogoConfig, RegionsConfig};

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

        /// Use LAB color space
        #[arg(long)]
        lab_color: bool,

        /// Simplification tolerance
        #[arg(long, default_value = "1.0")]
        simplify: f64,
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

    /// Batch process multiple images
    Batch {
        /// Input directory
        #[arg(short, long)]
        input: PathBuf,

        /// Output directory
        #[arg(short, long)]
        output: PathBuf,

        /// Algorithm to use (logo or regions)
        #[arg(long, default_value = "logo")]
        algorithm: String,

        /// Configuration JSON file (optional)
        #[arg(short, long)]
        config: Option<PathBuf>,

        /// File pattern to match (e.g., "*.png")
        #[arg(long, default_value = "*")]
        pattern: String,
    },
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

    match cli.command {
        Commands::Logo {
            input,
            output,
            config,
            threshold,
            adaptive,
            simplify,
        } => vectorize_logo_command(input, output, config, threshold, adaptive, simplify),
        Commands::Regions {
            input,
            output,
            config,
            colors,
            lab_color,
            simplify,
        } => vectorize_regions_command(input, output, config, colors, lab_color, simplify),
        Commands::Benchmark {
            input,
            algorithm,
            iterations,
            output,
        } => benchmark_command(input, algorithm, iterations, output),
        Commands::Batch {
            input,
            output,
            algorithm,
            config,
            pattern,
        } => batch_command(input, output, algorithm, config, pattern),
    }
}

fn vectorize_logo_command(
    input: PathBuf,
    output: PathBuf,
    config_path: Option<PathBuf>,
    threshold: u8,
    adaptive: bool,
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
    lab_color: bool,
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
    config.use_lab_color = lab_color;
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
    _algorithm: String,
    _config_path: Option<PathBuf>,
    _pattern: String,
) -> Result<()> {
    log::info!(
        "Batch processing from {} to {}",
        input.display(),
        output.display()
    );

    // Create output directory if it doesn't exist
    fs::create_dir_all(&output)
        .with_context(|| format!("Failed to create output directory: {}", output.display()))?;

    // TODO: Implement batch processing
    // - Find all matching image files in input directory
    // - Process each image with specified algorithm and config
    // - Save results to output directory with same name but .svg extension

    log::warn!("Batch processing is not yet implemented");
    Ok(())
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
