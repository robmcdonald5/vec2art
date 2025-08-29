//! Bézier curve fitting with curvature regularization
//!
//! This module implements adaptive Bézier curve fitting for polylines with:
//! - L2 distance error minimization
//! - Curvature penalty regularization (lambda_curv)
//! - Corner detection and splitting at curvature spikes
//! - Adaptive simplification based on local curvature
//! - CPU-optimized iterative fitting with numerical stability

use crate::algorithms::tracing::trace::{Point2F, Polyline};
use crate::execution::*;
use serde::{Deserialize, Serialize};
use std::f32::consts::PI;

/// Configuration for Bézier curve fitting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FitConfig {
    /// Curvature penalty coefficient (default: 0.02)
    pub lambda_curv: f32,
    /// Maximum fitting error tolerance (default: 0.8)
    pub max_err: f32,
    /// Corner splitting angle threshold in degrees (default: 32.0)
    pub split_angle: f32,
    /// Maximum iterations for iterative fitting (default: 10)
    pub max_iterations: u32,
    /// Minimum segment length for fitting (default: 3)
    pub min_segment_length: usize,
    /// Corner detection radius for curvature analysis (default: 2)
    pub corner_radius: usize,
}

impl Default for FitConfig {
    fn default() -> Self {
        Self {
            lambda_curv: 0.02,
            max_err: 0.8,
            split_angle: 32.0,
            max_iterations: 10,
            min_segment_length: 3,
            corner_radius: 2,
        }
    }
}

/// Cubic Bézier curve representation
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CubicBezier {
    /// Start point
    pub p0: Point2F,
    /// First control point
    pub p1: Point2F,
    /// Second control point
    pub p2: Point2F,
    /// End point
    pub p3: Point2F,
}

impl CubicBezier {
    /// Create new cubic Bézier curve
    pub fn new(p0: Point2F, p1: Point2F, p2: Point2F, p3: Point2F) -> Self {
        Self { p0, p1, p2, p3 }
    }

    /// Evaluate Bézier curve at parameter t ∈ [0, 1]
    pub fn evaluate(&self, t: f32) -> Point2F {
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;

        Point2F::new(
            mt3 * self.p0.x
                + 3.0 * mt2 * t * self.p1.x
                + 3.0 * mt * t2 * self.p2.x
                + t3 * self.p3.x,
            mt3 * self.p0.y
                + 3.0 * mt2 * t * self.p1.y
                + 3.0 * mt * t2 * self.p2.y
                + t3 * self.p3.y,
        )
    }

    /// Compute first derivative (tangent vector) at parameter t
    pub fn derivative(&self, t: f32) -> Point2F {
        let t2 = t * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;

        Point2F::new(
            3.0 * mt2 * (self.p1.x - self.p0.x)
                + 6.0 * mt * t * (self.p2.x - self.p1.x)
                + 3.0 * t2 * (self.p3.x - self.p2.x),
            3.0 * mt2 * (self.p1.y - self.p0.y)
                + 6.0 * mt * t * (self.p2.y - self.p1.y)
                + 3.0 * t2 * (self.p3.y - self.p2.y),
        )
    }

    /// Compute second derivative (curvature vector) at parameter t
    pub fn second_derivative(&self, t: f32) -> Point2F {
        let mt = 1.0 - t;

        Point2F::new(
            6.0 * mt * (self.p2.x - 2.0 * self.p1.x + self.p0.x)
                + 6.0 * t * (self.p3.x - 2.0 * self.p2.x + self.p1.x),
            6.0 * mt * (self.p2.y - 2.0 * self.p1.y + self.p0.y)
                + 6.0 * t * (self.p3.y - 2.0 * self.p2.y + self.p1.y),
        )
    }

    /// Compute curvature magnitude at parameter t
    pub fn curvature(&self, t: f32) -> f32 {
        let d1 = self.derivative(t);
        let d2 = self.second_derivative(t);

        let cross = d1.x * d2.y - d1.y * d2.x;
        let speed_cubed = (d1.x * d1.x + d1.y * d1.y).powf(1.5);

        if speed_cubed > 1e-10 {
            cross.abs() / speed_cubed
        } else {
            0.0
        }
    }

