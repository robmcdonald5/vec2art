//! Unified preprocessing module for all tracing algorithms
//!
//! This module provides consistent preprocessing operations that can be applied
//! before any vectorization algorithm runs. This ensures consistent behavior
//! across Edge, Centerline, Superpixel, and Dots algorithms.

use image::{DynamicImage, GrayImage, ImageBuffer, Luma, Rgba};


use crate::algorithms::dots::background::BackgroundConfig;
use crate::algorithms::tracing::trace_low::{BackgroundRemovalAlgorithm, TraceLowConfig};
use crate::error::VectorizeError;

/// Apply all enabled preprocessing operations to an image
///
/// This is the main entry point for preprocessing. It applies various
/// preprocessing operations based on the configuration, ensuring consistent
/// behavior across all tracing algorithms.
///
/// # Arguments
/// * `image` - Input RGBA image to preprocess
/// * `config` - Configuration controlling which preprocessing operations to apply
/// * `algorithm_name` - Name of the algorithm for logging purposes
///
/// # Returns
/// Preprocessed RGBA image with the same dimensions as input
pub fn apply_preprocessing(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    algorithm_name: &str,
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, VectorizeError> {
    let mut processed = image.clone();

    // Apply background removal first if enabled (before noise filtering)
    // Background removal should come first to eliminate unwanted areas before smoothing
    if config.enable_background_removal {
        processed = apply_background_removal(&processed, config, algorithm_name)?;
    }

    // Apply noise filtering if enabled (after background removal)
    if config.noise_filtering {
        log::info!("{} noise filtering ENABLED - applying bilateral filter", algorithm_name);
        log::info!("  Spatial sigma: {}, Range sigma: {}",
            config.noise_filter_spatial_sigma,
            config.noise_filter_range_sigma);
        processed = apply_noise_filtering(&processed, config, algorithm_name);
    } else {
        log::info!("{} noise filtering DISABLED", algorithm_name);
    }

    Ok(processed)
}

/// Apply bilateral noise filtering while preserving color information
///
/// This function applies edge-preserving bilateral filtering to reduce noise
/// while maintaining important edges and color relationships. It works by:
/// 1. Converting to grayscale for filtering
/// 2. Applying bilateral filter to the luminance channel
/// 3. Reconstructing RGBA while preserving original color ratios
///
/// # Arguments
/// * `image` - Input RGBA image
/// * `config` - Configuration with noise filter parameters
/// * `algorithm_name` - Name of the algorithm for logging
///
/// # Returns
/// Filtered RGBA image with preserved color ratios
fn apply_noise_filtering(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    algorithm_name: &str,
) -> ImageBuffer<Rgba<u8>, Vec<u8>> {

    // Convert to grayscale for noise filtering
    let gray = DynamicImage::ImageRgba8(image.clone()).to_luma8();

    // Use configurable bilateral filter parameters
    let spatial_sigma = config.noise_filter_spatial_sigma;
    let range_sigma = config.noise_filter_range_sigma;
    
    // Add debug logging without timing
    log::debug!(
        "{} noise filtering applied (spatial_σ={:.1}, range_σ={:.1})",
        algorithm_name,
        spatial_sigma,
        range_sigma
    );

    // Apply bilateral filtering to the grayscale image
    let filtered_gray = bilateral_filter(&gray, spatial_sigma, range_sigma);

    // Convert filtered grayscale back to RGBA while preserving original colors
    let mut filtered_rgba = image.clone();
    for (x, y, rgba_pixel) in filtered_rgba.enumerate_pixels_mut() {
        let filtered_luma = filtered_gray.get_pixel(x, y).0[0];

        // Calculate original luminance using standard RGB to grayscale conversion
        let original_luma = (0.299 * rgba_pixel.0[0] as f32
            + 0.587 * rgba_pixel.0[1] as f32
            + 0.114 * rgba_pixel.0[2] as f32) as u8;

        if original_luma > 0 {
            // Preserve color ratios while applying luminance filtering
            // This maintains the hue and saturation while only adjusting brightness
            let scale = filtered_luma as f32 / original_luma as f32;
            rgba_pixel.0[0] = (rgba_pixel.0[0] as f32 * scale).min(255.0) as u8;
            rgba_pixel.0[1] = (rgba_pixel.0[1] as f32 * scale).min(255.0) as u8;
            rgba_pixel.0[2] = (rgba_pixel.0[2] as f32 * scale).min(255.0) as u8;
            // Alpha channel remains unchanged
        }
    }

    filtered_rgba
}

/// Bilateral filter for edge-preserving noise reduction
///
/// Applies bilateral filtering to a grayscale image, which reduces noise
/// while preserving edges. The filter uses two Gaussian kernels:
/// - Spatial kernel: weights pixels by distance
/// - Range kernel: weights pixels by intensity similarity
///
/// # Arguments
/// * `image` - Input grayscale image
/// * `spatial_sigma` - Standard deviation for spatial Gaussian (higher = more smoothing)
/// * `range_sigma` - Standard deviation for range Gaussian (higher = less edge preservation)
///
/// # Returns
/// Filtered grayscale image with reduced noise and preserved edges
fn bilateral_filter(image: &GrayImage, spatial_sigma: f32, range_sigma: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut filtered = GrayImage::new(width, height);

    // For small spatial sigmas, use optimized fast implementation
    if spatial_sigma <= 2.0 {
        return bilateral_filter_fast(image, spatial_sigma, range_sigma);
    }

    // Calculate kernel size based on spatial sigma (3-sigma rule)
    let kernel_radius = (3.0 * spatial_sigma).ceil() as i32;

    // Precompute spatial weights
    let mut spatial_weights = Vec::new();
    for dy in -kernel_radius..=kernel_radius {
        for dx in -kernel_radius..=kernel_radius {
            let distance_sq = (dx * dx + dy * dy) as f32;
            let weight = (-distance_sq / (2.0 * spatial_sigma * spatial_sigma)).exp();
            spatial_weights.push((dx, dy, weight));
        }
    }

    // Process each pixel
    for y in 0..height {
        for x in 0..width {
            let center_intensity = image.get_pixel(x, y).0[0] as f32;
            let mut weighted_sum = 0.0;
            let mut weight_sum = 0.0;

            // Apply bilateral filter kernel
            for &(dx, dy, spatial_weight) in &spatial_weights {
                let nx = x as i32 + dx;
                let ny = y as i32 + dy;

                // Check bounds
                if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                    let neighbor_intensity = image.get_pixel(nx as u32, ny as u32).0[0] as f32;

                    // Calculate range weight based on intensity difference
                    let intensity_diff = neighbor_intensity - center_intensity;
                    let range_weight = (-(intensity_diff * intensity_diff) / (2.0 * range_sigma * range_sigma)).exp();

                    // Combine spatial and range weights
                    let combined_weight = spatial_weight * range_weight;

                    weighted_sum += neighbor_intensity * combined_weight;
                    weight_sum += combined_weight;
                }
            }

            // Normalize and set the filtered value
            let filtered_value = if weight_sum > 0.0 {
                (weighted_sum / weight_sum).round() as u8
            } else {
                image.get_pixel(x, y).0[0]
            };

            filtered.put_pixel(x, y, Luma([filtered_value]));
        }
    }

    filtered
}

