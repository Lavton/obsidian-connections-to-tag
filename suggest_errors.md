# Review Errors And Warnings

Цель файла: хранить замечания так, чтобы их можно было найти даже после того, как номера строк сдвинулись. Для поиска сначала используй `rg`-якорь из пункта, а старые строки из отчета держи только как дополнительный контекст.

## Errors

### E1. Obsidian API newer than `minAppVersion`

- Status: fixed.
- Rule: `obsidianmd/no-unsupported-api`.
- Original report locations: `src/folderUtils.ts:121`, `src/folderUtils.ts:173`, `src/folderUtils.ts:193`, `src/tagsUtils.ts:142`, `src/tagsUtils.ts:168`.
- Stable locator:
  ```bash
  rg -n "processFrontMatter|minAppVersion" manifest.json versions.json src/folderUtils.ts src/tagsUtils.ts
  ```
- Cause: all reported source locations call `app.fileManager.processFrontMatter(...)`. Current Obsidian types mark this API as `@since 1.4.4`.
- Applied fix: `manifest.json` and `versions.json` now use `1.4.4` for plugin version `0.0.1`.
- Verify:
  ```bash
  rg -n '"minAppVersion": "1.4.4"|"0.0.1": "1.4.4"' manifest.json versions.json
  ```

### E2. Direct HTML headings in settings UI

- Status: fixed.
- Rule message: use `new Setting(containerEl).setName(...).setHeading()` instead of direct heading elements.
- Original report locations: `src/settings/settings.ts:87`, `src/settings/settings.ts:96`.
- Stable locator:
  ```bash
  rg -n "createEl\\(['\"]h[1-6]|setHeading\\(" src/settings/settings.ts
  ```
- Cause: settings page created `h2` elements directly.
- Applied fix: the two section headings are now created with `new Setting(section).setName(...).setHeading()`.
- Verify: the locator should show `setHeading()` and no `createEl('h2')` in `src/settings/settings.ts`.

## Warnings

### W1. Unsafe assignment of an `error` or `any` typed value

- Status: fixed.
- Rule: `@typescript-eslint/no-unsafe-assignment`.
- Original report locations: `main.ts:256`, `src/connections/connection_factory.ts:66`, `src/connections/factories/arbitrary_danger.ts:18`, `src/connections/factories/arbitrary_danger.ts:19-24`, `src/connections/factories/arbitrary_danger.ts:25`, `src/folderUtils.ts:144`, `src/folderUtils.ts:161`, `src/menuCommands.ts:209`, `src/menuCommands.ts:228`, `src/menuCommands.ts:229`, `src/menuCommands.ts:234-237`, `src/menuCommands.ts:236`, `src/menuCommands.ts:242`, `src/menuCommands.ts:243`, `src/menuCommands.ts:248`, `src/service/focus_operation.ts:126`, `src/service/focus_operation.ts:127`, `src/tagsModifier.ts:10`, `src/tagsUtils.ts:177`, `src/utils.ts:40`, `src/utils.ts:96`, `src/utils.ts:101`, `src/validation.ts:50`.
- Stable locator:
  ```bash
  rg -n "Object\\.assign|as any|: any|new AsyncFunction|frontmatter\\[|getGraphOptions|internalPlugins|getBacklinksForFile|Array\\(items\\.length\\)\\.fill|\\.bind\\(" main.ts src
  ```
- Main causes:
  - `this.loadData()` returns untyped plugin data, then goes into `Object.assign`.
  - registry descriptors are stored as `ConnectionTypeDescriptor<any>` / `RuleTypeDescriptor<any>`.
  - `new AsyncFunction(...)` returns `any`.
  - Obsidian frontmatter and internal Graph APIs expose `any`/unknown-ish data.
  - `bind(...)` on strategy methods loses the declared function type.
- Suggested fix:
  - Add small parser/normalizer for saved settings, for example `parseSettings(data: unknown): ConnectionsToTagSettings`, and use it in `loadSettings()`.
  - Replace descriptor aliases with `unknown` where possible: `ConnectionTypeDescriptor<ConnectionConfig>` / `RuleTypeDescriptor<RuleConfig>`, or isolate the unavoidable cast inside registry methods.
  - Wrap `AsyncFunction` in a typed helper that returns `(app: App, node: TFile, utils: ArbitraryDangerUtils) => Promise<unknown>`, then narrow `result` with `Array.isArray` and `instanceof TFile`.
  - Define local types for Graph internals in `menuCommands.ts` instead of `as any`.
  - Replace exported `.bind(...)` constants with typed wrapper functions that call the strategy methods.
