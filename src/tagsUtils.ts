
import { TFile, App, getAllTags, parseYaml } from "obsidian";



export async function addTagToFileIfNeeded(app: App, file: TFile, tag: string): Promise<TFile> {
	if (tag.startsWith("#")) {
		return await addTagToFileText(app, file, tag)
	}
	return await addTagToFileFronmatter(app, file, tag)
}

export async function removeTagFromFileIfNeeded(app: App, file: TFile, tag: string): Promise<TFile> {
	if (tag.startsWith("#")) {
		return await removeTagFromFileText(app, file, tag)
	}
	return await removeTagFromFileFrontmatter(app, file, tag)
}

function getCurrentFile(app: App, file: TFile): TFile | null {
	const currentFile = app.vault.getAbstractFileByPath(file.path)
	if (currentFile instanceof TFile) {
		return currentFile
	}
	const sameNameFiles = app.vault.getMarkdownFiles().filter((candidate) => candidate.name === file.name)
	return sameNameFiles.length === 1 ? sameNameFiles[0] : null
}

interface TagsAccessStrategy {
	shouldAddTextTag(app: App, file: TFile, tag: string): Promise<boolean>
	shouldRemoveTextTag(app: App, file: TFile, tag: string): Promise<boolean>
	shouldAddFrontmatterTag(app: App, file: TFile, tag: string): Promise<boolean>
	shouldRemoveFrontmatterTag(app: App, file: TFile, tag: string): Promise<boolean>
	isFileMatchedByTag(app: App, file: TFile, tag: string): boolean
}

class CachedTagsAccessStrategy implements TagsAccessStrategy {
	async shouldAddTextTag(app: App, file: TFile, tag: string): Promise<boolean> {
		return !isTagInFile(app, file, tag)
	}

	async shouldRemoveTextTag(app: App, file: TFile, tag: string): Promise<boolean> {
		return isTagInFile(app, file, tag)
	}

	async shouldAddFrontmatterTag(app: App, file: TFile, tag: string): Promise<boolean> {
		return !isTagInFile(app, file, tag)
	}

	async shouldRemoveFrontmatterTag(app: App, file: TFile, tag: string): Promise<boolean> {
		return isTagInFile(app, file, "#" + tag)
	}

	isFileMatchedByTag(app: App, file: TFile, tag: string): boolean {
		return isTagInFile(app, file, tag)
	}
}

class DiskCheckedTagsAccessStrategy implements TagsAccessStrategy {
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

	async shouldAddTextTag(app: App, file: TFile, tag: string): Promise<boolean> {
		const content: string = await app.vault.read(file)
		return !content.includes(tag)
	}

	async shouldRemoveTextTag(app: App, file: TFile, tag: string): Promise<boolean> {
		const content: string = await app.vault.read(file)
		return content.includes(tag)
	}

	async shouldAddFrontmatterTag(app: App, file: TFile, tag: string): Promise<boolean> {
		const frontmatter = await this.readFrontmatterFromDisk(app, file)
		return !frontmatter?.tags || !Array.isArray(frontmatter.tags) || !frontmatter.tags.includes(tag)
	}

	async shouldRemoveFrontmatterTag(app: App, file: TFile, tag: string): Promise<boolean> {
		const frontmatter = await this.readFrontmatterFromDisk(app, file)
		return Boolean(frontmatter?.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.includes(tag))
	}

	isFileMatchedByTag(app: App, file: TFile, tag: string): boolean {
		return isTagInFile(app, file, tag)
	}
}

const tagsAccessStrategy: TagsAccessStrategy = new CachedTagsAccessStrategy()

async function addTagToFileText(app: App, file: TFile, tag: string): Promise<TFile> {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) { return file }
	if (!(await tagsAccessStrategy.shouldAddTextTag(app, currentFile, tag))) { return currentFile }
	await app.vault.append(currentFile, `\n${tag}`);
	return currentFile
}

async function removeTagFromFileText(app: App, file: TFile, tag: string): Promise<TFile> {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) { return file }
	if (!(await tagsAccessStrategy.shouldRemoveTextTag(app, currentFile, tag))) { return currentFile }
	var content: string = await app.vault.read(currentFile)
	var lines = content.split("\n")
	var newLines: string[] = []
	lines.forEach(line => {
		if (!(line.includes(tag))) {
			newLines.push(line)
		} else {
			var modifiedLine = line.replace(tag, "")
			if (modifiedLine.trim().length != 0) { // there is some content besides tag
				newLines.push(modifiedLine)
			}
		}
	})
	await app.vault.modify(currentFile, newLines.join("\n"))
	return currentFile
}
async function addTagToFileFronmatter(app: App, file: TFile, tag: string): Promise<TFile> {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) { return file }
	if (!(await tagsAccessStrategy.shouldAddFrontmatterTag(app, currentFile, tag))) { return currentFile }
	// Используем API для безопасной работы с YAML-секцией
	await app.fileManager.processFrontMatter(currentFile, (fm) => {
		// В YAML теги хранятся без символа '#'
		// const tagValue = tag.stagetAllFilesWithTagrtsWith('#') ? tag.substring(1) : tag;

		// Если свойства 'tags' нет, создаем его как массив с одним тегом
		if (!fm.tags) {
			fm.tags = [tag];
		} else {
			// Если 'tags' уже есть, убеждаемся, что это массив
			if (!Array.isArray(fm.tags)) {
				// Если это не массив (например, просто строка), преобразуем в массив
				fm.tags = String(fm.tags).split(/, ?/).map(t => t.trim());
			}
			// Добавляем новый тег, если его еще нет
			if (!fm.tags.includes(tag)) {
				fm.tags.push(tag);
			}
		}
	});
	return currentFile
}
async function removeTagFromFileFrontmatter(app: App, file: TFile, tag: string): Promise<TFile> {
	const currentFile = getCurrentFile(app, file)
	if (currentFile == null) { return file }
	if (!(await tagsAccessStrategy.shouldRemoveFrontmatterTag(app, currentFile, tag))) { return currentFile }

	await app.fileManager.processFrontMatter(currentFile, (fm) => {
		// Если свойства 'tags' нет или это не массив, ничего не делаем
		if (!fm.tags || !Array.isArray(fm.tags)) {
			return;
		}

		// const tagValue = tag.startsWith('#') ? tag.substring(1) : tag;

		// Фильтруем массив, удаляя нужный тег
		fm.tags = fm.tags.filter((t: string) => t !== tag);

		// Если после фильтрации массив тегов оказался пустым,
		// удаляем само свойство 'tags' из YAML.
		if (fm.tags.length === 0) {
			delete fm.tags;
		}
	});
	return currentFile
}

function isTagInFile(app: App, file: TFile, tag: string): boolean {
	const fileCache = app.metadataCache.getFileCache(file);
	if (fileCache == null) return false
	const allTagsInFile = getAllTags(fileCache);
	if (allTagsInFile && allTagsInFile.includes(tag)) {
		return true;
	}
	return false
}

export function getAllFilesWithTag(app: App, tag: string): TFile[] {
	const newTag = tag.startsWith("#") ? tag : "#" + tag;
	const files: TFile[] = app.vault.getMarkdownFiles();
	return files
		.filter(f => f instanceof TFile)
		.filter(f => getCurrentFile(app, f) != null)
		.filter(f =>
			tagsAccessStrategy.isFileMatchedByTag(app, f, newTag)
		)
}
