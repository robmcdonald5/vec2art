//! Advanced color processing utilities for line tracing backends
//!
//! This module provides sophisticated color sampling strategies for preserving
//! color information in vectorized line art, supporting multiple approaches
//! from simple dominant color to complex gradient-based sampling.

use crate::algorithms::Point;
use crate::algorithms::simd_color::{simd_k_means_palette_reduction, simd_analyze_gradient_strength, is_simd_available};
use image::Rgba;

/// Color sampling method determines how colors are extracted from paths
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum ColorSamplingMethod {
    /// Single dominant color per path (fastest, basic)
    DominantColor,
    /// Color transitions along paths based on intensity changes
    GradientMapping,
    /// Content-aware color analysis with edge detection
    ContentAware,
    /// Automatically choose method based on content analysis
    Adaptive,
}

/// Detailed color information for a path segment
#[derive(Debug, Clone)]
pub struct PathColorInfo {
    /// Primary color as hex string "#RRGGBB"
    pub primary_color: String,
    /// Optional secondary color for gradient effects
    pub secondary_color: Option<String>,
    /// Confidence in color accuracy (0.0-1.0)
    pub color_confidence: f32,
    /// Sample points used for color extraction
    pub sample_points: Vec<ColorSample>,
}

/// Individual color sample with position and color information
#[derive(Debug, Clone, PartialEq)]
pub struct ColorSample {
    /// Position along the path (0.0-1.0)
    pub position: f32,
    /// Color at this position
    pub color: Rgba<u8>,
    /// Weight/importance of this sample
    pub weight: f32,
}

/// Advanced color extraction from polyline paths
pub fn extract_path_colors(
    path: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    method: ColorSamplingMethod,
    accuracy: f32,
    tolerance: f32,
) -> PathColorInfo {
    match method {
        ColorSamplingMethod::DominantColor => extract_dominant_color(
            path, color_map, image_width, image_height, accuracy
        ),
        ColorSamplingMethod::GradientMapping => extract_gradient_colors(
            path, color_map, image_width, image_height, accuracy, tolerance
        ),
        ColorSamplingMethod::ContentAware => extract_content_aware_colors(
            path, color_map, image_width, image_height, accuracy, tolerance
        ),
        ColorSamplingMethod::Adaptive => extract_adaptive_colors(
            path, color_map, image_width, image_height, accuracy, tolerance
        ),
    }
}

/// Extract single dominant color (existing behavior, enhanced)
fn extract_dominant_color(
    path: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    accuracy: f32,
) -> PathColorInfo {
    if path.is_empty() || color_map.is_empty() {
        return PathColorInfo {
            primary_color: "#000000".to_string(),
            secondary_color: None,
            color_confidence: 0.0,
            sample_points: Vec::new(),
        };
    }

    // Adaptive sampling based on accuracy setting
    let base_samples = if accuracy > 0.8 { 7 } else if accuracy > 0.5 { 5 } else { 3 };
    let sample_count = ((path.len() as f32 * accuracy).round() as usize / 3)
        .max(1)
        .min(base_samples);
        
    let mut color_samples = Vec::with_capacity(sample_count);
    let mut sample_points = Vec::with_capacity(sample_count);
    
    for i in 0..sample_count {
        let t = i as f32 / (sample_count - 1).max(1) as f32;
        let idx = (t * (path.len() - 1) as f32).round() as usize;
        let point = &path[idx];
        
        if let Some(color) = sample_color_at_point(point, color_map, image_width, image_height) {
            color_samples.push(color);
            sample_points.push(ColorSample {
                position: t,
                color,
                weight: 1.0,
            });
        }
    }
    
    if color_samples.is_empty() {
        return PathColorInfo {
            primary_color: "#000000".to_string(),
            secondary_color: None,
            color_confidence: 0.0,
            sample_points: Vec::new(),
        };
    }
    
    // Calculate weighted average
    let dominant_color = calculate_weighted_average(&color_samples, &[1.0; 10]);
    let confidence = calculate_color_confidence(&color_samples);
    
    PathColorInfo {
        primary_color: rgba_to_hex(&dominant_color),
        secondary_color: None,
        color_confidence: confidence,
        sample_points,
    }
}

