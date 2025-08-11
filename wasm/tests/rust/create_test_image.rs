//! Test image generator for dot mapping validation
//!
//! This utility creates synthetic test images with known properties for validating
//! dot mapping algorithms. Images include controlled patterns, gradients, and edge cases.

use image::{Rgba, RgbaImage, ImageFormat};
use std::path::Path;
use anyhow::Result;

/// Generate a comprehensive set of test images for dot mapping validation
pub fn create_test_images() -> Result<()> {
    println!("🖼️ Creating test images for dot mapping validation...");
    
    // Create synthetic test images with known properties
    create_gradient_test_image()?;
    create_checkerboard_test_image()?;
    create_geometric_shapes_image()?;
    create_portrait_silhouette_image()?;
    create_texture_test_image()?;
    create_benchmark_images()?;
    
    println!("✅ Test images created successfully");
    Ok(())
}

/// Create gradient test image - tests adaptive sizing and color preservation
fn create_gradient_test_image() -> Result<()> {
    let width = 400u32;
    let height = 300u32;
    let mut image = RgbaImage::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Horizontal gradient from blue to red
            let r = (x as f32 / width as f32 * 255.0) as u8;
            let g = 128u8; // Constant green
            let b = ((1.0 - x as f32 / width as f32) * 255.0) as u8;
            
            // Add vertical intensity variation  
            let intensity = (y as f32 / height as f32).sin().abs();
            let final_r = (r as f32 * intensity) as u8;
            let final_g = (g as f32 * intensity) as u8;
            let final_b = (b as f32 * intensity) as u8;
            
            image.put_pixel(x, y, Rgba([final_r, final_g, final_b, 255]));
        }
    }
    
    image.save("examples/images_in/test_gradient_synthetic.png")?;
    println!("📁 Created: test_gradient_synthetic.png (gradient test)");
    Ok(())
}

/// Create high-contrast checkerboard - tests edge detection and background handling
fn create_checkerboard_test_image() -> Result<()> {
    let width = 320u32;
    let height = 320u32;
    let square_size = 40u32;
    let mut image = RgbaImage::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            let checker_x = x / square_size;
            let checker_y = y / square_size;
            let is_black = (checker_x + checker_y) % 2 == 0;
            
            let color = if is_black {
                Rgba([0, 0, 0, 255])
            } else {
                Rgba([255, 255, 255, 255])
            };
            
            image.put_pixel(x, y, color);
        }
    }
    
    image.save("examples/images_in/test_checkerboard_synthetic.png")?;
    println!("📁 Created: test_checkerboard_synthetic.png (high contrast test)");
    Ok(())
}

/// Create geometric shapes - tests precision and technical drawing capability
fn create_geometric_shapes_image() -> Result<()> {
    let width = 500u32;
    let height = 400u32;
    let mut image = RgbaImage::new(width, height);
    
    // White background
    for y in 0..height {
        for x in 0..width {
            image.put_pixel(x, y, Rgba([255, 255, 255, 255]));
        }
    }
    
    // Draw circle
    let center_x = 125f32;
    let center_y = 150f32;
    let radius = 50f32;
    
    for y in 0..height {
        for x in 0..width {
            let dx = x as f32 - center_x;
            let dy = y as f32 - center_y;
            let distance = (dx * dx + dy * dy).sqrt();
            
            if (distance - radius).abs() < 2.0 {
                image.put_pixel(x, y, Rgba([255, 0, 0, 255])); // Red circle
            }
        }
    }
    
    // Draw rectangle
    let rect_x1 = 250u32;
    let rect_y1 = 100u32;
    let rect_x2 = 350u32;
    let rect_y2 = 200u32;
    
    for y in rect_y1..rect_y2 {
        for x in rect_x1..rect_x2 {
            if x <= rect_x1 + 2 || x >= rect_x2 - 2 || y <= rect_y1 + 2 || y >= rect_y2 - 2 {
                image.put_pixel(x, y, Rgba([0, 255, 0, 255])); // Green rectangle
            }
        }
    }
    
    // Draw triangle  
    let tri_points = [(400f32, 300f32), (450f32, 150f32), (500f32, 300f32)];
    
    for y in 150..300 {
        for x in 400..500 {
            // Simple triangle edge detection
            let point_x = x as f32;
            let point_y = y as f32;
            
            // Check if point is near triangle edges (simplified)
            let d1 = point_distance_to_line(point_x, point_y, tri_points[0], tri_points[1]);
            let d2 = point_distance_to_line(point_x, point_y, tri_points[1], tri_points[2]);
            let d3 = point_distance_to_line(point_x, point_y, tri_points[2], tri_points[0]);
            
            if d1 < 3.0 || d2 < 3.0 || d3 < 3.0 {
                image.put_pixel(x, y, Rgba([0, 0, 255, 255])); // Blue triangle
            }
        }
    }
    
    image.save("examples/images_in/test_shapes_synthetic.png")?;
    println!("📁 Created: test_shapes_synthetic.png (geometric precision test)");
    Ok(())
}

