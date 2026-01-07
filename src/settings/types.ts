
export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

export type ConcreeteConnection = { title: string };

export function emptyConcreeteConnection() { return { title: "" } }

export interface DragNDropProps {
	moveUp?: () => void;
	moveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}

export type RowState<T> = {
	id: string;
	saved: T | undefined;
	draft: T;
	meta: {
		touched: boolean,
		dirty: boolean;      // draft отличается от saved
		valid: boolean;
	};
}

const cloneConn = (x: ConcreeteConnection): ConcreeteConnection => ({ ...x });

export function toRowStates(items: ConcreeteConnection[]): RowState<ConcreeteConnection>[] {
	return items.map((item, i) => ({
		id: crypto.randomUUID?.() ?? `row-${i}-${Math.random().toString(16).slice(2)}`,
		saved: cloneConn(item),
		draft: cloneConn(item),
		meta: {
			touched: false,
			dirty: false,
			valid: true
		}
	}));
}
export function emptyRowState(): RowState<ConcreeteConnection> {
	const c = emptyConcreeteConnection()
	const rs = toRowStates([c])[0]
	rs.meta.valid = false // empty 
	rs.saved = undefined
	return rs
}

export function fromRowStates(rows: RowState<ConcreeteConnection>[]): ConcreeteConnection[] {
	// Обычно отдаём "saved" или "draft" — зависит от UX.
	// Чаще в onchange надо отправлять итоговый актуальный state (draft).
	return rows
		.map(r => r.saved)
		.filter((v): v is ConcreeteConnection => v !== undefined)
		.map(v => cloneConn(v));
}
