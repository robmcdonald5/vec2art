//! Comprehensive tests for the parameter system
//!
//! This module contains integration tests that validate the parameter registry,
//! validation logic, and TypeScript generation functionality.

use super::*;
use crate::algorithms::TraceBackend;

/// Test parameter registry completeness and consistency
mod registry_tests {
    use super::*;

    #[test]
    fn test_registry_initialization() {
        // Registry should initialize without errors
        assert!(registry::validate_registry_completeness().is_ok());

        // Registry should not be empty
        assert!(!PARAMETER_REGISTRY.is_empty());
    }

    #[test]
    fn test_all_backends_have_parameters() {
        let backends = [
            TraceBackend::Edge,
            TraceBackend::Centerline,
            TraceBackend::Superpixel,
            TraceBackend::Dots,
        ];

        for backend in backends {
            let params = registry::get_parameters_for_backend(backend);
            assert!(
                !params.is_empty(),
                "Backend {:?} has no parameters",
                backend
            );

            // All backends should have core parameters
            assert!(
                params.iter().any(|p| p.name == "detail"),
                "Backend {:?} missing 'detail' parameter",
                backend
            );
            assert!(
                params.iter().any(|p| p.name == "stroke_px_at_1080p"),
                "Backend {:?} missing 'stroke_px_at_1080p' parameter",
                backend
            );
        }
    }

    #[test]
    fn test_superpixel_specific_parameters() {
        let superpixel_params = registry::get_parameters_for_backend(TraceBackend::Superpixel);

        // Should have superpixel-specific parameters
        let superpixel_param_names: Vec<&str> = superpixel_params.iter().map(|p| p.name).collect();

        assert!(superpixel_param_names.contains(&"superpixel_initialization_pattern"));
        assert!(superpixel_param_names.contains(&"num_superpixels"));
        assert!(superpixel_param_names.contains(&"superpixel_compactness"));
        assert!(superpixel_param_names.contains(&"superpixel_slic_iterations"));

        // Should NOT have dots-specific parameters
        assert!(!superpixel_param_names.contains(&"dot_density_threshold"));
        assert!(!superpixel_param_names.contains(&"dot_min_radius"));
    }

    #[test]
    fn test_dots_specific_parameters() {
        let dots_params = registry::get_parameters_for_backend(TraceBackend::Dots);
        let dots_param_names: Vec<&str> = dots_params.iter().map(|p| p.name).collect();

        // Should have dots-specific parameters
        assert!(dots_param_names.contains(&"dot_density_threshold"));
        assert!(dots_param_names.contains(&"dot_min_radius"));
        assert!(dots_param_names.contains(&"dot_max_radius"));
        assert!(dots_param_names.contains(&"dot_adaptive_sizing"));
        assert!(dots_param_names.contains(&"dot_preserve_colors"));

        // Should NOT have superpixel-specific parameters
        assert!(!dots_param_names.contains(&"superpixel_initialization_pattern"));
        assert!(!dots_param_names.contains(&"num_superpixels"));
    }

    #[test]
    fn test_centerline_specific_parameters() {
        let centerline_params = registry::get_parameters_for_backend(TraceBackend::Centerline);
        let centerline_param_names: Vec<&str> = centerline_params.iter().map(|p| p.name).collect();

        // Should have centerline-specific parameters
        assert!(centerline_param_names.contains(&"enable_adaptive_threshold"));
        assert!(centerline_param_names.contains(&"adaptive_threshold_window_size"));
        assert!(centerline_param_names.contains(&"adaptive_threshold_k"));
        assert!(centerline_param_names.contains(&"min_branch_length"));
        assert!(centerline_param_names.contains(&"douglas_peucker_epsilon"));
    }

    #[test]
    fn test_parameter_dependencies() {
        // Test that parameter dependencies are valid
        for (param_name, param_def) in PARAMETER_REGISTRY.iter() {
            for required_param in &param_def.constraints.requires {
                assert!(
                    PARAMETER_REGISTRY.contains_key(required_param.as_str()),
                    "Parameter '{}' requires '{}' which doesn't exist",
                    param_name,
                    required_param
                );
            }

            for conflicting_param in &param_def.constraints.conflicts_with {
                assert!(
                    PARAMETER_REGISTRY.contains_key(conflicting_param.as_str()),
                    "Parameter '{}' conflicts with '{}' which doesn't exist",
                    param_name,
                    conflicting_param
                );
            }
        }
    }

