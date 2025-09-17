//! GPU processor trait and implementation
//!
//! This module provides the main GPU processing interface and implementation
//! for accelerated image processing algorithms.

use crate::gpu::device::GpuDevice;
use crate::gpu::kernels::edge_detection::{GpuCannyEdgeDetector, GpuEdgeDetectionError};
use crate::gpu::kernels::stippling::{GpuStippling, GpuStipplingError, StipplingConfig};
use image::{ImageBuffer, Luma, Rgba};
use std::sync::Arc;
use thiserror::Error;
use wgpu::{util::DeviceExt, PollType};

#[derive(Debug, Error)]
pub enum GpuProcessorError {
    #[error("GPU device not initialized")]
    DeviceNotInitialized,
    #[error("Buffer creation failed: {0}")]
    BufferCreation(String),
    #[error("Shader compilation failed: {0}")]
    ShaderCompilation(String),
    #[error("Compute pipeline creation failed: {0}")]
    PipelineCreation(String),
    #[error("GPU execution failed: {0}")]
    ExecutionFailed(String),
    #[error("Unsupported image format")]
    UnsupportedFormat,
    #[error("Edge detection error: {0}")]
    EdgeDetectionError(#[from] GpuEdgeDetectionError),
    #[error("Stippling error: {0}")]
    StipplingError(#[from] GpuStipplingError),
}

/// Configuration for GPU processor
#[derive(Debug, Clone)]
pub struct GpuProcessorConfig {
    /// Enable automatic fallback to CPU for small images
    pub auto_fallback: bool,
    /// Minimum image size (in pixels) for GPU processing
    pub min_gpu_size: u32,
    /// Maximum texture dimension
    pub max_texture_size: u32,
    /// Preferred workgroup size for 2D operations
    pub workgroup_size_2d: (u32, u32),
    /// Preferred workgroup size for 1D operations
    pub workgroup_size_1d: u32,
}

impl Default for GpuProcessorConfig {
    fn default() -> Self {
        Self {
            auto_fallback: true,
            min_gpu_size: 1_000_000, // 1 megapixel
            max_texture_size: 8192,
            workgroup_size_2d: (16, 16),
            workgroup_size_1d: 64,
        }
    }
}

/// Main GPU processor for image operations
pub struct GpuProcessor {
    device: Arc<GpuDevice>,
    config: GpuProcessorConfig,
}

impl GpuProcessor {
    /// Create a new GPU processor
    pub fn new(device: GpuDevice, config: GpuProcessorConfig) -> Self {
        Self {
            device: Arc::new(device),
            config,
        }
    }

    /// Create with default configuration
    pub fn with_device(device: GpuDevice) -> Self {
        Self::new(device, GpuProcessorConfig::default())
    }

    /// Check if GPU should be used for given image size
    pub fn should_use_gpu(&self, width: u32, height: u32) -> bool {
        let pixel_count = width * height;
        pixel_count >= self.config.min_gpu_size
            && width <= self.config.max_texture_size
            && height <= self.config.max_texture_size
    }

    /// Process edge detection on GPU (Canny algorithm)
    pub async fn detect_edges_canny(
        &self,
        image: &ImageBuffer<Luma<u8>, Vec<u8>>,
        low_threshold: f32,
        high_threshold: f32,
    ) -> Result<ImageBuffer<Luma<u8>, Vec<u8>>, GpuProcessorError> {
        let (width, height) = image.dimensions();

        if !self.should_use_gpu(width, height) {
            return Err(GpuProcessorError::ExecutionFailed(
                "Image too small for GPU processing".to_string(),
            ));
        }

        // Create GPU Canny edge detector
        let edge_detector = GpuCannyEdgeDetector::new(self.device.clone())?;

        // Perform edge detection on GPU
        let result = edge_detector
            .detect_edges(image, low_threshold, high_threshold)
            .await?;

        Ok(result)
    }

    /// Apply Gaussian blur on GPU
    pub async fn gaussian_blur(
        &self,
        image: &ImageBuffer<Luma<u8>, Vec<u8>>,
        _sigma: f32,
    ) -> Result<ImageBuffer<Luma<u8>, Vec<u8>>, GpuProcessorError> {
        let (width, height) = image.dimensions();

        if !self.should_use_gpu(width, height) {
            return Err(GpuProcessorError::ExecutionFailed(
                "Image too small for GPU processing".to_string(),
            ));
        }

        // This will be implemented with actual GPU compute shaders
        Err(GpuProcessorError::ExecutionFailed(
            "GPU Gaussian blur not yet implemented".to_string(),
        ))
    }

    /// Apply stippling (dots) effect on GPU
    pub async fn apply_stippling(
        &self,
        image: &ImageBuffer<Luma<u8>, Vec<u8>>,
        config: &StipplingConfig,
    ) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, GpuProcessorError> {
        let (width, height) = image.dimensions();

        if !self.should_use_gpu(width, height) {
            return Err(GpuProcessorError::ExecutionFailed(
                "Image too small for GPU processing".to_string(),
            ));
        }

        // Create GPU stippling processor
        let stippling_processor = GpuStippling::new(self.device.clone())?;

        // Perform stippling on GPU
        let result = stippling_processor.process_image(image, config).await?;

        Ok(result)
    }

    /// Process SLIC superpixels on GPU
    pub async fn compute_superpixels(
        &self,
        image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        _num_segments: u32,
        _compactness: f32,
    ) -> Result<Vec<u32>, GpuProcessorError> {
        let (width, height) = image.dimensions();

        if !self.should_use_gpu(width, height) {
            return Err(GpuProcessorError::ExecutionFailed(
                "Image too small for GPU processing".to_string(),
            ));
        }

        // This will be implemented with actual GPU compute shaders
        Err(GpuProcessorError::ExecutionFailed(
            "GPU superpixel segmentation not yet implemented".to_string(),
        ))
    }

    /// Get device information
    pub fn device_info(&self) -> String {
        self.device.info_string()
    }

    /// Check if GPU is available and initialized
    pub fn is_available(&self) -> bool {
        self.device.supports_image_processing()
    }
}

/// Trait for GPU-accelerated image processing
pub trait GpuAccelerated {
    /// Check if GPU acceleration is available for this operation
    fn gpu_available(&self) -> bool;

    /// Get estimated speedup factor for GPU vs CPU
    fn gpu_speedup_estimate(&self, width: u32, height: u32) -> f32;

    /// Execute operation on GPU if available, otherwise fall back to CPU
    fn execute_with_gpu_fallback<F, R>(&self, gpu_op: F, cpu_op: F) -> R
    where
        F: FnOnce() -> R;
}

/// Helper to create image buffer on GPU
pub fn create_gpu_image_buffer(
    device: &wgpu::Device,
    image: &ImageBuffer<Luma<u8>, Vec<u8>>,
) -> wgpu::Buffer {
    let (_width, _height) = image.dimensions();
    let data = image.as_raw();

    device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("Image Buffer"),
        contents: data,
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
    })
}

