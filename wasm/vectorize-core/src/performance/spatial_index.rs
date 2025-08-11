//! Spatial indexing for efficient proximity queries and collision detection
//!
//! This module provides optimized spatial data structures for fast neighbor
//! queries, collision detection, and spatial filtering operations used in
//! dot placement algorithms.

use crate::algorithms::dots::Dot;

/// High-performance spatial grid for dot collision detection
#[derive(Debug, Clone)]
pub struct SpatialGrid {
    /// 2D grid of dot indices
    grid: Vec<Vec<Vec<usize>>>,
    /// Cell size in pixels
    cell_size: f32,
    /// Grid dimensions
    grid_width: usize,
    grid_height: usize,
    /// Image dimensions
    image_width: u32,
    image_height: u32,
    /// Statistics for performance monitoring
    queries: u64,
    cache_hits: u64,
}

impl SpatialGrid {
    /// Create a new spatial grid optimized for the given image size and dot characteristics
    pub fn new(
        image_width: u32,
        image_height: u32,
        max_dot_radius: f32,
        spacing_factor: f32,
    ) -> Self {
        // Calculate optimal cell size based on maximum interaction distance
        let max_interaction_distance = max_dot_radius * spacing_factor * 2.0;
        let cell_size = max_interaction_distance.max(1.0);

        let grid_width = ((image_width as f32 / cell_size).ceil() as usize).max(1);
        let grid_height = ((image_height as f32 / cell_size).ceil() as usize).max(1);

        // Pre-allocate grid with reasonable capacity per cell
        let mut grid = Vec::with_capacity(grid_height);
        for _ in 0..grid_height {
            let mut row = Vec::with_capacity(grid_width);
            for _ in 0..grid_width {
                row.push(Vec::with_capacity(4)); // Expect ~4 dots per cell on average
            }
            grid.push(row);
        }

        Self {
            grid,
            cell_size,
            grid_width,
            grid_height,
            image_width,
            image_height,
            queries: 0,
            cache_hits: 0,
        }
    }

    /// Convert world coordinates to grid coordinates
    #[inline]
    fn world_to_grid(&self, x: f32, y: f32) -> (usize, usize) {
        let gx = ((x / self.cell_size) as usize).min(self.grid_width.saturating_sub(1));
        let gy = ((y / self.cell_size) as usize).min(self.grid_height.saturating_sub(1));
        (gx, gy)
    }

    /// Add a dot to the spatial grid
    pub fn add_dot(&mut self, dot_index: usize, x: f32, y: f32) {
        let (gx, gy) = self.world_to_grid(x, y);
        self.grid[gy][gx].push(dot_index);
    }

    /// Remove a dot from the spatial grid
    pub fn remove_dot(&mut self, dot_index: usize, x: f32, y: f32) -> bool {
        let (gx, gy) = self.world_to_grid(x, y);
        let cell = &mut self.grid[gy][gx];

        if let Some(pos) = cell.iter().position(|&idx| idx == dot_index) {
            cell.swap_remove(pos);
            true
        } else {
            false
        }
    }

    /// Check if a position is valid (no collision with existing dots)
    pub fn is_position_valid(
        &mut self,
        x: f32,
        y: f32,
        radius: f32,
        dots: &[Dot],
        spacing_factor: f32,
    ) -> bool {
        self.queries += 1;

        let min_distance = radius * spacing_factor;
        let (center_gx, center_gy) = self.world_to_grid(x, y);

        // Calculate search radius in grid cells
        let search_radius_cells = ((min_distance / self.cell_size).ceil() as usize).max(1);

        // Check surrounding cells within search radius
        let start_gx = center_gx.saturating_sub(search_radius_cells);
        let end_gx = (center_gx + search_radius_cells + 1).min(self.grid_width);
        let start_gy = center_gy.saturating_sub(search_radius_cells);
        let end_gy = (center_gy + search_radius_cells + 1).min(self.grid_height);

        for gy in start_gy..end_gy {
            for gx in start_gx..end_gx {
                for &dot_index in &self.grid[gy][gx] {
                    if dot_index < dots.len() {
                        let dot = &dots[dot_index];
                        if dot.distance_to(x, y) < min_distance {
                            return false;
                        }
                    }
                }
            }
        }

        true
    }

