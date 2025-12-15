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
	function validateConnection(item: ConcreeteConnection): boolean {
		// Проверка: не пустое значение и не содержит " + " или " - "
		const trimmedValue = item.value.trim();
		if (trimmedValue === "") return false;
		if (trimmedValue.includes(" + ") || trimmedValue.includes(" - ")) return false;
		return true;
	}
</script>

<h3 class="settings-section" id="subsection-connection">Connections</h3>

<div class="settings-section">
	<h3>Мой динамический список</h3>
	<DynamicList bind:items={items} onchange={handleChange} {createNewItem} validateItem={validateConnection}>
		{#snippet itemSnippet({
			item,
			updateItem,
			deleteItem,
			moveUp,
			moveDown,
			isFirst,
			isLast,
			isValid
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
				{isValid}
			/>
		{/snippet}
	</DynamicList>
</div>
