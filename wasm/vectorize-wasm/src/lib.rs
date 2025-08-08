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
    detect_primitives: bool,
    primitive_fit_tolerance: f32,
    max_circle_eccentricity: f32,
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
            // Note: WASM still uses tolerance for backward compatibility
            simplification_tolerance: match default_config.simplification_epsilon {
                vectorize_core::Epsilon::Pixels(px) => px,
                vectorize_core::Epsilon::DiagFrac(frac) => frac * 100.0, // Convert to rough tolerance
            },
            fit_curves: default_config.fit_curves,
            curve_tolerance: default_config.curve_tolerance,
            detect_primitives: default_config.detect_primitives,
            primitive_fit_tolerance: default_config.primitive_fit_tolerance,
            max_circle_eccentricity: default_config.max_circle_eccentricity,
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

    #[wasm_bindgen(getter)]
    pub fn detect_primitives(&self) -> bool {
        self.detect_primitives
    }
    #[wasm_bindgen(setter)]
    pub fn set_detect_primitives(&mut self, value: bool) {
        self.detect_primitives = value;
    }

    #[wasm_bindgen(getter)]
    pub fn primitive_fit_tolerance(&self) -> f32 {
        self.primitive_fit_tolerance
    }
    #[wasm_bindgen(setter)]
    pub fn set_primitive_fit_tolerance(&mut self, value: f32) {
        self.primitive_fit_tolerance = value;
    }

    #[wasm_bindgen(getter)]
    pub fn max_circle_eccentricity(&self) -> f32 {
        self.max_circle_eccentricity
    }
    #[wasm_bindgen(setter)]
    pub fn set_max_circle_eccentricity(&mut self, value: f32) {
        self.max_circle_eccentricity = value;
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
            simplification_epsilon: vectorize_core::Epsilon::Pixels(wasm_config.simplification_tolerance),
            fit_curves: wasm_config.fit_curves,
            curve_tolerance: wasm_config.curve_tolerance,
            detect_primitives: wasm_config.detect_primitives,
            primitive_fit_tolerance: wasm_config.primitive_fit_tolerance,
            max_circle_eccentricity: wasm_config.max_circle_eccentricity,
            use_stroke: false, // Default to fill for backward compatibility
            stroke_width: 1.5,  // Default stroke width
        }
    }
}

/// JavaScript-compatible configuration for regions vectorization
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WasmRegionsConfig {
    max_dimension: u32,
    segmentation_method: u32, // 0 = KMeans, 1 = Slic
    quantization_method: u32, // 0 = KMeans, 1 = Wu
    num_colors: u32,
    use_lab_color: bool,
    min_region_area: u32,
    max_iterations: u32,
    convergence_threshold: f64,
    simplification_tolerance: f64,
    fit_curves: bool,
    curve_tolerance: f64,
    detect_primitives: bool,
    primitive_fit_tolerance: f32,
    max_circle_eccentricity: f32,
    merge_similar_regions: bool,
    merge_threshold: f64,
    slic_region_size: u32,
    slic_compactness: f32,
    slic_iterations: u32,
    // Gradient detection parameters
    detect_gradients: bool,
    gradient_r_squared_threshold: f64,
    max_gradient_stops: u32,
    min_gradient_region_area: u32,
    radial_symmetry_threshold: f64,
}

