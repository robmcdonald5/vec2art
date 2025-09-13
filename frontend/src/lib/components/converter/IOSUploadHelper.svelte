<script lang="ts">
	import { onMount } from 'svelte';
	import { Info } from 'lucide-svelte';

	let isIOS = $state(false);
	let showHelper = $state(false);

	onMount(() => {
		// Detect iOS
		const ua = navigator.userAgent;
		isIOS =
			/iPad|iPhone|iPod/.test(ua) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

		// Show helper for iOS users
		if (isIOS) {
			showHelper = true;
			// Auto-hide after 10 seconds
			setTimeout(() => {
				showHelper = false;
			}, 10000);
		}
	});
</script>

{#if isIOS && showHelper}
	<div class="relative mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
		<button
			onclick={() => (showHelper = false)}
			class="absolute top-2 right-2 text-blue-500 hover:text-blue-700"
			aria-label="Close"
		>
			×
		</button>
		<div class="flex items-start gap-3">
			<Info class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
			<div>
				<h3 class="mb-1 font-semibold text-blue-900">iOS Upload Instructions</h3>
				<ol class="space-y-1 text-sm text-blue-700">
					<li>1. Tap the "Select Images" button or drop zone</li>
					<li>2. Choose "Photo Library" or "Take Photo"</li>
					<li>3. Select your image (max 10MB recommended)</li>
					<li>4. Wait for the image to load, then tap "Convert"</li>
				</ol>
				<p class="mt-2 text-xs text-blue-600">
					💡 For best results on iOS, use JPEG or PNG images under 5MB
				</p>
			</div>
		</div>
	</div>
{/if}
