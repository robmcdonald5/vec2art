//! Flow-guided polyline tracing for coherent stroke generation
//!
//! This module implements flow-guided tracing that follows ETF direction fields
//! to generate coherent polylines from binary edge images. The tracing follows
//! the dominant flow direction bidirectionally and handles gaps intelligently.
//!
//! Key features:
//! - Bidirectional flow following along ETF field
//! - Gradient magnitude and coherency thresholding
//! - Gap handling up to configurable max_gap pixels
//! - Loop prevention with max_len constraint
//! - CPU-optimized implementation with SIMD-friendly operations

use crate::algorithms::edges::etf::EtfField;
use crate::execution::execute_parallel;
use image::GrayImage;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// 2D point with f32 coordinates for tracing operations  
pub type Point2F = crate::algorithms::Point;

/// Polyline represented as a vector of 2D points
pub type Polyline = Vec<Point2F>;

/// Configuration for flow-guided polyline tracing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceConfig {
    /// Minimum gradient magnitude threshold (default: 0.08)
    pub min_grad: f32,
    /// Minimum coherency threshold for ETF field (default: 0.15)
    pub min_coherency: f32,
    /// Maximum gap size to bridge in pixels (default: 4)
    pub max_gap: u32,
    /// Maximum polyline length to prevent infinite loops (default: 10_000)
    pub max_len: usize,
    /// Step size for tracing in pixels (default: 0.5)
    pub step_size: f32,
    /// Angular deviation threshold for path coherency (default: 30 degrees)
    pub max_angle_deviation: f32,
}

impl Default for TraceConfig {
    fn default() -> Self {
        Self {
            min_grad: 0.08,
            min_coherency: 0.15,
            max_gap: 4,
            max_len: 10_000,
            step_size: 0.5,
            max_angle_deviation: 30.0,
        }
    }
}

/// Internal state for polyline tracing
#[derive(Debug)]
struct TracingState {
    /// Current position in image coordinates
    position: Point2F,
    /// Current direction vector (normalized)
    direction: (f32, f32),
    /// Current polyline being traced
    current_polyline: Polyline,
    /// Set of visited pixels to prevent loops
    visited: HashSet<(i32, i32)>,
    /// Gap counter for bridging small gaps
    current_gap: u32,
}

impl TracingState {
    /// Create new tracing state at given position
    fn new(x: f32, y: f32, direction: (f32, f32)) -> Self {
        let polyline = vec![Point2F::new(x, y)];

        let mut visited = HashSet::new();
        visited.insert((x as i32, y as i32));

        Self {
            position: Point2F::new(x, y),
            direction,
            current_polyline: polyline,
            visited,
            current_gap: 0,
        }
    }

    /// Add point to current polyline and update state
    fn add_point(&mut self, x: f32, y: f32, direction: (f32, f32)) {
        self.position = Point2F::new(x, y);
        self.direction = direction;
        self.current_polyline.push(Point2F::new(x, y));
        self.visited.insert((x as i32, y as i32));
        self.current_gap = 0;
    }

    /// Check if position has been visited
    fn is_visited(&self, x: f32, y: f32) -> bool {
        self.visited.contains(&(x as i32, y as i32))
    }

    /// Get current polyline length
    fn len(&self) -> usize {
        self.current_polyline.len()
    }
}

