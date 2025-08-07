use crate::algorithms::{edge_detector, utils, ConversionAlgorithm, SvgPath};
use crate::error::{Result, Vec2ArtError};
use crate::svg_builder::{rgb_to_hex, SvgBuilder};
use crate::{memory_monitor, ConversionParameters, EdgeMethod, ShapeType};
use image::{DynamicImage, GenericImageView, Rgb};
use log::info;

pub struct GeometricFitter;

// Memory optimization constants
const CHUNK_SIZE: usize = 10; // Process 10 contours at a time
const MAX_MEMORY_BUDGET_SHAPES: usize = 50; // Conservative limit
const INITIAL_POINT_BUFFER_CAPACITY: usize = 1024;
const INITIAL_COLOR_BUFFER_CAPACITY: usize = 121; // 11x11 sampling area

/// Reusable workspace for shape fitting operations to reduce memory allocations
struct ShapeFittingWorkspace {
    point_buffer: Vec<(f32, f32)>,
    distance_buffer: Vec<f32>,
    color_buffer: Vec<Rgb<u8>>,
    good_points_buffer: Vec<(f32, f32)>,
    sorted_distances_buffer: Vec<f32>,
}

impl ShapeFittingWorkspace {
    fn new() -> Self {
        Self {
            point_buffer: Vec::with_capacity(INITIAL_POINT_BUFFER_CAPACITY),
            distance_buffer: Vec::with_capacity(INITIAL_POINT_BUFFER_CAPACITY),
            color_buffer: Vec::with_capacity(INITIAL_COLOR_BUFFER_CAPACITY),
            good_points_buffer: Vec::with_capacity(INITIAL_POINT_BUFFER_CAPACITY),
            sorted_distances_buffer: Vec::with_capacity(INITIAL_POINT_BUFFER_CAPACITY),
        }
    }

    fn clear_all_buffers(&mut self) {
        self.point_buffer.clear();
        self.distance_buffer.clear();
        self.color_buffer.clear();
        self.good_points_buffer.clear();
        self.sorted_distances_buffer.clear();
    }

    fn ensure_capacity(&mut self, points_len: usize, colors_len: usize) {
        if self.distance_buffer.capacity() < points_len {
            self.distance_buffer
                .reserve(points_len - self.distance_buffer.capacity());
        }
        if self.good_points_buffer.capacity() < points_len {
            self.good_points_buffer
                .reserve(points_len - self.good_points_buffer.capacity());
        }
        if self.sorted_distances_buffer.capacity() < points_len {
            self.sorted_distances_buffer
                .reserve(points_len - self.sorted_distances_buffer.capacity());
        }
        if self.color_buffer.capacity() < colors_len {
            self.color_buffer
                .reserve(colors_len - self.color_buffer.capacity());
        }
    }
}

impl ConversionAlgorithm for GeometricFitter {
    fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        // Use parallel implementation if available
        #[cfg(feature = "parallel")]
        {
            let capabilities = crate::performance::get_capabilities();
            if capabilities.can_use_parallel_processing() {
                return crate::performance::parallel_geometric_fitter::ParallelGeometricFitter::convert_optimized(image, params);
            }
        }

