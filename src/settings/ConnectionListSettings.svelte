<script lang="ts">
	import type { ConnectionRegistry } from "src/connections/factories/factory";
	import DynamicList from "./DynamicList.svelte";
	import OneConnection from "./OneConnection.svelte";
	import {
		emptyRowState,
		fromRowStates,
		toRowStates,
		type ConnectionConfig,
		type RowState,
		type ValidationRule,
	} from "./types";
	interface Props {
		concreeteConnections: ConnectionConfig[];
		onchange?: (items: ConnectionConfig[]) => void;
		valRules: Array<ValidationRule<ConnectionConfig>>
		registry: ConnectionRegistry
	}

	let { concreeteConnections = $bindable([]), onchange, valRules, registry }: Props = $props();
	let items = $state<RowState<ConnectionConfig>[]>(
		toRowStates(concreeteConnections),
	);

	function handleChange(newItems: RowState<ConnectionConfig>[]) {
		onchange?.(fromRowStates(newItems));
	}

	function createNewItem(): RowState<ConnectionConfig> {
		return emptyRowState();
	}

	function validateConnection(item: ConnectionConfig): boolean {
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
		{valRules}
	>
		{#snippet itemSnippet({ item, updateItem })}
			<OneConnection
				value={item}
				onchange={(newRow) => updateItem(newRow)}
				registry={registry}
			/>
		{/snippet}
	</DynamicList>
</div>
