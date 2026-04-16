<script lang="ts">
	import type { ConnectionRegistry } from "src/connections/factories/factory";
	import {
		emptyRowState,
		type ConnectionConfig,
		type DirectionalConnection,
		type Issue,
		type IssueCode,
		type RowState,
	} from "./types";

	interface Props {
		value: RowState<DirectionalConnection>;
		onchange?: (newValue: RowState<DirectionalConnection>) => void;
		registry: ConnectionRegistry;
	}

	let { 
		value = $bindable(emptyRowState()), onchange, registry,
	}: Props = $props();

	let descriptor = $derived(
		value.draft.type ? registry.get(value.draft.type) : undefined
	);

	let EditorComponent = $derived(descriptor?.editorComponent);

	function handleTitle(event: Event) {
		const title = (event.target as HTMLInputElement).value;
		value = {
			...value,
			draft: { ...value.draft, title },
			meta: { ...value.meta, touched: true },
		};
		onchange?.(value);
	}

	function handleTypeChange(e: Event) {
		const newType = (e.target as HTMLSelectElement).value;
		const newDescriptor = registry.get(newType);

		const newDraft = newDescriptor
			? (newDescriptor.createDefaultConfig() as DirectionalConnection)
			: ({ type: newType, title: value.draft.title } as DirectionalConnection);

		// Сохраняем title, который пользователь уже ввёл
		newDraft.title = value.draft.title;

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
			draft: { ...value.draft, ...updated },
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

	export function issueToText(issue: Issue): string {
		return issueMessages[issue.code]?.(issue) ?? "Некорректное значение.";
	}
	function handleDirectionChange(e: Event) {
		const direction = (e.target as HTMLSelectElement).value as "forward" | "backward";
		value = {
			...value,
			draft: { ...value.draft, direction },
			meta: { ...value.meta, touched: true },
		};
		onchange?.(value);
	}
</script>

<div class="list-item">
	<!-- Первая строка: title + выбор типа -->
	<div class="top-row">
		<div class="title-wrapper">
			<input
				type="text"
				value={value.draft.title}
				oninput={handleTitle}
				placeholder="Введите название..."
				aria-label="Название соединения"
				class:invalid={!value.meta.valid}
			/>
			{#if value.meta.touched && !value.meta.valid}
				<div class="error-hint">{issueToText(value.meta.issues[0])}</div>
			{/if}
		</div>

		<select
			value={value.draft.type}
			onchange={handleTypeChange}
			class="type-select"
		>
			<option value="" disabled>— тип —</option>
			{#each registry.all() as desc (desc.type)}
				<option value={desc.type}>{desc.label}</option>
			{/each}
		</select>
		<div class="top-row">
	<select
		value={value.draft.direction}
		onchange={handleDirectionChange}
		class="direction-select"
	>
		<option value="forward">→ вперёд</option>
		<option value="backward">← назад</option>
	</select>
</div>
	</div>

	<!-- Вторая строка: специфичный контент типа (без title) -->
	{#if EditorComponent}
		<div class="editor-wrapper">
			<EditorComponent value={value.draft} onchange={handleDraftChange} />
		</div>
	{/if}
</div>

<style>
	.list-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 8px;
		padding: 4px;
		border-radius: 4px;
		background: var(--background-primary);
		align-items: stretch;
		min-width: 0;   
    overflow: hidden;
    box-sizing: border-box;
	}

.top-row {
	display: flex;
	gap: 8px;
	align-items: flex-start;
}

.title-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
}

	.title-wrapper input {
		width: 100%;
		padding: 6px 10px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.title-wrapper input.invalid {
		border-color: var(--text-error);
	}

	.error-hint {
		font-size: 0.85em;
		color: var(--text-error);
		padding: 2px 4px 0;
		margin-top: 2px;
		line-height: 1.3;
		opacity: 0.9;
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
		padding: 4px 2px 0;
		width: 100%;
		box-sizing: border-box;
		min-width: 0;      
	   overflow: hidden; 
	}
	.direction-select {
		padding: 6px 8px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		min-width: 110px;
		flex-shrink: 0;
	}
</style>
