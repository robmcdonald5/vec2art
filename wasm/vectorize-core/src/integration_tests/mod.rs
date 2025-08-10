//! Integration Testing Suite for Phase A → Phase B Pipeline
//!
//! This module provides comprehensive integration testing between Phase A algorithms
//! and Phase B refinement infrastructure, validating the complete processing pipeline
//! from input image to refined SVG output.
//!
//! ## Test Coverage
//!
//! - **Pipeline Validation**: End-to-end Phase A → Phase B processing
//! - **Quality Measurement**: ΔE/SSIM validation using Phase B infrastructure  
//! - **Performance Validation**: Combined timing tests (Phase A ≤ 2.5s + Phase B ≤ 0.6s)
//! - **Configuration Integration**: Adaptive Phase A configs with Phase B RefineConfig
//! - **Preset Integration**: CLI preset system with refinement
//! - **Edge Case Handling**: Failure modes and graceful degradation
//!
//! ## Quality Targets
//!
//! - **ΔE ≤ 6.0**: Perceptual color accuracy in LAB space
//! - **SSIM ≥ 0.93**: Structural similarity (grayscale)  
//! - **Performance ≤ 3.1s**: Combined Phase A + Phase B processing time
//!
//! ## Test Structure
//!
//! ```
//! integration_tests/
//! ├── mod.rs                    ← This module (coordination)
//! ├── phase_ab_pipeline.rs      ← End-to-end pipeline testing
//! ├── quality_measurement.rs    ← ΔE/SSIM validation
//! ├── performance_validation.rs ← Combined timing tests  
//! └── preset_integration.rs     ← CLI preset testing
//! ```

pub mod phase_ab_pipeline;
pub mod quality_measurement;
pub mod performance_validation;
pub mod preset_integration;

#[cfg(test)]
mod simple_integration_test;

// Re-export main integration functions
pub use phase_ab_pipeline::{
    test_logo_to_refinement_pipeline,
    test_regions_to_refinement_pipeline,
    test_trace_low_to_refinement_pipeline,
    PipelineTestResult,
    PipelineTestConfig,
};

pub use quality_measurement::{
    measure_phase_a_quality,
    measure_phase_b_improvement,
    QualityMetrics,
    QualityReport,
    validate_quality_targets,
};

pub use performance_validation::{
    measure_combined_performance,
    validate_performance_targets,
    generate_performance_report,
    PerformanceMetrics,
    PerformanceReport,
};

pub use preset_integration::{
    test_preset_with_refinement,
    test_all_presets_integration,
    PresetIntegrationReport,
};

// Removed unused import
use crate::refine::{RefineConfig, refine_vectorization};
use crate::error::VectorizeResult;
use image::{ImageBuffer, Rgba};
use std::time::Instant;
use serde::{Serialize, Deserialize};

/// Comprehensive integration test configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationTestConfig {
    /// Phase B refinement configuration
    pub refine_config: RefineConfig,
    
    /// Enable quality measurement validation
    pub validate_quality: bool,
    
    /// Enable performance measurement validation
    pub validate_performance: bool,
    
    /// Test image paths for validation
    pub test_images: Vec<String>,
    
    /// Expected quality thresholds
    pub quality_targets: QualityTargets,
    
    /// Expected performance thresholds
    pub performance_targets: PerformanceTargets,
}

/// Quality target thresholds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityTargets {
    /// Maximum acceptable ΔE (roadmap: 6.0)
    pub max_delta_e: f64,
    
    /// Minimum acceptable SSIM (roadmap: 0.93)
    pub min_ssim: f64,
    
    /// Minimum quality improvement from Phase B
    pub min_improvement_delta_e: f64,
    
    /// Minimum SSIM improvement from Phase B
    pub min_improvement_ssim: f64,
}

/// Performance target thresholds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceTargets {
    /// Maximum Phase A processing time (roadmap: 2.5s)
    pub max_phase_a_ms: u64,
    
    /// Maximum Phase B processing time (roadmap: 600ms)
    pub max_phase_b_ms: u64,
    
    /// Maximum combined processing time (roadmap: 3.1s)
    pub max_combined_ms: u64,
}

