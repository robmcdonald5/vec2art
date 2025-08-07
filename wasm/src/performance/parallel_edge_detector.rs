use crate::algorithms::{utils, SvgPath};
use crate::error::{Result, Vec2ArtError};
#[cfg(feature = "parallel")]
use crate::performance::{calculate_optimal_chunk_size, get_capabilities, PerfTimer};
use crate::svg_builder::SvgBuilder;
use crate::utils::convolution::{gaussian_blur, non_maximum_suppression};
use crate::{ConversionParameters, EdgeMethod};

#[cfg(not(feature = "parallel"))]
use crate::performance::{get_capabilities, PerfTimer};
use image::{DynamicImage, GrayImage, Luma};
use log::info;
use std::collections::{HashSet, VecDeque};

#[cfg(feature = "parallel")]
use rayon::prelude::*;

pub struct ParallelEdgeDetector;

impl ParallelEdgeDetector {
    /// Optimized convert function that uses parallel processing when available
    pub fn convert_optimized(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        let _timer = PerfTimer::new("ParallelEdgeDetector::convert_optimized");
        let capabilities = get_capabilities();

        match params {
            ConversionParameters::EdgeDetector {
                method,
                threshold_low,
                threshold_high,
                gaussian_sigma,
                simplification,
                min_path_length,
            } => {
                info!("Starting parallel edge detection with method: {:?}", method);
                info!("Using {} threads", capabilities.recommended_thread_count());

                // Convert to grayscale
                let gray = {
                    let _timer = PerfTimer::new("Grayscale conversion");
                    utils::to_grayscale(&image)
                };

                // Apply edge detection based on method
                let edges = match method {
                    EdgeMethod::Canny => canny_edge_detection_parallel(
                        &gray,
                        gaussian_sigma,
                        threshold_low,
                        threshold_high,
                    )?,
                    EdgeMethod::Sobel => sobel_edge_detection_parallel(&gray, threshold_low)?,
                };

                // Trace contours from edge image
                let paths = {
                    let _timer = PerfTimer::new("Contour tracing");
                    trace_contours_parallel(&edges, min_path_length)
                };

                // Simplify paths in parallel
                let simplified_paths = {
                    let _timer = PerfTimer::new("Path simplification");
                    simplify_paths_parallel(paths, simplification)
                };

                // Generate SVG
                let svg = generate_svg(&simplified_paths, image.width(), image.height());

                info!(
                    "Parallel edge detection complete, found {} paths",
                    simplified_paths.len()
                );
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "ParallelEdgeDetector requires EdgeDetector parameters".to_string(),
            )),
        }
    }
}

/// Parallel Canny edge detection implementation
fn canny_edge_detection_parallel(
    image: &GrayImage,
    sigma: f32,
    low_threshold: f32,
    high_threshold: f32,
) -> Result<GrayImage> {
    let _timer = PerfTimer::new("Parallel Canny edge detection");
    info!("Applying parallel Canny edge detection");

    // Step 1: Gaussian blur
    let blurred = {
        let _timer = PerfTimer::new("Gaussian blur");
        gaussian_blur(image, sigma)
    };

    // Step 2: Gradient calculation using parallel Sobel
    let (magnitude, direction) = {
        let _timer = PerfTimer::new("Sobel gradient calculation");
        sobel_edge_detection_parallel_internal(&blurred)
    };

    // Step 3: Non-maximum suppression
    let suppressed = {
        let _timer = PerfTimer::new("Non-maximum suppression");
        non_maximum_suppression(&magnitude, &direction)
    };

    // Step 4: Double thresholding and hysteresis
    let edges = {
        let _timer = PerfTimer::new("Hysteresis thresholding");
        hysteresis_threshold_parallel(&suppressed, low_threshold as u8, high_threshold as u8)
    };

    Ok(edges)
}

