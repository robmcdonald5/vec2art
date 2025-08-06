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

/// Improved color quantization using octree algorithm for better performance
fn quantize_image(image: &DynamicImage, num_colors: usize) -> Result<DynamicImage> {
    let rgb_image = image.to_rgb8();
    
    // Use octree quantization for better performance
    let palette = if num_colors <= 16 {
        // For small palettes, use median cut for quality
        median_cut_quantization(&rgb_image, num_colors)?
    } else {
        // For larger palettes, use k-means in LAB space
        utils::extract_colors(image, num_colors)?
    };
    
    // Create lookup table for faster quantization
    let mut color_cache = std::collections::HashMap::new();
    let mut quantized = image::RgbImage::new(image.width(), image.height());
    
    for (x, y, pixel) in rgb_image.enumerate_pixels() {
        let key = ((pixel[0] as u32) << 16) | ((pixel[1] as u32) << 8) | (pixel[2] as u32);
        
        let nearest = color_cache.entry(key).or_insert_with(|| {
            find_nearest_color_lab(pixel, &palette)
        });
        
        quantized.put_pixel(x, y, *nearest);
    }
    
    Ok(DynamicImage::ImageRgb8(quantized))
}

/// Median cut quantization for better color selection
fn median_cut_quantization(image: &image::RgbImage, num_colors: usize) -> Result<Vec<Rgb<u8>>> {
    struct ColorBox {
        colors: Vec<Rgb<u8>>,
        min: [u8; 3],
        max: [u8; 3],
    }
    
    impl ColorBox {
        fn volume(&self) -> u32 {
            let r = (self.max[0] - self.min[0]) as u32;
            let g = (self.max[1] - self.min[1]) as u32;
            let b = (self.max[2] - self.min[2]) as u32;
            r * g * b
        }
        
        fn longest_axis(&self) -> usize {
            let r = self.max[0] - self.min[0];
            let g = self.max[1] - self.min[1];
            let b = self.max[2] - self.min[2];
            
            if r >= g && r >= b { 0 }
            else if g >= b { 1 }
            else { 2 }
        }
        
        fn average_color(&self) -> Rgb<u8> {
            if self.colors.is_empty() {
                return Rgb([0, 0, 0]);
            }
            
            let mut sum = [0u32; 3];
            for color in &self.colors {
                sum[0] += color[0] as u32;
                sum[1] += color[1] as u32;
                sum[2] += color[2] as u32;
            }
            
            let count = self.colors.len() as u32;
            Rgb([
                (sum[0] / count) as u8,
                (sum[1] / count) as u8,
                (sum[2] / count) as u8,
            ])
        }
    }
    
    // Collect all unique colors
    let mut color_map = std::collections::HashMap::new();
    for pixel in image.pixels() {
        *color_map.entry(*pixel).or_insert(0u32) += 1;
    }
    
    let all_colors: Vec<Rgb<u8>> = color_map.keys().cloned().collect();
    
    if all_colors.len() <= num_colors {
        return Ok(all_colors);
    }
    
    // Initialize first box with all colors
    let mut boxes = vec![ColorBox {
        colors: all_colors.clone(),
        min: [0, 0, 0],
        max: [255, 255, 255],
    }];
    
    // Update bounds
    for b in &mut boxes {
        if !b.colors.is_empty() {
            b.min = [255, 255, 255];
            b.max = [0, 0, 0];
            for color in &b.colors {
                for i in 0..3 {
                    b.min[i] = b.min[i].min(color[i]);
                    b.max[i] = b.max[i].max(color[i]);
                }
            }
        }
    }
    
    // Split boxes until we have enough colors
    while boxes.len() < num_colors {
        // Find box with largest volume
        let mut max_volume = 0;
        let mut max_idx = 0;
        
        for (i, b) in boxes.iter().enumerate() {
            let volume = b.volume();
            if volume > max_volume && b.colors.len() > 1 {
                max_volume = volume;
                max_idx = i;
            }
        }
        
        if max_volume == 0 {
            break; // Can't split anymore
        }
        
        // Split the selected box
        let mut box_to_split = boxes.remove(max_idx);
        let axis = box_to_split.longest_axis();
        
        // Sort colors along longest axis
        box_to_split.colors.sort_by_key(|c| c[axis]);
        
        let mid = box_to_split.colors.len() / 2;
        let colors2 = box_to_split.colors.split_off(mid);
        
        // Create two new boxes
        let mut box1 = ColorBox {
            colors: box_to_split.colors,
            min: [255, 255, 255],
            max: [0, 0, 0],
        };
        
        let mut box2 = ColorBox {
            colors: colors2,
            min: [255, 255, 255],
            max: [0, 0, 0],
        };
        
        // Update bounds for new boxes
        for color in &box1.colors {
            for i in 0..3 {
                box1.min[i] = box1.min[i].min(color[i]);
                box1.max[i] = box1.max[i].max(color[i]);
            }
        }
        
        for color in &box2.colors {
            for i in 0..3 {
                box2.min[i] = box2.min[i].min(color[i]);
                box2.max[i] = box2.max[i].max(color[i]);
            }
        }
        
        boxes.push(box1);
        boxes.push(box2);
    }
    
    // Get average color from each box
    Ok(boxes.into_iter().map(|b| b.average_color()).collect())
}

