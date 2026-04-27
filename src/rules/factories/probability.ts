
import type { Connection } from "src/connections/connections"
import type { NewRule, NewRuleFactory, RuleConfig } from "../new_rule"
import type {RuleTypeDescriptor} from '../rule_factory'
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
	probability: number

	constructor(title: string, connectionTitle: string, probability: number) {
		this.title = title
		this.connectionTitle = connectionTitle
		this.probability = probability
	}
}

export const ProbabilityRuleDescriptor: RuleTypeDescriptor<ProbabilityConfig> = {
	type: "probability",
	label: "probability",
	createInstance(config: ProbabilityConfig, connection: Connection): NewRuleFactory {
		return new FactoryRuleProbability(config.title, connection, config.probability)
	},
	createConfig(instance: NewRuleFactory): ProbabilityConfig {
		const rule = instance as FactoryRuleProbability
		return new ProbabilityConfig(rule.title, rule.connection.title, rule.probability)
	},
	createDefaultConfig(): ProbabilityConfig {
		return new ProbabilityConfig("", "", 0.5)
	},
	editorComponent: ProbabilityRuleEditor,
	validateLocalRules: [],
	validateAboveRules: []
}
