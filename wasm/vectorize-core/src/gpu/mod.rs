//! GPU acceleration module for image processing algorithms
//!
//! This module provides GPU-accelerated implementations of compute-intensive
//! algorithms using WebGPU/wgpu. It includes:
//! - Device initialization and management
//! - Compute shader implementations for edge detection
//! - Memory management and data transfer optimization
//! - Automatic fallback to CPU when GPU is unavailable

#[cfg(feature = "gpu-acceleration")]
pub mod algorithm_selector;
#[cfg(feature = "gpu-acceleration")]
pub mod device;
#[cfg(feature = "gpu-acceleration")]
pub mod kernels;
#[cfg(feature = "gpu-acceleration")]
pub mod processor;

#[cfg(feature = "gpu-acceleration")]
pub use algorithm_selector::{
    GpuAlgorithm, GpuAlgorithmSelector, ImageCharacteristics, ProcessingStrategy,
};
#[cfg(feature = "gpu-acceleration")]
pub use device::{GpuDevice, GpuDeviceError};
#[cfg(feature = "gpu-acceleration")]
pub use processor::{GpuProcessor, GpuProcessorConfig};

/// Check if GPU acceleration is available (async version)
pub async fn is_gpu_available() -> bool {
    #[cfg(feature = "gpu-acceleration")]
    {
        match device::try_init_gpu().await {
            Some(_) => {
                log::info!("GPU acceleration is available");
                true
            }
            None => {
                log::warn!("GPU acceleration is not available");
                false
            }
        }
    }
    #[cfg(not(feature = "gpu-acceleration"))]
    {
        log::info!("GPU acceleration not compiled in");
        false
    }
}

/// Get GPU device information (async version)
pub async fn get_gpu_info() -> Option<String> {
    #[cfg(feature = "gpu-acceleration")]
    {
        match device::try_init_gpu().await {
            Some(device) => {
                let info = device.info_string();
                log::info!("GPU info: {}", info);
                Some(info)
            }
            None => {
                log::warn!("No GPU device available");
                None
            }
        }
    }
    #[cfg(not(feature = "gpu-acceleration"))]
    {
        log::info!("GPU acceleration not compiled in");
        None
    }
}

/// Synchronous fallback for GPU availability check (for compatibility)
pub fn is_gpu_available_sync() -> bool {
    #[cfg(feature = "gpu-acceleration")]
    {
        // This is a quick sync check - for full detection use is_gpu_available()
        false
    }
    #[cfg(not(feature = "gpu-acceleration"))]
    {
        false
    }
}

/// Get GPU backend type without full initialization
pub fn get_gpu_backend_type() -> String {
    #[cfg(feature = "gpu-acceleration")]
    {
        // Quick check if WebGPU APIs exist
        #[cfg(target_arch = "wasm32")]
        {
            // Use direct JavaScript evaluation to avoid wasm-bindgen binding issues
            use js_sys::eval;

            match eval("typeof navigator !== 'undefined' && navigator.gpu") {
                Ok(value) => {
                    if value.is_object() && !value.is_null() && !value.is_undefined() {
                        "webgpu".to_string()
                    } else {
                        "none".to_string()
                    }
                }
                Err(_) => "none".to_string(),
            }
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            // For native targets, assume Vulkan/Metal/DX12 available
            "native".to_string()
        }
    }
    #[cfg(not(feature = "gpu-acceleration"))]
    {
        "none".to_string()
    }
}
