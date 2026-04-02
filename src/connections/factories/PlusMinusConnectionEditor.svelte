
<script lang="ts">
	import type { ConnectionEditorProps } from "./factory";
	import { PMSign, type PlusMinusConnConfig } from "./plus_minus";

	let { value, onchange }: ConnectionEditorProps<PlusMinusConnConfig> = $props();

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
		onchange({ ...value, connections });
	}
</script>

<div class="root">
	<p class="description">Комбинированный: объединить или вычесть результаты. Связи в формате: заголовок1 + заголовок2 - заголовок3</p>
	<div class="editor-fields">
		<label>
			<span>Выражение</span>
			<input
				type="text"
				value={exprRaw}
				oninput={handleExpr}
				placeholder="заголовок1 + заголовок2 - заголовок3"
			/>
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
        min-width: 0;      /* ← добавить */
    overflow: hidden;  /* ← добавить */
	}
</style>