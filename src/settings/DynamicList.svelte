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
		listTitle?: string;
		listTitleId?: string;
		listDescription?: string;
		separatorBefore?: boolean;
	}

	let {
		items = $bindable([]),
		onchange,
		itemSnippet,
		createNewItem,
		validationConfig,
		addButtonText = "Add item",
		listTitle,
		listTitleId,
		listDescription,
		separatorBefore = false,
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

<div class="dynamic-list" class:with-separator={separatorBefore}>
	<div class="list-header">
		{#if listTitle}
			<h3 id={listTitleId}>{listTitle}</h3>
		{/if}
		<button
			type="button"
			class="add-button"
			onclick={() => addItem(items.length)}
			aria-label={addButtonText}
			title={addButtonText}
		>
			+
		</button>
	</div>
	{#if listDescription}
		<p class="list-description">{listDescription}</p>
	{/if}

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
</div>

<style>
	.dynamic-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dynamic-list.with-separator {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--background-modifier-border);
	}

	.list-header {
		display: flex;
		align-items: center;
		gap: 3px;
	}

	.list-header h3 {
		margin: 0;
		font-size: var(--font-ui-medium);
		line-height: 1.4;
	}

	.list-description {
		margin: 0;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		line-height: 1.4;
	}

	.items-container {
		display: flex;
		flex-direction: column;
	}

	.add-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: var(--interactive-accent);
		border: none;
		border-radius: 4px;
		color: var(--text-on-accent);
		cursor: pointer;
		font-size: 16px;
		font-weight: 500;
		line-height: 1;
	}

	.add-button:hover {
		background: var(--interactive-accent-hover);
	}
</style>