/// Helper to read back GPU buffer to image
pub async fn read_gpu_image_buffer(
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    buffer: &wgpu::Buffer,
    width: u32,
    height: u32,
) -> Result<ImageBuffer<Luma<u8>, Vec<u8>>, GpuProcessorError> {
    let size = (width * height) as usize;
    let staging_buffer = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("Staging Buffer"),
        size: size as u64,
        usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
        mapped_at_creation: false,
    });

    let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
        label: Some("Read Encoder"),
    });

    encoder.copy_buffer_to_buffer(buffer, 0, &staging_buffer, 0, size as u64);
    queue.submit(Some(encoder.finish()));

    let buffer_slice = staging_buffer.slice(..);

    // Use pollster for blocking wait in both native and WASM
    let _map_result = pollster::block_on(async {
        buffer_slice.map_async(wgpu::MapMode::Read, |_result| {
            // Handle result
        });
        device
            .poll(PollType::Wait)
            .map_err(|_| GpuProcessorError::ExecutionFailed("GPU polling failed".to_string()))?;
        Ok(()) as Result<(), GpuProcessorError>
    })?;

    let data = buffer_slice.get_mapped_range();
    let image_data: Vec<u8> = data.to_vec();
    drop(data);
    staging_buffer.unmap();

    ImageBuffer::from_raw(width, height, image_data).ok_or_else(|| {
        GpuProcessorError::ExecutionFailed("Failed to create image from GPU data".to_string())
    })
}
