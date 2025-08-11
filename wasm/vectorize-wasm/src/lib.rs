//! WebAssembly wrapper for vectorize-core
//!
//! This crate provides a WebAssembly interface for the vec2art vectorization
//! algorithms, allowing them to be used in web browsers.

mod utils;

use image::ImageBuffer;
use js_sys::Object;
use vectorize_core::{vectorize_trace_low_rgba, SvgConfig, TraceBackend, TraceLowConfig};
use wasm_bindgen::prelude::*;
use web_sys::ImageData;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator for smaller wasm binary size
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Initialize the wasm module
#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();

    // Initialize logging for web console
    console_log::init_with_level(log::Level::Info).expect("Failed to initialize logger");

    log::info!("vectorize-wasm initialized");
}

/// JavaScript-compatible configuration for trace-low vectorization
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WasmTraceLowConfig {
    detail: f32,
    stroke_px_at_1080p: f32,
    enable_multipass: bool,
    conservative_detail: Option<f32>,
    aggressive_detail: Option<f32>,
    noise_filtering: bool,
    enable_reverse_pass: bool,
    enable_diagonal_pass: bool,
    directional_strength_threshold: f32,
    max_processing_time_ms: u64,
    backend: String,
    // Dot-specific fields
    dot_density_threshold: f32,
    dot_min_radius: f32,
    dot_max_radius: f32,
    dot_preserve_colors: bool,
    dot_adaptive_sizing: bool,
    dot_background_tolerance: f32,
}

