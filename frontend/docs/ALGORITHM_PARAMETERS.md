# Algorithm Parameters Documentation

This document provides a comprehensive reference for all configuration parameters used by each vectorization algorithm in vec2art. Each algorithm has both shared core parameters and algorithm-specific parameters.

## Table of Contents
- [Shared Core Parameters](#shared-core-parameters)
- [Edge Algorithm Parameters](#edge-algorithm-parameters)
- [Centerline Algorithm Parameters](#centerline-algorithm-parameters)
- [Superpixel Algorithm Parameters](#superpixel-algorithm-parameters)
- [Dots Algorithm Parameters](#dots-algorithm-parameters)
- [Color Processing Parameters](#color-processing-parameters)
- [Hand-Drawn Effects Parameters](#hand-drawn-effects-parameters)

---

## Shared Core Parameters
These parameters apply to all algorithms and control fundamental aspects of vectorization.

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `algorithm` | enum | edge/centerline/superpixel/dots | edge | Algorithm backend to use |
| `detail` | f32 | 0.0-1.0 | 0.5 | Overall detail level (0=minimal, 1=maximum) |
| `strokeWidth` | f32 | 0.1-10.0 | 1.2 | Stroke width at 1080p reference resolution |
| `enableMultipass` | bool | - | false | Enable multi-pass processing for better quality |
| `passCount` | u32 | 1-10 | 1 | Number of processing passes when multipass enabled |
| `noiseFiltering` | bool | - | false | Enable content-aware noise filtering |
| `noiseFilterSpatialSigma` | f32 | 0.5-5.0 | 1.2 | Spatial smoothing for noise filter |
| `noiseFilterRangeSigma` | f32 | 10.0-200.0 | 50.0 | Edge preservation for noise filter |
| `maxProcessingTimeMs` | u64 | 1000-300000 | 300000 | Maximum processing time in milliseconds |

---

## Edge Algorithm Parameters
Advanced line tracing with directional processing and artistic enhancements.

### Directional Processing
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableReversePass` | bool | - | false | Enable right-to-left, bottom-to-top processing |
| `enableDiagonalPass` | bool | - | false | Enable diagonal (NW→SE, NE→SW) processing |
| `directionalStrengthThreshold` | f32 | 0.0-1.0 | 0.3 | Minimum edge strength to include in directional passes |

### ETF/FDoG Advanced Edge Detection
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableEtfFdog` | bool | - | false | Enable Edge Tangent Flow and Flow-based Difference of Gaussians |
| `etfRadius` | u32 | 2-8 | 4 | ETF kernel radius for flow field computation |
| `etfIterations` | u32 | 1-10 | 4 | ETF refinement iterations |
| `etfCoherencyTau` | f32 | 0.0-1.0 | 0.2 | ETF coherency threshold |
| `fdogSigmaS` | f32 | 0.3-2.0 | 0.8 | FDoG structure Gaussian sigma |
| `fdogSigmaC` | f32 | 0.5-4.0 | 1.6 | FDoG context Gaussian sigma (2x sigmaS) |
| `fdogTau` | f32 | 0.0-1.0 | 0.70 | FDoG edge detection threshold |

### Non-Maximum Suppression
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `nmsLow` | f32 | 0.01-0.2 | 0.04 | Low hysteresis threshold for edge linking |
| `nmsHigh` | f32 | 0.05-0.5 | 0.08 | High hysteresis threshold for strong edges |
| `nmsSmoothBeforeNms` | bool | - | false | Apply Gaussian smoothing before NMS |
| `nmsSmoothSigma` | f32 | 0.5-2.0 | 1.0 | Gaussian sigma for pre-NMS smoothing |

### Flow-Guided Tracing
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableFlowTracing` | bool | - | false | Enable flow-guided polyline tracing |
| `traceMinGrad` | f32 | 0.01-0.1 | 0.02 | Minimum gradient magnitude for tracing |
| `traceMinCoherency` | f32 | 0.01-0.2 | 0.05 | Minimum coherency for tracing |
| `traceMaxGap` | u32 | 0-20 | 8 | Maximum pixel gap to bridge |
| `traceMaxLen` | usize | 100-100000 | 10000 | Maximum polyline length |

### Bézier Curve Fitting
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableBezierFitting` | bool | - | false | Enable Bézier curve fitting to polylines |
| `fitLambdaCurv` | f32 | 0.001-0.1 | 0.01 | Curvature penalty for curve fitting |
| `fitMaxErr` | f32 | 0.5-5.0 | 2.0 | Maximum fitting error in pixels |
| `fitSplitAngle` | f32 | 10.0-90.0 | 32.0 | Corner angle for splitting curves (degrees) |
| `fitMaxIterations` | u32 | 10-100 | 50 | Maximum fitting iterations |

---

## Centerline Algorithm Parameters
Skeleton-based tracing for bold shapes and high-contrast images.

### Adaptive Thresholding
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableAdaptiveThreshold` | bool | - | true | Enable adaptive thresholding |
| `adaptiveThresholdWindowSize` | u32 | 15-45 (odd) | 31 | Local window size for threshold calculation |
| `adaptiveThresholdK` | f32 | 0.1-0.9 | 0.4 | Sauvola's algorithm sensitivity parameter |
| `adaptiveThresholdUseOptimized` | bool | - | true | Use optimized integral image algorithm |

### Centerline Extraction
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableDistanceTransformCenterline` | bool | - | false | Use high-performance distance transform |
| `minBranchLength` | f32 | 4.0-24.0 | 8.0 | Minimum branch length to keep |
| `douglasPeuckerEpsilon` | f32 | 0.5-3.0 | 1.0 | Path simplification tolerance |

### Width Modulation
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableWidthModulation` | bool | - | false | Enable EDT-based width variation |
| `widthMultiplier` | f32 | 0.5-3.0 | 1.0 | Width scaling factor |
| `widthSmoothing` | f32 | 0.0-1.0 | 0.3 | Width variation smoothing |

---

## Superpixel Algorithm Parameters
Region-based segmentation for stylized and abstract representations.

### SLIC Algorithm
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `numSuperpixels` | u32 | 20-1000 | 275 | Target number of superpixel regions |
| `superpixelCompactness` | f32 | 1.0-50.0 | 10.0 | Shape regularity (higher = more regular) |
| `superpixelSlicIterations` | u32 | 5-15 | 10 | SLIC convergence iterations |
| `superpixelInitializationPattern` | enum | square/hexagonal/poisson | poisson | Initial seed point distribution |

### Rendering Options
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `superpixelFillRegions` | bool | - | true | Fill regions with solid color |
| `superpixelStrokeRegions` | bool | - | true | Draw region boundaries |
| `superpixelStrokeWidth` | f32 | 0.5-5.0 | 1.5 | Boundary stroke width |
| `superpixelSimplifyBoundaries` | bool | - | true | Apply Douglas-Peucker simplification |
| `superpixelBoundaryEpsilon` | f32 | 0.5-3.0 | 1.0 | Boundary simplification tolerance |
| `superpixelPreserveColors` | bool | - | true | Preserve original region colors |

### Region Processing
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `superpixelMinRegionSize` | u32 | 1-100 | 10 | Minimum region size in pixels |
| `superpixelMergeThreshold` | f32 | 0.0-1.0 | 0.1 | Color similarity threshold for merging |
| `superpixelEnforceConnectivity` | bool | - | true | Ensure regions are connected |

---

## Dots Algorithm Parameters
Stippling and pointillism effects with adaptive dot placement.

### Dot Placement
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `dotDensityThreshold` | f32 | 0.0-1.0 | 0.1 | Minimum gradient magnitude for dot placement |
| `dotSpacing` | f32 | 2.0-20.0 | 5.0 | Minimum spacing between dots |
| `dotPoissonDiskSampling` | bool | - | false | Use Poisson disk sampling for natural distribution |
| `dotGridPattern` | enum | grid/hexagonal/random | random | Dot placement pattern |

### Dot Sizing
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `dotMinRadius` | f32 | 0.1-5.0 | 0.5 | Minimum dot radius |
| `dotMaxRadius` | f32 | 0.5-20.0 | 3.0 | Maximum dot radius |
| `dotAdaptiveSizing` | bool | - | true | Size dots based on local variance |
| `dotGradientBasedSizing` | bool | - | false | Size dots based on gradient magnitude |
| `dotSizeVariation` | f32 | 0.0-1.0 | 0.3 | Random size variation amount |

### Visual Options
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `dotPreserveColors` | bool | - | true | Preserve original pixel colors |
| `dotBackgroundTolerance` | f32 | 0.0-1.0 | 0.1 | Background detection sensitivity |
| `dotOpacity` | f32 | 0.1-1.0 | 1.0 | Dot opacity |
| `dotShape` | enum | circle/square/diamond | circle | Dot shape |

### Advanced Distribution
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `dotHighDetailDensity` | f32 | 0.5-1.0 | 0.8 | Density in high-detail areas |
| `dotLowDetailDensity` | f32 | 0.0-0.5 | 0.2 | Density in low-detail areas |
| `dotTransitionSmoothness` | f32 | 0.0-1.0 | 0.5 | Smoothness of density transitions |

---

## Color Processing Parameters
Shared color handling for all algorithms.

### Line Color (Edge/Centerline)
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `linePreserveColors` | bool | - | false | Preserve colors in line tracing |
| `lineColorSampling` | enum | average/dominant/gradient | average | Color sampling method |
| `lineColorAccuracy` | f32 | 0.0-1.0 | 0.7 | Accuracy vs speed tradeoff |
| `maxColorsPerPath` | u32 | 1-10 | 3 | Maximum color segments per path |
| `colorTolerance` | f32 | 0.0-1.0 | 0.15 | Color clustering tolerance |

### Palette Reduction
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enablePaletteReduction` | bool | - | false | Enable color palette reduction |
| `paletteTargetColors` | u32 | 2-50 | 16 | Target number of colors |
| `paletteMethod` | enum | kmeans/median_cut/octree | kmeans | Palette reduction algorithm |
| `paletteDithering` | bool | - | false | Apply dithering after reduction |

### Background Processing
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `enableBackgroundRemoval` | bool | - | false | Enable background removal preprocessing |
| `backgroundRemovalStrength` | f32 | 0.0-1.0 | 0.5 | Removal aggressiveness |
| `backgroundRemovalAlgorithm` | enum | otsu/adaptive/manual/auto | auto | Background detection method |
| `backgroundRemovalThreshold` | u8? | 0-255 | null | Manual threshold (if algorithm=manual) |
| `backgroundRemovalInvert` | bool | - | false | Invert background detection |

---

## Hand-Drawn Effects Parameters
Artistic enhancements for natural, hand-drawn appearance.

### Core Effects
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `handDrawnPreset` | enum | none/subtle/moderate/strong/extreme | none | Preset effect strength |
| `handDrawnVariableWeights` | f32 | 0.0-1.0 | 0.0 | Stroke weight variation |
| `handDrawnTremorStrength` | f32 | 0.0-1.0 | 0.0 | Hand tremor simulation |
| `handDrawnTapering` | f32 | 0.0-1.0 | 0.0 | Line end tapering |

### Advanced Effects
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `handDrawnPressureVariation` | f32 | 0.0-1.0 | 0.3 | Pen pressure simulation |
| `handDrawnRoughness` | f32 | 0.0-1.0 | 0.2 | Line roughness amount |
| `handDrawnWobbleFrequency` | f32 | 0.1-5.0 | 1.0 | Wobble oscillation frequency |
| `handDrawnWobbleAmplitude` | f32 | 0.0-2.0 | 0.5 | Wobble oscillation amplitude |
| `handDrawnOvershoot` | f32 | 0.0-10.0 | 0.0 | Line overshoot at endpoints |
| `handDrawnUndershoot` | f32 | 0.0-10.0 | 0.0 | Line undershoot at endpoints |

---

## Parameter Dependencies

### Edge Algorithm Dependencies
- `enableFlowTracing` requires `enableEtfFdog=true`
- `enableBezierFitting` requires `enableFlowTracing=true`
- `enableReversePass` and `enableDiagonalPass` require `enableMultipass=true`

### Centerline Algorithm Dependencies
- `enableWidthModulation` requires centerline extraction to be successful
- `adaptiveThresholdWindowSize` must be odd number

### Color Processing Dependencies
- `linePreserveColors` only applies to Edge and Centerline algorithms
- `paletteReduction` affects all color-preserving modes
- `backgroundRemoval` is applied before all other processing

### Performance Considerations
- ETF/FDoG processing is computationally expensive
- Higher `passCount` linearly increases processing time
- `numSuperpixels` dramatically affects Superpixel algorithm speed
- Poisson disk sampling is slower than grid-based dot placement

---

## Default Configurations by Use Case

### Line Art (Edge)
```json
{
  "algorithm": "edge",
  "detail": 0.7,
  "strokeWidth": 1.2,
  "enableMultipass": true,
  "passCount": 2,
  "enableReversePass": true
}
```

### Technical Drawing (Centerline)
```json
{
  "algorithm": "centerline",
  "detail": 0.8,
  "strokeWidth": 1.0,
  "enableAdaptiveThreshold": true,
  "minBranchLength": 8.0
}
```

### Artistic Style (Superpixel)
```json
{
  "algorithm": "superpixel",
  "numSuperpixels": 200,
  "superpixelCompactness": 15.0,
  "superpixelFillRegions": true,
  "superpixelPreserveColors": true
}
```

### Stippling (Dots)
```json
{
  "algorithm": "dots",
  "dotDensityThreshold": 0.15,
  "dotMinRadius": 0.5,
  "dotMaxRadius": 2.5,
  "dotAdaptiveSizing": true,
  "dotPoissonDiskSampling": true
}
```

---

## Notes

1. All parameters use camelCase in the frontend TypeScript/JavaScript layer
2. Parameters are converted to snake_case when passed to WASM/Rust
3. Not all parameters are available in all algorithms - the UI should show/hide based on selected algorithm
4. Default values are optimized for typical use cases but can vary based on image characteristics
5. Some parameters have interdependencies that should be validated in the UI layer