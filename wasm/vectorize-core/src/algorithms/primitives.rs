//! Primitive shape detection algorithms
//!
//! This module provides algebraic fitting methods to detect circles, ellipses, and arcs
//! from contour data. These primitive shapes can be rendered more efficiently in SVG
//! using native primitives rather than complex paths.

use crate::algorithms::logo::{Point, SvgPath, SvgElementType};
use crate::error::{VectorizeError, VectorizeResult};
use std::f32::consts::PI;

/// Configuration for primitive detection
#[derive(Debug, Clone)]
pub struct PrimitiveConfig {
    /// Threshold for accepting a primitive fit (lower = more strict)
    pub fit_tolerance: f32,
    /// Maximum eccentricity for circle detection (0.0 = perfect circle, 1.0 = line)
    pub max_circle_eccentricity: f32,
    /// Angle tolerance for axis-aligned ellipses (in radians)
    pub axis_alignment_tolerance: f32,
    /// Minimum number of points required for fitting
    pub min_points: usize,
    /// Maximum number of points to use (for performance)
    pub max_points: usize,
    /// Minimum angle coverage for arc detection (in radians)
    pub min_arc_angle: f32,
    /// Use RANSAC for noisy data
    pub use_ransac: bool,
    /// RANSAC iterations
    pub ransac_iterations: usize,
    /// RANSAC inlier threshold
    pub ransac_threshold: f32,
}

impl Default for PrimitiveConfig {
    fn default() -> Self {
        Self {
            fit_tolerance: 2.0,
            max_circle_eccentricity: 0.15,
            axis_alignment_tolerance: 5.0 * PI / 180.0, // 5 degrees
            min_points: 8,
            max_points: 500,
            min_arc_angle: PI / 4.0, // 45 degrees
            use_ransac: false,
            ransac_iterations: 100,
            ransac_threshold: 3.0,
        }
    }
}

/// Detected primitive shape
#[derive(Debug, Clone)]
pub enum DetectedPrimitive {
    Circle {
        center: Point,
        radius: f32,
        residual: f32,
    },
    Ellipse {
        center: Point,
        radius_x: f32,
        radius_y: f32,
        angle: f32,
        residual: f32,
    },
    Arc {
        center: Point,
        radius: f32,
        start_angle: f32,
        end_angle: f32,
        residual: f32,
    },
}

/// Circle fitting parameters
#[derive(Debug, Clone, Copy)]
pub struct Circle {
    pub center: Point,
    pub radius: f32,
}

/// Ellipse fitting parameters
#[derive(Debug, Clone, Copy)]
pub struct Ellipse {
    pub center: Point,
    pub radius_x: f32,
    pub radius_y: f32,
    pub angle: f32,
}

/// Arc fitting parameters
#[derive(Debug, Clone, Copy)]
pub struct Arc {
    pub center: Point,
    pub radius: f32,
    pub start_angle: f32,
    pub end_angle: f32,
}

/// Attempt to detect primitive shapes from a contour
///
/// # Arguments
/// * `contour` - Points defining the contour
/// * `config` - Detection configuration
///
/// # Returns
/// * `Option<DetectedPrimitive>` - Detected primitive or None if no suitable primitive found
pub fn detect_primitive(
    contour: &[Point],
    config: &PrimitiveConfig,
) -> VectorizeResult<Option<DetectedPrimitive>> {
    if contour.len() < config.min_points {
        return Ok(None);
    }

    // Limit number of points for performance
    let points = if contour.len() > config.max_points {
        subsample_contour(contour, config.max_points)
    } else {
        contour.to_vec()
    };

    // Try circle detection first (simpler case)
    if let Ok(Some(circle)) = detect_circle(&points, config) {
        return Ok(Some(circle));
    }

    // Try ellipse detection
    if let Ok(Some(ellipse)) = detect_ellipse(&points, config) {
        return Ok(Some(ellipse));
    }

    // Try arc detection
    if let Ok(Some(arc)) = detect_arc(&points, config) {
        return Ok(Some(arc));
    }

    Ok(None)
}

/// Detect circle using Pratt method
///
/// The Pratt method minimizes algebraic distance with constraint
/// for robust circle fitting.
fn detect_circle(
    points: &[Point],
    config: &PrimitiveConfig,
) -> VectorizeResult<Option<DetectedPrimitive>> {
    if config.use_ransac {
        detect_circle_ransac(points, config)
    } else {
        detect_circle_pratt(points, config)
    }
}

