//! Thinning/skeletonization strategies for centerline extraction

use super::{ThinningStrategy, DistanceTransformStrategy};
use super::distance_transform::DistanceFieldCenterlineExtractor;
use crate::error::VectorizeError;
use image::{GrayImage, ImageBuffer, Luma};

/// Guo-Hall thinning algorithm (current high-quality implementation)
#[derive(Debug, Default)]
pub struct GuoHallThinning;

impl ThinningStrategy for GuoHallThinning {
    fn thin(&self, binary: &GrayImage) -> Result<GrayImage, VectorizeError> {
        Ok(guo_hall_thinning(binary))
    }
    
    fn name(&self) -> &'static str {
        "GuoHall"
    }
    
    fn preserves_topology(&self) -> bool {
        true
    }
}

/// Zhang-Suen thinning algorithm (legacy)
#[derive(Debug, Default)]
pub struct ZhangSuenThinning;

impl ThinningStrategy for ZhangSuenThinning {
    fn thin(&self, binary: &GrayImage) -> Result<GrayImage, VectorizeError> {
        Ok(zhang_suen_thinning(binary))
    }
    
    fn name(&self) -> &'static str {
        "ZhangSuen"
    }
    
    fn preserves_topology(&self) -> bool {
        true
    }
}

/// Distance transform-based thinning (high performance alternative)
#[derive(Debug)]
pub struct DistanceTransformThinning {
    extractor: DistanceFieldCenterlineExtractor,
}

impl Default for DistanceTransformThinning {
    fn default() -> Self {
        Self {
            extractor: DistanceFieldCenterlineExtractor::new(),
        }
    }
}

impl ThinningStrategy for DistanceTransformThinning {
    fn thin(&self, binary: &GrayImage) -> Result<GrayImage, VectorizeError> {
        // Extract centerlines as polylines, then render back to skeleton image
        let centerlines = self.extractor.extract_centerlines(binary)?;
        Ok(render_polylines_to_skeleton(centerlines, binary.dimensions()))
    }
    
    fn name(&self) -> &'static str {
        "DistanceTransform"
    }
    
    fn preserves_topology(&self) -> bool {
        false // Distance-based approach may break some connections for performance
    }
}

/// SIMD-optimized parallel thinning (future implementation)
#[derive(Debug, Default)]
pub struct SimdThinning;

impl ThinningStrategy for SimdThinning {
    fn thin(&self, binary: &GrayImage) -> Result<GrayImage, VectorizeError> {
        // TODO: Implement SIMD version in Phase 3
        Ok(guo_hall_thinning(binary))
    }
    
    fn name(&self) -> &'static str {
        "SimdOptimized"
    }
    
    fn preserves_topology(&self) -> bool {
        true
    }
}

// Implementation functions

