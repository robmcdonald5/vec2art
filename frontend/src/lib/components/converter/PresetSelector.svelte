<script lang="ts">
	import { presetCollection, getPresetById, getPresetsByAlgorithm } from '$lib/presets/presets';
	import type { StylePreset } from '$lib/presets/types';
	import type { VectorizerBackend } from '$lib/types/vectorizer';
	import { CustomSelect } from '$lib/components/ui/custom-select';

	interface Props {
		selectedPresetId?: string;
		onPresetSelect: (_selectedPreset: StylePreset | null) => void;
		disabled?: boolean;
		// New prop for algorithm-specific filtering
		selectedAlgorithm?: VectorizerBackend;
	}

	let {
		selectedPresetId = '',
		onPresetSelect,
		disabled = false,
		selectedAlgorithm
	}: Props = $props();

	// Get available presets based on selected algorithm
	const availablePresets = $derived.by(() => {
		if (selectedAlgorithm) {
			// Return algorithm-specific presets
			return getPresetsByAlgorithm(selectedAlgorithm);
		}
		// Return all presets if no algorithm selected
		return presetCollection.presets;
	});

	// Algorithm display names
	const algorithmNames: Record<VectorizerBackend, string> = {
		centerline: 'Centerline',
		edge: 'Edge Detection',
		dots: 'Dots & Stippling',
		superpixel: 'Superpixel Regions'
	};

	// Create options for CustomSelect dropdown
	const dropdownOptions = $derived.by(() => {
		if (selectedAlgorithm) {
			// Show algorithm-specific presets without grouping
			return availablePresets.map((preset) => ({
				value: preset.metadata.id,
				label: preset.metadata.name,
				disabled: false
			}));
		}

		// Show all presets grouped by algorithm
		const options: { value: string; label: string; disabled: boolean }[] = [];

		// Group by algorithm
		const algorithmGroups: Record<VectorizerBackend, StylePreset[]> = {
			centerline: [],
			edge: [],
			dots: [],
			superpixel: []
		};

		availablePresets.forEach((preset) => {
			algorithmGroups[preset.backend].push(preset);
		});

		Object.entries(algorithmGroups).forEach(([backend, presets]) => {
			if (presets.length > 0) {
				presets.forEach((preset) => {
					options.push({
						value: preset.metadata.id,
						label: selectedAlgorithm
							? preset.metadata.name
							: `${algorithmNames[backend as VectorizerBackend]}: ${preset.metadata.name}`,
						disabled: false
					});
				});
			}
		});

		return options;
	});

	// Handle preset selection
	function handlePresetChange(presetId: string) {
		if (disabled) return;

		if (presetId === 'custom') {
			onPresetSelect(null); // Custom option
		} else {
			const preset = getPresetById(presetId);
			if (preset) {
				onPresetSelect(preset);
			} else {
				onPresetSelect(null); // Fallback to custom
			}
		}
	}
</script>

<!-- Algorithm-Specific Preset Dropdown -->
<div class="space-y-2">
	<CustomSelect
		value={selectedPresetId || 'custom'}
		options={[...dropdownOptions, { value: 'custom', label: 'Custom Settings', disabled: false }]}
		onchange={handlePresetChange}
		{disabled}
		placeholder={selectedAlgorithm
			? `Select ${algorithmNames[selectedAlgorithm]} preset`
			: 'Select a preset'}
	/>
</div>
