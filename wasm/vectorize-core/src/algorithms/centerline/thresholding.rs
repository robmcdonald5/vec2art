//! Thresholding strategies for centerline extraction

use super::ThresholdingStrategy;
use crate::error::VectorizeError;
use crate::TraceLowConfig;
use image::{GrayImage, Luma};

/// Sauvola adaptive thresholding (high quality)
#[derive(Debug, Default)]
pub struct SauvolaThresholding {
    pub window_size: u32,
    pub k: f32,
}

impl SauvolaThresholding {
    pub fn new(window_size: u32, k: f32) -> Self {
        Self { window_size, k }
    }
}

impl ThresholdingStrategy for SauvolaThresholding {
    fn threshold(
        &self,
        gray: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        let window_size = if self.window_size > 0 {
            self.window_size
        } else {
            config.adaptive_threshold_window_size
        };
        let k = if self.k > 0.0 {
            self.k
        } else {
            config.adaptive_threshold_k
        };

        Ok(box_sauvola_threshold(gray, window_size, k))
    }

    fn name(&self) -> &'static str {
        "Sauvola"
    }
}

/// Bradley-Roth adaptive thresholding (high performance)
#[derive(Debug, Default)]
pub struct BradleyRothThresholding {
    pub window_size: u32,
    pub threshold_ratio: f32,
}

impl BradleyRothThresholding {
    pub fn new(window_size: u32, threshold_ratio: f32) -> Self {
        Self {
            window_size,
            threshold_ratio,
        }
    }
}

impl ThresholdingStrategy for BradleyRothThresholding {
    fn threshold(
        &self,
        gray: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        let window_size = if self.window_size > 0 {
            self.window_size
        } else {
            config.adaptive_threshold_window_size
        };
        let ratio = if self.threshold_ratio > 0.0 {
            self.threshold_ratio
        } else {
            0.15 // Good default for Bradley-Roth
        };

        Ok(bradley_roth_threshold(gray, window_size, ratio))
    }

    fn name(&self) -> &'static str {
        "BradleyRoth"
    }
}

/// Otsu global thresholding (fallback)
#[derive(Debug, Default)]
pub struct OtsuThresholding;

impl ThresholdingStrategy for OtsuThresholding {
    fn threshold(
        &self,
        gray: &GrayImage,
        _config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        Ok(otsu_threshold(gray))
    }

    fn name(&self) -> &'static str {
        "Otsu"
    }
}

/// Niblack adaptive thresholding (research baseline)
#[derive(Debug, Default)]
pub struct NiblackThresholding {
    pub window_size: u32,
    pub k: f32,
}

impl ThresholdingStrategy for NiblackThresholding {
    fn threshold(
        &self,
        gray: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        let window_size = if self.window_size > 0 {
            self.window_size
        } else {
            config.adaptive_threshold_window_size
        };
        let k = if self.k > 0.0 {
            self.k
        } else {
            -0.2 // Standard Niblack k value
        };

        Ok(niblack_threshold(gray, window_size, k))
    }

    fn name(&self) -> &'static str {
        "Niblack"
    }
}

// Implementation functions (will be moved/adapted from trace_low.rs)

fn box_sauvola_threshold(gray: &GrayImage, window_size: u32, k: f32) -> GrayImage {
    let (width, height) = gray.dimensions();
    let mut binary = GrayImage::new(width, height);

    // Ensure window size is odd and at least 3
    let window_size = if window_size % 2 == 0 {
        window_size + 1
    } else {
        window_size
    };
    let window_size = window_size.max(3);
    let half_window = window_size as i32 / 2;

    for y in 0..height {
        for x in 0..width {
            let mut sum = 0.0f64;
            let mut sum_sq = 0.0f64;
            let mut count = 0u32;

            // Calculate mean and variance in window
            let y_start = (y as i32 - half_window).max(0) as u32;
            let y_end = (y as i32 + half_window).min(height as i32 - 1) as u32;
            let x_start = (x as i32 - half_window).max(0) as u32;
            let x_end = (x as i32 + half_window).min(width as i32 - 1) as u32;

            for wy in y_start..=y_end {
                for wx in x_start..=x_end {
                    let pixel_val = gray.get_pixel(wx, wy).0[0] as f64;
                    sum += pixel_val;
                    sum_sq += pixel_val * pixel_val;
                    count += 1;
                }
            }

            let mean = sum / count as f64;
            let variance = (sum_sq / count as f64) - (mean * mean);
            let std_dev = variance.sqrt();

            // Sauvola threshold formula
            let threshold = mean * (1.0 + k as f64 * (std_dev / 128.0 - 1.0));
            let pixel_val = gray.get_pixel(x, y).0[0] as f64;

            let binary_val = if pixel_val > threshold { 255 } else { 0 };
            binary.put_pixel(x, y, Luma([binary_val]));
        }
    }

    binary
}

