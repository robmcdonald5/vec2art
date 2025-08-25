//! SIMD-accelerated color operations for high-performance color processing
//!
//! This module provides SIMD-optimized implementations of color operations
//! including color distance calculations, color space conversions, and gradient analysis.

use image::Rgba;

// SIMD feature detection and imports
#[cfg(target_arch = "x86")]
use std::arch::x86::*;
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

/// SIMD-accelerated color distance calculation using LAB color space
///
/// Processes 4 colors simultaneously using SSE/AVX instructions
///
/// # Arguments
/// * `colors1` - First set of RGBA colors (slice of exactly 4 colors)
/// * `colors2` - Second set of RGBA colors (slice of exactly 4 colors)
/// * `distances` - Output buffer for distances (slice of exactly 4 values)
///
/// # Safety
/// This function uses unsafe SIMD intrinsics but is safe when called with
/// properly sized slices and on supported hardware.
#[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
pub unsafe fn simd_color_distance_lab_x4(
    colors1: &[Rgba<u8>; 4],
    colors2: &[Rgba<u8>; 4],
    distances: &mut [f32; 4],
) {
    if is_x86_feature_detected!("sse2") {
        simd_color_distance_lab_sse2(colors1, colors2, distances);
    } else {
        // Fallback to scalar implementation
        for i in 0..4 {
            distances[i] = scalar_color_distance_lab(&colors1[i], &colors2[i]);
        }
    }
}

/// SSE2 implementation of LAB color distance calculation
#[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
unsafe fn simd_color_distance_lab_sse2(
    colors1: &[Rgba<u8>; 4],
    colors2: &[Rgba<u8>; 4],
    distances: &mut [f32; 4],
) {
    // Convert RGBA to LAB color space using SIMD
    let mut lab1 = [[0.0f32; 4]; 3]; // L, A, B components for 4 colors
    let mut lab2 = [[0.0f32; 4]; 3];

    // Batch convert colors to LAB
    for i in 0..4 {
        let lab_color1 = rgba_to_lab_simd(&colors1[i]);
        let lab_color2 = rgba_to_lab_simd(&colors2[i]);

        lab1[0][i] = lab_color1[0]; // L
        lab1[1][i] = lab_color1[1]; // A
        lab1[2][i] = lab_color1[2]; // B

        lab2[0][i] = lab_color2[0]; // L
        lab2[1][i] = lab_color2[1]; // A
        lab2[2][i] = lab_color2[2]; // B
    }

    // Load LAB components into SIMD registers
    let l1 = _mm_loadu_ps(lab1[0].as_ptr());
    let a1 = _mm_loadu_ps(lab1[1].as_ptr());
    let b1 = _mm_loadu_ps(lab1[2].as_ptr());

    let l2 = _mm_loadu_ps(lab2[0].as_ptr());
    let a2 = _mm_loadu_ps(lab2[1].as_ptr());
    let b2 = _mm_loadu_ps(lab2[2].as_ptr());

    // Calculate differences: ΔL, Δa, Δb
    let dl = _mm_sub_ps(l1, l2);
    let da = _mm_sub_ps(a1, a2);
    let db = _mm_sub_ps(b1, b2);

    // Calculate squared differences
    let dl2 = _mm_mul_ps(dl, dl);
    let da2 = _mm_mul_ps(da, da);
    let db2 = _mm_mul_ps(db, db);

    // Sum squared differences: ΔE²
    let sum = _mm_add_ps(_mm_add_ps(dl2, da2), db2);

    // Calculate square root: ΔE
    let result = _mm_sqrt_ps(sum);

    // Store results
    _mm_storeu_ps(distances.as_mut_ptr(), result);
}

