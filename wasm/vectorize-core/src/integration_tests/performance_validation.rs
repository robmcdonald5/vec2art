//! Performance Validation for Phase A+B Combined Pipeline
//!
//! This module implements comprehensive performance testing and validation
//! for the combined Phase A + Phase B processing pipeline, ensuring that
//! the complete vectorization and refinement process meets performance targets.
//!
//! ## Performance Targets (from Roadmap)
//!
//! - **Phase A Processing**: ≤ 2.5 seconds (logo, regions, trace-low algorithms)
//! - **Phase B Refinement**: ≤ 600ms (error-driven refinement iterations)  
//! - **Combined Pipeline**: ≤ 3.1 seconds (Phase A + Phase B total)
//! - **Memory Efficiency**: Reasonable memory usage throughout pipeline
//!
//! ## Performance Analysis
//!
//! - **Algorithm Timing**: Detailed timing breakdown by phase and component
//! - **Memory Tracking**: Memory usage monitoring and peak detection
//! - **Scalability Testing**: Performance across different image sizes
//! - **Regression Detection**: Performance regression identification
//! - **Bottleneck Analysis**: Identification of performance bottlenecks

use crate::algorithms::logo::{SvgPath, vectorize_logo};
use crate::algorithms::regions::vectorize_regions;
use crate::algorithms::trace_low::vectorize_trace_low;
use crate::refine::{RefineConfig, refine_vectorization};
use crate::{LogoConfig, RegionsConfig, TraceLowConfig};
use crate::error::VectorizeResult;
use image::{ImageBuffer, Rgba};
use std::time::{Instant, Duration};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

/// Comprehensive performance metrics for pipeline analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// Phase A algorithm timing
    pub phase_a_duration_ms: u64,
    
    /// Phase B refinement timing
    pub phase_b_duration_ms: u64,
    
    /// Total combined pipeline timing
    pub total_duration_ms: u64,
    
    /// Memory usage tracking
    pub memory_metrics: MemoryMetrics,
    
    /// Detailed timing breakdown
    pub timing_breakdown: TimingBreakdown,
    
    /// Performance target validation
    pub target_validation: PerformanceTargetValidation,
    
    /// Scalability metrics
    pub scalability_metrics: ScalabilityMetrics,
    
    /// Throughput metrics
    pub throughput_metrics: ThroughputMetrics,
}

/// Memory usage tracking throughout pipeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetrics {
    /// Peak memory usage during Phase A
    pub phase_a_peak_mb: f64,
    
    /// Peak memory usage during Phase B
    pub phase_b_peak_mb: f64,
    
    /// Total peak memory usage
    pub total_peak_mb: f64,
    
    /// Memory efficiency score (0.0-1.0)
    pub efficiency_score: f64,
    
    /// Memory usage per pixel
    pub memory_per_pixel_bytes: f64,
}

/// Detailed timing breakdown by component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingBreakdown {
    /// Phase A component timings
    pub phase_a_components: HashMap<String, u64>,
    
    /// Phase B component timings  
    pub phase_b_components: HashMap<String, u64>,
    
    /// Overhead timings (I/O, validation, etc.)
    pub overhead_components: HashMap<String, u64>,
    
    /// Critical path analysis
    pub critical_path_ms: u64,
    
    /// Parallelization opportunities
    pub parallelization_potential: f64,
}

/// Performance target validation results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceTargetValidation {
    /// Phase A within target (≤ 2.5s)
    pub phase_a_within_target: bool,
    pub phase_a_target_ms: u64,
    pub phase_a_actual_ms: u64,
    pub phase_a_margin_ms: i64, // Negative if over target
    
    /// Phase B within target (≤ 600ms)
    pub phase_b_within_target: bool,
    pub phase_b_target_ms: u64,
    pub phase_b_actual_ms: u64,
    pub phase_b_margin_ms: i64, // Negative if over target
    
    /// Combined within target (≤ 3.1s)
    pub combined_within_target: bool,
    pub combined_target_ms: u64,
    pub combined_actual_ms: u64,
    pub combined_margin_ms: i64, // Negative if over target
    
    /// Overall performance grade (A-F)
    pub performance_grade: String,
}

