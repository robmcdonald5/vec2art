# Superpixel Segmentation Algorithms for vec2art Project

## Executive Summary

**Recommended Algorithm: SLIC (Simple Linear Iterative Clustering)** for the vec2art superpixel backend due to its excellent balance of performance, quality, and artistic control. SLIC provides compact, visually uniform regions ideal for creating stylized, cell-shaded artistic effects that complement the existing edge and dot backends.

## 1. SLIC (Simple Linear Iterative Clustering)

### Algorithm Overview

SLIC clusters pixels in five-dimensional [L,a,b,x,y] space, combining CIELAB color similarity with spatial proximity to create compact, nearly uniform superpixels.

**Core Features:**

- **Color Space**: CIELAB for perceptually uniform color distances
- **Distance Metric**: `Ds = dlab + (m/S) * dxy` where m controls compactness
- **Spatial Constraint**: Each superpixel center only considers pixels within 2S×2S area
- **Initialization**: Regular grid with gradient-based refinement to avoid edges

### Advantages for Artistic Vectorization

✅ **Controllable compactness** - Parameter m (1-20) controls region regularity  
✅ **Predictable region sizes** - Regular grid initialization ensures consistency  
✅ **Fast convergence** - Typically 2-10 iterations for stable results  
✅ **Edge awareness** - Initialization avoids placing centers on edges  
✅ **Artistic flexibility** - Can create both organic and geometric styles

### Performance Characteristics

- **Complexity**: O(N) per iteration, ~5-10 iterations typical
- **Speed**: 50-100ms for 1080p images on modern hardware
- **Memory**: Efficient with local neighborhood processing
- **Scalability**: Excellent for large images due to spatial constraints

### Implementation Approach

```rust
pub struct SlicConfig {
    pub k: u32,              // Desired number of superpixels
    pub m: f32,              // Compactness parameter (1-20)
    pub max_iterations: u32, // Usually 10 is sufficient
    pub enforce_connectivity: bool,
}

pub struct SlicSuperpixels {
    pub labels: Vec<u32>,    // Label per pixel
    pub centers: Vec<SlicCenter>, // Final cluster centers
    pub boundaries: Vec<Vec<Point>>, // Boundary contours
}

pub struct SlicCenter {
    pub l: f32, pub a: f32, pub b: f32, // CIELAB color
    pub x: f32, pub y: f32,             // Spatial position
    pub pixel_count: u32,
}
```

## 2. SEEDS (Superpixels Extracted via Energy-Driven Sampling)

### Algorithm Overview

SEEDS uses energy minimization through hill-climbing optimization, starting from initial blocks and iteratively refining boundaries based on color histogram similarity.

**Core Features:**

- **Hierarchical approach**: Starts with blocks, refines to pixels
- **Energy function**: Based on color histogram similarity
- **Boundary term**: Optional smoothness constraint
- **Real-time performance**: Designed for CPU real-time processing

### Advantages for Artistic Vectorization

✅ **Excellent boundary adherence** - Strong edge preservation  
✅ **Real-time performance** - Optimized for speed  
✅ **Smooth boundaries** - Optional boundary term for aesthetic control  
⚠️ **Complex parameter tuning** - Multiple interdependent parameters  
⚠️ **Less predictable regions** - Adaptive sizing can create irregular patterns

### Performance Characteristics

- **Speed**: Real-time on single CPU (2.8GHz Intel i7)
- **Memory**: Hierarchical structure requires additional storage
- **Quality**: Excellent boundary adherence, comparable to state-of-art
- **Determinism**: Hill-climbing can produce slightly different results

## 3. Watershed Segmentation

### Algorithm Overview

Watershed treats the image as topographic surface, flooding from local minima to create regions separated by watershed lines (boundaries).

**Core Features:**

- **Gradient-based**: Works on gradient magnitude images
- **Morphological**: Uses mathematical morphology principles
- **Marker-controlled**: Can use markers to control segmentation
- **Over-segmentation prone**: Tends to create many small regions

### Advantages for Artistic Vectorization

✅ **Precise boundaries** - Excellent edge detection and preservation  
✅ **Morphological control** - Rich set of preprocessing options  
⚠️ **Over-segmentation** - Requires careful preprocessing or post-merge  
⚠️ **Noise sensitivity** - Gradient-based approach amplifies noise  
⚠️ **Complex post-processing** - Region merging adds complexity

### Suitability Assessment

**Not recommended** for vec2art due to over-segmentation issues and complex post-processing requirements that would compromise the project's <1.5s performance target.

