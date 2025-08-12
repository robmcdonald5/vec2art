//! Configuration builder module for trace-low vectorization
//!
//! This module provides a builder pattern interface for creating `TraceLowConfig` instances
//! with comprehensive parameter validation, preset configurations, and backend-specific
//! optimizations. It serves as the shared configuration interface for both the CLI and WASM
//! implementations.

use crate::algorithms::{HandDrawnConfig, HandDrawnPresets, TraceBackend, TraceLowConfig};
use std::collections::HashMap;

/// Error type for configuration validation
#[derive(Debug, Clone)]
pub enum ConfigBuilderError {
    /// Invalid parameter value with description
    InvalidParameter(String),
    /// Invalid backend name
    InvalidBackend(String),
    /// Invalid preset name
    InvalidPreset(String),
    /// Parameter validation failed
    ValidationFailed(String),
}

impl std::fmt::Display for ConfigBuilderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigBuilderError::InvalidParameter(msg) => write!(f, "Invalid parameter: {msg}"),
            ConfigBuilderError::InvalidBackend(msg) => write!(f, "Invalid backend: {msg}"),
            ConfigBuilderError::InvalidPreset(msg) => write!(f, "Invalid preset: {msg}"),
            ConfigBuilderError::ValidationFailed(msg) => write!(f, "Validation failed: {msg}"),
        }
    }
}

impl std::error::Error for ConfigBuilderError {}

/// Result type for configuration operations
pub type ConfigBuilderResult<T> = Result<T, ConfigBuilderError>;

/// Builder pattern for constructing TraceLowConfig instances with validation
#[derive(Debug, Clone)]
pub struct ConfigBuilder {
    config: TraceLowConfig,
    hand_drawn_preset: Option<String>,
    custom_tremor: Option<f32>,
    custom_variable_weights: Option<f32>,
}

impl Default for ConfigBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl ConfigBuilder {
    /// Create a new ConfigBuilder with default values
    pub fn new() -> Self {
        Self {
            config: TraceLowConfig::default(),
            hand_drawn_preset: None,
            custom_tremor: None,
            custom_variable_weights: None,
        }
    }

    /// Set the tracing backend
    pub fn backend(mut self, backend: TraceBackend) -> Self {
        self.config.backend = backend;
        self
    }

    /// Set the tracing backend by string name
    pub fn backend_by_name(mut self, backend: &str) -> ConfigBuilderResult<Self> {
        self.config.backend = self.parse_backend(backend)?;
        Ok(self)
    }

    /// Set the detail level (0.0 = very sparse, 1.0 = more detail)
    pub fn detail(mut self, detail: f32) -> ConfigBuilderResult<Self> {
        self.validate_detail(detail)?;
        self.config.detail = detail;
        Ok(self)
    }

    /// Set the stroke width at 1080p reference resolution
    pub fn stroke_width(mut self, width: f32) -> ConfigBuilderResult<Self> {
        self.validate_stroke_width(width)?;
        self.config.stroke_px_at_1080p = width;
        Ok(self)
    }

    /// Enable or disable multipass processing
    pub fn multipass(mut self, enabled: bool) -> Self {
        self.config.enable_multipass = enabled;
        self
    }

    /// Set conservative detail level for first pass
    pub fn conservative_detail(mut self, detail: Option<f32>) -> ConfigBuilderResult<Self> {
        if let Some(d) = detail {
            self.validate_detail(d)?;
        }
        self.config.conservative_detail = detail;
        Ok(self)
    }

    /// Set aggressive detail level for second pass
    pub fn aggressive_detail(mut self, detail: Option<f32>) -> ConfigBuilderResult<Self> {
        if let Some(d) = detail {
            self.validate_detail(d)?;
        }
        self.config.aggressive_detail = detail;
        Ok(self)
    }

    /// Enable or disable noise filtering
    pub fn noise_filtering(mut self, enabled: bool) -> Self {
        self.config.noise_filtering = enabled;
        self
    }

    /// Enable or disable reverse pass processing
    pub fn reverse_pass(mut self, enabled: bool) -> Self {
        self.config.enable_reverse_pass = enabled;
        self
    }

