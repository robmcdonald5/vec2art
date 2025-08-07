use nalgebra::{Point2, Vector2};

/// 2D Point type
pub type Point = Point2<f32>;
pub type Vec2 = Vector2<f32>;

/// Calculate distance between two points
pub fn distance(p1: &Point, p2: &Point) -> f32 {
    (p1 - p2).norm()
}

/// Calculate angle between three points (in radians)
pub fn angle_between(p1: &Point, p2: &Point, p3: &Point) -> f32 {
    let v1 = p1 - p2;
    let v2 = p3 - p2;
    v1.angle(&v2)
}

/// Check if a point is inside a circle
pub fn point_in_circle(point: &Point, center: &Point, radius: f32) -> bool {
    distance(point, center) <= radius
}

/// Check if a point is inside a rectangle
pub fn point_in_rectangle(point: &Point, x: f32, y: f32, width: f32, height: f32) -> bool {
    point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height
}

/// Check if a point is inside a triangle using barycentric coordinates
pub fn point_in_triangle(point: &Point, a: &Point, b: &Point, c: &Point) -> bool {
    let v0 = c - a;
    let v1 = b - a;
    let v2 = point - a;

    let dot00 = v0.dot(&v0);
    let dot01 = v0.dot(&v1);
    let dot02 = v0.dot(&v2);
    let dot11 = v1.dot(&v1);
    let dot12 = v1.dot(&v2);

    let inv_denom = 1.0 / (dot00 * dot11 - dot01 * dot01);
    let u = (dot11 * dot02 - dot01 * dot12) * inv_denom;
    let v = (dot00 * dot12 - dot01 * dot02) * inv_denom;

    (u >= 0.0) && (v >= 0.0) && (u + v <= 1.0)
}

/// Calculate area of a triangle
pub fn triangle_area(a: &Point, b: &Point, c: &Point) -> f32 {
    0.5 * ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)).abs()
}

/// Calculate area of a polygon using the shoelace formula
pub fn polygon_area(points: &[Point]) -> f32 {
    if points.len() < 3 {
        return 0.0;
    }

    let mut area = 0.0;
    let n = points.len();

    for i in 0..n {
        let j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }

    area.abs() / 2.0
}

/// Calculate centroid of a polygon
pub fn polygon_centroid(points: &[Point]) -> Point {
    if points.is_empty() {
        return Point::new(0.0, 0.0);
    }

    let mut cx = 0.0;
    let mut cy = 0.0;
    let mut area = 0.0;
    let n = points.len();

    for i in 0..n {
        let j = (i + 1) % n;
        let a = points[i].x * points[j].y - points[j].x * points[i].y;
        cx += (points[i].x + points[j].x) * a;
        cy += (points[i].y + points[j].y) * a;
        area += a;
    }

    area *= 0.5;
    if area.abs() < 1e-10 {
        // Degenerate polygon, return arithmetic mean
        let sum_x: f32 = points.iter().map(|p| p.x).sum();
        let sum_y: f32 = points.iter().map(|p| p.y).sum();
        return Point::new(sum_x / n as f32, sum_y / n as f32);
    }

    cx /= 6.0 * area;
    cy /= 6.0 * area;

    Point::new(cx, cy)
}

/// Fit a circle to a set of points using least squares
pub fn fit_circle(points: &[Point]) -> Option<(Point, f32)> {
    if points.len() < 3 {
        return None;
    }

    let n = points.len() as f32;

    // Calculate means
    let mean_x: f32 = points.iter().map(|p| p.x).sum::<f32>() / n;
    let mean_y: f32 = points.iter().map(|p| p.y).sum::<f32>() / n;

    // Build matrix for least squares
    let mut uu = 0.0;
    let mut uv = 0.0;
    let mut vv = 0.0;
    let mut uuu = 0.0;
    let mut vvv = 0.0;
    let mut uvv = 0.0;
    let mut vuu = 0.0;

    for p in points {
        let u = p.x - mean_x;
        let v = p.y - mean_y;

        uu += u * u;
        uv += u * v;
        vv += v * v;
        uuu += u * u * u;
        vvv += v * v * v;
        uvv += u * v * v;
        vuu += v * u * u;
    }

    // Solve linear system
    let det = 2.0 * (uu * vv - uv * uv);
    if det.abs() < 1e-10 {
        return None;
    }

    let cx = (vv * (uuu + uvv) - uv * (vvv + vuu)) / det + mean_x;
    let cy = (uu * (vvv + vuu) - uv * (uuu + uvv)) / det + mean_y;

    // Calculate radius
    let center = Point::new(cx, cy);
    let radius = points.iter().map(|p| distance(p, &center)).sum::<f32>() / n;

    Some((center, radius))
}

