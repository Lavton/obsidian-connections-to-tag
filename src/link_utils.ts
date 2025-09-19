
import { App, TFile } from "obsidian";

export function getLinksOfFile(originalFile: TFile, app: App, frontMatterKey: string): TFile[] {
	const fileCache = this.app.metadataCache.getFileCache(originalFile);
	const frontmatter = fileCache?.frontmatter;

	if (frontmatter) {
		const frontmatterValue = extractLinksFromFrontmatter(frontmatter[frontMatterKey]);
		const connectedFiles = getFilepaths(frontmatterValue, originalFile, app)
		return connectedFiles
	}
	return []
}

export function extractLinksFromFrontmatter(frontmatter: any): string[] {
	if (!frontmatter) {
		return []
	}
	const links: Set<string> = new Set();

	// Regular expression to match [[link]] and [[link|text]] patterns
	const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

	function processValue(value: any): void {
		if (typeof value === 'string') {
			// Extract links from string
			let match;
			while ((match = linkRegex.exec(value)) !== null) {
				links.add(match[1].trim());
			}
		} else if (Array.isArray(value)) {
			// Process each item in array
			value.forEach(item => processValue(item));
		} else if (typeof value === 'object' && value !== null) {
			// Recursively process object properties
			Object.values(value).forEach(val => processValue(val));
		}
	}

	// Process all frontmatter properties
	Object.values(frontmatter).forEach(value => processValue(value));

	return Array.from(links);
}

export function getFilepathOnLink(linkPath: string, originalF: TFile, app: App): TFile | null {
	return app.metadataCache.getFirstLinkpathDest(linkPath, originalF.path);
}

export function getFilepaths(linkPath: string[], originalF: TFile, app: App): TFile[] {
	return linkPath.map(v => getFilepathOnLink(v, originalF, app)).filter((file): file is TFile => file !== null);
}

export function getReverseLink(originalF: TFile, distF: TFile, app: App): string {
	return app.fileManager.generateMarkdownLink(originalF, distF.path)
}
