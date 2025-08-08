//! Color regions vectorization algorithms

use crate::algorithms::logo::{Contour, Point, SvgPath};
use crate::config::RegionsConfig;
use crate::error::{VectorizeError, VectorizeResult};
use crate::preprocessing::{lab_distance, lab_to_rgb, preprocess_for_regions, rgb_to_lab};
use image::{Rgba, RgbaImage};
use rayon::prelude::*;
use std::collections::HashMap;

/// Vectorize an image using color regions approach
///
/// This function implements the complete regions vectorization pipeline:
/// 1. Resize image if needed
/// 2. Convert to LAB color space (optional)
/// 3. Apply k-means clustering to reduce colors
/// 4. Label connected regions
/// 5. Merge similar adjacent regions
/// 6. Extract region boundaries
/// 7. Simplify paths and generate SVG
///
/// # Arguments
/// * `image` - Input RGBA image
/// * `config` - Regions vectorization configuration
///
/// # Returns
/// * `VectorizeResult<Vec<SvgPath>>` - Vector of SVG paths or error
pub fn vectorize_regions(
    image: &RgbaImage,
    config: &RegionsConfig,
) -> VectorizeResult<Vec<SvgPath>> {
    log::debug!("Starting optimized regions vectorization pipeline");

    // Step 1: Apply optimized preprocessing (combines resizing and denoising)
    let preprocessed = preprocess_for_regions(image, config.max_dimension)?;

    // Step 2: Extract colors and convert to working color space with caching
    let colors = extract_colors_with_cache(&preprocessed, config.use_lab_color);

    // Step 3: Apply parallel k-means clustering with optimizations
    let (centroids, labels) = parallel_kmeans_clustering(&colors, config)?;

    // Step 4: Create quantized image
    let quantized = apply_quantization(&preprocessed, &labels, &centroids, config.use_lab_color)?;

    // Step 5: Label connected regions
    let region_map = label_connected_regions(&quantized, preprocessed.dimensions())?;

    // Step 6: Merge similar regions (optional)
    let merged_regions = if config.merge_similar_regions {
        merge_similar_regions(&region_map, &quantized, config.merge_threshold)?
    } else {
        region_map
    };

    // Step 7: Extract region boundaries
    let contours = extract_region_contours(&merged_regions, preprocessed.dimensions())?;

    // Step 8: Filter small regions
    let filtered_contours = filter_regions_by_area(contours, config.min_region_area);

    // Step 9: Convert to SVG paths
    let svg_paths = convert_regions_to_svg(&filtered_contours, &quantized);

    log::debug!(
        "Regions vectorization completed, generated {} paths",
        svg_paths.len()
    );
    Ok(svg_paths)
}

/// Color representation that can be RGB or LAB
#[derive(Debug, Clone, Copy)]
pub enum Color {
    Rgb(u8, u8, u8),
    Lab(f32, f32, f32),
}

impl Color {
    /// Calculate distance between two colors
    pub fn distance(&self, other: &Color) -> f32 {
        match (self, other) {
            (Color::Rgb(r1, g1, b1), Color::Rgb(r2, g2, b2)) => {
                let dr = *r1 as f32 - *r2 as f32;
                let dg = *g1 as f32 - *g2 as f32;
                let db = *b1 as f32 - *b2 as f32;
                (dr * dr + dg * dg + db * db).sqrt()
            }
            (Color::Lab(l1, a1, b1), Color::Lab(l2, a2, b2)) => {
                lab_distance((*l1, *a1, *b1), (*l2, *a2, *b2))
            }
            _ => {
                // Convert to same color space for comparison
                // For simplicity, convert both to LAB
                let lab1 = self.to_lab();
                let lab2 = other.to_lab();
                lab_distance(lab1, lab2)
            }
        }
    }

    /// Convert color to LAB representation
    pub fn to_lab(&self) -> (f32, f32, f32) {
        match self {
            Color::Rgb(r, g, b) => rgb_to_lab(*r, *g, *b),
            Color::Lab(l, a, b) => (*l, *a, *b),
        }
    }

    /// Convert color to RGB representation
    pub fn to_rgb(&self) -> (u8, u8, u8) {
        match self {
            Color::Rgb(r, g, b) => (*r, *g, *b),
            Color::Lab(l, a, b) => lab_to_rgb(*l, *a, *b),
        }
    }
}

