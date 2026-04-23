<script lang="ts">
	import type { ConnectionEditorProps } from "../factory";
	import type { ArbitraryDangerConnConfig } from "./arbitrary_danger";
	import { issueToText } from "src/settings/validation_ui";

	let {
		value,
		onchange,
		issues = [],
		shouldShowIssues = () => false,
	}: ConnectionEditorProps<ArbitraryDangerConnConfig> = $props();

	function handleFilepath(e: Event) {
		const filepath = (e.target as HTMLInputElement).value;
		onchange({ ...value, filepath }, "filepath");
	}

	function getFilepathIssues() {
		return issues.filter((issue) => issue.path === "filepath");
	}

	let filepathIssues = $derived(getFilepathIssues());
	let showFilepathIssues = $derived(shouldShowIssues("filepath"));
</script>

<div class="root">
  <p class="description">
    Выполняет код из первого js/ts блока указанного файла. Используйте с осторожностью.
  </p>
  <div class="editor-fields">
    <label>
      <span>Путь к файлу</span>
      <input
        type="text"
        value={value.filepath}
        oninput={handleFilepath}
        placeholder="path/to/file.md"
        class:invalid={showFilepathIssues}
      />
	  <div class="error-hint" aria-live="polite">
		{#if showFilepathIssues}
			{#each filepathIssues as issue, index (`filepath-${issue.code}-${index}`)}
				<div>{issueToText(issue)}</div>
			{/each}
		{/if}
	  </div>
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

input {
	width: 100%;
	padding: 4px 8px;
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
}

.description {
	font-size: 0.85em;
	color: var(--text-faint);
	margin: 0;
	text-align: left;
	width: 100%;
}

.root {
	display: flex;
	flex-direction: column;
	width: 100%;
	align-items: stretch;
	box-sizing: border-box;
}
</style>