/// Pratt circle fitting implementation
fn detect_circle_pratt(
    points: &[Point],
    config: &PrimitiveConfig,
) -> VectorizeResult<Option<DetectedPrimitive>> {
    let n = points.len();
    if n < 3 {
        return Ok(None);
    }

    // Normalize points to improve numerical stability
    let mean_x = points.iter().map(|p| p.x as f64).sum::<f64>() / n as f64;
    let mean_y = points.iter().map(|p| p.y as f64).sum::<f64>() / n as f64;
    let scale = points.iter()
        .map(|p| ((p.x as f64 - mean_x).powi(2) + (p.y as f64 - mean_y).powi(2)).sqrt())
        .sum::<f64>() / n as f64;
    
    if scale < 1e-10 {
        return Ok(None); // All points are the same
    }

    // Build design matrix for algebraic circle fitting
    // Circle equation: x² + y² + D*x + E*y + F = 0
    let mut matrix_a = vec![vec![0.0; 3]; n];
    let mut vector_b = vec![0.0; n];

    for (i, point) in points.iter().enumerate() {
        let x = (point.x as f64 - mean_x) / scale;
        let y = (point.y as f64 - mean_y) / scale;
        
        matrix_a[i][0] = x;
        matrix_a[i][1] = y;
        matrix_a[i][2] = 1.0;
        vector_b[i] = -(x * x + y * y);
    }

    // Solve using least squares (simplified approach)
    let params = solve_least_squares_3x3(&matrix_a, &vector_b)?;
    
    let d = params[0];
    let e = params[1];
    let f = params[2];

    // Extract circle parameters and denormalize
    let center_x_norm = -d / 2.0;
    let center_y_norm = -e / 2.0;
    let radius_squared_norm = (d * d + e * e) / 4.0 - f;

    if radius_squared_norm <= 0.0 {
        return Ok(None);
    }

    let radius_norm = radius_squared_norm.sqrt();
    
    // Denormalize back to original coordinate system
    let center_x = center_x_norm * scale + mean_x;
    let center_y = center_y_norm * scale + mean_y;
    let radius = radius_norm * scale;
    
    let center = Point {
        x: center_x as f32,
        y: center_y as f32,
    };

    // Calculate fit quality (residual)
    let residual = calculate_circle_residual(points, &Circle { center, radius: radius as f32 });

    // Debug output for test (uncomment for debugging)
    // #[cfg(test)]
    // println!("Circle fit: center=({}, {}), radius={}, residual={}, tolerance={}", 
    //          center_x, center_y, radius, residual, config.fit_tolerance);

    // Check if fit is acceptable
    if residual > config.fit_tolerance {
        return Ok(None);
    }

    // Check eccentricity by attempting ellipse fit
    let eccentricity = estimate_eccentricity(points, &center, radius as f32);
    if eccentricity > config.max_circle_eccentricity {
        return Ok(None);
    }

    Ok(Some(DetectedPrimitive::Circle {
        center,
        radius: radius as f32,
        residual,
    }))
}

/// Detect circle using RANSAC for noisy data
fn detect_circle_ransac(
    points: &[Point],
    config: &PrimitiveConfig,
) -> VectorizeResult<Option<DetectedPrimitive>> {
    let n = points.len();
    if n < 3 {
        return Ok(None);
    }

    let mut best_circle: Option<Circle> = None;
    let mut best_inliers = 0;
    let mut rng_state = 42u64; // Simple PRNG state

    for _ in 0..config.ransac_iterations {
        // Select 3 random points
        let idx1 = (simple_rand(&mut rng_state) % n as u64) as usize;
        let idx2 = (simple_rand(&mut rng_state) % n as u64) as usize;
        let idx3 = (simple_rand(&mut rng_state) % n as u64) as usize;

        if idx1 == idx2 || idx1 == idx3 || idx2 == idx3 {
            continue;
        }

        let sample = [points[idx1], points[idx2], points[idx3]];
        
        // Fit circle to 3 points
        if let Ok(Some(circle)) = fit_circle_to_3_points(&sample) {
            // Count inliers
            let mut inliers = 0;
            for point in points {
                let dist_to_circle = ((point.x - circle.center.x).powi(2) + 
                                    (point.y - circle.center.y).powi(2)).sqrt();
                let residual = (dist_to_circle - circle.radius).abs();
                if residual < config.ransac_threshold {
                    inliers += 1;
                }
            }

            if inliers > best_inliers {
                best_inliers = inliers;
                best_circle = Some(circle);
            }
        }
    }

    if let Some(circle) = best_circle {
        let residual = calculate_circle_residual(points, &circle);
        
        if residual <= config.fit_tolerance && best_inliers >= config.min_points {
            let eccentricity = estimate_eccentricity(points, &circle.center, circle.radius);
            if eccentricity <= config.max_circle_eccentricity {
                return Ok(Some(DetectedPrimitive::Circle {
                    center: circle.center,
                    radius: circle.radius,
                    residual,
                }));
            }
        }
    }

    Ok(None)
}

