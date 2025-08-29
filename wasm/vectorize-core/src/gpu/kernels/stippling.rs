//! GPU-accelerated stippling (dots) implementation
//!
//! This module implements high-performance stippling effects on the GPU using
//! compute shaders for content-aware dot placement and variable sizing.

use crate::gpu::device::GpuDevice;
use image::{ImageBuffer, Luma, Rgba};
use std::sync::Arc;
use thiserror::Error;
use wgpu::{util::DeviceExt, *};

#[derive(Debug, Error)]
pub enum GpuStipplingError {
    #[error("Failed to create GPU buffer: {0}")]
    BufferCreation(String),
    #[error("Failed to create compute pipeline: {0}")]
    PipelineCreation(String),
    #[error("Failed to execute GPU computation: {0}")]
    ExecutionFailed(String),
    #[error("Invalid image dimensions: {width}x{height}")]
    InvalidDimensions { width: u32, height: u32 },
}

/// Configuration for stippling algorithm
#[derive(Debug, Clone)]
pub struct StipplingConfig {
    /// Base dot size in pixels
    pub dot_size: f32,
    /// Density factor (0.0 to 1.0)
    pub density: f32,
    /// Use adaptive dot sizing based on image content
    pub adaptive: bool,
    /// Background color for the stippling
    pub background_color: [u8; 3],
    /// Dot color
    pub dot_color: [u8; 3],
}

impl Default for StipplingConfig {
    fn default() -> Self {
        Self {
            dot_size: 2.0,
            density: 0.3,
            adaptive: true,
            background_color: [255, 255, 255], // White background
            dot_color: [0, 0, 0],               // Black dots
        }
    }
}

/// GPU-accelerated stippling processor
pub struct GpuStippling {
    device: Arc<GpuDevice>,
    stippling_pipeline: ComputePipeline,
    adaptive_pipeline: ComputePipeline,
    bind_group_layout: BindGroupLayout,
}

impl GpuStippling {
    /// Create a new GPU stippling processor
    pub fn new(device: Arc<GpuDevice>) -> Result<Self, GpuStipplingError> {
        // Create bind group layout
        let bind_group_layout = device.device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("stippling_layout"),
            entries: &[
                // Uniform buffer for parameters
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Input image (read-only)
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Storage { read_only: true },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Output dots buffer
                BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });

