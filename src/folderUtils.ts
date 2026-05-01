import { TFile, TFolder, Vault, type App } from "obsidian"

function getFileByPathOrCurrent(app: App, path: string, current: TFile): TFile {
	const movedFile = app.vault.getAbstractFileByPath(path)
	return movedFile instanceof TFile ? movedFile : current
}

export async function moveFileToAndAddMeta(app: App, file: TFile, distDirectory: string, reverseTag: string): Promise<TFile> {
	const distDir = distDirectory.endsWith("/") ? distDirectory : (distDirectory + "/")
	if (file.path.startsWith(distDir)) {
		return file
	}
	await createFolderIfNotExist(app, distDir)
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		frontmatter[reverseTag] = file?.path
	})
	// console.log("whant to", file.path, "->", distDir + file.name)
	const newPath = distDir + file.name
	await app.vault.rename(file, newPath)
	return getFileByPathOrCurrent(app, newPath, file)
}

async function createFolderIfNotExist(app: App, distDirectory: string) {
	// @ts-ignore
	var isExists = await app.vault.exists(distDirectory)
	if (!(isExists)) {
		await app.vault.createFolder(distDirectory)
	}
}


export async function moveFileFromAndRemoveMeta(app: App, file: TFile, reverseTag: string): Promise<TFile> {
	var frontmatter = app.metadataCache.getFileCache(file)?.frontmatter
	if (frontmatter == null) {
		// new Notice(`in file ${filename} no frontmatter exisist`)
		return file
	}
	var originalDist: string = frontmatter[reverseTag]
	if (originalDist == null) {
		// new Notice(`in file ${filename} ${reverseTag} is not in frontmatter`)
		// console.log(filename, frontmatter, reverseTag)
		return file
	}
	try {
		await app.vault.rename(file, originalDist)
		const movedFile = getFileByPathOrCurrent(app, originalDist, file)
		await app.fileManager.processFrontMatter(movedFile, (frontmatter) => {
			delete frontmatter[reverseTag]
		})
		return movedFile
	} catch (error: any) {
		console.log(error)
		// new Notice(`cant move ${filename}\nback to ${originalDist}. \nMaybe original folder was deleted?`)
		return file
	}
}
export async function removeMetaFromFile(app: App, file: TFile, reverseTag: string) {
	var frontmatter = app.metadataCache.getFileCache(file)?.frontmatter
	if (frontmatter == null) {
		// new Notice(`in file ${filename} no frontmatter exisist`)
		return
	}
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		delete frontmatter[reverseTag]
	})
}


function isFrontmatterInFile(app: App, file: TFile, frontmatter: string): boolean {
	const fileCache = app.metadataCache.getFileCache(file);
	if (fileCache == null) return false
	return fileCache.frontmatter?.[frontmatter] !== undefined;
}

export function getAllFilesWithFrontmatter(app: App, frontmatter: string): TFile[] {
	const files: TFile[] = app.vault.getMarkdownFiles();
	return files
		.filter(f => f instanceof TFile)
		.filter(f =>
			isFrontmatterInFile(app, f, frontmatter)
		)
}

export function toCanonicalDir(dirPath: string): string {
	return dirPath.endsWith("/") ? dirPath : (dirPath + "/")
}
function isFileIsChild(file: TFile, parentPath: string): boolean {
	return file.path.startsWith(toCanonicalDir(parentPath))
}

export function getAllFilesInFolderWithFrontmatter(app: App, folder: string, frontmatter: string): TFile[] {
	const files: TFile[] = app.vault.getMarkdownFiles();
	return files
		.filter(f => f instanceof TFile)
		.filter(f => isFileIsChild(f, folder))
		.filter(f =>
			isFrontmatterInFile(app, f, frontmatter)
		)
}
export function getAllFilesInFolder(app: App, folder: string): TFile[] {
	const files: TFile[] = app.vault.getMarkdownFiles();
	return files
		.filter(f => f instanceof TFile)
		.filter(f => isFileIsChild(f, folder))
}

export function getAllMarkdownFiles(folder: TFolder): TFile[] {
    const mdFiles: TFile[] = [];
    
    Vault.recurseChildren(folder, (file) => {
        if (file instanceof TFile && file.extension === 'md') {
            mdFiles.push(file);
        }
    });
    
    return mdFiles;
}
