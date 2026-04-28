import type { App, TFile } from "obsidian";
import type { Connection, ConnectionConfig } from "src/connections/connections";
import type { ValidationAboveRule, ValidationLocalRule, ValidationResult } from "src/settings/types";
import { getFilesInFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "../connection_factory";
import AllYamlConnectionEditor from "./AllYamlConnectionEditor.svelte";

// connections "all links in frontmatter"
export class AllYamlConnection implements Connection {
	readonly type = 'all-yaml';
    title: string;
    readonly locality='local';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const uniqueFilesMap = new Map<string, TFile>();
		const filesByTag = getFilesInFrontmatter(app, node)

		Object.values(filesByTag).forEach(files => {
			files.forEach(file => {
				uniqueFilesMap.set(file.path, file);
			});
		});
		return Array.from(uniqueFilesMap.values());
	}

	constructor(title: string) {
        this.title = title;
    }

}

export class AllYamlConnConfig implements ConnectionConfig {
	readonly type = 'all-yaml';
	title: string;

	constructor(title: string) {
		this.title = title;
	}
}

export const AllYamlConnectionDescriptor: ConnectionTypeDescriptor<AllYamlConnConfig> = {
    type: 'all-yaml',

    createInstance(config) {
        return new AllYamlConnection(config.title);
    },

    createConfig(instance) {
        const connection = instance as AllYamlConnection;
        return {
            type: connection.type,
            title: connection.title
        };
    },

    label: "all links in frontmatter",
    description: "Finds all wiki links in the file frontmatter.",
    editorComponent: AllYamlConnectionEditor,

    createDefaultConfig() {
        return { type: 'all-yaml', title: '' };
    },
	validateLocalRules: [] = [],
	validateAboveRules: [] = [],
};
