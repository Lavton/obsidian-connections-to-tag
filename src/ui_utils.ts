import type { Connection, DirectionalConnectionConfig } from "src/connections/connections";
import type { ConnectionRegistry } from "src/connections/connection_factory";
import type { RuleFactory, RuleConfig } from "src/rules/rule";
import type { RuleRegistry } from "src/rules/rule_factory";
import { MarkNoteMode, type FocusMakerSettings } from "src/settings/settings";

export function createConnectionInstances(
	connectionConfigs: DirectionalConnectionConfig[],
	connectionRegistry: ConnectionRegistry,
): Connection[] {
	const currentConnections: Connection[] = []
	for (const connectionConfig of connectionConfigs) {
		if (typeof connectionConfig.title !== "string") {
			continue
		}
		try {
			currentConnections.push(connectionRegistry.fromConfig(connectionConfig, currentConnections))
		} catch (_error: unknown) {
			// Invalid saved connection configs are skipped so the rest of the settings can load.
		}
	}
	return currentConnections
}

export function createRuleInstances(
	ruleConfigs: RuleConfig[],
	ruleRegistry: RuleRegistry,
	connections: Connection[],
): RuleFactory[] {
	const currentRules: RuleFactory[] = []
	for (const ruleConfig of ruleConfigs) {
		if (typeof ruleConfig.title !== "string") {
			continue
		}
		try {
			currentRules.push(ruleRegistry.fromConfig(ruleConfig, connections))
		} catch (_error: unknown) {
			// Invalid saved rule configs are skipped so the rest of the settings can load.
		}
	}
	return currentRules
}

export function getFocusActionNames(focusMakerSettings: FocusMakerSettings): { apply_name: string, rollback_name: string } {
	const markModes = focusMakerSettings.markNoteModes
	if (markModes.includes(MarkNoteMode.ADD_TAG) && markModes.includes(MarkNoteMode.MOVE_TO_FOLDER)) {
		return {
			apply_name: "add tag and move to folder",
			rollback_name: "remove tag and return to original folder",
		}
	}
	if (markModes.includes(MarkNoteMode.ADD_TAG)) {
		return {
			apply_name: "add tag",
			rollback_name: "remove tag",
		}
	}
	if (markModes.includes(MarkNoteMode.MOVE_TO_FOLDER)) {
		return {
			apply_name: "move to folder",
			rollback_name: "return to original folder",
		}
	}
	return {
		apply_name: "",
		rollback_name: "",
	}
}
