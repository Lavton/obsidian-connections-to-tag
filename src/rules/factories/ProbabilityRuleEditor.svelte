<script lang="ts">
	import type { RuleEditorProps } from "../rule_factory";
	import type { ProbabilityConfig } from "./probability";
	import { issueToText } from "src/settings/validation_ui";

	let {
		value,
		onchange,
		issues = [],
		shouldShowIssues = () => false,
	}: RuleEditorProps<ProbabilityConfig> = $props();

	function getProbabilityPercent() {
		if (typeof value.probability === "string") {
			return value.probability;
		}
		return String(Math.round(value.probability * 100));
	}

	function handleProbability(event: Event) {
		const rawProbability = (event.target as HTMLInputElement).value;
		const probability = rawProbability.trim() === ""
			? rawProbability
			: Number.isInteger(Number(rawProbability))
				? Number(rawProbability) / 100
				: rawProbability;
		onchange({ ...value, probability }, "probability");
	}

	function getProbabilityIssues() {
		return issues.filter((issue) => issue.path === "probability");
	}

	let probabilityPercent = $derived(getProbabilityPercent());
	let probabilityIssues = $derived(getProbabilityIssues());
	let showProbabilityIssues = $derived(shouldShowIssues("probability"));
</script>

<div class="root">
	<label class="field">
		<span>Probability, %</span>
		<input
			type="text"
			inputmode="numeric"
			value={probabilityPercent}
			oninput={handleProbability}
			class:invalid={showProbabilityIssues}
		/>
		<div class="error-hint" aria-live="polite">
			{#if showProbabilityIssues}
				{#each probabilityIssues as issue, index (`probability-${issue.code}-${index}`)}
					<div>{issueToText(issue)}</div>
				{/each}
			{/if}
		</div>
	</label>
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
		width: 100%;
		align-items: stretch;
		box-sizing: border-box;
	}

	.field {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		color: var(--text-muted);
		font-size: 0.9em;
		flex-wrap: wrap;
	}

	.field > span {
		align-self: center;
	}

	input {
		width: 96px;
		padding: 6px 10px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		box-sizing: border-box;
	}

	input.invalid {
		border-color: var(--text-error);
	}

	.error-hint {
		font-size: 0.85em;
		color: var(--text-error);
		min-height: 1.3em;
		line-height: 1.3;
		flex-basis: 100%;
	}
</style>