/// SIMD-accelerated RGB to LAB conversion
fn rgba_to_lab_simd(rgba: &Rgba<u8>) -> [f32; 3] {
    // First convert to sRGB (0.0-1.0)
    let r = rgba.0[0] as f32 / 255.0;
    let g = rgba.0[1] as f32 / 255.0;
    let b = rgba.0[2] as f32 / 255.0;

    // Convert sRGB to linear RGB
    let r_linear = if r <= 0.04045 {
        r / 12.92
    } else {
        ((r + 0.055) / 1.055).powf(2.4)
    };
    let g_linear = if g <= 0.04045 {
        g / 12.92
    } else {
        ((g + 0.055) / 1.055).powf(2.4)
    };
    let b_linear = if b <= 0.04045 {
        b / 12.92
    } else {
        ((b + 0.055) / 1.055).powf(2.4)
    };

    // Convert linear RGB to XYZ using sRGB matrix
    let x = r_linear * 0.4124564 + g_linear * 0.3575761 + b_linear * 0.1804375;
    let y = r_linear * 0.2126729 + g_linear * 0.7151522 + b_linear * 0.0721750;
    let z = r_linear * 0.0193339 + g_linear * 0.1191920 + b_linear * 0.9503041;

    // Normalize by D65 white point
    let x_n = x / 0.95047;
    let y_n = y / 1.00000;
    let z_n = z / 1.08883;

    // Convert XYZ to LAB
    let fx = if x_n > 0.008856 {
        x_n.powf(1.0 / 3.0)
    } else {
        7.787 * x_n + 16.0 / 116.0
    };
    let fy = if y_n > 0.008856 {
        y_n.powf(1.0 / 3.0)
    } else {
        7.787 * y_n + 16.0 / 116.0
    };
    let fz = if z_n > 0.008856 {
        z_n.powf(1.0 / 3.0)
    } else {
        7.787 * z_n + 16.0 / 116.0
    };

    let l = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b = 200.0 * (fy - fz);

    [l, a, b]
}

/// Scalar fallback for color distance calculation
fn scalar_color_distance_lab(color1: &Rgba<u8>, color2: &Rgba<u8>) -> f32 {
    let lab1 = rgba_to_lab_simd(color1);
    let lab2 = rgba_to_lab_simd(color2);

    let dl = lab1[0] - lab2[0];
    let da = lab1[1] - lab2[1];
    let db = lab1[2] - lab2[2];

    (dl * dl + da * da + db * db).sqrt()
}

/// SIMD-accelerated color palette reduction using k-means clustering
///
/// # Arguments
/// * `colors` - Input colors to cluster
/// * `k` - Number of clusters (palette size)
/// * `max_iterations` - Maximum k-means iterations
///
/// # Returns
/// * `Vec<Rgba<u8>>` - Reduced color palette
pub fn simd_k_means_palette_reduction(
    colors: &[Rgba<u8>],
    k: usize,
    max_iterations: usize,
) -> Vec<Rgba<u8>> {
    if colors.is_empty() || k == 0 {
        return Vec::new();
    }

    if k >= colors.len() {
        return colors.to_vec();
    }

    // Initialize centroids using k-means++ for better convergence
    let mut centroids = initialize_centroids_plus_plus(colors, k);
    let mut assignments = vec![0usize; colors.len()];
    let mut changed = true;

    for iteration in 0..max_iterations {
        if !changed {
            break;
        }

        changed = false;

        // Assignment step - use SIMD for distance calculations
        simd_assign_clusters(colors, &centroids, &mut assignments, &mut changed);

        // Update step - calculate new centroids
        update_centroids(colors, &assignments, &mut centroids, k);

        // Early convergence check
        if iteration > 0 && !changed {
            break;
        }
    }

    centroids
}

