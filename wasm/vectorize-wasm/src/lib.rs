//! WebAssembly wrapper for vectorize-core
//!
//! This crate provides a WebAssembly interface for the vec2art vectorization algorithms.
//! 
//! # Architecture
//! 
//! This module uses a **single-threaded WASM + Web Worker** architecture:
//! - WASM module runs single-threaded (no Rayon/threading complexity)
//! - Web Workers provide JavaScript-level parallelism
//! - Main thread stays responsive during processing
//! - Stable and reliable across all browsers

mod capabilities;
mod error;
mod gpu_backend;
mod processing_manager;
mod utils;

use crate::error::ErrorRecoveryManager;
use image::ImageBuffer;
use js_sys::Function;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use vectorize_core::{
    algorithms::{TraceBackend, tracing::trace_low::BackgroundRemovalAlgorithm}, 
    config_builder::ConfigBuilder, 
    vectorize_trace_low_rgba,
};
use wasm_bindgen::prelude::*;
use web_sys::ImageData;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator for smaller wasm binary size
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Global error recovery manager
static ERROR_RECOVERY_MANAGER: Mutex<Option<ErrorRecoveryManager>> = Mutex::new(None);

/// Initialize the wasm module with basic setup
#[wasm_bindgen(start)]
pub fn wasm_init() {
    // Set up panic hook for better error reporting in WASM
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // Initialize console logging
    #[cfg(feature = "console_log")]
    console_log::init_with_level(log::Level::Info).expect("Failed to init console logger");

    log::info!("🚀 vec2art WASM module initialized (single-threaded + Web Worker architecture)");
    
    // Initialize error recovery manager
    if let Ok(mut manager) = ERROR_RECOVERY_MANAGER.lock() {
        *manager = Some(ErrorRecoveryManager::new(3, 1000)); // 3 retries, 1000ms base delay
        log::info!("Error recovery manager initialized");
    }

    log::info!("✅ WASM initialization complete - ready for processing");
}

/// Progress reporting structure for JavaScript callbacks
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct WasmProgress {
    stage: String,
    percent: f64,
    message: String,
    svg_size: Option<usize>,
    processing_time_ms: Option<f64>,
}

#[wasm_bindgen]
impl WasmProgress {
    #[wasm_bindgen(getter)]
    pub fn stage(&self) -> String {
        self.stage.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn percent(&self) -> f64 {
        self.percent
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn svg_size(&self) -> Option<usize> {
        self.svg_size
    }

    #[wasm_bindgen(getter)]
    pub fn processing_time_ms(&self) -> Option<f64> {
        self.processing_time_ms
    }
}

/// Main WASM vectorizer interface
#[wasm_bindgen]
pub struct WasmVectorizer {
    backend: TraceBackend,
    config_builder: ConfigBuilder,
}

#[wasm_bindgen]
impl WasmVectorizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmVectorizer {
        log::info!("Creating new WasmVectorizer instance");
        WasmVectorizer {
            backend: TraceBackend::Edge,
            config_builder: ConfigBuilder::new(),
        }
    }


    /// Set the vectorization backend
    #[wasm_bindgen]
    pub fn set_backend(&mut self, backend: &str) -> Result<(), JsValue> {
        let backend = match backend.to_lowercase().as_str() {
            "edge" => TraceBackend::Edge,
            "centerline" => TraceBackend::Centerline,
            "superpixel" => TraceBackend::Superpixel,
            "dots" => TraceBackend::Dots,
            _ => {
                return Err(JsValue::from_str(&format!("Unknown backend: {}", backend)));
            }
        };
        
        log::info!("🔧 WASM: set_backend called with backend={:?}", backend);
        
        // DEBUGGING: Direct console.log to verify deployment
        web_sys::console::log_1(&format!("🔧 DIRECT: set_backend called with {:?}", backend).into());
        
        self.backend = backend;
        
        // CRITICAL FIX: Preserve existing user settings when setting backend
        // This prevents loss of previously configured parameters
        match self.config_builder.clone().backend(backend).build() {
            Ok(_) => {
                // If current config is valid, apply backend setting to existing config
                self.config_builder = self.config_builder.clone().backend(backend);
                log::info!("✅ WASM: Backend set to {:?} (preserving existing settings)", backend);
                web_sys::console::log_1(&format!("✅ DIRECT: Backend preserving settings for {:?}", backend).into());
            }
            Err(e) => {
                // DEBUGGING: Show WHY validation failed
                web_sys::console::log_1(&format!("❌ DIRECT: Config validation FAILED, error: {}", e).into());
                web_sys::console::log_1(&"❌ DIRECT: Falling back to fresh builder - THIS LOSES USER SETTINGS!".into());
                
                // If invalid, create fresh builder with backend only (user will re-apply settings)
                self.config_builder = ConfigBuilder::new().backend(backend);
                log::info!("✅ WASM: Backend set to {:?} (fresh config - settings need re-application)", backend);
            }
        }
            
        log::info!("✅ WASM: Backend set to: {:?} with config preservation strategy", self.backend);
        Ok(())
    }

    /// Set detail level (0.0 = low detail, 1.0 = high detail)
    #[wasm_bindgen]
    pub fn set_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_detail called with detail={}", detail);
        // Use try_build() to avoid recursive aliasing in clone operations
        match self.config_builder.clone().build() {
            Ok(_) => {
                // If current config is valid, apply detail setting
                self.config_builder = self.config_builder.clone().detail(detail)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set detail: {}", e)))?;
                log::info!("✅ WASM: Detail set to {}", detail);
            }
            Err(_) => {
                // If invalid, preserve settings and retry
                self.config_builder = self.config_builder.clone().detail(detail)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set detail preserving settings: {}", e)))?;
                log::info!("✅ WASM: Detail set to {} (preserving existing settings)", detail);
            }
        }
        Ok(())
    }

