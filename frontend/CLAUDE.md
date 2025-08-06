# frontend/CLAUDE.md

This document provides SvelteKit 5-specific implementation guidelines for the vec2art frontend application. You are an expert SvelteKit 5 developer specializing in creating clean, robust, and high-performance frontend code using **SvelteKit 5, TypeScript, Tailwind CSS 4, and Zod**.

## Core Architectural Principles

### Core Rules of Engagement

1. **TypeScript is Mandatory:** All Svelte components (`<script lang="ts">`) and logic files MUST use TypeScript in strict mode. Type safety is non-negotiable.
2. **Source of Truth:** The Project Knowledge Base section is your single source of truth for components, stores, and types.
3. **Shadcn-Svelte for UI:** All UI elements MUST be implemented using the pre-installed Shadcn-Svelte components.
4. **Styling is Tailwind ONLY:** Apply all styling directly via Tailwind CSS utility classes. DO NOT write custom CSS in `<style>` blocks.
5. **Component Granularity:** Keep components small and focused on a single responsibility.

### Modern SvelteKit 5 Principles

1. **Runes for All State Management:** Svelte 5 Runes are the **only** way we manage state. Use `let x = $state()` for local reactive state, `$derived` for computed values, and custom functions exported from `.ts` files for shared state. **The legacy store API (`writable`, `get`) is forbidden.**
2. **Progressive Enhancement with Form Actions:** All data mutations (create, update, delete) MUST be handled through SvelteKit Form Actions in `+page.server.ts`. Use the `enhance` action on the frontend for better UX.
3. **End-to-End Type Safety with Zod:** All data entering our system (form submissions, API responses, WASM parameters) MUST be validated using Zod schemas. This ensures runtime safety and provides inferred types throughout the app.

---

## Project Knowledge Base

### File Structure
```
src/
├── lib/
│   ├── components/       # Reusable app-specific components
│   │   ├── FileInput.svelte
│   │   ├── ControlPanel.svelte
│   │   ├── PreviewPane.svelte
│   │   └── SVGDisplay.svelte
│   ├── components/ui/    # Shadcn-Svelte UI primitives
│   │   ├── button/
│   │   ├── card/
│   │   ├── input/
│   │   └── slider/
│   ├── stores/           # Rune-based shared state
│   │   ├── image.ts      # Image data and metadata
│   │   ├── settings.ts   # Conversion parameters
│   │   └── output.ts     # Generated SVG result
│   ├── types/            # TypeScript types & Zod schemas
│   │   ├── conversion.ts # ConversionParameters schema
│   │   └── image.ts      # Image-related schemas
│   ├── utils/            # Helper functions
│   │   └── wasm-loader.ts
│   └── wasm/             # Compiled WASM module (generated)
├── routes/
│   ├── +page.svelte      # Main editor page
│   ├── +page.server.ts   # Form actions
│   ├── +layout.svelte    # App layout
│   └── about/
│       └── +page.svelte  # About page
└── app.html              # HTML template
```

**Component Alias:** `$` points to `src/lib`

### Available Shadcn-Svelte Components

#### Button
- **Import:** `import { Button } from '$lib/components/ui/button';`
- **Usage:** `<Button variant="destructive" size="lg">Delete</Button>`

#### Card
- **Import:** `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';`

#### Input
- **Import:** `import { Input } from '$lib/components/ui/input';`

#### Slider
- **Import:** `import { Slider } from '$lib/components/ui/slider';`

---

## State Management with Svelte 5 Runes

### Component-Local State Pattern
```svelte
<script lang="ts">
  let count = $state(0);
  let double = $derived(count * 2);

  function increment() {
    count++;
  }
</script>

<p>Count: {count}, Double: {double}</p>
<Button onclick={increment}>Increment</Button>
```

### Shared State Store Pattern
```typescript
// lib/stores/image.ts
import type { ImageMetadata } from '$lib/types/image';

interface ImageStore {
  data: Uint8Array | null;
  metadata: ImageMetadata | null;
  hasImage: boolean;
}

function createImageStore() {
  let data = $state<Uint8Array | null>(null);
  let metadata = $state<ImageMetadata | null>(null);
  
  return {
    get data() { return data; },
    set data(value: Uint8Array | null) { data = value; },
    
    get metadata() { return metadata; },
    set metadata(value: ImageMetadata | null) { metadata = value; },
    
    get hasImage() { return data !== null; },
    
    reset() {
      data = null;
      metadata = null;
    }
  };
}

export const imageStore = createImageStore();
```

