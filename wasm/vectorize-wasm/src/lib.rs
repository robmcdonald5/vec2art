//! WebAssembly wrapper for vectorize-core
//!
//! This crate provides a WebAssembly interface for the vec2art vectorization
//! algorithms, allowing them to be used in web browsers.

mod utils;

use image::ImageBuffer;
use js_sys::Object;
use vectorize_core::{vectorize_logo_rgba, vectorize_regions_rgba, LogoConfig, RegionsConfig};
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

/// JavaScript-compatible configuration for logo vectorization
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WasmLogoConfig {
    max_dimension: u32,
    threshold: u8,
    adaptive_threshold: bool,
    morphology_kernel_size: u32,
    min_contour_area: u32,
    simplification_tolerance: f64,
    fit_curves: bool,
    curve_tolerance: f64,
}

#[wasm_bindgen]
impl WasmLogoConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let default_config = LogoConfig::default();
        Self {
            max_dimension: default_config.max_dimension,
            threshold: default_config.threshold,
            adaptive_threshold: default_config.adaptive_threshold,
            morphology_kernel_size: default_config.morphology_kernel_size,
            min_contour_area: default_config.min_contour_area,
            simplification_tolerance: default_config.simplification_tolerance,
            fit_curves: default_config.fit_curves,
            curve_tolerance: default_config.curve_tolerance,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn max_dimension(&self) -> u32 {
        self.max_dimension
    }
    #[wasm_bindgen(setter)]
    pub fn set_max_dimension(&mut self, value: u32) {
        self.max_dimension = value;
    }

    #[wasm_bindgen(getter)]
    pub fn threshold(&self) -> u8 {
        self.threshold
    }
    #[wasm_bindgen(setter)]
    pub fn set_threshold(&mut self, value: u8) {
        self.threshold = value;
    }

    #[wasm_bindgen(getter)]
    pub fn adaptive_threshold(&self) -> bool {
        self.adaptive_threshold
    }
    #[wasm_bindgen(setter)]
    pub fn set_adaptive_threshold(&mut self, value: bool) {
        self.adaptive_threshold = value;
    }

    #[wasm_bindgen(getter)]
    pub fn morphology_kernel_size(&self) -> u32 {
        self.morphology_kernel_size
    }
    #[wasm_bindgen(setter)]
    pub fn set_morphology_kernel_size(&mut self, value: u32) {
        self.morphology_kernel_size = value;
    }

    #[wasm_bindgen(getter)]
    pub fn min_contour_area(&self) -> u32 {
        self.min_contour_area
    }
    #[wasm_bindgen(setter)]
    pub fn set_min_contour_area(&mut self, value: u32) {
        self.min_contour_area = value;
    }

    #[wasm_bindgen(getter)]
    pub fn simplification_tolerance(&self) -> f64 {
        self.simplification_tolerance
    }
    #[wasm_bindgen(setter)]
    pub fn set_simplification_tolerance(&mut self, value: f64) {
        self.simplification_tolerance = value;
    }

    #[wasm_bindgen(getter)]
    pub fn fit_curves(&self) -> bool {
        self.fit_curves
    }
    #[wasm_bindgen(setter)]
    pub fn set_fit_curves(&mut self, value: bool) {
        self.fit_curves = value;
    }

    #[wasm_bindgen(getter)]
    pub fn curve_tolerance(&self) -> f64 {
        self.curve_tolerance
    }
    #[wasm_bindgen(setter)]
    pub fn set_curve_tolerance(&mut self, value: f64) {
        self.curve_tolerance = value;
    }
}

impl From<WasmLogoConfig> for LogoConfig {
    fn from(wasm_config: WasmLogoConfig) -> Self {
        Self {
            max_dimension: wasm_config.max_dimension,
            threshold: wasm_config.threshold,
            adaptive_threshold: wasm_config.adaptive_threshold,
            morphology_kernel_size: wasm_config.morphology_kernel_size,
            min_contour_area: wasm_config.min_contour_area,
            simplification_tolerance: wasm_config.simplification_tolerance,
            fit_curves: wasm_config.fit_curves,
            curve_tolerance: wasm_config.curve_tolerance,
        }
    }
}

/// JavaScript-compatible configuration for regions vectorization
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WasmRegionsConfig {
    max_dimension: u32,
    num_colors: u32,
    use_lab_color: bool,
    min_region_area: u32,
    max_iterations: u32,
    convergence_threshold: f64,
    simplification_tolerance: f64,
    fit_curves: bool,
    curve_tolerance: f64,
    merge_similar_regions: bool,
    merge_threshold: f64,
}

