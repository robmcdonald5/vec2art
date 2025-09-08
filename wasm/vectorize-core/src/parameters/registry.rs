//! Central Parameter Registry
//!
//! This module contains the definitive registry of all parameters supported by
//! the vectorization system. It serves as the single source of truth for
//! parameter definitions, validation rules, and frontend type generation.

use std::collections::HashMap;
use once_cell::sync::Lazy;
use crate::algorithms::TraceBackend;
use super::types::{ParameterType, ParameterValue, ParameterConstraints, ParameterCategory};

/// Complete parameter definition with metadata
#[derive(Debug, Clone)]
pub struct ParameterDefinition {
    /// Parameter name (matches field in TraceLowConfig)
    pub name: &'static str,
    /// Human-readable description for UI
    pub description: &'static str,
    /// Parameter type with validation constraints
    pub parameter_type: ParameterType,
    /// Backends that use this parameter
    pub applicable_backends: Vec<TraceBackend>,
    /// Parameter constraints and dependencies
    pub constraints: ParameterConstraints,
    /// Default value
    pub default_value: ParameterValue,
    /// UI category for organization
    pub category: ParameterCategory,
}

/// Central registry of all parameters
///
/// This is the authoritative source for all parameter definitions.
/// Adding a new parameter requires only adding an entry here.
pub static PARAMETER_REGISTRY: Lazy<HashMap<&'static str, ParameterDefinition>> = Lazy::new(|| {
    vec![
        // ==================== CORE PARAMETERS ====================
        ("detail", ParameterDefinition {
            name: "detail",
            description: "Detail level (0.0 = sparse, 1.0 = detailed)",
            parameter_type: ParameterType::Float { min: 0.0, max: 1.0, precision: 2 },
            applicable_backends: vec![TraceBackend::Edge, TraceBackend::Centerline, TraceBackend::Superpixel, TraceBackend::Dots],
            constraints: ParameterConstraints::default(),
            default_value: ParameterValue::Float(0.8),
            category: ParameterCategory::Core,
        }),

        ("stroke_px_at_1080p", ParameterDefinition {
            name: "stroke_px_at_1080p", 
            description: "Stroke width at 1080p reference resolution",
            parameter_type: ParameterType::Float { min: 0.1, max: 20.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Edge, TraceBackend::Centerline, TraceBackend::Superpixel, TraceBackend::Dots],
            constraints: ParameterConstraints::default(),
            default_value: ParameterValue::Float(1.5),
            category: ParameterCategory::Core,
        }),

        // ==================== QUALITY PARAMETERS ====================
        ("enable_multipass", ParameterDefinition {
            name: "enable_multipass",
            description: "Enable multi-pass processing for enhanced quality",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Edge],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(false),
            category: ParameterCategory::Quality,
        }),

        ("pass_count", ParameterDefinition {
            name: "pass_count",
            description: "Number of processing passes (1-10)",
            parameter_type: ParameterType::Integer { min: 1, max: 10 },
            applicable_backends: vec![TraceBackend::Edge],
            constraints: ParameterConstraints { 
                requires: vec!["enable_multipass".to_string()],
                backend_specific: true, 
                ..Default::default() 
            },
            default_value: ParameterValue::Integer(1),
            category: ParameterCategory::Quality,
        }),

        ("noise_filtering", ParameterDefinition {
            name: "noise_filtering",
            description: "Enable content-aware noise filtering",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Edge, TraceBackend::Centerline],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(false),
            category: ParameterCategory::Quality,
        }),

        ("noise_filter_spatial_sigma", ParameterDefinition {
            name: "noise_filter_spatial_sigma",
            description: "Spatial sigma for bilateral noise filtering (higher = more smoothing)",
            parameter_type: ParameterType::Float { min: 0.5, max: 5.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Edge, TraceBackend::Centerline],
            constraints: ParameterConstraints { 
                requires: vec!["noise_filtering".to_string()],
                backend_specific: true,
                ..Default::default() 
            },
            default_value: ParameterValue::Float(2.0),
            category: ParameterCategory::Quality,
        }),

        ("noise_filter_range_sigma", ParameterDefinition {
            name: "noise_filter_range_sigma", 
            description: "Range sigma for bilateral noise filtering (higher = less edge preservation)",
            parameter_type: ParameterType::Float { min: 10.0, max: 200.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Edge, TraceBackend::Centerline],
            constraints: ParameterConstraints { 
                requires: vec!["noise_filtering".to_string()],
                backend_specific: true,
                ..Default::default() 
            },
            default_value: ParameterValue::Float(50.0),
            category: ParameterCategory::Quality,
        }),

        // ==================== DIRECTIONAL PROCESSING ====================
        ("enable_reverse_pass", ParameterDefinition {
            name: "enable_reverse_pass",
            description: "Enable reverse direction processing (R→L, B→T)",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Edge],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(false),
            category: ParameterCategory::Algorithm,
        }),

        ("enable_diagonal_pass", ParameterDefinition {
            name: "enable_diagonal_pass",
            description: "Enable diagonal direction processing (NW→SE, NE→SW)",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Edge],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(false),
            category: ParameterCategory::Algorithm,
        }),

        ("directional_strength_threshold", ParameterDefinition {
            name: "directional_strength_threshold",
            description: "Threshold for directional strength - skip pass if not beneficial",
            parameter_type: ParameterType::Float { min: 0.0, max: 1.0, precision: 2 },
            applicable_backends: vec![TraceBackend::Edge],
            constraints: ParameterConstraints { 
                requires: vec!["enable_reverse_pass".to_string(), "enable_diagonal_pass".to_string()],
                backend_specific: true,
                ..Default::default() 
            },
            default_value: ParameterValue::Float(0.1),
            category: ParameterCategory::Algorithm,
        }),

        // ==================== SUPERPIXEL PARAMETERS ====================
        ("num_superpixels", ParameterDefinition {
            name: "num_superpixels",
            description: "Number of superpixels to generate",
            parameter_type: ParameterType::Integer { min: 20, max: 1000 },
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Integer(275),
            category: ParameterCategory::Algorithm,
        }),

        ("superpixel_compactness", ParameterDefinition {
            name: "superpixel_compactness",
            description: "SLIC compactness parameter - higher values create more regular shapes",
            parameter_type: ParameterType::Float { min: 1.0, max: 50.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(10.0),
            category: ParameterCategory::Algorithm,
        }),

        ("superpixel_slic_iterations", ParameterDefinition {
            name: "superpixel_slic_iterations",
            description: "SLIC iterations for convergence",
            parameter_type: ParameterType::Integer { min: 5, max: 15 },
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Integer(10),
            category: ParameterCategory::Algorithm,
        }),

        ("superpixel_initialization_pattern", ParameterDefinition {
            name: "superpixel_initialization_pattern",
            description: "Pattern for placing initial superpixel cluster centers",
            parameter_type: ParameterType::Enum { 
                variants: vec!["square".to_string(), "hexagonal".to_string(), "poisson".to_string()]
            },
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::String("poisson".to_string()),
            category: ParameterCategory::Algorithm,
        }),

        ("superpixel_fill_regions", ParameterDefinition {
            name: "superpixel_fill_regions",
            description: "Whether to fill superpixel regions with solid color",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Style,
        }),

        ("superpixel_stroke_regions", ParameterDefinition {
            name: "superpixel_stroke_regions",
            description: "Whether to stroke superpixel region boundaries",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Style,
        }),

        ("superpixel_simplify_boundaries", ParameterDefinition {
            name: "superpixel_simplify_boundaries",
            description: "Whether to simplify superpixel boundaries using Douglas-Peucker",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Quality,
        }),

        ("superpixel_boundary_epsilon", ParameterDefinition {
            name: "superpixel_boundary_epsilon",
            description: "Boundary simplification tolerance",
            parameter_type: ParameterType::Float { min: 0.5, max: 3.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { 
                requires: vec!["superpixel_simplify_boundaries".to_string()],
                backend_specific: true,
                ..Default::default() 
            },
            default_value: ParameterValue::Float(1.0),
            category: ParameterCategory::Quality,
        }),

        ("superpixel_preserve_colors", ParameterDefinition {
            name: "superpixel_preserve_colors",
            description: "Whether to preserve original colors in superpixel regions",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Superpixel],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Color,
        }),

        // ==================== DOTS BACKEND PARAMETERS ====================
        ("dot_density_threshold", ParameterDefinition {
            name: "dot_density_threshold",
            description: "Minimum gradient strength required to place a dot",
            parameter_type: ParameterType::Float { min: 0.0, max: 1.0, precision: 3 },
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(0.105),
            category: ParameterCategory::Algorithm,
        }),

        ("dot_min_radius", ParameterDefinition {
            name: "dot_min_radius",
            description: "Minimum dot radius in pixels",
            parameter_type: ParameterType::Float { min: 0.1, max: 5.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(0.5),
            category: ParameterCategory::Style,
        }),

        ("dot_max_radius", ParameterDefinition {
            name: "dot_max_radius",
            description: "Maximum dot radius in pixels",
            parameter_type: ParameterType::Float { min: 0.5, max: 20.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(3.0),
            category: ParameterCategory::Style,
        }),

        ("dot_preserve_colors", ParameterDefinition {
            name: "dot_preserve_colors",
            description: "Whether to preserve original pixel colors in dot output",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Color,
        }),

        ("dot_adaptive_sizing", ParameterDefinition {
            name: "dot_adaptive_sizing",
            description: "Whether to use adaptive sizing based on local variance",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Algorithm,
        }),

        ("dot_background_tolerance", ParameterDefinition {
            name: "dot_background_tolerance",
            description: "Background color tolerance for background detection",
            parameter_type: ParameterType::Float { min: 0.0, max: 1.0, precision: 2 },
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(0.1),
            category: ParameterCategory::Algorithm,
        }),

        ("dot_poisson_disk_sampling", ParameterDefinition {
            name: "dot_poisson_disk_sampling",
            description: "Enable Poisson disk sampling for natural dot distribution",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(false),
            category: ParameterCategory::Algorithm,
        }),

        ("dot_gradient_based_sizing", ParameterDefinition {
            name: "dot_gradient_based_sizing",
            description: "Enable gradient-based sizing for dot scaling based on local image gradients",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Dots],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Algorithm,
        }),

        // ==================== CENTERLINE PARAMETERS ====================
        ("enable_adaptive_threshold", ParameterDefinition {
            name: "enable_adaptive_threshold",
            description: "Enable adaptive thresholding for centerline backend",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Centerline],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(true),
            category: ParameterCategory::Algorithm,
        }),

        ("adaptive_threshold_window_size", ParameterDefinition {
            name: "adaptive_threshold_window_size",
            description: "Window size for adaptive thresholding",
            parameter_type: ParameterType::Integer { min: 15, max: 45 },
            applicable_backends: vec![TraceBackend::Centerline],
            constraints: ParameterConstraints { 
                requires: vec!["enable_adaptive_threshold".to_string()],
                backend_specific: true,
                ..Default::default() 
            },
            default_value: ParameterValue::Integer(25),
            category: ParameterCategory::Algorithm,
        }),

        ("adaptive_threshold_k", ParameterDefinition {
            name: "adaptive_threshold_k",
            description: "Sensitivity parameter k for Sauvola thresholding",
            parameter_type: ParameterType::Float { min: 0.1, max: 0.9, precision: 2 },
            applicable_backends: vec![TraceBackend::Centerline],
            constraints: ParameterConstraints { 
                requires: vec!["enable_adaptive_threshold".to_string()],
                backend_specific: true,
                ..Default::default() 
            },
            default_value: ParameterValue::Float(0.3),
            category: ParameterCategory::Algorithm,
        }),

        ("enable_width_modulation", ParameterDefinition {
            name: "enable_width_modulation",
            description: "Enable EDT-based width modulation for centerline SVG strokes",
            parameter_type: ParameterType::Boolean,
            applicable_backends: vec![TraceBackend::Centerline],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Boolean(false),
            category: ParameterCategory::Style,
        }),

        ("min_branch_length", ParameterDefinition {
            name: "min_branch_length",
            description: "Minimum branch length for centerline tracing in pixels",
            parameter_type: ParameterType::Float { min: 2.0, max: 30.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Centerline],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(8.0),
            category: ParameterCategory::Quality,
        }),

        ("douglas_peucker_epsilon", ParameterDefinition {
            name: "douglas_peucker_epsilon",
            description: "Douglas-Peucker epsilon for path simplification",
            parameter_type: ParameterType::Float { min: 0.1, max: 5.0, precision: 1 },
            applicable_backends: vec![TraceBackend::Centerline],
            constraints: ParameterConstraints { backend_specific: true, ..Default::default() },
            default_value: ParameterValue::Float(1.0),
            category: ParameterCategory::Quality,
        }),

        // ==================== PERFORMANCE PARAMETERS ====================
        ("max_processing_time_ms", ParameterDefinition {
            name: "max_processing_time_ms", 
            description: "Maximum total processing time budget in milliseconds",
            parameter_type: ParameterType::Integer { min: 1000, max: 300000 },
            applicable_backends: vec![TraceBackend::Edge, TraceBackend::Centerline, TraceBackend::Superpixel, TraceBackend::Dots],
            constraints: ParameterConstraints::default(),
            default_value: ParameterValue::Integer(180000),
            category: ParameterCategory::Quality,
        }),
        
    ]
    .into_iter()
    .map(|(name, def)| (name, def))
    .collect()
});