/// Detect ellipse using Taubin method
fn detect_ellipse(
    points: &[Point],
    config: &PrimitiveConfig,
) -> VectorizeResult<Option<DetectedPrimitive>> {
    let n = points.len();
    if n < 5 {
        return Ok(None);
    }

    // Taubin ellipse fitting - simplified implementation
    // This is a complex algorithm, so we'll implement a basic version
    let ellipse = fit_ellipse_taubin(points)?;
    
    let residual = calculate_ellipse_residual(points, &ellipse);
    
    if residual > config.fit_tolerance {
        return Ok(None);
    }

    // Check if ellipse is axis-aligned within tolerance
    let angle_from_axis = ellipse.angle % (PI / 2.0);
    let axis_deviation = angle_from_axis.min(PI / 2.0 - angle_from_axis);
    
    if axis_deviation > config.axis_alignment_tolerance {
        return Ok(None);
    }

    Ok(Some(DetectedPrimitive::Ellipse {
        center: ellipse.center,
        radius_x: ellipse.radius_x,
        radius_y: ellipse.radius_y,
        angle: ellipse.angle,
        residual,
    }))
}

/// Detect arc using curvature analysis
fn detect_arc(
    points: &[Point],
    config: &PrimitiveConfig,
) -> VectorizeResult<Option<DetectedPrimitive>> {
    let n = points.len();
    if n < 5 {
        return Ok(None);
    }

    // First fit a circle to all points
    if let Ok(Some(DetectedPrimitive::Circle { center, radius, .. })) = 
        detect_circle_pratt(points, config) {
        
        // Calculate angles for each point relative to center
        let mut angles = Vec::with_capacity(n);
        for point in points {
            let angle = (point.y - center.y).atan2(point.x - center.x);
            angles.push(angle);
        }

        // Sort angles and find angular span
        angles.sort_by(|a, b| a.partial_cmp(b).unwrap());
        
        let angle_span = if let (Some(&first), Some(&last)) = (angles.first(), angles.last()) {
            let span = last - first;
            // Handle wraparound case
            if span > PI {
                2.0 * PI - span
            } else {
                span
            }
        } else {
            return Ok(None);
        };

        // Check if this covers less than full circle (indicating an arc)
        if angle_span < 2.0 * PI - config.min_arc_angle && angle_span >= config.min_arc_angle {
            let residual = calculate_circle_residual(points, &Circle { center, radius });
            
            if residual <= config.fit_tolerance {
                return Ok(Some(DetectedPrimitive::Arc {
                    center,
                    radius,
                    start_angle: angles[0],
                    end_angle: angles[angles.len() - 1],
                    residual,
                }));
            }
        }
    }

    Ok(None)
}

