//! Phase A Benchmark Harness
//!
//! Comprehensive benchmark validation system for Phase A improvements as specified
//! in the vec2art roadmap. This harness validates:
//!
//! - **ΔE**: Calculate median ΔE* (Lab) between original and rasterized SVG (target: ≤ 6.0)
//! - **SSIM**: Calculate structural similarity (grayscale SSIM, target: ≥ 0.93)
//! - **Runtime**: Measure wall-clock time per stage and total (target: ≤ 2.5s for 1024px)
//! - **SVG Stats**: Count paths, avg control points/path, gradients
//!
//! Provides automated testing across different presets and images with baseline comparisons.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use vectorize_core::{
    vectorize_logo_rgba, vectorize_regions_rgba, vectorize_trace_low_rgba,
    LogoConfig, RegionsConfig, TraceLowConfig, TraceBackend,
};
use vectorize_core::preprocessing::{rgb_to_lab, lab_distance};

use crate::ssim::{SsimResult, calculate_svg_ssim};
use crate::svg_analysis::{SvgMetrics, analyze_svg};

/// Core Phase A benchmark configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseABenchmarkConfig {
    /// Test images with their expected characteristics
    pub test_images: Vec<TestImageSpec>,
    /// Output directory for results and debug artifacts
    pub output_dir: PathBuf,
    /// Number of timing iterations for stable measurements
    pub timing_iterations: usize,
    /// Save debug images for visual inspection
    pub save_debug_images: bool,
    /// Quality thresholds from roadmap
    pub quality_thresholds: QualityThresholds,
    /// Baseline results for comparison (if any)
    pub baseline_results: Option<PathBuf>,
}

/// Test image specification with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestImageSpec {
    pub path: PathBuf,
    pub name: String,
    pub category: ImageCategory,
    pub expected_size_px: u32, // Long edge size for scaling
}

/// Image category for targeted testing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImageCategory {
    Photo,
    Logo,
    Icon,
    Illustration,
    NoisyWeb,
    Gradient,
}

/// Quality thresholds from roadmap specifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityThresholds {
    /// Maximum median ΔE* (Lab) target
    pub max_delta_e: f64,
    /// Minimum SSIM target
    pub min_ssim: f64,
    /// Maximum processing time for 1024px images (seconds)
    pub max_processing_time: f64,
}

impl Default for QualityThresholds {
    fn default() -> Self {
        Self {
            max_delta_e: 6.0,  // Roadmap target: ≤ 6.0
            min_ssim: 0.93,    // Roadmap target: ≥ 0.93
            max_processing_time: 2.5,  // Roadmap target: ≤ 2.5s for 1024px
        }
    }
}

/// Comprehensive benchmark result for Phase A validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseAResult {
    pub image_spec: TestImageSpec,
    pub algorithm: String,
    pub preset_name: String,
    pub config_snapshot: serde_json::Value,
    
    // Core quality metrics
    pub delta_e_metrics: DeltaEMetrics,
    pub ssim_result: SsimResult,
    pub timing_metrics: TimingMetrics,
    pub svg_metrics: SvgMetrics,
    
    // Target validation
    pub meets_delta_e_target: bool,
    pub meets_ssim_target: bool,
    pub meets_timing_target: bool,
    pub overall_pass: bool,
    
    // Optional baseline comparison
    pub baseline_comparison: Option<BaselineComparison>,
}

/// ΔE metrics in LAB color space
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeltaEMetrics {
    /// Per-pixel ΔE values
    pub per_pixel_delta_e: Vec<f64>,
    /// Median ΔE* (primary target metric)
    pub median_delta_e: f64,
    /// Mean ΔE* for additional insight
    pub mean_delta_e: f64,
    /// 95th percentile ΔE (outlier detection)
    pub p95_delta_e: f64,
    /// Maximum ΔE observed
    pub max_delta_e: f64,
    /// Percentage of pixels below threshold
    pub pixels_below_threshold: f64,
}

/// Stage-by-stage timing breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingMetrics {
    /// Individual timing runs in seconds
    pub timing_samples: Vec<f64>,
    /// Mean processing time
    pub mean_time: f64,
    /// Median processing time
    pub median_time: f64,
    /// Standard deviation
    pub std_dev: f64,
    /// Throughput in megapixels per second
    pub throughput_mpps: f64,
    /// Per-stage breakdown (if available)
    pub stage_breakdown: HashMap<String, f64>,
}

