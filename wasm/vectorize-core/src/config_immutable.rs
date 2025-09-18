//! Immutable configuration system for vec2art
//!
//! This module provides an immutable, type-safe configuration system that eliminates
//! the recursive aliasing issues present in the mutable ConfigBuilder pattern.

use crate::algorithms::tracing::trace_low::{BackgroundRemovalAlgorithm, SuperpixelInitPattern};
use crate::algorithms::{HandDrawnConfig, HandDrawnPresets, TraceBackend, TraceLowConfig};

/// Error type for configuration operations
#[derive(Debug, Clone)]
pub enum ConfigError {
    InvalidParameter {
        name: String,
        value: String,
        reason: String,
    },
    ValidationFailed(String),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::InvalidParameter {
                name,
                value,
                reason,
            } => {
                write!(
                    f,
                    "Invalid parameter '{}' with value '{}': {}",
                    name, value, reason
                )
            }
            ConfigError::ValidationFailed(msg) => write!(f, "Validation failed: {}", msg),
        }
    }
}

impl std::error::Error for ConfigError {}

/// Result type for configuration operations
pub type ConfigResult<T> = Result<T, ConfigError>;

/// Immutable configuration value that can be set or inherited
#[derive(Debug, Clone)]
enum ConfigValue<T: Clone> {
    Set(T),
    Inherit,
}

impl<T: Clone> ConfigValue<T> {
    fn unwrap_or(&self, default: T) -> T {
        match self {
            ConfigValue::Set(value) => value.clone(),
            ConfigValue::Inherit => default,
        }
    }
}

/// Main immutable configuration structure
#[derive(Debug, Clone)]
pub struct VectorizerConfig {
    // Core settings
    backend: ConfigValue<TraceBackend>,
    detail: ConfigValue<f32>,
    stroke_width: ConfigValue<f32>,

    // Multipass settings
    multipass: ConfigValue<bool>,
    pass_count: ConfigValue<u32>,
    reverse_pass: ConfigValue<bool>,
    diagonal_pass: ConfigValue<bool>,

    // Processing settings
    noise_filtering: ConfigValue<bool>,
    svg_precision: ConfigValue<u8>,
    max_processing_time_ms: ConfigValue<u64>,
    max_image_size: ConfigValue<u32>,

    // Hand-drawn settings
    hand_drawn_preset: Option<String>,
    custom_tremor: Option<f32>,
    custom_variable_weights: Option<f32>,
    custom_tapering: Option<f32>,

    // Backend-specific settings stored in a type-safe way
    backend_settings: BackendSettings,

    // Background removal
    background_removal: ConfigValue<bool>,
    background_removal_strength: ConfigValue<f32>,
    background_removal_algorithm: ConfigValue<BackgroundRemovalAlgorithm>,
    background_removal_threshold: Option<u8>,
}

/// Backend-specific settings in a type-safe structure
#[derive(Debug, Clone)]
struct BackendSettings {
    // Edge/Centerline settings
    etf_fdog: ConfigValue<bool>,
    flow_tracing: ConfigValue<bool>,
    bezier_fitting: ConfigValue<bool>,

    // Centerline-specific
    adaptive_threshold: ConfigValue<bool>,
    window_size: ConfigValue<u32>,
    sensitivity_k: ConfigValue<f32>,
    width_modulation: ConfigValue<bool>,
    min_branch_length: ConfigValue<f32>,
    douglas_peucker_epsilon: ConfigValue<f32>,

    // Dots-specific
    dot_density: ConfigValue<f32>,
    dot_min_radius: ConfigValue<f32>,
    dot_max_radius: ConfigValue<f32>,
    dot_adaptive_sizing: ConfigValue<bool>,
    dot_preserve_colors: ConfigValue<bool>,
    dot_poisson_disk: ConfigValue<bool>,
    dot_gradient_sizing: ConfigValue<bool>,

