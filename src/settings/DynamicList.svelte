<script lang="ts" generics="T extends { id: string }">
	import type { Snippet } from "svelte";

	interface Props {
		items: T[];
		onchange?: (items: T[]) => void;
		itemSnippet: Snippet<
			[
				{
					item: T;
					updateItem: (newItem: T) => void;
					deleteItem: () => void;
					moveUp: () => void;
					moveDown: () => void;
					isFirst: boolean;
					isLast: boolean;
				},
			]
		>;
		createNewItem: () => T;
	}

	let {
		items = $bindable([]),
		onchange,
		itemSnippet,
		createNewItem,
	}: Props = $props();

	let draggedIndex = $state<number | null>(null);

	function updateItem(id: string, newItem: T) {
		items = items.map((item) => (item.id === id ? newItem : item));
		onchange?.(items);
	}

	function deleteItem(id: string) {
		items = items.filter((item) => item.id !== id);
		onchange?.(items);
	}

	function addItem() {
		items = [...items, createNewItem()];
		onchange?.(items);
	}

	function moveItem(index: number, direction: "up" | "down") {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= items.length) return;

		const newItems = [...items];
		[newItems[index], newItems[newIndex]] = [
			newItems[newIndex],
			newItems[index],
		];
		items = newItems;
		onchange?.(items);
	}

	function handleDragStart(event: DragEvent, index: number) {
		draggedIndex = index;
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

	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();

		if (draggedIndex === null || draggedIndex === dropIndex) {
			draggedIndex = null;
			return;
		}

		const newItems = [...items];
		const [draggedItem] = newItems.splice(draggedIndex, 1);
		newItems.splice(dropIndex, 0, draggedItem);

		items = newItems;
		onchange?.(items);
		draggedIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}
</script>

<div class="dynamic-list">
	<div class="items-container" role="list">
		{#each items as item, index (item.id)}
			<div
				class="draggable-item"
				class:dragging={draggedIndex === index}
				draggable="true"
				role="listitem"
				ondragstart={(e) => handleDragStart(e, index)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, index)}
				ondragend={handleDragEnd}
			>
				{@render itemSnippet({
					item,
					updateItem: (newItem) => updateItem(item.id, newItem),
					deleteItem: () => deleteItem(item.id),
					moveUp: () => moveItem(index, "up"),
					moveDown: () => moveItem(index, "down"),
					isFirst: index === 0,
					isLast: index === items.length - 1,
				})}
			</div>
		{/each}
	</div>

	<button type="button" class="add-button" onclick={addItem}>
		+ Добавить элемент
	</button>
</div>

<style>
	.dynamic-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.items-container {
		display: flex;
		flex-direction: column;
	}

	.draggable-item {
		cursor: grab;
		transition: opacity 0.2s;
	}

	.draggable-item:active {
		cursor: grabbing;
	}

	.draggable-item.dragging {
		opacity: 0.5;
	}

	.add-button {
		padding: 8px 16px;
		background: var(--interactive-accent);
		border: none;
		border-radius: 4px;
		color: var(--text-on-accent);
		cursor: pointer;
		font-weight: 500;
	}

	.add-button:hover {
		background: var(--interactive-accent-hover);
	}
</style>
