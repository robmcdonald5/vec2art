//! Comprehensive unit tests for Bézier curve fitting and path optimization

use super::fit::*;
use std::f64::consts::PI;

/// Create a circular arc of points for testing
fn create_circular_arc(center: Point2D, radius: f64, start_angle: f64, end_angle: f64, num_points: usize) -> Vec<Point2D> {
    let mut points = Vec::new();
    
    for i in 0..num_points {
        let t = i as f64 / (num_points - 1) as f64;
        let angle = start_angle + t * (end_angle - start_angle);
        
        let x = center.x + radius * angle.cos();
        let y = center.y + radius * angle.sin();
        points.push(Point2D::new(x, y));
    }
    
    points
}

/// Create a straight line of points for testing
fn create_straight_line(start: Point2D, end: Point2D, num_points: usize) -> Vec<Point2D> {
    let mut points = Vec::new();
    
    for i in 0..num_points {
        let t = i as f64 / (num_points - 1) as f64;
        let x = start.x + t * (end.x - start.x);
        let y = start.y + t * (end.y - start.y);
        points.push(Point2D::new(x, y));
    }
    
    points
}

/// Create a sine wave for testing
fn create_sine_wave(amplitude: f64, frequency: f64, length: f64, num_points: usize) -> Vec<Point2D> {
    let mut points = Vec::new();
    
    for i in 0..num_points {
        let x = (i as f64 / (num_points - 1) as f64) * length;
        let y = amplitude * (2.0 * PI * frequency * x / length).sin();
        points.push(Point2D::new(x, y));
    }
    
    points
}

