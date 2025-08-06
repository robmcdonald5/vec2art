# Create Svelte Component

Creates a new Svelte 5 component following the project's established patterns with TypeScript, Shadcn-Svelte UI components, and Tailwind CSS styling.

## Usage
```
/create-svelte-component <component-name> [path]
```

## Arguments
- `component-name`: Name of the component in PascalCase (e.g., ImagePreview)
- `path`: Optional path relative to src/lib/components/ (defaults to root of components folder)

## Examples
```
/create-svelte-component FileUploader
/create-svelte-component ImagePreview preview
/create-svelte-component ProcessingStatus status
```

## Template
Creates a component with:
- TypeScript (`<script lang="ts">`)
- Svelte 5 Runes for state management
- Proper prop typing and exports
- Tailwind CSS classes only (no `<style>` blocks)
- Ready-to-use Shadcn-Svelte imports

## Component Structure
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  
  // Props with TypeScript types
  export let title: string;
  export let description: string = '';
  export let onAction: (() => void) | undefined = undefined;
  
  // Local state using Svelte 5 Runes
  let isActive = $state(false);
  let count = $state(0);
  
  // Derived state
  let displayText = $derived(`${title} (${count})`);
  
  // Event handlers
  function handleClick() {
    isActive = !isActive;
    count++;
    onAction?.();
  }
</script>

<Card class="w-full max-w-md">
  <CardContent class="p-6">
    <h3 class="text-lg font-semibold mb-2">{displayText}</h3>
    {#if description}
      <p class="text-muted-foreground mb-4">{description}</p>
    {/if}
    
    <Button 
      onclick={handleClick}
      variant={isActive ? 'default' : 'outline'}
      class="w-full"
    >
      {isActive ? 'Active' : 'Inactive'}
    </Button>
    
    {#if count > 0}
      <p class="text-sm text-center mt-4">
        Clicked {count} {count === 1 ? 'time' : 'times'}
      </p>
    {/if}
  </CardContent>
</Card>
```

## Implementation Notes
- Always use TypeScript with strict typing
- Use Svelte 5 Runes (`$state`, `$derived`) instead of legacy stores
- Import UI components from Shadcn-Svelte
- Apply all styling with Tailwind utility classes
- Keep components focused on a single responsibility
- Include proper TypeScript types for all props and functions