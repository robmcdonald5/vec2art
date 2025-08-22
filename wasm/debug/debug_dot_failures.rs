//! Debug utility to diagnose why dot mapping is failing on specific images

use image::ImageReader;
use vectorize_core::{vectorize_trace_low_rgba, TraceBackend, TraceLowConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    println!("=== DOT MAPPING FAILURE ANALYSIS ===\n");

    let test_images = [
        ("Gradient Image", "examples/images_in/test_gradient.png"),
        ("Checkerboard", "examples/images_in/test_checkerboard.png"),
        ("Pirate Flag", "examples/images_in/Pirate-Flag.png"),
        ("Test3 Large", "examples/images_in/test3.png"),
    ];

    for (name, path) in &test_images {
        println!("=== Testing: {name} ===");

        match ImageReader::open(path) {
            Ok(reader) => {
                match reader.decode() {
                    Ok(img) => {
                        let rgba_img = img.to_rgba8();
                        println!("  Image loaded: {}x{}", rgba_img.width(), rgba_img.height());

                        // Test single color detection
                        let first_pixel = *rgba_img.get_pixel(0, 0);
                        let mut unique_colors = std::collections::HashSet::new();

                        for pixel in rgba_img.pixels() {
                            if pixel.0[3] >= 10 {
                                // Only opaque pixels
                                unique_colors.insert((pixel.0[0], pixel.0[1], pixel.0[2]));
                                if unique_colors.len() > 5 {
                                    // Early exit if clearly not single color
                                    break;
                                }
                            }
                        }

                        println!("  First pixel: {first_pixel:?}");
                        println!("  Unique colors found: {}", unique_colors.len());

                        if unique_colors.len() <= 1 {
                            println!("  ⚠️  ISSUE: Image detected as single color!");
                        }

                        // Test with different density thresholds
                        let test_densities = [0.01, 0.1, 0.3, 0.5];

                        for &density in &test_densities {
                            let config = TraceLowConfig {
                                backend: TraceBackend::Dots,
                                dot_density_threshold: density,
                                dot_min_radius: 0.5,
                                dot_max_radius: 3.0,
                                dot_preserve_colors: false,
                                dot_adaptive_sizing: true,
                                dot_background_tolerance: 0.1,
                                ..TraceLowConfig::default()
                            };

                            match vectorize_trace_low_rgba(&rgba_img, &config, None) {
                                Ok(svg) => {
                                    let path_count = svg.matches("<circle").count();
                                    println!("  Density {density:.2}: {path_count} dots generated");

                                    if path_count > 0 {
                                        break; // Found working threshold
                                    }
                                }
                                Err(e) => {
                                    println!("  Density {density:.2}: ERROR - {e}");
                                }
                            }
                        }
                    }
                    Err(e) => println!("  ❌ Failed to decode image: {e}"),
                }
            }
            Err(e) => println!("  ❌ Failed to load image: {e}"),
        }

        println!();
    }

    Ok(())
}
