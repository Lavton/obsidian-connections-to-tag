import { App, TFile } from 'obsidian';
import { getBackwardLinks } from 'src/utils';

export interface Connection {
	readonly type: string;
	title: string;
	get_connected(app: App, node: TFile): Promise<TFile[]>;
	readonly locality: "local" | "above";
};

// connection-wrapper: check for the condition not the file, but all it neibours
export class BackwardConnection implements Connection {
	readonly type = '';
    title: string;
    readonly locality: "local" = 'local';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const neibours = getBackwardLinks(app, node)
		const result: TFile[] = []
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
		this.title = real_connection.title
	}
}