- Applied fix:
  - Added typed settings loading from `unknown` in `main.ts`.
  - Replaced descriptor storage `any` with typed descriptor aliases plus isolated `unknown` casts in registries.
  - Typed the arbitrary async executor boundary and result as `unknown`.
  - Added local Graph/internal metadata cache types instead of `as any` and `@ts-ignore`.
  - Replaced `.bind(...)` exported operation functions with typed wrapper functions.
  - Narrowed frontmatter/YAML values through `Record<string, unknown>` helpers.
  - Replaced `Array(...).fill(...)` validation initialization with `Array.from(...)`.

### W2. `builtin-modules` should be replaced

- Status: fixed.
- Rule/source: module replacement recommendation for `builtin-modules`.
- Original report location: `package.json:19`.
- Stable locator:
  ```bash
  rg -n "builtin-modules|builtinModules|module" package.json package-lock.json esbuild.config.mjs
  ```
- Cause: `esbuild.config.mjs` imports the package only to populate `external`.
- Suggested fix:
  - In `esbuild.config.mjs`, replace `import builtins from "builtin-modules";` with Node's built-in module API:
    ```ts
    import { builtinModules } from "node:module";
    ```
  - Use `...builtinModules` in `external`.
  - Remove `builtin-modules` from `package.json` and update `package-lock.json` with `npm install` or `npm install --package-lock-only`.
- Applied fix:
  - `esbuild.config.mjs` now imports `builtinModules` from `node:module`.
  - `builtin-modules` was removed from `package.json` and `package-lock.json`.

### W3. Unexpected `any`

- Status: fixed.
- Rule: `@typescript-eslint/no-explicit-any`.
- Original report locations: `src/connections/connection_factory.ts:12`, `src/folderUtils.ts:23`, `src/folderUtils.ts:29`, `src/folderUtils.ts:58`, `src/folderUtils.ts:94`, `src/folderUtils.ts:177`, `src/link_utils.ts:37`, `src/link_utils.ts:44`, `src/menuCommands.ts:228`, `src/menuCommands.ts:241`, `src/menuCommands.ts:242`, `src/menuCommands.ts:248`, `src/rules/rule_factory.ts:13`, `src/tagsUtils.ts:73`.
- Stable locator:
  ```bash
  rg -n "\\bany\\b|catch \\(error: any\\)" src
  ```
- Cause: broad `any` is used for frontmatter, registry descriptor erasure, recursive frontmatter values, Graph internals, and catch values.
- Suggested fix:
  - Introduce shared aliases, for example:
    ```ts
    type FrontmatterValue = string | number | boolean | null | FrontmatterValue[] | { [key: string]: FrontmatterValue };
    type FrontmatterRecord = Record<string, FrontmatterValue>;
    ```
  - Use `unknown` in recursive parsing helpers and narrow with `typeof`, `Array.isArray`, and object guards.
  - Change `catch (error: any)` to `catch (error: unknown)`.
  - For plugin registries, avoid `any` in aliases or keep one local cast at the descriptor boundary with a comment.
- Applied fix:
  - Replaced registry descriptor aliases with concrete config descriptor aliases.
  - Changed frontmatter/YAML helper types from `any` to `Record<string, unknown>` / `unknown` plus guards.
  - Changed recursive frontmatter link extraction from `any` to `unknown`.
  - Replaced Graph internals `as any` with local `GraphOptions`, `GraphView`, and `AppWithInternalPlugins` types.
  - Changed `catch (error: any)` to `catch (error: unknown)`.
- Verify:
  ```bash
  rg -n "\\bany\\b|catch \\(error: any\\)" src main.ts
  ```

### W4. Unsafe return from typed code

