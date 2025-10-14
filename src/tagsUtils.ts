
import { TFile, App, getAllTags } from "obsidian";


export async function addTagToFileIfNeeded(app: App, file: TFile, tag: string) {
	if (isTagInFile(app, file, tag)) { return }
	await app.vault.append(file, `\n${tag}`);
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

export async function removeTagFromFileIfNeeded(app: App, file: TFile, tag: string) {
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
