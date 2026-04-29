import { TFile, type App } from "obsidian";
import { ChainStep, type Chain } from "src/models/chain";
import type { Rule } from "src/models/rule";
import type { Traversal } from "src/models/traversal";
import type { NewRule, NewRuleFactory } from "src/rules/new_rule";

export class ChainTraversal implements Traversal {
	async go(app: App, seed: TFile[]): Promise<TFile[]> {
		const result = [...seed]
		const paths = new Set(seed.map(s => s.path))
		for (const step of this.chain.chainSteps) {
			const stepTr = new StepTraversal(step);
			const stepRes = await stepTr.go(app, result)
			for (const sr of stepRes) {
				if (!paths.has(sr.path)) {
					paths.add(sr.path)
					result.push(sr)
				}
			}
		}
		return result
	}
	chain: Chain

	constructor(chain: Chain) {
		this.chain = chain
	}
}

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
				const c = await connection.get_connected(app, currentFile)
				filesToLookAt.push(...c)
				// console.log({c, connection})
				
			}
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