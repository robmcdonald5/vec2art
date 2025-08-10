use image::{ImageBuffer, Rgba};
use vectorize_core::{vectorize_trace_low_rgba, TraceLowConfig};

fn main() {
    // Create a simple test image
    let img = ImageBuffer::from_fn(128, 128, |x, y| {
        if (x + y) % 16 < 8 {
            Rgba([255, 255, 255, 255]) // White
        } else {
            Rgba([0, 0, 0, 255]) // Black
        }
    });

    // Save test image
    img.save("test_input.png").expect("Failed to save test image");
    println!("Created test_input.png");

    // Test vectorization
    let config = TraceLowConfig::default();
    match vectorize_trace_low_rgba(&img, &config) {
        Ok(svg) => {
            std::fs::write("test_output.svg", svg).expect("Failed to save SVG");
            println!("Created test_output.svg");
            println!("Success! Line tracing pipeline works end-to-end.");
        }
        Err(e) => {
            eprintln!("Error during vectorization: {}", e);
        }
    }
}