    // Superpixel-specific
    num_superpixels: ConfigValue<u32>,
    compactness: ConfigValue<f32>,
    slic_iterations: ConfigValue<u32>,
    superpixel_pattern: ConfigValue<SuperpixelInitPattern>,
    fill_regions: ConfigValue<bool>,
    stroke_regions: ConfigValue<bool>,
    simplify_boundaries: ConfigValue<bool>,
    boundary_epsilon: ConfigValue<f32>,
    superpixel_preserve_colors: ConfigValue<bool>,

    // Line color settings (Edge/Centerline)
    line_preserve_colors: ConfigValue<bool>,
    line_color_accuracy: ConfigValue<f32>,
    max_colors_per_path: ConfigValue<u32>,
    color_tolerance: ConfigValue<f32>,
}

impl Default for VectorizerConfig {
    fn default() -> Self {
        Self {
            backend: ConfigValue::Set(TraceBackend::Edge),
            detail: ConfigValue::Set(0.4),
            stroke_width: ConfigValue::Set(1.5),
            multipass: ConfigValue::Set(false),
            pass_count: ConfigValue::Set(1),
            reverse_pass: ConfigValue::Set(false),
            diagonal_pass: ConfigValue::Set(false),
            noise_filtering: ConfigValue::Set(false),
            svg_precision: ConfigValue::Set(2),
            max_processing_time_ms: ConfigValue::Set(60000),
            max_image_size: ConfigValue::Set(4096),
            hand_drawn_preset: None,
            custom_tremor: None,
            custom_variable_weights: None,
            custom_tapering: None,
            backend_settings: BackendSettings::default(),
            background_removal: ConfigValue::Set(false),
            background_removal_strength: ConfigValue::Set(0.5),
            background_removal_algorithm: ConfigValue::Set(BackgroundRemovalAlgorithm::Auto),
            background_removal_threshold: None,
        }
    }
}

impl Default for BackendSettings {
    fn default() -> Self {
        Self {
            // Edge/Centerline defaults
            etf_fdog: ConfigValue::Set(false),
            flow_tracing: ConfigValue::Set(false),
            bezier_fitting: ConfigValue::Set(false),

            // Centerline defaults
            adaptive_threshold: ConfigValue::Set(true),
            window_size: ConfigValue::Set(25),
            sensitivity_k: ConfigValue::Set(0.3),
            width_modulation: ConfigValue::Set(true),
            min_branch_length: ConfigValue::Set(8.0),
            douglas_peucker_epsilon: ConfigValue::Set(1.0),

            // Dots defaults
            dot_density: ConfigValue::Set(0.2),
            dot_min_radius: ConfigValue::Set(0.5),
            dot_max_radius: ConfigValue::Set(3.0),
            dot_adaptive_sizing: ConfigValue::Set(true),
            dot_preserve_colors: ConfigValue::Set(false),
            dot_poisson_disk: ConfigValue::Set(false),
            dot_gradient_sizing: ConfigValue::Set(false),

            // Superpixel defaults
            num_superpixels: ConfigValue::Set(200),
            compactness: ConfigValue::Set(10.0),
            slic_iterations: ConfigValue::Set(10),
            superpixel_pattern: ConfigValue::Set(SuperpixelInitPattern::Poisson),
            fill_regions: ConfigValue::Set(false),
            stroke_regions: ConfigValue::Set(true),
            simplify_boundaries: ConfigValue::Set(true),
            boundary_epsilon: ConfigValue::Set(1.5),
            superpixel_preserve_colors: ConfigValue::Set(false),

            // Line color defaults
            line_preserve_colors: ConfigValue::Set(false),
            line_color_accuracy: ConfigValue::Set(0.5),
            max_colors_per_path: ConfigValue::Set(3),
            color_tolerance: ConfigValue::Set(0.2),
        }
    }
}

impl VectorizerConfig {
    /// Create a new configuration with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Create configuration for a specific backend
    pub fn for_backend(backend: TraceBackend) -> Self {
        Self::default().with_backend(backend)
    }

    // Immutable setter methods - each returns a new config

    pub fn with_backend(mut self, backend: TraceBackend) -> Self {
        self.backend = ConfigValue::Set(backend);
        self
    }