    /// Enable or disable diagonal pass processing
    pub fn diagonal_pass(mut self, enabled: bool) -> Self {
        self.config.enable_diagonal_pass = enabled;
        self
    }

    /// Set directional strength threshold
    pub fn directional_threshold(mut self, threshold: f32) -> ConfigBuilderResult<Self> {
        self.validate_unit_range(threshold, "directional_threshold")?;
        self.config.directional_strength_threshold = threshold;
        Ok(self)
    }

    /// Set maximum processing time in milliseconds
    pub fn max_processing_time_ms(mut self, time_ms: u64) -> Self {
        self.config.max_processing_time_ms = time_ms;
        self
    }

    // Dot-specific parameters

    /// Set dot density threshold (0.0-1.0)
    pub fn dot_density(mut self, density: f32) -> ConfigBuilderResult<Self> {
        self.validate_unit_range(density, "dot_density")?;
        self.config.dot_density_threshold = density;
        Ok(self)
    }

    /// Set dot size range with validation
    pub fn dot_size_range(mut self, min_radius: f32, max_radius: f32) -> ConfigBuilderResult<Self> {
        self.validate_dot_size_range(min_radius, max_radius)?;
        self.config.dot_min_radius = min_radius;
        self.config.dot_max_radius = max_radius;
        Ok(self)
    }

    /// Parse and set dot size range from "min,max" format
    pub fn dot_size_range_from_string(self, range_str: &str) -> ConfigBuilderResult<Self> {
        let (min, max) = self.parse_dot_size_range(range_str)?;
        self.dot_size_range(min, max)
    }

    /// Set background tolerance for automatic background detection
    pub fn background_tolerance(mut self, tolerance: f32) -> ConfigBuilderResult<Self> {
        self.validate_unit_range(tolerance, "background_tolerance")?;
        self.config.dot_background_tolerance = tolerance;
        Ok(self)
    }

    /// Enable or disable color preservation in dots
    pub fn preserve_colors(mut self, enabled: bool) -> Self {
        self.config.dot_preserve_colors = enabled;
        self
    }

    /// Enable or disable adaptive dot sizing
    pub fn adaptive_sizing(mut self, enabled: bool) -> Self {
        self.config.dot_adaptive_sizing = enabled;
        self
    }

    // Hand-drawn aesthetic parameters

    /// Set hand-drawn preset by name
    pub fn hand_drawn_preset(mut self, preset: &str) -> ConfigBuilderResult<Self> {
        self.validate_hand_drawn_preset(preset)?;
        self.hand_drawn_preset = Some(preset.to_string());
        Ok(self)
    }

    /// Set custom tremor strength (overrides preset)
    pub fn custom_tremor(mut self, tremor: f32) -> ConfigBuilderResult<Self> {
        self.validate_tremor(tremor)?;
        self.custom_tremor = Some(tremor);
        Ok(self)
    }

    /// Set custom variable weights (overrides preset)
    pub fn custom_variable_weights(mut self, weights: f32) -> ConfigBuilderResult<Self> {
        self.validate_unit_range(weights, "variable_weights")?;
        self.custom_variable_weights = Some(weights);
        Ok(self)
    }

    // Advanced parameters for ETF/FDoG

    /// Enable ETF/FDoG advanced edge detection
    pub fn enable_etf_fdog(mut self, enabled: bool) -> Self {
        self.config.enable_etf_fdog = enabled;
        self
    }

    /// Enable flow-guided tracing (requires ETF/FDoG)
    pub fn enable_flow_tracing(mut self, enabled: bool) -> Self {
        self.config.enable_flow_tracing = enabled;
        self
    }

    /// Enable Bézier curve fitting (requires flow tracing)
    pub fn enable_bezier_fitting(mut self, enabled: bool) -> Self {
        self.config.enable_bezier_fitting = enabled;
        self
    }

    // Preset configurations for common use cases

    /// Configure for standard line art with clean lines
    pub fn for_line_art() -> Self {
        Self::new()
            .backend(TraceBackend::Edge)
            .detail(0.4)
            .unwrap()
            .stroke_width(1.2)
            .unwrap()
            .multipass(false)
            .noise_filtering(false)
    }

