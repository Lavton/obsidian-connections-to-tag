import type { App, TFile } from "obsidian"
import type { Connection } from "src/models/connections"
import { getBackwardFilesFromFronmatter, getFilesInFrontmatter, getForwardFilesFromFrontmatter } from "src/utils"
import type { ConnectionTypeDescriptor } from "./factory";

export class YamlTagConnection implements Connection {
	readonly type = 'yaml-tag';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const uniqueFilesMap = new Map<string, TFile>();
		const filesByTag = getFilesInFrontmatter(app, node)

		this.tags.forEach(tag => {
			filesByTag[tag]?.forEach(file => {
				uniqueFilesMap.set(file.path, file);
			});
		});

		return Array.from(uniqueFilesMap.values());
	}
	tags: string[]
	constructor(tags: string[]) {
		this.tags = tags
	}
}

// Враппер для YamlTagConnection
// export class YamlTagConnectionWrapper implements Connection {
//     __type = 'yaml-tag'; // внутреннее поле для идентификации
//     private instance: YamlTagConnection;

//     constructor(tags: string[]) {
//         this.instance = new YamlTagConnection(tags);
//     }

//     get_connected(app: App, node: TFile): Promise<TFile[]> {
//         return this.instance.get_connected(app, node);
//     }

//     getTags(): string[] {
//         return this.instance.tags;
//     }
// }

// Дескриптор - единственное место где определяется тип
export const YamlTagConnectionDescriptor: ConnectionTypeDescriptor<{
    type: 'yaml-tag';
    tags: string[];
}> = {
    type: 'yaml-tag',
    
    createInstance(config) {
        return new YamlTagConnection(config.tags);
    },
    
    createConfig(instance) {
        const wrapper = instance as YamlTagConnection;
        return {
            type: 'yaml-tag',
            tags: wrapper.tags
        };
    }
};

// Регистрируем тип
// connectionRegistry.register(YamlTagConnectionDescriptor);
