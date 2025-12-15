<script lang="ts">
	interface Props {
		value: string;
		onchange?: (newValue: string) => void;
		ondelete?: () => void;
		moveUp?: () => void;
		moveDown?: () => void;
		isFirst?: boolean;
		isLast?: boolean;
		isValid?: boolean;
	}

	let {
		value = $bindable(""),
		onchange,
		ondelete,
		moveUp,
		moveDown,
		isFirst = false,
		isLast = false,
		isValid = true,
	}: Props = $props();


	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
 		onchange?.(value);
//		console.log(value, isValid)
	}

	function handleDelete() {
		ondelete?.();
	}

	function handleMoveUp() {
		moveUp?.();
	}

	function handleMoveDown() {
		moveDown?.();
	}
$effect(() => {
  console.log('value изменилось:', value);
});
$effect(() => {
  console.log('valid изменилось:', isValid);
});
</script>

<div class="list-item" class:invalid={!isValid}>
	<div class="drag-handle" aria-label="Перетащить" title="Перетащить">⋮⋮</div>

	<div class="move-buttons" role="group" aria-label="Кнопки перемещения">
		<button
			type="button"
			class="move-button"
			onclick={handleMoveUp}
			disabled={isFirst}
			aria-label="Переместить вверх"
			title="Переместить вверх"
		>
			↑
		</button>
		<button
			type="button"
			class="move-button"
			onclick={handleMoveDown}
			disabled={isLast}
			aria-label="Переместить вниз"
			title="Переместить вниз"
		>
			↓
		</button>
	</div>

	<input
		type="text"
		{value}
		oninput={handleInput}
		placeholder="Введите значение..."
		aria-label="Значение элемента"
		class:invalid={!isValid}
	/>

	<button
		type="button"
		class="delete-button"
		onclick={handleDelete}
		aria-label="Удалить элемент"
		title="Удалить"
	>
		×
	</button>
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

	.drag-handle {
		cursor: grab;
		color: var(--text-muted);
		font-size: 16px;
		line-height: 1;
		padding: 4px;
		user-select: none;
	}

	.list-item:active .drag-handle {
		cursor: grabbing;
	}

	.move-buttons {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.move-button {
		padding: 2px 6px;
		background: var(--background-modifier-border);
		border: none;
		border-radius: 3px;
		color: var(--text-normal);
		cursor: pointer;
		font-size: 12px;
		line-height: 1;
		transition: background 0.15s;
	}

	.move-button:hover:not(:disabled) {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.move-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
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
	.delete-button {
		padding: 4px 10px;
		background: var(--interactive-accent);
		border: none;
		border-radius: 4px;
		color: var(--text-on-accent);
		cursor: pointer;
		font-size: 20px;
		line-height: 1;
	}

	.delete-button:hover {
		background: var(--interactive-accent-hover);
	}
</style>
