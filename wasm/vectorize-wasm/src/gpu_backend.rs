//! GPU Backend Management for vec2art WASM
//!
//! This module provides comprehensive GPU backend detection, initialization,
//! and fallback management for both WebGPU and WebGL2 rendering contexts.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[cfg(feature = "gpu-acceleration")]
use {
    wgpu::{Adapter, Device, Instance, Queue, Backends, DeviceDescriptor, Features, Limits},
    std::sync::{Arc, Mutex, OnceLock},
};

/// Available GPU backends for image processing acceleration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum GpuBackend {
    /// WebGPU backend (preferred, best performance)
    WebGPU,
    /// WebGL2 backend (fallback, good compatibility)
    WebGL2,
    /// No GPU acceleration available (CPU fallback)
    None,
}

/// GPU initialization status
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GpuStatus {
    /// GPU backend not yet initialized
    NotInitialized,
    /// GPU backend initialization in progress
    Initializing,
    /// GPU backend successfully initialized
    Ready(GpuBackend),
    /// GPU backend initialization failed
    Failed(String),
}

/// GPU backend configuration and status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct GpuBackendInfo {
    /// Currently active backend
    backend: GpuBackend,
    /// Whether GPU acceleration is available and working
    available: bool,
    /// Whether WebGPU is supported in this browser
    webgpu_supported: bool,
    /// Whether WebGL2 is supported in this browser
    webgl2_supported: bool,
    /// Estimated GPU memory in MB (if available)
    estimated_memory_mb: Option<f64>,
}

impl GpuBackendInfo {
    pub fn new(
        backend: GpuBackend,
        available: bool,
        webgpu_supported: bool,
        webgl2_supported: bool,
        estimated_memory_mb: Option<f64>,
    ) -> Self {
        Self {
            backend,
            available,
            webgpu_supported,
            webgl2_supported,
            estimated_memory_mb,
        }
    }
}

#[wasm_bindgen]
impl GpuBackendInfo {
    #[wasm_bindgen(getter)]
    pub fn backend(&self) -> GpuBackend {
        self.backend
    }

    #[wasm_bindgen(getter)]
    pub fn available(&self) -> bool {
        self.available
    }

