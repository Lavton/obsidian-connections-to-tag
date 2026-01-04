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
		isValid,
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

		{@render itemSnippet({
			item,
			updateItem,
			isValid
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
</div>
