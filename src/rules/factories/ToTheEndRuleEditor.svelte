<script lang="ts">
	import type { RuleEditorProps } from "../rule_factory";
	import type { ToTheEndConfig } from "./to_the_end";

	let { value, onchange }: RuleEditorProps<ToTheEndConfig> = $props();
</script>

<div class="root">
	<p class="description">
		Продолжает обход, пока выбранная связь возвращает новые заметки.
	</p>
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
</style>
