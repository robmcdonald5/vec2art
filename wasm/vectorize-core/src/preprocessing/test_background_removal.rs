//! Manual test for background removal functionality
//!
//! This module provides a simple test to verify that background removal
//! algorithms are working correctly and producing expected visual changes.

use crate::algorithms::tracing::trace_low::BackgroundRemovalAlgorithm;
use crate::error::VectorizeResult;
use crate::preprocessing::background_removal::{
    apply_background_removal, BackgroundRemovalConfig, BackgroundRemovalResult,
};
use image::{ImageBuffer, Rgba, RgbaImage};

/// Create a test image with a clear foreground object on a white background
pub fn create_test_image() -> RgbaImage {
    let width = 100;
    let height = 100;
    let mut image = ImageBuffer::new(width, height);

    // Fill with white background
    for pixel in image.pixels_mut() {
        *pixel = Rgba([255, 255, 255, 255]); // White background
    }

    // Draw a black circle in the center (foreground object)
    let center_x = width / 2;
    let center_y = height / 2;
    let radius = 25;

    for y in 0..height {
        for x in 0..width {
            let dx = (x as i32) - (center_x as i32);
            let dy = (y as i32) - (center_y as i32);
            let distance_squared = (dx * dx + dy * dy) as f32;

            if distance_squared <= (radius * radius) as f32 {
                image.put_pixel(x, y, Rgba([0, 0, 0, 255])); // Black foreground
            }
        }
    }

    // Add some noise around the circle
    for y in (center_y - radius - 5)..(center_y + radius + 5) {
        for x in (center_x - radius - 5)..(center_x + radius + 5) {
            if y < height && x < width {
                let dx = (x as i32) - (center_x as i32);
                let dy = (y as i32) - (center_y as i32);
                let distance_squared = (dx * dx + dy * dy) as f32;

                // Add gray noise around the circle
                if distance_squared > (radius * radius) as f32
                    && distance_squared < ((radius + 5) * (radius + 5)) as f32
                    && (x + y) % 3 == 0
                {
                    // Sparse noise pattern
                    image.put_pixel(x, y, Rgba([128, 128, 128, 255])); // Gray noise
                }
            }
        }
    }

    image
}

/// Test OTSU background removal algorithm
pub fn test_otsu_background_removal() -> VectorizeResult<BackgroundRemovalResult> {
    println!("🧪 Testing OTSU background removal...");

    let test_image = create_test_image();
    let config = BackgroundRemovalConfig {
        algorithm: BackgroundRemovalAlgorithm::Otsu,
        strength: 0.5,
        threshold_override: None,
    };

    let result = apply_background_removal(&test_image, &config)?;

    println!(
        "✅ OTSU result: algorithm {:?}, threshold {}, took {}ms",
        result.algorithm_used, result.threshold_used, result.processing_time_ms
    );

    Ok(result)
}

/// Test Adaptive background removal algorithm
pub fn test_adaptive_background_removal() -> VectorizeResult<BackgroundRemovalResult> {
    println!("🧪 Testing Adaptive background removal...");

    let test_image = create_test_image();
    let config = BackgroundRemovalConfig {
        algorithm: BackgroundRemovalAlgorithm::Adaptive,
        strength: 0.5,
        threshold_override: None,
    };

    let result = apply_background_removal(&test_image, &config)?;

    println!(
        "✅ Adaptive result: algorithm {:?}, threshold {}, took {}ms",
        result.algorithm_used, result.threshold_used, result.processing_time_ms
    );

    Ok(result)
}

/// Test Auto algorithm selection
pub fn test_auto_background_removal() -> VectorizeResult<BackgroundRemovalResult> {
    println!("🧪 Testing Auto background removal...");

    let test_image = create_test_image();
    let config = BackgroundRemovalConfig {
        algorithm: BackgroundRemovalAlgorithm::Auto,
        strength: 0.5,
        threshold_override: None,
    };

    let result = apply_background_removal(&test_image, &config)?;

    println!(
        "✅ Auto result: selected {:?}, threshold {}, took {}ms",
        result.algorithm_used, result.threshold_used, result.processing_time_ms
    );

    Ok(result)
}

