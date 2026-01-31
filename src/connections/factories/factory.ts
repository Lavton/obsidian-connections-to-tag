import type { Connection } from "src/models/connections";


// Дескриптор типа - связывает всё в одном месте
export interface ConnectionTypeDescriptor<TConfig = any> {
    type: string;
    createInstance(config: TConfig): Connection;
    createConfig(instance: Connection): TConfig;
}

// Реестр всех типов
export class ConnectionRegistry {
    private descriptors = new Map<string, ConnectionTypeDescriptor>();

    register<TConfig>(descriptor: ConnectionTypeDescriptor<TConfig>): ConnectionRegistry {
        this.descriptors.set(descriptor.type, descriptor);
		return this
    }

    fromConfig(config: { type: string }): Connection {
        const descriptor = this.descriptors.get(config.type);
        if (!descriptor) {
            throw new Error(`Unknown connection type: ${config.type}`);
        }
        return descriptor.createInstance(config);
    }

    toConfig(instance: Connection): any {
        const descriptor = this.descriptors.get(instance.type);
        if (!descriptor) {
            throw new Error(`Unknown connection type: ${instance.type}`);
        }
        return descriptor.createConfig(instance);
    }
}

// export const connectionRegistry = new ConnectionRegistry();