#[wasm_bindgen]
impl WasmRegionsConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let default_config = RegionsConfig::default();
        Self {
            max_dimension: default_config.max_dimension,
            num_colors: default_config.num_colors,
            use_lab_color: default_config.use_lab_color,
            min_region_area: default_config.min_region_area,
            max_iterations: default_config.max_iterations,
            convergence_threshold: default_config.convergence_threshold,
            simplification_tolerance: default_config.simplification_tolerance,
            fit_curves: default_config.fit_curves,
            curve_tolerance: default_config.curve_tolerance,
            merge_similar_regions: default_config.merge_similar_regions,
            merge_threshold: default_config.merge_threshold,
        }
    }

    // Getters and setters for all fields
    #[wasm_bindgen(getter)]
    pub fn max_dimension(&self) -> u32 {
        self.max_dimension
    }
    #[wasm_bindgen(setter)]
    pub fn set_max_dimension(&mut self, value: u32) {
        self.max_dimension = value;
    }

    #[wasm_bindgen(getter)]
    pub fn num_colors(&self) -> u32 {
        self.num_colors
    }
    #[wasm_bindgen(setter)]
    pub fn set_num_colors(&mut self, value: u32) {
        self.num_colors = value;
    }

    #[wasm_bindgen(getter)]
    pub fn use_lab_color(&self) -> bool {
        self.use_lab_color
    }
    #[wasm_bindgen(setter)]
    pub fn set_use_lab_color(&mut self, value: bool) {
        self.use_lab_color = value;
    }

    #[wasm_bindgen(getter)]
    pub fn min_region_area(&self) -> u32 {
        self.min_region_area
    }
    #[wasm_bindgen(setter)]
    pub fn set_min_region_area(&mut self, value: u32) {
        self.min_region_area = value;
    }

    #[wasm_bindgen(getter)]
    pub fn max_iterations(&self) -> u32 {
        self.max_iterations
    }
    #[wasm_bindgen(setter)]
    pub fn set_max_iterations(&mut self, value: u32) {
        self.max_iterations = value;
    }

    #[wasm_bindgen(getter)]
    pub fn convergence_threshold(&self) -> f64 {
        self.convergence_threshold
    }
    #[wasm_bindgen(setter)]
    pub fn set_convergence_threshold(&mut self, value: f64) {
        self.convergence_threshold = value;
    }

    #[wasm_bindgen(getter)]
    pub fn simplification_tolerance(&self) -> f64 {
        self.simplification_tolerance
    }
    #[wasm_bindgen(setter)]
    pub fn set_simplification_tolerance(&mut self, value: f64) {
        self.simplification_tolerance = value;
    }

    #[wasm_bindgen(getter)]
    pub fn fit_curves(&self) -> bool {
        self.fit_curves
    }
    #[wasm_bindgen(setter)]
    pub fn set_fit_curves(&mut self, value: bool) {
        self.fit_curves = value;
    }

    #[wasm_bindgen(getter)]
    pub fn curve_tolerance(&self) -> f64 {
        self.curve_tolerance
    }
    #[wasm_bindgen(setter)]
    pub fn set_curve_tolerance(&mut self, value: f64) {
        self.curve_tolerance = value;
    }

    #[wasm_bindgen(getter)]
    pub fn merge_similar_regions(&self) -> bool {
        self.merge_similar_regions
    }
    #[wasm_bindgen(setter)]
    pub fn set_merge_similar_regions(&mut self, value: bool) {
        self.merge_similar_regions = value;
    }

    #[wasm_bindgen(getter)]
    pub fn merge_threshold(&self) -> f64 {
        self.merge_threshold
    }
    #[wasm_bindgen(setter)]
    pub fn set_merge_threshold(&mut self, value: f64) {
        self.merge_threshold = value;
    }
}

impl From<WasmRegionsConfig> for RegionsConfig {
    fn from(wasm_config: WasmRegionsConfig) -> Self {
        Self {
            max_dimension: wasm_config.max_dimension,
            num_colors: wasm_config.num_colors,
            use_lab_color: wasm_config.use_lab_color,
            min_region_area: wasm_config.min_region_area,
            max_iterations: wasm_config.max_iterations,
            convergence_threshold: wasm_config.convergence_threshold,
            simplification_tolerance: wasm_config.simplification_tolerance,
            fit_curves: wasm_config.fit_curves,
            curve_tolerance: wasm_config.curve_tolerance,
            merge_similar_regions: wasm_config.merge_similar_regions,
            merge_threshold: wasm_config.merge_threshold,
        }
    }
}

