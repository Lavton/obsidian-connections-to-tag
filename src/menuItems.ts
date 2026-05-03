import type { App, TFile, TFolder } from "obsidian";
import { getAllFilesInFolderWithFrontmatter, getAllMarkdownFiles, moveFileFromAndRemoveMeta } from "src/folderUtils";
import type { Traversal } from "./models/traversal";
import type { FocusMaker } from "./service/focus_marker";

function normalizePath(path: string): string {
	return path.replace(/\/+$/, '');
}

export function isResultFolder(folder: TFolder, resultFolder: string): boolean {
	return normalizePath(folder.path) === normalizePath(resultFolder)
}

export async function moveBackFromFolder(app: App, dirpath: string, movingTag: string): Promise<void> {
	const districtFiles: TFile[] = getAllFilesInFolderWithFrontmatter(app, dirpath, movingTag)

	await Promise.all(districtFiles.map((fp) => moveFileFromAndRemoveMeta(app, fp, movingTag)))
}

export async function applyChainToFile(app: App, file: TFile,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<void> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return
	}
	const derivativeNotes = await traversal.go(app, [file])
	await focusMaker.doDependendOn(derivativeNotes)
}
export async function rollbackChainFromFile(app: App, file: TFile,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<void> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return
	}
	const derivativeNotes = await traversal.go(app, [file])
	await focusMaker.reverseDependendOn(derivativeNotes)
}
export async function applyChainToFolder(app: App, folder: TFolder,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<void> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return
	}
	const initial = getAllMarkdownFiles(folder)
	const derivativeNotes = await traversal.go(app, initial)
	await focusMaker.doDependendOn(derivativeNotes)
}
export async function rollbackChainFromFolder(app: App, folder: TFolder,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): Promise<void> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return
	}
	const initial = getAllMarkdownFiles(folder)
	const derivativeNotes = await traversal.go(app, initial)
	await focusMaker.reverseDependendOn(derivativeNotes)
}
