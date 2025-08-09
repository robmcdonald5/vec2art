//! Image content analysis utilities for adaptive parameter tuning

use crate::config::{ImageContentAnalysis, ComplexityLevel, ContentDensity, NoiseLevel, ShapeType};
use crate::error::VectorizeResult;
use image::{RgbaImage, GrayImage};

/// Analyze image content to determine adaptive parameters
pub fn analyze_image_content(
    _rgba_image: &RgbaImage,
    grayscale: &GrayImage,
    binary: &[bool],
    dimensions: (u32, u32),
) -> VectorizeResult<ImageContentAnalysis> {
    log::debug!("Analyzing image content for adaptive parameters");

    let (width, height) = dimensions;
    let total_pixels = (width * height) as usize;

    // Basic metrics
    let foreground_pixels = binary.iter().filter(|&&b| b).count();
    let foreground_ratio = foreground_pixels as f64 / total_pixels as f64;

    // Content density analysis
    let content_density = analyze_content_density(foreground_ratio);
    
    // Noise level analysis  
    let noise_level = analyze_noise_level(grayscale, binary, dimensions);
    
    // Complexity analysis
    let complexity_level = analyze_complexity_level(binary, dimensions, foreground_ratio);
    
    // Shape analysis
    let (shape_count_estimate, avg_shape_size_fraction, dominant_shape_types) = 
        analyze_shape_characteristics(binary, dimensions, foreground_pixels);

    log::debug!(
        "Content analysis: complexity={:?}, density={:?}, noise={:?}, shapes={}, avg_size={:.3}",
        complexity_level, content_density, noise_level, shape_count_estimate, avg_shape_size_fraction
    );

    Ok(ImageContentAnalysis {
        complexity_level,
        content_density,
        noise_level,
        shape_count_estimate,
        avg_shape_size_fraction,
        dominant_shape_types,
    })
}

/// Analyze content density based on foreground ratio
fn analyze_content_density(foreground_ratio: f64) -> ContentDensity {
    if foreground_ratio < 0.15 {
        ContentDensity::Sparse
    } else if foreground_ratio < 0.35 {
        ContentDensity::Medium
    } else {
        ContentDensity::Dense
    }
}

/// Analyze noise level using local variance and edge consistency
fn analyze_noise_level(
    grayscale: &GrayImage, 
    binary: &[bool], 
    dimensions: (u32, u32)
) -> NoiseLevel {
    let (width, height) = dimensions;
    
    // Sample local variance in a grid pattern
    let mut variance_samples = Vec::new();
    let grid_size = 8;
    let step_x = width / grid_size;
    let step_y = height / grid_size;
    
    for grid_y in 0..grid_size {
        for grid_x in 0..grid_size {
            let start_x = grid_x * step_x;
            let start_y = grid_y * step_y;
            let end_x = ((grid_x + 1) * step_x).min(width);
            let end_y = ((grid_y + 1) * step_y).min(height);
            
            let variance = calculate_local_variance(grayscale, start_x, start_y, end_x, end_y);
            variance_samples.push(variance);
        }
    }
    
    // Calculate average variance
    let avg_variance = variance_samples.iter().sum::<f64>() / variance_samples.len() as f64;
    
    // Count edge inconsistencies (binary pixels that don't match their neighbors)
    let inconsistency_count = count_edge_inconsistencies(binary, dimensions);
    let inconsistency_ratio = inconsistency_count as f64 / binary.len() as f64;
    
    // Classify noise level based on variance and edge consistency
    if avg_variance > 800.0 || inconsistency_ratio > 0.08 {
        NoiseLevel::High
    } else if avg_variance > 300.0 || inconsistency_ratio > 0.04 {
        NoiseLevel::Medium
    } else {
        NoiseLevel::Low
    }
}

