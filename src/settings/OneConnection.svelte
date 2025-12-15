<script lang="ts">
	interface Props {
		value: string;
		onchange?: (newValue: string) => void;
		ondelete?: () => void;
	}

	let { value = $bindable(""), onchange, ondelete }: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		onchange?.(value);
	}

	function handleDelete() {
		ondelete?.();
	}
</script>

<div class="list-item">
	<input
		type="text"
		{value}
		oninput={handleInput}
		placeholder="Введите значение..."
	/>
	<button
		type="button"
		class="delete-button"
		onclick={handleDelete}
		aria-label="Удалить"
	>
		×
	</button>
</div>

<style>
	.list-item {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
	}

	input {
		flex: 1;
		padding: 6px 10px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
	}

	.delete-button {
		padding: 4px 10px;
		background: var(--interactive-accent);
		border: none;
		border-radius: 4px;
		color: var(--text-on-accent);
		cursor: pointer;
		font-size: 20px;
		line-height: 1;
	}

	.delete-button:hover {
		background: var(--interactive-accent-hover);
	}
</style>
