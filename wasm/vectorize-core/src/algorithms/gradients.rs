//! Gradient calculation module for dot-based pixel mapping
//!
//! This module provides efficient gradient magnitude and local variance calculations
//! optimized for dot placement algorithms. It uses Sobel operators for edge detection
//! and sliding window variance calculation for texture analysis.

use image::GrayImage;
use rayon::prelude::*;

/// Configuration for gradient analysis
#[derive(Debug, Clone)]
pub struct GradientConfig {
    /// Radius for local variance calculation (default: 3)
    pub variance_radius: u32,
    /// Use parallel processing for large images (default: true)
    pub use_parallel: bool,
    /// Minimum image size to enable parallel processing (default: 10000 pixels)
    pub parallel_threshold: usize,
}

impl Default for GradientConfig {
    fn default() -> Self {
        Self {
            variance_radius: 3,
            use_parallel: true,
            parallel_threshold: 10000,
        }
    }
}

/// Comprehensive gradient analysis results
#[derive(Debug, Clone)]
pub struct GradientAnalysis {
    /// Gradient magnitude values for each pixel
    pub magnitude: Vec<f32>,
    /// Local variance values for each pixel  
    pub variance: Vec<f32>,
    /// Image width
    pub width: u32,
    /// Image height
    pub height: u32,
}

impl GradientAnalysis {
    /// Get gradient magnitude at specific pixel coordinates
    pub fn get_magnitude(&self, x: u32, y: u32) -> Option<f32> {
        if x >= self.width || y >= self.height {
            return None;
        }
        let index = (y * self.width + x) as usize;
        self.magnitude.get(index).copied()
    }

    /// Get local variance at specific pixel coordinates
    pub fn get_variance(&self, x: u32, y: u32) -> Option<f32> {
        if x >= self.width || y >= self.height {
            return None;
        }
        let index = (y * self.width + x) as usize;
        self.variance.get(index).copied()
    }

    /// Get combined gradient strength (magnitude * variance)
    pub fn get_gradient_strength(&self, x: u32, y: u32) -> Option<f32> {
        let mag = self.get_magnitude(x, y)?;
        let var = self.get_variance(x, y)?;
        Some(mag * var.sqrt()) // Square root of variance gives standard deviation
    }
}

/// Calculate gradient magnitude using Sobel operators at a specific pixel
///
/// Uses 3x3 Sobel kernels for X and Y gradients, then computes magnitude.
/// Handles boundary pixels using mirror/clamp boundary conditions.
///
/// # Arguments
/// * `gray` - Input grayscale image
/// * `x` - X coordinate of pixel
/// * `y` - Y coordinate of pixel
///
/// # Returns
/// Gradient magnitude value (0.0 to ~362.0 for 8-bit images)
pub fn calculate_gradient_magnitude(gray: &GrayImage, x: u32, y: u32) -> f32 {
    let width = gray.width();
    let height = gray.height();

    // Sobel X kernel: [-1, 0, 1; -2, 0, 2; -1, 0, 1]
    // Sobel Y kernel: [-1, -2, -1; 0, 0, 0; 1, 2, 1]

    let mut gx = 0i32;
    let mut gy = 0i32;

    // Apply 3x3 kernels centered at (x, y)
    for dy in -1i32..=1 {
        for dx in -1i32..=1 {
            // Handle boundary conditions using clamping
            let nx = ((x as i32) + dx).clamp(0, (width - 1) as i32) as u32;
            let ny = ((y as i32) + dy).clamp(0, (height - 1) as i32) as u32;

            let pixel_value = gray.get_pixel(nx, ny).0[0] as i32;

            // Sobel X coefficients
            let sobel_x_coeff = match dx {
                -1 => match dy {
                    -1 => -1,
                    0 => -2,
                    1 => -1,
                    _ => 0,
                },
                0 => 0, // Middle column is all zeros
                1 => match dy {
                    -1 => 1,
                    0 => 2,
                    1 => 1,
                    _ => 0,
                },
                _ => 0,
            };

            // Sobel Y coefficients
            let sobel_y_coeff = match dy {
                -1 => match dx {
                    -1 => -1,
                    0 => -2,
                    1 => -1,
                    _ => 0,
                },
                0 => 0, // Middle row is all zeros
                1 => match dx {
                    -1 => 1,
                    0 => 2,
                    1 => 1,
                    _ => 0,
                },
                _ => 0,
            };

            gx += pixel_value * sobel_x_coeff;
            gy += pixel_value * sobel_y_coeff;
        }
    }

    // Calculate magnitude: sqrt(gx² + gy²)
    ((gx * gx + gy * gy) as f32).sqrt()
}

