<script lang="ts">
	interface Props {
		checked: boolean;
		disabled?: boolean;
		id?: string;
		label?: string;
		description?: string;
		onchange?: (checked: boolean) => void;
		class?: string;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		id,
		label,
		description,
		onchange,
		class: className = ''
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		checked = target.checked;
		onchange?.(checked);
	}
</script>

<div class="ferrari-checkbox {className}">
	<div class="flex items-center space-x-3">
		<input
			type="checkbox"
			{id}
			{checked}
			{disabled}
			onchange={handleChange}
			class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded transition-colors duration-200 focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
		/>
		{#if label}
			<label
				for={id}
				class="text-converter-primary cursor-pointer text-sm font-medium select-none {disabled
					? 'cursor-not-allowed opacity-50'
					: ''}"
			>
				{label}
			</label>
		{/if}
	</div>
	{#if description}
		<p class="text-converter-secondary mt-1 ml-7 text-xs">
			{description}
		</p>
	{/if}
</div>

<style>
	.ferrari-checkbox input[type='checkbox']:checked {
		background-color: #dc143c;
		border-color: #dc143c;
	}

	.ferrari-checkbox input[type='checkbox']:hover:not(:disabled) {
		border-color: #b91c2e;
	}

	.ferrari-checkbox input[type='checkbox']:focus {
		box-shadow: 0 0 0 2px rgba(220, 20, 60, 0.2);
	}
</style>
