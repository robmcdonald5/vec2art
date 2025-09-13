//! High-performance Distance Transform-based centerline algorithm
//!
//! This algorithm provides a faster alternative to skeleton-based centerline extraction
//! using distance fields and ridge detection.

use super::distance_transform::DistanceFieldCenterlineExtractor;
use super::thresholding::BradleyRothThresholding;
use super::{
    CenterlineAlgorithm, Complexity, MemoryUsage, PerformanceProfile, ThresholdingStrategy,
};
use crate::algorithms::{Point, SvgPath};
use crate::error::VectorizeError;
use crate::utils::Instant;
use crate::TraceLowConfig;
use image::{GrayImage, ImageBuffer, Luma, Rgba};

/// Distance Transform-based centerline algorithm optimized for performance
pub struct DistanceTransformCenterlineAlgorithm {
    extractor: DistanceFieldCenterlineExtractor,
    name: String,
}

impl DistanceTransformCenterlineAlgorithm {
    pub fn new() -> Self {
        Self {
            extractor: DistanceFieldCenterlineExtractor::new(),
            name: "DistanceTransform".to_string(),
        }
    }

    pub fn with_high_performance_settings() -> Self {
        use super::distance_transform::SimdDistanceTransform;

        let extractor =
            DistanceFieldCenterlineExtractor::with_strategy(Box::new(SimdDistanceTransform));

        Self {
            extractor,
            name: "DistanceTransformSIMD".to_string(),
        }
    }
}

impl Default for DistanceTransformCenterlineAlgorithm {
    fn default() -> Self {
        Self::new()
    }
}

impl CenterlineAlgorithm for DistanceTransformCenterlineAlgorithm {
    fn extract_centerlines(
        &self,
        image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        config: &TraceLowConfig,
    ) -> Result<Vec<SvgPath>, VectorizeError> {
        log::info!("Starting {} centerline extraction", self.name);
        let start_time = Instant::now();

        let (img_width, img_height) = image.dimensions();

        // Phase 1: Convert to grayscale (optimized)
        let phase_start = Instant::now();
        let gray = rgba_to_gray_optimized(image);
        let grayscale_time = phase_start.elapsed();

        // Phase 2: Apply Gaussian blur with optimized sigma
        let phase_start = Instant::now();
        let blur_sigma = if config.detail < 0.3 {
            0.8
        } else if config.detail > 0.7 {
            1.2
        } else {
            1.0
        };
        let blurred = gaussian_blur_separable(&gray, blur_sigma);
        let blur_time = phase_start.elapsed();

        // Phase 3: High-performance thresholding
        let phase_start = Instant::now();
        let binary = if config.enable_adaptive_threshold {
            // Use Bradley-Roth for speed (research shows 2x faster than Sauvola)
            let thresholder = BradleyRothThresholding::new(
                config.adaptive_threshold_window_size,
                0.15, // Optimal ratio for Bradley-Roth
            );
            thresholder.threshold(&blurred, config)?
        } else {
            otsu_threshold_optimized(&blurred)
        };
        let threshold_time = phase_start.elapsed();

        // Phase 4: Minimal preprocessing (research shows opening+closing is optimal)
        let phase_start = Instant::now();
        let processed = if config.noise_filtering {
            minimal_morphology_3x3(&binary)
        } else {
            binary
        };
        let preprocessing_time = phase_start.elapsed();

        // Phase 5: Distance Transform-based centerline extraction (the key innovation)
        let phase_start = Instant::now();
        let polylines = self.extractor.extract_centerlines(&processed)?;
        let extraction_time = phase_start.elapsed();

        // Phase 6: Curvature-aware simplification
        let phase_start = Instant::now();
        let epsilon = calculate_adaptive_epsilon(img_width, img_height, config);
        let simplified_polylines = simplify_polylines_curvature_aware(polylines, epsilon);
        let simplification_time = phase_start.elapsed();

        // Phase 7: Smart endpoint bridging
        let phase_start = Instant::now();
        let reconnected_polylines = bridge_endpoints_smart(simplified_polylines, 6.0, 25.0);
        let bridging_time = phase_start.elapsed();

        // Phase 8: Convert to SVG with optimized path generation
        let phase_start = Instant::now();
        let svg_paths = polylines_to_svg_paths_optimized(reconnected_polylines, image, config)?;
        let svg_time = phase_start.elapsed();

        let total_time = start_time.elapsed();

        // Log performance metrics
        log::info!(
            "{} completed in {:.1}ms: gray={:.1}ms, blur={:.1}ms, threshold={:.1}ms, preproc={:.1}ms, extract={:.1}ms, simplify={:.1}ms, bridge={:.1}ms, svg={:.1}ms", 
            self.name,
            total_time.as_secs_f64() * 1000.0,
            grayscale_time.as_secs_f64() * 1000.0,
            blur_time.as_secs_f64() * 1000.0,
            threshold_time.as_secs_f64() * 1000.0,
            preprocessing_time.as_secs_f64() * 1000.0,
            extraction_time.as_secs_f64() * 1000.0,
            simplification_time.as_secs_f64() * 1000.0,
            bridging_time.as_secs_f64() * 1000.0,
            svg_time.as_secs_f64() * 1000.0
        );

        log::info!("{} generated {} paths", self.name, svg_paths.len());

        Ok(svg_paths)
    }

