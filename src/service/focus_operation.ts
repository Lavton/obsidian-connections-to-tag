import type { App, TFile } from "obsidian";
import type { StateSnapshot } from "src/cancellation";
import type { Traversal } from "src/models/traversal";
import type { FocusMaker } from "src/service/focus_marker";
import { OperationCancelled } from "./operation_control";
import { OperationProgressModal } from "./progress_modal";

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

	const progressModal = new OperationProgressModal(app, title)
	progressModal.open()
	progressModal.setTraversalFound(0)

	try {
		const derivativeNotes = await traversal.go(app, seed, {
			signal: progressModal,
			onFound: (_file, foundCount) => progressModal.setTraversalFound(foundCount),
		})
		if (progressModal.isCancelled()) {
			return null
		}
		const result = await runFocusStage(progressModal, focusMaker, derivativeNotes, mode)
		return result.snapshot
	} catch (error) {
		if (error instanceof OperationCancelled) {
			return null
		}
		throw error
	} finally {
		progressModal.finish()
	}
}

export async function runFocusOnlyOperation({
	app,
	title,
	files,
	focusMaker,
	mode,
}: RunFocusOnlyOperationParams): Promise<StateSnapshot> {
	const progressModal = new OperationProgressModal(app, title)
	progressModal.open()

	try {
		const result = await runFocusStage(progressModal, focusMaker, files, mode)
		return result.snapshot
	} finally {
		progressModal.finish()
	}
}

async function runFocusStage(
	progressModal: OperationProgressModal,
	focusMaker: FocusMaker,
	files: TFile[],
	mode: FocusMode,
) {
	progressModal.startFocus(files.length)
	if (mode === "apply") {
		return await focusMaker.doDependendOn(files, {
			signal: progressModal,
			onProcessed: (_file, processedCount, totalCount) =>
				progressModal.setFocusProgress(processedCount, totalCount),
		})
	}
	return await focusMaker.reverseDependendOn(files, {
		signal: progressModal,
		onProcessed: (_file, processedCount, totalCount) =>
			progressModal.setFocusProgress(processedCount, totalCount),
	})
}
