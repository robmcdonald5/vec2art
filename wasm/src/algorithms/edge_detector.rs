use crate::algorithms::{ConversionAlgorithm, SvgPath, utils};
use crate::error::{Result, Vec2ArtError};
use crate::svg_builder::SvgBuilder;
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

/// Optimized Canny edge detection for WASM
fn canny_edge_detection(
    image: &GrayImage,
    sigma: f32,
    low_threshold: f32,
    high_threshold: f32,
) -> Result<GrayImage> {
    info!("Applying optimized Canny edge detection");
    
    // Step 1: Gaussian blur using optimized utils
    let blurred = utils::gaussian_blur(image, sigma);
    
    // Step 2: Gradient calculation using Sobel (optimized for WASM)
    let (magnitude, direction) = sobel_gradient_optimized(&blurred);
    
    // Step 3: Non-maximum suppression
    let suppressed = non_maximum_suppression_optimized(&magnitude, &direction);
    
    // Step 4: Double thresholding and hysteresis
    let edges = hysteresis_threshold(&suppressed, low_threshold as u8, high_threshold as u8);
    
    Ok(edges)
}

/// Optimized Sobel gradient calculation with SIMD-ready structure
fn sobel_gradient_optimized(image: &GrayImage) -> (GrayImage, Vec<f32>) {
    let (width, height) = image.dimensions();
    let mut magnitude = GrayImage::new(width, height);
    let mut direction = vec![0.0f32; (width * height) as usize];
    
    // Sobel kernels
    const SOBEL_X: [[i16; 3]; 3] = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ];
    
    const SOBEL_Y: [[i16; 3]; 3] = [
        [-1, -2, -1],
        [ 0,  0,  0],
        [ 1,  2,  1],
    ];
    
    // Pre-compute image buffer for faster access
    let img_buffer: Vec<u8> = image.pixels().map(|p| p[0]).collect();
    let mut mag_buffer = vec![0u8; (width * height) as usize];
    
    // Process image with optimized memory access pattern
    for y in 1..height - 1 {
        let row_offset = y * width;
        
        for x in 1..width - 1 {
            let mut gx = 0i32;
            let mut gy = 0i32;
            
            // Unroll the kernel loops for better performance
            // Row -1
            let idx_top = ((y - 1) * width + x - 1) as usize;
            gx += SOBEL_X[0][0] as i32 * img_buffer[idx_top] as i32;
            gy += SOBEL_Y[0][0] as i32 * img_buffer[idx_top] as i32;
            
            gx += SOBEL_X[0][1] as i32 * img_buffer[idx_top + 1] as i32;
            gy += SOBEL_Y[0][1] as i32 * img_buffer[idx_top + 1] as i32;
            
            gx += SOBEL_X[0][2] as i32 * img_buffer[idx_top + 2] as i32;
            gy += SOBEL_Y[0][2] as i32 * img_buffer[idx_top + 2] as i32;
            
            // Row 0
            let idx_mid = (row_offset + x - 1) as usize;
            gx += SOBEL_X[1][0] as i32 * img_buffer[idx_mid] as i32;
            gy += SOBEL_Y[1][0] as i32 * img_buffer[idx_mid] as i32;
            
            gx += SOBEL_X[1][2] as i32 * img_buffer[idx_mid + 2] as i32;
            gy += SOBEL_Y[1][2] as i32 * img_buffer[idx_mid + 2] as i32;
            
            // Row +1
            let idx_bot = ((y + 1) * width + x - 1) as usize;
            gx += SOBEL_X[2][0] as i32 * img_buffer[idx_bot] as i32;
            gy += SOBEL_Y[2][0] as i32 * img_buffer[idx_bot] as i32;
            
            gx += SOBEL_X[2][1] as i32 * img_buffer[idx_bot + 1] as i32;
            gy += SOBEL_Y[2][1] as i32 * img_buffer[idx_bot + 1] as i32;
            
            gx += SOBEL_X[2][2] as i32 * img_buffer[idx_bot + 2] as i32;
            gy += SOBEL_Y[2][2] as i32 * img_buffer[idx_bot + 2] as i32;
            
            // Calculate magnitude and direction
            let mag = ((gx * gx + gy * gy) as f32).sqrt();
            let idx = (row_offset + x) as usize;
            
            mag_buffer[idx] = mag.min(255.0) as u8;
            direction[idx] = (gy as f32).atan2(gx as f32);
        }
    }
    
    // Convert buffer back to image
    for (i, &val) in mag_buffer.iter().enumerate() {
        let x = (i % width as usize) as u32;
        let y = (i / width as usize) as u32;
        magnitude.put_pixel(x, y, Luma([val]));
    }
    
    (magnitude, direction)
}

/// Optimized non-maximum suppression
fn non_maximum_suppression_optimized(magnitude: &GrayImage, direction: &[f32]) -> GrayImage {
    let (width, height) = magnitude.dimensions();
    let mut suppressed = GrayImage::new(width, height);
    
    // Pre-compute magnitude buffer for faster access
    let mag_buffer: Vec<u8> = magnitude.pixels().map(|p| p[0]).collect();
    let mut out_buffer = vec![0u8; (width * height) as usize];
    
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = (y * width + x) as usize;
            let angle = direction[idx];
            let mag = mag_buffer[idx];
            
            // Quantize angle to 4 directions
            let (dx, dy) = if angle < -3.0 * std::f32::consts::PI / 8.0 || angle >= 3.0 * std::f32::consts::PI / 8.0 {
                (1, 0) // Horizontal
            } else if angle >= std::f32::consts::PI / 8.0 && angle < 3.0 * std::f32::consts::PI / 8.0 {
                (1, -1) // Diagonal /
            } else if angle >= -std::f32::consts::PI / 8.0 && angle < std::f32::consts::PI / 8.0 {
                (0, 1) // Vertical
            } else {
                (1, 1) // Diagonal \
            };
            
            // Check neighbors in gradient direction
            let n1_idx = ((y as i32 + dy) * width as i32 + (x as i32 + dx)) as usize;
            let n2_idx = ((y as i32 - dy) * width as i32 + (x as i32 - dx)) as usize;
            
            if mag >= mag_buffer[n1_idx] && mag >= mag_buffer[n2_idx] {
                out_buffer[idx] = mag;
            }
        }
    }
    
    // Convert buffer back to image
    for (i, &val) in out_buffer.iter().enumerate() {
        let x = (i % width as usize) as u32;
        let y = (i / width as usize) as u32;
        suppressed.put_pixel(x, y, Luma([val]));
    }
    
    suppressed
}

/// Optimized Sobel edge detection for simple thresholding
fn sobel_edge_detection_simple(image: &GrayImage, threshold: f32) -> Result<GrayImage> {
    info!("Applying optimized Sobel edge detection");
    
    let (magnitude, _) = sobel_gradient_optimized(image);
    
    // Apply threshold with optimized loop
    let (width, height) = magnitude.dimensions();
    let mut edges = GrayImage::new(width, height);
    
    // Process in chunks for better cache locality
    let threshold_u8 = threshold as u8;
    for (pixel_in, pixel_out) in magnitude.pixels().zip(edges.pixels_mut()) {
        *pixel_out = if pixel_in[0] > threshold_u8 { 
            Luma([255]) 
        } else { 
            Luma([0]) 
        };
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