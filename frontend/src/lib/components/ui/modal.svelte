<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { X } from 'lucide-svelte';
	
	interface Props {
		open: boolean;
		onClose: () => void;
		class?: string;
		children?: any;
	}
	
	let {
		open = false,
		onClose,
		class: className = '',
		children
	}: Props = $props();
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
		
		<!-- Modal Content -->
		<div 
			class="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden {className}"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Close Button -->
			<button
				onclick={onClose}
				class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
				aria-label="Close modal"
			>
				<X class="w-6 h-6 text-white" />
			</button>
			
			<!-- Content -->
			<div class="w-full h-full overflow-auto">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}