<script lang="ts">
	import type { ConnectionEditorProps } from "./factory";
	import type { YamlTagConnConfig } from "./yaml_tag";

	let { value, onchange }: ConnectionEditorProps<YamlTagConnConfig> = $props();

	let tagsRaw = $state(
		Array.isArray(value.tags) ? (value.tags as string[]).join(', ') : ''
	);

	function handleTags(e: Event) {
		tagsRaw = (e.target as HTMLInputElement).value;
		const tags = tagsRaw
			.split(',')
			.map(t => t.trim())
			.filter(Boolean);
		onchange({ ...value, tags });
	}
</script>

<div class="editor-fields">
	<label>
		<span>Теги (через запятую)</span>
		<input
			type="text"
			value={tagsRaw}
			oninput={handleTags}
			placeholder="tag1, tag2, tag3"
		/>
	</label>
</div>

<style>
	.editor-fields {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 0.9em;
		color: var(--text-muted);
	}

	input {
		padding: 4px 8px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
	}
</style>