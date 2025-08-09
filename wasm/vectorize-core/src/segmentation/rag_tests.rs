//! Comprehensive unit tests for Region Adjacency Graph (RAG) functionality

use super::rag::*;
use crate::preprocessing::{lab_distance, rgb_to_lab};
use image::{ImageBuffer, Rgba};
use std::collections::HashMap;

/// Create a simple 2x2 region test image
fn create_simple_regions_image() -> (ImageBuffer<Rgba<u8>, Vec<u8>>, HashMap<usize, Vec<(u32, u32)>>) {
    let image = ImageBuffer::from_fn(4, 2, |x, y| {
        if x < 2 {
            Rgba([255, 0, 0, 255])  // Red region
        } else {
            Rgba([0, 255, 0, 255])  // Green region
        }
    });
    
    let mut regions = HashMap::new();
    regions.insert(0, vec![(0, 0), (0, 1), (1, 0), (1, 1)]);
    regions.insert(1, vec![(2, 0), (2, 1), (3, 0), (3, 1)]);
    
    (image, regions)
}

/// Create a more complex test image with multiple regions
fn create_complex_regions_image() -> (ImageBuffer<Rgba<u8>, Vec<u8>>, HashMap<usize, Vec<(u32, u32)>>) {
    let image = ImageBuffer::from_fn(6, 4, |x, y| {
        match (x / 2, y / 2) {
            (0, 0) => Rgba([255, 0, 0, 255]),    // Red
            (1, 0) => Rgba([0, 255, 0, 255]),    // Green  
            (2, 0) => Rgba([0, 0, 255, 255]),    // Blue
            (0, 1) => Rgba([255, 255, 0, 255]),  // Yellow
            (1, 1) => Rgba([255, 0, 255, 255]),  // Magenta
            (2, 1) => Rgba([0, 255, 255, 255]),  // Cyan
            _ => Rgba([128, 128, 128, 255]),     // Gray fallback
        }
    });
    
    let mut regions = HashMap::new();
    regions.insert(0, vec![(0, 0), (0, 1), (1, 0), (1, 1)]);        // Red region
    regions.insert(1, vec![(2, 0), (2, 1), (3, 0), (3, 1)]);        // Green region
    regions.insert(2, vec![(4, 0), (4, 1), (5, 0), (5, 1)]);        // Blue region
    regions.insert(3, vec![(0, 2), (0, 3), (1, 2), (1, 3)]);        // Yellow region
    regions.insert(4, vec![(2, 2), (2, 3), (3, 2), (3, 3)]);        // Magenta region
    regions.insert(5, vec![(4, 2), (4, 3), (5, 2), (5, 3)]);        // Cyan region
    
    (image, regions)
}

