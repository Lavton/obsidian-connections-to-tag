import { App, Editor, getLinkpath, MarkdownView, Menu, MenuItem, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import * as settings from 'src/settings/settings'
import { addTagForFile, removeTagFromFile } from 'src/tagsModifier'
import * as utils from 'src/utils'
import { getBackwardFilesFromFronmatter, getForwardFilesFromFrontmatter } from 'src/utils';
import type { Connection } from 'src/connections/connections';
import { RuleTraversal } from 'src/service/chain_traversal';
import type { ChainStep } from 'src/models/chain';
import { getAllFilesInFolderWithFrontmatter } from 'src/folderUtils';
import { addResultTagToResultFolder, applyRuleChainToFile, applyRuleChainToSearchResults, focusGraphView, moveAllFilesBackToOriginal, moveTaggedFilesToResultFolder, removeMovedFrontmatterFromVault, removeResultTagFromVault, rollbackRuleChainFromFile } from 'src/menuCommands';

import * as menuItems from 'src/menuItems'
import { FocusMaker } from 'src/service/focus_marker';
import { ConnectionRegistry } from 'src/connections/connection_factory';
import { YamlTagConnectionDescriptor } from 'src/connections/factories/yaml_tag';
import { AllInTextConnectionDescriptor } from 'src/connections/factories/all_in_text';
import { PlusMinusConnectionDescriptor } from 'src/connections/factories/plus_minus';
import { AllYamlConnectionDescriptor } from 'src/connections/factories/all_yaml';
import { ArbitraryDangerConnectionDescriptor } from 'src/connections/factories/arbitrary_danger';
import { BetweenInTextConnectionDescriptor } from 'src/connections/factories/between_in_text';
import { JustRegexpConnectionDescriptor } from 'src/connections/factories/just_regexp';
import { TopInTextConnectionDescriptor } from 'src/connections/factories/top_in_text';
import { RuleRegistry } from 'src/rules/rule_factory';
import { ToTheEndRuleDescriptor } from 'src/rules/factories/to_the_end';
import { NStepsRuleDescriptor } from 'src/rules/factories/n_steps';
import { ProbabilityRuleDescriptor } from 'src/rules/factories/probability';
import type { NewRule, NewRuleFactory } from 'src/rules/new_rule';
import { selectRuleFactory } from 'src/service/rule_factory_picker';
import { applyFocusAndFindNewInitialFile, rollbackFocusAndFindNewInitialFile } from 'tests/ui_manual';
import { createConnectionInstances, createRuleInstances, getFocusActionNames } from 'src/ui_utils';

export default class ConnectionsToTagPlugin extends Plugin implements settings.SettingsSaver, settings.ConnectionsHolder {
	settings!: settings.ConnectionsToTagSettings;
	
	connectionInstances: Connection[] = [];
	connectionRegistry: ConnectionRegistry = new ConnectionRegistry();
	ruleRegistry: RuleRegistry = new RuleRegistry();
	ruleInstances: NewRuleFactory[] = [];


	async onload() {
		this.connectionRegistry
			.register(AllInTextConnectionDescriptor)
			.register(AllYamlConnectionDescriptor)
			.register(new ArbitraryDangerConnectionDescriptor(this.app))
			.register(BetweenInTextConnectionDescriptor)
			.register(JustRegexpConnectionDescriptor)
			.register(TopInTextConnectionDescriptor)
			.register(new YamlTagConnectionDescriptor(this.app))
			.register(PlusMinusConnectionDescriptor)
		this.ruleRegistry
			.register(ToTheEndRuleDescriptor)
			.register(NStepsRuleDescriptor)
			.register(ProbabilityRuleDescriptor)

		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new settings.ConnectionsToTagSettingTab(this.app, this, this));
		this.updateSettingDependend() 
		this.addCommand({
			id: 'total-remove-hashtag',
			name: 'Totally remove the tag from vault',
			callback: async () => {
				await removeResultTagFromVault(this.app, this.settings.focusMakerSettings)
			}
		})
		this.addCommand({
			id: 'total-move-back-files',
			name: "Move all files back to original",
			callback: async () => {
				await moveAllFilesBackToOriginal(this.app, this.settings.focusMakerSettings)
			}
		})
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				const current_settings = this.settings.focusMakerSettings
				const focusMaker = new FocusMaker(current_settings, this.app)
				const getTraversal = async () => {
					const ruleFactory = await selectRuleFactory(this.app, this.ruleInstances)
					if (ruleFactory == null) {
						return null
					}
					return new RuleTraversal(ruleFactory)
				}
				if (file instanceof TFolder) {
					if (menuItems.isResultFolder(file, current_settings.resultFolder)) {
						menu.addItem((item) => menuItems.moveBackFromFolder(item, current_settings.resultFolder, current_settings.movedNameFrontmatter, this.app))
					}

					menu.addItem((item) => menuItems.applyChainToFolder(item, file, this.app, getTraversal, focusMaker))
					menu.addItem((item) => menuItems.rollbackChainFromFolder(item, file, this.app, getTraversal, focusMaker))

				}
				if (file instanceof TFile) {
					menu.addItem((item) => menuItems.applyChainToFile(item, file, this.app, getTraversal, focusMaker))
					menu.addItem((item) => menuItems.rollbackChainFromFile(item, file, this.app, getTraversal, focusMaker))

				}

			})
		)
		// Command 1: save the current filters and set #focus_on
		this.addCommand({
			id: 'focus-graph',
			name: 'Filter graph view to show only selected files',
			callback: async () => {
				await focusGraphView(this.app, this.settings.focusMakerSettings)
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, settings.DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateSettingDependend()
	}
	public updateSettingDependend() {
		const current_connections = createConnectionInstances(this.settings.connectionConfigs, this.connectionRegistry)
		this.connectionInstances = current_connections

		const current_rules = createRuleInstances(this.settings.ruleConfigs, this.ruleRegistry, current_connections)
		this.ruleInstances = current_rules

		const current_settings = this.settings.focusMakerSettings
		const focusMaker = new FocusMaker(current_settings, this.app)
		const { apply_name, rollback_name } = getFocusActionNames(current_settings)
		this.addCommand({
			id: 'implement-chain',
			name: 'Apply rule chain starts with this file: ' + apply_name,
			editorCallback: async (editor: Editor, view) => {
				await applyRuleChainToFile(this.app, view.file, this.ruleInstances, focusMaker)
			}
		})
		this.addCommand({
			id: 'reverse-chain',
			name: 'Rollback rule chain starts with this file: ' + rollback_name,
			editorCallback: async (editor: Editor, view) => {
				await rollbackRuleChainFromFile(this.app, view.file, this.ruleInstances, focusMaker)
			}
		})
		this.addCommand({
			id: 'from-search',
			name: 'Apply rules starting with search results: ' + apply_name,
			callback: async () => {
				await applyRuleChainToSearchResults(this.app, this.ruleInstances, focusMaker)
			}
		})
		this.addCommand({
			id: 'total-remove-from-front',
			name: `Remove all '${current_settings.movedNameFrontmatter}' frontmatter`,
			callback: async () => {
				await removeMovedFrontmatterFromVault(this.app, this.settings.focusMakerSettings)
			}
		})

		this.addCommand({
			id: 'move-the-tag-to-folder',
			name: `Tag->folder. Move files with tag '${current_settings.resultTag}' to folder ${current_settings.resultFolder}`,
			callback: async () => {
				await moveTaggedFilesToResultFolder(this.app, this.settings.focusMakerSettings)
			}
		})
		this.addCommand({
			id: 'add-tag-to-the-folder',
			name: `Folder->tag. Add for files in folder '${current_settings.resultFolder}' tag ${current_settings.resultTag}`,
			callback: async () => {
				await addResultTagToResultFolder(this.app, this.settings.focusMakerSettings)
			}
		})
		// this.addCommand({
		// 	id: 'test-connection',
		// 	name: 'Test Connection',
		// 	editorCallback: async (editor: Editor, view) => {
		// 		// var initialFile = view.file
		// 		// if (initialFile == null) {
		// 		// 	return
		// 		// }
		// 		// const conn = this.connectionRegistry.fromConfig(this.settings.connectionConfigs[0], [])
		// 		// console.log(conn)
		// 		// console.log(await conn.get_connected(this.app, initialFile))

		// 		const current_settings = this.settings.focusMakerSettings
		// 		const focusMaker = new FocusMaker(current_settings, this.app)
		// 		const ruleFactory = this.ruleInstances[0]
		// 		let initialFile = view.file
		// 		if (initialFile == null) {
		// 			return
		// 		}
		// 		if (ruleFactory == null) {
		// 			return
		// 		}
		// 		for (let i = 0; i < 10; i++) {
		// 			initialFile = await applyFocusAndFindNewInitialFile(this.app, ruleFactory, focusMaker, initialFile)
		// 			if (initialFile == null) {
		// 				return
		// 			}
		// 			initialFile = await rollbackFocusAndFindNewInitialFile(this.app, ruleFactory, focusMaker, initialFile)
		// 			if (initialFile == null) {
		// 				return
		// 			}
		// 		}
		// 	}
		// })

	}
}