/// Create a noisy line for robustness testing
fn create_noisy_line(start: Point2D, end: Point2D, noise_amplitude: f64, num_points: usize) -> Vec<Point2D> {
    let mut points = Vec::new();
    
    for i in 0..num_points {
        let t = i as f64 / (num_points - 1) as f64;
        let x = start.x + t * (end.x - start.x);
        let y = start.y + t * (end.y - start.y);
        
        // Add noise perpendicular to line
        let line_dx = end.x - start.x;
        let line_dy = end.y - start.y;
        let line_len = (line_dx * line_dx + line_dy * line_dy).sqrt();
        let perp_x = -line_dy / line_len;
        let perp_y = line_dx / line_len;
        
        let noise = noise_amplitude * ((i as f64 * 1.7).sin()); // Deterministic "noise"
        
        points.push(Point2D::new(x + noise * perp_x, y + noise * perp_y));
    }
    
    points
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_point2d_operations() {
        let p1 = Point2D::new(3.0, 4.0);
        let p2 = Point2D::new(0.0, 0.0);
        
        // Test distance calculation
        let dist = p1.distance_to(&p2);
        assert!((dist - 5.0).abs() < 0.001, "Distance should be 5.0, got {}", dist);
        
        // Test dot product
        let p3 = Point2D::new(1.0, 1.0);
        let dot = p1.dot(&p3);
        assert!((dot - 7.0).abs() < 0.001, "Dot product should be 7.0, got {}", dot);
    }

    #[test]
    fn test_cubic_bezier_evaluation() {
        let curve = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(1.0, 1.0),
            p2: Point2D::new(2.0, 1.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        // Test at t=0 (should be p0)
        let start = curve.evaluate(0.0);
        assert!((start.x - 0.0).abs() < 0.001 && (start.y - 0.0).abs() < 0.001);
        
        // Test at t=1 (should be p3)
        let end = curve.evaluate(1.0);
        assert!((end.x - 3.0).abs() < 0.001 && (end.y - 0.0).abs() < 0.001);
        
        // Test at t=0.5 (should be reasonable midpoint)
        let mid = curve.evaluate(0.5);
        assert!(mid.x > 1.0 && mid.x < 2.0, "Mid x should be between 1 and 2, got {}", mid.x);
        assert!(mid.y > 0.0, "Mid y should be positive, got {}", mid.y);
    }

    #[test]
    fn test_cubic_bezier_derivative() {
        let curve = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(1.0, 0.0),
            p2: Point2D::new(2.0, 0.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        // For a linear curve, derivative should be constant
        let deriv_start = curve.derivative(0.0);
        let deriv_end = curve.derivative(1.0);
        
        // Should be horizontal (dy = 0) and positive dx
        assert!(deriv_start.x > 0.0, "Derivative x should be positive");
        assert!((deriv_start.y).abs() < 0.001, "Derivative y should be near zero for horizontal line");
        
        // Linear curve should have similar derivatives at start and end
        assert!((deriv_start.x - deriv_end.x).abs() < 0.1, "Linear curve should have similar derivatives");
    }

    #[test]
    fn test_cubic_bezier_curvature() {
        // Test straight line (should have zero curvature)
        let straight = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(1.0, 0.0),
            p2: Point2D::new(2.0, 0.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        let curvature = straight.curvature(0.5);
        assert!(curvature.abs() < 0.1, "Straight line should have low curvature, got {}", curvature);
        
        // Test curved path (should have non-zero curvature)
        let curved = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(0.0, 2.0),
            p2: Point2D::new(3.0, 2.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        let curved_curvature = curved.curvature(0.5);
        assert!(curved_curvature > 0.01, "Curved path should have measurable curvature, got {}", curved_curvature);
    }

    #[test]
    fn test_fit_cubic_bezier_straight_line() {
        let points = create_straight_line(Point2D::new(0.0, 0.0), Point2D::new(10.0, 5.0), 10);
        
        let curve = fit_cubic_bezier(&points, None, None, 0.1).unwrap();
        
        // Control points should be approximately on the line
        let expected_p1 = Point2D::new(10.0/3.0, 5.0/3.0);
        let expected_p2 = Point2D::new(20.0/3.0, 10.0/3.0);
        
        assert!((curve.p1.x - expected_p1.x).abs() < 1.0, "P1 x should be near {}, got {}", expected_p1.x, curve.p1.x);
        assert!((curve.p1.y - expected_p1.y).abs() < 1.0, "P1 y should be near {}, got {}", expected_p1.y, curve.p1.y);
        
        // Endpoints should match
        assert!((curve.p0.x - points[0].x).abs() < 0.001);
        assert!((curve.p0.y - points[0].y).abs() < 0.001);
        assert!((curve.p3.x - points.last().unwrap().x).abs() < 0.001);
        assert!((curve.p3.y - points.last().unwrap().y).abs() < 0.001);
    }

    #[test]
    fn test_fit_cubic_bezier_circular_arc() {
        let arc = create_circular_arc(Point2D::new(5.0, 5.0), 3.0, 0.0, PI/2.0, 10);
        
        let curve = fit_cubic_bezier(&arc, None, None, 0.5).unwrap();
        
        // Check that fitted curve approximately follows the arc
        let mid_point = curve.evaluate(0.5);
        let expected_mid = Point2D::new(5.0 + 3.0 * (PI/4.0).cos(), 5.0 + 3.0 * (PI/4.0).sin());
        
        let error = mid_point.distance_to(&expected_mid);
        assert!(error < 1.0, "Fitted curve should approximate arc, error: {}", error);
    }

    #[test]
    fn test_fit_cubic_bezier_with_tangents() {
        let points = create_sine_wave(2.0, 1.0, 10.0, 8);
        
        let start_tangent = Some(Point2D::new(1.0, 0.0)); // Horizontal at start
        let end_tangent = Some(Point2D::new(1.0, 0.0));   // Horizontal at end
        
        let curve = fit_cubic_bezier(&points, start_tangent, end_tangent, 0.5).unwrap();
        
        // Check that tangents are respected
        let actual_start_tangent = curve.derivative(0.0);
        let actual_end_tangent = curve.derivative(1.0);
        
        // Tangent directions should be approximately correct (magnitude may differ)
        assert!(actual_start_tangent.x > 0.0, "Start tangent should point right");
        assert!(actual_start_tangent.y.abs() < actual_start_tangent.x.abs(), "Start tangent should be mostly horizontal");
        
        assert!(actual_end_tangent.x > 0.0, "End tangent should point right");
        assert!(actual_end_tangent.y.abs() < actual_end_tangent.x.abs(), "End tangent should be mostly horizontal");
    }

    #[test]
    fn test_douglas_peucker_simplification() {
        // Create a line with a small detour
        let mut points = vec![
            Point2D::new(0.0, 0.0),
            Point2D::new(1.0, 0.0),
            Point2D::new(2.0, 0.1), // Small deviation
            Point2D::new(3.0, 0.0),
            Point2D::new(4.0, 0.0),
        ];
        
        // With high epsilon, should simplify to just endpoints
        let simplified = super::douglas_peucker(&points, 1.0).unwrap();
        assert_eq!(simplified.len(), 2);
        assert_eq!(simplified[0], points[0]);
        assert_eq!(simplified[1], points[4]);
        
        // With low epsilon, should preserve the deviation
        let detailed = super::douglas_peucker(&points, 0.01).unwrap();
        assert!(detailed.len() > 2, "Should preserve detail with low epsilon");
    }

    #[test]
    fn test_corner_detection() {
        // Create a path with a sharp corner
        let points = vec![
            Point2D::new(0.0, 0.0),
            Point2D::new(1.0, 0.0),
            Point2D::new(2.0, 0.0),
            Point2D::new(2.0, 1.0), // 90-degree corner
            Point2D::new(2.0, 2.0),
        ];
        
        let corners = super::detect_corners(&points, PI/6.0); // 30-degree threshold
        
        // Should detect the corner at index 3
        assert!(corners.contains(&0), "Should include start point");
        assert!(corners.contains(&3), "Should detect 90-degree corner");
        assert!(corners.contains(&4), "Should include end point");
        assert!(corners.len() >= 3, "Should detect multiple corners");
    }

    #[test]
    fn test_two_stage_fit() {
        // Create a complex path that benefits from segmentation
        let mut points = create_straight_line(Point2D::new(0.0, 0.0), Point2D::new(5.0, 0.0), 6);
        let arc = create_circular_arc(Point2D::new(5.0, 0.0), 2.0, 0.0, PI/2.0, 6);
        let line2 = create_straight_line(Point2D::new(7.0, 0.0), Point2D::new(10.0, 0.0), 4);
        
        points.extend(arc);
        points.extend(line2);
        
        let curves = two_stage_fit(&points, 0.1, 0.3, PI/6.0).unwrap();
        
        // Should generate multiple curve segments
        assert!(curves.len() > 1, "Should segment complex path");
        assert!(curves.len() <= 4, "Shouldn't over-segment");
        
        // Each curve should be valid
        for curve in &curves {
            let start = curve.evaluate(0.0);
            let end = curve.evaluate(1.0);
            assert!(start.x.is_finite() && start.y.is_finite());
            assert!(end.x.is_finite() && end.y.is_finite());
        }
    }

    #[test]
    fn test_chord_length_parameterization() {
        let points = vec![
            Point2D::new(0.0, 0.0),
            Point2D::new(1.0, 0.0),
            Point2D::new(2.0, 0.0),
            Point2D::new(5.0, 0.0), // Longer segment
        ];
        
        let params = super::chord_length_parameterization(&points);
        
        assert_eq!(params.len(), points.len());
        assert_eq!(params[0], 0.0);
        assert_eq!(params[params.len() - 1], 1.0);
        
        // Parameters should be increasing
        for i in 1..params.len() {
            assert!(params[i] > params[i-1], "Parameters should increase");
        }
        
        // Longer segment should have larger parameter jump
        let jump1 = params[1] - params[0];
        let jump2 = params[3] - params[2];
        assert!(jump2 > jump1, "Longer segments should have larger parameter jumps");
    }

    #[test]
    fn test_perpendicular_distance() {
        let point = Point2D::new(1.0, 1.0);
        let line_start = Point2D::new(0.0, 0.0);
        let line_end = Point2D::new(2.0, 0.0);
        
        let dist = super::perpendicular_distance(&point, &line_start, &line_end);
        
        // Distance from (1,1) to line y=0 should be 1.0
        assert!((dist - 1.0).abs() < 0.001, "Perpendicular distance should be 1.0, got {}", dist);
    }

    #[test]
    fn test_create_linear_bezier() {
        let start = Point2D::new(0.0, 0.0);
        let end = Point2D::new(6.0, 4.0);
        
        let linear = super::create_linear_bezier(&start, &end);
        
        // Should be a straight line from start to end
        assert_eq!(linear.p0, start);
        assert_eq!(linear.p3, end);
        
        // Control points should be on the line
        let mid_point = linear.evaluate(0.5);
        let expected_mid = Point2D::new(3.0, 2.0);
        assert!((mid_point.x - expected_mid.x).abs() < 0.001);
        assert!((mid_point.y - expected_mid.y).abs() < 0.001);
    }

    #[test]
    fn test_curvature_limiting() {
        let mut curve = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(0.0, 10.0), // Very high control point
            p2: Point2D::new(3.0, 10.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        let original_curvature = curve.curvature(0.5);
        
        limit_curvature(&mut curve, 1.0); // Limit to reasonable curvature
        
        let limited_curvature = curve.curvature(0.5);
        
        // Curvature should be reduced
        assert!(limited_curvature <= original_curvature, 
               "Curvature should be limited: {} -> {}", original_curvature, limited_curvature);
        
        // Control points should be pulled inward
        assert!(curve.p1.y < 10.0, "Control point should be pulled down");
        assert!(curve.p2.y < 10.0, "Control point should be pulled down");
    }

    #[test]
    fn test_error_handling() {
        // Test with too few points
        let few_points = vec![Point2D::new(0.0, 0.0), Point2D::new(1.0, 1.0)];
        let result = fit_cubic_bezier(&few_points, None, None, 0.1);
        assert!(result.is_err(), "Should fail with too few points");
        
        // Test with invalid points (all same)
        let same_points = vec![Point2D::new(1.0, 1.0); 5];
        let result = fit_cubic_bezier(&same_points, None, None, 0.1);
        // Should handle gracefully (may succeed with degenerate curve)
        if result.is_ok() {
            let curve = result.unwrap();
            assert!(curve.p0.distance_to(&curve.p3) < 0.001, "Degenerate curve should have same start/end");
        }
    }

    #[test]
    fn test_tangent_estimation() {
        let points = vec![
            Point2D::new(0.0, 0.0),
            Point2D::new(1.0, 1.0),
            Point2D::new(3.0, 2.0),
            Point2D::new(6.0, 2.5),
        ];
        
        let start_tangent = super::estimate_tangent(&points, 0, true);
        let end_tangent = super::estimate_tangent(&points, 3, false);
        
        // Tangents should be normalized
        let start_len = (start_tangent.x * start_tangent.x + start_tangent.y * start_tangent.y).sqrt();
        let end_len = (end_tangent.x * end_tangent.x + end_tangent.y * end_tangent.y).sqrt();
        
        assert!((start_len - 1.0).abs() < 0.001, "Start tangent should be normalized");
        assert!((end_len - 1.0).abs() < 0.001, "End tangent should be normalized");
        
        // Start tangent should generally point in direction of curve
        assert!(start_tangent.x > 0.0, "Start tangent should point right");
        assert!(start_tangent.y > 0.0, "Start tangent should point up");
    }

    #[test]
    fn test_noisy_data_robustness() {
        let noisy_line = create_noisy_line(Point2D::new(0.0, 0.0), Point2D::new(10.0, 0.0), 0.5, 20);
        
        // Should handle noisy data without crashing
        let curve = fit_cubic_bezier(&noisy_line, None, None, 1.0);
        assert!(curve.is_ok(), "Should handle noisy data");
        
        let fitted = curve.unwrap();
        
        // Should still approximately follow the underlying line
        let start_error = fitted.p0.distance_to(&noisy_line[0]);
        let end_error = fitted.p3.distance_to(&noisy_line[noisy_line.len() - 1]);
        
        assert!(start_error < 0.001, "Start point should match exactly");
        assert!(end_error < 0.001, "End point should match exactly");
    }

    #[test]
    fn test_angle_between_vectors() {
        let v1 = Point2D::new(1.0, 0.0);
        let v2 = Point2D::new(0.0, 1.0);
        
        let angle = super::angle_between_vectors(&v1, &v2);
        
        // Should be π/2 (90 degrees)
        assert!((angle - PI/2.0).abs() < 0.001, "Angle should be π/2, got {}", angle);
        
        // Test parallel vectors
        let v3 = Point2D::new(2.0, 0.0);
        let parallel_angle = super::angle_between_vectors(&v1, &v3);
        assert!(parallel_angle.abs() < 0.001, "Parallel vectors should have zero angle");
    }

    #[test]
    fn test_complex_curve_fitting() {
        // Test with a more complex S-curve
        let mut s_curve = Vec::new();
        for i in 0..20 {
            let t = (i as f64) / 19.0;
            let x = t * 10.0;
            let y = 2.0 * (2.0 * PI * t).sin(); // S-shaped curve
            s_curve.push(Point2D::new(x, y));
        }
        
        let curves = two_stage_fit(&s_curve, 0.2, 0.5, PI/4.0).unwrap();
        
        // Should break S-curve into multiple segments
        assert!(curves.len() >= 2, "S-curve should be segmented");
        
        // Verify curves connect properly
        for i in 1..curves.len() {
            let prev_end = curves[i-1].evaluate(1.0);
            let curr_start = curves[i].evaluate(0.0);
            let gap = prev_end.distance_to(&curr_start);
            assert!(gap < 0.01, "Curves should connect smoothly, gap: {}", gap);
        }
    }

    #[test]
    fn test_mathematical_properties() {
        let curve = CubicBezier {
            p0: Point2D::new(0.0, 0.0),
            p1: Point2D::new(1.0, 2.0),
            p2: Point2D::new(2.0, 2.0),
            p3: Point2D::new(3.0, 0.0),
        };
        
        // Test convex hull property - curve should be within convex hull of control points
        let test_point = curve.evaluate(0.5);
        
        // For this curve, y-coordinate should not exceed max control point y
        assert!(test_point.y <= 2.1, "Curve should stay within reasonable bounds");
        assert!(test_point.y >= -0.1, "Curve should stay within reasonable bounds");
        
        // Test parametric properties
        for t in [0.0, 0.25, 0.5, 0.75, 1.0] {
            let point = curve.evaluate(t);
            assert!(point.x.is_finite() && point.y.is_finite(), "All points should be finite at t={}", t);
            
            let deriv = curve.derivative(t);
            assert!(deriv.x.is_finite() && deriv.y.is_finite(), "All derivatives should be finite at t={}", t);
        }
    }
}