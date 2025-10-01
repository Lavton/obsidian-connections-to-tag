import { TFile, type App } from "obsidian";
import { ChainStep, type Chain } from "src/models/chain";
import type { Rule } from "src/models/rule";
import type { Traversal } from "src/models/traversal";

// export class ChainTraversal implements Traversal {
// 	go(app: App, seed: TFile[]): Promise<TFile[]> {
// 		var allNotes: string[] = []
// 		var notesQueue: string[] = []
// 		for (const f of seed) {
// 			const absPath = f.path
// 			if (!(allNotes.contains(absPath))) {
// 				if (f.extension != "md") continue
// 				allNotes.push(absPath)
// 				notesQueue.push(absPath)
// 			}
// 		}
// 		for (const chain_step of this.chain.chainSteps) {
// 			const rule = chain_step.rule.getRule()
// 			const connections = chain_step.connections
// 			const nextCandidates = []
// 			for (const connection of connections) {
// 				// connection.get_connected(app, 
// 			}

// 		}
// 		const result = allNotes.map(n => app.vault.getAbstractFileByPath(n)).filter((file): file is TFile => file !== null);
// 		return Promise.resolve(result)

// 		// return Promise.resolve([])
// 		// if (!(initPath.endsWith(".md"))) {
// 		//     return []
// 		// }
// 		// var allNotes: string[] = [initPath]
// 		// var notesQueue: string[] = [initPath]
// 		// while (notesQueue.length != 0) {
// 		//     var currentPath = notesQueue.pop()
// 		//     if (currentPath == undefined) {
// 		//         continue
// 		//     }
// 		//     var file = app.vault.getAbstractFileByPath(currentPath)
// 		//     if (!(file instanceof TFile)) {
// 		//         continue
// 		//     }
// 		//     var noteChildren: string[] = await getAllChildrenOfFile(
// 		//         file, app, isFirstTagLineParentWhenEmpty, parentTags
// 		//     )
// 		//     noteChildren.forEach(nc => {
// 		//         if (!(allNotes.contains(nc))) {
// 		//             if (nc.endsWith(".md")) {
// 		//                 allNotes.push(nc)
// 		//                 notesQueue.push(nc)
// 		//             }
// 		//         }
// 		//     })
// 		// }
// 		// return allNotes
// 	}
// 	chain: Chain

// 	constructor(chain: Chain) {
// 		this.chain = chain
// 	}

// 	private oneSeedGo(app: App, seed: TFile): Promise<TFile[]> {
// 		var allNotes: string[] = []
// 		var notesQueue: string[] = []
// 		const absPath = seed.path
// 		if (!(allNotes.contains(absPath))) {
// 			if (seed.extension != "md") continue
// 			allNotes.push(absPath)
// 			notesQueue.push(absPath)
// 		}
// 		for (const chain_step of this.chain.chainSteps) {
// 			const rule = chain_step.rule.getRule()
// 			const connections = chain_step.connections
// 			const nextCandidates = []
// 			for (const connection of connections) {
// 				connection.get_connected(app,)
// 			}

// 		}

// 	}
// }

export class StepTraversal implements Traversal {
	async go(app: App, seed: TFile[]): Promise<TFile[]> {
		const res = []
		for (const s of seed) {
			const oneSeedRes: TFile[] = await this.oneSeedGo(app, s)
			res.push(...oneSeedRes)
		}
		return res
	}
	step: ChainStep
	constructor(step: ChainStep) {
		this.step = step
	}
	private async oneSeedGo(app: App, seed: TFile): Promise<TFile[]> {
		const rule = this.step.rule.getRule()
		const connections = this.step.connections
		var allNotes: string[] = []
		var allNotesF: TFile[] = []
		var notesQueue: [TFile, Rule][] = []
		const absPath = seed.path
		if (!(allNotes.contains(absPath))) {
			if (seed.extension != "md") return []
			allNotes.push(absPath)
			allNotesF.push(seed)
			notesQueue.push([seed, rule])
		}
		while (notesQueue.length != 0) {
			const [currentFile, currentRule] = notesQueue.pop() ?? [undefined, undefined]
			// console.log({currentFile, currentRule})
			if (currentFile == undefined || currentRule == undefined) continue
			const filesToLookAt: TFile[] = []
			for (const connection of connections) {
				const c = connection.get_connected(app, currentFile)
				filesToLookAt.push(...c)
				// console.log({c, connection})
				
			}
			console.log({filesToLookAt})
			for (const file of filesToLookAt) {
				if (file.extension != "md") continue
		        if (allNotes.contains(file.path)) continue
				if (currentRule.needToGo()) {
					notesQueue.push([file, currentRule.go()])
					allNotes.push(file.path)
					allNotesF.push(file)
				}
			}

		}
		return allNotesF

	}
}
