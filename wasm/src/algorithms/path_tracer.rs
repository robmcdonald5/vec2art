use crate::algorithms::{ConversionAlgorithm, SvgPath, utils};
use crate::error::{Result, Vec2ArtError};
use crate::svg_builder::{SvgBuilder, rgb_to_hex};
use crate::utils::geometry::Point;
use crate::ConversionParameters;
use image::{DynamicImage, GrayImage, Luma, Rgb};
use log::info;
use std::collections::{HashSet, VecDeque};

pub struct PathTracer;

impl ConversionAlgorithm for PathTracer {
    fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        // Use parallel implementation if available
        #[cfg(feature = "parallel")]
        {
            let capabilities = crate::performance::get_capabilities();
            if capabilities.can_use_parallel_processing() {
                return crate::performance::parallel_path_tracer::ParallelPathTracer::convert_optimized(image, params);
            }
        }
        
        match params {
            ConversionParameters::PathTracer {
                threshold,
                num_colors,
                curve_smoothing,
                suppress_speckles,
                corner_threshold,
                optimize_curves,
            } => {
                info!("Starting path tracing with {} colors", num_colors);
                
                // Quantize colors first
                let quantized = quantize_image(&image, num_colors as usize)?;
                let colors = extract_unique_colors(&quantized);
                
                info!("Found {} unique colors after quantization", colors.len());
                
                // Process each color layer
                let mut all_paths = Vec::new();
                
                for (i, color) in colors.iter().enumerate() {
                    info!("Processing color layer {}/{}: {:?}", i + 1, colors.len(), color);
                    
                    // Create binary image for this color
                    info!("Creating binary layer...");
                    let binary = create_binary_layer(&quantized, color, threshold);
                    
                    // Remove small speckles
                    info!("Removing speckles...");
                    let cleaned = remove_speckles(&binary, suppress_speckles as usize);
                    
                    // Find contours
                    info!("Finding contours...");
                    let contours = find_contours(&cleaned);
                    info!("Found {} contours", contours.len());
                    
                    // Convert contours to paths
                    info!("Converting {} contours to paths...", contours.len());
                    for (j, contour) in contours.into_iter().enumerate() {
                        if j % 10 == 0 {
                            info!("Processing contour {}", j);
                        }
                        if let Some(path) = contour_to_path(
                            contour,
                            curve_smoothing,
                            corner_threshold,
                            optimize_curves,
                            color,
                        ) {
                            all_paths.push(path);
                        }
                    }
                    info!("Completed color layer {}", i + 1);
                }
                
                // Generate SVG
                let svg = generate_svg(&all_paths, image.width(), image.height());
                
                info!("Path tracing complete, generated {} paths", all_paths.len());
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "PathTracer requires PathTracer parameters".to_string()
            ))
        }
    }
    
    fn description() -> &'static str {
        "Traces smooth vector paths from bitmap images using color quantization"
    }
    
    fn estimate_time(width: u32, height: u32) -> u32 {
        // Rough estimate: ~200ms per megapixel
        let megapixels = (width * height) as f32 / 1_000_000.0;
        (megapixels * 200.0) as u32
    }
}

/// Quantize image colors using median cut
fn quantize_image(image: &DynamicImage, num_colors: usize) -> Result<DynamicImage> {
    let rgb_image = image.to_rgb8();
    let colors = utils::extract_colors(image, num_colors)?;
    
    let mut quantized = image::RgbImage::new(image.width(), image.height());
    
    for (x, y, pixel) in rgb_image.enumerate_pixels() {
        // Find nearest color
        let nearest = find_nearest_color(pixel, &colors);
        quantized.put_pixel(x, y, nearest);
    }
    
    Ok(DynamicImage::ImageRgb8(quantized))
}

/// Find the nearest color from a palette
fn find_nearest_color(pixel: &Rgb<u8>, palette: &[Rgb<u8>]) -> Rgb<u8> {
    let mut min_dist = f32::MAX;
    let mut nearest = palette[0];
    
    for &color in palette {
        let dist = color_distance(pixel, &color);
        if dist < min_dist {
            min_dist = dist;
            nearest = color;
        }
    }
    
    nearest
}

/// Calculate Euclidean distance between colors
fn color_distance(c1: &Rgb<u8>, c2: &Rgb<u8>) -> f32 {
    let dr = c1[0] as f32 - c2[0] as f32;
    let dg = c1[1] as f32 - c2[1] as f32;
    let db = c1[2] as f32 - c2[2] as f32;
    (dr * dr + dg * dg + db * db).sqrt()
}

/// Extract unique colors from quantized image
fn extract_unique_colors(image: &DynamicImage) -> Vec<Rgb<u8>> {
    let rgb_image = image.to_rgb8();
    let mut colors = HashSet::new();
    
    for pixel in rgb_image.pixels() {
        colors.insert((pixel[0], pixel[1], pixel[2]));
    }
    
    colors.into_iter()
        .map(|(r, g, b)| Rgb([r, g, b]))
        .collect()
}

