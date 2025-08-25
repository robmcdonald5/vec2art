//! Path simplification strategies for centerline extraction

use super::SimplificationStrategy;
use crate::algorithms::Point;
use crate::error::VectorizeError;
use crate::TraceLowConfig;

/// Adaptive Douglas-Peucker with curvature awareness (research recommended)
#[derive(Debug, Default)]
pub struct CurvatureAwareSimplification {
    pub base_epsilon_multiplier: f32,
    pub curvature_sensitivity: f32,
}

impl CurvatureAwareSimplification {
    pub fn new(base_epsilon_multiplier: f32, curvature_sensitivity: f32) -> Self {
        Self {
            base_epsilon_multiplier,
            curvature_sensitivity,
        }
    }
}

impl SimplificationStrategy for CurvatureAwareSimplification {
    fn simplify_paths(
        &self,
        paths: Vec<Vec<Point>>,
        base_epsilon: f32,
        _config: &TraceLowConfig,
    ) -> Result<Vec<Vec<Point>>, VectorizeError> {
        let multiplier = if self.base_epsilon_multiplier > 0.0 {
            self.base_epsilon_multiplier
        } else {
            1.0
        };
        let sensitivity = if self.curvature_sensitivity > 0.0 {
            self.curvature_sensitivity
        } else {
            0.6
        };

        let simplified = paths
            .into_iter()
            .map(|path| {
                curvature_aware_douglas_peucker(&path, base_epsilon * multiplier, sensitivity)
            })
            .filter(|path| path.len() >= 2)
            .collect();

        Ok(simplified)
    }

    fn name(&self) -> &'static str {
        "CurvatureAware"
    }
}

/// Standard Douglas-Peucker simplification (current implementation)
#[derive(Debug, Default)]
pub struct AdaptiveSimplification {
    pub epsilon_multiplier: f32,
}

impl AdaptiveSimplification {
    pub fn new(epsilon_multiplier: f32) -> Self {
        Self { epsilon_multiplier }
    }
}

impl SimplificationStrategy for AdaptiveSimplification {
    fn simplify_paths(
        &self,
        paths: Vec<Vec<Point>>,
        base_epsilon: f32,
        _config: &TraceLowConfig,
    ) -> Result<Vec<Vec<Point>>, VectorizeError> {
        let epsilon = if self.epsilon_multiplier > 0.0 {
            base_epsilon * self.epsilon_multiplier
        } else {
            base_epsilon
        };

        let simplified = paths
            .into_iter()
            .map(|path| douglas_peucker_simplify(&path, epsilon))
            .filter(|path| path.len() >= 2)
            .collect();

        Ok(simplified)
    }

    fn name(&self) -> &'static str {
        "Adaptive"
    }
}

/// Minimal simplification (preserves most detail)
#[derive(Debug, Default)]
pub struct MinimalSimplification;

impl SimplificationStrategy for MinimalSimplification {
    fn simplify_paths(
        &self,
        paths: Vec<Vec<Point>>,
        base_epsilon: f32,
        _config: &TraceLowConfig,
    ) -> Result<Vec<Vec<Point>>, VectorizeError> {
        let minimal_epsilon = base_epsilon * 0.3; // Use much smaller epsilon

        let simplified = paths
            .into_iter()
            .map(|path| douglas_peucker_simplify(&path, minimal_epsilon))
            .filter(|path| path.len() >= 2)
            .collect();

        Ok(simplified)
    }

    fn name(&self) -> &'static str {
        "Minimal"
    }
}

/// High-performance simplification with larger epsilon
#[derive(Debug, Default)]
pub struct AggressiveSimplification;

impl SimplificationStrategy for AggressiveSimplification {
    fn simplify_paths(
        &self,
        paths: Vec<Vec<Point>>,
        base_epsilon: f32,
        _config: &TraceLowConfig,
    ) -> Result<Vec<Vec<Point>>, VectorizeError> {
        let aggressive_epsilon = base_epsilon * 2.0; // Use much larger epsilon

        let simplified = paths
            .into_iter()
            .map(|path| douglas_peucker_simplify(&path, aggressive_epsilon))
            .filter(|path| path.len() >= 2)
            .collect();

        Ok(simplified)
    }

    fn name(&self) -> &'static str {
        "Aggressive"
    }
}

// Implementation functions

fn curvature_aware_douglas_peucker(
    path: &[Point],
    base_epsilon: f32,
    curvature_sensitivity: f32,
) -> Vec<Point> {
    if path.len() <= 2 {
        return path.to_vec();
    }

    // Compute curvature at each point
    let curvatures = compute_local_curvatures(path);
    let max_curvature = curvatures.iter().cloned().fold(0.0f32, f32::max).max(1e-6);

    // Normalize curvatures
    let normalized_curvatures: Vec<f32> = curvatures.iter().map(|&c| c / max_curvature).collect();

    // Recursive simplification with adaptive epsilon
    let mut result = Vec::new();
    result.push(path[0]);

    curvature_aware_dp_recursive(
        path,
        &normalized_curvatures,
        0,
        path.len() - 1,
        base_epsilon,
        curvature_sensitivity,
        &mut result,
    );

    result.push(path[path.len() - 1]);
    result
}