/// Create portrait silhouette - tests portrait handling and artistic effects
fn create_portrait_silhouette_image() -> Result<()> {
    let width = 300u32;
    let height = 400u32;
    let mut image = RgbaImage::new(width, height);
    
    // Light background
    for y in 0..height {
        for x in 0..width {
            image.put_pixel(x, y, Rgba([240, 240, 245, 255]));
        }
    }
    
    // Create simple head silhouette
    let center_x = 150f32;
    let head_top = 80f32;
    let head_bottom = 320f32;
    
    for y in 0..height {
        for x in 0..width {
            let rel_y = y as f32 - head_top;
            let progress = rel_y / (head_bottom - head_top);
            
            if progress >= 0.0 && progress <= 1.0 {
                // Head width varies with height (oval shape)
                let head_width = 60.0 * (1.0 - (progress - 0.5).abs() * 1.2).max(0.3);
                let dx = (x as f32 - center_x).abs();
                
                if dx < head_width {
                    // Create some variation in the silhouette
                    let noise = ((x as f32 * 0.1).sin() + (y as f32 * 0.08).cos()) * 5.0;
                    if dx + noise < head_width {
                        // Gradient fill from dark to medium
                        let fill_intensity = 50 + (progress * 100.0) as u8;
                        image.put_pixel(x, y, Rgba([fill_intensity, fill_intensity, fill_intensity + 20, 255]));
                    }
                }
            }
        }
    }
    
    image.save("examples/images_in/test_portrait_synthetic.png")?;
    println!("📁 Created: test_portrait_synthetic.png (portrait silhouette test)");
    Ok(())
}

/// Create texture test image - tests complex patterns and noise handling
fn create_texture_test_image() -> Result<()> {
    let width = 350u32;
    let height = 250u32;
    let mut image = RgbaImage::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Create complex texture with multiple frequency components
            let fx = x as f32 * 0.02;
            let fy = y as f32 * 0.02;
            
            let pattern1 = (fx * 3.0).sin() * (fy * 2.0).cos();
            let pattern2 = (fx * 7.0 + fy * 5.0).sin() * 0.5;
            let pattern3 = ((fx - fy) * 10.0).cos() * 0.3;
            
            let combined = (pattern1 + pattern2 + pattern3) * 0.5 + 0.5;
            let intensity = (combined * 200.0 + 55.0) as u8;
            
            // Add some color variation
            let r = intensity;
            let g = ((intensity as f32) * 0.8) as u8;
            let b = ((intensity as f32) * 1.2).min(255.0) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    image.save("examples/images_in/test_texture_synthetic.png")?;
    println!("📁 Created: test_texture_synthetic.png (texture complexity test)");
    Ok(())
}

/// Create benchmark images with known sizes for performance testing
fn create_benchmark_images() -> Result<()> {
    // Small benchmark image (300x300)
    create_benchmark_image(300, 300, "test_benchmark_small.png")?;
    
    // Medium benchmark image (500x500)  
    create_benchmark_image(500, 500, "test_benchmark_medium.png")?;
    
    // Large benchmark image (800x600)
    create_benchmark_image(800, 600, "test_benchmark_large.png")?;
    
    // Extra large benchmark image (1200x900)
    create_benchmark_image(1200, 900, "test_benchmark_xlarge.png")?;
    
    Ok(())
}

/// Create a single benchmark image with specified dimensions
fn create_benchmark_image(width: u32, height: u32, filename: &str) -> Result<()> {
    let mut image = RgbaImage::new(width, height);
    
    for y in 0..height {
        for x in 0..width {
            // Create interesting but predictable pattern
            let fx = x as f32 / width as f32;
            let fy = y as f32 / height as f32;
            
            let pattern = (fx * 8.0).sin() * (fy * 6.0).cos() + 
                         (fx * 15.0 + fy * 10.0).sin() * 0.4;
            let intensity = ((pattern + 1.0) * 0.5 * 180.0 + 75.0) as u8;
            
            let r = intensity;
            let g = (intensity as f32 * 0.9) as u8;
            let b = (intensity as f32 * 1.1).min(255.0) as u8;
            
            image.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    let path = format!("examples/images_in/{}", filename);
    image.save(&path)?;
    println!("📁 Created: {} ({}x{} benchmark)", filename, width, height);
    Ok(())
}

/// Helper function to calculate distance from point to line segment
fn point_distance_to_line(px: f32, py: f32, p1: (f32, f32), p2: (f32, f32)) -> f32 {
    let (x1, y1) = p1;
    let (x2, y2) = p2;
    
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;
    
    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    
    if len_sq < f32::EPSILON {
        // Line segment is actually a point
        return ((px - x1).powi(2) + (py - y1).powi(2)).sqrt();
    }
    
    let param = dot / len_sq;
    
    let (xx, yy) = if param < 0.0 {
        (x1, y1)
    } else if param > 1.0 {
        (x2, y2)
    } else {
        (x1 + param * C, y1 + param * D)
    };
    
    let dx = px - xx;
    let dy = py - yy;
    (dx * dx + dy * dy).sqrt()
}

/// Main function to create all test images
fn main() -> Result<()> {
    // Create directories if they don't exist
    std::fs::create_dir_all("examples/images_in")?;
    
    create_test_images()?;
    
    println!("\n🎯 Test image generation complete!");
    println!("Generated synthetic test images for comprehensive dot mapping validation:");
    println!("  - Gradient tests (color preservation, adaptive sizing)");
    println!("  - High contrast tests (edge detection robustness)");  
    println!("  - Geometric precision tests (technical drawing accuracy)");
    println!("  - Portrait tests (artistic style effectiveness)");
    println!("  - Texture tests (complex pattern handling)");
    println!("  - Performance benchmarks (scalability validation)");
    println!("\nUse these images with the dot mapping test suite for thorough validation.");
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_point_distance_to_line() {
        // Test distance from point to horizontal line
        let distance = point_distance_to_line(5.0, 3.0, (0.0, 0.0), (10.0, 0.0));
        assert!((distance - 3.0).abs() < f32::EPSILON);
        
        // Test distance from point to vertical line  
        let distance = point_distance_to_line(3.0, 5.0, (0.0, 0.0), (0.0, 10.0));
        assert!((distance - 3.0).abs() < f32::EPSILON);
    }
}