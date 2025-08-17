<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		class?: string;
		onValueChange?: (value: number) => void;
	}

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		class: className = '',
		onValueChange
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = parseFloat(target.value);
		onValueChange?.(value);
	}
</script>

<div class={cn('relative flex w-full touch-none items-center select-none', className)}>
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:value
		{disabled}
		oninput={handleInput}
		class={cn(
			'w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50',
			'[&::-webkit-slider-track]:bg-secondary [&::-webkit-slider-track]:h-2 [&::-webkit-slider-track]:w-full [&::-webkit-slider-track]:rounded-full',
			'[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
			'[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:ring-offset-background [&::-webkit-slider-thumb]:transition-colors',
			'[&::-webkit-slider-thumb]:focus-visible:ring-ring [&::-webkit-slider-thumb]:focus-visible:ring-2 [&::-webkit-slider-thumb]:focus-visible:outline-none',
			'[&::-webkit-slider-thumb]:focus-visible:ring-offset-2',
			'[&::-moz-range-track]:bg-secondary [&::-moz-range-track]:h-2 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-full',
			'[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
			'[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:ring-offset-background [&::-moz-range-thumb]:transition-colors',
			'[&::-moz-range-thumb]:focus-visible:ring-ring [&::-moz-range-thumb]:focus-visible:ring-2 [&::-moz-range-thumb]:focus-visible:outline-none',
			'[&::-moz-range-thumb]:focus-visible:ring-offset-2'
		)}
	/>
</div>
