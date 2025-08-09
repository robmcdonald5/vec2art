//! Region Adjacency Graph (RAG) for advanced segmentation

use crate::error::{VectorizeError, VectorizeResult};
use crate::preprocessing::{lab_distance, rgb_to_lab};
use image::{ImageBuffer, Rgba};
// rayon removed - using standard iteration instead
use std::collections::{HashMap, HashSet, BinaryHeap};
use std::cmp::Ordering;

/// Region Adjacency Graph structure
pub struct RegionAdjacencyGraph {
    /// Map from region ID to list of pixel coordinates
    pub regions: HashMap<usize, Vec<(u32, u32)>>,
    /// Adjacency information: (region1, region2) -> shared boundary length
    pub adjacencies: HashMap<(usize, usize), usize>,
    /// Region properties
    pub region_props: HashMap<usize, RegionProperties>,
}

/// Properties of a region
#[derive(Clone, Debug)]
pub struct RegionProperties {
    /// Mean color in LAB space
    pub mean_lab: (f32, f32, f32),
    /// Mean color in RGB
    pub mean_rgb: (u8, u8, u8),
    /// Area in pixels
    pub area: usize,
    /// Perimeter length
    pub perimeter: usize,
    /// Maximum gradient magnitude on boundary
    pub max_boundary_gradient: f32,
}

/// Edge weight for merging priority
#[derive(Clone, Debug)]
struct MergeCandidate {
    weight: f32,
    region1: usize,
    region2: usize,
}

impl PartialEq for MergeCandidate {
    fn eq(&self, other: &Self) -> bool {
        self.weight == other.weight
    }
}

impl Eq for MergeCandidate {}

impl PartialOrd for MergeCandidate {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        // Reverse order for min-heap behavior (smallest weight = highest priority)
        other.weight.partial_cmp(&self.weight)
    }
}

