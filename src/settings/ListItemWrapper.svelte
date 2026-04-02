<script lang="ts" generics="T">
	import type { DragNDropProps, RowState } from "./types";
	import type { Snippet } from "svelte";

	interface Props {
		ondelete?: () => void;

		dragNdrop: DragNDropProps;
		item: RowState<T>;
		updateItem: (newItem: RowState<T>) => void;
		itemSnippet: Snippet<
			[
				{
					item: RowState<T>;
					updateItem: (newItem: RowState<T>) => void;
				},
			]
		>;

		index: number;
		isDragging: boolean;

		// Управление глобальным draggedIndex живет в DynamicList,
		// но обработчики событий перенесены сюда.
		setDraggedIndex: (index: number | null) => void;

		// Остаток логики drop (перестановка + onchange) живет в DynamicList
		applyDrop: (dropIndex: number) => void;
	}

	let {
		ondelete,
		dragNdrop,
		item,
		updateItem,
		itemSnippet,

		index,
		isDragging,

		setDraggedIndex,
		applyDrop,
	}: Props = $props();

	function handleDragStart(event: DragEvent, index: number) {
		setDraggedIndex(index);
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", index.toString());
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	// "Разделенный" handleDrop: эта часть перенесена сюда
	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();

		applyDrop(dropIndex);
		setDraggedIndex(null);
	}

	function handleDragEnd() {
		setDraggedIndex(null);
	}
</script>

<div
	class="draggable-item"
	class:dragging={isDragging}
	draggable="true"
	role="listitem"
	ondragstart={(e) => handleDragStart(e, index)}
	ondragover={handleDragOver}
	ondrop={(e) => handleDrop(e, index)}
	ondragend={handleDragEnd}
>
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
<div class="item-content">

		{@render itemSnippet({
			item,
			updateItem,
		})}
</div>

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
.item-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
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