    /// Convert to SVG path data string
    pub fn to_svg_path_data(&self) -> String {
        format!(
            "M {:.2},{:.2} C {:.2},{:.2} {:.2},{:.2} {:.2},{:.2}",
            self.p0.x, self.p0.y, self.p1.x, self.p1.y, self.p2.x, self.p2.y, self.p3.x, self.p3.y
        )
    }
}

/// Fit cubic Bézier curves to polyline with curvature regularization
///
/// # Arguments
/// * `poly` - Input polyline to fit
/// * `cfg` - Fitting configuration parameters
///
/// # Returns
/// Vector of cubic Bézier curves that approximate the polyline
pub fn fit_beziers(poly: &Polyline, cfg: &FitConfig) -> Vec<CubicBezier> {
    if poly.len() < cfg.min_segment_length {
        return Vec::new();
    }

    log::debug!(
        "Fitting Bézier curves to polyline with {} points",
        poly.len()
    );
    let start_time = crate::utils::Instant::now();

    // Step 1: Detect corners and split polyline into segments
    let corner_indices = detect_corners(poly, cfg);
    let segments = split_polyline_at_corners(poly, &corner_indices);

    log::debug!(
        "Split polyline into {} segments at {} corners",
        segments.len(),
        corner_indices.len()
    );

    // Step 2: Fit Bézier curves to each segment (single-threaded WASM + Web Worker architecture)
    let use_parallel = false;

    let valid_segments: Vec<&Polyline> = segments
        .iter()
        .filter(|segment| segment.len() >= cfg.min_segment_length)
        .collect();

    let bezier_curves: Vec<CubicBezier> = if use_parallel {
        execute_parallel(valid_segments, |segment| {
            fit_segment_recursive(segment, cfg, 0)
        })
        .into_iter()
        .flatten()
        .collect()
    } else {
        valid_segments
            .iter()
            .flat_map(|segment| fit_segment_recursive(segment, cfg, 0))
            .collect()
    };

    let duration = start_time.elapsed();
    log::debug!(
        "Bézier fitting completed in {:.2}ms, generated {} curves",
        duration.as_secs_f64() * 1000.0,
        bezier_curves.len()
    );

    bezier_curves
}

/// Detect corners in polyline using curvature analysis
fn detect_corners(poly: &Polyline, cfg: &FitConfig) -> Vec<usize> {
    if poly.len() < 3 {
        return Vec::new();
    }

    let mut corners = Vec::new();
    let radius = cfg.corner_radius;
    let angle_threshold = cfg.split_angle * PI / 180.0;

    for i in radius..poly.len() - radius {
        let angle = compute_turning_angle(poly, i, radius);

        if angle.abs() > angle_threshold {
            corners.push(i);
        }
    }

    // Remove corners that are too close together
    let min_corner_distance = poly.len() / 10; // At least 10% of polyline apart
    let mut filtered_corners = Vec::new();

    for &corner in &corners {
        if filtered_corners.is_empty()
            || corner.abs_diff(*filtered_corners.last().unwrap()) >= min_corner_distance
        {
            filtered_corners.push(corner);
        }
    }

    filtered_corners
}

/// Compute turning angle at polyline point using local neighborhood
fn compute_turning_angle(poly: &Polyline, center: usize, radius: usize) -> f32 {
    let start_idx = center.saturating_sub(radius);
    let end_idx = (center + radius).min(poly.len() - 1);

    if start_idx >= end_idx {
        return 0.0;
    }

    let start = poly[start_idx];
    let center_point = poly[center];
    let end = poly[end_idx];

    // Compute vectors
    let v1_x = center_point.x - start.x;
    let v1_y = center_point.y - start.y;
    let v2_x = end.x - center_point.x;
    let v2_y = end.y - center_point.y;

    // Normalize vectors
    let v1_len = (v1_x * v1_x + v1_y * v1_y).sqrt();
    let v2_len = (v2_x * v2_x + v2_y * v2_y).sqrt();

    if v1_len < 1e-6 || v2_len < 1e-6 {
        return 0.0;
    }

    let v1_x = v1_x / v1_len;
    let v1_y = v1_y / v1_len;
    let v2_x = v2_x / v2_len;
    let v2_y = v2_y / v2_len;

    // Compute angle using cross product and dot product
    let cross = v1_x * v2_y - v1_y * v2_x;
    let dot = v1_x * v2_x + v1_y * v2_y;

    cross.atan2(dot)
}

