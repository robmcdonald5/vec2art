use image::Rgb;
use palette::{FromColor, IntoColor, Lab, Srgb, Hsv};

/// Convert RGB to HSV color space
pub fn rgb_to_hsv(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    let srgb = Srgb::new(r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0);
    let hsv: Hsv = srgb.into_color();
    (hsv.hue.into_positive_degrees(), hsv.saturation, hsv.value)
}

/// Convert HSV to RGB color space
pub fn hsv_to_rgb(h: f32, s: f32, v: f32) -> (u8, u8, u8) {
    let hsv = Hsv::new(h, s, v);
    let srgb: Srgb = hsv.into_color();
    (
        (srgb.red * 255.0) as u8,
        (srgb.green * 255.0) as u8,
        (srgb.blue * 255.0) as u8,
    )
}

/// Calculate perceptual distance between two colors using LAB color space
pub fn color_distance_lab(c1: Rgb<u8>, c2: Rgb<u8>) -> f32 {
    let lab1 = rgb_to_lab(c1);
    let lab2 = rgb_to_lab(c2);
    
    let dl = lab1.l - lab2.l;
    let da = lab1.a - lab2.a;
    let db = lab1.b - lab2.b;
    
    (dl * dl + da * da + db * db).sqrt()
}

/// Convert RGB to LAB color space
pub fn rgb_to_lab(rgb: Rgb<u8>) -> Lab {
    let srgb = Srgb::new(
        rgb[0] as f32 / 255.0,
        rgb[1] as f32 / 255.0,
        rgb[2] as f32 / 255.0,
    );
    Lab::from_color(srgb)
}

/// Convert LAB to RGB color space
pub fn lab_to_rgb(lab: Lab) -> Rgb<u8> {
    let srgb: Srgb = lab.into_color();
    Rgb([
        (srgb.red * 255.0).max(0.0).min(255.0) as u8,
        (srgb.green * 255.0).max(0.0).min(255.0) as u8,
        (srgb.blue * 255.0).max(0.0).min(255.0) as u8,
    ])
}

/// Quantize colors using median cut algorithm
pub fn median_cut_quantize(colors: &[Rgb<u8>], num_colors: usize) -> Vec<Rgb<u8>> {
    if colors.is_empty() || num_colors == 0 {
        return Vec::new();
    }
    
    if colors.len() <= num_colors {
        return colors.to_vec();
    }
    
    // Create initial box containing all colors
    let mut boxes = vec![ColorBox::new(colors.to_vec())];
    
    // Split boxes until we have the desired number
    while boxes.len() < num_colors {
        // Find the box with the largest volume or population
        let mut max_score = 0.0;
        let mut max_idx = 0;
        
        for (idx, b) in boxes.iter().enumerate() {
            let score = b.score();
            if score > max_score {
                max_score = score;
                max_idx = idx;
            }
        }
        
        // Split the selected box
        if let Some((box1, box2)) = boxes[max_idx].split() {
            boxes.remove(max_idx);
            boxes.push(box1);
            boxes.push(box2);
        } else {
            break; // Can't split anymore
        }
    }
    
    // Return the average color of each box
    boxes.iter().map(|b| b.average_color()).collect()
}

struct ColorBox {
    colors: Vec<Rgb<u8>>,
    min_r: u8,
    max_r: u8,
    min_g: u8,
    max_g: u8,
    min_b: u8,
    max_b: u8,
}

impl ColorBox {
    fn new(colors: Vec<Rgb<u8>>) -> Self {
        let mut min_r = 255;
        let mut max_r = 0;
        let mut min_g = 255;
        let mut max_g = 0;
        let mut min_b = 255;
        let mut max_b = 0;
        
        for c in &colors {
            min_r = min_r.min(c[0]);
            max_r = max_r.max(c[0]);
            min_g = min_g.min(c[1]);
            max_g = max_g.max(c[1]);
            min_b = min_b.min(c[2]);
            max_b = max_b.max(c[2]);
        }
        
        Self {
            colors,
            min_r,
            max_r,
            min_g,
            max_g,
            min_b,
            max_b,
        }
    }
    
    fn score(&self) -> f32 {
        // Score based on volume * population
        let volume = (self.max_r - self.min_r) as f32 *
                    (self.max_g - self.min_g) as f32 *
                    (self.max_b - self.min_b) as f32;
        volume * (self.colors.len() as f32).sqrt()
    }
    
