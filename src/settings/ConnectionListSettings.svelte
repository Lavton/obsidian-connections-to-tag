<script lang="ts">
	import type { ConnectionRegistry } from "src/connections/factories/factory";
	import DynamicList from "./DynamicList.svelte";
	import OneConnection from "./OneConnection.svelte";
	import {
		emptyRowState,
		fromRowStates,
		toRowStates,
		type DirectionalConnection,
		type RowState,
		type ValidationRule,
	} from "./types";
	interface Props {
		concreeteConnections: DirectionalConnection[];
		onchange?: (items: DirectionalConnection[]) => void;
		valRules: ValidationRule<DirectionalConnection>[]
		registry: ConnectionRegistry
	}

	let { concreeteConnections = $bindable([]), onchange, valRules, registry }: Props = $props();
	let items = $state<RowState<DirectionalConnection>[]>(
		toRowStates(concreeteConnections),
	);

	function handleChange(newItems: RowState<DirectionalConnection>[]) {
		onchange?.(fromRowStates(newItems));
	}

	function createNewItem(): RowState<DirectionalConnection> {
		return emptyRowState();
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
