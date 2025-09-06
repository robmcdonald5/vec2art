<script lang="ts">
	import { Download, FileText, Image, X } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { lockBodyScroll } from '$lib/utils/scroll-lock';
	import { onDestroy } from 'svelte';

	interface Props {
		filename: string;
		svgContent: string;
		onDownloadSvg: () => void;
		onDownloadWebP: () => Promise<void>;
		onCancel: () => void;
		show: boolean;
		isProcessing?: boolean;
	}

	let {
		filename,
		svgContent,
		onDownloadSvg,
		onDownloadWebP,
		onCancel,
		show = false,
		isProcessing = false
	}: Props = $props();

	let isGeneratingWebP = $state(false);
	let unlockScroll: (() => void) | null = null;

	// Manage scroll lock when modal state changes
	$effect(() => {
		if (show && !unlockScroll) {
			// Lock body scroll when modal opens
			unlockScroll = lockBodyScroll();
		} else if (!show && unlockScroll) {
			// Unlock body scroll when modal closes
			unlockScroll();
			unlockScroll = null;
		}
	});

	// Safety cleanup: ensure body scroll is restored when component unmounts
	onDestroy(() => {
		if (unlockScroll) {
			unlockScroll();
			unlockScroll = null;
		}
	});

	// Estimate SVG file size
	const svgSizeKB = $derived(Math.round(new Blob([svgContent]).size / 1024));
	
	// Estimate WebP size (typically 60-80% smaller than SVG)
	const estimatedWebPSizeKB = $derived(Math.round(svgSizeKB * 0.3));

	async function handleWebPDownload() {
		if (isGeneratingWebP) return;
		
		try {
			isGeneratingWebP = true;
			await onDownloadWebP();
		} finally {
			isGeneratingWebP = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		} else if (event.key === '1' || event.key === 's') {
			onDownloadSvg();
		} else if (event.key === '2' || event.key === 'w') {
			handleWebPDownload();
		}
	}
</script>

{#if show}
	<!-- Modal Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={onCancel}
		onkeydown={handleKeydown}
		tabindex="0"
		role="dialog"
		aria-labelledby="download-title"
		aria-modal="true"
	>
		<!-- Modal Content -->
		<div
			class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Download class="h-5 w-5 text-ferrari-600" />
					<h2 id="download-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Download Format
					</h2>
				</div>
				<button
					onclick={onCancel}
					class="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					aria-label="Close format selector"
					disabled={isProcessing || isGeneratingWebP}
				>
					<X class="h-4 w-4 text-gray-500" />
				</button>
			</div>

			<!-- File Info -->
			<div class="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
				<p class="text-sm font-medium text-gray-900 dark:text-gray-100">{filename}</p>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					Choose your preferred download format
				</p>
			</div>

			<!-- Format Options -->
			<div class="space-y-3">
				<!-- SVG Option -->
				<button
					onclick={onDownloadSvg}
					disabled={isProcessing || isGeneratingWebP}
					class="flex w-full items-center gap-6 rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-ferrari-300 hover:bg-gray-50 focus:border-ferrari-500 focus:outline-none focus:ring-2 focus:ring-ferrari-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:border-ferrari-600 dark:hover:bg-gray-800"
				>
					<div class="flex h-20 w-20 items-center justify-center rounded-lg bg-ferrari-100 dark:bg-ferrari-900">
						<FileText class="h-10 w-10 text-ferrari-600" />
					</div>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class="font-medium text-gray-900 dark:text-gray-100">SVG Vector</h3>
							<span class="text-xs text-gray-500">~{svgSizeKB}KB</span>
						</div>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Scalable vector format, perfect for print and high-resolution displays
						</p>
					</div>
				</button>

				<!-- WebP Option -->
				<button
					onclick={handleWebPDownload}
					disabled={isProcessing || isGeneratingWebP}
					class="flex w-full items-center gap-6 rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-ferrari-300 hover:bg-gray-50 focus:border-ferrari-500 focus:outline-none focus:ring-2 focus:ring-ferrari-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:border-ferrari-600 dark:hover:bg-gray-800"
				>
					<div class="flex h-20 w-20 items-center justify-center rounded-lg bg-ferrari-100 dark:bg-ferrari-900">
						<Image class="h-10 w-10 text-ferrari-600" />
					</div>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class="font-medium text-gray-900 dark:text-gray-100">WebP Image</h3>
							<span class="text-xs text-gray-500">~{estimatedWebPSizeKB}KB</span>
						</div>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Compressed raster format, great for web sharing and social media
						</p>
					</div>
					{#if isGeneratingWebP}
						<div class="ml-2">
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-ferrari-600"></div>
						</div>
					{/if}
				</button>
			</div>

			<!-- Keyboard Shortcuts Hint -->
			<div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
				<p class="text-center text-xs text-gray-500 dark:text-gray-400">
					Press <kbd class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">1</kbd> for SVG,
					<kbd class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">2</kbd> for WebP, or
					<kbd class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">Esc</kbd> to cancel
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Remove the global body overflow hidden - this was breaking scroll on all pages!
	   The scroll locking is now properly handled by the lockBodyScroll() utility function
	   in the $effect hook above, which only locks scroll when the modal is actually open */
</style>