/// Vectorize image using logo/line-art algorithm
///
/// # Arguments
/// * `image_data` - ImageData from HTML5 Canvas
/// * `config` - Logo vectorization configuration
///
/// # Returns
/// * `Promise<String>` - SVG string (async to avoid blocking main thread)
#[wasm_bindgen]
pub fn vectorize_logo(image_data: &ImageData, config: &WasmLogoConfig) -> Result<String, JsValue> {
    utils::console_time("vectorize_logo");

    let width = image_data.width();
    let height = image_data.height();

    log::info!("Starting logo vectorization for {}x{} image", width, height);

    // Convert ImageData to ImageBuffer
    let rgba_data = image_data.data();
    let rgba_vec = rgba_data.to_vec();

    let img_buffer = ImageBuffer::from_raw(width, height, rgba_vec)
        .ok_or_else(|| JsValue::from_str("Failed to create image buffer from ImageData"))?;

    // Convert config
    let core_config: LogoConfig = config.clone().into();

    // Perform vectorization
    let result = vectorize_logo_rgba(&img_buffer, &core_config)
        .map_err(|e| JsValue::from_str(&format!("Vectorization failed: {}", e)))?;

    utils::console_time_end("vectorize_logo");
    log::info!("Logo vectorization completed successfully");

    Ok(result)
}

/// Vectorize image using color regions algorithm
///
/// # Arguments
/// * `image_data` - ImageData from HTML5 Canvas
/// * `config` - Regions vectorization configuration
///
/// # Returns
/// * `Promise<String>` - SVG string (async to avoid blocking main thread)
#[wasm_bindgen]
pub fn vectorize_regions(
    image_data: &ImageData,
    config: &WasmRegionsConfig,
) -> Result<String, JsValue> {
    utils::console_time("vectorize_regions");

    let width = image_data.width();
    let height = image_data.height();

    log::info!(
        "Starting regions vectorization for {}x{} image",
        width,
        height
    );

    // Convert ImageData to ImageBuffer
    let rgba_data = image_data.data();
    let rgba_vec = rgba_data.to_vec();

    let img_buffer = ImageBuffer::from_raw(width, height, rgba_vec)
        .ok_or_else(|| JsValue::from_str("Failed to create image buffer from ImageData"))?;

    // Convert config
    let core_config: RegionsConfig = config.clone().into();

    // Perform vectorization
    let result = vectorize_regions_rgba(&img_buffer, &core_config)
        .map_err(|e| JsValue::from_str(&format!("Vectorization failed: {}", e)))?;

    utils::console_time_end("vectorize_regions");
    log::info!("Regions vectorization completed successfully");

    Ok(result)
}

/// Get version information
#[wasm_bindgen]
pub fn get_version() -> String {
    format!("vectorize-wasm v{}", env!("CARGO_PKG_VERSION"))
}

/// Check if WebAssembly SIMD is supported
#[wasm_bindgen]
pub fn has_simd_support() -> bool {
    // This is a placeholder - actual SIMD detection would require
    // more sophisticated runtime checks
    cfg!(target_feature = "simd128")
}

/// Get memory usage statistics
#[wasm_bindgen]
pub fn get_memory_usage() -> Object {
    let obj = Object::new();

    // For now, return placeholder memory info
    // TODO: Implement proper WebAssembly memory introspection
    js_sys::Reflect::set(&obj, &"memory_pages".into(), &JsValue::from(0u32)).unwrap();

    js_sys::Reflect::set(&obj, &"memory_bytes".into(), &JsValue::from(0u32)).unwrap();

    obj
}

// WASM-specific tests require wasm_bindgen_test
// These should be run with wasm-pack test or similar
//
// #[cfg(test)]
// mod tests {
//     use super::*;
//     use wasm_bindgen_test::*;
//
//     wasm_bindgen_test_configure!(run_in_browser);
//
//     #[wasm_bindgen_test]
//     fn test_wasm_logo_config() {
//         let config = WasmLogoConfig::new();
//         assert_eq!(config.threshold(), 128);
//         assert_eq!(config.adaptive_threshold(), false);
//     }
//
//     #[wasm_bindgen_test]
//     fn test_wasm_regions_config() {
//         let config = WasmRegionsConfig::new();
//         assert_eq!(config.num_colors(), 16);
//         assert_eq!(config.use_lab_color(), true);
//     }
//
//     #[wasm_bindgen_test]
//     fn test_get_version() {
//         let version = get_version();
//         assert!(version.contains("vectorize-wasm"));
//     }
// }
