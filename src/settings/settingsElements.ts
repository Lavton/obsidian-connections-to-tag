import { Setting } from "obsidian";
import type { ComponentProps } from "svelte";
import { get, type Writable } from "svelte/store";
import type { ConnectionRegistry } from "src/connections/connection_factory";
import type { DirectionalConnectionConfig } from "src/connections/connections";
import type { RuleConfig } from "src/rules/rule";
import type { RuleRegistry } from "src/rules/rule_factory";
import type ConnectionListSettings from "./ConnectionListSettings.svelte";
import * as common_rules from "./common_validation_rules";
import type RulesListSettings from "./RulesListSettings.svelte";
import type { FocusMakerSettings } from "./settings";

type ConnectionListSettingsProps = ComponentProps<typeof ConnectionListSettings>;
type RulesListSettingsProps = ComponentProps<typeof RulesListSettings>;
type MarkNoteModeValue = FocusMakerSettings["markNoteModes"][number];

const addTagMode = "add_tag" as MarkNoteModeValue;
const moveToFolderMode = "move_to_folder" as MarkNoteModeValue;

export function createMarkNoteModesSetting(
	containerEl: HTMLElement,
	focusMakerSettings: FocusMakerSettings,
	saveSettings: () => Promise<void>,
): void {
	const currentMode = focusMakerSettings.markNoteModes.includes(moveToFolderMode)
		? moveToFolderMode
		: addTagMode;

	const setting = new Setting(containerEl)
		.setName("Apply tag / move to folder")
		.setDesc("What will be the result of applying chain? All notes will have specific tag or will be moved to specific folder?");
	setting.controlEl.addClass("connections-to-tag-radio-group");

	const radioName = "connections-to-tag-mark-note-mode";

	const addRadioOption = (value: MarkNoteModeValue, labelText: string): void => {
		const label = setting.controlEl.createEl("label", {
			cls: "connections-to-tag-radio-option",
		});
		const radio = label.createEl("input", {
			type: "radio",
			attr: {
				name: radioName,
				value,
			},
		});

		radio.checked = currentMode === value;
		radio.addEventListener("change", async () => {
			if (!radio.checked) return;

			focusMakerSettings.markNoteModes = [value];
			await saveSettings();
		});

		label.createSpan({ text: labelText });
	};

	addRadioOption(addTagMode, "Apply tag");
	addRadioOption(moveToFolderMode, "Move to folder");
}

export function createResultTagSetting(
	containerEl: HTMLElement,
	focusMakerSettings: FocusMakerSettings,
	saveSettings: () => Promise<void>,
): void {
	new Setting(containerEl)
		.setName("Result tag")
		.setDesc("What tag will be applying in case of 'apply tag'? (Use #hastag to apply it in file text and without # to apply into frontamatter tags)")
		.addText((text) => {
			text
				.setPlaceholder('ex. #to_focus_on')
				.setValue(focusMakerSettings.resultTag)
				.onChange(async (value) => {
					focusMakerSettings.resultTag = value
					await saveSettings();
				})
		})
}

export function createResultFolderSetting(
	containerEl: HTMLElement,
	focusMakerSettings: FocusMakerSettings,
	saveSettings: () => Promise<void>,
): void {
	new Setting(containerEl)
		.setName("Result folder")
		.setDesc("In what folder the notes will be moved to?")
		.addText((text) => {
			text
				.setPlaceholder('ex. focusNotes/')
				.setValue(focusMakerSettings.resultFolder)
				.onChange(async (value) => {
					focusMakerSettings.resultFolder = value
					await saveSettings();
				})
		})
}

export function createMovedNameFrontmatterSetting(
	containerEl: HTMLElement,
	focusMakerSettings: FocusMakerSettings,
	saveSettings: () => Promise<void>,
): void {
	new Setting(containerEl)
		.setName("Technical 'moved' frontmatter")
		.setDesc("Add frontmatter that will be used to store original location of the notes when it moved to folder")
		.addText((text) => {
			text
				.setPlaceholder('ex. moved_from')
				.setValue(focusMakerSettings.movedNameFrontmatter)
				.onChange(async (value) => {
					focusMakerSettings.movedNameFrontmatter = value
					await saveSettings();
				})
		})
}

export function isPublicTitle(title: string): boolean {
	return !title.startsWith("_");
}

export function getPublicConnectionTitles(items: DirectionalConnectionConfig[]): string[] {
	return items.map((connection) => connection.title).filter(isPublicTitle);
}

export function createConnectionListSettingsProps(
	concreeteConnections: DirectionalConnectionConfig[],
	onchange: (items: DirectionalConnectionConfig[]) => Promise<void>,
	registry: ConnectionRegistry,
	connectionTitles: Writable<string[]>,
): ConnectionListSettingsProps {
	return {
		concreeteConnections,
		onchange: async (items: DirectionalConnectionConfig[]) => {
			connectionTitles.set(getPublicConnectionTitles(items));
			await onchange(items);
		},
		registry,
		validationConfig: {
			validationCommonAboveRules: [
				common_rules.ruleNotEqual,
			],
			validationCommonLocalRules: [
				common_rules.ruleTitleRequired,
				common_rules.ruleTypeRequired,
				common_rules.ruleNoPlusMinusWithSpaces,
			],
			getItemRules: function (item: DirectionalConnectionConfig) {
				const descriptor = registry.get(item.type);
				if (!descriptor) return { local: [], above: [] };

				return {
					local: descriptor.validateLocalRules,
					above: descriptor.validateAboveRules,
				};
			}
		}
	};
}

export function createRulesListSettingsProps(
	concreeteRules: RuleConfig[],
	onchange: (items: RuleConfig[]) => Promise<void>,
	registry: RuleRegistry,
	connectionTitles: Writable<string[]>,
): RulesListSettingsProps {
	return {
		concreeteRules,
		onchange,
		registry,
		connectionTitles,
		validationConfig: {
			validationCommonAboveRules: [
				common_rules.ruleNotEqual,
			],
			validationCommonLocalRules: [
				common_rules.ruleTitleRequired,
				common_rules.ruleTypeRequired,
				common_rules.ruleConnectionTitleRequired,
				common_rules.ruleConnectionTitleExists(() => get(connectionTitles)),
			],
			getItemRules: function (item: RuleConfig) {
				const descriptor = registry.get(item.type);
				if (!descriptor) return { local: [], above: [] };

				return {
					local: descriptor.validateLocalRules,
					above: descriptor.validateAboveRules,
				};
			}
		}
	};
}
