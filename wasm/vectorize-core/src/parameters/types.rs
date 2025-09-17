//! Parameter value types and constraints
//!
//! This module defines the type system for parameters, including value types,
//! constraints, and backend applicability.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Parameter value types with validation constraints
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ParameterType {
    /// Floating-point parameter with range and precision constraints
    Float {
        min: f32,
        max: f32,
        precision: u8, // Number of decimal places for UI
    },
    /// Integer parameter with range constraints
    Integer { min: i32, max: i32 },
    /// Boolean parameter
    Boolean,
    /// Enumeration parameter with allowed values
    Enum { variants: Vec<String> },
    /// String parameter with optional length constraint
    String { max_length: Option<usize> },
}

impl ParameterType {
    /// Convert parameter type to TypeScript type string
    pub fn to_typescript(&self) -> String {
        match self {
            ParameterType::Float { .. } => "number".to_string(),
            ParameterType::Integer { .. } => "number".to_string(),
            ParameterType::Boolean => "boolean".to_string(),
            ParameterType::Enum { variants } => {
                let variant_list = variants
                    .iter()
                    .map(|v| format!("'{}'", v))
                    .collect::<Vec<_>>()
                    .join(" | ");
                variant_list
            }
            ParameterType::String { .. } => "string".to_string(),
        }
    }
}

/// Actual parameter values
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ParameterValue {
    Float(f32),
    Integer(i32),
    Boolean(bool),
    String(String),
}

impl ParameterValue {
    /// Validate that this value matches the given parameter type
    pub fn validate_against_type(&self, param_type: &ParameterType) -> Result<(), String> {
        match (self, param_type) {
            (ParameterValue::Float(val), ParameterType::Float { min, max, .. }) => {
                if *val < *min || *val > *max {
                    return Err(format!(
                        "Float value {} out of range [{}, {}]",
                        val, min, max
                    ));
                }
            }
            (ParameterValue::Integer(val), ParameterType::Integer { min, max }) => {
                if *val < *min || *val > *max {
                    return Err(format!(
                        "Integer value {} out of range [{}, {}]",
                        val, min, max
                    ));
                }
            }
            (ParameterValue::Boolean(_), ParameterType::Boolean) => {
                // Boolean values are always valid
            }
            (ParameterValue::String(val), ParameterType::Enum { variants }) => {
                if !variants.contains(val) {
                    return Err(format!(
                        "String value '{}' not in allowed variants: {:?}",
                        val, variants
                    ));
                }
            }
            (ParameterValue::String(val), ParameterType::String { max_length }) => {
                if let Some(max_len) = max_length {
                    if val.len() > *max_len {
                        return Err(format!(
                            "String length {} exceeds maximum {}",
                            val.len(),
                            max_len
                        ));
                    }
                }
            }
            _ => {
                return Err(format!(
                    "Parameter value type {:?} does not match expected type {:?}",
                    self, param_type
                ));
            }
        }
        Ok(())
    }
}

impl fmt::Display for ParameterValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParameterValue::Float(val) => write!(f, "{}", val),
            ParameterValue::Integer(val) => write!(f, "{}", val),
            ParameterValue::Boolean(val) => write!(f, "{}", val),
            ParameterValue::String(val) => write!(f, "{}", val),
        }
    }
}

/// Parameter constraints and dependencies
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ParameterConstraints {
    /// Parameters that must be present for this parameter to be valid
    pub requires: Vec<String>,
    /// Parameters that conflict with this parameter (mutually exclusive)
    pub conflicts_with: Vec<String>,
    /// Whether this parameter is backend-specific
    pub backend_specific: bool,
}

/// Parameter categories for UI organization
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum ParameterCategory {
    /// Core parameters that apply to all backends
    Core,
    /// Quality and performance parameters
    Quality,
    /// Algorithm-specific parameters
    Algorithm,
    /// Visual styling parameters
    Style,
    /// Color processing parameters
    Color,
    /// Advanced/experimental parameters
    Advanced,
}

impl fmt::Display for ParameterCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParameterCategory::Core => write!(f, "Core"),
            ParameterCategory::Quality => write!(f, "Quality"),
            ParameterCategory::Algorithm => write!(f, "Algorithm"),
            ParameterCategory::Style => write!(f, "Style"),
            ParameterCategory::Color => write!(f, "Color"),
            ParameterCategory::Advanced => write!(f, "Advanced"),
        }
    }
}

/// Source of a parameter value (for audit trail)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ParameterSource {
    /// Set by user via frontend interface
    Frontend,
    /// Applied from a preset configuration
    Preset,
    /// Default value for the selected backend
    BackendDefault,
    /// Overridden by algorithm logic (potential issue)
    AlgorithmOverride,
}

impl fmt::Display for ParameterSource {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParameterSource::Frontend => write!(f, "Frontend"),
            ParameterSource::Preset => write!(f, "Preset"),
            ParameterSource::BackendDefault => write!(f, "Backend Default"),
            ParameterSource::AlgorithmOverride => write!(f, "Algorithm Override"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parameter_value_validation() {
        let float_type = ParameterType::Float {
            min: 0.0,
            max: 1.0,
            precision: 2,
        };

        // Valid values
        assert!(ParameterValue::Float(0.5)
            .validate_against_type(&float_type)
            .is_ok());
        assert!(ParameterValue::Float(0.0)
            .validate_against_type(&float_type)
            .is_ok());
        assert!(ParameterValue::Float(1.0)
            .validate_against_type(&float_type)
            .is_ok());

        // Invalid values
        assert!(ParameterValue::Float(-0.1)
            .validate_against_type(&float_type)
            .is_err());
        assert!(ParameterValue::Float(1.1)
            .validate_against_type(&float_type)
            .is_err());
        assert!(ParameterValue::Integer(5)
            .validate_against_type(&float_type)
            .is_err());
    }

    #[test]
    fn test_enum_validation() {
        let enum_type = ParameterType::Enum {
            variants: vec![
                "square".to_string(),
                "hexagonal".to_string(),
                "poisson".to_string(),
            ],
        };

        assert!(ParameterValue::String("square".to_string())
            .validate_against_type(&enum_type)
            .is_ok());
        assert!(ParameterValue::String("invalid".to_string())
            .validate_against_type(&enum_type)
            .is_err());
    }

    #[test]
    fn test_typescript_type_generation() {
        let float_type = ParameterType::Float {
            min: 0.0,
            max: 1.0,
            precision: 2,
        };
        assert_eq!(float_type.to_typescript(), "number");

        let enum_type = ParameterType::Enum {
            variants: vec!["a".to_string(), "b".to_string(), "c".to_string()],
        };
        assert_eq!(enum_type.to_typescript(), "'a' | 'b' | 'c'");

        let bool_type = ParameterType::Boolean;
        assert_eq!(bool_type.to_typescript(), "boolean");
    }
}
