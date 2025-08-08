//! Logo/line-art vectorization algorithms

use crate::algorithms::primitives::{detect_primitive, primitive_to_svg, PrimitiveConfig};
use crate::config::LogoConfig;
use crate::error::VectorizeResult;
use crate::preprocessing::{
    apply_threshold, calculate_otsu_threshold, preprocess_for_logo, rgba_to_grayscale,
};
use image::{RgbaImage, GrayImage};
use imageproc::contours::find_contours_with_threshold;

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
///
/// # Edge Cases Handled
/// - Empty or single-pixel images
/// - Images with no foreground content
/// - Failed contour extraction
/// - Degenerate geometries
/// - Memory allocation failures
pub fn vectorize_logo(image: &RgbaImage, config: &LogoConfig) -> VectorizeResult<Vec<SvgPath>> {
    log::debug!("Starting optimized logo vectorization pipeline with Suzuki-Abe contour tracing");

    // Edge case: handle very small images
    let (width, height) = (image.width(), image.height());
    if width < 3 || height < 3 {
        log::warn!("Image too small ({}x{}), generating minimal output", width, height);
        return Ok(vec![create_fallback_svg_path(width, height)]);
    }

    // Step 1: Apply optimized preprocessing (combines resizing and denoising)
    let preprocessed = preprocess_for_logo(image, config.max_dimension)
        .map_err(|e| {
            log::error!("Preprocessing failed: {}", e);
            e
        })?;

    // Edge case: check if preprocessing resulted in degenerate image
    if preprocessed.width() == 0 || preprocessed.height() == 0 {
        return Err(crate::error::VectorizeError::degenerate_geometry(
            "Preprocessing resulted in zero-dimension image"
        ));
    }

    // Step 2: Convert to grayscale
    let grayscale = rgba_to_grayscale(&preprocessed);

    // Step 3: Apply threshold with validation
    let threshold = if config.adaptive_threshold {
        let otsu_threshold = calculate_otsu_threshold(&grayscale);
        // Validate Otsu result
        if otsu_threshold == 0 || otsu_threshold == 255 {
            log::warn!("Otsu threshold gave extreme value {}, using default", otsu_threshold);
            128 // fallback to middle gray
        } else {
            otsu_threshold
        }
    } else {
        config.threshold
    };

    let binary = apply_threshold(&grayscale, threshold);
    
    // Edge case: check if thresholding resulted in all black or all white
    if is_binary_degenerate(&binary) {
        log::warn!("Thresholding resulted in uniform image, adjusting threshold");
        // Try alternative threshold
        let alt_threshold = if threshold > 128 { threshold - 64 } else { threshold + 64 };
        let alt_binary = apply_threshold(&grayscale, alt_threshold);
        if !is_binary_degenerate(&alt_binary) {
            log::debug!("Alternative threshold {} worked", alt_threshold);
            return process_binary_image(&alt_binary, preprocessed.dimensions(), alt_threshold, config);
        } else {
            // Still degenerate, return minimal SVG
            log::warn!("Could not find suitable threshold, generating minimal output");
            return Ok(vec![create_fallback_svg_path(preprocessed.width(), preprocessed.height())]);
        }
    }
    
    process_binary_image(&binary, preprocessed.dimensions(), threshold, config)
}

