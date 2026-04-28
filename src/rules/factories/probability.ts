
import type { Connection } from "src/connections/connections"
import type { NewRule, NewRuleFactory, RuleConfig } from "../new_rule"
import type {RuleTypeDescriptor} from '../rule_factory'
import type { ValidationLocalRule } from "src/settings/types"
import ProbabilityRuleEditor from "./ProbabilityRuleEditor.svelte"

export class RuleProbability implements NewRule {
	connection: Connection
	probability: number 

	constructor(connection: Connection, probability: number) {
		this.connection = connection
        this.probability = probability
	}

	async needToGo(): Promise<boolean> {
		return Math.random() < this.probability;
    }

    async go(): Promise<RuleProbability> {
		return this
    }
}

export class FactoryRuleProbability implements NewRuleFactory {
	readonly type = "probability"
	title: string
	connection: Connection
	probability: number

	constructor(title: string, connection: Connection, probability: number) {
		this.title = title
		this.connection = connection
		this.probability = probability
	}

	getRule(): RuleProbability {
		return new RuleProbability(this.connection, this.probability)
	}
}

export class ProbabilityConfig implements RuleConfig {
	readonly type = "probability"
	title: string
	connectionTitle: string
	probability: number | string

	constructor(title: string, connectionTitle: string, probability: number | string) {
		this.title = title
		this.connectionTitle = connectionTitle
		this.probability = probability
	}
}

function getProbabilityPercent(item: ProbabilityConfig): number | null {
	if (typeof item.probability === "string") {
		if (!item.probability.trim()) {
			return null;
		}
		return Number(item.probability);
	}
	return item.probability * 100;
}

function validateProbabilityNotEmpty(item: ProbabilityConfig) {
	if (typeof item.probability === "string" && !item.probability.trim()) {
		return { code: "field_empty", path: "probability" };
	}
	return null;
}

function validateProbabilityInteger(item: ProbabilityConfig) {
	const probabilityPercent = getProbabilityPercent(item);
	if (probabilityPercent === null) {
		return null;
	}
	if (!Number.isInteger(probabilityPercent)) {
		return { code: "probability_integer", path: "probability" };
	}
	return null;
}

function validateProbabilityRange(item: ProbabilityConfig) {
	const probabilityPercent = getProbabilityPercent(item);
	if (probabilityPercent === null) {
		return null;
	}
	if (probabilityPercent < 0 || probabilityPercent > 100) {
		return { code: "probability_range", path: "probability" };
	}
	return null;
}

export const ProbabilityRuleDescriptor: RuleTypeDescriptor<ProbabilityConfig> = {
	type: "probability",
	label: "probability",
	createInstance(config: ProbabilityConfig, connection: Connection): NewRuleFactory {
		return new FactoryRuleProbability(config.title, connection, Number(config.probability))
	},
	createConfig(instance: NewRuleFactory): ProbabilityConfig {
		const rule = instance as FactoryRuleProbability
		return new ProbabilityConfig(rule.title, rule.connection.title, rule.probability)
	},
	createDefaultConfig(): ProbabilityConfig {
		return new ProbabilityConfig("", "", 0.5)
	},
	editorComponent: ProbabilityRuleEditor,
	validateLocalRules: [
		{ run: validateProbabilityNotEmpty },
		{ run: validateProbabilityInteger },
		{ run: validateProbabilityRange },
	] satisfies ValidationLocalRule<ProbabilityConfig>[],
	validateAboveRules: []
}
