import type { Issue, IssueCode } from "./types";

const issueMessages: Record<IssueCode, (issue: Issue) => string> = {
	field_empty: () => "Enter a value.",
	required_type: () => "Select a type.",
	forbitten_pm: () =>
		"Using \" + \" or \" - \" with spaces is not allowed.",
	duplicate_with_prev: () =>
		"The title matches one of the items above.",
	file_not_exists: () =>
		"File not found.",
	connections_not_exists: (issue) =>
		`Connections above not found: ${formatIssueList(issue.params?.titles)}.`,
	connection_title_not_found: () =>
		"No connection with this title was found.",
	yaml_keys_not_exists: (issue) =>
		`YAML keys not found: ${formatIssueList(issue.params?.tags)}.`,
	probability_integer: () =>
		"The field must be an integer.",
	probability_range: () =>
		"The number must be from 0 to 100.",
	n_steps_integer: () =>
		"The field must be an integer.",
	n_steps_range: () =>
		"The number must be at least 0.",
};

function formatIssueList(value: unknown): string {
	if (!Array.isArray(value)) {
		return "unknown";
	}
	const normalized = value
		.map((item) => String(item).trim())
		.filter(Boolean);
	return normalized.length > 0 ? normalized.join(", ") : "unknown";
}

export function issueToText(issue: Issue): string {
	return issueMessages[issue.code]?.(issue) ?? "Invalid value.";
}
