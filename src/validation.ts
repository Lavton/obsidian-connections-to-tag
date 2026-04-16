import type { Issue, RowState, ScopeValidationResult, ValidationAboveRule, ValidationLocalRule } from "./settings/types";

export type ValidationConfig<T> = {
	validationCommonLocalRules: ValidationLocalRule<T>[];
	validationCommonAboveRules: ValidationAboveRule<T>[];
	getItemRules?: (item: T) => {
		local: ValidationLocalRule<T>[];
		above: ValidationAboveRule<T>[];
	};
};


async function checkAboveRules<T>(
    item: T,
    titlesAbove: string[],
    validationConfig: ValidationConfig<T>
): Promise<ScopeValidationResult> {
    const specificRules = validationConfig.getItemRules?.(item) ?? { local: [], above: [] };
    const allAbove = [...validationConfig.validationCommonAboveRules,...specificRules.above];

    const aboveResults = await Promise.all(allAbove.map((rule) => rule.run(item, titlesAbove)));
    const issues = aboveResults.filter((issue): issue is Issue => issue !== null)
    return {above:{valid: issues.length === 0, issues }, local: null};
}

async function checkItem<T>(
    item: T,
    titlesAbove: string[],
    validationConfig: ValidationConfig<T>
): Promise<ScopeValidationResult> {
    const specificRules = validationConfig.getItemRules?.(item) ?? { local: [], above: [] };
    const allLocal = [...validationConfig.validationCommonLocalRules,...specificRules.local];

    const localResults = await Promise.all(allLocal.map((rule) => rule.run(item)));
    const localIssues = localResults.filter((issue): issue is Issue => issue !== null);

    if (localIssues.length > 0) {
        return {local:{valid: false, issues: localIssues}, above: null};
    } else {
        return {...await checkAboveRules(item, titlesAbove, validationConfig), local: {valid: true, issues:[]}}
    }
}


async function checkElementsAfter<T extends { title: string }>(
    items: T[],
    changedElementIndex: number,
    validationConfig: ValidationConfig<T>
): Promise<(ScopeValidationResult)[]> {
    const results: (ScopeValidationResult)[] = Array(items.length).fill({local: null, above: null});

    for (let i = changedElementIndex+1; i < items.length; i++) {
        const item = items[i];
        const titlesAbove = items.slice(0, i).map((x) => x.title);

        results[i] = await checkAboveRules(item, titlesAbove, validationConfig);
    }

    return results;
}

export async function validateItemOnChange<T extends { title: string }>(
    storedItems: RowState<T>[],
    checkIndex: number,
    validationConfig: ValidationConfig<T>
): Promise<RowState<T>[]> {
    const titlesAbove = storedItems.slice(0, checkIndex).map((x) => x.draft.title);

    const validationThisElement: ScopeValidationResult = await checkItem(storedItems[checkIndex].draft, titlesAbove, validationConfig);
    const additionValidationAfter: ScopeValidationResult[] =await checkElementsAfter(storedItems.map((x) => x.draft), checkIndex, validationConfig);

    return storedItems.map((row, index) => {
        if (index === checkIndex) {
            return applyValidationResult(row, validationThisElement);
        }

        if (index > checkIndex) {
            return applyValidationResult(row, additionValidationAfter[index]);
        }
        return row;
    });
}

export async function validateItemsAfterIndex<T extends { title: string }>(
    storedItems: RowState<T>[],
    checkIndex: number,
    validationConfig: ValidationConfig<T>
): Promise<RowState<T>[]> {

    const additionValidationAfter: ScopeValidationResult[] =await checkElementsAfter(storedItems.map((x) => x.draft), checkIndex, validationConfig);

    return storedItems.map((row, index) => {
        if (index > checkIndex) {
            return applyValidationResult(row, additionValidationAfter[index]);
        }
        return row;
    });
}

function applyValidationResult<T extends {title: string}>(
    row: RowState<T>,
    result: ScopeValidationResult
): RowState<T> {
    let issues = [...row.meta.issues];

    if (result.local !== null) {
        const newLocalIssues = result.local.issues.map((issue) => ({...issue, scope: "local" as const,}));
        issues = [...issues.filter((i) => i.scope !== "local"), ...newLocalIssues,];
    }

    if (result.above !== null) {
        const newAboveIssues = result.above.issues.map((issue) => ({
            ...issue,
            scope: "above" as const,
        }));
        issues = [...issues.filter((i) => i.scope !== "above"), ...newAboveIssues,];
    }

    const valid = issues.length === 0;
    const nextSaved = valid
        ? JSON.parse(JSON.stringify(row.draft)) as T
        : row.saved;
    const dirty = JSON.stringify(row.draft) !== JSON.stringify(nextSaved);

    return {
        ...row,
        saved: nextSaved,
        meta: {...row.meta, issues, valid, dirty},
    };
}
