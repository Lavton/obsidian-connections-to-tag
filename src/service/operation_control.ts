import type { TFile } from "obsidian";

export class OperationCancelled extends Error {
	constructor() {
		super("Operation cancelled")
		this.name = "OperationCancelled"
	}
}

export interface CancellationSignal {
	isCancelled(): boolean;
}

export type TraversalProgressOptions = {
	signal?: CancellationSignal;
	onFound?: (file: TFile, foundCount: number) => void;
}

export type FocusProgressOptions = {
	signal?: CancellationSignal;
	onProcessed?: (file: TFile, processedCount: number, totalCount: number) => void;
}

export function throwIfCancelled(signal?: CancellationSignal): void {
	if (signal?.isCancelled()) {
		throw new OperationCancelled()
	}
}
