//! GPU compute kernels for image processing
//!
//! This module contains WGSL compute shaders and their Rust bindings
//! for various image processing algorithms.

pub mod edge_detection;
pub mod gaussian_blur;
pub mod stippling;
pub mod superpixel;

// Shader source code constants
pub const GAUSSIAN_BLUR_SHADER: &str = include_str!("gaussian_blur.wgsl");
pub const SOBEL_EDGE_SHADER: &str = include_str!("sobel_edge.wgsl");
pub const CANNY_NMS_SHADER: &str = include_str!("canny_nms.wgsl");
pub const STIPPLING_SHADER: &str = include_str!("stippling.wgsl");
pub const SLIC_INIT_SHADER: &str = include_str!("slic_init.wgsl");
pub const SLIC_ASSIGN_SHADER: &str = include_str!("slic_assign.wgsl");

/// Workgroup size configuration for different kernels
pub struct WorkgroupSizes {
    pub image_2d: (u32, u32, u32),
    pub compute_1d: u32,
}

impl Default for WorkgroupSizes {
    fn default() -> Self {
        Self {
            image_2d: (16, 16, 1),  // 256 threads per workgroup
            compute_1d: 64,          // 64 threads for 1D operations
        }
    }
}

/// Calculate dispatch size for 2D workgroups
pub fn calculate_dispatch_size_2d(
    image_width: u32,
    image_height: u32,
    workgroup_size: (u32, u32),
) -> (u32, u32, u32) {
    let x = (image_width + workgroup_size.0 - 1) / workgroup_size.0;
    let y = (image_height + workgroup_size.1 - 1) / workgroup_size.1;
    (x, y, 1)
}

/// Calculate dispatch size for 1D workgroups
pub fn calculate_dispatch_size_1d(
    total_elements: u32,
    workgroup_size: u32,
) -> (u32, u32, u32) {
    let x = (total_elements + workgroup_size - 1) / workgroup_size;
    (x, 1, 1)
}