    pub fn with_detail(mut self, detail: f32) -> ConfigResult<Self> {
        if !(0.0..=1.0).contains(&detail) {
            return Err(ConfigError::InvalidParameter {
                name: "detail".to_string(),
                value: detail.to_string(),
                reason: "Must be between 0.0 and 1.0".to_string(),
            });
        }
        self.detail = ConfigValue::Set(detail);
        Ok(self)
    }

    pub fn with_stroke_width(mut self, width: f32) -> ConfigResult<Self> {
        if width <= 0.0 || width > 50.0 {
            return Err(ConfigError::InvalidParameter {
                name: "stroke_width".to_string(),
                value: width.to_string(),
                reason: "Must be between 0.0 and 50.0".to_string(),
            });
        }
        self.stroke_width = ConfigValue::Set(width);
        Ok(self)
    }

    pub fn with_multipass(mut self, enabled: bool, pass_count: Option<u32>) -> ConfigResult<Self> {
        self.multipass = ConfigValue::Set(enabled);
        if let Some(count) = pass_count {
            if !(1..=10).contains(&count) {
                return Err(ConfigError::InvalidParameter {
                    name: "pass_count".to_string(),
                    value: count.to_string(),
                    reason: "Must be between 1 and 10".to_string(),
                });
            }
            self.pass_count = ConfigValue::Set(count);
            if count > 1 {
                self.multipass = ConfigValue::Set(true);
            }
        }
        Ok(self)
    }

    pub fn with_directional_passes(mut self, reverse: bool, diagonal: bool) -> Self {
        self.reverse_pass = ConfigValue::Set(reverse);
        self.diagonal_pass = ConfigValue::Set(diagonal);
        self
    }

    pub fn with_noise_filtering(mut self, enabled: bool) -> Self {
        self.noise_filtering = ConfigValue::Set(enabled);
        self
    }

    pub fn with_hand_drawn_preset(mut self, preset: &str) -> ConfigResult<Self> {
        let valid_presets = ["none", "subtle", "medium", "strong", "sketchy"];
        if !valid_presets.contains(&preset) {
            return Err(ConfigError::InvalidParameter {
                name: "hand_drawn_preset".to_string(),
                value: preset.to_string(),
                reason: format!("Must be one of: {}", valid_presets.join(", ")),
            });
        }
        self.hand_drawn_preset = Some(preset.to_string());
        Ok(self)
    }

    pub fn with_custom_hand_drawn(
        mut self,
        tremor: Option<f32>,
        variable_weights: Option<f32>,
        tapering: Option<f32>,
    ) -> ConfigResult<Self> {
        if let Some(t) = tremor {
            if !(0.0..=0.5).contains(&t) {
                return Err(ConfigError::InvalidParameter {
                    name: "tremor".to_string(),
                    value: t.to_string(),
                    reason: "Must be between 0.0 and 0.5".to_string(),
                });
            }
            self.custom_tremor = Some(t);
        }

        if let Some(w) = variable_weights {
            if !(0.0..=1.0).contains(&w) {
                return Err(ConfigError::InvalidParameter {
                    name: "variable_weights".to_string(),
                    value: w.to_string(),
                    reason: "Must be between 0.0 and 1.0".to_string(),
                });
            }
            self.custom_variable_weights = Some(w);
        }

        if let Some(t) = tapering {
            if !(0.0..=1.0).contains(&t) {
                return Err(ConfigError::InvalidParameter {
                    name: "tapering".to_string(),
                    value: t.to_string(),
                    reason: "Must be between 0.0 and 1.0".to_string(),
                });
            }
            self.custom_tapering = Some(t);
        }

        Ok(self)
    }

    // Backend-specific configuration methods

