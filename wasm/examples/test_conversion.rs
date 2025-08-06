use vec2art::{convert_native, get_default_params_native};
use std::{env, fs};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        println!("Usage: {} <image_path> [algorithm] [output_path]", args[0]);
        println!("Algorithms: edge_detector, path_tracer, geometric_fitter");
        println!("Example: {} test.jpg edge_detector output.svg", args[0]);
        return Ok(());
    }
    
    let image_path = &args[1];
    let algorithm = args.get(2).map(|s| s.as_str()).unwrap_or("edge_detector");
    let output_path = args.get(3).map(|s| s.as_str()).unwrap_or("output.svg");
    
    println!("Loading image: {}", image_path);
    let image_bytes = fs::read(image_path)?;
    
    // Basic image size validation
    println!("Validating image...");
    if image_bytes.is_empty() {
        println!("Error: Image file is empty");
        return Ok(());
    }
    println!("Image loaded successfully ({} bytes)", image_bytes.len());
    
    // Get default parameters for the algorithm
    println!("Getting default parameters for: {}", algorithm);
    let params_json = match get_default_params_native(algorithm) {
        Ok(params) => params,
        Err(e) => {
            println!("Failed to get parameters: {:?}", e);
            return Ok(());
        }
    };
    
    println!("Parameters: {}", params_json);
    
    // Convert
    println!("Converting with {} algorithm...", algorithm);
    let start_time = std::time::Instant::now();
    
    match convert_native(&image_bytes, &params_json) {
        Ok(svg) => {
            let duration = start_time.elapsed();
            println!("Conversion completed in {:?}", duration);
            println!("SVG size: {} characters", svg.len());
            
            // Write output
            fs::write(output_path, &svg)?;
            println!("SVG written to: {}", output_path);
            
            // Show preview of SVG content
            let preview = if svg.len() > 200 {
                format!("{}...", &svg[..200])
            } else {
                svg.clone()
            };
            println!("SVG preview:\n{}", preview);
        }
        Err(e) => {
            println!("Conversion failed: {:?}", e);
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_sample_images() {
        // Create some sample test images
        
        // 1. Simple geometric shapes
        create_test_image_with_shapes();
        
        // 2. Gradient image
        create_test_gradient_image();
        
        // 3. High contrast image
        create_test_high_contrast_image();
        
        println!("Sample test images created in examples/ directory");
    }
    
    fn create_test_image_with_shapes() {
        std::fs::create_dir_all("examples/images_in").unwrap();
        
        let image = image::ImageBuffer::from_fn(200, 200, |x, y| {
            let x = x as f32;
            let y = y as f32;
            
            // Red circle
            let circle_dist = ((x - 60.0).powi(2) + (y - 60.0).powi(2)).sqrt();
            if circle_dist < 30.0 {
                return image::Rgb([255u8, 50u8, 50u8]);
            }
            
            // Blue rectangle
            if x > 110.0 && x < 180.0 && y > 40.0 && y < 100.0 {
                return image::Rgb([50u8, 50u8, 255u8]);
            }
            
            // Green triangle (approximate)
            if x > 40.0 && x < 120.0 && y > 130.0 && y < 180.0 {
                let triangle_y = 130.0 + (x - 40.0) * 0.625; // Approximate triangle edge
                if y > triangle_y {
                    return image::Rgb([50u8, 255u8, 50u8]);
                }
            }
            
            // White background
            image::Rgb([255u8, 255u8, 255u8])
        });
        
        image.save("examples/images_in/test_shapes.png").unwrap();
    }
    
    fn create_test_gradient_image() {
        std::fs::create_dir_all("examples/images_in").unwrap();
        
        let image = image::ImageBuffer::from_fn(200, 200, |x, y| {
            let r = (x as f32 / 200.0 * 255.0) as u8;
            let g = (y as f32 / 200.0 * 255.0) as u8;
            let b = ((x + y) as f32 / 400.0 * 255.0) as u8;
            
            image::Rgb([r, g, b])
        });
        
        image.save("examples/images_in/test_gradient.png").unwrap();
    }
    
    fn create_test_high_contrast_image() {
        std::fs::create_dir_all("examples/images_in").unwrap();
        
        let image = image::ImageBuffer::from_fn(200, 200, |x, y| {
            // Checkerboard pattern
            let checker_size = 20;
            let checker_x = (x / checker_size) % 2;
            let checker_y = (y / checker_size) % 2;
            
            if (checker_x + checker_y) % 2 == 0 {
                image::Rgb([0u8, 0u8, 0u8]) // Black
            } else {
                image::Rgb([255u8, 255u8, 255u8]) // White
            }
        });
        
        image.save("examples/images_in/test_checkerboard.png").unwrap();
    }
}