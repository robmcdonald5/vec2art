// Manual bindings for Potrace C wrapper
// 
// This avoids the need for bindgen and libclang dependencies.

use std::os::raw::{c_double, c_int};

#[repr(C)]
pub struct potrace_bitmap_t {
    pub width: c_int,
    pub height: c_int,
    pub data: *mut u8,
}

#[repr(C)]
pub struct potrace_param_t {
    pub turdsize: c_double,        // Filter speckles of this many pixels
    pub turnpolicy: c_double,      // How to resolve ambiguities
    pub alphamax: c_double,        // Corner threshold
    pub opticurve: bool,           // Use Bezier curves
    pub opttolerance: c_double,    // Curve optimization tolerance
}

#[repr(C)]
pub struct potrace_point_t {
    pub x: c_double,
    pub y: c_double,
}

#[repr(C)]
pub enum potrace_segment_type_t {
    POTRACE_CORNER = 1,
    POTRACE_CURVETO = 2,
}

#[repr(C)]
pub struct potrace_segment_t {
    pub type_: potrace_segment_type_t,
    pub c: [potrace_point_t; 3], // Control points (up to 3 for cubic curves)
    pub next: *mut potrace_segment_t,
}

#[repr(C)]
pub struct potrace_path_t {
    pub curve: *mut potrace_segment_t,   // Linked list of curve segments
    pub next: *mut potrace_path_t,       // Next path
    pub sign: bool,                      // '+' or '-' (outer or inner path)
    pub area: c_double,                  // Area of path
}

#[repr(C)]
pub struct potrace_state_t {
    pub plist: *mut potrace_path_t,     // Linked list of paths
    pub status: c_int,                  // Success/error status
}

extern "C" {
    // Core API functions
    pub fn potrace_param_default() -> *mut potrace_param_t;
    pub fn potrace_param_free(p: *mut potrace_param_t);

    pub fn potrace_bitmap_new(width: c_int, height: c_int) -> *mut potrace_bitmap_t;
    pub fn potrace_bitmap_free(bm: *mut potrace_bitmap_t);
    pub fn potrace_bitmap_set_pixel(bm: *mut potrace_bitmap_t, x: c_int, y: c_int, value: bool);

    pub fn potrace_trace(param: *mut potrace_param_t, bm: *mut potrace_bitmap_t) -> *mut potrace_state_t;
    pub fn potrace_state_free(st: *mut potrace_state_t);

    // Utility functions
    pub fn potrace_path_count(path: *mut potrace_path_t) -> c_int;
    pub fn potrace_path_get_curve(path: *mut potrace_path_t) -> *mut potrace_segment_t;
}