    pub fn with_edge_settings(
        mut self,
        etf_fdog: bool,
        flow_tracing: bool,
        bezier_fitting: bool,
    ) -> ConfigResult<Self> {
        // Validate dependencies
        if bezier_fitting && !flow_tracing {
            return Err(ConfigError::ValidationFailed(
                "Bezier fitting requires flow tracing to be enabled".to_string(),
            ));
        }
        if flow_tracing && !etf_fdog {
            return Err(ConfigError::ValidationFailed(
                "Flow tracing requires ETF/FDoG to be enabled".to_string(),
            ));
        }

        self.backend_settings.etf_fdog = ConfigValue::Set(etf_fdog);
        self.backend_settings.flow_tracing = ConfigValue::Set(flow_tracing);
        self.backend_settings.bezier_fitting = ConfigValue::Set(bezier_fitting);
        Ok(self)
    }

    pub fn with_centerline_settings(
        mut self,
        adaptive_threshold: bool,
        window_size: u32,
        sensitivity_k: f32,
    ) -> ConfigResult<Self> {
        if !(15..=50).contains(&window_size) {
            return Err(ConfigError::InvalidParameter {
                name: "window_size".to_string(),
                value: window_size.to_string(),
                reason: "Must be between 15 and 50".to_string(),
            });
        }

        if !(0.1..=1.0).contains(&sensitivity_k) {
            return Err(ConfigError::InvalidParameter {
                name: "sensitivity_k".to_string(),
                value: sensitivity_k.to_string(),
                reason: "Must be between 0.1 and 1.0".to_string(),
            });
        }

        // Ensure window size is odd
        let window_size = if window_size.is_multiple_of(2) {
            window_size + 1
        } else {
            window_size
        };

        self.backend_settings.adaptive_threshold = ConfigValue::Set(adaptive_threshold);
        self.backend_settings.window_size = ConfigValue::Set(window_size);
        self.backend_settings.sensitivity_k = ConfigValue::Set(sensitivity_k);
        Ok(self)
    }

    pub fn with_dots_settings(
        mut self,
        density: f32,
        min_radius: f32,
        max_radius: f32,
        adaptive_sizing: bool,
        preserve_colors: bool,
    ) -> ConfigResult<Self> {
        if !(0.0..=1.0).contains(&density) {
            return Err(ConfigError::InvalidParameter {
                name: "dot_density".to_string(),
                value: density.to_string(),
                reason: "Must be between 0.0 and 1.0".to_string(),
            });
        }

        if min_radius <= 0.0 || max_radius <= 0.0 || min_radius >= max_radius {
            return Err(ConfigError::InvalidParameter {
                name: "dot_size_range".to_string(),
                value: format!("{}-{}", min_radius, max_radius),
                reason: "Invalid radius range".to_string(),
            });
        }

        self.backend_settings.dot_density = ConfigValue::Set(density);
        self.backend_settings.dot_min_radius = ConfigValue::Set(min_radius);
        self.backend_settings.dot_max_radius = ConfigValue::Set(max_radius);
        self.backend_settings.dot_adaptive_sizing = ConfigValue::Set(adaptive_sizing);
        self.backend_settings.dot_preserve_colors = ConfigValue::Set(preserve_colors);
        Ok(self)
    }

    pub fn with_superpixel_settings(
        mut self,
        num_superpixels: u32,
        compactness: f32,
        iterations: u32,
    ) -> ConfigResult<Self> {
        if !(20..=1000).contains(&num_superpixels) {
            return Err(ConfigError::InvalidParameter {
                name: "num_superpixels".to_string(),
                value: num_superpixels.to_string(),
                reason: "Must be between 20 and 1000".to_string(),
            });
        }

        if !(1.0..=50.0).contains(&compactness) {
            return Err(ConfigError::InvalidParameter {
                name: "compactness".to_string(),
                value: compactness.to_string(),
                reason: "Must be between 1.0 and 50.0".to_string(),
            });
        }

        if !(5..=15).contains(&iterations) {
            return Err(ConfigError::InvalidParameter {
                name: "slic_iterations".to_string(),
                value: iterations.to_string(),
                reason: "Must be between 5 and 15".to_string(),
            });
        }

        self.backend_settings.num_superpixels = ConfigValue::Set(num_superpixels);
        self.backend_settings.compactness = ConfigValue::Set(compactness);
        self.backend_settings.slic_iterations = ConfigValue::Set(iterations);
        Ok(self)
    }

