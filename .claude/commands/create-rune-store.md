# Create Rune Store

Creates a new Svelte 5 Rune-based shared state store following the project's patterns with TypeScript and Zod validation.

## Usage
```
/create-rune-store <store-name> [validation]
```

## Arguments
- `store-name`: Name of the store in camelCase (e.g., imageProcessor)
- `validation`: Optional - whether to include Zod validation (true/false, defaults to true)

## Examples
```
/create-rune-store userPreferences
/create-rune-store processingQueue false
/create-rune-store conversionHistory true
```

## Template Locations
Store files are created in `src/lib/stores/`

## Basic Store Template (without validation)
```typescript
// lib/stores/storeName.ts

interface StoreState {
  // Define your state shape here
  items: any[];
  isLoading: boolean;
  error: string | null;
}

function createStoreName() {
  // State using Svelte 5 Runes
  let items = $state<any[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // Derived values
  let itemCount = $derived(items.length);
  let hasError = $derived(error !== null);
  
  return {
    // Getters
    get items() { return items; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    get itemCount() { return itemCount; },
    get hasError() { return hasError; },
    
    // Actions
    addItem(item: any) {
      items = [...items, item];
    },
    
    removeItem(index: number) {
      items = items.filter((_, i) => i !== index);
    },
    
    setLoading(value: boolean) {
      isLoading = value;
    },
    
    setError(message: string | null) {
      error = message;
    },
    
    reset() {
      items = [];
      isLoading = false;
      error = null;
    }
  };
}

export const storeName = createStoreName();
```

## Store Template with Zod Validation
```typescript
// lib/stores/storeName.ts
import { z } from 'zod';

// Define Zod schema
const ItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  value: z.number().positive(),
  createdAt: z.date()
});

const StoreStateSchema = z.object({
  items: z.array(ItemSchema),
  maxItems: z.number().min(1).max(100)
});

type Item = z.infer<typeof ItemSchema>;
type StoreState = z.infer<typeof StoreStateSchema>;

function createStoreName() {
  // State with typed arrays
  let items = $state<Item[]>([]);
  let maxItems = $state(10);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // Derived values
  let itemCount = $derived(items.length);
  let hasSpace = $derived(items.length < maxItems);
  let validState = $derived(() => {
    try {
      StoreStateSchema.parse({ items, maxItems });
      return true;
    } catch {
      return false;
    }
  });
  
  return {
    // Getters
    get items() { return items; },
    get maxItems() { return maxItems; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    get itemCount() { return itemCount; },
    get hasSpace() { return hasSpace; },
    get validState() { return validState; },
    
    // Validated actions
    addItem(item: unknown) {
      try {
        const validItem = ItemSchema.parse(item);
        
        if (items.length >= maxItems) {
          throw new Error(`Maximum ${maxItems} items allowed`);
        }
        
        items = [...items, validItem];
        error = null;
      } catch (e) {
        if (e instanceof z.ZodError) {
          error = e.errors[0].message;
        } else if (e instanceof Error) {
          error = e.message;
        }
      }
    },
    
    removeItem(id: string) {
      items = items.filter(item => item.id !== id);
    },
    
    updateMaxItems(value: number) {
      try {
        z.number().min(1).max(100).parse(value);
        maxItems = value;
        error = null;
      } catch (e) {
        if (e instanceof z.ZodError) {
          error = 'Max items must be between 1 and 100';
        }
      }
    },
    
    async loadItems() {
      isLoading = true;
      error = null;
      
      try {
        // Simulate API call
        const response = await fetch('/api/items');
        const data = await response.json();
        
        // Validate response data
        const validItems = z.array(ItemSchema).parse(data);
        items = validItems;
      } catch (e) {
        if (e instanceof z.ZodError) {
          error = 'Invalid data format received';
        } else {
          error = 'Failed to load items';
        }
      } finally {
        isLoading = false;
      }
    },
    
    reset() {
      items = [];
      maxItems = 10;
      isLoading = false;
      error = null;
    }
  };
}

export const storeName = createStoreName();
```

## Usage in Components
```svelte
<script lang="ts">
  import { storeName } from '$lib/stores/storeName';
  
  // Access store properties directly
  const store = storeName;
  
  function handleAdd() {
    store.addItem({
      id: crypto.randomUUID(),
      name: 'New Item',
      value: 100,
      createdAt: new Date()
    });
  }
</script>

<div>
  <p>Items: {store.itemCount}</p>
  <p>Has space: {store.hasSpace}</p>
  
  {#if store.error}
    <p class="text-destructive">{store.error}</p>
  {/if}
  
  {#if store.isLoading}
    <p>Loading...</p>
  {:else}
    {#each store.items as item}
      <div>{item.name}: {item.value}</div>
    {/each}
  {/if}
  
  <button onclick={handleAdd} disabled={!store.hasSpace}>
    Add Item
  </button>
</div>
```

## Best Practices
1. Always use TypeScript types for state
2. Include Zod validation for external data
3. Provide both getters and action methods
4. Include error handling in actions
5. Use derived state for computed values
6. Keep stores focused on a single domain
7. Include reset functionality for testing