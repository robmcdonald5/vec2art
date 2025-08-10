//! Quality Measurement Integration for Phase A+B Pipeline
//!
//! This module implements comprehensive quality measurement and validation
//! using Phase B infrastructure, providing ΔE/SSIM analysis for Phase A
//! outputs and measuring improvement through Phase B refinement.
//!
//! ## Quality Metrics
//!
//! - **ΔE (Delta E)**: Perceptual color difference in LAB color space (target: ≤ 6.0)
//! - **SSIM**: Structural Similarity Index for grayscale comparison (target: ≥ 0.93)
//! - **Improvement Tracking**: Quantitative measurement of Phase B refinement benefits
//! - **Quality Targets**: Validation against roadmap requirements
//!
//! ## Integration with Phase B
//!
//! - Uses Phase B rasterization for consistent quality measurement
//! - Leverages Phase B tile analysis for detailed error mapping
//! - Integrates with Phase B convergence criteria validation
//! - Provides baseline quality metrics for refinement targeting

use crate::algorithms::logo::SvgPath;
use crate::refine::{
    RefineConfig, 
    rasterize::rasterize_svg_paths,
    error::{compute_tile_errors, TileAnalysisConfig, TileError}
};
use crate::config::SvgConfig;
use crate::error::VectorizeResult;
use image::{ImageBuffer, Rgba};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

/// Comprehensive quality metrics for Phase A+B analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityMetrics {
    /// Average ΔE across image (perceptual color difference)
    pub delta_e_avg: f64,
    
    /// Maximum ΔE in worst regions
    pub delta_e_max: f64,
    
    /// 95th percentile ΔE (excludes outliers)
    pub delta_e_p95: f64,
    
    /// Average SSIM across image (structural similarity)
    pub ssim_avg: f64,
    
    /// Minimum SSIM in worst regions
    pub ssim_min: f64,
    
    /// 5th percentile SSIM (excludes outliers)  
    pub ssim_p5: f64,
    
    /// Number of tiles analyzed
    pub tile_count: usize,
    
    /// Tiles that exceed quality targets
    pub tiles_exceeding_targets: usize,
    
    /// Content-weighted quality score (0.0-1.0)
    pub content_weighted_quality: f64,
    
    /// Meets roadmap quality targets
    pub meets_targets: bool,
}

/// Quality improvement measurement from Phase B refinement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityImprovement {
    /// Baseline Phase A metrics
    pub baseline_metrics: QualityMetrics,
    
    /// Refined Phase B metrics
    pub refined_metrics: QualityMetrics,
    
    /// ΔE improvement (positive = better)
    pub delta_e_improvement: f64,
    
    /// SSIM improvement (positive = better)
    pub ssim_improvement: f64,
    
    /// Relative improvement percentage
    pub relative_improvement_percent: f64,
    
    /// Final ΔE after refinement
    pub final_delta_e: f64,
    
    /// Final SSIM after refinement
    pub final_ssim: f64,
    
    /// Quality targets achieved after refinement
    pub targets_achieved: bool,
    
    /// Refinement effectiveness score (0.0-1.0)
    pub refinement_effectiveness: f64,
}

/// Comprehensive quality analysis report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityReport {
    /// Algorithm tested
    pub algorithm: String,
    
    /// Test image information
    pub image_path: String,
    pub image_dimensions: (u32, u32),
    
    /// Phase A baseline quality
    pub phase_a_quality: QualityMetrics,
    
    /// Phase B improvement analysis
    pub phase_b_improvement: QualityImprovement,
    
    /// Detailed tile analysis
    pub tile_analysis: TileQualityAnalysis,
    
    /// Quality validation results
    pub validation_results: QualityValidationResult,
    
    /// Meets overall quality targets
    pub meets_targets: bool,
    
    /// Report generation timestamp
    pub timestamp: String,
}

/// Detailed tile-by-tile quality analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TileQualityAnalysis {
    /// Tile size used for analysis
    pub tile_size: u32,
    
    /// Total tiles analyzed
    pub total_tiles: usize,
    
    /// Tiles requiring refinement
    pub tiles_needing_refinement: usize,
    
    /// Quality distribution by tile
    pub quality_distribution: QualityDistribution,
    
    /// Worst performing tiles
    pub worst_tiles: Vec<TileQualityInfo>,
    
    /// Content analysis results
    pub content_analysis: ContentQualityAnalysis,
}

