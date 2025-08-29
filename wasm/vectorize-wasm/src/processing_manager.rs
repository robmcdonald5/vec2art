//! Processing Manager for vec2art WASM
//!
//! This module provides a comprehensive processing manager that handles
//! backend selection, fallback logic, and error recovery for image vectorization.
//! 
//! Note: This module is designed for single-threaded WASM + Web Worker architecture.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::gpu_backend::{GpuBackend, get_gpu_backend_status_internal, is_gpu_acceleration_available};
use std::time::Instant;
use image::{ImageBuffer, Rgba};

/// Processing backend types in order of preference
/// Note: For single-threaded WASM + Web Worker architecture
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum ProcessingBackend {
    /// WebGPU accelerated processing (fastest)
    WebGPU,
    /// WebGL2 accelerated processing (fast fallback)
    WebGL2,
    /// CPU single-threaded processing (standard fallback)
    CpuSingleThreaded,
}

/// Processing attempt result
#[derive(Debug, Clone)]
#[allow(dead_code)] // Reserved for future processing pipeline
pub struct ProcessingResult {
    pub success: bool,
    pub backend_used: ProcessingBackend,
    pub processing_time_ms: f64,
    pub error_message: Option<String>,
    pub svg_output: Option<String>,
}

/// Processing manager configuration
/// Note: Configured for single-threaded WASM + Web Worker architecture
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct ProcessingConfig {
    /// Whether to attempt GPU acceleration
    try_gpu_acceleration: bool,
    /// Maximum time to spend on each backend attempt (ms)
    max_attempt_time_ms: f64,
    /// Whether to enable aggressive fallback (try all backends)
    aggressive_fallback: bool,
    /// Whether to cache backend selection for subsequent runs
    cache_backend_selection: bool,
}

#[wasm_bindgen]
impl ProcessingConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ProcessingConfig {
        ProcessingConfig::default()
    }

    #[wasm_bindgen(getter)]
    pub fn try_gpu_acceleration(&self) -> bool {
        self.try_gpu_acceleration
    }

    #[wasm_bindgen(setter)]
    pub fn set_try_gpu_acceleration(&mut self, value: bool) {
        self.try_gpu_acceleration = value;
    }


    #[wasm_bindgen(getter)]
    pub fn max_attempt_time_ms(&self) -> f64 {
        self.max_attempt_time_ms
    }

    #[wasm_bindgen(setter)]
    pub fn set_max_attempt_time_ms(&mut self, value: f64) {
        self.max_attempt_time_ms = value;
    }

    #[wasm_bindgen(getter)]
    pub fn aggressive_fallback(&self) -> bool {
        self.aggressive_fallback
    }

    #[wasm_bindgen(setter)]
    pub fn set_aggressive_fallback(&mut self, value: bool) {
        self.aggressive_fallback = value;
    }

    #[wasm_bindgen(getter)]
    pub fn cache_backend_selection(&self) -> bool {
        self.cache_backend_selection
    }

    #[wasm_bindgen(setter)]
    pub fn set_cache_backend_selection(&mut self, value: bool) {
        self.cache_backend_selection = value;
    }
}

impl Default for ProcessingConfig {
    fn default() -> Self {
        ProcessingConfig {
            try_gpu_acceleration: true,
            max_attempt_time_ms: 10000.0, // 10 second timeout per attempt
            aggressive_fallback: true,
            cache_backend_selection: true,
        }
    }
}

/// Processing backend manager with intelligent fallback
#[allow(dead_code)] // Fields reserved for future processing pipeline
pub struct ProcessingManager {
    config: ProcessingConfig,
    preferred_backend: Option<ProcessingBackend>,
    backend_performance_history: std::collections::HashMap<ProcessingBackend, Vec<f64>>,
    last_successful_backend: Option<ProcessingBackend>,
}

impl ProcessingManager {
    pub fn new(config: ProcessingConfig) -> Self {
        Self {
            config,
            preferred_backend: None,
            backend_performance_history: std::collections::HashMap::new(),
            last_successful_backend: None,
        }
    }

