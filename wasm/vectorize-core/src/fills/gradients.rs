//! Enhanced gradient estimation with PCA and multi-stop support

use crate::error::{VectorizeError, VectorizeResult};
use crate::preprocessing::{lab_distance, lab_to_rgb, rgb_to_lab};
use image::{ImageBuffer, Rgba};
use nalgebra::Vector2;
use std::collections::HashMap;

/// Gradient fill type
#[derive(Clone, Debug)]
pub enum GradientType {
    Linear {
        start: (f32, f32),
        end: (f32, f32),
    },
    Radial {
        center: (f32, f32),
        radius: f32,
    },
}

/// Gradient stop with position and color
#[derive(Clone, Debug)]
pub struct GradientStop {
    pub position: f32, // 0.0 to 1.0
    pub color: (u8, u8, u8),
    pub lab: (f32, f32, f32),
}

/// Complete gradient specification
#[derive(Clone, Debug)]
pub struct Gradient {
    pub gradient_type: GradientType,
    pub stops: Vec<GradientStop>,
    pub error_reduction: f32, // How much error this gradient reduces vs flat fill
}

/// Analyze a region for gradient patterns using PCA
pub fn analyze_region_gradient_pca(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    max_stops: usize,
) -> VectorizeResult<Option<Gradient>> {
    if pixels.len() < 10 {
        return Ok(None); // Too few pixels for meaningful gradient
    }
    
    // Calculate mean position and color
    let (mean_x, mean_y, mean_lab) = calculate_means(pixels, image)?;
    
    // Calculate principal axis using simplified PCA
    let (principal_axis, variance_ratio) = calculate_principal_axis(pixels, mean_x, mean_y);
    
    // Check if region has sufficient spread
    if variance_ratio < 0.1 {
        // Region is too linear, might be better as gradient
        // Try linear gradient along principal axis
        if let Some(linear) = fit_linear_gradient_pca(
            pixels,
            image,
            mean_x,
            mean_y,
            principal_axis,
            mean_lab,
            max_stops,
        )? {
            return Ok(Some(linear));
        }
    }
    
    // Try radial gradient if linear didn't work well
    if variance_ratio > 0.3 {
        if let Some(radial) = fit_radial_gradient_pca(
            pixels,
            image,
            mean_x,
            mean_y,
            mean_lab,
            max_stops,
        )? {
            return Ok(Some(radial));
        }
    }
    
    Ok(None)
}

/// Fit a linear gradient along the principal axis
fn fit_linear_gradient_pca(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    mean_x: f32,
    mean_y: f32,
    axis: Vector2<f32>,
    mean_lab: (f32, f32, f32),
    max_stops: usize,
) -> VectorizeResult<Option<Gradient>> {
    // Project pixels onto principal axis
    let mut projections: Vec<(f32, (f32, f32, f32))> = Vec::new();
    
    for &(x, y) in pixels {
        let px = x as f32 - mean_x;
        let py = y as f32 - mean_y;
        let projection = px * axis[0] as f32 + py * axis[1] as f32;
        
        let pixel = image.get_pixel(x, y);
        let lab = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
        projections.push((projection, lab));
    }
    
    // Sort by projection
    projections.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    
    // Find extent
    let min_proj = projections.first().unwrap().0;
    let max_proj = projections.last().unwrap().0;
    let range = max_proj - min_proj;
    
    if range < 5.0 {
        return Ok(None); // Too small for gradient
    }
    
    // Calculate gradient endpoints
    let start_x = mean_x + min_proj * axis[0] as f32;
    let start_y = mean_y + min_proj * axis[1] as f32;
    let end_x = mean_x + max_proj * axis[0] as f32;
    let end_y = mean_y + max_proj * axis[1] as f32;
    
    // Create gradient stops at quantiles
    let stops = create_gradient_stops(&projections, min_proj, max_proj, max_stops)?;
    
    // Calculate error reduction
    let flat_error = calculate_flat_fill_error(pixels, image, mean_lab)?;
    let gradient_error = calculate_gradient_error(
        pixels,
        image,
        &GradientType::Linear {
            start: (start_x, start_y),
            end: (end_x, end_y),
        },
        &stops,
    )?;
    
    let error_reduction = (flat_error - gradient_error) / flat_error.max(0.001);
    
    // Only use gradient if it significantly reduces error
    if error_reduction > 0.2 {
        Ok(Some(Gradient {
            gradient_type: GradientType::Linear {
                start: (start_x, start_y),
                end: (end_x, end_y),
            },
            stops,
            error_reduction,
        }))
    } else {
        Ok(None)
    }
}