#[wasm_bindgen]
impl WasmRegionsConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let default_config = RegionsConfig::default();
        Self {
            max_dimension: default_config.max_dimension,
            segmentation_method: 0, // Default to KMeans
            quantization_method: 1, // Default to Wu as recommended
            num_colors: default_config.num_colors,
            use_lab_color: default_config.use_lab_color,
            min_region_area: default_config.min_region_area,
            max_iterations: default_config.max_iterations,
            convergence_threshold: default_config.convergence_threshold,
            // Note: WASM still uses tolerance for backward compatibility
            simplification_tolerance: match default_config.simplification_epsilon {
                vectorize_core::Epsilon::Pixels(px) => px,
                vectorize_core::Epsilon::DiagFrac(frac) => frac * 100.0, // Convert to rough tolerance
            },
            fit_curves: default_config.fit_curves,
            curve_tolerance: default_config.curve_tolerance,
            detect_primitives: default_config.detect_primitives,
            primitive_fit_tolerance: default_config.primitive_fit_tolerance,
            max_circle_eccentricity: default_config.max_circle_eccentricity,
            merge_similar_regions: default_config.merge_similar_regions,
            merge_threshold: default_config.merge_threshold,
            slic_region_size: default_config.slic_step_px,
            slic_compactness: default_config.slic_compactness,
            slic_iterations: default_config.slic_iterations,
            // Gradient detection fields
            detect_gradients: default_config.detect_gradients,
            gradient_r_squared_threshold: default_config.gradient_r_squared_threshold,
            max_gradient_stops: default_config.max_gradient_stops as u32,
            min_gradient_region_area: default_config.min_gradient_region_area as u32,
            radial_symmetry_threshold: default_config.radial_symmetry_threshold,
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

    #[wasm_bindgen(getter)]
    pub fn segmentation_method(&self) -> u32 {
        self.segmentation_method
    }
    #[wasm_bindgen(setter)]
    pub fn set_segmentation_method(&mut self, value: u32) {
        self.segmentation_method = value;
    }

    #[wasm_bindgen(getter)]
    pub fn quantization_method(&self) -> u32 {
        self.quantization_method
    }
    #[wasm_bindgen(setter)]
    pub fn set_quantization_method(&mut self, value: u32) {
        self.quantization_method = value;
    }

    #[wasm_bindgen(getter)]
    pub fn slic_region_size(&self) -> u32 {
        self.slic_region_size
    }
    #[wasm_bindgen(setter)]
    pub fn set_slic_region_size(&mut self, value: u32) {
        self.slic_region_size = value;
    }

    #[wasm_bindgen(getter)]
    pub fn slic_compactness(&self) -> f32 {
        self.slic_compactness
    }
    #[wasm_bindgen(setter)]
    pub fn set_slic_compactness(&mut self, value: f32) {
        self.slic_compactness = value;
    }

    #[wasm_bindgen(getter)]
    pub fn slic_iterations(&self) -> u32 {
        self.slic_iterations
    }
    #[wasm_bindgen(setter)]
    pub fn set_slic_iterations(&mut self, value: u32) {
        self.slic_iterations = value;
    }

    #[wasm_bindgen(getter)]
    pub fn detect_primitives(&self) -> bool {
        self.detect_primitives
    }
    #[wasm_bindgen(setter)]
    pub fn set_detect_primitives(&mut self, value: bool) {
        self.detect_primitives = value;
    }

    #[wasm_bindgen(getter)]
    pub fn primitive_fit_tolerance(&self) -> f32 {
        self.primitive_fit_tolerance
    }
    #[wasm_bindgen(setter)]
    pub fn set_primitive_fit_tolerance(&mut self, value: f32) {
        self.primitive_fit_tolerance = value;
    }

    #[wasm_bindgen(getter)]
    pub fn max_circle_eccentricity(&self) -> f32 {
        self.max_circle_eccentricity
    }
    #[wasm_bindgen(setter)]
    pub fn set_max_circle_eccentricity(&mut self, value: f32) {
        self.max_circle_eccentricity = value;
    }

    // Gradient detection getters and setters
    #[wasm_bindgen(getter)]
    pub fn detect_gradients(&self) -> bool {
        self.detect_gradients
    }
    #[wasm_bindgen(setter)]
    pub fn set_detect_gradients(&mut self, value: bool) {
        self.detect_gradients = value;
    }

    #[wasm_bindgen(getter)]
    pub fn gradient_r_squared_threshold(&self) -> f64 {
        self.gradient_r_squared_threshold
    }
    #[wasm_bindgen(setter)]
    pub fn set_gradient_r_squared_threshold(&mut self, value: f64) {
        self.gradient_r_squared_threshold = value;
    }

    #[wasm_bindgen(getter)]
    pub fn max_gradient_stops(&self) -> u32 {
        self.max_gradient_stops
    }
    #[wasm_bindgen(setter)]
    pub fn set_max_gradient_stops(&mut self, value: u32) {
        self.max_gradient_stops = value;
    }

    #[wasm_bindgen(getter)]
    pub fn min_gradient_region_area(&self) -> u32 {
        self.min_gradient_region_area
    }
    #[wasm_bindgen(setter)]
    pub fn set_min_gradient_region_area(&mut self, value: u32) {
        self.min_gradient_region_area = value;
    }

    #[wasm_bindgen(getter)]
    pub fn radial_symmetry_threshold(&self) -> f64 {
        self.radial_symmetry_threshold
    }
    #[wasm_bindgen(setter)]
    pub fn set_radial_symmetry_threshold(&mut self, value: f64) {
        self.radial_symmetry_threshold = value;
    }
}