/// Create binary image for a specific color
fn create_binary_layer(image: &DynamicImage, target_color: &Rgb<u8>, threshold: f32) -> GrayImage {
    let rgb_image = image.to_rgb8();
    let mut binary = GrayImage::new(image.width(), image.height());
    
    let threshold_dist = threshold * 255.0 * 1.732; // sqrt(3) * 255 for max RGB distance
    
    for (x, y, pixel) in rgb_image.enumerate_pixels() {
        let dist = color_distance(pixel, target_color);
        let value = if dist < threshold_dist { 255 } else { 0 };
        binary.put_pixel(x, y, Luma([value]));
    }
    
    binary
}

/// Remove small speckles from binary image
fn remove_speckles(image: &GrayImage, min_size: usize) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut cleaned = image.clone();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    
    for y in 0..height {
        for x in 0..width {
            if image.get_pixel(x, y)[0] > 0 && !visited[y as usize][x as usize] {
                let component = find_connected_component(image, &mut visited, x, y);
                
                if component.len() < min_size {
                    // Remove this component
                    for &(cx, cy) in &component {
                        cleaned.put_pixel(cx, cy, Luma([0]));
                    }
                }
            }
        }
    }
    
    cleaned
}

/// Find connected component starting from a point
fn find_connected_component(
    image: &GrayImage,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
) -> Vec<(u32, u32)> {
    let (width, height) = image.dimensions();
    let mut component = Vec::new();
    let mut queue = VecDeque::new();
    
    queue.push_back((start_x, start_y));
    visited[start_y as usize][start_x as usize] = true;
    
    while let Some((x, y)) = queue.pop_front() {
        component.push((x, y));
        
        // Check 4-connected neighbors
        let neighbors = [(0, -1), (1, 0), (0, 1), (-1, 0)];
        
        for (dx, dy) in &neighbors {
            let nx = (x as i32 + dx) as u32;
            let ny = (y as i32 + dy) as u32;
            
            if nx < width && ny < height {
                if image.get_pixel(nx, ny)[0] > 0 && !visited[ny as usize][nx as usize] {
                    visited[ny as usize][nx as usize] = true;
                    queue.push_back((nx, ny));
                }
            }
        }
    }
    
    component
}

/// Contour structure
struct Contour {
    points: Vec<(f32, f32)>,
    is_hole: bool,
}

/// Find all contours in a binary image
fn find_contours(image: &GrayImage) -> Vec<Contour> {
    let (width, height) = image.dimensions();
    let mut contours = Vec::new();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    
    // Find outer contours
    for y in 0..height {
        for x in 0..width {
            if image.get_pixel(x, y)[0] > 0 && !visited[y as usize][x as usize] {
                if let Some(contour) = trace_contour(image, &mut visited, x, y, false) {
                    contours.push(contour);
                }
            }
        }
    }
    
    // Find holes (inner contours)
    visited = vec![vec![false; width as usize]; height as usize];
    for y in 1..height-1 {
        for x in 1..width-1 {
            if image.get_pixel(x, y)[0] == 0 && !visited[y as usize][x as usize] {
                // Check if this is inside a shape
                if is_inside_shape(image, x, y) {
                    if let Some(mut contour) = trace_contour(image, &mut visited, x, y, true) {
                        contour.is_hole = true;
                        contours.push(contour);
                    }
                }
            }
        }
    }
    
    contours
}

/// Check if a point is inside a shape (for finding holes)
fn is_inside_shape(image: &GrayImage, x: u32, y: u32) -> bool {
    // Simple ray casting: count crossings to the left
    let mut crossings = 0;
    for cx in 0..x {
        if image.get_pixel(cx, y)[0] > 0 {
            // Check if this is an edge (transition from black to white)
            if cx == 0 || image.get_pixel(cx - 1, y)[0] == 0 {
                crossings += 1;
            }
        }
    }
    crossings % 2 == 1
}

