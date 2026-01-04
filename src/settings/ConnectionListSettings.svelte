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
		if (item.value.includes(" + ") || item.value.includes(" - ")) return false;
		return true;
	}
</script>

<h3 class="settings-section" id="subsection-connection">Connections</h3>

<div class="settings-section">
	<DynamicList bind:items={items} onchange={handleChange} {createNewItem} validateItem={validateConnection}>
		{#snippet itemSnippet({
			item,
			updateItem,
			isValid
		})}
			<OneConnection
				value={item.value}
				onchange={(newValue) =>
					updateItem({ ...item, value: newValue })}
				{isValid}
			/>
		{/snippet}
	</DynamicList>
</div>
