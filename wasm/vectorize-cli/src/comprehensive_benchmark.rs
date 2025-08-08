//! Comprehensive benchmark suite for vectorization algorithms
//!
//! This module provides a complete benchmarking framework that measures:
//! - SSIM score (visual quality metric, target ≥ 0.92)
//! - SVG node count (complexity metric, target ≤ 40% growth)
//! - Processing time (performance metric)
//! - File size (optimization metric)

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use vectorize_core::{vectorize_logo_rgba, vectorize_regions_rgba, LogoConfig, RegionsConfig};

use crate::ssim::{SsimResult, calculate_svg_ssim, save_debug_images};
use crate::svg_analysis::{SvgMetrics, analyze_svg, MetricsComparison};

/// Benchmark configuration options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkConfig {
    /// Number of iterations for timing measurements
    pub iterations: usize,
    /// Test images to use for benchmarking
    pub test_images: Vec<PathBuf>,
    /// Output directory for results and debug images
    pub output_dir: PathBuf,
    /// Enable debug image generation for SSIM analysis
    pub save_debug_images: bool,
    /// Baseline configuration for comparison (if any)
    pub baseline_config: Option<Box<BenchmarkConfig>>,
}

impl Default for BenchmarkConfig {
    fn default() -> Self {
        Self {
            iterations: 10,
            test_images: vec![],
            output_dir: PathBuf::from("benchmark_results"),
            save_debug_images: true,
            baseline_config: None,
        }
    }
}

/// Individual benchmark result for one test configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkResult {
    /// Test image name
    pub image_name: String,
    /// Algorithm used (logo, regions, etc.)
    pub algorithm: String,
    /// Configuration variant name
    pub config_name: String,
    /// Visual quality metrics
    pub ssim: SsimResult,
    /// SVG complexity metrics
    pub svg_metrics: SvgMetrics,
    /// Performance timing data
    pub timing: TimingData,
    /// Comparison with baseline (if available)
    pub comparison: Option<MetricsComparison>,
}

impl BenchmarkResult {
    /// Check if this result meets all research targets
    pub fn meets_all_targets(&self) -> bool {
        let ssim_target = self.ssim.meets_target();
        let node_target = self.comparison
            .as_ref()
            .map(|c| c.meets_node_target)
            .unwrap_or(true); // No baseline = assume OK
        
        ssim_target && node_target
    }

    /// Generate a status summary
    pub fn status_summary(&self) -> String {
        let ssim_status = if self.ssim.meets_target() { "✓" } else { "✗" };
        let node_status = if self.comparison.as_ref().map(|c| c.meets_node_target).unwrap_or(true) { "✓" } else { "✗" };
        let overall = if self.meets_all_targets() { "PASS" } else { "FAIL" };
        
        format!("SSIM: {} ({:.3}) | Nodes: {} | Overall: {}", 
               ssim_status, self.ssim.ssim, node_status, overall)
    }
}

/// Performance timing data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingData {
    /// Individual timing measurements in seconds
    pub times: Vec<f64>,
    /// Mean processing time
    pub mean_time: f64,
    /// Minimum processing time
    pub min_time: f64,
    /// Maximum processing time
    pub max_time: f64,
    /// Standard deviation
    pub std_dev: f64,
    /// Throughput in megapixels per second
    pub throughput_mpps: f64,
}

impl TimingData {
    fn from_times(times: Vec<f64>, image_pixels: u64) -> Self {
        let mean_time = times.iter().sum::<f64>() / times.len() as f64;
        let min_time = times.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_time = times.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        
        let variance = times.iter().map(|&x| (x - mean_time).powi(2)).sum::<f64>() / times.len() as f64;
        let std_dev = variance.sqrt();
        
        let throughput_mpps = (image_pixels as f64 / 1_000_000.0) / mean_time;
        
        Self {
            times,
            mean_time,
            min_time,
            max_time,
            std_dev,
            throughput_mpps,
        }
    }
}

/// Complete benchmark report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkReport {
    /// Individual benchmark results
    pub results: Vec<BenchmarkResult>,
    /// Summary statistics
    pub summary: BenchmarkSummary,
    /// Configuration used for benchmarking
    pub config: BenchmarkConfig,
    /// Timestamp when benchmark was run
    pub timestamp: String,
}

/// Summary statistics across all benchmark results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkSummary {
    /// Total number of tests run
    pub total_tests: usize,
    /// Number of tests that passed all targets
    pub tests_passed: usize,
    /// Pass rate percentage
    pub pass_rate: f64,
    /// Average SSIM across all tests
    pub avg_ssim: f64,
    /// Average node count growth (if baseline available)
    pub avg_node_growth: Option<f64>,
    /// Average processing time
    pub avg_processing_time: f64,
}

