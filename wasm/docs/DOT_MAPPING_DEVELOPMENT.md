# Dot-Based Pixel Mapping Development Guide

## Overview
This document outlines the complete development plan for implementing dot-based pixel mapping as an alternative to complex line tracing algorithms. The approach uses gradient analysis and adaptive density to create artistic dot/stippling effects from raster images.

## Project Goals
- **Primary**: Replace problematic ETF/FDoG/Flow algorithms with reliable dot-based approach
- **Quality**: Achieve visually appealing results comparable to traditional line tracing
- **Performance**: Maintain <1.5s processing times for typical images  
- **Reliability**: >95% success rate across diverse image types
- **Usability**: Intuitive CLI parameters and artistic style presets

---

## Phase 1: Core Infrastructure (Sequential - Week 1)

### Task 1.1: Gradient Calculation Module ⭐ **START HERE**
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/gradients.rs`  
**Dependencies**: None  
**Priority**: Critical

**Deliverables**:
```rust
pub fn calculate_gradient_magnitude(gray: &GrayImage, x: u32, y: u32) -> f32;
pub fn calculate_local_variance(gray: &GrayImage, x: u32, y: u32, radius: u32) -> f32;
pub struct GradientAnalysis {
    pub magnitude: Vec<f32>,
    pub variance: Vec<f32>, 
    pub width: u32,
    pub height: u32,
}
pub fn analyze_image_gradients(gray: &GrayImage) -> GradientAnalysis;
```

**Implementation Notes**:
- Use Sobel operators for gradient calculation
- Implement local variance using sliding window
- Optimize for performance with SIMD where possible
- Include edge handling for boundary pixels

**Success Criteria**:
- Unit tests pass for all gradient calculations
- Performance <50ms for 500x500 image
- Accurate edge detection in test images

### Task 1.2: Background Detection Module  
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/background.rs`  
**Dependencies**: Task 1.1  
**Priority**: Critical

**Deliverables**:
```rust
pub fn detect_background_mask(rgba: &RgbaImage, tolerance: f32) -> Vec<bool>;
pub fn calculate_color_similarity(c1: &Rgba<u8>, c2: &Rgba<u8>) -> f32;
pub struct BackgroundConfig {
    pub tolerance: f32,
    pub sample_edge_pixels: bool,
    pub cluster_colors: bool,
}
pub fn detect_background_advanced(rgba: &RgbaImage, config: &BackgroundConfig) -> Vec<bool>;
```

**Implementation Notes**:
- Use edge pixel sampling for background color detection
- Implement LAB color space for better perceptual similarity
- Support multiple background colors through clustering
- Handle gradients and complex backgrounds

**Success Criteria**:
- Accurately identifies background in diverse test images
- Handles gradual color transitions
- Minimal false positives on important content

### Task 1.3: Dot Placement Algorithm
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/dots.rs`  
**Dependencies**: Tasks 1.1, 1.2  
**Priority**: Critical

**Deliverables**:
```rust
pub struct Dot {
    pub x: f32,
    pub y: f32,
    pub radius: f32,
    pub opacity: f32,
    pub color: String,
}
pub struct DotConfig {
    pub min_radius: f32,
    pub max_radius: f32,
    pub density_threshold: f32,
    pub preserve_colors: bool,
    pub adaptive_sizing: bool,
}
pub fn generate_dots(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    background_mask: &[bool],
    config: &DotConfig
) -> Vec<Dot>;
```

**Implementation Notes**:
- Map gradient strength to dot size and opacity
- Skip background pixels using mask
- Preserve original colors when requested
- Implement basic spatial distribution

**Success Criteria**:
- Generates reasonable dot distributions
- Respects background masking completely
- Dot sizes correlate with image features

---

## Phase 2: SVG Generation & Integration (Parallel - Week 2)

### Task 2.1: SVG Dot Renderer
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/svg_dots.rs`  
**Dependencies**: Task 1.3  
**Priority**: High

**Deliverables**:
```rust
pub fn dots_to_svg_elements(dots: &[Dot]) -> Vec<SvgElement>;
pub fn optimize_dot_svg(dots: &[Dot]) -> String;
pub struct SvgDotConfig {
    pub group_similar_colors: bool,
    pub use_opacity: bool,
    pub compact_output: bool,
}
```

**Implementation Notes**:
- Generate SVG circle elements for dots
- Group similar colors for optimization
- Support opacity and color variations
- Ensure proper coordinate scaling

