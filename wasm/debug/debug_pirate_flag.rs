//! Specific debug for Pirate Flag transparency issue

use image::ImageReader;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== PIRATE FLAG ANALYSIS ===\n");

    let img = ImageReader::open("examples/images_in/Pirate-Flag.png")?.decode()?;
    let rgba_img = img.to_rgba8();

    println!("Image size: {}x{}", rgba_img.width(), rgba_img.height());

    let mut transparent_count = 0;
    let mut opaque_count = 0;
    let mut color_counts = std::collections::HashMap::new();

    for pixel in rgba_img.pixels() {
        if pixel.0[3] < 10 {
            transparent_count += 1;
        } else {
            opaque_count += 1;
            let color = (pixel.0[0], pixel.0[1], pixel.0[2]);
            *color_counts.entry(color).or_insert(0) += 1;
        }
    }

    println!("Transparent pixels: {}", transparent_count);
    println!("Opaque pixels: {}", opaque_count);
    println!("Unique colors: {}", color_counts.len());

    for (color, count) in color_counts.iter().take(10) {
        println!("  Color {:?}: {} pixels", color, count);
    }

    // Sample some pixels to see distribution
    println!("\nSample pixels:");
    for y in (0..rgba_img.height()).step_by(rgba_img.height() as usize / 10) {
        for x in (0..rgba_img.width()).step_by(rgba_img.width() as usize / 10) {
            let pixel = rgba_img.get_pixel(x, y);
            println!("  ({}, {}): {:?}", x, y, pixel);
        }
    }

    Ok(())
}
