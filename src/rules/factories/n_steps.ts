import type { Connection } from "src/connections/connections"
import type { Rule, RuleFactory, RuleConfig } from "../rule"
import type {RuleTypeDescriptor} from '../rule_factory'
import type { ValidationLocalRule } from "src/settings/types"
import NStepsRuleEditor from "./NStepsRuleEditor.svelte"

export class RuleNSteps implements Rule {
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

export class FactoryRuleNSteps implements RuleFactory {
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
	total_steps: number | string

	constructor(title: string, connectionTitle: string, total_steps: number | string) {
		this.title = title
		this.connectionTitle = connectionTitle
		this.total_steps = total_steps
	}
}

function getTotalSteps(item: NStepsConfig): number | null {
	if (typeof item.total_steps === "string") {
		if (!item.total_steps.trim()) {
			return null;
		}
		return Number(item.total_steps);
	}
	return item.total_steps;
}

function validateNStepsNotEmpty(item: NStepsConfig) {
	if (typeof item.total_steps === "string" && !item.total_steps.trim()) {
		return { code: "field_empty", path: "total_steps" };
	}
	return null;
}

function validateNStepsInteger(item: NStepsConfig) {
	const totalSteps = getTotalSteps(item);
	if (totalSteps === null) {
		return null;
	}
	if (!Number.isInteger(totalSteps)) {
		return { code: "n_steps_integer", path: "total_steps" };
	}
	return null;
}

function validateNStepsRange(item: NStepsConfig) {
	const totalSteps = getTotalSteps(item);
	if (totalSteps === null) {
		return null;
	}
	if (totalSteps < 0) {
		return { code: "n_steps_range", path: "total_steps" };
	}
	return null;
}

export const NStepsRuleDescriptor: RuleTypeDescriptor<NStepsConfig> = {
	type: "n-steps",
	label: "N steps",
	description: "Follows the connection for N steps from the start, then stops.",
	createInstance(config: NStepsConfig, connection: Connection): RuleFactory {
		return new FactoryRuleNSteps(config.title, connection, Number(config.total_steps))
	},
	createConfig(instance: RuleFactory): NStepsConfig {
		const rule = instance as FactoryRuleNSteps
		return new NStepsConfig(rule.title, rule.connection.title, rule.total_steps)
	},
	createDefaultConfig(): NStepsConfig {
		return new NStepsConfig("", "", 1)
	},
	editorComponent: NStepsRuleEditor,
	validateLocalRules: [
		{ run: validateNStepsNotEmpty },
		{ run: validateNStepsInteger },
		{ run: validateNStepsRange },
	] satisfies ValidationLocalRule<NStepsConfig>[],
	validateAboveRules: []
}