    /// Find all dots within a certain radius of a point
    pub fn find_dots_in_radius(&mut self, x: f32, y: f32, radius: f32, dots: &[Dot]) -> Vec<usize> {
        self.queries += 1;

        let mut result = Vec::new();
        let (center_gx, center_gy) = self.world_to_grid(x, y);

        // Calculate search radius in grid cells
        let search_radius_cells = ((radius / self.cell_size).ceil() as usize).max(1);

        let start_gx = center_gx.saturating_sub(search_radius_cells);
        let end_gx = (center_gx + search_radius_cells + 1).min(self.grid_width);
        let start_gy = center_gy.saturating_sub(search_radius_cells);
        let end_gy = (center_gy + search_radius_cells + 1).min(self.grid_height);

        for gy in start_gy..end_gy {
            for gx in start_gx..end_gx {
                for &dot_index in &self.grid[gy][gx] {
                    if dot_index < dots.len() {
                        let dot = &dots[dot_index];
                        if dot.distance_to(x, y) <= radius {
                            result.push(dot_index);
                        }
                    }
                }
            }
        }

        result
    }

    /// Get all dot indices in a specific grid cell
    pub fn get_cell_contents(&self, grid_x: usize, grid_y: usize) -> Option<&Vec<usize>> {
        if grid_x < self.grid_width && grid_y < self.grid_height {
            Some(&self.grid[grid_y][grid_x])
        } else {
            None
        }
    }

    /// Clear all dots from the grid
    pub fn clear(&mut self) {
        for row in &mut self.grid {
            for cell in row {
                cell.clear();
            }
        }
        self.queries = 0;
        self.cache_hits = 0;
    }

    /// Get grid statistics for performance analysis
    pub fn stats(&self) -> SpatialGridStats {
        let total_cells = self.grid_width * self.grid_height;
        let mut occupied_cells = 0;
        let mut total_dots = 0;
        let mut max_dots_per_cell = 0;
        let mut total_cell_capacity = 0;

        for row in &self.grid {
            for cell in row {
                total_cell_capacity += cell.capacity();
                if !cell.is_empty() {
                    occupied_cells += 1;
                    total_dots += cell.len();
                    max_dots_per_cell = max_dots_per_cell.max(cell.len());
                }
            }
        }

        let avg_dots_per_occupied_cell = if occupied_cells > 0 {
            total_dots as f32 / occupied_cells as f32
        } else {
            0.0
        };

        SpatialGridStats {
            total_cells,
            occupied_cells,
            occupancy_ratio: occupied_cells as f32 / total_cells as f32,
            total_dots,
            max_dots_per_cell,
            avg_dots_per_occupied_cell,
            cell_size: self.cell_size,
            grid_width: self.grid_width,
            grid_height: self.grid_height,
            queries: self.queries,
            memory_usage: total_cell_capacity * std::mem::size_of::<usize>(),
        }
    }

    /// Optimize grid memory usage by shrinking cell capacities
    pub fn shrink_to_fit(&mut self) {
        for row in &mut self.grid {
            for cell in row {
                cell.shrink_to_fit();
            }
        }
    }

    /// Rebuild grid with optimal parameters based on current dot distribution
    pub fn optimize_for_distribution(&mut self, dots: &[Dot]) {
        if dots.is_empty() {
            return;
        }

        // Analyze dot distribution to determine optimal cell size
        let mut min_distance = f32::INFINITY;
        for (i, dot1) in dots.iter().enumerate() {
            for dot2 in dots.iter().skip(i + 1) {
                let distance = dot1.distance_to(dot2.x, dot2.y);
                if distance > 0.0 && distance < min_distance {
                    min_distance = distance;
                }
            }
        }

        // Use minimum distance as basis for new cell size
        if min_distance.is_finite() && min_distance > 0.0 {
            let new_cell_size = min_distance * 0.5; // Half of minimum distance
            if (new_cell_size - self.cell_size).abs() > 0.1 {
                // Rebuild grid with new cell size
                let old_dots: Vec<(usize, f32, f32)> = self.get_all_dot_positions(dots);
                self.rebuild_with_cell_size(new_cell_size);

                // Re-add all dots
                for (index, x, y) in old_dots {
                    self.add_dot(index, x, y);
                }
            }
        }
    }