        match params {
            ConversionParameters::GeometricFitter {
                shape_types,
                max_shapes,
                population_size: _, // No longer used
                generations: _,     // No longer used
                mutation_rate: _,   // No longer used
                target_fitness: _,  // No longer used
            } => {
                info!(
                    "Starting edge-guided geometric fitting with shape types: {:?}",
                    shape_types
                );

                let (width, height) = (image.width(), image.height());

                // Check memory for geometric fitting workspace
                let workspace_memory = std::mem::size_of::<ShapeFittingWorkspace>()
                    + (INITIAL_POINT_BUFFER_CAPACITY * 2 * std::mem::size_of::<f32>())
                    + (INITIAL_COLOR_BUFFER_CAPACITY * 3); // RGB
                memory_monitor::check_memory_for_operation(
                    workspace_memory,
                    "workspace_allocation",
                    "geometric_fitter",
                )?;

                // Step 1: Run edge detection first to get contours
                info!("Step 1: Detecting edges to guide geometric fitting");
                let edge_params = ConversionParameters::EdgeDetector {
                    method: EdgeMethod::Canny,
                    threshold_low: 50.0,
                    threshold_high: 150.0,
                    gaussian_sigma: 1.0,
                    simplification: 1.0, // Less simplification for better shape detection
                    min_path_length: 20, // Only process substantial contours
                };

                // Get contours from edge detection using the actual algorithm
                let contours = extract_real_contours_from_image(&image, edge_params)?;
                info!(
                    "Extracted {} real contours from edge detection",
                    contours.len()
                );

                // Step 2: Analyze contours and fit geometric shapes
                info!("Step 2: Analyzing contours for geometric shapes");
                let detected_shapes =
                    analyze_and_fit_shapes(&contours, &shape_types, max_shapes as usize, &image);
                info!(
                    "Detected {} geometric shapes from contours",
                    detected_shapes.len()
                );

                // Step 3: Generate SVG from detected shapes
                let svg = generate_svg_from_detected_shapes(&detected_shapes, width, height);

                info!(
                    "Edge-guided geometric fitting complete with {} shapes",
                    detected_shapes.len()
                );
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "GeometricFitter requires GeometricFitter parameters".to_string(),
            )),
        }
    }

    fn description() -> &'static str {
        "Detects geometric shapes from edge contours using shape fitting algorithms"
    }

    fn estimate_time(_width: u32, _height: u32) -> u32 {
        // Much faster than genetic algorithm: ~200ms for edge detection + shape fitting
        200
    }
}

/// Detected geometric shape from edge analysis
#[derive(Clone, Debug)]
pub struct DetectedShape {
    shape_type: ShapeType,
    center: (f32, f32),
    size1: f32,    // radius for circle, width for rectangle
    size2: f32,    // unused for circle, height for rectangle
    #[allow(dead_code)]
    rotation: f32, // Used for rectangles and ellipses orientation
    color: Rgb<u8>,
    confidence: f32, // How well the shape fits the contour (0.0-1.0)
}

/// Extract real contours from edge detection
fn extract_real_contours_from_image(
    image: &DynamicImage,
    edge_params: ConversionParameters,
) -> Result<Vec<SvgPath>> {
    // Convert to grayscale
    let gray = utils::to_grayscale(image);

    // Apply Canny edge detection with the specified parameters
    let edges = if let ConversionParameters::EdgeDetector {
        method: EdgeMethod::Canny,
        threshold_low,
        threshold_high,
        gaussian_sigma,
        min_path_length,
        ..
    } = edge_params
    {
        let canny_edges = edge_detector::canny_edge_detection(
            &gray,
            gaussian_sigma,
            threshold_low,
            threshold_high,
        )?;
        edge_detector::trace_contours(&canny_edges, min_path_length)
    } else {
        return Err(Vec2ArtError::InvalidParameters(
            "Expected Canny edge detection parameters".to_string(),
        ));
    };

    // Convert contours to SvgPath objects
    Ok(edges
        .into_iter()
        .map(|points| {
            let mut path = SvgPath::new();
            path.points = points;
            path
        })
        .collect())
}