/// Trace polylines from binary edge image using ETF field guidance
///
/// # Arguments
/// * `binary` - Binary edge image (white pixels = edges)
/// * `etf` - ETF direction field for flow guidance
/// * `cfg` - Tracing configuration parameters
///
/// # Returns
/// Vector of traced polylines, each containing a sequence of connected points
pub fn trace_polylines(binary: &GrayImage, etf: &EtfField, cfg: &TraceConfig) -> Vec<Polyline> {
    let width = binary.width();
    let height = binary.height();

    log::debug!("Starting polyline tracing for {width}x{height} image with config: {cfg:?}");
    let start_time = crate::utils::Instant::now();

    // Find seed points (edge pixels with sufficient gradient/coherency)
    let seed_points = find_seed_points(binary, etf, cfg);
    log::debug!("Found {} seed points for tracing", seed_points.len());

    if seed_points.is_empty() {
        log::warn!("No seed points found for polyline tracing");
        return Vec::new();
    }

    // Track globally visited pixels to avoid duplicate tracing
    let mut global_visited = HashSet::new();
    let mut polylines = Vec::new();

    // Trace polylines from each seed point
    for (seed_x, seed_y) in seed_points {
        // Skip if already traced from another seed
        if global_visited.contains(&(seed_x as i32, seed_y as i32)) {
            continue;
        }

        // Get initial direction from ETF field
        let (tx, ty) = etf.get_tangent(seed_x, seed_y);
        let coherency = etf.get_coherency(seed_x, seed_y);

        if coherency < cfg.min_coherency {
            continue;
        }

        // Trace bidirectionally from seed point
        log::debug!("Tracing from seed ({seed_x}, {seed_y}) with direction ({tx:.3}, {ty:.3})");

        let forward_polyline = trace_direction(
            binary,
            etf,
            cfg,
            seed_x as f32,
            seed_y as f32,
            (tx, ty),
            &mut global_visited,
        );
        log::debug!("Forward trace generated {} points", forward_polyline.len());

        let backward_polyline = trace_direction(
            binary,
            etf,
            cfg,
            seed_x as f32,
            seed_y as f32,
            (-tx, -ty),
            &mut global_visited,
        );
        log::debug!(
            "Backward trace generated {} points",
            backward_polyline.len()
        );

        // Combine forward and backward traces
        let combined_polyline = combine_bidirectional_traces(&backward_polyline, &forward_polyline);

        if combined_polyline.len() >= 3 {
            polylines.push(combined_polyline);
        }
    }

    // Post-process polylines (remove short traces, smooth if needed)
    let filtered_polylines = post_process_polylines(polylines, cfg);

    let duration = start_time.elapsed();
    log::debug!(
        "Polyline tracing completed in {:.2}ms, generated {} polylines",
        duration.as_secs_f64() * 1000.0,
        filtered_polylines.len()
    );

    filtered_polylines
}

/// Find seed points for polyline tracing
fn find_seed_points(binary: &GrayImage, etf: &EtfField, cfg: &TraceConfig) -> Vec<(u32, u32)> {
    let width = binary.width();
    let height = binary.height();

    // Compute gradient magnitude from binary image
    let gradient_mag = compute_gradient_magnitude(binary);

    // Parallel search for seed points
    let seed_points: Vec<(u32, u32)> = execute_parallel(0..height, |y| {
        let mut local_seeds = Vec::new();

        for x in 0..width {
            let pixel_value = binary.get_pixel(x, y)[0] as f32 / 255.0;

            // Must be edge pixel
            if pixel_value < 0.5 {
                continue;
            }

            // Check gradient magnitude threshold
            let idx = (y * width + x) as usize;
            if idx >= gradient_mag.len() || gradient_mag[idx] < cfg.min_grad {
                continue;
            }

            // Check coherency threshold
            let coherency = etf.get_coherency(x, y);
            if coherency < cfg.min_coherency {
                continue;
            }

            local_seeds.push((x, y));
        }

        local_seeds
    })
    .into_iter()
    .flatten()
    .collect();

    seed_points
}

/// Compute gradient magnitude from binary image
fn compute_gradient_magnitude(binary: &GrayImage) -> Vec<f32> {
    let width = binary.width() as usize;
    let height = binary.height() as usize;
    let mut gradient_mag = vec![0.0; width * height];

    // Sobel kernels for gradient computation
    const SOBEL_X: [i32; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const SOBEL_Y: [i32; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let mut gx = 0.0;
            let mut gy = 0.0;

            // Apply Sobel operators
            for ky in 0..3 {
                for kx in 0..3 {
                    let px = x + kx - 1;
                    let py = y + ky - 1;
                    let pixel_value = binary.get_pixel(px as u32, py as u32)[0] as f32 / 255.0;
                    let kernel_idx = ky * 3 + kx;

                    gx += pixel_value * SOBEL_X[kernel_idx] as f32;
                    gy += pixel_value * SOBEL_Y[kernel_idx] as f32;
                }
            }

            gradient_mag[y * width + x] = (gx * gx + gy * gy).sqrt();
        }
    }

    gradient_mag
}

