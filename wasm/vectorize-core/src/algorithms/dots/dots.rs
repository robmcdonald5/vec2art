//! Dot placement algorithm for dot-based pixel mapping
//!
//! This module implements the core dot placement algorithm that combines gradient analysis
//! and background detection to generate artistic dots. It maps gradient strength to dot size
//! and opacity, preserves original colors when requested, and implements spatial distribution
//! to prevent clustering.

use crate::algorithms::dots::background::{detect_background_advanced, BackgroundConfig};
use crate::algorithms::edges::gradients::{GradientAnalysis, GradientConfig};
use crate::execution::execute_parallel_filter_map;
use image::{Rgba, RgbaImage};

/// Represents a single dot in the output
#[derive(Debug, Clone, PartialEq)]
pub struct Dot {
    /// X coordinate of the dot center
    pub x: f32,
    /// Y coordinate of the dot center
    pub y: f32,
    /// Radius of the dot
    pub radius: f32,
    /// Opacity value (0.0 to 1.0)
    pub opacity: f32,
    /// Color as hex string (e.g., "#FF0000")
    pub color: String,
}

impl Dot {
    /// Create a new dot with specified parameters
    pub fn new(x: f32, y: f32, radius: f32, opacity: f32, color: String) -> Self {
        Self {
            x,
            y,
            radius,
            opacity,
            color,
        }
    }

    /// Calculate the distance from this dot to another point
    pub fn distance_to(&self, x: f32, y: f32) -> f32 {
        let dx = self.x - x;
        let dy = self.y - y;
        (dx * dx + dy * dy).sqrt()
    }

    /// Check if this dot overlaps with another dot
    pub fn overlaps_with(&self, other: &Dot) -> bool {
        let distance = self.distance_to(other.x, other.y);
        distance < (self.radius + other.radius)
    }
}

/// Configuration for dot generation
#[derive(Debug, Clone)]
pub struct DotConfig {
    /// Minimum dot radius in pixels
    pub min_radius: f32,
    /// Maximum dot radius in pixels
    pub max_radius: f32,
    /// Minimum gradient strength required to place a dot (0.0 to 1.0)
    pub density_threshold: f32,
    /// Whether to preserve original pixel colors
    pub preserve_colors: bool,
    /// Whether to use adaptive sizing based on local variance
    pub adaptive_sizing: bool,
    /// Minimum spacing between dot centers (as multiple of radius)
    pub spacing_factor: f32,
    /// Default color for dots when not preserving colors
    pub default_color: String,
    /// Whether to use parallel processing
    pub use_parallel: bool,
    /// Threshold for enabling parallel processing (pixel count)
    pub parallel_threshold: usize,
    /// Random seed for consistent spatial distribution
    pub random_seed: u64,
    /// Enable Poisson disk sampling for natural dot distribution (default: false)
    pub poisson_disk_sampling: bool,
    /// Enable gradient-based sizing for dot scaling based on local image gradients (default: false)
    pub gradient_based_sizing: bool,
}

impl Default for DotConfig {
    fn default() -> Self {
        Self {
            min_radius: 0.5,
            max_radius: 3.0,
            density_threshold: 0.1,
            preserve_colors: true,
            adaptive_sizing: true,
            spacing_factor: 1.5,
            default_color: "#000000".to_string(),
            use_parallel: true,
            parallel_threshold: 10000,
            random_seed: 42,
            poisson_disk_sampling: false,
            gradient_based_sizing: false,
        }
    }
}

/// Convert RGBA color to hex string
fn rgba_to_hex(rgba: &Rgba<u8>) -> String {
    format!("#{:02x}{:02x}{:02x}", rgba.0[0], rgba.0[1], rgba.0[2])
}

/// Calculate normalized gradient strength from gradient analysis
fn calculate_gradient_strength(
    gradient_analysis: &GradientAnalysis,
    x: u32,
    y: u32,
    adaptive_sizing: bool,
    gradient_based_sizing: bool,
) -> f32 {
    let magnitude = gradient_analysis.get_magnitude(x, y).unwrap_or(0.0);

    if gradient_based_sizing {
        // Enhanced gradient-based sizing uses both magnitude and variance with improved scaling
        let variance = gradient_analysis.get_variance(x, y).unwrap_or(0.0);
        // Add NaN protection for variance sqrt calculation
        let variance_factor = if variance.is_finite() && variance >= 0.0 {
            (variance.sqrt().min(255.0) / 255.0).min(1.0)
        } else {
            0.0
        };
        let magnitude_factor = magnitude.min(362.0) / 362.0;

        // Gradient-based sizing emphasizes local detail more strongly
        // Uses a non-linear scaling for better visual results
        let detail_factor = 0.6 * magnitude_factor + 0.4 * variance_factor;
        // Apply power curve to enhance contrast in detail areas - protect against NaN
        if detail_factor.is_finite() && detail_factor >= 0.0 {
            detail_factor.powf(0.8).min(1.0)
        } else {
            0.0
        }
    } else if adaptive_sizing {
        let variance = gradient_analysis.get_variance(x, y).unwrap_or(0.0);
        // Combine magnitude and variance for adaptive strength
        // Use square root of variance (standard deviation) for better scaling
        // Add NaN protection for variance sqrt calculation
        let variance_factor = if variance.is_finite() && variance >= 0.0 {
            (variance.sqrt().min(255.0) / 255.0).min(1.0)
        } else {
            0.0
        };
        let magnitude_factor = magnitude.min(362.0) / 362.0; // Max Sobel magnitude for 8-bit

        // Weighted combination: 70% magnitude, 30% variance
        0.7 * magnitude_factor + 0.3 * variance_factor
    } else {
        // Simple magnitude-based strength
        magnitude.min(362.0) / 362.0
    }
}