/// Fit a line to a set of points using least squares
/// Returns (a, b, c) where ax + by + c = 0
pub fn fit_line(points: &[Point]) -> Option<(f32, f32, f32)> {
    if points.len() < 2 {
        return None;
    }

    let n = points.len() as f32;

    // Calculate means
    let mean_x: f32 = points.iter().map(|p| p.x).sum::<f32>() / n;
    let mean_y: f32 = points.iter().map(|p| p.y).sum::<f32>() / n;

    // Calculate covariance
    let mut cov_xx = 0.0;
    let mut cov_xy = 0.0;
    let mut cov_yy = 0.0;

    for p in points {
        let dx = p.x - mean_x;
        let dy = p.y - mean_y;
        cov_xx += dx * dx;
        cov_xy += dx * dy;
        cov_yy += dy * dy;
    }

    // Use principal component analysis to find line direction
    let trace = cov_xx + cov_yy;
    let det = cov_xx * cov_yy - cov_xy * cov_xy;
    let eigenvalue = trace / 2.0 + ((trace * trace / 4.0 - det).max(0.0)).sqrt();

    // Eigenvector corresponding to larger eigenvalue
    let a = cov_xy;
    let b = eigenvalue - cov_xx;

    // Normalize
    let norm = (a * a + b * b).sqrt();
    if norm < 1e-10 {
        // Degenerate case
        return Some((1.0, 0.0, -mean_x));
    }

    let a = a / norm;
    let b = b / norm;
    let c = -(a * mean_x + b * mean_y);

    Some((a, b, c))
}

/// Calculate the bounding box of a set of points
pub fn bounding_box(points: &[Point]) -> Option<(Point, Point)> {
    if points.is_empty() {
        return None;
    }

    let mut min_x = f32::MAX;
    let mut min_y = f32::MAX;
    let mut max_x = f32::MIN;
    let mut max_y = f32::MIN;

    for p in points {
        min_x = min_x.min(p.x);
        min_y = min_y.min(p.y);
        max_x = max_x.max(p.x);
        max_y = max_y.max(p.y);
    }

    Some((Point::new(min_x, min_y), Point::new(max_x, max_y)))
}

/// Check if two line segments intersect
pub fn segments_intersect(p1: &Point, p2: &Point, p3: &Point, p4: &Point) -> bool {
    let d1 = cross_product_2d(&(p4 - p3), &(p1 - p3));
    let d2 = cross_product_2d(&(p4 - p3), &(p2 - p3));
    let d3 = cross_product_2d(&(p2 - p1), &(p3 - p1));
    let d4 = cross_product_2d(&(p2 - p1), &(p4 - p1));

    if ((d1 > 0.0 && d2 < 0.0) || (d1 < 0.0 && d2 > 0.0))
        && ((d3 > 0.0 && d4 < 0.0) || (d3 < 0.0 && d4 > 0.0))
    {
        return true;
    }

    // Check for collinear points
    if d1.abs() < 1e-10 && on_segment(p3, p1, p4) {
        return true;
    }
    if d2.abs() < 1e-10 && on_segment(p3, p2, p4) {
        return true;
    }
    if d3.abs() < 1e-10 && on_segment(p1, p3, p2) {
        return true;
    }
    if d4.abs() < 1e-10 && on_segment(p1, p4, p2) {
        return true;
    }

    false
}

fn cross_product_2d(v1: &Vec2, v2: &Vec2) -> f32 {
    v1.x * v2.y - v1.y * v2.x
}

fn on_segment(p: &Point, q: &Point, r: &Point) -> bool {
    q.x <= p.x.max(r.x) && q.x >= p.x.min(r.x) && q.y <= p.y.max(r.y) && q.y >= p.y.min(r.y)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_distance() {
        let p1 = Point::new(0.0, 0.0);
        let p2 = Point::new(3.0, 4.0);
        assert_eq!(distance(&p1, &p2), 5.0);
    }

    #[test]
    fn test_triangle_area() {
        let a = Point::new(0.0, 0.0);
        let b = Point::new(4.0, 0.0);
        let c = Point::new(0.0, 3.0);
        assert_eq!(triangle_area(&a, &b, &c), 6.0);
    }

    #[test]
    fn test_point_in_triangle() {
        let a = Point::new(0.0, 0.0);
        let b = Point::new(4.0, 0.0);
        let c = Point::new(0.0, 3.0);

        let inside = Point::new(1.0, 1.0);
        let outside = Point::new(3.0, 3.0);

        assert!(point_in_triangle(&inside, &a, &b, &c));
        assert!(!point_in_triangle(&outside, &a, &b, &c));
    }
}