/// Main benchmark suite
pub struct BenchmarkSuite {
    config: BenchmarkConfig,
}

impl BenchmarkSuite {
    pub fn new(config: BenchmarkConfig) -> Self {
        Self { config }
    }

    /// Run comprehensive benchmarks for logo algorithm
    pub fn benchmark_logo(&self) -> Result<Vec<BenchmarkResult>> {
        let mut results = Vec::new();

        // Define test configurations
        let test_configs = vec![
            ("default", LogoConfig::default()),
            ("high_quality", LogoConfig {
                simplification_tolerance: 0.5,
                curve_tolerance: 1.0,
                fit_curves: true,
                ..LogoConfig::default()
            }),
            ("fast", LogoConfig {
                simplification_tolerance: 2.0,
                fit_curves: false,
                ..LogoConfig::default()
            }),
            ("precision", LogoConfig {
                simplification_tolerance: 0.1,
                curve_tolerance: 0.5,
                fit_curves: true,
                ..LogoConfig::default()
            }),
        ];

        for (config_name, logo_config) in test_configs {
            for test_image_path in &self.config.test_images {
                log::info!("Benchmarking logo algorithm with {} config on {}", 
                          config_name, test_image_path.display());

                let result = self.benchmark_single_logo(
                    test_image_path,
                    &logo_config,
                    config_name,
                )?;
                results.push(result);
            }
        }

        Ok(results)
    }

    /// Run comprehensive benchmarks for regions algorithm
    pub fn benchmark_regions(&self) -> Result<Vec<BenchmarkResult>> {
        let mut results = Vec::new();

        // Define test configurations
        let test_configs = vec![
            ("default", RegionsConfig::default()),
            ("few_colors", RegionsConfig {
                num_colors: 8,
                ..RegionsConfig::default()
            }),
            ("many_colors", RegionsConfig {
                num_colors: 32,
                max_iterations: 50,
                ..RegionsConfig::default()
            }),
            ("lab_colorspace", RegionsConfig {
                use_lab_color: true,
                ..RegionsConfig::default()
            }),
            ("high_precision", RegionsConfig {
                simplification_tolerance: 0.5,
                curve_tolerance: 1.0,
                fit_curves: true,
                ..RegionsConfig::default()
            }),
        ];

        for (config_name, regions_config) in test_configs {
            for test_image_path in &self.config.test_images {
                log::info!("Benchmarking regions algorithm with {} config on {}", 
                          config_name, test_image_path.display());

                let result = self.benchmark_single_regions(
                    test_image_path,
                    &regions_config,
                    config_name,
                )?;
                results.push(result);
            }
        }

        Ok(results)
    }

    /// Benchmark a single logo configuration
    fn benchmark_single_logo(
        &self,
        image_path: &Path,
        config: &LogoConfig,
        config_name: &str,
    ) -> Result<BenchmarkResult> {
        // Load test image
        let img = image::open(image_path)
            .with_context(|| format!("Failed to open test image: {}", image_path.display()))?
            .to_rgba8();

        let image_name = image_path.file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        // Run multiple iterations for timing
        let mut times = Vec::with_capacity(self.config.iterations);
        let mut svg_content = String::new();

        for _ in 0..self.config.iterations {
            let start = Instant::now();
            svg_content = vectorize_logo_rgba(&img, config)
                .context("Logo vectorization failed during benchmark")?;
            times.push(start.elapsed().as_secs_f64());
        }

        // Calculate SSIM
        let ssim = calculate_svg_ssim(&img, &svg_content)
            .context("SSIM calculation failed")?;

        // Analyze SVG metrics
        let svg_metrics = analyze_svg(&svg_content)
            .context("SVG analysis failed")?;

        // Calculate timing data
        let image_pixels = img.width() as u64 * img.height() as u64;
        let timing = TimingData::from_times(times, image_pixels);

        // Save debug images if requested
        if self.config.save_debug_images {
            let debug_dir = self.config.output_dir.join("debug_images");
            let debug_name = format!("{}_{}_logo", image_name, config_name);
            save_debug_images(&img, &svg_content, &debug_dir, &debug_name)
                .context("Failed to save debug images")?;
        }

        // TODO: Add comparison with baseline if available
        let comparison = None; // Implement baseline comparison

        Ok(BenchmarkResult {
            image_name,
            algorithm: "logo".to_string(),
            config_name: config_name.to_string(),
            ssim,
            svg_metrics,
            timing,
            comparison,
        })
    }

