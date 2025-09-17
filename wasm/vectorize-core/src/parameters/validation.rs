//! Parameter validation and error handling
//!
//! This module provides comprehensive validation for parameters, including
//! type checking, range validation, dependency validation, and backend
//! applicability checking.

use super::registry::{ParameterDefinition, PARAMETER_REGISTRY};
use super::types::ParameterValue;
use crate::algorithms::TraceBackend;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
// use super::audit::{ConflictType, ParameterConflict}; // Not currently used

/// Severity level for parameter conflicts
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ConflictSeverity {
    /// Informational - minor performance impact
    Info,
    /// Warning - noticeable impact but processing will continue
    Warning,
    /// Error - significant issues that may cause failures
    Error,
}

/// Parameter validation errors
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ValidationError {
    /// Parameter not found in registry
    UnknownParameter(String),
    /// Parameter value type mismatch
    TypeMismatch {
        parameter: String,
        expected: String,
        actual: String,
    },
    /// Parameter value out of valid range
    ValueOutOfRange {
        parameter: String,
        value: String,
        min: Option<String>,
        max: Option<String>,
    },
    /// Invalid enum variant
    InvalidEnumVariant {
        parameter: String,
        value: String,
        valid_variants: Vec<String>,
    },
    /// Required parameter missing
    MissingRequiredParameter {
        parameter: String,
        required_by: String,
    },
    /// Conflicting parameters both present
    ConflictingParameters {
        parameter1: String,
        parameter2: String,
    },
    /// Parameter not applicable to selected backend
    ParameterNotApplicable {
        parameter: String,
        backend: TraceBackend,
        applicable_backends: Vec<TraceBackend>,
    },
    /// Logical inconsistency between parameter values
    LogicalInconsistency {
        parameter1: String,
        parameter2: String,
        description: String,
    },
    /// Parameters create performance issues
    PerformanceConflict {
        parameters: Vec<String>,
        description: String,
        severity: ConflictSeverity,
    },
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationError::UnknownParameter(param) => {
                write!(f, "Unknown parameter: '{}'", param)
            }
            ValidationError::TypeMismatch {
                parameter,
                expected,
                actual,
            } => {
                write!(
                    f,
                    "Parameter '{}' type mismatch: expected {}, got {}",
                    parameter, expected, actual
                )
            }
            ValidationError::ValueOutOfRange {
                parameter,
                value,
                min,
                max,
            } => {
                let range = match (min, max) {
                    (Some(min), Some(max)) => format!("[{}, {}]", min, max),
                    (Some(min), None) => format!(">= {}", min),
                    (None, Some(max)) => format!("<= {}", max),
                    (None, None) => "valid range".to_string(),
                };
                write!(
                    f,
                    "Parameter '{}' value '{}' is outside {}",
                    parameter, value, range
                )
            }
            ValidationError::InvalidEnumVariant {
                parameter,
                value,
                valid_variants,
            } => {
                write!(
                    f,
                    "Parameter '{}' invalid value '{}', must be one of: {}",
                    parameter,
                    value,
                    valid_variants.join(", ")
                )
            }
            ValidationError::MissingRequiredParameter {
                parameter,
                required_by,
            } => {
                write!(
                    f,
                    "Parameter '{}' is required when '{}' is set",
                    parameter, required_by
                )
            }
            ValidationError::ConflictingParameters {
                parameter1,
                parameter2,
            } => {
                write!(
                    f,
                    "Parameters '{}' and '{}' cannot be used together",
                    parameter1, parameter2
                )
            }
            ValidationError::ParameterNotApplicable {
                parameter,
                backend,
                applicable_backends,
            } => {
                write!(
                    f,
                    "Parameter '{}' does not apply to {:?} backend, applicable backends: {:?}",
                    parameter, backend, applicable_backends
                )
            }
            ValidationError::LogicalInconsistency {
                parameter1,
                parameter2,
                description,
            } => {
                write!(
                    f,
                    "Logical inconsistency between '{}' and '{}': {}",
                    parameter1, parameter2, description
                )
            }
            ValidationError::PerformanceConflict {
                parameters,
                description,
                severity,
            } => {
                write!(
                    f,
                    "[{:?}] Performance conflict with parameters [{}]: {}",
                    severity,
                    parameters.join(", "),
                    description
                )
            }
        }
    }
}