/// Generate SVG element from detected primitive
pub fn primitive_to_svg(primitive: &DetectedPrimitive, fill: Option<String>) -> SvgPath {
    match primitive {
        DetectedPrimitive::Circle { center, radius, .. } => {
            SvgPath {
                path_data: String::new(), // Not used for circles
                fill,
                stroke: None,
                stroke_width: None,
                element_type: SvgElementType::Circle { 
                    cx: center.x, 
                    cy: center.y, 
                    r: *radius 
                },
            }
        }
        DetectedPrimitive::Ellipse { center, radius_x, radius_y, angle, .. } => {
            SvgPath {
                path_data: String::new(), // Not used for ellipses
                fill,
                stroke: None,
                stroke_width: None,
                element_type: SvgElementType::Ellipse { 
                    cx: center.x, 
                    cy: center.y, 
                    rx: *radius_x, 
                    ry: *radius_y,
                    angle: Some(*angle),
                },
            }
        }
        DetectedPrimitive::Arc { center, radius, start_angle, end_angle, .. } => {
            // Convert arc to SVG path using arc command
            let start_x = center.x + radius * start_angle.cos();
            let start_y = center.y + radius * start_angle.sin();
            let end_x = center.x + radius * end_angle.cos();
            let end_y = center.y + radius * end_angle.sin();
            
            let large_arc = if (end_angle - start_angle).abs() > PI { 1 } else { 0 };
            let sweep = if end_angle > start_angle { 1 } else { 0 };
            
            SvgPath {
                path_data: format!(
                    "M {:.2} {:.2} A {:.2} {:.2} 0 {} {} {:.2} {:.2}",
                    start_x, start_y, radius, radius, large_arc, sweep, end_x, end_y
                ),
                fill,
                stroke: None,
                stroke_width: None,
                element_type: SvgElementType::Path, // Arcs use path data
            }
        }
    }
}

// Helper functions

/// Subsample contour to reduce number of points
fn subsample_contour(contour: &[Point], target_count: usize) -> Vec<Point> {
    if contour.len() <= target_count {
        return contour.to_vec();
    }

    let step = contour.len() as f32 / target_count as f32;
    let mut result = Vec::with_capacity(target_count);
    
    for i in 0..target_count {
        let index = (i as f32 * step) as usize;
        if index < contour.len() {
            result.push(contour[index]);
        }
    }
    
    result
}

/// Simple PRNG for RANSAC
fn simple_rand(state: &mut u64) -> u64 {
    *state = state.wrapping_mul(1103515245).wrapping_add(12345);
    *state
}

/// Fit circle to exactly 3 points
fn fit_circle_to_3_points(points: &[Point; 3]) -> VectorizeResult<Option<Circle>> {
    let [p1, p2, p3] = *points;
    
    // Check if points are collinear
    let det = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);
    if det.abs() < 1e-6 {
        return Ok(None);
    }

    // Calculate circle center and radius using geometric method
    let d = 2.0 * ((p1.x * (p2.y - p3.y)) + (p2.x * (p3.y - p1.y)) + (p3.x * (p1.y - p2.y)));
    
    if d.abs() < 1e-6 {
        return Ok(None);
    }

    let ux = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) + 
              (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) + 
              (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d;
              
    let uy = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) + 
              (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) + 
              (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d;

    let center = Point { x: ux, y: uy };
    let radius = ((ux - p1.x) * (ux - p1.x) + (uy - p1.y) * (uy - p1.y)).sqrt();

    Ok(Some(Circle { center, radius }))
}

/// Calculate residual error for circle fit
fn calculate_circle_residual(points: &[Point], circle: &Circle) -> f32 {
    let mut total_error = 0.0;
    
    for point in points {
        let dist_to_center = ((point.x - circle.center.x).powi(2) + 
                             (point.y - circle.center.y).powi(2)).sqrt();
        let error = (dist_to_center - circle.radius).abs();
        total_error += error * error;
    }
    
    (total_error / points.len() as f32).sqrt()
}

/// Estimate eccentricity of fitted circle
fn estimate_eccentricity(points: &[Point], center: &Point, _radius: f32) -> f32 {
    // Calculate moment-based eccentricity estimation
    let n = points.len() as f32;
    
    // Calculate second moments
    let mut m20 = 0.0;
    let mut m02 = 0.0;
    let mut m11 = 0.0;
    
    for point in points {
        let dx = point.x - center.x;
        let dy = point.y - center.y;
        m20 += dx * dx;
        m02 += dy * dy;
        m11 += dx * dy;
    }
    
    m20 /= n;
    m02 /= n;
    m11 /= n;
    
    // Calculate eccentricity from moments
    let trace = m20 + m02;
    let det = m20 * m02 - m11 * m11;
    
    if det <= 0.0 || trace <= 0.0 {
        return 1.0; // Maximum eccentricity for degenerate case
    }
    
    let lambda1 = 0.5 * (trace + (trace * trace - 4.0 * det).sqrt());
    let lambda2 = 0.5 * (trace - (trace * trace - 4.0 * det).sqrt());
    
    if lambda1 <= 0.0 || lambda2 <= 0.0 {
        return 1.0;
    }
    
    let eccentricity = (1.0 - lambda2 / lambda1).sqrt();
    eccentricity.min(1.0).max(0.0)
}

