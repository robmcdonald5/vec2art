<script lang="ts">
	import { Info } from 'lucide-svelte';
	import type { ParameterMetadata } from '$lib/types/algorithm-configs';

	interface Props {
		name: string;
		value: any;
		metadata: ParameterMetadata;
		onChange: (newValue: any) => void;
		disabled?: boolean;
		showDescription?: boolean;
	}

	let {
		name,
		value,
		metadata,
		onChange,
		disabled = false,
		showDescription = true
	}: Props = $props();

	// Format display value based on type and unit
	function formatDisplayValue(val: any): string {
		if (metadata.type === 'boolean') {
			return val ? 'Enabled' : 'Disabled';
		}
		if (metadata.type === 'range' || metadata.type === 'number') {
			const numVal = Number(val);
			if (metadata.unit === '%') {
				return `${Math.round(numVal * 100)}%`;
			}
			const decimals = metadata.step && metadata.step < 1 ? 2 : 0;
			return `${numVal.toFixed(decimals)}${metadata.unit || ''}`;
		}
		if (metadata.type === 'select') {
			const option = metadata.options?.find((opt) => opt.value === val);
			return option?.label || String(val);
		}
		return String(val);
	}

	// Handle value changes with type conversion
	function handleChange(newValue: any) {
		// Convert value based on expected type
		if (metadata.type === 'number' || metadata.type === 'range') {
			onChange(Number(newValue));
		} else if (metadata.type === 'boolean') {
			onChange(Boolean(newValue));
		} else {
			onChange(newValue);
		}
	}
</script>

<div class="parameter-control space-y-2">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<label
				for={`param-${name}`}
				class="text-sm font-medium text-speed-gray-900 dark:text-speed-gray-100"
			>
				{metadata.label}
			</label>
			{#if metadata.category === 'advanced'}
				<span
					class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
				>
					Advanced
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<span class="font-mono text-xs text-speed-gray-600 dark:text-speed-gray-400">
				{formatDisplayValue(value)}
			</span>
			{#if showDescription}
				<button
					type="button"
					class="text-speed-gray-400 hover:text-speed-gray-600 dark:hover:text-speed-gray-300"
					title={metadata.description}
				>
					<Info class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Control -->
	{#if metadata.type === 'boolean'}
		<label class="flex cursor-pointer items-center gap-3">
			<input
				id={`param-${name}`}
				type="checkbox"
				checked={value}
				onchange={(e) => handleChange(e.currentTarget.checked)}
				{disabled}
				class="h-4 w-4 rounded border-speed-gray-300 text-ferrari-500 focus:ring-2 focus:ring-ferrari-500 focus:ring-offset-0 disabled:opacity-50"
			/>
			{#if showDescription}
				<span class="text-xs text-speed-gray-600 dark:text-speed-gray-400">
					{metadata.description}
				</span>
			{/if}
		</label>
	{:else if metadata.type === 'select'}
		<select
			id={`param-${name}`}
			value={value}
			onchange={(e) => handleChange(e.currentTarget.value)}
			{disabled}
			class="w-full rounded-lg border border-speed-gray-300 bg-speed-white px-3 py-2 text-sm text-speed-gray-900 focus:border-ferrari-500 focus:outline-none focus:ring-1 focus:ring-ferrari-500 disabled:opacity-50 dark:border-speed-gray-600 dark:bg-speed-gray-800 dark:text-speed-gray-100"
		>
			{#if metadata.options}
				{#each metadata.options as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			{/if}
		</select>
	{:else if metadata.type === 'range'}
		<div class="space-y-2">
			<input
				id={`param-${name}`}
				type="range"
				min={metadata.min}
				max={metadata.max}
				step={metadata.step}
				value={value}
				oninput={(e) => handleChange(e.currentTarget.value)}
				{disabled}
				class="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-speed-gray-200 outline-none disabled:opacity-50 dark:bg-speed-gray-700"
			/>
			<div class="flex justify-between text-xs text-speed-gray-500 dark:text-speed-gray-400">
				<span>{metadata.min}{metadata.unit || ''}</span>
				<span class="font-medium text-speed-gray-700 dark:text-speed-gray-300">
					{formatDisplayValue(value)}
				</span>
				<span>{metadata.max}{metadata.unit || ''}</span>
			</div>
		</div>
	{:else if metadata.type === 'number'}
		<input
			id={`param-${name}`}
			type="number"
			min={metadata.min}
			max={metadata.max}
			step={metadata.step}
			value={value}
			onchange={(e) => handleChange(e.currentTarget.value)}
			{disabled}
			class="w-full rounded-lg border border-speed-gray-300 bg-speed-white px-3 py-2 text-sm text-speed-gray-900 focus:border-ferrari-500 focus:outline-none focus:ring-1 focus:ring-ferrari-500 disabled:opacity-50 dark:border-speed-gray-600 dark:bg-speed-gray-800 dark:text-speed-gray-100"
		/>
	{/if}

	<!-- Description (if not inline) -->
	{#if showDescription && metadata.type !== 'boolean' && metadata.description}
		<p class="text-xs text-speed-gray-600 dark:text-speed-gray-400">
			{metadata.description}
		</p>
	{/if}
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #dc143c;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		background: #b91c2e;
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #dc143c;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.1);
		background: #b91c2e;
	}

	.slider:disabled {
		cursor: not-allowed;
	}

	.slider:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}

	.slider:disabled::-moz-range-thumb {
		cursor: not-allowed;
	}
</style>