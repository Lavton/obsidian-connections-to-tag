import type { App, TFile } from "obsidian";
import type { Connection, ConnectionConfig } from "src/connections/connections";
import type { ConnectionTypeDescriptor } from "../connection_factory";
import TrivialConnectionEditor from "./TrivialConnectionEditor.svelte";

export class TrivialConnection implements Connection {
	readonly type = 'trivial-connection';
	title: string;
	readonly locality = 'local';

	constructor(title: string) {
		this.title = title;
	}

	async get_connected(_app: App, _node: TFile): Promise<TFile[]> {
		return [];
	}
}

export class TrivialConnConfig implements ConnectionConfig {
	readonly type = 'trivial-connection';
	title: string;

	constructor(title: string) {
		this.title = title;
	}
}

export const TrivialConnectionDescriptor: ConnectionTypeDescriptor<TrivialConnConfig> = {
	type: 'trivial-connection',

	createInstance(config) {
		return new TrivialConnection(config.title);
	},

	createConfig(instance) {
		const connection = instance as TrivialConnection;
		return new TrivialConnConfig(connection.title);
	},

	label: "Trivial connection",
	description: "Returns no connected notes.",
	editorComponent: TrivialConnectionEditor,

	createDefaultConfig() {
		return new TrivialConnConfig('');
	},
	validateLocalRules: [],
	validateAboveRules: [],
};
