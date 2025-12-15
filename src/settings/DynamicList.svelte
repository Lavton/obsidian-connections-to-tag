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
</script>

<div class="dynamic-list">
	<div class="items-container">
		{#each items as item (item.id)}
			{@render itemSnippet({
				item,
				updateItem: (newItem) => updateItem(item.id, newItem),
				deleteItem: () => deleteItem(item.id),
			})}
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
