//! Advanced color processing utilities for line tracing backends
//!
//! This module provides sophisticated color sampling strategies for preserving
//! color information in vectorized line art, supporting multiple approaches
//! from simple dominant color to complex gradient-based sampling.

use crate::algorithms::visual::simd_color::{
    is_simd_available, simd_analyze_gradient_strength, simd_k_means_palette_reduction,
};
use crate::algorithms::Point;
use image::Rgba;
#[cfg(feature = "generate-ts")]
use ts_rs::TS;

/// Color sampling method determines how colors are extracted from paths
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "generate-ts", derive(TS))]
#[cfg_attr(
    feature = "generate-ts",
    ts(export, export_to = "../../../frontend/src/lib/types/generated/")
)]
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

/// Palette reduction method determines algorithm used for color clustering
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "generate-ts", derive(TS))]
#[cfg_attr(
    feature = "generate-ts",
    ts(export, export_to = "../../../frontend/src/lib/types/generated/")
)]
pub enum PaletteMethod {
    /// K-means clustering algorithm (balanced quality/speed)
    Kmeans,
    /// Median cut algorithm (fast, good for photographic images)
    MedianCut,
    /// Octree quantization (excellent quality, slower)
    Octree,
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
        ColorSamplingMethod::DominantColor => {
            extract_dominant_color(path, color_map, image_width, image_height, accuracy)
        }
        ColorSamplingMethod::GradientMapping => extract_gradient_colors(
            path,
            color_map,
            image_width,
            image_height,
            accuracy,
            tolerance,
        ),
        ColorSamplingMethod::ContentAware => extract_content_aware_colors(
            path,
            color_map,
            image_width,
            image_height,
            accuracy,
            tolerance,
        ),
        ColorSamplingMethod::Adaptive => extract_adaptive_colors(
            path,
            color_map,
            image_width,
            image_height,
            accuracy,
            tolerance,
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
    let base_samples = if accuracy > 0.8 {
        7
    } else if accuracy > 0.5 {
        5
    } else {
        3
    };
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
        &[1.0; 3],
    );
    let end_avg = calculate_weighted_average(
        &end_colors.iter().map(|s| s.color).collect::<Vec<_>>(),
        &[1.0; 3],
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
        gradient_strengths
            .iter()
            .any(|&strength| strength > tolerance * 50.0)
    } else {
        color_distance > tolerance * 100.0 // Scale tolerance for Delta E
    };

