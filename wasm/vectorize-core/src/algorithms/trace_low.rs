//! Low-detail tracing algorithms for sparse SVG generation
//!
//! This module implements three different tracing backends:
//! - Edge: Canny edge detection + contour following for sparse outlines
//! - Centerline: Skeleton + centerline tracing for engraving/sketch effects  
//! - Superpixel: Large regions with cell-shaded look using SLIC
//!
//! All algorithms are controlled by a single detail parameter (0..1) that maps
//! to appropriate thresholds for each backend.

use crate::algorithms::{SvgPath, SvgElementType, Point};
use crate::error::VectorizeError;
use image::{ImageBuffer, Rgba, GrayImage, Luma};
use std::collections::VecDeque;
use rayon::prelude::*;

/// Available tracing backends for low-detail vectorization
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum TraceBackend {
    /// Canny edge detection + contour following (sparse outlines)
    Edge,
    /// Skeleton + centerline tracing (engraving/sketch effects)
    Centerline,
    /// Large regions with cell-shaded look using SLIC
    Superpixel,
}

/// Configuration for trace-low algorithms
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub struct TraceLowConfig {
    /// Selected tracing backend
    pub backend: TraceBackend,
    /// Detail level (0.0 = very sparse, 1.0 = more detail)
    pub detail: f32,
    /// Stroke width at 1080p reference resolution
    pub stroke_px_at_1080p: f32,
}

impl Default for TraceLowConfig {
    fn default() -> Self {
        Self {
            backend: TraceBackend::Edge,
            detail: 0.3,
            stroke_px_at_1080p: 1.2,
        }
    }
}

/// Global threshold mapping from detail parameter
#[derive(Debug)]
pub struct ThresholdMapping {
    /// Douglas-Peucker epsilon in pixels
    pub dp_epsilon_px: f32,
    /// Minimum stroke length in pixels for pruning
    pub min_stroke_length_px: f32,
    /// Canny high threshold (normalized gradient)
    pub canny_high_threshold: f32,
    /// Canny low threshold (normalized gradient)
    pub canny_low_threshold: f32,
    /// Minimum centerline branch length in pixels
    pub min_centerline_branch_px: f32,
    /// SLIC superpixel cell size in pixels
    pub slic_cell_size_px: f32,
    /// SLIC iterations
    pub slic_iterations: u32,
    /// SLIC compactness parameter
    pub slic_compactness: f32,
    /// LAB color merge threshold (Delta E)
    pub lab_merge_threshold: f32,
    /// LAB color split threshold (Delta E)
    pub lab_split_threshold: f32,
    /// Image diagonal in pixels (for reference)
    pub image_diagonal_px: f32,
}

impl ThresholdMapping {
    /// Calculate all thresholds from detail parameter and image size
    pub fn new(detail: f32, image_width: u32, image_height: u32) -> Self {
        let detail = detail.clamp(0.0, 1.0);
        let diag = ((image_width.pow(2) + image_height.pow(2)) as f32).sqrt();
        
        // Global knob mapping as specified in trace-low-spec.md
        let dp_epsilon_px = ((0.003 + 0.012 * detail) * diag).clamp(0.003 * diag, 0.015 * diag);
        let min_stroke_length_px = 10.0 + 40.0 * detail;
        let canny_high_threshold = 0.15 + 0.20 * detail;
        let canny_low_threshold = 0.4 * canny_high_threshold;
        let min_centerline_branch_px = 12.0 + 36.0 * detail;
        let slic_cell_size_px = (600.0 + 2400.0 * detail).clamp(600.0, 3000.0);
        let lab_merge_threshold = (2.0 - 0.8 * detail).max(1.0);
        let lab_split_threshold = 3.0 + 1.0 * detail;
        
        Self {
            dp_epsilon_px,
            min_stroke_length_px,
            canny_high_threshold,
            canny_low_threshold,
            min_centerline_branch_px,
            slic_cell_size_px,
            slic_iterations: 10,
            slic_compactness: 10.0,
            lab_merge_threshold,
            lab_split_threshold,
            image_diagonal_px: diag,
        }
    }
}