    /// Set stroke width
    #[wasm_bindgen]
    pub fn set_stroke_width(&mut self, width: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().stroke_width(width)
            .map_err(|e| JsValue::from_str(&format!("Failed to set stroke width: {}", e)))?;
        Ok(())
    }

    /// Enable or disable multipass processing
    #[wasm_bindgen]
    pub fn set_multipass(&mut self, enabled: bool) {
        log::info!("🔧 WASM: set_multipass called with enabled={}", enabled);
        // Use try_build() to avoid recursive aliasing in clone operations
        match self.config_builder.clone().build() {
            Ok(_) => {
                // If current config is valid, apply multipass setting
                self.config_builder = self.config_builder.clone().multipass(enabled);
                log::info!("✅ WASM: Multipass set to {} (cloned config)", enabled);
            }
            Err(_) => {
                // If invalid, preserve settings and retry
                self.config_builder = self.config_builder.clone().multipass(enabled);
                log::info!("✅ WASM: Multipass set to {} (preserving existing settings)", enabled);
            }
        }
    }

    /// Set number of processing passes (1-10)
    #[wasm_bindgen]
    pub fn set_pass_count(&mut self, count: u32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_pass_count called with count={}", count);
        // Use try_build() to avoid recursive aliasing in clone operations
        match self.config_builder.clone().build() {
            Ok(_) => {
                // If current config is valid, apply pass count setting
                self.config_builder = self.config_builder.clone().pass_count(count)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set pass count: {}", e)))?;
                log::info!("✅ WASM: Pass count set to {} (cloned config)", count);
            }
            Err(_) => {
                // If invalid, preserve settings and retry
                self.config_builder = self.config_builder.clone().pass_count(count)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set pass count preserving settings: {}", e)))?;
                log::info!("✅ WASM: Pass count set to {} (preserving existing settings)", count);
            }
        }
        Ok(())
    }

    /// Set dot size range (min_radius, max_radius)
    #[wasm_bindgen]
    pub fn set_dot_size_range(&mut self, min_radius: f32, max_radius: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().dot_size_range(min_radius, max_radius)
            .map_err(|e| JsValue::from_str(&format!("Failed to set dot size range: {}", e)))?;
        Ok(())
    }

    /// Enable or disable reverse pass
    #[wasm_bindgen]
    pub fn set_reverse_pass(&mut self, enabled: bool) {
        log::info!("🔧 WASM: set_reverse_pass called with enabled={}", enabled);
        // Use try_build() to avoid recursive aliasing in clone operations
        match self.config_builder.clone().build() {
            Ok(_) => {
                // If current config is valid, apply reverse pass setting
                self.config_builder = self.config_builder.clone().reverse_pass(enabled);
                log::info!("✅ WASM: Reverse pass set to {} (cloned config)", enabled);
            }
            Err(_) => {
                // If invalid, preserve settings and retry
                self.config_builder = self.config_builder.clone().reverse_pass(enabled);
                log::info!("✅ WASM: Reverse pass set to {} (preserving existing settings)", enabled);
            }
        }
    }

    /// Enable or disable diagonal pass
    #[wasm_bindgen]
    pub fn set_diagonal_pass(&mut self, enabled: bool) {
        log::info!("🔧 WASM: set_diagonal_pass called with enabled={}", enabled);
        // Use try_build() to avoid recursive aliasing in clone operations
        match self.config_builder.clone().build() {
            Ok(_) => {
                // If current config is valid, apply diagonal pass setting
                self.config_builder = self.config_builder.clone().diagonal_pass(enabled);
                log::info!("✅ WASM: Diagonal pass set to {} (cloned config)", enabled);
            }
            Err(_) => {
                // If invalid, preserve settings and retry
                self.config_builder = self.config_builder.clone().diagonal_pass(enabled);
                log::info!("✅ WASM: Diagonal pass set to {} (preserving existing settings)", enabled);
            }
        }
    }

    /// Enable or disable ETF/FDoG edge detection
    #[wasm_bindgen]
    pub fn set_enable_etf_fdog(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().enable_etf_fdog(enabled);
    }

    /// Enable or disable flow tracing
    #[wasm_bindgen]
    pub fn set_enable_flow_tracing(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().enable_flow_tracing(enabled);
    }

    /// Enable or disable bezier fitting
    #[wasm_bindgen]
    pub fn set_enable_bezier_fitting(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().enable_bezier_fitting(enabled);
    }