/// Fast bilateral filter implementation for small kernel sizes
///
/// Optimized version for spatial_sigma <= 2.0, uses a fixed 5x5 kernel
/// for significant performance improvement.
fn bilateral_filter_fast(image: &GrayImage, spatial_sigma: f32, range_sigma: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut filtered = GrayImage::new(width, height);

    // Fixed 5x5 kernel for fast processing
    const KERNEL_SIZE: i32 = 2;

    // Precompute spatial weights for 5x5 kernel
    let mut spatial_weights = [[0.0f32; 5]; 5];
    for dy in -KERNEL_SIZE..=KERNEL_SIZE {
        for dx in -KERNEL_SIZE..=KERNEL_SIZE {
            let distance_sq = (dx * dx + dy * dy) as f32;
            let weight = (-distance_sq / (2.0 * spatial_sigma * spatial_sigma)).exp();
            spatial_weights[(dy + KERNEL_SIZE) as usize][(dx + KERNEL_SIZE) as usize] = weight;
        }
    }

    // Process each pixel with optimized inner loop
    for y in 0..height {
        for x in 0..width {
            let center_intensity = image.get_pixel(x, y).0[0] as f32;
            let mut weighted_sum = 0.0;
            let mut weight_sum = 0.0;

            // Unrolled kernel application for performance
            for dy in -KERNEL_SIZE..=KERNEL_SIZE {
                let ny = y as i32 + dy;
                if ny < 0 || ny >= height as i32 {
                    continue;
                }

                for dx in -KERNEL_SIZE..=KERNEL_SIZE {
                    let nx = x as i32 + dx;
                    if nx < 0 || nx >= width as i32 {
                        continue;
                    }

                    let neighbor_intensity = image.get_pixel(nx as u32, ny as u32).0[0] as f32;
                    let intensity_diff = neighbor_intensity - center_intensity;

                    // Get precomputed spatial weight
                    let spatial_weight = spatial_weights[(dy + KERNEL_SIZE) as usize][(dx + KERNEL_SIZE) as usize];

                    // Calculate range weight
                    let range_weight = (-(intensity_diff * intensity_diff) / (2.0 * range_sigma * range_sigma)).exp();

                    let combined_weight = spatial_weight * range_weight;
                    weighted_sum += neighbor_intensity * combined_weight;
                    weight_sum += combined_weight;
                }
            }

            let filtered_value = if weight_sum > 0.0 {
                (weighted_sum / weight_sum).round() as u8
            } else {
                image.get_pixel(x, y).0[0]
            };

            filtered.put_pixel(x, y, Luma([filtered_value]));
        }
    }

    filtered
}

