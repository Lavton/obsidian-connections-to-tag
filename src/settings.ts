export interface ConnectionsToTagSettings {
    workingTag: string
    parentsTag: string[],
    aroundNumber: number,
    isFirstTagParentWhenEmpty: boolean
}

export const DEFAULT_SETTINGS: ConnectionsToTagSettings = {
    workingTag: "#to_focus_on",
    parentsTag: ["parents"],
    aroundNumber: 0,
    isFirstTagParentWhenEmpty: true
}
