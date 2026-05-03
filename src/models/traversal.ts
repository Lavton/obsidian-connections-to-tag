import type { App, TFile } from "obsidian";
import type { NewRule, NewRuleFactory } from "src/rules/new_rule";
import { throwIfCancelled, type TraversalProgressOptions } from "src/service/operation_control";

export interface Traversal {
	 go(app: App, seed: TFile[], options?: TraversalProgressOptions): Promise<TFile[]> 
}

export class RuleTraversal implements Traversal {
	async go(app: App, seed: TFile[], options?: TraversalProgressOptions): Promise<TFile[]> {
		const res = []
		let foundCount = 0
		const onFound = (file: TFile) => {
			foundCount++
			options?.onFound?.(file, foundCount)
		}
		for (const s of seed) {
			throwIfCancelled(options?.signal)
			const oneSeedRes: TFile[] = await this.oneSeedGo(app, s, options, onFound)
			res.push(...oneSeedRes)
		}
		return res
	}
	ruleFactory: NewRuleFactory
	constructor(rule: NewRuleFactory) {
		this.ruleFactory = rule
	}
	private async oneSeedGo(
		app: App,
		seed: TFile,
		options: TraversalProgressOptions | undefined,
		onFound: (file: TFile) => void,
	): Promise<TFile[]> {
		throwIfCancelled(options?.signal)
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
			onFound(seed)
			notesQueue.push([seed, rule])
		}
		while (notesQueue.length != 0) {
			throwIfCancelled(options?.signal)
			const [currentFile, currentRule] = notesQueue.pop() ?? [undefined, undefined]
			// console.log({currentFile, currentRule})
			if (currentFile == undefined || currentRule == undefined) continue
			const filesToLookAt: TFile[] = []
			const c = await connection.get_connected(app, currentFile)
			throwIfCancelled(options?.signal)
			filesToLookAt.push(...c)
			for (const file of filesToLookAt) {
				throwIfCancelled(options?.signal)
				if (file.extension != "md") continue
		        if (allNotes.contains(file.path)) continue
				if (await currentRule.needToGo()) {
					throwIfCancelled(options?.signal)
					notesQueue.push([file, await currentRule.go()])
					allNotes.push(file.path)
					allNotesF.push(file)
					onFound(file)
				}
			}

		}
		return allNotesF

	}
}
