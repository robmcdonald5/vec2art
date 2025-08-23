# Centerline Algorithm Settings Enhancement TODO

This document outlines potential settings additions for the Distance Transform centerline algorithm that would have meaningful and noticeable effects on image output.

## High Impact Settings (Recommended Priority)

### 1. Ridge Detection Sensitivity
- **Current**: Hardcoded threshold in distance field processing
- **Proposed**: User-controllable sensitivity (0.1-2.0)
- **Effect**: Controls which ridges become centerlines - lower values capture more subtle features, higher values only capture prominent ridges
- **Visual Impact**: Dramatic difference in line density and detail capture

### 2. Minimum Line Length Filter
- **Current**: Not implemented (keeps all lines)
- **Proposed**: Pixel-based minimum length threshold (5-50 pixels)
- **Effect**: Filters out short noise lines while preserving meaningful strokes
- **Visual Impact**: Major noise reduction in complex images, cleaner output

### 3. Endpoint Bridging Distance
- **Current**: Fixed at 6.0 pixels
- **Proposed**: User control (2.0-15.0 pixels)
- **Effect**: Controls how aggressively nearby line endpoints are connected
- **Visual Impact**: Significant effect on line connectivity vs. fragmentation

### 4. Simplification Strategy Selector
- **Current**: Uses basic Douglas-Peucker
- **Proposed**: Dropdown with options:
  - Minimal (preserves most detail)
  - Adaptive (current behavior)
  - Aggressive (heavy simplification)
  - CurvatureAware (preserves curves)
- **Effect**: Different balance of detail preservation vs. simplification
- **Visual Impact**: Major differences in curve smoothness and file size

## Medium Impact Settings

### 5. Blur Sigma Override
- **Current**: Automatically calculated from `detail` parameter
- **Proposed**: Optional manual override (0.5-3.0)
- **Effect**: Controls pre-processing smoothing strength
- **Visual Impact**: Affects noise sensitivity and fine detail capture

### 6. Distance Transform Algorithm Choice
- **Current**: Auto-selects based on performance profile
- **Proposed**: Manual selection:
  - Basic (standard algorithm)
  - SIMD (optimized for speed)
- **Effect**: Performance vs. compatibility tradeoff
- **Visual Impact**: Minimal visual difference, mainly speed

### 7. Morphological Operation Strength
- **Current**: Fixed 3x3 opening+closing or disabled
- **Proposed**: Configurable kernel size (1x1, 3x3, 5x5) and operation type
- **Effect**: Controls noise filtering vs. detail preservation
- **Visual Impact**: Moderate effect on small feature preservation

## Lower Priority Settings

### 8. Adaptive Threshold Window Size Override
- **Current**: Uses config.adaptive_threshold_window_size
- **Proposed**: Centerline-specific override
- **Effect**: Fine-tune thresholding for centerline extraction
- **Visual Impact**: Subtle effects on edge detection quality

### 9. Ridge Detection Direction Bias
- **Current**: Isotropic (no directional preference)
- **Proposed**: Directional weighting (horizontal/vertical/diagonal bias)
- **Effect**: Favor certain line orientations
- **Visual Impact**: Specialized use cases (architectural drawings, etc.)

### 10. Multi-scale Processing
- **Current**: Single-scale processing
- **Proposed**: Process at multiple resolutions and merge results
- **Effect**: Better capture of both fine and coarse features
- **Visual Impact**: More complete feature extraction but increased complexity

## Implementation Notes

### UI Considerations
- Group settings by impact level (Basic/Advanced/Expert)
- Provide meaningful presets ("Clean Lines", "Detailed Capture", "Fast Processing")
- Include real-time preview for high-impact settings
- Add tooltips explaining the visual effects of each setting

### Technical Implementation
- Most settings can be added to existing TraceLowConfig or new CenterlineConfig
- Ridge detection sensitivity requires modification to distance transform extraction
- Simplification strategy requires integration with existing simplification module
- Endpoint bridging needs completion of the smart bridging algorithm (currently TODO)

### Performance Considerations
- Ridge detection sensitivity: Negligible performance impact
- Minimum line length: Improves performance (fewer lines to process)
- Endpoint bridging: Minor performance cost
- Simplification strategy: Varies by algorithm choice
- Multi-scale processing: Significant performance impact

## Recommended Implementation Order
1. Ridge Detection Sensitivity (biggest visual impact)
2. Minimum Line Length Filter (major quality improvement)
3. Simplification Strategy Selector (leverage existing code)
4. Endpoint Bridging Distance (complete existing TODO)
5. Other settings as needed based on user feedback