import { App, PluginSettingTab, Plugin } from "obsidian";

import { mount } from "svelte";
import { writable } from "svelte/store";
import ExplainGeneral from './ExplainGeneral.svelte';
import ConnectionListSettings from "./ConnectionListSettings.svelte";
import type { DirectionalConnectionConfig } from "src/connections/connections";
import type { ConnectionRegistry } from "src/connections/connection_factory";
import RulesListSettings from "./RulesListSettings.svelte";
import type { RuleConfig } from "src/rules/new_rule";
import type { RuleRegistry } from "src/rules/rule_factory";
import {
	createConnectionListSettingsProps,
	createMarkNoteModesSetting,
	createMovedNameFrontmatterSetting,
	createResultFolderSetting,
	createResultTagSetting,
	createRulesListSettingsProps,
	getPublicConnectionTitles,
} from "./settingsElements";

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
	focusMakerSettings: FocusMakerSettings,
	connectionConfigs: DirectionalConnectionConfig[]
	ruleConfigs: RuleConfig[]
}


export const DEFAULT_SETTINGS: ConnectionsToTagSettings = {
	focusMakerSettings: {
		resultTag: "to_focus_on",
		resultFolder: "focusNotes/",
		movedNameFrontmatter: "moved_from",
		markNoteModes: [
			MarkNoteMode.ADD_TAG,
			// MarkNoteMode.MOVE_TO_FOLDER
		],
	},
	connectionConfigs: [{type: "yaml-tag", title: "ooo", direction: "forward"}],
	ruleConfigs: [],
}


export interface SettingsSaver extends Plugin {
	settings: ConnectionsToTagSettings;
	saveSettings(): Promise<void>;

}
export interface ConnectionsHolder extends Plugin {
	connectionRegistry: ConnectionRegistry
	ruleRegistry: RuleRegistry
}

export class ConnectionsToTagSettingTab extends PluginSettingTab {
	plugin: SettingsSaver;
	connectionHolder: ConnectionsHolder

	constructor(app: App, plugin: SettingsSaver, connectionHolder: ConnectionsHolder) {
		super(app, plugin);
		this.plugin = plugin;
		this.connectionHolder = connectionHolder
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

		createMarkNoteModesSetting(containerEl, this.plugin.settings.focusMakerSettings,() => this.plugin.saveSettings());
		createResultTagSetting(containerEl, this.plugin.settings.focusMakerSettings, () => this.plugin.saveSettings());
		createResultFolderSetting(containerEl, this.plugin.settings.focusMakerSettings, () => this.plugin.saveSettings());
		createMovedNameFrontmatterSetting(containerEl, this.plugin.settings.focusMakerSettings, () => this.plugin.saveSettings());
		
		const section2 = containerEl.createDiv({ cls: 'settings-section' });
		section2.id = 'section-chain';
		section2.createEl('h2', { text: 'What rules to apply' });
		let listContainer = section2.createDiv();

		const registry = this.connectionHolder.connectionRegistry
		const ruleRegistry = this.connectionHolder.ruleRegistry
		
		const connectionTitles = writable(
			getPublicConnectionTitles(this.plugin.settings.connectionConfigs),
		);
		mount(ConnectionListSettings, {
			target: listContainer,
			props: createConnectionListSettingsProps(
				this.plugin.settings.connectionConfigs,
				async (items: DirectionalConnectionConfig[]) => {
					this.plugin.settings.connectionConfigs = items;
					await this.plugin.saveSettings();
				},
				registry,
				connectionTitles,
			),
		});
		mount(RulesListSettings, {
			target: listContainer,
			props: createRulesListSettingsProps(
				this.plugin.settings.ruleConfigs,
				async (items: RuleConfig[]) => {
					this.plugin.settings.ruleConfigs = items;
					await this.plugin.saveSettings();
				},
				ruleRegistry,
				connectionTitles,
			),
		});
	}
	hide(): void {
		// Clean up the component on close.
		// if (this.listComponent) {
		//     unmount(this.listComponent);
		//     this.listComponent = null;
		// }
	}
}
