import type { Connection } from "src/connections/connections";
import type { Rule, RuleFactory, RuleConfig } from "../rule";
import type { RuleTypeDescriptor } from "../rule_factory";
import TrivialRuleEditor from "./TrivialRuleEditor.svelte";

export class TrivialRule implements Rule {
	connection: Connection;

	constructor(connection: Connection) {
		this.connection = connection;
	}

	async needToGo(): Promise<boolean> {
		return false;
	}

	async go(): Promise<TrivialRule> {
		return this;
	}
}

export class FactoryTrivialRule implements RuleFactory {
	readonly type = "trivial-rule";
	title: string;
	connection: Connection;

	constructor(title: string, connection: Connection) {
		this.title = title;
		this.connection = connection;
	}

	getRule(): TrivialRule {
		return new TrivialRule(this.connection);
	}
}

export class TrivialRuleConfig implements RuleConfig {
	readonly type = "trivial-rule";
	title: string;
	connectionTitle: string;

	constructor(title: string, connectionTitle: string) {
		this.title = title;
		this.connectionTitle = connectionTitle;
	}
}

export const TrivialRuleDescriptor: RuleTypeDescriptor<TrivialRuleConfig> = {
	type: "trivial-rule",
	label: "Trivial rule",
	description: "Never follows connected notes (Returns only selected one).",

	createInstance(config: TrivialRuleConfig, connection: Connection): RuleFactory {
		return new FactoryTrivialRule(config.title, connection);
	},

	createConfig(instance: RuleFactory): TrivialRuleConfig {
		return new TrivialRuleConfig(instance.title, instance.connection.title);
	},

	createDefaultConfig(): TrivialRuleConfig {
		return new TrivialRuleConfig("", "");
	},

	editorComponent: TrivialRuleEditor,
	validateLocalRules: [],
	validateAboveRules: [],
};
