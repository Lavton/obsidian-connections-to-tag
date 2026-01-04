<script lang="ts" generics="T extends { id: string }">
	import type { DragNDropProps } from "./types";

	import type { Snippet } from "svelte";
	interface Props {
		ondelete?: () => void;
		dragNdrop: DragNDropProps;
		item: T;
		isValid: boolean;
		updateItem: (newItem: T) => void;
		itemSnippet: Snippet<
			[
				{
					item: T;
					updateItem: (newItem: T) => void;
					isValid: boolean;
				},
			]
		>;
	}

	let {
		ondelete,
		dragNdrop,
		item,
		isValid,
		updateItem,
		itemSnippet,
	}: Props = $props();

</script>

<div class="list-item">
	<div class="drag-handle" aria-label="Перетащить" title="Перетащить">⋮⋮</div>

	<div class="move-buttons" role="group" aria-label="Кнопки перемещения">
		<button
			type="button"
			class="move-button"
			onclick={dragNdrop.moveUp}
			disabled={dragNdrop.isFirst}
			aria-label="Переместить вверх"
			title="Переместить вверх"
		>
			↑
		</button>
		<button
			type="button"
			class="move-button"
			onclick={dragNdrop.moveDown}
			disabled={dragNdrop.isLast}
			aria-label="Переместить вниз"
			title="Переместить вниз"
		>
			↓
		</button>
	</div>

	{@render itemSnippet({
		item: item,
		updateItem: updateItem,
		isValid: isValid,
	})}

	<button
		type="button"
		class="delete-button"
		onclick={ondelete}
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
