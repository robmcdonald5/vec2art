<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { type VariantProps, cva } from 'class-variance-authority';

	const buttonVariants = cva(
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		{
			variants: {
				variant: {
					default: 'bg-primary text-primary-foreground hover:bg-primary/90',
					destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
					outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
					secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
					ghost: 'hover:bg-accent hover:text-accent-foreground',
					link: 'text-primary underline-offset-4 hover:underline'
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

	type $$Props = {
		variant?: VariantProps<typeof buttonVariants>['variant'];
		size?: VariantProps<typeof buttonVariants>['size'];
		href?: string;
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		[key: string]: any;
	};

	export let variant: $$Props['variant'] = 'default';
	export let size: $$Props['size'] = 'default';
	export let href: $$Props['href'] = undefined;
	export let type: $$Props['type'] = 'button';
	export let disabled: $$Props['disabled'] = false;

	let className: string = '';
	export { className as class };
</script>

{#if href}
	<a
		{href}
		class={cn(buttonVariants({ variant, size }), className)}
		{...$$restProps}
		on:click
		on:mouseenter
		on:mouseleave
	>
		<slot />
	</a>
{:else}
	<button
		{type}
		{disabled}
		class={cn(buttonVariants({ variant, size }), className)}
		{...$$restProps}
		on:click
		on:mouseenter
		on:mouseleave
	>
		<slot />
	</button>
{/if}
