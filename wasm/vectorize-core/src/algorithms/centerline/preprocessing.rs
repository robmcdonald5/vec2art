//! Preprocessing strategies for centerline extraction

use super::PreprocessingStrategy;
use crate::error::VectorizeError;
use crate::TraceLowConfig;
use image::{GrayImage, Luma};

/// Standard morphological preprocessing (current implementation)
#[derive(Debug, Default)]
pub struct MorphologicalPreprocessing {
    pub use_closing: bool,
}

impl MorphologicalPreprocessing {
    pub fn new(use_closing: bool) -> Self {
        Self { use_closing }
    }
}

impl PreprocessingStrategy for MorphologicalPreprocessing {
    fn preprocess(
        &self,
        binary: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        if !config.noise_filtering {
            return Ok(binary.clone());
        }

        if self.use_closing {
            Ok(morphological_closing_3x3(binary))
        } else {
            Ok(morphological_open_close(binary))
        }
    }

    fn name(&self) -> &'static str {
        "Morphological"
    }
}

/// Advanced preprocessing with multi-scale operations (research recommended)
#[derive(Debug, Default)]
pub struct AdvancedPreprocessing {
    pub gaussian_sigma: f32,
    pub bilateral_spatial_sigma: f32,
    pub bilateral_intensity_sigma: f32,
}

impl AdvancedPreprocessing {
    pub fn new(
        gaussian_sigma: f32,
        bilateral_spatial_sigma: f32,
        bilateral_intensity_sigma: f32,
    ) -> Self {
        Self {
            gaussian_sigma,
            bilateral_spatial_sigma,
            bilateral_intensity_sigma,
        }
    }
}

impl PreprocessingStrategy for AdvancedPreprocessing {
    fn preprocess(
        &self,
        binary: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        if !config.noise_filtering {
            return Ok(binary.clone());
        }

        // Multi-stage preprocessing pipeline
        let smoothed = if self.gaussian_sigma > 0.0 {
            gaussian_blur(binary, self.gaussian_sigma)
        } else {
            binary.clone()
        };

        let edge_preserved = if self.bilateral_spatial_sigma > 0.0 {
            bilateral_filter(
                &smoothed,
                self.bilateral_spatial_sigma,
                self.bilateral_intensity_sigma,
            )
        } else {
            smoothed
        };

        let morphological = morphological_open_close(&edge_preserved);

        Ok(morphological)
    }

    fn name(&self) -> &'static str {
        "Advanced"
    }
}

/// Edge-preserving preprocessing using bilateral filtering
#[derive(Debug, Default)]
pub struct EdgePreservingPreprocessing {
    pub spatial_sigma: f32,
    pub intensity_sigma: f32,
}

impl EdgePreservingPreprocessing {
    pub fn new(spatial_sigma: f32, intensity_sigma: f32) -> Self {
        Self {
            spatial_sigma,
            intensity_sigma,
        }
    }
}

impl PreprocessingStrategy for EdgePreservingPreprocessing {
    fn preprocess(
        &self,
        binary: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        if !config.noise_filtering {
            return Ok(binary.clone());
        }

        let spatial_sigma = if self.spatial_sigma > 0.0 {
            self.spatial_sigma
        } else {
            1.5
        };
        let intensity_sigma = if self.intensity_sigma > 0.0 {
            self.intensity_sigma
        } else {
            25.0
        };

        let filtered = bilateral_filter(binary, spatial_sigma, intensity_sigma);
        let morphological = morphological_closing_3x3(&filtered);

        Ok(morphological)
    }

    fn name(&self) -> &'static str {
        "EdgePreserving"
    }
}

/// Minimal preprocessing (just basic morphology)
#[derive(Debug, Default)]
pub struct MinimalPreprocessing;

impl PreprocessingStrategy for MinimalPreprocessing {
    fn preprocess(
        &self,
        binary: &GrayImage,
        config: &TraceLowConfig,
    ) -> Result<GrayImage, VectorizeError> {
        if !config.noise_filtering {
            return Ok(binary.clone());
        }

        Ok(morphological_closing_3x3(binary))
    }

    fn name(&self) -> &'static str {
        "Minimal"
    }
}

// Implementation functions

fn morphological_open_close(binary: &GrayImage) -> GrayImage {
    let opened = morphological_opening_3x3(binary);
    morphological_closing_3x3(&opened)
}

fn morphological_opening_3x3(binary: &GrayImage) -> GrayImage {
    let eroded = morphological_erosion_3x3(binary);
    morphological_dilation_3x3(&eroded)
}

fn morphological_closing_3x3(binary: &GrayImage) -> GrayImage {
    let dilated = morphological_dilation_3x3(binary);
    morphological_erosion_3x3(&dilated)
}

