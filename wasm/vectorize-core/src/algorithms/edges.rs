//! Flow-guided DoG/XDoG edge detection system
//!
//! This module implements advanced edge detection algorithms that use Edge Tangent Flow (ETF)
//! direction fields to guide edge detection. The system includes:
//! - Flow-guided Difference of Gaussians (FDoG) for coherent edge detection
//! - Extended DoG (XDoG) with better edge response
//! - Non-Maximum Suppression (NMS) along tangent directions
//! - Hysteresis thresholding for clean edge maps
//!
//! The flow-guided approach produces more coherent, artistic line art compared to
//! traditional edge detection methods.

use crate::algorithms::etf::{compute_etf, EtfConfig, EtfField};
use crate::execution::execute_parallel;
use image::GrayImage;
use serde::{Deserialize, Serialize};
// use std::f32::consts::PI;

/// Configuration for Flow-guided Difference of Gaussians (FDoG)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FdogConfig {
    /// Sigma for structure (smaller Gaussian) - default: 1.2
    pub sigma_s: f32,
    /// Sigma for context (larger Gaussian) - default: 2.0
    pub sigma_c: f32,
    /// Number of FDoG passes - default: 1
    pub passes: u32,
    /// Threshold tau for edge response - default: 0.90
    pub tau: f32,
}

impl Default for FdogConfig {
    fn default() -> Self {
        Self {
            sigma_s: 1.2,
            sigma_c: 2.0,
            passes: 1,
            tau: 0.90,
        }
    }
}

/// Configuration for Extended Difference of Gaussians (XDoG)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XdogConfig {
    /// Base sigma for Gaussian kernels - default: 1.0
    pub sigma: f32,
    /// Ratio between two Gaussians - default: 1.7
    pub k: f32,
    /// Soft thresholding parameter - default: 10.0
    pub phi: f32,
    /// Edge threshold epsilon - default: 0.0
    pub epsilon: f32,
    /// Gamma correction factor - default: 0.98
    pub gamma: f32,
}

impl Default for XdogConfig {
    fn default() -> Self {
        Self {
            sigma: 1.0,
            k: 1.7,
            phi: 10.0,
            epsilon: 0.0,
            gamma: 0.98,
        }
    }
}

/// Configuration for Non-Maximum Suppression (NMS)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NmsConfig {
    /// Low threshold for hysteresis - default: 0.08
    pub low: f32,
    /// High threshold for hysteresis - default: 0.16
    pub high: f32,
    /// Whether to apply Gaussian smoothing before NMS - default: true
    pub smooth_before_nms: bool,
    /// Smoothing sigma if enabled - default: 0.8
    pub smooth_sigma: f32,
}

impl Default for NmsConfig {
    fn default() -> Self {
        Self {
            low: 0.08,
            high: 0.16,
            smooth_before_nms: true,
            smooth_sigma: 0.8,
        }
    }
}

/// Edge response containing magnitude and orientation information
#[derive(Debug, Clone)]
pub struct EdgeResponse {
    /// Edge magnitude values
    pub magnitude: Vec<f32>,
    /// Edge orientation values (in radians)
    pub orientation: Vec<f32>,
    /// Image width
    pub width: u32,
    /// Image height
    pub height: u32,
}

impl EdgeResponse {
    /// Create new edge response with given dimensions
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        Self {
            magnitude: vec![0.0; size],
            orientation: vec![0.0; size],
            width,
            height,
        }
    }

    /// Get edge magnitude at pixel (x, y)
    pub fn get_magnitude(&self, x: u32, y: u32) -> f32 {
        let idx = (y * self.width + x) as usize;
        self.magnitude[idx]
    }

    /// Get edge orientation at pixel (x, y)
    pub fn get_orientation(&self, x: u32, y: u32) -> f32 {
        let idx = (y * self.width + x) as usize;
        self.orientation[idx]
    }
}

/// Multi-directional edge detection result
#[derive(Debug, Clone)]
pub struct MultiDirectionEdges {
    /// Edge responses for each direction
    pub responses: Vec<EdgeResponse>,
    /// Combined edge magnitude (after selection, not sum)
    pub combined_magnitude: Vec<f32>,
    /// Dominant orientation at each pixel
    pub dominant_orientation: Vec<f32>,
    /// Image width
    pub width: u32,
    /// Image height  
    pub height: u32,
}