/// Comparison with baseline results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaselineComparison {
    pub delta_e_improvement: f64,
    pub ssim_improvement: f64,
    pub timing_ratio: f64, // new_time / baseline_time
    pub svg_size_ratio: f64,
    pub quality_improved: bool,
    pub performance_maintained: bool,
}

/// Main Phase A benchmark suite
pub struct PhaseABenchmarkSuite {
    config: PhaseABenchmarkConfig,
}

impl Default for PhaseABenchmarkConfig {
    fn default() -> Self {
        Self {
            test_images: Vec::new(),
            output_dir: PathBuf::from("phase_a_benchmark_results"),
            timing_iterations: 5,
            save_debug_images: true,
            quality_thresholds: QualityThresholds::default(),
            baseline_results: None,
        }
    }
}

impl PhaseABenchmarkSuite {
    pub fn new(config: PhaseABenchmarkConfig) -> Self {
        Self { config }
    }
    
    pub fn config(&self) -> &PhaseABenchmarkConfig {
        &self.config
    }

    /// Auto-discover test images from examples directory
    pub fn auto_discover_test_images(&mut self, examples_dir: &Path) -> Result<()> {
        let images_dir = examples_dir.join("images_in");
        
        if !images_dir.exists() {
            return Err(anyhow::anyhow!("Images directory not found: {}", images_dir.display()));
        }

        // Define test image specifications
        let test_specs = vec![
            ("test1.png", ImageCategory::Photo, 1024),
            ("test2.png", ImageCategory::Photo, 1024),
            ("test3.png", ImageCategory::Photo, 1024),
            ("test_shapes.png", ImageCategory::Icon, 512),
            ("test_gradient.png", ImageCategory::Gradient, 512),
            ("test_checkerboard.png", ImageCategory::Icon, 512),
            ("Pirate-Flag.png", ImageCategory::Logo, 1024),
            ("Little-Red-Devil.webp", ImageCategory::Illustration, 1024),
            ("Peileppe_Rogue_character.webp", ImageCategory::Illustration, 1024),
        ];

        self.config.test_images.clear();
        
        for (filename, category, expected_size) in test_specs {
            let path = images_dir.join(filename);
            if path.exists() {
                self.config.test_images.push(TestImageSpec {
                    path,
                    name: filename.to_string(),
                    category,
                    expected_size_px: expected_size,
                });
            } else {
                log::warn!("Test image not found: {}", path.display());
            }
        }

        log::info!("Auto-discovered {} test images", self.config.test_images.len());
        Ok(())
    }

    /// Run comprehensive Phase A benchmark
    pub fn run_phase_a_benchmark(&self) -> Result<PhaseABenchmarkReport> {
        log::info!("Starting Phase A benchmark validation");
        fs::create_dir_all(&self.config.output_dir)?;

        let mut all_results = Vec::new();

        // Test different algorithm presets that represent Phase A improvements
        let test_presets = self.define_phase_a_presets();

        for preset in test_presets {
            log::info!("Testing preset: {}", preset.name);
            
            for image_spec in &self.config.test_images {
                log::info!("  Processing image: {}", image_spec.name);
                
                let result = self.benchmark_single_preset(&preset, image_spec)
                    .with_context(|| format!("Failed to benchmark {} with {}", image_spec.name, preset.name))?;
                
                all_results.push(result);
            }
        }

        // Generate comprehensive report
        let report = self.generate_phase_a_report(all_results)?;
        
        log::info!("Phase A benchmark completed: {}/{} tests passed overall targets", 
                  report.summary.tests_passed, report.summary.total_tests);

        Ok(report)
    }