/// Main entry point for trace-low vectorization
pub fn vectorize_trace_low(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let thresholds = ThresholdMapping::new(config.detail, image.width(), image.height());
    
    log::info!(
        "Starting trace-low vectorization with backend {:?}, detail {:.2}",
        config.backend, config.detail
    );
    log::debug!("Threshold mapping: {:?}", thresholds);
    
    match config.backend {
        TraceBackend::Edge => trace_edge(image, &thresholds, config),
        TraceBackend::Centerline => trace_centerline(image, &thresholds, config),
        TraceBackend::Superpixel => trace_superpixel(image, &thresholds, config),
    }
}

/// Edge backend: Canny edge detection + contour following
fn trace_edge(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    log::info!("Running edge backend");
    
    // Convert to grayscale
    let gray = rgba_to_gray(image);
    
    // Apply Gaussian blur (σ=1.0-2.0 based on detail)
    let sigma = 1.0 + (1.0 * config.detail);
    let blurred = gaussian_blur(&gray, sigma);
    
    // Canny edge detection
    let edges = canny_edge_detection(
        &blurred, 
        thresholds.canny_low_threshold, 
        thresholds.canny_high_threshold
    );
    
    // Link edges into polylines
    let polylines = link_edges_to_polylines(&edges);
    
    // Simplify with Douglas-Peucker and prune short strokes
    let simplified_polylines = polylines
        .into_par_iter()
        .filter_map(|polyline| {
            let simplified = douglas_peucker_simplify(&polyline, thresholds.dp_epsilon_px);
            let length = calculate_polyline_length(&simplified);
            
            if length >= thresholds.min_stroke_length_px {
                Some(simplified)
            } else {
                None
            }
        })
        .collect::<Vec<_>>();
    
    // Convert to SVG paths with stroke styling
    let stroke_width = calculate_stroke_width(image, config.stroke_px_at_1080p);
    let svg_paths: Vec<SvgPath> = simplified_polylines
        .into_iter()
        .map(|polyline| create_stroke_path(polyline, stroke_width))
        .collect();
    
    log::info!("Edge backend generated {} stroke paths", svg_paths.len());
    Ok(svg_paths)
}

/// Centerline backend: Skeleton + centerline tracing
fn trace_centerline(
    _image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    _config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // TODO: Implement centerline tracing
    // 1. Adaptive threshold (Sauvola)
    // 2. Morphological operations  
    // 3. Skeletonization (Zhang-Suen algorithm)
    // 4. Centerline tracing
    // 5. Branch pruning and simplification
    
    log::warn!("Centerline backend not yet implemented");
    Err(VectorizeError::algorithm_error("Centerline backend not yet implemented"))
}

