
export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

export interface ConcreeteConnection {
	id: string;
	value: string; // последняя валидная версия
}

export interface DragNDropProps {
	moveUp?: () => void;
	moveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}