/// Extract colors from image with RGB→LAB conversion caching for performance
fn extract_colors_with_cache(image: &RgbaImage, use_lab: bool) -> Vec<Color> {
    if use_lab {
        // Cache RGB→LAB conversions to avoid redundant calculations
        let mut rgb_to_lab_cache: HashMap<(u8, u8, u8), (f32, f32, f32)> = HashMap::new();
        
        image
            .pixels()
            .map(|&Rgba([r, g, b, _])| {
                let lab = rgb_to_lab_cache
                    .entry((r, g, b))
                    .or_insert_with(|| rgb_to_lab(r, g, b));
                Color::Lab(lab.0, lab.1, lab.2)
            })
            .collect()
    } else {
        image
            .pixels()
            .map(|&Rgba([r, g, b, _])| Color::Rgb(r, g, b))
            .collect()
    }
}


/// Parallel k-means clustering with performance optimizations
fn parallel_kmeans_clustering(
    colors: &[Color],
    config: &RegionsConfig,
) -> VectorizeResult<(Vec<Color>, Vec<usize>)> {
    let k = config.num_colors as usize;
    if k == 0 || k > colors.len() {
        return Err(VectorizeError::config_error(
            "Invalid number of colors for k-means",
        ));
    }

    log::debug!("Starting parallel k-means with {} colors and {} clusters", colors.len(), k);
    let start_time = std::time::Instant::now();

    // Convert all colors to LAB once for consistent distance calculations
    let lab_colors: Vec<(f32, f32, f32)> = colors.par_iter().map(|c| c.to_lab()).collect();
    
    // Initialize centroids using k-means++ for better convergence
    let mut centroids = initialize_centroids_kmeans_plus_plus(&lab_colors, k);
    let mut labels = vec![0usize; colors.len()];
    let mut total_squared_distance = f32::INFINITY;

    for iteration in 0..config.max_iterations {
        let mut changed = false;

        // Parallel assignment of points to nearest centroid
        let new_assignments: Vec<(usize, f32)> = lab_colors
            .par_iter()
            .map(|&color| {
                let mut min_distance = f32::INFINITY;
                let mut best_cluster = 0;

                for (j, &centroid) in centroids.iter().enumerate() {
                    let distance = lab_distance(color, centroid);
                    if distance < min_distance {
                        min_distance = distance;
                        best_cluster = j;
                    }
                }

                (best_cluster, min_distance)
            })
            .collect();

        // Update labels and check for changes
        let mut new_total_distance = 0.0f32;
        for (i, (new_label, distance)) in new_assignments.iter().enumerate() {
            if labels[i] != *new_label {
                labels[i] = *new_label;
                changed = true;
            }
            new_total_distance += distance;
        }

        // Convergence check based on distance improvement
        let distance_improvement = (total_squared_distance - new_total_distance) / total_squared_distance;
        total_squared_distance = new_total_distance;
        
        if !changed || distance_improvement < config.convergence_threshold as f32 {
            log::debug!("K-means converged after {} iterations (distance improvement: {:.4})", iteration + 1, distance_improvement);
            break;
        }

        // Parallel centroid update
        let cluster_data: Vec<(f32, f32, f32, usize)> = (0..k)
            .into_par_iter()
            .map(|cluster_idx| {
                let mut sum_l = 0.0f32;
                let mut sum_a = 0.0f32;
                let mut sum_b = 0.0f32;
                let mut count = 0usize;

                for (color, &label) in lab_colors.iter().zip(&labels) {
                    if label == cluster_idx {
                        sum_l += color.0;
                        sum_a += color.1;
                        sum_b += color.2;
                        count += 1;
                    }
                }

                (sum_l, sum_a, sum_b, count)
            })
            .collect();

        // Update centroids with the computed sums
        for (i, (sum_l, sum_a, sum_b, count)) in cluster_data.iter().enumerate() {
            if *count > 0 {
                centroids[i] = (
                    sum_l / *count as f32,
                    sum_a / *count as f32,
                    sum_b / *count as f32,
                );
            }
        }

        if iteration % 5 == 0 {
            log::debug!("K-means iteration {}: total distance = {:.2}", iteration + 1, total_squared_distance);
        }
    }

    let duration = start_time.elapsed();
    log::debug!("K-means completed in {:.2}ms", duration.as_secs_f64() * 1000.0);

    // Convert centroids back to Color enum
    let color_centroids: Vec<Color> = centroids
        .into_iter()
        .map(|(l, a, b)| Color::Lab(l, a, b))
        .collect();

    Ok((color_centroids, labels))
}

