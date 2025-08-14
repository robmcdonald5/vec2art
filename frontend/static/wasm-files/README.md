# vectorize-wasm

High-performance WebAssembly module for converting raster images into expressive line art SVGs. Part of the vec2art line tracing engine, optimized for browser deployment with <1.5s processing times.

## Features

- **Ultra-Fast Processing**: <1.5s line tracing with SIMD optimization
- **Multiple Backends**: Edge detection, centerline tracing, superpixel regions, and dot mapping
- **Hand-Drawn Aesthetics**: Variable stroke weights, tremor effects, and natural tapering
- **Multi-Pass Processing**: Standard, reverse, and diagonal passes for comprehensive coverage
- **Zero-Copy Operations**: Efficient image buffer handling
- **TypeScript Support**: Complete type definitions included

## Installation & Integration

### SvelteKit Integration (Recommended)

1. Copy the `pkg/` directory to your SvelteKit project:
```bash
cp -r wasm/vectorize-wasm/pkg src/lib/wasm/
```

2. Import in your Svelte component:
```javascript
// src/lib/wasm.js
import init, { WasmVectorizer } from '$lib/wasm/vectorize_wasm.js';

let wasmModule = null;

export async function initWasm() {
  if (!wasmModule) {
    await init();
    wasmModule = new WasmVectorizer();
  }
  return wasmModule;
}
```

3. Use in components:
```svelte
<script>
  import { initWasm } from '$lib/wasm.js';
  
  let vectorizer = null;
  
  onMount(async () => {
    vectorizer = await initWasm();
  });
  
  async function processImage(imageData) {
    if (!vectorizer) return;
    
    vectorizer.set_backend('edge');
    const svg = vectorizer.vectorize(imageData);
    return svg;
  }
</script>
```

### Vite Configuration

Add to your `vite.config.js`:
```javascript
export default {
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  optimizeDeps: {
    exclude: ['$lib/wasm/vectorize_wasm.js']
  }
};
```

## Quick Start

### Browser Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>vec2art Line Tracing Demo</title>
</head>
<body>
    <input type="file" id="imageInput" accept="image/*">
    <div id="output"></div>
    
    <script type="module">
        import * as wasm from './pkg/vectorize_wasm.js';
        
        document.getElementById('imageInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Convert image to ImageData
            const image = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            image.onload = async () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Create configuration for line tracing
                const config = new wasm.ConfigBuilder()
                    .backend('edge')
                    .multipass_enabled(true)
                    .hand_drawn_enabled(true)
                    .tremor_intensity(0.3)
                    .weight_variation(0.4)
                    .build();
                
                // Process image to SVG
                const svgString = wasm.process_image_to_svg(
                    new Uint8Array(imageData.data.buffer),
                    imageData.width,
                    imageData.height,
                    config
                );
                
                // Display result
                document.getElementById('output').innerHTML = svgString;
            };
            
            image.src = URL.createObjectURL(file);
        });
    </script>
</body>
</html>
```

### Node.js Example

```javascript
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const wasm = require('@vec2art/vectorize-wasm');

