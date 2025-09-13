<script lang="ts">
	import { Info } from 'lucide-svelte';
	import type { VectorizerConfig } from '$lib/types/vectorizer';

	interface Props {
		parameter: keyof VectorizerConfig;
		value: any;
		onChange: (_newValue: any) => void;
		disabled?: boolean;
		showOverride?: boolean;
	}

	let { parameter, value, onChange, disabled = false, showOverride = false }: Props = $props();

	// Parameter metadata for UI generation
	const parameterMeta: Record<
		string,
		{
			label: string;
			description: string;
			type: 'number' | 'boolean' | 'select' | 'range';
			min?: number;
			max?: number;
			step?: number;
			options?: { value: any; label: string }[];
			unit?: string;
		}
	> = {
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

		// Noise filtering advanced
		noise_filter_spatial_sigma: {
			label: 'Spatial Sigma',
			description: 'Noise filter spatial domain standard deviation (higher = more smoothing)',
			type: 'range',
			min: 0.5,
			max: 1.5,
			step: 0.1
		},
		noise_filter_range_sigma: {
			label: 'Range Sigma',
			description: 'Noise filter range domain standard deviation (higher = less edge preservation)',
			type: 'range',
			min: 10.0,
			max: 100.0,
			step: 5.0
		},

		// Multi-pass advanced
		multipass_mode: {
			label: 'Multi-pass Mode',
			description: 'How multi-pass thresholds are determined',
			type: 'select',
			options: [
				{ value: 'auto', label: 'Auto - Calculated thresholds' },
				{ value: 'manual', label: 'Manual - Custom thresholds' }
			]
		},
		conservative_detail: {
			label: 'Conservative Detail',
			description: 'Detail level for conservative passes (manual mode)',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1
		},
		aggressive_detail: {
			label: 'Aggressive Detail',
			description: 'Detail level for aggressive passes (manual mode)',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1
		},
		directional_strength_threshold: {
			label: 'Directional Strength',
			description: 'Threshold for directional processing strength',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1
		},

		// Advanced Edge Detection (ETF/FDoG)
		enable_etf_fdog: {
			label: 'Enable ETF/FDoG',
			description:
				'Advanced edge detection using Edge Tangent Flow and Flow-based Difference of Gaussians',
			type: 'boolean'
		},
		etf_radius: {
			label: 'ETF Radius',
			description: 'Edge Tangent Flow neighborhood radius',
			type: 'range',
			min: 2,
			max: 8,
			step: 1,
			unit: 'px'
		},
		etf_iterations: {
			label: 'ETF Iterations',
			description: 'Number of Edge Tangent Flow iterations',
			type: 'range',
			min: 2,
			max: 8,
			step: 1
		},
		etf_coherency_tau: {
			label: 'ETF Coherency Tau',
			description: 'Edge coherency threshold parameter',
			type: 'range',
			min: 0.1,
			max: 0.5,
			step: 0.01
		},
		fdog_sigma_s: {
			label: 'FDoG Sigma S',
			description: 'Flow-based DoG sigma for structure detection',
			type: 'range',
			min: 0.4,
			max: 2.0,
			step: 0.1
		},
		fdog_sigma_c: {
			label: 'FDoG Sigma C',
			description: 'Flow-based DoG sigma for coherence detection',
			type: 'range',
			min: 1.0,
			max: 4.0,
			step: 0.1
		},
		fdog_tau: {
			label: 'FDoG Tau',
			description: 'Flow-based DoG tau parameter',
			type: 'range',
			min: 0.5,
			max: 1.0,
			step: 0.05
		},
		nms_low: {
			label: 'NMS Low Threshold',
			description: 'Non-maximum suppression low threshold',
			type: 'range',
			min: 0.02,
			max: 0.2,
			step: 0.01
		},
		nms_high: {
			label: 'NMS High Threshold',
			description: 'Non-maximum suppression high threshold',
			type: 'range',
			min: 0.1,
			max: 0.4,
			step: 0.01
		},

		// Flow-guided tracing
		enable_flow_tracing: {
			label: 'Enable Flow Tracing',
			description: 'Advanced flow-guided line tracing',
			type: 'boolean'
		},
		trace_min_gradient: {
			label: 'Min Gradient',
			description: 'Minimum gradient strength for tracing',
			type: 'range',
			min: 0.02,
			max: 0.2,
			step: 0.01
		},
		trace_min_coherency: {
			label: 'Min Coherency',
			description: 'Minimum flow coherency for tracing',
			type: 'range',
			min: 0.05,
			max: 0.3,
			step: 0.01
		},
		trace_max_gap: {
			label: 'Max Gap',
			description: 'Maximum gap to bridge during tracing',
			type: 'range',
			min: 2,
			max: 10,
			step: 1,
			unit: 'px'
		},
		trace_max_length: {
			label: 'Max Length',
			description: 'Maximum trace length before termination',
			type: 'range',
			min: 1000,
			max: 50000,
			step: 1000,
			unit: 'px'
		},

		// Bézier curve fitting
		enable_bezier_fitting: {
			label: 'Enable Bézier Fitting',
			description: 'Fit smooth Bézier curves to traced lines',
			type: 'boolean'
		},
		fit_lambda_curvature: {
			label: 'Curvature Weight',
			description: 'Weight for curvature continuity in curve fitting',
			type: 'range',
			min: 0.01,
			max: 0.1,
			step: 0.005
		},
		fit_max_error: {
			label: 'Max Fitting Error',
			description: 'Maximum acceptable error for curve fitting',
			type: 'range',
			min: 0.5,
			max: 2.0,
			step: 0.1,
			unit: 'px'
		},
		fit_split_angle: {
			label: 'Split Angle',
			description: 'Angle threshold for splitting curves',
			type: 'range',
			min: 15,
			max: 60,
			step: 5,
			unit: '°'
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
		dot_initialization_pattern: {
			label: 'Dot Initialization Pattern',
			description: 'Pattern used for initial dot placement',
			type: 'select',
			options: [
				{ value: 'square', label: 'Square - Regular grid pattern' },
				{ value: 'hexagonal', label: 'Hexagonal - Honeycomb pattern' },
				{ value: 'poisson', label: 'Poisson - Random natural distribution' }
			]
		},
		background_tolerance: {
			label: 'Background Tolerance',
			description: 'Tolerance for background detection and removal',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.05
		},
		poisson_disk_sampling: {
			label: 'Poisson Sampling',
			description: 'Use Poisson disk sampling for dot placement',
			type: 'boolean'
		},
		min_distance_factor: {
			label: 'Min Distance Factor',
			description: 'Minimum distance factor between dots',
			type: 'range',
			min: 0.5,
			max: 2.0,
			step: 0.1
		},
		grid_resolution: {
			label: 'Grid Resolution',
			description: 'Resolution of the placement grid',
			type: 'range',
			min: 0.5,
			max: 2.0,
			step: 0.1
		},
		gradient_based_sizing: {
			label: 'Gradient-based Sizing',
			description: 'Size dots based on local image gradients',
			type: 'boolean'
		},
		local_variance_scaling: {
			label: 'Local Variance Scaling',
			description: 'Scale dot sizes based on local image variance',
			type: 'boolean'
		},
		color_clustering: {
			label: 'Color Clustering',
			description: 'Group dots by similar colors',
			type: 'boolean'
		},
		opacity_variation: {
			label: 'Opacity Variation',
			description: 'Amount of opacity variation in dots',
			type: 'range',
			min: 0.5,
			max: 1.0,
			step: 0.05
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
		slic_iterations: {
			label: 'SLIC Iterations',
			description: 'Number of SLIC algorithm iterations',
			type: 'range',
			min: 5,
			max: 15,
			step: 1
		},
		superpixel_initialization_pattern: {
			label: 'Initialization Pattern',
			description: 'Pattern used for placing initial superpixel cluster centers',
			type: 'select',
			options: [
				{ value: 'square', label: 'Square - Regular grid (may show artifacts)' },
				{ value: 'hexagonal', label: 'Hexagonal - Honeycomb (balanced)' },
				{ value: 'poisson', label: 'Poisson - Random natural (best quality)' }
			]
		},
		min_region_size: {
			label: 'Minimum Region Size',
			description: 'Minimum allowed superpixel region size',
			type: 'range',
			min: 10,
			max: 100,
			step: 5,
			unit: 'px²'
		},
		color_distance: {
			label: 'Color Distance Weight',
			description: 'Weight for color similarity in clustering',
			type: 'range',
			min: 10,
			max: 50,
			step: 2
		},
		spatial_distance_weight: {
			label: 'Spatial Distance Weight',
			description: 'Weight for spatial proximity in clustering',
			type: 'range',
			min: 0.5,
			max: 2.0,
			step: 0.1
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
		simplify_boundaries: {
			label: 'Simplify Boundaries',
			description: 'Simplify region boundary paths',
			type: 'boolean'
		},
		boundary_epsilon: {
			label: 'Boundary Epsilon',
			description: 'Path simplification tolerance for boundaries',
			type: 'range',
			min: 0.5,
			max: 3.0,
			step: 0.1,
			unit: 'px'
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
		sensitivity_k: {
			label: 'Sensitivity K',
			description: 'Adaptive threshold sensitivity parameter',
			type: 'range',
			min: 0.3,
			max: 0.5,
			step: 0.01
		},
		thinning_algorithm: {
			label: 'Thinning Algorithm',
			description: 'Algorithm used for skeleton thinning',
			type: 'select',
			options: [{ value: 'guo_hall', label: 'Guo-Hall - Fast and reliable' }]
		},
		use_optimized: {
			label: 'Use Optimized Processing',
			description: 'Enable optimized processing algorithms',
			type: 'boolean'
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
		micro_loop_removal: {
			label: 'Micro Loop Removal',
			description: 'Size threshold for removing small loops',
			type: 'range',
			min: 8,
			max: 16,
			step: 1,
			unit: 'px'
		},
		max_join_distance: {
			label: 'Max Join Distance',
			description: 'Maximum distance for joining nearby line segments',
			type: 'range',
			min: 3,
			max: 10,
			step: 1,
			unit: 'px'
		},
		max_join_angle: {
			label: 'Max Join Angle',
			description: 'Maximum angle for joining line segments',
			type: 'range',
			min: 15,
			max: 45,
			step: 5,
			unit: '°'
		},
		edt_bridge_check: {
			label: 'EDT Bridge Check',
			description: 'Use Euclidean Distance Transform for bridge validation',
			type: 'boolean'
		},
		enable_width_modulation: {
			label: 'Enable Width Modulation',
			description: 'Generate variable-width lines based on image content',
			type: 'boolean'
		},
		edt_radius_ratio: {
			label: 'EDT Radius Ratio',
			description: 'Radius ratio for Euclidean Distance Transform',
			type: 'range',
			min: 0.5,
			max: 0.9,
			step: 0.05
		},
		width_modulation_range: {
			label: 'Width Modulation Range',
			description: 'Range for width modulation (comma-separated min,max)',
			type: 'number' // Special handling needed for array type
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
		adaptive_simplification: {
			label: 'Adaptive Simplification',
			description: 'Use adaptive path simplification based on curvature',
			type: 'boolean'
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

	let meta = $derived(
		parameterMeta[parameter] || {
			label: parameter,
			description: 'Parameter description not available',
			type: 'number' as const
		}
	);

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
			<label class="text-foreground text-sm font-medium" for={parameter}>
				{meta.label}
			</label>
			{#if showOverride}
				<span class="rounded border bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
					Override
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<span class="text-muted-foreground font-mono text-xs">
				{displayValue}
			</span>
			<button class="text-muted-foreground hover:text-foreground" title={meta.description}>
				<Info class="h-3 w-3" />
			</button>
		</div>
	</div>

	<!-- Control based on parameter type -->
	{#if meta.type === 'boolean'}
		<label class="flex cursor-pointer items-center gap-2">
			<input
				type="checkbox"
				id={parameter}
				checked={value}
				onchange={(e) => onChange(e.currentTarget.checked)}
				{disabled}
				class="border-input mobile-touch-target cursor-pointer rounded"
			/>
			<span class="text-muted-foreground text-xs">{meta.description}</span>
		</label>
	{:else if meta.type === 'select'}
		<select
			id={parameter}
			{value}
			onchange={(e) => {
				const val = e.currentTarget.value;
				// Try to parse as number if it looks numeric
				const numericVal = Number(val);
				onChange(isNaN(numericVal) ? val : numericVal);
			}}
			{disabled}
			class="border-input bg-background focus:ring-ring w-full rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
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
				{value}
				oninput={(e) => onChange(Number(e.currentTarget.value))}
				{disabled}
				class="bg-muted slider h-2 w-full cursor-pointer appearance-none rounded-lg"
			/>
			<div class="text-muted-foreground flex justify-between text-xs">
				<span>{meta.min}{meta.unit || ''}</span>
				<span>{meta.max}{meta.unit || ''}</span>
			</div>
		</div>
	{:else}
		<!-- Fallback numeric input -->
		<input
			type="number"
			id={parameter}
			{value}
			onchange={(e) => onChange(Number(e.currentTarget.value))}
			{disabled}
			class="border-input bg-background focus:ring-ring w-full rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
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
