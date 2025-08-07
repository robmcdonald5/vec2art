//! External algorithm integrations
//!
//! This module provides integration with external C libraries for
//! high-quality vectorization:
//! - Potrace: Industry standard for bi-level image tracing
//! - Autotrace: Excellent for centerline tracing of line art

pub mod potrace;
pub mod autotrace;

pub use potrace::{PotraceVectorizer, is_potrace_available};
pub use autotrace::{AutotraceVectorizer, is_autotrace_available};

use crate::error::{Result, Vec2ArtError};
use crate::algorithms::SvgPath;
use crate::ConversionParameters;
use image::{DynamicImage, GenericImageView};

/// Unified external algorithm interface
pub struct ExternalAlgorithms {
    potrace: PotraceVectorizer,
    autotrace_outline: AutotraceVectorizer,
    autotrace_centerline: AutotraceVectorizer,
}

impl ExternalAlgorithms {
    pub fn new() -> Self {
        ExternalAlgorithms {
            potrace: PotraceVectorizer::new(),
            autotrace_outline: AutotraceVectorizer::new(false),
            autotrace_centerline: AutotraceVectorizer::new(true),
        }
    }
    
    /// Convert using Potrace (best for bi-level images)
    pub fn convert_with_potrace(&self, image: DynamicImage, params: ConversionParameters) -> Result<Vec<SvgPath>> {
        self.potrace.vectorize(image, params)
    }
    
    /// Convert using Autotrace in outline mode (best for solid shapes)
    pub fn convert_with_autotrace_outline(&self, image: DynamicImage, params: ConversionParameters) -> Result<Vec<SvgPath>> {
        self.autotrace_outline.vectorize(image, params)
    }
    
    /// Convert using Autotrace in centerline mode (best for line art)
    pub fn convert_with_autotrace_centerline(&self, image: DynamicImage, params: ConversionParameters) -> Result<Vec<SvgPath>> {
        self.autotrace_centerline.vectorize(image, params)
    }
    
    /// Automatically select the best external algorithm for an image
    pub fn convert_auto(&self, image: DynamicImage, params: ConversionParameters) -> Result<Vec<SvgPath>> {
        let analysis = self.analyze_image(&image);
        
        // Decision logic based on image characteristics
        if analysis.is_bilevel && is_potrace_available() {
            log::info!("Using Potrace for bi-level image");
            self.convert_with_potrace(image, params)
        } else if analysis.has_thin_lines && is_autotrace_available() {
            log::info!("Using Autotrace (centerline) for line art");
            self.convert_with_autotrace_centerline(image, params)
        } else if is_autotrace_available() {
            log::info!("Using Autotrace (outline) for general image");
            self.convert_with_autotrace_outline(image, params)
        } else {
            Err(Vec2ArtError::InvalidParameters(
                "No suitable external algorithm available".to_string()
            ))
        }
    }
    
    /// Analyze image characteristics for algorithm selection
    fn analyze_image(&self, image: &DynamicImage) -> ImageAnalysis {
        let (width, height) = image.dimensions();
        let rgb = image.to_rgb8();
        
        let mut color_count = std::collections::HashSet::new();
        let mut edge_pixels = 0;
        let mut total_pixels = width * height;
        
        // Sample pixels for analysis (for performance on large images)
        let sample_rate = if total_pixels > 100_000 { 4 } else { 1 };
        
        for y in (0..height).step_by(sample_rate as usize) {
            for x in (0..width).step_by(sample_rate as usize) {
                let pixel = rgb.get_pixel(x, y);
                color_count.insert((pixel[0], pixel[1], pixel[2]));
                
                // Simple edge detection
                if x > 0 && y > 0 {
                    let prev_pixel = rgb.get_pixel(x-1, y-1);
                    let diff = ((pixel[0] as i32 - prev_pixel[0] as i32).abs() +
                               (pixel[1] as i32 - prev_pixel[1] as i32).abs() +
                               (pixel[2] as i32 - prev_pixel[2] as i32).abs()) as u32;
                    if diff > 100 {
                        edge_pixels += 1;
                    }
                }
            }
        }
        
        let sampled_pixels = (width / sample_rate) * (height / sample_rate);
        let edge_density = edge_pixels as f32 / sampled_pixels as f32;
        
        ImageAnalysis {
            width,
            height,
            pixels: total_pixels,
            color_count: color_count.len(),
            is_bilevel: color_count.len() <= 2,
            is_grayscale: color_count.iter().all(|(r, g, b)| r == g && g == b),
            edge_density,
            has_thin_lines: edge_density > 0.1 && edge_density < 0.3,
            has_solid_regions: edge_density < 0.1,
            is_photographic: color_count.len() > 1000,
        }
    }
}

impl Default for ExternalAlgorithms {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone)]
struct ImageAnalysis {
    width: u32,
    height: u32,
    pixels: u32,
    color_count: usize,
    is_bilevel: bool,
    is_grayscale: bool,
    edge_density: f32,
    has_thin_lines: bool,
    has_solid_regions: bool,
    is_photographic: bool,
}

/// Get information about available external algorithms
pub fn get_external_algorithm_info() -> ExternalAlgorithmInfo {
    ExternalAlgorithmInfo {
        potrace_available: is_potrace_available(),
        autotrace_available: is_autotrace_available(),
    }
}

#[derive(Debug, Clone)]
pub struct ExternalAlgorithmInfo {
    pub potrace_available: bool,
    pub autotrace_available: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgb};
    
    #[test]
    fn test_external_algorithms_creation() {
        let algorithms = ExternalAlgorithms::new();
        // Should create without panicking
    }
    
    #[test]
    fn test_algorithm_info() {
        let info = get_external_algorithm_info();
        println!("Potrace available: {}", info.potrace_available);
        println!("Autotrace available: {}", info.autotrace_available);
    }
    
    #[test]
    fn test_image_analysis() {
        let algorithms = ExternalAlgorithms::new();
        
        // Create a simple bi-level test image
        let image = ImageBuffer::from_fn(100, 100, |x, y| {
            if x < 50 { Rgb([0, 0, 0]) } else { Rgb([255, 255, 255]) }
        });
        let dynamic_image = DynamicImage::ImageRgb8(image);
        
        let analysis = algorithms.analyze_image(&dynamic_image);
        assert_eq!(analysis.width, 100);
        assert_eq!(analysis.height, 100);
        assert_eq!(analysis.color_count, 2);
        assert!(analysis.is_bilevel);
        assert!(analysis.is_grayscale);
    }
}