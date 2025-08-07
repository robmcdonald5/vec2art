//! Autotrace integration for centerline tracing of line art
//!
//! This module provides Rust bindings for our Autotrace-style C wrapper,
//! enabling centerline tracing that's excellent for line art and sketches.

use crate::algorithms::SvgPath;
use crate::error::{Result, Vec2ArtError};
use crate::ConversionParameters;
use image::{DynamicImage, RgbImage};

#[cfg(feature = "autotrace")]
mod ffi {
    #![allow(non_upper_case_globals)]
    #![allow(non_camel_case_types)]
    #![allow(non_snake_case)]
    #![allow(dead_code)]

    include!("autotrace_bindings.rs");
}

#[cfg(feature = "autotrace")]
pub struct AutotraceVectorizer {
    pub centerline_mode: bool,
}

#[cfg(feature = "autotrace")]
impl AutotraceVectorizer {
    pub fn new(centerline_mode: bool) -> Self {
        AutotraceVectorizer { centerline_mode }
    }

    /// Convert an image using Autotrace algorithm with centerline support
    pub fn vectorize(
        &self,
        image: DynamicImage,
        params: ConversionParameters,
    ) -> Result<Vec<SvgPath>> {
        let rgb_image = image.to_rgb8();

        // Extract parameters - Autotrace works with various parameter types
        let (corner_threshold, line_threshold, despeckle) = match params {
            ConversionParameters::EdgeDetector {
                threshold_high,
                simplification,
                ..
            } => (60.0, threshold_high as f64 / 255.0, simplification as f64),
            ConversionParameters::PathTracer {
                corner_threshold,
                suppress_speckles,
                ..
            } => (corner_threshold as f64, 0.5, suppress_speckles as f64),
            _ => (60.0, 0.5, 2.0), // Default values
        };

        // Create Autotrace bitmap
        let bitmap = self.create_autotrace_bitmap(&rgb_image)?;

        // Set up options
        let options = self.create_autotrace_options(
            corner_threshold,
            line_threshold,
            despeckle,
            self.centerline_mode,
        )?;

        // Perform tracing
        let spline_list = unsafe { ffi::autotrace_image(bitmap, options) };

        if spline_list.is_null() {
            self.cleanup_autotrace_bitmap(bitmap);
            self.cleanup_autotrace_options(options);
            return Err(Vec2ArtError::PathTracingError(
                "Autotrace failed".to_string(),
            ));
        }

        // Extract paths
        let paths = self.extract_paths_from_splines(spline_list)?;

        // Cleanup
        unsafe {
            ffi::autotrace_spline_list_free(spline_list);
        }
        self.cleanup_autotrace_bitmap(bitmap);
        self.cleanup_autotrace_options(options);

        Ok(paths)
    }

    fn create_autotrace_bitmap(&self, image: &RgbImage) -> Result<*mut ffi::autotrace_bitmap_t> {
        let (width, height) = image.dimensions();

        let bitmap = unsafe { ffi::autotrace_bitmap_new(width as i32, height as i32) };

        if bitmap.is_null() {
            return Err(Vec2ArtError::MemoryError);
        }

        // Fill bitmap data
        for y in 0..height {
            for x in 0..width {
                let pixel = image.get_pixel(x, y);
                unsafe {
                    ffi::autotrace_bitmap_set_pixel(
                        bitmap, x as i32, y as i32, pixel[0], pixel[1], pixel[2],
                    );
                }
            }
        }

        Ok(bitmap)
    }

    fn create_autotrace_options(
        &self,
        corner_threshold: f64,
        line_threshold: f64,
        despeckle: f64,
        centerline: bool,
    ) -> Result<*mut ffi::autotrace_options_t> {
        let options = unsafe { ffi::autotrace_options_new() };

        if options.is_null() {
            return Err(Vec2ArtError::MemoryError);
        }

        unsafe {
            (*options).corner_threshold = corner_threshold;
            (*options).line_threshold = line_threshold;
            (*options).line_reversion_threshold = 0.01;
            (*options).filter_iterations = 4.0;
            (*options).centerline = centerline;
            (*options).preserve_width = centerline; // Preserve width info in centerline mode
            (*options).despeckle_level = despeckle;
        }

        Ok(options)
    }