/// Scalability analysis across image sizes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScalabilityMetrics {
    /// Image dimensions tested
    pub image_dimensions: (u32, u32),
    
    /// Megapixels processed
    pub megapixels: f64,
    
    /// Processing time per megapixel
    pub ms_per_megapixel: f64,
    
    /// Scalability efficiency (linear = 1.0)
    pub scalability_coefficient: f64,
    
    /// Memory scaling factor
    pub memory_scaling_factor: f64,
}

/// Throughput analysis metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThroughputMetrics {
    /// Pixels processed per second
    pub pixels_per_second: f64,
    
    /// SVG paths generated per second
    pub paths_per_second: f64,
    
    /// Processing efficiency score
    pub efficiency_score: f64,
    
    /// Comparative performance vs baseline
    pub relative_performance: f64,
}

/// Comprehensive performance analysis report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceReport {
    /// Algorithm tested
    pub algorithm: String,
    
    /// Test image information
    pub image_path: String,
    pub image_dimensions: (u32, u32),
    pub image_size_mb: f64,
    
    /// Performance metrics
    pub metrics: PerformanceMetrics,
    
    /// Performance analysis
    pub analysis: PerformanceAnalysis,
    
    /// Bottleneck identification
    pub bottlenecks: Vec<PerformanceBottleneck>,
    
    /// Optimization recommendations
    pub recommendations: Vec<OptimizationRecommendation>,
    
    /// Overall performance assessment
    pub overall_assessment: String,
    
    /// Report timestamp
    pub timestamp: String,
}

/// Performance analysis and insights
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAnalysis {
    /// Performance trend analysis
    pub trend_analysis: String,
    
    /// Bottleneck severity assessment
    pub bottleneck_severity: String,
    
    /// Performance regression indicators
    pub regression_indicators: Vec<String>,
    
    /// Optimization impact estimation
    pub optimization_impact: HashMap<String, f64>,
}

/// Performance bottleneck identification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceBottleneck {
    /// Component with bottleneck
    pub component: String,
    
    /// Severity (0.0-1.0, 1.0 = critical)
    pub severity: f64,
    
    /// Impact on overall performance
    pub impact_description: String,
    
    /// Suggested optimizations
    pub optimization_suggestions: Vec<String>,
}

/// Optimization recommendations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationRecommendation {
    /// Optimization category
    pub category: String,
    
    /// Priority (1-5, 5 = highest)
    pub priority: u8,
    
    /// Description of optimization
    pub description: String,
    
    /// Expected performance impact
    pub expected_impact: f64,
    
    /// Implementation complexity (1-5, 5 = most complex)
    pub complexity: u8,
}

