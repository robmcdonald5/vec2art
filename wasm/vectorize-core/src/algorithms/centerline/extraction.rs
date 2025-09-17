//! Polyline extraction strategies from skeletons

use super::ExtractionStrategy;
use crate::algorithms::Point;
use crate::error::VectorizeError;
use image::GrayImage;
use std::collections::VecDeque;

/// Junction-aware extraction (current improved implementation)
#[derive(Debug, Default)]
pub struct JunctionAwareExtraction;

impl ExtractionStrategy for JunctionAwareExtraction {
    fn extract_polylines(&self, skeleton: &GrayImage) -> Result<Vec<Vec<Point>>, VectorizeError> {
        Ok(extract_skeleton_polylines_improved(skeleton))
    }

    fn name(&self) -> &'static str {
        "JunctionAware"
    }
}

/// Direction-aware extraction with tangent preservation (research recommended)
#[derive(Debug, Default)]
pub struct DirectionAwareExtraction {
    pub junction_priority_bias: f32,
}

impl DirectionAwareExtraction {
    pub fn new(junction_priority_bias: f32) -> Self {
        Self {
            junction_priority_bias,
        }
    }
}

impl ExtractionStrategy for DirectionAwareExtraction {
    fn extract_polylines(&self, skeleton: &GrayImage) -> Result<Vec<Vec<Point>>, VectorizeError> {
        Ok(extract_direction_aware_polylines(
            skeleton,
            self.junction_priority_bias,
        ))
    }

    fn name(&self) -> &'static str {
        "DirectionAware"
    }
}

/// Simple breadth-first extraction (fallback)
#[derive(Debug, Default)]
pub struct SimpleExtraction;

impl ExtractionStrategy for SimpleExtraction {
    fn extract_polylines(&self, skeleton: &GrayImage) -> Result<Vec<Vec<Point>>, VectorizeError> {
        Ok(extract_simple_polylines(skeleton))
    }

    fn name(&self) -> &'static str {
        "Simple"
    }
}

/// Parallel extraction for high-performance scenarios
#[derive(Debug, Default)]
pub struct ParallelExtraction;

impl ExtractionStrategy for ParallelExtraction {
    fn extract_polylines(&self, skeleton: &GrayImage) -> Result<Vec<Vec<Point>>, VectorizeError> {
        // TODO: Implement parallel version in Phase 3
        Ok(extract_skeleton_polylines_improved(skeleton))
    }

    fn name(&self) -> &'static str {
        "Parallel"
    }
}

// Pixel classification for skeleton analysis
#[derive(Debug, Clone, Copy, PartialEq)]
enum PixelType {
    Background,
    Endpoint,
    Regular,
    Junction,
}

// Implementation functions