    fn name(&self) -> &'static str {
        "DistanceTransform"
    }

    fn performance_profile(&self) -> PerformanceProfile {
        PerformanceProfile {
            complexity: Complexity::Linear, // O(n) due to Felzenszwalb-Huttenlocher
            memory_usage: MemoryUsage::Medium, // ~2-3x image size
            parallelizable: true,
            simd_optimized: false, // Will be true in Phase 3
        }
    }
}

// Optimized implementation functions

fn rgba_to_gray_optimized(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut gray = GrayImage::new(width, height);

    // Use optimized RGB to grayscale conversion weights
    for (src, dst) in image.pixels().zip(gray.pixels_mut()) {
        let r = src.0[0] as u32;
        let g = src.0[1] as u32;
        let b = src.0[2] as u32;

        // ITU-R BT.601 weights for better perceptual accuracy
        let gray_val = ((77 * r + 150 * g + 29 * b) / 256) as u8;
        dst.0[0] = gray_val;
    }

    gray
}

fn gaussian_blur_separable(image: &GrayImage, sigma: f32) -> GrayImage {
    if sigma <= 0.0 {
        return image.clone();
    }

    let (width, height) = image.dimensions();
    let kernel_size = (6.0 * sigma).ceil() as usize | 1; // Ensure odd
    let kernel_radius = kernel_size / 2;

    // Generate 1D Gaussian kernel
    let mut kernel = vec![0.0f32; kernel_size];
    let mut sum = 0.0f32;

    for (i, k) in kernel.iter_mut().enumerate() {
        let x = (i as i32 - kernel_radius as i32) as f32;
        *k = (-0.5 * (x / sigma).powi(2)).exp();
        sum += *k;
    }

    // Normalize kernel
    for k in &mut kernel {
        *k /= sum;
    }

    // Horizontal pass
    let mut temp = GrayImage::new(width, height);
    for y in 0..height {
        for x in 0..width {
            let mut pixel_sum = 0.0f32;

            for (k_idx, &k_val) in kernel.iter().enumerate() {
                let sample_x = x as i32 + k_idx as i32 - kernel_radius as i32;
                let sample_x = sample_x.clamp(0, width as i32 - 1) as u32;

                pixel_sum += image.get_pixel(sample_x, y).0[0] as f32 * k_val;
            }

            temp.put_pixel(x, y, Luma([pixel_sum as u8]));
        }
    }

    // Vertical pass
    let mut result = GrayImage::new(width, height);
    for y in 0..height {
        for x in 0..width {
            let mut pixel_sum = 0.0f32;

            for (k_idx, &k_val) in kernel.iter().enumerate() {
                let sample_y = y as i32 + k_idx as i32 - kernel_radius as i32;
                let sample_y = sample_y.clamp(0, height as i32 - 1) as u32;

                pixel_sum += temp.get_pixel(x, sample_y).0[0] as f32 * k_val;
            }

            result.put_pixel(x, y, Luma([pixel_sum as u8]));
        }
    }

    result
}