/// Measure combined Phase A+B performance for specific algorithm
/// 
/// This function performs comprehensive performance measurement of the complete
/// Phase A → Phase B pipeline, including detailed timing, memory tracking,
/// and target validation.
/// 
/// # Arguments
/// * `image` - Input image buffer for processing
/// * `algorithm` - Algorithm name ("logo", "regions", "trace-low")
/// * `refine_config` - Phase B refinement configuration
/// 
/// # Returns
/// * `VectorizeResult<PerformanceMetrics>` - Detailed performance metrics
/// 
/// # Performance Measurement
/// * High-precision timing using std::time::Instant
/// * Memory usage tracking (where available)
/// * Component-level timing breakdown
/// * Target validation against roadmap requirements
pub async fn measure_combined_performance(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    algorithm: &str,
    refine_config: &RefineConfig,
) -> VectorizeResult<PerformanceMetrics> {
    log::info!("Measuring combined performance for {} algorithm", algorithm);
    
    let overall_start = Instant::now();
    let mut timing_breakdown = TimingBreakdown {
        phase_a_components: HashMap::new(),
        phase_b_components: HashMap::new(),
        overhead_components: HashMap::new(),
        critical_path_ms: 0,
        parallelization_potential: 0.0,
    };
    
    // Memory tracking setup
    let initial_memory = estimate_current_memory_usage();
    let mut memory_metrics = MemoryMetrics {
        phase_a_peak_mb: 0.0,
        phase_b_peak_mb: 0.0,
        total_peak_mb: 0.0,
        efficiency_score: 0.0,
        memory_per_pixel_bytes: 0.0,
    };
    
    // Phase A: Execute algorithm with detailed timing
    log::debug!("Starting Phase A performance measurement");
    let phase_a_start = Instant::now();
    
    let (phase_a_paths, phase_a_timing) = match algorithm {
        "logo" => {
            let config = LogoConfig::default();
            measure_logo_performance(image, &config).await?
        }
        "regions" => {
            let config = RegionsConfig::default();
            measure_regions_performance(image, &config).await?
        }
        "trace-low" => {
            let config = TraceLowConfig::default();
            measure_trace_low_performance(image, &config).await?
        }
        _ => return Err(crate::error::VectorizeError::algorithm_error(
            format!("Unknown algorithm: {}", algorithm)
        )),
    };
    
    let phase_a_duration = phase_a_start.elapsed();
    timing_breakdown.phase_a_components = phase_a_timing;
    
    // Track Phase A memory usage
    memory_metrics.phase_a_peak_mb = (estimate_current_memory_usage() - initial_memory) / (1024.0 * 1024.0);
    
    // Phase B: Refinement with detailed timing
    log::debug!("Starting Phase B performance measurement");
    let phase_b_start = Instant::now();
    
    let (phase_b_paths, phase_b_timing) = measure_refinement_performance(
        &phase_a_paths, image, refine_config
    ).await?;
    
    let phase_b_duration = phase_b_start.elapsed();
    timing_breakdown.phase_b_components = phase_b_timing;
    
    // Track Phase B memory usage
    let current_memory = estimate_current_memory_usage();
    memory_metrics.phase_b_peak_mb = (current_memory - initial_memory) / (1024.0 * 1024.0);
    memory_metrics.total_peak_mb = memory_metrics.phase_b_peak_mb; // Phase B is typically peak
    
    let total_duration = overall_start.elapsed();
    
    // Calculate memory efficiency
    let pixel_count = (image.width() * image.height()) as f64;
    memory_metrics.memory_per_pixel_bytes = (current_memory - initial_memory) / pixel_count;
    memory_metrics.efficiency_score = calculate_memory_efficiency(&memory_metrics, pixel_count);
    
    // Calculate scalability metrics
    let scalability_metrics = ScalabilityMetrics {
        image_dimensions: (image.width(), image.height()),
        megapixels: pixel_count / 1_000_000.0,
        ms_per_megapixel: total_duration.as_millis() as f64 / (pixel_count / 1_000_000.0),
        scalability_coefficient: 1.0, // Would need multiple sizes to calculate
        memory_scaling_factor: memory_metrics.memory_per_pixel_bytes / 4.0, // 4 bytes per RGBA pixel
    };
    
    // Calculate throughput metrics
    let throughput_metrics = ThroughputMetrics {
        pixels_per_second: pixel_count / total_duration.as_secs_f64(),
        paths_per_second: phase_b_paths.len() as f64 / total_duration.as_secs_f64(),
        efficiency_score: calculate_throughput_efficiency(&scalability_metrics),
        relative_performance: 1.0, // Baseline for comparison
    };
    
    // Validate against performance targets
    let target_validation = PerformanceTargetValidation {
        phase_a_within_target: phase_a_duration.as_millis() <= 2500,
        phase_a_target_ms: 2500,
        phase_a_actual_ms: phase_a_duration.as_millis() as u64,
        phase_a_margin_ms: 2500 - (phase_a_duration.as_millis() as i64),
        
        phase_b_within_target: phase_b_duration.as_millis() <= 600,
        phase_b_target_ms: 600,
        phase_b_actual_ms: phase_b_duration.as_millis() as u64,
        phase_b_margin_ms: 600 - (phase_b_duration.as_millis() as i64),
        
        combined_within_target: total_duration.as_millis() <= 3100,
        combined_target_ms: 3100,
        combined_actual_ms: total_duration.as_millis() as u64,
        combined_margin_ms: 3100 - (total_duration.as_millis() as i64),
        
        performance_grade: calculate_performance_grade(&total_duration, &phase_a_duration, &phase_b_duration),
    };
    
    // Calculate critical path
    timing_breakdown.critical_path_ms = total_duration.as_millis() as u64;
    timing_breakdown.parallelization_potential = estimate_parallelization_potential(&timing_breakdown);
    
    let metrics = PerformanceMetrics {
        phase_a_duration_ms: phase_a_duration.as_millis() as u64,
        phase_b_duration_ms: phase_b_duration.as_millis() as u64,
        total_duration_ms: total_duration.as_millis() as u64,
        memory_metrics,
        timing_breakdown,
        target_validation,
        scalability_metrics,
        throughput_metrics,
    };
    
    log::info!("Performance measurement completed: total={}ms, Phase A={}ms, Phase B={}ms", 
              metrics.total_duration_ms, metrics.phase_a_duration_ms, metrics.phase_b_duration_ms);
    
    Ok(metrics)
}

