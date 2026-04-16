import type { App, TFile } from "obsidian"
import type { Connection } from "src/models/connections"
import { getFilesInFrontmatter } from "src/utils"
import type { ConnectionTypeDescriptor } from "./factory";
import YamlTagConnectionEditor from "./YamlTagConnectionEditor.svelte";
import type { ConnectionConfig, ValidationAboveRule, ValidationLocalRule } from "src/settings/types";

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
	readonly type = 'yaml-tag';
	title: string;
	tags: string[];

	constructor(title: string, tags: string[]) {
		this.title = title;
		this.tags = tags;
	}
}

function validateYamlTagsNotEmpty(item: YamlTagConnConfig) {
	if (item.tags.length === 0) {
		return { code: "yaml_tags_empty", path: "tags" };
	}
	return null;
}

function createYamlTagsExistRule(app: App): ValidationLocalRule<YamlTagConnConfig> {
	return {
		run: async (item) => {
			const allYamlKeys = new Set(
				app.vault
					.getMarkdownFiles()
					.flatMap(file => Object.keys(app.metadataCache.getFileCache(file)?.frontmatter ?? {}))
					.filter(key => key !== "position")
			);
			const missingTags = item.tags.filter(tag => !allYamlKeys.has(tag));

			if (missingTags.length > 0) {
				return {
					code: "yaml_keys_not_exists",
					path: "tags",
					params: { tags: [...new Set(missingTags)] },
				};
			}
			return null;
		},
	};
}

// Дескриптор - единственное место где определяется тип
export class YamlTagConnectionDescriptor implements ConnectionTypeDescriptor<YamlTagConnConfig> {
	type: "yaml-tag" = 'yaml-tag';
	label = "YAML tags";
	editorComponent = YamlTagConnectionEditor;
	validateLocalRules: ValidationLocalRule<YamlTagConnConfig>[];
	validateAboveRules: ValidationAboveRule<YamlTagConnConfig>[] = [];

	constructor(private readonly app: App) {
		this.validateLocalRules = [
			{ run: validateYamlTagsNotEmpty },
			createYamlTagsExistRule(this.app),
		];
	}

	createInstance(config: YamlTagConnConfig) {
		return new YamlTagConnection(config.title, config.tags);
	}

	createConfig(instance: Connection) {
		const wrapper = instance as YamlTagConnection;
		return new YamlTagConnConfig(wrapper.title, wrapper.tags);
	}

	createDefaultConfig() {
		return new YamlTagConnConfig('', []);
	}
}
