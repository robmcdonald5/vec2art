use image::{GrayImage, Luma};

/// Apply a 3x3 convolution kernel to a grayscale image
pub fn convolve_3x3(image: &GrayImage, kernel: [[f32; 3]; 3]) -> GrayImage {
    let (width, height) = image.dimensions();
    let mut output = GrayImage::new(width, height);
    
    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut sum = 0.0;
            
            for ky in 0..3 {
                for kx in 0..3 {
                    let px = image.get_pixel(x + kx - 1, y + ky - 1)[0];
                    sum += px as f32 * kernel[ky][kx];
                }
            }
            
            // Clamp to valid range
            let value = sum.max(0.0).min(255.0) as u8;
            output.put_pixel(x, y, Luma([value]));
        }
    }
    
    // Handle borders by copying from original
    for x in 0..width {
        output.put_pixel(x, 0, *image.get_pixel(x, 0));
        output.put_pixel(x, height - 1, *image.get_pixel(x, height - 1));
    }
    
    for y in 0..height {
        output.put_pixel(0, y, *image.get_pixel(0, y));
        output.put_pixel(width - 1, y, *image.get_pixel(width - 1, y));
    }
    
    output
}

/// Sobel edge detection kernels
pub const SOBEL_X: [[f32; 3]; 3] = [
    [-1.0,  0.0,  1.0],
    [-2.0,  0.0,  2.0],
    [-1.0,  0.0,  1.0],
];

pub const SOBEL_Y: [[f32; 3]; 3] = [
    [-1.0, -2.0, -1.0],
    [ 0.0,  0.0,  0.0],
    [ 1.0,  2.0,  1.0],
];

/// Apply Sobel edge detection
pub fn sobel_edge_detection(image: &GrayImage) -> (GrayImage, GrayImage) {
    let gx = convolve_3x3(image, SOBEL_X);
    let gy = convolve_3x3(image, SOBEL_Y);
    
    let (width, height) = image.dimensions();
    let mut magnitude = GrayImage::new(width, height);
    let mut direction = GrayImage::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            let gx_val = gx.get_pixel(x, y)[0] as f32;
            let gy_val = gy.get_pixel(x, y)[0] as f32;
            
            let mag = (gx_val * gx_val + gy_val * gy_val).sqrt();
            let dir = gy_val.atan2(gx_val);
            
            magnitude.put_pixel(x, y, Luma([mag.min(255.0) as u8]));
            
            // Convert direction to 0-255 range for storage
            let dir_normalized = ((dir + std::f32::consts::PI) / (2.0 * std::f32::consts::PI) * 255.0) as u8;
            direction.put_pixel(x, y, Luma([dir_normalized]));
        }
    }
    
    (magnitude, direction)
}

/// Gaussian blur kernel generator
pub fn gaussian_kernel(size: usize, sigma: f32) -> Vec<Vec<f32>> {
    assert!(size % 2 == 1, "Kernel size must be odd");
    
    let mut kernel = vec![vec![0.0; size]; size];
    let center = (size / 2) as f32;
    let mut sum = 0.0;
    
    for y in 0..size {
        for x in 0..size {
            let dx = x as f32 - center;
            let dy = y as f32 - center;
            let value = (-0.5 * (dx * dx + dy * dy) / (sigma * sigma)).exp();
            kernel[y][x] = value;
            sum += value;
        }
    }
    
    // Normalize
    for y in 0..size {
        for x in 0..size {
            kernel[y][x] /= sum;
        }
    }
    
    kernel
}

/// Apply Gaussian blur to image
pub fn gaussian_blur(image: &GrayImage, sigma: f32) -> GrayImage {
    // For sigma >= 1.0, use 5x5 kernel, otherwise 3x3
    let kernel_size = if sigma >= 1.0 { 5 } else { 3 };
    let kernel = gaussian_kernel(kernel_size, sigma);
    
    let (width, height) = image.dimensions();
    let mut output = GrayImage::new(width, height);
    let offset = kernel_size / 2;
    
    for y in offset..(height as usize - offset) {
        for x in offset..(width as usize - offset) {
            let mut sum = 0.0;
            
            for ky in 0..kernel_size {
                for kx in 0..kernel_size {
                    let px = image.get_pixel(
                        (x + kx - offset) as u32,
                        (y + ky - offset) as u32
                    )[0];
                    sum += px as f32 * kernel[ky][kx];
                }
            }
            
            output.put_pixel(x as u32, y as u32, Luma([sum as u8]));
        }
    }
    
    // Handle borders
    for x in 0..width {
        for y in 0..offset as u32 {
            output.put_pixel(x, y, *image.get_pixel(x, y));
            output.put_pixel(x, height - 1 - y, *image.get_pixel(x, height - 1 - y));
        }
    }
    
    for y in 0..height {
        for x in 0..offset as u32 {
            output.put_pixel(x, y, *image.get_pixel(x, y));
            output.put_pixel(width - 1 - x, y, *image.get_pixel(width - 1 - x, y));
        }
    }
    
    output
}

/// Non-maximum suppression for edge thinning (used in Canny edge detection)
pub fn non_maximum_suppression(magnitude: &GrayImage, direction: &GrayImage) -> GrayImage {
    let (width, height) = magnitude.dimensions();
    let mut output = GrayImage::new(width, height);
    
    for y in 1..height-1 {
        for x in 1..width-1 {
            let mag = magnitude.get_pixel(x, y)[0] as f32;
            let dir = direction.get_pixel(x, y)[0] as f32 / 255.0 * 2.0 * std::f32::consts::PI - std::f32::consts::PI;
            
            // Quantize direction to 8 directions
            let dir_idx = ((dir + std::f32::consts::PI) / (std::f32::consts::PI / 4.0)).round() as usize % 8;
            
            let (dx1, dy1, dx2, dy2) = match dir_idx {
                0 | 4 => (1, 0, -1, 0),   // Horizontal
                1 | 5 => (1, -1, -1, 1),   // Diagonal /
                2 | 6 => (0, -1, 0, 1),    // Vertical
                3 | 7 => (-1, -1, 1, 1),   // Diagonal \
                _ => (1, 0, -1, 0),
            };
            
            let mag1 = magnitude.get_pixel((x as i32 + dx1) as u32, (y as i32 + dy1) as u32)[0] as f32;
            let mag2 = magnitude.get_pixel((x as i32 + dx2) as u32, (y as i32 + dy2) as u32)[0] as f32;
            
            if mag >= mag1 && mag >= mag2 {
                output.put_pixel(x, y, Luma([mag as u8]));
            } else {
                output.put_pixel(x, y, Luma([0]));
            }
        }
    }
    
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_gaussian_kernel() {
        let kernel = gaussian_kernel(3, 1.0);
        assert_eq!(kernel.len(), 3);
        assert_eq!(kernel[0].len(), 3);
        
        // Check that kernel sums to approximately 1
        let sum: f32 = kernel.iter().flat_map(|row| row.iter()).sum();
        assert!((sum - 1.0).abs() < 0.001);
    }
}