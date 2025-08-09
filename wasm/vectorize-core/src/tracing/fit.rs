//! Advanced curve fitting algorithms with least-squares optimization

use crate::error::{VectorizeError, VectorizeResult};
// nalgebra types removed - using simplified math instead

/// Point in 2D space
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Point2D {
    pub x: f64,
    pub y: f64,
}

impl Point2D {
    pub fn new(x: f64, y: f64) -> Self {
        Point2D { x, y }
    }
    
    pub fn distance_to(&self, other: &Point2D) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
    
    pub fn dot(&self, other: &Point2D) -> f64 {
        self.x * other.x + self.y * other.y
    }
}

/// Cubic Bézier curve representation
#[derive(Clone, Debug)]
pub struct CubicBezier {
    pub p0: Point2D,
    pub p1: Point2D,
    pub p2: Point2D,
    pub p3: Point2D,
}

impl CubicBezier {
    /// Evaluate the curve at parameter t ∈ [0, 1]
    pub fn evaluate(&self, t: f64) -> Point2D {
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;
        
        Point2D {
            x: mt3 * self.p0.x + 3.0 * mt2 * t * self.p1.x + 
               3.0 * mt * t2 * self.p2.x + t3 * self.p3.x,
            y: mt3 * self.p0.y + 3.0 * mt2 * t * self.p1.y + 
               3.0 * mt * t2 * self.p2.y + t3 * self.p3.y,
        }
    }
    
    /// Calculate the derivative at parameter t
    pub fn derivative(&self, t: f64) -> Point2D {
        let t2 = t * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        
        Point2D {
            x: 3.0 * (mt2 * (self.p1.x - self.p0.x) + 
                     2.0 * mt * t * (self.p2.x - self.p1.x) + 
                     t2 * (self.p3.x - self.p2.x)),
            y: 3.0 * (mt2 * (self.p1.y - self.p0.y) + 
                     2.0 * mt * t * (self.p2.y - self.p1.y) + 
                     t2 * (self.p3.y - self.p2.y)),
        }
    }
    
    /// Calculate curvature at parameter t
    pub fn curvature(&self, t: f64) -> f64 {
        let d1 = self.derivative(t);
        let d2 = self.second_derivative(t);
        
        let cross = d1.x * d2.y - d1.y * d2.x;
        let norm = (d1.x * d1.x + d1.y * d1.y).powf(1.5);
        
        if norm < 1e-10 {
            0.0
        } else {
            cross.abs() / norm
        }
    }
    
    fn second_derivative(&self, t: f64) -> Point2D {
        let mt = 1.0 - t;
        
        Point2D {
            x: 6.0 * (mt * (self.p2.x - 2.0 * self.p1.x + self.p0.x) + 
                     t * (self.p3.x - 2.0 * self.p2.x + self.p1.x)),
            y: 6.0 * (mt * (self.p2.y - 2.0 * self.p1.y + self.p0.y) + 
                     t * (self.p3.y - 2.0 * self.p2.y + self.p1.y)),
        }
    }
}

/// Fit a cubic Bézier curve to a sequence of points using least squares
pub fn fit_cubic_bezier(
    points: &[Point2D],
    start_tangent: Option<Point2D>,
    end_tangent: Option<Point2D>,
    max_error: f64,
) -> VectorizeResult<CubicBezier> {
    if points.len() < 4 {
        return Err(VectorizeError::algorithm_error("Need at least 4 points for cubic fit"));
    }
    
    let n = points.len();
    let p0 = points[0];
    let p3 = points[n - 1];
    
    // Estimate tangents if not provided
    let t0 = start_tangent.unwrap_or_else(|| estimate_tangent(points, 0, true));
    let t3 = end_tangent.unwrap_or_else(|| estimate_tangent(points, n - 1, false));
    
    // Parameterize points by chord length
    let params = chord_length_parameterization(points);
    
    // Initial guess for control points
    let alpha1 = estimate_control_magnitude(&p0, &p3, &t0, points.len());
    let alpha2 = estimate_control_magnitude(&p3, &p0, &t3, points.len());
    
    let mut p1 = Point2D::new(p0.x + alpha1 * t0.x, p0.y + alpha1 * t0.y);
    let mut p2 = Point2D::new(p3.x - alpha2 * t3.x, p3.y - alpha2 * t3.y);
    
    // Iterative refinement
    let max_iterations = 10;
    for _ in 0..max_iterations {
        let (new_p1, new_p2) = refine_control_points(
            points,
            &params,
            &p0,
            &p3,
            &t0,
            &t3,
        )?;
        
        let curve = CubicBezier {
            p0,
            p1: new_p1,
            p2: new_p2,
            p3,
        };
        
        let error = calculate_max_error(points, &curve, &params);
        
        if error < max_error {
            return Ok(curve);
        }
        
        p1 = new_p1;
        p2 = new_p2;
        
        // Reparameterize for next iteration
        // params = newton_raphson_reparameterization(points, &curve, &params);
    }
    
    Ok(CubicBezier { p0, p1, p2, p3 })
}

