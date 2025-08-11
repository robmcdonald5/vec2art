//! Test Assets and Data Generation for Dot Mapping Comprehensive Testing
//!
//! This module provides utilities for generating consistent test assets
//! and setting up test data for comprehensive dot mapping validation.

use image::{ImageBuffer, Rgba, RgbaImage};

/// Standard test image dimensions for consistent testing
pub const SMALL_SIZE: (u32, u32) = (64, 64);
pub const MEDIUM_SIZE: (u32, u32) = (128, 128);
pub const LARGE_SIZE: (u32, u32) = (256, 256);
pub const PERFORMANCE_SIZE: (u32, u32) = (384, 384);

/// Test image asset manager
pub struct TestAssets;

impl TestAssets {
    /// Generate a complete set of test images for comprehensive testing
    pub fn generate_all_test_images() -> TestImageSet {
        TestImageSet {
            // Basic patterns
            checkerboard_small: Self::create_checkerboard_pattern(SMALL_SIZE.0, SMALL_SIZE.1, 8),
            checkerboard_medium: Self::create_checkerboard_pattern(MEDIUM_SIZE.0, MEDIUM_SIZE.1, 16),
            gradient_horizontal: Self::create_horizontal_gradient(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            gradient_radial: Self::create_radial_gradient(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            
            // Content-specific images
            portrait_like: Self::create_portrait_simulation(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            landscape_like: Self::create_landscape_simulation(LARGE_SIZE.0, LARGE_SIZE.1 * 3 / 4),
            logo_geometric: Self::create_geometric_logo(SMALL_SIZE.0, SMALL_SIZE.1),
            technical_drawing: Self::create_technical_drawing(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            
            // Edge cases
            solid_white: Self::create_solid_color(SMALL_SIZE.0, SMALL_SIZE.1, Rgba([255, 255, 255, 255])),
            solid_black: Self::create_solid_color(SMALL_SIZE.0, SMALL_SIZE.1, Rgba([0, 0, 0, 255])),
            high_contrast: Self::create_high_contrast_pattern(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            low_contrast: Self::create_low_contrast_pattern(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            
            // Complex patterns
            noise_texture: Self::create_noise_texture(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            organic_shapes: Self::create_organic_shapes(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            architectural: Self::create_architectural_pattern(MEDIUM_SIZE.0, MEDIUM_SIZE.1),
            
            // Performance testing
            performance_complex: Self::create_complex_performance_image(PERFORMANCE_SIZE.0, PERFORMANCE_SIZE.1),
        }
    }
    
    /// Create checkerboard pattern for basic testing
    pub fn create_checkerboard_pattern(width: u32, height: u32, square_size: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            if (x / square_size + y / square_size) % 2 == 0 {
                Rgba([255, 255, 255, 255]) // White
            } else {
                Rgba([0, 0, 0, 255]) // Black
            }
        })
    }
    
    /// Create horizontal gradient
    pub fn create_horizontal_gradient(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, _y| {
            let intensity = ((x as f32 / width as f32) * 255.0) as u8;
            Rgba([intensity, intensity, intensity, 255])
        })
    }
    
    /// Create radial gradient from center
    pub fn create_radial_gradient(width: u32, height: u32) -> RgbaImage {
        let center_x = width as f32 / 2.0;
        let center_y = height as f32 / 2.0;
        let max_distance = (center_x.powi(2) + center_y.powi(2)).sqrt();
        
        ImageBuffer::from_fn(width, height, |x, y| {
            let distance = ((x as f32 - center_x).powi(2) + (y as f32 - center_y).powi(2)).sqrt();
            let intensity = ((1.0 - distance / max_distance) * 255.0).max(0.0).min(255.0) as u8;
            Rgba([intensity, intensity, intensity, 255])
        })
    }
    
    /// Create portrait-like simulation
    pub fn create_portrait_simulation(width: u32, height: u32) -> RgbaImage {
        let center_x = width as f32 / 2.0;
        let center_y = height as f32 / 2.0;
        let face_radius = width.min(height) as f32 / 3.0;
        
        ImageBuffer::from_fn(width, height, |x, y| {
            let distance = ((x as f32 - center_x).powi(2) + (y as f32 - center_y).powi(2)).sqrt();
            let angle = (y as f32 - center_y).atan2(x as f32 - center_x);
            
            if distance < face_radius * 0.8 {
                // Face area - skin tone with features
                let feature_intensity = (angle * 3.0).sin() * 10.0 + (distance / 20.0).sin() * 15.0;
                let base_intensity = 220.0 + feature_intensity;
                let intensity = base_intensity.max(180.0).min(255.0) as u8;
                Rgba([intensity, intensity - 30, intensity - 40, 255])
            } else if distance < face_radius {
                // Hair area
                let hair_variation = ((x + y) % 7) as f32 * 8.0;
                let base = 80.0 + hair_variation;
                Rgba([base as u8, (base * 0.8) as u8, (base * 0.6) as u8, 255])
            } else {
                // Background with subtle texture
                let bg_noise = ((x * 3 + y * 5) % 13) as f32 * 5.0;
                let bg = 240.0 + bg_noise;
                Rgba([bg as u8, bg as u8, bg as u8, 255])
            }
        })
    }
    
    /// Create landscape-like simulation
    pub fn create_landscape_simulation(width: u32, height: u32) -> RgbaImage {
        let horizon = height as f32 * 0.6;
        
        ImageBuffer::from_fn(width, height, |x, y| {
            let mountain_height = (((x as f32 / width as f32) * 6.28).sin() * 25.0 + 
                                 ((x as f32 / width as f32) * 12.56).sin() * 12.0) + horizon - 50.0;
            
            if (y as f32) < mountain_height {
                // Sky with gradient and clouds
                let sky_intensity = 200 - ((y as f32 / horizon) * 60.0) as u8;
                let cloud_noise = ((x / 8 + y / 3) % 17) as f32 / 17.0 * 30.0;
                let sky = sky_intensity as f32 + cloud_noise;
                Rgba([
                    (sky * 0.7) as u8,
                    (sky * 0.85) as u8,
                    sky.min(255.0) as u8,
                    255
                ])
            } else if (y as f32) < horizon {
                // Mountains with shading
                let mountain_shade = 120 + ((mountain_height - y as f32) * 1.5) as i32;
                let shade = mountain_shade.max(60).min(180) as u8;
                Rgba([shade, shade + 15, shade - 10, 255])
            } else {
                // Ground with texture
                let ground_texture = ((x + y) % 11) as u8 * 12;
                let base = 80 + ground_texture;
                Rgba([base / 2, base, base / 3, 255])
            }
        })
    }
    
    /// Create geometric logo pattern
    pub fn create_geometric_logo(width: u32, height: u32) -> RgbaImage {
        let center_x = width as f32 / 2.0;
        let center_y = height as f32 / 2.0;
        
        ImageBuffer::from_fn(width, height, |x, y| {
            let dx = x as f32 - center_x;
            let dy = y as f32 - center_y;
            let distance = (dx.powi(2) + dy.powi(2)).sqrt();
            let angle = dy.atan2(dx);
            
            // Create geometric shapes
            if distance < 15.0 {
                Rgba([255, 100, 100, 255]) // Red center circle
            } else if distance < 25.0 && (angle * 6.0).cos() > 0.0 {
                Rgba([100, 255, 100, 255]) // Green star pattern
            } else if dx.abs() < 10.0 || dy.abs() < 10.0 {
                if distance < 35.0 {
                    Rgba([100, 100, 255, 255]) // Blue cross
                } else {
                    Rgba([255, 255, 255, 255]) // White background
                }
            } else {
                Rgba([255, 255, 255, 255]) // White background
            }
        })
    }
    
    /// Create technical drawing pattern
    pub fn create_technical_drawing(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let grid_size = 20;
            let line_width = 1;
            
            // Grid lines
            let on_grid_x = (x % grid_size) < line_width;
            let on_grid_y = (y % grid_size) < line_width;
            
            // Diagonal construction lines
            let diagonal1 = ((x as i32 - y as i32).abs()) < 2;
            let diagonal2 = ((x as i32 + y as i32 - width as i32).abs()) < 2;
            
            // Circle outlines
            let center_x = width as f32 / 2.0;
            let center_y = height as f32 / 2.0;
            let circle_dist = ((x as f32 - center_x).powi(2) + (y as f32 - center_y).powi(2)).sqrt();
            let on_circle1 = (circle_dist - 30.0).abs() < 2.0;
            let on_circle2 = (circle_dist - 50.0).abs() < 2.0;
            
            if on_grid_x || on_grid_y {
                Rgba([220, 220, 220, 255]) // Light grid
            } else if diagonal1 || diagonal2 {
                Rgba([180, 180, 180, 255]) // Construction lines
            } else if on_circle1 || on_circle2 {
                Rgba([0, 0, 0, 255]) // Main geometry
            } else {
                Rgba([255, 255, 255, 255]) // White background
            }
        })
    }
    
    /// Create solid color image
    pub fn create_solid_color(width: u32, height: u32, color: Rgba<u8>) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |_, _| color)
    }
    
    /// Create high contrast pattern
    pub fn create_high_contrast_pattern(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let pattern1 = (x / 10 + y / 10) % 2;
            let pattern2 = (x / 3 + y / 7) % 3;
            
            match (pattern1, pattern2) {
                (0, 0) => Rgba([0, 0, 0, 255]),       // Black
                (0, 1) => Rgba([255, 255, 255, 255]), // White
                (0, 2) => Rgba([255, 0, 0, 255]),     // Red
                (1, 0) => Rgba([0, 255, 0, 255]),     // Green
                (1, 1) => Rgba([0, 0, 255, 255]),     // Blue
                _ => Rgba([255, 255, 0, 255]),        // Yellow
            }
        })
    }
    
    /// Create low contrast pattern
    pub fn create_low_contrast_pattern(width: u32, height: u32) -> RgbaImage {
        let base = 128;
        let variation = 20;
        
        ImageBuffer::from_fn(width, height, |x, y| {
            let pattern1 = ((x as f32 * 0.1).sin() * variation as f32) as i32;
            let pattern2 = ((y as f32 * 0.1).cos() * variation as f32) as i32;
            let noise = ((x * 7 + y * 11) % 23) as i32 - 11;
            
            let intensity = (base + pattern1 + pattern2 + noise / 3)
                .max(base - variation)
                .min(base + variation) as u8;
            
            Rgba([intensity, intensity + 5, intensity - 3, 255])
        })
    }
    
    /// Create noise texture
    pub fn create_noise_texture(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            // Multiple noise layers
            let noise1 = ((x * 13 + y * 17) % 127) as f32 / 127.0;
            let noise2 = ((x * 7 + y * 23) % 97) as f32 / 97.0;
            let noise3 = ((x * 3 + y * 31) % 73) as f32 / 73.0;
            
            let combined = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * 255.0;
            let intensity = combined as u8;
            
            Rgba([intensity, intensity, intensity, 255])
        })
    }
    
    /// Create organic shapes pattern
    pub fn create_organic_shapes(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let fx = x as f32 / width as f32;
            let fy = y as f32 / height as f32;
            
            // Create organic blob-like shapes using sine waves
            let shape1 = ((fx * 6.0).sin() + (fy * 4.0).cos()) * 0.5 + 0.5;
            let shape2 = ((fx * 8.0 + fy * 6.0).sin()) * 0.5 + 0.5;
            let shape3 = ((fx * 10.0).cos() * (fy * 8.0).sin()) * 0.5 + 0.5;
            
            let combined = (shape1 * 0.4 + shape2 * 0.4 + shape3 * 0.2) * 255.0;
            let intensity = combined as u8;
            
            // Add some color variation
            Rgba([
                intensity,
                (intensity as f32 * 0.8) as u8,
                (intensity as f32 * 1.2).min(255.0) as u8,
                255
            ])
        })
    }
    
    /// Create architectural pattern
    pub fn create_architectural_pattern(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            // Create architectural elements like pillars, windows, etc.
            let pillar_width = width / 8;
            let window_height = height / 6;
            
            // Pillars
            let in_pillar = (x % (pillar_width * 2)) < pillar_width;
            
            // Windows
            let window_y = y % (window_height * 2);
            let in_window = window_y > window_height / 4 && window_y < window_height * 3 / 2;
            
            // Horizontal lines (floor separators)
            let on_floor_line = (y % (height / 3)) < 3;
            
            if on_floor_line {
                Rgba([100, 100, 100, 255]) // Dark floor lines
            } else if in_pillar {
                if in_window {
                    Rgba([50, 50, 50, 255]) // Dark windows
                } else {
                    Rgba([180, 180, 180, 255]) // Light pillar
                }
            } else {
                Rgba([220, 220, 220, 255]) // Light wall
            }
        })
    }
    
    /// Create complex performance testing image
    pub fn create_complex_performance_image(width: u32, height: u32) -> RgbaImage {
        ImageBuffer::from_fn(width, height, |x, y| {
            let fx = x as f32 / width as f32;
            let fy = y as f32 / height as f32;
            
            // Combine multiple patterns for complexity
            let pattern1 = ((fx * 20.0).sin() * (fy * 15.0).cos()) * 0.3;
            let pattern2 = ((fx * 30.0 + fy * 25.0).sin()) * 0.3;
            let pattern3 = ((fx * 8.0).cos() * (fy * 12.0).sin()) * 0.2;
            let noise = ((x * 7 + y * 11) % 137) as f32 / 137.0 * 0.2;
            
            let combined = pattern1 + pattern2 + pattern3 + noise + 0.5;
            let intensity = (combined * 255.0).max(0.0).min(255.0) as u8;
            
            // Create color variations
            let r = intensity;
            let g = (intensity as f32 * 0.9) as u8;
            let b = (intensity as f32 * 1.1).min(255.0) as u8;
            
            Rgba([r, g, b, 255])
        })
    }
}

