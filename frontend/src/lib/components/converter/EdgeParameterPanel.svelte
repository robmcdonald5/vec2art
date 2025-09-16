<script lang="ts">
	import AlgorithmParameterControl from './AlgorithmParameterControl.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import type { EdgeConfig, ParameterMetadata } from '$lib/types/algorithm-configs';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Get the edge configuration
	let config = $state<EdgeConfig>(algorithmConfigStore.getConfig('edge') as EdgeConfig);

	// Subscribe to changes
	$effect(() => {
		algorithmConfigStore.subscribe((newConfig) => {
			if (newConfig.algorithm === 'edge') {
				config = newConfig as EdgeConfig;
			}
		});
	});

	// Update configuration
	function updateParameter(param: keyof EdgeConfig, value: any) {
		algorithmConfigStore.updateConfig('edge', { [param]: value });
	}

	// Section visibility state
	let sectionsExpanded = $state({
		core: true,
		multipass: false,
		etfFdog: false,
		nms: false,
		flowTracing: false,
		bezier: false,
		handDrawn: false,
		color: false
	});

	function toggleSection(section: keyof typeof sectionsExpanded) {
		sectionsExpanded[section] = !sectionsExpanded[section];
	}

	// Parameter metadata definitions
	const parameters: Record<string, ParameterMetadata> = {
		// Core parameters
		detail: {
			name: 'detail',
			label: 'Detail Level',
			description: 'Overall detail preservation (0 = minimal, 1 = maximum)',
			type: 'range',
			min: 0.1,
			max: 1.0,
			step: 0.05,
			category: 'core',
			algorithms: ['edge']
		},
		strokeWidth: {
			name: 'strokeWidth',
			label: 'Stroke Width',
			description: 'Base line width in pixels',
			type: 'range',
			min: 0.5,
			max: 5.0,
			step: 0.1,
			unit: 'px',
			category: 'core',
			algorithms: ['edge']
		},
		noiseFiltering: {
			name: 'noiseFiltering',
			label: 'Noise Filtering',
			description: 'Apply noise reduction preprocessing',
			type: 'boolean',
			category: 'core',
			algorithms: ['edge']
		},

		// Multipass parameters
		enableMultipass: {
			name: 'enableMultipass',
			label: 'Enable Multipass',
			description: 'Process image multiple times for better quality',
			type: 'boolean',
			category: 'algorithm',
			algorithms: ['edge']
		},
		passCount: {
			name: 'passCount',
			label: 'Pass Count',
			description: 'Number of processing passes',
			type: 'range',
			min: 1,
			max: 10,
			step: 1,
			category: 'algorithm',
			algorithms: ['edge'],
			dependsOn: 'enableMultipass'
		},
		enableReversePass: {
			name: 'enableReversePass',
			label: 'Reverse Pass',
			description: 'Process right-to-left, bottom-to-top',
			type: 'boolean',
			category: 'algorithm',
			algorithms: ['edge'],
			dependsOn: 'enableMultipass'
		},
		enableDiagonalPass: {
			name: 'enableDiagonalPass',
			label: 'Diagonal Pass',
			description: 'Process diagonally for complex geometries',
			type: 'boolean',
			category: 'algorithm',
			algorithms: ['edge'],
			dependsOn: 'enableMultipass'
		},

		// ETF/FDoG parameters
		enableEtfFdog: {
			name: 'enableEtfFdog',
			label: 'Enable ETF/FDoG',
			description: 'Advanced edge detection using Edge Tangent Flow',
			type: 'boolean',
			category: 'advanced',
			algorithms: ['edge']
		},
		etfRadius: {
			name: 'etfRadius',
			label: 'ETF Radius',
			description: 'Edge Tangent Flow kernel radius',
			type: 'range',
			min: 2,
			max: 8,
			step: 1,
			unit: 'px',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},
		etfIterations: {
			name: 'etfIterations',
			label: 'ETF Iterations',
			description: 'Number of ETF refinement iterations',
			type: 'range',
			min: 1,
			max: 10,
			step: 1,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},

		// Flow tracing parameters
		enableFlowTracing: {
			name: 'enableFlowTracing',
			label: 'Enable Flow Tracing',
			description: 'Trace smooth polylines along flow field',
			type: 'boolean',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},
		traceMinGrad: {
			name: 'traceMinGrad',
			label: 'Min Gradient',
			description: 'Minimum gradient magnitude for tracing',
			type: 'range',
			min: 0.01,
			max: 0.1,
			step: 0.01,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableFlowTracing'
		},

		// Bezier fitting parameters
		enableBezierFitting: {
			name: 'enableBezierFitting',
			label: 'Enable Bézier Fitting',
			description: 'Fit smooth Bézier curves to traced lines',
			type: 'boolean',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableFlowTracing'
		},
		fitMaxErr: {
			name: 'fitMaxErr',
			label: 'Max Fitting Error',
			description: 'Maximum acceptable curve fitting error',
			type: 'range',
			min: 0.5,
			max: 5.0,
			step: 0.1,
			unit: 'px',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableBezierFitting'
		},

		// Hand-drawn effects
		handDrawnPreset: {
			name: 'handDrawnPreset',
			label: 'Hand-drawn Style',
			description: 'Artistic hand-drawn effect preset',
			type: 'select',
			options: [
				{ value: 'none', label: 'None' },
				{ value: 'subtle', label: 'Subtle' },
				{ value: 'moderate', label: 'Moderate' },
				{ value: 'strong', label: 'Strong' },
				{ value: 'extreme', label: 'Extreme' }
			],
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnVariableWeights: {
			name: 'handDrawnVariableWeights',
			label: 'Variable Weights',
			description: 'Stroke width variation amount',
			type: 'range',
			min: 0,
			max: 1,
			step: 0.1,
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnTremorStrength: {
			name: 'handDrawnTremorStrength',
			label: 'Tremor Strength',
			description: 'Hand tremor simulation intensity',
			type: 'range',
			min: 0,
			max: 1,
			step: 0.1,
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnTapering: {
			name: 'handDrawnTapering',
			label: 'Line Tapering',
			description: 'Natural line ending tapering',
			type: 'range',
			min: 0,
			max: 1,
			step: 0.1,
			category: 'style',
			algorithms: ['edge']
		},

		// Color parameters
		linePreserveColors: {
			name: 'linePreserveColors',
			label: 'Preserve Colors',
			description: 'Keep original image colors in output',
			type: 'boolean',
			category: 'color',
			algorithms: ['edge']
		},
		lineColorAccuracy: {
			name: 'lineColorAccuracy',
			label: 'Color Accuracy',
			description: 'Color sampling accuracy',
			type: 'range',
			min: 0,
			max: 1,
			step: 0.1,
			category: 'color',
			algorithms: ['edge'],
			dependsOn: 'linePreserveColors'
		},

		// Advanced ETF/FDoG parameters
		etfCoherencyTau: {
			name: 'etfCoherencyTau',
			label: 'ETF Coherency Threshold',
			description: 'Edge Tangent Flow coherency threshold',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.05,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},
		fdogSigmaS: {
			name: 'fdogSigmaS',
			label: 'FDoG Structure Sigma',
			description: 'Flow-based DoG structure Gaussian sigma',
			type: 'range',
			min: 0.3,
			max: 2.0,
			step: 0.1,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},
		fdogSigmaC: {
			name: 'fdogSigmaC',
			label: 'FDoG Context Sigma',
			description: 'Flow-based DoG context Gaussian sigma',
			type: 'range',
			min: 0.5,
			max: 4.0,
			step: 0.1,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},
		fdogTau: {
			name: 'fdogTau',
			label: 'FDoG Edge Threshold',
			description: 'Flow-based DoG edge detection threshold',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.05,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableEtfFdog'
		},

		// Non-Maximum Suppression parameters
		nmsLow: {
			name: 'nmsLow',
			label: 'NMS Low Threshold',
			description: 'Low hysteresis threshold for edge linking',
			type: 'range',
			min: 0.01,
			max: 0.2,
			step: 0.01,
			category: 'advanced',
			algorithms: ['edge']
		},
		nmsHigh: {
			name: 'nmsHigh',
			label: 'NMS High Threshold',
			description: 'High hysteresis threshold for strong edges',
			type: 'range',
			min: 0.05,
			max: 0.5,
			step: 0.01,
			category: 'advanced',
			algorithms: ['edge']
		},
		nmsSmoothBeforeNms: {
			name: 'nmsSmoothBeforeNms',
			label: 'Pre-NMS Smoothing',
			description: 'Apply Gaussian smoothing before NMS',
			type: 'boolean',
			category: 'advanced',
			algorithms: ['edge']
		},
		nmsSmoothSigma: {
			name: 'nmsSmoothSigma',
			label: 'Pre-NMS Smoothing Sigma',
			description: 'Gaussian sigma for pre-NMS smoothing',
			type: 'range',
			min: 0.5,
			max: 2.0,
			step: 0.1,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'nmsSmoothBeforeNms'
		},

		// Flow tracing extended parameters
		traceMinCoherency: {
			name: 'traceMinCoherency',
			label: 'Min Trace Coherency',
			description: 'Minimum coherency for flow tracing',
			type: 'range',
			min: 0.01,
			max: 0.2,
			step: 0.01,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableFlowTracing'
		},
		traceMaxGap: {
			name: 'traceMaxGap',
			label: 'Max Trace Gap',
			description: 'Maximum pixel gap to bridge during tracing',
			type: 'range',
			min: 0,
			max: 20,
			step: 1,
			unit: 'px',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableFlowTracing'
		},
		traceMaxLen: {
			name: 'traceMaxLen',
			label: 'Max Trace Length',
			description: 'Maximum polyline length for tracing',
			type: 'range',
			min: 100,
			max: 10000,
			step: 100,
			unit: 'px',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableFlowTracing'
		},

		// Extended Bézier parameters
		fitLambdaCurv: {
			name: 'fitLambdaCurv',
			label: 'Curvature Penalty',
			description: 'Curvature penalty for Bézier curve fitting',
			type: 'range',
			min: 0.001,
			max: 0.1,
			step: 0.001,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableBezierFitting'
		},
		fitSplitAngle: {
			name: 'fitSplitAngle',
			label: 'Corner Split Angle',
			description: 'Corner angle for splitting curves',
			type: 'range',
			min: 10.0,
			max: 90.0,
			step: 1.0,
			unit: '°',
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableBezierFitting'
		},
		fitMaxIterations: {
			name: 'fitMaxIterations',
			label: 'Max Fitting Iterations',
			description: 'Maximum curve fitting iterations',
			type: 'range',
			min: 10,
			max: 100,
			step: 5,
			category: 'advanced',
			algorithms: ['edge'],
			dependsOn: 'enableBezierFitting'
		},

		// Extended hand-drawn effects
		handDrawnPressureVariation: {
			name: 'handDrawnPressureVariation',
			label: 'Pressure Variation',
			description: 'Pen pressure simulation intensity',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1,
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnRoughness: {
			name: 'handDrawnRoughness',
			label: 'Line Roughness',
			description: 'Line surface roughness amount',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.1,
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnWobbleFrequency: {
			name: 'handDrawnWobbleFrequency',
			label: 'Wobble Frequency',
			description: 'Wobble oscillation frequency',
			type: 'range',
			min: 0.1,
			max: 5.0,
			step: 0.1,
			unit: 'Hz',
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnWobbleAmplitude: {
			name: 'handDrawnWobbleAmplitude',
			label: 'Wobble Amplitude',
			description: 'Wobble oscillation amplitude',
			type: 'range',
			min: 0.0,
			max: 2.0,
			step: 0.1,
			unit: 'px',
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnOvershoot: {
			name: 'handDrawnOvershoot',
			label: 'Line Overshoot',
			description: 'Line overshoot at endpoints',
			type: 'range',
			min: 0.0,
			max: 10.0,
			step: 0.5,
			unit: 'px',
			category: 'style',
			algorithms: ['edge']
		},
		handDrawnUndershoot: {
			name: 'handDrawnUndershoot',
			label: 'Line Undershoot',
			description: 'Line undershoot at endpoints',
			type: 'range',
			min: 0.0,
			max: 10.0,
			step: 0.5,
			unit: 'px',
			category: 'style',
			algorithms: ['edge']
		},

		// Extended color parameters
		lineColorSampling: {
			name: 'lineColorSampling',
			label: 'Color Sampling Method',
			description: 'Method for sampling colors from source image',
			type: 'select',
			options: [
				{ value: 'average', label: 'Average' },
				{ value: 'dominant', label: 'Dominant' },
				{ value: 'gradient', label: 'Gradient' }
			],
			category: 'color',
			algorithms: ['edge'],
			dependsOn: 'linePreserveColors'
		},
		maxColorsPerPath: {
			name: 'maxColorsPerPath',
			label: 'Max Colors Per Path',
			description: 'Maximum color segments per path',
			type: 'range',
			min: 1,
			max: 10,
			step: 1,
			category: 'color',
			algorithms: ['edge'],
			dependsOn: 'linePreserveColors'
		},
		colorTolerance: {
			name: 'colorTolerance',
			label: 'Color Clustering Tolerance',
			description: 'Color similarity tolerance for clustering',
			type: 'range',
			min: 0.0,
			max: 1.0,
			step: 0.05,
			category: 'color',
			algorithms: ['edge'],
			dependsOn: 'linePreserveColors'
		},

		// Background removal
		enableBackgroundRemoval: {
			name: 'enableBackgroundRemoval',
			label: 'Remove Background',
			description: 'Automatically remove image background',
			type: 'boolean',
			category: 'core',
			algorithms: ['edge']
		},
		backgroundRemovalStrength: {
			name: 'backgroundRemovalStrength',
			label: 'Removal Strength',
			description: 'Background removal aggressiveness',
			type: 'range',
			min: 0,
			max: 1,
			step: 0.1,
			category: 'core',
			algorithms: ['edge'],
			dependsOn: 'enableBackgroundRemoval'
		}
	};
</script>

<div class="edge-parameter-panel space-y-4">
	<!-- Core Parameters Section -->
	<div class="parameter-section">
		<button
			type="button"
			onclick={() => toggleSection('core')}
			class="flex w-full items-center justify-between rounded-lg bg-speed-gray-50 px-4 py-2 text-left hover:bg-speed-gray-100 dark:bg-speed-gray-800 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Core Settings
			</span>
			{#if sectionsExpanded.core}
				<ChevronDown class="h-4 w-4 text-speed-gray-500" />
			{:else}
				<ChevronRight class="h-4 w-4 text-speed-gray-500" />
			{/if}
		</button>

		{#if sectionsExpanded.core}
			<div class="mt-3 space-y-4 px-2">
				<AlgorithmParameterControl
					name="detail"
					value={config.detail}
					metadata={parameters.detail}
					onChange={(v) => updateParameter('detail', v)}
					{disabled}
				/>
				<AlgorithmParameterControl
					name="strokeWidth"
					value={config.strokeWidth}
					metadata={parameters.strokeWidth}
					onChange={(v) => updateParameter('strokeWidth', v)}
					{disabled}
				/>
				<AlgorithmParameterControl
					name="noiseFiltering"
					value={config.noiseFiltering}
					metadata={parameters.noiseFiltering}
					onChange={(v) => updateParameter('noiseFiltering', v)}
					{disabled}
				/>
				<AlgorithmParameterControl
					name="enableBackgroundRemoval"
					value={config.enableBackgroundRemoval}
					metadata={parameters.enableBackgroundRemoval}
					onChange={(v) => updateParameter('enableBackgroundRemoval', v)}
				/>
				{#if config.enableBackgroundRemoval}
					<AlgorithmParameterControl
						name="backgroundRemovalStrength"
						value={config.backgroundRemovalStrength}
						metadata={parameters.backgroundRemovalStrength}
						onChange={(v) => updateParameter('backgroundRemovalStrength', v)}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Multipass Section -->
	<div class="parameter-section">
		<button
			type="button"
			onclick={() => toggleSection('multipass')}
			class="flex w-full items-center justify-between rounded-lg bg-speed-gray-50 px-4 py-2 text-left hover:bg-speed-gray-100 dark:bg-speed-gray-800 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Multipass Processing
			</span>
			{#if sectionsExpanded.multipass}
				<ChevronDown class="h-4 w-4 text-speed-gray-500" />
			{:else}
				<ChevronRight class="h-4 w-4 text-speed-gray-500" />
			{/if}
		</button>

		{#if sectionsExpanded.multipass}
			<div class="mt-3 space-y-4 px-2">
				<AlgorithmParameterControl
					name="enableMultipass"
					value={config.enableMultipass}
					metadata={parameters.enableMultipass}
					onChange={(v) => updateParameter('enableMultipass', v)}
				/>
				{#if config.enableMultipass}
					<AlgorithmParameterControl
						name="passCount"
						value={config.passCount}
						metadata={parameters.passCount}
						onChange={(v) => updateParameter('passCount', v)}
						{disabled}
					/>
					<AlgorithmParameterControl
						name="enableReversePass"
						value={config.enableReversePass}
						metadata={parameters.enableReversePass}
						onChange={(v) => updateParameter('enableReversePass', v)}
						{disabled}
					/>
					<AlgorithmParameterControl
						name="enableDiagonalPass"
						value={config.enableDiagonalPass}
						metadata={parameters.enableDiagonalPass}
						onChange={(v) => updateParameter('enableDiagonalPass', v)}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Advanced Edge Detection Section -->
	<div class="parameter-section">
		<button
			type="button"
			onclick={() => toggleSection('etfFdog')}
			class="flex w-full items-center justify-between rounded-lg bg-speed-gray-50 px-4 py-2 text-left hover:bg-speed-gray-100 dark:bg-speed-gray-800 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Advanced Edge Detection
			</span>
			{#if sectionsExpanded.etfFdog}
				<ChevronDown class="h-4 w-4 text-speed-gray-500" />
			{:else}
				<ChevronRight class="h-4 w-4 text-speed-gray-500" />
			{/if}
		</button>

		{#if sectionsExpanded.etfFdog}
			<div class="mt-3 space-y-4 px-2">
				<AlgorithmParameterControl
					name="enableEtfFdog"
					value={config.enableEtfFdog}
					metadata={parameters.enableEtfFdog}
					onChange={(v) => updateParameter('enableEtfFdog', v)}
				/>
				{#if config.enableEtfFdog}
					<AlgorithmParameterControl
						name="etfRadius"
						value={config.etfRadius}
						metadata={parameters.etfRadius}
						onChange={(v) => updateParameter('etfRadius', v)}
						{disabled}
					/>
					<AlgorithmParameterControl
						name="etfIterations"
						value={config.etfIterations}
						metadata={parameters.etfIterations}
						onChange={(v) => updateParameter('etfIterations', v)}
					/>
					<AlgorithmParameterControl
						name="etfCoherencyTau"
						value={config.etfCoherencyTau}
						metadata={parameters.etfCoherencyTau}
						onChange={(v) => updateParameter('etfCoherencyTau', v)}
					/>
					<AlgorithmParameterControl
						name="fdogSigmaS"
						value={config.fdogSigmaS}
						metadata={parameters.fdogSigmaS}
						onChange={(v) => updateParameter('fdogSigmaS', v)}
					/>
					<AlgorithmParameterControl
						name="fdogSigmaC"
						value={config.fdogSigmaC}
						metadata={parameters.fdogSigmaC}
						onChange={(v) => updateParameter('fdogSigmaC', v)}
					/>
					<AlgorithmParameterControl
						name="fdogTau"
						value={config.fdogTau}
						metadata={parameters.fdogTau}
						onChange={(v) => updateParameter('fdogTau', v)}
					/>

					<!-- Flow Tracing -->
					<AlgorithmParameterControl
						name="enableFlowTracing"
						value={config.enableFlowTracing}
						metadata={parameters.enableFlowTracing}
						onChange={(v) => updateParameter('enableFlowTracing', v)}
					/>
					{#if config.enableFlowTracing}
						<AlgorithmParameterControl
							name="traceMinGrad"
							value={config.traceMinGrad}
							metadata={parameters.traceMinGrad}
							onChange={(v) => updateParameter('traceMinGrad', v)}
						/>
						<AlgorithmParameterControl
							name="traceMinCoherency"
							value={config.traceMinCoherency}
							metadata={parameters.traceMinCoherency}
							onChange={(v) => updateParameter('traceMinCoherency', v)}
						/>
						<AlgorithmParameterControl
							name="traceMaxGap"
							value={config.traceMaxGap}
							metadata={parameters.traceMaxGap}
							onChange={(v) => updateParameter('traceMaxGap', v)}
						/>
						<AlgorithmParameterControl
							name="traceMaxLen"
							value={config.traceMaxLen}
							metadata={parameters.traceMaxLen}
							onChange={(v) => updateParameter('traceMaxLen', v)}
						/>

						<!-- Bezier Fitting -->
						<AlgorithmParameterControl
							name="enableBezierFitting"
							value={config.enableBezierFitting}
							metadata={parameters.enableBezierFitting}
							onChange={(v) => updateParameter('enableBezierFitting', v)}
						/>
						{#if config.enableBezierFitting}
							<AlgorithmParameterControl
								name="fitMaxErr"
								value={config.fitMaxErr}
								metadata={parameters.fitMaxErr}
								onChange={(v) => updateParameter('fitMaxErr', v)}
							/>
							<AlgorithmParameterControl
								name="fitLambdaCurv"
								value={config.fitLambdaCurv}
								metadata={parameters.fitLambdaCurv}
								onChange={(v) => updateParameter('fitLambdaCurv', v)}
							/>
							<AlgorithmParameterControl
								name="fitSplitAngle"
								value={config.fitSplitAngle}
								metadata={parameters.fitSplitAngle}
								onChange={(v) => updateParameter('fitSplitAngle', v)}
							/>
							<AlgorithmParameterControl
								name="fitMaxIterations"
								value={config.fitMaxIterations}
								metadata={parameters.fitMaxIterations}
								onChange={(v) => updateParameter('fitMaxIterations', v)}
							/>
						{/if}
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Non-Maximum Suppression Section -->
	<div class="parameter-section">
		<button
			type="button"
			onclick={() => toggleSection('nms')}
			class="flex w-full items-center justify-between rounded-lg bg-speed-gray-50 px-4 py-2 text-left hover:bg-speed-gray-100 dark:bg-speed-gray-800 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Edge Refinement (NMS)
			</span>
			{#if sectionsExpanded.nms}
				<ChevronDown class="h-4 w-4 text-speed-gray-500" />
			{:else}
				<ChevronRight class="h-4 w-4 text-speed-gray-500" />
			{/if}
		</button>

		{#if sectionsExpanded.nms}
			<div class="mt-3 space-y-4 px-2">
				<AlgorithmParameterControl
					name="nmsLow"
					value={config.nmsLow}
					metadata={parameters.nmsLow}
					onChange={(v) => updateParameter('nmsLow', v)}
				/>
				<AlgorithmParameterControl
					name="nmsHigh"
					value={config.nmsHigh}
					metadata={parameters.nmsHigh}
					onChange={(v) => updateParameter('nmsHigh', v)}
				/>
				<AlgorithmParameterControl
					name="nmsSmoothBeforeNms"
					value={config.nmsSmoothBeforeNms}
					metadata={parameters.nmsSmoothBeforeNms}
					onChange={(v) => updateParameter('nmsSmoothBeforeNms', v)}
				/>
				{#if config.nmsSmoothBeforeNms}
					<AlgorithmParameterControl
						name="nmsSmoothSigma"
						value={config.nmsSmoothSigma}
						metadata={parameters.nmsSmoothSigma}
						onChange={(v) => updateParameter('nmsSmoothSigma', v)}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Hand-drawn Effects Section -->
	<div class="parameter-section">
		<button
			type="button"
			onclick={() => toggleSection('handDrawn')}
			class="flex w-full items-center justify-between rounded-lg bg-speed-gray-50 px-4 py-2 text-left hover:bg-speed-gray-100 dark:bg-speed-gray-800 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Hand-drawn Effects
			</span>
			{#if sectionsExpanded.handDrawn}
				<ChevronDown class="h-4 w-4 text-speed-gray-500" />
			{:else}
				<ChevronRight class="h-4 w-4 text-speed-gray-500" />
			{/if}
		</button>

		{#if sectionsExpanded.handDrawn}
			<div class="mt-3 space-y-4 px-2">
				<AlgorithmParameterControl
					name="handDrawnPreset"
					value={config.handDrawnPreset}
					metadata={parameters.handDrawnPreset}
					onChange={(v) => updateParameter('handDrawnPreset', v)}
				/>
				{#if config.handDrawnPreset !== 'none'}
					<AlgorithmParameterControl
						name="handDrawnVariableWeights"
						value={config.handDrawnVariableWeights}
						metadata={parameters.handDrawnVariableWeights}
						onChange={(v) => updateParameter('handDrawnVariableWeights', v)}
						{disabled}
					/>
					<AlgorithmParameterControl
						name="handDrawnTremorStrength"
						value={config.handDrawnTremorStrength}
						metadata={parameters.handDrawnTremorStrength}
						onChange={(v) => updateParameter('handDrawnTremorStrength', v)}
						{disabled}
					/>
					<AlgorithmParameterControl
						name="handDrawnTapering"
						value={config.handDrawnTapering}
						metadata={parameters.handDrawnTapering}
						onChange={(v) => updateParameter('handDrawnTapering', v)}
					/>
					<AlgorithmParameterControl
						name="handDrawnPressureVariation"
						value={config.handDrawnPressureVariation}
						metadata={parameters.handDrawnPressureVariation}
						onChange={(v) => updateParameter('handDrawnPressureVariation', v)}
					/>
					<AlgorithmParameterControl
						name="handDrawnRoughness"
						value={config.handDrawnRoughness}
						metadata={parameters.handDrawnRoughness}
						onChange={(v) => updateParameter('handDrawnRoughness', v)}
					/>
					<AlgorithmParameterControl
						name="handDrawnWobbleFrequency"
						value={config.handDrawnWobbleFrequency}
						metadata={parameters.handDrawnWobbleFrequency}
						onChange={(v) => updateParameter('handDrawnWobbleFrequency', v)}
					/>
					<AlgorithmParameterControl
						name="handDrawnWobbleAmplitude"
						value={config.handDrawnWobbleAmplitude}
						metadata={parameters.handDrawnWobbleAmplitude}
						onChange={(v) => updateParameter('handDrawnWobbleAmplitude', v)}
					/>
					<AlgorithmParameterControl
						name="handDrawnOvershoot"
						value={config.handDrawnOvershoot}
						metadata={parameters.handDrawnOvershoot}
						onChange={(v) => updateParameter('handDrawnOvershoot', v)}
					/>
					<AlgorithmParameterControl
						name="handDrawnUndershoot"
						value={config.handDrawnUndershoot}
						metadata={parameters.handDrawnUndershoot}
						onChange={(v) => updateParameter('handDrawnUndershoot', v)}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Color Settings Section -->
	<div class="parameter-section">
		<button
			type="button"
			onclick={() => toggleSection('color')}
			class="flex w-full items-center justify-between rounded-lg bg-speed-gray-50 px-4 py-2 text-left hover:bg-speed-gray-100 dark:bg-speed-gray-800 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Color Settings
			</span>
			{#if sectionsExpanded.color}
				<ChevronDown class="h-4 w-4 text-speed-gray-500" />
			{:else}
				<ChevronRight class="h-4 w-4 text-speed-gray-500" />
			{/if}
		</button>

		{#if sectionsExpanded.color}
			<div class="mt-3 space-y-4 px-2">
				<AlgorithmParameterControl
					name="linePreserveColors"
					value={config.linePreserveColors}
					metadata={parameters.linePreserveColors}
					onChange={(v) => updateParameter('linePreserveColors', v)}
				/>
				{#if config.linePreserveColors}
					<AlgorithmParameterControl
						name="lineColorSampling"
						value={config.lineColorSampling}
						metadata={parameters.lineColorSampling}
						onChange={(v) => updateParameter('lineColorSampling', v)}
					/>
					<AlgorithmParameterControl
						name="lineColorAccuracy"
						value={config.lineColorAccuracy}
						metadata={parameters.lineColorAccuracy}
						onChange={(v) => updateParameter('lineColorAccuracy', v)}
					/>
					<AlgorithmParameterControl
						name="maxColorsPerPath"
						value={config.maxColorsPerPath}
						metadata={parameters.maxColorsPerPath}
						onChange={(v) => updateParameter('maxColorsPerPath', v)}
					/>
					<AlgorithmParameterControl
						name="colorTolerance"
						value={config.colorTolerance}
						metadata={parameters.colorTolerance}
						onChange={(v) => updateParameter('colorTolerance', v)}
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.parameter-section {
		border-radius: 0.5rem;
		overflow: hidden;
	}
</style>