/// Extract gradient-based colors with start/end color analysis
fn extract_gradient_colors(
    path: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    accuracy: f32,
    tolerance: f32,
) -> PathColorInfo {
    if path.len() < 2 {
        return extract_dominant_color(path, color_map, image_width, image_height, accuracy);
    }

    let sample_count = ((path.len() as f32 * accuracy * 0.5).round() as usize)
        .max(3)
        .min(12);
        
    let mut sample_points = Vec::with_capacity(sample_count);
    
    // Sample evenly along the path
    for i in 0..sample_count {
        let t = i as f32 / (sample_count - 1) as f32;
        let idx = (t * (path.len() - 1) as f32).round() as usize;
        let point = &path[idx];
        
        if let Some(color) = sample_color_at_point(point, color_map, image_width, image_height) {
            sample_points.push(ColorSample {
                position: t,
                color,
                weight: 1.0,
            });
        }
    }
    
    if sample_points.len() < 2 {
        return extract_dominant_color(path, color_map, image_width, image_height, accuracy);
    }
    
    // Analyze color variation along path
    let start_colors: Vec<_> = sample_points.iter().take(3).collect();
    let end_colors: Vec<_> = sample_points.iter().rev().take(3).collect();
    
    let start_avg = calculate_weighted_average(
        &start_colors.iter().map(|s| s.color).collect::<Vec<_>>(),
        &[1.0; 3]
    );
    let end_avg = calculate_weighted_average(
        &end_colors.iter().map(|s| s.color).collect::<Vec<_>>(),
        &[1.0; 3]
    );
    
    // Use SIMD gradient analysis if available for more accurate detection
    let gradient_strengths = if is_simd_available() && sample_points.len() >= 3 {
        let colors: Vec<_> = sample_points.iter().map(|s| s.color).collect();
        simd_analyze_gradient_strength(&colors, tolerance * 10.0)
    } else {
        Vec::new()
    };
    
    // Check if gradient is significant enough
    let color_distance = calculate_color_distance(&start_avg, &end_avg);
    let has_gradient = if !gradient_strengths.is_empty() {
        gradient_strengths.iter().any(|&strength| strength > tolerance * 50.0)
    } else {
        color_distance > tolerance * 100.0 // Scale tolerance for Delta E
    };
    
    let confidence = calculate_color_confidence(
        &sample_points.iter().map(|s| s.color).collect::<Vec<_>>()
    );
    
    PathColorInfo {
        primary_color: rgba_to_hex(&start_avg),
        secondary_color: if has_gradient { 
            Some(rgba_to_hex(&end_avg)) 
        } else { 
            None 
        },
        color_confidence: confidence,
        sample_points,
    }
}

/// Content-aware color extraction with edge analysis
fn extract_content_aware_colors(
    path: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    accuracy: f32,
    tolerance: f32,
) -> PathColorInfo {
    // For now, use gradient method with enhanced sampling
    // TODO: Implement actual content-aware analysis with edge detection
    extract_gradient_colors(path, color_map, image_width, image_height, accuracy, tolerance)
}

/// Adaptive color extraction - chooses best method based on content
fn extract_adaptive_colors(
    path: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    accuracy: f32,
    tolerance: f32,
) -> PathColorInfo {
    if path.len() < 5 {
        // Short paths use dominant color
        return extract_dominant_color(path, color_map, image_width, image_height, accuracy);
    }
    
    // Quick analysis to determine best method
    let quick_samples = 5;
    let mut colors = Vec::new();
    
    for i in 0..quick_samples {
        let t = i as f32 / (quick_samples - 1) as f32;
        let idx = (t * (path.len() - 1) as f32).round() as usize;
        let point = &path[idx];
        
        if let Some(color) = sample_color_at_point(point, color_map, image_width, image_height) {
            colors.push(color);
        }
    }
    
    if colors.len() < 2 {
        return extract_dominant_color(path, color_map, image_width, image_height, accuracy);
    }
    
    // Analyze color variation
    let color_variance = calculate_color_variance(&colors);
    
    if color_variance > tolerance * 50.0 {
        // High variation - use gradient method
        extract_gradient_colors(path, color_map, image_width, image_height, accuracy, tolerance)
    } else {
        // Low variation - use dominant color
        extract_dominant_color(path, color_map, image_width, image_height, accuracy)
    }
}