/// Analyze contours and fit geometric shapes to them using memory-optimized chunked processing
fn analyze_and_fit_shapes(
    contours: &[SvgPath],
    allowed_shapes: &[ShapeType],
    max_shapes: usize,
    original_image: &DynamicImage,
) -> Vec<DetectedShape> {
    let mut detected_shapes = Vec::with_capacity(max_shapes.min(MAX_MEMORY_BUDGET_SHAPES));
    let mut workspace = ShapeFittingWorkspace::new();

    // Apply conservative memory budget
    let effective_max_shapes = max_shapes.min(MAX_MEMORY_BUDGET_SHAPES);
    let total_contours = contours.len().min(effective_max_shapes * 2); // Don't process more contours than needed

    // Process contours in chunks to reduce peak memory usage
    let mut processed_shapes = 0;
    for chunk_start in (0..total_contours).step_by(CHUNK_SIZE) {
        let chunk_end = (chunk_start + CHUNK_SIZE).min(total_contours);
        let chunk = &contours[chunk_start..chunk_end];

        // Process this chunk of contours
        for contour in chunk {
            if processed_shapes >= effective_max_shapes {
                break; // Early termination when budget reached
            }

            if contour.points.len() < 4 {
                continue; // Too few points to analyze
            }

            // Clear workspace buffers for reuse
            workspace.clear_all_buffers();

            // Try to fit different shape types and pick the best fit
            let mut best_fit: Option<DetectedShape> = None;

            for shape_type in allowed_shapes {
                if let Some(mut shape) =
                    fit_shape_to_contour_with_workspace(contour, *shape_type, &mut workspace)
                {
                    // Extract color from the original image at the shape location (lazy extraction)
                    shape.color = extract_dominant_color_from_shape_with_workspace(
                        original_image,
                        &shape,
                        &mut workspace,
                    );

                    if best_fit.is_none()
                        || shape.confidence > best_fit.as_ref().unwrap().confidence
                    {
                        best_fit = Some(shape);
                    }
                }
            }

            if let Some(shape) = best_fit {
                // Only accept shapes with reasonable confidence
                if shape.confidence > 0.3 {
                    detected_shapes.push(shape);
                    processed_shapes += 1;
                }
            }
        }

        if processed_shapes >= effective_max_shapes {
            break; // Stop processing more chunks
        }
    }

    // Sort by confidence and ensure we don't exceed memory budget
    detected_shapes.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
    detected_shapes.truncate(effective_max_shapes);

    detected_shapes
}

/// Fit a specific geometric shape to a contour using workspace buffers
fn fit_shape_to_contour_with_workspace(
    contour: &SvgPath,
    shape_type: ShapeType,
    workspace: &mut ShapeFittingWorkspace,
) -> Option<DetectedShape> {
    let points = &contour.points;
    if points.is_empty() {
        return None;
    }

    match shape_type {
        ShapeType::Circle => fit_circle_to_contour_with_workspace(points, workspace),
        ShapeType::Rectangle => fit_rectangle_to_contour(points), // No workspace needed for rectangles
        ShapeType::Ellipse => fit_ellipse_to_contour(points), // No workspace needed for ellipses
        ShapeType::Triangle => fit_triangle_to_contour(points), // No workspace needed for triangles
    }
}

/// Fit a circle to a contour using workspace buffers for memory optimization
fn fit_circle_to_contour_with_workspace(
    points: &[(f32, f32)],
    workspace: &mut ShapeFittingWorkspace,
) -> Option<DetectedShape> {
    if points.len() < 3 {
        return None;
    }

    // Use iterative circle fitting with workspace buffers
    let (center, radius, confidence) = fit_circle_robust_with_workspace(points, workspace);

    Some(DetectedShape {
        shape_type: ShapeType::Circle,
        center,
        size1: radius,
        size2: radius, // Unused for circle
        rotation: 0.0,
        color: Rgb([0, 0, 0]), // Default to black
        confidence,
    })
}

