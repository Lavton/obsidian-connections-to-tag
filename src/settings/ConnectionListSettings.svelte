<script lang="ts">
	import DynamicList from "./DynamicList.svelte";
	import OneConnection from "./OneConnection.svelte";
	import {
		emptyRowState,
		fromRowStates,
		toRowStates,
		type ConcreeteConnection,
		type RowState,
	} from "./types";
	interface Props {
		concreeteConnections: ConcreeteConnection[];
		onchange?: (items: ConcreeteConnection[]) => void;
	}

	let { concreeteConnections = $bindable([]), onchange }: Props = $props();
	let items = $state<RowState<ConcreeteConnection>[]>(
		toRowStates(concreeteConnections),
	);

	function handleChange(newItems: RowState<ConcreeteConnection>[]) {
		onchange?.(fromRowStates(newItems));
	}

	function createNewItem(): RowState<ConcreeteConnection> {
		return emptyRowState();
	}

	function validateConnection(item: ConcreeteConnection): boolean {
		// Проверка: не пустое значение и не содержит " + " или " - "
		const trimmedValue = item.title.trim();
		if (trimmedValue === "") return false;
		if (
			item.title.includes(" + ") ||
			item.title.includes(" - ")
		)
			return false;
		return true;
	}
</script>

<h3 class="settings-section" id="subsection-connection">Connections</h3>

<div class="settings-section">
	<DynamicList
		bind:items
		onchange={handleChange}
		{createNewItem}
		validateItem={validateConnection}
	>
		{#snippet itemSnippet({ item, updateItem })}
			<OneConnection
				value={item}
				onchange={(newRow) => updateItem(newRow)}
			/>
		{/snippet}
	</DynamicList>
</div>