    let confidence =
        calculate_color_confidence(&sample_points.iter().map(|s| s.color).collect::<Vec<_>>());

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
/// This method analyzes the local image structure around the path to determine
/// the most appropriate color sampling strategy for each segment
fn extract_content_aware_colors(
    path: &[Point],
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    accuracy: f32,
    tolerance: f32,
) -> PathColorInfo {
    if path.len() < 3 {
        return extract_dominant_color(path, color_map, image_width, image_height, accuracy);
    }

    // Enhanced sampling based on path complexity and accuracy
    let sample_count = ((path.len() as f32 * accuracy).round() as usize)
        .max(5)
        .min(20);

    let mut sample_points = Vec::with_capacity(sample_count);
    let mut edge_strengths = Vec::with_capacity(sample_count);

    // Sample along path and analyze local edge structure
    for i in 0..sample_count {
        let t = i as f32 / (sample_count - 1) as f32;
        let idx = (t * (path.len() - 1) as f32).round() as usize;
        let point = &path[idx];

        // Sample color at point
        if let Some(color) = sample_color_at_point(point, color_map, image_width, image_height) {
            // Analyze local edge strength around this point
            let edge_strength = analyze_local_edges(
                point,
                color_map,
                image_width,
                image_height,
                2, // radius for edge detection
            );

            // Weight samples by edge strength - prioritize colors at edges
            let weight = 1.0 + edge_strength * 2.0; // Higher weight for edge colors

            sample_points.push(ColorSample {
                position: t,
                color,
                weight,
            });
            edge_strengths.push(edge_strength);
        }
    }

    if sample_points.is_empty() {
        return PathColorInfo {
            primary_color: "#000000".to_string(),
            secondary_color: None,
            color_confidence: 0.0,
            sample_points: Vec::new(),
        };
    }

    // Identify high-edge regions (potential color boundaries)
    let avg_edge_strength: f32 = edge_strengths.iter().sum::<f32>() / edge_strengths.len() as f32;
    let high_edge_threshold = avg_edge_strength * 1.5;

    // Segment the path based on edge discontinuities
    let mut segments = Vec::new();
    let mut current_segment = Vec::new();

    for (i, (sample, edge_strength)) in sample_points.iter().zip(edge_strengths.iter()).enumerate() {
        current_segment.push(sample.clone());

        // Check if this is a color boundary
        if *edge_strength > high_edge_threshold && i < sample_points.len() - 1 {
            // Check color difference with next sample
            if i + 1 < sample_points.len() {
                let color_diff = calculate_color_distance(&sample.color, &sample_points[i + 1].color);
                if color_diff > tolerance * 30.0 {
                    // Significant color boundary detected
                    if !current_segment.is_empty() {
                        segments.push(current_segment.clone());
                        current_segment.clear();
                    }
                }
            }
        }
    }

    // Add remaining segment
    if !current_segment.is_empty() {
        segments.push(current_segment);
    }

    // Determine primary and secondary colors based on segments
    if segments.len() == 1 {
        // Single segment - use weighted average
        let weighted_colors: Vec<_> = segments[0].iter().map(|s| s.color).collect();
        let weights: Vec<_> = segments[0].iter().map(|s| s.weight).collect();
        let primary = calculate_weighted_average(&weighted_colors, &weights);

        PathColorInfo {
            primary_color: rgba_to_hex(&primary),
            secondary_color: None,
            color_confidence: 0.8 + accuracy * 0.2,
            sample_points,
        }
    } else {
        // Multiple segments - use most prominent colors
        let mut segment_colors = Vec::new();
        for segment in &segments {
            let weighted_colors: Vec<_> = segment.iter().map(|s| s.color).collect();
            let weights: Vec<_> = segment.iter().map(|s| s.weight).collect();
            let avg_color = calculate_weighted_average(&weighted_colors, &weights);
            segment_colors.push((avg_color, segment.len() as f32));
        }

        // Sort by segment size (prominence)
        segment_colors.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        let primary = segment_colors[0].0;
        let secondary = if segment_colors.len() > 1
            && segment_colors[1].1 > segment_colors[0].1 * 0.3 {
            Some(rgba_to_hex(&segment_colors[1].0))
        } else {
            None
        };

        PathColorInfo {
            primary_color: rgba_to_hex(&primary),
            secondary_color: secondary,
            color_confidence: 0.7 + accuracy * 0.3,
            sample_points,
        }
    }
}

/// Adaptive color extraction - intelligently chooses best method based on content analysis
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

    // Comprehensive analysis to determine best method
    let analysis_samples = (7.0 * accuracy).round() as usize;
    let mut colors = Vec::new();
    let mut edge_strengths = Vec::new();
    let mut positions = Vec::new();

    for i in 0..analysis_samples {
        let t = i as f32 / (analysis_samples - 1) as f32;
        let idx = (t * (path.len() - 1) as f32).round() as usize;
        let point = &path[idx];

        if let Some(color) = sample_color_at_point(point, color_map, image_width, image_height) {
            colors.push(color);
            positions.push(t);

            // Analyze local edge strength for content awareness
            let edge_strength = analyze_local_edges(
                point,
                color_map,
                image_width,
                image_height,
                1, // smaller radius for quick analysis
            );
            edge_strengths.push(edge_strength);
        }
    }

    if colors.len() < 2 {
        return extract_dominant_color(path, color_map, image_width, image_height, accuracy);
    }

    // Calculate metrics for decision making
    let color_variance = calculate_color_variance(&colors);
    let avg_edge_strength: f32 = edge_strengths.iter().sum::<f32>() / edge_strengths.len() as f32;

    // Check for gradient pattern
    let has_gradient = if colors.len() >= 3 {
        let start_color = colors[0];
        let mid_color = colors[colors.len() / 2];
        let end_color = colors[colors.len() - 1];

        let start_to_mid = calculate_color_distance(&start_color, &mid_color);
        let mid_to_end = calculate_color_distance(&mid_color, &end_color);
        let start_to_end = calculate_color_distance(&start_color, &end_color);

        // Check if colors form a smooth progression
        (start_to_mid + mid_to_end) < start_to_end * 1.3
    } else {
        false
    };

