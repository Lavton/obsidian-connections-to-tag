import { App, Editor, getLinkpath, MarkdownView, Menu, MenuItem, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import * as settings from 'src/settings/settings'
import * as rules from 'src/models/rule'
import { addTagForFile, removeTagFromFile } from 'src/tagsModifier'
import * as utils from 'src/utils'
import { findAllSubtree } from 'src/parentChild'
import { expandToNeibors } from 'src/neibors';
import { getBackwardFilesFromFronmatter, getForwardFilesFromFrontmatter } from 'src/utils';
import * as connections from 'src/models/connections';
import { ChainTraversal, StepTraversal } from 'src/service/chain_traversal';
import { getDefaultChain } from 'src/settings/default_chain';
import type { Chain, ChainStep } from 'src/models/chain';
import { addTagToFileIfNeeded, getAllFilesWithTag, removeTagFromFileIfNeeded } from 'src/tagsUtils';
import { moveFileToAndAddMeta, moveFileFromAndRemoveMeta, getAllFilesWithFrontmatter, removeMetaFromFile, getAllFilesInFolderWithFrontmatter, getAllFilesInFolder } from 'src/folderUtils';

import * as menuItems from 'src/menuItems'
import { FocusMaker } from 'src/service/focus_marker';
import type { RuleFactory } from 'src/models/rule';
import { ConnectionRegistry } from 'src/connections/factories/factory';
import { YamlTagConnection, YamlTagConnectionDescriptor } from 'src/connections/factories/yaml_tag';
import { AllInTextConnectionDescriptor } from 'src/connections/factories/all_in_text';


export default class ConnectionsToTagPlugin extends Plugin implements settings.SettingsSaver, settings.ConnectionsHolder {
	settings: settings.ConnectionsToTagSettings;
	connectionInstances: connections.Connection[] = [];
	connectionRegistry: ConnectionRegistry = new ConnectionRegistry()
		.register(YamlTagConnectionDescriptor)
		.register(AllInTextConnectionDescriptor)

	connectionFactory = {
		"backward": connections.BackwardConnection,
		"plus_minus": connections.PlusMinusConnection,
		"yaml_tag": connections.YamlTagConnection,
		"all_yaml": connections.AllYamlConnection,
		"all_text": connections.AllInTextConnection,
		"top_text": connections.TopInTextConnection,
		"between": connections.BetweenInTextConnection,
		"just_regexp": connections.JustRegexpConnection,
		"arbitrary_danger": connections.ArbitraryDangerConnection,
	}
	ruleFactory = {
		"to_the_end": rules.FactoryRuleToTheEnd,
		"n_steps": rules.FactoryRuleNSteps,
		"probability": rules.FactoryRuleProbabiloty
	}

	async onload() {
		await this.loadSettings();
		// this.connectionInstances = this.settings.connections.map(
            // config => this.connectionRegistry.fromConfig(config)
        // );
		const current_connections: connections.Connection[] = []
		for (const cc of this.settings.connections) {
			current_connections.push(this.connectionRegistry.fromConfig(cc, current_connections))
		}
		this.connectionInstances = current_connections
		// console.log("connections", this.connectionInstances)
		// this.connectionInstances.push(
		// 	new connections.BackwardConnection(
		// 	new YamlTagConnection(["avvaa", "mmmm"])
		// 	)
		// )

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new settings.ConnectionsToTagSettingTab(this.app, this, this));
		this.updateCommandSettingDependend() 
		this.addCommand({
			id: 'test-connection',
			name: 'Test Connection',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				// const conn = new connections.YamlTagConnection(["topic"])
				// const conn = new connections.BackwardConnection(new connections.YamlTagConnection(["topic"]))
				// const conn = new connections.AllYamlConnection()
				// const conn = new connections.TopInTextConnection()
				// const conn = new connections.BetweenInTextConnection(false, "[[note p", null) 
				// const conn = new connections.JustRegexpConnection(false, false, true, "parent::")
				const conn = new connections.ArbitraryDangerConnection("base/danger_test_connection.md")
				console.log(await conn.get_connected(this.app, initialFile))
			}
		})

		this.addCommand({
			id: 'total-remove-hashtag',
			name: 'Totally remove the tag from vault',
			callback: async () => {
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				var districtFiles: TFile[] = getAllFilesWithTag(this.app, current_settings.resultTag)

				console.log(districtFiles.length)
				districtFiles.forEach(async (fp) =>
					await removeTagFromFileIfNeeded(this.app, fp, current_settings.resultTag)
				) // async!
			}
		})
		this.addCommand({
			id: 'total-move-back-files',
			name: "Move all files back to original",
			callback: async () => {
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				var districtFiles: TFile[] = getAllFilesWithFrontmatter(this.app, current_settings.movedNameFrontmatter)

				console.log(districtFiles.length)
				districtFiles.forEach(async (fp) => await moveFileFromAndRemoveMeta(this.app, fp, current_settings.movedNameFrontmatter))
			}
		})
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				const normalizePath = (path: string): string => path.replace(/\/+$/, '');
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				const focusMaker = new FocusMaker(current_settings.getInterfaceFields(), this.app)
				const chain: Chain = getDefaultChain()
				const traversal = new ChainTraversal(chain)
				if (file instanceof TFolder) {
					if (normalizePath(file.path) === normalizePath(current_settings.resultFolder)) {
						menu.addItem((item) => menuItems.moveBackFromFolder(item, current_settings.resultFolder, current_settings.movedNameFrontmatter, this.app))
					}

					menu.addItem((item) => menuItems.applyChainToFolder(item, file, this.app, traversal, focusMaker))
					menu.addItem((item) => menuItems.rollbackChainFromFolder(item, file, this.app, traversal, focusMaker))

				}
				if (file instanceof TFile) {
					menu.addItem((item) => menuItems.applyChainToFile(item, file, this.app, traversal, focusMaker))
					menu.addItem((item) => menuItems.rollbackChainFromFile(item, file, this.app, traversal, focusMaker))

				}
				// menu.addItem((item) => menuItems.pureRemovingFromIgnoreList(item, dirpath, ignoreList, this.app));

			})
		)
		// Команда 1: Сохранить текущие фильтры и установить #focus_on
		this.addCommand({
			id: 'focus-graph',
			name: 'Filter graph view to show only selected files',
			callback: async () => {
				const graphOptions = this.getGraphOptions()
				if (!graphOptions) {
					new Notice("graph view is unavaliable")
					return;
				}
				// this.settings.savedFilters = graphOptions.search;

				await this.saveSettings();
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				const markModes = current_settings.markNoteModes
				if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
					graphOptions.search = `tag:${current_settings.resultTag}`
				} else if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
					graphOptions.search = `path:${current_settings.resultFolder}`
				}
				if (!this.checkGraphPlugin()) return;


				const graphLeaf = this.getGraphLeaf();
				if (!graphLeaf) {
					return;
				}

				// Получаем текущую конфигурацию
				const graphView = (graphLeaf.view as any);
				const currentFilters = graphView.dataEngine?.options;

				if (!currentFilters) {
					return;
				}

				// Сохраняем текущие фильтры
				const newFilters = {
					...currentFilters,
					search: graphOptions.search
				};
				graphView.dataEngine.setOptions(newFilters);
			}
		});
	}
	getGraphOptions(): any {
		// @ts-ignore
		const internal = this.app.internalPlugins
		const graph = internal?.plugins?.graph?.instance;
		const options = graph?.options
		return options
	}
	// Проверка доступности core-плагина "Граф"
	checkGraphPlugin(): boolean {
		const graphPlugin = (this.app as any).internalPlugins?.plugins?.graph;

		if (!graphPlugin) {
			new Notice('Core-плагин "Граф" не найден');
			return false;
		}

		if (!graphPlugin.enabled) {
			new Notice('Core-плагин "Граф" отключён. Включите его в настройках.');
			return false;
		}

		return true;
	}

	// Получить открытый граф
	getGraphLeaf() {
		const leaves = this.app.workspace.getLeavesOfType('graph');
		return leaves.length > 0 ? leaves[0] : null;
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, settings.DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settings.connections = this.connectionInstances.map(
            conn => this.connectionRegistry.toConfig(conn as any)
        );
		await this.saveData(this.settings);
	}
	public updateCommandSettingDependend() {
		const current_settings = settings.NEW_DEFAULT_SETTINGS
		const markModes = current_settings.markNoteModes
		const focusMaker = new FocusMaker(current_settings.getInterfaceFields(), this.app)
		let apply_name: string;
		let rollback_name: string;
		if (markModes.contains(settings.MarkNoteMode.ADD_TAG) && (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER))) {
			apply_name = "add tag and move to folder"
			rollback_name = "remove tag and return to original directory"
		} else if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
			apply_name = "add tag"
			rollback_name = "remove tag"
		} else if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
			apply_name = "move to folder"
			rollback_name = "return to original directory"
		} else {
			apply_name = ""
			rollback_name = ""
		}
		this.addCommand({
			id: 'implement-chain',
			name: 'Apply rule chain starts with this file: ' + apply_name,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				const chain: Chain = getDefaultChain()
				const traversal = new ChainTraversal(chain)

				const derivativeNotes = await traversal.go(this.app, [initialFile])
				await focusMaker.doDependendOn(derivativeNotes)
			}
		})
		this.addCommand({
			id: 'reverse-chain',
			name: 'Rollback rule chain starts with this file: ' + rollback_name,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				const chain: Chain = getDefaultChain()
				const traversal = new ChainTraversal(chain)

				const derivativeNotes = await traversal.go(this.app, [initialFile])
				focusMaker.reverseDependendOn(derivativeNotes)
			}
		})
		this.addCommand({
			id: 'total-remove-from-front',
			name: `Remove all '${current_settings.movedNameFrontmatter}' frontmatter`,
			callback: async () => {
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				var districtFiles: TFile[] = getAllFilesWithFrontmatter(this.app, current_settings.movedNameFrontmatter)

				console.log(districtFiles.length)
				districtFiles.forEach(async (fp) => await removeMetaFromFile(this.app, fp, current_settings.movedNameFrontmatter))
			}
		})

		this.addCommand({
			id: 'move-the-tag-to-folder',
			name: `Move files with tag '${current_settings.resultTag}' to folder ${current_settings.resultFolder}`,
			callback: async () => {
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				var districtFiles: TFile[] = getAllFilesWithTag(this.app, current_settings.resultTag)

				console.log(districtFiles.length)
				districtFiles.forEach(async (fp) =>
					await moveFileToAndAddMeta(this.app, fp, current_settings.resultFolder, current_settings.movedNameFrontmatter)
				) // async!
			}
		})
		this.addCommand({
			id: 'add-tag-to-the-folder',
			name: `Add for in folder '${current_settings.resultFolder}' tag ${current_settings.resultTag}`,
			callback: async () => {
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				var districtFiles: TFile[] = getAllFilesInFolder(this.app, current_settings.resultFolder)

				console.log(districtFiles.length)
				districtFiles.forEach(async (fp) =>
					await addTagToFileIfNeeded(this.app, fp, current_settings.resultTag)
				)
			}
		})
	}
}