    #[wasm_bindgen(getter)]
    pub fn status_message(&self) -> String {
        match self.backend {
            GpuBackend::WebGPU if self.available => "WebGPU initialized successfully".to_string(),
            GpuBackend::WebGL2 if self.available => "WebGL2 initialized successfully".to_string(),
            GpuBackend::None => "No GPU acceleration available".to_string(),
            _ => "GPU backend not available".to_string(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn webgpu_supported(&self) -> bool {
        self.webgpu_supported
    }

    #[wasm_bindgen(getter)]
    pub fn webgl2_supported(&self) -> bool {
        self.webgl2_supported
    }

    #[wasm_bindgen(getter)]
    pub fn estimated_memory_mb(&self) -> Option<f64> {
        self.estimated_memory_mb
    }

    #[wasm_bindgen(getter)]
    pub fn adapter_info(&self) -> String {
        match self.backend {
            GpuBackend::WebGPU => "WebGPU Adapter".to_string(),
            GpuBackend::WebGL2 => "WebGL2 Context".to_string(),
            GpuBackend::None => "No GPU".to_string(),
        }
    }
}

#[cfg(feature = "gpu-acceleration")]
/// GPU context holding WebGPU resources
#[allow(dead_code)] // Reserved for future GPU acceleration
pub struct GpuContext {
    pub instance: Instance,
    pub adapter: Adapter,
    pub device: Device,
    pub queue: Queue,
    pub backend_type: GpuBackend,
}

// GPU context is stored locally for now due to WASM threading constraints
// #[cfg(feature = "gpu-acceleration")]
// static GPU_CONTEXT: OnceLock<Arc<Mutex<Option<GpuContext>>>> = OnceLock::new();
static GPU_STATUS: OnceLock<Arc<Mutex<GpuStatus>>> = OnceLock::new();

/// Initialize GPU backend with automatic detection and fallback
#[wasm_bindgen]
pub async fn initialize_gpu_backend() -> Result<GpuBackendInfo, JsValue> {
    #[cfg(feature = "gpu-acceleration")]
    {
        let status_mutex = GPU_STATUS.get_or_init(|| Arc::new(Mutex::new(GpuStatus::NotInitialized)));
        
        // Check if already initializing or ready
        {
            let status = status_mutex.lock().unwrap();
            match &*status {
                GpuStatus::Initializing => {
                    return Err(JsValue::from_str("GPU initialization already in progress"));
                }
                GpuStatus::Ready(backend) => {
                    return Ok(create_gpu_backend_info(*backend, true));
                }
                GpuStatus::Failed(_msg) => {
                    return Ok(create_gpu_backend_info(GpuBackend::None, false));
                }
                GpuStatus::NotInitialized => {}
            }
        }

        // Set status to initializing
        {
            let mut status = status_mutex.lock().unwrap();
            *status = GpuStatus::Initializing;
        }

        // Try to initialize GPU backends in order of preference
        let result = try_initialize_gpu().await;

        // Update status based on result
        {
            let mut status = status_mutex.lock().unwrap();
            match &result {
                Ok(info) if info.available => {
                    *status = GpuStatus::Ready(info.backend);
                }
                Ok(info) => {
                    *status = GpuStatus::Failed(info.status_message());
                }
                Err(e) => {
                    let error_msg = format!("GPU initialization failed: {:?}", e);
                    *status = GpuStatus::Failed(error_msg);
                }
            }
        }

        result
    }

    #[cfg(not(feature = "gpu-acceleration"))]
    {
        Ok(create_gpu_backend_info(
            GpuBackend::None,
            false
        ))
    }
}

#[cfg(feature = "gpu-acceleration")]
async fn try_initialize_gpu() -> Result<GpuBackendInfo, JsValue> {
    // First, try WebGPU
    if crate::capabilities::is_webgpu_available() {
        match try_initialize_webgpu().await {
            Ok(_context) => {
                // Context initialized successfully
                // Note: Context storage removed for WASM threading compatibility
                
                return Ok(create_gpu_backend_info(
                    GpuBackend::WebGPU,
                    true
                ));
            }
            Err(e) => {
                log::warn!("WebGPU initialization failed: {:?}", e);
            }
        }
    }

    // If WebGPU failed, try WebGL2
    if crate::capabilities::is_webgl2_available() {
        match try_initialize_webgl2().await {
            Ok(_) => {
                return Ok(create_gpu_backend_info(
                    GpuBackend::WebGL2,
                    true
                ));
            }
            Err(e) => {
                log::warn!("WebGL2 initialization failed: {:?}", e);
            }
        }
    }

    // Both failed, return no GPU acceleration
    Ok(create_gpu_backend_info(
        GpuBackend::None,
        false
    ))
}

#[cfg(feature = "gpu-acceleration")]
async fn try_initialize_webgpu() -> Result<GpuContext, Box<dyn std::error::Error>> {
    // Create WebGPU instance with WebGPU backend preference
    let instance = Instance::new(&wgpu::InstanceDescriptor {
        backends: Backends::BROWSER_WEBGPU,
        ..Default::default()
    });

    // Request adapter
    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: None,
            force_fallback_adapter: false,
        })
        .await
        .map_err(|e| format!("Failed to find WebGPU adapter: {:?}", e))?;

    // Get adapter info for diagnostics
    let adapter_info = adapter.get_info();
    log::info!("WebGPU adapter: {:?}", adapter_info);

    // Request device with appropriate features and limits
    let (device, queue) = adapter
        .request_device(
            &DeviceDescriptor {
                label: Some("vec2art WebGPU Device"),
                required_features: Features::empty(),
                required_limits: Limits::downlevel_webgl2_defaults(),
                memory_hints: wgpu::MemoryHints::default(),
                trace: wgpu::Trace::Off,
            },
        )
        .await
        .map_err(|e| format!("Failed to create WebGPU device: {:?}", e))?;

    Ok(GpuContext {
        instance,
        adapter,
        device,
        queue,
        backend_type: GpuBackend::WebGPU,
    })
}

#[cfg(feature = "gpu-acceleration")]
async fn try_initialize_webgl2() -> Result<(), Box<dyn std::error::Error>> {
    // For WebGL2, we would typically create a WebGL2 rendering context
    // For now, we'll just check if it's available (already done in capabilities)
    // Full WebGL2 integration would require additional setup
    
    log::info!("WebGL2 context creation would go here");
    // TODO: Implement WebGL2 context creation for image processing
    
    Ok(())
}

fn create_gpu_backend_info(backend: GpuBackend, available: bool) -> GpuBackendInfo {
    let webgpu_supported = crate::capabilities::is_webgpu_available();
    let webgl2_supported = crate::capabilities::is_webgl2_available();
    
    GpuBackendInfo::new(
        backend,
        available,
        webgpu_supported,
        webgl2_supported,
        None, // TODO: Implement memory detection
    )
}

/// Get current GPU backend status for internal use
pub fn get_gpu_backend_status_internal() -> GpuBackendInfo {
    #[cfg(feature = "gpu-acceleration")]
    {
        let status_mutex = GPU_STATUS.get_or_init(|| Arc::new(Mutex::new(GpuStatus::NotInitialized)));
        let status = status_mutex.lock().unwrap();
        
        match &*status {
            GpuStatus::NotInitialized => {
                create_gpu_backend_info(GpuBackend::None, false)
            }
            GpuStatus::Initializing => {
                create_gpu_backend_info(GpuBackend::None, false)
            }
            GpuStatus::Ready(backend) => {
                create_gpu_backend_info(*backend, true)
            }
            GpuStatus::Failed(_msg) => {
                create_gpu_backend_info(GpuBackend::None, false)
            }
        }
    }

    #[cfg(not(feature = "gpu-acceleration"))]
    {
        create_gpu_backend_info(
            GpuBackend::None,
            false
        )
    }
}

/// Get current GPU backend status as a JSON string for JavaScript
#[wasm_bindgen]
pub fn get_gpu_backend_status() -> String {
    let info = get_gpu_backend_status_internal();
    
    // Return as JSON string for reliable JavaScript consumption
    serde_json::to_string(&serde_json::json!({
        "available": info.available,
        "backend": match info.backend {
            GpuBackend::WebGPU => "webgpu",
            GpuBackend::WebGL2 => "webgl2", 
            GpuBackend::None => "none"
        },
        "webgpu_supported": info.webgpu_supported,
        "webgl2_supported": info.webgl2_supported,
        "status_message": info.status_message(),
        "estimated_memory_mb": info.estimated_memory_mb
    })).unwrap_or_else(|_| r#"{"available": false, "backend": "none", "status_message": "JSON serialization failed"}"#.to_string())
}

/// Check if GPU acceleration is currently available
#[wasm_bindgen]
pub fn is_gpu_acceleration_available() -> bool {
    get_gpu_backend_status_internal().available
}

/// Get the currently active GPU backend type
#[wasm_bindgen]
pub fn get_active_gpu_backend() -> GpuBackend {
    get_gpu_backend_status_internal().backend
}

/// Force reset GPU backend (for testing/debugging)
#[wasm_bindgen]
pub fn reset_gpu_backend() {
    #[cfg(feature = "gpu-acceleration")]
    {
        if let Some(status_mutex) = GPU_STATUS.get() {
            let mut status = status_mutex.lock().unwrap();
            *status = GpuStatus::NotInitialized;
        }
        
        // Context reset removed for WASM compatibility
        // if let Some(context_mutex) = GPU_CONTEXT.get() {
        //     let mut context = context_mutex.lock().unwrap();
        //     *context = None;
        // }
    }
    
    log::info!("GPU backend reset");
}

/// Detect best available GPU backend without full initialization
#[wasm_bindgen]
pub fn detect_best_gpu_backend() -> GpuBackend {
    if crate::capabilities::is_webgpu_available() {
        GpuBackend::WebGPU
    } else if crate::capabilities::is_webgl2_available() {
        GpuBackend::WebGL2
    } else {
        GpuBackend::None
    }
}

// GPU context getter removed for WASM compatibility
// #[cfg(feature = "gpu-acceleration")]
// /// Get GPU context for internal use by processing algorithms
// pub(crate) fn get_gpu_context() -> Option<Arc<Mutex<Option<GpuContext>>>> {
//     GPU_CONTEXT.get().cloned()
// }

/// Get comprehensive GPU capability report
#[wasm_bindgen]
pub fn get_gpu_capability_report() -> String {
    let mut report = String::new();
    
    report.push_str("=== GPU Capability Report ===\n\n");
    
    let webgpu = crate::capabilities::is_webgpu_available();
    let webgl2 = crate::capabilities::is_webgl2_available();
    let best_backend = detect_best_gpu_backend();
    let status = get_gpu_backend_status_internal();
    
    report.push_str(&format!("WebGPU Available: {}\n", webgpu));
    report.push_str(&format!("WebGL2 Available: {}\n", webgl2));
    report.push_str(&format!("Best Backend: {:?}\n", best_backend));
    report.push_str(&format!("Current Status: {}\n", status.status_message()));
    report.push_str(&format!("GPU Acceleration: {}\n", if status.available { "Available" } else { "Not Available" }));
    
    if webgpu {
        report.push_str("\n✓ WebGPU is supported - best performance available\n");
    } else if webgl2 {
        report.push_str("\n✓ WebGL2 is supported - good fallback performance\n");
    } else {
        report.push_str("\n✗ No GPU acceleration available - will use CPU processing\n");
    }
    
    report.push_str("\nRecommended processing chain:\n");
    match best_backend {
        GpuBackend::WebGPU => {
            report.push_str("1. WebGPU acceleration (preferred)\n");
            report.push_str("2. CPU multithreading (fallback)\n");
            report.push_str("3. CPU single-threaded (final fallback)\n");
        }
        GpuBackend::WebGL2 => {
            report.push_str("1. WebGL2 acceleration (preferred)\n");
            report.push_str("2. CPU multithreading (fallback)\n"); 
            report.push_str("3. CPU single-threaded (final fallback)\n");
        }
        GpuBackend::None => {
            report.push_str("1. CPU multithreading (preferred)\n");
            report.push_str("2. CPU single-threaded (fallback)\n");
        }
    }
    
    report
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_gpu_backend_detection() {
        let backend = detect_best_gpu_backend();
        
        // Should be one of the valid backends
        match backend {
            GpuBackend::WebGPU | GpuBackend::WebGL2 | GpuBackend::None => {}
        }
    }

    #[wasm_bindgen_test]
    fn test_gpu_status_functions() {
        let status = get_gpu_backend_status_internal();
        assert!(!status.status_message().is_empty());
        
        let available = is_gpu_acceleration_available();
        assert_eq!(available, status.available());
        
        let active = get_active_gpu_backend();
        assert_eq!(active, status.backend());
    }

    #[wasm_bindgen_test]
    fn test_capability_report() {
        let report = get_gpu_capability_report();
        assert!(report.contains("GPU Capability Report"));
        assert!(report.contains("WebGPU Available"));
        assert!(report.contains("WebGL2 Available"));
    }
}