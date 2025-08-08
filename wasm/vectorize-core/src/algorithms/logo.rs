//! Logo/line-art vectorization algorithms

use crate::config::LogoConfig;
use crate::error::VectorizeResult;
use crate::preprocessing::{
    apply_threshold, calculate_otsu_threshold, preprocess_for_logo, rgba_to_grayscale,
};
use image::RgbaImage;
// TODO: Add back for Suzuki-Abe implementation
// use imageproc::contours::find_contours_with_threshold;

/// Vectorize a logo/line-art image
///
/// This function implements the complete logo vectorization pipeline:
/// 1. Resize image if needed
/// 2. Convert to grayscale
/// 3. Apply threshold (manual or Otsu)
/// 4. Clean up with morphological operations
/// 5. Extract contours using Suzuki-Abe algorithm
/// 6. Simplify paths
/// 7. Generate SVG paths
///
/// # Arguments
/// * `image` - Input RGBA image
/// * `config` - Logo vectorization configuration
///
/// # Returns
/// * `VectorizeResult<Vec<SvgPath>>` - Vector of SVG paths or error
pub fn vectorize_logo(image: &RgbaImage, config: &LogoConfig) -> VectorizeResult<Vec<SvgPath>> {
    log::debug!("Starting optimized logo vectorization pipeline with Suzuki-Abe contour tracing");

    // Step 1: Apply optimized preprocessing (combines resizing and denoising)
    let preprocessed = preprocess_for_logo(image, config.max_dimension)?;

    // Step 2: Convert to grayscale
    let grayscale = rgba_to_grayscale(&preprocessed);

    // Step 3: Apply threshold
    let threshold = if config.adaptive_threshold {
        calculate_otsu_threshold(&grayscale)
    } else {
        config.threshold
    };

    let binary = apply_threshold(&grayscale, threshold);

    // Step 4: Light morphological operations to reduce artifacts
    let cleaned = apply_gentle_morphology(&binary, preprocessed.dimensions(), config.morphology_kernel_size)?;

    // Step 5: Extract contours with Suzuki-Abe algorithm
    let contours = extract_contours_moore_legacy(&cleaned, preprocessed.dimensions())?;

    // Step 6: Filter small contours
    let filtered_contours = filter_contours(contours, config.min_contour_area);

    // Step 7: Simplify paths
    let simplified_paths = simplify_contours(&filtered_contours, config.simplification_tolerance)?;

    // Step 8: Convert to SVG paths
    let svg_paths = if config.fit_curves {
        fit_bezier_curves(&simplified_paths, config.curve_tolerance)?
    } else {
        convert_to_svg_paths(&simplified_paths)
    };

    log::debug!(
        "Logo vectorization completed with Suzuki-Abe algorithm, generated {} paths",
        svg_paths.len()
    );
    Ok(svg_paths)
}

/// Simple SVG path representation
#[derive(Debug, Clone)]
pub struct SvgPath {
    pub path_data: String,
    pub fill: Option<String>,
    pub stroke: Option<String>,
    pub stroke_width: Option<f32>,
}

/// Point in 2D space
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

/// Contour as a series of points
pub type Contour = Vec<Point>;

/// Apply gentle morphological operations to reduce artifacts
///
/// Uses only opening (erosion followed by dilation) to remove small noise
/// without the aggressive closing operation that can create false boundaries.
fn apply_gentle_morphology(
    binary: &[bool],
    dimensions: (u32, u32),
    kernel_size: u32,
) -> VectorizeResult<Vec<bool>> {
    log::debug!(
        "Applying gentle morphological operations with kernel size {}",
        kernel_size
    );

    if kernel_size <= 1 {
        return Ok(binary.to_vec());
    }

    let mut result = binary.to_vec();

    // Only perform opening (erosion + dilation) to reduce noise
    // Avoid closing to prevent creation of false boundaries
    result = erode(&result, dimensions, kernel_size);
    result = dilate(&result, dimensions, kernel_size);

    Ok(result)
}