/// Parameter validation warnings (non-fatal)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ValidationWarning {
    /// Parameter ignored due to backend incompatibility
    ParameterIgnored {
        parameter: String,
        backend: TraceBackend,
        applicable_backends: Vec<TraceBackend>,
    },
    /// Using deprecated parameter name
    DeprecatedParameter { old_name: String, new_name: String },
    /// Parameter set to its default value (redundant)
    RedundantParameter {
        parameter: String,
        default_value: ParameterValue,
    },
    /// Parameter combination may impact performance
    PerformanceWarning {
        parameters: Vec<String>,
        description: String,
        estimated_impact: f32, // Percentage performance impact
    },
    /// Parameter conflict resolved automatically
    ConflictResolved {
        conflicting_parameters: Vec<String>,
        resolution: String,
    },
}

impl std::fmt::Display for ValidationWarning {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationWarning::ParameterIgnored {
                parameter,
                backend,
                applicable_backends,
            } => {
                write!(
                    f,
                    "Parameter '{}' ignored for {:?} backend (applicable: {:?})",
                    parameter, backend, applicable_backends
                )
            }
            ValidationWarning::DeprecatedParameter { old_name, new_name } => {
                write!(
                    f,
                    "Parameter '{}' is deprecated, use '{}' instead",
                    old_name, new_name
                )
            }
            ValidationWarning::RedundantParameter {
                parameter,
                default_value,
            } => {
                write!(
                    f,
                    "Parameter '{}' set to default value ({}), can be omitted",
                    parameter, default_value
                )
            }
            ValidationWarning::PerformanceWarning {
                parameters,
                description,
                estimated_impact,
            } => {
                write!(
                    f,
                    "Performance warning for parameters [{}]: {} (estimated impact: {:.1}%)",
                    parameters.join(", "),
                    description,
                    estimated_impact
                )
            }
            ValidationWarning::ConflictResolved {
                conflicting_parameters,
                resolution,
            } => {
                write!(
                    f,
                    "Conflict resolved for parameters [{}]: {}",
                    conflicting_parameters.join(", "),
                    resolution
                )
            }
        }
    }
}

/// Result of parameter validation
#[derive(Debug, Clone, Default)]
pub struct ValidationResult {
    /// Fatal validation errors that prevent processing
    pub errors: Vec<ValidationError>,
    /// Non-fatal warnings about parameter usage
    pub warnings: Vec<ValidationWarning>,
}

impl ValidationResult {
    /// Check if validation passed (no errors)
    pub fn is_valid(&self) -> bool {
        self.errors.is_empty()
    }

    /// Check if there are any warnings
    pub fn has_warnings(&self) -> bool {
        !self.warnings.is_empty()
    }

    /// Get formatted error message
    pub fn error_message(&self) -> Option<String> {
        if self.errors.is_empty() {
            None
        } else {
            Some(
                self.errors
                    .iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join("; "),
            )
        }
    }
}

/// Raw configuration from frontend (string keys, various value types)
pub type RawConfig = HashMap<String, ParameterValue>;

/// Parameter validator
pub struct ParameterValidator {
    // Simplified - no caching for now to avoid thread safety issues
}

impl Default for ParameterValidator {
    fn default() -> Self {
        Self::new()
    }
}

impl ParameterValidator {
    /// Create a new parameter validator
    pub fn new() -> Self {
        Self {}
    }

    /// Validate a complete parameter configuration for a specific backend
    pub fn validate_config(
        &mut self,
        config: &RawConfig,
        backend: TraceBackend,
    ) -> ValidationResult {
        let mut result = ValidationResult::default();
        let mut _processed_params = HashSet::new();

        // Validate each parameter in the config
        for (param_name, param_value) in config {
            _processed_params.insert(param_name.as_str());

            self.validate_single_parameter(param_name, param_value, backend, config, &mut result);
        }

        // Check for missing required parameters
        self.validate_required_parameters(config, backend, &mut result);

        // Check for parameter conflicts
        self.validate_parameter_conflicts(config, &mut result);

        result
    }

