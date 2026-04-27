import type { Connection } from "src/connections/connections"
import type { NewRule, NewRuleFactory, RuleConfig } from "../new_rule"
import type {RuleTypeDescriptor} from '../rule_factory'
import ToTheEndRuleEditor from "./ToTheEndRuleEditor.svelte"

export class RuleToTheEnd implements NewRule {
	connection: Connection

	constructor(connection: Connection) {
		this.connection = connection
	}

	async needToGo(): Promise<boolean> {
		return true
    }

    async go(): Promise<RuleToTheEnd> {
		return this
    }
}

export class FactoryRuleToTheEnd implements NewRuleFactory {
	readonly type = "to-the-end"
	title: string
	connection: Connection

	constructor(title: string, connection: Connection) {
		this.title = title
		this.connection = connection
	}

    getRule(): RuleToTheEnd {
		return new RuleToTheEnd(this.connection)
    }
}
export class ToTheEndConfig implements RuleConfig {
    readonly type="to-the-end"
    title: string
    connectionTitle: string
    constructor (title: string, connectionTitle: string) {
        this.title = title
        this.connectionTitle = connectionTitle
    }
}

export const ToTheEndRuleDescriptor: RuleTypeDescriptor<ToTheEndConfig> = {
    type: 'to-the-end',
    label: "go to the end",
    createInstance(config: ToTheEndConfig, connection: Connection): NewRuleFactory {
        return new FactoryRuleToTheEnd(config.title, connection)
    },
    createConfig(instance: NewRuleFactory): ToTheEndConfig {
        return new ToTheEndConfig(instance.title, instance.connection.title)
    },
    createDefaultConfig(): ToTheEndConfig {
        return new ToTheEndConfig("", "")
    },
    editorComponent: ToTheEndRuleEditor,
    validateLocalRules: [],
    validateAboveRules: []
}