async function processImage(inputPath, outputPath) {
    // Load image
    const image = await loadImage(inputPath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    
    // Create configuration
    const config = new wasm.ConfigBuilder()
        .backend('edge')
        .multipass_enabled(true)
        .hand_drawn_enabled(true)
        .artistic_preset('sketchy')
        .build();
    
    // Process to SVG
    const svgString = wasm.process_image_to_svg(
        new Uint8Array(imageData.data.buffer),
        imageData.width,
        imageData.height,
        config
    );
    
    // Save result
    fs.writeFileSync(outputPath, svgString);
    console.log(`Processed ${inputPath} -> ${outputPath}`);
}

// Usage
processImage('input.jpg', 'output.svg');
```

## API Reference

### ConfigBuilder

The `ConfigBuilder` provides a fluent interface for configuring line tracing parameters:

```typescript
class ConfigBuilder {
    // Backend selection
    backend(name: 'edge' | 'centerline' | 'superpixel' | 'dots'): ConfigBuilder;
    
    // Multi-pass processing
    multipass_enabled(enabled: boolean): ConfigBuilder;
    reverse_pass_enabled(enabled: boolean): ConfigBuilder;
    diagonal_pass_enabled(enabled: boolean): ConfigBuilder;
    
    // Hand-drawn aesthetics
    hand_drawn_enabled(enabled: boolean): ConfigBuilder;
    tremor_intensity(value: number): ConfigBuilder; // 0.0-1.0
    weight_variation(value: number): ConfigBuilder; // 0.0-1.0
    tapering_enabled(enabled: boolean): ConfigBuilder;
    
    // Artistic presets
    artistic_preset(preset: 'clean' | 'sketchy' | 'artistic' | 'expressive'): ConfigBuilder;
    
    // Performance settings
    max_resolution(pixels: number): ConfigBuilder;
    simd_enabled(enabled: boolean): ConfigBuilder;
    
    // Edge detection parameters
    canny_low_threshold(value: number): ConfigBuilder;  // 0.0-1.0
    canny_high_threshold(value: number): ConfigBuilder; // 0.0-1.0
    gaussian_blur_sigma(value: number): ConfigBuilder;  // 0.5-3.0
    
    // Build configuration
    build(): Config;
}
```

### Processing Functions

```typescript
// Main processing function
function process_image_to_svg(
    image_data: Uint8Array,
    width: number,
    height: number,
    config: Config
): string;

// Get processing statistics
function get_last_processing_stats(): ProcessingStats;

// Validate configuration
function validate_config(config: Config): boolean;
```

### Types

```typescript
interface ProcessingStats {
    processing_time_ms: number;
    input_resolution: string;
    output_paths: number;
    multipass_enabled: boolean;
    hand_drawn_enabled: boolean;
    backend_used: string;
}
```

## Configuration Guide

### Backend Options

#### Edge Backend (Default)
Best for detailed line art, drawings, and sketches:

```javascript
const config = new wasm.ConfigBuilder()
    .backend('edge')
    .multipass_enabled(true)
    .canny_low_threshold(0.1)
    .canny_high_threshold(0.3)
    .build();
```

#### Centerline Backend
Best for bold shapes, logos, and high-contrast images:

```javascript
const config = new wasm.ConfigBuilder()
    .backend('centerline')
    .build();
```

#### Superpixel Backend
Best for stylized art and abstract representations:

```javascript
const config = new wasm.ConfigBuilder()
    .backend('superpixel')
    .build();
```

#### Dots Backend
Best for stippling and pointillism effects:

```javascript
const config = new wasm.ConfigBuilder()
    .backend('dots')
    .build();
```

### Artistic Presets

#### Clean
Minimal artistic enhancement for technical drawings:

```javascript
const config = new wasm.ConfigBuilder()
    .artistic_preset('clean')
    .build();
```

#### Sketchy
Light hand-drawn feel with subtle tremor:

```javascript
const config = new wasm.ConfigBuilder()
    .artistic_preset('sketchy')
    .build();
```

#### Artistic
Balanced artistic enhancement:

```javascript
const config = new wasm.ConfigBuilder()
    .artistic_preset('artistic')
    .build();
```

#### Expressive
Maximum artistic enhancement:

```javascript
const config = new wasm.ConfigBuilder()
    .artistic_preset('expressive')
    .build();
```

### Custom Configuration

Fine-tune all parameters:

```javascript
const config = new wasm.ConfigBuilder()
    .backend('edge')
    .multipass_enabled(true)
    .reverse_pass_enabled(true)
    .diagonal_pass_enabled(false)
    .hand_drawn_enabled(true)
    .tremor_intensity(0.4)
    .weight_variation(0.3)
    .tapering_enabled(true)
    .canny_low_threshold(0.1)
    .canny_high_threshold(0.25)
    .gaussian_blur_sigma(1.2)
    .max_resolution(1920 * 1080)
    .simd_enabled(true)
    .build();
```

## Performance Considerations

### Image Size
- Target resolution: 1920×1080 or smaller for optimal performance
- Large images are automatically downscaled while preserving aspect ratio
- Processing time scales approximately linearly with pixel count

### SIMD Optimization
Enable SIMD for ~2x performance improvement on supported browsers:

```javascript
const config = new wasm.ConfigBuilder()
    .simd_enabled(true)
    .build();
```

### Multi-Pass Processing
Control quality vs. speed trade-offs:

```javascript
// Fastest - single pass
const fastConfig = new wasm.ConfigBuilder()
    .multipass_enabled(false)
    .build();

// Balanced - standard + reverse pass
const balancedConfig = new wasm.ConfigBuilder()
    .multipass_enabled(true)
    .reverse_pass_enabled(true)
    .diagonal_pass_enabled(false)
    .build();

// Highest quality - all passes
const qualityConfig = new wasm.ConfigBuilder()
    .multipass_enabled(true)
    .reverse_pass_enabled(true)
    .diagonal_pass_enabled(true)
    .build();
```

## Browser Compatibility

### Minimum Requirements
- WebAssembly support (all modern browsers)
- ES2018+ for full functionality
- Web Workers recommended for non-blocking processing

### SIMD Support
- Chrome 91+
- Firefox 89+
- Safari 16.4+
- Edge 91+

### Feature Detection

```javascript
// Check for WASM support
const wasmSupported = (() => {
    try {
        if (typeof WebAssembly === "object" &&
            typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(
                new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
            );
            return module instanceof WebAssembly.Module;
        }
    } catch (e) {}
    return false;
})();

// Check for SIMD support
const simdSupported = (() => {
    try {
        return WebAssembly.validate(new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x60, 0x01, 0x7b, 0x00,
            0x03, 0x02, 0x01, 0x00,
            0x0a, 0x0a, 0x01, 0x08, 0x00, 0x20, 0x00, 0x1a, 0x0b
        ]));
    } catch (e) {
        return false;
    }
})();
```

## Error Handling

```javascript
try {
    const config = new wasm.ConfigBuilder()
        .backend('edge')
        .build();
    
    const svgResult = wasm.process_image_to_svg(imageData, width, height, config);
    console.log('Processing successful');
} catch (error) {
    if (error.message.includes('Invalid image dimensions')) {
        console.error('Image dimensions are invalid');
    } else if (error.message.includes('Processing timeout')) {
        console.error('Processing took too long, try reducing image size');
    } else {
        console.error('Processing failed:', error.message);
    }
}
```

## Advanced Usage

### Web Workers

Process images in a Web Worker to avoid blocking the main thread:

```javascript
// worker.js
import * as wasm from './pkg/vectorize_wasm.js';

