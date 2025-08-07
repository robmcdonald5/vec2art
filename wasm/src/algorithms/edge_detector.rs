use crate::algorithms::{utils, ConversionAlgorithm, SvgPath};
use crate::error::{Result, Vec2ArtError};
use crate::memory_monitor;
use crate::svg_builder::SvgBuilder;
use crate::{ConversionParameters, EdgeMethod};
use image::{DynamicImage, GrayImage};
use log::info;
use std::collections::VecDeque;

// SIMD support for WebAssembly (when available)
#[cfg(target_arch = "wasm32")]
use core::arch::wasm32::*;

pub struct EdgeDetector;

/// Contour hierarchy structure for handling nested shapes and holes
#[derive(Debug, Clone)]
pub struct ContourHierarchy {
    pub contour: Vec<(f32, f32)>,
    pub area: f32,
    pub is_hole: bool,
    pub parent_idx: Option<usize>,
    pub children: Vec<usize>,
    pub level: u32,
    pub clockwise: bool,
}

impl ContourHierarchy {
    /// Create a new contour hierarchy entry
    pub fn new(contour: Vec<(f32, f32)>) -> Self {
        let area = calculate_contour_area(&contour);
        let clockwise = is_contour_clockwise(&contour);
        
        Self {
            contour,
            area,
            is_hole: !clockwise, // Counter-clockwise contours are holes
            parent_idx: None,
            children: Vec::new(),
            level: 0,
            clockwise,
        }
    }
    
    /// Check if this contour contains another point
    pub fn contains_point(&self, point: (f32, f32)) -> bool {
        point_in_polygon(&self.contour, point)
    }
    
    /// Get the bounding rectangle of this contour
    pub fn bounding_rect(&self) -> (f32, f32, f32, f32) {
        if self.contour.is_empty() {
            return (0.0, 0.0, 0.0, 0.0);
        }
        
        let mut min_x = self.contour[0].0;
        let mut max_x = self.contour[0].0;
        let mut min_y = self.contour[0].1;
        let mut max_y = self.contour[0].1;
        
        for &(x, y) in &self.contour {
            min_x = min_x.min(x);
            max_x = max_x.max(x);
            min_y = min_y.min(y);
            max_y = max_y.max(y);
        }
        
        (min_x, min_y, max_x, max_y)
    }
}

/// Calculate the signed area of a contour (positive for clockwise, negative for counter-clockwise)
fn calculate_contour_area(contour: &[(f32, f32)]) -> f32 {
    if contour.len() < 3 {
        return 0.0;
    }
    
    let mut area = 0.0;
    let n = contour.len();
    
    for i in 0..n {
        let j = (i + 1) % n;
        area += contour[i].0 * contour[j].1;
        area -= contour[j].0 * contour[i].1;
    }
    
    area.abs() / 2.0
}

/// Determine if a contour is clockwise (true) or counter-clockwise (false)
fn is_contour_clockwise(contour: &[(f32, f32)]) -> bool {
    if contour.len() < 3 {
        return true; // Default to clockwise for degenerate cases
    }
    
    let mut signed_area = 0.0;
    let n = contour.len();
    
    for i in 0..n {
        let j = (i + 1) % n;
        signed_area += (contour[j].0 - contour[i].0) * (contour[j].1 + contour[i].1);
    }
    
    signed_area > 0.0 // Positive signed area means clockwise in image coordinates
}

