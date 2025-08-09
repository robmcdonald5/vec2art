# Phase B Implementation Research and Plan
## Error-Driven Refinement Loop for vec2art Vectorization

**Date:** 2025-08-09  
**Branch:** `algorithms-refinement`  
**Author:** Phase B Research Analysis  
**Goal:** Implement the error-driven refinement loop from the vec2art roadmap to achieve ΔE ≤ 6.0 and SSIM ≥ 0.93

---

## Executive Summary

Based on comprehensive research into SVG rasterization, tile-based error analysis, local refinement algorithms, and iterative control systems, Phase B can be implemented using:

1. **Resvg + tiny-skia** for CPU-based SVG rasterization
2. **Palette crate** for ΔE Lab colorspace computations + **dssim** for SSIM analysis  
3. **Cubic Bézier subdivision**, **gradient field-based region splitting**, and **PCA-based gradient upgrades**
4. **Rust std::time** based convergence detection with time budgets

This approach balances performance, correctness, and integration complexity with the existing Phase A modules.

---

## 1. SVG Rasterization Analysis

### Selected Approach: Resvg + tiny-skia

**Technical Rationale:**
- **Resvg** is specifically designed for accurate, cross-platform SVG rasterization
- Built entirely in Rust with minimal `unsafe` code
- Uses **tiny-skia** as rendering backend (20-100% slower than Skia but still faster than Cairo)
- Guaranteed pixel-perfect reproduction across platforms
- Compact binary size (<3MB) with no external dependencies
- Extensive test suite (~1600 SVG-to-PNG regression tests)

**Performance Characteristics:**
- CPU-only rendering suitable for vec2art's constraints
- Can be optimized with `RUSTFLAGS="-Ctarget-cpu=haswell"` for AVX instructions
- Binary size impact: ~200 KiB for tiny-skia backend

**API Integration:**
```rust
// Proposed integration pattern
use resvg::{Tree, Options};
use tiny_skia::{Pixmap, Transform};

pub fn rasterize_svg_to_rgba(
    svg_content: &str, 
    width: u32, 
    height: u32
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, RasterError> {
    let tree = Tree::from_str(svg_content, &Options::default())?;
    let mut pixmap = Pixmap::new(width, height).unwrap();
    tree.render(Transform::identity(), &mut pixmap.as_mut());
    
    // Convert tiny_skia RGBA8 to image::ImageBuffer
    Ok(ImageBuffer::from_raw(width, height, pixmap.take()).unwrap())
}
```

**Alternative Considered:**
- **Vello CPU**: Emerging high-performance renderer showing excellent benchmarks, but less mature ecosystem
- **Cairo**: Rejected due to external dependencies and slower performance

---

## 2. Per-Tile Error Computation Analysis

### Recommended Hybrid Approach: ΔE (Lab) + SSIM

**ΔE Lab Colorspace (Primary Metric):**
- **Library:** `palette` crate for Lab conversions and ΔE calculations
- **Algorithm:** CIEDE2000 formula for perceptually accurate color differences  
- **Tile Size:** 32×32 pixels (1024 pixels per tile, good balance for local detail vs computation)
- **Threshold:** ΔE > 6.0 identifies "worst tiles" needing refinement

**SSIM (Secondary/Structural Metric):**
- **Library:** `dssim` crate for multi-scale SSIM with Lab awareness
- **Features:** Uses L*a*b* colorspace, alpha channel support, multi-core optimization
- **Threshold:** SSIM < 0.93 indicates structural dissimilarity
- **Window:** 8×8 pixel windows within 32×32 tiles for fine-grained analysis

