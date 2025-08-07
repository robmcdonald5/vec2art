pub mod edge_detector;
pub mod geometric_fitter;
pub mod path_tracer;
pub mod vtracer_wrapper;

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

/// Performance-optimized utilities for all algorithms
pub mod utils {
    use crate::error::Result;
    use image::{DynamicImage, GrayImage, Rgb};

    /// Convert any image to grayscale
    pub fn to_grayscale(image: &DynamicImage) -> GrayImage {
        image.to_luma8()
    }

    /// Apply Gaussian blur to an image with SIMD-ready implementation
    pub fn gaussian_blur(image: &GrayImage, sigma: f32) -> GrayImage {
        // For small sigma, use 3x3 or 5x5 fixed kernels for better performance
        if sigma <= 0.5 {
            return apply_gaussian_3x3(image);
        } else if sigma <= 1.0 {
            return apply_gaussian_5x5(image);
        }
        // Fall back to general implementation for larger sigma
        imageproc::filter::gaussian_blur_f32(image, sigma)
    }

    /// Optimized 3x3 Gaussian blur
    fn apply_gaussian_3x3(image: &GrayImage) -> GrayImage {
        let kernel = [
            1.0 / 16.0,
            2.0 / 16.0,
            1.0 / 16.0,
            2.0 / 16.0,
            4.0 / 16.0,
            2.0 / 16.0,
            1.0 / 16.0,
            2.0 / 16.0,
            1.0 / 16.0,
        ];
        apply_kernel_optimized(image, &kernel, 3)
    }

    /// Optimized 5x5 Gaussian blur
    fn apply_gaussian_5x5(image: &GrayImage) -> GrayImage {
        let kernel = [
            1.0 / 256.0,
            4.0 / 256.0,
            6.0 / 256.0,
            4.0 / 256.0,
            1.0 / 256.0,
            4.0 / 256.0,
            16.0 / 256.0,
            24.0 / 256.0,
            16.0 / 256.0,
            4.0 / 256.0,
            6.0 / 256.0,
            24.0 / 256.0,
            36.0 / 256.0,
            24.0 / 256.0,
            6.0 / 256.0,
            4.0 / 256.0,
            16.0 / 256.0,
            24.0 / 256.0,
            16.0 / 256.0,
            4.0 / 256.0,
            1.0 / 256.0,
            4.0 / 256.0,
            6.0 / 256.0,
            4.0 / 256.0,
            1.0 / 256.0,
        ];
        apply_kernel_optimized(image, &kernel, 5)
    }

    /// Apply convolution kernel with optimization for WASM
    fn apply_kernel_optimized(image: &GrayImage, kernel: &[f32], size: usize) -> GrayImage {
        use image::{GrayImage, Luma};

        let (width, height) = image.dimensions();
        let mut output = GrayImage::new(width, height);
        let offset = size / 2;

        // Process image with boundary handling
        for y in 0..height {
            for x in 0..width {
                let mut sum = 0.0;

                for ky in 0..size {
                    for kx in 0..size {
                        let px = (x as i32 + kx as i32 - offset as i32).clamp(0, width as i32 - 1)
                            as u32;
                        let py = (y as i32 + ky as i32 - offset as i32).clamp(0, height as i32 - 1)
                            as u32;

                        let pixel_value = image.get_pixel(px, py)[0] as f32;
                        sum += pixel_value * kernel[ky * size + kx];
                    }
                }

                output.put_pixel(x, y, Luma([(sum.clamp(0.0, 255.0)) as u8]));
            }
        }

        output
    }

