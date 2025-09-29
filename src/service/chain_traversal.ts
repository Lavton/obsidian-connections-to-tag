import type { App, TFile } from "obsidian";
import { ChainStep, type Chain } from "src/models/chain";
import type { Traversal } from "src/models/traversal";

export class ChainTraversal implements Traversal {
	go(app: App, seed: TFile[]): Promise<TFile[]> {
		var allNotes: string[] = []
		var notesQueue: string[] = []
		for (const f of seed) {
			const absPath = f.path
			if (!(allNotes.contains(absPath))) {
				allNotes.push(absPath)
				notesQueue.push(absPath)
			}
		}
		const result = allNotes.map(n => app.vault.getAbstractFileByPath(n)).filter((file): file is TFile => file !== null);
		return Promise.resolve(result)

		// return Promise.resolve([])
		// if (!(initPath.endsWith(".md"))) {
		//     return []
		// }
		// var allNotes: string[] = [initPath]
		// var notesQueue: string[] = [initPath]
		// while (notesQueue.length != 0) {
		//     var currentPath = notesQueue.pop()
		//     if (currentPath == undefined) {
		//         continue
		//     }
		//     var file = app.vault.getAbstractFileByPath(currentPath)
		//     if (!(file instanceof TFile)) {
		//         continue
		//     }
		//     var noteChildren: string[] = await getAllChildrenOfFile(
		//         file, app, isFirstTagLineParentWhenEmpty, parentTags
		//     )
		//     noteChildren.forEach(nc => {
		//         if (!(allNotes.contains(nc))) {
		//             if (nc.endsWith(".md")) {
		//                 allNotes.push(nc)
		//                 notesQueue.push(nc)
		//             }
		//         }
		//     })
		// }
		// return allNotes
	}
	chain: Chain

	constructor(chain: Chain) {
		this.chain = chain
	}
}
