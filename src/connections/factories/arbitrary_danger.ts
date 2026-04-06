import { TFile, type App } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection } from "src/models/connections";
import { removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "./factory";
import ArbitraryDangerConnectionEditor from "./ArbitraryDangerConnectionEditor.svelte";
import type { ConnectionConfig } from "src/settings/types";

export class ArbitraryDangerConnection implements Connection {
	readonly type = 'arbitrary-danger';
	title: string;
	readonly locality = 'local';

	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		try {
			const code = await this.get_code(app);
			if (code.length == 0) { return [] }
			const AsyncFunction = Object.getPrototypeOf(async function() { }).constructor;
			const executorFunction = new AsyncFunction(
				'app',
				'node',
				'utils',
				code
			);
			const result = await executorFunction(app, node, this.utils);
			if (Array.isArray(result) && result.every(item => item instanceof TFile)) {
				return result;
			}
			return [];
		} catch (error) {
			console.error('ArbitraryDangerConnection error:', error);
			return [];
		}
	}

	filepath: string;
	utils = {
		removeFrontmatter,
		extractLinksFromString,
		getFilepaths
	};

	constructor(title: string, filepath: string) {
		this.title = title;
		this.filepath = filepath;
	}

	async get_code(app: App): Promise<string> {
		try {
			const codeFile = app.vault.getAbstractFileByPath(this.filepath);
			if (!codeFile || !(codeFile instanceof TFile)) {
				return "";
			}
			const codeFileContent = await app.vault.read(codeFile);
			const codeBlockRegex = /```(?:js|javascript|ts|typescript)?\n([\s\S]*?)```/;
			const match = codeFileContent.match(codeBlockRegex);
			if (!match) {
				return "";
			}
			return match[1];
		} catch (error) {
			console.error('ArbitraryDangerConnection error:', error);
			return "";
		}
	}
}

export class ArbitraryDangerConnConfig implements ConnectionConfig {
	type: 'arbitrary-danger';
	title: string;
	filepath: string;
}

export const ArbitraryDangerConnectionDescriptor: ConnectionTypeDescriptor<ArbitraryDangerConnConfig> = {
	type: 'arbitrary-danger',

	createInstance(config) {
		return new ArbitraryDangerConnection(config.title, config.filepath);
	},

	createConfig(instance) {
		const wrapper = instance as ArbitraryDangerConnection;
		return {
			title: wrapper.title,
			type: wrapper.type,
			filepath: wrapper.filepath
		};
	},

	label: "Arbitrary (danger)",
	editorComponent: ArbitraryDangerConnectionEditor,

	createDefaultConfig() {
		return { type: 'arbitrary-danger', title: '', filepath: '' };
	},
};