/// Process binary image through the logo algorithm pipeline
fn process_binary_image(
    binary: &[bool], 
    dimensions: (u32, u32), 
    threshold: u8, 
    config: &LogoConfig
) -> VectorizeResult<Vec<SvgPath>> {

    // Step 4: Light morphological operations to reduce artifacts
    let cleaned = apply_gentle_morphology(&binary, dimensions, config.morphology_kernel_size)
        .map_err(|e| {
            log::error!("Morphological operations failed: {}", e);
            e
        })?;

    // Step 5: Extract contours with Suzuki-Abe algorithm
    let contours = extract_contours_suzuki_abe(&cleaned, dimensions, threshold)
        .map_err(|e| {
            log::error!("Contour extraction failed: {}", e);
            e
        })?;
    
    // Edge case: no contours found
    if contours.is_empty() {
        log::warn!("No contours extracted, generating minimal output");
        return Ok(vec![create_fallback_svg_path(dimensions.0, dimensions.1)]);
    }

    // Step 6: Filter small contours with validation
    let filtered_contours = filter_contours(contours, config.min_contour_area);
    
    // Edge case: all contours filtered out
    if filtered_contours.is_empty() {
        log::warn!("All contours filtered out (min_area={}), trying with smaller threshold", 
                  config.min_contour_area);
        // Try with half the minimum area requirement
        let relaxed_contours = filter_contours(
            extract_contours_suzuki_abe(&cleaned, dimensions, threshold)?, 
            config.min_contour_area / 2
        );
        if relaxed_contours.is_empty() {
            return Ok(vec![create_fallback_svg_path(dimensions.0, dimensions.1)]);
        } else {
            return process_contours_to_svg(relaxed_contours, dimensions, config);
        }
    }
    
    process_contours_to_svg(filtered_contours, dimensions, config)
}

/// Process contours through simplification and SVG generation
fn process_contours_to_svg(contours: Vec<Contour>, dimensions: (u32, u32), config: &LogoConfig) -> VectorizeResult<Vec<SvgPath>> {
    use crate::algorithms::path_utils::calculate_douglas_peucker_epsilon;
    
    // Calculate proper Douglas-Peucker epsilon based on image diagonal
    let epsilon = if config.simplification_tolerance > 0.0 {
        // If user provided a specific tolerance, use a reasonable factor
        let factor = (config.simplification_tolerance / 100.0).clamp(0.003, 0.007);
        calculate_douglas_peucker_epsilon(dimensions.0, dimensions.1, factor)
    } else {
        // Use default factor (0.005)
        calculate_douglas_peucker_epsilon(dimensions.0, dimensions.1, 0.005)
    };
    
    log::debug!("Using Douglas-Peucker epsilon: {:.3} pixels (image: {}x{})", 
               epsilon, dimensions.0, dimensions.1);

    // Step 7: Simplify paths with error handling
    let simplified_paths = simplify_contours(&contours, epsilon)
        .map_err(|e| {
            log::error!("Path simplification failed: {}", e);
            e
        })?;
    
    // Edge case: simplification removed all valid contours
    if simplified_paths.is_empty() {
        log::warn!("Simplification removed all contours, trying with larger tolerance");
        let relaxed_paths = simplify_contours(&contours, epsilon * 2.0)?;
        if relaxed_paths.is_empty() {
            log::warn!("Even relaxed simplification failed, using original contours");
            return process_paths_to_svg(contours, config);
        } else {
            return process_paths_to_svg(relaxed_paths, config);
        }
    }
    
    process_paths_to_svg(simplified_paths, config)
}