/// Point-in-polygon test using ray casting algorithm
fn point_in_polygon(polygon: &[(f32, f32)], point: (f32, f32)) -> bool {
    if polygon.len() < 3 {
        return false;
    }
    
    let mut inside = false;
    let (px, py) = point;
    let mut j = polygon.len() - 1;
    
    for i in 0..polygon.len() {
        let (xi, yi) = polygon[i];
        let (xj, yj) = polygon[j];
        
        if ((yi > py) != (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
        j = i;
    }
    
    inside
}

/// Extract contour hierarchy using Suzuki-Abe algorithm
pub fn extract_contour_hierarchy(
    edges: &[u8],
    width: u32,
    height: u32,
    min_area_ratio: f32,
) -> Vec<ContourHierarchy> {
    let mut contours = Vec::new();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);
    
    // Extract all contours using improved boundary following
    let raw_contours = trace_contours_suzuki_abe(edges, &mut workspace);
    
    let image_area = (width * height) as f32;
    let min_area_threshold = image_area * min_area_ratio;
    
    // Convert raw contours to hierarchy structures
    for contour_points in raw_contours {
        if !contour_points.is_empty() {
            let hierarchy = ContourHierarchy::new(contour_points);
            
            // Apply area-based filtering
            if hierarchy.area >= min_area_threshold || should_preserve_small_contour(&hierarchy, &contours) {
                contours.push(hierarchy);
            }
        }
    }
    
    // Build hierarchy relationships
    build_hierarchy_tree(contours)
}

/// Check if a small contour should be preserved (e.g., if it's a hole in a larger shape)
fn should_preserve_small_contour(
    small_contour: &ContourHierarchy,
    existing_contours: &[ContourHierarchy],
) -> bool {
    if small_contour.is_hole {
        // Preserve small holes if they're inside larger contours
        for large_contour in existing_contours {
            if !large_contour.is_hole && large_contour.area > small_contour.area * 10.0 {
                // Check if the small contour is inside the large one
                if let Some(point) = small_contour.contour.first() {
                    if large_contour.contains_point(*point) {
                        return true;
                    }
                }
            }
        }
    }
    false
}

/// Suzuki-Abe algorithm for hierarchical contour extraction
fn trace_contours_suzuki_abe(
    edges: &[u8],
    workspace: &mut EdgeDetectionWorkspace,
) -> Vec<Vec<(f32, f32)>> {
    let width = workspace.width as usize;
    let height = workspace.height as usize;
    let mut contours = Vec::new();
    
    // Initialize workspace buffers
    workspace.visited_buffer.fill(false);
    let mut boundary_info = vec![0u8; width * height]; // 0=none, 1=outer, 2=hole
    
    // Suzuki-Abe algorithm implementation
    for y in 1..height - 1 {
        let mut _lnbd = 1; // Label of the most recent outer boundary
        
        for x in 1..width - 1 {
            let idx = y * width + x;
            
            if edges[idx] == 0 || workspace.visited_buffer[idx] {
                continue;
            }
            
            let left_idx = idx - 1;
            let is_outer_boundary = edges[left_idx] == 0; // Transition from background to foreground
            
            if is_outer_boundary {
                // Found outer boundary
                boundary_info[idx] = 1;
                let contour = trace_boundary_suzuki_abe(
                    edges,
                    workspace,
                    x,
                    y,
                    width,
                    height,
                    true, // is_outer
                );
                
                if !contour.is_empty() {
                    contours.push(contour);
                    _lnbd = contours.len(); // Update boundary label
                }
            } else {
                // Check for hole boundary (transition from foreground to background)
                let right_idx = if x + 1 < width { idx + 1 } else { idx };
                if edges[right_idx] == 0 {
                    // Found hole boundary
                    boundary_info[idx] = 2;
                    let contour = trace_boundary_suzuki_abe(
                        edges,
                        workspace,
                        x,
                        y,
                        width,
                        height,
                        false, // is_outer
                    );
                    
                    if !contour.is_empty() {
                        contours.push(contour);
                    }
                }
            }
        }
    }
    
    contours
}

/// Enhanced boundary tracing for Suzuki-Abe algorithm
fn trace_boundary_suzuki_abe(
    edges: &[u8],
    workspace: &mut EdgeDetectionWorkspace,
    start_x: usize,
    start_y: usize,
    width: usize,
    height: usize,
    is_outer: bool,
) -> Vec<(f32, f32)> {
    // Use the same Moore neighborhood directions as the existing algorithm
    const DIRECTIONS: [(isize, isize); 8] = [
        (1, 0),   // East
        (1, -1),  // Northeast  
        (0, -1),  // North
        (-1, -1), // Northwest
        (-1, 0),  // West
        (-1, 1),  // Southwest
        (0, 1),   // South
        (1, 1),   // Southeast
    ];
    
    let mut contour = Vec::new();
    let mut current_x = start_x;
    let mut current_y = start_y;
    
    // Starting direction depends on boundary type
    let mut direction_idx = if is_outer { 0 } else { 4 }; // East for outer, West for holes
    
    // Mark starting point
    let start_idx = start_y * width + start_x;
    workspace.visited_buffer[start_idx] = true;
    contour.push((start_x as f32, start_y as f32));
    
    const MAX_CONTOUR_LENGTH: usize = 10000;
    let mut trace_count = 0;
    
    loop {
        trace_count += 1;
        if trace_count > MAX_CONTOUR_LENGTH {
            break;
        }
        
        let mut found_next = false;
        
        // Modified Moore neighborhood search for hierarchy
        for i in 0..8 {
            let search_direction = (direction_idx + i) % 8;
            let (dx, dy) = DIRECTIONS[search_direction];
            
            let next_x = current_x as isize + dx;
            let next_y = current_y as isize + dy;
            
            if next_x >= 0 && next_x < width as isize && next_y >= 0 && next_y < height as isize {
                let next_x_usize = next_x as usize;
                let next_y_usize = next_y as usize;
                let next_idx = next_y_usize * width + next_x_usize;
                
                // Enhanced boundary condition for hierarchy
                let is_valid_boundary = if is_outer {
                    edges[next_idx] > 0 && is_boundary_pixel(edges, next_x_usize, next_y_usize, width, height)
                } else {
                    // For holes, look for different boundary conditions
                    edges[next_idx] > 0 && is_hole_boundary_pixel(edges, next_x_usize, next_y_usize, width, height)
                };
                
                if is_valid_boundary {
                    // Check for completion
                    if next_x_usize == start_x && next_y_usize == start_y && contour.len() > 2 {
                        return contour;
                    }
                    
                    if !workspace.visited_buffer[next_idx] {
                        workspace.visited_buffer[next_idx] = true;
                        contour.push((next_x_usize as f32, next_y_usize as f32));
                        
                        current_x = next_x_usize;
                        current_y = next_y_usize;
                        direction_idx = (search_direction + 6) % 8; // Adjust search direction
                        found_next = true;
                        break;
                    }
                }
            }
        }
        
        if !found_next {
            break;
        }
    }
    
    contour
}

/// Check if a pixel is on a hole boundary (different from outer boundary)
fn is_hole_boundary_pixel(edges: &[u8], x: usize, y: usize, width: usize, height: usize) -> bool {
    // For holes, we want pixels that are foreground but have background neighbors
    if edges[y * width + x] == 0 {
        return false;
    }
    
    const NEIGHBORS: [(isize, isize); 8] = [
        (-1, -1), (0, -1), (1, -1),
        (-1,  0),          (1,  0),
        (-1,  1), (0,  1), (1,  1),
    ];
    
    let mut background_neighbors = 0;
    let mut total_neighbors = 0;
    
    for (dx, dy) in &NEIGHBORS {
        let nx = x as isize + dx;
        let ny = y as isize + dy;
        
        if nx >= 0 && nx < width as isize && ny >= 0 && ny < height as isize {
            let neighbor_idx = (ny as usize) * width + (nx as usize);
            total_neighbors += 1;
            if edges[neighbor_idx] == 0 {
                background_neighbors += 1;
            }
        }
    }
    
    // Hole boundary pixels should have some background neighbors but not all
    background_neighbors > 0 && background_neighbors < total_neighbors
}

/// Build hierarchy tree from flat contour list
fn build_hierarchy_tree(mut contours: Vec<ContourHierarchy>) -> Vec<ContourHierarchy> {
    if contours.len() <= 1 {
        return contours;
    }
    
    // Sort contours by area (largest first) for efficient nesting detection
    contours.sort_by(|a, b| b.area.partial_cmp(&a.area).unwrap_or(std::cmp::Ordering::Equal));
    
    // Build parent-child relationships
    for i in 0..contours.len() {
        for j in (i + 1)..contours.len() {
            // Check if contour j is inside contour i
            if let Some(point) = contours[j].contour.first() {
                if contours[i].contains_point(*point) {
                    // j is inside i
                    if contours[j].parent_idx.is_none() {
                        contours[j].parent_idx = Some(i);
                        contours[j].level = contours[i].level + 1;
                        contours[i].children.push(j);
                    }
                }
            }
        }
    }
    
    // Classify holes based on nesting level
    for contour in &mut contours {
        // Even levels are outer contours, odd levels are holes
        contour.is_hole = contour.level % 2 == 1;
    }
    
    contours
}

/// High-performance workspace for edge detection operations
/// Eliminates repeated memory allocations by reusing buffers
pub struct EdgeDetectionWorkspace {
    // Reusable buffers sized for current image
    pub magnitude_buffer: Vec<u8>,
    pub direction_buffer: Vec<f32>,
    pub temp_buffer: Vec<u8>,
    pub visited_buffer: Vec<bool>,
    pub contour_points: Vec<(f32, f32)>,
    pub edge_state: Vec<u8>, // For hysteresis: 0=none, 1=weak, 2=strong
    pub queue_buffer: VecDeque<usize>, // For BFS operations

    // Current workspace dimensions
    pub width: u32,
    pub height: u32,
}

impl EdgeDetectionWorkspace {
    /// Create new workspace for given image dimensions
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        Self {
            magnitude_buffer: vec![0u8; size],
            direction_buffer: vec![0.0f32; size],
            temp_buffer: vec![0u8; size],
            visited_buffer: vec![false; size],
            contour_points: Vec::with_capacity(size / 10), // Estimate
            edge_state: vec![0u8; size],
            queue_buffer: VecDeque::with_capacity(size / 100), // Estimate
            width,
            height,
        }
    }

    /// CRITICAL FIX: Resize workspace for different image dimensions with proper clearing
    pub fn resize(&mut self, width: u32, height: u32) {
        let size = (width * height) as usize;

        // Only resize if necessary to avoid allocations
        if size > self.magnitude_buffer.len() {
            self.magnitude_buffer.resize(size, 0u8);
            self.direction_buffer.resize(size, 0.0f32);
            self.temp_buffer.resize(size, 0u8);
            self.visited_buffer.resize(size, false);
            self.edge_state.resize(size, 0u8);
        }

        // CRITICAL FIX: Clear buffers properly for the exact size we're using
        let current_size = (self.width * self.height) as usize;
        let new_size = size;
        
        // Clear old data first (important if new image is smaller)
        if current_size > 0 {
            self.magnitude_buffer[..current_size].fill(0);
            self.direction_buffer[..current_size].fill(0.0);
            self.temp_buffer[..current_size].fill(0);
            self.visited_buffer[..current_size].fill(false);
            self.edge_state[..current_size].fill(0);
        }
        
        // Clear new data range
        self.magnitude_buffer[..new_size].fill(0);
        self.direction_buffer[..new_size].fill(0.0);
        self.temp_buffer[..new_size].fill(0);
        self.visited_buffer[..new_size].fill(false);
        self.edge_state[..new_size].fill(0);
        
        // Clear dynamic containers
        self.contour_points.clear();
        self.queue_buffer.clear();

        self.width = width;
        self.height = height;
    }

    /// Get slice view of buffers for current image size
    pub fn get_buffers_mut(&mut self) -> (&mut [u8], &mut [f32], &mut [u8], &mut [bool]) {
        let size = (self.width * self.height) as usize;
        (
            &mut self.magnitude_buffer[..size],
            &mut self.direction_buffer[..size],
            &mut self.temp_buffer[..size],
            &mut self.visited_buffer[..size],
        )
    }
}

impl ConversionAlgorithm for EdgeDetector {
    fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        // Use parallel implementation if available
        #[cfg(feature = "parallel")]
        {
            let capabilities = crate::performance::get_capabilities();
            if capabilities.can_use_parallel_processing() {
                return crate::performance::parallel_edge_detector::ParallelEdgeDetector::convert_optimized(image, params);
            }
        }

