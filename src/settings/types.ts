export interface DragNDropProps {
	moveUp?: () => void;
	moveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}

export type IssueCode = string;
export type Issue = {
	code: IssueCode;
	path?: string;                 // for example, "title"
	params?: Record<string, unknown>; // for example, { value: "abc" }
};

export type ValidationResult = {
	valid: boolean;
	issues: Issue[];
};
export type ScopeValidationResult = {
	local: ValidationResult | null,
	above: ValidationResult | null,
}

export type ValidationLocalRule<T> = {
	run: (item: T) => Issue | null | Promise<Issue | null>;
};
export type ValidationAboveRule<T> = {
	run: (item: T, elementsAbove: string[]) => Issue | null | Promise<Issue | null>;
}

export type RowState<T> = {
	id: string;
	saved: T | undefined;
	draft: T;
	meta: {
		touched: boolean,
		touchedPaths: Record<string, boolean>;
		dirty: boolean;
		valid: boolean;
		issues: (Issue & { scope: "local" | "above" })[];
	};
}

function makeRowId(index = 0): string {
	return crypto.randomUUID?.() ?? `row-${index}-${Math.random().toString(16).slice(2)}`;
}

function cloneValue<T>(value: T): T {
	if (Array.isArray(value)) {
		return [...value] as T;
	}
	if (value !== null && typeof value === "object") {
		return { ...value };
	}
	return value;
}

export function toRowStates<T>(
	items: T[],
	clone: (item: T) => T = cloneValue,
): RowState<T>[] {
	return items.map((item, i) => ({
		id: makeRowId(i),
		saved: clone(item),
		draft: clone(item),
		meta: {
			touched: false,
			touchedPaths: {},
			dirty: false,
			valid: true,
			issues: []
		}
	}));
}

export function emptyRowState<T>(
	draft: T,
	clone: (item: T) => T = cloneValue,
): RowState<T> {
	const rs = toRowStates([draft], clone)[0]
	rs.saved = undefined
	return rs
}

export function fromRowStates<T>(
	rows: RowState<T>[],
	clone: (item: T) => T = cloneValue,
): T[] {
	// Usually returns either "saved" or "draft", depending on the UX.
	// In onchange, the final current state (draft) is usually the one to send.
	return rows
		.map(r => r.saved)
		.filter((v): v is T => v !== undefined)
		.map(v => clone(v));
}