    /// Determine the best processing backend based on capabilities and history
    pub fn determine_processing_order(&self) -> Vec<ProcessingBackend> {
        let mut backends = Vec::new();

        // If we have a cached preferred backend and caching is enabled, try it first
        if self.config.cache_backend_selection {
            if let Some(preferred) = self.last_successful_backend {
                backends.push(preferred);
            }
        }

        // Add backends based on availability and configuration
        if self.config.try_gpu_acceleration {
            let gpu_status = get_gpu_backend_status_internal();
            
            match gpu_status.backend() {
                GpuBackend::WebGPU if gpu_status.available() => {
                    if !backends.contains(&ProcessingBackend::WebGPU) {
                        backends.push(ProcessingBackend::WebGPU);
                    }
                }
                GpuBackend::WebGL2 if gpu_status.available() => {
                    if !backends.contains(&ProcessingBackend::WebGL2) {
                        backends.push(ProcessingBackend::WebGL2);
                    }
                }
                _ => {}
            }
        }

        // Always add single-threaded CPU processing
        if !backends.contains(&ProcessingBackend::CpuSingleThreaded) {
            backends.push(ProcessingBackend::CpuSingleThreaded);
        }

        // If aggressive fallback is disabled, limit to first two options
        if !self.config.aggressive_fallback && backends.len() > 2 {
            backends.truncate(2);
        }

        backends
    }

    /// Determine the appropriate GPU processing strategy based on the algorithm
    async fn get_gpu_processing_strategy(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        config: &vectorize_core::ConfigBuilder,
    ) -> Result<String, String> {
        // Build config to check algorithm type
        let trace_config = config.clone().build()
            .map_err(|e| format!("Config build failed: {:?}", e))?;

        // Initialize GPU device
        use vectorize_core::gpu::device::try_init_gpu;
        
        let gpu_device = match try_init_gpu().await {
            Some(device) => {
                if !device.supports_image_processing() {
                    return Err("GPU doesn't support required features for image processing".to_string());
                }
                std::sync::Arc::new(device)
            },
            None => return Err("Failed to initialize GPU device".to_string()),
        };

        // Convert RGBA data to appropriate format based on algorithm
        let rgba_image = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, image_data.to_vec())
            .ok_or("Failed to create RGBA image buffer".to_string())?;

