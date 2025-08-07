use vec2art::{convert_native, get_default_params_native};
use std::time::Instant;

fn main() {
    env_logger::init();
    
    println!("🚀 Vec2Art Performance Benchmark");
    println!("================================");
    
    // Create test images of different sizes
    let test_sizes = [(100, 100), (300, 300), (500, 500)];
    
    for &(width, height) in &test_sizes {
        println!("\n📏 Testing {}x{} image", width, height);
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        let image = create_test_image(width, height);
        let mut png_bytes = Vec::new();
        image.write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png).unwrap();
        
        // Test each algorithm
        benchmark_algorithm(&png_bytes, "edge_detector", width, height);
        benchmark_algorithm(&png_bytes, "path_tracer", width, height);
        
        // Geometric fitter - DISABLED due to high memory usage
        println!("  geometric_fitter SKIPPED (high memory usage)");
    }
    
    println!("\n🎯 Benchmark complete!");
    println!("\nNote: Geometric fitter is disabled due to high memory usage issues.");
}

fn create_test_image(width: u32, height: u32) -> image::DynamicImage {
    let image = image::ImageBuffer::from_fn(width, height, |x, y| {
        let x_ratio = x as f32 / width as f32;
        let y_ratio = y as f32 / height as f32;
        
        // Create some interesting patterns
        if ((x / 20) + (y / 20)) % 2 == 0 {
            // Checkerboard base
            let r = (x_ratio * 255.0) as u8;
            let g = (y_ratio * 255.0) as u8;
            let b = ((x_ratio + y_ratio) * 127.5) as u8;
            image::Rgb([r, g, b])
        } else {
            // Gradient areas
            let r = ((1.0 - x_ratio) * 255.0) as u8;
            let g = ((1.0 - y_ratio) * 255.0) as u8;
            let b = (((x_ratio + y_ratio) / 2.0) * 255.0) as u8;
            image::Rgb([r, g, b])
        }
    });
    
    image::DynamicImage::ImageRgb8(image)
}

fn benchmark_algorithm(image_bytes: &[u8], algorithm: &str, width: u32, height: u32) {
    let params_json = get_default_params_native(algorithm).unwrap();
    
    let start = Instant::now();
    let result = convert_native(image_bytes, &params_json);
    let duration = start.elapsed();
    
    match result {
        Ok(svg) => {
            let pixels = width * height;
            let mpixels = pixels as f32 / 1_000_000.0;
            let ms_per_mpixel = duration.as_millis() as f32 / mpixels;
            
            println!("  {:<15} {:>8.2}ms ({:>6.1}ms/MP) -> {:>8} chars", 
                     algorithm, 
                     duration.as_millis(), 
                     ms_per_mpixel,
                     svg.len());
        }
        Err(e) => {
            println!("  {:<15} FAILED: {:?}", algorithm, e);
        }
    }
}

fn benchmark_geometric_fitter(image_bytes: &[u8], width: u32, height: u32) {
    // Use minimal parameters for benchmarking
    let params_json = r#"{
        "algorithm": "geometric_fitter",
        "shape_types": ["Circle", "Rectangle"],
        "max_shapes": 20,
        "population_size": 20,
        "generations": 10,
        "mutation_rate": 0.1,
        "target_fitness": 0.7
    }"#;
    
    let start = Instant::now();
    let result = convert_native(image_bytes, params_json);
    let duration = start.elapsed();
    
    match result {
        Ok(svg) => {
            let pixels = width * height;
            let mpixels = pixels as f32 / 1_000_000.0;
            let ms_per_mpixel = duration.as_millis() as f32 / mpixels;
            
            println!("  {:<15} {:>8.2}ms ({:>6.1}ms/MP) -> {:>8} chars", 
                     "geometric_fitter", 
                     duration.as_millis(), 
                     ms_per_mpixel,
                     svg.len());
        }
        Err(e) => {
            println!("  {:<15} FAILED: {:?}", "geometric_fitter", e);
        }
    }
}