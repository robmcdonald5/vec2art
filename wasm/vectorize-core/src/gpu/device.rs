//! GPU device initialization and management
//!
//! This module handles WebGPU device creation, feature detection,
//! and resource management for GPU compute operations.

use std::sync::Arc;
use thiserror::Error;
use wgpu::{
    Backends, Device, DeviceDescriptor, Features, Instance, InstanceDescriptor, Limits, Queue,
    RequestAdapterOptions,
};

#[derive(Debug, Error)]
pub enum GpuDeviceError {
    #[error("No suitable GPU adapter found")]
    NoAdapter,
    #[error("Failed to create GPU device: {0}")]
    DeviceCreation(String),
    #[error("WebGPU not supported in this environment")]
    NotSupported,
    #[error("Required GPU features not available: {0}")]
    MissingFeatures(String),
}

/// Represents a GPU device with associated resources
#[derive(Clone)]
pub struct GpuDevice {
    pub device: Arc<Device>,
    pub queue: Arc<Queue>,
    pub adapter_info: AdapterInfo,
}

/// Information about the GPU adapter
#[derive(Debug, Clone)]
pub struct AdapterInfo {
    pub name: String,
    pub vendor: String,
    pub backend: String,
    pub max_texture_dimension_2d: u32,
    pub max_compute_workgroup_size_x: u32,
    pub max_compute_workgroup_size_y: u32,
    pub max_compute_workgroups_per_dimension: u32,
}

impl GpuDevice {
    /// Create a new GPU device instance
    pub async fn new() -> Result<Self, GpuDeviceError> {
        // Create wgpu instance with all backends
        let instance = Instance::new(&InstanceDescriptor {
            backends: Backends::all(),
            ..Default::default()
        });

        // Request adapter with high performance preference
        let adapter = instance
            .request_adapter(&RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: None,
                force_fallback_adapter: false,
            })
            .await
            .map_err(|_| GpuDeviceError::NoAdapter)?;

        // Get adapter info
        let info = adapter.get_info();
        let adapter_limits = adapter.limits();

        // Use WebGL2 downlevel limits to avoid deprecated maxInterStageShaderComponents
        // Chrome 135+ removed this limit - WebGL2 limits might not include it
        let device_limits = Limits::downlevel_webgl2_defaults();

        let (device, queue) = adapter
            .request_device(&DeviceDescriptor {
                label: Some("vec2art GPU Device"),
                required_features: Features::empty(), // Start with minimal features
                required_limits: device_limits,
                memory_hints: Default::default(),
                trace: wgpu::Trace::Off,
            })
            .await
            .map_err(|e| GpuDeviceError::DeviceCreation(e.to_string()))?;

        let adapter_info = AdapterInfo {
            name: info.name,
            vendor: format!("{:?}", info.vendor),
            backend: format!("{:?}", info.backend),
            max_texture_dimension_2d: adapter_limits.max_texture_dimension_2d,
            max_compute_workgroup_size_x: adapter_limits.max_compute_workgroup_size_x,
            max_compute_workgroup_size_y: adapter_limits.max_compute_workgroup_size_y,
            max_compute_workgroups_per_dimension: adapter_limits
                .max_compute_workgroups_per_dimension,
        };

        Ok(Self {
            device: Arc::new(device),
            queue: Arc::new(queue),
            adapter_info,
        })
    }

    /// Create a new GPU device with custom limits
    pub async fn with_limits(_limits: Limits) -> Result<Self, GpuDeviceError> {
        let instance = Instance::new(&InstanceDescriptor {
            backends: Backends::all(),
            ..Default::default()
        });

        let adapter = instance
            .request_adapter(&RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: None,
                force_fallback_adapter: false,
            })
            .await
            .map_err(|_| GpuDeviceError::NoAdapter)?;

        let info = adapter.get_info();
        let adapter_limits = adapter.limits();

        // Use WebGL2 downlevel limits to avoid deprecated maxInterStageShaderComponents
        // Chrome 135+ removed this limit - WebGL2 limits might not include it
        let device_limits = Limits::downlevel_webgl2_defaults();

        let (device, queue) = adapter
            .request_device(&DeviceDescriptor {
                label: Some("vec2art GPU Device"),
                required_features: Features::empty(),
                required_limits: device_limits,
                memory_hints: Default::default(),
                trace: wgpu::Trace::Off,
            })
            .await
            .map_err(|e| GpuDeviceError::DeviceCreation(e.to_string()))?;

        let adapter_info = AdapterInfo {
            name: info.name,
            vendor: format!("{:?}", info.vendor),
            backend: format!("{:?}", info.backend),
            max_texture_dimension_2d: adapter_limits.max_texture_dimension_2d,
            max_compute_workgroup_size_x: adapter_limits.max_compute_workgroup_size_x,
            max_compute_workgroup_size_y: adapter_limits.max_compute_workgroup_size_y,
            max_compute_workgroups_per_dimension: adapter_limits
                .max_compute_workgroups_per_dimension,
        };

        Ok(Self {
            device: Arc::new(device),
            queue: Arc::new(queue),
            adapter_info,
        })
    }

    /// Check if the GPU supports required features for image processing
    pub fn supports_image_processing(&self) -> bool {
        let limits = self.device.limits();

        // Check minimum requirements for image processing
        limits.max_texture_dimension_2d >= 4096
            && limits.max_compute_workgroup_size_x >= 64
            && limits.max_compute_workgroup_size_y >= 64
            && limits.max_compute_workgroups_per_dimension >= 65535
    }

    /// Get optimal workgroup size for 2D image operations
    pub fn optimal_workgroup_size_2d(&self) -> (u32, u32) {
        // Common optimal size that works across different GPUs
        // 16x16 = 256 threads, which fits in most GPU warps/wavefronts
        (16, 16)
    }

    /// Get optimal workgroup size for 1D compute operations
    pub fn optimal_workgroup_size_1d(&self) -> u32 {
        // 64 threads is optimal for most GPUs (AMD wavefront size)
        64
    }

    /// Check if image size is suitable for GPU processing
    pub fn should_use_gpu_for_size(&self, width: u32, height: u32) -> bool {
        // GPU is beneficial for images larger than 1 megapixel
        let pixel_count = width * height;
        pixel_count > 1_000_000
    }

    /// Get device info as string
    pub fn info_string(&self) -> String {
        format!(
            "GPU: {} ({})\nBackend: {}\nMax Texture: {}x{}\nMax Workgroup: {}x{}",
            self.adapter_info.name,
            self.adapter_info.vendor,
            self.adapter_info.backend,
            self.adapter_info.max_texture_dimension_2d,
            self.adapter_info.max_texture_dimension_2d,
            self.adapter_info.max_compute_workgroup_size_x,
            self.adapter_info.max_compute_workgroup_size_y
        )
    }
}

/// Try to initialize GPU device, returning None if unavailable
pub async fn try_init_gpu() -> Option<GpuDevice> {
    match GpuDevice::new().await {
        Ok(device) => {
            log::info!("GPU initialized successfully: {}", device.adapter_info.name);
            Some(device)
        }
        Err(e) => {
            log::warn!("GPU initialization failed: {}, falling back to CPU", e);
            None
        }
    }
}
