//! Debug checkerboard background detection

use image::ImageReader;
use vectorize_core::algorithms::dots::background::{detect_background_advanced, BackgroundConfig};
use vectorize_core::algorithms::dots::dots::{generate_dots, DotConfig};
use vectorize_core::algorithms::edges::gradients::analyze_image_gradients;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== CHECKERBOARD BACKGROUND DETECTION ===\n");

    let img = ImageReader::open("examples/images_in/test_checkerboard.png")?.decode()?;
    let rgba_img = img.to_rgba8();
    let gray = image::imageops::grayscale(&rgba_img);

    println!("Image size: {}x{}", rgba_img.width(), rgba_img.height());

    // Background detection
    let background_config = BackgroundConfig::default();
    let background_mask = detect_background_advanced(&rgba_img, &background_config);

    let total_pixels = (rgba_img.width() * rgba_img.height()) as usize;
    let background_pixels = background_mask.iter().filter(|&&is_bg| is_bg).count();
    let foreground_pixels = total_pixels - background_pixels;

    println!("Background detection:");
    println!("  Total pixels: {total_pixels}");
    println!("  Background pixels: {background_pixels}");
    println!("  Foreground pixels: {foreground_pixels}");
    println!(
        "  Foreground ratio: {:.2}%",
        (foreground_pixels as f32 / total_pixels as f32) * 100.0
    );

    // Sample the background mask
    println!("\nSample background mask:");
    for y in (0..rgba_img.height()).step_by(20) {
        for x in (0..rgba_img.width()).step_by(20) {
            let index = (y * rgba_img.width() + x) as usize;
            let is_bg = background_mask[index];
            let pixel = rgba_img.get_pixel(x, y);
            println!("  ({x}, {y}): pixel={pixel:?}, is_background={is_bg}");
        }
    }

    if foreground_pixels > 0 {
        // Try generating dots
        let gradient_analysis = analyze_image_gradients(&gray);
        let dot_config = DotConfig {
            density_threshold: 0.1, // Normal threshold
            ..DotConfig::default()
        };

        let dots = generate_dots(&rgba_img, &gradient_analysis, &background_mask, &dot_config);
        println!("\nDot generation with threshold 0.1: {} dots", dots.len());

        // Try with very low threshold
        let dot_config_low = DotConfig {
            density_threshold: 0.01,
            ..DotConfig::default()
        };

        let dots_low = generate_dots(
            &rgba_img,
            &gradient_analysis,
            &background_mask,
            &dot_config_low,
        );
        println!(
            "Dot generation with threshold 0.01: {} dots",
            dots_low.len()
        );
    }

    Ok(())
}
