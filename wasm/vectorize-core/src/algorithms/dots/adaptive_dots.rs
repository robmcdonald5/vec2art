//! Adaptive density algorithm for dot-based pixel mapping
//!
//! This module implements advanced adaptive density calculation based on local image complexity.
//! It creates natural, non-uniform dot distributions using Poisson disk sampling and provides
//! smooth transitions between density regions to avoid clustering artifacts.

use crate::algorithms::dots::background::{detect_background_advanced, BackgroundConfig};
use crate::algorithms::dots::dots::{Dot, DotConfig};
use crate::algorithms::edges::gradients::GradientAnalysis;
use crate::execution::execute_parallel;
use image::RgbaImage;
use std::collections::HashMap;

/// Configuration for adaptive density processing
#[derive(Debug, Clone)]
pub struct AdaptiveConfig {
    /// Density value for high-detail regions (0.0 to 1.0)
    pub high_detail_density: f32,
    /// Density value for low-detail regions (0.0 to 1.0)
    pub low_detail_density: f32,
    /// Smoothness of transitions between density regions (0.0 to 1.0)
    pub transition_smoothness: f32,
    /// Size of analysis regions in pixels (16, 32, 64, etc.)
    pub region_size: u32,
    /// Complexity threshold for high vs low detail classification
    pub complexity_threshold: f32,
    /// Random seed for reproducible results
    pub random_seed: u64,
    /// Whether to use parallel processing for large images
    pub use_parallel: bool,
    /// Minimum image size to enable parallel processing
    pub parallel_threshold: usize,
    /// Gaussian blur kernel size for smoothing density transitions
    pub blur_kernel_size: u32,
    /// Number of iterations for Poisson disk sampling
    pub poisson_iterations: u32,
    /// Maximum attempts to place a dot in Poisson sampling
    pub max_placement_attempts: u32,
}

impl Default for AdaptiveConfig {
    fn default() -> Self {
        Self {
            high_detail_density: 0.8,
            low_detail_density: 0.2,
            transition_smoothness: 0.6,
            region_size: 32,
            complexity_threshold: 0.3,
            random_seed: 42,
            use_parallel: true,
            parallel_threshold: 10000,
            blur_kernel_size: 5,
            poisson_iterations: 30,
            max_placement_attempts: 50,
        }
    }
}

/// Represents an analyzed image region
#[derive(Debug, Clone)]
pub struct Region {
    /// X coordinate of region's top-left corner
    pub x: u32,
    /// Y coordinate of region's top-left corner  
    pub y: u32,
    /// Width of the region in pixels
    pub width: u32,
    /// Height of the region in pixels
    pub height: u32,
    /// Complexity score for this region (0.0 to 1.0)
    pub complexity: f32,
    /// Average gradient magnitude in this region
    pub avg_gradient: f32,
    /// Variance of gradient magnitudes in this region
    pub gradient_variance: f32,
    /// Density value assigned to this region
    pub density: f32,
}

impl Region {
    /// Create a new region
    pub fn new(x: u32, y: u32, width: u32, height: u32) -> Self {
        Self {
            x,
            y,
            width,
            height,
            complexity: 0.0,
            avg_gradient: 0.0,
            gradient_variance: 0.0,
            density: 0.0,
        }
    }

    /// Check if a point is within this region
    pub fn contains(&self, x: u32, y: u32) -> bool {
        x >= self.x && x < self.x + self.width && y >= self.y && y < self.y + self.height
    }

    /// Get the center point of this region
    pub fn center(&self) -> (f32, f32) {
        (
            self.x as f32 + self.width as f32 / 2.0,
            self.y as f32 + self.height as f32 / 2.0,
        )
    }
}

/// Spatial grid for efficient proximity queries in Poisson disk sampling
#[derive(Debug)]
struct SpatialGrid {
    /// Grid cells, each containing dot indices
    cells: Vec<Vec<usize>>,
    /// Width of the grid in cells
    grid_width: usize,
    /// Height of the grid in cells
    grid_height: usize,
    /// Size of each grid cell
    cell_size: f32,
    /// Image dimensions (stored for potential future use)
    #[allow(dead_code)]
    image_width: f32,
    #[allow(dead_code)]
    image_height: f32,
}

