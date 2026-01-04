<script lang="ts" generics="T extends { id: string }">
	import type { Snippet } from "svelte";
	import type { DragNDropProps } from "./types";
	import ListItemWrapper from "./ListItemWrapper.svelte";

	interface Props {
		items: T[];
		onchange?: (items: T[]) => void;
		itemSnippet: Snippet<
			[
				{
					item: T;
					updateItem: (newItem: T) => void;
					isValid: boolean;
				},
			]
		>;

		createNewItem: () => T;
		validateItem?: (item: T) => boolean;
	}

	let {
		items = $bindable([]),
		onchange,
		itemSnippet,
		createNewItem,
		validateItem = () => true,
	}: Props = $props();

	let draggedIndex = $state<number | null>(null);
	let pendingItems = $state<Set<string>>(new Set());
	let itemDrafts = $state<Map<string, T>>(new Map());

	function updateItem(id: string, newItem: T) {
		const isValid = validateItem(newItem);

		if (isValid) {
			items = items.map((item) => (item.id === id ? newItem : item));

			pendingItems.delete(id);
			pendingItems = new Set(pendingItems);

			itemDrafts.delete(id);
			itemDrafts = new Map(itemDrafts);

			onchange?.(items);
		} else {
			pendingItems.add(id);
			pendingItems = new Set(pendingItems);

			itemDrafts.set(id, newItem);
			itemDrafts = new Map(itemDrafts);
		}
	}

	function deleteItem(id: string) {
		items = items.filter((item) => item.id !== id);
		pendingItems.delete(id);
		itemDrafts.delete(id);
		onchange?.(items);
	}

	function addItem() {
		const newItem = createNewItem();
		const isValid = validateItem(newItem);

		if (isValid) {
			items = [...items, newItem];
			onchange?.(items);
		} else {
			items = [...items, newItem];
			pendingItems.add(newItem.id);
			itemDrafts.set(newItem.id, newItem);
		}
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

	function createDragNDrop(index: number, items: T[]): DragNDropProps {
		return {
			moveUp: () => moveItem(index, "up"),
			moveDown: () => moveItem(index, "down"),
			isFirst: index === 0,
			isLast: index === items.length - 1,
		};
	}

	// Остаток handleDrop, который остается в DynamicList:
	// он выполняется только если ListItemWrapper уже подтвердил, что drop валиден.
	function applyDrop(dropIndex: number) {
		if (draggedIndex === null || draggedIndex === dropIndex) {
			draggedIndex = null;
			return;
		}
		const newItems = [...items];
		const [draggedItem] = newItems.splice(draggedIndex, 1);
		newItems.splice(dropIndex, 0, draggedItem);

		items = newItems;
		onchange?.(items);
	}

	function setDraggedIndex(index: number | null) {
		draggedIndex = index;
	}
</script>

<div class="dynamic-list">
	<div class="items-container" role="list">
		{#each items as item, index (item.id)}
			<ListItemWrapper
				{item}
				{index}
				isDragging={draggedIndex === index}
				{setDraggedIndex}
				{applyDrop}
				isValid={!pendingItems.has(item.id)}
				updateItem={(newItem) => updateItem(item.id, newItem)}
				dragNdrop={createDragNDrop(index, items)}
				ondelete={() => deleteItem(item.id)}
				{itemSnippet}
			/>
		{/each}
	</div>

	<button type="button" class="add-button" onclick={addItem}>
		+ Добавить элемент
	</button>
</div>