/// Compute Flow-guided Difference of Gaussians (FDoG)
///
/// FDoG uses the ETF direction field to apply directional Gaussians,
/// producing more coherent edges that follow the image structure.
///
/// # Arguments
/// * `gray` - Input grayscale image
/// * `etf` - Edge Tangent Flow field
/// * `config` - FDoG configuration
///
/// # Returns
/// Edge response map with flow-guided enhancement
pub fn compute_fdog(gray: &GrayImage, etf: &EtfField, config: &FdogConfig) -> EdgeResponse {
    let width = gray.width();
    let height = gray.height();

    log::debug!("Computing FDoG for {width}x{height} image with config: {config:?}");
    let start_time = std::time::Instant::now();

    let mut edge_response = EdgeResponse::new(width, height);

    // Apply multiple FDoG passes if configured
    for pass in 0..config.passes {
        log::trace!("FDoG pass {}/{}", pass + 1, config.passes);

        // Compute directional Gaussians
        let g_sigma_s = compute_directional_gaussian(gray, etf, config.sigma_s);
        let g_sigma_c = compute_directional_gaussian(gray, etf, config.sigma_c);

        // Compute DoG response using execution abstraction
        let indices: Vec<usize> = (0..(width * height) as usize).collect();
        let new_magnitudes = execute_parallel(indices, |i| {
            let dog_response = g_sigma_s[i] - config.tau * g_sigma_c[i];
            (edge_response.magnitude[i] + dog_response.max(0.0)) / (pass + 1) as f32
        });
        edge_response.magnitude = new_magnitudes;
    }

    // Set orientations from ETF field using execution abstraction
    let indices: Vec<usize> = (0..(width * height) as usize).collect();
    let orientations = execute_parallel(indices, |i| {
        let tx = etf.tx[i];
        let ty = etf.ty[i];
        ty.atan2(tx)
    });
    edge_response.orientation = orientations;

    let duration = start_time.elapsed();
    log::debug!(
        "FDoG computation completed in {:.2}ms",
        duration.as_secs_f64() * 1000.0
    );

    edge_response
}

/// Compute Extended Difference of Gaussians (XDoG)
///
/// XDoG provides better edge localization and artistic control compared to standard DoG.
///
/// # Arguments
/// * `gray` - Input grayscale image
/// * `etf` - Edge Tangent Flow field  
/// * `config` - XDoG configuration
///
/// # Returns
/// Enhanced edge response map
pub fn compute_xdog(gray: &GrayImage, etf: &EtfField, config: &XdogConfig) -> EdgeResponse {
    let width = gray.width();
    let height = gray.height();

    log::debug!("Computing XDoG for {width}x{height} image with config: {config:?}");
    let start_time = std::time::Instant::now();

    // Compute two directional Gaussians with different scales
    let g1 = compute_directional_gaussian(gray, etf, config.sigma);
    let g2 = compute_directional_gaussian(gray, etf, config.sigma * config.k);

    let mut edge_response = EdgeResponse::new(width, height);

    // Compute XDoG response with soft thresholding using execution abstraction
    let indices: Vec<usize> = (0..(width * height) as usize).collect();
    let results = execute_parallel(indices, |i| {
        let dog = g1[i] - g2[i];

        // Apply soft thresholding function
        let xdog = if dog < config.epsilon {
            1.0
        } else {
            1.0 + (config.phi * dog).tanh()
        };

        // Apply gamma correction
        let final_response = xdog.powf(config.gamma).max(0.0);

        // Set orientation from ETF
        let tx = etf.tx[i];
        let ty = etf.ty[i];
        let orientation = ty.atan2(tx);

        (final_response, orientation)
    });
    let (magnitudes, orientations): (Vec<f32>, Vec<f32>) = results.into_iter().unzip();

    edge_response.magnitude = magnitudes;
    edge_response.orientation = orientations;

    let duration = start_time.elapsed();
    log::debug!(
        "XDoG computation completed in {:.2}ms",
        duration.as_secs_f64() * 1000.0
    );

    edge_response
}