impl From<WasmRegionsConfig> for RegionsConfig {
    fn from(wasm_config: WasmRegionsConfig) -> Self {
        use vectorize_core::config::{SegmentationMethod, QuantizationMethod};
        
        let segmentation_method = match wasm_config.segmentation_method {
            1 => SegmentationMethod::Slic,
            _ => SegmentationMethod::KMeans, // Default to KMeans for any other value
        };
        
        let quantization_method = match wasm_config.quantization_method {
            1 => QuantizationMethod::Wu,
            _ => QuantizationMethod::KMeans, // Default to KMeans for any other value
        };
        
        Self {
            max_dimension: wasm_config.max_dimension,
            segmentation_method,
            quantization_method,
            num_colors: wasm_config.num_colors,
            use_lab_color: wasm_config.use_lab_color,
            min_region_area: wasm_config.min_region_area,
            max_iterations: wasm_config.max_iterations,
            convergence_threshold: wasm_config.convergence_threshold,
            simplification_epsilon: vectorize_core::Epsilon::Pixels(wasm_config.simplification_tolerance),
            fit_curves: wasm_config.fit_curves,
            curve_tolerance: wasm_config.curve_tolerance,
            detect_primitives: wasm_config.detect_primitives,
            primitive_fit_tolerance: wasm_config.primitive_fit_tolerance,
            max_circle_eccentricity: wasm_config.max_circle_eccentricity,
            merge_similar_regions: wasm_config.merge_similar_regions,
            merge_threshold: wasm_config.merge_threshold,
            slic_step_px: wasm_config.slic_region_size,
            slic_compactness: wasm_config.slic_compactness,
            slic_iterations: wasm_config.slic_iterations,
            // Gradient detection fields
            detect_gradients: wasm_config.detect_gradients,
            gradient_r_squared_threshold: wasm_config.gradient_r_squared_threshold,
            max_gradient_stops: wasm_config.max_gradient_stops as usize,
            min_gradient_region_area: wasm_config.min_gradient_region_area as usize,
            radial_symmetry_threshold: wasm_config.radial_symmetry_threshold,
            // LAB ΔE parameters - use sensible defaults for WASM
            de_merge_threshold: 1.8,
            de_split_threshold: 3.5,
            palette_regularization: true,
            palette_regularization_k: 12,
        }
    }
}

/// WASM-specific limits and constraints
mod wasm_limits {
    /// Maximum image dimension for WASM (lower than native due to memory constraints)
    pub const MAX_WASM_DIMENSION: u32 = 4096;
    
    /// Maximum total pixels for WASM (16MP)
    pub const MAX_WASM_PIXELS: u64 = 16_777_216;
    
    /// Maximum memory allocation for WASM (256MB)
    pub const MAX_WASM_MEMORY: usize = 268_435_456;
    
    /// Processing timeout for WASM (60 seconds)
    pub const WASM_TIMEOUT_SECONDS: u64 = 60;
}

