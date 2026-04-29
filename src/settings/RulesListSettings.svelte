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
		addButtonText="Add rule"
		listTitle="Rules"
		listTitleId="subsection-chainstep"
		listDescription='A rule selects a connection and defines how far traversal should continue through that connection. Rules with titles starting with "_" are private and are not shown for selection.'
		separatorBefore
	>
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