/// Robust circle fitting with outlier detection using workspace buffers
fn fit_circle_robust_with_workspace(
    points: &[(f32, f32)],
    workspace: &mut ShapeFittingWorkspace,
) -> ((f32, f32), f32, f32) {
    // Ensure workspace has sufficient capacity
    workspace.ensure_capacity(points.len(), 0);

    // Start with centroid-based estimation
    let initial_center = calculate_centroid(points);
    let mut center = initial_center;
    let mut radius = 0.0;

    // Iterative improvement using workspace buffers
    for _ in 0..5 {
        // Reuse distance buffer
        workspace.distance_buffer.clear();
        workspace.distance_buffer.extend(
            points
                .iter()
                .map(|(x, y)| ((x - center.0).powi(2) + (y - center.1).powi(2)).sqrt()),
        );

        // Use median instead of mean to be robust against outliers
        workspace.sorted_distances_buffer.clear();
        workspace
            .sorted_distances_buffer
            .extend_from_slice(&workspace.distance_buffer);
        workspace
            .sorted_distances_buffer
            .sort_by(|a, b| a.partial_cmp(b).unwrap());
        radius = workspace.sorted_distances_buffer[workspace.sorted_distances_buffer.len() / 2];

        // Update center using points close to the current radius
        let threshold = radius * 0.3; // 30% tolerance
        workspace.good_points_buffer.clear();

        for (i, &distance) in workspace.distance_buffer.iter().enumerate() {
            if (distance - radius).abs() < threshold {
                workspace.good_points_buffer.push(points[i]);
            }
        }

        if !workspace.good_points_buffer.is_empty() {
            center = calculate_centroid(&workspace.good_points_buffer);
        }
    }

    // Calculate final confidence (reuse distance buffer one more time)
    workspace.distance_buffer.clear();
    workspace.distance_buffer.extend(
        points
            .iter()
            .map(|(x, y)| ((x - center.0).powi(2) + (y - center.1).powi(2)).sqrt()),
    );

    let mut inliers = 0;
    let tolerance = radius * 0.2; // 20% tolerance for final confidence

    for &distance in &workspace.distance_buffer {
        if (distance - radius).abs() < tolerance {
            inliers += 1;
        }
    }

    let confidence = (inliers as f32 / points.len() as f32).min(1.0);

    (center, radius, confidence)
}

/// Calculate the centroid of a set of points
fn calculate_centroid(points: &[(f32, f32)]) -> (f32, f32) {
    let sum_x: f32 = points.iter().map(|(x, _)| x).sum();
    let sum_y: f32 = points.iter().map(|(_, y)| y).sum();
    let count = points.len() as f32;
    (sum_x / count, sum_y / count)
}

/// Extract dominant color from a shape region using workspace buffer to avoid allocation
fn extract_dominant_color_from_shape_with_workspace(
    image: &DynamicImage,
    shape: &DetectedShape,
    workspace: &mut ShapeFittingWorkspace,
) -> Rgb<u8> {
    let rgb_image = image.to_rgb8();
    let (img_width, img_height) = image.dimensions();

    let sample_radius = 5; // Sample points within 5 pixels of the center
    let expected_samples = (sample_radius * 2 + 1) * (sample_radius * 2 + 1);
    workspace.ensure_capacity(0, expected_samples);

    // Clear and reuse color buffer
    workspace.color_buffer.clear();

    // Sample colors around the shape center
    let (cx, cy) = shape.center;
    let cx = cx as u32;
    let cy = cy as u32;

    for dy in -(sample_radius as i32)..=(sample_radius as i32) {
        for dx in -(sample_radius as i32)..=(sample_radius as i32) {
            let x = (cx as i32 + dx).clamp(0, img_width as i32 - 1) as u32;
            let y = (cy as i32 + dy).clamp(0, img_height as i32 - 1) as u32;

            let pixel = rgb_image.get_pixel(x, y);
            workspace.color_buffer.push(*pixel);
        }
    }

    // Find the most common color (simple approach)
    if workspace.color_buffer.is_empty() {
        return Rgb([0, 0, 0]); // Default to black
    }

    // For now, use the average color - could be improved with k-means clustering
    let mut r_sum = 0u32;
    let mut g_sum = 0u32;
    let mut b_sum = 0u32;

    for color in &workspace.color_buffer {
        r_sum += color[0] as u32;
        g_sum += color[1] as u32;
        b_sum += color[2] as u32;
    }

    let count = workspace.color_buffer.len() as u32;
    Rgb([
        (r_sum / count) as u8,
        (g_sum / count) as u8,
        (b_sum / count) as u8,
    ])
}

/// Calculate the rotation angle of a set of points using PCA
fn calculate_rotation_angle(points: &[(f32, f32)]) -> f32 {
    if points.len() < 2 {
        return 0.0;
    }

    let centroid = calculate_centroid(points);

    // Calculate covariance matrix elements
    let mut cov_xx = 0.0;
    let mut cov_xy = 0.0;
    let mut cov_yy = 0.0;

    for &(x, y) in points {
        let dx = x - centroid.0;
        let dy = y - centroid.1;

        cov_xx += dx * dx;
        cov_xy += dx * dy;
        cov_yy += dy * dy;
    }

    let count = points.len() as f32;
    cov_xx /= count;
    cov_xy /= count;
    cov_yy /= count;

    // Calculate the angle of the principal component
    // Eigenvalue equation for 2x2 matrix: tan(2θ) = 2*cov_xy / (cov_xx - cov_yy)
    if (cov_xx - cov_yy).abs() < 1e-6 {
        // Matrix is nearly circular
        0.0
    } else {
        0.5 * (2.0 * cov_xy / (cov_xx - cov_yy)).atan()
    }
}