    /// Define Phase A algorithm presets for testing
    fn define_phase_a_presets(&self) -> Vec<AlgorithmPreset> {
        vec![
            // Logo mode presets
            AlgorithmPreset {
                name: "logo_default".to_string(),
                algorithm: AlgorithmType::Logo(LogoConfig::default()),
            },
            AlgorithmPreset {
                name: "logo_high_precision".to_string(),
                algorithm: AlgorithmType::Logo(LogoConfig {
                    simplification_epsilon: vectorize_core::Epsilon::Pixels(0.5),
                    curve_tolerance: 0.8,
                    fit_curves: true,
                    ..LogoConfig::default()
                }),
            },
            // Regions mode presets (Phase A focus)
            AlgorithmPreset {
                name: "regions_photo".to_string(),
                algorithm: AlgorithmType::Regions(RegionsConfig {
                    num_colors: 24,
                    use_lab_color: true,
                    merge_similar_regions: true,
                    de_merge_threshold: 2.0, // ΔE threshold for merging
                    simplification_epsilon: vectorize_core::Epsilon::Pixels(1.0),
                    fit_curves: true,
                    curve_tolerance: 1.5,
                    ..RegionsConfig::default()
                }),
            },
            AlgorithmPreset {
                name: "regions_posterized".to_string(),
                algorithm: AlgorithmType::Regions(RegionsConfig {
                    num_colors: 12,
                    use_lab_color: true,
                    merge_similar_regions: true,
                    de_merge_threshold: 3.0,
                    simplification_epsilon: vectorize_core::Epsilon::Pixels(1.5),
                    fit_curves: true,
                    ..RegionsConfig::default()
                }),
            },
            // Trace-low mode (fast processing)
            AlgorithmPreset {
                name: "trace_low_edge".to_string(),
                algorithm: AlgorithmType::TraceLow(TraceLowConfig {
                    backend: TraceBackend::Edge,
                    detail: 0.3,
                    stroke_px_at_1080p: 1.2,
                }),
            },
        ]
    }

    /// Benchmark a single preset against one image
    fn benchmark_single_preset(
        &self,
        preset: &AlgorithmPreset,
        image_spec: &TestImageSpec,
    ) -> Result<PhaseAResult> {
        // Load and prepare image
        let img = image::open(&image_spec.path)
            .with_context(|| format!("Failed to load test image: {}", image_spec.path.display()))?
            .to_rgba8();

        // Scale image to expected size if needed
        let img = self.scale_image_if_needed(img, image_spec.expected_size_px);

        // Collect timing samples
        let mut timing_samples = Vec::with_capacity(self.config.timing_iterations);
        let mut svg_content = String::new();

        for i in 0..self.config.timing_iterations {
            let start = Instant::now();
            
            svg_content = match &preset.algorithm {
                AlgorithmType::Logo(config) => {
                    vectorize_logo_rgba(&img, config)
                        .context("Logo vectorization failed")?
                },
                AlgorithmType::Regions(config) => {
                    vectorize_regions_rgba(&img, config)
                        .context("Regions vectorization failed")?
                },
                AlgorithmType::TraceLow(config) => {
                    vectorize_trace_low_rgba(&img, config)
                        .context("TraceLow vectorization failed")?
                },
            };

            timing_samples.push(start.elapsed().as_secs_f64());
            
            // Only need to generate SVG once, but we measure timing multiple times
            if i == 0 {
                log::debug!("Generated SVG with {} characters", svg_content.len());
            }
        }

        // Calculate quality metrics
        let delta_e_metrics = self.calculate_delta_e_metrics(&img, &svg_content)?;
        let ssim_result = calculate_svg_ssim(&img, &svg_content)
            .context("SSIM calculation failed")?;
        let timing_metrics = self.calculate_timing_metrics(timing_samples, &img);
        let svg_metrics = analyze_svg(&svg_content)
            .context("SVG analysis failed")?;

        // Validate against targets
        let meets_delta_e_target = delta_e_metrics.median_delta_e <= self.config.quality_thresholds.max_delta_e;
        let meets_ssim_target = ssim_result.ssim >= self.config.quality_thresholds.min_ssim;
        let meets_timing_target = timing_metrics.median_time <= self.config.quality_thresholds.max_processing_time;
        let overall_pass = meets_delta_e_target && meets_ssim_target && meets_timing_target;

        // Save debug images if requested
        if self.config.save_debug_images {
            self.save_debug_images(&img, &svg_content, image_spec, &preset.name)?;
        }

        // Create config snapshot for reproducibility
        let config_snapshot = match &preset.algorithm {
            AlgorithmType::Logo(config) => serde_json::to_value(config)?,
            AlgorithmType::Regions(config) => serde_json::to_value(config)?,
            AlgorithmType::TraceLow(config) => serde_json::to_value(config)?,
        };

        Ok(PhaseAResult {
            image_spec: image_spec.clone(),
            algorithm: preset.algorithm.name(),
            preset_name: preset.name.clone(),
            config_snapshot,
            delta_e_metrics,
            ssim_result,
            timing_metrics,
            svg_metrics,
            meets_delta_e_target,
            meets_ssim_target,
            meets_timing_target,
            overall_pass,
            baseline_comparison: None, // TODO: Implement baseline loading
        })
    }