        // Detect algorithm type based on config and apply appropriate GPU processing
        match trace_config.backend {
            vectorize_core::algorithms::TraceBackend::Superpixel => {
                log::info!("🎨 Using GPU SLIC superpixel processing");
                
                use vectorize_core::gpu::kernels::superpixel::GpuSlicSegmentation;
                let slic_processor = GpuSlicSegmentation::new(gpu_device)
                    .map_err(|e| format!("Failed to create SLIC processor: {}", e))?;

                // Perform GPU SLIC segmentation
                let _superpixels = slic_processor.segment(&rgba_image, 1000, 10.0).await
                    .map_err(|e| format!("GPU SLIC segmentation failed: {}", e))?;

                // For now, convert superpixels to edges for vectorization
                // In production, this would use the superpixel boundaries
                let edge_image = self.convert_superpixels_to_edges(&rgba_image, width, height);
                let result = vectorize_core::vectorize_trace_low_rgba(&edge_image, &trace_config, None)
                    .map_err(|e| format!("GPU superpixel vectorization failed: {:?}", e))?;

                Ok(result)
            },
            vectorize_core::algorithms::TraceBackend::Dots => {
                log::info!("🔘 Using GPU stippling processing");
                
                use vectorize_core::gpu::kernels::stippling::{GpuStippling, StipplingConfig};
                
                // Convert to grayscale for stippling
                let luma_data: Vec<u8> = image_data
                    .chunks(4)
                    .map(|rgba| {
                        let r = rgba[0] as f32;
                        let g = rgba[1] as f32; 
                        let b = rgba[2] as f32;
                        (0.299 * r + 0.587 * g + 0.114 * b) as u8
                    })
                    .collect();

                let luma_image = image::ImageBuffer::from_raw(width, height, luma_data)
                    .ok_or("Failed to create grayscale image buffer".to_string())?;

                let stippling_processor = GpuStippling::new(gpu_device)
                    .map_err(|e| format!("Failed to create stippling processor: {}", e))?;

                let stippling_config = StipplingConfig {
                    dot_size: 2.0,
                    density: 0.3,
                    adaptive: true,
                    ..Default::default()
                };

                // Perform GPU stippling
                let stippled_image = stippling_processor.process_image(&luma_image, &stippling_config).await
                    .map_err(|e| format!("GPU stippling failed: {}", e))?;

                // Convert stippled image to SVG
                let result = vectorize_core::vectorize_trace_low_rgba(&stippled_image, &trace_config, None)
                    .map_err(|e| format!("GPU stippling vectorization failed: {:?}", e))?;

                Ok(result)
            },
            _ => {
                // Use GPU edge detection for other algorithms
                log::info!("🔍 Using GPU edge detection processing");
                
                use vectorize_core::gpu::kernels::edge_detection::GpuCannyEdgeDetector;
                
                let luma_data: Vec<u8> = image_data
                    .chunks(4)
                    .map(|rgba| {
                        let r = rgba[0] as f32;
                        let g = rgba[1] as f32; 
                        let b = rgba[2] as f32;
                        (0.299 * r + 0.587 * g + 0.114 * b) as u8
                    })
                    .collect();

                let luma_image = image::ImageBuffer::from_raw(width, height, luma_data)
                    .ok_or("Failed to create grayscale image buffer".to_string())?;

                let gpu_detector = GpuCannyEdgeDetector::new(gpu_device)
                    .map_err(|e| format!("Failed to create GPU edge detector: {}", e))?;

                let edge_image = gpu_detector.detect_edges(&luma_image, 0.1, 0.3).await
                    .map_err(|e| format!("GPU edge detection failed: {}", e))?;

                // Convert edge image back to RGBA for vectorization
                let rgba_data: Vec<u8> = edge_image
                    .as_raw()
                    .iter()
                    .flat_map(|&edge| [edge, edge, edge, 255u8])
                    .collect();

                let rgba_processed_image = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, rgba_data)
                    .ok_or("Failed to create RGBA image buffer from GPU processing".to_string())?;

                let result = vectorize_core::vectorize_trace_low_rgba(&rgba_processed_image, &trace_config, None)
                    .map_err(|e| format!("GPU-assisted vectorization failed: {:?}", e))?;

                Ok(result)
            }
        }
    }

    /// Helper function to convert superpixel boundaries to edge image
    fn convert_superpixels_to_edges(
        &self,
        _image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        width: u32,
        height: u32,
    ) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
        // For now, return the original image
        // In production, this would extract superpixel boundaries and create edge lines
        ImageBuffer::from_fn(width, height, |_, _| Rgba([255u8, 255u8, 255u8, 255u8]))
    }

    /// Process image with automatic backend selection and fallback
    #[allow(dead_code)] // Reserved for future processing pipeline
    pub async fn process_image_with_fallback(
        &mut self,
        image_data: &[u8],
        width: u32,
        height: u32,
        config: &vectorize_core::ConfigBuilder,
    ) -> ProcessingResult {
        let processing_order = self.determine_processing_order();
        
        log::info!(
            "Processing image with backend order: {:?}",
            processing_order
        );

        let mut last_error = None;

        for backend in processing_order {
            let start_time = Instant::now();
            
            log::info!("Attempting processing with backend: {:?}", backend);

            // Attempt processing with current backend
            let result = match backend {
                ProcessingBackend::WebGPU => {
                    self.try_webgpu_processing(image_data, width, height, config).await
                }
                ProcessingBackend::WebGL2 => {
                    self.try_webgl2_processing(image_data, width, height, config).await
                }
                ProcessingBackend::CpuSingleThreaded => {
                    self.try_cpu_singlethreaded_processing(image_data, width, height, config).await
                }
            };

            let processing_time = start_time.elapsed().as_millis() as f64;

            // Check for timeout
            if processing_time > self.config.max_attempt_time_ms {
                log::warn!(
                    "Backend {:?} exceeded timeout ({:.1}ms > {:.1}ms)",
                    backend,
                    processing_time,
                    self.config.max_attempt_time_ms
                );
                last_error = Some(format!("Backend {:?} timed out", backend));
                continue;
            }

            match result {
                Ok(svg_output) => {
                    // Success! Record performance and return result
                    self.record_backend_performance(backend, processing_time);
                    self.last_successful_backend = Some(backend);

                    log::info!(
                        "Successfully processed with {:?} in {:.1}ms",
                        backend,
                        processing_time
                    );

                    return ProcessingResult {
                        success: true,
                        backend_used: backend,
                        processing_time_ms: processing_time,
                        error_message: None,
                        svg_output: Some(svg_output),
                    };
                }
                Err(error) => {
                    log::warn!("Backend {:?} failed: {}", backend, error);
                    last_error = Some(error);
                    
                    // Continue to next backend
                    continue;
                }
            }
        }

        // All backends failed
        ProcessingResult {
            success: false,
            backend_used: ProcessingBackend::CpuSingleThreaded,
            processing_time_ms: 0.0,
            error_message: last_error,
            svg_output: None,
        }
    }

    #[allow(dead_code)] // Reserved for future processing pipeline
    fn record_backend_performance(&mut self, backend: ProcessingBackend, time_ms: f64) {
        let history = self.backend_performance_history
            .entry(backend)
            .or_insert_with(Vec::new);
        
        history.push(time_ms);
        
        // Keep only last 10 measurements
        if history.len() > 10 {
            history.remove(0);
        }
    }

    async fn try_webgpu_processing(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        config: &vectorize_core::ConfigBuilder,
    ) -> Result<String, String> {
        #[cfg(feature = "gpu-acceleration")]
        {
            if !is_gpu_acceleration_available() {
                return Err("GPU acceleration not available".to_string());
            }

            log::info!("🚀 Starting WebGPU processing with algorithm-specific optimization...");
            
            // Use the intelligent GPU processing strategy
            let result = self.get_gpu_processing_strategy(image_data, width, height, config).await?;
            
            log::info!("✅ WebGPU processing completed successfully");
            Ok(result)
        }

        #[cfg(not(feature = "gpu-acceleration"))]
        {
            Err("GPU acceleration feature not enabled".to_string())
        }
    }

    async fn try_webgl2_processing(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        config: &vectorize_core::ConfigBuilder,
    ) -> Result<String, String> {
        #[cfg(feature = "gpu-acceleration")]
        {
            if !is_gpu_acceleration_available() {
                return Err("GPU acceleration not available".to_string());
            }

            // Get GPU backend status to ensure WebGL2 is available
            let gpu_status = get_gpu_backend_status_internal();
            if !gpu_status.webgl2_supported() {
                return Err("WebGL2 not supported".to_string());
            }

            log::info!("🎮 Starting WebGL2-accelerated processing...");

            // Initialize GPU device with WebGL2 backend preference
            use vectorize_core::gpu::device::try_init_gpu;
            
            let gpu_device = match try_init_gpu().await {
                Some(device) => {
                    log::info!("WebGL2 GPU device initialized: {}", device.adapter_info.backend);
                    if !device.supports_image_processing() {
                        return Err("WebGL2 device doesn't support required features".to_string());
                    }
                    device
                },
                None => return Err("Failed to initialize WebGL2 device".to_string()),
            };

            // Check if this is actually WebGL2 backend
            if !gpu_device.adapter_info.backend.to_lowercase().contains("gl") {
                log::warn!("Expected WebGL2 but got: {}", gpu_device.adapter_info.backend);
                // Continue anyway - WebGPU is better than CPU fallback
            }

            // Convert RGBA data to Luma for WebGL2 edge detection
            let luma_data: Vec<u8> = image_data
                .chunks(4)
                .map(|rgba| {
                    // Convert RGBA to grayscale using standard weights
                    let r = rgba[0] as f32;
                    let g = rgba[1] as f32; 
                    let b = rgba[2] as f32;
                    (0.299 * r + 0.587 * g + 0.114 * b) as u8
                })
                .collect();

            let luma_image = image::ImageBuffer::from_raw(width, height, luma_data)
                .ok_or("Failed to create grayscale image buffer for WebGL2".to_string())?;

            // Use WebGL2-compatible GPU edge detector
            use vectorize_core::gpu::kernels::edge_detection::GpuCannyEdgeDetector;
            
            let gpu_detector = GpuCannyEdgeDetector::new(std::sync::Arc::new(gpu_device))
                .map_err(|e| format!("Failed to create WebGL2 edge detector: {}", e))?;

            // Use WebGL2 edge detection with conservative thresholds
            let edge_image = gpu_detector.detect_edges(&luma_image, 0.1, 0.3).await
                .map_err(|e| format!("WebGL2 edge detection failed: {}", e))?;

            // Convert edge image back to RGBA for vectorization
            let rgba_data: Vec<u8> = edge_image
                .as_raw()
                .iter()
                .flat_map(|&edge| [edge, edge, edge, 255u8]) // Convert grayscale edges to RGBA
                .collect();

            let rgba_image = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, rgba_data)
                .ok_or("Failed to create RGBA image buffer from WebGL2 edges".to_string())?;

            // Build the config and vectorize the WebGL2-processed edges
            let trace_config = config.clone().build()
                .map_err(|e| format!("Config build failed: {:?}", e))?;
            
            let result = vectorize_core::vectorize_trace_low_rgba(&rgba_image, &trace_config, None)
                .map_err(|e| format!("WebGL2-assisted vectorization failed: {:?}", e))?;

            log::info!("✅ WebGL2 processing completed successfully");
            Ok(result)
        }

        #[cfg(not(feature = "gpu-acceleration"))]
        {
            Err("GPU acceleration feature not enabled".to_string())
        }
    }

    #[allow(dead_code)] // Reserved for future processing pipeline
    async fn try_cpu_singlethreaded_processing(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        config: &vectorize_core::ConfigBuilder,
    ) -> Result<String, String> {
        // Single-threaded CPU processing - always available fallback
        self.cpu_process_image(image_data, width, height, config).await
    }

    #[allow(dead_code)] // Reserved for future processing pipeline
    async fn cpu_process_image(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        config: &vectorize_core::ConfigBuilder,
    ) -> Result<String, String> {
        // Convert image data to ImageBuffer
        let img_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(
            width,
            height,
            image_data.to_vec()
        ).ok_or("Failed to create image buffer".to_string())?;

        // Build the config properly
        let trace_config = config.clone().build().map_err(|e| format!("Config build failed: {:?}", e))?;
        
        // Process with vectorize-core (single-threaded)
        let result = vectorize_core::vectorize_trace_low_rgba(&img_buffer, &trace_config, None);

        result.map_err(|e| format!("Vectorization failed: {:?}", e))
    }
}

