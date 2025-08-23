//! Edge Tangent Flow (ETF) direction field computation
//!
//! This module implements ETF direction field computation for flow-guided edge detection.
//! ETF creates smooth, coherent direction fields that follow edge structures in images,
//! enabling better line art generation with artistic aesthetics.
//!
//! The ETF algorithm:
//! 1. Computes structure tensor from image gradients
//! 2. Extracts edge tangent directions (perpendicular to gradient)
//! 3. Iteratively refines for coherency using weighted averaging
//! 4. Generates coherency map for detecting corners/texture regions

use crate::execution::execute_parallel;
use image::GrayImage;
use serde::{Deserialize, Serialize};
// use std::f32::consts::PI;

/// Configuration for Edge Tangent Flow computation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EtfConfig {
    /// Neighborhood radius for ETF computation (default: 4)
    pub radius: u32,
    /// Number of ETF iterations for coherency refinement (default: 4)
    pub iters: u32,
    /// Coherency threshold tau for structure tensor (default: 0.2)
    pub coherency_tau: f32,
    /// Gaussian kernel sigma for structure tensor computation (default: 1.0)
    pub sigma: f32,
}

impl Default for EtfConfig {
    fn default() -> Self {
        Self {
            radius: 4,
            iters: 4,
            coherency_tau: 0.2,
            sigma: 1.0,
        }
    }
}

/// Edge Tangent Flow field containing direction and coherency information
#[derive(Debug, Clone)]
pub struct EtfField {
    /// Tangent x-component field
    pub tx: Vec<f32>,
    /// Tangent y-component field
    pub ty: Vec<f32>,
    /// Coherency map (0.0 = incoherent texture, 1.0 = coherent structure)
    pub coherency: Vec<f32>,
    /// Image width
    pub width: u32,
    /// Image height
    pub height: u32,
}

impl EtfField {
    /// Create a new ETF field with given dimensions
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        Self {
            tx: vec![0.0; size],
            ty: vec![0.0; size],
            coherency: vec![0.0; size],
            width,
            height,
        }
    }

    /// Get the tangent direction at pixel (x, y)
    pub fn get_tangent(&self, x: u32, y: u32) -> (f32, f32) {
        let idx = (y * self.width + x) as usize;
        (self.tx[idx], self.ty[idx])
    }

    /// Get the coherency value at pixel (x, y)
    pub fn get_coherency(&self, x: u32, y: u32) -> f32 {
        let idx = (y * self.width + x) as usize;
        self.coherency[idx]
    }

    /// Set tangent direction at pixel (x, y)
    pub fn set_tangent(&mut self, x: u32, y: u32, tx: f32, ty: f32) {
        let idx = (y * self.width + x) as usize;
        self.tx[idx] = tx;
        self.ty[idx] = ty;
    }

    /// Set coherency value at pixel (x, y)
    pub fn set_coherency(&mut self, x: u32, y: u32, coherency: f32) {
        let idx = (y * self.width + x) as usize;
        self.coherency[idx] = coherency;
    }
}

/// Structure tensor components at a pixel
#[derive(Debug, Clone, Copy)]
struct StructureTensor {
    /// Gradient product Ix * Ix
    gxx: f32,
    /// Gradient product Ix * Iy
    gxy: f32,
    /// Gradient product Iy * Iy
    gyy: f32,
}

/// Compute Edge Tangent Flow field from grayscale image
///
/// # Arguments
/// * `gray` - Input grayscale image
/// * `cfg` - ETF configuration parameters
///
/// # Returns
/// ETF field containing tangent directions and coherency map
pub fn compute_etf(gray: &GrayImage, cfg: &EtfConfig) -> EtfField {
    let width = gray.width();
    let height = gray.height();

    log::debug!("Computing ETF field for {width}x{height} image with config: {cfg:?}");
    let start_time = crate::utils::Instant::now();

    // Step 1: Compute image gradients
    let (grad_x, grad_y) = compute_gradients(gray);

    // Step 2: Compute structure tensor field
    let structure_tensor = compute_structure_tensor(&grad_x, &grad_y, width, height, cfg.sigma);

    // Step 3: Extract initial tangent directions and coherency
    let mut etf_field =
        extract_initial_tangents(&structure_tensor, width, height, cfg.coherency_tau);

    // Step 4: Iteratively refine ETF for coherency
    refine_etf_field(&mut etf_field, cfg.radius, cfg.iters);

    let duration = start_time.elapsed();
    log::debug!(
        "ETF computation completed in {:.2}ms",
        duration.as_secs_f64() * 1000.0
    );

    etf_field
}