/// Map gradient strength to dot radius
fn strength_to_radius(strength: f32, min_radius: f32, max_radius: f32) -> f32 {
    // Use square root for more natural scaling (higher contrast in small values)
    let scaled_strength = strength.sqrt();
    min_radius + scaled_strength * (max_radius - min_radius)
}

/// Map gradient strength to opacity
fn strength_to_opacity(strength: f32) -> f32 {
    // Ensure minimum visibility while scaling with strength
    let min_opacity = 0.3;
    let max_opacity = 1.0;
    min_opacity + strength * (max_opacity - min_opacity)
}

/// Poisson disk sampling implementation for natural dot distribution
/// Uses Mitchell's algorithm for fast O(n) generation
struct PoissonDiskSampler {
    width: f32,
    height: f32,
    min_distance: f32,
    grid_size: f32,
    grid_width: usize,
    grid_height: usize,
    grid: Vec<Option<usize>>,
    active_list: Vec<usize>,
    samples: Vec<(f32, f32)>,
    rng_state: u64,
}

impl PoissonDiskSampler {
    fn new(width: f32, height: f32, min_distance: f32, seed: u64) -> Self {
        // Critical safety validation to prevent WASM panics
        let width = width.max(1.0).min(10000.0);
        let height = height.max(1.0).min(10000.0);
        
        // Clamp min_distance to safe ranges to prevent division/grid issues
        let min_distance = min_distance.clamp(0.1, width.min(height) * 0.5);
        
        let grid_size = min_distance / (2.0_f32).sqrt();
        
        // Cap grid dimensions to prevent memory exhaustion and array bounds issues
        let max_grid_dim = 2000; // Reasonable upper bound
        let grid_width = ((width / grid_size).ceil() as usize).clamp(1, max_grid_dim);
        let grid_height = ((height / grid_size).ceil() as usize).clamp(1, max_grid_dim);
        
        // Validate total grid size to prevent massive allocations
        let total_grid_size = grid_width.saturating_mul(grid_height);
        let (final_grid_width, final_grid_height) = if total_grid_size > 4_000_000 {
            // Scale down grid to safe size while preserving aspect ratio
            let scale = (4_000_000.0 / total_grid_size as f32).sqrt();
            (
                ((grid_width as f32 * scale) as usize).max(1),
                ((grid_height as f32 * scale) as usize).max(1)
            )
        } else {
            (grid_width, grid_height)
        };

        Self {
            width,
            height,
            min_distance,
            grid_size,
            grid_width: final_grid_width,
            grid_height: final_grid_height,
            grid: vec![None; final_grid_width * final_grid_height],
            active_list: Vec::new(),
            samples: Vec::new(),
            rng_state: seed,
        }
    }

    /// Simple LCG random number generator for deterministic results
    fn next_random(&mut self) -> f32 {
        self.rng_state = self.rng_state.wrapping_mul(1103515245).wrapping_add(12345);
        (self.rng_state % 2147483648) as f32 / 2147483648.0
    }

    fn grid_coords(&self, x: f32, y: f32) -> (usize, usize) {
        let gx = (x / self.grid_size).floor() as usize;
        let gy = (y / self.grid_size).floor() as usize;
        (gx.min(self.grid_width - 1), gy.min(self.grid_height - 1))
    }

    fn is_valid_point(&self, x: f32, y: f32) -> bool {
        if x < 0.0 || x >= self.width || y < 0.0 || y >= self.height {
            return false;
        }

        let (gx, gy) = self.grid_coords(x, y);
        let start_gx = gx.saturating_sub(2);
        let end_gx = (gx + 3).min(self.grid_width);
        let start_gy = gy.saturating_sub(2);
        let end_gy = (gy + 3).min(self.grid_height);

        for check_gy in start_gy..end_gy {
            for check_gx in start_gx..end_gx {
                let idx = check_gy * self.grid_width + check_gx;
                if let Some(sample_idx) = self.grid[idx] {
                    if sample_idx < self.samples.len() {
                        let (sx, sy) = self.samples[sample_idx];
                        let dx = x - sx;
                        let dy = y - sy;
                        let dist_sq = dx * dx + dy * dy;
                        if dist_sq < self.min_distance * self.min_distance {
                            return false;
                        }
                    }
                }
            }
        }
        true
    }

