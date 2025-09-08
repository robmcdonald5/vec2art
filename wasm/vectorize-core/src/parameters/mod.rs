//! Parameter Registry and Validation System
//!
//! This module provides a centralized parameter registry for all vectorization
//! algorithms, ensuring type safety, validation, and consistency between
//! frontend and backend parameter handling.
//!
//! ## Architecture
//!
//! - `registry.rs`: Central parameter definitions and metadata
//! - `types.rs`: Parameter value types and enums  
//! - `validation.rs`: Parameter validation logic and error handling
//! - `codegen.rs`: TypeScript type generation from registry
//!
//! ## Key Features
//!
//! - Single source of truth for all parameters
//! - Type-safe parameter definitions with constraints
//! - Backend-specific parameter applicability
//! - Comprehensive validation with clear error messages
//! - Auto-generated TypeScript types for frontend integration
//! - Parameter audit trail for debugging override issues

pub mod registry;
pub mod types;
pub mod validation;
pub mod codegen;
pub mod audit;

#[cfg(test)]
mod tests;

// Re-export main public API
pub use registry::{PARAMETER_REGISTRY, ParameterDefinition};
pub use types::{ParameterType, ParameterValue, ParameterConstraints, ParameterCategory, ParameterSource};
pub use validation::{ParameterValidator, ValidationResult, ValidationError, ValidationWarning};
pub use audit::{ParameterAuditor, ParameterChange, ParameterConflict, ParameterAudit, ConflictType};

/// Initialize the parameter system
///
/// This function should be called once during system initialization to
/// validate the parameter registry and set up any required state.
pub fn initialize() -> Result<(), String> {
    // Validate registry completeness
    registry::validate_registry_completeness()?;
    
    // Initialize validator
    validation::initialize_validator();
    
    Ok(())
}