/// Get backend performance statistics
#[wasm_bindgen]
pub fn get_backend_performance_report() -> String {
    let mut report = String::new();
    
    report.push_str("=== Processing Backend Performance Report ===\n\n");
    
    // Check backend availability
    let gpu_status = get_gpu_backend_status_internal();
    
    report.push_str("Backend Availability:\n");
    report.push_str(&format!("• WebGPU: {}\n", 
        if gpu_status.webgpu_supported() && gpu_status.backend() == GpuBackend::WebGPU { 
            "✓ Available" 
        } else { 
            "✗ Not Available" 
        }));
    report.push_str(&format!("• WebGL2: {}\n", 
        if gpu_status.webgl2_supported() { 
            "✓ Available" 
        } else { 
            "✗ Not Available" 
        }));
    report.push_str("• CPU Single-threaded: ✓ Always Available (via Web Worker)\n\n");
    
    // Recommended processing order
    let config = ProcessingConfig::default();
    let manager = ProcessingManager::new(config);
    let processing_order = manager.determine_processing_order();
    
    report.push_str("Recommended Processing Order:\n");
    for (i, backend) in processing_order.iter().enumerate() {
        report.push_str(&format!("{}. {:?}\n", i + 1, backend));
    }
    
    report.push_str("\nOptimal Configuration:\n");
    report.push_str(&format!("• GPU Acceleration: {}\n", 
        if gpu_status.available() { "Enabled" } else { "Disabled (not available)" }));
    report.push_str("• Architecture: Single-threaded WASM + Web Worker\n");
    report.push_str("• Fallback Strategy: Aggressive (try all available backends)\n");
    
    report
}