/// Split polyline into segments at detected corners
fn split_polyline_at_corners(poly: &Polyline, corners: &[usize]) -> Vec<Polyline> {
    if corners.is_empty() {
        return vec![poly.clone()];
    }

    let mut segments = Vec::new();
    let mut start = 0;

    for &corner in corners {
        if corner > start {
            segments.push(poly[start..=corner].to_vec());
            start = corner;
        }
    }

    // Add final segment
    if start < poly.len() - 1 {
        segments.push(poly[start..].to_vec());
    }

    segments
}

/// Recursively fit Bézier curve to segment with adaptive subdivision
fn fit_segment_recursive(segment: &Polyline, cfg: &FitConfig, depth: u32) -> Vec<CubicBezier> {
    const MAX_RECURSION_DEPTH: u32 = 8;

    if segment.len() < cfg.min_segment_length || depth > MAX_RECURSION_DEPTH {
        return Vec::new();
    }

    // Try to fit single Bézier curve
    if let Some(bezier) = fit_single_bezier(segment, cfg) {
        let fitting_error = compute_fitting_error(segment, &bezier);

        if fitting_error <= cfg.max_err {
            return vec![bezier];
        }
    }

    // If single curve doesn't fit well, subdivide and try again
    if segment.len() >= 2 * cfg.min_segment_length {
        let mid_point = segment.len() / 2;
        let left_segment = segment[..=mid_point].to_vec();
        let right_segment = segment[mid_point..].to_vec();

        let mut curves = Vec::new();
        curves.extend(fit_segment_recursive(&left_segment, cfg, depth + 1));
        curves.extend(fit_segment_recursive(&right_segment, cfg, depth + 1));

        if !curves.is_empty() {
            return curves;
        }
    }

    // Fallback: return straight line as degenerate Bézier
    if segment.len() >= 2 {
        let start = segment[0];
        let end = segment[segment.len() - 1];
        let control_offset = 0.33;

        let p1 = Point2F::new(
            start.x + (end.x - start.x) * control_offset,
            start.y + (end.y - start.y) * control_offset,
        );
        let p2 = Point2F::new(
            start.x + (end.x - start.x) * (1.0 - control_offset),
            start.y + (end.y - start.y) * (1.0 - control_offset),
        );

        vec![CubicBezier::new(start, p1, p2, end)]
    } else {
        Vec::new()
    }
}

/// Fit single cubic Bézier curve to polyline segment
fn fit_single_bezier(segment: &Polyline, cfg: &FitConfig) -> Option<CubicBezier> {
    if segment.len() < 2 {
        return None;
    }

    let start = segment[0];
    let end = segment[segment.len() - 1];

    // Estimate initial tangent vectors
    let start_tangent = estimate_tangent(segment, 0);
    let end_tangent = estimate_tangent(segment, segment.len() - 1);

    // Use iterative least squares fitting with curvature regularization
    fit_bezier_iterative(segment, start, end, start_tangent, end_tangent, cfg)
}

/// Estimate tangent direction at polyline point
fn estimate_tangent(segment: &Polyline, index: usize) -> Point2F {
    let n = segment.len();

    if n < 2 {
        return Point2F::new(1.0, 0.0);
    }

    if index == 0 {
        // Forward difference at start
        let diff = Point2F::new(segment[1].x - segment[0].x, segment[1].y - segment[0].y);
        normalize_vector(diff)
    } else if index == n - 1 {
        // Backward difference at end
        let diff = Point2F::new(
            segment[n - 1].x - segment[n - 2].x,
            segment[n - 1].y - segment[n - 2].y,
        );
        normalize_vector(diff)
    } else {
        // Central difference in middle
        let diff = Point2F::new(
            segment[index + 1].x - segment[index - 1].x,
            segment[index + 1].y - segment[index - 1].y,
        );
        normalize_vector(diff)
    }
}

/// Normalize 2D vector
fn normalize_vector(v: Point2F) -> Point2F {
    let length = (v.x * v.x + v.y * v.y).sqrt();
    if length > 1e-10 {
        Point2F::new(v.x / length, v.y / length)
    } else {
        Point2F::new(1.0, 0.0)
    }
}