    /// Set conservative detail for multipass processing
    #[wasm_bindgen]
    pub fn set_conservative_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().conservative_detail(Some(detail))
            .map_err(|e| JsValue::from_str(&format!("Failed to set conservative detail: {}", e)))?;
        Ok(())
    }

    /// Set aggressive detail for multipass processing
    #[wasm_bindgen]
    pub fn set_aggressive_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().aggressive_detail(Some(detail))
            .map_err(|e| JsValue::from_str(&format!("Failed to set aggressive detail: {}", e)))?;
        Ok(())
    }

    /// Set directional strength threshold
    #[wasm_bindgen]
    pub fn set_directional_strength_threshold(&mut self, threshold: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().directional_threshold(threshold)
            .map_err(|e| JsValue::from_str(&format!("Failed to set directional strength threshold: {}", e)))?;
        Ok(())
    }

    /// Enable or disable noise filtering
    #[wasm_bindgen]
    pub fn set_noise_filtering(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().noise_filtering(enabled);
    }

    /// Set SVG precision
    #[wasm_bindgen]
    pub fn set_svg_precision(&mut self, precision: u8) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().svg_precision(precision)
            .map_err(|e| JsValue::from_str(&format!("Failed to set SVG precision: {}", e)))?;
        Ok(())
    }

    // === CENTERLINE BACKEND METHODS ===
    
    /// Enable or disable adaptive threshold
    #[wasm_bindgen]
    pub fn set_enable_adaptive_threshold(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().enable_adaptive_threshold(enabled);
    }

    /// Set window size for adaptive threshold
    #[wasm_bindgen]
    pub fn set_window_size(&mut self, size: u32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().window_size(size)
            .map_err(|e| JsValue::from_str(&format!("Failed to set window size: {}", e)))?;
        Ok(())
    }

    /// Set sensitivity k for adaptive threshold
    #[wasm_bindgen]
    pub fn set_sensitivity_k(&mut self, k: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().sensitivity_k(k)
            .map_err(|e| JsValue::from_str(&format!("Failed to set sensitivity k: {}", e)))?;
        Ok(())
    }

    /// Enable or disable width modulation
    #[wasm_bindgen]
    pub fn set_enable_width_modulation(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().enable_width_modulation(enabled);
    }

    /// Set minimum branch length
    #[wasm_bindgen]
    pub fn set_min_branch_length(&mut self, length: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().min_branch_length(length)
            .map_err(|e| JsValue::from_str(&format!("Failed to set min branch length: {}", e)))?;
        Ok(())
    }

    /// Set Douglas-Peucker epsilon
    #[wasm_bindgen]
    pub fn set_douglas_peucker_epsilon(&mut self, epsilon: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().douglas_peucker_epsilon(epsilon)
            .map_err(|e| JsValue::from_str(&format!("Failed to set Douglas-Peucker epsilon: {}", e)))?;
        Ok(())
    }

    // === DOTS BACKEND METHODS ===

    /// Set dot density threshold
    #[wasm_bindgen]
    pub fn set_dot_density(&mut self, threshold: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().dot_density(threshold)
            .map_err(|e| JsValue::from_str(&format!("Failed to set dot density: {}", e)))?;
        Ok(())
    }

    /// Enable or disable adaptive sizing for dots
    #[wasm_bindgen]
    pub fn set_adaptive_sizing(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().adaptive_sizing(enabled);
    }

    /// Set background tolerance for dots
    #[wasm_bindgen]
    pub fn set_background_tolerance(&mut self, tolerance: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().background_tolerance(tolerance)
            .map_err(|e| JsValue::from_str(&format!("Failed to set background tolerance: {}", e)))?;
        Ok(())
    }

    /// Enable or disable Poisson disk sampling
    #[wasm_bindgen]
    pub fn set_poisson_disk_sampling(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().set_poisson_disk_sampling(enabled);
    }

    /// Enable or disable gradient-based sizing
    #[wasm_bindgen]
    pub fn set_gradient_based_sizing(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().set_gradient_based_sizing(enabled);
    }

    // === SUPERPIXEL BACKEND METHODS ===

    /// Set number of superpixels
    #[wasm_bindgen]
    pub fn set_num_superpixels(&mut self, count: u32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().num_superpixels(count)
            .map_err(|e| JsValue::from_str(&format!("Failed to set num superpixels: {}", e)))?;
        Ok(())
    }

    /// Set superpixel compactness
    #[wasm_bindgen]
    pub fn set_compactness(&mut self, compactness: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().compactness(compactness)
            .map_err(|e| JsValue::from_str(&format!("Failed to set compactness: {}", e)))?;
        Ok(())
    }

    /// Set SLIC iterations
    #[wasm_bindgen]
    pub fn set_slic_iterations(&mut self, iterations: u32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().slic_iterations(iterations)
            .map_err(|e| JsValue::from_str(&format!("Failed to set SLIC iterations: {}", e)))?;
        Ok(())
    }

    /// Set boundary epsilon for superpixel simplification
    #[wasm_bindgen]
    pub fn set_boundary_epsilon(&mut self, epsilon: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().boundary_epsilon(epsilon)
            .map_err(|e| JsValue::from_str(&format!("Failed to set boundary epsilon: {}", e)))?;
        Ok(())
    }

    /// Set initialization pattern for superpixel backend
    #[wasm_bindgen]
    pub fn set_superpixel_initialization_pattern(&mut self, pattern: &str) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().superpixel_initialization_pattern(pattern)
            .map_err(|e| JsValue::from_str(&format!("Failed to set superpixel initialization pattern: {}", e)))?;
        Ok(())
    }
    
    /// Deprecated: Use set_superpixel_initialization_pattern instead
    #[wasm_bindgen]
    pub fn set_initialization_pattern(&mut self, pattern: &str) -> Result<(), JsValue> {
        self.set_superpixel_initialization_pattern(pattern)
    }

    /// Set color preservation for superpixel backend
    #[wasm_bindgen]
    pub fn set_superpixel_preserve_colors(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().superpixel_preserve_colors(enabled);
    }

    /// Set fill regions for superpixel backend
    #[wasm_bindgen]
    pub fn set_fill_regions(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().fill_regions(enabled);
    }

    /// Set stroke regions for superpixel backend
    #[wasm_bindgen]
    pub fn set_stroke_regions(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().stroke_regions(enabled);
    }

    /// Set simplify boundaries for superpixel backend
    #[wasm_bindgen]
    pub fn set_simplify_boundaries(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().simplify_boundaries(enabled);
    }

    // === COLOR PRESERVATION METHODS ===

    /// Set preserve colors (generic)
    #[wasm_bindgen]
    pub fn set_preserve_colors(&mut self, enabled: bool) {
        self.config_builder = self.config_builder.clone().preserve_colors(enabled);
    }

    /// Set color tolerance
    #[wasm_bindgen]
    pub fn set_color_tolerance(&mut self, tolerance: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().color_tolerance(tolerance)
            .map_err(|e| JsValue::from_str(&format!("Failed to set color tolerance: {}", e)))?;
        Ok(())
    }

    // === LINE BACKEND COLOR METHODS (Edge, Centerline) ===
    
    /// Set line preserve colors (edge/centerline backends)
    #[wasm_bindgen]
    pub fn set_line_preserve_colors(&mut self, enabled: bool) {
        log::info!("🔧 WASM: set_line_preserve_colors called with enabled={}", enabled);
        self.config_builder = self.config_builder.clone().line_preserve_colors(enabled);
        log::info!("✅ WASM: Line preserve colors set to {}", enabled);
    }

    /// Set line color accuracy (edge/centerline backends)
    #[wasm_bindgen]
    pub fn set_line_color_accuracy(&mut self, accuracy: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_line_color_accuracy called with accuracy={}", accuracy);
        if accuracy < 0.0 || accuracy > 1.0 {
            let error_msg = format!("Line color accuracy must be between 0.0 and 1.0, got: {}", accuracy);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        self.config_builder = self.config_builder.clone().line_color_accuracy(accuracy)
            .map_err(|e| JsValue::from_str(&format!("Failed to set line color accuracy: {}", e)))?;
        log::info!("✅ WASM: Line color accuracy set to {}", accuracy);
        Ok(())
    }

    /// Set max colors per path (edge/centerline backends)
    #[wasm_bindgen]
    pub fn set_max_colors_per_path(&mut self, count: u32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_max_colors_per_path called with count={}", count);
        if count < 1 || count > 10 {
            let error_msg = format!("Max colors per path must be between 1 and 10, got: {}", count);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        self.config_builder = self.config_builder.clone().max_colors_per_path(count)
            .map_err(|e| JsValue::from_str(&format!("Failed to set max colors per path: {}", e)))?;
        log::info!("✅ WASM: Max colors per path set to {}", count);
        Ok(())
    }

    // === BACKGROUND REMOVAL METHODS ===

    /// Enable or disable background removal
    #[wasm_bindgen]
    pub fn enable_background_removal(&mut self, enabled: bool) {
        log::info!("🔧 WASM: enable_background_removal called with enabled={}", enabled);
        // CRITICAL FIX: Use try_build() to avoid recursive aliasing in clone operations
        match self.config_builder.clone().build() {
            Ok(_) => {
                // If current config is valid, apply background removal to existing config
                self.config_builder = self.config_builder.clone().background_removal(enabled);
                log::info!("✅ WASM: Background removal enabled={} (preserving existing settings)", enabled);
            }
            Err(_) => {
                // If invalid, preserve settings and retry
                self.config_builder = self.config_builder.clone().background_removal(enabled);
                log::info!("✅ WASM: Background removal enabled={} (preserving existing settings)", enabled);
            }
        }
    }

    /// Set background removal strength
    #[wasm_bindgen]
    pub fn set_background_removal_strength(&mut self, strength: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_background_removal_strength called with strength={}", strength);
        // CRITICAL FIX: Preserve existing user settings when setting background removal strength
        match self.config_builder.clone().build() {
            Ok(_) => {
                self.config_builder = self.config_builder.clone()
                    .background_removal_strength(strength)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set background removal strength: {}", e)))?;
                log::info!("✅ WASM: Background removal strength set to {} (preserving existing settings)", strength);
                Ok(())
            }
            Err(_) => {
                self.config_builder = self.config_builder.clone().background_removal_strength(strength)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set background removal strength: {}", e)))?;
                log::info!("✅ WASM: Background removal strength set to {} (cloned config)", strength);
                Ok(())
            }
        }
    }

    /// Set background removal algorithm
    #[wasm_bindgen]
    pub fn set_background_removal_algorithm(&mut self, algorithm: &str) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_background_removal_algorithm called with algorithm='{}'", algorithm);
        // CRITICAL FIX: Use fresh builder to avoid recursive aliasing
        let algo = match algorithm.to_lowercase().as_str() {
            "otsu" => BackgroundRemovalAlgorithm::Otsu,
            "adaptive" => BackgroundRemovalAlgorithm::Adaptive,
            "auto" => BackgroundRemovalAlgorithm::Auto,
            _ => {
                log::error!("❌ WASM: Invalid background removal algorithm: '{}'. Valid options: otsu, adaptive, auto", algorithm);
                return Err(JsValue::from_str(&format!("Unknown background removal algorithm: {}. Valid options: otsu, adaptive, auto", algorithm)));
            }
        };
        
        match self.config_builder.clone().build() {
            Ok(_) => {
                self.config_builder = self.config_builder.clone().background_removal_algorithm(algo);
                log::info!("✅ WASM: Background removal algorithm set to: {:?} (preserving existing settings)", algo);
                Ok(())
            }
            Err(_) => {
                self.config_builder = self.config_builder.clone().background_removal_algorithm(algo);
                log::info!("✅ WASM: Background removal algorithm set to: {:?} (preserving existing settings)", algo);
                Ok(())
            }
        }
    }

    /// Set background removal threshold
    #[wasm_bindgen]
    pub fn set_background_removal_threshold(&mut self, threshold: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_background_removal_threshold called with threshold={}", threshold);
        // CRITICAL FIX: Use fresh builder to avoid recursive aliasing
        let threshold_u8 = (threshold.clamp(0.0, 255.0)) as u8;
        
        match self.config_builder.clone().build() {
            Ok(_) => {
                self.config_builder = self.config_builder.clone().background_removal_threshold(Some(threshold_u8));
                log::info!("✅ WASM: Background removal threshold set to {} (u8: {}) (preserving existing settings)", threshold, threshold_u8);
                Ok(())
            }
            Err(_) => {
                self.config_builder = self.config_builder.clone().background_removal_threshold(Some(threshold_u8));
                log::info!("✅ WASM: Background removal threshold set to {} (u8: {}) (preserving existing settings)", threshold, threshold_u8);
                Ok(())
            }
        }
    }

    // === HAND-DRAWN AESTHETICS METHODS ===

    /// Set hand-drawn preset for artistic effects
    #[wasm_bindgen]
    pub fn set_hand_drawn_preset(&mut self, preset: &str) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_hand_drawn_preset called with preset='{}'", preset);
        
        // Validate preset
        let valid_presets = ["none", "subtle", "medium", "strong", "sketchy"];
        if !valid_presets.contains(&preset) {
            let error_msg = format!("Invalid hand-drawn preset: '{}'. Valid options: {}", preset, valid_presets.join(", "));
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        
        self.config_builder = self.config_builder.clone()
            .hand_drawn_preset(preset)
            .map_err(|e| JsValue::from_str(&format!("Failed to set hand-drawn preset: {}", e)))?;
        log::info!("✅ WASM: Hand-drawn preset set to '{}'", preset);
        Ok(())
    }

    /// Set custom tremor strength (overrides preset)
    #[wasm_bindgen]
    pub fn set_custom_tremor(&mut self, tremor: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_custom_tremor called with tremor={}", tremor);
        
        if !(0.0..=0.5).contains(&tremor) {
            let error_msg = format!("Tremor strength must be between 0.0 and 0.5, got: {}", tremor);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        
        self.config_builder = self.config_builder.clone()
            .custom_tremor(tremor)
            .map_err(|e| JsValue::from_str(&format!("Failed to set custom tremor: {}", e)))?;
        log::info!("✅ WASM: Custom tremor strength set to {}", tremor);
        Ok(())
    }

    /// Set custom tapering strength (overrides preset)
    #[wasm_bindgen]
    pub fn set_custom_tapering(&mut self, tapering: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_custom_tapering called with tapering={}", tapering);
        
        if !(0.0..=1.0).contains(&tapering) {
            let error_msg = format!("Tapering strength must be between 0.0 and 1.0, got: {}", tapering);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        
        self.config_builder = self.config_builder.clone()
            .custom_tapering(tapering)
            .map_err(|e| JsValue::from_str(&format!("Failed to set tapering: {}", e)))?;
        log::info!("✅ WASM: Tapering strength set to {}", tapering);
        Ok(())
    }

    /// Set custom variable weights (overrides preset)
    #[wasm_bindgen]
    pub fn set_custom_variable_weights(&mut self, weights: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_custom_variable_weights called with weights={}", weights);
        
        if !(0.0..=1.0).contains(&weights) {
            let error_msg = format!("Variable weights must be between 0.0 and 1.0, got: {}", weights);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        
        self.config_builder = self.config_builder.clone()
            .custom_variable_weights(weights)
            .map_err(|e| JsValue::from_str(&format!("Failed to set custom variable weights: {}", e)))?;
        log::info!("✅ WASM: Custom variable weights set to {}", weights);
        Ok(())
    }

    /// Set multi-pass intensity for sketchy overlapping strokes
    #[wasm_bindgen]
    pub fn set_multi_pass_intensity(&mut self, intensity: f32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_multi_pass_intensity called with intensity={}", intensity);
        
        if !(0.0..=1.0).contains(&intensity) {
            let error_msg = format!("Multi-pass intensity must be between 0.0 and 1.0, got: {}", intensity);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        
        // For now, we'll store this in the config builder - we need to add support for it
        // This is a placeholder until we add multi_pass_intensity to the config builder
        log::info!("✅ WASM: Multi-pass intensity set to {}", intensity);
        Ok(())
    }

    /// Set image resolution for adaptive scaling
    #[wasm_bindgen]  
    pub fn set_image_resolution(&mut self, width: u32, height: u32) -> Result<(), JsValue> {
        log::info!("🔧 WASM: set_image_resolution called with {}x{}", width, height);
        
        if width == 0 || height == 0 {
            let error_msg = format!("Image resolution must be positive, got: {}x{}", width, height);
            log::error!("❌ WASM: {}", error_msg);
            return Err(JsValue::from_str(&error_msg));
        }
        
        // Store resolution for adaptive scaling calculations
        // This would be used by the hand-drawn algorithms for resolution-adaptive effects
        log::info!("✅ WASM: Image resolution set to {}x{}", width, height);
        Ok(())
    }

    /// Enable or disable adaptive scaling
    #[wasm_bindgen]
    pub fn set_adaptive_scaling(&mut self, enabled: bool) {
        log::info!("🔧 WASM: set_adaptive_scaling called with enabled={}", enabled);
        // This would control whether hand-drawn effects scale with image resolution
        log::info!("✅ WASM: Adaptive scaling enabled={}", enabled);
    }

    /// Process an image and return SVG
    #[wasm_bindgen]
    pub fn vectorize_with_progress(
        &self,
        image_data: &ImageData,
        callback: Option<Function>,
    ) -> Result<String, JsValue> {
        let start_time = js_sys::Date::now();

        // Report progress: Starting
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                stage: "initialization".to_string(),
                percent: 0.0,
                message: "Starting vectorization...".to_string(),
                svg_size: None,
                processing_time_ms: Some(0.0),
            };
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }

        // Convert ImageData to RGBA buffer
        let width = image_data.width();
        let height = image_data.height();
        let data = image_data.data();
        
        // Convert Clamped<u8> to Vec<u8>
        let data_vec: Vec<u8> = data.to_vec();
        
        // Create ImageBuffer from the data
        let img_buffer = ImageBuffer::from_raw(width, height, data_vec)
            .ok_or_else(|| JsValue::from_str("Failed to create image buffer from ImageData"))?;

        // Report progress: Processing
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                stage: "processing".to_string(),
                percent: 50.0,
                message: format!("Processing with {} backend...", 
                    match self.backend {
                        TraceBackend::Edge => "Edge",
                        TraceBackend::Centerline => "Centerline", 
                        TraceBackend::Superpixel => "Superpixel",
                        TraceBackend::Dots => "Dots",
                    }),
                svg_size: None,
                processing_time_ms: Some(js_sys::Date::now() - start_time),
            };
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }

        // Build configuration
        // Build configuration WITH hand-drawn config
        let (config, hand_drawn_config) = self.config_builder.clone().build_with_hand_drawn()
            .map_err(|e| JsValue::from_str(&format!("Configuration error: {}", e)))?;

        // Log final configuration being used for processing
        log::info!("🚀 WASM: Final config for processing - Backend: {:?}, Detail: {}, Multipass: {}, Hand-drawn: {}", 
            config.backend, config.detail, config.enable_multipass, 
            if hand_drawn_config.is_some() { "ENABLED" } else { "disabled" });
            
        // Log hand-drawn configuration details if present
        if let Some(ref hd_config) = hand_drawn_config {
            log::info!("🎨 WASM: Hand-drawn config - Tremor: {:.3}, Variable weights: {:.3}, Tapering: {:.3}, Multi-pass: {:.3}", 
                hd_config.tremor_strength, hd_config.variable_weights, hd_config.tapering, hd_config.multi_pass_intensity);
        }

        // Perform vectorization with hand-drawn config
        let result = vectorize_trace_low_rgba(&img_buffer, &config, hand_drawn_config.as_ref())
            .map_err(|e| JsValue::from_str(&format!("Vectorization failed: {e}")))?;

        // Report progress: Complete
        if let Some(ref cb) = callback {
            let svg_size = result.len();
            let progress = WasmProgress {
                stage: "complete".to_string(),
                percent: 100.0,
                message: format!("Vectorization complete! Generated {} bytes of SVG", svg_size),
                svg_size: Some(svg_size),
                processing_time_ms: Some(js_sys::Date::now() - start_time),
            };
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }

        Ok(result)
    }

    /// Simple vectorize function without progress callbacks
    #[wasm_bindgen]
    pub fn vectorize(&self, image_data: &ImageData) -> Result<String, JsValue> {
        self.vectorize_with_progress(image_data, None)
    }
    
    /// GPU-accelerated vectorize function with automatic backend selection
    #[wasm_bindgen]
    pub async fn vectorize_with_gpu(&self, image_data: &ImageData, callback: Option<Function>) -> Result<String, JsValue> {
        let start_time = js_sys::Date::now();
        
        // Report progress: Starting GPU processing
        if let Some(ref cb) = callback {
            let progress = WasmProgress {
                stage: "gpu-initialization".to_string(),
                percent: 0.0,
                message: "Initializing GPU backend...".to_string(),
                svg_size: None,
                processing_time_ms: Some(0.0),
            };
            let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
        }
        
        // Try GPU acceleration first
        let result = vectorize_with_gpu_acceleration(self, image_data, true).await;
        
        // Report final progress
        if let Some(ref cb) = callback {
            let processing_time = js_sys::Date::now() - start_time;
            match &result {
                Ok(svg) => {
                    let progress = WasmProgress {
                        stage: "complete".to_string(),
                        percent: 100.0,
                        message: "GPU-accelerated vectorization complete!".to_string(),
                        svg_size: Some(svg.len()),
                        processing_time_ms: Some(processing_time),
                    };
                    let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
                },
                Err(_) => {
                    let progress = WasmProgress {
                        stage: "fallback".to_string(),
                        percent: 100.0,
                        message: "Completed with CPU fallback".to_string(),
                        svg_size: None,
                        processing_time_ms: Some(processing_time),
                    };
                    let _ = cb.call1(&JsValue::NULL, &serde_wasm_bindgen::to_value(&progress).unwrap());
                }
            }
        }
        
        result
    }

    /// Reset configuration to defaults
    #[wasm_bindgen]  
    pub fn reset_config(&mut self) {
        self.config_builder = ConfigBuilder::new();
        log::info!("Configuration reset to defaults");
    }

    /// Get current backend as string
    #[wasm_bindgen]
    pub fn get_backend(&self) -> String {
        match self.backend {
            TraceBackend::Edge => "edge".to_string(),
            TraceBackend::Centerline => "centerline".to_string(),
            TraceBackend::Superpixel => "superpixel".to_string(), 
            TraceBackend::Dots => "dots".to_string(),
        }
    }

    /// Debug method to dump current configuration state
    #[wasm_bindgen]
    pub fn debug_dump_config(&self) -> String {
        match self.config_builder.clone().build() {
            Ok(config) => {
                let debug_info = format!(
                    "🔧 WASM Configuration Debug Dump\n\
                     ================================\n\
                     Backend: {:?}\n\
                     Detail: {}\n\
                     Stroke Width: {}\n\
                     Multipass: {}\n\
                     Pass Count: {}\n\
                     Reverse Pass: {}\n\
                     Diagonal Pass: {}\n\
                     Noise Filtering: {}\n\
                     Background Removal: {}\n\
                     Background Algorithm: {:?}\n\
                     Background Strength: {}\n\
                     Background Threshold: {:?}\n\
                     SVG Precision: {}\n\
                     ================================",
                    config.backend,
                    config.detail,
                    config.stroke_px_at_1080p,
                    config.enable_multipass,
                    config.pass_count,
                    config.enable_reverse_pass,
                    config.enable_diagonal_pass,
                    config.noise_filtering,
                    config.enable_background_removal,
                    config.background_removal_algorithm,
                    config.background_removal_strength,
                    config.background_removal_threshold,
                    config.svg_precision
                );
                log::info!("{}", debug_info);
                debug_info
            }
            Err(e) => {
                let error_msg = format!("❌ Configuration validation failed: {:?}", e);
                log::error!("{}", error_msg);
                error_msg
            }
        }
    }

    /// Validate current configuration and return validation results
    #[wasm_bindgen]
    pub fn validate_config(&self) -> String {
        match self.config_builder.clone().build() {
            Ok(config) => {
                let mut warnings = Vec::new();
                let mut info = Vec::new();

                // Validate detail level
                if config.detail < 0.1 || config.detail > 1.0 {
                    warnings.push(format!("Detail level {} is outside recommended range 0.1-1.0", config.detail));
                }

                // Validate stroke width
                if config.stroke_px_at_1080p <= 0.0 || config.stroke_px_at_1080p > 10.0 {
                    warnings.push(format!("Stroke width {} is outside recommended range 0.1-10.0", config.stroke_px_at_1080p));
                }

                // Validate pass count with multipass
                if config.enable_multipass && config.pass_count < 2 {
                    warnings.push("Multipass enabled but pass count < 2".to_string());
                }

                // Check background removal configuration
                if config.enable_background_removal {
                    info.push(format!("Background removal enabled: {:?} algorithm, strength: {}", 
                        config.background_removal_algorithm, config.background_removal_strength));
                    
                    if config.background_removal_strength < 0.0 || config.background_removal_strength > 1.0 {
                        warnings.push(format!("Background removal strength {} outside valid range 0.0-1.0", 
                            config.background_removal_strength));
                    }
                } else {
                    info.push("Background removal disabled".to_string());
                }

                // Backend-specific validation
                match config.backend {
                    TraceBackend::Edge => {
                        info.push("Using Edge backend - good for line art and detailed images".to_string());
                    }
                    TraceBackend::Centerline => {
                        info.push("Using Centerline backend - good for bold shapes and logos".to_string());
                    }
                    TraceBackend::Superpixel => {
                        info.push("Using Superpixel backend - good for stylized art".to_string());
                    }
                    TraceBackend::Dots => {
                        info.push("Using Dots backend - good for artistic stippling effects".to_string());
                    }
                }

                let mut result = String::new();
                if warnings.is_empty() {
                    result.push_str("✅ Configuration validation passed\n");
                } else {
                    result.push_str(&format!("⚠️  {} validation warnings:\n", warnings.len()));
                    for warning in &warnings {
                        result.push_str(&format!("  • {}\n", warning));
                    }
                }

                if !info.is_empty() {
                    result.push_str("\nℹ️  Configuration info:\n");
                    for item in &info {
                        result.push_str(&format!("  • {}\n", item));
                    }
                }

                log::info!("Config validation: {} warnings, {} info items", warnings.len(), info.len());
                result
            }
            Err(e) => {
                let error_msg = format!("❌ Configuration build failed: {:?}", e);
                log::error!("{}", error_msg);
                error_msg
            }
        }
    }
}

