import type { App, TFile, TFolder } from "obsidian";
import { getAllFilesInFolderWithFrontmatter, getAllMarkdownFiles } from "src/folderUtils";
import type { Traversal } from "./models/traversal";
import type { FocusMaker } from "./service/focus_marker";
import { MarkNoteMode } from "./settings/settings";
import type { StateSnapshot } from "./cancellation";
import { runFocusOnlyOperation, runTraversalFocusOperation } from "./service/focus_operation";

function normalizePath(path: string): string {
	return path.replace(/\/+$/, '');
}

export function isResultFolder(folder: TFolder, resultFolder: string): boolean {
	return normalizePath(folder.path) === normalizePath(resultFolder)
}

export async function moveBackFromFolder(app: App, dirpath: string, movingTag: string, focusMaker: FocusMaker): Promise<StateSnapshot> {
							// menuItems.moveBackFromFolder(this.app, current_settings.resultFolder, current_settings.movedNameFrontmatter, focusMaker)

	const districtFiles: TFile[] = getAllFilesInFolderWithFrontmatter(app, dirpath, movingTag)
	return await runFocusOnlyOperation({
		app,
		title: "Move files back from folder",
		files: districtFiles,
		focusMaker: focusMaker.withMark([MarkNoteMode.MOVE_TO_FOLDER]),
		mode: "rollback",
	})
}

export async function applyChainToFile(app: App, file: TFile,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	return await runTraversalFocusOperation({
		app,
		title: "Apply rule chain",
		seed: [file],
		getTraversal,
		focusMaker,
		mode: "apply",
	})
}
export async function rollbackChainFromFile(app: App, file: TFile,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	return await runTraversalFocusOperation({
		app,
		title: "Rollback rule chain",
		seed: [file],
		getTraversal,
		focusMaker,
		mode: "rollback",
	})
}
export async function applyChainToFiles(app: App, files: TFile[],
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	return await runTraversalFocusOperation({
		app,
		title: "Apply rule chain",
		seed: files,
		getTraversal,
		focusMaker,
		mode: "apply",
	})
}
export async function rollbackChainFromFiles(app: App, files: TFile[],
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	return await runTraversalFocusOperation({
		app,
		title: "Rollback rule chain",
		seed: files,
		getTraversal,
		focusMaker,
		mode: "rollback",
	})
}
export async function applyChainToFolder(app: App, folder: TFolder,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	const initial = getAllMarkdownFiles(folder)
	return await runTraversalFocusOperation({
		app,
		title: "Apply rule chain",
		seed: initial,
		getTraversal,
		focusMaker,
		mode: "apply",
	})
}
export async function rollbackChainFromFolder(app: App, folder: TFolder,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<StateSnapshot | null> {
	const initial = getAllMarkdownFiles(folder)
	return await runTraversalFocusOperation({
		app,
		title: "Rollback rule chain",
		seed: initial,
		getTraversal,
		focusMaker,
		mode: "rollback",
	})
}