/// Complete set of test images for comprehensive testing
pub struct TestImageSet {
    // Basic patterns
    pub checkerboard_small: RgbaImage,
    pub checkerboard_medium: RgbaImage,
    pub gradient_horizontal: RgbaImage,
    pub gradient_radial: RgbaImage,
    
    // Content-specific
    pub portrait_like: RgbaImage,
    pub landscape_like: RgbaImage,
    pub logo_geometric: RgbaImage,
    pub technical_drawing: RgbaImage,
    
    // Edge cases
    pub solid_white: RgbaImage,
    pub solid_black: RgbaImage,
    pub high_contrast: RgbaImage,
    pub low_contrast: RgbaImage,
    
    // Complex patterns
    pub noise_texture: RgbaImage,
    pub organic_shapes: RgbaImage,
    pub architectural: RgbaImage,
    
    // Performance testing
    pub performance_complex: RgbaImage,
}

impl TestImageSet {
    /// Get all test images as a vector with descriptive names
    pub fn get_all_images(&self) -> Vec<(&str, &RgbaImage)> {
        vec![
            ("checkerboard_small", &self.checkerboard_small),
            ("checkerboard_medium", &self.checkerboard_medium),
            ("gradient_horizontal", &self.gradient_horizontal),
            ("gradient_radial", &self.gradient_radial),
            ("portrait_like", &self.portrait_like),
            ("landscape_like", &self.landscape_like),
            ("logo_geometric", &self.logo_geometric),
            ("technical_drawing", &self.technical_drawing),
            ("solid_white", &self.solid_white),
            ("solid_black", &self.solid_black),
            ("high_contrast", &self.high_contrast),
            ("low_contrast", &self.low_contrast),
            ("noise_texture", &self.noise_texture),
            ("organic_shapes", &self.organic_shapes),
            ("architectural", &self.architectural),
            ("performance_complex", &self.performance_complex),
        ]
    }
    