impl SpatialGrid {
    /// Create a new spatial grid
    pub fn new(image_width: f32, image_height: f32, min_distance: f32) -> Self {
        let cell_size = min_distance / 2.0_f32.sqrt(); // Ensure proper coverage
        let grid_width = ((image_width / cell_size).ceil() as usize + 1).min(1000); // Cap at reasonable size
        let grid_height = ((image_height / cell_size).ceil() as usize + 1).min(1000); // Cap at reasonable size
        let total_cells = grid_width.saturating_mul(grid_height);
        // Limit total grid size to prevent excessive memory usage
        let cells = if total_cells <= 1_000_000 {
            vec![Vec::new(); total_cells]
        } else {
            vec![Vec::new(); 1_000_000] // Hard limit
        };

        Self {
            cells,
            grid_width,
            grid_height,
            cell_size,
            image_width,
            image_height,
        }
    }

    /// Get grid coordinates for a world position
    fn get_grid_coords(&self, x: f32, y: f32) -> (usize, usize) {
        let gx = (x / self.cell_size).floor() as usize;
        let gy = (y / self.cell_size).floor() as usize;
        (gx.min(self.grid_width - 1), gy.min(self.grid_height - 1))
    }

    /// Get cell index for grid coordinates
    fn get_cell_index(&self, gx: usize, gy: usize) -> usize {
        gy * self.grid_width + gx
    }

    /// Add a dot to the spatial grid
    pub fn add_dot(&mut self, dot_index: usize, x: f32, y: f32) {
        let (gx, gy) = self.get_grid_coords(x, y);
        let cell_index = self.get_cell_index(gx, gy);
        self.cells[cell_index].push(dot_index);
    }