/// Fit a radial gradient centered at region centroid
fn fit_radial_gradient_pca(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    center_x: f32,
    center_y: f32,
    mean_lab: (f32, f32, f32),
    max_stops: usize,
) -> VectorizeResult<Option<Gradient>> {
    // Calculate radial distances and colors
    let mut radial_data: Vec<(f32, (f32, f32, f32))> = Vec::new();
    let mut max_radius = 0.0f32;
    
    for &(x, y) in pixels {
        let dx = x as f32 - center_x;
        let dy = y as f32 - center_y;
        let radius = (dx * dx + dy * dy).sqrt();
        max_radius = max_radius.max(radius);
        
        let pixel = image.get_pixel(x, y);
        let lab = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
        radial_data.push((radius, lab));
    }
    
    if max_radius < 5.0 {
        return Ok(None); // Too small for radial gradient
    }
    
    // Sort by radius
    radial_data.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    
    // Create gradient stops
    let stops = create_gradient_stops(&radial_data, 0.0, max_radius, max_stops)?;
    
    // Calculate error reduction
    let flat_error = calculate_flat_fill_error(pixels, image, mean_lab)?;
    let gradient_error = calculate_gradient_error(
        pixels,
        image,
        &GradientType::Radial {
            center: (center_x, center_y),
            radius: max_radius,
        },
        &stops,
    )?;
    
    let error_reduction = (flat_error - gradient_error) / flat_error.max(0.001);
    
    // Only use gradient if it significantly reduces error
    if error_reduction > 0.25 {
        Ok(Some(Gradient {
            gradient_type: GradientType::Radial {
                center: (center_x, center_y),
                radius: max_radius,
            },
            stops,
            error_reduction,
        }))
    } else {
        Ok(None)
    }
}

/// Create gradient stops at optimal positions
pub(crate) fn create_gradient_stops(
    data: &[(f32, (f32, f32, f32))],
    min_pos: f32,
    max_pos: f32,
    max_stops: usize,
) -> VectorizeResult<Vec<GradientStop>> {
    let range = max_pos - min_pos;
    if range <= 0.0 {
        return Err(VectorizeError::algorithm_error("Invalid gradient range"));
    }
    
    // Determine number of stops based on color variation
    let color_variance = calculate_color_variance(data);
    let num_stops = if color_variance < 5.0 {
        2
    } else if color_variance < 15.0 {
        3.min(max_stops)
    } else {
        max_stops
    };
    
    let mut stops = Vec::new();
    
    if num_stops == 2 {
        // Simple two-stop gradient
        let start_lab = data.first().unwrap().1;
        let end_lab = data.last().unwrap().1;
        
        stops.push(GradientStop {
            position: 0.0,
            color: lab_to_rgb(start_lab.0, start_lab.1, start_lab.2),
            lab: start_lab,
        });
        stops.push(GradientStop {
            position: 1.0,
            color: lab_to_rgb(end_lab.0, end_lab.1, end_lab.2),
            lab: end_lab,
        });
    } else {
        // Multi-stop gradient at quantiles
        let quantiles = calculate_quantiles(num_stops);
        
        for (i, &quantile) in quantiles.iter().enumerate() {
            let idx = ((data.len() - 1) as f32 * quantile) as usize;
            let (pos, lab) = data[idx];
            
            stops.push(GradientStop {
                position: if i == 0 {
                    0.0
                } else if i == quantiles.len() - 1 {
                    1.0
                } else {
                    (pos - min_pos) / range
                },
                color: lab_to_rgb(lab.0, lab.1, lab.2),
                lab,
            });
        }
    }
    
    // Ensure stops are properly ordered
    stops.sort_by(|a, b| a.position.partial_cmp(&b.position).unwrap());
    
    Ok(stops)
}

