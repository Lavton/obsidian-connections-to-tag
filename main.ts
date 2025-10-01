import { App, Editor, getLinkpath, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as settings from 'src/settings/settings'
import { addTagForFile, removeTagFromFile } from 'src/tagsModifier'
import * as utils from 'src/utils'
import { findAllSubtree } from 'src/parentChild'
import { expandToNeibors } from 'src/neibors';
import { getBackwardFilesFromFronmatter, getForwardFilesFromFrontmatter } from 'src/utils';
import { YamlConnectionTag } from 'src/models/connections';
import { StepTraversal } from 'src/service/chain_traversal';
import { getDefaultChain } from 'src/settings/default_chain';
import type { Chain, ChainStep } from 'src/models/chain';

export default class ConnectionsToTagPlugin extends Plugin implements settings.SettingsSaver {
	settings: settings.ConnectionsToTagSettings;

	async onload() {
		await this.loadSettings();


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new settings.ConnectionsToTagSettingTab(this.app, this));
		this.addCommand({
			id: 'implement-rule',
			name: 'Do tree',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				const chain: Chain = getDefaultChain()
				const firstStep: ChainStep = chain.chainSteps[0]
				const traversal = new StepTraversal(firstStep)
				const res = await traversal.go(this.app, [initialFile])
				console.log({res})
				// const parentYaml = new YamlConnectionTag([], ["parents"])
				// const nextYaml = new YamlConnectionTag(["next"], [])

				// // "go through parents backward (=on children) to the end"
				// // "go 'next' forward max 10 steps"
				// // "go 'base' backward with probability 0.2

				// console.log("aaa", parentYaml, nextYaml)
				// const testForw = getForwardFilesFromFrontmatter(this.app, initialFile, ["prev"])
				// const testBack = getBackwardFilesFromFronmatter(this.app, initialFile, ["parents"])
				// console.log({testForw, testBack})
				// console.log(initialFile);
			}

		})
		this.addCommand({
			id: 'add-hashtags-tree',
			name: 'Add hashtag to tree',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				var subTreeFilesPath: string[] = await findAllSubtree(this.app, initialFile.path, this.settings.isFirstTagLineParentWhenEmpty, this.settings.parentsTag)
				// console.log("files", subTreeFilesPath)
				var withNeiborsTree: string[] = await expandToNeibors(this.app, subTreeFilesPath, this.settings.aroundNumber)
				var districtFiles: string[] = [...new Set(withNeiborsTree)]
				// console.log("will add to", districtFiles)
				districtFiles.forEach(async (fp) => addTagForFile(this.app, fp, this.settings.workingTag)) // async!
			}
		});
		this.addCommand({
			id: 'remove-hashtags-tree',
			name: 'Remove hashtag from tree',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				var subTreeFilesPath: string[] = await findAllSubtree(this.app, initialFile.path, this.settings.isFirstTagLineParentWhenEmpty, this.settings.parentsTag)
				var withNeiborsTree: string[] = await expandToNeibors(this.app, subTreeFilesPath, this.settings.aroundNumber)
				var districtFiles: string[] = [...new Set(withNeiborsTree)]
				// console.log("will remove from", districtFiles)
				districtFiles.forEach(async (fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
			}
		})
		this.addCommand({
			id: 'add-hastags-to-neibors',
			name: 'Add hashtag to note and neibors',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				var withNeiborsTree: string[] = await expandToNeibors(this.app, [initialFile.path], this.settings.aroundNumber)
				var districtFiles: string[] = [...new Set(withNeiborsTree)]
				districtFiles.forEach(async (fp) => addTagForFile(this.app, fp, this.settings.workingTag)) // async!
			}
		})
		this.addCommand({
			id: 'remove-hastags-to-neibors',
			name: 'Remove hashtag from note and neibors',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				var withNeiborsTree: string[] = await expandToNeibors(this.app, [initialFile.path], this.settings.aroundNumber)
				var districtFiles: string[] = [...new Set(withNeiborsTree)]
				districtFiles.forEach(async (fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
			}
		})
		this.addCommand({
			id: 'total-remove-hashtag',
			name: 'Totally remove the hashtag from tree',
			callback: () => {
				var districtFiles: string[] = utils.getAllFilesWithTag(this.app, this.settings.workingTag)
				districtFiles.forEach(async (fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
			}
		})

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, settings.DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

