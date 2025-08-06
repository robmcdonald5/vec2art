use crate::algorithms::SvgPath;
use crate::error::{Result, Vec2ArtError};
use crate::svg_builder::{SvgBuilder, rgb_to_hex};
use crate::utils::geometry::Point;
#[cfg(feature = "parallel")]
use crate::performance::{get_capabilities, PerfTimer, calculate_optimal_chunk_size};

#[cfg(not(feature = "parallel"))]
use crate::performance::{get_capabilities, PerfTimer};
use crate::ConversionParameters;
use image::{DynamicImage, GrayImage, Luma, Rgb};
use log::info;
use std::collections::{HashSet, VecDeque};

#[cfg(feature = "parallel")]
use rayon::prelude::*;

pub struct ParallelPathTracer;

impl ParallelPathTracer {
    /// Optimized convert function that uses parallel processing when available
    pub fn convert_optimized(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        let _timer = PerfTimer::new("ParallelPathTracer::convert_optimized");
        let capabilities = get_capabilities();
        
        match params {
            ConversionParameters::PathTracer {
                threshold,
                num_colors,
                curve_smoothing,
                suppress_speckles,
                corner_threshold,
                optimize_curves,
            } => {
                info!("Starting parallel path tracing with {} colors", num_colors);
                info!("Using {} threads", capabilities.recommended_thread_count());
                
                // Quantize colors using parallel k-means
                let quantized = {
                    let _timer = PerfTimer::new("Parallel color quantization");
                    quantize_image_parallel(&image, num_colors as usize)?
                };
                
                let colors = {
                    let _timer = PerfTimer::new("Extract unique colors");
                    extract_unique_colors_parallel(&quantized)
                };
                
                info!("Found {} unique colors after quantization", colors.len());
                
                // Process each color layer in parallel
                let all_paths = {
                    let _timer = PerfTimer::new("Process color layers");
                    process_color_layers_parallel(
                        &quantized,
                        &colors,
                        threshold,
                        suppress_speckles,
                        curve_smoothing,
                        corner_threshold,
                        optimize_curves
                    )
                };
                
                // Generate SVG
                let svg = generate_svg(&all_paths, image.width(), image.height());
                
                info!("Parallel path tracing complete, generated {} paths", all_paths.len());
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "ParallelPathTracer requires PathTracer parameters".to_string()
            ))
        }
    }
}

/// Parallel color quantization using k-means clustering
fn quantize_image_parallel(image: &DynamicImage, num_colors: usize) -> Result<DynamicImage> {
    let _timer = PerfTimer::new("Parallel k-means quantization");
    let rgb_image = image.to_rgb8();
    
    // Extract colors using parallel k-means
    let colors = {
        let _timer = PerfTimer::new("Extract palette colors");
        extract_colors_parallel(image, num_colors)?
    };
    
    // Apply quantization in parallel
    let (width, height) = (image.width(), image.height());
    let mut quantized = image::RgbImage::new(width, height);
    
    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            let pixels: Vec<_> = rgb_image.enumerate_pixels().collect();
            let chunk_size = calculate_optimal_chunk_size(pixels.len(), capabilities.recommended_thread_count());
            
            let results: Vec<_> = pixels
                .par_chunks(chunk_size)
                .map(|chunk| {
                    chunk.iter().map(|(x, y, pixel)| {
                        let nearest = find_nearest_color_parallel(pixel, &colors);
                        (*x, *y, nearest)
                    }).collect::<Vec<_>>()
                })
                .collect();
            
            // Collect results
            for chunk in results {
                for (x, y, pixel) in chunk {
                    quantized.put_pixel(x, y, pixel);
                }
            }
        } else {
            // Fallback to serial processing
            for (x, y, pixel) in rgb_image.enumerate_pixels() {
                let nearest = find_nearest_color_parallel(pixel, &colors);
                quantized.put_pixel(x, y, nearest);
            }
        }
    }
    
    #[cfg(not(feature = "parallel"))]
    {
        for (x, y, pixel) in rgb_image.enumerate_pixels() {
            let nearest = find_nearest_color_parallel(pixel, &colors);
            quantized.put_pixel(x, y, nearest);
        }
    }
    
    Ok(DynamicImage::ImageRgb8(quantized))
}

