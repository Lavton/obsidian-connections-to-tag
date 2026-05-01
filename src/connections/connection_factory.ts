import { BackwardConnection, type Connection } from "src/connections/connections";
import type { ConnectionConfig, DirectionalConnectionConfig } from "src/connections/connections";
import type { Issue, ValidationAboveRule, ValidationLocalRule, ValidationResult } from "src/settings/types";
import type { Component } from 'svelte';

export interface ConnectionEditorProps<TConfig extends ConnectionConfig = ConnectionConfig> {
    value: TConfig;
    onchange: (updated: TConfig, touchedPath?: string) => void;
    issues?: (Issue & { scope: "local" | "above" })[];
    shouldShowIssues?: (path: string) => boolean;
}
type AnyDescriptor = ConnectionTypeDescriptor<any>;
// Type descriptor: keeps everything for a type in one place.
export interface ConnectionTypeDescriptor<TConfig extends ConnectionConfig = ConnectionConfig> {
    type: string;
    label: string; // Human-readable name for <select>.
    description: string;
    createInstance(config: TConfig, above_connections: Connection[]): Connection;
    createConfig(instance: Connection): TConfig;
    createDefaultConfig(): TConfig; // Needed when switching the type.
    editorComponent: Component<ConnectionEditorProps<TConfig>>;
	validateLocalRules: ValidationLocalRule<TConfig>[],
	validateAboveRules: ValidationAboveRule<TConfig>[],

}

// Registry of all types.
export class ConnectionRegistry {
    private descriptors = new Map<string, AnyDescriptor>();

    register<TConfig extends ConnectionConfig>(descriptor: ConnectionTypeDescriptor<TConfig>): ConnectionRegistry {
        this.descriptors.set(descriptor.type, descriptor);
		return this
    }

    fromConfig(config: DirectionalConnectionConfig, above_connections: Connection[]): Connection {
        const descriptor = this.descriptors.get(config.type);
        if (!descriptor) {
            throw new Error(`Unknown connection type: ${config.type}`);
        }
        const connection = descriptor.createInstance(config, above_connections);
		if (config.direction === "backward") {
			return new BackwardConnection(connection)
		}
		return connection
    }

    toConfig(instance: Connection): (DirectionalConnectionConfig) {
		let direction: "forward" | "backward";
		if (instance instanceof BackwardConnection) {
			direction = "backward"
			instance = instance.real_connection
		} else {
			direction = "forward"
		}
        const descriptor = this.descriptors.get(instance.type);
        if (!descriptor) {
            throw new Error(`Unknown connection type: ${instance.type}`);
        }
		const baseConfig = descriptor.createConfig(instance);
		return { ...baseConfig, direction };
    }

    get(type: string): ConnectionTypeDescriptor | undefined {
        return this.descriptors.get(type);
    }

    // Convenient for <select>.
    all(): ConnectionTypeDescriptor[] {
        return Array.from(this.descriptors.values());
    }
}

// export const connectionRegistry = new ConnectionRegistry();