/// Trace polyline in specified direction from starting point
fn trace_direction(
    binary: &GrayImage,
    etf: &EtfField,
    cfg: &TraceConfig,
    start_x: f32,
    start_y: f32,
    start_direction: (f32, f32),
    global_visited: &mut HashSet<(i32, i32)>,
) -> Polyline {
    let width = binary.width();
    let height = binary.height();

    let mut state = TracingState::new(start_x, start_y, start_direction);

    loop {
        // Check termination conditions
        if state.len() >= cfg.max_len {
            log::trace!("Terminating trace: reached max length {}", cfg.max_len);
            break;
        }

        if state.current_gap > cfg.max_gap {
            log::trace!(
                "Terminating trace: gap {} exceeds max_gap {}",
                state.current_gap,
                cfg.max_gap
            );
            break;
        }

        // Compute next position
        let next_x = state.position.x + state.direction.0 * cfg.step_size;
        let next_y = state.position.y + state.direction.1 * cfg.step_size;

        // Check bounds
        if next_x < 0.0 || next_x >= width as f32 || next_y < 0.0 || next_y >= height as f32 {
            log::trace!("Terminating trace: out of bounds at ({next_x:.2}, {next_y:.2})");
            break;
        }

        let next_x_i = next_x as u32;
        let next_y_i = next_y as u32;

        // Check for loops
        if state.is_visited(next_x, next_y) {
            log::trace!("Terminating trace: loop detected at ({next_x:.2}, {next_y:.2})");
            break;
        }

        // Check edge presence
        let pixel_value = binary.get_pixel(next_x_i, next_y_i)[0] as f32 / 255.0;
        let is_edge = pixel_value > 0.5;

        if !is_edge {
            state.current_gap += 1;
            if state.current_gap > cfg.max_gap {
                break;
            }
            // Continue tracing through gap with current direction
            state.add_point(next_x, next_y, state.direction);
            continue;
        }

        // Get ETF direction at new position
        let (etf_tx, etf_ty) = etf.get_tangent(next_x_i, next_y_i);
        let coherency = etf.get_coherency(next_x_i, next_y_i);

        // Check coherency threshold
        if coherency < cfg.min_coherency {
            log::trace!(
                "Terminating trace: low coherency {coherency:.3} at ({next_x_i}, {next_y_i})"
            );
            break;
        }

        // Align ETF direction with current direction (choose consistent orientation)
        let dot_product = state.direction.0 * etf_tx + state.direction.1 * etf_ty;
        let aligned_direction = if dot_product >= 0.0 {
            (etf_tx, etf_ty)
        } else {
            (-etf_tx, -etf_ty)
        };

        // Check angular deviation
        let angle_deviation = dot_product.abs().acos() * 180.0 / std::f32::consts::PI;
        if angle_deviation > cfg.max_angle_deviation {
            log::trace!(
                "Terminating trace: angle deviation {:.1}° exceeds threshold {:.1}°",
                angle_deviation,
                cfg.max_angle_deviation
            );
            break;
        }

        // Add point to polyline
        state.add_point(next_x, next_y, aligned_direction);
    }

    // Mark all points in this polyline as globally visited
    for point in &state.current_polyline {
        global_visited.insert((point.x as i32, point.y as i32));
    }

    state.current_polyline
}

/// Combine forward and backward traces from bidirectional tracing
fn combine_bidirectional_traces(backward: &Polyline, forward: &Polyline) -> Polyline {
    if backward.is_empty() && forward.is_empty() {
        return Polyline::new();
    }

    if backward.is_empty() {
        return forward.clone();
    }

    if forward.is_empty() {
        return backward.clone();
    }

    // Combine: backward trace + forward trace (avoid duplicating seed point)
    let mut combined = Polyline::new();

    // Add backward trace in original order
    combined.extend_from_slice(backward);

    // Add forward trace (excluding seed point which is already included from backward)
    combined.extend_from_slice(&forward[1..]);

    combined
}

/// Post-process polylines to remove artifacts and improve quality
fn post_process_polylines(polylines: Vec<Polyline>, cfg: &TraceConfig) -> Vec<Polyline> {
    let min_length = 3; // Minimum points to keep polyline
    let max_duplicate_distance = cfg.step_size * 2.0; // Remove points too close together

    polylines
        .into_iter()
        .filter(|polyline| polyline.len() >= min_length) // Filter short polylines
        .map(|polyline| smooth_polyline(polyline, max_duplicate_distance)) // Smooth and remove duplicates
        .filter(|polyline| polyline.len() >= min_length) // Filter again after smoothing
        .collect()
}