    /// Calculate comprehensive ΔE metrics in LAB color space
    fn calculate_delta_e_metrics(
        &self,
        original: &image::RgbaImage,
        svg_content: &str,
    ) -> Result<DeltaEMetrics> {
        // Rasterize SVG to match original dimensions
        let rendered = self.rasterize_svg(svg_content, original.dimensions())?;

        // Calculate per-pixel ΔE in LAB color space
        let mut per_pixel_delta_e = Vec::new();
        let (width, height) = original.dimensions();

        for y in 0..height {
            for x in 0..width {
                let orig_pixel = original.get_pixel(x, y);
                let rend_pixel = rendered.get_pixel(x, y);

                // Convert to LAB color space (ignore alpha for now)
                let orig_lab = rgb_to_lab(orig_pixel[0], orig_pixel[1], orig_pixel[2]);
                let rend_lab = rgb_to_lab(rend_pixel[0], rend_pixel[1], rend_pixel[2]);

                // Calculate CIE76 ΔE* (simple Euclidean distance in LAB)
                let delta_e = lab_distance(orig_lab, rend_lab) as f64;
                per_pixel_delta_e.push(delta_e);
            }
        }

        // Calculate statistical metrics
        per_pixel_delta_e.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        
        let median_delta_e = per_pixel_delta_e[per_pixel_delta_e.len() / 2];
        let mean_delta_e = per_pixel_delta_e.iter().sum::<f64>() / per_pixel_delta_e.len() as f64;
        let p95_index = (per_pixel_delta_e.len() as f64 * 0.95) as usize;
        let p95_delta_e = per_pixel_delta_e[p95_index.min(per_pixel_delta_e.len() - 1)];
        let max_delta_e = per_pixel_delta_e[per_pixel_delta_e.len() - 1];

        let pixels_below_threshold = per_pixel_delta_e.iter()
            .filter(|&&de| de <= self.config.quality_thresholds.max_delta_e)
            .count() as f64 / per_pixel_delta_e.len() as f64 * 100.0;

        Ok(DeltaEMetrics {
            per_pixel_delta_e,
            median_delta_e,
            mean_delta_e,
            p95_delta_e,
            max_delta_e,
            pixels_below_threshold,
        })
    }

    /// Calculate timing metrics with statistical analysis
    fn calculate_timing_metrics(
        &self,
        timing_samples: Vec<f64>,
        image: &image::RgbaImage,
    ) -> TimingMetrics {
        let mut sorted_samples = timing_samples.clone();
        sorted_samples.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

        let mean_time = timing_samples.iter().sum::<f64>() / timing_samples.len() as f64;
        let median_time = sorted_samples[sorted_samples.len() / 2];
        
        let variance = timing_samples.iter()
            .map(|&x| (x - mean_time).powi(2))
            .sum::<f64>() / timing_samples.len() as f64;
        let std_dev = variance.sqrt();

        let image_pixels = image.width() as u64 * image.height() as u64;
        let throughput_mpps = (image_pixels as f64 / 1_000_000.0) / mean_time;

        TimingMetrics {
            timing_samples,
            mean_time,
            median_time,
            std_dev,
            throughput_mpps,
            stage_breakdown: HashMap::new(), // TODO: Implement stage timing
        }
    }

    /// Rasterize SVG to image for comparison
    fn rasterize_svg(
        &self,
        svg_content: &str,
        dimensions: (u32, u32),
    ) -> Result<image::RgbaImage> {
        let (width, height) = dimensions;
        
        // Parse SVG
        let options = usvg::Options::default();
        let tree = usvg::Tree::from_str(svg_content, &options)
            .context("Failed to parse SVG for rasterization")?;

        // Create pixmap for rendering
        let mut pixmap = tiny_skia::Pixmap::new(width, height)
            .context("Failed to create pixmap for SVG rasterization")?;

        // Render SVG to pixmap
        resvg::render(
            &tree,
            tiny_skia::Transform::identity(),
            &mut pixmap.as_mut(),
        );

        // Convert pixmap to RgbaImage
        let mut img = image::RgbaImage::new(width, height);
        for (i, pixel) in pixmap.data().chunks_exact(4).enumerate() {
            let x = i as u32 % width;
            let y = i as u32 / width;
            
            if x < width && y < height {
                // Convert BGRA to RGBA
                img.put_pixel(x, y, image::Rgba([pixel[2], pixel[1], pixel[0], pixel[3]]));
            }
        }

        Ok(img)
    }