impl Ord for MergeCandidate {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

impl RegionAdjacencyGraph {
    /// Build RAG from initial segmentation
    pub fn from_segmentation(
        region_map: &HashMap<usize, Vec<(u32, u32)>>,
        image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> VectorizeResult<Self> {
        let mut adjacencies = HashMap::new();
        let mut region_props = HashMap::new();
        
        // Calculate region properties
        for (region_id, pixels) in region_map.iter() {
            let props = calculate_region_properties(pixels, image)?;
            region_props.insert(*region_id, props);
        }
        
        // Find adjacencies
        let (width, height) = image.dimensions();
        let mut pixel_to_region = HashMap::new();
        
        for (region_id, pixels) in region_map.iter() {
            for &(x, y) in pixels {
                pixel_to_region.insert((x, y), *region_id);
            }
        }
        
        // Check neighboring pixels to find adjacencies
        for (&(x, y), &region1) in pixel_to_region.iter() {
            let neighbors = [
                (x.wrapping_sub(1), y),
                (x + 1, y),
                (x, y.wrapping_sub(1)),
                (x, y + 1),
            ];
            
            for (nx, ny) in neighbors {
                if nx < width && ny < height {
                    if let Some(&region2) = pixel_to_region.get(&(nx, ny)) {
                        if region1 != region2 {
                            let key = if region1 < region2 {
                                (region1, region2)
                            } else {
                                (region2, region1)
                            };
                            *adjacencies.entry(key).or_insert(0) += 1;
                        }
                    }
                }
            }
        }
        
        Ok(RegionAdjacencyGraph {
            regions: region_map.clone(),
            adjacencies,
            region_props,
        })
    }
    
    /// Perform Felzenszwalb-style hierarchical merging
    pub fn felzenszwalb_merge(
        &mut self,
        k: f32,
        min_size: usize,
    ) -> VectorizeResult<()> {
        // Build priority queue of merge candidates
        let mut merge_queue = BinaryHeap::new();
        
        for (&(r1, r2), &boundary_length) in self.adjacencies.iter() {
            if let (Some(props1), Some(props2)) = 
                (self.region_props.get(&r1), self.region_props.get(&r2)) {
                
                let weight = calculate_merge_weight(
                    props1,
                    props2,
                    boundary_length,
                    k,
                );
                
                merge_queue.push(MergeCandidate {
                    weight,
                    region1: r1,
                    region2: r2,
                });
            }
        }
        
        // Process merges
        let mut merged_regions = HashSet::new();
        let mut region_mapping: HashMap<usize, usize> = HashMap::new();
        
        while let Some(candidate) = merge_queue.pop() {
            // Get actual regions after mapping
            let actual_r1 = find_root(&region_mapping, candidate.region1);
            let actual_r2 = find_root(&region_mapping, candidate.region2);
            
            if actual_r1 == actual_r2 {
                continue; // Already merged
            }
            
            // Check if regions are too small or merge is beneficial
            let props1 = &self.region_props[&actual_r1];
            let props2 = &self.region_props[&actual_r2];
            
            let should_merge = props1.area < min_size || 
                              props2.area < min_size ||
                              candidate.weight < calculate_internal_difference(props1, props2, k);
            
            if should_merge {
                // Perform merge
                let new_region_id = actual_r1.min(actual_r2);
                let old_region_id = actual_r1.max(actual_r2);
                
                region_mapping.insert(old_region_id, new_region_id);
                merged_regions.insert(old_region_id);
                
                // Update properties
                let merged_props = merge_region_properties(props1, props2);
                self.region_props.insert(new_region_id, merged_props);
                
                // Combine pixel lists
                if let Some(old_pixels) = self.regions.remove(&old_region_id) {
                    self.regions.get_mut(&new_region_id)
                        .unwrap()
                        .extend(old_pixels);
                }
            }
        }
        
        // Clean up adjacencies
        self.update_adjacencies_after_merge(&region_mapping)?;
        
        Ok(())
    }
    
    /// Update adjacencies after merging regions
    fn update_adjacencies_after_merge(
        &mut self,
        mapping: &HashMap<usize, usize>,
    ) -> VectorizeResult<()> {
        let mut new_adjacencies = HashMap::new();
        
        for (&(r1, r2), &length) in self.adjacencies.iter() {
            let new_r1 = find_root(mapping, r1);
            let new_r2 = find_root(mapping, r2);
            
            if new_r1 != new_r2 {
                let key = if new_r1 < new_r2 {
                    (new_r1, new_r2)
                } else {
                    (new_r2, new_r1)
                };
                *new_adjacencies.entry(key).or_insert(0) += length;
            }
        }
        
        self.adjacencies = new_adjacencies;
        Ok(())
    }
    
    /// Apply graph-based merging with custom predicate
    pub fn graph_merge_with_predicate<F>(
        &mut self,
        predicate: F,
        min_region_size: usize,
    ) -> VectorizeResult<()>
    where
        F: Fn(&RegionProperties, &RegionProperties, f32) -> bool,
    {
        let mut changed = true;
        let mut iteration = 0;
        let max_iterations = 100;
        
        while changed && iteration < max_iterations {
            changed = false;
            iteration += 1;
            
            let mut merges_to_perform = Vec::new();
            
            // Find regions to merge
            for (&(r1, r2), &_boundary_length) in self.adjacencies.iter() {
                if let (Some(props1), Some(props2)) = 
                    (self.region_props.get(&r1), self.region_props.get(&r2)) {
                    
                    // Calculate gradient across boundary
                    let boundary_gradient = (props1.max_boundary_gradient + 
                                            props2.max_boundary_gradient) / 2.0;
                    
                    // Check if regions should merge
                    if props1.area < min_region_size || 
                       props2.area < min_region_size ||
                       predicate(props1, props2, boundary_gradient) {
                        merges_to_perform.push((r1, r2));
                        changed = true;
                    }
                }
            }
            
            // Perform merges
            for (r1, r2) in merges_to_perform {
                self.merge_regions(r1, r2)?;
            }
        }
        
        log::debug!("Graph merge completed after {} iterations", iteration);
        Ok(())
    }
    
    /// Merge two regions
    fn merge_regions(&mut self, r1: usize, r2: usize) -> VectorizeResult<()> {
        let smaller = r1.max(r2);
        let larger = r1.min(r2);
        
        // Merge pixels
        if let Some(pixels) = self.regions.remove(&smaller) {
            self.regions.get_mut(&larger)
                .ok_or_else(|| VectorizeError::algorithm_error("Region not found"))?
                .extend(pixels);
        }
        
        // Merge properties
        if let (Some(props1), Some(props2)) = 
            (self.region_props.remove(&r1), self.region_props.remove(&r2)) {
            let merged = merge_region_properties(&props1, &props2);
            self.region_props.insert(larger, merged);
        }
        
        // Update adjacencies
        let mut new_adjacencies = HashMap::new();
        for (&(a, b), &length) in self.adjacencies.iter() {
            let new_a = if a == smaller { larger } else { a };
            let new_b = if b == smaller { larger } else { b };
            
            if new_a != new_b {
                let key = if new_a < new_b {
                    (new_a, new_b)
                } else {
                    (new_b, new_a)
                };
                *new_adjacencies.entry(key).or_insert(0) += length;
            }
        }
        self.adjacencies = new_adjacencies;
        
        Ok(())
    }
    
    /// Get final segmentation after merging
    pub fn get_final_segmentation(&self) -> HashMap<usize, Vec<(u32, u32)>> {
        self.regions.clone()
    }

    /// Test-specific method to access merge_regions
    #[cfg(test)]
    pub(crate) fn test_merge_regions(&mut self, r1: usize, r2: usize) -> VectorizeResult<()> {
        self.merge_regions(r1, r2)
    }
}

/// Calculate properties of a region
fn calculate_region_properties(
    pixels: &[(u32, u32)],
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
) -> VectorizeResult<RegionProperties> {
    if pixels.is_empty() {
        return Err(VectorizeError::algorithm_error("Empty region"));
    }
    
    let mut sum_r = 0.0;
    let mut sum_g = 0.0;
    let mut sum_b = 0.0;
    let mut sum_l = 0.0;
    let mut sum_a = 0.0;
    let mut sum_b_lab = 0.0;
    
    for &(x, y) in pixels {
        let pixel = image.get_pixel(x, y);
        sum_r += pixel[0] as f32;
        sum_g += pixel[1] as f32;
        sum_b += pixel[2] as f32;
        
        let (l, a, b) = rgb_to_lab(pixel[0], pixel[1], pixel[2]);
        sum_l += l;
        sum_a += a;
        sum_b_lab += b;
    }
    
    let count = pixels.len() as f32;
    let mean_rgb = (
        (sum_r / count) as u8,
        (sum_g / count) as u8,
        (sum_b / count) as u8,
    );
    let mean_lab = (
        sum_l / count,
        sum_a / count,
        sum_b_lab / count,
    );
    
    // Calculate perimeter (simplified - count boundary pixels)
    let pixel_set: HashSet<_> = pixels.iter().cloned().collect();
    let mut perimeter = 0;
    let (width, height) = image.dimensions();
    
    for &(x, y) in pixels {
        let neighbors = [
            (x.wrapping_sub(1), y),
            (x + 1, y),
            (x, y.wrapping_sub(1)),
            (x, y + 1),
        ];
        
        for (nx, ny) in neighbors {
            if nx >= width || ny >= height || !pixel_set.contains(&(nx, ny)) {
                perimeter += 1;
            }
        }
    }
    
    Ok(RegionProperties {
        mean_lab,
        mean_rgb,
        area: pixels.len(),
        perimeter,
        max_boundary_gradient: 0.0, // Will be calculated separately if needed
    })
}

/// Calculate merge weight for two regions
pub(crate) fn calculate_merge_weight(
    props1: &RegionProperties,
    props2: &RegionProperties,
    boundary_length: usize,
    k: f32,
) -> f32 {
    let color_distance = lab_distance(props1.mean_lab, props2.mean_lab);
    let size_factor = k / (props1.area.min(props2.area) as f32).sqrt();
    
    color_distance + size_factor - (boundary_length as f32).ln()
}

/// Calculate internal difference for Felzenszwalb predicate
fn calculate_internal_difference(
    props1: &RegionProperties,
    props2: &RegionProperties,
    k: f32,
) -> f32 {
    let int1 = k / (props1.area as f32).sqrt();
    let int2 = k / (props2.area as f32).sqrt();
    int1.min(int2)
}

/// Merge properties of two regions
pub(crate) fn merge_region_properties(
    props1: &RegionProperties,
    props2: &RegionProperties,
) -> RegionProperties {
    let total_area = props1.area + props2.area;
    let w1 = props1.area as f32 / total_area as f32;
    let w2 = props2.area as f32 / total_area as f32;
    
    RegionProperties {
        mean_lab: (
            props1.mean_lab.0 * w1 + props2.mean_lab.0 * w2,
            props1.mean_lab.1 * w1 + props2.mean_lab.1 * w2,
            props1.mean_lab.2 * w1 + props2.mean_lab.2 * w2,
        ),
        mean_rgb: (
            ((props1.mean_rgb.0 as f32 * w1 + props2.mean_rgb.0 as f32 * w2) as u8),
            ((props1.mean_rgb.1 as f32 * w1 + props2.mean_rgb.1 as f32 * w2) as u8),
            ((props1.mean_rgb.2 as f32 * w1 + props2.mean_rgb.2 as f32 * w2) as u8),
        ),
        area: total_area,
        perimeter: props1.perimeter + props2.perimeter, // Approximate
        max_boundary_gradient: props1.max_boundary_gradient.max(props2.max_boundary_gradient),
    }
}

/// Find root in union-find structure
fn find_root(mapping: &HashMap<usize, usize>, region: usize) -> usize {
    match mapping.get(&region) {
        Some(&parent) => find_root(mapping, parent),
        None => region,
    }
}

/// Create a simple delta-E based merge predicate
pub fn delta_e_predicate(threshold: f32) -> impl Fn(&RegionProperties, &RegionProperties, f32) -> bool {
    move |props1: &RegionProperties, props2: &RegionProperties, _gradient: f32| {
        lab_distance(props1.mean_lab, props2.mean_lab) < threshold
    }
}

/// Create a gradient-aware merge predicate
pub fn gradient_aware_predicate(
    color_threshold: f32,
    gradient_threshold: f32,
) -> impl Fn(&RegionProperties, &RegionProperties, f32) -> bool {
    move |props1: &RegionProperties, props2: &RegionProperties, gradient: f32| {
        let color_dist = lab_distance(props1.mean_lab, props2.mean_lab);
        
        // Strong edges resist merging
        if gradient > gradient_threshold {
            color_dist < color_threshold * 0.5
        } else {
            color_dist < color_threshold
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_rag_construction() {
        let mut regions = HashMap::new();
        regions.insert(0, vec![(0, 0), (0, 1), (1, 0), (1, 1)]);
        regions.insert(1, vec![(2, 0), (2, 1), (3, 0), (3, 1)]);
        
        let image = ImageBuffer::from_fn(4, 2, |x, _y| {
            if x < 2 {
                Rgba([255, 0, 0, 255])
            } else {
                Rgba([0, 255, 0, 255])
            }
        });
        
        let rag = RegionAdjacencyGraph::from_segmentation(&regions, &image).unwrap();
        
        assert_eq!(rag.regions.len(), 2);
        assert!(!rag.adjacencies.is_empty());
    }
    
    #[test]
    fn test_merge_predicate() {
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
        
        let predicate = delta_e_predicate(5.0);
        assert!(predicate(&props1, &props2, 0.1));
    }
}