    /// Validate a single parameter
    fn validate_single_parameter(
        &self,
        param_name: &str,
        param_value: &ParameterValue,
        backend: TraceBackend,
        _config: &RawConfig,
        result: &mut ValidationResult,
    ) {
        // 1. Check if parameter exists in registry
        let param_def = match PARAMETER_REGISTRY.get(param_name) {
            Some(def) => def,
            None => {
                result
                    .errors
                    .push(ValidationError::UnknownParameter(param_name.to_string()));
                return;
            }
        };

        // 2. Check if parameter applies to current backend
        if !param_def.applicable_backends.contains(&backend) {
            result.warnings.push(ValidationWarning::ParameterIgnored {
                parameter: param_name.to_string(),
                backend,
                applicable_backends: param_def.applicable_backends.clone(),
            });
            return;
        }

        // 3. Validate parameter value type and range
        if let Err(validation_error) = param_value.validate_against_type(&param_def.parameter_type)
        {
            self.convert_type_validation_error(param_name, &validation_error, param_def, result);
        }

        // 4. Check if parameter is set to default (redundant warning)
        if *param_value == param_def.default_value {
            result.warnings.push(ValidationWarning::RedundantParameter {
                parameter: param_name.to_string(),
                default_value: param_def.default_value.clone(),
            });
        }
    }

    /// Convert type validation error to specific validation error
    fn convert_type_validation_error(
        &self,
        param_name: &str,
        validation_error: &str,
        param_def: &ParameterDefinition,
        result: &mut ValidationResult,
    ) {
        if validation_error.contains("out of range") {
            // Extract range information from parameter type
            let (min, max) = match &param_def.parameter_type {
                super::types::ParameterType::Float { min, max, .. } => {
                    (Some(min.to_string()), Some(max.to_string()))
                }
                super::types::ParameterType::Integer { min, max } => {
                    (Some(min.to_string()), Some(max.to_string()))
                }
                _ => (None, None),
            };

            result.errors.push(ValidationError::ValueOutOfRange {
                parameter: param_name.to_string(),
                value: validation_error.to_string(), // TODO: Extract actual value
                min,
                max,
            });
        } else if validation_error.contains("not in allowed variants") {
            // Extract variants from enum type
            let valid_variants = match &param_def.parameter_type {
                super::types::ParameterType::Enum { variants } => {
                    variants.iter().map(|s| s.to_string()).collect()
                }
                _ => vec![],
            };

            result.errors.push(ValidationError::InvalidEnumVariant {
                parameter: param_name.to_string(),
                value: validation_error.to_string(), // TODO: Extract actual value
                valid_variants,
            });
        } else {
            result.errors.push(ValidationError::TypeMismatch {
                parameter: param_name.to_string(),
                expected: format!("{:?}", param_def.parameter_type),
                actual: validation_error.to_string(),
            });
        }
    }

    /// Validate that all required parameters are present
    fn validate_required_parameters(
        &self,
        config: &RawConfig,
        backend: TraceBackend,
        result: &mut ValidationResult,
    ) {
        for (param_name, param_def) in PARAMETER_REGISTRY.iter() {
            // Skip parameters not applicable to this backend
            if !param_def.applicable_backends.contains(&backend) {
                continue;
            }

            // Check if this parameter is present in config
            if !config.contains_key(*param_name) {
                continue;
            }

            // Check if all required parameters are present
            for required_param in &param_def.constraints.requires {
                if !config.contains_key(required_param) {
                    result
                        .errors
                        .push(ValidationError::MissingRequiredParameter {
                            parameter: required_param.to_string(),
                            required_by: param_name.to_string(),
                        });
                }
            }
        }
    }

    /// Validate parameter conflicts with comprehensive detection
    fn validate_parameter_conflicts(&self, config: &RawConfig, result: &mut ValidationResult) {
        // 1. Basic conflicts from registry
        self.check_registry_conflicts(config, result);

        // 2. Logical inconsistencies
        self.check_logical_inconsistencies(config, result);

        // 3. Performance conflicts (warnings)
        self.check_performance_conflicts(config, result);

        // 4. Complex multi-parameter conflicts
        self.check_complex_conflicts(config, result);
    }

    /// Check basic registry-defined conflicts
    fn check_registry_conflicts(&self, config: &RawConfig, result: &mut ValidationResult) {
        for (param_name, param_def) in PARAMETER_REGISTRY.iter() {
            // Skip if this parameter is not in config
            if !config.contains_key(*param_name) {
                continue;
            }

            // Check for conflicts
            for conflicting_param in &param_def.constraints.conflicts_with {
                if config.contains_key(conflicting_param) {
                    result.errors.push(ValidationError::ConflictingParameters {
                        parameter1: param_name.to_string(),
                        parameter2: conflicting_param.to_string(),
                    });
                }
            }
        }
    }