/// Superpixel backend: Large regions with cell-shaded look
fn trace_superpixel(
    _image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    _thresholds: &ThresholdMapping,
    _config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // TODO: Implement superpixel tracing
    // 1. Bilateral filter for edge-preserving denoise
    // 2. Convert to CIELAB color space
    // 3. SLIC superpixels with adaptive cell size
    // 4. Graph merge in LAB space
    // 5. Extract region contours with DP simplification
    // 6. Optional border strokes
    
    log::warn!("Superpixel backend not yet implemented");
    Err(VectorizeError::algorithm_error("Superpixel backend not yet implemented"))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Convert RGBA image to grayscale
fn rgba_to_gray(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut gray = GrayImage::new(width, height);
    
    for (x, y, pixel) in image.enumerate_pixels() {
        let [r, g, b, _a] = pixel.0;
        // Standard luminance formula
        let gray_value = (0.299 * r as f32 + 0.587 * g as f32 + 0.114 * b as f32) as u8;
        gray.put_pixel(x, y, Luma([gray_value]));
    }
    
    gray
}

/// Apply Gaussian blur to grayscale image
fn gaussian_blur(image: &GrayImage, sigma: f32) -> GrayImage {
    // Simple implementation - in production would use more optimized version
    let kernel_size = (6.0 * sigma) as usize | 1; // Ensure odd
    let kernel_radius = kernel_size / 2;
    
    let (width, height) = image.dimensions();
    let mut blurred = GrayImage::new(width, height);
    
    // Generate Gaussian kernel
    let mut kernel = vec![0.0; kernel_size];
    let mut sum = 0.0;
    for i in 0..kernel_size {
        let x = i as f32 - kernel_radius as f32;
        kernel[i] = (-x * x / (2.0 * sigma * sigma)).exp();
        sum += kernel[i];
    }
    // Normalize kernel
    for k in &mut kernel {
        *k /= sum;
    }
    
    // Apply separable Gaussian filter (horizontal then vertical)
    let mut temp = GrayImage::new(width, height);
    
    // Horizontal pass
    for y in 0..height {
        for x in 0..width {
            let mut value = 0.0;
            for i in 0..kernel_size {
                let src_x = (x as i32 + i as i32 - kernel_radius as i32).max(0).min(width as i32 - 1) as u32;
                value += image.get_pixel(src_x, y).0[0] as f32 * kernel[i];
            }
            temp.put_pixel(x, y, Luma([value.round() as u8]));
        }
    }
    
    // Vertical pass
    for y in 0..height {
        for x in 0..width {
            let mut value = 0.0;
            for i in 0..kernel_size {
                let src_y = (y as i32 + i as i32 - kernel_radius as i32).max(0).min(height as i32 - 1) as u32;
                value += temp.get_pixel(x, src_y).0[0] as f32 * kernel[i];
            }
            blurred.put_pixel(x, y, Luma([value.round() as u8]));
        }
    }
    
    blurred
}

/// Canny edge detection implementation
fn canny_edge_detection(image: &GrayImage, low_threshold: f32, high_threshold: f32) -> GrayImage {
    let (width, height) = image.dimensions();
    
    // Calculate gradients using Sobel operators
    let mut gradient_x = vec![0.0; (width * height) as usize];
    let mut gradient_y = vec![0.0; (width * height) as usize];
    let mut gradient_magnitude = vec![0.0; (width * height) as usize];
    
    // Sobel kernels
    let sobel_x = [-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0];
    let sobel_y = [-1.0, -2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0];
    
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = (y * width + x) as usize;
            
            let mut gx = 0.0;
            let mut gy = 0.0;
            
            for ky in 0..3 {
                for kx in 0..3 {
                    let px = image.get_pixel(x + kx - 1, y + ky - 1).0[0] as f32;
                    let kernel_idx = (ky * 3 + kx) as usize;
                    gx += px * sobel_x[kernel_idx];
                    gy += px * sobel_y[kernel_idx];
                }
            }
            
            gradient_x[idx] = gx;
            gradient_y[idx] = gy;
            gradient_magnitude[idx] = (gx * gx + gy * gy).sqrt();
        }
    }
    
    // Normalize gradient magnitude to [0, 1]
    let max_magnitude = gradient_magnitude.iter().fold(0.0_f32, |a, &b| a.max(b));
    if max_magnitude > 0.0 {
        for mag in &mut gradient_magnitude {
            *mag /= max_magnitude;
        }
    }
    
    // Non-maximum suppression
    let mut suppressed = vec![0.0; (width * height) as usize];
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = (y * width + x) as usize;
            let magnitude = gradient_magnitude[idx];
            
            if magnitude == 0.0 {
                continue;
            }
            
            let gx = gradient_x[idx];
            let gy = gradient_y[idx];
            let angle = gy.atan2(gx);
            
            // Determine gradient direction (0, 45, 90, 135 degrees)
            let angle_deg = (angle * 180.0 / std::f32::consts::PI + 180.0) % 180.0;
            
            let (dx1, dy1, dx2, dy2) = if angle_deg < 22.5 || angle_deg >= 157.5 {
                (1, 0, -1, 0) // 0 degrees
            } else if angle_deg < 67.5 {
                (1, 1, -1, -1) // 45 degrees
            } else if angle_deg < 112.5 {
                (0, 1, 0, -1) // 90 degrees
            } else {
                (-1, 1, 1, -1) // 135 degrees
            };
            
            let x1 = (x as i32 + dx1).max(0).min(width as i32 - 1) as u32;
            let y1 = (y as i32 + dy1).max(0).min(height as i32 - 1) as u32;
            let x2 = (x as i32 + dx2).max(0).min(width as i32 - 1) as u32;
            let y2 = (y as i32 + dy2).max(0).min(height as i32 - 1) as u32;
            
            let mag1 = gradient_magnitude[(y1 * width + x1) as usize];
            let mag2 = gradient_magnitude[(y2 * width + x2) as usize];
            
            if magnitude >= mag1 && magnitude >= mag2 {
                suppressed[idx] = magnitude;
            }
        }
    }
    
    // Double threshold and hysteresis
    let mut edges = GrayImage::new(width, height);
    let mut strong_edges = vec![false; (width * height) as usize];
    let mut weak_edges = vec![false; (width * height) as usize];
    
    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;
            let magnitude = suppressed[idx];
            
            if magnitude >= high_threshold {
                edges.put_pixel(x, y, Luma([255]));
                strong_edges[idx] = true;
            } else if magnitude >= low_threshold {
                weak_edges[idx] = true;
            }
        }
    }
    
    // Hysteresis: connect weak edges to strong edges
    let mut changed = true;
    while changed {
        changed = false;
        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let idx = (y * width + x) as usize;
                if weak_edges[idx] && !strong_edges[idx] {
                    // Check if any neighbor is a strong edge
                    for dy in -1i32..=1 {
                        for dx in -1i32..=1 {
                            if dx == 0 && dy == 0 { continue; }
                            let nx = (x as i32 + dx) as u32;
                            let ny = (y as i32 + dy) as u32;
                            let nidx = (ny * width + nx) as usize;
                            
                            if strong_edges[nidx] {
                                edges.put_pixel(x, y, Luma([255]));
                                strong_edges[idx] = true;
                                changed = true;
                                break;
                            }
                        }
                        if strong_edges[idx] { break; }
                    }
                }
            }
        }
    }
    
    edges
}