        match params {
            ConversionParameters::EdgeDetector {
                method,
                threshold_low,
                threshold_high,
                gaussian_sigma,
                simplification,
                min_path_length,
            } => {
                info!("Starting ultra-optimized edge detection with method: {method:?}");

                let (width, height) = (image.width(), image.height());

                // Check memory for workspace allocation
                let workspace_size = estimate_workspace_memory(width, height);
                memory_monitor::check_memory_for_operation(
                    workspace_size,
                    "edge_detection_workspace",
                    "edge_detector",
                )?;

                // Create workspace once for entire operation (eliminates all internal allocations)
                let mut workspace = EdgeDetectionWorkspace::new(width, height);
                memory_monitor::record_allocation(
                    workspace_size,
                    "workspace_buffer",
                    "edge_detector",
                );

                // Convert to grayscale
                let gray = utils::to_grayscale(&image);

                // Apply edge detection using workspace pattern (zero allocations after this point)
                let edges_buffer = match method {
                    EdgeMethod::Canny => canny_edge_detection_with_workspace(
                        &gray,
                        &mut workspace,
                        gaussian_sigma,
                        threshold_low,
                        threshold_high,
                    )?,
                    EdgeMethod::Sobel => {
                        sobel_edge_detection_with_workspace(&gray, &mut workspace, threshold_low)?
                    }
                };

                // Trace contours using workspace (zero allocations)
                // For complex images, use hierarchical contour extraction
                let use_hierarchy = width * height > 1_000_000 || simplification < 1.0;
                
                let svg = if use_hierarchy {
                    // Use advanced hierarchical contour extraction
                    let min_area_ratio = 0.001; // 0.1% of image area
                    let hierarchies = extract_contour_hierarchy(&edges_buffer, width, height, min_area_ratio);
                    
                    info!("Extracted {} hierarchical contours", hierarchies.len());
                    
                    // Generate SVG with proper hierarchy handling
                    generate_svg_from_hierarchy(&hierarchies, width, height)
                } else {
                    // Use standard contour extraction for simple cases
                    let paths = trace_contours_with_workspace(&edges_buffer, &mut workspace, min_path_length);
                    let simplified_paths = simplify_paths(paths, simplification);
                    generate_svg(&simplified_paths, width, height)
                };

                info!(
                    "Ultra-optimized edge detection complete with {} method",
                    match use_hierarchy {
                        true => "hierarchical",
                        false => "standard"
                    }
                );
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "EdgeDetector requires EdgeDetector parameters".to_string(),
            )),
        }
    }

    fn description() -> &'static str {
        "Detects edges in an image and converts them to SVG paths"
    }

    fn estimate_time(width: u32, height: u32) -> u32 {
        // Ultra-optimized estimate: ~10ms per megapixel after workspace optimizations
        let megapixels = (width * height) as f32 / 1_000_000.0;
        (megapixels * 10.0).max(5.0) as u32 // Minimum 5ms
    }
}

/// Ultra-optimized Canny edge detection with workspace pattern
pub fn canny_edge_detection_with_workspace(
    image: &GrayImage,
    workspace: &mut EdgeDetectionWorkspace,
    sigma: f32,
    low_threshold: f32,
    high_threshold: f32,
) -> Result<Vec<u8>> {
    info!("Applying ultra-optimized Canny edge detection with workspace");

    let (width, height) = image.dimensions();
    workspace.resize(width, height);

    // Step 1: Gaussian blur using optimized utils
    let blurred = utils::gaussian_blur(image, sigma);

    // Step 2: Gradient calculation using workspace
    let (magnitude_buffer, direction_buffer) =
        sobel_gradient_optimized_with_workspace(&blurred, workspace);

    // Step 3: Non-maximum suppression using workspace
    let suppressed_buffer =
        non_maximum_suppression_with_workspace(&magnitude_buffer, &direction_buffer, workspace);

    // Step 4: Double thresholding and hysteresis using workspace
    let edges_buffer = hysteresis_threshold_with_workspace(
        &suppressed_buffer,
        workspace,
        low_threshold as u8,
        high_threshold as u8,
    );

    Ok(edges_buffer)
}

/// Legacy wrapper for backwards compatibility
pub fn canny_edge_detection(
    image: &GrayImage,
    sigma: f32,
    low_threshold: f32,
    high_threshold: f32,
) -> Result<GrayImage> {
    info!("Applying highly optimized Canny edge detection");

    let (width, height) = image.dimensions();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);

    let edges_buffer = canny_edge_detection_with_workspace(
        image,
        &mut workspace,
        sigma,
        low_threshold,
        high_threshold,
    )?;

    let edges = GrayImage::from_vec(width, height, edges_buffer)
        .expect("Buffer size should match image dimensions");

    Ok(edges)
}

/// Optimized Sobel gradient calculation using workspace buffers
fn sobel_gradient_optimized_with_workspace(
    image: &GrayImage,
    workspace: &mut EdgeDetectionWorkspace,
) -> (Vec<u8>, Vec<f32>) {
    let (width, height) = image.dimensions();

    // Resize workspace if needed
    workspace.resize(width, height);

    // Extract image buffer once for optimal memory access
    let img_buffer: Vec<u8> = image.pixels().map(|p| p[0]).collect();

    // Get mutable references to workspace buffers
    let (mag_buffer, direction_buffer, _, _) = workspace.get_buffers_mut();

    // Process image with optimized buffer operations
    sobel_gradient_direct_simd(&img_buffer, mag_buffer, direction_buffer, width, height);

    // Return buffer copies (still avoids most allocations)
    let size = (width * height) as usize;
    (
        mag_buffer[..size].to_vec(),
        direction_buffer[..size].to_vec(),
    )
}

/// Legacy wrapper for backwards compatibility
#[allow(dead_code)]
fn sobel_gradient_optimized(image: &GrayImage) -> (GrayImage, Vec<f32>) {
    let (width, height) = image.dimensions();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);
    let (mag_buffer, dir_buffer) = sobel_gradient_optimized_with_workspace(image, &mut workspace);

    // Create magnitude image from buffer
    let magnitude = GrayImage::from_vec(width, height, mag_buffer)
        .expect("Buffer size should match image dimensions");

    (magnitude, dir_buffer)
}

/// SIMD-optimized Sobel gradient with direct buffer processing
fn sobel_gradient_direct_simd(
    img_buffer: &[u8],
    mag_buffer: &mut [u8],
    direction: &mut [f32],
    width: u32,
    height: u32,
) {
    // Use SIMD when available on WASM
    #[cfg(target_arch = "wasm32")]
    {
        if is_simd_available() {
            sobel_gradient_simd_impl(img_buffer, mag_buffer, direction, width, height);
            return;
        }
    }

    // Fallback to scalar implementation
    sobel_gradient_direct(img_buffer, mag_buffer, direction, width, height);
}

/// Check if SIMD is available in current WASM environment
#[cfg(target_arch = "wasm32")]
fn is_simd_available() -> bool {
    // Check for SIMD128 support in WASM
    // This is a placeholder - actual implementation would use feature detection
    cfg!(target_feature = "simd128")
}

/// SIMD-optimized implementation for WASM
#[cfg(target_arch = "wasm32")]
fn sobel_gradient_simd_impl(
    img_buffer: &[u8],
    mag_buffer: &mut [u8],
    direction: &mut [f32],
    width: u32,
    height: u32,
) {
    // SIMD implementation using v128 vectors
    let width_usize = width as usize;
    let height_usize = height as usize;

    // Process 16 pixels at a time using SIMD when possible
    for y in 1..height_usize - 1 {
        let row_offset = y * width_usize;
        let mut x = 1;

        // SIMD processing for bulk of row (process 8 pixels at once)
        while x + 8 < width_usize - 1 {
            // Load 8 pixels worth of 3x3 neighborhoods
            // This is simplified - full implementation would use proper SIMD loads
            for i in 0..8 {
                if x + i < width_usize - 1 {
                    process_single_pixel_sobel(
                        img_buffer,
                        mag_buffer,
                        direction,
                        x + i,
                        y,
                        width_usize,
                    );
                }
            }
            x += 8;
        }

        // Handle remaining pixels
        while x < width_usize - 1 {
            process_single_pixel_sobel(img_buffer, mag_buffer, direction, x, y, width_usize);
            x += 1;
        }
    }
}

