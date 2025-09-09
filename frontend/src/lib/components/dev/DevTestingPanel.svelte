<script lang="ts">
	// import { onMount } from "svelte";
	import { Button } from '$lib/components/ui/button';
	import { vectorizerStore } from '$lib/stores/vectorizer.svelte';

	// Dev panel state
	let isExpanded = $state(false);
	let introspectionResults = $state<any>(null);
	let validationResults = $state<any[]>([]);
	let functionTestResults = $state<any[]>([]);
	let isRunningTests = $state(false);

	// Expected WASM functions from our introspection tool
	const expectedFunctions = [
		// Core functions (all backends)
		{ name: 'set_detail', backend: 'all', required: true, type: 'float', range: '0.0-1.0' },
		{ name: 'set_stroke_width', backend: 'all', required: true, type: 'float', range: '0.1-10.0' },
		{ name: 'set_noise_filtering', backend: 'all', required: true, type: 'bool' },
		{ name: 'set_backend', backend: 'all', required: true, type: 'string' },

		// Hand-drawn aesthetics (most backends)
		{ name: 'set_hand_drawn_preset', backend: 'all', required: true, type: 'string' },
		{
			name: 'set_custom_variable_weights',
			backend: 'edge,centerline,superpixel',
			required: false,
			type: 'float',
			range: '0.0-1.0'
		},
		{
			name: 'set_custom_tremor',
			backend: 'edge,centerline,superpixel',
			required: false,
			type: 'float',
			range: '0.0-0.5'
		},
		{
			name: 'set_tapering',
			backend: 'edge,centerline,superpixel',
			required: false,
			type: 'float',
			range: '0.0-1.0'
		},

		// Edge backend specific
		{ name: 'set_multipass', backend: 'edge', required: true, type: 'bool' },
		{ name: 'set_reverse_pass', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_diagonal_pass', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_enable_etf_fdog', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_enable_flow_tracing', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_enable_bezier_fitting', backend: 'edge', required: false, type: 'bool' },

		// Centerline backend specific
		{ name: 'set_enable_adaptive_threshold', backend: 'centerline', required: false, type: 'bool' },
		{
			name: 'set_window_size',
			backend: 'centerline',
			required: false,
			type: 'int',
			range: '15-50'
		},
		{
			name: 'set_sensitivity_k',
			backend: 'centerline',
			required: false,
			type: 'float',
			range: '0.1-1.0'
		},
		{
			name: 'set_min_branch_length',
			backend: 'centerline',
			required: false,
			type: 'int',
			range: '4-24'
		},
		{ name: 'set_enable_width_modulation', backend: 'centerline', required: false, type: 'bool' },
		{
			name: 'set_douglas_peucker_epsilon',
			backend: 'centerline',
			required: false,
			type: 'float',
			range: '0.5-3.0'
		},

		// Superpixel backend specific
		{
			name: 'set_num_superpixels',
			backend: 'superpixel',
			required: false,
			type: 'int',
			range: '20-1000'
		},
		{
			name: 'set_compactness',
			backend: 'superpixel',
			required: false,
			type: 'float',
			range: '1-50'
		},
		{
			name: 'set_slic_iterations',
			backend: 'superpixel',
			required: false,
			type: 'int',
			range: '5-15'
		},
		{ name: 'set_fill_regions', backend: 'superpixel', required: false, type: 'bool' },
		{ name: 'set_stroke_regions', backend: 'superpixel', required: false, type: 'bool' },
		{ name: 'set_simplify_boundaries', backend: 'superpixel', required: false, type: 'bool' },
		{
			name: 'set_boundary_epsilon',
			backend: 'superpixel',
			required: false,
			type: 'float',
			range: '0.5-3.0'
		},

		// Dots backend specific
		{ name: 'set_dot_density', backend: 'dots', required: false, type: 'float', range: '0.0-1.0' },
		{
			name: 'set_dot_size_range',
			backend: 'dots',
			required: false,
			type: 'function',
			params: ['min_radius', 'max_radius']
		},
		{ name: 'set_preserve_colors', backend: 'dots', required: false, type: 'bool' },
		{ name: 'set_adaptive_sizing', backend: 'dots', required: false, type: 'bool' },
		{
			name: 'set_background_tolerance',
			backend: 'dots',
			required: false,
			type: 'float',
			range: '0.0-1.0'
		},
		{ name: 'set_poisson_disk_sampling', backend: 'dots', required: false, type: 'bool' },
		{ name: 'set_gradient_based_sizing', backend: 'dots', required: false, type: 'bool' },

		// Global output settings
		{ name: 'set_svg_precision', backend: 'all', required: false, type: 'int', range: '0-4' },
		{ name: 'set_include_metadata', backend: 'all', required: false, type: 'bool' },

		// Performance settings
		{ name: 'set_max_processing_time_ms', backend: 'all', required: false, type: 'bigint' },
		{ name: 'set_thread_count', backend: 'all', required: false, type: 'int' },
		{ name: 'set_max_image_size', backend: 'all', required: false, type: 'int' },

		// Processing functions
		{ name: 'vectorize', backend: 'all', required: true, type: 'function', params: ['ImageData'] },
		{
			name: 'vectorize_with_progress',
			backend: 'all',
			required: false,
			type: 'function',
			params: ['ImageData', 'callback']
		},
		{ name: 'validate_config', backend: 'all', required: false, type: 'function' },
		{ name: 'export_config', backend: 'all', required: false, type: 'function' },
		{
			name: 'import_config',
			backend: 'all',
			required: false,
			type: 'function',
			params: ['string']
		},
		{ name: 'use_preset', backend: 'all', required: false, type: 'function', params: ['string'] },

		// Cleanup and control
		{ name: 'abort_processing', backend: 'all', required: false, type: 'function' },
		{ name: 'cleanup', backend: 'all', required: false, type: 'function' }
	];

	/**
	 * Generate dynamic test configurations based on available WASM functions
	 */
	function generateDynamicTestConfigurations(introspectionData: any) {
		if (!introspectionData || !introspectionData.functions) {
			// Fallback to static configurations if no introspection data
			return getStaticTestConfigurations();
		}

		const availableFunctions = new Set(introspectionData.functions.found.map((f: any) => f.name));
		const configs: any[] = [];

		// Base configurations for each backend with only core functions
		const backends = ['edge', 'centerline', 'superpixel', 'dots'];

		for (const backend of backends) {
			// Minimal configuration with only core parameters
			const minimalConfig: any = {
				name: `${backend}-minimal-dynamic`,
				backend,
				detail: 0.4,
				stroke_width: 1.0,
				noise_filtering: true,
				hand_drawn_preset: 'none'
			};

			// Backend-specific core settings
			if (backend === 'edge') {
				minimalConfig.multipass = true;
				minimalConfig.pass_count = 2; // Default 2 passes for edge backend
				minimalConfig.multipass_mode = 'auto';
			} else {
				minimalConfig.multipass = false; // Other backends don't use multipass
				minimalConfig.pass_count = 1; // Single pass for other backends
				minimalConfig.multipass_mode = 'auto';
			}

			configs.push(minimalConfig);

			// Enhanced configuration with available optional features
			const enhancedConfig: any = {
				name: `${backend}-enhanced-dynamic`,
				backend,
				detail: 0.5,
				stroke_width: 1.5,
				noise_filtering: true,
				hand_drawn_preset: 'medium' // Use preset for hand-drawn effects
			};

			// Add backend-specific features only if available
			if (backend === 'edge') {
				enhancedConfig.multipass = true;
				enhancedConfig.pass_count = 3; // More passes for enhanced config
				enhancedConfig.multipass_mode = 'auto';
				if (availableFunctions.has('set_reverse_pass')) {
					enhancedConfig.reverse_pass = true;
				}
				if (availableFunctions.has('set_diagonal_pass')) {
					enhancedConfig.diagonal_pass = true;
				}
				if (availableFunctions.has('set_enable_flow_tracing')) {
					enhancedConfig.enable_flow_tracing = true;
				}
				if (availableFunctions.has('set_enable_bezier_fitting')) {
					enhancedConfig.enable_bezier_fitting = true;
				}
			} else if (backend === 'dots') {
				enhancedConfig.multipass = false;
				enhancedConfig.pass_count = 1;
				enhancedConfig.multipass_mode = 'auto';
				enhancedConfig.hand_drawn_preset = 'none'; // Dots don't benefit from hand-drawn
				if (availableFunctions.has('set_dot_density')) {
					enhancedConfig.dot_density = 0.15;
				}
				if (availableFunctions.has('set_preserve_colors')) {
					enhancedConfig.preserve_colors = true;
				}
				if (availableFunctions.has('set_adaptive_sizing')) {
					enhancedConfig.adaptive_sizing = true;
				}
			} else if (backend === 'centerline') {
				enhancedConfig.multipass = false;
				enhancedConfig.pass_count = 1;
				enhancedConfig.multipass_mode = 'auto';
				if (availableFunctions.has('set_enable_adaptive_threshold')) {
					enhancedConfig.enable_adaptive_threshold = true;
				}
			} else if (backend === 'superpixel') {
				enhancedConfig.multipass = false;
				enhancedConfig.pass_count = 1;
				enhancedConfig.multipass_mode = 'auto';
				if (availableFunctions.has('set_num_superpixels')) {
					enhancedConfig.num_superpixels = 150;
				}
			}

			configs.push(enhancedConfig);
		}

		console.log(
			`[DevTestingPanel] Generated ${configs.length} dynamic test configurations based on available functions`
		);
		return configs;
	}

	/**
	 * Static fallback test configurations
	 */
	function getStaticTestConfigurations() {
		return [
			// Edge backend tests (should work - most functions available)
			{
				name: 'edge-minimal',
				backend: 'edge',
				detail: 0.4,
				stroke_width: 1.0,
				noise_filtering: true,
				multipass: true,
				pass_count: 2,
				multipass_mode: 'auto',
				hand_drawn_preset: 'none'
				// IMPORTANT: No variable_weights, tremor_strength, or tapering when preset is 'none'
			},
			{
				name: 'edge-with-handdrawn',
				backend: 'edge',
				detail: 0.5,
				stroke_width: 1.5,
				noise_filtering: true,
				multipass: true,
				pass_count: 3,
				multipass_mode: 'auto',
				reverse_pass: true,
				diagonal_pass: true,
				enable_flow_tracing: true,
				enable_bezier_fitting: true,
				enable_etf_fdog: true,
				hand_drawn_preset: 'medium'
				// IMPORTANT: No explicit variable_weights/tremor_strength - let preset handle it
			},

			// Centerline backend tests (many functions missing)
			{
				name: 'centerline-minimal',
				backend: 'centerline',
				detail: 0.3,
				stroke_width: 0.8,
				noise_filtering: true,
				multipass: false, // centerline doesn't use multipass
				pass_count: 1,
				multipass_mode: 'auto',
				hand_drawn_preset: 'none'
				// IMPORTANT: No hand-drawn parameters when preset is 'none'
			},

			// Dots backend tests (some functions missing)
			{
				name: 'dots-minimal',
				backend: 'dots',
				detail: 0.3,
				stroke_width: 1.0,
				noise_filtering: true,
				multipass: false, // dots doesn't use multipass
				pass_count: 1,
				multipass_mode: 'auto',
				hand_drawn_preset: 'none'
				// IMPORTANT: Only core parameters, absolutely no hand-drawn effects
			},

			// Superpixel backend test (all functions missing)
			{
				name: 'superpixel-minimal',
				backend: 'superpixel',
				detail: 0.2,
				stroke_width: 1.5,
				noise_filtering: true,
				multipass: false, // superpixel doesn't use multipass
				pass_count: 1,
				multipass_mode: 'auto',
				hand_drawn_preset: 'none'
				// IMPORTANT: Only core parameters - all superpixel functions are missing
			}
		];
	}

	// Use dynamic configurations if introspection data is available, otherwise fallback to static
	const quickTestConfigurations = $derived(
		introspectionResults
			? generateDynamicTestConfigurations(introspectionResults)
			: getStaticTestConfigurations()
	);

	async function runIntrospection() {
		const store = vectorizerStore;

		try {
			// Ensure service is initialized
			if (!store.vectorizerService) {
				throw new Error('Vectorizer service not available.');
			}

			// For lazy initialization, we need to create the vectorizer instance first
			// Try to get the instance, and if it doesn't exist, trigger creation by running a basic configure
			let wasmModule = store.vectorizerService.getVectorizerInstance();

			if (!wasmModule) {
				console.log('🔧 Vectorizer instance not created yet, triggering lazy initialization...');

				// Trigger vectorizer creation by running a minimal configuration
				await store.vectorizerService.configure({
					backend: 'edge',
					detail: 0.4,
					stroke_width: 1.0,
					noise_filtering: true,
					multipass: true,
					pass_count: 2,
					multipass_mode: 'auto',
					hand_drawn_preset: 'none',
					// Required boolean fields
					reverse_pass: false,
					diagonal_pass: false,
					enable_etf_fdog: false,
					enable_flow_tracing: false,
					enable_bezier_fitting: false,
					// Required numeric fields
					variable_weights: 0.0,
					tremor_strength: 0.0,
					tapering: 0.0
				});

				wasmModule = store.vectorizerService.getVectorizerInstance();

				if (!wasmModule) {
					throw new Error('Failed to create vectorizer instance during lazy initialization.');
				}

				console.log('✅ Vectorizer instance created successfully');
			}

			console.log('🎯 Found WASM module:', wasmModule);

			const results = analyzeWasmModule(wasmModule);
			introspectionResults = results;

			// Also expose to global scope for easier debugging
			if (typeof window !== 'undefined') {
				(window as any).wasmModule = wasmModule;
				(window as any).introspectionResults = results;
			}
		} catch (error) {
			console.error('Introspection failed:', error);
			introspectionResults = {
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};
		}
	}

	function analyzeWasmModule(wasmModule: any) {
		const results = {
			timestamp: new Date().toISOString(),
			module: {
				found: true,
				type: typeof wasmModule,
				constructor: wasmModule.constructor?.name
			},
			functions: {
				found: [] as any[],
				missing: [] as any[],
				unexpected: [] as any[]
			},
			properties: [] as string[],
			summary: {} as any
		};

		// Get all properties and methods
		const allProperties = [];
		let current = wasmModule;
		while (current && current !== Object.prototype) {
			allProperties.push(...Object.getOwnPropertyNames(current));
			current = Object.getPrototypeOf(current);
		}

		results.properties = [...new Set(allProperties)].sort();

		// Check expected functions
		for (const expected of expectedFunctions) {
			const exists = typeof wasmModule[expected.name] === 'function';
			if (exists) {
				results.functions.found.push({
					...expected,
					actualType: typeof wasmModule[expected.name]
				});
			} else {
				results.functions.missing.push(expected);
			}
		}

		// Find unexpected functions
		const expectedNames = new Set(expectedFunctions.map((f) => f.name));
		for (const prop of results.properties) {
			if (typeof wasmModule[prop] === 'function' && !expectedNames.has(prop)) {
				results.functions.unexpected.push({
					name: prop,
					type: typeof wasmModule[prop]
				});
			}
		}

		// Generate summary
		results.summary = {
			totalExpected: expectedFunctions.length,
			totalFound: results.functions.found.length,
			totalMissing: results.functions.missing.length,
			totalUnexpected: results.functions.unexpected.length,
			completeness: Math.round((results.functions.found.length / expectedFunctions.length) * 100)
		};

		return results;
	}

	async function runQuickValidation() {
		isRunningTests = true;
		validationResults = [];

		const store = vectorizerStore;

		try {
			// Ensure service is available
			if (!store.vectorizerService) {
				throw new Error('Vectorizer service not available');
			}

			for (const config of quickTestConfigurations) {
				const result = {
					name: config.name,
					backend: config.backend,
					status: 'pending' as 'pending' | 'passed' | 'failed' | 'warning',
					error: null as string | null,
					timestamp: new Date().toISOString()
				};

				try {
					// Reset configuration to clean state before each test
					console.log(`🔄 Resetting configuration for test: ${config.name}`);
					await store.vectorizerService.resetConfiguration();

					// Try to configure the service with this test config
					console.log(`🧪 Testing config: ${config.name}`, JSON.parse(JSON.stringify(config)));
					await store.vectorizerService.configure(config as any);
					result.status = 'passed';
					console.log(`✅ Config ${config.name} passed`);
				} catch (error) {
					result.status = 'failed';
					console.error(`❌ Config ${config.name} failed:`, error);

					// Enhanced error reporting
					if (error instanceof Error) {
						result.error = `${error.name}: ${error.message}`;
						if (error.stack) {
							console.error('Stack trace:', error.stack);
						}
					} else if (typeof error === 'object' && error !== null) {
						result.error = JSON.stringify(error);
					} else {
						result.error = String(error);
					}
				}

				validationResults.push(result);
				// Force reactivity update
				validationResults = [...validationResults];
			}
		} catch (error) {
			console.error('Validation failed:', error);
		} finally {
			isRunningTests = false;
		}
	}

	async function testFunctionAvailability() {
		const store = vectorizerStore;
		functionTestResults = [];

		if (!store.vectorizerService) {
			console.error('Vectorizer service not available');
			return;
		}

		let wasmModule = store.vectorizerService.getVectorizerInstance();

		if (!wasmModule) {
			console.log('🔧 Creating vectorizer instance for function testing...');
			await store.vectorizerService.configure({
				backend: 'edge',
				detail: 0.4,
				stroke_width: 1.0,
				noise_filtering: true,
				multipass: true,
				pass_count: 2,
				multipass_mode: 'auto',
				hand_drawn_preset: 'none',
				// Required boolean fields
				reverse_pass: false,
				diagonal_pass: false,
				enable_etf_fdog: false,
				enable_flow_tracing: false,
				enable_bezier_fitting: false,
				// Required numeric fields
				variable_weights: 0.0,
				tremor_strength: 0.0,
				tapering: 0.0
			});
			wasmModule = store.vectorizerService.getVectorizerInstance();
		}

		if (!wasmModule) {
			console.error('Failed to get vectorizer instance');
			functionTestResults.push({
				name: 'test_setup',
				status: 'failed',
				error: 'Failed to get vectorizer instance',
				timestamp: new Date().toISOString()
			});
			return;
		}

		// CRITICAL: Reset to clean configuration before testing functions
		console.log('🔄 Resetting vectorizer to clean state for function testing...');
		await store.vectorizerService.resetConfiguration();

		console.log('🧪 Testing individual function calls...');

		// Test individual function calls with safe values
		// IMPORTANT: Don't test custom hand-drawn parameters when preset is 'none'
		const functionTests = [
			{ name: 'set_detail', args: [0.5], description: 'Set detail level' },
			{ name: 'set_stroke_width', args: [1.0], description: 'Set stroke width' },
			{ name: 'set_backend', args: ['edge'], description: 'Set backend type' },
			{ name: 'set_hand_drawn_preset', args: ['none'], description: 'Set hand-drawn preset' },
			{ name: 'set_tapering', args: [0.5], description: 'Set tapering (should fail)' },
			// NOTE: Don't test variable weights/tremor when preset is 'none' - causes validation errors
			{ name: 'validate_config', args: [], description: 'Validate clean configuration' },
			{ name: 'export_config', args: [], description: 'Export clean configuration' }
		];

		// Test hand-drawn functionality separately with proper preset
		const handDrawnTests = [
			{
				name: 'set_hand_drawn_preset',
				args: ['medium'],
				description: 'Set hand-drawn preset to medium'
			},
			{
				name: 'set_custom_variable_weights',
				args: [0.3],
				description: 'Set variable weights with preset'
			},
			{ name: 'set_custom_tremor', args: [0.2], description: 'Set tremor strength with preset' },
			{ name: 'validate_config', args: [], description: 'Validate hand-drawn configuration' },
			{ name: 'export_config', args: [], description: 'Export hand-drawn configuration' }
		];

		// Test basic functions first
		for (const test of functionTests) {
			const result = {
				name: test.name,
				description: test.description,
				status: 'pending' as 'pending' | 'passed' | 'failed' | 'missing',
				error: null as string | null,
				timestamp: new Date().toISOString()
			};

			try {
				if (typeof wasmModule[test.name] !== 'function') {
					result.status = 'missing';
					result.error = 'Function does not exist';
					console.log(`❌ ${test.name}: Function does not exist`);
				} else {
					wasmModule[test.name](...test.args);
					result.status = 'passed';
					console.log(`✅ ${test.name}: Success`);
				}
			} catch (error) {
				result.status = 'failed';
				result.error = error instanceof Error ? error.message : String(error);
				console.error(`💥 ${test.name}: Error -`, error);
			}

			functionTestResults.push(result);
		}

		// Test hand-drawn functions with proper preset
		console.log('🎨 Testing hand-drawn functionality with medium preset...');
		for (const test of handDrawnTests) {
			const result = {
				name: `${test.name}_with_preset`,
				description: test.description,
				status: 'pending' as 'pending' | 'passed' | 'failed' | 'missing',
				error: null as string | null,
				timestamp: new Date().toISOString()
			};

			try {
				if (typeof wasmModule[test.name] !== 'function') {
					result.status = 'missing';
					result.error = 'Function does not exist';
					console.log(`❌ ${test.name}: Function does not exist`);
				} else {
					wasmModule[test.name](...test.args);
					result.status = 'passed';
					console.log(`✅ ${test.name}: Success with preset`);
				}
			} catch (error) {
				result.status = 'failed';
				result.error = error instanceof Error ? error.message : String(error);
				console.error(`💥 ${test.name}: Error with preset -`, error);
			}

			functionTestResults.push(result);
		}

		// Force reactivity update
		functionTestResults = [...functionTestResults];
	}

	function downloadReport() {
		const report = {
			timestamp: new Date().toISOString(),
			introspection: introspectionResults,
			validation: validationResults,
			function_tests: functionTestResults,
			store_state: {
				wasmLoaded: vectorizerStore.wasmLoaded,
				threadsInitialized: vectorizerStore.threadsInitialized,
				capabilities: vectorizerStore.capabilities,
				config: vectorizerStore.config
			},
			recommendations: generateRecommendations()
		};

		const blob = new Blob([JSON.stringify(report, null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `wasm-dev-report-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function generateRecommendations() {
		if (!introspectionResults) return [];

		const recommendations = [];
		const missing = introspectionResults.functions?.missing || [];

		// Critical missing functions
		const criticalMissing = missing.filter((f: any) => f.required);
		if (criticalMissing.length > 0) {
			recommendations.push(
				`Implement ${criticalMissing.length} critical missing functions: ${criticalMissing.map((f: any) => f.name).join(', ')}`
			);
		}

		// Backend-specific issues
		const centerlineMissing = missing.filter((f: any) => f.backend === 'centerline');
		if (centerlineMissing.length > 0) {
			recommendations.push(
				`Centerline backend unusable: ${centerlineMissing.length} functions missing`
			);
		}

		const superpixelMissing = missing.filter((f: any) => f.backend === 'superpixel');
		if (superpixelMissing.length > 0) {
			recommendations.push(
				`Superpixel backend unusable: ${superpixelMissing.length} functions missing`
			);
		}

		// Performance issues
		if (introspectionResults.summary?.completeness < 70) {
			recommendations.push(
				'Consider implementing missing optional functions for better feature coverage'
			);
		}

		return recommendations;
	}

	// Only show in development mode
	const isDev = import.meta.env.DEV;
</script>

{#if isDev}
	<div class="fixed right-4 bottom-4 z-50">
		<!-- Toggle Button -->
		<Button
			onclick={() => (isExpanded = !isExpanded)}
			variant="outline"
			size="sm"
			class="mb-2 border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
		>
			{#snippet children()}🧪 Dev Tools{/snippet}
		</Button>

		<!-- Panel -->
		{#if isExpanded}
			<div
				class="max-h-96 w-96 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 text-white shadow-xl"
			>
				<div class="border-b border-slate-700 p-4">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-semibold">WASM Development Panel</h3>
						<Button
							onclick={() => (isExpanded = false)}
							variant="ghost"
							size="sm"
							class="text-slate-400 hover:text-white"
						>
							{#snippet children()}×{/snippet}
						</Button>
					</div>
				</div>

				<div class="space-y-4 p-4">
					<!-- Status Section -->
					<div class="space-y-2">
						<h4 class="text-xs font-medium text-slate-400">Status</h4>
						<div class="space-y-1 text-xs">
							<div class="flex justify-between">
								<span>WASM Loaded:</span>
								<span class={vectorizerStore.wasmLoaded ? 'text-green-400' : 'text-red-400'}>
									{vectorizerStore.wasmLoaded ? '✓' : '✗'}
								</span>
							</div>
							<div class="flex justify-between">
								<span>Threads:</span>
								<span
									class={vectorizerStore.threadsInitialized ? 'text-green-400' : 'text-yellow-400'}
								>
									{vectorizerStore.threadsInitialized
										? `${vectorizerStore.requestedThreadCount || 'N/A'}`
										: 'Not Init'}
								</span>
							</div>
							<div class="flex justify-between">
								<span>Service:</span>
								<span class={vectorizerStore.vectorizerService ? 'text-green-400' : 'text-red-400'}>
									{vectorizerStore.vectorizerService ? '✓' : '✗'}
								</span>
							</div>
							<div class="flex justify-between">
								<span>Vectorizer:</span>
								<span
									class={vectorizerStore.vectorizerService?.getVectorizerInstance()
										? 'text-green-400'
										: 'text-yellow-400'}
								>
									{vectorizerStore.vectorizerService?.getVectorizerInstance() ? '✓' : 'Lazy'}
								</span>
							</div>
						</div>
					</div>

					<!-- Actions -->
					<div class="space-y-2">
						<h4 class="text-xs font-medium text-slate-400">Actions</h4>
						<div class="flex flex-col gap-2">
							<Button
								onclick={runIntrospection}
								disabled={!vectorizerStore.wasmLoaded || !vectorizerStore.vectorizerService}
								size="sm"
								class="text-xs"
							>
								{#snippet children()}🔍 Introspect WASM{/snippet}
							</Button>
							<Button
								onclick={runQuickValidation}
								disabled={!vectorizerStore.wasmLoaded ||
									!vectorizerStore.vectorizerService ||
									isRunningTests}
								size="sm"
								class="text-xs"
							>
								{#snippet children()}{isRunningTests
										? '⏳ Testing...'
										: '🧪 Quick Validation'}{/snippet}
							</Button>
							<Button
								onclick={testFunctionAvailability}
								disabled={!vectorizerStore.wasmLoaded || !vectorizerStore.vectorizerService}
								size="sm"
								class="text-xs"
							>
								{#snippet children()}🔧 Test Functions{/snippet}
							</Button>
							<Button
								onclick={downloadReport}
								disabled={!introspectionResults && validationResults.length === 0}
								size="sm"
								variant="outline"
								class="text-xs"
							>
								{#snippet children()}📥 Download Report{/snippet}
							</Button>
						</div>
					</div>

					<!-- Introspection Results -->
					{#if introspectionResults}
						<div class="space-y-2">
							<h4 class="text-xs font-medium text-slate-400">WASM Functions</h4>
							{#if introspectionResults.error}
								<div class="text-xs text-red-400">
									Error: {introspectionResults.error}
								</div>
							{:else}
								<div class="space-y-1 text-xs">
									<div class="flex justify-between">
										<span>Found:</span>
										<span class="text-green-400"
											>{introspectionResults.summary?.totalFound || 0}</span
										>
									</div>
									<div class="flex justify-between">
										<span>Missing:</span>
										<span class="text-red-400"
											>{introspectionResults.summary?.totalMissing || 0}</span
										>
									</div>
									<div class="flex justify-between">
										<span>Completeness:</span>
										<span>{introspectionResults.summary?.completeness || 0}%</span>
									</div>
								</div>

								{#if introspectionResults.functions?.missing?.length > 0}
									<div class="mt-2">
										<div class="text-xs font-medium text-red-400">Missing Functions:</div>
										<div class="max-h-20 overflow-y-auto text-xs text-slate-300">
											{#each introspectionResults.functions.missing.slice(0, 5) as missing, index (index)}
												<div>• {missing.name} ({missing.backend})</div>
											{/each}
											{#if introspectionResults.functions.missing.length > 5}
												<div class="text-slate-500">
													... and {introspectionResults.functions.missing.length - 5} more
												</div>
											{/if}
										</div>
									</div>
								{/if}
							{/if}
						</div>
					{/if}

					<!-- Validation Results -->
					{#if validationResults.length > 0}
						<div class="space-y-2">
							<h4 class="text-xs font-medium text-slate-400">Quick Tests</h4>
							<div class="space-y-1 text-xs">
								{#each validationResults as result (result.name)}
									<div class="flex items-center justify-between">
										<span>{result.name}:</span>
										<span
											class={result.status === 'passed'
												? 'text-green-400'
												: result.status === 'failed'
													? 'text-red-400'
													: 'text-yellow-400'}
										>
											{result.status === 'passed' ? '✓' : result.status === 'failed' ? '✗' : '⏳'}
										</span>
									</div>
									{#if result.error}
										<div class="truncate pl-2 text-xs text-red-300" title={result.error}>
											{result.error}
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					<!-- Function Test Results -->
					{#if functionTestResults.length > 0}
						<div class="space-y-2">
							<h4 class="text-xs font-medium text-slate-400">Function Tests</h4>
							<div class="max-h-32 space-y-1 overflow-y-auto text-xs">
								{#each functionTestResults as result (result.name)}
									<div class="flex items-center justify-between">
										<span class="truncate">{result.name}:</span>
										<span
											class={result.status === 'passed'
												? 'text-green-400'
												: result.status === 'missing'
													? 'text-yellow-400'
													: 'text-red-400'}
										>
											{result.status === 'passed' ? '✓' : result.status === 'missing' ? '?' : '✗'}
										</span>
									</div>
									{#if result.error}
										<div class="truncate pl-2 text-xs text-slate-400" title={result.error}>
											{result.error}
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
