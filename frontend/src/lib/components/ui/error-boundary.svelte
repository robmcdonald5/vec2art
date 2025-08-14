<script lang="ts">
  import { AlertTriangle, RefreshCw, X } from 'lucide-svelte';
  import Button from './button.svelte';

  interface Props {
    error?: Error | null;
    title?: string;
    description?: string;
    showRetry?: boolean;
    showDismiss?: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
    variant?: 'error' | 'warning' | 'info';
  }

  let {
    error = null,
    title = 'Something went wrong',
    description,
    showRetry = true,
    showDismiss = true,
    onRetry,
    onDismiss,
    variant = 'error'
  }: Props = $props();

  const variantStyles = {
    error: {
      container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
      icon: 'text-red-500',
      title: 'text-red-700 dark:text-red-400',
      description: 'text-red-600 dark:text-red-300'
    },
    warning: {
      container: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
      icon: 'text-yellow-500',
      title: 'text-yellow-700 dark:text-yellow-400',
      description: 'text-yellow-600 dark:text-yellow-300'
    },
    info: {
      container: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
      icon: 'text-blue-500',
      title: 'text-blue-700 dark:text-blue-400',
      description: 'text-blue-600 dark:text-blue-300'
    }
  };

  const styles = variantStyles[variant];
</script>

{#if error}
  <div class="rounded-lg border p-4 {styles.container}">
    <div class="flex items-start gap-3">
      <AlertTriangle class="h-5 w-5 {styles.icon} mt-0.5 flex-shrink-0" />
      
      <div class="flex-1 min-w-0">
        <h3 class="font-medium {styles.title}">{title}</h3>
        
        {#if description}
          <p class="mt-1 text-sm {styles.description}">{description}</p>
        {/if}
        
        {#if error.message}
          <details class="mt-2">
            <summary class="cursor-pointer text-sm {styles.description} hover:underline">
              Technical details
            </summary>
            <pre class="mt-2 text-xs {styles.description} whitespace-pre-wrap font-mono bg-black/5 dark:bg-white/5 p-2 rounded">{error.message}</pre>
            {#if error.stack}
              <pre class="mt-1 text-xs {styles.description} whitespace-pre-wrap font-mono bg-black/5 dark:bg-white/5 p-2 rounded max-h-32 overflow-y-auto">{error.stack}</pre>
            {/if}
          </details>
        {/if}
        
        {#if showRetry || showDismiss}
          <div class="mt-4 flex gap-2">
            {#if showRetry && onRetry}
              <Button
                variant="outline"
                size="sm"
                onclick={onRetry}
                class="text-sm"
              >
                <RefreshCw class="h-4 w-4 mr-1" />
                Try Again
              </Button>
            {/if}
            
            {#if showDismiss && onDismiss}
              <Button
                variant="ghost"
                size="sm"
                onclick={onDismiss}
                class="text-sm"
              >
                <X class="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}