//! Path manipulation utilities for vectorization algorithms

use crate::algorithms::Point;

/// Calculate appropriate Douglas-Peucker epsilon based on image dimensions
///
/// Uses the recommended scaling of 0.003-0.007 × image_diagonal_px for proper
/// path simplification that adapts to image size.
///
/// # Arguments
/// * `image_width` - Width of the source image in pixels
/// * `image_height` - Height of the source image in pixels
/// * `simplification_factor` - Factor between 0.003-0.007 (default: 0.005)
///
/// # Returns
/// * `f64` - Appropriate epsilon value in pixels
pub fn calculate_douglas_peucker_epsilon(
    image_width: u32,
    image_height: u32,
    simplification_factor: f64,
) -> f64 {
    let diagonal = ((image_width as f64).powi(2) + (image_height as f64).powi(2)).sqrt();
    let factor = simplification_factor.clamp(0.003, 0.007);
    diagonal * factor
}

/// Douglas-Peucker path simplification algorithm
///
/// Reduces the number of points in a path while preserving its overall shape
/// within the specified tolerance.
///
/// # Arguments
/// * `points` - Input path as a series of points
/// * `tolerance` - Maximum allowed perpendicular distance from simplified line (in pixels)
///
/// # Returns
/// * `Vec<Point>` - Simplified path
pub fn douglas_peucker_simplify(points: &[Point], tolerance: f64) -> Vec<Point> {
    if points.len() <= 2 {
        return points.to_vec();
    }

    let tolerance_sq = tolerance * tolerance;
    simplify_recursive(points, 0, points.len() - 1, tolerance_sq)
}

fn simplify_recursive(points: &[Point], start: usize, end: usize, tolerance_sq: f64) -> Vec<Point> {
    if end <= start + 1 {
        return vec![points[start], points[end]];
    }

    // Find the point with maximum distance from line segment
    let mut max_distance_sq = 0.0;
    let mut max_index = start;

    for i in start + 1..end {
        let distance_sq = perpendicular_distance_squared(&points[i], &points[start], &points[end]);
        if distance_sq > max_distance_sq {
            max_distance_sq = distance_sq;
            max_index = i;
        }
    }

    if max_distance_sq <= tolerance_sq {
        // All points are within tolerance, return line segment
        vec![points[start], points[end]]
    } else {
        // Recursively simplify both segments
        let mut left = simplify_recursive(points, start, max_index, tolerance_sq);
        let right = simplify_recursive(points, max_index, end, tolerance_sq);

        // Merge results (remove duplicate middle point)
        left.pop();
        left.extend(right);
        left
    }
}

/// Calculate squared perpendicular distance from point to line segment
fn perpendicular_distance_squared(point: &Point, line_start: &Point, line_end: &Point) -> f64 {
    let dx = line_end.x - line_start.x;
    let dy = line_end.y - line_start.y;

    if dx == 0.0 && dy == 0.0 {
        // Degenerate line segment, return distance to point
        let pdx = point.x - line_start.x;
        let pdy = point.y - line_start.y;
        return (pdx * pdx + pdy * pdy) as f64;
    }

    let length_sq = (dx * dx + dy * dy) as f64;
    let t = ((point.x - line_start.x) * dx + (point.y - line_start.y) * dy) as f64 / length_sq;

    if t < 0.0 {
        // Point projects before line start
        let pdx = point.x - line_start.x;
        let pdy = point.y - line_start.y;
        (pdx * pdx + pdy * pdy) as f64
    } else if t > 1.0 {
        // Point projects after line end
        let pdx = point.x - line_end.x;
        let pdy = point.y - line_end.y;
        (pdx * pdx + pdy * pdy) as f64
    } else {
        // Point projects onto line segment
        let proj_x = line_start.x + t as f32 * dx;
        let proj_y = line_start.y + t as f32 * dy;
        let pdx = point.x - proj_x;
        let pdy = point.y - proj_y;
        (pdx * pdx + pdy * pdy) as f64
    }
}

/// Visvalingam-Whyatt path simplification algorithm
///
/// Alternative to Douglas-Peucker that removes points based on effective area
/// of triangles formed by consecutive point triplets.
///
/// # Arguments
/// * `points` - Input path as a series of points
/// * `min_area` - Minimum triangle area to preserve
///
/// # Returns
/// * `Vec<Point>` - Simplified path
pub fn visvalingam_whyatt_simplify(points: &[Point], min_area: f64) -> Vec<Point> {
    if points.len() <= 2 {
        return points.to_vec();
    }

    let mut simplified = points.to_vec();

    loop {
        if simplified.len() <= 2 {
            break;
        }

        let mut min_effective_area = f64::INFINITY;
        let mut min_index = 1; // Can't remove first or last point

        // Find point with minimum effective area
        for i in 1..simplified.len() - 1 {
            let area = triangle_area(&simplified[i - 1], &simplified[i], &simplified[i + 1]);
            if area < min_effective_area {
                min_effective_area = area;
                min_index = i;
            }
        }

        if min_effective_area > min_area {
            break; // All remaining points have area above threshold
        }

        // Remove the point with minimum effective area
        simplified.remove(min_index);
    }

    simplified
}