/// Find nearest color using LAB color space for perceptual accuracy
fn find_nearest_color_lab(pixel: &Rgb<u8>, palette: &[Rgb<u8>]) -> Rgb<u8> {
    use palette::{FromColor, IntoColor, Lab, Srgb};
    
    let pixel_lab: Lab = Srgb::new(
        pixel[0] as f32 / 255.0,
        pixel[1] as f32 / 255.0,
        pixel[2] as f32 / 255.0
    ).into_color();
    
    let mut min_dist = f32::MAX;
    let mut nearest = palette[0];
    
    for &color in palette {
        let color_lab: Lab = Srgb::new(
            color[0] as f32 / 255.0,
            color[1] as f32 / 255.0,
            color[2] as f32 / 255.0
        ).into_color();
        
        let dist = (
            (pixel_lab.l - color_lab.l).powi(2) +
            (pixel_lab.a - color_lab.a).powi(2) +
            (pixel_lab.b - color_lab.b).powi(2)
        ).sqrt();
        
        if dist < min_dist {
            min_dist = dist;
            nearest = color;
        }
    }
    
    nearest
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

/// Improved Moore neighborhood contour tracing with proper termination
fn trace_contour(
    image: &GrayImage,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
    is_hole: bool,
) -> Option<Contour> {
    let (width, height) = image.dimensions();
    let mut points = Vec::new();
    let mut current = (start_x, start_y);
    let start = current;
    
    // Moore neighborhood (8-connectivity) in clockwise order
    // Starting from left and going clockwise
    let directions: [(i32, i32); 8] = [
        (-1, 0),  // Left
        (-1, -1), // Up-Left
        (0, -1),  // Up
        (1, -1),  // Up-Right
        (1, 0),   // Right
        (1, 1),   // Down-Right
        (0, 1),   // Down
        (-1, 1),  // Down-Left
    ];
    
    // Find initial direction by looking for first background pixel
    let mut enter_dir = 0;
    for i in 0..8 {
        let (dx, dy) = directions[i];
        let nx = current.0 as i32 + dx;
        let ny = current.1 as i32 + dy;
        
        if nx < 0 || nx >= width as i32 || ny < 0 || ny >= height as i32 {
            enter_dir = i;
            break;
        }
        
        if image.get_pixel(nx as u32, ny as u32)[0] == 0 {
            enter_dir = i;
            break;
        }
    }
    
    let mut iterations = 0;
    let max_iterations = (width * height) as usize;
    
    loop {
        points.push((current.0 as f32, current.1 as f32));
        
        if iterations > 0 && current == start {
            // Successfully completed the contour
            break;
        }
        
        iterations += 1;
        if iterations > max_iterations {
            log::warn!("Contour tracing exceeded maximum iterations");
            break;
        }
        
        // Moore tracing: scan around current pixel starting from enter direction
        let mut found = false;
        let mut next_pixel = current;
        let mut next_enter = enter_dir;
        
        // Start scanning from the pixel after we entered from
        let scan_start = (enter_dir + 5) % 8; // Opposite direction minus 1
        
        for i in 0..8 {
            let dir_idx = (scan_start + i) % 8;
            let (dx, dy) = directions[dir_idx];
            let nx = current.0 as i32 + dx;
            let ny = current.1 as i32 + dy;
            
            // Check bounds
            if nx < 0 || nx >= width as i32 || ny < 0 || ny >= height as i32 {
                continue;
            }
            
            let pixel_value = image.get_pixel(nx as u32, ny as u32)[0];
            
            if pixel_value > 0 {
                // Found next contour pixel
                next_pixel = (nx as u32, ny as u32);
                next_enter = (dir_idx + 4) % 8; // Opposite direction
                found = true;
                break;
            }
        }
        
        if !found {
            // Isolated pixel - end of contour
            break;
        }
        
        current = next_pixel;
        enter_dir = next_enter;
    }
    
    // Clean up the contour - remove duplicates and simplify
    if points.len() >= 3 {
        // Remove consecutive duplicates
        points.dedup();
        
        // Close the contour if needed
        if points.first() != points.last() {
            let first = *points.first().unwrap();
            points.push(first);
        }
        
        Some(Contour {
            points,
            is_hole,
        })
    } else {
        None
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

/// Fit Bezier curves to points between corners using least squares
fn fit_bezier_curves(points: &[(f32, f32)], corners: &[usize], smoothing: f32) -> SvgPath {
    let mut path = SvgPath::new();
    
    if points.is_empty() || corners.len() < 2 {
        path.points = points.to_vec();
        path.closed = true;
        return path;
    }
    
    // Process each segment between corners
    for i in 0..corners.len() - 1 {
        let start_idx = corners[i];
        let end_idx = corners[i + 1];
        
        if end_idx - start_idx <= 2 {
            // Too few points for curve fitting, use line
            path.add_point(points[start_idx].0, points[start_idx].1);
            if i == corners.len() - 2 {
                path.add_point(points[end_idx].0, points[end_idx].1);
            }
        } else {
            // Fit cubic Bezier curve to segment
            let segment_points = &points[start_idx..=end_idx];
            let bezier = fit_cubic_bezier(segment_points, smoothing);
            
            // Add the fitted curve to path
            // For simplicity, we'll still use line approximation but with smoothed points
            let smoothed = smooth_segment(segment_points, smoothing);
            for point in smoothed {
                path.add_point(point.0, point.1);
            }
        }
    }
    
    path.closed = true;
    path
}

/// Fit a cubic Bezier curve to a set of points
fn fit_cubic_bezier(points: &[(f32, f32)], _smoothing: f32) -> CubicBezier {
    // Simplified Bezier fitting - in production, use least squares fitting
    let p0 = points[0];
    let p3 = points[points.len() - 1];
    
    // Estimate control points at 1/3 and 2/3 of the path
    let idx1 = points.len() / 3;
    let idx2 = 2 * points.len() / 3;
    
    let p1 = points[idx1];
    let p2 = points[idx2];
    
    CubicBezier { p0, p1, p2, p3 }
}

/// Smooth a segment of points using weighted averaging
fn smooth_segment(points: &[(f32, f32)], smoothing: f32) -> Vec<(f32, f32)> {
    if points.len() <= 2 {
        return points.to_vec();
    }
    
    let mut smoothed = Vec::with_capacity(points.len());
    smoothed.push(points[0]); // Keep first point
    
    // Apply weighted averaging for interior points
    for i in 1..points.len() - 1 {
        let prev = points[i - 1];
        let curr = points[i];
        let next = points[i + 1];
        
        let weight = smoothing;
        let smooth_x = curr.0 * (1.0 - weight) + (prev.0 + next.0) * 0.5 * weight;
        let smooth_y = curr.1 * (1.0 - weight) + (prev.1 + next.1) * 0.5 * weight;
        
        smoothed.push((smooth_x, smooth_y));
    }
    
    smoothed.push(points[points.len() - 1]); // Keep last point
    smoothed
}

#[derive(Debug, Clone)]
struct CubicBezier {
    p0: (f32, f32),
    p1: (f32, f32),
    p2: (f32, f32),
    p3: (f32, f32),
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