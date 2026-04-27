import type { Connection } from "src/connections/connections"
import type { NewRule, NewRuleFactory, RuleConfig } from "../new_rule"
import type {RuleTypeDescriptor} from '../rule_factory'
import NStepsRuleEditor from "./NStepsRuleEditor.svelte"

export class RuleNSteps implements NewRule {
	connection: Connection
	steps_left: number 

	constructor(connection: Connection, steps_left: number) {
		this.connection = connection
		this.steps_left = steps_left
	}

	async needToGo(): Promise<boolean> {
		return this.steps_left > 0
    }

    async go(): Promise<RuleNSteps> {
		return new RuleNSteps(this.connection, this.steps_left-1)
    }
}

export class FactoryRuleNSteps implements NewRuleFactory {
	readonly type = "n-steps"
	title: string
	connection: Connection
	total_steps: number

	constructor(title: string, connection: Connection, total_steps: number) {
		this.title = title
		this.connection = connection
		this.total_steps = total_steps
	}

	getRule(): RuleNSteps {
		return new RuleNSteps(this.connection, this.total_steps)
	}
}

export class NStepsConfig implements RuleConfig {
	readonly type = "n-steps"
	title: string
	connectionTitle: string
	total_steps: number

	constructor(title: string, connectionTitle: string, total_steps: number) {
		this.title = title
		this.connectionTitle = connectionTitle
		this.total_steps = total_steps
	}
}

export const NStepsRuleDescriptor: RuleTypeDescriptor<NStepsConfig> = {
	type: "n-steps",
	label: "N steps",
	createInstance(config: NStepsConfig, connection: Connection): NewRuleFactory {
		return new FactoryRuleNSteps(config.title, connection, config.total_steps)
	},
	createConfig(instance: NewRuleFactory): NStepsConfig {
		const rule = instance as FactoryRuleNSteps
		return new NStepsConfig(rule.title, rule.connection.title, rule.total_steps)
	},
	createDefaultConfig(): NStepsConfig {
		return new NStepsConfig("", "", 1)
	},
	editorComponent: NStepsRuleEditor,
	validateLocalRules: [],
	validateAboveRules: []
}