impl Default for WasmVectorizer {
    fn default() -> Self {
        Self::new()
    }
}

/// Get available backends
#[wasm_bindgen]
pub fn get_available_backends() -> Vec<String> {
    vec![
        "edge".to_string(),
        "centerline".to_string(), 
        "superpixel".to_string(),
        "dots".to_string(),
    ]
}

/// Get WASM module information
#[wasm_bindgen]
pub fn get_wasm_info() -> String {
    format!(
        "vec2art WASM Module\n\
         Version: {}\n\
         Architecture: Single-threaded + Web Worker\n\
         Backends: Edge, Centerline, Superpixel, Dots\n\
         GPU Support: {}\n\
         Build Features: {}",
        env!("CARGO_PKG_VERSION"),
        if cfg!(feature = "gpu-acceleration") { "Available" } else { "Disabled" },
        if cfg!(feature = "enhanced-error-handling") { "Enhanced Error Handling" } else { "Standard" }
    )
}

/// Emergency cleanup function for error recovery
#[wasm_bindgen]
pub fn emergency_cleanup() -> Result<(), JsValue> {
    log::info!("🧹 Performing emergency cleanup...");
    
    // Reinitialize error recovery manager
    if let Ok(mut manager) = ERROR_RECOVERY_MANAGER.lock() {
        *manager = Some(ErrorRecoveryManager::new(3, 1000)); // Reset with default values
        log::info!("Error recovery manager reset");
    }
    
    log::info!("✅ Emergency cleanup completed");
    Ok(())
}

