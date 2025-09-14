<!--
	ServiceWorker Update Banner - User-friendly update notifications

	Shows a non-intrusive banner when updates are available.
	Provides clear actions for users to apply updates.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import {
		swUpdateState,
		activateServiceWorkerUpdate
	} from '$lib/services/service-worker-update-manager';
	import { Button } from '$lib/components/ui/button';

	let showBanner = false;
	let isUpdating = false;

	// Show banner when update is available
	$: if ($swUpdateState.updateAvailable && !showBanner) {
		showBanner = true;
	}

	// Handle update activation
	async function handleUpdate() {
		isUpdating = true;
		try {
			await activateServiceWorkerUpdate();
		} catch (error) {
			console.error('[SW Update] Failed to apply update:', error);
			isUpdating = false;
		}
	}

	// Dismiss banner
	function dismissBanner() {
		showBanner = false;
	}

	// Listen for update events
	onMount(() => {
		const handleUpdateEvent = () => {
			showBanner = true;
		};

		window.addEventListener('sw-update-available', handleUpdateEvent);

		return () => {
			window.removeEventListener('sw-update-available', handleUpdateEvent);
		};
	});
</script>

{#if showBanner && $swUpdateState.updateAvailable}
	<div
		class="bg-ferrari-500 fixed top-0 right-0 left-0 z-50 text-white shadow-lg"
		transition:slide={{ duration: 300 }}
	>
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<svg
							class="h-5 w-5"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill-rule="evenodd"
								d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>

					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">
							New version available!
							{#if $swUpdateState.version}
								<span class="opacity-90">(v{$swUpdateState.version})</span>
							{/if}
						</p>
						<p class="text-xs opacity-90">Update includes important fixes and improvements.</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						class="border-white/30 bg-white/20 text-white hover:bg-white/30"
						on:click={handleUpdate}
						disabled={isUpdating}
					>
						{#if isUpdating}
							<svg
								class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Updating...
						{:else}
							Update Now
						{/if}
					</Button>

					<button
						class="rounded p-1 text-white/80 hover:text-white"
						on:click={dismissBanner}
						disabled={isUpdating}
						aria-label="Dismiss update notification"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure banner doesn't interfere with page content */
	:global(body:has(.sw-update-banner)) {
		padding-top: 60px;
	}
</style>