**Success Criteria**:
- Valid SVG output viewable in browsers
- Optimized file sizes through grouping
- Proper scaling and positioning

### Task 2.2: Backend Integration
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/trace_low.rs`  
**Dependencies**: Tasks 1.1-1.3, 2.1  
**Priority**: High

**Deliverables**:
- Add `TraceBackend::Dots` enum variant
- Implement `trace_dots()` function
- Add dot configuration to `TraceLowConfig`
- Integration with existing pipeline

**Implementation Notes**:
- Follow existing backend pattern from Edge/Centerline
- Ensure proper error handling and logging
- Maintain compatibility with existing interfaces
- Add configuration validation

**Success Criteria**:
- `vectorize_trace_low()` works with dots backend
- No regression in existing functionality
- Proper configuration validation and defaults

### Task 2.3: CLI Parameter Integration  
**Agent**: `@general-developer`  
**File**: `wasm/vectorize-cli/src/main.rs` and `args.rs`  
**Dependencies**: Task 2.2  
**Priority**: Medium

**Deliverables**:
```bash
--backend dots
--dot-density 0.5
--dot-size-range 0.5,3.0
--background-tolerance 0.1  
--preserve-colors
--adaptive-sizing
```

**Implementation Notes**:
- Follow existing CLI parameter patterns
- Provide sensible defaults for all parameters
- Include comprehensive help text
- Validate parameter ranges and combinations

**Success Criteria**:
- All parameters properly exposed and functional
- Help text clear and informative
- Parameter validation prevents invalid configurations

---

## Phase 3: Advanced Features (Parallel - Week 3)

### Task 3.1: Adaptive Density Algorithm
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/adaptive_dots.rs`  
**Dependencies**: Phase 2 complete  
**Priority**: Medium

**Deliverables**:
```rust
pub fn calculate_adaptive_density(
    gradient: &GradientAnalysis, 
    regions: &[Region]
) -> Vec<f32>;
pub fn poisson_disk_sampling(dots: &mut Vec<Dot>, min_distance: f32);
pub struct AdaptiveConfig {
    pub high_detail_density: f32,
    pub low_detail_density: f32,
    pub transition_smoothness: f32,
}
```

**Implementation Notes**:
- Analyze local complexity for density mapping
- Implement Poisson disk sampling for natural distribution
- Smooth transitions between density regions
- Avoid clustering artifacts

**Success Criteria**:
- Natural, non-uniform dot distributions
- Higher density in detailed areas
- No obvious clustering or regular patterns

