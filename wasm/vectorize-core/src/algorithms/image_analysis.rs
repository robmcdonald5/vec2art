//! Image content analysis utilities for adaptive parameter tuning

use crate::config::{ImageContentAnalysis, ComplexityLevel, ContentDensity, NoiseLevel, ShapeType};
use crate::error::VectorizeResult;
use image::{RgbaImage, GrayImage};

/// Analyze photographic image content for regions mode adaptive parameters
pub fn analyze_regions_image_content(
    rgba_image: &RgbaImage,
    dimensions: (u32, u32),
) -> VectorizeResult<ImageContentAnalysis> {
    log::debug!("Analyzing photographic image content for regions adaptive parameters");

    let (width, height) = dimensions;
    let _total_pixels = (width * height) as usize;

    // Convert to LAB for better color analysis
    let lab_colors: Vec<(f32, f32, f32)> = rgba_image
        .pixels()
        .map(|&pixel| {
            let [r, g, b, _] = pixel.0;
            rgb_to_lab(r, g, b)
        })
        .collect();

    // Analyze color diversity and complexity
    let color_complexity = analyze_color_complexity(&lab_colors);
    let edge_density = analyze_edge_density(rgba_image);
    let texture_complexity = analyze_texture_complexity(rgba_image, dimensions);

    // Determine complexity level based on photographic characteristics
    let complexity_level = if color_complexity > 0.8 || edge_density > 0.3 || texture_complexity > 0.7 {
        ComplexityLevel::High
    } else if color_complexity > 0.5 || edge_density > 0.15 || texture_complexity > 0.4 {
        ComplexityLevel::Medium
    } else {
        ComplexityLevel::Low
    };

    // Content density for photographic images
    let content_density = analyze_photographic_density(&lab_colors, edge_density);
    
    // Noise level for photographic images
    let noise_level = analyze_photographic_noise(rgba_image, dimensions);

    // Estimate superpixel regions (different from logo shapes)
    let estimated_regions = estimate_natural_regions(color_complexity, edge_density, dimensions);
    let avg_region_size = 1.0 / estimated_regions.max(1.0);

    log::debug!(
        "Regions content analysis: complexity={:?}, density={:?}, noise={:?}, estimated_regions={:.1}",
        complexity_level, content_density, noise_level, estimated_regions
    );

    Ok(ImageContentAnalysis {
        complexity_level,
        content_density,
        noise_level,
        shape_count_estimate: estimated_regions as usize,
        avg_shape_size_fraction: avg_region_size,
        dominant_shape_types: vec![ShapeType::Organic], // Photos typically contain organic shapes
    })
}

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

/// RGB to LAB color conversion
fn rgb_to_lab(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    // Convert RGB to XYZ first
    let r = (r as f32 / 255.0).powf(2.2);
    let g = (g as f32 / 255.0).powf(2.2);
    let b = (b as f32 / 255.0).powf(2.2);
    
    let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    let z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    
    // Convert XYZ to LAB
    let xn = 0.95047; // D65 illuminant
    let yn = 1.0;
    let zn = 1.08883;
    
    let fx = lab_f(x / xn);
    let fy = lab_f(y / yn);
    let fz = lab_f(z / zn);
    
    let l = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b_lab = 200.0 * (fy - fz);
    
    (l, a, b_lab)
}

fn lab_f(t: f32) -> f32 {
    if t > 0.008856 {
        t.powf(1.0 / 3.0)
    } else {
        (903.3 * t + 16.0) / 116.0
    }
}

