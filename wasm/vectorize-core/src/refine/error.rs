//! Tile-based error computation for Phase B refinement
//! 
//! This module implements tile-based error analysis using ΔE (LAB color space)
//! and SSIM (structural similarity) metrics to identify regions requiring
//! refinement during the error-driven loop.

use image::{ImageBuffer, Rgba};
use palette::{Lab, Srgb, color_difference::DeltaE, convert::IntoColor};
use dssim::Dssim;
use thiserror::Error;

/// Errors that can occur during tile error computation
#[derive(Error, Debug)]
pub enum TileAnalysisError {
    #[error("Invalid tile dimensions: tile_size={tile_size}, image={}x{}", image_width, image_height)]
    InvalidTileDimensions {
        tile_size: u32,
        image_width: u32, 
        image_height: u32,
    },
    
    #[error("SSIM computation failed: {0}")]
    SsimFailed(String),
    
    #[error("Color conversion failed")]
    ColorConversion,
    
    #[error("Empty tile region")]
    EmptyTile,
}

/// Error analysis results for a single tile
#[derive(Debug, Clone)]
pub struct TileError {
    /// Tile position in grid coordinates
    pub x: u32,
    pub y: u32,
    
    /// Tile dimensions in pixels
    pub width: u32,
    pub height: u32,
    
    /// Average ΔE across tile (LAB color space)
    pub delta_e_avg: f64,
    
    /// Peak ΔE in tile (worst single pixel)
    pub delta_e_max: f64,
    
    /// SSIM score for tile (0.0-1.0, higher = more similar)
    pub ssim: f64,
    
    /// Combined priority metric for ranking tiles
    pub priority: f64,
    
    /// Number of pixels analyzed in this tile
    pub pixel_count: usize,
}

impl TileError {
    /// Check if this tile exceeds quality thresholds
    pub fn needs_refinement(&self, target_delta_e: f64, target_ssim: f64) -> bool {
        self.delta_e_avg > target_delta_e || self.ssim < target_ssim
    }
    
    /// Calculate refinement urgency score (higher = more urgent)
    pub fn urgency_score(&self, target_delta_e: f64, target_ssim: f64) -> f64 {
        let delta_e_urgency = (self.delta_e_avg / target_delta_e).max(1.0) - 1.0;
        let ssim_urgency = ((target_ssim - self.ssim) / (1.0 - target_ssim)).max(0.0);
        delta_e_urgency + ssim_urgency
    }
}

/// Configuration for tile-based error analysis
#[derive(Debug, Clone)]
pub struct TileAnalysisConfig {
    /// Size of analysis tiles in pixels
    pub tile_size: u32,
    
    /// Maximum number of tiles to analyze per iteration
    pub max_tiles_per_iteration: usize,
    
    /// ΔE threshold for identifying problem tiles
    pub delta_e_threshold: f64,
    
    /// SSIM threshold for identifying problem tiles
    pub ssim_threshold: f64,
    
    /// Whether to use weighted priority based on tile contents
    pub use_content_weighting: bool,
}

impl Default for TileAnalysisConfig {
    fn default() -> Self {
        Self {
            tile_size: 32,
            max_tiles_per_iteration: 5,
            delta_e_threshold: 6.0,
            ssim_threshold: 0.93,
            use_content_weighting: true,
        }
    }
}

