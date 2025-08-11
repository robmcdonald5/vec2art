//! Background detection module for dot-based pixel mapping
//!
//! This module provides advanced background detection using LAB color space for
//! perceptual color similarity, edge-pixel sampling, and k-means clustering to
//! handle complex backgrounds with multiple colors and gradients.

use image::{Rgba, RgbaImage};
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha8Rng;
use rayon::prelude::*;

/// Configuration for background detection
#[derive(Debug, Clone)]
pub struct BackgroundConfig {
    /// Tolerance for color similarity (0.0 to 1.0, lower = more strict)
    pub tolerance: f32,
    /// Whether to sample edge pixels for background color detection
    pub sample_edge_pixels: bool,
    /// Whether to use k-means clustering for multiple background colors
    pub cluster_colors: bool,
    /// Number of clusters for k-means (ignored if cluster_colors is false)
    pub num_clusters: usize,
    /// Random seed for reproducible clustering results
    pub random_seed: u64,
    /// Edge sampling ratio (how much of the border to sample, 0.0 to 1.0)
    pub edge_sample_ratio: f32,
}

impl Default for BackgroundConfig {
    fn default() -> Self {
        Self {
            tolerance: 0.15,
            sample_edge_pixels: true,
            cluster_colors: true,
            num_clusters: 3,
            random_seed: 42,
            edge_sample_ratio: 0.1,
        }
    }
}

/// Lab color representation for perceptual color calculations
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LabColor {
    pub l: f32,
    pub a: f32,
    pub b: f32,
}

impl LabColor {
    /// Create new Lab color
    pub fn new(l: f32, a: f32, b: f32) -> Self {
        Self { l, a, b }
    }

    /// Calculate perceptual distance to another Lab color using Delta E CIE76
    pub fn distance_to(&self, other: &LabColor) -> f32 {
        let dl = self.l - other.l;
        let da = self.a - other.a;
        let db = self.b - other.b;
        (dl * dl + da * da + db * db).sqrt()
    }
}

/// Cluster for k-means algorithm
#[derive(Debug, Clone)]
struct ColorCluster {
    centroid: LabColor,
    members: Vec<LabColor>,
    pixel_count: usize,
}

impl ColorCluster {
    fn new(centroid: LabColor) -> Self {
        Self {
            centroid,
            members: Vec::new(),
            pixel_count: 0,
        }
    }

    fn add_member(&mut self, color: LabColor) {
        self.members.push(color);
        self.pixel_count += 1;
    }

    fn update_centroid(&mut self) {
        if self.members.is_empty() {
            return;
        }

        let sum_l: f32 = self.members.iter().map(|c| c.l).sum();
        let sum_a: f32 = self.members.iter().map(|c| c.a).sum();
        let sum_b: f32 = self.members.iter().map(|c| c.b).sum();
        let count = self.members.len() as f32;

        self.centroid = LabColor::new(sum_l / count, sum_a / count, sum_b / count);
    }

    fn clear_members(&mut self) {
        self.members.clear();
    }
}

/// Convert RGBA color to LAB color space
///
/// Uses D65 illuminant and sRGB color space as intermediate.
/// Implementation follows CIE standard conversion formulas.
///
/// # Arguments
/// * `rgba` - RGBA color to convert
///
/// # Returns
/// Lab color representation
pub fn rgba_to_lab(rgba: &Rgba<u8>) -> LabColor {
    let r = rgba.0[0] as f32 / 255.0;
    let g = rgba.0[1] as f32 / 255.0;
    let b = rgba.0[2] as f32 / 255.0;

    // Convert sRGB to linear RGB
    let linear_rgb = [r, g, b].map(|c| {
        if c <= 0.04045 {
            c / 12.92
        } else {
            ((c + 0.055) / 1.055).powf(2.4)
        }
    });

    // Convert linear RGB to XYZ using sRGB matrix
    let x = 0.4124564 * linear_rgb[0] + 0.3575761 * linear_rgb[1] + 0.1804375 * linear_rgb[2];
    let y = 0.2126729 * linear_rgb[0] + 0.7151522 * linear_rgb[1] + 0.0721750 * linear_rgb[2];
    let z = 0.0193339 * linear_rgb[0] + 0.1191920 * linear_rgb[1] + 0.9503041 * linear_rgb[2];

    // Normalize by D65 white point
    let xn = x / 0.95047;
    let yn = y / 1.00000;
    let zn = z / 1.08883;

    // Apply Lab transformation function
    let fx = lab_f(xn);
    let fy = lab_f(yn);
    let fz = lab_f(zn);

    let l = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b = 200.0 * (fy - fz);

    LabColor::new(l, a, b)
}

