import { TFile, type App } from "obsidian"

export async function moveFileToAndAddMeta(app: App, file: TFile, distDirectory: string, reverseTag: string) {
	const distDir = distDirectory.endsWith("/") ? distDirectory : (distDirectory + "/")
	createFolderIfNotExist(app, distDir)
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		frontmatter[reverseTag] = file?.path
	})
	// console.log("whant to", file.path, "->", distDir + file.name)
	await app.vault.rename(file, distDir + file?.name)
}

async function createFolderIfNotExist(app: App, distDirectory: string) {
	// @ts-ignore
	var isExists = await app.vault.exists(distDirectory)
	if (!(isExists)) {
		await app.vault.createFolder(distDirectory)
	}
}


export async function moveFileFromAndRemoveMeta(app: App, file: TFile, reverseTag: string) {
	var frontmatter = app.metadataCache.getFileCache(file)?.frontmatter
	if (frontmatter == null) {
		// new Notice(`in file ${filename} no frontmatter exisist`)
		return
	}
	var originalDist: string = frontmatter[reverseTag]
	if (originalDist == null) {
		// new Notice(`in file ${filename} ${reverseTag} is not in frontmatter`)
		// console.log(filename, frontmatter, reverseTag)
		return
	}
	try {
		await app.vault.rename(file, originalDist)
		await app.fileManager.processFrontMatter(file, (frontmatter) => {
			delete frontmatter[reverseTag]
		})
	} catch (error: any) {
		console.log(error)
		// new Notice(`cant move ${filename}\nback to ${originalDist}. \nMaybe original folder was deleted?`)
	}
}

export async function removeMeta(app: App, filename: string, reverseTag: string) {
	var file = app.vault.getAbstractFileByPath(filename)
	if (!(file instanceof TFile)) {
		return
	}
	app.fileManager.processFrontMatter(file, (frontmatter) => {
		delete frontmatter[reverseTag]
	})
}
