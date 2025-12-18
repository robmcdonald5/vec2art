# Centerline

Zhang-Suen thinning for skeleton extraction from bold shapes.

## Overview

The centerline algorithm extracts single-pixel-width skeletons from shapes using morphological thinning. Ideal for logos, text, and high-contrast graphics.

| Attribute       | Value                                   |
| --------------- | --------------------------------------- |
| Base algorithm  | Zhang-Suen thinning                     |
| Enhancements    | Adaptive thresholding, width modulation |
| Best for        | Logos, text, bold graphics              |
| Processing time | <2s typical                             |

## Parameters

### Adaptive Thresholding

| Parameter                       | Type | Range       | Default | Description                     |
| ------------------------------- | ---- | ----------- | ------- | ------------------------------- |
| `enableAdaptiveThreshold`       | bool | -           | true    | Enable adaptive thresholding    |
| `adaptiveThresholdWindowSize`   | u32  | 15-45 (odd) | 31      | Local window size               |
| `adaptiveThresholdK`            | f32  | 0.1-0.9     | 0.4     | Sauvola algorithm sensitivity   |
| `adaptiveThresholdUseOptimized` | bool | -           | true    | Use integral image optimization |

Window size must be odd. Larger windows smooth out local variations.

### Centerline Extraction

| Parameter                           | Type | Range    | Default | Description                   |
| ----------------------------------- | ---- | -------- | ------- | ----------------------------- |
| `enableDistanceTransformCenterline` | bool | -        | false   | Use distance transform method |
| `minBranchLength`                   | f32  | 4.0-24.0 | 8.0     | Minimum branch length to keep |
| `douglasPeuckerEpsilon`             | f32  | 0.5-3.0  | 1.0     | Path simplification tolerance |

Higher `minBranchLength` removes small branches/noise. Higher `douglasPeuckerEpsilon` produces simpler paths.

### Width Modulation

| Parameter               | Type | Range   | Default | Description                      |
| ----------------------- | ---- | ------- | ------- | -------------------------------- |
| `enableWidthModulation` | bool | -       | false   | Enable EDT-based width variation |
| `widthMultiplier`       | f32  | 0.5-3.0 | 1.0     | Width scaling factor             |
| `widthSmoothing`        | f32  | 0.0-1.0 | 0.3     | Width variation smoothing        |

Width modulation varies stroke width based on the original shape thickness at each point.

## Recommended Configurations

### Logo/Icon

```json
{
  "algorithm": "centerline",
  "detail": 0.8,
  "strokeWidth": 1.5,
  "enableAdaptiveThreshold": true,
  "minBranchLength": 8.0,
  "douglasPeuckerEpsilon": 1.0
}
```

### Text/Typography

```json
{
  "algorithm": "centerline",
  "detail": 0.9,
  "strokeWidth": 1.0,
  "enableAdaptiveThreshold": true,
  "adaptiveThresholdWindowSize": 21,
  "minBranchLength": 4.0
}
```

### Variable-Width Strokes

```json
{
  "algorithm": "centerline",
  "detail": 0.7,
  "strokeWidth": 2.0,
  "enableWidthModulation": true,
  "widthMultiplier": 1.5,
  "widthSmoothing": 0.5
}
```

### Clean Geometric

```json
{
  "algorithm": "centerline",
  "detail": 0.6,
  "strokeWidth": 1.2,
  "minBranchLength": 12.0,
  "douglasPeuckerEpsilon": 2.0,
  "enableDistanceTransformCenterline": true
}
```

## Dependencies

- `adaptiveThresholdWindowSize` must be odd
- `enableWidthModulation` requires successful centerline extraction
- Distance transform method may produce different results than Zhang-Suen

## Tips

- Use higher `adaptiveThresholdK` for images with uneven lighting
- Increase `minBranchLength` to remove small artifacts
- Enable `enableDistanceTransformCenterline` for smoother results on thick shapes
- Width modulation works best on shapes with varying thickness