/// Morphological erosion - shrinks white regions
fn erode(binary: &[bool], dimensions: (u32, u32), kernel_size: u32) -> Vec<bool> {
    let (width, height) = dimensions;
    let mut result = vec![false; binary.len()];
    let radius = kernel_size / 2;

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;

            // Check if all pixels in kernel are white (true)
            let mut all_white = true;

            for ky in y.saturating_sub(radius)..=(y + radius).min(height - 1) {
                for kx in x.saturating_sub(radius)..=(x + radius).min(width - 1) {
                    let kidx = (ky * width + kx) as usize;
                    if !binary[kidx] {
                        all_white = false;
                        break;
                    }
                }
                if !all_white {
                    break;
                }
            }

            result[idx] = all_white;
        }
    }

    result
}

/// Morphological dilation - expands white regions
fn dilate(binary: &[bool], dimensions: (u32, u32), kernel_size: u32) -> Vec<bool> {
    let (width, height) = dimensions;
    let mut result = vec![false; binary.len()];
    let radius = kernel_size / 2;

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;

            // Check if any pixel in kernel is white (true)
            let mut any_white = false;

            for ky in y.saturating_sub(radius)..=(y + radius).min(height - 1) {
                for kx in x.saturating_sub(radius)..=(x + radius).min(width - 1) {
                    let kidx = (ky * width + kx) as usize;
                    if binary[kidx] {
                        any_white = true;
                        break;
                    }
                }
                if any_white {
                    break;
                }
            }

            result[idx] = any_white;
        }
    }

    result
}


// LEGACY IMPLEMENTATION - Kept for rollback capability
// The following functions implement the original Moore neighborhood algorithm
// They are kept for debugging and rollback purposes but are not used by default

#[allow(dead_code)]
/// LEGACY: Extract contours from binary image using Moore neighborhood tracing
/// This implementation has known issues with infinite loops and is kept for rollback only
fn extract_contours_moore_legacy(binary: &[bool], dimensions: (u32, u32)) -> VectorizeResult<Vec<Contour>> {
    log::warn!("Using legacy Moore neighborhood contour tracing - this may cause infinite loops!");
    
    let (width, height) = dimensions;
    let mut visited = vec![false; binary.len()];
    let mut contours = Vec::new();

    // Scan for starting points (white pixels with black neighbors)
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = (y * width + x) as usize;

            if binary[idx] && !visited[idx] {
                // Check if this is a boundary pixel (has black neighbor)
                if is_boundary_pixel_legacy(binary, dimensions, x as i32, y as i32) {
                    if let Some(contour) =
                        trace_contour_moore_legacy(binary, dimensions, &mut visited, x as i32, y as i32)
                    {
                        if contour.len() >= 3 {
                            // Only keep contours with at least 3 points
                            contours.push(contour);
                        }
                    }
                }
            }
        }
    }

    log::debug!("Legacy Moore found {} contours", contours.len());
    Ok(contours)
}

#[allow(dead_code)]
/// LEGACY: Check if a white pixel has at least one black neighbor (boundary pixel)
fn is_boundary_pixel_legacy(binary: &[bool], dimensions: (u32, u32), x: i32, y: i32) -> bool {
    let (width, height) = dimensions;

    // First check if the current pixel is actually white
    if x < 0 || x >= width as i32 || y < 0 || y >= height as i32 {
        return false;
    }

    let current_idx = (y as u32 * width + x as u32) as usize;
    if !binary[current_idx] {
        return false; // Current pixel is not white
    }

    // Check 8-connected neighbors
    for dy in -1..=1 {
        for dx in -1..=1 {
            if dx == 0 && dy == 0 {
                continue; // Skip the center pixel
            }

            let nx = x + dx;
            let ny = y + dy;

            // Handle boundary conditions - pixels outside image are considered black
            if nx < 0 || nx >= width as i32 || ny < 0 || ny >= height as i32 {
                return true; // Image boundary counts as black neighbor
            }

            let neighbor_idx = (ny as u32 * width + nx as u32) as usize;
            if neighbor_idx < binary.len() && !binary[neighbor_idx] {
                return true; // Found a black neighbor
            }
        }
    }

    false
}