/// Two-stage curve fitting: Douglas-Peucker followed by least squares
pub fn two_stage_fit(
    points: &[Point2D],
    dp_epsilon: f64,
    max_bezier_error: f64,
    corner_angle_threshold: f64,
) -> VectorizeResult<Vec<CubicBezier>> {
    // Stage 1: Douglas-Peucker simplification
    let simplified = douglas_peucker(points, dp_epsilon)?;
    
    // Detect corners
    let corners = detect_corners(&simplified, corner_angle_threshold);
    
    // Stage 2: Fit Bézier curves between corners
    let mut curves = Vec::new();
    let mut start = 0;
    
    for &corner_idx in corners.iter().skip(1) {
        let segment = &simplified[start..=corner_idx];
        if segment.len() >= 4 {
            let curve = fit_cubic_bezier(segment, None, None, max_bezier_error)?;
            curves.push(curve);
        } else if segment.len() >= 2 {
            // Too few points for cubic, create linear Bézier
            curves.push(create_linear_bezier(&segment[0], &segment[segment.len() - 1]));
        }
        start = corner_idx;
    }
    
    // Handle last segment
    let segment = &simplified[start..];
    if segment.len() >= 4 {
        let curve = fit_cubic_bezier(segment, None, None, max_bezier_error)?;
        curves.push(curve);
    } else if segment.len() >= 2 {
        curves.push(create_linear_bezier(&segment[0], &segment[segment.len() - 1]));
    }
    
    Ok(curves)
}