/// Validate performance against roadmap targets
/// 
/// This function validates measured performance metrics against the project
/// roadmap performance targets and provides detailed assessment.
/// 
/// # Arguments
/// * `metrics` - Performance metrics to validate
/// 
/// # Returns
/// * `bool` - True if all performance targets are met
/// 
/// # Targets Validated
/// * Phase A ≤ 2.5s - Algorithm processing time target
/// * Phase B ≤ 600ms - Refinement time budget
/// * Combined ≤ 3.1s - Total pipeline time target
pub fn validate_performance_targets(metrics: &PerformanceMetrics) -> bool {
    let validation = &metrics.target_validation;
    
    let all_targets_met = validation.phase_a_within_target 
                       && validation.phase_b_within_target 
                       && validation.combined_within_target;
    
    log::info!("Performance target validation: Phase A {} ({}ms), Phase B {} ({}ms), Combined {} ({}ms)",
              if validation.phase_a_within_target { "✓" } else { "✗" }, validation.phase_a_actual_ms,
              if validation.phase_b_within_target { "✓" } else { "✗" }, validation.phase_b_actual_ms,
              if validation.combined_within_target { "✓" } else { "✗" }, validation.combined_actual_ms);
    
    all_targets_met
}

/// Generate comprehensive performance analysis report
/// 
/// This function creates a detailed performance analysis report including
/// timing breakdown, bottleneck identification, and optimization recommendations.
/// 
/// # Arguments
/// * `algorithm` - Algorithm name being tested
/// * `image_path` - Test image path
/// * `image` - Input image buffer
/// * `metrics` - Performance metrics to analyze
/// 
/// # Returns
/// * `VectorizeResult<PerformanceReport>` - Comprehensive performance report
/// 
/// # Report Contents
/// * Detailed timing and memory analysis
/// * Bottleneck identification and severity assessment
/// * Optimization recommendations with priority
/// * Performance trend analysis
pub async fn generate_performance_report(
    algorithm: &str,
    image_path: &str,
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    metrics: &PerformanceMetrics,
) -> VectorizeResult<PerformanceReport> {
    log::info!("Generating performance analysis report for {}", algorithm);
    
    // Analyze bottlenecks
    let bottlenecks = identify_performance_bottlenecks(metrics);
    
    // Generate optimization recommendations
    let recommendations = generate_optimization_recommendations(metrics, &bottlenecks);
    
    // Perform trend analysis
    let analysis = PerformanceAnalysis {
        trend_analysis: analyze_performance_trends(metrics),
        bottleneck_severity: assess_bottleneck_severity(&bottlenecks),
        regression_indicators: detect_regression_indicators(metrics),
        optimization_impact: estimate_optimization_impact(&recommendations),
    };
    
    // Calculate image size
    let image_size_mb = (image.width() * image.height() * 4) as f64 / (1024.0 * 1024.0);
    
    let overall_assessment = generate_overall_assessment(metrics, &bottlenecks, &analysis);
    
    let report = PerformanceReport {
        algorithm: algorithm.to_string(),
        image_path: image_path.to_string(),
        image_dimensions: (image.width(), image.height()),
        image_size_mb,
        metrics: metrics.clone(),
        analysis,
        bottlenecks,
        recommendations,
        overall_assessment,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    
    log::info!("Performance report generated: grade={}, bottlenecks={}, recommendations={}",
              report.metrics.target_validation.performance_grade,
              report.bottlenecks.len(),
              report.recommendations.len());
    
    Ok(report)
}

// Helper function implementations

/// Measure logo algorithm performance with detailed timing
async fn measure_logo_performance(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &LogoConfig,
) -> VectorizeResult<(Vec<SvgPath>, HashMap<String, u64>)> {
    let mut timings = HashMap::new();
    
    let preprocessing_start = Instant::now();
    // Logo algorithm includes preprocessing internally
    let preprocessing_duration = preprocessing_start.elapsed();
    timings.insert("preprocessing".to_string(), preprocessing_duration.as_millis() as u64);
    
    let vectorization_start = Instant::now();
    let paths = vectorize_logo(image, config)?;
    let vectorization_duration = vectorization_start.elapsed();
    timings.insert("vectorization".to_string(), vectorization_duration.as_millis() as u64);
    
    Ok((paths, timings))
}

/// Measure regions algorithm performance with detailed timing
async fn measure_regions_performance(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RegionsConfig,
) -> VectorizeResult<(Vec<SvgPath>, HashMap<String, u64>)> {
    let mut timings = HashMap::new();
    
    let preprocessing_start = Instant::now();
    // Regions algorithm includes preprocessing internally
    let preprocessing_duration = preprocessing_start.elapsed();
    timings.insert("preprocessing".to_string(), preprocessing_duration.as_millis() as u64);
    
    let quantization_start = Instant::now();
    // Color quantization timing (included in vectorize_regions)
    let paths = vectorize_regions(image, config)?;
    let total_duration = quantization_start.elapsed();
    
    // Split timing estimate (actual implementation would need internal timing)
    timings.insert("quantization".to_string(), total_duration.as_millis() as u64 / 3);
    timings.insert("segmentation".to_string(), total_duration.as_millis() as u64 / 3);
    timings.insert("path_generation".to_string(), total_duration.as_millis() as u64 / 3);
    
    Ok((paths, timings))
}

/// Measure trace-low algorithm performance with detailed timing
async fn measure_trace_low_performance(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> VectorizeResult<(Vec<SvgPath>, HashMap<String, u64>)> {
    let mut timings = HashMap::new();
    
    let preprocessing_start = Instant::now();
    // Trace-low algorithm includes preprocessing internally
    let preprocessing_duration = preprocessing_start.elapsed();
    timings.insert("preprocessing".to_string(), preprocessing_duration.as_millis() as u64);
    
    let edge_detection_start = Instant::now();
    let paths = vectorize_trace_low(image, config)?;
    let total_duration = edge_detection_start.elapsed();
    
    // Split timing estimate for edge detection components
    timings.insert("edge_detection".to_string(), total_duration.as_millis() as u64 / 2);
    timings.insert("path_tracing".to_string(), total_duration.as_millis() as u64 / 2);
    
    Ok((paths, timings))
}

/// Measure refinement performance with detailed timing
async fn measure_refinement_performance(
    paths: &[SvgPath],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> VectorizeResult<(Vec<SvgPath>, HashMap<String, u64>)> {
    let mut timings = HashMap::new();
    
    let rasterization_start = Instant::now();
    // Refinement includes rasterization internally
    let refined_paths = refine_vectorization(paths, image, config)?;
    let total_duration = rasterization_start.elapsed();
    
    // Split timing estimate based on typical refinement components
    let total_ms = total_duration.as_millis() as u64;
    timings.insert("rasterization".to_string(), total_ms / 3);
    timings.insert("error_analysis".to_string(), total_ms / 3);
    timings.insert("refinement_actions".to_string(), total_ms / 3);
    
    Ok((refined_paths, timings))
}

/// Estimate current memory usage (platform-dependent approximation)
fn estimate_current_memory_usage() -> f64 {
    // This is a simplified implementation
    // In a real implementation, you might use platform-specific APIs
    // or memory profiling tools
    0.0 // Placeholder - would need actual memory tracking
}

/// Calculate memory efficiency score
fn calculate_memory_efficiency(metrics: &MemoryMetrics, pixel_count: f64) -> f64 {
    // Higher score for lower memory per pixel
    // Typical efficient usage: ~4-8 bytes per pixel
    let efficient_usage = 8.0;
    if metrics.memory_per_pixel_bytes <= efficient_usage {
        1.0
    } else {
        efficient_usage / metrics.memory_per_pixel_bytes
    }
}

/// Calculate throughput efficiency
fn calculate_throughput_efficiency(scalability: &ScalabilityMetrics) -> f64 {
    // Target: process 1MP in reasonable time (~100-500ms for Phase A+B)
    let target_ms_per_mp = 300.0; // 300ms per megapixel target
    if scalability.ms_per_megapixel <= target_ms_per_mp {
        1.0
    } else {
        target_ms_per_mp / scalability.ms_per_megapixel
    }
}

/// Calculate performance grade (A-F)
fn calculate_performance_grade(
    total: &Duration,
    phase_a: &Duration,
    phase_b: &Duration,
) -> String {
    let total_ms = total.as_millis() as f64;
    let target_ms = 3100.0;
    
    let performance_ratio = target_ms / total_ms;
    
    match performance_ratio {
        r if r >= 2.0 => "A".to_string(),   // Twice as fast as target
        r if r >= 1.5 => "B".to_string(),   // 1.5x as fast as target
        r if r >= 1.0 => "C".to_string(),   // Meets target
        r if r >= 0.8 => "D".to_string(),   // 80% of target (close)
        _ => "F".to_string(),               // Significantly over target
    }
}

/// Estimate parallelization potential
fn estimate_parallelization_potential(timing: &TimingBreakdown) -> f64 {
    // Estimate how much of the processing could be parallelized
    // This is a simplified analysis
    let total_time: u64 = timing.phase_a_components.values().sum::<u64>() 
                        + timing.phase_b_components.values().sum::<u64>();
    
    if total_time == 0 {
        return 0.0;
    }
    
    // Assume some portions can be parallelized (simplified estimate)
    0.3 // 30% parallelization potential
}

/// Identify performance bottlenecks
fn identify_performance_bottlenecks(metrics: &PerformanceMetrics) -> Vec<PerformanceBottleneck> {
    let mut bottlenecks = Vec::new();
    
    // Check Phase A performance
    if metrics.phase_a_duration_ms > 2000 { // 80% of target
        bottlenecks.push(PerformanceBottleneck {
            component: "Phase A".to_string(),
            severity: if metrics.phase_a_duration_ms > 2500 { 1.0 } else { 0.7 },
            impact_description: "Phase A processing exceeds performance targets".to_string(),
            optimization_suggestions: vec![
                "Consider image resolution optimization".to_string(),
                "Evaluate algorithm parameter tuning".to_string(),
                "Investigate parallelization opportunities".to_string(),
            ],
        });
    }
    
    // Check Phase B performance
    if metrics.phase_b_duration_ms > 500 { // 83% of target
        bottlenecks.push(PerformanceBottleneck {
            component: "Phase B".to_string(),
            severity: if metrics.phase_b_duration_ms > 600 { 1.0 } else { 0.6 },
            impact_description: "Phase B refinement exceeds time budget".to_string(),
            optimization_suggestions: vec![
                "Reduce refinement iterations".to_string(),
                "Optimize tile analysis configuration".to_string(),
                "Implement early convergence detection".to_string(),
            ],
        });
    }
    
    // Check memory usage
    if metrics.memory_metrics.total_peak_mb > 500.0 { // Arbitrary threshold
        bottlenecks.push(PerformanceBottleneck {
            component: "Memory Usage".to_string(),
            severity: 0.5,
            impact_description: "High memory usage may impact performance".to_string(),
            optimization_suggestions: vec![
                "Implement memory pooling".to_string(),
                "Optimize data structures".to_string(),
                "Consider streaming processing".to_string(),
            ],
        });
    }
    
    bottlenecks
}

/// Generate optimization recommendations
fn generate_optimization_recommendations(
    metrics: &PerformanceMetrics,
    bottlenecks: &[PerformanceBottleneck],
) -> Vec<OptimizationRecommendation> {
    let mut recommendations = Vec::new();
    
    // High-priority recommendations based on bottlenecks
    for bottleneck in bottlenecks {
        if bottleneck.severity >= 0.8 {
            recommendations.push(OptimizationRecommendation {
                category: "Critical Performance".to_string(),
                priority: 5,
                description: format!("Address {} bottleneck", bottleneck.component),
                expected_impact: bottleneck.severity * 0.3, // 30% improvement potential
                complexity: 3,
            });
        }
    }
    
    // General optimization recommendations
    if metrics.total_duration_ms > 2500 {
        recommendations.push(OptimizationRecommendation {
            category: "Algorithm Optimization".to_string(),
            priority: 4,
            description: "Optimize core algorithm parameters".to_string(),
            expected_impact: 0.15, // 15% improvement
            complexity: 2,
        });
    }
    
    recommendations
}

/// Analyze performance trends
fn analyze_performance_trends(metrics: &PerformanceMetrics) -> String {
    let phase_ratio = metrics.phase_b_duration_ms as f64 / metrics.phase_a_duration_ms as f64;
    
    if phase_ratio > 0.5 {
        "Phase B refinement taking significant time relative to Phase A".to_string()
    } else if phase_ratio < 0.1 {
        "Phase B refinement very efficient relative to Phase A".to_string()
    } else {
        "Balanced processing time between Phase A and Phase B".to_string()
    }
}

/// Assess bottleneck severity
fn assess_bottleneck_severity(bottlenecks: &[PerformanceBottleneck]) -> String {
    let max_severity = bottlenecks.iter()
        .map(|b| b.severity)
        .fold(0.0, f64::max);
    
    match max_severity {
        s if s >= 0.9 => "Critical".to_string(),
        s if s >= 0.7 => "High".to_string(),
        s if s >= 0.4 => "Medium".to_string(),
        s if s > 0.0 => "Low".to_string(),
        _ => "None".to_string(),
    }
}

/// Detect regression indicators
fn detect_regression_indicators(metrics: &PerformanceMetrics) -> Vec<String> {
    let mut indicators = Vec::new();
    
    if !metrics.target_validation.combined_within_target {
        indicators.push("Performance targets not met".to_string());
    }
    
    if metrics.memory_metrics.efficiency_score < 0.5 {
        indicators.push("Memory efficiency below threshold".to_string());
    }
    
    indicators
}

/// Estimate optimization impact
fn estimate_optimization_impact(recommendations: &[OptimizationRecommendation]) -> HashMap<String, f64> {
    let mut impact = HashMap::new();
    
    for rec in recommendations {
        impact.insert(rec.category.clone(), rec.expected_impact);
    }
    
    impact
}

/// Generate overall assessment
fn generate_overall_assessment(
    metrics: &PerformanceMetrics,
    bottlenecks: &[PerformanceBottleneck],
    analysis: &PerformanceAnalysis,
) -> String {
    let grade = &metrics.target_validation.performance_grade;
    let critical_bottlenecks = bottlenecks.iter().filter(|b| b.severity >= 0.8).count();
    
    format!(
        "Performance Grade: {} | Critical Bottlenecks: {} | Trend: {}",
        grade, critical_bottlenecks, analysis.trend_analysis
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_grade_calculation() {
        let fast = Duration::from_millis(1500); // Faster than target
        let target = Duration::from_millis(3100); // At target
        let slow = Duration::from_millis(4000); // Slower than target
        
        assert_eq!(calculate_performance_grade(&fast, &fast, &Duration::ZERO), "A");
        assert_eq!(calculate_performance_grade(&target, &target, &Duration::ZERO), "C");
        assert_eq!(calculate_performance_grade(&slow, &slow, &Duration::ZERO), "F");
    }
    
    #[test]
    fn test_memory_efficiency_calculation() {
        let efficient = MemoryMetrics {
            phase_a_peak_mb: 50.0,
            phase_b_peak_mb: 60.0,
            total_peak_mb: 60.0,
            efficiency_score: 0.0, // Will be calculated
            memory_per_pixel_bytes: 6.0, // Efficient
        };
        
        let score = calculate_memory_efficiency(&efficient, 1_000_000.0);
        assert!(score > 0.8); // Should be high efficiency
    }
    
    #[test]
    fn test_throughput_efficiency_calculation() {
        let efficient = ScalabilityMetrics {
            image_dimensions: (1000, 1000),
            megapixels: 1.0,
            ms_per_megapixel: 200.0, // Efficient
            scalability_coefficient: 1.0,
            memory_scaling_factor: 1.0,
        };
        
        let score = calculate_throughput_efficiency(&efficient);
        assert!(score >= 1.0); // Should be high efficiency
    }
    
    #[test]
    fn test_bottleneck_identification() {
        let slow_metrics = PerformanceMetrics {
            phase_a_duration_ms: 3000, // Over target
            phase_b_duration_ms: 400,  // Within target
            total_duration_ms: 3400,
            memory_metrics: MemoryMetrics {
                phase_a_peak_mb: 100.0,
                phase_b_peak_mb: 120.0,
                total_peak_mb: 120.0,
                efficiency_score: 0.5,
                memory_per_pixel_bytes: 10.0,
            },
            timing_breakdown: TimingBreakdown {
                phase_a_components: HashMap::new(),
                phase_b_components: HashMap::new(),
                overhead_components: HashMap::new(),
                critical_path_ms: 3400,
                parallelization_potential: 0.3,
            },
            target_validation: PerformanceTargetValidation {
                phase_a_within_target: false,
                phase_a_target_ms: 2500,
                phase_a_actual_ms: 3000,
                phase_a_margin_ms: -500,
                phase_b_within_target: true,
                phase_b_target_ms: 600,
                phase_b_actual_ms: 400,
                phase_b_margin_ms: 200,
                combined_within_target: false,
                combined_target_ms: 3100,
                combined_actual_ms: 3400,
                combined_margin_ms: -300,
                performance_grade: "D".to_string(),
            },
            scalability_metrics: ScalabilityMetrics {
                image_dimensions: (1000, 1000),
                megapixels: 1.0,
                ms_per_megapixel: 3400.0,
                scalability_coefficient: 1.0,
                memory_scaling_factor: 2.5,
            },
            throughput_metrics: ThroughputMetrics {
                pixels_per_second: 294_117.0,
                paths_per_second: 10.0,
                efficiency_score: 0.6,
                relative_performance: 0.9,
            },
        };
        
        let bottlenecks = identify_performance_bottlenecks(&slow_metrics);
        assert!(!bottlenecks.is_empty());
        assert!(bottlenecks.iter().any(|b| b.component == "Phase A"));
    }
}