/// Calculate means for position and color
pub(crate) fn calculate_means(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> VectorizeResult<(f32, f32, (f32, f32, f32))> {
    let mut sum_x = 0.0;
    let mut sum_y = 0.0;
    let mut sum_l = 0.0;
    let mut sum_a = 0.0;
    let mut sum_b = 0.0;
    
    for &(x, y) in pixels {
        sum_x += x as f32;
        sum_y += y as f32;
        
        let pixel = image.get_pixel(x, y);
        let (l, a, b) = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
        sum_l += l;
        sum_a += a;
        sum_b += b;
    }
    
    let count = pixels.len() as f32;
    Ok((
        sum_x / count,
        sum_y / count,
        (sum_l / count, sum_a / count, sum_b / count),
    ))
}

/// Calculate principal axis using simplified PCA
pub(crate) fn calculate_principal_axis(
    pixels: &[(u32, u32)],
    mean_x: f32,
    mean_y: f32,
) -> (Vector2<f32>, f32) {
    let mut cov_xx = 0.0;
    let mut cov_xy = 0.0;
    let mut cov_yy = 0.0;
    
    for &(x, y) in pixels {
        let dx = x as f32 - mean_x;
        let dy = y as f32 - mean_y;
        
        cov_xx += dx * dx;
        cov_xy += dx * dy;
        cov_yy += dy * dy;
    }
    
    let n = pixels.len() as f32;
    cov_xx /= n;
    cov_xy /= n;
    cov_yy /= n;
    
    // Calculate eigenvalues using quadratic formula
    let trace = cov_xx + cov_yy;
    let det = cov_xx * cov_yy - cov_xy * cov_xy;
    let discriminant = (trace * trace - 4.0 * det).max(0.0).sqrt();
    
    let lambda1 = (trace + discriminant) / 2.0;
    let lambda2 = (trace - discriminant) / 2.0;
    
    // Calculate eigenvector for largest eigenvalue
    let principal_axis = if cov_xy.abs() > 1e-6 {
        let vx = lambda1 - cov_yy;
        let vy = cov_xy;
        let norm = (vx * vx + vy * vy).sqrt();
        Vector2::new(vx / norm, vy / norm)
    } else {
        // Diagonal matrix, use standard basis
        if cov_xx > cov_yy {
            Vector2::new(1.0, 0.0)
        } else {
            Vector2::new(0.0, 1.0)
        }
    };
    
    // Calculate variance ratio
    let total_variance = lambda1 + lambda2;
    let variance_ratio = if total_variance > 1e-6 {
        lambda2 / total_variance
    } else {
        0.5
    };
    
    (principal_axis, variance_ratio)
}

/// Calculate color variance in dataset
pub(crate) fn calculate_color_variance(data: &[(f32, (f32, f32, f32))]) -> f32 {
    if data.is_empty() {
        return 0.0;
    }
    
    // Calculate mean LAB
    let mut mean_l = 0.0;
    let mut mean_a = 0.0;
    let mut mean_b = 0.0;
    
    for (_, lab) in data {
        mean_l += lab.0;
        mean_a += lab.1;
        mean_b += lab.2;
    }
    
    let n = data.len() as f32;
    mean_l /= n;
    mean_a /= n;
    mean_b /= n;
    
    // Calculate variance
    let mut variance = 0.0;
    for (_, lab) in data {
        let dl = lab.0 - mean_l;
        let da = lab.1 - mean_a;
        let db = lab.2 - mean_b;
        variance += dl * dl + da * da + db * db;
    }
    
    (variance / n).sqrt()
}

/// Calculate quantile positions for gradient stops
pub(crate) fn calculate_quantiles(num_stops: usize) -> Vec<f32> {
    let mut quantiles = Vec::new();
    for i in 0..num_stops {
        quantiles.push(i as f32 / (num_stops - 1) as f32);
    }
    quantiles
}

/// Calculate error for flat fill
pub(crate) fn calculate_flat_fill_error(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    mean_lab: (f32, f32, f32),
) -> VectorizeResult<f32> {
    let mut total_error = 0.0;
    
    for &(x, y) in pixels {
        let pixel = image.get_pixel(x, y);
        let lab = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
        total_error += lab_distance(lab, mean_lab);
    }
    
    Ok(total_error / pixels.len() as f32)
}

/// Calculate error for gradient fill
pub(crate) fn calculate_gradient_error(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    gradient_type: &GradientType,
    stops: &[GradientStop],
) -> VectorizeResult<f32> {
    let mut total_error = 0.0;
    
    for &(x, y) in pixels {
        let t = match gradient_type {
            GradientType::Linear { start, end } => {
                calculate_linear_position(x as f32, y as f32, *start, *end)
            }
            GradientType::Radial { center, radius } => {
                calculate_radial_position(x as f32, y as f32, *center, *radius)
            }
        };
        
        let interpolated = interpolate_gradient_color(t, stops);
        let pixel = image.get_pixel(x, y);
        let actual = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
        
        total_error += lab_distance(actual, interpolated);
    }
    
    Ok(total_error / pixels.len() as f32)
}

/// Calculate position along linear gradient
pub(crate) fn calculate_linear_position(
    x: f32,
    y: f32,
    start: (f32, f32),
    end: (f32, f32),
) -> f32 {
    let dx = end.0 - start.0;
    let dy = end.1 - start.1;
    let len2 = dx * dx + dy * dy;
    
    if len2 < 1e-6 {
        return 0.0;
    }
    
    let t = ((x - start.0) * dx + (y - start.1) * dy) / len2;
    t.clamp(0.0, 1.0)
}

/// Calculate position along radial gradient
pub(crate) fn calculate_radial_position(
    x: f32,
    y: f32,
    center: (f32, f32),
    radius: f32,
) -> f32 {
    if radius < 1e-6 {
        return 0.0;
    }
    
    let dx = x - center.0;
    let dy = y - center.1;
    let dist = (dx * dx + dy * dy).sqrt();
    
    (dist / radius).clamp(0.0, 1.0)
}

/// Interpolate color at position in gradient
pub(crate) fn interpolate_gradient_color(t: f32, stops: &[GradientStop]) -> (f32, f32, f32) {
    if stops.is_empty() {
        return (50.0, 0.0, 0.0); // Default gray
    }
    
    if stops.len() == 1 || t <= 0.0 {
        return stops[0].lab;
    }
    
    if t >= 1.0 {
        return stops.last().unwrap().lab;
    }
    
    // Find surrounding stops
    for i in 1..stops.len() {
        if t <= stops[i].position {
            let prev = &stops[i - 1];
            let next = &stops[i];
            
            let local_t = (t - prev.position) / (next.position - prev.position);
            
            return (
                prev.lab.0 + local_t * (next.lab.0 - prev.lab.0),
                prev.lab.1 + local_t * (next.lab.1 - prev.lab.1),
                prev.lab.2 + local_t * (next.lab.2 - prev.lab.2),
            );
        }
    }
    
    stops.last().unwrap().lab
}

/// Batch analyze multiple regions for gradients
pub fn analyze_regions_batch(
    regions: &HashMap<usize, Vec<(u32, u32)>>,
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    min_area: usize,
    max_stops: usize,
) -> VectorizeResult<HashMap<usize, Gradient>> {
    let mut gradients = HashMap::new();
    
    for (region_id, pixels) in regions {
        if pixels.len() >= min_area {
            if let Some(gradient) = analyze_region_gradient_pca(pixels, image, max_stops)? {
                if gradient.error_reduction > 0.2 {
                    gradients.insert(*region_id, gradient);
                }
            }
        }
    }
    
    Ok(gradients)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_gradient_stop_interpolation() {
        let stops = vec![
            GradientStop {
                position: 0.0,
                color: (0, 0, 0),
                lab: (0.0, 0.0, 0.0),
            },
            GradientStop {
                position: 1.0,
                color: (255, 255, 255),
                lab: (100.0, 0.0, 0.0),
            },
        ];
        
        let mid = interpolate_gradient_color(0.5, &stops);
        assert!((mid.0 - 50.0).abs() < 0.1);
    }
    
    #[test]
    fn test_linear_position() {
        let t = calculate_linear_position(
            5.0,
            5.0,
            (0.0, 0.0),
            (10.0, 10.0),
        );
        assert!((t - 0.5).abs() < 0.01);
    }
    
    #[test]
    fn test_radial_position() {
        let t = calculate_radial_position(
            5.0,
            0.0,
            (0.0, 0.0),
            10.0,
        );
        assert!((t - 0.5).abs() < 0.01);
    }
}