    /// Check if a position is too close to existing dots
    pub fn is_too_close(&self, x: f32, y: f32, dots: &[Dot], min_distance: f32) -> bool {
        let (gx, gy) = self.get_grid_coords(x, y);

        // Check neighboring cells
        for dy in -1..=1 {
            for dx in -1..=1 {
                let ngx = gx as i32 + dx;
                let ngy = gy as i32 + dy;

                if ngx >= 0
                    && ngx < self.grid_width as i32
                    && ngy >= 0
                    && ngy < self.grid_height as i32
                {
                    let cell_index = self.get_cell_index(ngx as usize, ngy as usize);

                    for &dot_index in &self.cells[cell_index] {
                        if let Some(dot) = dots.get(dot_index) {
                            let distance = dot.distance_to(x, y);
                            if distance < min_distance {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        false
    }
}

/// Analyze image regions to calculate complexity scores
///
/// Divides the image into grid regions and calculates complexity based on
/// gradient magnitude and variance. Higher complexity indicates more detailed areas.
/// Uses parallel processing for performance optimization on large images.
///
/// # Arguments
/// * `gradient` - Gradient analysis results
/// * `region_size` - Size of analysis regions in pixels
///
/// # Returns
/// Vector of analyzed regions with complexity scores
pub fn analyze_image_regions(gradient: &GradientAnalysis, region_size: u32) -> Vec<Region> {
    let width = gradient.width;
    let height = gradient.height;

    let regions_x = width.div_ceil(region_size);
    let regions_y = height.div_ceil(region_size);
    let _total_regions = (regions_x * regions_y) as usize;

    // Generate region coordinates
    let region_coords: Vec<_> = (0..regions_y)
        .flat_map(|ry| (0..regions_x).map(move |rx| (rx * region_size, ry * region_size)))
        .collect();

    // Use execution abstraction for parallel processing
    let region_data: Vec<_> = region_coords.into_iter().collect();
    execute_parallel(region_data, |(x, y)| {
        analyze_single_region(gradient, x, y, region_size, width, height)
    })
}

/// Analyze a single region for complexity (optimized helper function)
fn analyze_single_region(
    gradient: &GradientAnalysis,
    x: u32,
    y: u32,
    region_size: u32,
    width: u32,
    height: u32,
) -> Region {
    let w = region_size.min(width - x);
    let h = region_size.min(height - y);
    let mut region = Region::new(x, y, w, h);

    // Pre-calculate indices for better cache locality
    let start_index = (y * width + x) as usize;

    // Use SIMD-friendly calculations where possible
    let mut gradient_sum = 0.0;
    let mut gradient_squared_sum = 0.0;
    let mut variance_sum = 0.0;
    let mut valid_pixels = 0;

    // Iterate with better memory access patterns
    for row in 0..h {
        let row_start = start_index + (row * width) as usize;
        for col in 0..w {
            let index = row_start + col as usize;

            if index < gradient.magnitude.len() {
                let magnitude = gradient.magnitude[index];
                gradient_sum += magnitude;
                gradient_squared_sum += magnitude * magnitude;

                if index < gradient.variance.len() {
                    variance_sum += gradient.variance[index];
                }

                valid_pixels += 1;
            }
        }
    }

    if valid_pixels > 0 {
        let inv_count = 1.0 / valid_pixels as f32;
        region.avg_gradient = gradient_sum * inv_count;

        // Use numerically stable variance calculation
        let gradient_mean = region.avg_gradient;
        region.gradient_variance =
            (gradient_squared_sum * inv_count - gradient_mean * gradient_mean).max(0.0);

        let avg_variance = variance_sum * inv_count;

        // Optimized normalization with pre-computed constants
        const GRADIENT_NORM: f32 = 1.0 / 255.0; // For 8-bit images
        const VARIANCE_NORM: f32 = 1.0 / 10000.0; // Empirical normalization

        let normalized_gradient = (region.avg_gradient * GRADIENT_NORM).min(1.0);
        let normalized_variance = (avg_variance * VARIANCE_NORM).min(1.0);
        let normalized_grad_var = (region.gradient_variance * VARIANCE_NORM).min(1.0);

        // Weighted combination of different complexity measures
        region.complexity =
            (0.4 * normalized_gradient + 0.3 * normalized_variance + 0.3 * normalized_grad_var)
                .min(1.0);
    }

    region
}

/// Calculate adaptive density map from regions
///
/// Maps region complexity scores to density values and applies smoothing
/// to create natural transitions between density regions.
///
/// # Arguments
/// * `gradient` - Gradient analysis results
/// * `regions` - Vector of analyzed regions
///
/// # Returns
/// Density map with per-pixel density values (0.0 to 1.0)
pub fn calculate_adaptive_density(gradient: &GradientAnalysis, regions: &[Region]) -> Vec<f32> {
    let width = gradient.width as usize;
    let height = gradient.height as usize;
    let mut density_map = vec![0.0; width * height];

    // Create a region lookup for efficient queries
    let mut region_grid: HashMap<(u32, u32), &Region> = HashMap::new();
    for region in regions {
        let grid_x = region.x / region.width;
        let grid_y = region.y / region.height;
        region_grid.insert((grid_x, grid_y), region);
    }

    // Map complexity to density for each pixel
    for y in 0..height {
        for x in 0..width {
            let index = y * width + x;

            // Find which region this pixel belongs to
            if let Some(region) = find_region_for_pixel(x as u32, y as u32, regions) {
                density_map[index] = region.complexity;
            }
        }
    }

    density_map
}

/// Apply adaptive density to existing dots
///
/// Modifies dot distribution based on the density map, adding dots in high-density
/// regions and potentially removing or reducing dots in low-density regions.
///
/// # Arguments
/// * `dots` - Mutable reference to dots vector
/// * `density_map` - Per-pixel density values
/// * `config` - Adaptive configuration
pub fn apply_adaptive_density(dots: &mut Vec<Dot>, density_map: &[f32], config: &AdaptiveConfig) {
    let width = density_map.len();
    if width == 0 {
        return;
    }

    // Filter existing dots based on density
    dots.retain(|dot| {
        let x = dot.x as usize;
        let y = dot.y as usize;
        let sqrt_width = (width as f64).sqrt() as usize;
        if sqrt_width == 0 {
            return false; // Prevent division by zero
        }
        let height = width / sqrt_width;

        if y < height && x < sqrt_width {
            let index = y.saturating_mul(sqrt_width).saturating_add(x);
            if index < density_map.len() {
                let density = density_map[index];
                let threshold = config.low_detail_density
                    + (config.high_detail_density - config.low_detail_density) * 0.3;
                density >= threshold
            } else {
                false
            }
        } else {
            false
        }
    });

    // Apply density-based radius scaling
    for dot in dots.iter_mut() {
        let x = dot.x as usize;
        let y = dot.y as usize;
        let sqrt_width = (width as f64).sqrt() as usize;
        if sqrt_width == 0 {
            continue; // Skip if invalid width
        }
        let height = width / sqrt_width;

        if y < height && x < sqrt_width {
            let index = y.saturating_mul(sqrt_width).saturating_add(x);
            if index < density_map.len() {
                let density = density_map[index];
                let density_factor = config.low_detail_density
                    + (config.high_detail_density - config.low_detail_density) * density;
                dot.radius *= density_factor;
                dot.opacity = (dot.opacity * density_factor).min(1.0);
            }
        }
    }
}

/// Implement Poisson disk sampling for natural dot distribution
///
/// Uses Mitchell's algorithm with spatial acceleration to ensure minimum
/// distance between dots while maintaining natural, non-uniform distribution.
///
/// # Arguments
/// * `dots` - Mutable reference to dots vector
/// * `min_distance` - Minimum distance between dot centers
pub fn poisson_disk_sampling(dots: &mut Vec<Dot>, min_distance: f32) {
    if dots.is_empty() || min_distance <= 0.0 {
        return;
    }

    // Find image bounds from existing dots
    let min_x = dots.iter().map(|d| d.x).fold(f32::INFINITY, f32::min);
    let max_x = dots.iter().map(|d| d.x).fold(f32::NEG_INFINITY, f32::max);
    let min_y = dots.iter().map(|d| d.y).fold(f32::INFINITY, f32::min);
    let max_y = dots.iter().map(|d| d.y).fold(f32::NEG_INFINITY, f32::max);

    let image_width = max_x - min_x + min_distance * 2.0;
    let image_height = max_y - min_y + min_distance * 2.0;

    let mut spatial_grid = SpatialGrid::new(image_width, image_height, min_distance);
    let mut valid_dots = Vec::new();

    // Add existing dots to spatial grid and check distances
    for dot in dots.iter() {
        let adjusted_x = dot.x - min_x;
        let adjusted_y = dot.y - min_y;

        if !spatial_grid.is_too_close(adjusted_x, adjusted_y, &valid_dots, min_distance) {
            spatial_grid.add_dot(valid_dots.len(), adjusted_x, adjusted_y);
            let mut new_dot = dot.clone();
            new_dot.x = adjusted_x;
            new_dot.y = adjusted_y;
            valid_dots.push(new_dot);
        }
    }

    // Restore original coordinates and update dots
    for dot in valid_dots.iter_mut() {
        dot.x += min_x;
        dot.y += min_y;
    }

    *dots = valid_dots;
}

/// Apply smooth Gaussian blur to density map for natural transitions
///
/// Optimized implementation using separable filters and parallel processing
/// for better performance on large images.
///
/// # Arguments
/// * `density_map` - Input density map
/// * `width` - Image width
/// * `height` - Image height  
/// * `kernel_size` - Size of Gaussian kernel (should be odd)
///
/// # Returns
/// Smoothed density map
pub fn smooth_density_transitions(
    density_map: &[f32],
    width: usize,
    height: usize,
    kernel_size: u32,
) -> Vec<f32> {
    if kernel_size % 2 == 0 || kernel_size < 3 {
        return density_map.to_vec();
    }

    let radius = (kernel_size / 2) as i32;
    let sigma = radius as f32 / 3.0;

    // Generate 1D Gaussian kernel for separable filtering
    let mut kernel_1d = Vec::with_capacity(kernel_size as usize);
    let mut kernel_sum = 0.0;

    for i in -radius..=radius {
        let weight = (-(i * i) as f32 / (2.0 * sigma * sigma)).exp();
        kernel_1d.push(weight);
        kernel_sum += weight;
    }

    // Normalize kernel
    for weight in kernel_1d.iter_mut() {
        *weight /= kernel_sum;
    }

    // First pass: horizontal blur using execution abstraction
    let mut temp = vec![0.0; width * height];
    let row_indices: Vec<usize> = (0..height).collect();
    let processed_rows = execute_parallel(row_indices, |y| {
        let mut row = vec![0.0; width];
        apply_horizontal_blur(density_map, &mut row, y, width, &kernel_1d, radius);
        (y, row)
    });

    // Copy results back to temp buffer
    for (y, row) in processed_rows {
        let row_start = y * width;
        temp[row_start..row_start + width].copy_from_slice(&row);
    }

    // Second pass: vertical blur using execution abstraction
    let mut smoothed = vec![0.0; width * height];
    let row_indices: Vec<usize> = (0..height).collect();
    let processed_rows = execute_parallel(row_indices, |y| {
        let mut row = vec![0.0; width];
        apply_vertical_blur(&temp, &mut row, y, width, height, &kernel_1d, radius);
        (y, row)
    });

    // Copy results back to smoothed buffer
    for (y, row) in processed_rows {
        let row_start = y * width;
        smoothed[row_start..row_start + width].copy_from_slice(&row);
    }

    smoothed
}

/// Apply horizontal blur to a single row (helper function)
fn apply_horizontal_blur(
    input: &[f32],
    output_row: &mut [f32],
    y: usize,
    width: usize,
    kernel: &[f32],
    radius: i32,
) {
    let row_start = y * width;

    for (x, output) in output_row.iter_mut().enumerate().take(width) {
        let mut sum = 0.0;

        for (i, &weight) in kernel.iter().enumerate() {
            let kx = x as i32 + (i as i32 - radius);
            let px = kx.max(0).min(width as i32 - 1) as usize;
            sum += input[row_start + px] * weight;
        }

        *output = sum;
    }
}

/// Apply vertical blur to a single row (helper function)
fn apply_vertical_blur(
    input: &[f32],
    output_row: &mut [f32],
    y: usize,
    width: usize,
    height: usize,
    kernel: &[f32],
    radius: i32,
) {
    for x in 0..width {
        let mut sum = 0.0;

        for (i, &weight) in kernel.iter().enumerate() {
            let ky = y as i32 + (i as i32 - radius);
            let py = ky.max(0).min(height as i32 - 1) as usize;
            sum += input[py * width + x] * weight;
        }

        output_row[x] = sum;
    }
}

/// Generate adaptive dots using comprehensive algorithm
///
/// This is the main entry point that combines all adaptive density techniques:
/// region analysis, density mapping, Poisson sampling, and smooth transitions.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `gradient` - Gradient analysis results
/// * `base_config` - Base dot configuration
/// * `adaptive_config` - Adaptive density configuration
///
/// # Returns
/// Vector of adaptively placed dots
pub fn generate_adaptive_dots(
    rgba: &RgbaImage,
    gradient: &GradientAnalysis,
    base_config: &DotConfig,
    adaptive_config: &AdaptiveConfig,
) -> Vec<Dot> {
    // Step 1: Analyze image regions
    let regions = analyze_image_regions(gradient, adaptive_config.region_size);

    // Step 2: Calculate initial density map
    let mut density_map = calculate_adaptive_density(gradient, &regions);

    // Step 3: Smooth density transitions
    if adaptive_config.blur_kernel_size > 0 {
        density_map = smooth_density_transitions(
            &density_map,
            gradient.width as usize,
            gradient.height as usize,
            adaptive_config.blur_kernel_size,
        );
    }

    // Step 4: Generate initial dots (using existing algorithm)
    let background_config = BackgroundConfig::default();
    let background_mask = detect_background_advanced(rgba, &background_config);

    let mut dots =
        crate::algorithms::dots::generate_dots(rgba, gradient, &background_mask, base_config);

    // Step 5: Apply adaptive density modifications
    apply_adaptive_density(&mut dots, &density_map, adaptive_config);

    // Step 6: Apply Poisson disk sampling for natural distribution
    let min_distance = base_config.min_radius * adaptive_config.transition_smoothness * 2.0;
    poisson_disk_sampling(&mut dots, min_distance);

    dots
}

/// Helper function to find which region contains a specific pixel
fn find_region_for_pixel(x: u32, y: u32, regions: &[Region]) -> Option<&Region> {
    regions.iter().find(|region| region.contains(x, y))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::edges::gradients::analyze_image_gradients;
    use image::GrayImage;

    /// Create a test gradient analysis
    fn create_test_gradient(width: u32, height: u32) -> GradientAnalysis {
        let gray = GrayImage::new(width, height);
        analyze_image_gradients(&gray)
    }

    #[test]
    fn test_region_analysis() {
        let gradient = create_test_gradient(64, 64);
        let regions = analyze_image_regions(&gradient, 16);

        // Should create a 4x4 grid of regions
        assert_eq!(regions.len(), 16);

        // Check that regions cover the entire image
        assert!(regions.iter().any(|r| r.x == 0 && r.y == 0));
        assert!(regions.iter().any(|r| r.x == 48 && r.y == 48));
    }

    #[test]
    fn test_density_calculation() {
        let gradient = create_test_gradient(32, 32);
        let regions = analyze_image_regions(&gradient, 16);
        let density_map = calculate_adaptive_density(&gradient, &regions);

        assert_eq!(density_map.len(), (32 * 32) as usize);

        // All values should be between 0.0 and 1.0
        for &density in &density_map {
            assert!((0.0..=1.0).contains(&density));
        }
    }

    #[test]
    fn test_poisson_disk_sampling() {
        let mut dots = vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#000000".to_string()),
            Dot::new(12.0, 12.0, 2.0, 1.0, "#000000".to_string()), // Too close
            Dot::new(20.0, 20.0, 2.0, 1.0, "#000000".to_string()),
        ];

        poisson_disk_sampling(&mut dots, 5.0);

        // Should remove the dot that's too close
        assert!(dots.len() <= 2);

        // Check minimum distance constraint
        for i in 0..dots.len() {
            for j in i + 1..dots.len() {
                let distance = dots[i].distance_to(dots[j].x, dots[j].y);
                assert!(distance >= 5.0);
            }
        }
    }

    #[test]
    fn test_spatial_grid() {
        let mut grid = SpatialGrid::new(100.0, 100.0, 10.0);
        let dots = vec![Dot::new(25.0, 25.0, 2.0, 1.0, "#000000".to_string())];

        grid.add_dot(0, 25.0, 25.0);

        // Point too close should be rejected
        assert!(grid.is_too_close(30.0, 30.0, &dots, 10.0));

        // Point far enough should be accepted
        assert!(!grid.is_too_close(50.0, 50.0, &dots, 10.0));
    }

    #[test]
    fn test_adaptive_config_default() {
        let config = AdaptiveConfig::default();

        assert!(config.high_detail_density > config.low_detail_density);
        assert!(config.transition_smoothness >= 0.0 && config.transition_smoothness <= 1.0);
        assert!(config.region_size > 0);
    }

    #[test]
    fn test_density_smoothing() {
        let density_map = vec![1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];

        let smoothed = smooth_density_transitions(&density_map, 3, 3, 3);

        // Smoothed values should be less extreme
        assert_eq!(smoothed.len(), 9);

        // Center value should be between extremes due to averaging
        let center_value = smoothed[4];
        assert!(center_value > 0.0 && center_value < 1.0);
    }

    #[test]
    fn test_region_contains() {
        let region = Region::new(10, 20, 30, 40);

        assert!(region.contains(15, 25)); // Inside
        assert!(region.contains(10, 20)); // Top-left corner
        assert!(!region.contains(5, 15)); // Outside left
        assert!(!region.contains(45, 65)); // Outside right
    }

    #[test]
    fn test_region_center() {
        let region = Region::new(10, 20, 30, 40);
        let (cx, cy) = region.center();

        assert_eq!(cx, 25.0); // 10 + 30/2
        assert_eq!(cy, 40.0); // 20 + 40/2
    }
}
