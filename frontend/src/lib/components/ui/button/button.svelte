<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { type VariantProps, cva } from 'class-variance-authority';

	const buttonVariants = cva(
		'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50',
		{
			variants: {
				variant: {
					default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
					destructive:
						'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
					outline:
						'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
					secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
					ghost: 'hover:bg-accent hover:text-accent-foreground',
					link: 'text-primary underline-offset-4 hover:underline',
					ferrari: 'btn-ferrari-primary text-white font-semibold shadow hover:bg-primary/90'
				},
				size: {
					default: 'h-9 px-4 py-2 md:h-9 h-11' /* RESPONSIVE: Desktop h-9, Mobile h-11 */,
					sm: 'h-8 rounded-md px-3 text-xs md:h-8 h-11' /* RESPONSIVE: Desktop h-8, Mobile h-11 */,
					lg: 'h-10 rounded-md px-8 md:h-10 h-12' /* RESPONSIVE: Desktop h-10, Mobile h-12 */,
					icon: 'h-9 w-9 md:h-9 md:w-9 h-11 w-11' /* RESPONSIVE: Desktop h-9 w-9, Mobile h-11 w-11 */
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	interface Props {
		/**
		 * The underlying HTML element to render. Defaults to "button".
		 */
		as?: any; // keyof HTMLElementTagNameMap
		/**
		 * The button variant.
		 */
		variant?: VariantProps<typeof buttonVariants>['variant'];
		/**
		 * The button size.
		 */
		size?: VariantProps<typeof buttonVariants>['size'];
		/**
		 * Whether the button is disabled.
		 */
		disabled?: boolean;
		/**
		 * The button type (when rendering as button).
		 */
		type?: 'button' | 'submit' | 'reset';
		/**
		 * Additional CSS classes.
		 */
		class?: string;
		/**
		 * Click handler.
		 */
		onclick?: (_event: MouseEvent) => void;
		/**
		 * Mouse enter handler.
		 */
		onmouseenter?: (_event: MouseEvent) => void;
		/**
		 * Mouse leave handler.
		 */
		onmouseleave?: (_event: MouseEvent) => void;
		/**
		 * Children snippet for button content
		 */
		children?: import('svelte').Snippet;
		/**
		 * All other props
		 */
		[key: string]: any;
	}

	let {
		as = 'button' as any, // keyof HTMLElementTagNameMap
		variant = 'default',
		size = 'default',
		disabled = false,
		type = 'button',
		class: className = '',
		onclick = undefined,
		onmouseenter = undefined,
		onmouseleave = undefined,
		children,
		...restProps
	}: Props = $props();

	// Event handlers - simplified to avoid event handling issues
	function handleClick(event: MouseEvent) {
		console.log('🔵 Button handleClick:', { disabled, hasOnclick: !!onclick, variant, size });
		if (disabled) {
			console.log('🔴 Button disabled, preventing default');
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (onclick) {
			console.log('🟢 Calling onclick handler');
			onclick(event);
		} else {
			console.log('🟡 No onclick handler provided');
		}
	}
</script>

<svelte:element
	this={as}
	class={cn(buttonVariants({ variant, size }), 'btn-clickable', className)}
	onclick={handleClick}
	{onmouseenter}
	{onmouseleave}
	{...restProps}
	{...as === 'button' || as === 'input' ? { disabled, type } : {}}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