/// Fit a rectangle to a contour by finding bounding box and checking regularity
fn fit_rectangle_to_contour(points: &[(f32, f32)]) -> Option<DetectedShape> {
    if points.len() < 4 {
        return None;
    }

    // Find bounding box
    let min_x = points.iter().map(|(x, _)| *x).fold(f32::INFINITY, f32::min);
    let max_x = points
        .iter()
        .map(|(x, _)| *x)
        .fold(f32::NEG_INFINITY, f32::max);
    let min_y = points.iter().map(|(_, y)| *y).fold(f32::INFINITY, f32::min);
    let max_y = points
        .iter()
        .map(|(_, y)| *y)
        .fold(f32::NEG_INFINITY, f32::max);

    let width = max_x - min_x;
    let height = max_y - min_y;
    let center = ((min_x + max_x) / 2.0, (min_y + max_y) / 2.0);

    // Check how well points align with rectangle edges
    let mut edge_points = 0;
    let tolerance = 5.0; // pixels

    for &(x, y) in points {
        let near_left = (x - min_x).abs() < tolerance;
        let near_right = (x - max_x).abs() < tolerance;
        let near_top = (y - min_y).abs() < tolerance;
        let near_bottom = (y - max_y).abs() < tolerance;

        if (near_left || near_right) && y >= min_y - tolerance && y <= max_y + tolerance {
            edge_points += 1;
        } else if (near_top || near_bottom) && x >= min_x - tolerance && x <= max_x + tolerance {
            edge_points += 1;
        }
    }

    let confidence = edge_points as f32 / points.len() as f32;

    Some(DetectedShape {
        shape_type: ShapeType::Rectangle,
        center,
        size1: width,
        size2: height,
        rotation: calculate_rotation_angle(points).to_degrees(),
        color: Rgb([0, 0, 0]),
        confidence,
    })
}

/// Fit an ellipse to a contour (simplified to bounding ellipse)
fn fit_ellipse_to_contour(points: &[(f32, f32)]) -> Option<DetectedShape> {
    if points.len() < 4 {
        return None;
    }

    let centroid = calculate_centroid(points);

    // Calculate variance in x and y directions to estimate ellipse radii
    let var_x = points
        .iter()
        .map(|(x, _)| (x - centroid.0).powi(2))
        .sum::<f32>()
        / points.len() as f32;
    let var_y = points
        .iter()
        .map(|(_, y)| (y - centroid.1).powi(2))
        .sum::<f32>()
        / points.len() as f32;

    let rx = (var_x * 2.0).sqrt(); // Approximate semi-major/minor axes
    let ry = (var_y * 2.0).sqrt();

    // Calculate confidence by checking how well points fit the ellipse
    let mut good_fits = 0;
    let tolerance = 0.2; // 20% tolerance

    for &(x, y) in points {
        let dx = (x - centroid.0) / rx;
        let dy = (y - centroid.1) / ry;
        let ellipse_value = dx * dx + dy * dy;

        if (ellipse_value - 1.0).abs() < tolerance {
            good_fits += 1;
        }
    }

    let confidence = good_fits as f32 / points.len() as f32;

    Some(DetectedShape {
        shape_type: ShapeType::Ellipse,
        center: centroid,
        size1: rx,
        size2: ry,
        rotation: calculate_rotation_angle(points).to_degrees(),
        color: Rgb([0, 0, 0]),
        confidence,
    })
}

