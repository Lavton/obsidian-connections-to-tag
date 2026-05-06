import type { Connection } from "src/connections/connections"

export interface RuleFactory {
	readonly type: string;
	getRule(): Rule 
	title: string;
	connection: Connection;
}

export interface Rule {
	needToGo(): Promise<boolean>
	go(): Promise<Rule>
	connection: Connection
}
export type RuleConfig = {
	readonly type: string
	title: string
	connectionTitle: string
};

export function emptyRuleConfig(): RuleConfig {
	return { type: "", title: "", connectionTitle: "" };
}
