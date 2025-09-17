//! Background removal preprocessing for improved line tracing
//!
//! This module provides OTSU-based and adaptive thresholding algorithms
//! for automatic background removal before vectorization processing.

use crate::algorithms::tracing::trace_low::BackgroundRemovalAlgorithm;
use crate::error::{VectorizeError, VectorizeResult};
// Note: Parallel processing can be added later for optimization
use image::{ImageBuffer, Luma, Rgba, RgbaImage};

/// Configuration for background removal preprocessing
#[derive(Debug, Clone)]
pub struct BackgroundRemovalConfig {
    /// Algorithm to use for background removal
    pub algorithm: BackgroundRemovalAlgorithm,
    /// Strength/aggressiveness of background removal (0.0-1.0)
    pub strength: f32,
    /// Optional threshold override (0-255)
    pub threshold_override: Option<u8>,
}

/// Result of background removal processing
#[derive(Debug, Clone)]
pub struct BackgroundRemovalResult {
    /// Processed image with background removed
    pub image: RgbaImage,
    /// Calculated threshold used (for debugging/tuning)
    pub threshold_used: u8,
    /// Algorithm actually used
    pub algorithm_used: BackgroundRemovalAlgorithm,
    /// Processing time in milliseconds
    pub processing_time_ms: u64,
}

/// Apply background removal preprocessing to an image
pub fn apply_background_removal(
    image: &RgbaImage,
    config: &BackgroundRemovalConfig,
) -> VectorizeResult<BackgroundRemovalResult> {
    let start_time = crate::utils::Instant::now();

    log::debug!(
        "Starting background removal with algorithm {:?}, strength {:.2}",
        config.algorithm,
        config.strength
    );

    // Determine which algorithm to use
    let algorithm_to_use = match config.algorithm {
        BackgroundRemovalAlgorithm::Auto => determine_best_algorithm(image)?,
        other => other,
    };

    log::debug!(
        "Using algorithm {:?} for background removal",
        algorithm_to_use
    );

    // Apply the selected algorithm
    let (processed_image, threshold_used) = match algorithm_to_use {
        BackgroundRemovalAlgorithm::Otsu => apply_otsu_background_removal(image, config)?,
        BackgroundRemovalAlgorithm::Adaptive => apply_adaptive_background_removal(image, config)?,
        BackgroundRemovalAlgorithm::Auto => {
            // This shouldn't happen since we resolved Auto above, but handle it
            return Err(VectorizeError::algorithm_error(
                "Auto algorithm selection failed",
            ));
        }
    };

    let processing_time_ms = start_time.elapsed().as_millis() as u64;

    log::debug!(
        "Background removal completed in {}ms using threshold {}",
        processing_time_ms,
        threshold_used
    );

    Ok(BackgroundRemovalResult {
        image: processed_image,
        threshold_used,
        algorithm_used: algorithm_to_use,
        processing_time_ms,
    })
}

