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
		type ValidationAboveRule,
		type ValidationLocalRule,
		type ValidationRule,
	} from "./types";
	import type { ValidationConfig } from "src/validation";
	interface Props {
		concreeteConnections: DirectionalConnection[];
		onchange?: (items: DirectionalConnection[]) => void;
		validationConfig: ValidationConfig<DirectionalConnection>;
		registry: ConnectionRegistry
	}

	let { concreeteConnections = $bindable([]), onchange, validationConfig, registry }: Props = $props();
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
		{validationConfig}
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