#[wasm_bindgen]
impl WasmTraceLowConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let default_config = TraceLowConfig::default();
        Self {
            detail: default_config.detail,
            stroke_px_at_1080p: default_config.stroke_px_at_1080p,
            enable_multipass: default_config.enable_multipass,
            conservative_detail: default_config.conservative_detail,
            aggressive_detail: default_config.aggressive_detail,
            noise_filtering: default_config.noise_filtering,
            enable_reverse_pass: default_config.enable_reverse_pass,
            enable_diagonal_pass: default_config.enable_diagonal_pass,
            directional_strength_threshold: default_config.directional_strength_threshold,
            max_processing_time_ms: default_config.max_processing_time_ms,
            backend: match default_config.backend {
                TraceBackend::Edge => "edge".to_string(),
                TraceBackend::Centerline => "centerline".to_string(),
                TraceBackend::Superpixel => "superpixel".to_string(),
                TraceBackend::Dots => "dots".to_string(),
            },
            // Dot-specific defaults
            dot_density_threshold: default_config.dot_density_threshold,
            dot_min_radius: default_config.dot_min_radius,
            dot_max_radius: default_config.dot_max_radius,
            dot_preserve_colors: default_config.dot_preserve_colors,
            dot_adaptive_sizing: default_config.dot_adaptive_sizing,
            dot_background_tolerance: default_config.dot_background_tolerance,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn detail(&self) -> f32 {
        self.detail
    }
    #[wasm_bindgen(setter)]
    pub fn set_detail(&mut self, value: f32) {
        self.detail = value;
    }

    #[wasm_bindgen(getter)]
    pub fn stroke_px_at_1080p(&self) -> f32 {
        self.stroke_px_at_1080p
    }
    #[wasm_bindgen(setter)]
    pub fn set_stroke_px_at_1080p(&mut self, value: f32) {
        self.stroke_px_at_1080p = value;
    }

    #[wasm_bindgen(getter)]
    pub fn enable_multipass(&self) -> bool {
        self.enable_multipass
    }
    #[wasm_bindgen(setter)]
    pub fn set_enable_multipass(&mut self, value: bool) {
        self.enable_multipass = value;
    }

    #[wasm_bindgen(getter)]
    pub fn noise_filtering(&self) -> bool {
        self.noise_filtering
    }
    #[wasm_bindgen(setter)]
    pub fn set_noise_filtering(&mut self, value: bool) {
        self.noise_filtering = value;
    }

    #[wasm_bindgen(getter)]
    pub fn enable_reverse_pass(&self) -> bool {
        self.enable_reverse_pass
    }
    #[wasm_bindgen(setter)]
    pub fn set_enable_reverse_pass(&mut self, value: bool) {
        self.enable_reverse_pass = value;
    }

    #[wasm_bindgen(getter)]
    pub fn enable_diagonal_pass(&self) -> bool {
        self.enable_diagonal_pass
    }
    #[wasm_bindgen(setter)]
    pub fn set_enable_diagonal_pass(&mut self, value: bool) {
        self.enable_diagonal_pass = value;
    }

    #[wasm_bindgen(getter)]
    pub fn backend(&self) -> String {
        self.backend.clone()
    }
    #[wasm_bindgen(setter)]
    pub fn set_backend(&mut self, value: String) {
        self.backend = value;
    }

    /// Create a configuration suitable for line art
    #[wasm_bindgen]
    pub fn for_line_art() -> Self {
        let default_config = TraceLowConfig::default();
        Self {
            detail: 0.7,
            stroke_px_at_1080p: 1.5,
            enable_multipass: true,
            conservative_detail: Some(0.5),
            aggressive_detail: Some(0.9),
            noise_filtering: true,
            enable_reverse_pass: false,
            enable_diagonal_pass: false,
            directional_strength_threshold: 0.3,
            max_processing_time_ms: 2000,
            backend: "edge".to_string(),
            // Dot-specific defaults
            dot_density_threshold: default_config.dot_density_threshold,
            dot_min_radius: default_config.dot_min_radius,
            dot_max_radius: default_config.dot_max_radius,
            dot_preserve_colors: default_config.dot_preserve_colors,
            dot_adaptive_sizing: default_config.dot_adaptive_sizing,
            dot_background_tolerance: default_config.dot_background_tolerance,
        }
    }

    /// Create a configuration suitable for sketches
    #[wasm_bindgen]
    pub fn for_sketch() -> Self {
        let default_config = TraceLowConfig::default();
        Self {
            detail: 0.5,
            stroke_px_at_1080p: 2.0,
            enable_multipass: false,
            conservative_detail: None,
            aggressive_detail: None,
            noise_filtering: false,
            enable_reverse_pass: false,
            enable_diagonal_pass: false,
            directional_strength_threshold: 0.3,
            max_processing_time_ms: 1500,
            backend: "edge".to_string(),
            // Dot-specific defaults
            dot_density_threshold: default_config.dot_density_threshold,
            dot_min_radius: default_config.dot_min_radius,
            dot_max_radius: default_config.dot_max_radius,
            dot_preserve_colors: default_config.dot_preserve_colors,
            dot_adaptive_sizing: default_config.dot_adaptive_sizing,
            dot_background_tolerance: default_config.dot_background_tolerance,
        }
    }

    /// Create a configuration suitable for technical drawings
    #[wasm_bindgen]
    pub fn for_technical() -> Self {
        let default_config = TraceLowConfig::default();
        Self {
            detail: 0.9,
            stroke_px_at_1080p: 1.0,
            enable_multipass: true,
            conservative_detail: Some(0.7),
            aggressive_detail: Some(0.95),
            noise_filtering: true,
            enable_reverse_pass: true,
            enable_diagonal_pass: true,
            directional_strength_threshold: 0.2,
            max_processing_time_ms: 3000,
            backend: "edge".to_string(),
            // Dot-specific defaults
            dot_density_threshold: default_config.dot_density_threshold,
            dot_min_radius: default_config.dot_min_radius,
            dot_max_radius: default_config.dot_max_radius,
            dot_preserve_colors: default_config.dot_preserve_colors,
            dot_adaptive_sizing: default_config.dot_adaptive_sizing,
            dot_background_tolerance: default_config.dot_background_tolerance,
        }
    }
}

