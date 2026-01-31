import { App, TFile } from 'obsidian';
import { extractLinksFromString, getFilepaths } from 'src/link_utils';
import { convertToLinePositions, findAllOccurrences, findTextFragment, getBackwardFilesFromFronmatter, getBackwardLinks, getFilesInFrontmatter, getForwardFilesFromFrontmatter, removeFrontmatter } from 'src/utils';

export interface Connection {
	type: string;
	get_connected(app: App, node: TFile): Promise<TFile[]>;
};

// return files of yaml specific tag in frontmatter
// @deprecated
export class YamlConnectionTag implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		return [...getForwardFilesFromFrontmatter(app, node, this.forward_tags), ...getBackwardFilesFromFronmatter(app, node, this.backward_tags)]
	}
	forward_tags: string[]
	backward_tags: string[]
	constructor(forward_tags: string[], backward_tags: string[]) {
		this.forward_tags = forward_tags
		this.backward_tags = backward_tags
	}
}

// connection-wrapper: check for the condition not the file, but all it neibours
export class BackwardConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const neibours = getBackwardLinks(app, node)
		const result = []
		for (const neibour of neibours) {
			const neibour_connection = await this.real_connection.get_connected(app, neibour)
			// check the target `node` is in the results of the neibour's connections
			for (const nc of neibour_connection) {
				if (nc.path == node.path) {
					result.push(neibour)
				}
			}
		}
		return result
	}
	real_connection: Connection
	constructor(real_connection: Connection) {
		this.real_connection = real_connection
	}
}

export enum PMSign {
	PLUS = "plus",
	MINUS = "minus"
}
// combined connection: can add or remove some links
export class PlusMinusConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const resultMap = new Map<string, TFile>();

		for (const [sign, connection] of this.connections) {
			const files = await connection.get_connected(app, node);

			if (sign === PMSign.PLUS) {
				for (const file of files) {
					if (!resultMap.has(file.path)) {
						resultMap.set(file.path, file);
					}
				}
			} else if (sign === PMSign.MINUS) {
				for (const file of files) {
					resultMap.delete(file.path);
				}
			}
		}

		return Array.from(resultMap.values());
	}
	connections: [PMSign, Connection][]
	constructor(connections: [PMSign, Connection][]) {
		this.connections = connections
	}
}

// connection "links with defined frontmatter"
export class YamlTagConnection implements Connection {
	readonly type = 'yaml-tag';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const uniqueFilesMap = new Map<string, TFile>();
		const filesByTag = getFilesInFrontmatter(app, node)

		this.tags.forEach(tag => {
			filesByTag[tag]?.forEach(file => {
				uniqueFilesMap.set(file.path, file);
			});
		});

		return Array.from(uniqueFilesMap.values());
	}
	tags: string[]
	constructor(tags: string[]) {
		this.tags = tags
	}
}

// connections "all links in frontmatter"
export class AllYamlConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const uniqueFilesMap = new Map<string, TFile>();
		const filesByTag = getFilesInFrontmatter(app, node)

		Object.values(filesByTag).forEach(files => {
			files.forEach(file => {
				uniqueFilesMap.set(file.path, file);
			});
		});
		return Array.from(uniqueFilesMap.values());
	}

}

// "all links that are in the text of the note, not in the frontmatter
export class AllInTextConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const links = extractLinksFromString(contentWithoutFrontmatter);
		const connectedFiles = getFilepaths(links, node, app);
		return connectedFiles;
	}
}

// "the topest link of the note in text and it's neibours
export class TopInTextConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const lines = contentWithoutFrontmatter.split('\n');

		let firstLinkFound = false;
		let allLinks: string[] = [];

		for (const line of lines) {
			const linksInLine = extractLinksFromString(line);

			if (linksInLine.length > 0) {
				firstLinkFound = true;
				allLinks.push(...linksInLine);
			} else if (firstLinkFound) {
				break;
			}
		}

		return getFilepaths(allLinks, node, app);
	}
}

