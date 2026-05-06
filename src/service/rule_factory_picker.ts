import { App, FuzzySuggestModal } from "obsidian";
import type { RuleFactory } from "src/rules/rule";

class RuleFactorySuggestModal extends FuzzySuggestModal<RuleFactory> {
	private resolved = false;

	constructor(
		app: App,
		private readonly rules: RuleFactory[],
		private readonly resolveSelection: (ruleFactory: RuleFactory | null) => void,
	) {
		super(app);
		this.setPlaceholder("Select rule");
		this.emptyStateText = "No rules found";
	}

	getItems(): RuleFactory[] {
		return this.rules;
	}

	getItemText(item: RuleFactory): string {
		return item.title;
	}

	onChooseItem(item: RuleFactory): void {
		this.resolve(item);
		this.close();
	}

	onClose(): void {
		window.setTimeout(() => this.resolve(null), 0);
	}

	private resolve(ruleFactory: RuleFactory | null): void {
		if (this.resolved) {
			return;
		}
		this.resolved = true;
		this.resolveSelection(ruleFactory);
	}
}

export function selectRuleFactory(app: App, rules: RuleFactory[]): Promise<RuleFactory | null> {
	return new Promise((resolve) => {
		new RuleFactorySuggestModal(app, rules.filter((rule) => !rule.title.startsWith("_")), resolve).open();
	});
}