impl From<WasmTraceLowConfig> for TraceLowConfig {
    fn from(wasm_config: WasmTraceLowConfig) -> Self {
        TraceLowConfig {
            detail: wasm_config.detail,
            stroke_px_at_1080p: wasm_config.stroke_px_at_1080p,
            enable_multipass: wasm_config.enable_multipass,
            conservative_detail: wasm_config.conservative_detail,
            aggressive_detail: wasm_config.aggressive_detail,
            noise_filtering: wasm_config.noise_filtering,
            enable_reverse_pass: wasm_config.enable_reverse_pass,
            enable_diagonal_pass: wasm_config.enable_diagonal_pass,
            directional_strength_threshold: wasm_config.directional_strength_threshold,
            max_processing_time_ms: wasm_config.max_processing_time_ms,
            backend: match wasm_config.backend.as_str() {
                "centerline" => TraceBackend::Centerline,
                "superpixel" => TraceBackend::Superpixel,
                "dots" => TraceBackend::Dots,
                _ => TraceBackend::Edge, // Default to edge
            },
            // Dot-specific fields
            dot_density_threshold: wasm_config.dot_density_threshold,
            dot_min_radius: wasm_config.dot_min_radius,
            dot_max_radius: wasm_config.dot_max_radius,
            dot_preserve_colors: wasm_config.dot_preserve_colors,
            dot_adaptive_sizing: wasm_config.dot_adaptive_sizing,
            dot_background_tolerance: wasm_config.dot_background_tolerance,
            // Use defaults for new ETF/FDoG and tracing features
            ..Default::default()
        }
    }
}

/// JavaScript-compatible SVG configuration
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WasmSvgConfig {
    precision: u8,
    optimize: bool,
    include_metadata: bool,
}

#[wasm_bindgen]
impl WasmSvgConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let default_config = SvgConfig::default();
        Self {
            precision: default_config.precision,
            optimize: default_config.optimize,
            include_metadata: default_config.include_metadata,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn precision(&self) -> u8 {
        self.precision
    }
    #[wasm_bindgen(setter)]
    pub fn set_precision(&mut self, value: u8) {
        self.precision = value;
    }

    #[wasm_bindgen(getter)]
    pub fn optimize(&self) -> bool {
        self.optimize
    }
    #[wasm_bindgen(setter)]
    pub fn set_optimize(&mut self, value: bool) {
        self.optimize = value;
    }

    #[wasm_bindgen(getter)]
    pub fn include_metadata(&self) -> bool {
        self.include_metadata
    }
    #[wasm_bindgen(setter)]
    pub fn set_include_metadata(&mut self, value: bool) {
        self.include_metadata = value;
    }
}

impl From<WasmSvgConfig> for SvgConfig {
    fn from(wasm_config: WasmSvgConfig) -> Self {
        SvgConfig {
            precision: wasm_config.precision,
            optimize: wasm_config.optimize,
            include_metadata: wasm_config.include_metadata,
        }
    }
}

/// Helper function to sanitize trace-low config for WASM
fn sanitize_trace_low_config_for_wasm(config: &mut WasmTraceLowConfig) -> Result<(), JsValue> {
    // Validate detail range
    if config.detail < 0.0 || config.detail > 1.0 {
        return Err(JsValue::from_str(&format!(
            "Detail must be between 0.0 and 1.0, got {}",
            config.detail
        )));
    }

    // Validate stroke width
    if config.stroke_px_at_1080p <= 0.0 {
        return Err(JsValue::from_str(&format!(
            "Stroke width must be positive, got {}",
            config.stroke_px_at_1080p
        )));
    }

    if config.stroke_px_at_1080p > 50.0 {
        log::warn!(
            "Stroke width {} is very large, clamping to 50.0",
            config.stroke_px_at_1080p
        );
        config.stroke_px_at_1080p = 50.0;
    }

    // Validate backend
    match config.backend.as_str() {
        "edge" | "centerline" | "superpixel" => {}
        _ => {
            log::warn!("Unknown backend '{}', defaulting to 'edge'", config.backend);
            config.backend = "edge".to_string();
        }
    }

    Ok(())
}