fn guo_hall_thinning(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut img = binary.clone();
    let mut changed = true;

    // Helper function to get foreground pixel value safely
    let fg = |img: &GrayImage, x: i32, y: i32, width: u32, height: u32| -> u8 {
        if x < 0 || y < 0 || x as u32 >= width || y as u32 >= height { 
            0 
        } else { 
            if img.get_pixel(x as u32, y as u32).0[0] > 0 { 1 } else { 0 } 
        }
    };

    while changed {
        changed = false;

        // Sub-iteration 1
        let mut to_zero = Vec::<(u32, u32)>::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if img.get_pixel(x, y).0[0] == 0 { continue; }
                
                let p2 = fg(&img, x as i32, y as i32 - 1, width, height);
                let p3 = fg(&img, x as i32 + 1, y as i32 - 1, width, height);
                let p4 = fg(&img, x as i32 + 1, y as i32, width, height);
                let p5 = fg(&img, x as i32 + 1, y as i32 + 1, width, height);
                let p6 = fg(&img, x as i32, y as i32 + 1, width, height);
                let p7 = fg(&img, x as i32 - 1, y as i32 + 1, width, height);
                let p8 = fg(&img, x as i32 - 1, y as i32, width, height);
                let p9 = fg(&img, x as i32 - 1, y as i32 - 1, width, height);

                let bp1 = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                if bp1 < 2 || bp1 > 6 { continue; }

                // Number of 0->1 transitions in p2..p9,p2
                let seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
                let mut a = 0;
                for k in 0..8 { 
                    if seq[k] == 0 && seq[k + 1] == 1 { 
                        a += 1; 
                    } 
                }
                if a != 1 { continue; }

                if p2 * p4 * p6 != 0 { continue; }
                if p4 * p6 * p8 != 0 { continue; }

                to_zero.push((x, y));
            }
        }
        for (x, y) in to_zero { 
            img.get_pixel_mut(x, y).0[0] = 0; 
            changed = true; 
        }

        // Sub-iteration 2
        let mut to_zero = Vec::<(u32, u32)>::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if img.get_pixel(x, y).0[0] == 0 { continue; }
                
                let p2 = fg(&img, x as i32, y as i32 - 1, width, height);
                let p3 = fg(&img, x as i32 + 1, y as i32 - 1, width, height);
                let p4 = fg(&img, x as i32 + 1, y as i32, width, height);
                let p5 = fg(&img, x as i32 + 1, y as i32 + 1, width, height);
                let p6 = fg(&img, x as i32, y as i32 + 1, width, height);
                let p7 = fg(&img, x as i32 - 1, y as i32 + 1, width, height);
                let p8 = fg(&img, x as i32 - 1, y as i32, width, height);
                let p9 = fg(&img, x as i32 - 1, y as i32 - 1, width, height);

                let bp1 = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                if bp1 < 2 || bp1 > 6 { continue; }

                let seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
                let mut a = 0;
                for k in 0..8 { 
                    if seq[k] == 0 && seq[k + 1] == 1 { 
                        a += 1; 
                    } 
                }
                if a != 1 { continue; }

                if p2 * p4 * p8 != 0 { continue; }
                if p2 * p6 * p8 != 0 { continue; }

                to_zero.push((x, y));
            }
        }
        for (x, y) in to_zero { 
            img.get_pixel_mut(x, y).0[0] = 0; 
            changed = true; 
        }
    }
    
    img
}