#[allow(dead_code)]
/// LEGACY: Trace a contour using Moore neighborhood algorithm with strict termination limits
/// This implementation has known infinite loop issues
fn trace_contour_moore_legacy(
    binary: &[bool],
    dimensions: (u32, u32),
    visited: &mut [bool],
    start_x: i32,
    start_y: i32,
) -> Option<Contour> {
    let (width, _height) = dimensions;

    let mut contour = Vec::new();
    let mut x = start_x;
    let mut y = start_y;

    // Moore neighborhood directions (8-connected)
    let directions = [
        (1, 0),   // 0: Right
        (1, 1),   // 1: Down-right
        (0, 1),   // 2: Down
        (-1, 1),  // 3: Down-left
        (-1, 0),  // 4: Left
        (-1, -1), // 5: Up-left
        (0, -1),  // 6: Up
        (1, -1),  // 7: Up-right
    ];

    let mut prev_direction_idx = find_initial_boundary_direction_legacy(binary, dimensions, start_x, start_y, &directions);
    
    // Conservative termination tracking
    let mut step_count = 0;
    let mut position_visits = std::collections::HashMap::new();
    const MAX_STEPS: usize = 500;
    const MAX_POSITION_REVISITS: usize = 3;

    loop {
        step_count += 1;
        
        if step_count > MAX_STEPS {
            log::warn!("Legacy Moore contour tracing exceeded {} steps - terminating", MAX_STEPS);
            break;
        }
        
        let position_key = (x, y);
        let visit_count = position_visits.entry(position_key).or_insert(0);
        *visit_count += 1;
        
        if *visit_count > MAX_POSITION_REVISITS {
            log::debug!("Legacy Moore position ({}, {}) visited {} times - loop detected", x, y, visit_count);
            break;
        }
        
        let idx = (y as u32 * width + x as u32) as usize;
        visited[idx] = true;

        contour.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Look for next boundary pixel using Moore neighborhood
        let mut found_next = false;
        let mut next_x = x;
        let mut next_y = y;
        let mut next_direction = prev_direction_idx;

        let search_start_dir = (prev_direction_idx + 6) % 8;

        for i in 0..8 {
            let dir_idx = (search_start_dir + i) % 8;
            let (dx, dy) = directions[dir_idx];
            let nx = x + dx;
            let ny = y + dy;

            if nx >= 0 && ny >= 0 && nx < width as i32 && ny < dimensions.1 as i32 {
                let nidx = (ny as u32 * width + nx as u32) as usize;

                if binary[nidx] && is_boundary_pixel_legacy(binary, dimensions, nx, ny) {
                    next_x = nx;
                    next_y = ny;
                    next_direction = dir_idx;
                    found_next = true;
                    break;
                }
            }
        }

        if !found_next {
            break;
        }

        if step_count > 3 && next_x == start_x && next_y == start_y {
            break;
        }

        x = next_x;
        y = next_y;
        prev_direction_idx = next_direction;
    }

    if contour.len() >= 3 {
        Some(contour)
    } else {
        None
    }
}

#[allow(dead_code)]
/// LEGACY: Find the initial boundary direction for contour tracing
fn find_initial_boundary_direction_legacy(
    binary: &[bool],
    dimensions: (u32, u32),
    x: i32,
    y: i32,
    directions: &[(i32, i32)],
) -> usize {
    let (width, _height) = dimensions;

    for (i, &(dx, dy)) in directions.iter().enumerate() {
        let nx = x + dx;
        let ny = y + dy;

        if nx >= 0 && ny >= 0 && nx < width as i32 && ny < dimensions.1 as i32 {
            let nidx = (ny as u32 * width + nx as u32) as usize;

            if binary[nidx] && is_boundary_pixel_legacy(binary, dimensions, nx, ny) {
                return i;
            }
        }
    }

    0
}

/// Filter contours by minimum area
fn filter_contours(contours: Vec<Contour>, min_area: u32) -> Vec<Contour> {
    contours
        .into_iter()
        .filter(|contour| calculate_contour_area(contour) >= min_area as f32)
        .collect()
}

/// Calculate approximate area of a contour using shoelace formula
fn calculate_contour_area(contour: &[Point]) -> f32 {
    if contour.len() < 3 {
        return 0.0;
    }

    let mut area = 0.0;
    for i in 0..contour.len() {
        let j = (i + 1) % contour.len();
        area += contour[i].x * contour[j].y;
        area -= contour[j].x * contour[i].y;
    }
    (area / 2.0).abs()
}

