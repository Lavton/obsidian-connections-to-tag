import type { App, TFile } from "obsidian";
import { type Connection, type ConnectionConfig } from "src/connections/connections";
import type { ConnectionTypeDescriptor } from "../connection_factory";
import type { ValidationAboveRule, ValidationLocalRule } from "src/settings/types";
import PlusMinusConnectionEditor from "./PlusMinusConnectionEditor.svelte";

export enum PMSign {
	PLUS = "plus",
	MINUS = "minus"
}
// combined connection: can add or remove some links
export class PlusMinusConnection implements Connection {
	readonly type = 'plus-minus';
	title: string;
	readonly locality = 'above';
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
	constructor(title: string, connections: [PMSign, Connection][]) {
		this.title = title
		this.connections = connections
	}
}
export class PlusMinusConnConfig implements ConnectionConfig {
	readonly type = 'plus-minus';
	title: string;
	connections: { sign: PMSign; title: string }[];

	constructor(title: string, connections: { sign: PMSign; title: string }[]) {
		this.title = title;
		this.connections = connections;
	}
}

function validatePlusMinusConnectionsNotEmpty(item: PlusMinusConnConfig) {
	if (item.connections.length === 0) {
		return { code: "connections_empty", path: "connections" };
	}
	return null;
}

function validatePlusMinusConnectionsExist(item: PlusMinusConnConfig, elementsAbove: string[]) {
	const missingTitles = item.connections
		.map(connection => connection.title.trim())
		.filter(title => title && !elementsAbove.includes(title));

	if (missingTitles.length > 0) {
		return {
			code: "connections_not_exists",
			path: "connections",
			params: { titles: [...new Set(missingTitles)] },
		};
	}
	return null;
}

export const PlusMinusConnectionDescriptor: ConnectionTypeDescriptor<PlusMinusConnConfig> = {
	type: 'plus-minus',

	createInstance(config, above_connections: Connection[]) {
		const new_connections = config.connections
			.map(conn => {
				const aboveConn = above_connections.find(ac => ac.title === conn.title);
				return aboveConn ? [conn.sign, aboveConn] as [PMSign, Connection] : null;
			})
			.filter((item): item is [PMSign, Connection] => item !== null);
		return new PlusMinusConnection(config.title, new_connections);
	},

	createConfig(instance) {
		const connection = instance as PlusMinusConnection;
		const old_connections: [PMSign, Connection][] = connection.connections;
		const new_connections: { sign: PMSign; title: string; }[] = old_connections
			.map(conn => ({ sign: conn[0], title: conn[1].title }));

		return {
			type: connection.type,
			title: connection.title,
			connections: new_connections
		};
	},
	label: "Combine",
	createDefaultConfig() {
		return { type: 'plus-minus', title: '', connections: [] };
	},
	editorComponent: PlusMinusConnectionEditor,
	validateLocalRules: [
		{ run: validatePlusMinusConnectionsNotEmpty },
	],
	validateAboveRules: [
		{ run: validatePlusMinusConnectionsExist },
	],
};
