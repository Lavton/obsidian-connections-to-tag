import type { App, TFile } from "obsidian";
import { createStateSnapshot, type StateSnapshot } from "src/cancellation";
import { moveFileFromAndRemoveMeta, moveFileToAndAddMeta } from "src/folderUtils";
import type { FocusMakerSettings } from "src/settings/settings";
import * as settings from 'src/settings/settings'
import { addTagToFileIfNeeded, removeTagFromFileIfNeeded } from "src/tagsUtils";
import type { FocusProgressOptions } from "./operation_control";

export type FocusResult = {
	updatedFiles: TFile[];
	snapshot: StateSnapshot;
}

export class FocusMaker {
	settings: FocusMakerSettings
	app: App
	constructor(settings: FocusMakerSettings, app: App) {
		this.settings = settings
		this.app = app
	}
	withMark(markNoteModes: settings.MarkNoteMode[]): FocusMaker {
		return new FocusMaker({
			...this.settings,
			markNoteModes,
		}, this.app)
	} 

	async doDependendOn(files: TFile[], options?: FocusProgressOptions): Promise<FocusResult> {
		const previousPaths: string[] = []
		const markModes = this.settings.markNoteModes
		const updatedFiles: TFile[] = []
		for (const f of files) {
			if (options?.signal?.isCancelled()) {
				break
			}
			// await waitForTestOperationDelay()
			if (options?.signal?.isCancelled()) {
				break
			}
			previousPaths.push(f.path)
			let currentFile = f
			if (markModes.includes(settings.MarkNoteMode.ADD_TAG)) {
				currentFile = await addTagToFileIfNeeded(this.app, currentFile, this.settings.resultTag)
			}
			if (markModes.includes(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
				currentFile = await moveFileToAndAddMeta(this.app, currentFile, this.settings.resultFolder, this.settings.movedNameFrontmatter)
			}
			updatedFiles.push(currentFile)
			options?.onProcessed?.(currentFile, updatedFiles.length, files.length)
		}
		const currentPaths = updatedFiles.map(f => f.path)
		const snapshot = createStateSnapshot(this.settings, currentPaths, previousPaths, "apply")
		return {updatedFiles, snapshot}
	}
	async reverseDependendOn(files: TFile[], options?: FocusProgressOptions): Promise<FocusResult> {
		const previousPaths: string[] = []
		const markModes = this.settings.markNoteModes
		const updatedFiles: TFile[] = []
		for (const f of files) {
			if (options?.signal?.isCancelled()) {
				break
			}
			await waitForTestOperationDelay()
			if (options?.signal?.isCancelled()) {
				break
			}
			previousPaths.push(f.path)
			let currentFile = f
			if (markModes.includes(settings.MarkNoteMode.ADD_TAG)) {
				currentFile = await removeTagFromFileIfNeeded(this.app, currentFile, this.settings.resultTag)
			}
			if (markModes.includes(settings.MarkNoteMode.MOVE_TO_FOLDER)) {
				currentFile = await moveFileFromAndRemoveMeta(this.app, currentFile, this.settings.movedNameFrontmatter)
			}
			updatedFiles.push(currentFile)
			options?.onProcessed?.(currentFile, updatedFiles.length, files.length)
		}
		const currentPaths = updatedFiles.map(f => f.path)
		const snapshot = createStateSnapshot(this.settings, currentPaths, previousPaths, "rollback")
		return {updatedFiles, snapshot}
	}
}
