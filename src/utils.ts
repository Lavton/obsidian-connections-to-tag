import { App, TFile } from "obsidian"
import { extractLinksFromFrontmatter, getFilepaths } from "./link_utils"

const regexp = /\[\[([^|\^#]*)[\^|#]?(.*?)\]\]/
function linkToNoteName(link: string): string | null {
	if (!link.startsWith("[[")) {
		return null
	}
	if (!link.endsWith("]]")) {
		return null
	}
	// return getLinkpath(link.slice(2, link.length-2))
	var match = link.match(regexp)
	if (match == null) {
		return null
	}
	return match[1]
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
	if (value === null || value === undefined) return false;
	const testDummy: TValue = value;
	return true;
}

export function getNotePaths(linksCandidates: string[], initfilePath: string, app: App): string[] {
	return linksCandidates
		.map(l => linkToNoteName(l))
		.filter(l => l != null)
		.map(l => {
			if (l == null) { return undefined } // can't be true...
			return app.metadataCache.getFirstLinkpathDest(l, initfilePath)?.path
		})
		.filter(value => notEmpty(value))
		.map((v): string => v as string)
}

export function getAllFilesWithTag(app: App, tag: string): string[] {
	var fileCollection: string[] = app.metadataCache.getCachedFiles()
	return fileCollection.filter(f => {
		var tags = app.metadataCache.getCache(f)?.tags?.map(t => t.tag)
		return tags?.contains(tag)
	})
}


// get all files that has current frontmatter
export function getForwardFilesFromFrontmatter(app: App, initial: TFile, frontKeys: string[]): TFile[] {
	if (frontKeys.length === 0) return []
	const fileCache = app.metadataCache.getFileCache(initial);
	const frontmatter = fileCache?.frontmatter;

	var connectedFiles: TFile[] = []
	if (frontmatter) {
		for (const frontMatterKey of frontKeys) {
			const frontmatterValue = extractLinksFromFrontmatter(frontmatter[frontMatterKey]);
			const newFiles = getFilepaths(frontmatterValue, initial, app)
			connectedFiles.push(...newFiles)
		}
	}

	return connectedFiles
}

export function getBackwardLinks(app: App, initial: TFile): TFile[] {
	// @ts-ignore
	const backlinksObj = app.metadataCache.getBacklinksForFile(initial)?.data
	console.log({ backlinksObj })
	if (backlinksObj == undefined) {
		console.log("aaaaaaaaaaaaaaaaaaaa")
		return []
	}
	const backlinks: string[] = [...backlinksObj.keys()]
	// var backlinks: string[] = Object.keys(backlinksObj)
	console.log({ backlinks })
	const backFiles = backlinks.map(s => app.vault.getAbstractFileByPath(s)).filter(item => item !== null)
	console.log({ backFiles })
	return backFiles.filter(item => item instanceof TFile)
}

export function getBackwardFilesFromFronmatter(app: App, initial: TFile, frontKeys: string[]): TFile[] {
	if (frontKeys.length === 0) return []
	// смотрим все "обратные" файлы и оставляем те, у которых есть ссылка на initial (через фронтматтер)
	const backwardLinks = getBackwardLinks(app, initial)
	console.log({ backwardLinks })
	return backwardLinks.filter((t) =>
		hasThisFileForwardLink(app, t, initial, frontKeys)
	)
	// return []
}

function hasThisFileForwardLink(app: App, source: TFile, dest: TFile, frontKeys: string[]): boolean {
	const allDestFiles = getForwardFilesFromFrontmatter(app, source, frontKeys)
	// сравниваем по пути (или по другой уникальной метке, если используете другую)
	return allDestFiles.map((f) => f.path).includes(dest.path)

}
