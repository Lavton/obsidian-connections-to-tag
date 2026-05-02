import type { App, TFile } from "obsidian";
import type { NewRule, NewRuleFactory } from "src/rules/new_rule";

export interface Traversal {
	 go(app: App, seed: TFile[]): Promise<TFile[]> 
}

export class RuleTraversal implements Traversal {
	async go(app: App, seed: TFile[]): Promise<TFile[]> {
		const res = []
		for (const s of seed) {
			const oneSeedRes: TFile[] = await this.oneSeedGo(app, s)
			res.push(...oneSeedRes)
		}
		return res
	}
	ruleFactory: NewRuleFactory
	constructor(rule: NewRuleFactory) {
		this.ruleFactory = rule
	}
	private async oneSeedGo(app: App, seed: TFile): Promise<TFile[]> {
		const rule = this.ruleFactory.getRule()
		const connection = this.ruleFactory.connection
		var allNotes: string[] = []
		var allNotesF: TFile[] = []
		var notesQueue: [TFile, NewRule][] = []
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
			const c = await connection.get_connected(app, currentFile)
			filesToLookAt.push(...c)
			for (const file of filesToLookAt) {
				if (file.extension != "md") continue
		        if (allNotes.contains(file.path)) continue
				if (await currentRule.needToGo()) {
					notesQueue.push([file, await currentRule.go()])
					allNotes.push(file.path)
					allNotesF.push(file)
				}
			}

		}
		return allNotesF

	}
}