    #[test]
    fn test_parameter_lookup() {
        // Test successful lookups
        assert!(registry::get_parameter_definition("detail").is_some());
        assert!(registry::get_parameter_definition("superpixel_initialization_pattern").is_some());
        assert!(registry::get_parameter_definition("dot_density_threshold").is_some());

        // Test failed lookups
        assert!(registry::get_parameter_definition("nonexistent_parameter").is_none());
        assert!(registry::get_parameter_definition("").is_none());
    }

    #[test]
    fn test_no_parameter_redundancy() {
        // Ensure we don't have redundant parameter names like both
        // "initialization_pattern" and "superpixel_initialization_pattern"
        let param_names: Vec<&str> = PARAMETER_REGISTRY.keys().cloned().collect();

        // Should NOT have generic "initialization_pattern"
        assert!(
            !param_names.contains(&"initialization_pattern"),
            "Generic 'initialization_pattern' should be removed - use backend-specific names"
        );

        // Should have backend-specific patterns
        assert!(param_names.contains(&"superpixel_initialization_pattern"));
    }
}

/// Test parameter validation functionality
mod validation_tests {
    use super::*;

    pub fn create_test_config() -> validation::RawConfig {
        let mut config = validation::RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(0.5));
        config.insert("stroke_px_at_1080p".to_string(), ParameterValue::Float(1.5));
        config
    }

    #[test]
    fn test_valid_superpixel_configuration() {
        let mut config = create_test_config();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );
        config.insert("num_superpixels".to_string(), ParameterValue::Integer(275));

        let result = validation::validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.is_valid(),
            "Valid configuration should pass: {:?}",
            result.errors
        );
    }

    #[test]
    fn test_unknown_parameter_error() {
        let mut config = create_test_config();
        config.insert(
            "completely_unknown_param".to_string(),
            ParameterValue::Float(0.5),
        );

        let result = validation::validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid());

        let has_unknown_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::UnknownParameter(name)
                if name == "completely_unknown_param")
        });
        assert!(has_unknown_error);
    }

    #[test]
    fn test_parameter_not_applicable_warning() {
        let mut config = create_test_config();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );

        // Using superpixel parameter with edge backend should generate warning
        let result = validation::validate_configuration(&config, TraceBackend::Edge);
        assert!(result.has_warnings());

        let has_ignored_warning = result.warnings.iter().any(|w| {
            matches!(w, ValidationWarning::ParameterIgnored { parameter, backend, .. }
                if parameter == "superpixel_initialization_pattern" && *backend == TraceBackend::Edge)
        });
        assert!(has_ignored_warning);
    }

    #[test]
    fn test_invalid_enum_value() {
        let mut config = create_test_config();
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("invalid_pattern".to_string()),
        );

        let result = validation::validate_configuration(&config, TraceBackend::Superpixel);
        assert!(!result.is_valid());

        // Should have enum validation error
        let has_enum_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::InvalidEnumVariant { parameter, .. }
                if parameter == "superpixel_initialization_pattern")
        });
        assert!(has_enum_error);
    }

    #[test]
    fn test_value_out_of_range() {
        let mut config = create_test_config();
        config.insert("detail".to_string(), ParameterValue::Float(1.5)); // Should be [0.0, 1.0]

        let result = validation::validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid());

        let has_range_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::ValueOutOfRange { parameter, .. } if parameter == "detail")
        });
        assert!(has_range_error);
    }

    #[test]
    fn test_missing_required_parameter() {
        let mut config = create_test_config();
        config.insert(
            "superpixel_boundary_epsilon".to_string(),
            ParameterValue::Float(1.0),
        );
        // Missing required parameter: superpixel_simplify_boundaries

        let result = validation::validate_configuration(&config, TraceBackend::Superpixel);
        assert!(!result.is_valid());

        let has_missing_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::MissingRequiredParameter { parameter, required_by }
                if parameter == "superpixel_simplify_boundaries" && required_by == "superpixel_boundary_epsilon")
        });
        assert!(has_missing_error);
    }

    #[test]
    fn test_type_mismatch() {
        let mut config = create_test_config();
        config.insert(
            "detail".to_string(),
            ParameterValue::String("not_a_number".to_string()),
        );

        let result = validation::validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid());

        // Should have type mismatch error
        let has_type_error = result.errors.iter().any(|e| {
            matches!(e, ValidationError::TypeMismatch { parameter, .. } if parameter == "detail")
        });
        assert!(has_type_error);
    }

    #[test]
    fn test_parameter_consistency() {
        let config = create_test_config();

        // First validation
        let result1 = validation::validate_configuration(&config, TraceBackend::Edge);

        // Second validation with same config should produce identical results
        let result2 = validation::validate_configuration(&config, TraceBackend::Edge);

        // Results should be identical
        assert_eq!(result1.errors, result2.errors);
        assert_eq!(result1.warnings, result2.warnings);
    }

    #[test]
    fn test_all_parameter_types_validation() {
        let mut config = validation::RawConfig::new();

        // Test float parameter
        config.insert("detail".to_string(), ParameterValue::Float(0.5));

        // Test integer parameter
        config.insert("num_superpixels".to_string(), ParameterValue::Integer(275));

        // Test boolean parameter
        config.insert(
            "enable_adaptive_threshold".to_string(),
            ParameterValue::Boolean(true),
        );

        // Test enum parameter
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );

        let result = validation::validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.is_valid(),
            "All parameter types should validate correctly: {:?}",
            result.errors
        );
    }
}