/// Fit a triangle to a contour by finding three dominant vertices using corner detection
fn fit_triangle_to_contour(points: &[(f32, f32)]) -> Option<DetectedShape> {
    if points.len() < 6 {
        return None;
    }

    // Find corners in the contour using angle analysis
    let corners = detect_corners(points);

    if corners.len() < 3 {
        return None; // Not enough corners for a triangle
    }

    // Take the three most prominent corners
    let triangle_vertices: Vec<_> = corners.into_iter().take(3).collect();

    // Calculate triangle properties
    let centroid = calculate_centroid(&triangle_vertices);
    let avg_distance = triangle_vertices
        .iter()
        .map(|(x, y)| ((x - centroid.0).powi(2) + (y - centroid.1).powi(2)).sqrt())
        .sum::<f32>()
        / triangle_vertices.len() as f32;

    // Calculate confidence based on how well the contour points fit the triangle
    let confidence = calculate_triangle_fit_confidence(points, &triangle_vertices);

    Some(DetectedShape {
        shape_type: ShapeType::Triangle,
        center: centroid,
        size1: avg_distance,
        size2: avg_distance,
        rotation: calculate_rotation_angle(&triangle_vertices).to_degrees(),
        color: Rgb([0, 0, 0]),
        confidence,
    })
}

/// Detect corners in a contour using angle analysis
fn detect_corners(points: &[(f32, f32)]) -> Vec<(f32, f32)> {
    let mut corners = Vec::new();
    let window_size = 3; // Look at 3 points on each side

    if points.len() < window_size * 2 + 1 {
        return corners;
    }

    for i in window_size..points.len() - window_size {
        let angle = calculate_corner_angle(points, i, window_size);

        // A corner is detected if the angle is sharp enough (less than 120 degrees)
        if angle < 120.0 {
            corners.push(points[i]);
        }
    }

    // Remove corners that are too close to each other
    filter_close_corners(corners, 10.0)
}

/// Calculate the angle at a point in the contour
fn calculate_corner_angle(points: &[(f32, f32)], index: usize, window: usize) -> f32 {
    let center = points[index];
    let before = points[index - window];
    let after = points[index + window];

    // Calculate vectors
    let v1 = (before.0 - center.0, before.1 - center.1);
    let v2 = (after.0 - center.0, after.1 - center.1);

    // Calculate angle between vectors
    let dot = v1.0 * v2.0 + v1.1 * v2.1;
    let cross = v1.0 * v2.1 - v1.1 * v2.0;
    let angle = cross.atan2(dot).abs();

    angle.to_degrees()
}

/// Filter out corners that are too close to each other
fn filter_close_corners(corners: Vec<(f32, f32)>, min_distance: f32) -> Vec<(f32, f32)> {
    let mut filtered = Vec::new();

    for corner in corners {
        let too_close = filtered.iter().any(|existing: &(f32, f32)| {
            let dx = corner.0 - existing.0;
            let dy = corner.1 - existing.1;
            (dx * dx + dy * dy).sqrt() < min_distance
        });

        if !too_close {
            filtered.push(corner);
        }
    }

    filtered
}

/// Calculate how well contour points fit a triangle formed by three vertices
fn calculate_triangle_fit_confidence(
    contour_points: &[(f32, f32)],
    triangle_vertices: &[(f32, f32)],
) -> f32 {
    if triangle_vertices.len() != 3 {
        return 0.0;
    }

    let mut points_near_edges = 0;
    let tolerance = 5.0; // pixels

    for &point in contour_points {
        // Check if point is close to any triangle edge
        for i in 0..3 {
            let v1 = triangle_vertices[i];
            let v2 = triangle_vertices[(i + 1) % 3];

            let distance = distance_point_to_line(point, v1, v2);
            if distance < tolerance {
                points_near_edges += 1;
                break;
            }
        }
    }

    points_near_edges as f32 / contour_points.len() as f32
}

