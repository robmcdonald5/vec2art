# Algorithm Overview

vec2art provides four vectorization algorithms, each optimized for different image types and artistic styles.

## Algorithm Comparison

| Algorithm  | Best For                        | Output Style             | Processing Time |
| ---------- | ------------------------------- | ------------------------ | --------------- |
| Edge       | Line drawings, sketches, comics | Clean continuous strokes | <1.5s           |
| Dots       | Portraits, artistic effects     | Stippling/pointillism    | <1s             |
| Centerline | Logos, text, bold graphics      | Single-pixel skeleton    | <2s             |
| Superpixel | Abstract art, color-rich images | Polygonal regions        | <1.5s           |

## Selection Guide

### Edge Detection

Use when your image has:

- Clear outlines or contours
- Line-based content (drawings, sketches)
- Technical or architectural diagrams
- Comic or manga art

Output: Continuous strokes following detected edges.

### Dots/Stippling

Use when you want:

- Artistic interpretation of photos
- Vintage illustration style
- Pointillist effects
- Tonal representation without lines

Output: Variable-density dot patterns based on image luminance.

### Centerline

Use when your image has:

- Bold shapes with clear boundaries
- Text or typography
- Logos and icons
- High-contrast graphics

Output: Single-pixel-width paths along shape centers.

### Superpixel

Use when you want:

- Stylized color regions
- Stained-glass or mosaic effects
- Abstract representations
- Color-preserving vectorization

Output: Polygonal regions with averaged colors.

## Common Parameters

All algorithms share these core parameters:

| Parameter         | Range    | Description                                |
| ----------------- | -------- | ------------------------------------------ |
| `detail`          | 0.0-1.0  | Overall sensitivity (higher = more detail) |
| `strokeWidth`     | 0.1-10.0 | Output stroke thickness                    |
| `enableMultipass` | boolean  | Multiple processing passes                 |
| `noiseFiltering`  | boolean  | Pre-processing noise reduction             |

See individual algorithm pages for algorithm-specific parameters.

## Performance Notes

Processing times measured on 2048x2048 images (M1 MacBook Pro):

| Stage                | Time       |
| -------------------- | ---------- |
| WASM initialization  | ~50ms      |
| Image loading        | ~100ms     |
| Algorithm processing | 600-1500ms |
| SVG generation       | ~200ms     |

Memory usage typically stays under 40MB for standard images.

## Next Steps

- [Edge Detection](edge-detection.md) - Canny edge parameters
- [Dots/Stippling](dots-stippling.md) - Stippling configuration
- [Centerline](centerline.md) - Zhang-Suen parameters
- [Superpixel](superpixel.md) - SLIC segmentation options