/// Compute image gradients using Sobel operator
fn compute_gradients(gray: &GrayImage) -> (Vec<f32>, Vec<f32>) {
    let width = gray.width() as usize;
    let height = gray.height() as usize;
    let mut grad_x = vec![0.0; width * height];
    let mut grad_y = vec![0.0; width * height];

    // Sobel kernels
    const SOBEL_X: [i32; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const SOBEL_Y: [i32; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    // Parallel computation of gradients using execution abstraction
    let pixel_indices: Vec<usize> = (0..(width * height)).collect();
    let gradient_results = execute_parallel(pixel_indices, |i| {
        let y = i / width;
        let x = i % width;
        let mut gx = 0.0;
        let mut gy = 0.0;

        // Apply Sobel kernels
        for ky in 0..3 {
            for kx in 0..3 {
                let px = (x as i32 + kx as i32 - 1).max(0).min((width - 1) as i32) as u32;
                let py = (y as i32 + ky as i32 - 1).max(0).min((height - 1) as i32) as u32;

                let pixel_value = gray.get_pixel(px, py)[0] as f32 / 255.0;
                let kernel_idx = ky * 3 + kx;

                gx += pixel_value * SOBEL_X[kernel_idx] as f32;
                gy += pixel_value * SOBEL_Y[kernel_idx] as f32;
            }
        }

        (gx, gy)
    });

    // Unpack results
    for (i, (gx, gy)) in gradient_results.iter().enumerate() {
        grad_x[i] = *gx;
        grad_y[i] = *gy;
    }

    (grad_x, grad_y)
}

/// Compute structure tensor field with Gaussian smoothing
fn compute_structure_tensor(
    grad_x: &[f32],
    grad_y: &[f32],
    width: u32,
    height: u32,
    sigma: f32,
) -> Vec<StructureTensor> {
    let size = (width * height) as usize;
    // Initialize tensor field vector

    // Compute raw structure tensor components using execution abstraction
    let indices: Vec<usize> = (0..size).collect();
    let tensors = execute_parallel(indices, |i| {
        let gx = grad_x[i];
        let gy = grad_y[i];

        StructureTensor {
            gxx: gx * gx,
            gxy: gx * gy,
            gyy: gy * gy,
        }
    });

    let mut tensor_field = tensors;

    // Apply Gaussian smoothing to structure tensor
    gaussian_smooth_tensor(&mut tensor_field, width, height, sigma);

    tensor_field
}

/// Apply Gaussian smoothing to structure tensor field
fn gaussian_smooth_tensor(
    tensor_field: &mut [StructureTensor],
    width: u32,
    height: u32,
    sigma: f32,
) {
    let kernel_radius = (3.0 * sigma).ceil() as i32;
    let kernel_size = (2 * kernel_radius + 1) as usize;

    // Generate Gaussian kernel
    let mut kernel = vec![0.0; kernel_size];
    let mut sum = 0.0;
    for (i, k) in kernel.iter_mut().enumerate() {
        let x = (i as i32 - kernel_radius) as f32;
        *k = (-0.5 * x * x / (sigma * sigma)).exp();
        sum += *k;
    }

    // Normalize kernel
    for k in &mut kernel {
        *k /= sum;
    }

    // Horizontal pass using execution abstraction
    let size = (width * height) as usize;
    let indices: Vec<usize> = (0..size).collect();
    let temp_field = execute_parallel(indices, |i| {
        let y = i as u32 / width;
        let x = i as u32 % width;
        let mut gxx_sum = 0.0;
        let mut gxy_sum = 0.0;
        let mut gyy_sum = 0.0;

        for (j, &weight) in kernel.iter().enumerate() {
            let px = (x as i32 + j as i32 - kernel_radius)
                .max(0)
                .min((width - 1) as i32) as u32;
            let idx = (y * width + px) as usize;

            gxx_sum += tensor_field[idx].gxx * weight;
            gxy_sum += tensor_field[idx].gxy * weight;
            gyy_sum += tensor_field[idx].gyy * weight;
        }

        StructureTensor {
            gxx: gxx_sum,
            gxy: gxy_sum,
            gyy: gyy_sum,
        }
    });

    // Vertical pass using execution abstraction
    let indices: Vec<usize> = (0..size).collect();
    let final_field = execute_parallel(indices, |i| {
        let y = i as u32 / width;
        let x = i as u32 % width;
        let mut gxx_sum = 0.0;
        let mut gxy_sum = 0.0;
        let mut gyy_sum = 0.0;

        for (j, &weight) in kernel.iter().enumerate() {
            let py = (y as i32 + j as i32 - kernel_radius)
                .max(0)
                .min((height - 1) as i32) as u32;
            let idx = (py * width + x) as usize;

            gxx_sum += temp_field[idx].gxx * weight;
            gxy_sum += temp_field[idx].gxy * weight;
            gyy_sum += temp_field[idx].gyy * weight;
        }

        StructureTensor {
            gxx: gxx_sum,
            gxy: gxy_sum,
            gyy: gyy_sum,
        }
    });

    tensor_field.copy_from_slice(&final_field);
}

/// Extract initial tangent directions and coherency from structure tensor
fn extract_initial_tangents(
    tensor_field: &[StructureTensor],
    width: u32,
    height: u32,
    coherency_tau: f32,
) -> EtfField {
    let mut etf_field = EtfField::new(width, height);

    let indices: Vec<usize> = (0..(width * height) as usize).collect();
    let results = execute_parallel(indices, |i| {
        let tensor = tensor_field[i];
        let gxx = tensor.gxx;
        let gxy = tensor.gxy;
        let gyy = tensor.gyy;

        // Compute eigenvalues of structure tensor
        let trace = gxx + gyy;
        let det = gxx * gyy - gxy * gxy;
        let discriminant = (trace * trace * 0.25 - det).max(0.0).sqrt();

        let lambda1 = trace * 0.5 + discriminant; // Larger eigenvalue
        let lambda2 = trace * 0.5 - discriminant; // Smaller eigenvalue

        // Compute coherency measure
        let coherency = if lambda1 + lambda2 > 1e-10 {
            ((lambda1 - lambda2) / (lambda1 + lambda2)).max(0.0)
        } else {
            0.0
        };

        // Apply coherency threshold
        let final_coherency = if coherency > coherency_tau {
            coherency
        } else {
            0.0
        };

        // Compute tangent direction (perpendicular to gradient)
        let (tx, ty) = if lambda1 > lambda2 && lambda1 > 1e-10 {
            // Eigenvector corresponding to larger eigenvalue
            let v1x = if gxy.abs() > 1e-10 {
                lambda1 - gyy
            } else {
                1.0
            };

            let v1y = if gxy.abs() > 1e-10 { gxy } else { 0.0 };

            // Normalize tangent vector
            let length = (v1x * v1x + v1y * v1y).sqrt();
            if length > 1e-10 {
                (v1x / length, v1y / length)
            } else {
                (1.0, 0.0)
            }
        } else {
            (1.0, 0.0) // Default horizontal direction
        };

        (tx, ty, final_coherency)
    });

    // Update the ETF field with the computed results
    for (i, (tx, ty, coherency)) in results.into_iter().enumerate() {
        etf_field.tx[i] = tx;
        etf_field.ty[i] = ty;
        etf_field.coherency[i] = coherency;
    }

    etf_field
}

/// Iteratively refine ETF field for better coherency
fn refine_etf_field(etf_field: &mut EtfField, radius: u32, iters: u32) {
    let width = etf_field.width;
    let height = etf_field.height;

    for iteration in 0..iters {
        log::trace!("ETF refinement iteration {}/{}", iteration + 1, iters);

        // Create copies for parallel access
        let curr_tx = etf_field.tx.clone();
        let curr_ty = etf_field.ty.clone();
        let curr_coherency = etf_field.coherency.clone();

        // Create temporary buffers for this iteration using execution abstraction
        let size = (width * height) as usize;
        let indices: Vec<usize> = (0..size).collect();
        let refined_tangents = execute_parallel(indices, |i| {
            let y = i as u32 / width;
            let x = i as u32 % width;
            let idx = i;
            let pixel_coherency = curr_coherency[idx];

            // Skip refinement for low-coherency pixels
            if pixel_coherency < 0.1 {
                return (curr_tx[idx], curr_ty[idx]);
            }

            let pixel_tx = curr_tx[idx];
            let pixel_ty = curr_ty[idx];

            let mut sum_tx = 0.0;
            let mut sum_ty = 0.0;
            let mut total_weight = 0.0;

            // Weighted averaging in neighborhood
            let r = radius as i32;
            for dy in -r..=r {
                for dx in -r..=r {
                    if dx == 0 && dy == 0 {
                        continue;
                    }

                    let nx = (x as i32 + dx).max(0).min((width - 1) as i32) as u32;
                    let ny = (y as i32 + dy).max(0).min((height - 1) as i32) as u32;
                    let nidx = (ny * width + nx) as usize;

                    let neighbor_coherency = curr_coherency[nidx];
                    if neighbor_coherency < 0.1 {
                        continue;
                    }

                    let neighbor_tx = curr_tx[nidx];
                    let neighbor_ty = curr_ty[nidx];

                    // Compute spatial distance weight
                    let distance = ((dx * dx + dy * dy) as f32).sqrt();
                    let spatial_weight =
                        (-distance * distance / (2.0 * radius as f32 * radius as f32)).exp();

                    // Compute directional similarity weight
                    let dot_product = (pixel_tx * neighbor_tx + pixel_ty * neighbor_ty).abs();
                    let directional_weight = dot_product;

                    // Combine weights
                    let weight = spatial_weight * directional_weight * neighbor_coherency;

                    // Ensure consistent orientation (flip if necessary)
                    let (aligned_tx, aligned_ty) =
                        if pixel_tx * neighbor_tx + pixel_ty * neighbor_ty >= 0.0 {
                            (neighbor_tx, neighbor_ty)
                        } else {
                            (-neighbor_tx, -neighbor_ty)
                        };

                    sum_tx += aligned_tx * weight;
                    sum_ty += aligned_ty * weight;
                    total_weight += weight;
                }
            }

            // Update tangent direction with weighted average
            if total_weight > 1e-10 {
                let avg_tx = sum_tx / total_weight;
                let avg_ty = sum_ty / total_weight;

                // Normalize the averaged direction
                let length = (avg_tx * avg_tx + avg_ty * avg_ty).sqrt();
                if length > 1e-10 {
                    (avg_tx / length, avg_ty / length)
                } else {
                    (pixel_tx, pixel_ty)
                }
            } else {
                (pixel_tx, pixel_ty)
            }
        });

        // Update ETF field with refined values
        for (i, (tx, ty)) in refined_tangents.iter().enumerate() {
            etf_field.tx[i] = *tx;
            etf_field.ty[i] = *ty;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{GrayImage, Luma};

    #[test]
    fn test_etf_config_default() {
        let config = EtfConfig::default();
        assert_eq!(config.radius, 4);
        assert_eq!(config.iters, 4);
        assert_eq!(config.coherency_tau, 0.2);
        assert_eq!(config.sigma, 1.0);
    }

    #[test]
    fn test_etf_field_creation() {
        let field = EtfField::new(10, 10);
        assert_eq!(field.width, 10);
        assert_eq!(field.height, 10);
        assert_eq!(field.tx.len(), 100);
        assert_eq!(field.ty.len(), 100);
        assert_eq!(field.coherency.len(), 100);
    }

    #[test]
    fn test_etf_field_accessors() {
        let mut field = EtfField::new(10, 10);

        field.set_tangent(5, 5, 0.707, 0.707);
        field.set_coherency(5, 5, 0.8);

        let (tx, ty) = field.get_tangent(5, 5);
        let coherency = field.get_coherency(5, 5);

        assert_eq!(tx, 0.707);
        assert_eq!(ty, 0.707);
        assert_eq!(coherency, 0.8);
    }

    #[test]
    fn test_compute_gradients() {
        // Create a simple test image with a vertical edge
        let mut img = GrayImage::new(5, 5);
        for y in 0..5 {
            for x in 0..5 {
                let value = if x < 2 { 0 } else { 255 };
                img.put_pixel(x, y, Luma([value]));
            }
        }

        let (grad_x, grad_y) = compute_gradients(&img);

        // Should have strong horizontal gradients at the edge
        assert!(grad_x[2 * 5 + 2].abs() > 0.1); // Center pixel should have gradient
        assert!(grad_y[2 * 5 + 2].abs() < grad_x[2 * 5 + 2].abs()); // Vertical gradient should be smaller
    }

    #[test]
    fn test_compute_etf_simple() {
        // Create a simple test image
        let mut img = GrayImage::new(10, 10);
        for y in 0..10 {
            for x in 0..10 {
                let value = if x == 5 { 0 } else { 255 };
                img.put_pixel(x, y, Luma([value]));
            }
        }

        let config = EtfConfig::default();
        let etf_field = compute_etf(&img, &config);

        assert_eq!(etf_field.width, 10);
        assert_eq!(etf_field.height, 10);
        assert_eq!(etf_field.tx.len(), 100);
        assert_eq!(etf_field.ty.len(), 100);
        assert_eq!(etf_field.coherency.len(), 100);
    }
}
