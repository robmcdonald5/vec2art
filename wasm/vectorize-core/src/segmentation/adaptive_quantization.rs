//! Adaptive k-means quantization in Lab color space with ΔE post-merge

use crate::error::{VectorizeError, VectorizeResult};
use crate::preprocessing::{lab_distance, lab_to_rgb, rgb_to_lab};
use image::{ImageBuffer, Rgba};
use rayon::prelude::*;
use std::collections::HashMap;

/// Configuration for adaptive quantization
#[derive(Clone, Debug, serde::Serialize)]
pub struct AdaptiveQuantizationConfig {
    /// Initial number of clusters (will be reduced by merging)
    pub initial_clusters: usize,
    /// Target number of colors after merging
    pub target_colors: usize,
    /// ΔE threshold for merging similar clusters
    pub merge_threshold: f32,
    /// Maximum iterations for k-means
    pub max_iterations: usize,
    /// Convergence threshold
    pub convergence_threshold: f32,
}

impl Default for AdaptiveQuantizationConfig {
    fn default() -> Self {
        Self {
            initial_clusters: 48,
            target_colors: 16,
            merge_threshold: 2.5,
            max_iterations: 30,
            convergence_threshold: 0.5,
        }
    }
}

/// Quantized image result
pub struct QuantizationResult {
    /// Final color palette in RGB
    pub palette_rgb: Vec<(u8, u8, u8)>,
    /// Final color palette in Lab
    pub palette_lab: Vec<(f32, f32, f32)>,
    /// Pixel assignments to palette indices
    pub assignments: Vec<usize>,
    /// Number of pixels assigned to each color
    pub color_counts: Vec<usize>,
}

/// Perform adaptive k-means quantization with ΔE post-merge
pub fn adaptive_kmeans_quantization(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &AdaptiveQuantizationConfig,
) -> VectorizeResult<QuantizationResult> {
    let (width, height) = image.dimensions();
    let pixel_count = (width * height) as usize;
    
    // Extract pixels and convert to Lab
    let mut lab_pixels: Vec<(f32, f32, f32)> = Vec::with_capacity(pixel_count);
    for pixel in image.pixels() {
        if pixel[3] > 10 {  // Skip mostly transparent pixels
            let lab = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
            lab_pixels.push(lab);
        }
    }
    
    if lab_pixels.is_empty() {
        return Err(VectorizeError::algorithm_error("No valid pixels for quantization"));
    }
    
    // Initialize clusters adaptively
    let mut centroids = initialize_adaptive_clusters(&lab_pixels, config.initial_clusters)?;
    let mut assignments = vec![0; lab_pixels.len()];
    
    // Run k-means iterations
    for iteration in 0..config.max_iterations {
        // Assign pixels to nearest centroid
        let old_assignments = assignments.clone();
        assign_to_clusters_parallel(&lab_pixels, &centroids, &mut assignments);
        
        // Update centroids
        let movement = update_centroids(&lab_pixels, &assignments, &mut centroids)?;
        
        // Check convergence
        if movement < config.convergence_threshold {
            log::debug!("K-means converged after {} iterations", iteration + 1);
            break;
        }
        
        // Check if assignments changed
        let changed = assignments.iter()
            .zip(old_assignments.iter())
            .filter(|(a, b)| a != b)
            .count();
        
        if changed == 0 {
            log::debug!("No assignment changes after {} iterations", iteration + 1);
            break;
        }
    }
    
    // Post-process: merge similar clusters by ΔE
    let (merged_centroids, merged_assignments) = merge_similar_clusters(
        &centroids,
        &assignments,
        &lab_pixels,
        config.merge_threshold,
        config.target_colors,
    )?;
    
    // Calculate color counts
    let mut color_counts = vec![0; merged_centroids.len()];
    for &assignment in &merged_assignments {
        color_counts[assignment] += 1;
    }
    
    // Convert centroids back to RGB
    let palette_rgb: Vec<(u8, u8, u8)> = merged_centroids
        .iter()
        .map(|&(l, a, b)| lab_to_rgb(l, a, b))
        .collect();
    
    // Create full assignments including transparent pixels
    let mut full_assignments = Vec::with_capacity(pixel_count);
    let mut lab_idx = 0;
    
    for pixel in image.pixels() {
        if pixel[3] > 10 {
            full_assignments.push(merged_assignments[lab_idx]);
            lab_idx += 1;
        } else {
            // Assign transparent pixels to nearest color (won't be visible anyway)
            full_assignments.push(0);
        }
    }
    
    Ok(QuantizationResult {
        palette_rgb,
        palette_lab: merged_centroids,
        assignments: full_assignments,
        color_counts,
    })
}