fn bradley_roth_threshold(gray: &GrayImage, window_size: u32, threshold_ratio: f32) -> GrayImage {
    let (width, height) = gray.dimensions();
    let mut binary = GrayImage::new(width, height);

    // Bradley-Roth uses integral images for efficiency
    let integral_image = compute_integral_image(gray);

    let half_window = window_size as i32 / 2;

    for y in 0..height {
        for x in 0..width {
            let y_start = (y as i32 - half_window).max(0) as u32;
            let y_end = (y as i32 + half_window).min(height as i32 - 1) as u32;
            let x_start = (x as i32 - half_window).max(0) as u32;
            let x_end = (x as i32 + half_window).min(width as i32 - 1) as u32;

            let area = ((x_end - x_start + 1) * (y_end - y_start + 1)) as f64;
            let sum = get_integral_sum(&integral_image, x_start, y_start, x_end, y_end);
            let mean = sum / area;

            let threshold = mean * (1.0 - threshold_ratio as f64);
            let pixel_val = gray.get_pixel(x, y).0[0] as f64;

            let binary_val = if pixel_val > threshold { 255 } else { 0 };
            binary.put_pixel(x, y, Luma([binary_val]));
        }
    }

    binary
}

fn niblack_threshold(gray: &GrayImage, window_size: u32, k: f32) -> GrayImage {
    let (width, height) = gray.dimensions();
    let mut binary = GrayImage::new(width, height);

    let half_window = window_size as i32 / 2;

    for y in 0..height {
        for x in 0..width {
            let mut sum = 0.0f64;
            let mut sum_sq = 0.0f64;
            let mut count = 0u32;

            // Calculate mean and variance in window
            let y_start = (y as i32 - half_window).max(0) as u32;
            let y_end = (y as i32 + half_window).min(height as i32 - 1) as u32;
            let x_start = (x as i32 - half_window).max(0) as u32;
            let x_end = (x as i32 + half_window).min(width as i32 - 1) as u32;

            for wy in y_start..=y_end {
                for wx in x_start..=x_end {
                    let pixel_val = gray.get_pixel(wx, wy).0[0] as f64;
                    sum += pixel_val;
                    sum_sq += pixel_val * pixel_val;
                    count += 1;
                }
            }

            let mean = sum / count as f64;
            let variance = (sum_sq / count as f64) - (mean * mean);
            let std_dev = variance.sqrt();

            // Niblack threshold formula
            let threshold = mean + k as f64 * std_dev;
            let pixel_val = gray.get_pixel(x, y).0[0] as f64;

            let binary_val = if pixel_val > threshold { 255 } else { 0 };
            binary.put_pixel(x, y, Luma([binary_val]));
        }
    }

    binary
}

fn otsu_threshold(gray: &GrayImage) -> GrayImage {
    // Calculate histogram
    let mut histogram = [0u32; 256];
    for pixel in gray.pixels() {
        histogram[pixel.0[0] as usize] += 1;
    }

    let total_pixels = gray.width() * gray.height();

    // Find optimal threshold using Otsu's method
    let mut max_variance = 0.0f64;
    let mut optimal_threshold = 0u8;

    for threshold in 1..255 {
        let (weight_bg, mean_bg) = calculate_class_stats(&histogram, 0, threshold);
        let (weight_fg, mean_fg) = calculate_class_stats(&histogram, threshold, 255);

        if weight_bg == 0.0 || weight_fg == 0.0 {
            continue;
        }

        let between_class_variance = weight_bg * weight_fg * (mean_bg - mean_fg).powi(2);

        if between_class_variance > max_variance {
            max_variance = between_class_variance;
            optimal_threshold = threshold;
        }
    }

    // Apply threshold
    let (width, height) = gray.dimensions();
    let mut binary = GrayImage::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let pixel_val = gray.get_pixel(x, y).0[0];
            let binary_val = if pixel_val > optimal_threshold {
                255
            } else {
                0
            };
            binary.put_pixel(x, y, Luma([binary_val]));
        }
    }

    binary
}

fn calculate_class_stats(histogram: &[u32; 256], start: u8, end: u8) -> (f64, f64) {
    let mut weight = 0u32;
    let mut sum = 0u32;

    for i in start..end {
        weight += histogram[i as usize];
        sum += histogram[i as usize] * i as u32;
    }

    if weight == 0 {
        (0.0, 0.0)
    } else {
        let mean = sum as f64 / weight as f64;
        (weight as f64, mean)
    }
}

fn compute_integral_image(gray: &GrayImage) -> Vec<Vec<u64>> {
    let (width, height) = gray.dimensions();
    let mut integral = vec![vec![0u64; width as usize]; height as usize];

    for y in 0..height {
        for x in 0..width {
            let pixel_val = gray.get_pixel(x, y).0[0] as u64;

            let left = if x > 0 {
                integral[y as usize][(x - 1) as usize]
            } else {
                0
            };
            let top = if y > 0 {
                integral[(y - 1) as usize][x as usize]
            } else {
                0
            };
            let top_left = if x > 0 && y > 0 {
                integral[(y - 1) as usize][(x - 1) as usize]
            } else {
                0
            };

            integral[y as usize][x as usize] = pixel_val + left + top - top_left;
        }
    }

    integral
}

fn get_integral_sum(integral: &[Vec<u64>], x1: u32, y1: u32, x2: u32, y2: u32) -> f64 {
    let bottom_right = integral[y2 as usize][x2 as usize];
    let top_left = if x1 > 0 && y1 > 0 {
        integral[(y1 - 1) as usize][(x1 - 1) as usize]
    } else {
        0
    };
    let top_right = if y1 > 0 {
        integral[(y1 - 1) as usize][x2 as usize]
    } else {
        0
    };
    let bottom_left = if x1 > 0 {
        integral[y2 as usize][(x1 - 1) as usize]
    } else {
        0
    };

    (bottom_right + top_left - top_right - bottom_left) as f64
}
