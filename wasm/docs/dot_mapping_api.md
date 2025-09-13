# Dot Mapping API Reference

## Overview

The dot mapping system provides a robust alternative to traditional line tracing by converting raster images to artistic dot patterns. This API reference covers all public functions, configuration options, and integration points within the vectorize-core library.

## Table of Contents

1. [Core Data Structures](#core-data-structures)
2. [Configuration Types](#configuration-types)
3. [Main API Functions](#main-api-functions)
4. [Gradient Analysis](#gradient-analysis)
5. [Background Detection](#background-detection)
6. [Artistic Styles](#artistic-styles)
7. [SVG Generation](#svg-generation)
8. [Performance Utilities](#performance-utilities)
9. [Integration Points](#integration-points)
10. [Error Handling](#error-handling)

## Core Data Structures

### `Dot`

Represents a single dot in the output with complete positioning and styling information.

```rust
pub struct Dot {
    pub x: f32,        // X coordinate of dot center
    pub y: f32,        // Y coordinate of dot center
    pub radius: f32,   // Dot radius in pixels
    pub opacity: f32,  // Opacity value (0.0 to 1.0)
    pub color: String, // Color as hex string (e.g., "#FF0000")
}
```

**Methods:**

- `new(x: f32, y: f32, radius: f32, opacity: f32, color: String) -> Self`
  - Creates a new dot with specified parameters
  - **Parameters:** All positioning and styling values
  - **Returns:** Initialized Dot instance

- `distance_to(&self, x: f32, y: f32) -> f32`
  - Calculates Euclidean distance to a point
  - **Parameters:** Target coordinates
  - **Returns:** Distance in pixels

- `overlaps_with(&self, other: &Dot) -> bool`
  - Checks if this dot overlaps with another dot
  - **Parameters:** Reference to another dot
  - **Returns:** True if dots overlap based on radii

**Example:**

```rust
let dot = Dot::new(10.0, 20.0, 2.5, 0.8, "#FF0000".to_string());
let distance = dot.distance_to(15.0, 25.0); // Returns ~7.07
let other = Dot::new(12.0, 22.0, 2.0, 1.0, "#00FF00".to_string());
let overlaps = dot.overlaps_with(&other); // Returns true
```

## Configuration Types

### `DotConfig`

Primary configuration structure for dot generation with comprehensive parameter control.

```rust
pub struct DotConfig {
    pub min_radius: f32,           // Minimum dot radius (default: 0.5)
    pub max_radius: f32,           // Maximum dot radius (default: 3.0)
    pub density_threshold: f32,    // Gradient threshold 0.0-1.0 (default: 0.1)
    pub preserve_colors: bool,     // Use original colors (default: true)
    pub adaptive_sizing: bool,     // Use variance-based sizing (default: true)
    pub spacing_factor: f32,       // Spacing multiplier (default: 1.5)
    pub default_color: String,     // Color when not preserving (default: "#000000")
    pub use_parallel: bool,        // Enable parallel processing (default: true)
    pub parallel_threshold: usize, // Pixel count threshold (default: 10000)
    pub random_seed: u64,          // Seed for reproducible results (default: 42)
}
```

**Default Implementation:**

```rust
let config = DotConfig::default();
// All parameters set to sensible defaults for general use
```

**Parameter Guidelines:**

- **min/max_radius**: Use 0.3-1.0 for fine detail, 2.0-6.0 for artistic effect
- **density_threshold**: Lower = more dots (0.05-0.2), Higher = fewer dots (0.3-0.7)
- **spacing_factor**: 1.2 = tight spacing, 2.5 = loose spacing
- **parallel_threshold**: Set based on performance requirements

### `GradientAnalysis`

Container for pre-computed gradient information used in dot placement decisions.

```rust
pub struct GradientAnalysis {
    pub magnitude: Vec<f32>,  // Gradient magnitude for each pixel
    pub variance: Vec<f32>,   // Local variance for adaptive sizing
    pub width: u32,           // Image width
    pub height: u32,          // Image height
}
```

**Methods:**

- `get_magnitude(&self, x: u32, y: u32) -> Option<f32>`
  - Retrieves gradient magnitude at coordinates
  - **Returns:** Magnitude value or None if out of bounds

- `get_variance(&self, x: u32, y: u32) -> Option<f32>`
  - Retrieves local variance at coordinates
  - **Returns:** Variance value or None if out of bounds

### `BackgroundConfig`

Configuration for automatic background detection with multiple detection strategies.

```rust
pub struct BackgroundConfig {
    pub tolerance: f32,           // Color similarity threshold (default: 0.1)
    pub sample_edge_pixels: bool, // Use edge sampling (default: true)
    pub cluster_colors: bool,     // Enable color clustering (default: false)
}
```

## Main API Functions

### High-Level Pipeline Functions

#### `generate_dots_from_image`

Complete pipeline function that handles the entire dot generation process.

```rust
pub fn generate_dots_from_image(
    rgba: &RgbaImage,
    dot_config: &DotConfig,
    gradient_config: Option<&GradientConfig>,
    background_config: Option<&BackgroundConfig>,
) -> Vec<Dot>
```

**Parameters:**

- `rgba`: Input RGBA image
- `dot_config`: Dot generation configuration
- `gradient_config`: Optional gradient analysis config (uses default if None)
- `background_config`: Optional background detection config (uses default if None)

**Returns:** Vector of generated dots

**Example:**

```rust
use vectorize_core::algorithms::dots::{generate_dots_from_image, DotConfig};

let rgba_image = image::open("input.png")?.to_rgba8();
let config = DotConfig {
    min_radius: 0.5,
    max_radius: 2.0,
    density_threshold: 0.15,
    preserve_colors: true,
    ..Default::default()
};

let dots = generate_dots_from_image(&rgba_image, &config, None, None);
println!("Generated {} dots", dots.len());
```

#### `generate_dots_auto_background`

Convenience function with automatic background detection using default settings.

```rust
pub fn generate_dots_auto_background(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    config: &DotConfig,
) -> Vec<Dot>
```

**Use Case:** When you have pre-computed gradient analysis but want automatic background detection.

### Core Generation Function

#### `generate_dots`

Core dot placement algorithm that combines gradient analysis and background detection.

```rust
pub fn generate_dots(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    background_mask: &[bool],
    config: &DotConfig,
) -> Vec<Dot>
```

**Parameters:**

- `rgba`: Input RGBA image
- `gradient_analysis`: Pre-computed gradient information
- `background_mask`: Boolean mask where true = background pixel
- `config`: Dot generation configuration

**Returns:** Vector of generated dots with spatial distribution applied

**Process:**

1. Filters candidates based on background mask
2. Calculates gradient strength for each pixel
3. Applies density threshold filtering
4. Maps strength to dot radius and opacity
5. Applies spatial distribution to prevent clustering
6. Returns final dot collection

## Gradient Analysis

### `analyze_image_gradients`

Performs comprehensive gradient analysis on grayscale images.

```rust
pub fn analyze_image_gradients(gray: &GrayImage) -> GradientAnalysis
```

**Parameters:**

- `gray`: Grayscale input image

**Returns:** Complete gradient analysis with magnitude and variance

**Implementation Details:**

- Uses Sobel operators for gradient calculation
- Computes local variance using sliding window approach
- Optimized for performance with SIMD operations where available
- Handles edge pixels with appropriate boundary conditions

### `analyze_image_gradients_with_config`

Advanced gradient analysis with customizable parameters.

```rust
pub fn analyze_image_gradients_with_config(
    gray: &GrayImage,
    config: &GradientConfig
) -> GradientAnalysis
```

**Use Case:** When you need fine control over gradient calculation parameters.

### Individual Calculation Functions

#### `calculate_gradient_magnitude`

Calculates gradient magnitude at specific pixel coordinates.

```rust
pub fn calculate_gradient_magnitude(gray: &GrayImage, x: u32, y: u32) -> f32
```

**Returns:** Gradient magnitude using Sobel operators (0.0 to ~362.0 for 8-bit)

#### `calculate_local_variance`

Computes local variance within specified radius for adaptive sizing.

```rust
pub fn calculate_local_variance(gray: &GrayImage, x: u32, y: u32, radius: u32) -> f32
```

**Parameters:**

- `gray`: Grayscale image
- `x`, `y`: Center coordinates
- `radius`: Sampling radius in pixels

**Returns:** Local variance value for adaptive dot sizing

## Background Detection

### `detect_background_advanced`

Advanced background detection with multiple strategies and configuration options.

```rust
pub fn detect_background_advanced(rgba: &RgbaImage, config: &BackgroundConfig) -> Vec<bool>
```

**Parameters:**

- `rgba`: Input RGBA image
- `config`: Background detection configuration

**Returns:** Boolean mask where true indicates background pixels

**Detection Strategies:**

- **Edge Sampling**: Analyzes edge pixels to determine background colors
- **Color Clustering**: Groups similar colors and identifies largest cluster as background
- **Gradient Analysis**: Uses edge gradients to distinguish background from content

### `calculate_color_similarity`

Calculates perceptual similarity between two colors using LAB color space.

```rust
pub fn calculate_color_similarity(c1: &Rgba<u8>, c2: &Rgba<u8>) -> f32
```

**Returns:** Similarity value (0.0 = identical, higher = more different)

## Artistic Styles

### Style Enumeration

```rust
pub enum DotStyle {
    FineStippling,      // Small, precise dots (0.3-1.0 radius)
    BoldPointillism,    // Large artistic dots (1.5-4.0 radius)
    SketchStyle,        // Medium dots with heavy jitter (0.8-2.5 radius)
    TechnicalDrawing,   // Uniform precision dots (0.5-1.5 radius)
    WatercolorEffect,   // Large, soft dots (2.0-6.0 radius)
}
```

### Style Application Functions

#### `apply_style_preset`

Applies pre-configured style settings to dot configuration.

```rust
pub fn apply_style_preset(config: &mut DotConfig, style: DotStyle)
```

**Example:**

```rust
let mut config = DotConfig::default();
apply_style_preset(&mut config, DotStyle::BoldPointillism);
// Config now optimized for bold pointillism style
```

#### `apply_artistic_effects`

Applies comprehensive artistic effects for specified style.

```rust
pub fn apply_artistic_effects(dots: &mut Vec<Dot>, style: DotStyle)
```

**Effects Applied:**

- **Position Jitter**: Random position offsets for organic feel
- **Size Variation**: Radius variation using normal distribution
- **Opacity Variation**: Opacity randomization for depth effects

### Individual Effect Functions

#### `add_artistic_jitter`

Adds controlled position randomization to dots.

```rust
pub fn add_artistic_jitter(dots: &mut Vec<Dot>, amount: f32)
```

**Parameters:**

- `dots`: Mutable reference to dot vector
- `amount`: Maximum offset in pixels (0.0 = no jitter)

#### `add_size_variation`

Applies radius variation using normal distribution around original sizes.

```rust
pub fn add_size_variation(dots: &mut Vec<Dot>, variation_factor: f32)
```

**Parameters:**

- `variation_factor`: Variation amount (0.0-1.0, where 1.0 = maximum variation)

#### `add_opacity_variation`

Randomizes dot opacity within specified bounds.

```rust
pub fn add_opacity_variation(dots: &mut Vec<Dot>, variation_factor: f32)
```

**Use Case:** Creating depth effects and texture variation in dot patterns.

## SVG Generation

### `dots_to_svg_elements`

Converts dot vector to SVG circle elements.

```rust
pub fn dots_to_svg_elements(dots: &[Dot]) -> Vec<SvgElement>
```

**Returns:** Vector of SVG circle elements ready for document assembly

### `optimize_dot_svg`

Generates optimized SVG string with color grouping and compression.

```rust
pub fn optimize_dot_svg(dots: &[Dot]) -> String
```

**Optimizations:**

- Groups dots by color to reduce redundancy
- Uses efficient SVG circle syntax
- Applies coordinate precision optimization
- Minimizes file size while maintaining quality

**Example:**

```rust
let dots = generate_dots_from_image(&rgba_image, &config, None, None);
let svg_content = optimize_dot_svg(&dots);
std::fs::write("output.svg", svg_content)?;
```

## Performance Utilities

### Parallel Processing

The dot mapping system automatically uses parallel processing for large images:

- **Threshold**: Configurable via `DotConfig.parallel_threshold`
- **Default**: 10,000 pixels (100x100 image)
- **Implementation**: Uses `rayon` for parallel candidate filtering

### Spatial Optimization

#### `SpatialGrid`

Internal spatial indexing structure for efficient distance checking.

**Features:**

- Grid-based spatial partitioning
- O(1) average lookup time for collision detection
- Memory-efficient storage for large dot collections
- Configurable cell size based on dot spacing requirements

### Memory Management

**Optimization Strategies:**

- Pre-allocated candidate vectors for known image sizes
- Reusable background mask buffers
- Efficient dot sorting using partial comparison
- Minimized allocations during spatial distribution

## Integration Points

### CLI Integration

The dot mapping system integrates with the CLI through the `TraceLowConfig` structure:

```rust
pub struct TraceLowConfig {
    // ... other fields ...
    pub dot_density_threshold: f32,
    pub dot_min_radius: f32,
    pub dot_max_radius: f32,
    pub dot_background_tolerance: f32,
    pub dot_preserve_colors: bool,
    pub dot_adaptive_sizing: bool,
}
```

### WebAssembly Integration

For browser use, the system provides WASM-compatible interfaces:

```rust
// WASM binding example
#[wasm_bindgen]
pub fn vectorize_dots_wasm(
    image_data: &[u8],
    width: u32,
    height: u32,
    config_json: &str,
) -> Result<String, JsValue>
```

### Line Tracing Backend

Dot mapping can be used as a backend in the existing line tracing pipeline:

```rust
let config = TraceLowConfig {
    backend: TraceBackend::Dots,
    // ... other parameters ...
};

let svg = vectorize_trace_low_rgba(&rgba_image, &config)?;
```

## Error Handling

### Common Error Conditions

1. **Invalid Image Dimensions**
   - Empty images (0x0 pixels)
   - Mismatched image and mask sizes
   - **Resolution**: Validate inputs before processing

2. **Invalid Configuration Parameters**
   - Negative radius values
   - Invalid density thresholds (outside 0.0-1.0)
   - **Resolution**: Use configuration validation functions

3. **Memory Allocation Failures**
   - Extremely large images
   - Insufficient system memory
   - **Resolution**: Implement chunked processing for large images

### Error Types

The system uses standard Rust error handling patterns:

```rust
pub enum DotMappingError {
    InvalidImageSize,
    InvalidConfiguration(String),
    ProcessingFailed(String),
    InsufficientMemory,
}
```

### Validation Functions

```rust
pub fn validate_dot_config(config: &DotConfig) -> Result<(), DotMappingError>
```

**Checks:**

- Radius range validity (min < max, both positive)
- Density threshold bounds (0.0-1.0)
- Spacing factor positivity
- Color string format validation

## Performance Characteristics

### Time Complexity

- **Gradient Analysis**: O(n) where n = pixels
- **Background Detection**: O(n) with edge sampling
- **Dot Generation**: O(k log k) where k = candidate pixels
- **Spatial Distribution**: O(k) average case with spatial grid

### Memory Usage

- **Base Memory**: ~20 bytes per pixel for analysis
- **Dot Storage**: ~32 bytes per generated dot
- **Peak Usage**: During candidate generation and sorting

### Benchmarks

Typical performance on modern hardware:

| Image Size | Processing Time | Memory Usage | Generated Dots |
| ---------- | --------------- | ------------ | -------------- |
| 500x500    | 50-80ms         | 15MB         | 500-2000       |
| 1000x1000  | 200-350ms       | 60MB         | 2000-8000      |
| 2000x2000  | 800-1200ms      | 240MB        | 8000-32000     |

_Benchmarks with default DotConfig settings, AMD Ryzen 7 3700X, 32GB RAM_

### Optimization Recommendations

1. **For Speed**: Reduce density_threshold, disable adaptive_sizing
2. **For Quality**: Enable adaptive_sizing, use fine stippling style
3. **For Memory**: Increase density_threshold, reduce max_radius
4. **For Large Images**: Enable parallel processing, use chunked processing

## Version Compatibility

- **Minimum Rust Version**: 1.70.0
- **Dependencies**:
  - `image` crate 0.24+
  - `rayon` 1.7+
  - `rand` 0.8+
- **WASM Support**: Full compatibility with `wasm-bindgen`
- **Platform Support**: All platforms supported by Rust standard library

This API reference provides complete coverage of the dot mapping system. For usage examples and tutorials, see [Dot Mapping Examples](dot_mapping_examples.md). For performance optimization guidance, see [Dot Mapping Performance](dot_mapping_performance.md).
