<script lang="ts">
	import FerrariSlider from './FerrariSlider.svelte';
	import FerrariSelect from './FerrariSelect.svelte';
	import FerrariCheckbox from './FerrariCheckbox.svelte';
	import PortalTooltipFixed from './tooltip/PortalTooltipFixed.svelte';
	import type { ParameterMetadata } from '$lib/types/algorithm-configs';

	interface Props {
		name: string;
		value: any;
		metadata: ParameterMetadata;
		onChange: (newValue: any) => void;
		disabled?: boolean;
		showTooltip?: boolean;
		class?: string;
	}

	let {
		name,
		value,
		metadata,
		onChange,
		disabled = false,
		showTooltip = true,
		class: className = ''
	}: Props = $props();

	// Format display value for sliders
	function formatDisplayValue(val: any): string {
		if (metadata.type === 'boolean') {
			return val ? 'Enabled' : 'Disabled';
		}
		if (metadata.type === 'range' || metadata.type === 'number') {
			const numVal = Number(val);
			if (metadata.unit === '%') {
				return `${Math.round(numVal * 100)}%`;
			}
			const decimals = metadata.step && metadata.step < 1 ? 1 : 0;
			return `${numVal.toFixed(decimals)}${metadata.unit || ''}`;
		}
		if (metadata.type === 'select') {
			const option = metadata.options?.find((opt) => opt.value === val);
			return option?.label || String(val);
		}
		return String(val);
	}

	// Handle value changes with proper type conversion
	function handleChange(newValue: any) {
		if (metadata.type === 'number' || metadata.type === 'range') {
			onChange(Number(newValue));
		} else if (metadata.type === 'boolean') {
			onChange(Boolean(newValue));
		} else {
			onChange(newValue);
		}
	}
</script>

<div class="ferrari-parameter-control space-y-3 {className}">
	<!-- Boolean Controls -->
	{#if metadata.type === 'boolean'}
		<div class="flex items-start gap-3">
			<FerrariCheckbox
				id={`param-${name}`}
				checked={value}
				{disabled}
				label={metadata.label}
				onchange={handleChange}
			/>
			{#if showTooltip && metadata.description}
				<PortalTooltipFixed
					content={metadata.description}
					position="right"
					size="md"
				/>
			{/if}
		</div>

	<!-- Select Controls -->
	{:else if metadata.type === 'select'}
		<div class="flex items-start gap-2">
			<div class="flex-1">
				<FerrariSelect
					id={`param-${name}`}
					{value}
					options={metadata.options || []}
					label={metadata.label}
					{disabled}
					onchange={handleChange}
				/>
			</div>
			{#if showTooltip && metadata.description}
				<div class="mt-6">
					<PortalTooltipFixed
						content={metadata.description}
						position="right"
						size="md"
					/>
				</div>
			{/if}
		</div>

	<!-- Range/Number Controls -->
	{:else if metadata.type === 'range'}
		<div>
			<div class="mb-2 flex items-center gap-2">
				<label
					for={`param-${name}`}
					class="text-converter-primary block text-sm font-medium"
				>
					{metadata.label}
				</label>
				{#if showTooltip && metadata.description}
					<PortalTooltipFixed
						content={metadata.description}
						position="top"
						size="md"
					/>
				{/if}
			</div>
			<FerrariSlider
				id={`param-${name}`}
				{value}
				min={metadata.min || 0}
				max={metadata.max || 100}
				step={metadata.step || 1}
				{disabled}
				oninput={handleChange}
				class="w-full"
			/>
			<div class="text-converter-secondary mt-1 flex justify-between text-xs">
				<span>{metadata.min}{metadata.unit || ''}</span>
				<span class="font-medium">{formatDisplayValue(value)}</span>
				<span>{metadata.max}{metadata.unit || ''}</span>
			</div>
		</div>

	<!-- Number Input Controls -->
	{:else if metadata.type === 'number'}
		<div class="flex items-start gap-2">
			<div class="flex-1">
				<label
					for={`param-${name}`}
					class="text-converter-primary block text-sm font-medium mb-2"
				>
					{metadata.label}
				</label>
				<input
					id={`param-${name}`}
					type="number"
					min={metadata.min}
					max={metadata.max}
					step={metadata.step}
					{value}
					{disabled}
					onchange={(e) => handleChange(e.currentTarget.value)}
					class="border-ferrari-300 bg-white text-converter-primary focus:border-ferrari-500 focus:ring-ferrari-500 w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200 focus:ring-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
				/>
			</div>
			{#if showTooltip && metadata.description}
				<div class="mt-6">
					<PortalTooltipFixed
						content={metadata.description}
						position="right"
						size="md"
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.ferrari-parameter-control input[type="number"]:hover:not(:disabled) {
		border-color: #b91c2e;
	}

	.ferrari-parameter-control input[type="number"]:focus {
		box-shadow: 0 0 0 1px rgba(220, 20, 60, 0.5);
	}
</style>