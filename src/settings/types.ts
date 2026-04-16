export type ConnectionConfig = {
	readonly type: string
	title: string
};
export type DirectionalConnection = ConnectionConfig & { direction: "forward" | "backward" }

export function emptyConnectionConfig(): ConnectionConfig {
  return { type: "", title: "" };
}

export interface DragNDropProps {
	moveUp?: () => void;
	moveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}

export type IssueCode = string;
export type Issue = {
	code: IssueCode;
	path?: string;                 // например "title"
	params?: Record<string, unknown>; // например { value: "abc" }
};

export type ValidationResult = {
	valid: boolean;
	issues: Issue[];
};
export type ScopeValidationResult = {
	local: ValidationResult | null,
	above: ValidationResult | null,
}
// @deprecated
export type ListCtx<T> = {
	index: number;
	items: T[];
};

// @deprecated
export type ValidationRule<T> = {
	scope: "local" | "above";
	run: (item: T, ctx: ListCtx<T | undefined>) => Issue | null | Promise<Issue | null>;
};

export type ValidationLocalRule<T> = {
	run: (item: T) => Issue | null | Promise<Issue | null>;
};
export type ValidationAboveRule<T> = {
	run: (item: T, elementsAbove: string[]) => Issue | null | Promise<Issue | null>;
}

// export type ConnectionCtx = ListCtx<ConnectionConfig>

export type RowState<T> = {
	id: string;
	saved: T | undefined;
	draft: T;
	meta: {
		touched: boolean,
		dirty: boolean;
		valid: boolean;
		issues: (Issue & { scope: "local" | "above" })[];
	};
}

const cloneConn = (x: DirectionalConnection): DirectionalConnection => ({ ...x });

export function toRowStates(items: DirectionalConnection[]): RowState<DirectionalConnection>[] {
	return items.map((item, i) => ({
		id: crypto.randomUUID?.() ?? `row-${i}-${Math.random().toString(16).slice(2)}`,
		saved: cloneConn(item),
		draft: cloneConn(item),
		meta: {
			touched: false,
			dirty: false,
			valid: true,
			issues: []
		}
	}));
}
export function emptyRowState(): RowState<DirectionalConnection> {
	const c: DirectionalConnection = {...emptyConnectionConfig(), direction: "forward"}
	const rs = toRowStates([c])[0]
	rs.saved = undefined
	return rs
}

export function fromRowStates(rows: RowState<DirectionalConnection>[]): DirectionalConnection[] {
	// Обычно отдаём "saved" или "draft" — зависит от UX.
	// Чаще в onchange надо отправлять итоговый актуальный state (draft).
	return rows
		.map(r => r.saved)
		.filter((v): v is DirectionalConnection => v !== undefined)
		.map(v => cloneConn(v));
}
