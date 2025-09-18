<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		id?: string;
		class?: string;
		onchange?: (_value: number) => void;
		oninput?: (_value: number) => void;
	}

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		id,
		class: className = '',
		onchange,
		oninput
	}: Props = $props();

	let sliderRef: HTMLInputElement;

	function updateSliderFill(element: HTMLInputElement) {
		const percent =
			((parseFloat(element.value) - parseFloat(element.min)) /
				(parseFloat(element.max) - parseFloat(element.min))) *
			100;
		// Update CSS custom property for pseudo-element background
		element.style.setProperty('--value', `${percent}%`);
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = parseFloat(target.value);
		updateSliderFill(target);
		oninput?.(value);
	}

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		value = parseFloat(target.value);
		onchange?.(value);
	}

	// Update visual fill when value changes externally
	$effect(() => {
		if (sliderRef && typeof value === 'number') {
			// Force update the slider's value attribute and visual fill
			sliderRef.value = value.toString();
			updateSliderFill(sliderRef);
		}
	});

	onMount(() => {
		if (sliderRef) {
			updateSliderFill(sliderRef);
		}
	});
</script>

<input
	bind:this={sliderRef}
	type="range"
	{id}
	{min}
	{max}
	{step}
	{value}
	{disabled}
	class="slider-ferrari w-full {className}"
	oninput={handleInput}
	onchange={handleChange}
/>

<style>
	.slider-ferrari {
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(
			to right,
			#dc143c 0%,
			#dc143c var(--value, 0%),
			#ffe5e0 var(--value, 0%),
			#ffe5e0 100%
		);
		height: 8px;
		border-radius: 4px;
		cursor: pointer;
		outline: none;
		transition: all 0.2s ease;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Touch devices only - better UX targeting */
	@media (pointer: coarse) {
		.slider-ferrari {
			height: 44px; /* WCAG-compliant touch target */
			padding: 18px 0; /* Center the visual track */
			background-clip: content-box;
		}
	}

	.slider-ferrari:hover:not(:disabled) {
		background: linear-gradient(
			to right,
			#ff2800 0%,
			#ff2800 var(--value, 0%),
			#ffb5b0 var(--value, 0%),
			#ffb5b0 100%
		);
	}

	.slider-ferrari:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider-ferrari::-webkit-slider-track {
		background: transparent;
		height: 8px; /* Visual track height */
		border-radius: 4px;
	}

	.slider-ferrari::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
	}

	.slider-ferrari::-webkit-slider-thumb:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow:
			0 4px 8px rgba(255, 40, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
		transform: none;
	}

	.slider-ferrari::-moz-range-track {
		background: transparent;
		height: 8px; /* Visual track height maintained */
		border-radius: 4px;
		border: none;
	}

	.slider-ferrari::-moz-range-thumb {
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
		border: none;
	}

	.slider-ferrari::-moz-range-thumb:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow:
			0 4px 8px rgba(255, 40, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari:disabled::-moz-range-thumb {
		cursor: not-allowed;
		transform: none;
	}

	.slider-ferrari::-ms-track {
		background: transparent;
		height: 8px;
		border-radius: 4px;
		border-color: transparent;
		color: transparent;
	}

	.slider-ferrari::-ms-thumb {
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		cursor: pointer;
	}

	.slider-ferrari::-ms-fill-lower {
		background: #dc143c;
		border-radius: 4px;
	}

	.slider-ferrari::-ms-fill-upper {
		background: #ffe5e0;
		border-radius: 4px;
	}
</style>
