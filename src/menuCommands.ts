import { Notice, TFile, type App } from "obsidian";
import { getAllFilesInFolder, getAllFilesWithFrontmatter, removeMetaFromFile } from "src/folderUtils";
import type { NewRuleFactory } from "src/rules/new_rule";
import { MarkNoteMode, type FocusMakerSettings } from "src/settings/settings";
import { RuleTraversal } from "src/models/traversal";
import { FocusMaker } from "src/service/focus_marker";
import { selectRuleFactory } from "src/service/rule_factory_picker";
import { getAllFilesWithTag } from "src/tagsUtils";
import { StateSnapshot } from "src/cancellation";

function getCurrentFilesFromSnapshot(app: App, stateSnapshot: StateSnapshot): TFile[] {
	return stateSnapshot.history
		.map((element) => app.vault.getAbstractFileByPath(element.current_path))
		.filter((file): file is TFile => file instanceof TFile)
}

export async function snapshotRedo(app: App, stateSnapshot: StateSnapshot): Promise<void> {
	const focusMaker = new FocusMaker(stateSnapshot.settings, app)
	const currentFiles = getCurrentFilesFromSnapshot(app, stateSnapshot)

	if (stateSnapshot.direction === "apply") {
		await focusMaker.doDependendOn(currentFiles)
		return
	}
	await focusMaker.reverseDependendOn(currentFiles)
}

export async function snapshotUndo(app: App, stateSnapshot: StateSnapshot): Promise<void> {
	const focusMaker = new FocusMaker(stateSnapshot.settings, app)
	const currentFiles = getCurrentFilesFromSnapshot(app, stateSnapshot)

	if (stateSnapshot.direction === "apply") {
		await focusMaker.reverseDependendOn(currentFiles)
		return
	}
	await focusMaker.doDependendOn(currentFiles)
}


export async function removeResultTagFromVault(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithTag(app, focusMakerSettings.resultTag)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.ADD_TAG])
	const result = await focusMaker.reverseDependendOn(districtFiles)
	return result.snapshot
}

export async function moveAllFilesBackToOriginal(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithFrontmatter(app, focusMakerSettings.movedNameFrontmatter)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.MOVE_TO_FOLDER])
	const result = await focusMaker.reverseDependendOn(districtFiles)
	return result.snapshot
}

export async function removeMovedFrontmatterFromVault(app: App, focusMakerSettings: FocusMakerSettings): Promise<void> {
	const districtFiles = getAllFilesWithFrontmatter(app, focusMakerSettings.movedNameFrontmatter)

	await Promise.all(districtFiles.map((fp) =>
		removeMetaFromFile(app, fp, focusMakerSettings.movedNameFrontmatter)
	))
}

export async function moveTaggedFilesToResultFolder(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithTag(app, focusMakerSettings.resultTag)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.MOVE_TO_FOLDER])
	const result = await focusMaker.doDependendOn(districtFiles)
	return result.snapshot
}

export async function addResultTagToResultFolder(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesInFolder(app, focusMakerSettings.resultFolder)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.ADD_TAG])
	const result = await focusMaker.doDependendOn(districtFiles)
	return result.snapshot
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
	const result = await focusMaker.doDependendOn(derivativeNotes)
	return result.snapshot
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
	const result = await focusMaker.reverseDependendOn(derivativeNotes)
	return result.snapshot
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
	const result = await focusMaker.doDependendOn(derivativeNotes)
	return result.snapshot
}

export async function focusGraphView(app: App, focusMakerSettings: FocusMakerSettings): Promise<void> {
	const graphOptions = getGraphOptions(app)
	if (!graphOptions) {
		new Notice("graph view is unavaliable")
		return
	}

	const markModes = focusMakerSettings.markNoteModes
	if (markModes.includes(MarkNoteMode.ADD_TAG)) {
		graphOptions.search = `tag:${focusMakerSettings.resultTag}`
	} else if (markModes.includes(MarkNoteMode.MOVE_TO_FOLDER)) {
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
