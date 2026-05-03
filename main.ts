import { Menu, Notice, Plugin, TFile, TFolder, type Command, type EventRef, type TAbstractFile } from 'obsidian';
import * as settings from 'src/settings/settings'
import type { Connection } from 'src/connections/connections';
import { RuleTraversal } from 'src/models/traversal';
import { addResultTagToResultFolder, applyRuleChainToFile, applyRuleChainToSearchResults, focusGraphView, moveAllFilesBackToOriginal, moveTaggedFilesToResultFolder, removeMovedFrontmatterFromVault, removeResultTagFromVault, rollbackRuleChainFromFile, snapshotRedo, snapshotUndo } from 'src/menuCommands';

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
import type { NewRuleFactory } from 'src/rules/new_rule';
import { selectRuleFactory } from 'src/service/rule_factory_picker';
import { createConnectionInstances, createRuleInstances, getFocusActionNames } from 'src/ui_utils';
import type { StateSnapshot } from 'src/cancellation';

function addMenuCommand(
	menu: Menu,
	title: string,
	icon: string,
	callback: () => void | Promise<void>,
): void {
	menu.addItem((item) => {
		item.setTitle(title)
			.setIcon(icon)
			.onClick(callback)
	})
}

function addCommand(
	plugin: Plugin,
	id: string,
	name: string,
	callback: NonNullable<Command['callback']>,
): void {
	plugin.addCommand({
		id,
		name,
		callback,
	})
}

function addEditorCommand(
	plugin: Plugin,
	id: string,
	name: string,
	editorCallback: NonNullable<Command['editorCallback']>,
): void {
	plugin.addCommand({
		id,
		name,
		editorCallback,
	})
}

type WorkspaceWithFilesMenu = {
	on(name: "files-menu", callback: (menu: Menu, files: TAbstractFile[]) => unknown): EventRef;
}

export default class ConnectionsToTagPlugin extends Plugin implements settings.SettingsSaver, settings.ConnectionsHolder {
	settings!: settings.ConnectionsToTagSettings;
	
	connectionInstances: Connection[] = [];
	connectionRegistry: ConnectionRegistry = new ConnectionRegistry();
	ruleRegistry: RuleRegistry = new RuleRegistry();
	ruleInstances: NewRuleFactory[] = [];
	history: StateSnapshot[] = [];
	future: StateSnapshot[] = [];

	private saveHistorySnapshot(snapshot: StateSnapshot | null | void): void {
		if (snapshot == null) {
			return
		}
		this.history.push(snapshot)
		this.history = this.history.slice(-10)
		this.future = []
	}

	private async runWithHistory(action: () => StateSnapshot | null | Promise<StateSnapshot | null>): Promise<void> {
		const snapshot = await action()
		this.saveHistorySnapshot(snapshot)
	}

	private async undoSnapshot(): Promise<void> {
		const snapshot = this.history[this.history.length - 1]
		if (snapshot == null) {
			new Notice("Undo is unavailable: history depth reached")
			return
		}
		const undoSnapshot = await snapshotUndo(this.app, snapshot)
		this.history.pop()
		this.future.push(undoSnapshot)
	}

