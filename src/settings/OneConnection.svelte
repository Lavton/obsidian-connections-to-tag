<script lang="ts">
	import type { ConnectionRegistry } from "src/connections/connection_factory";
	import {
		emptyConnectionConfig,
		type ConnectionConfig,
		type DirectionalConnection,
	} from "src/connections/connections";
	import {
		emptyRowState,
		type RowState,
	} from "./types";
	import { issueToText } from "./validation_ui";

	interface Props {
		value: RowState<DirectionalConnection>;
		onchange?: (newValue: RowState<DirectionalConnection>) => void;
		registry: ConnectionRegistry;
	}

	let { 
		value = $bindable(emptyRowState(emptyConnectionConfig())), onchange, registry,
	}: Props = $props();

	let descriptor = $derived(
		value.draft.type ? registry.get(value.draft.type) : undefined
	);

	let EditorComponent = $derived(descriptor?.editorComponent);

	type RowIssue = RowState<DirectionalConnection>["meta"]["issues"][number];

	function applyTouched(path?: string) {
		if (!path) return value.meta;
		if (value.meta.touchedPaths[path]) {
			return value.meta;
		}
		return {
			...value.meta,
			touched: true,
			touchedPaths: { ...value.meta.touchedPaths, [path]: true },
		};
	}

	function updateRow(nextDraft: DirectionalConnection, touchedPath?: string) {
		value = {
			...value,
			draft: nextDraft,
			meta: applyTouched(touchedPath),
		};
		onchange?.(value);
	}

	function getIssuesForPath(path: string): RowIssue[] {
		return value.meta.issues.filter((issue) => issue.path === path);
	}

	function isTouched(path: string): boolean {
		return Boolean(value.meta.touchedPaths[path]);
	}

	function shouldShowIssues(path: string): boolean {
		const issues = getIssuesForPath(path);
		if (issues.length === 0) {
			return false;
		}
		return issues.some((issue) => issue.scope === "above") || isTouched(path);
	}

	function handleTitle(event: Event) {
		const title = (event.target as HTMLInputElement).value;
		updateRow({ ...value.draft, title }, "title");
	}

	function handleTypeChange(e: Event) {
		const newType = (e.target as HTMLSelectElement).value;
		const newDescriptor = registry.get(newType);

		const newDraft = newDescriptor
			? (newDescriptor.createDefaultConfig() as DirectionalConnection)
			: ({ type: newType, title: value.draft.title } as DirectionalConnection);

		newDraft.title = value.draft.title;
		newDraft.direction = value.draft.direction;
		updateRow(newDraft, "type");
	}

	function handleDraftChange(updated: ConnectionConfig, touchedPath?: string) {
		updateRow({ ...value.draft, ...updated }, touchedPath);
	}

	function handleDirectionChange(e: Event) {
		const direction = (e.target as HTMLSelectElement).value as "forward" | "backward";
		updateRow({ ...value.draft, direction }, "direction");
	}

	let titleIssues = $derived(getIssuesForPath("title"));
	let typeIssues = $derived(getIssuesForPath("type"));
	let showRowInvalidState = $derived(
		value.meta.issues.some((issue) => issue.scope === "above") ||
			(value.meta.touched && !value.meta.valid)
	);
	let showTitleIssues = $derived(shouldShowIssues("title"));
	let showTypeIssues = $derived(shouldShowIssues("type"));
</script>

<div class="list-item">
	<div class="top-row">
		<div
			class="status-indicator"
			class:invalid={showRowInvalidState}
			aria-hidden="true"
		></div>

		<div class="field-stack title-wrapper">
			<input
				type="text"
				value={value.draft.title}
				oninput={handleTitle}
				placeholder="Введите название..."
				aria-label="Название соединения"
				class:invalid={showTitleIssues}
			/>
			<div class="error-hint" aria-live="polite">
				{#if showTitleIssues}
					{#each titleIssues as issue, index (`title-${issue.code}-${index}`)}
						<div>{issueToText(issue)}</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="field-stack field-select-wrapper type-wrapper">
			<select
				value={value.draft.type}
				onchange={handleTypeChange}
				class="type-select"
				class:invalid={showTypeIssues}
			>
				<option value="" disabled>— тип —</option>
				{#each registry.all() as desc (desc.type)}
					<option value={desc.type}>{desc.label}</option>
				{/each}
			</select>
			<div class="error-hint" aria-live="polite">
				{#if showTypeIssues}
					{#each typeIssues as issue, index (`type-${issue.code}-${index}`)}
						<div>{issueToText(issue)}</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="field-stack field-select-wrapper direction-wrapper">
			<select
				value={value.draft.direction}
				onchange={handleDirectionChange}
				class="direction-select"
			>
				<option value="forward">→ вперёд</option>
				<option value="backward">← назад</option>
			</select>
			<div class="error-hint" aria-hidden="true"></div>
		</div>
	</div>

	{#if EditorComponent}
		<div class="editor-wrapper">
			<EditorComponent
				value={value.draft}
				onchange={handleDraftChange}
				issues={value.meta.issues}
				{shouldShowIssues}
			/>
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

	.status-indicator {
		width: 8px;
		height: 8px;
		margin-top: 10px;
		border-radius: 50%;
		background: transparent;
		flex: 0 0 auto;
	}

	.status-indicator.invalid {
		background: var(--text-error);
	}

	.field-stack {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.title-wrapper {
		flex: 1;
	}

	.field-select-wrapper {
		flex: 0 0 auto;
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

	.type-select.invalid {
		border-color: var(--text-error);
	}

	.error-hint {
		font-size: 0.85em;
		color: var(--text-error);
		padding: 2px 4px 0;
		margin-top: 2px;
		line-height: 1.3;
		opacity: 0.9;
		min-height: 1.3em;
	}

	.type-wrapper .error-hint,
	.direction-wrapper .error-hint {
		padding-left: 0;
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
