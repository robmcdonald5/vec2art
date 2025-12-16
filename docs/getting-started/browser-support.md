# Browser Support

vec2art requires WebAssembly support. All modern browsers are compatible.

## Compatibility Matrix

| Browser       | Version | Status    | Notes                          |
| ------------- | ------- | --------- | ------------------------------ |
| Chrome/Edge   | 90+     | Supported | Full SIMD optimization         |
| Firefox       | 89+     | Supported | Full SIMD optimization         |
| Safari        | 15+     | Limited   | Memory issues on some versions |
| Chrome Mobile | 90+     | Supported | Full functionality             |
| Safari iOS    | 13      | Supported | Basic functionality            |
| Safari iOS    | 14+     | Limited   | Memory constraints             |

## WASM Module Selection

The application automatically selects the optimal WASM module:

| Module         | Browsers                       | Performance                 |
| -------------- | ------------------------------ | --------------------------- |
| SIMD-optimized | Chrome, Firefox, Edge (modern) | ~6x faster                  |
| Standard       | Safari, older browsers         | ~4x faster than JS baseline |

Detection happens at runtime. No configuration required.

## Known Limitations

### Safari/iOS Memory Issues

Safari on iOS 14+ has memory constraints that may cause issues with large images. Workarounds:

- Resize images to under 1024x1024 before upload
- Close other browser tabs to free memory
- Use Chrome on iOS if available

### Cross-Origin Isolation

WASM threading features require Cross-Origin Isolation headers. These are configured automatically on the hosted version. Self-hosted deployments need:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Offline Usage

After initial page load, vec2art works offline. All processing happens locally in your browser.

## Feature Detection

The application detects capabilities at startup:

- WebAssembly support
- SIMD instruction support
- SharedArrayBuffer availability
- Available memory

Unsupported features trigger automatic fallback to compatible alternatives.

## Troubleshooting

| Issue                       | Solution                                         |
| --------------------------- | ------------------------------------------------ |
| "WebAssembly not supported" | Update browser to current version                |
| Slow processing             | Enable hardware acceleration in browser settings |
| Memory errors               | Reduce image size or close other tabs            |
| Processing hangs            | Refresh page and retry with smaller image        |