/// Parallel k-means color extraction
fn extract_colors_parallel(image: &DynamicImage, num_colors: usize) -> Result<Vec<Rgb<u8>>> {
    use palette::{FromColor, IntoColor, Lab, Srgb};
    
    let rgb_image = image.to_rgb8();
    
    // Convert pixels to Lab color space in parallel
    let lab_pixels: Vec<Lab> = {
        let _timer = PerfTimer::new("Convert to Lab color space");
        
        #[cfg(feature = "parallel")]
        {
            let capabilities = get_capabilities();
            if capabilities.can_use_parallel_processing() {
                let pixels: Vec<_> = rgb_image.pixels().collect();
                let chunk_size = calculate_optimal_chunk_size(pixels.len(), capabilities.recommended_thread_count());
                
                pixels
                    .par_chunks(chunk_size)
                    .map(|chunk| {
                        chunk.iter().map(|p| {
                            let rgb = Srgb::new(p[0] as f32 / 255.0, p[1] as f32 / 255.0, p[2] as f32 / 255.0);
                            Lab::from_color(rgb)
                        }).collect::<Vec<_>>()
                    })
                    .collect::<Vec<_>>()
                    .into_iter()
                    .flatten()
                    .collect()
            } else {
                rgb_image
                    .pixels()
                    .map(|p| {
                        let rgb = Srgb::new(p[0] as f32 / 255.0, p[1] as f32 / 255.0, p[2] as f32 / 255.0);
                        Lab::from_color(rgb)
                    })
                    .collect()
            }
        }
        
        #[cfg(not(feature = "parallel"))]
        {
            rgb_image
                .pixels()
                .map(|p| {
                    let rgb = Srgb::new(p[0] as f32 / 255.0, p[1] as f32 / 255.0, p[2] as f32 / 255.0);
                    Lab::from_color(rgb)
                })
                .collect()
        }
    };
    
    // Initialize centers using even distribution
    let mut centers = Vec::with_capacity(num_colors);
    let step = lab_pixels.len() / num_colors;
    for i in 0..num_colors {
        centers.push(lab_pixels[i * step]);
    }
    
    // Parallel k-means iterations
    for iteration in 0..15 {
        let _timer = PerfTimer::new(&format!("K-means iteration {}", iteration));
        
        // Assign pixels to clusters in parallel
        let assignments: Vec<usize> = {
            #[cfg(feature = "parallel")]
            {
                let capabilities = get_capabilities();
                if capabilities.can_use_parallel_processing() {
                    let chunk_size = calculate_optimal_chunk_size(lab_pixels.len(), capabilities.recommended_thread_count());
                    
                    lab_pixels
                        .par_chunks(chunk_size)
                        .map(|chunk| {
                            chunk.iter().map(|pixel| {
                                let mut min_dist = f32::MAX;
                                let mut min_idx = 0;
                                
                                for (idx, center) in centers.iter().enumerate() {
                                    let dist = lab_color_distance(pixel, center);
                                    if dist < min_dist {
                                        min_dist = dist;
                                        min_idx = idx;
                                    }
                                }
                                
                                min_idx
                            }).collect::<Vec<_>>()
                        })
                        .collect::<Vec<_>>()
                        .into_iter()
                        .flatten()
                        .collect()
                } else {
                    lab_pixels.iter().map(|pixel| {
                        let mut min_dist = f32::MAX;
                        let mut min_idx = 0;
                        
                        for (idx, center) in centers.iter().enumerate() {
                            let dist = lab_color_distance(pixel, center);
                            if dist < min_dist {
                                min_dist = dist;
                                min_idx = idx;
                            }
                        }
                        
                        min_idx
                    }).collect()
                }
            }
            
            #[cfg(not(feature = "parallel"))]
            {
                lab_pixels.iter().map(|pixel| {
                    let mut min_dist = f32::MAX;
                    let mut min_idx = 0;
                    
                    for (idx, center) in centers.iter().enumerate() {
                        let dist = lab_color_distance(pixel, center);
                        if dist < min_dist {
                            min_dist = dist;
                            min_idx = idx;
                        }
                    }
                    
                    min_idx
                }).collect()
            }
        };
        
        // Update cluster centers in parallel
        let new_centers: Vec<Lab> = {
            #[cfg(feature = "parallel")]
            {
                let capabilities = get_capabilities();
                if capabilities.can_use_parallel_processing() {
                    (0..num_colors)
                        .into_par_iter()
                        .map(|cluster_id| {
                            let cluster_pixels: Vec<_> = lab_pixels
                                .iter()
                                .zip(assignments.iter())
                                .filter_map(|(pixel, &assignment)| {
                                    if assignment == cluster_id {
                                        Some(*pixel)
                                    } else {
                                        None
                                    }
                                })
                                .collect();
                            
                            if cluster_pixels.is_empty() {
                                centers[cluster_id]
                            } else {
                                let sum = cluster_pixels.iter().fold(
                                    Lab::new(0.0, 0.0, 0.0),
                                    |acc: Lab<palette::white_point::D65>, c| Lab::new(
                                        acc.l + c.l,
                                        acc.a + c.a,
                                        acc.b + c.b,
                                    )
                                );
                                
                                let count = cluster_pixels.len() as f32;
                                Lab::new(
                                    sum.l / count,
                                    sum.a / count,
                                    sum.b / count,
                                )
                            }
                        })
                        .collect()
                } else {
                    (0..num_colors)
                        .map(|cluster_id| {
                            let cluster_pixels: Vec<_> = lab_pixels
                                .iter()
                                .zip(assignments.iter())
                                .filter_map(|(pixel, &assignment)| {
                                    if assignment == cluster_id {
                                        Some(*pixel)
                                    } else {
                                        None
                                    }
                                })
                                .collect();
                            
                            if cluster_pixels.is_empty() {
                                centers[cluster_id]
                            } else {
                                let sum = cluster_pixels.iter().fold(
                                    Lab::new(0.0, 0.0, 0.0),
                                    |acc: Lab<palette::white_point::D65>, c| Lab::new(
                                        acc.l + c.l,
                                        acc.a + c.a,
                                        acc.b + c.b,
                                    )
                                );
                                
                                let count = cluster_pixels.len() as f32;
                                Lab::new(
                                    sum.l / count,
                                    sum.a / count,
                                    sum.b / count,
                                )
                            }
                        })
                        .collect()
                }
            }
            
            #[cfg(not(feature = "parallel"))]
            {
                (0..num_colors)
                    .map(|cluster_id| {
                        let cluster_pixels: Vec<_> = lab_pixels
                            .iter()
                            .zip(assignments.iter())
                            .filter_map(|(pixel, &assignment)| {
                                if assignment == cluster_id {
                                    Some(*pixel)
                                } else {
                                    None
                                }
                            })
                            .collect();
                        
                        if cluster_pixels.is_empty() {
                            centers[cluster_id]
                        } else {
                            let sum = cluster_pixels.iter().fold(
                                Lab::new(0.0, 0.0, 0.0),
                                |acc: Lab<palette::white_point::D65>, c| Lab::new(
                                    acc.l + c.l,
                                    acc.a + c.a,
                                    acc.b + c.b,
                                )
                            );
                            
                            let count = cluster_pixels.len() as f32;
                            Lab::new(
                                sum.l / count,
                                sum.a / count,
                                sum.b / count,
                            )
                        }
                    })
                    .collect()
            }
        };
        
        centers = new_centers;
    }
    
    // Convert back to RGB
    Ok(centers
        .into_iter()
        .map(|lab| {
            let srgb: Srgb = lab.into_color();
            let rgb_u8: Srgb<u8> = srgb.into_format();
            Rgb([rgb_u8.red, rgb_u8.green, rgb_u8.blue])
        })
        .collect())
}