/// Calculate area of triangle formed by three points
fn triangle_area(p1: &Point, p2: &Point, p3: &Point) -> f64 {
    let area = 0.5 * ((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)).abs();
    area as f64
}

/// Smooth a path using a simple moving average filter
///
/// # Arguments
/// * `points` - Input path points
/// * `window_size` - Size of smoothing window (must be odd)
///
/// # Returns
/// * `Vec<Point>` - Smoothed path
pub fn smooth_path(points: &[Point], window_size: usize) -> Vec<Point> {
    if points.len() <= 2 || window_size <= 1 {
        return points.to_vec();
    }

    let window_size = if window_size % 2 == 0 {
        window_size + 1
    } else {
        window_size
    };
    let half_window = window_size / 2;
    let mut smoothed = Vec::with_capacity(points.len());

    for i in 0..points.len() {
        let start = i.saturating_sub(half_window);
        let end = if i + half_window < points.len() {
            i + half_window + 1
        } else {
            points.len()
        };

        let mut sum_x = 0.0;
        let mut sum_y = 0.0;
        let mut count = 0;

        for point in points.iter().take(end).skip(start) {
            sum_x += point.x;
            sum_y += point.y;
            count += 1;
        }

        smoothed.push(Point {
            x: sum_x / count as f32,
            y: sum_y / count as f32,
        });
    }

    smoothed
}

/// Calculate path length
///
/// # Arguments
/// * `points` - Path points
///
/// # Returns
/// * `f32` - Total path length
pub fn calculate_path_length(points: &[Point]) -> f32 {
    if points.len() < 2 {
        return 0.0;
    }

    let mut length = 0.0;
    for i in 1..points.len() {
        let dx = points[i].x - points[i - 1].x;
        let dy = points[i].y - points[i - 1].y;
        length += (dx * dx + dy * dy).sqrt();
    }

    length
}

/// Resample path to have evenly spaced points
///
/// # Arguments
/// * `points` - Input path points
/// * `target_spacing` - Desired spacing between points
///
/// # Returns
/// * `Vec<Point>` - Resampled path
pub fn resample_path(points: &[Point], target_spacing: f32) -> Vec<Point> {
    if points.len() < 2 || target_spacing <= 0.0 {
        return points.to_vec();
    }

    let total_length = calculate_path_length(points);
    let num_points = (total_length / target_spacing) as usize + 1;

    let mut resampled = Vec::with_capacity(num_points);
    resampled.push(points[0]); // Always include first point

    let mut current_distance = 0.0;
    let mut target_distance = target_spacing;
    let mut segment_index = 0;

    while target_distance < total_length && segment_index < points.len() - 1 {
        let segment_start = points[segment_index];
        let segment_end = points[segment_index + 1];
        let segment_dx = segment_end.x - segment_start.x;
        let segment_dy = segment_end.y - segment_start.y;
        let segment_length = (segment_dx * segment_dx + segment_dy * segment_dy).sqrt();

        if current_distance + segment_length >= target_distance {
            // Target point is on this segment
            let t = (target_distance - current_distance) / segment_length;
            let interpolated = Point {
                x: segment_start.x + t * segment_dx,
                y: segment_start.y + t * segment_dy,
            };
            resampled.push(interpolated);
            target_distance += target_spacing;
        } else {
            // Move to next segment
            current_distance += segment_length;
            segment_index += 1;
        }
    }

    // Always include last point
    if let Some(&last_point) = points.last() {
        if let Some(&last_resampled) = resampled.last() {
            let dx = last_point.x - last_resampled.x;
            let dy = last_point.y - last_resampled.y;
            if (dx * dx + dy * dy).sqrt() > target_spacing * 0.5 {
                resampled.push(last_point);
            }
        }
    }

    resampled
}

// ============================================================================
// SCHNEIDER CUBIC BÉZIER CURVE FITTING ALGORITHM
// ============================================================================

/// Cubic Bézier curve representation with all control points
#[derive(Debug, Clone, PartialEq)]
pub struct CubicBezier {
    pub start: Point,
    pub control1: Point,
    pub control2: Point,
    pub end: Point,
}

impl CubicBezier {
    /// Create new cubic Bézier curve
    pub fn new(start: Point, control1: Point, control2: Point, end: Point) -> Self {
        Self {
            start,
            control1,
            control2,
            end,
        }
    }

