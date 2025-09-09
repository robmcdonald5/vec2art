<script lang="ts">

	interface Props {
		beforeImage: string;
		afterImage: string;
		beforeAlt?: string;
		afterAlt?: string;
		class?: string;
		loading?: 'lazy' | 'eager';
		beforePlaceholder?: string;
		afterPlaceholder?: string;
		animationDuration?: number; // Duration in ms for the pan animation
		resetTrigger?: number; // When this changes, restart the animation
	}

	let {
		beforeImage,
		afterImage,
		beforeAlt = 'Before',
		afterAlt = 'After',
		class: className = '',
		loading = 'lazy',
		beforePlaceholder = '',
		afterPlaceholder = '',
		animationDuration = 6000, // 6 seconds for pan animation
		resetTrigger = 0
	}: Props = $props();

	let container: HTMLDivElement;
	let animationKey = $state(0);

	// Track previous resetTrigger to avoid infinite loops - start with -1 to ensure first animation runs
	let previousResetTrigger = $state(-1);

	// Reset animation when resetTrigger changes (only if not -1)
	$effect(() => {
		if (resetTrigger !== previousResetTrigger && resetTrigger !== -1) {
			previousResetTrigger = resetTrigger;
			// Simply update the key to force re-render
			animationKey = Date.now();
		} else if (resetTrigger === -1) {
			// Stop animation when resetTrigger is -1
			previousResetTrigger = resetTrigger;
		}
	});

</script>

<div
	bind:this={container}
	class="relative overflow-hidden select-none {className}"
	role="application"
	aria-label="Animated before and after comparison"
>
	<!-- After Image (Bottom Layer) -->
	<div class="relative h-full w-full">
		{#if afterPlaceholder}
			<img 
				src={afterPlaceholder} 
				alt="" 
				aria-hidden="true"
				class="absolute inset-0 h-full w-full object-contain blur-xl" 
				draggable="false" 
			/>
		{/if}
		<img 
			src={afterImage} 
			alt={afterAlt} 
			{loading}
			class="relative h-full w-full object-contain" 
			draggable="false" 
		/>
	</div>

	<!-- Before Image (Top Layer with Animated Clip) -->
	{#key animationKey}
		<div
			class="absolute inset-0 {resetTrigger !== -1 ? 'animate-reveal' : ''}"
			style="--animation-duration: {animationDuration}ms"
		>
			{#if beforePlaceholder}
				<img 
					src={beforePlaceholder} 
					alt="" 
					aria-hidden="true"
					class="absolute inset-0 h-full w-full object-contain blur-xl" 
					draggable="false" 
				/>
			{/if}
			<img 
				src={beforeImage} 
				alt={beforeAlt} 
				{loading}
				class="relative h-full w-full object-contain" 
				draggable="false" 
			/>
		</div>
	{/key}


</div>

<style>
	/* Hardware-accelerated pan animation */
	@keyframes reveal-pan {
		0% {
			clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		}
		100% {
			clip-path: polygon(0 0, 0% 0, 0% 100%, 0 100%);
		}
	}



	.animate-reveal {
		animation: reveal-pan var(--animation-duration, 6000ms) ease-in-out forwards;
		animation-delay: 1s; /* Wait 1 second before starting pan */
		/* Start with fully visible before image, animate to hidden */
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}



	/* Disable animation if user prefers reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.animate-reveal {
			animation: none;
			clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
		}
	}
</style>