/// Calculate Lab color distance
fn lab_color_distance(a: &palette::Lab, b: &palette::Lab) -> f32 {
    let dl = a.l - b.l;
    let da = a.a - b.a;
    let db = a.b - b.b;
    (dl * dl + da * da + db * db).sqrt()
}

/// Parallel nearest color finding
fn find_nearest_color_parallel(pixel: &Rgb<u8>, palette: &[Rgb<u8>]) -> Rgb<u8> {
    let mut min_dist = f32::MAX;
    let mut nearest = palette[0];
    
    for &color in palette {
        let dist = rgb_color_distance(pixel, &color);
        if dist < min_dist {
            min_dist = dist;
            nearest = color;
        }
    }
    
    nearest
}

/// Calculate Euclidean distance between RGB colors
fn rgb_color_distance(c1: &Rgb<u8>, c2: &Rgb<u8>) -> f32 {
    let dr = c1[0] as f32 - c2[0] as f32;
    let dg = c1[1] as f32 - c2[1] as f32;
    let db = c1[2] as f32 - c2[2] as f32;
    (dr * dr + dg * dg + db * db).sqrt()
}

/// Parallel unique colors extraction
fn extract_unique_colors_parallel(image: &DynamicImage) -> Vec<Rgb<u8>> {
    let rgb_image = image.to_rgb8();
    
    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            let pixels: Vec<_> = rgb_image.pixels().collect();
            let chunk_size = calculate_optimal_chunk_size(pixels.len(), capabilities.recommended_thread_count());
            
            let color_sets: Vec<HashSet<_>> = pixels
                .par_chunks(chunk_size)
                .map(|chunk| {
                    chunk.iter()
                        .map(|pixel| (pixel[0], pixel[1], pixel[2]))
                        .collect()
                })
                .collect();
            
            // Merge all sets
            let mut all_colors = HashSet::new();
            for set in color_sets {
                all_colors.extend(set);
            }
            
            return all_colors.into_iter()
                .map(|(r, g, b)| Rgb([r, g, b]))
                .collect();
        }
    }
    
    // Fallback to serial processing
    let mut colors = HashSet::new();
    
    for pixel in rgb_image.pixels() {
        colors.insert((pixel[0], pixel[1], pixel[2]));
    }
    
    colors.into_iter()
        .map(|(r, g, b)| Rgb([r, g, b]))
        .collect()
}

