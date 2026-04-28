import type { Connection } from "src/connections/connections";
import type { Issue, ValidationAboveRule, ValidationLocalRule } from "src/settings/types";
import type { NewRuleFactory, RuleConfig } from "src/rules/new_rule";
import type { Component } from "svelte";

export interface RuleEditorProps<TConfig extends RuleConfig = RuleConfig> {
	value: TConfig;
	onchange: (updated: TConfig, touchedPath?: string) => void;
	issues?: (Issue & { scope: "local" | "above" })[];
	shouldShowIssues?: (path: string) => boolean;
}

type AnyDescriptor = RuleTypeDescriptor<any>;

// Type descriptor: keeps everything for a type in one place.
export interface RuleTypeDescriptor<TConfig extends RuleConfig = RuleConfig> {
	type: string;
	label: string; // Human-readable name for <select>.
	description: string;
	createInstance(config: TConfig, connection: Connection): NewRuleFactory;
	createConfig(instance: NewRuleFactory): TConfig;
	createDefaultConfig(): TConfig; // Needed when switching the type.
	editorComponent: Component<RuleEditorProps<TConfig>>;
	validateLocalRules: ValidationLocalRule<TConfig>[];
	validateAboveRules: ValidationAboveRule<TConfig>[];
}

// Registry of all types.
export class RuleRegistry {
	private descriptors = new Map<string, AnyDescriptor>();

	register<TConfig extends RuleConfig>(descriptor: RuleTypeDescriptor<TConfig>): RuleRegistry {
		this.descriptors.set(descriptor.type, descriptor);
		return this;
	}

	fromConfig(config: RuleConfig, connections: Connection[]): NewRuleFactory {
		const descriptor = this.descriptors.get(config.type);
		if (!descriptor) {
			throw new Error(`Unknown rule type: ${config.type}`);
		}
		const connection = this.findConnection(config, connections);
		return descriptor.createInstance(config, connection);
	}

	toConfig(instance: NewRuleFactory): RuleConfig {
		const descriptor = this.descriptors.get(instance.type);
		if (!descriptor) {
			throw new Error(`Unknown rule type: ${instance.type}`);
		}
		return descriptor.createConfig(instance);
	}

	get(type: string): RuleTypeDescriptor | undefined {
		return this.descriptors.get(type);
	}

	// Convenient for <select>.
	all(): RuleTypeDescriptor[] {
		return Array.from(this.descriptors.values());
	}

	private findConnection(config: RuleConfig, connections: Connection[]): Connection {
		const connection = connections.find(conn => conn.title === config.connectionTitle);
		if (!connection) {
			throw new Error(`Unknown connection title for rule '${config.title}': ${config.connectionTitle}`);
		}
		return connection;
	}
}