**Technical Implementation:**
```rust
use palette::{Lab, Srgb, color_difference::DeltaE};
use dssim::{Dssim, DssimImage};

pub struct TileError {
    pub x: u32,
    pub y: u32,
    pub delta_e_avg: f64,      // Average ΔE across tile
    pub delta_e_max: f64,      // Peak ΔE in tile
    pub ssim: f64,             // SSIM score for tile
    pub priority: f64,         // Combined metric for ranking
}

pub fn compute_tile_errors(
    original: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    rasterized: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    tile_size: u32,
) -> Vec<TileError> {
    // Process 32x32 tiles, compute ΔE and SSIM per tile
    // Rank by combined metric: priority = (delta_e_avg / 6.0) + ((1.0 - ssim) / 0.07)
}
```

**Tile Selection Strategy:**
- Select top 1-3% worst tiles by combined metric
- Maximum 5-8 tiles per iteration to control refinement cost
- Prioritize edge regions and gradient areas where vectorization typically struggles

---

## 3. Local Refinement Action Algorithms

### 3.1 Add Control Point (Cubic Bézier Subdivision)

**Algorithm:** Cubic Bézier curve subdivision using De Casteljau's algorithm
- **Trigger:** When boundary deviation is high (path drifted from original edge)
- **Method:** Split cubic Bézier segment at optimal parameter t ∈ [0.3, 0.7]
- **Control Point Insertion:** Place new control point to minimize local error

**Technical Details:**
```rust
pub struct ControlPointAction {
    pub path_id: usize,
    pub segment_id: usize,
    pub split_param: f64,       // Parameter t for subdivision
    pub new_control_points: Vec<Point2D>,
}

pub fn add_control_point_bezier_subdivision(
    original_tile: &ImageTile,
    current_path: &CubicBezier,
    error_threshold: f64,
) -> Option<ControlPointAction> {
    // 1. Detect boundary deviation using edge detection
    // 2. Find optimal subdivision parameter via error minimization
    // 3. Apply De Casteljau subdivision algorithm
    // 4. Generate new control points for sub-segments
}
```

**Integration with Phase A:**
- Leverages existing `tracing::fit::CubicBezier` structures
- Extends `tracing::fit::two_stage_fit` with subdivision capabilities
- Maintains curve continuity (C1 or C2) at subdivision points

### 3.2 Split Region (Gradient Field-Based)

**Algorithm:** Felzenszwalb-style graph-based region splitting along strong gradients
- **Trigger:** Strong gradient crosses interior that survived initial merging  
- **Method:** Watershed segmentation along gradient field
- **Path Generation:** Shortest path through gradient field creates new region boundary

**Technical Details:**
```rust
pub struct RegionSplitAction {
    pub region_id: usize,
    pub gradient_axis: Vec2,    // Principal gradient direction
    pub split_path: Vec<Point2D>, // New boundary path
    pub sub_regions: Vec<RegionProperties>,
}

pub fn split_region_gradient_field(
    error_tile: &TileError,
    region: &RegionProperties,
    gradient_threshold: f64,
) -> Option<RegionSplitAction> {
    // 1. Compute gradient field in error region
    // 2. Apply watershed transform
    // 3. Find shortest path along gradient ridges
    // 4. Generate cubic Bézier boundary for new sub-regions
}
```

**Integration with Phase A:**
- Uses existing `segmentation::rag::RegionProperties` structures
- Extends `segmentation::rag::gradient_aware_predicate` for splitting decisions
- Maintains RAG consistency after splits

### 3.3 Upgrade Fill (Flat → Gradient)

**Algorithm:** PCA-based gradient axis detection with multi-stop optimization
- **Trigger:** Interior ΔE remains high after boundary refinement
- **Method:** Principal Component Analysis to find optimal gradient axis
- **Optimization:** 2-3 stop gradient using color quantiles along PCA axis

**Technical Details:**
```rust
pub struct FillUpgradeAction {
    pub region_id: usize,
    pub upgrade_type: GradientType,  // Linear or Radial
    pub axis: Vec2,                  // PCA-derived gradient axis
    pub stops: Vec<GradientStop>,    // Color stops at quantiles
}

pub fn upgrade_fill_pca_gradient(
    error_tile: &TileError,
    region: &RegionProperties, 
    color_error_threshold: f64,
) -> Option<FillUpgradeAction> {
    // 1. Analyze region color distribution in Lab space
    // 2. Apply PCA to find principal color variation axis
    // 3. Generate 2-3 stops at 10%-50%-90% quantiles
    // 4. Choose linear vs radial based on spatial distribution
}
```