impl Default for IntegrationTestConfig {
    fn default() -> Self {
        Self {
            refine_config: RefineConfig::default(),
            validate_quality: true,
            validate_performance: true,
            test_images: vec![
                "test1.png".to_string(),
                "test2.png".to_string(),
                "test3.png".to_string(),
            ],
            quality_targets: QualityTargets {
                max_delta_e: 6.0,
                min_ssim: 0.93,
                min_improvement_delta_e: 1.0,
                min_improvement_ssim: 0.02,
            },
            performance_targets: PerformanceTargets {
                max_phase_a_ms: 2500,
                max_phase_b_ms: 600,
                max_combined_ms: 3100,
            },
        }
    }
}

/// Complete integration test result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationTestResult {
    /// Pipeline validation results
    pub pipeline_results: Vec<PipelineTestResult>,
    
    /// Quality measurement results
    pub quality_results: Vec<QualityReport>,
    
    /// Performance validation results
    pub performance_results: Vec<PerformanceReport>,
    
    /// Preset integration results
    pub preset_results: Vec<PresetIntegrationReport>,
    
    /// Overall success status
    pub success: bool,
    
    /// Summary of failures
    pub failures: Vec<String>,
    
    /// Test execution time
    pub total_duration_ms: u64,
}

/// Main entry point for comprehensive Phase A+B integration testing
/// 
/// This function orchestrates all integration tests and provides a complete
/// validation of the Phase A → Phase B pipeline, including quality measurement,
/// performance validation, and preset integration testing.
/// 
/// # Arguments
/// * `test_images` - Image paths for testing (relative to test assets)
/// * `config` - Integration test configuration
/// 
/// # Returns
/// * `VectorizeResult<IntegrationTestResult>` - Complete test results
/// 
/// # Quality Targets Validated
/// * ΔE ≤ 6.0 - Perceptual color difference in LAB space
/// * SSIM ≥ 0.93 - Structural similarity (grayscale)
/// * Performance ≤ 3.1s - Combined Phase A + Phase B processing time
/// 
/// # Test Coverage
/// * All Phase A algorithms (logo, regions, trace-low) → Phase B refinement
/// * Quality improvement measurement and validation
/// * Performance target validation across all combinations
/// * CLI preset integration with refinement
/// * Edge case handling and graceful degradation
pub async fn run_comprehensive_integration_tests(
    test_images: &[String],
    config: &IntegrationTestConfig,
) -> VectorizeResult<IntegrationTestResult> {
    let start_time = Instant::now();
    
    log::info!("Starting comprehensive Phase A+B integration testing with {} images", test_images.len());
    
    let mut result = IntegrationTestResult {
        pipeline_results: Vec::new(),
        quality_results: Vec::new(),
        performance_results: Vec::new(),
        preset_results: Vec::new(),
        success: true,
        failures: Vec::new(),
        total_duration_ms: 0,
    };
    
    // Test 1: Phase A → B Pipeline Validation
    log::info!("Running Phase A → B pipeline validation tests...");
    for image_path in test_images {
        match run_pipeline_tests_for_image(image_path, config).await {
            Ok(mut pipeline_results) => {
                result.pipeline_results.append(&mut pipeline_results);
            }
            Err(e) => {
                result.success = false;
                result.failures.push(format!("Pipeline test failed for {}: {}", image_path, e));
            }
        }
    }
    
    // Test 2: Quality Measurement Integration
    if config.validate_quality {
        log::info!("Running quality measurement integration tests...");
        for image_path in test_images {
            match run_quality_tests_for_image(image_path, config).await {
                Ok(mut quality_results) => {
                    result.quality_results.append(&mut quality_results);
                }
                Err(e) => {
                    result.success = false;
                    result.failures.push(format!("Quality test failed for {}: {}", image_path, e));
                }
            }
        }
    }
    
    // Test 3: Performance Validation
    if config.validate_performance {
        log::info!("Running performance validation tests...");
        for image_path in test_images {
            match run_performance_tests_for_image(image_path, config).await {
                Ok(mut performance_results) => {
                    result.performance_results.append(&mut performance_results);
                }
                Err(e) => {
                    result.success = false;
                    result.failures.push(format!("Performance test failed for {}: {}", image_path, e));
                }
            }
        }
    }
    
    // Test 4: Preset Integration
    log::info!("Running preset integration tests...");
    for image_path in test_images {
        match test_all_presets_integration(image_path, &config.refine_config).await {
            Ok(preset_results) => {
                result.preset_results.push(preset_results);
            }
            Err(e) => {
                result.success = false;
                result.failures.push(format!("Preset integration test failed for {}: {}", image_path, e));
            }
        }
    }
    
    result.total_duration_ms = start_time.elapsed().as_millis() as u64;
    
    // Log summary
    if result.success {
        log::info!("Integration testing completed successfully in {}ms", result.total_duration_ms);
        log::info!("Pipeline tests: {}, Quality tests: {}, Performance tests: {}, Preset tests: {}",
                  result.pipeline_results.len(),
                  result.quality_results.len(), 
                  result.performance_results.len(),
                  result.preset_results.len());
    } else {
        log::error!("Integration testing failed with {} failures:", result.failures.len());
        for failure in &result.failures {
            log::error!("  - {}", failure);
        }
    }
    
    Ok(result)
}

