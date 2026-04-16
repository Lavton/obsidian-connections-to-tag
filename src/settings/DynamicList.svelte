<script lang="ts" generics="T extends {title: string}">
	import { onMount, type Snippet } from "svelte";
	import type {
		DragNDropProps,
		Issue,
		RowState,
		ValidationAboveRule,
		ValidationLocalRule,
		ValidationResult,
	} from "./types";
	import ListItemWrapper from "./ListItemWrapper.svelte";
	import { validateItemOnChange, validateItemsAfterIndex, type ValidationConfig } from "src/validation";

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
	}

	let {
		items = $bindable([]),
		onchange,
		itemSnippet,
		createNewItem,
		validationConfig
	}: Props = $props();
	// let domainItems = $derived(items.map((i) => i.draft));
	onMount(async () => {
		items = await validateItemsAfterIndex(items, -1, validationConfig)
	});
	// validateAbove(-1);

	let draggedIndex = $state<number | null>(null);


	// async function validateWithRules(
	// 	value: T,
	// 	ctx: ListCtx<T | undefined>,
	// ): Promise<ValidationResult> {
	// 	const issues: Issue[] = [];
	// 	for (const rule of valRules) {
	// 		const issue = await rule.run(value, ctx);
	// 		if (issue) issues.push(issue);
	// 	}
	// 	return { valid: issues.length === 0, issues };
	// }
	// async function validateDepended(
	// 	value: T,
	// 	ctx: ListCtx<T | undefined>,
	// ): Promise<ValidationResult> {
	// 	const issues: Issue[] = [];
	// 	for (const rule of valRules) {
	// 		if (rule.scope !== "above") continue;
	// 		const issue = await rule.run(value, ctx);
	// 		if (issue) issues.push(issue);
	// 	}
	// 	return { valid: issues.length === 0, issues };
	// }

	async function updateItem(updatedRow: RowState<T>, index: number) {

		items[index] = updatedRow
		items = items
		items = await validateItemOnChange(items, index, validationConfig)
		onchange?.(items)
	}
	// async function validateAbove(index: number) {
	// 	const nextItems = await Promise.all(
	// 		items.map(async (row, idx) => {
	// 			if (idx <= index) return row;

	// 			const validation = await validateDepended(row.draft, {
	// 				index: idx,
	// 				items: domainItems,
	// 			});

	// 			const valid = validation.valid;
	// 			const next = {
	// 				...row,
	// 				meta: {
	// 					...row.meta,
	// 					touched: true,
	// 					valid,
	// 					dirty:
	// 						JSON.stringify(row.draft) !== JSON.stringify(row.saved),
	// 					issues: validation.issues,
	// 				},
	// 			} satisfies RowState<T>;

	// 			if (valid) {
	// 				// коммит
	// 				return {
	// 					...next,
	// 					saved: JSON.parse(JSON.stringify(next.draft)),
	// 					meta: { ...next.meta, dirty: false },
	// 				};
	// 			}

	// 			return next;
	// 		})
	// 	);

	// 	items = nextItems;
	// }

	async function deleteItem(id: string) {
		const index = items.findIndex((item) => item.id === id);
		items = items.filter((item) => item.id !== id);
		// await validateAbove(index - 1);
		items = await validateItemsAfterIndex(items, index - 1, validationConfig)
		onchange?.(items);
	}

	async function addItem(index: number) {
		const newItem = createNewItem();
		items = [...items, newItem]
		items = await validateItemOnChange(items, items.length - 1, validationConfig)
		onchange?.(items)

		// const validation = await validateWithRules(newItem.draft, {
		// 	index: index,
		// 	items: domainItems,
		// });
		// const valid = validation.valid;

		// const item: RowState<T> = {
		// 	...newItem,
		// 	meta: {
		// 		...newItem.meta,
		// 		touched: false,
		// 		dirty: true,
		// 		valid,
		// 		issues: validation.issues,
		// 	},
		// };

		// items = [...items, item];
		// onchange?.(items);
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
		// validateAbove(Math.min(index, newIndex)-1)
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
		onclick={() => addItem(items.length)}
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