/// Validate that the parameter registry is complete and consistent
pub fn validate_registry_completeness() -> Result<(), String> {
    // Check for duplicate parameter names
    let mut names = std::collections::HashSet::new();
    for (name, def) in PARAMETER_REGISTRY.iter() {
        if !names.insert(*name) {
            return Err(format!("Duplicate parameter name: {}", name));
        }
        
        if def.name != *name {
            return Err(format!("Parameter name mismatch: registry key '{}' != def.name '{}'", name, def.name));
        }
    }
    
    // Validate parameter dependencies
    for (name, def) in PARAMETER_REGISTRY.iter() {
        for required_param in &def.constraints.requires {
            if !PARAMETER_REGISTRY.contains_key(required_param.as_str()) {
                return Err(format!(
                    "Parameter '{}' requires '{}' which is not defined in registry", 
                    name, required_param
                ));
            }
        }
        
        for conflicting_param in &def.constraints.conflicts_with {
            if !PARAMETER_REGISTRY.contains_key(conflicting_param.as_str()) {
                return Err(format!(
                    "Parameter '{}' conflicts with '{}' which is not defined in registry", 
                    name, conflicting_param
                ));
            }
        }
    }
    
    Ok(())
}

/// Get all parameters applicable to a specific backend
pub fn get_parameters_for_backend(backend: TraceBackend) -> Vec<&'static ParameterDefinition> {
    PARAMETER_REGISTRY
        .values()
        .filter(|def| def.applicable_backends.contains(&backend))
        .collect()
}

