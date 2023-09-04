import { TFile, App } from "obsidian";

export async function tagData(app: App, file: TFile, tag: string): Promise<string[] | null> {
    if (!(file.path.endsWith(".md"))) {
        return null
    }
    var frontmatterTagInfo = app.metadataCache.getFileCache(file)?.frontmatter
    if (frontmatterTagInfo != null) {
        var frontmatterTagInfo2 = frontmatterTagInfo[tag]
    } else {
        var frontmatterTagInfo2 = null
    }
    if (frontmatterTagInfo2 != null) {
        // ищем среди фронтметтер
        if (Array.isArray(frontmatterTagInfo2)) {
            return frontmatterTagInfo2
        } else {
            return [frontmatterTagInfo2]
            // if (typeof frontmatterTagInfo2 == 'string') {
            //     return frontmatterTagInfo2.split(",").map(f => f.trim())
            // }
        }
    } else {
        // ищем среди полного файла
        var content: string = await app.vault.cachedRead(file)
        var lines = content.split("\n")
        var tagStart = `${tag}::`
        var lineIndex = -1 
        for (let i=0; i < lines.length; i++) {
            if (lines[i].startsWith(tagStart)) {
                lineIndex = i
                break
            }
        }
        if (lineIndex == -1) {
            return null
        }
        return getTagOnWholeFile(file, app, lineIndex)
        // var linesWithTag = lines.filter(l => l.startsWith(tagStart)).map(l => l.slice(tagStart.length))
        // if (linesWithTag.length == 0) {
            // return null
        // }
        // return linesWithTag.join(", ").split(",").map(l => l.trim()) // TODO: тут не обработаются заметки с ',' в названии!
    }
    return null
}

function getTagOnWholeFile(file: TFile, app: App, lineIndex: number): string[] {
    var inFileLinks = app.metadataCache.getFileCache(file)?.links
    if (inFileLinks == undefined) {
        return []
    }
    var lines: number[] = inFileLinks.map(l => l.position.start.line)
    var links: string[] = inFileLinks.map(l => l.original)
    var parents: string[] = []
    for(let i=0; i < lines.length; i++) {
        if (lines[i] == lineIndex) {
            parents.push(links[i])
        }
    }
    return parents
}


export async function addTagForFile(app: App, filepath: string, tag: string) {
    if (!(filepath.endsWith(".md"))) {
        return
    }
    var file = app.vault.getAbstractFileByPath(filepath)
    if (!(file instanceof TFile)) {
        return
    }
    var content: string = await app.vault.read(file)
    if (content.contains(tag)) { // TODO: it may be a problem: #tag_something still return true. But I don't know how to parse tag without cache...
        return
    }
    content += "\n"+tag
    await app.vault.modify(file, content)
}

export async function removeTagFromFile(app: App, filepath: string, tag: string) {
    if (!(filepath.endsWith(".md"))) {
        return
    }
    var file = app.vault.getAbstractFileByPath(filepath)
    if (!(file instanceof TFile)) {
        return
    }
    var content: string = await app.vault.read(file)
    if (!(content.contains(tag))) { // TODO: it may be a problem: #tag_something still return true. But I don't know how to parse tag without cache...
        return
    }
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