    /// Get images suitable for performance testing
    pub fn get_performance_images(&self) -> Vec<(&str, &RgbaImage)> {
        vec![
            ("checkerboard_medium", &self.checkerboard_medium),
            ("portrait_like", &self.portrait_like),
            ("landscape_like", &self.landscape_like),
            ("performance_complex", &self.performance_complex),
        ]
    }
    
    /// Get images suitable for quality testing
    pub fn get_quality_images(&self) -> Vec<(&str, &RgbaImage)> {
        vec![
            ("portrait_like", &self.portrait_like),
            ("logo_geometric", &self.logo_geometric),
            ("technical_drawing", &self.technical_drawing),
            ("gradient_radial", &self.gradient_radial),
        ]
    }
    
    /// Get edge case images for robustness testing
    pub fn get_edge_case_images(&self) -> Vec<(&str, &RgbaImage)> {
        vec![
            ("solid_white", &self.solid_white),
            ("solid_black", &self.solid_black),
            ("high_contrast", &self.high_contrast),
            ("low_contrast", &self.low_contrast),
            ("noise_texture", &self.noise_texture),
        ]
    }
}

/// Test configuration presets for comprehensive testing
pub struct TestConfigs;

impl TestConfigs {
    /// Get all dot style presets for testing
    pub fn get_all_dot_styles() -> Vec<vectorize_core::algorithms::DotStyle> {
        vec![
            vectorize_core::algorithms::DotStyle::FineStippling,
            vectorize_core::algorithms::DotStyle::BoldPointillism,
            vectorize_core::algorithms::DotStyle::SketchStyle,
            vectorize_core::algorithms::DotStyle::TechnicalDrawing,
            vectorize_core::algorithms::DotStyle::WatercolorEffect,
        ]
    }
    
