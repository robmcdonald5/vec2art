<script lang="ts">
	import { Modal } from '$lib/components/ui/modal';
	import { Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Command } from 'lucide-svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const shortcuts = [
		{
			category: 'General Navigation',
			shortcuts: [
				{ keys: ['Tab'], description: 'Move to next interactive element' },
				{ keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
				{ keys: ['Enter'], description: 'Activate buttons and links' },
				{ keys: ['Space'], description: 'Activate buttons and toggle checkboxes' },
				{ keys: ['Escape'], description: 'Close modals and cancel operations' }
			]
		},
		{
			category: 'Performance Mode Selection',
			shortcuts: [
				{ keys: ['Arrow Keys'], description: 'Navigate between performance modes' },
				{ keys: ['Home'], description: 'Select first performance mode' },
				{ keys: ['End'], description: 'Select last performance mode' },
				{ keys: ['Enter', 'Space'], description: 'Confirm performance mode selection' }
			]
		},
		{
			category: 'File Operations',
			shortcuts: [
				{
					keys: ['Enter', 'Space'],
					description: 'Open file selection dialog (when upload area focused)'
				},
				{
					keys: ['Enter', 'Space'],
					description: 'Remove selected file (when remove button focused)'
				},
				{
					keys: ['Ctrl', 'S'],
					description: 'Download converted SVG (when available)',
					disabled: true
				}
			]
		},
		{
			category: 'Form Controls',
			shortcuts: [
				{ keys: ['Arrow Keys'], description: 'Adjust slider values' },
				{ keys: ['Home'], description: 'Set slider to minimum value' },
				{ keys: ['End'], description: 'Set slider to maximum value' },
				{ keys: ['Page Up'], description: 'Increase slider value by large step' },
				{ keys: ['Page Down'], description: 'Decrease slider value by large step' },
				{ keys: ['Space'], description: 'Toggle checkbox state' }
			]
		},
		{
			category: 'Processing',
			shortcuts: [
				{ keys: ['Ctrl', 'Enter'], description: 'Start conversion (when ready)', disabled: true },
				{ keys: ['Escape'], description: 'Cancel processing (when active)', disabled: true }
			]
		}
	];

	// function formatKeys(keys: string[]): string { /* TODO: implement if needed */ }

	function getKeyIcon(key: string) {
		switch (key.toLowerCase()) {
			case 'arrow keys':
				return [ArrowUp, ArrowDown, ArrowLeft, ArrowRight];
			case 'ctrl':
			case 'cmd':
				return [Command];
			default:
				return [];
		}
	}
</script>

<Modal
	{open}
	{onClose}
	title="Keyboard Shortcuts"
	description="Complete keyboard navigation reference for vec2art"
	class="max-w-4xl"
>
	<div class="p-6">
		<div class="space-y-8">
			{#each shortcuts as category (category.category)}
				<section aria-labelledby="category-{category.category.replace(/\s+/g, '-').toLowerCase()}">
					<h3
						id="category-{category.category.replace(/\s+/g, '-').toLowerCase()}"
						class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
					>
						<Keyboard class="h-5 w-5" aria-hidden="true" />
						{category.category}
					</h3>

					<div class="space-y-3">
						{#each category.shortcuts as shortcut (shortcut.description)}
							<div
								class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50
									{shortcut.disabled ? 'opacity-50' : ''}"
								role="listitem"
							>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
										{shortcut.description}
									</p>
									{#if shortcut.disabled}
										<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
									{/if}
								</div>

								<div class="ml-4 flex items-center gap-1">
									{#each shortcut.keys as key, index (index)}
										{@const icons = getKeyIcon(key)}
										<kbd
											class="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
											aria-label="Press {key}"
										>
											{#each icons as Icon, iconIndex (iconIndex)}
												<Icon class="h-3 w-3" aria-hidden="true" />
											{/each}
											{#if icons.length === 0}
												{key}
											{/if}
										</kbd>
										{#if key !== shortcut.keys[shortcut.keys.length - 1]}
											<span class="text-sm text-gray-400 dark:text-gray-500" aria-hidden="true"
												>+</span
											>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		<!-- Tips Section -->
		<section
			class="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950"
			aria-labelledby="tips-heading"
		>
			<h3 id="tips-heading" class="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-100">
				Accessibility Tips
			</h3>
			<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200" role="list">
				<li role="listitem">• Use Tab to navigate through all interactive elements in order</li>
				<li role="listitem">
					• Press F6 to move between major page sections (in supported browsers)
				</li>
				<li role="listitem">
					• Enable "Focus outline" in browser settings for better visual focus indicators
				</li>
				<li role="listitem">
					• Use screen reader landmarks (Ctrl+; in NVDA) to jump between sections
				</li>
				<li role="listitem">• All processing status and changes are announced to screen readers</li>
			</ul>
		</section>

		<!-- Browser Support -->
		<section
			class="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
			aria-labelledby="browser-support-heading"
		>
			<h3
				id="browser-support-heading"
				class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100"
			>
				Browser Compatibility
			</h3>
			<p class="text-sm text-gray-700 dark:text-gray-300">
				These keyboard shortcuts work in all modern browsers including Chrome, Firefox, Safari, and
				Edge. Some shortcuts may vary slightly between operating systems (Cmd on Mac vs Ctrl on
				Windows/Linux).
			</p>
		</section>

		<!-- Footer Actions -->
		<div class="mt-8 flex justify-end gap-3">
			<button
				onclick={onClose}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				type="button"
			>
				Close
			</button>
		</div>
	</div>
</Modal>

<style>
	kbd {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
	}
</style>