fn extract_skeleton_polylines_improved(skeleton: &GrayImage) -> Vec<Vec<Point>> {
    let (width, height) = skeleton.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();

    // Classify all skeleton pixels
    let pixel_types = classify_skeleton_pixels(skeleton);

    // Start from endpoints and trace paths
    for y in 0..height {
        for x in 0..width {
            if !visited[y as usize][x as usize]
                && pixel_types[y as usize][x as usize] == PixelType::Endpoint
            {
                let polyline = trace_from_endpoint(skeleton, &mut visited, &pixel_types, x, y);
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    // Handle remaining unvisited skeleton pixels (isolated segments, loops)
    for y in 0..height {
        for x in 0..width {
            if !visited[y as usize][x as usize] && skeleton.get_pixel(x, y).0[0] > 0 {
                let polyline = trace_from_point(skeleton, &mut visited, x, y);
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    polylines
}

fn extract_direction_aware_polylines(skeleton: &GrayImage, junction_bias: f32) -> Vec<Vec<Point>> {
    let (width, height) = skeleton.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();

    // Classify all skeleton pixels
    let pixel_types = classify_skeleton_pixels(skeleton);

    // Start from endpoints and trace paths with direction awareness
    for y in 0..height {
        for x in 0..width {
            if !visited[y as usize][x as usize]
                && pixel_types[y as usize][x as usize] == PixelType::Endpoint
            {
                let polyline = trace_direction_aware(
                    skeleton,
                    &mut visited,
                    &pixel_types,
                    x,
                    y,
                    junction_bias,
                );
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    // Handle remaining unvisited skeleton pixels
    for y in 0..height {
        for x in 0..width {
            if !visited[y as usize][x as usize] && skeleton.get_pixel(x, y).0[0] > 0 {
                let polyline = trace_from_point(skeleton, &mut visited, x, y);
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    polylines
}

fn extract_simple_polylines(skeleton: &GrayImage) -> Vec<Vec<Point>> {
    let (width, height) = skeleton.dimensions();
    let mut visited = vec![vec![false; width as usize]; height as usize];
    let mut polylines = Vec::new();

    for y in 0..height {
        for x in 0..width {
            if !visited[y as usize][x as usize] && skeleton.get_pixel(x, y).0[0] > 0 {
                let polyline = trace_simple_path(skeleton, &mut visited, x, y);
                if polyline.len() >= 2 {
                    polylines.push(polyline);
                }
            }
        }
    }

    polylines
}

fn classify_skeleton_pixels(skeleton: &GrayImage) -> Vec<Vec<PixelType>> {
    let (width, height) = skeleton.dimensions();
    let mut types = vec![vec![PixelType::Background; width as usize]; height as usize];

    for y in 0..height {
        for x in 0..width {
            if skeleton.get_pixel(x, y).0[0] > 0 {
                let neighbor_count = count_skeleton_neighbors(skeleton, x, y);
                types[y as usize][x as usize] = match neighbor_count {
                    0 => PixelType::Background, // Isolated pixel
                    1 => PixelType::Endpoint,
                    2 => PixelType::Regular,
                    _ => PixelType::Junction,
                };
            }
        }
    }

    types
}

fn count_skeleton_neighbors(skeleton: &GrayImage, x: u32, y: u32) -> usize {
    let (width, height) = skeleton.dimensions();
    let mut count = 0;

    for dy in -1..=1 {
        for dx in -1..=1 {
            if dx == 0 && dy == 0 {
                continue;
            }

            let nx = x as i32 + dx;
            let ny = y as i32 + dy;

            if nx >= 0
                && ny >= 0
                && (nx as u32) < width
                && (ny as u32) < height
                && skeleton.get_pixel(nx as u32, ny as u32).0[0] > 0
            {
                count += 1;
            }
        }
    }

    count
}

fn trace_from_endpoint(
    skeleton: &GrayImage,
    visited: &mut [Vec<bool>],
    pixel_types: &[Vec<PixelType>],
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut current = (start_x as i32, start_y as i32);
    let (width, height) = skeleton.dimensions();

    let in_bounds =
        |x: i32, y: i32| -> bool { x >= 0 && y >= 0 && (x as u32) < width && (y as u32) < height };

    let is_skeleton = |x: i32, y: i32| -> bool {
        in_bounds(x, y) && skeleton.get_pixel(x as u32, y as u32).0[0] > 0
    };

    loop {
        let (x, y) = current;

        if visited[y as usize][x as usize] {
            break;
        }

        visited[y as usize][x as usize] = true;
        path.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Find next unvisited skeleton neighbor
        let mut next = None;
        let mut best_priority = -1.0;

        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let nx = x + dx;
                let ny = y + dy;

                if !in_bounds(nx, ny) || !is_skeleton(nx, ny) {
                    continue;
                }
                if visited[ny as usize][nx as usize] {
                    continue;
                }

                // Priority: prefer continuing straight paths, avoid junctions unless necessary
                let pixel_type = pixel_types[ny as usize][nx as usize];
                let priority = match pixel_type {
                    PixelType::Regular => 3.0,
                    PixelType::Endpoint => 2.0,
                    PixelType::Junction => 1.0,
                    PixelType::Background => 0.0,
                };

                if priority > best_priority {
                    best_priority = priority;
                    next = Some((nx, ny));
                }
            }
        }

        match next {
            Some((nx, ny)) => current = (nx, ny),
            None => break,
        }
    }

    path
}

fn trace_direction_aware(
    skeleton: &GrayImage,
    visited: &mut [Vec<bool>],
    pixel_types: &[Vec<PixelType>],
    start_x: u32,
    start_y: u32,
    junction_bias: f32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut current = (start_x as i32, start_y as i32);
    let mut previous_direction: Option<(i32, i32)> = None;
    let (width, height) = skeleton.dimensions();

    let in_bounds =
        |x: i32, y: i32| -> bool { x >= 0 && y >= 0 && (x as u32) < width && (y as u32) < height };

    let is_skeleton = |x: i32, y: i32| -> bool {
        in_bounds(x, y) && skeleton.get_pixel(x as u32, y as u32).0[0] > 0
    };

    // Forbid diagonal corner hops without orthogonal support
    let diagonal_ok = |x: i32, y: i32, dx: i32, dy: i32| -> bool {
        if dx == 0 || dy == 0 {
            return true;
        } // Not diagonal
        is_skeleton(x + dx, y) || is_skeleton(x, y + dy)
    };

    loop {
        let (x, y) = current;

        if visited[y as usize][x as usize] {
            break;
        }

        visited[y as usize][x as usize] = true;
        path.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Collect valid neighbor candidates
        let mut candidates = Vec::new();
        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let nx = x + dx;
                let ny = y + dy;

                if !in_bounds(nx, ny) || !is_skeleton(nx, ny) {
                    continue;
                }
                if visited[ny as usize][nx as usize] {
                    continue;
                }
                if !diagonal_ok(x, y, dx, dy) {
                    continue;
                }

                candidates.push((nx, ny, dx, dy));
            }
        }

        if candidates.is_empty() {
            break;
        }

        // Select best candidate based on direction continuity and junction avoidance
        let next = if let Some((prev_dx, prev_dy)) = previous_direction {
            // Find candidate that best continues the current direction
            candidates.into_iter().max_by(|a, b| {
                // Calculate direction alignment (dot product)
                let dot_a = a.2 * prev_dx + a.3 * prev_dy;
                let dot_b = b.2 * prev_dx + b.3 * prev_dy;

                let alignment_a = dot_a as f32;
                let alignment_b = dot_b as f32;

                // Bias against junctions
                let junction_penalty_a =
                    if pixel_types[a.1 as usize][a.0 as usize] == PixelType::Junction {
                        junction_bias
                    } else {
                        0.0
                    };
                let junction_penalty_b =
                    if pixel_types[b.1 as usize][b.0 as usize] == PixelType::Junction {
                        junction_bias
                    } else {
                        0.0
                    };

                let score_a = alignment_a - junction_penalty_a;
                let score_b = alignment_b - junction_penalty_b;

                score_a
                    .partial_cmp(&score_b)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
        } else {
            // First step: prefer neighbor with most skeleton connections (main trunk)
            candidates.into_iter().max_by_key(|(nx, ny, _, _)| {
                count_skeleton_neighbors(skeleton, *nx as u32, *ny as u32)
            })
        };

        match next {
            Some((nx, ny, dx, dy)) => {
                previous_direction = Some((dx, dy));
                current = (nx, ny);
            }
            None => break,
        }
    }

    path
}

fn trace_from_point(
    skeleton: &GrayImage,
    visited: &mut [Vec<bool>],
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = Vec::new();
    let mut queue = VecDeque::new();
    let (width, height) = skeleton.dimensions();

    queue.push_back((start_x as i32, start_y as i32));

    while let Some((x, y)) = queue.pop_front() {
        if visited[y as usize][x as usize] {
            continue;
        }

        visited[y as usize][x as usize] = true;
        path.push(Point {
            x: x as f32,
            y: y as f32,
        });

        // Add unvisited skeleton neighbors to queue
        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let nx = x + dx;
                let ny = y + dy;

                if nx >= 0
                    && ny >= 0
                    && (nx as u32) < width
                    && (ny as u32) < height
                    && skeleton.get_pixel(nx as u32, ny as u32).0[0] > 0
                    && !visited[ny as usize][nx as usize]
                {
                    queue.push_back((nx, ny));
                }
            }
        }
    }

    path
}

fn trace_simple_path(
    skeleton: &GrayImage,
    visited: &mut [Vec<bool>],
    start_x: u32,
    start_y: u32,
) -> Vec<Point> {
    let mut path = vec![Point {
        x: start_x as f32,
        y: start_y as f32,
    }];
    let mut current = (start_x as i32, start_y as i32);
    let (width, height) = skeleton.dimensions();

    visited[start_y as usize][start_x as usize] = true;

    loop {
        let (x, y) = current;
        let mut next = None;

        // Find first unvisited skeleton neighbor
        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let nx = x + dx;
                let ny = y + dy;

                if nx >= 0
                    && ny >= 0
                    && (nx as u32) < width
                    && (ny as u32) < height
                    && skeleton.get_pixel(nx as u32, ny as u32).0[0] > 0
                    && !visited[ny as usize][nx as usize]
                {
                    next = Some((nx, ny));
                    break;
                }
            }
            if next.is_some() {
                break;
            }
        }

        match next {
            Some((nx, ny)) => {
                visited[ny as usize][nx as usize] = true;
                path.push(Point {
                    x: nx as f32,
                    y: ny as f32,
                });
                current = (nx, ny);
            }
            None => break,
        }
    }

    path
}
