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
    custom_tapering: Option<f32>,
    // Superpixel-specific configuration
    num_superpixels: Option<u32>,
    compactness: Option<f32>,
    slic_iterations: Option<u32>,
    fill_regions: Option<bool>,
    stroke_regions: Option<bool>,
    simplify_boundaries: Option<bool>,
    boundary_epsilon: Option<f32>,
    superpixel_preserve_colors: Option<bool>,
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
            custom_tapering: None,
            // Initialize superpixel fields
            num_superpixels: None,
            compactness: None,
            slic_iterations: None,
            fill_regions: None,
            stroke_regions: None,
            simplify_boundaries: None,
            boundary_epsilon: None,
            superpixel_preserve_colors: None,
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

    /// Set number of processing passes (1-10)
    pub fn pass_count(mut self, count: u32) -> ConfigBuilderResult<Self> {
        if !(1..=10).contains(&count) {
            return Err(ConfigBuilderError::ValidationFailed(format!(
                "pass_count must be between 1 and 10, got {}",
                count
            )));
        }
        self.config.pass_count = count;
        // Automatically enable multipass if more than 1 pass
        if count > 1 {
            self.config.enable_multipass = true;
        }
        Ok(self)
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

    /// Enable or disable color preservation in line tracing (edge/centerline backends)
    pub fn line_preserve_colors(mut self, enabled: bool) -> Self {
        self.config.line_preserve_colors = enabled;
        self
    }

    /// Set color sampling method for line tracing
    pub fn line_color_sampling(mut self, method: crate::algorithms::ColorSamplingMethod) -> Self {
        self.config.line_color_sampling = method;
        self
    }

    /// Set color accuracy for line tracing (0.0 = fast, 1.0 = accurate)
    pub fn line_color_accuracy(mut self, accuracy: f32) -> ConfigBuilderResult<Self> {
        if !(0.0..=1.0).contains(&accuracy) {
            return Err(ConfigBuilderError::ValidationFailed(format!(
                "line_color_accuracy must be 0.0-1.0, got {}",
                accuracy
            )));
        }
        self.config.line_color_accuracy = accuracy;
        Ok(self)
    }

    /// Set maximum colors per path segment for line tracing
    pub fn max_colors_per_path(mut self, max_colors: u32) -> ConfigBuilderResult<Self> {
        if !(1..=10).contains(&max_colors) {
            return Err(ConfigBuilderError::ValidationFailed(format!(
                "max_colors_per_path must be 1-10, got {}",
                max_colors
            )));
        }
        self.config.max_colors_per_path = max_colors;
        Ok(self)
    }

    /// Set color tolerance for clustering (0.0-1.0)
    pub fn color_tolerance(mut self, tolerance: f32) -> ConfigBuilderResult<Self> {
        if !(0.0..=1.0).contains(&tolerance) {
            return Err(ConfigBuilderError::ValidationFailed(format!(
                "color_tolerance must be 0.0-1.0, got {}",
                tolerance
            )));
        }
        self.config.color_tolerance = tolerance;
        Ok(self)
    }

    /// Enable or disable color palette reduction
    pub fn enable_palette_reduction(mut self, enable: bool) -> Self {
        self.config.enable_palette_reduction = enable;
        self
    }

    /// Set target number of colors for palette reduction (2-50)
    pub fn palette_target_colors(mut self, target_colors: u32) -> ConfigBuilderResult<Self> {
        if !(2..=50).contains(&target_colors) {
            return Err(ConfigBuilderError::ValidationFailed(format!(
                "palette_target_colors must be 2-50, got {}",
                target_colors
            )));
        }
        self.config.palette_target_colors = target_colors;
        Ok(self)
    }

    /// Enable or disable adaptive dot sizing
    pub fn adaptive_sizing(mut self, enabled: bool) -> Self {
        self.config.dot_adaptive_sizing = enabled;
        self
    }

    /// Enable or disable Poisson disk sampling for natural dot distribution
    pub fn set_poisson_disk_sampling(mut self, enabled: bool) -> Self {
        self.config.dot_poisson_disk_sampling = enabled;
        self
    }

    /// Enable or disable gradient-based sizing for dot scaling based on local image gradients
    pub fn set_gradient_based_sizing(mut self, enabled: bool) -> Self {
        self.config.dot_gradient_based_sizing = enabled;
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

    /// Set custom tapering strength (overrides preset)
    pub fn custom_tapering(mut self, tapering: f32) -> ConfigBuilderResult<Self> {
        self.validate_unit_range(tapering, "tapering")?;
        self.custom_tapering = Some(tapering);
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

    // Centerline-specific parameters

    /// Enable or disable adaptive thresholding for centerline backend
    pub fn enable_adaptive_threshold(mut self, enabled: bool) -> Self {
        self.config.enable_adaptive_threshold = enabled;
        self
    }

    /// Set window size for adaptive thresholding (15-50 pixels)
    pub fn window_size(mut self, size: u32) -> ConfigBuilderResult<Self> {
        self.validate_window_size(size)?;
        self.config.adaptive_threshold_window_size = size;
        Ok(self)
    }

    /// Set sensitivity parameter k for Sauvola thresholding (0.1-1.0)
    pub fn sensitivity_k(mut self, k: f32) -> ConfigBuilderResult<Self> {
        self.validate_sensitivity_k(k)?;
        self.config.adaptive_threshold_k = k;
        Ok(self)
    }

    /// Enable or disable width modulation for centerline SVG strokes
    pub fn enable_width_modulation(mut self, enabled: bool) -> Self {
        self.config.enable_width_modulation = enabled;
        self
    }

    /// Enable or disable Distance Transform-based centerline algorithm (default: false)
    /// When enabled, uses the high-performance Distance Transform algorithm instead of traditional skeleton thinning
    /// This provides 5-10x performance improvement with better quality results
    pub fn enable_distance_transform_centerline(mut self, enabled: bool) -> Self {
        self.config.enable_distance_transform_centerline = enabled;
        self
    }

    /// Set minimum branch length for centerline tracing (4-24 pixels)
    pub fn min_branch_length(mut self, length: f32) -> ConfigBuilderResult<Self> {
        self.validate_min_branch_length(length)?;
        self.config.min_branch_length = length;
        Ok(self)
    }

    /// Set Douglas-Peucker epsilon for path simplification (0.5-3.0)
    pub fn douglas_peucker_epsilon(mut self, epsilon: f32) -> ConfigBuilderResult<Self> {
        self.validate_douglas_peucker_epsilon(epsilon)?;
        self.config.douglas_peucker_epsilon = epsilon;
        Ok(self)
    }

    // Noise filtering parameters

    /// Set spatial sigma for bilateral noise filtering (0.5-5.0)
    /// Higher values provide more spatial smoothing but may blur fine details
    pub fn noise_filter_spatial_sigma(mut self, sigma: f32) -> Self {
        self.config.noise_filter_spatial_sigma = sigma.clamp(0.5, 5.0);
        self
    }

    /// Set range sigma for bilateral noise filtering (10.0-100.0)
    /// Higher values preserve fewer edges (less selective filtering)
    pub fn noise_filter_range_sigma(mut self, sigma: f32) -> Self {
        self.config.noise_filter_range_sigma = sigma.clamp(10.0, 100.0);
        self
    }

    // Superpixel-specific parameters

    /// Set number of superpixels to generate (20-1000)
    pub fn num_superpixels(mut self, num: u32) -> ConfigBuilderResult<Self> {
        self.validate_num_superpixels(num)?;
        self.num_superpixels = Some(num);
        Ok(self)
    }

    /// Set SLIC compactness parameter (1.0-50.0)
    /// Higher values create more regular shapes, lower values follow color similarity more closely
    pub fn compactness(mut self, compactness: f32) -> ConfigBuilderResult<Self> {
        self.validate_compactness(compactness)?;
        self.compactness = Some(compactness);
        Ok(self)
    }

    /// Set SLIC iterations for convergence (5-15)
    pub fn slic_iterations(mut self, iterations: u32) -> ConfigBuilderResult<Self> {
        self.validate_slic_iterations(iterations)?;
        self.slic_iterations = Some(iterations);
        Ok(self)
    }

    /// Enable or disable filled superpixel regions
    pub fn fill_regions(mut self, enabled: bool) -> Self {
        self.fill_regions = Some(enabled);
        self
    }

    /// Enable or disable superpixel region boundary strokes
    pub fn stroke_regions(mut self, enabled: bool) -> Self {
        self.stroke_regions = Some(enabled);
        self
    }

    /// Enable or disable color preservation in superpixel regions
    pub fn superpixel_preserve_colors(mut self, enabled: bool) -> Self {
        self.superpixel_preserve_colors = Some(enabled);
        self
    }

    /// Enable or disable boundary path simplification
    pub fn simplify_boundaries(mut self, enabled: bool) -> Self {
        self.simplify_boundaries = Some(enabled);
        self
    }

    /// Set boundary simplification tolerance (0.5-3.0)
    pub fn boundary_epsilon(mut self, epsilon: f32) -> ConfigBuilderResult<Self> {
        self.validate_boundary_epsilon(epsilon)?;
        self.boundary_epsilon = Some(epsilon);
        Ok(self)
    }

    // Safety and optimization parameters

    /// Set maximum image size before automatic resizing (512-8192 pixels)
    pub fn max_image_size(mut self, size: u32) -> ConfigBuilderResult<Self> {
        self.validate_max_image_size(size)?;
        self.config.max_image_size = size;
        Ok(self)
    }

    /// Set SVG coordinate precision in decimal places (0-4)
    pub fn svg_precision(mut self, precision: u8) -> ConfigBuilderResult<Self> {
        self.validate_svg_precision(precision)?;
        self.config.svg_precision = precision;
        Ok(self)
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
            .enable_adaptive_threshold(true)
            .window_size(25)
            .unwrap()
            .sensitivity_k(0.3)
            .unwrap()
            .min_branch_length(8.0)
            .unwrap()
            .douglas_peucker_epsilon(1.0)
            .unwrap()
            .enable_width_modulation(false)
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
            .set_poisson_disk_sampling(true)
            .set_gradient_based_sizing(true)
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
            .set_poisson_disk_sampling(true)
            .set_gradient_based_sizing(true)
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

        // Apply superpixel configuration if specified
        let mut config = self.config;
        if let Some(num) = self.num_superpixels {
            config.num_superpixels = num;
        }
        if let Some(compactness) = self.compactness {
            config.superpixel_compactness = compactness;
        }
        if let Some(iterations) = self.slic_iterations {
            config.superpixel_slic_iterations = iterations;
        }
        if let Some(fill) = self.fill_regions {
            config.superpixel_fill_regions = fill;
        }
        if let Some(stroke) = self.stroke_regions {
            config.superpixel_stroke_regions = stroke;
        }
        if let Some(simplify) = self.simplify_boundaries {
            config.superpixel_simplify_boundaries = simplify;
        }
        if let Some(epsilon) = self.boundary_epsilon {
            config.superpixel_boundary_epsilon = epsilon;
        }
        if let Some(preserve_colors) = self.superpixel_preserve_colors {
            config.superpixel_preserve_colors = preserve_colors;
        }

        Ok(config)
    }

    /// Build TraceLowConfig with optional hand-drawn configuration
    pub fn build_with_hand_drawn(
        self,
    ) -> ConfigBuilderResult<(TraceLowConfig, Option<HandDrawnConfig>)> {
        // Validate the complete configuration first
        self.validate_complete_config()?;

        // Build hand-drawn config before consuming self
        let hand_drawn_config = self.build_hand_drawn_config()?;

        // Apply superpixel configuration if specified
        let mut config = self.config;
        if let Some(num) = self.num_superpixels {
            config.num_superpixels = num;
        }
        if let Some(compactness) = self.compactness {
            config.superpixel_compactness = compactness;
        }
        if let Some(iterations) = self.slic_iterations {
            config.superpixel_slic_iterations = iterations;
        }
        if let Some(fill) = self.fill_regions {
            config.superpixel_fill_regions = fill;
        }
        if let Some(stroke) = self.stroke_regions {
            config.superpixel_stroke_regions = stroke;
        }
        if let Some(simplify) = self.simplify_boundaries {
            config.superpixel_simplify_boundaries = simplify;
        }
        if let Some(epsilon) = self.boundary_epsilon {
            config.superpixel_boundary_epsilon = epsilon;
        }
        if let Some(preserve_colors) = self.superpixel_preserve_colors {
            config.superpixel_preserve_colors = preserve_colors;
        }

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
                recommendations.insert(
                    "num_superpixels",
                    "50-200 for poster style, 200-500 for detailed".to_string(),
                );
                recommendations.insert(
                    "compactness",
                    "5-15 for organic shapes, 20-40 for geometric".to_string(),
                );
                recommendations.insert("fill_regions", "true for poster style".to_string());
                recommendations.insert("stroke_regions", "true for defined boundaries".to_string());
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

    fn validate_window_size(&self, size: u32) -> ConfigBuilderResult<()> {
        if !(15..=50).contains(&size) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Window size must be between 15 and 50 pixels, got: {size}"
            )));
        }
        Ok(())
    }

    fn validate_sensitivity_k(&self, k: f32) -> ConfigBuilderResult<()> {
        if !(0.1..=1.0).contains(&k) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Sensitivity k must be between 0.1 and 1.0, got: {k}"
            )));
        }
        Ok(())
    }

    fn validate_min_branch_length(&self, length: f32) -> ConfigBuilderResult<()> {
        if !(4.0..=24.0).contains(&length) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Minimum branch length must be between 4.0 and 24.0 pixels, got: {length}"
            )));
        }
        Ok(())
    }

    fn validate_douglas_peucker_epsilon(&self, epsilon: f32) -> ConfigBuilderResult<()> {
        if !(0.5..=3.0).contains(&epsilon) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Douglas-Peucker epsilon must be between 0.5 and 3.0, got: {epsilon}"
            )));
        }
        Ok(())
    }

    // Superpixel validation methods

    fn validate_num_superpixels(&self, num: u32) -> ConfigBuilderResult<()> {
        if !(20..=1000).contains(&num) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Number of superpixels must be between 20 and 1000, got: {num}"
            )));
        }
        Ok(())
    }

    fn validate_compactness(&self, compactness: f32) -> ConfigBuilderResult<()> {
        if !(1.0..=50.0).contains(&compactness) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Superpixel compactness must be between 1.0 and 50.0, got: {compactness}"
            )));
        }
        Ok(())
    }

    fn validate_slic_iterations(&self, iterations: u32) -> ConfigBuilderResult<()> {
        if !(5..=15).contains(&iterations) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "SLIC iterations must be between 5 and 15, got: {iterations}"
            )));
        }
        Ok(())
    }

    fn validate_boundary_epsilon(&self, epsilon: f32) -> ConfigBuilderResult<()> {
        if !(0.5..=3.0).contains(&epsilon) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Boundary epsilon must be between 0.5 and 3.0, got: {epsilon}"
            )));
        }
        Ok(())
    }

    fn validate_max_image_size(&self, size: u32) -> ConfigBuilderResult<()> {
        if !(512..=8192).contains(&size) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Maximum image size must be between 512 and 8192 pixels, got: {size}"
            )));
        }
        Ok(())
    }

    fn validate_svg_precision(&self, precision: u8) -> ConfigBuilderResult<()> {
        if precision > 4 {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "SVG precision must be between 0 and 4 decimal places, got: {precision}"
            )));
        }
        Ok(())
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
        if (self.custom_tremor.is_some()
            || self.custom_variable_weights.is_some()
            || self.custom_tapering.is_some())
            && matches!(self.hand_drawn_preset.as_deref(), None | Some("none"))
        {
            return Err(ConfigBuilderError::ValidationFailed(
                "Hand-drawn preset must be specified when using custom tremor, variable weights, or tapering"
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
        if let Some(tapering) = self.custom_tapering {
            config.tapering = tapering;
        }

        Ok(Some(config))
    }

    /// Enable/disable background removal preprocessing
    pub fn background_removal(mut self, enabled: bool) -> Self {
        self.config.enable_background_removal = enabled;
        self
    }

    /// Set background removal strength (0.0-1.0)
    pub fn background_removal_strength(mut self, strength: f32) -> ConfigBuilderResult<Self> {
        if !(0.0..=1.0).contains(&strength) {
            return Err(ConfigBuilderError::InvalidParameter(format!(
                "Background removal strength must be between 0.0 and 1.0, got: {strength}"
            )));
        }
        self.config.background_removal_strength = strength;
        Ok(self)
    }

    /// Set background removal algorithm
    pub fn background_removal_algorithm(mut self, algorithm: crate::algorithms::tracing::trace_low::BackgroundRemovalAlgorithm) -> Self {
        self.config.background_removal_algorithm = algorithm;
        self
    }

    /// Set background removal algorithm by string name (otsu, adaptive, auto)
    pub fn background_removal_algorithm_by_name(mut self, algorithm: &str) -> ConfigBuilderResult<Self> {
        use crate::algorithms::tracing::trace_low::BackgroundRemovalAlgorithm;
        let algo = match algorithm.to_lowercase().as_str() {
            "otsu" => BackgroundRemovalAlgorithm::Otsu,
            "adaptive" => BackgroundRemovalAlgorithm::Adaptive,
            "auto" => BackgroundRemovalAlgorithm::Auto,
            _ => return Err(ConfigBuilderError::InvalidParameter(format!(
                "Invalid background removal algorithm: '{}'. Valid options: otsu, adaptive, auto", algorithm
            ))),
        };
        self.config.background_removal_algorithm = algo;
        Ok(self)
    }

    /// Set background removal threshold override (0-255)
    pub fn background_removal_threshold(mut self, threshold: Option<u8>) -> Self {
        self.config.background_removal_threshold = threshold;
        self
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
            .custom_tapering(0.6)
            .unwrap()
            .build_with_hand_drawn()
            .unwrap();

        let hd = hand_drawn.unwrap();
        assert_eq!(hd.tremor_strength, 0.3);
        assert_eq!(hd.variable_weights, 0.8);
        assert_eq!(hd.tapering, 0.6);
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

        // Custom tapering without preset
        let result = ConfigBuilder::new().custom_tapering(0.5).unwrap().build();
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
    fn test_centerline_parameters() {
        // Test enable_adaptive_threshold
        let config = ConfigBuilder::new()
            .enable_adaptive_threshold(false)
            .build()
            .unwrap();
        assert!(!config.enable_adaptive_threshold);

        // Test window_size validation
        assert!(ConfigBuilder::new().window_size(25).is_ok());
        assert!(ConfigBuilder::new().window_size(15).is_ok());
        assert!(ConfigBuilder::new().window_size(50).is_ok());
        assert!(ConfigBuilder::new().window_size(14).is_err()); // Too small
        assert!(ConfigBuilder::new().window_size(51).is_err()); // Too large

        // Test sensitivity_k validation
        assert!(ConfigBuilder::new().sensitivity_k(0.5).is_ok());
        assert!(ConfigBuilder::new().sensitivity_k(0.1).is_ok());
        assert!(ConfigBuilder::new().sensitivity_k(1.0).is_ok());
        assert!(ConfigBuilder::new().sensitivity_k(0.09).is_err()); // Too small
        assert!(ConfigBuilder::new().sensitivity_k(1.1).is_err()); // Too large

        // Test min_branch_length validation
        assert!(ConfigBuilder::new().min_branch_length(12.0).is_ok());
        assert!(ConfigBuilder::new().min_branch_length(4.0).is_ok());
        assert!(ConfigBuilder::new().min_branch_length(24.0).is_ok());
        assert!(ConfigBuilder::new().min_branch_length(3.9).is_err()); // Too small
        assert!(ConfigBuilder::new().min_branch_length(24.1).is_err()); // Too large

        // Test douglas_peucker_epsilon validation
        assert!(ConfigBuilder::new().douglas_peucker_epsilon(1.5).is_ok());
        assert!(ConfigBuilder::new().douglas_peucker_epsilon(0.5).is_ok());
        assert!(ConfigBuilder::new().douglas_peucker_epsilon(3.0).is_ok());
        assert!(ConfigBuilder::new().douglas_peucker_epsilon(0.4).is_err()); // Too small
        assert!(ConfigBuilder::new().douglas_peucker_epsilon(3.1).is_err()); // Too large

        // Test enable_width_modulation
        let config = ConfigBuilder::new()
            .enable_width_modulation(true)
            .build()
            .unwrap();
        assert!(config.enable_width_modulation);
    }

    #[test]
    fn test_centerline_builder_chain() {
        let config = ConfigBuilder::new()
            .backend(TraceBackend::Centerline)
            .enable_adaptive_threshold(true)
            .window_size(31)
            .unwrap()
            .sensitivity_k(0.4)
            .unwrap()
            .min_branch_length(10.0)
            .unwrap()
            .douglas_peucker_epsilon(1.2)
            .unwrap()
            .enable_width_modulation(false)
            .build()
            .unwrap();

        assert_eq!(config.backend, TraceBackend::Centerline);
        assert!(config.enable_adaptive_threshold);
        assert_eq!(config.adaptive_threshold_window_size, 31);
        assert_eq!(config.adaptive_threshold_k, 0.4);
        assert_eq!(config.min_branch_length, 10.0);
        assert_eq!(config.douglas_peucker_epsilon, 1.2);
        assert!(!config.enable_width_modulation);
    }

    #[test]
    fn test_technical_preset_centerline_parameters() {
        let config = ConfigBuilder::for_technical().build().unwrap();

        assert_eq!(config.backend, TraceBackend::Centerline);
        assert!(config.enable_adaptive_threshold);
        assert_eq!(config.adaptive_threshold_window_size, 25);
        assert_eq!(config.adaptive_threshold_k, 0.3);
        assert_eq!(config.min_branch_length, 8.0);
        assert_eq!(config.douglas_peucker_epsilon, 1.0);
        assert!(!config.enable_width_modulation);
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

    #[test]
    fn test_superpixel_parameters() {
        // Test valid superpixel parameters
        let config = ConfigBuilder::new()
            .backend(TraceBackend::Superpixel)
            .num_superpixels(200)
            .unwrap()
            .compactness(15.0)
            .unwrap()
            .slic_iterations(8)
            .unwrap()
            .fill_regions(true)
            .stroke_regions(false)
            .simplify_boundaries(true)
            .boundary_epsilon(1.5)
            .unwrap()
            .build()
            .unwrap();

        assert_eq!(config.backend, TraceBackend::Superpixel);
        assert_eq!(config.num_superpixels, 200);
        assert_eq!(config.superpixel_compactness, 15.0);
        assert_eq!(config.superpixel_slic_iterations, 8);
        assert!(config.superpixel_fill_regions);
        assert!(!config.superpixel_stroke_regions);
        assert!(config.superpixel_simplify_boundaries);
        assert_eq!(config.superpixel_boundary_epsilon, 1.5);
    }

    #[test]
    fn test_superpixel_validation_errors() {
        // Test invalid num_superpixels
        assert!(ConfigBuilder::new().num_superpixels(15).is_err()); // Too low
        assert!(ConfigBuilder::new().num_superpixels(1200).is_err()); // Too high

        // Test invalid compactness
        assert!(ConfigBuilder::new().compactness(0.5).is_err()); // Too low
        assert!(ConfigBuilder::new().compactness(60.0).is_err()); // Too high

        // Test invalid slic_iterations
        assert!(ConfigBuilder::new().slic_iterations(3).is_err()); // Too low
        assert!(ConfigBuilder::new().slic_iterations(20).is_err()); // Too high

        // Test invalid boundary_epsilon
        assert!(ConfigBuilder::new().boundary_epsilon(0.3).is_err()); // Too low
        assert!(ConfigBuilder::new().boundary_epsilon(4.0).is_err()); // Too high
    }

    #[test]
    fn test_superpixel_recommendations() {
        let recommendations = ConfigBuilder::get_backend_recommendations(TraceBackend::Superpixel);
        assert!(recommendations.contains_key("num_superpixels"));
        assert!(recommendations.contains_key("compactness"));
        assert!(recommendations.contains_key("fill_regions"));
        assert!(recommendations.contains_key("stroke_regions"));
    }
}
