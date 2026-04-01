<script lang="ts">
	import type { ConnectionEditorProps } from "./factory";


    let { value, onchange }: ConnectionEditorProps<{
        type: 'all-in-text';
        title: string
    }> = $props();

    function handleTitle(e: Event) {
        const title = (e.target as HTMLInputElement).value;
        onchange({ ...value, title });
    }
</script>

<div class="editor-fields">
    <label>
        <span>Название</span>
        <input
            type="text"
            value={value.title}
            oninput={handleTitle}
            placeholder="Название соединения"
        />
    </label>
    <p class="description">
        Ищет все wiki-ссылки в тексте файла (кроме frontmatter).
    </p>
</div>

<style>
    .editor-fields {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
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

    .description {
        font-size: 0.85em;
        color: var(--text-faint);
        margin: 0;
    }
</style>