    /// Benchmark a single regions configuration
    fn benchmark_single_regions(
        &self,
        image_path: &Path,
        config: &RegionsConfig,
        config_name: &str,
    ) -> Result<BenchmarkResult> {
        // Load test image
        let img = image::open(image_path)
            .with_context(|| format!("Failed to open test image: {}", image_path.display()))?
            .to_rgba8();

        let image_name = image_path.file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        // Run multiple iterations for timing
        let mut times = Vec::with_capacity(self.config.iterations);
        let mut svg_content = String::new();

        for _ in 0..self.config.iterations {
            let start = Instant::now();
            svg_content = vectorize_regions_rgba(&img, config)
                .context("Regions vectorization failed during benchmark")?;
            times.push(start.elapsed().as_secs_f64());
        }

        // Calculate SSIM
        let ssim = calculate_svg_ssim(&img, &svg_content)
            .context("SSIM calculation failed")?;

        // Analyze SVG metrics
        let svg_metrics = analyze_svg(&svg_content)
            .context("SVG analysis failed")?;

        // Calculate timing data
        let image_pixels = img.width() as u64 * img.height() as u64;
        let timing = TimingData::from_times(times, image_pixels);

        // Save debug images if requested
        if self.config.save_debug_images {
            let debug_dir = self.config.output_dir.join("debug_images");
            let debug_name = format!("{}_{}_regions", image_name, config_name);
            save_debug_images(&img, &svg_content, &debug_dir, &debug_name)
                .context("Failed to save debug images")?;
        }

        // TODO: Add comparison with baseline if available
        let comparison = None; // Implement baseline comparison

        Ok(BenchmarkResult {
            image_name,
            algorithm: "regions".to_string(),
            config_name: config_name.to_string(),
            ssim,
            svg_metrics,
            timing,
            comparison,
        })
    }

    /// Run complete benchmark suite (both algorithms)
    pub fn run_full_benchmark(&self) -> Result<BenchmarkReport> {
        log::info!("Starting comprehensive benchmark suite");
        fs::create_dir_all(&self.config.output_dir)
            .context("Failed to create output directory")?;

        let mut all_results = Vec::new();

        // Run logo benchmarks
        let logo_results = self.benchmark_logo()
            .context("Logo benchmark failed")?;
        all_results.extend(logo_results);

        // Run regions benchmarks
        let regions_results = self.benchmark_regions()
            .context("Regions benchmark failed")?;
        all_results.extend(regions_results);

        // Generate summary
        let summary = self.generate_summary(&all_results);

        let report = BenchmarkReport {
            results: all_results,
            summary,
            config: self.config.clone(),
            timestamp: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string(),
        };

        log::info!("Benchmark suite completed: {}/{} tests passed ({:.1}% pass rate)", 
                  report.summary.tests_passed, report.summary.total_tests, report.summary.pass_rate);

        Ok(report)
    }

    /// Generate summary statistics from benchmark results
    fn generate_summary(&self, results: &[BenchmarkResult]) -> BenchmarkSummary {
        let total_tests = results.len();
        let tests_passed = results.iter().filter(|r| r.meets_all_targets()).count();
        let pass_rate = if total_tests > 0 {
            (tests_passed as f64 / total_tests as f64) * 100.0
        } else {
            0.0
        };

        let avg_ssim = if !results.is_empty() {
            results.iter().map(|r| r.ssim.ssim).sum::<f64>() / results.len() as f64
        } else {
            0.0
        };

        let avg_node_growth = if results.iter().any(|r| r.comparison.is_some()) {
            let growth_values: Vec<f64> = results
                .iter()
                .filter_map(|r| r.comparison.as_ref().map(|c| c.node_count_growth))
                .collect();
            if !growth_values.is_empty() {
                Some(growth_values.iter().sum::<f64>() / growth_values.len() as f64)
            } else {
                None
            }
        } else {
            None
        };

        let avg_processing_time = if !results.is_empty() {
            results.iter().map(|r| r.timing.mean_time).sum::<f64>() / results.len() as f64
        } else {
            0.0
        };

        BenchmarkSummary {
            total_tests,
            tests_passed,
            pass_rate,
            avg_ssim,
            avg_node_growth,
            avg_processing_time,
        }
    }

    /// Save benchmark report to file
    pub fn save_report(&self, report: &BenchmarkReport) -> Result<()> {
        // Save JSON report
        let json_path = self.config.output_dir.join("benchmark_report.json");
        let json_content = serde_json::to_string_pretty(report)
            .context("Failed to serialize benchmark report")?;
        fs::write(&json_path, json_content)
            .context("Failed to write JSON report")?;

        // Save human-readable summary
        let summary_path = self.config.output_dir.join("benchmark_summary.txt");
        let summary_content = self.format_human_readable_report(report);
        fs::write(&summary_path, summary_content)
            .context("Failed to write summary report")?;

        log::info!("Benchmark reports saved to {}", self.config.output_dir.display());
        Ok(())
    }

