//! Edge-preserving denoising filters for preprocessing

use crate::error::VectorizeResult;
use image::{ImageBuffer, Rgba};
use rayon::prelude::*;

/// Guided filter for edge-preserving denoising
/// 
/// The guided filter is a fast edge-preserving filter that uses a guidance image
/// (usually the input itself) to determine which edges to preserve.
/// 
/// # Parameters
/// - `image`: Input RGBA image
/// - `radius`: Filter radius (typically 2-4 pixels)
/// - `epsilon`: Regularization parameter (0.01-0.04)² for noise control
pub fn guided_filter(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    radius: u32,
    epsilon: f32,
) -> VectorizeResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
    let (width, height) = image.dimensions();
    let mut output = image.clone();
    
    // Convert to grayscale for guidance
    let gray: Vec<f32> = image
        .pixels()
        .map(|p| {
            let r = p[0] as f32 / 255.0;
            let g = p[1] as f32 / 255.0;
            let b = p[2] as f32 / 255.0;
            0.299 * r + 0.587 * g + 0.114 * b
        })
        .collect();
    
    // Process each channel separately
    for channel in 0..3 {
        let input: Vec<f32> = image
            .pixels()
            .map(|p| p[channel] as f32 / 255.0)
            .collect();
        
        let filtered = guided_filter_channel(
            &input,
            &gray,
            width,
            height,
            radius,
            epsilon,
        )?;
        
        // Write back to output
        for (i, pixel) in output.pixels_mut().enumerate() {
            pixel[channel] = (filtered[i] * 255.0).clamp(0.0, 255.0) as u8;
        }
    }
    
    Ok(output)
}

/// Apply guided filter to a single channel
fn guided_filter_channel(
    input: &[f32],
    guide: &[f32],
    width: u32,
    height: u32,
    radius: u32,
    epsilon: f32,
) -> VectorizeResult<Vec<f32>> {
    let size = (width * height) as usize;
    
    // Step 1: Compute mean of guide and input in each window
    let mean_guide = box_filter(guide, width, height, radius)?;
    let mean_input = box_filter(input, width, height, radius)?;
    
    // Step 2: Compute correlation and variance
    let corr_gi: Vec<f32> = guide
        .iter()
        .zip(input.iter())
        .map(|(g, i)| g * i)
        .collect();
    let corr_gi = box_filter(&corr_gi, width, height, radius)?;
    
    let corr_gg: Vec<f32> = guide.iter().map(|g| g * g).collect();
    let var_guide = box_filter(&corr_gg, width, height, radius)?;
    
    // Step 3: Compute coefficients a and b
    let mut a = vec![0.0; size];
    let mut b = vec![0.0; size];
    
    for i in 0..size {
        let cov_gi = corr_gi[i] - mean_guide[i] * mean_input[i];
        let var_g = var_guide[i] - mean_guide[i] * mean_guide[i];
        
        a[i] = cov_gi / (var_g + epsilon);
        b[i] = mean_input[i] - a[i] * mean_guide[i];
    }
    
    // Step 4: Compute mean of coefficients
    let mean_a = box_filter(&a, width, height, radius)?;
    let mean_b = box_filter(&b, width, height, radius)?;
    
    // Step 5: Compute output
    let output: Vec<f32> = guide
        .iter()
        .enumerate()
        .map(|(i, g)| mean_a[i] * g + mean_b[i])
        .collect();
    
    Ok(output)
}

/// Box filter (mean filter) implementation
fn box_filter(
    input: &[f32],
    width: u32,
    height: u32,
    radius: u32,
) -> VectorizeResult<Vec<f32>> {
    let mut output = vec![0.0; input.len()];
    let w = width as i32;
    let h = height as i32;
    let r = radius as i32;
    
    // Parallel processing by rows
    output
        .par_chunks_mut(width as usize)
        .enumerate()
        .for_each(|(y, row)| {
            let y = y as i32;
            for x in 0..w {
                let mut sum = 0.0;
                let mut count = 0.0;
                
                for dy in -r..=r {
                    for dx in -r..=r {
                        let ny = y + dy;
                        let nx = x + dx;
                        
                        if ny >= 0 && ny < h && nx >= 0 && nx < w {
                            let idx = (ny * w + nx) as usize;
                            sum += input[idx];
                            count += 1.0;
                        }
                    }
                }
                
                row[x as usize] = sum / count;
            }
        });
    
    Ok(output)
}

