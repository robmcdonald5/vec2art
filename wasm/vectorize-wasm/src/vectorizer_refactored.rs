//! Refactored WASM Vectorizer without bandaid fixes
//!
//! This module provides a clean WASM interface using the immutable configuration
//! system, eliminating all the recursive aliasing issues and bandaid fixes.

use crate::wasm_config::WasmConfigManager;
use image::ImageBuffer;
use js_sys::Function;
use vectorize_core::vectorize_trace_low_rgba;
use wasm_bindgen::prelude::*;
use web_sys::ImageData;

/// Clean WASM vectorizer interface using immutable configuration
#[wasm_bindgen]
pub struct WasmVectorizerRefactored {
    config_manager: WasmConfigManager,
}

#[wasm_bindgen]
impl WasmVectorizerRefactored {
    /// Create a new vectorizer instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        log::info!("🚀 Creating refactored WasmVectorizer with immutable configuration");
        Self {
            config_manager: WasmConfigManager::new(),
        }
    }

    /// Set the backend
    #[wasm_bindgen]
    pub fn set_backend(&mut self, backend: &str) -> Result<(), JsValue> {
        log::info!("🔧 Setting backend to: {}", backend);
        self.config_manager.set_backend(backend)?;
        log::info!("✅ Backend set successfully");
        Ok(())
    }

    /// Set detail level
    #[wasm_bindgen]
    pub fn set_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        log::info!("🔧 Setting detail to: {}", detail);
        self.config_manager.set_detail(detail)?;
        log::info!("✅ Detail set successfully");
        Ok(())
    }

    /// Set stroke width
    #[wasm_bindgen]
    pub fn set_stroke_width(&mut self, width: f32) -> Result<(), JsValue> {
        log::info!("🔧 Setting stroke width to: {}", width);
        self.config_manager.set_stroke_width(width)?;
        log::info!("✅ Stroke width set successfully");
        Ok(())
    }

    /// Enable/disable multipass with optional pass count
    #[wasm_bindgen]
    pub fn set_multipass(&mut self, enabled: bool) -> Result<(), JsValue> {
        log::info!("🔧 Setting multipass to: {}", enabled);
        self.config_manager.set_multipass(enabled, None)?;
        log::info!("✅ Multipass set successfully");
        Ok(())
    }

    /// Set pass count for multipass
    #[wasm_bindgen]
    pub fn set_pass_count(&mut self, count: u32) -> Result<(), JsValue> {
        log::info!("🔧 Setting pass count to: {}", count);
        self.config_manager.set_multipass(true, Some(count))?;
        log::info!("✅ Pass count set successfully");
        Ok(())
    }

    /// Enable/disable reverse pass
    #[wasm_bindgen]
    pub fn set_reverse_pass(&mut self, enabled: bool) {
        log::info!("🔧 Setting reverse pass to: {}", enabled);
        self.config_manager.set_directional_passes(enabled, false);
        log::info!("✅ Reverse pass set successfully");
    }

    /// Enable/disable diagonal pass
    #[wasm_bindgen]
    pub fn set_diagonal_pass(&mut self, enabled: bool) {
        log::info!("🔧 Setting diagonal pass to: {}", enabled);
        self.config_manager.set_directional_passes(false, enabled);
        log::info!("✅ Diagonal pass set successfully");
    }

    /// Enable/disable noise filtering
    #[wasm_bindgen]
    pub fn set_noise_filtering(&mut self, enabled: bool) {
        log::info!("🔧 Setting noise filtering to: {}", enabled);
        self.config_manager.set_noise_filtering(enabled);
        log::info!("✅ Noise filtering set successfully");
    }

    /// Set hand-drawn preset
    #[wasm_bindgen]
    pub fn set_hand_drawn_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        log::info!("🔧 Setting hand-drawn preset to: {}", preset);
        self.config_manager.set_hand_drawn_preset(preset)?;
        log::info!("✅ Hand-drawn preset set successfully");
        Ok(())
    }

    /// Set custom tremor strength
    #[wasm_bindgen]
    pub fn set_custom_tremor(&mut self, tremor: f32) -> Result<(), JsValue> {
        log::info!("🔧 Setting custom tremor to: {}", tremor);
        self.config_manager.set_custom_hand_drawn(Some(tremor), None, None)?;
        log::info!("✅ Custom tremor set successfully");
        Ok(())
    }

    /// Set custom variable weights
    #[wasm_bindgen]
    pub fn set_custom_variable_weights(&mut self, weights: f32) -> Result<(), JsValue> {
        log::info!("🔧 Setting custom variable weights to: {}", weights);
        self.config_manager.set_custom_hand_drawn(None, Some(weights), None)?;
        log::info!("✅ Custom variable weights set successfully");
        Ok(())
    }

    /// Set custom tapering
    #[wasm_bindgen]
    pub fn set_custom_tapering(&mut self, tapering: f32) -> Result<(), JsValue> {
        log::info!("🔧 Setting custom tapering to: {}", tapering);
        self.config_manager.set_custom_hand_drawn(None, None, Some(tapering))?;
        log::info!("✅ Custom tapering set successfully");
        Ok(())
    }

    /// Enable/disable background removal
    #[wasm_bindgen]
    pub fn enable_background_removal(&mut self, enabled: bool) {
        log::info!("🔧 Setting background removal to: {}", enabled);
        let _ = self.config_manager.set_background_removal(enabled, None, None);
        log::info!("✅ Background removal set successfully");
    }

    /// Set background removal strength
    #[wasm_bindgen]
    pub fn set_background_removal_strength(&mut self, strength: f32) -> Result<(), JsValue> {
        log::info!("🔧 Setting background removal strength to: {}", strength);
        self.config_manager.set_background_removal(true, Some(strength), None)?;
        log::info!("✅ Background removal strength set successfully");
        Ok(())
    }

    /// Set background removal algorithm
    #[wasm_bindgen]
    pub fn set_background_removal_algorithm(&mut self, algorithm: &str) -> Result<(), JsValue> {
        log::info!("🔧 Setting background removal algorithm to: {}", algorithm);
        self.config_manager.set_background_removal(true, None, Some(algorithm.to_string()))?;
        log::info!("✅ Background removal algorithm set successfully");
        Ok(())
    }

    // Backend-specific configuration methods

    /// Configure Edge/Centerline backend settings
    #[wasm_bindgen]
    pub fn set_edge_settings(
        &mut self,
        etf_fdog: bool,
        flow_tracing: bool,
        bezier_fitting: bool,
    ) -> Result<(), JsValue> {
        log::info!("🔧 Setting edge settings");
        self.config_manager.set_edge_settings(etf_fdog, flow_tracing, bezier_fitting)?;
        log::info!("✅ Edge settings configured successfully");
        Ok(())
    }

    /// Configure Centerline backend settings
    #[wasm_bindgen]
    pub fn set_centerline_settings(
        &mut self,
        adaptive_threshold: bool,
        window_size: u32,
        sensitivity_k: f32,
    ) -> Result<(), JsValue> {
        log::info!("🔧 Setting centerline settings");
        self.config_manager.set_centerline_settings(adaptive_threshold, window_size, sensitivity_k)?;
        log::info!("✅ Centerline settings configured successfully");
        Ok(())
    }

    /// Configure Dots backend settings
    #[wasm_bindgen]
    pub fn set_dots_settings(
        &mut self,
        density: f32,
        min_radius: f32,
        max_radius: f32,
        adaptive_sizing: bool,
        preserve_colors: bool,
    ) -> Result<(), JsValue> {
        log::info!("🔧 Setting dots settings");
        self.config_manager.set_dots_settings(density, min_radius, max_radius, adaptive_sizing, preserve_colors)?;
        log::info!("✅ Dots settings configured successfully");
        Ok(())
    }

    /// Configure Superpixel backend settings
    #[wasm_bindgen]
    pub fn set_superpixel_settings(
        &mut self,
        num_superpixels: u32,
        compactness: f32,
        iterations: u32,
    ) -> Result<(), JsValue> {
        log::info!("🔧 Setting superpixel settings");
        self.config_manager.set_superpixel_settings(num_superpixels, compactness, iterations)?;
        log::info!("✅ Superpixel settings configured successfully");
        Ok(())
    }

    /// Load a preset configuration
    #[wasm_bindgen]
    pub fn load_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        log::info!("🔧 Loading preset: {}", preset);
        self.config_manager.load_preset(preset)?;
        log::info!("✅ Preset loaded successfully");
        Ok(())
    }

    /// Process an image and return SVG
    #[wasm_bindgen]
    pub fn vectorize(&self, image_data: &ImageData) -> Result<String, JsValue> {
        log::info!("🖼️ Starting vectorization");

        // Convert ImageData to RGBA buffer
        let width = image_data.width();
        let height = image_data.height();
        let data = image_data.data();
        let data_vec: Vec<u8> = data.to_vec();

        // Create ImageBuffer from the data
        let img_buffer = ImageBuffer::from_raw(width, height, data_vec)
            .ok_or_else(|| JsValue::from_str("Failed to create image buffer from ImageData"))?;

        // Build configuration
        let (config, hand_drawn_config) = self.config_manager.build_internal()
            .map_err(|e| JsValue::from_str(&format!("Configuration error: {}", e)))?;

        log::info!(
            "🚀 Processing with backend: {:?}, detail: {}, multipass: {}",
            config.backend, config.detail, config.enable_multipass
        );

        // Perform vectorization
        let result = vectorize_trace_low_rgba(&img_buffer, &config, hand_drawn_config.as_ref())
            .map_err(|e| JsValue::from_str(&format!("Vectorization failed: {}", e)))?;

        log::info!("✅ Vectorization complete! Generated {} bytes of SVG", result.len());

        Ok(result)
    }

    /// Process an image with progress callback
    #[wasm_bindgen]
    pub fn vectorize_with_progress(
        &self,
        image_data: &ImageData,
        callback: Option<Function>,
    ) -> Result<String, JsValue> {
        let start_time = js_sys::Date::now();

        // Report progress: Starting
        if let Some(ref cb) = callback {
            let progress = serde_json::json!({
                "stage": "initialization",
                "percent": 0.0,
                "message": "Starting vectorization...",
                "processing_time_ms": 0.0,
            });
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }

        // Report progress: Processing
        if let Some(ref cb) = callback {
            let progress = serde_json::json!({
                "stage": "processing",
                "percent": 50.0,
                "message": format!("Processing with {} backend...", self.config_manager.get_backend()),
                "processing_time_ms": js_sys::Date::now() - start_time,
            });
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }

        // Process the image
        let result = self.vectorize(image_data)?;

        // Report progress: Complete
        if let Some(ref cb) = callback {
            let progress = serde_json::json!({
                "stage": "complete",
                "percent": 100.0,
                "message": format!("Vectorization complete! Generated {} bytes of SVG", result.len()),
                "svg_size": result.len(),
                "processing_time_ms": js_sys::Date::now() - start_time,
            });
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }

        Ok(result)
    }

    /// Reset configuration to defaults
    #[wasm_bindgen]
    pub fn reset_config(&mut self) {
        log::info!("🔧 Resetting configuration to defaults");
        self.config_manager.reset();
        log::info!("✅ Configuration reset successfully");
    }

    /// Get current backend as string
    #[wasm_bindgen]
    pub fn get_backend(&self) -> String {
        self.config_manager.get_backend()
    }

    /// Validate current configuration
    #[wasm_bindgen]
    pub fn validate_config(&self) -> Result<String, JsValue> {
        self.config_manager.validate()
    }

    /// Debug dump configuration
    #[wasm_bindgen]
    pub fn debug_dump_config(&self) -> String {
        match self.config_manager.validate() {
            Ok(msg) => format!("Configuration: {}\nBackend: {}", msg, self.get_backend()),
            Err(e) => format!("Configuration invalid: {:?}", e),
        }
    }
}

impl Default for WasmVectorizerRefactored {
    fn default() -> Self {
        Self::new()
    }
}