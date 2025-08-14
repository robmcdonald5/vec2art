<script lang="ts">
  interface Props {
    value: number; // 0-100
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'error';
    showValue?: boolean;
  }

  let { 
    value, 
    label, 
    size = 'md',
    variant = 'default',
    showValue = true 
  }: Props = $props();

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const clampedValue = Math.max(0, Math.min(100, value));
</script>

<div class="w-full">
  {#if label}
    <div class="mb-2 flex items-center justify-between text-sm">
      <span class="font-medium text-foreground">{label}</span>
      {#if showValue}
        <span class="text-muted-foreground">{Math.round(clampedValue)}%</span>
      {/if}
    </div>
  {/if}
  
  <div class="w-full rounded-full bg-muted {sizeClasses[size]}">
    <div 
      class="rounded-full transition-all duration-300 ease-out {variantClasses[variant]} {sizeClasses[size]}"
      style="width: {clampedValue}%"
    ></div>
  </div>
</div>