fn morphological_erosion_3x3(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut result = GrayImage::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let mut min_val = 255u8;

            for dy in -1..=1 {
                for dx in -1..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;

                    let val = if nx >= 0 && ny >= 0 && (nx as u32) < width && (ny as u32) < height {
                        binary.get_pixel(nx as u32, ny as u32).0[0]
                    } else {
                        0 // Background for border pixels
                    };

                    min_val = min_val.min(val);
                }
            }

            result.put_pixel(x, y, Luma([min_val]));
        }
    }

    result
}

fn morphological_dilation_3x3(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut result = GrayImage::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let mut max_val = 0u8;

            for dy in -1..=1 {
                for dx in -1..=1 {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;

                    let val = if nx >= 0 && ny >= 0 && (nx as u32) < width && (ny as u32) < height {
                        binary.get_pixel(nx as u32, ny as u32).0[0]
                    } else {
                        0 // Background for border pixels
                    };

                    max_val = max_val.max(val);
                }
            }

            result.put_pixel(x, y, Luma([max_val]));
        }
    }

    result
}

fn gaussian_blur(image: &GrayImage, sigma: f32) -> GrayImage {
    if sigma <= 0.0 {
        return image.clone();
    }

    let (width, height) = image.dimensions();
    let mut result = GrayImage::new(width, height);

    // Calculate kernel size (should be odd and cover ~3 standard deviations)
    let kernel_size = (6.0 * sigma).ceil() as i32 | 1; // Ensure odd
    let kernel_radius = kernel_size / 2;

    // Generate Gaussian kernel
    let mut kernel = vec![0.0f32; kernel_size as usize];
    let mut kernel_sum = 0.0f32;

    for i in 0..kernel_size {
        let x = i - kernel_radius;
        let val = (-0.5 * (x as f32 / sigma).powi(2)).exp();
        kernel[i as usize] = val;
        kernel_sum += val;
    }

    // Normalize kernel
    for val in &mut kernel {
        *val /= kernel_sum;
    }

    // Horizontal pass
    let mut temp = GrayImage::new(width, height);
    for y in 0..height {
        for x in 0..width {
            let mut sum = 0.0f32;
            let mut weight_sum = 0.0f32;

            for i in 0..kernel_size {
                let nx = x as i32 + i - kernel_radius;
                if nx >= 0 && (nx as u32) < width {
                    sum += image.get_pixel(nx as u32, y).0[0] as f32 * kernel[i as usize];
                    weight_sum += kernel[i as usize];
                }
            }

            let pixel_val = if weight_sum > 0.0 {
                (sum / weight_sum).round() as u8
            } else {
                image.get_pixel(x, y).0[0]
            };
            temp.put_pixel(x, y, Luma([pixel_val]));
        }
    }

    // Vertical pass
    for y in 0..height {
        for x in 0..width {
            let mut sum = 0.0f32;
            let mut weight_sum = 0.0f32;

            for i in 0..kernel_size {
                let ny = y as i32 + i - kernel_radius;
                if ny >= 0 && (ny as u32) < height {
                    sum += temp.get_pixel(x, ny as u32).0[0] as f32 * kernel[i as usize];
                    weight_sum += kernel[i as usize];
                }
            }

            let pixel_val = if weight_sum > 0.0 {
                (sum / weight_sum).round() as u8
            } else {
                temp.get_pixel(x, y).0[0]
            };
            result.put_pixel(x, y, Luma([pixel_val]));
        }
    }

    result
}

fn bilateral_filter(image: &GrayImage, spatial_sigma: f32, intensity_sigma: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut result = GrayImage::new(width, height);

    // Calculate kernel size for spatial filtering
    let kernel_radius = (3.0 * spatial_sigma).ceil() as i32;

    for y in 0..height {
        for x in 0..width {
            let center_intensity = image.get_pixel(x, y).0[0] as f32;
            let mut sum = 0.0f32;
            let mut weight_sum = 0.0f32;

            for dy in -kernel_radius..=kernel_radius {
                for dx in -kernel_radius..=kernel_radius {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;

                    if nx >= 0 && ny >= 0 && (nx as u32) < width && (ny as u32) < height {
                        let neighbor_intensity = image.get_pixel(nx as u32, ny as u32).0[0] as f32;

                        // Spatial weight (Gaussian based on distance)
                        let spatial_dist = (dx * dx + dy * dy) as f32;
                        let spatial_weight =
                            (-spatial_dist / (2.0 * spatial_sigma * spatial_sigma)).exp();

                        // Intensity weight (Gaussian based on intensity difference)
                        let intensity_diff = (center_intensity - neighbor_intensity).abs();
                        let intensity_weight = (-intensity_diff * intensity_diff
                            / (2.0 * intensity_sigma * intensity_sigma))
                            .exp();

                        let total_weight = spatial_weight * intensity_weight;
                        sum += neighbor_intensity * total_weight;
                        weight_sum += total_weight;
                    }
                }
            }

            let pixel_val = if weight_sum > 0.0 {
                (sum / weight_sum).round() as u8
            } else {
                center_intensity as u8
            };
            result.put_pixel(x, y, Luma([pixel_val]));
        }
    }

    result
}
