<script lang="ts">
	import type { BetweenInTextConnConfig } from "./between_in_text";
	import type { ConnectionEditorProps } from "../connection_factory";

	let { value, onchange }: ConnectionEditorProps<BetweenInTextConnConfig> = $props();

	function handleIsRegexp(e: Event) {
		onchange({ ...value, is_regexp: (e.target as HTMLInputElement).checked });
	}

	function handleStart(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		onchange({ ...value, start_to_find: v || null });
	}

	function handleEnd(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		onchange({ ...value, end_to_find: v || null });
	}
</script>

<div class="root">
  <div class="editor-fields">
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={value.is_regexp}
        onchange={handleIsRegexp}
      />
      <span>Use regular expressions</span>
    </label>
    <label>
      <span>Fragment start</span>
      <input
        type="text"
        value={value.start_to_find ?? ''}
        oninput={handleStart}
        placeholder={value.is_regexp ? 'Regexp, for example: ^## ' : 'String, for example: ## Links'}
      />
    </label>
    <label>
      <span>Fragment end</span>
      <input
        type="text"
        value={value.end_to_find ?? ''}
        oninput={handleEnd}
        placeholder={value.is_regexp ? 'Regexp, for example: ^## ' : 'String, for example: ## End'}
      />
    </label>
  </div>
</div>

<style>
.editor-fields {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
	align-items: stretch;
}

label {
	display: flex;
	flex-direction: column;
	gap: 2px;
	font-size: 0.9em;
	color: var(--text-muted);
	width: 100%;
	align-items: stretch;
}

.checkbox-label {
	flex-direction: row;
	align-items: center;
	gap: 6px;
}

input[type="text"] {
	width: 100%;
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	box-sizing: border-box;
}

.root {
	display: flex;
	flex-direction: column;
	width: 100%;
	align-items: stretch;
	box-sizing: border-box;
}
</style>