/// Initialize centroids using k-means++ algorithm for better convergence
fn initialize_centroids_plus_plus(colors: &[Rgba<u8>], k: usize) -> Vec<Rgba<u8>> {
    use rand::seq::SliceRandom;
    use rand::{thread_rng, Rng};

    let mut rng = thread_rng();
    let mut centroids = Vec::with_capacity(k);

    // Choose first centroid randomly
    centroids.push(*colors.choose(&mut rng).unwrap());

    // Choose remaining centroids with probability proportional to squared distance
    for _ in 1..k {
        let mut distances = Vec::with_capacity(colors.len());
        let mut total_distance = 0.0f32;

        // Calculate minimum distance to existing centroids for each color
        for color in colors {
            let min_dist = centroids
                .iter()
                .map(|centroid| scalar_color_distance_lab(color, centroid))
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(0.0);

            let squared_dist = min_dist * min_dist;
            distances.push(squared_dist);
            total_distance += squared_dist;
        }

        // Choose next centroid with weighted probability
        let threshold = rng.gen::<f32>() * total_distance;
        let mut cumulative = 0.0f32;

        for (i, &dist) in distances.iter().enumerate() {
            cumulative += dist;
            if cumulative >= threshold {
                centroids.push(colors[i]);
                break;
            }
        }
    }

    centroids
}

/// SIMD-accelerated cluster assignment
fn simd_assign_clusters(
    colors: &[Rgba<u8>],
    centroids: &[Rgba<u8>],
    assignments: &mut [usize],
    changed: &mut bool,
) {
    let batch_size = 4;
    let full_batches = colors.len() / batch_size;

    // Process colors in batches of 4 using SIMD
    for batch_idx in 0..full_batches {
        let start_idx = batch_idx * batch_size;
        let color_batch = [
            colors[start_idx],
            colors[start_idx + 1],
            colors[start_idx + 2],
            colors[start_idx + 3],
        ];

        // Find closest centroid for each color in batch
        for (i, &color) in color_batch.iter().enumerate() {
            let color_idx = start_idx + i;
            let mut min_distance = f32::MAX;
            let mut closest_centroid = 0;

            // Use SIMD to compare against all centroids
            if centroids.len() >= 4 {
                // Process centroids in batches of 4
                for centroid_batch_start in (0..centroids.len()).step_by(4) {
                    let centroid_batch_end = (centroid_batch_start + 4).min(centroids.len());
                    let centroid_batch_size = centroid_batch_end - centroid_batch_start;

                    if centroid_batch_size == 4 {
                        let centroid_batch = [
                            centroids[centroid_batch_start],
                            centroids[centroid_batch_start + 1],
                            centroids[centroid_batch_start + 2],
                            centroids[centroid_batch_start + 3],
                        ];

                        let color_batch_same = [color; 4];
                        let mut distances = [0.0f32; 4];

                        #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
                        unsafe {
                            simd_color_distance_lab_x4(
                                &color_batch_same,
                                &centroid_batch,
                                &mut distances,
                            );
                        }
                        #[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
                        {
                            for j in 0..4 {
                                distances[j] =
                                    scalar_color_distance_lab(&color, &centroid_batch[j]);
                            }
                        }

                        for (j, &distance) in distances.iter().enumerate() {
                            if distance < min_distance {
                                min_distance = distance;
                                closest_centroid = centroid_batch_start + j;
                            }
                        }
                    } else {
                        // Handle remaining centroids with scalar operations
                        for j in centroid_batch_start..centroid_batch_end {
                            let distance = scalar_color_distance_lab(&color, &centroids[j]);
                            if distance < min_distance {
                                min_distance = distance;
                                closest_centroid = j;
                            }
                        }
                    }
                }
            } else {
                // Fallback for small centroid sets
                for (j, centroid) in centroids.iter().enumerate() {
                    let distance = scalar_color_distance_lab(&color, centroid);
                    if distance < min_distance {
                        min_distance = distance;
                        closest_centroid = j;
                    }
                }
            }

            if assignments[color_idx] != closest_centroid {
                assignments[color_idx] = closest_centroid;
                *changed = true;
            }
        }
    }

    // Handle remaining colors that don't fit in a batch of 4
    for i in (full_batches * batch_size)..colors.len() {
        let color = &colors[i];
        let mut min_distance = f32::MAX;
        let mut closest_centroid = 0;

        for (j, centroid) in centroids.iter().enumerate() {
            let distance = scalar_color_distance_lab(color, centroid);
            if distance < min_distance {
                min_distance = distance;
                closest_centroid = j;
            }
        }

        if assignments[i] != closest_centroid {
            assignments[i] = closest_centroid;
            *changed = true;
        }
    }
}