    /// Evaluate cubic Bézier curve at parameter t (0 <= t <= 1)
    pub fn evaluate(&self, t: f32) -> Point {
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;

        Point {
            x: mt3 * self.start.x
                + 3.0 * mt2 * t * self.control1.x
                + 3.0 * mt * t2 * self.control2.x
                + t3 * self.end.x,
            y: mt3 * self.start.y
                + 3.0 * mt2 * t * self.control1.y
                + 3.0 * mt * t2 * self.control2.y
                + t3 * self.end.y,
        }
    }

    /// Convert to SVG path command
    pub fn to_svg_command(&self) -> String {
        format!(
            "C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2}",
            self.control1.x,
            self.control1.y,
            self.control2.x,
            self.control2.y,
            self.end.x,
            self.end.y
        )
    }
}

/// Result of Schneider curve fitting
#[derive(Debug, Clone)]
pub enum FittingResult {
    /// Single cubic Bézier curve that fits within tolerance
    Curve(CubicBezier),
    /// Line segment (when points are too few or nearly collinear)
    Line(Point, Point),
    /// Multiple segments (recursive subdivision result)
    Segments(Vec<FittingResult>),
}

/// Fit cubic Bézier curves to a path using the Schneider algorithm
///
/// This is the main entry point for the Schneider algorithm that:
/// 1. Detects corners in the point sequence
/// 2. Fits optimal cubic Bézier curves between corners
/// 3. Uses error-bounded recursive subdivision
/// 4. Preserves sharp corners and handles special cases
///
/// # Arguments
/// * `points` - Input path points
/// * `tolerance` - Maximum allowed error in pixels (default: 1.0)
/// * `corner_angle_threshold` - Minimum turning angle for corner detection in degrees (default: 30.0)
///
/// # Returns
/// * `Vec<FittingResult>` - Sequence of curves and lines representing the path
pub fn schneider_fit_cubic_bezier(
    points: &[Point],
    tolerance: f32,
    corner_angle_threshold: f32,
) -> Vec<FittingResult> {
    if points.len() < 2 {
        return Vec::new();
    }

    if points.len() == 2 {
        return vec![FittingResult::Line(points[0], points[1])];
    }

    // Step 1: Detect corners in the point sequence
    let corners = detect_corners(points, corner_angle_threshold);

    // Step 2: Fit curves between corner segments
    let mut results = Vec::new();

    for i in 0..corners.len().saturating_sub(1) {
        let start_idx = corners[i];
        let end_idx = corners[i + 1];

        let segment = &points[start_idx..=end_idx];

        if segment.len() < 2 {
            // Skip degenerate segments
            continue;
        } else if segment.len() < 4 {
            // Too few points for cubic fitting, use line
            results.push(FittingResult::Line(segment[0], segment[segment.len() - 1]));
        } else {
            // Fit cubic Bézier to this segment
            let fitting_result = fit_cubic_segment(segment, tolerance);
            results.push(fitting_result);
        }
    }

    results
}

/// Detect corners in a point sequence based on turning angle
///
/// A corner is detected when the turning angle at a point exceeds the threshold.
/// Always includes the first and last points as implicit corners.
///
/// # Arguments
/// * `points` - Input point sequence
/// * `angle_threshold` - Minimum turning angle in degrees to detect a corner
///
/// # Returns
/// * `Vec<usize>` - Indices of corner points (always includes 0 and points.len()-1)
fn detect_corners(points: &[Point], angle_threshold: f32) -> Vec<usize> {
    if points.len() <= 2 {
        return vec![0, points.len() - 1];
    }

    let mut corners = vec![0]; // Always start with first point
    let angle_threshold_rad = angle_threshold.to_radians();

    for i in 1..points.len() - 1 {
        let turning_angle = calculate_turning_angle(points, i);

        // A significant turning angle indicates a corner
        if turning_angle.abs() >= angle_threshold_rad {
            corners.push(i);
        }
    }

    // Always end with last point
    let last_idx = points.len() - 1;
    if corners[corners.len() - 1] != last_idx {
        corners.push(last_idx);
    }

    corners
}