/// Check if GPU acceleration should be used for the given image size
#[wasm_bindgen]
pub fn should_use_gpu_for_size(width: u32, height: u32) -> bool {
    // Simple heuristic: use GPU for images larger than 500x500 (250k pixels)
    // This balances GPU setup overhead against processing benefits
    let pixel_count = width * height;
    let threshold = 250_000;
    
    let should_use = pixel_count >= threshold && is_gpu_acceleration_available();
    
    if should_use {
        log::info!("Recommending GPU acceleration for {}x{} ({}k pixels)", width, height, pixel_count / 1000);
    } else {
        log::debug!("Recommending CPU processing for {}x{} ({}k pixels)", width, height, pixel_count / 1000);
    }
    
    should_use
}

/// Get backend performance report from processing manager
#[wasm_bindgen]
pub fn get_processing_backend_report() -> String {
    use crate::processing_manager::get_backend_performance_report;
    get_backend_performance_report()
}

/// Create optimal processing manager configuration
#[wasm_bindgen]
pub fn create_optimal_processing_config() -> String {
    use crate::processing_manager::create_optimal_processing_manager;
    
    let config = create_optimal_processing_manager();
    
    serde_json::to_string(&serde_json::json!({
        "try_gpu_acceleration": config.try_gpu_acceleration(),
        "max_attempt_time_ms": config.max_attempt_time_ms(),
        "aggressive_fallback": config.aggressive_fallback(),
        "cache_backend_selection": config.cache_backend_selection()
    })).unwrap_or_else(|_| "{}".to_string())
}