/// Process color layers in parallel
fn process_color_layers_parallel(
    quantized: &DynamicImage,
    colors: &[Rgb<u8>],
    threshold: f32,
    suppress_speckles: f32,
    curve_smoothing: f32,
    corner_threshold: f32,
    optimize_curves: bool,
) -> Vec<SvgPath> {
    let _timer = PerfTimer::new("Process color layers in parallel");
    
    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() && colors.len() > 1 {
            let chunk_size = calculate_optimal_chunk_size(colors.len(), capabilities.recommended_thread_count());
            
            return colors
                .par_chunks(chunk_size)
                .enumerate()
                .map(|(chunk_idx, color_chunk)| {
                    let mut chunk_paths = Vec::new();
                    
                    for (i, color) in color_chunk.iter().enumerate() {
                        let layer_idx = chunk_idx * chunk_size + i;
                        info!("Processing color layer {}/{}: {:?}", layer_idx + 1, colors.len(), color);
                        
                        let paths = process_single_color_layer(
                            quantized,
                            color,
                            threshold,
                            suppress_speckles,
                            curve_smoothing,
                            corner_threshold,
                            optimize_curves,
                        );
                        
                        chunk_paths.extend(paths);
                    }
                    
                    chunk_paths
                })
                .collect::<Vec<_>>()
                .into_iter()
                .flatten()
                .collect();
        }
    }
    
    // Fallback to serial processing
    let mut all_paths = Vec::new();
    
    for (i, color) in colors.iter().enumerate() {
        info!("Processing color layer {}/{}: {:?}", i + 1, colors.len(), color);
        
        let paths = process_single_color_layer(
            quantized,
            color,
            threshold,
            suppress_speckles,
            curve_smoothing,
            corner_threshold,
            optimize_curves,
        );
        
        all_paths.extend(paths);
    }
    
    all_paths
}

/// Process a single color layer
fn process_single_color_layer(
    quantized: &DynamicImage,
    color: &Rgb<u8>,
    threshold: f32,
    suppress_speckles: f32,
    curve_smoothing: f32,
    corner_threshold: f32,
    optimize_curves: bool,
) -> Vec<SvgPath> {
    // Create binary image for this color
    let binary = create_binary_layer(quantized, color, threshold);
    
    // Remove small speckles
    let cleaned = remove_speckles(&binary, suppress_speckles as usize);
    
    // Find contours
    let contours = find_contours(&cleaned);
    
    // Convert contours to paths
    let mut paths = Vec::new();
    for contour in contours {
        if let Some(path) = contour_to_path(
            contour,
            curve_smoothing,
            corner_threshold,
            optimize_curves,
            color,
        ) {
            paths.push(path);
        }
    }
    
    paths
}

/// Create binary image for a specific color (same as original implementation)
fn create_binary_layer(image: &DynamicImage, target_color: &Rgb<u8>, threshold: f32) -> GrayImage {
    let rgb_image = image.to_rgb8();
    let mut binary = GrayImage::new(image.width(), image.height());
    
    let threshold_dist = threshold * 255.0 * 1.732; // sqrt(3) * 255 for max RGB distance
    
    for (x, y, pixel) in rgb_image.enumerate_pixels() {
        let dist = rgb_color_distance(pixel, target_color);
        let value = if dist < threshold_dist { 255 } else { 0 };
        binary.put_pixel(x, y, Luma([value]));
    }
    
    binary
}

/// Remove small speckles from binary image (same as original implementation)
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

/// Find connected component starting from a point (same as original implementation)
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

/// Contour structure (same as original implementation)
#[derive(Clone)]
struct Contour {
    points: Vec<(f32, f32)>,
    is_hole: bool,
}

/// Find all contours in a binary image (same as original implementation)
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

/// Trace a single contour (same as original implementation with bug fixes)
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
            info!("Contour tracing hit safety limit at {} points, breaking to prevent infinite loop", points.len());
            break;
        }
        
        // Additional termination check - if we've been going in circles
        if points.len() > 10 && points.len() % 100 == 0 {
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

/// Convert contour to SVG path with Bezier curves (same as original implementation)
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

/// Detect corners in a contour (same as original implementation)
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

/// Fit Bezier curves to points between corners (same as original implementation)
fn fit_bezier_curves(points: &[(f32, f32)], _corners: &[usize], _smoothing: f32) -> SvgPath {
    let mut path = SvgPath::new();
    
    // For now, use simple line segments
    // Full Bezier fitting would require more complex least-squares fitting
    path.points = points.to_vec();
    path.closed = true;
    
    path
}

/// Generate SVG from paths (same as original implementation)
fn generate_svg(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art Parallel Path Tracer", "Parallel path-traced vector graphics");
    
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