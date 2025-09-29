import type { App, TFile } from "obsidian";

export interface Traversal {
	 go(app: App, seed: TFile[]): Promise<TFile[]> 
}
