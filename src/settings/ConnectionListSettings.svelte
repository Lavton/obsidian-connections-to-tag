<script lang="ts">
	import DynamicList from "./DynamicList.svelte";
	import OneConnection from "./OneConnection.svelte";
	import type { ConcreeteConnection } from "./types";
	interface Props {
		items: ConcreeteConnection[];
		onchange?: (items: ConcreeteConnection[]) => void;
	}

	let { items = $bindable([]), onchange }: Props = $props();

	function handleChange(newItems: ConcreeteConnection[]) {
		console.log("Список изменён:", newItems);
		onchange?.(newItems);
	}

	function createNewItem(): ConcreeteConnection {
		return {
			id: crypto.randomUUID(),
			value: "",
		};
	}
</script>

<h3 class="settings-section" id="subsection-connection">Connections</h3>

<div class="settings-section">
	<h3>Мой динамический список</h3>
	<DynamicList bind:items onchange={handleChange} {createNewItem}>
		{#snippet itemSnippet({
			item,
			updateItem,
			deleteItem,
			moveUp,
			moveDown,
			isFirst,
			isLast,
		})}
			<OneConnection
				value={item.value}
				onchange={(newValue) =>
					updateItem({ ...item, value: newValue })}
				ondelete={deleteItem}
				{moveUp}
				{moveDown}
				{isFirst}
				{isLast}
			/>
		{/snippet}
	</DynamicList>
</div>