    /// Get test configurations for various scenarios
    pub fn get_test_dot_configs() -> Vec<(&'static str, vectorize_core::algorithms::DotConfig)> {
        use vectorize_core::algorithms::DotConfig;
        
        vec![
            ("default", DotConfig::default()),
            ("high_density", DotConfig {
                density_threshold: 0.05,
                min_radius: 0.3,
                max_radius: 2.0,
                ..DotConfig::default()
            }),
            ("large_dots", DotConfig {
                min_radius: 2.0,
                max_radius: 8.0,
                density_threshold: 0.15,
                ..DotConfig::default()
            }),
            ("color_preserve", DotConfig {
                preserve_colors: true,
                adaptive_sizing: true,
                ..DotConfig::default()
            }),
            ("minimal_dots", DotConfig {
                density_threshold: 0.3,
                min_radius: 1.0,
                max_radius: 3.0,
                preserve_colors: false,
                ..DotConfig::default()
            }),
        ]
    }
    
    /// Get adaptive configurations for testing
    pub fn get_adaptive_configs() -> Vec<(&'static str, vectorize_core::algorithms::AdaptiveConfig)> {
        use vectorize_core::algorithms::AdaptiveConfig;
        
        vec![
            ("default", AdaptiveConfig::default()),
            ("high_variation", AdaptiveConfig {
                high_detail_density: 1.0,
                low_detail_density: 0.1,
                transition_smoothness: 0.8,
                ..AdaptiveConfig::default()
            }),
            ("smooth_transition", AdaptiveConfig {
                high_detail_density: 0.6,
                low_detail_density: 0.3,
                transition_smoothness: 0.9,
                ..AdaptiveConfig::default()
            }),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_asset_generation() {
        let assets = TestAssets::generate_all_test_images();
        let all_images = assets.get_all_images();
        
        // Verify all images are generated
        assert_eq!(all_images.len(), 16, "Should generate all 16 test images");
        
        // Verify images have expected dimensions
        for (name, image) in all_images {
            assert!(image.width() > 0 && image.height() > 0, 
                   "Image '{}' should have positive dimensions", name);
            
            // Verify image is not completely uniform (except solid colors)
            if !name.contains("solid_") {
                let first_pixel = image.get_pixel(0, 0);
                let different_pixel_exists = image.pixels().any(|pixel| pixel != first_pixel);
                assert!(different_pixel_exists, 
                       "Image '{}' should have pixel variation", name);
            }
        }
    }
    
    #[test]
    fn test_config_generation() {
        let dot_configs = TestConfigs::get_test_dot_configs();
        assert!(!dot_configs.is_empty(), "Should generate dot configs");
        
        let adaptive_configs = TestConfigs::get_adaptive_configs();
        assert!(!adaptive_configs.is_empty(), "Should generate adaptive configs");
        
        let dot_styles = TestConfigs::get_all_dot_styles();
        assert_eq!(dot_styles.len(), 5, "Should have all 5 dot styles");
    }
    
    #[test]
    fn test_image_categorization() {
        let assets = TestAssets::generate_all_test_images();
        
        let performance_images = assets.get_performance_images();
        assert!(!performance_images.is_empty(), "Should have performance test images");
        
        let quality_images = assets.get_quality_images();
        assert!(!quality_images.is_empty(), "Should have quality test images");
        
        let edge_case_images = assets.get_edge_case_images();
        assert!(!edge_case_images.is_empty(), "Should have edge case images");
    }
}