/// Trace a single contour
fn trace_contour(
    image: &GrayImage,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
    is_hole: bool,
) -> Option<Contour> {
    let mut points = Vec::new();
    let mut current = (start_x as i32, start_y as i32);
    let start = current;
    
    // Direction vectors for 8-connectivity (clockwise from right)
    let directions = [
        (1, 0),   // Right
        (1, 1),   // Down-Right
        (0, 1),   // Down
        (-1, 1),  // Down-Left
        (-1, 0),  // Left
        (-1, -1), // Up-Left
        (0, -1),  // Up
        (1, -1),  // Up-Right
    ];
    
    let mut dir = 0; // Start direction
    
    loop {
        points.push((current.0 as f32, current.1 as f32));
        visited[current.1 as usize][current.0 as usize] = true;
        
        // Find next point on contour
        let mut found = false;
        let _start_dir = dir;
        
        for _ in 0..8 {
            let (dx, dy) = directions[dir];
            let next = (current.0 + dx, current.1 + dy);
            
            if next.0 >= 0 && next.0 < image.width() as i32 &&
               next.1 >= 0 && next.1 < image.height() as i32 {
                let pixel = image.get_pixel(next.0 as u32, next.1 as u32)[0];
                let is_edge = pixel > 0 && !visited[next.1 as usize][next.0 as usize];
                
                if is_edge {
                    current = next;
                    found = true;
                    break;
                }
            }
            
            dir = (dir + 1) % 8;
        }
        
        if !found || (current == start && points.len() > 2) {
            break;
        }
        
        if points.len() > 1000 {
            // Reduced safety limit and add debug info
            info!("Contour tracing hit safety limit at {} points, breaking to prevent infinite loop", points.len());
            break;
        }
        
        // Additional termination check - if we've been going in circles
        if points.len() > 10 && points.len() % 100 == 0 {
            // Check if we're revisiting the same area repeatedly
            let recent_points: Vec<_> = points.iter().skip(points.len() - 10).collect();
            let start_points: Vec<_> = points.iter().take(10).collect();
            if recent_points == start_points {
                info!("Detected circular path in contour tracing, breaking");
                break;
            }
        }
    }
    
    if points.len() < 3 {
        None
    } else {
        Some(Contour {
            points,
            is_hole,
        })
    }
}

/// Convert contour to SVG path with Bezier curves
fn contour_to_path(
    contour: Contour,
    smoothing: f32,
    corner_threshold: f32,
    optimize: bool,
    color: &Rgb<u8>,
) -> Option<SvgPath> {
    if contour.points.len() < 3 {
        return None;
    }
    
    let mut path = SvgPath::new();
    
    // Simplify contour first
    path.points = contour.points;
    path.simplify(2.0);
    
    if path.points.len() < 3 {
        return None;
    }
    
    // Detect corners
    let corners = detect_corners(&path.points, corner_threshold);
    
    // Fit Bezier curves between corners
    if optimize {
        path = fit_bezier_curves(&path.points, &corners, smoothing);
    }
    
    // Set style
    if contour.is_hole {
        path.fill_color = Some("#ffffff".to_string());
    } else {
        path.fill_color = Some(rgb_to_hex(color[0], color[1], color[2]));
    }
    path.closed = true;
    
    Some(path)
}

/// Detect corners in a contour
fn detect_corners(points: &[(f32, f32)], threshold: f32) -> Vec<usize> {
    let mut corners = vec![0]; // Always include first point
    let threshold_rad = threshold.to_radians();
    
    for i in 1..points.len() - 1 {
        let p1 = Point::new(points[i - 1].0, points[i - 1].1);
        let p2 = Point::new(points[i].0, points[i].1);
        let p3 = Point::new(points[i + 1].0, points[i + 1].1);
        
        let v1 = p1 - p2;
        let v2 = p3 - p2;
        
        let angle = v1.angle(&v2);
        
        if angle.abs() < threshold_rad {
            corners.push(i);
        }
    }
    
    corners.push(points.len() - 1); // Always include last point
    corners
}

/// Fit Bezier curves to points between corners
fn fit_bezier_curves(points: &[(f32, f32)], _corners: &[usize], _smoothing: f32) -> SvgPath {
    let mut path = SvgPath::new();
    
    // For now, use simple line segments
    // Full Bezier fitting would require more complex least-squares fitting
    path.points = points.to_vec();
    path.closed = true;
    
    path
}

/// Generate SVG from paths
fn generate_svg(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art Path Tracer", "Path-traced vector graphics");
    
    // Sort paths by area (larger first) for proper layering
    let mut sorted_paths = paths.to_vec();
    sorted_paths.sort_by(|a, b| {
        let area_a = calculate_path_area(&a.points);
        let area_b = calculate_path_area(&b.points);
        area_b.partial_cmp(&area_a).unwrap()
    });
    
    builder.add_paths(&sorted_paths);
    
    builder.build()
}

/// Calculate area of a path (for sorting)
fn calculate_path_area(points: &[(f32, f32)]) -> f32 {
    if points.len() < 3 {
        return 0.0;
    }
    
    let mut area = 0.0;
    let n = points.len();
    
    for i in 0..n {
        let j = (i + 1) % n;
        area += points[i].0 * points[j].1;
        area -= points[j].0 * points[i].1;
    }
    
    area.abs() / 2.0
}

pub fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
    PathTracer::convert(image, params)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_path_tracer_creation() {
        let params = ConversionParameters::PathTracer {
            threshold: 0.5,
            num_colors: 8,
            curve_smoothing: 0.5,
            suppress_speckles: 0.1,
            corner_threshold: 60.0,
            optimize_curves: true,
        };
        
        // Create a simple test image
        let img = DynamicImage::new_rgb8(100, 100);
        let result = PathTracer::convert(img, params);
        
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }
}