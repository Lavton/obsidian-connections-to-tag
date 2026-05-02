import type { FocusMakerSettings, MarkNoteMode } from "./settings/settings";

export type HistoryDirection = "apply" | "rollback"

type HistoryElementParams = {
	current_path: string;
	previous_path: string;
}


export class HistoryElement {
	current_path: string;
	previous_path: string;

	constructor({ current_path, previous_path }: HistoryElementParams) {
		this.current_path = current_path;
		this.previous_path = previous_path;
	}
}

export class StateSnapshot {
	history: HistoryElement[];
	direction: HistoryDirection;
	settings: FocusMakerSettings;

	constructor(
        history: HistoryElement[],
		direction: HistoryDirection,
		settings: FocusMakerSettings,
    ) {
		this.history = history;
		this.direction = direction;
		this.settings = settings;
	}
}

export function createStateSnapshot(
	focusMakerSettings: FocusMakerSettings,
	currentPaths: string[],
	previousPaths: string[],
	direction: HistoryDirection,
	markNoteModes: MarkNoteMode[] | null,
): StateSnapshot {
	const history = previousPaths.map((previousPath, index) => new HistoryElement({
		current_path: currentPaths[index],
		previous_path: previousPath,
	}))
	const snapshotSettings: FocusMakerSettings = markNoteModes == null
		? focusMakerSettings
		: {
			...focusMakerSettings,
			markNoteModes,
		}

	return new StateSnapshot(history, direction, snapshotSettings)
}