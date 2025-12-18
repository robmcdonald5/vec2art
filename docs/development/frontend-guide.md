# Frontend Guide

SvelteKit 5 development patterns and conventions.

## Development Server

```bash
cd frontend
npm run dev
```

Runs at `http://localhost:5173`. Assumes dev server is always running during development.

## Project Conventions

### Svelte 5 Runes

Use runes for all reactive state:

```typescript
// State declaration
let count = $state(0);

// Derived values
let doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log("count changed:", count);
});
```

### Store Pattern

Stores use `.svelte.ts` extension:

```typescript
// stores/example.svelte.ts
class ExampleStore {
  private value = $state<string>("");

  get current() {
    return this.value;
  }

  set(newValue: string) {
    this.value = newValue;
  }
}

export const exampleStore = new ExampleStore();
```

### Component Structure

```svelte
<script lang="ts">
  import { type ComponentProps } from './types';

  let { prop1, prop2 = 'default' }: ComponentProps = $props();

  let internalState = $state(false);
</script>

<div class="component-wrapper">
  <!-- content -->
</div>

<style>
  /* scoped styles if needed */
</style>
```

## Styling

### Tailwind CSS 4

Utility-first approach:

```svelte
<button class="px-4 py-2 bg-ferrari-500 text-white rounded hover:bg-ferrari-600">
  Click me
</button>
```

### Color System

| Palette       | Usage          | Proportion |
| ------------- | -------------- | ---------- |
| Ferrari (red) | Primary accent | 10-15%     |
| Speed (gray)  | UI elements    | 85-90%     |

```css
/* Primary colors */
bg-ferrari-500      /* #DC143C - Primary accent */
bg-ferrari-600      /* Hover state */
text-speed-gray-700 /* Body text */
bg-speed-gray-100   /* Backgrounds */
```

### Dark Mode

Dark mode classes preserved but currently disabled:

```typescript
// +layout.svelte
document.documentElement.classList.remove("dark");
```

Components contain `dark:` variants for future implementation.

## WASM Integration

### Loading the Module

```typescript
import { loadVectorizer } from "$lib/wasm/loader";

const vectorizer = await loadVectorizer();
```

### Processing Images

```typescript
import { vectorizerService } from "$lib/services/vectorizer-service";

const result = await vectorizerService.process(imageData, config);
```

Configuration is automatically transformed from frontend format to WASM format.

## Component Library

### UI Components

Located in `src/lib/components/ui/`:

| Component  | Purpose                      |
| ---------- | ---------------------------- |
| `button/`  | Action buttons with variants |
| `modal/`   | Dialog overlays              |
| `slider/`  | Range input controls         |
| `toast/`   | Notification system          |
| `tooltip/` | Hover information            |

### Using Components

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import { Modal } from '$lib/components/ui/modal';
</script>

<Button variant="default" onclick={handleClick}>
  Process Image
</Button>
```

## Validation

### Zod Schemas

Runtime validation for external data:

```typescript
import { z } from "zod";

const ConfigSchema = z.object({
  algorithm: z.enum(["edge", "dots", "centerline", "superpixel"]),
  detail: z.number().min(0).max(1),
});

const validated = ConfigSchema.parse(input);
```

## Testing

### Unit Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### E2E Tests

```bash
npm run test:e2e      # Playwright tests
npm run test:e2e -- --headed  # Visible browser
```

See [Testing](testing.md) for complete test documentation.

## Code Quality

### Before Committing

```bash
npm run format        # Prettier formatting
npm run lint          # ESLint checks
npm run check         # TypeScript/Svelte checks
```

### CI Pipeline Commands

```bash
npx prettier --check .
npx eslint . --max-warnings=0
npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
npm run build
```

## Key Files

| File                                       | Purpose                  |
| ------------------------------------------ | ------------------------ |
| `src/routes/+layout.svelte`                | Root layout, theme setup |
| `src/routes/converter/+page.svelte`        | Main converter interface |
| `src/lib/stores/converter-state.svelte.ts` | Processing state         |
| `src/lib/services/vectorizer-service.ts`   | WASM orchestration       |
| `vite.config.ts`                           | Build configuration      |
| `svelte.config.js`                         | SvelteKit configuration  |

## Common Patterns

### Error Handling

```typescript
try {
  const result = await vectorizerService.process(data, config);
  toastStore.success("Processing complete");
} catch (error) {
  toastStore.error(`Processing failed: ${error.message}`);
  console.error(error);
}
```

### Loading States

```svelte
<script>
  let isLoading = $state(false);

  async function handleProcess() {
    isLoading = true;
    try {
      await process();
    } finally {
      isLoading = false;
    }
  }
</script>

<Button disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Process'}
</Button>
```

### Responsive Design

Mobile-first with breakpoint prefixes:

```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- content -->
</div>
```

| Breakpoint | Width  |
| ---------- | ------ |
| `sm:`      | 640px  |
| `md:`      | 768px  |
| `lg:`      | 1024px |
| `xl:`      | 1280px |
