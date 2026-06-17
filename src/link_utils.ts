
import { App, TFile } from "obsidian";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function extractLinksFromString(text: string): string[] {
	const links: string[] = [];

	// 1. Wikilinks: [[link]] or [[link|alias]]
	const wikilinkRegex = /\[\[([^\]|#]+)(?:#[^\]|]*)?\|?[^\]]*\]\]/g;
	let match;
	while ((match = wikilinkRegex.exec(text)) !== null) {
		links.push(match[1].trim());
	}

	// 2. Markdown links: [text](link)
	const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
	while ((match = markdownLinkRegex.exec(text)) !== null) {
		const link = match[2].trim();
		// Skip external URLs and anchors
		if (!link.startsWith('http') && !link.startsWith('#') && !link.startsWith('mailto:')) {
			// remove #
			const cleanLink = link.split('#')[0];
			if (cleanLink) {
				links.push(cleanLink);
			}
		}
	}

	// 3. Embedded files: ![[image.png]] or ![[note]]
	const embedRegex = /!\[\[([^\]|#]+)(?:#[^\]|]*)?\|?[^\]]*\]\]/g;
	while ((match = embedRegex.exec(text)) !== null) {
		links.push(match[1].trim());
	}

	// remove dublicates
	return [...new Set(links)];
}
export function extractLinksFromFrontmatter(frontmatter: unknown): string[] {
	if (!frontmatter) {
		return [];
	}

	const links: Set<string> = new Set();

	function processValue(value: unknown): void {
		if (typeof value === 'string') {
			const foundLinks = extractLinksFromString(value);
			foundLinks.forEach(link => links.add(link));
		} else if (Array.isArray(value)) {
			value.forEach(item => processValue(item));
		} else if (isRecord(value)) {
			for (const child of Object.values(value)) {
				processValue(child);
			}
		}
	}

	processValue(frontmatter);
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