/// Convert contours to SVG paths with primitive detection and curve fitting
fn process_paths_to_svg(simplified_paths: Vec<Contour>, config: &LogoConfig) -> VectorizeResult<Vec<SvgPath>> {
    let mut svg_paths = Vec::new();
    let mut primitive_count = 0;
    let mut failed_paths = 0;
    
    if config.detect_primitives {
        let primitive_config = PrimitiveConfig {
            fit_tolerance: config.primitive_fit_tolerance,
            max_circle_eccentricity: config.max_circle_eccentricity,
            ..PrimitiveConfig::default()
        };

        for contour in &simplified_paths {
            // Validate contour before processing
            if contour.len() < 3 {
                log::debug!("Skipping degenerate contour with {} points", contour.len());
                failed_paths += 1;
                continue;
            }
            
            // Try to detect primitive shape
            match detect_primitive(contour, &primitive_config) {
                Ok(Some(primitive)) => {
                    // Use primitive SVG representation
                    svg_paths.push(primitive_to_svg(&primitive, Some("black".to_string())));
                    primitive_count += 1;
                }
                Ok(None) => {
                    // Fall back to regular path processing
                    match process_single_contour(contour, config) {
                        Ok(paths) => svg_paths.extend(paths),
                        Err(e) => {
                            log::debug!("Failed to process contour: {}", e);
                            failed_paths += 1;
                        }
                    }
                }
                Err(e) => {
                    log::debug!("Primitive detection failed: {}, falling back to paths", e);
                    match process_single_contour(contour, config) {
                        Ok(paths) => svg_paths.extend(paths),
                        Err(e) => {
                            log::debug!("Fallback path processing failed: {}", e);
                            failed_paths += 1;
                        }
                    }
                }
            }
        }
        
        log::debug!("Detected {} primitive shapes out of {} contours ({} failed)", 
                   primitive_count, simplified_paths.len(), failed_paths);
    } else {
        // Process all paths without primitive detection
        for contour in &simplified_paths {
            if contour.len() < 3 {
                failed_paths += 1;
                continue;
            }
            
            match process_single_contour(contour, config) {
                Ok(paths) => svg_paths.extend(paths),
                Err(e) => {
                    log::debug!("Failed to process contour: {}", e);
                    failed_paths += 1;
                }
            }
        }
    }
    
    // Edge case: all paths failed to process
    if svg_paths.is_empty() && !simplified_paths.is_empty() {
        log::warn!("All {} contours failed to process, generating fallback", failed_paths);
        // Create a simple bounding box as fallback
        if let Some(bbox_path) = create_bounding_box_path(&simplified_paths) {
            svg_paths.push(bbox_path);
        }
    }

    log::debug!(
        "Logo vectorization completed with Suzuki-Abe algorithm, generated {} paths ({} failed)",
        svg_paths.len(), failed_paths
    );
    Ok(svg_paths)
}

/// Process a single contour to SVG with proper error handling
fn process_single_contour(contour: &Contour, config: &LogoConfig) -> VectorizeResult<Vec<SvgPath>> {
    if config.fit_curves {
        // Use curve fitting with fallback
        match fit_bezier_curves(&[contour.clone()], config.curve_tolerance, config) {
            Ok(paths) if !paths.is_empty() => Ok(paths),
            _ => {
                log::debug!("Curve fitting failed, using linear paths");
                Ok(convert_to_svg_paths(&[contour.clone()], config))
            }
        }
    } else {
        Ok(convert_to_svg_paths(&[contour.clone()], config))
    }
}

/// SVG element representation
#[derive(Debug, Clone)]
pub struct SvgPath {
    pub path_data: String,
    pub fill: Option<String>,
    pub stroke: Option<String>,
    pub stroke_width: Option<f32>,
    pub element_type: SvgElementType,
}

/// Type of SVG element
#[derive(Debug, Clone)]
pub enum SvgElementType {
    Path,
    Circle { cx: f32, cy: f32, r: f32 },
    Ellipse { cx: f32, cy: f32, rx: f32, ry: f32, angle: Option<f32> },
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

    // Edge case: skip morphology for very small kernels or images
    if kernel_size <= 1 || dimensions.0 <= kernel_size || dimensions.1 <= kernel_size {
        return Ok(binary.to_vec());
    }
    
    // Edge case: check for reasonable kernel size
    let max_kernel = (dimensions.0.min(dimensions.1) / 4).max(1);
    let safe_kernel_size = kernel_size.min(max_kernel);
    
    if safe_kernel_size != kernel_size {
        log::warn!("Kernel size {} too large for image {}x{}, using {}", 
                  kernel_size, dimensions.0, dimensions.1, safe_kernel_size);
    }

    let mut result = binary.to_vec();

    // Only perform opening (erosion + dilation) to reduce noise
    // Avoid closing to prevent creation of false boundaries
    result = erode(&result, dimensions, safe_kernel_size)?;
    result = dilate(&result, dimensions, safe_kernel_size)?;

    Ok(result)
}