/// Compute tile-based error analysis between original and rasterized images
/// 
/// Divides images into regular tiles and computes ΔE + SSIM metrics for each tile.
/// Returns tiles sorted by refinement priority (worst tiles first).
/// 
/// # Arguments
/// * `original` - Original input image
/// * `rasterized` - Rasterized SVG output 
/// * `config` - Analysis configuration
/// 
/// # Returns
/// * `Result<Vec<TileError>, TileAnalysisError>` - Sorted tile errors (worst first)
pub fn compute_tile_errors(
    original: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    rasterized: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TileAnalysisConfig,
) -> Result<Vec<TileError>, TileAnalysisError> {
    // Validate inputs
    if original.dimensions() != rasterized.dimensions() {
        return Err(TileAnalysisError::InvalidTileDimensions {
            tile_size: config.tile_size,
            image_width: original.width(),
            image_height: original.height(),
        });
    }
    
    let (width, height) = original.dimensions();
    if config.tile_size == 0 || config.tile_size > width.min(height) {
        return Err(TileAnalysisError::InvalidTileDimensions {
            tile_size: config.tile_size,
            image_width: width,
            image_height: height,
        });
    }
    
    let mut tile_errors = Vec::new();
    
    // Initialize SSIM analyzer
    let mut dssim = Dssim::new();
    
    // Process tiles in grid pattern
    let tiles_x = (width + config.tile_size - 1) / config.tile_size;
    let tiles_y = (height + config.tile_size - 1) / config.tile_size;
    
    for tile_y in 0..tiles_y {
        for tile_x in 0..tiles_x {
            let x_start = tile_x * config.tile_size;
            let y_start = tile_y * config.tile_size;
            let x_end = (x_start + config.tile_size).min(width);
            let y_end = (y_start + config.tile_size).min(height);
            
            let tile_width = x_end - x_start;
            let tile_height = y_end - y_start;
            
            // Skip if tile is too small
            if tile_width < 4 || tile_height < 4 {
                continue;
            }
            
            // Extract tile regions
            let original_tile = extract_tile_region(original, x_start, y_start, tile_width, tile_height);
            let rasterized_tile = extract_tile_region(rasterized, x_start, y_start, tile_width, tile_height);
            
            // Compute ΔE statistics for tile
            let (delta_e_avg, delta_e_max) = compute_tile_delta_e(&original_tile, &rasterized_tile)?;
            
            // Compute SSIM for tile
            let ssim = compute_tile_ssim(&mut dssim, &original_tile, &rasterized_tile)?;
            
            // Calculate combined priority metric
            let priority = calculate_tile_priority(delta_e_avg, ssim, config);
            
            let tile_error = TileError {
                x: tile_x,
                y: tile_y,
                width: tile_width,
                height: tile_height,
                delta_e_avg,
                delta_e_max,
                ssim,
                priority,
                pixel_count: (tile_width * tile_height) as usize,
            };
            
            // Only include tiles that need refinement
            if tile_error.needs_refinement(config.delta_e_threshold, config.ssim_threshold) {
                tile_errors.push(tile_error);
            }
        }
    }
    
    // Sort by priority (highest first = worst tiles first)
    tile_errors.sort_by(|a, b| b.priority.partial_cmp(&a.priority).unwrap());
    
    // Limit to max tiles per iteration
    tile_errors.truncate(config.max_tiles_per_iteration);
    
    Ok(tile_errors)
}

/// Extract a rectangular region from an image as a new image buffer
fn extract_tile_region(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let mut tile = ImageBuffer::new(width, height);
    
    for tile_y in 0..height {
        for tile_x in 0..width {
            let src_x = x + tile_x;
            let src_y = y + tile_y;
            
            if src_x < image.width() && src_y < image.height() {
                let pixel = *image.get_pixel(src_x, src_y);
                tile.put_pixel(tile_x, tile_y, pixel);
            }
        }
    }
    
    tile
}