    /// Scale image to target size if needed
    fn scale_image_if_needed(
        &self,
        img: image::RgbaImage,
        target_long_edge: u32,
    ) -> image::RgbaImage {
        let (width, height) = img.dimensions();
        let current_long_edge = width.max(height);

        if current_long_edge == target_long_edge {
            return img;
        }

        let scale_factor = target_long_edge as f64 / current_long_edge as f64;
        let new_width = (width as f64 * scale_factor) as u32;
        let new_height = (height as f64 * scale_factor) as u32;

        image::imageops::resize(&img, new_width, new_height, image::imageops::FilterType::Lanczos3)
    }

    /// Save debug images for visual inspection
    fn save_debug_images(
        &self,
        original: &image::RgbaImage,
        svg_content: &str,
        image_spec: &TestImageSpec,
        preset_name: &str,
    ) -> Result<()> {
        let debug_dir = self.config.output_dir.join("debug_images");
        fs::create_dir_all(&debug_dir)?;

        let base_name = format!("{}_{}", image_spec.name, preset_name);
        
        // Save original
        let original_path = debug_dir.join(format!("{}_original.png", base_name));
        original.save(&original_path)?;
        
        // Render and save SVG result
        let rendered = self.rasterize_svg(svg_content, original.dimensions())?;
        let rendered_path = debug_dir.join(format!("{}_rendered.png", base_name));
        rendered.save(&rendered_path)?;

        // Save SVG file itself
        let svg_path = debug_dir.join(format!("{}.svg", base_name));
        fs::write(&svg_path, svg_content)?;

        log::debug!("Debug images saved for {}", base_name);
        Ok(())
    }

