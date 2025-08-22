//! WebAssembly wrapper for vectorize-core
//!
//! This crate provides a comprehensive WebAssembly interface for the vec2art
//! vectorization algorithms with full ConfigBuilder support for web browsers.

mod capabilities;
mod error;
mod threading;
mod utils;

// Stub threading module disabled - using real threading module now
// mod threading_stubs { ... }

use crate::error::ErrorRecoveryManager;
use image::ImageBuffer;
use js_sys::Function;
use serde::{Deserialize, Serialize};
use std::sync::{LazyLock, Mutex};
use vectorize_core::{
    algorithms::TraceBackend, config_builder::ConfigBuilder, vectorize_trace_low_rgba,
};
use wasm_bindgen::prelude::*;
use web_sys::ImageData;

// Re-export wasm-bindgen-rayon init function for JavaScript
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub use wasm_bindgen_rayon::init_thread_pool as initThreadPool;


// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator for smaller wasm binary size
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Global error recovery manager
static ERROR_RECOVERY_MANAGER: Mutex<Option<ErrorRecoveryManager>> = Mutex::new(None);

/// Global threading state tracking
static THREADING_STATE: LazyLock<Mutex<ThreadingState>> = LazyLock::new(|| {
    Mutex::new(ThreadingState {
        mode: PerformanceMode::Unknown,
        fallback_reason: None,
        last_init_time_ms: None,
    })
});

/// Threading performance mode
#[derive(Debug, Clone, PartialEq)]
pub enum PerformanceMode {
    Unknown,
    MultiThreaded,
    SingleThreaded,
    Fallback,
}

/// Threading state information
#[derive(Debug, Clone)]
struct ThreadingState {
    mode: PerformanceMode,
    fallback_reason: Option<String>,
    last_init_time_ms: Option<f64>,
}


/// Initialize the wasm module with basic setup
#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();

    // Initialize logging for web console (ignore failures in Node.js)
    let _ = console_log::init_with_level(log::Level::Info);

    // Initialize error recovery manager
    if let Ok(mut manager) = ERROR_RECOVERY_MANAGER.lock() {
        *manager = Some(ErrorRecoveryManager::new(3, 1000)); // 3 retries, 1000ms base delay
    }

    // Log threading status
    #[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
    {
        log::info!("WASM parallel feature enabled - use start() to initialize threading");
        update_threading_state(
            PerformanceMode::MultiThreaded,
            None,
            None,
        );
    }

    #[cfg(not(all(target_arch = "wasm32", feature = "wasm-parallel")))]
    {
        log::info!("WASM parallel feature not enabled, using single-threaded execution");
        update_threading_state(
            PerformanceMode::SingleThreaded,
            Some("Feature not enabled".to_string()),
            None,
        );
    }

    log::info!("vectorize-wasm initialized with fallback support");
}

/// Initialize the thread pool for WASM parallel processing
/// This must be called from JavaScript before using any parallel functions
#[wasm_bindgen]
pub async fn start() -> Result<(), JsValue> {
    #[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
    {
        use wasm_bindgen_futures::JsFuture;
        
        // Get the hardware concurrency from the browser
        let thread_count = web_sys::window()
            .and_then(|w| Some(w.navigator().hardware_concurrency() as usize))
            .unwrap_or(1);
        
        let thread_count = std::cmp::max(1, std::cmp::min(16, thread_count)); // Clamp to reasonable bounds
        
        log::info!("Initializing WASM thread pool with {} threads", thread_count);
        
        // Initialize the thread pool - convert Promise to Future
        let promise = wasm_bindgen_rayon::init_thread_pool(thread_count);
        JsFuture::from(promise)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to initialize thread pool: {:?}", e)))?;
        
        log::info!("WASM thread pool initialized successfully");
        
        update_threading_state(
            PerformanceMode::MultiThreaded,
            None,
            Some(js_sys::Date::now()),
        );
    }
    
    #[cfg(not(all(target_arch = "wasm32", feature = "wasm-parallel")))]
    {
        log::info!("WASM parallel feature not enabled, using single-threaded execution");
        update_threading_state(
            PerformanceMode::SingleThreaded,
            Some("Feature not enabled".to_string()),
            None,
        );
    }
    
    Ok(())
}




/// Update global threading state
fn update_threading_state(mode: PerformanceMode, reason: Option<String>, init_time: Option<f64>) {
    if let Ok(mut state) = THREADING_STATE.lock() {
        state.mode = mode;
        state.fallback_reason = reason;
        state.last_init_time_ms = init_time;
    }
}


/// Available presets for JavaScript interaction
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub enum WasmPreset {
    LineArt,
    Sketch,
    Technical,
    DenseStippling,
    Pointillism,
    SparseDots,
    FineStippling,
    BoldArtistic,
}

/// Available backends for JavaScript interaction
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub enum WasmBackend {
    Edge,
    Centerline,
    Superpixel,
    Dots,
}

/// Progress information passed to JavaScript callbacks
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmProgress {
    percent: f32,
    message: String,
    stage: String,
}

#[wasm_bindgen]
impl WasmProgress {
    #[wasm_bindgen(getter)]
    pub fn percent(&self) -> f32 {
        self.percent
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn stage(&self) -> String {
        self.stage.clone()
    }
}

/// Configuration data for serialization/deserialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigData {
    backend: String,
    detail: f32,
    stroke_width: f32,
    multipass: bool,
    pass_count: u32,
    conservative_detail: Option<f32>,
    aggressive_detail: Option<f32>,
    noise_filtering: bool,
    reverse_pass: bool,
    diagonal_pass: bool,
    directional_threshold: f32,
    max_processing_time_ms: u64,
    // Dot-specific
    dot_density: f32,
    dot_min_radius: f32,
    dot_max_radius: f32,
    preserve_colors: bool,
    adaptive_sizing: bool,
    background_tolerance: f32,
    poisson_disk_sampling: bool,
    gradient_based_sizing: bool,
    // Hand-drawn
    hand_drawn_preset: Option<String>,
    custom_tremor: Option<f32>,
    custom_variable_weights: Option<f32>,
    custom_tapering: Option<f32>,
    // Advanced
    enable_etf_fdog: bool,
    enable_flow_tracing: bool,
    enable_bezier_fitting: bool,
    // Superpixel-specific
    num_superpixels: u32,
    superpixel_compactness: f32,
    superpixel_slic_iterations: u32,
    superpixel_fill_regions: bool,
    superpixel_stroke_regions: bool,
    superpixel_simplify_boundaries: bool,
    superpixel_boundary_epsilon: f32,
    // Safety and optimization
    max_image_size: u32,
    svg_precision: u8,
}

