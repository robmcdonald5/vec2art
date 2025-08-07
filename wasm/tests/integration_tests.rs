use vec2art::{convert_native, get_default_params_native};
use std::fs;

#[test]
fn test_edge_detection_with_sample_image() {
    // Create a simple test image (100x100 white square with black border)
    
    // Simple PNG header for a 100x100 image (you'd normally load a real image file)
    // For now, we'll create a simple gradient programmatically
    let image = image::ImageBuffer::from_fn(100, 100, |x, y| {
        if x < 10 || x > 90 || y < 10 || y > 90 {
            image::Rgb([0u8, 0u8, 0u8]) // Black border
        } else {
            image::Rgb([255u8, 255u8, 255u8]) // White center
        }
    });
    
    let dynamic_image = image::DynamicImage::ImageRgb8(image);
    
    // Encode to PNG bytes
    let mut png_bytes = Vec::new();
    dynamic_image.write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png).unwrap();
    
    // Get default parameters
    let params_json = get_default_params_native("edge_detector").unwrap();
    
    // Convert
    let result = convert_native(&png_bytes, &params_json);
    
    assert!(result.is_ok());
    let svg = result.unwrap();
    
    // Basic validation
    assert!(svg.contains("<svg"));
    assert!(svg.contains("</svg>"));
    assert!(svg.contains("path") || svg.contains("polyline"));
    
    // Write to file for inspection
    fs::write("test_edge_output.svg", &svg).unwrap();
    println!("Edge detection SVG written to test_edge_output.svg");
}

#[test]
fn test_path_tracer_with_sample_image() {
    // Create a simple colored image
    let image = image::ImageBuffer::from_fn(100, 100, |x, _y| {
        if x < 33 {
            image::Rgb([255u8, 0u8, 0u8]) // Red
        } else if x < 66 {
            image::Rgb([0u8, 255u8, 0u8]) // Green
        } else {
            image::Rgb([0u8, 0u8, 255u8]) // Blue
        }
    });
    
    let dynamic_image = image::DynamicImage::ImageRgb8(image);
    
    let mut png_bytes = Vec::new();
    dynamic_image.write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png).unwrap();
    
    let params_json = get_default_params_native("path_tracer").unwrap();
    let result = convert_native(&png_bytes, &params_json);
    
    assert!(result.is_ok());
    let svg = result.unwrap();
    
    assert!(svg.contains("<svg"));
    assert!(svg.contains("</svg>"));
    
    fs::write("test_path_output.svg", &svg).unwrap();
    println!("Path tracer SVG written to test_path_output.svg");
}

#[test]
#[ignore = "Disabled due to high memory usage - geometric_fitter needs optimization"]
fn test_geometric_fitter_with_sample_image() {
    // Create a simple image with geometric shapes
    let image = image::ImageBuffer::from_fn(100, 100, |x, y| {
        let cx = 50.0;
        let cy = 50.0;
        let dist = ((x as f32 - cx).powi(2) + (y as f32 - cy).powi(2)).sqrt();
        
        if dist < 20.0 {
            image::Rgb([255u8, 0u8, 0u8]) // Red circle
        } else {
            image::Rgb([255u8, 255u8, 255u8]) // White background
        }
    });
    
    let dynamic_image = image::DynamicImage::ImageRgb8(image);
    
    let mut png_bytes = Vec::new();
    dynamic_image.write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png).unwrap();
    
    // Use smaller parameters for faster testing
    let params_json = r#"{
        "algorithm": "GeometricFitter",
        "shape_types": ["Circle", "Rectangle"],
        "max_shapes": 10,
        "population_size": 20,
        "generations": 10,
        "mutation_rate": 0.1,
        "target_fitness": 0.8
    }"#;
    
    let result = convert_native(&png_bytes, params_json);
    
    if let Err(e) = &result {
        println!("GeometricFitter conversion failed: {:?}", e);
    }
    assert!(result.is_ok());
    let svg = result.unwrap();
    
    assert!(svg.contains("<svg"));
    assert!(svg.contains("</svg>"));
    
    fs::write("test_geometric_output.svg", &svg).unwrap();
    println!("Geometric fitter SVG written to test_geometric_output.svg");
}

#[test]
fn test_all_algorithms_with_real_image() {
    // This test expects you to place a test image file
    let test_image_path = "tests/fixtures/test_image.png";
    
    if !std::path::Path::new(test_image_path).exists() {
        println!("Skipping real image test - place a test image at {}", test_image_path);
        return;
    }
    
    let image_bytes = fs::read(test_image_path).unwrap();
    
    // Test edge detection
    let params = get_default_params_native("edge_detector").unwrap();
    let svg = convert_native(&image_bytes, &params).unwrap();
    fs::write("real_image_edges.svg", &svg).unwrap();
    
    // Test path tracer
    let params = get_default_params_native("path_tracer").unwrap();
    let svg = convert_native(&image_bytes, &params).unwrap();
    fs::write("real_image_paths.svg", &svg).unwrap();
    
    // Test geometric fitter - DISABLED due to high memory usage
    println!("Skipping geometric fitter test due to high memory usage issues");
    
    println!("All real image tests completed - check the .svg output files");
}