/// Iterative Bézier fitting with curvature regularization
fn fit_bezier_iterative(
    segment: &Polyline,
    start: Point2F,
    end: Point2F,
    start_tangent: Point2F,
    end_tangent: Point2F,
    cfg: &FitConfig,
) -> Option<CubicBezier> {
    // Initial guess for control point distances
    let segment_length = start.distance_to(&end);
    let mut alpha = segment_length * 0.33;
    let mut beta = segment_length * 0.33;

    let mut best_bezier = None;
    let mut best_error = f32::INFINITY;

    for _iteration in 0..cfg.max_iterations {
        // Construct control points
        let p1 = Point2F::new(
            start.x + alpha * start_tangent.x,
            start.y + alpha * start_tangent.y,
        );
        let p2 = Point2F::new(end.x - beta * end_tangent.x, end.y - beta * end_tangent.y);

        let bezier = CubicBezier::new(start, p1, p2, end);

        // Compute objective function (L2 error + curvature penalty)
        let data_error = compute_fitting_error(segment, &bezier);
        let curvature_penalty = compute_curvature_penalty(&bezier, cfg.lambda_curv);
        let total_error = data_error + curvature_penalty;

        if total_error < best_error {
            best_error = total_error;
            best_bezier = Some(bezier.clone());
        }

        // Numerical gradient descent for alpha and beta
        let gradient_step = 0.1;
        let (grad_alpha, grad_beta) = compute_gradients(
            segment,
            &bezier,
            cfg,
            alpha,
            beta,
            &start_tangent,
            &end_tangent,
        );

        alpha -= gradient_step * grad_alpha;
        beta -= gradient_step * grad_beta;

        // Clamp to reasonable bounds
        alpha = alpha.max(0.01).min(segment_length);
        beta = beta.max(0.01).min(segment_length);
    }

    best_bezier
}

/// Compute fitting error between polyline and Bézier curve
fn compute_fitting_error(segment: &Polyline, bezier: &CubicBezier) -> f32 {
    let mut total_error = 0.0;
    let n = segment.len();

    for (i, &point) in segment.iter().enumerate() {
        // Parameter t for this point
        let t = if n > 1 {
            i as f32 / (n - 1) as f32
        } else {
            0.0
        };
        let bezier_point = bezier.evaluate(t);

        let error = point.distance_to(&bezier_point);
        total_error += error * error;
    }

    (total_error / n as f32).sqrt()
}

/// Compute curvature penalty for Bézier curve
fn compute_curvature_penalty(bezier: &CubicBezier, lambda: f32) -> f32 {
    let samples = 10;
    let mut curvature_sum = 0.0;

    for i in 0..=samples {
        let t = i as f32 / samples as f32;
        let curvature = bezier.curvature(t);
        curvature_sum += curvature * curvature;
    }

    lambda * curvature_sum / (samples + 1) as f32
}

