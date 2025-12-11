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
	// @ts-ignore
	var fileCollection: string[] = app.metadataCache.getCachedFiles()
	return fileCollection.filter(f => {
		var tags = app.metadataCache.getCache(f)?.tags?.map(t => t.tag)
		return tags?.contains(tag)
	})
}

export function getFilesInFrontmatter(app: App, source: TFile): Record<string, TFile[]> {
	const fileCache = app.metadataCache.getFileCache(source);
	const frontmatter = fileCache?.frontmatter;

	if (!frontmatter) {
		return {};
	}

	const result: Record<string, TFile[]> = {};

	for (const [key, value] of Object.entries(frontmatter)) {
		// Пропускаем служебные ключи Obsidian
		if (key === 'position') continue;

		const links = extractLinksFromFrontmatter(value);
		if (links.length === 0) continue;

		const files = getFilepaths(links, source, app);
		if (files.length > 0) {
			result[key] = files;
		}
	}

	return result;
}

// get all files that has current frontmatter
export function getForwardFilesFromFrontmatter(app: App, initial: TFile, frontKeys: string[]): TFile[] {
	if (frontKeys.length === 0) return []
	const fileCache = app.metadataCache.getFileCache(initial);
	const frontmatter = fileCache?.frontmatter;
	// console.log({initial, frontKeys})

	var connectedFiles: TFile[] = []
	if (frontmatter) {
		for (const frontMatterKey of frontKeys) {
			const frontmatterValue = extractLinksFromFrontmatter(frontmatter[frontMatterKey]);
			// console.log({frontmatterValue})
			// console.log(frontmatter[frontMatterKey])
			const newFiles = getFilepaths(frontmatterValue, initial, app)
			connectedFiles.push(...newFiles)
		}
	}

	return connectedFiles
}

export function getBackwardLinks(app: App, initial: TFile): TFile[] {
	// @ts-ignore
	const backlinksObj = app.metadataCache.getBacklinksForFile(initial)?.data
	// console.log({ backlinksObj })
	if (backlinksObj == undefined) {
		return []
	}
	const backlinks: string[] = [...backlinksObj.keys()]
	// var backlinks: string[] = Object.keys(backlinksObj)
	const backFiles = backlinks.map(s => app.vault.getAbstractFileByPath(s)).filter(item => item !== null)
	return backFiles.filter(item => item instanceof TFile)
}

// @deprecated
export function getBackwardFilesFromFronmatter(app: App, initial: TFile, frontKeys: string[]): TFile[] {
	if (frontKeys.length === 0) return []
	// смотрим все "обратные" файлы и оставляем те, у которых есть ссылка на initial (через фронтматтер)
	const backwardLinks = getBackwardLinks(app, initial)
	const goodBackLinks = backwardLinks.filter((t) =>
		hasThisFileForwardLink(app, t, initial, frontKeys)
	)
	// console.log({ backwardLinks, goodBackLinks })
	return goodBackLinks
}

function hasThisFileForwardLink(app: App, source: TFile, dest: TFile, frontKeys: string[]): boolean {
	const allDestFiles = getForwardFilesFromFrontmatter(app, source, frontKeys)
	// сравниваем по пути (или по другой уникальной метке, если используете другую)
	// console.log({allDestFiles})
	return allDestFiles.map((f) => f.path).includes(dest.path)

}

