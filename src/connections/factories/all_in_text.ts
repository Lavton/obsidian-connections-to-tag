import type { App, TFile } from "obsidian";
import { extractLinksFromString, getFilepaths } from "src/link_utils";
import type { Connection } from "src/models/connections";
import { removeFrontmatter } from "src/utils";
import type { ConnectionTypeDescriptor } from "./factory";

// "all links that are in the text of the note, not in the frontmatter
export class AllInTextConnection implements Connection {
	readonly type = 'all-in-text';
	async get_connected(app: App, node: TFile): Promise<TFile[]> {
		const content = await app.vault.read(node);
		const contentWithoutFrontmatter = removeFrontmatter(content);
		const links = extractLinksFromString(contentWithoutFrontmatter);
		const connectedFiles = getFilepaths(links, node, app);
		return connectedFiles;
	}
}


export const AllInTextConnectionDescriptor: ConnectionTypeDescriptor<{
    type: 'all-in-text';
}> = {
    type: 'all-in-text',
    
    createInstance(config) {
        return new AllInTextConnection();
    },
    
    createConfig(instance) {
        return {
            type: 'all-in-text'
        };
    }
};

// connectionRegistry.register(AllInTextConnectionDescriptor);