fn zhang_suen_thinning(binary: &GrayImage) -> GrayImage {
    let (width, height) = binary.dimensions();
    let mut img = binary.clone();
    let mut changed = true;

    // Helper function to get foreground pixel value safely
    let fg = |img: &GrayImage, x: i32, y: i32, width: u32, height: u32| -> u8 {
        if x < 0 || y < 0 || x as u32 >= width || y as u32 >= height { 
            0 
        } else { 
            if img.get_pixel(x as u32, y as u32).0[0] > 0 { 1 } else { 0 } 
        }
    };

    while changed {
        changed = false;

        // Sub-iteration 1
        let mut to_zero = Vec::<(u32, u32)>::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if img.get_pixel(x, y).0[0] == 0 { continue; }

                let p2 = fg(&img, x as i32, y as i32 - 1, width, height);
                let p3 = fg(&img, x as i32 + 1, y as i32 - 1, width, height);
                let p4 = fg(&img, x as i32 + 1, y as i32, width, height);
                let p5 = fg(&img, x as i32 + 1, y as i32 + 1, width, height);
                let p6 = fg(&img, x as i32, y as i32 + 1, width, height);
                let p7 = fg(&img, x as i32 - 1, y as i32 + 1, width, height);
                let p8 = fg(&img, x as i32 - 1, y as i32, width, height);
                let p9 = fg(&img, x as i32 - 1, y as i32 - 1, width, height);

                let bp1 = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                if bp1 < 2 || bp1 > 6 { continue; }

                // Number of 0->1 transitions in p2..p9,p2
                let seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
                let mut a = 0;
                for k in 0..8 { 
                    if seq[k] == 0 && seq[k + 1] == 1 { 
                        a += 1; 
                    } 
                }
                if a != 1 { continue; }

                if p2 * p4 * p6 != 0 { continue; }
                if p4 * p6 * p8 != 0 { continue; }

                to_zero.push((x, y));
            }
        }
        for (x, y) in to_zero { 
            img.get_pixel_mut(x, y).0[0] = 0; 
            changed = true; 
        }

        // Sub-iteration 2  
        let mut to_zero = Vec::<(u32, u32)>::new();
        for y in 1..(height - 1) {
            for x in 1..(width - 1) {
                if img.get_pixel(x, y).0[0] == 0 { continue; }
                
                let p2 = fg(&img, x as i32, y as i32 - 1, width, height);
                let p3 = fg(&img, x as i32 + 1, y as i32 - 1, width, height);
                let p4 = fg(&img, x as i32 + 1, y as i32, width, height);
                let p5 = fg(&img, x as i32 + 1, y as i32 + 1, width, height);
                let p6 = fg(&img, x as i32, y as i32 + 1, width, height);
                let p7 = fg(&img, x as i32 - 1, y as i32 + 1, width, height);
                let p8 = fg(&img, x as i32 - 1, y as i32, width, height);
                let p9 = fg(&img, x as i32 - 1, y as i32 - 1, width, height);

                let bp1 = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                if bp1 < 2 || bp1 > 6 { continue; }

                let seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
                let mut a = 0;
                for k in 0..8 { 
                    if seq[k] == 0 && seq[k + 1] == 1 { 
                        a += 1; 
                    } 
                }
                if a != 1 { continue; }

                if p2 * p4 * p8 != 0 { continue; }
                if p2 * p6 * p8 != 0 { continue; }

                to_zero.push((x, y));
            }
        }
        for (x, y) in to_zero { 
            img.get_pixel_mut(x, y).0[0] = 0; 
            changed = true; 
        }
    }
    
    img
}

fn render_polylines_to_skeleton(polylines: Vec<Vec<crate::algorithms::Point>>, dimensions: (u32, u32)) -> GrayImage {
    let (width, height) = dimensions;
    let mut skeleton = GrayImage::new(width, height);
    
    // Draw each polyline onto the skeleton
    for polyline in polylines {
        for i in 0..polyline.len() {
            let point = &polyline[i];
            let x = point.x.round() as u32;
            let y = point.y.round() as u32;
            
            if x < width && y < height {
                skeleton.put_pixel(x, y, Luma([255]));
            }
            
            // Connect adjacent points with lines
            if i > 0 {
                let prev_point = &polyline[i - 1];
                draw_line(
                    &mut skeleton, 
                    prev_point.x.round() as i32, 
                    prev_point.y.round() as i32,
                    point.x.round() as i32, 
                    point.y.round() as i32
                );
            }
        }
    }
    
    skeleton
}

fn draw_line(img: &mut GrayImage, x0: i32, y0: i32, x1: i32, y1: i32) {
    let (width, height) = img.dimensions();
    
    // Bresenham's line algorithm
    let dx = (x1 - x0).abs();
    let dy = (y1 - y0).abs();
    let sx = if x0 < x1 { 1 } else { -1 };
    let sy = if y0 < y1 { 1 } else { -1 };
    let mut err = dx - dy;
    
    let mut x = x0;
    let mut y = y0;
    
    loop {
        if x >= 0 && y >= 0 && x < width as i32 && y < height as i32 {
            img.put_pixel(x as u32, y as u32, Luma([255]));
        }
        
        if x == x1 && y == y1 { break; }
        
        let e2 = 2 * err;
        if e2 > -dy {
            err -= dy;
            x += sx;
        }
        if e2 < dx {
            err += dx;
            y += sy;
        }
    }
}