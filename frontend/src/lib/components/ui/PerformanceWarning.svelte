<script lang="ts">
	import { AlertTriangle, Info, XCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	
	interface Props {
		elementCount: number;
		backend: 'dots' | 'edge' | 'centerline' | 'superpixel';
		svgSize?: number; // in bytes
		onOptimize?: () => void;
		onDismiss?: () => void;
		className?: string;
	}

	let {
		elementCount,
		backend,
		svgSize,
		onOptimize,
		onDismiss,
		className = ''
	}: Props = $props();

	// Performance thresholds based on research
	const PERFORMANCE_THRESHOLDS = {
		// Conservative thresholds for different backends
		dots: { warning: 1500, critical: 2500 },
		edge: { warning: 2000, critical: 3000 }, 
		centerline: { warning: 2000, critical: 3000 },
		superpixel: { warning: 1800, critical: 2800 }
	};

	const threshold = $derived(PERFORMANCE_THRESHOLDS[backend]);
	const severity = $derived(
		elementCount >= threshold.critical ? 'critical' :
		elementCount >= threshold.warning ? 'warning' :
		'info'
	);

	const shouldShow = $derived(elementCount >= threshold.warning);

	const warningConfig = $derived(() => {
		if (severity === 'critical') {
			return {
				icon: XCircle,
				title: 'Critical Performance Warning',
				bgColor: 'bg-red-50 border-red-200',
				textColor: 'text-red-800',
				iconColor: 'text-red-600',
				description: `This SVG has ${elementCount.toLocaleString()} elements, which will cause significant browser slowdowns during preview.`
			};
		} else if (severity === 'warning') {
			return {
				icon: AlertTriangle,
				title: 'Performance Warning',
				bgColor: 'bg-yellow-50 border-yellow-200',
				textColor: 'text-yellow-800',
				iconColor: 'text-yellow-600',
				description: `This SVG has ${elementCount.toLocaleString()} elements, which may impact preview performance.`
			};
		} else {
			return {
				icon: Info,
				title: 'Performance Info',
				bgColor: 'bg-blue-50 border-blue-200',
				textColor: 'text-blue-800',
				iconColor: 'text-blue-600',
				description: `This SVG has ${elementCount.toLocaleString()} elements and should preview smoothly.`
			};
		}
	});

	const recommendations = $derived(() => {
		const recs = [];
		
		if (severity === 'critical' || severity === 'warning') {
			if (backend === 'dots') {
				recs.push('Increase dot density threshold to reduce dot count');
				recs.push('Consider disabling adaptive sizing for uniform dots');
				if (elementCount > 5000) {
					recs.push('Try edge or centerline backend for better performance');
				}
			} else if (backend === 'edge') {
				recs.push('Reduce detail level to simplify paths');
				recs.push('Increase stroke width to merge nearby paths');
			} else if (backend === 'centerline') {
				recs.push('Reduce detail level for simpler shapes');
				recs.push('Increase morphological threshold to merge regions');
			} else if (backend === 'superpixel') {
				recs.push('Reduce superpixel count for fewer regions');
				recs.push('Increase compactness for simpler shapes');
			}
			
			if (severity === 'critical') {
				recs.push('Consider using lower quality settings for preview');
			}
		}
		
		return recs;
	});

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};
</script>

{#if shouldShow}
	{@const config = warningConfig()}
	{@const recs = recommendations()}
	<div class="rounded-lg border p-4 {config.bgColor} {className}">
		<div class="flex items-start gap-3">
			<!-- svelte-ignore svelte_component_deprecated -->
			<svelte:component this={config.icon} class="h-5 w-5 {config.iconColor} flex-shrink-0 mt-0.5" />
			
			<div class="flex-1 min-w-0">
				<h4 class="font-semibold {config.textColor}">
					{config.title}
				</h4>
				
				<p class="text-sm {config.textColor} mt-1">
					{config.description}
				</p>

				{#if svgSize}
					<p class="text-xs {config.textColor} mt-1 opacity-80">
						File size: {formatFileSize(svgSize)}
					</p>
				{/if}

				{#if recs.length > 0}
					<details class="mt-2">
						<summary class="text-xs {config.textColor} cursor-pointer hover:underline font-medium">
							Optimization suggestions ({recs.length})
						</summary>
						<ul class="mt-2 text-xs {config.textColor} space-y-1 pl-4">
							{#each recs as rec}
								<li class="flex items-start gap-1">
									<span class="text-xs opacity-60">•</span>
									<span>{rec}</span>
								</li>
							{/each}
						</ul>
					</details>
				{/if}

				<div class="flex items-center gap-2 mt-3">
					{#if onOptimize && (severity === 'critical' || severity === 'warning')}
						<Button 
							variant="outline" 
							size="sm" 
							class="text-xs h-7 {config.textColor} border-current hover:bg-current/10"
							onclick={onOptimize}
						>
							Optimize Settings
						</Button>
					{/if}
					
					{#if onDismiss}
						<Button 
							variant="ghost" 
							size="sm" 
							class="text-xs h-7 {config.textColor} hover:bg-current/10"
							onclick={onDismiss}
						>
							Dismiss
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}