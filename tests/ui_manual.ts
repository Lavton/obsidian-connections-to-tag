import type { App, TFile } from "obsidian";
import type { RuleFactory } from "src/rules/rule";
import { RuleTraversal } from "src/models/traversal";
import type { FocusMaker } from "src/service/focus_marker";

export async function applyFocusAndFindNewInitialFile(
	app: App,
	ruleFactory: RuleFactory,
	focusMaker: FocusMaker,
	initialFile: TFile
): Promise<TFile | null> {
	const initialFilePath = initialFile.path
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, [initialFile])
	const { updatedFiles } = await focusMaker.doDependendOn(derivativeNotes)
	const initialFileIndex = derivativeNotes.findIndex((file) => file === initialFile || file.path === initialFilePath)
	return initialFileIndex >= 0 ? updatedFiles[initialFileIndex] : null
}

export async function rollbackFocusAndFindNewInitialFile(
	app: App,
	ruleFactory: RuleFactory,
	focusMaker: FocusMaker,
	initialFile: TFile
): Promise<TFile | null> {
	const initialFilePath = initialFile.path
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, [initialFile])
	const { updatedFiles } = await focusMaker.reverseDependendOn(derivativeNotes)
	const initialFileIndex = derivativeNotes.findIndex((file) => file === initialFile || file.path === initialFilePath)
	return initialFileIndex >= 0 ? updatedFiles[initialFileIndex] : null
}