- Status: fixed.
- Rule: `@typescript-eslint/no-unsafe-return`.
- Original report locations: `src/connections/connection_factory.ts:67`, `src/connections/connection_factory.ts:76`, `src/connections/factories/arbitrary_danger.ts:27`, `src/folderUtils.ts:64`, `src/menuCommands.ts:23-29`, `src/menuCommands.ts:31-37`, `src/menuCommands.ts:45-51`, `src/menuCommands.ts:53-59`, `src/menuCommands.ts:67-73`, `src/menuCommands.ts:80-86`, `src/menuCommands.ts:101-107`, `src/menuCommands.ts:114-120`, `src/menuCommands.ts:136-143`, `src/menuCommands.ts:159-166`, `src/menuCommands.ts:198-205`, `src/menuItems.ts:21-27`, `src/menuItems.ts:32-39`, `src/menuItems.ts:43-50`, `src/menuItems.ts:54-61`, `src/menuItems.ts:65-72`, `src/menuItems.ts:77-84`, `src/menuItems.ts:89-96`, `src/rules/rule_factory.ts:51`, `src/rules/rule_factory.ts:60`, `src/tagsModifier.ts:17`, `src/tagsModifier.ts:19`, `src/tagsUtils.ts:79`.
- Stable locator:
  ```bash
  rg -n "return await|return \\{ \\.\\.\\.baseConfig|return Array\\.from|return result;|return parseYaml|return frontmatterTagInfo2|return \\[frontmatterTagInfo2\\]" src
  ```
- Cause: functions promise typed values but return values derived from `any`, untyped descriptors, or `parseYaml`.
- Suggested fix:
  - Fix W1/W3 first; most unsafe returns disappear after inputs and intermediate values are typed.
  - Remove unnecessary `return await` in simple forwarding functions if the linter flags it through unsafe generic inference.
  - For `parseYaml`, store into `unknown`, validate object shape, then return `FrontmatterRecord | null`.
  - For `menuCommands.ts` and `menuItems.ts`, make wrapper functions return exactly the called function type and avoid returning `any` from callback helpers.
- Applied fix:
  - Removed unnecessary `return await` from proxy functions in `menuCommands.ts`, `menuItems.ts`, `tagsUtils.ts`, `folderUtils.ts`, and focus-stage helpers.
  - Added explicit `Promise<FocusResult>` return types to focus-stage helpers.
  - Changed `ConnectionRegistry.toConfig()` to return an explicitly typed `DirectionalConnectionConfig`.
  - Changed registry `all()` methods to return explicitly typed descriptor arrays.
  - Kept YAML parsing behind `unknown` plus object guards from W1/W3.
  - Returned the dynamic arbitrary-code result through an explicitly typed `TFile[]` variable after runtime narrowing.
- Verify:
  ```bash
  rg -n "return await|return \\{ \\.\\.\\.baseConfig|return parseYaml|return frontmatterTagInfo2|return \\[frontmatterTagInfo2\\]" src
  ```

### W5. Unexpected empty array pattern

- Status: fixed.
- Rule: likely `no-empty-pattern` or parser warning caused by `[] = []`.
- Original report locations: `src/connections/factories/all_in_text.ts:54`, `src/connections/factories/all_in_text.ts:55`, `src/connections/factories/all_yaml.ts:61`, `src/connections/factories/all_yaml.ts:62`, `src/connections/factories/between_in_text.ts:85`, `src/connections/factories/between_in_text.ts:86`, `src/connections/factories/just_regexp.ts:155`, `src/connections/factories/top_in_text.ts:71`, `src/connections/factories/top_in_text.ts:72`.
- Stable locator:
  ```bash
  rg -n "validate(Local|Above)Rules: \\[\\] = \\[\\]" src/connections/factories
  ```
- Cause: object properties use invalid-looking assignment syntax inside object literals, for example `validateLocalRules: [] = []`.
- Suggested fix:
  - Replace every `validateLocalRules: [] = []` with `validateLocalRules: []`.
  - Replace every `validateAboveRules: [] = []` with `validateAboveRules: []`.
- Applied fix:
  - Replaced all empty-array assignment patterns in connection descriptors with plain empty arrays.
- Verify:
  ```bash
  rg -n "validate(Local|Above)Rules: \\[\\] = \\[\\]" src/connections/factories
  ```

### W6. Unsafe member access on an `error` or `any` typed value

