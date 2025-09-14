//! WASM-specific configuration adapter
//!
//! This module provides a clean interface between the WASM bindings and the
//! immutable configuration system, eliminating the recursive aliasing issues.

use vectorize_core::config_immutable::{VectorizerConfig, ConfigError};
use vectorize_core::algorithms::{TraceBackend, TraceLowConfig, HandDrawnConfig};
use vectorize_core::algorithms::tracing::trace_low::BackgroundRemovalAlgorithm;
use wasm_bindgen::prelude::*;

/// WASM configuration state manager
///
/// This struct manages configuration state for the WASM interface in a clean,
/// immutable way without the recursive aliasing issues of the mutable builder.
#[wasm_bindgen]
pub struct WasmConfigManager {
    config: VectorizerConfig,
    backend: TraceBackend,
}

#[wasm_bindgen]
impl WasmConfigManager {
    /// Create a new configuration manager
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        log::info!("Creating new WasmConfigManager with immutable configuration");
        Self {
            config: VectorizerConfig::new(),
            backend: TraceBackend::Edge,
        }
    }

    /// Set backend
    #[wasm_bindgen]
    pub fn set_backend(&mut self, backend: &str) -> Result<(), JsValue> {
        let backend_enum = match backend.to_lowercase().as_str() {
            "edge" => TraceBackend::Edge,
            "centerline" => TraceBackend::Centerline,
            "superpixel" => TraceBackend::Superpixel,
            "dots" => TraceBackend::Dots,
            _ => return Err(JsValue::from_str(&format!("Unknown backend: {}", backend))),
        };

        self.backend = backend_enum;
        self.config = self.config.clone().with_backend(backend_enum);
        log::info!("Backend set to: {:?}", backend_enum);
        Ok(())
    }

    /// Set detail level
    #[wasm_bindgen]
    pub fn set_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_detail(detail)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Detail set to: {}", detail);
        Ok(())
    }

    /// Set stroke width
    #[wasm_bindgen]
    pub fn set_stroke_width(&mut self, width: f32) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_stroke_width(width)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Stroke width set to: {}", width);
        Ok(())
    }

    /// Set multipass settings
    #[wasm_bindgen]
    pub fn set_multipass(&mut self, enabled: bool, pass_count: Option<u32>) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_multipass(enabled, pass_count)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Multipass set to: {} with count: {:?}", enabled, pass_count);
        Ok(())
    }

    /// Set directional passes
    #[wasm_bindgen]
    pub fn set_directional_passes(&mut self, reverse: bool, diagonal: bool) {
        self.config = self.config.clone().with_directional_passes(reverse, diagonal);
        log::info!("Directional passes - reverse: {}, diagonal: {}", reverse, diagonal);
    }

    /// Set noise filtering
    #[wasm_bindgen]
    pub fn set_noise_filtering(&mut self, enabled: bool) {
        self.config = self.config.clone().with_noise_filtering(enabled);
        log::info!("Noise filtering set to: {}", enabled);
    }

    /// Set hand-drawn preset
    #[wasm_bindgen]
    pub fn set_hand_drawn_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_hand_drawn_preset(preset)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Hand-drawn preset set to: {}", preset);
        Ok(())
    }

    /// Set custom hand-drawn parameters
    #[wasm_bindgen]
    pub fn set_custom_hand_drawn(
        &mut self,
        tremor: Option<f32>,
        variable_weights: Option<f32>,
        tapering: Option<f32>
    ) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_custom_hand_drawn(tremor, variable_weights, tapering)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Custom hand-drawn parameters set");
        Ok(())
    }

    /// Set background removal
    #[wasm_bindgen]
    pub fn set_background_removal(
        &mut self,
        enabled: bool,
        strength: Option<f32>,
        algorithm: Option<String>
    ) -> Result<(), JsValue> {
        let algo = algorithm.and_then(|a| match a.to_lowercase().as_str() {
            "otsu" => Some(BackgroundRemovalAlgorithm::Otsu),
            "adaptive" => Some(BackgroundRemovalAlgorithm::Adaptive),
            "auto" => Some(BackgroundRemovalAlgorithm::Auto),
            _ => None,
        });

        self.config = self.config.clone()
            .with_background_removal(enabled, strength, algo)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Background removal configured");
        Ok(())
    }

    /// Backend-specific configuration methods

    #[wasm_bindgen]
    pub fn set_edge_settings(
        &mut self,
        etf_fdog: bool,
        flow_tracing: bool,
        bezier_fitting: bool
    ) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_edge_settings(etf_fdog, flow_tracing, bezier_fitting)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Edge settings configured");
        Ok(())
    }

    #[wasm_bindgen]
    pub fn set_centerline_settings(
        &mut self,
        adaptive_threshold: bool,
        window_size: u32,
        sensitivity_k: f32
    ) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_centerline_settings(adaptive_threshold, window_size, sensitivity_k)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Centerline settings configured");
        Ok(())
    }

    #[wasm_bindgen]
    pub fn set_dots_settings(
        &mut self,
        density: f32,
        min_radius: f32,
        max_radius: f32,
        adaptive_sizing: bool,
        preserve_colors: bool
    ) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_dots_settings(density, min_radius, max_radius, adaptive_sizing, preserve_colors)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Dots settings configured");
        Ok(())
    }

    #[wasm_bindgen]
    pub fn set_superpixel_settings(
        &mut self,
        num_superpixels: u32,
        compactness: f32,
        iterations: u32
    ) -> Result<(), JsValue> {
        self.config = self.config.clone()
            .with_superpixel_settings(num_superpixels, compactness, iterations)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        log::info!("Superpixel settings configured");
        Ok(())
    }

    /// Load a preset configuration
    #[wasm_bindgen]
    pub fn load_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        self.config = match preset {
            "line_art" => VectorizerConfig::preset_line_art(),
            "sketch" => VectorizerConfig::preset_sketch(),
            "technical" => VectorizerConfig::preset_technical(),
            "stippling" => VectorizerConfig::preset_stippling(),
            "pointillism" => VectorizerConfig::preset_pointillism(),
            _ => return Err(JsValue::from_str(&format!("Unknown preset: {}", preset))),
        };
        log::info!("Loaded preset: {}", preset);
        Ok(())
    }

    /// Build the configuration for use
    /// Returns the built configuration that can be used internally
    pub(crate) fn build_internal(&self) -> Result<(TraceLowConfig, Option<HandDrawnConfig>), ConfigError> {
        self.config.clone().build()
    }

    /// Build and get configuration summary for JavaScript
    #[wasm_bindgen]
    pub fn build(&self) -> Result<String, JsValue> {
        let (trace_config, hand_drawn_config) = self.config.clone()
            .build()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // Return a summary string for now
        let summary = format!(
            "Configuration built: backend={:?}, detail={}, multipass={}, hand_drawn={}",
            trace_config.backend,
            trace_config.detail,
            trace_config.enable_multipass,
            hand_drawn_config.is_some()
        );

        Ok(summary)
    }

    /// Get current backend
    #[wasm_bindgen]
    pub fn get_backend(&self) -> String {
        match self.backend {
            TraceBackend::Edge => "edge".to_string(),
            TraceBackend::Centerline => "centerline".to_string(),
            TraceBackend::Superpixel => "superpixel".to_string(),
            TraceBackend::Dots => "dots".to_string(),
        }
    }

    /// Reset configuration to defaults
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.config = VectorizerConfig::new();
        self.backend = TraceBackend::Edge;
        log::info!("Configuration reset to defaults");
    }

    /// Validate current configuration
    #[wasm_bindgen]
    pub fn validate(&self) -> Result<String, JsValue> {
        match self.config.clone().build() {
            Ok(_) => Ok("Configuration is valid".to_string()),
            Err(e) => Err(JsValue::from_str(&format!("Validation failed: {}", e))),
        }
    }
}

/// Output structure for JavaScript
// Note: We don't serialize the internal configs directly,
// instead we'll return the built configuration as a simplified structure

impl Default for WasmConfigManager {
    fn default() -> Self {
        Self::new()
    }
}