<script lang="ts">
	import { ChevronDown, Check, type LucideIcon } from 'lucide-svelte';
	import FerrariParameterControl from './FerrariParameterControl.svelte';
	import PortalTooltipFixed from './tooltip/PortalTooltipFixed.svelte';

	interface Props {
		title: string;
		icon: LucideIcon;
		iconColorClass: string;
		backgroundGradient: string;
		expanded: boolean;
		onToggle: () => void;
		parameters: string[];
		config: Record<string, any>;
		metadata: Record<string, any>;
		onParameterChange: (name: string, value: any) => void;
		isParameterVisible?: (param: string) => boolean;
		disabled?: boolean;
		customParameterRenderer?: Record<string, any>; // For special parameter rendering
	}

	let {
		title,
		icon: Icon,
		iconColorClass,
		backgroundGradient,
		expanded = false,
		onToggle,
		parameters,
		config,
		metadata,
		onParameterChange,
		isParameterVisible = () => true,
		disabled = false,
		customParameterRenderer = {}
	}: Props = $props();

	// Check if a parameter has custom rendering logic
	function hasCustomRenderer(param: string): boolean {
		return customParameterRenderer[param] !== undefined;
	}

	// Get custom renderer data for a parameter
	function getCustomRenderer(param: string) {
		return customParameterRenderer[param];
	}
</script>

<div
	class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
>
	<button
		type="button"
		onclick={onToggle}
		class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		{disabled}
	>
		<div class="flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg {backgroundGradient}">
				<Icon class="h-4 w-4 {iconColorClass}" />
			</div>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
				{title}
			</span>
		</div>
		<ChevronDown
			class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {expanded
				? 'rotate-180'
				: ''}"
		/>
	</button>

	{#if expanded}
		<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
			<div class="space-y-4">
				{#if $$slots.default}
					<!-- Custom content slot -->
					<slot />
				{:else}
					<!-- Auto-generated parameter controls -->
					{#each parameters as param (param)}
						{#if metadata[param] && isParameterVisible(param)}
							{#if hasCustomRenderer(param)}
								<!-- Custom parameter rendering -->
								{@const renderer = getCustomRenderer(param)}
								{#if renderer.type === 'checkbox-with-sub-controls'}
									<div class="space-y-3">
										<div class="flex items-center justify-between">
											<label class="flex cursor-pointer items-center gap-2">
												<input
													type="checkbox"
													checked={config[param] ?? false}
													onchange={(e) =>
														onParameterChange(param, (e.target as HTMLInputElement).checked)}
													{disabled}
													class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
												/>
												<div class="flex items-center gap-2">
													<span
														class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium"
													>
														{renderer.label}
													</span>
													{#if renderer.tooltip}
														<PortalTooltipFixed
															content={renderer.tooltip}
															position="top"
															size="md"
														/>
													{/if}
												</div>
											</label>
											{#if config[param]}
												<div class="flex items-center gap-1">
													<Check class="h-4 w-4 text-green-500" />
													<span class="text-xs font-medium text-green-600 dark:text-green-400"
														>Active</span
													>
												</div>
											{/if}
										</div>

										{#if config[param] && renderer.subControls}
											<div
												class="ml-6 space-y-3 border-l-2 border-blue-100 pl-2 dark:border-blue-900"
											>
												{#each renderer.subControls as subParam}
													{#if metadata[subParam]}
														<FerrariParameterControl
															name={subParam}
															value={config[subParam]}
															metadata={metadata[subParam]}
															onChange={(value) => onParameterChange(subParam, value)}
															{disabled}
														/>
													{/if}
												{/each}
											</div>
										{/if}
									</div>
								{:else if renderer.type === 'conditional'}
									{#if renderer.condition(config)}
										<FerrariParameterControl
											name={param}
											value={config[param]}
											metadata={metadata[param]}
											onChange={(value) => onParameterChange(param, value)}
											{disabled}
										/>
									{/if}
								{/if}
							{:else}
								<!-- Standard parameter control -->
								<FerrariParameterControl
									name={param}
									value={config[param]}
									metadata={metadata[param]}
									onChange={(value) => onParameterChange(param, value)}
									{disabled}
								/>
							{/if}
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
