<script lang="ts">
	interface Props {
		value: string;
		onchange?: (newValue: string) => void;
		isValid?: boolean;
	}

	let {
		value = $bindable(""),
		onchange,
		isValid = true,
	}: Props = $props();


	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
 		onchange?.(value);
	}

</script>

<div class="list-item" class:invalid={!isValid}>
	<input
		type="text"
		{value}
		oninput={handleInput}
		placeholder="Введите значение..."
		aria-label="Значение элемента"
		class:invalid={!isValid}
	/>
</div>

<style>
	.list-item {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
		padding: 4px;
		border-radius: 4px;
		background: var(--background-primary);
	}


	input {
		flex: 1;
		padding: 6px 10px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		transition: border-color 0.2s;
	}
	input.invalid {
		border-color: var(--text-error);
		border-width: 2px;
	}

	.list-item.invalid {
		opacity: 0.9;
	}
</style>