### Conversion Settings Store
```typescript
// lib/stores/settings.ts
import { z } from 'zod';
import { ConversionParametersSchema } from '$lib/types/conversion';

type ConversionParameters = z.infer<typeof ConversionParametersSchema>;

function createSettingsStore() {
  let params = $state<ConversionParameters>({
    algorithm: 'path_tracer',
    pathTracer: {
      numColors: 8,
      curveSmoothing: 0.5,
      suppressSpeckles: 0.1
    }
  });
  
  return {
    get params() { return params; },
    
    updateAlgorithm(algorithm: ConversionParameters['algorithm']) {
      params.algorithm = algorithm;
    },
    
    updatePathTracerSettings(settings: Partial<ConversionParameters['pathTracer']>) {
      if (params.pathTracer) {
        params.pathTracer = { ...params.pathTracer, ...settings };
      }
    },
    
    validate(): boolean {
      try {
        ConversionParametersSchema.parse(params);
        return true;
      } catch {
        return false;
      }
    }
  };
}

export const settingsStore = createSettingsStore();
```

---

## Type Safety with Zod

### Conversion Parameters Schema
```typescript
// lib/types/conversion.ts
import { z } from 'zod';

export const PathTracerParamsSchema = z.object({
  numColors: z.number().min(2).max(256),
  curveSmoothing: z.number().min(0).max(1),
  suppressSpeckles: z.number().min(0).max(1)
});

export const GeometricFitterParamsSchema = z.object({
  shapeType: z.enum(['circles', 'rectangles', 'triangles']),
  maxShapes: z.number().min(10).max(10000),
  minSize: z.number().min(1).max(100)
});

export const EdgeDetectorParamsSchema = z.object({
  threshold: z.number().min(0).max(255),
  kernel: z.enum(['sobel', 'canny', 'laplacian'])
});

export const ConversionParametersSchema = z.object({
  algorithm: z.enum(['path_tracer', 'geometric_fitter', 'edge_detector']),
  pathTracer: PathTracerParamsSchema.optional(),
  geometricFitter: GeometricFitterParamsSchema.optional(),
  edgeDetector: EdgeDetectorParamsSchema.optional()
});

export type ConversionParameters = z.infer<typeof ConversionParametersSchema>;
```

### Image Metadata Schema
```typescript
// lib/types/image.ts
import { z } from 'zod';

export const ImageMetadataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.string(),
  sizeBytes: z.number().positive()
});

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

export const ImageUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'File size must be less than 10MB'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'File must be a JPEG, PNG, or WebP image'
  )
});
```

---

## WASM Integration

### Loading the WASM Module
```typescript
// lib/utils/wasm-loader.ts
import init, { convert, init_workers } from '$lib/wasm/vec2art';
import { ConversionParametersSchema } from '$lib/types/conversion';
import type { ConversionParameters } from '$lib/types/conversion';

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
    
    // Validate parameters before sending to WASM
    const validatedParams = ConversionParametersSchema.parse(params);
    
    try {
        return convert(imageBytes, validatedParams);
    } catch (error) {
        console.error('Conversion failed:', error);
        throw new Error(`Conversion failed: ${error}`);
    }
}
```

---

## Component Patterns

### File Input Component with Validation
```svelte
<!-- lib/components/FileInput.svelte -->
<script lang="ts">
  import { imageStore } from '$lib/stores/image';
  import { ImageUploadSchema } from '$lib/types/image';
  import { Button } from '$lib/components/ui/button';
  
  let fileInput: HTMLInputElement;
  let error = $state<string | null>(null);
  let isDragging = $state(false);
  
  async function handleFile(file: File) {
    error = null;
    
    try {
      // Validate file
      ImageUploadSchema.parse({ file });
      
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Create image to get dimensions
      const blob = new Blob([bytes], { type: file.type });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      imageStore.data = bytes;
      imageStore.metadata = {
        width: img.width,
        height: img.height,
        format: file.type,
        sizeBytes: file.size
      };
      
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof z.ZodError) {
        error = e.errors[0].message;
      } else {
        error = 'Failed to load image';
      }
    }
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }
  
  function handleDragLeave() {
    isDragging = false;
  }
</script>

<div
  class="relative border-2 border-dashed rounded-lg p-8 transition-colors {isDragging ? 'border-primary bg-primary/5' : 'border-border'}"
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
>
  <input
    bind:this={fileInput}
    type="file"
    accept=".jpg,.jpeg,.png,.webp"
    onchange={(e) => {
      const file = e.currentTarget.files?.[0];
      if (file) handleFile(file);
    }}
    class="hidden"
  />
  
  <div class="text-center">
    <p class="text-muted-foreground mb-4">
      Drag and drop an image here, or click to browse
    </p>
    <Button onclick={() => fileInput.click()}>
      Choose Image
    </Button>
  </div>
  
  {#if error}
    <p class="text-destructive text-sm mt-4">{error}</p>
  {/if}
</div>
```