/// Calculate turning angle at a point (angle between incoming and outgoing vectors)
///
/// # Arguments
/// * `points` - Point sequence
/// * `index` - Index of the point to calculate turning angle for
///
/// # Returns
/// * `f32` - Turning angle in radians (positive = left turn, negative = right turn)
fn calculate_turning_angle(points: &[Point], index: usize) -> f32 {
    if index == 0 || index >= points.len() - 1 {
        return 0.0;
    }

    let prev = points[index - 1];
    let curr = points[index];
    let next = points[index + 1];

    // Incoming vector (from prev to curr)
    let v1 = Point {
        x: curr.x - prev.x,
        y: curr.y - prev.y,
    };

    // Outgoing vector (from curr to next)
    let v2 = Point {
        x: next.x - curr.x,
        y: next.y - curr.y,
    };

    // Calculate angle between vectors
    let dot = v1.x * v2.x + v1.y * v2.y;
    let cross = v1.x * v2.y - v1.y * v2.x;

    // Use atan2 for proper quadrant handling
    cross.atan2(dot)
}

/// Fit a cubic Bézier curve to a segment of points using the Schneider algorithm
///
/// This implements the core Schneider algorithm with:
/// - Tangent estimation at endpoints
/// - Least squares optimization for control points
/// - Newton-Raphson parameter refinement
/// - Error measurement and recursive subdivision
///
/// # Arguments
/// * `points` - Point segment to fit (must have >= 4 points)
/// * `tolerance` - Maximum allowed error in pixels
///
/// # Returns
/// * `FittingResult` - Either a single curve or recursive subdivision result
fn fit_cubic_segment(points: &[Point], tolerance: f32) -> FittingResult {
    if points.len() < 4 {
        return FittingResult::Line(points[0], points[points.len() - 1]);
    }

    // Check if points are nearly collinear
    if is_nearly_collinear(points, tolerance) {
        return FittingResult::Line(points[0], points[points.len() - 1]);
    }

    let start = points[0];
    let end = points[points.len() - 1];

    // Step 1: Estimate unit tangent vectors at endpoints
    let start_tangent = estimate_tangent_at_start(points);
    let end_tangent = estimate_tangent_at_end(points);

    // Step 2: Initial parameter assignment (chord-length parameterization)
    let parameters = compute_chord_parameters(points);

    // Step 3: Least squares fit to determine optimal control point distances
    let (alpha1, alpha2) = least_squares_fit(points, &parameters, &start_tangent, &end_tangent);

    // Step 4: Create initial Bézier curve
    let control1 = Point {
        x: start.x + alpha1 * start_tangent.x,
        y: start.y + alpha1 * start_tangent.y,
    };

    let control2 = Point {
        x: end.x + alpha2 * end_tangent.x,
        y: end.y + alpha2 * end_tangent.y,
    };

    let mut bezier = CubicBezier::new(start, control1, control2, end);

    // Step 5: Newton-Raphson parameter optimization (optional but improves accuracy)
    let mut parameters = parameters; // Make mutable for optimization
    newton_raphson_optimize(&mut bezier, points, &mut parameters);

    // Step 6: Measure maximum error
    let (max_error, max_error_index) = measure_fitting_error(&bezier, points, &parameters);

    // Step 7: Check if curve fits within tolerance
    if max_error <= tolerance {
        return FittingResult::Curve(bezier);
    }

    // Step 8: Recursive subdivision if error is too large
    if points.len() <= 8 {
        // Prevent infinite recursion on very small segments
        return FittingResult::Line(start, end);
    }

    // Split at point of maximum error
    let split_index = max_error_index;
    let left_segment = &points[0..=split_index];
    let right_segment = &points[split_index..];

    let left_result = fit_cubic_segment(left_segment, tolerance);
    let right_result = fit_cubic_segment(right_segment, tolerance);

    FittingResult::Segments(vec![left_result, right_result])
}

/// Check if a sequence of points is nearly collinear
///
/// Uses perpendicular distance from each point to the line formed by start and end points.
fn is_nearly_collinear(points: &[Point], tolerance: f32) -> bool {
    if points.len() <= 2 {
        return true;
    }

    let start = points[0];
    let end = points[points.len() - 1];

    // Check if start and end are the same (degenerate case)
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let line_length_sq = dx * dx + dy * dy;

    if line_length_sq < tolerance * tolerance {
        return true; // Degenerate line
    }

    // Check perpendicular distance of each intermediate point
    for point in &points[1..points.len() - 1] {
        let distance = perpendicular_distance_to_line(*point, start, end);
        if distance > tolerance {
            return false;
        }
    }

    true
}

/// Calculate perpendicular distance from a point to a line
fn perpendicular_distance_to_line(point: Point, line_start: Point, line_end: Point) -> f32 {
    let dx = line_end.x - line_start.x;
    let dy = line_end.y - line_start.y;

    if dx == 0.0 && dy == 0.0 {
        // Degenerate line, return distance to start point
        let pdx = point.x - line_start.x;
        let pdy = point.y - line_start.y;
        return (pdx * pdx + pdy * pdy).sqrt();
    }

    // Calculate perpendicular distance using cross product formula
    let cross = (point.x - line_start.x) * dy - (point.y - line_start.y) * dx;
    let line_length = (dx * dx + dy * dy).sqrt();

    cross.abs() / line_length
}

