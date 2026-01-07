<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import type { DragNDropProps, RowState } from "./types";
	import ListItemWrapper from "./ListItemWrapper.svelte";

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

	function updateItem(updatedRow: RowState<T>) {
		items = items.map((row) => {
			if (row.id !== updatedRow.id) return row;

			const validation = validateItem(updatedRow.draft);
			const valid = validation;

			const next = {
				...updatedRow,
				meta: {
					...updatedRow.meta,
					touched: true,
					valid,
					dirty:
						JSON.stringify(updatedRow.draft) !==
						JSON.stringify(updatedRow.saved),
				},
			} satisfies RowState<T>;

			if (valid) {
				// коммит
				return {
					...next,
					saved: JSON.parse(JSON.stringify(next.draft)),
					meta: { ...next.meta, dirty: false },
				};
			}

			// остаёмся на draft, но saved не трогаем
			return next;
		});

		onchange?.(items);
	}

	function deleteItem(id: string) {
		items = items.filter((item) => item.id !== id);
		onchange?.(items);
	}

	function addItem() {
		const newItem = createNewItem();
		const v = validateItem(newItem.draft);
		const valid = v;
		console.log({valid})

		const item: RowState<T> = {
			...newItem,
			meta: {
				...newItem.meta,
				touched: false,
				dirty: true,
				valid,
			},
		};

		items = [...items, item];
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
				updateItem={(newItem) => updateItem(newItem)}
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
