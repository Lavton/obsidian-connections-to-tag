import { TFile, type App } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection, ConnectionConfig } from "src/connections/connections";
import { removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "../connection_factory";
import ArbitraryDangerConnectionEditor from "./ArbitraryDangerConnectionEditor.svelte";
import type { ValidationAboveRule, ValidationLocalRule } from "src/settings/types";

type ArbitraryDangerUtils = {
	removeFrontmatter: typeof removeFrontmatter;
	extractLinksFromString: typeof extractLinksFromString;
	getFilepaths: typeof getFilepaths;
}

type ArbitraryDangerExecutor = (app: App, node: TFile, utils: ArbitraryDangerUtils) => Promise<unknown>
type AsyncFunctionConstructor = new (...args: string[]) => ArbitraryDangerExecutor

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor as AsyncFunctionConstructor;

export class ArbitraryDangerConnection implements Connection {
	readonly type = 'arbitrary-danger';
	title: string;
	readonly locality = 'local';

	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		try {
			const code = await this.get_code(app);
			if (code.length == 0) { return [] }
			const executorFunction = new AsyncFunction(
				'app',
				'node',
				'utils',
				code
			);
			const result: unknown = await executorFunction(app, node, this.utils);
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
	utils: ArbitraryDangerUtils = {
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
	readonly type = 'arbitrary-danger';
	title: string;
	filepath: string;

	constructor(title: string, filepath: string) {
		this.title = title;
		this.filepath = filepath;
	}
}


export class ArbitraryDangerConnectionDescriptor implements ConnectionTypeDescriptor<ArbitraryDangerConnConfig> {
	type: "arbitrary-danger" = 'arbitrary-danger';
	label = "Arbitrary (danger)";
	description = "Runs code from the first JS/TS block in the specified file. Use with caution.";
	editorComponent = ArbitraryDangerConnectionEditor;
	validateAboveRules: ValidationAboveRule<ArbitraryDangerConnConfig>[] = [];
	validateLocalRules: ValidationLocalRule<ArbitraryDangerConnConfig>[];

	constructor(private readonly app: App) {
		this.validateLocalRules = [
			{
				run: validateArbitraryDangerEmptyFilepath,
			},
			createArbitraryDangerFileExistsRule(this.app),
		];
	}

	createInstance(config: ArbitraryDangerConnConfig) {
		return new ArbitraryDangerConnection(config.title, config.filepath);
	}

	createConfig(instance: Connection) {
		const wrapper = instance as ArbitraryDangerConnection;
		return new ArbitraryDangerConnConfig(wrapper.title, wrapper.filepath);
	}

	createDefaultConfig() {
		return new ArbitraryDangerConnConfig('', '');
	}
}

function validateArbitraryDangerEmptyFilepath(item: ArbitraryDangerConnConfig) {
	if (!item.filepath.trim()) {
		return { code: "field_empty", path: "filepath" };
	}
	return null;
}

function createArbitraryDangerFileExistsRule(app: App): ValidationLocalRule<ArbitraryDangerConnConfig> {
	return {
		run: async (item) => {
			const file = app.vault.getAbstractFileByPath(item.filepath.trim());

			if (!(file instanceof TFile)) {
				return { code: "file_not_exists", path: "filepath" };
			}
			return null;
		},
	};
}
