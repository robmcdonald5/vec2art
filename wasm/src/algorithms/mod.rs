pub mod edge_detector;
pub mod path_tracer;
pub mod geometric_fitter;

use crate::error::Result;
use crate::ConversionParameters;
use image::DynamicImage;

/// Common trait for all conversion algorithms
pub trait ConversionAlgorithm {
    /// Convert an image to SVG using the algorithm's specific approach
    fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String>;
    
    /// Get a description of the algorithm
    fn description() -> &'static str;
    
    /// Estimate processing time for given image dimensions (in milliseconds)
    fn estimate_time(width: u32, height: u32) -> u32;
}

/// Common utilities for all algorithms
pub mod utils {
    use image::{DynamicImage, GrayImage, Rgb, Rgba};
    use crate::error::Result;
    
    /// Convert any image to grayscale
    pub fn to_grayscale(image: &DynamicImage) -> GrayImage {
        image.to_luma8()
    }
    
    /// Apply Gaussian blur to an image
    pub fn gaussian_blur(image: &GrayImage, sigma: f32) -> GrayImage {
        imageproc::filter::gaussian_blur_f32(image, sigma)
    }
    
    /// Extract dominant colors from an image using k-means clustering
    pub fn extract_colors(image: &DynamicImage, num_colors: usize) -> Result<Vec<Rgb<u8>>> {
        use palette::{FromColor, IntoColor, Lab, Pixel, Srgb};
        
        let pixels: Vec<Lab> = image
            .to_rgb8()
            .pixels()
            .map(|p| {
                let rgb = Srgb::from_raw(&p.0).into_format::<f32>();
                Lab::from_color(rgb)
            })
            .collect();
        
        // Simple k-means implementation
        let mut centers = Vec::with_capacity(num_colors);
        let step = pixels.len() / num_colors;
        for i in 0..num_colors {
            centers.push(pixels[i * step]);
        }
        
        // Iterate k-means
        for _ in 0..10 {
            let mut clusters: Vec<Vec<Lab>> = vec![Vec::new(); num_colors];
            
            // Assign pixels to nearest center
            for pixel in &pixels {
                let mut min_dist = f32::MAX;
                let mut min_idx = 0;
                
                for (idx, center) in centers.iter().enumerate() {
                    let dist = color_distance(pixel, center);
                    if dist < min_dist {
                        min_dist = dist;
                        min_idx = idx;
                    }
                }
                
                clusters[min_idx].push(*pixel);
            }
            
            // Update centers
            for (idx, cluster) in clusters.iter().enumerate() {
                if !cluster.is_empty() {
                    let sum = cluster.iter().fold(
                        Lab::new(0.0, 0.0, 0.0),
                        |acc, c| Lab::new(
                            acc.l + c.l,
                            acc.a + c.a,
                            acc.b + c.b,
                        )
                    );
                    
                    let count = cluster.len() as f32;
                    centers[idx] = Lab::new(
                        sum.l / count,
                        sum.a / count,
                        sum.b / count,
                    );
                }
            }
        }
        
        // Convert back to RGB
        Ok(centers
            .into_iter()
            .map(|lab| {
                let srgb: Srgb = lab.into_color();
                let rgb_u8: Srgb<u8> = srgb.into_format();
                Rgb([rgb_u8.red, rgb_u8.green, rgb_u8.blue])
            })
            .collect())
    }
    
    fn color_distance(a: &Lab, b: &Lab) -> f32 {
        let dl = a.l - b.l;
        let da = a.a - b.a;
        let db = a.b - b.b;
        (dl * dl + da * da + db * db).sqrt()
    }
    
    /// Calculate image histogram
    pub fn calculate_histogram(image: &GrayImage) -> [u32; 256] {
        let mut histogram = [0u32; 256];
        for pixel in image.pixels() {
            histogram[pixel[0] as usize] += 1;
        }
        histogram
    }
    