/// Calculate distance from a point to a line segment
fn distance_point_to_line(point: (f32, f32), line_start: (f32, f32), line_end: (f32, f32)) -> f32 {
    let (px, py) = point;
    let (x1, y1) = line_start;
    let (x2, y2) = line_end;

    let dx = x2 - x1;
    let dy = y2 - y1;

    if dx == 0.0 && dy == 0.0 {
        // Line start and end are the same
        return ((px - x1).powi(2) + (py - y1).powi(2)).sqrt();
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    let t = t.clamp(0.0, 1.0);

    let closest_x = x1 + t * dx;
    let closest_y = y1 + t * dy;

    ((px - closest_x).powi(2) + (py - closest_y).powi(2)).sqrt()
}

/// Generate SVG from detected geometric shapes
fn generate_svg_from_detected_shapes(shapes: &[DetectedShape], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata(
            "Vec2Art Edge-Guided Geometric Fitting",
            "Geometric shapes detected from edge contours",
        )
        .with_background("#ffffff");

    for shape in shapes {
        let color = rgb_to_hex(shape.color[0], shape.color[1], shape.color[2]);

        match shape.shape_type {
            ShapeType::Circle => {
                builder.add_circle(shape.center.0, shape.center.1, shape.size1, &color, 1.0);
            }
            ShapeType::Rectangle => {
                builder.add_rectangle(
                    shape.center.0 - shape.size1 / 2.0,
                    shape.center.1 - shape.size2 / 2.0,
                    shape.size1,
                    shape.size2,
                    &color,
                    1.0,
                );
            }
            ShapeType::Triangle => {
                // Calculate triangle vertices from center and size
                let size = shape.size1;
                let (cx, cy) = shape.center;

                let p1 = (cx, cy - size);
                let p2 = (cx - size * 0.866, cy + size * 0.5);
                let p3 = (cx + size * 0.866, cy + size * 0.5);

                builder.add_triangle(p1, p2, p3, &color, 1.0);
            }
            ShapeType::Ellipse => {
                builder.add_ellipse(
                    shape.center.0,
                    shape.center.1,
                    shape.size1,
                    shape.size2,
                    &color,
                    1.0,
                );
            }
        }
    }

    builder.build()
}

pub fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
    GeometricFitter::convert(image, params)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_edge_guided_geometric_fitter() {
        let params = ConversionParameters::GeometricFitter {
            shape_types: vec![ShapeType::Circle, ShapeType::Rectangle],
            max_shapes: 10,
            population_size: 10, // Not used in new algorithm
            generations: 5,      // Not used in new algorithm
            mutation_rate: 0.1,  // Not used in new algorithm
            target_fitness: 0.9, // Not used in new algorithm
        };

        // Create a simple test image with a white circle
        let mut img = image::RgbImage::new(100, 100);
        for y in 0..100 {
            for x in 0..100 {
                let dx = x as f32 - 50.0;
                let dy = y as f32 - 50.0;
                let dist = (dx * dx + dy * dy).sqrt();

                if dist < 20.0 {
                    img.put_pixel(x, y, image::Rgb([0, 0, 0])); // Black circle
                } else {
                    img.put_pixel(x, y, image::Rgb([255, 255, 255])); // White background
                }
            }
        }

        let dynamic_img = DynamicImage::ImageRgb8(img);
        let result = GeometricFitter::convert(dynamic_img, params);

        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
        // The new algorithm should detect shapes, not just create random ones
        // So the SVG should contain actual geometric elements
    }

    #[test]
    fn test_circle_fitting() {
        // Test circle fitting with perfect circle points
        let mut points = Vec::new();
        let center = (50.0, 50.0);
        let radius = 20.0;

        // Generate points on a circle
        for i in 0..16 {
            let angle = i as f32 * 2.0 * std::f32::consts::PI / 16.0;
            let x = center.0 + radius * angle.cos();
            let y = center.1 + radius * angle.sin();
            points.push((x, y));
        }

        let mut workspace = ShapeFittingWorkspace::new();
        let detected_circle =
            fit_circle_to_contour_with_workspace(&points, &mut workspace).unwrap();

        assert_eq!(detected_circle.shape_type, ShapeType::Circle);
        assert!((detected_circle.center.0 - center.0).abs() < 1.0);
        assert!((detected_circle.center.1 - center.1).abs() < 1.0);
        assert!((detected_circle.size1 - radius).abs() < 1.0);
        assert!(detected_circle.confidence > 0.8); // Should be high confidence for perfect circle
    }
}