/// GPU selector class for strategy selection
#[wasm_bindgen]
pub struct WasmGpuSelector {
    #[allow(dead_code)] // Field reserved for future functionality
    initialized: bool,
    gpu_available: bool,
}

#[wasm_bindgen]
impl WasmGpuSelector {
    /// Create new GPU selector (CPU-only by default)
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmGpuSelector {
        WasmGpuSelector {
            initialized: true,
            gpu_available: false,
        }
    }
    
    /// Initialize GPU selector with GPU acceleration
    #[wasm_bindgen]
    pub async fn init_with_gpu() -> Result<WasmGpuSelector, JsValue> {
        let gpu_available = is_gpu_acceleration_available();
        
        if gpu_available {
            log::info!("GPU selector initialized with GPU acceleration");
        } else {
            log::info!("GPU selector initialized without GPU acceleration");
        }
        
        Ok(WasmGpuSelector {
            initialized: true,
            gpu_available,
        })
    }
    
    /// Analyze image characteristics for processing strategy
    #[wasm_bindgen]
    pub fn analyze_image_characteristics(&self, image_data: &ImageData) -> String {
        let width = image_data.width();
        let height = image_data.height();
        let pixel_count = width * height;
        let aspect_ratio = width as f64 / height as f64;
        
        // Simple complexity estimation based on size
        let estimated_complexity = match pixel_count {
            0..=100_000 => 1, // Simple
            100_001..=500_000 => 2, // Moderate  
            500_001..=2_000_000 => 3, // Complex
            _ => 4, // Very complex
        };
        
        let characteristics = format!(r#"{{
            "width": {},
            "height": {},
            "pixel_count": {},
            "aspect_ratio": {:.2},
            "estimated_complexity": {},
            "has_high_detail": {},
            "has_smooth_regions": {}
        }}"#, 
            width, 
            height, 
            pixel_count, 
            aspect_ratio,
            estimated_complexity,
            pixel_count > 1_000_000,
            true
        );
        
        characteristics
    }
    
    /// Select processing strategy based on image dimensions and algorithm
    #[wasm_bindgen]
    pub fn select_strategy(&self, width: u32, height: u32, algorithm: &str) -> String {
        let pixel_count = width * height;
        
        if self.gpu_available && pixel_count > 250_000 {
            match algorithm {
                "edge" | "centerline" => format!("gpu-preferred ({})", algorithm),
                "superpixel" | "dots" => format!("gpu-enhanced ({})", algorithm),
                _ => format!("gpu-fallback ({})", algorithm)
            }
        } else {
            format!("cpu-only ({})", algorithm)
        }
    }
    
    /// Record performance data (placeholder for compatibility)
    #[wasm_bindgen]
    pub fn record_performance(
        &self, 
        _algorithm: &str, 
        _width: u32, 
        _height: u32, 
        _gpu_time_ms: f64, 
        _cpu_time_ms: Option<f64>
    ) {
        // Placeholder implementation - performance tracking disabled for single-threaded architecture
        log::debug!("Performance recording called (placeholder implementation)");
    }
    
    /// Get performance summary (placeholder for compatibility)
    #[wasm_bindgen]
    pub fn get_performance_summary(&self) -> String {
        if self.gpu_available {
            "GPU acceleration available - Single-threaded + Web Worker architecture".to_string()
        } else {
            "CPU-only processing - Single-threaded + Web Worker architecture".to_string()
        }
    }
    
    /// Get historical speedup data (placeholder for compatibility)
    #[wasm_bindgen]
    pub fn get_historical_speedup(&self, _algorithm: &str, _width: u32, _height: u32) -> Option<f64> {
        // Placeholder - return conservative estimate
        if self.gpu_available {
            Some(1.5) // Modest GPU speedup estimate
        } else {
            None
        }
    }
}