fn otsu_threshold_optimized(gray: &GrayImage) -> GrayImage {
    // Optimized Otsu using integral histogram
    let mut histogram = [0u32; 256];
    for pixel in gray.pixels() {
        histogram[pixel.0[0] as usize] += 1;
    }

    let total_pixels = gray.width() * gray.height();

    // Calculate cumulative sums for efficiency
    let mut cum_sum = [0u32; 256];
    let mut weighted_sum = [0u32; 256];

    cum_sum[0] = histogram[0];
    weighted_sum[0] = 0;

    for i in 1..256 {
        cum_sum[i] = cum_sum[i - 1] + histogram[i];
        weighted_sum[i] = weighted_sum[i - 1] + i as u32 * histogram[i];
    }

    let mut max_variance = 0.0f64;
    let mut optimal_threshold = 0u8;

    for threshold in 1..255 {
        let weight_bg = cum_sum[threshold] as f64;
        let weight_fg = (total_pixels - cum_sum[threshold]) as f64;

        if weight_bg == 0.0 || weight_fg == 0.0 {
            continue;
        }

        let mean_bg = weighted_sum[threshold] as f64 / weight_bg;
        let mean_fg = (weighted_sum[255] - weighted_sum[threshold]) as f64 / weight_fg;

        let between_class_variance =
            (weight_bg * weight_fg * (mean_bg - mean_fg).powi(2)) / total_pixels as f64;

        if between_class_variance > max_variance {
            max_variance = between_class_variance;
            optimal_threshold = threshold as u8;
        }
    }

    // Apply threshold
    let (width, height) = gray.dimensions();
    let mut binary = GrayImage::new(width, height);

    for (src, dst) in gray.pixels().zip(binary.pixels_mut()) {
        dst.0[0] = if src.0[0] > optimal_threshold { 255 } else { 0 };
    }

    binary
}

fn minimal_morphology_3x3(binary: &GrayImage) -> GrayImage {
    // Opening followed by closing (research recommended sequence)
    let opened = morphological_opening_3x3_optimized(binary);
    morphological_closing_3x3_optimized(&opened)
}

fn morphological_opening_3x3_optimized(binary: &GrayImage) -> GrayImage {
    let eroded = morphological_erosion_3x3_optimized(binary);
    morphological_dilation_3x3_optimized(&eroded)
}

fn morphological_closing_3x3_optimized(binary: &GrayImage) -> GrayImage {
    let dilated = morphological_dilation_3x3_optimized(binary);
    morphological_erosion_3x3_optimized(&dilated)
}

fn morphological_erosion_3x3_optimized(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut result = GrayImage::new(width, height);

    // Optimized 3x3 erosion with border handling
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let mut min_val = 255u8;

            // Unrolled 3x3 neighborhood check
            min_val = min_val.min(binary.get_pixel(x - 1, y - 1).0[0]);
            min_val = min_val.min(binary.get_pixel(x, y - 1).0[0]);
            min_val = min_val.min(binary.get_pixel(x + 1, y - 1).0[0]);
            min_val = min_val.min(binary.get_pixel(x - 1, y).0[0]);
            min_val = min_val.min(binary.get_pixel(x, y).0[0]);
            min_val = min_val.min(binary.get_pixel(x + 1, y).0[0]);
            min_val = min_val.min(binary.get_pixel(x - 1, y + 1).0[0]);
            min_val = min_val.min(binary.get_pixel(x, y + 1).0[0]);
            min_val = min_val.min(binary.get_pixel(x + 1, y + 1).0[0]);

            result.put_pixel(x, y, Luma([min_val]));
        }
    }

    // Handle borders by copying
    for x in 0..width {
        result.put_pixel(x, 0, binary.get_pixel(x, 0).clone());
        if height > 1 {
            result.put_pixel(x, height - 1, binary.get_pixel(x, height - 1).clone());
        }
    }
    for y in 0..height {
        result.put_pixel(0, y, binary.get_pixel(0, y).clone());
        if width > 1 {
            result.put_pixel(width - 1, y, binary.get_pixel(width - 1, y).clone());
        }
    }

    result
}

fn morphological_dilation_3x3_optimized(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut result = GrayImage::new(width, height);

    // Optimized 3x3 dilation with border handling
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let mut max_val = 0u8;

            // Unrolled 3x3 neighborhood check
            max_val = max_val.max(binary.get_pixel(x - 1, y - 1).0[0]);
            max_val = max_val.max(binary.get_pixel(x, y - 1).0[0]);
            max_val = max_val.max(binary.get_pixel(x + 1, y - 1).0[0]);
            max_val = max_val.max(binary.get_pixel(x - 1, y).0[0]);
            max_val = max_val.max(binary.get_pixel(x, y).0[0]);
            max_val = max_val.max(binary.get_pixel(x + 1, y).0[0]);
            max_val = max_val.max(binary.get_pixel(x - 1, y + 1).0[0]);
            max_val = max_val.max(binary.get_pixel(x, y + 1).0[0]);
            max_val = max_val.max(binary.get_pixel(x + 1, y + 1).0[0]);

            result.put_pixel(x, y, Luma([max_val]));
        }
    }

    // Handle borders by copying
    for x in 0..width {
        result.put_pixel(x, 0, binary.get_pixel(x, 0).clone());
        if height > 1 {
            result.put_pixel(x, height - 1, binary.get_pixel(x, height - 1).clone());
        }
    }
    for y in 0..height {
        result.put_pixel(0, y, binary.get_pixel(0, y).clone());
        if width > 1 {
            result.put_pixel(width - 1, y, binary.get_pixel(width - 1, y).clone());
        }
    }

    result
}