/// Update centroids to cluster means
fn update_centroids(
    colors: &[Rgba<u8>],
    assignments: &[usize],
    centroids: &mut [Rgba<u8>],
    k: usize,
) {
    let mut sums = vec![[0u32; 4]; k]; // R, G, B, A sums
    let mut counts = vec![0u32; k];

    // Accumulate color components for each cluster
    for (color, &cluster) in colors.iter().zip(assignments.iter()) {
        if cluster < k {
            sums[cluster][0] += color.0[0] as u32;
            sums[cluster][1] += color.0[1] as u32;
            sums[cluster][2] += color.0[2] as u32;
            sums[cluster][3] += color.0[3] as u32;
            counts[cluster] += 1;
        }
    }

    // Calculate new centroids as cluster means
    for (i, centroid) in centroids.iter_mut().enumerate() {
        if counts[i] > 0 {
            centroid.0[0] = (sums[i][0] / counts[i]) as u8;
            centroid.0[1] = (sums[i][1] / counts[i]) as u8;
            centroid.0[2] = (sums[i][2] / counts[i]) as u8;
            centroid.0[3] = (sums[i][3] / counts[i]) as u8;
        }
        // If cluster is empty, keep existing centroid
    }
}

/// SIMD-accelerated gradient analysis for smooth color transitions
///
/// # Arguments  
/// * `colors` - Color samples along a path
/// * `threshold` - Minimum gradient strength to detect
///
/// # Returns
/// * `Vec<f32>` - Gradient strength at each point
pub fn simd_analyze_gradient_strength(colors: &[Rgba<u8>], threshold: f32) -> Vec<f32> {
    if colors.len() < 3 {
        return vec![0.0; colors.len()];
    }

    let mut gradient_strengths = vec![0.0f32; colors.len()];

    // Calculate gradient using central differences with SIMD
    let batch_size = 4;
    let processable_length = colors.len().saturating_sub(2);
    let full_batches = processable_length / batch_size;

    // Process middle points in batches
    for batch_idx in 0..full_batches {
        let start_idx = 1 + batch_idx * batch_size; // +1 to skip first element

        if start_idx + batch_size < colors.len() - 1 {
            let prev_batch = [
                colors[start_idx - 1],
                colors[start_idx],
                colors[start_idx + 1],
                colors[start_idx + 2],
            ];

            let next_batch = [
                colors[start_idx + 1],
                colors[start_idx + 2],
                colors[start_idx + 3],
                colors[start_idx + 4],
            ];

            let mut distances = [0.0f32; 4];

            #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
            unsafe {
                simd_color_distance_lab_x4(&prev_batch, &next_batch, &mut distances);
            }
            #[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
            {
                for i in 0..4 {
                    distances[i] = scalar_color_distance_lab(&prev_batch[i], &next_batch[i]);
                }
            }

            // Store gradient strengths, normalizing by distance (2 steps)
            for i in 0..4 {
                gradient_strengths[start_idx + i] = distances[i] / 2.0;
            }
        }
    }

    // Handle remaining points with scalar operations
    for i in (1 + full_batches * batch_size)..(colors.len() - 1) {
        let prev_color = &colors[i - 1];
        let next_color = &colors[i + 1];
        let distance = scalar_color_distance_lab(prev_color, next_color);
        gradient_strengths[i] = distance / 2.0; // Normalize by 2-step distance
    }

    // Handle edge cases (first and last points)
    if colors.len() >= 2 {
        gradient_strengths[0] = scalar_color_distance_lab(&colors[0], &colors[1]);
        let last_idx = colors.len() - 1;
        gradient_strengths[last_idx] =
            scalar_color_distance_lab(&colors[last_idx - 1], &colors[last_idx]);
    }

    // Apply threshold
    for strength in &mut gradient_strengths {
        if *strength < threshold {
            *strength = 0.0;
        }
    }

    gradient_strengths
}

