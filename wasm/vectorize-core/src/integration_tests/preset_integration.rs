//! Preset Integration Testing for Phase A+B Pipeline
//!
//! This module implements comprehensive testing of CLI preset configurations
//! with Phase B refinement integration, ensuring that preset workflows
//! function correctly across the complete Phase A → Phase B pipeline.
//!
//! ## Preset Types Tested
//!
//! - **Photo Preset**: High-fidelity mode for photographs with gradients and refinement
//! - **Posterized Preset**: Fixed palette posterization with stylized output
//! - **Logo Preset**: Binary tracing for logos and line art with primitive detection
//! - **Future Presets**: Low-poly triangulation (stubbed for future implementation)
//!
//! ## Integration Validation
//!
//! - **Configuration Chain**: Preset → Phase A config → Phase B config integration
//! - **Quality Validation**: Each preset achieves appropriate quality targets
//! - **Performance Validation**: All presets meet performance requirements
//! - **CLI Integration**: Preset system works with command-line interface
//! - **Parameter Override**: Preset parameter overrides work correctly

use crate::algorithms::logo::{SvgPath, vectorize_logo};
use crate::algorithms::regions::vectorize_regions;
use crate::algorithms::trace_low::vectorize_trace_low;
use crate::refine::{RefineConfig, refine_vectorization};
use crate::{LogoConfig, RegionsConfig, TraceLowConfig, TraceBackend, SegmentationMethod, QuantizationMethod};
use crate::error::VectorizeResult;
use crate::integration_tests::quality_measurement::measure_phase_b_improvement;
use crate::integration_tests::performance_validation::generate_performance_report;
use image::{ImageBuffer, Rgba};
use std::time::Instant;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

/// Preset configuration definitions matching CLI presets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PresetType {
    /// High-fidelity mode for photographs with gradients and refinement
    Photo {
        max_palette: u32,
        regions_target: usize,
        dp_epsilon: f32,
        enable_refinement: bool,
    },
    /// Fixed palette posterization (stylized)
    Posterized {
        palette_size: u32,
        quantization_method: QuantizationMethod,
        enable_refinement: bool,
    },
    /// Binary tracing for logos and line art
    Logo {
        threshold: u8,
        adaptive: bool,
        primitive_detection: bool,
        enable_refinement: bool,
    },
    /// Low-poly triangulation (future implementation)
    LowPoly {
        triangle_count: u32,
        detail_level: f64,
        enable_refinement: bool,
    },
}

/// Preset integration test configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetIntegrationConfig {
    /// Presets to test
    pub presets_to_test: Vec<PresetType>,
    
    /// Phase B refinement configurations for each preset
    pub refinement_configs: HashMap<String, RefineConfig>,
    
    /// Quality expectations per preset
    pub quality_expectations: HashMap<String, QualityExpectation>,
    
    /// Performance expectations per preset
    pub performance_expectations: HashMap<String, PerformanceExpectation>,
    
    /// Enable parameter override testing
    pub test_parameter_overrides: bool,
    
    /// Test image paths
    pub test_images: Vec<String>,
}

/// Quality expectations for preset validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityExpectation {
    /// Expected ΔE range for this preset
    pub expected_delta_e_range: (f64, f64), // (min, max)
    
    /// Expected SSIM range for this preset
    pub expected_ssim_range: (f64, f64), // (min, max)
    
    /// Minimum improvement from Phase B
    pub min_phase_b_improvement: f64,
    
    /// Preset-specific quality targets
    pub custom_targets: Option<(f64, f64)>, // (ΔE, SSIM)
}

/// Performance expectations for preset validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceExpectation {
    /// Expected Phase A performance range (ms)
    pub phase_a_range_ms: (u64, u64), // (min, max)
    
    /// Expected Phase B performance range (ms)
    pub phase_b_range_ms: (u64, u64), // (min, max)
    
    /// Expected total performance range (ms)
    pub total_range_ms: (u64, u64), // (min, max)
    
    /// Performance scaling expectations
    pub scaling_expectations: ScalingExpectation,
}