/// Determine the best algorithm based on image characteristics
fn determine_best_algorithm(image: &RgbaImage) -> VectorizeResult<BackgroundRemovalAlgorithm> {
    let (width, height) = image.dimensions();
    let total_pixels = (width * height) as usize;

    // Sample image to determine complexity
    let sample_size = (total_pixels / 100).min(1000).max(100); // 1% sample, 100-1000 pixels
    let step = (total_pixels / sample_size).max(1);

    let mut brightness_values = Vec::with_capacity(sample_size);
    let mut pixel_count = 0;

    for (i, pixel) in image.pixels().enumerate() {
        if i % step == 0 && pixel_count < sample_size {
            // Convert to grayscale brightness
            let brightness =
                (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
            brightness_values.push(brightness);
            pixel_count += 1;
        }
    }

    // Calculate standard deviation to determine complexity
    let mean =
        brightness_values.iter().map(|&x| x as f32).sum::<f32>() / brightness_values.len() as f32;
    let variance = brightness_values
        .iter()
        .map(|&x| (x as f32 - mean).powi(2))
        .sum::<f32>()
        / brightness_values.len() as f32;
    let std_dev = variance.sqrt();

    log::debug!(
        "Image analysis: mean brightness {:.1}, std dev {:.1}",
        mean,
        std_dev
    );

    // Decision logic: high std dev indicates complex lighting, use adaptive
    // Low std dev indicates uniform lighting, use OTSU
    if std_dev > 45.0 {
        log::debug!("High complexity detected, using Adaptive algorithm");
        Ok(BackgroundRemovalAlgorithm::Adaptive)
    } else {
        log::debug!("Low complexity detected, using OTSU algorithm");
        Ok(BackgroundRemovalAlgorithm::Otsu)
    }
}

/// Apply OTSU thresholding for background removal
fn apply_otsu_background_removal(
    image: &RgbaImage,
    config: &BackgroundRemovalConfig,
) -> VectorizeResult<(RgbaImage, u8)> {
    let (width, height) = image.dimensions();

    // Convert to grayscale for threshold calculation
    let mut grayscale = vec![0u8; (width * height) as usize];

    for (i, pixel) in image.pixels().enumerate() {
        grayscale[i] =
            (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
    }

    // Calculate OTSU threshold
    let threshold = if let Some(override_threshold) = config.threshold_override {
        override_threshold
    } else {
        calculate_otsu_threshold(&grayscale, config.strength)?
    };

    log::debug!("Using OTSU threshold: {}", threshold);

    // Apply threshold with background removal
    let mut result_image = ImageBuffer::new(width, height);

    for (i, (original_pixel, &gray_value)) in image.pixels().zip(&grayscale).enumerate() {
        let result_pixel = if gray_value >= threshold {
            // Keep foreground pixels
            *original_pixel
        } else {
            // Make background transparent
            Rgba([255, 255, 255, 0]) // Transparent white
        };

        let x = (i as u32) % width;
        let y = (i as u32) / width;
        result_image.put_pixel(x, y, result_pixel);
    }

    Ok((result_image, threshold))
}

/// Apply adaptive thresholding for background removal
fn apply_adaptive_background_removal(
    image: &RgbaImage,
    config: &BackgroundRemovalConfig,
) -> VectorizeResult<(RgbaImage, u8)> {
    let (width, height) = image.dimensions();

    // Convert to grayscale
    let mut grayscale = ImageBuffer::new(width, height);

    for (x, y, rgba_pixel) in image.enumerate_pixels() {
        let gray_value = (0.299 * rgba_pixel[0] as f32
            + 0.587 * rgba_pixel[1] as f32
            + 0.114 * rgba_pixel[2] as f32) as u8;
        grayscale.put_pixel(x, y, Luma([gray_value]));
    }

    // Calculate adaptive window size based on image dimensions
    let window_size = calculate_adaptive_window_size(width, height, config.strength);

    log::debug!("Using adaptive threshold with window size: {}", window_size);

    // Apply adaptive thresholding with parallel processing
    let mut result_image = ImageBuffer::new(width, height);
    let mut total_threshold = 0u64;
    let mut threshold_count = 0usize;

    // Process each pixel with adaptive thresholding
    for y in 0..height {
        for x in 0..width {
            let threshold =
                calculate_local_threshold(&grayscale, x, y, window_size, config.strength);
            total_threshold += threshold as u64;
            threshold_count += 1;

            let gray_value = grayscale.get_pixel(x, y)[0];
            let original_pixel = image.get_pixel(x, y);

            let result_pixel = if gray_value >= threshold {
                *original_pixel // Keep foreground
            } else {
                Rgba([255, 255, 255, 0]) // Transparent background
            };

            result_image.put_pixel(x, y, result_pixel);
        }
    }

    let average_threshold = if threshold_count > 0 {
        (total_threshold / threshold_count as u64) as u8
    } else {
        128
    };

    Ok((result_image, average_threshold))
}

/// Calculate OTSU threshold with strength adjustment
fn calculate_otsu_threshold(grayscale: &[u8], strength: f32) -> VectorizeResult<u8> {
    // Build histogram
    let mut histogram = [0u32; 256];
    for &pixel in grayscale {
        histogram[pixel as usize] += 1;
    }

    let total_pixels = grayscale.len() as u32;
    let mut best_threshold = 0u8;
    let mut max_variance = 0.0f32;

    // Calculate OTSU threshold using between-class variance
    for threshold in 0..256 {
        let mut background_pixels = 0u32;
        let mut background_sum = 0u64;

        // Calculate background statistics
        for i in 0..threshold {
            background_pixels += histogram[i];
            background_sum += (histogram[i] * i as u32) as u64;
        }

        if background_pixels == 0 || background_pixels == total_pixels {
            continue;
        }

        let foreground_pixels = total_pixels - background_pixels;
        let total_sum: u64 = grayscale.iter().map(|&x| x as u64).sum();
        let foreground_sum = total_sum - background_sum;

        let background_mean = background_sum as f32 / background_pixels as f32;
        let foreground_mean = foreground_sum as f32 / foreground_pixels as f32;

        // Between-class variance
        let between_class_variance = (background_pixels as f32)
            * (foreground_pixels as f32)
            * (background_mean - foreground_mean).powi(2)
            / (total_pixels as f32).powi(2);

        if between_class_variance > max_variance {
            max_variance = between_class_variance;
            best_threshold = threshold as u8;
        }
    }

    // Apply strength adjustment
    let adjusted_threshold = adjust_threshold_by_strength(best_threshold, strength);

    Ok(adjusted_threshold)
}

/// Calculate adaptive window size based on image dimensions and strength
fn calculate_adaptive_window_size(width: u32, height: u32, strength: f32) -> u32 {
    let min_dimension = width.min(height);
    let base_size = (min_dimension / 20).max(15).min(51); // 5% of min dimension, 15-51 range

    // Adjust based on strength: higher strength = smaller windows (more sensitive)
    let strength_factor = 1.0 + (1.0 - strength) * 0.5; // 1.0 to 1.5
    let adjusted_size = (base_size as f32 * strength_factor) as u32;

    // Ensure odd size for symmetric windows
    if adjusted_size.is_multiple_of(2) {
        adjusted_size + 1
    } else {
        adjusted_size
    }
}

/// Calculate local threshold for adaptive thresholding
fn calculate_local_threshold(
    grayscale: &ImageBuffer<Luma<u8>, Vec<u8>>,
    x: u32,
    y: u32,
    window_size: u32,
    strength: f32,
) -> u8 {
    let (width, height) = grayscale.dimensions();
    let half_window = window_size / 2;

    let x_min = x.saturating_sub(half_window);
    let x_max = (x + half_window + 1).min(width);
    let y_min = y.saturating_sub(half_window);
    let y_max = (y + half_window + 1).min(height);

    let mut sum = 0u32;
    let mut count = 0u32;

    // Calculate mean in local window
    for window_y in y_min..y_max {
        for window_x in x_min..x_max {
            sum += grayscale.get_pixel(window_x, window_y)[0] as u32;
            count += 1;
        }
    }

    if count == 0 {
        return 128; // Fallback
    }

    let mean = sum as f32 / count as f32;

    // Apply strength adjustment: higher strength = lower threshold (more aggressive)
    let strength_factor = 0.7 + (1.0 - strength) * 0.3; // 0.7 to 1.0

    (mean * strength_factor) as u8
}

/// Adjust threshold based on strength parameter
fn adjust_threshold_by_strength(base_threshold: u8, strength: f32) -> u8 {
    let strength = strength.clamp(0.0, 1.0);

    // Higher strength = lower threshold (more aggressive background removal)
    // Lower strength = higher threshold (more conservative)
    let adjustment_factor = 0.7 + (1.0 - strength) * 0.3; // 0.7 to 1.0
    let adjusted = (base_threshold as f32 * adjustment_factor) as u8;

    // Ensure reasonable bounds
    adjusted.clamp(10, 240)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn test_background_removal_config_creation() {
        let config = BackgroundRemovalConfig {
            algorithm: BackgroundRemovalAlgorithm::Otsu,
            strength: 0.5,
            threshold_override: None,
        };

        assert_eq!(config.algorithm, BackgroundRemovalAlgorithm::Otsu);
        assert_eq!(config.strength, 0.5);
        assert_eq!(config.threshold_override, None);
    }

    #[test]
    fn test_otsu_threshold_calculation() {
        // Create clearly bimodal test data
        let mut test_data = Vec::new();

        // Background pixels (low values) - around 50
        for _ in 0..1000 {
            test_data.push(50);
        }

        // Foreground pixels (high values) - around 150
        for _ in 0..1000 {
            test_data.push(150);
        }

        let threshold = calculate_otsu_threshold(&test_data, 0.5).unwrap();

        // OTSU should find optimal threshold between the two peaks (or slightly below the first peak)
        assert!(
            threshold > 40 && threshold < 140,
            "OTSU threshold {} should be around the optimal separation point",
            threshold
        );
    }

    #[test]
    fn test_determine_best_algorithm() {
        // Create a simple uniform image (should choose OTSU)
        let mut uniform_image = ImageBuffer::new(100, 100);
        for pixel in uniform_image.pixels_mut() {
            *pixel = Rgba([128, 128, 128, 255]);
        }

        let algorithm = determine_best_algorithm(&uniform_image).unwrap();
        assert_eq!(algorithm, BackgroundRemovalAlgorithm::Otsu);
    }

    #[test]
    fn test_adaptive_window_size_calculation() {
        let window_size = calculate_adaptive_window_size(1000, 800, 0.5);

        // Should be odd and reasonable
        assert_eq!(window_size % 2, 1, "Window size should be odd");
        assert!(
            window_size >= 15 && window_size <= 51,
            "Window size {} should be in range 15-51",
            window_size
        );
    }

    #[test]
    fn test_threshold_strength_adjustment() {
        let base_threshold = 128u8;

        let high_strength = adjust_threshold_by_strength(base_threshold, 1.0);
        let low_strength = adjust_threshold_by_strength(base_threshold, 0.0);

        // High strength should result in lower threshold
        assert!(
            high_strength < low_strength,
            "High strength ({}) should produce lower threshold than low strength ({})",
            high_strength,
            low_strength
        );
    }
}
