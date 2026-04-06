<script lang="ts">
	import type { ConnectionEditorProps } from "./factory";
	import type { TopInTextConnConfig } from "./top_in_text";

	let { value, onchange }: ConnectionEditorProps<TopInTextConnConfig> = $props();
</script>

<div class="root">
  <p class="description">
    Ищет первый блок ссылок в тексте заметки (без frontmatter) и возвращает все ссылки из него
  </p>
</div>

<style>
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