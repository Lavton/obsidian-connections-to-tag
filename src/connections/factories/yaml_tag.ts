import type { App, TFile } from "obsidian"
import type { Connection } from "src/models/connections"
import { getBackwardFilesFromFronmatter, getFilesInFrontmatter, getForwardFilesFromFrontmatter } from "src/utils"
import type { ConnectionTypeDescriptor } from "./factory";
import YamlTagConnectionEditor from "./YamlTagConnectionEditor.svelte";
import type { ConnectionConfig } from "src/settings/types";

export class YamlTagConnection implements Connection {
	readonly type = 'yaml-tag';
    title: string;
	readonly locality = 'local'
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
	constructor(title: string, tags: string[]) {
		this.title = title
		this.tags = tags
	}
}


export class YamlTagConnConfig implements ConnectionConfig {
    type: 'yaml-tag';
    title: string;
    tags: string[];
}

// Дескриптор - единственное место где определяется тип
export const YamlTagConnectionDescriptor: ConnectionTypeDescriptor<YamlTagConnConfig> = {
	type: 'yaml-tag',

	createInstance(config) {
		return new YamlTagConnection(config.title, config.tags);
	},

	createConfig(instance) {
		const wrapper = instance as YamlTagConnection;
		return {
			title: wrapper.title,
			type: wrapper.type,
			tags: wrapper.tags
		};
	},
	label: "YAML tags",
	editorComponent: YamlTagConnectionEditor,
	createDefaultConfig() {
        return { type: 'yaml-tag', title: '', tags: [] };
    },
};

// Регистрируем тип
// connectionRegistry.register(YamlTagConnectionDescriptor);


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