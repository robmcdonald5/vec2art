//! Color regions vectorization algorithms

use crate::algorithms::logo::{Contour, Point, SvgPath, SvgElementType};
use crate::algorithms::primitives::{detect_primitive, primitive_to_svg, PrimitiveConfig};
use crate::algorithms::gradient_detection::{GradientConfig, analyze_regions_gradients};
use crate::config::{RegionsConfig, SegmentationMethod, QuantizationMethod};
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

    // Step 2-5: Apply segmentation based on chosen method
    let (region_map, quantized) = match config.segmentation_method {
        SegmentationMethod::KMeans => {
            // Traditional k-means approach with configurable quantization
            let colors = extract_colors_with_cache(&preprocessed, config.use_lab_color);
            let (centroids, labels) = match config.quantization_method {
                QuantizationMethod::KMeans => parallel_kmeans_clustering(&colors, config)?,
                QuantizationMethod::Wu => wu_color_quantization(&colors, config)?,
            };
            let quantized = apply_quantization(&preprocessed, &labels, &centroids, config.use_lab_color)?;
            let region_map = label_connected_regions(&quantized, preprocessed.dimensions())?;
            (region_map, quantized)
        }
        SegmentationMethod::Slic => {
            // SLIC superpixel segmentation
            slic_segmentation(&preprocessed, config)?
        }
    };

    // Step 6: Merge similar regions (optional)
    let merged_regions = if config.merge_similar_regions {
        merge_similar_regions_with_colors(&region_map, &quantized, &preprocessed, config.merge_threshold)?
    } else {
        region_map
    };

    // Step 7: Extract region boundaries
    let contours = extract_region_contours(&merged_regions, preprocessed.dimensions())?;

    // Step 8: Filter small regions
    let filtered_contours = filter_regions_by_area(contours, config.min_region_area);

    // Step 9: Analyze regions for gradient patterns if enabled
    let gradient_analyses = if config.detect_gradients {
        let gradient_config = GradientConfig {
            enabled: config.detect_gradients,
            r_squared_threshold: config.gradient_r_squared_threshold,
            max_gradient_stops: config.max_gradient_stops,
            min_region_area: config.min_gradient_region_area,
            radial_symmetry_threshold: config.radial_symmetry_threshold,
        };
        
        let filtered_regions = create_filtered_regions_map(&filtered_contours, &merged_regions);
        analyze_regions_gradients(&filtered_regions, &quantized, preprocessed.dimensions(), &gradient_config)?
    } else {
        HashMap::new()
    };

    // Step 10: Apply primitive detection if enabled, then convert to SVG paths with gradient support
    let svg_paths = if config.detect_primitives {
        convert_regions_to_svg_with_primitives_and_gradients(&filtered_contours, &quantized, &gradient_analyses, config)?
    } else {
        convert_regions_to_svg_with_gradients(&filtered_contours, &quantized, &gradient_analyses)
    };

    let gradient_count = gradient_analyses.values().filter(|a| a.use_gradient).count();
    log::debug!(
        "Regions vectorization completed, generated {} paths ({} with gradients)",
        svg_paths.len(),
        gradient_count
    );
    Ok(svg_paths)
}

// Helper functions for edge case handling in regions algorithm

/// Count unique colors in the image for validation
#[allow(dead_code)]
fn count_unique_colors_regions(image: &RgbaImage) -> u32 {
    let mut unique_colors = std::collections::HashSet::new();
    
    for pixel in image.pixels() {
        if pixel.0[3] >= 10 { // Only count opaque-ish pixels
            unique_colors.insert((pixel.0[0], pixel.0[1], pixel.0[2]));
        }
    }
    
    unique_colors.len() as u32
}

/// Create a simple region fallback for edge cases
#[allow(dead_code)]
fn create_simple_region_fallback(width: u32, height: u32, image: &RgbaImage) -> SvgPath {
    // Find the dominant color by sampling the center
    let center_pixel = image.get_pixel(width / 2, height / 2);
    let fill_color = format!("rgb({},{},{})", center_pixel.0[0], center_pixel.0[1], center_pixel.0[2]);
    
    // Create a simple rectangle covering the whole image
    let path_data = format!("M 0 0 L {} 0 L {} {} L 0 {} Z", width, height, width, height);
    
    SvgPath {
        path_data,
        fill: Some(fill_color),
        stroke: None,
        stroke_width: None,
        element_type: SvgElementType::Path,
    }
}

/// Create a single color region SVG for uniform images
#[allow(dead_code)]
fn create_single_color_region_svg(image: &RgbaImage) -> SvgPath {
    let width = image.width();
    let height = image.height();
    
    // Sample the center pixel for color
    let center_pixel = image.get_pixel(width / 2, height / 2);
    let fill_color = format!("rgb({},{},{})", center_pixel.0[0], center_pixel.0[1], center_pixel.0[2]);
    
    let path_data = format!("M 0 0 L {} 0 L {} {} L 0 {} Z", width, height, width, height);
    
    SvgPath {
        path_data,
        fill: Some(fill_color),
        stroke: None,
        stroke_width: None,
        element_type: SvgElementType::Path,
    }
}

/// Create trivial clustering when k > number of unique colors
#[allow(dead_code)]
fn create_trivial_clustering(colors: &[Color]) -> VectorizeResult<(Vec<Color>, Vec<usize>)> {
    // Create a cluster for each unique color
    let mut unique_colors = Vec::new();
    let mut labels = Vec::new();
    
    for color in colors {
        // Find existing cluster or create new one
        let mut cluster_idx = None;
        for (idx, unique_color) in unique_colors.iter().enumerate() {
            if color.distance(unique_color) < 0.1 { // Very small threshold for "identical" colors
                cluster_idx = Some(idx);
                break;
            }
        }
        
        match cluster_idx {
            Some(idx) => labels.push(idx),
            None => {
                unique_colors.push(*color);
                labels.push(unique_colors.len() - 1);
            }
        }
    }
    
    log::debug!("Created trivial clustering with {} unique colors", unique_colors.len());
    Ok((unique_colors, labels))
}

