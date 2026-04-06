import type { App, TFile } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection } from "src/models/connections";
import { findTextFragment, removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "./factory";
import BetweenInTextConnectionEditor from "./BetweenInTextConnectionEditor.svelte";
import type { ConnectionConfig } from "src/settings/types";

export class BetweenInTextConnection implements Connection {
	readonly type = 'between-in-text';
	title: string;
	readonly locality = 'local';

	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const targetFragment = findTextFragment(contentWithoutFrontmatter, this.is_regexp, this.start_to_find, this.end_to_find);
		const links = extractLinksFromString(targetFragment);
		const files = getFilepaths(links, node, app);
		return files;
	}

	is_regexp: boolean;
	start_to_find: string | null;
	end_to_find: string | null;

	constructor(title: string, is_regexp: boolean, start_to_find: string | null, end_to_find: string | null) {
		this.title = title;
		this.is_regexp = is_regexp;
		this.start_to_find = start_to_find;
		this.end_to_find = end_to_find;
	}
}

export class BetweenInTextConnConfig implements ConnectionConfig {
	type: 'between-in-text';
	title: string;
	is_regexp: boolean;
	start_to_find: string | null;
	end_to_find: string | null;
}

export const BetweenInTextConnectionDescriptor: ConnectionTypeDescriptor<BetweenInTextConnConfig> = {
	type: 'between-in-text',

	createInstance(config) {
		return new BetweenInTextConnection(config.title, config.is_regexp, config.start_to_find, config.end_to_find);
	},

	createConfig(instance) {
		const wrapper = instance as BetweenInTextConnection;
		return {
			type: wrapper.type,
			title: wrapper.title,
			is_regexp: wrapper.is_regexp,
			start_to_find: wrapper.start_to_find,
			end_to_find: wrapper.end_to_find,
		};
	},

	label: "Between in text",
	editorComponent: BetweenInTextConnectionEditor,

	createDefaultConfig() {
		return {
			type: 'between-in-text',
			title: '',
			is_regexp: false,
			start_to_find: null,
			end_to_find: null,
		};
	},
};