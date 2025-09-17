use super::{ParameterDefinition, ParameterSource, ParameterValue};
use crate::algorithms::TraceBackend;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
/**
 * Parameter Auditing System
 *
 * Tracks parameter changes, detects overrides, and maintains audit trails
 * for debugging parameter-related issues.
 */
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterChange {
    pub parameter_name: String,
    pub old_value: Option<ParameterValue>,
    pub new_value: ParameterValue,
    #[serde(with = "chrono::serde::ts_milliseconds")]
    pub timestamp: DateTime<Utc>,
    pub source: ParameterSource,
    pub reason: Option<String>,
}

// Using the existing ParameterSource from types module

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterConflict {
    pub parameter_name: String,
    pub conflicting_parameter: String,
    pub conflict_type: ConflictType,
    pub description: String,
    pub resolution: ConflictResolution,
    #[serde(with = "chrono::serde::ts_milliseconds")]
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictType {
    /// Parameters are mutually exclusive
    MutuallyExclusive,
    /// Parameter values are incompatible
    ValueIncompatible,
    /// Parameter combination causes performance issues
    PerformanceImpact,
    /// Parameter combination is logically inconsistent
    LogicalInconsistency,
    /// Required dependency is missing
    MissingDependency,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictResolution {
    /// Automatically resolved by changing parameter values
    AutoResolved { changes: Vec<ParameterChange> },
    /// Flagged as warning but not resolved
    WarningFlagged,
    /// User intervention required
    RequiresUserInput,
    /// Ignored based on user preference
    Ignored,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterAudit {
    pub session_id: String,
    pub backend: TraceBackend,
    pub changes: Vec<ParameterChange>,
    pub conflicts: Vec<ParameterConflict>,
    pub final_parameters: HashMap<String, ParameterValue>,
    pub performance_impact: Option<PerformanceImpact>,
    #[serde(with = "chrono::serde::ts_milliseconds")]
    pub created_at: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_milliseconds")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceImpact {
    pub estimated_processing_time_ms: u32,
    pub memory_usage_estimate_mb: u32,
    pub complexity_score: f32, // 0.0 = simple, 1.0 = very complex
    pub bottleneck_parameters: Vec<String>,
    pub optimization_suggestions: Vec<OptimizationSuggestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationSuggestion {
    pub parameter_name: String,
    pub current_value: ParameterValue,
    pub suggested_value: ParameterValue,
    pub reason: String,
    pub impact: OptimizationImpact,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationImpact {
    pub performance_gain_percent: f32,
    pub quality_impact_percent: f32,
    pub description: String,
}

pub struct ParameterAuditor {
    current_audit: Option<ParameterAudit>,
    registry: &'static HashMap<&'static str, ParameterDefinition>,
}

impl ParameterAuditor {
    pub fn new(registry: &'static HashMap<&'static str, ParameterDefinition>) -> Self {
        Self {
            current_audit: None,
            registry,
        }
    }

    pub fn start_audit(&mut self, session_id: String, backend: TraceBackend) {
        let now = Utc::now();
        self.current_audit = Some(ParameterAudit {
            session_id,
            backend,
            changes: Vec::new(),
            conflicts: Vec::new(),
            final_parameters: HashMap::new(),
            performance_impact: None,
            created_at: now,
            updated_at: now,
        });
    }

    pub fn record_change(
        &mut self,
        parameter_name: String,
        old_value: Option<ParameterValue>,
        new_value: ParameterValue,
        source: ParameterSource,
        reason: Option<String>,
    ) {
        if let Some(audit) = &mut self.current_audit {
            let change = ParameterChange {
                parameter_name: parameter_name.clone(),
                old_value,
                new_value: new_value.clone(),
                timestamp: Utc::now(),
                source,
                reason,
            };

            audit.changes.push(change);
            audit.final_parameters.insert(parameter_name, new_value);
            audit.updated_at = Utc::now();
        }
    }

    pub fn record_conflict(&mut self, conflict: ParameterConflict) {
        if let Some(audit) = &mut self.current_audit {
            audit.conflicts.push(conflict);
            audit.updated_at = Utc::now();
        }
    }

    pub fn detect_conflicts(&mut self) -> Vec<ParameterConflict> {
        let mut conflicts = Vec::new();

        if let Some(audit) = &self.current_audit {
            // Check for mutually exclusive parameters
            conflicts.extend(self.check_mutually_exclusive_parameters(&audit.final_parameters));

            // Check for missing dependencies
            conflicts
                .extend(self.check_missing_dependencies(&audit.final_parameters, audit.backend));

            // Check for performance conflicts
            conflicts.extend(self.check_performance_conflicts(&audit.final_parameters));

            // Check for logical inconsistencies
            conflicts.extend(self.check_logical_inconsistencies(&audit.final_parameters));
        }

        // Record all detected conflicts
        for conflict in &conflicts {
            self.record_conflict(conflict.clone());
        }

        conflicts
    }

    fn check_mutually_exclusive_parameters(
        &self,
        parameters: &HashMap<String, ParameterValue>,
    ) -> Vec<ParameterConflict> {
        let mut conflicts = Vec::new();

        // Example: Multi-pass and single-pass specific parameters
        if let (Some(ParameterValue::Boolean(true)), Some(ParameterValue::Integer(count))) = (
            parameters.get("enable_multipass"),
            parameters.get("pass_count"),
        ) {
            if *count <= 1 {
                conflicts.push(ParameterConflict {
                    parameter_name: "enable_multipass".to_string(),
                    conflicting_parameter: "pass_count".to_string(),
                    conflict_type: ConflictType::LogicalInconsistency,
                    description: "Multi-pass enabled but pass count is 1 or less".to_string(),
                    resolution: ConflictResolution::RequiresUserInput,
                    timestamp: Utc::now(),
                });
            }
        }

        // Example: Noise filtering requirements
        if let (Some(ParameterValue::Boolean(false)), Some(_)) = (
            parameters.get("noise_filtering"),
            parameters.get("noise_filter_spatial_sigma"),
        ) {
            conflicts.push(ParameterConflict {
                parameter_name: "noise_filter_spatial_sigma".to_string(),
                conflicting_parameter: "noise_filtering".to_string(),
                conflict_type: ConflictType::MissingDependency,
                description: "Spatial sigma specified but noise filtering is disabled".to_string(),
                resolution: ConflictResolution::WarningFlagged,
                timestamp: Utc::now(),
            });
        }

        conflicts
    }

    fn check_missing_dependencies(
        &self,
        parameters: &HashMap<String, ParameterValue>,
        _backend: TraceBackend,
    ) -> Vec<ParameterConflict> {
        let mut conflicts = Vec::new();

        // Check each parameter's dependencies
        for param_name in parameters.keys() {
            if let Some(param_def) = self.registry.get(param_name.as_str()) {
                let dependencies = &param_def.constraints.requires;
                if !dependencies.is_empty() {
                    for dep in dependencies {
                        if !parameters.contains_key(dep as &str) {
                            conflicts.push(ParameterConflict {
                                parameter_name: param_name.clone(),
                                conflicting_parameter: dep.clone(),
                                conflict_type: ConflictType::MissingDependency,
                                description: format!(
                                    "Parameter '{}' requires '{}' to be set",
                                    param_name, dep
                                ),
                                resolution: ConflictResolution::RequiresUserInput,
                                timestamp: Utc::now(),
                            });
                        }
                    }
                }
            }
        }

        conflicts
    }

    fn check_performance_conflicts(
        &self,
        parameters: &HashMap<String, ParameterValue>,
    ) -> Vec<ParameterConflict> {
        let mut conflicts = Vec::new();

        // Example: High detail + high pass count = performance impact
        if let (Some(ParameterValue::Float(detail)), Some(ParameterValue::Integer(passes))) =
            (parameters.get("detail"), parameters.get("pass_count"))
        {
            if *detail > 0.8 && *passes > 3 {
                conflicts.push(ParameterConflict {
                    parameter_name: "detail".to_string(),
                    conflicting_parameter: "pass_count".to_string(),
                    conflict_type: ConflictType::PerformanceImpact,
                    description: "High detail with multiple passes may cause slow processing"
                        .to_string(),
                    resolution: ConflictResolution::WarningFlagged,
                    timestamp: Utc::now(),
                });
            }
        }

        // Example: Large superpixel count with complex processing
        if let Some(ParameterValue::Integer(superpixels)) = parameters.get("num_superpixels") {
            if *superpixels > 500 {
                conflicts.push(ParameterConflict {
                    parameter_name: "num_superpixels".to_string(),
                    conflicting_parameter: "performance".to_string(),
                    conflict_type: ConflictType::PerformanceImpact,
                    description: "Large number of superpixels may cause memory issues".to_string(),
                    resolution: ConflictResolution::WarningFlagged,
                    timestamp: Utc::now(),
                });
            }
        }

        conflicts
    }

    fn check_logical_inconsistencies(
        &self,
        parameters: &HashMap<String, ParameterValue>,
    ) -> Vec<ParameterConflict> {
        let mut conflicts = Vec::new();

        // Example: Dot radius constraints
        if let (Some(ParameterValue::Float(min_radius)), Some(ParameterValue::Float(max_radius))) = (
            parameters.get("dot_min_radius"),
            parameters.get("dot_max_radius"),
        ) {
            if min_radius >= max_radius {
                conflicts.push(ParameterConflict {
                    parameter_name: "dot_min_radius".to_string(),
                    conflicting_parameter: "dot_max_radius".to_string(),
                    conflict_type: ConflictType::LogicalInconsistency,
                    description: "Minimum dot radius must be less than maximum dot radius"
                        .to_string(),
                    resolution: ConflictResolution::RequiresUserInput,
                    timestamp: Utc::now(),
                });
            }
        }

        conflicts
    }

    pub fn calculate_performance_impact(&mut self) {
        if let Some(audit) = &mut self.current_audit {
            let mut complexity_score = 0.0;
            let mut bottleneck_params = Vec::new();
            let mut suggestions = Vec::new();

            // Analyze each parameter for performance impact
            for (param_name, param_value) in &audit.final_parameters {
                if let Some(_param_def) = self.registry.get(param_name.as_str()) {
                    match param_name.as_str() {
                        "detail" => {
                            if let ParameterValue::Float(value) = param_value {
                                complexity_score += value * 0.3; // Detail contributes significantly
                                if *value > 0.8 {
                                    bottleneck_params.push(param_name.clone());
                                    suggestions.push(OptimizationSuggestion {
                                        parameter_name: param_name.clone(),
                                        current_value: param_value.clone(),
                                        suggested_value: ParameterValue::Float(0.7),
                                        reason: "Reducing detail level improves processing speed"
                                            .to_string(),
                                        impact: OptimizationImpact {
                                            performance_gain_percent: 25.0,
                                            quality_impact_percent: -10.0,
                                            description:
                                                "25% faster processing, slightly less detail"
                                                    .to_string(),
                                        },
                                    });
                                }
                            }
                        }
                        "pass_count" => {
                            if let ParameterValue::Integer(value) = param_value {
                                complexity_score += (*value as f32) * 0.2; // Each pass adds complexity
                                if *value > 3 {
                                    bottleneck_params.push(param_name.clone());
                                }
                            }
                        }
                        "num_superpixels" => {
                            if let ParameterValue::Integer(value) = param_value {
                                complexity_score += (*value as f32) / 1000.0; // Normalize to 0-1 scale
                                if *value > 400 {
                                    bottleneck_params.push(param_name.clone());
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }

            // Estimate processing time based on complexity
            let base_time_ms = 500; // Base processing time
            let estimated_time = (base_time_ms as f32 * (1.0 + complexity_score * 3.0)) as u32;

            // Estimate memory usage
            let base_memory_mb = 50; // Base memory usage
            let estimated_memory = (base_memory_mb as f32 * (1.0 + complexity_score * 2.0)) as u32;

            audit.performance_impact = Some(PerformanceImpact {
                estimated_processing_time_ms: estimated_time,
                memory_usage_estimate_mb: estimated_memory,
                complexity_score,
                bottleneck_parameters: bottleneck_params,
                optimization_suggestions: suggestions,
            });
        }
    }

    pub fn get_audit_report(&self) -> Option<&ParameterAudit> {
        self.current_audit.as_ref()
    }

    pub fn finish_audit(mut self) -> Option<ParameterAudit> {
        if let Some(mut audit) = self.current_audit.take() {
            audit.updated_at = Utc::now();
            Some(audit)
        } else {
            None
        }
    }

    pub fn get_change_summary(&self) -> String {
        if let Some(audit) = &self.current_audit {
            let total_changes = audit.changes.len();
            let conflicts = audit.conflicts.len();
            let user_changes = audit
                .changes
                .iter()
                .filter(|c| matches!(c.source, ParameterSource::Frontend))
                .count();
            let auto_changes = total_changes - user_changes;

            format!(
                "Parameter Audit Summary:\n\
                 • Total changes: {}\n\
                 • User changes: {}\n\
                 • Automatic changes: {}\n\
                 • Conflicts detected: {}\n\
                 • Backend: {:?}",
                total_changes, user_changes, auto_changes, conflicts, audit.backend
            )
        } else {
            "No active audit session".to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parameters::PARAMETER_REGISTRY;

    #[test]
    fn test_auditor_creation() {
        let auditor = ParameterAuditor::new(&PARAMETER_REGISTRY);
        assert!(auditor.current_audit.is_none());
    }

    #[test]
    fn test_audit_session() {
        let mut auditor = ParameterAuditor::new(&PARAMETER_REGISTRY);
        auditor.start_audit("test-session".to_string(), TraceBackend::Edge);

        assert!(auditor.current_audit.is_some());
        let audit = auditor.current_audit.as_ref().unwrap();
        assert_eq!(audit.session_id, "test-session");
        assert_eq!(audit.backend, TraceBackend::Edge);
    }

    #[test]
    fn test_parameter_change_recording() {
        let mut auditor = ParameterAuditor::new(&PARAMETER_REGISTRY);
        auditor.start_audit("test-session".to_string(), TraceBackend::Edge);

        auditor.record_change(
            "detail".to_string(),
            Some(ParameterValue::Float(0.5)),
            ParameterValue::Float(0.8),
            ParameterSource::Frontend,
            Some("User adjusted detail level".to_string()),
        );

        let audit = auditor.current_audit.as_ref().unwrap();
        assert_eq!(audit.changes.len(), 1);
        assert_eq!(
            audit.final_parameters.get("detail"),
            Some(&ParameterValue::Float(0.8))
        );
    }

    #[test]
    fn test_conflict_detection() {
        let mut auditor = ParameterAuditor::new(&PARAMETER_REGISTRY);
        auditor.start_audit("test-session".to_string(), TraceBackend::Edge);

        // Set up conflicting parameters
        auditor.record_change(
            "enable_multipass".to_string(),
            None,
            ParameterValue::Boolean(true),
            ParameterSource::Frontend,
            None,
        );

        auditor.record_change(
            "pass_count".to_string(),
            None,
            ParameterValue::Integer(1),
            ParameterSource::Frontend,
            None,
        );

        let conflicts = auditor.detect_conflicts();
        assert!(!conflicts.is_empty());

        // Should detect the logical inconsistency
        let logical_conflicts: Vec<_> = conflicts
            .iter()
            .filter(|c| matches!(c.conflict_type, ConflictType::LogicalInconsistency))
            .collect();
        assert!(!logical_conflicts.is_empty());
    }

    #[test]
    fn test_performance_impact_calculation() {
        let mut auditor = ParameterAuditor::new(&PARAMETER_REGISTRY);
        auditor.start_audit("test-session".to_string(), TraceBackend::Edge);

        // Set high-impact parameters
        auditor.record_change(
            "detail".to_string(),
            None,
            ParameterValue::Float(0.9),
            ParameterSource::Frontend,
            None,
        );

        auditor.record_change(
            "pass_count".to_string(),
            None,
            ParameterValue::Integer(4),
            ParameterSource::Frontend,
            None,
        );

        auditor.calculate_performance_impact();

        let audit = auditor.current_audit.as_ref().unwrap();
        assert!(audit.performance_impact.is_some());

        let impact = audit.performance_impact.as_ref().unwrap();
        assert!(impact.complexity_score > 0.5); // Should be high complexity
        assert!(!impact.bottleneck_parameters.is_empty());
        assert!(!impact.optimization_suggestions.is_empty());
    }
}