### Control Panel Component
```svelte
<!-- lib/components/ControlPanel.svelte -->
<script lang="ts">
  import { settingsStore } from '$lib/stores/settings';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Slider } from '$lib/components/ui/slider';
  import { Button } from '$lib/components/ui/button';
  
  const settings = settingsStore;
  
  export let onConvert: () => void;
  export let isProcessing = false;
</script>

<Card>
  <CardHeader>
    <CardTitle>Conversion Settings</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    {#if settings.params.algorithm === 'path_tracer' && settings.params.pathTracer}
      <div>
        <label class="text-sm font-medium">Number of Colors</label>
        <Slider
          value={[settings.params.pathTracer.numColors]}
          onValueChange={(values) => {
            settings.updatePathTracerSettings({ numColors: values[0] });
          }}
          min={2}
          max={256}
          step={1}
        />
        <span class="text-xs text-muted-foreground">
          {settings.params.pathTracer.numColors} colors
        </span>
      </div>
      
      <div>
        <label class="text-sm font-medium">Curve Smoothing</label>
        <Slider
          value={[settings.params.pathTracer.curveSmoothing]}
          onValueChange={(values) => {
            settings.updatePathTracerSettings({ curveSmoothing: values[0] });
          }}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      
      <div>
        <label class="text-sm font-medium">Suppress Speckles</label>
        <Slider
          value={[settings.params.pathTracer.suppressSpeckles]}
          onValueChange={(values) => {
            settings.updatePathTracerSettings({ suppressSpeckles: values[0] });
          }}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    {/if}
    
    <Button 
      onclick={onConvert}
      disabled={isProcessing || !settings.validate()}
      class="w-full"
    >
      {isProcessing ? 'Processing...' : 'Convert to SVG'}
    </Button>
  </CardContent>
</Card>
```

---

## Form Actions Pattern

### Server-Side Processing
```typescript
// routes/+page.server.ts
import { fail } from '@sveltejs/kit';
import { ConversionParametersSchema } from '$lib/types/conversion';
import type { Actions } from './$types';

export const actions = {
  convert: async ({ request }) => {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const paramsJson = formData.get('params') as string;
    
    if (!imageFile) {
      return fail(400, { error: 'No image provided' });
    }
    
    try {
      const params = ConversionParametersSchema.parse(JSON.parse(paramsJson));
      
      // Process image (in real app, this would call WASM)
      const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
      
      // For progressive enhancement, return result
      return {
        success: true,
        svg: '<svg>...</svg>' // Actual conversion result
      };
    } catch (e) {
      if (e instanceof z.ZodError) {
        return fail(400, { error: 'Invalid parameters', details: e.errors });
      }
      return fail(500, { error: 'Conversion failed' });
    }
  }
} satisfies Actions;
```

### Client-Side Enhancement
```svelte
<!-- routes/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { convertImage } from '$lib/utils/wasm-loader';
  
  let isProcessing = $state(false);
  let result = $state<string | null>(null);
  
  async function handleSubmit(e: SubmitEvent) {
    // For JS-enabled browsers, handle client-side
    e.preventDefault();
    isProcessing = true;
    
    try {
      const svg = await convertImage(imageStore.data!, settingsStore.params);
      result = svg;
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      isProcessing = false;
    }
  }
</script>

<form 
  method="POST" 
  action="?/convert"
  use:enhance
  onsubmit={handleSubmit}
>
  <!-- Form content -->
</form>
```

---

## Web Worker Integration

