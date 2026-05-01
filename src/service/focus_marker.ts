import type { App, TFile } from "obsidian";
import { moveFileFromAndRemoveMeta, moveFileToAndAddMeta } from "src/folderUtils";
import type { FocusMakerSettings } from "src/settings/settings";
import * as settings from 'src/settings/settings'
import { addTagToFileIfNeeded, removeTagFromFileIfNeeded } from "src/tagsUtils";

export class FocusMaker {
	settings: FocusMakerSettings
	app: App
	constructor(settings: FocusMakerSettings, app: App) {
		this.settings = settings
		this.app = app
	}

	async doDependendOn(files: TFile[]): Promise<TFile[]> {
		const markModes = this.settings.markNoteModes
		// const markModes = [settings.MarkNoteMode.ADD_TAG, settings.MarkNoteMode.MOVE_TO_FOLDER] // debug
		const updatedFiles: TFile[] = []
		for (const f of files) {
			let currentFile = f
			if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
				currentFile = await addTagToFileIfNeeded(this.app, currentFile, this.settings.resultTag)
			}
			if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
				currentFile = await moveFileToAndAddMeta(this.app, currentFile, this.settings.resultFolder, this.settings.movedNameFrontmatter)
			}
			updatedFiles.push(currentFile)
		}
		return updatedFiles
	}
	async reverseDependendOn(files: TFile[]): Promise<TFile[]> {
		const markModes = this.settings.markNoteModes
		// const markModes = [settings.MarkNoteMode.ADD_TAG, settings.MarkNoteMode.MOVE_TO_FOLDER] // debug
		const updatedFiles: TFile[] = []
		for (const f of files) {
			let currentFile = f
			if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
				currentFile = await removeTagFromFileIfNeeded(this.app, currentFile, this.settings.resultTag)
			}
			if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
				currentFile = await moveFileFromAndRemoveMeta(this.app, currentFile, this.settings.movedNameFrontmatter)
			}
			updatedFiles.push(currentFile)
		}
		return updatedFiles
	}
}
