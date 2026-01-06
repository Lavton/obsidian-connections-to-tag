<script lang="ts">
	import { emptyConcreeteConnection, toRowStates, type ConcreeteConnection, type RowState } from "./types";

	interface Props {
		value: RowState<ConcreeteConnection>;
		onchange?: (newValue: RowState<ConcreeteConnection>) => void;
		isValid?: boolean;
	}

	let {
		value = $bindable(toRowStates([emptyConcreeteConnection()])[0]),
		onchange,
		isValid = true,
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;

		// обновляем draft и отмечаем touched
		value = {
			...value,
			draft: {title: target.value},
			saved: {title: target.value},
			meta: { ...value.meta, touched: true },
		};

		onchange?.(value);
	}
</script>

<div class="list-item" class:invalid={!isValid}>
	<input
		type="text"
		value={value.draft.title}
		oninput={handleInput}
		placeholder="Введите значение..."
		aria-label="Значение элемента"
		class:invalid={!isValid}
	/>
</div>