## 4. Existing Rust Libraries

### fast-slic-rust ⭐ **RECOMMENDED**

```rust
// Available at: https://github.com/ondrasouk/fast-slic-rust
// Performance: 1.6-1.8x speedup over C++ implementation on AMD Ryzen 9 5850X

use fast_slic::*;

let image = LABImage::from_srgb(img.as_slice(), width, height);
let mut config = Config::default();
config.subsample_stride = 5; // Performance optimization
let mut clusters = Clusters::initialize_clusters(&image, &config);
iterate(&image, &config, &mut clusters);
```

**Pros:**

- Mature Rust implementation with proven performance
- Direct SLIC algorithm with optimizations
- MIT licensed, suitable for commercial use
- Active development and optimization

**Cons:**

- Not explicitly WASM-tested (requires verification)
- Uses `unsafe` code and Rayon (potential WASM compatibility issues)
- API may change in future versions

### graph-based-image-segmentation

**Not recommended** - Reference implementation focused on research rather than performance or artistic applications.

### Photon

**No superpixel support** - High-performance WASM image processing library but lacks superpixel algorithms.

## 5. Integration Strategy

### Architecture Integration

The superpixel backend fits naturally into the existing `trace_low.rs` architecture:

```rust
fn trace_superpixel(
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    thresholds: &ThresholdMapping,
    config: &TraceLowConfig,
) -> Result<Vec<SvgPath>, VectorizeError> {
    // 1. Convert RGBA to CIELAB
    let lab_image = convert_rgba_to_lab(image)?;

    // 2. Run SLIC segmentation
    let slic_config = SlicConfig {
        k: calculate_k_from_cell_size(thresholds.slic_cell_size_px, image),
        m: thresholds.slic_compactness,
        max_iterations: thresholds.slic_iterations,
        enforce_connectivity: true,
    };
    let superpixels = slic_segment(&lab_image, &slic_config)?;

    // 3. Merge similar regions in LAB space
    let merged_regions = merge_similar_regions(
        &superpixels,
        thresholds.lab_merge_threshold
    )?;

    // 4. Extract and simplify boundaries
    let region_paths = extract_region_contours(&merged_regions, image)?;
    let simplified_paths = simplify_region_paths(region_paths, thresholds)?;

    // 5. Generate filled SVG paths
    let svg_paths = create_filled_region_paths(simplified_paths, &merged_regions)?;

    Ok(svg_paths)
}
```

### Parameter Integration

Current `ThresholdMapping` already includes superpixel parameters:

- `slic_cell_size_px`: Controls region size (600-3000px based on detail)
- `slic_iterations`: Fixed at reasonable value (10)
- `slic_compactness`: Derived from detail parameter
- `lab_merge_threshold`: Color similarity for region merging
- `lab_split_threshold`: Future use for adaptive refinement

### Performance Budget Integration

```rust
impl ProcessingBudget {
    pub fn allocate_superpixel_time(&self, image_size: (u32, u32)) -> u64 {
        // Allocate 60-80% of budget to SLIC, 20-40% to post-processing
        let total_pixels = image_size.0 * image_size.1;
        let base_time = (total_pixels as f64 * 0.00008).min(800.0); // ~80ms per megapixel
        (base_time as u64).min(self.total_budget_ms * 3 / 4)
    }
}
```

## 6. Implementation Code Snippets

### SLIC Implementation Core