    pub fn with_background_removal(
        mut self,
        enabled: bool,
        strength: Option<f32>,
        algorithm: Option<BackgroundRemovalAlgorithm>,
    ) -> ConfigResult<Self> {
        self.background_removal = ConfigValue::Set(enabled);

        if let Some(s) = strength {
            if !(0.0..=1.0).contains(&s) {
                return Err(ConfigError::InvalidParameter {
                    name: "background_removal_strength".to_string(),
                    value: s.to_string(),
                    reason: "Must be between 0.0 and 1.0".to_string(),
                });
            }
            self.background_removal_strength = ConfigValue::Set(s);
        }

        if let Some(a) = algorithm {
            self.background_removal_algorithm = ConfigValue::Set(a);
        }

        Ok(self)
    }

    /// Build the final TraceLowConfig with validation
    pub fn build(self) -> ConfigResult<(TraceLowConfig, Option<HandDrawnConfig>)> {
        // Validate configuration consistency
        self.validate()?;

        // Build the base config
        let mut config = TraceLowConfig::default();

        // Apply core settings
        config.backend = self.backend.unwrap_or(TraceBackend::Edge);
        config.detail = self.detail.unwrap_or(0.4);
        config.stroke_px_at_1080p = self.stroke_width.unwrap_or(1.5);
        config.enable_multipass = self.multipass.unwrap_or(false);
        config.pass_count = self.pass_count.unwrap_or(1);
        config.enable_reverse_pass = self.reverse_pass.unwrap_or(false);
        config.enable_diagonal_pass = self.diagonal_pass.unwrap_or(false);
        config.noise_filtering = self.noise_filtering.unwrap_or(false);
        config.svg_precision = self.svg_precision.unwrap_or(2);
        config.max_processing_time_ms = self.max_processing_time_ms.unwrap_or(60000);
        config.max_image_size = self.max_image_size.unwrap_or(4096);

        // Apply background removal settings
        config.enable_background_removal = self.background_removal.unwrap_or(false);
        config.background_removal_strength = self.background_removal_strength.unwrap_or(0.5);
        config.background_removal_algorithm = self
            .background_removal_algorithm
            .unwrap_or(BackgroundRemovalAlgorithm::Auto);
        config.background_removal_threshold = self.background_removal_threshold;

        // Apply backend-specific settings based on the backend
        match config.backend {
            TraceBackend::Edge | TraceBackend::Centerline => {
                config.enable_etf_fdog = self.backend_settings.etf_fdog.unwrap_or(false);
                config.enable_flow_tracing = self.backend_settings.flow_tracing.unwrap_or(false);
                config.enable_bezier_fitting =
                    self.backend_settings.bezier_fitting.unwrap_or(false);

                if config.backend == TraceBackend::Centerline {
                    config.enable_adaptive_threshold =
                        self.backend_settings.adaptive_threshold.unwrap_or(true);
                    config.adaptive_threshold_window_size =
                        self.backend_settings.window_size.unwrap_or(25);
                    config.adaptive_threshold_k =
                        self.backend_settings.sensitivity_k.unwrap_or(0.3);
                    config.enable_width_modulation =
                        self.backend_settings.width_modulation.unwrap_or(true);
                    config.min_branch_length =
                        self.backend_settings.min_branch_length.unwrap_or(8.0);
                    config.douglas_peucker_epsilon =
                        self.backend_settings.douglas_peucker_epsilon.unwrap_or(1.0);
                }

                // Line color settings
                config.line_preserve_colors =
                    self.backend_settings.line_preserve_colors.unwrap_or(false);
                config.line_color_accuracy =
                    self.backend_settings.line_color_accuracy.unwrap_or(0.5);
                config.max_colors_per_path = self.backend_settings.max_colors_per_path.unwrap_or(3);
                config.color_tolerance = self.backend_settings.color_tolerance.unwrap_or(0.2);
            }
            TraceBackend::Dots => {
                config.dot_density_threshold = self.backend_settings.dot_density.unwrap_or(0.2);
                config.dot_min_radius = self.backend_settings.dot_min_radius.unwrap_or(0.5);
                config.dot_max_radius = self.backend_settings.dot_max_radius.unwrap_or(3.0);
                config.dot_adaptive_sizing =
                    self.backend_settings.dot_adaptive_sizing.unwrap_or(true);
                config.dot_preserve_colors =
                    self.backend_settings.dot_preserve_colors.unwrap_or(false);
                config.dot_gradient_based_sizing =
                    self.backend_settings.dot_gradient_sizing.unwrap_or(false);
            }
            TraceBackend::Superpixel => {
                config.num_superpixels = self.backend_settings.num_superpixels.unwrap_or(200);
                config.superpixel_compactness = self.backend_settings.compactness.unwrap_or(10.0);
                config.superpixel_slic_iterations =
                    self.backend_settings.slic_iterations.unwrap_or(10);
                config.superpixel_initialization_pattern = self
                    .backend_settings
                    .superpixel_pattern
                    .unwrap_or(SuperpixelInitPattern::Poisson);
                config.superpixel_fill_regions =
                    self.backend_settings.fill_regions.unwrap_or(false);
                config.superpixel_stroke_regions =
                    self.backend_settings.stroke_regions.unwrap_or(true);
                config.superpixel_simplify_boundaries =
                    self.backend_settings.simplify_boundaries.unwrap_or(true);
                config.superpixel_boundary_epsilon =
                    self.backend_settings.boundary_epsilon.unwrap_or(1.5);
                config.superpixel_preserve_colors = self
                    .backend_settings
                    .superpixel_preserve_colors
                    .unwrap_or(false);
            }
        }

        // Build hand-drawn config if specified
        let hand_drawn_config = self.build_hand_drawn_config()?;

        Ok((config, hand_drawn_config))
    }