/// Smooth polyline by removing duplicate points and applying simple smoothing
fn smooth_polyline(polyline: Polyline, max_duplicate_distance: f32) -> Polyline {
    if polyline.len() < 2 {
        return polyline;
    }

    let mut smoothed = Polyline::new();
    smoothed.push(polyline[0]); // Always keep first point

    for current in polyline.iter().skip(1) {
        let previous = smoothed.last().unwrap();

        // Skip if too close to previous point
        let distance = previous.distance_to(current);
        if distance < max_duplicate_distance {
            continue;
        }

        smoothed.push(*current);
    }

    // Always keep last point if different from current last
    if let Some(last) = polyline.last() {
        if let Some(smoothed_last) = smoothed.last() {
            if smoothed_last.distance_to(last) >= max_duplicate_distance {
                smoothed.push(*last);
            }
        }
    }

    smoothed
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::{
        edges::etf::{compute_etf, EtfConfig},
        Point,
    };
    use image::{GrayImage, Luma};

    #[test]
    fn test_trace_config_default() {
        let config = TraceConfig::default();
        assert_eq!(config.min_grad, 0.08);
        assert_eq!(config.min_coherency, 0.15);
        assert_eq!(config.max_gap, 4);
        assert_eq!(config.max_len, 10_000);
        assert_eq!(config.step_size, 0.5);
        assert_eq!(config.max_angle_deviation, 30.0);
    }

    #[test]
    fn test_tracing_state_creation() {
        let state = TracingState::new(10.0, 20.0, (1.0, 0.0));
        assert_eq!(state.position.x, 10.0);
        assert_eq!(state.position.y, 20.0);
        assert_eq!(state.direction, (1.0, 0.0));
        assert_eq!(state.len(), 1);
        assert!(state.is_visited(10.0, 20.0));
    }

    #[test]
    fn test_gradient_magnitude_computation() {
        // Create a simple test image with a vertical edge
        let mut img = GrayImage::new(5, 5);
        for y in 0..5 {
            for x in 0..5 {
                let value = if x < 2 { 0 } else { 255 };
                img.put_pixel(x, y, Luma([value]));
            }
        }

        let gradient_mag = compute_gradient_magnitude(&img);

        // Should have strong gradients at the edge
        assert!(gradient_mag[2 * 5 + 2] > 0.1); // Center pixel should have gradient
    }

    #[test]
    fn test_polyline_smoothing() {
        let polyline = vec![
            Point::new(0.0, 0.0),
            Point::new(0.1, 0.0), // Very close point
            Point::new(1.0, 0.0),
            Point::new(2.0, 0.0),
        ];

        let smoothed = smooth_polyline(polyline, 0.5);

        // Should remove the very close point
        assert_eq!(smoothed.len(), 3);
        assert_eq!(smoothed[0], Point::new(0.0, 0.0));
        assert_eq!(smoothed[1], Point::new(1.0, 0.0));
        assert_eq!(smoothed[2], Point::new(2.0, 0.0));
    }

    #[test]
    fn test_bidirectional_trace_combination() {
        let backward = vec![
            Point::new(0.0, 0.0),
            Point::new(1.0, 0.0), // This will be the seed point
        ];

        let forward = vec![
            Point::new(1.0, 0.0), // Seed point
            Point::new(2.0, 0.0),
            Point::new(3.0, 0.0),
        ];

        let combined = combine_bidirectional_traces(&backward, &forward);

        // Should have: [0,0] -> [1,0] -> [2,0] -> [3,0] (no duplicate seed point)
        assert_eq!(combined.len(), 4);
        assert_eq!(combined[0], Point::new(0.0, 0.0));
        assert_eq!(combined[1], Point::new(1.0, 0.0));
        assert_eq!(combined[2], Point::new(2.0, 0.0));
        assert_eq!(combined[3], Point::new(3.0, 0.0));
    }

    #[test]
    fn test_trace_polylines_simple() {
        // Initialize logger for debugging
        let _ = env_logger::builder().is_test(true).try_init();

        // Create a test image that simulates edge detection output (edges, not filled areas)
        let mut img = GrayImage::new(20, 20);
        // Fill background with black
        for y in 0..20 {
            for x in 0..20 {
                img.put_pixel(x, y, Luma([0]));
            }
        }
        // Create edge pixels that form a horizontal line (like what Canny edge detection would produce)
        for x in 5..15 {
            img.put_pixel(x, 10, Luma([255])); // Single-pixel horizontal edge line
        }

        // Create ETF field
        let etf_config = EtfConfig::default();
        let etf_field = compute_etf(&img, &etf_config);

        // Configure tracing with appropriate step size for discrete pixels
        let trace_config = TraceConfig {
            step_size: 0.8, // Step size optimized for discrete pixel tracing
            ..Default::default()
        };

        // Trace polylines
        let polylines = trace_polylines(&img, &etf_field, &trace_config);

        // Should detect the horizontal line and produce reasonable results
        assert!(
            !polylines.is_empty(),
            "Should generate polylines from edge pixels"
        );
        assert!(
            polylines.len() <= 10,
            "Should not produce too many spurious results"
        );
    }
}