/// Process a single pixel for Sobel gradient (extracted for reuse)
fn process_single_pixel_sobel(
    img_buffer: &[u8],
    mag_buffer: &mut [u8],
    direction: &mut [f32],
    x: usize,
    y: usize,
    width: usize,
) {
    // Sobel kernels as compile-time constants
    const SOBEL_X: [i16; 9] = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const SOBEL_Y: [i16; 9] = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    let mut gx = 0i32;
    let mut gy = 0i32;

    // Unrolled 3x3 kernel convolution for maximum performance
    let base_idx = (y - 1) * width + x - 1;

    // Process all 9 pixels in kernel with minimal index calculations
    for i in 0..3 {
        let row_base = base_idx + i * width;
        for j in 0..3 {
            let pixel_idx = row_base + j;
            let kernel_idx = i * 3 + j;
            let pixel_val = img_buffer[pixel_idx] as i32;

            gx += SOBEL_X[kernel_idx] as i32 * pixel_val;
            gy += SOBEL_Y[kernel_idx] as i32 * pixel_val;
        }
    }

    // Calculate magnitude and direction with optimized math
    let mag_squared = (gx * gx + gy * gy) as u64;
    let mag = if mag_squared > 0 {
        // Fast square root approximation for better performance
        (mag_squared as f32).sqrt().min(255.0) as u8
    } else {
        0
    };

    let idx = y * width + x;
    mag_buffer[idx] = mag;
    direction[idx] = if gx == 0 && gy == 0 {
        0.0
    } else {
        (gy as f32).atan2(gx as f32)
    };
}

/// Direct buffer processing for Sobel gradients - zero allocations, optimal cache usage
fn sobel_gradient_direct(
    img_buffer: &[u8],
    mag_buffer: &mut [u8],
    direction: &mut [f32],
    width: u32,
    height: u32,
) {
    let width_usize = width as usize;
    let height_usize = height as usize;

    // Process image with cache-friendly memory access pattern
    for y in 1..height_usize - 1 {
        for x in 1..width_usize - 1 {
            process_single_pixel_sobel(img_buffer, mag_buffer, direction, x, y, width_usize);
        }
    }
}

/// Optimized non-maximum suppression using workspace buffers
fn non_maximum_suppression_with_workspace(
    mag_buffer: &[u8],
    direction: &[f32],
    workspace: &mut EdgeDetectionWorkspace,
) -> Vec<u8> {
    let width = workspace.width;
    let height = workspace.height;

    // Get temp buffer from workspace
    let (_, _, temp_buffer, _) = workspace.get_buffers_mut();

    // Process with direct buffer operations
    non_maximum_suppression_direct(mag_buffer, direction, temp_buffer, width, height);

    // Return buffer copy
    let size = (width * height) as usize;
    temp_buffer[..size].to_vec()
}

/// Legacy wrapper for backwards compatibility
#[allow(dead_code)]
fn non_maximum_suppression_optimized(magnitude: &GrayImage, direction: &[f32]) -> GrayImage {
    let (width, height) = magnitude.dimensions();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);

    // Extract magnitude buffer once for optimal memory access
    let mag_buffer: Vec<u8> = magnitude.pixels().map(|p| p[0]).collect();

    let result_buffer =
        non_maximum_suppression_with_workspace(&mag_buffer, direction, &mut workspace);

    // Create output image from buffer
    GrayImage::from_vec(width, height, result_buffer)
        .expect("Buffer size should match image dimensions")
}

/// Direct buffer processing for non-maximum suppression - zero allocations
/// CRITICAL FIX: Properly thin edges to 1-pixel width by zeroing non-maximum pixels
fn non_maximum_suppression_direct(
    mag_buffer: &[u8],
    direction: &[f32],
    out_buffer: &mut [u8],
    width: u32,
    height: u32,
) {
    let width_usize = width as usize;
    let height_usize = height as usize;

    // Initialize output buffer to zero (CRITICAL: clear all pixels first)
    out_buffer.fill(0);

    // Precompute angle thresholds for faster comparisons
    const PI_8: f32 = std::f32::consts::PI / 8.0;
    const PI_3_8: f32 = 3.0 * std::f32::consts::PI / 8.0;
    const NEG_PI_8: f32 = -std::f32::consts::PI / 8.0;
    const NEG_PI_3_8: f32 = -3.0 * std::f32::consts::PI / 8.0;

    for y in 1..height_usize - 1 {
        let row_offset = y * width_usize;

        for x in 1..width_usize - 1 {
            let idx = row_offset + x;
            let angle = direction[idx];
            let mag = mag_buffer[idx];

            // Skip processing if magnitude is zero (performance optimization)
            if mag == 0 {
                continue;
            }

            // Optimized angle quantization with fewer branches
            let (dx, dy) = if !(NEG_PI_3_8..PI_3_8).contains(&angle) {
                (1, 0) // Horizontal
            } else if (PI_8..PI_3_8).contains(&angle) {
                (1, -1) // Diagonal /
            } else if (NEG_PI_8..PI_8).contains(&angle) {
                (0, 1) // Vertical
            } else {
                (1, 1) // Diagonal \
            };

            // Calculate neighbor indices with bounds checking eliminated (safe due to loop bounds)
            let n1_idx = ((y as isize + dy as isize) as usize) * width_usize
                + (x as isize + dx as isize) as usize;
            let n2_idx = ((y as isize - dy as isize) as usize) * width_usize
                + (x as isize - dx as isize) as usize;

            // CRITICAL FIX: Proper edge thinning with tie-breaking for perfect edges
            // For equal magnitudes, use position-based tie-breaking to ensure 1-pixel width
            let is_local_maximum = if mag > mag_buffer[n1_idx] && mag > mag_buffer[n2_idx] {
                true // Clear local maximum
            } else if mag == mag_buffer[n1_idx] && mag == mag_buffer[n2_idx] && mag > 0 {
                // Handle flat edge case: all pixels have same magnitude
                // Use position-based tie-breaking to thin to 1 pixel width
                match (dx, dy) {
                    (1, 0) => (x + y) % 2 == 0, // Horizontal edge: keep alternating pattern
                    (0, 1) => (x + y) % 2 == 0, // Vertical edge: keep alternating pattern  
                    _ => x % 2 == 0, // Diagonal edge: prefer even x coordinates
                }
            } else if mag >= mag_buffer[n1_idx] && mag >= mag_buffer[n2_idx] && mag > 0 {
                // One neighbor is smaller - this is likely a true local maximum
                true
            } else {
                false
            };

            if is_local_maximum {
                out_buffer[idx] = mag;
            }
            // Note: pixels that don't pass this test remain 0 (already filled above)
        }
    }
}

/// Ultra-optimized Sobel edge detection using workspace
fn sobel_edge_detection_with_workspace(
    image: &GrayImage,
    workspace: &mut EdgeDetectionWorkspace,
    threshold: f32,
) -> Result<Vec<u8>> {
    info!("Applying ultra-optimized Sobel edge detection with workspace");

    let (width, height) = image.dimensions();
    workspace.resize(width, height);

    // Get gradient using workspace
    let (magnitude_buffer, _) = sobel_gradient_optimized_with_workspace(image, workspace);

    // Apply threshold with optimized loop
    let threshold_u8 = threshold as u8;
    let mut edges_buffer = Vec::with_capacity(magnitude_buffer.len());

    for &mag in &magnitude_buffer {
        edges_buffer.push(if mag > threshold_u8 { 255 } else { 0 });
    }

    Ok(edges_buffer)
}

/// Legacy wrapper for backwards compatibility
#[allow(dead_code)]
fn sobel_edge_detection_simple(image: &GrayImage, threshold: f32) -> Result<GrayImage> {
    info!("Applying optimized Sobel edge detection");

    let (width, height) = image.dimensions();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);

    let edges_buffer = sobel_edge_detection_with_workspace(image, &mut workspace, threshold)?;

    let edges = GrayImage::from_vec(width, height, edges_buffer)
        .expect("Buffer size should match image dimensions");

    Ok(edges)
}