/// Calculate local variance in a region
fn calculate_local_variance(
    grayscale: &GrayImage,
    start_x: u32,
    start_y: u32, 
    end_x: u32,
    end_y: u32
) -> f64 {
    let mut sum = 0.0;
    let mut sum_sq = 0.0;
    let mut count = 0;
    
    for y in start_y..end_y {
        for x in start_x..end_x {
            if let Some(pixel) = grayscale.get_pixel_checked(x, y) {
                let intensity = pixel[0] as f64;
                sum += intensity;
                sum_sq += intensity * intensity;
                count += 1;
            }
        }
    }
    
    if count == 0 {
        return 0.0;
    }
    
    let mean = sum / count as f64;
    let variance = (sum_sq / count as f64) - (mean * mean);
    variance.max(0.0)
}

/// Count pixels that are inconsistent with their neighbors
fn count_edge_inconsistencies(binary: &[bool], dimensions: (u32, u32)) -> usize {
    let (width, height) = dimensions;
    let mut inconsistencies = 0;
    
    for y in 1..height-1 {
        for x in 1..width-1 {
            let idx = (y * width + x) as usize;
            let center = binary[idx];
            
            // Count neighbors with same value
            let mut same_neighbors = 0;
            let mut total_neighbors = 0;
            
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    if dx == 0 && dy == 0 { continue; }
                    
                    let nx = (x as i32 + dx) as u32;
                    let ny = (y as i32 + dy) as u32;
                    
                    if nx < width && ny < height {
                        let nidx = (ny * width + nx) as usize;
                        if binary[nidx] == center {
                            same_neighbors += 1;
                        }
                        total_neighbors += 1;
                    }
                }
            }
            
            // If less than half neighbors agree, mark as inconsistent
            if same_neighbors < total_neighbors / 2 {
                inconsistencies += 1;
            }
        }
    }
    
    inconsistencies
}

/// Analyze complexity level based on binary image characteristics
fn analyze_complexity_level(
    binary: &[bool], 
    dimensions: (u32, u32), 
    foreground_ratio: f64
) -> ComplexityLevel {
    let (width, height) = dimensions;
    
    // Count connected components using a simple flood fill approach
    let mut visited = vec![false; binary.len()];
    let mut component_count = 0;
    let mut component_sizes = Vec::new();
    
    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;
            
            if binary[idx] && !visited[idx] {
                let component_size = flood_fill_count(binary, &mut visited, dimensions, x, y);
                if component_size > 10 { // Filter out tiny noise components
                    component_count += 1;
                    component_sizes.push(component_size);
                }
            }
        }
    }
    
    // Analyze component size distribution
    let avg_component_size = if !component_sizes.is_empty() {
        component_sizes.iter().sum::<usize>() as f64 / component_sizes.len() as f64
    } else {
        0.0
    };
    
    let total_area = (width * height) as f64;
    let avg_component_fraction = avg_component_size / total_area;
    
    // Count boundary pixels (edges between foreground/background)
    let boundary_count = count_boundary_pixels(binary, dimensions);
    let boundary_ratio = boundary_count as f64 / binary.len() as f64;
    
    log::debug!(
        "Complexity metrics: components={}, avg_size_frac={:.4}, boundary_ratio={:.4}, fg_ratio={:.4}",
        component_count, avg_component_fraction, boundary_ratio, foreground_ratio
    );
    
    // Classify complexity based on multiple factors
    if component_count > 20 || boundary_ratio > 0.25 || (component_count > 10 && avg_component_fraction < 0.02) {
        ComplexityLevel::High
    } else if component_count > 8 || boundary_ratio > 0.12 || avg_component_fraction < 0.05 {
        ComplexityLevel::Medium  
    } else {
        ComplexityLevel::Low
    }
}

/// Flood fill to count connected component size
fn flood_fill_count(
    binary: &[bool],
    visited: &mut [bool], 
    dimensions: (u32, u32),
    start_x: u32,
    start_y: u32
) -> usize {
    let (width, height) = dimensions;
    let mut stack = vec![(start_x, start_y)];
    let mut count = 0;
    
    while let Some((x, y)) = stack.pop() {
        if x >= width || y >= height {
            continue;
        }
        
        let idx = (y * width + x) as usize;
        if visited[idx] || !binary[idx] {
            continue;
        }
        
        visited[idx] = true;
        count += 1;
        
        // Add 4-connected neighbors
        if x > 0 { stack.push((x - 1, y)); }
        if x + 1 < width { stack.push((x + 1, y)); }
        if y > 0 { stack.push((x, y - 1)); }
        if y + 1 < height { stack.push((x, y + 1)); }
    }
    
    count
}

