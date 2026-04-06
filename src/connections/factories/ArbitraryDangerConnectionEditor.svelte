<script lang="ts">
	import type { ConnectionEditorProps } from "./factory";
	import type { ArbitraryDangerConnConfig } from "./arbitrary_danger";

	let { value, onchange }: ConnectionEditorProps<ArbitraryDangerConnConfig> = $props();

	function handleFilepath(e: Event) {
		const filepath = (e.target as HTMLInputElement).value;
		onchange({ ...value, filepath });
	}
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

input {
	width: 100%;
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	box-sizing: border-box;
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