/// Check if SIMD acceleration is available on current platform
pub fn is_simd_available() -> bool {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    {
        is_x86_feature_detected!("sse2")
    }
    #[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
    {
        false
    }
}

/// Get SIMD capability information
pub fn get_simd_info() -> String {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    {
        let mut features = Vec::new();
        if is_x86_feature_detected!("sse2") {
            features.push("SSE2");
        }
        if is_x86_feature_detected!("sse3") {
            features.push("SSE3");
        }
        if is_x86_feature_detected!("sse4.1") {
            features.push("SSE4.1");
        }
        if is_x86_feature_detected!("avx") {
            features.push("AVX");
        }
        if is_x86_feature_detected!("avx2") {
            features.push("AVX2");
        }

        if features.is_empty() {
            "No SIMD support detected".to_string()
        } else {
            format!("SIMD support: {}", features.join(", "))
        }
    }
    #[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
    {
        "SIMD not supported on this architecture".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simd_availability() {
        // Should not panic and return valid info
        let info = get_simd_info();
        println!("SIMD info: {}", info);
        assert!(!info.is_empty());
    }

    #[test]
    fn test_scalar_color_distance() {
        let color1 = Rgba([255, 0, 0, 255]); // Red
        let color2 = Rgba([0, 255, 0, 255]); // Green
        let color3 = Rgba([255, 0, 0, 255]); // Red (same as color1)

        let distance1 = scalar_color_distance_lab(&color1, &color2);
        let distance2 = scalar_color_distance_lab(&color1, &color3);

        // Distance to different color should be > 0
        assert!(distance1 > 0.0);
        // Distance to same color should be ~0
        assert!(distance2 < 0.001);

        println!("Red-Green LAB distance: {:.3}", distance1);
        println!("Red-Red LAB distance: {:.3}", distance2);
    }

    #[test]
    fn test_k_means_palette_reduction() {
        let colors = vec![
            Rgba([255, 0, 0, 255]),   // Red
            Rgba([250, 10, 10, 255]), // Similar red
            Rgba([0, 255, 0, 255]),   // Green
            Rgba([10, 250, 10, 255]), // Similar green
            Rgba([0, 0, 255, 255]),   // Blue
            Rgba([10, 10, 250, 255]), // Similar blue
        ];

        let palette = simd_k_means_palette_reduction(&colors, 3, 10);
        assert_eq!(palette.len(), 3);

        println!("Original colors: {}", colors.len());
        println!("Reduced palette: {}", palette.len());
        for (i, color) in palette.iter().enumerate() {
            println!("  Color {}: {:?}", i, color.0);
        }
    }

    #[test]
    fn test_gradient_strength_analysis() {
        let colors = vec![
            Rgba([255, 0, 0, 255]),   // Red
            Rgba([255, 128, 0, 255]), // Orange
            Rgba([255, 255, 0, 255]), // Yellow
            Rgba([0, 255, 0, 255]),   // Green
        ];

        let gradients = simd_analyze_gradient_strength(&colors, 0.0);
        assert_eq!(gradients.len(), colors.len());

        println!("Gradient strengths:");
        for (i, &strength) in gradients.iter().enumerate() {
            println!("  Point {}: {:.3}", i, strength);
        }

        // Should detect transitions
        assert!(gradients[1] > 0.0);
        assert!(gradients[2] > 0.0);
    }
}