/// Enhanced bilateral filter for edge-preserving smoothing
/// 
/// The bilateral filter smooths images while preserving edges by combining
/// spatial and range kernels.
/// 
/// # Parameters
/// - `image`: Input RGBA image
/// - `spatial_sigma`: Standard deviation for spatial kernel (2-3 pixels)
/// - `range_sigma`: Standard deviation for range kernel (8-12 in [0,255] scale)
pub fn bilateral_filter_enhanced(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    spatial_sigma: f32,
    range_sigma: f32,
) -> VectorizeResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
    let (width, height) = image.dimensions();
    let mut output = ImageBuffer::new(width, height);
    
    // Determine kernel size based on spatial sigma
    let kernel_radius = (2.0 * spatial_sigma).ceil() as i32;
    
    // Precompute spatial weights
    let spatial_weights = precompute_spatial_weights(kernel_radius, spatial_sigma);
    let spatial_weights = std::sync::Arc::new(spatial_weights);
    
    // Process each pixel in parallel
    let pixels: Vec<_> = (0..height)
        .into_par_iter()
        .flat_map(|y| {
            let weights = spatial_weights.clone();
            (0..width).into_par_iter().map(move |x| {
                apply_bilateral_at_pixel(
                    image,
                    x,
                    y,
                    kernel_radius,
                    &weights,
                    range_sigma,
                )
            })
        })
        .collect();
    
    // Write pixels to output
    for (i, pixel) in pixels.iter().enumerate() {
        let x = (i as u32) % width;
        let y = (i as u32) / width;
        output.put_pixel(x, y, *pixel);
    }
    
    Ok(output)
}

/// Precompute spatial weights for bilateral filter
fn precompute_spatial_weights(radius: i32, sigma: f32) -> Vec<f32> {
    let size = (2 * radius + 1) as usize;
    let mut weights = Vec::with_capacity(size * size);
    let sigma2 = sigma * sigma;
    
    for dy in -radius..=radius {
        for dx in -radius..=radius {
            let dist2 = (dx * dx + dy * dy) as f32;
            weights.push((-dist2 / (2.0 * sigma2)).exp());
        }
    }
    
    weights
}

/// Apply bilateral filter at a single pixel
fn apply_bilateral_at_pixel(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    x: u32,
    y: u32,
    radius: i32,
    spatial_weights: &[f32],
    range_sigma: f32,
) -> Rgba<u8> {
    let (width, height) = image.dimensions();
    let center_pixel = image.get_pixel(x, y);
    let range_sigma2 = range_sigma * range_sigma;
    
    let mut total_r = 0.0;
    let mut total_g = 0.0;
    let mut total_b = 0.0;
    let mut total_weight = 0.0;
    
    let mut weight_idx = 0;
    for dy in -radius..=radius {
        for dx in -radius..=radius {
            let nx = (x as i32 + dx) as u32;
            let ny = (y as i32 + dy) as u32;
            
            if nx < width && ny < height {
                let neighbor = image.get_pixel(nx, ny);
                
                // Calculate range weight
                let dr = (center_pixel[0] as f32 - neighbor[0] as f32).abs();
                let dg = (center_pixel[1] as f32 - neighbor[1] as f32).abs();
                let db = (center_pixel[2] as f32 - neighbor[2] as f32).abs();
                let range_dist2 = dr * dr + dg * dg + db * db;
                let range_weight = (-range_dist2 / (2.0 * range_sigma2)).exp();
                
                // Combine spatial and range weights
                let weight = spatial_weights[weight_idx] * range_weight;
                
                total_r += neighbor[0] as f32 * weight;
                total_g += neighbor[1] as f32 * weight;
                total_b += neighbor[2] as f32 * weight;
                total_weight += weight;
            }
            weight_idx += 1;
        }
    }
    
    if total_weight > 0.0 {
        Rgba([
            (total_r / total_weight).clamp(0.0, 255.0) as u8,
            (total_g / total_weight).clamp(0.0, 255.0) as u8,
            (total_b / total_weight).clamp(0.0, 255.0) as u8,
            center_pixel[3], // Preserve alpha
        ])
    } else {
        *center_pixel
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_guided_filter() {
        let mut image = ImageBuffer::new(10, 10);
        for pixel in image.pixels_mut() {
            *pixel = Rgba([128, 128, 128, 255]);
        }
        
        let filtered = guided_filter(&image, 2, 0.01).unwrap();
        assert_eq!(filtered.dimensions(), (10, 10));
    }
    
    #[test]
    fn test_bilateral_filter() {
        let mut image = ImageBuffer::new(10, 10);
        for pixel in image.pixels_mut() {
            *pixel = Rgba([128, 128, 128, 255]);
        }
        
        let filtered = bilateral_filter_enhanced(&image, 2.0, 10.0).unwrap();
        assert_eq!(filtered.dimensions(), (10, 10));
    }
    
    #[test]
    fn test_box_filter() {
        let input = vec![1.0; 100];
        let filtered = box_filter(&input, 10, 10, 1).unwrap();
        assert_eq!(filtered.len(), 100);
        assert!((filtered[50] - 1.0).abs() < 0.001);
    }
}