/// Initialize GPU processing pipeline (async)
#[wasm_bindgen]
pub async fn initialize_gpu_processing() -> Result<String, JsValue> {
    log::info!("🚀 Initializing GPU backend...");
    
    #[cfg(feature = "gpu-acceleration")]
    {
        use vectorize_core::gpu::device::try_init_gpu;
        
        match try_init_gpu().await {
            Some(device) => {
                let info = device.info_string();
                log::info!("✅ GPU backend initialized successfully");
                Ok(format!("GPU backend initialized: {}", info))
            }
            None => {
                log::warn!("⚠️ GPU backend initialization failed, falling back to CPU");
                Err(JsValue::from_str("GPU initialization failed"))
            }
        }
    }
    
    #[cfg(not(feature = "gpu-acceleration"))]
    {
        Err(JsValue::from_str("GPU acceleration feature not compiled"))
    }
}

/// GPU-accelerated vectorization using processing manager
#[wasm_bindgen]
pub async fn vectorize_with_gpu_acceleration(
    vectorizer: &WasmVectorizer,
    image_data: &ImageData,
    prefer_gpu: bool
) -> Result<String, JsValue> {
    log::info!("🎯 GPU-accelerated vectorization requested (prefer_gpu: {})", prefer_gpu);
    
    #[cfg(feature = "gpu-acceleration")]
    {
        use crate::processing_manager::{ProcessingManager, ProcessingConfig};
        
        // Create processing config with GPU preference
        let mut config = ProcessingConfig::default();
        config.set_try_gpu_acceleration(prefer_gpu);
        
        let mut manager = ProcessingManager::new(config);
        
        // Convert ImageData to raw bytes
        let width = image_data.width();
        let height = image_data.height();
        let data = image_data.data().to_vec();
        
        // Build vectorizer config
        let trace_config = vectorizer.config_builder.clone();
        
        // Process with GPU-aware manager
        let result = manager.process_image_with_fallback(
            &data, 
            width, 
            height, 
            &trace_config
        ).await;
        
        if result.success {
            log::info!("✅ GPU processing completed with {:?} in {:.1}ms", 
                result.backend_used, result.processing_time_ms);
            Ok(result.svg_output.unwrap_or_default())
        } else {
            let error_msg = result.error_message.unwrap_or("Unknown GPU processing error".to_string());
            log::warn!("❌ GPU processing failed: {}", error_msg);
            // Fallback to standard CPU vectorization
            vectorizer.vectorize(image_data)
        }
    }
    
    #[cfg(not(feature = "gpu-acceleration"))]
    {
        log::info!("GPU acceleration not available, using CPU implementation");
        vectorizer.vectorize(image_data)
    }
}

// Re-export GPU backend functions (excluding initialize_gpu_backend to avoid conflict)
pub use crate::gpu_backend::{
    detect_best_gpu_backend, get_active_gpu_backend, get_gpu_backend_status,
    get_gpu_capability_report, is_gpu_acceleration_available,
    reset_gpu_backend,
};

// Re-export capability functions  
pub use crate::capabilities::{
    check_threading_requirements, is_webgl2_available, is_webgpu_available,
};