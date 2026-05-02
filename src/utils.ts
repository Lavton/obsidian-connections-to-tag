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
		// Skip Obsidian internal keys
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
	// Check all backlink files and keep the ones that link to initial through frontmatter
	const backwardLinks = getBackwardLinks(app, initial)
	const goodBackLinks = backwardLinks.filter((t) =>
		hasThisFileForwardLink(app, t, initial, frontKeys)
	)
	// console.log({ backwardLinks, goodBackLinks })
	return goodBackLinks
}

function hasThisFileForwardLink(app: App, source: TFile, dest: TFile, frontKeys: string[]): boolean {
	const allDestFiles = getForwardFilesFromFrontmatter(app, source, frontKeys)
	// Compare by path, or by another unique marker if you use one
	return allDestFiles.map((f) => f.path).includes(dest.path)

}
export function removeFrontmatter(content: string): string {
	// Check whether the file starts with ---
	if (!content.startsWith('---')) {
		return content;
	}

	// Look for the closing ---
	const lines = content.split('\n');
	let endIndex = -1;

	for (let i = 1; i < lines.length; i++) {
		if (lines[i].trim() === '---') {
			endIndex = i;
			break;
		}
	}

	// If the closing --- was found, return the text after it
	if (endIndex !== -1) {
		return lines.slice(endIndex + 1).join('\n');
	}

	// If the closing --- was not found, return the full text
	return content;
}

export function findTextFragment(
	content: string,
	is_regexp: boolean,
	start_to_find: string | null,
	end_to_find: string | null
): string {

	const start_indexes: Array<[number, number]> = start_to_find ? findAllOccurrences(content, start_to_find, is_regexp) : [[0, 0]];
	const end_indexes: Array<[number, number]> = end_to_find ? findAllOccurrences(content, end_to_find, is_regexp) : [[content.length, 0]];


	if (start_indexes.length == 0) { return "" }
	if (end_indexes.length == 0) { return "" }
	if (start_indexes[0][0] > end_indexes[end_indexes.length - 1][0]) { return "" } // start > finish
	let startPosition = 0;
	let endPosition = 0;
	while (true) {
		if (startPosition >= start_indexes.length) {
			return content.slice(start_indexes[0][0], end_indexes[end_indexes.length - 1][0] + end_indexes[end_indexes.length - 1][1])
		}
		if (endPosition >= end_indexes.length) {
			return content.slice(start_indexes[0][0], end_indexes[end_indexes.length - 1][0] + end_indexes[end_indexes.length - 1][1])
		}

		// Check whether we need to move to the next endPosition
		if (start_indexes[startPosition][0] > end_indexes[endPosition][0]) {
			endPosition += 1;
			continue
		}
		// Continue until we reach the closest item to endPosition

		if (startPosition == start_indexes.length - 1) {
			return content.slice(start_indexes[startPosition][0], end_indexes[endPosition][0] + end_indexes[endPosition][1])
		}
		if (start_indexes[startPosition + 1][0] <= end_indexes[endPosition][0]) {
			startPosition += 1;
			continue
		} else {
			return content.slice(start_indexes[startPosition][0], end_indexes[endPosition][0] + end_indexes[endPosition][1])
		}

	}
}


export function findAllOccurrences(
	content: string,
	to_find: string,
	is_regexp: boolean
): Array<[number, number]> {
	const results: Array<[number, number]> = [];

	if (is_regexp) {
		// Interpret to_find as a regular expression
		const flags = 'g'; // Global search
		const regex = new RegExp(to_find, flags);
		let match: RegExpExecArray | null;

		while ((match = regex.exec(content)) !== null) {
			const startIndex = match.index;
			const length = match[0].length;
			results.push([startIndex, length]);

			// Prevent an infinite loop on empty matches
			if (match[0].length === 0) {
				regex.lastIndex++;
			}
		}
	} else {
		// Plain substring search
		let startIndex = 0;

		while (true) {
			const foundIndex = content.indexOf(to_find, startIndex);

			if (foundIndex === -1) {
				break;
			}

			results.push([foundIndex, to_find.length]);
			startIndex = foundIndex + 1;
		}
	}

	return results;
}

export function convertToLinePositions(
	matches: Array<[number, number]>,
	lines: string[]
): Array<[[number, number], [number, number]]> {
	// Sort the array by the start index
	// const sortedMatches = [...matches].sort((a, b) => a[0] - b[0]);

	// Split content into lines and calculate their lengths
	const lineLengths: number[] = [];
	const lineStarts: number[] = [0]; // Absolute start positions for each line

	let currentPos = 0;
	for (let i = 0; i < lines.length; i++) {
		lineLengths.push(lines[i].length);
		if (i < lines.length - 1) {
			currentPos += lines[i].length + 1; // +1 for the newline character
			lineStarts.push(currentPos);
		}
	}

	const result: Array<[[number, number], [number, number]]> = [];
	let lineIndex = 0; // Pointer to the current line

	for (const [startIndex, length] of matches) {
		const endIndex = startIndex + length;

		// Find the line where the substring starts
		while (lineIndex < lineStarts.length - 1 && lineStarts[lineIndex + 1] <= startIndex) {
			lineIndex++;
		}
		const startLine = lineIndex;
		const startColumn = startIndex - lineStarts[startLine];

		// Find the line where the substring ends
		let endLineIndex = lineIndex;
		while (endLineIndex < lineStarts.length - 1 && lineStarts[endLineIndex + 1] < endIndex) {
			endLineIndex++;
		}
		const endLine = endLineIndex;
		const endColumn = endIndex - lineStarts[endLine];

		result.push([[startLine, startColumn], [endLine, endColumn]]);
	}

	return result;
}
