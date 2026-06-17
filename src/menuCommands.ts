import { Notice, TFile, type App } from "obsidian";
import { getAllFilesInFolder, getAllFilesWithFrontmatter, removeMetaFromFile } from "src/folderUtils";
import type { RuleFactory } from "src/rules/rule";
import { MarkNoteMode, type FocusMakerSettings } from "src/settings/settings";
import { RuleTraversal } from "src/models/traversal";
import { FocusMaker } from "src/service/focus_marker";
import { selectRuleFactory } from "src/service/rule_factory_picker";
import { getAllFilesWithTag } from "src/tagsUtils";
import type { StateSnapshot } from "src/cancellation";
import { runFocusOnlyOperation, runTraversalFocusOperation } from "./service/focus_operation";

function getCurrentFilesFromSnapshot(app: App, stateSnapshot: StateSnapshot): TFile[] {
	return stateSnapshot.history
		.map((element) => app.vault.getAbstractFileByPath(element.current_path))
		.filter((file): file is TFile => file instanceof TFile)
}

export async function snapshotRedo(app: App, stateSnapshot: StateSnapshot): Promise<StateSnapshot> {
	const focusMaker = new FocusMaker(stateSnapshot.settings, app)
	const currentFiles = getCurrentFilesFromSnapshot(app, stateSnapshot)

	if (stateSnapshot.direction === "apply") {
		return runFocusOnlyOperation({
			app,
			title: "Redo focus action",
			files: currentFiles,
			focusMaker,
			mode: "rollback",
		})
	}
	return runFocusOnlyOperation({
		app,
		title: "Redo focus action",
		files: currentFiles,
		focusMaker,
		mode: "apply",
	})
}

export async function snapshotUndo(app: App, stateSnapshot: StateSnapshot): Promise<StateSnapshot> {
	const focusMaker = new FocusMaker(stateSnapshot.settings, app)
	const currentFiles = getCurrentFilesFromSnapshot(app, stateSnapshot)

	if (stateSnapshot.direction === "apply") {
		return runFocusOnlyOperation({
			app,
			title: "Undo focus action",
			files: currentFiles,
			focusMaker,
			mode: "rollback",
		})
	}
	return runFocusOnlyOperation({
		app,
		title: "Undo focus action",
		files: currentFiles,
		focusMaker,
		mode: "apply",
	})
}


export async function removeResultTagFromVault(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithTag(app, focusMakerSettings.resultTag)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.ADD_TAG])
	return runFocusOnlyOperation({
		app,
		title: "Remove tag from vault",
		files: districtFiles,
		focusMaker,
		mode: "rollback",
	})
}

export async function moveAllFilesBackToOriginal(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesWithFrontmatter(app, focusMakerSettings.movedNameFrontmatter)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.MOVE_TO_FOLDER])
	return runFocusOnlyOperation({
		app,
		title: "Move notes back",
		files: districtFiles,
		focusMaker,
		mode: "rollback",
	})
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
	return runFocusOnlyOperation({
		app,
		title: "Move tagged notes to folder",
		files: districtFiles,
		focusMaker,
		mode: "apply",
	})
}

export async function addResultTagToResultFolder(app: App, focusMakerSettings: FocusMakerSettings): Promise<StateSnapshot> {
	const districtFiles = getAllFilesInFolder(app, focusMakerSettings.resultFolder)

	const focusMaker = new FocusMaker(focusMakerSettings, app).withMark([MarkNoteMode.ADD_TAG])
	return runFocusOnlyOperation({
		app,
		title: "Add tag to notes in folder",
		files: districtFiles,
		focusMaker,
		mode: "apply",
	})
}

export async function applyRuleChainToFile(
	app: App,
	initialFile: TFile | null | undefined,
	ruleInstances: RuleFactory[],
	focusMaker: FocusMaker,
): Promise<StateSnapshot | null> {
	if (initialFile == null) {
		return null 
	}
	const ruleFactory = await selectRuleFactory(app, ruleInstances)
	if (ruleFactory == null) {
		return null
	}
	return runTraversalFocusOperation({
		app,
		title: "Apply rule chain",
		seed: [initialFile],
		getTraversal: async () => new RuleTraversal(ruleFactory),
		focusMaker,
		mode: "apply",
	})
}

export async function rollbackRuleChainFromFile(
	app: App,
	initialFile: TFile | null | undefined,
	ruleInstances: RuleFactory[],
	focusMaker: FocusMaker,
): Promise<StateSnapshot | null> {
	if (initialFile == null) {
		return null
	}
	const ruleFactory = await selectRuleFactory(app, ruleInstances)
	if (ruleFactory == null) {
		return null
	}
	return runTraversalFocusOperation({
		app,
		title: "Rollback rule chain",
		seed: [initialFile],
		getTraversal: async () => new RuleTraversal(ruleFactory),
		focusMaker,
		mode: "rollback",
	})
}


type SearchViewWithFiles = {
	dom?: {
		getFiles?: () => TFile[];
	};
};

type GraphOptions = {
	search?: string;
}

type GraphDataEngine = {
	options?: GraphOptions;
	setOptions(options: GraphOptions): void;
}

type GraphView = {
	dataEngine?: GraphDataEngine;
}

type GraphPlugin = {
	enabled?: boolean;
	instance?: {
		options?: GraphOptions;
	};
}

type AppWithInternalPlugins = App & {
	internalPlugins?: {
		plugins?: {
			graph?: GraphPlugin;
		};
	};
}

export async function applyRuleChainToSearchResults(
	app: App,
	ruleInstances: RuleFactory[],
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
	return runTraversalFocusOperation({
		app,
		title: "Apply rule chain to search results",
		seed: searchResults,
		getTraversal: async () => new RuleTraversal(ruleFactory),
		focusMaker,
		mode: "apply",
	})
}

export async function focusGraphView(app: App, focusMakerSettings: FocusMakerSettings): Promise<void> {
	const graphOptions = getGraphOptions(app)
	if (!graphOptions) {
		new Notice("Graph view is unavailable.")
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

	const graphView = graphLeaf.view as unknown as GraphView
	const dataEngine = graphView.dataEngine
	const currentFilters = dataEngine?.options
	if (!currentFilters) {
		return
	}

	const newFilters = {
		...currentFilters,
		search: graphOptions.search
	}
	dataEngine.setOptions(newFilters)
}

export function getGraphOptions(app: App): GraphOptions | null {
	const graph = (app as AppWithInternalPlugins).internalPlugins?.plugins?.graph?.instance
	return graph?.options ?? null
}

export function checkGraphPlugin(app: App): boolean {
	const graphPlugin = (app as AppWithInternalPlugins).internalPlugins?.plugins?.graph

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