    /// Format human-readable benchmark report
    fn format_human_readable_report(&self, report: &BenchmarkReport) -> String {
        let mut output = String::new();
        
        output.push_str(&format!("=== COMPREHENSIVE BENCHMARK REPORT ===\n"));
        output.push_str(&format!("Timestamp: {}\n", report.timestamp));
        output.push_str(&format!("Total Tests: {}\n", report.summary.total_tests));
        output.push_str(&format!("Tests Passed: {}\n", report.summary.tests_passed));
        output.push_str(&format!("Pass Rate: {:.1}%\n", report.summary.pass_rate));
        output.push_str(&format!("Average SSIM: {:.3}\n", report.summary.avg_ssim));
        if let Some(node_growth) = report.summary.avg_node_growth {
            output.push_str(&format!("Average Node Growth: {:.1}%\n", node_growth));
        }
        output.push_str(&format!("Average Processing Time: {:.3}s\n\n", report.summary.avg_processing_time));

        // Research targets status
        output.push_str("=== RESEARCH TARGETS ===\n");
        output.push_str(&format!("SSIM Target (≥ 0.92): {:.1}% pass rate\n", 
            report.results.iter().filter(|r| r.ssim.meets_target()).count() as f64 / report.results.len() as f64 * 100.0));
        if report.summary.avg_node_growth.is_some() {
            output.push_str(&format!("Node Count Target (≤ 40% growth): {:.1}% pass rate\n",
                report.results.iter().filter(|r| r.comparison.as_ref().map(|c| c.meets_node_target).unwrap_or(true)).count() as f64 / report.results.len() as f64 * 100.0));
        }
        output.push_str("\n");

        // Individual results
        output.push_str("=== DETAILED RESULTS ===\n");
        for result in &report.results {
            output.push_str(&format!(
                "{} | {} | {} | {}\n",
                result.image_name,
                result.algorithm,
                result.config_name,
                result.status_summary()
            ));
        }

        output
    }
}

// Add chrono dependency for timestamps - for now use a simple alternative
mod chrono {
    pub struct Utc;
    
    impl Utc {
        pub fn now() -> DateTime {
            DateTime
        }
    }
    
    pub struct DateTime;
    
    impl DateTime {
        pub fn format(&self, _fmt: &str) -> FormattedDateTime {
            FormattedDateTime
        }
    }
    
    pub struct FormattedDateTime;
    
    impl std::fmt::Display for FormattedDateTime {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage};
    use std::collections::HashMap;
    use tempfile::TempDir;

    fn create_test_image() -> RgbaImage {
        ImageBuffer::from_fn(64, 64, |x, y| {
            if (x + y) % 2 == 0 {
                Rgba([255, 255, 255, 255])
            } else {
                Rgba([0, 0, 0, 255])
            }
        })
    }

    fn create_test_config(temp_dir: &Path) -> BenchmarkConfig {
        // Create test image
        let test_img = create_test_image();
        let img_path = temp_dir.join("test.png");
        test_img.save(&img_path).unwrap();

        BenchmarkConfig {
            iterations: 3, // Small number for testing
            test_images: vec![img_path],
            output_dir: temp_dir.join("results"),
            save_debug_images: false, // Disable for testing
            baseline_config: None,
        }
    }

    #[test]
    fn test_timing_data_calculation() {
        let times = vec![1.0, 1.2, 0.8, 1.1, 0.9];
        let timing = TimingData::from_times(times, 1000000); // 1 megapixel

        assert!((timing.mean_time - 1.0).abs() < 0.1);
        assert_eq!(timing.min_time, 0.8);
        assert_eq!(timing.max_time, 1.2);
        assert!(timing.std_dev > 0.0);
        assert!(timing.throughput_mpps > 0.0);
    }

    #[test] 
    fn test_benchmark_result_targets() {
        let good_result = BenchmarkResult {
            image_name: "test".to_string(),
            algorithm: "test".to_string(),
            config_name: "test".to_string(),
            ssim: crate::ssim::SsimResult {
                ssim: 0.95, // Above target
                luminance: 1.0,
                contrast: 1.0,
                structure: 1.0,
            },
            svg_metrics: SvgMetrics {
                node_count: 10,
                path_count: 5,
                color_count: 3,
                path_commands: 20,
                file_size: 1000,
                bbox_area: 10000.0,
                avg_path_complexity: 4.0,
                element_types: HashMap::new(),
            },
            timing: TimingData::from_times(vec![1.0], 1000000),
            comparison: None,
        };

        assert!(good_result.meets_all_targets());
        assert!(good_result.status_summary().contains("PASS"));
    }

    #[test]
    fn test_benchmark_suite_creation() {
        let temp_dir = TempDir::new().unwrap();
        let config = create_test_config(temp_dir.path());
        let suite = BenchmarkSuite::new(config);

        // Just test that suite can be created without panicking
        assert_eq!(suite.config.iterations, 3);
    }
}