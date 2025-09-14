<script lang="ts">
	import { wasmDiagnostics } from '$lib/debug/wasmDiag';
	// Unused imports kept for potential future diagnostic enhancements
	import {
		hasOffscreenCanvas as _hasOffscreenCanvas,
		supportsModuleWorkers as _supportsModuleWorkers,
		isCrossOriginIsolated as _isCrossOriginIsolated,
		hasSharedArrayBuffer as _hasSharedArrayBuffer
	} from '$lib/workers/workerSupport';
	import { onMount } from 'svelte';

	let diagnostics = $state(null as ReturnType<typeof wasmDiagnostics> | null);
	let userAgent = $state('');
	let interpretations = $state([] as string[]);

	onMount(() => {
		// Run diagnostics
		diagnostics = wasmDiagnostics();
		userAgent = navigator.userAgent;

		// Generate interpretations
		const issues = [];

		if (!diagnostics.crossOriginIsolated) {
			issues.push(
				'❌ Cross-Origin Isolation missing - SharedArrayBuffer disabled, WASM threading not available'
			);
		}

		if (!diagnostics.hasInstantiateStreaming) {
			issues.push('⚠️ WebAssembly.instantiateStreaming not available - using fallback loader');
		}

		if (!diagnostics.moduleWorkers) {
			issues.push('⚠️ Module Workers not supported - falling back to classic workers (iOS <16.4)');
		}

		if (!diagnostics.offscreenCanvas) {
			issues.push('⚠️ OffscreenCanvas not available - using main thread canvas (iOS <16.4)');
		}

		if (issues.length === 0) {
			issues.push('✅ All capabilities available - full functionality enabled');
		}

		interpretations = issues;
	});

	function copyDiagnostics() {
		const report = {
			diagnostics,
			userAgent,
			interpretations,
			timestamp: new Date().toISOString(),
			location: window.location.href
		};

		navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
			alert('Diagnostics copied to clipboard! Please share this with support.');
		});
	}
</script>

<svelte:head>
	<title>iPhone/Safari Debug Diagnostics - vec2art</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-4xl px-4">
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h1 class="mb-6 text-2xl font-bold text-gray-900">iPhone/Safari Debug Diagnostics</h1>

			<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h2 class="mb-2 font-semibold text-blue-900">Instructions for iPhone Users:</h2>
				<ol class="space-y-1 text-sm text-blue-800">
					<li>1. Take a screenshot of this page</li>
					<li>2. Or tap "Copy Report" and paste in email/message</li>
					<li>3. Share your iOS version (Settings → General → About)</li>
					<li>4. Send to support for diagnosis</li>
				</ol>
			</div>

			{#if diagnostics}
				<div class="space-y-6">
					<!-- Diagnostic Results Table -->
					<div>
						<h2 class="mb-3 text-lg font-semibold">Browser Capabilities</h2>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Capability</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Status</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Impact</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200 bg-white">
									<tr>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
											>Cross-Origin Isolation</td
										>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {diagnostics.crossOriginIsolated
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'}"
											>
												{diagnostics.crossOriginIsolated ? '✅ Available' : '❌ Missing'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-500">Required for WASM threading</td>
									</tr>
									<tr>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
											>SharedArrayBuffer</td
										>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {diagnostics.hasSharedArrayBuffer
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'}"
											>
												{diagnostics.hasSharedArrayBuffer ? '✅ Available' : '❌ Missing'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-500">Memory sharing between threads</td>
									</tr>
									<tr>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
											>WASM Streaming</td
										>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {diagnostics.hasInstantiateStreaming
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'}"
											>
												{diagnostics.hasInstantiateStreaming ? '✅ Available' : '⚠️ Using Fallback'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-500">Fast WASM loading</td>
									</tr>
									<tr>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
											>Module Workers</td
										>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {diagnostics.moduleWorkers
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'}"
											>
												{diagnostics.moduleWorkers ? '✅ Available' : '⚠️ Using Classic'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-500"
											>Modern worker support (iOS 16.4+)</td
										>
									</tr>
									<tr>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
											>OffscreenCanvas</td
										>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {diagnostics.offscreenCanvas
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'}"
											>
												{diagnostics.offscreenCanvas ? '✅ Available' : '⚠️ Main Thread'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm text-gray-500">Background canvas rendering</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- Interpretations -->
					<div>
						<h2 class="mb-3 text-lg font-semibold">Analysis</h2>
						<div class="space-y-2">
							{#each interpretations as interpretation, index (interpretation + index)}
								<div class="flex items-start space-x-2">
									<div
										class="flex-1 rounded-lg p-3 {interpretation.startsWith('✅')
											? 'bg-green-50 text-green-800'
											: interpretation.startsWith('⚠️')
												? 'bg-yellow-50 text-yellow-800'
												: 'bg-red-50 text-red-800'}"
									>
										{interpretation}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Device Information -->
					<div>
						<h2 class="mb-3 text-lg font-semibold">Device Information</h2>
						<div class="rounded-lg bg-gray-50 p-4">
							<div class="text-sm">
								<div class="font-medium text-gray-700">User Agent:</div>
								<div class="break-all text-gray-600">{userAgent}</div>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex space-x-4">
						<button
							onclick={copyDiagnostics}
							class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
						>
							Copy Full Report
						</button>
						<a
							href="/converter"
							class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
						>
							Back to Converter
						</a>
					</div>
				</div>
			{:else}
				<div class="py-12 text-center">
					<div
						class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
					></div>
					<p class="text-gray-600">Running diagnostics...</p>
				</div>
			{/if}
		</div>
	</div>
</div>