- Status: fixed.
- Rule: `@typescript-eslint/no-unsafe-member-access`.
- Original report locations: `src/connections/factories/arbitrary_danger.ts:18`, `src/folderUtils.ts:122`, `src/folderUtils.ts:174`, `src/folderUtils.ts:194`, `src/menuCommands.ts:217`, `src/menuCommands.ts:219`, `src/menuCommands.ts:229`, `src/menuCommands.ts:236`, `src/menuCommands.ts:238`, `src/menuCommands.ts:242`, `src/menuCommands.ts:243`, `src/menuCommands.ts:244`, `src/menuCommands.ts:248`, `src/menuCommands.ts:255`, `src/tagsUtils.ts:147`, `src/tagsUtils.ts:148`, `src/tagsUtils.ts:151`, `src/tagsUtils.ts:153`, `src/tagsUtils.ts:153`, `src/tagsUtils.ts:156`, `src/tagsUtils.ts:157`, `src/tagsUtils.ts:170`, `src/tagsUtils.ts:170`, `src/tagsUtils.ts:177`, `src/tagsUtils.ts:177`, `src/tagsUtils.ts:181`, `src/tagsUtils.ts:182`, `src/utils.ts:96`, `src/utils.ts:101`.
- Stable locator:
  ```bash
  rg -n "frontmatter\\[|fm\\.tags|graphOptions\\.search|dataEngine|internalPlugins|backlinksObj\\.keys|Object\\.getPrototypeOf\\(async" src
  ```
- Cause: member access happens after values have type `any`.
- Suggested fix:
  - Type `processFrontMatter` callback values through a local helper: mutate tags using `const tags = normalizeTags(fm.tags)` and then assign back.
  - For frontmatter key access, use `FrontmatterRecord` and narrow values before treating them as `string`.
  - For Graph internals, define:
    ```ts
    type GraphOptions = { search?: string };
    type GraphView = { dataEngine?: { options?: GraphOptions; setOptions(options: GraphOptions): void } };
    ```
  - For backlinks, cast through `unknown` and validate that `data` is a `Map` before calling `.keys()`.
- Applied fix:
  - Replaced direct dynamic frontmatter reads/writes with typed `Record<string, unknown>` helper functions.
  - Replaced direct `fm.tags` access with tag-specific helper functions in `tagsUtils.ts`.
  - Kept Graph access behind local `GraphOptions`, `GraphView`, `GraphDataEngine`, and `AppWithInternalPlugins` types.
  - Replaced backlink `.keys()` access with `Array.from(backlinksObj, ...)` after validating `data` is a `Map`.
  - Moved async function constructor discovery behind a typed constructor boundary without `Object.getPrototypeOf(async...)`.
- Verify:
  ```bash
  rg -n "\\bany\\b|as any|catch \\(error: any\\)" src main.ts
  ```
  The older broad locator may still show typed Graph internals in `menuCommands.ts`; those accesses are no longer through `any`.

### W7. Unsafe call of an `error` or `any` typed value

- Status: fixed.
- Rule: `@typescript-eslint/no-unsafe-call`.
- Original report locations: `src/connections/factories/arbitrary_danger.ts:19-24`, `src/connections/factories/arbitrary_danger.ts:25`, `src/folderUtils.ts:144`, `src/menuCommands.ts:23`, `src/menuCommands.ts:31`, `src/menuCommands.ts:45`, `src/menuCommands.ts:53`, `src/menuCommands.ts:67`, `src/menuCommands.ts:80`, `src/menuCommands.ts:101`, `src/menuCommands.ts:114`, `src/menuCommands.ts:136`, `src/menuCommands.ts:159`, `src/menuCommands.ts:198`, `src/menuCommands.ts:238`, `src/menuItems.ts:21`, `src/menuItems.ts:32`, `src/menuItems.ts:43`, `src/menuItems.ts:54`, `src/menuItems.ts:65`, `src/menuItems.ts:77`, `src/menuItems.ts:89`, `src/tagsUtils.ts:156`, `src/tagsUtils.ts:157`, `src/tagsUtils.ts:177`, `src/utils.ts:40`, `src/utils.ts:96`, `src/utils.ts:101`.
- Stable locator:
  ```bash
  rg -n "new AsyncFunction|executorFunction\\(|vault\\.exists|\\.contains\\(|setOptions\\(|run(Focus|Traversal)|\\.filter\\(|\\.push\\(" src
  ```
- Cause: calls are made on values inferred as `any`, and some code uses non-standard `contains(...)`.
- Suggested fix:
  - Replace `string.contains(...)` / `array.contains(...)` with standard `includes(...)`.
  - Remove `// @ts-ignore` around `vault.exists`; current Obsidian types include `exists(...)`.
  - Type Graph view before calling `dataEngine.setOptions(...)`.
  - Type dynamic executor from `new AsyncFunction` before calling it.