    fn add_sample(&mut self, x: f32, y: f32) -> usize {
        let sample_idx = self.samples.len();
        self.samples.push((x, y));

        let (gx, gy) = self.grid_coords(x, y);
        let grid_idx = gy * self.grid_width + gx;
        self.grid[grid_idx] = Some(sample_idx);

        self.active_list.push(sample_idx);
        sample_idx
    }

    fn generate_around(&mut self, around_idx: usize, k: usize) -> Option<(f32, f32)> {
        let (center_x, center_y) = self.samples[around_idx];

        for _ in 0..k {
            let angle = self.next_random() * 2.0 * std::f32::consts::PI;
            let distance = self.min_distance * (1.0 + self.next_random());

            let x = center_x + distance * angle.cos();
            let y = center_y + distance * angle.sin();

            if self.is_valid_point(x, y) {
                return Some((x, y));
            }
        }
        None
    }

    fn generate(&mut self) -> Vec<(f32, f32)> {
        // Add initial sample
        let initial_x = self.width * 0.5;
        let initial_y = self.height * 0.5;
        self.add_sample(initial_x, initial_y);

        const K: usize = 30; // Number of attempts per active sample
        const MAX_ITERATIONS: usize = 100_000; // Prevent infinite loops
        let mut iterations = 0;

        while !self.active_list.is_empty() && iterations < MAX_ITERATIONS {
            iterations += 1;
            let active_idx = (self.next_random() * self.active_list.len() as f32) as usize;
            // Ensure bounds safety: clamp to valid array index
            let active_idx = active_idx.min(self.active_list.len().saturating_sub(1));
            let sample_idx = self.active_list[active_idx];

            if let Some((x, y)) = self.generate_around(sample_idx, K) {
                self.add_sample(x, y);
            } else {
                self.active_list.swap_remove(active_idx);
            }
        }

        self.samples.clone()
    }
}

/// Simple spatial distribution check to prevent clustering
/// Returns true if the position is valid (not too close to existing dots)
#[allow(dead_code)]
fn is_position_valid(
    x: f32,
    y: f32,
    radius: f32,
    existing_dots: &[Dot],
    spacing_factor: f32,
) -> bool {
    let min_distance = radius * spacing_factor;

    for dot in existing_dots {
        if dot.distance_to(x, y) < min_distance {
            return false;
        }
    }
    true
}

/// Optimized spatial distribution using grid-based approach
struct SpatialGrid {
    grid: Vec<Vec<Vec<usize>>>,
    cell_size: f32,
    grid_width: usize,
    grid_height: usize,
}

impl SpatialGrid {
    fn new(width: u32, height: u32, max_radius: f32, spacing_factor: f32) -> Self {
        let cell_size = max_radius * spacing_factor * 2.0;
        let grid_width = ((width as f32 / cell_size).ceil() as usize).max(1);
        let grid_height = ((height as f32 / cell_size).ceil() as usize).max(1);

        let grid = vec![vec![Vec::new(); grid_width]; grid_height];

        Self {
            grid,
            cell_size,
            grid_width,
            grid_height,
        }
    }

    fn get_grid_coords(&self, x: f32, y: f32) -> (usize, usize) {
        let gx = ((x / self.cell_size) as usize).min(self.grid_width - 1);
        let gy = ((y / self.cell_size) as usize).min(self.grid_height - 1);
        (gx, gy)
    }

    fn add_dot(&mut self, dot_index: usize, x: f32, y: f32) {
        let (gx, gy) = self.get_grid_coords(x, y);
        self.grid[gy][gx].push(dot_index);
    }

    fn is_position_valid(
        &self,
        x: f32,
        y: f32,
        radius: f32,
        dots: &[Dot],
        spacing_factor: f32,
    ) -> bool {
        let min_distance = radius * spacing_factor;
        let (gx, gy) = self.get_grid_coords(x, y);

        // Check surrounding grid cells
        let start_gx = gx.saturating_sub(1);
        let end_gx = (gx + 2).min(self.grid_width);
        let start_gy = gy.saturating_sub(1);
        let end_gy = (gy + 2).min(self.grid_height);

        for check_gy in start_gy..end_gy {
            for check_gx in start_gx..end_gx {
                for &dot_index in &self.grid[check_gy][check_gx] {
                    if dot_index < dots.len() {
                        let dot = &dots[dot_index];
                        if dot.distance_to(x, y) < min_distance {
                            return false;
                        }
                    }
                }
            }
        }

        true
    }
}