    /// Apply Otsu's method for automatic threshold detection
    pub fn otsu_threshold(histogram: &[u32; 256]) -> u8 {
        let total: u32 = histogram.iter().sum();
        let mut sum: f64 = 0.0;
        for (i, &count) in histogram.iter().enumerate() {
            sum += (i as f64) * (count as f64);
        }
        
        let mut sum_b = 0.0;
        let mut weight_b = 0.0;
        let mut weight_f;
        let mut max_variance = 0.0;
        let mut threshold = 0u8;
        
        for t in 0..256 {
            weight_b += histogram[t] as f64;
            if weight_b == 0.0 { continue; }
            
            weight_f = total as f64 - weight_b;
            if weight_f == 0.0 { break; }
            
            sum_b += (t as f64) * (histogram[t] as f64);
            
            let mean_b = sum_b / weight_b;
            let mean_f = (sum - sum_b) / weight_f;
            
            let variance = weight_b * weight_f * (mean_b - mean_f) * (mean_b - mean_f);
            
            if variance > max_variance {
                max_variance = variance;
                threshold = t as u8;
            }
        }
        
        threshold
    }
    
    /// Convert grayscale image to binary using threshold
    pub fn threshold_binary(image: &GrayImage, threshold: u8) -> GrayImage {
        let mut binary = image.clone();
        for pixel in binary.pixels_mut() {
            pixel[0] = if pixel[0] > threshold { 255 } else { 0 };
        }
        binary
    }
}

/// Path structure for SVG generation
#[derive(Debug, Clone)]
pub struct SvgPath {
    pub points: Vec<(f32, f32)>,
    pub closed: bool,
    pub stroke_color: Option<String>,
    pub fill_color: Option<String>,
    pub stroke_width: f32,
}

impl SvgPath {
    pub fn new() -> Self {
        Self {
            points: Vec::new(),
            closed: false,
            stroke_color: Some("#000000".to_string()),
            fill_color: None,
            stroke_width: 1.0,
        }
    }
    
    pub fn add_point(&mut self, x: f32, y: f32) {
        self.points.push((x, y));
    }
    
    /// Convert path to SVG path data string
    pub fn to_path_data(&self) -> String {
        if self.points.is_empty() {
            return String::new();
        }
        
        let mut path_data = String::new();
        let (x, y) = self.points[0];
        path_data.push_str(&format!("M{:.2},{:.2}", x, y));
        
        for &(x, y) in &self.points[1..] {
            path_data.push_str(&format!(" L{:.2},{:.2}", x, y));
        }
        
        if self.closed {
            path_data.push_str(" Z");
        }
        
        path_data
    }
    
    /// Simplify path using Douglas-Peucker algorithm
    pub fn simplify(&mut self, epsilon: f32) {
        if self.points.len() <= 2 {
            return;
        }
        
        self.points = douglas_peucker(&self.points, epsilon);
    }
}

/// Douglas-Peucker line simplification algorithm
fn douglas_peucker(points: &[(f32, f32)], epsilon: f32) -> Vec<(f32, f32)> {
    if points.len() <= 2 {
        return points.to_vec();
    }
    
    // Find point with maximum distance from line
    let mut max_dist = 0.0;
    let mut index = 0;
    let end = points.len() - 1;
    
    for i in 1..end {
        let dist = perpendicular_distance(points[i], points[0], points[end]);
        if dist > max_dist {
            max_dist = dist;
            index = i;
        }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if max_dist > epsilon {
        let mut left = douglas_peucker(&points[..=index], epsilon);
        let right = douglas_peucker(&points[index..], epsilon);
        
        left.pop(); // Remove duplicate point
        left.extend(right);
        left
    } else {
        vec![points[0], points[end]]
    }
}

/// Calculate perpendicular distance from point to line
fn perpendicular_distance(point: (f32, f32), line_start: (f32, f32), line_end: (f32, f32)) -> f32 {
    let (px, py) = point;
    let (x1, y1) = line_start;
    let (x2, y2) = line_end;
    
    let dx = x2 - x1;
    let dy = y2 - y1;
    
    if dx == 0.0 && dy == 0.0 {
        // Line start and end are the same
        ((px - x1).powi(2) + (py - y1).powi(2)).sqrt()
    } else {
        let norm = (dx * dx + dy * dy).sqrt();
        ((dy * px - dx * py + x2 * y1 - y2 * x1).abs()) / norm
    }
}