fn curvature_aware_dp_recursive(
    path: &[Point],
    curvatures: &[f32],
    start: usize,
    end: usize,
    base_epsilon: f32,
    curvature_sensitivity: f32,
    result: &mut Vec<Point>,
) {
    if end <= start + 1 {
        return;
    }

    let start_point = &path[start];
    let end_point = &path[end];

    // Calculate line equation coefficients for perpendicular distance
    let dx = end_point.x - start_point.x;
    let dy = end_point.y - start_point.y;
    let line_length = (dx * dx + dy * dy).sqrt().max(1e-6);

    let mut max_distance = -1.0;
    let mut max_index = start;

    // Find point with maximum weighted distance
    for i in (start + 1)..end {
        let point = &path[i];

        // Calculate perpendicular distance to line
        let distance =
            ((point.x - start_point.x) * dy - (point.y - start_point.y) * dx).abs() / line_length;

        // Apply curvature-based epsilon adjustment
        let curvature_factor = 1.0 - curvature_sensitivity * curvatures[i];
        let adjusted_epsilon = base_epsilon * curvature_factor.clamp(0.2, 1.0);

        // Weight distance by inverse curvature (keep high curvature points)
        let weighted_distance = distance / adjusted_epsilon;

        if weighted_distance > max_distance && distance > adjusted_epsilon {
            max_distance = weighted_distance;
            max_index = i;
        }
    }

    // If a significant point was found, recursively process segments
    if max_distance > 1.0 {
        curvature_aware_dp_recursive(
            path,
            curvatures,
            start,
            max_index,
            base_epsilon,
            curvature_sensitivity,
            result,
        );
        result.push(path[max_index]);
        curvature_aware_dp_recursive(
            path,
            curvatures,
            max_index,
            end,
            base_epsilon,
            curvature_sensitivity,
            result,
        );
    }
}

fn compute_local_curvatures(path: &[Point]) -> Vec<f32> {
    let mut curvatures = vec![0.0f32; path.len()];

    // Use a window to compute curvature at each point
    let window_size = 3;

    for i in window_size..path.len().saturating_sub(window_size) {
        let p1 = &path[i - window_size];
        let p2 = &path[i];
        let p3 = &path[i + window_size];

        curvatures[i] = compute_curvature_at_point(p1, p2, p3);
    }

    // Fill in edges with nearby values
    for i in 0..window_size {
        curvatures[i] = curvatures[window_size];
    }
    for i in path.len().saturating_sub(window_size)..path.len() {
        curvatures[i] = curvatures[path.len().saturating_sub(window_size + 1)];
    }

    curvatures
}

fn compute_curvature_at_point(p1: &Point, p2: &Point, p3: &Point) -> f32 {
    // Calculate vectors
    let v1 = (p2.x - p1.x, p2.y - p1.y);
    let v2 = (p3.x - p2.x, p3.y - p2.y);

    // Calculate lengths
    let len1 = (v1.0 * v1.0 + v1.1 * v1.1).sqrt().max(1e-6);
    let len2 = (v2.0 * v2.0 + v2.1 * v2.1).sqrt().max(1e-6);

    // Normalize vectors
    let n1 = (v1.0 / len1, v1.1 / len1);
    let n2 = (v2.0 / len2, v2.1 / len2);

    // Calculate angle between vectors using dot product
    let dot_product = n1.0 * n2.0 + n1.1 * n2.1;
    let angle = dot_product.clamp(-1.0, 1.0).acos();

    // Curvature is angle change per unit length
    let avg_length = (len1 + len2) / 2.0;
    angle / avg_length.max(1e-6)
}

fn douglas_peucker_simplify(path: &[Point], epsilon: f32) -> Vec<Point> {
    if path.len() <= 2 {
        return path.to_vec();
    }

    let mut result = Vec::new();
    result.push(path[0]);

    dp_recursive(path, 0, path.len() - 1, epsilon, &mut result);

    result.push(path[path.len() - 1]);
    result
}

fn dp_recursive(path: &[Point], start: usize, end: usize, epsilon: f32, result: &mut Vec<Point>) {
    if end <= start + 1 {
        return;
    }

    let start_point = &path[start];
    let end_point = &path[end];

    // Calculate line equation coefficients for perpendicular distance
    let dx = end_point.x - start_point.x;
    let dy = end_point.y - start_point.y;
    let line_length = (dx * dx + dy * dy).sqrt().max(1e-6);

    let mut max_distance = 0.0;
    let mut max_index = start;

    // Find point with maximum distance from line
    for i in (start + 1)..end {
        let point = &path[i];
        let distance =
            ((point.x - start_point.x) * dy - (point.y - start_point.y) * dx).abs() / line_length;

        if distance > max_distance {
            max_distance = distance;
            max_index = i;
        }
    }

    // If the maximum distance is greater than epsilon, recursively simplify
    if max_distance > epsilon {
        dp_recursive(path, start, max_index, epsilon, result);
        result.push(path[max_index]);
        dp_recursive(path, max_index, end, epsilon, result);
    }
}
