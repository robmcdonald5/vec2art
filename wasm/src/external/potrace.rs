//! Potrace integration for high-quality bi-level image tracing
//!
//! This module provides Rust bindings for our Potrace-style C wrapper,
//! enabling high-quality vectorization of bi-level (black and white) images.

use crate::algorithms::SvgPath;
use crate::error::{Result, Vec2ArtError};
use crate::ConversionParameters;
use image::{DynamicImage, GrayImage, Luma};

#[cfg(feature = "potrace")]
mod ffi {
    #![allow(non_upper_case_globals)]
    #![allow(non_camel_case_types)]
    #![allow(non_snake_case)]
    #![allow(dead_code)]

    include!("potrace_bindings.rs");
}

#[cfg(feature = "potrace")]
pub struct PotraceVectorizer;

#[cfg(feature = "potrace")]
impl PotraceVectorizer {
    pub fn new() -> Self {
        PotraceVectorizer
    }

    /// Convert a bi-level image using Potrace algorithm
    pub fn vectorize(
        &self,
        image: DynamicImage,
        params: ConversionParameters,
    ) -> Result<Vec<SvgPath>> {
        let gray_image = image.to_luma8();

        // Extract parameters
        let (threshold, curve_smoothing, corner_threshold, optimize_curves) = match params {
            ConversionParameters::PathTracer {
                threshold,
                curve_smoothing,
                corner_threshold,
                optimize_curves,
                ..
            } => (
                threshold,
                curve_smoothing,
                corner_threshold,
                optimize_curves,
            ),
            _ => {
                return Err(Vec2ArtError::InvalidParameters(
                    "Potrace requires PathTracer parameters".to_string(),
                ))
            }
        };

        // Convert to binary image
        let binary_image = self.convert_to_binary(&gray_image, threshold)?;

        // Create Potrace bitmap
        let bitmap = self.create_potrace_bitmap(&binary_image)?;

        // Set up parameters
        let potrace_params =
            self.create_potrace_params(curve_smoothing, corner_threshold, optimize_curves)?;

        // Perform tracing
        let state = unsafe { ffi::potrace_trace(potrace_params, bitmap) };

        if state.is_null() {
            self.cleanup_potrace_bitmap(bitmap);
            self.cleanup_potrace_params(potrace_params);
            return Err(Vec2ArtError::PathTracingError("Potrace failed".to_string()));
        }

        // Extract paths
        let paths = self.extract_paths_from_state(state)?;

        // Cleanup
        unsafe {
            ffi::potrace_state_free(state);
        }
        self.cleanup_potrace_bitmap(bitmap);
        self.cleanup_potrace_params(potrace_params);

        Ok(paths)
    }

    fn convert_to_binary(&self, gray_image: &GrayImage, threshold: f32) -> Result<GrayImage> {
        let threshold_u8 = (threshold * 255.0) as u8;
        let (width, height) = gray_image.dimensions();

        let mut binary = GrayImage::new(width, height);

        for y in 0..height {
            for x in 0..width {
                let pixel = gray_image.get_pixel(x, y);
                let binary_value = if pixel[0] > threshold_u8 { 255 } else { 0 };
                binary.put_pixel(x, y, Luma([binary_value]));
            }
        }

        Ok(binary)
    }

    fn create_potrace_bitmap(&self, image: &GrayImage) -> Result<*mut ffi::potrace_bitmap_t> {
        let (width, height) = image.dimensions();

        let bitmap = unsafe { ffi::potrace_bitmap_new(width as i32, height as i32) };

        if bitmap.is_null() {
            return Err(Vec2ArtError::MemoryError);
        }

        // Fill bitmap data
        for y in 0..height {
            for x in 0..width {
                let pixel = image.get_pixel(x, y);
                let is_black = pixel[0] < 128;
                unsafe {
                    ffi::potrace_bitmap_set_pixel(bitmap, x as i32, y as i32, is_black);
                }
            }
        }

        Ok(bitmap)
    }

    fn create_potrace_params(
        &self,
        curve_smoothing: f32,
        corner_threshold: f32,
        optimize_curves: bool,
    ) -> Result<*mut ffi::potrace_param_t> {
        let params = unsafe { ffi::potrace_param_default() };

        if params.is_null() {
            return Err(Vec2ArtError::MemoryError);
        }

        unsafe {
            (*params).turdsize = 2.0; // Filter small speckles
            (*params).turnpolicy = 0.4; // Balanced turn policy
            (*params).alphamax = corner_threshold as f64 / 60.0; // Convert degrees to ratio
            (*params).opticurve = optimize_curves;
            (*params).opttolerance = curve_smoothing as f64;
        }

        Ok(params)
    }

