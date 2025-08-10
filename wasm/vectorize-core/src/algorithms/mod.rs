//! Vectorization algorithms module
//!
//! This module contains the trace-low vectorization algorithm and related utilities.

pub mod hand_drawn;
pub mod path_utils;
pub mod trace_low;

// Re-export commonly used types
pub use hand_drawn::{apply_hand_drawn_aesthetics, HandDrawnConfig, HandDrawnPresets};
pub use trace_low::{vectorize_trace_low, TraceBackend, TraceLowConfig};

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