    /// Configure for sketchy, hand-drawn style
    pub fn for_sketch() -> Self {
        Self::new()
            .backend(TraceBackend::Edge)
            .detail(0.35)
            .unwrap()
            .stroke_width(1.5)
            .unwrap()
            .multipass(true)
            .noise_filtering(true)
            .hand_drawn_preset("medium")
            .unwrap()
    }

    /// Configure for technical/architectural drawings
    pub fn for_technical() -> Self {
        Self::new()
            .backend(TraceBackend::Centerline)
            .detail(0.6)
            .unwrap()
            .stroke_width(1.0)
            .unwrap()
            .multipass(true)
            .reverse_pass(true)
            .diagonal_pass(true)
    }

    /// Configure for dense stippling effect
    pub fn for_dense_stippling() -> Self {
        Self::new()
            .backend(TraceBackend::Dots)
            .detail(0.3)
            .unwrap()
            .dot_density(0.05)
            .unwrap()
            .dot_size_range(0.3, 1.0)
            .unwrap()
            .adaptive_sizing(true)
            .preserve_colors(false)
    }

    /// Configure for colorful pointillism
    pub fn for_pointillism() -> Self {
        Self::new()
            .backend(TraceBackend::Dots)
            .detail(0.4)
            .unwrap()
            .dot_density(0.15)
            .unwrap()
            .dot_size_range(1.0, 4.0)
            .unwrap()
            .adaptive_sizing(true)
            .preserve_colors(true)
    }

    /// Configure for sparse artistic dots
    pub fn for_sparse_dots() -> Self {
        Self::new()
            .backend(TraceBackend::Dots)
            .detail(0.5)
            .unwrap()
            .dot_density(0.3)
            .unwrap()
            .dot_size_range(2.0, 6.0)
            .unwrap()
            .adaptive_sizing(true)
            .preserve_colors(true)
    }

    /// Configure for fine detail stippling
    pub fn for_fine_stippling() -> Self {
        Self::new()
            .backend(TraceBackend::Dots)
            .detail(0.2)
            .unwrap()
            .dot_density(0.02)
            .unwrap()
            .dot_size_range(0.2, 0.8)
            .unwrap()
            .adaptive_sizing(true)
            .preserve_colors(false)
    }

    /// Configure for bold artistic style
    pub fn for_bold_artistic() -> Self {
        Self::new()
            .backend(TraceBackend::Dots)
            .detail(0.7)
            .unwrap()
            .dot_density(0.4)
            .unwrap()
            .dot_size_range(3.0, 8.0)
            .unwrap()
            .adaptive_sizing(false)
            .preserve_colors(true)
    }

    /// Build the final TraceLowConfig with validation
    pub fn build(self) -> ConfigBuilderResult<TraceLowConfig> {
        // Validate the complete configuration
        self.validate_complete_config()?;
        Ok(self.config)
    }

    /// Build TraceLowConfig with optional hand-drawn configuration
    pub fn build_with_hand_drawn(
        self,
    ) -> ConfigBuilderResult<(TraceLowConfig, Option<HandDrawnConfig>)> {
        // Validate the complete configuration first
        self.validate_complete_config()?;

        // Build hand-drawn config before consuming self
        let hand_drawn_config = self.build_hand_drawn_config()?;

        // Build final config (consumes self)
        let config = self.config;

        Ok((config, hand_drawn_config))
    }

