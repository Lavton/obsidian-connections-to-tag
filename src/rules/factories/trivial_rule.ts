import type { Connection } from "src/connections/connections";
import type { NewRule, NewRuleFactory, RuleConfig } from "../new_rule";
import type { RuleTypeDescriptor } from "../rule_factory";
import TrivialRuleEditor from "./TrivialRuleEditor.svelte";

export class TrivialRule implements NewRule {
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

export class FactoryTrivialRule implements NewRuleFactory {
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
	description: "Never follows connected notes.",

	createInstance(config: TrivialRuleConfig, connection: Connection): NewRuleFactory {
		return new FactoryTrivialRule(config.title, connection);
	},

	createConfig(instance: NewRuleFactory): TrivialRuleConfig {
		return new TrivialRuleConfig(instance.title, instance.connection.title);
	},

	createDefaultConfig(): TrivialRuleConfig {
		return new TrivialRuleConfig("", "");
	},

	editorComponent: TrivialRuleEditor,
	validateLocalRules: [],
	validateAboveRules: [],
};
