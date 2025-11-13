import { App, PluginSettingTab, Plugin, Setting } from "obsidian";

export interface ResultsSettings {
	workingTag: string;
	// goalFolder: string,
	// autoAddToFolder: boolean; 
	// reverseFrontmatter: string;
}

export enum MarkNoteMode {
	ADD_TAG,
	MOVE_TO_FOLDER
}

export interface ConnectionsToTagSettings {
    workingTag: string, // deprecated
	resultsSettings: ResultsSettings,
    parentsTag: string[],
    aroundNumber: number,
    isFirstTagLineParentWhenEmpty: boolean
}

export const NEW_DEFAULT_SETTINGS = {
	resultTag: "to_focus_on",
	resultFolder: "focusNotes/",
	movedNameFrontmatter: "moved_from",
	markNoteModes: [
		MarkNoteMode.ADD_TAG,
		MarkNoteMode.MOVE_TO_FOLDER
	],
	dangerConnectionsFolder: "focus_connection_code/"
}

export const DEFAULT_SETTINGS: ConnectionsToTagSettings = {
    workingTag: "#to_focus_on",
	resultsSettings: {
		workingTag: "#to_focus_on",
	},
    parentsTag: ["parents"],
    aroundNumber: 0,
    isFirstTagLineParentWhenEmpty: true
}


export interface SettingsSaver extends Plugin {
	settings: ConnectionsToTagSettings;
	saveSettings(): Promise<void>;

}

export class ConnectionsToTagSettingTab extends PluginSettingTab {
	plugin: SettingsSaver;

	constructor(app: App, plugin: SettingsSaver) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			// as in https://github.com/zsviczian/excalibrain/blob/master/src/Settings.ts
			.setName('working tag')
			.setDesc('notes with what tag will be moved')
			.addText((text) => {
				text
				.setPlaceholder('ex. #to_focus_on')
				.setValue(this.plugin.settings.workingTag)
				.onChange(async (value) => {
					this.plugin.settings.workingTag = value
					if (!(value.startsWith("#"))) {
						this.plugin.settings.workingTag = "#" + this.plugin.settings.workingTag
					}
					await this.plugin.saveSettings();
				})
			})
		new Setting(containerEl)
		.setName('parents tags')
		.setDesc('tags of parents, sep by comma')
			.addText((text) => {
				text
				.setValue(this.plugin.settings.parentsTag.join(", "))
				.onChange(async (value) => {
					var tagNames = value.split(",").map((t) => t.trim())
					this.plugin.settings.parentsTag = tagNames
					await this.plugin.saveSettings();
				})
			})
		new Setting(containerEl)
		.setName('number of neibors')
		.setDesc('Number of nodes-neibors that will be connected')
			.addText((text) => {
				text
				.setValue(this.plugin.settings.aroundNumber.toString())
				.onChange(async (value) => {
					var num = parseInt(value)
					if (!Number.isNaN(num)) {
						this.plugin.settings.aroundNumber = num
						await this.plugin.saveSettings();
					}
				})
			})
		new Setting(containerEl)
		.setName('use first line as parents')
		.setDesc('if no tags are inside, use first mention nodes as parents')
		.addToggle((cb) => {
			cb 
			.setValue(this.plugin.settings.isFirstTagLineParentWhenEmpty)
			.onChange(async (value) => {
				this.plugin.settings.isFirstTagLineParentWhenEmpty = value
				await this.plugin.saveSettings();
			})
		})
	}
}