/// Analyze color complexity using LAB color variance
fn analyze_color_complexity(lab_colors: &[(f32, f32, f32)]) -> f64 {
    if lab_colors.is_empty() {
        return 0.0;
    }

    // Calculate variance in LAB space
    let mean_l = lab_colors.iter().map(|&(l, _, _)| l as f64).sum::<f64>() / lab_colors.len() as f64;
    let mean_a = lab_colors.iter().map(|&(_, a, _)| a as f64).sum::<f64>() / lab_colors.len() as f64;
    let mean_b = lab_colors.iter().map(|&(_, _, b)| b as f64).sum::<f64>() / lab_colors.len() as f64;
    
    let var_l = lab_colors.iter()
        .map(|&(l, _, _)| (l as f64 - mean_l).powi(2))
        .sum::<f64>() / lab_colors.len() as f64;
    let var_a = lab_colors.iter()
        .map(|&(_, a, _)| (a as f64 - mean_a).powi(2))
        .sum::<f64>() / lab_colors.len() as f64;
    let var_b = lab_colors.iter()
        .map(|&(_, _, b)| (b as f64 - mean_b).powi(2))
        .sum::<f64>() / lab_colors.len() as f64;
    
    // Normalize complexity score (0-1 range)
    let total_variance = var_l + var_a + var_b;
    (total_variance / 10000.0).min(1.0) // Empirically determined normalization
}

/// Analyze edge density using simple gradient magnitude
fn analyze_edge_density(rgba_image: &RgbaImage) -> f64 {
    let (width, height) = rgba_image.dimensions();
    let mut edge_count = 0;
    let mut total_pixels = 0;
    
    // Simple Sobel-like edge detection
    for y in 1..height-1 {
        for x in 1..width-1 {
            let center = rgba_image.get_pixel(x, y);
            let right = rgba_image.get_pixel(x + 1, y);
            let down = rgba_image.get_pixel(x, y + 1);
            
            // Calculate gradient magnitude in grayscale
            let center_gray = (center[0] as f32 * 0.299 + center[1] as f32 * 0.587 + center[2] as f32 * 0.114) as i32;
            let right_gray = (right[0] as f32 * 0.299 + right[1] as f32 * 0.587 + right[2] as f32 * 0.114) as i32;
            let down_gray = (down[0] as f32 * 0.299 + down[1] as f32 * 0.587 + down[2] as f32 * 0.114) as i32;
            
            let gx = right_gray - center_gray;
            let gy = down_gray - center_gray;
            let magnitude = ((gx * gx + gy * gy) as f32).sqrt();
            
            if magnitude > 20.0 { // Threshold for edge detection
                edge_count += 1;
            }
            total_pixels += 1;
        }
    }
    
    if total_pixels == 0 {
        0.0
    } else {
        edge_count as f64 / total_pixels as f64
    }
}

/// Analyze texture complexity using local standard deviation
fn analyze_texture_complexity(rgba_image: &RgbaImage, dimensions: (u32, u32)) -> f64 {
    let (width, height) = dimensions;
    let window_size = 5;
    let half_window = window_size / 2;
    
    let mut texture_values = Vec::new();
    
    // Sample texture in a grid pattern for performance
    let step = (width.min(height) / 20).max(5);
    
    for y in (half_window..height - half_window).step_by(step as usize) {
        for x in (half_window..width - half_window).step_by(step as usize) {
            let local_std = calculate_local_std_dev(rgba_image, x, y, window_size);
            texture_values.push(local_std);
        }
    }
    
    if texture_values.is_empty() {
        return 0.0;
    }
    
    // Average local standard deviation as texture measure
    let avg_texture = texture_values.iter().sum::<f64>() / texture_values.len() as f64;
    (avg_texture / 50.0).min(1.0) // Normalize to 0-1 range
}

/// Calculate local standard deviation in a window
fn calculate_local_std_dev(rgba_image: &RgbaImage, center_x: u32, center_y: u32, window_size: u32) -> f64 {
    let half_window = (window_size / 2) as i32;
    let mut values = Vec::new();
    
    for dy in -half_window..=half_window {
        for dx in -half_window..=half_window {
            let x = (center_x as i32 + dx) as u32;
            let y = (center_y as i32 + dy) as u32;
            
            if let Some(pixel) = rgba_image.get_pixel_checked(x, y) {
                let gray = (pixel[0] as f32 * 0.299 + pixel[1] as f32 * 0.587 + pixel[2] as f32 * 0.114) as f64;
                values.push(gray);
            }
        }
    }
    
    if values.len() < 2 {
        return 0.0;
    }
    
    let mean = values.iter().sum::<f64>() / values.len() as f64;
    let variance = values.iter().map(|&v| (v - mean).powi(2)).sum::<f64>() / values.len() as f64;
    variance.sqrt()
}

