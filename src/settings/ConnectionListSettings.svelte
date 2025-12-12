<script lang="ts">
    import type { ListItem, ValidationResult } from './types';

    interface Props {
        items: ListItem[];
        onchange?: (items: ListItem[]) => void;
    }

    let { items = $bindable([]), onchange }: Props = $props();

    let draggedIndex = $state<number | null>(null);
    let errors = $state<Map<string, string>>(new Map());

    // Валидация строки
    function validateItem(value: string): ValidationResult {
        if (value.includes('-') || value.includes('+')) {
            return {
                isValid: false,
                error: 'Строка не должна содержать символы "-" или "+"'
            };
        }
        return { isValid: true };
    }

    // Обработка изменения значения
    function handleInput(id: string, newValue: string) {
        const validation = validateItem(newValue);
        
        if (!validation.isValid) {
            errors.set(id, validation.error!);
            return;
        }
        
        // Удаляем ошибку если она была
        errors.delete(id);
        
        // Обновляем значение
        items = items.map(item => 
            item.id === id ? { ...item, value: newValue } : item
        );
        
        // Вызываем callback для сохранения
        onchange?.(items);
    }

    // Добавление нового элемента
    function addItem() {
        const newItem: ListItem = {
            id: crypto.randomUUID(),
            value: ''
        };
        items = [...items, newItem];
        onchange?.(items);
    }

    // Удаление элемента
    function removeItem(id: string) {
        items = items.filter(item => item.id !== id);
        errors.delete(id);
        onchange?.(items);
    }

    // Drag & Drop функционал
    function handleDragStart(event: DragEvent, index: number) {
        draggedIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDrop(event: DragEvent, targetIndex: number) {
        event.preventDefault();
        
        if (draggedIndex === null || draggedIndex === targetIndex) {
            return;
        }

        const newItems = [...items];
        const [draggedItem] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);
        
        items = newItems;
        draggedIndex = null;
        
        onchange?.(items);
    }

    function handleDragEnd() {
        draggedIndex = null;
    }
</script>

<div class="dynamic-list">
    <div class="list-items" role="list">
        {#each items as item, index (item.id)}
            <div 
                class="list-item"
                class:dragging={draggedIndex === index}
                draggable="true"
                role="listitem"
                aria-label="Элемент списка {index + 1}"
                ondragstart={(e) => handleDragStart(e, index)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, index)}
                ondragend={handleDragEnd}
            >
                <div 
                    class="drag-handle" 
                    title="Перетащите для изменения порядка"
                    role="button"
                    tabindex="0"
                    aria-label="Переместить элемент"
                >
                    ⋮⋮
                </div>
                
                <div class="input-wrapper">
                    <input
                        type="text"
                        value={item.value}
                        oninput={(e) => handleInput(item.id, e.currentTarget.value)}
                        class:invalid={errors.has(item.id)}
                        placeholder="Введите значение..."
                        aria-invalid={errors.has(item.id)}
                        aria-describedby={errors.has(item.id) ? `error-${item.id}` : undefined}
                    />
                    {#if errors.has(item.id)}
                        <div 
                            class="error-message" 
                            id="error-{item.id}"
                            role="alert"
                        >
                            {errors.get(item.id)}
                        </div>
                    {/if}
                </div>
                
                <button
                    class="delete-btn"
                    onclick={() => removeItem(item.id)}
                    title="Удалить"
                    aria-label="Удалить элемент {index + 1}"
                >
                    ✕
                </button>
            </div>
        {/each}
    </div>
    
    <button class="add-btn" onclick={addItem}>
        + Добавить элемент
    </button>
</div>

<style>
    .dynamic-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .list-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .list-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px;
        background: var(--background-secondary);
        border-radius: 4px;
        transition: opacity 0.2s;
    }

    .list-item.dragging {
        opacity: 0.5;
    }

    .drag-handle {
        cursor: grab;
        user-select: none;
        color: var(--text-muted);
        font-weight: bold;
        padding: 4px;
        line-height: 1;
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    .input-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-primary);
        color: var(--text-normal);
    }

    input.invalid {
        border-color: var(--text-error);
        background: var(--background-primary-alt);
    }

    .error-message {
        color: var(--text-error);
        font-size: 0.85em;
        padding: 0 4px;
    }

    .delete-btn {
        padding: 4px 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-muted);
        font-size: 18px;
        line-height: 1;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .delete-btn:hover {
        background: var(--background-modifier-error);
        color: var(--text-error);
    }

    .add-btn {
        padding: 8px 16px;
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: opacity 0.2s;
    }

    .add-btn:hover {
        opacity: 0.8;
    }
</style>
