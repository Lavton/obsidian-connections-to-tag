<script lang="ts">
	import type { RuleEditorProps } from "../rule_factory";
	import type { NStepsConfig } from "./n_steps";

	let { value, onchange }: RuleEditorProps<NStepsConfig> = $props();

	function handleSteps(event: Event) {
		const total_steps = Number((event.target as HTMLInputElement).value);
		onchange({ ...value, total_steps }, "total_steps");
	}
</script>

<div class="root">
	<p class="description">
		Переходит по connection N шагов начиная со старта и останавливается
	</p>
	<label class="field">
		<span>Steps</span>
		<input
			type="number"
			min="0"
			step="1"
			value={value.total_steps}
			oninput={handleSteps}
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
