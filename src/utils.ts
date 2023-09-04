import { App, getLinkpath } from "obsidian"

const regexp = /\[\[([^|\^#]*)[\^|#]?(.*?)\]\]/
function linkToNoteName(link: string): string | null {
    if (!link.startsWith("[[")) {
        return null
    }
    if (!link.endsWith("]]")) {
        return null
    }
    // return getLinkpath(link.slice(2, link.length-2))
    var match = link.match(regexp)
    if (match == null) {
        return null
    }
    return match[1]
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  if (value === null || value === undefined) return false;
  const testDummy: TValue = value;
  return true;
}

export function getNotePaths(linksCandidates: string[], initfilePath: string, app: App): string[] {
    return linksCandidates
        .map(l => linkToNoteName(l))
        .filter(l => l != null)
        .map(l => {
            if (l == null) {return undefined} // can't be true...
            return app.metadataCache.getFirstLinkpathDest(l, initfilePath)?.path
        })
        .filter(value => notEmpty(value))
        .map((v): string => v as string)
}