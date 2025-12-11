import { App, TFile } from 'obsidian';
import { getBackwardFilesFromFronmatter, getBackwardLinks, getFilesInFrontmatter, getForwardFilesFromFrontmatter } from 'src/utils';

export interface Connection {
	get_connected(app: App, node: TFile): Promise<TFile[]>;
};

// return files of yaml specific tag in frontmatter
// @deprecated
export class YamlConnectionTag implements Connection {
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
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		throw new Error('Method not implemented.');
	}
}

// "the topest link of the note in text and it's neibours
export class TopInTextConnection implements Connection {
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		throw new Error('Method not implemented.');
	}
}

// the links before first some regexp/string. ex: before "# " means before first "header-1"
export class BeforeFirstRegexpConnection implements Connection {
	get_connected(app: App, node: TFile): Promise<TFile[]> {
		throw new Error('Method not implemented.');
	}
	is_regexp: boolean
}

// the linke after last string/regexp. ex: after "---" means in the buttom of the file 
export class AfterLastRegexpConnection implements Connection {
	get_connected(app: App, node: TFile): Promise<TFile[]> {
		throw new Error('Method not implemented.');
	}
	is_regexp: boolean
}
// links after some regexp. Ex: after "parent:: "
export class JustAfterRegexpConnection implements Connection {
	get_connected(app: App, node: TFile): Promise<TFile[]> {
		throw new Error('Method not implemented.');
	}
	in_the_same_string: boolean
	is_regexp: boolean
	only_first: boolean

}
