import { BackwardConnection, type Connection } from "src/models/connections";
import type { ConnectionConfig, Issue, ValidationAboveRule, ValidationLocalRule, ValidationResult } from "src/settings/types";
import type { Component } from 'svelte';

export interface ConnectionEditorProps<TConfig extends ConnectionConfig = ConnectionConfig> {
    value: TConfig;
    onchange: (updated: TConfig, touchedPath?: string) => void;
    issues?: (Issue & { scope: "local" | "above" })[];
    shouldShowIssues?: (path: string) => boolean;
}
type AnyDescriptor = ConnectionTypeDescriptor<any>;
// Дескриптор типа - связывает всё в одном месте
export interface ConnectionTypeDescriptor<TConfig extends ConnectionConfig = ConnectionConfig> {
    type: string;
    label: string; // человекочитаемое имя для <select>
    createInstance(config: TConfig, above_connections: Connection[]): Connection;
    createConfig(instance: Connection): TConfig;
    createDefaultConfig(): TConfig; // нужен при смене типа
    editorComponent: Component<ConnectionEditorProps<TConfig>>;
	validateLocalRules: ValidationLocalRule<TConfig>[],
	validateAboveRules: ValidationAboveRule<TConfig>[],

}

// Реестр всех типов
export class ConnectionRegistry {
    private descriptors = new Map<string, AnyDescriptor>();

    register<TConfig extends ConnectionConfig>(descriptor: ConnectionTypeDescriptor<TConfig>): ConnectionRegistry {
        this.descriptors.set(descriptor.type, descriptor);
		return this
    }

    fromConfig(config: ConnectionConfig & { direction: "forward" | "backward" }, above_connections: Connection[]): Connection {
        const descriptor = this.descriptors.get(config.type);
        if (!descriptor) {
            throw new Error(`Unknown connection type: ${config.type}`);
        }
        const connection = descriptor.createInstance(config, above_connections);
		if (config.direction == "forward") {
			return connection
		} else {
			return new BackwardConnection(connection)
		}
    }

    toConfig(instance: Connection): (ConnectionConfig & { direction: "forward" | "backward" }) {
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

    // удобно для <select>
    all(): ConnectionTypeDescriptor[] {
        return Array.from(this.descriptors.values());
    }
}

// export const connectionRegistry = new ConnectionRegistry();