    // Decision tree based on multiple factors
    if avg_edge_strength > 0.5 && color_variance > tolerance * 30.0 {
        // High edge activity with color variation -> content-aware
        extract_content_aware_colors(
            path,
            color_map,
            image_width,
            image_height,
            accuracy,
            tolerance,
        )
    } else if has_gradient && color_variance > tolerance * 20.0 {
        // Smooth gradient detected -> gradient mapping
        extract_gradient_colors(
            path,
            color_map,
            image_width,
            image_height,
            accuracy,
            tolerance,
        )
    } else if color_variance < tolerance * 10.0 {
        // Very low variation -> dominant color
        extract_dominant_color(path, color_map, image_width, image_height, accuracy)
    } else {
        // Moderate variation without clear pattern -> enhanced gradient for subtle transitions
        extract_gradient_colors(
            path,
            color_map,
            image_width,
            image_height,
            accuracy.min(0.8), // Slightly reduce accuracy for smoother results
            tolerance * 1.2,   // Increase tolerance for better color grouping
        )
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

/// Analyze local edge strength around a point using Sobel-like edge detection
fn analyze_local_edges(
    point: &Point,
    color_map: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
    radius: u32,
) -> f32 {
    let x = point.x.round() as i32;
    let y = point.y.round() as i32;

    let mut total_gradient = 0.0;
    let mut sample_count = 0;

    // Sample in a grid around the point
    for dy in -(radius as i32)..=(radius as i32) {
        for dx in -(radius as i32)..=(radius as i32) {
            let px = x + dx;
            let py = y + dy;

            // Check bounds
            if px > 0 && py > 0 && (px as u32) < image_width - 1 && (py as u32) < image_height - 1 {
                let center_idx = (py as u32 * image_width + px as u32) as usize;

                // Get neighboring pixels for gradient calculation
                let left_idx = (py as u32 * image_width + (px - 1) as u32) as usize;
                let right_idx = (py as u32 * image_width + (px + 1) as u32) as usize;
                let top_idx = ((py - 1) as u32 * image_width + px as u32) as usize;
                let bottom_idx = ((py + 1) as u32 * image_width + px as u32) as usize;

                if center_idx < color_map.len()
                    && left_idx < color_map.len()
                    && right_idx < color_map.len()
                    && top_idx < color_map.len()
                    && bottom_idx < color_map.len() {

                    let _center = &color_map[center_idx];
                    let left = &color_map[left_idx];
                    let right = &color_map[right_idx];
                    let top = &color_map[top_idx];
                    let bottom = &color_map[bottom_idx];

                    // Calculate horizontal and vertical gradients
                    let gx = calculate_color_distance(left, right);
                    let gy = calculate_color_distance(top, bottom);

                    // Magnitude of gradient
                    let gradient = (gx * gx + gy * gy).sqrt();
                    total_gradient += gradient;
                    sample_count += 1;
                }
            }
        }
    }

    if sample_count > 0 {
        // Normalize to 0-1 range (assuming max color distance is ~441.67 for RGB)
        (total_gradient / sample_count as f32) / 441.67
    } else {
        0.0
    }
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

/// Advanced color palette reduction with multiple algorithm support
pub fn reduce_color_palette_with_method(
    colors: &[Rgba<u8>],
    target_colors: usize,
    tolerance: f32,
    method: PaletteMethod,
) -> Vec<Rgba<u8>> {
    match method {
        PaletteMethod::Kmeans => reduce_color_palette_kmeans(colors, target_colors, tolerance),
        PaletteMethod::MedianCut => reduce_color_palette_median_cut(colors, target_colors, tolerance),
        PaletteMethod::Octree => reduce_color_palette_octree(colors, target_colors, tolerance),
    }
}

/// Advanced K-means clustering for color palette reduction (backward compatibility)
pub fn reduce_color_palette(
    colors: &[Rgba<u8>],
    target_colors: usize,
    tolerance: f32,
) -> Vec<Rgba<u8>> {
    reduce_color_palette_kmeans(colors, target_colors, tolerance)
}

/// K-means clustering algorithm for color palette reduction
fn reduce_color_palette_kmeans(
    colors: &[Rgba<u8>],
    target_colors: usize,
    tolerance: f32,
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
            let min_distance = centroids
                .iter()
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
    centroids
        .into_iter()
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
        let is_unique = unique_colors
            .iter()
            .all(|existing| calculate_color_distance(&color, existing) > scaled_tolerance);

        if is_unique {
            unique_colors.push(color);
        }
    }

    unique_colors
}

/// Median cut algorithm for color palette reduction
fn reduce_color_palette_median_cut(
    colors: &[Rgba<u8>],
    target_colors: usize,
    _tolerance: f32,
) -> Vec<Rgba<u8>> {
    if colors.len() <= target_colors {
        return colors.to_vec();
    }

    // Convert to RGB for easier processing
    let mut rgb_colors: Vec<[u8; 3]> = colors.iter()
        .map(|rgba| [rgba.0[0], rgba.0[1], rgba.0[2]])
        .collect();

    // Recursive median cut implementation
    let result = median_cut_recursive(&mut rgb_colors, target_colors);

    // Convert back to Rgba
    result.into_iter()
        .map(|rgb| Rgba([rgb[0], rgb[1], rgb[2], 255]))
        .collect()
}

/// Recursive median cut implementation
fn median_cut_recursive(colors: &mut [[u8; 3]], target_colors: usize) -> Vec<[u8; 3]> {
    if target_colors <= 1 || colors.len() <= 1 {
        if colors.is_empty() {
            return vec![[0, 0, 0]];
        }
        // Return average color
        let avg = calculate_average_rgb(colors);
        return vec![avg];
    }

    // Find the channel with the largest range
    let mut ranges = [0u8; 3];
    for channel in 0..3 {
        let min_val = colors.iter().map(|c| c[channel]).min().unwrap_or(0);
        let max_val = colors.iter().map(|c| c[channel]).max().unwrap_or(0);
        ranges[channel] = max_val.saturating_sub(min_val);
    }

    let split_channel = ranges.iter()
        .enumerate()
        .max_by_key(|(_, &range)| range)
        .map(|(i, _)| i)
        .unwrap_or(0);

    // Sort by the channel with largest range
    colors.sort_by_key(|color| color[split_channel]);

    // Split at median
    let mid = colors.len() / 2;
    let (left, right) = colors.split_at_mut(mid);

    // Recursively process both halves
    let left_target = target_colors / 2;
    let right_target = target_colors - left_target;

    let mut result = median_cut_recursive(left, left_target);
    result.extend(median_cut_recursive(right, right_target));
    result
}

/// Calculate average RGB color
fn calculate_average_rgb(colors: &[[u8; 3]]) -> [u8; 3] {
    if colors.is_empty() {
        return [0, 0, 0];
    }

    let mut sums = [0u32; 3];
    for color in colors {
        for i in 0..3 {
            sums[i] += color[i] as u32;
        }
    }

    let len = colors.len() as u32;
    [
        (sums[0] / len) as u8,
        (sums[1] / len) as u8,
        (sums[2] / len) as u8,
    ]
}

/// Octree quantization algorithm for color palette reduction
fn reduce_color_palette_octree(
    colors: &[Rgba<u8>],
    target_colors: usize,
    _tolerance: f32,
) -> Vec<Rgba<u8>> {
    if colors.len() <= target_colors {
        return colors.to_vec();
    }

    let mut octree = ColorOctree::new();

    // Insert all colors into octree
    for color in colors {
        octree.insert([color.0[0], color.0[1], color.0[2]]);
    }

    // Reduce to target number of colors
    let reduced_colors = octree.reduce_to(target_colors);

    // Convert to Rgba
    reduced_colors.into_iter()
        .map(|rgb| Rgba([rgb[0], rgb[1], rgb[2], 255]))
        .collect()
}

/// Simple octree node for color quantization
#[derive(Debug)]
struct OctreeNode {
    /// Color sum for averaging
    color_sum: [u32; 3],
    /// Number of colors in this node
    pixel_count: u32,
    /// Child nodes (8 possible)
    children: Vec<Option<Box<OctreeNode>>>,
    /// Whether this is a leaf node
    is_leaf: bool,
    /// Depth level in tree
    level: u8,
}

impl OctreeNode {
    fn new(level: u8) -> Self {
        Self {
            color_sum: [0, 0, 0],
            pixel_count: 0,
            children: (0..8).map(|_| None).collect(),
            is_leaf: level >= 7, // Leaf at depth 7
            level,
        }
    }

    fn insert(&mut self, color: [u8; 3]) {
        if self.is_leaf {
            self.color_sum[0] += color[0] as u32;
            self.color_sum[1] += color[1] as u32;
            self.color_sum[2] += color[2] as u32;
            self.pixel_count += 1;
        } else {
            let index = self.get_octree_index(color);
            if self.children[index].is_none() {
                self.children[index] = Some(Box::new(OctreeNode::new(self.level + 1)));
            }
            if let Some(ref mut child) = self.children[index] {
                child.insert(color);
            }
        }
    }

    fn get_octree_index(&self, color: [u8; 3]) -> usize {
        let shift = 7 - self.level;
        ((((color[0] >> shift) & 1) << 2) |
         (((color[1] >> shift) & 1) << 1) |
         ((color[2] >> shift) & 1)) as usize
    }

    fn get_average_color(&self) -> [u8; 3] {
        if self.pixel_count == 0 {
            [0, 0, 0]
        } else {
            [
                (self.color_sum[0] / self.pixel_count) as u8,
                (self.color_sum[1] / self.pixel_count) as u8,
                (self.color_sum[2] / self.pixel_count) as u8,
            ]
        }
    }

    fn collect_colors(&self, colors: &mut Vec<[u8; 3]>) {
        if self.is_leaf && self.pixel_count > 0 {
            colors.push(self.get_average_color());
        } else {
            for child in &self.children {
                if let Some(ref child_node) = child {
                    child_node.collect_colors(colors);
                }
            }
        }
    }
}

/// Color octree for quantization
#[derive(Debug)]
struct ColorOctree {
    root: OctreeNode,
}

impl ColorOctree {
    fn new() -> Self {
        Self {
            root: OctreeNode::new(0),
        }
    }

    fn insert(&mut self, color: [u8; 3]) {
        self.root.insert(color);
    }

    fn reduce_to(&self, target_colors: usize) -> Vec<[u8; 3]> {
        let mut colors = Vec::new();
        self.root.collect_colors(&mut colors);

        // If we have too many colors, use simple clustering to reduce further
        if colors.len() > target_colors {
            // Fallback to k-means for final reduction
            let rgba_colors: Vec<Rgba<u8>> = colors.iter()
                .map(|rgb| Rgba([rgb[0], rgb[1], rgb[2], 255]))
                .collect();
            let reduced = reduce_color_palette_kmeans(&rgba_colors, target_colors, 0.1);
            reduced.iter()
                .map(|rgba| [rgba.0[0], rgba.0[1], rgba.0[2]])
                .collect()
        } else {
            colors
        }
    }
}

/// Apply dithering to color palette
pub fn apply_dithering(
    colors: &[Rgba<u8>],
    palette: &[Rgba<u8>],
    image_width: u32,
    image_height: u32,
) -> Vec<Rgba<u8>> {
    let mut result = colors.to_vec();

    // Floyd-Steinberg dithering
    for y in 0..image_height {
        for x in 0..image_width {
            let idx = (y * image_width + x) as usize;
            if idx >= result.len() {
                continue;
            }

            let old_color = result[idx];
            let new_color = find_closest_color(&old_color, palette);
            result[idx] = new_color;

            // Calculate error
            let error = [
                old_color.0[0] as i16 - new_color.0[0] as i16,
                old_color.0[1] as i16 - new_color.0[1] as i16,
                old_color.0[2] as i16 - new_color.0[2] as i16,
            ];

            // Distribute error to neighboring pixels
            let neighbors = [
                (x + 1, y, 7),     // Right
                (x - 1, y + 1, 3), // Bottom-left
                (x, y + 1, 5),     // Bottom
                (x + 1, y + 1, 1), // Bottom-right
            ];

            for (nx, ny, weight) in neighbors {
                if nx < image_width && ny < image_height {
                    let neighbor_idx = (ny * image_width + nx) as usize;
                    if neighbor_idx < result.len() {
                        let factor = weight as f32 / 16.0;
                        result[neighbor_idx] = Rgba([
                            ((result[neighbor_idx].0[0] as i16 + (error[0] as f32 * factor) as i16).max(0).min(255)) as u8,
                            ((result[neighbor_idx].0[1] as i16 + (error[1] as f32 * factor) as i16).max(0).min(255)) as u8,
                            ((result[neighbor_idx].0[2] as i16 + (error[2] as f32 * factor) as i16).max(0).min(255)) as u8,
                            result[neighbor_idx].0[3],
                        ]);
                    }
                }
            }
        }
    }

    result
}

/// Find the closest color in a palette
fn find_closest_color(color: &Rgba<u8>, palette: &[Rgba<u8>]) -> Rgba<u8> {
    if palette.is_empty() {
        return *color;
    }

    palette.iter()
        .min_by(|a, b| {
            let dist_a = calculate_color_distance(color, a);
            let dist_b = calculate_color_distance(color, b);
            dist_a.partial_cmp(&dist_b).unwrap_or(std::cmp::Ordering::Equal)
        })
        .copied()
        .unwrap_or(*color)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dominant_color_extraction() {
        let path = vec![Point { x: 1.0, y: 1.0 }, Point { x: 2.0, y: 2.0 }];
        let color_map = vec![
            Rgba([255, 0, 0, 255]),   // Red
            Rgba([0, 255, 0, 255]),   // Green
            Rgba([0, 0, 255, 255]),   // Blue
            Rgba([255, 255, 0, 255]), // Yellow
        ];

        let result = extract_path_colors(
            &path,
            &color_map,
            2,
            2,
            ColorSamplingMethod::DominantColor,
            0.7,
            0.15,
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