/// Quality metric distribution analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityDistribution {
    /// ΔE distribution quartiles
    pub delta_e_quartiles: [f64; 4], // Q1, Q2(median), Q3, Q4(max)
    
    /// SSIM distribution quartiles
    pub ssim_quartiles: [f64; 4],
    
    /// Tiles in quality ranges
    pub tiles_by_quality_range: HashMap<String, usize>,
}

/// Information about individual tile quality
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TileQualityInfo {
    /// Tile position (x, y)
    pub position: (u32, u32),
    
    /// Tile quality metrics
    pub delta_e: f64,
    pub ssim: f64,
    
    /// Content type in tile
    pub content_type: String,
    
    /// Priority for refinement
    pub refinement_priority: f64,
}

/// Content-aware quality analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentQualityAnalysis {
    /// Quality by content type
    pub quality_by_content: HashMap<String, QualityMetrics>,
    
    /// Edge region quality
    pub edge_quality: QualityMetrics,
    
    /// Smooth region quality
    pub smooth_quality: QualityMetrics,
    
    /// Texture region quality
    pub texture_quality: QualityMetrics,
}

/// Quality validation against roadmap targets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityValidationResult {
    /// ΔE target validation (≤ 6.0)
    pub delta_e_target_met: bool,
    pub delta_e_target_value: f64,
    pub delta_e_actual_value: f64,
    
    /// SSIM target validation (≥ 0.93)
    pub ssim_target_met: bool,
    pub ssim_target_value: f64,
    pub ssim_actual_value: f64,
    
    /// Combined targets met
    pub all_targets_met: bool,
    
    /// Target achievement margin
    pub delta_e_margin: f64, // Negative if target missed
    pub ssim_margin: f64,    // Negative if target missed
}

