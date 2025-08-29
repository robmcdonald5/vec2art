<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Zap,
		ZapOff,
		XCircle,
		Loader2,
		AlertTriangle,
		HelpCircle,
		Info
	} from 'lucide-svelte';
	import { checkGpuStatus, getGpuStatusMessage, getGpuStatusColor } from '$lib/utils/gpu-detection';
	import type { GpuStatus } from '$lib/utils/gpu-detection';

	interface Props {
		/** Show detailed information in tooltip or expanded view */
		showDetails?: boolean;
		/** Size of the indicator (sm, md, lg) */
		size?: 'sm' | 'md' | 'lg';
		/** Optional class for additional styling */
		class?: string;
	}

	let {
		showDetails = false,
		size = 'md',
		class: className = ''
	}: Props = $props();

	// State
	let gpuStatus = $state<GpuStatus>({
		webgpuAvailable: false,
		gpuBackend: 'none',
		accelerationSupported: false,
		status: 'loading'
	});

	let showTooltip = $state(false);

	// Size configurations
	const sizeConfig = {
		sm: {
			icon: 'h-3 w-3',
			text: 'text-xs',
			padding: 'p-1.5',
			gap: 'gap-1'
		},
		md: {
			icon: 'h-4 w-4',
			text: 'text-xs',
			padding: 'p-2',
			gap: 'gap-1.5'
		},
		lg: {
			icon: 'h-5 w-5',
			text: 'text-sm',
			padding: 'p-2.5',
			gap: 'gap-2'
		}
	};

	const config = $derived(sizeConfig[size]);

	// Icon mapping
	const iconMap = {
		enabled: Zap,
		disabled: ZapOff,
		'not-available': XCircle,
		loading: Loader2,
		error: AlertTriangle,
		unknown: HelpCircle
	};

	const Icon = $derived(iconMap[gpuStatus.status] || HelpCircle);
	const colors = $derived(getGpuStatusColor(gpuStatus));

	// Load GPU status on component mount
	onMount(async () => {
		try {
			// Force refresh to get latest GPU status after WASM updates
			gpuStatus = await checkGpuStatus(true);
		} catch (error) {
			console.error('Failed to load GPU status:', error);
			gpuStatus = {
				webgpuAvailable: false,
				gpuBackend: 'none',
				accelerationSupported: false,
				status: 'error',
				message: 'Failed to check GPU status'
			};
		}
	});

	// Handle tooltip show/hide
	let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMouseEnter() {
		if (!showDetails) return;
		if (tooltipTimeout) clearTimeout(tooltipTimeout);
		showTooltip = true;
	}

	function handleMouseLeave() {
		if (!showDetails) return;
		tooltipTimeout = setTimeout(() => {
			showTooltip = false;
		}, 100);
	}

	// Generate status text for accessibility
	const statusText = $derived(getGpuStatusMessage(gpuStatus));
</script>

<div
	class="relative inline-flex items-center {config.gap} {config.padding} rounded-lg border transition-all duration-200 {colors.bg} {colors.border} {className}"
	role="status"
	aria-label="GPU acceleration status: {statusText}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<!-- GPU Icon -->
	<Icon
		class="{config.icon} {colors.text} {gpuStatus.status === 'loading' ? 'animate-spin' : ''}"
		aria-hidden="true"
	/>

	<!-- Status Label -->
	<span class="font-medium {config.text} {colors.text}">
		{#if gpuStatus.status === 'enabled'}
			GPU Enabled
		{:else if gpuStatus.status === 'disabled'}
			GPU Disabled
		{:else if gpuStatus.status === 'not-available'}
			No GPU
		{:else if gpuStatus.status === 'loading'}
			Checking...
		{:else if gpuStatus.status === 'error'}
			GPU Error
		{:else}
			GPU Unknown
		{/if}
	</span>

	<!-- Detailed Tooltip (if enabled) -->
	{#if showDetails && showTooltip}
		<div
			class="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800"
			role="tooltip"
		>
			<!-- Tooltip Arrow -->
			<div
				class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-200 dark:border-t-gray-700"
			></div>

			<!-- Tooltip Content -->
			<div class="space-y-2">
				<div class="font-semibold text-gray-900 dark:text-gray-100">
					GPU Acceleration Status
				</div>

				<div class="grid grid-cols-2 gap-2 text-xs">
					<div class="space-y-1">
						<div class="font-medium text-gray-700 dark:text-gray-300">WebGPU:</div>
						<div class="text-gray-600 dark:text-gray-400">
							{gpuStatus.webgpuAvailable ? '✅ Available' : '❌ Not Available'}
						</div>
					</div>
					<div class="space-y-1">
						<div class="font-medium text-gray-700 dark:text-gray-300">Backend:</div>
						<div class="text-gray-600 dark:text-gray-400 capitalize">
							{gpuStatus.gpuBackend}
						</div>
					</div>
				</div>

				{#if gpuStatus.message}
					<div class="border-t border-gray-200 pt-2 dark:border-gray-600">
						<div class="text-gray-600 dark:text-gray-400">
							{gpuStatus.message}
						</div>
					</div>
				{/if}

				<!-- Performance Impact Notice -->
				{#if gpuStatus.status === 'enabled'}
					<div class="flex items-start gap-2 rounded bg-green-50 p-2 dark:bg-green-950/30">
						<Info class="mt-0.5 h-3 w-3 text-green-600 dark:text-green-400" />
						<div class="text-green-700 dark:text-green-300">
							GPU acceleration can significantly improve processing speed for large images.
						</div>
					</div>
				{:else if gpuStatus.status === 'not-available'}
					<div class="flex items-start gap-2 rounded bg-gray-50 p-2 dark:bg-gray-950/30">
						<Info class="mt-0.5 h-3 w-3 text-gray-600 dark:text-gray-400" />
						<div class="text-gray-700 dark:text-gray-300">
							Processing will use CPU-only algorithms. Performance may be slower for large images.
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Ensure tooltip appears above other elements */
	[role='tooltip'] {
		z-index: 9999;
	}
</style>