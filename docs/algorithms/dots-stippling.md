# Dots/Stippling

Adaptive stippling with content-aware dot placement for artistic effects.

## Overview

The dots algorithm generates stippling patterns based on image luminance and detail. Creates pointillist effects suitable for portraits and artistic interpretations.

| Attribute       | Value                            |
| --------------- | -------------------------------- |
| Technique       | Adaptive stippling               |
| Distribution    | Poisson disk, grid, or random    |
| Best for        | Portraits, vintage illustrations |
| Processing time | <1s typical                      |

## Parameters

### Dot Placement

| Parameter                | Type | Range                 | Default | Description                               |
| ------------------------ | ---- | --------------------- | ------- | ----------------------------------------- |
| `dotDensityThreshold`    | f32  | 0.0-1.0               | 0.1     | Minimum gradient for dot placement        |
| `dotSpacing`             | f32  | 2.0-20.0              | 5.0     | Minimum spacing between dots              |
| `dotPoissonDiskSampling` | bool | -                     | false   | Use Poisson disk for natural distribution |
| `dotGridPattern`         | enum | grid/hexagonal/random | random  | Dot placement pattern                     |

### Dot Sizing

| Parameter                | Type | Range    | Default | Description                      |
| ------------------------ | ---- | -------- | ------- | -------------------------------- |
| `dotMinRadius`           | f32  | 0.1-5.0  | 0.5     | Minimum dot radius               |
| `dotMaxRadius`           | f32  | 0.5-20.0 | 3.0     | Maximum dot radius               |
| `dotAdaptiveSizing`      | bool | -        | true    | Size based on local variance     |
| `dotGradientBasedSizing` | bool | -        | false   | Size based on gradient magnitude |
| `dotSizeVariation`       | f32  | 0.0-1.0  | 0.3     | Random size variation            |

### Visual Options

| Parameter                | Type | Range                 | Default | Description                      |
| ------------------------ | ---- | --------------------- | ------- | -------------------------------- |
| `dotPreserveColors`      | bool | -                     | true    | Use original pixel colors        |
| `dotBackgroundTolerance` | f32  | 0.0-1.0               | 0.1     | Background detection sensitivity |
| `dotOpacity`             | f32  | 0.1-1.0               | 1.0     | Dot opacity                      |
| `dotShape`               | enum | circle/square/diamond | circle  | Dot shape                        |

### Advanced Distribution

| Parameter                 | Type | Range   | Default | Description                   |
| ------------------------- | ---- | ------- | ------- | ----------------------------- |
| `dotHighDetailDensity`    | f32  | 0.5-1.0 | 0.8     | Density in high-detail areas  |
| `dotLowDetailDensity`     | f32  | 0.0-0.5 | 0.2     | Density in low-detail areas   |
| `dotTransitionSmoothness` | f32  | 0.0-1.0 | 0.5     | Density transition smoothness |

## Recommended Configurations

### Portrait

```json
{
  "algorithm": "dots",
  "dotDensityThreshold": 0.15,
  "dotMinRadius": 0.5,
  "dotMaxRadius": 2.5,
  "dotAdaptiveSizing": true,
  "dotPoissonDiskSampling": true,
  "dotPreserveColors": true
}
```

### High-Density Stipple

```json
{
  "algorithm": "dots",
  "dotSpacing": 3.0,
  "dotMinRadius": 0.3,
  "dotMaxRadius": 1.5,
  "dotHighDetailDensity": 0.9,
  "dotLowDetailDensity": 0.3
}
```

### Vintage/Newspaper

```json
{
  "algorithm": "dots",
  "dotGridPattern": "hexagonal",
  "dotMinRadius": 1.0,
  "dotMaxRadius": 4.0,
  "dotPreserveColors": false,
  "dotOpacity": 0.9
}
```

### Abstract Color

```json
{
  "algorithm": "dots",
  "dotShape": "square",
  "dotSpacing": 8.0,
  "dotMinRadius": 2.0,
  "dotMaxRadius": 6.0,
  "dotPreserveColors": true,
  "dotSizeVariation": 0.5
}
```

## Performance Notes

- Poisson disk sampling is slower than grid-based placement
- Higher density increases SVG file size significantly
- Consider reducing `dotMaxRadius` for very large images

## Tips

- Use `dotPoissonDiskSampling` for natural-looking results
- Enable `dotPreserveColors` for chromatic stippling
- Lower `dotBackgroundTolerance` to skip more background areas
- Adjust `dotTransitionSmoothness` to control tonal gradients
