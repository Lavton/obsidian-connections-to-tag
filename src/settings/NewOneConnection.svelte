
<script lang="ts">
	import type { ConnectionRegistry } from "src/connections/factories/factory";
	import {
		emptyRowState,
		type ConnectionConfig,
		type Issue,
		type IssueCode,
		type RowState,
	} from "./types";

	interface Props {
		value: RowState<ConnectionConfig>;
		onchange?: (newValue: RowState<ConnectionConfig>) => void;
		registry: ConnectionRegistry;
	}

	let { value = $bindable(emptyRowState()), onchange, registry }: Props = $props();

	// Текущий дескриптор на основе выбранного типа
	let descriptor = $derived(
		value.draft.type ? registry.get(value.draft.type) : undefined
	);

	// Компонент для рендера (или undefined если тип не выбран)
	let EditorComponent = $derived(descriptor?.editorComponent);

	function handleTypeChange(e: Event) {
		const newType = (e.target as HTMLSelectElement).value;
		const newDescriptor = registry.get(newType);

		// При смене типа сбрасываем draft до дефолтного конфига нового типа
		const newDraft = newDescriptor
			? (newDescriptor.createDefaultConfig() as ConnectionConfig)
			: ({ type: newType, title: "" } as ConnectionConfig);

		value = {
			...value,
			draft: newDraft,
			meta: { ...value.meta, touched: true },
		};
		onchange?.(value);
	}

	function handleDraftChange(updated: ConnectionConfig) {
		value = {
			...value,
			draft: updated,
			meta: { ...value.meta, touched: true },
		};
		onchange?.(value);
	}

	const issueMessages: Record<IssueCode, (issue: Issue) => string> = {
		required_title: () => "Введите значение.",
		forbitten_pm: () =>
			"Недопустимо использовать « + » или « - » с пробелами.",
		duplicate_with_prev: () =>
			"Название совпадает с одним из элементов выше.",
	};

	function issueToText(issue: Issue): string {
		return issueMessages[issue.code]?.(issue) ?? "Некорректное значение.";
	}
</script>

<div class="list-item">
	<!-- Выбор типа -->
	<select
		value={value.draft.type}
		onchange={handleTypeChange}
		class="type-select"
	>
		<option value="" disabled>— выберите тип —</option>
		{#each registry.all() as desc (desc.type)}
			<option value={desc.type}>{desc.label}</option>
		{/each}
	</select>

	<!-- Редактор конкретного типа -->
	<div class="editor-wrapper">
		{#if EditorComponent}
			<EditorComponent value={value.draft} onchange={handleDraftChange} />
		{:else}
			<span class="placeholder">Выберите тип соединения</span>
		{/if}

		{#if value.meta.touched && !value.meta.valid}
			<div class="error-hint">{issueToText(value.meta.issues[0])}</div>
		{/if}
	</div>
</div>

<style>
	.list-item {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		margin-bottom: 8px;
		padding: 4px;
		border-radius: 4px;
		background: var(--background-primary);
	}

	.type-select {
		padding: 6px 8px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		min-width: 160px;
		flex-shrink: 0;
	}

	.editor-wrapper {
		flex: 1;
		position: relative;
	}

	.placeholder {
		color: var(--text-faint);
		font-size: 0.9em;
	}

	.error-hint {
		font-size: 0.85em;
		color: var(--text-error);
		padding: 2px 4px;
		margin-top: 2px;
	}
</style>