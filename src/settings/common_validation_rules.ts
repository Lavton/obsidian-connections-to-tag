import type { ConnectionConfig } from "src/connections/connections";
import type { RuleConfig } from "src/rules/new_rule";
import type { ValidationAboveRule, ValidationLocalRule } from "./types";

export const ruleTitleRequired: ValidationLocalRule<ConnectionConfig> = {
	run: (item) => {
		if (item.title.trim() === "") return { code: "field_empty", path: "title" };
		return null;
	},
}
export const ruleTypeRequired: ValidationLocalRule<ConnectionConfig> = {
	run: (item) => {
		if (item.type.trim() === "") return { code: "required_type", path: "type" };
		return null;
	},
}
export const ruleConnectionTitleRequired: ValidationLocalRule<RuleConfig> = {
	run: (item) => {
		if (item.connectionTitle.trim() === "") return { code: "field_empty", path: "connectionTitle" };
		return null;
	},
}
export function ruleConnectionTitleExists(
	getConnectionTitles: () => string[],
): ValidationLocalRule<RuleConfig> {
	return {
		run: (item) => {
			const connectionTitle = item.connectionTitle.trim();
			if (connectionTitle === "") return null;

			const exists = getConnectionTitles().some(
				(title) => title.trim() === connectionTitle,
			);
			if (!exists) return { code: "connection_title_not_found", path: "connectionTitle" };

			return null;
		},
	};
}
export const ruleNoPlusMinusWithSpaces: ValidationLocalRule<ConnectionConfig> = {
	run: (item) => {
		if (item.title.includes(" + ") || item.title.includes(" - ")) {
			return { code: "forbitten_pm", path: "title" };
		}
		if (item.title.endsWith(" +") || item.title.endsWith(" -")) {
			return { code: "forbitten_pm", path: "title" };
		}
		if (item.title.startsWith("+ ") || item.title.startsWith("+ ")) {
			return { code: "forbitten_pm", path: "title" };
		}
		return null;
	},
}

export const ruleNotEqual: ValidationAboveRule<ConnectionConfig> = {
	run: (item, ctx: string[]) => {

	for (let i = 0; i < ctx.length; i++) {
		const x = ctx[i];
		if (x == undefined) continue;
		if (x.trim() == item.title.trim()) {
			return { code: "duplicate_with_prev", path: "title", params: {"num": i}}
		}
	}
	return null;
	},
};