/// Main WebAssembly vectorizer struct wrapping ConfigBuilder
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WasmVectorizer {
    builder: ConfigBuilder,
    thread_count: Option<usize>,
}

#[wasm_bindgen]
impl WasmVectorizer {
    /// Create a new WasmVectorizer with default configuration
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            builder: ConfigBuilder::new(),
            thread_count: None,
        }
    }

    // Preset configuration methods

    /// Apply a preset configuration by name
    /// Available presets: "line_art", "sketch", "technical", "dots_dense", "dots_pointillism", "dots_sparse", "dots_fine", "dots_bold"
    #[wasm_bindgen]
    pub fn use_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        let new_builder = match preset {
            "line_art" => ConfigBuilder::for_line_art(),
            "sketch" => ConfigBuilder::for_sketch(),
            "technical" => ConfigBuilder::for_technical(),
            "dots_dense" => ConfigBuilder::for_dense_stippling(),
            "dots_pointillism" => ConfigBuilder::for_pointillism(),
            "dots_sparse" => ConfigBuilder::for_sparse_dots(),
            "dots_fine" => ConfigBuilder::for_fine_stippling(),
            "dots_bold" => ConfigBuilder::for_bold_artistic(),
            _ => return Err(JsValue::from_str(&format!(
                "Unknown preset: {}. Available presets: line_art, sketch, technical, dots_dense, dots_pointillism, dots_sparse, dots_fine, dots_bold", 
                preset
            ))),
        };
        self.builder = new_builder;
        Ok(())
    }

    // Backend configuration

    /// Set the tracing backend: "edge", "centerline", "superpixel", or "dots"
    #[wasm_bindgen]
    pub fn set_backend(&mut self, backend: &str) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .backend_by_name(backend)
            .map_err(|e| JsValue::from_str(&format!("Backend error: {e}")))?;
        Ok(())
    }

    /// Get the current backend
    #[wasm_bindgen]
    pub fn get_backend(&self) -> String {
        let config = self.builder.clone().build().unwrap_or_default();
        match config.backend {
            TraceBackend::Edge => "edge".to_string(),
            TraceBackend::Centerline => "centerline".to_string(),
            TraceBackend::Superpixel => "superpixel".to_string(),
            TraceBackend::Dots => "dots".to_string(),
        }
    }

    // Core parameters

    /// Set detail level (0.0 = sparse, 1.0 = detailed)
    #[wasm_bindgen]
    pub fn set_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .detail(detail)
            .map_err(|e| JsValue::from_str(&format!("Detail error: {e}")))?;
        Ok(())
    }

    /// Get current detail level
    #[wasm_bindgen]
    pub fn get_detail(&self) -> f32 {
        self.builder.clone().build().unwrap_or_default().detail
    }

    /// Set stroke width at 1080p reference resolution
    #[wasm_bindgen]
    pub fn set_stroke_width(&mut self, width: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .stroke_width(width)
            .map_err(|e| JsValue::from_str(&format!("Stroke width error: {e}")))?;
        Ok(())
    }

    /// Get current stroke width
    #[wasm_bindgen]
    pub fn get_stroke_width(&self) -> f32 {
        self.builder
            .clone()
            .build()
            .unwrap_or_default()
            .stroke_px_at_1080p
    }

    // Processing options

    /// Enable or disable multipass processing
    #[wasm_bindgen]
    pub fn set_multipass(&mut self, enabled: bool) {
        self.builder = self.builder.clone().multipass(enabled);
    }

    /// Get multipass setting
    #[wasm_bindgen]
    pub fn get_multipass(&self) -> bool {
        self.builder
            .clone()
            .build()
            .unwrap_or_default()
            .enable_multipass
    }

    /// Set number of processing passes (1-10)
    #[wasm_bindgen]
    pub fn set_pass_count(&mut self, count: u32) -> Result<(), String> {
        self.builder = self.builder.clone().pass_count(count)
            .map_err(|e| format!("Invalid pass count: {}", e))?;
        Ok(())
    }

    /// Get number of processing passes
    #[wasm_bindgen]
    pub fn get_pass_count(&self) -> u32 {
        self.builder
            .clone()
            .build()
            .unwrap_or_default()
            .pass_count
    }

    /// Enable or disable noise filtering
    #[wasm_bindgen]
    pub fn set_noise_filtering(&mut self, enabled: bool) {
        self.builder = self.builder.clone().noise_filtering(enabled);
    }

    /// Enable or disable reverse pass
    #[wasm_bindgen]
    pub fn set_reverse_pass(&mut self, enabled: bool) {
        self.builder = self.builder.clone().reverse_pass(enabled);
    }

    /// Enable or disable diagonal pass
    #[wasm_bindgen]
    pub fn set_diagonal_pass(&mut self, enabled: bool) {
        self.builder = self.builder.clone().diagonal_pass(enabled);
    }

    /// Set conservative detail level for first pass in multipass processing
    #[wasm_bindgen]
    pub fn set_conservative_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .conservative_detail(Some(detail))
            .map_err(|e| JsValue::from_str(&format!("Conservative detail error: {e}")))?;
        Ok(())
    }

    /// Set aggressive detail level for second pass in multipass processing
    #[wasm_bindgen]
    pub fn set_aggressive_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .aggressive_detail(Some(detail))
            .map_err(|e| JsValue::from_str(&format!("Aggressive detail error: {e}")))?;
        Ok(())
    }

    /// Set directional strength threshold for directional passes
    #[wasm_bindgen]
    pub fn set_directional_strength_threshold(&mut self, threshold: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .directional_threshold(threshold)
            .map_err(|e| JsValue::from_str(&format!("Directional threshold error: {e}")))?;
        Ok(())
    }

    // Dot-specific parameters

    /// Set dot density (0.0 = very sparse, 1.0 = very dense)
    #[wasm_bindgen]
    pub fn set_dot_density(&mut self, density: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .dot_density(density)
            .map_err(|e| JsValue::from_str(&format!("Dot density error: {e}")))?;
        Ok(())
    }

    /// Set dot size range with minimum and maximum radius
    #[wasm_bindgen]
    pub fn set_dot_size_range(&mut self, min_radius: f32, max_radius: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .dot_size_range(min_radius, max_radius)
            .map_err(|e| JsValue::from_str(&format!("Dot size range error: {e}")))?;
        Ok(())
    }

    /// Enable or disable color preservation in dots
    #[wasm_bindgen]
    pub fn set_preserve_colors(&mut self, enabled: bool) {
        self.builder = self.builder.clone().preserve_colors(enabled);
    }

    /// Enable or disable adaptive dot sizing
    #[wasm_bindgen]
    pub fn set_adaptive_sizing(&mut self, enabled: bool) {
        self.builder = self.builder.clone().adaptive_sizing(enabled);
    }

    /// Enable or disable Poisson disk sampling for natural dot distribution
    #[wasm_bindgen]
    pub fn set_poisson_disk_sampling(&mut self, enabled: bool) {
        self.builder = self.builder.clone().set_poisson_disk_sampling(enabled);
    }

    /// Enable or disable gradient-based sizing for dot scaling based on local image gradients
    #[wasm_bindgen]
    pub fn set_gradient_based_sizing(&mut self, enabled: bool) {
        self.builder = self.builder.clone().set_gradient_based_sizing(enabled);
    }

    /// Set background tolerance for automatic background detection
    #[wasm_bindgen]
    pub fn set_background_tolerance(&mut self, tolerance: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .background_tolerance(tolerance)
            .map_err(|e| JsValue::from_str(&format!("Background tolerance error: {e}")))?;
        Ok(())
    }

    // Hand-drawn aesthetics

    /// Set hand-drawn preset: "none", "subtle", "medium", "strong", or "sketchy"
    #[wasm_bindgen]
    pub fn set_hand_drawn_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .hand_drawn_preset(preset)
            .map_err(|e| JsValue::from_str(&format!("Hand-drawn preset error: {e}")))?;
        Ok(())
    }

    /// Set custom tremor strength (overrides preset)
    #[wasm_bindgen]
    pub fn set_custom_tremor(&mut self, tremor: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .custom_tremor(tremor)
            .map_err(|e| JsValue::from_str(&format!("Custom tremor error: {e}")))?;
        Ok(())
    }

    /// Set custom variable weights (overrides preset)
    #[wasm_bindgen]
    pub fn set_custom_variable_weights(&mut self, weights: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .custom_variable_weights(weights)
            .map_err(|e| JsValue::from_str(&format!("Custom variable weights error: {e}")))?;
        Ok(())
    }

    /// Set custom tapering strength (overrides preset)
    #[wasm_bindgen]
    pub fn set_custom_tapering(&mut self, tapering: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .custom_tapering(tapering)
            .map_err(|e| JsValue::from_str(&format!("Custom tapering error: {e}")))?;
        Ok(())
    }

    // Advanced options

    /// Enable ETF/FDoG advanced edge detection
    #[wasm_bindgen]
    pub fn set_enable_etf_fdog(&mut self, enabled: bool) {
        self.builder = self.builder.clone().enable_etf_fdog(enabled);
    }

    /// Enable flow-guided tracing (requires ETF/FDoG)
    #[wasm_bindgen]
    pub fn set_enable_flow_tracing(&mut self, enabled: bool) {
        self.builder = self.builder.clone().enable_flow_tracing(enabled);
    }

    /// Enable Bézier curve fitting (requires flow tracing)
    #[wasm_bindgen]
    pub fn set_enable_bezier_fitting(&mut self, enabled: bool) {
        self.builder = self.builder.clone().enable_bezier_fitting(enabled);
    }

    /// Set maximum processing time in milliseconds
    #[wasm_bindgen]
    pub fn set_max_processing_time_ms(&mut self, time_ms: u64) {
        self.builder = self.builder.clone().max_processing_time_ms(time_ms);
    }

    // Noise filtering configuration

    /// Set spatial sigma for bilateral noise filtering (0.5-5.0, higher = more smoothing)
    #[wasm_bindgen]
    pub fn set_noise_filter_spatial_sigma(&mut self, sigma: f32) -> Result<(), JsValue> {
        if sigma < 0.5 || sigma > 5.0 {
            return Err(JsValue::from_str(&format!("Spatial sigma {} out of range [0.5, 5.0]", sigma)));
        }
        self.builder = self.builder.clone().noise_filter_spatial_sigma(sigma);
        Ok(())
    }

    /// Set range sigma for bilateral noise filtering (10.0-100.0, higher = less edge preservation)
    #[wasm_bindgen]
    pub fn set_noise_filter_range_sigma(&mut self, sigma: f32) -> Result<(), JsValue> {
        if sigma < 10.0 || sigma > 100.0 {
            return Err(JsValue::from_str(&format!("Range sigma {} out of range [10.0, 100.0]", sigma)));
        }
        self.builder = self.builder.clone().noise_filter_range_sigma(sigma);
        Ok(())
    }

    // Centerline-specific configuration

    /// Enable or disable adaptive thresholding for centerline backend
    #[wasm_bindgen]
    pub fn set_enable_adaptive_threshold(&mut self, enabled: bool) {
        self.builder = self.builder.clone().enable_adaptive_threshold(enabled);
    }

    /// Set window size for adaptive thresholding (15-50 pixels)
    #[wasm_bindgen]
    pub fn set_window_size(&mut self, size: u32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .window_size(size)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Set sensitivity parameter k for Sauvola thresholding (0.1-1.0)
    #[wasm_bindgen]
    pub fn set_sensitivity_k(&mut self, k: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .sensitivity_k(k)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Set minimum branch length for centerline tracing (4-24 pixels)
    #[wasm_bindgen]
    pub fn set_min_branch_length(&mut self, length: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .min_branch_length(length)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Set Douglas-Peucker epsilon for path simplification (0.5-3.0)
    #[wasm_bindgen]
    pub fn set_douglas_peucker_epsilon(&mut self, epsilon: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .douglas_peucker_epsilon(epsilon)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Enable or disable width modulation for centerline SVG strokes
    #[wasm_bindgen]
    pub fn set_enable_width_modulation(&mut self, enabled: bool) {
        self.builder = self.builder.clone().enable_width_modulation(enabled);
    }

    // Superpixel-specific configuration

    /// Set number of superpixels to generate (20-1000)
    #[wasm_bindgen]
    pub fn set_num_superpixels(&mut self, num: u32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .num_superpixels(num)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Set SLIC compactness parameter (1.0-50.0)
    /// Higher values create more regular shapes, lower values follow color similarity more closely
    #[wasm_bindgen]
    pub fn set_compactness(&mut self, compactness: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .compactness(compactness)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Set SLIC iterations for convergence (5-15)
    #[wasm_bindgen]
    pub fn set_slic_iterations(&mut self, iterations: u32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .slic_iterations(iterations)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Enable or disable filled superpixel regions
    #[wasm_bindgen]
    pub fn set_fill_regions(&mut self, enabled: bool) {
        self.builder = self.builder.clone().fill_regions(enabled);
    }

    /// Enable or disable superpixel region boundary strokes
    #[wasm_bindgen]
    pub fn set_stroke_regions(&mut self, enabled: bool) {
        self.builder = self.builder.clone().stroke_regions(enabled);
    }

    /// Enable or disable boundary path simplification
    #[wasm_bindgen]
    pub fn set_simplify_boundaries(&mut self, enabled: bool) {
        self.builder = self.builder.clone().simplify_boundaries(enabled);
    }

    /// Set boundary simplification tolerance (0.5-3.0)
    #[wasm_bindgen]
    pub fn set_boundary_epsilon(&mut self, epsilon: f32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .boundary_epsilon(epsilon)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    // Safety and optimization parameters

    /// Set maximum image size before automatic resizing (512-8192 pixels)
    /// Images larger than this will be automatically resized to prevent memory/timeout issues
    #[wasm_bindgen]
    pub fn set_max_image_size(&mut self, size: u32) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .max_image_size(size)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Get current maximum image size setting
    #[wasm_bindgen]
    pub fn get_max_image_size(&self) -> u32 {
        self.builder
            .clone()
            .build()
            .unwrap_or_default()
            .max_image_size
    }

    /// Set SVG coordinate precision in decimal places (0-4)
    /// Higher precision = larger file size but better quality. 0 = integers only.
    #[wasm_bindgen]
    pub fn set_svg_precision(&mut self, precision: u8) -> Result<(), JsValue> {
        self.builder = self
            .builder
            .clone()
            .svg_precision(precision)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Get current SVG precision setting
    #[wasm_bindgen]
    pub fn get_svg_precision(&self) -> u8 {
        self.builder
            .clone()
            .build()
            .unwrap_or_default()
            .svg_precision
    }

    // Output optimization settings (placeholders for future implementation)

    /// Enable or disable SVG output optimization (NOT YET IMPLEMENTED)
    /// This is a placeholder for future implementation
    #[wasm_bindgen]
    pub fn set_optimize_svg(&mut self, _enabled: bool) -> Result<(), JsValue> {
        log::warn!("SVG optimization is not yet implemented - this setting has no effect");
        // TODO: Implement SVG optimization in core library
        Ok(())
    }

    /// Enable or disable metadata inclusion in SVG output (NOT YET IMPLEMENTED)
    /// This is a placeholder for future implementation
    #[wasm_bindgen]
    pub fn set_include_metadata(&mut self, _enabled: bool) -> Result<(), JsValue> {
        log::warn!("Metadata inclusion is not yet implemented - this setting has no effect");
        // TODO: Implement metadata inclusion in core library
        Ok(())
    }

    // Threading configuration

    /// Set the thread count for this vectorizer instance
    /// Note: Thread pool must be initialized from JavaScript using initThreadPool()
    #[wasm_bindgen]
    pub fn set_thread_count(&mut self, thread_count: Option<u32>) -> Result<(), JsValue> {
        let thread_count_usize = thread_count.map(|c| c as usize);

        // Store the thread count preference
        self.thread_count = thread_count_usize;

        log::info!(
            "Thread count preference set to: {:?}. Use initThreadPool() from JavaScript to initialize.",
            thread_count_usize
        );

        Ok(())
    }

    /// Get the current thread count for this vectorizer
    #[wasm_bindgen]
    pub fn get_thread_count(&self) -> u32 {
        self.thread_count
            .unwrap_or_else(|| threading::get_thread_count()) as u32
    }

    // Validation

    /// Validate current configuration
    #[wasm_bindgen]
    pub fn validate_config(&self) -> Result<(), JsValue> {
        self.builder
            .clone()
            .build()
            .map_err(|e| JsValue::from_str(&format!("Configuration validation failed: {e}")))?;
        Ok(())
    }

    // Main processing function

    /// Vectorize an image with the current configuration
    #[wasm_bindgen]
    pub fn vectorize(&self, image_data: &ImageData) -> Result<String, JsValue> {
        self.vectorize_with_progress(image_data, None)
    }

    /// Vectorize an image with progress callbacks
    #[wasm_bindgen]
    pub fn vectorize_with_progress(
        &self,
        image_data: &ImageData,
        callback: Option<Function>,
    ) -> Result<String, JsValue> {
        utils::console_time("vectorize_with_progress");

        let width = image_data.width();
        let height = image_data.height();
        let data = image_data.data();

        log::info!("Starting vectorization: {}x{} image", width, height);

        // Report progress: Starting
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                percent: 0.0,
                message: "Starting vectorization...".to_string(),
                stage: "initialization".to_string(),
            };
            let js_progress = serde_wasm_bindgen::to_value(&progress)
                .map_err(|e| JsValue::from_str(&format!("Progress serialization error: {e}")))?;
            let _ = cb.call1(&JsValue::NULL, &js_progress);
        }

        // Build configuration
        let config = self
            .builder
            .clone()
            .build()
            .map_err(|e| JsValue::from_str(&format!("Configuration build failed: {e}")))?;

        // Report progress: Configuration built
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                percent: 10.0,
                message: "Configuration validated".to_string(),
                stage: "configuration".to_string(),
            };
            let js_progress = serde_wasm_bindgen::to_value(&progress)
                .map_err(|e| JsValue::from_str(&format!("Progress serialization error: {e}")))?;
            let _ = cb.call1(&JsValue::NULL, &js_progress);
        }

        // Convert image data
        let pixels = data.to_vec();
        let img_buffer = ImageBuffer::from_raw(width, height, pixels)
            .ok_or_else(|| JsValue::from_str("Failed to create image buffer"))?;

        // Report progress: Image processed
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                percent: 20.0,
                message: "Image data processed".to_string(),
                stage: "preprocessing".to_string(),
            };
            let js_progress = serde_wasm_bindgen::to_value(&progress)
                .map_err(|e| JsValue::from_str(&format!("Progress serialization error: {e}")))?;
            let _ = cb.call1(&JsValue::NULL, &js_progress);
        }

        log::debug!("Config: {:?}", config);

        // Report progress: Starting vectorization
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                percent: 30.0,
                message: format!(
                    "Running {} backend...",
                    match config.backend {
                        TraceBackend::Edge => "edge detection",
                        TraceBackend::Centerline => "centerline extraction",
                        TraceBackend::Superpixel => "superpixel segmentation",
                        TraceBackend::Dots => "dot mapping",
                    }
                ),
                stage: "vectorization".to_string(),
            };
            let js_progress = serde_wasm_bindgen::to_value(&progress)
                .map_err(|e| JsValue::from_str(&format!("Progress serialization error: {e}")))?;
            let _ = cb.call1(&JsValue::NULL, &js_progress);
        }

        // Run vectorization
        let result = vectorize_trace_low_rgba(&img_buffer, &config)
            .map_err(|e| JsValue::from_str(&format!("Vectorization failed: {e}")))?;

        // Report progress: Complete
        if let Some(ref cb) = callback {
            let svg_size = result.len();
            let progress = WasmProgress {
                percent: 100.0,
                message: format!("Vectorization complete: {} bytes", svg_size),
                stage: "complete".to_string(),
            };
            let js_progress = serde_wasm_bindgen::to_value(&progress)
                .map_err(|e| JsValue::from_str(&format!("Progress serialization error: {e}")))?;
            let _ = cb.call1(&JsValue::NULL, &js_progress);
        }

        let svg_size = result.len();
        log::info!("Vectorization complete: {} bytes", svg_size);

        if svg_size > 1024 * 1024 {
            log::warn!(
                "Large SVG output: {} MB",
                svg_size as f64 / (1024.0 * 1024.0)
            );
        }

        utils::console_time_end("vectorize_with_progress");

        Ok(result)
    }

    // Configuration export/import

    /// Export current configuration as JSON string
    #[wasm_bindgen]
    pub fn export_config(&self) -> Result<String, JsValue> {
        let config = self
            .builder
            .clone()
            .build()
            .map_err(|e| JsValue::from_str(&format!("Config build failed: {e}")))?;

        let config_data = ConfigData {
            backend: match config.backend {
                TraceBackend::Edge => "edge".to_string(),
                TraceBackend::Centerline => "centerline".to_string(),
                TraceBackend::Superpixel => "superpixel".to_string(),
                TraceBackend::Dots => "dots".to_string(),
            },
            detail: config.detail,
            stroke_width: config.stroke_px_at_1080p,
            multipass: config.enable_multipass,
            pass_count: config.pass_count,
            conservative_detail: config.conservative_detail,
            aggressive_detail: config.aggressive_detail,
            noise_filtering: config.noise_filtering,
            reverse_pass: config.enable_reverse_pass,
            diagonal_pass: config.enable_diagonal_pass,
            directional_threshold: config.directional_strength_threshold,
            max_processing_time_ms: config.max_processing_time_ms,
            dot_density: config.dot_density_threshold,
            dot_min_radius: config.dot_min_radius,
            dot_max_radius: config.dot_max_radius,
            preserve_colors: config.dot_preserve_colors,
            adaptive_sizing: config.dot_adaptive_sizing,
            background_tolerance: config.dot_background_tolerance,
            poisson_disk_sampling: config.dot_poisson_disk_sampling,
            gradient_based_sizing: config.dot_gradient_based_sizing,
            hand_drawn_preset: None, // TODO: Extract from builder if possible
            custom_tremor: None,     // TODO: Extract from builder if possible
            custom_variable_weights: None, // TODO: Extract from builder if possible
            custom_tapering: None,   // TODO: Extract from builder if possible
            enable_etf_fdog: config.enable_etf_fdog,
            enable_flow_tracing: config.enable_flow_tracing,
            enable_bezier_fitting: config.enable_bezier_fitting,
            // Superpixel parameters
            num_superpixels: config.num_superpixels,
            superpixel_compactness: config.superpixel_compactness,
            superpixel_slic_iterations: config.superpixel_slic_iterations,
            superpixel_fill_regions: config.superpixel_fill_regions,
            superpixel_stroke_regions: config.superpixel_stroke_regions,
            superpixel_simplify_boundaries: config.superpixel_simplify_boundaries,
            superpixel_boundary_epsilon: config.superpixel_boundary_epsilon,
            // Safety and optimization parameters
            max_image_size: config.max_image_size,
            svg_precision: config.svg_precision,
        };

        serde_json::to_string(&config_data)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization failed: {e}")))
    }

    /// Import configuration from JSON string
    #[wasm_bindgen]
    pub fn import_config(&mut self, json: &str) -> Result<(), JsValue> {
        let config_data: ConfigData = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("JSON parsing failed: {e}")))?;

        // Rebuild the configuration from imported data
        let mut builder = ConfigBuilder::new()
            .backend_by_name(&config_data.backend)
            .map_err(|e| JsValue::from_str(&format!("Backend error: {e}")))?
            .detail(config_data.detail)
            .map_err(|e| JsValue::from_str(&format!("Detail error: {e}")))?
            .stroke_width(config_data.stroke_width)
            .map_err(|e| JsValue::from_str(&format!("Stroke width error: {e}")))?
            .multipass(config_data.multipass)
            .pass_count(config_data.pass_count)
            .map_err(|e| JsValue::from_str(&format!("Pass count error: {e}")))?
            .noise_filtering(config_data.noise_filtering)
            .reverse_pass(config_data.reverse_pass)
            .diagonal_pass(config_data.diagonal_pass)
            .directional_threshold(config_data.directional_threshold)
            .map_err(|e| JsValue::from_str(&format!("Directional threshold error: {e}")))?
            .max_processing_time_ms(config_data.max_processing_time_ms)
            .dot_density(config_data.dot_density)
            .map_err(|e| JsValue::from_str(&format!("Dot density error: {e}")))?
            .dot_size_range(config_data.dot_min_radius, config_data.dot_max_radius)
            .map_err(|e| JsValue::from_str(&format!("Dot size range error: {e}")))?
            .preserve_colors(config_data.preserve_colors)
            .adaptive_sizing(config_data.adaptive_sizing)
            .background_tolerance(config_data.background_tolerance)
            .map_err(|e| JsValue::from_str(&format!("Background tolerance error: {e}")))?
            .set_poisson_disk_sampling(config_data.poisson_disk_sampling)
            .set_gradient_based_sizing(config_data.gradient_based_sizing)
            .enable_etf_fdog(config_data.enable_etf_fdog)
            .enable_flow_tracing(config_data.enable_flow_tracing)
            .enable_bezier_fitting(config_data.enable_bezier_fitting);

        // Apply superpixel parameters
        builder = builder
            .num_superpixels(config_data.num_superpixels)
            .map_err(|e| JsValue::from_str(&format!("Num superpixels error: {e}")))?
            .compactness(config_data.superpixel_compactness)
            .map_err(|e| JsValue::from_str(&format!("Compactness error: {e}")))?
            .slic_iterations(config_data.superpixel_slic_iterations)
            .map_err(|e| JsValue::from_str(&format!("SLIC iterations error: {e}")))?
            .fill_regions(config_data.superpixel_fill_regions)
            .stroke_regions(config_data.superpixel_stroke_regions)
            .simplify_boundaries(config_data.superpixel_simplify_boundaries)
            .boundary_epsilon(config_data.superpixel_boundary_epsilon)
            .map_err(|e| JsValue::from_str(&format!("Boundary epsilon error: {e}")))?
            .max_image_size(config_data.max_image_size)
            .map_err(|e| JsValue::from_str(&format!("Max image size error: {e}")))?
            .svg_precision(config_data.svg_precision)
            .map_err(|e| JsValue::from_str(&format!("SVG precision error: {e}")))?;

        // Apply conservative/aggressive detail if present
        if let Some(conservative) = config_data.conservative_detail {
            builder = builder
                .conservative_detail(Some(conservative))
                .map_err(|e| JsValue::from_str(&format!("Conservative detail error: {e}")))?;
        }

        if let Some(aggressive) = config_data.aggressive_detail {
            builder = builder
                .aggressive_detail(Some(aggressive))
                .map_err(|e| JsValue::from_str(&format!("Aggressive detail error: {e}")))?;
        }

        // Apply hand-drawn settings if present
        if let Some(preset) = &config_data.hand_drawn_preset {
            if preset != "none" {
                builder = builder
                    .hand_drawn_preset(preset)
                    .map_err(|e| JsValue::from_str(&format!("Hand-drawn preset error: {e}")))?;
            }
        }

        if let Some(tremor) = config_data.custom_tremor {
            builder = builder
                .custom_tremor(tremor)
                .map_err(|e| JsValue::from_str(&format!("Custom tremor error: {e}")))?;
        }

        if let Some(weights) = config_data.custom_variable_weights {
            builder = builder
                .custom_variable_weights(weights)
                .map_err(|e| JsValue::from_str(&format!("Custom variable weights error: {e}")))?;
        }

        if let Some(tapering) = config_data.custom_tapering {
            builder = builder
                .custom_tapering(tapering)
                .map_err(|e| JsValue::from_str(&format!("Custom tapering error: {e}")))?;
        }

        self.builder = builder;
        Ok(())
    }
}