/// Parallel Sobel edge detection
fn sobel_edge_detection_parallel(image: &GrayImage, threshold: f32) -> Result<GrayImage> {
    let _timer = PerfTimer::new("Parallel Sobel edge detection");
    info!("Applying parallel Sobel edge detection");

    let (magnitude, _) = sobel_edge_detection_parallel_internal(image);

    // Apply threshold in parallel
    let (width, height) = image.dimensions();
    let mut edges = GrayImage::new(width, height);

    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            let pixels: Vec<_> = magnitude.enumerate_pixels().collect();
            let chunk_size =
                calculate_optimal_chunk_size(pixels.len(), capabilities.recommended_thread_count());

            let results: Vec<_> = pixels
                .par_chunks(chunk_size)
                .map(|chunk| {
                    chunk
                        .iter()
                        .map(|(x, y, pixel)| {
                            let value = if pixel[0] as f32 > threshold { 255 } else { 0 };
                            (*x, *y, Luma([value]))
                        })
                        .collect::<Vec<_>>()
                })
                .collect();

            for chunk in results {
                for (x, y, pixel) in chunk {
                    edges.put_pixel(x, y, pixel);
                }
            }
        } else {
            // Fallback to serial processing
            for (x, y, pixel) in magnitude.enumerate_pixels() {
                let value = if pixel[0] as f32 > threshold { 255 } else { 0 };
                edges.put_pixel(x, y, Luma([value]));
            }
        }
    }

    #[cfg(not(feature = "parallel"))]
    {
        for (x, y, pixel) in magnitude.enumerate_pixels() {
            let value = if pixel[0] as f32 > threshold { 255 } else { 0 };
            edges.put_pixel(x, y, Luma([value]));
        }
    }

    Ok(edges)
}

/// Internal parallel Sobel implementation that returns magnitude and direction
fn sobel_edge_detection_parallel_internal(image: &GrayImage) -> (GrayImage, GrayImage) {
    let (width, height) = image.dimensions();
    let mut magnitude = GrayImage::new(width, height);
    let mut direction = GrayImage::new(width, height);

    // Sobel kernels
    let sobel_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    let sobel_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            // Process rows in parallel
            let row_data: Vec<_> = (1..height - 1).collect();
            let chunk_size = calculate_optimal_chunk_size(
                row_data.len(),
                capabilities.recommended_thread_count(),
            );

            let results: Vec<_> = row_data
                .par_chunks(chunk_size)
                .map(|rows| {
                    let mut local_results = Vec::new();
                    for &y in rows {
                        for x in 1..width - 1 {
                            let (mag, dir) = calculate_sobel_at(image, x, y, &sobel_x, &sobel_y);
                            local_results.push((x, y, mag, dir));
                        }
                    }
                    local_results
                })
                .collect();

            // Collect results
            for chunk in results {
                for (x, y, mag, dir) in chunk {
                    magnitude.put_pixel(x, y, Luma([mag]));
                    direction.put_pixel(x, y, Luma([dir]));
                }
            }
        } else {
            // Fallback to serial processing
            for y in 1..height - 1 {
                for x in 1..width - 1 {
                    let (mag, dir) = calculate_sobel_at(image, x, y, &sobel_x, &sobel_y);
                    magnitude.put_pixel(x, y, Luma([mag]));
                    direction.put_pixel(x, y, Luma([dir]));
                }
            }
        }
    }

    #[cfg(not(feature = "parallel"))]
    {
        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let (mag, dir) = calculate_sobel_at(image, x, y, &sobel_x, &sobel_y);
                magnitude.put_pixel(x, y, Luma([mag]));
                direction.put_pixel(x, y, Luma([dir]));
            }
        }
    }

    (magnitude, direction)
}

/// Calculate Sobel gradient at a specific pixel
fn calculate_sobel_at(
    image: &GrayImage,
    x: u32,
    y: u32,
    sobel_x: &[[i32; 3]; 3],
    sobel_y: &[[i32; 3]; 3],
) -> (u8, u8) {
    let mut gx = 0i32;
    let mut gy = 0i32;

    for (i, row) in sobel_x.iter().enumerate() {
        for (j, &kernel_val) in row.iter().enumerate() {
            let px = (x as i32 + j as i32 - 1) as u32;
            let py = (y as i32 + i as i32 - 1) as u32;
            let pixel_val = image.get_pixel(px, py)[0] as i32;

            gx += kernel_val * pixel_val;
        }
    }

    for (i, row) in sobel_y.iter().enumerate() {
        for (j, &kernel_val) in row.iter().enumerate() {
            let px = (x as i32 + j as i32 - 1) as u32;
            let py = (y as i32 + i as i32 - 1) as u32;
            let pixel_val = image.get_pixel(px, py)[0] as i32;

            gy += kernel_val * pixel_val;
        }
    }

    let magnitude = ((gx * gx + gy * gy) as f32).sqrt().min(255.0) as u8;
    let direction = if gx == 0 {
        0
    } else {
        ((gy as f32 / gx as f32).atan() * 128.0 / std::f32::consts::PI + 128.0) as u8
    };

    (magnitude, direction)
}