    fn extract_paths_from_splines(
        &self,
        spline_list: *mut ffi::autotrace_spline_list_t,
    ) -> Result<Vec<SvgPath>> {
        let mut svg_paths = Vec::new();

        unsafe {
            let mut current_spline = (*spline_list).splines;

            while !current_spline.is_null() {
                let path_data = self.convert_autotrace_spline_to_svg(current_spline)?;

                if !path_data.is_empty() {
                    let color = format!(
                        "rgb({},{},{})",
                        (*current_spline).color[0],
                        (*current_spline).color[1],
                        (*current_spline).color[2]
                    );

                    let stroke_width = if self.centerline_mode {
                        // In centerline mode, use stroke instead of fill
                        Some(1.0)
                    } else {
                        None
                    };

                    svg_paths.push(SvgPath {
                        data: path_data,
                        fill: if self.centerline_mode {
                            None
                        } else {
                            Some(color.clone())
                        },
                        stroke: if self.centerline_mode {
                            Some(color)
                        } else {
                            None
                        },
                        stroke_width,
                    });
                }

                current_spline = (*current_spline).next;
            }
        }

        Ok(svg_paths)
    }

    fn convert_autotrace_spline_to_svg(
        &self,
        spline: *mut ffi::autotrace_spline_t,
    ) -> Result<String> {
        let mut path_data = String::new();

        unsafe {
            let mut segment = (*spline).segments;
            let mut first_segment = true;

            while !segment.is_null() {
                match (*segment).type_ {
                    ffi::autotrace_segment_type_t::AUTOTRACE_LINETO => {
                        if first_segment {
                            path_data.push_str(&format!(
                                "M {:.2} {:.2} ",
                                (*segment).p1.x,
                                (*segment).p1.y
                            ));
                            first_segment = false;
                        } else {
                            path_data.push_str(&format!(
                                "L {:.2} {:.2} ",
                                (*segment).p1.x,
                                (*segment).p1.y
                            ));
                        }
                    }
                    ffi::autotrace_segment_type_t::AUTOTRACE_CURVETO => {
                        if first_segment {
                            path_data.push_str(&format!(
                                "M {:.2} {:.2} ",
                                (*segment).p1.x,
                                (*segment).p1.y
                            ));
                            first_segment = false;
                        }
                        path_data.push_str(&format!(
                            "C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} ",
                            (*segment).p2.x,
                            (*segment).p2.y,
                            (*segment).p3.x,
                            (*segment).p3.y,
                            (*segment).p1.x,
                            (*segment).p1.y
                        ));
                    }
                }

                segment = (*segment).next;
            }

            if (*spline).closed && !path_data.is_empty() {
                path_data.push('Z');
            }
        }

        Ok(path_data)
    }

    fn cleanup_autotrace_bitmap(&self, bitmap: *mut ffi::autotrace_bitmap_t) {
        if !bitmap.is_null() {
            unsafe {
                ffi::autotrace_bitmap_free(bitmap);
            }
        }
    }

    fn cleanup_autotrace_options(&self, options: *mut ffi::autotrace_options_t) {
        if !options.is_null() {
            unsafe {
                ffi::autotrace_options_free(options);
            }
        }
    }
}

#[cfg(not(feature = "autotrace"))]
pub struct AutotraceVectorizer {
    pub centerline_mode: bool,
}

#[cfg(not(feature = "autotrace"))]
impl AutotraceVectorizer {
    pub fn new(centerline_mode: bool) -> Self {
        AutotraceVectorizer { centerline_mode }
    }

    pub fn vectorize(
        &self,
        _image: DynamicImage,
        _params: ConversionParameters,
    ) -> Result<Vec<SvgPath>> {
        Err(Vec2ArtError::InvalidParameters(
            "Autotrace support not compiled in".to_string(),
        ))
    }
}

/// Check if Autotrace support is available
pub fn is_autotrace_available() -> bool {
    cfg!(feature = "autotrace")
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgb};

    #[test]
    fn test_autotrace_availability() {
        let available = is_autotrace_available();
        println!("Autotrace available: {}", available);
    }

    #[cfg(feature = "autotrace")]
    #[test]
    fn test_autotrace_vectorizer_creation() {
        let vectorizer = AutotraceVectorizer::new(true);
        assert_eq!(vectorizer.centerline_mode, true);

        let vectorizer_outline = AutotraceVectorizer::new(false);
        assert_eq!(vectorizer_outline.centerline_mode, false);
    }

    #[test]
    fn test_bitmap_creation() {
        #[cfg(feature = "autotrace")]
        {
            let vectorizer = AutotraceVectorizer::new(true);
            let image = ImageBuffer::from_fn(50, 50, |x, y| {
                if x == y {
                    Rgb([0, 0, 0])
                } else {
                    Rgb([255, 255, 255])
                }
            });

            let bitmap = vectorizer.create_autotrace_bitmap(&image).unwrap();
            vectorizer.cleanup_autotrace_bitmap(bitmap);
        }
    }
}
