import type { App, MenuItem, TFile } from "obsidian";
import { getAllFilesInFolderWithFrontmatter, moveFileFromAndRemoveMeta } from "./folderUtils";

export function moveBackFromFolder(item: MenuItem, dirpath: string, movingTag: string, app: App): void {
	item.setTitle("Move files back from the folder")
		.setIcon("undo-2")
		.onClick(() => {
				var districtFiles: TFile[] = getAllFilesInFolderWithFrontmatter(this.app, dirpath, movingTag)

				console.log(districtFiles.length)
				districtFiles.forEach(async (fp) => await moveFileFromAndRemoveMeta(this.app, fp, movingTag))
			
			console.log("will undo")
		});
}
