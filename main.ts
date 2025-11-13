import { App, Editor, getLinkpath, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as settings from 'src/settings/settings'
import { addTagForFile, removeTagFromFile } from 'src/tagsModifier'
import * as utils from 'src/utils'
import { findAllSubtree } from 'src/parentChild'
import { expandToNeibors } from 'src/neibors';
import { getBackwardFilesFromFronmatter, getForwardFilesFromFrontmatter } from 'src/utils';
import { YamlConnectionTag } from 'src/models/connections';
import { ChainTraversal, StepTraversal } from 'src/service/chain_traversal';
import { getDefaultChain } from 'src/settings/default_chain';
import type { Chain, ChainStep } from 'src/models/chain';
import { addTagToFileIfNeeded, removeTagFromFileIfNeeded } from 'src/tagsUtils';
import { moveFileToAndAddMeta, moveFileFromAndRemoveMeta } from 'src/folderUtils';



export default class ConnectionsToTagPlugin extends Plugin implements settings.SettingsSaver {
	settings: settings.ConnectionsToTagSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new settings.ConnectionsToTagSettingTab(this.app, this));
		this.addCommand({
			id: 'implement-chain',
			name: 'Apply rule chain starts with this file',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				const chain: Chain = getDefaultChain()
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				const markModes = current_settings.markNoteModes
				const traversal = new ChainTraversal(chain)

				const derivativeNotes = await traversal.go(this.app, [initialFile])
				for (const f of derivativeNotes) {
					if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
						await addTagToFileIfNeeded(this.app, f, current_settings.resultTag)
					}
					if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
						await moveFileToAndAddMeta(this.app, f, current_settings.resultFolder, current_settings.movedNameFrontmatter)
					}
				}
			}
		})
		this.addCommand({
			id: 'reverse-chain',
			name: 'Rollback rule chain starts with this file',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				const chain: Chain = getDefaultChain()
				const current_settings = settings.NEW_DEFAULT_SETTINGS
				const markModes = current_settings.markNoteModes
				const traversal = new ChainTraversal(chain)

				const derivativeNotes = await traversal.go(this.app, [initialFile])
				for (const f of derivativeNotes) {
					if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
						await removeTagFromFileIfNeeded(this.app, f, current_settings.resultTag)
					}
					if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
						await moveFileFromAndRemoveMeta(this.app, f, current_settings.movedNameFrontmatter)
					}
				}
			}
		})
		// this.addCommand({
		// 	id: 'implement-rule',
		// 	name: 'Do tree',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		var initialFile = view.file
		// 		if (initialFile == null) {
		// 			return
		// 		}
		// 		const chain: Chain = getDefaultChain()
		// 		const firstStep: ChainStep = chain.chainSteps[0]
		// 		const traversal = new StepTraversal(firstStep)
		// 		const res = await traversal.go(this.app, [initialFile])

		// 		console.log({res})
		// 		for (const f of res) {
		// 			// addTagToFileIfNeeded(this.app, f, "hello")
		// 			moveFileToAndAddMeta(this.app, f, "moved", "focuseOn")
		// 			removeTagFromFileIfNeeded(this.app, f, "hello")
		// 			moveFileFromAndRemoveMeta(this.app, f, "focuseOn")
		// 		}
		// 	}

		// })
		// this.addCommand({
		// 	id: 'add-hashtags-tree',
		// 	name: 'Add hashtag to tree',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		var initialFile = view.file
		// 		if (initialFile == null) {
		// 			return
		// 		}
		// 		var subTreeFilesPath: string[] = await findAllSubtree(this.app, initialFile.path, this.settings.isFirstTagLineParentWhenEmpty, this.settings.parentsTag)
		// 		// console.log("files", subTreeFilesPath)
		// 		var withNeiborsTree: string[] = await expandToNeibors(this.app, subTreeFilesPath, this.settings.aroundNumber)
		// 		var districtFiles: string[] = [...new Set(withNeiborsTree)]
		// 		// console.log("will add to", districtFiles)
		// 		districtFiles.forEach(async (fp) => addTagForFile(this.app, fp, this.settings.workingTag)) // async!
		// 	}
		// });
		// this.addCommand({
		// 	id: 'remove-hashtags-tree',
		// 	name: 'Remove hashtag from tree',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		var initialFile = view.file
		// 		if (initialFile == null) {
		// 			return
		// 		}
		// 		var subTreeFilesPath: string[] = await findAllSubtree(this.app, initialFile.path, this.settings.isFirstTagLineParentWhenEmpty, this.settings.parentsTag)
		// 		var withNeiborsTree: string[] = await expandToNeibors(this.app, subTreeFilesPath, this.settings.aroundNumber)
		// 		var districtFiles: string[] = [...new Set(withNeiborsTree)]
		// 		// console.log("will remove from", districtFiles)
		// 		districtFiles.forEach(async (fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
		// 	}
		// })
		// this.addCommand({
		// 	id: 'add-hastags-to-neibors',
		// 	name: 'Add hashtag to note and neibors',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		var initialFile = view.file
		// 		if (initialFile == null) {
		// 			return
		// 		}
		// 		var withNeiborsTree: string[] = await expandToNeibors(this.app, [initialFile.path], this.settings.aroundNumber)
		// 		var districtFiles: string[] = [...new Set(withNeiborsTree)]
		// 		districtFiles.forEach(async (fp) => addTagForFile(this.app, fp, this.settings.workingTag)) // async!
		// 	}
		// })
		// this.addCommand({
		// 	id: 'remove-hastags-to-neibors',
		// 	name: 'Remove hashtag from note and neibors',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		var initialFile = view.file
		// 		if (initialFile == null) {
		// 			return
		// 		}
		// 		var withNeiborsTree: string[] = await expandToNeibors(this.app, [initialFile.path], this.settings.aroundNumber)
		// 		var districtFiles: string[] = [...new Set(withNeiborsTree)]
		// 		districtFiles.forEach(async (fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
		// 	}
		// })
		// this.addCommand({
		// 	id: 'total-remove-hashtag',
		// 	name: 'Totally remove the hashtag from tree',
		// 	callback: () => {
		// 		var districtFiles: string[] = utils.getAllFilesWithTag(this.app, this.settings.workingTag)
		// 		districtFiles.forEach(async (fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
		// 	}
		// })

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