/// Get available backends for trace-low algorithm
#[wasm_bindgen]
pub fn get_available_backends() -> Vec<JsValue> {
    vec![
        JsValue::from_str("edge"),
        JsValue::from_str("centerline"),
        JsValue::from_str("superpixel"),
        JsValue::from_str("dots"),
    ]
}

/// Get available presets for configuration
#[wasm_bindgen]
pub fn get_available_presets() -> Vec<JsValue> {
    vec![
        JsValue::from_str("line_art"),
        JsValue::from_str("sketch"),
        JsValue::from_str("technical"),
        JsValue::from_str("dots_fine"),
        JsValue::from_str("dots_medium"),
        JsValue::from_str("dots_large"),
        JsValue::from_str("pointillism"),
        JsValue::from_str("sparse_artistic"),
    ]
}

/// Get description for a specific preset
#[wasm_bindgen]
pub fn get_preset_description(preset: &str) -> Result<String, JsValue> {
    let description = match preset {
        "line_art" => "Clean, detailed line art with precise edges and smooth curves",
        "sketch" => "Hand-drawn sketch style with organic, loose line quality",
        "technical" => "High-precision technical drawing with maximum detail capture",
        "dots_fine" => "Fine stippling effect with dense, small dots for detailed textures",
        "dots_medium" => "Medium artistic dots balancing detail and visual impact",
        "dots_large" => "Large artistic dots with bold, expressive point placement",
        "pointillism" => "Classic pointillism style with colorful, varied dot sizes",
        "sparse_artistic" => "Sparse, dramatic dots with artistic emphasis on key features",
        _ => return Err(JsValue::from_str(&format!("Unknown preset: {preset}"))),
    };
    Ok(description.to_string())
}