/// Link edge pixels into polylines using 8-connectivity
fn link_edges_to_polylines(edges: &GrayImage) -> Vec<Vec<Point>> {
    let (width, height) = edges.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();
    
    // 8-connectivity neighbors
    const NEIGHBORS: [(i32, i32); 8] = [
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1),           (0, 1),
        (1, -1),  (1, 0),  (1, 1),
    ];
    
    for y in 0..height {
        for x in 0..width {
            if edges.get_pixel(x, y).0[0] == 255 && !visited[y as usize][x as usize] {
                // Start new polyline from this edge pixel
                let mut polyline = Vec::new();
                let mut stack = VecDeque::new();
                stack.push_back((x, y));
                
                while let Some((px, py)) = stack.pop_back() {
                    if visited[py as usize][px as usize] {
                        continue;
                    }
                    
                    visited[py as usize][px as usize] = true;
                    polyline.push(Point { x: px as f32, y: py as f32 });
                    
                    // Find connected neighbors
                    for (dx, dy) in &NEIGHBORS {
                        let nx = px as i32 + dx;
                        let ny = py as i32 + dy;
                        
                        if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                            let nx = nx as u32;
                            let ny = ny as u32;
                            
                            if !visited[ny as usize][nx as usize] && 
                               edges.get_pixel(nx, ny).0[0] == 255 {
                                stack.push_back((nx, ny));
                            }
                        }
                    }
                }
                
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }
    
    polylines
}

/// Douglas-Peucker polyline simplification
fn douglas_peucker_simplify(polyline: &[Point], epsilon: f32) -> Vec<Point> {
    if polyline.len() <= 2 {
        return polyline.to_vec();
    }
    
    fn perpendicular_distance(point: &Point, line_start: &Point, line_end: &Point) -> f32 {
        let dx = line_end.x - line_start.x;
        let dy = line_end.y - line_start.y;
        
        if dx == 0.0 && dy == 0.0 {
            // Degenerate line
            return ((point.x - line_start.x).powi(2) + (point.y - line_start.y).powi(2)).sqrt();
        }
        
        let numerator = (dy * point.x - dx * point.y + line_end.x * line_start.y - line_end.y * line_start.x).abs();
        let denominator = (dx * dx + dy * dy).sqrt();
        
        numerator / denominator
    }
    
    fn dp_recursive(points: &[Point], epsilon: f32, result: &mut Vec<Point>) {
        if points.len() < 2 {
            return;
        }
        
        let first = &points[0];
        let last = &points[points.len() - 1];
        
        let mut max_distance = 0.0;
        let mut max_index = 0;
        
        for (i, point) in points.iter().enumerate().skip(1).take(points.len() - 2) {
            let distance = perpendicular_distance(point, first, last);
            if distance > max_distance {
                max_distance = distance;
                max_index = i;
            }
        }
        
        if max_distance > epsilon {
            // Split at the point with maximum distance
            dp_recursive(&points[0..=max_index], epsilon, result);
            result.pop(); // Remove duplicate point
            dp_recursive(&points[max_index..], epsilon, result);
        } else {
            // Keep only first and last points
            result.push(*first);
            result.push(*last);
        }
    }
    
    let mut result = Vec::new();
    dp_recursive(polyline, epsilon, &mut result);
    result
}