/// Compute directional Gaussian blur guided by ETF field
fn compute_directional_gaussian(gray: &GrayImage, etf: &EtfField, sigma: f32) -> Vec<f32> {
    let width = gray.width();
    let height = gray.height();
    // Create result vector

    let kernel_radius = (3.0 * sigma).ceil() as i32;
    let kernel_size = (2 * kernel_radius + 1) as usize;

    // Generate 1D Gaussian kernel
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

    // Apply directional blur guided by ETF using execution abstraction
    let size = (width * height) as usize;
    let indices: Vec<usize> = (0..size).collect();
    let pixel_results = execute_parallel(indices, |i| {
        let y = i as u32 / width;
        let x = i as u32 % width;

        let (tx, ty) = etf.get_tangent(x, y);
        let coherency = etf.get_coherency(x, y);

        // For low coherency areas, use isotropic blur
        if coherency < 0.1 {
            return gray.get_pixel(x, y)[0] as f32 / 255.0;
        }

        let mut value_sum = 0.0;
        let mut weight_sum = 0.0;

        // Sample along the tangent direction
        for (j, &weight) in kernel.iter().enumerate() {
            let t = (j as i32 - kernel_radius) as f32;
            let sample_x = x as f32 + t * tx;
            let sample_y = y as f32 + t * ty;

            // Bilinear interpolation for sub-pixel sampling
            let pixel_value = sample_bilinear(gray, sample_x, sample_y);

            value_sum += pixel_value * weight;
            weight_sum += weight;
        }

        if weight_sum > 0.0 {
            value_sum / weight_sum
        } else {
            gray.get_pixel(x, y)[0] as f32 / 255.0
        }
    });

    pixel_results
}

/// Bilinear interpolation for sub-pixel image sampling
fn sample_bilinear(image: &GrayImage, x: f32, y: f32) -> f32 {
    let width = image.width() as f32;
    let height = image.height() as f32;

    // Clamp coordinates to image bounds
    let x = x.max(0.0).min(width - 1.0);
    let y = y.max(0.0).min(height - 1.0);

    let x1 = x.floor() as u32;
    let y1 = y.floor() as u32;
    let x2 = (x1 + 1).min(image.width() - 1);
    let y2 = (y1 + 1).min(image.height() - 1);

    let fx = x - x1 as f32;
    let fy = y - y1 as f32;

    let p11 = image.get_pixel(x1, y1)[0] as f32 / 255.0;
    let p12 = image.get_pixel(x1, y2)[0] as f32 / 255.0;
    let p21 = image.get_pixel(x2, y1)[0] as f32 / 255.0;
    let p22 = image.get_pixel(x2, y2)[0] as f32 / 255.0;

    let top = p11 * (1.0 - fx) + p21 * fx;
    let bottom = p12 * (1.0 - fx) + p22 * fx;

    top * (1.0 - fy) + bottom * fy
}

/// Apply Non-Maximum Suppression (NMS) along tangent directions
///
/// NMS thins edges to single-pixel width by suppressing non-maximal responses
/// along the gradient direction (perpendicular to ETF tangent).
///
/// # Arguments
/// * `edge_response` - Input edge response map
/// * `etf` - Edge Tangent Flow field
/// * `config` - NMS configuration
///
/// # Returns
/// Thinned edge map
pub fn apply_nms(edge_response: &EdgeResponse, etf: &EtfField, config: &NmsConfig) -> Vec<f32> {
    let width = edge_response.width;
    let height = edge_response.height;

    log::debug!("Applying NMS to {width}x{height} edge map");
    let start_time = std::time::Instant::now();

    // Optional smoothing before NMS
    let smoothed_magnitude = if config.smooth_before_nms {
        gaussian_smooth(&edge_response.magnitude, width, height, config.smooth_sigma)
    } else {
        edge_response.magnitude.clone()
    };

    // Create NMS result vector

    let size = (width * height) as usize;
    let indices: Vec<usize> = (0..size).collect();
    let nms_values = execute_parallel(indices, |i| {
        let y = i as u32 / width;
        let x = i as u32 % width;
        let magnitude = smoothed_magnitude[i];

        if magnitude < config.low {
            return 0.0;
        }

        let (tx, ty) = etf.get_tangent(x, y);
        let coherency = etf.get_coherency(x, y);

        // For low coherency areas, skip NMS
        if coherency < 0.1 {
            return magnitude;
        }

        // Gradient direction is perpendicular to tangent
        let gx = -ty; // Rotate tangent by 90 degrees
        let gy = tx;

        // Sample neighbors along gradient direction
        let neighbor1_x = x as f32 + gx;
        let neighbor1_y = y as f32 + gy;
        let neighbor2_x = x as f32 - gx;
        let neighbor2_y = y as f32 - gy;

        let neighbor1_mag =
            sample_magnitude_bilinear(&smoothed_magnitude, width, height, neighbor1_x, neighbor1_y);
        let neighbor2_mag =
            sample_magnitude_bilinear(&smoothed_magnitude, width, height, neighbor2_x, neighbor2_y);

        // Non-maximum suppression check
        if magnitude >= neighbor1_mag && magnitude >= neighbor2_mag {
            magnitude
        } else {
            0.0
        }
    });

    let duration = start_time.elapsed();
    log::debug!("NMS completed in {:.2}ms", duration.as_secs_f64() * 1000.0);

    nms_values
}

