import type { App, TFile } from "obsidian";
import { Notice } from "obsidian";
import { getAllFilesInFolder, getAllFilesWithFrontmatter, moveFileFromAndRemoveMeta, moveFileToAndAddMeta, removeMetaFromFile } from "src/folderUtils";
import type { NewRuleFactory } from "src/rules/new_rule";
import { MarkNoteMode, type FocusMakerSettings } from "src/settings/settings";
import { RuleTraversal } from "src/models/traversal";
import type { FocusMaker } from "src/service/focus_marker";
import { selectRuleFactory } from "src/service/rule_factory_picker";
import { addTagToFileIfNeeded, getAllFilesWithTag, removeTagFromFileIfNeeded } from "src/tagsUtils";
import { createStateSnapshot, HistoryElement, StateSnapshot, type HistoryDirection } from "src/cancellation";


export async function removeResultTagFromVault(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithTag(app, focusMakerSettings.resultTag)
	const previousPaths = districtFiles.map(f => f.path)

	const movedFiles = await Promise.all(districtFiles.map((fp) =>
		removeTagFromFileIfNeeded(app, fp, focusMakerSettings.resultTag)
	))

	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMakerSettings, currentPaths, previousPaths, "rollback", [MarkNoteMode.ADD_TAG])
}

export async function moveAllFilesBackToOriginal(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithFrontmatter(app, focusMakerSettings.movedNameFrontmatter)
	const previousPaths = districtFiles.map(f => f.path)

	const movedFiles = await Promise.all(districtFiles.map((fp) =>
		moveFileFromAndRemoveMeta(app, fp, focusMakerSettings.movedNameFrontmatter)
	))

	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMakerSettings, currentPaths, previousPaths, "rollback", [MarkNoteMode.MOVE_TO_FOLDER])
}

export async function removeMovedFrontmatterFromVault(app: App, focusMakerSettings: FocusMakerSettings): Promise<void> {
	const districtFiles = getAllFilesWithFrontmatter(app, focusMakerSettings.movedNameFrontmatter)

	console.log(districtFiles.length)
	await Promise.all(districtFiles.map((fp) =>
		removeMetaFromFile(app, fp, focusMakerSettings.movedNameFrontmatter)
	))
}

export async function moveTaggedFilesToResultFolder(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithTag(app, focusMakerSettings.resultTag)
	const previousPaths = districtFiles.map(f => f.path)

	const movedFiles = await Promise.all(districtFiles.map((fp) =>
		moveFileToAndAddMeta(app, fp, focusMakerSettings.resultFolder, focusMakerSettings.movedNameFrontmatter)
	))
	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMakerSettings, currentPaths, previousPaths, "apply", [MarkNoteMode.MOVE_TO_FOLDER])
}

export async function addResultTagToResultFolder(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesInFolder(app, focusMakerSettings.resultFolder)
	const previousPaths = districtFiles.map(f => f.path)

	console.log(districtFiles.length)
	const movedFiles = await Promise.all(districtFiles.map((fp) =>
		addTagToFileIfNeeded(app, fp, focusMakerSettings.resultTag)
	))
	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMakerSettings, currentPaths, previousPaths, "apply", [MarkNoteMode.ADD_TAG])
}

export async function applyRuleChainToFile(
	app: App,
	initialFile: TFile | null | undefined,
	ruleInstances: NewRuleFactory[],
	focusMaker: FocusMaker,
): Promise<StateSnapshot | null> {
	if (initialFile == null) {
		return null 
	}
	const ruleFactory = await selectRuleFactory(app, ruleInstances)
	if (ruleFactory == null) {
		return null
	}
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, [initialFile])
	const previousPaths = derivativeNotes.map(f => f.path)
	const movedFiles = await focusMaker.doDependendOn(derivativeNotes)
	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMaker.settings, currentPaths, previousPaths, "apply", null)
}

export async function rollbackRuleChainFromFile(
	app: App,
	initialFile: TFile | null | undefined,
	ruleInstances: NewRuleFactory[],
	focusMaker: FocusMaker,
): Promise<StateSnapshot | null> {
	if (initialFile == null) {
		return null
	}
	const ruleFactory = await selectRuleFactory(app, ruleInstances)
	if (ruleFactory == null) {
		return null
	}
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, [initialFile])
	const previousPaths = derivativeNotes.map(f => f.path)
	const movedFiles = await focusMaker.reverseDependendOn(derivativeNotes)
	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMaker.settings, currentPaths, previousPaths, "rollback", null)
}


type SearchViewWithFiles = {
	dom?: {
		getFiles?: () => TFile[];
	};
};

export async function applyRuleChainToSearchResults(
	app: App,
	ruleInstances: NewRuleFactory[],
	focusMaker: FocusMaker,
): Promise<StateSnapshot | null> {
	const searchView = app.workspace.getLeavesOfType('search')[0]?.view as SearchViewWithFiles | undefined

	if (!searchView?.dom?.getFiles) {
		new Notice('The core search plugin is not enabled', 5000)
		return null
	}

	const searchResults = searchView.dom.getFiles()
	if (!searchResults.length) {
		new Notice('No search results available', 5000)
		return null
	}

	const ruleFactory = await selectRuleFactory(app, ruleInstances)
	if (ruleFactory == null) {
		return null
	}
	const traversal = new RuleTraversal(ruleFactory)

	const derivativeNotes = await traversal.go(app, searchResults)
	const previousPaths = derivativeNotes.map(f => f.path)
	const movedFiles = await focusMaker.doDependendOn(derivativeNotes)
	const currentPaths = movedFiles.map(f => f.path)
	return createStateSnapshot(focusMaker.settings, currentPaths, previousPaths, "apply", null)
}

export async function focusGraphView(app: App, focusMakerSettings: FocusMakerSettings): Promise<void> {
	const graphOptions = getGraphOptions(app)
	if (!graphOptions) {
		new Notice("graph view is unavaliable")
		return
	}

	const markModes = focusMakerSettings.markNoteModes
	if (markModes.contains(MarkNoteMode.ADD_TAG)) {
		graphOptions.search = `tag:${focusMakerSettings.resultTag}`
	} else if (markModes.contains(MarkNoteMode.MOVE_TO_FOLDER)) {
		graphOptions.search = `path:${focusMakerSettings.resultFolder}`
	}
	if (!checkGraphPlugin(app)) return

	const graphLeaf = getGraphLeaf(app)
	if (!graphLeaf) {
		return
	}

	const graphView = graphLeaf.view as any
	const currentFilters = graphView.dataEngine?.options
	if (!currentFilters) {
		return
	}

	const newFilters = {
		...currentFilters,
		search: graphOptions.search
	}
	graphView.dataEngine.setOptions(newFilters)
}

export function getGraphOptions(app: App): any {
	const internal = (app as any).internalPlugins
	const graph = internal?.plugins?.graph?.instance
	return graph?.options
}

export function checkGraphPlugin(app: App): boolean {
	const graphPlugin = (app as any).internalPlugins?.plugins?.graph

	if (!graphPlugin) {
		new Notice('Core plugin "Graph" was not found')
		return false
	}

	if (!graphPlugin.enabled) {
		new Notice('Core plugin "Graph" is disabled. Enable it in the settings.')
		return false
	}

	return true
}

export function getGraphLeaf(app: App) {
	const leaves = app.workspace.getLeavesOfType('graph')
	return leaves.length > 0 ? leaves[0] : null
}
