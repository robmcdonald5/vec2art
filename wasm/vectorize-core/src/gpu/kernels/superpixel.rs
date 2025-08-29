//! GPU-accelerated SLIC superpixel segmentation module
//!
//! This module implements SLIC (Simple Linear Iterative Clustering)
//! superpixel segmentation using GPU compute shaders.

use crate::gpu::device::GpuDevice;
use image::{ImageBuffer, Rgba};
use std::sync::Arc;
use thiserror::Error;
use wgpu::{util::DeviceExt, *};

#[derive(Debug, Error)]
pub enum GpuSlicError {
    #[error("Failed to create GPU buffer: {0}")]
    BufferCreation(String),
    #[error("Failed to create compute pipeline: {0}")]
    PipelineCreation(String),
    #[error("Failed to execute GPU computation: {0}")]
    ExecutionFailed(String),
    #[error("Invalid parameters: {0}")]
    InvalidParameters(String),
}

#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct SlicParams {
    width: u32,
    height: u32,
    num_segments_x: u32,
    num_segments_y: u32,
    compactness: f32,
    iteration: u32,
    search_radius: u32,
    _padding: u32,
}

#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct ClusterCenter {
    x: f32,
    y: f32,
    l: f32,
    a: f32,
    b: f32,
    count: u32,
    _padding: u32,
    _padding2: u32,
}

#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct ClusterAccumulator {
    sum_x: f32,
    sum_y: f32,
    sum_l: f32,
    sum_a: f32,
    sum_b: f32,
    count: u32,
    _padding: u32,
    _padding2: u32,
}

/// GPU-accelerated SLIC superpixel segmentation
pub struct GpuSlicSegmentation {
    device: Arc<GpuDevice>,
    init_pipeline: wgpu::ComputePipeline,
    assign_pipeline: wgpu::ComputePipeline,
    accumulate_pipeline: wgpu::ComputePipeline,
    update_pipeline: wgpu::ComputePipeline,
    perturb_pipeline: wgpu::ComputePipeline,
}