/// Apply hysteresis thresholding to create clean edge map
///
/// Uses double thresholding with connectivity analysis to preserve
/// strong connected edge structures while removing noise.
///
/// # Arguments  
/// * `nms_edges` - Non-maximum suppressed edge map
/// * `width` - Image width
/// * `height` - Image height
/// * `low` - Low threshold for weak edges
/// * `high` - High threshold for strong edges
///
/// # Returns
/// Binary edge map (0.0 or 1.0)
pub fn hysteresis_threshold(
    nms_edges: &[f32],
    width: u32,
    height: u32,
    low: f32,
    high: f32,
) -> Vec<f32> {
    log::debug!("Applying hysteresis thresholding with low={low}, high={high}");
    let start_time = std::time::Instant::now();

    let mut result = vec![0.0; nms_edges.len()];
    let mut visited = vec![false; nms_edges.len()];

    // Find all strong edge pixels (above high threshold)
    let strong_edges: Vec<(u32, u32)> = (0..height)
        .flat_map(|y| {
            (0..width).filter_map(move |x| {
                let idx = (y * width + x) as usize;
                if nms_edges[idx] >= high {
                    Some((x, y))
                } else {
                    None
                }
            })
        })
        .collect();

    // Trace connected components from strong edges
    for (start_x, start_y) in strong_edges {
        let start_idx = (start_y * width + start_x) as usize;
        if visited[start_idx] {
            continue;
        }

        // BFS to find all connected edge pixels
        let mut queue = std::collections::VecDeque::new();
        queue.push_back((start_x, start_y));
        visited[start_idx] = true;
        result[start_idx] = 1.0;

        while let Some((x, y)) = queue.pop_front() {
            // Check 8-connected neighbors
            for dy in -1..=1i32 {
                for dx in -1..=1i32 {
                    if dx == 0 && dy == 0 {
                        continue;
                    }

                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;

                    if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                        let nx = nx as u32;
                        let ny = ny as u32;
                        let nidx = (ny * width + nx) as usize;

                        if !visited[nidx] && nms_edges[nidx] >= low {
                            visited[nidx] = true;
                            result[nidx] = 1.0;
                            queue.push_back((nx, ny));
                        }
                    }
                }
            }
        }
    }

    let duration = start_time.elapsed();
    log::debug!(
        "Hysteresis thresholding completed in {:.2}ms",
        duration.as_secs_f64() * 1000.0
    );

    result
}

