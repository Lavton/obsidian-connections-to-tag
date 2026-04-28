
<script lang="ts">
	import type { ConnectionEditorProps } from "../connection_factory";
	import { PMSign, type PlusMinusConnConfig } from "./plus_minus";
	import { issueToText } from "src/settings/validation_ui";

	let {
		value,
		onchange,
		issues = [],
		shouldShowIssues = () => false,
	}: ConnectionEditorProps<PlusMinusConnConfig> = $props();

	function toRaw(
		connections: { sign: PMSign; title: string }[] | undefined
	): string {
		if (!Array.isArray(connections) || connections.length === 0) return "";
		return connections
			.map((c, i) => {
				const t = (c.title ?? "").trim();
				if (!t) return "";
				if (i === 0) return t;
				return `${c.sign === PMSign.MINUS ? "-" : "+"} ${t}`;
			})
			.filter(Boolean)
			.join(" ");
	}

	let exprRaw = $state(toRaw(value.connections));

	function parseExpression(input: string): { sign: PMSign; title: string }[] {
		const s = input.trim();
		if (!s) return [];

		const result: { sign: PMSign; title: string }[] = [];
		const re = /([+-])?\s*([^+-]+)/g;
		let m: RegExpExecArray | null;

		while ((m = re.exec(s)) !== null) {
			const signToken = m[1];
			const title = (m[2] ?? "").trim();
			if (!title) continue;

			result.push({
				sign: signToken === "-" ? PMSign.MINUS : PMSign.PLUS,
				title
			});
		}

		return result;
	}

	function handleExpr(e: Event) {
		exprRaw = (e.target as HTMLInputElement).value;
		const connections = parseExpression(exprRaw);
		onchange({ ...value, connections }, "connections");
	}

	function getConnectionIssues() {
		return issues.filter((issue) => issue.path === "connections");
	}

	let connectionIssues = $derived(getConnectionIssues());
	let showConnectionIssues = $derived(shouldShowIssues("connections"));
</script>

<div class="root">
	<div class="editor-fields">
		<label>
			<span>Выражение</span>
			<input
				type="text"
				value={exprRaw}
				oninput={handleExpr}
				placeholder="заголовок1 + заголовок2 - заголовок3"
				class:invalid={showConnectionIssues}
			/>
			<div class="error-hint" aria-live="polite">
				{#if showConnectionIssues}
					{#each connectionIssues as issue, index (`connections-${issue.code}-${index}`)}
						<div>{issueToText(issue)}</div>
					{/each}
				{/if}
			</div>
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

	input {
		width: 100%;
		padding: 4px 8px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		box-sizing: border-box;
	}

	input.invalid {
		border-color: var(--text-error);
	}

	.error-hint {
		font-size: 0.85em;
		color: var(--text-error);
		min-height: 1.3em;
		line-height: 1.3;
	}

	.root {
		display: flex;
		flex-direction: column;
		width: 100%;
		align-items: stretch;
		box-sizing: border-box;
        min-width: 0;      /* ← добавить */
    overflow: hidden;  /* ← добавить */
	}
</style>
