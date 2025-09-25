# vec2art

<div align="center">
  <img src="frontend/static/vec2art-logo.svg" alt="vec2art logo" width="200" height="200" />

  <h3>Professional Image-to-SVG Vectorization in Your Browser</h3>

  [![License: Custom Non-Commercial](https://img.shields.io/badge/License-Custom%20Non--Commercial-orange.svg)](LICENSE)
  [![WebAssembly](https://img.shields.io/badge/WebAssembly-Powered-654ff0.svg)](https://webassembly.org/)
  [![Rust](https://img.shields.io/badge/Rust-Performance-dea584.svg)](https://www.rust-lang.org/)
  [![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-ff3e00.svg)](https://kit.svelte.dev/)

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#algorithms">Algorithms</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#license">License</a>
  </p>
</div>

## Overview

**vec2art** is a cutting-edge browser-based application that transforms raster images (JPG, PNG, WebP) into expressive, scalable SVG line art using high-performance Rust algorithms compiled to WebAssembly. Unlike cloud-based solutions, all processing happens directly in your browser, ensuring complete privacy and lightning-fast performance.

### Why vec2art?

- **🔒 100% Privacy-Focused**: All image processing occurs locally in your browser. No uploads, no cloud, no tracking.
- **⚡ Blazing Fast**: Sub-1.5 second processing for typical images using optimized Rust/WASM algorithms
- **🎨 Four Artistic Styles**: Choose from Edge, Dots, Centerline, or Superpixel algorithms for different artistic effects
- **📱 Cross-Platform**: Works on desktop and mobile browsers with WebAssembly support
- **🎯 Professional Quality**: Production-ready vectorization with customizable parameters for fine control
- **♾️ Infinite Scalability**: Generate resolution-independent SVGs perfect for any size

## Live Demo

Try vec2art directly in your browser: [Coming Soon]

<div align="center">
  <img src="docs/images/demo-preview.gif" alt="vec2art demo" width="800" />
</div>

## Features

### Core Capabilities

- **Multi-Format Support**: Process JPG, PNG, WebP, BMP, and GIF images
- **Four Vectorization Algorithms**: Each optimized for different artistic styles and use cases
- **Real-Time Parameter Control**: Adjust detail, stroke width, colors, and effects live
- **Side-by-Side Preview**: Compare original and vectorized images instantly
- **Persistent Settings**: Saves your preferences and processing history locally
- **Batch Processing**: Convert multiple images with consistent settings
- **Smart Presets**: Intelligent defaults based on image content analysis

### Technical Excellence

- **Rust Performance**: Core algorithms written in Rust for maximum speed
- **WebAssembly Integration**: Seamless browser execution with near-native performance
- **Single-Threaded Stability**: Reliable WASM architecture with Web Worker parallelism
- **Memory Efficient**: Optimized buffer management for large images
- **Progressive Enhancement**: Graceful fallbacks for older browsers

## Algorithms

vec2art provides four specialized vectorization algorithms, each producing unique artistic styles:

### 1. Edge Detection (Default)
**Best for**: Line drawings, sketches, technical illustrations, comics
- Uses optimized Canny edge detection with adaptive thresholds
- Produces clean, continuous strokes with natural line variation
- Supports multi-pass processing for enhanced detail capture
- **Performance**: <1.5s for typical images

### 2. Dots/Stippling
**Best for**: Portraits, artistic effects, vintage illustrations
- Adaptive stippling with content-aware dot placement
- Variable dot sizes based on image luminance
- Optional color preservation for chromatic stippling
- **Performance**: <1s with density-based optimization

### 3. Centerline Extraction
**Best for**: Logos, text, bold graphics, high-contrast images
- Zhang-Suen thinning algorithm for skeleton extraction
- Single-pixel width paths for precise geometric representation
- Morphological processing for clean results
- **Performance**: <2s for complex shapes

### 4. Superpixel Segmentation
**Best for**: Abstract art, stylized illustrations, color-rich images
- SLIC (Simple Linear Iterative Clustering) segmentation
- Generates polygonal regions based on color/texture similarity
- Multiple artistic modes: outlined, filled, or mixed
- **Performance**: <1.5s with adaptive region count

### Algorithm Comparison

| Algorithm | Best Use Case | Style | Processing Time | Output Complexity |
|-----------|--------------|-------|-----------------|-------------------|
| Edge | Technical drawings | Clean lines | <1.5s | Medium |
| Dots | Artistic portraits | Stippling | <1s | High |
| Centerline | Logos & text | Skeleton | <2s | Low |
| Superpixel | Abstract art | Polygonal | <1.5s | Medium |

## Technical Architecture

```
vec2art/
├── Frontend (SvelteKit 5)
│   ├── TypeScript for type safety
│   ├── Tailwind CSS 4 for styling
│   ├── Dexie.js for IndexedDB storage
│   └── Web Workers for responsive UI
│
├── Processing Engine (Rust/WASM)
│   ├── vectorize-core: Shared algorithms
│   ├── vectorize-wasm: Browser bindings
│   └── vectorize-cli: Native testing tool
│
└── Architecture Features
    ├── Single-threaded WASM for stability
    ├── Web Worker parallelism for UI responsiveness
    ├── No server requirements (100% client-side)
    └── Progressive Web App capabilities
```

## Installation

### For End Users

vec2art runs entirely in your browser - no installation required! Simply visit [Coming Soon] to start converting images.

### For Developers

#### Prerequisites

- Node.js 18+ and npm
- Rust toolchain (stable)
- wasm-pack (`cargo install wasm-pack`)

#### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/vec2art.git
cd vec2art

# Install frontend dependencies
cd frontend
npm install

# Build WASM module
npm run build:wasm

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

#### Build for Production

```bash
# From frontend directory
npm run build

# Preview production build
npm run preview
```

## Usage

### Basic Workflow

1. **Upload**: Drag and drop an image or click to browse
2. **Select Algorithm**: Choose from Edge, Dots, Centerline, or Superpixel
3. **Adjust Parameters**: Fine-tune settings for your desired output
4. **Process**: Click "Convert" to generate SVG
5. **Download**: Save as SVG, PNG, or PDF

### Advanced Parameters

#### Edge Detection
- `detail`: Line sensitivity (0.1-1.0)
- `stroke-width`: Line thickness (0.5-5.0)
- `multipass`: Enable directional scanning
- `hand-drawn`: Add natural line variation

#### Dots/Stippling
- `dot-density`: Point concentration (0.01-0.5)
- `min-size`: Minimum dot radius
- `max-size`: Maximum dot radius
- `preserve-colors`: Maintain original colors

#### Centerline
- `threshold`: Binary threshold value
- `min-length`: Minimum path length
- `smoothing`: Path smoothing factor

#### Superpixel
- `regions`: Number of segments (10-500)
- `compactness`: Region regularity (1-40)
- `style`: outlined/filled/mixed

## Browser Compatibility

vec2art requires a modern browser with WebAssembly support:

- ✅ Chrome/Edge 90+
- ✅ Firefox 89+
- ✅ Safari 15+ (Not working currently, memory issues)
- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS 13 works, 14+ has memory issues)

## Performance Benchmarks

Testing on 2048×2048 images (MacBook Pro M1):

| Operation | Time | Memory |
|-----------|------|--------|
| WASM Init | ~50ms | 4MB |
| Image Load | ~100ms | Variable |
| Edge Detection | ~800ms | 16MB |
| Dots Generation | ~600ms | 12MB |
| SVG Export | ~200ms | 8MB |
| **Total (typical)** | **<1.5s** | **<40MB** |

## Privacy & Security

vec2art is designed with privacy as a core principle:

- ✅ **No Server Processing**: All computation happens in your browser
- ✅ **No Data Collection**: No analytics, tracking, or telemetry
- ✅ **No External Requests**: Works offline after initial load
- ✅ **No Account Required**: Use without registration
- ✅ **Local Storage Only**: Settings saved locally in your browser
- ✅ **Open for Inspection**: Source code available for security audit

## Contributing

While this is primarily a portfolio project, suggestions and bug reports are welcome! Please open an issue on GitHub to discuss potential improvements.

### Development Guidelines

1. **Code Style**: Run `npm run format` before committing
2. **Testing**: Ensure all tests pass with `npm test`
3. **Type Safety**: Maintain strict TypeScript typing
4. **Performance**: Profile changes that affect processing speed
5. **Accessibility**: Maintain WCAG 2.1 AA compliance

## License

This project is licensed under a **Custom Non-Commercial License** - see the [LICENSE](LICENSE) file for details.

### Key Terms:
- ✅ **View and study** the source code
- ✅ **Personal use** for learning and evaluation
- ✅ **Educational use** in academic settings
- ❌ **Commercial use** without permission
- ❌ **Redistribution** of code
- ❌ **Creating derivative works**

For commercial licensing inquiries, please contact [your contact info].

## Dependencies & Credits

vec2art builds upon excellent open-source foundations:

### Core Technologies
- [Rust](https://www.rust-lang.org/) - Systems programming language
- [WebAssembly](https://webassembly.org/) - Binary instruction format
- [SvelteKit](https://kit.svelte.dev/) - Web application framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

### Key Libraries
- [image-rs](https://github.com/image-rs/image) - Rust image processing
- [imageproc](https://github.com/image-rs/imageproc) - Image processing algorithms
- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) - WASM bindings
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper

### Algorithm Inspirations
- Canny Edge Detection (John F. Canny, 1986)
- Zhang-Suen Thinning Algorithm (T.Y. Zhang & C.Y. Suen, 1984)
- SLIC Superpixels (Achanta et al., 2012)

## Support

For issues, questions, or suggestions:

- [Open an Issue](https://github.com/yourusername/vec2art/issues)
- X: [@vec2art]

---

<div align="center">
  <p>Built with ❤️ using Rust, WebAssembly, and SvelteKit</p>
  <p>© 2025 Joshua McDonald. All rights reserved.</p>
</div>