/// Initialize centroids using k-means++ algorithm for better convergence
fn initialize_centroids_kmeans_plus_plus(colors: &[(f32, f32, f32)], k: usize) -> Vec<(f32, f32, f32)> {
    let mut centroids = Vec::with_capacity(k);
    let mut rng = fastrand::Rng::new();

    // Choose the first centroid randomly
    if !colors.is_empty() {
        let first_idx = rng.usize(0..colors.len());
        centroids.push(colors[first_idx]);
    }

    // Choose remaining centroids with probability proportional to squared distance
    for _ in 1..k {
        let distances: Vec<f32> = colors
            .par_iter()
            .map(|&color| {
                centroids
                    .iter()
                    .map(|&centroid| lab_distance(color, centroid).powi(2))
                    .min_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                    .unwrap_or(0.0)
            })
            .collect();

        let total_distance: f32 = distances.iter().sum();
        if total_distance <= 0.0 {
            // Fallback to uniform sampling if all points are identical
            let idx = rng.usize(0..colors.len());
            centroids.push(colors[idx]);
            continue;
        }

        let target = rng.f32() * total_distance;
        let mut cumulative = 0.0;

        for (i, &distance) in distances.iter().enumerate() {
            cumulative += distance;
            if cumulative >= target {
                centroids.push(colors[i]);
                break;
            }
        }

        // Ensure we have the right number of centroids
        if centroids.len() < (centroids.capacity().min(colors.len())) {
            centroids.push(colors[rng.usize(0..colors.len())]);
        }
    }

    centroids
}


/// Apply quantization using k-means results
fn apply_quantization(
    image: &RgbaImage,
    labels: &[usize],
    centroids: &[Color],
    _use_lab: bool,
) -> VectorizeResult<Vec<Color>> {
    if labels.len() != (image.width() * image.height()) as usize {
        return Err(VectorizeError::algorithm_error(
            "Mismatched label array size",
        ));
    }

    let quantized = labels.iter().map(|&label| centroids[label]).collect();
    log::debug!("Applied quantization with {} centroids", centroids.len());
    Ok(quantized)
}

/// Label connected regions in quantized image using flood fill
fn label_connected_regions(
    quantized: &[Color],
    dimensions: (u32, u32),
) -> VectorizeResult<HashMap<usize, Vec<(u32, u32)>>> {
    let (width, height) = dimensions;

    log::debug!(
        "Labeling connected regions in {}x{} quantized image",
        width,
        height
    );

    let mut visited = vec![false; quantized.len()];
    let mut regions = HashMap::new();
    let mut region_id = 0;

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;

            if !visited[idx] {
                let region_points = flood_fill(
                    quantized,
                    &mut visited,
                    (width, height),
                    (x, y),
                    &quantized[idx],
                );

                if !region_points.is_empty() {
                    regions.insert(region_id, region_points);
                    region_id += 1;
                }
            }
        }
    }

    log::debug!("Found {} connected regions", regions.len());
    Ok(regions)
}

/// Flood fill algorithm to find connected pixels of same color
fn flood_fill(
    quantized: &[Color],
    visited: &mut [bool],
    dimensions: (u32, u32),
    start: (u32, u32),
    target_color: &Color,
) -> Vec<(u32, u32)> {
    let (width, height) = dimensions;
    let mut stack = vec![start];
    let mut region_points = Vec::new();

    while let Some((x, y)) = stack.pop() {
        if x >= width || y >= height {
            continue;
        }

        let idx = (y * width + x) as usize;

        if visited[idx] || quantized[idx].distance(target_color) > 0.1 {
            continue;
        }

        visited[idx] = true;
        region_points.push((x, y));

        // Add 4-connected neighbors to stack
        if x > 0 {
            stack.push((x - 1, y));
        }
        if x + 1 < width {
            stack.push((x + 1, y));
        }
        if y > 0 {
            stack.push((x, y - 1));
        }
        if y + 1 < height {
            stack.push((x, y + 1));
        }
    }

    region_points
}