/// Compute gradients for optimization (simplified numerical approximation)
fn compute_gradients(
    segment: &Polyline,
    bezier: &CubicBezier,
    cfg: &FitConfig,
    alpha: f32,
    beta: f32,
    start_tangent: &Point2F,
    end_tangent: &Point2F,
) -> (f32, f32) {
    let eps = 0.01;

    // Current objective
    let current_error =
        compute_fitting_error(segment, bezier) + compute_curvature_penalty(bezier, cfg.lambda_curv);

    // Gradient w.r.t. alpha
    let p1_alpha = Point2F::new(
        bezier.p0.x + (alpha + eps) * start_tangent.x,
        bezier.p0.y + (alpha + eps) * start_tangent.y,
    );
    let bezier_alpha = CubicBezier::new(bezier.p0, p1_alpha, bezier.p2, bezier.p3);
    let error_alpha = compute_fitting_error(segment, &bezier_alpha)
        + compute_curvature_penalty(&bezier_alpha, cfg.lambda_curv);
    let grad_alpha = (error_alpha - current_error) / eps;

    // Gradient w.r.t. beta
    let p2_beta = Point2F::new(
        bezier.p3.x - (beta + eps) * end_tangent.x,
        bezier.p3.y - (beta + eps) * end_tangent.y,
    );
    let bezier_beta = CubicBezier::new(bezier.p0, bezier.p1, p2_beta, bezier.p3);
    let error_beta = compute_fitting_error(segment, &bezier_beta)
        + compute_curvature_penalty(&bezier_beta, cfg.lambda_curv);
    let grad_beta = (error_beta - current_error) / eps;

    (grad_alpha, grad_beta)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fit_config_default() {
        let config = FitConfig::default();
        assert_eq!(config.lambda_curv, 0.02);
        assert_eq!(config.max_err, 0.8);
        assert_eq!(config.split_angle, 32.0);
        assert_eq!(config.max_iterations, 10);
        assert_eq!(config.min_segment_length, 3);
        assert_eq!(config.corner_radius, 2);
    }

    #[test]
    fn test_cubic_bezier_evaluation() {
        let bezier = CubicBezier::new(
            Point2F::new(0.0, 0.0),
            Point2F::new(1.0, 0.0),
            Point2F::new(2.0, 1.0),
            Point2F::new(3.0, 1.0),
        );

        // Test at endpoints
        let p0 = bezier.evaluate(0.0);
        let p1 = bezier.evaluate(1.0);

        assert!((p0.x - 0.0).abs() < 1e-6);
        assert!((p0.y - 0.0).abs() < 1e-6);
        assert!((p1.x - 3.0).abs() < 1e-6);
        assert!((p1.y - 1.0).abs() < 1e-6);

        // Test at midpoint
        let mid = bezier.evaluate(0.5);
        assert!(mid.x > 0.0 && mid.x < 3.0);
        assert!(mid.y >= 0.0 && mid.y <= 1.0);
    }

    #[test]
    fn test_turning_angle_computation() {
        let poly = vec![
            Point2F::new(0.0, 0.0),
            Point2F::new(1.0, 0.0),
            Point2F::new(2.0, 0.0),
            Point2F::new(3.0, 1.0), // Turn upward
            Point2F::new(4.0, 2.0),
        ];

        let angle = compute_turning_angle(&poly, 2, 1);

        // Should detect upward turn (positive angle)
        assert!(angle > 0.0);
    }

    #[test]
    fn test_corner_detection() {
        let poly = vec![
            Point2F::new(0.0, 0.0),
            Point2F::new(1.0, 0.0),
            Point2F::new(2.0, 0.0),
            Point2F::new(2.0, 1.0), // 90-degree corner
            Point2F::new(2.0, 2.0),
        ];

        let config = FitConfig::default();
        let corners = detect_corners(&poly, &config);

        // Should detect the corner at index 3
        assert!(!corners.is_empty());
    }

    #[test]
    fn test_tangent_estimation() {
        let poly = vec![
            Point2F::new(0.0, 0.0),
            Point2F::new(1.0, 0.0),
            Point2F::new(2.0, 0.0),
        ];

        let start_tangent = estimate_tangent(&poly, 0);
        let end_tangent = estimate_tangent(&poly, 2);

        // Should be horizontal tangents
        assert!((start_tangent.x - 1.0).abs() < 1e-6);
        assert!((start_tangent.y - 0.0).abs() < 1e-6);
        assert!((end_tangent.x - 1.0).abs() < 1e-6);
        assert!((end_tangent.y - 0.0).abs() < 1e-6);
    }

    #[test]
    fn test_fit_beziers_simple_line() {
        let poly = vec![
            Point2F::new(0.0, 0.0),
            Point2F::new(1.0, 0.0),
            Point2F::new(2.0, 0.0),
            Point2F::new(3.0, 0.0),
        ];

        let config = FitConfig::default();
        let beziers = fit_beziers(&poly, &config);

        // Should fit at least one Bézier curve
        assert!(!beziers.is_empty());

        // Check that endpoints match
        if let Some(bezier) = beziers.first() {
            assert!((bezier.p0.x - 0.0).abs() < 1e-3);
            assert!((bezier.p0.y - 0.0).abs() < 1e-3);
        }
    }

    #[test]
    fn test_svg_path_generation() {
        let bezier = CubicBezier::new(
            Point2F::new(0.0, 0.0),
            Point2F::new(1.0, 0.0),
            Point2F::new(2.0, 1.0),
            Point2F::new(3.0, 1.0),
        );

        let path_data = bezier.to_svg_path_data();

        // Should contain proper SVG path commands
        assert!(path_data.starts_with("M "));
        assert!(path_data.contains(" C "));
    }
}