        // Create pipeline layout
        let pipeline_layout = device.device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("stippling_pipeline_layout"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        });

        // Load shader
        let shader_module = device.device.create_shader_module(ShaderModuleDescriptor {
            label: Some("stippling_shader"),
            source: ShaderSource::Wgsl(include_str!("stippling.wgsl").into()),
        });

        // Create compute pipelines
        let stippling_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("stippling_pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader_module,
            entry_point: Some("stippling_generate"),
            compilation_options: Default::default(),
            cache: None,
        });

        let adaptive_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("adaptive_stippling_pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader_module,
            entry_point: Some("adaptive_stippling"),
            compilation_options: Default::default(),
            cache: None,
        });

        Ok(Self {
            device,
            stippling_pipeline,
            adaptive_pipeline,
            bind_group_layout,
        })
    }

    /// Apply stippling effect to a grayscale image
    pub async fn process_image(
        &self,
        input_image: &ImageBuffer<Luma<u8>, Vec<u8>>,
        config: &StipplingConfig,
    ) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, GpuStipplingError> {
        let width = input_image.width();
        let height = input_image.height();

        if width == 0 || height == 0 {
            return Err(GpuStipplingError::InvalidDimensions { width, height });
        }

        let pixel_count = (width * height) as usize;

        // Convert input image to f32
        let input_data: Vec<f32> = input_image
            .pixels()
            .map(|p| p[0] as f32 / 255.0)
            .collect();

        // Create GPU buffers
        let params_buffer = self.device.device.create_buffer_init(&util::BufferInitDescriptor {
            label: Some("stippling_params_buffer"),
            contents: bytemuck::cast_slice(&[width, height, config.dot_size.to_bits(), config.density.to_bits()]),
            usage: BufferUsages::UNIFORM,
        });

        let input_buffer = self.device.device.create_buffer_init(&util::BufferInitDescriptor {
            label: Some("stippling_input_buffer"),
            contents: bytemuck::cast_slice(&input_data),
            usage: BufferUsages::STORAGE | BufferUsages::COPY_DST,
        });

        let output_buffer = self.device.device.create_buffer(&BufferDescriptor {
            label: Some("stippling_output_buffer"),
            size: (pixel_count * std::mem::size_of::<u32>()) as u64,
            usage: BufferUsages::STORAGE | BufferUsages::COPY_SRC,
            mapped_at_creation: false,
        });

        let staging_buffer = self.device.device.create_buffer(&BufferDescriptor {
            label: Some("stippling_staging_buffer"),
            size: (pixel_count * std::mem::size_of::<u32>()) as u64,
            usage: BufferUsages::COPY_DST | BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        // Create bind group
        let bind_group = self.device.device.create_bind_group(&BindGroupDescriptor {
            label: Some("stippling_bind_group"),
            layout: &self.bind_group_layout,
            entries: &[
                BindGroupEntry {
                    binding: 0,
                    resource: params_buffer.as_entire_binding(),
                },
                BindGroupEntry {
                    binding: 1,
                    resource: input_buffer.as_entire_binding(),
                },
                BindGroupEntry {
                    binding: 2,
                    resource: output_buffer.as_entire_binding(),
                },
            ],
        });

        // Calculate workgroup dispatch size
        let workgroup_size = self.device.optimal_workgroup_size_2d();
        let dispatch_x = (width + workgroup_size.0 - 1) / workgroup_size.0;
        let dispatch_y = (height + workgroup_size.1 - 1) / workgroup_size.1;

        // Execute compute shader
        let mut encoder = self.device.device.create_command_encoder(&CommandEncoderDescriptor {
            label: Some("stippling_encoder"),
        });

        {
            let mut compute_pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                label: Some("stippling_pass"),
                timestamp_writes: None,
            });
            
            // Choose pipeline based on adaptive setting
            let pipeline = if config.adaptive {
                &self.adaptive_pipeline
            } else {
                &self.stippling_pipeline
            };
            
            compute_pass.set_pipeline(pipeline);
            compute_pass.set_bind_group(0, &bind_group, &[]);
            compute_pass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
        }

        // Copy results to staging buffer
        encoder.copy_buffer_to_buffer(
            &output_buffer,
            0,
            &staging_buffer,
            0,
            (pixel_count * std::mem::size_of::<u32>()) as u64,
        );

        // Submit commands
        self.device.queue.submit(std::iter::once(encoder.finish()));

        // Read results
        let dot_data = self.read_buffer_async(&staging_buffer, pixel_count).await?;

        // Generate final stippled image
        Ok(self.render_stippled_image(&dot_data, width, height, config))
    }

    /// Helper function to read buffer data asynchronously
    async fn read_buffer_async(
        &self,
        buffer: &Buffer,
        element_count: usize,
    ) -> Result<Vec<u32>, GpuStipplingError> {
        let buffer_slice = buffer.slice(..);
        
        // Map the buffer for reading
        let (sender, receiver) = futures_channel::oneshot::channel();
        buffer_slice.map_async(MapMode::Read, move |result| {
            sender.send(result).ok();
        });

        // Poll the device until the buffer is mapped
        self.device.device.poll(PollType::Wait)
            .map_err(|e| GpuStipplingError::ExecutionFailed(format!("Failed to poll device: {:?}", e)))?;

        // Wait for mapping to complete
        receiver.await
            .map_err(|_| GpuStipplingError::ExecutionFailed("Buffer mapping cancelled".to_string()))?
            .map_err(|e| GpuStipplingError::ExecutionFailed(format!("Buffer mapping failed: {:?}", e)))?;

        // Read the data
        let data = buffer_slice.get_mapped_range();
        let result: Vec<u32> = bytemuck::cast_slice(&data[..element_count * std::mem::size_of::<u32>()])
            .to_vec();
        
        drop(data);
        buffer.unmap();

        Ok(result)
    }

    /// Render the final stippled image from dot data
    fn render_stippled_image(
        &self,
        dot_data: &[u32],
        width: u32,
        height: u32,
        config: &StipplingConfig,
    ) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
        // Create background image
        let mut output = ImageBuffer::from_fn(width, height, |_, _| {
            Rgba([
                config.background_color[0],
                config.background_color[1],
                config.background_color[2],
                255,
            ])
        });

        let dot_color = Rgba([
            config.dot_color[0],
            config.dot_color[1],
            config.dot_color[2],
            255,
        ]);

        // Place dots
        for &packed_dot in dot_data {
            if packed_dot == 0xFFFFFFFF {
                continue; // No dot marker
            }

            let dot_size = if config.adaptive {
                // Extract size from packed data (adaptive mode)
                ((packed_dot >> 28) & 0xF) as f32
            } else {
                config.dot_size
            };

            let x = if config.adaptive {
                (packed_dot & 0x3FFF) as u32  // 14 bits for x in adaptive mode
            } else {
                (packed_dot & 0xFFFF) as u32  // 16 bits for x in normal mode
            };

            let y = if config.adaptive {
                ((packed_dot >> 14) & 0x3FFF) as u32  // 14 bits for y in adaptive mode
            } else {
                (packed_dot >> 16) as u32  // 16 bits for y in normal mode
            };

            // Draw dot with specified size
            let radius = (dot_size * 0.5) as i32;
            for dy in -radius..=radius {
                for dx in -radius..=radius {
                    let px = x as i32 + dx;
                    let py = y as i32 + dy;

                    // Check bounds and circular shape
                    if px >= 0 && px < width as i32 && py >= 0 && py < height as i32 {
                        let dist_sq = (dx * dx + dy * dy) as f32;
                        if dist_sq <= radius as f32 * radius as f32 {
                            output.put_pixel(px as u32, py as u32, dot_color);
                        }
                    }
                }
            }
        }

        output
    }
}