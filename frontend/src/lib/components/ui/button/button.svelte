<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { type VariantProps, cva } from 'class-variance-authority';

	const buttonVariants = cva(
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group',
		{
			variants: {
				variant: {
					default:
						'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95',
					destructive:
						'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 hover:scale-105 active:scale-95',
					outline:
						'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:shadow-accent/20 hover:scale-105 hover:border-accent active:scale-95',
					secondary:
						'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:shadow-secondary/20 hover:scale-105 active:scale-95',
					ghost:
						'hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-105 active:scale-95',
					link: 'text-primary underline-offset-4 hover:underline hover:scale-105 active:scale-95'
				},
				size: {
					default: 'h-10 px-4 py-2',
					sm: 'h-9 rounded-md px-3',
					lg: 'h-11 rounded-md px-8',
					icon: 'h-10 w-10'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	interface Props {
		variant?: VariantProps<typeof buttonVariants>['variant'];
		size?: VariantProps<typeof buttonVariants>['size'];
		href?: string;
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		onmouseenter?: (event: MouseEvent) => void;
		onmouseleave?: (event: MouseEvent) => void;
		children?: any;
		[key: string]: any;
	}

	let {
		variant = 'default',
		size = 'default',
		href = undefined,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		onmouseenter,
		onmouseleave,
		children,
		...restProps
	}: Props = $props();
</script>

{#if href}
	<a
		{href}
		class={cn(buttonVariants({ variant, size }), className)}
		{onclick}
		{onmouseenter}
		{onmouseleave}
		{...restProps}
	>
		<!-- Shimmer effect overlay -->
		<div
			class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
		>
			<div class="shimmer-effect"></div>
		</div>
		<div class="relative z-10 flex items-center gap-1">
			{@render children?.()}
		</div>
	</a>
{:else}
	<button
		{type}
		{disabled}
		class={cn(buttonVariants({ variant, size }), className)}
		{onclick}
		{onmouseenter}
		{onmouseleave}
		{...restProps}
	>
		<!-- Shimmer effect overlay -->
		<div
			class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
		>
			<div class="shimmer-effect"></div>
		</div>
		<div class="relative z-10 flex items-center gap-1">
			{@render children?.()}
		</div>
	</button>
{/if}

<style>
	/* Enhanced button animations and effects */
	.shimmer-effect {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.1) 40%,
			rgba(255, 255, 255, 0.2) 50%,
			rgba(255, 255, 255, 0.1) 60%,
			transparent 100%
		);
		width: 200%;
		height: 100%;
		position: absolute;
		top: 0;
		left: -100%;
		animation: shimmer 0.8s ease-out;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	/* Disable animations for reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.shimmer-effect {
			animation: none;
		}

		:global(.group) {
			transition: none !important;
		}

		:global(.group:hover) {
			transform: none !important;
		}
	}
</style>