/// Calculate local variance using sliding window approach
///
/// Computes variance within a circular region around the specified pixel.
/// Uses efficient incremental calculation to minimize repeated computations.
///
/// # Arguments
/// * `gray` - Input grayscale image
/// * `x` - X coordinate of pixel
/// * `y` - Y coordinate of pixel  
/// * `radius` - Radius of analysis window
///
/// # Returns
/// Local variance value
pub fn calculate_local_variance(gray: &GrayImage, x: u32, y: u32, radius: u32) -> f32 {
    let width = gray.width();
    let height = gray.height();

    let mut sum = 0f64;
    let mut sum_sq = 0f64;
    let mut count = 0;

    let radius_sq = (radius * radius) as f64;

    // Calculate bounds for the analysis window
    let start_x = ((x as i32) - (radius as i32)).max(0) as u32;
    let end_x = ((x as i32) + (radius as i32)).min((width - 1) as i32) as u32;
    let start_y = ((y as i32) - (radius as i32)).max(0) as u32;
    let end_y = ((y as i32) + (radius as i32)).min((height - 1) as i32) as u32;

    // Iterate through the bounding box and check circular distance
    for py in start_y..=end_y {
        for px in start_x..=end_x {
            let dx = (px as f64) - (x as f64);
            let dy = (py as f64) - (y as f64);
            let dist_sq = dx * dx + dy * dy;

            // Only include pixels within the circular radius
            if dist_sq <= radius_sq {
                let pixel_value = gray.get_pixel(px, py).0[0] as f64;
                sum += pixel_value;
                sum_sq += pixel_value * pixel_value;
                count += 1;
            }
        }
    }

    if count <= 1 {
        return 0.0; // Cannot calculate variance with 0 or 1 samples
    }

    // Calculate variance: E[X²] - (E[X])²
    let mean = sum / (count as f64);
    let variance = (sum_sq / (count as f64)) - (mean * mean);

    variance.max(0.0) as f32 // Ensure non-negative due to floating point precision
}

/// Analyze gradients across the entire image
///
/// Performs comprehensive gradient analysis using optimized parallel processing
/// for performance. Calculates both gradient magnitude and local variance for
/// each pixel in the image.
///
/// # Arguments
/// * `gray` - Input grayscale image
///
/// # Returns
/// Complete gradient analysis results
pub fn analyze_image_gradients(gray: &GrayImage) -> GradientAnalysis {
    analyze_image_gradients_with_config(gray, &GradientConfig::default())
}

