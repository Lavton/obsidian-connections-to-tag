import { TFile, App } from "obsidian";

export async function tagData(app: App, file: TFile, tag: string): Promise<string[] | null> {
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
            if (typeof frontmatterTagInfo2 == 'string') {
                return frontmatterTagInfo2.split(",").map(f => f.trim())
            }
        }
    } else {
        var content: string = await app.vault.cachedRead(file)
        var lines = content.split("\n")
        var tagStart = `${tag}::`
        var linesWithTag = lines.filter(l => l.startsWith(tagStart)).map(l => l.slice(tagStart.length))
        if (linesWithTag.length == 0) {
            return null
        }
        return linesWithTag.join(", ").split(",").map(l => l.trim())
        // ищем среди полного файла
    }
    return null
}
