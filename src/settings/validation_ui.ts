import type { Issue, IssueCode } from "./types";

const issueMessages: Record<IssueCode, (issue: Issue) => string> = {
	field_empty: () => "Введите значение.",
	required_type: () => "Выберите тип.",
	forbitten_pm: () =>
		"Недопустимо использовать « + » или « - » с пробелами.",
	duplicate_with_prev: () =>
		"Название совпадает с одним из элементов выше.",
	file_not_exists: () =>
		"Файл не найден.",
	connections_not_exists: (issue) =>
		`Не найдены связи выше: ${formatIssueList(issue.params?.titles)}.`,
	yaml_keys_not_exists: (issue) =>
		`Не найдены YAML-ключи: ${formatIssueList(issue.params?.tags)}.`,
	probability_integer: () =>
		"Поле должно быть целым числом.",
	probability_range: () =>
		"Число должно быть от 0 до 100.",
	n_steps_integer: () =>
		"Поле должно быть целым числом.",
	n_steps_range: () =>
		"Число должно быть от 0.",
};

function formatIssueList(value: unknown): string {
	if (!Array.isArray(value)) {
		return "неизвестно";
	}
	const normalized = value
		.map((item) => String(item).trim())
		.filter(Boolean);
	return normalized.length > 0 ? normalized.join(", ") : "неизвестно";
}

export function issueToText(issue: Issue): string {
	return issueMessages[issue.code]?.(issue) ?? "Некорректное значение.";
}