```rust
use nalgebra::{Vector3, Vector2};

pub struct SlicSegmenter {
    width: u32,
    height: u32,
    k: u32,
    m: f32,
    labels: Vec<u32>,
    centers: Vec<SlicCenter>,
    distances: Vec<f32>,
}

impl SlicSegmenter {
    pub fn new(width: u32, height: u32, k: u32, m: f32) -> Self {
        let s = ((width * height) as f32 / k as f32).sqrt();
        let centers = Self::initialize_centers(width, height, k, s);

        Self {
            width, height, k, m,
            labels: vec![0; (width * height) as usize],
            centers,
            distances: vec![f32::MAX; (width * height) as usize],
        }
    }

    fn initialize_centers(width: u32, height: u32, k: u32, s: f32) -> Vec<SlicCenter> {
        let mut centers = Vec::new();
        let grid_size = (k as f32).sqrt().ceil() as u32;

        for i in 0..grid_size {
            for j in 0..grid_size {
                if centers.len() >= k as usize { break; }

                let x = (j as f32 + 0.5) * s;
                let y = (i as f32 + 0.5) * s;

                if x < width as f32 && y < height as f32 {
                    centers.push(SlicCenter {
                        l: 0.0, a: 0.0, b: 0.0, // Will be set from image
                        x, y, pixel_count: 0,
                    });
                }
            }
        }
        centers
    }

    pub fn segment(&mut self, lab_image: &LabImage) -> Result<(), VectorizeError> {
        // Refine initial centers to avoid edges
        self.refine_centers_to_low_gradient(lab_image)?;

        for iteration in 0..10 {
            // Assignment step: assign pixels to nearest centers
            self.assign_pixels(lab_image)?;

            // Update step: recalculate centers
            if !self.update_centers(lab_image)? {
                log::debug!("SLIC converged after {} iterations", iteration + 1);
                break;
            }
        }

        // Post-process: enforce connectivity
        if self.enforce_connectivity {
            self.enforce_connectivity(lab_image)?;
        }

        Ok(())
    }

    fn compute_distance(&self, lab1: &Vector3<f32>, xy1: &Vector2<f32>,
                       lab2: &Vector3<f32>, xy2: &Vector2<f32>, s: f32) -> f32 {
        let dlab = (lab1 - lab2).norm();
        let dxy = (xy1 - xy2).norm();
        dlab + (self.m / s) * dxy
    }
}
```

### Color Space Conversion

```rust
pub fn rgba_to_lab(rgba: &[u8; 4]) -> Vector3<f32> {
    // Convert RGBA → sRGB → XYZ → LAB
    let r = rgba[0] as f32 / 255.0;
    let g = rgba[1] as f32 / 255.0;
    let b = rgba[2] as f32 / 255.0;

    // sRGB → Linear RGB (gamma correction)
    let to_linear = |c: f32| {
        if c <= 0.04045 {
            c / 12.92
        } else {
            ((c + 0.055) / 1.055).powf(2.4)
        }
    };

    let r = to_linear(r);
    let g = to_linear(g);
    let b = to_linear(b);

    // Linear RGB → XYZ (D65 illuminant)
    let x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
    let y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
    let z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

    // XYZ → LAB
    xyz_to_lab(Vector3::new(x, y, z))
}

fn xyz_to_lab(xyz: Vector3<f32>) -> Vector3<f32> {
    const XN: f32 = 0.95047; // D65 illuminant
    const YN: f32 = 1.0;
    const ZN: f32 = 1.08883;

    let fx = lab_f(xyz.x / XN);
    let fy = lab_f(xyz.y / YN);
    let fz = lab_f(xyz.z / ZN);

    let l = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b = 200.0 * (fy - fz);

    Vector3::new(l, a, b)
}

fn lab_f(t: f32) -> f32 {
    const DELTA: f32 = 6.0 / 29.0;
    if t > DELTA * DELTA * DELTA {
        t.cbrt()
    } else {
        t / (3.0 * DELTA * DELTA) + 4.0 / 29.0
    }
}
```

### Boundary Extraction and SVG Generation

```rust
pub fn extract_superpixel_boundaries(
    labels: &[u32],
    width: u32,
    height: u32
) -> Vec<Vec<Point>> {
    let mut boundaries = Vec::new();
    let processed_labels = std::collections::HashSet::new();

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;
            let label = labels[idx];

            if processed_labels.contains(&label) {
                continue;
            }

            // Find boundary using Moore neighborhood tracing
            if let Some(boundary) = trace_region_boundary(labels, width, height, x, y, label) {
                boundaries.push(boundary);
                processed_labels.insert(label);
            }
        }
    }

    boundaries
}

pub fn create_filled_region_paths(
    boundaries: Vec<Vec<Point>>,
    regions: &MergedRegions,
) -> Vec<SvgPath> {
    boundaries.into_iter().enumerate().map(|(i, boundary)| {
        let path_data = points_to_svg_path_data(&boundary, true); // closed path
        let fill_color = regions.get_region_color(i);

        SvgPath {
            data: path_data,
            fill: fill_color,
            stroke: "none".to_string(),
            stroke_width: 0.0,
            element_type: SvgElementType::Path,
        }
    }).collect()
}
```

## 7. Performance Estimates

### Processing Time Breakdown (1080p image)

- **SLIC Segmentation**: 40-60ms (depends on K and iterations)
- **Region Merging**: 10-15ms (LAB color comparisons)
- **Boundary Extraction**: 15-25ms (contour tracing)
- **Path Simplification**: 10-20ms (Douglas-Peucker)
- **SVG Generation**: 5-10ms (path data creation)
- **Total Estimated**: 80-130ms for 1080p

