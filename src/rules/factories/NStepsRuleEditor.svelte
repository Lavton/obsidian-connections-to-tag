<script lang="ts">
	import type { RuleEditorProps } from "../rule_factory";
	import type { NStepsConfig } from "./n_steps";
	import { issueToText } from "src/settings/validation_ui";

	let {
		value,
		onchange,
		issues = [],
		shouldShowIssues = () => false,
	}: RuleEditorProps<NStepsConfig> = $props();

	function handleSteps(event: Event) {
		const rawTotalSteps = (event.target as HTMLInputElement).value;
		const total_steps = rawTotalSteps.trim() === ""
			? rawTotalSteps
			: Number.isInteger(Number(rawTotalSteps))
				? Number(rawTotalSteps)
				: rawTotalSteps;
		onchange({ ...value, total_steps }, "total_steps");
	}

	function getStepsIssues() {
		return issues.filter((issue) => issue.path === "total_steps");
	}

	let stepsIssues = $derived(getStepsIssues());
	let showStepsIssues = $derived(shouldShowIssues("total_steps"));
</script>

<div class="root">
	<p class="description">
		Переходит по connection N шагов начиная со старта и останавливается
	</p>
	<label class="field">
		<span>Steps</span>
		<input
			type="text"
			inputmode="numeric"
			value={value.total_steps}
			oninput={handleSteps}
			class:invalid={showStepsIssues}
		/>
		<div class="error-hint" aria-live="polite">
			{#if showStepsIssues}
				{#each stepsIssues as issue, index (`total-steps-${issue.code}-${index}`)}
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
	.description {
		font-size: 0.85em;
		color: var(--text-faint);
		margin: 0;
		text-align: left;
		width: 100%;
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
