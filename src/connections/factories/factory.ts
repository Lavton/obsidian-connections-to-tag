import { BackwardConnection, type Connection } from "src/models/connections";


// Дескриптор типа - связывает всё в одном месте
export interface ConnectionTypeDescriptor<TConfig = any> {
    type: string;
    createInstance(config: TConfig, above_connections: Connection[]): Connection;
    createConfig(instance: Connection): TConfig;
}

// Реестр всех типов
export class ConnectionRegistry {
    private descriptors = new Map<string, ConnectionTypeDescriptor>();

    register<TConfig>(descriptor: ConnectionTypeDescriptor<TConfig>): ConnectionRegistry {
        this.descriptors.set(descriptor.type, descriptor);
		return this
    }

    fromConfig(config: { type: string, direction: "forward" | "backward" }, above_connections: Connection[]): Connection {
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

    toConfig(instance: Connection): any {
		let direction = ""
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
}

// export const connectionRegistry = new ConnectionRegistry();
