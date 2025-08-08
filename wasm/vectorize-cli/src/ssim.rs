//! SSIM (Structural Similarity Index) calculation for image quality assessment
//!
//! This module provides SSIM calculation between original and SVG-rendered images
//! to measure visual quality. The target is SSIM ≥ 0.92 as specified in research.

use anyhow::{Context, Result};
use image::{GrayImage, ImageBuffer, Luma, Rgba, RgbaImage};
use std::path::Path;

/// Constants for SSIM calculation
const C1: f64 = 6.5025; // (0.01 * 255.0)^2
const C2: f64 = 58.5225; // (0.03 * 255.0)^2
const WINDOW_SIZE: usize = 11;

/// SSIM calculation result
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub struct SsimResult {
    pub ssim: f64,
    pub luminance: f64,
    pub contrast: f64,
    pub structure: f64,
}

impl SsimResult {
    /// Check if SSIM meets the research target of ≥ 0.92
    pub fn meets_target(&self) -> bool {
        self.ssim >= 0.92
    }

    /// Get quality grade based on SSIM score
    #[allow(dead_code)]
    pub fn quality_grade(&self) -> &'static str {
        match self.ssim {
            x if x >= 0.95 => "Excellent",
            x if x >= 0.92 => "Good (Target Met)",
            x if x >= 0.85 => "Fair",
            x if x >= 0.70 => "Poor", 
            _ => "Very Poor",
        }
    }
}

/// Calculate SSIM between two images
pub fn calculate_ssim(img1: &GrayImage, img2: &GrayImage) -> Result<SsimResult> {
    if img1.dimensions() != img2.dimensions() {
        return Err(anyhow::anyhow!(
            "Images must have the same dimensions. Got {:?} and {:?}",
            img1.dimensions(),
            img2.dimensions()
        ));
    }

    let (width, height) = img1.dimensions();
    if width < WINDOW_SIZE as u32 || height < WINDOW_SIZE as u32 {
        return Err(anyhow::anyhow!(
            "Images too small for SSIM calculation. Minimum {}x{}",
            WINDOW_SIZE,
            WINDOW_SIZE
        ));
    }

    let mut ssim_sum = 0.0;
    let mut luminance_sum = 0.0;
    let mut contrast_sum = 0.0;
    let mut structure_sum = 0.0;
    let mut window_count = 0;

    let half_window = WINDOW_SIZE / 2;

    // Calculate SSIM using sliding window
    for y in half_window..(height as usize - half_window) {
        for x in half_window..(width as usize - half_window) {
            let window1 = extract_window(img1, x, y, WINDOW_SIZE)?;
            let window2 = extract_window(img2, x, y, WINDOW_SIZE)?;

            let stats1 = calculate_window_stats(&window1);
            let stats2 = calculate_window_stats(&window2);
            let covariance = calculate_covariance(&window1, &window2, stats1.mean, stats2.mean);

            // SSIM components
            let luminance = (2.0 * stats1.mean * stats2.mean + C1) / 
                           (stats1.mean.powi(2) + stats2.mean.powi(2) + C1);
                           
            let contrast = (2.0 * stats1.std_dev * stats2.std_dev + C2) / 
                          (stats1.variance + stats2.variance + C2);
                          
            let structure = (covariance + C2/2.0) / 
                           (stats1.std_dev * stats2.std_dev + C2/2.0);

            let ssim = luminance * contrast * structure;

            ssim_sum += ssim;
            luminance_sum += luminance;
            contrast_sum += contrast;
            structure_sum += structure;
            window_count += 1;
        }
    }

    Ok(SsimResult {
        ssim: ssim_sum / window_count as f64,
        luminance: luminance_sum / window_count as f64,
        contrast: contrast_sum / window_count as f64,
        structure: structure_sum / window_count as f64,
    })
}

/// Calculate SSIM between original image and SVG-rendered result
pub fn calculate_svg_ssim(
    original: &RgbaImage,
    svg_content: &str,
) -> Result<SsimResult> {
    // Render SVG to image
    let rendered = render_svg_to_image(svg_content, original.dimensions())?;
    
    // Convert both to grayscale for SSIM calculation
    let gray_original = rgba_to_grayscale(original);
    let gray_rendered = rgba_to_grayscale(&rendered);
    
    calculate_ssim(&gray_original, &gray_rendered)
}

/// Render SVG content to an RGBA image
fn render_svg_to_image(svg_content: &str, dimensions: (u32, u32)) -> Result<RgbaImage> {
    let (width, height) = dimensions;
    
    // Parse SVG
    let options = usvg::Options::default();
    let tree = usvg::Tree::from_str(svg_content, &options)
        .context("Failed to parse SVG")?;

    // Create pixmap for rendering
    let mut pixmap = tiny_skia::Pixmap::new(width, height)
        .context("Failed to create pixmap for SVG rendering")?;

    // Render SVG to pixmap
    resvg::render(
        &tree,
        tiny_skia::Transform::identity(),
        &mut pixmap.as_mut(),
    );

    // Convert pixmap to RgbaImage
    let mut img = RgbaImage::new(width, height);
    for (i, pixel) in pixmap.data().chunks_exact(4).enumerate() {
        let x = i as u32 % width;
        let y = i as u32 / width;
        
        if x < width && y < height {
            img.put_pixel(x, y, Rgba([pixel[2], pixel[1], pixel[0], pixel[3]])); // BGRA to RGBA
        }
    }

    Ok(img)
}