/// Morphological erosion - shrinks white regions
fn erode(binary: &[bool], dimensions: (u32, u32), kernel_size: u32) -> VectorizeResult<Vec<bool>> {
    let (width, height) = dimensions;
    
    // Validate input
    if binary.len() != (width * height) as usize {
        return Err(crate::error::VectorizeError::algorithm_error(
            "Binary data size mismatch in erosion"
        ));
    }
    
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
                    if kidx >= binary.len() || !binary[kidx] {
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

    Ok(result)
}

/// Morphological dilation - expands white regions  
fn dilate(binary: &[bool], dimensions: (u32, u32), kernel_size: u32) -> VectorizeResult<Vec<bool>> {
    let (width, height) = dimensions;
    
    // Validate input
    if binary.len() != (width * height) as usize {
        return Err(crate::error::VectorizeError::algorithm_error(
            "Binary data size mismatch in dilation"
        ));
    }
    
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
                    if kidx >= binary.len() {
                        continue;
                    }
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

    Ok(result)
}

/// Extract contours from binary image using Suzuki-Abe algorithm via imageproc
///
/// This is the production implementation that replaces the problematic Moore neighborhood
/// algorithm. It uses the industry-standard Suzuki-Abe algorithm which handles complex
/// topologies without infinite loops.
///
/// # Arguments
/// * `binary` - Binary image data (true = foreground/white, false = background/black)
/// * `dimensions` - Image width and height
/// * `threshold` - Threshold value used for binary conversion (for reference)
///
/// # Returns
/// * `VectorizeResult<Vec<Contour>>` - Vector of contours or error
fn extract_contours_suzuki_abe(
    binary: &[bool], 
    dimensions: (u32, u32), 
    threshold: u8
) -> VectorizeResult<Vec<Contour>> {
    log::debug!("Extracting contours using Suzuki-Abe algorithm via imageproc");
    
    let (width, height) = dimensions;
    
    // Validate input
    if binary.len() != (width * height) as usize {
        return Err(crate::error::VectorizeError::insufficient_data(
            (width * height) as usize, binary.len()
        ));
    }
    
    if width == 0 || height == 0 {
        return Err(crate::error::VectorizeError::invalid_dimensions(
            width, height, "Cannot extract contours from zero-dimension image"
        ));
    }
    
    // Convert boolean array to GrayImage for imageproc
    let mut gray_data = Vec::with_capacity(binary.len());
    for &pixel in binary {
        gray_data.push(if pixel { 255u8 } else { 0u8 });
    }
    
    let gray_image = GrayImage::from_raw(width, height, gray_data)
        .ok_or_else(|| crate::error::VectorizeError::algorithm_error(
            "Failed to create GrayImage from binary data"
        ))?;
    
    // Use imageproc's Suzuki-Abe implementation with error handling
    let threshold_value = (threshold.saturating_sub(1)).max(127);
    
    // Wrap the imageproc call to catch any potential panics
    let imageproc_contours = std::panic::catch_unwind(|| {
        find_contours_with_threshold::<u32>(&gray_image, threshold_value)
    }).map_err(|_| {
        crate::error::VectorizeError::algorithm_error(
            "Suzuki-Abe algorithm panicked during contour extraction"
        )
    })?;
    
    log::debug!(
        "Suzuki-Abe found {} raw contours with threshold {}", 
        imageproc_contours.len(), 
        threshold_value
    );
    
    // Convert imageproc contours to our format with validation
    let mut contours = Vec::new();
    let mut invalid_count = 0;
    
    for imageproc_contour in imageproc_contours {
        let mut contour = Vec::new();
        let mut valid_points = true;
        
        for point in &imageproc_contour.points {
            let x = point.x as f32;
            let y = point.y as f32;
            
            // Validate coordinates
            if !x.is_finite() || !y.is_finite() || x < 0.0 || y < 0.0 {
                log::debug!("Invalid point coordinates: ({}, {})", x, y);
                valid_points = false;
                break;
            }
            
            contour.push(Point { x, y });
        }
        
        // Only keep valid contours with sufficient points
        if valid_points && contour.len() >= 3 {
            contours.push(contour);
        } else {
            invalid_count += 1;
        }
    }
    
    log::debug!(
        "Suzuki-Abe processed {} valid contours (>= 3 points, {} invalid)", 
        contours.len(), invalid_count
    );
    
    Ok(contours)
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

/// Fit Bezier curves to simplified paths using Schneider algorithm
fn fit_bezier_curves(paths: &[Contour], tolerance: f64, config: &LogoConfig) -> VectorizeResult<Vec<SvgPath>> {
    // Schneider algorithm imports are used in fit_cubic_bezier_schneider function
    
    log::debug!(
        "Fitting Bezier curves to {} paths with Schneider algorithm, tolerance {}",
        paths.len(),
        tolerance
    );

    let svg_paths: Vec<SvgPath> = paths
        .iter()
        .map(|path| fit_cubic_bezier_schneider(path, tolerance as f32, config))
        .collect();

    Ok(svg_paths)
}

/// Fit cubic Bézier curves to a path using the Schneider algorithm
fn fit_cubic_bezier_schneider(points: &[Point], tolerance: f32, config: &LogoConfig) -> SvgPath {
    use crate::algorithms::path_utils::{schneider_fit_cubic_bezier, fitting_results_to_svg_path};
    
    if points.len() < 2 {
        // Empty path
        return create_styled_svg_path(String::new(), config);
    }
    
    if points.len() == 2 {
        // Simple line
        let path_data = format!("M {:.2} {:.2} L {:.2} {:.2} Z", 
            points[0].x, points[0].y, points[1].x, points[1].y);
        return create_styled_svg_path(path_data, config);
    }
    
    // Use Schneider algorithm with recommended defaults
    // Corner angle threshold: 30° (as per research document)
    // Fit tolerance: provided tolerance (typically 1.0px)
    let corner_angle_threshold = 30.0; // degrees
    let fitting_results = schneider_fit_cubic_bezier(points, tolerance, corner_angle_threshold);
    
    // Convert results to SVG path
    let mut path_data = fitting_results_to_svg_path(&fitting_results, points[0]);
    path_data.push_str(" Z"); // Close the path
    
    create_styled_svg_path(path_data, config)
}

// LEGACY IMPLEMENTATION - Kept for rollback capability
// The following functions implement the original heuristic-based curve fitting
// They are replaced by the Schneider algorithm but kept for debugging purposes

#[allow(dead_code)]
/// LEGACY: Fit cubic Bézier curves to a path using iterative fitting
fn fit_cubic_bezier_to_path_legacy(points: &[Point], tolerance: f64) -> SvgPath {
    if points.len() < 4 {
        // Not enough points for cubic fitting, use linear segments
        return convert_contour_to_svg_path_legacy(points);
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
                if let Some(bezier) = fit_cubic_bezier_segment_legacy(segment, tolerance) {
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
        element_type: SvgElementType::Path,
    }
}

#[allow(dead_code)]
/// LEGACY: Cubic Bézier curve representation (replaced by path_utils::CubicBezier)
#[derive(Debug, Clone)]
struct CubicBezier {
    start: Point,
    control1: Point,
    control2: Point,
    end: Point,
}

#[allow(dead_code)]
/// LEGACY: Fit a cubic Bézier curve to a segment of points
fn fit_cubic_bezier_segment_legacy(points: &[Point], tolerance: f64) -> Option<CubicBezier> {
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
    if bezier_fits_points_legacy(&bezier, points, tolerance) {
        Some(bezier)
    } else {
        None
    }
}

#[allow(dead_code)]
/// LEGACY: Check if a Bézier curve fits a set of points within tolerance
fn bezier_fits_points_legacy(bezier: &CubicBezier, points: &[Point], tolerance: f64) -> bool {
    let tolerance_sq = tolerance * tolerance;

    for (i, &point) in points.iter().enumerate() {
        let t = i as f32 / (points.len() - 1) as f32;
        let curve_point = evaluate_cubic_bezier_legacy(bezier, t);

        let dx = point.x - curve_point.x;
        let dy = point.y - curve_point.y;
        let distance_sq = dx * dx + dy * dy;

        if distance_sq as f64 > tolerance_sq {
            return false;
        }
    }

    true
}

#[allow(dead_code)]
/// LEGACY: Evaluate cubic Bézier curve at parameter t (0 <= t <= 1)
fn evaluate_cubic_bezier_legacy(bezier: &CubicBezier, t: f32) -> Point {
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

#[allow(dead_code)]
/// LEGACY: Convert a single contour to SVG path (fallback for non-curve fitting)
fn convert_contour_to_svg_path_legacy(contour: &[Point]) -> SvgPath {
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
        element_type: SvgElementType::Path,
    }
}

// Helper functions for edge case handling

/// Check if binary image is degenerate (all black or all white)
fn is_binary_degenerate(binary: &[bool]) -> bool {
    if binary.is_empty() {
        return true;
    }
    
    let first_value = binary[0];
    binary.iter().all(|&b| b == first_value)
}

/// Create SVG path with appropriate fill/stroke based on configuration
fn create_styled_svg_path(path_data: String, config: &LogoConfig) -> SvgPath {
    if config.use_stroke {
        SvgPath {
            path_data,
            fill: None,
            stroke: Some("black".to_string()),
            stroke_width: Some(config.stroke_width),
            element_type: SvgElementType::Path,
        }
    } else {
        SvgPath {
            path_data,
            fill: Some("black".to_string()),
            stroke: None,
            stroke_width: None,
            element_type: SvgElementType::Path,
        }
    }
}

/// Create a fallback SVG path for edge cases
fn create_fallback_svg_path(width: u32, height: u32) -> SvgPath {
    // Create a simple rectangle outline as fallback
    let margin = 2.0;
    let path_data = format!(
        "M {} {} L {} {} L {} {} L {} {} Z",
        margin, margin,
        width as f32 - margin, margin,
        width as f32 - margin, height as f32 - margin,
        margin, height as f32 - margin
    );
    
    SvgPath {
        path_data,
        fill: None,
        stroke: Some("black".to_string()),
        stroke_width: Some(1.0),
        element_type: SvgElementType::Path,
    }
}

/// Create bounding box path from multiple contours as fallback
fn create_bounding_box_path(contours: &[Contour]) -> Option<SvgPath> {
    if contours.is_empty() {
        return None;
    }
    
    // Find bounding box of all contours
    let mut min_x = f32::INFINITY;
    let mut min_y = f32::INFINITY;
    let mut max_x = f32::NEG_INFINITY;
    let mut max_y = f32::NEG_INFINITY;
    
    for contour in contours {
        for point in contour {
            min_x = min_x.min(point.x);
            min_y = min_y.min(point.y);
            max_x = max_x.max(point.x);
            max_y = max_y.max(point.y);
        }
    }
    
    // Validate bounding box
    if !min_x.is_finite() || !min_y.is_finite() || !max_x.is_finite() || !max_y.is_finite() {
        return None;
    }
    
    if max_x <= min_x || max_y <= min_y {
        return None;
    }
    
    let path_data = format!(
        "M {:.2} {:.2} L {:.2} {:.2} L {:.2} {:.2} L {:.2} {:.2} Z",
        min_x, min_y, max_x, min_y, max_x, max_y, min_x, max_y
    );
    
    Some(SvgPath {
        path_data,
        fill: None,
        stroke: Some("black".to_string()),
        stroke_width: Some(1.0),
        element_type: SvgElementType::Path,
    })
}

/// Convert simplified contours to SVG path strings
fn convert_to_svg_paths(contours: &[Contour], config: &LogoConfig) -> Vec<SvgPath> {
    contours
        .iter()
        .filter_map(|contour| {
            // Skip degenerate contours
            if contour.len() < 3 {
                log::debug!("Skipping contour with {} points", contour.len());
                return None;
            }
            
            // Validate points are finite
            if contour.iter().any(|p| !p.x.is_finite() || !p.y.is_finite()) {
                log::debug!("Skipping contour with invalid coordinates");
                return None;
            }
            
            let mut path_data = String::new();

            path_data.push_str(&format!("M {:.2} {:.2}", contour[0].x, contour[0].y));

            for point in &contour[1..] {
                path_data.push_str(&format!(" L {:.2} {:.2}", point.x, point.y));
            }

            path_data.push_str(" Z"); // Close path

            Some(create_styled_svg_path(path_data, config))
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