/// Analyze the differences between original and processed images
pub fn analyze_background_removal_effect(
    original: &RgbaImage,
    processed: &RgbaImage,
) -> (u32, u32, f32) {
    let mut transparent_pixels = 0;
    let mut changed_pixels = 0;
    let total_pixels = original.width() * original.height();

    for (orig_pixel, proc_pixel) in original.pixels().zip(processed.pixels()) {
        // Count pixels that became transparent
        if proc_pixel.0[3] == 0 {
            transparent_pixels += 1;
        }

        // Count pixels that changed
        if orig_pixel.0 != proc_pixel.0 {
            changed_pixels += 1;
        }
    }

    let transparency_percentage = (transparent_pixels as f32 / total_pixels as f32) * 100.0;

    (transparent_pixels, changed_pixels, transparency_percentage)
}

/// Run comprehensive background removal test
pub fn run_comprehensive_test() -> VectorizeResult<()> {
    println!("🚀 Starting comprehensive background removal test...");

    let original_image = create_test_image();
    println!(
        "📷 Created test image: {}x{} pixels",
        original_image.width(),
        original_image.height()
    );

    // Test OTSU
    let otsu_result = test_otsu_background_removal()?;
    let (otsu_transparent, otsu_changed, otsu_percent) =
        analyze_background_removal_effect(&original_image, &otsu_result.image);
    println!(
        "📊 OTSU: {} transparent pixels ({:.1}%), {} changed pixels",
        otsu_transparent, otsu_percent, otsu_changed
    );

    // Test Adaptive
    let adaptive_result = test_adaptive_background_removal()?;
    let (adaptive_transparent, adaptive_changed, adaptive_percent) =
        analyze_background_removal_effect(&original_image, &adaptive_result.image);
    println!(
        "📊 Adaptive: {} transparent pixels ({:.1}%), {} changed pixels",
        adaptive_transparent, adaptive_percent, adaptive_changed
    );

    // Test Auto
    let auto_result = test_auto_background_removal()?;
    let (auto_transparent, auto_changed, auto_percent) =
        analyze_background_removal_effect(&original_image, &auto_result.image);
    println!(
        "📊 Auto: {} transparent pixels ({:.1}%), {} changed pixels",
        auto_transparent, auto_percent, auto_changed
    );

    // Verify that background removal is actually working
    if otsu_transparent == 0 && adaptive_transparent == 0 && auto_transparent == 0 {
        println!(
            "❌ ERROR: No transparent pixels created - background removal may not be working!"
        );
        return Err(crate::error::VectorizeError::algorithm_error(
            "Background removal test failed: no pixels made transparent",
        ));
    }

    if otsu_changed == 0 && adaptive_changed == 0 && auto_changed == 0 {
        println!("❌ ERROR: No pixels changed - background removal not functioning!");
        return Err(crate::error::VectorizeError::algorithm_error(
            "Background removal test failed: no pixels modified",
        ));
    }

    println!("✅ Background removal test PASSED - algorithms are working!");

    // Test different strength values
    println!("🎛️ Testing different strength values...");

    for strength in [0.1, 0.5, 0.9] {
        let config = BackgroundRemovalConfig {
            algorithm: BackgroundRemovalAlgorithm::Otsu,
            strength,
            threshold_override: None,
        };

        let result = apply_background_removal(&original_image, &config)?;
        let (transparent, _, percent) =
            analyze_background_removal_effect(&original_image, &result.image);

        println!(
            "🎛️ Strength {:.1}: {} transparent pixels ({:.1}%)",
            strength, transparent, percent
        );
    }

    println!("🎉 All background removal tests completed successfully!");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_background_removal_comprehensive() {
        let result = run_comprehensive_test();
        assert!(
            result.is_ok(),
            "Background removal comprehensive test failed: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_create_test_image() {
        let image = create_test_image();
        assert_eq!(image.width(), 100);
        assert_eq!(image.height(), 100);

        // Check that we have both black and white pixels
        let mut has_black = false;
        let mut has_white = false;

        for pixel in image.pixels() {
            if pixel.0[0] == 0 && pixel.0[1] == 0 && pixel.0[2] == 0 {
                has_black = true;
            }
            if pixel.0[0] == 255 && pixel.0[1] == 255 && pixel.0[2] == 255 {
                has_white = true;
            }
        }

        assert!(has_black, "Test image should have black pixels");
        assert!(has_white, "Test image should have white pixels");
    }
}