/// Test TypeScript code generation
mod codegen_tests {
    use super::*;

    #[test]
    fn test_typescript_generation_completeness() {
        let typescript_code = codegen::generate_typescript_interfaces();

        // Should contain main interface
        assert!(typescript_code.contains("export interface VectorizerConfig"));

        // Should contain all backend interfaces
        assert!(typescript_code.contains("EdgeBackendConfig"));
        assert!(typescript_code.contains("CenterlineBackendConfig"));
        assert!(typescript_code.contains("SuperpixelBackendConfig"));
        assert!(typescript_code.contains("DotsBackendConfig"));

        // Should contain parameter metadata
        assert!(typescript_code.contains("export const PARAMETER_METADATA"));

        // Should contain utility functions
        assert!(typescript_code.contains("export function getParametersForBackend"));
        assert!(typescript_code.contains("export function validateParameter"));
    }

    #[test]
    fn test_all_parameters_in_typescript() {
        let typescript_code = codegen::generate_typescript_interfaces();

        // Every parameter in registry should appear in TypeScript
        for param_name in PARAMETER_REGISTRY.keys() {
            assert!(
                typescript_code.contains(param_name),
                "Parameter '{}' not found in generated TypeScript",
                param_name
            );
        }
    }

    #[test]
    fn test_typescript_file_generation() {
        let result = codegen::generate_typescript_file();
        assert!(
            result.is_ok(),
            "TypeScript file generation failed: {:?}",
            result.err()
        );

        let content = result.unwrap();
        assert!(!content.is_empty());
        assert!(content.contains("DO NOT EDIT MANUALLY"));
        assert!(content.contains("Generated from: wasm/vectorize-core"));
    }

    #[test]
    fn test_enum_typescript_generation() {
        let typescript_code = codegen::generate_typescript_interfaces();

        // Check that superpixel pattern enum is properly generated
        assert!(typescript_code.contains("'square' | 'hexagonal' | 'poisson'"));
    }
}

/// Integration tests that validate the entire parameter system
mod integration_tests {
    use super::*;

    #[test]
    fn test_parameter_system_initialization() {
        // System should initialize without errors
        assert!(initialize().is_ok());
    }