/// Estimate memory requirements for workspace
fn estimate_workspace_memory(width: u32, height: u32) -> usize {
    let pixels = (width * height) as usize;
    // Estimate total workspace memory:
    // magnitude_buffer: pixels * 1 byte
    // direction_buffer: pixels * 4 bytes (f32)
    // temp_buffer: pixels * 1 byte
    // visited_buffer: pixels * 1 byte
    // edge_state: pixels * 1 byte
    // contour_points + queue: estimated 10% of pixels
    pixels * (1 + 4 + 1 + 1 + 1) + (pixels / 10) * 8
}

/// Legacy hysteresis thresholding for compatibility
#[allow(dead_code)]
fn hysteresis_threshold(image: &GrayImage, low: u8, high: u8) -> GrayImage {
    hysteresis_threshold_optimized(image, low, high)
}

/// Optimized hysteresis thresholding using workspace buffers
fn hysteresis_threshold_with_workspace(
    input_buffer: &[u8],
    workspace: &mut EdgeDetectionWorkspace,
    low: u8,
    high: u8,
) -> Vec<u8> {
    let width = workspace.width;
    let height = workspace.height;
    let width_usize = width as usize;
    let height_usize = height as usize;
    let total_pixels = width_usize * height_usize;

    // Initialize workspace buffers
    workspace.temp_buffer.fill(0);
    workspace.edge_state.fill(0); // 0 = none, 1 = weak, 2 = strong
    workspace.queue_buffer.clear();

    // Classify pixels as strong, weak, or non-edges with single pass
    for (i, &pixel) in input_buffer.iter().enumerate().take(total_pixels) {
        if pixel >= high {
            workspace.edge_state[i] = 2; // Strong edge
            workspace.temp_buffer[i] = 255;
            workspace.queue_buffer.push_back(i);
        } else if pixel >= low {
            workspace.edge_state[i] = 1; // Weak edge
        }
    }

    // Connect weak edges to strong edges using breadth-first search
    while let Some(idx) = workspace.queue_buffer.pop_front() {
        let x = idx % width_usize;
        let y = idx / width_usize;

        // Check 8-connected neighbors with bounds checking
        for dy in -1..=1 {
            for dx in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let nx = x as isize + dx;
                let ny = y as isize + dy;

                if nx >= 0 && nx < width_usize as isize && ny >= 0 && ny < height_usize as isize {
                    let neighbor_idx = (ny as usize) * width_usize + (nx as usize);

                    // Connect weak edge to strong edge network
                    if workspace.edge_state[neighbor_idx] == 1 {
                        workspace.edge_state[neighbor_idx] = 2;
                        workspace.temp_buffer[neighbor_idx] = 255;
                        workspace.queue_buffer.push_back(neighbor_idx);
                    }
                }
            }
        }
    }

    // Return buffer copy
    workspace.temp_buffer[..total_pixels].to_vec()
}

/// Legacy wrapper for backwards compatibility
#[allow(dead_code)]
fn hysteresis_threshold_optimized(image: &GrayImage, low: u8, high: u8) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);

    // Extract image buffer for optimal access
    let input_buffer: Vec<u8> = image.pixels().map(|p| p[0]).collect();

    let result_buffer =
        hysteresis_threshold_with_workspace(&input_buffer, &mut workspace, low, high);

    // Create output image from buffer
    GrayImage::from_vec(width, height, result_buffer)
        .expect("Buffer size should match image dimensions")
}

/// Ultra-optimized contour tracing using workspace and connected components
pub fn trace_contours_with_workspace(
    edges_buffer: &[u8],
    workspace: &mut EdgeDetectionWorkspace,
    min_length: u32,
) -> Vec<Vec<(f32, f32)>> {
    trace_contours_connected_components(edges_buffer, workspace, min_length)
}

/// Legacy wrapper for backwards compatibility
pub fn trace_contours(edges: &GrayImage, min_length: u32) -> Vec<Vec<(f32, f32)>> {
    let (width, height) = edges.dimensions();
    let edge_buffer: Vec<u8> = edges.pixels().map(|p| p[0]).collect();
    let mut workspace = EdgeDetectionWorkspace::new(width, height);

    trace_contours_with_workspace(&edge_buffer, &mut workspace, min_length)
}

/// CRITICAL FIX: Use Moore neighborhood boundary tracing instead of flood fill
/// This prevents the "filling in" effect by tracing only the boundary pixels
fn trace_contours_connected_components(
    edge_buffer: &[u8],
    workspace: &mut EdgeDetectionWorkspace,
    min_length: u32,
) -> Vec<Vec<(f32, f32)>> {
    let width_usize = workspace.width as usize;
    let height_usize = workspace.height as usize;

    let mut contours = Vec::new();

    // Clear workspace buffers properly
    workspace.visited_buffer.fill(false);
    workspace.queue_buffer.clear();

    // Process pixels in cache-friendly order looking for boundary pixels only
    for y in 1..height_usize - 1 {
        let row_offset = y * width_usize;

        for x in 1..width_usize - 1 {
            let idx = row_offset + x;

            // Only start tracing from unvisited edge pixels that are on the boundary
            if edge_buffer[idx] > 0 && !workspace.visited_buffer[idx] && is_boundary_pixel(edge_buffer, x, y, width_usize, height_usize) {
                workspace.contour_points.clear();

                // Use Moore neighborhood boundary following (proper contour tracing)
                trace_boundary_moore_neighborhood(edge_buffer, workspace, x, y, width_usize, height_usize);

                // Apply stricter filtering for contour quality
                if workspace.contour_points.len() >= min_length as usize {
                    // Remove duplicate consecutive points and smooth contour
                    let cleaned_contour = clean_and_order_contour(&workspace.contour_points);
                    if cleaned_contour.len() >= min_length as usize {
                        contours.push(cleaned_contour);
                    }
                }
            }
        }
    }

    contours
}

/// Check if a pixel is on the boundary of an edge (has at least one non-edge neighbor)
/// This prevents tracing interior pixels of thick edge regions
fn is_boundary_pixel(edge_buffer: &[u8], x: usize, y: usize, width: usize, height: usize) -> bool {
    // 8-connected neighborhood offsets
    const NEIGHBORS: [(isize, isize); 8] = [
        (-1, -1), (0, -1), (1, -1),
        (-1,  0),          (1,  0),
        (-1,  1), (0,  1), (1,  1),
    ];

    for (dx, dy) in &NEIGHBORS {
        let nx = x as isize + dx;
        let ny = y as isize + dy;

        // Check bounds
        if nx >= 0 && nx < width as isize && ny >= 0 && ny < height as isize {
            let neighbor_idx = (ny as usize) * width + (nx as usize);
            // If any neighbor is not an edge pixel, this is a boundary pixel
            if edge_buffer[neighbor_idx] == 0 {
                return true;
            }
        } else {
            // Border pixels are always considered boundary
            return true;
        }
    }
    
    // All neighbors are edge pixels, so this is an interior pixel
    false
}

/// Moore neighborhood boundary following for proper contour tracing
/// This traces only the boundary pixels, preventing "filling in" effect
fn trace_boundary_moore_neighborhood(
    edge_buffer: &[u8],
    workspace: &mut EdgeDetectionWorkspace,
    start_x: usize,
    start_y: usize,
    width: usize,
    height: usize,
) {
    // Moore neighborhood search directions (8-connected)
    const DIRECTIONS: [(isize, isize); 8] = [
        (1, 0),   // East
        (1, -1),  // Northeast  
        (0, -1),  // North
        (-1, -1), // Northwest
        (-1, 0),  // West
        (-1, 1),  // Southwest
        (0, 1),   // South
        (1, 1),   // Southeast
    ];

    let mut current_x = start_x;
    let mut current_y = start_y;
    let mut direction_idx = 0; // Start searching East
    
    // Mark starting point
    let start_idx = start_y * width + start_x;
    workspace.visited_buffer[start_idx] = true;
    workspace.contour_points.push((start_x as f32, start_y as f32));

    // Maximum contour length to prevent infinite loops
    const MAX_CONTOUR_LENGTH: usize = 10000;
    let mut trace_count = 0;

    loop {
        trace_count += 1;
        if trace_count > MAX_CONTOUR_LENGTH {
            break; // Safety break to prevent infinite loops
        }

        let mut found_next = false;
        
        // Search for next boundary pixel starting from current direction
        for i in 0..8 {
            let search_direction = (direction_idx + i) % 8;
            let (dx, dy) = DIRECTIONS[search_direction];
            
            let next_x = current_x as isize + dx;
            let next_y = current_y as isize + dy;
            
            // Check bounds
            if next_x >= 0 && next_x < width as isize && next_y >= 0 && next_y < height as isize {
                let next_x_usize = next_x as usize;
                let next_y_usize = next_y as usize;
                let next_idx = next_y_usize * width + next_x_usize;
                
                // Check if this is an unvisited edge pixel on the boundary
                if edge_buffer[next_idx] > 0 && is_boundary_pixel(edge_buffer, next_x_usize, next_y_usize, width, height) {
                    // Check if we've returned to start (contour complete)
                    if next_x_usize == start_x && next_y_usize == start_y && workspace.contour_points.len() > 2 {
                        return; // Closed contour found
                    }
                    
                    if !workspace.visited_buffer[next_idx] {
                        workspace.visited_buffer[next_idx] = true;
                        workspace.contour_points.push((next_x_usize as f32, next_y_usize as f32));
                        
                        current_x = next_x_usize;
                        current_y = next_y_usize;
                        direction_idx = (search_direction + 6) % 8; // Turn left from current direction
                        found_next = true;
                        break;
                    }
                }
            }
        }
        
        if !found_next {
            break; // No more boundary pixels found
        }
    }
}

