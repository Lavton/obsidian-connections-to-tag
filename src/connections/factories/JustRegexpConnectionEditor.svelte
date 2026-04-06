<script lang="ts">
    import type { ConnectionEditorProps } from "./factory";
	import type { JustRegexpConnConfig } from "./just_regexp";

    let { value, onchange }: ConnectionEditorProps<JustRegexpConnConfig> = $props();

    function update(patch: Partial<JustRegexpConnConfig>) {
        onchange({ ...value, ...patch });
    }
</script>

<div class="root">
    <p class="description">
        Ищет ссылки до или после найденной строки / регулярного выражения
    </p>
    <div class="editor-fields">

        <label class="checkbox-label">
            <input
                type="checkbox"
                checked={value.is_regexp}
                onchange={(e) => update({ is_regexp: (e.target as HTMLInputElement).checked })}
            />
            <span>Это регулярное выражение</span>
        </label>

        <label>
            <span>Строка / regexp для поиска</span>
            <input
                type="text"
                value={value.to_find}
                oninput={(e) => update({ to_find: (e.target as HTMLInputElement).value })}
                placeholder="parent:: "
            />
        </label>

        <label class="checkbox-label">
            <input
                type="checkbox"
                checked={value.is_before}
                onchange={(e) => update({ is_before: (e.target as HTMLInputElement).checked })}
            />
            <span>Искать ссылки до вхождения (иначе — после)</span>
        </label>

        <label class="checkbox-label">
            <input
                type="checkbox"
                checked={value.in_the_same_string}
                onchange={(e) => update({ in_the_same_string: (e.target as HTMLInputElement).checked })}
            />
            <span>Ссылки в той же строке (иначе — в соседних)</span>
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