/// Validate WASM-specific constraints on image data
fn validate_wasm_constraints(width: u32, height: u32) -> Result<(), JsValue> {
    // Check dimensions
    if width > wasm_limits::MAX_WASM_DIMENSION || height > wasm_limits::MAX_WASM_DIMENSION {
        return Err(JsValue::from_str(&format!(
            "Image dimensions {}x{} exceed WASM limit {}x{}", 
            width, height, 
            wasm_limits::MAX_WASM_DIMENSION, wasm_limits::MAX_WASM_DIMENSION
        )));
    }
    
    // Check total pixels
    let total_pixels = width as u64 * height as u64;
    if total_pixels > wasm_limits::MAX_WASM_PIXELS {
        return Err(JsValue::from_str(&format!(
            "Image size {} pixels exceeds WASM limit {} pixels",
            total_pixels, wasm_limits::MAX_WASM_PIXELS
        )));
    }
    
    // Check estimated memory usage (rough approximation)
    let estimated_memory = (total_pixels * 4 * 3) as usize; // RGBA + processing overhead
    if estimated_memory > wasm_limits::MAX_WASM_MEMORY {
        return Err(JsValue::from_str(&format!(
            "Estimated memory usage {} bytes exceeds WASM limit {} bytes",
            estimated_memory, wasm_limits::MAX_WASM_MEMORY
        )));
    }
    
    Ok(())
}

/// Validate and sanitize WASM logo configuration
fn sanitize_logo_config_for_wasm(config: &mut WasmLogoConfig) -> Result<(), JsValue> {
    // Clamp max_dimension to WASM limits
    if config.max_dimension > wasm_limits::MAX_WASM_DIMENSION {
        log::warn!("Clamping max_dimension from {} to {} for WASM", 
                  config.max_dimension, wasm_limits::MAX_WASM_DIMENSION);
        config.max_dimension = wasm_limits::MAX_WASM_DIMENSION;
    }
    
    // Validate threshold
    if config.threshold == 0 {
        return Err(JsValue::from_str("Threshold cannot be zero"));
    }
    
    // Validate morphology kernel size
    if config.morphology_kernel_size > 20 {
        log::warn!("Clamping morphology kernel size from {} to 20 for WASM", 
                  config.morphology_kernel_size);
        config.morphology_kernel_size = 20;
    }
    
    // Validate tolerance values
    if config.simplification_tolerance < 0.0 || config.simplification_tolerance > 50.0 {
        return Err(JsValue::from_str("Simplification tolerance out of range [0, 50]"));
    }
    
    if config.curve_tolerance < 0.0 || config.curve_tolerance > 50.0 {
        return Err(JsValue::from_str("Curve tolerance out of range [0, 50]"));
    }
    
    Ok(())
}

/// Validate and sanitize WASM regions configuration
fn sanitize_regions_config_for_wasm(config: &mut WasmRegionsConfig) -> Result<(), JsValue> {
    // Clamp max_dimension to WASM limits
    if config.max_dimension > wasm_limits::MAX_WASM_DIMENSION {
        log::warn!("Clamping max_dimension from {} to {} for WASM", 
                  config.max_dimension, wasm_limits::MAX_WASM_DIMENSION);
        config.max_dimension = wasm_limits::MAX_WASM_DIMENSION;
    }
    
    // Validate and clamp number of colors
    if config.num_colors == 0 {
        return Err(JsValue::from_str("Number of colors cannot be zero"));
    }
    if config.num_colors > 64 {
        log::warn!("Clamping num_colors from {} to 64 for WASM", config.num_colors);
        config.num_colors = 64;
    }
    
    // Validate iterations
    if config.max_iterations == 0 {
        return Err(JsValue::from_str("Max iterations cannot be zero"));
    }
    if config.max_iterations > 1000 {
        log::warn!("Clamping max_iterations from {} to 1000 for WASM", config.max_iterations);
        config.max_iterations = 1000;
    }
    
    // Validate convergence threshold
    if config.convergence_threshold <= 0.0 || config.convergence_threshold > 1.0 {
        return Err(JsValue::from_str("Convergence threshold out of range (0, 1]"));
    }
    
    Ok(())
}