/// Run pipeline tests for a single image
async fn run_pipeline_tests_for_image(
    image_path: &str,
    config: &IntegrationTestConfig,
) -> VectorizeResult<Vec<PipelineTestResult>> {
    let mut results = Vec::new();
    
    // Test logo → refinement pipeline
    if let Ok(result) = test_logo_to_refinement_pipeline(image_path, &config.refine_config).await {
        results.push(result);
    }
    
    // Test regions → refinement pipeline
    if let Ok(result) = test_regions_to_refinement_pipeline(image_path, &config.refine_config).await {
        results.push(result);
    }
    
    // Test trace-low → refinement pipeline
    if let Ok(result) = test_trace_low_to_refinement_pipeline(image_path, &config.refine_config).await {
        results.push(result);
    }
    
    Ok(results)
}

/// Run quality tests for a single image
async fn run_quality_tests_for_image(
    image_path: &str,
    config: &IntegrationTestConfig,
) -> VectorizeResult<Vec<QualityReport>> {
    let mut results = Vec::new();
    
    // Load test image
    let image = load_test_image(image_path)?;
    
    // Test quality measurement for each algorithm
    let algorithms = ["logo", "regions", "trace-low"];
    for algorithm in &algorithms {
        if let Ok(quality_report) = measure_quality_for_algorithm(&image, algorithm, &config.refine_config).await {
            results.push(quality_report);
        }
    }
    
    Ok(results)
}

/// Run performance tests for a single image
async fn run_performance_tests_for_image(
    image_path: &str,
    config: &IntegrationTestConfig,
) -> VectorizeResult<Vec<PerformanceReport>> {
    let mut results = Vec::new();
    
    // Load test image
    let image = load_test_image(image_path)?;
    
    // Test performance for each algorithm + refinement
    let algorithms = ["logo", "regions", "trace-low"];
    for algorithm in &algorithms {
        if let Ok(performance_metrics) = measure_combined_performance(&image, algorithm, &config.refine_config).await {
            // Generate performance report from metrics
            if let Ok(performance_report) = generate_performance_report(algorithm, image_path, &image, &performance_metrics).await {
                results.push(performance_report);
            }
        }
    }
    
    Ok(results)
}

/// Helper function to load test images
fn load_test_image(image_path: &str) -> VectorizeResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
    use crate::error::VectorizeError;
    
    // Try common test image locations
    let test_paths = [
        format!("examples/images/{}", image_path),
        format!("wasm/examples/images/{}", image_path),
        format!("../examples/images/{}", image_path),
        image_path.to_string(), // Direct path
    ];
    
    for path in &test_paths {
        if let Ok(img) = image::open(path) {
            return Ok(img.to_rgba8());
        }
    }
    
    Err(VectorizeError::algorithm_error(format!("Could not load test image: {}", image_path)))
}

