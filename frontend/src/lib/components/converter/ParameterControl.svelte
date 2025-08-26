<script lang="ts">
	import { RotateCcw, Info } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { VectorizerConfig } from '$lib/types/vectorizer';
	
	interface Props {
		parameter: keyof VectorizerConfig;
		value: any;
		onChange: (value: any) => void;
		disabled?: boolean;
		showOverride?: boolean;
	}
	
	let { parameter, value, onChange, disabled = false, showOverride = false }: Props = $props();
	
	// Parameter metadata for UI generation
	const parameterMeta: Record<string, {
		label: string;
		description: string;
		type: 'number' | 'boolean' | 'select' | 'range';
		min?: number;
		max?: number;
		step?: number;
		options?: { value: any; label: string }[];
		unit?: string;
	}> = {
		// Core parameters
		detail: {
			label: 'Detail Level',
			description: 'Amount of detail to preserve (0 = low, 1 = high)',
			type: 'range',
			min: 0.1,
			max: 1.0,
			step: 0.1,
			unit: '%'
		},
		stroke_width: {
			label: 'Stroke Width',
			description: 'Width of generated strokes in pixels',
			type: 'range',
			min: 0.5,
			max: 5.0,
			step: 0.1,
			unit: 'px'
		},
		noise_filtering: {
			label: 'Noise Filtering',
			description: 'Apply noise reduction preprocessing',
			type: 'boolean'
		},
		
		// Multi-pass processing
		multipass: {
			label: 'Multi-pass Processing',
			description: 'Enable multiple processing passes for better quality',
			type: 'boolean'
		},
		pass_count: {
			label: 'Pass Count',
			description: 'Number of processing passes (1-4)',
			type: 'select',
			options: [
				{ value: 1, label: '1 Pass (Fastest)' },
				{ value: 2, label: '2 Passes (Balanced)' },
				{ value: 3, label: '3 Passes (Quality)' },
				{ value: 4, label: '4 Passes (Maximum)' }
			]
		},
		reverse_pass: {
			label: 'Reverse Pass',
			description: 'Process in reverse direction to catch missed details',
			type: 'boolean'
		},
		diagonal_pass: {
			label: 'Diagonal Pass',
			description: 'Process diagonally for complex geometries',
			type: 'boolean'
		},
		
		// Hand-drawn effects
		hand_drawn_preset: {
			label: 'Hand-drawn Style',
			description: 'Predefined artistic effect level',
			type: 'select',
			options: [
				{ value: 'none', label: 'None - Clean lines' },
				{ value: 'subtle', label: 'Subtle - Light variation' },
				{ value: 'medium', label: 'Medium - Natural look' },
				{ value: 'strong', label: 'Strong - Artistic style' },
				{ value: 'sketchy', label: 'Sketchy - Hand-drawn feel' },
				{ value: 'custom', label: 'Custom - Manual control' }
			]
		},
		variable_weights: {
			label: 'Variable Line Weights',
			description: 'Amount of stroke width variation (0-1)',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1
		},
		tremor_strength: {
			label: 'Tremor Strength',
			description: 'Hand tremor simulation intensity (0-0.5)',
			type: 'range',
			min: 0.0,
			max: 0.5,
			step: 0.05
		},
		tapering: {
			label: 'Line Tapering',
			description: 'Natural line ending tapering (0-1)',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1
		},
		
		// Dots backend
		dot_density_threshold: {
			label: 'Dot Density',
			description: 'Threshold for dot placement density',
			type: 'range',
			min: 0.1,
			max: 1.0,
			step: 0.05
		},
		min_radius: {
			label: 'Minimum Dot Size',
			description: 'Smallest dot radius in pixels',
			type: 'range',
			min: 0.2,
			max: 3.0,
			step: 0.1,
			unit: 'px'
		},
		max_radius: {
			label: 'Maximum Dot Size',
			description: 'Largest dot radius in pixels',
			type: 'range',
			min: 0.5,
			max: 10.0,
			step: 0.1,
			unit: 'px'
		},
		adaptive_sizing: {
			label: 'Adaptive Sizing',
			description: 'Adjust dot sizes based on image content',
			type: 'boolean'
		},
		poisson_disk_sampling: {
			label: 'Poisson Sampling',
			description: 'Use Poisson disk sampling for dot placement',
			type: 'boolean'
		},
		
		// Superpixel backend
		num_superpixels: {
			label: 'Number of Regions',
			description: 'Target number of superpixel regions',
			type: 'range',
			min: 20,
			max: 500,
			step: 10
		},
		compactness: {
			label: 'Compactness',
			description: 'Balance between color and spatial proximity',
			type: 'range',
			min: 5,
			max: 30,
			step: 1
		},
		fill_regions: {
			label: 'Fill Regions',
			description: 'Fill superpixel regions with solid colors',
			type: 'boolean'
		},
		stroke_regions: {
			label: 'Stroke Regions',
			description: 'Draw outlines around regions',
			type: 'boolean'
		},
		
		// Centerline backend
		enable_adaptive_threshold: {
			label: 'Adaptive Thresholding',
			description: 'Use adaptive thresholding for better accuracy',
			type: 'boolean'
		},
		window_size: {
			label: 'Window Size',
			description: 'Adaptive threshold window size in pixels',
			type: 'range',
			min: 15,
			max: 35,
			step: 2,
			unit: 'px'
		},
		min_branch_length: {
			label: 'Minimum Branch Length',
			description: 'Minimum length for skeleton branches',
			type: 'range',
			min: 4,
			max: 24,
			step: 1,
			unit: 'px'
		},
		douglas_peucker_epsilon: {
			label: 'Path Smoothing',
			description: 'Amount of path simplification (lower = smoother)',
			type: 'range',
			min: 0.5,
			max: 3.0,
			step: 0.1,
			unit: 'px'
		},
		
		// Color processing
		preserve_colors: {
			label: 'Preserve Colors',
			description: 'Keep original image colors vs monochrome output',
			type: 'boolean'
		},
		color_sampling: {
			label: 'Color Sampling',
			description: 'Method for color extraction and processing',
			type: 'select',
			options: [
				{ value: 'dominant', label: 'Dominant - Simple color extraction' },
				{ value: 'gradient', label: 'Gradient - Smooth color transitions' },
				{ value: 'content-aware', label: 'Content-aware - Smart sampling' },
				{ value: 'adaptive', label: 'Adaptive - Dynamic sampling' }
			]
		},
		color_accuracy: {
			label: 'Color Accuracy',
			description: 'Balance between color fidelity and performance',
			type: 'range',
			min: 0.1,
			max: 1.0,
			step: 0.1
		}
	};
	
	let meta = $derived(parameterMeta[parameter] || {
		label: parameter,
		description: 'Parameter description not available',
		type: 'number' as const
	});
	
	// Format display value
	let displayValue = $derived(() => {
		if (meta.type === 'range' && meta.unit === '%') {
			return `${Math.round((value as number) * 100)}%`;
		}
		if (meta.type === 'range' && typeof value === 'number') {
			return `${value.toFixed(meta.step && meta.step < 1 ? 1 : 0)}${meta.unit || ''}`;
		}
		return value;
	});
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<label class="text-sm font-medium text-foreground" for={parameter}>
				{meta.label}
			</label>
			{#if showOverride}
				<span class="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border">
					Override
				</span>
			{/if}
		</div>
		
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted-foreground font-mono">
				{displayValue}
			</span>
			<button 
				class="text-muted-foreground hover:text-foreground"
				title={meta.description}
			>
				<Info class="h-3 w-3" />
			</button>
		</div>
	</div>
	
	<!-- Control based on parameter type -->
	{#if meta.type === 'boolean'}
		<label class="flex items-center gap-2 cursor-pointer">
			<input 
				type="checkbox" 
				id={parameter}
				checked={value}
				onchange={(e) => onChange(e.currentTarget.checked)}
				disabled={disabled}
				class="rounded border-input"
			/>
			<span class="text-xs text-muted-foreground">{meta.description}</span>
		</label>
		
	{:else if meta.type === 'select'}
		<select 
			id={parameter}
			value={value}
			onchange={(e) => {
				const val = e.currentTarget.value;
				// Try to parse as number if it looks numeric
				const numericVal = Number(val);
				onChange(isNaN(numericVal) ? val : numericVal);
			}}
			disabled={disabled}
			class="w-full px-2 py-1 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
		>
			{#each meta.options || [] as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		
	{:else if meta.type === 'range'}
		<div class="space-y-1">
			<input 
				type="range"
				id={parameter}
				min={meta.min}
				max={meta.max}
				step={meta.step}
				value={value}
				oninput={(e) => onChange(Number(e.currentTarget.value))}
				disabled={disabled}
				class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
			/>
			<div class="flex justify-between text-xs text-muted-foreground">
				<span>{meta.min}{meta.unit || ''}</span>
				<span>{meta.max}{meta.unit || ''}</span>
			</div>
		</div>
		
	{:else}
		<!-- Fallback numeric input -->
		<input 
			type="number"
			id={parameter}
			value={value}
			onchange={(e) => onChange(Number(e.currentTarget.value))}
			disabled={disabled}
			class="w-full px-2 py-1 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
		/>
	{/if}
</div>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
	}
	
	.slider::-moz-range-thumb {
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		border: none;
	}
</style>