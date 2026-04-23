import type { App, TFile } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection } from "src/connections/connections";
import { removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "../factory";
import AllInTextConnectionEditor from "./AllInTextConnectionEditor.svelte";
import type { ConnectionConfig, ValidationAboveRule, ValidationLocalRule, ValidationResult } from "src/settings/types";

// "all links that are in the text of the note, not in the frontmatter
export class AllInTextConnection implements Connection {
	readonly type = 'all-in-text';
    title: string;
	readonly locality = 'local'
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const links = extractLinksFromString(contentWithoutFrontmatter);
		const connectedFiles = getFilepaths(links, node, app);
		return connectedFiles;
	}
	constructor(title: string) {
		this.title = title
	}
}

export class AllInTextConnConfig implements ConnectionConfig {
	readonly type = 'all-in-text';
	title: string;

	constructor(title: string) {
		this.title = title;
	}
}

export const AllInTextConnectionDescriptor: ConnectionTypeDescriptor<AllInTextConnConfig> = {
	type: 'all-in-text',

	createInstance(config) {
		return new AllInTextConnection(config.title);
	},

	createConfig(instance) {
		const connection = instance as AllInTextConnection;
		return {
			type: connection.type,
			title: connection.title
		};
	},
	label: "all links in text",
	editorComponent: AllInTextConnectionEditor,
	createDefaultConfig() {
		return { type: 'all-in-text', title: '' };
	},
	validateLocalRules: [] = [],
	validateAboveRules: [] = [],
};