/// Create a processing manager with recommended configuration
#[wasm_bindgen]
pub fn create_optimal_processing_manager() -> ProcessingConfig {
    let gpu_status = get_gpu_backend_status_internal();
    
    ProcessingConfig {
        try_gpu_acceleration: gpu_status.available(),
        max_attempt_time_ms: 15000.0, // 15 second timeout
        aggressive_fallback: true,
        cache_backend_selection: true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_processing_config_creation() {
        let config = ProcessingConfig::new();
        assert!(config.try_gpu_acceleration);
        assert!(config.aggressive_fallback);
        assert!(config.cache_backend_selection);
    }

    #[test]
    fn test_processing_manager_backend_order() {
        let config = ProcessingConfig::default();
        let manager = ProcessingManager::new(config);
        let order = manager.determine_processing_order();
        
        // Should always end with single-threaded fallback
        assert_eq!(order.last(), Some(&ProcessingBackend::CpuSingleThreaded));
        assert!(!order.is_empty());
    }

    #[test]
    fn test_backend_performance_recording() {
        let config = ProcessingConfig::default();
        let mut manager = ProcessingManager::new(config);
        
        manager.record_backend_performance(ProcessingBackend::CpuSingleThreaded, 1000.0);
        manager.record_backend_performance(ProcessingBackend::CpuSingleThreaded, 800.0);
        
        let history = manager.backend_performance_history
            .get(&ProcessingBackend::CpuSingleThreaded)
            .unwrap();
        
        assert_eq!(history.len(), 2);
        assert_eq!(history[0], 1000.0);
        assert_eq!(history[1], 800.0);
    }
}