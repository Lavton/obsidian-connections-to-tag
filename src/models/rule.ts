// import type { Entity } from "./entity"

export interface RuleFactory {
	getRule(): Rule 
}

export interface Rule {
	needToGo(): boolean
	go(): void
	// entities: Array<Entity>
	// needToGo(entity: Entity): boolean 
}

// export interface RuleChain {
// 	rules: Rule[];
// }

//////////////////////////////////////////////////////////////////////////////////////
export class RuleToTheEnd implements Rule {
    needToGo(): boolean {
		return true
    }
    go() {
		// pass
    }
}
export class FactoryRuleToTheEnd implements RuleFactory {
    getRule(): RuleToTheEnd {
		return new RuleToTheEnd()
    }
}

export class RuleProbability implements Rule {
    needToGo(): boolean {
		return Math.random() < this.probability;
    }
    go(): void {
		// pass
    }
	probability: number 
	constructor(probability: number) {
		this.probability = probability
	}
}
export class FactoryRuleProbabiloty implements RuleFactory {
    getRule(): RuleProbability {
		return new RuleProbability(this.probability)
    }
	probability: number 
	constructor(probability: number) {
		this.probability = probability
	}
}

export class RuleNSteps implements Rule {
    needToGo(): boolean {
		return this.steps_left > 0
    }
    go(): void {
		this.steps_left -= 1 
    }

	steps_left: number 
	constructor(total_steps: number) {
		this.steps_left = total_steps
	}
}
export class FactoryRuleNSteps implements RuleFactory {
    getRule(): RuleNSteps {
		return new RuleNSteps(this.total_steps)
    }
	total_steps: number
	constructor(total_steps: number) {
		this.total_steps = total_steps
	}
}
