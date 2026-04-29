import type { App, MenuItem, TFile, TFolder } from "obsidian";
import { getAllFilesInFolderWithFrontmatter, moveFileFromAndRemoveMeta } from "./folderUtils";
import type { Traversal } from "./models/traversal";
import type { FocusMaker } from "./service/focus_marker";
import { getAllMarkdownFiles } from "src/folderUtils"

export function moveBackFromFolder(item: MenuItem, dirpath: string, movingTag: string, app: App): void {
	item.setTitle("Move files back from the folder")
		.setIcon("undo-2") // https://lucide.dev/icons/
		.onClick(() => {
			var districtFiles: TFile[] = getAllFilesInFolderWithFrontmatter(this.app, dirpath, movingTag)

			console.log(districtFiles.length)
			districtFiles.forEach(async (fp) => await moveFileFromAndRemoveMeta(this.app, fp, movingTag))

			console.log("will undo")
		});
}

export function applyChainToFile(item: MenuItem, file: TFile, app: App,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): void {
	item.setTitle("Apply chain starts with the file")
		.setIcon("redo-2")
		.onClick(async () => {
			const traversal = await getTraversal()
			if (traversal == null) {
				return
			}
			const derivativeNotes = await traversal.go(app, [file])
			focusMaker.doDependendOn(derivativeNotes)
		});
}
export function rollbackChainFromFile(item: MenuItem, file: TFile, app: App,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): void {
	item.setTitle("Rollback chain starts with the file")
		.setIcon("undo-2")
		.onClick(async () => {
			const traversal = await getTraversal()
			if (traversal == null) {
				return
			}
			const derivativeNotes = await traversal.go(app, [file])
			focusMaker.reverseDependendOn(derivativeNotes)
		});
}
export function applyChainToFolder(item: MenuItem, folder: TFolder, app: App,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): void {
	item.setTitle("Apply chain starts with every sub-file")
		.setIcon("redo-2")
		.onClick(async () => {
			const traversal = await getTraversal()
			if (traversal == null) {
				return
			}
			const initial = getAllMarkdownFiles(folder)
			const derivativeNotes = await traversal.go(app, initial)
			focusMaker.doDependendOn(derivativeNotes)
		});
}
export function rollbackChainFromFolder(item: MenuItem, folder: TFolder, app: App,
	getTraversal: () => Promise<Traversal | null>, focusMaker: FocusMaker): void {
	item.setTitle("Rollback chain starts with every sub-file")
		.setIcon("undo-2")
		.onClick(async () => {
			const traversal = await getTraversal()
			if (traversal == null) {
				return
			}
			const initial = getAllMarkdownFiles(folder)
			const derivativeNotes = await traversal.go(app, initial)
			focusMaker.reverseDependendOn(derivativeNotes)
		});
}
