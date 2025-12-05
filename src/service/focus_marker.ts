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

	async doDependendOn(files: TFile[]) {
		const markModes = this.settings.markNoteModes
		for (const f of files) {
			if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
				await addTagToFileIfNeeded(this.app, f, this.settings.resultTag)
			}
			if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
				await moveFileToAndAddMeta(this.app, f, this.settings.resultFolder, this.settings.movedNameFrontmatter)
			}
		}
	}
	async reverseDependendOn(files: TFile[]) {
		const markModes = this.settings.markNoteModes
		for (const f of files) {
			if (markModes.contains(settings.MarkNoteMode.ADD_TAG)) {
				await removeTagFromFileIfNeeded(this.app, f, this.settings.resultTag)
			}
			if (markModes.contains(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
				await moveFileFromAndRemoveMeta(this.app, f, this.settings.movedNameFrontmatter)
			}
		}
	}
}