impl GpuSlicSegmentation {
    /// Create a new GPU SLIC segmentation processor
    pub fn new(device: Arc<GpuDevice>) -> Result<Self, GpuSlicError> {
        // Load shaders
        let init_shader = device.device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("SLIC Init Shader"),
            source: wgpu::ShaderSource::Wgsl(super::SLIC_INIT_SHADER.into()),
        });
        
        let assign_shader = device.device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("SLIC Assign Shader"),
            source: wgpu::ShaderSource::Wgsl(super::SLIC_ASSIGN_SHADER.into()),
        });

        // Create bind group layouts
        let params_layout = device.device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("SLIC Params Layout"),
            entries: &[
                // Uniform parameters
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Input image
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: true },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Cluster centers
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Pixel assignments
                wgpu::BindGroupLayoutEntry {
                    binding: 3,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Pixel distances
                wgpu::BindGroupLayoutEntry {
                    binding: 4,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // Cluster accumulators
                wgpu::BindGroupLayoutEntry {
                    binding: 5,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });

        // Create pipeline layout
        let pipeline_layout = device.device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("SLIC Pipeline Layout"),
            bind_group_layouts: &[&params_layout],
            push_constant_ranges: &[],
        });

        // Create compute pipelines
        let init_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("SLIC Init Pipeline"),
            layout: Some(&pipeline_layout),
            module: &init_shader,
            entry_point: Some("init_cluster_centers"),
            compilation_options: Default::default(),
            cache: None,
        });

        let assign_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("SLIC Assign Pipeline"),
            layout: Some(&pipeline_layout),
            module: &assign_shader,
            entry_point: Some("assign_pixels"),
            compilation_options: Default::default(),
            cache: None,
        });

        let accumulate_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("SLIC Accumulate Pipeline"),
            layout: Some(&pipeline_layout),
            module: &assign_shader,
            entry_point: Some("accumulate_clusters"),
            compilation_options: Default::default(),
            cache: None,
        });

        let update_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("SLIC Update Pipeline"),
            layout: Some(&pipeline_layout),
            module: &assign_shader,
            entry_point: Some("update_centers"),
            compilation_options: Default::default(),
            cache: None,
        });

        let perturb_pipeline = device.device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("SLIC Perturb Pipeline"),
            layout: Some(&pipeline_layout),
            module: &init_shader,
            entry_point: Some("perturb_centers"),
            compilation_options: Default::default(),
            cache: None,
        });

        Ok(Self {
            device,
            init_pipeline,
            assign_pipeline,
            accumulate_pipeline,
            update_pipeline,
            perturb_pipeline,
        })
    }

    /// Perform SLIC superpixel segmentation on GPU
    pub async fn segment(
        &self,
        image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        num_segments: u32,
        compactness: f32,
    ) -> Result<Vec<u32>, GpuSlicError> {
        let (width, height) = image.dimensions();
        let image_size = (width * height) as usize;

        // Calculate grid dimensions
        let aspect_ratio = width as f32 / height as f32;
        let num_segments_x = ((num_segments as f32 * aspect_ratio).sqrt() + 0.5) as u32;
        let num_segments_y = (num_segments as f32 / num_segments_x as f32 + 0.5) as u32;
        let total_clusters = num_segments_x * num_segments_y;

        log::info!("🎨 SLIC GPU: {}x{} image, {}x{} grid ({} clusters)", 
                   width, height, num_segments_x, num_segments_y, total_clusters);

        // Convert image to f32 RGBA for GPU processing
        let image_f32: Vec<[f32; 4]> = image
            .as_raw()
            .chunks(4)
            .map(|rgba| [
                rgba[0] as f32 / 255.0,
                rgba[1] as f32 / 255.0,
                rgba[2] as f32 / 255.0,
                rgba[3] as f32 / 255.0,
            ])
            .collect();

        // Create GPU buffers
        let image_buffer = self.device.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("SLIC Image Buffer"),
            contents: bytemuck::cast_slice(&image_f32),
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
        });

        let cluster_centers_buffer = self.device.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("SLIC Cluster Centers Buffer"),
            size: (total_clusters * std::mem::size_of::<ClusterCenter>() as u32) as u64,
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
            mapped_at_creation: false,
        });

        let pixel_assignments_buffer = self.device.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("SLIC Pixel Assignments Buffer"),
            size: (image_size * std::mem::size_of::<u32>()) as u64,
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
            mapped_at_creation: false,
        });

        let pixel_distances_buffer = self.device.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("SLIC Pixel Distances Buffer"),
            size: (image_size * std::mem::size_of::<f32>()) as u64,
            usage: wgpu::BufferUsages::STORAGE,
            mapped_at_creation: false,
        });

        let cluster_accumulators_buffer = self.device.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("SLIC Cluster Accumulators Buffer"),
            size: (total_clusters * std::mem::size_of::<ClusterAccumulator>() as u32) as u64,
            usage: wgpu::BufferUsages::STORAGE,
            mapped_at_creation: false,
        });

        // SLIC iterations
        let max_iterations = 10;
        
        for iteration in 0..max_iterations {
            let params = SlicParams {
                width,
                height,
                num_segments_x,
                num_segments_y,
                compactness,
                iteration,
                search_radius: 2,
                _padding: 0,
            };

            let params_buffer = self.device.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some("SLIC Params Buffer"),
                contents: bytemuck::cast_slice(&[params]),
                usage: wgpu::BufferUsages::UNIFORM,
            });

            // Create bind group
            let bind_group = self.device.device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some("SLIC Bind Group"),
                layout: &self.init_pipeline.get_bind_group_layout(0),
                entries: &[
                    wgpu::BindGroupEntry {
                        binding: 0,
                        resource: params_buffer.as_entire_binding(),
                    },
                    wgpu::BindGroupEntry {
                        binding: 1,
                        resource: image_buffer.as_entire_binding(),
                    },
                    wgpu::BindGroupEntry {
                        binding: 2,
                        resource: cluster_centers_buffer.as_entire_binding(),
                    },
                    wgpu::BindGroupEntry {
                        binding: 3,
                        resource: pixel_assignments_buffer.as_entire_binding(),
                    },
                    wgpu::BindGroupEntry {
                        binding: 4,
                        resource: pixel_distances_buffer.as_entire_binding(),
                    },
                    wgpu::BindGroupEntry {
                        binding: 5,
                        resource: cluster_accumulators_buffer.as_entire_binding(),
                    },
                ],
            });

            // Execute SLIC iteration
            let mut encoder = self.device.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("SLIC Command Encoder"),
            });

            if iteration == 0 {
                // Initialize cluster centers
                {
                    let mut compute_pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                        label: Some("SLIC Init Pass"),
                        timestamp_writes: None,
                    });
                    
                    compute_pass.set_pipeline(&self.init_pipeline);
                    compute_pass.set_bind_group(0, &bind_group, &[]);
                    
                    let workgroups = (total_clusters + 63) / 64;
                    compute_pass.dispatch_workgroups(workgroups, 1, 1);
                }

                // Perturb centers to low gradient positions
                {
                    let mut compute_pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                        label: Some("SLIC Perturb Pass"),
                        timestamp_writes: None,
                    });
                    
                    compute_pass.set_pipeline(&self.perturb_pipeline);
                    compute_pass.set_bind_group(0, &bind_group, &[]);
                    
                    let workgroups = (total_clusters + 63) / 64;
                    compute_pass.dispatch_workgroups(workgroups, 1, 1);
                }
            }

            // Assign pixels to clusters
            {
                let mut compute_pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                    label: Some("SLIC Assign Pass"),
                    timestamp_writes: None,
                });
                
                compute_pass.set_pipeline(&self.assign_pipeline);
                compute_pass.set_bind_group(0, &bind_group, &[]);
                
                let workgroups_x = (width + 15) / 16;
                let workgroups_y = (height + 15) / 16;
                compute_pass.dispatch_workgroups(workgroups_x, workgroups_y, 1);
            }

            // Accumulate cluster updates
            {
                let mut compute_pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                    label: Some("SLIC Accumulate Pass"),
                    timestamp_writes: None,
                });
                
                compute_pass.set_pipeline(&self.accumulate_pipeline);
                compute_pass.set_bind_group(0, &bind_group, &[]);
                
                let workgroups = (image_size + 255) / 256;
                compute_pass.dispatch_workgroups(workgroups as u32, 1, 1);
            }

            // Update cluster centers
            {
                let mut compute_pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                    label: Some("SLIC Update Pass"),
                    timestamp_writes: None,
                });
                
                compute_pass.set_pipeline(&self.update_pipeline);
                compute_pass.set_bind_group(0, &bind_group, &[]);
                
                let workgroups = (total_clusters + 63) / 64;
                compute_pass.dispatch_workgroups(workgroups, 1, 1);
            }

            // Submit commands
            self.device.queue.submit(Some(encoder.finish()));
        }

        // Read back results
        let staging_buffer = self.device.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("SLIC Staging Buffer"),
            size: (image_size * std::mem::size_of::<u32>()) as u64,
            usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let mut encoder = self.device.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("SLIC Copy Encoder"),
        });

        encoder.copy_buffer_to_buffer(
            &pixel_assignments_buffer, 
            0, 
            &staging_buffer, 
            0, 
            (image_size * std::mem::size_of::<u32>()) as u64
        );

        self.device.queue.submit(Some(encoder.finish()));

        // Map buffer and read results
        let buffer_slice = staging_buffer.slice(..);
        let (tx, rx) = futures_channel::oneshot::channel();
        
        buffer_slice.map_async(MapMode::Read, move |result| {
            tx.send(result).ok();
        });

        self.device.device.poll(PollType::Wait).map_err(|e| 
            GpuSlicError::ExecutionFailed(format!("GPU polling failed: {:?}", e)))?;

        rx.await
            .map_err(|_| GpuSlicError::ExecutionFailed("Buffer mapping cancelled".to_string()))?
            .map_err(|e| GpuSlicError::ExecutionFailed(format!("Buffer mapping failed: {:?}", e)))?;

        let data = buffer_slice.get_mapped_range();
        let assignments: Vec<u32> = bytemuck::cast_slice(&data).to_vec();
        drop(data);
        staging_buffer.unmap();

        log::info!("✅ SLIC GPU segmentation completed: {} assignments", assignments.len());
        Ok(assignments)
    }
}