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

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;

		// обновляем draft и отмечаем touched
		value = {
			...value,
			draft: { ...value.draft, title: target.value },
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
</script>

<div class="list-item">
	<div class="input-wrapper">
		<input
			type="text"
			value={value.draft.title}
			oninput={handleInput}
			placeholder="Введите значение..."
			aria-label="Значение элемента"
			class:invalid={!value.meta.valid}
		/>
		{#if value.meta.touched && !value.meta.valid}
			<div class="error-hint">{issueToText(value.meta.issues[0])}</div>
		{/if}
	</div>
</div>

<style>
	.list-item {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
		padding: 4px;
		border-radius: 4px;
		background: var(--background-primary);
	}

	.input-wrapper {
		flex: 1;
		position: relative;
	}

	input {
		width: 100%;
		padding: 6px 10px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		transition: border-color 0.2s;
	}

	input.invalid {
		border-color: var(--text-error);
	}

	.error-hint {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		font-size: 0.85em;
		color: var(--text-error);
		padding: 2px 4px;
		margin-top: 2px;
		line-height: 1.3;
		opacity: 0.9;
		z-index: 10;
	}
</style>
