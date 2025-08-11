//! Deep dive into checkerboard background detection

use image::ImageReader;
use vectorize_core::algorithms::background::{detect_background_advanced, BackgroundConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== DETAILED CHECKERBOARD BACKGROUND ANALYSIS ===\n");

    let img = ImageReader::open("examples/images_in/test_checkerboard.png")?.decode()?;
    let rgba_img = img.to_rgba8();

    println!("Image size: {}x{}", rgba_img.width(), rgba_img.height());

    // Test different background tolerances
    let tolerances = [0.1, 0.3, 0.5, 0.8, 0.9];

    for &tolerance in &tolerances {
        let background_config = BackgroundConfig {
            tolerance,
            sample_edge_pixels: true,
            cluster_colors: true,
            num_clusters: 8,
            random_seed: 42,
            edge_sample_ratio: 0.1,
        };

        let background_mask = detect_background_advanced(&rgba_img, &background_config);

        let total_pixels = (rgba_img.width() * rgba_img.height()) as usize;
        let background_pixels = background_mask.iter().filter(|&&is_bg| is_bg).count();
        let foreground_pixels = total_pixels - background_pixels;

        println!(
            "Tolerance {:.1}: {} background, {} foreground ({:.1}% fg)",
            tolerance,
            background_pixels,
            foreground_pixels,
            (foreground_pixels as f32 / total_pixels as f32) * 100.0
        );
    }

    // Try with different clustering settings
    println!("\nDifferent clustering configurations:");

    let cluster_configs = [(2, "2 clusters"), (4, "4 clusters"), (8, "8 clusters")];

    for (num_clusters, description) in cluster_configs {
        let background_config = BackgroundConfig {
            tolerance: 0.5,
            cluster_colors: true,
            num_clusters,
            ..BackgroundConfig::default()
        };

        let background_mask = detect_background_advanced(&rgba_img, &background_config);

        let total_pixels = (rgba_img.width() * rgba_img.height()) as usize;
        let background_pixels = background_mask.iter().filter(|&&is_bg| is_bg).count();
        let foreground_pixels = total_pixels - background_pixels;

        println!(
            "{}: {} background, {} foreground ({:.1}% fg)",
            description,
            background_pixels,
            foreground_pixels,
            (foreground_pixels as f32 / total_pixels as f32) * 100.0
        );
    }

    // Try disabling clustering entirely
    println!("\nWithout color clustering:");
    let no_cluster_config = BackgroundConfig {
        tolerance: 0.5,
        cluster_colors: false,
        ..BackgroundConfig::default()
    };

    let background_mask = detect_background_advanced(&rgba_img, &no_cluster_config);

    let total_pixels = (rgba_img.width() * rgba_img.height()) as usize;
    let background_pixels = background_mask.iter().filter(|&&is_bg| is_bg).count();
    let foreground_pixels = total_pixels - background_pixels;

    println!(
        "No clustering: {} background, {} foreground ({:.1}% fg)",
        background_pixels,
        foreground_pixels,
        (foreground_pixels as f32 / total_pixels as f32) * 100.0
    );

    Ok(())
}
