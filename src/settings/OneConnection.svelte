<script lang="ts">
	import { emptyRowState, type ConcreeteConnection, type RowState } from "./types";

	interface Props {
		value: RowState<ConcreeteConnection>;
		onchange?: (newValue: RowState<ConcreeteConnection>) => void;
	}

	let {
		value = $bindable(emptyRowState()),
		onchange,
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;

		// обновляем draft и отмечаем touched
		value = {
			...value,
			draft: {...value.draft, title: target.value},
			meta: { ...value.meta, touched: true },
		};

		onchange?.(value);
	}
</script>

<div class="list-item" class:invalid={!value.meta.valid}>
	<input
		type="text"
		value={value.draft.title}
		oninput={handleInput}
		placeholder="Введите значение..."
		aria-label="Значение элемента"
		class:invalid={!value.meta.valid}
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
