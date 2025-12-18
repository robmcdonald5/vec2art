# Superpixel

SLIC segmentation for region-based vectorization.

## Overview

The superpixel algorithm segments images into perceptually meaningful regions using SLIC (Simple Linear Iterative Clustering). Produces stylized, color-preserving vectorizations.

| Attribute       | Value                           |
| --------------- | ------------------------------- |
| Base algorithm  | SLIC superpixels                |
| Output          | Polygonal SVG regions           |
| Best for        | Abstract art, color-rich images |
| Processing time | <1.5s typical                   |

## Parameters

### SLIC Algorithm

| Parameter                         | Type | Range                    | Default | Description                              |
| --------------------------------- | ---- | ------------------------ | ------- | ---------------------------------------- |
| `numSuperpixels`                  | u32  | 20-1000                  | 275     | Target number of regions                 |
| `superpixelCompactness`           | f32  | 1.0-50.0                 | 10.0    | Shape regularity (higher = more regular) |
| `superpixelSlicIterations`        | u32  | 5-15                     | 10      | Convergence iterations                   |
| `superpixelInitializationPattern` | enum | square/hexagonal/poisson | poisson | Seed point distribution                  |

Lower `numSuperpixels` creates larger regions. Higher `superpixelCompactness` creates more uniform shapes.

### Rendering Options

| Parameter                      | Type | Range   | Default | Description                |
| ------------------------------ | ---- | ------- | ------- | -------------------------- |
| `superpixelFillRegions`        | bool | -       | true    | Fill regions with color    |
| `superpixelStrokeRegions`      | bool | -       | true    | Draw region boundaries     |
| `superpixelStrokeWidth`        | f32  | 0.5-5.0 | 1.5     | Boundary stroke width      |
| `superpixelSimplifyBoundaries` | bool | -       | true    | Simplify boundary paths    |
| `superpixelBoundaryEpsilon`    | f32  | 0.5-3.0 | 1.0     | Simplification tolerance   |
| `superpixelPreserveColors`     | bool | -       | true    | Use original region colors |

### Region Processing

| Parameter                       | Type | Range   | Default | Description                  |
| ------------------------------- | ---- | ------- | ------- | ---------------------------- |
| `superpixelMinRegionSize`       | u32  | 1-100   | 10      | Minimum region size (pixels) |
| `superpixelMergeThreshold`      | f32  | 0.0-1.0 | 0.1     | Color similarity for merging |
| `superpixelEnforceConnectivity` | bool | -       | true    | Ensure connected regions     |

## Recommended Configurations

### Abstract Art

```json
{
  "algorithm": "superpixel",
  "numSuperpixels": 200,
  "superpixelCompactness": 15.0,
  "superpixelFillRegions": true,
  "superpixelStrokeRegions": true,
  "superpixelPreserveColors": true
}
```

### Stained Glass

```json
{
  "algorithm": "superpixel",
  "numSuperpixels": 100,
  "superpixelCompactness": 20.0,
  "superpixelStrokeWidth": 3.0,
  "superpixelFillRegions": true,
  "superpixelStrokeRegions": true
}
```

### Low-Poly Style

```json
{
  "algorithm": "superpixel",
  "numSuperpixels": 50,
  "superpixelCompactness": 30.0,
  "superpixelFillRegions": true,
  "superpixelStrokeRegions": false,
  "superpixelPreserveColors": true
}
```

### High Detail

```json
{
  "algorithm": "superpixel",
  "numSuperpixels": 500,
  "superpixelCompactness": 8.0,
  "superpixelSlicIterations": 15,
  "superpixelSimplifyBoundaries": true,
  "superpixelBoundaryEpsilon": 0.5
}
```

### Outline Only

```json
{
  "algorithm": "superpixel",
  "numSuperpixels": 150,
  "superpixelFillRegions": false,
  "superpixelStrokeRegions": true,
  "superpixelStrokeWidth": 1.0
}
```

## Performance Notes

- `numSuperpixels` significantly affects processing time
- Higher values increase both computation and SVG file size
- `superpixelSlicIterations` beyond 10 rarely improves quality

## Tips

- Start with 100-300 superpixels for most images
- Use lower `superpixelCompactness` for irregular shapes
- Enable `superpixelEnforceConnectivity` to avoid fragmented regions
- Higher `superpixelMergeThreshold` combines similar adjacent regions
- Disable `superpixelFillRegions` for outline-only effects