/// Estimate unit tangent vector at the start of a point sequence
fn estimate_tangent_at_start(points: &[Point]) -> Point {
    if points.len() < 2 {
        return Point { x: 1.0, y: 0.0 }; // Default horizontal tangent
    }

    // Use vector from first to second point, or look ahead further if too short
    for i in 1..points.len().min(4) {
        let dx = points[i].x - points[0].x;
        let dy = points[i].y - points[0].y;
        let length = (dx * dx + dy * dy).sqrt();

        if length > 1e-6 {
            return Point {
                x: dx / length,
                y: dy / length,
            };
        }
    }

    Point { x: 1.0, y: 0.0 } // Fallback
}

/// Estimate unit tangent vector at the end of a point sequence
fn estimate_tangent_at_end(points: &[Point]) -> Point {
    let n = points.len();
    if n < 2 {
        return Point { x: 1.0, y: 0.0 }; // Default horizontal tangent
    }

    // Use vector from second-to-last to last point, or look back further if too short
    for i in 1..n.min(4) {
        let dx = points[n - 1].x - points[n - 1 - i].x;
        let dy = points[n - 1].y - points[n - 1 - i].y;
        let length = (dx * dx + dy * dy).sqrt();

        if length > 1e-6 {
            return Point {
                x: dx / length,
                y: dy / length,
            };
        }
    }

    Point { x: 1.0, y: 0.0 } // Fallback
}

/// Compute chord-length parameterization for points
///
/// Assigns parameter values t ∈ [0,1] to each point based on cumulative chord length.
fn compute_chord_parameters(points: &[Point]) -> Vec<f32> {
    let mut parameters = vec![0.0; points.len()];

    if points.len() <= 1 {
        return parameters;
    }

    // Calculate cumulative chord lengths
    let mut total_length = 0.0;
    let mut lengths = vec![0.0; points.len()];

    for i in 1..points.len() {
        let dx = points[i].x - points[i - 1].x;
        let dy = points[i].y - points[i - 1].y;
        let segment_length = (dx * dx + dy * dy).sqrt();
        total_length += segment_length;
        lengths[i] = total_length;
    }

    // Normalize to [0, 1] range
    if total_length > 0.0 {
        for i in 1..points.len() {
            parameters[i] = lengths[i] / total_length;
        }
    }

    parameters
}

/// Perform least squares fitting to find optimal control point distances
///
/// Solves the linear system to find alpha1 and alpha2 (distances along tangent vectors)
/// that minimize the squared error between the Bézier curve and input points.
fn least_squares_fit(
    points: &[Point],
    parameters: &[f32],
    start_tangent: &Point,
    end_tangent: &Point,
) -> (f32, f32) {
    let n = points.len();

    // Set up the linear system: [C00 C01] [alpha1] = [X0]
    //                           [C10 C11] [alpha2]   [X1]
    let mut c00 = 0.0;
    let mut c01 = 0.0;
    let mut c11 = 0.0;
    let mut x0 = 0.0;
    let mut x1 = 0.0;

    for i in 0..n {
        let t = parameters[i];
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;

        // Bernstein basis functions for control points
        let b1 = 3.0 * mt2 * t;
        let b2 = 3.0 * mt * t2;

        // Point on curve without control points (just start and end)
        let base_x = mt3 * points[0].x + t3 * points[n - 1].x;
        let base_y = mt3 * points[0].y + t3 * points[n - 1].y;

        // Residual vector
        let rx = points[i].x - base_x;
        let ry = points[i].y - base_y;

        // Accumulate matrix elements
        c00 += b1 * b1;
        c01 += b1 * b2;
        c11 += b2 * b2;

        x0 += rx * b1 * start_tangent.x + ry * b1 * start_tangent.y;
        x1 += rx * b2 * end_tangent.x + ry * b2 * end_tangent.y;
    }

    let c10 = c01; // Matrix is symmetric

    // Solve 2x2 linear system
    let det = c00 * c11 - c01 * c10;

    if det.abs() < 1e-12 {
        // Singular matrix, use heuristic fallback
        let chord_length = {
            let dx = points[n - 1].x - points[0].x;
            let dy = points[n - 1].y - points[0].y;
            (dx * dx + dy * dy).sqrt()
        };
        let default_distance = chord_length / 3.0;
        return (default_distance, default_distance);
    }

    let alpha1 = (x0 * c11 - x1 * c01) / det;
    let alpha2 = (x1 * c00 - x0 * c10) / det;

    // Ensure positive distances (control points in correct direction)
    let alpha1 = alpha1.max(1.0);
    let alpha2 = alpha2.max(1.0);

    (alpha1, alpha2)
}

