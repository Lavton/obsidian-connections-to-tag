import type { ConnectionConfig, ValidationRule } from "./types";

export const ruleTitleRequired: ValidationRule<ConnectionConfig> = {
	scope: "local",
	run: (item) => {
		if (item.title.trim() === "") return { code: "required_title", path: "title" };
		return null;
	},
}
export const ruleNoPlusMinusWithSpaces: ValidationRule<ConnectionConfig> = {
	scope: "local",
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

export const ruleNotEqual: ValidationRule<ConnectionConfig> = {
	scope: "above",
	run: (item, ctx) => {

	for (let i = 0; i < ctx.index; i++) {
		const x = ctx.items[i];
		if (x == undefined) continue;
		if (x.title.trim() == item.title.trim()) {
			return { code: "duplicate_with_prev", path: "title", params: {"num": i}}
		}
	}
	return null;
	},
};