/// Lab transformation function
fn lab_f(t: f32) -> f32 {
    if t > 0.008856 {
        t.powf(1.0 / 3.0)
    } else {
        7.787 * t + 16.0 / 116.0
    }
}

/// Calculate color similarity between two RGBA colors using Lab color space
///
/// Returns normalized similarity score (0.0 = identical, 1.0 = maximum difference).
/// Uses perceptually uniform Lab color space for better accuracy than RGB distance.
///
/// # Arguments
/// * `c1` - First color
/// * `c2` - Second color
///
/// # Returns
/// Similarity score between 0.0 and 1.0
pub fn calculate_color_similarity(c1: &Rgba<u8>, c2: &Rgba<u8>) -> f32 {
    let lab1 = rgba_to_lab(c1);
    let lab2 = rgba_to_lab(c2);

    // Delta E distance, normalized to 0-1 range
    // Maximum possible Delta E in typical images is around 100
    let delta_e = lab1.distance_to(&lab2);
    (delta_e / 100.0).min(1.0)
}

/// Sample edge pixels from image border (made public for optimization modules)
///
/// Collects pixel colors from the edges of the image to identify likely background colors.
/// Uses configurable sampling ratio to control how much of the border to analyze.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `sample_ratio` - Ratio of border to sample (0.0 to 1.0)
///
/// # Returns
/// Vector of Lab colors sampled from image edges
pub fn sample_edge_pixels(rgba: &RgbaImage, sample_ratio: f32) -> Vec<LabColor> {
    let width = rgba.width();
    let height = rgba.height();
    let mut edge_colors = Vec::new();

    if width == 0 || height == 0 {
        return edge_colors;
    }

    let sample_width = ((width as f32 * sample_ratio).max(1.0) as u32).min(width / 2);
    let sample_height = ((height as f32 * sample_ratio).max(1.0) as u32).min(height / 2);

    // Sample top edge
    for y in 0..sample_height {
        for x in 0..width {
            let pixel = rgba.get_pixel(x, y);
            edge_colors.push(rgba_to_lab(pixel));
        }
    }

    // Sample bottom edge
    for y in (height - sample_height)..height {
        for x in 0..width {
            let pixel = rgba.get_pixel(x, y);
            edge_colors.push(rgba_to_lab(pixel));
        }
    }

    // Sample left edge (excluding corners already sampled)
    for y in sample_height..(height - sample_height) {
        for x in 0..sample_width {
            let pixel = rgba.get_pixel(x, y);
            edge_colors.push(rgba_to_lab(pixel));
        }
    }

    // Sample right edge (excluding corners already sampled)
    for y in sample_height..(height - sample_height) {
        for x in (width - sample_width)..width {
            let pixel = rgba.get_pixel(x, y);
            edge_colors.push(rgba_to_lab(pixel));
        }
    }

    edge_colors
}