    /// Get positions of all dots currently in the grid
    fn get_all_dot_positions(&self, dots: &[Dot]) -> Vec<(usize, f32, f32)> {
        let mut positions = Vec::new();
        for (_gy, row) in self.grid.iter().enumerate() {
            for (_gx, cell) in row.iter().enumerate() {
                for &dot_index in cell {
                    if dot_index < dots.len() {
                        let dot = &dots[dot_index];
                        positions.push((dot_index, dot.x, dot.y));
                    }
                }
            }
        }
        positions
    }

    /// Rebuild grid with new cell size
    fn rebuild_with_cell_size(&mut self, new_cell_size: f32) {
        self.cell_size = new_cell_size;
        self.grid_width = ((self.image_width as f32 / new_cell_size).ceil() as usize).max(1);
        self.grid_height = ((self.image_height as f32 / new_cell_size).ceil() as usize).max(1);

        // Recreate grid
        self.grid = Vec::with_capacity(self.grid_height);
        for _ in 0..self.grid_height {
            let mut row = Vec::with_capacity(self.grid_width);
            for _ in 0..self.grid_width {
                row.push(Vec::with_capacity(4));
            }
            self.grid.push(row);
        }

        self.queries = 0;
        self.cache_hits = 0;
    }
}

/// Statistics for spatial grid performance analysis
#[derive(Debug, Clone)]
pub struct SpatialGridStats {
    pub total_cells: usize,
    pub occupied_cells: usize,
    pub occupancy_ratio: f32,
    pub total_dots: usize,
    pub max_dots_per_cell: usize,
    pub avg_dots_per_occupied_cell: f32,
    pub cell_size: f32,
    pub grid_width: usize,
    pub grid_height: usize,
    pub queries: u64,
    pub memory_usage: usize,
}

/// Quadtree implementation for hierarchical spatial indexing
#[derive(Debug, Clone)]
pub struct QuadTree {
    /// Bounding box
    bounds: BoundingBox,
    /// Maximum objects per node before subdividing
    max_objects: usize,
    /// Maximum depth to prevent infinite recursion
    max_depth: usize,
    /// Current depth of this node
    depth: usize,
    /// Objects in this node (only for leaf nodes)
    objects: Vec<(usize, f32, f32)>, // (dot_index, x, y)
    /// Child nodes (NW, NE, SW, SE)
    children: Option<Box<[QuadTree; 4]>>,
}

#[derive(Debug, Clone, Copy)]
struct BoundingBox {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

impl BoundingBox {
    fn contains(&self, x: f32, y: f32) -> bool {
        x >= self.x && x < self.x + self.width && y >= self.y && y < self.y + self.height
    }

    fn intersects_circle(&self, cx: f32, cy: f32, radius: f32) -> bool {
        let closest_x = cx.clamp(self.x, self.x + self.width);
        let closest_y = cy.clamp(self.y, self.y + self.height);
        let dx = cx - closest_x;
        let dy = cy - closest_y;
        (dx * dx + dy * dy) <= (radius * radius)
    }
}

impl QuadTree {
    /// Create a new quadtree
    pub fn new(
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        max_objects: usize,
        max_depth: usize,
    ) -> Self {
        Self {
            bounds: BoundingBox {
                x,
                y,
                width,
                height,
            },
            max_objects,
            max_depth,
            depth: 0,
            objects: Vec::new(),
            children: None,
        }
    }

    /// Insert a dot into the quadtree
    pub fn insert(&mut self, dot_index: usize, x: f32, y: f32) -> bool {
        if !self.bounds.contains(x, y) {
            return false;
        }

        // If we have children, insert into appropriate child
        if let Some(ref mut children) = self.children {
            for child in children.iter_mut() {
                if child.insert(dot_index, x, y) {
                    return true;
                }
            }
            return false;
        }

        // Add to this node
        self.objects.push((dot_index, x, y));

        // Check if we need to subdivide
        if self.objects.len() > self.max_objects && self.depth < self.max_depth {
            self.subdivide();

            // Move objects to children
            let mut remaining_objects = Vec::new();
            for (idx, obj_x, obj_y) in self.objects.drain(..) {
                let mut inserted = false;
                if let Some(ref mut children) = self.children {
                    for child in children.iter_mut() {
                        if child.insert(idx, obj_x, obj_y) {
                            inserted = true;
                            break;
                        }
                    }
                }
                if !inserted {
                    remaining_objects.push((idx, obj_x, obj_y));
                }
            }
            self.objects = remaining_objects;
        }

        true
    }

