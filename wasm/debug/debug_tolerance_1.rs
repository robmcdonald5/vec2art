//! Test if tolerance 1.0 actually disables background detection

use image::ImageReader;
use vectorize_core::algorithms::background::{detect_background_advanced, BackgroundConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== BACKGROUND TOLERANCE 1.0 TEST ===\n");

    let img = ImageReader::open("examples/images_in/test_checkerboard.png")?.decode()?;
    let rgba_img = img.to_rgba8();

    let background_config = BackgroundConfig {
        tolerance: 1.0,
        ..BackgroundConfig::default()
    };

    let background_mask = detect_background_advanced(&rgba_img, &background_config);

    let total_pixels = (rgba_img.width() * rgba_img.height()) as usize;
    let background_pixels = background_mask.iter().filter(|&&is_bg| is_bg).count();
    let foreground_pixels = total_pixels - background_pixels;

    println!("With tolerance 1.0:");
    println!("  Background pixels: {background_pixels}");
    println!("  Foreground pixels: {foreground_pixels}");
    println!("  Should be all foreground if working correctly");

    Ok(())
}
