import { Notice, type App, type TFile } from "obsidian";
import type { StateSnapshot } from "src/cancellation";
import type { Traversal } from "src/models/traversal";
import type { FocusMaker } from "src/service/focus_marker";
import { DeferredProgressController } from "./deferred_progress";
import { OperationCancelled } from "./operation_control";

type FocusMode = "apply" | "rollback"

type RunTraversalFocusOperationParams = {
	app: App;
	title: string;
	seed: TFile[];
	getTraversal: () => Promise<Traversal | null>;
	focusMaker: FocusMaker;
	mode: FocusMode;
}

type RunFocusOnlyOperationParams = {
	app: App;
	title: string;
	files: TFile[];
	focusMaker: FocusMaker;
	mode: FocusMode;
}

export async function runTraversalFocusOperation({
	app,
	title,
	seed,
	getTraversal,
	focusMaker,
	mode,
}: RunTraversalFocusOperationParams): Promise<StateSnapshot | null> {
	const traversal = await getTraversal()
	if (traversal == null) {
		return null
	}

	const progress = new DeferredProgressController(app, title)
	progress.start()
	progress.setTraversalFound(0)

	try {
		const derivativeNotes = await traversal.go(app, seed, {
			signal: progress,
			onFound: (_file, foundCount) => progress.setTraversalFound(foundCount),
		})
		if (progress.isCancelled()) {
			showCancelledNotice()
			return null
		}
		const result = await runFocusStage(progress, focusMaker, derivativeNotes, mode)
		showOperationNotice(progress.isCancelled(), result.updatedFiles.length)
		return result.snapshot
	} catch (error) {
		if (error instanceof OperationCancelled) {
			showCancelledNotice()
			return null
		}
		throw error
	} finally {
		progress.finish()
	}
}

export async function runFocusOnlyOperation({
	app,
	title,
	files,
	focusMaker,
	mode,
}: RunFocusOnlyOperationParams): Promise<StateSnapshot> {
	const progress = new DeferredProgressController(app, title)
	progress.start()

	try {
		const result = await runFocusStage(progress, focusMaker, files, mode)
		showOperationNotice(progress.isCancelled(), result.updatedFiles.length)
		return result.snapshot
	} finally {
		progress.finish()
	}
}

async function runFocusStage(
	progress: DeferredProgressController,
	focusMaker: FocusMaker,
	files: TFile[],
	mode: FocusMode,
) {
	progress.startFocus(files.length)
	if (mode === "apply") {
		return await focusMaker.doDependendOn(files, {
			signal: progress,
			onProcessed: (_file, processedCount, totalCount) =>
				progress.setFocusProgress(processedCount, totalCount),
		})
	}
	return await focusMaker.reverseDependendOn(files, {
		signal: progress,
		onProcessed: (_file, processedCount, totalCount) =>
			progress.setFocusProgress(processedCount, totalCount),
	})
}

function showOperationNotice(cancelled: boolean, processedCount: number): void {
	if (cancelled) {
		showCancelledNotice()
		return
	}
	new Notice(`Completed. Processed ${processedCount} files`)
}

function showCancelledNotice(): void {
	new Notice("Cancelled")
}
