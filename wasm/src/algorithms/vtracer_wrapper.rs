use crate::algorithms::ConversionAlgorithm;
use crate::error::{Result, Vec2ArtError};
use crate::ConversionParameters;
use image::DynamicImage;

#[cfg(feature = "vtracer-support")]
use vtracer;

/// High-performance vtracer integration with O(n) complexity
pub struct VTracerWrapper;

impl ConversionAlgorithm for VTracerWrapper {
    fn convert(_image: DynamicImage, _params: ConversionParameters) -> Result<String> {
        #[cfg(not(feature = "vtracer-support"))]
        {
            return Err(Vec2ArtError::InvalidParameters(
                "vtracer support not enabled in build".to_string()
            ));
        }
        
        #[cfg(feature = "vtracer-support")]
        {
            match params {
                ConversionParameters::VTracer {
                    color_mode,
                    color_precision,
                    layer_difference,
                    corner_threshold,
                    length_threshold,
                    max_iterations,
                    splice_threshold,
                    filter_speckle,
                    path_precision,
                } => {
                    info!("Starting vtracer conversion with O(n) complexity");
                    
                    // Convert image to vtracer format
                    let img_buf = image_to_vtracer_buffer(&image)?;
                    
                    // Configure vtracer
                    let config = vtracer::Config {
                        input_size: vtracer::Config::default().input_size,
                        output_size: vtracer::Config::default().output_size,
                        color_mode: convert_color_mode(color_mode),
                        color_precision,
                        layer_difference,
                        corner_threshold,
                        length_threshold,
                        max_iterations,
                        splice_threshold,
                        filter_speckle: filter_speckle as usize,
                        path_precision: Some(path_precision),
                        mode: vtracer::PathSimplifyMode::Spline,
                    };
                    
                    // Perform conversion
                    let svg = match vtracer::trace(&img_buf, config) {
                        Ok(paths) => paths,
                        Err(e) => return Err(Vec2ArtError::ProcessingError(
                            format!("vtracer conversion failed: {}", e)
                        )),
                    };
                    
                    info!("vtracer conversion complete");
                    Ok(svg)
                }
                _ => Err(Vec2ArtError::InvalidParameters(
                    "VTracer requires VTracer parameters".to_string()
                ))
            }
        }
    }
    
    fn description() -> &'static str {
        "High-performance O(n) vectorization using vtracer library"
    }
    
    fn estimate_time(width: u32, height: u32) -> u32 {
        // vtracer is very fast - roughly 50ms per megapixel
        let megapixels = (width * height) as f32 / 1_000_000.0;
        (megapixels * 50.0) as u32
    }
}

#[cfg(feature = "vtracer-support")]
fn image_to_vtracer_buffer(image: &DynamicImage) -> Result<vtracer::ImageBuffer> {
    let rgb = image.to_rgba8();
    let (width, height) = (rgb.width(), rgb.height());
    
    // Convert to vtracer's expected format
    let mut buffer = Vec::with_capacity((width * height * 4) as usize);
    
    for pixel in rgb.pixels() {
        buffer.push(pixel[0]); // R
        buffer.push(pixel[1]); // G
        buffer.push(pixel[2]); // B
        buffer.push(pixel[3]); // A
    }
    
    Ok(vtracer::ImageBuffer::new(buffer, width, height))
}

#[cfg(feature = "vtracer-support")]
fn convert_color_mode(mode: String) -> vtracer::ColorMode {
    match mode.as_str() {
        "color" => vtracer::ColorMode::Color,
        "binary" => vtracer::ColorMode::Binary,
        _ => vtracer::ColorMode::Color,
    }
}

/// Hybrid algorithm that automatically selects best approach
pub struct HybridVectorizer;