    /// Extract dominant colors from an image using k-means clustering
    pub fn extract_colors(image: &DynamicImage, num_colors: usize) -> Result<Vec<Rgb<u8>>> {
        use palette::{FromColor, IntoColor, Lab, Srgb};

        let pixels: Vec<Lab> = image
            .to_rgb8()
            .pixels()
            .map(|p| {
                let rgb = Srgb::new(
                    p[0] as f32 / 255.0,
                    p[1] as f32 / 255.0,
                    p[2] as f32 / 255.0,
                );
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
                        |acc: Lab<palette::white_point::D65>, c| {
                            Lab::new(acc.l + c.l, acc.a + c.a, acc.b + c.b)
                        },
                    );

                    let count = cluster.len() as f32;
                    centers[idx] = Lab::new(sum.l / count, sum.a / count, sum.b / count);
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

    fn color_distance(a: &palette::Lab, b: &palette::Lab) -> f32 {
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
            if weight_b == 0.0 {
                continue;
            }

            weight_f = total as f64 - weight_b;
            if weight_f == 0.0 {
                break;
            }

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

    /// Simplify path using Visvalingam-Whyatt algorithm (superior for natural curves)
    pub fn simplify_visvalingam_whyatt(&mut self, tolerance: f32) {
        if self.points.len() <= 2 {
            return;
        }

        // Apply node budget management: enforce maximum 2000 nodes per path
        const MAX_NODES_PER_PATH: usize = 2000;
        let max_points = if self.points.len() > MAX_NODES_PER_PATH {
            Some(MAX_NODES_PER_PATH)
        } else {
            None
        };

        self.points = visvalingam_whyatt_simplify(&self.points, tolerance, max_points);
    }

    /// Simplify path using adaptive Visvalingam-Whyatt algorithm
    /// This provides the best quality by preserving high-curvature regions
    pub fn simplify_adaptive(&mut self, base_tolerance: f32, smoothness_factor: f32) {
        if self.points.len() <= 2 {
            return;
        }

        // Apply node budget management: enforce maximum 2000 nodes per path
        const MAX_NODES_PER_PATH: usize = 2000;
        let max_points = if self.points.len() > MAX_NODES_PER_PATH {
            Some(MAX_NODES_PER_PATH)
        } else {
            None
        };

        self.points = adaptive_visvalingam_whyatt_simplify(
            &self.points, 
            base_tolerance,
            smoothness_factor,
            max_points
        );
    }

    /// Smart simplify that automatically chooses the best algorithm and parameters
    /// based on path characteristics and browser performance requirements
    pub fn simplify_smart(&mut self, base_epsilon: f32) {
        if self.points.len() <= 2 {
            return;
        }

        // For browser performance, enforce strict node budget
        const MAX_NODES_PER_PATH: usize = 2000;
        const ADAPTIVE_THRESHOLD: usize = 50; // Use adaptive for complex paths

        if self.points.len() <= ADAPTIVE_THRESHOLD {
            // Simple paths: use Douglas-Peucker
            self.simplify(base_epsilon);
        } else if self.points.len() <= MAX_NODES_PER_PATH {
            // Medium complexity: use Visvalingam-Whyatt with adaptive tolerances
            let smoothness_factor = 2.0; // Moderate curvature sensitivity
            self.simplify_adaptive(base_epsilon, smoothness_factor);
        } else {
            // Complex paths: aggressive simplification with node budget enforcement
            let tolerance = base_epsilon * (self.points.len() as f32 / MAX_NODES_PER_PATH as f32).sqrt();
            self.points = visvalingam_whyatt_simplify(&self.points, tolerance, Some(MAX_NODES_PER_PATH));
        }
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

/// Visvalingam-Whyatt line simplification algorithm with min-heap optimization
/// Superior to Douglas-Peucker for natural curves with O(n log n) performance
pub fn visvalingam_whyatt_simplify(
    points: &[(f32, f32)], 
    tolerance: f32,
    max_points: Option<usize>
) -> Vec<(f32, f32)> {
    use std::cmp::Reverse;
    use std::collections::BinaryHeap;

    if points.len() <= 2 {
        return points.to_vec();
    }

    // Edge case handling for very small tolerances or large max_points
    if tolerance <= 0.0 || max_points.map_or(false, |max| max >= points.len()) {
        return points.to_vec();
    }

    // Initialize data structures for efficient processing
    let mut heap = BinaryHeap::new();
    let mut effective_areas = vec![f32::INFINITY; points.len()];
    let mut removed = vec![false; points.len()];
    let mut prev_indices = (0..points.len()).collect::<Vec<_>>();
    let mut next_indices = (0..points.len()).collect::<Vec<_>>();
    
    // Set up doubly-linked list structure
    for i in 1..points.len() - 1 {
        prev_indices[i] = i - 1;
        next_indices[i] = i + 1;
    }

    // Calculate initial triangle areas for all interior points
    for i in 1..points.len() - 1 {
        let prev_idx = prev_indices[i];
        let next_idx = next_indices[i];
        
        if prev_idx < points.len() && next_idx < points.len() {
            let area = calculate_triangle_area(
                points[prev_idx], 
                points[i], 
                points[next_idx]
            );
            effective_areas[i] = area;
            
            // Use Reverse for min-heap (BinaryHeap is max-heap by default)
            heap.push(Reverse((TriangleArea::new(area), i)));
        }
    }

    // Remove points iteratively using min-heap for efficiency
    while !heap.is_empty() {
        if let Some(Reverse((area_wrapper, index))) = heap.pop() {
            let area = area_wrapper.area;
            
            // Skip if point already removed or area has changed
            if removed[index] || (effective_areas[index] - area).abs() > f32::EPSILON {
                continue;
            }

            // Skip if area is above tolerance and we don't have a point budget
            if max_points.is_none() && area > tolerance {
                break;
            }

            // Don't remove endpoints
            if index == 0 || index == points.len() - 1 {
                continue;
            }

            // Check if we've reached our target point count (only if max_points is specified)
            if let Some(max) = max_points {
                let current_points = removed.iter().filter(|&&r| !r).count();
                if current_points <= max {
                    break;
                }
            }

            // Remove the point
            removed[index] = true;

            // Update linked list structure
            let prev_idx = prev_indices[index];
            let next_idx = next_indices[index];
            
            if prev_idx < points.len() && next_idx < points.len() {
                next_indices[prev_idx] = next_idx;
                prev_indices[next_idx] = prev_idx;

                // Recalculate areas for affected neighbors
                for &neighbor_idx in &[prev_idx, next_idx] {
                    if neighbor_idx > 0 && neighbor_idx < points.len() - 1 && !removed[neighbor_idx] {
                        let neighbor_prev = prev_indices[neighbor_idx];
                        let neighbor_next = next_indices[neighbor_idx];
                        
                        if neighbor_prev < points.len() && neighbor_next < points.len() && 
                           !removed[neighbor_prev] && !removed[neighbor_next] {
                            let new_area = calculate_triangle_area(
                                points[neighbor_prev],
                                points[neighbor_idx],
                                points[neighbor_next]
                            );
                            effective_areas[neighbor_idx] = new_area;
                            heap.push(Reverse((TriangleArea::new(new_area), neighbor_idx)));
                        }
                    }
                }
            }
        }
    }

    // Collect remaining points in order
    let mut result = Vec::new();
    for (i, &point) in points.iter().enumerate() {
        if !removed[i] {
            result.push(point);
        }
    }

    result
}

/// Adaptive simplification that adjusts tolerance based on local curvature
pub fn adaptive_visvalingam_whyatt_simplify(
    points: &[(f32, f32)], 
    base_tolerance: f32,
    smoothness_factor: f32,
    max_points: Option<usize>
) -> Vec<(f32, f32)> {
    if points.len() <= 2 {
        return points.to_vec();
    }

    // Calculate local curvature for each point
    let curvatures = calculate_local_curvature(points);
    
    // Calculate adaptive tolerances
    let adaptive_tolerances = calculate_adaptive_tolerances(
        &curvatures, 
        base_tolerance, 
        smoothness_factor
    );

    // Apply Visvalingam-Whyatt with position-specific tolerances
    visvalingam_whyatt_adaptive_tolerances(points, &adaptive_tolerances, max_points)
}

/// Calculate local curvature at each point using discrete curvature estimation
fn calculate_local_curvature(points: &[(f32, f32)]) -> Vec<f32> {
    let mut curvatures = vec![0.0; points.len()];
    
    // Calculate curvature for interior points
    for i in 1..points.len() - 1 {
        let p1 = points[i - 1];
        let p2 = points[i];
        let p3 = points[i + 1];
        
        // Use discrete curvature approximation
        let curvature = discrete_curvature(p1, p2, p3);
        curvatures[i] = curvature;
    }
    
    // Set endpoint curvatures to neighbor values
    if points.len() > 2 {
        curvatures[0] = curvatures[1];
        curvatures[points.len() - 1] = curvatures[points.len() - 2];
    }
    
    curvatures
}

/// Calculate discrete curvature using the Menger curvature formula
fn discrete_curvature(p1: (f32, f32), p2: (f32, f32), p3: (f32, f32)) -> f32 {
    // Triangle area method for curvature estimation
    let area = calculate_triangle_area(p1, p2, p3);
    
    // Calculate side lengths
    let a = ((p2.0 - p3.0).powi(2) + (p2.1 - p3.1).powi(2)).sqrt();
    let b = ((p1.0 - p3.0).powi(2) + (p1.1 - p3.1).powi(2)).sqrt();
    let c = ((p1.0 - p2.0).powi(2) + (p1.1 - p2.1).powi(2)).sqrt();
    
    // Menger curvature: κ = 4 * Area / (a * b * c)
    if a > 0.0 && b > 0.0 && c > 0.0 {
        4.0 * area / (a * b * c)
    } else {
        0.0
    }
}

/// Calculate adaptive tolerances based on curvature
fn calculate_adaptive_tolerances(
    curvatures: &[f32], 
    base_tolerance: f32,
    smoothness_factor: f32
) -> Vec<f32> {
    curvatures.iter().map(|&curvature| {
        // Higher curvature = lower tolerance (preserve more points)
        // Lower curvature = higher tolerance (remove more points)
        base_tolerance * (1.0 + smoothness_factor) / (1.0 + curvature * smoothness_factor)
    }).collect()
}

/// Visvalingam-Whyatt with position-specific tolerances for adaptive behavior
fn visvalingam_whyatt_adaptive_tolerances(
    points: &[(f32, f32)],
    tolerances: &[f32],
    max_points: Option<usize>
) -> Vec<(f32, f32)> {
    use std::cmp::Reverse;
    use std::collections::BinaryHeap;

    if points.len() <= 2 {
        return points.to_vec();
    }

    let mut heap = BinaryHeap::new();
    let mut effective_areas = vec![f32::INFINITY; points.len()];
    let mut removed = vec![false; points.len()];
    let mut prev_indices = (0..points.len()).collect::<Vec<_>>();
    let mut next_indices = (0..points.len()).collect::<Vec<_>>();
    
    // Set up doubly-linked list structure
    for i in 1..points.len() - 1 {
        prev_indices[i] = i - 1;
        next_indices[i] = i + 1;
    }

    // Calculate initial triangle areas
    for i in 1..points.len() - 1 {
        let prev_idx = prev_indices[i];
        let next_idx = next_indices[i];
        
        if prev_idx < points.len() && next_idx < points.len() {
            let area = calculate_triangle_area(
                points[prev_idx], 
                points[i], 
                points[next_idx]
            );
            effective_areas[i] = area;
            heap.push(Reverse((TriangleArea::new(area), i)));
        }
    }

    // Remove points based on both area and local tolerance
    while !heap.is_empty() {
        if let Some(Reverse((area_wrapper, index))) = heap.pop() {
            let area = area_wrapper.area;
            
            if removed[index] || (effective_areas[index] - area).abs() > f32::EPSILON {
                continue;
            }

            // Check against local tolerance for adaptive behavior
            let local_tolerance = tolerances.get(index).copied().unwrap_or(f32::INFINITY);
            if max_points.is_none() && area > local_tolerance {
                continue;
            }

            if index == 0 || index == points.len() - 1 {
                continue;
            }

            // Check if we've reached our target point count (only if max_points is specified)
            if let Some(max) = max_points {
                let current_points = removed.iter().filter(|&&r| !r).count();
                if current_points <= max {
                    break;
                }
            }

            // Remove the point and update structure
            removed[index] = true;
            let prev_idx = prev_indices[index];
            let next_idx = next_indices[index];
            
            if prev_idx < points.len() && next_idx < points.len() {
                next_indices[prev_idx] = next_idx;
                prev_indices[next_idx] = prev_idx;

                // Recalculate areas for neighbors
                for &neighbor_idx in &[prev_idx, next_idx] {
                    if neighbor_idx > 0 && neighbor_idx < points.len() - 1 && !removed[neighbor_idx] {
                        let neighbor_prev = prev_indices[neighbor_idx];
                        let neighbor_next = next_indices[neighbor_idx];
                        
                        if neighbor_prev < points.len() && neighbor_next < points.len() && 
                           !removed[neighbor_prev] && !removed[neighbor_next] {
                            let new_area = calculate_triangle_area(
                                points[neighbor_prev],
                                points[neighbor_idx],
                                points[neighbor_next]
                            );
                            effective_areas[neighbor_idx] = new_area;
                            heap.push(Reverse((TriangleArea::new(new_area), neighbor_idx)));
                        }
                    }
                }
            }
        }
    }

    // Collect remaining points
    let mut result = Vec::new();
    for (i, &point) in points.iter().enumerate() {
        if !removed[i] {
            result.push(point);
        }
    }

    result
}

/// Calculate triangle area using the cross product method
fn calculate_triangle_area(p1: (f32, f32), p2: (f32, f32), p3: (f32, f32)) -> f32 {
    // Using cross product formula: |AB × AC| / 2
    let ab = (p2.0 - p1.0, p2.1 - p1.1);
    let ac = (p3.0 - p1.0, p3.1 - p1.1);
    let cross_product = ab.0 * ac.1 - ab.1 * ac.0;
    cross_product.abs() * 0.5
}

/// Wrapper for triangle area that implements Ord for min-heap usage
#[derive(Debug, Clone, Copy, PartialEq)]
struct TriangleArea {
    area: f32,
}

impl TriangleArea {
    fn new(area: f32) -> Self {
        Self { area }
    }
}

impl Eq for TriangleArea {}

impl PartialOrd for TriangleArea {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.area.partial_cmp(&other.area)
    }
}

impl Ord for TriangleArea {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Handle NaN and infinity cases properly
        self.partial_cmp(other).unwrap_or(std::cmp::Ordering::Equal)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_triangle_area_calculation() {
        // Test triangle area calculation
        let p1 = (0.0, 0.0);
        let p2 = (3.0, 0.0);
        let p3 = (0.0, 4.0);
        
        let area = calculate_triangle_area(p1, p2, p3);
        assert!((area - 6.0).abs() < f32::EPSILON, "Expected area 6.0, got {}", area);
        
        // Test degenerate triangle (collinear points)
        let area_collinear = calculate_triangle_area(p1, (1.0, 0.0), (2.0, 0.0));
        assert!(area_collinear.abs() < f32::EPSILON, "Collinear points should have zero area");
    }

    #[test]
    fn test_visvalingam_whyatt_simplification() {
        // Create a test path with known characteristics
        let points = vec![
            (0.0, 0.0),   // Start
            (1.0, 0.1),   // Small deviation - should be removed first
            (2.0, 0.0),   // Back on line
            (3.0, 1.0),   // Significant turn - should be preserved
            (4.0, 0.9),   // Small deviation - should be removed
            (5.0, 1.0),   // End of turn
            (6.0, 1.0),   // End point
        ];

        // Test basic simplification
        let simplified = visvalingam_whyatt_simplify(&points, 0.1, None);
        
        // Should remove small deviations but preserve significant turns
        assert!(simplified.len() < points.len(), "Should reduce point count");
        assert!(simplified.len() >= 4, "Should preserve essential structure");
        
        // First and last points should always be preserved
        assert_eq!(simplified[0], points[0], "First point should be preserved");
        assert_eq!(simplified[simplified.len() - 1], points[points.len() - 1], "Last point should be preserved");
    }

    #[test]
    fn test_adaptive_simplification() {
        // Create a path with varying curvature
        let mut points = Vec::new();
        
        // Straight line segment (low curvature)
        for i in 0..10 {
            points.push((i as f32, 0.0));
        }
        
        // Curved segment (high curvature) - semicircle
        for i in 0..10 {
            let angle = i as f32 * std::f32::consts::PI / 10.0;
            points.push((10.0 + angle.cos(), angle.sin()));
        }
        
        // Another straight segment
        for i in 0..10 {
            points.push((11.0 + i as f32, 0.0));
        }

        let base_tolerance = 0.1;
        let smoothness_factor = 2.0;
        
        let adaptive_simplified = adaptive_visvalingam_whyatt_simplify(
            &points, 
            base_tolerance, 
            smoothness_factor,
            None
        );
        
        let regular_simplified = visvalingam_whyatt_simplify(&points, base_tolerance, None);
        
        // Adaptive should preserve more detail in curved regions
        // This is a heuristic test - exact counts may vary
        assert!(adaptive_simplified.len() > 6, "Should preserve essential structure");
        println!("Original: {}, Regular: {}, Adaptive: {}", 
                points.len(), regular_simplified.len(), adaptive_simplified.len());
    }

    #[test]
    fn test_node_budget_enforcement() {
        // Create a very large path
        let mut large_path = Vec::new();
        for i in 0..5000 {
            // Add some noise to prevent trivial simplification
            let noise = (i as f32 * 0.1).sin() * 0.01;
            large_path.push((i as f32, noise));
        }

        // Test with node budget
        let max_nodes = 2000;
        let simplified = visvalingam_whyatt_simplify(&large_path, 0.001, Some(max_nodes));
        
        assert!(simplified.len() <= max_nodes, 
               "Should enforce node budget: got {} nodes, expected <= {}", 
               simplified.len(), max_nodes);
        assert!(simplified.len() > max_nodes / 2, 
               "Should use most of the node budget");
    }

    #[test]
    fn test_curvature_calculation() {
        // Test high curvature (sharp turn)
        let sharp_turn = discrete_curvature((0.0, 0.0), (1.0, 0.0), (1.0, 1.0));
        
        // Test low curvature (straight line)
        let straight_line = discrete_curvature((0.0, 0.0), (1.0, 0.0), (2.0, 0.0));
        
        assert!(sharp_turn > straight_line, 
               "Sharp turn should have higher curvature than straight line");
        assert!(straight_line.abs() < 0.001, 
               "Straight line should have near-zero curvature");
    }

    #[test]
    fn test_smart_simplification_selection() {
        // Test small path (should use Douglas-Peucker)
        let small_path: Vec<(f32, f32)> = (0..20).map(|i| (i as f32, 0.0)).collect();
        let mut small_svg_path = SvgPath::new();
        small_svg_path.points = small_path.clone();
        let original_len = small_svg_path.points.len();
        
        small_svg_path.simplify_smart(1.0);
        assert!(small_svg_path.points.len() < original_len, "Should simplify small path");

        // Test medium path (should use adaptive Visvalingam-Whyatt)
        let medium_path: Vec<(f32, f32)> = (0..200).map(|i| {
            let x = i as f32;
            let y = (i as f32 * 0.1).sin(); // Wavy line
            (x, y)
        }).collect();
        
        let mut medium_svg_path = SvgPath::new();
        medium_svg_path.points = medium_path.clone();
        let original_len = medium_svg_path.points.len();
        
        medium_svg_path.simplify_smart(0.1);
        assert!(medium_svg_path.points.len() < original_len, "Should simplify medium path");

        // Test large path (should enforce node budget)
        let large_path: Vec<(f32, f32)> = (0..3000).map(|i| {
            let x = i as f32;
            let y = (i as f32 * 0.01).sin() * 10.0; // Complex curve
            (x, y)
        }).collect();
        
        let mut large_svg_path = SvgPath::new();
        large_svg_path.points = large_path;
        
        large_svg_path.simplify_smart(0.1);
        assert!(large_svg_path.points.len() <= 2000, 
               "Should enforce node budget for large paths");
    }

    #[test]
    fn test_algorithm_correctness_comparison() {
        // Create a test curve that benefits from Visvalingam-Whyatt
        let mut curve_points = Vec::new();
        for i in 0..100 {
            let t = i as f32 / 100.0 * 2.0 * std::f32::consts::PI;
            // Spiral with noise
            let r = 1.0 + t * 0.1;
            let noise = (t * 10.0).sin() * 0.02;
            curve_points.push((r * t.cos() + noise, r * t.sin() + noise));
        }

        // Compare algorithms
        let douglas_peucker_result = douglas_peucker(&curve_points, 0.1);
        let visvalingam_result = visvalingam_whyatt_simplify(&curve_points, 0.1, None);
        let adaptive_result = adaptive_visvalingam_whyatt_simplify(&curve_points, 0.1, 1.5, None);

        // All should reduce the point count
        assert!(douglas_peucker_result.len() < curve_points.len());
        assert!(visvalingam_result.len() < curve_points.len());
        assert!(adaptive_result.len() < curve_points.len());

        // All should preserve endpoints
        assert_eq!(douglas_peucker_result[0], curve_points[0]);
        assert_eq!(visvalingam_result[0], curve_points[0]);
        assert_eq!(adaptive_result[0], curve_points[0]);

        let last_idx = curve_points.len() - 1;
        assert_eq!(douglas_peucker_result[douglas_peucker_result.len() - 1], curve_points[last_idx]);
        assert_eq!(visvalingam_result[visvalingam_result.len() - 1], curve_points[last_idx]);
        assert_eq!(adaptive_result[adaptive_result.len() - 1], curve_points[last_idx]);

        println!("Original: {}, Douglas-Peucker: {}, Visvalingam: {}, Adaptive: {}", 
                curve_points.len(), 
                douglas_peucker_result.len(), 
                visvalingam_result.len(), 
                adaptive_result.len());
    }

    #[test]
    fn test_edge_cases() {
        // Test empty path
        let empty_result = visvalingam_whyatt_simplify(&[], 1.0, None);
        assert_eq!(empty_result.len(), 0);

        // Test single point
        let single_point = vec![(1.0, 1.0)];
        let single_result = visvalingam_whyatt_simplify(&single_point, 1.0, None);
        assert_eq!(single_result, single_point);

        // Test two points
        let two_points = vec![(0.0, 0.0), (1.0, 1.0)];
        let two_result = visvalingam_whyatt_simplify(&two_points, 1.0, None);
        assert_eq!(two_result, two_points);

        // Test zero tolerance
        let test_points = vec![(0.0, 0.0), (0.5, 0.1), (1.0, 0.0)];
        let zero_tolerance_result = visvalingam_whyatt_simplify(&test_points, 0.0, None);
        assert_eq!(zero_tolerance_result, test_points, "Zero tolerance should preserve all points");
    }
}
