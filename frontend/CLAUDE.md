# frontend/CLAUDE.md

This document provides SvelteKit-specific implementation guidelines for the vec2art frontend application.

## Component Architecture

### File Structure
```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── FileInput.svelte
│   │   ├── ControlPanel.svelte
│   │   ├── PreviewPane.svelte
│   │   └── SVGDisplay.svelte
│   ├── stores/           # Svelte stores for state management
│   │   ├── image.ts      # Image data and metadata
│   │   ├── settings.ts   # Conversion parameters
│   │   └── output.ts     # Generated SVG result
│   ├── utils/            # Helper functions
│   │   └── wasm-loader.ts
│   └── wasm/             # Compiled WASM module (generated)
├── routes/
│   ├── +page.svelte      # Main editor page
│   ├── +layout.svelte    # App layout
│   └── about/
│       └── +page.svelte  # About page
└── app.html              # HTML template
```

---

## WASM Integration

### Loading the WASM Module

```typescript
// lib/utils/wasm-loader.ts
import init, { convert, init_workers } from '$lib/wasm/vec2art';

let wasmInitialized = false;

export async function initializeWasm() {
    if (!wasmInitialized) {
        await init();
        // Initialize Web Workers for parallel processing
        await init_workers(navigator.hardwareConcurrency || 4);
        wasmInitialized = true;
    }
}

export async function convertImage(
    imageBytes: Uint8Array,
    params: ConversionParameters
): Promise<string> {
    await initializeWasm();
    try {
        return convert(imageBytes, params);
    } catch (error) {
        console.error('Conversion failed:', error);
        throw new Error(`Conversion failed: ${error}`);
    }
}
```

### TypeScript Types

```typescript
// lib/types.ts
export interface ConversionParameters {
    algorithm: 'path_tracer' | 'geometric_fitter' | 'edge_detector';
    pathTracer?: PathTracerParams;
    geometricFitter?: GeometricFitterParams;
    edgeDetector?: EdgeDetectorParams;
}

export interface PathTracerParams {
    numColors: number;
    curveSmoothing: number;
    suppressSpeckles: number;
}

export interface ImageMetadata {
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
}
```

---

## State Management

### Svelte Stores Pattern

```typescript
// lib/stores/image.ts
import { writable, derived } from 'svelte/store';
import type { ImageMetadata } from '$lib/types';

export const imageData = writable<Uint8Array | null>(null);
export const imageMetadata = writable<ImageMetadata | null>(null);

export const hasImage = derived(
    imageData,
    $imageData => $imageData !== null
);

// lib/stores/settings.ts
import { writable } from 'svelte/store';
import type { ConversionParameters } from '$lib/types';

const defaultParams: ConversionParameters = {
    algorithm: 'path_tracer',
    pathTracer: {
        numColors: 8,
        curveSmoothing: 0.5,
        suppressSpeckles: 0.1
    }
};

export const conversionParams = writable<ConversionParameters>(defaultParams);

// lib/stores/output.ts
import { writable } from 'svelte/store';

export const svgOutput = writable<string>('');
export const isProcessing = writable<boolean>(false);
export const processingProgress = writable<number>(0);
```

---

## Component Patterns

### File Input Component

```svelte
<!-- lib/components/FileInput.svelte -->
<script lang="ts">
    import { imageData, imageMetadata } from '$lib/stores/image';
    
    const acceptedFormats = '.jpg,.jpeg,.png,.webp';
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    async function handleFileSelect(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        if (file.size > maxFileSize) {
            alert('File too large. Maximum size is 10MB.');
            return;
        }
        
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        $imageData = bytes;
        $imageMetadata = {
            width: 0, // Will be populated after decoding
            height: 0,
            format: file.type,
            sizeBytes: file.size
        };
    }
    
    function handleDrop(event: DragEvent) {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file) {
            const fakeEvent = { target: { files: [file] } };
            handleFileSelect(fakeEvent as any);
        }
    }
</script>
```

### Control Panel Component