/// Count boundary pixels (foreground pixels adjacent to background)
fn count_boundary_pixels(binary: &[bool], dimensions: (u32, u32)) -> usize {
    let (width, height) = dimensions;
    let mut boundary_count = 0;
    
    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;
            
            if binary[idx] {
                // Check if any 4-connected neighbor is background
                let mut is_boundary = false;
                
                for (dx, dy) in [(0, 1), (1, 0), (0, -1), (-1, 0)] {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    
                    if nx < 0 || ny < 0 || nx >= width as i32 || ny >= height as i32 {
                        is_boundary = true; // Image boundary counts
                        break;
                    }
                    
                    let nidx = (ny as u32 * width + nx as u32) as usize;
                    if !binary[nidx] {
                        is_boundary = true;
                        break;
                    }
                }
                
                if is_boundary {
                    boundary_count += 1;
                }
            }
        }
    }
    
    boundary_count
}

/// Analyze shape characteristics and classify types
fn analyze_shape_characteristics(
    binary: &[bool],
    dimensions: (u32, u32), 
    foreground_pixels: usize
) -> (usize, f64, Vec<ShapeType>) {
    let (width, height) = dimensions;
    let total_area = (width * height) as f64;
    
    // Re-use component counting from complexity analysis 
    let mut visited = vec![false; binary.len()];
    let mut component_sizes = Vec::new();
    
    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;
            
            if binary[idx] && !visited[idx] {
                let component_size = flood_fill_count(binary, &mut visited, dimensions, x, y);
                if component_size > 10 {
                    component_sizes.push(component_size);
                }
            }
        }
    }
    
    let shape_count = component_sizes.len();
    
    let avg_shape_size_fraction = if !component_sizes.is_empty() {
        let avg_size = component_sizes.iter().sum::<usize>() as f64 / component_sizes.len() as f64;
        avg_size / total_area
    } else {
        0.0
    };
    
    // For now, classify as geometric shapes (this could be enhanced with more sophisticated analysis)
    let dominant_shape_types = if foreground_pixels > 0 {
        vec![ShapeType::Geometric] // Could analyze aspect ratios, convexity, etc. for better classification
    } else {
        vec![]
    };
    
    (shape_count, avg_shape_size_fraction, dominant_shape_types)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, Luma};

    #[test]
    fn test_content_density_analysis() {
        assert_eq!(analyze_content_density(0.1), ContentDensity::Sparse);
        assert_eq!(analyze_content_density(0.25), ContentDensity::Medium);
        assert_eq!(analyze_content_density(0.5), ContentDensity::Dense);
    }

    #[test]
    fn test_boundary_pixel_counting() {
        // Create a simple 5x5 binary image with a 3x3 filled center
        let binary = vec![
            false, false, false, false, false,
            false, true,  true,  true,  false,
            false, true,  true,  true,  false,
            false, true,  true,  true,  false,
            false, false, false, false, false,
        ];
        
        let boundary_count = count_boundary_pixels(&binary, (5, 5));
        
        // All 9 true pixels should be boundary pixels since they're all on the edge
        assert_eq!(boundary_count, 8); // Only the outer ring of the 3x3 should be boundary
    }

    #[test]
    fn test_flood_fill_count() {
        // Create a simple binary image with one connected component
        let binary = vec![
            false, false, false, false, false,
            false, true,  true,  false, false,
            false, true,  true,  false, false,
            false, false, false, false, false,
            false, false, false, false, false,
        ];
        
        let mut visited = vec![false; binary.len()];
        let count = flood_fill_count(&binary, &mut visited, (5, 5), 1, 1);
        
        assert_eq!(count, 4); // 2x2 connected component
    }
}