import { Modal, Setting, type App, type ButtonComponent, type ProgressBarComponent } from "obsidian";

export class OperationProgressModal extends Modal {
	private readonly operationTitle: string
	private readonly onCancel: () => void
	private cancelled = false
	private closingFromOperation = false
	private stageEl: HTMLElement | null = null
	private detailEl: HTMLElement | null = null
	private foundEl: HTMLElement | null = null
	private progressWrapperEl: HTMLElement | null = null
	private progressBar: ProgressBarComponent | null = null
	private cancelButton: ButtonComponent | null = null

	constructor(app: App, operationTitle: string, onCancel: () => void) {
		super(app)
		this.operationTitle = operationTitle
		this.onCancel = onCancel
	}

	onOpen(): void {
		this.titleEl.setText(this.operationTitle)
		this.contentEl.empty()
		this.contentEl.addClass("connections-to-tag-progress-modal")

		this.stageEl = this.contentEl.createEl("div", {
			cls: "connections-to-tag-progress-stage",
			text: "Preparing...",
		})
		this.detailEl = this.contentEl.createEl("div", {
			cls: "connections-to-tag-progress-detail",
			text: "",
		})
		this.foundEl = this.contentEl.createEl("div", {
			cls: "connections-to-tag-progress-found",
			text: "Found: 0 files",
		})

		this.progressWrapperEl = this.contentEl.createDiv({
			cls: "connections-to-tag-progress-wrapper",
		})
		new Setting(this.progressWrapperEl)
			.setName("Processed")
			.addProgressBar((progress) => {
				this.progressBar = progress
				progress.setValue(0)
			})
		this.progressWrapperEl.hide()

		new Setting(this.contentEl)
			.setClass("connections-to-tag-progress-actions")
			.addButton((button) => {
				this.cancelButton = button
				button
					.setButtonText("Cancel")
					.setWarning()
					.onClick(() => this.requestCancel())
			})
	}

	onClose(): void {
		if (!this.closingFromOperation) {
			this.requestCancel()
		}
		this.contentEl.empty()
	}

	setTraversalFound(foundCount: number): void {
		this.stageEl?.setText("Finding connected notes...")
		this.detailEl?.setText("Traversal is scanning note connections.")
		this.foundEl?.setText(`Found: ${foundCount} ${this.pluralizeFile(foundCount)}`)
		this.foundEl?.show()
		this.progressWrapperEl?.hide()
	}

	startFocus(totalCount: number): void {
		this.stageEl?.setText("Applying focus changes...")
		this.foundEl?.hide()
		this.progressWrapperEl?.show()
		this.setFocusProgress(0, totalCount)
	}

	setFocusProgress(processedCount: number, totalCount: number): void {
		const percent = totalCount === 0 ? 100 : Math.round((processedCount / totalCount) * 100)
		this.detailEl?.setText(`${processedCount} of ${totalCount} ${this.pluralizeFile(totalCount)} processed.`)
		this.progressBar?.setValue(percent)
	}

	finish(): void {
		this.closingFromOperation = true
		this.close()
	}

	private requestCancel(): void {
		if (this.cancelled) {
			return
		}
		this.cancelled = true
		this.onCancel()
		this.stageEl?.setText("Cancelling...")
		this.detailEl?.setText("The current file operation will finish before the action stops.")
		this.cancelButton?.setDisabled(true)
	}

	private pluralizeFile(count: number): string {
		return count === 1 ? "file" : "files"
	}
}