/// Perform k-means clustering on colors
///
/// Groups similar colors together using k-means algorithm with Lab color space.
/// Returns cluster centroids representing the dominant background colors.
///
/// # Arguments
/// * `colors` - Input colors to cluster
/// * `k` - Number of clusters
/// * `seed` - Random seed for reproducible results
/// * `max_iterations` - Maximum iterations for convergence
///
/// # Returns
/// Vector of cluster centroids
fn kmeans_clustering(
    colors: &[LabColor],
    k: usize,
    seed: u64,
    max_iterations: usize,
) -> Vec<LabColor> {
    if colors.is_empty() || k == 0 {
        return Vec::new();
    }

    if colors.len() <= k {
        return colors.to_vec();
    }

    let mut rng = ChaCha8Rng::seed_from_u64(seed);
    let mut clusters: Vec<ColorCluster> = Vec::with_capacity(k);

    // Initialize clusters with random colors
    for _ in 0..k {
        let random_index = rng.gen_range(0..colors.len());
        clusters.push(ColorCluster::new(colors[random_index]));
    }

    // K-means iterations
    for _ in 0..max_iterations {
        // Clear previous assignments
        for cluster in &mut clusters {
            cluster.clear_members();
        }

        // Assign each color to the nearest cluster
        for &color in colors {
            let mut min_distance = f32::INFINITY;
            let mut best_cluster = 0;

            for (i, cluster) in clusters.iter().enumerate() {
                let distance = color.distance_to(&cluster.centroid);
                if distance < min_distance {
                    min_distance = distance;
                    best_cluster = i;
                }
            }

            clusters[best_cluster].add_member(color);
        }

        // Update centroids
        let mut converged = true;
        for cluster in &mut clusters {
            if !cluster.members.is_empty() {
                let old_centroid = cluster.centroid;
                cluster.update_centroid();

                // Check for convergence (centroids don't move much)
                if old_centroid.distance_to(&cluster.centroid) > 0.1 {
                    converged = false;
                }
            }
        }

        if converged {
            break;
        }
    }

    // Return centroids sorted by cluster size (largest first)
    clusters.sort_by(|a, b| b.pixel_count.cmp(&a.pixel_count));
    clusters.into_iter().map(|c| c.centroid).collect()
}

/// Simple background detection using tolerance-based color matching
///
/// Detects background pixels by comparing each pixel against edge-sampled colors.
/// Uses Lab color space for perceptual accuracy and configurable tolerance.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `tolerance` - Color similarity tolerance (0.0 to 1.0)
///
/// # Returns
/// Boolean mask where `true` = background pixel, `false` = foreground
pub fn detect_background_mask(rgba: &RgbaImage, tolerance: f32) -> Vec<bool> {
    let width = rgba.width();
    let height = rgba.height();
    let total_pixels = (width * height) as usize;

    if total_pixels == 0 {
        return Vec::new();
    }

    // Sample edge pixels to identify background colors
    let edge_colors = sample_edge_pixels(rgba, 0.1);
    if edge_colors.is_empty() {
        return vec![false; total_pixels];
    }

    let mut background_mask = vec![false; total_pixels];

    // Check each pixel against edge colors
    for y in 0..height {
        for x in 0..width {
            let pixel = rgba.get_pixel(x, y);
            let pixel_lab = rgba_to_lab(pixel);
            let index = (y * width + x) as usize;

            // Check if pixel is similar to any edge color
            let is_background = edge_colors
                .iter()
                .any(|edge_color| pixel_lab.distance_to(edge_color) / 100.0 <= tolerance);

            background_mask[index] = is_background;
        }
    }

    background_mask
}

