<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import type {
		DragNDropProps,
		Issue,
		ListCtx,
		RowState,
		ValidationResult,
		ValidationRule,
	} from "./types";
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
		valRules: Array<ValidationRule<T>>;
	}

	let {
		items = $bindable([]),
		onchange,
		itemSnippet,
		createNewItem,
		valRules = [],
	}: Props = $props();
	let domainItems = $derived(items.map((i) => i.draft));
	validateAbove(-1);

	let draggedIndex = $state<number | null>(null);
	function validateWithRules(
		value: T,
		ctx: ListCtx<T | undefined>,
	): ValidationResult {
		const issues: Issue[] = [];
		for (const rule of valRules) {
			const issue = rule.run(value, ctx);
			if (issue) issues.push(issue);
		}
		return { valid: issues.length === 0, issues };
	}
	function validateDepended(
		value: T,
		ctx: ListCtx<T | undefined>,
	): ValidationResult {
		const issues: Issue[] = [];
		for (const rule of valRules) {
			if (rule.scope != "above") continue;
			const issue = rule.run(value, ctx);
			if (issue) issues.push(issue);
		}
		return { valid: issues.length === 0, issues };
	}

	function updateItem(updatedRow: RowState<T>, index: number) {
		items = items.map((row) => {
			if (row.id !== updatedRow.id) return row;

			const validation = validateWithRules(updatedRow.draft, {
				index: index,
				items: domainItems,
			});
			const valid = validation.valid;

			const next = {
				...updatedRow,
				meta: {
					...updatedRow.meta,
					touched: true,
					valid,
					dirty:
						JSON.stringify(updatedRow.draft) !==
						JSON.stringify(updatedRow.saved),
					issues: validation.issues,
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
		validateAbove(index);

		onchange?.(items);
	}
	function validateAbove(index: number) {
		items = items.map((row, idx) => {
			if (idx <= index) return row;
			const validation = validateDepended(row.draft, {
				index: idx,
				items: domainItems,
			});
			const valid = validation.valid;
			const next = {
				...row,
				meta: {
					...row.meta,
					touched: true,
					valid,
					dirty:
						JSON.stringify(row.draft) !== JSON.stringify(row.saved),
					issues: validation.issues,
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
			return next;
		});
	}

	function deleteItem(id: string) {
		const index = items.findIndex((item) => item.id === id);
		items = items.filter((item) => item.id !== id);
		validateAbove(index - 1);
		onchange?.(items);
	}

	function addItem(index: number) {
		const newItem = createNewItem();

		const validation = validateWithRules(newItem.draft, {
			index: index,
			items: domainItems,
		});
		const valid = validation.valid;

		const item: RowState<T> = {
			...newItem,
			meta: {
				...newItem.meta,
				touched: false,
				dirty: true,
				valid,
				issues: validation.issues,
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
		validateAbove(Math.min(index, newIndex)-1)
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
		onclick={() => addItem(domainItems.length)}
	>
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