/// Newton-Raphson optimization to refine parameter assignments
///
/// Iteratively improves the parameter values for each point to minimize
/// the distance to the Bézier curve.
fn newton_raphson_optimize(bezier: &mut CubicBezier, points: &[Point], parameters: &mut [f32]) {
    const MAX_ITERATIONS: usize = 5;
    const CONVERGENCE_THRESHOLD: f32 = 1e-6;

    for _iteration in 0..MAX_ITERATIONS {
        let mut max_delta: f32 = 0.0;

        // Skip first and last points (they are exact)
        for i in 1..points.len() - 1 {
            let t = parameters[i];
            let point = points[i];

            // Calculate position and derivatives at current parameter
            let curve_point = bezier.evaluate(t);
            let derivative = evaluate_bezier_derivative(bezier, t);
            let second_derivative = evaluate_bezier_second_derivative(bezier, t);

            // Newton-Raphson step
            let error_x = curve_point.x - point.x;
            let error_y = curve_point.y - point.y;

            let numerator = error_x * derivative.x + error_y * derivative.y;
            let denominator = derivative.x * derivative.x
                + derivative.y * derivative.y
                + error_x * second_derivative.x
                + error_y * second_derivative.y;

            if denominator.abs() > 1e-12 {
                let delta_t = numerator / denominator;
                let new_t = (t - delta_t).clamp(0.0, 1.0);

                max_delta = max_delta.max(delta_t.abs());
                parameters[i] = new_t;
            }
        }

        // Check for convergence
        if max_delta < CONVERGENCE_THRESHOLD {
            break;
        }
    }
}

/// Evaluate first derivative of cubic Bézier curve at parameter t
fn evaluate_bezier_derivative(bezier: &CubicBezier, t: f32) -> Point {
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    let t2 = t * t;

    Point {
        x: 3.0 * mt2 * (bezier.control1.x - bezier.start.x)
            + 6.0 * mt * t * (bezier.control2.x - bezier.control1.x)
            + 3.0 * t2 * (bezier.end.x - bezier.control2.x),
        y: 3.0 * mt2 * (bezier.control1.y - bezier.start.y)
            + 6.0 * mt * t * (bezier.control2.y - bezier.control1.y)
            + 3.0 * t2 * (bezier.end.y - bezier.control2.y),
    }
}

/// Evaluate second derivative of cubic Bézier curve at parameter t
fn evaluate_bezier_second_derivative(bezier: &CubicBezier, t: f32) -> Point {
    let mt = 1.0 - t;

    Point {
        x: 6.0 * mt * (bezier.control2.x - 2.0 * bezier.control1.x + bezier.start.x)
            + 6.0 * t * (bezier.end.x - 2.0 * bezier.control2.x + bezier.control1.x),
        y: 6.0 * mt * (bezier.control2.y - 2.0 * bezier.control1.y + bezier.start.y)
            + 6.0 * t * (bezier.end.y - 2.0 * bezier.control2.y + bezier.control1.y),
    }
}

/// Measure fitting error between Bézier curve and points
///
/// Returns the maximum error and the index of the point with maximum error.
fn measure_fitting_error(
    bezier: &CubicBezier,
    points: &[Point],
    parameters: &[f32],
) -> (f32, usize) {
    let mut max_error = 0.0;
    let mut max_error_index = 0;

    for (i, &point) in points.iter().enumerate() {
        let t = parameters[i];
        let curve_point = bezier.evaluate(t);

        let dx = point.x - curve_point.x;
        let dy = point.y - curve_point.y;
        let error = (dx * dx + dy * dy).sqrt();

        if error > max_error {
            max_error = error;
            max_error_index = i;
        }
    }

    (max_error, max_error_index)
}

/// Convert Schneider fitting results to SVG path commands
pub fn fitting_results_to_svg_path(results: &[FittingResult], start_point: Point) -> String {
    let mut path_data = format!("M {:.2} {:.2}", start_point.x, start_point.y);

    for result in results {
        match result {
            FittingResult::Curve(bezier) => {
                path_data.push_str(&format!(" {}", bezier.to_svg_command()));
            }
            FittingResult::Line(_, end) => {
                path_data.push_str(&format!(" L {:.2} {:.2}", end.x, end.y));
            }
            FittingResult::Segments(segments) => {
                // Recursively handle nested segments
                for segment in segments {
                    match segment {
                        FittingResult::Curve(bezier) => {
                            path_data.push_str(&format!(" {}", bezier.to_svg_command()));
                        }
                        FittingResult::Line(_, end) => {
                            path_data.push_str(&format!(" L {:.2} {:.2}", end.x, end.y));
                        }
                        FittingResult::Segments(_) => {
                            // Handle deeper nesting if needed (rare case)
                            // For now, convert to lines to prevent infinite recursion
                            path_data.push_str(&format!(
                                " L {:.2} {:.2}",
                                segment.get_end_point().x,
                                segment.get_end_point().y
                            ));
                        }
                    }
                }
            }
        }
    }

    path_data
}