/// Multi-directional edge detection with selection (not sum)
///
/// Computes edge responses in multiple orientations and selects the dominant
/// response at each pixel rather than summing responses.
///
/// # Arguments
/// * `gray` - Input grayscale image  
/// * `orientations` - List of orientations to test (in radians)
/// * `fdog_config` - FDoG configuration
/// * `nms_config` - NMS configuration
///
/// # Returns
/// Multi-directional edge detection result with selected responses
pub fn compute_multi_direction_edges(
    gray: &GrayImage,
    orientations: &[f32],
    fdog_config: &FdogConfig,
    _nms_config: &NmsConfig,
) -> MultiDirectionEdges {
    let width = gray.width();
    let height = gray.height();
    let size = (width * height) as usize;

    log::debug!(
        "Computing multi-directional edges for {} orientations",
        orientations.len()
    );
    let start_time = std::time::Instant::now();

    // Compute ETF field for the image
    let etf_config = EtfConfig::default();
    let etf = compute_etf(gray, &etf_config);

    // Compute edge responses for each orientation
    let orientation_data: Vec<f32> = orientations.to_vec();
    let responses = execute_parallel(orientation_data, |orientation| {
        // Create rotated ETF field for this orientation
        let mut rotated_etf = etf.clone();

        // Rotate tangent vectors by the specified angle
        for i in 0..size {
            let tx = etf.tx[i];
            let ty = etf.ty[i];

            let cos_theta = orientation.cos();
            let sin_theta = orientation.sin();

            rotated_etf.tx[i] = tx * cos_theta - ty * sin_theta;
            rotated_etf.ty[i] = tx * sin_theta + ty * cos_theta;
        }

        // Compute FDoG with rotated ETF
        compute_fdog(gray, &rotated_etf, fdog_config)
    });

    // Select dominant response at each pixel (not sum) using execution abstraction
    let indices: Vec<usize> = (0..size).collect();
    let results = execute_parallel(indices, |i| {
        let mut max_response = 0.0;
        let mut best_orientation = 0.0;

        // Find orientation with maximum response
        for (orientation_idx, response) in responses.iter().enumerate() {
            let magnitude = response.magnitude[i];
            if magnitude > max_response {
                max_response = magnitude;
                best_orientation = orientations[orientation_idx];
            }
        }

        (max_response, best_orientation)
    });
    let (combined_magnitude, dominant_orientation): (Vec<f32>, Vec<f32>) =
        results.into_iter().unzip();

    let duration = start_time.elapsed();
    log::debug!(
        "Multi-directional edge detection completed in {:.2}ms",
        duration.as_secs_f64() * 1000.0
    );

    MultiDirectionEdges {
        responses,
        combined_magnitude,
        dominant_orientation,
        width,
        height,
    }
}

/// Sample magnitude with bilinear interpolation
fn sample_magnitude_bilinear(magnitude: &[f32], width: u32, height: u32, x: f32, y: f32) -> f32 {
    // Clamp coordinates to image bounds
    let x = x.max(0.0).min(width as f32 - 1.0);
    let y = y.max(0.0).min(height as f32 - 1.0);

    let x1 = x.floor() as u32;
    let y1 = y.floor() as u32;
    let x2 = (x1 + 1).min(width - 1);
    let y2 = (y1 + 1).min(height - 1);

    let fx = x - x1 as f32;
    let fy = y - y1 as f32;

    let p11 = magnitude[(y1 * width + x1) as usize];
    let p12 = magnitude[(y2 * width + x1) as usize];
    let p21 = magnitude[(y1 * width + x2) as usize];
    let p22 = magnitude[(y2 * width + x2) as usize];

    let top = p11 * (1.0 - fx) + p21 * fx;
    let bottom = p12 * (1.0 - fx) + p22 * fx;

    top * (1.0 - fy) + bottom * fy
}