/// Advanced background detection with clustering and gradient-aware processing
///
/// Provides comprehensive background detection using edge sampling, k-means clustering,
/// and configurable parameters for handling complex backgrounds.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `config` - Configuration parameters
///
/// # Returns
/// Boolean mask where `true` = background pixel, `false` = foreground
pub fn detect_background_advanced(rgba: &RgbaImage, config: &BackgroundConfig) -> Vec<bool> {
    let width = rgba.width();
    let height = rgba.height();
    let total_pixels = (width * height) as usize;

    if total_pixels == 0 {
        return Vec::new();
    }

    // Determine background colors
    let background_colors = if config.sample_edge_pixels {
        let edge_colors = sample_edge_pixels(rgba, config.edge_sample_ratio);

        if edge_colors.is_empty() {
            return vec![false; total_pixels];
        }

        if config.cluster_colors && edge_colors.len() > config.num_clusters {
            kmeans_clustering(&edge_colors, config.num_clusters, config.random_seed, 20)
        } else {
            edge_colors
        }
    } else {
        // Fallback: use corner pixels as background reference
        vec![
            rgba_to_lab(rgba.get_pixel(0, 0)),
            rgba_to_lab(rgba.get_pixel(width - 1, 0)),
            rgba_to_lab(rgba.get_pixel(0, height - 1)),
            rgba_to_lab(rgba.get_pixel(width - 1, height - 1)),
        ]
    };

    // Debug: Log background colors detected
    log::debug!("Background detection found {} reference colors", background_colors.len());
    for (i, color) in background_colors.iter().enumerate() {
        log::debug!("Background color {}: L={:.1} a={:.1} b={:.1}", i, color.l, color.a, color.b);
    }
    log::debug!("Using tolerance: {:.3} (LAB distance threshold)", config.tolerance);

    // Generate background mask using parallel processing
    let pixel_coords: Vec<(u32, u32)> = (0..height)
        .flat_map(|y| (0..width).map(move |x| (x, y)))
        .collect();

    let background_results: Vec<bool> = if total_pixels > 10000 {
        // Use parallel processing for large images
        pixel_coords
            .par_iter()
            .map(|&(x, y)| {
                let pixel = rgba.get_pixel(x, y);
                let pixel_lab = rgba_to_lab(pixel);

                // Check if pixel is similar to any background color
                background_colors
                    .iter()
                    .any(|bg_color| pixel_lab.distance_to(bg_color) <= config.tolerance)
            })
            .collect()
    } else {
        // Sequential processing for smaller images
        pixel_coords
            .iter()
            .map(|&(x, y)| {
                let pixel = rgba.get_pixel(x, y);
                let pixel_lab = rgba_to_lab(pixel);

                // Check if pixel is similar to any background color
                background_colors
                    .iter()
                    .any(|bg_color| pixel_lab.distance_to(bg_color) <= config.tolerance)
            })
            .collect()
    };

    background_results
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgba, RgbaImage};

    /// Create a simple test image with clear background
    fn create_simple_background_image() -> RgbaImage {
        let mut img = RgbaImage::new(50, 50);
        let background_color = Rgba([200, 200, 200, 255]);
        let foreground_color = Rgba([50, 50, 50, 255]);

        // Fill with background color
        for y in 0..50 {
            for x in 0..50 {
                img.put_pixel(x, y, background_color);
            }
        }

        // Add foreground rectangle in center
        for y in 15..35 {
            for x in 15..35 {
                img.put_pixel(x, y, foreground_color);
            }
        }

        img
    }

    /// Create test image with gradient background
    fn create_gradient_background_image() -> RgbaImage {
        let mut img = RgbaImage::new(100, 100);
        let foreground_color = Rgba([255, 0, 0, 255]);

        // Create gradient background
        for y in 0..100 {
            for x in 0..100 {
                let intensity = ((x + y) * 128 / 200).min(255) as u8;
                let bg_color = Rgba([intensity, intensity, intensity, 255]);
                img.put_pixel(x, y, bg_color);
            }
        }

        // Add small foreground spot
        for y in 40..60 {
            for x in 40..60 {
                img.put_pixel(x, y, foreground_color);
            }
        }

        img
    }

    #[test]
    fn test_rgba_to_lab_conversion() {
        // Test known conversions
        let white = Rgba([255, 255, 255, 255]);
        let black = Rgba([0, 0, 0, 255]);
        let red = Rgba([255, 0, 0, 255]);

        let lab_white = rgba_to_lab(&white);
        let lab_black = rgba_to_lab(&black);
        let lab_red = rgba_to_lab(&red);

        // White should have high L value
        assert!(lab_white.l > 90.0, "White should have high L value");
        // Black should have low L value
        assert!(lab_black.l < 10.0, "Black should have low L value");
        // Red should have positive a value
        assert!(lab_red.a > 40.0, "Red should have positive a value");
    }

    #[test]
    fn test_color_similarity_identical_colors() {
        let color1 = Rgba([128, 128, 128, 255]);
        let color2 = Rgba([128, 128, 128, 255]);

        let similarity = calculate_color_similarity(&color1, &color2);
        assert!(
            similarity < 0.01,
            "Identical colors should have very low similarity score"
        );
    }

    #[test]
    fn test_color_similarity_different_colors() {
        let white = Rgba([255, 255, 255, 255]);
        let black = Rgba([0, 0, 0, 255]);

        let similarity = calculate_color_similarity(&white, &black);
        assert!(
            similarity > 0.8,
            "Very different colors should have high similarity score"
        );
    }

    #[test]
    fn test_lab_color_distance() {
        let lab1 = LabColor::new(50.0, 0.0, 0.0);
        let lab2 = LabColor::new(50.0, 0.0, 0.0);
        let lab3 = LabColor::new(70.0, 10.0, -5.0);

        let distance_identical = lab1.distance_to(&lab2);
        let distance_different = lab1.distance_to(&lab3);

        assert!(
            distance_identical < 0.001,
            "Identical Lab colors should have zero distance"
        );
        assert!(
            distance_different > 10.0,
            "Different Lab colors should have measurable distance"
        );
    }

    #[test]
    fn test_sample_edge_pixels() {
        let img = create_simple_background_image();
        let edge_colors = sample_edge_pixels(&img, 0.1);

        assert!(!edge_colors.is_empty(), "Should sample some edge pixels");
        assert!(
            edge_colors.len() > 10,
            "Should sample reasonable number of edge pixels"
        );
    }

    #[test]
    fn test_sample_edge_pixels_empty_image() {
        let img = RgbaImage::new(0, 0);
        let edge_colors = sample_edge_pixels(&img, 0.1);

        assert!(
            edge_colors.is_empty(),
            "Empty image should return no edge colors"
        );
    }

    #[test]
    fn test_kmeans_clustering_basic() {
        // Create colors with two distinct groups
        let colors = vec![
            LabColor::new(20.0, 0.0, 0.0), // Dark group
            LabColor::new(25.0, 0.0, 0.0),
            LabColor::new(22.0, 0.0, 0.0),
            LabColor::new(80.0, 0.0, 0.0), // Light group
            LabColor::new(85.0, 0.0, 0.0),
            LabColor::new(82.0, 0.0, 0.0),
        ];

        let clusters = kmeans_clustering(&colors, 2, 42, 10);
        assert_eq!(clusters.len(), 2, "Should return 2 clusters");

        // Check that clusters are reasonably separated
        let cluster_distance = clusters[0].distance_to(&clusters[1]);
        assert!(cluster_distance > 30.0, "Clusters should be well separated");
    }

    #[test]
    fn test_kmeans_clustering_edge_cases() {
        // Empty input
        let empty_clusters = kmeans_clustering(&[], 2, 42, 10);
        assert!(
            empty_clusters.is_empty(),
            "Empty input should return no clusters"
        );

        // Single color
        let single_color = vec![LabColor::new(50.0, 0.0, 0.0)];
        let single_clusters = kmeans_clustering(&single_color, 2, 42, 10);
        assert_eq!(
            single_clusters.len(),
            1,
            "Single color should return one cluster"
        );

        // More clusters than colors
        let few_colors = vec![LabColor::new(20.0, 0.0, 0.0), LabColor::new(80.0, 0.0, 0.0)];
        let many_clusters = kmeans_clustering(&few_colors, 5, 42, 10);
        assert_eq!(
            many_clusters.len(),
            2,
            "Should not return more clusters than input colors"
        );
    }

    #[test]
    fn test_detect_background_mask_simple() {
        let img = create_simple_background_image();
        let mask = detect_background_mask(&img, 0.1);

        assert_eq!(
            mask.len(),
            2500,
            "Mask should have same number of pixels as image"
        );

        // Check that corners are detected as background
        let corner_indices = [0, 49, 2450, 2499]; // top-left, top-right, bottom-left, bottom-right
        for &idx in &corner_indices {
            assert!(mask[idx], "Corner pixels should be detected as background");
        }

        // Check that center area has some foreground pixels
        let center_start = 20 * 50 + 20; // y=20, x=20
        assert!(
            !mask[center_start],
            "Center should have some foreground pixels"
        );
    }

    #[test]
    fn test_detect_background_mask_empty_image() {
        let img = RgbaImage::new(0, 0);
        let mask = detect_background_mask(&img, 0.1);
        assert!(mask.is_empty(), "Empty image should return empty mask");
    }

    #[test]
    fn test_detect_background_advanced_default_config() {
        let img = create_simple_background_image();
        let config = BackgroundConfig::default();
        let mask = detect_background_advanced(&img, &config);

        assert_eq!(
            mask.len(),
            2500,
            "Advanced mask should have same number of pixels as image"
        );

        // Should detect background similar to simple method
        let background_count = mask.iter().filter(|&&b| b).count();
        let background_ratio = background_count as f32 / mask.len() as f32;

        // Most of the image should be background
        assert!(
            background_ratio > 0.6,
            "Most of simple image should be detected as background"
        );
    }

    #[test]
    fn test_detect_background_advanced_no_edge_sampling() {
        let img = create_simple_background_image();
        let config = BackgroundConfig {
            sample_edge_pixels: false,
            ..Default::default()
        };
        let mask = detect_background_advanced(&img, &config);

        assert_eq!(
            mask.len(),
            2500,
            "Mask should have correct size even without edge sampling"
        );
    }

    #[test]
    fn test_detect_background_advanced_no_clustering() {
        let img = create_gradient_background_image();
        let config = BackgroundConfig {
            cluster_colors: false,
            tolerance: 0.2,
            ..Default::default()
        };
        let mask = detect_background_advanced(&img, &config);

        assert_eq!(mask.len(), 10000, "Mask should have correct size");
    }

    #[test]
    fn test_background_config_consistency() {
        let img = create_simple_background_image();
        let config1 = BackgroundConfig {
            random_seed: 42,
            ..Default::default()
        };
        let config2 = BackgroundConfig {
            random_seed: 42,
            ..Default::default()
        };

        let mask1 = detect_background_advanced(&img, &config1);
        let mask2 = detect_background_advanced(&img, &config2);

        assert_eq!(mask1, mask2, "Same seed should produce identical results");
    }

    #[test]
    fn test_background_tolerance_sensitivity() {
        let img = create_simple_background_image();

        let strict_config = BackgroundConfig {
            tolerance: 0.05,
            ..Default::default()
        };
        let loose_config = BackgroundConfig {
            tolerance: 0.3,
            ..Default::default()
        };

        let strict_mask = detect_background_advanced(&img, &strict_config);
        let loose_mask = detect_background_advanced(&img, &loose_config);

        let strict_bg_count = strict_mask.iter().filter(|&&b| b).count();
        let loose_bg_count = loose_mask.iter().filter(|&&b| b).count();

        assert!(
            loose_bg_count >= strict_bg_count,
            "Looser tolerance should detect more or equal background pixels"
        );
    }

    #[test]
    fn test_background_detection_gradient_image() {
        let img = create_gradient_background_image();
        let config = BackgroundConfig {
            tolerance: 0.2,
            cluster_colors: true,
            num_clusters: 5,
            ..Default::default()
        };

        let mask = detect_background_advanced(&img, &config);
        assert_eq!(mask.len(), 10000, "Mask should cover all pixels");

        // Red foreground area (40-60, 40-60) should mostly be detected as foreground
        let mut foreground_in_red_area = 0;
        let mut total_in_red_area = 0;

        for y in 40..60 {
            for x in 40..60 {
                let index = y * 100 + x;
                total_in_red_area += 1;
                if !mask[index] {
                    foreground_in_red_area += 1;
                }
            }
        }

        let foreground_ratio = foreground_in_red_area as f32 / total_in_red_area as f32;
        assert!(
            foreground_ratio > 0.5,
            "Most of red area should be detected as foreground, got ratio: {}",
            foreground_ratio
        );
    }
}
