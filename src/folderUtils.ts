import { TFile, TFolder, Vault, parseYaml, type App, type EventRef } from "obsidian"

function getFileByPathOrCurrent(app: App, path: string, current: TFile): TFile {
	const movedFile = app.vault.getAbstractFileByPath(path)
	return movedFile instanceof TFile ? movedFile : current
}

function getFileByPath(app: App, path: string): TFile | null {
	const file = app.vault.getAbstractFileByPath(path)
	return file instanceof TFile ? file : null
}

function getCurrentFile(app: App, file: TFile): TFile | null {
	const currentFile = getFileByPath(app, file.path)
	if (currentFile != null) {
		return currentFile
	}
	const sameNameFiles = app.vault.getMarkdownFiles().filter((candidate) => candidate.name === file.name)
	return sameNameFiles.length === 1 ? sameNameFiles[0] : null
}

interface FolderAccessStrategy {
	readFrontmatter(app: App, file: TFile): Promise<Record<string, any> | null>
	rename(app: App, file: TFile, newPath: string): Promise<void>
	isFrontmatterInFile(app: App, file: TFile, frontmatter: string): boolean
}

class CachedFolderAccessStrategy implements FolderAccessStrategy {
	async readFrontmatter(app: App, file: TFile): Promise<Record<string, any> | null> {
		return app.metadataCache.getFileCache(file)?.frontmatter ?? null
	}

	async rename(app: App, file: TFile, newPath: string): Promise<void> {
		await app.fileManager.renameFile(file, newPath)
	}

	isFrontmatterInFile(app: App, file: TFile, frontmatter: string): boolean {
		const fileCache = app.metadataCache.getFileCache(file);
		if (fileCache == null) return false
		return fileCache.frontmatter?.[frontmatter] !== undefined;
	}
}

class DiskCheckedFolderAccessStrategy implements FolderAccessStrategy {
	private getFrontmatterBlock(content: string): string | null {
		if (!content.startsWith("---")) {
			return null
		}
		const lines = content.split("\n")
		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === "---") {
				return lines.slice(1, i).join("\n")
			}
		}
		return null
	}

	private async readFrontmatterFromDisk(app: App, file: TFile): Promise<Record<string, any> | null> {
		const content = await app.vault.read(file)
		const frontmatterBlock = this.getFrontmatterBlock(content)
		if (frontmatterBlock == null) {
			return null
		}
		return parseYaml(frontmatterBlock) ?? null
	}

	private waitForVaultRename(app: App, oldPath: string, newPath: string): Promise<void> {
		return new Promise((resolve) => {
			let ref: EventRef | null = null
			const done = () => {
				if (ref != null) {
					app.vault.offref(ref)
					ref = null
				}
				window.clearTimeout(timeoutId)
				resolve()
			}
			const timeoutId = window.setTimeout(done, 1000)
			ref = app.vault.on("rename", (renamedFile, previousPath) => {
				if (previousPath === oldPath && renamedFile.path === newPath) {
					done()
				}
			})
		})
	}

	private async renameAndWait(app: App, file: TFile, newPath: string): Promise<void> {
		const oldPath = file.path
		const renameWait = this.waitForVaultRename(app, oldPath, newPath)
		await app.fileManager.renameFile(file, newPath)
		await renameWait
	}

	async readFrontmatter(app: App, file: TFile): Promise<Record<string, any> | null> {
		return await this.readFrontmatterFromDisk(app, file)
	}

	async rename(app: App, file: TFile, newPath: string): Promise<void> {
		await this.renameAndWait(app, file, newPath)
	}

	isFrontmatterInFile(app: App, file: TFile, frontmatter: string): boolean {
		const fileCache = app.metadataCache.getFileCache(file);
		if (fileCache == null) return false
		return fileCache.frontmatter?.[frontmatter] !== undefined;
	}
}

const folderAccessStrategy: FolderAccessStrategy = new CachedFolderAccessStrategy()

export async function moveFileToAndAddMeta(app: App, file: TFile, distDirectory: string, reverseTag: string): Promise<TFile> {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) {
		return file
	}
	const distDir = distDirectory.endsWith("/") ? distDirectory : (distDirectory + "/")
	if (currentFile.path.startsWith(distDir)) {
		return currentFile
	}
	await createFolderIfNotExist(app, distDir)
	await app.fileManager.processFrontMatter(currentFile, (frontmatter) => {
		frontmatter[reverseTag] = currentFile.path
	})
	// console.log("whant to", file.path, "->", distDir + file.name)
	const newPath = await renameFileWithCheckDoublicates(app, distDir, currentFile)
	return getFileByPathOrCurrent(app, newPath, currentFile)
}

async function renameFileWithCheckDoublicates(app: App, distDir: string, currentFile: TFile): Promise<string> {
	const baseName = currentFile.basename
	const extension = currentFile.extension.length > 0 ? `.${currentFile.extension}` : ""
	let newPath = distDir + currentFile.name
	let index = 1
	while (app.vault.getAbstractFileByPath(newPath) != null) {
		newPath = `${distDir}${baseName}_${index}${extension}`
		index++
	}
	await folderAccessStrategy.rename(app, currentFile, newPath)
	return newPath
}

async function createFolderIfNotExist(app: App, distDirectory: string) {
	// @ts-ignore
	var isExists = await app.vault.exists(distDirectory)
	if (!(isExists)) {
		await app.vault.createFolder(distDirectory)
	}
}


export async function moveFileFromAndRemoveMeta(app: App, file: TFile, reverseTag: string): Promise<TFile> {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) {
		return file
	}
	var frontmatter = await folderAccessStrategy.readFrontmatter(app, currentFile)
	if (frontmatter == null) {
		// new Notice(`in file ${filename} no frontmatter exisist`)
		return currentFile
	}
	var originalDist: string = frontmatter[reverseTag]
	if (originalDist == null) {
		// new Notice(`in file ${filename} ${reverseTag} is not in frontmatter`)
		// console.log(filename, frontmatter, reverseTag)
		return currentFile
	}
	try {
		await folderAccessStrategy.rename(app, currentFile, originalDist)
		const movedFile = getFileByPath(app, originalDist) ?? getCurrentFile(app, currentFile)
		if (movedFile == null) {
			return currentFile
		}
		await app.fileManager.processFrontMatter(movedFile, (frontmatter) => {
			delete frontmatter[reverseTag]
		})
		return movedFile
	} catch (error: any) {
		console.log(error)
		// new Notice(`cant move ${filename}\nback to ${originalDist}. \nMaybe original folder was deleted?`)
		return currentFile
	}
}
export async function removeMetaFromFile(app: App, file: TFile, reverseTag: string) {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) {
		return
	}
	var frontmatter = await folderAccessStrategy.readFrontmatter(app, currentFile)
	if (frontmatter == null || frontmatter[reverseTag] === undefined) {
		// new Notice(`in file ${filename} no frontmatter exisist`)
		return
	}
	await app.fileManager.processFrontMatter(currentFile, (frontmatter) => {
		delete frontmatter[reverseTag]
	})
}


function isFrontmatterInFile(app: App, file: TFile, frontmatter: string): boolean {
	if (getCurrentFile(app, file) == null) {
		return false
	}
	return folderAccessStrategy.isFrontmatterInFile(app, file, frontmatter)
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
