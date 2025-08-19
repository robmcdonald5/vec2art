<script lang="ts">
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
import { fly, fade } from 'svelte/transition';
import type { Toast } from '$lib/stores/toast.svelte';

interface Props {
	toast: Toast;
	onDismiss: () => void;
}

let { toast, onDismiss }: Props = $props();

// Icon and color mapping
const iconMap = {
	success: CheckCircle,
	error: XCircle,
	info: Info,
	warning: AlertTriangle
};

const colorMap = {
	success: 'bg-green-50 border-green-200 text-green-800',
	error: 'bg-red-50 border-red-200 text-red-800',
	info: 'bg-blue-50 border-blue-200 text-blue-800',
	warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
};

const iconColorMap = {
	success: 'text-green-500',
	error: 'text-red-500',
	info: 'text-blue-500',
	warning: 'text-yellow-500'
};

const Icon = $derived(iconMap[toast.type]);
const colorClass = $derived(colorMap[toast.type]);
const iconColorClass = $derived(iconColorMap[toast.type]);
</script>

<div
	class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg {colorClass}"
	transition:fly={{ y: 50, duration: 300 }}
	role="alert"
	aria-live="polite"
>
	<div class="p-4">
		<div class="flex items-start">
			<div class="flex-shrink-0">
				<Icon class="h-5 w-5 {iconColorClass}" aria-hidden="true" />
			</div>
			<div class="ml-3 w-0 flex-1">
				<p class="text-sm font-medium">
					{toast.message}
				</p>
				{#if toast.action}
					<button
						onclick={toast.action.onclick}
						class="mt-2 text-sm font-medium underline hover:no-underline"
					>
						{toast.action.label}
					</button>
				{/if}
			</div>
			<div class="ml-4 flex flex-shrink-0">
				<button
					onclick={onDismiss}
					class="inline-flex rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
					aria-label="Dismiss"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>
</div>