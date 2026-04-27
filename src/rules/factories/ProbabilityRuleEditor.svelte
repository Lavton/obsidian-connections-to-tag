<script lang="ts">
	import type { RuleEditorProps } from "../rule_factory";
	import type { ProbabilityConfig } from "./probability";

	let { value, onchange }: RuleEditorProps<ProbabilityConfig> = $props();

	let probabilityPercent = $derived(Math.round(value.probability * 100));

	function handleProbability(event: Event) {
		const probabilityPercent = Number((event.target as HTMLInputElement).value);
		const probability = probabilityPercent / 100;
		onchange({ ...value, probability }, "probability");
	}
</script>

<div class="root">
	<p class="description">
		Переходит по connection с определённой вероятностью
	</p>
	<label class="field">
		<span>Probability, %</span>
		<input
			type="number"
			min="0"
			max="100"
			step="1"
			value={probabilityPercent}
			oninput={handleProbability}
		/>
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
		align-items: center;
		gap: 8px;
		color: var(--text-muted);
		font-size: 0.9em;
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
</style>