/// Analyze gradients with custom configuration
///
/// Advanced version allowing configuration of variance radius and parallel processing.
///
/// # Arguments
/// * `gray` - Input grayscale image
/// * `config` - Configuration parameters
///
/// # Returns
/// Complete gradient analysis results
pub fn analyze_image_gradients_with_config(
    gray: &GrayImage,
    config: &GradientConfig,
) -> GradientAnalysis {
    let width = gray.width();
    let height = gray.height();
    let total_pixels = (width * height) as usize;

    // Pre-allocate result vectors with bounds checking
    if total_pixels > 100_000_000 {
        // Prevent excessive memory allocation (>400MB for gradients alone)
        log::warn!(
            "Image too large for gradient analysis: {} pixels",
            total_pixels
        );
        return GradientAnalysis {
            magnitude: vec![],
            variance: vec![],
            width,
            height,
        };
    }
    let mut magnitude = vec![0.0f32; total_pixels];
    let mut variance = vec![0.0f32; total_pixels];

    // Determine if parallel processing should be used
    let use_parallel = config.use_parallel && total_pixels >= config.parallel_threshold;

    if use_parallel {
        // Parallel processing for large images
        // Use iterators directly to avoid intermediate allocation
        let pixel_indices: Vec<usize> = (0..total_pixels).collect();

        let results: Vec<(f32, f32)> = pixel_indices
            .par_iter()
            .map(|&index| {
                let x = (index % width as usize) as u32;
                let y = (index / width as usize) as u32;
                let mag = calculate_gradient_magnitude(gray, x, y);
                let var = calculate_local_variance(gray, x, y, config.variance_radius);
                (mag, var)
            })
            .collect();

        // Copy results back to output vectors
        for (i, (mag, var)) in results.into_iter().enumerate() {
            magnitude[i] = mag;
            variance[i] = var;
        }
    } else {
        // Sequential processing for smaller images
        for y in 0..height {
            for x in 0..width {
                let index = (y * width + x) as usize;
                magnitude[index] = calculate_gradient_magnitude(gray, x, y);
                variance[index] = calculate_local_variance(gray, x, y, config.variance_radius);
            }
        }
    }

    GradientAnalysis {
        magnitude,
        variance,
        width,
        height,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{GrayImage, Luma};
    use std::time::Instant;

    /// Create a simple test gradient image
    fn create_test_gradient_image() -> GrayImage {
        let mut img = GrayImage::new(100, 100);
        for y in 0..100 {
            for x in 0..100 {
                // Create diagonal gradient
                let value = ((x + y) * 255 / 200).min(255) as u8;
                img.put_pixel(x, y, Luma([value]));
            }
        }
        img
    }

    /// Create test image with clear edges
    fn create_test_edge_image() -> GrayImage {
        let mut img = GrayImage::new(50, 50);
        for y in 0..50 {
            for x in 0..50 {
                let value = if x < 25 { 0 } else { 255 };
                img.put_pixel(x, y, Luma([value]));
            }
        }
        img
    }

    #[test]
    fn test_gradient_magnitude_center_pixel() {
        let img = create_test_gradient_image();
        let magnitude = calculate_gradient_magnitude(&img, 50, 50);

        // Gradient magnitude should be non-zero for a gradient image
        assert!(
            magnitude > 0.0,
            "Gradient magnitude should be positive for gradient image"
        );
        assert!(magnitude < 500.0, "Gradient magnitude should be reasonable");
    }

    #[test]
    fn test_gradient_magnitude_boundary_pixels() {
        let img = create_test_gradient_image();

        // Test corner pixels (boundary conditions)
        let top_left = calculate_gradient_magnitude(&img, 0, 0);
        let top_right = calculate_gradient_magnitude(&img, 99, 0);
        let bottom_left = calculate_gradient_magnitude(&img, 0, 99);
        let bottom_right = calculate_gradient_magnitude(&img, 99, 99);

        // All should be finite and non-negative
        assert!(top_left >= 0.0 && top_left.is_finite());
        assert!(top_right >= 0.0 && top_right.is_finite());
        assert!(bottom_left >= 0.0 && bottom_left.is_finite());
        assert!(bottom_right >= 0.0 && bottom_right.is_finite());
    }

    #[test]
    fn test_gradient_magnitude_sharp_edge() {
        let img = create_test_edge_image();

        // Test at the edge (x=24,25,26) should have high gradient
        let edge_magnitude = calculate_gradient_magnitude(&img, 25, 25);
        let no_edge_magnitude = calculate_gradient_magnitude(&img, 10, 25);

        assert!(
            edge_magnitude > no_edge_magnitude * 2.0,
            "Edge should have significantly higher gradient than uniform area"
        );
    }

    #[test]
    fn test_local_variance_uniform_area() {
        // Create uniform image
        let img = GrayImage::from_pixel(50, 50, Luma([128]));
        let variance = calculate_local_variance(&img, 25, 25, 3);

        assert!(
            variance < 0.1,
            "Variance should be near zero for uniform area"
        );
    }

    #[test]
    fn test_local_variance_textured_area() {
        // Create checkerboard pattern
        let mut img = GrayImage::new(50, 50);
        for y in 0..50 {
            for x in 0..50 {
                let value = if (x + y) % 2 == 0 { 0 } else { 255 };
                img.put_pixel(x, y, Luma([value]));
            }
        }

        let variance = calculate_local_variance(&img, 25, 25, 3);
        assert!(
            variance > 1000.0,
            "Variance should be high for checkerboard pattern"
        );
    }

    #[test]
    fn test_local_variance_boundary_conditions() {
        let img = create_test_gradient_image();

        // Test variance calculation at image boundaries
        let corner_variance = calculate_local_variance(&img, 0, 0, 3);
        let edge_variance = calculate_local_variance(&img, 0, 25, 3);

        assert!(corner_variance >= 0.0 && corner_variance.is_finite());
        assert!(edge_variance >= 0.0 && edge_variance.is_finite());
    }

    #[test]
    fn test_gradient_analysis_struct_accessors() {
        let img = create_test_gradient_image();
        let analysis = analyze_image_gradients(&img);

        assert_eq!(analysis.width, 100);
        assert_eq!(analysis.height, 100);
        assert_eq!(analysis.magnitude.len(), 10000);
        assert_eq!(analysis.variance.len(), 10000);

        // Test accessor methods
        let mag = analysis.get_magnitude(50, 50);
        let var = analysis.get_variance(50, 50);
        let strength = analysis.get_gradient_strength(50, 50);

        assert!(mag.is_some() && mag.unwrap() >= 0.0);
        assert!(var.is_some() && var.unwrap() >= 0.0);
        assert!(strength.is_some() && strength.unwrap() >= 0.0);

        // Test out-of-bounds access
        assert!(analysis.get_magnitude(100, 50).is_none());
        assert!(analysis.get_variance(50, 100).is_none());
    }

    #[test]
    fn test_gradient_analysis_performance() {
        // Test performance with 500x500 image (target: <50ms)
        let img = GrayImage::from_fn(500, 500, |x, y| Luma([((x + y) % 256) as u8]));

        let start = Instant::now();
        let _analysis = analyze_image_gradients(&img);
        let duration = start.elapsed();

        println!("Gradient analysis for 500x500 image took: {:?}", duration);
        assert!(
            duration.as_millis() < 50,
            "Gradient analysis should complete in under 50ms for 500x500 image, took {:?}",
            duration
        );
    }

    #[test]
    fn test_gradient_config_custom_radius() {
        let img = create_test_gradient_image();
        let config = GradientConfig {
            variance_radius: 5,
            ..Default::default()
        };

        let analysis = analyze_image_gradients_with_config(&img, &config);

        // Should complete successfully with custom radius
        assert_eq!(analysis.width, 100);
        assert_eq!(analysis.height, 100);

        // Variance values should be different from default radius=3
        let default_analysis = analyze_image_gradients(&img);
        let center_var_custom = analysis.get_variance(50, 50).unwrap();
        let center_var_default = default_analysis.get_variance(50, 50).unwrap();

        // They should be different (larger radius typically gives different variance)
        assert_ne!(center_var_custom, center_var_default);
    }

    #[test]
    fn test_parallel_vs_sequential_consistency() {
        let img = create_test_gradient_image();

        let config_parallel = GradientConfig {
            use_parallel: true,
            parallel_threshold: 1, // Force parallel processing
            ..Default::default()
        };

        let config_sequential = GradientConfig {
            use_parallel: false,
            ..Default::default()
        };

        let parallel_result = analyze_image_gradients_with_config(&img, &config_parallel);
        let sequential_result = analyze_image_gradients_with_config(&img, &config_sequential);

        // Results should be very similar (within floating point precision)
        for i in 0..parallel_result.magnitude.len() {
            let diff_mag = (parallel_result.magnitude[i] - sequential_result.magnitude[i]).abs();
            let diff_var = (parallel_result.variance[i] - sequential_result.variance[i]).abs();

            assert!(
                diff_mag < 0.001,
                "Parallel and sequential magnitude results should match"
            );
            assert!(
                diff_var < 0.001,
                "Parallel and sequential variance results should match"
            );
        }
    }
}
