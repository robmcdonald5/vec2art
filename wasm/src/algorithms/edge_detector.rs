use crate::algorithms::{ConversionAlgorithm, SvgPath, utils};
use crate::error::{Result, Vec2ArtError};
use crate::svg_builder::SvgBuilder;
use crate::utils::convolution::{gaussian_blur, sobel_edge_detection, non_maximum_suppression};
use crate::{ConversionParameters, EdgeMethod};
use image::{DynamicImage, GrayImage, Luma};
use log::info;
use std::collections::{HashSet, VecDeque};

pub struct EdgeDetector;

impl ConversionAlgorithm for EdgeDetector {
    fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        // Use parallel implementation if available
        #[cfg(feature = "parallel")]
        {
            let capabilities = crate::performance::get_capabilities();
            if capabilities.can_use_parallel_processing() {
                return crate::performance::parallel_edge_detector::ParallelEdgeDetector::convert_optimized(image, params);
            }
        }
        
        match params {
            ConversionParameters::EdgeDetector {
                method,
                threshold_low,
                threshold_high,
                gaussian_sigma,
                simplification,
                min_path_length,
            } => {
                info!("Starting edge detection with method: {:?}", method);
                
                // Convert to grayscale
                let gray = utils::to_grayscale(&image);
                
                // Apply edge detection based on method
                let edges = match method {
                    EdgeMethod::Canny => {
                        canny_edge_detection(&gray, gaussian_sigma, threshold_low, threshold_high)?
                    }
                    EdgeMethod::Sobel => {
                        sobel_edge_detection_simple(&gray, threshold_low)?
                    }
                };
                
                // Trace contours from edge image
                let paths = trace_contours(&edges, min_path_length);
                
                // Simplify paths
                let simplified_paths = simplify_paths(paths, simplification);
                
                // Generate SVG
                let svg = generate_svg(&simplified_paths, image.width(), image.height());
                
                info!("Edge detection complete, found {} paths", simplified_paths.len());
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "EdgeDetector requires EdgeDetector parameters".to_string()
            ))
        }
    }
    
    fn description() -> &'static str {
        "Detects edges in an image and converts them to SVG paths"
    }
    
    fn estimate_time(width: u32, height: u32) -> u32 {
        // Rough estimate: ~50ms per megapixel
        let megapixels = (width * height) as f32 / 1_000_000.0;
        (megapixels * 50.0) as u32
    }
}

/// Canny edge detection implementation
fn canny_edge_detection(
    image: &GrayImage,
    sigma: f32,
    low_threshold: f32,
    high_threshold: f32,
) -> Result<GrayImage> {
    info!("Applying Canny edge detection");
    
    // Step 1: Gaussian blur
    let blurred = gaussian_blur(image, sigma);
    
    // Step 2: Gradient calculation using Sobel
    let (magnitude, direction) = sobel_edge_detection(&blurred);
    
    // Step 3: Non-maximum suppression
    let suppressed = non_maximum_suppression(&magnitude, &direction);
    
    // Step 4: Double thresholding and hysteresis
    let edges = hysteresis_threshold(&suppressed, low_threshold as u8, high_threshold as u8);
    
    Ok(edges)
}

/// Simple Sobel edge detection
fn sobel_edge_detection_simple(image: &GrayImage, threshold: f32) -> Result<GrayImage> {
    info!("Applying Sobel edge detection");
    
    let (magnitude, _) = sobel_edge_detection(image);
    
    // Apply threshold
    let mut edges = GrayImage::new(image.width(), image.height());
    for (x, y, pixel) in magnitude.enumerate_pixels() {
        let value = if pixel[0] as f32 > threshold { 255 } else { 0 };
        edges.put_pixel(x, y, Luma([value]));
    }
    
    Ok(edges)
}