/// Initialize clusters adaptively based on color distribution
fn initialize_adaptive_clusters(
    pixels: &[(f32, f32, f32)],
    k: usize,
) -> VectorizeResult<Vec<(f32, f32, f32)>> {
    if pixels.len() < k {
        return Err(VectorizeError::algorithm_error("Too few pixels for requested clusters"));
    }
    
    let mut centroids = Vec::with_capacity(k);
    
    // Use k-means++ initialization for better starting positions
    // First centroid: random pixel
    centroids.push(pixels[0]);
    
    // Remaining centroids: choose points with probability proportional to squared distance
    for _ in 1..k {
        let distances: Vec<f32> = pixels
            .iter()
            .map(|pixel| {
                centroids
                    .iter()
                    .map(|c| lab_distance(*pixel, *c))
                    .min_by(|a, b| a.partial_cmp(b).unwrap())
                    .unwrap_or(0.0)
            })
            .collect();
        
        // Calculate cumulative probabilities
        let total_dist: f32 = distances.iter().map(|d| d * d).sum();
        if total_dist < 1e-6 {
            // All remaining pixels are too close to existing centroids
            break;
        }
        
        // Choose next centroid
        let mut cumsum = 0.0;
        let target = fastrand::f32() * total_dist;
        
        for (i, &dist) in distances.iter().enumerate() {
            cumsum += dist * dist;
            if cumsum >= target {
                centroids.push(pixels[i]);
                break;
            }
        }
    }
    
    // If we couldn't initialize all k centroids, fill with variations
    while centroids.len() < k {
        let base = centroids[centroids.len() % centroids.len()];
        let variation = (
            base.0 + (fastrand::f32() - 0.5) * 5.0,
            base.1 + (fastrand::f32() - 0.5) * 5.0,
            base.2 + (fastrand::f32() - 0.5) * 5.0,
        );
        centroids.push(variation);
    }
    
    Ok(centroids)
}

/// Assign pixels to nearest cluster (parallel)
fn assign_to_clusters_parallel(
    pixels: &[(f32, f32, f32)],
    centroids: &[(f32, f32, f32)],
    assignments: &mut [usize],
) {
    assignments
        .par_iter_mut()
        .zip(pixels.par_iter())
        .for_each(|(assignment, pixel)| {
            let mut min_dist = f32::MAX;
            let mut best_cluster = 0;
            
            for (i, centroid) in centroids.iter().enumerate() {
                let dist = lab_distance(*pixel, *centroid);
                if dist < min_dist {
                    min_dist = dist;
                    best_cluster = i;
                }
            }
            
            *assignment = best_cluster;
        });
}