/// Main vectorization function for trace-low algorithm
///
/// Takes an ImageData object from the browser and converts it to SVG
/// using the trace-low algorithm with the specified configuration.
///
/// # Arguments
/// * `image_data` - Browser ImageData object containing RGBA pixel data
/// * `config` - Configuration for the trace-low algorithm
///
/// # Returns
/// * SVG string on success
/// * JavaScript error on failure
#[wasm_bindgen]
pub fn vectorize_trace_low(
    image_data: &ImageData,
    config: &WasmTraceLowConfig,
) -> Result<String, JsValue> {
    utils::console_time("vectorize_trace_low");

    let width = image_data.width();
    let height = image_data.height();
    let data = image_data.data();

    log::info!(
        "Starting trace-low vectorization: {}x{} image",
        width,
        height
    );

    // Validate and sanitize configuration
    let mut wasm_config = config.clone();
    sanitize_trace_low_config_for_wasm(&mut wasm_config)?;

    // Convert Uint8ClampedArray to Rust Vec
    let pixels = data.to_vec();

    // Create image buffer
    let img_buffer = ImageBuffer::from_raw(width, height, pixels)
        .ok_or_else(|| JsValue::from_str("Failed to create image buffer"))?;

    // Convert configuration
    let core_config: TraceLowConfig = wasm_config.into();

    log::debug!("Config: {:?}", core_config);

    // Run vectorization
    let result = vectorize_trace_low_rgba(&img_buffer, &core_config)
        .map_err(|e| JsValue::from_str(&format!("Vectorization failed: {}", e)))?;

    let svg_size = result.len();
    log::info!("Trace-low vectorization complete: {} bytes", svg_size);

    if svg_size > 1024 * 1024 {
        log::warn!(
            "Large SVG output: {} MB",
            svg_size as f64 / (1024.0 * 1024.0)
        );
    }

    utils::console_time_end("vectorize_trace_low");

    Ok(result)
}

/// Get version information
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get available backends for trace-low algorithm
#[wasm_bindgen]
pub fn get_available_backends() -> Vec<JsValue> {
    vec![
        JsValue::from_str("edge"),
        JsValue::from_str("centerline"),
        JsValue::from_str("superpixel"),
    ]
}

/// Get default configuration as JSON object
#[wasm_bindgen]
pub fn get_default_config() -> Result<Object, JsValue> {
    let config = WasmTraceLowConfig::new();

    let obj = Object::new();

    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("detail"),
        &JsValue::from_f64(config.detail as f64),
    )?;

    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("stroke_px_at_1080p"),
        &JsValue::from_f64(config.stroke_px_at_1080p as f64),
    )?;

    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("enable_multipass"),
        &JsValue::from_bool(config.enable_multipass),
    )?;

    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("noise_filtering"),
        &JsValue::from_bool(config.noise_filtering),
    )?;

    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("backend"),
        &JsValue::from_str(&config.backend),
    )?;

    Ok(obj)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_conversion() {
        let wasm_config = WasmTraceLowConfig::new();
        let core_config: TraceLowConfig = wasm_config.into();
        assert!(core_config.detail >= 0.0 && core_config.detail <= 1.0);
    }

    #[test]
    fn test_preset_configs() {
        let line_art = WasmTraceLowConfig::for_line_art();
        assert_eq!(line_art.detail, 0.7);
        assert_eq!(line_art.backend, "edge");

        let sketch = WasmTraceLowConfig::for_sketch();
        assert_eq!(sketch.detail, 0.5);
        assert!(!sketch.enable_multipass);

        let technical = WasmTraceLowConfig::for_technical();
        assert_eq!(technical.detail, 0.9);
        assert!(technical.enable_multipass);
    }
}