### Worker Pool Implementation
```typescript
// lib/utils/worker-pool.ts
export class WorkerPool {
    private workers: Worker[] = [];
    private queue: Array<{
        data: any;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    private busyWorkers = new Set<Worker>();
    
    constructor(size: number = navigator.hardwareConcurrency || 4) {
        for (let i = 0; i < size; i++) {
            const worker = new Worker('/wasm-worker.js', { type: 'module' });
            this.workers.push(worker);
        }
    }
    
    async process(imageData: Uint8Array, params: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const worker = this.getAvailableWorker();
            
            if (!worker) {
                this.queue.push({ data: { imageData, params }, resolve, reject });
                return;
            }
            
            this.busyWorkers.add(worker);
            
            worker.postMessage({ imageData, params });
            worker.onmessage = (e) => {
                this.busyWorkers.delete(worker);
                
                if (e.data.success) {
                    resolve(e.data.svg);
                } else {
                    reject(new Error(e.data.error));
                }
                
                this.processQueue();
            };
        });
    }
    
    private getAvailableWorker(): Worker | null {
        for (const worker of this.workers) {
            if (!this.busyWorkers.has(worker)) {
                return worker;
            }
        }
        return null;
    }
    
    private processQueue() {
        if (this.queue.length === 0) return;
        
        const worker = this.getAvailableWorker();
        if (!worker) return;
        
        const { data, resolve, reject } = this.queue.shift()!;
        this.process(data.imageData, data.params).then(resolve).catch(reject);
    }
    
    terminate() {
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.queue = [];
        this.busyWorkers.clear();
    }
}
```

---

## Testing

### Unit Testing with Vitest
```typescript
// tests/stores/settings.test.ts
import { describe, it, expect } from 'vitest';
import { settingsStore } from '$lib/stores/settings';

describe('Settings Store', () => {
    it('should validate correct parameters', () => {
        expect(settingsStore.validate()).toBe(true);
    });
    
    it('should update algorithm', () => {
        settingsStore.updateAlgorithm('geometric_fitter');
        expect(settingsStore.params.algorithm).toBe('geometric_fitter');
    });
    
    it('should update path tracer settings', () => {
        settingsStore.updateAlgorithm('path_tracer');
        settingsStore.updatePathTracerSettings({ numColors: 16 });
        expect(settingsStore.params.pathTracer?.numColors).toBe(16);
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
    
    // Wait for image to load
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Adjust parameters
    await page.locator('[data-testid="num-colors-slider"]').fill('16');
    
    // Convert
    await page.locator('button:has-text("Convert to SVG")').click();
    
    // Check for SVG output
    await expect(page.locator('[data-testid="svg-output"]')).toBeVisible();
    
    // Download SVG
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Download")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.svg');
});
```

---

## Performance Optimization

### Lazy Loading WASM
```svelte
<!-- routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let wasmReady = $state(false);
  
  onMount(async () => {
    // Lazy load WASM module
    const { initializeWasm } = await import('$lib/utils/wasm-loader');
    await initializeWasm();
    wasmReady = true;
  });
</script>

{#if !wasmReady}
  <div class="flex items-center justify-center h-screen">
    <p>Loading WebAssembly module...</p>
  </div>
{:else}
  <!-- Main app content -->
{/if}
```

### Image Preview Optimization
```typescript
// lib/utils/image-preview.ts
export function createThumbnail(
    imageData: Uint8Array,
    maxWidth: number = 200,
    maxHeight: number = 200
): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([imageData]);
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            
            const scale = Math.min(
                maxWidth / img.width,
                maxHeight / img.height
            );
            
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('Failed to create thumbnail'));
                }
            }, 'image/jpeg', 0.8);
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
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
    },
    build: {
        target: 'esnext', // Required for top-level await in WASM
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
            fallback: 'index.html', // SPA fallback for client-side routing
            precompress: false,
            strict: true
        }),
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/vec2art' : ''
        },
        alias: {
            $lib: 'src/lib'
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

# Start with HTTPS
npm run dev -- --https
```

### Testing
```bash
# Run unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test
```

### Code Quality
```bash
# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Lint with ESLint
npm run lint

# Type checking
npm run check

# Watch for type errors
npm run check:watch
```

### Build & Deploy
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Build and analyze bundle size
npm run build:analyze
```