    /// Subdivide the quadtree node
    fn subdivide(&mut self) {
        let half_width = self.bounds.width / 2.0;
        let half_height = self.bounds.height / 2.0;

        let nw = QuadTree {
            bounds: BoundingBox {
                x: self.bounds.x,
                y: self.bounds.y,
                width: half_width,
                height: half_height,
            },
            max_objects: self.max_objects,
            max_depth: self.max_depth,
            depth: self.depth + 1,
            objects: Vec::new(),
            children: None,
        };

        let ne = QuadTree {
            bounds: BoundingBox {
                x: self.bounds.x + half_width,
                y: self.bounds.y,
                width: half_width,
                height: half_height,
            },
            max_objects: self.max_objects,
            max_depth: self.max_depth,
            depth: self.depth + 1,
            objects: Vec::new(),
            children: None,
        };

        let sw = QuadTree {
            bounds: BoundingBox {
                x: self.bounds.x,
                y: self.bounds.y + half_height,
                width: half_width,
                height: half_height,
            },
            max_objects: self.max_objects,
            max_depth: self.max_depth,
            depth: self.depth + 1,
            objects: Vec::new(),
            children: None,
        };

        let se = QuadTree {
            bounds: BoundingBox {
                x: self.bounds.x + half_width,
                y: self.bounds.y + half_height,
                width: half_width,
                height: half_height,
            },
            max_objects: self.max_objects,
            max_depth: self.max_depth,
            depth: self.depth + 1,
            objects: Vec::new(),
            children: None,
        };

        self.children = Some(Box::new([nw, ne, sw, se]));
    }

    /// Query for all dots within a radius
    pub fn query_radius(&self, cx: f32, cy: f32, radius: f32, result: &mut Vec<usize>) {
        if !self.bounds.intersects_circle(cx, cy, radius) {
            return;
        }

        // Check objects in this node
        for &(dot_index, x, y) in &self.objects {
            let dx = cx - x;
            let dy = cy - y;
            if (dx * dx + dy * dy) <= (radius * radius) {
                result.push(dot_index);
            }
        }

        // Query children
        if let Some(ref children) = self.children {
            for child in children.iter() {
                child.query_radius(cx, cy, radius, result);
            }
        }
    }

    /// Clear all objects from the quadtree
    pub fn clear(&mut self) {
        self.objects.clear();
        self.children = None;
    }

    /// Get total number of objects in the tree
    pub fn count(&self) -> usize {
        let mut count = self.objects.len();
        if let Some(ref children) = self.children {
            for child in children.iter() {
                count += child.count();
            }
        }
        count
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_dots(count: usize) -> Vec<Dot> {
        (0..count)
            .map(|i| {
                Dot::new(
                    (i % 10) as f32 * 10.0,
                    (i / 10) as f32 * 10.0,
                    2.0,
                    1.0,
                    "#000000".to_string(),
                )
            })
            .collect()
    }

    #[test]
    fn test_spatial_grid_creation() {
        let grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let stats = grid.stats();

        assert!(stats.total_cells > 0);
        assert_eq!(stats.occupied_cells, 0); // Initially empty
        assert_eq!(stats.total_dots, 0);
    }

    #[test]
    fn test_spatial_grid_add_dot() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(1);

        grid.add_dot(0, dots[0].x, dots[0].y);

        let stats = grid.stats();
        assert_eq!(stats.total_dots, 1);
        assert_eq!(stats.occupied_cells, 1);
    }

    #[test]
    fn test_spatial_grid_collision_detection() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(5);

        // Add first dot
        grid.add_dot(0, dots[0].x, dots[0].y);

        // Test collision - should return false for nearby position
        let is_valid = grid.is_position_valid(dots[0].x + 1.0, dots[0].y + 1.0, 2.0, &dots, 2.0);
        assert!(!is_valid);

        // Test no collision - should return true for distant position
        let is_valid = grid.is_position_valid(dots[0].x + 50.0, dots[0].y + 50.0, 2.0, &dots, 2.0);
        assert!(is_valid);
    }

    #[test]
    fn test_spatial_grid_radius_query() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(10);

        // Add several dots
        for (i, dot) in dots.iter().enumerate() {
            grid.add_dot(i, dot.x, dot.y);
        }

