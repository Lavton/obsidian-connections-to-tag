import type { App, TFile, TFolder } from "obsidian";
import { getAllFilesInFolderWithFrontmatter, getAllMarkdownFiles, moveFileFromAndRemoveMeta } from "src/folderUtils";
import type { Traversal } from "./models/traversal";
import type { FocusMaker } from "./service/focus_marker";
import { MarkNoteMode } from "./settings/settings";
import type { StateSnapshot } from "./cancellation";

function normalizePath(path: string): string {
	return path.replace(/\/+$/, '');
}

export function isResultFolder(folder: TFolder, resultFolder: string): boolean {
	return normalizePath(folder.path) === normalizePath(resultFolder)
}

export async function moveBackFromFolder(app: App, dirpath: string, movingTag: string, focusMaker: FocusMaker): Promise<StateSnapshot> {
							// menuItems.moveBackFromFolder(this.app, current_settings.resultFolder, current_settings.movedNameFrontmatter, focusMaker)

	const districtFiles: TFile[] = getAllFilesInFolderWithFrontmatter(app, dirpath, movingTag)
	return (await focusMaker.withMark([MarkNoteMode.MOVE_TO_FOLDER]).reverseDependendOn(districtFiles)).snapshot
}

export async function applyChainToFile(app: App, file: TFile,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return null
	}
	const derivativeNotes = await traversal.go(app, [file])
	return (await focusMaker.doDependendOn(derivativeNotes)).snapshot
}
export async function rollbackChainFromFile(app: App, file: TFile,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return null
	}
	const derivativeNotes = await traversal.go(app, [file])
	return (await focusMaker.reverseDependendOn(derivativeNotes)).snapshot
}
export async function applyChainToFolder(app: App, folder: TFolder,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return null
	}
	const initial = getAllMarkdownFiles(folder)
	const derivativeNotes = await traversal.go(app, initial)
	return (await focusMaker.doDependendOn(derivativeNotes)).snapshot
}
export async function rollbackChainFromFolder(app: App, folder: TFolder,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return null
	}
	const initial = getAllMarkdownFiles(folder)
	const derivativeNotes = await traversal.go(app, initial)
	return (await focusMaker.reverseDependendOn(derivativeNotes)).snapshot
}