/// Create single cluster for k=1
#[allow(dead_code)]
fn create_single_cluster(colors: &[Color]) -> VectorizeResult<(Vec<Color>, Vec<usize>)> {
    if colors.is_empty() {
        return Err(VectorizeError::insufficient_data(1, 0));
    }
    
    // Calculate centroid of all colors
    let lab_colors: Vec<(f32, f32, f32)> = colors.iter().map(|c| c.to_lab()).collect();
    
    let mut sum_l = 0.0f32;
    let mut sum_a = 0.0f32;
    let mut sum_b = 0.0f32;
    
    for (l, a, b) in &lab_colors {
        sum_l += l;
        sum_a += a;
        sum_b += b;
    }
    
    let count = colors.len() as f32;
    let centroid = Color::Lab(sum_l / count, sum_a / count, sum_b / count);
    
    let labels = vec![0; colors.len()];
    
    Ok((vec![centroid], labels))
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

/// SLIC superpixel cluster center
#[derive(Debug, Clone)]
pub struct SlicCenter {
    /// LAB color values
    pub l: f32,
    pub a: f32,
    pub b: f32,
    /// Spatial coordinates
    pub x: f32,
    pub y: f32,
    /// Pixel count assigned to this center
    pub pixel_count: u32,
}

impl SlicCenter {
    /// Create a new SLIC center
    pub fn new(l: f32, a: f32, b: f32, x: f32, y: f32) -> Self {
        Self {
            l,
            a,
            b,
            x,
            y,
            pixel_count: 0,
        }
    }

    /// Reset the center for accumulation
    pub fn reset(&mut self) {
        self.l = 0.0;
        self.a = 0.0;
        self.b = 0.0;
        self.x = 0.0;
        self.y = 0.0;
        self.pixel_count = 0;
    }

    /// Finalize the center after accumulation
    pub fn finalize(&mut self) {
        if self.pixel_count > 0 {
            let count = self.pixel_count as f32;
            self.l /= count;
            self.a /= count;
            self.b /= count;
            self.x /= count;
            self.y /= count;
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

/// Wu color quantization using 3D histogram and variance-based median cut
/// 
/// Implementation of Xiaolin Wu's color quantization algorithm:
/// 1. Build 3D histogram in LAB color space
/// 2. Calculate moments for variance computation
/// 3. Split boxes along axis with maximum variance
/// 4. Use priority queue to split boxes with highest variance first
/// 5. Extract palette by computing mean color of each final box
fn wu_color_quantization(
    colors: &[Color],
    config: &RegionsConfig,
) -> VectorizeResult<(Vec<Color>, Vec<usize>)> {
    let k = config.num_colors as usize;
    if k == 0 || k > colors.len() {
        return Err(VectorizeError::config_error(
            "Invalid number of colors for Wu quantization",
        ));
    }

    log::debug!("Starting Wu color quantization with {} colors and {} target colors", colors.len(), k);
    let start_time = std::time::Instant::now();

    // Convert all colors to LAB once for consistent processing
    let lab_colors: Vec<(f32, f32, f32)> = colors.par_iter().map(|c| c.to_lab()).collect();

    // Build 3D histogram with reasonable quantization (32 bins per channel)
    const HIST_SIZE: usize = 32;
    let histogram = build_3d_histogram(&lab_colors, HIST_SIZE);

    // Calculate moments for variance computation
    let moments = calculate_histogram_moments(&histogram, HIST_SIZE);

    // Initialize with a single box containing all colors
    let initial_box = WuBox {
        min_l: 0,
        max_l: HIST_SIZE - 1,
        min_a: 0,
        max_a: HIST_SIZE - 1,
        min_b: 0,
        max_b: HIST_SIZE - 1,
        volume: calculate_box_volume(0, HIST_SIZE - 1, 0, HIST_SIZE - 1, 0, HIST_SIZE - 1, &moments),
        count: lab_colors.len(),
    };

    // Split boxes using priority queue based on variance
    let mut boxes = vec![initial_box];
    while boxes.len() < k {
        // Find box with maximum variance
        let max_variance_idx = find_max_variance_box(&boxes, &histogram, &moments, HIST_SIZE);
        if max_variance_idx.is_none() {
            break; // No more splittable boxes
        }

        let box_to_split = boxes.remove(max_variance_idx.unwrap());
        match split_box_by_variance(box_to_split.clone(), &histogram, &moments, HIST_SIZE) {
            Ok((box1, box2)) => {
                boxes.push(box1);
                boxes.push(box2);
            }
            Err(_) => {
                // Box cannot be split, put it back and stop trying to split further
                // This is not an error - we just reached the limit of what can be split
                log::debug!("Wu quantization: Reached unsplittable box, stopping with {} colors instead of {}", boxes.len(), k);
                boxes.push(box_to_split);
                break;
            }
        }
    }

    // Extract palette from final boxes
    let centroids = extract_palette_from_boxes(&boxes, &histogram, HIST_SIZE);

    // Assign each original color to nearest centroid
    let labels = assign_colors_to_centroids(&lab_colors, &centroids);

    let duration = start_time.elapsed();
    log::debug!("Wu quantization completed in {:.2}ms with {} final colors", 
               duration.as_secs_f64() * 1000.0, centroids.len());

    // Convert centroids back to Color enum
    let color_centroids: Vec<Color> = centroids
        .into_iter()
        .map(|(l, a, b)| Color::Lab(l, a, b))
        .collect();

    Ok((color_centroids, labels))
}

/// Box for Wu quantization algorithm
#[derive(Debug, Clone)]
struct WuBox {
    min_l: usize,
    max_l: usize,
    min_a: usize,
    max_a: usize,
    min_b: usize,
    max_b: usize,
    volume: f32,
    #[allow(dead_code)]
    count: usize,
}

/// Moments for variance calculation in Wu algorithm
#[derive(Debug, Clone)]
struct WuMoments {
    moment0: Vec<Vec<Vec<f32>>>, // Count
    moment1: Vec<Vec<Vec<(f32, f32, f32)>>>, // Sum of coordinates
    moment2: Vec<Vec<Vec<(f32, f32, f32)>>>, // Sum of squares
}

/// Build 3D histogram from LAB colors
fn build_3d_histogram(lab_colors: &[(f32, f32, f32)], hist_size: usize) -> Vec<Vec<Vec<u32>>> {
    let mut histogram = vec![vec![vec![0u32; hist_size]; hist_size]; hist_size];
    
    // Find LAB bounds for proper quantization
    let mut min_l = f32::INFINITY;
    let mut max_l = f32::NEG_INFINITY;
    let mut min_a = f32::INFINITY;
    let mut max_a = f32::NEG_INFINITY;
    let mut min_b = f32::INFINITY;
    let mut max_b = f32::NEG_INFINITY;
    
    for &(l, a, b) in lab_colors {
        min_l = min_l.min(l);
        max_l = max_l.max(l);
        min_a = min_a.min(a);
        max_a = max_a.max(a);
        min_b = min_b.min(b);
        max_b = max_b.max(b);
    }
    
    let l_range = max_l - min_l;
    let a_range = max_a - min_a;
    let b_range = max_b - min_b;
    
    // Quantize colors into histogram
    for &(l, a, b) in lab_colors {
        let l_bin = ((l - min_l) / l_range * (hist_size - 1) as f32).round().max(0.0).min((hist_size - 1) as f32) as usize;
        let a_bin = ((a - min_a) / a_range * (hist_size - 1) as f32).round().max(0.0).min((hist_size - 1) as f32) as usize;
        let b_bin = ((b - min_b) / b_range * (hist_size - 1) as f32).round().max(0.0).min((hist_size - 1) as f32) as usize;
        
        histogram[l_bin][a_bin][b_bin] += 1;
    }
    
    histogram
}

/// Calculate moments for variance computation
fn calculate_histogram_moments(histogram: &[Vec<Vec<u32>>], hist_size: usize) -> WuMoments {
    let mut moment0 = vec![vec![vec![0.0f32; hist_size]; hist_size]; hist_size];
    let mut moment1 = vec![vec![vec![(0.0f32, 0.0f32, 0.0f32); hist_size]; hist_size]; hist_size];
    let mut moment2 = vec![vec![vec![(0.0f32, 0.0f32, 0.0f32); hist_size]; hist_size]; hist_size];
    
    // Calculate cumulative moments
    for l in 0..hist_size {
        for a in 0..hist_size {
            for b in 0..hist_size {
                let count = histogram[l][a][b] as f32;
                
                moment0[l][a][b] = count;
                moment1[l][a][b] = (l as f32 * count, a as f32 * count, b as f32 * count);
                moment2[l][a][b] = (
                    (l as f32).powi(2) * count,
                    (a as f32).powi(2) * count,
                    (b as f32).powi(2) * count,
                );
                
                // Add cumulative values from previous positions
                if l > 0 {
                    moment0[l][a][b] += moment0[l - 1][a][b];
                    let prev1 = moment1[l - 1][a][b];
                    moment1[l][a][b].0 += prev1.0;
                    moment1[l][a][b].1 += prev1.1;
                    moment1[l][a][b].2 += prev1.2;
                    let prev2 = moment2[l - 1][a][b];
                    moment2[l][a][b].0 += prev2.0;
                    moment2[l][a][b].1 += prev2.1;
                    moment2[l][a][b].2 += prev2.2;
                }
                
                if a > 0 {
                    moment0[l][a][b] += moment0[l][a - 1][b];
                    let prev1 = moment1[l][a - 1][b];
                    moment1[l][a][b].0 += prev1.0;
                    moment1[l][a][b].1 += prev1.1;
                    moment1[l][a][b].2 += prev1.2;
                    let prev2 = moment2[l][a - 1][b];
                    moment2[l][a][b].0 += prev2.0;
                    moment2[l][a][b].1 += prev2.1;
                    moment2[l][a][b].2 += prev2.2;
                }
                
                if b > 0 {
                    moment0[l][a][b] += moment0[l][a][b - 1];
                    let prev1 = moment1[l][a][b - 1];
                    moment1[l][a][b].0 += prev1.0;
                    moment1[l][a][b].1 += prev1.1;
                    moment1[l][a][b].2 += prev1.2;
                    let prev2 = moment2[l][a][b - 1];
                    moment2[l][a][b].0 += prev2.0;
                    moment2[l][a][b].1 += prev2.1;
                    moment2[l][a][b].2 += prev2.2;
                }
                
                // Subtract over-counted regions for 3D cumulation
                if l > 0 && a > 0 {
                    moment0[l][a][b] -= moment0[l - 1][a - 1][b];
                    let prev1 = moment1[l - 1][a - 1][b];
                    moment1[l][a][b].0 -= prev1.0;
                    moment1[l][a][b].1 -= prev1.1;
                    moment1[l][a][b].2 -= prev1.2;
                    let prev2 = moment2[l - 1][a - 1][b];
                    moment2[l][a][b].0 -= prev2.0;
                    moment2[l][a][b].1 -= prev2.1;
                    moment2[l][a][b].2 -= prev2.2;
                }
                
                if l > 0 && b > 0 {
                    moment0[l][a][b] -= moment0[l - 1][a][b - 1];
                    let prev1 = moment1[l - 1][a][b - 1];
                    moment1[l][a][b].0 -= prev1.0;
                    moment1[l][a][b].1 -= prev1.1;
                    moment1[l][a][b].2 -= prev1.2;
                    let prev2 = moment2[l - 1][a][b - 1];
                    moment2[l][a][b].0 -= prev2.0;
                    moment2[l][a][b].1 -= prev2.1;
                    moment2[l][a][b].2 -= prev2.2;
                }
                
                if a > 0 && b > 0 {
                    moment0[l][a][b] -= moment0[l][a - 1][b - 1];
                    let prev1 = moment1[l][a - 1][b - 1];
                    moment1[l][a][b].0 -= prev1.0;
                    moment1[l][a][b].1 -= prev1.1;
                    moment1[l][a][b].2 -= prev1.2;
                    let prev2 = moment2[l][a - 1][b - 1];
                    moment2[l][a][b].0 -= prev2.0;
                    moment2[l][a][b].1 -= prev2.1;
                    moment2[l][a][b].2 -= prev2.2;
                }
                
                // Add back the triply-subtracted corner
                if l > 0 && a > 0 && b > 0 {
                    moment0[l][a][b] += moment0[l - 1][a - 1][b - 1];
                    let prev1 = moment1[l - 1][a - 1][b - 1];
                    moment1[l][a][b].0 += prev1.0;
                    moment1[l][a][b].1 += prev1.1;
                    moment1[l][a][b].2 += prev1.2;
                    let prev2 = moment2[l - 1][a - 1][b - 1];
                    moment2[l][a][b].0 += prev2.0;
                    moment2[l][a][b].1 += prev2.1;
                    moment2[l][a][b].2 += prev2.2;
                }
            }
        }
    }
    
    WuMoments { moment0, moment1, moment2 }
}

/// Calculate volume (variance) of a box
fn calculate_box_volume(
    min_l: usize, max_l: usize,
    min_a: usize, max_a: usize,
    min_b: usize, max_b: usize,
    moments: &WuMoments,
) -> f32 {
    if min_l > max_l || min_a > max_a || min_b > max_b {
        return 0.0;
    }
    
    let count = get_moment_value(&moments.moment0, min_l, max_l, min_a, max_a, min_b, max_b);
    if count <= 0.0 {
        return 0.0;
    }
    
    let sum = get_moment_value_3d(&moments.moment1, min_l, max_l, min_a, max_a, min_b, max_b);
    let sum_squares = get_moment_value_3d(&moments.moment2, min_l, max_l, min_a, max_a, min_b, max_b);
    
    // Variance = E[X²] - E[X]²
    let mean_l = sum.0 / count;
    let mean_a = sum.1 / count;
    let mean_b = sum.2 / count;
    
    let variance_l = (sum_squares.0 / count) - mean_l.powi(2);
    let variance_a = (sum_squares.1 / count) - mean_a.powi(2);
    let variance_b = (sum_squares.2 / count) - mean_b.powi(2);
    
    variance_l + variance_a + variance_b
}

/// Get moment value from 3D cumulative array
fn get_moment_value(moment: &[Vec<Vec<f32>>], min_l: usize, max_l: usize, min_a: usize, max_a: usize, min_b: usize, max_b: usize) -> f32 {
    let mut value = moment[max_l][max_a][max_b];
    
    if min_l > 0 {
        value -= moment[min_l - 1][max_a][max_b];
    }
    if min_a > 0 {
        value -= moment[max_l][min_a - 1][max_b];
    }
    if min_b > 0 {
        value -= moment[max_l][max_a][min_b - 1];
    }
    
    if min_l > 0 && min_a > 0 {
        value += moment[min_l - 1][min_a - 1][max_b];
    }
    if min_l > 0 && min_b > 0 {
        value += moment[min_l - 1][max_a][min_b - 1];
    }
    if min_a > 0 && min_b > 0 {
        value += moment[max_l][min_a - 1][min_b - 1];
    }
    
    if min_l > 0 && min_a > 0 && min_b > 0 {
        value -= moment[min_l - 1][min_a - 1][min_b - 1];
    }
    
    value
}

/// Get 3D moment value from cumulative array
fn get_moment_value_3d(moment: &[Vec<Vec<(f32, f32, f32)>>], min_l: usize, max_l: usize, min_a: usize, max_a: usize, min_b: usize, max_b: usize) -> (f32, f32, f32) {
    let mut value = moment[max_l][max_a][max_b];
    
    if min_l > 0 {
        let sub = moment[min_l - 1][max_a][max_b];
        value.0 -= sub.0;
        value.1 -= sub.1;
        value.2 -= sub.2;
    }
    if min_a > 0 {
        let sub = moment[max_l][min_a - 1][max_b];
        value.0 -= sub.0;
        value.1 -= sub.1;
        value.2 -= sub.2;
    }
    if min_b > 0 {
        let sub = moment[max_l][max_a][min_b - 1];
        value.0 -= sub.0;
        value.1 -= sub.1;
        value.2 -= sub.2;
    }
    
    if min_l > 0 && min_a > 0 {
        let add = moment[min_l - 1][min_a - 1][max_b];
        value.0 += add.0;
        value.1 += add.1;
        value.2 += add.2;
    }
    if min_l > 0 && min_b > 0 {
        let add = moment[min_l - 1][max_a][min_b - 1];
        value.0 += add.0;
        value.1 += add.1;
        value.2 += add.2;
    }
    if min_a > 0 && min_b > 0 {
        let add = moment[max_l][min_a - 1][min_b - 1];
        value.0 += add.0;
        value.1 += add.1;
        value.2 += add.2;
    }
    
    if min_l > 0 && min_a > 0 && min_b > 0 {
        let sub = moment[min_l - 1][min_a - 1][min_b - 1];
        value.0 -= sub.0;
        value.1 -= sub.1;
        value.2 -= sub.2;
    }
    
    value
}

/// Find box with maximum variance for splitting
fn find_max_variance_box(boxes: &[WuBox], _histogram: &[Vec<Vec<u32>>], _moments: &WuMoments, _hist_size: usize) -> Option<usize> {
    let mut max_variance = -1.0f32;
    let mut max_idx = None;
    
    for (i, box_item) in boxes.iter().enumerate() {
        // Only split boxes that can be split (have size > 1 in at least one dimension)
        let can_split_l = box_item.max_l > box_item.min_l;
        let can_split_a = box_item.max_a > box_item.min_a;
        let can_split_b = box_item.max_b > box_item.min_b;
        
        if (can_split_l || can_split_a || can_split_b) && box_item.volume > max_variance {
            max_variance = box_item.volume;
            max_idx = Some(i);
        }
    }
    
    max_idx
}

/// Split a box along the axis with maximum variance reduction
fn split_box_by_variance(
    box_to_split: WuBox,
    histogram: &[Vec<Vec<u32>>],
    moments: &WuMoments,
    hist_size: usize,
) -> VectorizeResult<(WuBox, WuBox)> {
    let mut best_split = None;
    let mut best_reduction = -1.0f32;
    
    // Try splitting along L axis
    if box_to_split.max_l > box_to_split.min_l {
        for split_point in box_to_split.min_l..box_to_split.max_l {
            let volume1 = calculate_box_volume(
                box_to_split.min_l, split_point,
                box_to_split.min_a, box_to_split.max_a,
                box_to_split.min_b, box_to_split.max_b,
                moments,
            );
            let volume2 = calculate_box_volume(
                split_point + 1, box_to_split.max_l,
                box_to_split.min_a, box_to_split.max_a,
                box_to_split.min_b, box_to_split.max_b,
                moments,
            );
            
            let reduction = box_to_split.volume - volume1 - volume2;
            if reduction > best_reduction {
                best_reduction = reduction;
                best_split = Some(('l', split_point));
            }
        }
    }
    
    // Try splitting along A axis
    if box_to_split.max_a > box_to_split.min_a {
        for split_point in box_to_split.min_a..box_to_split.max_a {
            let volume1 = calculate_box_volume(
                box_to_split.min_l, box_to_split.max_l,
                box_to_split.min_a, split_point,
                box_to_split.min_b, box_to_split.max_b,
                moments,
            );
            let volume2 = calculate_box_volume(
                box_to_split.min_l, box_to_split.max_l,
                split_point + 1, box_to_split.max_a,
                box_to_split.min_b, box_to_split.max_b,
                moments,
            );
            
            let reduction = box_to_split.volume - volume1 - volume2;
            if reduction > best_reduction {
                best_reduction = reduction;
                best_split = Some(('a', split_point));
            }
        }
    }
    
    // Try splitting along B axis
    if box_to_split.max_b > box_to_split.min_b {
        for split_point in box_to_split.min_b..box_to_split.max_b {
            let volume1 = calculate_box_volume(
                box_to_split.min_l, box_to_split.max_l,
                box_to_split.min_a, box_to_split.max_a,
                box_to_split.min_b, split_point,
                moments,
            );
            let volume2 = calculate_box_volume(
                box_to_split.min_l, box_to_split.max_l,
                box_to_split.min_a, box_to_split.max_a,
                split_point + 1, box_to_split.max_b,
                moments,
            );
            
            let reduction = box_to_split.volume - volume1 - volume2;
            if reduction > best_reduction {
                best_reduction = reduction;
                best_split = Some(('b', split_point));
            }
        }
    }
    
    // If no good variance-based split found, use fallback strategy
    if best_split.is_none() {
        best_split = find_fallback_split(&box_to_split);
        if let Some((axis, _)) = best_split {
            log::debug!("Wu quantization: Using fallback split on {} axis for box with dimensions L={}-{}, A={}-{}, B={}-{}", 
                axis, box_to_split.min_l, box_to_split.max_l, 
                box_to_split.min_a, box_to_split.max_a,
                box_to_split.min_b, box_to_split.max_b);
        }
    }
    
    match best_split {
        Some(('l', split_point)) => {
            let box1 = WuBox {
                min_l: box_to_split.min_l,
                max_l: split_point,
                min_a: box_to_split.min_a,
                max_a: box_to_split.max_a,
                min_b: box_to_split.min_b,
                max_b: box_to_split.max_b,
                volume: calculate_box_volume(
                    box_to_split.min_l, split_point,
                    box_to_split.min_a, box_to_split.max_a,
                    box_to_split.min_b, box_to_split.max_b,
                    moments,
                ),
                count: count_pixels_in_box(
                    box_to_split.min_l, split_point,
                    box_to_split.min_a, box_to_split.max_a,
                    box_to_split.min_b, box_to_split.max_b,
                    histogram, hist_size,
                ),
            };
            let box2 = WuBox {
                min_l: split_point + 1,
                max_l: box_to_split.max_l,
                min_a: box_to_split.min_a,
                max_a: box_to_split.max_a,
                min_b: box_to_split.min_b,
                max_b: box_to_split.max_b,
                volume: calculate_box_volume(
                    split_point + 1, box_to_split.max_l,
                    box_to_split.min_a, box_to_split.max_a,
                    box_to_split.min_b, box_to_split.max_b,
                    moments,
                ),
                count: count_pixels_in_box(
                    split_point + 1, box_to_split.max_l,
                    box_to_split.min_a, box_to_split.max_a,
                    box_to_split.min_b, box_to_split.max_b,
                    histogram, hist_size,
                ),
            };
            Ok((box1, box2))
        }
        Some(('a', split_point)) => {
            let box1 = WuBox {
                min_l: box_to_split.min_l,
                max_l: box_to_split.max_l,
                min_a: box_to_split.min_a,
                max_a: split_point,
                min_b: box_to_split.min_b,
                max_b: box_to_split.max_b,
                volume: calculate_box_volume(
                    box_to_split.min_l, box_to_split.max_l,
                    box_to_split.min_a, split_point,
                    box_to_split.min_b, box_to_split.max_b,
                    moments,
                ),
                count: count_pixels_in_box(
                    box_to_split.min_l, box_to_split.max_l,
                    box_to_split.min_a, split_point,
                    box_to_split.min_b, box_to_split.max_b,
                    histogram, hist_size,
                ),
            };
            let box2 = WuBox {
                min_l: box_to_split.min_l,
                max_l: box_to_split.max_l,
                min_a: split_point + 1,
                max_a: box_to_split.max_a,
                min_b: box_to_split.min_b,
                max_b: box_to_split.max_b,
                volume: calculate_box_volume(
                    box_to_split.min_l, box_to_split.max_l,
                    split_point + 1, box_to_split.max_a,
                    box_to_split.min_b, box_to_split.max_b,
                    moments,
                ),
                count: count_pixels_in_box(
                    box_to_split.min_l, box_to_split.max_l,
                    split_point + 1, box_to_split.max_a,
                    box_to_split.min_b, box_to_split.max_b,
                    histogram, hist_size,
                ),
            };
            Ok((box1, box2))
        }
        Some(('b', split_point)) => {
            let box1 = WuBox {
                min_l: box_to_split.min_l,
                max_l: box_to_split.max_l,
                min_a: box_to_split.min_a,
                max_a: box_to_split.max_a,
                min_b: box_to_split.min_b,
                max_b: split_point,
                volume: calculate_box_volume(
                    box_to_split.min_l, box_to_split.max_l,
                    box_to_split.min_a, box_to_split.max_a,
                    box_to_split.min_b, split_point,
                    moments,
                ),
                count: count_pixels_in_box(
                    box_to_split.min_l, box_to_split.max_l,
                    box_to_split.min_a, box_to_split.max_a,
                    box_to_split.min_b, split_point,
                    histogram, hist_size,
                ),
            };
            let box2 = WuBox {
                min_l: box_to_split.min_l,
                max_l: box_to_split.max_l,
                min_a: box_to_split.min_a,
                max_a: box_to_split.max_a,
                min_b: split_point + 1,
                max_b: box_to_split.max_b,
                volume: calculate_box_volume(
                    box_to_split.min_l, box_to_split.max_l,
                    box_to_split.min_a, box_to_split.max_a,
                    split_point + 1, box_to_split.max_b,
                    moments,
                ),
                count: count_pixels_in_box(
                    box_to_split.min_l, box_to_split.max_l,
                    box_to_split.min_a, box_to_split.max_a,
                    split_point + 1, box_to_split.max_b,
                    histogram, hist_size,
                ),
            };
            Ok((box1, box2))
        }
        Some((unexpected_axis, _)) => {
            // Handle unexpected axis values gracefully - this shouldn't happen with our fallback logic
            log::error!("Wu quantization: Unexpected split axis '{}', treating as unsplittable box", unexpected_axis);
            Err(VectorizeError::algorithm_error("Unexpected split axis in Wu quantization"))
        }
        None => {
            // If no split found (including fallback), this box cannot be split
            // This can happen when box has only one color or is too small
            // Return a graceful error that the caller can handle
            log::warn!("Wu quantization: Cannot split box with dimensions L={}-{}, A={}-{}, B={}-{}", 
                box_to_split.min_l, box_to_split.max_l, 
                box_to_split.min_a, box_to_split.max_a,
                box_to_split.min_b, box_to_split.max_b);
            Err(VectorizeError::algorithm_error("Cannot split box: box too small or uniform color"))
        }
    }
}

/// Find a fallback split when no variance-based split is possible
/// Uses midpoint of the largest dimension as fallback strategy
fn find_fallback_split(box_to_split: &WuBox) -> Option<(char, usize)> {
    let l_size = box_to_split.max_l.saturating_sub(box_to_split.min_l);
    let a_size = box_to_split.max_a.saturating_sub(box_to_split.min_a);
    let b_size = box_to_split.max_b.saturating_sub(box_to_split.min_b);
    
    // Find the largest dimension that can be split (size > 0)
    let mut dimensions = vec![];
    if l_size > 0 {
        dimensions.push(('l', l_size, box_to_split.min_l, box_to_split.max_l));
    }
    if a_size > 0 {
        dimensions.push(('a', a_size, box_to_split.min_a, box_to_split.max_a));
    }
    if b_size > 0 {
        dimensions.push(('b', b_size, box_to_split.min_b, box_to_split.max_b));
    }
    
    if dimensions.is_empty() {
        // Box is too small to split (all dimensions have size 0)
        return None;
    }
    
    // Sort by size descending to get the largest dimension
    dimensions.sort_by(|a, b| b.1.cmp(&a.1));
    let (axis, _size, min_val, max_val) = dimensions[0];
    
    // Split at the midpoint of the largest dimension
    let midpoint = min_val + (max_val - min_val) / 2;
    
    // Ensure the midpoint creates a valid split (midpoint should be less than max_val)
    if midpoint < max_val {
        Some((axis, midpoint))
    } else {
        // This shouldn't happen if size > 0, but handle gracefully
        None
    }
}

/// Count pixels in a histogram box
fn count_pixels_in_box(
    min_l: usize, max_l: usize,
    min_a: usize, max_a: usize,
    min_b: usize, max_b: usize,
    histogram: &[Vec<Vec<u32>>],
    _hist_size: usize,
) -> usize {
    let mut count = 0;
    for l in min_l..=max_l {
        for a in min_a..=max_a {
            for b in min_b..=max_b {
                count += histogram[l][a][b] as usize;
            }
        }
    }
    count
}

/// Extract palette from final Wu boxes
fn extract_palette_from_boxes(boxes: &[WuBox], histogram: &[Vec<Vec<u32>>], hist_size: usize) -> Vec<(f32, f32, f32)> {
    boxes
        .iter()
        .map(|box_item| {
            let mut sum_l = 0.0f32;
            let mut sum_a = 0.0f32;
            let mut sum_b = 0.0f32;
            let mut count = 0u32;
            
            // Calculate weighted average color in this box
            for l in box_item.min_l..=box_item.max_l {
                for a in box_item.min_a..=box_item.max_a {
                    for b in box_item.min_b..=box_item.max_b {
                        let pixel_count = histogram[l][a][b];
                        if pixel_count > 0 {
                            // Convert bin indices back to LAB values
                            // Assuming LAB ranges: L[0,100], A[-127,127], B[-127,127]
                            let lab_l = (l as f32 / (hist_size - 1) as f32) * 100.0;
                            let lab_a = (a as f32 / (hist_size - 1) as f32) * 254.0 - 127.0;
                            let lab_b = (b as f32 / (hist_size - 1) as f32) * 254.0 - 127.0;
                            
                            sum_l += lab_l * pixel_count as f32;
                            sum_a += lab_a * pixel_count as f32;
                            sum_b += lab_b * pixel_count as f32;
                            count += pixel_count;
                        }
                    }
                }
            }
            
            if count > 0 {
                (
                    sum_l / count as f32,
                    sum_a / count as f32,
                    sum_b / count as f32,
                )
            } else {
                // Fallback: use box center
                let center_l = ((box_item.min_l + box_item.max_l) as f32 / 2.0 / (hist_size - 1) as f32) * 100.0;
                let center_a = ((box_item.min_a + box_item.max_a) as f32 / 2.0 / (hist_size - 1) as f32) * 254.0 - 127.0;
                let center_b = ((box_item.min_b + box_item.max_b) as f32 / 2.0 / (hist_size - 1) as f32) * 254.0 - 127.0;
                (center_l, center_a, center_b)
            }
        })
        .collect()
}

/// Assign each color to the nearest centroid
fn assign_colors_to_centroids(colors: &[(f32, f32, f32)], centroids: &[(f32, f32, f32)]) -> Vec<usize> {
    colors
        .par_iter()
        .map(|&color| {
            let mut min_distance = f32::INFINITY;
            let mut best_centroid = 0;
            
            for (i, &centroid) in centroids.iter().enumerate() {
                let distance = lab_distance(color, centroid);
                if distance < min_distance {
                    min_distance = distance;
                    best_centroid = i;
                }
            }
            
            best_centroid
        })
        .collect()
}

/// SLIC superpixel segmentation implementation
fn slic_segmentation(
    image: &RgbaImage,
    config: &RegionsConfig,
) -> VectorizeResult<(HashMap<usize, Vec<(u32, u32)>>, Vec<Color>)> {
    let (width, height) = image.dimensions();
    let region_size = config.slic_region_size as f32;
    let compactness = config.slic_compactness;
    let iterations = config.slic_iterations;

    log::debug!(
        "Starting SLIC segmentation: {}x{}, region_size={}, compactness={}, iterations={}",
        width, height, region_size, compactness, iterations
    );

    // Convert image to LAB color space
    let lab_image: Vec<(f32, f32, f32)> = image
        .pixels()
        .map(|&Rgba([r, g, b, _])| rgb_to_lab(r, g, b))
        .collect();

    // Step 1: Initialize cluster centers on a regular grid
    let mut centers = initialize_slic_centers(&lab_image, (width, height), region_size)?;
    log::debug!("Initialized {} SLIC centers", centers.len());

    // Step 2: Move centers away from high-gradient areas (edge avoidance)
    move_centers_away_from_edges(&mut centers, &lab_image, (width, height));

    // Step 3: Iteratively refine clusters
    let mut labels = vec![0usize; (width * height) as usize];
    let mut distances = vec![f32::INFINITY; (width * height) as usize];

    for iteration in 0..iterations {
        log::debug!("SLIC iteration {}/{}", iteration + 1, iterations);

        // Assignment step: assign pixels to nearest cluster center
        slic_assignment_step(
            &centers,
            &lab_image,
            &mut labels,
            &mut distances,
            (width, height),
            region_size,
            compactness,
        );

        // Update step: recompute cluster centers
        slic_update_step(&mut centers, &lab_image, &labels, (width, height));
    }

    // Step 4: Enforce connectivity and create region map
    let region_map = create_slic_region_map(&labels, (width, height))?;

    // Step 5: Create quantized colors for each region
    let quantized = create_quantized_from_slic(&centers, &labels);

    log::debug!(
        "SLIC segmentation completed: {} regions generated",
        region_map.len()
    );

    Ok((region_map, quantized))
}

/// Initialize SLIC cluster centers on a regular grid
fn initialize_slic_centers(
    lab_image: &[(f32, f32, f32)],
    dimensions: (u32, u32),
    region_size: f32,
) -> VectorizeResult<Vec<SlicCenter>> {
    let (width, height) = dimensions;
    
    // Calculate grid spacing
    let grid_spacing_x = region_size;
    let grid_spacing_y = region_size;
    
    // Calculate number of centers in each dimension
    let num_centers_x = ((width as f32 / grid_spacing_x) + 0.5) as u32;
    let num_centers_y = ((height as f32 / grid_spacing_y) + 0.5) as u32;
    
    let mut centers = Vec::new();
    
    for i in 0..num_centers_y {
        for j in 0..num_centers_x {
            let x = (j as f32 + 0.5) * grid_spacing_x;
            let y = (i as f32 + 0.5) * grid_spacing_y;
            
            // Clamp to image boundaries
            let x = x.min((width - 1) as f32);
            let y = y.min((height - 1) as f32);
            
            // Get pixel color at this position
            let pixel_idx = (y as u32 * width + x as u32) as usize;
            if pixel_idx < lab_image.len() {
                let (l, a, b) = lab_image[pixel_idx];
                centers.push(SlicCenter::new(l, a, b, x, y));
            }
        }
    }
    
    Ok(centers)
}

/// Move cluster centers away from high gradient areas (edge avoidance)
fn move_centers_away_from_edges(
    centers: &mut [SlicCenter],
    lab_image: &[(f32, f32, f32)],
    dimensions: (u32, u32),
) {
    let (width, height) = dimensions;
    
    for center in centers.iter_mut() {
        let mut best_x = center.x;
        let mut best_y = center.y;
        let mut min_gradient = f32::INFINITY;
        
        // Search in a 3x3 neighborhood
        for dy in -1..=1 {
            for dx in -1..=1 {
                let new_x = (center.x + dx as f32).max(1.0).min((width - 2) as f32);
                let new_y = (center.y + dy as f32).max(1.0).min((height - 2) as f32);
                
                let gradient = calculate_gradient_magnitude(lab_image, (width, height), new_x, new_y);
                
                if gradient < min_gradient {
                    min_gradient = gradient;
                    best_x = new_x;
                    best_y = new_y;
                }
            }
        }
        
        // Update center position
        center.x = best_x;
        center.y = best_y;
        
        // Update center color
        let pixel_idx = (best_y as u32 * width + best_x as u32) as usize;
        if pixel_idx < lab_image.len() {
            let (l, a, b) = lab_image[pixel_idx];
            center.l = l;
            center.a = a;
            center.b = b;
        }
    }
}

/// Calculate gradient magnitude at a position using Sobel operator
fn calculate_gradient_magnitude(
    lab_image: &[(f32, f32, f32)],
    dimensions: (u32, u32),
    x: f32,
    y: f32,
) -> f32 {
    let (width, height) = dimensions;
    let x = x as u32;
    let y = y as u32;
    
    if x == 0 || x >= width - 1 || y == 0 || y >= height - 1 {
        return f32::INFINITY; // High gradient at borders
    }
    
    // Sobel operator for L channel
    let get_l = |dx: i32, dy: i32| -> f32 {
        let nx = (x as i32 + dx) as u32;
        let ny = (y as i32 + dy) as u32;
        let idx = (ny * width + nx) as usize;
        lab_image[idx].0 // L channel
    };
    
    let gx = -get_l(-1, -1) - 2.0 * get_l(-1, 0) - get_l(-1, 1)
           + get_l(1, -1) + 2.0 * get_l(1, 0) + get_l(1, 1);
    
    let gy = -get_l(-1, -1) - 2.0 * get_l(0, -1) - get_l(1, -1)
           + get_l(-1, 1) + 2.0 * get_l(0, 1) + get_l(1, 1);
    
    (gx * gx + gy * gy).sqrt()
}

/// SLIC assignment step: assign each pixel to the nearest cluster center
fn slic_assignment_step(
    centers: &[SlicCenter],
    lab_image: &[(f32, f32, f32)],
    labels: &mut [usize],
    distances: &mut [f32],
    dimensions: (u32, u32),
    region_size: f32,
    compactness: f32,
) {
    let (width, height) = dimensions;
    
    // Reset distances
    distances.fill(f32::INFINITY);
    
    // For each cluster center, check pixels within 2S×2S region
    for (center_idx, center) in centers.iter().enumerate() {
        let search_radius = (2.0 * region_size) as i32;
        
        let min_x = ((center.x as i32 - search_radius).max(0) as u32).min(width - 1);
        let max_x = ((center.x as i32 + search_radius).max(0) as u32).min(width - 1);
        let min_y = ((center.y as i32 - search_radius).max(0) as u32).min(height - 1);
        let max_y = ((center.y as i32 + search_radius).max(0) as u32).min(height - 1);
        
        for y in min_y..=max_y {
            for x in min_x..=max_x {
                let pixel_idx = (y * width + x) as usize;
                
                if pixel_idx < lab_image.len() {
                    let (l, a, b) = lab_image[pixel_idx];
                    let distance = slic_distance(
                        center, l, a, b, x as f32, y as f32, region_size, compactness
                    );
                    
                    if distance < distances[pixel_idx] {
                        distances[pixel_idx] = distance;
                        labels[pixel_idx] = center_idx;
                    }
                }
            }
        }
    }
}

/// Calculate SLIC distance combining color and spatial components
fn slic_distance(
    center: &SlicCenter,
    l: f32, a: f32, b: f32, x: f32, y: f32,
    region_size: f32,
    compactness: f32,
) -> f32 {
    // Color distance in LAB space (perceptually uniform)
    let color_distance = lab_distance((center.l, center.a, center.b), (l, a, b));
    
    // Spatial distance
    let spatial_distance = ((center.x - x).powi(2) + (center.y - y).powi(2)).sqrt();
    
    // Combined distance with compactness parameter
    let normalized_color = color_distance;
    let normalized_spatial = spatial_distance / region_size * compactness;
    
    (normalized_color.powi(2) + normalized_spatial.powi(2)).sqrt()
}

/// SLIC update step: recompute cluster centers based on assigned pixels
fn slic_update_step(
    centers: &mut [SlicCenter],
    lab_image: &[(f32, f32, f32)],
    labels: &[usize],
    dimensions: (u32, u32),
) {
    let (width, height) = dimensions;
    
    // Reset centers for accumulation
    for center in centers.iter_mut() {
        center.reset();
    }
    
    // Accumulate pixel values for each center
    for y in 0..height {
        for x in 0..width {
            let pixel_idx = (y * width + x) as usize;
            
            if pixel_idx < labels.len() && pixel_idx < lab_image.len() {
                let center_idx = labels[pixel_idx];
                
                if center_idx < centers.len() {
                    let (l, a, b) = lab_image[pixel_idx];
                    let center = &mut centers[center_idx];
                    
                    center.l += l;
                    center.a += a;
                    center.b += b;
                    center.x += x as f32;
                    center.y += y as f32;
                    center.pixel_count += 1;
                }
            }
        }
    }
    
    // Finalize centers by averaging
    for center in centers.iter_mut() {
        center.finalize();
    }
}

/// Create region map from SLIC labels with connectivity enforcement
fn create_slic_region_map(
    labels: &[usize],
    dimensions: (u32, u32),
) -> VectorizeResult<HashMap<usize, Vec<(u32, u32)>>> {
    let (width, height) = dimensions;
    let mut region_map = HashMap::new();
    
    // Group pixels by their labels
    for y in 0..height {
        for x in 0..width {
            let pixel_idx = (y * width + x) as usize;
            
            if pixel_idx < labels.len() {
                let label = labels[pixel_idx];
                region_map.entry(label).or_insert_with(Vec::new).push((x, y));
            }
        }
    }
    
    log::debug!("Created {} SLIC regions before connectivity enforcement", region_map.len());
    
    // TODO: Implement connectivity enforcement to handle disconnected regions
    // For now, use the regions as-is
    
    Ok(region_map)
}

/// Create quantized color array from SLIC centers
fn create_quantized_from_slic(centers: &[SlicCenter], labels: &[usize]) -> Vec<Color> {
    labels
        .iter()
        .map(|&label| {
            if label < centers.len() {
                let center = &centers[label];
                Color::Lab(center.l, center.a, center.b)
            } else {
                // Fallback color
                Color::Lab(50.0, 0.0, 0.0)
            }
        })
        .collect()
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

/// Merge similar adjacent regions using color distance threshold
fn merge_similar_regions_with_colors(
    regions: &HashMap<usize, Vec<(u32, u32)>>,
    quantized: &[Color],
    original_image: &RgbaImage,
    threshold: f64,
) -> VectorizeResult<HashMap<usize, Vec<(u32, u32)>>> {
    log::debug!("Merging similar regions with threshold {}", threshold);
    
    let (width, height) = original_image.dimensions();
    
    // Calculate average color for each region
    let mut region_colors = HashMap::new();
    for (&region_id, pixels) in regions {
        if pixels.is_empty() {
            continue;
        }
        
        // Calculate average color in LAB space
        let mut l_sum = 0.0f32;
        let mut a_sum = 0.0f32;
        let mut b_sum = 0.0f32;
        let mut count = 0;
        
        for &(x, y) in pixels {
            let pixel_idx = (y * width + x) as usize;
            if pixel_idx < quantized.len() {
                let lab = quantized[pixel_idx].to_lab();
                l_sum += lab.0;
                a_sum += lab.1;
                b_sum += lab.2;
                count += 1;
            }
        }
        
        if count > 0 {
            region_colors.insert(region_id, (
                l_sum / count as f32,
                a_sum / count as f32,
                b_sum / count as f32,
            ));
        }
    }
    
    // Build adjacency graph
    let adjacency = build_region_adjacency_graph(regions, (width, height));
    
    // Find regions to merge based on color similarity and adjacency
    let mut merge_map = HashMap::new();
    let mut merged_regions: HashMap<usize, Vec<(u32, u32)>> = HashMap::new();
    
    // Initialize merge map (each region maps to itself)
    for &region_id in regions.keys() {
        merge_map.insert(region_id, region_id);
    }
    
    // Find mergeable pairs
    for (&region_id, adjacent_regions) in &adjacency {
        if let Some(&region_color) = region_colors.get(&region_id) {
            for &adjacent_id in adjacent_regions {
                if let Some(&adjacent_color) = region_colors.get(&adjacent_id) {
                    let color_distance = lab_distance(region_color, adjacent_color);
                    
                    // Use delta E00 threshold as recommended (ΔE₀₀ < 8)
                    if color_distance < threshold as f32 {
                        // Merge smaller region into larger region
                        let region1_size = regions.get(&region_id).map(|r| r.len()).unwrap_or(0);
                        let region2_size = regions.get(&adjacent_id).map(|r| r.len()).unwrap_or(0);
                        
                        let (smaller, larger) = if region1_size < region2_size {
                            (region_id, adjacent_id)
                        } else {
                            (adjacent_id, region_id)
                        };
                        
                        merge_map.insert(smaller, larger);
                    }
                }
            }
        }
    }
    
    // Apply transitive closure to merge map
    let final_merge_map = apply_transitive_closure(merge_map);
    
    // Group regions by their final merged target
    for (&original_id, pixels) in regions {
        let target_id = *final_merge_map.get(&original_id).unwrap_or(&original_id);
        merged_regions.entry(target_id).or_insert_with(Vec::new).extend(pixels);
    }
    
    log::debug!("Merged {} regions into {} regions", regions.len(), merged_regions.len());
    Ok(merged_regions)
}

/// Build adjacency graph for regions
fn build_region_adjacency_graph(
    regions: &HashMap<usize, Vec<(u32, u32)>>,
    dimensions: (u32, u32),
) -> HashMap<usize, Vec<usize>> {
    let (width, height) = dimensions;
    let mut pixel_to_region = HashMap::new();
    
    // Build pixel -> region mapping
    for (&region_id, pixels) in regions {
        for &(x, y) in pixels {
            pixel_to_region.insert((x, y), region_id);
        }
    }
    
    let mut adjacency: HashMap<usize, Vec<usize>> = HashMap::new();
    
    // Check 4-connectivity for each pixel
    for (&region_id, pixels) in regions {
        let adjacent_set = adjacency.entry(region_id).or_insert_with(Vec::new);
        
        for &(x, y) in pixels {
            // Check 4-connected neighbors
            let neighbors = [
                (x.wrapping_sub(1), y),     // Left
                (x + 1, y),                  // Right
                (x, y.wrapping_sub(1)),     // Up
                (x, y + 1),                  // Down
            ];
            
            for (nx, ny) in neighbors {
                if nx < width && ny < height {
                    if let Some(&neighbor_region) = pixel_to_region.get(&(nx, ny)) {
                        if neighbor_region != region_id && !adjacent_set.contains(&neighbor_region) {
                            adjacent_set.push(neighbor_region);
                        }
                    }
                }
            }
        }
    }
    
    adjacency
}

/// Apply transitive closure to merge mapping
fn apply_transitive_closure(mut merge_map: HashMap<usize, usize>) -> HashMap<usize, usize> {
    let mut changed = true;
    
    while changed {
        changed = false;
        let mut new_map = HashMap::new();
        
        for (&key, &value) in &merge_map {
            let final_target = *merge_map.get(&value).unwrap_or(&value);
            new_map.insert(key, final_target);
            
            if final_target != value {
                changed = true;
            }
        }
        
        merge_map = new_map;
    }
    
    merge_map
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
#[allow(dead_code)]
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
                element_type: SvgElementType::Path,
            }
        })
        .collect()
}

/// Convert regions to SVG paths with primitive detection
#[allow(dead_code)]
fn convert_regions_to_svg_with_primitives(
    contours: &HashMap<usize, Contour>, 
    quantized: &[Color],
    config: &RegionsConfig
) -> VectorizeResult<Vec<SvgPath>> {
    let width = (quantized.len() as f64).sqrt() as u32;
    let primitive_config = PrimitiveConfig {
        fit_tolerance: config.primitive_fit_tolerance,
        max_circle_eccentricity: config.max_circle_eccentricity,
        ..PrimitiveConfig::default()
    };

    let mut svg_paths = Vec::new();
    let mut primitive_count = 0;

    for (&region_id, contour) in contours.iter() {
        if contour.is_empty() {
            continue;
        }

        // Get fill color for this region
        let fill_color = if width > 0 {
            let center_x = contour.iter().map(|p| p.x).sum::<f32>() / contour.len() as f32;
            let center_y = contour.iter().map(|p| p.y).sum::<f32>() / contour.len() as f32;
            let center_idx = ((center_y as u32).min(width.saturating_sub(1)) * width
                + (center_x as u32).min(width.saturating_sub(1)))
                as usize;

            if center_idx < quantized.len() {
                let (r, g, b) = quantized[center_idx].to_rgb();
                Some(format!("rgb({}, {}, {})", r, g, b))
            } else {
                let hue = (region_id * 137) % 360;
                Some(format!("hsl({}, 70%, 50%)", hue))
            }
        } else {
            let hue = (region_id * 137) % 360;
            Some(format!("hsl({}, 70%, 50%)", hue))
        };

        // Try to detect primitive shape
        if let Ok(Some(primitive)) = detect_primitive(contour, &primitive_config) {
            // Use primitive SVG representation
            svg_paths.push(primitive_to_svg(&primitive, fill_color));
            primitive_count += 1;
        } else {
            // Fall back to regular path representation
            let mut path_data = String::new();
            path_data.push_str(&format!("M {:.2} {:.2}", contour[0].x, contour[0].y));

            for point in &contour[1..] {
                path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
            }

            path_data.push_str(" Z");

            svg_paths.push(SvgPath {
                path_data,
                fill: fill_color,
                stroke: None,
                stroke_width: None,
                element_type: SvgElementType::Path,
            });
        }
    }

    log::debug!("Regions: Detected {} primitive shapes out of {} contours", 
               primitive_count, contours.len());

    Ok(svg_paths)
}

/// Vectorize regions and return both SVG paths and gradient analyses
///
/// This function is similar to vectorize_regions but returns additional gradient
/// analysis information needed for SVG generation with gradients.
///
/// # Arguments
/// * `image` - Input RGBA image
/// * `config` - Regions vectorization configuration
///
/// # Returns
/// * `VectorizeResult<(Vec<SvgPath>, HashMap<usize, GradientAnalysis>)>` - Paths and gradient info
pub fn vectorize_regions_with_gradient_info(
    image: &RgbaImage,
    config: &RegionsConfig,
) -> VectorizeResult<(Vec<SvgPath>, HashMap<usize, crate::algorithms::gradient_detection::GradientAnalysis>)> {
    log::debug!("Starting optimized regions vectorization pipeline with gradient info");

    // Step 1: Apply optimized preprocessing (combines resizing and denoising)
    let preprocessed = preprocess_for_regions(image, config.max_dimension)?;

    // Step 2-5: Apply segmentation based on chosen method
    let (region_map, quantized) = match config.segmentation_method {
        SegmentationMethod::KMeans => {
            // Traditional k-means approach with configurable quantization
            let colors = extract_colors_with_cache(&preprocessed, config.use_lab_color);
            let (centroids, labels) = match config.quantization_method {
                QuantizationMethod::KMeans => parallel_kmeans_clustering(&colors, config)?,
                QuantizationMethod::Wu => wu_color_quantization(&colors, config)?,
            };
            let quantized = apply_quantization(&preprocessed, &labels, &centroids, config.use_lab_color)?;
            let region_map = label_connected_regions(&quantized, preprocessed.dimensions())?;
            (region_map, quantized)
        }
        SegmentationMethod::Slic => {
            // SLIC superpixel segmentation
            slic_segmentation(&preprocessed, config)?
        }
    };

    // Step 6: Merge similar regions (optional)
    let merged_regions = if config.merge_similar_regions {
        merge_similar_regions_with_colors(&region_map, &quantized, &preprocessed, config.merge_threshold)?
    } else {
        region_map
    };

    // Step 7: Extract region boundaries
    let contours = extract_region_contours(&merged_regions, preprocessed.dimensions())?;

    // Step 8: Filter small regions
    let filtered_contours = filter_regions_by_area(contours, config.min_region_area);

    // Step 9: Analyze regions for gradient patterns if enabled
    let gradient_analyses = if config.detect_gradients {
        let gradient_config = crate::algorithms::gradient_detection::GradientConfig {
            enabled: config.detect_gradients,
            r_squared_threshold: config.gradient_r_squared_threshold,
            max_gradient_stops: config.max_gradient_stops,
            min_region_area: config.min_gradient_region_area,
            radial_symmetry_threshold: config.radial_symmetry_threshold,
        };
        
        let filtered_regions = create_filtered_regions_map(&filtered_contours, &merged_regions);
        crate::algorithms::gradient_detection::analyze_regions_gradients(&filtered_regions, &quantized, preprocessed.dimensions(), &gradient_config)?
    } else {
        HashMap::new()
    };

    // Step 10: Apply primitive detection if enabled, then convert to SVG paths with gradient support
    let svg_paths = if config.detect_primitives {
        convert_regions_to_svg_with_primitives_and_gradients(&filtered_contours, &quantized, &gradient_analyses, config)?
    } else {
        convert_regions_to_svg_with_gradients(&filtered_contours, &quantized, &gradient_analyses)
    };

    let gradient_count = gradient_analyses.values().filter(|a| a.use_gradient).count();
    log::debug!(
        "Regions vectorization completed, generated {} paths ({} with gradients)",
        svg_paths.len(),
        gradient_count
    );
    
    Ok((svg_paths, gradient_analyses))
}

/// Create filtered regions map from contours
fn create_filtered_regions_map(
    contours: &HashMap<usize, Contour>,
    original_regions: &HashMap<usize, Vec<(u32, u32)>>,
) -> HashMap<usize, Vec<(u32, u32)>> {
    contours
        .keys()
        .filter_map(|&region_id| {
            original_regions.get(&region_id).map(|pixels| (region_id, pixels.clone()))
        })
        .collect()
}

/// Convert regions to SVG paths with gradient support
fn convert_regions_to_svg_with_gradients(
    contours: &HashMap<usize, Contour>,
    quantized: &[Color],
    gradient_analyses: &HashMap<usize, crate::algorithms::gradient_detection::GradientAnalysis>,
) -> Vec<SvgPath> {
    let width = (quantized.len() as f64).sqrt() as u32;

    contours
        .iter()
        .map(|(&region_id, contour)| {
            if contour.is_empty() {
                return create_empty_svg_path();
            }

            // Check if this region should use a gradient
            let fill = if let Some(analysis) = gradient_analyses.get(&region_id) {
                if analysis.use_gradient {
                    match &analysis.gradient_type {
                        crate::algorithms::gradient_detection::GradientType::Linear { .. } => {
                            let gradient_id = crate::algorithms::gradient_detection::generate_gradient_id(region_id, "linear");
                            Some(format!("url(#{})", gradient_id))
                        },
                        crate::algorithms::gradient_detection::GradientType::Radial { .. } => {
                            let gradient_id = crate::algorithms::gradient_detection::generate_gradient_id(region_id, "radial");
                            Some(format!("url(#{})", gradient_id))
                        },
                        crate::algorithms::gradient_detection::GradientType::None => {
                            get_solid_fill_color(contour, quantized, width, region_id)
                        },
                    }
                } else {
                    get_solid_fill_color(contour, quantized, width, region_id)
                }
            } else {
                get_solid_fill_color(contour, quantized, width, region_id)
            };

            create_svg_path_from_contour(contour, fill)
        })
        .collect()
}

/// Convert regions to SVG paths with both primitive detection and gradient support
fn convert_regions_to_svg_with_primitives_and_gradients(
    contours: &HashMap<usize, Contour>, 
    quantized: &[Color],
    gradient_analyses: &HashMap<usize, crate::algorithms::gradient_detection::GradientAnalysis>,
    config: &RegionsConfig,
) -> VectorizeResult<Vec<SvgPath>> {
    let width = (quantized.len() as f64).sqrt() as u32;
    let primitive_config = PrimitiveConfig {
        fit_tolerance: config.primitive_fit_tolerance,
        max_circle_eccentricity: config.max_circle_eccentricity,
        ..PrimitiveConfig::default()
    };

    let mut svg_paths = Vec::new();
    let mut primitive_count = 0;
    let mut gradient_count = 0;

    for (&region_id, contour) in contours.iter() {
        if contour.is_empty() {
            continue;
        }

        // Determine fill color or gradient
        let fill = if let Some(analysis) = gradient_analyses.get(&region_id) {
            if analysis.use_gradient {
                gradient_count += 1;
                match &analysis.gradient_type {
                    crate::algorithms::gradient_detection::GradientType::Linear { .. } => {
                        let gradient_id = crate::algorithms::gradient_detection::generate_gradient_id(region_id, "linear");
                        Some(format!("url(#{})", gradient_id))
                    },
                    crate::algorithms::gradient_detection::GradientType::Radial { .. } => {
                        let gradient_id = crate::algorithms::gradient_detection::generate_gradient_id(region_id, "radial");
                        Some(format!("url(#{})", gradient_id))
                    },
                    crate::algorithms::gradient_detection::GradientType::None => {
                        get_solid_fill_color(contour, quantized, width, region_id)
                    },
                }
            } else {
                get_solid_fill_color(contour, quantized, width, region_id)
            }
        } else {
            get_solid_fill_color(contour, quantized, width, region_id)
        };

        // Try to detect primitive shape
        if let Ok(Some(primitive)) = detect_primitive(contour, &primitive_config) {
            // Use primitive SVG representation
            svg_paths.push(primitive_to_svg(&primitive, fill));
            primitive_count += 1;
        } else {
            // Fall back to regular path representation
            svg_paths.push(create_svg_path_from_contour(contour, fill));
        }
    }

    log::debug!(
        "Regions: Detected {} primitive shapes and {} gradients out of {} contours", 
        primitive_count, gradient_count, contours.len()
    );

    Ok(svg_paths)
}

/// Get solid fill color for a region
fn get_solid_fill_color(
    contour: &[Point], 
    quantized: &[Color], 
    width: u32, 
    region_id: usize
) -> Option<String> {
    if width > 0 {
        let center_x = contour.iter().map(|p| p.x).sum::<f32>() / contour.len() as f32;
        let center_y = contour.iter().map(|p| p.y).sum::<f32>() / contour.len() as f32;
        let center_idx = ((center_y as u32).min(width.saturating_sub(1)) * width
            + (center_x as u32).min(width.saturating_sub(1)))
            as usize;

        if center_idx < quantized.len() {
            let (r, g, b) = quantized[center_idx].to_rgb();
            Some(format!("rgb({}, {}, {})", r, g, b))
        } else {
            let hue = (region_id * 137) % 360;
            Some(format!("hsl({}, 70%, 50%)", hue))
        }
    } else {
        let hue = (region_id * 137) % 360;
        Some(format!("hsl({}, 70%, 50%)", hue))
    }
}

/// Create SVG path from contour
fn create_svg_path_from_contour(contour: &[Point], fill: Option<String>) -> SvgPath {
    let mut path_data = String::new();

    if !contour.is_empty() {
        path_data.push_str(&format!("M {:.2} {:.2}", contour[0].x, contour[0].y));

        for point in &contour[1..] {
            path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
        }

        path_data.push_str(" Z");
    }

    SvgPath {
        path_data,
        fill,
        stroke: None,
        stroke_width: None,
        element_type: SvgElementType::Path,
    }
}

/// Create an empty SVG path for error cases
fn create_empty_svg_path() -> SvgPath {
    SvgPath {
        path_data: String::new(),
        fill: None,
        stroke: None,
        stroke_width: None,
        element_type: SvgElementType::Path,
    }
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
    fn test_vectorize_regions_kmeans() {
        // Create a simple 4x4 solid color image for easier testing
        let img = ImageBuffer::from_fn(4, 4, |_x, _y| {
            Rgba([255, 0, 0, 255]) // Solid red
        });

        let mut config = RegionsConfig::default();
        config.segmentation_method = SegmentationMethod::KMeans;
        config.quantization_method = QuantizationMethod::KMeans;
        config.min_region_area = 1; // Lower minimum area for test
        config.num_colors = 2; // Ensure we have distinct colors
        config.max_iterations = 10; // Fewer iterations for test

        let result = vectorize_regions(&img, &config);

        assert!(result.is_ok());
        let paths = result.unwrap();

        // Debug output
        println!("K-means: Generated {} paths", paths.len());
        for (i, path) in paths.iter().enumerate() {
            println!("Path {}: {}", i, path.path_data);
            println!("Fill: {:?}", path.fill);
        }

        // With a solid color image, we should get at least one region
        assert!(!paths.is_empty());
    }

    #[test]
    fn test_vectorize_regions_wu() {
        // Create a simple 8x8 image with some color variation for Wu testing
        let img = ImageBuffer::from_fn(8, 8, |x, _y| {
            if x < 4 {
                Rgba([255, 0, 0, 255]) // Red
            } else {
                Rgba([0, 0, 255, 255]) // Blue
            }
        });

        let mut config = RegionsConfig::default();
        config.segmentation_method = SegmentationMethod::KMeans;
        config.quantization_method = QuantizationMethod::Wu;
        config.min_region_area = 1; // Lower minimum area for test
        config.num_colors = 4; // Use a few colors for Wu testing

        let result = vectorize_regions(&img, &config);

        assert!(result.is_ok());
        let paths = result.unwrap();

        // Debug output
        println!("Wu quantization: Generated {} paths", paths.len());
        for (i, path) in paths.iter().enumerate() {
            println!("Path {}: {}", i, path.path_data);
            println!("Fill: {:?}", path.fill);
        }

        // Wu quantization should generate at least one region
        assert!(!paths.is_empty());
    }

    #[test]
    fn test_vectorize_regions_slic() {
        // Create a simple 8x8 image with some pattern for SLIC testing
        let img = ImageBuffer::from_fn(8, 8, |x, y| {
            if (x + y) % 2 == 0 {
                Rgba([255, 0, 0, 255]) // Red
            } else {
                Rgba([0, 0, 255, 255]) // Blue
            }
        });

        let mut config = RegionsConfig::default();
        config.segmentation_method = SegmentationMethod::Slic;
        config.min_region_area = 1; // Lower minimum area for test
        config.slic_region_size = 4; // Smaller region size for 8x8 image
        config.slic_iterations = 3; // Fewer iterations for test
        config.merge_similar_regions = false; // Disable merging for clearer test

        let result = vectorize_regions(&img, &config);

        assert!(result.is_ok());
        let paths = result.unwrap();

        // Debug output
        println!("SLIC: Generated {} paths", paths.len());
        for (i, path) in paths.iter().enumerate() {
            println!("Path {}: {}", i, path.path_data);
            println!("Fill: {:?}", path.fill);
        }

        // SLIC should generate some regions
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
            quantization_method: QuantizationMethod::KMeans,
            ..Default::default()
        };
        let result = parallel_kmeans_clustering(&colors, &config);

        assert!(result.is_ok());
        let (centroids, labels) = result.unwrap();
        assert_eq!(centroids.len(), 2);
        assert_eq!(labels.len(), 4);
    }

    #[test]
    fn test_wu_color_quantization() {
        let colors = vec![
            Color::Rgb(255, 0, 0),   // Red
            Color::Rgb(240, 10, 10), // Slightly different red
            Color::Rgb(0, 0, 255),   // Blue
            Color::Rgb(10, 10, 240), // Slightly different blue
            Color::Rgb(0, 255, 0),   // Green
            Color::Rgb(10, 240, 10), // Slightly different green
        ];

        let config = RegionsConfig {
            num_colors: 3,
            quantization_method: QuantizationMethod::Wu,
            ..Default::default()
        };
        let result = wu_color_quantization(&colors, &config);

        assert!(result.is_ok());
        let (centroids, labels) = result.unwrap();
        
        // Should have 3 centroids as requested
        assert_eq!(centroids.len(), 3);
        // Each color should be assigned to one of the centroids
        assert_eq!(labels.len(), 6);
        
        // All labels should be within valid range
        for &label in &labels {
            assert!(label < centroids.len());
        }
        
        // Test deterministic property: Wu should give same results each run
        let result2 = wu_color_quantization(&colors, &config);
        assert!(result2.is_ok());
        let (_centroids2, labels2) = result2.unwrap();
        assert_eq!(labels, labels2); // Labels should be identical
    }
}