/// Sample color at a specific point with bounds checking
fn sample_color_at_point(
    point: &Point,
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
) -> Option<Rgba<u8>> {
    let x = point.x.round() as u32;
    let y = point.y.round() as u32;
    
    if x < image_width && y < image_height {
        let pixel_idx = (y * image_width + x) as usize;
        if pixel_idx < color_map.len() {
            return Some(color_map[pixel_idx]);
        }
    }
    None
}

/// Calculate weighted average of colors
fn calculate_weighted_average(colors: &[Rgba<u8>], weights: &[f32]) -> Rgba<u8> {
    if colors.is_empty() {
        return Rgba([0, 0, 0, 255]);
    }
    
    let mut r_sum = 0.0;
    let mut g_sum = 0.0;
    let mut b_sum = 0.0;
    let mut weight_sum = 0.0;
    
    for (i, color) in colors.iter().enumerate() {
        let weight = weights.get(i).copied().unwrap_or(1.0);
        r_sum += color.0[0] as f32 * weight;
        g_sum += color.0[1] as f32 * weight;
        b_sum += color.0[2] as f32 * weight;
        weight_sum += weight;
    }
    
    if weight_sum == 0.0 {
        return Rgba([0, 0, 0, 255]);
    }
    
    Rgba([
        (r_sum / weight_sum).round() as u8,
        (g_sum / weight_sum).round() as u8,
        (b_sum / weight_sum).round() as u8,
        255,
    ])
}

/// Calculate confidence in color accuracy based on sample consistency
fn calculate_color_confidence(colors: &[Rgba<u8>]) -> f32 {
    if colors.len() < 2 {
        return if colors.is_empty() { 0.0 } else { 1.0 };
    }
    
    let avg = calculate_weighted_average(colors, &[1.0; 20]);
    let mut deviation_sum = 0.0;
    
    for color in colors {
        let distance = calculate_color_distance(color, &avg);
        deviation_sum += distance;
    }
    
    let avg_deviation = deviation_sum / colors.len() as f32;
    
    // Convert deviation to confidence (0.0-1.0)
    // Lower deviation = higher confidence
    (1.0 - (avg_deviation / 100.0)).max(0.0).min(1.0)
}

/// Calculate perceptual color distance (simplified Delta E)
fn calculate_color_distance(color1: &Rgba<u8>, color2: &Rgba<u8>) -> f32 {
    let r_diff = color1.0[0] as f32 - color2.0[0] as f32;
    let g_diff = color1.0[1] as f32 - color2.0[1] as f32;
    let b_diff = color1.0[2] as f32 - color2.0[2] as f32;
    
    // Simplified perceptual color distance
    (r_diff * r_diff * 0.3 + g_diff * g_diff * 0.59 + b_diff * b_diff * 0.11).sqrt()
}

/// Calculate color variance across samples
fn calculate_color_variance(colors: &[Rgba<u8>]) -> f32 {
    if colors.len() < 2 {
        return 0.0;
    }
    
    let avg = calculate_weighted_average(colors, &[1.0; 20]);
    let mut variance_sum = 0.0;
    
    for color in colors {
        let distance = calculate_color_distance(color, &avg);
        variance_sum += distance * distance;
    }
    
    variance_sum / colors.len() as f32
}

/// Convert RGBA color to hex string
pub fn rgba_to_hex(rgba: &Rgba<u8>) -> String {
    format!("#{:02X}{:02X}{:02X}", rgba.0[0], rgba.0[1], rgba.0[2])
}