/// Vectorize image using logo/line-art algorithm
///
/// # Arguments
/// * `image_data` - ImageData from HTML5 Canvas
/// * `config` - Logo vectorization configuration
///
/// # Returns
/// * `Result<String, JsValue>` - SVG string or error
///
/// # WASM Constraints
/// - Maximum image dimension: 4096x4096 pixels
/// - Maximum total pixels: 16MP
/// - Processing timeout: 60 seconds
/// - Memory limit: 256MB
#[wasm_bindgen]
pub fn vectorize_logo(image_data: &ImageData, config: &WasmLogoConfig) -> Result<String, JsValue> {
    utils::console_time("vectorize_logo");

    let width = image_data.width();
    let height = image_data.height();

    log::info!("Starting WASM logo vectorization for {}x{} image", width, height);

    // WASM-specific validation
    validate_wasm_constraints(width, height)?;
    
    // Validate and sanitize configuration for WASM
    let mut wasm_config = config.clone();
    sanitize_logo_config_for_wasm(&mut wasm_config)?;

    // Convert ImageData to ImageBuffer with validation
    let rgba_data = image_data.data();
    let rgba_vec = rgba_data.to_vec();
    
    // Validate data size
    let expected_size = (width * height * 4) as usize;
    if rgba_vec.len() != expected_size {
        return Err(JsValue::from_str(&format!(
            "ImageData size mismatch: expected {} bytes, got {}",
            expected_size, rgba_vec.len()
        )));
    }

    let img_buffer = ImageBuffer::from_raw(width, height, rgba_vec)
        .ok_or_else(|| JsValue::from_str("Failed to create image buffer from ImageData"))?;

    // Convert config
    let core_config: LogoConfig = wasm_config.into();

    // Perform vectorization with timeout protection
    let start_time = js_sys::Date::now();
    let result = vectorize_logo_rgba(&img_buffer, &core_config)
        .map_err(|e| {
            let error_msg = format!("Logo vectorization failed: {}", e);
            log::error!("{}", error_msg);
            JsValue::from_str(&error_msg)
        })?;
    
    let elapsed = js_sys::Date::now() - start_time;
    log::info!("Logo vectorization completed in {:.1}ms", elapsed);
    
    // Check for timeout (though we can't interrupt running code in WASM)
    if elapsed > (wasm_limits::WASM_TIMEOUT_SECONDS as f64 * 1000.0) {
        log::warn!("Processing took {:.1}ms, exceeding timeout of {}s", elapsed, wasm_limits::WASM_TIMEOUT_SECONDS);
    }

    utils::console_time_end("vectorize_logo");
    Ok(result)
}

