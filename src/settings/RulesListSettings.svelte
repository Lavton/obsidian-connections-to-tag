<script lang="ts">
	import { emptyRuleConfig, type RuleConfig } from "src/rules/new_rule";
	import type { RuleRegistry } from "src/rules/rule_factory";
	import { validateAllItems, type ValidationConfig } from "src/validation";
	import { untrack } from "svelte";
	import type { Readable } from "svelte/store";
	import DynamicList from "./DynamicList.svelte";
	import OneRule from "./OneRule.svelte";
	import {
		emptyRowState,
		fromRowStates,
		toRowStates,
		type RowState,
	} from "./types";

	interface Props {
		concreeteRules: RuleConfig[];
		onchange?: (items: RuleConfig[]) => void;
		validationConfig: ValidationConfig<RuleConfig>;
		registry: RuleRegistry;
		connectionTitles: Readable<string[]>;
	}

	let { concreeteRules = $bindable([]), onchange, validationConfig, registry, connectionTitles }: Props = $props();
	let items = $state<RowState<RuleConfig>[]>(
		toRowStates(concreeteRules),
	);

	function handleChange(newItems: RowState<RuleConfig>[]) {
		onchange?.(fromRowStates(newItems));
	}

	function createNewItem(): RowState<RuleConfig> {
		return emptyRowState(emptyRuleConfig());
	}

	$effect(() => {
		$connectionTitles;
		untrack(async () => {
			items = await validateAllItems(items, validationConfig);
		});
	});
</script>

<div class="chainstep-section">
	<DynamicList
		bind:items
		onchange={handleChange}
		{createNewItem}
		{validationConfig}
	>
		{#snippet beforeList({ addItem })}
			<div class="list-header">
				<h3 id="subsection-chainstep">Rules</h3>
				<button
					type="button"
					class="add-button"
					onclick={addItem}
					aria-label="Add rule"
					title="Add rule"
				>
					+
				</button>
			</div>
			<p class="list-description">
				A rule selects a connection and defines how far traversal should continue through that connection.
				Rules with titles starting with "_" are private and are not shown for selection.
			</p>
		{/snippet}

		{#snippet itemSnippet({ item, updateItem })}
			<OneRule
				value={item}
				onchange={(newRow) => updateItem(newRow)}
				registry={registry}
				connectionTitles={connectionTitles}
			/>
		{/snippet}
	</DynamicList>
</div>

<style>
	.chainstep-section {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--background-modifier-border);
	}

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