/// Analyze photographic density based on color and edge characteristics
fn analyze_photographic_density(_lab_colors: &[(f32, f32, f32)], edge_density: f64) -> ContentDensity {
    // For photographic images, density is based on edge density and color variation
    if edge_density > 0.25 {
        ContentDensity::Dense
    } else if edge_density > 0.12 {
        ContentDensity::Medium
    } else {
        ContentDensity::Sparse
    }
}

/// Analyze photographic noise using local variance
fn analyze_photographic_noise(rgba_image: &RgbaImage, dimensions: (u32, u32)) -> NoiseLevel {
    let (width, height) = dimensions;
    let mut noise_samples = Vec::new();
    
    // Sample noise in smooth areas (avoiding edges)
    let step = (width.min(height) / 16).max(8);
    let window_size = 5;
    
    for y in (window_size..height - window_size).step_by(step as usize) {
        for x in (window_size..width - window_size).step_by(step as usize) {
            // Check if this is a smooth area (low local gradient)
            if is_smooth_area(rgba_image, x, y, window_size) {
                let local_noise = calculate_local_std_dev(rgba_image, x, y, window_size);
                noise_samples.push(local_noise);
            }
        }
    }
    
    if noise_samples.is_empty() {
        return NoiseLevel::Low;
    }
    
    let avg_noise = noise_samples.iter().sum::<f64>() / noise_samples.len() as f64;
    
    if avg_noise > 15.0 {
        NoiseLevel::High
    } else if avg_noise > 8.0 {
        NoiseLevel::Medium
    } else {
        NoiseLevel::Low
    }
}

/// Check if an area is smooth (low gradient)
fn is_smooth_area(rgba_image: &RgbaImage, center_x: u32, center_y: u32, window_size: u32) -> bool {
    let half_window = (window_size / 2) as i32;
    let mut gradients = Vec::new();
    
    for dy in -half_window..half_window {
        for dx in -half_window..half_window {
            let x1 = (center_x as i32 + dx) as u32;
            let y1 = (center_y as i32 + dy) as u32;
            let x2 = (center_x as i32 + dx + 1) as u32;
            let y2 = (center_y as i32 + dy + 1) as u32;
            
            if let (Some(p1), Some(p2)) = (rgba_image.get_pixel_checked(x1, y1), rgba_image.get_pixel_checked(x2, y2)) {
                let g1 = p1[0] as f32 * 0.299 + p1[1] as f32 * 0.587 + p1[2] as f32 * 0.114;
                let g2 = p2[0] as f32 * 0.299 + p2[1] as f32 * 0.587 + p2[2] as f32 * 0.114;
                gradients.push((g1 - g2).abs());
            }
        }
    }
    
    if gradients.is_empty() {
        return false;
    }
    
    let avg_gradient = gradients.iter().sum::<f32>() / gradients.len() as f32;
    avg_gradient < 10.0 // Threshold for smooth area
}

/// Estimate natural regions in photographic content
fn estimate_natural_regions(color_complexity: f64, edge_density: f64, dimensions: (u32, u32)) -> f64 {
    let (width, height) = dimensions;
    let image_area = (width * height) as f64;
    
    // Base estimate from image size (typical superpixel density)
    let base_regions = (image_area / 2000.0).sqrt(); // ~2000 pixels per region base
    
    // Adjust based on complexity
    let complexity_factor = 0.5 + color_complexity * 1.5; // Range: 0.5 to 2.0
    let edge_factor = 0.7 + edge_density * 1.5; // Range: 0.7 to 2.2
    
    let estimated_regions = base_regions * complexity_factor * edge_factor;
    
    // Reasonable bounds for region count
    estimated_regions.clamp(5.0, 200.0)
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