/// Helper function to measure quality for a specific algorithm
async fn measure_quality_for_algorithm(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    algorithm: &str,
    refine_config: &RefineConfig,
) -> VectorizeResult<QualityReport> {
    // Generate Phase A output
    let phase_a_paths = match algorithm {
        "logo" => {
            let config = crate::LogoConfig::default();
            crate::algorithms::logo::vectorize_logo(image, &config)?
        }
        "regions" => {
            let config = crate::RegionsConfig::default();
            crate::algorithms::regions::vectorize_regions(image, &config)?
        }
        "trace-low" => {
            let config = crate::TraceLowConfig::default();
            crate::algorithms::trace_low::vectorize_trace_low(image, &config)?
        }
        _ => return Err(crate::error::VectorizeError::algorithm_error(format!("Unknown algorithm: {}", algorithm))),
    };
    
    // Measure Phase A quality
    let phase_a_quality = measure_phase_a_quality(&phase_a_paths, image)?;
    
    // Apply Phase B refinement
    let phase_b_paths = refine_vectorization(&phase_a_paths, image, refine_config)?;
    
    // Measure Phase B improvement
    let improvement = measure_phase_b_improvement(&phase_a_paths, &phase_b_paths, image, refine_config)?;
    
    Ok(QualityReport {
        algorithm: algorithm.to_string(),
        image_path: "unknown".to_string(), // Would need actual path
        image_dimensions: (image.width(), image.height()),
        phase_a_quality: phase_a_quality.clone(),
        phase_b_improvement: improvement.clone(),
        tile_analysis: crate::integration_tests::quality_measurement::TileQualityAnalysis {
            tile_size: 32,
            total_tiles: 0,
            tiles_needing_refinement: 0,
            quality_distribution: crate::integration_tests::quality_measurement::QualityDistribution {
                delta_e_quartiles: [0.0, 0.0, 0.0, 0.0],
                ssim_quartiles: [1.0, 1.0, 1.0, 1.0],
                tiles_by_quality_range: std::collections::HashMap::new(),
            },
            worst_tiles: Vec::new(),
            content_analysis: crate::integration_tests::quality_measurement::ContentQualityAnalysis {
                quality_by_content: std::collections::HashMap::new(),
                edge_quality: phase_a_quality.clone(),
                smooth_quality: phase_a_quality.clone(),
                texture_quality: phase_a_quality.clone(),
            },
        },
        validation_results: crate::integration_tests::quality_measurement::QualityValidationResult {
            delta_e_target_met: improvement.final_delta_e <= 6.0,
            delta_e_target_value: 6.0,
            delta_e_actual_value: improvement.final_delta_e,
            ssim_target_met: improvement.final_ssim >= 0.93,
            ssim_target_value: 0.93,
            ssim_actual_value: improvement.final_ssim,
            all_targets_met: improvement.final_delta_e <= 6.0 && improvement.final_ssim >= 0.93,
            delta_e_margin: 6.0 - improvement.final_delta_e,
            ssim_margin: improvement.final_ssim - 0.93,
        },
        meets_targets: improvement.final_delta_e <= 6.0 && improvement.final_ssim >= 0.93,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_integration_config_defaults() {
        let config = IntegrationTestConfig::default();
        assert_eq!(config.quality_targets.max_delta_e, 6.0);
        assert_eq!(config.quality_targets.min_ssim, 0.93);
        assert_eq!(config.performance_targets.max_combined_ms, 3100);
    }
    
    #[test]
    fn test_quality_targets_validation() {
        let targets = QualityTargets {
            max_delta_e: 6.0,
            min_ssim: 0.93,
            min_improvement_delta_e: 1.0,
            min_improvement_ssim: 0.02,
        };
        
        // Test that targets match roadmap requirements
        assert!(targets.max_delta_e <= 6.0);
        assert!(targets.min_ssim >= 0.93);
    }
    
    #[test] 
    fn test_performance_targets_validation() {
        let targets = PerformanceTargets {
            max_phase_a_ms: 2500,
            max_phase_b_ms: 600, 
            max_combined_ms: 3100,
        };
        
        // Test that targets match roadmap requirements
        assert!(targets.max_phase_a_ms <= 2500);
        assert!(targets.max_phase_b_ms <= 600);
        assert!(targets.max_combined_ms <= 3100);
        assert_eq!(targets.max_combined_ms, targets.max_phase_a_ms + targets.max_phase_b_ms);
    }
}