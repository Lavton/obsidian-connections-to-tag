import { App, FuzzySuggestModal } from "obsidian";
import type { NewRuleFactory } from "src/rules/new_rule";

class RuleFactorySuggestModal extends FuzzySuggestModal<NewRuleFactory> {
	private resolved = false;

	constructor(
		app: App,
		private readonly rules: NewRuleFactory[],
		private readonly resolveSelection: (ruleFactory: NewRuleFactory | null) => void,
	) {
		super(app);
		this.setPlaceholder("Select rule");
		this.emptyStateText = "No rules found";
	}

	getItems(): NewRuleFactory[] {
		return this.rules;
	}

	getItemText(item: NewRuleFactory): string {
		return item.title;
	}

	onChooseItem(item: NewRuleFactory): void {
		this.resolve(item);
		this.close();
	}

	onClose(): void {
		window.setTimeout(() => this.resolve(null), 0);
	}

	private resolve(ruleFactory: NewRuleFactory | null): void {
		if (this.resolved) {
			return;
		}
		this.resolved = true;
		this.resolveSelection(ruleFactory);
	}
}

export function selectRuleFactory(app: App, rules: NewRuleFactory[]): Promise<NewRuleFactory | null> {
	return new Promise((resolve) => {
		new RuleFactorySuggestModal(app, rules.filter((rule) => !rule.title.startsWith("_")), resolve).open();
	});
}
