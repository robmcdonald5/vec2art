# Style Presets System

## Overview

The Style Presets system provides production-ready configurations for common image conversion use cases in vec2art. Each preset is optimized for specific image types and artistic goals, delivering professional results with a single click.

## Available Presets

### Professional Category

#### Corporate Logo
- **Best For**: Logos, brand marks, icons, corporate graphics
- **Backend**: Centerline
- **Characteristics**: Clean, precise lines with no artistic effects. Optimized for scalability.
- **Processing Time**: <1.5s
- **Market**: Corporate/business applications

#### Technical Drawing
- **Best For**: Engineering drawings, architecture, technical diagrams, CAD conversion
- **Backend**: Edge
- **Characteristics**: Uniform stroke weight, high precision, clean corners
- **Processing Time**: <1.5s
- **Market**: Technical/engineering applications

### Artistic Category

#### Hand-Drawn Illustration
- **Best For**: Illustrations, artistic portraits, sketches, creative projects
- **Backend**: Edge
- **Characteristics**: Natural tremor, variable line weights, organic tapering
- **Processing Time**: <1.5s
- **Market**: Creative/artistic applications

#### Photo to Sketch
- **Best For**: Portrait photos, landscape photos, product images, social media
- **Backend**: Edge
- **Characteristics**: Photo optimization with natural shading and detail preservation
- **Processing Time**: <1.5s
- **Market**: General consumer use

#### Fine Pointillism
- **Best For**: Fine art, portraits, landscapes, artistic prints
- **Backend**: Dots
- **Characteristics**: Neo-impressionist pointillism with fine dots and color mixing
- **Processing Time**: <2s
- **Market**: Creative/fine art

### Vintage Category

#### Vintage Stippling
- **Best For**: Retro designs, print production, vintage aesthetics, screen printing
- **Backend**: Dots
- **Characteristics**: Classic halftone patterns reminiscent of newspaper prints
- **Processing Time**: <1.5s
- **Market**: Print production

### Modern Category

#### Modern Abstract
- **Best For**: Posters, modern art, album covers, digital graphics
- **Backend**: Superpixel
- **Characteristics**: Bold geometric shapes with color preservation
- **Processing Time**: <1.5s
- **Market**: Digital media

#### Minimalist Poster
- **Best For**: Minimalist art, posters, app icons, brand graphics
- **Backend**: Superpixel
- **Characteristics**: Ultra-simplified shapes with limited colors
- **Processing Time**: <1s
- **Market**: Digital design

## Architecture

### File Structure
```
frontend/src/lib/presets/
├── types.ts        # Type definitions for presets
├── presets.ts      # Preset configurations
├── converter.ts    # Conversion utilities
└── README.md       # This documentation
```

### Type System

The preset system uses strongly-typed interfaces:

```typescript
interface StylePreset {
  metadata: PresetMetadata;
  backend: VectorizerBackend;
  config: Partial<VectorizerConfig>;
  overrides?: PresetOverrides;
}
```

### Integration Points

1. **PresetSelector Component**: UI component for preset selection
2. **Converter Utility**: Maps presets to WASM configurations
3. **Settings Panel**: Integrates preset selection with parameter controls
4. **Processing Pipeline**: Applies preset configurations during conversion

## Usage

### Basic Usage

```typescript
import { getPresetById, presetToProcessConfig } from '$lib/presets';

// Get a preset by ID
const preset = getPresetById('corporate-logo');

// Convert to WASM config
const config = presetToProcessConfig(preset);

// Process image with preset config
const result = await processImage(image, config);
```

### Recommended Presets

```typescript
import { getRecommendedPresets } from '$lib/presets';

// Get recommendations based on image type
const presets = getRecommendedPresets('photo');
// Returns: [photoToSketch, handDrawn, finePointillism]
```

### Custom Settings

Users can still customize parameters after selecting a preset:

```typescript
import { mergeWithUserConfig } from '$lib/presets/converter';

// Start with preset
const presetConfig = presetToProcessConfig(preset);

// Apply user overrides
const finalConfig = mergeWithUserConfig(presetConfig, {
  stroke_width: 2.5,
  detail: 0.8
});
```

## Performance Considerations

### Processing Times
- **Simple Presets** (Corporate Logo, Technical Drawing): <1.5s
- **Medium Complexity** (Hand-Drawn, Photo to Sketch): <1.5s
- **Higher Complexity** (Fine Pointillism): <2s

### Optimization Strategies
1. Presets use optimal backend selection for each use case
2. Parameters are pre-tuned to balance quality and speed
3. Multi-pass processing only enabled when beneficial
4. SIMD and threading automatically utilized

## Adding New Presets

To add a new preset:

1. Define the preset in `presets.ts`:
```typescript
const newPreset: StylePreset = {
  metadata: {
    id: 'new-preset',
    name: 'New Preset',
    category: 'artistic',
    // ... other metadata
  },
  backend: 'edge',
  config: {
    // WASM configuration
  },
  overrides: {
    // Backend-specific overrides
  }
};
```

2. Add to preset collection:
```typescript
export const presetCollection: PresetCollection = {
  presets: [...existingPresets, newPreset],
  categories: {
    artistic: [...existingIds, 'new-preset']
  }
};
```

3. Update UI icons in PresetSelector if needed

## Testing Presets

Each preset should be tested with:
1. Representative sample images
2. Performance benchmarks
3. Visual quality validation
4. Cross-browser compatibility

## Market Analysis

Based on research, the priority presets address:
- **$17.5B** corporate/logo market (Corporate Logo preset)
- **17.3% CAGR** creative market growth (Hand-Drawn, Fine Pointillism)
- **5.2% CAGR** print production growth (Vintage Stippling)
- Broad consumer appeal (Photo to Sketch)

## Future Enhancements

### Phase 2 (Weeks 3-4)
- Variable dot shapes for Dots backend
- Halftone patterns for vintage effects
- Color palette reduction for poster styles

### Phase 3 (Weeks 5-8)
- Gradient-based shading for pencil sketches
- Cross-hatching generation
- Paper texture overlay system

### Phase 4 (Weeks 9-16)
- Cel Shading/Comic Book algorithm
- Advanced artistic effects

## API Reference

### Core Functions

- `getPresetById(id: string): StylePreset | undefined`
- `getPresetsByCategory(collection, category): StylePreset[]`
- `getPresetsByMarket(presets, segment): StylePreset[]`
- `getRecommendedPresets(imageType): StylePreset[]`
- `presetToProcessConfig(preset): ProcessConfig`
- `getOptimalPreset(imageAnalysis): string`
- `isPresetCompatible(preset, imageInfo): CompatibilityResult`
- `mergeWithUserConfig(presetConfig, userConfig): ProcessConfig`

## Support

For issues or feature requests related to presets, please refer to the main project documentation or create an issue in the repository.