```svelte
<!-- lib/components/ControlPanel.svelte -->
<script lang="ts">
    import { conversionParams } from '$lib/stores/settings';
    import { convertImage } from '$lib/utils/wasm-loader';
    
    export let onConvert: () => void;
    
    $: params = $conversionParams;
    
    function updateParam(key: string, value: any) {
        conversionParams.update(p => ({
            ...p,
            [key]: value
        }));
    }
</script>
```

---

## Web Worker Integration

### Worker Setup

```typescript
// static/wasm-worker.js
import init, { convert } from '/wasm/vec2art.js';

let initialized = false;

self.addEventListener('message', async (event) => {
    const { imageData, params } = event.data;
    
    if (!initialized) {
        await init();
        initialized = true;
    }
    
    try {
        const result = convert(imageData, params);
        self.postMessage({ success: true, svg: result });
    } catch (error) {
        self.postMessage({ success: false, error: error.toString() });
    }
});
```

### Worker Usage

```typescript
// lib/utils/worker-pool.ts
export class WorkerPool {
    private workers: Worker[] = [];
    private queue: Array<{
        data: any;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    
    constructor(size: number = 4) {
        for (let i = 0; i < size; i++) {
            this.workers.push(new Worker('/wasm-worker.js', { type: 'module' }));
        }
    }
    
    async process(imageData: Uint8Array, params: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const worker = this.getAvailableWorker();
            worker.postMessage({ imageData, params });
            worker.onmessage = (e) => {
                if (e.data.success) {
                    resolve(e.data.svg);
                } else {
                    reject(new Error(e.data.error));
                }
            };
        });
    }
    
    private getAvailableWorker(): Worker {
        // Round-robin or load balancing logic
        return this.workers[0];
    }
}
```

---

## Testing

### Unit Testing with Vitest

```typescript
// tests/stores/image.test.ts
import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { imageData, hasImage } from '$lib/stores/image';

describe('Image Store', () => {
    it('should update hasImage when imageData changes', () => {
        expect(get(hasImage)).toBe(false);
        
        imageData.set(new Uint8Array([1, 2, 3]));
        expect(get(hasImage)).toBe(true);
        
        imageData.set(null);
        expect(get(hasImage)).toBe(false);
    });
});
```

### E2E Testing with Playwright

```typescript
// tests/e2e/conversion.test.ts
import { test, expect } from '@playwright/test';

test('should convert image to SVG', async ({ page }) => {
    await page.goto('/');
    
    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Adjust parameters
    await page.locator('#num-colors').fill('16');
    
    // Convert
    await page.locator('button:has-text("Convert")').click();
    
    // Check for SVG output
    await expect(page.locator('.svg-preview')).toBeVisible();
    
    // Download SVG
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Download")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.svg');
});
```

---

## Performance Optimization

### Lazy Loading

```typescript
// routes/+page.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    
    let WasmModule;
    
    onMount(async () => {
        // Lazy load WASM module
        WasmModule = await import('$lib/utils/wasm-loader');
        await WasmModule.initializeWasm();
    });
</script>
```

### Image Preview Optimization

```typescript
// lib/utils/image-preview.ts
export function createThumbnail(
    imageData: Uint8Array,
    maxWidth: number = 200,
    maxHeight: number = 200
): Promise<string> {
    return new Promise((resolve) => {
        const blob = new Blob([imageData]);
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            
            const scale = Math.min(
                maxWidth / img.width,
                maxHeight / img.height
            );
            
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.8));
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    });
}
```

---

## Build Configuration

### vite.config.ts

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        fs: {
            allow: ['..'] // Allow serving WASM files
        }
    },
    optimizeDeps: {
        exclude: ['vec2art'] // Exclude WASM module from optimization
    }
});
```

### svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: undefined,
            precompress: false,
            strict: true
        }),
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/vec2art' : ''
        }
    }
};
```

---

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
# Start dev server with HMR
npm run dev

# Start dev server on specific port
npm run dev -- --port 3000
```

### Testing
```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test
```

### Build & Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Lint code
npm run lint
```

### Type Checking
```bash
# Check TypeScript types
npm run check

# Watch for type errors
npm run check:watch
```