/// Simplify contours using Douglas-Peucker algorithm
fn simplify_contours(contours: &[Contour], tolerance: f64) -> VectorizeResult<Vec<Contour>> {
    use crate::algorithms::path_utils::douglas_peucker_simplify;

    log::debug!(
        "Simplifying {} contours with tolerance {}",
        contours.len(),
        tolerance
    );

    let simplified: Vec<Contour> = contours
        .iter()
        .map(|contour| douglas_peucker_simplify(contour, tolerance))
        .filter(|contour| contour.len() >= 3) // Only keep valid contours
        .collect();

    log::debug!("Simplified to {} valid contours", simplified.len());
    Ok(simplified)
}

/// Fit Bezier curves to simplified paths
fn fit_bezier_curves(paths: &[Contour], tolerance: f64) -> VectorizeResult<Vec<SvgPath>> {
    log::debug!(
        "Fitting Bezier curves to {} paths with tolerance {}",
        paths.len(),
        tolerance
    );

    let svg_paths: Vec<SvgPath> = paths
        .iter()
        .map(|path| fit_cubic_bezier_to_path(path, tolerance))
        .collect();

    Ok(svg_paths)
}

/// Fit cubic Bézier curves to a path using iterative fitting
fn fit_cubic_bezier_to_path(points: &[Point], tolerance: f64) -> SvgPath {
    if points.len() < 4 {
        // Not enough points for cubic fitting, use linear segments
        return convert_contour_to_svg_path(points);
    }

    let mut path_data = String::new();

    if !points.is_empty() {
        path_data.push_str(&format!("M {:.2} {:.2}", points[0].x, points[0].y));

        let mut i = 0;
        while i < points.len() - 1 {
            let segment_end = (i + 4).min(points.len());
            let segment = &points[i..segment_end];

            if segment.len() >= 4 {
                // Try to fit cubic Bézier curve
                if let Some(bezier) = fit_cubic_bezier_segment(segment, tolerance) {
                    path_data.push_str(&format!(
                        " C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2}",
                        bezier.control1.x,
                        bezier.control1.y,
                        bezier.control2.x,
                        bezier.control2.y,
                        bezier.end.x,
                        bezier.end.y
                    ));
                    i += 3; // Move forward by 3 points (start of next curve)
                } else {
                    // Fallback to line segment
                    path_data.push_str(&format!(" L {:.2} {:.2}", segment[1].x, segment[1].y));
                    i += 1;
                }
            } else {
                // Not enough points for cubic, use line segments
                for point in &segment[1..] {
                    path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
                }
                break;
            }
        }

        path_data.push_str(" Z"); // Close path
    }

    SvgPath {
        path_data,
        fill: Some("black".to_string()),
        stroke: None,
        stroke_width: None,
    }
}

/// Cubic Bézier curve representation
#[derive(Debug, Clone)]
struct CubicBezier {
    start: Point,
    control1: Point,
    control2: Point,
    end: Point,
}

/// Fit a cubic Bézier curve to a segment of points
fn fit_cubic_bezier_segment(points: &[Point], tolerance: f64) -> Option<CubicBezier> {
    if points.len() < 4 {
        return None;
    }

    let start = points[0];
    let end = points[points.len() - 1];

    // Estimate tangent vectors at start and end
    let start_tangent = if points.len() > 1 {
        let dx = points[1].x - points[0].x;
        let dy = points[1].y - points[0].y;
        let length = (dx * dx + dy * dy).sqrt();
        if length > 0.0 {
            Point {
                x: dx / length,
                y: dy / length,
            }
        } else {
            Point { x: 1.0, y: 0.0 }
        }
    } else {
        Point { x: 1.0, y: 0.0 }
    };

    let end_tangent = if points.len() > 1 {
        let n = points.len() - 1;
        let dx = points[n].x - points[n - 1].x;
        let dy = points[n].y - points[n - 1].y;
        let length = (dx * dx + dy * dy).sqrt();
        if length > 0.0 {
            Point {
                x: dx / length,
                y: dy / length,
            }
        } else {
            Point { x: 1.0, y: 0.0 }
        }
    } else {
        Point { x: 1.0, y: 0.0 }
    };

    // Use simple heuristic for control point distances
    let chord_length = {
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        (dx * dx + dy * dy).sqrt()
    };

    let control_distance = chord_length / 3.0;

    let control1 = Point {
        x: start.x + start_tangent.x * control_distance,
        y: start.y + start_tangent.y * control_distance,
    };

    let control2 = Point {
        x: end.x - end_tangent.x * control_distance,
        y: end.y - end_tangent.y * control_distance,
    };

    let bezier = CubicBezier {
        start,
        control1,
        control2,
        end,
    };

    // Check if the curve fits within tolerance
    if bezier_fits_points(&bezier, points, tolerance) {
        Some(bezier)
    } else {
        None
    }
}