/// Apply background removal to eliminate unwanted background areas
///
/// This function removes the background from an image using various algorithms.
/// It works by:
/// 1. Detecting background pixels based on edge sampling and color clustering
/// 2. Applying the selected removal algorithm (OTSU, Adaptive, or Auto)
/// 3. Making background pixels transparent or white based on configuration
///
/// # Arguments
/// * `image` - Input RGBA image
/// * `config` - Configuration with background removal parameters
/// * `algorithm_name` - Name of the algorithm for logging
///
/// # Returns
/// Image with background removed
fn apply_background_removal(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
    algorithm_name: &str,
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, VectorizeError> {

    // Create background detection config
    let bg_config = BackgroundConfig {
        tolerance: config.background_removal_strength * 0.3, // Convert 0.0-1.0 to tolerance range
        edge_sample_ratio: 0.1,
        sample_edge_pixels: true,
        cluster_colors: false,
        num_clusters: 3,
        random_seed: 42,
    };

    // Detect background pixels using advanced detection
    let background_mask = crate::algorithms::dots::background::detect_background_advanced(
        image,
        &bg_config,
    );

    let mut result_image = image.clone();

    // Apply the selected background removal algorithm
    match config.background_removal_algorithm {
        BackgroundRemovalAlgorithm::Otsu => {
            apply_otsu_background_removal(&mut result_image, &background_mask, config)?;
        }
        BackgroundRemovalAlgorithm::Adaptive => {
            apply_adaptive_background_removal(&mut result_image, &background_mask, config)?;
        }
        BackgroundRemovalAlgorithm::Auto => {
            // Use adaptive for complex images, otsu for simple ones
            let complexity = calculate_image_complexity(&result_image);
            if complexity > 0.3 {
                apply_adaptive_background_removal(&mut result_image, &background_mask, config)?;
            } else {
                apply_otsu_background_removal(&mut result_image, &background_mask, config)?;
            }
        }
    }

    
    log::debug!(
        "{} background removal applied (algorithm: {:?}, strength: {:.2})",
        algorithm_name,
        config.background_removal_algorithm,
        config.background_removal_strength
    );
    Ok(result_image)
}

/// Apply OTSU-based background removal
fn apply_otsu_background_removal(
    image: &mut ImageBuffer<Rgba<u8>, Vec<u8>>,
    background_mask: &[bool],
    config: &TraceLowConfig,
) -> Result<(), VectorizeError> {
    let strength = config.background_removal_strength;
    let threshold = if let Some(t) = config.background_removal_threshold {
        t
    } else {
        // Calculate OTSU threshold
        calculate_otsu_threshold(image)
    };

    for (i, pixel) in image.pixels_mut().enumerate() {
        if i < background_mask.len() && background_mask[i] {
            // Apply threshold-based removal with strength control
            let gray_value = (0.299 * pixel.0[0] as f32
                + 0.587 * pixel.0[1] as f32
                + 0.114 * pixel.0[2] as f32) as u8;

            if gray_value < threshold {
                // Fade to white based on strength
                let fade_factor = 1.0 - strength;
                pixel.0[0] = (pixel.0[0] as f32 * fade_factor + 255.0 * strength) as u8;
                pixel.0[1] = (pixel.0[1] as f32 * fade_factor + 255.0 * strength) as u8;
                pixel.0[2] = (pixel.0[2] as f32 * fade_factor + 255.0 * strength) as u8;
            }
        }
    }

    Ok(())
}

/// Apply adaptive background removal
fn apply_adaptive_background_removal(
    image: &mut ImageBuffer<Rgba<u8>, Vec<u8>>,
    background_mask: &[bool],
    config: &TraceLowConfig,
) -> Result<(), VectorizeError> {
    let adaptive_threshold = calculate_adaptive_threshold(image);
    let strength = config.background_removal_strength;

    for (i, pixel) in image.pixels_mut().enumerate() {
        if i < background_mask.len() && background_mask[i] {
            let gray_value = (0.299 * pixel.0[0] as f32
                + 0.587 * pixel.0[1] as f32
                + 0.114 * pixel.0[2] as f32) as u8;

            // Use local adaptive threshold
            let local_threshold = adaptive_threshold.min(200);

            if gray_value < local_threshold {
                // Fade to white based on strength
                let fade_factor = 1.0 - strength;
                pixel.0[0] = (pixel.0[0] as f32 * fade_factor + 255.0 * strength) as u8;
                pixel.0[1] = (pixel.0[1] as f32 * fade_factor + 255.0 * strength) as u8;
                pixel.0[2] = (pixel.0[2] as f32 * fade_factor + 255.0 * strength) as u8;
            }
        }
    }

    Ok(())
}

/// Calculate OTSU threshold for background removal
fn calculate_otsu_threshold(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> u8 {
    // Build histogram
    let mut histogram = [0u32; 256];
    for pixel in image.pixels() {
        let gray = (0.299 * pixel.0[0] as f32
            + 0.587 * pixel.0[1] as f32
            + 0.114 * pixel.0[2] as f32) as usize;
        histogram[gray] += 1;
    }

    let total = image.width() * image.height();
    let mut sum = 0.0;
    for i in 0..256 {
        sum += i as f32 * histogram[i] as f32;
    }

    let mut sum_b = 0.0;
    let mut w_b = 0u32;
    let mut max_variance = 0.0;
    let mut threshold = 0u8;

    for t in 0..256 {
        w_b += histogram[t];
        if w_b == 0 {
            continue;
        }

        let w_f = total - w_b;
        if w_f == 0 {
            break;
        }

        sum_b += t as f32 * histogram[t] as f32;

        let m_b = sum_b / w_b as f32;
        let m_f = (sum - sum_b) / w_f as f32;

        let variance = w_b as f32 * w_f as f32 * (m_b - m_f) * (m_b - m_f);

        if variance > max_variance {
            max_variance = variance;
            threshold = t as u8;
        }
    }

    threshold
}

/// Calculate adaptive threshold based on local image statistics
fn calculate_adaptive_threshold(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> u8 {
    // Simple adaptive threshold based on mean intensity
    let mut sum = 0u64;
    let mut count = 0u32;

    for pixel in image.pixels() {
        let gray = (0.299 * pixel.0[0] as f32
            + 0.587 * pixel.0[1] as f32
            + 0.114 * pixel.0[2] as f32) as u64;
        sum += gray;
        count += 1;
    }

    let mean = (sum / count as u64) as u8;
    // Return threshold slightly below mean
    (mean as f32 * 0.85) as u8
}

/// Calculate image complexity for algorithm selection
fn calculate_image_complexity(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> f32 {
    // Simple complexity metric based on edge density
    let (width, height) = image.dimensions();
    let mut edge_count = 0u32;

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let center = image.get_pixel(x, y);
            let right = image.get_pixel(x + 1, y);
            let bottom = image.get_pixel(x, y + 1);

            // Calculate gradient magnitude
            let dx = (center.0[0] as i32 - right.0[0] as i32).abs()
                + (center.0[1] as i32 - right.0[1] as i32).abs()
                + (center.0[2] as i32 - right.0[2] as i32).abs();

            let dy = (center.0[0] as i32 - bottom.0[0] as i32).abs()
                + (center.0[1] as i32 - bottom.0[1] as i32).abs()
                + (center.0[2] as i32 - bottom.0[2] as i32).abs();

            if dx + dy > 30 {
                edge_count += 1;
            }
        }
    }

    let total_pixels = (width - 2) * (height - 2);
    edge_count as f32 / total_pixels as f32
}

/// Convert grayscale image back to RGBA (for algorithms that need grayscale preprocessing)
///
/// This is a utility function for algorithms that work with grayscale but need
/// to maintain RGBA format for consistency.
pub fn grayscale_to_rgba(gray: &GrayImage) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let (width, height) = gray.dimensions();
    let mut rgba = ImageBuffer::new(width, height);

    for (x, y, gray_pixel) in gray.enumerate_pixels() {
        let value = gray_pixel.0[0];
        rgba.put_pixel(x, y, Rgba([value, value, value, 255]));
    }

    rgba
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preprocessing_preserves_dimensions() {
        let image = ImageBuffer::from_fn(100, 100, |_, _| Rgba([128, 128, 128, 255]));
        let config = TraceLowConfig {
            noise_filtering: true,
            noise_filter_spatial_sigma: 1.5,
            noise_filter_range_sigma: 50.0,
            ..Default::default()
        };

        let processed = apply_preprocessing(&image, &config, "test").unwrap();
        assert_eq!(processed.dimensions(), image.dimensions());
    }

    #[test]
    fn test_noise_filtering_disabled() {
        let image = ImageBuffer::from_fn(50, 50, |x, y| {
            Rgba([(x * 5) as u8, (y * 5) as u8, 128, 255])
        });
        let config = TraceLowConfig {
            noise_filtering: false,
            ..Default::default()
        };

        let processed = apply_preprocessing(&image, &config, "test").unwrap();
        // When disabled, should return identical image
        assert_eq!(processed, image);
    }
}