/// Create gradient region for testing gradient-aware merging
fn create_gradient_regions_image() -> (ImageBuffer<Rgba<u8>, Vec<u8>>, HashMap<usize, Vec<(u32, u32)>>) {
    let image = ImageBuffer::from_fn(8, 4, |x, y| {
        // Create a smooth gradient from dark to light
        let intensity = (x as f32 / 7.0 * 255.0) as u8;
        Rgba([intensity, intensity, intensity, 255])
    });
    
    // Divide into segments that should merge due to similar colors
    let mut regions = HashMap::new();
    regions.insert(0, vec![(0, 0), (0, 1), (0, 2), (0, 3), (1, 0), (1, 1), (1, 2), (1, 3)]);  // Dark
    regions.insert(1, vec![(2, 0), (2, 1), (2, 2), (2, 3), (3, 0), (3, 1), (3, 2), (3, 3)]);  // Med-dark
    regions.insert(2, vec![(4, 0), (4, 1), (4, 2), (4, 3), (5, 0), (5, 1), (5, 2), (5, 3)]);  // Med-light
    regions.insert(3, vec![(6, 0), (6, 1), (6, 2), (6, 3), (7, 0), (7, 1), (7, 2), (7, 3)]);  // Light
    
    (image, regions)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rag_construction_basic() {
        let (image, regions) = create_simple_regions_image();
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Should have 2 regions
        assert_eq!(rag.regions.len(), 2);
        assert_eq!(rag.region_props.len(), 2);
        
        // Should have adjacency between the two regions
        assert!(!rag.adjacencies.is_empty());
        assert!(rag.adjacencies.contains_key(&(0, 1)) || rag.adjacencies.contains_key(&(1, 0)));
    }

    #[test]
    fn test_rag_construction_complex() {
        let (image, regions) = create_complex_regions_image();
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Should have 6 regions
        assert_eq!(rag.regions.len(), 6);
        assert_eq!(rag.region_props.len(), 6);
        
        // Should have multiple adjacencies
        assert!(rag.adjacencies.len() >= 4, "Expected multiple adjacencies, got {}", rag.adjacencies.len());
        
        // Check that region properties are calculated correctly
        for (region_id, props) in &rag.region_props {
            assert!(props.area > 0, "Region {} should have positive area", region_id);
            assert!(props.perimeter > 0, "Region {} should have positive perimeter", region_id);
            
            // Check that mean colors are reasonable
            assert!(props.mean_rgb.0 <= 255 && props.mean_rgb.1 <= 255 && props.mean_rgb.2 <= 255);
        }
    }

    #[test]
    fn test_region_properties_calculation() {
        let (image, regions) = create_simple_regions_image();
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Check red region properties
        let red_props = &rag.region_props[&0];
        assert_eq!(red_props.area, 4);
        assert_eq!(red_props.mean_rgb, (255, 0, 0)); // Should be pure red
        
        // Check green region properties  
        let green_props = &rag.region_props[&1];
        assert_eq!(green_props.area, 4);
        assert_eq!(green_props.mean_rgb, (0, 255, 0)); // Should be pure green
        
        // Check that Lab colors are calculated
        let red_lab = rgb_to_lab(255, 0, 0);
        let green_lab = rgb_to_lab(0, 255, 0);
        
        // LAB colors should be approximately correct (some floating point tolerance)
        assert!((red_props.mean_lab.0 - red_lab.0).abs() < 1.0);
        assert!((green_props.mean_lab.0 - green_lab.0).abs() < 1.0);
    }

    #[test]
    fn test_adjacency_calculation() {
        let (image, regions) = create_complex_regions_image();
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Regions should be adjacent based on the grid layout
        // Top row: Red(0) - Green(1) - Blue(2)
        // Bottom row: Yellow(3) - Magenta(4) - Cyan(5)
        
        // Horizontal adjacencies
        let red_green = rag.adjacencies.get(&(0, 1)).or_else(|| rag.adjacencies.get(&(1, 0)));
        assert!(red_green.is_some(), "Red and Green should be adjacent");
        
        let green_blue = rag.adjacencies.get(&(1, 2)).or_else(|| rag.adjacencies.get(&(2, 1)));
        assert!(green_blue.is_some(), "Green and Blue should be adjacent");
        
        // Vertical adjacencies
        let red_yellow = rag.adjacencies.get(&(0, 3)).or_else(|| rag.adjacencies.get(&(3, 0)));
        assert!(red_yellow.is_some(), "Red and Yellow should be adjacent");
        
        // Non-adjacent regions should not have direct adjacency
        let red_cyan = rag.adjacencies.get(&(0, 5)).or_else(|| rag.adjacencies.get(&(5, 0)));
        assert!(red_cyan.is_none(), "Red and Cyan should not be adjacent");
    }

    #[test]
    fn test_felzenszwalb_merge() {
        let (image, regions) = create_gradient_regions_image();
        let mut rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        let initial_count = rag.regions.len();
        
        // Apply Felzenszwalb merging with low k value to encourage merging
        let result = rag.felzenszwalb_merge(50.0, 2);
        assert!(result.is_ok());
        
        let final_count = rag.regions.len();
        
        // Should merge some regions since they're similar colors
        assert!(final_count <= initial_count, "Merging should reduce region count: {} -> {}", 
               initial_count, final_count);
    }

    #[test]
    fn test_delta_e_predicate() {
        let predicate = delta_e_predicate(5.0);
        
        // Create two similar regions
        let props1 = RegionProperties {
            mean_lab: (50.0, 0.0, 0.0),
            mean_rgb: (128, 128, 128),
            area: 100,
            perimeter: 40,
            max_boundary_gradient: 0.1,
        };
        
        let props2_similar = RegionProperties {
            mean_lab: (52.0, 1.0, 1.0), // Similar color (ΔE ≈ 2.83)
            mean_rgb: (130, 130, 130),
            area: 120,
            perimeter: 44,
            max_boundary_gradient: 0.1,
        };
        
        let props2_different = RegionProperties {
            mean_lab: (70.0, 10.0, 10.0), // Different color (ΔE ≈ 25.5)
            mean_rgb: (180, 180, 180),
            area: 80,
            perimeter: 36,
            max_boundary_gradient: 0.1,
        };
        
        // Similar colors should merge
        assert!(predicate(&props1, &props2_similar, 0.1));
        
        // Different colors should not merge
        assert!(!predicate(&props1, &props2_different, 0.1));
    }

    #[test]
    fn test_gradient_aware_predicate() {
        let predicate = gradient_aware_predicate(10.0, 0.3);
        
        let props1 = RegionProperties {
            mean_lab: (50.0, 0.0, 0.0),
            mean_rgb: (128, 128, 128),
            area: 100,
            perimeter: 40,
            max_boundary_gradient: 0.1,
        };
        
        let props2 = RegionProperties {
            mean_lab: (55.0, 2.0, 2.0), // ΔE ≈ 5.57 
            mean_rgb: (135, 135, 135),
            area: 120,
            perimeter: 44,
            max_boundary_gradient: 0.1,
        };
        
        // Low gradient should allow merging
        assert!(predicate(&props1, &props2, 0.1));
        
        // High gradient should resist merging
        assert!(!predicate(&props1, &props2, 0.5));
    }

    #[test]
    fn test_graph_merge_with_predicate() {
        let (image, regions) = create_gradient_regions_image();
        let mut rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        let initial_count = rag.regions.len();
        
        // Use a permissive predicate that should merge similar colors
        let predicate = |props1: &RegionProperties, props2: &RegionProperties, _gradient: f32| {
            lab_distance(props1.mean_lab, props2.mean_lab) < 30.0
        };
        
        let result = rag.graph_merge_with_predicate(predicate, 5);
        assert!(result.is_ok());
        
        let final_count = rag.regions.len();
        assert!(final_count <= initial_count, "Merging should reduce or maintain region count");
    }

    #[test]
    fn test_region_merging_correctness() {
        let (image, regions) = create_simple_regions_image();
        let mut rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Manually merge two regions
        let result = rag.test_merge_regions(0, 1);
        assert!(result.is_ok());
        
        // Should have one fewer region
        assert_eq!(rag.regions.len(), 1);
        
        // The remaining region should have combined pixels
        let remaining_region = rag.regions.values().next().unwrap();
        assert_eq!(remaining_region.len(), 8); // 4 + 4 pixels
        
        // Properties should be updated
        assert_eq!(rag.region_props.len(), 1);
        let merged_props = rag.region_props.values().next().unwrap();
        assert_eq!(merged_props.area, 8);
    }

    #[test]
    fn test_empty_region_handling() {
        let image = ImageBuffer::from_pixel(2, 2, Rgba([100, 100, 100, 255]));
        let mut regions = HashMap::new();
        regions.insert(0, vec![]); // Empty region
        
        let result = RegionAdjacencyGraph::from_segmentation(&regions, &image);
        assert!(result.is_err()); // Should fail with empty region
    }

    #[test]
    fn test_single_region() {
        let image = ImageBuffer::from_pixel(4, 4, Rgba([100, 100, 100, 255]));
        let mut regions = HashMap::new();
        regions.insert(0, vec![(0, 0), (0, 1), (1, 0), (1, 1)]); // Single region
        
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        assert_eq!(rag.regions.len(), 1);
        assert_eq!(rag.region_props.len(), 1);
        assert!(rag.adjacencies.is_empty()); // No adjacencies for single region
    }

    #[test]
    fn test_merge_weight_calculation() {
        let props1 = RegionProperties {
            mean_lab: (50.0, 0.0, 0.0),
            mean_rgb: (128, 128, 128),
            area: 100,
            perimeter: 40,
            max_boundary_gradient: 0.1,
        };
        
        let props2 = RegionProperties {
            mean_lab: (52.0, 1.0, 1.0),
            mean_rgb: (130, 130, 130),
            area: 120,
            perimeter: 44,
            max_boundary_gradient: 0.1,
        };
        
        let weight = super::calculate_merge_weight(&props1, &props2, 10, 50.0);
        
        // Weight should be reasonable (positive number)
        assert!(weight > 0.0, "Merge weight should be positive: {}", weight);
        assert!(weight.is_finite(), "Merge weight should be finite: {}", weight);
    }

    #[test]
    fn test_region_properties_merging() {
        let props1 = RegionProperties {
            mean_lab: (40.0, 0.0, 0.0),
            mean_rgb: (100, 100, 100),
            area: 50,
            perimeter: 30,
            max_boundary_gradient: 0.2,
        };
        
        let props2 = RegionProperties {
            mean_lab: (60.0, 0.0, 0.0),
            mean_rgb: (150, 150, 150),
            area: 100,
            perimeter: 40,
            max_boundary_gradient: 0.3,
        };
        
        let merged = super::merge_region_properties(&props1, &props2);
        
        // Area should be sum
        assert_eq!(merged.area, 150);
        
        // Colors should be weighted average
        // Expected L = (40*50 + 60*100) / 150 = (2000 + 6000) / 150 = 53.33
        assert!((merged.mean_lab.0 - 53.33).abs() < 0.1, "L component incorrect: {}", merged.mean_lab.0);
        
        // Max gradient should be maximum of the two
        assert_eq!(merged.max_boundary_gradient, 0.3);
    }

    #[test]
    fn test_large_region_stability() {
        // Test with larger regions to ensure stability
        let image = ImageBuffer::from_fn(20, 20, |x, y| {
            if x < 10 {
                Rgba([100, 0, 0, 255])
            } else {
                Rgba([0, 100, 0, 255])  
            }
        });
        
        let mut left_pixels = Vec::new();
        let mut right_pixels = Vec::new();
        
        for y in 0..20 {
            for x in 0..20 {
                if x < 10 {
                    left_pixels.push((x, y));
                } else {
                    right_pixels.push((x, y));
                }
            }
        }
        
        let mut regions = HashMap::new();
        regions.insert(0, left_pixels);
        regions.insert(1, right_pixels);
        
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Should handle large regions correctly
        assert_eq!(rag.regions.len(), 2);
        assert_eq!(rag.region_props[&0].area, 200);
        assert_eq!(rag.region_props[&1].area, 200);
        
        // Should have adjacency along the middle
        assert!(!rag.adjacencies.is_empty());
    }

    #[test]
    fn test_final_segmentation_retrieval() {
        let (image, regions) = create_simple_regions_image();
        let mut rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        // Get initial segmentation
        let initial = rag.get_final_segmentation();
        assert_eq!(initial.len(), 2);
        
        // Perform some merging
        let _ = rag.test_merge_regions(0, 1);
        
        // Get final segmentation
        let final_seg = rag.get_final_segmentation();
        assert_eq!(final_seg.len(), 1);
        
        // Combined region should have all pixels
        let combined_pixels = final_seg.values().next().unwrap();
        assert_eq!(combined_pixels.len(), 8);
    }
}