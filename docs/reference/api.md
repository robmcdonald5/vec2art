# API Reference

WASM module API documentation.

## Loading the Module

```typescript
import { loadVectorizer } from "$lib/wasm/loader";

const vectorizer = await loadVectorizer();
```

## WasmVectorizer

Main processing interface.

### Constructor

```typescript
const vectorizer = new wasmModule.WasmVectorizer();
```

Creates a new vectorizer instance with default configuration.

### apply_config_json

```typescript
vectorizer.apply_config_json(configJson: string): void
```

Apply complete configuration from JSON string.

**Parameters:**

- `configJson` - JSON string matching `TraceLowConfig` schema

**Example:**

```typescript
const config = {
  backend: "edge",
  detail: 0.7,
  stroke_width: 1.2,
  enable_multipass: true,
};
vectorizer.apply_config_json(JSON.stringify(config));
```

**Throws:** Error if JSON is invalid or parameters out of range.

### get_config_json

```typescript
vectorizer.get_config_json(): string
```

Get current configuration as JSON string.

**Returns:** JSON string of current `TraceLowConfig`.

### validate_config_json

```typescript
vectorizer.validate_config_json(configJson: string): boolean
```

Validate configuration without applying it.

**Parameters:**

- `configJson` - JSON string to validate

**Returns:** `true` if valid, `false` otherwise.

### vectorize

```typescript
vectorizer.vectorize(imageData: Uint8Array, width: number, height: number): string
```

Process image and generate SVG.

**Parameters:**

- `imageData` - Raw RGBA pixel data
- `width` - Image width in pixels
- `height` - Image height in pixels

**Returns:** SVG string.

**Example:**

```typescript
// Get image data from canvas
const ctx = canvas.getContext("2d");
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Convert to Uint8Array
const pixelData = new Uint8Array(imageData.data.buffer);

// Process
const svg = vectorizer.vectorize(pixelData, canvas.width, canvas.height);
```

### free

```typescript
vectorizer.free(): void
```

Release WASM memory. Call when done with the vectorizer.

## Types

### TraceLowConfig

Main configuration type. Generated from Rust via ts-rs.

```typescript
interface TraceLowConfig {
  backend: TraceBackend;
  detail: number;
  stroke_width: number;
  enable_multipass: boolean;
  pass_count: number;
  noise_filtering: boolean;
  // ... additional fields
}
```

Full definition: `src/lib/types/generated/TraceLowConfig.ts`

### TraceBackend

Algorithm selection enum.

```typescript
type TraceBackend = "edge" | "centerline" | "superpixel" | "dots";
```

### BackgroundRemovalAlgorithm

```typescript
type BackgroundRemovalAlgorithm = "otsu" | "adaptive";
```

### SuperpixelInitPattern

```typescript
type SuperpixelInitPattern = "square" | "hexagonal" | "poisson";
```

### ColorSamplingMethod

```typescript
type ColorSamplingMethod = "average" | "dominant" | "gradient";
```

## Frontend Services

### VectorizerService

High-level processing orchestration.

```typescript
import { vectorizerService } from "$lib/services/vectorizer-service";

const result = await vectorizerService.process(imageData, config);
```

**Methods:**

| Method                       | Description                      |
| ---------------------------- | -------------------------------- |
| `process(imageData, config)` | Process image with configuration |
| `cancel()`                   | Cancel current processing        |
| `isProcessing()`             | Check if processing is active    |

### Config Transformer

Convert between frontend and WASM config formats.

```typescript
import { toWasmConfig, fromWasmConfig } from "$lib/types/config-transformer";

// Frontend -> WASM
const wasmConfig = toWasmConfig(frontendConfig);

// WASM -> Frontend
const frontendConfig = fromWasmConfig(wasmConfig);
```

## Web Worker Protocol

Messages between main thread and processing worker.

### Request

```typescript
interface ProcessRequest {
  type: "process";
  imageData: ArrayBuffer;
  width: number;
  height: number;
  config: AlgorithmConfig;
}
```

### Response

```typescript
interface ProcessResponse {
  type: "result" | "error" | "progress";
  svg?: string;
  error?: string;
  progress?: number;
}
```

## Error Handling

### WASM Errors

```typescript
try {
  const svg = vectorizer.vectorize(data, width, height);
} catch (error) {
  if (error.message.includes("out of memory")) {
    // Handle memory error
  } else if (error.message.includes("invalid config")) {
    // Handle config error
  }
}
```

### Common Errors

| Error                 | Cause                        | Solution                            |
| --------------------- | ---------------------------- | ----------------------------------- |
| "Invalid config JSON" | Malformed or missing fields  | Validate config before sending      |
| "Out of memory"       | Image too large              | Resize image or increase memory     |
| "Processing timeout"  | Exceeded maxProcessingTimeMs | Increase timeout or simplify params |

## Performance

### Initialization

```typescript
// First call loads WASM module (~50ms)
const vectorizer1 = await loadVectorizer();

// Subsequent calls reuse loaded module (~5ms)
const vectorizer2 = await loadVectorizer();
```

### Processing

| Image Size | Typical Time |
| ---------- | ------------ |
| 512x512    | 200-400ms    |
| 1024x1024  | 400-800ms    |
| 2048x2048  | 800-1500ms   |
| 4096x4096  | 2000-4000ms  |

### Memory

- Base WASM module: ~12MB
- Per-image overhead: ~4x image size
- Freed after processing completes

## Browser Compatibility

### Required Features

- WebAssembly
- Web Workers
- SharedArrayBuffer (for SIMD builds)

### Feature Detection

```typescript
const hasWasm = typeof WebAssembly === "object";
const hasWorkers = typeof Worker !== "undefined";
const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
```

The loader automatically selects SIMD or standard build based on browser capabilities.