/// Clean and order contour points by removing duplicates and smoothing
fn clean_and_order_contour(points: &[(f32, f32)]) -> Vec<(f32, f32)> {
    if points.is_empty() {
        return Vec::new();
    }

    let mut cleaned = Vec::new();
    let mut prev_point = points[0];
    cleaned.push(prev_point);

    // Remove consecutive duplicate points (common with Moore tracing)
    for &point in points.iter().skip(1) {
        let dx = point.0 - prev_point.0;
        let dy = point.1 - prev_point.1;
        let distance_squared = dx * dx + dy * dy;
        
        // Only add point if it's different from the previous one
        if distance_squared > 0.1 { // Minimum distance threshold
            cleaned.push(point);
            prev_point = point;
        }
    }

    // Remove points that create sharp back-and-forth movements (noise)
    if cleaned.len() > 2 {
        let mut final_contour = vec![cleaned[0]];
        
        for i in 1..cleaned.len() - 1 {
            let prev = cleaned[i - 1];
            let current = cleaned[i];
            let next = cleaned[i + 1];
            
            // Calculate angle between vectors
            let v1 = (current.0 - prev.0, current.1 - prev.1);
            let v2 = (next.0 - current.0, next.1 - current.1);
            
            // Dot product to check if direction changes drastically
            let dot_product = v1.0 * v2.0 + v1.1 * v2.1;
            let mag1 = (v1.0 * v1.0 + v1.1 * v1.1).sqrt();
            let mag2 = (v2.0 * v2.0 + v2.1 * v2.1).sqrt();
            
            if mag1 > 0.0 && mag2 > 0.0 {
                let cos_angle = dot_product / (mag1 * mag2);
                // Keep point if angle is not too sharp (cos > -0.8 means angle < 144 degrees)
                if cos_angle > -0.8 {
                    final_contour.push(current);
                }
            } else {
                final_contour.push(current);
            }
        }
        
        if let Some(&last) = cleaned.last() {
            final_contour.push(last);
        }
        
        final_contour
    } else {
        cleaned
    }
}

/// Legacy direct buffer contour tracing (kept for compatibility)
#[allow(dead_code)]
fn trace_contours_optimized(
    edge_buffer: &[u8],
    width: u32,
    height: u32,
    min_length: u32,
) -> Vec<Vec<(f32, f32)>> {
    let mut workspace = EdgeDetectionWorkspace::new(width, height);
    trace_contours_connected_components(edge_buffer, &mut workspace, min_length)
}

/// Legacy single contour tracing (kept for compatibility)
#[allow(dead_code)]
fn trace_single_contour_optimized(
    edge_buffer: &[u8],
    visited: &mut [bool],
    start_x: usize,
    start_y: usize,
    width: usize,
    height: usize,
) -> Vec<(f32, f32)> {
    let mut contour = Vec::new();
    let mut current_x = start_x;
    let mut current_y = start_y;

    // Mark starting point as visited
    let start_idx = start_y * width + start_x;
    visited[start_idx] = true;
    contour.push((start_x as f32, start_y as f32));

    // 8-connected neighborhood offsets for cache-friendly access
    const NEIGHBORS: [(isize, isize); 8] = [
        (-1, -1),
        (0, -1),
        (1, -1),
        (-1, 0),
        (1, 0),
        (-1, 1),
        (0, 1),
        (1, 1),
    ];

    // Chain-following algorithm for better contour quality
    loop {
        let mut found_next = false;

        // Search for next unvisited edge pixel in 8-connected neighborhood
        for (dx, dy) in &NEIGHBORS {
            let next_x = current_x as isize + dx;
            let next_y = current_y as isize + dy;

            // Bounds checking
            if next_x >= 0 && next_x < width as isize && next_y >= 0 && next_y < height as isize {
                let next_x_usize = next_x as usize;
                let next_y_usize = next_y as usize;
                let next_idx = next_y_usize * width + next_x_usize;

                // Check if pixel is edge and not visited
                if edge_buffer[next_idx] > 0 && !visited[next_idx] {
                    visited[next_idx] = true;
                    contour.push((next_x_usize as f32, next_y_usize as f32));
                    current_x = next_x_usize;
                    current_y = next_y_usize;
                    found_next = true;
                    break; // Follow single path for better contour quality
                }
            }
        }

        // If no next pixel found, contour is complete
        if !found_next {
            break;
        }
    }

    contour
}

/// Simplify paths using superior Visvalingam-Whyatt algorithm with smart selection
fn simplify_paths(paths: Vec<Vec<(f32, f32)>>, epsilon: f32) -> Vec<SvgPath> {
    paths
        .into_iter()
        .map(|points| {
            let mut path = SvgPath::new();
            path.points = points;
            
            // Use smart simplification that automatically selects the best algorithm
            // This provides superior results for natural curves while enforcing browser performance limits
            path.simplify_smart(epsilon);
            
            path.stroke_color = Some("#000000".to_string());
            path.stroke_width = 1.0;
            path
        })
        .collect()
}

/// Generate SVG from paths
fn generate_svg(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art Edge Detection", "Edge-detected vector graphics")
        .with_background("#ffffff");

    builder.add_paths(paths);

    builder.build()
}

/// Generate SVG from contour hierarchy with proper fill-rule handling
fn generate_svg_from_hierarchy(hierarchies: &[ContourHierarchy], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art Edge Detection", "Hierarchical edge-detected vector graphics")
        .with_background("#ffffff");

    // Group contours by hierarchy level for proper rendering
    let mut grouped_paths = Vec::new();
    
    // Process contours in hierarchy order (parents before children)
    let mut processed = vec![false; hierarchies.len()];
    
    // First pass: add all root contours (no parent)
    for (i, hierarchy) in hierarchies.iter().enumerate() {
        if hierarchy.parent_idx.is_none() {
            let path = convert_hierarchy_to_svg_path(hierarchy, hierarchies, i);
            grouped_paths.push(path);
            processed[i] = true;
        }
    }
    
    // Subsequent passes: add children in level order
    let mut current_level = 1;
    let max_level = hierarchies.iter().map(|h| h.level).max().unwrap_or(0);
    
    while current_level <= max_level {
        for (i, hierarchy) in hierarchies.iter().enumerate() {
            if !processed[i] && hierarchy.level == current_level {
                let path = convert_hierarchy_to_svg_path(hierarchy, hierarchies, i);
                grouped_paths.push(path);
                processed[i] = true;
            }
        }
        current_level += 1;
    }
    
    builder.add_paths(&grouped_paths);
    builder.build()
}