    /// Validate the configuration for consistency
    fn validate(&self) -> ConfigResult<()> {
        // Check multipass consistency
        let multipass = self.multipass.unwrap_or(false);
        let pass_count = self.pass_count.unwrap_or(1);

        if multipass && pass_count <= 1 {
            return Err(ConfigError::ValidationFailed(
                "Multipass enabled but pass_count is 1".to_string(),
            ));
        }

        if pass_count > 1 && !multipass {
            return Err(ConfigError::ValidationFailed(
                "Pass count > 1 but multipass disabled".to_string(),
            ));
        }

        // Check ETF/FDoG dependencies
        let etf = self.backend_settings.etf_fdog.unwrap_or(false);
        let flow = self.backend_settings.flow_tracing.unwrap_or(false);
        let bezier = self.backend_settings.bezier_fitting.unwrap_or(false);

        if flow && !etf {
            return Err(ConfigError::ValidationFailed(
                "Flow tracing requires ETF/FDoG to be enabled".to_string(),
            ));
        }

        if bezier && !flow {
            return Err(ConfigError::ValidationFailed(
                "Bezier fitting requires flow tracing to be enabled".to_string(),
            ));
        }

        // Check hand-drawn custom overrides
        let has_custom = self.custom_tremor.is_some()
            || self.custom_variable_weights.is_some()
            || self.custom_tapering.is_some();
        let has_preset =
            self.hand_drawn_preset.is_some() && self.hand_drawn_preset.as_deref() != Some("none");

        if has_custom && !has_preset {
            return Err(ConfigError::ValidationFailed(
                "Custom hand-drawn parameters require a preset to be specified".to_string(),
            ));
        }

        Ok(())
    }