/// Generate dots from image analysis
///
/// This is the core dot placement algorithm that combines gradient analysis and background
/// detection to create artistic dots. It maps gradient strength to dot properties and
/// implements spatial distribution to prevent clustering.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `gradient_analysis` - Pre-computed gradient analysis results
/// * `background_mask` - Boolean mask where true = background pixel
/// * `config` - Configuration parameters for dot generation
///
/// # Returns
/// Vector of generated dots
pub fn generate_dots(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    background_mask: &[bool],
    config: &DotConfig,
) -> Vec<Dot> {
    let width = rgba.width();
    let height = rgba.height();
    let total_pixels = (width * height) as usize;

    if total_pixels == 0 || background_mask.len() != total_pixels {
        return Vec::new();
    }

    // Pre-calculate candidate positions with optional parallel processing
    let pixel_coords: Vec<(u32, u32)> = (0..height)
        .flat_map(|y| (0..width).map(move |x| (x, y)))
        .collect();

    let candidates: Vec<(u32, u32, f32, f32, String)> =
        if config.use_parallel && total_pixels >= config.parallel_threshold {
            // Parallel processing for large images using execution abstraction
            execute_parallel_filter_map(pixel_coords, |(x, y)| {
                let index = (y * width + x) as usize;

                // Skip background pixels
                if background_mask[index] {
                    return None;
                }

                // Calculate gradient strength
                let strength = calculate_gradient_strength(
                    gradient_analysis,
                    x,
                    y,
                    config.adaptive_sizing,
                    config.gradient_based_sizing,
                );

                // Skip pixels below density threshold
                if strength < config.density_threshold {
                    return None;
                }

                // Calculate dot properties
                let radius = strength_to_radius(strength, config.min_radius, config.max_radius);
                let opacity = strength_to_opacity(strength);

                // Get color
                let color = if config.preserve_colors {
                    let pixel = rgba.get_pixel(x, y);
                    rgba_to_hex(pixel)
                } else {
                    config.default_color.clone()
                };

                Some((x, y, radius, opacity, color))
            })
        } else {
            // Sequential processing for smaller images
            let mut candidates = Vec::new();

            for &(x, y) in &pixel_coords {
                let index = (y * width + x) as usize;

                // Skip background pixels
                if background_mask[index] {
                    continue;
                }

                // Calculate gradient strength
                let strength = calculate_gradient_strength(
                    gradient_analysis,
                    x,
                    y,
                    config.adaptive_sizing,
                    config.gradient_based_sizing,
                );

                // Skip pixels below density threshold
                if strength < config.density_threshold {
                    continue;
                }

                // Calculate dot properties
                let radius = strength_to_radius(strength, config.min_radius, config.max_radius);
                let opacity = strength_to_opacity(strength);

                // Get color
                let color = if config.preserve_colors {
                    let pixel = rgba.get_pixel(x, y);
                    rgba_to_hex(pixel)
                } else {
                    config.default_color.clone()
                };

                candidates.push((x, y, radius, opacity, color));
            }

            candidates
        };

    // Generate dots with chosen spatial distribution method
    let mut dots = Vec::new();

    if config.poisson_disk_sampling {
        // Use Poisson disk sampling for natural distribution
        let min_distance = config.max_radius * config.spacing_factor;
        let mut poisson_sampler = PoissonDiskSampler::new(
            width as f32,
            height as f32,
            min_distance,
            config.random_seed,
        );

        let sample_points = poisson_sampler.generate();

        // For each Poisson sample point, find the best candidate dot properties
        for (fx, fy) in sample_points {
            let x = fx.floor() as u32;
            let y = fy.floor() as u32;

            // Skip if outside image bounds
            if x >= width || y >= height {
                continue;
            }

            let index = (y * width + x) as usize;

            // Skip background pixels
            if background_mask[index] {
                continue;
            }

            // Calculate gradient strength for this position
            let strength = calculate_gradient_strength(
                gradient_analysis,
                x,
                y,
                config.adaptive_sizing,
                config.gradient_based_sizing,
            );

            // Skip pixels below density threshold
            if strength < config.density_threshold {
                continue;
            }

            // Calculate dot properties
            let radius = strength_to_radius(strength, config.min_radius, config.max_radius);
            let opacity = strength_to_opacity(strength);

            // Get color
            let color = if config.preserve_colors {
                let pixel = rgba.get_pixel(x, y);
                rgba_to_hex(pixel)
            } else {
                config.default_color.clone()
            };

            let dot = Dot::new(fx, fy, radius, opacity, color);
            dots.push(dot);
        }
    } else {
        // Use traditional grid-based spatial distribution
        // Sort candidates by gradient strength (strongest first) for better spatial distribution
        let mut sorted_candidates = candidates;
        sorted_candidates
            .sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal));

        let mut spatial_grid =
            SpatialGrid::new(width, height, config.max_radius, config.spacing_factor);

        for (x, y, radius, opacity, color) in sorted_candidates {
            let fx = x as f32 + 0.5; // Center of pixel
            let fy = y as f32 + 0.5;

            // Check spatial distribution
            if spatial_grid.is_position_valid(fx, fy, radius, &dots, config.spacing_factor) {
                let dot = Dot::new(fx, fy, radius, opacity, color);
                spatial_grid.add_dot(dots.len(), fx, fy);
                dots.push(dot);
            }
        }
    }

    dots
}

/// Generate dots with automatic background detection
///
/// Convenience function that performs background detection automatically before
/// generating dots. Uses default background detection configuration.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `gradient_analysis` - Pre-computed gradient analysis results
/// * `config` - Configuration parameters for dot generation
///
/// # Returns
/// Vector of generated dots
pub fn generate_dots_auto_background(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    config: &DotConfig,
) -> Vec<Dot> {
    let background_config = BackgroundConfig::default();
    let background_mask = detect_background_advanced(rgba, &background_config);
    generate_dots(rgba, gradient_analysis, &background_mask, config)
}