    /// Generate comprehensive Phase A benchmark report
    fn generate_phase_a_report(&self, results: Vec<PhaseAResult>) -> Result<PhaseABenchmarkReport> {
        let summary = self.calculate_summary_stats(&results);
        
        let report = PhaseABenchmarkReport {
            results,
            summary,
            config: self.config.clone(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };

        Ok(report)
    }

    /// Calculate summary statistics
    fn calculate_summary_stats(&self, results: &[PhaseAResult]) -> PhaseABenchmarkSummary {
        let total_tests = results.len();
        let tests_passed = results.iter().filter(|r| r.overall_pass).count();
        let pass_rate = if total_tests > 0 {
            tests_passed as f64 / total_tests as f64 * 100.0
        } else {
            0.0
        };

        let delta_e_pass_rate = if total_tests > 0 {
            results.iter().filter(|r| r.meets_delta_e_target).count() as f64 / total_tests as f64 * 100.0
        } else {
            0.0
        };

        let ssim_pass_rate = if total_tests > 0 {
            results.iter().filter(|r| r.meets_ssim_target).count() as f64 / total_tests as f64 * 100.0
        } else {
            0.0
        };

        let timing_pass_rate = if total_tests > 0 {
            results.iter().filter(|r| r.meets_timing_target).count() as f64 / total_tests as f64 * 100.0
        } else {
            0.0
        };

        let avg_delta_e = if !results.is_empty() {
            results.iter().map(|r| r.delta_e_metrics.median_delta_e).sum::<f64>() / results.len() as f64
        } else {
            0.0
        };

        let avg_ssim = if !results.is_empty() {
            results.iter().map(|r| r.ssim_result.ssim).sum::<f64>() / results.len() as f64
        } else {
            0.0
        };

        let avg_processing_time = if !results.is_empty() {
            results.iter().map(|r| r.timing_metrics.median_time).sum::<f64>() / results.len() as f64
        } else {
            0.0
        };

        PhaseABenchmarkSummary {
            total_tests,
            tests_passed,
            pass_rate,
            delta_e_pass_rate,
            ssim_pass_rate,
            timing_pass_rate,
            avg_delta_e,
            avg_ssim,
            avg_processing_time,
            thresholds: self.config.quality_thresholds.clone(),
        }
    }

    /// Save comprehensive benchmark report
    pub fn save_report(&self, report: &PhaseABenchmarkReport) -> Result<()> {
        // Save JSON report
        let json_path = self.config.output_dir.join("phase_a_benchmark_report.json");
        let json_content = serde_json::to_string_pretty(report)?;
        fs::write(&json_path, json_content)?;

        // Save CSV for analysis
        let csv_path = self.config.output_dir.join("phase_a_benchmark_results.csv");
        self.save_csv_report(report, &csv_path)?;

        // Save human-readable summary
        let summary_path = self.config.output_dir.join("phase_a_benchmark_summary.txt");
        let summary_content = self.format_human_readable_summary(report);
        fs::write(&summary_path, summary_content)?;

        log::info!("Phase A benchmark reports saved to {}", self.config.output_dir.display());
        Ok(())
    }

    /// Save results as CSV for analysis
    fn save_csv_report(&self, report: &PhaseABenchmarkReport, csv_path: &Path) -> Result<()> {
        let mut csv_content = String::new();
        
        // CSV header
        csv_content.push_str("image_name,image_category,algorithm,preset_name,");
        csv_content.push_str("median_delta_e,mean_delta_e,p95_delta_e,max_delta_e,pixels_below_threshold,");
        csv_content.push_str("ssim,ssim_luminance,ssim_contrast,ssim_structure,");
        csv_content.push_str("median_time,mean_time,throughput_mpps,");
        csv_content.push_str("svg_node_count,svg_path_count,svg_file_size,");
        csv_content.push_str("meets_delta_e_target,meets_ssim_target,meets_timing_target,overall_pass\n");

        // CSV rows
        for result in &report.results {
            csv_content.push_str(&format!(
                "{},{:?},{},{},",
                result.image_spec.name,
                result.image_spec.category,
                result.algorithm,
                result.preset_name
            ));
            
            csv_content.push_str(&format!(
                "{:.3},{:.3},{:.3},{:.3},{:.1},",
                result.delta_e_metrics.median_delta_e,
                result.delta_e_metrics.mean_delta_e,
                result.delta_e_metrics.p95_delta_e,
                result.delta_e_metrics.max_delta_e,
                result.delta_e_metrics.pixels_below_threshold
            ));
            
            csv_content.push_str(&format!(
                "{:.4},{:.4},{:.4},{:.4},",
                result.ssim_result.ssim,
                result.ssim_result.luminance,
                result.ssim_result.contrast,
                result.ssim_result.structure
            ));
            
            csv_content.push_str(&format!(
                "{:.4},{:.4},{:.2},",
                result.timing_metrics.median_time,
                result.timing_metrics.mean_time,
                result.timing_metrics.throughput_mpps
            ));
            
            csv_content.push_str(&format!(
                "{},{},{},",
                result.svg_metrics.node_count,
                result.svg_metrics.path_count,
                result.svg_metrics.file_size
            ));
            
            csv_content.push_str(&format!(
                "{},{},{},{}\n",
                result.meets_delta_e_target,
                result.meets_ssim_target,
                result.meets_timing_target,
                result.overall_pass
            ));
        }

        fs::write(csv_path, csv_content)?;
        Ok(())
    }

    /// Format human-readable summary report
    fn format_human_readable_summary(&self, report: &PhaseABenchmarkReport) -> String {
        let mut output = String::new();
        
        output.push_str("=== PHASE A BENCHMARK VALIDATION REPORT ===\n\n");
        output.push_str(&format!("Timestamp: {}\n", report.timestamp));
        output.push_str(&format!("Total Tests: {}\n", report.summary.total_tests));
        output.push_str(&format!("Overall Pass Rate: {:.1}% ({}/{})\n\n", 
                        report.summary.pass_rate, report.summary.tests_passed, report.summary.total_tests));

        // Quality targets analysis
        output.push_str("=== PHASE A TARGET VALIDATION ===\n");
        output.push_str(&format!("ΔE Target (≤ {:.1}): {:.1}% pass rate (avg: {:.2})\n", 
                        report.summary.thresholds.max_delta_e, 
                        report.summary.delta_e_pass_rate, 
                        report.summary.avg_delta_e));
        output.push_str(&format!("SSIM Target (≥ {:.2}): {:.1}% pass rate (avg: {:.3})\n", 
                        report.summary.thresholds.min_ssim, 
                        report.summary.ssim_pass_rate, 
                        report.summary.avg_ssim));
        output.push_str(&format!("Timing Target (≤ {:.1}s): {:.1}% pass rate (avg: {:.3}s)\n\n", 
                        report.summary.thresholds.max_processing_time, 
                        report.summary.timing_pass_rate, 
                        report.summary.avg_processing_time));

        // Per-preset analysis
        let mut preset_stats: HashMap<String, Vec<&PhaseAResult>> = HashMap::new();
        for result in &report.results {
            preset_stats.entry(result.preset_name.clone())
                .or_insert_with(Vec::new)
                .push(result);
        }

        output.push_str("=== PER-PRESET ANALYSIS ===\n");
        for (preset_name, preset_results) in preset_stats {
            let pass_count = preset_results.iter().filter(|r| r.overall_pass).count();
            let total_count = preset_results.len();
            let pass_rate = pass_count as f64 / total_count as f64 * 100.0;
            
            output.push_str(&format!("{}: {:.1}% pass rate ({}/{})\n", 
                           preset_name, pass_rate, pass_count, total_count));
        }
        output.push_str("\n");

        // Detailed results
        output.push_str("=== DETAILED RESULTS ===\n");
        for result in &report.results {
            let status = if result.overall_pass { "PASS" } else { "FAIL" };
            output.push_str(&format!(
                "{} | {} | {} | {} | ΔE: {:.2} | SSIM: {:.3} | Time: {:.3}s\n",
                result.image_spec.name,
                result.algorithm,
                result.preset_name,
                status,
                result.delta_e_metrics.median_delta_e,
                result.ssim_result.ssim,
                result.timing_metrics.median_time
            ));
        }

        output
    }
}

/// Algorithm preset for testing
#[derive(Debug, Clone)]
struct AlgorithmPreset {
    name: String,
    algorithm: AlgorithmType,
}

/// Algorithm type enumeration
#[derive(Debug, Clone)]
enum AlgorithmType {
    Logo(LogoConfig),
    Regions(RegionsConfig),
    TraceLow(TraceLowConfig),
}

impl AlgorithmType {
    fn name(&self) -> String {
        match self {
            AlgorithmType::Logo(_) => "logo".to_string(),
            AlgorithmType::Regions(_) => "regions".to_string(),
            AlgorithmType::TraceLow(_) => "trace_low".to_string(),
        }
    }
}

/// Complete Phase A benchmark report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseABenchmarkReport {
    pub results: Vec<PhaseAResult>,
    pub summary: PhaseABenchmarkSummary,
    pub config: PhaseABenchmarkConfig,
    pub timestamp: u64,
}

