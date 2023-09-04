import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as internal from 'stream';
import * as settings from 'src/settings'
import {tagData} from 'src/tagsModifier'
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
			id: 'add-hashtags',
			name: 'Adding hashtags to tree',
			 editorCallback: async (editor: Editor, view: MarkdownView) => {
				var initialFile = view.file
				if (initialFile == null) {
					return
				}
				// console.log(view.file)
		   		// const sel = editor.getSelection()
				// var logData = await tagData(this.app, initialFile, "parents")
				// console.log(logData)
				console.log("children", await findAllSubtree(this.app, initialFile.path, this.settings.isFirstTagLineParentWhenEmpty, this.settings.parentsTag))
				// console.log(`You have selected: ${sel}`);
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
				// console.log(view.file)
		   		// const sel = editor.getSelection()
				// var logData = await tagData(this.app, initialFile, "parents")
				// if (logData == null) {
					// return 
				// }
				console.log("oooo")
				console.log("neibors", await expandToNeibors(this.app, [initialFile.path], this.settings.aroundNumber))
				// this.app.metadataCache.getFirstLinkpathDest("bbbbb", "ignore_1/note 23.md")?.path <- поиск полного пути.
				// console.log(utils.getNotePaths(logData, initialFile.path, this.app))
				// console.log(`You have selected: ${sel}`);
			}
		})
		this.addCommand({
			id: 'total-remove-hashtag',
			name: 'Totally remove the hashtag from tree',
			callback: () => {
				console.log("remove hashtag totally")
			}
		})

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		// this.addCommand({
		// 	id: 'move-files-with-tag-forward',
		// 	name: 'Forward move files with tags to dir',
		// 	callback: async () => {
		// 		var files = forward.getForwardFiles(this.app, this.settings.workingTag, this.settings.workingFolder)
		// 		await forward.createFolderIfNotExist(this.app, this.settings.workingFolder)
		// 		console.log("forward files", files)
		// 		files.forEach(file => {
		// 			forward.moveFileAndAddMeta(this.app, file, this.settings.workingFolder, this.settings.reverseTag)
		// 		})
		// 	}
		// });
		// this.addCommand({
		// 	id: 'move-files-with-tag-backward',
		// 	name: 'Backward move files with tags to their original dir',
		// 	callback: async () => {
		// 		var files = backward.getBackwardFiles(this.app, this.settings.workingFolder)
		// 		console.log("backward files", files)
		// 		files.forEach(file => {
		// 			backward.moveFileAndRemoveMeta(this.app, file, this.settings.workingFolder, this.settings.reverseTag)
		// 		})
		// 	}
		// });
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
