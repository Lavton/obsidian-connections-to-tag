
import { TFile, App, getAllTags } from "obsidian";



export async function addTagToFileIfNeeded(app: App, file: TFile, tag: string) {
	if (tag.startsWith("#")) {
		await addTagToFileText(app, file, tag)
	} else {
		await addTagToFileFronmatter(app, file, tag)
	}
}

export async function removeTagFromFileIfNeeded(app: App, file: TFile, tag: string) {
	if (tag.startsWith("#")) {
		await removeTagFromFileText(app, file, tag)
	} else {
		await removeTagFromFileFrontmatter(app, file, tag)
	}
}

async function addTagToFileText(app: App, file: TFile, tag: string) {
	if (isTagInFile(app, file, tag)) { return }
	await app.vault.append(file, `\n${tag}`);
}

async function removeTagFromFileText(app: App, file: TFile, tag: string) {
	if (!isTagInFile(app, file, tag)) { return }
    var content: string = await app.vault.read(file)
    var lines = content.split("\n")
    var newLines: string[] = []
    lines.forEach(line => {
        if (!(line.contains(tag))) {
            newLines.push(line)
        } else {
            var modifiedLine = line.replace(tag, "")
            if (modifiedLine.trim().length != 0) { // there is some content besides tag
                newLines.push(modifiedLine)
            }
        }
    })
    await app.vault.modify(file, newLines.join("\n"))
    
}
async function addTagToFileFronmatter(app: App, file: TFile, tag: string) {
    // Проверка на наличие тега остается без изменений, она работает корректно
	if (isTagInFile(app, file, tag)) { return }

    // Используем API для безопасной работы с YAML-секцией
	await app.fileManager.processFrontMatter(file, (fm) => {
        // В YAML теги хранятся без символа '#'
		// const tagValue = tag.startsWith('#') ? tag.substring(1) : tag;

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
}
async function removeTagFromFileFrontmatter(app: App, file: TFile, tag: string) {
	if (!isTagInFile(app, file, "#"+tag)) { return }

    await app.fileManager.processFrontMatter(file, (fm) => {
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
}

function isTagInFile(app: App, file: TFile, tag: string): boolean {
	const fileCache = app.metadataCache.getFileCache(file);
	if (fileCache == null) return false
	const allTagsInFile = getAllTags(fileCache);
	console.log({allTagsInFile})
	if (allTagsInFile && allTagsInFile.includes(tag)) {
		return true;
	}
	return false
}