    /// Get available backend names
    pub fn available_backends() -> Vec<&'static str> {
        vec!["edge", "centerline", "superpixel", "dots"]
    }

    /// Get available hand-drawn presets
    pub fn available_hand_drawn_presets() -> Vec<&'static str> {
        vec!["none", "subtle", "medium", "strong", "sketchy"]
    }

    /// Get backend-specific parameter recommendations
    pub fn get_backend_recommendations(backend: TraceBackend) -> HashMap<&'static str, String> {
        let mut recommendations = HashMap::new();

        match backend {
            TraceBackend::Edge => {
                recommendations.insert("detail", "0.3-0.5 for clean lines".to_string());
                recommendations
                    .insert("multipass", "false for speed, true for quality".to_string());
                recommendations.insert("noise_filtering", "true for noisy images".to_string());
            }
            TraceBackend::Centerline => {
                recommendations.insert("detail", "0.4-0.7 for technical drawings".to_string());
                recommendations.insert("multipass", "recommended for complex shapes".to_string());
                recommendations.insert(
                    "reverse_pass",
                    "useful for architectural elements".to_string(),
                );
            }
            TraceBackend::Superpixel => {
                recommendations.insert("detail", "0.2-0.4 for cell-shaded look".to_string());
                recommendations.insert("multipass", "false - single pass sufficient".to_string());
            }
            TraceBackend::Dots => {
                recommendations.insert(
                    "dot_density",
                    "0.05-0.2 for dense, 0.3-0.7 for sparse".to_string(),
                );
                recommendations.insert("dot_size_range", "0.3-1.5 fine, 1.0-5.0 bold".to_string());
                recommendations.insert("preserve_colors", "true for pointillism".to_string());
                recommendations.insert(
                    "adaptive_sizing",
                    "recommended for natural look".to_string(),
                );
            }
        }

        recommendations
    }

    // Private validation methods

    fn validate_detail(&self, detail: f32) -> ConfigBuilderResult<()> {
        if !(0.0..=1.0).contains(&detail) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Detail level must be between 0.0 and 1.0, got: {detail}"
            )));
        }
        Ok(())
    }

    fn validate_stroke_width(&self, width: f32) -> ConfigBuilderResult<()> {
        if width <= 0.0 {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Stroke width must be positive, got: {width}"
            )));
        }
        if width > 50.0 {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Stroke width too large (max: 50.0), got: {width}"
            )));
        }
        Ok(())
    }

    fn validate_unit_range(&self, value: f32, param_name: &str) -> ConfigBuilderResult<()> {
        if !(0.0..=1.0).contains(&value) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "{param_name} must be between 0.0 and 1.0, got: {value}"
            )));
        }
        Ok(())
    }

    fn validate_tremor(&self, tremor: f32) -> ConfigBuilderResult<()> {
        if !(0.0..=0.5).contains(&tremor) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Tremor strength must be between 0.0 and 0.5, got: {tremor}"
            )));
        }
        Ok(())
    }

    fn validate_dot_size_range(&self, min_radius: f32, max_radius: f32) -> ConfigBuilderResult<()> {
        if min_radius <= 0.0 || max_radius <= 0.0 {
            return Err(ConfigBuilderError::InvalidParameter(
                "Dot radii must be positive numbers.".to_string(),
            ));
        }

        if min_radius >= max_radius {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Minimum radius ({min_radius}) must be less than maximum radius ({max_radius})"
            )));
        }

        Ok(())
    }

    fn parse_dot_size_range(&self, s: &str) -> ConfigBuilderResult<(f32, f32)> {
        let parts: Vec<&str> = s.split(',').collect();
        if parts.len() != 2 {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Invalid dot size range format '{s}'. Expected 'min,max' (e.g., '0.5,3.0')"
            )));
        }

        let min = parts[0].trim().parse::<f32>().map_err(|_| {
            ConfigBuilderError::InvalidParameter(format!(
                "Invalid minimum radius '{}'. Must be a positive number.",
                parts[0]
            ))
        })?;

        let max = parts[1].trim().parse::<f32>().map_err(|_| {
            ConfigBuilderError::InvalidParameter(format!(
                "Invalid maximum radius '{}'. Must be a positive number.",
                parts[1]
            ))
        })?;

        self.validate_dot_size_range(min, max)?;
        Ok((min, max))
    }

    fn parse_backend(&self, backend: &str) -> ConfigBuilderResult<TraceBackend> {
        match backend.to_lowercase().as_str() {
            "edge" => Ok(TraceBackend::Edge),
            "centerline" => Ok(TraceBackend::Centerline),
            "superpixel" => Ok(TraceBackend::Superpixel),
            "dots" => Ok(TraceBackend::Dots),
            _ => Err(ConfigBuilderError::InvalidBackend(format!(
                "Invalid backend: {backend}. Must be one of: edge, centerline, superpixel, dots"
            ))),
        }
    }

    fn validate_hand_drawn_preset(&self, preset: &str) -> ConfigBuilderResult<()> {
        match preset {
            "none" | "subtle" | "medium" | "strong" | "sketchy" => Ok(()),
            _ => Err(ConfigBuilderError::InvalidPreset(
                format!(
                    "Invalid hand-drawn preset: {preset}. Must be one of: none, subtle, medium, strong, sketchy"
                )
            ))
        }
    }

    fn validate_complete_config(&self) -> ConfigBuilderResult<()> {
        // Validate ETF/FDoG dependencies
        if self.config.enable_flow_tracing && !self.config.enable_etf_fdog {
            return Err(ConfigBuilderError::ValidationFailed(
                "Flow tracing requires enable_etf_fdog to be true".to_string(),
            ));
        }

        if self.config.enable_bezier_fitting && !self.config.enable_flow_tracing {
            return Err(ConfigBuilderError::ValidationFailed(
                "Bézier fitting requires enable_flow_tracing to be true".to_string(),
            ));
        }

        // Validate hand-drawn custom overrides
        if (self.custom_tremor.is_some() || self.custom_variable_weights.is_some())
            && matches!(self.hand_drawn_preset.as_deref(), None | Some("none"))
        {
            return Err(ConfigBuilderError::ValidationFailed(
                "Hand-drawn preset must be specified when using custom tremor or variable weights"
                    .to_string(),
            ));
        }

        Ok(())
    }

    fn build_hand_drawn_config(&self) -> ConfigBuilderResult<Option<HandDrawnConfig>> {
        let preset = match self.hand_drawn_preset.as_deref() {
            None | Some("none") => return Ok(None),
            Some("subtle") => HandDrawnPresets::subtle(),
            Some("medium") => HandDrawnPresets::medium(),
            Some("strong") => HandDrawnPresets::strong(),
            Some("sketchy") => HandDrawnPresets::sketchy(),
            Some(other) => {
                return Err(ConfigBuilderError::InvalidPreset(format!(
                    "Invalid hand-drawn preset: {other}"
                )))
            }
        };

        let mut config = preset;

        // Apply custom overrides
        if let Some(tremor) = self.custom_tremor {
            config.tremor_strength = tremor;
        }
        if let Some(weights) = self.custom_variable_weights {
            config.variable_weights = weights;
        }

        Ok(Some(config))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_builder_basic() {
        let builder = ConfigBuilder::new()
            .backend(TraceBackend::Edge)
            .detail(0.5)
            .unwrap()
            .stroke_width(2.0)
            .unwrap();

        let config = builder.build().unwrap();
        assert_eq!(config.backend, TraceBackend::Edge);
        assert_eq!(config.detail, 0.5);
        assert_eq!(config.stroke_px_at_1080p, 2.0);
    }

    #[test]
    fn test_backend_by_name() {
        let builder = ConfigBuilder::new().backend_by_name("dots").unwrap();
        let config = builder.build().unwrap();
        assert_eq!(config.backend, TraceBackend::Dots);

        // Test invalid backend
        let result = ConfigBuilder::new().backend_by_name("invalid");
        assert!(result.is_err());
    }

    #[test]
    fn test_detail_validation() {
        // Valid detail
        assert!(ConfigBuilder::new().detail(0.5).is_ok());
        assert!(ConfigBuilder::new().detail(0.0).is_ok());
        assert!(ConfigBuilder::new().detail(1.0).is_ok());

        // Invalid detail
        assert!(ConfigBuilder::new().detail(-0.1).is_err());
        assert!(ConfigBuilder::new().detail(1.1).is_err());
    }

    #[test]
    fn test_dot_size_range_parsing() {
        let builder = ConfigBuilder::new();

        // Valid ranges
        assert_eq!(builder.parse_dot_size_range("0.5,3.0").unwrap(), (0.5, 3.0));
        assert_eq!(
            builder.parse_dot_size_range("1.0, 5.0").unwrap(),
            (1.0, 5.0)
        );

        // Invalid formats
        assert!(builder.parse_dot_size_range("0.5").is_err());
        assert!(builder.parse_dot_size_range("0.5,3.0,1.0").is_err());
        assert!(builder.parse_dot_size_range("invalid,3.0").is_err());
        assert!(builder.parse_dot_size_range("3.0,0.5").is_err()); // min >= max
        assert!(builder.parse_dot_size_range("-1.0,3.0").is_err()); // negative
    }

    #[test]
    fn test_dot_size_range_from_string() {
        let config = ConfigBuilder::new()
            .dot_size_range_from_string("1.0,4.0")
            .unwrap()
            .build()
            .unwrap();

        assert_eq!(config.dot_min_radius, 1.0);
        assert_eq!(config.dot_max_radius, 4.0);
    }

    #[test]
    fn test_presets() {
        // Test line art preset
        let config = ConfigBuilder::for_line_art().build().unwrap();
        assert_eq!(config.backend, TraceBackend::Edge);
        assert_eq!(config.detail, 0.4);
        assert!(!config.enable_multipass);

        // Test sketch preset
        let config = ConfigBuilder::for_sketch().build().unwrap();
        assert_eq!(config.backend, TraceBackend::Edge);
        assert!(config.enable_multipass);
        assert!(config.noise_filtering);

        // Test dense stippling preset
        let config = ConfigBuilder::for_dense_stippling().build().unwrap();
        assert_eq!(config.backend, TraceBackend::Dots);
        assert_eq!(config.dot_density_threshold, 0.05);
        assert!(!config.dot_preserve_colors);

        // Test pointillism preset
        let config = ConfigBuilder::for_pointillism().build().unwrap();
        assert_eq!(config.backend, TraceBackend::Dots);
        assert!(config.dot_preserve_colors);
    }

    #[test]
    fn test_hand_drawn_config() {
        let (_config, hand_drawn) = ConfigBuilder::new()
            .hand_drawn_preset("medium")
            .unwrap()
            .build_with_hand_drawn()
            .unwrap();

        assert!(hand_drawn.is_some());
        let hd = hand_drawn.unwrap();
        assert!(hd.tremor_strength > 0.0);
        assert!(hd.variable_weights > 0.0);
    }

    #[test]
    fn test_hand_drawn_custom_overrides() {
        let (_, hand_drawn) = ConfigBuilder::new()
            .hand_drawn_preset("subtle")
            .unwrap()
            .custom_tremor(0.3)
            .unwrap()
            .custom_variable_weights(0.8)
            .unwrap()
            .build_with_hand_drawn()
            .unwrap();

        let hd = hand_drawn.unwrap();
        assert_eq!(hd.tremor_strength, 0.3);
        assert_eq!(hd.variable_weights, 0.8);
    }

    #[test]
    fn test_validation_failures() {
        // ETF/FDoG dependency validation
        let result = ConfigBuilder::new().enable_flow_tracing(true).build();
        assert!(result.is_err());

        // Bézier fitting dependency validation
        let result = ConfigBuilder::new().enable_bezier_fitting(true).build();
        assert!(result.is_err());

        // Hand-drawn custom without preset
        let result = ConfigBuilder::new().custom_tremor(0.2).unwrap().build();
        assert!(result.is_err());
    }

    #[test]
    fn test_backend_recommendations() {
        let recommendations = ConfigBuilder::get_backend_recommendations(TraceBackend::Dots);
        assert!(recommendations.contains_key("dot_density"));
        assert!(recommendations.contains_key("preserve_colors"));

        let recommendations = ConfigBuilder::get_backend_recommendations(TraceBackend::Edge);
        assert!(recommendations.contains_key("detail"));
        assert!(recommendations.contains_key("multipass"));
    }

    #[test]
    fn test_available_backends_and_presets() {
        let backends = ConfigBuilder::available_backends();
        assert!(backends.contains(&"edge"));
        assert!(backends.contains(&"dots"));

        let presets = ConfigBuilder::available_hand_drawn_presets();
        assert!(presets.contains(&"none"));
        assert!(presets.contains(&"sketchy"));
    }

    #[test]
    fn test_stroke_width_validation() {
        // Valid stroke widths
        assert!(ConfigBuilder::new().stroke_width(0.1).is_ok());
        assert!(ConfigBuilder::new().stroke_width(10.0).is_ok());
        assert!(ConfigBuilder::new().stroke_width(50.0).is_ok());

        // Invalid stroke widths
        assert!(ConfigBuilder::new().stroke_width(0.0).is_err());
        assert!(ConfigBuilder::new().stroke_width(-1.0).is_err());
        assert!(ConfigBuilder::new().stroke_width(51.0).is_err());
    }
}