/// Measure baseline quality of Phase A algorithm output
/// 
/// This function analyzes the quality of Phase A vectorization results by
/// rasterizing the SVG paths and comparing against the original image using
/// Phase B infrastructure for consistent measurement.
/// 
/// # Arguments
/// * `paths` - SVG paths from Phase A algorithm
/// * `original_image` - Original input image for comparison
/// 
/// # Returns
/// * `VectorizeResult<QualityMetrics>` - Comprehensive quality analysis
/// 
/// # Quality Metrics
/// * ΔE analysis using LAB color space comparison
/// * SSIM analysis for structural similarity
/// * Tile-based detailed error mapping
/// * Content-weighted quality scoring
pub fn measure_phase_a_quality(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> VectorizeResult<QualityMetrics> {
    log::debug!("Measuring Phase A baseline quality for {} paths", paths.len());
    
    // Rasterize Phase A paths using Phase B infrastructure
    let svg_config = SvgConfig::default();
    let rasterized_image = rasterize_svg_paths(
        paths,
        original_image.width(),
        original_image.height(),
        &svg_config,
    ).map_err(|e| crate::error::VectorizeError::algorithm_error(format!("Phase A rasterization failed: {}", e)))?;
    
    // Configure tile analysis for comprehensive quality measurement
    let tile_config = TileAnalysisConfig {
        tile_size: 32, // Standard tile size for quality analysis
        max_tiles_per_iteration: 10000, // Large number to analyze entire image
        delta_e_threshold: 100.0, // High threshold to capture all tiles
        ssim_threshold: 0.0,     // Low threshold to capture all tiles
        use_content_weighting: true, // Enable content-aware weighting
    };
    
    // Compute detailed tile errors
    let tile_errors = compute_tile_errors(
        original_image,
        &rasterized_image,
        &tile_config,
    ).map_err(|e| crate::error::VectorizeError::algorithm_error(format!("Tile analysis failed: {}", e)))?;
    
    // Calculate comprehensive quality metrics
    let metrics = calculate_quality_metrics_from_tiles(&tile_errors)?;
    
    log::debug!("Phase A quality measured: ΔE={:.1}, SSIM={:.3}, tiles={}", 
              metrics.delta_e_avg, metrics.ssim_avg, metrics.tile_count);
    
    Ok(metrics)
}

/// Measure quality improvement from Phase B refinement
/// 
/// This function quantifies the improvement achieved by Phase B refinement
/// by comparing Phase A baseline quality with refined output quality.
/// 
/// # Arguments
/// * `phase_a_paths` - Original Phase A SVG paths
/// * `phase_b_paths` - Refined Phase B SVG paths  
/// * `original_image` - Original input image for comparison
/// * `refine_config` - Phase B configuration for context
/// 
/// # Returns
/// * `VectorizeResult<QualityImprovement>` - Detailed improvement analysis
/// 
/// # Analysis
/// * Baseline vs refined quality comparison
/// * Improvement quantification and relative scoring
/// * Target achievement validation
/// * Refinement effectiveness scoring
pub fn measure_phase_b_improvement(
    phase_a_paths: &[SvgPath],
    phase_b_paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    refine_config: &RefineConfig,
) -> VectorizeResult<QualityImprovement> {
    log::debug!("Measuring Phase B improvement: {} → {} paths", 
              phase_a_paths.len(), phase_b_paths.len());
    
    // Measure Phase A baseline quality
    let baseline_metrics = measure_phase_a_quality(phase_a_paths, original_image)?;
    
    // Measure Phase B refined quality
    let refined_metrics = measure_phase_a_quality(phase_b_paths, original_image)?;
    
    // Calculate improvements
    let delta_e_improvement = baseline_metrics.delta_e_avg - refined_metrics.delta_e_avg;
    let ssim_improvement = refined_metrics.ssim_avg - baseline_metrics.ssim_avg;
    
    // Calculate relative improvement percentage
    let relative_improvement = if baseline_metrics.delta_e_avg > 0.0 {
        (delta_e_improvement / baseline_metrics.delta_e_avg) * 100.0
    } else {
        0.0
    };
    
    // Validate target achievement
    let targets_achieved = refined_metrics.delta_e_avg <= refine_config.target_delta_e 
                        && refined_metrics.ssim_avg >= refine_config.target_ssim;
    
    // Calculate refinement effectiveness (0.0-1.0)
    let refinement_effectiveness = calculate_refinement_effectiveness(
        &baseline_metrics,
        &refined_metrics,
        refine_config,
    );
    
    let improvement = QualityImprovement {
        baseline_metrics: baseline_metrics.clone(),
        refined_metrics: refined_metrics.clone(),
        delta_e_improvement,
        ssim_improvement,
        relative_improvement_percent: relative_improvement,
        final_delta_e: refined_metrics.delta_e_avg,
        final_ssim: refined_metrics.ssim_avg,
        targets_achieved,
        refinement_effectiveness,
    };
    
    log::debug!("Phase B improvement measured: ΔE improvement={:.1}, SSIM improvement={:.3}, effectiveness={:.2}", 
              improvement.delta_e_improvement, improvement.ssim_improvement, improvement.refinement_effectiveness);
    
    Ok(improvement)
}

/// Validate quality against roadmap targets
/// 
/// This function validates measured quality metrics against the project roadmap
/// targets and provides detailed target achievement analysis.
/// 
/// # Arguments
/// * `metrics` - Quality metrics to validate
/// * `targets` - Quality targets from configuration
/// 
/// # Returns
/// * `QualityValidationResult` - Detailed target validation results
/// 
/// # Roadmap Targets
/// * ΔE ≤ 6.0 - Perceptual color accuracy
/// * SSIM ≥ 0.93 - Structural similarity
/// * Combined target achievement for overall quality
pub fn validate_quality_targets(
    metrics: &QualityMetrics,
    target_delta_e: f64,
    target_ssim: f64,
) -> QualityValidationResult {
    let delta_e_target_met = metrics.delta_e_avg <= target_delta_e;
    let ssim_target_met = metrics.ssim_avg >= target_ssim;
    let all_targets_met = delta_e_target_met && ssim_target_met;
    
    let delta_e_margin = target_delta_e - metrics.delta_e_avg; // Positive if target met
    let ssim_margin = metrics.ssim_avg - target_ssim;         // Positive if target met
    
    log::debug!("Quality validation: ΔE target {} (margin: {:.1}), SSIM target {} (margin: {:.3}), all met: {}", 
              delta_e_target_met, delta_e_margin, ssim_target_met, ssim_margin, all_targets_met);
    
    QualityValidationResult {
        delta_e_target_met,
        delta_e_target_value: target_delta_e,
        delta_e_actual_value: metrics.delta_e_avg,
        ssim_target_met,
        ssim_target_value: target_ssim,
        ssim_actual_value: metrics.ssim_avg,
        all_targets_met,
        delta_e_margin,
        ssim_margin,
    }
}

/// Generate comprehensive quality report
/// 
/// This function creates a detailed quality analysis report combining Phase A
/// baseline measurements, Phase B improvement analysis, and target validation.
/// 
/// # Arguments
/// * `algorithm` - Algorithm name being tested
/// * `image_path` - Test image path  
/// * `phase_a_paths` - Phase A SVG paths
/// * `phase_b_paths` - Phase B refined paths
/// * `original_image` - Original input image
/// * `refine_config` - Phase B refinement configuration
/// 
/// # Returns
/// * `VectorizeResult<QualityReport>` - Comprehensive quality analysis report
/// 
/// # Report Contents
/// * Baseline Phase A quality analysis
/// * Phase B improvement quantification
/// * Detailed tile-by-tile analysis
/// * Target validation results
/// * Content-aware quality breakdown
pub async fn generate_quality_report(
    algorithm: &str,
    image_path: &str,
    phase_a_paths: &[SvgPath],
    phase_b_paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    refine_config: &RefineConfig,
) -> VectorizeResult<QualityReport> {
    log::info!("Generating comprehensive quality report for {} algorithm", algorithm);
    
    // Measure Phase A baseline quality
    let phase_a_quality = measure_phase_a_quality(phase_a_paths, original_image)?;
    
    // Measure Phase B improvement  
    let phase_b_improvement = measure_phase_b_improvement(
        phase_a_paths, phase_b_paths, original_image, refine_config
    )?;
    
    // Generate detailed tile analysis
    let tile_analysis = generate_tile_analysis(original_image, phase_b_paths, refine_config).await?;
    
    // Validate against targets
    let validation_results = validate_quality_targets(
        &phase_b_improvement.refined_metrics,
        refine_config.target_delta_e,
        refine_config.target_ssim,
    );
    
    let meets_targets = validation_results.all_targets_met;
    
    let report = QualityReport {
        algorithm: algorithm.to_string(),
        image_path: image_path.to_string(),
        image_dimensions: (original_image.width(), original_image.height()),
        phase_a_quality,
        phase_b_improvement,
        tile_analysis,
        validation_results,
        meets_targets,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    
    log::info!("Quality report generated: targets_met={}, ΔE={:.1}, SSIM={:.3}", 
              report.meets_targets, 
              report.phase_b_improvement.final_delta_e,
              report.phase_b_improvement.final_ssim);
    
    Ok(report)
}

// Helper function implementations

/// Calculate comprehensive quality metrics from tile error data
fn calculate_quality_metrics_from_tiles(
    tile_errors: &[TileError],
) -> VectorizeResult<QualityMetrics> {
    if tile_errors.is_empty() {
        return Ok(QualityMetrics {
            delta_e_avg: 0.0,
            delta_e_max: 0.0,
            delta_e_p95: 0.0,
            ssim_avg: 1.0,
            ssim_min: 1.0,
            ssim_p5: 1.0,
            tile_count: 0,
            tiles_exceeding_targets: 0,
            content_weighted_quality: 1.0,
            meets_targets: true,
        });
    }
    
    // Extract ΔE and SSIM values
    let mut delta_e_values: Vec<f64> = tile_errors.iter().map(|t| t.delta_e_avg).collect();
    let mut ssim_values: Vec<f64> = tile_errors.iter().map(|t| t.ssim).collect();
    
    // Sort for percentile calculations
    delta_e_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    ssim_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    // Calculate basic statistics
    let delta_e_avg = delta_e_values.iter().sum::<f64>() / delta_e_values.len() as f64;
    let delta_e_max = *delta_e_values.last().unwrap();
    let delta_e_p95 = percentile(&delta_e_values, 95.0);
    
    let ssim_avg = ssim_values.iter().sum::<f64>() / ssim_values.len() as f64;
    let ssim_min = *ssim_values.first().unwrap();
    let ssim_p5 = percentile(&ssim_values, 5.0);
    
    // Count tiles exceeding targets
    let tiles_exceeding_targets = tile_errors.iter()
        .filter(|t| t.delta_e_avg > 6.0 || t.ssim < 0.93)
        .count();
    
    // Calculate content-weighted quality score
    let content_weighted_quality = calculate_content_weighted_quality(tile_errors);
    
    // Check if meets targets
    let meets_targets = delta_e_avg <= 6.0 && ssim_avg >= 0.93;
    
    Ok(QualityMetrics {
        delta_e_avg,
        delta_e_max,
        delta_e_p95,
        ssim_avg,
        ssim_min,
        ssim_p5,
        tile_count: tile_errors.len(),
        tiles_exceeding_targets,
        content_weighted_quality,
        meets_targets,
    })
}

/// Calculate refinement effectiveness score (0.0-1.0)
fn calculate_refinement_effectiveness(
    baseline: &QualityMetrics,
    refined: &QualityMetrics,
    config: &RefineConfig,
) -> f64 {
    // Calculate how much of the possible improvement was achieved
    let max_possible_delta_e_improvement = (baseline.delta_e_avg - config.target_delta_e).max(0.0);
    let actual_delta_e_improvement = (baseline.delta_e_avg - refined.delta_e_avg).max(0.0);
    
    let max_possible_ssim_improvement = (config.target_ssim - baseline.ssim_avg).max(0.0);
    let actual_ssim_improvement = (refined.ssim_avg - baseline.ssim_avg).max(0.0);
    
    // Calculate effectiveness ratios
    let delta_e_effectiveness = if max_possible_delta_e_improvement > 0.0 {
        (actual_delta_e_improvement / max_possible_delta_e_improvement).min(1.0)
    } else {
        1.0 // Already at target
    };
    
    let ssim_effectiveness = if max_possible_ssim_improvement > 0.0 {
        (actual_ssim_improvement / max_possible_ssim_improvement).min(1.0)
    } else {
        1.0 // Already at target
    };
    
    // Combined effectiveness score (weighted average)
    (delta_e_effectiveness + ssim_effectiveness) / 2.0
}

/// Calculate content-weighted quality score
fn calculate_content_weighted_quality(tile_errors: &[TileError]) -> f64 {
    // Weight tiles by content importance
    // This is a simplified implementation - could be enhanced with actual content analysis
    let mut weighted_quality = 0.0;
    let mut total_weight = 0.0;
    
    for tile_error in tile_errors {
        // Higher weight for tiles with more content (simplified by using tile area)
        let weight = 1.0; // Could be enhanced with actual content analysis
        
        // Convert ΔE to quality score (0.0-1.0)
        let quality_score = (10.0 - tile_error.delta_e_avg.min(10.0)) / 10.0;
        
        weighted_quality += quality_score * weight;
        total_weight += weight;
    }
    
    if total_weight > 0.0 {
        weighted_quality / total_weight
    } else {
        1.0
    }
}

/// Calculate percentile value from sorted array
fn percentile(sorted_values: &[f64], percentile: f64) -> f64 {
    if sorted_values.is_empty() {
        return 0.0;
    }
    
    let index = ((percentile / 100.0) * (sorted_values.len() - 1) as f64) as usize;
    sorted_values[index.min(sorted_values.len() - 1)]
}

/// Generate detailed tile analysis
async fn generate_tile_analysis(
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    refined_paths: &[SvgPath],
    refine_config: &RefineConfig,
) -> VectorizeResult<TileQualityAnalysis> {
    // Rasterize refined paths
    let svg_config = SvgConfig::default();
    let rasterized = rasterize_svg_paths(
        refined_paths,
        original_image.width(),
        original_image.height(),
        &svg_config,
    ).map_err(|e| crate::error::VectorizeError::algorithm_error(format!("Rasterization failed: {}", e)))?;
    
    // Configure tile analysis
    let tile_config = TileAnalysisConfig {
        tile_size: refine_config.tile_size,
        max_tiles_per_iteration: 10000, // Analyze all tiles
        delta_e_threshold: 100.0,
        ssim_threshold: 0.0,
        use_content_weighting: true,
    };
    
    // Compute tile errors
    let tile_errors = compute_tile_errors(original_image, &rasterized, &tile_config)
        .map_err(|e| crate::error::VectorizeError::algorithm_error(format!("Tile analysis failed: {}", e)))?;
    
    // Calculate distribution
    let quality_distribution = calculate_quality_distribution(&tile_errors);
    
    // Find worst tiles
    let mut worst_tiles: Vec<_> = tile_errors.iter()
        .map(|t| TileQualityInfo {
            position: (t.x, t.y),
            delta_e: t.delta_e_avg,
            ssim: t.ssim,
            content_type: "unknown".to_string(), // Could be enhanced
            refinement_priority: t.delta_e_avg + (1.0 - t.ssim) * 10.0,
        })
        .collect();
    
    worst_tiles.sort_by(|a, b| b.refinement_priority.partial_cmp(&a.refinement_priority).unwrap());
    worst_tiles.truncate(10); // Keep top 10 worst tiles
    
    // Generate content analysis (simplified)
    let content_analysis = ContentQualityAnalysis {
        quality_by_content: HashMap::new(), // Could be enhanced
        edge_quality: calculate_quality_metrics_from_tiles(&tile_errors)?,
        smooth_quality: calculate_quality_metrics_from_tiles(&tile_errors)?,
        texture_quality: calculate_quality_metrics_from_tiles(&tile_errors)?,
    };
    
    let tiles_needing_refinement = tile_errors.iter()
        .filter(|t| t.delta_e_avg > refine_config.target_delta_e || t.ssim < refine_config.target_ssim)
        .count();
    
    Ok(TileQualityAnalysis {
        tile_size: tile_config.tile_size,
        total_tiles: tile_errors.len(),
        tiles_needing_refinement,
        quality_distribution,
        worst_tiles,
        content_analysis,
    })
}

/// Calculate quality distribution analysis
fn calculate_quality_distribution(tile_errors: &[TileError]) -> QualityDistribution {
    if tile_errors.is_empty() {
        return QualityDistribution {
            delta_e_quartiles: [0.0, 0.0, 0.0, 0.0],
            ssim_quartiles: [1.0, 1.0, 1.0, 1.0],
            tiles_by_quality_range: HashMap::new(),
        };
    }
    
    let mut delta_e_values: Vec<f64> = tile_errors.iter().map(|t| t.delta_e_avg).collect();
    let mut ssim_values: Vec<f64> = tile_errors.iter().map(|t| t.ssim).collect();
    
    delta_e_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    ssim_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let delta_e_quartiles = [
        percentile(&delta_e_values, 25.0),
        percentile(&delta_e_values, 50.0),
        percentile(&delta_e_values, 75.0),
        percentile(&delta_e_values, 100.0),
    ];
    
    let ssim_quartiles = [
        percentile(&ssim_values, 25.0),
        percentile(&ssim_values, 50.0),
        percentile(&ssim_values, 75.0),
        percentile(&ssim_values, 100.0),
    ];
    
    // Calculate tiles by quality range
    let mut tiles_by_range = HashMap::new();
    tiles_by_range.insert("excellent".to_string(), tile_errors.iter().filter(|t| t.delta_e_avg <= 3.0 && t.ssim >= 0.95).count());
    tiles_by_range.insert("good".to_string(), tile_errors.iter().filter(|t| t.delta_e_avg <= 6.0 && t.ssim >= 0.93).count());
    tiles_by_range.insert("acceptable".to_string(), tile_errors.iter().filter(|t| t.delta_e_avg <= 10.0 && t.ssim >= 0.85).count());
    tiles_by_range.insert("poor".to_string(), tile_errors.iter().filter(|t| t.delta_e_avg > 10.0 || t.ssim < 0.85).count());
    
    QualityDistribution {
        delta_e_quartiles,
        ssim_quartiles,
        tiles_by_quality_range: tiles_by_range,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quality_metrics_calculation() {
        let tile_errors = vec![
            TileError {
                x: 0, y: 0,
                width: 32, height: 32,
                delta_e_avg: 5.0,
                delta_e_max: 8.0,
                ssim: 0.95,
                priority: 1.0,
                pixel_count: 1024,
            },
            TileError {
                x: 32, y: 0,
                width: 32, height: 32,
                delta_e_avg: 3.0,
                delta_e_max: 5.0,
                ssim: 0.97,
                priority: 0.5,
                pixel_count: 1024,
            }
        ];
        
        let metrics = calculate_quality_metrics_from_tiles(&tile_errors).unwrap();
        assert_eq!(metrics.tile_count, 2);
        assert_eq!(metrics.delta_e_avg, 4.0);
        assert_eq!(metrics.ssim_avg, 0.96);
        assert!(metrics.meets_targets);
    }
    
    #[test]
    fn test_percentile_calculation() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(percentile(&values, 50.0), 3.0);
        assert_eq!(percentile(&values, 100.0), 5.0);
    }
    
    #[test]
    fn test_quality_validation() {
        let metrics = QualityMetrics {
            delta_e_avg: 5.0,
            ssim_avg: 0.94,
            delta_e_max: 8.0,
            delta_e_p95: 7.0,
            ssim_min: 0.92,
            ssim_p5: 0.93,
            tile_count: 100,
            tiles_exceeding_targets: 5,
            content_weighted_quality: 0.85,
            meets_targets: true,
        };
        
        let validation = validate_quality_targets(&metrics, 6.0, 0.93);
        assert!(validation.delta_e_target_met);
        assert!(validation.ssim_target_met);
        assert!(validation.all_targets_met);
        assert!(validation.delta_e_margin > 0.0);
        assert!(validation.ssim_margin > 0.0);
    }
}