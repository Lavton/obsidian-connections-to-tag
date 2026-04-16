import type { ConnectionConfig, ValidationAboveRule, ValidationLocalRule } from "./types";

export const ruleTitleRequired: ValidationLocalRule<ConnectionConfig> = {
	run: (item) => {
		if (item.title.trim() === "") return { code: "required_title", path: "title" };
		return null;
	},
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