/// Parallel hysteresis thresholding for Canny edge detection
fn hysteresis_threshold_parallel(image: &GrayImage, low: u8, high: u8) -> GrayImage {
    let _timer = PerfTimer::new("Parallel hysteresis thresholding");
    let (width, height) = image.dimensions();
    let mut output = GrayImage::new(width, height);
    let mut strong_edges = HashSet::new();
    let mut weak_edges = HashSet::new();

    // Classify pixels as strong, weak, or non-edges
    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            let pixels: Vec<_> = (0..height)
                .flat_map(|y| (0..width).map(move |x| (x, y)))
                .collect();
            let chunk_size =
                calculate_optimal_chunk_size(pixels.len(), capabilities.recommended_thread_count());

            let results: Vec<_> = pixels
                .par_chunks(chunk_size)
                .map(|chunk| {
                    let mut local_strong = Vec::new();
                    let mut local_weak = Vec::new();

                    for &(x, y) in chunk {
                        let pixel = image.get_pixel(x, y)[0];

                        if pixel >= high {
                            local_strong.push((x, y));
                        } else if pixel >= low {
                            local_weak.push((x, y));
                        }
                    }

                    (local_strong, local_weak)
                })
                .collect();

            // Collect results
            for (local_strong, local_weak) in results {
                strong_edges.extend(local_strong);
                weak_edges.extend(local_weak);
            }
        } else {
            // Fallback to serial processing
            for y in 0..height {
                for x in 0..width {
                    let pixel = image.get_pixel(x, y)[0];

                    if pixel >= high {
                        strong_edges.insert((x, y));
                    } else if pixel >= low {
                        weak_edges.insert((x, y));
                    }
                }
            }
        }
    }

    #[cfg(not(feature = "parallel"))]
    {
        for y in 0..height {
            for x in 0..width {
                let pixel = image.get_pixel(x, y)[0];

                if pixel >= high {
                    strong_edges.insert((x, y));
                } else if pixel >= low {
                    weak_edges.insert((x, y));
                }
            }
        }
    }

    // Mark strong edges
    for &(x, y) in &strong_edges {
        output.put_pixel(x, y, Luma([255]));
    }

    // Connect weak edges to strong edges (this part is inherently sequential)
    let mut queue = VecDeque::new();
    for &(x, y) in &strong_edges {
        queue.push_back((x, y));
    }

    let neighbors = [
        (-1, -1),
        (0, -1),
        (1, -1),
        (-1, 0),
        (1, 0),
        (-1, 1),
        (0, 1),
        (1, 1),
    ];

    while let Some((x, y)) = queue.pop_front() {
        for (dx, dy) in &neighbors {
            let nx = (x as i32 + dx) as u32;
            let ny = (y as i32 + dy) as u32;

            if nx < width && ny < height && weak_edges.remove(&(nx, ny)) {
                output.put_pixel(nx, ny, Luma([255]));
                queue.push_back((nx, ny));
            }
        }
    }

    output
}