### Task 3.2: Artistic Style Presets
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/src/algorithms/dot_styles.rs`  
**Dependencies**: Phase 2 complete  
**Priority**: Medium

**Deliverables**:
```rust
pub enum DotStyle {
    FineStippling,
    BoldPointillism,
    SketchStyle, 
    TechnicalDrawing,
    WatercolorEffect,
}
pub fn apply_style_preset(config: &mut DotConfig, style: DotStyle);
pub fn add_artistic_jitter(dots: &mut Vec<Dot>, amount: f32);
```

**Implementation Notes**:
- Define distinct parameter sets for each style
- Add controlled randomness for organic feel
- Support size and opacity variations
- Document artistic intent for each preset

**Success Criteria**:
- Each preset produces visually distinct results
- Artistic effects enhance rather than detract
- Consistent quality across different image types

### Task 3.3: Performance Optimization
**Agent**: `@rust-developer`  
**File**: Various modules  
**Dependencies**: Phase 2 complete  
**Priority**: Medium

**Deliverables**:
- SIMD optimization for gradient calculations
- Parallel processing for dot generation
- Memory pool for dot allocation
- Spatial indexing for collision detection

**Implementation Notes**:
- Profile performance bottlenecks first
- Use `rayon` for parallelization
- Consider SIMD for mathematical operations
- Optimize memory allocation patterns

**Success Criteria**:
- Processing time <1.5s maintained
- Memory usage optimized and predictable
- Scalable performance with image size

---

## Phase 4: Testing & Quality Assurance (Parallel - Week 4)

### Task 4.1: Comprehensive Testing
**Agent**: `@rust-developer`  
**File**: `wasm/vectorize-core/tests/dot_tests.rs`  
**Dependencies**: Phase 3 complete  
**Priority**: High

**Deliverables**:
- Unit tests for all dot algorithms
- Integration tests with diverse test images
- Performance regression tests
- Visual quality validation framework

**Implementation Notes**:
- Test edge cases and boundary conditions
- Include diverse image types (photos, graphics, sketches)
- Automated visual regression testing where possible
- Performance benchmarks with clear acceptance criteria

**Success Criteria**:
- >90% test coverage for dot-related code
- All performance benchmarks pass
- Visual quality meets or exceeds line tracing

### Task 4.2: Documentation & Examples  
**Agent**: `@general-developer`  
**File**: `wasm/examples/` and `wasm/docs/`  
**Dependencies**: Phase 3 complete  
**Priority**: Medium

**Deliverables**:
- API documentation for all public functions
- Usage examples for each artistic style
- Performance comparison documentation
- Best practices and troubleshooting guide

**Implementation Notes**:
- Generate rustdoc documentation
- Include visual examples of different styles
- Document parameter effects and interactions
- Provide migration guide from line tracing

**Success Criteria**:
- Complete API documentation
- Examples demonstrate all major features
- Documentation accurate and helpful

### Task 4.3: Code Review & Cleanup
**Agent**: `@code-reviewer`  
**File**: All dot-related modules  
**Dependencies**: Phases 1-3 complete  
**Priority**: Medium

**Deliverables**:
- Comprehensive code quality review
- API consistency and naming review
- Error handling validation
- Performance bottleneck identification

**Implementation Notes**:
- Review for Rust best practices
- Ensure consistent error handling patterns
- Validate API design and usability
- Check for potential security issues

**Success Criteria**:
- Code meets project quality standards
- No critical issues or vulnerabilities
- Consistent API design patterns

---

## Phase 5: Integration Testing (Sequential - Week 4)

### Task 5.1: End-to-End Testing
**Agent**: `@general-developer`  
**File**: `wasm/test-dot-mapping.bat`  
**Dependencies**: All phases complete  
**Priority**: High

**Deliverables**:
- Comprehensive test suite for dot mapping
- Quality comparison with line tracing
- Multi-image validation pipeline
- Performance benchmarking suite

**Implementation Notes**:
- Test with same images as line tracing
- Include diverse image types and sizes
- Automated quality metrics where possible
- Clear success/failure criteria

**Success Criteria**:
- All tests pass consistently
- Quality improvements over problematic algorithms demonstrated
- Performance targets met across test suite

---

## Implementation Timeline

| Week | Phase | Focus | Critical Path |
|------|-------|-------|---------------|
| 1 | Phase 1 | Core Infrastructure | Sequential: Gradients → Background → Dots |
| 2 | Phase 2 | Integration | Parallel: SVG + Backend + CLI |
| 3 | Phase 3 | Advanced Features | Parallel: Adaptive + Styles + Performance |
| 4 | Phase 4-5 | Quality & Testing | Testing + Documentation + Integration |

## Success Metrics

### Technical Metrics
- **Performance**: <1.5s processing time for typical images
- **Reliability**: >95% success rate across diverse images
- **Quality**: Visual appeal comparable to or better than line tracing
- **Coverage**: >90% test coverage for dot-related code

### User Experience Metrics  
- **Usability**: Intuitive CLI parameters with clear help
- **Flexibility**: Multiple artistic styles available
- **Robustness**: Handles edge cases gracefully
- **Documentation**: Complete and accurate API/usage docs

## Risk Mitigation

### Technical Risks
- **Performance bottlenecks**: Profile early, optimize incrementally
- **Poor visual quality**: Test frequently with diverse images
- **Complex parameter tuning**: Start with simple defaults, add sophistication gradually

### Project Risks
- **Scope creep**: Focus on core functionality first, advanced features later
- **Integration complexity**: Follow existing patterns, maintain compatibility
- **Quality concerns**: Implement comprehensive testing from early stages

---

## Current Status: ⭐ **PHASE 1 READY TO START**

**Next Action**: Execute Task 1.1 (Gradient Calculation Module) with `@rust-developer`

**Files to Create**:
1. `wasm/vectorize-core/src/algorithms/gradients.rs`
2. `wasm/vectorize-core/src/algorithms/mod.rs` (update exports)
3. `wasm/vectorize-core/tests/gradient_tests.rs`

This guide will be maintained and updated as development progresses. Each completed task should be marked with ✅ and any deviations or learnings documented for future reference.