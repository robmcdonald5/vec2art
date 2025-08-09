//! Simple integration test for Phase A modules to verify basic functionality

use crate::segmentation::*;
use crate::tracing::*;
use crate::fills::*;
use crate::preprocessing::*;
use image::{ImageBuffer, Rgba};

/// Simple test to verify Phase A modules can be called successfully
#[cfg(test)]
pub fn test_phase_a_basic_functionality() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing Phase A modules basic functionality...");
    
    // Test 1: Denoising
    println!("1. Testing denoising filters...");
    let test_image = ImageBuffer::from_fn(20, 20, |x, y| {
        let intensity = ((x + y) % 256) as u8;
        Rgba([intensity, intensity, intensity, 255])
    });
    
    let guided_result = guided_filter(&test_image, 2, 0.01);
    assert!(guided_result.is_ok(), "Guided filter failed: {:?}", guided_result.err());
    
    let bilateral_result = bilateral_filter_enhanced(&test_image, 2.0, 10.0);
    assert!(bilateral_result.is_ok(), "Bilateral filter failed: {:?}", bilateral_result.err());
    
    println!("   ✓ Denoising filters working");
    
    // Test 2: Adaptive Quantization
    println!("2. Testing adaptive quantization...");
    let config = AdaptiveQuantizationConfig {
        initial_clusters: 8,
        target_colors: 4,
        merge_threshold: 5.0,
        max_iterations: 15,
        convergence_threshold: 1.0,
    };
    
    let quant_result = adaptive_kmeans_quantization(&test_image, &config);
    assert!(quant_result.is_ok(), "Adaptive quantization failed: {:?}", quant_result.err());
    
    let quantization = quant_result.unwrap();
    assert!(quantization.palette_rgb.len() <= 4, "Too many colors in result");
    assert!(quantization.palette_rgb.len() >= 2, "Too few colors in result");
    
    println!("   ✓ Adaptive quantization working");
    
    // Test 3: Curve Fitting
    println!("3. Testing curve fitting...");
    let mut test_points = Vec::new();
    for i in 0..10 {
        let t = (i as f64) / 9.0;
        let x = t * 10.0;
        let y = 2.0 + (t * std::f64::consts::PI).sin();
        test_points.push(Point2D::new(x, y));
    }
    
    let curve_result = fit_cubic_bezier(&test_points, None, None, 1.0);
    assert!(curve_result.is_ok(), "Curve fitting failed: {:?}", curve_result.err());
    
    let curve = curve_result.unwrap();
    let start_error = curve.p0.distance_to(&test_points[0]);
    let end_error = curve.p3.distance_to(&test_points[test_points.len()-1]);
    assert!(start_error < 0.01, "Start point mismatch");
    assert!(end_error < 0.01, "End point mismatch");
    
    println!("   ✓ Curve fitting working");
    
    // Test 4: Gradient Analysis
    println!("4. Testing gradient analysis...");
    let gradient_image = ImageBuffer::from_fn(25, 15, |x, y| {
        let intensity = (x as f32 / 24.0 * 255.0) as u8;
        Rgba([intensity, intensity, intensity, 255])
    });
    
    let mut pixels = Vec::new();
    for y in 0..15 {
        for x in 0..25 {
            pixels.push((x, y));
        }
    }
    
    let gradient_result = analyze_region_gradient_pca(&pixels, &gradient_image, 3);
    assert!(gradient_result.is_ok(), "Gradient analysis failed: {:?}", gradient_result.err());
    
    // Gradient analysis should either find a gradient or return None
    let has_gradient = gradient_result.unwrap().is_some();
    println!("   ✓ Gradient analysis working (found gradient: {})", has_gradient);
    
    // Test 5: Region Adjacency Graph (simple test)
    println!("5. Testing Region Adjacency Graph...");
    let simple_image = ImageBuffer::from_fn(10, 10, |x, _y| {
        if x < 5 {
            Rgba([255, 0, 0, 255])
        } else {
            Rgba([0, 255, 0, 255])
        }
    });
    
    let mut regions = std::collections::HashMap::new();
    let mut left_pixels = Vec::new();
    let mut right_pixels = Vec::new();
    
    for y in 0..10 {
        for x in 0..10 {
            if x < 5 {
                left_pixels.push((x, y));
            } else {
                right_pixels.push((x, y));
            }
        }
    }
    
    regions.insert(0, left_pixels);
    regions.insert(1, right_pixels);
    
    let rag_result = RegionAdjacencyGraph::from_segmentation(&regions, &simple_image);
    assert!(rag_result.is_ok(), "RAG construction failed: {:?}", rag_result.err());
    
    let rag = rag_result.unwrap();
    assert_eq!(rag.regions.len(), 2, "Should have 2 regions");
    assert!(!rag.adjacencies.is_empty(), "Should have adjacencies");
    
    println!("   ✓ Region Adjacency Graph working");
    
    println!("All Phase A module tests passed! ✅");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_phase_a_integration() {
        test_phase_a_basic_functionality().unwrap();
    }
}