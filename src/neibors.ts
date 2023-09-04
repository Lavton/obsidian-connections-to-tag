// app.metadataCache.getFileCache(file)
// frontmatter
// frontmatterLinks -> [{key:parents.0, link:}]

import { App, TFile } from "obsidian";
import * as utils from 'src/utils'

export async function expandToNeibors(app: App, paths: string[], numberOfExpansion: number): Promise<string[]> {
    if (numberOfExpansion <= 0) {
        return paths
    } 
    var neibors: string[][] = await Promise.all(paths.map(async p => {
        var file = app.vault.getAbstractFileByPath(p)
        if (!(file instanceof TFile)) {
            return []
        }
        var forwardLinks = app.metadataCache.getFileCache(file)?.links?.map(l => l.original)
        if (forwardLinks == undefined) {
            var neiborPaths: string[] = []
        } else {
            var neiborPaths: string[] = utils.getNotePaths(forwardLinks, p, app)
            
        }

        var backlinksObj = app.metadataCache.getBacklinksForFile(file)?.data
        if ((backlinksObj == undefined)) {
            var backlinks: string[] = []
        } else {
            var backlinks: string[] = Object.keys(backlinksObj)
        }

        return [...neiborPaths, ...backlinks]
    }))
    var flatten: string[] = neibors.reduce((accumulator, value) => accumulator.concat(value), [])
    var uniqueNeibors: string[] = [...new Set(flatten), ...paths];
    return expandToNeibors(app, uniqueNeibors, numberOfExpansion - 1)
}