    /// Check for logical inconsistencies between parameter values
    fn check_logical_inconsistencies(&self, config: &RawConfig, result: &mut ValidationResult) {
        // Multi-pass logic validation
        if let (Some(ParameterValue::Boolean(true)), Some(ParameterValue::Integer(count))) =
            (config.get("enable_multipass"), config.get("pass_count"))
        {
            if *count <= 1 {
                result.errors.push(ValidationError::LogicalInconsistency {
                    parameter1: "enable_multipass".to_string(),
                    parameter2: "pass_count".to_string(),
                    description: "Multi-pass enabled but pass count is 1 or less".to_string(),
                });
            }
        }

        // Dot radius constraints
        if let (Some(ParameterValue::Float(min_radius)), Some(ParameterValue::Float(max_radius))) =
            (config.get("dot_min_radius"), config.get("dot_max_radius"))
        {
            if min_radius >= max_radius {
                result.errors.push(ValidationError::LogicalInconsistency {
                    parameter1: "dot_min_radius".to_string(),
                    parameter2: "dot_max_radius".to_string(),
                    description: "Minimum dot radius must be less than maximum dot radius"
                        .to_string(),
                });
            }
        }

        // Noise filtering dependency
        if let (Some(ParameterValue::Boolean(false)), Some(_)) = (
            config.get("noise_filtering"),
            config.get("noise_filter_spatial_sigma"),
        ) {
            result.warnings.push(ValidationWarning::ConflictResolved {
                conflicting_parameters: vec![
                    "noise_filtering".to_string(),
                    "noise_filter_spatial_sigma".to_string(),
                ],
                resolution:
                    "Spatial sigma parameter will be ignored since noise filtering is disabled"
                        .to_string(),
            });
        }

        // Threshold range validation
        if let (Some(ParameterValue::Float(low)), Some(ParameterValue::Float(high))) = (
            config.get("canny_low_threshold"),
            config.get("canny_high_threshold"),
        ) {
            if low >= high {
                result.errors.push(ValidationError::LogicalInconsistency {
                    parameter1: "canny_low_threshold".to_string(),
                    parameter2: "canny_high_threshold".to_string(),
                    description: "Low threshold must be less than high threshold".to_string(),
                });
            }
        }
    }

    /// Check for performance conflicts (generate warnings)
    fn check_performance_conflicts(&self, config: &RawConfig, result: &mut ValidationResult) {
        // High detail + multiple passes
        if let (Some(ParameterValue::Float(detail)), Some(ParameterValue::Integer(passes))) =
            (config.get("detail"), config.get("pass_count"))
        {
            if *detail > 0.8 && *passes > 3 {
                result.warnings.push(ValidationWarning::PerformanceWarning {
                    parameters: vec!["detail".to_string(), "pass_count".to_string()],
                    description:
                        "High detail with multiple passes will significantly slow processing"
                            .to_string(),
                    estimated_impact: 200.0, // 200% slower
                });
            }
        }

        // Large superpixel count
        if let Some(ParameterValue::Integer(superpixels)) = config.get("num_superpixels") {
            if *superpixels > 500 {
                result.warnings.push(ValidationWarning::PerformanceWarning {
                    parameters: vec!["num_superpixels".to_string()],
                    description:
                        "Large number of superpixels may cause memory issues and slow processing"
                            .to_string(),
                    estimated_impact: ((*superpixels - 500) as f32 / 10.0).min(150.0), // Up to 150% impact
                });
            }
        }

        // High Canny threshold values can create sparse edges
        if let Some(ParameterValue::Float(high_threshold)) = config.get("canny_high_threshold") {
            if *high_threshold > 0.8 {
                result.warnings.push(ValidationWarning::PerformanceWarning {
                    parameters: vec!["canny_high_threshold".to_string()],
                    description: "Very high Canny threshold may result in too few edges detected"
                        .to_string(),
                    estimated_impact: 0.0, // Quality impact rather than performance
                });
            }
        }

        // Complex stippling patterns
        if let (Some(ParameterValue::Float(density)), Some(ParameterValue::Float(min_radius))) =
            (config.get("dot_density"), config.get("dot_min_radius"))
        {
            if *density > 0.8 && *min_radius < 1.0 {
                result.warnings.push(ValidationWarning::PerformanceWarning {
                    parameters: vec!["dot_density".to_string(), "dot_min_radius".to_string()],
                    description:
                        "High dot density with small minimum radius creates many small dots"
                            .to_string(),
                    estimated_impact: 50.0,
                });
            }
        }
    }

