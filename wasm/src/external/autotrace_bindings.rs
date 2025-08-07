// Manual bindings for Autotrace C wrapper
// 
// This avoids the need for bindgen and libclang dependencies.

use std::os::raw::{c_double, c_int};

#[repr(C)]
pub struct autotrace_bitmap_t {
    pub width: c_int,
    pub height: c_int,
    pub data: *mut u8, // RGB data (3 bytes per pixel)
}

#[repr(C)]
pub struct autotrace_options_t {
    pub corner_threshold: c_double,         // Corner detection threshold
    pub line_threshold: c_double,           // Line detection threshold  
    pub line_reversion_threshold: c_double, // Line reversion threshold
    pub filter_iterations: c_double,        // Smoothing iterations
    pub centerline: bool,                   // Enable centerline tracing
    pub preserve_width: bool,               // Preserve line width information
    pub despeckle_level: c_double,          // Noise removal level
}

#[repr(C)]
pub struct autotrace_point_t {
    pub x: c_double,
    pub y: c_double,
}

#[repr(C)]
pub enum autotrace_segment_type_t {
    AUTOTRACE_LINETO = 1,
    AUTOTRACE_CURVETO = 2,
}

#[repr(C)]
pub struct autotrace_segment_t {
    pub type_: autotrace_segment_type_t,
    pub p1: autotrace_point_t,
    pub p2: autotrace_point_t, 
    pub p3: autotrace_point_t, // Points (p1=end, p2,p3=control points for curves)
    pub width: c_double,       // Line width (for centerline mode)
    pub next: *mut autotrace_segment_t,
}

#[repr(C)]
pub struct autotrace_spline_t {
    pub segments: *mut autotrace_segment_t,    // Linked list of segments
    pub closed: bool,                          // Is this spline closed?
    pub color: [u8; 3],                       // RGB color
    pub next: *mut autotrace_spline_t,        // Next spline
}

#[repr(C)]
pub struct autotrace_spline_list_t {
    pub splines: *mut autotrace_spline_t,     // Linked list of splines
    pub spline_count: c_int,                  // Number of splines
    pub status: c_int,                        // Success/error status
}

extern "C" {
    // Core API functions
    pub fn autotrace_options_new() -> *mut autotrace_options_t;
    pub fn autotrace_options_free(opts: *mut autotrace_options_t);

    pub fn autotrace_bitmap_new(width: c_int, height: c_int) -> *mut autotrace_bitmap_t;
    pub fn autotrace_bitmap_free(bm: *mut autotrace_bitmap_t);
    pub fn autotrace_bitmap_set_pixel(bm: *mut autotrace_bitmap_t, x: c_int, y: c_int, r: u8, g: u8, b: u8);

    pub fn autotrace_image(bm: *mut autotrace_bitmap_t, opts: *mut autotrace_options_t) -> *mut autotrace_spline_list_t;
    pub fn autotrace_spline_list_free(list: *mut autotrace_spline_list_t);

    // Utility functions
    pub fn autotrace_spline_segment_count(spline: *mut autotrace_spline_t) -> c_int;
}