/// Convert RGBA image to grayscale
fn rgba_to_grayscale(img: &RgbaImage) -> GrayImage {
    ImageBuffer::from_fn(img.width(), img.height(), |x, y| {
        let rgba = img.get_pixel(x, y);
        let gray = (0.299 * rgba[0] as f64 + 0.587 * rgba[1] as f64 + 0.114 * rgba[2] as f64) as u8;
        Luma([gray])
    })
}

/// Extract a window from an image at the specified position
fn extract_window(
    img: &GrayImage, 
    center_x: usize, 
    center_y: usize, 
    window_size: usize
) -> Result<Vec<f64>> {
    let half_window = window_size / 2;
    let mut window = Vec::with_capacity(window_size * window_size);

    for dy in 0..window_size {
        for dx in 0..window_size {
            let x = center_x - half_window + dx;
            let y = center_y - half_window + dy;
            
            if let Some(pixel) = img.get_pixel_checked(x as u32, y as u32) {
                window.push(pixel[0] as f64);
            } else {
                return Err(anyhow::anyhow!("Window extends beyond image bounds"));
            }
        }
    }

    Ok(window)
}

/// Window statistics for SSIM calculation
#[derive(Debug)]
struct WindowStats {
    mean: f64,
    variance: f64,
    std_dev: f64,
}

/// Calculate statistics for a window
fn calculate_window_stats(window: &[f64]) -> WindowStats {
    let mean = window.iter().sum::<f64>() / window.len() as f64;
    let variance = window
        .iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>() / window.len() as f64;
    let std_dev = variance.sqrt();

    WindowStats {
        mean,
        variance,
        std_dev,
    }
}

/// Calculate covariance between two windows
fn calculate_covariance(window1: &[f64], window2: &[f64], mean1: f64, mean2: f64) -> f64 {
    window1
        .iter()
        .zip(window2.iter())
        .map(|(&x1, &x2)| (x1 - mean1) * (x2 - mean2))
        .sum::<f64>() / window1.len() as f64
}

/// Save debugging images for SSIM comparison
pub fn save_debug_images(
    original: &RgbaImage,
    svg_content: &str,
    debug_dir: &Path,
    name: &str,
) -> Result<()> {
    std::fs::create_dir_all(debug_dir)?;
    
    // Save original
    let original_path = debug_dir.join(format!("{}_original.png", name));
    original.save(&original_path)?;
    
    // Render and save SVG result
    let rendered = render_svg_to_image(svg_content, original.dimensions())?;
    let rendered_path = debug_dir.join(format!("{}_rendered.png", name));
    rendered.save(&rendered_path)?;
    
    // Save grayscale versions used for SSIM
    let gray_original = rgba_to_grayscale(original);
    let gray_rendered = rgba_to_grayscale(&rendered);
    
    let gray_orig_path = debug_dir.join(format!("{}_gray_original.png", name));
    let gray_rend_path = debug_dir.join(format!("{}_gray_rendered.png", name));
    
    gray_original.save(&gray_orig_path)?;
    gray_rendered.save(&gray_rend_path)?;
    
    log::info!("Debug images saved to {}", debug_dir.display());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Luma, Rgba};

    fn create_test_grayscale_image(width: u32, height: u32, value: u8) -> GrayImage {
        ImageBuffer::from_pixel(width, height, Luma([value]))
    }

    fn create_test_rgba_image(width: u32, height: u32, color: [u8; 4]) -> RgbaImage {
        ImageBuffer::from_pixel(width, height, Rgba(color))
    }

    #[test]
    fn test_ssim_identical_images() {
        let img = create_test_grayscale_image(64, 64, 128);
        let result = calculate_ssim(&img, &img).unwrap();
        
        assert!((result.ssim - 1.0).abs() < 1e-10, "SSIM should be 1.0 for identical images");
        assert!(result.meets_target(), "Identical images should meet SSIM target");
    }

    #[test]
    fn test_ssim_different_images() {
        let img1 = create_test_grayscale_image(64, 64, 100);
        let img2 = create_test_grayscale_image(64, 64, 150);
        let result = calculate_ssim(&img1, &img2).unwrap();
        
        assert!(result.ssim < 1.0, "SSIM should be less than 1.0 for different images");
        assert!(result.ssim > 0.0, "SSIM should be positive");
    }

    #[test]
    fn test_ssim_dimension_mismatch() {
        let img1 = create_test_grayscale_image(64, 64, 128);
        let img2 = create_test_grayscale_image(32, 32, 128);
        
        assert!(calculate_ssim(&img1, &img2).is_err());
    }

    #[test]
    fn test_rgba_to_grayscale() {
        let rgba_img = create_test_rgba_image(32, 32, [255, 0, 0, 255]); // Red
        let gray_img = rgba_to_grayscale(&rgba_img);
        
        // Red should convert to a specific grayscale value
        let expected_gray = (0.299 * 255.0) as u8;
        assert_eq!(gray_img.get_pixel(0, 0)[0], expected_gray);
    }

    #[test]
    fn test_quality_grade() {
        assert_eq!(SsimResult { ssim: 0.96, luminance: 1.0, contrast: 1.0, structure: 1.0 }.quality_grade(), "Excellent");
        assert_eq!(SsimResult { ssim: 0.93, luminance: 1.0, contrast: 1.0, structure: 1.0 }.quality_grade(), "Good (Target Met)");
        assert_eq!(SsimResult { ssim: 0.90, luminance: 1.0, contrast: 1.0, structure: 1.0 }.quality_grade(), "Fair");
        assert_eq!(SsimResult { ssim: 0.75, luminance: 1.0, contrast: 1.0, structure: 1.0 }.quality_grade(), "Poor");
        assert_eq!(SsimResult { ssim: 0.60, luminance: 1.0, contrast: 1.0, structure: 1.0 }.quality_grade(), "Very Poor");
    }
}