impl FittingResult {
    /// Get the end point of this fitting result
    fn get_end_point(&self) -> Point {
        match self {
            FittingResult::Curve(bezier) => bezier.end,
            FittingResult::Line(_, end) => *end,
            FittingResult::Segments(segments) => {
                if let Some(last_segment) = segments.last() {
                    last_segment.get_end_point()
                } else {
                    Point { x: 0.0, y: 0.0 } // Fallback
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_douglas_peucker_epsilon() {
        // Test with a 1024x768 image (common resolution)
        let epsilon = calculate_douglas_peucker_epsilon(1024, 768, 0.005);
        let expected_diagonal = ((1024.0_f64).powi(2) + (768.0_f64).powi(2)).sqrt();
        let expected_epsilon = expected_diagonal * 0.005;
        assert!((epsilon - expected_epsilon).abs() < 1e-10);

        // Test clamping of factor
        let epsilon_low = calculate_douglas_peucker_epsilon(1024, 768, 0.001); // Below 0.003
        let epsilon_high = calculate_douglas_peucker_epsilon(1024, 768, 0.01); // Above 0.007
        assert!((epsilon_low - expected_diagonal * 0.003).abs() < 1e-10);
        assert!((epsilon_high - expected_diagonal * 0.007).abs() < 1e-10);
    }

    #[test]
    fn test_douglas_peucker_simplify() {
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.1 },
            Point { x: 2.0, y: -0.1 },
            Point { x: 3.0, y: 0.0 },
        ];

        let simplified = douglas_peucker_simplify(&points, 0.2);
        assert_eq!(simplified.len(), 2); // Should simplify to line
        assert_eq!(simplified[0], points[0]);
        assert_eq!(simplified[1], points[3]);
    }

    #[test]
    fn test_triangle_area() {
        let p1 = Point { x: 0.0, y: 0.0 };
        let p2 = Point { x: 1.0, y: 0.0 };
        let p3 = Point { x: 0.0, y: 1.0 };

        let area = triangle_area(&p1, &p2, &p3);
        assert!((area - 0.5).abs() < 1e-6);
    }

    #[test]
    fn test_calculate_path_length() {
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
            Point { x: 3.0, y: 4.0 },
        ];

        let length = calculate_path_length(&points);
        assert!((length - 7.0).abs() < 1e-6); // 3 + 4 = 7
    }

    #[test]
    fn test_smooth_path() {
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 10.0 }, // Outlier
            Point { x: 2.0, y: 0.0 },
        ];