/// Hysteresis thresholding for Canny edge detection
fn hysteresis_threshold(image: &GrayImage, low: u8, high: u8) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut output = GrayImage::new(width, height);
    let mut strong_edges = HashSet::new();
    let mut weak_edges = HashSet::new();
    
    // Classify pixels as strong, weak, or non-edges
    for y in 0..height {
        for x in 0..width {
            let pixel = image.get_pixel(x, y)[0];
            
            if pixel >= high {
                strong_edges.insert((x, y));
                output.put_pixel(x, y, Luma([255]));
            } else if pixel >= low {
                weak_edges.insert((x, y));
            }
        }
    }
    
    // Connect weak edges to strong edges
    let mut queue = VecDeque::new();
    for &(x, y) in &strong_edges {
        queue.push_back((x, y));
    }
    
    let neighbors = [
        (-1, -1), (0, -1), (1, -1),
        (-1,  0),          (1,  0),
        (-1,  1), (0,  1), (1,  1),
    ];
    
    while let Some((x, y)) = queue.pop_front() {
        for (dx, dy) in &neighbors {
            let nx = (x as i32 + dx) as u32;
            let ny = (y as i32 + dy) as u32;
            
            if nx < width && ny < height && weak_edges.remove(&(nx, ny)) {
                output.put_pixel(nx, ny, Luma([255]));
                queue.push_back((nx, ny));
            }
        }
    }
    
    output
}

/// Trace contours from an edge image
fn trace_contours(edges: &GrayImage, min_length: u32) -> Vec<Vec<(f32, f32)>> {
    let (width, height) = edges.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut contours = Vec::new();
    
    for y in 0..height {
        for x in 0..width {
            if edges.get_pixel(x, y)[0] > 0 && !visited[y as usize][x as usize] {
                let contour = trace_single_contour(edges, &mut visited, x, y);
                
                if contour.len() >= min_length as usize {
                    contours.push(contour);
                }
            }
        }
    }
    
    contours
}

/// Trace a single contour starting from a given point
fn trace_single_contour(
    edges: &GrayImage,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
) -> Vec<(f32, f32)> {
    let (width, height) = edges.dimensions();
    let mut contour = Vec::new();
    let mut queue = VecDeque::new();
    
    queue.push_back((start_x, start_y));
    visited[start_y as usize][start_x as usize] = true;
    
    // 8-connected neighborhood
    let neighbors = [
        (-1, -1), (0, -1), (1, -1),
        (-1,  0),          (1,  0),
        (-1,  1), (0,  1), (1,  1),
    ];
    
    while let Some((x, y)) = queue.pop_front() {
        contour.push((x as f32, y as f32));
        
        // Find next unvisited edge pixel
        for (dx, dy) in &neighbors {
            let nx = (x as i32 + dx) as u32;
            let ny = (y as i32 + dy) as u32;
            
            if nx < width && ny < height {
                if edges.get_pixel(nx, ny)[0] > 0 && !visited[ny as usize][nx as usize] {
                    visited[ny as usize][nx as usize] = true;
                    queue.push_back((nx, ny));
                    break; // Follow single path
                }
            }
        }
    }
    
    contour
}

/// Simplify paths using Douglas-Peucker algorithm
fn simplify_paths(paths: Vec<Vec<(f32, f32)>>, epsilon: f32) -> Vec<SvgPath> {
    paths.into_iter().map(|points| {
        let mut path = SvgPath::new();
        path.points = points;
        path.simplify(epsilon);
        path.stroke_color = Some("#000000".to_string());
        path.stroke_width = 1.0;
        path
    }).collect()
}

/// Generate SVG from paths
fn generate_svg(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art Edge Detection", "Edge-detected vector graphics")
        .with_background("#ffffff");
    
    builder.add_paths(paths);
    
    builder.build()
}

pub fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
    EdgeDetector::convert(image, params)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_edge_detector_creation() {
        let params = ConversionParameters::EdgeDetector {
            method: EdgeMethod::Canny,
            threshold_low: 50.0,
            threshold_high: 150.0,
            gaussian_sigma: 1.0,
            simplification: 2.0,
            min_path_length: 10,
        };
        
        // Create a simple test image
        let img = DynamicImage::new_rgb8(100, 100);
        let result = EdgeDetector::convert(img, params);
        
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }
}