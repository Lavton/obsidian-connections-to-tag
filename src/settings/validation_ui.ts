import type { Issue, IssueCode } from "./types";

const issueMessages: Record<IssueCode, (issue: Issue) => string> = {
	required_title: () => "Введите значение.",
	required_type: () => "Выберите тип.",
	forbitten_pm: () =>
		"Недопустимо использовать « + » или « - » с пробелами.",
	duplicate_with_prev: () =>
		"Название совпадает с одним из элементов выше.",
	filepath_empty: () =>
		"Поле пустое.",
	file_not_exists: () =>
		"Файл не найден.",
	to_find_empty: () =>
		"Поле пустое.",
	connections_empty: () =>
		"Поле пустое.",
	connections_not_exists: (issue) =>
		`Не найдены связи выше: ${formatIssueList(issue.params?.titles)}.`,
	yaml_tags_empty: () =>
		"Поле пустое.",
	yaml_keys_not_exists: (issue) =>
		`Не найдены YAML-ключи: ${formatIssueList(issue.params?.tags)}.`,
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
