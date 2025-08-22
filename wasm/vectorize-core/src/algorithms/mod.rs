//! Vectorization algorithms module
//!
//! This module contains the trace-low vectorization algorithm and related utilities.

pub mod adaptive_dots;
pub mod background;
pub mod color_processing;
pub mod dot_styles;
pub mod dots;
pub mod dots_optimized;
pub mod edges;
pub mod etf;
pub mod fit;
pub mod gradient_detection;
pub mod gradients;
pub mod hand_drawn;
pub mod path_utils;
pub mod simd_color;
pub mod svg_dots;
pub mod trace;
pub mod trace_low;

// Re-export commonly used types
pub use adaptive_dots::{
    analyze_image_regions, apply_adaptive_density, calculate_adaptive_density,
    generate_adaptive_dots, poisson_disk_sampling, smooth_density_transitions, AdaptiveConfig,
    Region,
};
pub use background::{
    calculate_color_similarity, detect_background_advanced, detect_background_mask, rgba_to_lab,
    BackgroundConfig, LabColor,
};
pub use color_processing::{
    extract_path_colors, reduce_color_palette, rgba_to_hex, ColorSample, ColorSamplingMethod,
    PathColorInfo,
};
pub use dot_styles::{
    add_artistic_jitter, add_opacity_variation, add_size_variation, apply_artistic_effects,
    apply_grid_alignment, apply_style_preset, get_style_parameters, DotStyle, JitterConfig,
    OpacityVariationConfig, SizeVariationConfig,
};
pub use dots::{
    generate_dots, generate_dots_auto_background, generate_dots_from_image, Dot, DotConfig,
};
pub use dots_optimized::{
    analyze_gradients_optimized, detect_background_optimized, generate_dots_optimized_pipeline,
    OptimizedDotConfig, OptimizedDotGenerator,
};
pub use edges::{
    apply_nms, compute_fdog, compute_multi_direction_edges, compute_xdog, hysteresis_threshold,
    EdgeResponse, FdogConfig, MultiDirectionEdges, NmsConfig, XdogConfig,
};
pub use etf::{compute_etf, EtfConfig, EtfField};
pub use fit::{fit_beziers, CubicBezier, FitConfig};
pub use gradient_detection::{
    analyze_path_for_gradients, analyze_paths_for_gradients, generate_gradient_id,
    GradientAnalysis as GradientDetectionAnalysis, GradientDetectionConfig, GradientPoint,
    GradientStop, GradientType,
};
pub use gradients::{
    analyze_image_gradients, analyze_image_gradients_with_config, calculate_gradient_magnitude,
    calculate_local_variance, GradientAnalysis, GradientConfig,
};
pub use hand_drawn::{apply_hand_drawn_aesthetics, HandDrawnConfig, HandDrawnPresets};
pub use simd_color::{
    simd_k_means_palette_reduction, simd_analyze_gradient_strength, 
    is_simd_available, get_simd_info,
};
pub use svg_dots::{
    dots_to_svg_elements, dots_to_svg_paths, dots_to_svg_with_config, generate_dot_svg_document,
    optimize_dot_svg, SvgDotConfig, SvgElement,
};
pub use trace::{trace_polylines, Point2F, Polyline, TraceConfig};
pub use trace_low::{vectorize_trace_low, vectorize_trace_low_with_gradients, EnhancedSvgResult, TraceBackend, TraceLowConfig};

/// 2D point representation
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

impl Point {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    pub fn distance_to(&self, other: &Point) -> f32 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
}

/// SVG element types
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum SvgElementType {
    /// Path element (most common for vectorization)
    Path,
    /// Circle element
    Circle { cx: f32, cy: f32, r: f32 },
    /// Ellipse element
    Ellipse { cx: f32, cy: f32, rx: f32, ry: f32 },
    /// Line element
    Line { x1: f32, y1: f32, x2: f32, y2: f32 },
}

/// SVG path representation
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SvgPath {
    /// Path data string (e.g., "M 10,10 L 20,20 Z")
    pub data: String,
    /// Fill color (RGB hex format, e.g., "#FF0000")
    pub fill: String,
    /// Stroke color (RGB hex format, e.g., "#000000")
    pub stroke: String,
    /// Stroke width in pixels
    pub stroke_width: f32,
    /// Element type (mostly Path for trace-low)
    pub element_type: SvgElementType,
}

impl SvgPath {
    /// Create a new path with default styling
    pub fn new(data: String) -> Self {
        Self {
            data,
            fill: "none".to_string(),
            stroke: "#000000".to_string(),
            stroke_width: 1.0,
            element_type: SvgElementType::Path,
        }
    }

    /// Create a stroke-only path
    pub fn new_stroke(data: String, stroke_color: &str, stroke_width: f32) -> Self {
        Self {
            data,
            fill: "none".to_string(),
            stroke: stroke_color.to_string(),
            stroke_width,
            element_type: SvgElementType::Path,
        }
    }

    /// Create a filled path
    pub fn new_fill(data: String, fill_color: &str) -> Self {
        Self {
            data,
            fill: fill_color.to_string(),
            stroke: "none".to_string(),
            stroke_width: 0.0,
            element_type: SvgElementType::Path,
        }
    }
}