/// Summary statistics for Phase A benchmark
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseABenchmarkSummary {
    pub total_tests: usize,
    pub tests_passed: usize,
    pub pass_rate: f64,
    pub delta_e_pass_rate: f64,
    pub ssim_pass_rate: f64,
    pub timing_pass_rate: f64,
    pub avg_delta_e: f64,
    pub avg_ssim: f64,
    pub avg_processing_time: f64,
    pub thresholds: QualityThresholds,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_quality_thresholds_default() {
        let thresholds = QualityThresholds::default();
        assert_eq!(thresholds.max_delta_e, 6.0);
        assert_eq!(thresholds.min_ssim, 0.93);
        assert_eq!(thresholds.max_processing_time, 2.5);
    }
    
    #[test]
    fn test_benchmark_config_creation() {
        let config = PhaseABenchmarkConfig::default();
        assert_eq!(config.timing_iterations, 5);
        assert!(config.save_debug_images);
    }
    
    #[test]
    fn test_delta_e_metrics_validation() {
        // Mock test - in real implementation, would test with actual images
        let metrics = DeltaEMetrics {
            per_pixel_delta_e: vec![1.0, 2.0, 3.0, 4.0, 5.0],
            median_delta_e: 3.0,
            mean_delta_e: 3.0,
            p95_delta_e: 5.0,
            max_delta_e: 5.0,
            pixels_below_threshold: 60.0,
        };
        
        let thresholds = QualityThresholds::default();
        assert!(metrics.median_delta_e < thresholds.max_delta_e);
    }
}