# Edge Detection

Canny-based edge detection with directional processing and curve fitting.

## Overview

The edge algorithm extracts contours from images using gradient-based edge detection. Optimized for line drawings, sketches, and technical illustrations.

| Attribute       | Value                               |
| --------------- | ----------------------------------- |
| Base algorithm  | Canny edge detection                |
| Enhancements    | ETF/FDoG, multi-pass, curve fitting |
| Best for        | Line art, sketches, comics          |
| Processing time | <1.5s typical                       |

## Parameters

### Directional Processing

| Parameter                      | Type | Range   | Default | Description                                  |
| ------------------------------ | ---- | ------- | ------- | -------------------------------------------- |
| `enableReversePass`            | bool | -       | false   | Right-to-left, bottom-to-top processing      |
| `enableDiagonalPass`           | bool | -       | false   | Diagonal (NW-SE, NE-SW) processing           |
| `directionalStrengthThreshold` | f32  | 0.0-1.0 | 0.3     | Minimum edge strength for directional passes |

Enable multi-pass processing to capture edges missed in single-direction scans.

### ETF/FDoG Edge Enhancement

Edge Tangent Flow with Flow-based Difference of Gaussians for coherent line extraction.

| Parameter         | Type | Range   | Default | Description                |
| ----------------- | ---- | ------- | ------- | -------------------------- |
| `enableEtfFdog`   | bool | -       | false   | Enable ETF/FDoG processing |
| `etfRadius`       | u32  | 2-8     | 4       | Flow field kernel radius   |
| `etfIterations`   | u32  | 1-10    | 4       | Refinement iterations      |
| `etfCoherencyTau` | f32  | 0.0-1.0 | 0.2     | Coherency threshold        |
| `fdogSigmaS`      | f32  | 0.3-2.0 | 0.8     | Structure Gaussian sigma   |
| `fdogSigmaC`      | f32  | 0.5-4.0 | 1.6     | Context Gaussian sigma     |
| `fdogTau`         | f32  | 0.0-1.0 | 0.70    | Edge detection threshold   |

### Non-Maximum Suppression

| Parameter            | Type | Range    | Default | Description               |
| -------------------- | ---- | -------- | ------- | ------------------------- |
| `nmsLow`             | f32  | 0.01-0.2 | 0.04    | Low hysteresis threshold  |
| `nmsHigh`            | f32  | 0.05-0.5 | 0.08    | High hysteresis threshold |
| `nmsSmoothBeforeNms` | bool | -        | false   | Apply Gaussian before NMS |
| `nmsSmoothSigma`     | f32  | 0.5-2.0  | 1.0     | Pre-NMS Gaussian sigma    |

### Flow-Guided Tracing

| Parameter           | Type  | Range      | Default | Description                         |
| ------------------- | ----- | ---------- | ------- | ----------------------------------- |
| `enableFlowTracing` | bool  | -          | false   | Enable flow-guided polyline tracing |
| `traceMinGrad`      | f32   | 0.01-0.1   | 0.02    | Minimum gradient for tracing        |
| `traceMinCoherency` | f32   | 0.01-0.2   | 0.05    | Minimum coherency for tracing       |
| `traceMaxGap`       | u32   | 0-20       | 8       | Maximum pixel gap to bridge         |
| `traceMaxLen`       | usize | 100-100000 | 10000   | Maximum polyline length             |

Requires `enableEtfFdog=true`.

### Bezier Curve Fitting

| Parameter             | Type | Range     | Default | Description                    |
| --------------------- | ---- | --------- | ------- | ------------------------------ |
| `enableBezierFitting` | bool | -         | false   | Fit Bezier curves to polylines |
| `fitLambdaCurv`       | f32  | 0.001-0.1 | 0.01    | Curvature penalty              |
| `fitMaxErr`           | f32  | 0.5-5.0   | 2.0     | Maximum fitting error (px)     |
| `fitSplitAngle`       | f32  | 10.0-90.0 | 32.0    | Corner split angle (degrees)   |
| `fitMaxIterations`    | u32  | 10-100    | 50      | Maximum fitting iterations     |

Requires `enableFlowTracing=true`.

## Recommended Configurations

### Line Art

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

### Technical Drawing

```json
{
  "algorithm": "edge",
  "detail": 0.8,
  "strokeWidth": 1.0,
  "enableEtfFdog": true,
  "enableBezierFitting": true,
  "fitMaxErr": 1.0
}
```

### Sketch/Pencil

```json
{
  "algorithm": "edge",
  "detail": 0.5,
  "strokeWidth": 0.8,
  "noiseFiltering": true,
  "enableMultipass": true
}
```

## Dependencies

- `enableFlowTracing` requires `enableEtfFdog=true`
- `enableBezierFitting` requires `enableFlowTracing=true`
- Directional passes require `enableMultipass=true`