- Applied fix:
  - Replaced all non-standard `.contains(...)` calls with standard `.includes(...)`.
  - Removed the old `vault.exists(...)` call while fixing W1 by checking `getAbstractFileByPath(...)` instead.
  - Kept `dataEngine.setOptions(...)` behind local `GraphDataEngine` / `GraphView` types.
  - Kept dynamic executor calls behind the typed `ArbitraryDangerExecutor` boundary.
  - `runFocusOnlyOperation(...)` and `runTraversalFocusOperation(...)` are now typed wrapper functions from W1/W4.
- Verify:
  ```bash
  rg -n "\\.contains\\(|vault\\.exists|as any|\\bany\\b" src main.ts
  ```

### W8. Unexpected `var`, use `let` or `const`

- Status: fixed.
- Rule: likely `no-var`.
- Original report locations: `src/folderUtils.ts:144`, `src/folderUtils.ts:156`, `src/folderUtils.ts:161`, `src/folderUtils.ts:188`, `src/models/traversal.ts:37`, `src/models/traversal.ts:38`, `src/models/traversal.ts:39`, `src/tagsModifier.ts:8`, `src/tagsModifier.ts:10`, `src/tagsModifier.ts:12`, `src/tagsModifier.ts:26`, `src/tagsModifier.ts:27`, `src/tagsModifier.ts:28`, `src/tagsModifier.ts:29`, `src/tagsModifier.ts:50`, `src/tagsModifier.ts:54`, `src/tagsModifier.ts:55`, `src/tagsModifier.ts:56`, `src/tagsModifier.ts:70`, `src/tagsModifier.ts:74`, `src/tagsModifier.ts:86`, `src/tagsModifier.ts:90`, `src/tagsModifier.ts:94`, `src/tagsModifier.ts:95`, `src/tagsModifier.ts:100`, `src/tagsUtils.ts:121`, `src/tagsUtils.ts:122`, `src/tagsUtils.ts:123`, `src/tagsUtils.ts:128`, `src/utils.ts:13`, `src/utils.ts:40`, `src/utils.ts:42`, `src/utils.ts:80`.
- Stable locator:
  ```bash
  rg -n "\\bvar\\b" src
  ```
- Cause: old JavaScript style declarations.
- Suggested fix:
  - Use `const` when the binding is never reassigned.
  - Use `let` only for bindings that are reassigned.
  - Be careful with repeated `var frontmatterTagInfo2` in different branches of `tagsModifier.ts`; declare once as `const frontmatterTagInfo2 = frontmatterTagInfo?.[tag] ?? null`.
- Applied fix:
  - Replaced TypeScript `var` declarations with `const` or `let` in `folderUtils.ts`, `traversal.ts`, `tagsModifier.ts`, `tagsUtils.ts`, and `utils.ts`.
  - Removed old commented `var` examples from `tagsModifier.ts` / `utils.ts`.
  - Kept CSS `var(...)` usages in Svelte files unchanged.
- Verify:
  ```bash
  rg -n "\\bvar\\b" -g "*.ts" src
  ```

### W9. Passes unsafe values into typed parameters

- Status: fixed.
- Rule: `@typescript-eslint/no-unsafe-argument`.
- Original report location: `src/link_utils.ts:51`.
- Stable locator:
  ```bash
  rg -n "extractLinksFromFrontmatter|Object\\.values\\(value\\)\\.forEach" src/link_utils.ts src/utils.ts
  ```
- Cause: recursive `processValue(value: any)` passes `Object.values(value)` entries back into a typed function without narrowing.
- Suggested fix:
  - Change `extractLinksFromFrontmatter(frontmatter: any)` and `processValue(value: any)` to `unknown`.
  - Add an object guard before `Object.values`:
    ```ts
    if (typeof value === "object" && value !== null) {
      for (const child of Object.values(value as Record<string, unknown>)) processValue(child);
    }
    ```
- Applied fix:
  - `extractLinksFromFrontmatter(...)` and its recursive `processValue(...)` now accept `unknown`.
  - Added an `isRecord(...)` guard before object traversal.
  - Replaced the old `Object.values(value as Record<string, unknown>).forEach(...)` cast/callback pattern with guarded `for...of`.