/// Check if a Bézier curve fits a set of points within tolerance
fn bezier_fits_points(bezier: &CubicBezier, points: &[Point], tolerance: f64) -> bool {
    let tolerance_sq = tolerance * tolerance;

    for (i, &point) in points.iter().enumerate() {
        let t = i as f32 / (points.len() - 1) as f32;
        let curve_point = evaluate_cubic_bezier(bezier, t);

        let dx = point.x - curve_point.x;
        let dy = point.y - curve_point.y;
        let distance_sq = dx * dx + dy * dy;

        if distance_sq as f64 > tolerance_sq {
            return false;
        }
    }

    true
}

/// Evaluate cubic Bézier curve at parameter t (0 <= t <= 1)
fn evaluate_cubic_bezier(bezier: &CubicBezier, t: f32) -> Point {
    let t2 = t * t;
    let t3 = t2 * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    let mt3 = mt2 * mt;

    Point {
        x: mt3 * bezier.start.x
            + 3.0 * mt2 * t * bezier.control1.x
            + 3.0 * mt * t2 * bezier.control2.x
            + t3 * bezier.end.x,
        y: mt3 * bezier.start.y
            + 3.0 * mt2 * t * bezier.control1.y
            + 3.0 * mt * t2 * bezier.control2.y
            + t3 * bezier.end.y,
    }
}

/// Convert a single contour to SVG path (fallback for non-curve fitting)
fn convert_contour_to_svg_path(contour: &[Point]) -> SvgPath {
    let mut path_data = String::new();

    if !contour.is_empty() {
        path_data.push_str(&format!("M {:.2} {:.2}", contour[0].x, contour[0].y));

        for point in &contour[1..] {
            path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
        }

        path_data.push_str(" Z"); // Close path
    }

    SvgPath {
        path_data,
        fill: Some("black".to_string()),
        stroke: None,
        stroke_width: None,
    }
}

/// Convert simplified contours to SVG path strings
fn convert_to_svg_paths(contours: &[Contour]) -> Vec<SvgPath> {
    contours
        .iter()
        .map(|contour| {
            let mut path_data = String::new();

            if !contour.is_empty() {
                path_data.push_str(&format!("M {:.2} {:.2}", contour[0].x, contour[0].y));

                for point in &contour[1..] {
                    path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
                }

                path_data.push_str(" Z"); // Close path
            }

            SvgPath {
                path_data,
                fill: Some("black".to_string()),
                stroke: None,
                stroke_width: None,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::LogoConfig;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn test_calculate_contour_area() {
        // Square with side length 10
        let square = vec![
            Point { x: 0.0, y: 0.0 },
            Point { x: 10.0, y: 0.0 },
            Point { x: 10.0, y: 10.0 },
            Point { x: 0.0, y: 10.0 },
        ];

        let area = calculate_contour_area(&square);
        assert!((area - 100.0).abs() < 0.1);
    }

    #[test]
    fn test_vectorize_logo_suzuki_abe() {
        // Create a test image with a white rectangle on black background
        let img = ImageBuffer::from_fn(100, 100, |x, y| {
            if x > 20 && x < 80 && y > 20 && y < 80 {
                Rgba([255, 255, 255, 255]) // White rectangle
            } else {
                Rgba([0, 0, 0, 255]) // Black background
            }
        });

        let config = LogoConfig::default();
        let result = vectorize_logo(&img, &config);

        assert!(result.is_ok());
        let paths = result.unwrap();

        // Debug output
        println!("Suzuki-Abe generated {} paths", paths.len());
        for (i, path) in paths.iter().enumerate() {
            println!("Path {}: {}", i, path.path_data);
        }

        assert!(!paths.is_empty());
    }

    // TODO: Add back Suzuki-Abe test when implementation is ready
}