/// Parallel contour tracing
fn trace_contours_parallel(edges: &GrayImage, min_length: u32) -> Vec<Vec<(f32, f32)>> {
    let _timer = PerfTimer::new("Parallel contour tracing");
    let (width, height) = edges.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut contours = Vec::new();

    // This is a challenging algorithm to parallelize due to the sequential nature of contour following
    // For now, we parallelize the search for starting points and process multiple contours in parallel

    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            // Find all potential starting points first
            let pixels: Vec<_> = (0..height)
                .flat_map(|y| (0..width).map(move |x| (x, y)))
                .collect();
            let chunk_size =
                calculate_optimal_chunk_size(pixels.len(), capabilities.recommended_thread_count());

            let starting_points: Vec<_> = pixels
                .par_chunks(chunk_size)
                .map(|chunk| {
                    chunk
                        .iter()
                        .filter(|&&(x, y)| edges.get_pixel(x, y)[0] > 0)
                        .copied()
                        .collect::<Vec<_>>()
                })
                .collect();

            // Flatten starting points
            let all_starting_points: Vec<_> = starting_points.into_iter().flatten().collect();

            // Process contours (still sequential due to visited array sharing)
            for (x, y) in all_starting_points {
                if !visited[y as usize][x as usize] {
                    let contour = trace_single_contour(edges, &mut visited, x, y);

                    if contour.len() >= min_length as usize {
                        contours.push(contour);
                    }
                }
            }
        } else {
            // Fallback to serial processing
            for y in 0..height {
                for x in 0..width {
                    if edges.get_pixel(x, y)[0] > 0 && !visited[y as usize][x as usize] {
                        let contour = trace_single_contour(edges, &mut visited, x, y);

                        if contour.len() >= min_length as usize {
                            contours.push(contour);
                        }
                    }
                }
            }
        }
    }

    #[cfg(not(feature = "parallel"))]
    {
        for y in 0..height {
            for x in 0..width {
                if edges.get_pixel(x, y)[0] > 0 && !visited[y as usize][x as usize] {
                    let contour = trace_single_contour(edges, &mut visited, x, y);

                    if contour.len() >= min_length as usize {
                        contours.push(contour);
                    }
                }
            }
        }
    }

    contours
}

/// Trace a single contour starting from a given point (same as original implementation)
fn trace_single_contour(
    edges: &GrayImage,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
) -> Vec<(f32, f32)> {
    let (width, height) = edges.dimensions();
    let mut contour = Vec::new();
    let mut queue = VecDeque::new();

    queue.push_back((start_x, start_y));
    visited[start_y as usize][start_x as usize] = true;

    // 8-connected neighborhood
    let neighbors = [
        (-1, -1),
        (0, -1),
        (1, -1),
        (-1, 0),
        (1, 0),
        (-1, 1),
        (0, 1),
        (1, 1),
    ];

    while let Some((x, y)) = queue.pop_front() {
        contour.push((x as f32, y as f32));

        // Find next unvisited edge pixel
        for (dx, dy) in &neighbors {
            let nx = (x as i32 + dx) as u32;
            let ny = (y as i32 + dy) as u32;

            if nx < width && ny < height {
                if edges.get_pixel(nx, ny)[0] > 0 && !visited[ny as usize][nx as usize] {
                    visited[ny as usize][nx as usize] = true;
                    queue.push_back((nx, ny));
                    break; // Follow single path
                }
            }
        }
    }

    contour
}

/// Parallel path simplification using superior Visvalingam-Whyatt algorithm
fn simplify_paths_parallel(paths: Vec<Vec<(f32, f32)>>, epsilon: f32) -> Vec<SvgPath> {
    let _timer = PerfTimer::new("Parallel path simplification with Visvalingam-Whyatt");

    #[cfg(feature = "parallel")]
    {
        let capabilities = get_capabilities();
        if capabilities.can_use_parallel_processing() {
            let chunk_size =
                calculate_optimal_chunk_size(paths.len(), capabilities.recommended_thread_count());

            return paths
                .par_chunks(chunk_size)
                .map(|chunk| {
                    chunk
                        .iter()
                        .map(|points| {
                            let mut path = SvgPath::new();
                            path.points = points.clone();
                            // Use smart simplification with Visvalingam-Whyatt algorithm
                            path.simplify_smart(epsilon);
                            path.stroke_color = Some("#000000".to_string());
                            path.stroke_width = 1.0;
                            path
                        })
                        .collect::<Vec<_>>()
                })
                .collect::<Vec<_>>()
                .into_iter()
                .flatten()
                .collect();
        }
    }

    // Fallback to serial processing with Visvalingam-Whyatt
    paths
        .into_iter()
        .map(|points| {
            let mut path = SvgPath::new();
            path.points = points;
            // Use smart simplification with Visvalingam-Whyatt algorithm
            path.simplify_smart(epsilon);
            path.stroke_color = Some("#000000".to_string());
            path.stroke_width = 1.0;
            path
        })
        .collect()
}

/// Generate SVG from paths (same as original)
fn generate_svg(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata(
            "Vec2Art Parallel Edge Detection",
            "Parallel edge-detected vector graphics",
        )
        .with_background("#ffffff");

    builder.add_paths(paths);

    builder.build()
}
