import type { Connection } from "./connections";
import type { RuleFactory } from "./rule";

export class Chain {
	chainSteps: ChainStep[]

	constructor(chainSteps: ChainStep[] = []) {
		this.chainSteps = chainSteps
	}
}

export class ChainStep {
	rule: RuleFactory
	connections: Connection[]

	constructor(rule: RuleFactory, connections: Connection[] = []) {
		this.rule = rule
		this.connections = connections
	}
}