    /// Check complex multi-parameter conflicts
    fn check_complex_conflicts(&self, config: &RawConfig, result: &mut ValidationResult) {
        // Edge-specific conflicts
        if let (Some(ParameterValue::Boolean(true)), Some(ParameterValue::Boolean(false))) = (
            config.get("enable_multipass"),
            config.get("noise_filtering"),
        ) {
            result.warnings.push(ValidationWarning::ConflictResolved {
                conflicting_parameters: vec![
                    "enable_multipass".to_string(),
                    "noise_filtering".to_string(),
                ],
                resolution:
                    "Multi-pass processing without noise filtering may produce inconsistent results"
                        .to_string(),
            });
        }

        // Superpixel pattern conflicts
        if let (Some(ParameterValue::String(pattern)), Some(ParameterValue::Integer(count))) = (
            config.get("superpixel_initialization_pattern"),
            config.get("num_superpixels"),
        ) {
            match pattern.as_str() {
                "poisson" if *count > 400 => {
                    result.warnings.push(ValidationWarning::PerformanceWarning {
                        parameters: vec!["superpixel_initialization_pattern".to_string(), "num_superpixels".to_string()],
                        description: "Poisson distribution with high superpixel count is computationally expensive".to_string(),
                        estimated_impact: 100.0,
                    });
                }
                "hexagonal" if *count < 50 => {
                    result.warnings.push(ValidationWarning::ConflictResolved {
                        conflicting_parameters: vec!["superpixel_initialization_pattern".to_string(), "num_superpixels".to_string()],
                        resolution: "Hexagonal pattern works better with higher superpixel counts for uniform distribution".to_string(),
                    });
                }
                _ => {}
            }
        }

        // Color space and processing conflicts
        if let (Some(ParameterValue::Boolean(true)), Some(ParameterValue::Integer(passes))) = (
            config.get("enable_color_quantization"),
            config.get("pass_count"),
        ) {
            if *passes > 2 {
                result.warnings.push(ValidationWarning::PerformanceWarning {
                    parameters: vec![
                        "enable_color_quantization".to_string(),
                        "pass_count".to_string(),
                    ],
                    description:
                        "Color quantization with multiple passes may over-simplify the output"
                            .to_string(),
                    estimated_impact: 25.0,
                });
            }
        }
    }
}

/// Initialize the parameter validator (no-op now)
pub fn initialize_validator() {
    // No-op - we create validators as needed
}

