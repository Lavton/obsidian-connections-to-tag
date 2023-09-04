import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as internal from 'stream';
import * as settings from 'src/settings'
import {addTagForFile, removeTagFromFile} from 'src/tagsModifier'
import * as utils from 'src/utils'
import {findAllSubtree} from 'src/parentChild'
import { expandToNeibors } from 'src/neibors';

export default class ConnectionsToTagPlugin extends Plugin {
	settings: settings.ConnectionsToTagSettings;

	async onload() {
		await this.loadSettings();


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ConnectionsToTagSettingTab(this.app, this));
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
				districtFiles.forEach(async(fp) => addTagForFile(this.app, fp, this.settings.workingTag)) // async!
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
				districtFiles.forEach(async(fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
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
				districtFiles.forEach(async(fp) => addTagForFile(this.app, fp, this.settings.workingTag)) // async!
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
				districtFiles.forEach(async(fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
			}
		})
		this.addCommand({
			id: 'total-remove-hashtag',
			name: 'Totally remove the hashtag from tree',
			callback: () => {
				var districtFiles: string[] = utils.getAllFilesWithTag(this.app, this.settings.workingTag)
				districtFiles.forEach(async(fp) => removeTagFromFile(this.app, fp, this.settings.workingTag)) // async!
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

class ConnectionsToTagSettingTab extends PluginSettingTab {
	plugin: ConnectionsToTagPlugin;

	constructor(app: App, plugin: ConnectionsToTagPlugin) {
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
