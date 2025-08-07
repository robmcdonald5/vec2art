//! Path manipulation utilities for vectorization algorithms

use crate::algorithms::logo::{Point, Contour};

/// Douglas-Peucker path simplification algorithm
///
/// Reduces the number of points in a path while preserving its overall shape
/// within the specified tolerance.
///
/// # Arguments
/// * `points` - Input path as a series of points
/// * `tolerance` - Maximum allowed perpendicular distance from simplified line
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
    
    let window_size = if window_size % 2 == 0 { window_size + 1 } else { window_size };
    let half_window = window_size / 2;
    let mut smoothed = Vec::with_capacity(points.len());
    
    for i in 0..points.len() {
        let start = if i >= half_window { i - half_window } else { 0 };
        let end = if i + half_window < points.len() { i + half_window + 1 } else { points.len() };
        
        let mut sum_x = 0.0;
        let mut sum_y = 0.0;
        let mut count = 0;
        
        for j in start..end {
            sum_x += points[j].x;
            sum_y += points[j].y;
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

#[cfg(test)]
mod tests {
    use super::*;

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
}