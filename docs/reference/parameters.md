# Parameters Reference

Complete parameter documentation for all vectorization algorithms.

## Core Parameters

These parameters apply to all algorithms.

| Parameter                 | Type | Range                           | Default | Description                     |
| ------------------------- | ---- | ------------------------------- | ------- | ------------------------------- |
| `algorithm`               | enum | edge/centerline/superpixel/dots | edge    | Algorithm backend               |
| `detail`                  | f32  | 0.0-1.0                         | 0.5     | Overall detail level            |
| `strokeWidth`             | f32  | 0.1-10.0                        | 1.2     | Stroke width at 1080p reference |
| `enableMultipass`         | bool | -                               | false   | Multiple processing passes      |
| `passCount`               | u32  | 1-10                            | 1       | Number of passes                |
| `noiseFiltering`          | bool | -                               | false   | Pre-processing noise reduction  |
| `noiseFilterSpatialSigma` | f32  | 0.5-5.0                         | 1.2     | Spatial smoothing               |
| `noiseFilterRangeSigma`   | f32  | 10.0-200.0                      | 50.0    | Edge preservation               |
| `maxProcessingTimeMs`     | u64  | 1000-300000                     | 300000  | Processing timeout              |

## Edge Detection Parameters

### Directional Processing

| Parameter                      | Type | Range   | Default |
| ------------------------------ | ---- | ------- | ------- |
| `enableReversePass`            | bool | -       | false   |
| `enableDiagonalPass`           | bool | -       | false   |
| `directionalStrengthThreshold` | f32  | 0.0-1.0 | 0.3     |

### ETF/FDoG

| Parameter         | Type | Range   | Default |
| ----------------- | ---- | ------- | ------- |
| `enableEtfFdog`   | bool | -       | false   |
| `etfRadius`       | u32  | 2-8     | 4       |
| `etfIterations`   | u32  | 1-10    | 4       |
| `etfCoherencyTau` | f32  | 0.0-1.0 | 0.2     |
| `fdogSigmaS`      | f32  | 0.3-2.0 | 0.8     |
| `fdogSigmaC`      | f32  | 0.5-4.0 | 1.6     |
| `fdogTau`         | f32  | 0.0-1.0 | 0.70    |

### Non-Maximum Suppression

| Parameter            | Type | Range    | Default |
| -------------------- | ---- | -------- | ------- |
| `nmsLow`             | f32  | 0.01-0.2 | 0.04    |
| `nmsHigh`            | f32  | 0.05-0.5 | 0.08    |
| `nmsSmoothBeforeNms` | bool | -        | false   |
| `nmsSmoothSigma`     | f32  | 0.5-2.0  | 1.0     |

### Flow-Guided Tracing

| Parameter           | Type  | Range      | Default |
| ------------------- | ----- | ---------- | ------- |
| `enableFlowTracing` | bool  | -          | false   |
| `traceMinGrad`      | f32   | 0.01-0.1   | 0.02    |
| `traceMinCoherency` | f32   | 0.01-0.2   | 0.05    |
| `traceMaxGap`       | u32   | 0-20       | 8       |
| `traceMaxLen`       | usize | 100-100000 | 10000   |

### Bezier Curve Fitting

| Parameter             | Type | Range     | Default |
| --------------------- | ---- | --------- | ------- |
| `enableBezierFitting` | bool | -         | false   |
| `fitLambdaCurv`       | f32  | 0.001-0.1 | 0.01    |
| `fitMaxErr`           | f32  | 0.5-5.0   | 2.0     |
| `fitSplitAngle`       | f32  | 10.0-90.0 | 32.0    |
| `fitMaxIterations`    | u32  | 10-100    | 50      |

## Centerline Parameters

### Adaptive Thresholding

| Parameter                       | Type | Range       | Default |
| ------------------------------- | ---- | ----------- | ------- |
| `enableAdaptiveThreshold`       | bool | -           | true    |
| `adaptiveThresholdWindowSize`   | u32  | 15-45 (odd) | 31      |
| `adaptiveThresholdK`            | f32  | 0.1-0.9     | 0.4     |
| `adaptiveThresholdUseOptimized` | bool | -           | true    |

### Extraction

| Parameter                           | Type | Range    | Default |
| ----------------------------------- | ---- | -------- | ------- |
| `enableDistanceTransformCenterline` | bool | -        | false   |
| `minBranchLength`                   | f32  | 4.0-24.0 | 8.0     |
| `douglasPeuckerEpsilon`             | f32  | 0.5-3.0  | 1.0     |

### Width Modulation

| Parameter               | Type | Range   | Default |
| ----------------------- | ---- | ------- | ------- |
| `enableWidthModulation` | bool | -       | false   |
| `widthMultiplier`       | f32  | 0.5-3.0 | 1.0     |
| `widthSmoothing`        | f32  | 0.0-1.0 | 0.3     |

## Superpixel Parameters

### SLIC Algorithm

| Parameter                         | Type | Range                    | Default |
| --------------------------------- | ---- | ------------------------ | ------- |
| `numSuperpixels`                  | u32  | 20-1000                  | 275     |
| `superpixelCompactness`           | f32  | 1.0-50.0                 | 10.0    |
| `superpixelSlicIterations`        | u32  | 5-15                     | 10      |
| `superpixelInitializationPattern` | enum | square/hexagonal/poisson | poisson |

### Rendering

| Parameter                      | Type | Range   | Default |
| ------------------------------ | ---- | ------- | ------- |
| `superpixelFillRegions`        | bool | -       | true    |
| `superpixelStrokeRegions`      | bool | -       | true    |
| `superpixelStrokeWidth`        | f32  | 0.5-5.0 | 1.5     |
| `superpixelSimplifyBoundaries` | bool | -       | true    |
| `superpixelBoundaryEpsilon`    | f32  | 0.5-3.0 | 1.0     |
| `superpixelPreserveColors`     | bool | -       | true    |