// ==============================================================================
// Global Threading Control Functions
// ==============================================================================

/// Legacy function - use initThreadPool() directly from JavaScript instead
/// This is kept for compatibility but just logs a warning
#[wasm_bindgen]
pub fn init_threading(_num_threads: Option<u32>) -> JsValue {
    log::warn!("init_threading() is deprecated. Use initThreadPool() directly from the WASM exports.");
    
    // Return a resolved promise for compatibility
    #[cfg(target_arch = "wasm32")]
    return js_sys::Promise::resolve(&JsValue::from_str("use initThreadPool instead")).into();
    
    #[cfg(not(target_arch = "wasm32"))]
    JsValue::from_str("use initThreadPool instead")
}

impl Default for WasmVectorizer {
    fn default() -> Self {
        Self::new()
    }
}

/// Check if threading is supported and active in the current environment
///
/// # Returns
/// * `true` if multi-threading is available and working, `false` otherwise
#[wasm_bindgen]
pub fn is_threading_supported() -> bool {
    threading::is_threading_active()
}

/// Get the current number of threads available for parallel processing
///
/// # Returns
/// * Number of threads available (1 if single-threaded)
#[wasm_bindgen]
pub fn get_thread_count() -> u32 {
    threading::get_thread_count() as u32
}

/// Get the browser's hardware concurrency (logical processor count)
///
/// # Returns
/// * Number of logical processors available to the browser
#[wasm_bindgen]
pub fn get_hardware_concurrency() -> u32 {
    threading::get_available_parallelism() as u32
}