// the links before some regexp/string. ex: before "# " means before first "header-1"
export class BetweenInTextConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const targetFragment = findTextFragment(contentWithoutFrontmatter, this.is_regexp, this.start_to_find, this.end_to_find);
		const links = extractLinksFromString(targetFragment);
		const files = getFilepaths(links, node, app);
		return files;
	}
	is_regexp: boolean
	start_to_find: string | null
	end_to_find: string | null
	constructor(is_regexp: boolean, start_to_find: string | null, end_to_find: string | null) {
		this.is_regexp = is_regexp
		this.start_to_find = start_to_find
		this.end_to_find = end_to_find
	}
}

// links after some regexp. Ex: after "parent:: "
export class JustRegexpConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const occurance = findAllOccurrences(contentWithoutFrontmatter, this.to_find, this.is_regexp)

		const lines = contentWithoutFrontmatter.split('\n');
		const linePositions = convertToLinePositions(occurance, lines)
		const allLinks: string[] = []
		for (const linePos of linePositions) {
			allLinks.push(...this.getOne(lines, linePos))
		}
		return getFilepaths([...new Set(allLinks)], node, app)

	}
	in_the_same_string: boolean
	is_regexp: boolean
	is_before: boolean
	to_find: string

	constructor(in_the_same_string: boolean, is_regexp: boolean, is_before: boolean, to_find: string) {
		this.in_the_same_string = in_the_same_string
		this.is_regexp = is_regexp
		this.is_before = is_before
		this.to_find = to_find
	}
	private getOne(lines: string[], indexes: [[number, number], [number, number]]): string[] {
		if (this.in_the_same_string) {
			if (this.is_before) {
				const test_line: string = lines[indexes[0][0]]
				const test = test_line.slice(0, indexes[0][1] + 1)
				return extractLinksFromString(test)
			} else {
				const test_line: string = lines[indexes[1][0]]
				const test = test_line.slice(indexes[1][1], test_line.length)
				return extractLinksFromString(test)
			}
		} else {
			let start_line: number
			let direction: number
			if (this.is_before) {
				start_line = indexes[0][0] - 1
				direction = -1
			} else {
				start_line = indexes[1][0] + 1
				direction = +1
			}
			const links: string[] = []//extractLinksFromString(lines.slice(indexes[0][0], indexes[1][0]).join("\n")) // we include the found substring too
			while (true) {
				if (start_line == -1) { break }
				if (start_line == lines.length) { break }
				const lineLinks = extractLinksFromString(lines[start_line])
				if (lineLinks.length == 0) { break }
				links.push(...lineLinks)
				start_line += direction
			}
			return links

		}
	}
}

export class ArbitraryDangerConnection implements Connection {
	readonly type = '';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		try {
			// Читаем файл с кодом
			const code = await this.get_code(app);
			if (code.length == 0) { return [] }
			// Создаём функцию из кода и выполняем её
			const AsyncFunction = Object.getPrototypeOf(async function() { }).constructor;
			const executorFunction = new AsyncFunction(
				'app',
				'node',
				'utils',
				code
			);

			// Выполняем код
			const result = await executorFunction(app, node, this.utils);

			// Проверяем что результат - массив TFile
			if (Array.isArray(result) && result.every(item => item instanceof TFile)) {
				return result;
			}

			return [];
		} catch (error) {
			console.error('ArbitraryDangerConnection error:', error);
			return [];
		}
	}
	filepath: string
	utils = {
		removeFrontmatter,
		extractLinksFromString,
		getFilepaths
	}
	constructor(filepath: string) {
		this.filepath = filepath;
	}
	async get_code(app: App): Promise<string> {
		try {
			const codeFile = app.vault.getAbstractFileByPath(this.filepath);
			if (!codeFile || !(codeFile instanceof TFile)) {
				return "";
			}

			const codeFileContent = await app.vault.read(codeFile);

			// Ищем первый код-блок
			const codeBlockRegex = /```(?:js|javascript|ts|typescript)?\n([\s\S]*?)```/;
			const match = codeFileContent.match(codeBlockRegex);

			if (!match) {
				return "";
			}

			const code = match[1];
			return code
		} catch (error) {
			console.error('ArbitraryDangerConnection error:', error);
			return "";
		}
	}
}