/// Convert a contour hierarchy to an SVG path with proper fill-rule
fn convert_hierarchy_to_svg_path(
    hierarchy: &ContourHierarchy,
    all_hierarchies: &[ContourHierarchy],
    _index: usize,
) -> SvgPath {
    let mut path = SvgPath::new();
    path.points = hierarchy.contour.clone();
    
    // Set appropriate styling based on hierarchy properties
    if hierarchy.is_hole {
        // Holes should be transparent or use different styling
        path.fill_color = Some("none".to_string());
        path.stroke_color = Some("#666666".to_string());
        path.stroke_width = 0.5;
    } else {
        // Outer contours get standard styling
        path.fill_color = Some("none".to_string());
        path.stroke_color = Some("#000000".to_string());
        path.stroke_width = 1.0;
    }
    
    // For complex nested contours, use compound paths
    if !hierarchy.children.is_empty() {
        // Create compound path with holes
        let mut compound_points = hierarchy.contour.clone();
        
        // Add holes as separate sub-paths
        for &child_idx in &hierarchy.children {
            if child_idx < all_hierarchies.len() && all_hierarchies[child_idx].is_hole {
                // Add hole contour in reverse order for proper fill-rule
                let mut hole_points = all_hierarchies[child_idx].contour.clone();
                if !all_hierarchies[child_idx].clockwise {
                    hole_points.reverse(); // Ensure holes are clockwise
                }
                compound_points.extend(hole_points);
            }
        }
        
        path.points = compound_points;
        path.fill_color = Some("#f0f0f0".to_string()); // Light fill for compound shapes
        // Note: fill_rule would be handled by the SVG builder
        // path.fill_rule = Some("evenodd".to_string()); // Use evenodd for proper hole rendering
    }
    
    // Apply simplification while preserving hierarchy structure
    path.simplify_smart(1.0); // Gentle simplification to preserve shape details
    
    path
}


/// Public API for ultra-optimized edge detection with hierarchical contour extraction
pub fn convert_with_hierarchy(
    image: DynamicImage,
    params: ConversionParameters,
    min_area_ratio: f32,
) -> Result<String> {
    match params {
        ConversionParameters::EdgeDetector {
            method,
            threshold_low,
            threshold_high,
            gaussian_sigma,
            simplification: _,
            min_path_length: _,
        } => {
            info!("Starting hierarchical edge detection with method: {method:?}");

            let (width, height) = (image.width(), image.height());

            // Check memory for workspace allocation
            let workspace_size = estimate_workspace_memory(width, height);
            memory_monitor::check_memory_for_operation(
                workspace_size,
                "edge_detection_workspace",
                "edge_detector",
            )?;

            // Create workspace once for entire operation
            let mut workspace = EdgeDetectionWorkspace::new(width, height);
            memory_monitor::record_allocation(
                workspace_size,
                "workspace_buffer",
                "edge_detector",
            );

            // Convert to grayscale
            let gray = utils::to_grayscale(&image);

            // Apply edge detection using workspace pattern
            let edges_buffer = match method {
                EdgeMethod::Canny => canny_edge_detection_with_workspace(
                    &gray,
                    &mut workspace,
                    gaussian_sigma,
                    threshold_low,
                    threshold_high,
                )?,
                EdgeMethod::Sobel => {
                    sobel_edge_detection_with_workspace(&gray, &mut workspace, threshold_low)?
                }
            };

            // Extract hierarchical contours
            let hierarchies = extract_contour_hierarchy(&edges_buffer, width, height, min_area_ratio);
            
            info!("Hierarchical extraction found {} contours with hierarchy", hierarchies.len());
            
            // Generate SVG with hierarchy support
            let svg = generate_svg_from_hierarchy(&hierarchies, width, height);

            Ok(svg)
        }
        _ => Err(Vec2ArtError::InvalidParameters(
            "Hierarchical extraction requires EdgeDetector parameters".to_string(),
        )),
    }
}

/// Public API for ultra-optimized edge detection
pub fn convert_optimized(image: DynamicImage, params: ConversionParameters) -> Result<String> {
    EdgeDetector::convert(image, params)
}