/// Get detailed information about the threading environment
///
/// # Returns
/// * Diagnostic string with threading details
#[wasm_bindgen]
pub fn get_threading_info() -> String {
    threading::get_threading_info()
}

/// Force single-threaded execution (for debugging or fallback)
///
/// This disables threading even if it's supported and can be useful
/// for debugging or ensuring consistent behavior across environments
#[wasm_bindgen]
pub fn force_single_threaded() {
    threading::force_single_threaded();
    log::info!("Forced single-threaded mode");
}

// ==============================================================================
// Browser Capability Detection Functions
// ==============================================================================

/// Check comprehensive browser capabilities for WebAssembly threading
///
/// Performs a detailed analysis of the browser environment to determine
/// if WebAssembly multi-threading is supported and provides diagnostic information
/// about any missing requirements.
///
/// # Returns
/// * `WasmCapabilityReport` - Detailed report of all threading requirements
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn check_threading_requirements() -> capabilities::WasmCapabilityReport {
    capabilities::check_threading_requirements()
}

// get_missing_requirements is exported from capabilities.rs

/// Check if Cross-Origin Isolation is enabled
///
/// This is a quick check for the most common reason threading doesn't work.
///
/// # Returns
/// * `true` if Cross-Origin Isolation is properly configured
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn is_cross_origin_isolated() -> bool {
    capabilities::is_cross_origin_isolated()
}