self.onmessage = async function(e) {
    const { imageData, width, height, configParams } = e.data;
    
    try {
        const config = new wasm.ConfigBuilder()
            .backend(configParams.backend)
            .multipass_enabled(configParams.multipass)
            .build();
            
        const svgResult = wasm.process_image_to_svg(
            new Uint8Array(imageData),
            width,
            height,
            config
        );
        
        self.postMessage({ success: true, svg: svgResult });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};

// main.js
const worker = new Worker('worker.js', { type: 'module' });

worker.postMessage({
    imageData: imageData.data,
    width: imageData.width,
    height: imageData.height,
    configParams: { backend: 'edge', multipass: true }
});

worker.onmessage = function(e) {
    if (e.data.success) {
        console.log('Processing complete:', e.data.svg);
    } else {
        console.error('Processing failed:', e.data.error);
    }
};
```

### Batch Processing

```javascript
async function processBatch(images, config) {
    const results = [];
    
    for (const imageData of images) {
        try {
            const svg = wasm.process_image_to_svg(
                new Uint8Array(imageData.data),
                imageData.width,
                imageData.height,
                config
            );
            
            const stats = wasm.get_last_processing_stats();
            results.push({ 
                success: true, 
                svg, 
                stats,
                processingTime: stats.processing_time_ms 
            });
        } catch (error) {
            results.push({ 
                success: false, 
                error: error.message 
            });
        }
    }
    
    return results;
}
```

## Building from Source

### Prerequisites

```bash
# Install Rust and wasm-pack
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown
```

### Build Commands

```bash
# Development build
wasm-pack build --target web --dev

# Release build with optimization
wasm-pack build --target web --release

# Node.js target
wasm-pack build --target nodejs --release

# With features
wasm-pack build --target web --release -- --features simd,telemetry
```

### Custom Build Scripts

Use the provided build scripts for automated building:

```bash
# Unix/Linux/macOS
./scripts/build-wasm.sh release true true

# Windows PowerShell
.\scripts\build-wasm.ps1 -BuildMode release -EnableSIMD $true -RunWasmOpt $true
```

## Troubleshooting

### Common Issues

**"Module not found" errors:**
- Ensure the WASM files are served with correct MIME types
- Use a local HTTP server for development (not file:// protocol)

**Slow processing times:**
- Enable SIMD if supported: `.simd_enabled(true)`
- Reduce image resolution: `.max_resolution(1920 * 1080)`
- Disable multi-pass: `.multipass_enabled(false)`

**Memory errors:**
- Process smaller images or reduce resolution
- Clear ImageData references after processing

**CORS errors:**
- Ensure WASM files are served from the same origin
- Configure proper CORS headers if serving from CDN

### Performance Debugging

```javascript
console.time('wasm-processing');

const svg = wasm.process_image_to_svg(imageData, width, height, config);
const stats = wasm.get_last_processing_stats();

console.timeEnd('wasm-processing');
console.log('Stats:', stats);
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite: `./scripts/test-wasm.sh`
6. Submit a pull request

## Support

- 📖 [Full Documentation](https://github.com/vec2art/vec2art)
- 🐛 [Issue Tracker](https://github.com/vec2art/vec2art/issues)
- 💬 [Discussions](https://github.com/vec2art/vec2art/discussions)