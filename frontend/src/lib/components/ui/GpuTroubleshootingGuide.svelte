<!--
GPU Troubleshooting Guide Component
Helps users diagnose and fix "GPU: Unavailable" issues
-->

<script lang="ts">
	import { AlertCircle, CheckCircle, ExternalLink, Cpu, Monitor } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { lockBodyScroll } from '$lib/utils/scroll-lock';
	import { onDestroy } from 'svelte';

	interface Props {
		showTroubleshooting?: boolean;
		onClose?: () => void;
	}

	let { showTroubleshooting = false, onClose }: Props = $props();

	// Detect GPU capabilities
	let gpuInfo = $state<any>(null);
	let webglSupported = $state(false);
	let webgpuSupported = $state(false);
	let unlockScroll: (() => void) | null = null;

	// Manage scroll lock when modal state changes
	$effect(() => {
		if (showTroubleshooting && !unlockScroll) {
			// Lock body scroll when modal opens
			unlockScroll = lockBodyScroll();
		} else if (!showTroubleshooting && unlockScroll) {
			// Unlock body scroll when modal closes
			unlockScroll();
			unlockScroll = null;
		}
	});

	$effect(() => {
		if (showTroubleshooting) {
			detectGpuCapabilities();
		}
	});

	// Safety cleanup: ensure body scroll is restored when component unmounts
	onDestroy(() => {
		if (unlockScroll) {
			unlockScroll();
			unlockScroll = null;
		}
	});

	function detectGpuCapabilities() {
		// Check WebGL support
		try {
			const canvas = document.createElement('canvas');
			const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
			webglSupported = !!gl;

			if (gl) {
				const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
				gpuInfo = {
					vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
					renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
					version: gl.getParameter(gl.VERSION),
					shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
				};
			}
		} catch (error) {
			console.error('WebGL detection failed:', error);
		}

		// Check WebGPU support
		webgpuSupported = 'gpu' in navigator;

		console.log('GPU Detection Results:', {
			webglSupported,
			webgpuSupported,
			gpuInfo
		});
	}

	function openChromeGpuPage() {
		if (navigator.userAgent.includes('Chrome')) {
			window.open('chrome://gpu', '_blank');
		} else if (navigator.userAgent.includes('Edge')) {
			window.open('edge://gpu', '_blank');
		} else {
			alert('GPU diagnostics are available in Chrome/Edge via chrome://gpu or edge://gpu');
		}
	}

	function openChromeFlags() {
		if (navigator.userAgent.includes('Chrome')) {
			window.open('chrome://flags/#ignore-gpu-blacklist', '_blank');
		} else if (navigator.userAgent.includes('Edge')) {
			window.open('edge://flags/#ignore-gpu-blacklist', '_blank');
		}
	}
</script>

{#if showTroubleshooting}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose?.()}
		role="button"
		tabindex="-1"
		aria-label="Close troubleshooting guide">
	
		<div
			class="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Monitor class="h-6 w-6 text-blue-600" />
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						GPU Troubleshooting Guide
					</h2>
				</div>
				<Button variant="ghost" size="sm" onclick={onClose}>✕</Button>
			</div>

			<!-- Current Status -->
			<div
				class="mb-6 rounded-lg border p-4 {webglSupported || webgpuSupported
					? 'border-green-200 bg-green-50'
					: 'border-red-200 bg-red-50'}"
			>
				<div class="mb-2 flex items-center gap-2">
					{#if webglSupported || webgpuSupported}
						<CheckCircle class="h-5 w-5 text-green-600" />
						<span class="font-medium text-green-800">GPU Partially Available</span>
					{:else}
						<AlertCircle class="h-5 w-5 text-red-600" />
						<span class="font-medium text-red-800">GPU Unavailable</span>
					{/if}
				</div>

				<div class="space-y-1 text-sm">
					<div class="flex items-center gap-2">
						<span class="w-16">WebGL:</span>
						<span class={webglSupported ? 'text-green-600' : 'text-red-600'}>
							{webglSupported ? '✓ Supported' : '✗ Not Available'}
						</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="w-16">WebGPU:</span>
						<span class={webgpuSupported ? 'text-green-600' : 'text-red-600'}>
							{webgpuSupported ? '✓ Supported' : '✗ Not Available'}
						</span>
					</div>

					{#if gpuInfo}
						<div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
							<div><strong>GPU:</strong> {gpuInfo.renderer}</div>
							<div><strong>Vendor:</strong> {gpuInfo.vendor}</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Troubleshooting Steps -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Troubleshooting Steps</h3>

				<!-- Step 1: Hardware Acceleration -->
				<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
					<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
						1. Enable Hardware Acceleration
					</h4>
					<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
						Ensure your browser is allowed to use hardware acceleration.
					</p>
					<div class="space-y-2 text-sm">
						<div>
							<strong>Chrome/Edge:</strong> Settings → Advanced → System → "Use hardware acceleration
							when available"
						</div>
						<div>
							<strong>Firefox:</strong> Preferences → General → Performance → Uncheck "Use recommended
							performance settings"
						</div>
					</div>
				</div>

				<!-- Step 2: Check GPU Status -->
				<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
					<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">2. Check GPU Status</h4>
					<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
						Check if your GPU is blacklisted or having issues.
					</p>
					<Button
						variant="outline"
						size="sm"
						onclick={openChromeGpuPage}
						class="flex items-center gap-2"
					>
						<ExternalLink class="h-4 w-4" />
						Open GPU Diagnostics
					</Button>
				</div>

				<!-- Step 3: Update Drivers -->
				<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
					<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
						3. Update Graphics Drivers
					</h4>
					<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
						Outdated drivers (especially pre-2010) can cause GPU issues.
					</p>
					<div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
						<div><strong>Windows:</strong> Device Manager → Display adapters → Update driver</div>
						<div><strong>NVIDIA:</strong> Visit nvidia.com/drivers</div>
						<div><strong>AMD:</strong> Visit amd.com/support</div>
						<div><strong>Intel:</strong> Visit intel.com/content/www/us/en/support</div>
					</div>
				</div>

				<!-- Step 4: Override Blacklist -->
				<div
					class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
				>
					<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
						4. Override GPU Blacklist (Advanced)
					</h4>
					<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
						⚠️ <strong>Use with caution:</strong> This can cause browser crashes if your GPU has known
						issues.
					</p>
					<Button
						variant="outline"
						size="sm"
						onclick={openChromeFlags}
						class="flex items-center gap-2"
					>
						<ExternalLink class="h-4 w-4" />
						Override GPU Blacklist
					</Button>
					<p class="mt-2 text-xs text-gray-500">
						Enable "Override software rendering list" and restart browser
					</p>
				</div>
			</div>

			<!-- Current Workaround -->
			<div
				class="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
			>
				<h4 class="mb-2 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
					<Cpu class="h-4 w-4" />
					Current Solution: WebP Optimization
				</h4>
				<p class="text-sm text-blue-800 dark:text-blue-200">
					Even without GPU acceleration, our new WebP conversion provides fast preview with full
					pan/zoom for large SVGs. Your 1.5MB SVG will be converted to a compressed WebP image that
					loads quickly while maintaining visual quality.
				</p>
			</div>

			<!-- Close Button -->
			<div class="mt-6 flex justify-end">
				<Button onclick={onClose}>Close</Button>
			</div>
		</div>
	</div>
{/if}
