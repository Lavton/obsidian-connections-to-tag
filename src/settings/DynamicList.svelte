<script lang="ts" generics="T extends {title: string}">
	import { onMount, type Snippet } from "svelte";
	import type { DragNDropProps, RowState } from "./types";
	import ListItemWrapper from "./ListItemWrapper.svelte";
	import { validateAllItems, validateItemOnChange, validateItemsAfterIndex, type ValidationConfig } from "src/validation";

	interface Props {
		items: RowState<T>[];
		onchange?: (items: RowState<T>[]) => void;
		itemSnippet: Snippet<
			[
				{
					item: RowState<T>;
					updateItem: (newItem: RowState<T>) => void;
					isValid: boolean;
				},
			]
		>;

		createNewItem: () => RowState<T>;
		validationConfig: ValidationConfig<T>;
		addButtonText?: string;
	}

	let {
		items = $bindable([]),
		onchange,
		itemSnippet,
		createNewItem,
		validationConfig,
		addButtonText = "Добавить элемент"
	}: Props = $props();

	onMount(async () => {
		items = await validateAllItems(items, validationConfig)
	});

	let draggedIndex = $state<number | null>(null);

	async function updateItem(updatedRow: RowState<T>, index: number) {
		items[index] = updatedRow
		items = items
		items = await validateItemOnChange(items, index, validationConfig)
		onchange?.(items)
	}

	async function deleteItem(id: string) {
		const index = items.findIndex((item) => item.id === id);
		items = items.filter((item) => item.id !== id);
		items = await validateItemsAfterIndex(items, index - 1, validationConfig)
		onchange?.(items);
	}

	async function addItem(index: number) {
		const newItem = createNewItem();
		items = [...items, newItem]
		items = await validateItemOnChange(items, items.length - 1, validationConfig)
		onchange?.(items)
	}

	async function moveItem(index: number, direction: "up" | "down") {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= items.length) return;

		const newItems = [...items];
		[newItems[index], newItems[newIndex]] = [
			newItems[newIndex],
			newItems[index],
		];
		items = newItems;
		items = await validateItemsAfterIndex(items, Math.min(index, newIndex)-1, validationConfig)
		onchange?.(items);
	}

	function createDragNDrop(
		index: number,
		items: RowState<T>[],
	): DragNDropProps {
		return {
			moveUp: () => moveItem(index, "up"),
			moveDown: () => moveItem(index, "down"),
			isFirst: index === 0,
			isLast: index === items.length - 1,
		};
	}

	async function applyDrop(dropIndex: number) {
		if (draggedIndex === null || draggedIndex === dropIndex) {
			draggedIndex = null;
			return;
		}
		const sourceIndex = draggedIndex;
		const newItems = [...items];
		const [draggedItem] = newItems.splice(sourceIndex, 1);
		newItems.splice(dropIndex, 0, draggedItem);

		items = newItems;
		items = await validateItemsAfterIndex(items, Math.min(sourceIndex, dropIndex) - 1, validationConfig);
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
				updateItem={(newItem) => updateItem(newItem, index)}
				dragNdrop={createDragNDrop(index, items)}
				ondelete={() => deleteItem(item.id)}
				{itemSnippet}
			/>
		{/each}
	</div>

	<button
		type="button"
		class="add-button"
		onclick={() => addItem(items.length)}
	>
		+ {addButtonText}
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