/// Apply Gaussian smoothing to a 2D field
fn gaussian_smooth(field: &[f32], width: u32, height: u32, sigma: f32) -> Vec<f32> {
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

    // Horizontal pass
    let size = (width * height) as usize;
    let indices: Vec<usize> = (0..size).collect();
    let temp_field = execute_parallel(indices, |i| {
        let y = i as u32 / width;
        let x = i as u32 % width;
        let mut value_sum = 0.0;

        for (j, &kernel_val) in kernel.iter().enumerate() {
            let px = (x as i32 + j as i32 - kernel_radius)
                .max(0)
                .min((width - 1) as i32) as u32;
            let idx = (y * width + px) as usize;
            value_sum += field[idx] * kernel_val;
        }

        value_sum
    });

    // Vertical pass
    let indices: Vec<usize> = (0..size).collect();

    execute_parallel(indices, |i| {
        let y = i as u32 / width;
        let x = i as u32 % width;
        let mut value_sum = 0.0;

        for (j, &kernel_val) in kernel.iter().enumerate() {
            let py = (y as i32 + j as i32 - kernel_radius)
                .max(0)
                .min((height - 1) as i32) as u32;
            let idx = (py * width + x) as usize;
            value_sum += temp_field[idx] * kernel_val;
        }

        value_sum
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::etf::{compute_etf, EtfConfig};
    use image::{GrayImage, Luma};

    #[test]
    fn test_fdog_config_default() {
        let config = FdogConfig::default();
        assert_eq!(config.sigma_s, 1.2);
        assert_eq!(config.sigma_c, 2.0);
        assert_eq!(config.passes, 1);
        assert_eq!(config.tau, 0.90);
    }

    #[test]
    fn test_xdog_config_default() {
        let config = XdogConfig::default();
        assert_eq!(config.sigma, 1.0);
        assert_eq!(config.k, 1.7);
        assert_eq!(config.phi, 10.0);
        assert_eq!(config.epsilon, 0.0);
        assert_eq!(config.gamma, 0.98);
    }

    #[test]
    fn test_nms_config_default() {
        let config = NmsConfig::default();
        assert_eq!(config.low, 0.08);
        assert_eq!(config.high, 0.16);
        assert!(config.smooth_before_nms);
        assert_eq!(config.smooth_sigma, 0.8);
    }

    #[test]
    fn test_edge_response_creation() {
        let response = EdgeResponse::new(10, 10);
        assert_eq!(response.width, 10);
        assert_eq!(response.height, 10);
        assert_eq!(response.magnitude.len(), 100);
        assert_eq!(response.orientation.len(), 100);
    }

    #[test]
    fn test_bilinear_sampling() {
        let mut img = GrayImage::new(3, 3);
        img.put_pixel(0, 0, Luma([0]));
        img.put_pixel(1, 0, Luma([128]));
        img.put_pixel(2, 0, Luma([255]));
        img.put_pixel(0, 1, Luma([0]));
        img.put_pixel(1, 1, Luma([128]));
        img.put_pixel(2, 1, Luma([255]));
        img.put_pixel(0, 2, Luma([0]));
        img.put_pixel(1, 2, Luma([128]));
        img.put_pixel(2, 2, Luma([255]));

        // Test center pixel
        let value = sample_bilinear(&img, 1.0, 1.0);
        assert!((value - 0.5).abs() < 0.01); // 128/255 ≈ 0.5

        // Test interpolated position
        let value = sample_bilinear(&img, 0.5, 0.5);
        assert!(value < 0.5); // Should be between 0 and 128/255
    }

    #[test]
    fn test_fdog_computation() {
        // Create a simple test image with vertical edge
        let mut img = GrayImage::new(10, 10);
        for y in 0..10 {
            for x in 0..10 {
                let value = if x < 5 { 0 } else { 255 };
                img.put_pixel(x, y, Luma([value]));
            }
        }

        // Compute ETF
        let etf_config = EtfConfig::default();
        let etf = compute_etf(&img, &etf_config);

        // Compute FDoG
        let fdog_config = FdogConfig::default();
        let result = compute_fdog(&img, &etf, &fdog_config);

        assert_eq!(result.width, 10);
        assert_eq!(result.height, 10);
        assert_eq!(result.magnitude.len(), 100);
        assert_eq!(result.orientation.len(), 100);
    }

    #[test]
    fn test_hysteresis_threshold() {
        // Create simple edge map
        let mut edges = vec![0.0; 25]; // 5x5 image
        edges[12] = 1.0; // Strong edge in center
        edges[11] = 0.15; // Weak edge connected to strong
        edges[13] = 0.15; // Weak edge connected to strong
        edges[7] = 0.15; // Weak edge connected to strong
        edges[17] = 0.15; // Weak edge connected to strong

        let result = hysteresis_threshold(&edges, 5, 5, 0.1, 0.8);

        // Strong edge should be preserved
        assert_eq!(result[12], 1.0);

        // Connected weak edges should be preserved
        assert_eq!(result[11], 1.0);
        assert_eq!(result[13], 1.0);
        assert_eq!(result[7], 1.0);
        assert_eq!(result[17], 1.0);

        // Unconnected areas should be suppressed
        assert_eq!(result[0], 0.0);
        assert_eq!(result[24], 0.0);
    }
}
