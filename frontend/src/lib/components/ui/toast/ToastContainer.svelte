<script lang="ts">
import { toastStore } from '$lib/stores/toast.svelte';
import Toast from './Toast.svelte';

// Get reactive toasts
const toasts = $derived(toastStore.all);
</script>

<!-- Toast Container -->
{#if toasts.length > 0}
	<div
		class="fixed bottom-0 right-0 z-50 p-4 sm:p-6"
		aria-live="polite"
		aria-label="Notifications"
	>
		<div class="flex flex-col gap-2">
			{#each toasts as toast (toast.id)}
				<Toast
					{toast}
					onDismiss={() => toastStore.dismiss(toast.id)}
				/>
			{/each}
		</div>
	</div>
{/if}