/// Douglas-Peucker line simplification
pub(crate) fn douglas_peucker(points: &[Point2D], epsilon: f64) -> VectorizeResult<Vec<Point2D>> {
    if points.len() <= 2 {
        return Ok(points.to_vec());
    }
    
    // Find point with maximum distance
    let mut max_dist = 0.0;
    let mut max_idx = 0;
    
    for i in 1..points.len() - 1 {
        let dist = perpendicular_distance(&points[i], &points[0], &points[points.len() - 1]);
        if dist > max_dist {
            max_dist = dist;
            max_idx = i;
        }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if max_dist > epsilon {
        let mut left = douglas_peucker(&points[..=max_idx], epsilon)?;
        let right = douglas_peucker(&points[max_idx..], epsilon)?;
        
        left.pop(); // Remove duplicate point
        left.extend(right);
        Ok(left)
    } else {
        Ok(vec![points[0], points[points.len() - 1]])
    }
}

/// Detect corners based on angle change
pub(crate) fn detect_corners(points: &[Point2D], angle_threshold: f64) -> Vec<usize> {
    let mut corners = vec![0];
    
    for i in 1..points.len() - 1 {
        let v1 = Point2D::new(
            points[i].x - points[i - 1].x,
            points[i].y - points[i - 1].y,
        );
        let v2 = Point2D::new(
            points[i + 1].x - points[i].x,
            points[i + 1].y - points[i].y,
        );
        
        let angle = angle_between_vectors(&v1, &v2);
        if angle.abs() > angle_threshold {
            corners.push(i);
        }
    }
    
    corners.push(points.len() - 1);
    corners
}

/// Calculate angle between two vectors in radians
pub(crate) fn angle_between_vectors(v1: &Point2D, v2: &Point2D) -> f64 {
    let dot = v1.dot(v2);
    let det = v1.x * v2.y - v1.y * v2.x;
    det.atan2(dot)
}

/// Estimate tangent at a point
pub(crate) fn estimate_tangent(points: &[Point2D], index: usize, is_start: bool) -> Point2D {
    let n = points.len();
    
    let tangent = if is_start && index + 1 < n {
        Point2D::new(
            points[index + 1].x - points[index].x,
            points[index + 1].y - points[index].y,
        )
    } else if !is_start && index > 0 {
        Point2D::new(
            points[index].x - points[index - 1].x,
            points[index].y - points[index - 1].y,
        )
    } else if index > 0 && index + 1 < n {
        Point2D::new(
            points[index + 1].x - points[index - 1].x,
            points[index + 1].y - points[index - 1].y,
        )
    } else {
        Point2D::new(1.0, 0.0)
    };
    
    // Normalize
    let len = (tangent.x * tangent.x + tangent.y * tangent.y).sqrt();
    if len > 1e-10 {
        Point2D::new(tangent.x / len, tangent.y / len)
    } else {
        Point2D::new(1.0, 0.0)
    }
}

/// Chord length parameterization
pub(crate) fn chord_length_parameterization(points: &[Point2D]) -> Vec<f64> {
    let mut params = vec![0.0];
    let mut total_length = 0.0;
    
    for i in 1..points.len() {
        total_length += points[i].distance_to(&points[i - 1]);
        params.push(total_length);
    }
    
    // Normalize to [0, 1]
    if total_length > 0.0 {
        for p in params.iter_mut() {
            *p /= total_length;
        }
    }
    
    params
}

/// Estimate initial control point magnitude
fn estimate_control_magnitude(p0: &Point2D, p3: &Point2D, _tangent: &Point2D, n_points: usize) -> f64 {
    let chord_length = p0.distance_to(p3);
    chord_length / (3.0 * (n_points as f64).sqrt())
}

/// Refine control points using simplified least squares
fn refine_control_points(
    points: &[Point2D],
    params: &[f64],
    p0: &Point2D,
    p3: &Point2D,
    t0: &Point2D,
    t3: &Point2D,
) -> VectorizeResult<(Point2D, Point2D)> {
    let n = points.len();
    
    // Simplified least squares approach
    // We'll use a direct calculation instead of matrix operations
    let mut sum_a1_squared = 0.0;
    let mut sum_a2_squared = 0.0;
    let mut sum_a1_cx = 0.0;
    let mut sum_a1_cy = 0.0;
    let mut sum_a2_cx = 0.0;
    let mut sum_a2_cy = 0.0;
    
    for i in 0..n {
        let t = params[i];
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;
        
        // Basis functions for control points
        let b1 = 3.0 * mt2 * t;
        let b2 = 3.0 * mt * t2;
        
        // Calculate the difference between the point and the curve without control points
        let cx = points[i].x - (mt3 * p0.x + t3 * p3.x);
        let cy = points[i].y - (mt3 * p0.y + t3 * p3.y);
        
        // Accumulate for least squares
        sum_a1_squared += b1 * b1;
        sum_a2_squared += b2 * b2;
        sum_a1_cx += b1 * cx;
        sum_a1_cy += b1 * cy;
        sum_a2_cx += b2 * cx;
        sum_a2_cy += b2 * cy;
    }
    
    // Solve for control point distances
    let alpha1 = if sum_a1_squared > 1e-10 {
        let alpha1_x = sum_a1_cx / sum_a1_squared / t0.x.max(0.01);
        let alpha1_y = sum_a1_cy / sum_a1_squared / t0.y.max(0.01);
        (alpha1_x + alpha1_y) / 2.0
    } else {
        estimate_control_magnitude(p0, p3, t0, n)
    };
    
    let alpha2 = if sum_a2_squared > 1e-10 {
        let alpha2_x = sum_a2_cx / sum_a2_squared / t3.x.max(0.01);
        let alpha2_y = sum_a2_cy / sum_a2_squared / t3.y.max(0.01);
        (alpha2_x + alpha2_y) / 2.0
    } else {
        estimate_control_magnitude(p3, p0, t3, n)
    };
    
    Ok((
        Point2D::new(p0.x + alpha1 * t0.x, p0.y + alpha1 * t0.y),
        Point2D::new(p3.x - alpha2 * t3.x, p3.y - alpha2 * t3.y),
    ))
}

/// Calculate maximum error between points and fitted curve
fn calculate_max_error(points: &[Point2D], curve: &CubicBezier, params: &[f64]) -> f64 {
    let mut max_error: f64 = 0.0;
    
    for (i, point) in points.iter().enumerate() {
        let t = params[i];
        let curve_point = curve.evaluate(t);
        let error = point.distance_to(&curve_point);
        max_error = max_error.max(error);
    }
    
    max_error
}

/// Calculate perpendicular distance from point to line
pub(crate) fn perpendicular_distance(point: &Point2D, line_start: &Point2D, line_end: &Point2D) -> f64 {
    let dx = line_end.x - line_start.x;
    let dy = line_end.y - line_start.y;
    
    if dx.abs() < 1e-10 && dy.abs() < 1e-10 {
        return point.distance_to(line_start);
    }
    
    let t = ((point.x - line_start.x) * dx + (point.y - line_start.y) * dy) / (dx * dx + dy * dy);
    let t = t.clamp(0.0, 1.0);
    
    let projection = Point2D::new(
        line_start.x + t * dx,
        line_start.y + t * dy,
    );
    
    point.distance_to(&projection)
}

/// Create a linear Bézier (straight line)
pub(crate) fn create_linear_bezier(p0: &Point2D, p3: &Point2D) -> CubicBezier {
    let p1 = Point2D::new(
        p0.x + (p3.x - p0.x) / 3.0,
        p0.y + (p3.y - p0.y) / 3.0,
    );
    let p2 = Point2D::new(
        p0.x + 2.0 * (p3.x - p0.x) / 3.0,
        p0.y + 2.0 * (p3.y - p0.y) / 3.0,
    );
    
    CubicBezier {
        p0: *p0,
        p1,
        p2,
        p3: *p3,
    }
}

/// Apply curvature limiting to a Bézier curve
pub fn limit_curvature(curve: &mut CubicBezier, max_curvature: f64) {
    // Sample curvature at multiple points
    let samples = 10;
    let mut max_found: f64 = 0.0;
    
    for i in 0..=samples {
        let t = i as f64 / samples as f64;
        let k = curve.curvature(t);
        max_found = max_found.max(k);
    }
    
    if max_found > max_curvature {
        // Scale control points to reduce curvature
        let scale = (max_curvature / max_found).sqrt();
        
        let mid_x = (curve.p0.x + curve.p3.x) / 2.0;
        let mid_y = (curve.p0.y + curve.p3.y) / 2.0;
        
        curve.p1.x = mid_x + scale * (curve.p1.x - mid_x);
        curve.p1.y = mid_y + scale * (curve.p1.y - mid_y);
        curve.p2.x = mid_x + scale * (curve.p2.x - mid_x);
        curve.p2.y = mid_y + scale * (curve.p2.y - mid_y);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_cubic_bezier_evaluation() {
        let curve = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(1.0, 1.0),
            p2: Point2D::new(2.0, 1.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        let p = curve.evaluate(0.5);
        assert!((p.x - 1.5).abs() < 0.01);
        assert!((p.y - 0.75).abs() < 0.01);
    }
    
    #[test]
    fn test_douglas_peucker() {
        let points = vec![
            Point2D::new(0.0, 0.0),
            Point2D::new(1.0, 0.1),
            Point2D::new(2.0, -0.1),
            Point2D::new(3.0, 5.0),
            Point2D::new(4.0, 6.0),
            Point2D::new(5.0, 7.0),
            Point2D::new(6.0, 8.1),
            Point2D::new(7.0, 9.0),
            Point2D::new(8.0, 9.0),
            Point2D::new(9.0, 9.0),
        ];
        
        let simplified = douglas_peucker(&points, 1.0).unwrap();
        assert!(simplified.len() < points.len());
    }
    
    #[test]
    fn test_corner_detection() {
        let points = vec![
            Point2D::new(0.0, 0.0),
            Point2D::new(1.0, 0.0),
            Point2D::new(1.0, 1.0), // 90 degree corner
            Point2D::new(0.0, 1.0),
        ];
        
        let corners = detect_corners(&points, std::f64::consts::PI / 4.0);
        assert_eq!(corners.len(), 4);
    }
}