/// Simplified Taubin ellipse fitting
fn fit_ellipse_taubin(points: &[Point]) -> VectorizeResult<Ellipse> {
    // This is a simplified implementation of the Taubin method
    // For production use, a more sophisticated implementation would be needed
    
    let n = points.len();
    if n < 5 {
        return Err(VectorizeError::algorithm_error(
            "Need at least 5 points for ellipse fitting"
        ));
    }

    // Calculate centroid
    let mut cx = 0.0;
    let mut cy = 0.0;
    for point in points {
        cx += point.x;
        cy += point.y;
    }
    cx /= n as f32;
    cy /= n as f32;

    // Estimate ellipse parameters using method of moments (simplified)
    let mut sxx = 0.0;
    let mut syy = 0.0;
    let mut sxy = 0.0;
    
    for point in points {
        let dx = point.x - cx;
        let dy = point.y - cy;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
    }
    
    sxx /= n as f32;
    syy /= n as f32;
    sxy /= n as f32;
    
    // Calculate eigenvalues and eigenvectors
    let trace = sxx + syy;
    let det = sxx * syy - sxy * sxy;
    
    if det <= 0.0 {
        return Err(VectorizeError::algorithm_error(
            "Degenerate ellipse fit"
        ));
    }
    
    let lambda1 = 0.5 * (trace + (trace * trace - 4.0 * det).sqrt());
    let lambda2 = 0.5 * (trace - (trace * trace - 4.0 * det).sqrt());
    
    let radius_x = (lambda1 * 2.0).sqrt();
    let radius_y = (lambda2 * 2.0).sqrt();
    
    // Calculate angle
    let angle = if sxy.abs() < 1e-6 {
        if sxx > syy { 0.0 } else { PI / 2.0 }
    } else {
        0.5 * (2.0 * sxy).atan2(sxx - syy)
    };
    
    Ok(Ellipse {
        center: Point { x: cx, y: cy },
        radius_x,
        radius_y,
        angle,
    })
}

/// Calculate residual error for ellipse fit
fn calculate_ellipse_residual(points: &[Point], ellipse: &Ellipse) -> f32 {
    let mut total_error = 0.0;
    let cos_angle = ellipse.angle.cos();
    let sin_angle = ellipse.angle.sin();
    
    for point in points {
        // Transform point to ellipse coordinate system
        let dx = point.x - ellipse.center.x;
        let dy = point.y - ellipse.center.y;
        
        let x_rot = dx * cos_angle + dy * sin_angle;
        let y_rot = -dx * sin_angle + dy * cos_angle;
        
        // Calculate distance to ellipse
        let normalized_distance = (x_rot / ellipse.radius_x).powi(2) + 
                                 (y_rot / ellipse.radius_y).powi(2);
        let error = (normalized_distance - 1.0).abs();
        total_error += error;
    }
    
    total_error / points.len() as f32
}