    /// Build hand-drawn configuration if specified
    fn build_hand_drawn_config(&self) -> ConfigResult<Option<HandDrawnConfig>> {
        let preset = match self.hand_drawn_preset.as_deref() {
            None | Some("none") => return Ok(None),
            Some("subtle") => HandDrawnPresets::subtle(),
            Some("medium") => HandDrawnPresets::medium(),
            Some("strong") => HandDrawnPresets::strong(),
            Some("sketchy") => HandDrawnPresets::sketchy(),
            Some(other) => {
                return Err(ConfigError::InvalidParameter {
                    name: "hand_drawn_preset".to_string(),
                    value: other.to_string(),
                    reason: "Invalid preset name".to_string(),
                });
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
        if let Some(tapering) = self.custom_tapering {
            config.tapering = tapering;
        }

        Ok(Some(config))
    }

    // Preset configurations

    pub fn preset_line_art() -> Self {
        Self::new()
            .with_backend(TraceBackend::Edge)
            .with_detail(0.4)
            .unwrap()
            .with_stroke_width(1.2)
            .unwrap()
            .with_multipass(false, None)
            .unwrap()
            .with_noise_filtering(false)
    }

    pub fn preset_sketch() -> Self {
        Self::new()
            .with_backend(TraceBackend::Edge)
            .with_detail(0.35)
            .unwrap()
            .with_stroke_width(1.5)
            .unwrap()
            .with_multipass(true, Some(2))
            .unwrap()
            .with_noise_filtering(true)
            .with_hand_drawn_preset("medium")
            .unwrap()
    }

    pub fn preset_technical() -> Self {
        Self::new()
            .with_backend(TraceBackend::Centerline)
            .with_detail(0.6)
            .unwrap()
            .with_stroke_width(1.0)
            .unwrap()
            .with_multipass(true, Some(3))
            .unwrap()
            .with_directional_passes(true, true)
            .with_centerline_settings(true, 25, 0.3)
            .unwrap()
    }

    pub fn preset_stippling() -> Self {
        Self::new()
            .with_backend(TraceBackend::Dots)
            .with_detail(0.3)
            .unwrap()
            .with_dots_settings(0.05, 0.3, 1.0, true, false)
            .unwrap()
    }

    pub fn preset_pointillism() -> Self {
        Self::new()
            .with_backend(TraceBackend::Dots)
            .with_detail(0.4)
            .unwrap()
            .with_dots_settings(0.15, 1.0, 4.0, true, true)
            .unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_immutable_config_basic() {
        let config = VectorizerConfig::new()
            .with_backend(TraceBackend::Edge)
            .with_detail(0.5)
            .unwrap()
            .with_stroke_width(2.0)
            .unwrap();

        let (trace_config, _) = config.build().unwrap();
        assert_eq!(trace_config.backend, TraceBackend::Edge);
        assert_eq!(trace_config.detail, 0.5);
        assert_eq!(trace_config.stroke_px_at_1080p, 2.0);
    }

    #[test]
    fn test_validation_errors() {
        // Invalid detail
        let result = VectorizerConfig::new().with_detail(1.5);
        assert!(result.is_err());

        // Invalid stroke width
        let result = VectorizerConfig::new().with_stroke_width(-1.0);
        assert!(result.is_err());

        // Invalid multipass configuration
        let config = VectorizerConfig::new()
            .with_multipass(true, Some(1))
            .unwrap();
        let result = config.build();
        assert!(result.is_err());
    }

    #[test]
    fn test_backend_specific_settings() {
        // Edge backend with ETF/FDoG
        let config = VectorizerConfig::new()
            .with_backend(TraceBackend::Edge)
            .with_edge_settings(true, true, false)
            .unwrap();

        let (trace_config, _) = config.build().unwrap();
        assert!(trace_config.enable_etf_fdog);
        assert!(trace_config.enable_flow_tracing);
        assert!(!trace_config.enable_bezier_fitting);

        // Invalid dependency
        let result = VectorizerConfig::new().with_edge_settings(false, true, false);
        assert!(result.is_err());
    }

    #[test]
    fn test_presets() {
        let config = VectorizerConfig::preset_sketch();
        let (trace_config, hand_drawn) = config.build().unwrap();

        assert_eq!(trace_config.backend, TraceBackend::Edge);
        assert!(trace_config.enable_multipass);
        assert!(hand_drawn.is_some());
    }
}
