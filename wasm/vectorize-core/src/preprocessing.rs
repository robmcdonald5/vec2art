//! Image preprocessing utilities

use crate::error::{VectorizeError, VectorizeResult};
use image::{ImageBuffer, Rgba, RgbaImage};
use nalgebra::{Vector3, Matrix3};

/// Resize image while maintaining aspect ratio
///
/// # Arguments
/// * `image` - Input RGBA image
/// * `max_dimension` - Maximum width or height
///
/// # Returns
/// * `VectorizeResult<RgbaImage>` - Resized image or error
pub fn resize_image(image: &RgbaImage, max_dimension: u32) -> VectorizeResult<RgbaImage> {
    let (width, height) = image.dimensions();
    
    if width <= max_dimension && height <= max_dimension {
        return Ok(image.clone());
    }
    
    let scale = if width > height {
        max_dimension as f32 / width as f32
    } else {
        max_dimension as f32 / height as f32
    };
    
    let new_width = (width as f32 * scale) as u32;
    let new_height = (height as f32 * scale) as u32;
    
    Ok(image::imageops::resize(
        image,
        new_width,
        new_height,
        image::imageops::FilterType::Lanczos3,
    ))
}

/// Convert RGBA to grayscale using luminance weights
///
/// # Arguments
/// * `image` - Input RGBA image
///
/// # Returns
/// * `Vec<u8>` - Grayscale values (0-255)
pub fn rgba_to_grayscale(image: &RgbaImage) -> Vec<u8> {
    image
        .pixels()
        .map(|&Rgba([r, g, b, _])| {
            // ITU-R BT.709 luma coefficients
            (0.299 * r as f32 + 0.587 * g as f32 + 0.114 * b as f32) as u8
        })
        .collect()
}

/// Apply binary threshold to grayscale image
///
/// # Arguments
/// * `grayscale` - Input grayscale values
/// * `threshold` - Threshold value (0-255)
///
/// # Returns
/// * `Vec<bool>` - Binary mask (true = foreground, false = background)
pub fn apply_threshold(grayscale: &[u8], threshold: u8) -> Vec<bool> {
    grayscale.iter().map(|&pixel| pixel > threshold).collect()
}

/// Calculate Otsu threshold for automatic binarization
///
/// # Arguments
/// * `grayscale` - Input grayscale values
///
/// # Returns
/// * `u8` - Optimal threshold value
pub fn calculate_otsu_threshold(grayscale: &[u8]) -> u8 {
    // Calculate histogram
    let mut histogram = [0u32; 256];
    for &pixel in grayscale {
        histogram[pixel as usize] += 1;
    }
    
    let total_pixels = grayscale.len() as f64;
    let mut sum = 0.0;
    
    for i in 0..256 {
        sum += i as f64 * histogram[i] as f64;
    }
    
    let mut sum_b = 0.0;
    let mut weight_b = 0.0;
    let mut max_variance = 0.0;
    let mut threshold = 0u8;
    
    for i in 0..256 {
        weight_b += histogram[i] as f64;
        if weight_b == 0.0 {
            continue;
        }
        
        let weight_f = total_pixels - weight_b;
        if weight_f == 0.0 {
            break;
        }
        
        sum_b += i as f64 * histogram[i] as f64;
        
        let mean_b = sum_b / weight_b;
        let mean_f = (sum - sum_b) / weight_f;
        
        let between_class_variance = weight_b * weight_f * (mean_b - mean_f).powi(2);
        
        if between_class_variance > max_variance {
            max_variance = between_class_variance;
            threshold = i as u8;
        }
    }
    
    threshold
}

/// Convert RGB to LAB color space
///
/// # Arguments
/// * `r`, `g`, `b` - RGB values (0-255)
///
/// # Returns
/// * `(f32, f32, f32)` - LAB values
pub fn rgb_to_lab(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    // Convert RGB to XYZ (assuming sRGB)
    let mut rgb = [r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0];
    
    // Apply gamma correction
    for component in &mut rgb {
        *component = if *component > 0.04045 {
            ((*component + 0.055) / 1.055).powf(2.4)
        } else {
            *component / 12.92
        };
    }
    
    // Observer = 2°, Illuminant = D65
    let xyz_matrix = Matrix3::new(
        0.4124564, 0.3575761, 0.1804375,
        0.2126729, 0.7151522, 0.0721750,
        0.0193339, 0.1191920, 0.9503041,
    );
    
    let rgb_vec = Vector3::new(rgb[0], rgb[1], rgb[2]);
    let xyz = xyz_matrix * rgb_vec;
    
    // Convert XYZ to LAB
    let xn = 0.95047; // D65 white point
    let yn = 1.00000;
    let zn = 1.08883;
    
    let fx = lab_f(xyz[0] / xn);
    let fy = lab_f(xyz[1] / yn);
    let fz = lab_f(xyz[2] / zn);
    
    let l = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b = 200.0 * (fy - fz);
    
    (l, a, b)
}

fn lab_f(t: f32) -> f32 {
    let delta: f32 = 6.0 / 29.0;
    if t > delta.powi(3) {
        t.powf(1.0 / 3.0)
    } else {
        t / (3.0 * delta.powi(2)) + 4.0 / 29.0
    }
}

/// Calculate Euclidean distance between two LAB colors
///
/// # Arguments
/// * `lab1`, `lab2` - LAB color tuples
///
/// # Returns
/// * `f32` - Color distance
pub fn lab_distance(lab1: (f32, f32, f32), lab2: (f32, f32, f32)) -> f32 {
    let dl = lab1.0 - lab2.0;
    let da = lab1.1 - lab2.1;
    let db = lab1.2 - lab2.2;
    (dl * dl + da * da + db * db).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn test_resize_image() {
        let img = ImageBuffer::from_fn(100, 100, |_, _| Rgba([255, 0, 0, 255]));
        let resized = resize_image(&img, 50).unwrap();
        assert_eq!(resized.dimensions(), (50, 50));
    }

    #[test]
    fn test_rgba_to_grayscale() {
        let mut img = ImageBuffer::new(2, 1);
        img.put_pixel(0, 0, Rgba([255, 255, 255, 255])); // White
        img.put_pixel(1, 0, Rgba([0, 0, 0, 255]));       // Black
        
        let grayscale = rgba_to_grayscale(&img);
        assert_eq!(grayscale, vec![255, 0]);
    }

    #[test]
    fn test_apply_threshold() {
        let grayscale = vec![0, 100, 200, 255];
        let binary = apply_threshold(&grayscale, 128);
        assert_eq!(binary, vec![false, false, true, true]);
    }

    #[test]
    fn test_rgb_to_lab() {
        let (l, a, b) = rgb_to_lab(255, 255, 255); // White
        assert!((l - 100.0).abs() < 1.0); // L should be close to 100
        assert!(a.abs() < 1.0); // A should be close to 0
        assert!(b.abs() < 1.0); // B should be close to 0
    }

    #[test]
    fn test_lab_distance() {
        let white = (100.0, 0.0, 0.0);
        let black = (0.0, 0.0, 0.0);
        let distance = lab_distance(white, black);
        assert!(distance > 90.0); // Should be a large distance
    }
}