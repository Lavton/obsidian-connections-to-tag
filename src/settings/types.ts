export interface ListItem {
	id: string;
	value: string;
	// Здесь в будущем можно добавить другие поля:
	// description?: string;
	// enabled?: boolean;
	// color?: string;
}

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}