/// Vectorize image using color regions algorithm
///
/// # Arguments
/// * `image_data` - ImageData from HTML5 Canvas
/// * `config` - Regions vectorization configuration
///
/// # Returns
/// * `Result<String, JsValue>` - SVG string or error
///
/// # WASM Constraints
/// - Maximum image dimension: 4096x4096 pixels
/// - Maximum total pixels: 16MP
/// - Maximum colors: 64 (vs 256 in native)
/// - Maximum iterations: 1000 (vs 10000 in native)
/// - Processing timeout: 60 seconds
/// - Memory limit: 256MB
#[wasm_bindgen]
pub fn vectorize_regions(
    image_data: &ImageData,
    config: &WasmRegionsConfig,
) -> Result<String, JsValue> {
    utils::console_time("vectorize_regions");

    let width = image_data.width();
    let height = image_data.height();

    log::info!(
        "Starting WASM regions vectorization for {}x{} image",
        width,
        height
    );

    // WASM-specific validation
    validate_wasm_constraints(width, height)?;
    
    // Validate and sanitize configuration for WASM
    let mut wasm_config = config.clone();
    sanitize_regions_config_for_wasm(&mut wasm_config)?;

    // Convert ImageData to ImageBuffer with validation
    let rgba_data = image_data.data();
    let rgba_vec = rgba_data.to_vec();
    
    // Validate data size
    let expected_size = (width * height * 4) as usize;
    if rgba_vec.len() != expected_size {
        return Err(JsValue::from_str(&format!(
            "ImageData size mismatch: expected {} bytes, got {}",
            expected_size, rgba_vec.len()
        )));
    }

    let img_buffer = ImageBuffer::from_raw(width, height, rgba_vec)
        .ok_or_else(|| JsValue::from_str("Failed to create image buffer from ImageData"))?;

    // Convert config
    let core_config: RegionsConfig = wasm_config.into();

    // Perform vectorization with timeout protection
    let start_time = js_sys::Date::now();
    let result = vectorize_regions_rgba(&img_buffer, &core_config)
        .map_err(|e| {
            let error_msg = format!("Regions vectorization failed: {}", e);
            log::error!("{}", error_msg);
            JsValue::from_str(&error_msg)
        })?;
    
    let elapsed = js_sys::Date::now() - start_time;
    log::info!("Regions vectorization completed in {:.1}ms", elapsed);
    
    // Check for timeout (though we can't interrupt running code in WASM)
    if elapsed > (wasm_limits::WASM_TIMEOUT_SECONDS as f64 * 1000.0) {
        log::warn!("Processing took {:.1}ms, exceeding timeout of {}s", elapsed, wasm_limits::WASM_TIMEOUT_SECONDS);
    }

    utils::console_time_end("vectorize_regions");
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

    // Get WebAssembly memory information if available
    // Note: Direct memory introspection not available in current wasm-bindgen version
    let memory_pages = 0u32; // Placeholder - would need js_sys::WebAssembly::Memory API
    let memory_bytes = 0u32;  // Placeholder - would need proper WASM memory API
    
    js_sys::Reflect::set(&obj, &"memory_pages".into(), &JsValue::from(memory_pages)).unwrap();
    js_sys::Reflect::set(&obj, &"memory_bytes".into(), &JsValue::from(memory_bytes)).unwrap();
    js_sys::Reflect::set(&obj, &"max_memory_bytes".into(), &JsValue::from(wasm_limits::MAX_WASM_MEMORY as u32)).unwrap();
    js_sys::Reflect::set(&obj, &"max_dimension".into(), &JsValue::from(wasm_limits::MAX_WASM_DIMENSION)).unwrap();
    js_sys::Reflect::set(&obj, &"max_pixels".into(), &JsValue::from(wasm_limits::MAX_WASM_PIXELS)).unwrap();

    obj
}

/// Validate image dimensions and data before processing
#[wasm_bindgen]
pub fn validate_image_for_wasm(width: u32, height: u32, data_length: u32) -> Result<(), JsValue> {
    validate_wasm_constraints(width, height)?;
    
    let expected_length = width * height * 4;
    if data_length != expected_length {
        return Err(JsValue::from_str(&format!(
            "Data length {} does not match expected {} for {}x{} RGBA image",
            data_length, expected_length, width, height
        )));
    }
    
    Ok(())
}

/// Check if processing would exceed memory limits
#[wasm_bindgen]
pub fn check_processing_feasible(width: u32, height: u32, num_colors: u32) -> Result<String, JsValue> {
    validate_wasm_constraints(width, height)?;
    
    let total_pixels = width as u64 * height as u64;
    let estimated_memory = (total_pixels * 4 * 3) as usize; // Base memory
    let clustering_memory = (total_pixels * num_colors as u64 * 8) as usize; // Clustering overhead
    
    let total_estimated = estimated_memory + clustering_memory;
    
    if total_estimated > wasm_limits::MAX_WASM_MEMORY {
        return Err(JsValue::from_str(&format!(
            "Processing {}x{} with {} colors would require ~{} bytes, exceeding limit {}",
            width, height, num_colors, total_estimated, wasm_limits::MAX_WASM_MEMORY
        )));
    }
    
    let feasibility_info = format!(
        "{{\"feasible\": true, \"estimated_memory\": {}, \"memory_limit\": {}, \"usage_percent\": {:.1}}}",
        total_estimated,
        wasm_limits::MAX_WASM_MEMORY,
        (total_estimated as f64 / wasm_limits::MAX_WASM_MEMORY as f64) * 100.0
    );
    
    Ok(feasibility_info)
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