/// Generate dots with smart background filtering fallback
///
/// This function applies intelligent background filtering that automatically disables
/// background filtering when the detection algorithm is too aggressive (>95% background).
/// This handles edge cases like checkerboards where all colors might be incorrectly
/// classified as background.
pub fn generate_dots_with_smart_filtering(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    background_mask: &[bool],
    config: &DotConfig,
    use_background_filtering: bool,
) -> Vec<Dot> {
    if use_background_filtering {
        // Use normal background filtering
        generate_dots(rgba, gradient_analysis, background_mask, config)
    } else {
        // Bypass background filtering by creating an all-false mask
        let no_background_mask = vec![false; background_mask.len()];
        generate_dots(rgba, gradient_analysis, &no_background_mask, config)
    }
}

/// Generate dots from image with full pipeline
///
/// Complete pipeline that performs gradient analysis, background detection, and dot generation
/// in a single call. Most convenient function for typical use cases.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `dot_config` - Configuration parameters for dot generation
/// * `gradient_config` - Optional gradient analysis configuration (uses default if None)
/// * `background_config` - Optional background detection configuration (uses default if None)
///
/// # Returns
/// Vector of generated dots
pub fn generate_dots_from_image(
    rgba: &RgbaImage,
    dot_config: &DotConfig,
    gradient_config: Option<&GradientConfig>,
    background_config: Option<&BackgroundConfig>,
) -> Vec<Dot> {
    // Convert to grayscale for gradient analysis
    let gray = image::imageops::grayscale(rgba);

    // Perform gradient analysis
    let gradient_analysis = if let Some(config) = gradient_config {
        crate::algorithms::edges::gradients::analyze_image_gradients_with_config(&gray, config)
    } else {
        crate::algorithms::edges::gradients::analyze_image_gradients(&gray)
    };

    // Perform background detection
    let background_mask = if let Some(config) = background_config {
        detect_background_advanced(rgba, config)
    } else {
        detect_background_advanced(rgba, &BackgroundConfig::default())
    };

    // Debug: Log background detection results and apply smart fallback
    let background_pixels = background_mask.iter().filter(|&&x| x).count();
    let total_pixels = background_mask.len();
    let background_percentage = (background_pixels as f64 / total_pixels as f64) * 100.0;
    log::debug!(
        "Background detection: {background_pixels}/{total_pixels} pixels marked as background ({background_percentage:.1}%)"
    );

    // Smart fallback: If >95% of pixels are marked as background, disable background filtering
    // This handles cases where the background detection is too aggressive
    let use_background_filtering = background_percentage < 95.0;
    if !use_background_filtering {
        log::debug!(
            "Background detection marked {background_percentage:.1}% as background - disabling background filtering"
        );
    }

    // Generate dots with smart background filtering
    let dots = generate_dots_with_smart_filtering(
        rgba,
        &gradient_analysis,
        &background_mask,
        dot_config,
        use_background_filtering,
    );

    // Debug: Sample gradient strength values
    let mut sample_strengths = Vec::new();
    let width = rgba.width();
    let height = rgba.height();
    for y in (0..height).step_by(std::cmp::max(1, height as usize / 10)) {
        for x in (0..width).step_by(std::cmp::max(1, width as usize / 10)) {
            let strength = calculate_gradient_strength(
                &gradient_analysis,
                x,
                y,
                dot_config.adaptive_sizing,
                dot_config.gradient_based_sizing,
            );
            sample_strengths.push(strength);
        }
    }
    if !sample_strengths.is_empty() {
        let max_strength = sample_strengths.iter().fold(0.0f32, |a, &b| a.max(b));
        let avg_strength = sample_strengths.iter().sum::<f32>() / sample_strengths.len() as f32;
        log::debug!(
            "Gradient strength sample: max={:.3}, avg={:.3}, threshold={:.3}",
            max_strength,
            avg_strength,
            dot_config.density_threshold
        );
    }

    dots
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::edges::gradients::analyze_image_gradients;
    use image::{Rgba, RgbaImage};

    /// Create simple test image with clear foreground/background
    fn create_test_image() -> RgbaImage {
        let mut img = RgbaImage::new(50, 50);
        let background = Rgba([200, 200, 200, 255]);
        let foreground = Rgba([50, 50, 50, 255]);

        // Fill with background
        for y in 0..50 {
            for x in 0..50 {
                img.put_pixel(x, y, background);
            }
        }

        // Add foreground rectangle
        for y in 20..30 {
            for x in 20..30 {
                img.put_pixel(x, y, foreground);
            }
        }

        img
    }

    /// Create gradient test image
    fn create_gradient_image() -> RgbaImage {
        let mut img = RgbaImage::new(100, 100);
        for y in 0..100 {
            for x in 0..100 {
                let intensity = ((x + y) * 255 / 200).min(255) as u8;
                let color = Rgba([intensity, intensity, intensity, 255]);
                img.put_pixel(x, y, color);
            }
        }
        img
    }

    fn create_simple_background_mask(width: u32, height: u32) -> Vec<bool> {
        let mut mask = vec![true; (width * height) as usize];

        // Set center area as foreground
        for y in (height / 4)..(3 * height / 4) {
            for x in (width / 4)..(3 * width / 4) {
                let index = (y * width + x) as usize;
                mask[index] = false;
            }
        }

        mask
    }

    #[test]
    fn test_dot_creation() {
        let dot = Dot::new(10.0, 20.0, 2.5, 0.8, "#FF0000".to_string());

        assert_eq!(dot.x, 10.0);
        assert_eq!(dot.y, 20.0);
        assert_eq!(dot.radius, 2.5);
        assert_eq!(dot.opacity, 0.8);
        assert_eq!(dot.color, "#FF0000");
    }

    #[test]
    fn test_dot_distance() {
        let dot = Dot::new(0.0, 0.0, 1.0, 1.0, "#000000".to_string());

        assert_eq!(dot.distance_to(3.0, 4.0), 5.0); // 3-4-5 triangle
        assert_eq!(dot.distance_to(0.0, 0.0), 0.0); // Same position
    }

    #[test]
    fn test_dot_overlap() {
        let dot1 = Dot::new(0.0, 0.0, 2.0, 1.0, "#000000".to_string());
        let dot2 = Dot::new(3.0, 0.0, 2.0, 1.0, "#000000".to_string());
        let dot3 = Dot::new(5.0, 0.0, 2.0, 1.0, "#000000".to_string());

        assert!(
            dot1.overlaps_with(&dot2),
            "Dots should overlap (distance=3, radii=4)"
        );
        assert!(
            !dot1.overlaps_with(&dot3),
            "Dots should not overlap (distance=5, radii=4)"
        );
    }

    #[test]
    fn test_rgba_to_hex() {
        let white = Rgba([255, 255, 255, 255]);
        let black = Rgba([0, 0, 0, 255]);
        let red = Rgba([255, 0, 0, 255]);

        assert_eq!(rgba_to_hex(&white), "#ffffff");
        assert_eq!(rgba_to_hex(&black), "#000000");
        assert_eq!(rgba_to_hex(&red), "#ff0000");
    }

    #[test]
    fn test_gradient_strength_calculation() {
        let img = create_gradient_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);

        // Test center pixel
        let strength_adaptive =
            calculate_gradient_strength(&gradient_analysis, 50, 50, true, false);
        let strength_simple = calculate_gradient_strength(&gradient_analysis, 50, 50, false, false);

        assert!((0.0..=1.0).contains(&strength_adaptive));
        assert!((0.0..=1.0).contains(&strength_simple));

        // For a gradient image, adaptive should generally be different from simple
        assert_ne!(strength_adaptive, strength_simple);
    }

    #[test]
    fn test_strength_to_radius_mapping() {
        let min_radius = 0.5;
        let max_radius = 3.0;

        let radius_min = strength_to_radius(0.0, min_radius, max_radius);
        let radius_max = strength_to_radius(1.0, min_radius, max_radius);
        let radius_mid = strength_to_radius(0.5, min_radius, max_radius);

        assert_eq!(radius_min, min_radius);
        assert_eq!(radius_max, max_radius);
        assert!(radius_mid > min_radius && radius_mid < max_radius);
    }

    #[test]
    fn test_strength_to_opacity_mapping() {
        let opacity_min = strength_to_opacity(0.0);
        let opacity_max = strength_to_opacity(1.0);
        let opacity_mid = strength_to_opacity(0.5);

        assert!(opacity_min >= 0.3); // Minimum opacity
        assert_eq!(opacity_max, 1.0);
        assert!(opacity_mid > opacity_min && opacity_mid < opacity_max);
    }

    #[test]
    fn test_spatial_distribution() {
        let existing_dots = vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#000000".to_string()),
            Dot::new(20.0, 20.0, 2.0, 1.0, "#000000".to_string()),
        ];

        let spacing_factor = 2.0;

        // Position too close to first dot
        assert!(!is_position_valid(
            11.0,
            11.0,
            2.0,
            &existing_dots,
            spacing_factor
        ));

        // Position far enough from all dots
        assert!(is_position_valid(
            30.0,
            30.0,
            2.0,
            &existing_dots,
            spacing_factor
        ));

        // Position exactly at minimum distance (should be invalid due to floating point)
        let min_distance = 2.0 * spacing_factor;
        assert!(!is_position_valid(
            10.0 + min_distance - 0.1,
            10.0,
            2.0,
            &existing_dots,
            spacing_factor
        ));
    }

    #[test]
    fn test_spatial_grid() {
        let width = 100;
        let height = 100;
        let max_radius = 3.0;
        let spacing_factor = 2.0;

        let mut grid = SpatialGrid::new(width, height, max_radius, spacing_factor);
        let mut dots = Vec::new();

        // Add first dot
        let dot1 = Dot::new(25.0, 25.0, 2.0, 1.0, "#000000".to_string());
        grid.add_dot(0, dot1.x, dot1.y);
        dots.push(dot1);

        // Test position too close
        assert!(!grid.is_position_valid(26.0, 26.0, 2.0, &dots, spacing_factor));

        // Test position far enough
        assert!(grid.is_position_valid(50.0, 50.0, 2.0, &dots, spacing_factor));
    }

    #[test]
    fn test_generate_dots_basic() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);
        let config = DotConfig::default();

        let dots = generate_dots(&img, &gradient_analysis, &background_mask, &config);

        // Should generate some dots
        assert!(!dots.is_empty(), "Should generate some dots");

        // All dots should be within image bounds
        for dot in &dots {
            assert!(dot.x >= 0.0 && dot.x <= 50.0);
            assert!(dot.y >= 0.0 && dot.y <= 50.0);
            assert!(dot.radius >= config.min_radius);
            assert!(dot.radius <= config.max_radius);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_generate_dots_empty_image() {
        let img = RgbaImage::new(0, 0);
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = Vec::new();
        let config = DotConfig::default();

        let dots = generate_dots(&img, &gradient_analysis, &background_mask, &config);
        assert!(dots.is_empty(), "Empty image should produce no dots");
    }

    #[test]
    fn test_generate_dots_background_filtering() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);

        // All background mask
        let all_background_mask = vec![true; 2500];
        let config = DotConfig::default();

        let dots = generate_dots(&img, &gradient_analysis, &all_background_mask, &config);
        assert!(
            dots.is_empty(),
            "All-background mask should produce no dots"
        );

        // No background mask
        let no_background_mask = vec![false; 2500];
        let dots_no_bg = generate_dots(&img, &gradient_analysis, &no_background_mask, &config);
        assert!(
            !dots_no_bg.is_empty(),
            "No-background mask should produce dots"
        );
    }

    #[test]
    fn test_generate_dots_density_threshold() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);

        let config_low = DotConfig {
            density_threshold: 0.01,
            ..Default::default()
        };

        let config_high = DotConfig {
            density_threshold: 0.8,
            ..Default::default()
        };

        let dots_low = generate_dots(&img, &gradient_analysis, &background_mask, &config_low);
        let dots_high = generate_dots(&img, &gradient_analysis, &background_mask, &config_high);

        // Lower threshold should generate more or equal dots
        assert!(
            dots_low.len() >= dots_high.len(),
            "Lower threshold should generate more dots"
        );
    }

    #[test]
    fn test_generate_dots_color_preservation() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);

        let config_preserve = DotConfig {
            preserve_colors: true,
            ..Default::default()
        };

        let config_default = DotConfig {
            preserve_colors: false,
            default_color: "#ff0000".to_string(),
            ..Default::default()
        };

        let dots_preserve =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_preserve);
        let dots_default =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_default);

        if !dots_preserve.is_empty() && !dots_default.is_empty() {
            // Preserved colors should be varied
            let unique_colors: std::collections::HashSet<_> =
                dots_preserve.iter().map(|d| &d.color).collect();
            assert!(
                unique_colors.len() > 1 || dots_preserve.len() == 1,
                "Color preservation should create varied colors"
            );

            // Default color should be uniform
            for dot in &dots_default {
                assert_eq!(dot.color, "#ff0000");
            }
        }
    }

    #[test]
    fn test_generate_dots_adaptive_sizing() {
        let img = create_gradient_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = vec![false; 10000]; // No background

        let config_adaptive = DotConfig {
            adaptive_sizing: true,
            density_threshold: 0.05, // Lower threshold to ensure dots
            ..Default::default()
        };

        let config_simple = DotConfig {
            adaptive_sizing: false,
            density_threshold: 0.05, // Lower threshold to ensure dots
            ..Default::default()
        };

        let dots_adaptive =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_adaptive);
        let dots_simple = generate_dots(&img, &gradient_analysis, &background_mask, &config_simple);

        // Both should generate dots with lower threshold
        if dots_adaptive.is_empty() || dots_simple.is_empty() {
            // If still no dots, test just that both methods work consistently
            assert_eq!(
                dots_adaptive.is_empty(),
                dots_simple.is_empty(),
                "Both adaptive and simple should behave consistently"
            );
            return; // Skip further tests if no dots generated
        }

        // Results should generally be different due to different strength calculations
        if dots_adaptive.len() > 5 && dots_simple.len() > 5 {
            let adaptive_radii: Vec<_> = dots_adaptive.iter().take(5).map(|d| d.radius).collect();
            let simple_radii: Vec<_> = dots_simple.iter().take(5).map(|d| d.radius).collect();

            // At least some radii should be different
            let differences = adaptive_radii
                .iter()
                .zip(simple_radii.iter())
                .filter(|(a, b)| ((*a) - (*b)).abs() > 0.01)
                .count();
            assert!(
                differences > 0,
                "Adaptive sizing should produce different results"
            );
        }
    }

    #[test]
    fn test_generate_dots_from_image_full_pipeline() {
        let img = create_test_image();
        let config = DotConfig::default();

        let dots = generate_dots_from_image(&img, &config, None, None);

        assert!(!dots.is_empty(), "Full pipeline should generate dots");

        // Validate dot properties
        for dot in &dots {
            assert!(dot.x >= 0.0 && dot.x <= 50.0);
            assert!(dot.y >= 0.0 && dot.y <= 50.0);
            assert!(dot.radius >= config.min_radius);
            assert!(dot.radius <= config.max_radius);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
            assert!(dot.color.starts_with('#'));
            assert_eq!(dot.color.len(), 7); // #RRGGBB format
        }
    }

    #[test]
    fn test_generate_dots_auto_background() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let config = DotConfig::default();

        let dots = generate_dots_auto_background(&img, &gradient_analysis, &config);

        assert!(!dots.is_empty(), "Auto background should generate dots");

        // Should be similar to manual background detection
        let background_config = BackgroundConfig::default();
        let background_mask = detect_background_advanced(&img, &background_config);
        let dots_manual = generate_dots(&img, &gradient_analysis, &background_mask, &config);

        assert_eq!(
            dots.len(),
            dots_manual.len(),
            "Auto and manual background should give same results"
        );
    }

    #[test]
    fn test_dot_config_defaults() {
        let config = DotConfig::default();

        assert_eq!(config.min_radius, 0.5);
        assert_eq!(config.max_radius, 3.0);
        assert_eq!(config.density_threshold, 0.1);
        assert!(config.preserve_colors);
        assert!(config.adaptive_sizing);
        assert_eq!(config.spacing_factor, 1.5);
        assert_eq!(config.default_color, "#000000");
        assert!(config.use_parallel);
        assert_eq!(config.parallel_threshold, 10000);
        assert_eq!(config.random_seed, 42);
        assert!(!config.poisson_disk_sampling);
        assert!(!config.gradient_based_sizing);
    }

    #[test]
    fn test_poisson_disk_sampling() {
        let mut sampler = PoissonDiskSampler::new(100.0, 100.0, 5.0, 42);
        let samples = sampler.generate();

        // Should generate some samples
        assert!(!samples.is_empty(), "Should generate at least one sample");

        // All samples should be within bounds
        for (x, y) in &samples {
            assert!(*x >= 0.0 && *x < 100.0, "X coordinate out of bounds: {}", x);
            assert!(*y >= 0.0 && *y < 100.0, "Y coordinate out of bounds: {}", y);
        }

        // Check minimum distance constraint
        for i in 0..samples.len() {
            for j in i + 1..samples.len() {
                let (x1, y1) = samples[i];
                let (x2, y2) = samples[j];
                let distance = ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt();
                assert!(
                    distance >= 5.0,
                    "Samples too close: distance {} < min_distance 5.0",
                    distance
                );
            }
        }
    }

    #[test]
    fn test_gradient_based_sizing() {
        let img = create_gradient_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);

        // Test standard vs gradient-based sizing
        let strength_standard =
            calculate_gradient_strength(&gradient_analysis, 50, 50, false, false);
        let strength_adaptive =
            calculate_gradient_strength(&gradient_analysis, 50, 50, true, false);
        let strength_gradient =
            calculate_gradient_strength(&gradient_analysis, 50, 50, false, true);

        // All should be valid strengths
        assert!((0.0..=1.0).contains(&strength_standard));
        assert!((0.0..=1.0).contains(&strength_adaptive));
        assert!((0.0..=1.0).contains(&strength_gradient));

        // Gradient-based sizing should generally produce different results
        // Note: They might be equal for some pixels, but for a gradient image they should differ
        assert_ne!(
            strength_standard, strength_gradient,
            "Standard and gradient-based sizing should produce different results"
        );
    }

    #[test]
    fn test_poisson_disk_sampling_integration() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);

        let config_poisson = DotConfig {
            poisson_disk_sampling: true,
            gradient_based_sizing: true,
            density_threshold: 0.05, // Lower threshold to ensure dots
            ..Default::default()
        };

        let config_grid = DotConfig {
            poisson_disk_sampling: false,
            gradient_based_sizing: false,
            density_threshold: 0.05,
            ..Default::default()
        };

        let dots_poisson =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_poisson);
        let dots_grid = generate_dots(&img, &gradient_analysis, &background_mask, &config_grid);

        // Both methods should generate dots (though potentially different counts)
        if !dots_poisson.is_empty() && !dots_grid.is_empty() {
            // Poisson distribution should have more natural spacing
            // This is hard to test directly, but we can verify basic properties

            // All dots should be within image bounds
            for dot in &dots_poisson {
                assert!(dot.x >= 0.0 && dot.x <= 50.0);
                assert!(dot.y >= 0.0 && dot.y <= 50.0);
            }

            for dot in &dots_grid {
                assert!(dot.x >= 0.0 && dot.x <= 50.0);
                assert!(dot.y >= 0.0 && dot.y <= 50.0);
            }
        }
    }
}
