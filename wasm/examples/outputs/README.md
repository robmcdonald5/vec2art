# Vec2Art Output Directory Organization

This directory contains organized outputs from the vec2art line tracing system's four production-ready backend algorithms. Each backend specializes in different artistic styles and use cases.

## Directory Structure

### `line_tracing/` - Edge Detection Backend (Default)

**Algorithm**: Canny edge detection with adaptive thresholds  
**Best For**: Detailed line art, drawings, sketches, complex imagery  
**Performance**: Ultra-fast, <1.5s for typical images  
**Output**: Traditional line art with clean, continuous strokes

**Features**:

- Multi-pass processing (standard, reverse, diagonal)
- Hand-drawn aesthetics with variable stroke weights
- Tremor effects for organic feel
- Tapering for natural line endings
- Directional enhancement for comprehensive coverage

**File Naming**: `*-XX-edge-*.svg` (where XX is the variant number)

### `dot_mapping/` - Dots/Stippling Backend

**Algorithm**: Adaptive stippling with content-aware dot placement  
**Best For**: Artistic effects, texture emphasis, vintage styles  
**Performance**: Very fast, density-based processing  
**Output**: Stippling patterns with variable dot sizes and colors

**Features**:

- Color preservation and monochrome modes
- Adaptive sizing based on content
- Background detection and filtering
- Multiple density levels (ultra-fine to sparse)
- Content-aware dot placement

**File Naming**: `*-XX-dots-*.svg` with density and style modifiers

### `centerline_tracing/` - Centerline Backend

**Algorithm**: Zhang-Suen thinning algorithm for skeleton extraction  
**Best For**: Bold shapes, logos, text, high-contrast imagery  
**Performance**: Moderate speed, optimized for simpler shapes  
**Output**: Single-pixel width centerlines, precise geometric representation

**Features**:

- Morphological processing for clean skeletons
- Contour-based tracing for accuracy
- Ideal for technical drawings and simplified line art
- Precise geometric representation

**File Naming**: `*-XX-centerline-*.svg`

### `superpixel_regions/` - Superpixel Backend

**Algorithm**: SLIC (Simple Linear Iterative Clustering) segmentation  
**Best For**: Stylized art, abstract representations, color-rich images  
**Performance**: Fast, region-based processing  
**Output**: Polygonal line art based on color/texture regions

**Features**:

- Adaptive region count based on detail level
- Color/texture based segmentation
- Modern art and poster-like effects
- Simplified illustrations with geometric appeal

**File Naming**: `*-XX-superpixel-*.svg`

## Additional Directories

### `benchmarks/`

Contains performance benchmarking results and timing data for different backends and parameter combinations.

### `test_outputs/`

Contains outputs from automated testing and validation runs, used for regression testing and quality assurance.

## Output File Conventions

All output files follow the naming pattern:

```
[image-name]-[XX]-[backend]-[variant].svg
```

Where:

- `image-name`: Original input image name
- `XX`: Sequential number (01-99)
- `backend`: Algorithm type (edge, dots, centerline, superpixel)
- `variant`: Specific parameter set or style modifier

## Backend Selection Guide

| Use Case                   | Recommended Backend     | Why                                           |
| -------------------------- | ----------------------- | --------------------------------------------- |
| Detailed drawings/sketches | **Edge** (line_tracing) | Best detail preservation, fastest processing  |
| Logos and text             | **Centerline**          | Clean geometric lines, precise representation |
| Artistic/vintage effects   | **Dots**                | Unique stippling aesthetic, texture emphasis  |
| Modern/abstract art        | **Superpixel**          | Stylized polygonal look, color-based regions  |
| Technical drawings         | **Centerline**          | Single-pixel accuracy, clean lines            |
| Hand-drawn aesthetic       | **Edge** with tremor    | Variable weights, organic irregularities      |

## Performance Notes

- **Edge Backend**: Fastest overall, <1.5s for typical images
- **Dots Backend**: Very fast, scales with density settings
- **Centerline Backend**: Moderate speed, best for simpler images
- **Superpixel Backend**: Fast, consistent performance regardless of complexity

All backends support multi-threading and SIMD optimization for maximum performance.
