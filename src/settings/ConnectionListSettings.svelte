<script lang="ts">
	import type { ConnectionRegistry } from "src/connections/connection_factory";
	import {
		emptyConnectionConfig,
		type DirectionalConnection,
	} from "src/connections/connections";
	import DynamicList from "./DynamicList.svelte";
	import OneConnection from "./OneConnection.svelte";
	import {
		emptyRowState,
		fromRowStates,
		toRowStates,
		type RowState,
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
		return emptyRowState(emptyConnectionConfig());
	}

</script>

<div class="settings-section">
	<DynamicList
		bind:items
		onchange={handleChange}
		{createNewItem}
		{validationConfig}
	>
		{#snippet beforeList({ addItem })}
			<div class="list-header">
				<h3 id="subsection-connection">Connections</h3>
				<button
					type="button"
					class="add-button"
					onclick={addItem}
					aria-label="Add connection"
					title="Add connection"
				>
					+
				</button>
			</div>
			<p class="list-description">
				A connection defines which links from a file should be followed during traversal.
				Connections with titles starting with "_" are private and are not shown for selection in rules.
			</p>
		{/snippet}

		{#snippet itemSnippet({ item, updateItem })}
			<OneConnection
				value={item}
				onchange={(newRow) => updateItem(newRow)}
				registry={registry}
			/>
		{/snippet}
	</DynamicList>
</div>

<style>
	.list-header {
		display: flex;
		align-items: center;
		gap: 3px;
	}

	.list-header h3 {
		margin: 0;
		font-size: var(--font-ui-medium);
		line-height: 1.4;
	}

	.list-description {
		margin: 0;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		line-height: 1.4;
	}

	.add-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: var(--interactive-accent);
		border: none;
		border-radius: 4px;
		color: var(--text-on-accent);
		cursor: pointer;
		font-size: 16px;
		font-weight: 500;
		line-height: 1;
	}

	.add-button:hover {
		background: var(--interactive-accent-hover);
	}
</style>