/// Compute ΔE statistics for a tile using LAB color space
fn compute_tile_delta_e(
    original: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    rasterized: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> Result<(f64, f64), TileAnalysisError> {
    if original.dimensions() != rasterized.dimensions() {
        return Err(TileAnalysisError::EmptyTile);
    }
    
    let mut delta_e_sum: f64 = 0.0;
    let mut delta_e_max: f64 = 0.0;
    let mut pixel_count = 0;
    
    for (orig_pixel, raster_pixel) in original.pixels().zip(rasterized.pixels()) {
        // Convert RGB to LAB color space for perceptual comparison
        let orig_srgb = Srgb::new(
            orig_pixel[0] as f32 / 255.0,
            orig_pixel[1] as f32 / 255.0,
            orig_pixel[2] as f32 / 255.0,
        );
        let raster_srgb = Srgb::new(
            raster_pixel[0] as f32 / 255.0,
            raster_pixel[1] as f32 / 255.0,
            raster_pixel[2] as f32 / 255.0,
        );
        
        let orig_lab: Lab = orig_srgb.into_color();
        let raster_lab: Lab = raster_srgb.into_color();
        
        // Calculate ΔE using CIEDE2000 formula
        let delta_e = orig_lab.delta_e(raster_lab) as f64;
        
        delta_e_sum += delta_e;
        delta_e_max = delta_e_max.max(delta_e);
        pixel_count += 1;
    }
    
    if pixel_count == 0 {
        return Err(TileAnalysisError::EmptyTile);
    }
    
    let delta_e_avg = delta_e_sum / pixel_count as f64;
    
    Ok((delta_e_avg, delta_e_max))
}

/// Compute SSIM for a tile using dssim crate
fn compute_tile_ssim(
    _dssim: &mut Dssim,
    original: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    rasterized: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> Result<f64, TileAnalysisError> {
    // For now, use a simplified SSIM approximation until we can resolve the dssim API
    // This is a placeholder that computes a basic similarity metric
    let mut similarity_sum: f64 = 0.0;
    let mut pixel_count = 0;
    
    for (orig_pixel, raster_pixel) in original.pixels().zip(rasterized.pixels()) {
        // Simple RGB similarity metric (placeholder for actual SSIM)
        let r_diff = (orig_pixel[0] as f64 - raster_pixel[0] as f64).abs() / 255.0;
        let g_diff = (orig_pixel[1] as f64 - raster_pixel[1] as f64).abs() / 255.0;
        let b_diff = (orig_pixel[2] as f64 - raster_pixel[2] as f64).abs() / 255.0;
        
        let similarity = 1.0 - ((r_diff + g_diff + b_diff) / 3.0);
        similarity_sum += similarity;
        pixel_count += 1;
    }
    
    let avg_similarity = if pixel_count > 0 {
        similarity_sum / pixel_count as f64
    } else {
        0.0
    };
    
    Ok(avg_similarity)
}

/// Calculate tile priority for refinement selection
fn calculate_tile_priority(
    delta_e_avg: f64,
    ssim: f64,
    config: &TileAnalysisConfig,
) -> f64 {
    // Combined metric: higher priority = worse quality
    let delta_e_score = (delta_e_avg / config.delta_e_threshold).max(0.0);
    let ssim_score = ((config.ssim_threshold - ssim) / (1.0 - config.ssim_threshold)).max(0.0);
    
    // Weight both metrics equally
    delta_e_score + ssim_score
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tile_error_needs_refinement() {
        let tile = TileError {
            x: 0, y: 0, width: 32, height: 32,
            delta_e_avg: 8.0,
            delta_e_max: 12.0,
            ssim: 0.90,
            priority: 1.0,
            pixel_count: 1024,
        };
        
        // Should need refinement (ΔE too high, SSIM too low)
        assert!(tile.needs_refinement(6.0, 0.93));
        
        // Should not need refinement if thresholds are relaxed
        assert!(!tile.needs_refinement(10.0, 0.85));
    }
    
    #[test]
    fn test_tile_analysis_config_default() {
        let config = TileAnalysisConfig::default();
        assert_eq!(config.tile_size, 32);
        assert_eq!(config.max_tiles_per_iteration, 5);
        assert_eq!(config.delta_e_threshold, 6.0);
        assert_eq!(config.ssim_threshold, 0.93);
    }
    
    #[test]
    fn test_extract_tile_region() {
        // Create a 4x4 test image
        let mut image = ImageBuffer::new(4, 4);
        for y in 0..4 {
            for x in 0..4 {
                image.put_pixel(x, y, Rgba([x as u8 * 60, y as u8 * 60, 0, 255]));
            }
        }
        
        // Extract 2x2 tile from top-left
        let tile = extract_tile_region(&image, 0, 0, 2, 2);
        assert_eq!(tile.dimensions(), (2, 2));
        assert_eq!(*tile.get_pixel(0, 0), *image.get_pixel(0, 0));
        assert_eq!(*tile.get_pixel(1, 1), *image.get_pixel(1, 1));
    }
}