**Integration with Phase A:**
- Leverages existing `fills::gradients::analyze_region_gradient_pca`
- Extends `fills::gradients::Gradient` with upgrade capabilities
- Maintains color accuracy in Lab colorspace throughout process

---

## 4. Iteration Control and Convergence Detection

### Convergence Algorithm

**Multi-Criteria Stopping Conditions:**
1. **Error Plateau:** ΔE improvement < 0.5 between iterations
2. **Time Budget:** Maximum 600ms total refinement time (roadmap requirement)
3. **Iteration Limit:** Maximum 2-3 iterations (roadmap requirement) 
4. **Quality Target:** ΔE ≤ 6.0 and SSIM ≥ 0.93 achieved

**Technical Implementation:**
```rust
use std::time::{Instant, Duration};

pub struct RefinementBudget {
    pub max_iterations: u32,
    pub max_time_ms: u64,
    pub target_delta_e: f64,
    pub target_ssim: f64,
    pub plateau_threshold: f64,
}

pub struct ConvergenceState {
    pub iteration: u32,
    pub start_time: Instant,
    pub current_delta_e: f64,
    pub current_ssim: f64,
    pub previous_delta_e: f64,
    pub has_converged: bool,
    pub convergence_reason: String,
}

pub fn check_convergence(
    state: &mut ConvergenceState,
    budget: &RefinementBudget,
) -> bool {
    // Time budget exceeded
    if state.start_time.elapsed() > Duration::from_millis(budget.max_time_ms) {
        state.convergence_reason = "Time budget exceeded".to_string();
        return true;
    }
    
    // Iteration limit reached
    if state.iteration >= budget.max_iterations {
        state.convergence_reason = "Max iterations reached".to_string();
        return true;
    }
    
    // Quality target achieved
    if state.current_delta_e <= budget.target_delta_e && state.current_ssim >= budget.target_ssim {
        state.convergence_reason = "Quality target achieved".to_string();
        return true;
    }
    
    // Error plateau detected
    if state.iteration > 0 {
        let improvement = state.previous_delta_e - state.current_delta_e;
        if improvement < budget.plateau_threshold {
            state.convergence_reason = "Error plateau detected".to_string();
            return true;
        }
    }
    
    false
}
```

**Resource Management:**
- Time tracking using `std::time::Instant` for microsecond precision
- Dynamic action budgeting: fewer tiles processed if time is running low
- Graceful degradation: ensure useful improvement even with early termination

---

## 5. Integration Plan with Phase A Modules

### 5.1 Module Architecture

Based on roadmap specifications and existing Phase A structure:

```
src/refine/
├── mod.rs              // Public API and orchestration
├── rasterize.rs        // SVG → bitmap using resvg/tiny-skia
├── error.rs            // Tile-based ΔE + SSIM computation  
├── actions.rs          // Local refinement actions
└── loop.rs             // Iteration control and convergence
```

**Integration Points:**
- **Input:** `SvgPath` vectors from Phase A algorithms (logo, regions, trace-low)
- **Output:** Refined `SvgPath` vectors with improved quality
- **Dependencies:** Leverages existing `segmentation`, `tracing`, `fills` modules
- **Configuration:** Extends existing config system with refinement parameters

### 5.2 API Design