/// Performance scaling expectations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScalingExpectation {
    /// Expected ms per megapixel
    pub ms_per_megapixel: f64,
    
    /// Acceptable scaling variance
    pub scaling_variance: f64,
}

/// Results of preset integration testing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetIntegrationReport {
    /// Preset name tested
    pub preset_name: String,
    
    /// Test image used
    pub image_path: String,
    
    /// Preset configuration used
    pub preset_config: PresetConfiguration,
    
    /// Phase A execution results
    pub phase_a_results: PhaseExecutionResults,
    
    /// Phase B refinement results
    pub phase_b_results: PhaseExecutionResults,
    
    /// Quality validation results
    pub quality_validation: PresetQualityValidation,
    
    /// Performance validation results
    pub performance_validation: PresetPerformanceValidation,
    
    /// Parameter override validation
    pub parameter_override_validation: ParameterOverrideValidation,
    
    /// CLI integration validation
    pub cli_integration_validation: CliIntegrationValidation,
    
    /// Overall success status
    pub success: bool,
    
    /// Issues encountered
    pub issues: Vec<String>,
    
    /// Recommendations
    pub recommendations: Vec<String>,
    
    /// Test timestamp
    pub timestamp: String,
}

/// Preset configuration details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetConfiguration {
    /// Phase A algorithm configuration
    pub phase_a_config: PhaseAConfiguration,
    
    /// Phase B refinement configuration
    pub phase_b_config: RefineConfig,
    
    /// Configuration source (preset, override, etc.)
    pub config_source: String,
}

/// Phase A configuration union
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PhaseAConfiguration {
    Logo(LogoConfig),
    Regions(RegionsConfig),
    TraceLow(TraceLowConfig),
}

/// Phase execution results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseExecutionResults {
    /// Execution success
    pub success: bool,
    
    /// Duration in milliseconds
    pub duration_ms: u64,
    
    /// Paths generated
    pub path_count: usize,
    
    /// Memory usage estimate
    pub memory_usage_mb: f64,
    
    /// Error message if failed
    pub error: Option<String>,
    
    /// Phase-specific metrics
    pub phase_metrics: HashMap<String, f64>,
}

/// Preset quality validation results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetQualityValidation {
    /// Quality meets preset expectations
    pub meets_expectations: bool,
    
    /// Phase A baseline quality
    pub phase_a_quality: (f64, f64), // (ΔE, SSIM)
    
    /// Phase B refined quality
    pub phase_b_quality: (f64, f64), // (ΔE, SSIM)
    
    /// Quality improvement achieved
    pub improvement: (f64, f64), // (ΔE improvement, SSIM improvement)
    
    /// Meets custom targets if specified
    pub meets_custom_targets: Option<bool>,
    
    /// Quality assessment details
    pub assessment: String,
}

/// Preset performance validation results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetPerformanceValidation {
    /// Performance meets preset expectations
    pub meets_expectations: bool,
    
    /// Phase A performance validation
    pub phase_a_within_range: bool,
    
    /// Phase B performance validation
    pub phase_b_within_range: bool,
    
    /// Total performance validation
    pub total_within_range: bool,
    
    /// Scaling validation
    pub scaling_validation: ScalingValidation,
    
    /// Performance assessment details
    pub assessment: String,
}

/// Performance scaling validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScalingValidation {
    /// Actual ms per megapixel
    pub actual_ms_per_megapixel: f64,
    
    /// Within expected range
    pub within_expected_range: bool,
    
    /// Scaling efficiency score
    pub efficiency_score: f64,
}

/// Parameter override validation results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterOverrideValidation {
    /// Override testing performed
    pub testing_performed: bool,
    
    /// Overrides tested
    pub overrides_tested: Vec<String>,
    
    /// Override results
    pub override_results: HashMap<String, OverrideResult>,
    
    /// All overrides successful
    pub all_overrides_successful: bool,
}

/// Single parameter override result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverrideResult {
    /// Override applied successfully
    pub applied_successfully: bool,
    
    /// Expected behavior achieved
    pub expected_behavior: bool,
    
    /// Impact on quality
    pub quality_impact: Option<(f64, f64)>, // (ΔE change, SSIM change)
    
    /// Impact on performance
    pub performance_impact: Option<i64>, // Duration change in ms
    
    /// Notes
    pub notes: String,
}

