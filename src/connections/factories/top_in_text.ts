import type { App, TFile } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection, ConnectionConfig } from "src/connections/connections";
import { removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "../connection_factory";
import TopInTextConnectionEditor from "./TopInTextConnectionEditor.svelte";

export class TopInTextConnection implements Connection {
	readonly type = 'top-in-text';
	title: string;
	readonly locality = 'local';

	constructor(title: string) {
		this.title = title;
	}

	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const lines = contentWithoutFrontmatter.split('\n');

		let firstLinkFound = false;
		let allLinks: string[] = [];

		for (const line of lines) {
			const linksInLine = extractLinksFromString(line);

			if (linksInLine.length > 0) {
				firstLinkFound = true;
				allLinks.push(...linksInLine);
			} else if (firstLinkFound) {
				break;
			}
		}

		return getFilepaths(allLinks, node, app);
	}
}

export class TopInTextConnConfig implements ConnectionConfig {
	readonly type = 'top-in-text';
	title: string;

	constructor(title: string) {
		this.title = title;
	}
}

export const TopInTextConnectionDescriptor: ConnectionTypeDescriptor<TopInTextConnConfig> = {
	type: 'top-in-text',

	createInstance(config) {
		return new TopInTextConnection(config.title);
	},

	createConfig(instance) {
		const wrapper = instance as TopInTextConnection;
		return {
			title: wrapper.title,
			type: wrapper.type,
		};
	},

	label: "Top links in text",
	description: "Finds the first link block in the note text (without frontmatter) and returns all links from it.",
	editorComponent: TopInTextConnectionEditor,

	createDefaultConfig() {
		return { type: 'top-in-text', title: '' };
	},
	validateLocalRules: [] = [],
	validateAboveRules: [] = [],
};