/// Merge similar adjacent regions (placeholder)
fn merge_similar_regions(
    regions: &HashMap<usize, Vec<(u32, u32)>>,
    _quantized: &[Color],
    _threshold: f64,
) -> VectorizeResult<HashMap<usize, Vec<(u32, u32)>>> {
    // TODO: Implement region merging based on color similarity
    log::debug!("Merging similar regions");
    Ok(regions.clone())
}

/// Extract contours for each region using boundary tracing
fn extract_region_contours(
    regions: &HashMap<usize, Vec<(u32, u32)>>,
    dimensions: (u32, u32),
) -> VectorizeResult<HashMap<usize, Contour>> {
    log::debug!("Extracting contours for {} regions", regions.len());

    let mut contours = HashMap::new();

    for (&region_id, points) in regions {
        if points.len() < 3 {
            continue; // Skip regions that are too small
        }

        // Create a binary mask for this region
        let mut mask = vec![false; (dimensions.0 * dimensions.1) as usize];
        for &(x, y) in points {
            if x < dimensions.0 && y < dimensions.1 {
                let idx = (y * dimensions.0 + x) as usize;
                mask[idx] = true;
            }
        }

        // Find boundary points
        let boundary_points = find_boundary_points(&mask, dimensions);

        if boundary_points.len() >= 3 {
            // Convert boundary points to contour
            let contour = boundary_points_to_contour(&boundary_points);
            contours.insert(region_id, contour);
        }
    }

    Ok(contours)
}

/// Find boundary points of a region
fn find_boundary_points(mask: &[bool], dimensions: (u32, u32)) -> Vec<(u32, u32)> {
    let (width, height) = dimensions;
    let mut boundary_points = Vec::new();

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;

            if mask[idx] {
                // Check if this is a boundary pixel (has a non-region neighbor)
                let mut is_boundary = false;

                for dy in -1..=1 {
                    for dx in -1..=1 {
                        if dx == 0 && dy == 0 {
                            continue;
                        }

                        let nx = x as i32 + dx;
                        let ny = y as i32 + dy;

                        if nx < 0 || nx >= width as i32 || ny < 0 || ny >= height as i32 {
                            is_boundary = true;
                            break;
                        }

                        let nidx = (ny as u32 * width + nx as u32) as usize;
                        if !mask[nidx] {
                            is_boundary = true;
                            break;
                        }
                    }
                    if is_boundary {
                        break;
                    }
                }

                if is_boundary {
                    boundary_points.push((x, y));
                }
            }
        }
    }

    boundary_points
}

/// Convert boundary points to a contour by creating a convex hull approximation
fn boundary_points_to_contour(points: &[(u32, u32)]) -> Contour {
    if points.is_empty() {
        return Vec::new();
    }

    // For simplicity, use a bounding box as the contour
    // A proper implementation would use convex hull or concave hull algorithms
    let min_x = points.iter().map(|(x, _)| *x).min().unwrap_or(0) as f32;
    let max_x = points.iter().map(|(x, _)| *x).max().unwrap_or(0) as f32;
    let min_y = points.iter().map(|(_, y)| *y).min().unwrap_or(0) as f32;
    let max_y = points.iter().map(|(_, y)| *y).max().unwrap_or(0) as f32;

    // Add small padding to ensure we capture the region
    vec![
        Point { x: min_x, y: min_y },
        Point { x: max_x, y: min_y },
        Point { x: max_x, y: max_y },
        Point { x: min_x, y: max_y },
    ]
}

/// Filter regions by minimum area
fn filter_regions_by_area(
    contours: HashMap<usize, Contour>,
    min_area: u32,
) -> HashMap<usize, Contour> {
    log::debug!(
        "Filtering {} contours with min_area {}",
        contours.len(),
        min_area
    );

    let filtered: HashMap<_, _> = contours
        .into_iter()
        .filter(|(region_id, contour)| {
            let area = calculate_contour_area(contour);
            let keep = area >= min_area as f32;
            log::debug!(
                "Region {}: area={:.2}, min_area={}, keep={}",
                region_id,
                area,
                min_area,
                keep
            );
            keep
        })
        .collect();

    log::debug!("After filtering: {} regions remain", filtered.len());
    filtered
}