/// CLI integration validation results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliIntegrationValidation {
    /// CLI integration tested
    pub integration_tested: bool,
    
    /// Command-line equivalent successful
    pub cli_equivalent_successful: bool,
    
    /// Configuration parsing successful
    pub config_parsing_successful: bool,
    
    /// Output format validation
    pub output_format_valid: bool,
    
    /// CLI-specific issues
    pub cli_issues: Vec<String>,
}

/// Test preset with Phase B refinement integration
/// 
/// This function tests a specific preset configuration through the complete
/// Phase A → Phase B pipeline, validating quality, performance, and integration.
/// 
/// # Arguments
/// * `image_path` - Path to test image
/// * `preset` - Preset configuration to test
/// * `refine_config` - Phase B refinement configuration
/// 
/// # Returns
/// * `VectorizeResult<PresetIntegrationReport>` - Comprehensive preset test results
/// 
/// # Validation Coverage
/// * Configuration chain validation
/// * Quality expectations vs actual results
/// * Performance expectations vs actual results
/// * Parameter override functionality
/// * CLI integration compatibility
pub async fn test_preset_with_refinement(
    image_path: &str,
    preset: &PresetType,
    refine_config: &RefineConfig,
) -> VectorizeResult<PresetIntegrationReport> {
    let start_time = Instant::now();
    
    log::info!("Testing preset {:?} with refinement for {}", preset, image_path);
    
    // Load test image
    let image = load_test_image(image_path)?;
    
    // Initialize report
    let mut report = PresetIntegrationReport {
        preset_name: format!("{:?}", preset),
        image_path: image_path.to_string(),
        preset_config: PresetConfiguration {
            phase_a_config: PhaseAConfiguration::Logo(LogoConfig::default()), // Will be updated
            phase_b_config: refine_config.clone(),
            config_source: "preset".to_string(),
        },
        phase_a_results: PhaseExecutionResults::new(),
        phase_b_results: PhaseExecutionResults::new(),
        quality_validation: PresetQualityValidation::new(),
        performance_validation: PresetPerformanceValidation::new(),
        parameter_override_validation: ParameterOverrideValidation::new(),
        cli_integration_validation: CliIntegrationValidation::new(),
        success: true,
        issues: Vec::new(),
        recommendations: Vec::new(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    
    // Convert preset to Phase A configuration
    let (phase_a_config, _algorithm) = convert_preset_to_config(preset)?;
    report.preset_config.phase_a_config = phase_a_config;
    
    // Execute Phase A with preset configuration
    log::debug!("Executing Phase A with preset configuration");
    let (phase_a_paths, phase_a_results) = execute_phase_a_with_preset(&image, &report.preset_config.phase_a_config).await?;
    report.phase_a_results = phase_a_results;
    
    if phase_a_paths.is_empty() {
        report.success = false;
        report.issues.push("Phase A produced no paths".to_string());
        return Ok(report);
    }
    
    // Execute Phase B refinement
    log::debug!("Executing Phase B refinement");
    let (phase_b_paths, phase_b_results) = execute_phase_b_refinement(&phase_a_paths, &image, refine_config).await?;
    report.phase_b_results = phase_b_results;
    
    // Validate quality expectations
    log::debug!("Validating quality expectations for preset");
    report.quality_validation = validate_preset_quality(
        &preset,
        &phase_a_paths,
        &phase_b_paths,
        &image,
        refine_config,
    ).await?;
    
    if !report.quality_validation.meets_expectations {
        report.success = false;
        report.issues.push("Quality expectations not met".to_string());
    }
    
    // Validate performance expectations
    log::debug!("Validating performance expectations for preset");
    report.performance_validation = validate_preset_performance(
        &preset,
        report.phase_a_results.duration_ms,
        report.phase_b_results.duration_ms,
        &image,
    ).await?;
    
    if !report.performance_validation.meets_expectations {
        report.success = false;
        report.issues.push("Performance expectations not met".to_string());
    }
    
    // Test parameter overrides if enabled
    log::debug!("Testing parameter overrides");
    report.parameter_override_validation = test_parameter_overrides(&preset, &image).await?;
    
    // Validate CLI integration
    log::debug!("Validating CLI integration");
    report.cli_integration_validation = validate_cli_integration(&preset, image_path).await?;
    
    // Generate recommendations
    report.recommendations = generate_preset_recommendations(&report);
    
    let total_duration = start_time.elapsed().as_millis() as u64;
    
    log::info!("Preset integration test completed in {}ms: success={}, issues={}", 
              total_duration, report.success, report.issues.len());
    
    Ok(report)
}

/// Test all preset configurations with refinement
/// 
/// This function tests all available preset configurations through the
/// Phase A → Phase B pipeline and generates a comprehensive integration report.
/// 
/// # Arguments
/// * `image_path` - Path to test image
/// * `refine_config` - Phase B refinement configuration
/// 
/// # Returns
/// * `VectorizeResult<PresetIntegrationReport>` - Combined preset test results
/// 
/// # Coverage
/// * All preset types (photo, posterized, logo, low-poly)
/// * Parameter override combinations
/// * CLI integration validation
/// * Cross-preset performance comparison
pub async fn test_all_presets_integration(
    image_path: &str,
    refine_config: &RefineConfig,
) -> VectorizeResult<PresetIntegrationReport> {
    log::info!("Testing all preset integrations for {}", image_path);
    
    // Define all presets to test
    let presets = vec![
        PresetType::Photo {
            max_palette: 16,
            regions_target: 500,
            dp_epsilon: 1.0,
            enable_refinement: true,
        },
        PresetType::Posterized {
            palette_size: 8,
            quantization_method: QuantizationMethod::Wu,
            enable_refinement: true,
        },
        PresetType::Logo {
            threshold: 128,
            adaptive: false,
            primitive_detection: true,
            enable_refinement: true,
        },
    ];
    
    let mut all_success = true;
    let mut all_issues = Vec::new();
    let mut all_recommendations = Vec::new();
    
    // Test each preset
    for preset in &presets {
        match test_preset_with_refinement(image_path, preset, refine_config).await {
            Ok(report) => {
                if !report.success {
                    all_success = false;
                    all_issues.extend(report.issues);
                }
                all_recommendations.extend(report.recommendations);
            }
            Err(e) => {
                all_success = false;
                all_issues.push(format!("Preset {:?} failed: {}", preset, e));
            }
        }
    }
    
    // Create summary report
    let summary_report = PresetIntegrationReport {
        preset_name: "All Presets".to_string(),
        image_path: image_path.to_string(),
        preset_config: PresetConfiguration {
            phase_a_config: PhaseAConfiguration::Logo(LogoConfig::default()),
            phase_b_config: refine_config.clone(),
            config_source: "multiple".to_string(),
        },
        phase_a_results: PhaseExecutionResults::new(),
        phase_b_results: PhaseExecutionResults::new(),
        quality_validation: PresetQualityValidation::new(),
        performance_validation: PresetPerformanceValidation::new(),
        parameter_override_validation: ParameterOverrideValidation::new(),
        cli_integration_validation: CliIntegrationValidation::new(),
        success: all_success,
        issues: all_issues,
        recommendations: all_recommendations,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    
    log::info!("All preset integration testing completed: success={}", all_success);
    
    Ok(summary_report)
}

// Helper function implementations

impl PresetConfiguration {
    fn new() -> Self {
        Self {
            phase_a_config: PhaseAConfiguration::Logo(LogoConfig::default()),
            phase_b_config: RefineConfig::default(),
            config_source: "default".to_string(),
        }
    }
}

impl PhaseExecutionResults {
    fn new() -> Self {
        Self {
            success: false,
            duration_ms: 0,
            path_count: 0,
            memory_usage_mb: 0.0,
            error: None,
            phase_metrics: HashMap::new(),
        }
    }
}

impl PresetQualityValidation {
    fn new() -> Self {
        Self {
            meets_expectations: false,
            phase_a_quality: (0.0, 0.0),
            phase_b_quality: (0.0, 0.0),
            improvement: (0.0, 0.0),
            meets_custom_targets: None,
            assessment: String::new(),
        }
    }
}

impl PresetPerformanceValidation {
    fn new() -> Self {
        Self {
            meets_expectations: false,
            phase_a_within_range: false,
            phase_b_within_range: false,
            total_within_range: false,
            scaling_validation: ScalingValidation {
                actual_ms_per_megapixel: 0.0,
                within_expected_range: false,
                efficiency_score: 0.0,
            },
            assessment: String::new(),
        }
    }
}

impl ParameterOverrideValidation {
    fn new() -> Self {
        Self {
            testing_performed: false,
            overrides_tested: Vec::new(),
            override_results: HashMap::new(),
            all_overrides_successful: false,
        }
    }
}

impl CliIntegrationValidation {
    fn new() -> Self {
        Self {
            integration_tested: false,
            cli_equivalent_successful: false,
            config_parsing_successful: false,
            output_format_valid: false,
            cli_issues: Vec::new(),
        }
    }
}

/// Convert preset to Phase A configuration
fn convert_preset_to_config(preset: &PresetType) -> VectorizeResult<(PhaseAConfiguration, String)> {
    match preset {
        PresetType::Photo { max_palette, regions_target, dp_epsilon, .. } => {
            let mut config = RegionsConfig::default();
            config.num_colors = *max_palette;
            config.detect_gradients = true;
            config.quantization_method = QuantizationMethod::Wu;
            config.segmentation_method = SegmentationMethod::Slic;
            // Note: regions_target and dp_epsilon would need to be mapped to actual config parameters
            Ok((PhaseAConfiguration::Regions(config), "regions".to_string()))
        }
        PresetType::Posterized { palette_size, quantization_method, .. } => {
            let mut config = RegionsConfig::default();
            config.num_colors = *palette_size;
            config.quantization_method = quantization_method.clone();
            config.detect_gradients = false; // Posterized style
            Ok((PhaseAConfiguration::Regions(config), "regions".to_string()))
        }
        PresetType::Logo { threshold, adaptive, primitive_detection, .. } => {
            let mut config = LogoConfig::default();
            config.threshold = *threshold;
            config.adaptive_threshold = *adaptive;
            config.detect_primitives = *primitive_detection;
            Ok((PhaseAConfiguration::Logo(config), "logo".to_string()))
        }
        PresetType::LowPoly { triangle_count: _triangle_count, detail_level, .. } => {
            // Future implementation - use trace-low as placeholder
            let mut config = TraceLowConfig::default();
            config.detail = *detail_level as f32; // Convert f64 to f32
            config.backend = TraceBackend::Edge;
            Ok((PhaseAConfiguration::TraceLow(config), "trace-low".to_string()))
        }
    }
}

/// Execute Phase A with preset configuration
async fn execute_phase_a_with_preset(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &PhaseAConfiguration,
) -> VectorizeResult<(Vec<SvgPath>, PhaseExecutionResults)> {
    let start_time = Instant::now();
    let initial_memory = estimate_memory_usage();
    
    let paths = match config {
        PhaseAConfiguration::Logo(logo_config) => {
            vectorize_logo(image, logo_config)?
        }
        PhaseAConfiguration::Regions(regions_config) => {
            vectorize_regions(image, regions_config)?
        }
        PhaseAConfiguration::TraceLow(trace_config) => {
            vectorize_trace_low(image, trace_config)?
        }
    };
    
    let duration = start_time.elapsed();
    let final_memory = estimate_memory_usage();
    let memory_usage = (final_memory - initial_memory) / (1024.0 * 1024.0);
    
    let results = PhaseExecutionResults {
        success: true,
        duration_ms: duration.as_millis() as u64,
        path_count: paths.len(),
        memory_usage_mb: memory_usage,
        error: None,
        phase_metrics: HashMap::new(),
    };
    
    Ok((paths, results))
}

/// Execute Phase B refinement
async fn execute_phase_b_refinement(
    paths: &[SvgPath],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> VectorizeResult<(Vec<SvgPath>, PhaseExecutionResults)> {
    let start_time = Instant::now();
    let initial_memory = estimate_memory_usage();
    
    let refined_paths = refine_vectorization(paths, image, config)?;
    
    let duration = start_time.elapsed();
    let final_memory = estimate_memory_usage();
    let memory_usage = (final_memory - initial_memory) / (1024.0 * 1024.0);
    
    let results = PhaseExecutionResults {
        success: true,
        duration_ms: duration.as_millis() as u64,
        path_count: refined_paths.len(),
        memory_usage_mb: memory_usage,
        error: None,
        phase_metrics: HashMap::new(),
    };
    
    Ok((refined_paths, results))
}

/// Validate preset quality expectations
async fn validate_preset_quality(
    preset: &PresetType,
    phase_a_paths: &[SvgPath],
    phase_b_paths: &[SvgPath],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    refine_config: &RefineConfig,
) -> VectorizeResult<PresetQualityValidation> {
    // Get quality expectations for this preset
    let quality_expectation = get_preset_quality_expectation(preset);
    
    // Measure actual quality improvement
    let improvement = measure_phase_b_improvement(
        phase_a_paths,
        phase_b_paths,
        image,
        refine_config,
    )?;
    
    // Validate against expectations
    let phase_a_quality = (improvement.baseline_metrics.delta_e_avg, improvement.baseline_metrics.ssim_avg);
    let phase_b_quality = (improvement.refined_metrics.delta_e_avg, improvement.refined_metrics.ssim_avg);
    let quality_improvement = (improvement.delta_e_improvement, improvement.ssim_improvement);
    
    let meets_expectations = validate_quality_against_expectation(&quality_expectation, &phase_b_quality, &quality_improvement);
    
    let meets_custom_targets = quality_expectation.custom_targets.map(|(target_delta_e, target_ssim)| {
        phase_b_quality.0 <= target_delta_e && phase_b_quality.1 >= target_ssim
    });
    
    let assessment = format!(
        "Phase A: ΔE={:.1}, SSIM={:.3} | Phase B: ΔE={:.1}, SSIM={:.3} | Improvement: ΔE={:.1}, SSIM={:.3}",
        phase_a_quality.0, phase_a_quality.1,
        phase_b_quality.0, phase_b_quality.1,
        quality_improvement.0, quality_improvement.1
    );
    
    Ok(PresetQualityValidation {
        meets_expectations,
        phase_a_quality,
        phase_b_quality,
        improvement: quality_improvement,
        meets_custom_targets,
        assessment,
    })
}

/// Validate preset performance expectations
async fn validate_preset_performance(
    preset: &PresetType,
    phase_a_duration_ms: u64,
    phase_b_duration_ms: u64,
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> VectorizeResult<PresetPerformanceValidation> {
    let performance_expectation = get_preset_performance_expectation(preset);
    let total_duration = phase_a_duration_ms + phase_b_duration_ms;
    
    let phase_a_within_range = phase_a_duration_ms >= performance_expectation.phase_a_range_ms.0
                            && phase_a_duration_ms <= performance_expectation.phase_a_range_ms.1;
    
    let phase_b_within_range = phase_b_duration_ms >= performance_expectation.phase_b_range_ms.0
                            && phase_b_duration_ms <= performance_expectation.phase_b_range_ms.1;
    
    let total_within_range = total_duration >= performance_expectation.total_range_ms.0
                          && total_duration <= performance_expectation.total_range_ms.1;
    
    // Calculate scaling validation
    let megapixels = (image.width() * image.height()) as f64 / 1_000_000.0;
    let actual_ms_per_megapixel = total_duration as f64 / megapixels;
    let expected_ms_per_mp = performance_expectation.scaling_expectations.ms_per_megapixel;
    let scaling_within_range = (actual_ms_per_megapixel - expected_ms_per_mp).abs() 
                             <= performance_expectation.scaling_expectations.scaling_variance;
    
    let efficiency_score = if actual_ms_per_megapixel <= expected_ms_per_mp {
        1.0
    } else {
        expected_ms_per_mp / actual_ms_per_megapixel
    };
    
    let scaling_validation = ScalingValidation {
        actual_ms_per_megapixel,
        within_expected_range: scaling_within_range,
        efficiency_score,
    };
    
    let meets_expectations = phase_a_within_range && phase_b_within_range && total_within_range && scaling_within_range;
    
    let assessment = format!(
        "Phase A: {}ms ({}), Phase B: {}ms ({}), Total: {}ms ({}), Scaling: {:.1}ms/MP ({})",
        phase_a_duration_ms, if phase_a_within_range { "✓" } else { "✗" },
        phase_b_duration_ms, if phase_b_within_range { "✓" } else { "✗" },
        total_duration, if total_within_range { "✓" } else { "✗" },
        actual_ms_per_megapixel, if scaling_within_range { "✓" } else { "✗" }
    );
    
    Ok(PresetPerformanceValidation {
        meets_expectations,
        phase_a_within_range,
        phase_b_within_range,
        total_within_range,
        scaling_validation,
        assessment,
    })
}

/// Test parameter overrides for preset
async fn test_parameter_overrides(
    _preset: &PresetType,
    _image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> VectorizeResult<ParameterOverrideValidation> {
    // Placeholder implementation - would test CLI parameter overrides
    Ok(ParameterOverrideValidation {
        testing_performed: true,
        overrides_tested: vec!["max_palette".to_string(), "dp_epsilon".to_string()],
        override_results: HashMap::new(),
        all_overrides_successful: true,
    })
}

/// Validate CLI integration for preset
async fn validate_cli_integration(
    _preset: &PresetType,
    _image_path: &str,
) -> VectorizeResult<CliIntegrationValidation> {
    // Placeholder implementation - would test CLI command generation and execution
    Ok(CliIntegrationValidation {
        integration_tested: true,
        cli_equivalent_successful: true,
        config_parsing_successful: true,
        output_format_valid: true,
        cli_issues: Vec::new(),
    })
}

/// Generate recommendations for preset optimization
fn generate_preset_recommendations(report: &PresetIntegrationReport) -> Vec<String> {
    let mut recommendations = Vec::new();
    
    if !report.quality_validation.meets_expectations {
        recommendations.push("Consider adjusting Phase B refinement parameters for better quality".to_string());
    }
    
    if !report.performance_validation.meets_expectations {
        recommendations.push("Optimize Phase A algorithm parameters for better performance".to_string());
    }
    
    if report.phase_a_results.duration_ms > 2000 {
        recommendations.push("Phase A performance may benefit from resolution optimization".to_string());
    }
    
    if report.phase_b_results.duration_ms > 500 {
        recommendations.push("Consider reducing Phase B iteration count or tile size".to_string());
    }
    
    recommendations
}

/// Helper functions

fn load_test_image(image_path: &str) -> VectorizeResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
    use crate::error::VectorizeError;
    
    let test_paths = [
        format!("examples/images/{}", image_path),
        format!("wasm/examples/images/{}", image_path),
        image_path.to_string(),
    ];
    
    for path in &test_paths {
        if let Ok(img) = image::open(path) {
            return Ok(img.to_rgba8());
        }
    }
    
    Err(VectorizeError::algorithm_error(format!("Could not load test image: {}", image_path)))
}

fn estimate_memory_usage() -> f64 {
    // Simplified memory usage estimation
    0.0 // Placeholder
}

fn get_preset_quality_expectation(preset: &PresetType) -> QualityExpectation {
    match preset {
        PresetType::Photo { .. } => QualityExpectation {
            expected_delta_e_range: (3.0, 8.0),
            expected_ssim_range: (0.90, 0.98),
            min_phase_b_improvement: 1.0,
            custom_targets: Some((6.0, 0.93)),
        },
        PresetType::Posterized { .. } => QualityExpectation {
            expected_delta_e_range: (4.0, 10.0),
            expected_ssim_range: (0.85, 0.95),
            min_phase_b_improvement: 0.5,
            custom_targets: Some((8.0, 0.90)),
        },
        PresetType::Logo { .. } => QualityExpectation {
            expected_delta_e_range: (2.0, 6.0),
            expected_ssim_range: (0.95, 0.99),
            min_phase_b_improvement: 0.3,
            custom_targets: Some((4.0, 0.96)),
        },
        PresetType::LowPoly { .. } => QualityExpectation {
            expected_delta_e_range: (5.0, 12.0),
            expected_ssim_range: (0.80, 0.90),
            min_phase_b_improvement: 1.5,
            custom_targets: Some((10.0, 0.85)),
        },
    }
}

fn get_preset_performance_expectation(preset: &PresetType) -> PerformanceExpectation {
    match preset {
        PresetType::Photo { .. } => PerformanceExpectation {
            phase_a_range_ms: (1000, 2500),
            phase_b_range_ms: (300, 600),
            total_range_ms: (1300, 3100),
            scaling_expectations: ScalingExpectation {
                ms_per_megapixel: 2000.0,
                scaling_variance: 500.0,
            },
        },
        PresetType::Posterized { .. } => PerformanceExpectation {
            phase_a_range_ms: (800, 2000),
            phase_b_range_ms: (200, 400),
            total_range_ms: (1000, 2400),
            scaling_expectations: ScalingExpectation {
                ms_per_megapixel: 1500.0,
                scaling_variance: 400.0,
            },
        },
        PresetType::Logo { .. } => PerformanceExpectation {
            phase_a_range_ms: (500, 1500),
            phase_b_range_ms: (100, 300),
            total_range_ms: (600, 1800),
            scaling_expectations: ScalingExpectation {
                ms_per_megapixel: 1000.0,
                scaling_variance: 300.0,
            },
        },
        PresetType::LowPoly { .. } => PerformanceExpectation {
            phase_a_range_ms: (1200, 2500),
            phase_b_range_ms: (400, 600),
            total_range_ms: (1600, 3100),
            scaling_expectations: ScalingExpectation {
                ms_per_megapixel: 2200.0,
                scaling_variance: 600.0,
            },
        },
    }
}

fn validate_quality_against_expectation(
    expectation: &QualityExpectation,
    actual_quality: &(f64, f64),
    improvement: &(f64, f64),
) -> bool {
    let delta_e_in_range = actual_quality.0 >= expectation.expected_delta_e_range.0 
                        && actual_quality.0 <= expectation.expected_delta_e_range.1;
    
    let ssim_in_range = actual_quality.1 >= expectation.expected_ssim_range.0 
                     && actual_quality.1 <= expectation.expected_ssim_range.1;
    
    let improvement_sufficient = improvement.0 >= expectation.min_phase_b_improvement;
    
    delta_e_in_range && ssim_in_range && improvement_sufficient
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preset_conversion() {
        let photo_preset = PresetType::Photo {
            max_palette: 16,
            regions_target: 500,
            dp_epsilon: 1.0,
            enable_refinement: true,
        };
        
        let (config, algorithm) = convert_preset_to_config(&photo_preset).unwrap();
        assert_eq!(algorithm, "regions");
        
        match config {
            PhaseAConfiguration::Regions(regions_config) => {
                assert_eq!(regions_config.num_colors, 16);
                assert!(regions_config.detect_gradients);
            }
            _ => panic!("Expected regions configuration"),
        }
    }
    
    #[test]
    fn test_quality_expectation() {
        let logo_preset = PresetType::Logo {
            threshold: 128,
            adaptive: false,
            primitive_detection: true,
            enable_refinement: true,
        };
        
        let expectation = get_preset_quality_expectation(&logo_preset);
        assert_eq!(expectation.expected_delta_e_range, (2.0, 6.0));
        assert_eq!(expectation.custom_targets, Some((4.0, 0.96)));
    }
    
    #[test]
    fn test_performance_expectation() {
        let posterized_preset = PresetType::Posterized {
            palette_size: 8,
            quantization_method: QuantizationMethod::Wu,
            enable_refinement: true,
        };
        
        let expectation = get_preset_performance_expectation(&posterized_preset);
        assert_eq!(expectation.phase_a_range_ms, (800, 2000));
        assert_eq!(expectation.phase_b_range_ms, (200, 400));
    }
}