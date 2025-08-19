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
					link: 'text-primary underline-offset-4 hover:underline'
				},
				size: {
					default: 'h-9 px-4 py-2',
					sm: 'h-8 rounded-md px-3 text-xs',
					lg: 'h-10 rounded-md px-8',
					icon: 'h-9 w-9'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	type ButtonElement = $$Generic<keyof HTMLElementTagNameMap>;

	interface Props {
		/**
		 * The underlying HTML element to render. Defaults to "button".
		 */
		as?: ButtonElement;
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
		onclick?: (event: MouseEvent) => void;
		/**
		 * Mouse enter handler.
		 */
		onmouseenter?: (event: MouseEvent) => void;
		/**
		 * Mouse leave handler.
		 */
		onmouseleave?: (event: MouseEvent) => void;
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
		as = 'button' as ButtonElement,
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
	class={cn(buttonVariants({ variant, size }), className)}
	{disabled}
	{type}
	onclick={handleClick}
	{onmouseenter}
	{onmouseleave}
	style="pointer-events: auto !important;"
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
