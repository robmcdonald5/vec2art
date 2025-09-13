<script lang="ts">
	import { onMount } from 'svelte';
	import { errorReporter, type ErrorReport } from '$lib/services/error-reporter';
	import { iosCompatibility } from '$lib/services/ios-compatibility';
	import { vectorizerStore } from '$lib/stores/vectorizer.svelte';
	import { X, Download, Trash2, Bug, AlertTriangle, Info, CheckCircle } from 'lucide-svelte';

	let { isOpen = $bindable(false) } = $props();

	// State
	let activeTab = $state<'system' | 'errors' | 'wasm' | 'ios'>('system');
	let errorReports = $state<ErrorReport[]>([]);
	let systemInfo = $state<string>('');
	let wasmStatus = $state<any>({});
	let iosInfo = $state<any>({});
	let compatibilityTest = $state<any>(null);

	onMount(() => {
		// Initialize error reporter
		errorReporter.setup();

		// Load initial data
		loadSystemInfo();
		loadErrorReports();
		loadWasmStatus();
		loadIOSInfo();

		// Listen for new errors
		errorReporter.addListener((report) => {
			errorReports = [report, ...errorReports];
		});
	});

	function loadSystemInfo() {
		systemInfo = errorReporter.getSystemSummary();
	}

	function loadErrorReports() {
		errorReports = [...errorReporter.getStoredReports(), ...errorReporter.getReports()];
	}

	async function loadWasmStatus() {
		wasmStatus = {
			initialized: vectorizerStore.isInitialized,
			hasError: vectorizerStore.hasError,
			errorMessage: vectorizerStore.getErrorMessage(),
			capabilities: vectorizerStore.capabilities
		};
	}

	function loadIOSInfo() {
		const info = iosCompatibility.getCompatibilityInfo();
		iosInfo = {
			...info,
			diagnostics: iosCompatibility.getDiagnostics()
		};
	}

	async function runCompatibilityTest() {
		compatibilityTest = await iosCompatibility.testWasmCompatibility();
	}

	function clearErrors() {
		errorReporter.clearReports();
		errorReports = [];
	}

	function downloadReport() {
		errorReporter.downloadReports();
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function formatTimestamp(timestamp: string) {
		return new Date(timestamp).toLocaleString();
	}

	function getErrorIcon(type: string) {
		switch (type) {
			case 'wasm-init':
				return '🔧';
			case 'conversion':
				return '🖼️';
			case 'memory':
				return '💾';
			case 'worker':
				return '⚙️';
			case 'network':
				return '🌐';
			default:
				return '❌';
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
		<div
			class="dark:bg-speed-gray-900 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl"
		>
			<!-- Header -->
			<div
				class="border-speed-gray-200 dark:border-speed-gray-700 flex items-center justify-between border-b px-6 py-4"
			>
				<div class="flex items-center gap-2">
					<Bug class="text-ferrari-500 h-5 w-5" />
					<h2 class="text-speed-gray-900 text-xl font-semibold dark:text-white">Debug Panel</h2>
				</div>
				<button
					onclick={() => (isOpen = false)}
					class="hover:bg-speed-gray-100 dark:hover:bg-speed-gray-800 rounded-lg p-1 transition-colors"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Tabs -->
			<div class="border-speed-gray-200 dark:border-speed-gray-700 flex border-b">
				<button
					onclick={() => (activeTab = 'system')}
					class="px-6 py-3 font-medium transition-colors {activeTab === 'system'
						? 'text-ferrari-500 border-ferrari-500 border-b-2'
						: 'text-speed-gray-600 hover:text-speed-gray-900'}"
				>
					System
				</button>
				<button
					onclick={() => (activeTab = 'errors')}
					class="relative px-6 py-3 font-medium transition-colors {activeTab === 'errors'
						? 'text-ferrari-500 border-ferrari-500 border-b-2'
						: 'text-speed-gray-600 hover:text-speed-gray-900'}"
				>
					Errors
					{#if errorReports.length > 0}
						<span
							class="bg-ferrari-500 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
						>
							{errorReports.length}
						</span>
					{/if}
				</button>
				<button
					onclick={() => (activeTab = 'wasm')}
					class="px-6 py-3 font-medium transition-colors {activeTab === 'wasm'
						? 'text-ferrari-500 border-ferrari-500 border-b-2'
						: 'text-speed-gray-600 hover:text-speed-gray-900'}"
				>
					WASM
				</button>
				<button
					onclick={() => (activeTab = 'ios')}
					class="px-6 py-3 font-medium transition-colors {activeTab === 'ios'
						? 'text-ferrari-500 border-ferrari-500 border-b-2'
						: 'text-speed-gray-600 hover:text-speed-gray-900'}"
				>
					iOS/Safari
				</button>
			</div>

			<!-- Content -->
			<div class="max-h-[60vh] overflow-y-auto p-6">
				{#if activeTab === 'system'}
					<div class="space-y-4">
						<h3 class="text-speed-gray-900 font-semibold dark:text-white">System Information</h3>
						<pre
							class="bg-speed-gray-100 dark:bg-speed-gray-800 overflow-x-auto rounded-lg p-4 font-mono text-sm">{systemInfo}</pre>

						<div class="flex gap-2">
							<button
								onclick={() => copyToClipboard(systemInfo)}
								class="bg-speed-gray-200 hover:bg-speed-gray-300 rounded-lg px-4 py-2 text-sm transition-colors"
							>
								Copy to Clipboard
							</button>
							<button
								onclick={loadSystemInfo}
								class="bg-speed-gray-200 hover:bg-speed-gray-300 rounded-lg px-4 py-2 text-sm transition-colors"
							>
								Refresh
							</button>
						</div>
					</div>
				{/if}

				{#if activeTab === 'errors'}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="text-speed-gray-900 font-semibold dark:text-white">
								Error Reports ({errorReports.length})
							</h3>
							<div class="flex gap-2">
								<button
									onclick={downloadReport}
									class="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
								>
									<Download class="h-4 w-4" />
									Export
								</button>
								<button
									onclick={clearErrors}
									class="bg-ferrari-500 hover:bg-ferrari-600 flex items-center gap-2 rounded-lg px-3 py-1 text-sm text-white transition-colors"
								>
									<Trash2 class="h-4 w-4" />
									Clear
								</button>
							</div>
						</div>

						{#if errorReports.length === 0}
							<div class="text-speed-gray-500 py-8 text-center">
								<CheckCircle class="mx-auto mb-2 h-12 w-12 text-green-500" />
								<p>No errors reported</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each errorReports as report (report.timestamp + report.error.message)}
									<div
										class="border-speed-gray-200 dark:border-speed-gray-700 rounded-lg border p-4"
									>
										<div class="flex items-start gap-3">
											<span class="text-2xl">{getErrorIcon(report.error.type)}</span>
											<div class="flex-1">
												<div class="flex items-center justify-between">
													<span class="text-speed-gray-900 font-medium dark:text-white">
														{report.error.type.toUpperCase()}
													</span>
													<span class="text-speed-gray-500 text-xs">
														{formatTimestamp(report.timestamp)}
													</span>
												</div>
												<p class="text-speed-gray-700 dark:text-speed-gray-300 mt-1 text-sm">
													{report.error.message}
												</p>
												{#if report.error.stack}
													<details class="mt-2">
														<summary class="text-speed-gray-500 cursor-pointer text-xs">
															Stack trace
														</summary>
														<pre
															class="bg-speed-gray-100 dark:bg-speed-gray-800 mt-1 overflow-x-auto rounded p-2 text-xs">{report
																.error.stack}</pre>
													</details>
												{/if}
												<div class="text-speed-gray-500 mt-2 flex gap-4 text-xs">
													<span>Device: {report.device.type}</span>
													<span
														>Browser: {report.device.isSafari
															? 'Safari'
															: report.device.isChrome
																? 'Chrome'
																: 'Other'}</span
													>
													{#if report.device.isIOS}
														<span class="text-orange-500">iOS</span>
													{/if}
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if activeTab === 'wasm'}
					<div class="space-y-4">
						<h3 class="text-speed-gray-900 font-semibold dark:text-white">WebAssembly Status</h3>

						<div class="grid grid-cols-2 gap-4">
							<div class="bg-speed-gray-100 dark:bg-speed-gray-800 rounded-lg p-4">
								<div class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">Initialized</div>
								<div
									class="text-lg font-semibold {wasmStatus.initialized
										? 'text-green-500'
										: 'text-ferrari-500'}"
								>
									{wasmStatus.initialized ? 'Yes' : 'No'}
								</div>
							</div>
							<div class="bg-speed-gray-100 dark:bg-speed-gray-800 rounded-lg p-4">
								<div class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">Has Error</div>
								<div
									class="text-lg font-semibold {wasmStatus.hasError
										? 'text-ferrari-500'
										: 'text-green-500'}"
								>
									{wasmStatus.hasError ? 'Yes' : 'No'}
								</div>
							</div>
						</div>

						{#if wasmStatus.errorMessage}
							<div class="rounded-lg border border-red-200 bg-red-50 p-4">
								<div class="flex items-start gap-3">
									<AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
									<div>
										<div class="font-medium text-red-900">Error Message</div>
										<p class="mt-1 text-sm text-red-700">{wasmStatus.errorMessage}</p>
									</div>
								</div>
							</div>
						{/if}

						{#if wasmStatus.capabilities}
							<div>
								<h4 class="text-speed-gray-900 mb-2 font-medium dark:text-white">Capabilities</h4>
								<div class="bg-speed-gray-100 dark:bg-speed-gray-800 rounded-lg p-4">
									<dl class="space-y-2 text-sm">
										<div class="flex justify-between">
											<dt class="text-speed-gray-600 dark:text-speed-gray-400">
												Cross-Origin Isolated:
											</dt>
											<dd
												class="{wasmStatus.capabilities.crossOriginIsolated
													? 'text-green-500'
													: 'text-ferrari-500'} font-medium"
											>
												{wasmStatus.capabilities.crossOriginIsolated ? '✓' : '✗'}
											</dd>
										</div>
										<div class="flex justify-between">
											<dt class="text-speed-gray-600 dark:text-speed-gray-400">
												SharedArrayBuffer:
											</dt>
											<dd
												class="{wasmStatus.capabilities.sharedArrayBuffer
													? 'text-green-500'
													: 'text-ferrari-500'} font-medium"
											>
												{wasmStatus.capabilities.sharedArrayBuffer ? '✓' : '✗'}
											</dd>
										</div>
										<div class="flex justify-between">
											<dt class="text-speed-gray-600 dark:text-speed-gray-400">Threading:</dt>
											<dd
												class="{wasmStatus.capabilities.threading
													? 'text-green-500'
													: 'text-ferrari-500'} font-medium"
											>
												{wasmStatus.capabilities.threading ? '✓' : '✗'}
											</dd>
										</div>
										<div class="flex justify-between">
											<dt class="text-speed-gray-600 dark:text-speed-gray-400">Thread Count:</dt>
											<dd class="font-medium">{wasmStatus.capabilities.threadCount}</dd>
										</div>
									</dl>
								</div>
							</div>
						{/if}

						<button
							onclick={loadWasmStatus}
							class="bg-speed-gray-200 hover:bg-speed-gray-300 rounded-lg px-4 py-2 text-sm transition-colors"
						>
							Refresh Status
						</button>
					</div>
				{/if}

				{#if activeTab === 'ios'}
					<div class="space-y-4">
						<h3 class="text-speed-gray-900 font-semibold dark:text-white">
							iOS/Safari Compatibility
						</h3>

						{#if iosInfo.isIOSSafari}
							<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
								<div class="flex items-start gap-3">
									<Info class="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
									<div>
										<div class="font-medium text-orange-900">iOS Safari Detected</div>
										<p class="mt-1 text-sm text-orange-700">
											{iosInfo.recommendedConfig.warningMessage ||
												'Special compatibility mode is active.'}
										</p>
									</div>
								</div>
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-4">
							<div class="bg-speed-gray-100 dark:bg-speed-gray-800 rounded-lg p-4">
								<div class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">Platform</div>
								<div class="text-lg font-semibold">
									{iosInfo.isIOS ? 'iOS' : 'Non-iOS'}
								</div>
								{#if iosInfo.iOSVersion}
									<div class="text-speed-gray-500 text-xs">Version: {iosInfo.iOSVersion}</div>
								{/if}
							</div>
							<div class="bg-speed-gray-100 dark:bg-speed-gray-800 rounded-lg p-4">
								<div class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">Browser</div>
								<div class="text-lg font-semibold">
									{iosInfo.isSafari ? 'Safari' : 'Other'}
								</div>
								{#if iosInfo.safariVersion}
									<div class="text-speed-gray-500 text-xs">Version: {iosInfo.safariVersion}</div>
								{/if}
							</div>
						</div>

						<div>
							<h4 class="text-speed-gray-900 mb-2 font-medium dark:text-white">Diagnostics</h4>
							<pre
								class="bg-speed-gray-100 dark:bg-speed-gray-800 overflow-x-auto rounded-lg p-4 font-mono text-xs">{iosInfo.diagnostics}</pre>
						</div>

						<div class="flex gap-2">
							<button
								onclick={runCompatibilityTest}
								class="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
							>
								Run Compatibility Test
							</button>
							<button
								onclick={() => copyToClipboard(iosInfo.diagnostics)}
								class="bg-speed-gray-200 hover:bg-speed-gray-300 rounded-lg px-4 py-2 text-sm transition-colors"
							>
								Copy Diagnostics
							</button>
						</div>

						{#if compatibilityTest}
							<div class="border-speed-gray-200 dark:border-speed-gray-700 rounded-lg border p-4">
								<h4 class="text-speed-gray-900 mb-2 font-medium dark:text-white">Test Results</h4>
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										{#if compatibilityTest.success}
											<CheckCircle class="h-5 w-5 text-green-500" />
											<span class="text-green-700">Compatibility test passed</span>
										{:else}
											<AlertTriangle class="text-ferrari-500 h-5 w-5" />
											<span class="text-ferrari-700">Compatibility test failed</span>
										{/if}
									</div>

									{#if compatibilityTest.errors.length > 0}
										<div class="mt-2">
											<div class="text-ferrari-700 text-sm font-medium">Errors:</div>
											<ul class="text-ferrari-600 mt-1 list-inside list-disc text-sm">
												{#each compatibilityTest.errors as error (error)}
													<li>{error}</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if compatibilityTest.warnings.length > 0}
										<div class="mt-2">
											<div class="text-sm font-medium text-orange-700">Warnings:</div>
											<ul class="mt-1 list-inside list-disc text-sm text-orange-600">
												{#each compatibilityTest.warnings as warning (warning)}
													<li>{warning}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