/// Advanced K-means clustering for color palette reduction
pub fn reduce_color_palette(
    colors: &[Rgba<u8>], 
    target_colors: usize, 
    tolerance: f32
) -> Vec<Rgba<u8>> {
    if colors.len() <= target_colors {
        return colors.to_vec();
    }
    
    // Remove very similar colors first based on tolerance
    let filtered_colors = remove_similar_colors(colors, tolerance);
    
    if filtered_colors.len() <= target_colors {
        return filtered_colors;
    }
    
    // Use SIMD-accelerated K-means if available, otherwise fallback to standard implementation
    if is_simd_available() && filtered_colors.len() > 100 {
        // SIMD path for large datasets - significantly faster
        return simd_k_means_palette_reduction(&filtered_colors, target_colors, 20);
    }
    
    // Fallback: Advanced K-means implementation with improved initialization
    let mut centroids = Vec::with_capacity(target_colors);
    
    // K-means++ initialization for better color distribution
    centroids.push(colors[0]); // Start with first color
    
    for _ in 1..target_colors {
        let mut best_color = colors[0];
        let mut best_distance = 0.0;
        
        // Find color that is furthest from all existing centroids
        for color in &filtered_colors {
            let min_distance = centroids.iter()
                .map(|centroid| calculate_color_distance(color, centroid))
                .fold(f32::MAX, f32::min);
            
            if min_distance > best_distance {
                best_distance = min_distance;
                best_color = *color;
            }
        }
        
        centroids.push(best_color);
    }
    
    // Perform k-means iterations with convergence checking
    let max_iterations = 15;
    let convergence_threshold = 0.1;
    
    for iteration in 0..max_iterations {
        let mut clusters: Vec<Vec<Rgba<u8>>> = vec![Vec::new(); target_colors];
        let mut total_movement = 0.0;
        
        // Assign colors to nearest centroid
        for color in &filtered_colors {
            let mut best_cluster = 0;
            let mut best_distance = f32::MAX;
            
            for (i, centroid) in centroids.iter().enumerate() {
                let distance = calculate_color_distance(color, centroid);
                if distance < best_distance {
                    best_distance = distance;
                    best_cluster = i;
                }
            }
            
            clusters[best_cluster].push(*color);
        }
        
        // Update centroids and track movement
        for (i, cluster) in clusters.iter().enumerate() {
            if !cluster.is_empty() {
                let old_centroid = centroids[i];
                let new_centroid = calculate_weighted_average(cluster, &[1.0; 100]);
                total_movement += calculate_color_distance(&old_centroid, &new_centroid);
                centroids[i] = new_centroid;
            }
        }
        
        // Check for convergence
        if total_movement < convergence_threshold {
            log::debug!("K-means converged after {} iterations", iteration + 1);
            break;
        }
    }
    
    // Remove empty centroids and sort by frequency
    centroids.into_iter()
        .filter(|c| c.0[3] > 0) // Only keep non-transparent colors
        .collect()
}

/// Remove colors that are too similar based on tolerance
fn remove_similar_colors(colors: &[Rgba<u8>], tolerance: f32) -> Vec<Rgba<u8>> {
    if colors.is_empty() {
        return Vec::new();
    }
    
    let mut unique_colors = Vec::new();
    let scaled_tolerance = tolerance * 100.0; // Scale tolerance for Delta E comparison
    
    for &color in colors {
        let is_unique = unique_colors.iter().all(|existing| {
            calculate_color_distance(&color, existing) > scaled_tolerance
        });
        
        if is_unique {
            unique_colors.push(color);
        }
    }
    
    unique_colors
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dominant_color_extraction() {
        let path = vec![
            Point { x: 1.0, y: 1.0 },
            Point { x: 2.0, y: 2.0 },
        ];
        let color_map = vec![
            Rgba([255, 0, 0, 255]), // Red
            Rgba([0, 255, 0, 255]), // Green
            Rgba([0, 0, 255, 255]), // Blue
            Rgba([255, 255, 0, 255]), // Yellow
        ];
        
        let result = extract_path_colors(
            &path, &color_map, 2, 2, 
            ColorSamplingMethod::DominantColor, 
            0.7, 0.15
        );
        
        assert!(!result.primary_color.is_empty());
        assert!(result.primary_color.starts_with('#'));
        assert!(result.color_confidence > 0.0);
    }

    #[test]
    fn test_rgba_to_hex() {
        let red = Rgba([255, 0, 0, 255]);
        assert_eq!(rgba_to_hex(&red), "#FF0000");
        
        let green = Rgba([0, 255, 0, 255]);
        assert_eq!(rgba_to_hex(&green), "#00FF00");
    }
}