### Scaling Characteristics

- **Linear with pixel count**: O(N) per iteration
- **Sub-linear with region count**: Fewer regions = faster processing
- **Memory efficiency**: Local processing minimizes allocations
- **WASM overhead**: Estimated 20-30% performance penalty

### Quality vs Performance Trade-offs

```rust
// Performance-optimized preset
SlicConfig {
    k: (total_pixels / 2000).max(50), // Larger regions
    m: 15.0,                          // More compact
    max_iterations: 5,                // Fewer iterations
    enforce_connectivity: false,      // Skip post-processing
}

// Quality-optimized preset
SlicConfig {
    k: (total_pixels / 800).max(100), // Smaller regions
    m: 8.0,                           // More flexible shapes
    max_iterations: 10,               // Full convergence
    enforce_connectivity: true,       // Clean regions
}
```

## 8. Artistic Effects and Stylization

### Cell-Shaded Animation Style

**Effect**: Large, flat color regions with clean boundaries, similar to cartoon/anime aesthetics.

**Configuration**:

- Low detail parameter (0.1-0.3) → Large superpixels
- High compactness (m=15-20) → Regular, geometric regions
- Aggressive color merging → Reduced color palette
- Optional stroke borders → Comic book style outlines

### Stained Glass Effect

**Effect**: Irregular, organic regions with strong color separation.

**Configuration**:

- Medium detail parameter (0.4-0.6) → Moderate region size
- Low compactness (m=3-8) → More organic boundaries
- Selective color merging → Preserve color variation
- Thick stroke borders → Lead came effect

### Watercolor Regions

**Effect**: Soft, flowing regions that follow natural image structure.

**Configuration**:

- High detail parameter (0.7-0.9) → Smaller, adaptive regions
- Low compactness (m=1-5) → Boundary follows edges
- Minimal color merging → Preserve gradations
- No stroke borders → Seamless color flow

### Integration with Existing Backends

The superpixel backend creates **complementary artistic effects**:

| Backend        | Effect Style           | Use Case                            |
| -------------- | ---------------------- | ----------------------------------- |
| **Edge**       | Line art, sketching    | Architectural, technical drawings   |
| **Dots**       | Stippling, pointillism | Texture, organic details            |
| **Superpixel** | Cell shading, regions  | Animation, flat color illustrations |
| **Centerline** | Engraving, hatching    | Traditional illustration techniques |

## 9. WASM Compatibility Assessment

### Current Compatibility Status

- **fast-slic-rust**: ⚠️ **Needs verification** - Uses Rayon and unsafe code
- **Color space conversion**: ✅ **Compatible** - Pure mathematical functions
- **Boundary extraction**: ✅ **Compatible** - Standard algorithms
- **Memory management**: ✅ **Compatible** - Standard Vec allocations

### WASM Adaptation Strategy

```rust
// WASM-compatible configuration
#[cfg(target_arch = "wasm32")]
pub fn create_wasm_slic_config() -> SlicConfig {
    SlicConfig {
        // Use single-threaded processing in WASM
        enable_parallel_processing: false,
        // Reduce memory allocations
        max_iterations: 8,
        // Optimize for browser constraints
        memory_optimization: true,
    }
}

#[cfg(not(target_arch = "wasm32"))]
pub fn create_native_slic_config() -> SlicConfig {
    SlicConfig {
        enable_parallel_processing: true,
        max_iterations: 10,
        memory_optimization: false,
    }
}
```

### Recommended Implementation Path

1. **Phase 1**: Implement pure Rust SLIC without external dependencies
2. **Phase 2**: Add fast-slic-rust integration for native performance
3. **Phase 3**: WASM-specific optimizations and testing
4. **Phase 4**: Performance benchmarking and parameter tuning

## 10. Conclusion

**SLIC superpixel segmentation** provides an excellent foundation for the vec2art superpixel backend, offering:

✅ **Artistic Control**: Predictable, stylistically flexible region generation  
✅ **Performance**: Achieves <1.5s target with room for optimization  
✅ **Integration**: Natural fit with existing trace_low.rs architecture  
✅ **Complementary Effects**: Creates distinct artistic style from edge/dot backends  
✅ **Implementation Path**: Clear development roadmap with existing Rust libraries

The superpixel backend will enable **region-based artistic vectorization**, creating cell-shaded, watercolor, and stained-glass effects that significantly expand vec2art's artistic capabilities while maintaining the project's performance and quality standards.