/// Calculate approximate area of a contour
fn calculate_contour_area(contour: &[Point]) -> f32 {
    if contour.len() < 3 {
        return 0.0;
    }

    let mut area = 0.0;
    for i in 0..contour.len() {
        let j = (i + 1) % contour.len();
        area += contour[i].x * contour[j].y;
        area -= contour[j].x * contour[i].y;
    }
    (area / 2.0).abs()
}

/// Convert regions to SVG paths with appropriate colors
fn convert_regions_to_svg(contours: &HashMap<usize, Contour>, quantized: &[Color]) -> Vec<SvgPath> {
    let _width = (quantized.len() as f64).sqrt() as u32;

    contours
        .iter()
        .map(|(&region_id, contour)| {
            let mut path_data = String::new();

            if !contour.is_empty() {
                path_data.push_str(&format!("M {:.2} {:.2}", contour[0].x, contour[0].y));

                for point in &contour[1..] {
                    path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
                }

                path_data.push_str(" Z");
            }

            // Get the representative color for this region
            let fill_color = if !contour.is_empty() {
                let width = (quantized.len() as f64).sqrt() as u32; // Approximate width
                if width > 0 {
                    let center_x = contour.iter().map(|p| p.x).sum::<f32>() / contour.len() as f32;
                    let center_y = contour.iter().map(|p| p.y).sum::<f32>() / contour.len() as f32;
                    let center_idx = ((center_y as u32).min(width.saturating_sub(1)) * width
                        + (center_x as u32).min(width.saturating_sub(1)))
                        as usize;

                    if center_idx < quantized.len() {
                        let (r, g, b) = quantized[center_idx].to_rgb();
                        format!("rgb({}, {}, {})", r, g, b)
                    } else {
                        // Fallback to HSL color based on region ID
                        let hue = (region_id * 137) % 360;
                        format!("hsl({}, 70%, 50%)", hue)
                    }
                } else {
                    // Fallback to HSL color based on region ID
                    let hue = (region_id * 137) % 360;
                    format!("hsl({}, 70%, 50%)", hue)
                }
            } else {
                // Fallback to HSL color based on region ID
                let hue = (region_id * 137) % 360;
                format!("hsl({}, 70%, 50%)", hue)
            };

            SvgPath {
                path_data,
                fill: Some(fill_color),
                stroke: None,
                stroke_width: None,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::ImageBuffer;

    #[test]
    fn test_color_distance() {
        let red = Color::Rgb(255, 0, 0);
        let green = Color::Rgb(0, 255, 0);
        let red_lab = Color::Lab(53.24, 80.09, 67.20);

        let distance_rgb = red.distance(&green);
        let distance_lab = red.distance(&red_lab);

        assert!(distance_rgb > 300.0); // Should be large
        assert!(distance_lab < 50.0); // Should be small (same color)
    }

    #[test]
    fn test_vectorize_regions() {
        // Create a simple 4x4 solid color image for easier testing
        let img = ImageBuffer::from_fn(4, 4, |_x, _y| {
            Rgba([255, 0, 0, 255]) // Solid red
        });

        let mut config = RegionsConfig::default();
        config.min_region_area = 1; // Lower minimum area for test
        config.num_colors = 2; // Ensure we have distinct colors
        config.max_iterations = 10; // Fewer iterations for test

        let result = vectorize_regions(&img, &config);

        assert!(result.is_ok());
        let paths = result.unwrap();

        // Debug output
        println!("Generated {} paths", paths.len());
        for (i, path) in paths.iter().enumerate() {
            println!("Path {}: {}", i, path.path_data);
            println!("Fill: {:?}", path.fill);
        }

        // With a solid color image, we should get at least one region
        assert!(!paths.is_empty());
    }

    #[test]
    fn test_k_means_clustering() {
        let colors = vec![
            Color::Rgb(255, 0, 0), // Red
            Color::Rgb(255, 0, 0), // Red
            Color::Rgb(0, 0, 255), // Blue
            Color::Rgb(0, 0, 255), // Blue
        ];

        let config = RegionsConfig {
            num_colors: 2,
            max_iterations: 10,
            ..Default::default()
        };
        let result = parallel_kmeans_clustering(&colors, &config);

        assert!(result.is_ok());
        let (centroids, labels) = result.unwrap();
        assert_eq!(centroids.len(), 2);
        assert_eq!(labels.len(), 4);
    }
}
