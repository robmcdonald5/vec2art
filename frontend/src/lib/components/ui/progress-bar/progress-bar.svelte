<script lang="ts">
	interface Props {
		value: number; // 0-100
		label?: string;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'success' | 'warning' | 'error';
		showValue?: boolean;
		id?: string;
	}

	let { value, label, size = 'md', variant = 'default', showValue = true, id }: Props = $props();

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

	const clampedValue = $derived(Math.max(0, Math.min(100, value)));
	const progressId = id || 'progress-bar';
</script>

<div class="w-full">
	{#if label}
		<div class="mb-2 flex items-center justify-between text-sm">
			<label for={progressId} class="text-foreground font-medium">{label}</label>
			{#if showValue}
				<span class="text-muted-foreground" aria-hidden="true">{Math.round(clampedValue)}%</span>
			{/if}
		</div>
	{/if}

	<div
		class="bg-muted w-full rounded-full {sizeClasses[size]}"
		role="progressbar"
		aria-valuenow={clampedValue}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-label={label || 'Progress'}
		id={progressId}
	>
		<div
			class="rounded-full transition-all duration-300 ease-out {variantClasses[
				variant
			]} {sizeClasses[size]}"
			style="width: {clampedValue}%"
			aria-hidden="true"
		></div>
	</div>

	<!-- Screen reader announcement of progress -->
	<div class="sr-only" aria-live="polite" aria-atomic="false">
		{#if showValue}
			{Math.round(clampedValue)}% {label || 'progress'}
		{/if}
	</div>
</div>

<style>
	/* Screen reader only text */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
