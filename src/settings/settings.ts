import { App, PluginSettingTab, Plugin, Setting } from "obsidian";

import { mount } from "svelte";
import ExplainGeneral from './ExplainGeneral.svelte';
import ConnectionListSettings from "./ConnectionListSettings.svelte";
import type { Connection } from "src/models/connections";
import type { RuleFactory } from "src/models/rule";
import type { ConcreeteConnection } from "./types";
import * as common_rules from "./common_validation_rules";
export interface ResultsSettings {
	workingTag: string;
	// goalFolder: string,
	// autoAddToFolder: boolean; 
	// reverseFrontmatter: string;
}

export enum MarkNoteMode {
	ADD_TAG = "add_tag",
	MOVE_TO_FOLDER = "move_to_folder"
}

export interface FocusMakerSettings {
	resultTag: string
	resultFolder: string
	movedNameFrontmatter: string
	markNoteModes: MarkNoteMode[]
}

export interface ConnectionsToTagSettings {
	workingTag: string, // deprecated
	focusMakerSettings: FocusMakerSettings,
	parentsTag: string[],
	aroundNumber: number,
	isFirstTagLineParentWhenEmpty: boolean,
	concreeteConnections: ConcreeteConnection[]
}


export const NEW_DEFAULT_SETTINGS = {
	resultTag: "to_focus_on",
	resultFolder: "focusNotes/",
	movedNameFrontmatter: "moved_from",
	markNoteModes: [
		MarkNoteMode.ADD_TAG,
		MarkNoteMode.MOVE_TO_FOLDER
	],
	dangerConnectionsFolder: "focus_connection_code/",
	savedFilters: [],
	getInterfaceFields(): FocusMakerSettings {
		return {
			resultTag: this.resultTag,
			resultFolder: this.resultFolder,
			movedNameFrontmatter: this.movedNameFrontmatter,
			markNoteModes: this.markNoteModes,
		}
	}
}

export const DEFAULT_SETTINGS: ConnectionsToTagSettings = {
	workingTag: "#to_focus_on",
	// resultsSettings: {
	// 	workingTag: "#to_focus_on",
	// },
	parentsTag: ["parents"],
	aroundNumber: 0,
	isFirstTagLineParentWhenEmpty: true,
	focusMakerSettings: {
		resultTag: "to_focus_on",
		resultFolder: "focusNotes/",
		movedNameFrontmatter: "moved_from",
		markNoteModes: [
			MarkNoteMode.ADD_TAG,
			// MarkNoteMode.MOVE_TO_FOLDER
		],
	},
	concreeteConnections: [{title: "ooo"}]
}


