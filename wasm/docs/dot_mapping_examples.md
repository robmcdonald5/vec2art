# Dot Mapping Usage Examples

## Table of Contents

1. [Quick Start](#quick-start)
2. [CLI Usage Examples](#cli-usage-examples)
3. [Artistic Style Examples](#artistic-style-examples)
4. [API Usage Examples](#api-usage-examples)
5. [Advanced Techniques](#advanced-techniques)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Quick Start

The fastest way to get started with dot mapping is using the CLI with default settings:

```bash
# Basic dot mapping with sensible defaults
vectorize-cli trace-low --backend dots input.png output.svg

# Quick artistic stippling
vectorize-cli trace-low --backend dots --dot-density 0.15 --dot-size-range "0.5,2.0" input.png output.svg
```

**Expected Results:**

- Processing time: <1 second for typical images
- Output: SVG with 500-3000 dots depending on image complexity
- Style: Clean, precise dot placement with original colors preserved

## CLI Usage Examples

### Fine Stippling for Technical Illustrations

Perfect for detailed technical drawings, engineering diagrams, and precise artwork reproduction.

```bash
vectorize-cli trace-low --backend dots \
    --dot-density 0.05 \
    --dot-size-range "0.3,1.0" \
    --background-tolerance 0.08 \
    --adaptive-sizing \
    input.png output.svg
```

**Parameters Explained:**

- `--dot-density 0.05`: Very low threshold = many dots for fine detail
- `--dot-size-range "0.3,1.0"`: Small, uniform dots for precision
- `--background-tolerance 0.08`: Strict background detection
- `--adaptive-sizing`: Varies dot size based on local image complexity

**Expected Output:**

- Dot count: 5,000-15,000 for typical 1000x1000 image
- Appearance: Fine, precise stippling with excellent detail preservation
- Best for: Line art, logos, technical drawings, architectural plans

### Bold Pointillism for Artistic Effects

Creates striking poster-style effects with large, varied dots reminiscent of classical pointillism.

```bash
vectorize-cli trace-low --backend dots \
    --dot-density 0.2 \
    --dot-size-range "1.5,4.0" \
    --preserve-colors \
    --adaptive-sizing \
    input.png output.svg
```

**Artistic Features:**

- Large, visible dots create painterly texture
- Color preservation maintains original image palette
- Adaptive sizing adds natural variation
- Creates visual interest through dot size relationships

**Expected Output:**

- Dot count: 1,000-4,000 for typical image
- Appearance: Bold, artistic interpretation with strong visual impact
- Best for: Posters, artistic prints, abstract interpretations

### Sketch Style with Artistic Jitter

Simulates hand-drawn sketching with irregular dot placement and varied opacity.

```bash
vectorize-cli trace-low --backend dots \
    --dot-density 0.15 \
    --dot-size-range "0.8,2.5" \
    --preserve-colors \
    input.png output.svg
```

**Note:** This example uses default adaptive sizing which includes natural variation. For additional sketch-like effects, post-process with the artistic styles API (see [API examples](#api-usage-examples)).

**Expected Output:**

- Organic, hand-drawn appearance
- Natural variation in dot sizes and positioning
- Best for: Artistic sketches, creative illustrations, organic textures

### Technical Drawing Style

Produces clean, uniform dots suitable for engineering drawings and technical documentation.

```bash
vectorize-cli trace-low --backend dots \
    --dot-density 0.25 \
    --dot-size-range "0.5,1.5" \
    --background-tolerance 0.12 \
    --adaptive-sizing false \
    input.png output.svg
```

**Key Features:**

- `--adaptive-sizing false`: Uniform dot sizes for consistency
- Higher density threshold reduces dot count for cleaner appearance
- Narrow size range ensures uniformity

**Expected Output:**

- Clean, professional appearance
- Consistent dot spacing and sizing
- Best for: CAD drawings, technical documentation, professional diagrams

### Watercolor Effect

Creates soft, layered effects mimicking watercolor painting techniques.

```bash
vectorize-cli trace-low --backend dots \
    --dot-density 0.08 \
    --dot-size-range "2.0,6.0" \
    --preserve-colors \
    --background-tolerance 0.15 \
    input.png output.svg
```

**Artistic Characteristics:**

- Large, soft dots create gentle textures
- Low density allows for layering effects
- Preserved colors maintain painting-like quality

**Expected Output:**

- Soft, organic appearance with artistic texture
- Natural color blending through overlapping dots
- Best for: Artistic interpretations, creative projects, texture studies

## Artistic Style Examples

### Comparing Different Density Settings

```bash
# High density - detailed, busy appearance
vectorize-cli trace-low --backend dots --dot-density 0.02 input.png dense.svg

# Medium density - balanced detail and clarity
vectorize-cli trace-low --backend dots --dot-density 0.1 input.png medium.svg

# Low density - sparse, artistic interpretation
vectorize-cli trace-low --backend dots --dot-density 0.4 input.png sparse.svg
```

**Visual Comparison:**

- **High Density (0.02)**: 10,000+ dots, maximum detail retention
- **Medium Density (0.1)**: 2,000-5,000 dots, balanced approach
- **Low Density (0.4)**: 500-1,500 dots, artistic abstraction

### Size Range Effects

```bash
# Uniform small dots
vectorize-cli trace-low --backend dots --dot-size-range "0.5,0.8" input.png uniform.svg

# Varied sizes for artistic interest
vectorize-cli trace-low --backend dots --dot-size-range "0.3,3.0" input.png varied.svg

# Large artistic dots
vectorize-cli trace-low --backend dots --dot-size-range "2.0,5.0" input.png large.svg
```

### Color vs. Monochrome Output

```bash
# Preserve original colors (default)
vectorize-cli trace-low --backend dots --preserve-colors input.png color.svg

# Black dots only
vectorize-cli trace-low --backend dots --preserve-colors=false input.png mono.svg

# Custom color (requires API usage - see API examples)
```

## API Usage Examples

### Basic Rust API Usage

```rust
use vectorize_core::algorithms::dots::{generate_dots_from_image, DotConfig};
use image;

fn basic_dot_generation() -> Result<Vec<Dot>, Box<dyn std::error::Error>> {
    // Load image
    let img = image::open("input.png")?;
    let rgba = img.to_rgba8();

    // Configure dot generation
    let config = DotConfig {
        min_radius: 0.5,
        max_radius: 2.0,
        density_threshold: 0.15,
        preserve_colors: true,
        adaptive_sizing: true,
        ..Default::default()
    };

    // Generate dots using full pipeline
    let dots = generate_dots_from_image(&rgba, &config, None, None);

    println!("Generated {} dots", dots.len());
    Ok(dots)
}
```

### Custom Artistic Styles

```rust
use vectorize_core::algorithms::dot_styles::{
    apply_style_preset, apply_artistic_effects, DotStyle
};

fn create_sketch_style_dots() -> Result<String, Box<dyn std::error::Error>> {
    let img = image::open("input.png")?.to_rgba8();

    // Start with sketch style preset
    let mut config = DotConfig::default();
    apply_style_preset(&mut config, DotStyle::SketchStyle);

    // Generate initial dots
    let mut dots = generate_dots_from_image(&img, &config, None, None);

    // Apply artistic effects for hand-drawn feel
    apply_artistic_effects(&mut dots, DotStyle::SketchStyle);

    // Convert to SVG
    let svg_content = optimize_dot_svg(&dots);
    Ok(svg_content)
}
```

### Advanced Configuration

```rust
use vectorize_core::algorithms::{
    dots::{DotConfig, generate_dots},
    gradients::{analyze_image_gradients, GradientConfig},
    background::{detect_background_advanced, BackgroundConfig},
};

fn advanced_dot_generation() -> Result<Vec<Dot>, Box<dyn std::error::Error>> {
    let img = image::open("input.png")?;
    let rgba = img.to_rgba8();
    let gray = image::imageops::grayscale(&rgba);

    // Custom gradient analysis
    let gradient_config = GradientConfig {
        sobel_threshold: 0.1,
        variance_radius: 3,
        normalize_magnitude: true,
    };
    let gradients = analyze_image_gradients_with_config(&gray, &gradient_config);

    // Custom background detection
    let bg_config = BackgroundConfig {
        tolerance: 0.08,
        sample_edge_pixels: true,
        cluster_colors: true,
    };
    let background_mask = detect_background_advanced(&rgba, &bg_config);

    // Custom dot configuration
    let dot_config = DotConfig {
        min_radius: 0.3,
        max_radius: 1.8,
        density_threshold: 0.05,
        preserve_colors: true,
        adaptive_sizing: true,
        spacing_factor: 1.3,
        use_parallel: true,
        random_seed: 12345,
        ..Default::default()
    };

    // Generate dots with full control
    let dots = generate_dots(&rgba, &gradients, &background_mask, &dot_config);
    Ok(dots)
}
```

### Custom Color Schemes

```rust
fn create_monochrome_dots() -> Result<String, Box<dyn std::error::Error>> {
    let img = image::open("input.png")?.to_rgba8();

    let config = DotConfig {
        preserve_colors: false,
        default_color: "#2C3E50".to_string(), // Dark blue-gray
        ..Default::default()
    };

    let mut dots = generate_dots_from_image(&img, &config, None, None);

    // Post-process for custom color scheme
    for dot in &mut dots {
        // Apply gradient from dark to light based on radius
        let intensity = (dot.radius - config.min_radius) /
                       (config.max_radius - config.min_radius);
        let gray_value = (120.0 + intensity * 135.0) as u8;
        dot.color = format!("#{:02x}{:02x}{:02x}", gray_value, gray_value, gray_value);
    }

    let svg = optimize_dot_svg(&dots);
    Ok(svg)
}
```

## Advanced Techniques

### Combining Multiple Styles

Create layered effects by generating multiple dot layers with different configurations:

```rust
fn create_layered_effect() -> Result<String, Box<dyn std::error::Error>> {
    let img = image::open("input.png")?.to_rgba8();

    // Base layer - fine detail
    let fine_config = DotConfig {
        min_radius: 0.2,
        max_radius: 0.8,
        density_threshold: 0.03,
        preserve_colors: true,
        ..Default::default()
    };
    let fine_dots = generate_dots_from_image(&img, &fine_config, None, None);

    // Accent layer - bold highlights
    let bold_config = DotConfig {
        min_radius: 1.5,
        max_radius: 3.0,
        density_threshold: 0.6, // Only strongest features
        preserve_colors: true,
        ..Default::default()
    };
    let bold_dots = generate_dots_from_image(&img, &bold_config, None, None);

    // Combine layers
    let mut all_dots = fine_dots;
    all_dots.extend(bold_dots);

    let svg = optimize_dot_svg(&all_dots);
    Ok(svg)
}
```

### Region-Specific Processing

Apply different dot styles to different image regions:

```rust
fn region_specific_dots() -> Result<Vec<Dot>, Box<dyn std::error::Error>> {
    let img = image::open("input.png")?.to_rgba8();
    let (width, height) = (img.width(), img.height());

    let mut all_dots = Vec::new();

    // Process top half with fine stippling
    let top_half = img.view(0, 0, width, height / 2).to_image();
    let mut config = DotConfig::default();
    apply_style_preset(&mut config, DotStyle::FineStippling);
    let top_dots = generate_dots_from_image(&top_half, &config, None, None);
    all_dots.extend(top_dots);

    // Process bottom half with bold pointillism
    let bottom_half = img.view(0, height / 2, width, height / 2).to_image();
    apply_style_preset(&mut config, DotStyle::BoldPointillism);
    let mut bottom_dots = generate_dots_from_image(&bottom_half, &config, None, None);

    // Adjust coordinates for bottom half
    for dot in &mut bottom_dots {
        dot.y += height as f32 / 2.0;
    }
    all_dots.extend(bottom_dots);

    Ok(all_dots)
}
```

### Performance Optimization

For batch processing or real-time applications:

```rust
fn optimized_batch_processing(
    images: &[RgbaImage]
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    use rayon::prelude::*;

    let config = DotConfig {
        use_parallel: true,
        parallel_threshold: 5000, // Lower threshold for smaller images
        ..Default::default()
    };

    let svg_results: Vec<String> = images
        .par_iter()
        .map(|img| {
            let dots = generate_dots_from_image(img, &config, None, None);
            optimize_dot_svg(&dots)
        })
        .collect();

    Ok(svg_results)
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: No dots generated or very few dots

**Symptoms:**

```bash
Generated 0 dots
# or
Generated 12 dots  # Much fewer than expected
```

**Causes and Solutions:**

1. **High density threshold**

   ```bash
   # Problem: --dot-density 0.8 (too high)
   # Solution: Lower the threshold
   --dot-density 0.1  # or even 0.05 for dense images
   ```

2. **Aggressive background detection**

   ```bash
   # Problem: --background-tolerance 0.02 (too strict)
   # Solution: Increase tolerance
   --background-tolerance 0.15  # More permissive
   ```

3. **Image has uniform background**
   ```bash
   # Check if image is mostly uniform color
   # Solution: Use lower thresholds for subtle variations
   --dot-density 0.03 --background-tolerance 0.2
   ```

#### Issue: Too many dots / cluttered output

**Symptoms:**

- SVG file is very large (>10MB)
- Rendering is slow in browser
- Visual noise instead of clear patterns

**Solutions:**

```bash
# Increase density threshold to reduce dot count
--dot-density 0.3  # Instead of 0.05

# Increase minimum dot size to reduce overlap
--dot-size-range "1.0,3.0"  # Instead of "0.3,1.0"

# Disable adaptive sizing for more uniform appearance
--adaptive-sizing=false
```

#### Issue: Dots too small or too large

**Diagnosis Commands:**

```bash
# Test with extreme values to verify parameter effects
--dot-size-range "0.1,0.5"   # Tiny dots
--dot-size-range "5.0,10.0"  # Huge dots
```

**Optimal Ranges by Use Case:**

- **Fine detail**: 0.3-1.5
- **General use**: 0.5-3.0
- **Artistic effect**: 1.0-5.0
- **Poster style**: 2.0-8.0

#### Issue: Poor color preservation

**Symptoms:**

- Colors look washed out
- Important color distinctions lost

**Solutions:**

```bash
# Ensure color preservation is enabled
--preserve-colors

# Lower density threshold to capture more color variation
--dot-density 0.08

# Use adaptive sizing to vary dot intensity
--adaptive-sizing
```

#### Issue: Slow processing

**Performance Diagnostics:**

1. **Check image size**

   ```bash
   # Large images take longer
   # 1000x1000 = ~1 second
   # 2000x2000 = ~4 seconds
   # 4000x4000 = ~15+ seconds
   ```

2. **Optimize settings for speed**

   ```bash
   --dot-density 0.2        # Higher threshold = fewer dots
   --adaptive-sizing=false  # Disable complex calculations
   --background-tolerance 0.15  # Faster background detection
   ```

3. **Use parallel processing**
   ```bash
   --threads 8  # Set to your CPU core count
   ```

### Debugging Workflow

1. **Start with defaults**

   ```bash
   vectorize-cli trace-low --backend dots input.png test.svg
   ```

2. **Adjust one parameter at a time**

   ```bash
   # Test density
   --dot-density 0.05   # More dots
   --dot-density 0.3    # Fewer dots

   # Test size
   --dot-size-range "0.2,1.0"  # Smaller
   --dot-size-range "1.0,4.0"  # Larger
   ```

3. **Check intermediate results**

   ```bash
   # Enable verbose logging
   --verbose

   # Output statistics
   --stats processing_stats.csv
   ```

4. **Validate with known good images**
   - Use simple line art first (logos, drawings)
   - Test with high-contrast images
   - Avoid photos with subtle gradients initially

## Best Practices

### Image Preparation

1. **Optimal Input Formats**
   - PNG with transparency for logos
   - High-contrast images work best
   - 500-2000 pixel width for good balance

2. **Pre-processing Tips**

   ```bash
   # Increase contrast if needed
   convert input.jpg -contrast-stretch 2% preprocessed.jpg

   # Remove noise for cleaner results
   convert input.jpg -despeckle -enhance cleaned.jpg
   ```

### Parameter Selection Guidelines

1. **For Different Image Types**

   **Line Art / Logos:**

   ```bash
   --dot-density 0.08 --dot-size-range "0.4,1.2" --background-tolerance 0.05
   ```

   **Photographs:**

   ```bash
   --dot-density 0.15 --dot-size-range "0.8,2.5" --preserve-colors
   ```

   **Technical Drawings:**

   ```bash
   --dot-density 0.2 --dot-size-range "0.5,1.0" --adaptive-sizing=false
   ```

2. **Progressive Refinement**

   ```bash
   # Start conservative
   --dot-density 0.2

   # Increase detail gradually
   --dot-density 0.15
   --dot-density 0.1
   --dot-density 0.05  # Maximum detail
   ```

### Output Optimization

1. **SVG File Size Management**
   - Use higher density thresholds for web use
   - Consider post-processing with SVGO
   - Group similar colors for smaller files

2. **Quality vs. Performance Balance**

   ```bash
   # High quality (slow)
   --dot-density 0.03 --adaptive-sizing --preserve-colors

   # Balanced (recommended)
   --dot-density 0.1 --adaptive-sizing --preserve-colors

   # Fast (lower quality)
   --dot-density 0.25 --adaptive-sizing=false
   ```

### Integration Workflow

1. **Development Phase**

   ```bash
   # Use small test images for rapid iteration
   # Test with 200x200 pixel versions first

   # Enable statistics tracking
   --stats development_metrics.csv
   ```

2. **Production Deployment**

   ```bash
   # Set consistent seed for reproducible results
   --seed 42

   # Optimize for target platform performance
   --threads 4  # Match server capabilities
   ```

3. **Quality Assurance**
   - Test with diverse image types
   - Verify output in target applications
   - Check SVG compatibility across browsers
   - Validate file sizes for web delivery

This comprehensive guide covers the most common usage patterns for dot mapping. For detailed API information, see [Dot Mapping API Reference](dot_mapping_api.md). For performance optimization, see [Dot Mapping Performance](dot_mapping_performance.md).
