//! Debug checkerboard gradient analysis

use image::ImageReader;
use vectorize_core::algorithms::gradients::analyze_image_gradients;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== CHECKERBOARD GRADIENT ANALYSIS ===\n");
    
    let img = ImageReader::open("examples/images_in/test_checkerboard.png")?.decode()?;
    let rgba_img = img.to_rgba8();
    let gray = image::imageops::grayscale(&rgba_img);
    
    println!("Image size: {}x{}", rgba_img.width(), rgba_img.height());
    
    // Analyze gradients
    let gradient_analysis = analyze_image_gradients(&gray);
    
    // Sample gradient magnitudes
    println!("Gradient analysis:");
    println!("  Total pixels: {}", gradient_analysis.magnitude.len());
    
    let mut non_zero_gradients = 0;
    let mut max_gradient = 0.0f32;
    let mut gradient_sum = 0.0f32;
    
    for &mag in &gradient_analysis.magnitude {
        if mag > 0.0 {
            non_zero_gradients += 1;
            max_gradient = max_gradient.max(mag);
            gradient_sum += mag;
        }
    }
    
    println!("  Non-zero gradients: {}", non_zero_gradients);
    println!("  Max gradient: {:.6}", max_gradient);
    println!("  Average gradient: {:.6}", gradient_sum / gradient_analysis.magnitude.len() as f32);
    
    // Sample specific pixels
    println!("\nSample gradient values:");
    let width = rgba_img.width();
    for y in (0..rgba_img.height()).step_by(20) {
        for x in (0..rgba_img.width()).step_by(20) {
            let index = (y * width + x) as usize;
            if index < gradient_analysis.magnitude.len() {
                let grad = gradient_analysis.magnitude[index];
                let pixel = rgba_img.get_pixel(x, y);
                println!("  ({}, {}): pixel={:?}, gradient={:.6}", x, y, pixel, grad);
            }
        }
    }
    
    Ok(())
}