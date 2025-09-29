import type { Connection } from "./connections";
import type { RuleFactory } from "./rule";

export class Chain {
	chainSteps: ChainStep[]
}

export class ChainStep {
	rule: RuleFactory
	connections: Connection[]
}