- Verify:
  ```bash
  rg -n "frontmatter: any|value: any|Object\\.values\\(value as Record" src/link_utils.ts
  ```

### W10. Promise returned where void was expected

- Rule: likely `@typescript-eslint/no-misused-promises`.
- Original report location: `src/settings/settingsElements.ts:49-54`.
- Stable locator:
  ```bash
  rg -n "addEventListener\\(\"change\", async|await saveSettings" src/settings/settingsElements.ts
  ```
- Cause: DOM `addEventListener` expects a void-returning listener, but the callback is `async`.
- Suggested fix:
  - Keep the listener synchronous and explicitly discard the promise:
    ```ts
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      focusMakerSettings.markNoteModes = [value];
      void saveSettings();
    });
    ```
  - If errors should be visible, use `void saveSettings().catch(console.error)`.

### W11. Empty block statement

- Rule: likely `no-empty`.
- Original report locations: `src/ui_utils.ts:18-19`, `src/ui_utils.ts:36-37`.
- Stable locator:
  ```bash
  rg -n "catch \\{|\\}\\s*$" src/ui_utils.ts
  ```
- Cause: `catch {}` blocks silently ignore errors.
- Suggested fix:
  - If ignore is intentional, add a short comment inside the block.
  - Better: catch `unknown` and log a debug-level message, or remove the try/catch if the failure should surface.

### W12. Unnecessary escape character: `\^`

- Rule: likely `no-useless-escape`.
- Original report location: `src/utils.ts:4`.
- Stable locator:
  ```bash
  rg -n "\\\\\\^|regexp = " src/utils.ts
  ```
- Cause: in a regex character class, `^` does not need escaping unless it is the first character.
- Suggested fix:
  - Change:
    ```ts
    /\[\[([^|\^#]*)[\^|#]?(.*?)\]\]/
    ```
    to:
    ```ts
    /\[\[([^|^#]*)[|^#]?(.*?)\]\]/
    ```

### W13. Non-Promise values passed to promise aggregator

- Rule: likely `@typescript-eslint/await-thenable` or related promise aggregator rule.
- Original report locations: `src/validation.ts:21`, `src/validation.ts:34`.
- Stable locator:
  ```bash
  rg -n "Promise\\.all\\(all(Above|Local)\\.map" src/validation.ts
  ```
- Cause: `rule.run(...)` appears to be synchronous, so `Promise.all([...nonPromises])` is unnecessary.
- Suggested fix:
  - If validation rules are synchronous, replace both `await Promise.all(...)` blocks with direct `.map(...)`.
  - If validation rules should support async later, update `ValidationLocalRule` and `ValidationAboveRule` types so `run` returns `Issue | null | Promise<Issue | null>`.

## Recommendations

These are not listed as warnings in the source report, but they are worth fixing while cleaning the review output.

### R1. Unused imports and variables

- Original report items:
  - `EventRef` is defined but never used: `main.ts:1`.
  - `TAbstractFile` is defined but never used: `main.ts:1`.
  - `MarkNoteMode` is defined but never used: `src/cancellation.ts:1`.
  - `explain` is assigned a value but never used: `src/settings/settings.ts:80`.
  - `testDummy` is assigned a value but never used: `src/utils.ts:22`.
- Stable locator:
  ```bash
  rg -n "EventRef|TAbstractFile|MarkNoteMode|const explain|testDummy" main.ts src/cancellation.ts src/settings/settings.ts src/utils.ts
  ```
- Suggested fix:
  - Remove unused imports.
  - Replace `const explain = mount(...)` with `mount(...)` if the component instance is not unmounted.
  - Simplify `notEmpty` by deleting `testDummy`.

### R2. Unused strategy classes

- Original report items:
  - `DiskCheckedFolderAccessStrategy` is defined but never used: `src/folderUtils.ts:44`.
  - `DiskCheckedTagsAccessStrategy` is defined but never used: `src/tagsUtils.ts:59`.
- Stable locator:
  ```bash
  rg -n "DiskChecked(Folder|Tags)AccessStrategy|new Cached(Folder|Tags)AccessStrategy" src/folderUtils.ts src/tagsUtils.ts
  ```
- Suggested fix:
  - If these classes are experimental fallback code, remove them.
  - If they are needed for a setting/debug mode, wire them through an explicit config flag so they are actually used.