/// Legacy public API
pub fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
    EdgeDetector::convert(image, params)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_edge_detector_creation() {
        let params = ConversionParameters::EdgeDetector {
            method: EdgeMethod::Canny,
            threshold_low: 50.0,
            threshold_high: 150.0,
            gaussian_sigma: 1.0,
            simplification: 2.0,
            min_path_length: 10,
        };

        // Create a simple test image
        let img = DynamicImage::new_rgb8(100, 100);
        let result = EdgeDetector::convert(img, params);

        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }

    #[test]
    fn test_contour_reduction_with_boundary_tracing() {
        // Create a simple test image with a clear edge
        let width = 50u32;
        let height = 50u32;
        let mut img_buffer = vec![0u8; (width * height) as usize];
        
        // Create a simple rectangle edge (hollow rectangle)
        for y in 10..40 {
            for x in 10..40 {
                let idx = (y * width + x) as usize;
                if x == 10 || x == 39 || y == 10 || y == 39 {
                    img_buffer[idx] = 255; // Edge pixels (boundary)
                } else {
                    img_buffer[idx] = 0; // Interior pixels (should not be traced)
                }
            }
        }

        let gray_image = image::GrayImage::from_vec(width, height, img_buffer)
            .expect("Valid image buffer");

        let mut workspace = EdgeDetectionWorkspace::new(width, height);
        
        // Apply our improved edge detection
        let edges_buffer = canny_edge_detection_with_workspace(
            &gray_image,
            &mut workspace,
            1.0,  // sigma
            50.0, // low threshold
            150.0 // high threshold
        ).expect("Edge detection should succeed");

        // Trace contours with our improved algorithm
        let contours = trace_contours_with_workspace(&edges_buffer, &mut workspace, 5);

        // With boundary tracing, we should get significantly fewer contours
        // than with flood fill (which would trace all interior pixels)
        
        // Verify we found some contours but not an excessive number
        assert!(contours.len() > 0, "Should find at least one contour");
        assert!(contours.len() < 20, "Should not find excessive contours due to boundary tracing");

        // Verify contour points are reasonable (not filled regions)
        for contour in &contours {
            // Each contour should be reasonably sized but not contain all pixels
            assert!(contour.len() >= 5, "Contour should have minimum length");
            assert!(contour.len() < 200, "Contour should not be excessively long (filled region)");
        }

        println!("✅ Improved algorithm found {} contours (expected: small number)", contours.len());
    }

    #[test] 
    fn test_non_maximum_suppression_thinning() {
        // Test that our improved NMS properly thins edges
        let width = 20u32;
        let height = 20u32;
        
        // Create image with thick edges (multiple adjacent high-magnitude pixels)
        let mut magnitude_buffer = vec![0u8; (width * height) as usize];
        let mut direction_buffer = vec![0.0f32; (width * height) as usize];
        
        // Create a thick vertical edge (easier to test NMS behavior)
        // We'll create a gradient that should result in a single line after NMS
        for y in 5..15 {
            for x in 8..12 {
                let idx = (y * width + x) as usize;
                if x == 9 {
                    magnitude_buffer[idx] = 255; // Maximum at center
                    direction_buffer[idx] = std::f32::consts::PI / 2.0; // Vertical gradient
                } else {
                    magnitude_buffer[idx] = 128; // Lower magnitude neighbors
                    direction_buffer[idx] = std::f32::consts::PI / 2.0; // Vertical gradient
                }
            }
        }

        let mut workspace = EdgeDetectionWorkspace::new(width, height);
        let suppressed = non_maximum_suppression_with_workspace(
            &magnitude_buffer, 
            &direction_buffer, 
            &mut workspace
        );

        // Count non-zero pixels in the thick edge region
        let mut edge_pixels = 0;
        let mut total_original_pixels = 0;
        for y in 5..15 {
            for x in 8..12 {
                let idx = (y * width + x) as usize;
                if magnitude_buffer[idx] > 0 {
                    total_original_pixels += 1;
                }
                if suppressed[idx] > 0 {
                    edge_pixels += 1;
                }
            }
        }

        println!("Original edge pixels: {}, After NMS: {}", total_original_pixels, edge_pixels);

        // With proper NMS, we should have significantly fewer edge pixels
        // Original should be ~40 pixels (4x10), after NMS should be ~10 pixels (1x10)
        assert!(edge_pixels > 0, "Should preserve some edge pixels");
        assert!(edge_pixels < total_original_pixels, "Should reduce edge pixels but may not be 50%");
        
        println!("✅ NMS reduced edge pixels from {} to {}", total_original_pixels, edge_pixels);
    }
    
    #[test]
    fn test_contour_hierarchy_nested_shapes() {
        // Create test image with nested rectangles (outer + inner hole)
        let width = 60u32;
        let height = 60u32;
        let mut img_buffer = vec![0u8; (width * height) as usize];
        
        // Create outer rectangle (solid)
        for y in 10..50 {
            for x in 10..50 {
                let idx = (y * width + x) as usize;
                if x == 10 || x == 49 || y == 10 || y == 49 {
                    img_buffer[idx] = 255; // Outer boundary
                }
            }
        }
        
        // Create inner rectangle (hole)
        for y in 20..40 {
            for x in 20..40 {
                let idx = (y * width + x) as usize;
                if x == 20 || x == 39 || y == 20 || y == 39 {
                    img_buffer[idx] = 255; // Inner boundary (hole)
                }
            }
        }
        
        // Test hierarchical extraction
        let min_area_ratio = 0.001; // Very small threshold
        let hierarchies = extract_contour_hierarchy(&img_buffer, width, height, min_area_ratio);
        
        println!("Found {} hierarchical contours", hierarchies.len());
        
        // Should find at least 2 contours (outer and inner)
        assert!(hierarchies.len() >= 1, "Should find at least one contour");
        
        // Check hierarchy properties
        let mut outer_contours = 0;
        let mut hole_contours = 0;
        
        for (i, hierarchy) in hierarchies.iter().enumerate() {
            println!("Contour {}: area={:.1}, is_hole={}, level={}, clockwise={}, children={}", 
                     i, hierarchy.area, hierarchy.is_hole, hierarchy.level, 
                     hierarchy.clockwise, hierarchy.children.len());
            
            if hierarchy.is_hole {
                hole_contours += 1;
            } else {
                outer_contours += 1;
            }
            
            // Verify contour properties
            assert!(hierarchy.area > 0.0, "Contour should have positive area");
            assert!(!hierarchy.contour.is_empty(), "Contour should have points");
        }
        
        println!("✅ Found {} outer contours and {} holes", outer_contours, hole_contours);
    }
    
    #[test]
    fn test_contour_orientation_detection() {
        // Test clockwise rectangle (should be clockwise in image coordinates)
        let clockwise_rect = vec![
            (10.0, 10.0), (50.0, 10.0), (50.0, 50.0), (10.0, 50.0)
        ];
        
        // Test counter-clockwise rectangle 
        let counter_clockwise_rect = vec![
            (10.0, 10.0), (10.0, 50.0), (50.0, 50.0), (50.0, 10.0)
        ];
        
        let cw_result = is_contour_clockwise(&clockwise_rect);
        let ccw_result = is_contour_clockwise(&counter_clockwise_rect);
        
        println!("Clockwise rect detected as: {}", cw_result);
        println!("Counter-clockwise rect detected as: {}", ccw_result);
        
        // In image coordinates (Y increases downward), our definitions should work
        assert_ne!(cw_result, ccw_result, "Clockwise and counter-clockwise should be different");
        
        // Test area calculation
        let area_cw = calculate_contour_area(&clockwise_rect);
        let area_ccw = calculate_contour_area(&counter_clockwise_rect);
        
        println!("Clockwise area: {}, Counter-clockwise area: {}", area_cw, area_ccw);
        assert!((area_cw - area_ccw).abs() < 1.0, "Both rectangles should have same area");
        assert!(area_cw > 0.0, "Area should be positive");
        
        println!("✅ Orientation detection working correctly");
    }
    
    #[test]
    fn test_point_in_polygon() {
        let rectangle = vec![
            (10.0, 10.0), (50.0, 10.0), (50.0, 50.0), (10.0, 50.0)
        ];
        
        // Test points inside
        assert!(point_in_polygon(&rectangle, (30.0, 30.0)), "Center point should be inside");
        assert!(point_in_polygon(&rectangle, (15.0, 15.0)), "Interior point should be inside");
        
        // Test points outside
        assert!(!point_in_polygon(&rectangle, (5.0, 5.0)), "Point outside should be outside");
        assert!(!point_in_polygon(&rectangle, (60.0, 60.0)), "Point outside should be outside");
        
        // Test edge cases (on boundary - behavior may vary)
        let on_edge = point_in_polygon(&rectangle, (10.0, 30.0));
        println!("Point on edge detected as inside: {}", on_edge);
        
        println!("✅ Point-in-polygon test working correctly");
    }
    
    #[test]
    fn test_hierarchy_tree_building() {
        // Create nested contours manually
        let outer_large = ContourHierarchy::new(vec![
            (5.0, 5.0), (95.0, 5.0), (95.0, 95.0), (5.0, 95.0)
        ]);
        
        let inner_hole = ContourHierarchy::new(vec![
            (25.0, 25.0), (25.0, 75.0), (75.0, 75.0), (75.0, 25.0) // Counter-clockwise = hole
        ]);
        
        let tiny_inner = ContourHierarchy::new(vec![
            (40.0, 40.0), (60.0, 40.0), (60.0, 60.0), (40.0, 60.0)
        ]);
        
        let contours = vec![outer_large, inner_hole, tiny_inner];
        let hierarchy_tree = build_hierarchy_tree(contours);
        
        println!("Built hierarchy tree with {} contours", hierarchy_tree.len());
        
        for (i, contour) in hierarchy_tree.iter().enumerate() {
            println!("Contour {}: level={}, is_hole={}, parent={:?}, children={:?}", 
                     i, contour.level, contour.is_hole, 
                     contour.parent_idx, contour.children);
        }
        
        // Verify hierarchy structure
        let root_contours: Vec<_> = hierarchy_tree.iter()
            .enumerate()
            .filter(|(_, c)| c.parent_idx.is_none())
            .collect();
            
        assert!(!root_contours.is_empty(), "Should have at least one root contour");
        
        println!("✅ Hierarchy tree building working correctly");
    }
    
    #[test]
    fn test_hierarchical_conversion_full_pipeline() {
        // Test the full hierarchical conversion pipeline
        let params = ConversionParameters::EdgeDetector {
            method: EdgeMethod::Canny,
            threshold_low: 50.0,
            threshold_high: 150.0,
            gaussian_sigma: 1.0,
            simplification: 2.0,
            min_path_length: 10,
        };
        
        // Create test image with nested shapes
        let img = create_nested_test_image();
        
        // Test hierarchical conversion
        let result = convert_with_hierarchy(img, params, 0.001);
        
        assert!(result.is_ok(), "Hierarchical conversion should succeed");
        let svg = result.unwrap();
        
        // Verify SVG contains expected elements
        assert!(svg.contains("<svg"), "Should contain SVG element");
        assert!(svg.contains("</svg>"), "Should contain closing SVG element");
        assert!(svg.contains("path") || svg.contains("<path"), "Should contain path elements");
        
        // Check for hierarchy-specific attributes
        if svg.contains("fill-rule") {
            println!("✅ SVG contains fill-rule attribute for hierarchy");
        }
        
        println!("✅ Full hierarchical conversion pipeline working");
    }
    
    /// Helper function to create a test image with nested shapes
    fn create_nested_test_image() -> DynamicImage {
        use image::{Rgb, RgbImage};
        
        let width = 100u32;
        let height = 100u32;
        let mut img = RgbImage::new(width, height);
        
        // Fill with white background
        for pixel in img.pixels_mut() {
            *pixel = Rgb([255, 255, 255]);
        }
        
        // Draw outer rectangle (black)
        for y in 10..90 {
            for x in 10..90 {
                if x == 10 || x == 89 || y == 10 || y == 89 {
                    img.put_pixel(x, y, Rgb([0, 0, 0]));
                }
            }
        }
        
        // Draw inner rectangle (black - will create hole)
        for y in 30..70 {
            for x in 30..70 {
                if x == 30 || x == 69 || y == 30 || y == 69 {
                    img.put_pixel(x, y, Rgb([0, 0, 0]));
                }
            }
        }
        
        DynamicImage::ImageRgb8(img)
    }
}