impl HybridVectorizer {
    /// Analyze image characteristics to select optimal algorithm
    pub fn analyze_image(image: &DynamicImage) -> ImageAnalysis {
        let (width, height) = (image.width(), image.height());
        let pixels = (width * height) as usize;
        
        // Analyze color distribution
        let rgb = image.to_rgb8();
        let mut color_set = std::collections::HashSet::new();
        let mut is_grayscale = true;
        
        for pixel in rgb.pixels() {
            color_set.insert((pixel[0], pixel[1], pixel[2]));
            
            if is_grayscale && !(pixel[0] == pixel[1] && pixel[1] == pixel[2]) {
                is_grayscale = false;
            }
            
            // Sample only for large images
            if color_set.len() > 1000 && pixels > 1_000_000 {
                break;
            }
        }
        
        let color_count = color_set.len();
        let is_bilevel = color_count <= 2;
        
        // Analyze connectivity and edges
        let gray = image.to_luma8();
        let edges = detect_edges_simple(&gray);
        let edge_density = edges as f32 / pixels as f32;
        
        ImageAnalysis {
            width,
            height,
            pixels,
            color_count,
            is_bilevel,
            is_grayscale,
            edge_density,
            has_thin_lines: edge_density > 0.1 && edge_density < 0.3,
            has_solid_regions: edge_density < 0.1,
            is_photographic: color_count > 1000,
        }
    }
    
    /// Select best algorithm based on image characteristics
    pub fn select_algorithm(analysis: &ImageAnalysis) -> RecommendedAlgorithm {
        if analysis.is_bilevel {
            RecommendedAlgorithm::Potrace
        } else if analysis.has_thin_lines && analysis.color_count < 100 {
            RecommendedAlgorithm::Autotrace
        } else if analysis.is_photographic {
            RecommendedAlgorithm::GeometricFitter
        } else if analysis.color_count <= 256 {
            RecommendedAlgorithm::VTracer
        } else {
            RecommendedAlgorithm::PathTracer
        }
    }
}

fn detect_edges_simple(gray: &image::GrayImage) -> usize {
    let mut edge_pixels = 0;
    let (width, height) = gray.dimensions();
    
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let center = gray.get_pixel(x, y)[0] as i32;
            
            // Simple edge detection using neighbor difference
            let neighbors = [
                gray.get_pixel(x - 1, y)[0] as i32,
                gray.get_pixel(x + 1, y)[0] as i32,
                gray.get_pixel(x, y - 1)[0] as i32,
                gray.get_pixel(x, y + 1)[0] as i32,
            ];
            
            let max_diff = neighbors.iter()
                .map(|&n| (center - n).abs())
                .max()
                .unwrap_or(0);
            
            if max_diff > 30 {
                edge_pixels += 1;
            }
        }
    }
    
    edge_pixels
}

#[derive(Debug, Clone)]
pub struct ImageAnalysis {
    pub width: u32,
    pub height: u32,
    pub pixels: usize,
    pub color_count: usize,
    pub is_bilevel: bool,
    pub is_grayscale: bool,
    pub edge_density: f32,
    pub has_thin_lines: bool,
    pub has_solid_regions: bool,
    pub is_photographic: bool,
}

#[derive(Debug, Clone, Copy)]
pub enum RecommendedAlgorithm {
    Potrace,
    VTracer,
    Autotrace,
    PathTracer,
    GeometricFitter,
    EdgeDetector,
}

impl std::fmt::Display for RecommendedAlgorithm {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Potrace => write!(f, "Potrace (bi-level, high quality)"),
            Self::VTracer => write!(f, "vtracer (color, O(n) performance)"),
            Self::Autotrace => write!(f, "Autotrace (centerline for line art)"),
            Self::PathTracer => write!(f, "PathTracer (general purpose)"),
            Self::GeometricFitter => write!(f, "GeometricFitter (artistic)"),
            Self::EdgeDetector => write!(f, "EdgeDetector (detail preservation)"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_image_analysis() {
        // Create test images
        let bilevel = DynamicImage::new_luma8(100, 100);
        let analysis = HybridVectorizer::analyze_image(&bilevel);
        assert!(analysis.is_grayscale);
        
        let color = DynamicImage::new_rgb8(100, 100);
        let analysis = HybridVectorizer::analyze_image(&color);
        assert_eq!(analysis.width, 100);
        assert_eq!(analysis.height, 100);
    }
    
    #[test]
    fn test_algorithm_selection() {
        let analysis = ImageAnalysis {
            width: 100,
            height: 100,
            pixels: 10000,
            color_count: 2,
            is_bilevel: true,
            is_grayscale: true,
            edge_density: 0.05,
            has_thin_lines: false,
            has_solid_regions: true,
            is_photographic: false,
        };
        
        let recommended = HybridVectorizer::select_algorithm(&analysis);
        assert!(matches!(recommended, RecommendedAlgorithm::Potrace));
    }
}