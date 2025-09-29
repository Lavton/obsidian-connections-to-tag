import { App, TFile } from 'obsidian';
import { getBackwardFilesFromFronmatter, getForwardFilesFromFrontmatter } from 'src/utils';

export interface Connection {
	get_connected(app: App, node: TFile): TFile[];
};

export class YamlConnectionTag implements Connection {
    get_connected(app: App, node: TFile): TFile[] {
		return [...getForwardFilesFromFrontmatter(app, node, this.forward_tags),...getBackwardFilesFromFronmatter(app, node, this.backward_tags)]
    }
	forward_tags: string[]
	backward_tags: string[]
	constructor(forward_tags: string[], backward_tags: string[]) {
		this.forward_tags = forward_tags
		this.backward_tags = backward_tags
    }
}
