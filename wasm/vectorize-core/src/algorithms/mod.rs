//! Vectorization algorithms module
//!
//! This module contains organized vectorization algorithms grouped by functionality.
//!
//! ## Organization:
//! - `centerline/` - Centerline extraction and distance transforms
//! - `dots/` - Stippling, dot generation, and background analysis
//! - `edges/` - Edge detection, ETF, and gradient analysis
//! - `tracing/` - Path tracing, curve fitting, and trace-low algorithm
//! - `visual/` - Color processing, SIMD operations, and visual enhancements

pub mod centerline;
pub mod dots;
pub mod edges;
pub mod tracing;
pub mod visual;

// Re-export commonly used types from organized modules
pub use centerline::{
    CenterlineAlgorithm, Complexity, CompositeCenterlineAlgorithm, DistanceTransformStrategy,
    ExtractionStrategy, MemoryUsage, PerformanceProfile, PreprocessingStrategy,
    SimplificationStrategy, ThinningStrategy, ThresholdingStrategy,
};

// Dots module re-exports
pub use dots::{
    add_artistic_jitter, add_opacity_variation, add_size_variation, analyze_image_regions,
    apply_adaptive_density, apply_artistic_effects, apply_grid_alignment, apply_style_preset,
    calculate_adaptive_density, calculate_color_similarity, detect_background_advanced,
    detect_background_mask, dots_to_svg_elements, dots_to_svg_paths, dots_to_svg_with_config,
    generate_adaptive_dots, generate_dot_svg_document, generate_dots,
    generate_dots_auto_background, generate_dots_from_image, generate_dots_optimized_pipeline,
    get_style_parameters, optimize_dot_svg, poisson_disk_sampling, rgba_to_lab,
    smooth_density_transitions, AdaptiveConfig, BackgroundConfig, Dot, DotConfig, DotStyle,
    JitterConfig, LabColor, OpacityVariationConfig, OptimizedDotConfig, OptimizedDotGenerator,
    Region, SizeVariationConfig, SvgDotConfig, SvgElement,
};

// Edges module re-exports
pub use edges::{
    analyze_image_gradients, analyze_image_gradients_with_config, apply_nms,
    calculate_gradient_magnitude, calculate_local_variance, compute_etf, compute_fdog,
    compute_multi_direction_edges, compute_xdog, hysteresis_threshold, EdgeResponse, EtfConfig,
    EtfField, FdogConfig, GradientAnalysis, GradientConfig, MultiDirectionEdges, NmsConfig,
    XdogConfig,
};

// Tracing module re-exports
pub use tracing::{
    fit_beziers, trace_polylines, vectorize_trace_low, vectorize_trace_low_with_gradients,
    CubicBezier, EnhancedSvgResult, FitConfig, Point2F, Polyline, TraceBackend, TraceConfig,
    TraceLowConfig,
};

// Visual module re-exports
pub use visual::{
    analyze_path_for_gradients, analyze_paths_for_gradients, apply_hand_drawn_aesthetics,
    extract_path_colors, generate_gradient_id, get_simd_info, is_simd_available,
    reduce_color_palette, rgba_to_hex, simd_analyze_gradient_strength,
    simd_k_means_palette_reduction, ColorSample, ColorSamplingMethod, GradientDetectionAnalysis,
    GradientDetectionConfig, GradientPoint, GradientStop, GradientType, HandDrawnConfig,
    HandDrawnPresets, PathColorInfo,
};

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
    /// Rectangle element
    Rect { x: f32, y: f32, width: f32, height: f32 },
    /// Polygon element
    Polygon { points: String },
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
