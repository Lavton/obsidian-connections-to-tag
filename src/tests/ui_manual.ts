import type { App, TFile } from "obsidian";
import type { NewRuleFactory } from "src/rules/new_rule";
import { RuleTraversal } from "src/service/chain_traversal";
import type { FocusMaker } from "src/service/focus_marker";

export async function applyFocusAndFindNewInitialFile(
	app: App,
	ruleFactory: NewRuleFactory,
	focusMaker: FocusMaker,
	initialFile: TFile
): Promise<TFile | null> {
	const initialFilePath = initialFile.path
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, [initialFile])
	const newFiles: TFile[] = await focusMaker.doDependendOn(derivativeNotes)
	const initialFileIndex = derivativeNotes.findIndex((file) => file === initialFile || file.path === initialFilePath)
	return initialFileIndex >= 0 ? newFiles[initialFileIndex] : null
}

export async function rollbackFocusAndFindNewInitialFile(
	app: App,
	ruleFactory: NewRuleFactory,
	focusMaker: FocusMaker,
	initialFile: TFile
): Promise<TFile | null> {
	const initialFilePath = initialFile.path
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, [initialFile])
	const newFiles: TFile[] = await focusMaker.reverseDependendOn(derivativeNotes)
	const initialFileIndex = derivativeNotes.findIndex((file) => file === initialFile || file.path === initialFilePath)
	return initialFileIndex >= 0 ? newFiles[initialFileIndex] : null
}