/// Update centroids based on assignments
fn update_centroids(
    pixels: &[(f32, f32, f32)],
    assignments: &[usize],
    centroids: &mut [(f32, f32, f32)],
) -> VectorizeResult<f32> {
    let k = centroids.len();
    let mut new_centroids = vec![(0.0, 0.0, 0.0); k];
    let mut counts = vec![0; k];
    
    // Sum pixels for each cluster
    for (pixel, &cluster) in pixels.iter().zip(assignments.iter()) {
        new_centroids[cluster].0 += pixel.0;
        new_centroids[cluster].1 += pixel.1;
        new_centroids[cluster].2 += pixel.2;
        counts[cluster] += 1;
    }
    
    // Calculate average and measure movement
    let mut total_movement = 0.0;
    
    for i in 0..k {
        if counts[i] > 0 {
            let new_centroid = (
                new_centroids[i].0 / counts[i] as f32,
                new_centroids[i].1 / counts[i] as f32,
                new_centroids[i].2 / counts[i] as f32,
            );
            
            total_movement += lab_distance(centroids[i], new_centroid);
            centroids[i] = new_centroid;
        }
    }
    
    Ok(total_movement / k as f32)
}

/// Merge similar clusters based on ΔE threshold
fn merge_similar_clusters(
    centroids: &[(f32, f32, f32)],
    assignments: &[usize],
    pixels: &[(f32, f32, f32)],
    threshold: f32,
    target_colors: usize,
) -> VectorizeResult<(Vec<(f32, f32, f32)>, Vec<usize>)> {
    let k = centroids.len();
    
    // Build merge map
    let mut merge_map: HashMap<usize, usize> = HashMap::new();
    let mut merged_centroids = Vec::new();
    let mut next_id = 0;
    
    // Calculate cluster weights (number of pixels)
    let mut weights = vec![0; k];
    for &assignment in assignments {
        weights[assignment] += 1;
    }
    
    // Sort clusters by weight (merge smaller into larger)
    let mut cluster_order: Vec<(usize, usize)> = weights
        .iter()
        .enumerate()
        .map(|(i, &w)| (i, w))
        .collect();
    cluster_order.sort_by_key(|&(_, w)| std::cmp::Reverse(w));
    
    // Process clusters in order of size
    for &(i, _) in &cluster_order {
        if merge_map.contains_key(&i) {
            continue; // Already merged
        }
        
        // Check if this cluster should merge with any existing merged cluster
        let mut merged = false;
        
        for (j, merged_centroid) in merged_centroids.iter().enumerate() {
            if lab_distance(centroids[i], *merged_centroid) < threshold {
                merge_map.insert(i, j);
                merged = true;
                
                // Update merged centroid (weighted average)
                let total_weight = weights[i];
                let mut sum_l = centroids[i].0 * total_weight as f32;
                let mut sum_a = centroids[i].1 * total_weight as f32;
                let mut sum_b = centroids[i].2 * total_weight as f32;
                let mut total = total_weight;
                
                // Add contributions from other clusters mapped to this one
                for (&other_idx, &mapped_to) in merge_map.iter() {
                    if mapped_to == j && other_idx != i {
                        let w = weights[other_idx];
                        sum_l += centroids[other_idx].0 * w as f32;
                        sum_a += centroids[other_idx].1 * w as f32;
                        sum_b += centroids[other_idx].2 * w as f32;
                        total += w;
                    }
                }
                
                if total > 0 {
                    merged_centroids[j] = (
                        sum_l / total as f32,
                        sum_a / total as f32,
                        sum_b / total as f32,
                    );
                }
                
                break;
            }
        }
        
        if !merged {
            // Create new merged cluster
            merge_map.insert(i, next_id);
            merged_centroids.push(centroids[i]);
            next_id += 1;
        }
        
        // Stop if we've reached target color count
        if merged_centroids.len() >= target_colors {
            break;
        }
    }
    
    // Map any remaining unprocessed clusters
    for i in 0..k {
        if !merge_map.contains_key(&i) {
            // Find nearest merged cluster
            let mut min_dist = f32::MAX;
            let mut best_cluster = 0;
            
            for (j, merged_centroid) in merged_centroids.iter().enumerate() {
                let dist = lab_distance(centroids[i], *merged_centroid);
                if dist < min_dist {
                    min_dist = dist;
                    best_cluster = j;
                }
            }
            
            merge_map.insert(i, best_cluster);
        }
    }
    
    // Remap assignments
    let new_assignments: Vec<usize> = assignments
        .iter()
        .map(|&old| *merge_map.get(&old).unwrap_or(&0))
        .collect();
    
    // Recalculate final centroids from actual pixels
    let num_merged = merged_centroids.len();
    let mut final_centroids = vec![(0.0, 0.0, 0.0); num_merged];
    let mut final_counts = vec![0; num_merged];
    
    for (pixel, &cluster) in pixels.iter().zip(new_assignments.iter()) {
        final_centroids[cluster].0 += pixel.0;
        final_centroids[cluster].1 += pixel.1;
        final_centroids[cluster].2 += pixel.2;
        final_counts[cluster] += 1;
    }
    
    for i in 0..num_merged {
        if final_counts[i] > 0 {
            final_centroids[i].0 /= final_counts[i] as f32;
            final_centroids[i].1 /= final_counts[i] as f32;
            final_centroids[i].2 /= final_counts[i] as f32;
        }
    }
    
    log::info!(
        "Merged {} clusters to {} colors (threshold: {})",
        k, final_centroids.len(), threshold
    );
    
    Ok((final_centroids, new_assignments))
}