```rust
// Core refinement configuration
pub struct RefineConfig {
    pub max_iterations: u32,           // Default: 2 (roadmap spec)
    pub max_time_ms: u64,             // Default: 600ms (roadmap spec)
    pub target_delta_e: f64,          // Default: 6.0 (roadmap spec)
    pub target_ssim: f64,             // Default: 0.93 (roadmap spec)
    pub tile_size: u32,               // Default: 32 (roadmap spec)
    pub max_tiles_per_iteration: u32, // Default: 5
    pub error_plateau_threshold: f64, // Default: 0.5
}

// Main refinement pipeline
pub fn refine_svg_paths(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> Result<Vec<SvgPath>, RefineError> {
    // 1. Rasterize current SVG to match original resolution
    // 2. Compute per-tile error (ΔE + SSIM)
    // 3. Select worst tiles for refinement
    // 4. Apply local actions (add control point, split region, upgrade fill)
    // 5. Check convergence, repeat if necessary
    // 6. Return refined paths
}

// Pipeline traits for extensibility
pub trait RefinementAction {
    fn can_apply(&self, tile: &TileError, context: &RefinementContext) -> bool;
    fn apply(&self, tile: &TileError, context: &mut RefinementContext) -> ActionResult;
    fn cost_estimate(&self) -> Duration;  // For time budget management
}
```

### 5.3 CLI Integration

Extend existing presets to include refinement:

```rust
// In cli/presets.rs
--preset photo           # segmentation-first + gradients + refine loop (Phase B)
--preset photo-fast      # segmentation-first + gradients (Phase A only) 
--preset posterized      # fixed palette → region trace + refine
--preset logo            # binarize + potrace-like + refine (Phase C)

// New refinement knobs
--refine-iters <int>         # max refinement iterations (default: 2)
--refine-budget-ms <int>     # time cap for refinement (default: 600)
--refine-target-de <f32>     # target ΔE threshold (default: 6.0) 
--refine-target-ssim <f32>   # target SSIM threshold (default: 0.93)
--refine-tile-size <int>     # error analysis tile size (default: 32)
```

---

## 6. Implementation Roadmap

### 6.1 Dependencies and Cargo.toml Updates

```toml
[dependencies]
# Existing dependencies maintained

# New dependencies for Phase B
resvg = "0.43"              # SVG rasterization
tiny-skia = "0.11"          # Rendering backend
palette = "0.7"             # Lab colorspace and ΔE calculations
dssim = "3.3"              # SSIM computation
```

**Dependency Analysis:**
- **resvg**: 43KB additional binary size, well-maintained
- **tiny-skia**: 200KB additional binary size, core rendering engine
- **palette**: 15KB additional binary size, comprehensive color science
- **dssim**: 25KB additional binary size, optimized SSIM implementation
- **Total Impact:** ~283KB binary size increase, acceptable for Phase B functionality

### 6.2 Implementation Phases

**Phase B.1: Core Infrastructure (Week 1)**
```
[ ] Implement rasterize.rs with resvg integration
[ ] Implement error.rs with tile-based ΔE/SSIM computation
[ ] Create basic refinement loop structure in loop.rs
[ ] Add RefineConfig to configuration system
```

**Phase B.2: Refinement Actions (Week 2)**
```
[ ] Implement cubic Bézier control point insertion
[ ] Implement gradient field-based region splitting
[ ] Implement PCA-based fill upgrades
[ ] Create action selection and prioritization logic
```

**Phase B.3: Integration and Testing (Week 3)**
```
[ ] Integrate with existing Phase A modules
[ ] Add CLI flags and preset modifications
[ ] Implement comprehensive test suite
[ ] Benchmark and optimize performance characteristics
```

**Phase B.4: Quality Validation (Week 4)**
```
[ ] Test against roadmap quality targets (ΔE ≤ 6.0, SSIM ≥ 0.93)
[ ] Performance validation (≤ 600ms refinement budget)
[ ] Create before/after gallery for test corpus
[ ] Document API and integration patterns
```

### 6.3 Testing Strategy

**Unit Tests:**
- SVG rasterization accuracy (pixel-perfect reproduction)
- ΔE/SSIM computation correctness (validated against reference implementations)
- Individual refinement actions (control point insertion, region splitting, fill upgrades)
- Convergence detection logic (time budgets, error plateaus)

