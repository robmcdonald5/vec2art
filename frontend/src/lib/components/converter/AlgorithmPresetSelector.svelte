<script lang="ts">
	import { Palette } from 'lucide-svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import type { AlgorithmType } from '$lib/types/algorithm-configs';

	interface Props {
		algorithm: AlgorithmType;
		disabled?: boolean;
	}

	let { algorithm, disabled = false }: Props = $props();

	// Preset definitions for each algorithm
	const EDGE_PRESETS = [
		{ id: 'sketch', label: 'Sketch', config: { detail: 0.5, strokeWidth: 1.5, multipass: false } },
		{
			id: 'technical',
			label: 'Technical',
			config: { detail: 0.8, strokeWidth: 1.0, multipass: true }
		},
		{
			id: 'artistic',
			label: 'Artistic',
			config: { detail: 0.6, strokeWidth: 2.5, handDrawnPreset: 'natural' }
		}
	];

	const CENTERLINE_PRESETS = [
		{
			id: 'simple',
			label: 'Simple',
			config: { strokeWidth: 2.0, minPathLength: 10, preserveDetails: false }
		},
		{
			id: 'detailed',
			label: 'Detailed',
			config: { strokeWidth: 1.5, minPathLength: 5, preserveDetails: true }
		},
		{
			id: 'bold',
			label: 'Bold',
			config: { strokeWidth: 3.5, minPathLength: 15, preserveDetails: false }
		}
	];

	const SUPERPIXEL_PRESETS = [
		{
			id: 'poster',
			label: 'Poster',
			config: { regionCount: 100, compactness: 20, polygonMode: true }
		},
		{
			id: 'abstract',
			label: 'Abstract',
			config: { regionCount: 50, compactness: 30, polygonMode: true }
		},
		{
			id: 'detailed',
			label: 'Detailed',
			config: { regionCount: 300, compactness: 10, polygonMode: false }
		}
	];

	const DOTS_PRESETS = [
		{ id: 'sparse', label: 'Sparse', config: { dotDensity: 3, minRadius: 2, maxRadius: 5 } },
		{ id: 'balanced', label: 'Balanced', config: { dotDensity: 6, minRadius: 1.5, maxRadius: 4 } },
		{ id: 'dense', label: 'Dense', config: { dotDensity: 9, minRadius: 1, maxRadius: 3 } }
	];

	// Get presets for current algorithm
	const presets = $derived(
		algorithm === 'edge'
			? EDGE_PRESETS
			: algorithm === 'centerline'
				? CENTERLINE_PRESETS
				: algorithm === 'superpixel'
					? SUPERPIXEL_PRESETS
					: DOTS_PRESETS
	);

	// Track selected preset
	let selectedPresetId = $state<string | undefined>(undefined);

	// Apply preset
	function applyPreset(presetId: string) {
		const preset = presets.find((p) => p.id === presetId);
		if (preset) {
			selectedPresetId = presetId;
			algorithmConfigStore.updateConfig(algorithm, preset.config);
		}
	}

	// Clear preset selection when custom changes are made
	$effect(() => {
		// Listen for config changes and clear preset if it doesn't match
		const config = algorithmConfigStore.getConfig(algorithm) as any;
		const matchingPreset = presets.find((p) => {
			return Object.entries(p.config).every(([key, value]) => {
				return config[key] === value;
			});
		});

		if (!matchingPreset && selectedPresetId) {
			selectedPresetId = undefined;
		}
	});
</script>

<div class="space-y-3">
	<div class="flex items-center gap-2">
		<Palette class="text-speed-gray-600 dark:text-speed-gray-400 h-4 w-4" />
		<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
			Style Presets
		</span>
	</div>

	<div class="grid grid-cols-3 gap-2">
		{#each presets as preset (preset.id)}
			<button
				type="button"
				onclick={() => applyPreset(preset.id)}
				{disabled}
				class="rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:scale-105 {selectedPresetId ===
				preset.id
					? 'border-ferrari-500 bg-ferrari-50 text-ferrari-600 ring-ferrari-500 dark:bg-ferrari-900/20 dark:text-ferrari-400 ring-1'
					: 'border-speed-gray-300 bg-speed-white text-speed-gray-700 hover:border-ferrari-300 hover:bg-ferrari-50/50 dark:border-speed-gray-600 dark:bg-speed-gray-800 dark:text-speed-gray-300'}"
			>
				{preset.label}
			</button>
		{/each}
	</div>

	{#if selectedPresetId}
		<div class="bg-ferrari-50 dark:bg-ferrari-900/20 rounded-lg p-2">
			<p class="text-ferrari-600 dark:text-ferrari-400 text-xs">
				Using {presets.find((p) => p.id === selectedPresetId)?.label} preset
			</p>
		</div>
	{/if}
</div>