export interface SettingsSaver extends Plugin {
	settings: ConnectionsToTagSettings;
	saveSettings(): Promise<void>;

}
type ConnectionMap = Record<string, new (...args: any[]) => Connection>;
type RulesMap = Record<string, new (...args: any[]) => RuleFactory>;
export interface ConnectionsHolder extends Plugin {
	connectionFactory: ConnectionMap
	ruleFactory: RulesMap
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
		const explain = mount(ExplainGeneral, {
			target: containerEl,
			props: {
			}
		});
		const section1 = containerEl.createDiv({ cls: 'settings-section' });
		section1.id = 'section-focuser';
		section1.createEl('h2', { text: 'What to do with found notes' });
		// focusMaker settings. 
		new Setting(containerEl)
			.setName("Apply tag / move to folder")
			.setDesc("What will be the result of applying chain? All notes will have specific tag or will be moved to specific folder?")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.focusMakerSettings.markNoteModes.contains(MarkNoteMode.MOVE_TO_FOLDER))
				.onChange(async (value) => {
					if (value) {
						this.plugin.settings.focusMakerSettings.markNoteModes = [MarkNoteMode.MOVE_TO_FOLDER];
					} else {
						this.plugin.settings.focusMakerSettings.markNoteModes = [MarkNoteMode.ADD_TAG];
					}
					await this.plugin.saveSettings();
				})
			);
		new Setting(containerEl)
			.setName("Result tag")
			.setDesc("What tag will be applying in case of 'apply tag'? (Use #hastag to apply it in file text and without # to apply into frontamatter tags)")
			.addText((text) => {
				text
					.setPlaceholder('ex. #to_focus_on')
					.setValue(this.plugin.settings.focusMakerSettings.resultTag)
					.onChange(async (value) => {
						this.plugin.settings.focusMakerSettings.resultTag = value
						await this.plugin.saveSettings();
					})
			})
		new Setting(containerEl)
			.setName("Result folder")
			.setDesc("In what folder the notes will be moved to?")
			.addText((text) => {
				text
					.setPlaceholder('ex. focusNotes/')
					.setValue(this.plugin.settings.focusMakerSettings.resultFolder)
					.onChange(async (value) => {
						this.plugin.settings.focusMakerSettings.resultFolder = value
						await this.plugin.saveSettings();
					})
			})
		new Setting(containerEl)
			.setName("Technical 'moved' frontmatter")
			.setDesc("Add frontmatter that will be used to store original location of the notes when it moved to folder")
			.addText((text) => {
				text
					.setPlaceholder('ex. moved_from')
					.setValue(this.plugin.settings.focusMakerSettings.movedNameFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.focusMakerSettings.movedNameFrontmatter = value
						await this.plugin.saveSettings();
					})
			})
		// TODO: settings result folder, moved_from_fronmatter. Потом переключиться на эти
		const section2 = containerEl.createDiv({ cls: 'settings-section' });
		section2.id = 'section-chain';
		section2.createEl('h2', { text: 'What rules and chains to apply' });
		// chains & traversal
		// const listSetting = new Setting(containerEl)
		// 	.setName('Список элементов')
		// 	.setDesc('Добавьте, удалите или измените порядок элементов');

		// Создаем контейнер для Svelte компонента
		let listContainer = section2.createDiv();

		const listComponent = mount(ConnectionListSettings, {
			target: listContainer,
			props: {
				concreeteConnections: this.plugin.settings.concreeteConnections,
				onchange: async (items: ConcreeteConnection[]) => {
					this.plugin.settings.concreeteConnections = items;
					await this.plugin.saveSettings();
					// await this.plugin.saveSettings();
				},
				valRules: [
					common_rules.ruleTitleRequired,
					common_rules.ruleNoPlusMinusWithSpaces,
					common_rules.ruleNotEqual,
				]
			}
		});
		const section3 = containerEl.createDiv({ cls: 'settings-section' });
		section3.id = 'section-ui';
		section3.createEl('h2', { text: 'UI settings' });
		// UI

		// new Setting(containerEl)
		// 	// as in https://github.com/zsviczian/excalibrain/blob/master/src/Settings.ts
		// 	.setName('working tag')
		// 	.setDesc('notes with what tag will be moved')
		// 	.addText((text) => {
		// 		text
		// 		.setPlaceholder('ex. #to_focus_on')
		// 		.setValue(this.plugin.settings.workingTag)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.workingTag = value
		// 			if (!(value.startsWith("#"))) {
		// 				this.plugin.settings.workingTag = "#" + this.plugin.settings.workingTag
		// 			}
		// 			await this.plugin.saveSettings();
		// 		})
		// 	})
		// new Setting(containerEl)
		// .setName('parents tags')
		// .setDesc('tags of parents, sep by comma')
		// 	.addText((text) => {
		// 		text
		// 		.setValue(this.plugin.settings.parentsTag.join(", "))
		// 		.onChange(async (value) => {
		// 			var tagNames = value.split(",").map((t) => t.trim())
		// 			this.plugin.settings.parentsTag = tagNames
		// 			await this.plugin.saveSettings();
		// 		})
		// 	})
		// new Setting(containerEl)
		// .setName('number of neibors')
		// .setDesc('Number of nodes-neibors that will be connected')
		// 	.addText((text) => {
		// 		text
		// 		.setValue(this.plugin.settings.aroundNumber.toString())
		// 		.onChange(async (value) => {
		// 			var num = parseInt(value)
		// 			if (!Number.isNaN(num)) {
		// 				this.plugin.settings.aroundNumber = num
		// 				await this.plugin.saveSettings();
		// 			}
		// 		})
		// 	})
		// new Setting(containerEl)
		// .setName('use first line as parents')
		// .setDesc('if no tags are inside, use first mention nodes as parents')
		// .addToggle((cb) => {
		// 	cb 
		// 	.setValue(this.plugin.settings.isFirstTagLineParentWhenEmpty)
		// 	.onChange(async (value) => {
		// 		this.plugin.settings.isFirstTagLineParentWhenEmpty = value
		// 		await this.plugin.saveSettings();
		// 	})
		// })
	}
	hide(): void {
		// Очищаем компонент при закрытии
		// if (this.listComponent) {
		//     unmount(this.listComponent);
		//     this.listComponent = null;
		// }
	}
}