/// Solve 3x3 least squares system (simplified)
fn solve_least_squares_3x3(matrix_a: &[Vec<f64>], vector_b: &[f64]) -> VectorizeResult<Vec<f64>> {
    let n = matrix_a.len();
    
    // Build normal equations: A^T * A * x = A^T * b
    let mut ata = vec![vec![0.0; 3]; 3];
    let mut atb = vec![0.0; 3];
    
    for i in 0..3 {
        for j in 0..3 {
            for k in 0..n {
                ata[i][j] += matrix_a[k][i] * matrix_a[k][j];
            }
        }
        
        for k in 0..n {
            atb[i] += matrix_a[k][i] * vector_b[k];
        }
    }
    
    // Solve 3x3 system using Cramer's rule (simplified for this specific case)
    let det = ata[0][0] * (ata[1][1] * ata[2][2] - ata[1][2] * ata[2][1]) -
              ata[0][1] * (ata[1][0] * ata[2][2] - ata[1][2] * ata[2][0]) +
              ata[0][2] * (ata[1][0] * ata[2][1] - ata[1][1] * ata[2][0]);
    
    if det.abs() < 1e-10 {
        return Err(VectorizeError::algorithm_error(
            "Singular matrix in least squares solve"
        ));
    }
    
    let x0 = (atb[0] * (ata[1][1] * ata[2][2] - ata[1][2] * ata[2][1]) -
              atb[1] * (ata[0][1] * ata[2][2] - ata[0][2] * ata[2][1]) +
              atb[2] * (ata[0][1] * ata[1][2] - ata[0][2] * ata[1][1])) / det;
              
    let x1 = (ata[0][0] * (atb[1] * ata[2][2] - atb[2] * ata[1][2]) -
              ata[0][1] * (atb[0] * ata[2][2] - atb[2] * ata[2][0]) +
              ata[0][2] * (atb[0] * ata[1][2] - atb[1] * ata[1][0])) / det;
              
    let x2 = (ata[0][0] * (ata[1][1] * atb[2] - ata[1][2] * atb[1]) -
              ata[0][1] * (ata[1][0] * atb[2] - ata[1][2] * atb[0]) +
              ata[0][2] * (ata[1][0] * atb[1] - ata[1][1] * atb[0])) / det;
    
    Ok(vec![x0, x1, x2])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perfect_circle_detection() {
        let center = Point { x: 50.0, y: 50.0 };
        let radius = 25.0;
        
        // Generate perfect circle points
        let mut points = Vec::new();
        for i in 0..16 {
            let angle = 2.0 * PI * i as f32 / 16.0;
            points.push(Point {
                x: center.x + radius * angle.cos(),
                y: center.y + radius * angle.sin(),
            });
        }
        
        let config = PrimitiveConfig::default();
        let result = detect_primitive(&points, &config).unwrap();
        
        // Debug output (uncomment for debugging)
        // match &result {
        //     Some(DetectedPrimitive::Circle { center: detected_center, radius: detected_radius, residual }) => {
        //         println!("Detected circle: center=({}, {}), radius={}, residual={}", 
        //                 detected_center.x, detected_center.y, detected_radius, residual);
        //     }
        //     Some(other) => {
        //         println!("Detected other primitive: {:?}", other);
        //     }
        //     None => {
        //         println!("No primitive detected");
        //     }
        // }
        
        assert!(matches!(result, Some(DetectedPrimitive::Circle { .. })));
        
        if let Some(DetectedPrimitive::Circle { center: detected_center, radius: detected_radius, residual }) = result {
            assert!((detected_center.x - center.x).abs() < 1.0);
            assert!((detected_center.y - center.y).abs() < 1.0);
            assert!((detected_radius - radius).abs() < 1.0);
            assert!(residual < 1.0);
        }
    }

    #[test]
    fn test_primitive_to_svg() {
        let circle = DetectedPrimitive::Circle {
            center: Point { x: 50.0, y: 50.0 },
            radius: 25.0,
            residual: 0.5,
        };
        
        let svg = primitive_to_svg(&circle, Some("red".to_string()));
        
        if let SvgElementType::Circle { cx, cy, r } = svg.element_type {
            assert!((cx - 50.0).abs() < 0.01);
            assert!((cy - 50.0).abs() < 0.01);
            assert!((r - 25.0).abs() < 0.01);
        } else {
            // Use assert! for test code to maintain test semantics
            assert!(false, "Expected Circle element type");
        }
        
        assert_eq!(svg.fill, Some("red".to_string()));
    }

    #[test]
    fn test_subsample_contour() {
        let points = (0..100).map(|i| Point { x: i as f32, y: 0.0 }).collect::<Vec<_>>();
        let subsampled = subsample_contour(&points, 10);
        
        assert_eq!(subsampled.len(), 10);
        assert_eq!(subsampled[0].x, 0.0);
        assert_eq!(subsampled[9].x, 90.0);
    }

    #[test]
    fn test_circle_residual_calculation() {
        let circle = Circle {
            center: Point { x: 0.0, y: 0.0 },
            radius: 10.0,
        };
        
        let perfect_points = vec![
            Point { x: 10.0, y: 0.0 },
            Point { x: 0.0, y: 10.0 },
            Point { x: -10.0, y: 0.0 },
            Point { x: 0.0, y: -10.0 },
        ];
        
        let residual = calculate_circle_residual(&perfect_points, &circle);
        assert!(residual < 0.01); // Should be very small for perfect circle
    }
}