/// Check if SharedArrayBuffer is supported and functional
///
/// Tests both availability and instantiation to ensure it's truly working.
///
/// # Returns
/// * `true` if SharedArrayBuffer is available and can be instantiated
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn is_shared_array_buffer_supported() -> bool {
    capabilities::is_shared_array_buffer_supported()
}

/// Check if we're running in a Node.js environment
///
/// # Returns
/// * `true` if running in Node.js
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn is_nodejs_environment() -> bool {
    capabilities::is_nodejs_environment()
}

/// Get the detected environment type as a string
///
/// # Returns
/// * Environment type: "browser", "webworker", "nodejs", "deno", or "unknown"
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn get_environment_type() -> String {
    capabilities::get_environment_type()
}

/// Get a human-readable summary of threading requirements
///
/// Provides actionable information about what's needed to enable threading.
///
/// # Returns
/// * Detailed summary string with requirements and recommendations
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn get_threading_requirements_summary() -> String {
    capabilities::get_threading_requirements_summary()
}

// get_threading_recommendations is exported from capabilities.rs

/// Force refresh of capability detection cache
///
/// This can be useful if the environment changes during runtime
/// (e.g., headers are modified via service worker)
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
pub fn refresh_capability_cache() {
    capabilities::refresh_capability_cache();
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_wasm_vectorizer_creation() {
        let vectorizer = WasmVectorizer::new();
        assert_eq!(vectorizer.get_backend(), "edge"); // Default backend
    }

    #[wasm_bindgen_test]
    fn test_preset_application() {
        let mut vectorizer = WasmVectorizer::new();
        vectorizer.use_preset("line_art").unwrap();
        assert_eq!(vectorizer.get_detail(), 0.4);
        assert_eq!(vectorizer.get_backend(), "edge");
    }

    #[wasm_bindgen_test]
    fn test_backend_setting() {
        let mut vectorizer = WasmVectorizer::new();
        vectorizer.set_backend("dots").unwrap();
        assert_eq!(vectorizer.get_backend(), "dots");
    }

    #[wasm_bindgen_test]
    fn test_config_export_import() {
        let mut vectorizer1 = WasmVectorizer::new();
        vectorizer1.set_detail(0.7).unwrap();
        vectorizer1.set_backend("centerline").unwrap();

        let config_json = vectorizer1.export_config().unwrap();

        let mut vectorizer2 = WasmVectorizer::new();
        vectorizer2.import_config(&config_json).unwrap();

        assert_eq!(vectorizer2.get_detail(), 0.7);
        assert_eq!(vectorizer2.get_backend(), "centerline");
    }

    #[wasm_bindgen_test]
    fn test_validation() {
        let mut vectorizer = WasmVectorizer::new();

        // Valid configuration
        vectorizer.set_detail(0.5).unwrap();
        assert!(vectorizer.validate_config().is_ok());

        // Invalid configuration
        assert!(vectorizer.set_detail(1.5).is_err());
    }

    #[wasm_bindgen_test]
    fn test_utility_functions() {
        let presets = get_available_presets();
        assert!(!presets.is_empty());

        let backends = get_available_backends();
        assert!(!backends.is_empty());

        let description = get_preset_description("line_art").unwrap();
        assert!(description.contains("line art"));
    }

    #[wasm_bindgen_test]
    fn test_threading_functions() {
        // Test hardware concurrency detection
        let concurrency = get_hardware_concurrency();
        assert!(concurrency >= 1);

        // Test threading info
        let info = get_threading_info();
        assert!(info.contains("WASM Threading Info"));

        // Test thread count
        let thread_count = get_thread_count();
        assert!(thread_count >= 1);

        // Test threading support check
        let _supported = is_threading_supported(); // Just ensure it doesn't panic

        // Test force single-threaded
        force_single_threaded();
        assert!(!is_threading_supported()); // Should be false after forcing single-threaded
        assert_eq!(get_thread_count(), 1);
    }

    #[wasm_bindgen_test]
    fn test_vectorizer_threading_config() {
        let mut vectorizer = WasmVectorizer::new();

        // Test setting thread count
        assert!(vectorizer.set_thread_count(Some(2)).is_ok());

        // Test getting thread count (may be 1 if threading is not supported)
        let thread_count = vectorizer.get_thread_count();
        assert!(thread_count >= 1);
    }

    #[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
    #[wasm_bindgen_test]
    fn test_capability_detection_functions() {
        // Test capability detection
        let report = check_threading_requirements();
        assert!(!report.environment_type().is_empty());

        // Test missing requirements
        let missing = get_missing_requirements();
        // Should be empty if threading is supported, non-empty otherwise
        if report.threading_supported() {
            assert!(missing.is_empty());
        }

        // Test individual checks - these should not panic
        let _ = is_cross_origin_isolated();
        let _ = is_shared_array_buffer_supported();
        let _ = is_nodejs_environment();
        let env_type = get_environment_type();
        assert!(!env_type.is_empty());

        // Test summary and recommendations
        let summary = get_threading_requirements_summary();
        assert!(!summary.is_empty());

        let recommendations = get_threading_recommendations();
        assert!(!recommendations.is_empty());

        // Test cache refresh
        refresh_capability_cache();
        let report2 = check_threading_requirements();

        // Should still be consistent after refresh
        assert_eq!(report.threading_supported(), report2.threading_supported());
        assert_eq!(report.environment_type(), report2.environment_type());
    }

    #[wasm_bindgen_test]
    fn test_centerline_wasm_interface() {
        let mut vectorizer = WasmVectorizer::new();
        
        // Test centerline-specific functions
        vectorizer.set_enable_adaptive_threshold(true);
        assert!(vectorizer.set_window_size(25).is_ok());
        assert!(vectorizer.set_sensitivity_k(0.4).is_ok());
        assert!(vectorizer.set_min_branch_length(10.0).is_ok());
        assert!(vectorizer.set_douglas_peucker_epsilon(1.5).is_ok());
        vectorizer.set_enable_width_modulation(false);
        
        // Test validation errors
        assert!(vectorizer.set_window_size(14).is_err()); // Too small
        assert!(vectorizer.set_window_size(51).is_err()); // Too large
        assert!(vectorizer.set_sensitivity_k(0.05).is_err()); // Too small
        assert!(vectorizer.set_sensitivity_k(1.1).is_err()); // Too large
        assert!(vectorizer.set_min_branch_length(3.0).is_err()); // Too small
        assert!(vectorizer.set_min_branch_length(25.0).is_err()); // Too large
        assert!(vectorizer.set_douglas_peucker_epsilon(0.4).is_err()); // Too small
        assert!(vectorizer.set_douglas_peucker_epsilon(3.1).is_err()); // Too large
    }

    #[wasm_bindgen_test]
    fn test_superpixel_wasm_interface() {
        let mut vectorizer = WasmVectorizer::new();
        
        // Test superpixel-specific functions
        assert!(vectorizer.set_num_superpixels(150).is_ok());
        assert!(vectorizer.set_compactness(20.0).is_ok());
        assert!(vectorizer.set_slic_iterations(10).is_ok());
        vectorizer.set_fill_regions(true);
        vectorizer.set_stroke_regions(false);
        vectorizer.set_simplify_boundaries(true);
        assert!(vectorizer.set_boundary_epsilon(2.0).is_ok());
        
        // Test validation errors
        assert!(vectorizer.set_num_superpixels(15).is_err()); // Too small
        assert!(vectorizer.set_num_superpixels(1200).is_err()); // Too large
        assert!(vectorizer.set_compactness(0.5).is_err()); // Too small
        assert!(vectorizer.set_compactness(60.0).is_err()); // Too large
        assert!(vectorizer.set_slic_iterations(3).is_err()); // Too small
        assert!(vectorizer.set_slic_iterations(20).is_err()); // Too large
        assert!(vectorizer.set_boundary_epsilon(0.3).is_err()); // Too small
        assert!(vectorizer.set_boundary_epsilon(4.0).is_err()); // Too large
    }
}