        let smoothed = smooth_path(&points, 3);
        assert!(smoothed[1].y < points[1].y); // Should reduce outlier
    }

    // ============================================================================
    // SCHNEIDER ALGORITHM TESTS
    // ============================================================================

    #[test]
    fn test_cubic_bezier_evaluation() {
        let bezier = CubicBezier::new(
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
        );

        // Test at t=0 (should be start point)
        let start = bezier.evaluate(0.0);
        assert!((start.x - 0.0).abs() < 1e-6);
        assert!((start.y - 0.0).abs() < 1e-6);

        // Test at t=1 (should be end point)
        let end = bezier.evaluate(1.0);
        assert!((end.x - 3.0).abs() < 1e-6);
        assert!((end.y - 0.0).abs() < 1e-6);

        // Test at t=0.5 (midpoint)
        let mid = bezier.evaluate(0.5);
        assert!(mid.x > 1.0 && mid.x < 2.0); // Should be between control points
    }

    #[test]
    fn test_corner_detection() {
        // Create a path with a sharp corner (90-degree turn)
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 10.0, y: 0.0 },  // Straight horizontal
            Point { x: 20.0, y: 0.0 },  // Still horizontal
            Point { x: 30.0, y: 10.0 }, // 90-degree turn upward
            Point { x: 30.0, y: 20.0 }, // Vertical continuation
        ];

        let corners = detect_corners(&points, 45.0); // 45-degree threshold

        // Should detect corner at the turning point (index 2 or 3)
        assert!(corners.len() >= 3); // Start, corner, end at minimum
        assert_eq!(corners[0], 0); // Start
        assert_eq!(corners[corners.len() - 1], points.len() - 1); // End
    }

    #[test]
    fn test_turning_angle_calculation() {
        // Test straight line (should be 0 angle)
        let straight_points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 2.0, y: 0.0 },
        ];
        let angle = calculate_turning_angle(&straight_points, 1);
        assert!(angle.abs() < 1e-6);

        // Test 90-degree left turn
        let left_turn_points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 1.0, y: 1.0 },
        ];
        let angle = calculate_turning_angle(&left_turn_points, 1);
        assert!((angle - std::f32::consts::PI / 2.0).abs() < 0.1); // Should be approximately π/2
    }

    #[test]
    fn test_tangent_estimation() {
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
        ];

        let start_tangent = estimate_tangent_at_start(&points);
        let end_tangent = estimate_tangent_at_end(&points);

        // For horizontal line, tangent should be (1, 0)
        assert!((start_tangent.x - 1.0).abs() < 1e-6);
        assert!((start_tangent.y - 0.0).abs() < 1e-6);
        assert!((end_tangent.x - 1.0).abs() < 1e-6);
        assert!((end_tangent.y - 0.0).abs() < 1e-6);
    }

    #[test]
    fn test_chord_parameterization() {
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 }, // Distance 1
            Point { x: 2.0, y: 0.0 }, // Distance 1
            Point { x: 3.0, y: 0.0 }, // Distance 1
        ];

        let parameters = compute_chord_parameters(&points);

        assert_eq!(parameters.len(), points.len());
        assert_eq!(parameters[0], 0.0); // First point at t=0
        assert_eq!(parameters[points.len() - 1], 1.0); // Last point at t=1

        // For equally spaced points, parameters should be evenly distributed
        assert!((parameters[1] - 1.0 / 3.0).abs() < 1e-6);
        assert!((parameters[2] - 2.0 / 3.0).abs() < 1e-6);
    }

    #[test]
    fn test_collinearity_detection() {
        // Test straight line (should be collinear)
        let straight_points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
        ];
        assert!(is_nearly_collinear(&straight_points, 0.1));

        // Test curved path (should not be collinear)
        let curved_points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 1.0 },
            Point { x: 2.0, y: 0.0 },
        ];
        assert!(!is_nearly_collinear(&curved_points, 0.1));
    }

    #[test]
    fn test_schneider_simple_line() {
        // Test fitting a simple straight line
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
        ];

        let results = schneider_fit_cubic_bezier(&points, 1.0, 30.0);

        // Should produce a single line segment for collinear points
        assert_eq!(results.len(), 1);
        match &results[0] {
            FittingResult::Line(start, end) => {
                assert_eq!(*start, points[0]);
                assert_eq!(*end, points[points.len() - 1]);
            }
            _ => assert!(false, "Expected line result for collinear points"),
        }
    }

    #[test]
    fn test_schneider_curved_path() {
        // Test fitting a curved path (quarter circle approximation)
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 0.3, y: 0.1 },
            Point { x: 0.7, y: 0.3 },
            Point { x: 0.9, y: 0.7 },
            Point { x: 1.0, y: 1.0 },
        ];

        let results = schneider_fit_cubic_bezier(&points, 1.0, 30.0);

        // Should produce at least one curve or subdivided segments
        assert!(!results.is_empty());

        // Convert to SVG and ensure it's not empty
        let svg_path = fitting_results_to_svg_path(&results, points[0]);
        assert!(svg_path.starts_with("M 0.00 0.00"));
        assert!(svg_path.len() > 10);
    }

    #[test]
    fn test_perpendicular_distance_calculation() {
        let line_start = Point { x: 0.0, y: 0.0 };
        let line_end = Point { x: 3.0, y: 0.0 };
        let test_point = Point { x: 1.5, y: 2.0 };

        let distance = perpendicular_distance_to_line(test_point, line_start, line_end);
        assert!((distance - 2.0).abs() < 1e-6); // Point is 2 units above horizontal line
    }

    #[test]
    fn test_bezier_svg_command() {
        let bezier = CubicBezier::new(
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 1.0 },
            Point { x: 2.0, y: 1.0 },
            Point { x: 3.0, y: 0.0 },
        );

        let svg_command = bezier.to_svg_command();
        assert_eq!(svg_command, "C 1.00 1.00 2.00 1.00 3.00 0.00");
    }

    #[test]
    fn test_error_measurement() {
        // Create a simple bezier curve
        let bezier = CubicBezier::new(
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.0, y: 0.0 },
            Point { x: 2.0, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
        );

        // Points that lie exactly on the curve (straight line case)
        let points = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 1.5, y: 0.0 },
            Point { x: 3.0, y: 0.0 },
        ];

        let parameters = vec![0.0, 0.5, 1.0];
        let (max_error, _) = measure_fitting_error(&bezier, &points, &parameters);

        // Error should be very small for points on the curve
        assert!(max_error < 1e-6);
    }
}
