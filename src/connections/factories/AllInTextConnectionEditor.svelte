<script lang="ts">
	import type { AllInTextConnConfig } from "./all_in_text";
	import type { ConnectionEditorProps } from "../connection_factory";

	let { value, onchange }: ConnectionEditorProps<AllInTextConnConfig> = $props();
</script>

<div class="editor-fields">
	<p class="description">
		Ищет все wiki-ссылки в тексте файла (кроме frontmatter).
	</p>
</div>

<style>
	.editor-fields {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.description {
		font-size: 0.85em;
		color: var(--text-faint);
		margin: 0;
	}
</style>