/// Calculate total length of a polyline
fn calculate_polyline_length(polyline: &[Point]) -> f32 {
    let mut length = 0.0;
    for i in 1..polyline.len() {
        let dx = polyline[i].x - polyline[i - 1].x;
        let dy = polyline[i].y - polyline[i - 1].y;
        length += (dx * dx + dy * dy).sqrt();
    }
    length
}

/// Calculate stroke width based on image size and reference resolution
fn calculate_stroke_width(image: &ImageBuffer<Rgba<u8>, Vec<u8>>, stroke_px_at_1080p: f32) -> f32 {
    let image_diagonal = ((image.width().pow(2) + image.height().pow(2)) as f32).sqrt();
    let reference_diagonal = ((1920_f32).powi(2) + (1080_f32).powi(2)).sqrt(); // 1080p diagonal
    let scale_factor = image_diagonal / reference_diagonal;
    
    stroke_px_at_1080p * scale_factor
}

/// Create SVG stroke path from polyline
fn create_stroke_path(polyline: Vec<Point>, stroke_width: f32) -> SvgPath {
    // Create path data string
    let mut path_data = String::new();
    
    if !polyline.is_empty() {
        path_data.push_str(&format!("M {:.2} {:.2}", polyline[0].x, polyline[0].y));
        
        for point in polyline.iter().skip(1) {
            path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
        }
    }
    
    SvgPath {
        element_type: SvgElementType::Path,
        path_data,
        fill: None,
        stroke: Some("black".to_string()),
        stroke_width: Some(stroke_width),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_threshold_mapping() {
        let mapping = ThresholdMapping::new(0.5, 1920, 1080);
        
        // Check that thresholds are reasonable
        assert!(mapping.dp_epsilon_px > 0.0);
        assert!(mapping.min_stroke_length_px >= 10.0);
        assert!(mapping.canny_high_threshold > mapping.canny_low_threshold);
        assert!(mapping.slic_cell_size_px >= 600.0);
        assert!(mapping.slic_cell_size_px <= 3000.0);
        assert!(mapping.lab_merge_threshold >= 1.0);
        assert!(mapping.lab_split_threshold > mapping.lab_merge_threshold);
    }
    
    #[test]
    fn test_edge_backend_basic() {
        // Create simple test image with edges
        let mut image = ImageBuffer::new(100, 100);
        
        // Draw a simple square
        for x in 20..80 {
            for y in 20..80 {
                if x == 20 || x == 79 || y == 20 || y == 79 {
                    image.put_pixel(x, y, Rgba([0, 0, 0, 255])); // Black edge
                } else {
                    image.put_pixel(x, y, Rgba([255, 255, 255, 255])); // White fill
                }
            }
        }
        
        let config = TraceLowConfig {
            backend: TraceBackend::Edge,
            detail: 0.5,
            stroke_px_at_1080p: 1.2,
        };
        
        let result = vectorize_trace_low(&image, &config);
        assert!(result.is_ok());
        
        let paths = result.unwrap();
        assert!(!paths.is_empty());
        
        // Check that paths are stroke-only
        for path in &paths {
            assert!(path.fill.is_none());
            assert!(path.stroke.is_some());
            assert!(path.stroke_width.is_some());
        }
    }
    
    #[test]
    fn test_douglas_peucker_simplification() {
        // Create a simple polyline that should be simplified
        let polyline = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.1 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.1 },
            Point { x: 4.0, y: 0.0 },
            Point { x: 5.0, y: 5.0 }, // Significant deviation
            Point { x: 6.0, y: 0.0 },
        ];
        
        let simplified = douglas_peucker_simplify(&polyline, 0.5);
        
        // Should remove some intermediate points but keep the significant deviation
        assert!(simplified.len() < polyline.len());
        assert!(simplified.len() >= 2);
        
        // First and last points should be preserved
        assert_eq!(simplified[0], polyline[0]);
        assert_eq!(simplified[simplified.len() - 1], polyline[polyline.len() - 1]);
    }
}