	private async redoSnapshot(): Promise<void> {
		const snapshot = this.future[this.future.length - 1]
		if (snapshot == null) {
			new Notice("Redo is unavailable: history depth reached")
			return
		}
		const redoSnapshot = await snapshotRedo(this.app, snapshot)
		this.future.pop()
		this.history.push(redoSnapshot)
	}

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
		addCommand(
			this,
			'total-remove-hashtag',
			'Totally remove the tag from vault',
			() => this.runWithHistory(() =>
				removeResultTagFromVault(this.app, this.settings.focusMakerSettings)
			),
		)
		addCommand(
			this,
			'total-move-back-files',
			"Move all files back to original",
			() => this.runWithHistory(() =>
				moveAllFilesBackToOriginal(this.app, this.settings.focusMakerSettings)
			),
		)
		addCommand(
			this,
			'undo-snapshot',
			'Undo last focus action',
			() => this.undoSnapshot(),
		)
		addCommand(
			this,
			'redo-snapshot',
			'Redo last undone focus action',
			() => this.redoSnapshot(),
		)
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
						addMenuCommand(menu, "Move files back from the folder", "undo-2", () =>
							this.runWithHistory(() =>
								menuItems.moveBackFromFolder(this.app, current_settings.resultFolder, current_settings.movedNameFrontmatter, focusMaker)
							)
						)
					}

					addMenuCommand(menu, "Apply chain starts with every sub-file", "redo-2", () =>
						this.runWithHistory(() =>
							menuItems.applyChainToFolder(this.app, file, getTraversal, focusMaker)
						)
					)
					addMenuCommand(menu, "Rollback chain starts with every sub-file", "undo-2", () =>
						this.runWithHistory(() =>
							menuItems.rollbackChainFromFolder(this.app, file, getTraversal, focusMaker)
						)
					)

				}
				if (file instanceof TFile) {
					addMenuCommand(menu, "Apply chain starts with the file", "redo-2", () =>
						this.runWithHistory(() =>
							menuItems.applyChainToFile(this.app, file, getTraversal, focusMaker)
						)
					)
					addMenuCommand(menu, "Rollback chain starts with the file", "undo-2", () =>
						this.runWithHistory(() =>
							menuItems.rollbackChainFromFile(this.app, file, getTraversal, focusMaker)
						)
					)

				}
			})
		)
		this.registerEvent(
			(this.app.workspace as unknown as WorkspaceWithFilesMenu).on("files-menu", (menu: Menu, files) => {
				const current_settings = this.settings.focusMakerSettings
				const focusMaker = new FocusMaker(current_settings, this.app)
				const getTraversal = async () => {
					const ruleFactory = await selectRuleFactory(this.app, this.ruleInstances)
					if (ruleFactory == null) {
						return null
					}
					return new RuleTraversal(ruleFactory)
				}
				const selectedFiles = files.filter((file): file is TFile => file instanceof TFile)
				if (!selectedFiles.length) {
					return
				}

				addMenuCommand(menu, "Apply chain starts with selected files", "redo-2", () =>
					this.runWithHistory(() =>
						menuItems.applyChainToFiles(this.app, selectedFiles, getTraversal, focusMaker)
					)
				)
				addMenuCommand(menu, "Rollback chain starts with selected files", "undo-2", () =>
					this.runWithHistory(() =>
						menuItems.rollbackChainFromFiles(this.app, selectedFiles, getTraversal, focusMaker)
					)
				)
			})
		)
		// Command 1: save the current filters and set #focus_on
		addCommand(
			this,
			'focus-graph',
			'Filter graph view to show only selected files',
			async () => {
				await focusGraphView(this.app, this.settings.focusMakerSettings)
			},
		);
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
		addEditorCommand(
			this,
			'implement-chain',
			'Apply rule chain starts with this file: ' + apply_name,
			(editor, view) => this.runWithHistory(() =>
				applyRuleChainToFile(this.app, view.file, this.ruleInstances, focusMaker)
			),
		)
		addEditorCommand(
			this,
			'reverse-chain',
			'Rollback rule chain starts with this file: ' + rollback_name,
			(editor, view) => this.runWithHistory(() =>
				rollbackRuleChainFromFile(this.app, view.file, this.ruleInstances, focusMaker)
			),
		)
		addCommand(
			this,
			'from-search',
			'Apply rules starting with search results: ' + apply_name,
			() => this.runWithHistory(() =>
				applyRuleChainToSearchResults(this.app, this.ruleInstances, focusMaker)
			),
		)
		addCommand(
			this,
			'total-remove-from-front',
			`Remove all '${current_settings.movedNameFrontmatter}' frontmatter`,
			async () => {
				await removeMovedFrontmatterFromVault(this.app, this.settings.focusMakerSettings)
			},
		)

		addCommand(
			this,
			'move-the-tag-to-folder',
			`Tag->folder. Move files with tag '${current_settings.resultTag}' to folder ${current_settings.resultFolder}`,
			() => this.runWithHistory(() =>
				moveTaggedFilesToResultFolder(this.app, this.settings.focusMakerSettings)
			),
		)
		addCommand(
			this,
			'add-tag-to-the-folder',
			`Folder->tag. Add for files in folder '${current_settings.resultFolder}' tag ${current_settings.resultTag}`,
			() => this.runWithHistory(() =>
				addResultTagToResultFolder(this.app, this.settings.focusMakerSettings)
			),
		)
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
