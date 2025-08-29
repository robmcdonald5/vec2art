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
    algorithms::TraceBackend, config_builder::ConfigBuilder, vectorize_trace_low_rgba,
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
        
        self.backend = backend;
        log::info!("Backend set to: {:?}", self.backend);
        Ok(())
    }

    /// Set detail level (0.0 = low detail, 1.0 = high detail)
    #[wasm_bindgen]
    pub fn set_detail(&mut self, detail: f32) -> Result<(), JsValue> {
        self.config_builder = self.config_builder.clone().detail(detail)
            .map_err(|e| JsValue::from_str(&format!("Failed to set detail: {}", e)))?;
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
        self.config_builder = self.config_builder.clone().multipass(enabled);
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
        let config = self.config_builder.clone().build()
            .map_err(|e| JsValue::from_str(&format!("Configuration error: {}", e)))?;

        // Perform vectorization (single-threaded)
        let result = vectorize_trace_low_rgba(&img_buffer, &config, None)
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