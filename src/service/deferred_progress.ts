import type { App } from "obsidian";
import type { CancellationSignal } from "./operation_control";
import { OperationProgressModal } from "./progress_modal";

const DEFAULT_OPEN_DELAY_MS = 1000

type ProgressState =
	| { stage: "traversal"; foundCount: number }
	| { stage: "focus"; processedCount: number; totalCount: number }

export class DeferredProgressController implements CancellationSignal {
	private readonly app: App
	private readonly title: string
	private readonly openDelayMs: number
	private modal: OperationProgressModal | null = null
	private openTimer: number | null = null
	private latestState: ProgressState | null = null
	private cancelled = false
	private finished = false

	constructor(app: App, title: string, openDelayMs = DEFAULT_OPEN_DELAY_MS) {
		this.app = app
		this.title = title
		this.openDelayMs = openDelayMs
	}

	start(): void {
		this.openTimer = window.setTimeout(() => this.openModalIfNeeded(), this.openDelayMs)
	}

	isCancelled(): boolean {
		return this.cancelled
	}

	setTraversalFound(foundCount: number): void {
		this.latestState = { stage: "traversal", foundCount }
		this.modal?.setTraversalFound(foundCount)
	}

	startFocus(totalCount: number): void {
		this.setFocusProgress(0, totalCount)
	}

	setFocusProgress(processedCount: number, totalCount: number): void {
		this.latestState = { stage: "focus", processedCount, totalCount }
		this.modal?.setFocusProgress(processedCount, totalCount)
	}

	finish(): void {
		this.finished = true
		this.clearOpenTimer()
		this.modal?.finish()
		this.modal = null
	}

	private openModalIfNeeded(): void {
		this.openTimer = null
		if (this.finished) {
			return
		}
		this.modal = new OperationProgressModal(this.app, this.title, () => this.requestCancel())
		this.modal.open()
		this.applyLatestState()
	}

	private applyLatestState(): void {
		if (this.latestState == null || this.modal == null) {
			return
		}
		if (this.latestState.stage === "traversal") {
			this.modal.setTraversalFound(this.latestState.foundCount)
			return
		}
		this.modal.startFocus(this.latestState.totalCount)
		this.modal.setFocusProgress(this.latestState.processedCount, this.latestState.totalCount)
	}

	private requestCancel(): void {
		this.cancelled = true
	}

	private clearOpenTimer(): void {
		if (this.openTimer == null) {
			return
		}
		window.clearTimeout(this.openTimer)
		this.openTimer = null
	}
}
