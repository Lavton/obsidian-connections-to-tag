<script lang="ts">
	import type { AllYamlConnConfig } from "./all_yaml";
    import type { ConnectionEditorProps } from "./factory";

    let { value, onchange }: ConnectionEditorProps<AllYamlConnConfig> = $props();
</script>

<div class="editor-fields">
    <p class="description">
        Ищет все wiki-ссылки во frontmatter файла.
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