    fn split(&self) -> Option<(ColorBox, ColorBox)> {
        if self.colors.len() < 2 {
            return None;
        }
        
        // Find the dimension with the largest range
        let range_r = self.max_r - self.min_r;
        let range_g = self.max_g - self.min_g;
        let range_b = self.max_b - self.min_b;
        
        let mut colors = self.colors.clone();
        
        // Sort along the dimension with largest range
        if range_r >= range_g && range_r >= range_b {
            colors.sort_by_key(|c| c[0]);
        } else if range_g >= range_r && range_g >= range_b {
            colors.sort_by_key(|c| c[1]);
        } else {
            colors.sort_by_key(|c| c[2]);
        }
        
        // Split at median
        let mid = colors.len() / 2;
        let colors1 = colors[..mid].to_vec();
        let colors2 = colors[mid..].to_vec();
        
        Some((ColorBox::new(colors1), ColorBox::new(colors2)))
    }
    
    fn average_color(&self) -> Rgb<u8> {
        if self.colors.is_empty() {
            return Rgb([0, 0, 0]);
        }
        
        let mut sum_r = 0u32;
        let mut sum_g = 0u32;
        let mut sum_b = 0u32;
        
        for c in &self.colors {
            sum_r += c[0] as u32;
            sum_g += c[1] as u32;
            sum_b += c[2] as u32;
        }
        
        let n = self.colors.len() as u32;
        Rgb([
            (sum_r / n) as u8,
            (sum_g / n) as u8,
            (sum_b / n) as u8,
        ])
    }
}

/// Mix two colors with given ratio (0.0 = color1, 1.0 = color2)
pub fn mix_colors(c1: Rgb<u8>, c2: Rgb<u8>, ratio: f32) -> Rgb<u8> {
    let ratio = ratio.max(0.0).min(1.0);
    let inv_ratio = 1.0 - ratio;
    
    Rgb([
        (c1[0] as f32 * inv_ratio + c2[0] as f32 * ratio) as u8,
        (c1[1] as f32 * inv_ratio + c2[1] as f32 * ratio) as u8,
        (c1[2] as f32 * inv_ratio + c2[2] as f32 * ratio) as u8,
    ])
}

/// Convert color to hex string
pub fn rgb_to_hex(rgb: Rgb<u8>) -> String {
    format!("#{:02x}{:02x}{:02x}", rgb[0], rgb[1], rgb[2])
}

/// Parse hex color string to RGB
pub fn hex_to_rgb(hex: &str) -> Option<Rgb<u8>> {
    let hex = hex.trim_start_matches('#');
    
    if hex.len() != 6 {
        return None;
    }
    
    let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
    
    Some(Rgb([r, g, b]))
}

/// Calculate luminance of a color
pub fn luminance(rgb: Rgb<u8>) -> f32 {
    // Using relative luminance formula
    let r = rgb[0] as f32 / 255.0;
    let g = rgb[1] as f32 / 255.0;
    let b = rgb[2] as f32 / 255.0;
    
    0.2126 * r + 0.7152 * g + 0.0722 * b
}

/// Determine if a color is light or dark
pub fn is_light_color(rgb: Rgb<u8>) -> bool {
    luminance(rgb) > 0.5
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_rgb_to_hex() {
        assert_eq!(rgb_to_hex(Rgb([255, 0, 0])), "#ff0000");
        assert_eq!(rgb_to_hex(Rgb([0, 255, 0])), "#00ff00");
        assert_eq!(rgb_to_hex(Rgb([0, 0, 255])), "#0000ff");
        assert_eq!(rgb_to_hex(Rgb([128, 128, 128])), "#808080");
    }
    
    #[test]
    fn test_hex_to_rgb() {
        assert_eq!(hex_to_rgb("#ff0000"), Some(Rgb([255, 0, 0])));
        assert_eq!(hex_to_rgb("#00ff00"), Some(Rgb([0, 255, 0])));
        assert_eq!(hex_to_rgb("#0000ff"), Some(Rgb([0, 0, 255])));
        assert_eq!(hex_to_rgb("808080"), Some(Rgb([128, 128, 128])));
        assert_eq!(hex_to_rgb("invalid"), None);
    }
    
    #[test]
    fn test_mix_colors() {
        let c1 = Rgb([0, 0, 0]);
        let c2 = Rgb([255, 255, 255]);
        
        assert_eq!(mix_colors(c1, c2, 0.0), c1);
        assert_eq!(mix_colors(c1, c2, 1.0), c2);
        assert_eq!(mix_colors(c1, c2, 0.5), Rgb([127, 127, 127]));
    }
}