    #[test]
    fn test_full_superpixel_configuration_flow() {
        // Create a complete superpixel configuration
        let mut config = validation::RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(0.2));
        config.insert("stroke_px_at_1080p".to_string(), ParameterValue::Float(1.5));
        config.insert("num_superpixels".to_string(), ParameterValue::Integer(275));
        config.insert(
            "superpixel_compactness".to_string(),
            ParameterValue::Float(10.0),
        );
        config.insert(
            "superpixel_slic_iterations".to_string(),
            ParameterValue::Integer(10),
        );
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );
        config.insert(
            "superpixel_fill_regions".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert(
            "superpixel_stroke_regions".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert(
            "superpixel_simplify_boundaries".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert(
            "superpixel_boundary_epsilon".to_string(),
            ParameterValue::Float(1.0),
        );
        config.insert(
            "superpixel_preserve_colors".to_string(),
            ParameterValue::Boolean(true),
        );

        // Should validate without errors
        let result = validation::validate_configuration(&config, TraceBackend::Superpixel);
        assert!(
            result.is_valid(),
            "Complete superpixel config should be valid: {:?}",
            result.errors
        );

        // Should have some warnings for redundant parameters (set to defaults)
        assert!(result.has_warnings());
    }

    #[test]
    fn test_full_dots_configuration_flow() {
        // Create a complete dots configuration
        let mut config = validation::RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(0.8));
        config.insert("stroke_px_at_1080p".to_string(), ParameterValue::Float(1.0));
        config.insert(
            "dot_density_threshold".to_string(),
            ParameterValue::Float(0.105),
        );
        config.insert("dot_min_radius".to_string(), ParameterValue::Float(0.5));
        config.insert("dot_max_radius".to_string(), ParameterValue::Float(3.0));
        config.insert(
            "dot_preserve_colors".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert(
            "dot_adaptive_sizing".to_string(),
            ParameterValue::Boolean(true),
        );
        config.insert(
            "dot_background_tolerance".to_string(),
            ParameterValue::Float(0.1),
        );
        config.insert(
            "dot_gradient_based_sizing".to_string(),
            ParameterValue::Boolean(true),
        );

        // Should validate without errors
        let result = validation::validate_configuration(&config, TraceBackend::Dots);
        assert!(
            result.is_valid(),
            "Complete dots config should be valid: {:?}",
            result.errors
        );
    }

    #[test]
    fn test_cross_backend_parameter_isolation() {
        // Create config with parameters for multiple backends
        let mut config = validation::RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(0.5));
        config.insert(
            "superpixel_initialization_pattern".to_string(),
            ParameterValue::String("poisson".to_string()),
        );
        config.insert(
            "dot_density_threshold".to_string(),
            ParameterValue::Float(0.1),
        );
        config.insert(
            "enable_adaptive_threshold".to_string(),
            ParameterValue::Boolean(true),
        );

        // When used with Edge backend, should only see warnings for non-applicable params
        let edge_result = validation::validate_configuration(&config, TraceBackend::Edge);
        assert!(edge_result.is_valid()); // Should be valid (core params apply)
        assert!(edge_result.has_warnings()); // Should warn about backend-specific params

        // Should have warnings for superpixel, dots, and centerline params
        assert_eq!(edge_result.warnings.len(), 3); // All non-edge params should be ignored
    }

    #[test]
    fn test_error_message_formatting() {
        let mut config = validation::RawConfig::new();
        config.insert("detail".to_string(), ParameterValue::Float(2.0)); // Out of range
        config.insert("unknown_param".to_string(), ParameterValue::Float(1.0)); // Unknown

        let result = validation::validate_configuration(&config, TraceBackend::Edge);
        assert!(!result.is_valid());

        let error_message = result.error_message().unwrap();
        assert!(error_message.contains("detail"));
        assert!(error_message.contains("unknown_param"));
    }
}

/// Performance and stress tests
#[cfg(test)]
mod performance_tests {
    use super::*;

    #[test]
    fn test_validation_performance() {
        let config = validation_tests::create_test_config();

        // Validate same config multiple times
        let start = std::time::Instant::now();
        for _ in 0..100 {
            // Reduced iterations since no caching
            let _ = validation::validate_configuration(&config, TraceBackend::Edge);
        }
        let duration = start.elapsed();

        // Should complete reasonably quickly
        assert!(
            duration.as_millis() < 1000,
            "Validation took too long: {:?}",
            duration
        );
    }

    #[test]
    fn test_large_configuration() {
        let mut config = validation::RawConfig::new();

        // Add all possible parameters
        for (param_name, param_def) in PARAMETER_REGISTRY.iter() {
            config.insert(param_name.to_string(), param_def.default_value.clone());
        }

        // Should validate quickly even with all parameters
        let start = std::time::Instant::now();
        let result = validation::validate_configuration(&config, TraceBackend::Superpixel);
        let duration = start.elapsed();

        assert!(result.is_valid());
        assert!(duration.as_millis() < 50);
    }
}

/// Run all tests
#[cfg(test)]
pub fn run_all_tests() {
    // These tests are run automatically by cargo test
    // This function is for manual testing if needed
}
