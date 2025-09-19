import { TFile } from 'obsidian';

export interface Connection {
	get_connected(node: TFile): Promise<TFile[]>;
};

export class YamlConnectionTag implements Connection {
    get_connected(node: TFile): Promise<TFile[]> {
        throw new Error('Method not implemented.');
    }
	forward_tags: string[]
	backward_tags: string[]
}