        // Query for dots near the first dot
        let nearby = grid.find_dots_in_radius(dots[0].x, dots[0].y, 15.0, &dots);

        assert!(!nearby.is_empty());
        assert!(nearby.contains(&0)); // Should include the dot itself
    }

    #[test]
    fn test_spatial_grid_remove_dot() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(1);

        grid.add_dot(0, dots[0].x, dots[0].y);
        assert_eq!(grid.stats().total_dots, 1);

        let removed = grid.remove_dot(0, dots[0].x, dots[0].y);
        assert!(removed);
        assert_eq!(grid.stats().total_dots, 0);
    }

    #[test]
    fn test_spatial_grid_world_to_grid_coordinates() {
        let grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let cell_size = grid.cell_size;

        // Test coordinate conversion
        let (gx, gy) = grid.world_to_grid(50.0, 50.0);
        let expected_gx = (50.0 / cell_size) as usize;
        let expected_gy = (50.0 / cell_size) as usize;

        assert_eq!(gx, expected_gx.min(grid.grid_width - 1));
        assert_eq!(gy, expected_gy.min(grid.grid_height - 1));
    }

    #[test]
    fn test_spatial_grid_optimization() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(5);

        // Add dots and optimize
        for (i, dot) in dots.iter().enumerate() {
            grid.add_dot(i, dot.x, dot.y);
        }

        grid.optimize_for_distribution(&dots);

        // Should still contain all dots
        assert_eq!(grid.stats().total_dots, 5);
    }

    #[test]
    fn test_quadtree_creation() {
        let tree = QuadTree::new(0.0, 0.0, 100.0, 100.0, 10, 5);
        assert_eq!(tree.count(), 0);
    }

    #[test]
    fn test_quadtree_insertion() {
        let mut tree = QuadTree::new(0.0, 0.0, 100.0, 100.0, 10, 5);

        assert!(tree.insert(0, 50.0, 50.0));
        assert!(tree.insert(1, 25.0, 25.0));
        assert!(!tree.insert(2, 150.0, 150.0)); // Outside bounds

        assert_eq!(tree.count(), 2);
    }

    #[test]
    fn test_quadtree_query_radius() {
        let mut tree = QuadTree::new(0.0, 0.0, 100.0, 100.0, 10, 5);

        // Insert test points
        tree.insert(0, 50.0, 50.0);
        tree.insert(1, 55.0, 55.0);
        tree.insert(2, 25.0, 25.0);

        let mut result = Vec::new();
        tree.query_radius(50.0, 50.0, 10.0, &mut result);

        assert!(result.contains(&0)); // Center point
        assert!(result.contains(&1)); // Nearby point
        assert!(!result.contains(&2)); // Distant point
    }

    #[test]
    fn test_quadtree_subdivision() {
        let mut tree = QuadTree::new(0.0, 0.0, 100.0, 100.0, 2, 5); // Low max_objects

        // Insert enough points to trigger subdivision
        for i in 0..5 {
            tree.insert(i, (i as f32) * 10.0, (i as f32) * 10.0);
        }

        assert_eq!(tree.count(), 5);
        // After subdivision, should have children
        assert!(tree.children.is_some());
    }

    #[test]
    fn test_spatial_grid_performance_stats() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(20);

        // Add dots
        for (i, dot) in dots.iter().enumerate() {
            grid.add_dot(i, dot.x, dot.y);
        }

        // Perform some queries
        for _ in 0..10 {
            let _ = grid.is_position_valid(50.0, 50.0, 2.0, &dots, 2.0);
        }

        let stats = grid.stats();
        assert_eq!(stats.queries, 10);
        assert!(stats.occupancy_ratio > 0.0);
        assert!(stats.memory_usage > 0);
    }

    #[test]
    fn test_spatial_grid_clear() {
        let mut grid = SpatialGrid::new(100, 100, 3.0, 2.0);
        let dots = create_test_dots(5);

        for (i, dot) in dots.iter().enumerate() {
            grid.add_dot(i, dot.x, dot.y);
        }

        assert_eq!(grid.stats().total_dots, 5);

        grid.clear();
        let stats = grid.stats();
        assert_eq!(stats.total_dots, 0);
        assert_eq!(stats.occupied_cells, 0);
        assert_eq!(stats.queries, 0);
    }
}