### Region Processing

| Parameter                       | Type | Range   | Default |
| ------------------------------- | ---- | ------- | ------- |
| `superpixelMinRegionSize`       | u32  | 1-100   | 10      |
| `superpixelMergeThreshold`      | f32  | 0.0-1.0 | 0.1     |
| `superpixelEnforceConnectivity` | bool | -       | true    |

## Dots Parameters

### Placement

| Parameter                | Type | Range                 | Default |
| ------------------------ | ---- | --------------------- | ------- |
| `dotDensityThreshold`    | f32  | 0.0-1.0               | 0.1     |
| `dotSpacing`             | f32  | 2.0-20.0              | 5.0     |
| `dotPoissonDiskSampling` | bool | -                     | false   |
| `dotGridPattern`         | enum | grid/hexagonal/random | random  |

### Sizing

| Parameter                | Type | Range    | Default |
| ------------------------ | ---- | -------- | ------- |
| `dotMinRadius`           | f32  | 0.1-5.0  | 0.5     |
| `dotMaxRadius`           | f32  | 0.5-20.0 | 3.0     |
| `dotAdaptiveSizing`      | bool | -        | true    |
| `dotGradientBasedSizing` | bool | -        | false   |
| `dotSizeVariation`       | f32  | 0.0-1.0  | 0.3     |

### Visual

| Parameter                | Type | Range                 | Default |
| ------------------------ | ---- | --------------------- | ------- |
| `dotPreserveColors`      | bool | -                     | true    |
| `dotBackgroundTolerance` | f32  | 0.0-1.0               | 0.1     |
| `dotOpacity`             | f32  | 0.1-1.0               | 1.0     |
| `dotShape`               | enum | circle/square/diamond | circle  |

### Distribution

| Parameter                 | Type | Range   | Default |
| ------------------------- | ---- | ------- | ------- |
| `dotHighDetailDensity`    | f32  | 0.5-1.0 | 0.8     |
| `dotLowDetailDensity`     | f32  | 0.0-0.5 | 0.2     |
| `dotTransitionSmoothness` | f32  | 0.0-1.0 | 0.5     |

## Color Processing

| Parameter            | Type | Range                     | Default |
| -------------------- | ---- | ------------------------- | ------- |
| `linePreserveColors` | bool | -                         | false   |
| `lineColorSampling`  | enum | average/dominant/gradient | average |
| `lineColorAccuracy`  | f32  | 0.0-1.0                   | 0.7     |
| `maxColorsPerPath`   | u32  | 1-10                      | 3       |
| `colorTolerance`     | f32  | 0.0-1.0                   | 0.15    |

### Palette Reduction

| Parameter                | Type | Range                    | Default |
| ------------------------ | ---- | ------------------------ | ------- |
| `enablePaletteReduction` | bool | -                        | false   |
| `paletteTargetColors`    | u32  | 2-50                     | 16      |
| `paletteMethod`          | enum | kmeans/median_cut/octree | kmeans  |
| `paletteDithering`       | bool | -                        | false   |

### Background Removal

| Parameter                    | Type | Range         | Default |
| ---------------------------- | ---- | ------------- | ------- |
| `enableBackgroundRemoval`    | bool | -             | false   |
| `backgroundRemovalStrength`  | f32  | 0.0-1.0       | 0.5     |
| `backgroundRemovalAlgorithm` | enum | otsu/adaptive | otsu    |
| `backgroundRemovalThreshold` | u8?  | 0-255         | null    |
| `backgroundRemovalInvert`    | bool | -             | false   |

## Hand-Drawn Effects

| Parameter                    | Type | Range                               | Default |
| ---------------------------- | ---- | ----------------------------------- | ------- |
| `handDrawnPreset`            | enum | none/subtle/moderate/strong/extreme | none    |
| `handDrawnVariableWeights`   | f32  | 0.0-1.0                             | 0.0     |
| `handDrawnTremorStrength`    | f32  | 0.0-1.0                             | 0.0     |
| `handDrawnTapering`          | f32  | 0.0-1.0                             | 0.0     |
| `handDrawnPressureVariation` | f32  | 0.0-1.0                             | 0.3     |
| `handDrawnRoughness`         | f32  | 0.0-1.0                             | 0.2     |
| `handDrawnWobbleFrequency`   | f32  | 0.1-5.0                             | 1.0     |
| `handDrawnWobbleAmplitude`   | f32  | 0.0-2.0                             | 0.5     |
| `handDrawnOvershoot`         | f32  | 0.0-10.0                            | 0.0     |
| `handDrawnUndershoot`        | f32  | 0.0-10.0                            | 0.0     |

## Parameter Dependencies

| Parameter                     | Requires                     |
| ----------------------------- | ---------------------------- |
| `enableFlowTracing`           | `enableEtfFdog=true`         |
| `enableBezierFitting`         | `enableFlowTracing=true`     |
| `enableReversePass`           | `enableMultipass=true`       |
| `enableDiagonalPass`          | `enableMultipass=true`       |
| `adaptiveThresholdWindowSize` | Must be odd number           |
| `linePreserveColors`          | Edge or Centerline algorithm |

## Naming Conventions

Frontend uses camelCase. WASM/Rust uses snake_case.

```typescript
// Frontend
{ strokeWidth: 1.5, enableMultipass: true }

// WASM (automatic conversion)
{ stroke_width: 1.5, enable_multipass: true }
```

Transformation handled automatically by `toWasmConfig()`.