/// Get parameter definition by name
pub fn get_parameter_definition(name: &str) -> Option<&'static ParameterDefinition> {
    PARAMETER_REGISTRY.get(name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_registry_validation() {
        assert!(validate_registry_completeness().is_ok());
    }

    #[test]
    fn test_backend_parameter_filtering() {
        let superpixel_params = get_parameters_for_backend(TraceBackend::Superpixel);
        
        // Should include superpixel-specific parameters
        assert!(superpixel_params.iter().any(|p| p.name == "superpixel_initialization_pattern"));
        assert!(superpixel_params.iter().any(|p| p.name == "num_superpixels"));
        
        // Should include core parameters
        assert!(superpixel_params.iter().any(|p| p.name == "detail"));
        
        // Should NOT include dots-specific parameters
        assert!(!superpixel_params.iter().any(|p| p.name == "dot_density_threshold"));
    }

    #[test]
    fn test_parameter_lookup() {
        let param_def = get_parameter_definition("superpixel_initialization_pattern");
        assert!(param_def.is_some());
        
        let param_def = param_def.unwrap();
        assert_eq!(param_def.name, "superpixel_initialization_pattern");
        assert!(param_def.applicable_backends.contains(&TraceBackend::Superpixel));
    }

    #[test]
    fn test_parameter_constraints() {
        let param_def = get_parameter_definition("superpixel_boundary_epsilon").unwrap();
        assert!(param_def.constraints.requires.contains(&"superpixel_simplify_boundaries".to_string()));
    }
}