/// Apply quantization to create a quantized image
pub fn apply_adaptive_quantization(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    result: &QuantizationResult,
) -> VectorizeResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
    let (width, height) = image.dimensions();
    let mut quantized = ImageBuffer::new(width, height);
    
    for (i, pixel) in quantized.pixels_mut().enumerate() {
        let original = image.pixels().nth(i).unwrap();
        if original[3] > 10 {
            let palette_idx = result.assignments[i];
            let (r, g, b) = result.palette_rgb[palette_idx];
            *pixel = Rgba([r, g, b, original[3]]);
        } else {
            *pixel = *original; // Preserve transparent pixels
        }
    }
    
    Ok(quantized)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_adaptive_quantization() {
        // Create a test image with multiple colors
        let mut image = ImageBuffer::new(10, 10);
        for y in 0..10 {
            for x in 0..10 {
                let r = (x * 25) as u8;
                let g = (y * 25) as u8;
                let b = ((x + y) * 12) as u8;
                image.put_pixel(x, y, Rgba([r, g, b, 255]));
            }
        }
        
        let config = AdaptiveQuantizationConfig {
            initial_clusters: 10,
            target_colors: 4,
            merge_threshold: 10.0,
            max_iterations: 10,
            convergence_threshold: 1.0,
        };
        
        let result = adaptive_kmeans_quantization(&image, &config).unwrap();
        
        assert!(result.palette_rgb.len() <= config.target_colors);
        assert_eq!(result.assignments.len(), 100);
    }
    
    #[test]
    fn test_cluster_merging() {
        let centroids = vec![
            (50.0, 0.0, 0.0),
            (51.0, 1.0, 0.0),  // Close to first
            (80.0, 0.0, 0.0),
            (81.0, 1.0, 0.0),  // Close to third
        ];
        
        let assignments = vec![0, 0, 1, 1, 2, 2, 3, 3];
        let pixels = vec![
            (50.0, 0.0, 0.0),
            (50.0, 0.0, 0.0),
            (51.0, 1.0, 0.0),
            (51.0, 1.0, 0.0),
            (80.0, 0.0, 0.0),
            (80.0, 0.0, 0.0),
            (81.0, 1.0, 0.0),
            (81.0, 1.0, 0.0),
        ];
        
        let (merged, new_assignments) = merge_similar_clusters(
            &centroids,
            &assignments,
            &pixels,
            5.0,  // Merge threshold
            2,    // Target colors
        ).unwrap();
        
        assert!(merged.len() <= 2);
        assert_eq!(new_assignments.len(), assignments.len());
    }
}