**Integration Tests:**
- Full refinement pipeline with existing algorithms (logo, regions, trace-low)
- Quality target achievement on test corpus
- Performance benchmarking under time constraints
- CLI integration with new flags and presets

**Quality Metrics:**
- **Success Rate:** % of images achieving ΔE ≤ 6.0 and SSIM ≥ 0.93
- **Performance:** 95th percentile refinement time ≤ 600ms
- **Improvement:** Average ΔE reduction per iteration
- **Convergence:** % of cases converging within 2-3 iterations

---

## 7. Risk Assessment and Mitigations

### High-Risk Areas

**1. Rasterization Accuracy**
- **Risk:** Pixel-perfect SVG reproduction required for accurate error computation
- **Mitigation:** Extensive validation against reference SVG renderers, comprehensive test suite

**2. Performance Budget Management**
- **Risk:** 600ms time budget may be challenging with multiple refinement actions
- **Mitigation:** Action cost estimation, dynamic tile budgeting, graceful degradation

**3. Action Interference**
- **Risk:** Multiple refinement actions may interfere or create instability
- **Mitigation:** Action prioritization, conflict detection, stable ordering

### Medium-Risk Areas

**4. Memory Consumption**
- **Risk:** Rasterization and tile analysis may require significant memory
- **Mitigation:** Streaming tile processing, buffer reuse, memory profiling

**5. Integration Complexity**
- **Risk:** Phase B must work seamlessly with all Phase A algorithms
- **Mitigation:** Comprehensive integration testing, modular API design

### Low-Risk Areas

**6. Library Dependencies**
- **Risk:** New dependencies may introduce compatibility issues
- **Mitigation:** Well-established, actively maintained crates chosen

---

## 8. Success Criteria and Validation

### Quantitative Metrics (Roadmap Requirements)

**Quality Targets:**
- **ΔE ≤ 6.0:** Median color difference on 10-20 image test set
- **SSIM ≥ 0.93:** Average structural similarity (grayscale)
- **Performance ≤ 600ms:** 95th percentile refinement time budget

**Performance Targets:**
- **Total Pipeline ≤ 2.5s:** Including Phase A + Phase B on 1024px images
- **Memory Efficiency:** Peak memory usage ≤ 2× input image size
- **Convergence Rate:** ≥ 90% of images converge within 2-3 iterations

### Qualitative Assessment

**Visual Quality:**
- Sharp boundaries without stair-step artifacts
- Smooth gradients without banding
- Preserved fine details and texture gradients
- Consistent quality across diverse image types

**Stability:**
- Deterministic results with identical inputs
- Graceful handling of edge cases and timeout conditions
- No quality regression compared to Phase A alone

---

## 9. Conclusion

Phase B error-driven refinement is technically feasible using the researched technologies and approaches. The combination of resvg/tiny-skia for rasterization, palette/dssim for error analysis, and sophisticated local refinement algorithms provides a robust foundation for achieving the roadmap's ambitious quality targets.

**Key Success Factors:**
1. **Proven Technologies:** Resvg and tiny-skia provide production-ready SVG rasterization
2. **Accurate Metrics:** ΔE Lab + SSIM combination matches human visual perception
3. **Targeted Actions:** Local refinement minimizes computational cost while maximizing quality impact
4. **Performance Management:** Time budget system ensures predictable runtime characteristics

**Next Steps:**
1. Begin Phase B.1 implementation with core infrastructure
2. Validate rasterization accuracy and error computation against reference implementations  
3. Implement and test individual refinement actions
4. Integrate with existing Phase A modules and validate end-to-end performance

The research indicates Phase B can deliver the targeted quality improvements (ΔE ≤ 6.0, SSIM ≥ 0.93) within the specified performance constraints (≤ 600ms refinement budget), advancing vec2art toward production-ready, high-fidelity vectorization capabilities.