    fn extract_paths_from_state(&self, state: *mut ffi::potrace_state_t) -> Result<Vec<SvgPath>> {
        let mut svg_paths = Vec::new();

        unsafe {
            let mut current_path = (*state).plist;

            while !current_path.is_null() {
                let path_data = self.convert_potrace_path_to_svg(current_path)?;

                if !path_data.is_empty() {
                    svg_paths.push(SvgPath {
                        data: path_data,
                        fill: Some("black".to_string()),
                        stroke: None,
                        stroke_width: None,
                    });
                }

                current_path = (*current_path).next;
            }
        }

        Ok(svg_paths)
    }

    fn convert_potrace_path_to_svg(&self, path: *mut ffi::potrace_path_t) -> Result<String> {
        let mut path_data = String::new();

        unsafe {
            let mut segment = (*path).curve;
            let mut first_point = true;

            while !segment.is_null() {
                match (*segment).type_ {
                    ffi::potrace_segment_type_t::POTRACE_CORNER => {
                        if first_point {
                            path_data.push_str(&format!(
                                "M {:.2} {:.2} ",
                                (*segment).c[0].x,
                                (*segment).c[0].y
                            ));
                            first_point = false;
                        } else {
                            path_data.push_str(&format!(
                                "L {:.2} {:.2} ",
                                (*segment).c[0].x,
                                (*segment).c[0].y
                            ));
                        }
                    }
                    ffi::potrace_segment_type_t::POTRACE_CURVETO => {
                        if first_point {
                            path_data.push_str(&format!(
                                "M {:.2} {:.2} ",
                                (*segment).c[0].x,
                                (*segment).c[0].y
                            ));
                            first_point = false;
                        }
                        path_data.push_str(&format!(
                            "C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} ",
                            (*segment).c[0].x,
                            (*segment).c[0].y,
                            (*segment).c[1].x,
                            (*segment).c[1].y,
                            (*segment).c[2].x,
                            (*segment).c[2].y
                        ));
                    }
                }

                segment = (*segment).next;
            }
        }

        if !path_data.is_empty() {
            path_data.push('Z'); // Close path
        }

        Ok(path_data)
    }

    fn cleanup_potrace_bitmap(&self, bitmap: *mut ffi::potrace_bitmap_t) {
        if !bitmap.is_null() {
            unsafe {
                ffi::potrace_bitmap_free(bitmap);
            }
        }
    }

    fn cleanup_potrace_params(&self, params: *mut ffi::potrace_param_t) {
        if !params.is_null() {
            unsafe {
                ffi::potrace_param_free(params);
            }
        }
    }
}

#[cfg(not(feature = "potrace"))]
pub struct PotraceVectorizer;

#[cfg(not(feature = "potrace"))]
impl PotraceVectorizer {
    pub fn new() -> Self {
        PotraceVectorizer
    }

    pub fn vectorize(
        &self,
        _image: DynamicImage,
        _params: ConversionParameters,
    ) -> Result<Vec<SvgPath>> {
        Err(Vec2ArtError::InvalidParameters(
            "Potrace support not compiled in".to_string(),
        ))
    }
}

/// Check if Potrace support is available
pub fn is_potrace_available() -> bool {
    cfg!(feature = "potrace")
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Luma};

    #[test]
    fn test_potrace_availability() {
        // Test should pass regardless of feature flag
        let available = is_potrace_available();
        println!("Potrace available: {}", available);
    }

    #[cfg(feature = "potrace")]
    #[test]
    fn test_potrace_vectorizer_creation() {
        let vectorizer = PotraceVectorizer::new();
        // Test basic creation works
    }

    #[test]
    fn test_binary_conversion() {
        #[cfg(feature = "potrace")]
        {
            let vectorizer = PotraceVectorizer::new();
            let image =
                ImageBuffer::from_fn(
                    100,
                    100,
                    |x, y| {
                        if x < 50 {
                            Luma([0])
                        } else {
                            Luma([255])
                        }
                    },
                );

            let binary = vectorizer.convert_to_binary(&image, 0.5).unwrap();
            assert_eq!(binary.dimensions(), (100, 100));
        }
    }
}