fn calculate_adaptive_epsilon(width: u32, height: u32, config: &TraceLowConfig) -> f32 {
    let diagonal = ((width * width + height * height) as f32).sqrt();
    let base_epsilon = (0.0008 + 0.0022 * config.detail) * diagonal;
    base_epsilon.clamp(0.5, 4.0) // Tighter bounds for centerlines
}

fn simplify_polylines_curvature_aware(polylines: Vec<Vec<Point>>, epsilon: f32) -> Vec<Vec<Point>> {
    // TODO: Use the CurvatureAwareSimplification from the simplification module
    polylines
        .into_iter()
        .map(|poly| douglas_peucker_simple(&poly, epsilon))
        .filter(|poly| poly.len() >= 2)
        .collect()
}

fn douglas_peucker_simple(points: &[Point], epsilon: f32) -> Vec<Point> {
    if points.len() <= 2 {
        return points.to_vec();
    }

    let mut result = Vec::new();
    result.push(points[0]);
    dp_recursive_simple(points, 0, points.len() - 1, epsilon, &mut result);
    result.push(points[points.len() - 1]);
    result
}

fn dp_recursive_simple(
    points: &[Point],
    start: usize,
    end: usize,
    epsilon: f32,
    result: &mut Vec<Point>,
) {
    if end <= start + 1 {
        return;
    }

    let start_point = &points[start];
    let end_point = &points[end];

    let dx = end_point.x - start_point.x;
    let dy = end_point.y - start_point.y;
    let line_length = (dx * dx + dy * dy).sqrt().max(1e-6);

    let mut max_distance = 0.0;
    let mut max_index = start;

    for i in (start + 1)..end {
        let point = &points[i];
        let distance =
            ((point.x - start_point.x) * dy - (point.y - start_point.y) * dx).abs() / line_length;

        if distance > max_distance {
            max_distance = distance;
            max_index = i;
        }
    }

    if max_distance > epsilon {
        dp_recursive_simple(points, start, max_index, epsilon, result);
        result.push(points[max_index]);
        dp_recursive_simple(points, max_index, end, epsilon, result);
    }
}

fn bridge_endpoints_smart(
    polylines: Vec<Vec<Point>>,
    _max_distance: f32,
    _max_angle_deg: f32,
) -> Vec<Vec<Point>> {
    // TODO: Implement smart endpoint bridging with tangent alignment
    polylines
}

fn polylines_to_svg_paths_optimized(
    polylines: Vec<Vec<Point>>,
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    let stroke_width = calculate_stroke_width_optimized(image, config.stroke_px_at_1080p);

    let svg_paths: Vec<SvgPath> = polylines
        .into_iter()
        .map(|polyline| {
            let path_data = polyline_to_path_data_optimized(&polyline);
            let mut svg_path = SvgPath::new_stroke(path_data, "#000000", stroke_width);

            // Add color sampling if enabled
            if config.line_preserve_colors {
                let color = sample_polyline_color_optimized(&polyline, image);
                svg_path.stroke = color;
            }

            svg_path
        })
        .collect();

    Ok(svg_paths)
}

fn calculate_stroke_width_optimized(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    base_stroke: f32,
) -> f32 {
    let (width, height) = image.dimensions();
    let diagonal = ((width * width + height * height) as f32).sqrt();
    let reference_diagonal = 1920.0; // 1080p diagonal

    base_stroke * (diagonal / reference_diagonal).clamp(0.3, 3.0)
}

fn polyline_to_path_data_optimized(polyline: &[Point]) -> String {
    if polyline.is_empty() {
        return String::new();
    }

    let mut path_data = String::with_capacity(polyline.len() * 16); // Pre-allocate

    // Move to first point
    path_data.push_str(&format!("M {:.1} {:.1}", polyline[0].x, polyline[0].y));

    // Add line segments
    for point in &polyline[1..] {
        path_data.push_str(&format!(" L {:.1} {:.1}", point.x, point.y));
    }

    path_data
}

fn sample_polyline_color_optimized(
    polyline: &[Point],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> String {
    if polyline.is_empty() {
        return "#000000".to_string();
    }

    let (width, height) = image.dimensions();
    let mid_point = &polyline[polyline.len() / 2];

    let x = (mid_point.x as u32).min(width - 1);
    let y = (mid_point.y as u32).min(height - 1);

    let pixel = image.get_pixel(x, y);
    format!("#{:02X}{:02X}{:02X}", pixel.0[0], pixel.0[1], pixel.0[2])
}