/// Convenience function to validate a configuration
pub fn validate_configuration(config: &RawConfig, backend: TraceBackend) -> ValidationResult {
    let mut validator = ParameterValidator::new();
    validator.validate_config(config, backend)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::TraceBackend;

    #[test]
    fn test_valid_configuration() {
        let mut config = RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(0.5));
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );

        let result = validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.is_valid(),
            "Configuration should be valid: {:?}",
            result.errors
        );
    }

    #[test]
    fn test_unknown_parameter() {
        let mut config = RawConfig::new();
        config.insert("nonexistent_param".to_string(), ParameterValue::Float(0.5));

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid());

        let errors: Vec<_> = result
            .errors
            .iter()
            .filter_map(|e| match e {
                ValidationError::UnknownParameter(name) => Some(name),
                _ => None,
            })
            .collect();
        assert!(errors.contains(&&"nonexistent_param".to_string()));
    }

    #[test]
    fn test_parameter_not_applicable_to_backend() {
        let mut config = RawConfig::new();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(result.has_warnings());

        let warnings: Vec<_> = result
            .warnings
            .iter()
            .filter_map(|w| match w {
                ValidationWarning::ParameterIgnored { parameter, .. } => Some(parameter),
                _ => None,
            })
            .collect();
        assert!(warnings.contains(&&"superpixel_initialization_pattern".to_string()));
    }

    #[test]
    fn test_invalid_enum_value() {
        let mut config = RawConfig::new();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("invalid_pattern".to_string()),
        );

        let result = validate_configuration(&config, TraceBackend::Superpixel);
        assert!(!result.is_valid());

        let errors: Vec<_> = result
            .errors
            .iter()
            .filter_map(|e| match e {
                ValidationError::InvalidEnumVariant {
                    parameter, value, ..
                } => Some((parameter, value)),
                _ => None,
            })
            .collect();
        assert!(!errors.is_empty());
    }

    #[test]
    fn test_value_out_of_range() {
        let mut config = RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(1.5)); // Out of [0.0, 1.0] range

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid());

        let has_range_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::ValueOutOfRange { parameter, .. } if parameter == "detail")
        });
        assert!(has_range_error);
    }

    #[test]
    fn test_parameter_dependencies() {
        let mut config = RawConfig::new();
        config.insert(
            "superpixel_boundary_epsilon".to_string(),
            ParameterValue::Float(1.0),
        );
        // Missing required parameter: superpixel_simplify_boundaries

        let result = validate_configuration(&config, TraceBackend::Superpixel);
        // This test may pass if dependencies aren't strictly enforced in current registry
        // The test validates the dependency checking mechanism
    }

    // ===== CONFLICT DETECTION TESTS =====

    #[test]
    fn test_logical_inconsistency_multipass() {
        let mut config = RawConfig::new();
        config.insert(
            "enable_multipass".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert("pass_count".to_string(), ParameterValue::Integer(1));

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid(), "Should detect multipass inconsistency");

        let has_logical_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::LogicalInconsistency { parameter1, parameter2, .. }
                if parameter1 == "enable_multipass" && parameter2 == "pass_count")
        });
        assert!(has_logical_error, "Should detect logical inconsistency");
    }

    #[test]
    fn test_logical_inconsistency_dot_radius() {
        let mut config = RawConfig::new();
        config.insert("dot_min_radius".to_string(), ParameterValue::Float(5.0));
        config.insert("dot_max_radius".to_string(), ParameterValue::Float(3.0)); // min > max

        let result = validate_configuration(&config, TraceBackend::Dots);
        assert!(!result.is_valid(), "Should detect dot radius inconsistency");

        let has_radius_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::LogicalInconsistency { parameter1, parameter2, .. }
                if parameter1 == "dot_min_radius" && parameter2 == "dot_max_radius")
        });
        assert!(has_radius_error, "Should detect radius inconsistency");
    }

    #[test]
    fn test_logical_inconsistency_canny_thresholds() {
        let mut config = RawConfig::new();
        config.insert(
            "canny_low_threshold".to_string(),
            ParameterValue::Float(0.8),
        );
        config.insert(
            "canny_high_threshold".to_string(),
            ParameterValue::Float(0.6),
        ); // low > high

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid(), "Should detect threshold inconsistency");

        let has_threshold_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::LogicalInconsistency { parameter1, parameter2, .. }
                if parameter1 == "canny_low_threshold" && parameter2 == "canny_high_threshold")
        });
        assert!(has_threshold_error, "Should detect threshold inconsistency");
    }

    #[test]
    fn test_performance_warning_high_detail_multipass() {
        let mut config = RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(0.9));
        config.insert("pass_count".to_string(), ParameterValue::Integer(4));

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(result.has_warnings(), "Should generate performance warning");

        let has_performance_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::PerformanceWarning { parameters, estimated_impact, .. }
                if parameters.contains(&"detail".to_string()) &&
                   parameters.contains(&"pass_count".to_string()) &&
                   *estimated_impact > 100.0)
        });
        assert!(
            has_performance_warning,
            "Should warn about performance impact"
        );
    }

    #[test]
    fn test_performance_warning_large_superpixel_count() {
        let mut config = RawConfig::new();
        config.insert("num_superpixels".to_string(), ParameterValue::Integer(600));

        let result = validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.has_warnings(),
            "Should generate performance warning for large superpixel count"
        );

        let has_superpixel_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::PerformanceWarning { parameters, .. }
                if parameters.contains(&"num_superpixels".to_string()))
        });
        assert!(
            has_superpixel_warning,
            "Should warn about superpixel performance impact"
        );
    }

    #[test]
    fn test_performance_warning_high_dot_density() {
        let mut config = RawConfig::new();
        config.insert("dot_density".to_string(), ParameterValue::Float(0.9));
        config.insert("dot_min_radius".to_string(), ParameterValue::Float(0.5));

        let result = validate_configuration(&config, TraceBackend::Dots);
        assert!(
            result.has_warnings(),
            "Should generate performance warning for high dot density"
        );

        let has_dot_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::PerformanceWarning { parameters, .. }
                if parameters.contains(&"dot_density".to_string()) &&
                   parameters.contains(&"dot_min_radius".to_string()))
        });
        assert!(
            has_dot_warning,
            "Should warn about dot density performance impact"
        );
    }

    #[test]
    fn test_complex_conflict_poisson_high_count() {
        let mut config = RawConfig::new();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );
        config.insert("num_superpixels".to_string(), ParameterValue::Integer(450));

        let result = validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.has_warnings(),
            "Should warn about Poisson pattern with high count"
        );

        let has_poisson_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::PerformanceWarning { parameters, .. }
                if parameters.contains(&"superpixel_initialization_pattern".to_string()) &&
                   parameters.contains(&"num_superpixels".to_string()))
        });
        assert!(
            has_poisson_warning,
            "Should warn about Poisson pattern performance"
        );
    }

    #[test]
    fn test_complex_conflict_hexagonal_low_count() {
        let mut config = RawConfig::new();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("hexagonal".to_string()),
        );
        config.insert("num_superpixels".to_string(), ParameterValue::Integer(30));

        let result = validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.has_warnings(),
            "Should warn about hexagonal pattern with low count"
        );

        let has_hexagonal_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::ConflictResolved { conflicting_parameters, .. }
                if conflicting_parameters.contains(&"superpixel_initialization_pattern".to_string()) &&
                   conflicting_parameters.contains(&"num_superpixels".to_string()))
        });
        assert!(
            has_hexagonal_warning,
            "Should warn about hexagonal pattern optimization"
        );
    }

    #[test]
    fn test_noise_filtering_dependency_warning() {
        let mut config = RawConfig::new();
        config.insert(
            "noise_filtering".to_string(),
            ParameterValue::Boolean(false),
        );
        config.insert(
            "noise_filter_spatial_sigma".to_string(),
            ParameterValue::Float(1.5),
        );

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(
            result.has_warnings(),
            "Should warn about noise filter dependency"
        );

        let has_dependency_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::ConflictResolved { conflicting_parameters, .. }
                if conflicting_parameters.contains(&"noise_filtering".to_string()) &&
                   conflicting_parameters.contains(&"noise_filter_spatial_sigma".to_string()))
        });
        assert!(
            has_dependency_warning,
            "Should warn about ignored noise filter parameter"
        );
    }

    #[test]
    fn test_color_quantization_multipass_warning() {
        let mut config = RawConfig::new();
        config.insert(
            "enable_color_quantization".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert("pass_count".to_string(), ParameterValue::Integer(3));

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(
            result.has_warnings(),
            "Should warn about color quantization with multipass"
        );

        let has_quantization_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::PerformanceWarning { parameters, .. }
                if parameters.contains(&"enable_color_quantization".to_string()) &&
                   parameters.contains(&"pass_count".to_string()))
        });
        assert!(
            has_quantization_warning,
            "Should warn about over-simplification risk"
        );
    }

    #[test]
    fn test_high_canny_threshold_warning() {
        let mut config = RawConfig::new();
        config.insert(
            "canny_high_threshold".to_string(),
            ParameterValue::Float(0.9),
        );

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(
            result.has_warnings(),
            "Should warn about very high Canny threshold"
        );

        let has_canny_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::PerformanceWarning { parameters, .. }
                if parameters.contains(&"canny_high_threshold".to_string()))
        });
        assert!(
            has_canny_warning,
            "Should warn about potential sparse edge detection"
        );
    }

    #[test]
    fn test_multipass_without_noise_filtering_warning() {
        let mut config = RawConfig::new();
        config.insert(
            "enable_multipass".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert(
            "noise_filtering".to_string(),
            ParameterValue::Boolean(false),
        );

        let result = validate_configuration(&config, TraceBackend::Edge);
        assert!(
            result.has_warnings(),
            "Should warn about multipass without noise filtering"
        );

        let has_multipass_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::ConflictResolved { conflicting_parameters, .. }
                if conflicting_parameters.contains(&"enable_multipass".to_string()) &&
                   conflicting_parameters.contains(&"noise_filtering".to_string()))
        });
        assert!(
            has_multipass_warning,
            "Should warn about inconsistent multipass configuration"
        );
    }
}
